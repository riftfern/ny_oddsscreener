import type { Event, SportsbookId, MarketType, BookOdds } from '@ny-sharp-edge/shared';
import { SPORTSBOOK_INFO, formatAmerican } from '@ny-sharp-edge/shared';
import { useOddsStore } from '@/stores/oddsStore';

interface OddsGridProps {
  events: Event[];
}

const DISPLAYED_BOOKS: SportsbookId[] = [
  'draftkings',
  'fanduel',
  'betmgm',
  'caesars',
  'betrivers',
];

export default function OddsGrid({ events }: OddsGridProps) {
  const { filter } = useOddsStore();

  const displayedBooks = DISPLAYED_BOOKS.filter((b) => filter.books.includes(b));

  return (
    <div className="space-y-6">
      {events.map((event) => (
        <EventCard key={event.id} event={event} displayedBooks={displayedBooks} />
      ))}
    </div>
  );
}

interface EventCardProps {
  event: Event;
  displayedBooks: SportsbookId[];
}

function EventCard({ event, displayedBooks }: EventCardProps) {
  const gameTime = new Date(event.commenceTime).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="card overflow-hidden">
      {/* Event Header */}
      <div className="bg-gray-700/50 px-4 py-3 border-b border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <span className="font-semibold text-white">
              {event.awayTeam} @ {event.homeTeam}
            </span>
          </div>
          <span className="text-sm text-gray-400">{gameTime}</span>
        </div>
      </div>

      {/* Odds Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="text-xs text-gray-400 uppercase">
              <th className="text-left px-4 py-2 w-24">Market</th>
              {displayedBooks.map((bookId) => (
                <th key={bookId} className="text-center px-2 py-2 w-20">
                  {SPORTSBOOK_INFO[bookId].shortName}
                </th>
              ))}
              <th className="text-center px-2 py-2 w-20 text-green-400">Best</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-700">
            {event.markets.map((market) => (
              <MarketRows
                key={market.type}
                event={event}
                marketType={market.type}
                outcomes={market.outcomes}
                displayedBooks={displayedBooks}
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
  displayedBooks: SportsbookId[];
}

function MarketRows({ marketType, outcomes, displayedBooks }: MarketRowsProps) {
  const marketLabel =
    marketType === 'h2h' ? 'Moneyline' : marketType === 'spreads' ? 'Spread' : 'Total';

  return (
    <>
      {outcomes.map((outcome, idx) => (
        <tr key={`${marketType}-${idx}`} className="hover:bg-gray-700/30">
          {/* Market label only on first row */}
          {idx === 0 ? (
            <td rowSpan={outcomes.length} className="px-4 py-2 text-sm text-gray-400 align-top">
              {marketLabel}
            </td>
          ) : null}

          {/* Odds for each book */}
          {displayedBooks.map((bookId) => {
            const bookOdd = outcome.bookOdds.find((bo) => bo.bookId === bookId);
            const isBest = outcome.bestOdds?.bookId === bookId;

            return (
              <td key={bookId} className="text-center px-2 py-2">
                {bookOdd ? (
                  <OddsCell odds={bookOdd} isBest={isBest} showLine={marketType !== 'h2h'} />
                ) : (
                  <span className="text-gray-600">-</span>
                )}
              </td>
            );
          })}

          {/* Best odds column */}
          <td className="text-center px-2 py-2">
            {outcome.bestOdds && (
              <div className="bg-green-900/30 rounded px-2 py-1">
                <span className="text-green-400 font-semibold text-sm">
                  {formatAmerican(outcome.bestOdds.odds)}
                </span>
                <div className="text-xs text-gray-400">
                  {SPORTSBOOK_INFO[outcome.bestOdds.bookId].shortName}
                </div>
              </div>
            )}
          </td>
        </tr>
      ))}
    </>
  );
}

interface OddsCellProps {
  odds: BookOdds;
  isBest: boolean;
  showLine: boolean;
}

function OddsCell({ odds, isBest, showLine }: OddsCellProps) {
  const formattedOdds = formatAmerican(odds.odds);
  const isPositive = odds.odds > 0;

  return (
    <div
      className={`rounded px-2 py-1 ${isBest ? 'bg-green-900/30 border border-green-500/50' : ''}`}
    >
      {showLine && odds.line !== undefined && (
        <div className="text-xs text-gray-400">{odds.line > 0 ? `+${odds.line}` : odds.line}</div>
      )}
      <span className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-white'}`}>
        {formattedOdds}
      </span>
    </div>
  );
}
