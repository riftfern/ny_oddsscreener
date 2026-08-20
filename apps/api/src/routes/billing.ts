import { Router, type Router as RouterType, type Request, type Response } from 'express';
import Stripe from 'stripe';
import { createClerkClient, verifyToken } from '@clerk/backend';
import {
  billingIsConfigured,
  clerkUserIdFromCheckout,
  clerkUserIdFromSubscription,
  isValidPlan,
  planFromSubscription,
  stripeCustomerId,
  type Plan,
} from '../services/billingPlans.js';

const router: RouterType = Router();

function stripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

function priceIds() {
  return { edge: process.env.STRIPE_PRICE_EDGE, pro: process.env.STRIPE_PRICE_PRO };
}

function priceIdForPlan(plan: Plan | undefined): string | undefined {
  if (plan === 'edge') return process.env.STRIPE_PRICE_EDGE;
  if (plan === 'pro') return process.env.STRIPE_PRICE_PRO;
  return undefined;
}

function clerkSecret(): string | undefined {
  return process.env.CLERK_SECRET_KEY || undefined;
}

async function resolveUserId(req: Request): Promise<string | null> {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const secretKey = clerkSecret();
  if (!secretKey) return null;
  try {
    const { sub } = await verifyToken(authHeader.slice(7), { secretKey });
    return sub ?? null;
  } catch (err) {
    console.error('Clerk token verification failed:', err);
    return null;
  }
}

async function writeClerkPlan(
  userId: string,
  plan: Plan,
  extra: Record<string, unknown> = {}
): Promise<void> {
  const secret = clerkSecret();
  if (!secret) {
    console.log(`Would set Clerk ${userId} → ${plan} (no CLERK_SECRET_KEY)`);
    return;
  }
  const clerk = createClerkClient({ secretKey: secret });
  const user = await clerk.users.getUser(userId);
  await clerk.users.updateUser(userId, {
    publicMetadata: {
      ...user.publicMetadata,
      plan,
      ...extra,
    },
  });
  console.log(`Updated Clerk user ${userId} plan to ${plan}`);
}

function billingNotConfigured(res: Response): void {
  res.status(501).json({ error: 'billing_not_configured', message: 'Stripe is not configured' });
}

function clerkEmail(user: {
  primaryEmailAddressId?: string | null;
  emailAddresses?: Array<{ id?: string; emailAddress?: string }>;
}): string | undefined {
  const emails = user.emailAddresses ?? [];
  const primary = emails.find((e) => e.id && e.id === user.primaryEmailAddressId);
  return primary?.emailAddress || emails[0]?.emailAddress || undefined;
}

// GET /api/billing/status — landing uses this to show Start with Edge vs Open the board.
router.get('/status', (_req, res) => {
  res.json({
    configured: billingIsConfigured(process.env),
    authRequired: process.env.REQUIRE_AUTH === 'true',
  });
});

