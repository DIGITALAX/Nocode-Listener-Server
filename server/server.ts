import express, { NextFunction, Request, Response } from "express";
import * as LitJsSdk from "@lit-protocol/lit-node-client";
import { joinSignature } from "@ethersproject/bytes";
import { serialize } from "@ethersproject/transactions";
import cors from "cors";
import { config } from "dotenv";
import { Mutex } from "async-mutex";
import {
  Circuit,
  IConditionalLogic,
  Action,
  Condition,
  IExecutionConstraints,
  WebhookCondition,
  ContractCondition,
  LitUnsignedTransaction,
  FetchAction,
  ContractAction,
} from "lit-listener-sdk";
import { v4 as uuidv4 } from "uuid";
import {
  CONTRACT_INTERFACE,
  IPFS_AUTH,
  LISTENER_DB_ADDRESS,
  PKP_ETH_ADDRESS,
  PKP_PUBLIC_KEY,
} from "./constants";
import { LitAuthSig } from "./types";
import WebSocket from "ws";
import http from "http";
import { create } from "ipfs-http-client";
import BluebirdPromise from "bluebird";
import { ethers } from "ethers";
import { ExecuteJsResponse } from "@lit-protocol/types";

config();
const activeCircuits = new Map();
const circuitEventListeners = new Map();
const lastLogSent = new Map<string, number>();
const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });
const port = 3000;
let clientSocket: WebSocket | null = null;
let authSig: LitAuthSig;
const litClient = new LitJsSdk.LitNodeClient({
  litNetwork: "serrano",
  debug: true,
});
// Create an IPFS client instance
const client = create({
  url: "https://ipfs.infura.io:5001/api/v0",
  headers: {
    authorization: IPFS_AUTH,
  },
});
const providerDB = new ethers.providers.JsonRpcProvider(
  `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_POLYGON_KEY}`,
  137
);

interface PendingTransaction {
  txData: any;
  nonce: number;
}

class TxManager {
  pendingTransactions: PendingTransaction[];
  nonceCounter: number;
  mutex: Mutex;

  constructor() {
    this.pendingTransactions = [];
    this.nonceCounter = 0;
    this.mutex = new Mutex();
  }

  async init() {
    this.nonceCounter = await providerDB.getTransactionCount(PKP_ETH_ADDRESS);
  }

  async addPendingTransaction(txData: any) {
    const release = await this.mutex.acquire();
    try {
      this.pendingTransactions.push({
        txData,
        nonce: this.nonceCounter,
      });
      this.nonceCounter += 1;
    } finally {
      release();
    }
  }

  async removePendingTransaction(nonce: number) {
    const release = await this.mutex.acquire();
    try {
      this.pendingTransactions = this.pendingTransactions.filter(
        (tx) => tx.nonce !== nonce
      );
      if (this.pendingTransactions.length === 0) {
        this.nonceCounter = await providerDB.getTransactionCount(
          PKP_ETH_ADDRESS
        );
      }
    } finally {
      release();
    }
  }

  async handleFailedTransaction(failedTxNonce: number) {
    const release = await this.mutex.acquire();
    let updatedTransactions: PendingTransaction[] = [];
    try {
      this.pendingTransactions = this.pendingTransactions.filter(
        (tx) => tx.nonce !== failedTxNonce
      );
      this.nonceCounter =
        this.pendingTransactions.length > 0
          ? Math.max(...this.pendingTransactions.map((tx) => tx.nonce)) + 1
          : await providerDB.getTransactionCount(PKP_ETH_ADDRESS);

      for (let tx of this.pendingTransactions) {
        if (tx.nonce > failedTxNonce) {
          tx.nonce -= 1;
          const newTxData = await generateUnsignedData(
            tx.txData.functionName,
            tx.txData.args
          );
          tx.txData = newTxData;
          try {
            const success = await executeJS(newTxData, true);
            if (success) {
              updatedTransactions.push(tx);
            }
          } catch (err: any) {
            console.log(
              `Error resending transaction with nonce ${tx.nonce}: ${err.message}`
            );
          }
        } else {
          // keep transactions that had lower nonce than the failed one
          updatedTransactions.push(tx);
        }
      }
      this.pendingTransactions = updatedTransactions;
      this.nonceCounter =
        this.pendingTransactions.length > 0
          ? Math.max(...this.pendingTransactions.map((tx) => tx.nonce)) + 1
          : await providerDB.getTransactionCount(PKP_ETH_ADDRESS);
    } finally {
      release();
    }
  }
}

