import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getCurrentUser } from '@/app/lib/auth';
import type { ApiResponse } from '@/types';

export async function GET(request: NextRequest, context: any) {
  const { params } = context;
  
  try {
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
  } catch (error) {
    console.error('Request error', error);
    return NextResponse.json({ error: 'Error fetching posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: any) {
  const { params } = context;
  
  try {
    const user = await getCurrentUser(request);
    const { title, brief, description, image } = await request.json();

    if (!title || !brief || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        userId: user.sub,
        title,
        brief,
        description,
        image
      }
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Request error', error);
    return NextResponse.json({ error: 'Error creating post' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  const { params } = context;
  
  try {
    const user = await getCurrentUser(request);
    const { title, brief, description, image } = await request.json();

    const post = await prisma.post.findUnique({
      where: { id: parseInt(params.postsRoutes) }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.userId !== user.sub) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }

    const updatedPost = await prisma.post.update({
      where: { id: parseInt(params.postsRoutes) },
      data: {
        title,
        brief,
        description,
        image
      }
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error('Request error', error);
    return NextResponse.json({ error: 'Error updating post' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: any) {
  const { params } = context;
  
  try {
    const user = await getCurrentUser(request);
    
    const post = await prisma.post.findUnique({
      where: { id: parseInt(params.postsRoutes) }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.userId !== user.sub && !user.userRoles?.includes('admin')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }

    await prisma.post.delete({
      where: { id: parseInt(params.postsRoutes) }
    });

    return NextResponse.json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Request error', error);
    return NextResponse.json({ error: 'Error deleting post' }, { status: 500 });
  }
}


