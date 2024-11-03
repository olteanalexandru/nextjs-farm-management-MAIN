# .eslintrc.json

```json
{
  "extends": "next/core-web-vitals"
}

```

# .gitignore

```
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.js
.yarn/install-state.gz

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*

# local env files
.env*.local

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts

```

# app/api/auth/[auth0]/route.ts

```ts
import { handleAuth, handleCallback } from '@auth0/nextjs-auth0';
import prisma from '@/app/lib/prisma';

export const GET = handleAuth({
  callback: async (req, res) => {
    const response = await handleCallback(req, res);
    const { user } = response as unknown as { user: { sub: string, email: string, name: string } };
    
    // Create/update user in database
    await prisma.user.upsert({
      where: { id: user.sub },
      create: {
        id: user.sub,
        email: user.email,
        name: user.name,
      },
      update: {
        email: user.email,
        name: user.name, 
      }
    });

    return user;
  }
});
// BF99X4UACE1UEP857PMNY46M
```

# app/api/Controllers/Crop/[crops]/[cropRoute]/[dinamicAction]/route.ts

```ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getSession } from '@auth0/nextjs-auth0';
import { handleApiError } from '@/app/lib/api-utils';
import { Prisma } from '@prisma/client';




export async function GET(request: NextRequest, context: any) {
   const { params } = context;
   
   try {
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

         // Transform the details into the expected format
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

         return NextResponse.json({ crops: transformedCrops });
      }

      if (params.crops === 'crop' && params.cropRoute === "id") {
         const crop = await prisma.crop.findUnique({
            where: { id: parseInt(params.dinamicAction) },
            include: {
               details: true
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
               details: true,
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

         // Create crop with details
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




 









```

# app/api/Controllers/Post/[posts]/[postsRoutes]/[dinamicAction]/route.ts

```ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getCurrentUser } from '@/app/lib/auth';
import type { ApiResponse } from '@/types';

export async function GET(request: NextRequest, context: any) {
  const { params } = context;
  
  try {
    if (params.posts === 'posts' && params.postsRoutes === "count") {
      const limit = 5;
      const count = Number(params.dinamicAction) || 0;
      const skip = count * limit;

      const posts = await prisma.post.findMany({
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc'
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      const message = posts.length === 0 ? "No more posts" : undefined;
      return NextResponse.json({ posts, message });
    }

    if (params.posts === 'posts' && params.postsRoutes === "search") {
      const posts = await prisma.post.findMany({
        where: {
          title: {
            contains: params.dinamicAction,
            mode: 'insensitive'
          }
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      return NextResponse.json({ posts });
    }

    if (params.posts === 'post' && params.postsRoutes === "id") {
      const post = await prisma.post.findUnique({
        where: {
          id: parseInt(params.dinamicAction)
        },
        include: {
          user: {
            select: {
              name: true,
              email: true
            }
          }
        }
      });

      return NextResponse.json({ posts: post });
    }
  } catch (error) {
    console.error('Request error', error);
    return NextResponse.json({ error: 'Error fetching posts' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: any) {
  const { params } = context;
  
  try {
    const user = await getCurrentUser(request);
    const { title, brief, description, image } = await request.json();

    if (!title || !brief || !description) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const post = await prisma.post.create({
      data: {
        userId: user.sub,
        title,
        brief,
        description,
        image
      }
    });

    return NextResponse.json(post, { status: 201 });
  } catch (error) {
    console.error('Request error', error);
    return NextResponse.json({ error: 'Error creating post' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, context: any) {
  const { params } = context;
  
  try {
    const user = await getCurrentUser(request);
    const { title, brief, description, image } = await request.json();

    const post = await prisma.post.findUnique({
      where: { id: parseInt(params.postsRoutes) }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.userId !== user.sub) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }

    const updatedPost = await prisma.post.update({
      where: { id: parseInt(params.postsRoutes) },
      data: {
        title,
        brief,
        description,
        image
      }
    });

    return NextResponse.json(updatedPost);
  } catch (error) {
    console.error('Request error', error);
    return NextResponse.json({ error: 'Error updating post' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: any) {
  const { params } = context;
  
  try {
    const user = await getCurrentUser(request);
    
    const post = await prisma.post.findUnique({
      where: { id: parseInt(params.postsRoutes) }
    });

    if (!post) {
      return NextResponse.json({ error: 'Post not found' }, { status: 404 });
    }

    if (post.userId !== user.sub && !user.userRoles?.includes('admin')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }

    await prisma.post.delete({
      where: { id: parseInt(params.postsRoutes) }
    });

    return NextResponse.json({ message: 'Post deleted' });
  } catch (error) {
    console.error('Request error', error);
    return NextResponse.json({ error: 'Error deleting post' }, { status: 500 });
  }
}



```

# app/api/Controllers/Rotation/[rotation]/[rotationRoutes]/[dinamicAction]/route.ts

```ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getSession } from '@auth0/nextjs-auth0';
import { handleApiError } from '@/app/lib/api-utils';

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
    return handleApiError(error);
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
    return handleApiError(error);
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
    return handleApiError(error);
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
    return handleApiError(error);
  }
}








 





```

# app/api/Controllers/Rotation/[rotation]/[rotationRoutes]/interfaces.ts

```ts



export interface Crop {
  cropName: string;
  cropType: string;
  cropVariety: string;
  plantingDate: string;
  harvestingDate: string;
  description?: string;
  selectare?: boolean;
  imageUrl?: string;
  soilType?: string;
  climate?: string;
  ItShouldNotBeRepeatedForXYears: number;
  _id: string;
  pests?: string[];
  diseases?: string[];
  doNotRepeatForXYears: number;
  fertilizers?: string[];
  nitrogenSupply: number;
  nitrogenDemand: number;
  soilResidualNitrogen: number | undefined | null;
  id: number;
  name: string;
  fieldSize: number;
  numberOfDivisions: number;
  rotationName: string;
  crops: Crop[];
  division: number;
  maxYears: number;
}

export interface CropRotationInput {
  rotationName: string;
  crops: Crop[];
  fieldSize: number;
  numberOfDivisions: number;
  maxYears: number;
  TheResidualNitrogenSupply?: number;
  ResidualNitrogenSupply?: number;
  startYear?: number;
  lastUsedYear ?: Map<number, Map<Crop, number>>
  lastUsedYearInput ?: Map<number, Map<Crop, number>>
 
}

export interface Rotation {
  user: string;
  fieldSize: number;
  numberOfDivisions: number;
  rotationName: string;
  crops: Crop[];
  _id: string;
}

export interface CropRotationItem {
  division: number;
  crop: string | string[] | undefined | any;
  plantingDate: string;
  harvestingDate: string;
  divisionSize: number;
  nitrogenBalance?: number;
}



```

# app/api/Controllers/SetLanguage/route.ts

```ts
// /api/set-language.js

import { NextResponse, NextRequest } from 'next/server';



export async function POST(request: NextRequest, context: any) {
    const { params } = context;
    const { locale } = await request.json();
    const response = NextResponse.next();

    response.cookies.set('language', locale, {
        httpOnly: true,
        secure: process.env.NODE_ENV !== 'development',
        maxAge: 60 * 60 * 24 * 12, // 2 weeks
        sameSite: 'strict',

    });
    return NextResponse.json({ message  : 'Language set to ' + locale }, { status: 201 });

}








// pages/api/SetLanguage/route.ts

```

# app/api/Controllers/User/[Action]/route.ts

```ts
import { NextResponse, NextRequest } from 'next/server';
import prisma from '@/app/lib/prisma';
import { getCurrentUser } from '@/app/lib/auth';
import { Role } from '@prisma/client';

export async function GET(request: NextRequest, context: any) {
  const { params } = context;
  
  try {
    const user = await getCurrentUser(request);
    
    // Only admin can fetch user lists
    if (!user.userRoles?.includes('admin')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }

    if (params.Action === 'fermieri') {
      const farmers = await prisma.user.findMany({
        where: {
          role: Role.FARMER
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
          _count: {
            select: {
              crops: true,
              rotations: true
            }
          }
        }
      });

      return NextResponse.json(farmers);
    }

    if (params.Action === 'admin') {
      const admins = await prisma.user.findMany({
        where: {
          role: Role.ADMIN
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true
        }
      });

      return NextResponse.json(admins);
    }
  } catch (error) {
    console.error('Request error', error);
    return NextResponse.json({ error: 'Error fetching users' }, { status: 500 });
  }
}

export async function POST(request: NextRequest, context: any) {
  const { params } = context;
  
  try {
    const user = await getCurrentUser(request);

    // Only admin can create/modify users
    if (!user.userRoles?.includes('admin')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }

    if (params.Action === 'register') {
      const { name, email, role } = await request.json();

      const newUser = await prisma.user.create({
        data: {
          id: `auth0|${Math.random().toString(36).substr(2, 9)}`, // Temporary ID until Auth0 creates real one
          name,
          email,
          role: role.toUpperCase() as Role
        }
      });

      return NextResponse.json(newUser, { status: 201 });
    }

    if (params.Action === 'changeRole') {
      const { email, role } = await request.json();

      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          role: role.toUpperCase() as Role
        }
      });

      return NextResponse.json(updatedUser);
    }
  } catch (error) {
    console.error('Request error', error);
    return NextResponse.json({ error: 'Error processing user request' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, context: any) {
  const { params } = context;
  
  try {
    const user = await getCurrentUser(request);

    // Only admin can delete users
    if (!user.userRoles?.includes('admin')) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 401 });
    }

    await prisma.user.delete({
      where: { id: params.Action }
    });

    return NextResponse.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Request error', error);
    return NextResponse.json({ error: 'Error deleting user' }, { status: 500 });
  }
}
                








```

# app/api/Models/cropModel.ts

```ts
import mongoose from "mongoose";


const cropSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true,
    ref: 'User',
  },
  selectare: {
    type: Boolean,
    required: false,
  },
  selectareBy: {
    type: String,
    required: false,
    ref: 'User',
  },
  cropName: {
    type: String,
    required: [true, 'Crop name is required'],
  },
  cropType: {
    type: String,
    required: false,
  },
  cropVariety: {
    type: String,
    required: false,
  },
  plantingDate: {
    type: String,
    required: false,
  },
  harvestingDate: {
    type: String,
    required: false,
  },
  description: {
    type: String,
    required: false,
  },
  imageUrl: {
    type: String, // Ensure the data type matches how it's used in the controller
    required: false,
  },
  soilType: {
    type: String,
    required: false,
  },
  climate: {
    type: String,
    required: false,
  },
  ItShouldNotBeRepeatedForXYears: {
    type: Number,
    required: false,
  },
  fertilizers: {
    type: [String],
    required: false,
  },
  pests: {
    type: [String],
    required: false,
  },
  diseases: {
    type: [String],
    required: false,
  },
  nitrogenSupply: {
    type: Number,
    required: false,
  },
  nitrogenDemand: {
    type: Number,
    required: false,
  },
  soilResidualNitrogen: {
    type: Number,
    required: false,
  },
},
  {
    timestamps: true,
  });

export default mongoose.models.Crop || mongoose.model('Crop', cropSchema);



// https://copilot.microsoft.com/sl/cESMsv8irQW
```

# app/api/Models/postModel.ts

```ts
import mongoose from "mongoose"


    const postSchema = new mongoose.Schema({
        //linking to user
        user: {
            type: String,
            required: true,
            ref: 'User',
        },
    title: {
        type: String,
        required: true,
    },
    brief: {
        type: String,
        required: true,
    },
    description: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        required: false,
    },
    date: {
        type: Date,
        default: Date.now,
    },
})

export default mongoose.models.Post || mongoose.model('Post', postSchema)




```

# app/api/Models/rotationModel.ts

```ts
//export 
export {};
const mongoose = require('mongoose');
import Crop from './cropModel';
import { connectDB } from '../../db';
connectDB()

const rotationItemSchema = mongoose.Schema({
  division: {
    type: Number,
    required: true,
  },
  crop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crop',
  },
  cropName: {
    type: String,
  },
  plantingDate: {
    type: String,
    required: true,
  },
  harvestingDate: {
    type: String,
    required: true,
  },
  divisionSize: {
    type: Number,
    required: true,
  },
  nitrogenBalance: {
    type: Number,
    required: true,
  },
  directlyUpdated: { 
    type: Boolean,
    default: false, 
  },
});

const rotationYearSchema = mongoose.Schema({
  year: {
    type: Number,
    required: true,
  },
  rotationItems: [rotationItemSchema],
});

const rotationSchema = mongoose.Schema(
  {
    user: {
      type: String,
      required: true,
      ref: 'User',
    },
    fieldSize: {
      type: Number,
      required: [true, 'Field size is required'],
    },
    numberOfDivisions: {
      type: Number,
      required: [true, 'Number of divisions is required'],
    },
    rotationName: {
      type: String,
      required: [true, 'Rotation name is required'],
    },
    crops: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Crop',
      },
    ],
    rotationPlan: [rotationYearSchema],
  },
  {
    timestamps: true,
  }
);


// Populate crops in rotation plan with crop names and crop varieties before sending response to client  
// rotationItemSchema.pre('save', function (next) {
//   if (this.crop) {
//     Crop.findById(this.crop, (err, crop) => {
//       if (err) return next(err);
//       this.cropName = crop.cropName;
//       next();
//     });
//   } else {
//     next();
//   }
// });

export default mongoose.models.Rotation || mongoose.model('Rotation', rotationSchema);
```

# app/api/Models/selectionModel.ts

```ts
import mongoose from "mongoose"



const UserCropSelectionSchema = new mongoose.Schema({
    user: {
        type: String,
      ref: 'User',
      required: true
    },
    crop: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Crop',
      required: true
    },
    selectionCount: {
      type: Number,
      default: 0
    }
  });

export default mongoose.models.UserCropSelection || mongoose.model('UserCropSelection', UserCropSelectionSchema)
```

# app/api/Models/userModel.ts

```ts

import mongoose from 'mongoose'

const userSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: {
      values: ['farmer', 'admin'],
    },
    required: [true, '{VALUE} is not supported or missing']
  },
  name: {
    type: String,
    required: [true, 'Please add a name']
  },
  email: {
    type: String,
    required: [true, 'Please add an email '],
    unique: true
  },
  selectedCrops: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Crop'
  }],

  selectareCounts: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
},
  {
    timestamps: true
  });

export default mongoose.models.User || mongoose.model('User', userSchema)

```

# app/api/oauth/token/page.ts

```ts
var axios = require("axios").default;

require('dotenv').config();

var options = {
    method: 'POST',
    url: 'https://fictional-space-giggle-pwpr6qw7w5427v6q-3000.app.github.dev/',
    headers: {'content-type': 'application/x-www-form-urlencoded'},
    data: new URLSearchParams({
        grant_type: process.env.GRANT_TYPE,
        client_id: process.env.CLIENT_ID,
        client_secret: process.env.CLIENT_SECRET,
        audience: process.env.AUDIENCE
    })
};

axios.request(options).then(function (response) {
  console.log(response.data);
}).catch(function (error) {
  console.error(error);
});


console.log("it actually did something");console.log("it actually did something");console.log("it actually did something");console.log("it actually did something");console.log("it actually did something");console.log("it actually did something");
```

# app/componets/CropCard.tsx

```tsx
const CropCard = ({ crop, onSelect, isSelected }) => {
    return (
      <div className={`
        relative bg-white rounded-xl shadow-sm border transition-all duration-200
        ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200 hover:border-gray-300'}
      `}>
        {crop.imageUrl && (
          <div className="aspect-w-16 aspect-h-9 rounded-t-xl overflow-hidden">
            <img
              src={crop.imageUrl}
              alt={crop.cropName}
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        <div className="p-4">
          <div className="flex justify-between items-start mb-3">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{crop.cropName}</h3>
              <p className="text-sm text-gray-500">{crop.cropType} • {crop.cropVariety}</p>
            </div>
            {isSelected && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                Selected
              </span>
            )}
          </div>
  
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Planting Date:</span>
              <span className="text-gray-900">{new Date(crop.plantingDate).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Harvesting Date:</span>
              <span className="text-gray-900">{new Date(crop.harvestingDate).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Soil Type:</span>
              <span className="text-gray-900">{crop.soilType}</span>
            </div>
          </div>
  
          <div className="space-y-2">
            <div className="flex items-center">
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-green-500 h-2 rounded-full" 
                  style={{ width: `${(crop.nitrogenSupply / crop.nitrogenDemand) * 100}%` }}
                />
              </div>
              <span className="ml-2 text-sm text-gray-600">
                {Math.round((crop.nitrogenSupply / crop.nitrogenDemand) * 100)}%
              </span>
            </div>
            <p className="text-xs text-gray-500">Nitrogen Balance</p>
          </div>
  
          <div className="mt-4 flex justify-between gap-2">
            <button
              onClick={() => onSelect(crop)}
              className={`
                flex-1 px-4 py-2 text-sm font-medium rounded-lg
                ${isSelected 
                  ? 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}
              `}
            >
              {isSelected ? 'Selected' : 'Select Crop'}
            </button>
            <button
              onClick={() => window.location.href = `/Crud/GetAllInRotatie/SinglePag?crop=${crop._id}`}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              Details
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  export default CropCard;
```

# app/componets/Dashboard.tsx

```tsx
import { useState } from 'react';
import { NavLink } from 'react-router-dom';

const ModernDashboard = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Navigation Bar */}
      <nav className="fixed top-0 z-50 w-full bg-white border-b border-gray-200">
        <div className="px-3 py-3 lg:px-5 lg:pl-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center justify-start">
              <button 
                onClick={() => setSidebarOpen(!isSidebarOpen)}
                className="inline-flex items-center p-2 text-sm text-gray-500 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
              >
                <span className="sr-only">Toggle sidebar</span>
                <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                  <path 
                    fillRule="evenodd" 
                    d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                  />
                </svg>
              </button>
              <img src="/Logo.png" className="h-8 mr-3" alt="Agricultural Platform Logo" />
              <span className="self-center text-xl font-semibold sm:text-2xl whitespace-nowrap">
                Agricultural Platform
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700">
                EN
              </button>
              <button className="px-4 py-2 text-sm font-medium text-gray-900 bg-white border border-gray-200 rounded-lg hover:bg-gray-100 hover:text-blue-700 focus:z-10 focus:ring-2 focus:ring-blue-700 focus:text-blue-700">
                RO
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-40 w-64 h-screen pt-20 transition-transform ${
        isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
      } bg-white border-r border-gray-200`}>
        <div className="h-full px-3 pb-4 overflow-y-auto bg-white">
          <ul className="space-y-2 font-medium">
            <li>
              <NavLink
                to="/"
                className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900" 
                     viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                <span className="ml-3">Home</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/pages/News"
                className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900"
                     viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9.5a2.5 2.5 0 00-2.5-2.5H14" />
                </svg>
                <span className="ml-3">News</span>
              </NavLink>
            </li>
            <li>
              <NavLink
                to="/pages/Rotatie"
                className="flex items-center p-2 text-gray-900 rounded-lg hover:bg-gray-100"
              >
                <svg className="w-5 h-5 text-gray-500 transition duration-75 group-hover:text-gray-900"
                     viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span className="ml-3">Crop Rotation</span>
              </NavLink>
            </li>
          </ul>
        </div>
      </aside>

      {/* Main Content */}
      <div className={`${isSidebarOpen ? 'ml-64' : ''} p-4 pt-20 min-h-screen transition-all duration-300`}>
        <div className="p-4 bg-white rounded-lg shadow-sm">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
```

# app/componets/DashboardCard.tsx

```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardCardProps {
    title: string;
    metric: number;
    trend: number;
    data: { name: string; value: number }[];
}

