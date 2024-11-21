import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { prisma } from 'app/lib/prisma';
import { getCurrentUser } from 'app/lib/auth';
import { ApiResponse, Post, PostCreate } from 'app/types/api';

interface RouteContext {
  params: {
    params: string[];
  };
}

export async function GET(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const [action, param1, param2] = context.params.params;

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

export const POST = withApiAuthRequired(async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getCurrentUser(request);
    const postData = await request.json() as PostCreate;
    const { title, brief, description, image } = postData;

    if (!title || !brief || !description) {
      const response: ApiResponse = { 
        error: 'Missing required fields',
        status: 400
      };
      return Response.json(response, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        userId: user.id,
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

export const PUT = withApiAuthRequired(async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const [action, postId] = context.params.params;
    const updateUser = await getCurrentUser(request);
    const updateData = await request.json() as PostCreate;

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

    if (existingPost.userId !== updateUser.id) {
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

export const DELETE = withApiAuthRequired(async function DELETE(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const [action, postId] = context.params.params;
    const deleteUser = await getCurrentUser(request);
    
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

    if (postToDelete.userId !== deleteUser.id && !deleteUser.userRoles?.includes('admin')) {
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
