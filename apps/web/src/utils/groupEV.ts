import type { EVOpportunity } from '@ny-sharp-edge/shared';

export interface GroupedEV {
  key: string;
  best: EVOpportunity;
  others: EVOpportunity[];
  line?: number;
}

export function lineOf(opp: EVOpportunity): number | undefined {
  const market = opp.event.markets.find((m) => m.type === opp.marketType);
  const outcome = market?.outcomes.find((o) => o.name === opp.outcomeName);
  const fromBook = outcome?.bookOdds.find((b) => b.bookId === opp.bookId)?.line;
  return fromBook ?? outcome?.point;
}

/** Same pick on many books → one row. Key: eventId|marketType|outcomeName|line. */
export function groupEVOpportunities(opps: EVOpportunity[]): GroupedEV[] {
  const buckets = new Map<string, EVOpportunity[]>();

  for (const opp of opps) {
    const line = lineOf(opp);
    const key = `${opp.eventId}|${opp.marketType}|${opp.outcomeName}|${line ?? ''}`;
    const list = buckets.get(key);
    if (list) list.push(opp);
    else buckets.set(key, [opp]);
  }

  const groups: GroupedEV[] = [];
  for (const [key, list] of buckets) {
    const sorted = [...list].sort((a, b) => b.bookOdds - a.bookOdds);
    groups.push({
      key,
      best: sorted[0],
      others: sorted.slice(1),
      line: lineOf(sorted[0]),
    });
  }

  return groups.sort((a, b) => b.best.evPercentage - a.best.evPercentage);
}
