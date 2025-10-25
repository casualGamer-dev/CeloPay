import { publicClient } from "../viemClient";
import { ProfileRegistryAbi } from "./ProfileRegistry.abi";

const REGISTRY = process.env.NEXT_PUBLIC_PROFILEREGISTRY_ADDRESS as `0x${string}` | undefined;

export type ChainProfile = { name: string; phone: string; set: boolean };

export async function readProfile(address: `0x${string}`): Promise<ChainProfile> {
  if (!REGISTRY) return { name: "", phone: "", set: false };
  const [name, phone, set] = await publicClient.readContract({
    address: REGISTRY,
    abi: ProfileRegistryAbi,
    functionName: "getProfile",
    args: [address],
  }) as [string, string, boolean];
  return { name, phone, set };
}
