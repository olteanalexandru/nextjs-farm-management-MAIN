import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getCurrentUser } from 'app/lib/auth';
import { prisma } from 'app/lib/prisma';
import { AiFeature } from 'app/lib/ai/rateLimit';

const VALID_FEATURES: AiFeature[] = ['CROP_LOOKUP', 'FERTILIZATION_INSIGHT', 'ROTATION_INSIGHT', 'PEST_DIAGNOSIS'];

export const GET = withApiAuthRequired(async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    const { searchParams } = new URL(request.url);

    const featureParam = searchParams.get('feature');
    const feature = VALID_FEATURES.includes(featureParam as AiFeature) ? (featureParam as AiFeature) : undefined;
    const limit = Math.min(Number(searchParams.get('limit') ?? '20'), 50);

    const logs = await prisma.aiLookupLog.findMany({
      where: {
        userId: user.id,
        outcome: 'SUCCESS',
        responseJson: { not: null },
        ...(feature ? { feature } : {})
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        feature: true,
        query: true,
        createdAt: true,
        responseJson: true,
        cropId: true
      }
    });

    return Response.json({ logs });
  } catch (error) {
    console.error('GET AI history error:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
});
