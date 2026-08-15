import { useOdds } from '@/hooks/useOdds';
import { useOddsStore } from '@/stores/oddsStore';
import SportSelector from './SportSelector';
import OddsGrid, { OddsGridSkeleton } from './OddsGrid';
import UpgradeCard from '@/components/auth/UpgradeCard';
import { useCheckout } from '@/hooks/useCheckout';
import StaleBanner from '@/components/common/StaleBanner';
import DebugFooter from '@/components/common/DebugFooter';
import SharpCoverageNotice from '@/components/common/SharpCoverageNotice';
import { useDebugMode } from '@/hooks/useDebugMode';
import { ApiError } from '@/services/api';
import { SPORT_INFO, type MarketType } from '@ny-sharp-edge/shared';

export default function OddsPage() {
  const { filter, setMarketType } = useOddsStore();
  const { data, isLoading, error, dataUpdatedAt } = useOdds(filter.sport);
  const debug = useDebugMode();
  const checkout = useCheckout();

  const sportName = SPORT_INFO[filter.sport].name;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-ink tracking-tight text-2xl">Odds</h1>
          <p className="text-ink-dim font-mono text-[13px] mt-1">
            US books + Pinnacle fair line
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

        <select
          className="bg-bg-2 text-ink font-mono text-[12px] px-3 py-2 border border-line"
          value={filter.marketType}
          onChange={(e) => setMarketType(e.target.value as MarketType | 'all')}
        >
          <option value="all">All Markets</option>
          <option value="h2h">Moneyline</option>
          <option value="spreads">Spread</option>
          <option value="totals">Totals</option>
        </select>
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

      {data && data.events.length > 0 && <OddsGrid events={data.events} />}

      {debug && (
        <DebugFooter
          cachedAt={data?.cachedAt}
          remainingCredits={data?.remainingCredits}
        />
      )}
    </div>
  );
}
