import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getMockEVOpportunities } from './lib/mockData.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const minEV = parseFloat(req.query.minEV as string) || 1;

  try {
    let opportunities = getMockEVOpportunities();

    // Filter by minimum EV
    opportunities = opportunities.filter((opp) => opp.evPercentage >= minEV);

    // Sort by EV percentage descending
    opportunities.sort((a, b) => b.evPercentage - a.evPercentage);

    return res.status(200).json({
      opportunities,
      count: opportunities.length,
      scannedEvents: 20,
      minEV,
      lastUpdated: new Date().toISOString(),
      source: 'mock',
    });
  } catch (error) {
    console.error('Error finding EV opportunities:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
