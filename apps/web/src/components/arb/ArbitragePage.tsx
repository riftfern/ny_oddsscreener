import { useState } from 'react';
import { useArbitrageOpportunities } from '@/hooks/useOdds';
import PlanGate from '@/components/auth/PlanGate';
import UpgradeCard from '@/components/auth/UpgradeCard';
import StaleBanner from '@/components/common/StaleBanner';
import DebugFooter from '@/components/common/DebugFooter';
import { useDebugMode } from '@/hooks/useDebugMode';
import { ApiError } from '@/services/api';
import { formatAmerican, getSport, getVenue, type ArbitrageOpportunity } from '@ny-sharp-edge/shared';

const MIN_PROFIT_OPTIONS = [0.1, 0.5, 1, 2, 3];
const STAKE_OPTIONS = [100, 500, 1000, 5000];

function marketShort(type: ArbitrageOpportunity['marketType']): string {
  if (type === 'h2h') return 'ML';
  if (type === 'spreads') return 'SPR';
  return 'TOT';
}

export default function ArbitragePage() {
  const [minProfit, setMinProfit] = useState(0.5);
  const [totalStake, setTotalStake] = useState(100);
  const { data, isLoading, error, dataUpdatedAt } = useArbitrageOpportunities(minProfit, totalStake);
  const debug = useDebugMode();

  return (
    <PlanGate requiredPlan="pro">

    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-ink tracking-tight text-2xl">Arbitrage</h1>
          <p className="text-ink-dim font-mono text-[13px] mt-1">
            Theoretical until both legs clear
          </p>
        </div>

        {dataUpdatedAt && (
          <div className="font-mono text-[11px] text-ink-dim">
            {new Date(dataUpdatedAt).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              second: '2-digit',
            })}
          </div>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-6">
        <div className="flex items-center gap-2">
          <span className="label">Min Profit</span>
          <div className="flex gap-1">
            {MIN_PROFIT_OPTIONS.map((profit) => (
              <button
                key={profit}
                onClick={() => setMinProfit(profit)}
                className={`px-3 py-1.5 text-[11px] font-mono border ${
                  minProfit === profit
                    ? 'bg-moss text-ink border-moss'
                    : 'bg-transparent text-ink-dim border-line hover:text-ink hover:border-moss'
                }`}
              >
                {profit}%
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="label">Total Stake</span>
          <div className="flex gap-1">
            {STAKE_OPTIONS.map((stake) => (
              <button
                key={stake}
                onClick={() => setTotalStake(stake)}
                className={`px-3 py-1.5 text-[11px] font-mono border ${
                  totalStake === stake
                    ? 'bg-moss text-ink border-moss'
                    : 'bg-transparent text-ink-dim border-line hover:text-ink hover:border-moss'
                }`}
              >
                ${stake}
              </button>
            ))}
          </div>
        </div>

        {data && (
          <div className="font-mono text-[11px] text-ink-dim">
            {data.count} opportunities · {data.scannedEvents} events
          </div>
        )}
      </div>

      {data?.stale && <StaleBanner cachedAt={data.cachedAt} />}

      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin h-8 w-8 border-2 border-line border-t-moss"></div>
          <p className="mt-4 text-ink-dim font-mono text-[13px]">Scanning for arbitrage…</p>
        </div>
      )}

      {error && error instanceof ApiError && error.status === 402 && (
        <UpgradeCard requiredPlan="pro" title="Upgrade to Pro to use the arbitrage finder" />
      )}

      {error && !(error instanceof ApiError && error.status === 402) && (
        <div className="border border-bad p-4">
          <p className="text-bad font-mono text-[13px]">
            Failed to load arbitrage opportunities. Make sure the API server is running.
          </p>
        </div>
      )}

      {data && data.opportunities.length === 0 && (
        <div className="text-center py-12">
          <p className="text-ink-dim uppercase tracking-[0.18em] text-[11px]">
            No arbitrage at {minProfit}%
          </p>
          <p className="font-mono text-[11px] text-ink-dim mt-2">
            Arbitrage is rare. Try lowering the minimum or check back later.
          </p>
        </div>
      )}

      {data && data.opportunities.length > 0 && (
        <div className="border border-line overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line">
                {['Sport', 'Event', 'Mkt', 'Legs', 'Profit', 'If both clear', ''].map((h) => (
                  <th key={h} className="px-3 py-2 label whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.opportunities.map((opportunity, index) => (
                <ArbRow
                  key={`${opportunity.eventId}-${opportunity.marketType}-${index}`}
                  opportunity={opportunity}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="border border-line bg-bg-2 p-4">
        <h3 className="label mb-2">How it works</h3>
        <ul className="font-mono text-[12px] text-ink-dim space-y-1">
          <li>Arbitrage occurs when odds across different books imply a profit if both sides clear</li>
          <li>Place both bets at the suggested stake amounts quickly; lines can move before the second leg fills</li>
          <li>Act quickly — arbitrage opportunities can disappear within seconds</li>
          <li>Higher profit% = larger theoretical return, but these are extremely rare</li>
        </ul>
      </div>

      {debug && (
        <DebugFooter
          cachedAt={data?.cachedAt}
          remainingCredits={data?.remainingCredits}
        />
      )}
    </div>
    </PlanGate>
  );
}

function ArbRow({ opportunity }: { opportunity: ArbitrageOpportunity }) {
  const sport = getSport(opportunity.event.sportKey);

  return (
    <tr className="border-b border-line last:border-b-0 align-top">
      <td className="px-3 py-2 font-mono text-[11px] text-ink-dim">
        {sport.shortName}
      </td>
      <td className="px-3 py-2 text-ink text-sm whitespace-nowrap">
        {opportunity.event.awayTeam} @ {opportunity.event.homeTeam}
      </td>
      <td className="px-3 py-2 font-mono text-[11px] text-ink-dim">
        {marketShort(opportunity.marketType)}
      </td>
      <td className="px-3 py-2">
        <div className="space-y-1">
          {opportunity.legs.map((leg, i) => {
            const book = getVenue(leg.bookId);
            return (
              <div key={i} className="font-mono text-[12px] text-ink">
                {leg.outcomeName} {formatAmerican(leg.odds)}{' '}
                <span className="text-ink-dim">@ {book.shortName}</span>
                <span className="text-ink-dim"> · ${leg.suggestedStake.toFixed(2)}</span>
                {book.deepLink && (
                  <>
                    {' '}
                    <a
                      href={book.deepLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-lichen hover:text-ink underline underline-offset-2"
                    >
                      OPEN
                    </a>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </td>
      <td className="px-3 py-2 font-mono text-sm text-lichen tabular-nums whitespace-nowrap">
        +{opportunity.profitPercentage.toFixed(2)}%
      </td>
      <td className="px-3 py-2 font-mono text-sm text-ink tabular-nums whitespace-nowrap">
        ${opportunity.guaranteedProfit.toFixed(2)}
        <div className="text-[11px] text-ink-dim mt-0.5">both must clear</div>
      </td>
      <td className="px-3 py-2">
        <CopyArbButton opportunity={opportunity} />
      </td>
    </tr>
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
      className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim hover:text-ink border border-line px-2 py-1"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
