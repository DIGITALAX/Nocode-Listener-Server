import { ethers } from "ethers";
import listenerDBABI from "./abi/ListenerDBABI.json";
import pkpABI from "./abi/PKPABI.json";
import dotenv from "dotenv";
dotenv.config();

export const LISTENER_DB_ADDRESS: `0x${string}` = `0x94adbd035e5bc2959d9279143601a3686c1c3498`;

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
  "0x04998334943893c188d8d1eea643dad70ff4e23ff951871e92e722c9eab73386e5835a3c78e2d5a1c9310e274523a2c20729316b96c0bdade6f3d5bead6d760388";

export const PKP_ETH_ADDRESS: `0x${string}` =
  "0xae415ded71ba8d23748df0f0113e2fbb8225ff10";

export const PKP_TOKEN_ID: string =
  "8374444442989637949850150452393133218265193208246628247377315071840375026605";

export const IPFS_AUTH: string =
  "Basic " +
  Buffer.from(
    process.env.INFURA_PROJECT_ID + ":" + process.env.INFURA_SECRET_KEY
  ).toString("base64");
