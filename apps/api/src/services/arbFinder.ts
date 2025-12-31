import type { Event, ArbitrageOpportunity, ArbitrageLeg, SportsbookId } from '@ny-sharp-edge/shared';
import { detectArbitrage } from '@ny-sharp-edge/shared';

interface ArbFinderOptions {
  minProfit?: number; // Minimum profit % to include (default 0.1%)
  totalStake?: number; // Total stake for calculations (default $100)
}

/**
 * Find arbitrage opportunities from a list of events
 *
 * Strategy: For each market, compare best odds from different books
 * on opposite sides. If sum of implied probabilities < 100%, arb exists.
 */
export function findArbitrageOpportunities(
  events: Event[],
  options: ArbFinderOptions = {}
): ArbitrageOpportunity[] {
  const { minProfit = 0.1, totalStake = 100 } = options;
  const opportunities: ArbitrageOpportunity[] = [];

  for (const event of events) {
    for (const market of event.markets) {
      // Need exactly 2 outcomes for arbitrage calculation
      if (market.outcomes.length !== 2) continue;

      const [outcome1, outcome2] = market.outcomes;

      // Need odds from at least one book on each side
      if (outcome1.bookOdds.length < 1 || outcome2.bookOdds.length < 1) continue;

      // Check all combinations of books for arbitrage
      for (const book1Odds of outcome1.bookOdds) {
        for (const book2Odds of outcome2.bookOdds) {
          // Can't arbitrage with the same book
          if (book1Odds.bookId === book2Odds.bookId) continue;

          const result = detectArbitrage(book1Odds.odds, book2Odds.odds);

          if (result.isArbitrage && result.profitPercentage >= minProfit) {
            const stake1 = totalStake * result.stake1Ratio;
            const stake2 = totalStake * result.stake2Ratio;
            const guaranteedProfit = (result.profitPercentage / 100) * totalStake;

            const legs: ArbitrageLeg[] = [
              {
                outcomeName: outcome1.name,
                bookId: book1Odds.bookId as SportsbookId,
                odds: book1Odds.odds,
                stakeRatio: result.stake1Ratio,
                suggestedStake: Math.round(stake1 * 100) / 100,
              },
              {
                outcomeName: outcome2.name,
                bookId: book2Odds.bookId as SportsbookId,
                odds: book2Odds.odds,
                stakeRatio: result.stake2Ratio,
                suggestedStake: Math.round(stake2 * 100) / 100,
              },
            ];

            opportunities.push({
              eventId: event.id,
              event,
              marketType: market.type,
              profitPercentage: result.profitPercentage,
              legs,
              totalStake,
              guaranteedProfit: Math.round(guaranteedProfit * 100) / 100,
            });
          }
        }
      }
    }
  }

  // Sort by profit percentage descending and deduplicate
  const sorted = opportunities.sort((a, b) => b.profitPercentage - a.profitPercentage);

  // Remove duplicate arbs (same event + market, keep highest profit)
  const seen = new Set<string>();
  return sorted.filter((opp) => {
    const key = `${opp.eventId}-${opp.marketType}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}
