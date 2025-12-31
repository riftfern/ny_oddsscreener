import type { EVOpportunity } from '@ny-sharp-edge/shared';
import { SPORTSBOOK_INFO, SPORT_INFO, formatAmerican } from '@ny-sharp-edge/shared';

interface EVOpportunityCardProps {
  opportunity: EVOpportunity;
}

export default function EVOpportunityCard({ opportunity }: EVOpportunityCardProps) {
  const book = SPORTSBOOK_INFO[opportunity.bookId];
  const sport = SPORT_INFO[opportunity.event.sportKey];

  const gameTime = new Date(opportunity.event.commenceTime).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  const marketLabel =
    opportunity.marketType === 'h2h'
      ? 'Moneyline'
      : opportunity.marketType === 'spreads'
      ? 'Spread'
      : 'Total';

  return (
    <div className="card p-4 hover:border-green-500/50 transition-colors">
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-gray-700 px-2 py-0.5 rounded">{sport.shortName}</span>
            <span className="text-xs text-gray-400">{marketLabel}</span>
          </div>
          <div className="text-sm text-gray-300">
            {opportunity.event.awayTeam} @ {opportunity.event.homeTeam}
          </div>
          <div className="text-xs text-gray-500 mt-1">{gameTime}</div>
        </div>

        {/* EV Badge */}
        <div className="text-right">
          <div className="text-2xl font-bold text-green-400">
            +{opportunity.evPercentage.toFixed(1)}%
          </div>
          <div className="text-xs text-gray-400">Expected Value</div>
        </div>
      </div>

      {/* Bet Details */}
      <div className="bg-gray-900/50 rounded-lg p-3 mb-3">
        <div className="flex items-center justify-between mb-2">
          <div>
            <div className="text-white font-medium">{opportunity.outcomeName}</div>
            <div className="text-sm text-gray-400">
              at{' '}
              <span
                className="font-medium"
                style={{ color: book.color }}
              >
                {book.name}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="text-xl font-bold text-white">
              {formatAmerican(opportunity.bookOdds)}
            </div>
            <div className="text-xs text-gray-400">Book Odds</div>
          </div>
        </div>

        {/* Fair Odds Comparison */}
        <div className="flex items-center justify-between text-sm border-t border-gray-700 pt-2 mt-2">
          <div>
            <span className="text-gray-400">Fair Odds: </span>
            <span className="text-gray-300">{formatAmerican(opportunity.fairOdds)}</span>
          </div>
          <div>
            <span className="text-gray-400">Edge: </span>
            <span className="text-green-400">{(opportunity.edge * 100).toFixed(1)}%</span>
          </div>
        </div>
      </div>

      {/* Kelly Suggestion */}
      {opportunity.kellySuggestion && opportunity.kellySuggestion > 0 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Kelly Stake (1/4):</span>
          <span className="text-white font-medium">
            ${opportunity.kellySuggestion.toFixed(2)}
          </span>
        </div>
      )}

      {/* Edge per $100 */}
      <div className="flex items-center justify-between text-sm mt-1">
        <span className="text-gray-400">Edge per $100:</span>
        <span className="text-green-400 font-medium">
          ${(opportunity.evPercentage).toFixed(2)}
        </span>
      </div>
    </div>
  );
}
