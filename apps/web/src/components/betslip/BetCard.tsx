import type { BetSelection } from '@ny-sharp-edge/shared';
import { formatAmerican, calculatePayout } from '@ny-sharp-edge/shared';
import { useBetslipStore } from '../../stores/betslipStore';

interface BetCardProps {
  bet: BetSelection;
}

export function BetCard({ bet }: BetCardProps) {
  const removeBet = useBetslipStore((state) => state.removeBet);
  const updateStake = useBetslipStore((state) => state.updateStake);

  const payout = bet.stake > 0 ? calculatePayout(bet.stake, bet.odds) : 0;

  const handleStakeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    updateStake(bet.id, value);
  };

  // Format the selection display
  const selectionDisplay = bet.line !== undefined
    ? `${bet.outcomeName} ${bet.line > 0 ? '+' : ''}${bet.line}`
    : bet.outcomeName;

  // Format game time
  const gameTime = new Date(bet.event.commenceTime).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="bg-gray-700 rounded-lg p-3 relative group">
      {/* Remove button */}
      <button
        onClick={() => removeBet(bet.id)}
        className="absolute top-2 right-2 w-6 h-6 flex items-center justify-center
                   text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded
                   opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* Event info */}
      <div className="text-xs text-gray-400 mb-1">
        {bet.event.awayTeam} @ {bet.event.homeTeam}
      </div>
      <div className="text-xs text-gray-500 mb-2">{gameTime}</div>

      {/* Selection and odds */}
      <div className="flex items-center justify-between mb-3">
        <span className="font-medium text-white">{selectionDisplay}</span>
        <span className={`font-bold ${bet.odds > 0 ? 'text-green-400' : 'text-white'}`}>
          {formatAmerican(bet.odds)}
        </span>
      </div>

      {/* Stake input */}
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">$</span>
          <input
            type="number"
            value={bet.stake || ''}
            onChange={handleStakeChange}
            placeholder="0.00"
            min="0"
            step="5"
            className="w-full bg-gray-600 border border-gray-500 rounded px-3 py-2 pl-7
                       text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
          />
        </div>
        <div className="text-right min-w-[80px]">
          <div className="text-xs text-gray-400">To win</div>
          <div className="text-green-400 font-medium">
            ${payout > 0 ? (payout - bet.stake).toFixed(2) : '0.00'}
          </div>
        </div>
      </div>
    </div>
  );
}
