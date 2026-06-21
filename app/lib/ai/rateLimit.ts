import { prisma } from 'app/lib/prisma';

const DAY_MS = 24 * 60 * 60 * 1000;

export type AiFeature = 'CROP_LOOKUP' | 'FERTILIZATION_INSIGHT';

export type AiUsageOutcome = 'SUCCESS' | 'REJECTED' | 'RATE_LIMITED' | 'ERROR';

const DEFAULT_LIMITS: Record<AiFeature, { user: number; global: number }> = {
  CROP_LOOKUP: { user: 15, global: 100 },
  FERTILIZATION_INSIGHT: { user: 30, global: 200 }
};

function getLimit(feature: AiFeature, scope: 'USER' | 'GLOBAL'): number {
  const envVar = `AI_${feature}_${scope}_DAILY_LIMIT`;
  const fallback = DEFAULT_LIMITS[feature][scope === 'USER' ? 'user' : 'global'];
  const value = Number(process.env[envVar]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export async function checkAiRateLimit(
  userId: string,
  feature: AiFeature
): Promise<{ allowed: boolean; reason?: string }> {
  const since = new Date(Date.now() - DAY_MS);

  const [userCount, globalCount] = await Promise.all([
    prisma.aiLookupLog.count({
      where: { userId, feature, createdAt: { gte: since } }
    }),
    prisma.aiLookupLog.count({
      where: { feature, createdAt: { gte: since } }
    })
  ]);

  if (userCount >= getLimit(feature, 'USER')) {
    return {
      allowed: false,
      reason: 'You have reached your daily limit for this AI feature. Please try again tomorrow.'
    };
  }

  if (globalCount >= getLimit(feature, 'GLOBAL')) {
    return {
      allowed: false,
      reason: 'This AI feature is at capacity right now. Please try again later.'
    };
  }

  return { allowed: true };
}

export async function logAiUsage(
  userId: string,
  feature: AiFeature,
  query: string,
  outcome: AiUsageOutcome,
  cropId?: number
): Promise<void> {
  await prisma.aiLookupLog.create({
    data: {
      userId,
      feature,
      query: query.slice(0, 100),
      outcome,
      cropId
    }
  });
}
