import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';

export async function getCurrentUser(request: NextRequest) {
  try {
    const response = NextResponse.next();
    const session = await getSession(request, response);
    if (!session?.user) {
      throw new Error('Not authenticated');
    }
    
    return {
      id: session.user.sub,
      email: session.user.email,
      name: session.user.name,
      userRoles: session.user.userRoles
    };
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}
