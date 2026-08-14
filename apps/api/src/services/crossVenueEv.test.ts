import { describe, it, expect } from 'vitest';
import { findCrossVenueEVOpportunities } from './crossVenueEv';
import type { Event } from '@ny-sharp-edge/shared';

function makeEvent(id: string, options: { withPinnacle: boolean; withExchange: boolean }): Event {
  const bookOdds = [];
  if (options.withPinnacle) {
    bookOdds.push(
      { bookId: 'pinnacle', odds: -110, updatedAt: '2026-08-14T00:00:00Z' },
      { bookId: 'fanduel', odds: -105, updatedAt: '2026-08-14T00:00:00Z' }
    );
  } else {
    bookOdds.push(
      { bookId: 'fanduel', odds: -105, updatedAt: '2026-08-14T00:00:00Z' }
    );
  }

  const exchangeBookOdds = options.withExchange
    ? [
        { bookId: 'kalshi', odds: +120, updatedAt: '2026-08-14T00:00:00Z' },
        { bookId: 'polymarket', odds: -140, updatedAt: '2026-08-14T00:00:00Z' },
      ]
    : [];

  return {
    id,
    sportKey: 'basketball_nba',
    homeTeam: 'Knicks',
    awayTeam: 'Lakers',
    commenceTime: '2026-08-15T00:00:00Z',
    markets: [
      {
        type: 'h2h',
        outcomes: [
          {
            name: 'Lakers',
            bookOdds: options.withPinnacle
              ? [
                  { bookId: 'pinnacle', odds: -110, updatedAt: '2026-08-14T00:00:00Z' },
                  { bookId: 'fanduel', odds: -105, updatedAt: '2026-08-14T00:00:00Z' },
                ]
              : [{ bookId: 'fanduel', odds: -105, updatedAt: '2026-08-14T00:00:00Z' }],
            bestOdds: { bookId: 'fanduel', odds: -105, updatedAt: '2026-08-14T00:00:00Z' },
          },
          {
            name: 'Knicks',
            bookOdds: options.withPinnacle
              ? [
                  { bookId: 'pinnacle', odds: -110, updatedAt: '2026-08-14T00:00:00Z' },
                  { bookId: 'fanduel', odds: -115, updatedAt: '2026-08-14T00:00:00Z' },
                ]
              : [{ bookId: 'fanduel', odds: -115, updatedAt: '2026-08-14T00:00:00Z' }],
            bestOdds: { bookId: 'fanduel', odds: -115, updatedAt: '2026-08-14T00:00:00Z' },
          },
        ],
      },
    ],
  };
}

function makeExchangeEvent(id: string): Event {
  return {
    id,
    sportKey: 'basketball_nba',
    homeTeam: 'Knicks',
    awayTeam: 'Lakers',
    commenceTime: '2026-08-15T00:00:00Z',
    markets: [
      {
        type: 'h2h',
        outcomes: [
          {
            name: 'Lakers',
            bookOdds: [
              { bookId: 'kalshi', odds: +120, updatedAt: '2026-08-14T00:00:00Z' },
              { bookId: 'polymarket', odds: -140, updatedAt: '2026-08-14T00:00:00Z' },
            ],
            bestOdds: { bookId: 'kalshi', odds: +120, updatedAt: '2026-08-14T00:00:00Z' },
          },
          {
            name: 'Knicks',
            bookOdds: [
              { bookId: 'kalshi', odds: -140, updatedAt: '2026-08-14T00:00:00Z' },
              { bookId: 'polymarket', odds: +120, updatedAt: '2026-08-14T00:00:00Z' },
            ],
            bestOdds: { bookId: 'polymarket', odds: +120, updatedAt: '2026-08-14T00:00:00Z' },
          },
        ],
      },
    ],
  };
}

describe('findCrossVenueEVOpportunities', () => {
  it('returns [] when no event ids match', () => {
    const defaultEvents = [makeEvent('evt-1', { withPinnacle: true, withExchange: false })];
    const exchangeEvents = [makeExchangeEvent('evt-2')];
    const result = findCrossVenueEVOpportunities(defaultEvents, exchangeEvents);
    expect(result).toHaveLength(0);
  });

  it('flags exchange price +EV vs Pinnacle when ids match (source: pinnacle)', () => {
    const defaultEvents = [makeEvent('evt-1', { withPinnacle: true, withExchange: false })];
    const exchangeEvents = [makeExchangeEvent('evt-1')];
    const result = findCrossVenueEVOpportunities(defaultEvents, exchangeEvents, { minEV: 0 });

    const fromPinnacle = result.filter((o) => o.source === 'pinnacle');
    expect(fromPinnacle.length).toBeGreaterThan(0);
    expect(fromPinnacle.some((o) => o.bookId === 'kalshi' || o.bookId === 'polymarket')).toBe(true);
  });

  it('flags soft book +EV vs exchange no-vig when ids match (source: exchange)', () => {
    const defaultEvents = [makeEvent('evt-1', { withPinnacle: false, withExchange: false })];
    const exchangeEvents = [makeExchangeEvent('evt-1')];
    const result = findCrossVenueEVOpportunities(defaultEvents, exchangeEvents, { minEV: 0 });

    const fromExchange = result.filter((o) => o.source === 'exchange');
    expect(fromExchange.some((o) => o.bookId === 'fanduel')).toBe(true);
  });
});
