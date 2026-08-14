import { describe, it, expect } from 'vitest';
import { pickSharpOdds } from './fairLine';

describe('pickSharpOdds', () => {
  it('prefers pinnacle over a soft book like FanDuel', () => {
    const odds = [
      { bookId: 'fanduel', odds: -110 },
      { bookId: 'pinnacle', odds: -115 },
    ];
    const result = pickSharpOdds(odds);
    expect(result).toEqual({ bookId: 'pinnacle', odds: -115 });
  });

  it('falls through the sharp priority list', () => {
    const odds = [
      { bookId: 'fanduel', odds: -110 },
      { bookId: 'lowvig', odds: -112 },
    ];
    expect(pickSharpOdds(odds)?.bookId).toBe('lowvig');
  });

  it('returns null when no sharp book is present (no retail fallback)', () => {
    const odds = [
      { bookId: 'fanduel', odds: -110 },
      { bookId: 'draftkings', odds: -108 },
    ];
    expect(pickSharpOdds(odds)).toBeNull();
  });

  it('returns null for an empty list', () => {
    expect(pickSharpOdds([])).toBeNull();
  });
});
