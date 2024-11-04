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

async function handler(request: NextRequest, context: RouteContext) {
  const { params } = context;
  const method = request.method;

  try {
    switch (method) {
      case 'GET':
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

        return Response.json({ error: 'Invalid route' }, { status: 400 });

      case 'POST':
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

      case 'PUT':
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

      case 'DELETE':
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

      default:
        return Response.json({ error: 'Method not allowed' }, { status: 405 });
    }
  } catch (error) {
    console.error('Request error:', error);
    if (error instanceof Error && error.message === 'Not authenticated') {
      return Response.json({ error: 'Not authenticated' }, { status: 401 });
    }
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Wrap all methods with Auth0's withApiAuthRequired
export const GET = withApiAuthRequired(handler);
export const POST = withApiAuthRequired(handler);
export const PUT = withApiAuthRequired(handler);
export const DELETE = withApiAuthRequired(handler);
