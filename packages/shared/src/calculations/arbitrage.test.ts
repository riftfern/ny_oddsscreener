import { describe, it, expect } from 'vitest';
import {
  detectArbitrage,
  calculateArbitrageStakes,
  findBestArbitrage,
  detectMiddle,
} from './arbitrage';

describe('detectArbitrage', () => {
  it('flags +120/+120 as an arb with profit', () => {
    const result = detectArbitrage(120, 120);
    expect(result.isArbitrage).toBe(true);
    expect(result.profitPercentage).toBeGreaterThan(0);
  });

  it('does not flag -110/-110 (book holds vig)', () => {
    const result = detectArbitrage(-110, -110);
    expect(result.isArbitrage).toBe(false);
    expect(result.profitPercentage).toBe(0);
  });
});

describe('calculateArbitrageStakes', () => {
  it('splits a $100 stake and guarantees profit for +120/+120', () => {
    const result = calculateArbitrageStakes(120, 120, 100);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.stake1 + result.stake2).toBeCloseTo(100, 1);
      expect(result.guaranteedProfit).toBeGreaterThan(0);
      expect(result.stake1).toBeGreaterThan(0);
      expect(result.stake2).toBeGreaterThan(0);
    }
  });

  it('returns null when there is no arb', () => {
    const result = calculateArbitrageStakes(-110, -110, 100);
    expect(result).toBeNull();
  });
});

describe('findBestArbitrage', () => {
  it('skips same-book pairs', () => {
    const outcome1 = [{ bookId: 'a', odds: 120 }];
    const outcome2 = [
      { bookId: 'a', odds: 120 }, // same book — must be skipped
      { bookId: 'b', odds: 150 }, // best true arb
    ];
    const result = findBestArbitrage(outcome1, outcome2);
    expect(result).not.toBeNull();
    if (result) {
      expect(result.book2).toBe('b');
      expect(result.book1).toBe('a');
      expect(result.profitPercentage).toBeGreaterThan(0);
    }
  });
});

describe('detectMiddle', () => {
  it('detects a 1-point middle on -3.5 vs -2.5', () => {
    const result = detectMiddle(-3.5, -2.5, -110, -110);
    expect(result.isMiddle).toBe(true);
    expect(result.middleWindow).toBe(1);
  });

  it('is not a middle when lines are equal', () => {
    const result = detectMiddle(-3.5, -3.5, -110, -110);
    expect(result.isMiddle).toBe(false);
    expect(result.middleWindow).toBe(0);
  });
});
