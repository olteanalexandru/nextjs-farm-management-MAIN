import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
// import { withMiddlewareAuthRequired } from '@auth0/nextjs-auth0/edge';

// // Define public paths that don't require authentication
// const publicPaths = [
//   '/', 
//   '/pages/News', 
//   '/pages/AboutUs', 
//   '/pages/contact',
//   '/api/auth/login',
//   '/api/auth/logout',
//   '/api/auth/callback'
// ];

// // Define static asset paths
// const staticPaths = [
//   '/_next',
//   '/Logo.png',
//   '/favicon.ico',
//   '/static',
// ];

// async function middleware(request: NextRequest) {
//   const { pathname } = request.nextUrl;

//   // Allow static assets and public paths
//   if (
//     staticPaths.some(path => pathname.startsWith(path)) ||
//     publicPaths.includes(pathname)
//   ) {
//     return NextResponse.next();
//   }

//   // For protected routes, Auth0 middleware will handle the authentication
//   return NextResponse.next();
// }

// // Wrap the middleware with Auth0's authentication check
// export default withMiddlewareAuthRequired(middleware);

// export const config = {
//   matcher: [
//     // Match all paths except static files and api routes
//     '/((?!_next/static|_next/image|favicon.ico|api/auth).*)',
//   ],
// };


export default function middleware(request: NextRequest) {
  //just console log the request
  // console.log(request)
  return NextResponse.next();
}