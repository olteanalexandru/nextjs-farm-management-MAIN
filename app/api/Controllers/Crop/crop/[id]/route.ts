import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from 'app/lib/auth';
import { ApiResponse, DetailType, CropCreate, RecommendationResponse } from 'app/types/api';
import { toDecimal, transformCropWithDetails } from '../../crops/utils/helpers';

const prisma = new PrismaClient();

export const GET = withApiAuthRequired(async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cropId = parseInt(params.id);
    if (isNaN(cropId)) {
      const response: ApiResponse = { 
        error: 'Invalid crop ID',
        status: 400
      };
      return Response.json(response, { status: 400 });
    }

    const crop = await prisma.crop.findUnique({
      where: { id: cropId },
      include: {
        details: true,
        user: {
          select: {
            id: true,
            auth0Id: true,
            roleType: true
          }
        }
      }
    });

    if (!crop) {
      const response: ApiResponse = { 
        error: 'Crop not found',
        status: 404
      };
      return Response.json(response, { status: 404 });
    }

    const transformedCrop = {
      ...transformCropWithDetails(crop),
      userId: crop.userId,
      auth0Id: crop.user?.auth0Id
    };
    
    const response: ApiResponse<RecommendationResponse[]> = { 
      crops: [transformedCrop],
      status: 200
    };
    return Response.json(response);
  } catch (error) {
    console.error('GET crop by ID error:', error);
    const response: ApiResponse = { 
      error: 'Internal server error',
      status: 500
    };
    return Response.json(response, { status: 500 });
  }
});

export const PUT = withApiAuthRequired(async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    const cropData = await request.json() as CropCreate;
    const cropId = parseInt(params.id);

    const existingCrop = await prisma.crop.findUnique({
      where: { id: cropId },
      include: {
        details: true,
        user: {
          select: {
            id: true,
            auth0Id: true,
            roleType: true
          }
        }
      }
    });

    if (!existingCrop) {
      const response: ApiResponse = { 
        error: 'Crop not found',
        status: 404
      };
      return Response.json(response, { status: 404 });
    }

    if (existingCrop.userId !== user.id) {
      const response: ApiResponse = { 
        error: 'Not authorized',
        status: 401
      };
      return Response.json(response, { status: 401 });
    }

    const updatedCrop = await prisma.$transaction(async (prisma) => {
      await prisma.cropDetail.deleteMany({
        where: { cropId }
      });

      return prisma.crop.update({
        where: { id: cropId },
        data: {
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
              ...(cropData.fertilizers?.map(value => ({
                detailType: 'FERTILIZER' as DetailType,
                value
              })) || []),
              ...(cropData.pests?.map(value => ({
                detailType: 'PEST' as DetailType,
                value
              })) || []),
              ...(cropData.diseases?.map(value => ({
                detailType: 'DISEASE' as DetailType,
                value
              })) || [])
            ]
          }
        },
        include: {
          details: true,
          user: {
            select: {
              id: true,
              auth0Id: true,
              roleType: true
            }
          }
        }
      });
    });

    const transformedCrop = {
      ...transformCropWithDetails(updatedCrop),
      userId: updatedCrop.userId,
      auth0Id: updatedCrop.user?.auth0Id,
      user: updatedCrop.user
    };
    
    const response: ApiResponse<RecommendationResponse[]> = { 
      crops: [transformedCrop],
      status: 200
    };
    return Response.json(response);
  } catch (error) {
    console.error('PUT crop error:', error);
    const response: ApiResponse = { 
      error: error instanceof Error ? error.message : 'Internal server error',
      status: 500
    };
    return Response.json(response, { status: 500 });
  }
});

export const DELETE = withApiAuthRequired(async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getCurrentUser(request);
    
    const cropId = parseInt(params.id);
    if (isNaN(cropId)) {
      const response: ApiResponse = { 
        error: 'Invalid crop ID',
        status: 400
      };
      return Response.json(response, { status: 400 });
    }

    const crop = await prisma.crop.findUnique({
      where: { 
        id: cropId
      }
    });

    if (!crop) {
      const response: ApiResponse = { 
        error: 'Crop not found',
        status: 404
      };
      return Response.json(response, { status: 404 });
    }

    if (crop.userId !== user.id) {
      const response: ApiResponse = { 
        error: 'Not authorized',
        status: 401
      };
      return Response.json(response, { status: 401 });
    }

    // Use a transaction to delete related records first
    await prisma.$transaction([
      // Delete related crop details
      prisma.cropDetail.deleteMany({
        where: { cropId }
      }),
      // Delete related user crop selections
      prisma.userCropSelection.deleteMany({
        where: { cropId }
      }),
      // Delete related rotation plans
      prisma.rotationPlan.deleteMany({
        where: { cropId }
      }),
      // Finally delete the crop
      prisma.crop.delete({
        where: { id: cropId }
      })
    ]);

    const response: ApiResponse = { 
      message: 'Crop deleted successfully',
      status: 200
    };
    return Response.json(response);
  } catch (error) {
    console.error('DELETE crop error:', error);
    const response: ApiResponse = { 
      error: error instanceof Error ? error.message : 'Internal server error',
      status: 500
    };
    return Response.json(response, { status: 500 });
  }
});
