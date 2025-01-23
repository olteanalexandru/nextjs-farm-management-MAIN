import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from 'app/lib/auth';
import { ApiResponse } from 'app/types/api';
import { transformCropWithDetails } from '../utils/helpers';

const prisma = new PrismaClient();

export const GET = withApiAuthRequired(async function GET(
  request: NextRequest
) {
  try {
    const user = await getCurrentUser(request);
    
    const [crops, selections] = await Promise.all([
      prisma.crop.findMany({
        where: {
          cropType: {
            not: 'RECOMMENDATION'
          },
          deleted: null
        },
        include: {
          details: true,
          user: true
        },
        orderBy: {
          createdAt: 'desc'
        }
      }),
      prisma.userCropSelection.findMany({
        where: { userId: user.id }
      })
    ]);
  
    const transformedCrops = crops.map(crop => ({
      ...transformCropWithDetails(crop),
      id: crop.id,
      _id: crop.id.toString(),
      cropName: crop.cropName,
      cropType: crop.cropType || '',
      cropVariety: crop.cropVariety || '',
      plantingDate: crop.plantingDate?.toISOString(),
      harvestingDate: crop.harvestingDate?.toISOString(),
      description: crop.description || '',
      imageUrl: crop.imageUrl || '',
      soilType: crop.soilType || '',
      climate: crop.climate || '',
      nitrogenSupply: Number(crop.nitrogenSupply) || 0,
      nitrogenDemand: Number(crop.nitrogenDemand) || 0,
      isSelected: Boolean(selections.find(s => s.cropId === crop.id && s.selectionCount > 0)),
      isOwnCrop: crop.userId === user.id
    }));
  
    return Response.json({ 
      crops: transformedCrops,
      selections,
      status: 200
    });
  } catch (error) {
    console.error('GET all crops error:', error);
    const response: ApiResponse = { 
      error: 'Internal server error',
      status: 500
    };
    return Response.json(response, { status: 500 });
  }
});
