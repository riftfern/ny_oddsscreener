import { describe, it, expect } from 'vitest';
import { gammaEventsToNative } from './polymarket';

describe('gammaEventsToNative', () => {
  it('parses double-encoded outcomes and prices', () => {
    const markets = gammaEventsToNative([
      {
        id: '99',
        title: 'Lakers vs Knicks',
        startDate: '2099-01-01T00:00:00Z',
        markets: [
          {
            question: 'Will the Lakers beat the Knicks?',
            outcomes: '["Lakers","Knicks"]',
            outcomePrices: '["0.60","0.40"]',
          },
        ],
      },
    ]);
    expect(markets).toHaveLength(1);
    expect(markets[0].venue).toBe('polymarket');
    expect(markets[0].yesName).toBe('Lakers');
    expect(markets[0].yesAmerican).toBeLessThan(0);
    expect(markets[0].noAmerican).toBeGreaterThan(0);
  });
});
