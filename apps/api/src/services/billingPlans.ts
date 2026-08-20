export type Plan = 'free' | 'edge' | 'pro';

export function isValidPlan(value: unknown): value is Plan {
  return value === 'free' || value === 'edge' || value === 'pro';
}

const CUTOFF = new Set(['canceled', 'unpaid', 'incomplete_expired', 'paused']);
const KEEP = new Set(['active', 'trialing', 'past_due']);

export function planFromPriceId(
  priceId: string | undefined,
  prices: { edge?: string; pro?: string }
): Plan | undefined {
  if (!priceId) return undefined;
  if (prices.edge && priceId === prices.edge) return 'edge';
  if (prices.pro && priceId === prices.pro) return 'pro';
  return undefined;
}

/** Map a Stripe subscription to the Clerk plan we should store. */
export function planFromSubscription(
  status: string,
  priceId: string | undefined,
  prices: { edge?: string; pro?: string }
): Plan | undefined {
  if (CUTOFF.has(status)) return 'free';
  if (KEEP.has(status)) return planFromPriceId(priceId, prices);
  return undefined;
}

export function clerkUserIdFromCheckout(session: {
  client_reference_id?: string | null;
  metadata?: Record<string, string> | null;
}): string | undefined {
  return session.client_reference_id || session.metadata?.clerkUserId || undefined;
}

export function clerkUserIdFromSubscription(sub: {
  metadata?: Record<string, string> | null;
}): string | undefined {
  return sub.metadata?.clerkUserId || undefined;
}

export function billingIsConfigured(env: {
  [key: string]: string | undefined;
}): boolean {
  return Boolean(
    env.STRIPE_SECRET_KEY &&
      env.STRIPE_WEBHOOK_SECRET &&
      env.STRIPE_PRICE_EDGE &&
      env.STRIPE_PRICE_PRO
  );
}

export function stripeCustomerId(
  customer: string | { id?: string } | null | undefined
): string | undefined {
  if (typeof customer === 'string' && customer.startsWith('cus_')) return customer;
  if (customer && typeof customer === 'object' && typeof customer.id === 'string' && customer.id.startsWith('cus_')) {
    return customer.id;
  }
  return undefined;
}
