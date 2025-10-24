# NyaayaPay — Web-only (Full, v2)

Includes:
- JSON backend (for demo)  
- On-chain UI (wagmi/viem) for create/join/request/approve/disburse/repay  
- Tailwind styling  
- Minimal page routes preserved

## Quick start
```bash
npm i
copy .env.example .env

cd apps/web
npm i
npm run dev
```
### Contracts (optional)
```bash
cd ../../contracts
npm i
# create contracts/.env with PRIVATE_KEY, CELO_RPC and CUSD_ADDRESS (Alfajores)
npm run build
npm run deploy:alfajores
# put deployed address into root .env as NEXT_PUBLIC_NYAAYA_ADDRESS and restart web
```
