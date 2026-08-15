import { describe, it, expect } from 'vitest';
import { bestPlaceableOdds, isUpcomingEvent, otherPlaceableOdds, pinnacleOdds } from './shops';

const now = '2026-08-15T12:00:00Z';

describe('bestPlaceableOdds', () => {
  const books = [
    { bookId: 'pinnacle', odds: 177, updatedAt: now },
    { bookId: 'draftkings', odds: 154, updatedAt: now },
    { bookId: 'fanduel', odds: 160, updatedAt: now },
    { bookId: 'kalshi', odds: 158, updatedAt: now },
  ];

  it('picks the best shop a user can open, not Pinnacle', () => {
    const best = bestPlaceableOdds(books);
    expect(best?.bookId).toBe('fanduel');
    expect(best?.odds).toBe(160);
    expect(pinnacleOdds(books)?.odds).toBe(177);
  });

  it('lists other shops without the winner or Pinnacle', () => {
    const others = otherPlaceableOdds(books);
    expect(others.map((b) => b.bookId)).toEqual(['kalshi', 'draftkings']);
  });

  it('only considers books the user has', () => {
    const best = bestPlaceableOdds(books, ['draftkings']);
    expect(best?.bookId).toBe('draftkings');
    expect(otherPlaceableOdds(books, ['draftkings'])).toEqual([]);
  });
});

describe('isUpcomingEvent', () => {
  const t0 = Date.parse('2026-08-15T18:00:00Z');

  it('keeps tonight and drops next-month futures', () => {
    expect(isUpcomingEvent('2026-08-16T00:00:00Z', t0)).toBe(true);
    expect(isUpcomingEvent('2026-09-20T00:00:00Z', t0)).toBe(false);
  });

  it('keeps a game that started less than 3 hours ago', () => {
    expect(isUpcomingEvent('2026-08-15T16:00:00Z', t0)).toBe(true);
    expect(isUpcomingEvent('2026-08-15T12:00:00Z', t0)).toBe(false);
  });
});