const txManager = new TxManager();
txManager.init();

app.use(express.json());
app.use(cors());

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

  socket.on("close", (event) => {
    console.log("WebSocket connection closed with code", "and reason", event);
    console.log("WebSocket connection closed");
    clientSocket = null;
  });
});

wss.on("open", function (event) {
  console.log("WebSocket Open: ", event);
});

app.post("/instantiate", async (req: Request, res: Response) => {
  let id: string | undefined;
  try {
    const {
      executionConstraints,
      circuitConditions,
      circuitActions,
      conditionalLogic,
      instantiatorAddress,
    }: {
      executionConstraints: IExecutionConstraints;
      circuitConditions: Condition[];
      circuitActions: Action[];
      conditionalLogic: IConditionalLogic;
      instantiatorAddress: string;
    } = req.body;

    // instantiate the new circuit
    const newCircuit = new Circuit();

    const newExecutionConstraints = {
      ...executionConstraints,
      startDate: new Date(executionConstraints.startDate as any),
      endDate: new Date(executionConstraints.endDate as any),
    };

    // get the provider url
    const providerURLsConditions = getProviderURLToChain(circuitConditions);
    const providerURLsActions = getProviderURLToChain(
      undefined,
      circuitActions
    );

    const newConditions = createConditions(
      circuitConditions,
      providerURLsConditions
    );
    const newActions = createActions(circuitActions, providerURLsActions);

    // Create new circuit with ListenerDB
    const results = await addCircuitLogic(
      newCircuit,
      newConditions,
      newActions,
      conditionalLogic,
      newExecutionConstraints
    );
    id = results?.id;

    // Add the circuit to the activeCircuits map
    activeCircuits.set(id, {
      newCircuit,
      circuitConditions: newConditions,
      circuitActions: newActions,
      conditionalLogic,
      instantiatorAddress,
      executionConstraints: newExecutionConstraints,
      unsignedTransactionData: results?.unsignedTransactionDataObject,
      ipfsHash: results?.ipfsCID,
    });

    // Send the IPFS CID back
    if (clientSocket && results?.ipfsCID) {
      clientSocket.send(
        JSON.stringify({
          ipfs: results?.ipfsCID,
          id,
        })
      );
    }

    return res.status(200).json({
      message: `Circuit Successfully Instantiated with id ${id}`,
      id,
    });
  } catch (err: any) {
    // Delete on error if it exists

    const circuitToRemove = activeCircuits.get(id);

    if (circuitToRemove) {
      circuitToRemove.newCircuit.off("log", circuitEventListeners.get(id));
      activeCircuits.delete(id);
      circuitEventListeners.delete(id);
      lastLogSent.delete(id!);
    }

    return res
      .status(500)
      .json({ message: `Error instantiating Circuit: ${err.message}` });
  }
});

