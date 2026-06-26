import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getCurrentUser } from 'app/lib/auth';
import { ApiResponse } from 'app/types/api';
import { getStripeClient, isStripeConfigured } from 'app/lib/stripe/stripeClient';
import { PREMIUM_PLAN, isPremiumCheckoutConfigured } from 'app/lib/stripe/plans';

export const POST = withApiAuthRequired(async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user?.id) {
      const response: ApiResponse = { error: 'User not found or not properly authenticated', status: 401 };
      return Response.json(response, { status: 401 });
    }

    if (!isStripeConfigured() || !isPremiumCheckoutConfigured() || !PREMIUM_PLAN.priceId) {
      const response: ApiResponse = { error: 'Payments are not configured yet. Please try again later.', status: 503 };
      return Response.json(response, { status: 503 });
    }

    if (user.subscriptionTier === 'PREMIUM') {
      const response: ApiResponse = { error: 'You already have an active Premium subscription.', status: 400 };
      return Response.json(response, { status: 400 });
    }

    const origin = request.headers.get('origin') || new URL(request.url).origin;
    const stripe = getStripeClient();

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: PREMIUM_PLAN.priceId, quantity: 1 }],
      client_reference_id: user.id,
      customer: user.stripeCustomerId || undefined,
      customer_email: user.stripeCustomerId ? undefined : user.email,
      success_url: `${origin}/Premium?checkout=success`,
      cancel_url: `${origin}/Premium?checkout=cancelled`,
      metadata: { userId: user.id }
    });

    if (!session.url) {
      const response: ApiResponse = { error: 'Could not start checkout. Please try again later.', status: 502 };
      return Response.json(response, { status: 502 });
    }

    return Response.json({ url: session.url, status: 200 });
  } catch (error) {
    console.error('POST billing checkout error:', error);
    const response: ApiResponse = {
      error: error instanceof Error ? error.message : 'Internal server error',
      status: 500
    };
    return Response.json(response, { status: 500 });
  }
});
