import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from 'app/lib/auth';
import { ApiResponse, DetailType, RecommendationResponse } from 'app/types/api';
import { toDecimal, transformCropWithDetails } from '../utils/helpers';

const prisma = new PrismaClient();

export const GET = withApiAuthRequired(async function GET(
  request: NextRequest
) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const searchTerm = searchParams.get('search');

    const whereClause = {
      cropType: {
        equals: 'RECOMMENDATION'
      },
      deleted: null,
      ...(searchTerm ? {
        cropName: {
          contains: searchTerm,
        }
      } : {})
    };

    const recommendations = await prisma.crop.findMany({
      where: whereClause,
      include: {
        details: true,
        user: {
          select: {
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const transformedRecommendations = recommendations.map(transformCropWithDetails);
    
    const response: ApiResponse<RecommendationResponse[]> = { 
      crops: transformedRecommendations,
      status: 200
    };
    return Response.json(response);
  } catch (error) {
    console.error('GET recommendations error:', error);
    const response: ApiResponse = { 
      error: 'Internal server error',
      status: 500
    };
    return Response.json(response, { status: 500 });
  }
});

export const POST = withApiAuthRequired(async function POST(
  request: NextRequest
) {
  try {
    const user = await getCurrentUser(request);
    if (!user?.id) {
      const response: ApiResponse = { 
        error: 'User not found or not properly authenticated',
        status: 401
      };
      return Response.json(response, { status: 401 });
    }

    const recommendationData = await request.json();

    if (!recommendationData.cropName) {
      const response: ApiResponse = {
        error: 'Crop name is required',
        status: 400
      };
      return Response.json(response, { status: 400 });
    }

    try {
      const crop = await prisma.crop.create({
        data: {
          userId: user.id,
          cropName: recommendationData.cropName,
          cropType: 'RECOMMENDATION',
          cropVariety: '',
          nitrogenSupply: toDecimal(recommendationData.nitrogenSupply),
          nitrogenDemand: toDecimal(recommendationData.nitrogenDemand),
          soilResidualNitrogen: toDecimal(0),
          ItShouldNotBeRepeatedForXYears: 0,
          climate: '',
          soilType: '',
          details: {
            create: [
              ...(recommendationData.pests?.filter(Boolean).map(value => ({
                value,
                detailType: 'PEST' as DetailType
              })) || []),
              ...(recommendationData.diseases?.filter(Boolean).map(value => ({
                value,
                detailType: 'DISEASE' as DetailType
              })) || [])
            ]
          }
        },
        include: {
          details: true
        }
      });

      const transformedCrop = transformCropWithDetails(crop);
      const response: ApiResponse<RecommendationResponse[]> = { 
        crops: [transformedCrop],
        status: 201 
      };
      return Response.json(response, { status: 201 });
    } catch (error) {
      console.error('Error creating recommendation:', error);
      const response: ApiResponse = {
        error: error instanceof Error ? error.message : 'Failed to create recommendation',
        status: 500
      };
      return Response.json(response, { status: 500 });
    }
  } catch (error) {
    console.error('POST recommendation error:', error);
    const response: ApiResponse = { 
      error: error instanceof Error ? error.message : 'Internal server error',
      status: 500
    };
    return Response.json(response, { status: 500 });
  }
});
