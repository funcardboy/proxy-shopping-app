import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 僅保護 /api 路由
  if (request.nextUrl.pathname.startsWith('/api')) {
    // skip auth for now
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
