import { NextRequest } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getSession } from '@auth0/nextjs-auth0';
import { CropInput, RotationInput, RouteContext } from '../interfaces';

// Utility functions for rotation generation
function hasSharedPests(crop1: CropInput, crop2: CropInput): boolean {
  return crop1.pests.some(pest => crop2.pests.includes(pest));
}

function hasSharedDiseases(crop1: CropInput, crop2: CropInput): boolean {
  return crop1.diseases.some(disease => crop2.diseases.includes(disease));
}

function calculateNitrogenBalance(
  crop: CropInput,
  nitrogenPerDivision: number,
  soilResidualNitrogen: number
): number {
  const nitrogenBalance = nitrogenPerDivision - crop.nitrogenDemand + soilResidualNitrogen;
  return parseFloat(Math.max(0, nitrogenBalance).toFixed(2));
}

function sortCropsByNitrogenBalance(
  crops: CropInput[],
  nitrogenPerDivision: number,
  soilResidualNitrogen: number
): CropInput[] {
  return [...crops].sort((a, b) => {
    const balanceA = calculateNitrogenBalance(a, nitrogenPerDivision, soilResidualNitrogen);
    const balanceB = calculateNitrogenBalance(b, nitrogenPerDivision, soilResidualNitrogen);
    return balanceA - balanceB;
  });
}

async function cropIsAvailable(
  crop: CropInput,
  year: number,
  lastUsedYear: Map<number, Map<string, number>>,
  division: number,
  userId: string
): Promise<boolean> {
  const divisionLastUsedYear = lastUsedYear.get(division) || new Map<string, number>();
  const lastUsed = divisionLastUsedYear.get(crop.cropName) || 0;

  if (year - lastUsed <= crop.ItShouldNotBeRepeatedForXYears) {
    return false;
  }

  const selection = await prisma.userCropSelection.findUnique({
    where: {
      userId_cropId: {
        userId: userId,
        cropId: crop.id
      }
    }
  });

  return selection ? selection.selectionCount > 0 : false;
}

