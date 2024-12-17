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
      console.log('Fetching rotations for user ID:', dbUser.id); // Debug log

      const rotations = await prisma.rotation.findMany({
        where: {
          userId: dbUser.id // Use the database user ID instead of Auth0 ID
        },
        include: {
          rotationPlans: {
            include: {
              crop: {
                include: {
                  details: true
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

      console.log('Found rotations:', rotations.length); // Debug log
      return Response.json({ data: rotations }, { status: 200 });
    }

    return Response.json({ error: 'Invalid route' }, { status: 400 });
  } catch (error) {
    console.error('GET request error:', error);
    return Response.json({ 
      error: error instanceof Error ? error.message : 'Internal server error'
    }, { status: 500 });
  }
}