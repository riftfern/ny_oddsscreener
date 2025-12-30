import type { AmericanOdds, DecimalOdds, ImpliedProbability, OddsValue } from '../types';

/**
 * Convert American odds to decimal odds
 * @example americanToDecimal(-110) => 1.909
 * @example americanToDecimal(+150) => 2.5
 */
export function americanToDecimal(american: AmericanOdds): DecimalOdds {
  if (american > 0) {
    return american / 100 + 1;
  }
  return 100 / Math.abs(american) + 1;
}

/**
 * Convert decimal odds to American odds
 * @example decimalToAmerican(1.909) => -110
 * @example decimalToAmerican(2.5) => +150
 */
export function decimalToAmerican(decimal: DecimalOdds): AmericanOdds {
  if (decimal >= 2) {
    return Math.round((decimal - 1) * 100);
  }
  return Math.round(-100 / (decimal - 1));
}

/**
 * Convert decimal odds to implied probability
 * @example decimalToImplied(1.909) => 0.524
 */
export function decimalToImplied(decimal: DecimalOdds): ImpliedProbability {
  return 1 / decimal;
}

/**
 * Convert American odds to implied probability
 * @example americanToImplied(-110) => 0.524
 */
export function americanToImplied(american: AmericanOdds): ImpliedProbability {
  return decimalToImplied(americanToDecimal(american));
}

/**
 * Convert implied probability to decimal odds
 * @example impliedToDecimal(0.524) => 1.908
 */
export function impliedToDecimal(implied: ImpliedProbability): DecimalOdds {
  return 1 / implied;
}

/**
 * Convert implied probability to American odds
 * @example impliedToAmerican(0.524) => -110
 */
export function impliedToAmerican(implied: ImpliedProbability): AmericanOdds {
  return decimalToAmerican(impliedToDecimal(implied));
}

/**
 * Get full odds value object from American odds
 */
export function getOddsValue(american: AmericanOdds): OddsValue {
  const decimal = americanToDecimal(american);
  return {
    american,
    decimal,
    impliedProbability: decimalToImplied(decimal),
  };
}

/**
 * Format American odds as string with + prefix for positive
 * @example formatAmerican(-110) => "-110"
 * @example formatAmerican(150) => "+150"
 */
export function formatAmerican(american: AmericanOdds): string {
  if (american > 0) {
    return `+${american}`;
  }
  return `${american}`;
}

/**
 * Calculate potential payout for a bet
 * @param stake - Amount wagered
 * @param american - American odds
 * @returns Total payout (stake + profit)
 */
export function calculatePayout(stake: number, american: AmericanOdds): number {
  const decimal = americanToDecimal(american);
  return stake * decimal;
}

/**
 * Calculate profit from a bet
 * @param stake - Amount wagered
 * @param american - American odds
 * @returns Profit only (not including stake)
 */
export function calculateProfit(stake: number, american: AmericanOdds): number {
  return calculatePayout(stake, american) - stake;
}
