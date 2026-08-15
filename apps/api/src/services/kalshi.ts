import { centsToAmerican } from './priceConvert.js';
import type { NativeMarket } from './eventMatch.js';

const KALSHI_URLS = [
  'https://api.elections.kalshi.com/trade-api/v2/markets',
  'https://external-api.kalshi.com/trade-api/v2/markets',
];

interface KalshiMarket {
  ticker?: string;
  title?: string;
  status?: string;
  yes_bid?: number;
  yes_ask?: number;
  last_price?: number;
  close_time?: string;
}

interface KalshiResponse {
  markets?: KalshiMarket[];
}

function midCents(market: KalshiMarket): number | undefined {
  if (typeof market.yes_bid === 'number' && typeof market.yes_ask === 'number' && market.yes_ask > 0) {
    return (market.yes_bid + market.yes_ask) / 2;
  }
  if (typeof market.last_price === 'number' && market.last_price > 0) {
    return market.last_price;
  }
  return undefined;
}

export function kalshiMarketsToNative(markets: KalshiMarket[]): NativeMarket[] {
  const result: NativeMarket[] = [];
  for (const market of markets) {
    if (market.status && market.status !== 'open' && market.status !== 'active') continue;
    const yesCents = midCents(market);
    if (yesCents === undefined) continue;
    const title = market.title ?? market.ticker ?? '';
    result.push({
      venue: 'kalshi',
      id: `kal:${market.ticker ?? title}`,
      title,
      yesName: 'Yes',
      noName: 'No',
      yesAmerican: centsToAmerican(yesCents),
      noAmerican: centsToAmerican(100 - yesCents),
      commenceTime: market.close_time,
    });
  }
  return result;
}

export async function fetchKalshiMarkets(): Promise<NativeMarket[]> {
  let lastError: Error | undefined;
  for (const base of KALSHI_URLS) {
    try {
      const url = `${base}?limit=200&status=open`;
      const response = await fetch(url);
      if (!response.ok) {
        lastError = new Error(`Kalshi error ${response.status} from ${base}`);
        continue;
      }
      const body = (await response.json()) as KalshiResponse;
      return kalshiMarketsToNative(body.markets ?? []);
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err));
    }
  }
  throw lastError ?? new Error('Kalshi fetch failed');
}
