import { getSession } from '@auth0/nextjs-auth0';
import { prisma } from './prisma';
import { NextRequest } from 'next/server';

export async function getCurrentUser(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      throw new Error('Not authenticated');
    }

    // Find or create user in database
    const user = await prisma.user.upsert({
      where: { 
        auth0Id: session.user.sub 
      },
      update: {
        name: session.user.name || '',
        email: session.user.email || '',
        picture: session.user.picture || null
      },
      create: {
        auth0Id: session.user.sub,
        name: session.user.name || '',
        email: session.user.email || '',
        picture: session.user.picture || null
      }
    });

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    throw error;
  }
}
