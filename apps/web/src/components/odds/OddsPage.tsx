import { useOdds } from '@/hooks/useOdds';
import { useOddsStore } from '@/stores/oddsStore';
import SportSelector from './SportSelector';
import OddsGrid from './OddsGrid';
import { SPORT_INFO } from '@ny-sharp-edge/shared';

export default function OddsPage() {
  const { filter } = useOddsStore();
  const { data, isLoading, error, dataUpdatedAt } = useOdds(filter.sport);

  const sportName = SPORT_INFO[filter.sport].name;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Odds Comparison</h1>
          <p className="text-gray-400 text-sm mt-1">
            Compare odds across all NY legal sportsbooks
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
            onChange={() => {
              // TODO: implement market type filter
            }}
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
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-600 border-t-blue-500"></div>
          <p className="mt-4 text-gray-400">Loading {sportName} odds...</p>
        </div>
      )}

      {error && (
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
  );
}
