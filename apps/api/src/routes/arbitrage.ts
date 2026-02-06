import { Router, type Router as RouterType } from 'express';
import { fetchArbitrageResponse } from '../services/oddsApi.js';

const router: RouterType = Router();

// GET /api/arbitrage?sport=all&minProfit=0.1&totalStake=100
router.get('/', async (req, res) => {
  const sport = (req.query.sport as string) || 'all';
  const minProfit = parseFloat(req.query.minProfit as string) || 0.1;
  const totalStake = parseFloat(req.query.totalStake as string) || 100;

  try {
    const data = await fetchArbitrageResponse({ sport, minProfit, totalStake });
    res.json(data);
  } catch (error) {
    console.error('Error finding arbitrage opportunities:', error);
    res.status(500).json({
      error: 'Failed to find arbitrage opportunities',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
