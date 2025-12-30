import type { AmericanOdds, ImpliedProbability, DecimalOdds } from '../types';
import { americanToDecimal, decimalToImplied, impliedToAmerican } from './odds';

export interface NoVigResult {
  fairProb1: ImpliedProbability;
  fairProb2: ImpliedProbability;
  fairOdds1: AmericanOdds;
  fairOdds2: AmericanOdds;
  vigPercentage: number;
  hold: number;
}

/**
 * Calculate no-vig (fair) odds from a two-way market
 * Uses the multiplicative method to remove vig
 *
 * @param odds1 - American odds for outcome 1
 * @param odds2 - American odds for outcome 2
 * @returns Fair probabilities and odds for both sides
 */
export function calculateNoVigOdds(odds1: AmericanOdds, odds2: AmericanOdds): NoVigResult {
  const implied1 = decimalToImplied(americanToDecimal(odds1));
  const implied2 = decimalToImplied(americanToDecimal(odds2));

  const totalImplied = implied1 + implied2;
  const hold = totalImplied - 1;

  const fairProb1 = implied1 / totalImplied;
  const fairProb2 = implied2 / totalImplied;

  return {
    fairProb1,
    fairProb2,
    fairOdds1: impliedToAmerican(fairProb1),
    fairOdds2: impliedToAmerican(fairProb2),
    vigPercentage: hold * 100,
    hold,
  };
}

export interface EVResult {
  ev: number;
  evPercentage: number;
  edge: number;
  isPositiveEV: boolean;
}

/**
 * Calculate expected value of a bet
 *
 * @param betOdds - American odds being offered
 * @param fairProbability - True probability of the outcome (0-1)
 * @param stake - Stake amount (default 100 for percentage calculation)
 * @returns EV in dollars, as percentage, and edge
 */
export function calculateEV(
  betOdds: AmericanOdds,
  fairProbability: ImpliedProbability,
  stake: number = 100
): EVResult {
  const decimalOdds = americanToDecimal(betOdds);
  const potentialProfit = stake * (decimalOdds - 1);

  // EV = (probability of winning * profit) - (probability of losing * stake)
  const ev = fairProbability * potentialProfit - (1 - fairProbability) * stake;
  const evPercentage = (ev / stake) * 100;

  // Edge = fair probability - implied probability of bet odds
  const impliedProbability = decimalToImplied(decimalOdds);
  const edge = fairProbability - impliedProbability;

  return {
    ev,
    evPercentage,
    edge,
    isPositiveEV: ev > 0,
  };
}

/**
 * Calculate Kelly Criterion stake recommendation
 *
 * @param fairProbability - True probability of winning (0-1)
 * @param decimalOdds - Decimal odds being offered
 * @param bankroll - Total bankroll
 * @param fraction - Kelly fraction to use (default 0.25 for safety)
 * @returns Recommended stake amount
 */
export function kellyStake(
  fairProbability: ImpliedProbability,
  decimalOdds: DecimalOdds,
  bankroll: number,
  fraction: number = 0.25
): number {
  const b = decimalOdds - 1; // Net odds (profit per unit stake)
  const q = 1 - fairProbability; // Probability of losing

  // Kelly formula: f* = (bp - q) / b
  // where p = probability of winning, q = probability of losing, b = net odds
  const kelly = (fairProbability * b - q) / b;

  // Use fractional Kelly for safety (typically 1/4 Kelly)
  const fractionalKelly = kelly * fraction;

  // Never bet negative or more than bankroll
  return Math.max(0, Math.min(fractionalKelly * bankroll, bankroll));
}

/**
 * Calculate Kelly stake from American odds
 */
export function kellyStakeAmerican(
  fairProbability: ImpliedProbability,
  americanOdds: AmericanOdds,
  bankroll: number,
  fraction: number = 0.25
): number {
  return kellyStake(fairProbability, americanToDecimal(americanOdds), bankroll, fraction);
}

/**
 * Find +EV opportunities by comparing book odds to fair odds
 *
 * @param bookOdds - American odds offered by sportsbook
 * @param sharpOdds1 - Sharp book odds for outcome 1 (for fair odds calculation)
 * @param sharpOdds2 - Sharp book odds for outcome 2
 * @param minEV - Minimum EV% to consider (default 1%)
 * @returns EV result if positive EV, null otherwise
 */
export function findEVOpportunity(
  bookOdds: AmericanOdds,
  sharpOdds1: AmericanOdds,
  sharpOdds2: AmericanOdds,
  minEV: number = 1
): EVResult | null {
  const noVig = calculateNoVigOdds(sharpOdds1, sharpOdds2);
  const fairProb = noVig.fairProb1;

  const ev = calculateEV(bookOdds, fairProb);

  if (ev.evPercentage >= minEV) {
    return ev;
  }

  return null;
}
