import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // 僅保護 /api 路由
  if (request.nextUrl.pathname.startsWith('/api')) {
    const apiKey = request.headers.get('x-api-key');
    const secureToken = process.env.APP_API_KEY;

    if (!apiKey || apiKey !== secureToken) {
      return NextResponse.json(
        { error: 'Unauthorized: Missing or invalid API Key' },
        { status: 401 }
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
