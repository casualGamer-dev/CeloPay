// middleware.ts
import { NextResponse, type NextRequest } from 'next/server';

// Configure which paths you want to let through when DEV_BYPASS is enabled.
// Use prefixes (start with) or exact paths. Adjust as needed.
const BYPASS_PATH_PREFIXES = [
  '/api/',        // allow all API routes through for dev bypass
  '/verify',      // example protected client route
  '/dashboard',   // example protected client route
  '/protected',   // any other protected pages
];

function isBypassEnabled() {
  return process.env.DEV_BYPASS_VERIFICATION === '1' || process.env.NODE_ENV === 'development';
}

export function middleware(req: NextRequest) {
  // If bypass is off, fall back to your normal middleware behavior
  if (!isBypassEnabled()) {
    // optionally: run your existing checks here or simply allow (if you don't have other rules)
    return NextResponse.next();
  }

  const url = req.nextUrl;
  const pathname = url.pathname;

  // If the request targets a bypassed prefix, allow immediately
  const shouldBypass = BYPASS_PATH_PREFIXES.some((p) =>
    p.endsWith('/') ? pathname.startsWith(p) : pathname === p
  );

  if (shouldBypass) {
    // Optionally add a header for downstream handlers so they know the request came through bypass
    const res = NextResponse.next();
    res.headers.set('x-dev-bypass', '1');
    return res;
  }

  // Non-bypassed path: proceed to normal checks (or allow)
  return NextResponse.next();
}

// Match all routes that normally need protection. Keep this pattern minimal and specific.
export const config = {
  matcher: [
    /*
      you can enumerate routes where middleware should run.
      e.g. '/dashboard/:path*', '/api/:path*', '/verify'
      If you want globally applied middleware remove this config and let middleware run everywhere.
    */
    '/api/:path*',
    '/dashboard/:path*',
    '/verify/:path*',
  ],
};
