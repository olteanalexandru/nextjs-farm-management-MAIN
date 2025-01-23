import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from 'app/lib/auth';
import { ApiResponse, CropCreate, RecommendationResponse } from 'app/types/api';
import { toDecimal, transformCropWithDetails } from '../../crops/utils/helpers';

const prisma = new PrismaClient();

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

    const cropData = await request.json() as CropCreate;

    const crop = await prisma.crop.create({
      data: {
        userId: user.id,
        cropName: cropData.cropName,
        cropType: cropData.cropType,
        cropVariety: cropData.cropVariety,
        plantingDate: cropData.plantingDate ? new Date(cropData.plantingDate) : null,
        harvestingDate: cropData.harvestingDate ? new Date(cropData.harvestingDate) : null,
        description: cropData.description,
        imageUrl: cropData.imageUrl,
        soilType: cropData.soilType,
        climate: cropData.climate,
        ItShouldNotBeRepeatedForXYears: cropData.ItShouldNotBeRepeatedForXYears,
        nitrogenSupply: toDecimal(cropData.nitrogenSupply),
        nitrogenDemand: toDecimal(cropData.nitrogenDemand),
        soilResidualNitrogen: toDecimal(cropData.soilResidualNitrogen),
        details: {
          create: [
            ...(cropData.details?.map(detail => ({
              value: detail.value,
              detailType: detail.detailType
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
    console.error('POST create crop error:', error);
    const response: ApiResponse = { 
      error: error instanceof Error ? error.message : 'Internal server error',
      status: 500
    };
    return Response.json(response, { status: 500 });
  }
});
