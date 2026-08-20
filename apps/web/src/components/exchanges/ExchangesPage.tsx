import { useEffect, useState } from 'react';
import { useExchangeOdds } from '@/hooks/useExchangeOdds';
import { useOddsStore } from '@/stores/oddsStore';
import SportSelector from '@/components/odds/SportSelector';
import OddsGrid, { OddsGridSkeleton } from '@/components/odds/OddsGrid';
import PlanGate from '@/components/auth/PlanGate';
import UpgradeCard from '@/components/auth/UpgradeCard';
import StaleBanner from '@/components/common/StaleBanner';
import DebugFooter from '@/components/common/DebugFooter';
import { useDebugMode } from '@/hooks/useDebugMode';
import { ApiError } from '@/services/api';
import { isAbsurdAmerican, VENUES, type Event, type VenueKind } from '@ny-sharp-edge/shared';
import Chip from '@/components/common/Chip';

const EXCHANGE_KINDS: VenueKind[] = ['prediction', 'exchange'];

const EXCHANGE_BOOK_IDS = Object.values(VENUES)
  .filter((venue) => EXCHANGE_KINDS.includes(venue.kind))
  .map((venue) => venue.id);

function filterExchangeEvents(events: Event[]): Event[] {
  return events
    .map((event) => ({
      ...event,
      markets: event.markets
        .map((market) => ({
          ...market,
          outcomes: market.outcomes
            .map((outcome) => ({
              ...outcome,
              bookOdds: outcome.bookOdds.filter((bo) =>
                EXCHANGE_BOOK_IDS.includes(bo.bookId) && !isAbsurdAmerican(bo.odds)
              ),
              bestOdds:
                outcome.bestOdds &&
                EXCHANGE_BOOK_IDS.includes(outcome.bestOdds.bookId)
                  ? outcome.bestOdds
                  : undefined,
            }))
            .filter((outcome) => outcome.bookOdds.length > 0),
        }))
        .filter((market) => market.outcomes.length > 0),
    }))
    .filter((event) => event.markets.length > 0);
}

export default function ExchangesPage() {
  const { filter } = useOddsStore();
  const [tab, setTab] = useState<'games' | 'other'>('games');
  const gamesQuery = useExchangeOdds(filter.sport, false);
  const otherQuery = useExchangeOdds(filter.sport, true);
  const debug = useDebugMode();

  const gamesEvents = gamesQuery.data ? filterExchangeEvents(gamesQuery.data.events) : [];
  const otherEvents = otherQuery.data ? filterExchangeEvents(otherQuery.data.events) : [];

  useEffect(() => {
    setTab('games');
  }, [filter.sport]);

  const activeQuery = tab === 'other' ? otherQuery : gamesQuery;
  const exchangeEvents = tab === 'other' ? otherEvents : gamesEvents;
  const isLoading = tab === 'other' ? otherQuery.isLoading : gamesQuery.isLoading;
  const error = activeQuery.error;

  return (
    <PlanGate requiredPlan="pro">

    <div className="space-y-4 min-w-0">
      <div className="min-w-0">
        <div className="flex items-end justify-between gap-3">
          <h1 className="font-display font-bold text-ink tracking-tight text-[1.75rem] leading-none">
            Exchanges
          </h1>
          {activeQuery.dataUpdatedAt && (
            <p className="font-mono text-[11px] text-ink-dim shrink-0">
              {new Date(activeQuery.dataUpdatedAt).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>
        <p className="text-ink-dim font-mono text-[13px] mt-2 leading-snug">
          Kalshi and Polymarket leftovers. Matched game lines also show on Odds.
        </p>
      </div>

      <div className="glass rounded-2xl p-3 space-y-3">
        <SportSelector />
        <div className="flex flex-wrap gap-1.5">
          <Chip onClick={() => setTab('games')} active={tab === 'games'}>
            Games
          </Chip>
          <Chip onClick={() => setTab('other')} active={tab === 'other'}>
            Other
          </Chip>
        </div>
      </div>

      {activeQuery.data?.stale && <StaleBanner cachedAt={activeQuery.data.cachedAt} />}

      {isLoading && <OddsGridSkeleton />}

      {error && error instanceof ApiError && error.status === 402 && (
        <UpgradeCard requiredPlan="pro" title="Upgrade to Pro to view Kalshi and Polymarket lines" />
      )}

      {error && !(error instanceof ApiError && error.status === 402) && (
        <div className="glass rounded-2xl p-4">
          <p className="text-bad font-mono text-[13px]">
            Failed to load exchange odds. Make sure the API server is running.
          </p>
        </div>
      )}

      {!isLoading && !error && exchangeEvents.length === 0 && (
        <div className="text-center py-12 space-y-3">
          <p className="text-ink-dim uppercase tracking-[0.18em] text-[11px]">
            No Kalshi / Polymarket line matched this sport
          </p>
          <p className="font-mono text-[12px] text-ink-dim max-w-sm mx-auto">
            This is leftover exchange inventory, not a live sportsbook. Check Odds for US books.
          </p>
        </div>
      )}

      {!isLoading && !error && exchangeEvents.length > 0 && (
        <OddsGrid events={exchangeEvents} displayedBooks={EXCHANGE_BOOK_IDS} />
      )}

      {debug && (
        <DebugFooter
          cachedAt={activeQuery.data?.cachedAt}
          remainingCredits={activeQuery.data?.remainingCredits}
        />
      )}
    </div>
    </PlanGate>
  );
}
