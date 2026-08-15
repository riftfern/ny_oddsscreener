import { impliedToAmerican } from '@ny-sharp-edge/shared';

/** Clamp a probability so American conversion stays defined. */
export function clampProbability(value: number): number {
  if (!Number.isFinite(value)) return 0.5;
  return Math.min(0.99, Math.max(0.01, value));
}

/** Polymarket yes price 0–1 → American odds. */
export function probabilityToAmerican(probability: number): number {
  return impliedToAmerican(clampProbability(probability));
}

/** Kalshi last/yes price in cents (0–100) → American odds. */
export function centsToAmerican(cents: number): number {
  return probabilityToAmerican(cents / 100);
}
