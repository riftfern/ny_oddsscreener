// Standalone types for API - no workspace dependencies

// NY Legal Sportsbooks
export const SPORTSBOOKS = {
  FANDUEL: 'fanduel',
  DRAFTKINGS: 'draftkings',
  BETMGM: 'betmgm',
  CAESARS: 'caesars',
  BETRIVERS: 'betrivers',
  FANATICS: 'fanatics',
  BALLYBET: 'ballybet',
  BET365: 'bet365',
  THESCORE: 'thescore',
} as const;

export type SportsbookId = (typeof SPORTSBOOKS)[keyof typeof SPORTSBOOKS];

// Sports
export const SPORTS = {
  NFL: 'americanfootball_nfl',
  NBA: 'basketball_nba',
  MLB: 'baseball_mlb',
  NHL: 'icehockey_nhl',
  NCAAF: 'americanfootball_ncaaf',
  NCAAB: 'basketball_ncaab',
} as const;

export type SportKey = (typeof SPORTS)[keyof typeof SPORTS];

// Odds types
export type AmericanOdds = number;
export type MarketType = 'h2h' | 'spreads' | 'totals';

export interface BookOdds {
  bookId: SportsbookId;
  odds: AmericanOdds;
  line?: number;
  updatedAt: string;
}

export interface MarketOutcome {
  name: string;
  point?: number;
  bookOdds: BookOdds[];
  bestOdds?: BookOdds;
}

export interface Market {
  type: MarketType;
  outcomes: MarketOutcome[];
}

export interface Event {
  id: string;
  sportKey: SportKey;
  homeTeam: string;
  awayTeam: string;
  commenceTime: string;
  markets: Market[];
}

// +EV Types
export interface EVOpportunity {
  eventId: string;
  event: Event;
  marketType: MarketType;
  outcomeName: string;
  bookId: SportsbookId;
  bookOdds: AmericanOdds;
  fairOdds: AmericanOdds;
  fairProbability: number;
  evPercentage: number;
  edge: number;
  kellySuggestion?: number;
}

// Arbitrage Types
export interface ArbitrageLeg {
  outcomeName: string;
  bookId: SportsbookId;
  odds: AmericanOdds;
  stakeRatio: number;
  suggestedStake: number;
}

export interface ArbitrageOpportunity {
  eventId: string;
  event: Event;
  marketType: MarketType;
  profitPercentage: number;
  legs: ArbitrageLeg[];
  totalStake: number;
  guaranteedProfit: number;
}
