import { getVenue, VENUES } from './index.js';

/** Books we ask about at signup. Curated — not every Odds API key. */
export const SELECTABLE_BOOK_IDS = [
  'fanduel',
  'draftkings',
  'betmgm',
  'caesars',
  'betrivers',
  'fanatics',
  'espnbet',
  'hardrockbet',
  'bet365',
  'thescore',
  'ballybet',
  'betparx',
  'bovada',
  'betonlineag',
  'pinnacle',
  'kalshi',
  'polymarket',
] as const;

export type SelectableBookId = (typeof SELECTABLE_BOOK_IDS)[number];

export function selectableVenues() {
  return SELECTABLE_BOOK_IDS.map((id) => VENUES[id] ?? getVenue(id));
}

export function parseUserBooks(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  const allowed = new Set<string>(SELECTABLE_BOOK_IDS);
  const out: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') continue;
    if (!allowed.has(item)) continue;
    if (!out.includes(item)) out.push(item);
  }
  return out;
}

export function hasBooksSetup(meta: unknown): boolean {
  if (!meta || typeof meta !== 'object') return false;
  const rec = meta as Record<string, unknown>;
  return rec.booksSet === true || Array.isArray(rec.books);
}
