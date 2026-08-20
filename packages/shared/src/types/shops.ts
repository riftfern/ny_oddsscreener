import type { BookOdds, Event, MarketType } from './index.js';

/** Pinnacle is the fair line, not a shop a US retail user opens. */
export function isSharpVenue(bookId: string): boolean {
  return bookId === 'pinnacle';
}

/** A book or exchange the user can actually bet. */
export function isPlaceableShop(bookId: string): boolean {
  return !isSharpVenue(bookId);
}

export function placeableOdds(bookOdds: BookOdds[], allowed?: string[] | null): BookOdds[] {
  if (allowed) {
    const allow = new Set(allowed);
    return bookOdds.filter((b) => allow.has(b.bookId));
  }
  return bookOdds.filter((b) => isPlaceableShop(b.bookId));
}

/** Best American price among shops the user can actually use. */
export function bestPlaceableOdds(
  bookOdds: BookOdds[],
  allowed?: string[] | null
): BookOdds | undefined {
  const shops = placeableOdds(bookOdds, allowed);
  if (shops.length === 0) return undefined;
  return shops.reduce((best, current) => (current.odds > best.odds ? current : best));
}

export function pinnacleOdds(bookOdds: BookOdds[]): BookOdds | undefined {
  return bookOdds.find((b) => b.bookId === 'pinnacle');
}

export function otherPlaceableOdds(
  bookOdds: BookOdds[],
  allowed?: string[] | null
): BookOdds[] {
  const best = bestPlaceableOdds(bookOdds, allowed);
  return placeableOdds(bookOdds, allowed)
    .filter((b) => b.bookId !== best?.bookId)
    .sort((a, b) => b.odds - a.odds);
}

/** This shop's price for the same pick, even if the line is a tick off. */
export function priceAtShop(
  event: Event,
  marketType: MarketType,
  outcomeName: string,
  bookId: string,
  line?: number
): { odds: number; line?: number } | undefined {
  const market = event.markets.find((m) => m.type === marketType);
  const outcome = market?.outcomes.find((o) => o.name === outcomeName);
  if (!outcome) return undefined;
  const sameLine = outcome.bookOdds.find(
    (b) =>
      b.bookId === bookId &&
      (line === undefined || b.line === undefined || b.line === line || outcome.point === line)
  );
  if (sameLine) return { odds: sameLine.odds, line: sameLine.line ?? line };
  const any = outcome.bookOdds.find((b) => b.bookId === bookId);
  if (!any) return undefined;
  return { odds: any.odds, line: any.line ?? outcome.point ?? line };
}

const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;
const TONIGHT_MS = 18 * 60 * 60 * 1000;

export type EventHorizon = 'tonight' | 'soon' | 'season';

/** Live or starting within the horizon. Drops far-out futures that empty the board. */
export function isUpcomingEvent(
  commenceTime: string,
  now: number = Date.now(),
  horizonMs: number = THREE_DAYS_MS
): boolean {
  const t = Date.parse(commenceTime);
  if (!Number.isFinite(t)) return true;
  return t >= now - THREE_HOURS_MS && t <= now + horizonMs;
}

export function eventInHorizon(
  commenceTime: string,
  horizon: EventHorizon,
  now: number = Date.now()
): boolean {
  if (horizon === 'tonight') return isUpcomingEvent(commenceTime, now, TONIGHT_MS);
  if (horizon === 'soon') return isUpcomingEvent(commenceTime, now, THREE_DAYS_MS);
  return isUpcomingEvent(commenceTime, now, Number.POSITIVE_INFINITY);
}

export interface SpreadWindow {
  gap: number;
  left: { name: string; bookId: string; line: number; odds: number };
  right: { name: string; bookId: string; line: number; odds: number };
}

/**
 * Tightest complete spread middle: opposite teams, opposite signs, gap = lineA + lineB.
 * Ignores same-side alt lines (Panthers +7 / Panthers +7.5 is not a window).
 */
export function findSpreadWindow(
  event: Event,
  shopIds?: string[] | null,
  minGap = 0.5
): SpreadWindow | null {
  const spreads = event.markets.find((m) => m.type === 'spreads');
  if (!spreads) return null;

  const byName = new Map<string, SpreadWindow['left'][]>();
  for (const outcome of spreads.outcomes) {
    const list = byName.get(outcome.name) ?? [];
    for (const bo of placeableOdds(outcome.bookOdds, shopIds)) {
      const line = bo.line ?? outcome.point;
      if (line === undefined) continue;
      list.push({ name: outcome.name, bookId: bo.bookId, line, odds: bo.odds });
    }
    if (list.length > 0) byName.set(outcome.name, list);
  }

  const names = [...byName.keys()];
  if (names.length < 2) return null;
  const [nameA, nameB] = names;

  let best: SpreadWindow | null = null;
  for (const qa of byName.get(nameA) ?? []) {
    for (const qb of byName.get(nameB) ?? []) {
      if (qa.bookId === qb.bookId) continue;
      if (qa.line !== 0 && qb.line !== 0 && qa.line * qb.line > 0) continue;
      const gap = qa.line + qb.line;
      if (gap < minGap) continue;
      if (!best || gap < best.gap) best = { gap, left: qa, right: qb };
    }
  }
  return best;
}

/** Local Monday–Sunday week key + label for grouping long slates. */
export function weekBucket(iso: string): { key: string; label: string } {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return { key: 'unknown', label: 'Later' };
  const monday = new Date(d.getFullYear(), d.getMonth(), d.getDate() - ((d.getDay() + 6) % 7));
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const pad = (n: number) => String(n).padStart(2, '0');
  const key = `${monday.getFullYear()}-${pad(monday.getMonth() + 1)}-${pad(monday.getDate())}`;
  const fmt = (x: Date) => x.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return { key, label: `${fmt(monday)} – ${fmt(sunday)}` };
}


