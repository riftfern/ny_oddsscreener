import { useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Share2 } from 'lucide-react';
import {
  formatAmerican,
  type TennisLockerBoard,
  type TennisLockerMatch,
} from '@ny-sharp-edge/shared';
import { ApiError, api } from '@/services/api';
import LiquidBg from '@/components/common/LiquidBg';
import BrandMark from '@/components/common/BrandMark';
import NotFound from '@/components/common/NotFound';

type Filter = 'picks' | 'all' | 'ATP' | 'WTA';

function kickoff(iso: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  return d.toLocaleString('en-US', {
    timeZone: 'America/New_York',
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function MatchCard({ match, compact }: { match: TennisLockerMatch; compact?: boolean }) {
  const modelPct = Math.round(match.pickProb * 100);
  const other = match.pickSide === 'A' ? match.playerB : match.playerA;
  const american = match.pickAmerican;
  const ev = match.pickEv;

  return (
    <article className="glass rounded-2xl p-3.5 min-w-0">
      <p className="font-mono text-[11px] text-ink-dim">
        {match.tour}
        <span className="mx-1.5">·</span>
        {match.tournament || match.surface}
        {match.commenceTime && (
          <>
            <span className="mx-1.5">·</span>
            {kickoff(match.commenceTime)}
          </>
        )}
      </p>
      <h3 className="mt-1 font-display font-semibold text-[16px] leading-snug text-ink break-words">
        {match.playerA}
        <span className="text-ink-dim font-normal"> vs </span>
        {match.playerB}
      </h3>

      <p className="mt-3 text-[15px] text-ink font-medium break-words">
        {match.pick}
        {match.isValue && (
          <span className="ml-2 chip chip-on min-h-7 px-2 text-[10px] align-middle">value</span>
        )}
        {match.thinData && (
          <span className="ml-2 chip min-h-7 px-2 text-[10px] align-middle">thin</span>
        )}
      </p>
      <p className="mt-1 font-mono text-[13px] tabular-nums">
        <span className="text-lichen">{modelPct}% model</span>
        {american != null && (
          <>
            <span className="text-ink-dim"> · </span>
            <span className="text-ink">{formatAmerican(american)}</span>
          </>
        )}
        {ev != null && (
          <>
            <span className="text-ink-dim"> · </span>
            <span className={ev >= 0 ? 'text-lichen' : 'text-ink-dim'}>
              {ev >= 0 ? '+' : ''}
              {ev.toFixed(1)}% EV
            </span>
          </>
        )}
      </p>
      {!compact && (
        <p className="mt-1 font-mono text-[11px] text-ink-dim">
          vs {other} · {Math.round((1 - match.pickProb) * 100)}%
        </p>
      )}
      <div className="mt-3 h-1.5 rounded-full bg-[#d7dce8] overflow-hidden">
        <div
          className="h-full rounded-full bg-[#3d6fd8]"
          style={{ width: `${Math.min(100, Math.max(8, modelPct))}%` }}
        />
      </div>
    </article>
  );
}

export default function LockerPage() {
  const { token } = useParams();
  const [filter, setFilter] = useState<Filter>('picks');
  const [copied, setCopied] = useState(false);

  const { data, error, isLoading } = useQuery<TennisLockerBoard>({
    queryKey: ['tennis-locker', token],
    queryFn: () => api.getTennisPicks(token ?? ''),
    enabled: Boolean(token),
    retry: false,
    staleTime: 60_000,
  });

  const forbidden = error instanceof ApiError && error.status === 404;
  const rows = useMemo(() => {
    if (!data) return [];
    if (filter === 'picks') return data.picks.length ? data.picks : data.matches;
    if (filter === 'all') return data.matches;
    return data.matches.filter((m) => m.tour === filter);
  }, [data, filter]);

  const share = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'scharfedge court', url });
        return;
      }
      await navigator.clipboard.writeText(url);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      /* user cancelled share sheet */
    }
  };

  if (!token || forbidden) {
    return <NotFound />;
  }

  return (
    <div className="liquid-scene text-ink flex flex-col min-h-dvh">
      <LiquidBg />
      <header
        className="sticky top-0 z-40 glass-strong"
        style={{ paddingTop: 'env(safe-area-inset-top)' }}
      >
        <div className="max-w-3xl mx-auto px-3 sm:px-4 h-14 flex items-center justify-between gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-[#eef2fb] text-base shrink-0">
              <BrandMark />
            </span>
            <span className="font-mono text-[10px] uppercase tracking-wider text-[#eef2fb] border-2 border-[#c9bde8] rounded-full px-2 py-0.5">
              court
            </span>
          </div>
          <button
            type="button"
            onClick={share}
            className="font-mono text-[11px] uppercase tracking-[0.12em] text-[#eef2fb] border-2 border-[#c9bde8] rounded-full px-2.5 py-1 inline-flex items-center gap-1.5"
          >
            <Share2 size={14} />
            {copied ? 'Copied' : 'Share'}
          </button>
        </div>
      </header>

      <main
        className="max-w-3xl mx-auto px-3 sm:px-4 pt-4 pb-[calc(1.5rem+env(safe-area-inset-bottom))] flex-1 w-full min-w-0 space-y-4"
      >
        <div>
          <h1 className="font-display font-bold text-ink tracking-tight text-[1.75rem] leading-none">
            Tennis picks
          </h1>
          <p className="text-ink-dim font-mono text-[13px] mt-2 leading-snug">
            Private board. Model lean, not a ticket. Confirm the number at your shop.
          </p>
          {data && (
            <p className="font-mono text-[11px] text-ink-dim mt-2">
              {new Date(data.generatedAt).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit',
              })}
              {' · '}
              {data.matchCount} upcoming
              {' · '}
              {data.totalMatches.toLocaleString()} matches in the model
              {data.ingestedLive && (data.ingestedLive.atp > 0 || data.ingestedLive.wta > 0) && (
                <>
                  {' · '}US Open scores folded in
                </>
              )}
            </p>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {(['picks', 'all', 'ATP', 'WTA'] as const).map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={filter === id ? 'chip chip-on shrink-0' : 'chip shrink-0'}
            >
              {id === 'picks' ? 'Picks' : id === 'all' ? 'All' : id}
            </button>
          ))}
        </div>

        {isLoading && (
          <p className="font-mono text-[13px] text-ink-dim">Loading the board…</p>
        )}

        {error && !forbidden && (
          <p className="font-mono text-[13px] text-bad">Could not load picks. Try again.</p>
        )}

        {data && rows.length === 0 && (
          <div className="glass rounded-2xl p-4">
            <p className="font-display font-semibold">No matches up yet</p>
            <p className="font-mono text-[12px] text-ink-dim mt-1">
              Odds feed is quiet, or the model has not published tonight. Pull to refresh later.
            </p>
          </div>
        )}

        <div className="grid gap-3">
          {rows.map((m) => (
            <MatchCard key={m.id} match={m} compact={filter !== 'picks'} />
          ))}
        </div>

        <div className="glass rounded-2xl p-4">
          <h3 className="label mb-2">How to read this</h3>
          <ul className="font-mono text-[12px] text-ink-dim space-y-1">
            <li>Pick is the model’s side. Value means +EV vs the best listed number.</li>
            <li>Trained on ATP + WTA match history, then today’s completed slam scores.</li>
            <li>18+. Not gambling advice. We do not take bets.</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
