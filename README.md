# CeloPay (Web + PQC-Enabled Microcredits Environment)

CeloPay is a community-powered **Micro-credits : Banking for the unbanked** platform built on the **Celo blockchain**. <br>
---> People verify themselves (KYC) and link their wallet IDs <br> 
---> form or join credit circles <br> 
---> request loans <br> 
---> get them approved by trust anchors in the credit circle <br> 
---> credited to their wallets <br> 
---> pay it back <br>
---> earn trust and improve the chain! <br>
It features a **Next.js + Tailwind CSS** web front-end, integrated with **smart contracts**, **WAGMI**, and **post-quantum (PQC) cryptographic sessions** for secure peer communication.

---

## 🚀 Features

### ✅ Frontend (Next.js 14 App Router)
- Built with **Next.js (App Router) + TypeScript**
- Responsive UI using **Tailwind CSS**
- **Sticky glassmorphic navigation bar**
- Animated page transitions
- **Scroll reveal animations**
- Button system with primary, secondary, and ghost styles
- Integrated **Celo WalletConnect** / Wagmi hooks
- Dynamic dashboard and activity views
- Scroll progress indicator

### ✅ Smart Contract Layer
- Located in `/contracts`
- Written in **Solidity**
- Core contract: `NyaayaPay.sol`
- BNPL-style repayment mechanism
- ERC20 support (ABI included)
- Third Party KYC via Human Verification API
- Ready for deployment to Celo testnets or mainnet

### ✅ Post-Quantum Cryptography (PQC)
- PQC-enabled session system (`/lib/pqc`)
- Supports secure messaging and ephemeral shared keys
- Crypto workflow: `crypto.ts`, `kem.ts`, `keyStore.ts`, `session.ts`
- Peer public keys exchanged and stored for secure sessions
- Protocols used :
- `CRYSTALS-Kyber 768` for key encapsulation
- `AES GCM` for actual encryption cipher

### ✅ Web3 Integration
- Wallet handling via **Wagmi + Viem**
- Contract utility hooks in `/lib/wagmi.tsx` and `/lib/events.ts`
- Network guard support
- Real-time on-chain event subscriptions

### ✅ Core UI Pages
| Page | Path | Description |
|------|------|-------------|
| Home | `/` | Landing / product intro |
| Dashboard | `/dashboard` | User activity summary |
| Activity | `/activity` | List of BNPL/payments interactions |
| Loans | `/loans` | View and manage loans |
| My | `/my` | User-specific profile/data |
| Circles | `/circles` | Community-led financing |
| Chat (PQC-secured) | `/chat` | Encrypted communication |

---

## 📦 Getting Started (Web)

```bash
cd web
npm install
npm run dev
```
---
## Contributions

Tamanash Das
Avishek Chakraborty


