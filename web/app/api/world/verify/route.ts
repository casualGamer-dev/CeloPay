import { NextRequest, NextResponse } from 'next/server';

/**
 * Minimal server verification:
 * We forward the proof to Worldcoin's verify API and, on success,
 * set an HttpOnly cookie that your UI reads via /api/me.
 *
 * For production, you should also bind the verification to the connected wallet
 * (e.g., include the wallet address in the IDKit "signal" and check it here).
 */
export async function POST(req: NextRequest) {
  try {
    const { result, action } = await req.json();

    // Verify against Worldcoin API
    const verifyRes = await fetch('https://developer.worldcoin.org/api/v2/verify', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        app_id: process.env.NEXT_PUBLIC_WORLDCOIN_APP_ID,
        action,                // should match the one used in the widget
        signal: '',            // optional: bind to wallet addr or requestId
        proof: result,         // IDKit returns the proof bundle as result
      }),
    });

    if (!verifyRes.ok) {
      const err = await verifyRes.text();
      return NextResponse.json({ ok: false, error: err || 'verify-failed' }, { status: 400 });
    }

    // Basic cookie (demo/hackathon). For prod: sign, add TTL, bind to wallet.
    const cookie = `cp_verified=1; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 7}`;

    return new NextResponse(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        'content-type': 'application/json',
        'set-cookie': cookie,
      },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? 'verify-failed' }, { status: 400 });
  }
}
