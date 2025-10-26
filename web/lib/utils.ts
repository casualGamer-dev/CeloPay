import { keccak256, encodePacked, parseUnits, formatUnits } from 'viem';

/** Decimals for cUSD on Celo */
export const CUSD_DECIMALS = 18;

/** ✅ Default Alfajores cUSD token address (consistent with lib/pool.ts) */
export const CUSD = (
  process.env.NEXT_PUBLIC_CUSD_ADDRESS ||
  '0x874069Fa1Eb16D44d622F2e0Ca25eeA172369bC1'
) as `0x${string}`;

/** Converts user input (string cUSD) → bigint in wei */
export const toWeiFromCUSD = (amount: string) =>
  parseUnits((amount || '0').trim() || '0', CUSD_DECIMALS);

/** Converts bigint wei → string cUSD */
export const fromWeiToCUSD = (wei: bigint) =>
  formatUnits(wei || 0n, CUSD_DECIMALS);

/** Computes circleId = keccak256(creator + name) */
export const computeCircleId = (creator: `0x${string}`, name: string) =>
  keccak256(
    encodePacked(['address', 'string'], [creator, name])
  ) as `0x${string}`;

/** Validates bytes32 string */
export const isBytes32 = (v: string | null) =>
  !!v && /^0x[0-9a-fA-F]{64}$/.test(v);

/** Short address or ID (0x1234…abcd) */
export const short = (v: string, n = 6) =>
  v?.length ? `${v.slice(0, 2 + n)}…${v.slice(-n)}` : v;

export const isAddress = (v: string): v is `0x${string}` =>
  /^0x[0-9a-fA-F]{40}$/.test(v);

/** ✅ Default INR conversion (unchanged) */
export const INR_PER_CUSD = Number(process.env.NEXT_PUBLIC_INR_PER_CUSD || 83);

export const toINRString = (cusd: string | number) => {
  const n = typeof cusd === 'string' ? parseFloat(cusd || '0') : cusd;
  const inr = isFinite(n) ? n * INR_PER_CUSD : 0;
  return `₹${Math.round(inr).toLocaleString('en-IN')}`;
};
