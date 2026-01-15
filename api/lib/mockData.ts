import type { Event, SportKey, BookOdds, MarketOutcome, SportsbookId, EVOpportunity, ArbitrageOpportunity } from './types';
import { SPORTS, SPORTSBOOKS } from './types';

const NY_BOOKS: SportsbookId[] = Object.values(SPORTSBOOKS);

// Helper to generate slight variations in odds across books
function varyOdds(baseOdds: number, variance: number = 5): number {
  const variation = Math.floor(Math.random() * variance * 2) - variance;
  return baseOdds + variation;
}

// Helper to find best odds for an outcome
function findBestOdds(bookOdds: BookOdds[]): BookOdds | undefined {
  if (bookOdds.length === 0) return undefined;
  return bookOdds.reduce((best, current) => (current.odds > best.odds ? current : best));
}

// Generate book odds with realistic variations
function generateBookOdds(baseOdds: number, line?: number): BookOdds[] {
  const now = new Date().toISOString();
  return NY_BOOKS.map((bookId) => ({
    bookId,
    odds: varyOdds(baseOdds),
    line,
    updatedAt: now,
  }));
}

// Generate outcomes with best odds calculated
function createOutcomes(
  name1: string,
  name2: string,
  baseOdds1: number,
  baseOdds2: number,
  line1?: number,
  line2?: number
): MarketOutcome[] {
  const bookOdds1 = generateBookOdds(baseOdds1, line1);
  const bookOdds2 = generateBookOdds(baseOdds2, line2);

  return [
    { name: name1, point: line1, bookOdds: bookOdds1, bestOdds: findBestOdds(bookOdds1) },
    { name: name2, point: line2, bookOdds: bookOdds2, bestOdds: findBestOdds(bookOdds2) },
  ];
}

// --- NFL Mock Data ---
const NFL_EVENTS: Event[] = [
  {
    id: 'nfl-1',
    sportKey: SPORTS.NFL,
    homeTeam: 'New York Jets',
    awayTeam: 'Buffalo Bills',
    commenceTime: new Date(Date.now() + 3600000).toISOString(),
    markets: [
      { type: 'h2h', outcomes: createOutcomes('Buffalo Bills', 'New York Jets', -155, 130) },
      { type: 'spreads', outcomes: createOutcomes('Buffalo Bills', 'New York Jets', -110, -110, -3.5, 3.5) },
      { type: 'totals', outcomes: createOutcomes('Over', 'Under', -110, -110, 43.5, 43.5) },
    ],
  },
  {
    id: 'nfl-2',
    sportKey: SPORTS.NFL,
    homeTeam: 'New York Giants',
    awayTeam: 'Philadelphia Eagles',
    commenceTime: new Date(Date.now() + 7200000).toISOString(),
    markets: [
      { type: 'h2h', outcomes: createOutcomes('Philadelphia Eagles', 'New York Giants', -280, 225) },
      { type: 'spreads', outcomes: createOutcomes('Philadelphia Eagles', 'New York Giants', -110, -110, -6.5, 6.5) },
      { type: 'totals', outcomes: createOutcomes('Over', 'Under', -110, -110, 47.5, 47.5) },
    ],
  },
  {
    id: 'nfl-3',
    sportKey: SPORTS.NFL,
    homeTeam: 'Miami Dolphins',
    awayTeam: 'New England Patriots',
    commenceTime: new Date(Date.now() + 10800000).toISOString(),
    markets: [
      { type: 'h2h', outcomes: createOutcomes('Miami Dolphins', 'New England Patriots', -200, 165) },
      { type: 'spreads', outcomes: createOutcomes('Miami Dolphins', 'New England Patriots', -110, -110, -4.5, 4.5) },
      { type: 'totals', outcomes: createOutcomes('Over', 'Under', -105, -115, 48.5, 48.5) },
    ],
  },
  {
    id: 'nfl-4',
    sportKey: SPORTS.NFL,
    homeTeam: 'Kansas City Chiefs',
    awayTeam: 'Cincinnati Bengals',
    commenceTime: new Date(Date.now() + 86400000).toISOString(),
    markets: [
      { type: 'h2h', outcomes: createOutcomes('Kansas City Chiefs', 'Cincinnati Bengals', -145, 125) },
      { type: 'spreads', outcomes: createOutcomes('Kansas City Chiefs', 'Cincinnati Bengals', -115, -105, -3, 3) },
      { type: 'totals', outcomes: createOutcomes('Over', 'Under', -110, -110, 51.5, 51.5) },
    ],
  },
  {
    id: 'nfl-5',
    sportKey: SPORTS.NFL,
    homeTeam: 'Dallas Cowboys',
    awayTeam: 'San Francisco 49ers',
    commenceTime: new Date(Date.now() + 90000000).toISOString(),
    markets: [
      { type: 'h2h', outcomes: createOutcomes('San Francisco 49ers', 'Dallas Cowboys', -130, 110) },
      { type: 'spreads', outcomes: createOutcomes('San Francisco 49ers', 'Dallas Cowboys', -110, -110, -1.5, 1.5) },
      { type: 'totals', outcomes: createOutcomes('Over', 'Under', -110, -110, 49.0, 49.0) },
    ],
  },
  {
    id: 'nfl-6',
    sportKey: SPORTS.NFL,
    homeTeam: 'Green Bay Packers',
    awayTeam: 'Chicago Bears',
    commenceTime: new Date(Date.now() + 172800000).toISOString(),
    markets: [
      { type: 'h2h', outcomes: createOutcomes('Green Bay Packers', 'Chicago Bears', -180, 155) },
      { type: 'spreads', outcomes: createOutcomes('Green Bay Packers', 'Chicago Bears', -110, -110, -4.5, 4.5) },
      { type: 'totals', outcomes: createOutcomes('Over', 'Under', -110, -110, 44.0, 44.0) },
    ],
  },
];

