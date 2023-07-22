import { ethers } from "ethers";
import listenerDBABI from "./abi/ListenerDBABI.json";
import pkpABI from "./abi/PKPABI.json";
import dotenv from "dotenv";
dotenv.config();

export const LISTENER_DB_ADDRESS: `0x${string}` = `0x5a38736ef22435146fdb695f5ed805922d8f716f`;

export const PKP_MINTING_ADDRESS: `0x${string}` =
  "0x8F75a53F65e31DD0D2e40d0827becAaE2299D111";

export const LIT_ACTION_CODE = `
const hashTransaction = (tx) => {
  return ethers.utils.arrayify(
    ethers.utils.keccak256(
      ethers.utils.arrayify(ethers.utils.serializeTransaction(tx))
    )
  );
};

const go = async () => {
  try {
    await Lit.Actions.signEcdsa({
      toSign: hashTransaction(unsignedTransactionData),
      publicKey,
      sigName: "addToListenerDB",
    });
    Lit.Actions.setResponse({ response: JSON.stringify(unsignedTransactionData) });
  } catch (err) {
    console.log("Error thrown on signing ecdsa", err);
  }
};
go();
`;

export const CONTRACT_INTERFACE = new ethers.utils.Interface(
  listenerDBABI as any
);

export const CONTRACT_INTERFACE_PKP_MINT = new ethers.utils.Interface(
  pkpABI as any
);

export const PKP_PUBLIC_KEY: `0x04${string}` =
  "0x04dce6458f20b315efdf0c04c5acb83561b65949619f66d3e0060b1aeeacc8561d1a424248442bb8a41f27af56146e0f3368ce2a993bdf5cc53b87430f93546c9f";

export const PKP_ETH_ADDRESS: `0x${string}` =
  "0xE0BE6420194eACB6934d7E151bC0aA45F3c250ED";

export const PKP_TOKEN_ID: string =
  "35559075319766216805118011038090727645251441480925032049594057666563324267082";

export const IPFS_AUTH: string =
  "Basic " +
  Buffer.from(
    process.env.INFURA_PROJECT_ID + ":" + process.env.INFURA_SECRET_KEY
  ).toString("base64");