const DashboardCard: React.FC<DashboardCardProps> = ({ title, metric, trend, data }) => {
    const trendColor = trend >= 0 ? 'text-green-600' : 'text-red-600';
    const trendIcon = trend >= 0 ? '↑' : '↓';

    return (
        <div className="rounded-xl bg-white p-6 shadow-soft transition-all duration-200 hover:shadow-lg">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-medium text-gray-500">{title}</h3>
                    <div className="mt-1 flex items-baseline">
                        <p className="text-2xl font-semibold text-gray-900">{metric}</p>
                        <span className={`ml-2 text-sm font-medium ${trendColor}`}>
                            {trendIcon} {Math.abs(trend)}%
                        </span>
                    </div>
                </div>
            </div>
            
            <div className="mt-4 h-32">
                <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                            dataKey="name" 
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis 
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={value => `${value}%`}
                        />
                        <Tooltip />
                        <Line 
                            type="monotone" 
                            dataKey="value"
                            stroke="#4F46E5"
                            strokeWidth={2}
                            dot={false}
                        />
                    </LineChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

export default DashboardCard;
```

# app/componets/GridGen.tsx

```tsx

import {chunk} from 'lodash';
import * as React from 'react';

interface GridGeneratorProps {
    cols?: number;
    children: React.ReactNode;
}
type GridGeneratorType = React.FC<GridGeneratorProps>;


const GridGenerator: GridGeneratorType = ({ children, cols = 3 }) => {
    const rows = chunk(React.Children.toArray(children), cols);
    return (
        <div>
            {rows.map((row  , i) => (
                <div key={i} className="row">
                    {row.map((col, j) => (
                        <div key={j} className="col">
                            {col}
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
};

export default GridGenerator;
```

# app/componets/hero.tsx

```tsx
export function Hero() {
  return (

      <div>
      
<section id="hero" className="d-flex align-items-center">
    <div className="container position-relative" data-aos="fade-up" data-aos-delay="100">
      <div className="row justify-content-center">
        <div className="col-xl-7 col-lg-9 text-center">
          <h1>Prototip Platforma agricola</h1>
          <h2>Platforma agricola care are de aface cu agricultura</h2>
        </div>
      </div>
      <div className="text-center">
        <a href="/desprenoi" className="btn-get-started scrollto">Vezi mai multe</a>
      </div>

      <div className="row icon-boxes">
        <div className="col-md-6 col-lg-3 d-flex align-items-stretch mb-5 mb-lg-0" data-aos="zoom-in" data-aos-delay="200">
          <div className="icon-box">
            <div className="icon"><i className="ri-stack-line"></i></div>
            <h4 className="title"><a href="">Lorem Ipsum</a></h4>
            <p className="description">Voluptatum deleniti atque corrupti quos dolores et quas molestias excepturi</p>
          </div>
        </div>

        <div className="col-md-6 col-lg-3 d-flex align-items-stretch mb-5 mb-lg-0" data-aos="zoom-in" data-aos-delay="300">
          <div className="icon-box">
            <div className="icon"><i className="ri-palette-line"></i></div>
            <h4 className="title"><a href="">Sed ut perspiciatis</a></h4>
            <p className="description">Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore</p>
          </div>
        </div>

        <div className="col-md-6 col-lg-3 d-flex align-items-stretch mb-5 mb-lg-0" data-aos="zoom-in" data-aos-delay="400">
          <div className="icon-box">
            <div className="icon"><i className="ri-command-line"></i></div>
            <h4 className="title"><a href="">Magni Dolores</a></h4>
            <p className="description">Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia</p>
          </div>
        </div>

        <div className="col-md-6 col-lg-3 d-flex align-items-stretch mb-5 mb-lg-0" data-aos="zoom-in" data-aos-delay="500">
          <div className="icon-box">
            <div className="icon"><i className="ri-fingerprint-line"></i></div>
            <h4 className="title"><a href="">Nemo Enim</a></h4>
            <p className="description">At vero eos et accusamus et iusto odio dignissimos ducimus qui blanditiis</p>
          </div>
        </div>

      </div>
    </div>
  </section>
</div>
    )
  }


```

# app/componets/LanguageSwitch.tsx

```tsx
import React from 'react';
import Cookies from 'js-cookie';

export const LanguageSwitch = () => {
    const setLocale = async (locale) => {
      // Set the cookie on the client side for immediate effect
      Cookies.set('language', locale);
      window.location.reload();
  
      // Make a request to the backend to set the cookie
      await fetch('/api/set-language', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ locale })
      });
    };
  
    const language = Cookies.get('language');
    console.log(language);
  
    return (
      <div>
        <button
          style={{
            background: 'none',
            border: 'none',
            fontWeight: 'bold',
            color: 'black',
            display: 'block',
            marginBottom: '0px' // Add spacing between buttons
          }}
          onClick={() => {
            setLocale('ro');
          }}
        >
          RO
        </button>
        <button
          style={{
            background: 'none',
            border: 'none',
            fontWeight: 'bold',
            color: 'black',
            display: 'block'
          }}
          onClick={() => {
            setLocale('en');
          }}
        >
          EN
        </button>
      </div>
    );
  };              
```

# app/componets/Mail.tsx

```tsx
'use client'
export default function Mail() {
return (

<div className="input-group">
<input type="email" name="email" placeholder="Email" />
 <button type="button" className="btn btn-primary" onClick={() => window.location.reload()}>Subscribe</button> 
</div>

);}
```

# app/componets/ModernCard.tsx

```tsx
import { useState } from 'react';

const ModernCard = ({ 
  title, 
  subtitle,
  content, 
  imageUrl, 
  actions,
  stats,
  expandable = false,
  className = ''
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden transition-all duration-200 hover:shadow-md ${className}`}>
      {imageUrl && (
        <div className="aspect-w-16 aspect-h-9">
          <img 
            src={imageUrl} 
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
      )}
      
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
            {subtitle && (
              <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
            )}
          </div>
        </div>

        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-4 py-2 border-y border-gray-100">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <p className="text-2xl font-semibold text-gray-900">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        <div className={`${expandable && !isExpanded ? 'line-clamp-3' : ''}`}>
          {content}
        </div>

        {expandable && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="mt-2 text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            {isExpanded ? 'Show less' : 'Show more'}
          </button>
        )}

        {actions && (
          <div className="mt-4 flex gap-2">
            {actions.map((action, index) => (
              <button
                key={index}
                onClick={action.onClick}
                className={`px-4 py-2 text-sm font-medium rounded-lg ${
                  action.primary 
                    ? 'bg-blue-600 text-white hover:bg-blue-700' 
                    : 'text-gray-700 bg-gray-100 hover:bg-gray-200'
                }`}
              >
                {action.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ModernCard;
```

# app/componets/ModernLayout.tsx

```tsx
'use client'
import { useState } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Camera, Home, Repeat, Users, Settings, LogOut } from 'lucide-react';

import { useUser } from '@auth0/nextjs-auth0/client';

const ModernLayout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const pathname = usePathname();
  const { user, isLoading } = useUser();

  const navigationItems = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'News', href: '/pages/News', icon: Home },
    { name: 'Crop Rotation', href: '/pages/Rotatie', icon: Repeat },
    { name: 'Dashboard', href: '/Dashboard', icon: Camera },
    { name: 'Users', href: '/pages/Login/Register', icon: Users, adminOnly: true },
  ];

  const isActivePath = (path) => pathname === path;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="fixed top-0 z-50 w-full bg-white border-b border-gray-200">
  <div className="px-4 sm:px-6 lg:px-8">
    <div className="flex h-16 items-center justify-between">
      <div className="flex items-center">
        <button 
          onClick={() => setSidebarOpen(!isSidebarOpen)}
          className="rounded-md p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-primary-500"
        >
          <span className="sr-only">Open sidebar</span>
          <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        <div className="ml-4 flex lg:ml-8">
          <Link href="/" className="flex items-center space-x-3">
            <img src="/Logo.png" alt="Logo" className="h-8 w-8" />
            <span className="text-lg font-semibold text-gray-900">Agricultural Platform</span>
          </Link>
        </div>
      </div>
      
      <div className="flex items-center space-x-4">
        {!isLoading && user && (
          <div className="hidden md:flex items-center space-x-4">
            <div className="flex flex-col items-end">
              <span className="text-sm font-medium text-gray-900">{user.name}</span>
              <span className="text-xs text-gray-500">{user.email}</span>
            </div>
            <img 
              src={user.picture} 
              alt="Profile" 
              className="h-10 w-10 rounded-full border-2 border-gray-200 object-cover"
            />
          </div>
        )}
      </div>
    </div>
  </div>
</header>

      {/* Sidebar */}
      <aside className={`fixed top-0 left-0 z-40 w-64 h-screen pt-16 transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        bg-white border-r border-gray-200`}
      >
        <div className="h-full px-3 py-4 overflow-y-auto">
          <nav className="space-y-1">
            {navigationItems.map((item) => {
              if (item.adminOnly && (!user || !user.userRoles?.includes('admin'))) {
                return null;
              }
              
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors
                    ${isActivePath(item.href)
                      ? 'bg-blue-50 text-blue-700'
                      : 'text-gray-700 hover:bg-gray-50'
                    }`}
                >
                  <item.icon className={`w-5 h-5 mr-3 ${
                    isActivePath(item.href) ? 'text-blue-700' : 'text-gray-400'
                  }`} />
                  {item.name}
                </Link>
              );
            })}

            {user && (
              <Link
                href="/api/auth/logout"
                className="flex items-center px-3 py-2 mt-auto text-sm font-medium text-red-700 rounded-lg hover:bg-red-50"
              >
                <LogOut className="w-5 h-5 mr-3 text-red-400" />
                Logout
              </Link>
            )}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`pt-16 transition-all duration-300 ease-in-out ${isSidebarOpen ? 'ml-64' : ''}`}>
        <div className="p-6">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default ModernLayout;
```

# app/componets/shared/index.ts

```ts

```

# app/Crud/CropForm.js

```js
"use client";
import { useGlobalContextCrop } from '../providers/culturaStore';
import { useGlobalContext } from '../providers/UserStore';
import FileBase from 'react-file-base64';
import CropRecommendations from './CropRecommandations';
import React, { useState, useEffect, useCallback } from 'react';
import { debounce } from 'lodash';

const CropForm = () => {
  const { createCrop } = useGlobalContextCrop();
  const { data } = useGlobalContext();

  const [cropName, setCropName] = useState(sessionStorage.getItem('cropName') || '');
  const [cropType, setCropType] = useState('');
  const [cropVariety, setCropVariety] = useState('');
  const [plantingDate, setPlantingDate] = useState('');
  const [harvestingDate, setHarvestingDate] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [soilType, setSoilType] = useState('');
  const [fertilizers, setFertilizers] = useState([]);
  const [pests, setPests] = useState([]);
  const [diseases, setDiseases] = useState([]);
  const [ItShouldNotBeRepeatedForXYears, setItShouldNotBeRepeatedForXYears] = useState('');
  const [climate, setClimate] = useState('');
  const [nitrogenSupply, setNitrogenSupply] = useState('');
  const [nitrogenDemand, setNitrogenDemand] = useState('');
  const [showAdditional, setShowAdditional] = useState(false);

  const onSubmit = (e) => {
    e.preventDefault();

    const newCrop = {
      cropName,
      cropType,
      cropVariety,
      plantingDate,
      harvestingDate,
      description,
      imageUrl,
      soilType,
      climate,
      fertilizers,
      pests,
      diseases,
      ItShouldNotBeRepeatedForXYears: !isNaN(parseInt(ItShouldNotBeRepeatedForXYears))
        ? parseInt(ItShouldNotBeRepeatedForXYears)
        : null,
      nitrogenSupply: nitrogenSupply,
      nitrogenDemand: nitrogenDemand,
    };

    createCrop(newCrop);
  };

  const debouncedSetCropName = useCallback(
    debounce((value) => sessionStorage.setItem('cropName', value), 1000),
    []
  );

  useEffect(() => {
    if (cropName) {
      debouncedSetCropName(cropName);
    }
  }, [cropName, debouncedSetCropName]);


  const toggleAdditionalFields = () => setShowAdditional(!showAdditional);
  return (
    <div className="container">
      <section className="form my-5">
        <form onSubmit={onSubmit}>
          <div className="row">
            <div className="col-md-3 form-group">
              <label htmlFor="cropName">Crop Name:</label>
              <input
                type="text"
                name="cropName"
                id="cropName"
                value={cropName}
                onChange={(e) => {
                  setCropName(e.target.value);
                }}
                className="form-control"
                required
              />
            </div>
           
            <div className="col-md-3 form-group">
              <label htmlFor="cropVariety">Crop Variety:</label>
              <input
                type="text"
                name="cropVariety"
                id="cropVariety"
                value={cropVariety}
                onChange={(e) => setCropVariety(e.target.value)}
                className="form-control"
              />
            </div>
            
            <br />
            <strong>Rotation Requirements:</strong>
            <br />
            <div className="row">
              <div className="col-md-3 form-group">
                <label htmlFor="pests">Pests:</label>
                <select
                  name="pests"
                  id="pests"
                  multiple
                  value={pests}
                  onChange={(e) =>
                    setPests(Array.from(e.target.selectedOptions, (option) => option.value))
                  }
                  required
                  className="form-control"
                >
                  <option value="">Select a pest</option>
                  <option value="aphids">Aphids</option>
                  <option value="beetles">Beetles</option>
                  <option value="flies">Flies</option>
                  <option value="spiders">Spiders</option>
                </select>
              </div>
              <div className="col-md-3 form-group">
                <label htmlFor="diseases">Diseases:</label>
                <select
                  name="diseases"
                  id="diseases"
                  multiple
                  value={diseases}
                  onChange={(e) =>
                    setDiseases(Array.from(e.target.selectedOptions, (option) => option.value))
                  }
                  className="form-control"
                  required
                >
                  <option value="">Select a disease</option>
                  <option value="bee">Bee</option>
                  <option value="fusarium">Fusarium</option>
                  <option value="mildew">Mildew</option>
                  <option value="mold">Mold</option>
                  <option value="powderyMildew">Powdery Mildew</option>
                  <option value="pest">Pest</option>
                  <option value="rust">Rust</option>
                  <option value="disorder">Disorder</option>
                  <option value="virus">Virus</option>
                </select>
              </div>
            </div>
            <div className="col-md-3 form-group">
              <label htmlFor="nitrogenSupply">Nitrogen Supply:</label>
              <input
                type="number"
                name="nitrogenSupply"
                id="nitrogenSupply"
                value={nitrogenSupply}
                onChange={(e) => setNitrogenSupply(e.target.value)}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-3 form-group">
              <label htmlFor="nitrogenDemand">Nitrogen Demand:</label>
              <input
                type="number"
                name="nitrogenDemand"
                id="nitrogenDemand"
                value={nitrogenDemand}
                onChange={(e) => setNitrogenDemand(e.target.value)}
                className="form-control"
                required
              />
            </div>
            <div className="col-md-3 form-group">
              <label htmlFor="ItShouldNotBeRepeatedForXYears">Do Not Repeat for X Years:</label>
              <input
                type="number"
                name="ItShouldNotBeRepeatedForXYears"
                id="ItShouldNotBeRepeatedForXYears"
                value={ItShouldNotBeRepeatedForXYears}
                onChange={(e) => setItShouldNotBeRepeatedForXYears(e.target.value)}
                className="form-control"
                required
              />
            </div>
          </div>
          <button type="button" onClick={toggleAdditionalFields} className="btn btn-block mt-2 mb-2">
            {showAdditional ? 'Hide Additional Fields' : 'Show Additional Fields'}
          </button>

          {showAdditional && (
            <>
              <div className="row">
                <div className="col-md-3 form-group">
                  <label htmlFor="fertilizers">Used Fertilizers:</label>
                  <select
                    name="fertilizers"
                    id="fertilizers"
                    multiple
                    value={fertilizers}
                    onChange={(e) =>
                      setFertilizers(Array.from(e.target.selectedOptions, (option) => option.value))
                    }
                    className="form-control"
                  >
                    <option value="nitrogen">Nitrogen</option>
                    <option value="phosphorus">Phosphorus</option>
                    <option value="potassium">Potassium</option>
                    <option value="organic">Organic</option>
                  </select>
                </div>
                <div className="col-md-3 form-group">
                  <label htmlFor="climate">Climate:</label>
                  <input
                    type="text"
                    name="climate"
                    id="climate"
                    value={climate}
                    onChange={(e) => setClimate(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-3 form-group">
                  <label htmlFor="cropType">Crop Type:</label>
                  <select
                    name="cropType"
                    id="cropType"
                    value={cropType}
                    onChange={(e) => setCropType(e.target.value)}
                    className="form-control"
                  >
                    <option value="">Select a type</option>
                    <option value="vegetables">Vegetables</option>
                    <option value="fruits">Fruits</option>
                    <option value="cereals">Cereals</option>
                    <option value="other">Other</option>
                  </select>
                </div>
                <div className="col-md-3 form-group">
                  <label htmlFor="soilType">Soil Type:</label>
                  <select
                    name="soilType"
                    id="soilType"
                    value={soilType}
                    onChange={(e) => setSoilType(e.target.value)}
                    className="form-control"
                  >
                    <option value="">Select a soil type</option>
                    <option value="clay">Clay</option>
                    <option value="sandy">Sandy</option>
                    <option value="silty">Silty</option>
                    <option value="loamy">Loamy</option>
                  </select>
                </div>
              </div>
              <div className="row">
                <div className="col-md-3 form-group">
                  <label htmlFor="plantingDate">Planting Date:</label>
                  <input
                    type="date"
                    name="plantingDate"
                    id="plantingDate"
                    value={plantingDate}
                    onChange={(e) => setPlantingDate(e.target.value)}
                    className="form-control"
                  />
                  <label htmlFor="harvestingDate">Harvesting Date:</label>
                  <input
                    type="date"
                    name="harvestingDate"
                    id="harvestingDate"
                    value={harvestingDate}
                    onChange={(e) => setHarvestingDate(e.target.value)}
                    className="form-control"
                  />
                </div>
                <div className="col-md-3 form-group">
                  <label htmlFor="description">Description:</label>
                  <textarea
                    name="description"
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="form-control"
                  />
                </div>
              </div>
              <div className="row">
                <div className="col-md-3 form-group">
                  <h3 className="text-center mb-4">Add Image</h3>
                  <FileBase multiple={false} onDone={({ base64 }) => setImageUrl(base64)} />
                </div>
              </div>
            </>
          )}

          <div className="row">
            <div className="col-md-3 form-group">
              <h3 className="text-center mb-4">Add Image</h3>
              <FileBase multiple={false} onDone={({ base64 }) => setImageUrl(base64)} />
            </div>
          </div>
          <br />
          <div className="form-group">
            <button className="btn btn-primary btn-block" type="submit">
              Add Crop
            </button>
          </div>
        </form>
      </section>

      {cropName && (
        <>
          <h2 className="text-center mb-4">Similar Crops</h2>
          <CropRecommendations cropName={cropName}  />
        </>
      )}
    </div>
  );
}

export default CropForm;



```

# app/Crud/CropRecommandations.tsx

```tsx


"use client"
import React, { useEffect, useState } from 'react';
import { useGlobalContextCrop } from '../providers/culturaStore';

export default function CropRecommendations({ cropName, token }: { cropName: string, token: string }) {
  const { getCropRecommendations } = useGlobalContextCrop();
  const [recommendations, setRecommendations] = useState<any[]>([]);

  useEffect(() => {
    getCropRecommendations(cropName).then((recommendations) => {
      if (recommendations !== undefined) {
        setRecommendations(recommendations);
      }
    });
  }, [cropName, getCropRecommendations, token]);


  return (
    <div className="container">
      <div className="row">
        {recommendations.map((recommendation, index) => (
          <div key={index} className="col-sm-6 col-md-4 col-lg-3">
            <div
              className="card border-primary mb-3"
              style={{ maxWidth: '18rem' }}
            >
              <div className="card-header">{recommendation.cropName}</div>
              <div className="card-body">
                <p className="card-text small">
                  <strong>Diseases:</strong>{' '}
                  {recommendation.diseases.join(', ')}
                </p>
                <p className="card-text small">
                  <strong>Pests:</strong> {recommendation.pests.join(', ')}
                </p>
                <p className="card-text small">
                  <strong>Nitrogen Supply:</strong>{' '}
                  {recommendation.nitrogenSupply}
                </p>
                <p className="card-text small">
                  <strong>Nitrogen Demand:</strong>{' '}
                  {recommendation.nitrogenDemand}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
```

# app/Crud/GetAllInRotatie/[SinglePag]/components/CropCardComponent.tsx

```tsx
import React from 'react';
import { Card, ListGroup, Button } from 'react-bootstrap';
import { useSignals  } from "@preact/signals-react/runtime";



function CropCardComponent({ 
  crops, 
  handleDelete, 
  canEdit, 
  setEditMode 
}: {
  crops?: any, 
  handleDelete?: () => void, 
  canEdit?: boolean, 
  setEditMode?: (editMode: boolean) => void 
}) {
  useSignals();

  console.log('CropCardComponent.tsx rendered')

  if (!crops) {
    return <div>No crops data provided</div>;
  }
  
  return (
    <Card style={{ width: '18rem' }}>
      <Card.Body>
        <Card.Title>{crops?.cropName}</Card.Title>
        <Card.Subtitle className="mb-2 text-muted">{crops?.cropType}</Card.Subtitle>
        <Card.Text>{crops?.description}</Card.Text>
      </Card.Body>
      <ListGroup variant="flush">
        <ListGroup.Item>Crop Variety: {crops?.cropVariety}</ListGroup.Item>
        <ListGroup.Item>Diseases: {crops?.diseases.join(', ')}</ListGroup.Item>
        <ListGroup.Item>Fertilizers: {crops?.fertilizers.join(', ')}</ListGroup.Item>
        <ListGroup.Item>Pests: {crops?.pests.join(', ')}</ListGroup.Item>
        <ListGroup.Item>Soil Type: {crops?.soilType}</ListGroup.Item>
        <ListGroup.Item>Nitrogen Demand: {crops?.nitrogenDemand}</ListGroup.Item>
        <ListGroup.Item>Nitrogen Supply: {crops?.nitrogenSupply}</ListGroup.Item>
        <ListGroup.Item>Planting Date: {crops?.plantingDate}</ListGroup.Item>
        <ListGroup.Item>Harvesting Date: {crops?.harvestingDate}</ListGroup.Item>
        <ListGroup.Item>Soil Residual Nitrogen: {crops?.soilResidualNitrogen}</ListGroup.Item>
      </ListGroup>
      {canEdit && (
        <Card.Body>
          <Button variant="danger" onClick={handleDelete}>
            Delete
          </Button>
          <Button variant="primary" onClick={() => setEditMode(true)}>
            Edit
          </Button>
        </Card.Body>
      )}
    </Card>
  );
}

export default CropCardComponent;
```

# app/Crud/GetAllInRotatie/[SinglePag]/components/FormComponent.tsx

```tsx
import React from 'react';
import { Form, Button, Row, Col } from 'react-bootstrap';


function FormComponent({ handleUpdate, handleChange, handleArrayChange, updatedCrop, editMode, setEditMode }) {
  if (!editMode) {
    return null; 
  }
  return (
    <Form onSubmit={handleUpdate}>
      <Row>
        <Col>
          <Form.Group>
            <Form.Label>Crop Name</Form.Label>
            <Form.Control
              type="text"
              name="cropName"
              value={updatedCrop?.cropName}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="description"
              value={updatedCrop?.description}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Crop Type</Form.Label>
            <Form.Control
              type="text"
              name="cropType"
              value={updatedCrop?.cropType}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Crop Variety</Form.Label>
            <Form.Control
              type="text"
              name="cropVariety"
              value={updatedCrop?.cropVariety}
              onChange={handleChange}
            />
          </Form.Group>
        </Col>

        <Col>
          {updatedCrop?.diseases?.map((disease, index) => (
            <Form.Group key={index}>
              <Form.Label>Disease {index + 1}</Form.Label>
              <Form.Control
                type="text"
                name={`disease${index}`}
                value={disease}
                onChange={(e) => handleArrayChange(e, index, 'diseases')}
              />
            </Form.Group>
          ))}

          {updatedCrop?.pests?.map((pest, index) => (
            <Form.Group key={index}>
              <Form.Label>Pest {index + 1}</Form.Label>
              <Form.Control
                type="text"
                name={`pest${index}`}
                value={pest}
                onChange={(e) => handleArrayChange(e, index, 'pests')}
              />
            </Form.Group>
          ))}
        </Col>
      </Row>

      <Row>
        <Col>
          <Form.Group>
            <Form.Label>Soil Type</Form.Label>
            <Form.Control
              type="text"
              name="soilType"
              value={updatedCrop?.soilType}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Nitrogen Demand</Form.Label>
            <Form.Control
              type="number"
              name="nitrogenDemand"
              value={updatedCrop?.nitrogenDemand}
              onChange={handleChange}
            />
          </Form.Group>
        </Col>

        <Col>
          <Form.Group>
            <Form.Label>Nitrogen Supply</Form.Label>
            <Form.Control
              type="number"
              name="nitrogenSupply"
              value={updatedCrop?.nitrogenSupply}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Planting Date</Form.Label>
            <Form.Control
              type="date"
              name="plantingDate"
              value={updatedCrop?.plantingDate}
              onChange={handleChange}
            />
          </Form.Group>
        </Col>
      </Row>

      <Row>
        <Col>
          <Form.Group>
            <Form.Label>Harvesting Date</Form.Label>
            <Form.Control
              type="date"
              name="harvestingDate"
              value={updatedCrop?.harvestingDate}
              onChange={handleChange}
            />
          </Form.Group>

          <Form.Group>
            <Form.Label>Soil Residual Nitrogen</Form.Label>
            <Form.Control
              type="number"
              name="soilResidualNitrogen"
              value={updatedCrop?.soilResidualNitrogen}
              onChange={handleChange}
            />
          </Form.Group>
        </Col>
      </Row>

      <Button variant="primary" type="submit">
        Save Changes
      </Button>
      <Button variant="secondary" onClick={() => setEditMode(false)}>
        Cancel
      </Button>
    </Form>
  );
}

export default FormComponent;

```

# app/Crud/GetAllInRotatie/[SinglePag]/components/SelectAreaComponent.tsx

```tsx
import React from 'react';
import { Form, Button } from 'react-bootstrap';

function SelectAreaComponent({ onSubmit, selectarea, setSelectarea, numSelections, setNumSelections }) {
  return (
    <Form onSubmit={(e) => onSubmit(e, !selectarea)}>
      <Form.Group>
        <Form.Label>Number of selections</Form.Label>
        <Form.Control
          type="number"
          min="1"
          value={numSelections}
          onChange={(e) => setNumSelections(parseInt(e.target.value))}
        />
      </Form.Group>
      <Button variant="success" type="submit">
        {selectarea ? 'Deselect' : 'Select'}
      </Button>
    </Form>
  );
}

export default SelectAreaComponent;

```

# app/Crud/GetAllInRotatie/[SinglePag]/page.tsx

```tsx
"use client"
import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Form, Container, Button, Card, ListGroup } from 'react-bootstrap';
import { useRouter } from 'next/navigation';
import { useGlobalContext } from '../../../providers/UserStore';
import { useGlobalContextCrop } from '../../../providers/culturaStore';
import FormComponent from './components/FormComponent';
import CropCardComponent from './components/CropCardComponent';
import SelectAreaComponent from './components/SelectAreaComponent';
import { useSignals  } from "@preact/signals-react/runtime";
import { useUser } from '@auth0/nextjs-auth0/client';

function SinglePag() {
  useSignals();
  const { data: userData } = useGlobalContext();
  const { user, error, isLoading: isUserLoading } = useUser();

  const {
    singleCrop,
    isLoading,
    isError,
    message,
    selectare,
    SinglePage,
    deleteCrop,
    updateCrop,
  } = useGlobalContextCrop();

  const navigate = useRouter();
  const _id = useSearchParams().get('crop');
  const crops = singleCrop.value;

  const [selectarea, setSelectarea] = useState(false);
  const [numSelections, setNumSelections] = useState(1);
  const [editMode, setEditMode] = useState(false);
  const [updatedCrop, setUpdatedCrop] = useState(() => ({
    cropName: crops?.cropName,
    ItShouldNotBeRepeatedForXYears: crops?.ItShouldNotBeRepeatedForXYears,
    description: crops?.description,
    cropType: crops?.cropType,
    cropVariety: crops?.cropVariety,
    diseases: crops?.diseases,
    fertilizers: crops?.fertilizers,
    pests: crops?.pests,
    soilType: crops?.soilType,
    nitrogenDemand: crops?.nitrogenDemand,
    nitrogenSupply: crops?.nitrogenSupply,
    plantingDate: crops?.plantingDate,
    harvestingDate: crops?.harvestingDate,
    soilResidualNitrogen: crops?.soilResidualNitrogen,
  }));
  


  const canEdit = userData.role.toLocaleLowerCase() === 'admin' ||  crops?.user == userData._id;
  const editPressed = () => {
    setEditMode(true);
  }
  

    useEffect(() => {
      if (!isUserLoading) {
       
        SinglePage(_id);
       console.log('SinglePage call');
      }
    }, [isUserLoading]);

    if (isError.message) {
      console.log("Eroare  " + message);
    }
    useEffect(() => {
      setUpdatedCrop({
        cropName: crops?.cropName,
        ItShouldNotBeRepeatedForXYears: crops?.ItShouldNotBeRepeatedForXYears,
        description: crops?.description,
        cropType: crops?.cropType,
        cropVariety: crops?.cropVariety,
        diseases: crops?.diseases,
        fertilizers: crops?.fertilizers,
        pests: crops?.pests,
        soilType: crops?.soilType,
        nitrogenDemand: crops?.nitrogenDemand,
        nitrogenSupply: crops?.nitrogenSupply,
        plantingDate: crops?.plantingDate,
        harvestingDate: crops?.harvestingDate,
        soilResidualNitrogen: crops?.soilResidualNitrogen,
      });
    }, [crops]); // Only re-run the effect if crops changes
    
  
console.log('crops', crops);

 // Don't render the components until the necessary data is available
 if (isLoading.value || !crops) {
  return (
    <div>
      <p>Loading crop ...</p>
    </div>
  );
}

  // if (isError) {
  //   return <h1>{message}</h1>;
  // }

  const handleDelete = async () => {
    try {
      await deleteCrop(_id);
      console.log('Crop deleted');
      navigate.push('/pages/Rotatie');
    } catch (error) {
      console.error('Error deleting crop:', error);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    await updateCrop(_id, updatedCrop);
    setEditMode(false);
    
  };

  const handleChange = (e) => {
    
    const { name, value } = e.target;
    setUpdatedCrop({ ...updatedCrop, [name]: value });
  };

  const handleArrayChange = (e, index, field) => {
    const newArr = [...updatedCrop[field]];
    newArr[index] = e.target.value;
    setUpdatedCrop({ ...updatedCrop, [field]: newArr });
  };

  const onSubmit = async (e, newSelectArea) => {
    e.preventDefault();
    if (userData && userData.role.toLowerCase() === "farmer") {
      await selectare(_id, newSelectArea, numSelections);
      setSelectarea(newSelectArea);
    }
  };
  console.log(updatedCrop)

  return (
    <div>
       <CropCardComponent 
  crops={crops} 
  handleDelete={handleDelete} 
  canEdit={canEdit} 
  setEditMode={setEditMode} 
/>
      <FormComponent 
        handleUpdate={handleUpdate} 
        handleChange={handleChange} 
        handleArrayChange={handleArrayChange} 
        updatedCrop={updatedCrop} 
        editMode={editMode} 
        setEditMode={setEditMode} 
      />

      <SelectAreaComponent 
        onSubmit={onSubmit} 
        selectarea={selectarea} 
        setSelectarea={setSelectarea} 
        numSelections={numSelections} 
        setNumSelections={setNumSelections} 
      />
    </div>
  );
}


export default SinglePag;






```

# app/Crud/GetAllInRotatie/page.tsx

```tsx
import Link from 'next/link';

export default function Continut({ crop }: { crop: any }): JSX.Element {
  return (
    <>
      <div className="thumbnail">
        {/* <Image src={"data:image/jpeg;" + crop.image.substring(2, crop.image.length - 2)} width={500} height={500} className="rounded img-fluid img" alt="Paris" /> */}
        <p>
          <strong>{crop.cropName}</strong>
          <br />
          <strong>{crop.cropType}</strong>
        </p>
        <p>{crop.description} </p>
        <p>Soil type: {crop.soilType}</p>
        <p>Should not be repeated for {crop.ItShouldNotBeRepeatedForXYears} years</p>
      </div>

      <Link href={`/Crud/GetAllInRotatie/SinglePag?crop=${crop._id}`}>
        <button type="button" className="btn btn-primary">
          See more
        </button>
      </Link>
    </>
  );
}


```

# app/Crud/GetAllPosts/[SinglePost]/page.tsx

```tsx
"use client"
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Container, Button, Form } from 'react-bootstrap';
import { useGlobalContextPost } from '../../../providers/postStore';
import { useGlobalContext } from '../../../providers/UserStore';


// interface SinglePostProps {
//   postId: string;
// }

export default function SinglePost() {
  const postId = useSearchParams().get("post") as string;
  const { data: allData, loading, getPost, deletePost, updatePost } = useGlobalContextPost();
  const data = allData?.posts;
  const { data: user } = useGlobalContext();
  const isAdmin = user?.role.toLowerCase() === 'admin';
  const [editMode, setEditMode] = useState(false);
  const [updatedPost, setUpdatedPost] = useState({
    title: '',
    brief: '',
    description: '',
  });

  useEffect(() => {
    getPost(postId);
  }, [ postId]);

  useEffect(() => {
    if (data) {
      setUpdatedPost({
        title: data.title,
        brief: data.brief,
        description: data.description,
      });
    }
  }, [data]);

  const handleDelete = async () => {
    await deletePost(data?._id);
  };

  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    await updatePost(data?._id, {
      title: updatedPost.title,
      brief: updatedPost.brief,
      description: updatedPost.description,
    });
    setEditMode(false);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setUpdatedPost({ ...updatedPost, [name]: value });
  };

  if (loading) {
    return <h1>Loading...</h1>;
  }

  if (!data) {
    return <h1>Nothing to show</h1>;
  }

  return (
    <Container>
      {editMode ? (
        <Form onSubmit={handleUpdate}>
          <Form.Group>
            <Form.Label>Title</Form.Label>
            <Form.Control
              type="text"
              name="title"
              value={updatedPost.title}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Brief</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              name="brief"
              value={updatedPost.brief}
              onChange={handleChange}
            />
          </Form.Group>
          <Form.Group>
            <Form.Label>Description</Form.Label>
            <Form.Control
              as="textarea"
              rows={5}
              name="description"
              value={updatedPost.description}
              onChange={handleChange}
            />
          </Form.Group>
          <Button variant="primary" type="submit">
            Save Changes
          </Button>
          <Button variant="secondary" onClick={() => setEditMode(false)}>
            Cancel
          </Button>
        </Form>
      ) : (
        <>
          <h1>{data.title}</h1>
          <p>{data.brief}</p>
          <p>{data.description}</p>
          {isAdmin && (
            <>
              <Button variant="danger" onClick={handleDelete}>
                Delete Post
              </Button>
              <Button variant="primary" onClick={() => setEditMode(true)}>
                Edit Post
              </Button>
            </>
          )}
        </>
      )}
    </Container>
  );
};

 




```

# app/Crud/GetAllPosts/page.tsx

```tsx
import Link from 'next/link';

function Continut({ data }: { data: any }): JSX.Element {
    return (
        <div className="h-screen flex flex-col">
            <div className="flex-grow">
                <h1>{data.title}</h1>
                {data.brief.length > 400 ? (
                    <p>{data.brief.slice(0, 400)}...</p>
                ) : (
                    <p>{data.brief}</p>
                )}
            </div>
            <div className="mt-auto">
                <Link href={`/Crud/GetAllPosts/SinglePost?post=${data._id}`}>
                    <button type="button" className="btn btn-primary">See article</button>
                </Link>
            </div>
        </div>
    );
}

export default Continut;


```

# app/Crud/Header.tsx

```tsx
"use client"
import { Dropdown } from 'react-bootstrap';
import { useGlobalContext } from '../providers/UserStore';
import styles from '../../styles/Header.module.css';
import Link from 'next/link';

function HeaderLog() {
  const { data , login , logout} = useGlobalContext();

  return (
    <header className={`${styles.headerModule} py-2`}>
      {data && data.name ? (
        <Dropdown>
          <Dropdown.Toggle variant="outline-secondary" id="dropdownMenuButton1">
            <Link href="/Dashboard/" style={{ textDecoration: 'none', color: '#fff' }}>
            {data.picture && (
  <img 
    src={data.picture} 
    alt="User Avatar" 
    width="40" 
    height="40" 
    style={{ borderRadius: "25%", marginRight: "10px" }} 
  />
)}
              {data.name}
            </Link>
          </Dropdown.Toggle>
          <Dropdown.Menu>
            <Dropdown.Item as={Link} href="/pages/Rotatie">Crop library</Dropdown.Item>
            <Dropdown.Item as={Link} href="/Dashboard/">Dashboard</Dropdown.Item>
            {data.role.toLowerCase() === 'farmer' && (
              <>
                <Dropdown.Item as={Link} href="/rotation-dashboard">Crop rotation</Dropdown.Item>
                {/* <Dropdown.Item as={Link} href="/pages/Recomandari/">Analitics</Dropdown.Item> */}
              </>
            )}
            <Dropdown.Item onClick={logout}>Logout</Dropdown.Item>
          </Dropdown.Menu>
        </Dropdown>
      ) : (
        <div>
          <div onClick={login} tabIndex={0}>Log in</div>
        </div>
      )}
    </header>
  );
}

export default HeaderLog;
```

# app/Crud/PostForm.tsx

```tsx
"use client"

import { useState } from 'react'
import FileBase from 'react-file-base64';
import { useGlobalContextPost } from '../providers/postStore';
import { useGlobalContext } from '../providers/UserStore';
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';

function PostForm() {
    const [title, setTitle] = useState('');
    const [brief, setBrief] = useState('');
    const [description, setDescription] = useState('');
    const [image, setImage] = useState('');
    const { createPost } = useGlobalContextPost();
    const { data } = useGlobalContext();

    const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (!title || !brief || !description) {
            alert('Ceva lipseste');
            return;
        }
        createPost({ title, brief, description, image, id: '', _id: '', user: '', token: '' }, data.token);
        setTitle('');
        setBrief('');
        setDescription('');
        setImage('');
    };

    return (
        <section className='form'>
            <Form onSubmit={onSubmit}>
                <Form.Group>
                    <Form.Label htmlFor='title'>Titlu:</Form.Label>
                    <Form.Control
                        type='title'
                        name='title'
                        id='title'
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                    />
                    <Form.Label htmlFor='text'>Descriere pe scurt:</Form.Label>
                    <Form.Control
                        type='text'
                        name='text'
                        id='text'
                        value={brief}
                        onChange={(e) => setBrief(e.target.value)}
                    />
                    <Form.Label htmlFor='description'>Continut:</Form.Label>
                    <Form.Control
                        type='description'
                        name='description'
                        id='description'
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <Form.Label htmlFor='image'>Imagine:</Form.Label>
                    <FileBase
                        multiple={false}
                        onDone={({ base64 }: { base64: string }) => setImage(base64)}
                    />
                    <Button type='submit' variant='primary' className='btn-block'>
                        Adauga
                    </Button>
                </Form.Group>
            </Form>
        </section>
    );
}

export default PostForm;
```

# app/Crud/PostItem.tsx

```tsx
type postType = {
    _id: string
    title: string
    text: string
    createdAt: string
    }

export default function PostItem(  { post }: { post: postType }  ) {
    
    return (
        <div className='post'>
            <h3>{post.title}</h3>
            <p>{post.text}</p>
            <div>{new Date(post.createdAt).toLocaleString('en-US')}</div>
        </div>
    );
}

```

# app/Crud/Rotatie.module.css

```css
.cropList {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-around;
    margin: -15px;
  }
  
  .crop {
    flex: 1 0 20%; /* change as needed, 20% will fit 5 in a row */
    margin: 15px;
    padding: 20px;
 
    border-radius: 10px;
    background-color: #f9f9f9;
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }
  
  .cropName {
    margin: 0;
    margin-bottom: 10px;
    color: #333;
  }
  
  .cropDetails {
    display: flex;
    justify-content: space-between;
  }
  
  .cropDates {
    margin-top: 10px;
  }
  
  .cropImage {
    width: 100%;
    height: auto;
    object-fit: cover;
    margin-top: 10px;
  }
  
  .additionalInfo {
    margin-top: 10px;
  }
  

  .crop {
    border: 1px solid #ddd;
    padding: 8px;
    margin-bottom: 8px;
    border-radius: 5px;
    background-color: #f9f9f9;
  }
  
  .cropName {
    font-size: 1.2em;
    margin-bottom: 4px;
  }
  
  .cropDetails, .cropDates, .additionalInfo, .creationDate {
    margin-bottom: 8px;
  }
  
  .cropImage {
    max-width: 100%;
    height: auto;
    margin-bottom: 8px;
  }
  
  .seeMoreButton {
    background-color: #007bff;
    color: white;
    border: none;
    padding: 4px 8px;
    cursor: pointer;
    border-radius: 3px;
  }
  
  .seeMoreButton:hover {
    background-color: #0056b3;
  }
  
  .listContainer ul {
    padding-left: 20px;
  }
  
  .creationDate p {
    margin: 0;
  }
  
```

# app/Crud/RotatieItem.tsx

```tsx
"use client";
import { useGlobalContextCrop } from '../providers/culturaStore';
import styles from './Rotatie.module.css';
import { Button } from 'react-bootstrap'; 
import React, { useEffect, useState } from 'react';

function RotatieItem({ crops, userID }) {
  const { deleteCrop, message } = useGlobalContextCrop();
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 8;

  // Filter crops based on search term
  const filteredCrops = crops.value.filter(crop => {
    const regex = new RegExp(searchTerm, 'i');
    return regex.test(crop.cropName) || regex.test(crop.cropType) || regex.test(crop.cropVariety);
  });

  // Calculate the current items to display
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCrops.slice(indexOfFirstItem, indexOfLastItem);

  // Change page
  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  return (
    <div>
      <input
        type="text"
        placeholder="Search crops..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className={styles.searchInput}
      />
      <div className={styles.cropList}>
        {currentItems.map((crop) => (
          <CropItem key={crop._id} crop={crop} deleteCrop={deleteCrop} />
        ))}
      </div>
      <Pagination
        itemsPerPage={itemsPerPage}
        totalItems={filteredCrops.length}
        paginate={paginate}
        currentPage={currentPage}
      />
    </div>
  );
}

function Pagination({ itemsPerPage, totalItems, paginate, currentPage }) {
  const pageNumbers = [];

  for (let i = 1; i <= Math.ceil(totalItems / itemsPerPage); i++) {
    pageNumbers.push(i);
  }

  if (pageNumbers.length <= 1) {
    return null;
  }

  return (
    <nav>
      <ul className='pagination'>
        {pageNumbers.map(number => (
          <li key={number} className={`page-item ${currentPage === number ? 'active' : ''}`}>
            <a onClick={() => paginate(number)} className='page-link'>
              {number}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}

function CropItem({ crop, deleteCrop }) {
  const [showMore, setShowMore] = useState(false);

  return (
    <div className={styles.crop}>
      <h2 className={styles.cropName}>{crop.cropName}</h2>
      <div className={styles.cropDetails}>
        <h3>{crop.cropType}</h3>
        <h3>{crop.cropVariety}</h3>
      </div>
      <div className={styles.cropDates}>
        <div>Planting date: {crop.plantingDate}</div>
        <div>Harvesting date: {crop.harvestingDate}</div>
      </div>
      <p>{crop.description}</p>
      {crop.imageUrl && (
        <img
          src={'data:image/jpeg;' + crop.imageUrl.substring(2, crop.imageUrl.length - 2)}
          alt={crop.cropName}
          className={styles.cropImage}
        />
      )}
      {showMore && (
        <div className={styles.additionalInfo}>
          <div>Soil type: {crop.soilType}</div>
          <div>Climate: {crop.climate}</div>
          <div>It should not be repeated for {crop.ItShouldNotBeRepeatedForXYears} years</div>
          <div className={styles.listContainer}>
            <p>Fertilizers:</p>
            <ul>
              {crop.fertilizers.map((fertilizer, index) => (
                <li key={index}>{fertilizer}</li>
              ))}
            </ul>
            <p>Pests:</p>
            <ul>
              {crop.pests.map((pest, index) => (
                <li key={index}>{pest}</li>
              ))}
            </ul>
            <p>Diseases:</p>
            <ul>
              {crop.diseases.map((disease, index) => (
                <li key={index}>{disease}</li>
              ))}
            </ul>
          </div>
        </div>
      )}
      <button onClick={() => setShowMore(!showMore)} className={`${styles.seeMoreButton} btn btn-block mt-2 mb-2`}>
        {showMore ? 'See Less..' : 'See More..'}
      </button>
      <div className={styles.creationDate}>
        <p>Adaugat la:</p>
        <div>{new Date(crop.createdAt).toLocaleString('en-US')}</div>
      </div>
      <Button variant="danger" size="sm" onClick={() => deleteCrop(crop._id)}>
        Delete Crop
      </Button>
    </div>
  );
}

export default RotatieItem;



```

# app/Crud/Spinner.tsx

```tsx
function Spinner() {
    return (
      <div className='loadingSpinnerContainer'>
        <div className='loadingSpinner'></div>
      </div>
    )
  }
  
  export default Spinner
```

# app/db.js

```js

const mongoose = require('mongoose')

export async function connectDB() {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI)
        console.log('Connected ' + conn.connection.host)
   
    } catch (error){
        console.log(error);
        process.exit(1);
    }
}



```

# app/footer.tsx

```tsx
import Link from "next/link";
import styles from '../styles/Header.module.css';

export default function Footer() {
  return (
    <div className={styles.footerContainer}>
      <footer id="footer" className={styles.footer}>
        <div className="container">
          <div className="d-flex justify-content-between align-items-center">
            <p className="text-white text-center flex-grow-1 m-0">©{new Date().getFullYear()} Agricultural Platform. All rights reserved.</p>
            <div>
              <Link href="/pages/AboutUs" className={styles.navLink}>About Us</Link>
              <Link href="/pages/contact" className={styles.navLink}>Contact Us</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

```

# app/globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom base styles */
@layer base {
  body {
    @apply bg-gray-50;
  }
}

/* Custom components */
@layer components {
  .nav-item {
    @apply px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors duration-200;
  }
  
  .nav-link {
    @apply flex items-center space-x-2 text-gray-700 hover:text-gray-900;
  }

  .nav-icon {
    @apply w-5 h-5 text-gray-500;
  }
}

/* Remove any conflicting styles */
.container {
  @apply w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8;
}

/* Clear any bootstrap conflicts */
.nav-list {
  @apply list-none p-0 m-0;
}
```

# app/head.tsx

```tsx

export default function Head() {
  return (
    <>
      <title></title>
      <meta content="width=device-width, initial-scale=1" name="viewport" />

      <meta content="IE=edge" httpEquiv="X-UA-Compatible" />
      <link rel="icon" href="/favicon.ico" />
    </>
  )
}

```

# app/header.tsx

```tsx
"use client"
import Link from 'next/link';
import HeaderLog from './Crud/Header';
import Image from 'next/image';
import styles from '../styles/Header.module.css';
import logo from '../public/Logo.png'
import { LanguageSwitch } from './Componente/LanguageSwitch';







function Header() {

 

  return (
    <div className={styles.container}>
 
      <header id="header" className={styles.header}>
        <div className="container-fluid d-flex align-items-center justify-content-between">
          <div className={` d-flex align-items-center ${styles.link, styles.logo}`}>
            <Link href="/">
              <Image src="/Logo.png" width={95} height={95} alt="Platforma agricola logo" />
              <span className="ms-2 text-white">FutureName</span>
            </Link>
          </div>

          <nav id="navbar" className={styles.navbar}>
            <ul className="d-flex align-items-center justify-content-end mb-0">
              <li className="nav-item nav-list">
                <Link href="/" className={styles.navLink}>Home</Link>
              </li>
              <li className="nav-item nav-list">
                <Link href="/pages/News" className={styles.navLink}>News</Link>
              </li>
           


              <li className={`${styles.navLink} nav-item nav-list`}>
                <HeaderLog />
          
              
              </li>
              <div>
  {/* lang switch */}
  <LanguageSwitch />
</div>


            </ul>
          </nav>
          <i className="bi bi-list mobile-nav-toggle"></i>
        </div>
      </header>
      <hr />
    </div>
  );
}

export default Header;

```

# app/layout.tsx

```tsx
import './globals.css'
import React from 'react'
import Header from './header'
import Footer from './footer'

import 'bootstrap/dist/css/bootstrap.css'
import {GlobalContextProvider} from './providers/UserStore'
import {GlobalContextProvider as CulturaStore} from './providers/culturaStore'
import {GlobalContextProvider as PostStore } from './providers/postStore'
import '../styles/globalsBot.css';
// import Auth0ProviderWithHistory from './Auth0ProviderWrapper';
import { UserProvider } from '@auth0/nextjs-auth0/client';
import {NextIntlClientProvider} from 'next-intl';
import {getLocale, getMessages} from 'next-intl/server';
import ModernLayout from '@/app/componets/ModernLayout';

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {

  const locale = await getLocale();
 
  // Providing all messages to the client
  // side is the easiest way to get started
  const messages = await getMessages();


  return (
    <html lang={locale} >
      <head />
      <body className="bg-light">
        <div className="d-flex flex-column align-items-center" style={{minHeight:'98vh'}}>
        
          <div className=" w-100">

        
           
 <UserProvider>
            <PostStore>
              <CulturaStore>
                <GlobalContextProvider>
              
                  <ModernLayout>
                  <div className="container bg-white shadow-sm p-3 mb-5 rounded" style={{ maxWidth: '1400px' }}>
                  <NextIntlClientProvider messages={messages}>
                    {children}
                    </NextIntlClientProvider>
                  </div>
                  </ModernLayout>
                </GlobalContextProvider>
              </CulturaStore>
            </PostStore>
            </UserProvider>
          
          </div>
          <span className="
                text-2xl
                text-blue-500
                font-semibold
                text-center
                mt-10
          ">
                  Tailwind is working!
                </span>
                <p className="
                text-2xl
                text-blue-500
                font-semibold
                text-center
                mt-10

                
                ">
                  Tailwind is working if this text is blue, to the left and really big.
                </p>
          </div>
      
      <Footer />
      </body>
    </html>
  )
}



```

# app/lib/api-utils.ts

```ts
import { NextResponse } from 'next/server';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaClient } from '@prisma/client';

export class ApiError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

export function handleApiError(error: unknown) {
  console.error('API Error:', error);

  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message },
      { status: error.statusCode }
    );
  }

  if (error instanceof PrismaClientKnownRequestError) {
    // Handle Prisma errors
    switch (error.code) {
      case 'P2002':
        return NextResponse.json(
          { error: 'A unique constraint would be violated.' },
          { status: 409 }
        );
      case 'P2025':
        return NextResponse.json(
          { error: 'Record not found.' },
          { status: 404 }
        );
      default:
        return NextResponse.json(
          { error: 'Database error occurred.' },
          { status: 500 }
        );
    }
  }

  return NextResponse.json(
    { error: 'An unexpected error occurred.' },
    { status: 500 }
  );
}

export function createSuccessResponse(data: any, status = 200) {
  return NextResponse.json({ data }, { status });
}

// Pagination utility
export function getPaginationParams(request: Request) {
  const url = new URL(request.url);
  return {
    page: parseInt(url.searchParams.get('page') || '1'),
    limit: parseInt(url.searchParams.get('limit') || '10'),
    orderBy: url.searchParams.get('orderBy') || 'createdAt',
    order: (url.searchParams.get('order') || 'desc') as 'asc' | 'desc'
  };
}

// Query builder utility
export function buildWhereClause(filters: Record<string, any>) {
  const where: any = {};
  
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      if (typeof value === 'string') {
        where[key] = { contains: value, mode: 'insensitive' };
      } else {
        where[key] = value;
      }
    }
  });

  return where;
}


export async function deleteCropWithRelations(cropId: number) {
  const prisma = new PrismaClient();

  try {
    await prisma.$transaction(async (tx) => {
      // Delete related records first
      await tx.cropDetail.deleteMany({
        where: { cropId }
      });

      await tx.userCropSelection.deleteMany({
        where: { cropId }
      });

      await tx.rotationPlan.deleteMany({
        where: { cropId }
      });

      // Finally delete the crop
      await tx.crop.delete({
        where: { id: cropId }
      });
    });
  } catch (error) {
    throw new Error(`Failed to delete crop: ${error.message}`);
  }
}

export async function deleteUserWithRelations(userId: string) {
  const prisma = new PrismaClient();

  try {
    await prisma.$transaction(async (tx) => {
      // Delete all related records in the correct order
      await tx.userCropSelection.deleteMany({
        where: { userId }
      });

      await tx.post.deleteMany({
        where: { userId }
      });

      // Delete rotations and their plans
      const rotations = await tx.rotation.findMany({
        where: { userId }
      });

      for (const rotation of rotations) {
        await tx.rotationPlan.deleteMany({
          where: { rotationId: rotation.id }
        });
      }

      await tx.rotation.deleteMany({
        where: { userId }
      });

      // Delete crops and their details
      const crops = await tx.crop.findMany({
        where: { userId }
      });

      for (const crop of crops) {
        await tx.cropDetail.deleteMany({
          where: { cropId: crop.id }
        });
      }

      await tx.crop.deleteMany({
        where: { userId }
      });

      // Finally delete the user
      await tx.user.delete({
        where: { id: userId }
      });
    });
  } catch (error) {
    throw new Error(`Failed to delete user: ${error.message}`);
  }
}
```

# app/lib/auth.ts

```ts
import { getSession } from '@auth0/nextjs-auth0';
import { NextRequest, NextResponse } from 'next/server';

export async function getCurrentUser(req: NextRequest) {
  const session = await getSession();
  if (!session?.user) {
    throw new Error('Not authenticated');
  }
  return session.user;
}

export async function checkUserAccess(userId: string, resourceUserId: string) {
  const session = await getSession();
  const user = session?.user;
  
  if (!user) return false;
  if (user.sub !== userId && !user.userRoles?.includes('admin')) {
    return false;
  }
  return true;
}

```

# app/lib/lib.ts

```ts
//connection pooling to prevent connection leaks

import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma = globalForPrisma.prisma ?? 
  new PrismaClient({
    log: ['query', 'error', 'warn'],
    datasources: {
      db: {
        url: process.env.DATABASE_URL
      },
    },
    // Add connection pooling
    connection: {
      pool: {
        min: 2,
        max: 10
      }
    }
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

# app/lib/prisma.ts

```ts
import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = global.prisma || 
  new PrismaClient({
    log: ['query', 'error', 'warn'],
  });

if (process.env.NODE_ENV !== 'production') {
  global.prisma = prisma;
}

export default prisma;
```

# app/not-found.js

```js
//not-found.js
import Link from 'next/link'

 
export default function NotFound() {
  return (
    <div>
      <h2>Not Found</h2>
      <p>Could not find requested resource</p>
      <Link href="/">Return Home</Link>
    </div>
  )
}
```

# app/page.tsx

```tsx
"use client";
import Image from 'next/image'
import Link from 'next/link'
import classNames from 'classnames';
import Card from 'react-bootstrap/Card';
import Container from 'react-bootstrap/Container';
import Noutati from './pages/News/News';
import {useTranslations} from 'next-intl';


export default function Home() {

  const titleClasses = classNames('h1', 'font-weight-bold', 'mb-4','align-items-center', 'justify-content-center');
  const t = useTranslations('HomePage');


  return (
    <Container >

      <h2 className={titleClasses}>
      {t('title')}
        Welcome to the main page of the agricultural platform!
      </h2>
      <div className="d-flex justify-content-center">
        {/* no border */}
        <Card className='noBorders' style={{
          border: 'none'
        }} >
          <Card.Body>
            <Card.Text  className='textFormating'>
               By using this platform, you will be able to easily plan an efficient crop rotation,
              which will help maintain healthy soil and achieve better yields. In addition, you will
              receive personalized recommendations for each crop, based on local conditions, soil history,
              and your preferences.

                To use this platform, you will need to create an account and provide information about your
              agricultural land, including soil type, climatic zone, previous crops, and other relevant details.
              Then, the platform will use APIs to obtain updated information about weather, soil, and other factors
              that may affect production.

                Based on this information, the platform will generate a personalized crop rotation plan, taking into
              account the requirements of each crop, soil type, and other relevant factors. You will also receive
              recommendations for soil preparation, plant nutrition, and pest and disease control.

                Our platform uses the latest technologies and updated data to provide you with the best recommendations
              and to help you achieve the best results on your farm. If you have any questions or issues, feel free
              to contact us through the platform.
            </Card.Text>
 
          </Card.Body>
        </Card>
      </div>
      <Noutati />


      
    </Container>
  );
}

```

# app/pages/AboutUs/page.tsx

```tsx
// import Mail from "../../Componente/Mail";
import Link from "next/link";
import { useTranslations } from 'next-intl';



export default function AboutUs() {
  const t = useTranslations('AboutUs');
  return (
    <div>
      <div id="background" className="jumbotron text-center" style={{ borderBottom: '1px darkgray dotted' }}>
        <h1>{t('title')}</h1>
        <h2>{t('subtitle')}</h2>
      </div>
      <div className="container text-center border-colorat" style={{ marginBottom: '8rem' }}>
        <h2>{t('vision')}</h2>
        <br />
        <div className="row">
          <div className="col-sm-4">
            <h4>{t('cropManagement')}</h4>
            <p>{t('cropManagementDescription')}</p>
          </div>
          <div className="col-sm-4">
            <h4>{t('supportCollaboration')}</h4>
            <p>{t('supportCollaborationDescription')}</p>
          </div>
          <div className="col-sm-4">
            <h4>{t('comprehensiveTracking')}</h4>
            <p>{t('comprehensiveTrackingDescription')}</p>
          </div>
        </div>
        <br /><br />
        <div className="row">
          <div className="col-sm-4">
            <h4>{t('robustAnalytics')}</h4>
            <p>{t('robustAnalyticsDescription')}</p>
          </div>
          <div className="col-sm-4">
            <h4>{t('efficiencyProfitability')}</h4>
            <p>{t('efficiencyProfitabilityDescription')}</p>
          </div>
          <div className="col-sm-4">
            <h4>{t('contactUs')}</h4>
            <li className="nav-item nav-list">
              <Link href="/pages/contact" className="nav-link">
                {t('contactUsForm')}
              </Link>
            </li>
          </div>
        </div>
      </div>
    </div>
  );
}





```

# app/pages/contact/Components/SendEmail.tsx

```tsx
import emailjs from '@emailjs/browser';

export default function sendEmail(form: React.MutableRefObject<HTMLFormElement>) {
  return (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    emailjs
      .sendForm('service_ynv83op', 'template_3oljtxo', form.current, '92Cb78cmp5MUyYktO')
      .then(
        (result) => {
          console.log(result.text);
        },
        (error) => {
          console.log(error.text);
        }
      );
  };
}

```

# app/pages/contact/Components/UserState.tsx

```tsx
import { useEffect, useState } from 'react';
import { useGlobalContext } from '../../../providers/UserStore';

export default function useUserState() {
  const { data } = useGlobalContext();
  const [user, setUser] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (data) {
      setUser(data.name);
      setEmail(data.email);
    }
  }, [data]);

  return { user, setUser, email, setEmail };
}

```

# app/pages/contact/page.tsx

```tsx
import React, { useRef } from 'react';
import { Form, Button, Container, Row, Col } from 'react-bootstrap';
import useUserState from './Components/UserState';
import sendEmail from './Components/SendEmail';
import { useTranslations } from 'next-intl';

export default function Contact(): JSX.Element {
  const { user, setUser, email, setEmail } = useUserState();
  const form = useRef() as React.MutableRefObject<HTMLFormElement>;

  const t = useTranslations('Contact');

  return (
    <Container className="text-center mt-5">
      <Row>
        <Col md={{ span: 8, offset: 2 }}>
          <Form ref={form} onSubmit={sendEmail(form)}>
            <Form.Group controlId="formBasicName">
              <Form.Label><strong>{t('Name')}</strong></Form.Label>
              <Form.Control type="text" name="user_name" value={user} onChange={(e) => setUser(e.target.value)} placeholder={t('Enter your name')} />
            </Form.Group>
            <Form.Group controlId="formBasicEmail">
              <Form.Label><strong>{t('Email')}</strong></Form.Label>
              <Form.Control type="email" name="user_email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t('Enter your email')} />
              <Form.Text className="text-muted">
                {t("We'll never share your email with anyone else.")}
              </Form.Text>
            </Form.Group>
            <Form.Group controlId="formBasicMessage">
              <Form.Label><strong>{t('Message')}</strong></Form.Label>
              <Form.Control as="textarea" rows={4} name="message" placeholder={t('Enter your message')} />
            </Form.Group>
          
              <Button variant="primary" type="submit" className='mt-3'>{t('Send')}</Button>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}




```

# app/pages/DatabasePopulation/page.js

```js
'use client'
import React, { useEffect } from 'react';
import axios from 'axios';

const postData = [
    {
        "title": "Porumbul și Necesitățile sale de Azot",
        "brief": "Aflați mai multe despre necesitățile de azot ale porumbului.",
        "description": "Porumbul necesită un aport de azot de aproximativ 200 de unități. Acesta este un articol detaliat despre cum să gestionați corect necesitățile de azot ale porumbului pentru a obține un randament maxim.",
    },
];

const PostComponent = () => {
    useEffect(() => {
        postData.forEach((post) => {
            axios({
                method: 'GET',
                url: 'https://graph.microsoft.com/v1.0/sites/automatify.sharepoint.com:/sites/Engineering:/Florin_Sandbox/lists/TestsList/items',
                data: post,
                auth: {
                    type: 'ActiveDirectoryOAuth',
                    authority: 'https://login.microsoftonline.com/be9800e0-a8c9-4527-8797-6d6a00eb3029',
                    tenant: 'be9800e0-a8c9-4527-8797-6d6a00eb3029',
                    audience: 'https://automatify.sharepoint.com/sites/Engineering/Florin_Sandbox',
                    clientId: 'df33ad36-01e5-45ca-a990-b60d4aa5e40e',
                    secret: 'sxi8Q~NmEK-DBv1EQcgrtr-XEFjpGT2yn6udbavP'
                }
            })
            .then(response => {
                console.log(response.data);
            })
            .catch(error => {
                console.error(error);
            });
        });
    }, []);

    return (
        <div>
            {/* Your component JSX */}
        </div>
    );
};

export default PostComponent;





```

# app/pages/Login/Dashboard/AdminCropForm.tsx

```tsx
import React, { useState } from 'react';

interface FormData {
  cropName: string;
  nitrogenSupply: number;
  nitrogenDemand: number;
  pests: string[];
  diseases: string[];
}

function AdminCropForm({ onSubmit }: { onSubmit: (data: FormData) => void }) {
  const [cropName, setCropName] = useState('');
  const [nitrogenSupply, setNitrogenSupply] = useState('');
  const [nitrogenDemand, setNitrogenDemand] = useState('');
  const [pests, setPests] = useState('');
  const [diseases, setDiseases] = useState('');
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSubmit({
      cropName,
      nitrogenSupply: Number(nitrogenSupply),
      nitrogenDemand: Number(nitrogenDemand),
      pests: pests.split(',').map((pest) => pest.trim()),
      diseases: diseases.split(',').map((disease) => disease.trim()),
    });
    setCropName('');
    setNitrogenSupply('');
    setNitrogenDemand('');
    setPests('');
    setDiseases('');
  };

  return (
    
    <form onSubmit={handleSubmit} className="p-3">
      <div className='form-group'>
      <h3>Adauga recomandare</h3>
        <label htmlFor='cropName'>Nume cultura:</label>
        <input
          id='cropName'
          type='text'
          value={cropName}
          onChange={(e) => setCropName(e.target.value)}
          className='form-control'
        />
      </div>
      <div className='form-group'>
        <label htmlFor='nitrogenSupply'>Aprovizionare azot:</label>
        <input
          id='nitrogenSupply'
          type='number'
          value={nitrogenSupply}
          onChange={(e) => setNitrogenSupply(e.target.value)}
          className='form-control'
        />
      </div>
      <div className='form-group'>
        <label htmlFor='nitrogenDemand'>Nevoie azot:</label>
        <input
          id='nitrogenDemand'
          type='number'
          value={nitrogenDemand}
          onChange={(e) => setNitrogenDemand(e.target.value)}
          className='form-control'
        />
      </div>
      <div className='form-group'>
        <label htmlFor='pests'>Daunatori (separat prin virgula):</label>
        <input
          id='pests'
          type='text'
          value={pests}
          onChange={(e) => setPests(e.target.value)}
          className='form-control'
        />
      </div>
      <div className='form-group'>
        <label htmlFor='diseases'>Boli (separat prin virgula):</label>
        <input
          id='diseases'
          type='text'
          value={diseases}
          onChange={(e) => setDiseases(e.target.value)}
          className='form-control'
        />
      </div>
      <button type='submit' className='btn btn-primary mt-2'>Trimite</button>
    </form>
  );
}

export default AdminCropForm;
```

# app/pages/Login/Dashboard/page.tsx

```tsx
"use client"
import React, { useEffect } from 'react';
import { Card, Container } from 'react-bootstrap';
import { FaUser } from 'react-icons/fa';
import Link from 'next/link';
import CropForm from '../../../Crud/CropForm';
import RotatieItem from '../../../Crud/RotatieItem';
import Spinner from '../../../Crud/Spinner';
import UserListItem from './UserListItem';
import LinkAdaugaPostare from '../Elements/LinkAdaugaPostare';
import { useGlobalContext } from '../../../providers/UserStore';
import { useGlobalContextCrop } from '../../../providers/culturaStore';
import { UserInfos } from './userInfos';
import AdminCropForm from './AdminCropForm';
import { useSignals  } from "@preact/signals-react/runtime";
import { useUser } from '@auth0/nextjs-auth0/client';

export default function Dashboard() {
  const {
    crops,
    isLoading,
    getCrops,
    addTheCropRecommendation,
  } = useGlobalContextCrop();
  const {
    fetchFermierUsers,
    deleteUser,
    data,
    fermierUsers,
  } = useGlobalContext();
  const {  isLoading: isUserLoading } = useUser();

  useSignals();

  let apiCalls = ( ) => {
    getCrops();
    if (data?.role?.toLowerCase() === 'admin') {
      fetchFermierUsers();
    } 
  }

  useEffect(() => {
    if (!isUserLoading) {
      apiCalls();
    }
  }, [isUserLoading]);


  if (isLoading?.value) {
    return <Spinner />;
  }

  const handleAddCropRecommendation = async (cropData) => {
    await addTheCropRecommendation(cropData);
  };

  if (isUserLoading) return <div>Loading user...</div>;
  return (
    
    <>
   
      <UserInfos />
      {data && data?.role?.toLowerCase() === 'admin' ? (
        <Container>
          <Card>
            <section className="heading">
              <LinkAdaugaPostare />
              <br />
              <br />
              <Link href="/pages/Login/Register">
                <FaUser /> Add users
              </Link>
              <br />
              <br />
              <Container>
                <AdminCropForm onSubmit={handleAddCropRecommendation} />
              </Container>
              <p>Gestioneaza utilizatorii</p>
              <h2>Fermieri:</h2>
              <ul>
                {fermierUsers &&
                  fermierUsers.map((user) => (
                    <UserListItem
                      key={user._id}
                      user={user}
                      deleteUser={deleteUser}
                    />
                  ))}
              </ul>
            </section>
          </Card>
        </Container>
      ) : data && data?.role?.toLowerCase() === 'farmer' ? (
        <Container>
          <Card>
            <section className="heading">
              <p>Add crops:</p>
            </section>
            <CropForm />
            <section className="content">
              {crops?.value?.length > 0 ? (
                <div className="crops">
                  <RotatieItem crops={crops} userID={data._id} />
                </div>
              ) : (
                <h3>No crops were added</h3>
              )}
            </section>
          </Card>
        </Container>
      ) : (
        <h1>access denied</h1>
      )}
    </>
  );
}


```

# app/pages/Login/Dashboard/UpdateRoleForm.tsx

```tsx
import { useState } from 'react';
import { useGlobalContext } from '../../../providers/UserStore';
import { Form, Button } from 'react-bootstrap';

function UpdateRoleForm({ userMail }) {
  const [newRole, setNewRole] = useState('');  // Initialize newRole state
  const { updateRole } = useGlobalContext();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateRole(userMail, newRole);  // Call updateRole with newRole
      alert('Role updated successfully');  // Update success message
    } catch (error) {
      console.error('Error updating role:', error);  // Update error message
    }
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Form.Group>
        <Form.Label>Select Role</Form.Label>
        <Form.Control
          as="select"
          value={newRole}  // Update selected value
          onChange={(e) => setNewRole(e.target.value)}  // Update onChange handler
          required
        >
          <option value="">Choose...</option>
          <option value="farmer">Farmer</option>
          <option value="admin">Admin</option>
        </Form.Control>
      </Form.Group>
      <Button type="submit">Update Role</Button>
    </Form>
  );
}

export default UpdateRoleForm;

```

# app/pages/Login/Dashboard/userInfos.tsx

```tsx
import React from 'react';
import { Card, Container } from 'react-bootstrap';
import { useGlobalContext } from '../../../providers/UserStore';
import LinkParola from '../Elements/page';

export const UserInfos = () => {
  const { data: { name, email, role } , isUserLoggedIn  } = useGlobalContext();

  const cardStyle = {
    backgroundColor: '#f2f2f2',
    padding: '20px',
    marginBottom: '20px',
  };

  const greetingStyle = {
    color: '#333',
    fontSize: '24px',
    marginBottom: '10px',
  };

  const infoStyle = {
    color: '#555',
    fontSize: '18px',
    marginBottom: '5px',
  };

  return (
    isUserLoggedIn ?
    <Container>
      <Card style={cardStyle}>
        <section className="heading">
          <h1 style={greetingStyle}>YO {name ? name : ''}</h1>
          {/* <LinkParola /> */}
          <h3 style={infoStyle}>Email: {email}</h3>
          <h3 style={infoStyle}>Nume utilizator: {name ? name : ''}</h3>
          <h3 style={infoStyle}>Permisiuni: {role}</h3>
        </section>
      </Card>
    </Container>
    : null
  );
};

```

# app/pages/Login/Dashboard/UserListItem.tsx

```tsx
import { useState } from 'react';
import UpdateRole from './UpdateRoleForm';

const UserListItem = ({ user, deleteUser } : { user: any, deleteUser: any }) => {
  const [showUpdateRole, setUpdateRole] = useState(false);

  return (
    <li key={user._id}>
      {user.name} - {user.email}{' '}
      <button onClick={() => deleteUser(user._id)}>Delete</button>
      <button onClick={() => setUpdateRole(!showUpdateRole)}>
        Update Role
      </button>
      {/* Show the UpdatePasswordForm component based on the state */}
      {showUpdateRole && <UpdateRole userMail={user.email} />}
    </li>
  );
};

export default UserListItem;
```

# app/pages/Login/DeprecatedLogin/page.tsx

```tsx
"use client";
import { useEffect, useState } from 'react';
import { FaSignInAlt, FaUser } from 'react-icons/fa';
import { useRouter } from 'next/navigation';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useGlobalContext } from '../../../providers/UserStore';
import Spinner from '../../../Crud/Spinner';
import Link from 'next/link';

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const { email, password } = formData;



  const { data, setData, error, loading, login } = useGlobalContext();

  const navigate = useRouter();

  useEffect(() => {
    if (data.token) {
      navigate.push('/');
    }
  }, [data]);

  useEffect(() => {

    if (error) {
      toast.error(error);
      alert(error)
      setData({
        _id: '', email: '', password: '', rol: '', token: '',
        name: ''
      });
    }
  }, [error]);

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }
    login(email, password);
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="login-container" style={{ margin: '0 auto', maxWidth: '400px', marginTop: '100px', marginBottom: '100px' }}>
      <section className="heading">
        <h1>
          <FaSignInAlt /> Login
        </h1>
        <p>Sign in and start managing your crops</p>
      </section>

      <section className="form">
        <form onSubmit={onSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              className="form-control"
              id="email"
              name="email"
              value={formData.email}
              placeholder="Enter your email"
              onChange={onChange}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              className="form-control"
              id="password"
              name="password"
              value={formData.password}
              placeholder="Enter your password"
              onChange={onChange}
            />
          </div>

          <div className="form-group">
            <button type="submit" className="btn btn-block">
              Submit
            </button>
          </div>
        </form>
        <p>Don't have an account? <Link href="/pages/Login/Register" className="text-decoration-none text-dark">Register <FaUser /></Link></p>
      </section>
    </div>
  );
}

export default Login;



```

# app/pages/Login/Elements/LinkAdaugaPostare.tsx

```tsx
import {FaUser} from 'react-icons/fa'
import Link from 'next/link'
import { useTranslations } from 'next-intl';

function LinkAdaugaPostare(){
  const t = useTranslations('LinkAdaugaPostare');
  return (
  <>
              <Link href='/pages/Login/Posts'>
                <FaUser /> {t('AdaugaPostare')}
              </Link>
              
                </>

  ) }

export default LinkAdaugaPostare


```

# app/pages/Login/Elements/page.tsx

```tsx
import {FaUser} from 'react-icons/fa'
import Link from 'next/link'
import { useTranslations } from 'next-intl';


function LinkParola(){
  const t = useTranslations('LinkParola');

  return (
  
              <Link href='/pages/Login/Modifica'>
                <FaUser /> {t('ModificaParola')}
              </Link>
  ) }


export default LinkParola


```

# app/pages/Login/Modify/page.tsx

```tsx
// @ts-nocheck
"use client"
import {useEffect, useState} from 'react'
import {useGlobalContext} from '../../../providers/UserStore'
import {useRouter} from 'next/navigation';
import {toast} from 'react-toastify'
import {FaUser} from 'react-icons/fa'
import Spinner from '../../../Crud/Spinner'

import "bootstrap/dist/css/bootstrap.min.css";
import { useTranslations } from 'next-intl';

function Modifica() {
  const t = useTranslations('Modifica');
  const navigate = useRouter()

  if (localStorage.getItem('user') === null) {
    navigate.push('/pages/Login/Login')
  }
  const [formData, setFormData] = useState({
    password: '',
    password2: '',
  })

  const { password, password2 } = formData

  

  const { isLoading, isError, message, modify, data, logout } = useGlobalContext()

  useEffect(() => {


    if (isError) {
      toast.error(message)
    }
   
  }, [ isError])

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }))
  }

  
  const onSubmit = (e) => {
    e.preventDefault()
    if (password !== password2) {
      toast.error( t('Passwords do not match'))
    } else {
      const userData = {
        password,
      }
      modify(data._id,userData.password)
      logout()
      navigate.push('/pages/Login/Login')
    }
  }

  if (isLoading) {
    return <Spinner />
  }

  return (
    <>
      <section className='heading'>
        <h1>
          <FaUser /> {t('Modificare parola')}
        </h1>
      </section>

      <section className='form'>
        <form onSubmit={onSubmit}>

      
          <div className='form-group'>
            <input
              type='password'
              className='form-control'
              id='password'
              name='password'
              value={password}
              placeholder={t('Enter password')}
              onChange={onChange}
            />
          </div>
          <div className='form-group'>
            <input
              type='password'
              className='form-control'
              id='password2'
              name='password2'
              value={password2}
              placeholder={t('Confirm password')}
              onChange={onChange}
            />
          </div>
          <div className='form-group'>
            <button type='submit' className='btn btn-block'>
              {t('Submit')}
            </button>
          </div>
        </form>
      </section>
    </>
  )
}

