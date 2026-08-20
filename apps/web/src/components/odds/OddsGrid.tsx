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

function Shimmer({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-[#e8d9a8] rounded-lg ${className ?? ''}`} />;
}

function SkeletonCard() {
  return (
    <div className="glass rounded-2xl p-3.5 space-y-3">
      <div className="flex items-center justify-between gap-3">
        <Shimmer className="h-4 w-40" />
        <Shimmer className="h-3 w-20" />
      </div>
      <Shimmer className="h-14 w-full rounded-xl" />
      <Shimmer className="h-14 w-full rounded-xl" />
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
    : DEFAULT_DISPLAYED_BOOKS.filter((b) => filter.books.includes(b) || b === 'pinnacle');

  return (
    <div className="space-y-3 min-w-0">
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
    <article className="glass rounded-2xl p-3.5 min-w-0">
      <header className="mb-3">
        <h3 className="font-display font-semibold text-[16px] leading-snug text-ink break-words">
          {event.awayTeam}
          <span className="mx-1.5 text-ink-dim font-normal">@</span>
          {event.homeTeam}
        </h3>
        <p className="font-mono text-[11px] text-ink-dim mt-1">{gameTime}</p>
      </header>

      <div className="space-y-3">
        {markets.map((market) => (
          <MarketBlock
            key={market.type}
            marketType={market.type}
            outcomes={market.outcomes}
            displayedBooks={displayedBooks}
          />
        ))}
      </div>
    </article>
  );
}

function MarketBlock({
  marketType,
  outcomes,
  displayedBooks,
}: {
  marketType: MarketType;
  outcomes: Event['markets'][0]['outcomes'];
  displayedBooks: string[];
}) {
  const marketLabel =
    marketType === 'h2h' ? 'Moneyline' : marketType === 'spreads' ? 'Spread' : 'Total';

  return (
    <section className="min-w-0">
      <p className="label mb-2">{marketLabel}</p>
      <ul className="space-y-2">
        {outcomes.map((outcome, idx) => (
          <li key={`${marketType}-${idx}`} className="rounded-xl bg-[#d7f0fb] border-2 border-line p-2.5 min-w-0">
            <p className="text-[14px] text-ink font-medium leading-snug break-words">{outcome.name}</p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {displayedBooks.map((bookId) => {
                const bookOdd = outcome.bookOdds.find((bo) => bo.bookId === bookId);
                if (!bookOdd) return null;
                const isBest = outcome.bestOdds?.bookId === bookId;
                return (
                  <OddsChip
                    key={bookId}
                    bookId={bookId}
                    odds={bookOdd}
                    isBest={isBest}
                    showLine={marketType !== 'h2h'}
                  />
                );
              })}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function OddsChip({
  bookId,
  odds,
  isBest,
  showLine,
}: {
  bookId: string;
  odds: BookOdds;
  isBest: boolean;
  showLine: boolean;
}) {
  const book = getVenue(bookId);
  const href = book.deepLink || undefined;
  const isPin = bookId === 'pinnacle';
  const label = `${book.shortName} ${showLine && odds.line !== undefined ? `${odds.line > 0 ? `+${odds.line}` : odds.line} ` : ''}${formatAmerican(odds.odds)}`;

  const className = `chip min-h-9 px-2.5 text-[11px] normal-case tracking-normal ${
    isPin ? 'text-pin border-pin' : isBest ? 'chip-on' : ''
  }`;

  if (href) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {label}
      </a>
    );
  }

  return <span className={className}>{label}</span>;
}
