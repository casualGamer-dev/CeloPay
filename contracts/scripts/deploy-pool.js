const hre = require("hardhat");

async function main() {
  const CUSD = process.env.CUSD_ADDRESS || "0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1";

  const Pool = await hre.ethers.getContractFactory("CeloPayPool");
  const pool = await Pool.deploy(CUSD);
  await pool.waitForDeployment();
  console.log("Pool deployed:", await pool.getAddress());

  const Policy = await hre.ethers.getContractFactory("AllowlistPolicy");
  const policy = await Policy.deploy();
  await policy.waitForDeployment();
  console.log("Policy deployed:", await policy.getAddress());

  const tx = await pool.setPolicy(await policy.getAddress());
  await tx.wait();
  console.log("Policy set on pool");
}

main().catch((e)=>{ console.error(e); process.exit(1); });
