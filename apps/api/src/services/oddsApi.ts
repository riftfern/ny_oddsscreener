import type { Event, SportKey, BookOdds, MarketOutcome, Market, EVOpportunity, ArbitrageOpportunity, RegionKey } from '@ny-sharp-edge/shared';
import { SPORTS, getMockEvents } from '@ny-sharp-edge/shared';
import { findEVOpportunities } from './evFinder.js';
import { findArbitrageOpportunities } from './arbFinder.js';
import { OddsCache, defaultTtlMs } from './oddsCache.js';

const BASE_URL = 'https://api.the-odds-api.com/v4';

function useMockData(): boolean {
  return process.env.USE_MOCK_DATA === 'true';
}

// Response interfaces matching frontend expectations
export interface OddsResponse {
  events: Event[];
  lastUpdated: string;
}

export interface EVResponse {
  opportunities: EVOpportunity[];
  count: number;
  scannedEvents: number;
  minEV: number;
  lastUpdated: string;
}

export interface ArbitrageResponse {
  opportunities: ArbitrageOpportunity[];
  count: number;
  scannedEvents: number;
  minProfit: number;
  totalStake: number;
  lastUpdated: string;
}

function getApiKey(): string | undefined {
  return process.env.THE_ODDS_API_KEY;
}

function defaultRegions(): RegionKey[] {
  const raw = process.env.ODDS_REGIONS;
  if (raw) {
    return raw.split(',').map((r) => r.trim()).filter(Boolean) as RegionKey[];
  }
  return ['us', 'us2', 'eu'];
}

function exchangeRegions(): RegionKey[] {
  const raw = process.env.ODDS_EXCHANGE_REGIONS;
  if (raw) {
    return raw.split(',').map((r) => r.trim()).filter(Boolean) as RegionKey[];
  }
  return ['us_ex'];
}

// Map The Odds API book keys to our venue ids (identity for known VENUES keys,
// plus aliases for books The Odds API names differently).
const BOOK_KEY_MAP: Record<string, string> = {
  fanduel: 'fanduel',
  draftkings: 'draftkings',
  betmgm: 'betmgm',
  williamhill_us: 'caesars', // Caesars was formerly William Hill
  betrivers: 'betrivers',
  fanatics: 'fanatics',
  ballybet: 'ballybet',
  bet365: 'bet365',
  thescore: 'thescore',
  bovada: 'bovada',
  lowvig: 'lowvig',
  espnbet: 'espnbet',
  pinnacle: 'pinnacle',
  kalshi: 'kalshi',
  polymarket: 'polymarket',
};

interface OddsApiOutcome {
  name: string;
  price: number;
  point?: number;
}

interface OddsApiMarket {
  key: string;
  last_update: string;
  outcomes: OddsApiOutcome[];
}

interface OddsApiBookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: OddsApiMarket[];
}

interface OddsApiEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsApiBookmaker[];
}

function findBestOdds(bookOdds: BookOdds[]): BookOdds | undefined {
  if (bookOdds.length === 0) return undefined;
  return bookOdds.reduce((best, current) => (current.odds > best.odds ? current : best));
}

