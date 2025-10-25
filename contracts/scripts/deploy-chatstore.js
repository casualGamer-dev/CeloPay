const hre = require("hardhat");

async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);

  const ChatStore = await hre.ethers.getContractFactory("ChatStore");
  const chat = await ChatStore.deploy();

  // ethers v6:
  await chat.waitForDeployment();

  const address = await chat.getAddress();
  console.log("ChatStore:", address);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
