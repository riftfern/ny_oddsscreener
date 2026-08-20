import { isTennisGroupKey, isTennisMajorKey, tennisMajorInfo } from './tennis.js';

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

// --- Venue catalog (data-driven books/exchanges/prediction markets) ---
export type VenueKind = 'sportsbook' | 'exchange' | 'prediction';
export type RegionKey = 'us' | 'us2' | 'us_ex' | 'uk' | 'eu' | 'au';

export interface Venue {
  id: string;            // Odds API bookmaker key, e.g. 'pinnacle', 'kalshi'
  name: string;
  shortName: string;
  color: string;
  deepLink: string;
  kind: VenueKind;
  regions: RegionKey[];
  isSharp?: boolean;     // pinnacle, and later circa / exchanges
  /** Sequential if-bets / reverses. Most NY retail books do not offer these. */
  supportsIfBets?: boolean;
}

// Every book we may show, keyed by Odds API bookmaker key. Kept alongside
// SPORTSBOOKS for now; SPORTSBOOKS is migrated off later (Task 1.6+).
const INK_DIM = '#8a8d84';
const PIN = '#c4b07a';

export const VENUES: Record<string, Venue> = {
  // US retail books — forest/grey chips only, no rainbow
  fanduel: { id: 'fanduel', name: 'FanDuel', shortName: 'FD', color: INK_DIM, deepLink: 'https://sportsbook.fanduel.com', kind: 'sportsbook', regions: ['us'] },
  draftkings: { id: 'draftkings', name: 'DraftKings', shortName: 'DK', color: INK_DIM, deepLink: 'https://sportsbook.draftkings.com', kind: 'sportsbook', regions: ['us'] },
  betmgm: { id: 'betmgm', name: 'BetMGM', shortName: 'MGM', color: INK_DIM, deepLink: 'https://sports.betmgm.com', kind: 'sportsbook', regions: ['us'] },
  caesars: { id: 'caesars', name: 'Caesars', shortName: 'CZR', color: INK_DIM, deepLink: 'https://sportsbook.caesars.com', kind: 'sportsbook', regions: ['us'] },
  betrivers: { id: 'betrivers', name: 'BetRivers', shortName: 'BR', color: INK_DIM, deepLink: 'https://betrivers.com', kind: 'sportsbook', regions: ['us'] },
  fanatics: { id: 'fanatics', name: 'Fanatics', shortName: 'FAN', color: INK_DIM, deepLink: 'https://sportsbook.fanatics.com', kind: 'sportsbook', regions: ['us'] },
  ballybet: { id: 'ballybet', name: 'Bally Bet', shortName: 'BALLY', color: INK_DIM, deepLink: 'https://www.ballybet.com', kind: 'sportsbook', regions: ['us'] },
  thescore: { id: 'thescore', name: 'theScore Bet', shortName: 'SCR', color: INK_DIM, deepLink: 'https://thescore.bet', kind: 'sportsbook', regions: ['us2'] },
  bet365: { id: 'bet365', name: 'bet365', shortName: '365', color: INK_DIM, deepLink: 'https://www.bet365.com', kind: 'sportsbook', regions: ['eu'] },
  // US books from other regions / non-NY legal
  bovada: { id: 'bovada', name: 'Bovada', shortName: 'BOV', color: INK_DIM, deepLink: 'https://www.bovada.lv', kind: 'sportsbook', regions: ['us'], supportsIfBets: true },
  lowvig: { id: 'lowvig', name: 'LowVig', shortName: 'LV', color: INK_DIM, deepLink: 'https://www.lowvig.ag', kind: 'sportsbook', regions: ['us'] },
  espnbet: { id: 'espnbet', name: 'ESPN BET', shortName: 'ESPN', color: INK_DIM, deepLink: 'https://thescore.bet', kind: 'sportsbook', regions: ['us2'] },
  betonlineag: { id: 'betonlineag', name: 'BetOnline AG', shortName: 'BOAG', color: INK_DIM, deepLink: '', kind: 'sportsbook', regions: ['us'] },
  betfair_ex_eu: { id: 'betfair_ex_eu', name: 'Betfair EX EU', shortName: 'BFX', color: INK_DIM, deepLink: '', kind: 'sportsbook', regions: ['eu'] },
  hardrockbet: { id: 'hardrockbet', name: 'Hard Rock Bet', shortName: 'HRB', color: INK_DIM, deepLink: '', kind: 'sportsbook', regions: ['us'] },
  unibet: { id: 'unibet', name: 'Unibet', shortName: 'UNI', color: INK_DIM, deepLink: '', kind: 'sportsbook', regions: ['eu'] },
  unibet_us: { id: 'unibet_us', name: 'Unibet US', shortName: 'UNI', color: INK_DIM, deepLink: '', kind: 'sportsbook', regions: ['us'] },
  unibet_uk: { id: 'unibet_uk', name: 'Unibet UK', shortName: 'UNI', color: INK_DIM, deepLink: '', kind: 'sportsbook', regions: ['uk'] },
  unibet_eu: { id: 'unibet_eu', name: 'Unibet EU', shortName: 'UNI', color: INK_DIM, deepLink: '', kind: 'sportsbook', regions: ['eu'] },
  betparx: { id: 'betparx', name: 'BetPARX', shortName: 'PRX', color: INK_DIM, deepLink: '', kind: 'sportsbook', regions: ['us'] },
  gtbets: { id: 'gtbets', name: 'GT Bets', shortName: 'GT', color: INK_DIM, deepLink: '', kind: 'sportsbook', regions: ['us'] },
  matchbook: { id: 'matchbook', name: 'Matchbook', shortName: 'MBK', color: INK_DIM, deepLink: '', kind: 'sportsbook', regions: ['eu'] },
  mybookieag: { id: 'mybookieag', name: 'MyBookie AG', shortName: 'MBA', color: INK_DIM, deepLink: '', kind: 'sportsbook', regions: ['us'] },
  coolbet: { id: 'coolbet', name: 'Coolbet', shortName: 'CLB', color: INK_DIM, deepLink: '', kind: 'sportsbook', regions: ['eu'] },
  // Sharp books (fair line)
  pinnacle: { id: 'pinnacle', name: 'Pinnacle', shortName: 'PIN', color: PIN, deepLink: 'https://www.pinnacle.com', kind: 'sportsbook', regions: ['eu'], isSharp: true },
  // Prediction markets
  kalshi: { id: 'kalshi', name: 'Kalshi', shortName: 'KAL', color: INK_DIM, deepLink: 'https://kalshi.com', kind: 'prediction', regions: ['us_ex'] },
  polymarket: { id: 'polymarket', name: 'Polymarket', shortName: 'PM', color: INK_DIM, deepLink: 'https://polymarket.com', kind: 'prediction', regions: ['us_ex'] },
};

