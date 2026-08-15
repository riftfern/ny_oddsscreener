import type { Event, EVOpportunity, MarketType } from '@ny-sharp-edge/shared';
import {
  calculateEV,
  calculateNoVigOdds,
  kellyStakeAmerican,
  SHARP_BOOK_PRIORITY,
} from '@ny-sharp-edge/shared';

interface CrossVenueEVOptions {
  minEV?: number;
  bankroll?: number;
  kellyFraction?: number;
}

type MarketOutcome = Event['markets'][0]['outcomes'][0];

const EXCHANGE_BOOK_IDS = new Set(['kalshi', 'polymarket']);

function isExchangeBook(bookId: string): boolean {
  return EXCHANGE_BOOK_IDS.has(bookId);
}

function isSharpBook(bookId: string): boolean {
  return (SHARP_BOOK_PRIORITY as readonly string[]).includes(bookId);
}

/**
 * Find +EV opportunities that only appear when sportsbook lines and exchange
 * (Kalshi/Polymarket) lines are joined on the same event.id.
 *
 * This is intentionally conservative:
 * - Joins only on exact `event.id` matches (no fuzzy team-name matching).
 * - 2-way markets only.
 * - Source 'pinnacle': Pinnacle no-vig is the fair line; an exchange price beats it.
 * - Source 'exchange': exchange no-vig mid is the fair line; a soft book beats it.
 *
 * If The Odds API does not share event ids across regions, this returns []
 * and Exchanges should ship as a parallel screen only.
 */
export function findCrossVenueEVOpportunities(
  defaultEvents: Event[],
  exchangeEvents: Event[],
  options: CrossVenueEVOptions = {}
): EVOpportunity[] {
  const { minEV = 1, bankroll = 1000, kellyFraction = 0.25 } = options;
  const opportunities: EVOpportunity[] = [];

  const exchangeById = new Map(exchangeEvents.map((e) => [e.id, e]));

  for (const event of defaultEvents) {
    const exchangeEvent = exchangeById.get(event.id);
    if (!exchangeEvent) continue;

    for (const market of event.markets) {
      if (market.type !== 'h2h' || market.outcomes.length !== 2) continue;

      const exchangeMarket = exchangeEvent.markets.find(
        (m) => m.type === market.type && m.outcomes.length === 2
      );
      if (!exchangeMarket) continue;

      const [outcome1, outcome2] = market.outcomes;
      const [exOutcome1, exOutcome2] = exchangeMarket.outcomes;

      // Match outcomes by name so a home/away flip doesn't misalign.
      const exForOutcome1 =
        exOutcome1.name === outcome1.name ? exOutcome1 : exOutcome2;
      const exForOutcome2 =
        exOutcome1.name === outcome2.name ? exOutcome1 : exOutcome2;
      if (exForOutcome1.name !== outcome1.name || exForOutcome2.name !== outcome2.name) {
        continue;
      }

      // Case A: Pinnacle no-vig fair line; exchange price may be +EV.
      const sharp1 = outcome1.bookOdds.find((bo) => bo.bookId === 'pinnacle');
      const sharp2 = outcome2.bookOdds.find((bo) => bo.bookId === 'pinnacle');
      if (sharp1 && sharp2) {
        const fair = calculateNoVigOdds(sharp1.odds, sharp2.odds);
        opportunities.push(
          ...checkSide(event, market.type, outcome1, exForOutcome1.bookOdds, fair.fairProb1, fair.fairOdds1, 'pinnacle', minEV, bankroll, kellyFraction),
          ...checkSide(event, market.type, outcome2, exForOutcome2.bookOdds, fair.fairProb2, fair.fairOdds2, 'pinnacle', minEV, bankroll, kellyFraction),
        );
      }

      // Case B: each exchange venue's own no-vig mid is the fair line.
      // Never pair Kalshi on one side with Polymarket on the other.
      const softBooks1 = outcome1.bookOdds.filter(
        (bo) => !isSharpBook(bo.bookId) && !isExchangeBook(bo.bookId)
      );
      const softBooks2 = outcome2.bookOdds.filter(
        (bo) => !isSharpBook(bo.bookId) && !isExchangeBook(bo.bookId)
      );
      for (const venue of EXCHANGE_BOOK_IDS) {
        const exBook1 = exForOutcome1.bookOdds.find((bo) => bo.bookId === venue);
        const exBook2 = exForOutcome2.bookOdds.find((bo) => bo.bookId === venue);
        if (!exBook1 || !exBook2) continue;
        const fair = calculateNoVigOdds(exBook1.odds, exBook2.odds);
        opportunities.push(
          ...checkSide(event, market.type, outcome1, softBooks1, fair.fairProb1, fair.fairOdds1, 'exchange', minEV, bankroll, kellyFraction),
          ...checkSide(event, market.type, outcome2, softBooks2, fair.fairProb2, fair.fairOdds2, 'exchange', minEV, bankroll, kellyFraction),
        );
      }
    }
  }

  return opportunities.sort((a, b) => b.evPercentage - a.evPercentage);
}

function checkSide(
  event: Event,
  marketType: MarketType,
  outcome: MarketOutcome,
  bookOdds: MarketOutcome['bookOdds'],
  fairProbability: number,
  fairOdds: number,
  source: 'pinnacle' | 'exchange',
  minEV: number,
  bankroll: number,
  kellyFraction: number
): EVOpportunity[] {
  const result: EVOpportunity[] = [];

  for (const bookOdd of bookOdds) {
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
      source,
    });
  }

  return result;
}
