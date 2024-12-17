import { NextRequest } from 'next/server';
import { prisma } from 'app/lib/prisma';
import { ApiResponse, Post } from 'app/types/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const post = await prisma.post.findUnique({
      where: {
        id: parseInt(params.id)
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

    if (!post) {
      return Response.json({ 
        error: 'Post not found',
        status: 404
      }, { status: 404 });
    }

    return Response.json({ posts: [post] });
  } catch (error) {
    console.error('GET request error:', error);
    return Response.json({ 
      error: 'Internal server error',
      status: 500
    }, { status: 500 });
  }
}
