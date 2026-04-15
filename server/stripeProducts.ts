// Stripe Products & Prices for Future AI Platform
// These map to Stripe Price IDs configured in the Stripe Dashboard

export const CREDIT_PACKS = [
  {
    id: "pack_starter",
    name: "Starter Pack",
    credits: 10000,
    priceUsd: 5,
    stripePriceId: process.env.STRIPE_PRICE_STARTER ?? null,
    isPopular: false,
  },
  {
    id: "pack_pro",
    name: "Pro Pack",
    credits: 50000,
    priceUsd: 20,
    stripePriceId: process.env.STRIPE_PRICE_PRO ?? null,
    isPopular: true,
  },
  {
    id: "pack_business",
    name: "Business Pack",
    credits: 150000,
    priceUsd: 50,
    stripePriceId: process.env.STRIPE_PRICE_BUSINESS ?? null,
    isPopular: false,
  },
  {
    id: "pack_enterprise",
    name: "Enterprise Pack",
    credits: 500000,
    priceUsd: 150,
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE ?? null,
    isPopular: false,
  },
] as const;

export const SUBSCRIPTION_PLANS = [
  {
    id: "plan_free",
    name: "Free",
    priceUsd: 0,
    monthlyCredits: 1000,
    stripePriceId: null,
    features: ["1,000 credits/month", "3 agents", "Basic models"],
  },
  {
    id: "plan_pro",
    name: "Pro",
    priceUsd: 29,
    monthlyCredits: 50000,
    stripePriceId: process.env.STRIPE_PRICE_PLAN_PRO ?? null,
    features: ["50,000 credits/month", "Unlimited agents", "All models", "API access"],
  },
  {
    id: "plan_business",
    name: "Business",
    priceUsd: 99,
    monthlyCredits: 250000,
    stripePriceId: process.env.STRIPE_PRICE_PLAN_BUSINESS ?? null,
    features: ["250,000 credits/month", "All models", "Priority support", "Teams"],
  },
] as const;

export type CreditPack = typeof CREDIT_PACKS[number];
export type SubscriptionPlan = typeof SUBSCRIPTION_PLANS[number];
