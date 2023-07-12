import express, { NextFunction, Request, Response } from "express";
import * as LitJsSdk from "@lit-protocol/lit-node-client";
import bs58 from "bs58";
import {
  Circuit,
  IConditionalLogic,
  Action,
  Condition,
  IExecutionConstraints,
  ILogEntry,
  LogCategory,
} from "lit-listener-sdk";
import { uuid } from "uuidv4";
import {
  CONTRACT_INTERFACE,
  CONTRACT_INTERFACE_PKP_MINT,
  IPFS_AUTH,
  LISTENER_DB_ADDRESS,
  LIT_ACTION_CODE,
  PKP_ADDRESS,
  PKP_MINTING_ADDRESS,
  PKP_PUBLIC_KEY,
} from "./constants";
import { LitAuthSig } from "./types";
import WebSocket from "ws";
import http from "http";
import { create } from "ipfs-http-client";

const activeCircuits = new Map();
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const port = 3000;
let clientSocket: WebSocket | null = null;
let authSig: LitAuthSig;
const litClient = new LitJsSdk.LitNodeClient({
  litNetwork: "serrano",
  debug: false,
});
// Create an IPFS client instance
const client = create({
  url: "https://ipfs.infura.io:5001/api/v0",
  headers: {
    authorization: IPFS_AUTH,
  },
});

app.use(express.json());

// Auth validation
const apiKeyValidationMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const apiKey = req.headers["x-api-key"];
  if (!apiKey || apiKey !== process.env.SERVER_API_KEY) {
    return res.status(401).json({ message: "Unauthorized" });
  }
  next();
};

app.use(apiKeyValidationMiddleware);

wss.on("connection", (socket) => {
  console.log("WebSocket connection established");

  clientSocket = socket;

  socket.on("message", (message) => {
    console.log("Received message from client:", message);
  });

  socket.on("close", () => {
    console.log("WebSocket connection closed");
    clientSocket = null;
  });
});

app.post("/instantiate", async (req: Request, res: Response) => {
  let id: string | undefined;
  try {
    const {
      provider,
      circuitSigner,
      contractConditions,
      contractActions,
      conditionalLogic,
      executionConstraints,
    } = JSON.parse(req.body);

    // instantiate the new circuit
    const newCircuit = new Circuit(provider, circuitSigner);

    // Create new circuit with ListenerDB
    const results = await addCircuitLogic(
      newCircuit,
      contractConditions,
      contractActions,
      conditionalLogic,
      executionConstraints
    );
    id = results?.id;

    // Add the circuit to the activeCircuits map
    activeCircuits.set(id, {
      newCircuit,
      contractConditions,
      contractActions,
      conditionalLogic,
      executionConstraints,
    });

    // Send the transaction data to the client for minting and burning the PKP
    if (clientSocket && results?.ipfsCID) {
      const txData = generateTransactionDataToSign(results?.ipfsCID as string);
      clientSocket.send(
        JSON.stringify({
          txData,
          ipfs: results?.ipfsCID,
          id,
        })
      );
    }

    res.status(200).json({
      message: `Circuit Successfully Instantiated with id ${id}`,
      id,
    });
  } catch (err: any) {
    // Delete on error if it exists
    if (activeCircuits.has(id)) {
      activeCircuits.delete(id);
    }
    res.json({ message: `Error instantiating Circuit: ${err.message}` });
  }
});

app.post("/start", async (req: Request, res: Response) => {
  try {
    const { id, instantiatorAddress, authSignature, signedPKPTransactionData } =
      JSON.parse(req.body);

    const { tokenId, publicKey, address } = await activeCircuits
      .get(id)
      .newCircuit.mintGrantBurnPKPDatabase(signedPKPTransactionData);

    // Save the circuit configuration to the database
    await saveCircuitToSubgraph(
      id,
      tokenId,
      publicKey,
      address,
      instantiatorAddress,
      {
        contractConditions: activeCircuits.get(id).contractConditions,
        contractActions: activeCircuits.get(id).contractActions,
        conditionalLogic: activeCircuits.get(id).conditionalLogic,
        executionConstraints: activeCircuits.get(id).executionConstraints,
      }
    );

    // Listen in on all logs
    activeCircuits.get(id).newCircuit.on("log", (logEntry: ILogEntry) => {
      saveLogToSubgraph(
        logEntry,
        id,
        instantiatorAddress,
        activeCircuits.get(id).newCircuit
      );
    });

    // Start the circuit
    const startCircuit = activeCircuits.get(id).newCircuit.start({
      publicKey: publicKey,
      authSig: authSignature,
    });

    setTimeout(() => {
      res.status(200).json({
        message: `Circuit Successfully Started with id ${id}`,
      });
    }, 20000);

    await startCircuit;
  } catch (err: any) {
    res.json({ message: `Error Starting Circuit: ${err.message}` });
  }
});

app.post("/interrupt", async (req: Request, res: Response) => {
  try {
    const { id, instantiatorAddress } = JSON.parse(req.body);

    activeCircuits.delete(id);
    const results = await interruptCircuitRunning(id, instantiatorAddress);

    res.status(200).json({
      message: `Circuit Successfully Interrupted with id ${id}`,
      results: JSON.stringify(results),
    });
  } catch (err: any) {
    res.json({ message: `Error interrupting Circuit: ${err.message}` });
  }
});

