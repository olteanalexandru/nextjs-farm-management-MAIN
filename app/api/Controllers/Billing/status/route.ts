import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getCurrentUser } from 'app/lib/auth';
import { ApiResponse } from 'app/types/api';
import { getUsageSummary } from 'app/lib/ai/rateLimit';
import { SubscriptionTier, isPremiumCheckoutConfigured, isBillingPortalConfigured, PREMIUM_PLAN } from 'app/lib/stripe/plans';

export const GET = withApiAuthRequired(async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user?.id) {
      const response: ApiResponse = { error: 'User not found or not properly authenticated', status: 401 };
      return Response.json(response, { status: 401 });
    }

    const tier: SubscriptionTier = user.subscriptionTier === 'PREMIUM' ? 'PREMIUM' : 'FREE';
    const usage = await getUsageSummary(user.id, tier);

    return Response.json({
      tier,
      status: user.subscriptionStatus,
      currentPeriodEnd: user.subscriptionCurrentPeriodEnd,
      checkoutAvailable: isPremiumCheckoutConfigured() && tier !== 'PREMIUM',
      portalAvailable: isBillingPortalConfigured() && Boolean(user.stripeCustomerId),
      plan: PREMIUM_PLAN,
      usage,
      httpStatus: 200
    });
  } catch (error) {
    console.error('GET billing status error:', error);
    const response: ApiResponse = {
      error: error instanceof Error ? error.message : 'Internal server error',
      status: 500
    };
    return Response.json(response, { status: 500 });
  }
});
