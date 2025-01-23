import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from 'app/lib/auth';
import { ApiResponse, RecommendationResponse } from 'app/types/api';
import { transformCropWithDetails } from '../../utils/helpers';

const prisma = new PrismaClient();

export const GET = withApiAuthRequired(async function GET(
  request: NextRequest
) {
  try {
    const user = await getCurrentUser(request);
    const selections = await prisma.userCropSelection.findMany({
      where: { userId: user.id },
      include: { 
        crop: {
          include: {
            details: true
          }
        }
      }
    });

    const selectedCrops = selections.flatMap(selection => 
      Array(selection.selectionCount).fill(transformCropWithDetails(selection.crop))
    );

    const response: ApiResponse<RecommendationResponse[]> = { 
      crops: selectedCrops,
      status: 200
    };
    return Response.json(response);
  } catch (error) {
    console.error('GET selected crops error:', error);
    const response: ApiResponse = { 
      error: 'Internal server error',
      status: 500
    };
    return Response.json(response, { status: 500 });
  }
});
