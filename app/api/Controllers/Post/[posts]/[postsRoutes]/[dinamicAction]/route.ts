import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { prisma } from 'app/lib/prisma';
import { getCurrentUser } from 'app/lib/auth';
import { ApiResponse, Post, PostCreate } from 'app/types/api';

type RouteContext = {
  params: {
    posts: string;
    postsRoutes: string;
    dinamicAction: string;
  };
};

export async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const posts = await params.posts;
    const postsRoutes = await params.postsRoutes;
    const dinamicAction = await params.dinamicAction;

    // Handle posts pagination
    if (posts === 'posts' && postsRoutes === "count") {
      const limit = 5;
      const count = Number(dinamicAction) || 0;
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
    if (posts === 'posts' && postsRoutes === "search") {
      const posts = await prisma.post.findMany({
        where: {
          title: {
            contains: dinamicAction.toLowerCase()
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
    if (posts === 'post' && postsRoutes === "id") {
      const post = await prisma.post.findUnique({
        where: {
          id: parseInt(dinamicAction)
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

    if (posts === 'posts' && postsRoutes === "retrieve" && dinamicAction === "all") {
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
  { params }: RouteContext
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
  { params }: RouteContext
) {
  try {
    const postsRoutes = await params.postsRoutes;
    const updateUser = await getCurrentUser(request);
    const updateData = await request.json() as PostCreate;

    const existingPost = await prisma.post.findUnique({
      where: { id: parseInt(postsRoutes) }
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
      where: { id: parseInt(postsRoutes) },
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
  { params }: RouteContext
) {
  try {
    const postsRoutes = await params.postsRoutes;
    const deleteUser = await getCurrentUser(request);
    
    const postToDelete = await prisma.post.findUnique({
      where: { id: parseInt(postsRoutes) }
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
      where: { id: parseInt(postsRoutes) }
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
