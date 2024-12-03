import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { prisma } from 'app/lib/prisma';
import { getCurrentUser } from 'app/lib/auth';
import { ApiResponse, CropModel, DetailType, Crop } from 'app/types/api';

 
type CropCreate = {
  cropName: string;
  cropType: string;
  cropVariety: string;
  soilType: string;
  nitrogenSupply: number;
  nitrogenDemand: number;
  soilResidualNitrogen: number;
  ItShouldNotBeRepeatedForXYears: number;
  plantingDate: string;
  harvestingDate: string;
  
  fertilizers: string[];
  pests: string[];
  diseases: string[];
  climate: string;
  description: string;
  imageUrl: string;
  
};

function toDecimal(value: number | null | undefined): number {
  if (value === null || value === undefined || isNaN(value)) {
    return 0;
  }
  return Number(value);
}

function transformCropWithDetails(crop: any): Crop {
  return {
    _id: crop.id,
    cropName: crop.cropName,
    cropType: crop.cropType || '',
    cropVariety: crop.cropVariety || '',
    plantingDate: crop.plantingDate?.toISOString(),
    harvestingDate: crop.harvestingDate?.toISOString(),
    description: crop.description || undefined,
    imageUrl: crop.imageUrl || undefined,
    soilType: crop.soilType || '',
    climate: crop.climate || '',
    ItShouldNotBeRepeatedForXYears: crop.ItShouldNotBeRepeatedForXYears || 0,
    nitrogenSupply: toDecimal(crop.nitrogenSupply),
    nitrogenDemand: toDecimal(crop.nitrogenDemand),
    soilResidualNitrogen: toDecimal(crop.soilResidualNitrogen),
    fertilizers: crop.details
      ?.filter((d: any) => d.detailType === 'FERTILIZER')
      .map((d: any) => d.value) || [],
    pests: crop.details
      ?.filter((d: any) => d.detailType === 'PEST')
      .map((d: any) => d.value) || [],
    diseases: crop.details
      ?.filter((d: any) => d.detailType === 'DISEASE')
      .map((d: any) => d.value) || []
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
      });

      const transformedCrops = crops.map(transformCropWithDetails);
      const response: ApiResponse<Crop> = { crops: transformedCrops };
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
          details: true
        }
      });

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
      console.log('Current user:', user.id); // Debug log
      
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
