import { describe, it, expect } from 'vitest';
import { VENUES, SPORTSBOOKS } from './index';

describe('VENUES catalog', () => {
  it('contains every key in SPORTSBOOKS', () => {
    for (const bookId of Object.values(SPORTSBOOKS)) {
      expect(VENUES[bookId]).toBeDefined();
    }
  });

  it('marks pinnacle as sharp', () => {
    expect(VENUES['pinnacle'].isSharp).toBe(true);
  });

  it('classifies kalshi and polymarket as prediction markets', () => {
    expect(VENUES['kalshi'].kind).toBe('prediction');
    expect(VENUES['polymarket'].kind).toBe('prediction');
  });

  it('classifies retail books as sportsbook venues', () => {
    for (const bookId of Object.values(SPORTSBOOKS)) {
      expect(VENUES[bookId].kind).toBe('sportsbook');
    }
  });
});