export default Modifica




```

# app/pages/Login/Posts/page.tsx

```tsx
"use client"
import React from 'react';
import { useRouter } from 'next/navigation';
import { useGlobalContextPost } from '../../../providers/postStore';
import { useGlobalContext} from '../../../providers/UserStore';
import { useEffect } from 'react';
import Spinner from '../../../Crud/Spinner';
import { UserInfos } from '../Dashboard/userInfos';
import { Container, Card, Button } from 'react-bootstrap';
import PostForm from '../../../Crud/PostForm';
import Continut from '../../../Crud/GetAllPosts/page';
import { useTranslations } from 'next-intl';
function Postari() {
    const { data, loading, getAllPosts, deletePost , clearData } = useGlobalContextPost();

    const t = useTranslations('Postari');


useEffect(() => {
    const fetchData = async () => {
      clearData();


      await getAllPosts();
    };

    fetchData();
  }, []);


    return (
        <div>
            <Container>
                <Card>
                    <Card.Header>
                        <UserInfos />
                    </Card.Header>
                    <Card.Body>
                        <PostForm />
                    </Card.Body>
                </Card>
            </Container>
            <Container>
            </Container>

            <div>
                <h1>
                    {t('Postari')}
                </h1>
                <ul>
                    {Array.isArray(data) && data.map((post) => (
                    
                        <li key={post._id}>
                            <h2>{post.title}</h2>
                            <p>{post.brief}</p>
                            <Button variant="danger" onClick={() => deletePost(post._id)}>
                                {t('Sterge')}
                            </Button>
                            
                        </li>
                    ))}
                </ul>
            </div>

        </div>

    );
}

