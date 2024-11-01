import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getSession } from '@auth0/nextjs-auth0';
import { handleApiError } from '@/app/lib/api-utils';
import { Prisma } from '@prisma/client';

export async function GET(request: NextRequest, context: any) {
   const { params } = context;
   const session = await getSession();
   const user = session?.user;

   try {
      if (params.crops === 'crops' && params.cropRoute === "search") {
         const crops = await prisma.crop.findMany({
            where: {
               cropName: {
                  contains: params.dinamicAction,
                  mode: 'insensitive'
               }
            },
            include: {
               fertilizers: { select: { value: true } },
               pests: { select: { value: true } },
               diseases: { select: { value: true } }
            }
         });

         const filteredCrops = crops.map(crop => ({
            ...crop,
            fertilizers: crop.fertilizers.map(f => f.value),
            pests: crop.pests.map(p => p.value),
            diseases: crop.diseases.map(d => d.value)
         })).filter(crop => 
            crop.cropType && 
            crop.cropVariety && 
            crop.plantingDate && 
            crop.harvestingDate && 
            crop.soilType
         );

         return NextResponse.json({ crops: filteredCrops });
      }

      if (params.crops === 'crop' && params.cropRoute === "id") {
         const crop = await prisma.crop.findUnique({
            where: { id: parseInt(params.dinamicAction) },
            include: {
               fertilizers: { select: { value: true } },
               pests: { select: { value: true } },
               diseases: { select: { value: true } }
            }
         });

         return NextResponse.json({ crops: [crop] });
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
               diseases: { select: { value: true } },
               pests: { select: { value: true } },
               nitrogenSupply: true,
               nitrogenDemand: true,
            }
         });

         return NextResponse.json({ crops });
      }

      if (params.crops === 'crops' && params.cropRoute === "retrieve" && params.dinamicAction === "all") {
         const [crops, selections] = await Promise.all([
            prisma.crop.findMany({
               include: {
                  fertilizers: { select: { value: true } },
                  pests: { select: { value: true } },
                  diseases: { select: { value: true } }
               }
            }),
            prisma.userCropSelection.findMany({
               where: { userId: user.sub }
            })
         ]);

         const filteredCrops = crops.map(crop => ({
            ...crop,
            fertilizers: crop.fertilizers.map(f => f.value),
            pests: crop.pests.map(p => p.value),
            diseases: crop.diseases.map(d => d.value)
         }));

         return NextResponse.json({ crops: filteredCrops, selections });
      }

      if (params.crops === 'crops' && params.cropRoute === "user" && params.dinamicAction === "selectedCrops") {
         const selections = await prisma.userCropSelection.findMany({
            where: { userId: user.sub },
            include: { crop: true }
         });

         const selectedCrops = selections.flatMap(selection => 
            Array(selection.selectionCount).fill(selection.crop)
         );

         return NextResponse.json({ selectedCrops });
      }

   } catch (error) {
      return handleApiError(error);
   }
}

export async function POST(request: NextRequest, context: any) {
   const { params } = context;
   const session = await getSession();
   const user = session?.user;

   try {
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
               nitrogenSupply: cropData.nitrogenSupply,
               nitrogenDemand: cropData.nitrogenDemand,
               fertilizers: {
                  create: cropData.fertilizers?.map(value => ({
                     type: 'FERTILIZER',
                     value
                  })) || []
               },
               pests: {
                  create: cropData.pests?.map(value => ({
                     type: 'PEST',
                     value
                  })) || []
               },
               diseases: {
                  create: cropData.diseases?.map(value => ({
                     type: 'DISEASE',
                     value
                  })) || []
               }
            }
         });

         return NextResponse.json(crop, { status: 201 });
      }

      if (params.crops === 'crops' && params.cropRoute === "recommendations") {
         const data = await request.json();
         const crop = await prisma.crop.create({
            data: {
               userId: user.sub,
               cropName: data.cropName,
               nitrogenSupply: data.nitrogenSupply,
               nitrogenDemand: data.nitrogenDemand,
               pests: {
                  create: data.pests?.map(value => ({
                     type: 'PEST',
                     value
                  })) || []
               },
               diseases: {
                  create: data.diseases?.map(value => ({
                     type: 'DISEASE',
                     value
                  })) || []
               }
            }
         });

         return NextResponse.json(crop, { status: 201 });
      }
   } catch (error) {
      return handleApiError(error);
   }
}

export async function PUT(request: NextRequest, context: any) {
   const { params } = context;
   const session = await getSession();
   const user = session?.user;

   try {
      if (params.crops === 'crop') {
         const cropId = parseInt(params.cropRoute);
         const cropData = await request.json();

         const existingCrop = await prisma.crop.findUnique({
            where: { id: cropId },
            select: { userId: true }
         });

         if (!existingCrop || (existingCrop.userId !== user.sub && !user.userRoles?.includes('admin'))) {
            return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
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
                  fertilizers: {
                     create: cropData.fertilizers?.map(value => ({
                        type: 'FERTILIZER',
                        value
                     })) || []
                  },
                  pests: {
                     create: cropData.pests?.map(value => ({
                        type: 'PEST',
                        value
                     })) || []
                  },
                  diseases: {
                     create: cropData.diseases?.map(value => ({
                        type: 'DISEASE',
                        value
                     })) || []
                  }
               }
            });
         });

         return NextResponse.json({ message: 'Crop updated' });
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

         return NextResponse.json(selection);
      }
   } catch (error) {
      return handleApiError(error);
   }
}

export async function DELETE(request: NextRequest, context: any) {
   const { params } = context;
   const session = await getSession();
   const user = session?.user;

   try {
      if (params.crops === 'crops') {
         const cropId = parseInt(params.dinamicAction);
         
         const crop = await prisma.crop.findUnique({
            where: { id: cropId }
         });

         if (!crop) {
            return NextResponse.json({ message: 'Crop not found' }, { status: 404 });
         }

         if (crop.userId !== user.sub) {
            return NextResponse.json({ message: 'Not authorized' }, { status: 401 });
         }

         await prisma.crop.delete({
            where: { id: cropId }
         });

         return NextResponse.json({ message: 'Crop deleted' });
      }
   } catch (error) {
      return handleApiError(error);
   }
}




 








