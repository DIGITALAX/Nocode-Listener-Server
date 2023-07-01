import ethers from "ethers";
import listenerDBABI from "./abi/ListenerDBABI.json";

export const LISTENER_DB_ADDRESS: `0x${string}` = `0x`;

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
    Lit.Actions.setResponse({ response: JSON.stringify(concatenatedResponse) });
  } catch (err) {
    console.log("Error thrown on signing ecdsa", err);
  }
};
go();
`;

export const CONTRACT_INTERFACE = new ethers.utils.Interface(
  listenerDBABI as any
);

export const PKP_ADDRESS: `0x${string}` = "0x";

export const PKP_PUBLIC_KEY: `0x04${string}` = "0x04";
