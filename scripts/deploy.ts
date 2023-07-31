import { run } from "hardhat";

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
    //   "0x62469116e84ccd1853864a97dfac08490192ba6c",
    //   "ListenerPayment",
    //   "LISTP"
    // );
    // const ListenerOracle = await ethers.getContractFactory("ListenerOracle");
    // const listenerOracle = await ListenerOracle.deploy(
    //   "0x62469116e84ccd1853864a97dfac08490192ba6c",
    //   "0x6968105460f67c3bf751be7c15f92f5286fd0ce5",
    //   "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
    //   "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
    //   "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
    //   "LISTO",
    //   "ListenerOracle"
    // );
    // const ListenerFulfillment = await ethers.getContractFactory(
    //   "ListenerFulfillment"
    // );
    // const listenerFulfillment = await ListenerFulfillment.deploy(
    //   "0x62469116e84ccd1853864a97dfac08490192ba6c",
    //   "LISTF",
    //   "ListenerFulfillment"
    // );
    // const ListenerNFT = await ethers.getContractFactory("ListenerNFT");
    // const listenerNFT = await ListenerNFT.deploy(
    //   "0x62469116e84ccd1853864a97dfac08490192ba6c",
    //   "0x5EEa8a033aC23926c8674d1a89b855C80767f6bd"
    // );
    // const ListenerCollection = await ethers.getContractFactory(
    //   "ListenerCollection"
    // );
    // const listenerCollection = await ListenerCollection.deploy(
    //   listenerNFT.address,
    //   "0x62469116e84ccd1853864a97dfac08490192ba6c",
    //   "0xEc93F36B780cA96C229cf89004e89ebA41C12A65",
    //   "ListenerCollection",
    //   "LISTC"
    // );
    // const ListenerMarket = await ethers.getContractFactory("ListenerMarket");
    // const listenerMarket = await ListenerMarket.deploy(
    //   listenerCollection.address,
    //   "0x62469116e84ccd1853864a97dfac08490192ba6c",
    //   "0x5EEa8a033aC23926c8674d1a89b855C80767f6bd",
    //   "0xEc93F36B780cA96C229cf89004e89ebA41C12A65",
    //   listenerNFT.address,
    //   "0x0e92989B083b2eA0328EbA2db5c9ad3819e64794",
    //   "LISTM",
    //   "ListenerMarket"
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
    //   address: "0x1C4C9cfa19733F27902A361492Ed9a7841AFC247",
    //   constructorArguments: [
    //     "LitActionDB",
    //     "LACTDB",
    //     "0x62469116e84ccd1853864a97dfac08490192ba6c",
    //   ],
    // });

    // await run(`verify:verify`, {
    //   address: "0xEc93F36B780cA96C229cf89004e89ebA41C12A65",
    //   constructorArguments: [
    //     "0x62469116e84ccd1853864a97dfac08490192ba6c",
    //     "ListenerPayment",
    //     "LISTP",
    //   ],
    // });

    // await run(`verify:verify`, {
    //   address: "0x0e92989B083b2eA0328EbA2db5c9ad3819e64794",
    //   constructorArguments: [
    //     "0x62469116e84ccd1853864a97dfac08490192ba6c",
    //     "0x6968105460f67c3bf751be7c15f92f5286fd0ce5",
    //     "0x7ceb23fd6bc0add59e62ac25578270cff1b9f619",
    //     "0x0d500b1d8e8ef31e21c99d1db9a6444d3adf1270",
    //     "0xc2132d05d31c914a87c6611c10748aeb04b58e8f",
    //     "LISTO",
    //     "ListenerOracle",
    //   ],
    // });

    // await run(`verify:verify`, {
    //   address: "0x5EEa8a033aC23926c8674d1a89b855C80767f6bd",
    //   constructorArguments: [
    //     "0x62469116e84ccd1853864a97dfac08490192ba6c",
    //     "LISTF",
    //     "ListenerFulfillment",
    //   ],
    // });

    await run(`verify:verify`, {
      address: "0x86d1cee7dc74d65d70ad33ede56c26d7507dc079",
      constructorArguments: [
        "0x62469116e84ccd1853864a97dfac08490192ba6c",
        "0x5EEa8a033aC23926c8674d1a89b855C80767f6bd",
      ],
    });

    await run(`verify:verify`, {
      address: "0x132D5582905Ff2a0196796C967837e12E81a068C",
      constructorArguments: [
        "0x86d1cEe7dC74d65D70Ad33Ede56c26D7507DC079",
        "0x62469116e84ccd1853864a97dfac08490192ba6c",
        "0xEc93F36B780cA96C229cf89004e89ebA41C12A65",
        "ListenerCollection",
        "LISTC",
      ],
    });

    await run(`verify:verify`, {
      address: "0x9300De7b8e1b4Cf443896d596853a34CcAe48f88",
      constructorArguments: [
        "0x132D5582905Ff2a0196796C967837e12E81a068C",
        "0x62469116e84ccd1853864a97dfac08490192ba6c",
        "0x5EEa8a033aC23926c8674d1a89b855C80767f6bd",
        "0xEc93F36B780cA96C229cf89004e89ebA41C12A65",
        "0x86d1cEe7dC74d65D70Ad33Ede56c26D7507DC079",
        "0x0e92989B083b2eA0328EbA2db5c9ad3819e64794",
        "LISTM",
        "ListenerMarket",
      ],
    });
    // await run(`verify:verify`, {
    //   address: "0x62469116e84ccd1853864a97dfac08490192ba6c",
    //   constructorArguments: [
    //     "ListenerAccessControl",
    //     "LAC",
    //     "0xfa3fea500eeDAa120f7EeC2E4309Fe094F854E61",
    //   ],
    // });

    // await run(`verify:verify`, {
    //   address: "0x94adbd035e5bc2959d9279143601a3686c1c3498",
    //   constructorArguments: [
    //     "ListenerDB",
    //     "LDB",
    //     "0x04998334943893c188d8d1eea643dad70ff4e23ff951871e92e722c9eab73386e5835a3c78e2d5a1c9310e274523a2c20729316b96c0bdade6f3d5bead6d760388",
    //     "0x62469116e84ccd1853864a97dfac08490192ba6c",
    //     "0xae415ded71ba8d23748df0f0113e2fbb8225ff10",
    //     "8374444442989637949850150452393133218265193208246628247377315071840375026605",
    //   ],
    // });
  } catch (err: any) {
    console.error(err.message);
  }
};

main();
