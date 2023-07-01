/* 

    // server instantiates a new sdk with a function with the details passed to it 
    // it with a pkp signs the data associated with the wallet address on-chain and only the wallet address assigned can unencrypt the data of the details of the circuit

    // the circuit runs and when there is a new log generated i.e. there is a listener event or something created for each circuit it then encrypts that log and the pkp signs it on-chain to the smart contract adding it to the users log of information 

    2. the front end application then reads from the graphql database to retrieve up to date logs and information about the circuits performance. 

*/

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

  // Start the circuit
  await newCircuit.start({
    publicKey: results?.publicKey,
    ipfsCID: results?.ipfsCID,
    authSignature,
  });

  // Listen in on all logs
  newCircuit.on("log", (logEntry: ILogEntry) => {
    saveLogToSubgraph(logEntry);
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
  try {
  } catch (err: any) {
    console.error(err.message);
  }
};
