import { NextRequest } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getSession } from '@auth0/nextjs-auth0';

type RouteContext = {
  params: {
    crops: string;
    cropRoute: string;
    dinamicAction: string;
  };
};

// Helper function to handle authentication
async function authenticateUser() {
  const session = await getSession();
  if (!session?.user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }
  return session;
}

export async function GET(request: NextRequest, context: RouteContext) {
  const { params } = context;
  
  try {
    const session = await authenticateUser();
    if (session instanceof Response) return session;
    const user = session.user;

    if (params.crops === 'crops' && params.cropRoute === "search") {
      const crops = await prisma.crop.findMany({
        where: {
          cropName: {
            contains: params.dinamicAction,
            mode: 'insensitive'
          },
          deleted: null
        },
        include: {
          details: true
        }
      });

      const transformedCrops = crops.map(crop => ({
        ...crop,
        fertilizers: crop.details
          .filter(d => d.detailType === 'FERTILIZER')
          .map(d => d.value),
        pests: crop.details
          .filter(d => d.detailType === 'PEST')
          .map(d => d.value),
        diseases: crop.details
          .filter(d => d.detailType === 'DISEASE')
          .map(d => d.value)
      }));

      return Response.json({ crops: transformedCrops });
    }

    if (params.crops === 'crop' && params.cropRoute === "id") {
      const crop = await prisma.crop.findUnique({
        where: { id: parseInt(params.dinamicAction) },
        include: {
          details: true
        }
      });

      return Response.json({ crops: [crop] });
    }

    if (params.crops === 'crops' && params.cropRoute === "recommendations") {
      const crops = await prisma.crop.findMany({
        where: {
          cropName: {
            contains: params.dinamicAction,
            mode: 'insensitive'
          }
        },
        select: {
          cropName: true,
          details: true,
          nitrogenSupply: true,
          nitrogenDemand: true,
        }
      });

      return Response.json({ crops });
    }

    if (params.crops === 'crops' && params.cropRoute === "retrieve" && params.dinamicAction === "all") {
      const [crops, selections] = await Promise.all([
        prisma.crop.findMany({
          include: {
            details: true
          }
        }),
        prisma.userCropSelection.findMany({
          where: { userId: user.sub }
        })
      ]);

      const filteredCrops = crops.map(crop => ({
        ...crop,
        fertilizers: crop.details
          .filter(d => d.detailType === 'FERTILIZER')
          .map(d => d.value),
        pests: crop.details
          .filter(d => d.detailType === 'PEST')
          .map(d => d.value),
        diseases: crop.details
          .filter(d => d.detailType === 'DISEASE')
          .map(d => d.value)
      }));

      return Response.json({ crops: filteredCrops, selections });
    }

    if (params.crops === 'crops' && params.cropRoute === "user" && params.dinamicAction === "selectedCrops") {
      const selections = await prisma.userCropSelection.findMany({
        where: { userId: user.sub },
        include: { crop: true }
      });

      const selectedCrops = selections.flatMap(selection => 
        Array(selection.selectionCount).fill(selection.crop)
      );

      return Response.json({ selectedCrops });
    }

    return Response.json({ error: 'Invalid route' }, { status: 400 });
  } catch (error) {
    console.error('GET request error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const { params } = context;
  
  try {
    const session = await authenticateUser();
    if (session instanceof Response) return session;
    const user = session.user;

    if (params.crops === 'crop' && params.cropRoute === 'single') {
      const cropData = await request.json();

      const crop = await prisma.crop.create({
        data: {
          userId: user.sub,
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
                detailType: 'FERTILIZER'
              })) || []),
              ...(cropData.pests?.map(value => ({
                value,
                detailType: 'PEST'
              })) || []),
              ...(cropData.diseases?.map(value => ({
                value,
                detailType: 'DISEASE'
              })) || [])
            ]
          }
        }
      });

      return Response.json(crop, { status: 201 });
    }

    return Response.json({ error: 'Invalid route' }, { status: 400 });
  } catch (error) {
    console.error('POST request error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  const { params } = context;
  
  try {
    const session = await authenticateUser();
    if (session instanceof Response) return session;
    const user = session.user;

    if (params.crops === 'crop') {
      const cropId = parseInt(params.cropRoute);
      const cropData = await request.json();

      const existingCrop = await prisma.crop.findUnique({
        where: { id: cropId },
        select: { userId: true }
      });

      if (!existingCrop || (existingCrop.userId !== user.sub && !user.userRoles?.includes('admin'))) {
        return Response.json({ error: 'Not authorized' }, { status: 401 });
      }

      await prisma.$transaction(async (prisma) => {
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
            nitrogenSupply: cropData.nitrogenSupply,
            nitrogenDemand: cropData.nitrogenDemand,
            details: {
              create: [
                ...(cropData.fertilizers?.map(value => ({
                  value,
                  detailType: 'FERTILIZER'
                })) || []),
                ...(cropData.pests?.map(value => ({
                  value,
                  detailType: 'PEST'
                })) || []),
                ...(cropData.diseases?.map(value => ({
                  value,
                  detailType: 'DISEASE'
                })) || [])
              ]
            }
          }
        });
      });

      return Response.json({ message: 'Crop updated' });
    }

    if (params.crops === 'crops' && params.dinamicAction === 'selectare') {
      const { selectare, numSelections } = await request.json();
      const cropId = parseInt(params.cropRoute);

      const selection = await prisma.userCropSelection.upsert({
        where: {
          userId_cropId: {
            userId: user.sub,
            cropId: cropId
          }
        },
        update: {
          selectionCount: {
            increment: selectare ? numSelections : -numSelections
          }
        },
        create: {
          userId: user.sub,
          cropId: cropId,
          selectionCount: numSelections
        }
      });

      return Response.json(selection);
    }

    return Response.json({ error: 'Invalid route' }, { status: 400 });
  } catch (error) {
    console.error('PUT request error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  const { params } = context;
  
  try {
    const session = await authenticateUser();
    if (session instanceof Response) return session;
    const user = session.user;

    if (params.crops === 'crops') {
      const cropId = parseInt(params.dinamicAction);
      
      const crop = await prisma.crop.findUnique({
        where: { id: cropId }
      });

      if (!crop) {
        return Response.json({ error: 'Crop not found' }, { status: 404 });
      }

      if (crop.userId !== user.sub) {
        return Response.json({ error: 'Not authorized' }, { status: 401 });
      }

      await prisma.crop.delete({
        where: { id: cropId }
      });

      return Response.json({ message: 'Crop deleted' });
    }

    return Response.json({ error: 'Invalid route' }, { status: 400 });
  } catch (error) {
    console.error('DELETE request error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function toDecimal(value: any): number | null {
  return value ? parseFloat(value) : null;
}
