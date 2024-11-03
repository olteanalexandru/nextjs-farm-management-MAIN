import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
      },
    });
  }

  const response = NextResponse.next();

  // Add CORS headers for actual requests
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Origin', request.headers.get('origin') || '*');

  // Allow auth endpoints to pass through
  if (request.nextUrl.pathname.startsWith('/api/auth/')) {
    return response;
  }

  // Check if there's a valid session cookie
  const authCookie = request.cookies.get('appSession');
  
  if (!authCookie && (
    request.nextUrl.pathname.startsWith('/api/Controllers/') ||
    request.nextUrl.pathname.startsWith('/pages/Login/') ||
    request.nextUrl.pathname.startsWith('/Crud/GetAllInRotatie/') ||
    request.nextUrl.pathname.startsWith('/Crud/GetAllPosts/')
  )) {
    // For API requests, return 401 instead of redirecting
    if (request.nextUrl.pathname.startsWith('/api/')) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Origin': request.headers.get('origin') || '*',
        },
      });
    }
    // For page requests, redirect to login
    return NextResponse.redirect(new URL('/api/auth/login', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    '/api/Controllers/:path*',
    '/pages/Login/:path*',
    '/Crud/GetAllInRotatie/:path*',
    '/Crud/GetAllPosts/:path*'
  ],
};
