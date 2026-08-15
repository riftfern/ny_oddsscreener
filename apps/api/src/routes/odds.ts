import { Router, type Router as RouterType } from 'express';
import type { SportKey } from '@ny-sharp-edge/shared';
import { SPORTS } from '@ny-sharp-edge/shared';
import { fetchOddsResponse, fetchExchangeOddsResponse } from '../services/oddsApi.js';
import { requirePlan } from '../middleware/plan.js';

const router: RouterType = Router();

// GET /api/odds?sport=americanfootball_nfl
// Free-tier 15-minute delay only applies when auth is actually on.
// Until Clerk exists (REQUIRE_AUTH=false), everyone on this box gets live lines.
router.get('/', requirePlan('free'), async (req, res) => {
  const sport = (req.query.sport as SportKey) || SPORTS.NFL;

  const validSports = Object.values(SPORTS);
  if (!validSports.includes(sport)) {
    res.status(400).json({
      error: 'Invalid sport',
      validSports,
    });
    return;
  }

  try {
    const plan = (req as { resolvedPlan?: string }).resolvedPlan;
    const authOn = process.env.REQUIRE_AUTH === 'true';
    const data = await fetchOddsResponse(sport, {
      delayed: authOn && plan === 'free',
    });
    res.json(data);
  } catch (error) {
    console.error('Error fetching odds:', error);
    res.status(500).json({
      error: 'Failed to fetch odds',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// GET /api/odds/exchanges?sport=basketball_nba
router.get('/exchanges', requirePlan('pro'), async (req, res) => {
  const sport = (req.query.sport as SportKey) || SPORTS.NFL;

  const validSports = Object.values(SPORTS);
  if (!validSports.includes(sport)) {
    res.status(400).json({
      error: 'Invalid sport',
      validSports,
    });
    return;
  }

  try {
    const data = await fetchExchangeOddsResponse(sport);
    res.json(data);
  } catch (error) {
    console.error('Error fetching exchange odds:', error);
    res.status(500).json({
      error: 'Failed to fetch exchange odds',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