app.post("/connect", async (req: Request, res: Response) => {
  try {
    const { globalAuthSignature } = JSON.parse(req.body);
    await connectLitClient();

    // set auth signature
    authSig = globalAuthSignature;

    res.status(200).json({ message: `Lit Client Connected` });
  } catch (err: any) {
    res.json({ message: `Error connecting to Lit Client: ${err.message}` });
  }
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

const addCircuitLogic = async (
  newCircuit: Circuit,
  contractConditions: Condition[],
  contractActions: Action[],
  conditionalLogic: IConditionalLogic,
  executionConstraints: IExecutionConstraints
): Promise<{ id: string; ipfsCID: string | undefined } | undefined> => {
  try {
    const id = uuid();
    newCircuit.setConditions(contractConditions);
    const litActionCode = newCircuit.setActions(contractActions);
    newCircuit.setConditionalLogic(conditionalLogic);
    newCircuit.executionConstraints(executionConstraints);

    const ipfsCID = await ipfsUpload(litActionCode);

    return { id, ipfsCID };
  } catch (err: any) {
    console.error(err.message);
  }
};

const saveCircuitToSubgraph = async (
  id: string,
  tokenId: string,
  pkpPublicKey: string,
  pkpAddress: string,
  instantiatorAddress: string,
  information: {
    contractConditions: Condition[];
    contractActions: Action[];
    conditionalLogic: IConditionalLogic;
    executionConstraints: IExecutionConstraints;
  }
): Promise<void> => {
  try {
    const circuitInformation = {
      tokenId,
      pkpPublicKey,
      pkpAddress,
      instantiatorAddress,
      information,
    };
    const unsignedTransactionData = generateUnsignedData("addCircuitOnChain", [
      id,
      circuitInformation,
      instantiatorAddress,
    ]);
    await executeJS(unsignedTransactionData);
  } catch (err: any) {
    console.error(err.message);
  }
};

const saveLogToSubgraph = async (
  logEntry: ILogEntry,
  id: string,
  instantiatorAddress: string,
  newCircuit: Circuit
) => {
  try {
    if (
      logEntry.category === LogCategory.ERROR ||
      (logEntry.category === LogCategory.CONDITION &&
        logEntry.message.includes(
          "Execution Condition Not Met to Continue Circuit."
        ))
    ) {
      const unsignedTransactionData = generateUnsignedData("addLogToCircuit", [
        instantiatorAddress,
        id,
        [JSON.stringify(logEntry)],
      ]);
      await executeJS(unsignedTransactionData);

      if (
        logEntry.category === LogCategory.CONDITION &&
        logEntry.message.includes(
          "Execution Condition Not Met to Continue Circuit."
        )
      ) {
        const unsignedTransactionDataComplete = generateUnsignedData(
          "completeCircuit",
          [instantiatorAddress, id]
        );
        await executeJS(unsignedTransactionDataComplete);

        // Delete from active circuits on complete
        activeCircuits.delete(id);
      }
    } else if (newCircuit.getLogs().length % 10 === 0) {
      const unsignedTransactionData = generateUnsignedData("addLogToCircuit", [
        instantiatorAddress,
        id,
        newCircuit
          .getLogs()
          .slice(-10)
          .map((log) => JSON.stringify(log)),
      ]);
      await executeJS(unsignedTransactionData);
    }
  } catch (err: any) {
    console.error(err.message);
  }
};

const interruptCircuitRunning = async (
  id: string,
  instantiatorAddress: string
) => {
  try {
    const unsignedTransactionData = generateUnsignedData("interruptCircuit", [
      id,
      instantiatorAddress,
    ]);

    const results = await executeJS(unsignedTransactionData);

    return { id, response: results.response };
  } catch (err: any) {
    console.error(err.message);
  }
};

const executeJS = async (unsignedTransactionData: {
  to: `0x${string}`;
  nonce: number;
  chainId: number;
  gasLimit: string;
  gasPrice: undefined;
  maxFeePerGas: undefined;
  maxPriorityFeePerGas: undefined;
  from: string;
  data: string;
  value: number;
  type: number;
}): Promise<any> => {
  try {
    const results = await litClient.executeJs({
      ipfsId: undefined,
      code: LIT_ACTION_CODE,
      authSig,
      jsParams: {
        pkpAddress: PKP_ADDRESS,
        publicKey: PKP_PUBLIC_KEY,
        unsignedTransactionData,
      },
    });
    return { results };
  } catch (err: any) {
    console.error(err.message);
  }
};

const connectLitClient = async () => {
  try {
    await litClient.connect();
  } catch (err: any) {
    console.error(err.message);
  }
};

const generateUnsignedData = (functionName: string, args: any[]) => {
  return {
    to: LISTENER_DB_ADDRESS,
    nonce: 0,
    chainId: 137,
    gasLimit: "50000",
    gasPrice: undefined,
    maxFeePerGas: undefined,
    maxPriorityFeePerGas: undefined,
    from: "{{publicKey}}",
    data: CONTRACT_INTERFACE.encodeFunctionData(functionName, args),
    value: 0,
    type: 2,
  };
};

const generateTransactionDataToSign = (ipfsCID: string) => {
  return {
    to: PKP_MINTING_ADDRESS,
    nonce: 0,
    chainId: 137,
    gasLimit: "50000",
    gasPrice: undefined,
    maxFeePerGas: undefined,
    maxPriorityFeePerGas: undefined,
    data: CONTRACT_INTERFACE_PKP_MINT.encodeFunctionData(
      "mintGrantAndBurnNext",
      [2, getBytesFromMultihash(ipfsCID), { value: "1" }]
    ),
    value: 0,
    type: 2,
  };
};

const getBytesFromMultihash = (multihash: string): string => {
  const decoded = bs58.decode(multihash);
  return `0x${Buffer.from(decoded).toString("hex")}`;
};

const ipfsUpload = async (
  litActionCode: string
): Promise<string | undefined> => {
  try {
    const added = await client.add(litActionCode);
    return added.path;
  } catch (err: any) {
    console.error(err.message);
  }
};
