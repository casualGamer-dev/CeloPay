import { NextRequest, NextResponse } from 'next/server';
import { publicClient } from '../../../lib/chain';
import policyAbi from '../../../lib/policy.abi.json';

function devBypassEnabled() {
  // bypass only in non-production and when the flag is set
  return process.env.NODE_ENV !== 'production' && process.env.DEV_BYPASS_VERIFICATION === '1';
}

export async function GET(req: NextRequest) {
  const cookies = req.headers.get('cookie') || '';
  const worldVerified = /(^|;\s*)cp_verified=1(\s*;|$)/.test(cookies); // legacy cookie, OK to keep

  const url = new URL(req.url);
  const address = url.searchParams.get('address') as `0x${string}` | null;

  // ===== Dev bypass =====
  if (devBypassEnabled()) {
    return NextResponse.json({
      ok: true,
      verified: true,
      humanVerified: true,
      approved: true,
      score: 999,
      _devBypass: true,
    });
  }

  // ===== Normal behavior =====
  let humanVerified = false;
  let score: number | null = null;
  let approved = false;

  // Human Passport score
  if (address) {
    try {
      const r = await fetch(`${url.origin}/api/human/score?address=${address}`, { cache: 'no-store' });
      if (r.ok) {
        const j = await r.json();
        humanVerified = !!j.passing;
        score = j.score ?? null;
      }
    } catch {}
  }

  // On-chain policy approval
  try {
    const POLICY_ADDRESS = process.env.POLICY_ADDRESS as `0x${string}` | undefined;
    if (POLICY_ADDRESS && address) {
      approved = await publicClient.readContract({
        address: POLICY_ADDRESS,
        abi: policyAbi as any,
        functionName: 'approved',
        args: [address],
      }) as boolean;
    }
  } catch {}

  return NextResponse.json({
    ok: true,
    verified: worldVerified || humanVerified,
    humanVerified,
    approved,
    score,
  });
}
