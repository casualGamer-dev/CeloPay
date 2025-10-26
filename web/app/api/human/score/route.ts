import { NextRequest, NextResponse } from 'next/server';

const API = 'https://api.passport.xyz';
const KEY = process.env.HUMAN_PASSPORT_API_KEY!;
const SCORER_ID = process.env.HUMAN_PASSPORT_SCORER_ID!;
const DEFAULT_THRESHOLD = Number(process.env.HUMAN_PASSPORT_THRESHOLD ?? 20);

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const address = url.searchParams.get('address');
  if (!address) return NextResponse.json({ ok: false, error: 'missing address' }, { status: 400 });

  const res = await fetch(`${API}/v2/stamps/${SCORER_ID}/score/${address}`, {
    headers: { 'x-api-key': KEY },
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    return NextResponse.json({ ok: false, error: text || res.statusText }, { status: res.status });
  }

  const data = await res.json();
  // v2 returns a unique humanity score and also a binary `passing_score`
  const score = data?.score ?? 0;
  const passing = data?.passing_score ?? score >= DEFAULT_THRESHOLD;

  return NextResponse.json({ ok: true, score, passing, raw: data });
}
