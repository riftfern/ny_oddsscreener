import type { Event, SportKey, BookOdds, MarketOutcome, SportsbookId } from '@ny-sharp-edge/shared';
import { SPORTS, SPORTSBOOKS } from '@ny-sharp-edge/shared';

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

// NFL Mock Data
const NFL_EVENTS: Event[] = [
  {
    id: 'nfl-1',
    sportKey: SPORTS.NFL,
    homeTeam: 'New York Jets',
    awayTeam: 'Buffalo Bills',
    commenceTime: new Date(Date.now() + 3600000).toISOString(), // 1 hour from now
    markets: [
      {
        type: 'h2h',
        outcomes: createOutcomes('Buffalo Bills', 'New York Jets', -155, 130),
      },
      {
        type: 'spreads',
        outcomes: createOutcomes('Buffalo Bills', 'New York Jets', -110, -110, -3.5, 3.5),
      },
      {
        type: 'totals',
        outcomes: createOutcomes('Over', 'Under', -110, -110, 43.5, 43.5),
      },
    ],
  },
  {
    id: 'nfl-2',
    sportKey: SPORTS.NFL,
    homeTeam: 'New York Giants',
    awayTeam: 'Philadelphia Eagles',
    commenceTime: new Date(Date.now() + 7200000).toISOString(), // 2 hours from now
    markets: [
      {
        type: 'h2h',
        outcomes: createOutcomes('Philadelphia Eagles', 'New York Giants', -280, 225),
      },
      {
        type: 'spreads',
        outcomes: createOutcomes('Philadelphia Eagles', 'New York Giants', -110, -110, -6.5, 6.5),
      },
      {
        type: 'totals',
        outcomes: createOutcomes('Over', 'Under', -110, -110, 47.5, 47.5),
      },
    ],
  },
  {
    id: 'nfl-3',
    sportKey: SPORTS.NFL,
    homeTeam: 'Miami Dolphins',
    awayTeam: 'New England Patriots',
    commenceTime: new Date(Date.now() + 10800000).toISOString(), // 3 hours from now
    markets: [
      {
        type: 'h2h',
        outcomes: createOutcomes('Miami Dolphins', 'New England Patriots', -200, 165),
      },
      {
        type: 'spreads',
        outcomes: createOutcomes('Miami Dolphins', 'New England Patriots', -110, -110, -4.5, 4.5),
      },
      {
        type: 'totals',
        outcomes: createOutcomes('Over', 'Under', -105, -115, 48.5, 48.5),
      },
    ],
  },
];

// NBA Mock Data
const NBA_EVENTS: Event[] = [
  {
    id: 'nba-1',
    sportKey: SPORTS.NBA,
    homeTeam: 'New York Knicks',
    awayTeam: 'Los Angeles Lakers',
    commenceTime: new Date(Date.now() + 5400000).toISOString(),
    markets: [
      {
        type: 'h2h',
        outcomes: createOutcomes('Los Angeles Lakers', 'New York Knicks', 120, -140),
      },
      {
        type: 'spreads',
        outcomes: createOutcomes('Los Angeles Lakers', 'New York Knicks', -110, -110, 2.5, -2.5),
      },
      {
        type: 'totals',
        outcomes: createOutcomes('Over', 'Under', -110, -110, 224.5, 224.5),
      },
    ],
  },
  {
    id: 'nba-2',
    sportKey: SPORTS.NBA,
    homeTeam: 'Brooklyn Nets',
    awayTeam: 'Boston Celtics',
    commenceTime: new Date(Date.now() + 9000000).toISOString(),
    markets: [
      {
        type: 'h2h',
        outcomes: createOutcomes('Boston Celtics', 'Brooklyn Nets', -310, 250),
      },
      {
        type: 'spreads',
        outcomes: createOutcomes('Boston Celtics', 'Brooklyn Nets', -110, -110, -8.5, 8.5),
      },
      {
        type: 'totals',
        outcomes: createOutcomes('Over', 'Under', -108, -112, 219.5, 219.5),
      },
    ],
  },
  {
    id: 'nba-3',
    sportKey: SPORTS.NBA,
    homeTeam: 'Chicago Bulls',
    awayTeam: 'Milwaukee Bucks',
    commenceTime: new Date(Date.now() + 12600000).toISOString(),
    markets: [
      {
        type: 'h2h',
        outcomes: createOutcomes('Milwaukee Bucks', 'Chicago Bulls', -175, 150),
      },
      {
        type: 'spreads',
        outcomes: createOutcomes('Milwaukee Bucks', 'Chicago Bulls', -110, -110, -4, 4),
      },
      {
        type: 'totals',
        outcomes: createOutcomes('Over', 'Under', -110, -110, 231.5, 231.5),
      },
    ],
  },
];

