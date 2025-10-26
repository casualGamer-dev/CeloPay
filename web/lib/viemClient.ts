import { http, createPublicClient, createWalletClient } from 'viem';
import { celo, celoAlfajores } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

// ✅ Resolve which chain to use (defaults to Alfajores)
const CHAIN =
  (process.env.NEXT_PUBLIC_CELO_NETWORK || 'alfajores') === 'celo'
    ? celo
    : celoAlfajores;

// ✅ Use a single canonical RPC env: NEXT_PUBLIC_CELO_RPC (already used elsewhere)
export const rpcUrl =
  process.env.NEXT_PUBLIC_CELO_RPC ||
  (CHAIN.id === celoAlfajores.id
    ? 'https://alfajores-forno.celo-testnet.org'
    : 'https://forno.celo.org');

// ✅ Public read-only client (safe everywhere)
export const publicClient = createPublicClient({
  chain: CHAIN,
  transport: http(rpcUrl),
});

// ✅ Optional wallet client for server-side writes (requires CELO_PRIVATE_KEY)
export const walletClient = (() => {
  const key = process.env.CELO_PRIVATE_KEY;
  if (!key) return null;
  const k = key.startsWith('0x') ? (key as `0x${string}`) : (`0x${key}` as `0x${string}`);
  const account = privateKeyToAccount(k);
  return createWalletClient({
    chain: CHAIN,
    transport: http(rpcUrl),
    account,
  });
})();

// ✅ Helper: Throws if no CELO_PRIVATE_KEY is defined (useful in API routes)
export function requireWallet() {
  if (!walletClient) throw new Error('CELO_PRIVATE_KEY not set for server writes');
  return walletClient;
}