// --- NBA Mock Data ---
const NBA_EVENTS: Event[] = [
  {
    id: 'nba-1',
    sportKey: SPORTS.NBA,
    homeTeam: 'New York Knicks',
    awayTeam: 'Los Angeles Lakers',
    commenceTime: new Date(Date.now() + 5400000).toISOString(),
    markets: [
      { type: 'h2h', outcomes: createOutcomes('Los Angeles Lakers', 'New York Knicks', 120, -140) },
      { type: 'spreads', outcomes: createOutcomes('Los Angeles Lakers', 'New York Knicks', -110, -110, 2.5, -2.5) },
      { type: 'totals', outcomes: createOutcomes('Over', 'Under', -110, -110, 224.5, 224.5) },
    ],
  },
  {
    id: 'nba-2',
    sportKey: SPORTS.NBA,
    homeTeam: 'Brooklyn Nets',
    awayTeam: 'Boston Celtics',
    commenceTime: new Date(Date.now() + 9000000).toISOString(),
    markets: [
      { type: 'h2h', outcomes: createOutcomes('Boston Celtics', 'Brooklyn Nets', -310, 250) },
      { type: 'spreads', outcomes: createOutcomes('Boston Celtics', 'Brooklyn Nets', -110, -110, -8.5, 8.5) },
      { type: 'totals', outcomes: createOutcomes('Over', 'Under', -108, -112, 219.5, 219.5) },
    ],
  },
  {
    id: 'nba-3',
    sportKey: SPORTS.NBA,
    homeTeam: 'Chicago Bulls',
    awayTeam: 'Milwaukee Bucks',
    commenceTime: new Date(Date.now() + 12600000).toISOString(),
    markets: [
      { type: 'h2h', outcomes: createOutcomes('Milwaukee Bucks', 'Chicago Bulls', -175, 150) },
      { type: 'spreads', outcomes: createOutcomes('Milwaukee Bucks', 'Chicago Bulls', -110, -110, -4, 4) },
      { type: 'totals', outcomes: createOutcomes('Over', 'Under', -110, -110, 231.5, 231.5) },
    ],
  },
  {
    id: 'nba-4',
    sportKey: SPORTS.NBA,
    homeTeam: 'Golden State Warriors',
    awayTeam: 'Phoenix Suns',
    commenceTime: new Date(Date.now() + 14400000).toISOString(),
    markets: [
      { type: 'h2h', outcomes: createOutcomes('Phoenix Suns', 'Golden State Warriors', -110, -110) },
      { type: 'spreads', outcomes: createOutcomes('Phoenix Suns', 'Golden State Warriors', -110, -110, -1, 1) },
      { type: 'totals', outcomes: createOutcomes('Over', 'Under', -110, -110, 238.5, 238.5) },
    ],
  },
  {
    id: 'nba-5',
    sportKey: SPORTS.NBA,
    homeTeam: 'Denver Nuggets',
    awayTeam: 'Miami Heat',
    commenceTime: new Date(Date.now() + 16200000).toISOString(),
    markets: [
      { type: 'h2h', outcomes: createOutcomes('Denver Nuggets', 'Miami Heat', -220, 180) },
      { type: 'spreads', outcomes: createOutcomes('Denver Nuggets', 'Miami Heat', -110, -110, -6.5, 6.5) },
      { type: 'totals', outcomes: createOutcomes('Over', 'Under', -110, -110, 215.0, 215.0) },
    ],
  },
];

