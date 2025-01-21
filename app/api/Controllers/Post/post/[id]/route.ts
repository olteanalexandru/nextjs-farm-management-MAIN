import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { ApiResponse, Post, PostUpdate, transformPrismaPost } from 'app/types/api';
import { getSession } from '@auth0/nextjs-auth0';

const prisma = new PrismaClient();

async function authenticateUser(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session?.user) {
      return Response.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    return session;
  } catch (error) {
    console.error('Authentication error:', error);
    return Response.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const post = await prisma.post.findUnique({
      where: {
        id: parseInt(params.id)
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
      return Response.json({ 
        error: 'Post not found',
        status: 404
      }, { status: 404 });
    }

    const transformedPost = transformPrismaPost(post);
    return Response.json({ data: transformedPost });
  } catch (error) {
    console.error('GET request error:', error);
    return Response.json({ 
      error: 'Internal server error',
      status: 500
    }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await authenticateUser(request);
    if (session instanceof Response) return session;

    const postId = parseInt(params.id);
    const data: PostUpdate = await request.json();

    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true }
    });

    if (!existingPost) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub }
    });

    if (!currentUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    if (existingPost.userId !== currentUser.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        title: data.title,
        brief: data.brief,
        description: data.description,
        imageUrl: data.imageUrl
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

    const transformedPost = transformPrismaPost(updatedPost);
    return Response.json({ data: transformedPost });
  } catch (error) {
    console.error('PUT request error:', error);
    return Response.json({ 
      error: 'Internal server error',
      status: 500
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await authenticateUser(request);
    if (session instanceof Response) return session;

    const postId = parseInt(params.id);

    const existingPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { userId: true }
    });

    if (!existingPost) {
      return Response.json({ error: 'Post not found' }, { status: 404 });
    }

    const currentUser = await prisma.user.findUnique({
      where: { auth0Id: session.user.sub }
    });

    if (!currentUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    if (existingPost.userId !== currentUser.id) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    await prisma.post.delete({
      where: { id: postId }
    });

    return Response.json({ success: true });
  } catch (error) {
    console.error('DELETE request error:', error);
    return Response.json({ 
      error: 'Internal server error',
      status: 500
    }, { status: 500 });
  }
}
