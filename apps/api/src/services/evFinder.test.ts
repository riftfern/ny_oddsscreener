import { describe, it, expect } from 'vitest';
import { findEVOpportunities } from './evFinder';
import type { Event } from '@ny-sharp-edge/shared';
import { SPORTS } from '@ny-sharp-edge/shared';

const NOW = '2026-08-15T00:00:00Z';

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'evt-1',
    sportKey: SPORTS.NFL,
    homeTeam: 'Jets',
    awayTeam: 'Bills',
    commenceTime: NOW,
    markets: [],
    ...overrides,
  };
}

describe('findEVOpportunities', () => {
  it('flags FanDuel +120 as +EV vs Pinnacle -110/-110 and never lists Pinnacle', () => {
    const event = makeEvent({
      markets: [
        {
          type: 'h2h',
          outcomes: [
            {
              name: 'Bills',
              point: undefined,
              bookOdds: [
                { bookId: 'pinnacle', odds: -110, updatedAt: NOW },
                { bookId: 'fanduel', odds: 120, updatedAt: NOW },
              ],
              bestOdds: { bookId: 'fanduel', odds: 120, updatedAt: NOW },
            },
            {
              name: 'Jets',
              point: undefined,
              bookOdds: [
                { bookId: 'pinnacle', odds: -110, updatedAt: NOW },
                { bookId: 'fanduel', odds: -140, updatedAt: NOW },
              ],
              bestOdds: { bookId: 'fanduel', odds: -140, updatedAt: NOW },
            },
          ],
        },
      ],
    });

    const opps = findEVOpportunities([event], { minEV: 1 });

    // Exactly one opportunity: FanDuel Bills +120.
    expect(opps).toHaveLength(1);
    expect(opps[0].bookId).toBe('fanduel');
    expect(opps[0].bookOdds).toBe(120);
    expect(opps[0].evPercentage).toBeGreaterThan(0);
    // Fair line is the Pinnacle no-vig -110/-110 -> fair prob 0.5, fair odds even money (+100).
    expect(opps[0].fairProbability).toBeCloseTo(0.5, 3);
    expect(opps[0].fairOdds).toBe(100);
    // Pinnacle itself must not be listed as +EV against its own line.
    expect(opps.some((o) => o.bookId === 'pinnacle')).toBe(false);
  });

  it('skips a market entirely when either side has no sharp book', () => {
    const event = makeEvent({
      markets: [
        {
          type: 'h2h',
          outcomes: [
            {
              name: 'Bills',
              point: undefined,
              bookOdds: [{ bookId: 'fanduel', odds: 120, updatedAt: NOW }],
              bestOdds: { bookId: 'fanduel', odds: 120, updatedAt: NOW },
            },
            {
              name: 'Jets',
              point: undefined,
              bookOdds: [{ bookId: 'draftkings', odds: -140, updatedAt: NOW }],
              bestOdds: { bookId: 'draftkings', odds: -140, updatedAt: NOW },
            },
          ],
        },
      ],
    });

    // No sharp book on either side -> market is skipped, nothing flagged.
    const opps = findEVOpportunities([event], { minEV: 1 });
    expect(opps).toHaveLength(0);
  });

  it('does not use best retail odds as the fair line', () => {
    // FanDuel is the best retail price but there is no sharp book -> skipped.
    const event = makeEvent({
      markets: [
        {
          type: 'h2h',
          outcomes: [
            {
              name: 'Bills',
              point: undefined,
              bookOdds: [{ bookId: 'fanduel', odds: 150, updatedAt: NOW }],
              bestOdds: { bookId: 'fanduel', odds: 150, updatedAt: NOW },
            },
            {
              name: 'Jets',
              point: undefined,
              bookOdds: [{ bookId: 'fanduel', odds: -180, updatedAt: NOW }],
              bestOdds: { bookId: 'fanduel', odds: -180, updatedAt: NOW },
            },
          ],
        },
      ],
    });

    const opps = findEVOpportunities([event], { minEV: 1 });
    expect(opps).toHaveLength(0);
  });
});