// --- NHL Mock Data ---
const NHL_EVENTS: Event[] = [
  {
    id: 'nhl-1',
    sportKey: SPORTS.NHL,
    homeTeam: 'New York Rangers',
    awayTeam: 'Pittsburgh Penguins',
    commenceTime: new Date(Date.now() + 4800000).toISOString(),
    markets: [
      { type: 'h2h', outcomes: createOutcomes('New York Rangers', 'Pittsburgh Penguins', -145, 125) },
      { type: 'spreads', outcomes: createOutcomes('New York Rangers', 'Pittsburgh Penguins', 155, -185, -1.5, 1.5) },
      { type: 'totals', outcomes: createOutcomes('Over', 'Under', -110, -110, 6.5, 6.5) },
    ],
  },
  {
    id: 'nhl-2',
    sportKey: SPORTS.NHL,
    homeTeam: 'New York Islanders',
    awayTeam: 'New Jersey Devils',
    commenceTime: new Date(Date.now() + 8400000).toISOString(),
    markets: [
      { type: 'h2h', outcomes: createOutcomes('New Jersey Devils', 'New York Islanders', -130, 110) },
      { type: 'spreads', outcomes: createOutcomes('New Jersey Devils', 'New York Islanders', 145, -170, -1.5, 1.5) },
      { type: 'totals', outcomes: createOutcomes('Over', 'Under', -115, -105, 5.5, 5.5) },
    ],
  },
  {
    id: 'nhl-3',
    sportKey: SPORTS.NHL,
    homeTeam: 'Toronto Maple Leafs',
    awayTeam: 'Boston Bruins',
    commenceTime: new Date(Date.now() + 9200000).toISOString(),
    markets: [
      { type: 'h2h', outcomes: createOutcomes('Boston Bruins', 'Toronto Maple Leafs', -115, -105) },
      { type: 'spreads', outcomes: createOutcomes('Boston Bruins', 'Toronto Maple Leafs', 210, -250, 1.5, -1.5) },
      { type: 'totals', outcomes: createOutcomes('Over', 'Under', -110, -110, 6.0, 6.0) },
    ],
  },
  {
    id: 'nhl-4',
    sportKey: SPORTS.NHL,
    homeTeam: 'Colorado Avalanche',
    awayTeam: 'Edmonton Oilers',
    commenceTime: new Date(Date.now() + 10800000).toISOString(),
    markets: [
      { type: 'h2h', outcomes: createOutcomes('Colorado Avalanche', 'Edmonton Oilers', -125, 105) },
      { type: 'spreads', outcomes: createOutcomes('Colorado Avalanche', 'Edmonton Oilers', 190, -230, -1.5, 1.5) },
      { type: 'totals', outcomes: createOutcomes('Over', 'Under', -105, -115, 6.5, 6.5) },
    ],
  },
];

