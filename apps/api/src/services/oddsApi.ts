import type { Event, SportKey, BookOdds, MarketOutcome, Market, EVOpportunity, ArbitrageOpportunity, RegionKey } from '@ny-sharp-edge/shared';
import { SPORTS, expandSportKeys, getMockEvents, pickSharpOdds } from '@ny-sharp-edge/shared';
import { findEVOpportunities } from './evFinder.js';
import { findArbitrageOpportunities } from './arbFinder.js';
import { findCrossVenueEVOpportunities } from './crossVenueEv.js';
import { OddsCache, defaultTtlMs } from './oddsCache.js';
import { enrichEventsWithNativeExchanges } from './nativeExchanges.js';
import { freeDelayMs, getDelayedSnapshot, publishLiveSnapshot } from './delayedOdds.js';
import { appendOddsSnapshot } from './snapshots.js';

export interface SharpCoverage {
  eventsWithSharp: number;
  eventsTotal: number;
  sharpBooksSeen: string[];
}

const BASE_URL = 'https://api.the-odds-api.com/v4';

function useMockData(): boolean {
  return process.env.USE_MOCK_DATA === 'true';
}

// Response interfaces matching frontend expectations
export interface OddsResponse {
  events: Event[];
  lastUpdated: string;
  cachedAt: string;
  stale?: boolean;
  delayed?: boolean;
  remainingCredits?: number;
  sharpCoverage: SharpCoverage;
}

export interface EVResponse {
  opportunities: EVOpportunity[];
  count: number;
  scannedEvents: number;
  minEV: number;
  lastUpdated: string;
  cachedAt: string;
  stale?: boolean;
  remainingCredits?: number;
  sharpCoverage: SharpCoverage;
}

export interface ArbitrageResponse {
  opportunities: ArbitrageOpportunity[];
  count: number;
  scannedEvents: number;
  minProfit: number;
  totalStake: number;
  lastUpdated: string;
  cachedAt: string;
  stale?: boolean;
  remainingCredits?: number;
}

let lastRemainingCredits: number | undefined;

export function getLastRemainingCredits(): number | undefined {
  return lastRemainingCredits;
}

export function computeSharpCoverage(events: Event[]): SharpCoverage {
  const sharpBooksSeen = new Set<string>();
  let eventsWithSharp = 0;

  for (const event of events) {
    let eventHasSharp = false;
    for (const market of event.markets) {
      if (market.outcomes.length !== 2) continue;
      const sharp1 = pickSharpOdds(market.outcomes[0].bookOdds);
      const sharp2 = pickSharpOdds(market.outcomes[1].bookOdds);
      if (sharp1 && sharp2) {
        eventHasSharp = true;
        sharpBooksSeen.add(sharp1.bookId);
        sharpBooksSeen.add(sharp2.bookId);
      }
    }
    if (eventHasSharp) eventsWithSharp++;
  }

  return {
    eventsWithSharp,
    eventsTotal: events.length,
    sharpBooksSeen: Array.from(sharpBooksSeen),
  };
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

export interface FetchOddsResult {
  events: Event[];
  cachedAt: string;
  stale?: boolean;
}

// One cache per sport+params shape. TTL from env (default 45s).
const oddsCache = new OddsCache<Event[]>(() => defaultTtlMs());

/** Test helper: clear the in-process odds cache between cases. */
export function clearOddsCache(): void {
  oddsCache.clear();
}

function recordRemainingCredits(response: Response): void {
  const remaining = response.headers.get('x-requests-remaining');
  if (remaining) {
    const parsed = parseInt(remaining, 10);
    if (Number.isFinite(parsed)) lastRemainingCredits = parsed;
  }
}

async function tryStaleFallback(cacheKey: string): Promise<FetchOddsResult | undefined> {
  const stale = oddsCache.getStale(cacheKey);
  if (!stale) return undefined;
  console.warn(`[cache] stale fallback for ${cacheKey}`);
  return {
    events: stale.value,
    cachedAt: new Date(stale.cachedAt).toISOString(),
    stale: true,
  };
}

export async function fetchOdds(sport: string, options: FetchOddsOptions = {}): Promise<FetchOddsResult> {
  if (useMockData()) {
    console.log(`[mock] Returning mock events for ${sport}`);
    return {
      events: getMockEvents(sport),
      cachedAt: new Date().toISOString(),
    };
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
      const meta = oddsCache.peekLast(cacheKey);
      return {
        events: cached,
        cachedAt: new Date(meta?.cachedAt ?? Date.now()).toISOString(),
      };
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

  try {
    const response = await fetch(url.toString());

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`API Error: ${response.status} - ${errorText}`);
      const stale = await tryStaleFallback(cacheKey);
      if (stale) return stale;
      throw new Error(`The Odds API error: ${response.status}`);
    }

    recordRemainingCredits(response);
    const used = response.headers.get('x-requests-used');
    console.log(`API Requests - Used: ${used}, Remaining: ${lastRemainingCredits ?? 'unknown'}`);

    const data: OddsApiEvent[] = await response.json();
    const events = data.map(transformToEvent);

    appendOddsSnapshot(sport as SportKey, regions, events);

    if (useCache) {
      oddsCache.set(cacheKey, events);
    }

    return { events, cachedAt: new Date().toISOString() };
  } catch (err) {
    const stale = await tryStaleFallback(cacheKey);
    if (stale) return stale;
    throw err;
  }
}

