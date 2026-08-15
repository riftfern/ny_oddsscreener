import { useState } from 'react';
import type { ArbitrageOpportunity } from '@ny-sharp-edge/shared';
import { getVenue, SPORT_INFO, formatAmerican } from '@ny-sharp-edge/shared';

interface ArbitrageOpportunityCardProps {
  opportunity: ArbitrageOpportunity;
}

export default function ArbitrageOpportunityCard({ opportunity }: ArbitrageOpportunityCardProps) {
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
    <div className="card p-4 hover:border-yellow-500/50 transition-colors">
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

        {/* Profit Badge */}
        <div className="text-right">
          <div className="text-2xl font-bold text-yellow-400">
            +{opportunity.profitPercentage.toFixed(2)}%
          </div>
          <div className="text-xs text-gray-400">Theoretical Profit</div>
        </div>
      </div>

      {/* Legs */}
      <div className="space-y-2 mb-3">
        {opportunity.legs.map((leg, index) => {
          const book = getVenue(leg.bookId);
          return (
            <div
              key={index}
              className="bg-gray-900/50 rounded-lg p-3 flex items-center justify-between"
            >
              <div>
                <div className="text-white font-medium">{leg.outcomeName}</div>
                <div className="text-sm text-gray-400">
                  at{' '}
                  <span className="font-medium" style={{ color: book.color }}>
                    {book.name}
                  </span>
                </div>
                {book.deepLink && (
                  <a
                    href={book.deepLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-blue-400 hover:text-blue-300 mt-1 inline-block"
                  >
                    Open {book.name}
                  </a>
                )}
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-white">
                  {formatAmerican(leg.odds)}
                </div>
                <div className="text-sm text-gray-400">
                  Stake: ${leg.suggestedStake.toFixed(2)}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="border-t border-gray-700 pt-3 space-y-1">
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Total Stake:</span>
          <span className="text-white font-medium">${opportunity.totalStake.toFixed(2)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-400">Profit if both clear:</span>
          <span className="text-yellow-400 font-medium">
            ${opportunity.guaranteedProfit.toFixed(2)}
          </span>
        </div>
        <p className="text-xs text-gray-500 pt-1">
          Both bets must clear and the last price wins. Lines can move before you finish placing both legs.
        </p>
      </div>

      {/* Copy */}
      <CopyArbButton opportunity={opportunity} />
    </div>
  );
}

function CopyArbButton({ opportunity }: { opportunity: ArbitrageOpportunity }) {
  const [copied, setCopied] = useState(false);

  const description = opportunity.legs
    .map((leg) => {
      const book = getVenue(leg.bookId);
      return `${leg.outcomeName} ${formatAmerican(leg.odds)} @ ${book.name} | stake $${leg.suggestedStake.toFixed(2)}`;
    })
    .join(' // ');

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(description);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard errors.
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="w-full mt-4 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
    >
      {copied ? 'Copied' : 'Copy bet slip'}
    </button>
  );
}
