import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const cookies = req.headers.get('cookie') || '';
  const worldVerified = /(^|;\s*)cp_verified=1(\s*;|$)/.test(cookies);

  const url = new URL(req.url);
  const address = url.searchParams.get('address');
  let humanVerified = false;
  let score: number | null = null;

  if (address) {
    const r = await fetch(`${url.origin}/api/human/score?address=${address}`, { cache: 'no-store' });
    if (r.ok) {
      const j = await r.json();
      humanVerified = !!j.passing;
      score = j.score ?? null;
    }
  }

  return NextResponse.json({
    ok: true,
    // consider Human Passport as your primary gate; keep worldVerified for fallback if you still support it
    verified: worldVerified || humanVerified,
    humanVerified,
    score,
  });
}