app.post("/start", async (req: Request, res: Response) => {
  let idValue: string;
  try {
    const {
      id,
      instantiatorAddress,
      authSignature,
      tokenId,
      publicKey,
      address,
    }: {
      id: string;
      instantiatorAddress: `0x${string}`;
      authSignature: LitAuthSig;
      tokenId: string;
      publicKey: string;
      address: string;
    } = req.body;

    if (!activeCircuits.has(id)) {
      return res
        .status(404)
        .json({ message: `No active circuit found with id ${id}` });
    }
    idValue = id;

    // Save the circuit configuration to the database
    try {
      await saveCircuitToSubgraph(
        id,
        tokenId,
        publicKey,
        address,
        instantiatorAddress,
        activeCircuits.get(id).ipfsHash,
        {
          circuitConditions: activeCircuits.get(id).circuitConditions,
          circuitActions: activeCircuits.get(id).circuitActions,
          conditionalLogic: activeCircuits.get(id).conditionalLogic,
          executionConstraints: activeCircuits.get(id).executionConstraints,
        }
      );
    } catch (err: any) {
      console.log(err.message);
      const circuitToRemove = activeCircuits.get(idValue!);

      if (circuitToRemove) {
        circuitToRemove.newCircuit.off(
          "log",
          circuitEventListeners.get(idValue!)
        );
        activeCircuits.delete(idValue!);
        circuitEventListeners.delete(idValue!);
        lastLogSent.delete(idValue!);
      }

      return res
        .status(500)
        .json({ message: `Error starting Circuit: ${err.message}` });
    }

    const circuitEventListener = (logEntry: string) => {
      saveLogToSubgraph(
        logEntry,
        id,
        instantiatorAddress,
        activeCircuits.get(id).newCircuit
      );
    };

    activeCircuits.get(id).newCircuit.on("log", circuitEventListener);
    circuitEventListeners.set(id, circuitEventListener);

    activeCircuits.get(id).newCir;

    let startCircuitPromise = activeCircuits.get(id).newCircuit.start({
      publicKey: publicKey,
      ipfsCID: undefined,
      authSig: authSignature,
      broadcast: true,
    });

    // Convert the startCircuitPromise to a Bluebird promise
    startCircuitPromise = BluebirdPromise.resolve(startCircuitPromise);

    startCircuitPromise
      .then(() => {
        // Send Confirmation
        if (clientSocket) {
          clientSocket.send(
            JSON.stringify({
              status: "success",
              message: `Circuit with id ${id} has started successfully.`,
            })
          );
        }
      })
      .catch((error: any) => {
        // Send Confirmation
        if (clientSocket) {
          clientSocket.send(
            JSON.stringify({
              status: "error",
              message: error.message,
            })
          );
        }
      });

    await BluebirdPromise.race([
      startCircuitPromise,
      new BluebirdPromise((resolve) => setTimeout(resolve, 20000)),
    ]);

    if (startCircuitPromise.isFulfilled()) {
      return res.status(200).json({
        message: `Circuit Successfully resolved with id ${id}`,
      });
    } else if (startCircuitPromise.isRejected()) {
      return res.status(500).json({
        message: `Error Starting Circuit ${id}: ${
          startCircuitPromise.reason().message
        }`,
      });
    } else {
      return res.status(200).json({
        message: `Circuit ${id} has started running.`,
      });
    }
  } catch (err: any) {
    const circuitToRemove = activeCircuits.get(idValue!);

    if (circuitToRemove) {
      circuitToRemove.newCircuit.off(
        "log",
        circuitEventListeners.get(idValue!)
      );
      activeCircuits.delete(idValue!);
      circuitEventListeners.delete(idValue!);
      lastLogSent.delete(idValue!);
    }

    return res
      .status(500)
      .json({ message: `Error starting Circuit: ${err.message}` });
  }
});

app.post("/interrupt", async (req: Request, res: Response) => {
  try {
    const {
      id,
      instantiatorAddress,
    }: {
      id: string;
      instantiatorAddress: `0x${string}`;
    } = req.body;

    if (!activeCircuits.has(id)) {
      return res
        .status(404)
        .json({ message: `No active circuit found with id ${id}` });
    }

    const circuitToRemove = activeCircuits.get(id);

    if (circuitToRemove) {
      circuitToRemove.newCircuit.interrupt();
      circuitToRemove.newCircuit.off("log", circuitEventListeners.get(id));
      activeCircuits.delete(id);
      circuitEventListeners.delete(id);
      lastLogSent.delete(id);
    }

    const results = await interruptCircuitRunning(id, instantiatorAddress);

    return res.status(200).json({
      message: `Circuit Successfully Interrupted with id ${id}`,
      results: JSON.stringify(results),
    });
  } catch (err: any) {
    return res.json({ message: `Error interrupting Circuit: ${err.message}` });
  }
});

app.post("/connect", async (req: Request, res: Response) => {
  try {
    // if (authSig) {
    //   return res.status(200).json({ message: `Lit Client Already Connected.` });
    // }
    const { globalAuthSignature } = req.body;
    await connectLitClient();

    // set auth signature
    authSig = globalAuthSignature;

    return res.status(200).json({ message: `Lit Client Connected` });
  } catch (err: any) {
    return res.json({
      message: `Error connecting to Lit Client: ${err.message}`,
    });
  }
});

server.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

const addCircuitLogic = async (
  newCircuit: Circuit,
  contractConditions: Condition[],
  contractActions: Action[],
  conditionalLogic: IConditionalLogic,
  executionConstraints: IExecutionConstraints
): Promise<
  | {
      id: string;
      ipfsCID: string | undefined;
      unsignedTransactionDataObject: {
        [key: string]: LitUnsignedTransaction;
      };
    }
  | undefined
