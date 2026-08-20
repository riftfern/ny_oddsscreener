import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import { verifyToken } from '@clerk/backend';
import billingRouter, { handleStripeWebhook } from './billing.js';

vi.mock('@clerk/backend', async () => {
  const actual = await vi.importActual<typeof import('@clerk/backend')>('@clerk/backend');
  return {
    ...actual,
    verifyToken: vi.fn(),
    createClerkClient: vi.fn(),
  };
});

function createApp() {
  const app = express();
  app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), handleStripeWebhook);
  app.use(express.json());
  app.use('/api/billing', billingRouter);
  return app;
}

describe('billing routes', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.REQUIRE_AUTH = 'false';
    process.env.STRIPE_SECRET_KEY = '';
    process.env.STRIPE_WEBHOOK_SECRET = '';
    process.env.STRIPE_PRICE_EDGE = '';
    process.env.STRIPE_PRICE_PRO = '';
    vi.mocked(verifyToken).mockReset();
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('GET /status reports when Stripe is not configured', async () => {
    const app = createApp();
    const res = await supertest(app).get('/api/billing/status');
    expect(res.status).toBe(200);
    expect(res.body.configured).toBe(false);
    expect(res.body.authRequired).toBe(false);
  });

  it('GET /status reports configured when secret, webhook, and prices exist', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_fake';
    process.env.STRIPE_PRICE_EDGE = 'price_edge';
    process.env.STRIPE_PRICE_PRO = 'price_pro';
    process.env.REQUIRE_AUTH = 'true';
    const app = createApp();
    const res = await supertest(app).get('/api/billing/status');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ configured: true, authRequired: true });
  });

  it('checkout returns 501 when Stripe is not configured', async () => {
    const app = createApp();
    const res = await supertest(app)
      .post('/api/billing/checkout')
      .send({ plan: 'edge' });
    expect(res.status).toBe(501);
    expect(res.body.error).toBe('billing_not_configured');
  });

  it('checkout requires a signed-in Clerk user', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    process.env.STRIPE_PRICE_EDGE = 'price_edge';
    const app = createApp();
    const res = await supertest(app)
      .post('/api/billing/checkout')
      .send({ plan: 'edge' });
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('unauthenticated');
  });

  it('checkout rejects priceId and requires a plan', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    process.env.STRIPE_PRICE_EDGE = 'edge_plan_test';
    process.env.CLERK_SECRET_KEY = 'sk_test_clerk';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    vi.mocked(verifyToken).mockResolvedValue({ sub: 'user_test' } as Awaited<ReturnType<typeof verifyToken>>);
    const app = createApp();

    const priceIdRes = await supertest(app)
      .post('/api/billing/checkout')
      .set('Authorization', 'Bearer fake')
      .send({ priceId: 'direct_id' });
    expect(priceIdRes.status).toBe(400);
    expect(priceIdRes.body.error).toBe('invalid_body');

    const missingRes = await supertest(app)
      .post('/api/billing/checkout')
      .set('Authorization', 'Bearer fake')
      .send({});
    expect(missingRes.status).toBe(400);
    expect(missingRes.body.error).toBe('missing_plan');

    const freeRes = await supertest(app)
      .post('/api/billing/checkout')
      .set('Authorization', 'Bearer fake')
      .send({ plan: 'free' });
    expect(freeRes.status).toBe(400);
    expect(freeRes.body.error).toBe('missing_plan');
  });

  it('checkout requires FRONTEND_URL when Origin is absent', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    process.env.STRIPE_PRICE_EDGE = 'edge_plan_test';
    process.env.CLERK_SECRET_KEY = 'sk_test_clerk';
    delete process.env.FRONTEND_URL;
    vi.mocked(verifyToken).mockResolvedValue({ sub: 'user_test' } as Awaited<ReturnType<typeof verifyToken>>);
    const app = createApp();

    const res = await supertest(app)
      .post('/api/billing/checkout')
      .set('Authorization', 'Bearer fake')
      .send({ plan: 'edge' });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('missing_frontend_url');
  });

  it('webhook returns 400 for a garbage signature', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_fake';
    const app = createApp();
    const res = await supertest(app)
      .post('/api/billing/webhook')
      .set('stripe-signature', 'garbage')
      .set('Content-Type', 'application/json')
      .send('{}');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('invalid_signature');
  });

  it('portal requires a signed-in user', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    const app = createApp();
    const res = await supertest(app).post('/api/billing/portal');
    expect(res.status).toBe(401);
    expect(res.body.error).toBe('unauthenticated');
  });
});
