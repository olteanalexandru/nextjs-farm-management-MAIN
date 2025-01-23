import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { PrismaClient } from '@prisma/client';
import { getCurrentUser } from 'app/lib/auth';
import { ApiResponse,  Crop, RecommendationResponse } from 'app/types/api';

const prisma = new PrismaClient();

  import {  transformCropWithDetails } from './helpers';


  //routes are : 
    // 1. crops/recommendations
    // 2. crops/search
    // 3. crop/id
    // 4. crops/retrieve/all
    // 5. crops/user/selectedCrops
    // 6. crops/wiki

    

export const GET = withApiAuthRequired(async function GET(
  request: NextRequest,
  { params }: { params: { params: string[] } }
) {
  try {
    const [action, param1, param2] = params.params;
  

    // Unified recommendations handler
    if (action === 'crops' && param1 === 'recommendations') {
      const whereClause = {
        cropType: {
          equals: 'RECOMMENDATION'
        },
        deleted: null,
        ...(param2 ? {
          cropName: {
            contains: param2,
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
    }

    if (action === 'crops' && param1 === "search") {
      const crops = await prisma.crop.findMany({
        where: {
          cropName: {
            contains: param2
          },
          deleted: null
        },
        include: {
          details: true
        }
      });

      const transformedCrops = crops.map(transformCropWithDetails);
      const response: ApiResponse<RecommendationResponse[]> = { crops: transformedCrops };
      return Response.json(response);
    }

    if (action === 'crop' && param1 === "id") {
      const cropId = parseInt(param2);
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
      
      const response: ApiResponse<RecommendationResponse[]> = { crops: [transformedCrop] };
      return Response.json(response);
    }

    if (action === 'crops' && param1 === "retrieve" && param2 === "all") {
      const user = await getCurrentUser(request);
      
      const [crops, selections] = await Promise.all([
        prisma.crop.findMany({
          where: {
            // Don't filter by userId here as we want all crops
            cropType: {
              not: 'RECOMMENDATION'
            },
            deleted: null
          },
          include: {
            details: true,
            user: true // Include user info to check ownership
          },
          orderBy: {
            createdAt: 'desc'
          }
        }),
        prisma.userCropSelection.findMany({
          where: { userId: user.id }
        })
      ]);
    
      console.log('Found crops:', crops.length); // Debug log
      console.log('Found selections:', selections.length); // Debug log
    
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
    
      console.log('Transformed crops:', transformedCrops.length); // Debug log
    
      return Response.json({ 
        crops: transformedCrops,
        selections
      });
    }
    

    if (action === 'crops' && param1 === "user" && param2 === "selectedCrops") {
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
        Array(selection.selectionCount).fill(transformCropWithDetails(selection.crop as unknown as Crop))
      );

      const response: ApiResponse<RecommendationResponse[]> = { crops: selectedCrops };
      return Response.json(response);
    }



    const response: ApiResponse = { 
      error: 'Invalid route',
      status: 400
    };
    return Response.json(response, { status: 400 });
  } catch (error) {
    console.error('GET request error:', error);
    const response: ApiResponse = { 
      error: 'Internal server error',
      status: 500
    };
    return Response.json(response, { status: 500 });
  }
});
