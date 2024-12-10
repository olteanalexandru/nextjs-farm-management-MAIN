import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { prisma } from 'app/lib/prisma';
import { getCurrentUser } from 'app/lib/auth';
import { ApiResponse } from 'app/types/api';

export const DELETE = withApiAuthRequired(async function DELETE(
  request: NextRequest,
  { params }: { params: { params: string[] } }
) {
  try {
    const [action, postId] = params.params;
    const auth0User = await getCurrentUser(request);
    
    // Get the user from our database using Auth0 ID
    const dbUser = await prisma.user.findUnique({
      where: { auth0Id: auth0User.id }
    });

    if (!dbUser) {
      const response: ApiResponse = { 
        error: 'User not found in database',
        status: 404
      };
      return Response.json(response, { status: 404 });
    }

    const postToDelete = await prisma.post.findUnique({
      where: { id: parseInt(postId) }
    });

    if (!postToDelete) {
      const response: ApiResponse = { 
        error: 'Post not found',
        status: 404
      };
      return Response.json(response, { status: 404 });
    }

    if (postToDelete.userId !== dbUser.id && !dbUser.roleType?.includes('ADMIN')) {
      const response: ApiResponse = { 
        error: 'Not authorized',
        status: 401
      };
      return Response.json(response, { status: 401 });
    }

    await prisma.post.delete({
      where: { id: parseInt(postId) }
    });

    const response: ApiResponse = { 
      message: 'Post deleted',
      status: 200
    };
    return Response.json(response);
  } catch (error) {
    console.error('DELETE request error:', error);
    const response: ApiResponse = { 
      error: 'Internal server error',
      status: 500
    };
    return Response.json(response, { status: 500 });
  }
});
