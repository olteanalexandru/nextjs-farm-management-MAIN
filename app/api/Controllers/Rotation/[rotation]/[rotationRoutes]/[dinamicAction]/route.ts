import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { getSession } from '@auth0/nextjs-auth0';


// Types for rotation generation
interface CropInput {
  id: number;
  cropName: string;
  nitrogenSupply: number;
  nitrogenDemand: number;
  pests: string[];
  diseases: string[];
  ItShouldNotBeRepeatedForXYears: number;
  plantingDate: string;
  harvestingDate: string;
}

interface RotationInput {
  fieldSize: number;
  numberOfDivisions: number;
  rotationName: string;
  crops: CropInput[];
  maxYears: number;
  ResidualNitrogenSupply?: number;
}

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

  // Check if enough years have passed since last use
  if (year - lastUsed <= crop.ItShouldNotBeRepeatedForXYears) {
    return false;
  }

  // Check crop selection count
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

// Main controller functions
export async function GET(request: NextRequest, context: any) {
  const { params } = context;
  const session = await getSession();
  const user = session?.user;

  try {
    if (params.rotation === 'getRotation' && params.rotationRoutes === 'rotation') {
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

      return NextResponse.json({ data: rotations }, { status: 200 });
    }
  } catch (error) {

  }
}

export async function POST(request: NextRequest, context: any) {
  const { params } = context;
  const session = await getSession();
  const user = session?.user;

  try {
    if (params.rotation === 'generateRotation' && params.rotationRoutes === 'rotation') {
      const input: RotationInput = await request.json();
      const {
        fieldSize,
        numberOfDivisions,
        rotationName,
        crops,
        maxYears,
        ResidualNitrogenSupply = 500
      } = input;

      // Validation
      if (!crops?.length) {
        return NextResponse.json(
          { error: 'No crops provided' },
          { status: 400 }
        );
      }

      // Initialize tracking structures
      const rotationPlan = new Map();
      const lastUsedYear = new Map();
      const usedCropsInYear = new Map();

      // Initialize last used year tracking for each division
      for (let division = 1; division <= numberOfDivisions; division++) {
        const divisionLastUsedYear = new Map();
        crops.forEach(crop => {
          divisionLastUsedYear.set(crop.cropName, 0 - crop.ItShouldNotBeRepeatedForXYears);
        });
        lastUsedYear.set(division, divisionLastUsedYear);
      }

      // Generate rotation plan
      for (let year = 1; year <= maxYears; year++) {
        usedCropsInYear.set(year, new Set());
        const yearlyPlan = [];
        
        for (let division = 1; division <= numberOfDivisions; division++) {
          const divisionSize = parseFloat((fieldSize / numberOfDivisions).toFixed(2));
          const prevYearPlan = rotationPlan.get(year - 1);
          const prevCrop = prevYearPlan?.find(item => item.division === division)?.crop;

          if (prevCrop) {
            // Calculate nitrogen balance from previous year
            const prevNitrogenBalance = prevYearPlan.find(
              item => item.division === division
            ).nitrogenBalance;
            
            const nitrogenPerDivision = prevCrop.nitrogenSupply + prevNitrogenBalance;
            const sortedCrops = sortCropsByNitrogenBalance(crops, nitrogenPerDivision, 0);

            // Find suitable crop
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
            // First year or no previous crop
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

      // Create rotation in database
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

      return NextResponse.json(rotation);
    }
  } catch (error) {

  }
}

export async function PUT(request: NextRequest, context: any) {
  const { params } = context;
  const session = await getSession();
  const user = session?.user;

  try {
    // Update nitrogen balance
    if (params.rotation === 'updateNitrogenBalance') {
      const { id, year, division, nitrogenBalance, rotationName } = await request.json();

      const rotation = await prisma.rotation.findUnique({
        where: { id: parseInt(id) },
        include: { rotationPlans: true }
      });

      if (!rotation || rotation.userId !== user.sub) {
        return NextResponse.json(
          { error: 'Not authorized' },
          { status: 401 }
        );
      }

      const updatedRotation = await prisma.$transaction(async (prisma) => {
        // Update specified plan
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

        // Get updated rotation
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

      return NextResponse.json({
        message: 'Nitrogen balance updated successfully',
        data: updatedRotation
      });
    }

    // Update division size
    if (params.rotation === 'updateDivisionSizeAndRedistribute') {
      const { id, division, newDivisionSize, rotationName } = await request.json();

      const rotation = await prisma.rotation.findUnique({
        where: { id: parseInt(id) }
      });

      if (!rotation || rotation.userId !== user.sub) {
        return NextResponse.json(
          { error: 'Not authorized' },
          { status: 401 }
        );
      }

      if (newDivisionSize > rotation.fieldSize || newDivisionSize < 0) {
        return NextResponse.json(
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

      return NextResponse.json(updatedRotation);
    }
  } catch (error) {

  }
}

export async function DELETE(request: NextRequest, context: any) {
  const { params } = context;
  const session = await getSession();
  const user = session?.user;

  try {
    if (params.rotation === 'deleteRotation') {
      const rotationId = parseInt(params.dinamicAction);

      const rotation = await prisma.rotation.findUnique({
        where: { id: rotationId }
      });

      if (!rotation || rotation.userId !== user.sub) {
        return NextResponse.json(
          { error: 'Not authorized' },
          { status: 401 }
        );
      }

      await prisma.rotation.delete({
        where: { id: rotationId }
      });

      return NextResponse.json({
        message: 'Rotation deleted successfully',
        data: rotation
      });
    }
  } catch (error) {

  }
}








 