// NHL Mock Data
const NHL_EVENTS: Event[] = [
  {
    id: 'nhl-1',
    sportKey: SPORTS.NHL,
    homeTeam: 'New York Rangers',
    awayTeam: 'Pittsburgh Penguins',
    commenceTime: new Date(Date.now() + 4800000).toISOString(),
    markets: [
      {
        type: 'h2h',
        outcomes: createOutcomes('New York Rangers', 'Pittsburgh Penguins', -145, 125),
      },
      {
        type: 'spreads',
        outcomes: createOutcomes('New York Rangers', 'Pittsburgh Penguins', 155, -185, -1.5, 1.5),
      },
      {
        type: 'totals',
        outcomes: createOutcomes('Over', 'Under', -110, -110, 6.5, 6.5),
      },
    ],
  },
  {
    id: 'nhl-2',
    sportKey: SPORTS.NHL,
    homeTeam: 'New York Islanders',
    awayTeam: 'New Jersey Devils',
    commenceTime: new Date(Date.now() + 8400000).toISOString(),
    markets: [
      {
        type: 'h2h',
        outcomes: createOutcomes('New Jersey Devils', 'New York Islanders', -130, 110),
      },
      {
        type: 'spreads',
        outcomes: createOutcomes('New Jersey Devils', 'New York Islanders', 145, -170, -1.5, 1.5),
      },
      {
        type: 'totals',
        outcomes: createOutcomes('Over', 'Under', -115, -105, 5.5, 5.5),
      },
    ],
  },
];

// MLB Mock Data (off-season placeholder)
const MLB_EVENTS: Event[] = [
  {
    id: 'mlb-1',
    sportKey: SPORTS.MLB,
    homeTeam: 'New York Yankees',
    awayTeam: 'Boston Red Sox',
    commenceTime: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
    markets: [
      {
        type: 'h2h',
        outcomes: createOutcomes('New York Yankees', 'Boston Red Sox', -135, 115),
      },
      {
        type: 'spreads',
        outcomes: createOutcomes('New York Yankees', 'Boston Red Sox', -125, 105, -1.5, 1.5),
      },
      {
        type: 'totals',
        outcomes: createOutcomes('Over', 'Under', -110, -110, 8.5, 8.5),
      },
    ],
  },
  {
    id: 'mlb-2',
    sportKey: SPORTS.MLB,
    homeTeam: 'New York Mets',
    awayTeam: 'Atlanta Braves',
    commenceTime: new Date(Date.now() + 90000000).toISOString(),
    markets: [
      {
        type: 'h2h',
        outcomes: createOutcomes('Atlanta Braves', 'New York Mets', -150, 130),
      },
      {
        type: 'spreads',
        outcomes: createOutcomes('Atlanta Braves', 'New York Mets', -135, 115, -1.5, 1.5),
      },
      {
        type: 'totals',
        outcomes: createOutcomes('Over', 'Under', -105, -115, 9, 9),
      },
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
  // Regenerate odds each time to simulate real-time updates
  const events = EVENTS_BY_SPORT[sport] || [];

  // Deep clone and regenerate odds to simulate updates
  return events.map((event) => ({
    ...event,
    markets: event.markets.map((market) => ({
      ...market,
      outcomes: market.outcomes.map((outcome) => {
        const newBookOdds = outcome.bookOdds.map((bo) => ({
          ...bo,
          odds: varyOdds(bo.odds, 3), // Small variance on each fetch
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
