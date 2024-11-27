import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { prisma } from 'app/lib/prisma';
import { getCurrentUser } from 'app/lib/auth';
import { 
  ApiResponse, 
  Crop, 
  CropCreate, 
  CropModel,
  DetailType,
  transformCropToApiResponse,
  isValidDetailType
} from 'app/types/api';

function transformCropWithDetails(crop: CropModel): Crop {
  const transformed = transformCropToApiResponse(crop);
  return {
    ...transformed,
    fertilizers: crop.details
      .filter(d => isValidDetailType(d.detailType) && d.detailType === 'FERTILIZER')
      .map(d => d.value),
    pests: crop.details
      .filter(d => isValidDetailType(d.detailType) && d.detailType === 'PEST')
      .map(d => d.value),
    diseases: crop.details
      .filter(d => isValidDetailType(d.detailType) && d.detailType === 'DISEASE')
      .map(d => d.value)
  };
}

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
            mode: 'insensitive'
          }
        } : {})
      };

      console.log('Fetching recommendations with where clause:', whereClause);

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

      console.log(`Found ${recommendations.length} recommendations`);

      const transformedRecommendations = recommendations.map(transformCropWithDetails);
      
      const response: ApiResponse<Crop> = { 
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
      }) as unknown as CropModel[];

      const transformedCrops = crops.map(transformCropWithDetails);
      const response: ApiResponse<Crop> = { crops: transformedCrops };
      return Response.json(response);
    }

    if (action === 'crop' && param1 === "id") {
      const crop = await prisma.crop.findUnique({
        where: { id: parseInt(param2) },
        include: {
          details: true
        }
      }) as unknown as CropModel | null;

      if (!crop) {
        const response: ApiResponse = { 
          error: 'Crop not found',
          status: 404
        };
        return Response.json(response, { status: 404 });
      }

      const transformedCrop = transformCropWithDetails(crop);
      const response: ApiResponse<Crop> = { crops: [transformedCrop] };
      return Response.json(response);
    }

    if (action === 'crops' && param1 === "retrieve" && param2 === "all") {
      const user = await getCurrentUser(request);
      const [crops, selections] = await Promise.all([
        prisma.crop.findMany({
          include: {
            details: true
          }
        }) as unknown as Promise<CropModel[]>,
        prisma.userCropSelection.findMany({
          where: { userId: user.id }
        })
      ]);

      const transformedCrops = crops.map(transformCropWithDetails);
      const response: ApiResponse<Crop> = { 
        crops: transformedCrops,
        selections 
      };
      return Response.json(response);
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
        Array(selection.selectionCount).fill(transformCropWithDetails(selection.crop as unknown as CropModel))
      );

      const response: ApiResponse<Crop> = { crops: selectedCrops };
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
        select: { userId: true }
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
            details: true
          }
        });
      }) as unknown as CropModel;

      const transformedCrop = transformCropWithDetails(updatedCrop);
      const response: ApiResponse<Crop> = { data: transformedCrop };
      return Response.json(response);
    }

    if (action === 'crops' && param1 === 'selectare') {
      const user = await getCurrentUser(request);
      const { selectare, numSelections } = await request.json();

      const selection = await prisma.userCropSelection.upsert({
        where: {
          userId_cropId: {
            userId: user.id,
            cropId: parseInt(cropId)
          }
        },
        update: {
          selectionCount: {
            increment: selectare ? numSelections : -numSelections
          }
        },
        create: {
          userId: user.id,
          cropId: parseInt(cropId),
          selectionCount: numSelections
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

export const DELETE = withApiAuthRequired(async function DELETE(
  request: NextRequest,
  { params }: { params: { params: string[] } }
) {
  try {
    const [action, userId, cropId] = params.params;

    if (action === 'crops') {
      const user = await getCurrentUser(request);
      
      // Ensure cropId is a valid number
      const numericCropId = parseInt(cropId);
      if (isNaN(numericCropId)) {
        const response: ApiResponse = { 
          error: 'Invalid crop ID',
          status: 400
        };
        return Response.json(response, { status: 400 });
      }

      const crop = await prisma.crop.findUnique({
        where: { 
          id: numericCropId
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
          where: { cropId: numericCropId }
        }),
        // Delete related user crop selections
        prisma.userCropSelection.deleteMany({
          where: { cropId: numericCropId }
        }),
        // Delete related rotation plans
        prisma.rotationPlan.deleteMany({
          where: { cropId: numericCropId }
        }),
        // Finally delete the crop
        prisma.crop.delete({
          where: { id: numericCropId }
        })
      ]);

      const response: ApiResponse = { 
        message: 'Crop deleted successfully',
        status: 200
      };
      return Response.json(response);
    }

    const response: ApiResponse = { 
      error: 'Invalid route',
      status: 400
    };
    return Response.json(response, { status: 400 });
  } catch (error) {
    console.error('DELETE request error:', error);
    const response: ApiResponse = { 
      error: error instanceof Error ? error.message : 'Internal server error',
      status: 500
    };
    return Response.json(response, { status: 500 });
  }
});

function toDecimal(value: number | null | undefined): number {
  return value ?? 0;
}