// app/api/me/route.ts
import { NextRequest, NextResponse } from 'next/server';

/**
 * Dev-friendly /api/me route.
 * - If DEV_BYPASS_VERIFICATION=1 (or NODE_ENV=development) this returns a mocked verified+approved user.
 * - Otherwise, run your real /api/me logic (replace `realMeLogic` with your implementation).
 */

const isDevBypassEnabled = () =>
  process.env.DEV_BYPASS_VERIFICATION === '1' ;

async function realMeLogic(req: NextRequest) {
  // TODO: Replace this with your actual /api/me implementation:
  // - validate/lookup human passport stamps
  // - compute score
  // - check on-chain approved status or DB
  // For now, return a safe default when not bypassing.
  return NextResponse.json(
    {
      ok: true,
      verified: false,
      humanVerified: false,
      approved: false,
      score: '0.00000',
    },
    { status: 200 }
  );
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const address = url.searchParams.get('address') || null;

  if (isDevBypassEnabled()) {
    // Mocked dev response — treats every address as verified & approved
    return NextResponse.json(
      {
        ok: true,
        _devBypass: true,
        verified: true,
        humanVerified: true,
        approved: true,
        score: '999.00000',
        address,
      },
      { status: 200 }
    );
  }

  // Production path — call your real logic
  return realMeLogic(req);
}
