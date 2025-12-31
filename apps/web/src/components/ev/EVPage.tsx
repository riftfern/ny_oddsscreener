import { useState } from 'react';
import { useEVOpportunities } from '@/hooks/useOdds';
import EVOpportunityCard from './EVOpportunityCard';

const MIN_EV_OPTIONS = [0.5, 1, 2, 3, 5];

export default function EVPage() {
  const [minEV, setMinEV] = useState(1);
  const { data, isLoading, error, dataUpdatedAt } = useEVOpportunities(minEV);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">+EV Bet Finder</h1>
          <p className="text-gray-400 text-sm mt-1">
            Find positive expected value betting opportunities
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
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-400">Min EV%:</span>
          <div className="flex gap-1">
            {MIN_EV_OPTIONS.map((ev) => (
              <button
                key={ev}
                onClick={() => setMinEV(ev)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  minEV === ev
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {ev}%
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
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-600 border-t-green-500"></div>
          <p className="mt-4 text-gray-400">Scanning for +EV opportunities...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
          <p className="text-red-400">
            Failed to load +EV opportunities. Make sure the API server is running.
          </p>
        </div>
      )}

      {data && data.opportunities.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No +EV opportunities found at {minEV}% threshold</p>
          <p className="text-sm text-gray-500 mt-2">
            Try lowering the minimum EV% or check back later
          </p>
        </div>
      )}

      {data && data.opportunities.length > 0 && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {data.opportunities.map((opportunity, index) => (
            <EVOpportunityCard
              key={`${opportunity.eventId}-${opportunity.bookId}-${opportunity.outcomeName}-${index}`}
              opportunity={opportunity}
            />
          ))}
        </div>
      )}

      {/* Info Section */}
      <div className="bg-gray-800/50 rounded-lg p-4 mt-8">
        <h3 className="text-sm font-medium text-gray-300 mb-2">How it works</h3>
        <ul className="text-sm text-gray-400 space-y-1">
          <li>Fair odds are calculated by removing the vig from the sharpest available lines</li>
          <li>+EV% shows expected profit per $100 wagered over the long run</li>
          <li>Kelly stake is calculated at 1/4 Kelly for a $1,000 bankroll</li>
          <li>Higher EV% = larger edge, but opportunities may be limited or move quickly</li>
        </ul>
      </div>
    </div>
  );
}
