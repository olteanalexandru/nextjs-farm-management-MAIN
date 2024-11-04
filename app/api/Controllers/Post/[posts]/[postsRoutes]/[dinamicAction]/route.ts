import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { prisma } from '@/app/lib/prisma';
import { getCurrentUser } from '@/app/lib/auth';

type RouteContext = {
  params: {
    posts: string;
    postsRoutes: string;
    dinamicAction: string;
  };
};

type PostData = {
  title: string;
  brief: string;
  description: string;
  image?: string;
};

export const GET = withApiAuthRequired(async function GET(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    // Handle posts pagination
    if (params.posts === 'posts' && params.postsRoutes === "count") {
      const limit = 5;
      const count = Number(params.dinamicAction) || 0;
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

      const message = posts.length === 0 ? "No more posts" : undefined;
      return Response.json({ posts, message });
    }

    // Handle post search
    if (params.posts === 'posts' && params.postsRoutes === "search") {
      const posts = await prisma.post.findMany({
        where: {
          title: {
            contains: params.dinamicAction,
            mode: 'insensitive'
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
    }

    // Handle single post fetch
    if (params.posts === 'post' && params.postsRoutes === "id") {
      const post = await prisma.post.findUnique({
        where: {
          id: parseInt(params.dinamicAction)
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
        return Response.json({ error: 'Post not found' }, { status: 404 });
      }

      return Response.json({ posts: post });
    }

    if (params.posts === 'posts' && params.postsRoutes === "retrieve" && params.dinamicAction === "all") {
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

      return Response.json({ posts });
    }

    return Response.json({ error: 'Invalid route' }, { status: 400 });
  } catch (error) {
    console.error('GET request error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  } 
});

export const POST = withApiAuthRequired(async function POST(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const user = await getCurrentUser(request);
    const postData = await request.json() as PostData;
    const { title, brief, description, image } = postData;

    if (!title || !brief || !description) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        userId: user.id,
        title,
        brief,
        description,
        image
      }
    });

    return Response.json(post, { status: 201 });
  } catch (error) {
    console.error('POST request error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const PUT = withApiAuthRequired(async function PUT(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const updateUser = await getCurrentUser(request);
    const updateData = await request.json() as PostData;

    const existingPost = await prisma.post.findUnique({
      where: { id: parseInt(params.postsRoutes) }
    });

    if (!existingPost) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    if (existingPost.userId !== updateUser.id) {
      return Response.json({ error: 'Not authorized' }, { status: 401 });
    }

    const updatedPost = await prisma.post.update({
      where: { id: parseInt(params.postsRoutes) },
      data: {
        title: updateData.title,
        brief: updateData.brief,
        description: updateData.description,
        image: updateData.image
      }
    });

    return Response.json(updatedPost);
  } catch (error) {
    console.error('PUT request error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});

export const DELETE = withApiAuthRequired(async function DELETE(
  request: NextRequest,
  { params }: RouteContext
) {
  try {
    const deleteUser = await getCurrentUser(request);
    
    const postToDelete = await prisma.post.findUnique({
      where: { id: parseInt(params.postsRoutes) }
    });

    if (!postToDelete) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    if (postToDelete.userId !== deleteUser.id && !deleteUser.userRoles?.includes('admin')) {
      return Response.json({ error: 'Not authorized' }, { status: 401 });
    }

    await prisma.post.delete({
      where: { id: parseInt(params.postsRoutes) }
    });

    return Response.json({ message: 'Post deleted' });
  } catch (error) {
    console.error('DELETE request error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});