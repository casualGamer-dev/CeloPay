
const { ethers } = require('hardhat');

async function main() {
  const tokenAddress =
    process.env.CUSD_ADDRESS || '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1'; // cUSD on Alfajores
  const CeloPay = await ethers.getContractFactory('CeloPay');
  const celo = await CeloPay.deploy(tokenAddress);
  await celo.waitForDeployment();
  const addr = await celo.getAddress();
  console.log('CeloPay deployed to:', addr);
}

main().catch((e) => { console.error(e); process.exit(1); });
