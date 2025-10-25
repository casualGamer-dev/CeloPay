# CeloPay Contracts (Standalone)

- Hardhat (CommonJS), ethers v6
- Deploys `CeloPay.sol` to Celo Alfajores

## Setup
```bash
npm i
copy .env.example .env
# edit .env and paste your PRIVATE_KEY (0x + 64 hex)
```

## Build & Deploy (Node 18 LTS recommended)
```bash
npx hardhat compile
npx hardhat run scripts/deploy.js --network alfajores
```

The script prints the deployed address. Use it in your web app as `NEXT_PUBLIC_CELO_ADDRESS`.
