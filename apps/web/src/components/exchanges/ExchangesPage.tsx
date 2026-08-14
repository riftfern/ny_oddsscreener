import { useExchangeOdds } from '@/hooks/useExchangeOdds';
import { useOddsStore } from '@/stores/oddsStore';
import SportSelector from '@/components/odds/SportSelector';
import OddsGrid, { OddsGridSkeleton } from '@/components/odds/OddsGrid';
import PlanGate from '@/components/auth/PlanGate';
import UpgradeCard from '@/components/auth/UpgradeCard';
import { ApiError } from '@/services/api';
import { VENUES, SPORT_INFO, type Event, type VenueKind } from '@ny-sharp-edge/shared';

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
  const { data, isLoading, error, dataUpdatedAt } = useExchangeOdds(filter.sport);

  const sportName = SPORT_INFO[filter.sport].name;
  const exchangeEvents = data ? filterExchangeEvents(data.events) : [];

  return (
    <PlanGate requiredPlan="pro">

    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Exchanges</h1>
          <p className="text-gray-400 text-sm mt-1">
            Kalshi and Polymarket prediction-market lines
          </p>
        </div>

        {dataUpdatedAt && (
          <div className="text-sm text-gray-400">
            Last updated:{' '}
            {new Date(dataUpdatedAt).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              second: '2-digit',
            })}
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <SportSelector />
      </div>

      {/* Content */}
      {isLoading && <OddsGridSkeleton />}

      {error && error instanceof ApiError && error.status === 402 && (
        <UpgradeCard requiredPlan="pro" title="Upgrade to Pro to view Kalshi and Polymarket lines" />
      )}

      {error && !(error instanceof ApiError && error.status === 402) && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-400">
            Failed to load exchange odds. Make sure the API server is running.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Run <code className="bg-gray-800 px-2 py-1 rounded">pnpm dev</code> in the project root
          </p>
        </div>
      )}

      {!isLoading && !error && exchangeEvents.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">
            No exchange line for {sportName} yet.
          </p>
        </div>
      )}

      {!isLoading && !error && exchangeEvents.length > 0 && (
        <OddsGrid events={exchangeEvents} displayedBooks={EXCHANGE_BOOK_IDS} />
      )}
    </div>
    </PlanGate>
  );
}
