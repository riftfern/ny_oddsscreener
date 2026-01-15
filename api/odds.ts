import type { VercelRequest, VercelResponse } from '@vercel/node';
import type { SportKey } from './lib/types.js';
import { SPORTS } from './lib/types.js';
import { getMockEvents } from './lib/mockData.js';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const sport = (req.query.sport as SportKey) || SPORTS.NFL;

  // Validate sport key
  const validSports = Object.values(SPORTS);
  if (!validSports.includes(sport)) {
    return res.status(400).json({
      error: 'Invalid sport',
      validSports,
    });
  }

  try {
    const events = getMockEvents(sport);

    return res.status(200).json({
      events,
      lastUpdated: new Date().toISOString(),
      source: 'mock',
    });
  } catch (error) {
    console.error('Error fetching odds:', error);
    return res.status(500).json({
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
