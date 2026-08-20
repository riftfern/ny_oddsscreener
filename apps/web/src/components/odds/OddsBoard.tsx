import type { Event, MarketType } from '@ny-sharp-edge/shared';
import {
  bestPlaceableOdds,
  classifyPriceVsPin,
  closestBuy,
  formatAmerican,
  getSport,
  getVenue,
  groupAltOutcomes,
  otherPlaceableOdds,
  pinnacleOdds,
  shopHref,
  weekBucket,
  findSpreadWindow,
} from '@ny-sharp-edge/shared';
import { useBetslipStore } from '@/stores/betslipStore';

interface OddsBoardProps {
  events: Event[];
  marketType: MarketType;
  shopIds?: string[] | null;
}

function formatWhen(iso: string): string {
  const t = new Date(iso);
  return t.toLocaleString('en-US', {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function pickLabel(name: string, line?: number, marketType?: MarketType): string {
  if (line === undefined || marketType === 'h2h') return name;
  if (marketType === 'totals') return `${name} ${line}`;
  const signed = line > 0 ? `+${line}` : `${line}`;
  return `${name} ${signed}`;
}

export default function OddsBoard({ events, marketType, shopIds }: OddsBoardProps) {
  if (events.length === 0) return null;

  const grouped = new Map<string, { label: string; events: Event[] }>();
  for (const event of events) {
    const bucket = weekBucket(event.commenceTime);
    const g = grouped.get(bucket.key) ?? { label: bucket.label, events: [] };
    g.events.push(event);
    grouped.set(bucket.key, g);
  }
  const showWeeks = events.length > 8 && grouped.size > 1;

  return (
    <div className="grid gap-3 min-w-0">
      {[...grouped.entries()].map(([key, group]) => (
        <section key={key} className="space-y-3 min-w-0">
          {showWeeks && <p className="label">{group.label}</p>}
          {group.events.map((event) => (
            <EventCard key={event.id} event={event} marketType={marketType} shopIds={shopIds} />
          ))}
        </section>
      ))}
    </div>
  );
}

function EventCard({
  event,
  marketType,
  shopIds,
}: {
  event: Event;
  marketType: MarketType;
  shopIds?: string[] | null;
}) {
  const addBet = useBetslipStore((s) => s.addBet);
  const market = event.markets.find((m) => m.type === marketType);
  const raw = (market?.outcomes ?? []).filter((o) =>
    shopIds ? Boolean(bestPlaceableOdds(o.bookOdds, shopIds)) : true
  );
  const groups = groupAltOutcomes(raw);
  const sport = getSport(event.sportKey);
  const window = marketType === 'spreads' ? findSpreadWindow(event, shopIds, 1) : null;

  return (
    <article className="glass rounded-2xl p-3.5 min-w-0">
      <header className="mb-3 min-w-0">
        <p className="font-mono text-[11px] text-ink-dim">
          {formatWhen(event.commenceTime)}
          <span className="mx-1.5 text-ink-dim">·</span>
          {sport.shortName}
        </p>
        <h3 className="mt-1 font-display font-semibold text-[17px] leading-snug text-ink break-words">
          {event.awayTeam}
          <span className="text-ink-dim font-normal"> @ </span>
          {event.homeTeam}
        </h3>
        {window && (
          <p className="mt-2 font-mono text-[12px] text-lichen">
            {window.gap}-pt window · {getVenue(window.left.bookId).shortName}{' '}
            {window.left.line > 0 ? '+' : ''}
            {window.left.line} / {getVenue(window.right.bookId).shortName}{' '}
            {window.right.line > 0 ? '+' : ''}
            {window.right.line}
          </p>
        )}
      </header>

      {groups.length === 0 ? (
        <p className="font-mono text-[12px] text-ink-dim">No {marketType} line</p>
      ) : (
        <ul className="divide-y divide-line">
          {groups.map((group) => {
            const outcome = group.main;
            const best = bestPlaceableOdds(outcome.bookOdds, shopIds);
            const others = otherPlaceableOdds(outcome.bookOdds, shopIds);
            const pin = pinnacleOdds(outcome.bookOdds);
            const href = best ? shopHref(best.bookId) : undefined;
            const book = best ? getVenue(best.bookId) : undefined;
            const line = outcome.point ?? best?.line;
            const buy =
              line !== undefined && marketType !== 'h2h'
                ? closestBuy(marketType, outcome.name, line, group.alts)
                : undefined;
            const buyBest = buy ? bestPlaceableOdds(buy.bookOdds, shopIds) : undefined;
            const buyLine = buy?.point ?? buyBest?.line;
            const vsPin = best && pin ? classifyPriceVsPin(best.odds, pin.odds) : 'ok';
            const suspect = vsPin === 'suspect';

            return (
              <li key={`${event.id}-${outcome.name}-${line ?? 'x'}`} className="py-3 first:pt-0 last:pb-0 min-w-0">
                <div className="flex items-start justify-between gap-3">
                  <button
                    type="button"
                    className="min-w-0 text-left flex-1"
                    onClick={() => {
                      if (!best) return;
                      addBet({
                        eventId: event.id,
                        event,
                        marketType,
                        outcomeName: outcome.name,
                        bookId: best.bookId,
                        odds: best.odds,
                        line,
                        shape: 'straight',
                      });
                    }}
                  >
                    <p className="text-[15px] text-ink font-medium leading-snug break-words">
                      {pickLabel(outcome.name, line, marketType)}
                      {group.alts.length > 0 && (
                        <span className="font-mono text-[11px] text-ink-dim"> main</span>
                      )}
                    </p>
                    <p className="mt-1 font-mono text-[13px] tabular-nums">
                      {best ? (
                        <span className="text-lichen">
                          {book?.shortName} {formatAmerican(best.odds)}
                        </span>
                      ) : (
                        <span className="text-ink-dim">No shop price</span>
                      )}
                      <span className="text-ink-dim"> · </span>
                      <span className="text-pin">PIN {pin ? formatAmerican(pin.odds) : '—'}</span>
                    </p>
                    {others.length > 0 && (
                      <p className="mt-1 font-mono text-[11px] text-ink-dim leading-relaxed break-words">
                        Also{' '}
                        {others
                          .slice(0, 4)
                          .map((o) => {
                            const ln = o.line ?? outcome.point;
                            const lineBit =
                              marketType !== 'h2h' && ln !== undefined
                                ? marketType === 'spreads' && ln > 0
                                  ? ` +${ln}`
                                  : ` ${ln}`
                                : '';
                            return `${getVenue(o.bookId).shortName}${lineBit} ${formatAmerican(o.odds)}`;
                          })
                          .join(' · ')}
                        {others.length > 4 ? ` · +${others.length - 4}` : ''}
                      </p>
                    )}
                    {suspect && (
                      <p className="mt-1 font-mono text-[11px] text-warn">
                        Likely pulled vs PIN — confirm at the shop
                      </p>
                    )}
                    {best && !suspect && (
                      <p className="mt-1 font-mono text-[11px] text-moss">Tap to add to slip</p>
                    )}
                    {best && suspect && (
                      <p className="mt-1 font-mono text-[11px] text-moss">Tap anyway</p>
                    )}
                  </button>

                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 chip chip-on min-h-10 px-3 text-[11px]"
                    >
                      Open
                    </a>
                  ) : null}
                </div>
                {buy && buyBest && buyLine !== undefined && (
                  <button
                    type="button"
                    className="mt-2 font-mono text-[12px] text-lichen text-left"
                    onClick={(e) => {
                      e.stopPropagation();
                      addBet({
                        eventId: event.id,
                        event,
                        marketType,
                        outcomeName: buy.name,
                        bookId: buyBest.bookId,
                        odds: buyBest.odds,
                        line: buyLine,
                        shape: 'straight',
                      });
                    }}
                  >
                    Buy ½ to {pickLabel(buy.name, buyLine, marketType)} ·{' '}
                    {getVenue(buyBest.bookId).shortName} {formatAmerican(buyBest.odds)}
                    {best ? ` vs main ${formatAmerican(best.odds)}` : ''}
                  </button>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </article>
  );
}
