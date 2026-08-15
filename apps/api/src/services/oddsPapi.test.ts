import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { getOddsPapiSharpOdds, getOddsPapiConfig, clearOddsPapiCache } from './oddsPapi';
import type { Event } from '@ny-sharp-edge/shared';

const NOW = '2026-08-15T00:00:00Z';

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'evt-1',
    sportKey: 'basketball_nba' as const,
    homeTeam: 'Knicks',
    awayTeam: 'Lakers',
    commenceTime: NOW,
    markets: [],
    ...overrides,
  };
}

function makeOddsPapiResponse() {
  return {
    events: [
      {
        id: 'papi-1',
        sport_key: 'basketball_nba',
        commence_time: NOW,
        home_team: 'New York Knicks',
        away_team: 'Los Angeles Lakers',
        markets: [
          {
            key: 'h2h',
            outcomes: [
              { name: 'Lakers', price: 110 },
              { name: 'Knicks', price: -130 },
            ],
          },
        ],
      },
    ],
  };
}

describe('oddsPapi', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    clearOddsPapiCache();
    process.env.ODDS_PAPI_KEY = '';
    process.env.SHARP_FALLBACK = '';
    process.env.USE_MOCK_DATA = 'false';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
  });

  it('is disabled when env is not configured', () => {
    const config = getOddsPapiConfig();
    expect(config.enabled).toBe(false);
  });

  it('makes zero network calls when not configured', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const event = makeEvent();
    const odds = await getOddsPapiSharpOdds(event, 'h2h');

    expect(fetchMock).not.toHaveBeenCalled();
    expect(odds).toHaveLength(0);
  });

  it('fetches and maps Pinnacle odds when configured', async () => {
    process.env.ODDS_PAPI_KEY = 'test-key';
    process.env.SHARP_FALLBACK = 'oddspapi';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => makeOddsPapiResponse(),
    } as unknown as Response);
    vi.stubGlobal('fetch', fetchMock);

    const event = makeEvent();
    const odds = await getOddsPapiSharpOdds(event, 'h2h');

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(odds).toHaveLength(2);
    expect(odds[0].bookOdds[0].bookId).toBe('pinnacle');
    expect(odds[0].bookOdds[0].odds).toBe(110);
    expect(odds[1].bookOdds[0].odds).toBe(-130);
  });

  it('caches the OddsPapi response for 45s', async () => {
    process.env.ODDS_PAPI_KEY = 'test-key';
    process.env.SHARP_FALLBACK = 'oddspapi';

    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => makeOddsPapiResponse(),
    } as unknown as Response);
    vi.stubGlobal('fetch', fetchMock);

    const event = makeEvent();
    await getOddsPapiSharpOdds(event, 'h2h');
    await getOddsPapiSharpOdds(event, 'h2h');

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('is a no-op in mock mode even when configured', async () => {
    process.env.ODDS_PAPI_KEY = 'test-key';
    process.env.SHARP_FALLBACK = 'oddspapi';
    process.env.USE_MOCK_DATA = 'true';

    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);

    const event = makeEvent();
    const odds = await getOddsPapiSharpOdds(event, 'h2h');

    expect(fetchMock).not.toHaveBeenCalled();
    expect(odds).toHaveLength(0);
  });
});
