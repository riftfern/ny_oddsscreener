import type { Event, MarketType, BookOdds } from '@ny-sharp-edge/shared';
import { getVenue, formatAmerican } from '@ny-sharp-edge/shared';
import { useOddsStore } from '@/stores/oddsStore';

interface OddsGridProps {
  events: Event[];
  displayedBooks?: string[];
}

const DEFAULT_DISPLAYED_BOOKS: string[] = [
  'draftkings',
  'fanduel',
  'betmgm',
  'caesars',
  'betrivers',
  'pinnacle',
];

const SKELETON_CARDS = 4;
const SKELETON_MARKETS = 3;
const SKELETON_ROWS_PER_MARKET = 2;

function Shimmer({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse bg-line/60 ${className ?? ''}`}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="border border-line bg-bg-2 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-line">
        <div className="flex items-center justify-between">
          <Shimmer className="h-4 w-48" />
          <Shimmer className="h-3 w-28" />
        </div>
      </div>

      <div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-line">
              <th className="px-4 py-2 w-24 text-left">
                <Shimmer className="h-3 w-12" />
              </th>
              {DEFAULT_DISPLAYED_BOOKS.map((bookId) => (
                <th key={bookId} className="px-1 py-2 w-16">
                  <Shimmer className="h-4 w-10 mx-auto" />
                </th>
              ))}
              <th className="px-1 py-2 w-16">
                <Shimmer className="h-4 w-10 mx-auto" />
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: SKELETON_MARKETS }).map((_, mIdx) => (
              Array.from({ length: SKELETON_ROWS_PER_MARKET }).map((_, rIdx) => (
                <tr
                  key={`${mIdx}-${rIdx}`}
                  className={
                    rIdx === SKELETON_ROWS_PER_MARKET - 1 && mIdx < SKELETON_MARKETS - 1
                      ? 'border-b border-line'
                      : ''
                  }
                >
                  {rIdx === 0 && (
                    <td rowSpan={SKELETON_ROWS_PER_MARKET} className="px-4 py-2 align-middle">
                      <Shimmer className="h-3.5 w-16" />
                    </td>
                  )}
                  {DEFAULT_DISPLAYED_BOOKS.map((bookId) => (
                    <td key={bookId} className="px-1 py-1 text-center">
                      <Shimmer className="h-7 w-full" />
                    </td>
                  ))}
                  <td className="px-1 py-1 text-center">
                    <Shimmer className="h-7 w-12 mx-auto" />
                  </td>
                </tr>
              ))
            )).flat()}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function OddsGridSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: SKELETON_CARDS }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export default function OddsGrid({ events, displayedBooks: displayedBooksProp }: OddsGridProps) {
  const { filter } = useOddsStore();
  const displayedBooks = displayedBooksProp
    ? displayedBooksProp
    : DEFAULT_DISPLAYED_BOOKS.filter(
        (b) => filter.books.includes(b) || b === 'pinnacle'
      );

  return (
    <div className="space-y-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} displayedBooks={displayedBooks} />
      ))}
    </div>
  );
}

interface EventCardProps {
  event: Event;
  displayedBooks: string[];
}

function EventCard({ event, displayedBooks }: EventCardProps) {
  const gameTime = new Date(event.commenceTime).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const { filter } = useOddsStore();
  const markets =
    filter.marketType === 'all'
      ? event.markets
      : event.markets.filter((m) => m.type === filter.marketType);

  return (
    <div className="border border-line bg-bg-2 overflow-hidden">
      <div className="px-4 py-2.5 border-b border-line">
        <div className="flex items-center justify-between gap-4">
          <h3 className="font-display font-semibold text-[15px] text-ink tracking-tight">
            {event.awayTeam}
            <span className="mx-2 text-ink-dim font-normal text-sm">@</span>
            {event.homeTeam}
          </h3>
          <span className="font-mono text-[11px] text-ink-dim tabular-nums">{gameTime}</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-line">
              <th className="text-left px-4 py-2 w-24">
                <span className="label">
                  Market
                </span>
              </th>
              {displayedBooks.map((bookId) => {
                const book = getVenue(bookId);
                const isPin = bookId === 'pinnacle';
                return (
                  <th key={bookId} className="px-1 py-2 w-16">
                    <span
                      className={`inline-flex items-center justify-center px-1.5 py-0.5 font-mono text-[11px] tracking-wide ${
                        isPin ? 'text-pin border border-pin' : 'text-ink-dim'
                      }`}
                    >
                      {book.shortName}
                    </span>
                  </th>
                );
              })}
              <th className="px-1 py-2 w-16">
                <span className="inline-flex items-center justify-center px-1.5 py-0.5 font-mono text-[11px] text-lichen border border-lichen tracking-wide">
                  Best
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {markets.map((market, marketIdx) => (
              <MarketRows
                key={market.type}
                event={event}
                marketType={market.type}
                outcomes={market.outcomes}
                displayedBooks={displayedBooks}
                isLast={marketIdx === markets.length - 1}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

interface MarketRowsProps {
  event: Event;
  marketType: MarketType;
  outcomes: Event['markets'][0]['outcomes'];
  displayedBooks: string[];
  isLast: boolean;
}

function MarketRows({ event, marketType, outcomes, displayedBooks, isLast }: MarketRowsProps) {
  const marketLabel =
    marketType === 'h2h' ? 'Moneyline' : marketType === 'spreads' ? 'Spread' : 'Total';

  return (
    <>
      {outcomes.map((outcome, idx) => (
        <tr
          key={`${marketType}-${idx}`}
          className={idx === outcomes.length - 1 && !isLast ? 'border-b border-line' : ''}
        >
          {idx === 0 ? (
            <td
              rowSpan={outcomes.length}
              className="px-4 py-1.5 text-[11px] uppercase tracking-[0.14em] text-ink-dim align-middle"
            >
              {marketLabel}
            </td>
          ) : null}

          {displayedBooks.map((bookId) => {
            const bookOdd = outcome.bookOdds.find((bo) => bo.bookId === bookId);
            const isBest = outcome.bestOdds?.bookId === bookId;

            return (
              <td key={bookId} className="px-1 py-1 text-center">
                {bookOdd ? (
                  <OddsCell
                    event={event}
                    marketType={marketType}
                    outcomeName={outcome.name}
                    odds={bookOdd}
                    isBest={isBest}
                    showLine={marketType !== 'h2h'}
                    isPin={bookId === 'pinnacle'}
                  />
                ) : (
                  <span className="text-ink-dim/50 font-mono text-sm">-</span>
                )}
              </td>
            );
          })}

          <td className="px-1 py-1 text-center">
            {outcome.bestOdds && (
              <div className="inline-flex flex-col items-center border border-lichen px-2 py-1 min-w-[52px]">
                <span className="text-sm font-medium text-lichen font-mono tabular-nums">
                  {formatAmerican(outcome.bestOdds.odds)}
                </span>
                <span className="font-mono text-[10px] text-ink-dim mt-0.5">
                  {getVenue(outcome.bestOdds.bookId).shortName}
                </span>
              </div>
            )}
          </td>
        </tr>
      ))}
    </>
  );
}

interface OddsCellProps {
  event: Event;
  marketType: MarketType;
  outcomeName: string;
  odds: BookOdds;
  isBest: boolean;
  showLine: boolean;
  isPin: boolean;
}

function OddsCell({ odds, isBest, showLine, isPin }: OddsCellProps) {
  const formattedOdds = formatAmerican(odds.odds);
  const isPositive = odds.odds > 0;
  const href = getVenue(odds.bookId).deepLink || undefined;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!href) return;
    window.open(href, '_blank', 'noopener,noreferrer');
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        group relative px-1.5 py-1 w-full text-center border
        ${isPin ? 'border-pin' : isBest ? 'border-lichen' : 'border-transparent hover:border-line'}
        ${href ? 'cursor-pointer' : 'cursor-default'}
      `}
    >
      {showLine && odds.line !== undefined && (
        <div className="font-mono text-[11px] text-ink-dim leading-tight">
          {odds.line > 0 ? `+${odds.line}` : odds.line}
        </div>
      )}
      <span
        className={`
          text-sm font-medium font-mono tabular-nums
          ${isBest ? 'text-lichen' : isPositive ? 'text-lichen' : 'text-ink'}
        `}
      >
        {formattedOdds}
      </span>
    </button>
  );
}
