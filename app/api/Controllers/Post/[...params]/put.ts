import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from 'app/lib/auth';
import { ApiResponse, Post, PostCreate } from 'app/types/api';

const prisma = new PrismaClient();

export const PUT = withApiAuthRequired(async function PUT(
  request: NextRequest,
  { params }: { params: { params: string[] } }
) {
  try {
    const [action, postId] = params.params;
    const auth0User = await getCurrentUser(request);
    const updateData = await request.json() as PostCreate;

    // Get the user from our database using Auth0 ID
    const dbUser = await prisma.user.findUnique({
      where: { auth0Id: auth0User.auth0Id } // Change this line - use auth0Id instead of sub
    });

    if (!dbUser) {
      console.log('Auth0 User:', auth0User); // Add logging for debugging
      const response: ApiResponse = { 
        error: 'User not found in database',
        status: 404
      };
      return Response.json(response, { status: 404 });
    }

    const existingPost = await prisma.post.findUnique({
      where: { id: parseInt(postId) }
    });

    if (!existingPost) {
      const response: ApiResponse = { 
        error: 'Post not found',
        status: 404
      };
      return Response.json(response, { status: 404 });
    }

    if (existingPost.userId !== dbUser.id) {
      const response: ApiResponse = { 
        error: 'Not authorized',
        status: 401
      };
      return Response.json(response, { status: 401 });
    }

    const updatedPost = await prisma.post.update({
      where: { id: parseInt(postId) },
      data: {
        title: updateData.title,
        brief: updateData.brief,
        description: updateData.description,
        image: updateData.image
      },
      include: {
        user: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    const response: ApiResponse<Post> = { data: updatedPost };
    return Response.json(response);
  } catch (error) {
    console.error('PUT request error:', error);
    const response: ApiResponse = { 
      error: 'Internal server error',
      status: 500
    };
    return Response.json(response, { status: 500 });
  }
});
