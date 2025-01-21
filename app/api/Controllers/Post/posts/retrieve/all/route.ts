import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ApiResponse, Post, transformPrismaPost } from 'app/types/api';

const prisma = new PrismaClient();

export async function GET() {
  try {
    const posts = await prisma.post.findMany({
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

    const transformedPosts = posts.map(transformPrismaPost);
    const response: ApiResponse<Post[]> = { posts: transformedPosts };
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