export default Postari;



```

# app/pages/Login/Register/page.tsx

```tsx
//ts-nocheck


"use client"
import {useEffect, useState} from 'react'
import {useRouter} from 'next/navigation';
import {toast} from 'react-toastify'
import {FaUser} from 'react-icons/fa'
import Spinner from '../../../Crud/Spinner'
import {Form} from 'react-bootstrap';
import "bootstrap/dist/css/bootstrap.min.css";
import {useGlobalContext} from '../../../providers/UserStore';

function Register() {
  const [formData, setFormData] = useState({
    role: '',
    name: '',
    email: '',
  });

  const { role, name, email } = formData;

  const { data, setData, error, loading, register } = useGlobalContext();

  const navigate = useRouter();

  const onChange = (e) => {
    setFormData((prevState) => ({
      ...prevState,
      [e.target.name]: e.target.value,
    }));
  };

  useEffect(() => {
    if (error) {
      toast.error(error);
      alert(error);
    }


    if ( data.role.toLowerCase() !== 'admin') {
      navigate.push('/');
      console.log('User is not admin' + data.role);
    }
  }, [error, data]);

  const onSubmit = (e) => {
    e.preventDefault();

      register(role, name, email);
    
  };

  if (loading) {
    return <Spinner />;
  }

  return (
    <>
       <div className="login-container" style={{ margin: '0 auto', maxWidth: '400px' , marginTop:'100px' , marginBottom:'100px' }}>
      <section className='heading'>
        <h1>
          <FaUser /> Register a user
        </h1>
      </section>

   
      <section className='form'>
        <Form onSubmit={onSubmit}>
          {data.role.toLowerCase() === 'admin' && (
            <div className='form-group'>
              <label>
                <select
                  aria-label='Role'
                  value={formData.role}
                  onChange={onChange}
                  name='role'
                  id='role'
                  className='form-control'
                >
                  <option>Select role</option>
                  <option value='farmer'>Farmer</option>
                  <option value='admin'>Administrator</option>
                </select>
              </label>
            </div>
          )}

          <div className='form-group'>
            <input
              type='text'
              className='form-control'
              id='name'
              name='name'
              value={formData.name}
              placeholder='Enter your name'
              onChange={onChange}
            />
          </div>
          <div className='form-group'>
            <input
              type='email'
              className='form-control'
              id='email'
              name='email'
              value={formData.email}
              placeholder='Enter your email'
              onChange={onChange}
            />
          </div>
      <div className='form-group'>
        <button type='submit' className='btn btn-block' >
          Submit
        </button>
      </div>
    </Form>

  </section>
</div>
</>
);
}