// --- MLB Mock Data ---
const MLB_EVENTS: Event[] = [
  {
    id: 'mlb-1',
    sportKey: SPORTS.MLB,
    homeTeam: 'New York Yankees',
    awayTeam: 'Boston Red Sox',
    commenceTime: new Date(Date.now() + 86400000).toISOString(),
    markets: [
      { type: 'h2h', outcomes: createOutcomes('New York Yankees', 'Boston Red Sox', -135, 115) },
      { type: 'spreads', outcomes: createOutcomes('New York Yankees', 'Boston Red Sox', -125, 105, -1.5, 1.5) },
      { type: 'totals', outcomes: createOutcomes('Over', 'Under', -110, -110, 8.5, 8.5) },
    ],
  },
  {
    id: 'mlb-2',
    sportKey: SPORTS.MLB,
    homeTeam: 'New York Mets',
    awayTeam: 'Atlanta Braves',
    commenceTime: new Date(Date.now() + 90000000).toISOString(),
    markets: [
      { type: 'h2h', outcomes: createOutcomes('Atlanta Braves', 'New York Mets', -150, 130) },
      { type: 'spreads', outcomes: createOutcomes('Atlanta Braves', 'New York Mets', -135, 115, -1.5, 1.5) },
      { type: 'totals', outcomes: createOutcomes('Over', 'Under', -105, -115, 9, 9) },
    ],
  },
  {
    id: 'mlb-3',
    sportKey: SPORTS.MLB,
    homeTeam: 'Los Angeles Dodgers',
    awayTeam: 'San Diego Padres',
    commenceTime: new Date(Date.now() + 93600000).toISOString(),
    markets: [
      { type: 'h2h', outcomes: createOutcomes('Los Angeles Dodgers', 'San Diego Padres', -160, 140) },
      { type: 'spreads', outcomes: createOutcomes('Los Angeles Dodgers', 'San Diego Padres', -110, -110, -1.5, 1.5) },
      { type: 'totals', outcomes: createOutcomes('Over', 'Under', -115, -105, 8, 8) },
    ],
  },
];

const EVENTS_BY_SPORT: Record<SportKey, Event[]> = {
  [SPORTS.NFL]: NFL_EVENTS,
  [SPORTS.NBA]: NBA_EVENTS,
  [SPORTS.MLB]: MLB_EVENTS,
  [SPORTS.NHL]: NHL_EVENTS,
  [SPORTS.NCAAF]: [],
  [SPORTS.NCAAB]: [],
};

export function getMockEvents(sport: SportKey): Event[] {
  const events = EVENTS_BY_SPORT[sport] || [];
  return events.map((event) => ({
    ...event,
    markets: event.markets.map((market) => ({
      ...market,
      outcomes: market.outcomes.map((outcome) => {
        const newBookOdds = outcome.bookOdds.map((bo) => ({
          ...bo,
          odds: varyOdds(bo.odds, 3),
          updatedAt: new Date().toISOString(),
        }));
        return {
          ...outcome,
          bookOdds: newBookOdds,
          bestOdds: findBestOdds(newBookOdds),
        };
      }),
    })),
  }));
}

export function getMockEVOpportunities(): EVOpportunity[] {
  const nfl1 = NFL_EVENTS[0];
  const nfl2 = NFL_EVENTS[1];
  const nba1 = NBA_EVENTS[0];
  const nba2 = NBA_EVENTS[1];
  const nhl1 = NHL_EVENTS[0];

  return [
    {
      eventId: nfl1.id,
      event: nfl1,
      marketType: 'h2h',
      outcomeName: 'Buffalo Bills',
      bookId: 'fanduel',
      bookOdds: 105,
      fairOdds: -110,
      fairProbability: 0.5238,
      evPercentage: 10.2,
      edge: 0.102,
      kellySuggestion: 51.0,
    },
    {
      eventId: nfl1.id,
      event: nfl1,
      marketType: 'spreads',
      outcomeName: 'Buffalo Bills -3.5',
      bookId: 'draftkings',
      bookOdds: 100,
      fairOdds: -115,
      fairProbability: 0.5349,
      evPercentage: 6.9,
      edge: 0.069,
      kellySuggestion: 34.5,
    },
    {
      eventId: nfl2.id,
      event: nfl2,
      marketType: 'h2h',
      outcomeName: 'New York Giants',
      bookId: 'betmgm',
      bookOdds: 240,
      fairOdds: 210,
      fairProbability: 0.3226,
      evPercentage: 9.7,
      edge: 0.097,
      kellySuggestion: 28.5,
    },
    {
      eventId: nba1.id,
      event: nba1,
      marketType: 'totals',
      outcomeName: 'Over 224.5',
      bookId: 'caesars',
      bookOdds: -105,
      fairOdds: -120,
      fairProbability: 0.5455,
      evPercentage: 6.4,
      edge: 0.064,
      kellySuggestion: 31.8,
    },
    {
      eventId: nba2.id,
      event: nba2,
      marketType: 'spreads',
      outcomeName: 'Brooklyn Nets +8.5',
      bookId: 'betrivers',
      bookOdds: -108,
      fairOdds: -125,
      fairProbability: 0.5556,
      evPercentage: 7.1,
      edge: 0.071,
      kellySuggestion: 38.0,
    },
    {
      eventId: nhl1.id,
      event: nhl1,
      marketType: 'h2h',
      outcomeName: 'Pittsburgh Penguins',
      bookId: 'fanatics',
      bookOdds: 135,
      fairOdds: 120,
      fairProbability: 0.4545,
      evPercentage: 6.8,
      edge: 0.068,
      kellySuggestion: 25.4,
    },
    {
      eventId: 'nba-3',
      event: NBA_EVENTS[2],
      marketType: 'totals',
      outcomeName: 'Under 231.5',
      bookId: 'bet365',
      bookOdds: 100,
      fairOdds: -112,
      fairProbability: 0.5283,
      evPercentage: 5.6,
      edge: 0.056,
      kellySuggestion: 28.0,
    },
    {
      eventId: 'nfl-4',
      event: NFL_EVENTS[3],
      marketType: 'h2h',
      outcomeName: 'Cincinnati Bengals',
      bookId: 'thescore',
      bookOdds: 135,
      fairOdds: 120,
      fairProbability: 0.4545,
      evPercentage: 6.8,
      edge: 0.068,
      kellySuggestion: 25.0,
    },
  ];
}

