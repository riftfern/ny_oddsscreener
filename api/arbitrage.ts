import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMockArbitrageOpportunities } from './lib/mockData.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const minProfit = parseFloat(req.query.minProfit as string) || 0.1;
  const totalStake = parseFloat(req.query.totalStake as string) || 100;

  try {
    let opportunities = getMockArbitrageOpportunities();

    // Filter by minimum profit
    opportunities = opportunities.filter((opp) => opp.profitPercentage >= minProfit);

    // Scale stakes based on totalStake parameter
    opportunities = opportunities.map((opp) => ({
      ...opp,
      totalStake,
      guaranteedProfit: (opp.profitPercentage / 100) * totalStake,
      legs: opp.legs.map((leg) => ({
        ...leg,
        suggestedStake: leg.stakeRatio * totalStake,
      })),
    }));

    // Sort by profit percentage descending
    opportunities.sort((a, b) => b.profitPercentage - a.profitPercentage);

    return res.status(200).json({
      opportunities,
      count: opportunities.length,
      scannedEvents: 20,
      minProfit,
      totalStake,
      lastUpdated: new Date().toISOString(),
      source: 'mock',
    });
  } catch (error) {
    console.error('Error finding arbitrage opportunities:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
