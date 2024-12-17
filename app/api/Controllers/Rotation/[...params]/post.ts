import { NextRequest } from 'next/server';
import { prisma } from 'app/lib/prisma';
import {  RotationInput, RotationPlanInput } from '../interfaces';
import { Decimal } from '@prisma/client/runtime/library';
import  authenticateUser  from './authenticatedUser';
import {
  hasSharedPests,
  hasSharedDiseases,
  calculateNitrogenBalance,
  sortCropsByNitrogenBalance,
  cropIsAvailable
} from './helperFunctions';


//post routes are:
//1. rotation/generateRotation


export async function POST(
  request: NextRequest,
  { params }: { params: { params: string[] } }
) {
  try {
    const session = await authenticateUser();
    if (session instanceof Response) return session;
    const auth0User = session.user;

    const [action] = params.params;

    if (action === 'generateRotation') {
      // First, get the database user using the Auth0 ID
      const dbUser = await prisma.user.findUnique({
        where: { auth0Id: auth0User.sub }
      });

      if (!dbUser) {
        return Response.json(
          { error: 'User not found in database' },
          { status: 404 }
        );
      }

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

      // Add validation for required fields
      if (!fieldSize || !numberOfDivisions || !rotationName) {
        return Response.json(
          { error: 'Missing required fields' },
          { status: 400 }
        );
      }

      if (fieldSize <= 0 || numberOfDivisions <= 0) {
        return Response.json(
          { error: 'Field size and number of divisions must be positive numbers' },
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

      const rotationPlans: RotationPlanInput[] = [];

      for (let year = 1; year <= maxYears; year++) {
        usedCropsInYear.set(year, new Set());
        
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
                dbUser.id  // Use dbUser.id instead of user.sub
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

                rotationPlans.push({
                  year,
                  division,
                  cropId: candidateCrop.id,
                  divisionSize: new Decimal(divisionSize),
                  nitrogenBalance: new Decimal(nitrogenBalance)
                });
                break;
              }
            }
          } else {
            const cropIndex = (division + year - 2) % crops.length;
            const crop = crops[cropIndex];
            
            if (await cropIsAvailable(crop, year, lastUsedYear, division, dbUser.id)) { // Use dbUser.id here too
              lastUsedYear.get(division)?.set(crop.cropName, year);
              usedCropsInYear.get(year)?.add(crop.id);

              const nitrogenBalance = calculateNitrogenBalance(
                crop,
                crop.nitrogenSupply,
                ResidualNitrogenSupply
              );

              rotationPlans.push({
                year,
                division,
                cropId: crop.id,
                divisionSize: new Decimal(divisionSize),
                nitrogenBalance: new Decimal(nitrogenBalance)
              });
            }
          }
        }
      }

      const rotationData = await prisma.rotation.create({
        data: {
          userId: dbUser.id, // Use the database user ID instead of Auth0 ID
          rotationName,
          fieldSize: new Decimal(fieldSize),
          numberOfDivisions,
          rotationPlans: {
            create: rotationPlans
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

      return Response.json({
        message: 'Rotation generated successfully',
        data: rotationData
      });
    }

    return Response.json({ error: 'Invalid route' }, { status: 400 });
  } catch (error) {
    console.error('POST request error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}