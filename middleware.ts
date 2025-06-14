import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Skip middleware for static files and API routes
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Public routes that don't require authentication
  const publicPaths = ['/', '/auth', '/auth/callback'];
  const isPublicPath = publicPaths.includes(pathname);

  // Check for Supabase session
  const supabaseAccessToken = request.cookies.get('sb-access-token') ||
                             request.cookies.get('supabase-auth-token') ||
                             request.cookies.get('sb-ocwujhzkqguxtwjgzzgr-auth-token');

  // If no session and trying to access protected route
  if (!supabaseAccessToken && !isPublicPath) {
    console.log('Middleware: No Supabase session, redirecting to auth');
    return NextResponse.redirect(new URL('/auth', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Temporarily disable middleware for debugging
  matcher: [],
};