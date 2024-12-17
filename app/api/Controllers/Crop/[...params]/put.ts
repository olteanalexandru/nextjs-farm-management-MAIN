
import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { prisma } from 'app/lib/prisma';
import { getCurrentUser } from 'app/lib/auth';
import { ApiResponse, CropModel, DetailType, Crop } from 'app/types/api';

  import {
    CropCreate , WikiQueryParams
  } from './types'
  import { toDecimal, transformCropWithDetails } from './helpers';

//put routes are : 
    // 1. crop/id
    // 2. crops/selectare

export const PUT = withApiAuthRequired(async function PUT(
    request: NextRequest,
    { params }: { params: { params: string[] } }
  ) {
    try {
      const [action, cropId, param1] = params.params;
  
      if (action === 'crop') {
        const user = await getCurrentUser(request);
        const cropData = await request.json() as CropCreate;
  
        const existingCrop = await prisma.crop.findUnique({
          where: { id: parseInt(cropId) },
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
  
        const updatedCrop = await prisma.$transaction(async (prisma) => {
          await prisma.cropDetail.deleteMany({
            where: { cropId: parseInt(cropId) }
          });
  
          return prisma.crop.update({
            where: { id: parseInt(cropId) },
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
        
        const response: ApiResponse<Crop> = { data: transformedCrop };
        return Response.json(response);
      }
  
      if (action === 'crops' && param1 === 'selectare') {
        const user = await getCurrentUser(request);
        const { selectare } = await request.json();
  
        const selection = await prisma.userCropSelection.upsert({
          where: {
            userId_cropId: {
              userId: user.id,
              cropId: parseInt(cropId)
            }
          },
          update: {
            selectionCount: selectare ? 1 : 0  // Use 1/0 for boolean state while keeping selectionCount
          },
          create: {
            userId: user.id,
            cropId: parseInt(cropId),
            selectionCount: selectare ? 1 : 0
          }
        });
  
        const response: ApiResponse = { data: selection };
        return Response.json(response);
      }
  
      const response: ApiResponse = { 
        error: 'Invalid route',
        status: 400
      };
      return Response.json(response, { status: 400 });
    } catch (error) {
      console.error('PUT request error:', error);
      const response: ApiResponse = { 
        error: 'Internal server error',
        status: 500
      };
      return Response.json(response, { status: 500 });
    }
  });