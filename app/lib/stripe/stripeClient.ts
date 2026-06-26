import Stripe from 'stripe';

let client: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export function getStripeClient(): Stripe {
  const apiKey = process.env.STRIPE_SECRET_KEY;
  if (!apiKey) {
    throw new Error('STRIPE_SECRET_KEY is not configured');
  }
  if (!client) {
    client = new Stripe(apiKey, { apiVersion: '2026-05-27.dahlia' });
  }
  return client;
}