const ACRONYMS = new Set(['ag', 'eu', 'us', 'uk', 'au', 'ex', 'nl', 'it', 'fr', 'es', 'espn', 'gt']);

/** Turn an Odds API book key into a display name, e.g. betonlineag → "BetOnline AG". */
export function humanizeBookId(bookId: string): string {
  const spaced = bookId
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])ag$/i, '$1 ag')
    .replace(/([a-z])bet$/i, '$1 bet');

  return spaced
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => {
      const lower = part.toLowerCase();
      if (ACRONYMS.has(lower)) return lower.toUpperCase();
      if (lower.endsWith('online') && lower.length > 6) {
        const stem = lower.slice(0, -6);
        return stem.charAt(0).toUpperCase() + stem.slice(1) + 'Online';
      }
      if (lower.endsWith('bookie') && lower.length > 6) {
        const stem = lower.slice(0, -6);
        return stem.charAt(0).toUpperCase() + stem.slice(1) + 'Bookie';
      }
      if (lower === 'hardrock') return 'Hard Rock';
      if (lower === 'parx') return 'PARX';
      return lower.charAt(0).toUpperCase() + lower.slice(1);
    })
    .join(' ');
}

function shortNameFromDisplay(name: string): string {
  const caps = name.replace(/[^A-Z]/g, '');
  if (caps.length >= 3) return caps.slice(0, 4);
  if (caps.length === 2) return caps;
  return name.replace(/[^A-Za-z0-9]/g, '').slice(0, 4).toUpperCase();
}

