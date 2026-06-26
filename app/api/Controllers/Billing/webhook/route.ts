import { NextRequest } from 'next/server';
import Stripe from 'stripe';
import { prisma } from 'app/lib/prisma';
import { getStripeClient, isStripeConfigured } from 'app/lib/stripe/stripeClient';
import { SubscriptionTier } from 'app/lib/stripe/plans';

function tierFromStatus(status: Stripe.Subscription.Status): SubscriptionTier {
  return status === 'active' || status === 'trialing' ? 'PREMIUM' : 'FREE';
}

async function syncSubscription(subscription: Stripe.Subscription) {
  const customerId = typeof subscription.customer === 'string' ? subscription.customer : subscription.customer.id;
  const periodEndSeconds = subscription.items.data[0]?.current_period_end;

  await prisma.user.updateMany({
    where: { stripeCustomerId: customerId },
    data: {
      subscriptionTier: tierFromStatus(subscription.status),
      subscriptionStatus: subscription.status,
      stripeSubscriptionId: subscription.id,
      subscriptionCurrentPeriodEnd: periodEndSeconds ? new Date(periodEndSeconds * 1000) : null
    }
  });
}

export async function POST(request: NextRequest) {
  if (!isStripeConfigured() || !process.env.STRIPE_WEBHOOK_SECRET) {
    return Response.json({ error: 'Webhook is not configured', status: 503 }, { status: 503 });
  }

  const signature = request.headers.get('stripe-signature');
  if (!signature) {
    return Response.json({ error: 'Missing signature', status: 400 }, { status: 400 });
  }

  const rawBody = await request.text();
  const stripe = getStripeClient();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (error) {
    console.error('Stripe webhook signature verification failed:', error);
    return Response.json({ error: 'Invalid signature', status: 400 }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.client_reference_id || session.metadata?.userId;
        const customerId = typeof session.customer === 'string' ? session.customer : session.customer?.id;
        const subscriptionId = typeof session.subscription === 'string' ? session.subscription : session.subscription?.id;

        if (userId && customerId) {
          await prisma.user.update({
            where: { id: userId },
            data: { stripeCustomerId: customerId }
          });
        }

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId);
          await syncSubscription(subscription);
        }
        break;
      }
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        await syncSubscription(subscription);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error('Stripe webhook handling error:', error);
    return Response.json({ error: 'Webhook handler error', status: 500 }, { status: 500 });
  }

  return Response.json({ received: true, status: 200 });
}
