import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '../../../lib/prisma';
import { getSession } from '@auth0/nextjs-auth0';

type RoleType = 'ADMIN' | 'FARMER';

interface UserData {
    auth0Id: string;
    name: string | null;
    email: string;
    picture: string | null;
    roleType: RoleType;
}

// Helper function to handle authentication
async function authenticateUser(request: NextRequest) {
    try {
        const response = NextResponse.next();
        const session = await getSession(request, response);
        if (!session?.user) {
            return NextResponse.json(
                { error: 'Authentication required' },
                { status: 401 }
            );
        }
        return session;
    } catch (error) {
        console.error('Authentication error:', error);
        return NextResponse.json(
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

// Helper function to determine user role
function determineUserRole(email: string): RoleType {
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail) {
        console.warn('ADMIN_EMAIL environment variable is not set');
        return 'FARMER';
    }
    
    // Convert both emails to lowercase for case-insensitive comparison
    return email.toLowerCase() === adminEmail.toLowerCase() ? 'ADMIN' : 'FARMER';
}

export async function POST(request: NextRequest) {
    try {
        const session = await authenticateUser(request);
        if (session instanceof NextResponse) return session;

        const { email, name, picture } = session.user;
        const auth0Id = session.user.sub;

        if (!email || !isValidEmail(email)) {
            return NextResponse.json(
                { error: 'Invalid email address' },
                { status: 400 }
            );
        }

        // Determine role based on email
        const roleType = determineUserRole(email);

        // Create or update user in database
        const user = await prisma.user.upsert({
            where: { auth0Id },
            update: {
                name,
                email,
                picture,
                roleType
            },
            create: {
                auth0Id,
                name,
                email,
                picture,
                roleType
            }
        });

        return NextResponse.json({
            message: 'User created/updated successfully',
            user
        });
    } catch (error) {
        console.error('User creation error:', error);
        return NextResponse.json(
            { error: 'Failed to create/update user' },
            { status: 500 }
        );
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await authenticateUser(request);
        if (session instanceof NextResponse) return session;

        const body = await request.json();
        const { email, roleType } = body as { email: string; roleType: RoleType };

        if (!email || !isValidEmail(email)) {
            return NextResponse.json(
                { error: 'Invalid email address' },
                { status: 400 }
            );
        }

        if (!roleType || !['ADMIN', 'FARMER'].includes(roleType)) {
            return NextResponse.json(
                { error: 'Invalid role type' },
                { status: 400 }
            );
        }

        // Only admins can change roles
        const currentUser = await prisma.user.findUnique({
            where: { auth0Id: session.user.sub }
        });

        if (!currentUser) {
            return NextResponse.json(
                { error: 'Current user not found' },
                { status: 404 }
            );
        }

        if (currentUser.roleType !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Only administrators can modify user roles' },
                { status: 403 }
            );
        }

        const targetUser = await prisma.user.findUnique({
            where: { email }
        });

        if (!targetUser) {
            return NextResponse.json(
                { error: 'Target user not found' },
                { status: 404 }
            );
        }

        const updatedUser = await prisma.user.update({
            where: { email },
            data: { roleType }
        });

        return NextResponse.json({
            message: 'User role updated successfully',
            user: updatedUser
        });
    } catch (error) {
        console.error('User update error:', error);
        return NextResponse.json(
            { error: 'Failed to update user role' },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await authenticateUser(request);
        if (session instanceof NextResponse) return session;

        const currentUser = await prisma.user.findUnique({
            where: { auth0Id: session.user.sub }
        });

        if (!currentUser) {
            return NextResponse.json(
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
                    picture: true,
                    roleType: true,
                    createdAt: true,
                    updatedAt: true
                }
            });
            return NextResponse.json({ users });
        }

        // Non-admin users can only see their own info
        return NextResponse.json({
            user: {
                id: currentUser.id,
                name: currentUser.name,
                email: currentUser.email,
                picture: currentUser.picture,
                roleType: currentUser.roleType,
                createdAt: currentUser.createdAt,
                updatedAt: currentUser.updatedAt
            }
        });
    } catch (error) {
        console.error('User fetch error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch user data' },
            { status: 500 }
        );
    }
}
