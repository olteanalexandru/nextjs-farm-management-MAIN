import { NextRequest } from 'next/server';
import { prisma } from 'app/lib/prisma';
import { ApiResponse, Post, transformPrismaPost } from 'app/types/api';


export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
    const limit = Math.min(100, Math.max(1, Number(searchParams.get('limit') ?? '20')));
    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      prisma.post.findMany({
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: { select: { name: true, email: true } }
        }
      }),
      prisma.post.count()
    ]);

    const transformedPosts = posts.map(transformPrismaPost);
    const response: ApiResponse<Post[]> = { posts: transformedPosts, total, page, limit };
    return Response.json(response);
  } catch (error) {
    console.error('GET request error:', error);
    const response: ApiResponse = { 
      error: 'Internal server error',
      status: 500
    };
    return Response.json(response, { status: 500 });
  }
}
