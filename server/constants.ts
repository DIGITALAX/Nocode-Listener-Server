import ethers from "ethers";
import listenerDBABI from "./abi/ListenerDBABI.json";
import pkpABI from "./abi/PKPABI.json";
import dotenv from "dotenv";
dotenv.config();

export const LISTENER_DB_ADDRESS: `0x${string}` = `0x`;

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
      sigName: "sig1",
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

export const PKP_ADDRESS: `0x${string}` = "0x";

export const PKP_PUBLIC_KEY: `0x04${string}` = "0x04";

export const IPFS_AUTH: string =
  "Basic " +
  Buffer.from(process.env.projectId + ":" + process.env.projectSecret).toString(
    "base64"
  );
