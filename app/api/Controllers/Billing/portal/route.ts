import { NextRequest } from 'next/server';
import { withApiAuthRequired } from '@auth0/nextjs-auth0';
import { getCurrentUser } from 'app/lib/auth';
import { ApiResponse } from 'app/types/api';
import { getStripeClient, isStripeConfigured } from 'app/lib/stripe/stripeClient';

export const POST = withApiAuthRequired(async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser(request);
    if (!user?.id) {
      const response: ApiResponse = { error: 'User not found or not properly authenticated', status: 401 };
      return Response.json(response, { status: 401 });
    }

    if (!isStripeConfigured()) {
      const response: ApiResponse = { error: 'Billing management is not configured yet. Please try again later.', status: 503 };
      return Response.json(response, { status: 503 });
    }

    if (!user.stripeCustomerId) {
      const response: ApiResponse = { error: 'No billing account found for this user yet.', status: 400 };
      return Response.json(response, { status: 400 });
    }

    const origin = request.headers.get('origin') || new URL(request.url).origin;
    const stripe = getStripeClient();

    const session = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${origin}/Premium`
    });

    return Response.json({ url: session.url, status: 200 });
  } catch (error) {
    console.error('POST billing portal error:', error);
    const response: ApiResponse = {
      error: error instanceof Error ? error.message : 'Internal server error',
      status: 500
    };
    return Response.json(response, { status: 500 });
  }
});
