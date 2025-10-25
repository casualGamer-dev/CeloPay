// hooks/useNetworkGuard.ts
'use client';
import { useAccount, useChainId } from 'wagmi';
import { celoAlfajores } from 'viem/chains';

export function useNetworkGuard() {
  const { isConnected } = useAccount();
  const chainId = useChainId();
  const onWrongNetwork = isConnected && chainId !== celoAlfajores.id;
  return { onWrongNetwork, target: celoAlfajores };
}