// Helper function to handle authentication
async function authenticateUser() {
  const session = await getSession();
  if (!session?.user) {
    return Response.json({ error: 'Not authenticated' }, { status: 401 });
  }
  return session;
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const session = await authenticateUser();
    if (session instanceof Response) return session;
    const user = session.user;

    if (context.params.rotation === 'getRotation' && context.params.rotationRoutes === 'rotation') {
      const rotations = await prisma.rotation.findMany({
        where: {
          userId: user.sub
        },
        include: {
          rotationPlans: {
            include: {
              crop: {
                include: {
                  pests: true,
                  diseases: true
                }
              }
            },
            orderBy: [
              { year: 'asc' },
              { division: 'asc' }
            ]
          }
        },
        orderBy: {
          createdAt: 'desc'
        }
      });

      return Response.json({ data: rotations }, { status: 200 });
    }

    return Response.json({ error: 'Invalid route' }, { status: 400 });
  } catch (error) {
    console.error('GET request error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const session = await authenticateUser();
    if (session instanceof Response) return session;
    const user = session.user;

    if (context.params.rotation === 'generateRotation' && context.params.rotationRoutes === 'rotation') {
      const input: RotationInput = await request.json();
      const {
        fieldSize,
        numberOfDivisions,
        rotationName,
        crops,
        maxYears,
        ResidualNitrogenSupply = 500
      } = input;

      if (!crops?.length) {
        return Response.json(
          { error: 'No crops provided' },
          { status: 400 }
        );
      }

      const rotationPlan = new Map();
      const lastUsedYear = new Map();
      const usedCropsInYear = new Map();

      for (let division = 1; division <= numberOfDivisions; division++) {
        const divisionLastUsedYear = new Map();
        crops.forEach(crop => {
          divisionLastUsedYear.set(crop.cropName, 0 - crop.ItShouldNotBeRepeatedForXYears);
        });
        lastUsedYear.set(division, divisionLastUsedYear);
      }

      for (let year = 1; year <= maxYears; year++) {
        usedCropsInYear.set(year, new Set());
        const yearlyPlan = [];
        
        for (let division = 1; division <= numberOfDivisions; division++) {
          const divisionSize = parseFloat((fieldSize / numberOfDivisions).toFixed(2));
          const prevYearPlan = rotationPlan.get(year - 1);
          const prevCrop = prevYearPlan?.find(item => item.division === division)?.crop;

          if (prevCrop) {
            const prevNitrogenBalance = prevYearPlan.find(
              item => item.division === division
            ).nitrogenBalance;
            
            const nitrogenPerDivision = prevCrop.nitrogenSupply + prevNitrogenBalance;
            const sortedCrops = sortCropsByNitrogenBalance(crops, nitrogenPerDivision, 0);

            for (const candidateCrop of sortedCrops) {
              const isAvailable = await cropIsAvailable(
                candidateCrop,
                year,
                lastUsedYear,
                division,
                user.sub
              );

              if (
                isAvailable &&
                !hasSharedPests(candidateCrop, prevCrop) &&
                !hasSharedDiseases(candidateCrop, prevCrop)
              ) {
                lastUsedYear.get(division)?.set(candidateCrop.cropName, year);
                usedCropsInYear.get(year)?.add(candidateCrop.id);

                const nitrogenBalance = calculateNitrogenBalance(
                  candidateCrop,
                  nitrogenPerDivision,
                  0
                );

                yearlyPlan.push({
                  division,
                  cropId: candidateCrop.id,
                  plantingDate: candidateCrop.plantingDate,
                  harvestingDate: candidateCrop.harvestingDate,
                  divisionSize,
                  nitrogenBalance
                });
                break;
              }
            }
          } else {
            const cropIndex = (division + year - 2) % crops.length;
            const crop = crops[cropIndex];
            
            if (await cropIsAvailable(crop, year, lastUsedYear, division, user.sub)) {
              lastUsedYear.get(division)?.set(crop.cropName, year);
              usedCropsInYear.get(year)?.add(crop.id);

              const nitrogenBalance = calculateNitrogenBalance(
                crop,
                crop.nitrogenSupply,
                ResidualNitrogenSupply
              );

              yearlyPlan.push({
                division,
                cropId: crop.id,
                plantingDate: crop.plantingDate,
                harvestingDate: crop.harvestingDate,
                divisionSize,
                nitrogenBalance
              });
            }
          }
        }
        
        rotationPlan.set(year, yearlyPlan);
      }

      const rotation = await prisma.rotation.create({
        data: {
          userId: user.sub,
          rotationName,
          fieldSize,
          numberOfDivisions,
          rotationPlans: {
            create: Array.from(rotationPlan.entries()).flatMap(([year, plans]) =>
              plans.map(plan => ({
                year,
                ...plan
              }))
            )
          }
        },
        include: {
          rotationPlans: {
            include: {
              crop: true
            }
          }
        }
      });

      return Response.json(rotation);
    }

    return Response.json({ error: 'Invalid route' }, { status: 400 });
  } catch (error) {
    console.error('POST request error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const session = await authenticateUser();
    if (session instanceof Response) return session;
    const user = session.user;

    if (context.params.rotation === 'updateNitrogenBalance') {
      const { id, year, division, nitrogenBalance } = await request.json();

      const rotation = await prisma.rotation.findUnique({
        where: { id: parseInt(id) },
        include: { rotationPlans: true }
      });

      if (!rotation || rotation.userId !== user.sub) {
        return Response.json(
          { error: 'Not authorized' },
          { status: 401 }
        );
      }

      const updatedRotation = await prisma.$transaction(async (prisma) => {
        await prisma.rotationPlan.updateMany({
          where: {
            rotationId: parseInt(id),
            year: parseInt(year),
            division: parseInt(division)
          },
          data: {
            nitrogenBalance: parseFloat(nitrogenBalance),
            directlyUpdated: true
          }
        });

        return prisma.rotation.findUnique({
          where: { id: parseInt(id) },
          include: {
            rotationPlans: {
              include: {
                crop: true
              }
            }
          }
        });
      });

      return Response.json({
        message: 'Nitrogen balance updated successfully',
        data: updatedRotation
      });
    }

    if (context.params.rotation === 'updateDivisionSizeAndRedistribute') {
      const { id, division, newDivisionSize } = await request.json();

      const rotation = await prisma.rotation.findUnique({
        where: { id: parseInt(id) }
      });

      if (!rotation || rotation.userId !== user.sub) {
        return Response.json(
          { error: 'Not authorized' },
          { status: 401 }
        );
      }

      if (newDivisionSize > rotation.fieldSize || newDivisionSize < 0) {
        return Response.json(
          { error: 'Invalid division size' },
          { status: 400 }
        );
      }

      const remainingSize = rotation.fieldSize - newDivisionSize;
      const otherDivisionsSize = remainingSize / (rotation.numberOfDivisions - 1);

      const updatedRotation = await prisma.rotation.update({
        where: { id: parseInt(id) },
        data: {
          rotationPlans: {
            updateMany: [
              {
                where: {
                  division: parseInt(division)
                },
                data: {
                  divisionSize: newDivisionSize,
                  directlyUpdated: true
                }
              },
              {
                where: {
                  division: {
                    not: parseInt(division)
                  },
                  directlyUpdated: false
                },
                data: {
                  divisionSize: otherDivisionsSize
                }
              }
            ]
          }
        },
        include: {
          rotationPlans: {
            include: {
              crop: true
            }
          }
        }
      });

      return Response.json(updatedRotation);
    }

    return Response.json({ error: 'Invalid route' }, { status: 400 });
  } catch (error) {
    console.error('PUT request error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const session = await authenticateUser();
    if (session instanceof Response) return session;
    const user = session.user;

    if (context.params.rotation === 'deleteRotation') {
      const rotationId = parseInt(context.params.dinamicAction);

      const rotation = await prisma.rotation.findUnique({
        where: { id: rotationId }
      });

      if (!rotation || rotation.userId !== user.sub) {
        return Response.json(
          { error: 'Not authorized' },
          { status: 401 }
        );
      }

      await prisma.rotation.delete({
        where: { id: rotationId }
      });

      return Response.json({
        message: 'Rotation deleted successfully',
        data: rotation
      });
    }

    return Response.json({ error: 'Invalid route' }, { status: 400 });
  } catch (error) {
    console.error('DELETE request error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}
