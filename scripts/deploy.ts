import { ethers } from "hardhat";

const main = async () => {
  try {
    // const ListenerFactory = await ethers.getContractFactory("ListenerFactory");
    // const listenerFactory = await ListenerFactory.deploy(
    //   "ListenerFactory",
    //   "LFACT"
    // );
    const WAIT_BLOCK_CONFIRMATIONS = 20;
    // listenerFactory.deployTransaction.wait(WAIT_BLOCK_CONFIRMATIONS);
    // console.log(`Listener Factory deployed at\n${listenerFactory.address}`);

    // const LitActionDB = await ethers.getContractFactory("LitActionDB");
    // const litActionDB = await LitActionDB.deploy(
    //   "LitActionDB",
    //   "LACTDB",
    //   "0x536806528cc5a745a84f43918512123ebe2199d0"
    // );
    // litActionDB.deployTransaction.wait(WAIT_BLOCK_CONFIRMATIONS);
    // console.log(`Lit Action DB deployed at\n${litActionDB.address}`);

    /*******************/
    /* ONLY FOR TESTNET MUMBAI */
    /*******************/
    // const Mona = await ethers.getContractFactory("TestToken");
    // const monaAddress = await Mona.deploy();
    // const Matic = await ethers.getContractFactory("TestToken");
    // const maticAddress = await Matic.deploy();
    // const Eth = await ethers.getContractFactory("TestToken");
    // const ethAddress = await Eth.deploy();
    // const Tether = await ethers.getContractFactory("TestToken");
    // const tetherAddress = await Tether.deploy();
    // monaAddress.deployTransaction.wait(20);
    // maticAddress.deployTransaction.wait(20);
    // ethAddress.deployTransaction.wait(20);
    // tetherAddress.deployTransaction.wait(20);
    // console.log(
      // monaAddress.address,
      // maticAddress.address,
    //   ethAddress.address,
    //   tetherAddress.address
    // );
    /*******************/

    // const ListenerPayment = await ethers.getContractFactory("ListenerPayment");
    // const listenerPayment = await ListenerPayment.deploy(
    //   "0x536806528cc5a745a84f43918512123ebe2199d0",
    //   "ListenerPayment",
    //   "LISTP"
    // );
    // const ListenerOracle = await ethers.getContractFactory("ListenerOracle");
    // const listenerOracle = await ListenerOracle.deploy(
    //   "0x536806528cc5a745a84f43918512123ebe2199d0",
    //   "0xce6C55cC7F35088371b22Dad73BF10491F23C002",
    //   "0x566d63F1cC7f45Bfc9B2bdC785ffcc6F858F0997",
    //   "0x984aB50e75d6FAE64cc1B4545C998409894D03e6",
    //   "0xB4b634b4A080E92675378aa67f6b6BB5816E2f95",
    //   "LISTO",
    //   "ListenerOracle"
    // );
    // const ListenerFulfillment = await ethers.getContractFactory(
    //   "ListenerFulfillment"
    // );
    // const listenerFulfillment = await ListenerFulfillment.deploy(
    //   "0x536806528cc5a745a84f43918512123ebe2199d0",
    //   "LISTF",
    //   "ListenerFulfillment"
    // );
    const ListenerNFT = await ethers.getContractFactory("ListenerNFT");
    const listenerNFT = await ListenerNFT.deploy(
      "0x536806528cc5a745a84f43918512123ebe2199d0",
      "0xA4bc96e23b9b97fb742dEE850d278254e57b2589"
    );
    const ListenerCollection = await ethers.getContractFactory(
      "ListenerCollection"
    );
    const listenerCollection = await ListenerCollection.deploy(
      listenerNFT.address,
      "0x536806528cc5a745a84f43918512123ebe2199d0",
      "0x5450D30F4898149D43DEbD171DbA9ddF40E0EB0C",
      "ListenerCollection",
      "LISTC"
    );
    const ListenerMarket = await ethers.getContractFactory("ListenerMarket");
    const listenerMarket = await ListenerMarket.deploy(
     listenerCollection.address,
     "0x536806528cc5a745a84f43918512123ebe2199d0",
     "0xA4bc96e23b9b97fb742dEE850d278254e57b2589",
     "0x5450D30F4898149D43DEbD171DbA9ddF40E0EB0C",
     listenerNFT.address,
     "0x5104c0c5555C6Fd66313D895dB80a551f0A1b61A",
     "LISTM",
     "ListenerMarket"
    );

    // listenerPayment.deployTransaction.wait(WAIT_BLOCK_CONFIRMATIONS);
    // console.log(`Listener Payment deployed at\n${listenerPayment.address}`);
    // listenerOracle.deployTransaction.wait(WAIT_BLOCK_CONFIRMATIONS);
    // console.log(`Listener Oracle deployed at\n${listenerOracle.address}`);
    // listenerFulfillment.deployTransaction.wait(WAIT_BLOCK_CONFIRMATIONS);
    // console.log(
    //   `Listener Fulfillment deployed at\n${listenerFulfillment.address}`
    // );
    listenerNFT.deployTransaction.wait(WAIT_BLOCK_CONFIRMATIONS);
    console.log(`Listener NFT deployed at\n${listenerNFT.address}`);
    listenerCollection.deployTransaction.wait(WAIT_BLOCK_CONFIRMATIONS);
    console.log(`Listener Collection deployed at\n${listenerCollection.address}`);
    listenerMarket.deployTransaction.wait(WAIT_BLOCK_CONFIRMATIONS);
    console.log(`Listener Market deployed at\n${listenerMarket.address}`);

    // await run(`verify:verify`, {
    //   address: "0x4fB8Ad553FEcAddB5C5caaE06bc10DEc5A5BDDd4",
    //   constructorArguments: ["ListenerFactory", "LFACT"],
    // });

    // await run(`verify:verify`, {
    //   address: "0xd59474993543E947cAD20acB614e59828C36bA03",
    //   constructorArguments: [
    //     "LitActionDB",
    //     "LACTDB",
    //     "0x536806528cc5a745a84f43918512123ebe2199d0",
    //   ],
    // });
  } catch (err: any) {
    console.error(err.message);
  }
};

main();
