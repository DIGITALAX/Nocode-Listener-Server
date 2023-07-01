import express, { Request, Response } from "express";
import * as LitJsSdk from "@lit-protocol/lit-node-client";
import {
  Circuit,
  IConditionalLogic,
  Action,
  Condition,
  IExecutionConstraints,
  LitUnsignedTransaction,
  ILogEntry,
  LogCategory,
} from "lit-listener-sdk";
import { uuid } from "uuidv4";
import {
  CONTRACT_INTERFACE,
  LISTENER_DB_ADDRESS,
  LIT_ACTION_CODE,
  PKP_ADDRESS,
  PKP_PUBLIC_KEY,
} from "./constants";
import { LitAuthSig } from "./types";

const activeCircuits = new Map();
const app = express();
const port = 3000;

let authSig: LitAuthSig;
const litClient = new LitJsSdk.LitNodeClient({
  litNetwork: "serrano",
  debug: false,
});

app.use(express.json());

app.post("/start", async (req: Request, res: Response) => {
  try {
    const {
      provider,
      circuitSigner,
      contractConditions,
      contractActions,
      conditionalLogic,
      executionConstraints,
      signedTransaction,
      authSignature,
    } = req.body;

    // instantiate the new circuit
    const newCircuit = new Circuit(provider, circuitSigner);
    const instantiatorAddress = await circuitSigner.getAddress();

    // Create new circuit with ListenerDB
    const results = await addCircuitLogic(
      newCircuit,
      contractConditions,
      contractActions,
      conditionalLogic,
      executionConstraints,
      signedTransaction,
      instantiatorAddress
    );

    // Add the circuit to the activeCircuits map
    activeCircuits.set(results?.id, newCircuit);

    if (!results?.publicKey || !authSignature || !results?.id) {
      // push an error to the websocket to the front end;
      return;
    }

    // Listen in on all logs
    newCircuit.on("log", (logEntry: ILogEntry) => {
      saveLogToSubgraph(
        logEntry,
        results?.id as string,
        instantiatorAddress,
        newCircuit
      );
    });

    // Start the circuit
    const startCircuit = newCircuit.start({
      publicKey: results?.publicKey,
      ipfsCID: results?.ipfsCID,
      authSig: authSignature,
    });

    setTimeout(() => {
      res.status(200).json({
        message: `Circuit Successfully Instantiated with id ${results?.id}`,
      });
    }, 20000);

    await startCircuit;
  } catch (err: any) {
    res.json({ message: `Error instantiating Circuit: ${err.message}` });
  }
});

app.post("/interrupt", async (req: Request, res: Response) => {
  try {
    const { id, instantiatorAddress } = req.body;

    activeCircuits.delete(id);
    await interruptCircuitRunning(id, instantiatorAddress);

    res
      .status(200)
      .json({ message: `Circuit Successfully Interrupted with id ${id}` });
  } catch (err: any) {
    res.json({ message: `Error interrupting Circuit: ${err.message}` });
  }
});

app.post("/connect", async (req: Request, res: Response) => {
  try {
    const { globalAuthSignature } = req.body;
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
  executionConstraints: IExecutionConstraints,
  signedTransaction: LitUnsignedTransaction,
  instantiatorAddress: string
): Promise<
  | {
      publicKey: string;
      ipfsCID: string;
      id: string | undefined;
    }
  | undefined
> => {
  try {
    newCircuit.setConditions(contractConditions);
    const litActionCode = newCircuit.setActions(contractActions);
    newCircuit.setConditionalLogic(conditionalLogic);
    newCircuit.executionConstraints(executionConstraints);
    const ipfsCID = await newCircuit.getIPFSHash(litActionCode);
    const { publicKey, tokenId, address } = await newCircuit.mintGrantBurnPKP(
      ipfsCID
    );

    // Save the circuit configuration to the database
    const id = await saveCircuitToSubgraph(
      tokenId,
      publicKey,
      address,
      instantiatorAddress,
      {
        contractConditions,
        contractActions,
        conditionalLogic,
        executionConstraints,
      }
    );

    return { publicKey, ipfsCID, id: id?.id };
  } catch (err: any) {
    console.error(err.message);
  }
};

const saveCircuitToSubgraph = async (
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
): Promise<{ id: string; response: string } | undefined> => {
  try {
    const id = uuid();

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
    const results = await executeJS(unsignedTransactionData);

    return { id, response: results.response };
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
