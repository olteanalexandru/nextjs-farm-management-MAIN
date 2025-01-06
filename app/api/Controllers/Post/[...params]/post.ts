import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from 'app/lib/auth';
import { ApiResponse, Post, PostCreate } from 'app/types/api';

const prisma = new PrismaClient();

export const POST = withApiAuthRequired(async function POST(
  request: NextRequest,
  { params }: { params: { params: string[] } }
) {
  try {
    const auth0User = await getCurrentUser(request);
    const postData = await request.json() as PostCreate;
    const { title, brief, description, image } = postData;

    if (!title || !brief || !description) {
      const response: ApiResponse = { 
        error: 'Missing required fields',
        status: 400
      };
      return Response.json(response, { status: 400 });
    }

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

    const post = await prisma.post.create({
      data: {
        userId: dbUser.id, // Use the database user ID
        title,
        brief,
        description,
        image
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

    const response: ApiResponse<Post> = { data: post };
    return Response.json(response, { status: 201 });
  } catch (error) {
    console.error('POST request error:', error);
    const response: ApiResponse = { 
      error: 'Internal server error',
      status: 500
    };
    return Response.json(response, { status: 500 });
  }
});
