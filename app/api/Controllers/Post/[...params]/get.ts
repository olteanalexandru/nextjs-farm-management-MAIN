import { NextRequest } from 'next/server';
import { prisma } from 'app/lib/prisma';
import { ApiResponse, Post } from 'app/types/api';

export async function GET(
  request: NextRequest,
  { params }: { params: { params: string[] } }
) {
  try {
    const [action, param1, param2] = params.params;

    // Handle posts pagination
    if (action === 'posts' && param1 === "count") {
      const limit = 5;
      const count = Number(param2) || 0;
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

      const response: ApiResponse<Post> = {
        posts,
        message: posts.length === 0 ? "No more posts" : undefined
      };
      return Response.json(response);
    }

    // Handle post search
    if (action === 'posts' && param1 === "search") {
      const posts = await prisma.post.findMany({
        where: {
          title: {
            contains: param2.toLowerCase()
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

      const response: ApiResponse<Post> = { posts };
      return Response.json(response);
    }

    // Handle single post fetch
    if (action === 'post' && param1 === "id") {
      const post = await prisma.post.findUnique({
        where: {
          id: parseInt(param2)
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
        const response: ApiResponse<Post> = { 
          error: 'Post not found',
          status: 404
        };
        return Response.json(response, { status: 404 });
      }

      const response: ApiResponse<Post> = { posts: [post] };
      return Response.json(response);
    }

    if (action === 'posts' && param1 === "retrieve" && param2 === "all") {
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

      const response: ApiResponse<Post> = { posts };
      return Response.json(response);
    }

    const response: ApiResponse = { 
      error: 'Invalid route',
      status: 400
    };
    return Response.json(response, { status: 400 });
  } catch (error) {
    console.error('GET request error:', error);
    const response: ApiResponse = { 
      error: 'Internal server error',
      status: 500
    };
    return Response.json(response, { status: 500 });
  } 
}
