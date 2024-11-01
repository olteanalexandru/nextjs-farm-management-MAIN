import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getCurrentUser } from '@/app/lib/auth';
import { Role } from '@prisma/client';

export async function GET(request: NextRequest, context: any) {
  const { params } = context;
  
  try {
    const user = await getCurrentUser(request);
    
    // Only admin can fetch user lists
    if (!user.userRoles?.includes('admin')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }

    if (params.Action === 'fermieri') {
      const farmers = await prisma.user.findMany({
        where: {
          role: Role.FARMER
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              crops: true,
              rotations: true
            }
          }
        }
      });

      return NextResponse.json(farmers);
    }

    if (params.Action === 'admin') {
      const admins = await prisma.user.findMany({
        where: {
          role: Role.ADMIN
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        }
      });

      return NextResponse.json(admins);
    }
  } catch (error) {
    console.error('Request error', error);
    return NextResponse.json({ error: 'Error fetching users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: any) {
  const { params } = context;
  
  try {
    const user = await getCurrentUser(request);

    // Only admin can create/modify users
    if (!user.userRoles?.includes('admin')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }

    if (params.Action === 'register') {
      const { name, email, role } = await request.json();

      const newUser = await prisma.user.create({
        data: {
          id: `auth0|${Math.random().toString(36).substr(2, 9)}`, // Temporary ID until Auth0 creates real one
          name,
          email,
          role: role.toUpperCase() as Role
        }
      });

      return NextResponse.json(newUser, { status: 201 });
    }

    if (params.Action === 'changeRole') {
      const { email, role } = await request.json();

      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          role: role.toUpperCase() as Role
        }
      });

      return NextResponse.json(updatedUser);
    }
  } catch (error) {
    console.error('Request error', error);
    return NextResponse.json({ error: 'Error processing user request' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: any) {
  const { params } = context;
  
  try {
    const user = await getCurrentUser(request);

    // Only admin can delete users
    if (!user.userRoles?.includes('admin')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }

    await prisma.user.delete({
      where: { id: params.Action }
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Request error', error);
    return NextResponse.json({ error: 'Error deleting user' }, { status: 500 });
  }
}
                







