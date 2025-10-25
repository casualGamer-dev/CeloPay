# CeloPay (Web + PQC-Enabled Smart Contracts)

CeloPay is a community-powered **Buy Now, Pay Later (BNPL)** platform built on the **Celo blockchain**. It features a **Next.js + Tailwind CSS** web front-end, integrated with **smart contracts**, **WAGMI**, and **post-quantum (PQC) cryptographic sessions** for secure peer communication.

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
- Ready for deployment to Celo testnets or mainnet

### ✅ Post-Quantum Cryptography (PQC)
- PQC-enabled session system (`/lib/pqc`)
- Supports secure messaging and ephemeral shared keys
- Crypto workflow: `crypto.ts`, `kem.ts`, `keyStore.ts`, `session.ts`
- Peer public keys exchanged and stored for secure sessions

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

## 📂 Project Structure

