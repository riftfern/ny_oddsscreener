import type { Event, SportKey, BookOdds, MarketOutcome, Market, SportsbookId } from '@ny-sharp-edge/shared';
import { SPORTSBOOKS } from '@ny-sharp-edge/shared';
import { getMockEvents } from './mockData';

const BASE_URL = 'https://api.the-odds-api.com/v4';

function getApiKey(): string | undefined {
  return process.env.THE_ODDS_API_KEY;
}

// Map The Odds API book keys to our SportsbookId
const BOOK_KEY_MAP: Record<string, SportsbookId | null> = {
  fanduel: 'fanduel',
  draftkings: 'draftkings',
  betmgm: 'betmgm',
  williamhill_us: 'caesars', // Caesars was formerly William Hill
  betrivers: 'betrivers',
  fanatics: 'fanatics',
  ballybet: 'ballybet',
  bet365: 'bet365',
  thescore: 'thescore',
  // Ignore non-NY books
  bovada: null,
  betonlineag: null,
  pinnacle: null,
  mybookieag: null,
  lowvig: null,
  superbook: null,
  betparx: null,
  espnbet: null,
  fliff: null,
  hardrockbet: null,
  pointsbetus: null,
  unibet_us: null,
  wynnbet: null,
};

// NY legal sportsbook keys for API request
const NY_BOOKMAKERS = [
  'fanduel',
  'draftkings',
  'betmgm',
  'williamhill_us',
  'betrivers',
  'bet365',
];

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
    const bookId = BOOK_KEY_MAP[bookmaker.key];
    if (!bookId) continue; // Skip non-NY books

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

export async function fetchOdds(sport: SportKey): Promise<Event[]> {
  // Return mock data if USE_MOCK_DATA is true
  if (process.env.USE_MOCK_DATA === 'true') {
    console.log(`Using mock data for ${sport}.`);
    // Use a timeout to simulate network latency
    await new Promise(resolve => setTimeout(resolve, 500));
    return getMockEvents(sport);
  }

  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error('THE_ODDS_API_KEY is not configured');
  }

  const url = new URL(`${BASE_URL}/sports/${sport}/odds`);
  url.searchParams.set('apiKey', apiKey);
  url.searchParams.set('regions', 'us');
  url.searchParams.set('markets', 'h2h,spreads,totals');
  url.searchParams.set('oddsFormat', 'american');
  url.searchParams.set('bookmakers', NY_BOOKMAKERS.join(','));

  console.log(`Fetching odds for ${sport}...`);

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

  return data.map(transformToEvent);
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
