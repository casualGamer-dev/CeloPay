import { createPublicClient, http } from 'viem';
import { celoAlfajores } from 'viem/chains';
import poolAbi from './pool.abi.json';

export const publicClient = createPublicClient({ chain: celoAlfajores, transport: http() });

export const POOL_ADDRESS = process.env.NEXT_PUBLIC_POOL_ADDRESS as `0x${string}` | undefined;

// ✅ Unified and defaulted cUSD address (same as PoolPage)
export const CUSD_ADDRESS = (
  process.env.NEXT_PUBLIC_CUSD_ADDRESS ||
  '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1' // Default Alfajores cUSD
) as `0x${string}`;

export async function getPoolStats() {
  if (!POOL_ADDRESS) throw new Error('NEXT_PUBLIC_POOL_ADDRESS missing');
  const [totalCash, totalBorrows, totalReserves, util, brps, srps, ex] = await Promise.all([
    publicClient.readContract({ address: POOL_ADDRESS, abi: poolAbi as any, functionName: 'totalCash' }),
    publicClient.readContract({ address: POOL_ADDRESS, abi: poolAbi as any, functionName: 'totalBorrows' }),
    publicClient.readContract({ address: POOL_ADDRESS, abi: poolAbi as any, functionName: 'totalReserves' }),
    publicClient.readContract({ address: POOL_ADDRESS, abi: poolAbi as any, functionName: 'utilization' }),
    publicClient.readContract({ address: POOL_ADDRESS, abi: poolAbi as any, functionName: 'borrowRatePerSec' }),
    publicClient.readContract({ address: POOL_ADDRESS, abi: poolAbi as any, functionName: 'supplyRatePerSec' }),
    publicClient.readContract({ address: POOL_ADDRESS, abi: poolAbi as any, functionName: 'exchangeRate' }),
  ]);
  const SECONDS_PER_YEAR = 31536000n;
  const borrowAPR = (brps * SECONDS_PER_YEAR) / 10n**18n;
  const supplyAPY = (srps * SECONDS_PER_YEAR) / 10n**18n;
  return { totalCash, totalBorrows, totalReserves, util, borrowAPR, supplyAPY, exchangeRate: ex };
}
