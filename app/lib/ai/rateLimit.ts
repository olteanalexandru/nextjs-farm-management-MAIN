import { prisma } from 'app/lib/prisma';
import { SubscriptionTier } from 'app/lib/stripe/plans';

const DAY_MS = 24 * 60 * 60 * 1000;

export type AiFeature = 'CROP_LOOKUP' | 'FERTILIZATION_INSIGHT' | 'ROTATION_INSIGHT' | 'PEST_DIAGNOSIS';

export type AiUsageOutcome = 'SUCCESS' | 'REJECTED' | 'RATE_LIMITED' | 'ERROR';

const DEFAULT_LIMITS: Record<AiFeature, { free: number; premium: number; global: number }> = {
  CROP_LOOKUP: { free: 15, premium: 60, global: 100 },
  FERTILIZATION_INSIGHT: { free: 30, premium: 120, global: 200 },
  ROTATION_INSIGHT: { free: 30, premium: 120, global: 200 },
  PEST_DIAGNOSIS: { free: 20, premium: 80, global: 150 }
};

export const AI_FEATURES: AiFeature[] = ['CROP_LOOKUP', 'FERTILIZATION_INSIGHT', 'ROTATION_INSIGHT', 'PEST_DIAGNOSIS'];

function getUserLimit(feature: AiFeature, tier: SubscriptionTier): number {
  const envVar = `AI_${feature}_${tier}_DAILY_LIMIT`;
  const fallback = DEFAULT_LIMITS[feature][tier === 'PREMIUM' ? 'premium' : 'free'];
  const value = Number(process.env[envVar]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function getGlobalLimit(feature: AiFeature): number {
  const envVar = `AI_${feature}_GLOBAL_DAILY_LIMIT`;
  const fallback = DEFAULT_LIMITS[feature].global;
  const value = Number(process.env[envVar]);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

export async function checkAiRateLimit(
  userId: string,
  feature: AiFeature,
  tier: SubscriptionTier = 'FREE'
): Promise<{ allowed: boolean; reason?: string; upgradeRecommended?: boolean }> {
  const since = new Date(Date.now() - DAY_MS);

  const [userCount, globalCount] = await Promise.all([
    prisma.aiLookupLog.count({
      where: { userId, feature, createdAt: { gte: since } }
    }),
    prisma.aiLookupLog.count({
      where: { feature, createdAt: { gte: since } }
    })
  ]);

  if (userCount >= getUserLimit(feature, tier)) {
    const upgradeRecommended = tier !== 'PREMIUM';
    return {
      allowed: false,
      reason: upgradeRecommended
        ? 'You have reached your daily limit for this AI feature on the Free plan. Upgrade to Premium for a much higher daily limit.'
        : 'You have reached your daily limit for this AI feature. Please try again tomorrow.',
      upgradeRecommended
    };
  }

  if (globalCount >= getGlobalLimit(feature)) {
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

export interface FeatureUsage {
  feature: AiFeature;
  used: number;
  limit: number;
}

export async function getUsageSummary(userId: string, tier: SubscriptionTier): Promise<FeatureUsage[]> {
  const since = new Date(Date.now() - DAY_MS);

  const counts = await Promise.all(
    AI_FEATURES.map((feature) =>
      prisma.aiLookupLog.count({ where: { userId, feature, createdAt: { gte: since } } })
    )
  );

  return AI_FEATURES.map((feature, i) => ({
    feature,
    used: counts[i],
    limit: getUserLimit(feature, tier)
  }));
}
