import { describe, it, expect } from 'vitest';
import { kalshiMarketsToNative } from './kalshi';

describe('kalshiMarketsToNative', () => {
  it('converts yes mid cents to American odds', () => {
    const markets = kalshiMarketsToNative([
      {
        ticker: 'KXNBAGAME-LAKERS',
        title: 'Lakers vs Knicks Winner',
        status: 'open',
        yes_bid: 58,
        yes_ask: 62,
      },
    ]);
    expect(markets).toHaveLength(1);
    expect(markets[0].venue).toBe('kalshi');
    expect(markets[0].yesAmerican).toBeLessThan(0);
    expect(markets[0].noAmerican).toBeGreaterThan(0);
  });
});
