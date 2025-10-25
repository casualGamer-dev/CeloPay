const hre = require("hardhat");
async function main() {
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with:", deployer.address);
  const ProfileRegistry = await hre.ethers.getContractFactory("ProfileRegistry");
  const reg = await ProfileRegistry.deploy();
  await reg.waitForDeployment();
  console.log("ProfileRegistry:", await reg.getAddress());
}
main().catch((e)=>{console.error(e);process.exit(1);});
