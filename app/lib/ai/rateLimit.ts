import { prisma } from 'app/lib/prisma';

const USER_DAILY_LIMIT = Number(process.env.AI_CROP_LOOKUP_USER_DAILY_LIMIT || 15);
const GLOBAL_DAILY_LIMIT = Number(process.env.AI_CROP_LOOKUP_GLOBAL_DAILY_LIMIT || 100);
const DAY_MS = 24 * 60 * 60 * 1000;

export type AiLookupOutcome =
  | 'SUCCESS'
  | 'REJECTED_NOT_CROP'
  | 'RATE_LIMITED'
  | 'ERROR';

export async function checkAiLookupRateLimit(
  userId: string
): Promise<{ allowed: boolean; reason?: string }> {
  const since = new Date(Date.now() - DAY_MS);

  const [userCount, globalCount] = await Promise.all([
    prisma.aiLookupLog.count({
      where: { userId, createdAt: { gte: since } }
    }),
    prisma.aiLookupLog.count({
      where: { createdAt: { gte: since } }
    })
  ]);

  if (userCount >= USER_DAILY_LIMIT) {
    return {
      allowed: false,
      reason: 'You have reached your daily limit for AI crop lookups. Please try again tomorrow.'
    };
  }

  if (globalCount >= GLOBAL_DAILY_LIMIT) {
    return {
      allowed: false,
      reason: 'The AI crop lookup service is at capacity right now. Please try again later.'
    };
  }

  return { allowed: true };
}

export async function logAiLookup(
  userId: string,
  query: string,
  outcome: AiLookupOutcome,
  cropId?: number
): Promise<void> {
  await prisma.aiLookupLog.create({
    data: {
      userId,
      query: query.slice(0, 100),
      outcome,
      cropId
    }
  });
}
