import { NextRequest, NextResponse } from 'next/server';

const PROTECTED = [
  '/dashboard',
  '/circles',
  '/loans',
  '/chat',
  '/activity',
  '/my',
];

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!PROTECTED.some(p => pathname.startsWith(p))) return NextResponse.next();

  const cookies = req.headers.get('cookie') || '';
  const verified = /(^|;\s*)cp_verified=1(\s*;|$)/.test(cookies);

  if (!verified) return NextResponse.redirect(new URL('/verify', req.url));
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*','/circles/:path*','/loans/:path*','/chat/:path*','/activity/:path*','/my/:path*'],
};
