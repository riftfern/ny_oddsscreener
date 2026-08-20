import type { MarketOutcome, MarketType } from './index.js';

export interface AltGroup {
  name: string;
  main: MarketOutcome;
  alts: MarketOutcome[];
}

/** Same team / Over-Under with more than one number → main + alts. */
export function groupAltOutcomes(outcomes: MarketOutcome[]): AltGroup[] {
  const byName = new Map<string, MarketOutcome[]>();
  for (const o of outcomes) {
    const list = byName.get(o.name) ?? [];
    list.push(o);
    byName.set(o.name, list);
  }
  const groups: AltGroup[] = [];
  for (const [name, list] of byName) {
    const scored = [...list].sort((a, b) => {
      const quotes = b.bookOdds.length - a.bookOdds.length;
      if (quotes !== 0) return quotes;
      const pa = Math.abs(a.point ?? 0);
      const pb = Math.abs(b.point ?? 0);
      return pa - pb;
    });
    groups.push({ name, main: scored[0], alts: scored.slice(1) });
  }
  return groups;
}

/** True when the alt number is easier for the bettor than the main. */
export function isBuyToward(
  marketType: MarketType,
  name: string,
  mainLine: number,
  altLine: number
): boolean {
  if (marketType === 'totals') {
    if (/^over$/i.test(name)) return altLine < mainLine;
    if (/^under$/i.test(name)) return altLine > mainLine;
  }
  if (marketType === 'spreads') return altLine > mainLine;
  return false;
}

/** Closest half-point (or other) buy toward the bettor. */
export function closestBuy(
  marketType: MarketType,
  name: string,
  mainLine: number,
  alts: MarketOutcome[]
): MarketOutcome | undefined {
  const toward = alts.filter((a) => {
    const line = a.point;
    return line !== undefined && isBuyToward(marketType, name, mainLine, line);
  });
  if (toward.length === 0) return undefined;
  return toward.sort(
    (a, b) => Math.abs((a.point ?? 0) - mainLine) - Math.abs((b.point ?? 0) - mainLine)
  )[0];
}
