import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getSession } from '@auth0/nextjs-auth0';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

type RoleType = 'ADMIN' | 'FARMER';

interface UserData {
    id: string;
    auth0Id: string;
    name: string;
    email: string;
    picture: string | null;
    roleType: RoleType;
    createdAt: Date;
    updatedAt: Date;
}

// Helper function to handle authentication
async function authenticateUser(request: NextRequest) {
    try {
        const session = await getSession();
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

function determineUserRole(email: string): RoleType {
    const adminEmail = process.env.ADMIN_EMAIL;
    return email.toLowerCase() === adminEmail?.toLowerCase() ? 'ADMIN' : 'FARMER';
}

export async function GET(
    request: NextRequest,
    { params }: { params: { Action: string } }
) {
    try {
        const session = await authenticateUser(request);
        if (session instanceof NextResponse) return session;

        const action = params.Action;

        const currentUser = await prisma.user.findUnique({
            where: { auth0Id: session.user.sub }
        });

        if (!currentUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (action === 'me') {
            return NextResponse.json({ user: currentUser });
        }

        if (action === 'all' && currentUser.roleType === 'ADMIN') {
            const users = await prisma.user.findMany();
            return NextResponse.json({ users });
        }

        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { Action: string } }
) {
    try {
        const session = await authenticateUser(request);
        if (session instanceof NextResponse) return session;

        if (params.Action !== 'create') {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const { email, name, picture } = session.user;
        const auth0Id = session.user.sub;

        const roleType = determineUserRole(email);

        const user = await prisma.user.upsert({
            where: { auth0Id },
            update: { name, email, picture, roleType },
            create: { id: uuidv4(), auth0Id, name, email, picture, roleType }
        });

        return NextResponse.json({ user });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { Action: string } }
) {
    try {
        const session = await authenticateUser(request);
        if (session instanceof NextResponse) return session;

        if (params.Action !== 'role') {
            return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
        }

        const body = await request.json();
        const { email, roleType } = body as { email: string; roleType: RoleType };

        const currentUser = await prisma.user.findUnique({
            where: { auth0Id: session.user.sub }
        });

        if (!currentUser || currentUser.roleType !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const updatedUser = await prisma.user.update({
            where: { email },
            data: { roleType }
        });

        return NextResponse.json({ user: updatedUser });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { Action: string } }
) {
    try {
        const session = await authenticateUser(request);
        if (session instanceof NextResponse) return session;

        const userId = params.Action;

        const currentUser = await prisma.user.findUnique({
            where: { auth0Id: session.user.sub }
        });

        if (!currentUser || currentUser.roleType !== 'ADMIN') {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 403 }
            );
        }

        const deletedUser = await prisma.user.delete({
            where: { id: userId }
        });

        return NextResponse.json({ user: deletedUser });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Server error' }, { status: 500 });
    }
}
