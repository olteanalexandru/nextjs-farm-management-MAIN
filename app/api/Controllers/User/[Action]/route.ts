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



export async function DELETE(request: NextRequest , { params }) {
    try {


        const session = await authenticateUser();
        if (session instanceof Response) return session;

        const id = params.Action

        if (!id) {
            return Response.json(
                { error: 'User ID is required' },
                { status: 400 }
            );
        }

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
                { error: 'Only administrators can delete users' },
                { status: 403 }
            );
        }

        const targetUser = await prisma.user.findUnique({
            where: { id: parseInt(id as string) }
        });

        if (!targetUser) {
            return Response.json(
                { error: 'Target user not found' },
                { status: 404 }
            );
        }

        await prisma.user.delete({
            where: { id: parseInt(id as string) }
        });

        return Response.json({
            message: 'User deleted successfully',
            user: targetUser
        });
    } catch (error) {
        console.error('User deletion error:', error);
        return Response.json(
            { error: 'Failed to delete user' },
            { status: 500 }
        );
    }
}