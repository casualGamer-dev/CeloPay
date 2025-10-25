import { publicClient } from "../viemClient";
import { KeyRegistryAbi } from "./KeyRegistry.abi";

const REG = process.env.NEXT_PUBLIC_KEYREGISTRY_ADDRESS as `0x${string}` | undefined;

export type ChainKeys = { kyber: string; dilithium: string; set: boolean };

export async function readKeys(addr: `0x${string}`): Promise<ChainKeys> {
  if (!REG) return { kyber: "", dilithium: "", set: false };
  const [kyber, dilithium, set] = await publicClient.readContract({
    address: REG, abi: KeyRegistryAbi, functionName: "getKeys", args: [addr]
  }) as [string,string,boolean];
  return { kyber, dilithium, set };
}
