import { useState } from 'react';
import { useArbitrageOpportunities } from '@/hooks/useOdds';
import ArbitrageOpportunityCard from './ArbitrageOpportunityCard';

const MIN_PROFIT_OPTIONS = [0.1, 0.5, 1, 2, 3];
const STAKE_OPTIONS = [100, 500, 1000, 5000];

export default function ArbitragePage() {
  const [minProfit, setMinProfit] = useState(0.5);
  const [totalStake, setTotalStake] = useState(100);
  const { data, isLoading, error, dataUpdatedAt } = useArbitrageOpportunities(minProfit, totalStake);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Arbitrage Finder</h1>
          <p className="text-gray-400 text-sm mt-1">
            Find guaranteed profit opportunities across sportsbooks
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
      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Min Profit%:</span>
          <div className="flex gap-1">
            {MIN_PROFIT_OPTIONS.map((profit) => (
              <button
                key={profit}
                onClick={() => setMinProfit(profit)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  minProfit === profit
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {profit}%
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Total Stake:</span>
          <div className="flex gap-1">
            {STAKE_OPTIONS.map((stake) => (
              <button
                key={stake}
                onClick={() => setTotalStake(stake)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  totalStake === stake
                    ? 'bg-yellow-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                ${stake}
              </button>
            ))}
          </div>
        </div>

        {data && (
          <div className="text-sm text-gray-400">
            {data.count} opportunities found across {data.scannedEvents} events
          </div>
        )}
      </div>

      {/* Content */}
      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-600 border-t-yellow-500"></div>
          <p className="mt-4 text-gray-400">Scanning for arbitrage opportunities...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-400">
            Failed to load arbitrage opportunities. Make sure the API server is running.
          </p>
        </div>
      )}

      {data && data.opportunities.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No arbitrage opportunities found at {minProfit}% threshold</p>
          <p className="text-sm text-gray-500 mt-2">
            Arbitrage opportunities are rare. Try lowering the minimum profit% or check back later.
          </p>
        </div>
      )}

      {data && data.opportunities.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.opportunities.map((opportunity, index) => (
            <ArbitrageOpportunityCard
              key={`${opportunity.eventId}-${opportunity.marketType}-${index}`}
              opportunity={opportunity}
            />
          ))}
        </div>
      )}

      {/* Info Section */}
      <div className="bg-gray-800/50 rounded-lg p-4 mt-8">
        <h3 className="text-sm font-medium text-gray-300 mb-2">How it works</h3>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>Arbitrage occurs when odds across different books guarantee a profit regardless of outcome</li>
          <li>Place both bets at the suggested stake amounts to lock in the guaranteed profit</li>
          <li>Act quickly - arbitrage opportunities can disappear within seconds</li>
          <li>Higher profit% = larger guaranteed return, but these are extremely rare</li>
        </ul>
      </div>
    </div>
  );
}
