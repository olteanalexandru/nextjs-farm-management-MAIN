import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { RotationInput, RotationPlanInput } from '../interfaces';
import { Decimal } from '@prisma/client/runtime/library';
import authenticateUser from './authenticatedUser';
import {
  hasSharedPests,
  hasSharedDiseases,
  calculateNitrogenBalance,
  sortCropsByNitrogenBalance,
  cropIsAvailable
} from './helperFunctions';

const prisma = new PrismaClient();

export async function PUT(
  request: NextRequest,
  { params }: { params: { params: string[] } }
) {
  try {
    const session = await authenticateUser();
    if (session instanceof Response) return session;
    const auth0User = session.user;

    // Get database user
    const dbUser = await prisma.user.findUnique({
      where: { auth0Id: auth0User.sub }
    });

    if (!dbUser) {
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const [action] = params.params;

    if (action === 'updateDivisionSizeAndRedistribute') {
      const { id, division, newDivisionSize } = await request.json();

      const rotationRecord = await prisma.rotation.findUnique({
        where: { id: parseInt(id) }
      });

      if (!rotationRecord || rotationRecord.userId !== dbUser.id) {
        return Response.json({ error: 'Not authorized' }, { status: 401 });
      }

      const newDivisionSizeDecimal = new Decimal(newDivisionSize);
      if (newDivisionSizeDecimal.greaterThan(rotationRecord.fieldSize) || newDivisionSizeDecimal.lessThan(0)) {
        return Response.json({ error: 'Invalid division size' }, { status: 400 });
      }

      const remainingSize = rotationRecord.fieldSize.sub(newDivisionSizeDecimal);
      const otherDivisionsSize = remainingSize.div(rotationRecord.numberOfDivisions - 1);

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
                  divisionSize: newDivisionSizeDecimal,
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

      return Response.json({
        message: 'Division size updated successfully',
        data: updatedRotation
      });
    }

    if (action === 'updateNitrogenBalance') {
      const { id, year, division, nitrogenBalance } = await request.json();

      const rotationRecord = await prisma.rotation.findUnique({
        where: { id: parseInt(id) },
        include: { rotationPlans: true }
      });

      if (!rotationRecord || rotationRecord.userId !== dbUser.id) {
        return Response.json({ error: 'Not authorized' }, { status: 401 });
      }

      const updatedRotation = await prisma.$transaction(async (tx) => {
        await tx.rotationPlan.updateMany({
          where: {
            rotationId: parseInt(id),
            year: parseInt(year),
            division: parseInt(division)
          },
          data: {
            nitrogenBalance: new Decimal(nitrogenBalance),
            directlyUpdated: true
          }
        });

        return tx.rotation.findUnique({
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

    return Response.json({ error: 'Invalid route' }, { status: 400 });
  } catch (error) {
    console.error('PUT request error:', error);
    return Response.json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    }, { status: 500 });
  }
}
