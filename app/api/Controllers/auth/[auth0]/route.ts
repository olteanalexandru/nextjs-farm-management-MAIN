import { handleAuth, handleLogin, handleCallback, handleLogout } from '@auth0/nextjs-auth0';
import { NextRequest } from 'next/server';

// Create individual handlers
const handlers = {
  login: handleLogin({
    returnTo: '/pages/Login/Dashboard'
  }),
  callback: handleCallback({
    redirectUri: process.env.AUTH0_REDIRECT_URI
  }),
  logout: handleLogout({
    returnTo: process.env.AUTH0_BASE_URL
  })
};

// Create async handler function
export async function GET(request: NextRequest, { params }: { params: { auth0: string } }) {
  // Wait for params to be available
  const auth0Param = params.auth0;
  
  // Select the appropriate handler based on the parameter
  if (auth0Param && auth0Param in handlers) {
    return handlers[auth0Param](request);
  }
  
  // Default to basic auth handler
  return handleAuth()(request);
}

// Make sure all paths are handled
export const dynamic = 'force-dynamic';