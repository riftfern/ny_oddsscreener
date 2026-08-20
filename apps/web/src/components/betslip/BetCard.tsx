import type { BetSelection } from '@ny-sharp-edge/shared';
import { formatAmerican, formatPick, calculatePayout } from '@ny-sharp-edge/shared';
import { useBetslipStore } from '../../stores/betslipStore';

interface BetCardProps {
  bet: BetSelection;
  hideStake?: boolean;
}

export function BetCard({ bet, hideStake }: BetCardProps) {
  const removeBet = useBetslipStore((state) => state.removeBet);
  const updateStake = useBetslipStore((state) => state.updateStake);

  const payout = bet.stake > 0 ? calculatePayout(bet.stake, bet.odds) : 0;

  const handleStakeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseFloat(e.target.value) || 0;
    updateStake(bet.id, value);
  };

  const selectionDisplay = formatPick(bet.outcomeName, bet.line, bet.marketType);
  const seq =
    bet.sequence === 'if' ? 'IF ' : bet.sequence === 'then' ? 'THEN ' : '';

  const gameTime = new Date(bet.event.commenceTime).toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

  return (
    <div className="bg-bg border border-line p-3 relative group">
      <button
        type="button"
        aria-label="Remove from slip"
        onClick={() => removeBet(bet.id)}
        className="absolute top-2 right-2 w-8 h-8 flex items-center justify-center
                   text-ink-dim hover:text-bad hover:bg-bg-2"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      <div className="text-[11px] uppercase tracking-[0.14em] text-ink-dim mb-1">
        {bet.event.awayTeam} @ {bet.event.homeTeam}
      </div>
      <div className="font-mono text-[11px] text-ink-dim mb-2">{gameTime}</div>

      <div className="flex items-center justify-between mb-3 gap-2">
        <span className="font-medium text-ink min-w-0 break-words">
          {seq}
          {selectionDisplay}
        </span>
        {bet.hideOdds ? (
          <span className="font-mono text-[11px] text-ink-dim shrink-0">at shop</span>
        ) : (
          <span className={`font-mono font-medium shrink-0 ${bet.odds > 0 ? 'text-lichen' : 'text-ink'}`}>
            {formatAmerican(bet.odds)}
          </span>
        )}
      </div>

      {!hideStake && (
      <div className="flex items-center gap-2">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim font-mono">$</span>
          <input
            type="number"
            value={bet.stake || ''}
            onChange={handleStakeChange}
            placeholder="0.00"
            min="0"
            step="5"
            className="w-full bg-bg-2 border border-line px-3 py-2 pl-7
                       text-ink font-mono placeholder-ink-dim focus:border-moss focus:outline-none"
          />
        </div>
        <div className="text-right min-w-[80px]">
          <div className="text-[11px] uppercase tracking-[0.14em] text-ink-dim">To win</div>
          <div className="text-lichen font-mono font-medium">
            ${payout > 0 ? (payout - bet.stake).toFixed(2) : '0.00'}
          </div>
        </div>
      </div>
      )}
    </div>
  );
}
