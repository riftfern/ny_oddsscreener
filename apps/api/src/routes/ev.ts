import { Router, type Router as RouterType } from 'express';
import { fetchEVResponse } from '../services/oddsApi.js';

const router: RouterType = Router();

// GET /api/ev?sport=all&minEV=1
router.get('/', async (req, res) => {
  const sport = (req.query.sport as string) || 'all';
  const minEV = parseFloat(req.query.minEV as string) || 1;

  try {
    const data = await fetchEVResponse({ sport, minEV });
    res.json(data);
  } catch (error) {
    console.error('Error finding EV opportunities:', error);
    res.status(500).json({
      error: 'Failed to find EV opportunities',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;
