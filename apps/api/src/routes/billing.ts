import { Router, type Router as RouterType, type Request, type Response } from 'express';
import Stripe from 'stripe';
import { createClerkClient, verifyToken } from '@clerk/backend';

const router: RouterType = Router();

type Plan = 'free' | 'edge' | 'pro';

function requireAuth(): boolean {
  return process.env.REQUIRE_AUTH === 'true';
}

function useMockData(): boolean {
  return process.env.USE_MOCK_DATA === 'true';
}

function stripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  return new Stripe(key);
}

function priceIdForPlan(plan: Plan | undefined): string | undefined {
  if (plan === 'edge') return process.env.STRIPE_PRICE_EDGE;
  if (plan === 'pro') return process.env.STRIPE_PRICE_PRO;
  return undefined;
}

function isValidPlan(value: unknown): value is Plan {
  return value === 'free' || value === 'edge' || value === 'pro';
}

async function resolveUserId(req: Request): Promise<string | null> {
  if (!requireAuth()) return null;
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) return null;
  const token = authHeader.slice(7);
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) return null;
  try {
    const { sub } = await verifyToken(token, { secretKey });
    return sub ?? null;
  } catch (err) {
    console.error('Clerk token verification failed:', err);
    return null;
  }
}

function billingNotConfigured(res: Response): void {
  res.status(501).json({ error: 'billing_not_configured', message: 'Stripe is not configured' });
}

// POST /api/billing/checkout
// Body: { plan: 'edge' | 'pro' }
router.post('/checkout', async (req, res) => {
  const stripe = stripeClient();
  if (!stripe) {
    billingNotConfigured(res);
    return;
  }

  const userId = await resolveUserId(req);
  if (requireAuth() && !userId) {
    res.status(401).json({ error: 'unauthenticated' });
    return;
  }

  if (typeof req.body.priceId === 'string') {
    res.status(400).json({ error: 'invalid_body', message: 'Use { plan: "edge" | "pro" }' });
    return;
  }

  if (!isValidPlan(req.body.plan)) {
    res.status(400).json({ error: 'missing_plan', message: 'Provide a valid plan ("edge" or "pro")' });
    return;
  }

  const plan = req.body.plan;
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
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${frontendUrl}/app?checkout=success`,
      cancel_url: `${frontendUrl}/`,
      client_reference_id: userId ?? undefined,
      metadata: { plan },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: 'checkout_failed', message: 'Failed to create checkout session' });
  }
});

// POST /api/billing/webhook
// Must be mounted with express.raw({ type: 'application/json' }) BEFORE express.json().
router.post('/webhook', async (req, res) => {
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

  let plan: Plan | undefined;
  let userId: string | undefined;

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    plan = isValidPlan(session.metadata?.plan) ? session.metadata.plan : undefined;
    userId = session.client_reference_id ?? undefined;
  } else if (event.type === 'customer.subscription.updated') {
    const subscription = event.data.object as Stripe.Subscription;
    const price = subscription.items.data[0]?.price;
    if (price?.id === process.env.STRIPE_PRICE_EDGE) plan = 'edge';
    if (price?.id === process.env.STRIPE_PRICE_PRO) plan = 'pro';
    // Subscription events don't carry the Clerk user id directly in v1;
    // we rely on checkout.session.completed to set the initial plan.
  }

  const clerkSecret = process.env.CLERK_SECRET_KEY;
  if (plan && userId && clerkSecret) {
    try {
      const clerk = createClerkClient({ secretKey: clerkSecret });
      await clerk.users.updateUser(userId, { publicMetadata: { plan } });
      console.log(`Updated Clerk user ${userId} plan to ${plan}`);
    } catch (err) {
      console.error('Failed to update Clerk user plan:', err);
    }
  } else if (plan && userId && !clerkSecret) {
    console.log(`Webhook verified for user ${userId} → ${plan}, but Clerk is not configured`);
  }

  res.json({ received: true });
});

// POST /api/billing/portal
router.post('/portal', async (req, res) => {
  const stripe = stripeClient();
  if (!stripe) {
    billingNotConfigured(res);
    return;
  }

  const userId = await resolveUserId(req);
  if (requireAuth() && !userId) {
    res.status(401).json({ error: 'unauthenticated' });
    return;
  }

  // In a real flow we would store the Stripe customer id per Clerk user.
  // For v1 the portal is created without a customer when unconfigured.
  res.status(501).json({ error: 'portal_not_implemented', message: 'Customer portal requires stored Stripe customer ids' });
});

export default router;
