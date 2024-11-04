import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Define public paths that don't require authentication
const publicPaths = ['/', '/pages/News', '/pages/AboutUs', '/pages/contact'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow access to public paths and auth-related paths without authentication
  if (
    publicPaths.includes(pathname) ||
    pathname.startsWith('/api/auth/') ||
    pathname.startsWith('/_next/') ||
    pathname.includes('/Logo.png') ||
    pathname.startsWith('/api/Controllers/Post')
  ) {
    return NextResponse.next();
  }

  // Check for auth cookie
  const authCookie = request.cookies.get('appSession');
  
  if (!authCookie) {
    // If no auth cookie and trying to access protected route, redirect to login
    if (pathname.startsWith('/api/') || pathname.includes('/Dashboard')) {
      return NextResponse.redirect(new URL('/api/auth/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
