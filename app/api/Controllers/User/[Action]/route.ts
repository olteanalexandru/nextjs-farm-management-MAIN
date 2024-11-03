import { NextResponse, NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { prisma } from '@/app/lib/prisma';
import { getCurrentUser } from '@/app/lib/auth';

// Define roles as a type
type UserRole = 'ADMIN' | 'FARMER';

async function handler(request: NextRequest, context: any) {
  const { params } = context;
  const method = request.method;

  try {
    const user = await getCurrentUser(request);

    switch (method) {
      case 'GET':
        // Only admin can fetch user lists
        if (!user.userRoles?.includes('admin')) {
          return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
        }

        if (params.Action === 'fermieri') {
          const farmers = await prisma.user.findMany({
            where: {
              role: 'FARMER'
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
              role: 'ADMIN'
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
        break;

      case 'POST':
        // Only admin can create/modify users
        if (!user.userRoles?.includes('admin')) {
          return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
        }

        if (params.Action === 'register') {
          const { name, email, role } = await request.json();

          const newUser = await prisma.user.create({
            data: {
              id: user.id, // Use Auth0 user ID
              name,
              email,
              role: role.toUpperCase() as UserRole
            }
          });

          return NextResponse.json(newUser, { status: 201 });
        }

        if (params.Action === 'changeRole') {
          const { email, role } = await request.json();

          const updatedUser = await prisma.user.update({
            where: { email },
            data: {
              role: role.toUpperCase() as UserRole
            }
          });

          return NextResponse.json(updatedUser);
        }
        break;

      case 'DELETE':
        // Only admin can delete users
        if (!user.userRoles?.includes('admin')) {
          return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
        }

        await prisma.user.delete({
          where: { id: params.Action }
        });

        return NextResponse.json({ message: 'User deleted successfully' });
        break;

      default:
        return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }
  } catch (error) {
    console.error('Request error', error);
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 });
  }
}

// Wrap the handler with Auth0's withApiAuthRequired
export const GET = withApiAuthRequired(handler);
export const POST = withApiAuthRequired(handler);
export const DELETE = withApiAuthRequired(handler);
