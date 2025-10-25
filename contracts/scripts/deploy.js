
const { ethers } = require('hardhat');

async function main() {
  const tokenAddress =
    process.env.CUSD_ADDRESS || '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1'; // cUSD on Alfajores
  const NyaayaPay = await ethers.getContractFactory('NyaayaPay');
  const nyaaya = await NyaayaPay.deploy(tokenAddress);
  await nyaaya.waitForDeployment();
  const addr = await nyaaya.getAddress();
  console.log('NyaayaPay deployed to:', addr);
}

main().catch((e) => { console.error(e); process.exit(1); });
