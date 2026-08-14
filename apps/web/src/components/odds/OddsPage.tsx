import { useOdds } from '@/hooks/useOdds';
import { useOddsStore } from '@/stores/oddsStore';
import SportSelector from './SportSelector';
import OddsGrid, { OddsGridSkeleton } from './OddsGrid';
import PlanGate from '@/components/auth/PlanGate';
import UpgradeCard from '@/components/auth/UpgradeCard';
import { ApiError } from '@/services/api';
import { SPORT_INFO, type MarketType } from '@ny-sharp-edge/shared';

export default function OddsPage() {
  const { filter, setMarketType } = useOddsStore();
  const { data, isLoading, error, dataUpdatedAt } = useOdds(filter.sport);

  const sportName = SPORT_INFO[filter.sport].name;

  return (
    <PlanGate requiredPlan="edge">

    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Odds Comparison</h1>
          <p className="text-gray-400 text-sm mt-1">
            US books + Pinnacle fair line
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

        <div className="flex items-center space-x-4">
          <select
            className="bg-gray-700 text-white text-sm rounded-lg px-3 py-2 border border-gray-600"
            value={filter.marketType}
            onChange={(e) => setMarketType(e.target.value as MarketType | 'all')}
          >
            <option value="all">All Markets</option>
            <option value="h2h">Moneyline</option>
            <option value="spreads">Spread</option>
            <option value="totals">Totals</option>
          </select>

          <select
            className="bg-gray-700 text-white text-sm rounded-lg px-3 py-2 border border-gray-600"
            value={filter.date}
            onChange={() => {
              // TODO: implement date filter
            }}
          >
            <option value="today">Today</option>
            <option value="tomorrow">Tomorrow</option>
            <option value="week">This Week</option>
          </select>
        </div>
      </div>

      {/* Content */}
      {isLoading && <OddsGridSkeleton />}

      {error && error instanceof ApiError && error.status === 402 && (
        <UpgradeCard requiredPlan="edge" title="Upgrade to Edge to view live odds" />
      )}

      {error && !(error instanceof ApiError && error.status === 402) && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-400">
            Failed to load odds. Make sure the API server is running.
          </p>
          <p className="text-sm text-gray-400 mt-2">
            Run <code className="bg-gray-800 px-2 py-1 rounded">pnpm dev</code> in the project root
          </p>
        </div>
      )}

      {data && data.events.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No {sportName} games scheduled for today</p>
        </div>
      )}

      {data && data.events.length > 0 && <OddsGrid events={data.events} />}
    </div>
    </PlanGate>
  );
}
