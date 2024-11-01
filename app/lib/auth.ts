import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';

export async function getCurrentUser(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Not authenticated');
  }
  return session.user;
}

export async function checkUserAccess(userId: string, resourceUserId: string) {
  const session = await getSession();
  const user = session?.user;
  
  if (!user) return false;
  if (user.sub !== userId && !user.userRoles?.includes('admin')) {
    return false;
  }
  return true;
}
