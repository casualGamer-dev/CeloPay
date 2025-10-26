// web/lib/chain.ts
import { createPublicClient, createWalletClient, http } from 'viem';
import { celoAlfajores } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';

export const publicClient = createPublicClient({
  chain: celoAlfajores,
  transport: http(process.env.CELO_RPC_URL || 'https://alfajores-forno.celo-testnet.org'),
});

export function getAdminWallet() {
  const pk = process.env.DEPLOYER_KEY;
  if (!pk) throw new Error('DEPLOYER_KEY missing');
  const account = privateKeyToAccount(pk as `0x${string}`);
  return createWalletClient({
    chain: celoAlfajores,
    transport: http(process.env.CELO_RPC_URL || 'https://alfajores-forno.celo-testnet.org'),
    account,
  });
}