export default Register;
```

# app/pages/Login/RotatieDashboard/Components/helperFunctions.js

```js
export const getCropsRepeatedBySelection = (crops, selections) => {
    let uniqueId = 0; // Initialize a unique ID counter
    return selections
      .map(selection => ({
        count: selection.selectionCount,
        cropId: selection.crop
      }))
      .flatMap(({ count, cropId }) => {
        const crop = crops.find(crop => crop._id === cropId);
        // Create an array with unique objects containing the crop and a unique ID
        return Array.from({ length: count }, () => ({ ...crop, uniqueId: uniqueId++ }));
      });
  };
  
  export const prepareChartData = (rotationPlan, numberOfDivisions) => {
    let chartData = [];
    let previousYearData = {};
    rotationPlan.forEach(yearPlan => {
      let yearData = { year: yearPlan.year };
      yearPlan.rotationItems.forEach(item => {
        yearData[`Parcela${item.division}`] = item.nitrogenBalance;
      });
  
      // Add missing divisions from the previous year
      for (let division = 1; division <= numberOfDivisions; division++) {
        const key = `Parcela ${division}`;
        if (!(key in yearData) && (key in previousYearData)) {
          yearData[key] = previousYearData[key];
        }
      }
      chartData.push(yearData);
      previousYearData = yearData;
    });
    return chartData;
  };
  
```

# app/pages/Login/RotatieDashboard/page.tsx

```tsx
"use client"
import { useState , useEffect } from 'react';
import { Container, Card, Row, Col, Table,  Button  } from 'react-bootstrap';
import { useGlobalContext } from '../../../providers/UserStore';
import { useGlobalContextCrop } from '../../../providers/culturaStore';
import Continut from '../../../Crud/GetAllInRotatie/page';
import CropRotationForm from './RotatieForm';
import { ResponsiveContainer, LineChart, CartesianGrid, XAxis, YAxis, Tooltip, Legend, Line, Label } from 'recharts';
import {  Typography } from 'antd';
const { Title } = Typography;
const colors = ['8884d8', '82ca9d', 'ffc658', 'a4de6c', 'd0ed57', 'ffc658', '00c49f', 'ff7300', 'ff8042'];
import { useSignals  } from "@preact/signals-react/runtime";
import { useUser } from '@auth0/nextjs-auth0/client';
import { getCropsRepeatedBySelection, prepareChartData } from './Components/helperFunctions';
import { useTranslations } from 'next-intl';

