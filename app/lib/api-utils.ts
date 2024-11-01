import { NextResponse } from 'next/server';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

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