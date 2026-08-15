import { describe, it, expect, beforeEach } from 'vitest';
import { clearDelayedOdds, getDelayedSnapshot, publishLiveSnapshot } from './delayedOdds';
import type { Event } from '@ny-sharp-edge/shared';

const event = (id: string): Event => ({
  id,
  sportKey: 'basketball_nba',
  homeTeam: 'Knicks',
  awayTeam: 'Lakers',
  commenceTime: '2026-08-15T00:00:00Z',
  markets: [],
});

describe('delayedOdds', () => {
  beforeEach(() => {
    clearDelayedOdds();
    process.env.FREE_ODDS_DELAY_MS = '1000';
  });

  it('stores the first snapshot immediately', () => {
    publishLiveSnapshot('nba', [event('a')], 0);
    expect(getDelayedSnapshot('nba')?.events[0]?.id).toBe('a');
  });

  it('does not update the snapshot until the delay has elapsed', () => {
    publishLiveSnapshot('nba', [event('a')], 0);
    publishLiveSnapshot('nba', [event('b')], 500);
    expect(getDelayedSnapshot('nba')?.events[0]?.id).toBe('a');
    publishLiveSnapshot('nba', [event('b')], 1000);
    expect(getDelayedSnapshot('nba')?.events[0]?.id).toBe('b');
  });
});
