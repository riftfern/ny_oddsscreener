import type { Request, Response, NextFunction } from 'express';
import { verifyToken, createClerkClient } from '@clerk/backend';

export type Plan = 'free' | 'edge' | 'pro';

interface PlanRequest extends Request {
  resolvedPlan?: Plan;
}

const PLAN_RANK: Record<Plan, number> = {
  free: 0,
  edge: 1,
  pro: 2,
};

function isValidPlan(value: unknown): value is Plan {
  return value === 'free' || value === 'edge' || value === 'pro';
}

export async function resolvePlan(req: PlanRequest): Promise<Plan> {
  if (process.env.REQUIRE_AUTH !== 'true') {
    const devPlan = process.env.DEV_PLAN;
    return isValidPlan(devPlan) ? devPlan : 'pro';
  }

  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    return 'free';
  }

  const token = authHeader.slice(7);
  const secretKey = process.env.CLERK_SECRET_KEY;
  if (!secretKey) {
    return 'free';
  }

  try {
    const { sub } = await verifyToken(token, { secretKey });
    if (!sub) return 'free';

    const clerk = createClerkClient({ secretKey });
    const user = await clerk.users.getUser(sub);
    return isValidPlan(user.publicMetadata?.plan) ? user.publicMetadata.plan : 'free';
  } catch (err) {
    console.error('resolvePlan token verification failed:', err);
    return 'free';
  }
}

export function requirePlan(requiredPlan: Plan) {
  return async (req: PlanRequest, res: Response, next: NextFunction): Promise<void> => {
    // Mock-data demos stay open for the public landing screenshot and local development.
    if (process.env.USE_MOCK_DATA === 'true' && requiredPlan === 'edge') {
      req.resolvedPlan = await resolvePlan(req);
      next();
      return;
    }

    const plan = await resolvePlan(req);
    req.resolvedPlan = plan;

    if (PLAN_RANK[plan] < PLAN_RANK[requiredPlan]) {
      res.status(402).json({ error: 'upgrade', requiredPlan });
      return;
    }

    next();
  };
}
