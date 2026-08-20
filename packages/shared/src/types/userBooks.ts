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

/** Default NY retail set — used before Clerk, so offshore ifs stay off the card. */
export const DEFAULT_NY_BOOKS: string[] = [
  'fanduel',
  'draftkings',
  'betmgm',
  'caesars',
  'betrivers',
  'fanatics',
  'espnbet',
];

export type RegionId = 'ny' | 'nj' | 'pa';

export interface RegionPreset {
  id: RegionId;
  label: string;
  shortLabel: string;
  books: string[];
}

/**
 * Location is a shortcut for “books I can open,” not a geo-fence.
 * NY is the default wedge; NJ/PA are the neighboring retail sets we already catalog.
 */
export const REGION_PRESETS: RegionPreset[] = [
  { id: 'ny', label: 'New York', shortLabel: 'NY', books: [...DEFAULT_NY_BOOKS] },
  {
    id: 'nj',
    label: 'New Jersey',
    shortLabel: 'NJ',
    books: [
      'fanduel',
      'draftkings',
      'betmgm',
      'caesars',
      'betrivers',
      'fanatics',
      'espnbet',
      'hardrockbet',
      'bet365',
    ],
  },
  {
    id: 'pa',
    label: 'Pennsylvania',
    shortLabel: 'PA',
    books: [
      'fanduel',
      'draftkings',
      'betmgm',
      'caesars',
      'betrivers',
      'fanatics',
      'espnbet',
      'betparx',
      'ballybet',
    ],
  },
];

export function matchingRegion(ids: string[]): RegionPreset | undefined {
  const set = new Set(ids);
  return REGION_PRESETS.find(
    (preset) => preset.books.length === set.size && preset.books.every((id) => set.has(id))
  );
}

export function booksCaption(ids: string[] | null | undefined): string {
  if (!ids || ids.length === 0) return 'your shops';
  const region = matchingRegion(ids);
  const n = ids.length;
  if (region) return `${n} ${region.label} shops`;
  return n === 1 ? '1 shop' : `${n} shops`;
}

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
