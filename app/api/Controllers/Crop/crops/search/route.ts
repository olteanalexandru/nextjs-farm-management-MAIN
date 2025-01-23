import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { PrismaClient } from '@prisma/client';
import { ApiResponse, RecommendationResponse } from 'app/types/api';
import { transformCropWithDetails } from '../utils/helpers';

const prisma = new PrismaClient();

export const GET = withApiAuthRequired(async function GET(
  request: NextRequest
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const searchTerm = searchParams.get('term');

    if (!searchTerm) {
      const response: ApiResponse = { 
        error: 'Search term is required',
        status: 400
      };
      return Response.json(response, { status: 400 });
    }

    const crops = await prisma.crop.findMany({
      where: {
        cropName: {
          contains: searchTerm
        },
        deleted: null
      },
      include: {
        details: true
      }
    });

    const transformedCrops = crops.map(transformCropWithDetails);
    const response: ApiResponse<RecommendationResponse[]> = { 
      crops: transformedCrops,
      status: 200 
    };
    return Response.json(response);
  } catch (error) {
    console.error('GET search error:', error);
    const response: ApiResponse = { 
      error: 'Internal server error',
      status: 500
    };
    return Response.json(response, { status: 500 });
  }
});
