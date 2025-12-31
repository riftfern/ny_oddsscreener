import { Router, type Router as RouterType } from 'express';
import type { SportKey } from '@ny-sharp-edge/shared';
import { SPORTS } from '@ny-sharp-edge/shared';
import { fetchOdds } from '../services/oddsApi.js';
import { getMockEvents } from '../services/mockData.js';

const router: RouterType = Router();

// GET /api/odds?sport=americanfootball_nfl&live=true
router.get('/', async (req, res) => {
  const sport = (req.query.sport as SportKey) || SPORTS.NFL;
  const useLive = req.query.live === 'true' && !!process.env.THE_ODDS_API_KEY;

  // Validate sport key
  const validSports = Object.values(SPORTS);
  if (!validSports.includes(sport)) {
    res.status(400).json({
      error: 'Invalid sport',
      validSports,
    });
    return;
  }

  try {
    let events;

    if (useLive) {
      events = await fetchOdds(sport);
    } else {
      console.log('Using mock data');
      events = getMockEvents(sport);
    }

    res.json({
      events,
      lastUpdated: new Date().toISOString(),
      source: useLive ? 'the-odds-api' : 'mock',
    });
  } catch (error) {
    console.error('Error fetching odds:', error);

    // Fallback to mock data on error
    const events = getMockEvents(sport);
    res.json({
      events,
      lastUpdated: new Date().toISOString(),
      source: 'mock (fallback)',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
