import { describe, it, expect } from 'vitest';
import { mergeNativeOntoEvents } from './nativeExchanges';
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

describe('mergeNativeOntoEvents', () => {
  it('attaches a matching Polymarket market and ignores an unrelated one', () => {
    const merged = mergeNativeOntoEvents([event], [
      {
        venue: 'polymarket',
        id: 'pm:1',
        title: 'Will the Lakers beat the Knicks?',
        yesName: 'Lakers',
        noName: 'Knicks',
        yesAmerican: 130,
        noAmerican: -150,
      },
      {
        venue: 'kalshi',
        id: 'kal:unrelated',
        title: 'Will the Fed cut in September?',
        yesName: 'Yes',
        noName: 'No',
        yesAmerican: -110,
        noAmerican: -110,
      },
    ]);
    const books = merged[0].markets[0].outcomes.flatMap((o) => o.bookOdds.map((b) => b.bookId));
    expect(books).toContain('polymarket');
    expect(books).not.toContain('kalshi');
  });
});