// POST /api/billing/checkout
// Body: { plan: 'edge' | 'pro' }
router.post('/checkout', async (req, res) => {
  const stripe = stripeClient();
  if (!stripe) {
    billingNotConfigured(res);
    return;
  }

  const userId = await resolveUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'unauthenticated', message: 'Sign in to subscribe' });
    return;
  }

  if (typeof req.body.priceId === 'string') {
    res.status(400).json({ error: 'invalid_body', message: 'Use { plan: "edge" | "pro" }' });
    return;
  }

  if (!isValidPlan(req.body.plan) || req.body.plan === 'free') {
    res.status(400).json({ error: 'missing_plan', message: 'Provide a valid plan ("edge" or "pro")' });
    return;
  }

  const plan = req.body.plan as Exclude<Plan, 'free'>;
  const priceId = priceIdForPlan(plan);

  if (!priceId) {
    res.status(400).json({ error: 'missing_price', message: `Stripe price for ${plan} is not configured` });
    return;
  }

  const frontendUrl = process.env.FRONTEND_URL || (req.headers.origin as string | undefined);
  if (!frontendUrl) {
    res.status(400).json({ error: 'missing_frontend_url', message: 'FRONTEND_URL is not configured' });
    return;
  }

  try {
    let existingCustomer: string | undefined;
    let customerEmail: string | undefined;
    const secret = clerkSecret();
    if (secret) {
      const clerk = createClerkClient({ secretKey: secret });
      const user = await clerk.users.getUser(userId);
      existingCustomer = stripeCustomerId(
        typeof user.publicMetadata?.stripeCustomerId === 'string'
          ? user.publicMetadata.stripeCustomerId
          : undefined
      );
      customerEmail = clerkEmail(user);
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/app?checkout=success`,
      cancel_url: `${frontendUrl}/`,
      client_reference_id: userId,
      ...(existingCustomer
        ? { customer: existingCustomer }
        : customerEmail
          ? { customer_email: customerEmail }
          : {}),
      metadata: { plan, clerkUserId: userId },
      subscription_data: {
        metadata: { plan, clerkUserId: userId },
      },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: 'checkout_failed', message: 'Failed to create checkout session' });
  }
});

async function applySubscriptionPlan(
  subscription: Stripe.Subscription,
  statusOverride?: string
): Promise<void> {
  const priceId = subscription.items.data[0]?.price?.id;
  const status = statusOverride ?? subscription.status;
  const plan = planFromSubscription(status, priceId, priceIds());
  const userId = clerkUserIdFromSubscription(subscription);
  const customerId = stripeCustomerId(subscription.customer);
  if (plan && userId) {
    await writeClerkPlan(userId, plan, customerId ? { stripeCustomerId: customerId } : {});
  } else if (plan && !userId) {
    console.warn('Stripe subscription event had no clerkUserId on subscription metadata');
  }
}

/**
 * Stripe webhook. Must be mounted with express.raw({ type: 'application/json' })
 * BEFORE express.json(), at POST /api/billing/webhook.
 */
export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  const stripe = stripeClient();
  if (!stripe) {
    res.status(501).json({ error: 'billing_not_configured' });
    return;
  }

  const signature = req.headers['stripe-signature'] as string | undefined;
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signature || !secret) {
    res.status(400).json({ error: 'missing_signature' });
    return;
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(req.body, signature, secret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err);
    res.status(400).json({ error: 'invalid_signature' });
    return;
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.payment_status !== 'paid' && session.payment_status !== 'no_payment_required') {
        res.json({ received: true, skipped: 'unpaid' });
        return;
      }
      const plan = isValidPlan(session.metadata?.plan) ? session.metadata.plan : undefined;
      const userId = clerkUserIdFromCheckout(session);
      const customerId = stripeCustomerId(session.customer);
      if (plan && plan !== 'free' && userId) {
        await writeClerkPlan(userId, plan, customerId ? { stripeCustomerId: customerId } : {});
      } else if (!userId) {
        console.warn('checkout.session.completed had no clerkUserId / client_reference_id');
      }
    } else if (
      event.type === 'customer.subscription.updated' ||
      event.type === 'customer.subscription.deleted'
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const status = event.type === 'customer.subscription.deleted' ? 'canceled' : subscription.status;
      await applySubscriptionPlan(subscription, status);
    }
  } catch (err) {
    console.error('Stripe webhook handler failed:', err);
    res.status(500).json({ error: 'webhook_handler_failed' });
    return;
  }

  res.json({ received: true });
}

// POST /api/billing/portal
router.post('/portal', async (req, res) => {
  const stripe = stripeClient();
  if (!stripe) {
    billingNotConfigured(res);
    return;
  }

  const userId = await resolveUserId(req);
  if (!userId) {
    res.status(401).json({ error: 'unauthenticated', message: 'Sign in to manage billing' });
    return;
  }

  const secret = clerkSecret();
  if (!secret) {
    res.status(501).json({ error: 'clerk_not_configured' });
    return;
  }

  const frontendUrl = process.env.FRONTEND_URL || (req.headers.origin as string | undefined);
  if (!frontendUrl) {
    res.status(400).json({ error: 'missing_frontend_url' });
    return;
  }

  try {
    const clerk = createClerkClient({ secretKey: secret });
    const user = await clerk.users.getUser(userId);
    const customerId = stripeCustomerId(
      typeof user.publicMetadata?.stripeCustomerId === 'string'
        ? user.publicMetadata.stripeCustomerId
        : undefined
    );
    if (!customerId) {
      res.status(400).json({ error: 'no_customer', message: 'No Stripe customer on this account yet' });
      return;
    }
    const session = await stripe.billingPortal.sessions.create({
      customer: customerId,
      return_url: `${frontendUrl}/app/settings`,
    });
    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe portal error:', err);
    res.status(500).json({ error: 'portal_failed' });
  }
});

export default router;
