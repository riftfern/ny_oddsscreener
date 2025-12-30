import type { AmericanOdds } from '../types';
import { americanToDecimal, decimalToImplied } from './odds';

export interface ArbitrageResult {
  isArbitrage: boolean;
  profitPercentage: number;
  stake1Ratio: number;
  stake2Ratio: number;
}

/**
 * Detect arbitrage opportunity between two outcomes
 *
 * Arbitrage exists when the sum of implied probabilities < 100%
 * This means you can bet on both sides and guarantee a profit
 *
 * @param odds1 - American odds for outcome 1
 * @param odds2 - American odds for outcome 2
 * @returns Arbitrage details including profit % and stake ratios
 */
export function detectArbitrage(odds1: AmericanOdds, odds2: AmericanOdds): ArbitrageResult {
  const decimal1 = americanToDecimal(odds1);
  const decimal2 = americanToDecimal(odds2);

  const implied1 = decimalToImplied(decimal1);
  const implied2 = decimalToImplied(decimal2);

  const totalImplied = implied1 + implied2;

  if (totalImplied < 1) {
    // Arbitrage exists!
    const profitPercentage = (1 - totalImplied) * 100;

    // Calculate stake ratios to guarantee equal profit
    // Stake ratio = implied probability / total implied
    const stake1Ratio = implied1 / totalImplied;
    const stake2Ratio = implied2 / totalImplied;

    return {
      isArbitrage: true,
      profitPercentage,
      stake1Ratio,
      stake2Ratio,
    };
  }

  return {
    isArbitrage: false,
    profitPercentage: 0,
    stake1Ratio: 0,
    stake2Ratio: 0,
  };
}

export interface ArbitrageStakes {
  stake1: number;
  stake2: number;
  totalStake: number;
  guaranteedProfit: number;
  returnPercentage: number;
}

/**
 * Calculate optimal stakes for an arbitrage bet
 *
 * @param odds1 - American odds for outcome 1
 * @param odds2 - American odds for outcome 2
 * @param totalStake - Total amount to stake across both bets
 * @returns Stake amounts and guaranteed profit
 */
export function calculateArbitrageStakes(
  odds1: AmericanOdds,
  odds2: AmericanOdds,
  totalStake: number
): ArbitrageStakes | null {
  const arb = detectArbitrage(odds1, odds2);

  if (!arb.isArbitrage) {
    return null;
  }

  const stake1 = totalStake * arb.stake1Ratio;
  const stake2 = totalStake * arb.stake2Ratio;

  // Calculate return from either outcome (should be equal)
  const decimal1 = americanToDecimal(odds1);
  const return1 = stake1 * decimal1;

  const guaranteedProfit = return1 - totalStake;
  const returnPercentage = (guaranteedProfit / totalStake) * 100;

  return {
    stake1: Math.round(stake1 * 100) / 100,
    stake2: Math.round(stake2 * 100) / 100,
    totalStake,
    guaranteedProfit: Math.round(guaranteedProfit * 100) / 100,
    returnPercentage,
  };
}

/**
 * Find the best arbitrage opportunity across multiple books
 * for a two-way market
 *
 * @param outcome1Odds - Array of odds from different books for outcome 1
 * @param outcome2Odds - Array of odds from different books for outcome 2
 * @returns Best arbitrage opportunity if one exists
 */
export function findBestArbitrage(
  outcome1Odds: { bookId: string; odds: AmericanOdds }[],
  outcome2Odds: { bookId: string; odds: AmericanOdds }[]
): {
  book1: string;
  book2: string;
  odds1: AmericanOdds;
  odds2: AmericanOdds;
  profitPercentage: number;
} | null {
  let bestArb: ReturnType<typeof findBestArbitrage> = null;

  for (const o1 of outcome1Odds) {
    for (const o2 of outcome2Odds) {
      // Skip if same book (can't arb with yourself)
      if (o1.bookId === o2.bookId) continue;

      const result = detectArbitrage(o1.odds, o2.odds);

      if (result.isArbitrage) {
        if (!bestArb || result.profitPercentage > bestArb.profitPercentage) {
          bestArb = {
            book1: o1.bookId,
            book2: o2.bookId,
            odds1: o1.odds,
            odds2: o2.odds,
            profitPercentage: result.profitPercentage,
          };
        }
      }
    }
  }

  return bestArb;
}

/**
 * Check for middle bet opportunity
 * A middle exists when you can bet both sides of a spread/total
 * and potentially win both bets if the result falls between the lines
 *
 * @param line1 - Spread/total line for bet 1
 * @param line2 - Spread/total line for bet 2
 * @param odds1 - Odds for bet 1
 * @param odds2 - Odds for bet 2
 * @returns Whether a middle opportunity exists and the "window"
 */
export function detectMiddle(
  line1: number,
  line2: number,
  odds1: AmericanOdds,
  odds2: AmericanOdds
): { isMiddle: boolean; middleWindow: number; isArbitrage: boolean } {
  const middleWindow = Math.abs(line1 - line2);

  if (middleWindow === 0) {
    return {
      isMiddle: false,
      middleWindow: 0,
      isArbitrage: detectArbitrage(odds1, odds2).isArbitrage,
    };
  }

  // A middle exists if lines are different
  // The larger the window, the better chance of hitting the middle
  const arb = detectArbitrage(odds1, odds2);

  return {
    isMiddle: middleWindow > 0,
    middleWindow,
    isArbitrage: arb.isArbitrage,
  };
}
