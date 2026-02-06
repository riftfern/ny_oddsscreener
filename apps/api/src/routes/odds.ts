import { Router, type Router as RouterType } from 'express';
import type { SportKey } from '@ny-sharp-edge/shared';
import { SPORTS } from '@ny-sharp-edge/shared';
import { fetchOddsResponse } from '../services/oddsApi.js';

const router: RouterType = Router();

// GET /api/odds?sport=americanfootball_nfl
router.get('/', async (req, res) => {
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
    const data = await fetchOddsResponse(sport);
    res.json(data);
  } catch (error) {
    console.error('Error fetching odds:', error);
    res.status(500).json({
      error: 'Failed to fetch odds',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
