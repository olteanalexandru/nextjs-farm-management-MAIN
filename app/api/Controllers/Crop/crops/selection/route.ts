import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from 'app/lib/auth';
import { ApiResponse } from 'app/types/api';

const prisma = new PrismaClient();

export const PUT = withApiAuthRequired(async function PUT(
  request: NextRequest
) {
  try {
    const user = await getCurrentUser(request);
    const { cropId, selectare } = await request.json();

    if (!cropId) {
      const response: ApiResponse = { 
        error: 'Crop ID is required',
        status: 400
      };
      return Response.json(response, { status: 400 });
    }

    const numericCropId = parseInt(cropId);
    if (isNaN(numericCropId)) {
      const response: ApiResponse = { 
        error: 'Invalid crop ID',
        status: 400
      };
      return Response.json(response, { status: 400 });
    }

    const selection = await prisma.userCropSelection.upsert({
      where: {
        userId_cropId: {
          userId: user.id,
          cropId: numericCropId
        }
      },
      update: {
        selectionCount: selectare ? 1 : 0
      },
      create: {
        userId: user.id,
        cropId: numericCropId,
        selectionCount: selectare ? 1 : 0
      }
    });

    const response: ApiResponse = { 
      data: selection,
      status: 200
    };
    return Response.json(response);
  } catch (error) {
    console.error('PUT selection error:', error);
    const response: ApiResponse = { 
      error: error instanceof Error ? error.message : 'Internal server error',
      status: 500
    };
    return Response.json(response, { status: 500 });
  }
});
