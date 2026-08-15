import type { Event, SportKey } from '@ny-sharp-edge/shared';
import { OddsCache, defaultTtlMs } from './oddsCache.js';
import { attachNativeMarket, findMatchingEvent, type NativeMarket } from './eventMatch.js';
import { fetchPolymarketMarkets } from './polymarket.js';
import { fetchKalshiMarkets } from './kalshi.js';

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

export async function enrichEventsWithNativeExchanges(
  sport: SportKey,
  events: Event[]
): Promise<Event[]> {
  if (events.length === 0) return events;
  try {
    const markets = await loadNativeMarkets();
    // sport is reserved so we only match against the caller's event list
    void sport;
    return mergeNativeOntoEvents(events, markets);
  } catch (err) {
    console.error('[native-ex] enrich failed:', err);
    return events;
  }
}
