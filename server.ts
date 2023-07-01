import express, { Request, Response } from "express";
import {
  Circuit,
  IConditionalLogic,
  Action,
  Condition,
  IExecutionConstraints,
  LitUnsignedTransaction,
  ILogEntry,
} from "lit-listener-sdk";
import { uuid } from "uuidv4";

const activeCircuits = new Map();
const app = express();
const port = 3000;

app.use(express.json());

app.post("/start", async (req: Request, res: Response) => {
  const {
    provider,
    signer,
    contractConditions,
    contractActions,
    conditionalLogic,
    executionConstraints,
    signedTransaction,
    authSignature,
  } = req.body;

  // instantiate the new circuit
  const newCircuit = new Circuit(provider, signer);

  const results = await addCircuitLogic(
    newCircuit,
    contractConditions,
    contractActions,
    conditionalLogic,
    executionConstraints,
    signedTransaction
  );

  // Add the circuit to the activeCircuits map
  activeCircuits.set(results?.id, newCircuit);

  if (!results?.publicKey || !authSignature) {
    // push an error to the websocket to the front end;
    return;
  }

  // Listen in on all logs
  newCircuit.on("log", (logEntry: ILogEntry) => {
    saveLogToSubgraph(logEntry);
  });

  // Start the circuit
  await newCircuit.start({
    publicKey: results?.publicKey,
    ipfsCID: results?.ipfsCID,
    authSignature,
  });
});

app.get("/interrupt", async (req: Request, res: Response) => {});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

const addCircuitLogic = async (
  newCircuit: Circuit,
  contractConditions: Condition[],
  contractActions: Action[],
  conditionalLogic: IConditionalLogic,
  executionConstraints: IExecutionConstraints,
  signedTransaction: LitUnsignedTransaction
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
    const { publicKey, tokenId, address } =
      await newCircuit.mintGrantBurnPKPDatabase(ipfsCID, signedTransaction);
    // Save the circuit configuration to the database
    const id = await saveCircuitToSubgraph(
      tokenId,
      address,
      signedTransaction.from
    );

    return { publicKey, ipfsCID, id: id?.id };
  } catch (err: any) {
    console.error(err.message);
  }
};

const saveCircuitToSubgraph = async (
  tokenId: string,
  pkpAddress: string,
  signerAddress: string
): Promise<{ id: string } | undefined> => {
  try {
    const id = uuid();

    // encrypt data with lit and then call listenerdb and upload data

    return { id };
  } catch (err: any) {
    console.error(err.message);
  }
};

const saveLogToSubgraph = async (logEntry: ILogEntry) => {
  // if log entry is a critical error then call straight away otherwise batch logs in groups of 10 and sign to the contract
  try {
  } catch (err: any) {
    console.error(err.message);
  }
};
