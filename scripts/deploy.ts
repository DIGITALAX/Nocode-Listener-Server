import { run } from "hardhat";

const main = async () => {
  try {
    // const ListenerFactory = await ethers.getContractFactory("ListenerFactory");
    // const listenerFactory = await ListenerFactory.deploy(
    //   "ListenerFactory",
    //   "LFACT"
    // );
    // const WAIT_BLOCK_CONFIRMATIONS = 20;
    // listenerFactory.deployTransaction.wait(WAIT_BLOCK_CONFIRMATIONS);
    // console.log(`Listener Factory deployed at\n${listenerFactory.address}`);

    await run(`verify:verify`, {
      address: "0xc1e2a333c4d1A260A134c7b2Ee05523cF5fF86ed",
      constructorArguments: ["ListenerFactory", "LFACT"],
    });
  } catch (err: any) {
    console.error(err.message);
  }
};

main();
