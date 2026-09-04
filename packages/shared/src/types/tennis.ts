/** Odds API keys for the four slams. There is no tennis_atp umbrella key. */
export const TENNIS_MAJORS = [
  { key: 'tennis_atp_aus_open_singles', name: 'ATP Australian Open', shortName: 'AO', slam: 'ao' },
  { key: 'tennis_wta_aus_open_singles', name: 'WTA Australian Open', shortName: 'AO', slam: 'ao' },
  { key: 'tennis_atp_french_open', name: 'ATP French Open', shortName: 'RG', slam: 'rg' },
  { key: 'tennis_wta_french_open', name: 'WTA French Open', shortName: 'RG', slam: 'rg' },
  { key: 'tennis_atp_wimbledon', name: 'ATP Wimbledon', shortName: 'WIM', slam: 'wim' },
  { key: 'tennis_wta_wimbledon', name: 'WTA Wimbledon', shortName: 'WIM', slam: 'wim' },
  { key: 'tennis_atp_us_open', name: 'ATP US Open', shortName: 'USO', slam: 'uso' },
  { key: 'tennis_wta_us_open', name: 'WTA US Open', shortName: 'USO', slam: 'uso' },
] as const;

export type TennisMajorKey = (typeof TENNIS_MAJORS)[number]['key'];
export type TennisSlam = (typeof TENNIS_MAJORS)[number]['slam'];

export const TENNIS_MAJOR_KEYS: TennisMajorKey[] = TENNIS_MAJORS.map((m) => m.key);

export const TENNIS_GROUP_KEY = 'tennis_majors';

const SLAM_WINDOWS: { slam: TennisSlam; start: number; end: number }[] = [
  { slam: 'ao', start: 101, end: 210 },
  { slam: 'rg', start: 518, end: 615 },
  { slam: 'wim', start: 620, end: 720 },
  { slam: 'uso', start: 810, end: 915 },
];

function monthDay(now: Date): number {
  return (now.getUTCMonth() + 1) * 100 + now.getUTCDate();
}

function keysForSlam(slam: TennisSlam): TennisMajorKey[] {
  return TENNIS_MAJORS.filter((m) => m.slam === slam).map((m) => m.key);
}

/** In-season slam keys only (ATP + WTA). Off-season → next slam, never all eight. */
export function inSeasonTennisMajorKeys(now: Date = new Date()): TennisMajorKey[] {
  const md = monthDay(now);
  const current = SLAM_WINDOWS.find((w) => md >= w.start && md <= w.end);
  if (current) return keysForSlam(current.slam);
  const next = SLAM_WINDOWS.find((w) => md < w.start) ?? SLAM_WINDOWS[0];
  return keysForSlam(next.slam);
}

export function isTennisMajorKey(key: string): boolean {
  return TENNIS_MAJOR_KEYS.includes(key as TennisMajorKey);
}

export function isTennisGroupKey(key: string): boolean {
  return key === TENNIS_GROUP_KEY;
}

export function tennisMajorInfo(key: string): (typeof TENNIS_MAJORS)[number] | undefined {
  return TENNIS_MAJORS.find((m) => m.key === key);
}

/**
 * UI/API sport → Odds API keys to fetch.
 * tennis_majors expands to the in-season slam only (2 keys, not 8).
 */
export function expandSportKeys(sport: string, now: Date = new Date()): string[] {
  if (isTennisGroupKey(sport)) return inSeasonTennisMajorKeys(now);
  return [sport];
}

/** One upcoming match from the tennis model, as shown on the private court page. */
export interface TennisLockerMatch {
  id: string;
  tour: 'ATP' | 'WTA' | string;
  tournament: string;
  surface: string;
  sportKey: string;
  commenceTime: string | null;
  playerA: string;
  playerB: string;
  probA: number;
  probB: number;
  oddsA: number | null;
  oddsB: number | null;
  americanA: number | null;
  americanB: number | null;
  evA: number | null;
  evB: number | null;
  edgeA: number | null;
  edgeB: number | null;
  confidence: number;
  ratingA: number;
  ratingB: number;
  pick: string;
  pickSide: 'A' | 'B';
  pickProb: number;
  pickOdds: number | null;
  pickAmerican: number | null;
  pickEv: number | null;
  isValue: boolean;
  thinData?: boolean;
  matchesA?: number;
  matchesB?: number;
  bookA?: string | null;
  bookB?: string | null;
}

export interface TennisLockerBoard {
  generatedAt: string;
  dataThrough: { atp?: string | null; wta?: string | null };
  ingestedLive: { atp: number; wta: number };
  totalMatches: number;
  playersRated: number;
  matchCount: number;
  pickCount: number;
  matches: TennisLockerMatch[];
  picks: TennisLockerMatch[];
  disclaimer?: string;
}
