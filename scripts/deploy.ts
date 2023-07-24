import { ethers } from "hardhat";

const main = async () => {
  try {
    // const ListenerFactory = await ethers.getContractFactory("ListenerFactory");
    // const listenerFactory = await ListenerFactory.deploy(
    //   "ListenerFactory",
    //   "LFACT"
    // );
    const WAIT_BLOCK_CONFIRMATIONS = 20;
    // const ListenerAccessControl = await ethers.getContractFactory(
    //   "ListenerAccessControl"
    // );
    // const listenerAccessControl = await ListenerAccessControl.deploy(
    //   "ListenerAccessControl",
    //   "LACCES",
    //   "0x3D1f8A6D6584a1672d2817368783B9a2a36ae361"
    // );
    // listenerAccessControl.deployTransaction.wait(WAIT_BLOCK_CONFIRMATIONS);
    // console.log(
    //   `Listener Access Control deployed at\n${listenerAccessControl.address}`
    // );

    // listenerFactory.deployTransaction.wait(WAIT_BLOCK_CONFIRMATIONS);
    // console.log(`Listener Factory deployed at\n${listenerFactory.address}`);

    // const LitActionDB = await ethers.getContractFactory("LitActionDB");
    // const litActionDB = await LitActionDB.deploy(
    //   "LitActionDB",
    //   "LACTDB",
    //   "0x62469116e84ccd1853864a97dfac08490192ba6c"
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
    // const ListenerNFT = await ethers.getContractFactory("ListenerNFT");
    // const listenerNFT = await ListenerNFT.deploy(
    //   "0x536806528cc5a745a84f43918512123ebe2199d0",
    //   "0xA4bc96e23b9b97fb742dEE850d278254e57b2589"
    // );
    // const ListenerCollection = await ethers.getContractFactory(
    //   "ListenerCollection"
    // );
    // const listenerCollection = await ListenerCollection.deploy(
    //   listenerNFT.address,
    //   "0x536806528cc5a745a84f43918512123ebe2199d0",
    //   "0x5450D30F4898149D43DEbD171DbA9ddF40E0EB0C",
    //   "ListenerCollection",
    //   "LISTC"
    // );
    // const ListenerMarket = await ethers.getContractFactory("ListenerMarket");
    // const listenerMarket = await ListenerMarket.deploy(
    //  listenerCollection.address,
    //  "0x536806528cc5a745a84f43918512123ebe2199d0",
    //  "0xA4bc96e23b9b97fb742dEE850d278254e57b2589",
    //  "0x5450D30F4898149D43DEbD171DbA9ddF40E0EB0C",
    //  listenerNFT.address,
    //  "0x5104c0c5555C6Fd66313D895dB80a551f0A1b61A",
    //  "LISTM",
    //  "ListenerMarket"
    // );

    // listenerPayment.deployTransaction.wait(WAIT_BLOCK_CONFIRMATIONS);
    // console.log(`Listener Payment deployed at\n${listenerPayment.address}`);
    // listenerOracle.deployTransaction.wait(WAIT_BLOCK_CONFIRMATIONS);
    // console.log(`Listener Oracle deployed at\n${listenerOracle.address}`);
    // listenerFulfillment.deployTransaction.wait(WAIT_BLOCK_CONFIRMATIONS);
    // console.log(
    //   `Listener Fulfillment deployed at\n${listenerFulfillment.address}`
    // );
    // listenerNFT.deployTransaction.wait(WAIT_BLOCK_CONFIRMATIONS);
    // console.log(`Listener NFT deployed at\n${listenerNFT.address}`);
    // listenerCollection.deployTransaction.wait(WAIT_BLOCK_CONFIRMATIONS);
    // console.log(`Listener Collection deployed at\n${listenerCollection.address}`);
    // listenerMarket.deployTransaction.wait(WAIT_BLOCK_CONFIRMATIONS);
    // console.log(`Listener Market deployed at\n${listenerMarket.address}`);

    // await run(`verify:verify`, {
    //   address: "0x02Be545d0dca80D00e023f939D19cd7895d6B4a2",
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

    // await run(`verify:verify`, {
    //   address: "0x5450D30F4898149D43DEbD171DbA9ddF40E0EB0C",
    //   constructorArguments: [
    //     "0x536806528cc5a745a84f43918512123ebe2199d0",
    //     "ListenerPayment",
    //     "LISTP",
    //   ],
    // });

    // await run(`verify:verify`, {
    //   address: "0x5104c0c5555C6Fd66313D895dB80a551f0A1b61A",
    //   constructorArguments: [
    //     "0x536806528cc5a745a84f43918512123ebe2199d0",
    //     "0xce6C55cC7F35088371b22Dad73BF10491F23C002",
    //     "0x566d63F1cC7f45Bfc9B2bdC785ffcc6F858F0997",
    //     "0x984aB50e75d6FAE64cc1B4545C998409894D03e6",
    //     "0xB4b634b4A080E92675378aa67f6b6BB5816E2f95",
    //     "LISTO",
    //     "ListenerOracle",
    //   ],
    // });

    // await run(`verify:verify`, {
    //   address: "0xA4bc96e23b9b97fb742dEE850d278254e57b2589",
    //   constructorArguments: [
    //     "0x536806528cc5a745a84f43918512123ebe2199d0",
    //     "LISTF",
    //     "ListenerFulfillment",
    //   ],
    // });

    // await run(`verify:verify`, {
    //   address: "0xfff2Ad86092fF2f7a36a1B30504cbD9315Ee2009",
    //   constructorArguments: [
    //     "0x536806528cc5a745a84f43918512123ebe2199d0",
    //     "0xA4bc96e23b9b97fb742dEE850d278254e57b2589",
    //   ],
    // });

    // await run(`verify:verify`, {
    //   address: "0x4b946D61694450C239146d71E2AF5bb87a268ef4",
    //   constructorArguments: [
    //     "0xfff2Ad86092fF2f7a36a1B30504cbD9315Ee2009",
    //     "0x536806528cc5a745a84f43918512123ebe2199d0",
    //     "0x5450D30F4898149D43DEbD171DbA9ddF40E0EB0C",
    //     "ListenerCollection",
    //     "LISTC",
    //   ],
    // });

    // await run(`verify:verify`, {
    //   address: "0xe92d392E0a2bDB79863C2a900B93D5806566f775",
    //   constructorArguments: [
    //     "0x4b946D61694450C239146d71E2AF5bb87a268ef4",
    //     "0x536806528cc5a745a84f43918512123ebe2199d0",
    //     "0xA4bc96e23b9b97fb742dEE850d278254e57b2589",
    //     "0x5450D30F4898149D43DEbD171DbA9ddF40E0EB0C",
    //     "0xfff2Ad86092fF2f7a36a1B30504cbD9315Ee2009",
    //     "0x5104c0c5555C6Fd66313D895dB80a551f0A1b61A",
    //     "LISTM",
    //     "ListenerMarket",
    //   ],
    // });
    // await run(`verify:verify`, {
    //   address: "0xdaF18D056787d096670dD85372F10049e4805CF0",
    //   constructorArguments: [
    //     "ListenerAccessControl",
    //     "LACCES",
    //     "0x3D1f8A6D6584a1672d2817368783B9a2a36ae361",
    //   ],
    // });
  } catch (err: any) {
    console.error(err.message);
  }
};

main();
