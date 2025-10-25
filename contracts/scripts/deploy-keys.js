const hre = require("hardhat");
async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  const KeyRegistry = await hre.ethers.getContractFactory("KeyRegistry");
  const reg = await KeyRegistry.deploy();
  await reg.waitForDeployment();
  console.log("KeyRegistry:", await reg.getAddress());
}
main().catch((e)=>{console.error(e);process.exit(1);});
