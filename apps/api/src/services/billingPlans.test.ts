import { describe, it, expect } from 'vitest';
import {
  billingIsConfigured,
  clerkUserIdFromCheckout,
  clerkUserIdFromSubscription,
  planFromSubscription,
  stripeCustomerId,
} from './billingPlans.js';

const prices = { edge: 'price_edge', pro: 'price_pro' };

describe('planFromSubscription', () => {
  it('sets edge/pro while the sub is active', () => {
    expect(planFromSubscription('active', 'price_edge', prices)).toBe('edge');
    expect(planFromSubscription('trialing', 'price_pro', prices)).toBe('pro');
    expect(planFromSubscription('past_due', 'price_edge', prices)).toBe('edge');
  });

  it('cuts off to free on cancel, unpaid, expired, or paused', () => {
    expect(planFromSubscription('canceled', 'price_edge', prices)).toBe('free');
    expect(planFromSubscription('unpaid', 'price_pro', prices)).toBe('free');
    expect(planFromSubscription('incomplete_expired', 'price_edge', prices)).toBe('free');
    expect(planFromSubscription('paused', 'price_edge', prices)).toBe('free');
  });

  it('does not change plan on incomplete (first invoice still open)', () => {
    expect(planFromSubscription('incomplete', 'price_edge', prices)).toBeUndefined();
  });
});

describe('clerk user ids on Stripe objects', () => {
  it('prefers client_reference_id on checkout', () => {
    expect(
      clerkUserIdFromCheckout({
        client_reference_id: 'user_1',
        metadata: { clerkUserId: 'user_2' },
      })
    ).toBe('user_1');
  });

  it('reads clerkUserId off subscription metadata', () => {
    expect(clerkUserIdFromSubscription({ metadata: { clerkUserId: 'user_9' } })).toBe('user_9');
  });

  it('falls back to session metadata when client_reference_id is missing', () => {
    expect(
      clerkUserIdFromCheckout({
        client_reference_id: null,
        metadata: { clerkUserId: 'user_3' },
      })
    ).toBe('user_3');
  });

  it('reads a cus_ id from a string or expanded object', () => {
    expect(stripeCustomerId('cus_123')).toBe('cus_123');
    expect(stripeCustomerId({ id: 'cus_abc' })).toBe('cus_abc');
    expect(stripeCustomerId('sub_nope')).toBeUndefined();
  });
});

describe('billingIsConfigured', () => {
  it('requires secret, webhook, and both price ids', () => {
    expect(
      billingIsConfigured({
        STRIPE_SECRET_KEY: 'sk_test',
        STRIPE_WEBHOOK_SECRET: 'whsec',
        STRIPE_PRICE_EDGE: 'price_e',
        STRIPE_PRICE_PRO: 'price_p',
      })
    ).toBe(true);
    expect(
      billingIsConfigured({
        STRIPE_SECRET_KEY: 'sk_test',
        STRIPE_WEBHOOK_SECRET: '',
        STRIPE_PRICE_EDGE: 'price_e',
        STRIPE_PRICE_PRO: 'price_p',
      })
    ).toBe(false);
  });
});