function fallbackVenue(bookId: string): Venue {
  const name = humanizeBookId(bookId);
  return {
    id: bookId,
    name,
    shortName: shortNameFromDisplay(name),
    color: INK_DIM,
    deepLink: '',
    kind: 'sportsbook',
    regions: [],
  };
}

export function getVenue(bookId: string): Venue {
  const known = VENUES[bookId];
  if (known) return known;
  if (bookId.startsWith('unibet')) {
    const base = VENUES.unibet;
    if (base) {
      return { ...base, id: bookId, name: humanizeBookId(bookId), shortName: shortNameFromDisplay(humanizeBookId(bookId)) };
    }
  }
  return fallbackVenue(bookId);
}

export function shopHref(bookId: string): string | undefined {
  const href = getVenue(bookId).deepLink?.trim();
  return href ? href : undefined;
}

export interface Sportsbook {
  id: SportsbookId;
  name: string;
  shortName: string;
  color: string;
  deepLink: string;
}

export const SPORTSBOOK_INFO: Record<SportsbookId, Sportsbook> = {
  fanduel: { id: 'fanduel', name: 'FanDuel', shortName: 'FD', color: INK_DIM, deepLink: 'https://sportsbook.fanduel.com' },
  draftkings: { id: 'draftkings', name: 'DraftKings', shortName: 'DK', color: INK_DIM, deepLink: 'https://sportsbook.draftkings.com' },
  betmgm: { id: 'betmgm', name: 'BetMGM', shortName: 'MGM', color: INK_DIM, deepLink: 'https://sports.betmgm.com' },
  caesars: { id: 'caesars', name: 'Caesars', shortName: 'CZR', color: INK_DIM, deepLink: 'https://sportsbook.caesars.com' },
  betrivers: { id: 'betrivers', name: 'BetRivers', shortName: 'BR', color: INK_DIM, deepLink: 'https://ny.betrivers.com' },
  fanatics: { id: 'fanatics', name: 'Fanatics', shortName: 'FAN', color: INK_DIM, deepLink: 'https://sportsbook.fanatics.com' },
  ballybet: { id: 'ballybet', name: 'Bally Bet', shortName: 'BALLY', color: INK_DIM, deepLink: 'https://www.ballybet.com' },
  bet365: { id: 'bet365', name: 'bet365', shortName: '365', color: INK_DIM, deepLink: 'https://www.bet365.com' },
  thescore: { id: 'thescore', name: 'theScore Bet', shortName: 'SCR', color: INK_DIM, deepLink: 'https://thescore.bet' },
};

// Sports
export const SPORTS = {
  NFL: 'americanfootball_nfl',
  NBA: 'basketball_nba',
  MLB: 'baseball_mlb',
  NHL: 'icehockey_nhl',
  NCAAF: 'americanfootball_ncaaf',
  NCAAB: 'basketball_ncaab',
  EPL: 'soccer_epl',
  MLS: 'soccer_usa_mls',
  TENNIS: 'tennis_majors',
} as const;

export type SportKey = (typeof SPORTS)[keyof typeof SPORTS];

