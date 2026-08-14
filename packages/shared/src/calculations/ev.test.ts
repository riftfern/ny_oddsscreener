import { describe, it, expect } from 'vitest';
import {
  calculateNoVigOdds,
  calculateEV,
  kellyStake,
  kellyStakeAmerican,
} from './ev';

describe('calculateNoVigOdds', () => {
  it('removes vig for a -110/-110 market', () => {
    const result = calculateNoVigOdds(-110, -110);
    expect(result.fairProb1).toBeCloseTo(0.5, 3);
    expect(result.fairProb2).toBeCloseTo(0.5, 3);
    expect(result.vigPercentage).toBeCloseTo(4.76, 1);
    expect(result.hold).toBeCloseTo(0.0476, 3);
  });

  it('normalizes probs to sum 1 for +150/-170', () => {
    const result = calculateNoVigOdds(150, -170);
    expect(result.fairProb1 + result.fairProb2).toBeCloseTo(1, 5);
    expect(result.fairProb1).toBeGreaterThan(0);
    expect(result.fairProb1).toBeLessThan(1);
    expect(result.fairProb2).toBeGreaterThan(0);
    expect(result.fairProb2).toBeLessThan(1);
  });
});

describe('calculateEV', () => {
  it('is positive when fair prob beats the implied price (-110 @ 0.55)', () => {
    const result = calculateEV(-110, 0.55);
    expect(result.ev).toBeGreaterThan(0);
    expect(result.isPositiveEV).toBe(true);
  });

  it('is negative when fair prob is at the implied price (-110 @ 0.50)', () => {
    const result = calculateEV(-110, 0.5);
    expect(result.ev).toBeLessThan(0);
    expect(result.isPositiveEV).toBe(false);
  });
});

describe('kellyStake', () => {
  it('recommends a positive stake below the bankroll (0.55 @ 2.0, full Kelly)', () => {
    const stake = kellyStake(0.55, 2.0, 1000, 1);
    expect(stake).toBeGreaterThan(0);
    expect(stake).toBeLessThan(1000);
  });

  it('bets 0 when there is no edge (0.40 @ 1.5, quarter Kelly)', () => {
    const stake = kellyStake(0.40, 1.5, 1000, 0.25);
    expect(stake).toBe(0);
  });
});

describe('kellyStakeAmerican', () => {
  it('converts american odds to decimal before Kelly', () => {
    // +100 = 2.0 decimal
    const viaAmerican = kellyStakeAmerican(0.55, 100, 1000, 1);
    const viaDecimal = kellyStake(0.55, 2.0, 1000, 1);
    expect(viaAmerican).toBe(viaDecimal);
    expect(viaAmerican).toBeGreaterThan(0);
  });
});
