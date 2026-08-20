import type { AmericanOdds } from '../types/index.js';
import { calculatePayout } from './odds.js';

/** Stake that returns `targetPayout` (stake+profit) at American odds. */
export function stakeForPayout(american: AmericanOdds, targetPayout: number): number {
  if (targetPayout <= 0) return 0;
  if (american > 0) return targetPayout / (1 + american / 100);
  if (american < 0) return targetPayout / (1 + 100 / Math.abs(american));
  return targetPayout;
}

export function isSeasonTicket(pos: {
  odds: number;
  note?: string;
  kind?: 'game' | 'future';
}): boolean {
  if (pos.kind === 'future') return true;
  if (pos.kind === 'game') return false;
  if (/future|super.?bowl|outright|season ticket|win the/i.test(pos.note ?? '')) return true;
  return Math.abs(pos.odds) >= 400;
}

/** Integers strictly inside an Over/Under window, e.g. O41.5 / U42.5 → [42]. */
export function totalsWindowHits(overLine: number, underLine: number): number[] {
  const lo = Math.min(overLine, underLine);
  const hi = Math.max(overLine, underLine);
  const start = Math.ceil(lo + 1e-6);
  const end = Math.floor(hi - 1e-6);
  const hits: number[] = [];
  for (let n = start; n <= end; n++) hits.push(n);
  return hits;
}

export function totalsWindowHint(overLine: number, underLine: number): string {
  const hits = totalsWindowHits(overLine, underLine);
  const gap = Math.abs(underLine - overLine);
  if (hits.length === 0) {
    return `Both cash in the ${gap}-pt window. Vig is the tax.`;
  }
  if (hits.length === 1) {
    return `Both cash if the total is ${hits[0]}.`;
  }
  return `Both cash if the total is ${hits[0]}–${hits[hits.length - 1]}.`;
}

export function hedgeCoverLine(params: {
  stake: number;
  odds: AmericanOdds;
  hedgeOdds: AmericanOdds;
}): { hedgeStake: number; hedgeReturn: number; ifOriginalWins: number } {
  const ifOriginalWins = calculatePayout(params.stake, params.odds);
  const hedgeStake = stakeForPayout(params.hedgeOdds, ifOriginalWins);
  const hedgeReturn = calculatePayout(hedgeStake, params.hedgeOdds);
  return { hedgeStake, hedgeReturn, ifOriginalWins };
}

/** Don't suggest covering a leftover with a -250 or worse steamroller. */
export const STEAMROLLER_HEDGE = -250;

export function isSteamrollerHedge(hedgeOdds: AmericanOdds): boolean {
  return hedgeOdds <= STEAMROLLER_HEDGE;
}

export function hedgeNets(
  originalStake: number,
  cover: { hedgeStake: number; hedgeReturn: number; ifOriginalWins: number }
): { ifOriginalWinsNet: number; ifHedgeWinsNet: number } {
  return {
    ifOriginalWinsNet: cover.ifOriginalWins - cover.hedgeStake,
    ifHedgeWinsNet: cover.hedgeReturn - originalStake,
  };
}

/** Both sides heavier than this are a vig sandwich, not a gift middle. */
export const UGLY_MIDDLE_ODDS = -200;

export function isUglyMiddle(oddsA: AmericanOdds, oddsB: AmericanOdds): boolean {
  return oddsA <= UGLY_MIDDLE_ODDS && oddsB <= UGLY_MIDDLE_ODDS;
}

export function windowTwoWayNet(
  stakeEach: number,
  oddsA: AmericanOdds,
  oddsB: AmericanOdds
): { both: number; onlyA: number; onlyB: number; worstOne: number } {
  const cost = 2 * stakeEach;
  const onlyA = calculatePayout(stakeEach, oddsA) - cost;
  const onlyB = calculatePayout(stakeEach, oddsB) - cost;
  return {
    both: calculatePayout(stakeEach, oddsA) + calculatePayout(stakeEach, oddsB) - cost,
    onlyA,
    onlyB,
    worstOne: Math.min(onlyA, onlyB),
  };
}

/** Exchange leftovers at ±5000+ are placeholder junk, not a market. */
export const ABSURD_EXCHANGE_ABS = 5000;

export function isAbsurdAmerican(odds: AmericanOdds): boolean {
  return Math.abs(odds) >= ABSURD_EXCHANGE_ABS;
}
