import type { Event, MarketType } from '@ny-sharp-edge/shared';
import {
  bestPlaceableOdds,
  formatAmerican,
  getSport,
  getVenue,
  otherPlaceableOdds,
  pinnacleOdds,
} from '@ny-sharp-edge/shared';

interface OddsBoardProps {
  events: Event[];
  marketType: MarketType;
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

function shopHref(bookId: string): string | undefined {
  const link = getVenue(bookId).deepLink;
  return link || undefined;
}

export default function OddsBoard({ events, marketType }: OddsBoardProps) {
  if (events.length === 0) return null;

  return (
    <div className="border border-line overflow-x-auto">
      <table className="w-full text-left">
        <thead className="sticky top-0 bg-bg z-10">
          <tr className="border-b border-line">
            {['When', 'Match', 'Pick', 'Best shop', 'Also', 'PIN', ''].map((h) => (
              <th key={h} className="px-3 py-2 label whitespace-nowrap">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {events.map((event) => (
            <EventBlock key={event.id} event={event} marketType={marketType} />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function EventBlock({ event, marketType }: { event: Event; marketType: MarketType }) {
  const market = event.markets.find((m) => m.type === marketType);
  const outcomes = market?.outcomes ?? [];
  const sport = getSport(event.sportKey);

  if (outcomes.length === 0) {
    return (
      <tr className="border-b border-line">
        <td className="px-3 py-2 font-mono text-[11px] text-ink-dim whitespace-nowrap">
          {formatWhen(event.commenceTime)}
        </td>
        <td className="px-3 py-2 text-sm text-ink" colSpan={6}>
          {event.awayTeam} @ {event.homeTeam}
          <span className="ml-2 font-mono text-[11px] text-ink-dim">{sport.shortName}</span>
          <span className="ml-2 font-mono text-[11px] text-ink-dim">no {marketType} line</span>
        </td>
      </tr>
    );
  }

  return (
    <>
      {outcomes.map((outcome, idx) => {
        const best = bestPlaceableOdds(outcome.bookOdds);
        const others = otherPlaceableOdds(outcome.bookOdds);
        const pin = pinnacleOdds(outcome.bookOdds);
        const href = best ? shopHref(best.bookId) : undefined;
        const book = best ? getVenue(best.bookId) : undefined;

        return (
          <tr key={`${event.id}-${outcome.name}`} className="border-b border-line last:border-b-0">
            {idx === 0 ? (
              <>
                <td
                  rowSpan={outcomes.length}
                  className="px-3 py-2 font-mono text-[11px] text-ink-dim whitespace-nowrap align-top"
                >
                  {formatWhen(event.commenceTime)}
                </td>
                <td rowSpan={outcomes.length} className="px-3 py-2 align-top">
                  <div className="text-ink text-sm leading-tight">
                    {event.awayTeam}
                    <span className="text-ink-dim mx-1">@</span>
                    {event.homeTeam}
                  </div>
                  <div className="font-mono text-[11px] text-ink-dim mt-0.5">{sport.shortName}</div>
                </td>
              </>
            ) : null}

            <td className="px-3 py-2 text-ink text-sm whitespace-nowrap">
              {pickLabel(outcome.name, outcome.point ?? best?.line, marketType)}
            </td>

            <td className="px-3 py-2 whitespace-nowrap">
              {best ? (
                <span className="font-mono text-sm text-lichen tabular-nums">
                  {book?.shortName} {formatAmerican(best.odds)}
                </span>
              ) : (
                <span className="font-mono text-[11px] text-ink-dim">—</span>
              )}
            </td>

            <td className="px-3 py-2 font-mono text-[11px] text-ink-dim">
              {others.length === 0
                ? '—'
                : others
                    .slice(0, 4)
                    .map((o) => `${getVenue(o.bookId).shortName} ${formatAmerican(o.odds)}`)
                    .join(' · ')}
              {others.length > 4 ? ` · +${others.length - 4}` : ''}
            </td>

            <td className="px-3 py-2 font-mono text-sm text-pin tabular-nums whitespace-nowrap">
              {pin ? formatAmerican(pin.odds) : '—'}
            </td>

            <td className="px-3 py-2 whitespace-nowrap">
              {href ? (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono text-[11px] text-lichen hover:text-ink underline underline-offset-2"
                >
                  OPEN
                </a>
              ) : (
                <span className="font-mono text-[11px] text-ink-dim">—</span>
              )}
            </td>
          </tr>
        );
      })}
    </>
  );
}
