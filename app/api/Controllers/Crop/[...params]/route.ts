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

interface RouteContext {
  params: {
    params: string[];
  };
}

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
  context: RouteContext
) {
  try {
    const [action, param1, param2] = context.params.params;

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

    if (action === 'crops' && param1 === "recommendations") {
      const crops = await prisma.crop.findMany({
        where: {
          cropName: {
            contains: param2
          }
        },
        include: {
          details: true
        }
      }) as unknown as CropModel[];

      const transformedCrops = crops.map(transformCropWithDetails);
      const response: ApiResponse<Crop> = { crops: transformedCrops };
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
  context: RouteContext
) {
  try {
    const [action, param1] = context.params.params;

    if (action === 'crop' && param1 === 'single') {
      const user = await getCurrentUser(request);
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
      error: 'Internal server error',
      status: 500
    };
    return Response.json(response, { status: 500 });
  }
});

export const PUT = withApiAuthRequired(async function PUT(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const [action, cropId, param1] = context.params.params;

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
  context: RouteContext
) {
  try {
    const [action, cropId] = context.params.params;

    if (action === 'crops') {
      const user = await getCurrentUser(request);
      
      const crop = await prisma.crop.findUnique({
        where: { id: parseInt(cropId) }
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

      await prisma.crop.delete({
        where: { id: parseInt(cropId) }
      });

      const response: ApiResponse = { 
        message: 'Crop deleted',
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
      error: 'Internal server error',
      status: 500
    };
    return Response.json(response, { status: 500 });
  }
});

function toDecimal(value: number | null | undefined): number {
  return value ?? 0;
}
