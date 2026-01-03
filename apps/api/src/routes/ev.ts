import { Router, type Router as RouterType } from 'express';
import { SPORTS, type SportKey } from '@ny-sharp-edge/shared';
import { fetchOdds } from '../services/oddsApi.js';
import { getMockEVOpportunities } from '../services/mockData.js';
import { findEVOpportunities } from '../services/evFinder.js';

const router: RouterType = Router();

// GET /api/ev?sport=all&minEV=1&live=true
router.get('/', async (req, res) => {
  const sportParam = req.query.sport as string || 'all';
  const minEV = parseFloat(req.query.minEV as string) || 1;
  const useLive = req.query.live === 'true' && !!process.env.THE_ODDS_API_KEY;

  try {
    // If not in live mode, use the guaranteed mock opportunities
    if (!useLive) {
      const opportunities = getMockEVOpportunities();
      return res.json({
        opportunities,
        count: opportunities.length,
        scannedEvents: 0, // Not applicable for direct mock data
        minEV,
        lastUpdated: new Date().toISOString(),
      });
    }

    // --- Live Mode Logic ---

    // Determine which sports to scan
    const sportsToScan: SportKey[] = sportParam === 'all'
      ? [SPORTS.NFL, SPORTS.NBA, SPORTS.NHL, SPORTS.MLB]
      : [sportParam as SportKey];

    // Fetch odds for all requested sports
    const allEvents = [];

    for (const sport of sportsToScan) {
      try {
        const events = await fetchOdds(sport);
        allEvents.push(...events);
      } catch (err) {
        // Continue with other sports if one fails
        console.error(`Failed to fetch ${sport}:`, err);
      }
    }


    // Find +EV opportunities
    const opportunities = findEVOpportunities(allEvents, { minEV });

    res.json({
      opportunities,
      count: opportunities.length,
      scannedEvents: allEvents.length,
      minEV,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error finding EV opportunities:', error);
    res.status(500).json({
      error: 'Failed to find EV opportunities',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
