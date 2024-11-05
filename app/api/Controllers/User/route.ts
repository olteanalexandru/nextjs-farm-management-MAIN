import { NextRequest } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getSession } from '@auth0/nextjs-auth0';

type RoleType = 'ADMIN' | 'FARMER';

interface UserData {
    auth0Id: string;
    name: string | null;
    email: string;
    roleType: RoleType;
}

// Helper function to handle authentication
async function authenticateUser() {
    try {
        const session = await getSession();
        if (!session?.user) {
            return Response.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }
        return session;
    } catch (error) {
        console.error('Authentication error:', error);
        return Response.json(
            { error: 'Authentication failed' },
            { status: 500 }
        );
    }
}

// Helper function to validate email
function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export async function POST(request: NextRequest) {
    try {
        const session = await authenticateUser();
        if (session instanceof Response) return session;

        const { email, name } = session.user;
        const auth0Id = session.user.sub;

        if (!email || !isValidEmail(email)) {
            return Response.json(
                { error: 'Invalid email address' },
                { status: 400 }
            );
        }

        // Check if user should be admin
        const isAdmin = email.toLowerCase() === process.env.ADMIN_EMAIL;
        const roleType: RoleType = isAdmin ? 'ADMIN' : 'FARMER';

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

        return Response.json({
            message: 'User created/updated successfully',
            user
        });
    } catch (error) {
        console.error('User creation error:', error);
        return Response.json(
            { error: 'Failed to create/update user' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await authenticateUser();
        if (session instanceof Response) return session;

        const body = await request.json();
        const { email, roleType } = body as { email: string; roleType: RoleType };

        if (!email || !isValidEmail(email)) {
            return Response.json(
                { error: 'Invalid email address' },
                { status: 400 }
            );
        }

        if (!roleType || !['ADMIN', 'FARMER'].includes(roleType)) {
            return Response.json(
                { error: 'Invalid role type' },
                { status: 400 }
            );
        }

        // Only admins can change roles
        const currentUser = await prisma.user.findUnique({
            where: { auth0Id: session.user.sub }
        });

        if (!currentUser) {
            return Response.json(
                { error: 'Current user not found' },
                { status: 404 }
            );
        }

        if (currentUser.roleType !== 'ADMIN') {
            return Response.json(
                { error: 'Only administrators can modify user roles' },
                { status: 403 }
            );
        }

        const targetUser = await prisma.user.findUnique({
            where: { email }
        });

        if (!targetUser) {
            return Response.json(
                { error: 'Target user not found' },
                { status: 404 }
            );
        }

        const updatedUser = await prisma.user.update({
            where: { email },
            data: { roleType }
        });

        return Response.json({
            message: 'User role updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('User update error:', error);
        return Response.json(
            { error: 'Failed to update user role' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await authenticateUser();
        if (session instanceof Response) return session;

        const currentUser = await prisma.user.findUnique({
            where: { auth0Id: session.user.sub }
        });

        if (!currentUser) {
            return Response.json(
                { error: 'User not found' },
                { status: 404 }
            );
        }

        // Only admins can list all users
        if (currentUser.roleType === 'ADMIN') {
            const users = await prisma.user.findMany({
                select: {
                    id: true,
                    name: true,
                    email: true,
                    roleType: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
            return Response.json({ users });
        }

        // Non-admin users can only see their own info
        return Response.json({
            user: {
                id: currentUser.id,
                name: currentUser.name,
                email: currentUser.email,
                roleType: currentUser.roleType,
                createdAt: currentUser.createdAt,
                updatedAt: currentUser.updatedAt
            }
        });
    } catch (error) {
        console.error('User fetch error:', error);
        return Response.json(
            { error: 'Failed to fetch user data' },
            { status: 500 }
        );
    }
}