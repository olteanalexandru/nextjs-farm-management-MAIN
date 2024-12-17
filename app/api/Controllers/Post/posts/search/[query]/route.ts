import { NextRequest } from 'next/server';
import { prisma } from 'app/lib/prisma';
import { ApiResponse, Post } from 'app/types/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { query: string } }
) {
  try {
    const posts = await prisma.post.findMany({
      where: {
        title: {
          contains: params.query.toLowerCase()
        }
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

    return Response.json({ posts });
  } catch (error) {
    console.error('GET request error:', error);
    return Response.json({ 
      error: 'Internal server error',
      status: 500
    }, { status: 500 });
  }
}
