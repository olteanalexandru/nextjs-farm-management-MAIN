import { NextResponse } from 'next/server';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaClient } from '@prisma/client';

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  if (error instanceof PrismaClientKnownRequestError) {
    // Handle Prisma errors
    switch (error.code) {
      case 'P2002':
        return NextResponse.json(
          { error: 'A unique constraint would be violated.' },
          { status: 409 }
        );
      case 'P2025':
        return NextResponse.json(
          { error: 'Record not found.' },
          { status: 404 }
        );
      default:
        return NextResponse.json(
          { error: 'Database error occurred.' },
          { status: 500 }
        );
    }
  }

  return NextResponse.json(
    { error: 'An unexpected error occurred.' },
    { status: 500 }
  );
}

export function createSuccessResponse(data: any, status = 200) {
  return NextResponse.json({ data }, { status });
}

// Pagination utility
export function getPaginationParams(request: Request) {
  const url = new URL(request.url);
  return {
    page: parseInt(url.searchParams.get('page') || '1'),
    limit: parseInt(url.searchParams.get('limit') || '10'),
    orderBy: url.searchParams.get('orderBy') || 'createdAt',
    order: (url.searchParams.get('order') || 'desc') as 'asc' | 'desc'
  };
}

// Query builder utility
export function buildWhereClause(filters: Record<string, any>) {
  const where: any = {};
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'string') {
        where[key] = { contains: value, mode: 'insensitive' };
      } else {
        where[key] = value;
      }
    }
  });

  return where;
}


export async function deleteCropWithRelations(cropId: number) {
  const prisma = new PrismaClient();

  try {
    await prisma.$transaction(async (tx) => {
      // Delete related records first
      await tx.cropDetail.deleteMany({
        where: { cropId }
      });

      await tx.userCropSelection.deleteMany({
        where: { cropId }
      });

      await tx.rotationPlan.deleteMany({
        where: { cropId }
      });

      // Finally delete the crop
      await tx.crop.delete({
        where: { id: cropId }
      });
    });
  } catch (error) {
    throw new Error(`Failed to delete crop: ${error.message}`);
  }
}

export async function deleteUserWithRelations(userId: string) {
  const prisma = new PrismaClient();

  try {
    await prisma.$transaction(async (tx) => {
      // Delete all related records in the correct order
      await tx.userCropSelection.deleteMany({
        where: { userId }
      });

      await tx.post.deleteMany({
        where: { userId }
      });

      // Delete rotations and their plans
      const rotations = await tx.rotation.findMany({
        where: { userId }
      });

      for (const rotation of rotations) {
        await tx.rotationPlan.deleteMany({
          where: { rotationId: rotation.id }
        });
      }

      await tx.rotation.deleteMany({
        where: { userId }
      });

      // Delete crops and their details
      const crops = await tx.crop.findMany({
        where: { userId }
      });

      for (const crop of crops) {
        await tx.cropDetail.deleteMany({
          where: { cropId: crop.id }
        });
      }

      await tx.crop.deleteMany({
        where: { userId }
      });

      // Finally delete the user
      await tx.user.delete({
        where: { id: userId }
      });
    });
  } catch (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
}