function transformToEvent(apiEvent: OddsApiEvent): Event {
  const markets: Market[] = [];

  // Collect all outcomes across bookmakers by market type
  const marketMap: Record<string, Map<string, BookOdds[]>> = {
    h2h: new Map(),
    spreads: new Map(),
    totals: new Map(),
  };

  for (const bookmaker of apiEvent.bookmakers) {
    const bookId = BOOK_KEY_MAP[bookmaker.key] ?? bookmaker.key;

    for (const market of bookmaker.markets) {
      const marketType = market.key as 'h2h' | 'spreads' | 'totals';
      if (!marketMap[marketType]) continue;

      for (const outcome of market.outcomes) {
        const outcomeName = outcome.point !== undefined
          ? `${outcome.name}|${outcome.point}`
          : outcome.name;

        if (!marketMap[marketType].has(outcomeName)) {
          marketMap[marketType].set(outcomeName, []);
        }

        marketMap[marketType].get(outcomeName)!.push({
          bookId,
          odds: outcome.price,
          line: outcome.point,
          updatedAt: market.last_update,
        });
      }
    }
  }

  // Transform collected data into Market format
  for (const [marketType, outcomeMap] of Object.entries(marketMap)) {
    if (outcomeMap.size === 0) continue;

    const outcomes: MarketOutcome[] = [];

    for (const [outcomeName, bookOdds] of outcomeMap) {
      const [name, pointStr] = outcomeName.split('|');
      const point = pointStr ? parseFloat(pointStr) : undefined;

      outcomes.push({
        name,
        point,
        bookOdds,
        bestOdds: findBestOdds(bookOdds),
      });
    }

    // Sort outcomes: for totals, Over before Under; for others, away team first
    outcomes.sort((a, b) => {
      if (marketType === 'totals') {
        return a.name === 'Over' ? -1 : 1;
      }
      return a.name === apiEvent.away_team ? -1 : 1;
    });

    markets.push({
      type: marketType as 'h2h' | 'spreads' | 'totals',
      outcomes,
    });
  }

  // Sort markets: h2h, spreads, totals
  const marketOrder = ['h2h', 'spreads', 'totals'];
  markets.sort((a, b) => marketOrder.indexOf(a.type) - marketOrder.indexOf(b.type));

  return {
    id: apiEvent.id,
    sportKey: apiEvent.sport_key as SportKey,
    homeTeam: apiEvent.home_team,
    awayTeam: apiEvent.away_team,
    commenceTime: apiEvent.commence_time,
    markets,
  };
}

export interface FetchOddsOptions {
  regions?: RegionKey[];
  bookmakers?: string[];
  markets?: string;
  useCache?: boolean;
}

// One cache per sport+params shape. TTL from env (default 45s).
const oddsCache = new OddsCache<Event[]>(defaultTtlMs());

/** Test helper: clear the in-process odds cache between cases. */
export function clearOddsCache(): void {
  oddsCache.clear();
}

export async function fetchOdds(sport: SportKey, options: FetchOddsOptions = {}): Promise<Event[]> {
  if (useMockData()) {
    console.log(`[mock] Returning mock events for ${sport}`);
    return getMockEvents(sport);
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('THE_ODDS_API_KEY is not configured');
  }

  const regions = options.regions ?? defaultRegions();
  const markets = options.markets ?? 'h2h,spreads,totals';
  const cacheKey = `${sport}|${regions.join(',')}|${markets}`;

  const useCache = options.useCache ?? true;
  if (useCache) {
    const cached = oddsCache.get(cacheKey);
    if (cached) {
      console.log(`[cache] hit ${cacheKey}`);
      return cached;
    }
  }

  const url = new URL(`${BASE_URL}/sports/${sport}/odds`);
  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('regions', regions.join(','));
  url.searchParams.set('markets', markets);
  url.searchParams.set('oddsFormat', 'american');
  if (options.bookmakers?.length) {
    url.searchParams.set('bookmakers', options.bookmakers.join(','));
  }

  console.log(`Fetching odds for ${sport} (regions: ${regions.join(',')})...`);

  const response = await fetch(url.toString());

  if (!response.ok) {
    const errorText = await response.text();
    console.error(`API Error: ${response.status} - ${errorText}`);
    throw new Error(`The Odds API error: ${response.status}`);
  }

  // Log remaining requests
  const remaining = response.headers.get('x-requests-remaining');
  const used = response.headers.get('x-requests-used');
  console.log(`API Requests - Used: ${used}, Remaining: ${remaining}`);

  const data: OddsApiEvent[] = await response.json();
  const events = data.map(transformToEvent);

  if (useCache) {
    oddsCache.set(cacheKey, events);
  }

  return events;
}

