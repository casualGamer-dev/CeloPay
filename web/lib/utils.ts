// lib/utils.ts
import { keccak256, encodePacked, parseUnits, formatUnits } from 'viem';

export const CUSD_DECIMALS = 18;

export function toWeiFromCUSD(amount: string) {
  return parseUnits(amount || '0', CUSD_DECIMALS);
}
export function fromWeiToCUSD(amountWei: bigint) {
  return formatUnits(amountWei, CUSD_DECIMALS);
}

export function computeCircleId(creator: `0x${string}`, name: string): `0x${string}` {
  return keccak256(encodePacked(['address', 'string'], [creator, name])) as `0x${string}`;
}

export function isBytes32(v: string) {
  return /^0x[0-9a-fA-F]{64}$/.test(v);
}
