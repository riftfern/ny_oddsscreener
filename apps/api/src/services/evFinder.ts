import type { Event, EVOpportunity, MarketType } from '@ny-sharp-edge/shared';
import {
  calculateNoVigOdds,
  calculateEV,
  kellyStakeAmerican,
  pickSharpOdds,
  SHARP_BOOK_PRIORITY,
} from '@ny-sharp-edge/shared';
import { getOddsPapiSharpOdds, type SharpOutcomeOdds } from './oddsPapi.js';
import { normalizeTitle } from './eventMatch.js';

interface EVFinderOptions {
  minEV?: number; // Minimum EV% to include (default 1%)
  bankroll?: number; // For Kelly calculations (default $1000)
  kellyFraction?: number; // Kelly fraction (default 0.25)
}

type MarketOutcome = Event['markets'][0]['outcomes'][0];

function normalizeName(value: string): string {
  return normalizeTitle(value);
}

function attachFallbackOdds(
  outcomes: MarketOutcome[],
  fallback: SharpOutcomeOdds[]
): MarketOutcome[] {
  if (fallback.length === 0) return outcomes;

  return outcomes.map((outcome, index) => {
    const byName = fallback.find((f) => normalizeName(f.name) === normalizeName(outcome.name));
    const byPosition = fallback[index];
    const chosen = byName ?? (fallback.length === 2 ? byPosition : undefined);
    if (!chosen || chosen.bookOdds.length === 0) return outcome;

    const pinnacle = chosen.bookOdds[0];
    if (outcome.bookOdds.some((bo) => bo.bookId === 'pinnacle')) return outcome;

    return {
      ...outcome,
      bookOdds: [...outcome.bookOdds, pinnacle],
    };
  });
}

/**
 * Find +EV opportunities from a list of events.
 *
 * Strategy: the fair line comes from a SHARP source (Pinnacle no-vig), never
 * from best retail odds. For each 2-way market we pick the sharp book on each
 * side; if either side lacks a sharp book we try the OddsPapi fallback when it
 * is configured. If no sharp line is available we skip the market entirely
 * rather than silently treating a soft book (e.g. FanDuel) as the fair line.
 * Then we compare every NON-sharp book's price to that fair probability.
 */
export async function findEVOpportunities(
  events: Event[],
  options: EVFinderOptions = {}
): Promise<EVOpportunity[]> {
  const { minEV = 1, bankroll = 1000, kellyFraction = 0.25 } = options;
  const opportunities: EVOpportunity[] = [];

  for (const event of events) {
    for (const market of event.markets) {
      // Need exactly 2 outcomes for fair odds calculation
      if (market.outcomes.length !== 2) continue;

      let [outcome1, outcome2] = market.outcomes;

      // Fair line = sharp book no-vig on each side.
      let sharp1 = pickSharpOdds(outcome1.bookOdds);
      let sharp2 = pickSharpOdds(outcome2.bookOdds);

      // OddsPapi fallback: fetch Pinnacle for this event/market when configured.
      if (!sharp1 || !sharp2) {
        const fallback = await getOddsPapiSharpOdds(event, market.type);
        if (fallback.length > 0) {
          const enriched = attachFallbackOdds(market.outcomes, fallback);
          [outcome1, outcome2] = enriched;
          sharp1 = pickSharpOdds(outcome1.bookOdds);
          sharp2 = pickSharpOdds(outcome2.bookOdds);
        }
      }

      if (!sharp1 || !sharp2) continue; // skip: no sharp fair line available

      const fair = calculateNoVigOdds(sharp1.odds, sharp2.odds);

      // Compare every NON-sharp book's price against the sharp fair line.
      opportunities.push(
        ...checkSide(event, market.type, outcome1, fair.fairProb1, fair.fairOdds1, minEV, bankroll, kellyFraction),
        ...checkSide(event, market.type, outcome2, fair.fairProb2, fair.fairOdds2, minEV, bankroll, kellyFraction),
      );
    }
  }

  // Sort by EV% descending
  return opportunities.sort((a, b) => b.evPercentage - a.evPercentage);
}

function checkSide(
  event: Event,
  marketType: MarketType,
  outcome: MarketOutcome,
  fairProbability: number,
  fairOdds: number,
  minEV: number,
  bankroll: number,
  kellyFraction: number
): EVOpportunity[] {
  const result: EVOpportunity[] = [];

  for (const bookOdd of outcome.bookOdds) {
    // Never flag a sharp book against itself (Pinnacle vs Pinnacle is not +EV).
    if (SHARP_BOOK_PRIORITY.includes(bookOdd.bookId as (typeof SHARP_BOOK_PRIORITY)[number])) {
      continue;
    }

    const ev = calculateEV(bookOdd.odds, fairProbability);
    if (ev.evPercentage < minEV) continue;

    result.push({
      eventId: event.id,
      event,
      marketType,
      outcomeName: outcome.name,
      bookId: bookOdd.bookId,
      bookOdds: bookOdd.odds,
      fairOdds,
      fairProbability,
      evPercentage: ev.evPercentage,
      edge: ev.edge,
      kellySuggestion: kellyStakeAmerican(fairProbability, bookOdd.odds, bankroll, kellyFraction),
      source: 'pinnacle',
    });
  }

  return result;
}