function evKey(opp: EVOpportunity): string {
  return `${opp.eventId}|${opp.marketType}|${opp.outcomeName}|${opp.bookId}|${opp.source ?? 'pinnacle'}`;
}

async function collectEV(
  bookEvents: Event[],
  exchangeEvents: Event[],
  minEV: number,
  includeCross: boolean
): Promise<EVOpportunity[]> {
  const fromBooks = await findEVOpportunities(bookEvents, { minEV });
  if (!includeCross) return fromBooks;
  const fromCross = findCrossVenueEVOpportunities(bookEvents, exchangeEvents, { minEV });
  const seen = new Set(fromBooks.map(evKey));
  const extra = fromCross.filter((opp) => {
    const key = evKey(opp);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  return [...fromBooks, ...extra].sort((a, b) => b.evPercentage - a.evPercentage);
}

function mergeFetchResults(results: FetchOddsResult[]): FetchOddsResult {
  const events = results.flatMap((r) => r.events);
  const stale = results.some((r) => r.stale);
  const timestamps = results.map((r) => new Date(r.cachedAt).getTime()).sort((a, b) => a - b);
  const cachedAt = new Date(stale ? timestamps[0] : timestamps[timestamps.length - 1]).toISOString();
  return { events, cachedAt, stale };
}

/** tennis_majors → in-season slam keys; other sports pass through. */
export async function fetchOddsGroup(sport: string, options: FetchOddsOptions = {}): Promise<FetchOddsResult> {
  const keys = expandSportKeys(sport);
  if (keys.length === 1) return fetchOdds(keys[0], options);

  const results: FetchOddsResult[] = [];
  for (const key of keys) {
    try {
      results.push(await fetchOdds(key, options));
    } catch (err) {
      console.error(`Failed to fetch ${key}:`, err);
    }
  }
  if (results.length === 0) {
    return { events: [], cachedAt: new Date().toISOString() };
  }
  return mergeFetchResults(results);
}

async function maybeAttachNative(sport: string, events: Event[]): Promise<Event[]> {
  if (useMockData() || !nativeExchangesEnabled()) return events;
  try {
    const enriched = await enrichEventsWithNativeExchanges(sport as SportKey, events);
    return enriched.events;
  } catch (err) {
    console.error('[odds] native overlay failed:', err);
    return events;
  }
}

function nativeExchangesEnabled(): boolean {
  return process.env.NATIVE_EXCHANGES !== 'false';
}

export async function fetchExchangeOdds(
  sport: SportKey,
  options: { unmatched?: boolean } = {}
): Promise<FetchOddsResult> {
  // All-unmatched view: no sportsbook odds needed, just native markets.
  if (options.unmatched) {
    if (useMockData() || !nativeExchangesEnabled()) {
      return { events: [], cachedAt: new Date().toISOString() };
    }
    try {
      const enriched = await enrichEventsWithNativeExchanges(sport, []);
      return {
        events: enriched.unmatched,
        cachedAt: new Date().toISOString(),
      };
    } catch (err) {
      console.error('[exchanges] unmatched native enrich failed:', err);
      return { events: [], cachedAt: new Date().toISOString() };
    }
  }

  const usEx = await fetchOddsGroup(sport, { regions: exchangeRegions() });
  if (useMockData() || !nativeExchangesEnabled()) return usEx;

  try {
    const books = await fetchOddsGroup(sport);
    const enriched = await enrichEventsWithNativeExchanges(sport, books.events);
    const sportUnmatched = enriched.unmatched.filter((event) => event.sportKey === sport);
    return {
      events: [...enriched.events, ...sportUnmatched],
      cachedAt: usEx.cachedAt,
      stale: usEx.stale || books.stale,
    };
  } catch (err) {
    console.error('[exchanges] native enrich failed, serving us_ex only:', err);
    return usEx;
  }
}

export async function fetchExchangeOddsResponse(
  sport: SportKey,
  options: { unmatched?: boolean } = {}
): Promise<OddsResponse> {
  const result = await fetchExchangeOdds(sport, options);
  return {
    events: result.events,
    lastUpdated: new Date().toISOString(),
    cachedAt: result.cachedAt,
    stale: result.stale,
    remainingCredits: getLastRemainingCredits(),
    sharpCoverage: computeSharpCoverage(result.events),
  };
}

export async function fetchOddsResponse(
  sport: SportKey,
  options: { delayed?: boolean } = {}
): Promise<OddsResponse> {
  const delayKey = `live:${sport}`;

  if (options.delayed && !useMockData()) {
    const existing = getDelayedSnapshot(delayKey);
    const frozenAt = existing ? Date.parse(existing.cachedAt) : 0;
    const freshEnough = existing && Date.now() - frozenAt < freeDelayMs();
    if (freshEnough && existing) {
      return {
        events: existing.events,
        lastUpdated: new Date().toISOString(),
        cachedAt: existing.cachedAt,
        delayed: true,
        remainingCredits: getLastRemainingCredits(),
        sharpCoverage: computeSharpCoverage(existing.events),
      };
    }
  }

  const fetched = await fetchOddsGroup(sport);
  const events = await maybeAttachNative(sport, fetched.events);
  const result = { ...fetched, events };
  if (!useMockData()) {
    publishLiveSnapshot(delayKey, result.events);
  }

  if (options.delayed) {
    const delayed = getDelayedSnapshot(delayKey);
    if (delayed) {
      return {
        events: delayed.events,
        lastUpdated: new Date().toISOString(),
        cachedAt: delayed.cachedAt,
        delayed: true,
        remainingCredits: getLastRemainingCredits(),
        sharpCoverage: computeSharpCoverage(delayed.events),
      };
    }
  }

  return {
    events: result.events,
    lastUpdated: new Date().toISOString(),
    cachedAt: result.cachedAt,
    stale: result.stale,
    remainingCredits: getLastRemainingCredits(),
    sharpCoverage: computeSharpCoverage(result.events),
  };
}

export async function fetchEVResponse(options: { sport?: string; minEV?: number; includeCross?: boolean }): Promise<EVResponse> {
  const { sport = 'all', minEV = 1, includeCross = false } = options;

  if (useMockData()) {
    console.log('[mock] Running +EV finder on mock events (Pinnacle fair line)');
    const sportsToScan = sport === 'all'
      ? [SPORTS.NFL, SPORTS.NBA, SPORTS.NHL, SPORTS.MLB, SPORTS.EPL, SPORTS.MLS]
      : expandSportKeys(sport);
    const mockEvents: Event[] = sportsToScan.flatMap((s) => getMockEvents(s));
    const opportunities = await collectEV(mockEvents, mockEvents, minEV, includeCross);
    return {
      opportunities,
      count: opportunities.length,
      scannedEvents: mockEvents.length,
      minEV,
      lastUpdated: new Date().toISOString(),
      cachedAt: new Date().toISOString(),
      sharpCoverage: computeSharpCoverage(mockEvents),
    };
  }

  const sportsToScan = sport === 'all'
    ? [SPORTS.NFL, SPORTS.NBA, SPORTS.NHL, SPORTS.MLB]
    : expandSportKeys(sport);

  const results: FetchOddsResult[] = [];
  for (const s of sportsToScan) {
    try {
      const result = await fetchOdds(s);
      results.push(result);
    } catch (err) {
      console.error(`Failed to fetch ${s}:`, err);
    }
  }

  const merged = mergeFetchResults(results);
  let exchangeEvents: Event[] = merged.events;
  if (includeCross) {
    const exchangeResults: FetchOddsResult[] = [];
    for (const s of sportsToScan) {
      try {
        exchangeResults.push(await fetchExchangeOdds(s as SportKey));
      } catch (err) {
        console.error(`Failed to fetch exchanges for ${s}:`, err);
      }
    }
    exchangeEvents = mergeFetchResults(exchangeResults).events;
  }
  const opportunities = await collectEV(merged.events, exchangeEvents, minEV, includeCross);
  return {
    opportunities,
    count: opportunities.length,
    scannedEvents: merged.events.length,
    minEV,
    lastUpdated: new Date().toISOString(),
    cachedAt: merged.cachedAt,
    stale: merged.stale,
    remainingCredits: getLastRemainingCredits(),
    sharpCoverage: computeSharpCoverage(merged.events),
  };
}

export async function fetchArbitrageResponse(options: { sport?: string; minProfit?: number; totalStake?: number }): Promise<ArbitrageResponse> {
  const { sport = 'all', minProfit = 0.1, totalStake = 100 } = options;

  if (useMockData()) {
    console.log('[mock] Running arbitrage finder on mock events');
    const sportsToScan = sport === 'all'
      ? [SPORTS.NFL, SPORTS.NBA, SPORTS.NHL, SPORTS.MLB, SPORTS.EPL, SPORTS.MLS]
      : expandSportKeys(sport);
    const mockEvents: Event[] = sportsToScan.flatMap((s) => getMockEvents(s));
    const opportunities = findArbitrageOpportunities(mockEvents, { minProfit, totalStake });
    return {
      opportunities,
      count: opportunities.length,
      scannedEvents: mockEvents.length,
      minProfit,
      totalStake,
      lastUpdated: new Date().toISOString(),
      cachedAt: new Date().toISOString(),
    };
  }

  const sportsToScan = sport === 'all'
    ? [SPORTS.NFL, SPORTS.NBA, SPORTS.NHL, SPORTS.MLB]
    : expandSportKeys(sport);

  const results: FetchOddsResult[] = [];
  for (const s of sportsToScan) {
    try {
      const result = await fetchOdds(s);
      results.push(result);
    } catch (err) {
      console.error(`Failed to fetch ${s}:`, err);
    }
  }

  const merged = mergeFetchResults(results);
  const opportunities = findArbitrageOpportunities(merged.events, { minProfit, totalStake });
  return {
    opportunities,
    count: opportunities.length,
    scannedEvents: merged.events.length,
    minProfit,
    totalStake,
    lastUpdated: new Date().toISOString(),
    cachedAt: merged.cachedAt,
    stale: merged.stale,
    remainingCredits: getLastRemainingCredits(),
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
