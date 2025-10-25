import { NextResponse } from "next/server";
import { publicClient } from "../../../../lib/viemClient";
import { KeyRegistryAbi } from "../../../../lib/onchain/KeyRegistry.abi";

const REG = process.env.NEXT_PUBLIC_KEYREGISTRY_ADDRESS as `0x${string}` | undefined;

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get("address") as `0x${string}` | null;
    if (!address) {
      return NextResponse.json({ ok: false, error: "Missing 'address' query param" }, { status: 400 });
    }
    if (!REG) {
      return NextResponse.json({ ok: true, keys: { kyber: "", dilithium: "", set: false } });
    }
    const [kyber, dilithium, set] = await publicClient.readContract({
      address: REG, abi: KeyRegistryAbi, functionName: "getKeys", args: [address]
    }) as [string,string,boolean];
    return NextResponse.json({ ok: true, keys: { kyber, dilithium, set } });
  } catch (e:any) {
    console.error("GET /api/chat/keys error:", e);
    return NextResponse.json({ ok: false, error: e?.message ?? "Unknown error" }, { status: 500 });
  }
}
