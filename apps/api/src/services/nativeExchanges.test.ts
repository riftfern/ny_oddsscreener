import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mergeNativeOntoEvents, enrichEventsWithNativeExchanges, clearNativeExchangeCache } from './nativeExchanges';
import * as polymarket from './polymarket';
import * as kalshi from './kalshi';
import type { Event } from '@ny-sharp-edge/shared';

const event: Event = {
  id: 'nba-1',
  sportKey: 'basketball_nba',
  homeTeam: 'New York Knicks',
  awayTeam: 'Los Angeles Lakers',
  commenceTime: '2026-08-15T00:00:00Z',
  markets: [
    {
      type: 'h2h',
      outcomes: [
        { name: 'Los Angeles Lakers', bookOdds: [] },
        { name: 'New York Knicks', bookOdds: [] },
      ],
    },
  ],
};

const markets = [
  {
    venue: 'polymarket' as const,
    id: 'pm:1',
    title: 'Will the Lakers beat the Knicks?',
    yesName: 'Lakers',
    noName: 'Knicks',
    yesAmerican: 130,
    noAmerican: -150,
  },
  {
    venue: 'kalshi' as const,
    id: 'kal:unrelated',
    title: 'Will the Fed cut in September?',
    yesName: 'Yes',
    noName: 'No',
    yesAmerican: -110,
    noAmerican: -110,
  },
];

describe('mergeNativeOntoEvents', () => {
  it('attaches a matching Polymarket market and ignores an unrelated one', () => {
    const merged = mergeNativeOntoEvents([event], markets);
    const books = merged[0].markets[0].outcomes.flatMap((o) => o.bookOdds.map((b) => b.bookId));
    expect(books).toContain('polymarket');
    expect(books).not.toContain('kalshi');
  });
});

describe('enrichEventsWithNativeExchanges', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    clearNativeExchangeCache();
    process.env.NATIVE_EXCHANGES = 'true';
    vi.spyOn(polymarket, 'fetchPolymarketMarkets').mockResolvedValue(
      markets.filter((m) => m.venue === 'polymarket')
    );
    vi.spyOn(kalshi, 'fetchKalshiMarkets').mockResolvedValue(
      markets.filter((m) => m.venue === 'kalshi')
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
    process.env = { ...originalEnv };
  });

  it('puts a leftover Fed market only in the unmatched list', async () => {
    const enriched = await enrichEventsWithNativeExchanges('basketball_nba', [event]);

    const matchedBooks = enriched.events[0].markets[0].outcomes.flatMap((o) =>
      o.bookOdds.map((b) => b.bookId)
    );
    expect(matchedBooks).toContain('polymarket');
    expect(matchedBooks).not.toContain('kalshi');

    const unmatchedIds = enriched.unmatched.map((e) => e.id);
    expect(unmatchedIds).toContain('kal:unrelated');
    expect(unmatchedIds).not.toContain('pm:1');
    expect(enriched.unmatched[0].sportKey).toBe('prediction');
    expect(enriched.unmatched[0].homeTeam).toBe('Yes');
    expect(enriched.unmatched[0].awayTeam).toBe('No');
  });
});