> => {
  try {
    const id = uuidv4();
    newCircuit.setConditions(contractConditions);
    const { unsignedTransactionDataObject, litActionCode } =
      await newCircuit.setActions(contractActions);
    newCircuit.setConditionalLogic(conditionalLogic);
    newCircuit.executionConstraints(executionConstraints);
    const ipfsCID = await ipfsUpload(litActionCode);

    return { id, ipfsCID, unsignedTransactionDataObject };
  } catch (err: any) {
    console.log(err.message);
  }
};

const saveCircuitToSubgraph = async (
  id: string,
  tokenId: string,
  pkpPublicKey: string,
  pkpAddress: string,
  instantiatorAddress: string,
  ipfs: string,
  information: {
    circuitConditions: Condition[];
    circuitActions: Action[];
    conditionalLogic: IConditionalLogic;
    executionConstraints: IExecutionConstraints;
  }
): Promise<void> => {
  try {
    const circuitInformation = {
      tokenId,
      pkpPublicKey,
      pkpAddress,
      ipfs,
      instantiatorAddress,
      id: id.replace(/-/g, ""),
      information: JSON.stringify({
        circuitConditions: JSON.stringify(information.circuitConditions),
        circuitActions: JSON.stringify(information.circuitActions),
        conditionalLogic: JSON.stringify(information.conditionalLogic),
        executionConstraints: JSON.stringify(information.executionConstraints),
      }),
    };

    const ipfsHash = await ipfsUpload(
      JSON.stringify({
        circuitInformation,
      })
    );

    const unsignedTransactionData = await generateUnsignedData(
      "addCircuitOnChain",
      [id.replace(/-/g, ""), `ipfs://${ipfsHash}`, instantiatorAddress]
    );
    await txManager.addPendingTransaction(unsignedTransactionData);
    await executeJS(unsignedTransactionData, false);
  } catch (err: any) {
    console.log(err.message);
  }
};

const saveLogToSubgraph = async (
  logEntry: string,
  id: string,
  instantiatorAddress: string,
  newCircuit: Circuit
) => {
  console.log({ logEntry });
  try {
    const logs = newCircuit.getLogs();
    let logEntryParsed: {
      message: string;
      responseObject: string;
    } = JSON.parse(logEntry);
    if (
      logEntryParsed.message.includes("Condition Not Met to Continue Circuit.")
    ) {
      const lastLogIndex = lastLogSent.get(id) || 0;
      const remainingLogs = logs
        .slice(lastLogIndex)
        .map((log) => JSON.stringify(log));
      lastLogSent.set(id, logs.length);

      const logsHashAll = await ipfsUpload(JSON.stringify(remainingLogs));
      const hashedId = await ipfsUpload(id.replace(/-/g, ""));

      const unsignedTransactionDataAllLogs = await generateUnsignedData(
        "addLogToCircuit",
        [
          instantiatorAddress,
          id.replace(/-/g, ""),
          `ipfs://${logsHashAll}`,
          `ipfs://${hashedId}`,
        ]
      );
      await txManager.addPendingTransaction(unsignedTransactionDataAllLogs);
      console.log({ unsignedTransactionDataAllLogs });

      await executeJS(unsignedTransactionDataAllLogs, false);

      const unsignedTransactionDataComplete = await generateUnsignedData(
        "completeCircuit",
        [id.replace(/-/g, ""), `ipfs://${hashedId}`, instantiatorAddress]
      );
      await txManager.addPendingTransaction(unsignedTransactionDataComplete);
      console.log({ unsignedTransactionDataComplete });
      await executeJS(unsignedTransactionDataComplete, false);
      // Delete from active circuits on complete
      const circuitToRemove = activeCircuits.get(id);

      if (circuitToRemove) {
        circuitToRemove.newCircuit.off("log", circuitEventListeners.get(id));
        activeCircuits.delete(id);
        circuitEventListeners.delete(id);
        lastLogSent.delete(id);
      }
    } else if (newCircuit.getLogs().length % 10 === 0) {
      const logsHash = await ipfsUpload(
        JSON.stringify(newCircuit.getLogs().slice(-10))
      );

      const hashedId = await ipfsUpload(id.replace(/-/g, ""));

      const unsignedTransactionData = await generateUnsignedData(
        "addLogToCircuit",
        [
          instantiatorAddress,
          id.replace(/-/g, ""),
          `ipfs://${logsHash}`,
          `ipfs://${hashedId}`,
        ]
      );
      await txManager.addPendingTransaction(unsignedTransactionData);
      console.log({ unsignedTransactionData });
      await executeJS(unsignedTransactionData, false);
      lastLogSent.set(id, logs.length);
    }
  } catch (err: any) {
    console.log(err.message);
  }
};

