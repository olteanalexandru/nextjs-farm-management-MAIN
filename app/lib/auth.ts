import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest } from 'next/server';

export async function getCurrentUser(request: NextRequest) {
  const session = await getSession();
  
  if (!session || !session.user) {
    throw new Error('Not authenticated');
  }

  return {
    id: session.user.sub,
    email: session.user.email,
    name: session.user.name,
    picture: session.user.picture,
    userRoles: session.user[`${process.env.AUTH0_AUDIENCE}/roles`] || []
  };
}
