import { NextRequest } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getSession } from '@auth0/nextjs-auth0';

// Helper function to handle authentication
async function authenticateUser() {
  const session = await getSession();
  if (!session?.user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }
  return session;
}

export async function POST(request: NextRequest) {
  try {
    const session = await authenticateUser();
    if (session instanceof Response) return session;

    const { email, name } = session.user;
    const auth0Id = session.user.sub;

    // Check if user should be admin
    const isAdmin = email.toLowerCase() === 'oltean.alexandru11@gmail.com';
    const roleType = isAdmin ? 'ADMIN' : 'FARMER';

    // Create or update user in database
    const user = await prisma.user.upsert({
      where: { auth0Id },
      update: {
        name,
        email,
        roleType
      },
      create: {
        auth0Id,
        name,
        email,
        roleType
      }
    });

    return Response.json(user);
  } catch (error) {
    console.error('User creation error:', error);
    return Response.json(
      { error: 'Error creating user' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await authenticateUser();
    if (session instanceof Response) return session;

    const { email, roleType } = await request.json();

    // Only admins can change roles
    const currentUser = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub }
    });

    if (currentUser?.roleType !== 'ADMIN') {
      return Response.json({ error: 'Not authorized' }, { status: 403 });
    }

    const updatedUser = await prisma.user.update({
      where: { email },
      data: { roleType }
    });

    return Response.json(updatedUser);
  } catch (error) {
    console.error('User update error:', error);
    return Response.json(
      { error: 'Error updating user' },
      { status: 500 }
    );
  }
}
