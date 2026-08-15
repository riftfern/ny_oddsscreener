import type { BookOdds } from './index.js';

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

const THREE_HOURS_MS = 3 * 60 * 60 * 1000;
const THREE_DAYS_MS = 3 * 24 * 60 * 60 * 1000;

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
