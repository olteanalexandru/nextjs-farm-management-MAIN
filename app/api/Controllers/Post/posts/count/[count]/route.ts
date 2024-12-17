import { NextRequest } from 'next/server';
import { prisma } from 'app/lib/prisma';
import { ApiResponse, Post } from 'app/types/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { count: string } }
) {
  try {
    const limit = 5;
    const count = Number(params.count) || 0;
    const skip = count * limit;

    const posts = await prisma.post.findMany({
      skip,
      take: limit,
      orderBy: {
        createdAt: 'desc'
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

    return Response.json({
      posts,
      message: posts.length === 0 ? "No more posts" : undefined
    });
  } catch (error) {
    console.error('GET request error:', error);
    return Response.json({ 
      error: 'Internal server error',
      status: 500
    }, { status: 500 });
  }
}
