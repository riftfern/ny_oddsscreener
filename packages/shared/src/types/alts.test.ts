import { describe, it, expect } from 'vitest';
import { closestBuy, groupAltOutcomes, isBuyToward } from './alts';
import type { MarketOutcome } from './index';

const now = '2026-08-19T12:00:00Z';

function over(point: number, books: number): MarketOutcome {
  return {
    name: 'Over',
    point,
    bookOdds: Array.from({ length: books }, (_, i) => ({
      bookId: `book${i}`,
      odds: -110,
      line: point,
      updatedAt: now,
    })),
  };
}

describe('groupAltOutcomes', () => {
  it('picks the number with more shops as main', () => {
    const groups = groupAltOutcomes([over(8, 2), over(8.5, 5)]);
    expect(groups).toHaveLength(1);
    expect(groups[0].main.point).toBe(8.5);
    expect(groups[0].alts.map((a) => a.point)).toEqual([8]);
  });
});

describe('isBuyToward / closestBuy', () => {
  it('Over 8 is a buy vs Over 8.5', () => {
    expect(isBuyToward('totals', 'Over', 8.5, 8)).toBe(true);
    expect(isBuyToward('totals', 'Under', 8.5, 9)).toBe(true);
    expect(isBuyToward('spreads', 'Patriots', -3.5, -3)).toBe(true);
    const buy = closestBuy('totals', 'Over', 8.5, [over(8, 1), over(7, 1)]);
    expect(buy?.point).toBe(8);
  });
});
