import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Allow access to public paths
  const publicPaths = ['/', '/auth', '/test', '/test-db', '/api'];
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path));

  if (isPublicPath) {
    return NextResponse.next();
  }

  // Check for NextAuth session cookie
  const sessionToken = request.cookies.get('next-auth.session-token') ||
                      request.cookies.get('__Secure-next-auth.session-token');

  if (!sessionToken) {
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Temporarily disable middleware for debugging
  matcher: [],
};