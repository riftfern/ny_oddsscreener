import { describe, it, expect } from 'vitest';
import { SPORTS, type Event } from './index';
import { bestPlaceableOdds, eventInHorizon, findSpreadWindow, isUpcomingEvent, otherPlaceableOdds, pinnacleOdds, priceAtShop, weekBucket } from './shops';

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

describe('priceAtShop', () => {
  it('returns that shop\'s number for the same pick', () => {
    const event = {
      id: 'e1',
      sportKey: SPORTS.MLB,
      homeTeam: 'Reds',
      awayTeam: 'Cards',
      commenceTime: now,
      markets: [
        {
          type: 'h2h' as const,
          outcomes: [
            {
              name: 'Cards',
              bookOdds: [
                { bookId: 'draftkings', odds: 285, updatedAt: now },
                { bookId: 'fanduel', odds: 105, updatedAt: now },
              ],
            },
          ],
        },
      ],
    };
    expect(priceAtShop(event, 'h2h', 'Cards', 'fanduel')).toEqual({ odds: 105, line: undefined });
    expect(priceAtShop(event, 'h2h', 'Cards', 'betmgm')).toBeUndefined();
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

describe('eventInHorizon', () => {
  const t0 = Date.parse('2026-08-15T18:00:00Z');

  it('tonight is shorter than 3 days', () => {
    expect(eventInHorizon('2026-08-16T06:00:00Z', 'tonight', t0)).toBe(true);
    expect(eventInHorizon('2026-08-17T18:00:00Z', 'tonight', t0)).toBe(false);
    expect(eventInHorizon('2026-08-17T18:00:00Z', 'soon', t0)).toBe(true);
  });

  it('season keeps September football', () => {
    expect(eventInHorizon('2026-09-10T00:15:00Z', 'season', t0)).toBe(true);
    expect(eventInHorizon('2026-09-10T00:15:00Z', 'soon', t0)).toBe(false);
  });
});

describe('findSpreadWindow', () => {
  const event: Event = {
    id: 'e1',
    sportKey: SPORTS.NFL,
    homeTeam: 'New York Jets',
    awayTeam: 'Buffalo Bills',
    commenceTime: '2026-09-10T00:00:00Z',
    markets: [
      {
        type: 'spreads',
        outcomes: [
          {
            name: 'Buffalo Bills',
            point: -3.5,
            bookOdds: [
              { bookId: 'fanduel', odds: -110, line: -3.5, updatedAt: '' },
              { bookId: 'caesars', odds: -110, line: 7.5, updatedAt: '' },
            ],
          },
          {
            name: 'New York Jets',
            point: 3.5,
            bookOdds: [
              { bookId: 'draftkings', odds: -110, line: 5, updatedAt: '' },
              { bookId: 'caesars', odds: -110, line: 7, updatedAt: '' },
            ],
          },
        ],
      },
    ],
  };

  it('pairs opposite teams and prefers the tight window', () => {
    const w = findSpreadWindow(event, ['fanduel', 'draftkings', 'caesars'], 0.5);
    expect(w).toBeTruthy();
    expect(new Set([w!.left.name, w!.right.name]).size).toBe(2);
    expect(w!.gap).toBe(1.5);
  });

  it('ignores same-sign alt lines', () => {
    expect(findSpreadWindow(event, ['caesars', 'draftkings'], 0.5)).toBeNull();
  });
});

describe('weekBucket', () => {
  it('groups a midweek date into Mon–Sun', () => {
    const bucket = weekBucket('2026-08-18T18:00:00');
    expect(bucket.key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(bucket.label).toMatch(/Aug/);
    expect(weekBucket('2026-08-19T18:00:00').key).toBe(bucket.key);
  });
});
