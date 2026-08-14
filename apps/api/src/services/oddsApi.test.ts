import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { fetchOdds, fetchExchangeOdds, clearOddsCache } from './oddsApi';

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

    const events = await fetchOdds('basketball_nba');
    expect(events).toHaveLength(1);
    const event = events[0];

    const h2h = event.markets.find((m) => m.type === 'h2h');
    expect(h2h).toBeDefined();
    const bookIds = h2h!.outcomes.flatMap((o) => o.bookOdds.map((b) => b.bookId));
    expect(bookIds).toContain('fanduel');
    expect(bookIds).toContain('pinnacle');
  });

  it('uses the cache so a second call inside TTL does not refetch', async () => {
    fetchMock.mockResolvedValue(jsonResponse(makeOddsApiPayload()));

    const first = await fetchOdds('basketball_nba');
    expect(first).toHaveLength(1);

    const second = await fetchOdds('basketball_nba');
    expect(second).toHaveLength(1);

    // Two calls to fetchOdds, but the underlying HTTP fetch should fire only once.
    expect(fetchMock).toHaveBeenCalledTimes(1);
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
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    process.env = { ...originalEnv };
  });

  it('requests the exchange region (us_ex) in a separate cache key', async () => {
    const url = await getFirstFetchedUrl(fetchExchangeOdds('basketball_nba'));
    expect(url).toContain('regions=us_ex');
  });
});

async function getFirstFetchedUrl(promise: Promise<unknown>): Promise<string> {
  await promise;
  const call = (fetch as unknown as ReturnType<typeof vi.fn>).mock.calls[0] as string[];
  return call[0];
}
