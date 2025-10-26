import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const cookies = req.headers.get('cookie') || '';
  const verified = /(^|;\s*)cp_verified=1(\s*;|$)/.test(cookies);
  return NextResponse.json({ ok: true, verified });
}
