import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchOdds, fetchExchangeOdds, fetchExchangeOddsResponse, fetchOddsResponse, fetchEVResponse, clearOddsCache } from './oddsApi';

// A single The Odds API event carrying FanDuel (soft) + Pinnacle (sharp) prices.
function makeOddsApiPayload() {
  return [
    {
      id: 'evt-1',
      sport_key: 'basketball_nba',
      sport_title: 'NBA',
      commence_time: '2026-08-15T00:00:00Z',
      home_team: 'Knicks',
      away_team: 'Lakers',
      bookmakers: [
        {
          key: 'fanduel',
          title: 'FanDuel',
          last_update: '2026-08-14T00:00:00Z',
          markets: [
            {
              key: 'h2h',
              last_update: '2026-08-14T00:00:00Z',
              outcomes: [
                { name: 'Lakers', price: 120 },
                { name: 'Knicks', price: -140 },
              ],
            },
          ],
        },
        {
          key: 'pinnacle',
          title: 'Pinnacle',
          last_update: '2026-08-14T00:00:00Z',
          markets: [
            {
              key: 'h2h',
              last_update: '2026-08-14T00:00:00Z',
              outcomes: [
                { name: 'Lakers', price: 110 },
                { name: 'Knicks', price: -130 },
              ],
            },
          ],
        },
      ],
    },
  ];
}

// FanDuel-only fixture: no sharp book present.
function makeFanDuelOnlyPayload() {
  return [
    {
      id: 'evt-2',
      sport_key: 'basketball_nba',
      sport_title: 'NBA',
      commence_time: '2026-08-15T00:00:00Z',
      home_team: 'Celtics',
      away_team: 'Heat',
      bookmakers: [
        {
          key: 'fanduel',
          title: 'FanDuel',
          last_update: '2026-08-14T00:00:00Z',
          markets: [
            {
              key: 'h2h',
              last_update: '2026-08-14T00:00:00Z',
              outcomes: [
                { name: 'Heat', price: 130 },
                { name: 'Celtics', price: -150 },
              ],
            },
          ],
        },
      ],
    },
  ];
}

function jsonResponse(body: unknown) {
  return {
    ok: true,
    status: 200,
    json: async () => body,
    headers: {
      get: (name: string) => (name === 'x-requests-remaining' ? '19800' : name === 'x-requests-used' ? '200' : null),
    },
    text: async () => JSON.stringify(body),
  } as unknown as Response;
}

describe('oddsApi fetchOdds', () => {
  const originalEnv = { ...process.env };
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    clearOddsCache();
    fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    process.env.THE_ODDS_API_KEY = 'test-key';
    process.env.USE_MOCK_DATA = 'false';
    process.env.ODDS_CACHE_TTL_MS = '45000';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
  });

  it('keeps both FanDuel and Pinnacle books in the transformed event', async () => {
    fetchMock.mockResolvedValue(jsonResponse(makeOddsApiPayload()));

    const result = await fetchOdds('basketball_nba');
    expect(result.events).toHaveLength(1);
    const event = result.events[0];

    const h2h = event.markets.find((m) => m.type === 'h2h');
    expect(h2h).toBeDefined();
    const bookIds = h2h!.outcomes.flatMap((o) => o.bookOdds.map((b) => b.bookId));
    expect(bookIds).toContain('fanduel');
    expect(bookIds).toContain('pinnacle');
  });

  it('uses the cache so a second call inside TTL does not refetch', async () => {
    fetchMock.mockResolvedValue(jsonResponse(makeOddsApiPayload()));

    const first = await fetchOdds('basketball_nba');
    expect(first.events).toHaveLength(1);

    const second = await fetchOdds('basketball_nba');
    expect(second.events).toHaveLength(1);

    // Two calls to fetchOdds, but the underlying HTTP fetch should fire only once.
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reports zero sharp coverage when only soft books are present', async () => {
    fetchMock.mockResolvedValue(jsonResponse(makeFanDuelOnlyPayload()));

    const response = await fetchOddsResponse('basketball_nba');
    expect(response.sharpCoverage.eventsTotal).toBe(1);
    expect(response.sharpCoverage.eventsWithSharp).toBe(0);
    expect(response.sharpCoverage.sharpBooksSeen).toHaveLength(0);
  });

  it('returns stale last-good data when a live fetch fails', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    process.env.ODDS_CACHE_TTL_MS = '1';
    fetchMock.mockResolvedValueOnce(jsonResponse(makeOddsApiPayload()));
    fetchMock.mockRejectedValueOnce(new Error('network down'));

    const first = await fetchOdds('basketball_nba');
    expect(first.events).toHaveLength(1);
    expect(first.stale).toBeUndefined();

    // Expire the cache entry so the next call attempts a live fetch.
    vi.advanceTimersByTime(2);

    const second = await fetchOdds('basketball_nba');
    expect(second.events).toHaveLength(1);
    expect(second.stale).toBe(true);

    vi.useRealTimers();
  });
});

describe('oddsApi fetchExchangeOdds', () => {
  const originalEnv = { ...process.env };

  beforeEach(() => {
    clearOddsCache();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(makeOddsApiPayload())));
    process.env.THE_ODDS_API_KEY = 'test-key';
    process.env.USE_MOCK_DATA = 'false';
    process.env.ODDS_EXCHANGE_REGIONS = 'us_ex';
    process.env.NATIVE_EXCHANGES = 'false';
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
  });

  it('requests the exchange region (us_ex) in a separate cache key', async () => {
    const url = await getFirstFetchedUrl(fetchExchangeOdds('basketball_nba'));
    expect(url).toContain('regions=us_ex');
  });

  it('does not collide with the default Edge cache key', async () => {
    const fetchMock = vi.fn().mockResolvedValue(jsonResponse(makeOddsApiPayload()));
    vi.stubGlobal('fetch', fetchMock);

    await fetchOdds('basketball_nba');
    await fetchExchangeOdds('basketball_nba');

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('returns a response wrapper with lastUpdated', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse(makeOddsApiPayload())));

    const response = await fetchExchangeOddsResponse('basketball_nba');
    expect(response.events).toHaveLength(1);
    expect(response.lastUpdated).toBeDefined();
    expect(response.cachedAt).toBeDefined();
  });
});

describe('fetchEVResponse sport filter', () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it('scans only the selected sport — NFL mock rows stay NFL', async () => {
    process.env.USE_MOCK_DATA = 'true';
    const data = await fetchEVResponse({ sport: 'americanfootball_nfl', minEV: 0.5 });
    expect(data.opportunities.every((o) => o.event.sportKey === 'americanfootball_nfl')).toBe(true);
    expect(data.opportunities.some((o) => /canucks|oilers/i.test(`${o.event.awayTeam} ${o.event.homeTeam}`))).toBe(false);
  });

  it('scans tennis majors without pulling NFL', async () => {
    process.env.USE_MOCK_DATA = 'true';
    const data = await fetchEVResponse({ sport: 'tennis_majors', minEV: 0.5 });
    expect(data.opportunities.every((o) => String(o.event.sportKey).startsWith('tennis_'))).toBe(true);
    expect(data.opportunities.some((o) => o.event.sportKey === 'americanfootball_nfl')).toBe(false);
  });
});

async function getFirstFetchedUrl(promise: Promise<unknown>): Promise<string> {
  await promise;
  const call = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as string[];
  return call[0];
}
