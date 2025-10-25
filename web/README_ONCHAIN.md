# On-Chain Storage (Minimal Add-on)

Updated on 2025-10-25T21:39:06.314043 — Added a minimal on-chain message store using Celo + viem.

## Contract
- `contracts/contracts/ChatStore.sol`
- Deploy with Hardhat script: `contracts/scripts/deploy-chatstore.js`

## Web usage
- API: `GET /api/chat?chat=<chatKey>` and `POST /api/chat` with `{ "chatKey": "...", "content": "..." }`
- Configure env in `web/.env.local` (see `.env.example`)

## Env vars
- `NEXT_PUBLIC_CELO_NETWORK=alfajores`
- `CELO_PRIVATE_KEY=0x...`
- `NEXT_PUBLIC_CHATSTORE_ADDRESS=0x...`