/** Sport a NY retail user is most likely looking for tonight. */
export function inSeasonSport(now: Date = new Date()): SportKey {
  const m = now.getMonth();
  if (m >= 8 || m === 0) return SPORTS.NFL; // Sep–Jan
  if (m >= 1 && m <= 5) return SPORTS.NBA; // Feb–Jun
  return SPORTS.MLB; // Jul–Aug
}

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
  soccer_epl: { key: 'soccer_epl', name: 'Premier League', shortName: 'EPL' },
  soccer_usa_mls: { key: 'soccer_usa_mls', name: 'MLS', shortName: 'MLS' },
  tennis_majors: { key: 'tennis_majors', name: 'Tennis', shortName: 'TENNIS' },
};

/** Sport badge from event.sportKey. Never defaults to NFL. */
export function getSport(sportKey: string): Sport {
  const known = SPORT_INFO[sportKey as SportKey];
  if (known) return known;
  const slam = tennisMajorInfo(sportKey);
  if (slam) {
    return { key: sportKey as SportKey, name: slam.name, shortName: slam.shortName };
  }
  const bits = sportKey.split('_').filter(Boolean);
  const shortName = (bits[bits.length - 1] ?? sportKey).toUpperCase();
  return {
    key: sportKey as SportKey,
    name: sportKey,
    shortName,
  };
}

export function isKnownSport(sport: string): boolean {
  if (sport === 'all') return true;
  if (isTennisGroupKey(sport) || isTennisMajorKey(sport)) return true;
  return (Object.values(SPORTS) as string[]).includes(sport);
}

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
  bookId: string; // Odds API / VENUES key, e.g. 'fanduel', 'pinnacle'
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
  bookId: string; // widened: may be a sharp/exchange/prediction key
  bookOdds: AmericanOdds;
  fairOdds: AmericanOdds;
  fairProbability: ImpliedProbability;
  evPercentage: number;
  edge: number;
  kellySuggestion?: number;
  source?: 'pinnacle' | 'exchange'; // which side supplied the fair line
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
  bookId: string; // widened: may be a sharp/exchange/prediction key
  odds: AmericanOdds;
  stakeRatio: number;
  suggestedStake: number;
}

// Filter/UI Types
export interface OddsFilter {
  sport: SportKey;
  date: 'today' | 'tomorrow' | 'week';
  marketType: MarketType | 'all';
  books: string[];
}

// Betslip Types
export type SlipShape =
  | 'straight'
  | 'sgp'
  | 'round_robin'
  | 'teaser'
  | 'if_bet'
  | 'reverse'
  | 'window';

export interface BetSelection {
  id: string;
  eventId: string;
  event: Event;
  marketType: MarketType;
  outcomeName: string;
  bookId: string; // widened: may be a sharp/exchange/prediction key
  odds: AmericanOdds;
  line?: number;
  stake: number;
  addedAt: string;
  shape?: SlipShape;
  shapeId?: string;
  /** Teaser juice is unknown — do not show straight -110 as the tease price. */
  hideOdds?: boolean;
  sequence?: 'if' | 'then';
  teasePoints?: number;
  windowGap?: number;
  hedgeOf?: string;
}

/** One line on the slip. Does not append a number that is already in the name. */
export function formatPick(
  name: string,
  line?: number,
  marketType?: MarketType
): string {
  const trimmed = name.trim();
  if (line === undefined || marketType === 'h2h') return trimmed;
  const lineStr = String(line);
  const escaped = lineStr.replace('.', '\\.');
  if (new RegExp(`(?:^|\\s|→\\s*)\\+?${escaped}\\s*$`).test(trimmed)) return trimmed;
  if (marketType === 'totals') return `${trimmed} ${lineStr}`;
  const signed = line > 0 ? `+${line}` : lineStr;
  if (trimmed.endsWith(signed) || trimmed.endsWith(lineStr)) return trimmed;
  return `${trimmed} ${signed}`;
}

export * from './tennis.js';
export * from './shops.js';
export * from './userBooks.js';
export * from './alts.js';
