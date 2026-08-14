import { describe, it, expect } from 'vitest';
import {
  americanToDecimal,
  decimalToAmerican,
  americanToImplied,
  impliedToAmerican,
  decimalToImplied,
} from './odds';

describe('americanToDecimal', () => {
  it('converts -110 to ~1.909', () => {
    expect(americanToDecimal(-110)).toBeCloseTo(1.909, 3);
  });

  it('converts +150 to 2.5', () => {
    expect(americanToDecimal(150)).toBeCloseTo(2.5, 3);
  });
});

describe('decimalToAmerican', () => {
  it('converts 1.909 back to -110', () => {
    expect(decimalToAmerican(1.909)).toBe(-110);
  });

  it('converts 2.5 to +150', () => {
    expect(decimalToAmerican(2.5)).toBe(150);
  });
});

describe('americanToImplied', () => {
  it('converts -110 to ~0.5238', () => {
    expect(americanToImplied(-110)).toBeCloseTo(0.5238, 3);
  });
});

describe('impliedToAmerican', () => {
  it('converts ~0.5238 back to -110', () => {
    expect(impliedToAmerican(0.5238)).toBe(-110);
  });
});

describe('round-trip', () => {
  const cases = [-110, -150, -105, 100, 120, 150, 200, 300, -300];

  it.each(cases)('american -> decimal -> american stays in a 1-cent band for %d', (american) => {
    const roundTripped = decimalToAmerican(americanToDecimal(american));
    expect(Math.abs(roundTripped - american)).toBeLessThanOrEqual(1);
  });

  it('decimalToImplied matches 1/decimal', () => {
    expect(decimalToImplied(2.5)).toBeCloseTo(0.4, 5);
  });
});
