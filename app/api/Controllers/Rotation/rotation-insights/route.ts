import { NextRequest } from 'next/server';
import { prisma } from 'app/lib/prisma';
import { ApiResponse } from 'app/types/api';
import { checkAiRateLimit, logAiUsage } from 'app/lib/ai/rateLimit';
import { generateRotationInsight, RotationInsightCell } from 'app/lib/ai/rotationInsights';
import authenticateUser from '../[...params]/authenticatedUser';

export const POST = async function POST(request: NextRequest) {
  try {
    const session = await authenticateUser();
    if (session instanceof Response) return session;
    const auth0User = session.user;

    const dbUser = await prisma.user.findUnique({
      where: { auth0Id: auth0User.sub }
    });
    if (!dbUser) {
      const response: ApiResponse = { error: 'User not found', status: 404 };
      return Response.json(response, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const rotationId = Number(body?.rotationId);
    if (!Number.isInteger(rotationId) || rotationId <= 0) {
      const response: ApiResponse = { error: 'A valid rotationId is required.', status: 400 };
      return Response.json(response, { status: 400 });
    }

    const rotation = await prisma.rotation.findFirst({
      where: { id: rotationId, userId: dbUser.id },
      include: {
        rotationPlans: {
          include: { crop: true },
          orderBy: [{ year: 'asc' }, { division: 'asc' }]
        }
      }
    });

    if (!rotation) {
      const response: ApiResponse = { error: 'Rotation not found.', status: 404 };
      return Response.json(response, { status: 404 });
    }

    const rateLimit = await checkAiRateLimit(dbUser.id, 'ROTATION_INSIGHT');
    if (!rateLimit.allowed) {
      await logAiUsage(dbUser.id, 'ROTATION_INSIGHT', `rotation:${rotationId}`, 'RATE_LIMITED');
      const response: ApiResponse = { error: rateLimit.reason, status: 429 };
      return Response.json(response, { status: 429 });
    }

    const cells: RotationInsightCell[] = rotation.rotationPlans.map((rp) => ({
      year: rp.year,
      division: rp.division,
      cropName: rp.crop.cropName,
      divisionSize: rp.divisionSize ? Number(rp.divisionSize) : 0,
      nitrogenBalance: rp.nitrogenBalance ? Number(rp.nitrogenBalance) : 0,
      manuallyOverridden: rp.directlyUpdated
    }));

    let insight;
    try {
      insight = await generateRotationInsight({
        rotationName: rotation.rotationName,
        fieldSize: Number(rotation.fieldSize),
        numberOfDivisions: rotation.numberOfDivisions,
        cells
      });
    } catch (error) {
      console.error('AI rotation insight error:', error);
      await logAiUsage(dbUser.id, 'ROTATION_INSIGHT', `rotation:${rotationId}`, 'ERROR');
      const response: ApiResponse = { error: 'AI insight is temporarily unavailable. Please try again later.', status: 503 };
      return Response.json(response, { status: 503 });
    }

    if (!insight) {
      await logAiUsage(dbUser.id, 'ROTATION_INSIGHT', `rotation:${rotationId}`, 'ERROR');
      const response: ApiResponse = { error: 'AI insight is temporarily unavailable. Please try again later.', status: 503 };
      return Response.json(response, { status: 503 });
    }

    await logAiUsage(dbUser.id, 'ROTATION_INSIGHT', `rotation:${rotationId}`, 'SUCCESS');

    return Response.json({ insight, status: 200 });
  } catch (error) {
    console.error('POST rotation insight error:', error);
    const response: ApiResponse = {
      error: error instanceof Error ? error.message : 'Internal server error',
      status: 500
    };
    return Response.json(response, { status: 500 });
  }
};
