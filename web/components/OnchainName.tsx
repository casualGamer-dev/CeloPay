"use client";
import { useEffect, useState } from "react";
import { readProfile } from "@/lib/onchain/profileAdapter";
export default function OnchainName({ address, fallback }: { address?: `0x${string}` | null; fallback: string; }) {
  const [name, setName] = useState<string>("");
  useEffect(() => { (async ()=>{ if (!address) return setName(""); try { const p = await readProfile(address); setName(p.set ? (p.name?.trim() || "") : ""); } catch { setName(""); } })(); }, [address]);
  return <span>{name || fallback}</span>;
}