export function getMockArbitrageOpportunities(): ArbitrageOpportunity[] {
  const nhlEvent = NHL_EVENTS[0];
  const mlbEvent = MLB_EVENTS[0];
  const nbaEvent = NBA_EVENTS[0];
  const nflEvent = NFL_EVENTS[0];

  return [
    {
      eventId: nhlEvent.id,
      event: nhlEvent,
      marketType: 'h2h',
      profitPercentage: 2.15,
      totalStake: 100,
      guaranteedProfit: 2.15,
      legs: [
        {
          outcomeName: 'New York Rangers',
          bookId: 'fanduel',
          odds: -110,
          stakeRatio: 0.51,
          suggestedStake: 51.0,
        },
        {
          outcomeName: 'Pittsburgh Penguins',
          bookId: 'draftkings',
          odds: 125,
          stakeRatio: 0.49,
          suggestedStake: 49.0,
        },
      ],
    },
    {
      eventId: mlbEvent.id,
      event: mlbEvent,
      marketType: 'totals',
      profitPercentage: 1.2,
      totalStake: 100,
      guaranteedProfit: 1.2,
      legs: [
        {
          outcomeName: 'Over 8.5',
          bookId: 'caesars',
          odds: -105,
          stakeRatio: 0.506,
          suggestedStake: 50.6,
        },
        {
          outcomeName: 'Under 8.5',
          bookId: 'betrivers',
          odds: 110,
          stakeRatio: 0.494,
          suggestedStake: 49.4,
        },
      ],
    },
    {
      eventId: nbaEvent.id,
      event: nbaEvent,
      marketType: 'spreads',
      profitPercentage: 3.4,
      totalStake: 100,
      guaranteedProfit: 3.40,
      legs: [
        {
          outcomeName: 'Lakers +2.5',
          bookId: 'betmgm',
          odds: 105,
          stakeRatio: 0.50,
          suggestedStake: 50.0,
        },
        {
          outcomeName: 'Knicks -2.5',
          bookId: 'bet365',
          odds: 105,
          stakeRatio: 0.50,
          suggestedStake: 50.0,
        },
      ],
    },
    {
      eventId: nflEvent.id,
      event: nflEvent,
      marketType: 'h2h',
      profitPercentage: 0.8,
      totalStake: 100,
      guaranteedProfit: 0.80,
      legs: [
        {
          outcomeName: 'Bills',
          bookId: 'fanatics',
          odds: -145,
          stakeRatio: 0.60,
          suggestedStake: 60.0,
        },
        {
          outcomeName: 'Jets',
          bookId: 'ballybet',
          odds: 155,
          stakeRatio: 0.40,
          suggestedStake: 40.0,
        },
      ],
    },
  ];
}
