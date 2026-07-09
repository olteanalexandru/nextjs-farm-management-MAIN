import { NextRequest } from 'next/server';
import { prisma } from 'app/lib/prisma';
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


//get routes are:
//1. rotation/rotationId



export async function GET(
  request: NextRequest,
  { params }: { params: { params: string[] } }
) {
  try {
    const session = await authenticateUser();
    if (session instanceof Response) return session;
    const auth0User = session.user;

    // First, get the database user using the Auth0 ID
    const dbUser = await prisma.user.findUnique({
      where: { auth0Id: auth0User.sub }
    });

    if (!dbUser) {
      console.error('Database user not found for Auth0 ID:', auth0User.sub);
      return Response.json({ error: 'User not found' }, { status: 404 });
    }

    const [action] = params.params;

    if (action === 'getRotation') {
      const { searchParams } = new URL(request.url);
      const page = Math.max(1, Number(searchParams.get('page') ?? '1'));
      const limit = Math.min(50, Math.max(1, Number(searchParams.get('limit') ?? '20')));
      const skip = (page - 1) * limit;

      const where = { userId: dbUser.id };
      const [rotations, total] = await Promise.all([
        prisma.rotation.findMany({
          where,
          include: {
            rotationPlans: {
              include: { crop: { include: { details: true } } },
              orderBy: [{ year: 'asc' }, { division: 'asc' }]
            }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit
        }),
        prisma.rotation.count({ where })
      ]);

      return Response.json({ data: rotations, total, page, limit }, { status: 200 });
    }

    return Response.json({ error: 'Invalid route' }, { status: 400 });
  } catch (error) {
    console.error('GET request error:', error);
    return Response.json({ 
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}