function RotatieDashboard() {
  const t = useTranslations('RotatieDashboard');
  const { crops,
    selections,
    isLoading,
     getCropRotation,
     cropRotation,
      updateNitrogenBalanceAndRegenerateRotation,
       getAllCrops,
        updateDivisionSizeAndRedistribute,
        deleteCropRotation
       } = useGlobalContextCrop();

   const { data: userData } = useGlobalContext();
  const [divisionSizeValues, setDivisionSizeValues] = useState([]);
const [nitrogenBalanceValues, setNitrogenBalanceValues] = useState([]);
const [cropRotationChange, setCropRotationChange] = useState(false);
const { user, error, isLoading: isUserLoading } = useUser();
const [visible, setVisible] = useState(6);

///data  is changed but functions might not be rerernderedb n
useSignals();
  const fetchData =  () => {

     getAllCrops()
    getCropRotation()

  };
const [rotationPage, setRotationPage] = useState(0);
const rotationsPerPage = 1;

useEffect(() => {
  if (!isUserLoading) {
    fetchData();
  }
}, [isUserLoading]);

  if (isLoading.value) {
    return <div>
      {t('Loading')}
      { isLoading.value  }</div>;
  }
 
    if (cropRotationChange) {
      console.log('cropRotationChange did change')
      getCropRotation();
      setCropRotationChange(false);
    }

  const filteredCrops = getCropsRepeatedBySelection(crops.value, selections.value);
  const showMore = () => {
    setVisible(prevVisible => prevVisible + 6);
};

  if (userData?.role?.toLowerCase() === 'farmer') {
    return (
      <>
        <Container style={{ marginTop: '2rem', marginBottom: '2rem' }}>
          <Card style={{ padding: '2rem' }}>
            <section className="heading" style={{ marginBottom: '1rem' }}>
              <h1>Salut {userData && userData.name}</h1>
            </section>
            <section className="content">
              {crops?.value?.length > 0 ? (
                <div className="crops">
                  <CropRotationForm filteredCrops={filteredCrops}  />
                  
                  <h3>
                    {
                      t('Culturi selectate')
                    }
                  </h3>

                  {filteredCrops.length === 0 ? (
                    <p>
                      {
                        t('Nicio cultura selectata')
                      }
                    </p>
                  ) : (
                    <>
                    <Row>
                        {filteredCrops.slice(0, visible).map((crop, index) => (
                            <Col key={index} xs={12} sm={6} md={4}>
                                <Continut crop={crop} />
                            </Col>
                        ))}
                    </Row>
                    {filteredCrops.length > visible && (
                        <div className="text-center">
                            <Button onClick={showMore}>
                                {
                                  t('Vezi mai mult')
                                }
                            </Button>
                        </div>
                    )}
                </>
                  )}
                </div>
              ) : (
                <h3>
                  {
                    t('Nu exista culturi')
                  }
                </h3>
              )}

{cropRotation.value && cropRotation.value.data && (
  <div className="rotation" style={{ marginTop: '2rem', marginBottom: '2rem' }}>
    <h3>
      {
        t('Rotatii')
      }
    </h3>
    {cropRotation.value && Array.isArray(cropRotation.value.data) && (
      cropRotation.value.data
        .slice(rotationPage * rotationsPerPage, (rotationPage + 1) * rotationsPerPage)
        .map((rotation, index) => {

                    
                    const chartData = prepareChartData(rotation.rotationPlan, rotation.numberOfDivisions);
                    return (
                      <Row key={index}>
                        <Col xs={12} md={6}>
                          <h2>{rotation.rotationName}</h2>
                          
                          <p> {t('Dimensiune camp')}  {rotation.fieldSize}</p>
                     
                          <p> {t('Numar de diviziuni')}  {rotation.numberOfDivisions}</p>
                        
                          
                          {rotation.rotationPlan.map((plan, planIndex) => (
                            <div key={planIndex}>
                              <h3> { t('anul')}  {plan.year}</h3>
                              <Table striped bordered hover>
                                <thead>
                                  <tr>
                                    <th>
                                      {t('Diviziune')}
                                    </th>
                                    <th>
                                      {t('Nume cultura')}
                                    </th>
                                    <th>
                                      {t('Data plantarii')}
                                    </th>
                                    <th>
                                      {t('Data recoltarii')}
                                    </th>
                                    <th>
                                      {t('Dimensiune diviziune')}
                                    </th>
                                    <th>
                                      {t('Bilant azot')}
                                    </th>
                                    <th>
                                      {t('Azot suplimentar')}
                                    </th>
                                    <th>
                                      {
                                        planIndex === 0 && (
                                          <button
                                            onClick={() => {
                                              deleteCropRotation(rotation._id);
                                            }
                                          }
                                          >
                                            {t('Sterge rotatie')}
                                          </button>
                                        )
                                      }
                                    </th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {plan.rotationItems.map((item, itemIndex) => (
                                    <tr key={itemIndex}>
                                      
                                      <td><b>{item.division}</b></td>
                                      <td>{item.cropName}</td>
                                      <td>{item.plantingDate.toString().slice(0, 10)}</td>
                                      <td>{item.harvestingDate.toString().slice(0, 10)}</td>
                                      <td>{item.divisionSize}
                                      {planIndex === 0 && ( // Show input only in the first year
                                        <input type="text" 
                                        placeholder="
                                        {t('Dimensiune diviziune')}" 
                                        value={divisionSizeValues[itemIndex] || ''} 
                                        onChange={e => {
                                          let newDivisionSizeValues = [...divisionSizeValues];
                                          newDivisionSizeValues[itemIndex] = e.target.value;
                                          setDivisionSizeValues(newDivisionSizeValues);
                                        }}
                                        onBlur={e => {
                                          if (isNaN(parseFloat(e.target.value)) && parseFloat(e.target.value) > 0) {
                                            alert("Not a number");
                                          }        else if (parseFloat(e.target.value) > 1) {
                                            let newDivisionSizeValues = [...divisionSizeValues];
                                            newDivisionSizeValues[itemIndex] = parseFloat(e.target.value);
                                            setDivisionSizeValues(newDivisionSizeValues);
                                            let data :any = {
                                              id: rotation._id,
                                              rotationName: rotation.rotationName,
                                              division: item.division,
                                              newDivisionSize: parseFloat(e.target.value),
                                            };
                                            updateDivisionSizeAndRedistribute(data);
                                            
                                          }
                                          if(parseFloat(e.target.value) > 0 ) {
                                            setCropRotationChange(true)
                                            }
                                        }}
                                      />
                                      )}
                                      </td>
                                      <td>{item.nitrogenBalance} 
                                      <input type="text" 
                                        placeholder="Supplemental nitrogen" 
                                        value={nitrogenBalanceValues[itemIndex] || ''} 
                                        onChange={e => {
                                          let newNitrogenBalanceValues = [...nitrogenBalanceValues];
                                          newNitrogenBalanceValues[itemIndex] = e.target.value;
                                          setNitrogenBalanceValues(newNitrogenBalanceValues);
                                        }} 
                                        onBlur={e => {
                                          if (isNaN(parseFloat(e.target.value)) && parseFloat(e.target.value) > 0) {
                                            alert(t('Not a number'));
                                          } else if (parseFloat(e.target.value) > 1) {
                                            let newNitrogenBalanceValues = [...nitrogenBalanceValues];
                                            newNitrogenBalanceValues[itemIndex] = parseFloat(e.target.value);
                                            setNitrogenBalanceValues(newNitrogenBalanceValues);
                                            let data :any = {
                                              id: rotation._id,
                                              rotationName: rotation.rotationName,
                                              year: plan.year,
                                              division: item.division,
                                              nitrogenBalance: parseFloat(e.target.value),
                                            };
                                            updateNitrogenBalanceAndRegenerateRotation(data);
                                            
                                          }
                                          if(parseFloat(e.target.value) > 0 ) {
                                          setCropRotationChange(true)
                                          }
                                        }}
                                      />
                                      </td>
                                      <td>{(item.nitrogenBalance * (item.divisionSize / 10000)).toFixed(2)} </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </Table>
                            </div>
                          ))}
                        </Col>
                        <Col xs={24} md={12}>
                          <Title level={3}>
                            {t('anual evolution')}
                          </Title>
                          <ResponsiveContainer width="100%" height={500}>
                            <LineChart
                              width={500}
                              height={300}
                              data={chartData}
                              margin={{
                                top: 5, right: 30, left: 20, bottom: 5,
                              }}
                            >
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="year" padding={{ left: 30, right: 30 }}>
                                <Label value="Year" offset={-5} position="insideBottom" />
                              </XAxis>
                              <YAxis label={{ value: 'Nitrogen balance', angle: -90, position: 'insideLeft' }} />
                              <Tooltip />
                              <Legend />

                              {chartData[0] && Object.keys(chartData[0]).map((key, i) => {
                                if (key !== 'year') {
                                  return (
                                    <Line type="monotone" dataKey={key} stroke={`#${colors[i % colors.length]}`} activeDot={{ r: 8 }} />
                                  );
                                }
                              })}
                            </LineChart>
                          </ResponsiveContainer>
                        </Col>
                      </Row>
                    );
                  }
                ))}
                </div>
              )}
            </section>
          </Card>

          {rotationPage > 0 && (
          <Button onClick={() => setRotationPage(prevPage => prevPage - 1)}>Previous</Button>
        )}
        {(rotationPage + 1) * rotationsPerPage < cropRotation.value?.data?.length && (
          <Button onClick={() => setRotationPage(prevPage => prevPage + 1)}>Next</Button>
        )}

        
        </Container>
      </>
    );
  } else {
    return null;
  }
}
export default RotatieDashboard;
                                              

```

# app/pages/Login/RotatieDashboard/RotatieDashboard.module.scss

```scss
.rotationItem {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin-bottom: 20px;
  }
  
  .chart {
    display: flex;
    justify-content: center;
    align-items: center;
  }
  
  .fieldInfo {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }
  
```

# app/pages/Login/RotatieDashboard/RotatieForm.tsx

```tsx
import React, { useState } from 'react';
import { useGlobalContextCrop } from '../../../providers/culturaStore';
import { useTranslations } from 'next-intl';

const CropRotationForm = ({ filteredCrops }) => {

  const t = useTranslations('CropRotationForm');
  const [fieldSize, setFieldSize] = useState('');
  const [numberOfDivisions, setNumberOfDivisions] = useState('');
  const [rotationName, setRotationName] = useState('');
  const [maxYears, setMaxYears] = useState('');
  const [ResidualNitrogenSupply, setResidualNitrogenSupply] = useState(''); 

  const { generateCropRotation } = useGlobalContextCrop();

  const handleSubmit = (e) => {
    e.preventDefault();
    if (
      parseInt(fieldSize) > 0 &&
      parseInt(numberOfDivisions) > 0 &&
      rotationName &&
      parseInt(maxYears) > 0
    ) {
      generateCropRotation(
        parseInt(fieldSize),
        parseInt(numberOfDivisions),
        rotationName,
        filteredCrops,
        parseInt(maxYears),
        parseInt(ResidualNitrogenSupply)
      );
      setFieldSize('');
      setNumberOfDivisions('');
      setRotationName('');
      setMaxYears('');
      setResidualNitrogenSupply('');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="fieldSize">
          { t('fieldSize') }*:
        </label>
        <input
          type="number"
          className="form-control"
          id="fieldSize"
          value={fieldSize}
          onChange={(e) => setFieldSize(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="numberOfDivisions">
          { t('numberOfDivisions') }*:
        </label>
        <input
          type="number"
          className="form-control"
          id="numberOfDivisions"
          value={numberOfDivisions}
          onChange={(e) => setNumberOfDivisions(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="rotationName">
          { t('rotationName') }*:
        </label>
        <input
          type="text"
          className="form-control"
          id="rotationName"
          value={rotationName}
          onChange={(e) => setRotationName(e.target.value)}
        />
      </div>
      <div className="form-group">
        <label htmlFor="maxYears">
          { t('maxYears') }*:
        </label>
        <input
          type="number"
          className="form-control"
          id="maxYears"
          value={maxYears}
          onChange={(e) => setMaxYears(e.target.value)}
        />
      </div>
      <div className="form-group">
      <label htmlFor="maxYears">
        { t('ResidualNitrogenSupply') }*:
      </label>
      <input
          type="number"
          className="form-control"
          id="ResidualNitrogenSupply"
          value={ResidualNitrogenSupply}
          onChange={(e) => setResidualNitrogenSupply(e.target.value)}
        />
      </div>
      <button type="submit" className="btn btn-primary">
        { t('generateCropRotation') } 
      </button>
    </form>
  );
};

export default CropRotationForm;


```

# app/pages/News/Components/debounce.js

```js
export default function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  }
```

# app/pages/News/Components/scrollHandler.js

```js
import debounce from './debounce';

export const handleScroll = (loadMorePosts) => {
  if (window.innerHeight + document.documentElement.scrollTop !== document.documentElement.offsetHeight || loadingMore || !hasMore) return;
  loadMorePosts();
};

export const loadMorePosts = async (setLoadingMore, error, getAllPosts, page, setPage, setHasMore) => {
  setLoadingMore(true);

  if (error === "No more posts") {
    console.log("erarea" + error)
    setHasMore(false);
  } else {
    await getAllPosts(page);
    setPage(page + 1);
  }
  setLoadingMore(false);
};

```

# app/pages/News/News.tsx

```tsx
import React, { useEffect } from 'react';
import Spinner from '../../Crud/Spinner';
import { useGlobalContextPost } from '../../providers/postStore';
import Continut from '../../Crud/GetAllPosts/page';
import Card from 'react-bootstrap/Card';
import { useTranslations } from 'next-intl';

export default function Noutati() {
  const { data, loading, getAllPosts, clearData } = useGlobalContextPost();
  const t = useTranslations('News');

  useEffect(() => {
    const fetchData = async () => {
      clearData();
      await getAllPosts(0);
    };

    fetchData();
  }, []);

  if (loading) {
    return <Spinner />;
  }

  // const data = allData.posts;
  console.log(data, 'data');

  // Check if data is available before rendering
  if (!data) {
    return null;
  }

  // Sort the data to get the two most recent posts
  let latestPosts = [];
  if (data && Array.isArray(data)) {
    latestPosts = [...data].sort((a, b) => b.date - a.date).slice(0, 2);
  } 

  return (
    <div className="container">
      <br />
      <br />
      <p>{t('Latest in our newsfeed:')}</p>

      <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap' }}>
        {latestPosts.map((post) => {
          return (
            <Card key={post._id} style={{ marginBottom: '20px' }}>
              <Card.Body>
                <Continut data={post} />
                <p>{new Date(post.date).toLocaleDateString()}</p>
              </Card.Body>
            </Card>
          );
        })}
      </div>
    </div>
  );
}




```

# app/pages/News/page.tsx

```tsx
"use client"
import { useEffect, useState } from 'react';
import Spinner from '../../Crud/Spinner';
import { useGlobalContextPost } from '../../providers/postStore';
import Continut from '../../Crud/GetAllPosts/page';
import { handleScroll, loadMorePosts } from './Components/scrollHandler';
import debounce from './Components/debounce';
import { useTranslations } from 'next-intl';


export default function Noutati() {
  const { data, loading, getAllPosts , error , clearData} = useGlobalContextPost();
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const t = useTranslations('News');

  useEffect(() => {
    const fetchData = async () => {
      clearData();
      await loadMorePosts(setLoadingMore, error, getAllPosts, page, setPage, setHasMore);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const debouncedHandleScroll = debounce(handleScroll, 100);
    window.addEventListener('scroll', debouncedHandleScroll);
    return () => {
      window.removeEventListener('scroll', debouncedHandleScroll);
    };
  }, [page, loadingMore, hasMore]);

  if (loading) {
    return <Spinner />;
  }

  return (
    <div className="container">
      <h1 className="mt-5 mb-4">Our latest news:</h1>
      {data.length > 0 ? (
        <div>
          {data.map((data) => {
            return (
              <div key={data._id} className="mb-5 border-bottom pb-4">
                <Continut data={data} />
              </div>
            );
          })}
          {loadingMore && <Spinner />}
        </div>
      ) : (
        <h3 className="mb-5">Nothing to see at the moment</h3>
      )}
    </div>
  );
}




```

# app/pages/Recomandari/page.tsx

```tsx
"use client"
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useGlobalContextCrop } from "../../providers/culturaStore";
import { useGlobalContext } from "../../providers/UserStore";
import useRecommendations from "./recomandari";
import { Alert, Container, Card, Table } from "react-bootstrap";
import React from "react";


function RotationItem({ item }) {
  const recommendations = useRecommendations(item.nitrogenBalance, item.crop);

  return (
    <tr>
      <th>{item.division}</th>
      <td>{item.cropName}</td>
      <td>{item.plantingDate.toString().slice(0, 10)}</td>
      <td>{item.harvestingDate.toString().slice(0, 10)}</td>
      <td>{item.divisionSize}</td>
      <td>{item.nitrogenBalance}</td>
      <td>
        <ul>
          {recommendations.map((recommendation, index) => (
            <li key={index}>{recommendation}</li>
          ))}
        </ul>
      </td>
    </tr>
  );
}

function RecommendationDashboard() {
  const [isError, setIsError] = useState(false);
  const [message, setMessage] = useState("");
  const { data } = useGlobalContext();
  const token = data?.token; 
  const { getCropRotation, cropRotation } = useGlobalContextCrop();
  const navigate = useRouter();

  useEffect(() => {
    if (isError) {
      console.error(message);
    }
    if (!data) {
      navigate.replace('/login');
    } else {
      getCropRotation(token);
    }
  }, [token, isError, message, data, navigate]);

  if (isError) {
    return <Alert variant="danger">{message}</Alert>;
  }

  if (data?.rol === "Fermier") {
    return (
      <Container className="mt-4 mb-4">
        <Card className="p-4">
          <section className="heading mb-3">
            <h1>Hello {data && data.name}</h1>
          </section>
          <section className="content">
            {Array.isArray(cropRotation) && (
              <div className="rotation mt-4 mb-4">
                <h3>Recommendations based on crop rotation:</h3>
                {cropRotation.map((rotation, index) => (
                  <div key={index}>
                    <h2>{rotation.rotationName}</h2>
                    <Table striped bordered hover>
                      <thead>
                        <tr>
                          <th>Division</th>
                          <th>Crop</th>
                          <th>Planting Date</th>
                          <th>Harvesting Date</th>
                          <th>Division Size</th>
                          <th>Nitrogen Balance</th>
                          <th>Recommendations</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rotation.rotationPlan.map((plan, planIndex) => (
                          <React.Fragment key={planIndex}>
                            <tr>
                              <th colSpan="7">Year: {plan.year}</th>
                            </tr>
                            {plan.rotationItems.map((item, itemIndex) => (
                              <RotationItem key={itemIndex} item={item} />
                            ))}
                          </React.Fragment>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                ))}
              </div>
            )}
          </section>
        </Card>
      </Container>
    );
  }

  return null;
}

export default RecommendationDashboard;
```

# app/pages/Recomandari/recomandari.tsx

```tsx
import { useGlobalContextCrop } from '../../providers/culturaStore';
import { useEffect, useState } from 'react';

export default function useRecommendations(nitrogenBalance, cropId) {
  const { SinglePage, singleCrop } = useGlobalContextCrop();
  const [recommendations, setRecommendations] = useState([]);
  
  useEffect(() => {
    SinglePage(cropId);
  }, [cropId]);

  useEffect(() => {
    if (singleCrop) {
      const newRecommendations = [];

      // Handle nitrogen balance
      newRecommendations.push(
        nitrogenBalance < singleCrop.nitrogenDemand - 50
          ? 'Nivelul azotului este scăzut. Este recomandat să folosiți un îngrășământ bogat în azot. Mai este nevoie de ' + (singleCrop.nitrogenDemand - nitrogenBalance) + ' unitati'
          : nitrogenBalance < singleCrop.nitrogenDemand
          ? 'Nivelul azotului este moderat. Este recomandat să continuați cu practicile curente de fertilizare. Mai este nevoie de ' + (singleCrop.nitrogenDemand - nitrogenBalance) + ' unitati'
          : 'Nivelul azotului este ridicat. Este recomandat să reduceți utilizarea de îngrășăminte cu azot.'
      );

      // Handle crop type
      switch (singleCrop.cropType) {
        case 'Cereală':
          newRecommendations.push(
            'Culturile de cereale pot beneficia de îngrășăminte fosfatate pentru a îmbunătăți randamentul recoltei.'
          );
          break;
        case 'Leguminoasă':
          newRecommendations.push(
            'Culturile de leguminoase pot beneficia de inoculare cu bacterii fixatoare de azot pentru a îmbunătăți randamentul recoltei.'
          );
          break;
        case 'Fruct':
          newRecommendations.push(
            'Culturile de fructe pot beneficia de îngrășăminte bogate în potasiu pentru a îmbunătăți calitatea fructelor.'
          );
          break;
        default:
          newRecommendations.push('Încă nu avem informații despre această cultură.');
          break;
      }

      setRecommendations(newRecommendations);
    }
  }, [singleCrop, nitrogenBalance, cropId]);

  return recommendations;
}
```

# app/pages/Recomandari/VremeFetch.tsx

```tsx
import React, { useEffect, useState } from 'react';
import axios from 'axios';

const API_KEY = 'YOUR_API_KEY';
const CITY = 'Cluj Napoca,RO';
const DAYS = 7;
const API_ENDPOINT = `http://api.openweathermap.org/data/2.5/forecast/daily?q=${CITY}&cnt=${DAYS}&appid=${API_KEY}&units=metric`;

export interface WeatherData {
  date: string;
  temperature: number;
  description: string;
  precipitation: number;
}

export default const WeatherTable: React.FC = () => {
  const [weatherData, setWeatherData] = useState<WeatherData[]>([]);

  useEffect(() => {
    axios.get(API_ENDPOINT)
      .then(response => {
        const data = response.data;
        const weatherData: WeatherData[] = data.list.map((day: any) => ({
          date: new Date(day.dt * 1000).toLocaleDateString(),
          temperature: day.temp.day,
          description: day.weather[0].description,
          precipitation: day.rain ? day.rain : 0
        }));
        setWeatherData(weatherData);
      })
      .catch(error => console.error(error));
  }, []);
};


```

# app/pages/Rotatie/Components/App.tsx

```tsx
import { useState } from 'react';
import styles from '../Rotatie.module.css';
import CropsList from './CropsList';
import Pagination from './Pagination';
import NoCrops from './NoCrops';

interface Crop {
  _id: string;
  cropName: string;
  cropType: string;
  cropVariety: string;
}


function App({ crops, areThereCrops }) {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const itemsPerPage = 6;

  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    setCurrentPage(1);
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;

  // Filter crops based on search term
  const filteredCrops = crops.filter(crop => {
    const regex = new RegExp(searchTerm, 'i');
    return regex.test(crop.cropName) || regex.test(crop.cropType) || regex.test(crop.cropVariety);
  });

  const currentItems = filteredCrops.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCrops.length / itemsPerPage);

  return (
    <div className={` text-center `}>
      <input
        type="text"
        placeholder="Search crops..."
        value={searchTerm}
        onChange={handleSearch}
        className={styles.searchInput}
      />

      {areThereCrops ? (
        <CropsList crops={currentItems} />
      ) : (
        <NoCrops />
      )}
      <Pagination
        totalPages={totalPages}
        currentPage={currentPage}
        onPageChange={handlePageChange}
      />
    </div>
  );
}

export default App;

```

# app/pages/Rotatie/Components/CropsList.tsx

```tsx
import GridGenerator from '@/app/componets/GridGen';
import Continut from '../../../Crud/GetAllInRotatie/page';
import styles from '../Rotatie.module.css';

interface Crop {
  _id: string;
  cropName: string;
  cropType: string;
  cropVariety: string;
}

interface CropsListProps {
  crops: Crop[];
}

function CropsList({ crops }: CropsListProps) {
  return (
    <div>
      <GridGenerator cols={3}>
        {crops.map((crop) => (
          <div className={styles.gridItem} key={crop._id}>
            <Continut crop={crop} />
          </div>
        ))}
      </GridGenerator>
    </div>
  );
}

export default CropsList;

```

# app/pages/Rotatie/Components/NoCrops.tsx

```tsx
import styles from '../Rotatie.module.css';
import { useTranslations } from 'next-intl';

function NoCrops() {
  const t = useTranslations('NoCrops');
  return (
    <div className={styles.noCrops}>
      <h3>
        {t('noCrops')}
      </h3>
      <p>
        {t('noCropsMessage')}
      </p>
    </div>
  );
}

export default NoCrops;



```

# app/pages/Rotatie/Components/Pagination.tsx

```tsx
import styles from '../Rotatie.module.css';

interface PaginationProps {
  totalPages: number;
  currentPage: number;
  onPageChange: (page: number) => void;
}

function Pagination({ totalPages, currentPage, onPageChange }: PaginationProps) {
  const pages = [];
  for (let i = 1; i <= totalPages; i++) {
    pages.push(i);
  }

  return (
    <div className={styles.pagination}>
      {pages.map((page) => (
        <button
          key={page}
          className={`${styles.pageButton} ${page === currentPage ? styles.active : ''}`}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}
    </div>
  );
}

export default Pagination;

```

# app/pages/Rotatie/page.tsx

```tsx
'use client'
import { useEffect } from 'react';
import Spinner from '../../Crud/Spinner';
import { useGlobalContextCrop } from '../../providers/culturaStore';
import { useSignals } from "@preact/signals-react/runtime";
import { useUser } from '@auth0/nextjs-auth0/client';
import App from './Components/App';

export default function Rotatie() {
  const { crops, isLoading, getAllCrops, areThereCrops } = useGlobalContextCrop();
  const { isLoading: isUserLoading } = useUser();

  useSignals();

  useEffect(() => {
    if (!isUserLoading) {
      getAllCrops();
    }
  }, [isUserLoading]);

  if (isLoading.value || isUserLoading) {
    return (
      <div>
        <Spinner />
        <p>Loading crops ...</p>
      </div>
    );
  }

  return <App crops={crops.value} areThereCrops={areThereCrops.value} />;
}



```

# app/pages/Rotatie/Rotatie.module.css

```css
.container {
    padding-bottom: 4rem;
    border: 1px solid #ccc; 
  }
  
  .title {
    margin-bottom: 3rem;
    font-size: 2rem; 
    color: #333; 
  }
  
  .gridContainer {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    align-items: stretch; 
  }
  
  .gridItem {
    flex: 1 0 calc(33.33% - 1rem); 
    box-sizing: border-box;
    margin-bottom: 4rem;
    border: 1px solid #ccc; 
    padding: 1rem; 
    display: flex; 
    flex-direction: column; 
  }
  
  .gridItem > * {
    margin-bottom: auto; 
  }
  
  .noContent {
    color: red; 
  }
  
```

# app/providers/culturaStore.tsx

```tsx
"use client";
import { createContext, useContext } from 'react';
import axios from 'axios';
import { useSignals  } from "@preact/signals-react/runtime";
import { signal } from "@preact/signals-react";
import { useUser } from '@auth0/nextjs-auth0/client';

// const API_URL = 'http://localhost:3000/api/Controllers/Crop/';
// const API_URL_ROTATION = 'http://localhost:3000/api/Controllers/Rotation/';
const API_URL = 'https://fictional-space-giggle-pwpr6qw7w5427v6q-3000.app.github.dev/api/Controllers/Crop/';
const API_URL_ROTATION = 'https://fictional-space-giggle-pwpr6qw7w5427v6q-3000.app.github.dev/api/Controllers/Rotation/';

type DataType = {
  
  _id: string;
  cropName: string;
  cropType: string;
  cropVariety: string;
  plantingDate: string;
  harvestingDate: string;
  description: string;
  imageUrl: string;
  soilType: string;
  fertilizers: string[];
  pests: string[];
  diseases: string[];
  selectare: boolean;
  user: string;
  token: string;
  ItShouldNotBeRepeatedForXYears: number;
  nitrogenSupply: number;
  nitrogenDemand: number;
  residualNitrogen: number;

};

type RecommendationType = {
  cropName: string;
  nitrogenSupply: number;
  nitrogenDemand: number;
  pests: string[];
  diseases: string[];

};

interface ContextProps {
  crops: any;
  selections: any;
  isLoading: any;
  isError: any;
  isSuccess: any;
  message: any;
  createCrop: (data: DataType) => Promise<void>;
  getCrops: () => Promise<void>;
  deleteCrop: (cropId: string) => Promise<void>;
  selectare: (cropId: number, selectare: boolean, numSelections: number) => Promise<void>;
  SinglePage: (id: string) => Promise<void>;
  getAllCrops: () => Promise<void>;
  updateCrop: (cropId: string, data: DataType) => Promise<void>;
  areThereCrops: any;
  setCropRotation: any;
  generateCropRotation: (fieldSize: number, numberOfDivisions: number, rotationName: string, crops: DataType, maxYears: number, ResidualNitrogenSupply: number) => Promise<void>;
  getCropRecommendations: (cropName: string) => Promise<any>;
  getCropRotation: () => Promise<void>;
  deleteCropRotation: (id: string) => Promise<void>;
  cropRotation: any;
  singleCrop: any;
  updateNitrogenBalanceAndRegenerateRotation: (data: any) => Promise<void>;
  updateDivisionSizeAndRedistribute: (data: any) => Promise<void>;
  addTheCropRecommendation: (data: RecommendationType) => Promise<void>;
  isCropRotationLoading: any;

}



interface Props {
  children: React.ReactNode;
}

const GlobalContext = createContext<ContextProps>({} as ContextProps);
export const GlobalContextProvider: React.FC<Props> = ({ children }) => {

const cropsSignal = signal([]);
const loadingSignal = signal(false);
const isErrorSignal = signal(false);
const isSuccessSignal = signal(false);
const messageSignal = signal('');
const cropRotationSignal = signal([]);
const singleCropSignal = signal(null);
const areThereCropsSignal = signal(false);
const selectionsSignal = signal([]);
const userStatus = signal(false);

const { user, error: authError, isLoading: isUserLoading  } = useUser();

userStatus.value = isUserLoading;



const getCropRotation = async () => {
 // useSignals(); 
  // Wait until isUserLoading is false
  loadingSignal.value = true;
    try {
    console.log("making a get request to get crop rotation try");
    const response = await axios.get(API_URL_ROTATION + "getRotation/rotation/" + user.sub);
    if (response.status === 200 || response.status === 203) {
      cropRotationSignal.value = response.data;
      console.log("crop rotation fetched 1 " + response?.data + response?.data?.message );
    } 
  } catch (err) {
    console.error(err);
  } finally {
    loadingSignal.value = false

  
  }

  console.log( "crop rotation fetched signal " + cropRotationSignal.value?.message);

};


const createCrop = async (data) => {
  console.log('createCrop triggered with object props: ' + JSON.stringify(data));
  loadingSignal.value = true
  try {
    const response = await axios.post(`${API_URL}crop/single/${user.sub}`, data);
    if (response.status === 201) {
      isSuccessSignal.value = true
      messageSignal.value ='Crop created successfully';
    } else {
      isErrorSignal.value = true
      messageSignal.value = 'Error creating crop';
    }
  } catch (err) {
    console.error(err)
  }
  loadingSignal.value = false
};

const updateCrop = async (cropId: string, data: DataType) => {

  loadingSignal.value = true
  try {
    const response = await axios.put(`${API_URL}crop/${cropId}/${user.sub}`, data, {});
    if (response.status === 200) {
      isSuccessSignal.value = true
      messageSignal.value ='Crop updated successfully';
    } else {
      isErrorSignal.value = true
      messageSignal.value = 'Error updating crop';
    }
  } catch (err) {
    console.error(err)
  }
  loadingSignal.value = false
};
const getCrops = async () => {


  console.log("getting crops..")
  try {
    loadingSignal.value = true
    const response = await axios.get(`${API_URL}crops/retrieve/all`, {});

    if (response.status === 200) {
      const newCrops = response.data.crops;
      if (newCrops !== cropsSignal.value) {
        cropsSignal.value = newCrops;
        areThereCropsSignal.value = true
      }
    } else {
      const newCrops = response.data.crops;
      if (newCrops !== cropsSignal.value) {
        cropsSignal.value = newCrops;
        isErrorSignal.value = true
        messageSignal.value = 'Error getting crops';
      }
    }
  } catch (err) {
    console.error(err)
  } finally {
    loadingSignal.value = false
  }

  console.log("crops are done in getCrops: " + !loadingSignal.value)
};

const deleteCrop = async (cropId: string) => {


  loadingSignal.value = true
  try {
    const response = await axios.delete(`${API_URL}crops/${user.sub}/${cropId}`, {});
    if (response.status === 200) {
      isSuccessSignal.value = true
      messageSignal.value = 'Crop deleted successfully';
    } else {
      isErrorSignal.value = true
      messageSignal.value = 'Error deleting crop';
    }
  } catch (err) {
    console.error(err)
  } finally {
  loadingSignal.value = false
  }
};

const selectare = async (cropId: number, selectare: boolean, numSelections: number) => {


  loadingSignal.value = true
  try {
    const response = await axios.put(`${API_URL}crops/${cropId}/selectare`, { selectare: selectare, numSelections: numSelections }, {});
    if (response.status === 200) {
      isSuccessSignal.value = true
      messageSignal.value = 'Crop selected successfully';
    } 
  } catch (err) {
    console.error(err)
  }  finally {
  loadingSignal.value = false
  } 
};

const SinglePage = async (id: string) => {

  
  loadingSignal.value = true
  try {
    const response = await axios.get(`${API_URL}crop/id/${id}`, {});
    if (response.status === 200) {
      const data = await response.data;
      isSuccessSignal.value = true
      singleCropSignal.value = data.crops[0];
    } else {
      isErrorSignal.value = true
      messageSignal.value = 'Error in single page crop';
    }
  } catch (err) {
    console.error(err)
  }finally {
    loadingSignal.value = false
    }
console.log("the state of loading is " + loadingSignal.value)
};

  const addTheCropRecommendation = async (data: RecommendationType) => {
    loadingSignal.value = true
    try {
      const response = await axios.post(`${API_URL}crops/recommendations/${user.sub}`, data, {});
      if (response.status === 201) {
        isSuccessSignal.value = true
        messageSignal.value ='Recommendation added successfully';
      } 
    } catch (err) {
      console.error(err);
    }
    loadingSignal.value = false
  };
  
  const generateCropRotation = async (
    fieldSize: number,
    numberOfDivisions: number,
    rotationName: string,
    crops: DataType,
    maxYears: number,
    ResidualNitrogenSupply: number,
  ) => {

    loadingSignal.value = true
  
    try {
      const response = await axios.post(
        `${API_URL_ROTATION}generateRotation/rotation/${user.sub}`,
        { 
          fieldSize, 
          numberOfDivisions,
          rotationName,
          crops,
          maxYears,
          ResidualNitrogenSupply,
        },
        {}
      );
      if (response.status === 200 || response.status === 201) {
        cropRotationSignal.value = response.data;
      } 
    } catch (err) {
      console.error(err);
    } finally {
    loadingSignal.value = false
    getCropRotation();
  
    }
  };
  

  const getAllCrops = async () => {


    try {
      loadingSignal.value = true
      const response = await axios.get(`${API_URL}crops/retrieve/all`, {});
      loadingSignal.value = false
      if (response.status === 200) {
        console.log("getting all crops..")
        const data = await response.data;
        cropsSignal.value = data.crops;
        areThereCropsSignal.value = true
        selectionsSignal.value = data.selections;
       
      }  else {
        cropsSignal.value = response.data.crops;
        isErrorSignal.value = true
        messageSignal.value = 'Error getting crops';
      }
    } catch (err) {
      console.error(err)
      areThereCropsSignal.value = false
    } finally {
      loadingSignal.value = false
    }
    console.log("crops are done fetching loading  signal is: " +  loadingSignal)
  };
  
  const deleteCropRotation = async (id: string) => {

    const confirmDelete = window.confirm("Are you sure you want to delete this crop rotation?");
    if (!confirmDelete) {
      return;
    }
    loadingSignal.value = true
    try {
      const response = await axios.delete(`${API_URL_ROTATION}deleteRotation/${user.sub}/${id}`, {});
      if (response.status === 200) {
        isSuccessSignal.value = true
        messageSignal.value = ('Crop rotation deleted successfully');
      } 
    } catch (err) {
      console.error(err)
    }
    loadingSignal.value = false
  };
  
  const getCropRecommendations = async (cropName: string) => {


    let recommendations = [];
    if (cropName !== '') {
      try {
        const response = await axios.get(`${API_URL}/crops/recommendations/${cropName}`, {});
        if (response.status === 200) {
          recommendations = response.data.crops;
        }
      } catch (error) {
        console.error(error);
      }
    }
    console.log("recommendations: ", recommendations);
    return recommendations;
  };
  
  
  const updateNitrogenBalanceAndRegenerateRotation = async (data: any) => {
    const { id, rotationName, year, division, nitrogenBalance } = data;
    loadingSignal.value = true
    try {
      const response = await axios.put(`${API_URL_ROTATION}updateNitrogenBalance/rotation/${user.sub}`, {id, year, rotationName, division, nitrogenBalance }, {});
      if (response.status === 200) {
        isSuccessSignal.value = true
        messageSignal.value = ('Nitrogen Balance and Crop Rotation updated successfully');
        cropRotationSignal.value =(response.data);
      } 
    } catch (err) {
      console.error(err);
    }
    loadingSignal.value = false
  };
  

const updateDivisionSizeAndRedistribute = async (data: any) => {
  const { id, rotationName, division, newDivisionSize } = data;
  loadingSignal.value = true
  try {
    const response = await axios.put(`${API_URL_ROTATION}updateDivisionSizeAndRedistribute/rotation/${user.sub}`, {id, rotationName, division, newDivisionSize }, {});
    if (response.status === 200) {
      isSuccessSignal.value = true
      messageSignal.value = ('Division Size and Crop Rotation updated successfully');
      cropRotationSignal.value = (response.data);
    } 
  } catch (err) {
    console.error(err)
  }
  loadingSignal.value = false
};

  return (
    <GlobalContext.Provider
    value={{
      crops: cropsSignal,
      selections: selectionsSignal,
      isLoading: loadingSignal,
      isError: isErrorSignal,
      isSuccess: isSuccessSignal,
      message: messageSignal,
      createCrop,
      getCrops,
      deleteCrop,
      selectare,
      SinglePage,
      getAllCrops,
      updateCrop,
      areThereCrops: areThereCropsSignal,
      setCropRotation: cropRotationSignal,
      generateCropRotation,
      getCropRecommendations,
      getCropRotation,
      deleteCropRotation,
      cropRotation: cropRotationSignal,
      singleCrop: singleCropSignal,
      updateNitrogenBalanceAndRegenerateRotation,
      updateDivisionSizeAndRedistribute,
      addTheCropRecommendation,
    
      
    }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContextCrop = () => {
  return useContext(GlobalContext);
};

// Path: app\features\Context\culturaStore.tsx


```

# app/providers/postStore.tsx

```tsx
"use client";
import { createContext, useContext, Dispatch , SetStateAction , useState } from 'react';
import axios from 'axios'
import { useUser } from '@auth0/nextjs-auth0/client';

//const API_URL = 'http://localhost:3000/api/Controllers/Post'
const API_URL = 'https://fictional-space-giggle-pwpr6qw7w5427v6q-3000.app.github.dev/api/Controllers/Post'
type DataType = {
    id: string;
    _id: string;
    title: string;
    brief: string;
    description: string;
    image: string;
    user: string;
    token: string;
}
interface ContextProps {
    data: any;
    setData: Dispatch<SetStateAction<any>>;
    error: string;
    setError: Dispatch<SetStateAction<string>>;
    loading: boolean;
    setLoading: Dispatch<SetStateAction<boolean>>;
    createPost: ( data: DataType , token:string   ) => Promise<void>;
    updatePost: (id: string , title: string, brief: string, description: string, image: string) => Promise<void>;
    deletePost: (_id: string, token:string) => Promise<void>;
    getPost: (id: string) => Promise<void>;
    getAllPosts: (count : number) => Promise<void>;
    clearData: () => void;
   
}

const ContextProps  = createContext<ContextProps>({
    data: [],
    setData: () => {},
    error: '',
    setError: () => {},
    loading: false,
    setLoading: () => {},
    createPost: () => Promise.resolve(),
    modify: () => Promise.resolve(),
    deletePost: () => Promise.resolve(),
    getPost: () => Promise.resolve(),
    getAllPosts: () => Promise.resolve(),
    clearData: () => {},
});
interface Props {
    children: React.ReactNode;
    }

const GlobalContext = createContext<ContextProps>({} as ContextProps);
export const GlobalContextProvider: React.FC<Props> = ({ children }) => {

    const [data, setData] = useState<any[]>([]);
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState<boolean>(false);
    const [hasMore, setHasMore] = useState<boolean>(true);
    const { user, error: authError, isLoading: isUserLoading  } = useUser();


    const createPost = async ({ title, brief, description, image }: any) => {
        setLoading(true);
        try {
          const response = await axios.post(API_URL + "/post" + "/new/" + user.sub, {
            title,
            brief,
            description,
            image,
          }, {
      
          });
          const data = await response.data;
          if (data.error) {
            setError(data.error);
            setLoading(false);
            console.log(data.error)
          } else {
            setData((prevData) => [...prevData, data]);
            setLoading(false);
    
          }
        } catch (error: any) {
          setError(error.response.data.message);
          setLoading(false);
        }
      }


    const updatePost = async (postId: string, { title, brief, description, image }: any) => {
        setLoading(true);
        try {
            const response = await axios.put(API_URL + "/post/" + postId + "/" + user.sub , {
                title,
                brief,
                description,
                image,
            }, {
            });
            const data = await response.data;
            if (data.error) {
                setError(data.error);
                setLoading(false);
            } else {
                setData(data);
                setLoading(false);
            }
        } catch (error:any ) {
            setError(error.response.data.message);
            setLoading(false);
        }
    }
 


    const deletePost = async (postId: string) => {
        setLoading(true);
        try {

            const response = await axios.delete(API_URL + "/post/" + postId + "/" + user.sub); {
            }
            const data = await response.data;
            if (data.error) {
                setError(data.error);
                setLoading(false);
            } else {
                setData(data);
                setLoading(false);
            }
        } catch (error:any ) {
            setError(error.response.data.message);
            setLoading(false);
        }
    }




    const getPost = async (id: string) => {
        //solved
        setLoading(true);
        try {
            const response = await axios.get(API_URL + "/post/id/" + id);
            const data = await response.data;
            if (data.error) {
                setError(data.error);
                setLoading(false);
            } else {
                setData(data);
                setLoading(false);
               
            }
        } catch (error:any ) {
            setError(error.response.data.message);
            setLoading(false);
        }
    }

    
   
    const getAllPosts = async (count: number) => {
        //solved
        setLoading(true);
        try {
            const url = count ? API_URL + "/posts/count/" + count : API_URL + "/posts/retrieve/all";
            const response = await axios.get(url);
            const data = await response.data;
            console.log("it did trigger")
            if (data.error) {
                setError(data.error);
                setLoading(false);
            } else if (data.message === "No more posts") {
                setError(data.message);
                setLoading(false);
            } else {
                setData((prevData: any) => {
                    if (Array.isArray(prevData)) {
                        return [...prevData, ...data.posts];
                    } else {
                        return [...data.posts];
                    }
                });
                setLoading(false);
            }
            
        } catch (error: any) {
            setError(error.response.data.message);
            setLoading(false);
        }
    }


    const clearData = () => {
        setData([]);
        setError('');
    }

    
    



    return (
        <GlobalContext.Provider
         value={{ 
        data,
        setData,
        error,
        setError,
        loading,
        setLoading,
        getPost,
        getAllPosts,
        createPost,
        updatePost,
        deletePost,
        clearData
         }}>
            {children}
        </GlobalContext.Provider>
    );
};

export const useGlobalContextPost = () =>{
    return useContext(GlobalContext);
} 



```

# app/providers/rotationStore.tsx

```tsx
"use client";
import { createContext, useContext, Dispatch, SetStateAction, useState, useCallback } from 'react';
import axios from 'axios';

// const API_URL_cropRotation = 'http://localhost:5000/api/crops/cropRotation/';
// const API_URL_cropRecommendations = 'http://localhost:5000/api/crops/cropRecommendations';
// const API_URL_CropFields = 'http://localhost:5000/api/crops/cropRotation/fields';

const API_URL_cropRotation = 'https://fictional-space-giggle-pwpr6qw7w5427v6q-3000.app.github.dev/api/crops/cropRotation/';
const API_URL_cropRecommendations = 'https://fictional-space-giggle-pwpr6qw7w5427v6q-3000.app.github.dev/api/crops/cropRecommendations';
const API_URL_CropFields = 'https://fictional-space-giggle-pwpr6qw7w5427v6q-3000.app.github.dev/api/crops/cropRotation/fields';

type DataType = {
  _id: string;
  cropName: string;
  cropType: string;
  cropVariety: string;
  plantingDate: string;
  harvestingDate: string;
  description: string;
  imageUrl: string;
  soilType: string;
  fertilizers: string[];
  pests: string[];
  diseases: string[];
  selectare: boolean;
  user: string;
  token: string;
  ItShouldNotBeRepeatedForXYears: number;
  nitrogenSupply: number;
  nitrogenDemand: number;
  residualNitrogen: number;
};

type RecommendationType = {
  cropName: string;
  nitrogenSupply: number;
  nitrogenDemand: number;
  pests: string[];
  diseases: string[];
};

interface ContextProps {
  isLoading: boolean;
  setIsLoading: Dispatch<SetStateAction<boolean>>;
  isError: boolean;
  setIsError: Dispatch<SetStateAction<boolean>>;
  isSuccess: boolean;
  setIsSuccess: Dispatch<SetStateAction<boolean>>;
  message: string;
  setMessage: Dispatch<SetStateAction<string>>;
  cropRotation: any;
  setCropRotation: Dispatch<SetStateAction<any>>;
  generateCropRotation: ( fieldSize: number, numberOfDivisions: number, rotationName: string, filteredCrops: any, token: string , maxYears: number, ResidualNitrogenSupply: number ) => Promise<void>;
  addTheCropRecommendation: (data: RecommendationType, token: string) => Promise<void>;
  getCropRotation: (token: string) => Promise<void>;
  updateNitrogenBalanceAndRegenerateRotation: (token:string , data: DataType) => Promise<void>;
  updateDivisionSizeAndRedistribute: (token:string , data: DataType) => Promise<void>;
}

const ContextProps = createContext<ContextProps>({
  isLoading: false,
  setIsLoading: () => {},
  isError: false,
  setIsError: () => {},
  isSuccess: false,
  setIsSuccess: () => {},
  message: '',
  setMessage: () => {},
  cropRotation: [],
  setCropRotation: () => {},
  generateCropRotation: () => Promise.resolve(),
  getCropRotation: () => Promise.resolve(),
  addTheCropRecommendation: () => Promise.resolve(),
  updateNitrogenBalanceAndRegenerateRotation: () => Promise.resolve(),
  updateDivisionSizeAndRedistribute: () => Promise.resolve(),
});

interface Props {
  children: React.ReactNode;
}

const GlobalContext = createContext<ContextProps>({} as ContextProps);
export const GlobalContextProvider: React.FC<Props> = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [message, setMessage] = useState('');
  const [cropRotation, setCropRotation] = useState([]);

  const generateCropRotation = async (
    fieldSize: number,
    numberOfDivisions: number,
    rotationName: string,
    crops: DataType,
    maxYears: number,
    ResidualNitrogenSupply:number,
  ) => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${API_URL_cropRotation}`,
        { 
          fieldSize, 
          numberOfDivisions,
          rotationName,
          crops,
          maxYears,
          ResidualNitrogenSupply,
        },
        {
        }
      );
      if (response.status === 200) {
        setCropRotation(response.data);
      } else {
        setIsError(true);
        setMessage('Error generating crop rotation');
      }
    } catch (err) {
      setIsError(true);
      setMessage('Error generating crop rotation');
    }
    setIsLoading(false);
  };

  const getCropRotation = async (token: string) => {
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL_cropRotation}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 200) {
        setCropRotation(response.data);
      } else if (response.status === 204) {
        setMessage('Nu exista nici o rotatie de culturi');
        setCropRotation(response.data);
      } else
       {
        setIsError(true);
        setMessage('Eroare la preluarea rotatiei de culturi');
      }
    } catch (err) {
      setIsError(true);
      setMessage('Eroare la preluarea rotatiei de culturi');
    }
    setIsLoading(false);
  };

  const deleteCropRotation = async (id: string, token: string) => {
    setIsLoading(true);
    try {
      const response = await axios.delete(`${API_URL_cropRotation}${id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.status === 200) {
        setIsSuccess(true);
        setMessage('Crop rotation deleted successfully');
      } else {
        setIsError(true);
        setMessage('Error deleting crop rotation');
      }
    } catch (err) {
      setIsError(true);
      setMessage('Error deleting crop rotation');
    }
    setIsLoading(false);
  };




  const getCropRecommendations = useCallback(async (cropName: string, token: string) => {
    let recommendations = [];
    if (cropName !== '') {
      try {
        const response = await axios.get(
          `${API_URL_cropRecommendations}?cropName=${cropName}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.status === 200 && response.data.length > 0) { // check if response data is not empty
          recommendations = response.data;
        }
      } catch (error) {
        console.error(error);
      }
    }
    return recommendations;
  }, []);
  


  
  const updateNitrogenBalanceAndRegenerateRotation = async ( token: string, data: any) => {
  setIsLoading(true);
  const {rotationName, year, division, nitrogenBalance } = data;
  try {
    const response = await axios.put(`${API_URL_cropRotation}`, {year, rotationName,division, nitrogenBalance }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.status === 200) {
      setIsSuccess(true);
      setMessage('Nitrogen Balance and Crop Rotation updated successfully');
      setCropRotation(response.data);
    } else {
      setIsError(true);
      setMessage('Error updating Nitrogen Balance and Crop Rotation');
    }
  } catch (err) {
    setIsError(true);
    setMessage('Error updating Nitrogen Balance and Crop Rotation');
  }
  setIsLoading(false);
};

  
const updateDivisionSizeAndRedistribute = async (token: string, data: any) => {
  const { rotationName, division, newDivisionSize } = data;
  setIsLoading(true);
  try {
    const response = await axios.put(`${API_URL_cropRotation}`, { rotationName, division, newDivisionSize }, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (response.status === 200) {
      setIsSuccess(true);
      setMessage('Division Size and Crop Rotation updated successfully');
      setCropRotation(response.data);
    } else {
      setIsError(true);
      setMessage('Error updating Division Size and Crop Rotation');
    }
  } catch (err) {
    setIsError(true);
    setMessage('Error updating Division Size and Crop Rotation');
  }
  setIsLoading(false);
};




  

  return (
    <GlobalContext.Provider
      value={{
        isLoading,
        setIsLoading,
        isError,
        setIsError,
        isSuccess,
        setIsSuccess,
        message,
        setMessage,
        setCropRotation,
        generateCropRotation,
        getCropRotation,
        cropRotation,
        updateNitrogenBalanceAndRegenerateRotation,
        updateDivisionSizeAndRedistribute,
      

      }}
    >
      {children}
    </GlobalContext.Provider>
  );
};

export const useGlobalContextCrop = () => {
  return useContext(GlobalContext);
};
export const useGlobalContextCropRotation = () => {
  return useContext(GlobalContext);
};
```

# app/providers/UserStore.tsx

```tsx
"use client";
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useUser } from '@auth0/nextjs-auth0/client';
import { useRouter } from 'next/navigation';

//const API_URL = 'http://localhost:3000/api/Controllers/User/';
const API_URL = 'https://fictional-space-giggle-pwpr6qw7w5427v6q-3000.app.github.dev/api/Controllers/User/';


type DataType = {
  _id: string;
  role: string;
  name: string;
  email: string;
  fermierUsers?: any[];
  picture?: string;
};

interface ContextProps {
  data: DataType;
  setData: (data: DataType) => void;
  error: string;
  loading: boolean;
  login: () => void;
  logout: () => void;
  // modify: (id: string, password: string) => Promise<void>;
  deleteUser: (id: string) => Promise<void>;
  fetchFermierUsers: () => Promise<void>;
  fermierUsers: any[];
  //bool
  isUserLoggedIn: () => boolean;
  register: (role: string, name: string, email: string) => Promise<void>;
  updateRole: (email: string, role: string) => Promise<void>;
}


const GlobalContext = createContext<ContextProps>({} as ContextProps);

export const GlobalContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [data, setData] = useState<DataType>({ _id: '', role: "", name: '', email: '', fermierUsers: [] });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [fermierUsers, setFermierUsers] = useState<any[]>([]);
  const { user, error: authError, isLoading } = useUser();

  const router = useRouter();

  useEffect(() => {
    if (user && user.name && !authError && !isLoading) {
      setData({
        _id: user.sub,
        role: user.userRoles[0],
        name: user.name,
        email: user.email,
        fermierUsers: []
      });
    }
  }, [user, authError, isLoading]);

  useEffect(() => {
    const handleRequest = async () => {
      setLoading(true);
      try {
        if (!isLoading && user) {
          setData((prevData) => ({
            ...prevData,
            role: user.userRoles[0]
          }));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    handleRequest();
  }, [isLoading, user]);

  // Check if user is logged in
  const isUserLoggedIn = () => {
    if (user) {
      setData({
        _id: user.sub,
        role: user.userRoles[0],
        name: user.name,
        email: user.email,
        fermierUsers: []
      });
      return true;
    } else {
      return false;
    }
  };
  
 const register = async (role: string, name: string, email: string) => {
    setLoading(true);
    try {
      await axios.post(API_URL + 'register', {
      
        name,
        email,
        role
        
      }).then((response) => {
        setData(response.data);
        router.push('/');
      });
    } catch (error) {
      setError('Error registering user');
    } finally {
      setLoading(false);
    }
  }

  

const login = async () => {

    setData(undefined);
    router.push('/api/auth/login');
  }


  const logout = async () => {
    router.push('/api/auth/logout');
    setData(undefined);
  };


const deleteUser = async ( id: string) => {
setLoading(true);
try {
  await axios.delete(API_URL + "delete/" + id ).then(() => {
  setFermierUsers((prevFermierUsers) =>
  prevFermierUsers.filter((user) => user._id !== id)
  );
  }
  );
  } catch (error) {
  setError('Error deleting user');
  }
  finally {
  setLoading(false);
  }
  };

  const updateRole = async (email: string, role: string) => {
    setLoading(true);
    try {
      await axios.post(API_URL + 'changeRole', {
        email,
        role
      }).then((response) => {
        setData(response.data);
      });
    } catch (error) {
      setError('Error updating role');
    } finally {
      setLoading(false);
    }
  
  }




const fetchFermierUsers = async () => {
setLoading(true);
try {
  await axios.get(API_URL + 'fermieri',
  {

      }
      ).then((response) => {
      setFermierUsers(response.data);
      }
      );
      } catch (error) {
      setError('Error fetching users');
      } finally {
      setLoading(false);
      }
      };






return (
<GlobalContext.Provider
value={{
  data,
  login,
  setData,
  logout,
  error,
  loading,
  deleteUser,
  fetchFermierUsers,
  fermierUsers,
  isUserLoggedIn,
  register ,
  updateRole
 
}}
>
{children}
</GlobalContext.Provider>
);
};

export const useGlobalContext = () => {
return useContext(GlobalContext);

};
```

# i18n.ts

```ts
import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  const cookieStore = cookies();
  const locale = cookieStore.get('language')?.value || 'ro';
  console.log(locale);

  return {
    locale,
    messages: (await import(`./locales/${locale}.json`)).default
  };
});
```

# locales/en.json

```json
{
  "HomePage": {
    "title": "English World Hello!"
  },
  "ContactUs": {
    "title": "Agricultural Solutions Platform",
    "subtitle": "Driving Efficiency and Sustainability",
    "vision": "Our Vision",
    "cropManagement": "Crop Management",
    "cropManagementDescription": "Precise monitoring and management tools for maximizing crop performance",
    "supportCollaboration": "Support and Collaboration",
    "supportCollaborationDescription": "Committed to providing top-notch support and fostering collaboration for users success",
    "comprehensiveTracking": "Comprehensive Tracking",
    "comprehensiveTrackingDescription": "Track and analyze every stage of your crops lifecycle seamlessly",
    "robustAnalytics": "Robust Analytics",
    "robustAnalyticsDescription": "Suite of analytical instruments tailored to optimize agricultural processes",
    "efficiencyProfitability": "Efficiency and Profitability",
    "efficiencyProfitabilityDescription": "Engineered to enhance efficiency, reduce waste, and drive profitability for farmers",
    "contactUs": "Feel free to contact us",
    "contactUsForm": "Contact us form"
  },
  "Contact": {
    "name": "Name",
    "email": "Email",
    "enterName": "Enter your name",
    "enterEmail": "Enter your email",
    "privacyNotice": "We will never share your email with anyone else",
    "message": "Message",
    "enterMessage": "Enter your message",
    "send": "Send"
  },
  "News": {
    "latestNewsfeed": "Latest in our newsfeed",
    "title": "title",
    "subtitle": "subtitle",
    "vision": "vision"
  },
  "LinkAdaugaPostare": {
    "addPost": "Add Post"
  },
  "LinkParola": {
    "changePassword": "Change Password"
  },
  "Modifica": {
    "modifyPassword": "Change Password",
    "enterPassword": "Enter password",
    "confirmPassword": "Confirm password",
    "submit": "Submit",
    "passwordMismatch": "Passwords do not match"
  },
  "Postari": {
    "posts": "Posts",
    "delete": "Delete"
  },
  "RotatieDashboard": {
    "loading": "Loading",
    "selectedCrops": "Selected Crops",
    "noCrops": "No Crop Selected",
    "seeMore": "See More",
    "noCropsAvailable": "No Crops Available",
    "rotations": "Rotations",
    "fieldSize": "Field Size",
    "divisionCount": "Number of Divisions",
    "year": "year",
    "division": "Division",
    "cropName": "Crop Name",
    "plantingDate": "Planting Date",
    "harvestDate": "Harvest Date",
    "divisionSize": "Division Size",
    "nitrogenBalance": "Nitrogen Balance",
    "additionalNitrogen": "Additional Nitrogen",
    "deleteRotation": "Delete Rotation",
    "notANumber": "Not a Number",
    "annualEvolution": "annual evolution"
  },
  "CropRotationForm": {
    "fieldSize": "Field Size",
    "numberOfDivisions": "Number of Divisions",
    "rotationName": "Rotation Name",
    "maxYears": "Max Years",
    "ResidualNitrogenSupply": "Residual Nitrogen Supply",
    "generateCropRotation": "Generate Crop Rotation"
  },
  "NoCrops": {
    "noCrops": "No crops found",
    "noCropsMessage": "There are no crops"
  }
}

```

# locales/ro.json

```json
{
  "HomePage": {
    "title": "Salut lume română!"
  },
  "ContactUs": {
    "title": "Platformă de Soluții Agricole",
    "subtitle": "Creșterea Eficienței și Sustenabilității",
    "vision": "Viziunea Noastră",
    "cropManagement": "Managementul Culturilor",
    "cropManagementDescription": "Instrumente precise de monitorizare și gestionare pentru maximizarea performanței culturilor",
    "supportCollaboration": "Suport și Colaborare",
    "supportCollaborationDescription": "Angajați să oferim suport de top și să promovăm colaborarea pentru succesul utilizatorilor",
    "comprehensiveTracking": "Urmărire Completă",
    "comprehensiveTrackingDescription": "Urmăriți și analizați fiecare etapă a ciclului de viață al culturilor",
    "robustAnalytics": "Analize Robuste",
    "robustAnalyticsDescription": "Set de instrumente analitice adaptate pentru optimizarea proceselor agricole",
    "efficiencyProfitability": "Eficiență și Profitabilitate",
    "efficiencyProfitabilityDescription": "Proiectat pentru a îmbunătăți eficiența și a crește profitabilitatea",
    "contactUs": "Nu ezitați să ne contactați",
    "contactUsForm": "Formular de contact"
  },
  "Contact": {
    "name": "Nume",
    "email": "Email",
    "enterName": "Introduceți numele",
    "enterEmail": "Introduceți emailul",
    "privacyNotice": "Nu vom împărtăși emailul dvs cu nimeni",
    "message": "Mesaj",
    "enterMessage": "Introduceți mesajul",
    "send": "Trimite"
  },
  "News": {
    "Latest in our newsfeed:": "Ultimele noutăți:",
    "title": "titlu",
    "subtitle": "subtitlu",
    "vision": "viziune",
    "cropManagement": "managementul culturilor",
    "cropManagementDescription": "descrierea managementului culturilor",
    "supportCollaboration": "suport și colaborare",
    "supportCollaborationDescription": "descrierea suportului și colaborării",
    "comprehensiveTracking": "urmărire completă",
    "comprehensiveTrackingDescription": "descrierea urmăririi complete",
    "robustAnalytics": "analize robuste",
    "robustAnalyticsDescription": "descrierea analizelor robuste",
    "efficiencyProfitability": "eficiență și profitabilitate",
    "efficiencyProfitabilityDescription": "descrierea eficienței și profitabilității",
    "contactUs": "contactați-ne",
    "contactUsForm": "formular de contact"
  },
  "LinkAdaugaPostare": {
    "AdaugaPostare": "Adaugă Postare"
  },
  "LinkParola": {
    "ModificaParola": "Modifică Parola"
  },
  "Modifica": {
    "Modificare parola": "Modificare parolă",
    "Enter password": "Introduceți parola",
    "Confirm password": "Confirmați parola",
    "Submit": "Trimite",
    "Passwords do not match": "Parolele nu se potrivesc"
  },
  "Postari": {
    "Postari": "Postări",
    "Sterge": "Șterge"
  },
  "RotatieDashboard": {
    "Loading": "Încărcare",
    "Culturi selectate": "Culturi selectate",
    "Nicio cultura selectata": "Nicio cultură selectată",
    "Vezi mai mult": "Vezi mai mult",
    "Nu exista culturi": "Nu există culturi",
    "Rotatii": "Rotații",
    "Dimensiune camp": "Dimensiune câmp",
    "Numar de diviziuni": "Număr de diviziuni",
    "anul": "anul",
    "Diviziune": "Diviziune",
    "Nume cultura": "Nume cultură",
    "Data plantarii": "Data plantării",
    "Data recoltarii": "Data recoltării",
    "Dimensiune diviziune": "Dimensiune diviziune",
    "Bilant azot": "Bilanț azot",
    "Azot suplimentar": "Azot suplimentar",
    "Sterge rotatie": "Șterge rotație",
    "Not a number": "Nu este un număr",
    "anual evolution": "evoluție anuală"
  },
  "CropRotationForm": {
    "fieldSize": "Dimensiune câmp",
    "numberOfDivisions": "Număr de diviziuni",
    "rotationName": "Nume rotație",
    "maxYears": "Ani maximi",
    "ResidualNitrogenSupply": "Aprovizionare cu azot rezidual",
    "generateCropRotation": "Generează rotația culturilor"
  },
  "NoCrops": {
    "noCrops": "Nu s-au găsit culturi",
    "noCropsMessage": "Nu există culturi"
  }
}
```

# middleware.ts

```ts
// middleware.ts
import createMiddleware from 'next-intl/middleware';
import { withMiddlewareAuthRequired, getSession, Session } from '@auth0/nextjs-auth0/edge';
import { NextFetchEvent, NextRequest, NextResponse } from 'next/server';

const myMiddleware = async (req: NextRequest) => {
  const res = NextResponse.next();
  const session: Session | null = await getSession(req, res);
  if (session) {
    console.log('Hello from authed middleware' + " User infos access " + session.user.userRoles);
  } else {
    console.log('No session found');
  }
  return res;
};

// Combine both middlewares
const combinedMiddleware = async (req: NextRequest, event: NextFetchEvent) => {
  await withMiddlewareAuthRequired(myMiddleware)(req, event);
};

export default combinedMiddleware;

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/rotation-dashboard/:path*',
    '/api/:path*',
  ]
};







```

# next-env.d.ts

```ts
/// <reference types="next" />
/// <reference types="next/image-types/global" />

// NOTE: This file should not be edited
// see https://nextjs.org/docs/basic-features/typescript for more information.

```

# next.config.mjs

```mjs
/** @type {import('next').NextConfig} */

import createNextIntlPlugin from 'next-intl/plugin';
 
const withNextIntl = createNextIntlPlugin();
 
/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false
};
 
export default withNextIntl(nextConfig);
```

# package.json

```json
{
  "name": "farm",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "prisma:seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  },
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  },
  "dependencies": {
    "@auth0/auth0-react": "^2.2.4",
    "@auth0/nextjs-auth0": "^3.5.0",
    "@emailjs/browser": "^4.3.3",
    "@next/font": "14.1.4",
    "@preact/signals-react": "^2.0.1",
    "@prisma/client": "^5.21.1",
    "@tailwindcss/aspect-ratio": "^0.4.2",
    "@tailwindcss/forms": "^0.5.9",
    "@tailwindcss/typography": "^0.5.15",
    "@types/node": "20.11.30",
    "@types/react": "18.2.73",
    "@types/react-dom": "18.2.22",
    "ai-digest": "^1.0.7",
    "antd": "^5.15.4",
    "axios": "^1.6.8",
    "bootstrap": "^5.3.3",
    "check-node-version": "^4.2.1",
    "cookie": "^0.6.0",
    "debounce": "^2.0.0",
    "dotenv": "^16.4.5",
    "emailjs": "^4.0.3",
    "emailjs-com": "^3.2.0",
    "eslint": "8.57.0",
    "eslint-config-next": "14.1.4",
    "i18next": "^23.12.4",
    "i18next-resources-to-backend": "^1.2.1",
    "js-cookie": "^3.0.5",
    "jsonwebtoken": "^9.0.2",
    "localforage": "^1.10.0",
    "lodash": "^4.17.21",
    "lucide-react": "^0.454.0",
    "mongoose": "^8.3.1",
    "mssql": "^11.0.1",
    "next": "^14.1.4",
    "next-connect": "^1.0.0",
    "next-i18n-router": "^5.5.1",
    "next-i18next": "^15.3.1",
    "next-intl": "^3.17.3",
    "openai": "^4.29.2",
    "react": "^18.2.0",
    "react-bootstrap": "^2.10.2",
    "react-calendar": "^4.8.0",
    "react-dom": "18.2.0",
    "react-file-base64": "^1.0.3",
    "react-i18next": "^15.0.1",
    "react-icons": "^5.0.1",
    "react-toastify": "^10.0.5",
    "readline": "^1.3.0",
    "recharts": "^2.12.3",
    "sass": "^1.72.0",
    "typescript": "5.4.3"
  },
  "devDependencies": {
    "@preact/signals-react-transform": "^0.3.1",
    "@types/react-calendar": "^3.9.0",
    "autoprefixer": "^10.4.20",
    "postcss": "^8.4.47",
    "postcss-preset-env": "^10.0.8",
    "prisma": "^5.21.1",
    "tailwindcss": "^3.4.14"
  }
}

```

# postcss.config.js

```js
module.exports = {
  plugins: {
    'tailwindcss': {},
    'autoprefixer': {},
    'postcss-preset-env': {
      features: {
        'nesting-rules': false
      },
      browsers: ['>0.2%', 'not dead', 'not op_mini all']
    }
  }
}
```

# prisma/schema.prisma

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlserver"
  url      = env("DATABASE_URL")
}

model User {
  id             String            @id @default(uuid())
  name           String
  email          String            @unique
  roleType       String            @default("FARMER")
  createdAt      DateTime          @default(now())
  updatedAt      DateTime          @updatedAt
  crops          Crop[]            @relation("UserCrops")
  posts          Post[]            @relation("UserPosts")
  rotations      Rotation[]        @relation("UserRotations")
  cropSelections UserCropSelection[] @relation("UserSelections")

  @@map("users")
}

model Crop {
  id                             Int                @id @default(autoincrement())
  userId                         String
  user                          User               @relation("UserCrops", fields: [userId], references: [id], onDelete: NoAction, onUpdate: NoAction)
  cropName                       String
  cropType                       String?
  cropVariety                    String?
  plantingDate                   DateTime?
  harvestingDate                DateTime?
  description                    String?           @db.Text
  imageUrl                       String?           @db.Text
  soilType                       String?
  climate                        String?
  ItShouldNotBeRepeatedForXYears Int?
  nitrogenSupply                 Decimal          @db.Decimal(10,2)
  nitrogenDemand                 Decimal          @db.Decimal(10,2)
  soilResidualNitrogen          Decimal?         @db.Decimal(10,2)
  createdAt                     DateTime          @default(now())
  updatedAt                     DateTime          @updatedAt
  deleted                       DateTime?
  
  details                      CropDetail[]        @relation("CropDetails")
  rotationPlans               RotationPlan[]      @relation("CropRotationPlans")
  userSelections              UserCropSelection[] @relation("CropSelections")

  @@index([userId])
  @@index([cropName])
  @@map("crops")
}

model CropDetail {
  id        Int       @id @default(autoincrement())
  value     String
  detailType String   
  cropId    Int
  crop      Crop      @relation("CropDetails", fields: [cropId], references: [id], onDelete: NoAction, onUpdate: NoAction, map: "FK_CropDetail_Crop")
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  @@index([cropId, detailType])
  @@map("crop_details")
}

model Rotation {
  id                Int            @id @default(autoincrement())
  userId           String
  user             User           @relation("UserRotations", fields: [userId], references: [id], onDelete: NoAction, onUpdate: NoAction, map: "FK_Rotation_User")
  rotationName     String
  fieldSize        Decimal        @db.Decimal(10,2)
  numberOfDivisions Int
  createdAt        DateTime       @default(now())
  updatedAt        DateTime       @updatedAt
  rotationPlans    RotationPlan[] @relation("RotationPlans")

  @@map("rotations")
}

model RotationPlan {
  id              Int       @id @default(autoincrement())
  rotationId      Int
  rotation        Rotation  @relation("RotationPlans", fields: [rotationId], references: [id], onDelete: NoAction, onUpdate: NoAction, map: "FK_RotationPlan_Rotation")
  year            Int
  division        Int
  cropId          Int
  crop            Crop      @relation("CropRotationPlans", fields: [cropId], references: [id], onDelete: NoAction, onUpdate: NoAction, map: "FK_RotationPlan_Crop")
  plantingDate    DateTime?
  harvestingDate  DateTime?
  divisionSize    Decimal?  @db.Decimal(10,2)
  nitrogenBalance Decimal?  @db.Decimal(10,2)
  directlyUpdated Boolean   @default(false)
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt

  @@map("rotation_plans")
}

model Post {
  id          Int      @id @default(autoincrement())
  userId      String
  user        User     @relation("UserPosts", fields: [userId], references: [id], onDelete: NoAction, onUpdate: NoAction, map: "FK_Post_User")
  title       String
  brief       String?  @db.Text
  description String?  @db.Text
  image       String?  @db.Text
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@map("posts")
}

model UserCropSelection {
  id            Int      @id @default(autoincrement())
  userId        String
  user          User     @relation("UserSelections", fields: [userId], references: [id], onDelete: NoAction, onUpdate: NoAction, map: "FK_UserCropSelection_User")
  cropId        Int
  crop          Crop     @relation("CropSelections", fields: [cropId], references: [id], onDelete: NoAction, onUpdate: NoAction, map: "FK_UserCropSelection_Crop")
  selectionCount Int     @default(0)
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@unique([userId, cropId])
  @@map("user_crop_selections")
}
```

# prisma/seed.ts

```ts
import { PrismaClient, Role } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Create admin user
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      id: 'auth0|admin',
      email: 'admin@example.com',
      name: 'Admin User',
      role: Role.ADMIN,
    }
  });

  // Create sample crops
  const sampleCrops = [
    {
      cropName: 'Wheat',
      cropType: 'Cereal',
      cropVariety: 'Winter Wheat',
      nitrogenDemand: 180,
      nitrogenSupply: 40,
      ItShouldNotBeRepeatedForXYears: 2,
    },
    {
      cropName: 'Corn',
      cropType: 'Cereal',
      cropVariety: 'Sweet Corn',
      nitrogenDemand: 200,
      nitrogenSupply: 30,
      ItShouldNotBeRepeatedForXYears: 1,
    }
  ];

  for (const cropData of sampleCrops) {
    await prisma.crop.create({
      data: {
        ...cropData,
        userId: adminUser.id,
        plantingDate: new Date(),
        harvestingDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      }
    });
  }

  console.log('Seed data created');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
// Run this script with `ts-node prisma/seed.ts`
// You can also use `ts-node-dev` instead of `ts-node` for hot reloading

```

# public/locales/en/common.json

```json
{
    "translation": {
      "specificKey": "Translated Value",
       "headerTitle": "My {{appName}} Header Title nigger"
    }
  }
```

# public/locales/ro/common.json

```json
{
    "translation": {
      "specificKey": "Valoare tradusa",
      "headerTitle": "My {{appName}} Header Title ro"
    }
  }
```

# public/Logo.png

This is a binary file of the type: Image

# public/next.svg

This is a file of the type: SVG Image

# public/vercel.svg

This is a file of the type: SVG Image

# README.md

```md
This is a [Next.js](https://nextjs.org/) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

\`\`\`bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
\`\`\`

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/basic-features/font-optimization) to automatically optimize and load Inter, a custom Google Font.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

```

# styles/globalsBot.css

```css


.nav-list {
    list-style: none;
  }
  
  .nav-link-login {
    color: inherit !important;
  }
```

# styles/header-plain-green.jpg

This is a binary file of the type: Image

# styles/Header.module.css

```css
/* .container {
  max-width: 100%;
}


.header {
  width: 100%;
 padding: 10px ; 
  top: 0;
  left: 0;
  z-index: 10;
  background: #FCCB8C;
  box-shadow: 0 0.3rem 2rem 0px rgba(1, 2, 1, 0.10) !important ;
  
}

.link {
  color: #ffffff;
  text-decoration: none;
}
.logo {
  margin-left: 15%!important;
}

.navbar {
  margin-left: 20px;
}

.navLink {
  color: #fff;
  margin-left: 20px;
  margin-right: 30px;
  text-decoration: none;
  padding: 5px;
  white-space: nowrap;
}

.navLink:hover {
  color: #ddd;
}

.signInBtn {
  color: #fff;
  background-color: rgba(108, 117, 125, 0.5); 
}

  
    
    .footer {
      box-shadow: -1px 1rem 2rem 4px rgba(1, 2, 1, 0.25) !important ;
  
      background: #FCCB8C;
      background-size: cover;
      border-radius: 0.25rem;
      width: 100%;
      color: white;
      position: relative;
      bottom: 0;
      display: flex;
     max-height: 25px;

    }
    
    .container {
      display: flex;
      justify-content: space-between;
      flex-wrap: wrap;
      margin-bottom: 10px;
    }
    
    .nav-list {
      list-style: none;
    }
    
    .navLink {
      color: white;
      text-decoration: none;
    }
    
    .navLink:hover {
      color: #ddd;
      transition: color 0.3s ease-in-out;
    }
    
    @media (max-width: 768px) {
      .container {
        flex-direction: column;
      }
    } */
```

# styles/Home.module.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

.main {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  align-items: center;
  padding: 6rem;
  min-height: 100vh;
}

.description {
  display: inherit;
  justify-content: inherit;
  align-items: inherit;
  font-size: 0.85rem;
  max-width: var(--max-width);
  width: 100%;
  z-index: 2;
  font-family: var(--font-mono);
}

.description a {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 0.5rem;
}

.description p {
  position: relative;
  margin: 0;
  padding: 1rem;
  background-color: rgba(var(--callout-rgb), 0.5);
  border: 1px solid rgba(var(--callout-border-rgb), 0.3);
  border-radius: var(--border-radius);
}

.code {
  font-weight: 700;
  font-family: var(--font-mono);
}

.grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(25%, auto));
  width: var(--max-width);
  max-width: 100%;
}

.card {
  padding: 1rem 1.2rem;
  /* border-radius: var(--border-radius); */
  /* background: rgba(var(--card-rgb), 0); */
  border: 0;
  transition: background 200ms, border 200ms;
}

.card span {
  display: inline-block;
  transition: transform 200ms;
}

.card h2 {
  font-weight: 600;
  margin-bottom: 0.7rem;
}

.card p {
  margin: 0;
  opacity: 0.6;
  font-size: 0.9rem;
  line-height: 1.5;
  max-width: 30ch;
}

.center {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
  padding: 4rem 0;
}

.center::before {
  background: var(--secondary-glow);
  border-radius: 50%;
  width: 480px;
  height: 360px;
  margin-left: -400px;
}

.center::after {
  background: var(--primary-glow);
  width: 240px;
  height: 180px;
  z-index: -1;
}

.center::before,
.center::after {
  content: '';
  left: 50%;
  position: absolute;
  filter: blur(45px);
  transform: translateZ(0);
}

.logo,
.thirteen {
  position: relative;
}

.thirteen {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 75px;
  height: 75px;
  padding: 25px 10px;
  margin-left: 16px;
  transform: translateZ(0);
  border-radius: var(--border-radius);
  overflow: hidden;
  box-shadow: 0px 2px 8px -1px #0000001a;
}

.thirteen::before,
.thirteen::after {
  content: '';
  position: absolute;
  z-index: -1;
}

/* Conic Gradient Animation */
.thirteen::before {
  animation: 6s rotate linear infinite;
  width: 200%;
  height: 200%;
  background: var(--tile-border);
}

/* Inner Square */
.thirteen::after {
  inset: 0;
  padding: 1px;
  border-radius: var(--border-radius);
  background: linear-gradient(
    to bottom right,
    rgba(var(--tile-start-rgb), 1),
    rgba(var(--tile-end-rgb), 1)
  );
  background-clip: content-box;
}

/* Enable hover only on non-touch devices */
@media (hover: hover) and (pointer: fine) {
  .card:hover {
    background: rgba(var(--card-rgb), 0.1);
    border: 1px solid rgba(var(--card-border-rgb), 0.15);
  }

  .card:hover span {
    transform: translateX(4px);
  }
}

@media (prefers-reduced-motion) {
  .thirteen::before {
    animation: none;
  }

  .card:hover span {
    transform: none;
  }
}

/* Mobile */
@media (max-width: 700px) {
  .content {
    padding: 4rem;
  }

  .grid {
    grid-template-columns: 1fr;
    margin-bottom: 120px;
    max-width: 320px;
    text-align: center;
  }

  .card {
    padding: 1rem 2.5rem;
  }

  .card h2 {
    margin-bottom: 0.5rem;
  }

  .center {
    padding: 8rem 0 6rem;
  }

  .center::before {
    transform: none;
    height: 300px;
  }

  .description {
    font-size: 0.8rem;
  }

  .description a {
    padding: 1rem;
  }

  .description p,
  .description div {
    display: flex;
    justify-content: center;
    position: fixed;
    width: 100%;
  }

  .description p {
    align-items: center;
    inset: 0 0 auto;
    padding: 2rem 1rem 1.4rem;
    border-radius: 0;
    border: none;
    border-bottom: 1px solid rgba(var(--callout-border-rgb), 0.25);
    background: linear-gradient(
      to bottom,
      rgba(var(--background-start-rgb), 1),
      rgba(var(--callout-rgb), 0.5)
    );
    background-clip: padding-box;
    backdrop-filter: blur(24px);
  }

  .description div {
    align-items: flex-end;
    pointer-events: none;
    inset: auto 0 0;
    padding: 2rem;
    height: 200px;
    background: linear-gradient(
      to bottom,
      transparent 0%,
      rgb(var(--background-end-rgb)) 40%
    );
    z-index: 1;
  }
}

/* Tablet and Smaller Desktop */
@media (min-width: 701px) and (max-width: 1120px) {
  .grid {
    grid-template-columns: repeat(2, 50%);
  }
}

@media (prefers-color-scheme: dark) {
  .vercelLogo {
    filter: invert(1);
  }

  .logo,
  .thirteen img {
    filter: invert(1) drop-shadow(0 0 0.3rem #ffffff70);
  }
}

@keyframes rotate {
  from {
    transform: rotate(360deg);
  }
  to {
    transform: rotate(0deg);
  }
}

```

# tailwind.config.js

```js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./styles/**/*.{css,scss,sass,less,styl}"
  ],
  theme: {
    extend: {},
  },
  plugins: [],
  // Enable CSS Modules compatibility
  important: true,
}

```

# tailwind.config.ts

```ts
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
      },
      primary: {
        50: '#f0f9ff',
        100: '#e0f2fe',
        200: '#bae6fd',
        300: '#7dd3fc',
        400: '#38bdf8',
        500: '#0ea5e9',
        600: '#0284c7',
        700: '#0369a1',
        800: '#075985',
        900: '#0c4a6e',
      },
    },
    fontFamily: {
      sans: ['Inter var', 'sans-serif'],
    },
    
  },
  plugins: [],
};
export default config;



```

# tsconfig.json

```json
{
  "compilerOptions": {
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": true,
    "skipLibCheck": true,
    "strict": false,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [
      {
        "name": "next"
      }
    ],
    "paths": {
      "@/*": ["./*"]
    }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts", "next-i18next.config.js"],
  "exclude": ["node_modules"]
}

```

# types/index.ts

```ts
export interface ApiResponse<T> {
    data?: T;
    error?: string;
    message?: string;
  }
  
  export interface PaginationParams {
    page?: number;
    limit?: number;
    orderBy?: string;
    order?: 'asc' | 'desc';
  }
```

