import { useMemo, useState } from 'react';
import { useOdds } from '@/hooks/useOdds';
import { useHorizonAutoSeason } from '@/hooks/useHorizonAutoSeason';
import { useOddsStore } from '@/stores/oddsStore';
import SportSelector from './SportSelector';
import OddsBoard from './OddsBoard';
import { OddsGridSkeleton } from './OddsGrid';
import UpgradeCard from '@/components/auth/UpgradeCard';
import StaleBanner from '@/components/common/StaleBanner';
import DebugFooter from '@/components/common/DebugFooter';
import SharpCoverageNotice from '@/components/common/SharpCoverageNotice';
import { useDebugMode } from '@/hooks/useDebugMode';
import { ApiError } from '@/services/api';
import { SPORT_INFO, booksCaption, getVenue, eventInHorizon, type MarketType } from '@ny-sharp-edge/shared';
import HorizonChips from '@/components/common/HorizonChips';
import TonightElsewhere from '@/components/common/TonightElsewhere';
import HedgeStrip from '@/components/positions/HedgeStrip';
import { usePlan } from '@/components/auth/AuthProvider';
import BookEditor from '@/components/auth/BookEditor';
import Chip from '@/components/common/Chip';

export default function OddsPage() {
  const { filter, setMarketType, horizon, setHorizon } = useOddsStore();
  const { data, isLoading, error, dataUpdatedAt, refetch } = useOdds(filter.sport);
  const debug = useDebugMode();
  const { books, startCheckout } = usePlan();
  const [editingBooks, setEditingBooks] = useState(false);

  const sportName = SPORT_INFO[filter.sport].name;
  const marketType: MarketType = filter.marketType === 'all' ? 'h2h' : filter.marketType;
  useHorizonAutoSeason(data?.events);

  const boardEvents = useMemo(() => {
    const events = data?.events ?? [];
    const windowed = events.filter((e) => eventInHorizon(e.commenceTime, horizon));
    return [...windowed].sort(
      (a, b) => Date.parse(a.commenceTime) - Date.parse(b.commenceTime)
    );
  }, [data?.events, horizon]);

  return (
    <div className="space-y-4 min-w-0">
      <div className="min-w-0">
        <div className="flex items-end justify-between gap-3">
          <h1 className="font-display font-bold text-ink tracking-tight text-[1.75rem] leading-none">
            Odds
          </h1>
          {dataUpdatedAt && (
            <p className="font-mono text-[11px] text-ink-dim shrink-0">
              {new Date(dataUpdatedAt).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
              })}
            </p>
          )}
        </div>
        <p className="text-ink-dim font-mono text-[13px] mt-2 leading-snug">
          {booksCaption(books)}. PIN is the fair line. Tap a price for the slip. Other shops sit under Also. No live in-play.
        </p>
        <TonightElsewhere />
      </div>

      <div className="glass rounded-2xl p-3 space-y-3">
        <SportSelector sharpCoverage={data?.sharpCoverage} />
        <div className="flex flex-wrap gap-1.5">
          {([
            ['h2h', 'ML'],
            ['spreads', 'Spread'],
            ['totals', 'Total'],
          ] as const).map(([value, label]) => (
            <Chip
              key={value}
              onClick={() => setMarketType(value)}
              active={marketType === value}
            >
              {label}
            </Chip>
          ))}
          <HorizonChips />
        </div>
      </div>

      {books && (
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="label mr-1">Books</span>
          {books.map((id) => (
            <span key={id} className="chip min-h-8 px-2.5 text-[11px]">
              {getVenue(id).shortName}
            </span>
          ))}
          <button
            type="button"
            onClick={() => setEditingBooks(true)}
            className="chip text-lichen"
          >
            + Add
          </button>
        </div>
      )}

      {editingBooks && (
        <div className="glass rounded-2xl p-4">
          <BookEditor onClose={() => setEditingBooks(false)} />
        </div>
      )}

      {data?.stale && <StaleBanner cachedAt={data.cachedAt} />}

      <SharpCoverageNotice coverage={data?.sharpCoverage} />

      {data?.delayed && (
        <div className="glass rounded-2xl p-3 flex flex-col gap-3">
          <p className="text-warn text-[12px] leading-snug">
            Free tier shows lines delayed 15 minutes. Upgrade to Edge for live Pinnacle +EV.
          </p>
          <button
            type="button"
            onClick={() => {
              void startCheckout('edge');
            }}
            className="btn btn-primary w-full sm:w-auto"
          >
            Upgrade — $19/mo
          </button>
        </div>
      )}

      {isLoading && !error && <OddsGridSkeleton />}

      {error && error instanceof ApiError && error.status === 402 && (
        <UpgradeCard requiredPlan="edge" title="Upgrade to Edge to view live odds" />
      )}

      {error && !(error instanceof ApiError && error.status === 402) && (
        <div className="glass rounded-2xl p-4 space-y-3">
          <p className="text-bad font-mono text-[13px]">Can&apos;t reach the board.</p>
          <p className="font-mono text-[11px] text-ink-dim">
            The odds server did not answer. Retry, or run{' '}
            <code className="px-2 py-1 rounded-lg bg-[#d7f0fb] border-2 border-line">pnpm live</code>.
          </p>
          <button type="button" onClick={() => void refetch()} className="btn btn-secondary">
            Retry
          </button>
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
            No {sportName} in this window
          </p>
          <button
            type="button"
            onClick={() => setHorizon('season')}
            className="font-mono text-[11px] text-lichen hover:text-ink underline underline-offset-2"
          >
            Show the season ({data.events.length})
          </button>
        </div>
      )}

      {boardEvents.length > 0 && (
        <>
          <HedgeStrip events={boardEvents} shopIds={books} />
          <OddsBoard events={boardEvents} marketType={marketType} shopIds={books} />
        </>
      )}

      {debug && (
        <DebugFooter
          cachedAt={data?.cachedAt}
          remainingCredits={data?.remainingCredits}
        />
      )}
    </div>
  );
}
