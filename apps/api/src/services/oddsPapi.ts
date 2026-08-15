import type { Event, SportKey, MarketType, BookOdds } from '@ny-sharp-edge/shared';
import { OddsCache, defaultTtlMs } from './oddsCache.js';
import { normalizeTitle, teamNickname } from './eventMatch.js';

const BASE_URL = 'https://api.oddspapi.io';

export interface OddsPapiConfig {
  enabled: boolean;
  apiKey?: string;
}

export function getOddsPapiConfig(): OddsPapiConfig {
  return {
    enabled: process.env.SHARP_FALLBACK === 'oddspapi' && !!process.env.ODDS_PAPI_KEY,
    apiKey: process.env.ODDS_PAPI_KEY,
  };
}

function useMockData(): boolean {
  return process.env.USE_MOCK_DATA === 'true';
}

interface OddsPapiOutcome {
  name: string;
  price: number;
  point?: number;
}

interface OddsPapiMarket {
  key: MarketType;
  outcomes: OddsPapiOutcome[];
}

interface OddsPapiEvent {
  id: string;
  sport_key: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  title?: string;
  markets: OddsPapiMarket[];
}

interface OddsPapiResponse {
  events?: OddsPapiEvent[];
  data?: OddsPapiEvent[];
}

/**
 * Fetch sharp (Pinnacle) odds from OddsPapi for a sport.
 *
 * This is a BEST-EFFORT fallback. The OddsPapi response shape is treated
 * liberally: we accept either `events` or `data` and look for a market whose
 * key matches our market type. Errors are logged and an empty array is returned
 * so the EV finder can continue without a sharp line.
 */
async function fetchOddsPapiEvents(sport: SportKey): Promise<Event[]> {
  const config = getOddsPapiConfig();
  if (!config.enabled || !config.apiKey) {
    return [];
  }
  if (useMockData()) {
    return [];
  }

  const url = new URL(`${BASE_URL}/v1/odds`);
  url.searchParams.set('sport', sport);
  url.searchParams.set('bookmaker', 'pinnacle');
  url.searchParams.set('oddsFormat', 'american');
  url.searchParams.set('apiKey', config.apiKey);

  try {
    const response = await fetch(url.toString());
    if (!response.ok) {
      console.error(`[oddspapi] API error ${response.status} for ${sport}`);
      return [];
    }
    const body: OddsPapiResponse = await response.json();
    const rawEvents = body.events ?? body.data ?? [];

    return rawEvents.map((apiEvent) => ({
      id: apiEvent.id,
      sportKey: apiEvent.sport_key as SportKey,
      homeTeam: apiEvent.home_team,
      awayTeam: apiEvent.away_team,
      commenceTime: apiEvent.commence_time,
      markets: apiEvent.markets.map((market) => ({
        type: market.key,
        outcomes: market.outcomes.map((outcome) => ({
          name: outcome.name,
          point: outcome.point,
          bookOdds: [
            {
              bookId: 'pinnacle',
              odds: outcome.price,
              line: outcome.point,
              updatedAt: apiEvent.commence_time,
            } satisfies BookOdds,
          ],
          bestOdds: undefined,
        })),
      })),
    }));
  } catch (err) {
    console.error('[oddspapi] fetch failed:', err);
    return [];
  }
}

const oddsPapiCache = new OddsCache<Event[]>(() => defaultTtlMs());

/** Clear the in-process OddsPapi cache (test helper). */
export function clearOddsPapiCache(): void {
  oddsPapiCache.clear();
}

async function fetchCachedOddsPapiEvents(sport: SportKey): Promise<Event[]> {
  return oddsPapiCache.getOrSet(sport, () => fetchOddsPapiEvents(sport));
}

interface SharpOutcomeOdds {
  name: string;
  bookOdds: BookOdds[];
}

function normalizeName(value: string): string {
  return normalizeTitle(value);
}

/**
 * Return Pinnacle book odds for a single event/market, if OddsPapi has them.
 *
 * Events are matched conservatively by home/away nicknames. Outcomes are matched
 * by normalized name; if names do not match we fall back to positional pairing
 * for exactly two outcomes. If nothing matches, an empty array is returned and
 * the caller should skip the market.
 */
export async function getOddsPapiSharpOdds(
  event: Event,
  marketType: MarketType
): Promise<SharpOutcomeOdds[]> {
  const config = getOddsPapiConfig();
  if (!config.enabled || !config.apiKey) {
    return [];
  }

  const papiEvents = await fetchCachedOddsPapiEvents(event.sportKey);
  const match = papiEvents.find(
    (e) =>
      teamNickname(e.homeTeam) === teamNickname(event.homeTeam) &&
      teamNickname(e.awayTeam) === teamNickname(event.awayTeam)
  );
  if (!match) return [];

  const market = match.markets.find((m) => m.type === marketType);
  if (!market) return [];

  return market.outcomes.map((outcome) => ({
    name: outcome.name,
    bookOdds: outcome.bookOdds.filter((bo) => bo.bookId === 'pinnacle'),
  }));
}

export { SharpOutcomeOdds };
