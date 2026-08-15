import type { Event, SportKey } from '@ny-sharp-edge/shared';
import { OddsCache, defaultTtlMs } from './oddsCache.js';
import { attachNativeMarket, findMatchingEvent, type NativeMarket } from './eventMatch.js';
import { fetchPolymarketMarkets } from './polymarket.js';
import { fetchKalshiMarkets } from './kalshi.js';

const PREDICTION_SPORT_KEY = 'prediction' as SportKey;

const nativeCache = new OddsCache<NativeMarket[]>(() => defaultTtlMs());

export function clearNativeExchangeCache(): void {
  nativeCache.clear();
}

async function loadNativeMarkets(): Promise<NativeMarket[]> {
  const cached = nativeCache.get('all');
  if (cached) return cached;

  const settled = await Promise.allSettled([fetchPolymarketMarkets(), fetchKalshiMarkets()]);
  const markets: NativeMarket[] = [];
  for (const result of settled) {
    if (result.status === 'fulfilled') {
      markets.push(...result.value);
    } else {
      console.error('[native-ex] adapter failed:', result.reason);
    }
  }
  nativeCache.set('all', markets);
  return markets;
}

function buildUnmatchedEvent(market: NativeMarket, sportKey: SportKey): Event {
  const now = new Date().toISOString();
  return {
    id: market.id,
    sportKey,
    homeTeam: market.yesName,
    awayTeam: market.noName,
    commenceTime: market.commenceTime ?? now,
    markets: [
      {
        type: 'h2h',
        outcomes: [
          {
            name: market.yesName,
            point: undefined,
            bookOdds: [{ bookId: market.venue, odds: market.yesAmerican, updatedAt: now }],
            bestOdds: { bookId: market.venue, odds: market.yesAmerican, updatedAt: now },
          },
          {
            name: market.noName,
            point: undefined,
            bookOdds: [{ bookId: market.venue, odds: market.noAmerican, updatedAt: now }],
            bestOdds: { bookId: market.venue, odds: market.noAmerican, updatedAt: now },
          },
        ],
      },
    ],
  };
}

/**
 * Overlay Kalshi/Polymarket prices onto sportsbook events when titles match.
 * Unmatched native markets are omitted (Exchanges stays sport-scoped).
 */
export function mergeNativeOntoEvents(events: Event[], markets: NativeMarket[]): Event[] {
  const now = new Date().toISOString();
  return events.map((event) => {
    let next = event;
    for (const market of markets) {
      const match = findMatchingEvent(market.title, [event], market.id);
      if (match) {
        next = attachNativeMarket(next, market, now);
      }
    }
    return next;
  });
}

export interface EnrichedExchanges {
  events: Event[];
  unmatched: Event[];
}

/**
 * Overlay matched native markets onto sportsbook events and return the leftover
 * unmatched native markets as standalone Yes/No events.
 *
 * An unmatched market is assigned the requested sport key when its title matches
 * one of the provided events; otherwise it is tagged with the special
 * 'prediction' sport key and excluded from the sport-scoped event list.
 */
export async function enrichEventsWithNativeExchanges(
  sport: SportKey,
  events: Event[]
): Promise<EnrichedExchanges> {
  try {
    const markets = await loadNativeMarkets();
    const matched = events.length > 0 ? mergeNativeOntoEvents(events, markets) : [];

    const matchedIds = new Set<string>();
    for (const event of events) {
      for (const market of markets) {
        if (findMatchingEvent(market.title, [event], market.id)) {
          matchedIds.add(market.id);
        }
      }
    }

    const unmatched: Event[] = [];
    for (const market of markets) {
      if (matchedIds.has(market.id)) continue;
      const sportMatch = events.some((event) => findMatchingEvent(market.title, [event], market.id));
      const sportKey = sportMatch ? sport : PREDICTION_SPORT_KEY;
      unmatched.push(buildUnmatchedEvent(market, sportKey));
    }

    return { events: matched, unmatched };
  } catch (err) {
    console.error('[native-ex] enrich failed:', err);
    return { events, unmatched: [] };
  }
}
