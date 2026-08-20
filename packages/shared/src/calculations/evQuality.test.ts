import { describe, it, expect } from 'vitest';
import type { EVOpportunity } from '../types/index.js';
import { SPORTS } from '../types/index.js';
import {
  classifyEdge,
  classifyPriceVsPin,
  freshnessLabel,
  isQuietEdge,
  lineFreshness,
  opportunityUpdatedAt,
} from './evQuality';

describe('classifyEdge', () => {
  it('treats normal retail edges as ok and huge numbers as suspect', () => {
    expect(classifyEdge(3.2)).toBe('ok');
    expect(classifyEdge(14)).toBe('fat');
    expect(classifyEdge(176)).toBe('suspect');
  });

  it('hides suspect edges from the quiet feed', () => {
    expect(isQuietEdge(2.1)).toBe(true);
    expect(isQuietEdge(1.2)).toBe(false);
    expect(isQuietEdge(20)).toBe(false);
  });
});

describe('classifyPriceVsPin', () => {
  it('flags a huge plus-money dog vs a much shorter Pinnacle', () => {
    expect(classifyPriceVsPin(1800, 462)).toBe('suspect');
  });

  it('leaves a normal shop vs pin alone', () => {
    expect(classifyPriceVsPin(-110, -108)).toBe('ok');
  });
});

describe('line freshness', () => {
  const now = Date.parse('2026-08-20T18:00:00Z');

  it('labels recent, aging, and stale books', () => {
    expect(lineFreshness('2026-08-20T17:58:00Z', now)).toBe('live');
    expect(lineFreshness('2026-08-20T17:50:00Z', now)).toBe('aging');
    expect(lineFreshness('2026-08-20T17:30:00Z', now)).toBe('stale');
    expect(lineFreshness(undefined, now)).toBe('unknown');
  });

  it('prints a short age', () => {
    expect(freshnessLabel('2026-08-20T17:58:00Z', now)).toBe('2m ago');
  });
});

describe('opportunityUpdatedAt', () => {
  it('reads the book last_update off the nested event', () => {
    const opp = {
      eventId: 'e1',
      marketType: 'h2h',
      outcomeName: 'Bills',
      bookId: 'fanduel',
      event: {
        id: 'e1',
        sportKey: SPORTS.NFL,
        homeTeam: 'Jets',
        awayTeam: 'Bills',
        commenceTime: '2026-08-20T00:00:00Z',
        markets: [
          {
            type: 'h2h',
            outcomes: [
              {
                name: 'Bills',
                bookOdds: [{ bookId: 'fanduel', odds: 120, updatedAt: '2026-08-20T17:58:00Z' }],
              },
            ],
          },
        ],
      },
    } as EVOpportunity;
    expect(opportunityUpdatedAt(opp)).toBe('2026-08-20T17:58:00Z');
  });
});
