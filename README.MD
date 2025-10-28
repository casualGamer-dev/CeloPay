# 🌍 **CeloPay**
### *Web + PQC-Enabled Microcredits Environment*

[![Built with Celo](https://img.shields.io/badge/Built%20on-Celo-35D07F?logo=celo)](https://celo.org/)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=nextdotjs)](https://nextjs.org/)
[![Post-Quantum Ready](https://img.shields.io/badge/Security-PQC%20Enabled-blueviolet)](#)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-007ACC?logo=typescript)](https://www.typescriptlang.org/)

---

## 💡 Overview

**CeloPay** is a community-powered **microcredits platform** built on the **Celo blockchain**, designed to provide **banking for the unbanked**.  
It enables communities to create **trust-based credit circles**, manage **decentralized microloans**, and securely communicate via **Post-Quantum Cryptography (PQC)**.

---

### 💫 How It Works

1. ✅ Users complete KYC and link their Celo wallet  
2. 🤝 Form or join **Credit Circles**  
3. 💸 Request loans with defined terms  
4. 🧾 Approval from **Trust Anchors** in the circle  
5. 💰 Receive funds directly in wallet  
6. 🔁 Repay and build on-chain reputation  
7. 🌱 Earn credibility and strengthen your credit circle  

---

## 🚀 Features

### 🖥️ Frontend (Next.js 14 App Router)
- Built using **Next.js (App Router) + TypeScript**
- Responsive UI with **Tailwind CSS**
- **Glassmorphic sticky navigation bar**
- Smooth **page transitions** and **scroll reveal animations**
- Reusable **button system** (primary, secondary, ghost)
- Integrated **Celo WalletConnect** using **Wagmi**
- **Dynamic dashboard**, activity, and loan views
- Built-in **scroll progress indicator**

---

### ⚙️ Smart Contract Layer
- Contracts located in `/contracts`
- Written in **Solidity**
- Core contract: `NyaayaPay.sol`
- **BNPL-style** (Buy Now Pay Later) repayment mechanism
- Supports **ERC20 tokens** (ABI included)
- **Human Verification API** for KYC integration
- Deployable to **Celo Alfajores (testnet)** or **Mainnet**

---

### 🔐 Post-Quantum Cryptography (PQC)
- PQC session layer inside `/lib/pqc`
- Provides **secure, ephemeral encrypted sessions** for chat
- Core modules:
  - `crypto.ts`
  - `kem.ts`
  - `keyStore.ts`
  - `session.ts`

**Protocols Used:**
- `CRYSTALS-Kyber 768` — Post-Quantum Key Encapsulation  
- `AES-GCM` — Symmetric message encryption  

---

### 🌐 Web3 Integration
- Wallet management via **Wagmi + Viem**
- Smart contract hooks in `/lib/wagmi.tsx`
- Real-time blockchain event tracking via `/lib/events.ts`
- Network guards and auto-switch logic
- Full **on-chain credit circle synchronization**

---

## 🧭 Core UI Pages

| Page | Path | Description |
|------|------|-------------|
| **Home** | `/` | Landing / Product introduction |
| **Dashboard** | `/dashboard` | User summary & balances |
| **Activity** | `/activity` | Payment / BNPL interactions |
| **Loans** | `/loans` | Manage and view loans |
| **My** | `/my` | Profile and personal data |
| **Circles** | `/circles` | Create or join credit groups |
| **Chat (PQC-secured)** | `/chat` | End-to-end encrypted communication |

---

## 🧱 Core Architecture (CA)

```plaintext
CeloPay/
├── contracts/                 # Solidity smart contracts
│   ├── NyaayaPay.sol          # Core lending + BNPL logic
│   └── ERC20/                 # Token modules
│
├── lib/
│   ├── pqc/                   # Post-Quantum crypto modules
│   │   ├── crypto.ts
│   │   ├── kem.ts
│   │   ├── keyStore.ts
│   │   └── session.ts
│   ├── wagmi.tsx              # Wallet + contract hooks
│   └── events.ts              # On-chain event subscriptions
│
├── app/                       # Next.js App Router pages
│   ├── dashboard/
│   ├── activity/
│   ├── loans/
│   ├── circles/
│   ├── chat/
│   └── my/
│
├── components/                # Reusable UI components
├── styles/                    # Tailwind & global CSS
└── public/                    # Static assets (logos, icons, etc.)
