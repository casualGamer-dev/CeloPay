import { http, createPublicClient, createWalletClient } from 'viem'
import { celo, celoAlfajores } from 'viem/chains'
import { privateKeyToAccount } from 'viem/accounts'

const CHAIN = (process.env.NEXT_PUBLIC_CELO_NETWORK || 'alfajores') === 'celo' ? celo : celoAlfajores

export const rpcUrl = process.env.NEXT_PUBLIC_CELO_RPC_URL || (CHAIN.id === celoAlfajores.id
  ? 'https://alfajores-forno.celo-testnet.org'
  : 'https://forno.celo.org')

export const publicClient = createPublicClient({ chain: CHAIN, transport: http(rpcUrl) })

export const walletClient = (() => {
  const key = process.env.CELO_PRIVATE_KEY
  if (!key) return null
  const k = key.startsWith('0x') ? key : ('0x' + key)
  const account = privateKeyToAccount(k as `0x${string}`)
  return createWalletClient({ chain: CHAIN, transport: http(rpcUrl), account })
})()

export function requireWallet() {
  if (!walletClient) throw new Error('CELO_PRIVATE_KEY not set for server writes')
  return walletClient
}
