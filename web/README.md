# CeloPay — Web (Standalone)

- Next.js 14 (App Router) + Tailwind
- wagmi + viem wallet connect for Celo
- JSON API fallback (no DB), data at `data/store.json`
- On-chain actions when `NEXT_PUBLIC_CELO_ADDRESS` is set

## Quick start
```bash
npm i
copy .env.example .env
npm run dev
# open http://localhost:3000
```
