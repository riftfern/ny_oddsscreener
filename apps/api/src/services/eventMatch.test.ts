import { describe, it, expect } from 'vitest';
import {
  attachNativeMarket,
  findMatchingEvent,
  teamNickname,
  titlesMatchEvent,
} from './eventMatch';
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

describe('eventMatch', () => {
  it('uses the nickname (Knicks / Lakers) not the city', () => {
    expect(teamNickname('New York Knicks')).toBe('knicks');
    expect(teamNickname('Los Angeles Lakers')).toBe('lakers');
  });

  it('matches a Will X beat Y title to the sportsbook event', () => {
    expect(titlesMatchEvent('Will the Lakers beat the Knicks?', event)).toBe(true);
    expect(titlesMatchEvent('Chiefs vs Bills winner', event)).toBe(false);
  });

  it('finds the event in a list', () => {
    expect(findMatchingEvent('Lakers vs Knicks', [event])?.id).toBe('nba-1');
  });

  it('attaches Yes/No prices onto the named team', () => {
    const attached = attachNativeMarket(
      event,
      {
        venue: 'polymarket',
        id: 'pm:1',
        title: 'Will the Lakers beat the Knicks?',
        yesName: 'Lakers',
        noName: 'Knicks',
        yesAmerican: 120,
        noAmerican: -140,
      },
      '2026-08-15T00:00:00Z'
    );
    const h2h = attached.markets[0];
    const lakers = h2h.outcomes.find((o) => o.name === 'Los Angeles Lakers')!;
    const knicks = h2h.outcomes.find((o) => o.name === 'New York Knicks')!;
    expect(lakers.bookOdds).toEqual([
      { bookId: 'polymarket', odds: 120, updatedAt: '2026-08-15T00:00:00Z' },
    ]);
    expect(knicks.bookOdds[0]?.odds).toBe(-140);
  });
});
