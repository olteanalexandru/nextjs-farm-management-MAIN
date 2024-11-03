// middleware.ts
import createMiddleware from 'next-intl/middleware';
import { withMiddlewareAuthRequired, getSession, Session } from '@auth0/nextjs-auth0/edge';
import { NextFetchEvent, NextRequest, NextResponse } from 'next/server';

const myMiddleware = async (req: NextRequest) => {
  const res = NextResponse.next();
  const session: Session | null = await getSession(req, res);
  if (session) {
    console.log('Hello from authed middleware' + " User infos access " + session.user.userRoles);
  } else {
    console.log('No session found');
  }
  return res;
};

// Combine both middlewares
const combinedMiddleware = async (req: NextRequest, event: NextFetchEvent) => {
  await withMiddlewareAuthRequired(myMiddleware)(req, event);
};

export default combinedMiddleware;

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/rotation-dashboard/:path*',
    '/api/:path*',
  ]
};






