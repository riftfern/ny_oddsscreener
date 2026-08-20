import type { AmericanOdds, EVOpportunity } from '../types/index.js';
import { calculateEV } from './ev.js';
import { americanToImplied } from './odds.js';

/** Default floor for the quiet feed. Sub-2% is noise for a $19 retail tool. */
export const QUIET_MIN_EV = 2;

/** Edges this fat are usually a pulled or stale line, not a gift. Hidden unless asked. */
export const SUSPECT_EV = 20;

/** Soft “this is chunky, still show it” band. */
export const FAT_EV = 12;

export type EdgeQuality = 'ok' | 'fat' | 'suspect';

export function classifyEdge(evPercentage: number): EdgeQuality {
  if (evPercentage >= SUSPECT_EV) return 'suspect';
  if (evPercentage >= FAT_EV) return 'fat';
  return 'ok';
}

export function isQuietEdge(evPercentage: number, minEV = QUIET_MIN_EV): boolean {
  return evPercentage >= minEV && evPercentage < SUSPECT_EV;
}

/**
 * One-way signal: treat Pinnacle's implied as fair and score the shop price.
 * Used to badge Odds rows that look pulled (e.g. +1800 vs PIN +462).
 */
export function classifyPriceVsPin(
  shopOdds: AmericanOdds,
  pinOdds: AmericanOdds | undefined
): EdgeQuality {
  if (pinOdds === undefined) return 'ok';
  const fair = americanToImplied(pinOdds);
  if (!Number.isFinite(fair) || fair <= 0 || fair >= 1) return 'ok';
  return classifyEdge(calculateEV(shopOdds, fair).evPercentage);
}

export function opportunityUpdatedAt(opp: EVOpportunity): string | undefined {
  const market = opp.event.markets.find((m) => m.type === opp.marketType);
  const outcome = market?.outcomes.find((o) => o.name === opp.outcomeName);
  return outcome?.bookOdds.find((b) => b.bookId === opp.bookId)?.updatedAt;
}

export function minutesAgo(iso: string, now = Date.now()): number | null {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return null;
  return Math.max(0, Math.round((now - t) / 60_000));
}

export type LineFreshness = 'live' | 'aging' | 'stale' | 'unknown';

/** Book last_update is often a few minutes idle even when the cache is fresh. */
export function lineFreshness(iso: string | undefined, now = Date.now()): LineFreshness {
  if (!iso) return 'unknown';
  const mins = minutesAgo(iso, now);
  if (mins === null) return 'unknown';
  if (mins <= 5) return 'live';
  if (mins <= 15) return 'aging';
  return 'stale';
}

export function freshnessLabel(iso: string | undefined, now = Date.now()): string | null {
  if (!iso) return null;
  const mins = minutesAgo(iso, now);
  if (mins === null) return null;
  if (mins < 1) return 'just now';
  if (mins === 1) return '1m ago';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.round(mins / 60);
  return hours === 1 ? '1h ago' : `${hours}h ago`;
}