const interruptCircuitRunning = async (
  id: string,
  instantiatorAddress: string
) => {
  try {
    const hashedId = await ipfsUpload(id.replace(/-/g, ""));
    const unsignedTransactionData = await generateUnsignedData(
      "interruptCircuit",
      [id.replace(/-/g, ""), `ipfs://${hashedId}`, instantiatorAddress]
    );
    await txManager.addPendingTransaction(unsignedTransactionData);

    const results = await executeJS(unsignedTransactionData, false);

    return { id, response: results.response };
  } catch (err: any) {
    console.log(err.message);
  }
};

const executeJS = async (
  unsignedTransactionData: {
    to: `0x${string}`;
    nonce: number;
    chainId: number;
    gasLimit: string;
    maxFeePerGas: ethers.BigNumber;
    maxPriorityFeePerGas: ethers.BigNumber;
    from: string;
    data: string;
    value: number;
    type: number;
  },
  onFailure: boolean
): Promise<any> => {
  return new Promise((resolve, reject) => {
    litClient
      .executeJs({
        ipfsId: "QmSrk1TqfTPSiqEPyfbReZPAwfnQQw7Ai9jfPqbQQ8sndR",
        code: undefined,
        authSig,
        jsParams: {
          publicKey: PKP_PUBLIC_KEY,
          unsignedTransactionData,
        },
      })
      .then(async (results) => {
        // Broadcast the signed transaction
        await broadCastToDB(results, unsignedTransactionData);
        if (!onFailure) {
          await txManager.removePendingTransaction(
            unsignedTransactionData.nonce
          );
        } else {
          return true;
        }
        resolve({ results });
      })
      .catch((err) => {
        console.log(err.message);
        if (!onFailure) {
          txManager.handleFailedTransaction(unsignedTransactionData.nonce);
        } else {
          return false;
        }
        resolve({ results: err });
      });
  });
};

const connectLitClient = async () => {
  try {
    await litClient.connect();
  } catch (err: any) {
    console.log(err.message);
  }
};

const generateUnsignedData = async (functionName: string, args: any[]) => {
  let gasPrice: ethers.BigNumber, blockchainNonce: number;
  try {
    gasPrice = await providerDB.getGasPrice();
    blockchainNonce = txManager.nonceCounter;
  } catch (err: any) {
    console.log(err.message);
  }

  const unsignedData = {
    to: LISTENER_DB_ADDRESS,
    nonce: blockchainNonce!,
    chainId: 137,
    gasLimit: "500000",
    maxFeePerGas: gasPrice!.mul(2),
    maxPriorityFeePerGas: gasPrice!.div(2),
    from: "{{publicKey}}",
    data: CONTRACT_INTERFACE.encodeFunctionData(functionName, args),
    value: 0,
    type: 2,
  };

  return unsignedData;
};

const ipfsUpload = async (stringItem: string): Promise<string | undefined> => {
  try {
    const added = await client.add(stringItem);
    return added.path;
  } catch (err: any) {
    console.log(err.message);
  }
};

const createConditions = (
  conditions: Condition[],
  providerURLs: string[]
): Condition[] => {
  let newConditions: Condition[] = [];

  for (let i = 0; i < conditions?.length; i++) {
    if ((conditions[i] as WebhookCondition)?.baseUrl) {
      const webhookCondition = new WebhookCondition(
        (conditions[i] as WebhookCondition).baseUrl,
        (conditions[i] as WebhookCondition).endpoint,
        (conditions[i] as WebhookCondition).responsePath,
        (conditions[i] as WebhookCondition).expectedValue,
        (conditions[i] as WebhookCondition).matchOperator,
        (conditions[i] as WebhookCondition).apiKey
      );
      newConditions.push(webhookCondition);
    } else {
      const contractCondition = new ContractCondition(
        (conditions[i] as ContractCondition).contractAddress,
        (conditions[i] as ContractCondition).abi,
        (conditions[i] as ContractCondition).chainId,
        providerURLs[i],
        (conditions[i] as ContractCondition).eventName,
        (conditions[i] as ContractCondition).eventArgName,
        (conditions[i] as ContractCondition).expectedValue,
        (conditions[i] as ContractCondition).matchOperator
      );
      newConditions.push(contractCondition);
    }
  }
  return newConditions;
};

