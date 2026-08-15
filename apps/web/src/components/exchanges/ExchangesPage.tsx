import { useEffect, useRef, useState } from 'react';
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
import { VENUES, type Event, type VenueKind } from '@ny-sharp-edge/shared';

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
                EXCHANGE_BOOK_IDS.includes(bo.bookId)
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
  const autoSwitchedFor = useRef<string | null>(null);
  const gamesQuery = useExchangeOdds(filter.sport, false);
  const otherQuery = useExchangeOdds(filter.sport, true);
  const debug = useDebugMode();

  const gamesEvents = gamesQuery.data ? filterExchangeEvents(gamesQuery.data.events) : [];
  const otherEvents = otherQuery.data ? filterExchangeEvents(otherQuery.data.events) : [];

  useEffect(() => {
    setTab('games');
  }, [filter.sport]);

  useEffect(() => {
    if (autoSwitchedFor.current === filter.sport) return;
    if (gamesQuery.isLoading || otherQuery.isLoading) return;
    if (gamesEvents.length === 0 && otherEvents.length > 0) {
      setTab('other');
      autoSwitchedFor.current = filter.sport;
    }
  }, [filter.sport, gamesQuery.isLoading, otherQuery.isLoading, gamesEvents.length, otherEvents.length]);

  const activeQuery = tab === 'other' ? otherQuery : gamesQuery;
  const exchangeEvents = tab === 'other' ? otherEvents : gamesEvents;
  const isLoading = tab === 'other' ? otherQuery.isLoading : gamesQuery.isLoading;
  const error = activeQuery.error;

  return (
    <PlanGate requiredPlan="pro">

    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-ink tracking-tight text-2xl">Exchanges</h1>
          <p className="text-ink-dim font-mono text-[13px] mt-1">
            Kalshi and Polymarket prediction-market lines
          </p>
        </div>

        {activeQuery.dataUpdatedAt && (
          <div className="font-mono text-[11px] text-ink-dim">
            {new Date(activeQuery.dataUpdatedAt).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              second: '2-digit',
            })}
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <SportSelector />

        <div className="flex gap-1">
          <button
            type="button"
            onClick={() => setTab('games')}
            className={`px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] border ${
              tab === 'games'
                ? 'bg-moss text-ink border-moss'
                : 'bg-transparent text-ink-dim border-line hover:text-ink'
            }`}
          >
            Games
          </button>
          <button
            type="button"
            onClick={() => setTab('other')}
            className={`px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] border ${
              tab === 'other'
                ? 'bg-moss text-ink border-moss'
                : 'bg-transparent text-ink-dim border-line hover:text-ink'
            }`}
          >
            Other markets
          </button>
        </div>
      </div>

      {activeQuery.data?.stale && <StaleBanner cachedAt={activeQuery.data.cachedAt} />}

      {isLoading && <OddsGridSkeleton />}

      {error && error instanceof ApiError && error.status === 402 && (
        <UpgradeCard requiredPlan="pro" title="Upgrade to Pro to view Kalshi and Polymarket lines" />
      )}

      {error && !(error instanceof ApiError && error.status === 402) && (
        <div className="border border-bad p-4">
          <p className="text-bad font-mono text-[13px]">
            Failed to load exchange odds. Make sure the API server is running.
          </p>
        </div>
      )}

      {!isLoading && !error && exchangeEvents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-ink-dim uppercase tracking-[0.18em] text-[11px]">
            NO JOINED EXCHANGE LINE FOR THIS SPORT.
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
