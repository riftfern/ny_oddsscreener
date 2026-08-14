import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import billingRouter from './billing.js';

function createApp() {
  const app = express();
  app.post('/api/billing/webhook', express.raw({ type: 'application/json' }), billingRouter);
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
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('checkout returns 501 when Stripe is not configured', async () => {
    const app = createApp();
    const res = await supertest(app)
      .post('/api/billing/checkout')
      .send({ plan: 'edge' });
    expect(res.status).toBe(501);
    expect(res.body.error).toBe('billing_not_configured');
  });

  it('checkout rejects priceId and requires a plan', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    process.env.STRIPE_PRICE_EDGE = 'edge_plan_test';
    process.env.FRONTEND_URL = 'http://localhost:3000';
    const app = createApp();

    const priceIdRes = await supertest(app)
      .post('/api/billing/checkout')
      .send({ priceId: 'direct_id' });
    expect(priceIdRes.status).toBe(400);
    expect(priceIdRes.body.error).toBe('invalid_body');

    const missingRes = await supertest(app)
      .post('/api/billing/checkout')
      .send({});
    expect(missingRes.status).toBe(400);
    expect(missingRes.body.error).toBe('missing_plan');
  });

  it('checkout requires FRONTEND_URL when Origin is absent', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake';
    process.env.STRIPE_PRICE_EDGE = 'edge_plan_test';
    delete process.env.FRONTEND_URL;
    const app = createApp();

    const res = await supertest(app)
      .post('/api/billing/checkout')
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
});
