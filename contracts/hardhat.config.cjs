
require('dotenv').config();
require('@nomicfoundation/hardhat-ethers');

const cleanPk = (process.env.PRIVATE_KEY || '').trim().replace(/^['"]|['"]$/g, '');

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: '0.8.24',
    settings: { optimizer: { enabled: true, runs: 200 } },
  },
  networks: {
    alfajores: {
      url: process.env.CELO_RPC || 'https://alfajores-forno.celo-testnet.org',
      chainId: 44787,
      accounts: cleanPk ? [cleanPk] : [],
    },
  },
};
