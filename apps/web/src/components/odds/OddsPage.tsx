import { useMemo, useState } from 'react';
import { useOdds } from '@/hooks/useOdds';
import { useOddsStore } from '@/stores/oddsStore';
import SportSelector from './SportSelector';
import OddsBoard from './OddsBoard';
import { OddsGridSkeleton } from './OddsGrid';
import UpgradeCard from '@/components/auth/UpgradeCard';
import { useCheckout } from '@/hooks/useCheckout';
import StaleBanner from '@/components/common/StaleBanner';
import DebugFooter from '@/components/common/DebugFooter';
import SharpCoverageNotice from '@/components/common/SharpCoverageNotice';
import { useDebugMode } from '@/hooks/useDebugMode';
import { ApiError } from '@/services/api';
import { SPORT_INFO, isUpcomingEvent, type MarketType } from '@ny-sharp-edge/shared';

export default function OddsPage() {
  const { filter, setMarketType } = useOddsStore();
  const { data, isLoading, error, dataUpdatedAt } = useOdds(filter.sport);
  const debug = useDebugMode();
  const checkout = useCheckout();
  const [horizon, setHorizon] = useState<'soon' | 'all'>('soon');

  const sportName = SPORT_INFO[filter.sport].name;
  const marketType: MarketType = filter.marketType === 'all' ? 'h2h' : filter.marketType;

  const boardEvents = useMemo(() => {
    const events = data?.events ?? [];
    const windowed = horizon === 'soon' ? events.filter((e) => isUpcomingEvent(e.commenceTime)) : events;
    return [...windowed].sort(
      (a, b) => Date.parse(a.commenceTime) - Date.parse(b.commenceTime)
    );
  }, [data?.events, horizon]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-ink tracking-tight text-2xl">Odds</h1>
          <p className="text-ink-dim font-mono text-[13px] mt-1">
            Best shop to bet. Pinnacle is the fair line.
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

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <SportSelector sharpCoverage={data?.sharpCoverage} />

        <div className="flex flex-wrap items-center gap-1">
          {([
            ['h2h', 'Moneyline'],
            ['spreads', 'Spread'],
            ['totals', 'Total'],
          ] as const).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setMarketType(value)}
              className={`px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] border ${
                marketType === value
                  ? 'bg-moss text-ink border-moss'
                  : 'bg-transparent text-ink-dim border-line hover:border-moss hover:text-ink'
              }`}
            >
              {label}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setHorizon((h) => (h === 'soon' ? 'all' : 'soon'))}
            className="ml-2 px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] border border-line text-ink-dim hover:text-ink"
          >
            {horizon === 'soon' ? 'Next 3 days' : 'All games'}
          </button>
        </div>
      </div>

      {data?.stale && <StaleBanner cachedAt={data.cachedAt} />}

      <SharpCoverageNotice coverage={data?.sharpCoverage} />

      {data?.delayed && (
        <div className="border border-warn p-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-warn text-[11px] uppercase tracking-[0.14em]">
            Free tier shows lines delayed 15 minutes. Upgrade to Edge for live Pinnacle +EV.
          </p>
          <button
            type="button"
            onClick={async () => {
              const result = await checkout('edge');
              window.location.href = result.url ?? '/app';
            }}
            className="shrink-0 bg-moss hover:bg-moss-2 text-ink text-[11px] uppercase tracking-[0.14em] font-semibold px-4 py-2 border border-moss"
          >
            Upgrade — $19/mo
          </button>
        </div>
      )}

      {isLoading && <OddsGridSkeleton />}

      {error && error instanceof ApiError && error.status === 402 && (
        <UpgradeCard requiredPlan="edge" title="Upgrade to Edge to view live odds" />
      )}

      {error && !(error instanceof ApiError && error.status === 402) && (
        <div className="border border-bad p-4">
          <p className="text-bad font-mono text-[13px]">
            Failed to load odds. Make sure the API server is running.
          </p>
          <p className="font-mono text-[11px] text-ink-dim mt-2">
            Run <code className="bg-bg-2 px-2 py-1 border border-line">pnpm live</code> or <code className="bg-bg-2 px-2 py-1 border border-line">pnpm demo</code>
          </p>
        </div>
      )}

      {data && data.events.length === 0 && (
        <div className="text-center py-12">
          <p className="text-ink-dim uppercase tracking-[0.18em] text-[11px]">No {sportName} games scheduled</p>
        </div>
      )}

      {data && data.events.length > 0 && boardEvents.length === 0 && (
        <div className="text-center py-12 space-y-3">
          <p className="text-ink-dim uppercase tracking-[0.18em] text-[11px]">
            No {sportName} in the next 3 days
          </p>
          <button
            type="button"
            onClick={() => setHorizon('all')}
            className="font-mono text-[11px] text-lichen hover:text-ink underline underline-offset-2"
          >
            Show later games ({data.events.length})
          </button>
        </div>
      )}

      {boardEvents.length > 0 && <OddsBoard events={boardEvents} marketType={marketType} />}

      {debug && (
        <DebugFooter
          cachedAt={data?.cachedAt}
          remainingCredits={data?.remainingCredits}
        />
      )}
    </div>
  );
}