export async function fetchExchangeOdds(sport: SportKey): Promise<Event[]> {
  return fetchOdds(sport, { regions: exchangeRegions() });
}

export async function fetchOddsResponse(sport: SportKey): Promise<OddsResponse> {
  const events = await fetchOdds(sport);
  return {
    events,
    lastUpdated: new Date().toISOString(),
  };
}

export async function fetchEVResponse(options: { sport?: string; minEV?: number }): Promise<EVResponse> {
  const { sport = 'all', minEV = 1 } = options;

  if (useMockData()) {
    console.log('[mock] Running +EV finder on mock events (Pinnacle fair line)');
    const sportsToScan: SportKey[] = sport === 'all'
      ? [SPORTS.NFL, SPORTS.NBA, SPORTS.NHL, SPORTS.MLB, SPORTS.EPL, SPORTS.MLS]
      : [sport as SportKey];
    const mockEvents: Event[] = sportsToScan.flatMap((s) => getMockEvents(s));
    const opportunities = findEVOpportunities(mockEvents, { minEV });
    return {
      opportunities,
      count: opportunities.length,
      scannedEvents: mockEvents.length,
      minEV,
      lastUpdated: new Date().toISOString(),
    };
  }

  const sportsToScan: SportKey[] = sport === 'all'
    ? [SPORTS.NFL, SPORTS.NBA, SPORTS.NHL, SPORTS.MLB]
    : [sport as SportKey];

  const allEvents: Event[] = [];
  for (const s of sportsToScan) {
    try {
      const events = await fetchOdds(s);
      allEvents.push(...events);
    } catch (err) {
      console.error(`Failed to fetch ${s}:`, err);
    }
  }

  const opportunities = findEVOpportunities(allEvents, { minEV });
  return {
    opportunities,
    count: opportunities.length,
    scannedEvents: allEvents.length,
    minEV,
    lastUpdated: new Date().toISOString(),
  };
}

export async function fetchArbitrageResponse(options: { sport?: string; minProfit?: number; totalStake?: number }): Promise<ArbitrageResponse> {
  const { sport = 'all', minProfit = 0.1, totalStake = 100 } = options;

  if (useMockData()) {
    console.log('[mock] Running arbitrage finder on mock events');
    const sportsToScan: SportKey[] = sport === 'all'
      ? [SPORTS.NFL, SPORTS.NBA, SPORTS.NHL, SPORTS.MLB, SPORTS.EPL, SPORTS.MLS]
      : [sport as SportKey];
    const mockEvents: Event[] = sportsToScan.flatMap((s) => getMockEvents(s));
    const opportunities = findArbitrageOpportunities(mockEvents, { minProfit, totalStake });
    return {
      opportunities,
      count: opportunities.length,
      scannedEvents: mockEvents.length,
      minProfit,
      totalStake,
      lastUpdated: new Date().toISOString(),
    };
  }

  const sportsToScan: SportKey[] = sport === 'all'
    ? [SPORTS.NFL, SPORTS.NBA, SPORTS.NHL, SPORTS.MLB]
    : [sport as SportKey];

  const allEvents: Event[] = [];
  for (const s of sportsToScan) {
    try {
      const events = await fetchOdds(s);
      allEvents.push(...events);
    } catch (err) {
      console.error(`Failed to fetch ${s}:`, err);
    }
  }

  const opportunities = findArbitrageOpportunities(allEvents, { minProfit, totalStake });
  return {
    opportunities,
    count: opportunities.length,
    scannedEvents: allEvents.length,
    minProfit,
    totalStake,
    lastUpdated: new Date().toISOString(),
  };
}

export async function getAvailableSports(): Promise<{ key: string; title: string; active: boolean }[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('THE_ODDS_API_KEY is not configured');
  }

  const url = `${BASE_URL}/sports?apiKey=${apiKey}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`The Odds API error: ${response.status}`);
  }

  return response.json();
}
