import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { prisma } from 'app/lib/prisma';
import { getCurrentUser } from 'app/lib/auth';
import { ApiResponse, CropModel, DetailType, Crop, CropCreate } from 'app/types/api';

  import { toDecimal, transformCropWithDetails } from './helpers';

  //post routes are:
    // 1. crops/recommendations
    // 2. crop/single
    

export const POST = withApiAuthRequired(async function POST(
  request: NextRequest,
  { params }: { params: { params: string[] } }
) {
  try {
    const [action, param1] = params.params;

    // Get authenticated user and ensure we have their database ID
    const user = await getCurrentUser(request);
    if (!user?.id) {
      const response: ApiResponse = { 
        error: 'User not found or not properly authenticated',
        status: 401
      };
      return Response.json(response, { status: 401 });
    }

    // Handle recommendations
    if (action === 'crops' && param1 === 'recommendations') {
      const recommendationData = await request.json();

      // Validate request data
      if (!recommendationData.cropName) {
        const response: ApiResponse = {
          error: 'Crop name is required',
          status: 400
        };
        return Response.json(response, { status: 400 });
      }

      try {
        // Create the crop recommendation with default values for required fields
        const crop = await prisma.crop.create({
          data: {
            userId: user.id, // Make sure this is the database ID, not auth0 ID
            cropName: recommendationData.cropName,
            cropType: 'RECOMMENDATION',
            cropVariety: '',  // Add default value for required field
            nitrogenSupply: toDecimal(recommendationData.nitrogenSupply),
            nitrogenDemand: toDecimal(recommendationData.nitrogenDemand),
            soilResidualNitrogen: toDecimal(0),
            ItShouldNotBeRepeatedForXYears: 0,
            climate: '',      // Add default value for required field
            soilType: '',     // Add default value for required field
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
        }) as unknown as CropModel;

        const transformedCrop = transformCropWithDetails(crop);
        const response: ApiResponse<Crop> = { 
          data: transformedCrop,
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
    }

    // Handle single crop creation
    if (action === 'crop' && param1 === 'single') {
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
              ...(cropData.fertilizers?.map(value => ({
                value,
                detailType: 'FERTILIZER' as DetailType
              })) || []),
              ...(cropData.pests?.map(value => ({
                value,
                detailType: 'PEST' as DetailType
              })) || []),
              ...(cropData.diseases?.map(value => ({
                value,
                detailType: 'DISEASE' as DetailType
              })) || [])
            ]
          }
        },
        include: {
          details: true
        }
      }) as unknown as CropModel;

      const transformedCrop = transformCropWithDetails(crop);
      const response: ApiResponse<Crop> = { data: transformedCrop };
      return Response.json(response, { status: 201 });
    }

    const response: ApiResponse = { 
      error: 'Invalid route',
      status: 400
    };
    return Response.json(response, { status: 400 });
  } catch (error) {
    console.error('POST request error:', error);
    const response: ApiResponse = { 
      error: error instanceof Error ? error.message : 'Internal server error',
      status: 500
    };
    return Response.json(response, { status: 500 });
  }
});
