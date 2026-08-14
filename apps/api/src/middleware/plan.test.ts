import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import { requirePlan } from './plan.js';

function createApp(requiredPlan: 'edge' | 'pro') {
  const app = express();
  app.use(express.json());
  app.get('/test', requirePlan(requiredPlan), (_req, res) => {
    res.json({ ok: true });
  });
  return app;
}

describe('requirePlan middleware', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    process.env.REQUIRE_AUTH = 'true';
    process.env.DEV_PLAN = 'pro';
    process.env.CLERK_SECRET_KEY = '';
    process.env.USE_MOCK_DATA = 'false';
  });

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('returns 402 when no auth and edge is required', async () => {
    const app = createApp('edge');
    const res = await supertest(app).get('/test');
    expect(res.status).toBe(402);
    expect(res.body).toEqual({ error: 'upgrade', requiredPlan: 'edge' });
  });

  it('returns 402 when DEV_PLAN=edge and pro is required', async () => {
    process.env.REQUIRE_AUTH = 'false';
    process.env.DEV_PLAN = 'edge';
    const app = createApp('pro');
    const res = await supertest(app).get('/test');
    expect(res.status).toBe(402);
    expect(res.body).toEqual({ error: 'upgrade', requiredPlan: 'pro' });
  });

  it('allows the request when DEV_PLAN=pro and pro is required', async () => {
    process.env.REQUIRE_AUTH = 'false';
    process.env.DEV_PLAN = 'pro';
    const app = createApp('pro');
    const res = await supertest(app).get('/test');
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ ok: true });
  });

  it('allows edge endpoints when USE_MOCK_DATA=true regardless of plan', async () => {
    process.env.REQUIRE_AUTH = 'true';
    process.env.USE_MOCK_DATA = 'true';
    const app = createApp('edge');
    const res = await supertest(app).get('/test');
    expect(res.status).toBe(200);
  });
});
