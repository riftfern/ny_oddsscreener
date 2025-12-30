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

export interface Sportsbook {
  id: SportsbookId;
  name: string;
  shortName: string;
  color: string;
}

export const SPORTSBOOK_INFO: Record<SportsbookId, Sportsbook> = {
  fanduel: { id: 'fanduel', name: 'FanDuel', shortName: 'FD', color: '#1493ff' },
  draftkings: { id: 'draftkings', name: 'DraftKings', shortName: 'DK', color: '#53d337' },
  betmgm: { id: 'betmgm', name: 'BetMGM', shortName: 'MGM', color: '#c4a932' },
  caesars: { id: 'caesars', name: 'Caesars', shortName: 'CZR', color: '#0a4833' },
  betrivers: { id: 'betrivers', name: 'BetRivers', shortName: 'BR', color: '#1a73e8' },
  fanatics: { id: 'fanatics', name: 'Fanatics', shortName: 'FAN', color: '#000000' },
  ballybet: { id: 'ballybet', name: 'Bally Bet', shortName: 'BALLY', color: '#e31837' },
  bet365: { id: 'bet365', name: 'bet365', shortName: '365', color: '#027b5b' },
  thescore: { id: 'thescore', name: 'theScore Bet', shortName: 'SCR', color: '#ff6b00' },
};

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

export interface Sport {
  key: SportKey;
  name: string;
  shortName: string;
}

export const SPORT_INFO: Record<SportKey, Sport> = {
  americanfootball_nfl: { key: 'americanfootball_nfl', name: 'NFL', shortName: 'NFL' },
  basketball_nba: { key: 'basketball_nba', name: 'NBA', shortName: 'NBA' },
  baseball_mlb: { key: 'baseball_mlb', name: 'MLB', shortName: 'MLB' },
  icehockey_nhl: { key: 'icehockey_nhl', name: 'NHL', shortName: 'NHL' },
  americanfootball_ncaaf: { key: 'americanfootball_ncaaf', name: 'College Football', shortName: 'NCAAF' },
  basketball_ncaab: { key: 'basketball_ncaab', name: 'College Basketball', shortName: 'NCAAB' },
};

// Odds types
export type AmericanOdds = number; // e.g., -110, +150
export type DecimalOdds = number; // e.g., 1.91, 2.50
export type ImpliedProbability = number; // e.g., 0.524 (52.4%)

// Market types
export type MarketType = 'h2h' | 'spreads' | 'totals';

export interface OddsValue {
  american: AmericanOdds;
  decimal: DecimalOdds;
  impliedProbability: ImpliedProbability;
}

export interface BookOdds {
  bookId: SportsbookId;
  odds: AmericanOdds;
  line?: number; // For spreads/totals
  updatedAt: string;
}

export interface MarketOutcome {
  name: string; // Team name, Over/Under
  point?: number; // Spread or total line
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
  fairProbability: ImpliedProbability;
  evPercentage: number;
  edge: number;
  kellySuggestion?: number;
}

// Arbitrage Types
export interface ArbitrageOpportunity {
  eventId: string;
  event: Event;
  marketType: MarketType;
  profitPercentage: number;
  legs: ArbitrageLeg[];
  totalStake: number;
  guaranteedProfit: number;
}

export interface ArbitrageLeg {
  outcomeName: string;
  bookId: SportsbookId;
  odds: AmericanOdds;
  stakeRatio: number;
  suggestedStake: number;
}

// Filter/UI Types
export interface OddsFilter {
  sport: SportKey;
  date: 'today' | 'tomorrow' | 'week';
  marketType: MarketType | 'all';
  books: SportsbookId[];
}
