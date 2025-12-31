import type { Event, EVOpportunity, SportsbookId, MarketType } from '@ny-sharp-edge/shared';
import {
  calculateNoVigOdds,
  calculateEV,
  kellyStakeAmerican,
  americanToImplied,
} from '@ny-sharp-edge/shared';

interface EVFinderOptions {
  minEV?: number; // Minimum EV% to include (default 1%)
  bankroll?: number; // For Kelly calculations (default $1000)
  kellyFraction?: number; // Kelly fraction (default 0.25)
}

/**
 * Find +EV opportunities from a list of events
 *
 * Strategy: Use the market consensus (average of all books) to calculate
 * fair odds, then find books offering better than fair value.
 */
export function findEVOpportunities(
  events: Event[],
  options: EVFinderOptions = {}
): EVOpportunity[] {
  const { minEV = 1, bankroll = 1000, kellyFraction = 0.25 } = options;
  const opportunities: EVOpportunity[] = [];

  for (const event of events) {
    for (const market of event.markets) {
      // Need exactly 2 outcomes for fair odds calculation
      if (market.outcomes.length !== 2) continue;

      const [outcome1, outcome2] = market.outcomes;

      // Need odds from at least one book on each side
      if (outcome1.bookOdds.length < 1 || outcome2.bookOdds.length < 1) continue;

      // Calculate fair odds using market consensus
      const fairOdds = calculateMarketConsensus(outcome1, outcome2);
      if (!fairOdds) continue;

      // Check each book's odds against fair value
      for (const bookOdd of outcome1.bookOdds) {
        const ev = calculateEV(bookOdd.odds, fairOdds.fairProb1);

        if (ev.evPercentage >= minEV) {
          opportunities.push({
            eventId: event.id,
            event,
            marketType: market.type,
            outcomeName: outcome1.name,
            bookId: bookOdd.bookId,
            bookOdds: bookOdd.odds,
            fairOdds: fairOdds.fairOdds1,
            fairProbability: fairOdds.fairProb1,
            evPercentage: ev.evPercentage,
            edge: ev.edge,
            kellySuggestion: kellyStakeAmerican(
              fairOdds.fairProb1,
              bookOdd.odds,
              bankroll,
              kellyFraction
            ),
          });
        }
      }

      for (const bookOdd of outcome2.bookOdds) {
        const ev = calculateEV(bookOdd.odds, fairOdds.fairProb2);

        if (ev.evPercentage >= minEV) {
          opportunities.push({
            eventId: event.id,
            event,
            marketType: market.type,
            outcomeName: outcome2.name,
            bookId: bookOdd.bookId,
            bookOdds: bookOdd.odds,
            fairOdds: fairOdds.fairOdds2,
            fairProbability: fairOdds.fairProb2,
            evPercentage: ev.evPercentage,
            edge: ev.edge,
            kellySuggestion: kellyStakeAmerican(
              fairOdds.fairProb2,
              bookOdd.odds,
              bankroll,
              kellyFraction
            ),
          });
        }
      }
    }
  }

  // Sort by EV% descending
  return opportunities.sort((a, b) => b.evPercentage - a.evPercentage);
}

interface FairOddsResult {
  fairProb1: number;
  fairProb2: number;
  fairOdds1: number;
  fairOdds2: number;
}

/**
 * Calculate fair odds using market consensus
 *
 * Takes the sharpest odds for each side (lowest vig combination)
 * to approximate true probabilities.
 */
function calculateMarketConsensus(
  outcome1: Event['markets'][0]['outcomes'][0],
  outcome2: Event['markets'][0]['outcomes'][0]
): FairOddsResult | null {
  // Find the best odds for each outcome (these represent the "sharpest" view)
  const bestOdds1 = outcome1.bestOdds?.odds;
  const bestOdds2 = outcome2.bestOdds?.odds;

  if (!bestOdds1 || !bestOdds2) return null;

  // Calculate no-vig fair odds from the best available odds
  const noVig = calculateNoVigOdds(bestOdds1, bestOdds2);

  return {
    fairProb1: noVig.fairProb1,
    fairProb2: noVig.fairProb2,
    fairOdds1: noVig.fairOdds1,
    fairOdds2: noVig.fairOdds2,
  };
}

/**
 * Alternative: Calculate consensus using average implied probability
 * across all books (more stable but less sharp)
 */
export function calculateAverageConsensus(
  outcome1: Event['markets'][0]['outcomes'][0],
  outcome2: Event['markets'][0]['outcomes'][0]
): FairOddsResult | null {
  if (outcome1.bookOdds.length === 0 || outcome2.bookOdds.length === 0) {
    return null;
  }

  // Average implied probability for each outcome
  const avgImplied1 =
    outcome1.bookOdds.reduce((sum, bo) => sum + americanToImplied(bo.odds), 0) /
    outcome1.bookOdds.length;

  const avgImplied2 =
    outcome2.bookOdds.reduce((sum, bo) => sum + americanToImplied(bo.odds), 0) /
    outcome2.bookOdds.length;

  // Normalize to remove vig
  const total = avgImplied1 + avgImplied2;
  const fairProb1 = avgImplied1 / total;
  const fairProb2 = avgImplied2 / total;

  // Convert back to American odds
  const fairOdds1 = fairProb1 >= 0.5
    ? Math.round(-100 * fairProb1 / (1 - fairProb1))
    : Math.round(100 * (1 - fairProb1) / fairProb1);

  const fairOdds2 = fairProb2 >= 0.5
    ? Math.round(-100 * fairProb2 / (1 - fairProb2))
    : Math.round(100 * (1 - fairProb2) / fairProb2);

  return { fairProb1, fairProb2, fairOdds1, fairOdds2 };
}
