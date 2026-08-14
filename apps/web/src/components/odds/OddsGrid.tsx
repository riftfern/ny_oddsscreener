import type { Event, MarketType, BookOdds } from '@ny-sharp-edge/shared';
import { getVenue, formatAmerican } from '@ny-sharp-edge/shared';
import { useOddsStore } from '@/stores/oddsStore';
import { useBetslipStore } from '@/stores/betslipStore';

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
      className={`animate-pulse rounded bg-gray-700/50 ${className ?? ''}`}
    />
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-gray-700/60 bg-gray-800/70 shadow-lg overflow-hidden">
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-700/40 bg-gray-800/80">
        <div className="flex items-center justify-between">
          <Shimmer className="h-4 w-48" />
          <Shimmer className="h-3 w-28" />
        </div>
      </div>

      {/* Table */}
      <div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700/30">
              <th className="px-5 py-2.5 w-24 text-left">
                <Shimmer className="h-3 w-12" />
              </th>
              {DEFAULT_DISPLAYED_BOOKS.map((bookId) => (
                <th key={bookId} className="px-1.5 py-2.5 w-20">
                  <Shimmer className="h-5 w-10 mx-auto rounded-md" />
                </th>
              ))}
              <th className="px-1.5 py-2.5 w-20">
                <Shimmer className="h-5 w-10 mx-auto rounded-md" />
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
                      ? 'border-b border-gray-700/30'
                      : ''
                  }
                >
                  {rIdx === 0 && (
                    <td rowSpan={SKELETON_ROWS_PER_MARKET} className="px-5 py-2 align-middle">
                      <Shimmer className="h-3.5 w-16" />
                    </td>
                  )}
                  {DEFAULT_DISPLAYED_BOOKS.map((bookId) => (
                    <td key={bookId} className="px-1.5 py-1.5 text-center">
                      <Shimmer className="h-8 w-full rounded-lg" />
                    </td>
                  ))}
                  <td className="px-1.5 py-1.5 text-center">
                    <Shimmer className="h-8 w-14 mx-auto rounded-lg" />
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
    <div className="space-y-5">
      {Array.from({ length: SKELETON_CARDS }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

export default function OddsGrid({ events, displayedBooks: displayedBooksProp }: OddsGridProps) {
  const { filter } = useOddsStore();
  // Exchanges page passes its own book list — use it as-is.
  // Odds page defaults include Pinnacle (the fair-line column) even when the
  // book filter is the legacy NY retail list.
  const displayedBooks = displayedBooksProp
    ? displayedBooksProp
    : DEFAULT_DISPLAYED_BOOKS.filter(
        (b) => filter.books.includes(b) || b === 'pinnacle'
      );

  return (
    <div className="space-y-5">
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
    <div className="rounded-xl border border-gray-700/60 bg-gray-800/70 shadow-lg overflow-hidden backdrop-blur-sm">
      {/* Event Header */}
      <div className="px-5 py-3.5 border-b border-gray-700/40 bg-gray-800/80">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-[15px] text-white tracking-tight">
            {event.awayTeam}
            <span className="mx-2 text-gray-500 font-normal text-sm">@</span>
            {event.homeTeam}
          </h3>
          <span className="text-xs text-gray-400 tabular-nums">{gameTime}</span>
        </div>
      </div>

      {/* Odds Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-700/30">
              <th className="text-left px-5 py-2.5 w-24">
                <span className="text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                  Market
                </span>
              </th>
              {displayedBooks.map((bookId) => {
                const book = getVenue(bookId);
                return (
                  <th key={bookId} className="px-1.5 py-2.5 w-20">
                    <span
                      className="inline-flex items-center justify-center rounded-md px-2 py-0.5 text-[11px] font-semibold tracking-wide"
                      style={{
                        backgroundColor: `${book.color}18`,
                        color: book.color,
                        border: `1px solid ${book.color}30`,
                      }}
                    >
                      {book.shortName}
                    </span>
                  </th>
                );
              })}
              <th className="px-1.5 py-2.5 w-20">
                <span className="inline-flex items-center justify-center rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[11px] font-semibold text-emerald-400 tracking-wide">
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
          className={`
            transition-colors hover:bg-white/[0.02]
            ${idx === outcomes.length - 1 && !isLast ? 'border-b border-gray-700/30' : ''}
          `}
        >
          {/* Market label on first row */}
          {idx === 0 ? (
            <td
              rowSpan={outcomes.length}
              className="px-5 py-2 text-[13px] font-medium text-gray-400 align-middle"
            >
              {marketLabel}
            </td>
          ) : null}

          {/* Odds for each book */}
          {displayedBooks.map((bookId) => {
            const bookOdd = outcome.bookOdds.find((bo) => bo.bookId === bookId);
            const isBest = outcome.bestOdds?.bookId === bookId;

            return (
              <td key={bookId} className="px-1.5 py-1.5 text-center">
                {bookOdd ? (
                  <OddsCell
                    event={event}
                    marketType={marketType}
                    outcomeName={outcome.name}
                    odds={bookOdd}
                    isBest={isBest}
                    showLine={marketType !== 'h2h'}
                  />
                ) : (
                  <span className="text-gray-600 text-sm">-</span>
                )}
              </td>
            );
          })}

          {/* Best odds column */}
          <td className="px-1.5 py-1.5 text-center">
            {outcome.bestOdds && (
              <div className="inline-flex flex-col items-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-2.5 py-1 min-w-[56px]">
                <span className="text-sm font-bold text-emerald-400 tabular-nums">
                  {formatAmerican(outcome.bestOdds.odds)}
                </span>
                <span
                  className="text-[10px] font-medium mt-0.5"
                  style={{ color: getVenue(outcome.bestOdds.bookId).color }}
                >
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
}

function OddsCell({ event, marketType, outcomeName, odds, isBest, showLine }: OddsCellProps) {
  const addBet = useBetslipStore((state) => state.addBet);
  const bets = useBetslipStore((state) => state.bets);

  const formattedOdds = formatAmerican(odds.odds);
  const isPositive = odds.odds > 0;

  const isInSlip = bets.some(
    (b) => b.eventId === event.id && b.bookId === odds.bookId && b.outcomeName === outcomeName
  );

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInSlip) return;
    addBet({
      eventId: event.id,
      event,
      marketType,
      outcomeName,
      bookId: odds.bookId,
      odds: odds.odds,
      line: odds.line,
    });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className={`
        group relative rounded-lg px-2 py-1.5 w-full text-center
        transition-all duration-150 ease-out
        ${
          isBest
            ? 'bg-emerald-500/10 ring-1 ring-emerald-500/30 hover:bg-emerald-500/20'
            : 'hover:bg-gray-700/50'
        }
        ${isInSlip ? 'ring-2 ring-blue-500 bg-blue-500/10' : ''}
      `}
    >
      {showLine && odds.line !== undefined && (
        <div className="text-[11px] text-gray-500 leading-tight">
          {odds.line > 0 ? `+${odds.line}` : odds.line}
        </div>
      )}
      <span
        className={`
          text-sm font-semibold tabular-nums
          ${isBest ? 'text-emerald-400' : isPositive ? 'text-emerald-400' : 'text-gray-200'}
        `}
      >
        {formattedOdds}
      </span>
      {isInSlip && <div className="text-[10px] text-blue-400 font-medium mt-0.5">Added</div>}
    </button>
  );
}
