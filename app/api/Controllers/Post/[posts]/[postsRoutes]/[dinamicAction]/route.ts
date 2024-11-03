import { NextResponse, NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { prisma } from '@/app/lib/prisma';
import { getCurrentUser } from '@/app/lib/auth';

async function handler(request: NextRequest, context: any) {
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
          return NextResponse.json({ posts, message });
        }

        if (params.posts === 'posts' && params.postsRoutes === "search") {
          const posts = await prisma.post.findMany({
            where: {
              title: {
                contains: params.dinamicAction,
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

          return NextResponse.json({ posts });
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

          return NextResponse.json({ posts: post });
        }
        break;

      case 'POST':
        const user = await getCurrentUser(request);
        const { title, brief, description, image } = await request.json();

        if (!title || !brief || !description) {
          return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
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

        return NextResponse.json(post, { status: 201 });
        break;

      case 'PUT':
        const updateUser = await getCurrentUser(request);
        const updateData = await request.json();

        const existingPost = await prisma.post.findUnique({
          where: { id: parseInt(params.postsRoutes) }
        });

        if (!existingPost) {
          return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        if (existingPost.userId !== updateUser.id) {
          return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
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

        return NextResponse.json(updatedPost);
        break;

      case 'DELETE':
        const deleteUser = await getCurrentUser(request);
        
        const postToDelete = await prisma.post.findUnique({
          where: { id: parseInt(params.postsRoutes) }
        });

        if (!postToDelete) {
          return NextResponse.json({ error: 'Post not found' }, { status: 404 });
        }

        if (postToDelete.userId !== deleteUser.id && !deleteUser.userRoles?.includes('admin')) {
          return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
        }

        await prisma.post.delete({
          where: { id: parseInt(params.postsRoutes) }
        });

        return NextResponse.json({ message: 'Post deleted' });
        break;

      default:
        return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }
  } catch (error) {
    console.error('Request error', error);
    return NextResponse.json({ error: 'Error processing request' }, { status: 500 });
  }
}

// Wrap all methods with Auth0's withApiAuthRequired
export const GET = withApiAuthRequired(handler);
export const POST = withApiAuthRequired(handler);
export const PUT = withApiAuthRequired(handler);
export const DELETE = withApiAuthRequired(handler);
