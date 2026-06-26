export type SubscriptionTier = 'FREE' | 'PREMIUM';

export interface PlanDefinition {
  tier: SubscriptionTier;
  name: string;
  priceId: string | null;
  displayPrice: string;
  features: string[];
}

export const FREE_PLAN: PlanDefinition = {
  tier: 'FREE',
  name: 'Free',
  priceId: null,
  displayPrice: '€0/month',
  features: [
    'Crop rotation planning',
    'Soil test tracking',
    'Harvest & financial tracking',
    'Limited daily AI assistant usage'
  ]
};

export const PREMIUM_PLAN: PlanDefinition = {
  tier: 'PREMIUM',
  name: 'Premium',
  priceId: process.env.STRIPE_PREMIUM_PRICE_ID || null,
  displayPrice: '€9.99/month',
  features: [
    'Everything in Free',
    'Much higher daily AI assistant limits',
    'AI Crop Lookup, Agronomist Notes, Rotation Health Advisor & Pest Diagnosis',
    'Priority access during peak usage'
  ]
};

export function isPremiumCheckoutConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY && PREMIUM_PLAN.priceId);
}

export function isBillingPortalConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}
