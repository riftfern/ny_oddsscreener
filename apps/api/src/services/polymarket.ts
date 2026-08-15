import { probabilityToAmerican } from './priceConvert.js';
import type { NativeMarket } from './eventMatch.js';

const GAMMA = 'https://gamma-api.polymarket.com';

interface GammaMarket {
  question?: string;
  outcomes?: string;
  outcomePrices?: string;
  closed?: boolean;
}

interface GammaEvent {
  id?: string | number;
  title?: string;
  startDate?: string;
  endDate?: string;
  markets?: GammaMarket[];
}

function parseJsonArray(raw: string | undefined): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

export function gammaEventsToNative(events: GammaEvent[]): NativeMarket[] {
  const now = Date.now();
  const markets: NativeMarket[] = [];

  for (const event of events) {
    const title = event.title ?? '';
    for (const market of event.markets ?? []) {
      if (market.closed) continue;
      const outcomes = parseJsonArray(market.outcomes);
      const prices = parseJsonArray(market.outcomePrices).map(Number);
      if (outcomes.length < 2 || prices.length < 2) continue;
      if (!Number.isFinite(prices[0]) || !Number.isFinite(prices[1])) continue;

      markets.push({
        venue: 'polymarket',
        id: `pm:${event.id ?? market.question ?? title}`,
        title: market.question || title,
        yesName: outcomes[0],
        noName: outcomes[1],
        yesAmerican: probabilityToAmerican(prices[0]),
        noAmerican: probabilityToAmerican(prices[1]),
        commenceTime: event.startDate ?? event.endDate,
      });
    }
  }

  return markets.filter((m) => {
    if (!m.commenceTime) return true;
    const ts = Date.parse(m.commenceTime);
    return Number.isNaN(ts) || ts >= now - 86_400_000;
  });
}

export async function fetchPolymarketMarkets(): Promise<NativeMarket[]> {
  const url = `${GAMMA}/events?active=true&closed=false&limit=100&order=volume&ascending=false`;
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Polymarket Gamma error: ${response.status}`);
  }
  const body = (await response.json()) as GammaEvent[];
  return gammaEventsToNative(Array.isArray(body) ? body : []);
}
