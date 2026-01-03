import { Router, type Router as RouterType } from 'express';
import { SPORTS, type SportKey } from '@ny-sharp-edge/shared';
import { fetchOdds } from '../services/oddsApi.js';
import { getMockArbitrageOpportunities } from '../services/mockData.js';
import { findArbitrageOpportunities } from '../services/arbFinder.js';

const router: RouterType = Router();

// GET /api/arbitrage?sport=all&minProfit=0.1&totalStake=100&live=true
router.get('/', async (req, res) => {
  const sportParam = req.query.sport as string || 'all';
  const minProfit = parseFloat(req.query.minProfit as string) || 0.1;
  const totalStake = parseFloat(req.query.totalStake as string) || 100;
  const useLive = req.query.live === 'true' && !!process.env.THE_ODDS_API_KEY;

  try {
    // If not in live mode, use the guaranteed mock opportunities
    if (!useLive) {
      const opportunities = getMockArbitrageOpportunities();
      return res.json({
        opportunities,
        count: opportunities.length,
        scannedEvents: 0, // Not applicable for direct mock data
        minProfit,
        totalStake,
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


    // Find arbitrage opportunities
    const opportunities = findArbitrageOpportunities(allEvents, { minProfit, totalStake });

    res.json({
      opportunities,
      count: opportunities.length,
      scannedEvents: allEvents.length,
      minProfit,
      totalStake,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error finding arbitrage opportunities:', error);
    res.status(500).json({
      error: 'Failed to find arbitrage opportunities',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