const broadCastToDB = async (
  results: ExecuteJsResponse,
  unsignedTransactionData: {
    to: `0x${string}`;
    nonce: number;
    chainId: number;
    gasLimit: string;
    maxFeePerGas: ethers.BigNumber;
    maxPriorityFeePerGas: ethers.BigNumber;
    from: string;
    data: string;
    value: number;
    type: number;
  }
): Promise<void> => {
  try {
    console.log({ results });
    const signature = results?.signatures?.addToListenerDB;
    const sig: {
      r: string;
      s: string;
      recid: number;
      signature: string;
      publicKey: string;
      dataSigned: string;
    } = signature as {
      r: string;
      s: string;
      recid: number;
      signature: string;
      publicKey: string;
      dataSigned: string;
    };

    const encodedSignature = joinSignature({
      r: "0x" + sig?.r,
      s: "0x" + sig?.s,
      recoveryParam: sig?.recid,
    });

    const serialized = serialize(unsignedTransactionData, encodedSignature);
    const transactionHash = await providerDB.sendTransaction(serialized);
    await transactionHash.wait();
  } catch (err: any) {
    console.log(err.message);
  }
};

const getProviderURLToChain = (
  circuitConditions?: Condition[],
  circuitActions?: Action[]
): string[] => {
  let providerURLs: string[] = [];
  if (circuitConditions) {
    for (let i = 0; i < circuitConditions?.length; i++) {
      if ((circuitConditions[i] as ContractCondition)?.chainId) {
        const condition = circuitConditions[i] as ContractCondition;
        providerURLs.push(providerFetch(condition?.chainId));
      }
    }
  } else if (circuitActions) {
    for (let i = 0; i < circuitActions?.length; i++) {
      if ((circuitActions[i] as ContractAction)?.chainId) {
        const action = circuitActions[i] as ContractAction;
        providerURLs.push(providerFetch(action?.chainId));
      }
    }
  }
  return providerURLs;
};

const createActions = (actions: Action[], providerURLs: string[]): Action[] => {
  let newActions: Action[] = [];
  let counter = 0;

  for (let i = 0; i < actions?.length; i++) {
    if ((actions[i] as FetchAction)?.baseUrl) {
      newActions.push(actions[i]);
    } else {
      const newAction = {
        ...actions[i],
        providerURL: providerURLs[counter],
      };
      newActions.push(newAction);
    }
    counter++;
  }
  return newActions;
};

const providerFetch = (chainId: string): string => {
  let providerURL = "";
  if (chainId === "ethereum") {
    providerURL = `https://eth-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_ETHEREUM_KEY}`;
  } else if (chainId === "polygon") {
    providerURL = `https://polygon-mainnet.g.alchemy.com/v2/${process.env.ALCHEMY_POLYGON_KEY}`;
  } else if (chainId === "mumbai") {
    providerURL = `https://polygon-mumbai.g.alchemy.com/v2/${process.env.ALCHEMY_MUMBAI_KEY}`;
  }
  return providerURL;
};

const interruptAllCircuits = async () => {
  for (let id of activeCircuits.keys()) {
    const instantiatorAddress = activeCircuits.get(id).instantiatorAddress;
    activeCircuits.get(id).newCircuit.interrupt();
    activeCircuits.get(id).newCircuit.off("log", circuitEventListeners.get(id));
    await interruptCircuitRunning(id, instantiatorAddress);
    activeCircuits.delete(id);
    circuitEventListeners.delete(id);
    lastLogSent.delete(id);
  }
};
process.on("uncaughtException", async (err) => {
  console.log("Uncaught exception", err);
  await interruptAllCircuits();
  process.exit(1);
});

process.on("unhandledRejection", async (reason, promise) => {
  console.log("Unhandled Rejection at:", promise, "reason:", reason);
  await interruptAllCircuits();
  process.exit(1);
});

process.on("SIGTERM", async () => {
  console.info("Received SIGTERM signal, shutting down gracefully");
  await interruptAllCircuits();
  process.exit(0);
});


const logVariables = async () => {
  const someVariable = "Hello, World!";
  console.log(someVariable);
}

logVariables();

const intervalInMilliseconds = 60 * 60 * 1000;

setInterval(logVariables, intervalInMilliseconds);