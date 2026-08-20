import { useMemo, useState } from 'react';
import { useEVOpportunities } from '@/hooks/useOdds';
import { useHorizonAutoSeason } from '@/hooks/useHorizonAutoSeason';
import { usePreferInSeasonWhenEmpty } from '@/hooks/usePreferInSeasonWhenEmpty';
import TonightElsewhere from '@/components/common/TonightElsewhere';
import { useOddsStore } from '@/stores/oddsStore';
import SportSelector from '@/components/odds/SportSelector';
import PlanGate from '@/components/auth/PlanGate';
import UpgradeCard from '@/components/auth/UpgradeCard';
import StaleBanner from '@/components/common/StaleBanner';
import DebugFooter from '@/components/common/DebugFooter';
import SharpCoverageNotice from '@/components/common/SharpCoverageNotice';
import Chip from '@/components/common/Chip';
import { useDebugMode } from '@/hooks/useDebugMode';
import { ApiError } from '@/services/api';
import {
  booksCaption,
  classifyEdge,
  eventInHorizon,
  formatAmerican,
  freshnessLabel,
  getSport,
  getVenue,
  kellyStakeAmerican,
  lineFreshness,
  opportunityUpdatedAt,
  QUIET_MIN_EV,
  shopHref,
  type EVOpportunity,
  type MarketType,
} from '@ny-sharp-edge/shared';
import HorizonChips from '@/components/common/HorizonChips';
import { useBetslipStore } from '@/stores/betslipStore';
import { groupEVOpportunities, type GroupedEV } from '@/utils/groupEV';
import { usePlan } from '@/components/auth/AuthProvider';
import BookEditor from '@/components/auth/BookEditor';
import { useBankrollStore } from '@/stores/bankrollStore';

const MIN_EV_OPTIONS = [1, 2, 3, 5];

function marketShort(type: MarketType): string {
  if (type === 'h2h') return 'ML';
  if (type === 'spreads') return 'SPR';
  return 'TOT';
}

function pickLabel(opp: EVOpportunity, line?: number): string {
  if (line === undefined) return opp.outcomeName;
  const signed = line > 0 ? `+${line}` : `${line}`;
  if (opp.marketType === 'totals') {
    return `${opp.outcomeName} ${line}`;
  }
  return `${opp.outcomeName} ${signed}`;
}

function copyDescription(group: GroupedEV, stakeNote?: string): string {
  const book = getVenue(group.best.bookId);
  const { best } = group;
  const kelly = stakeNote ? ` | ${stakeNote}` : '';
  return `${best.outcomeName} ${formatAmerican(best.bookOdds)} @ ${book.name} | fair ${formatAmerican(best.fairOdds)} | EV ${best.evPercentage.toFixed(1)}%${kelly}`;
}

export default function EVPage() {
  const [minEV, setMinEV] = useState(QUIET_MIN_EV);
  const [hideSuspect, setHideSuspect] = useState(true);
  const sport = useOddsStore((s) => s.filter.sport);
  const horizon = useOddsStore((s) => s.horizon);
  const { data, isLoading, error, dataUpdatedAt, refetch } = useEVOpportunities(minEV, sport);
  const debug = useDebugMode();
  const { books } = usePlan();
  const [editingBooks, setEditingBooks] = useState(false);
  const evEvents = useMemo(() => {
    if (!data) return undefined;
    const seen = new Set<string>();
    return data.opportunities
      .map((o) => o.event)
      .filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)));
  }, [data]);
  useHorizonAutoSeason(evEvents);
  usePreferInSeasonWhenEmpty(evEvents);

  const { groups, hiddenSuspect } = useMemo(() => {
    if (!data) return { groups: [], hiddenSuspect: 0 };
    const scoped = data.opportunities.filter((o) => {
      if (books && !books.includes(o.bookId)) return false;
      return eventInHorizon(o.event.commenceTime, horizon);
    });
    const suspects = scoped.filter((o) => classifyEdge(o.evPercentage) === 'suspect');
    const shown = hideSuspect
      ? scoped.filter((o) => classifyEdge(o.evPercentage) !== 'suspect')
      : scoped;
    return {
      groups: groupEVOpportunities(shown),
      hiddenSuspect: suspects.length,
    };
  }, [data, books, horizon, hideSuspect]);

  return (
    <PlanGate requiredPlan="edge">
      <div className="space-y-4 min-w-0">
        <div className="min-w-0">
          <div className="flex items-end justify-between gap-3">
            <h1 className="font-display font-bold text-ink tracking-tight text-[1.75rem] leading-none">
              Edges
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
            Only {booksCaption(books)}. Fair is Pinnacle with the juice taken out. Fat numbers over 20% stay hidden — usually a pulled line.
          </p>
          <TonightElsewhere />
        </div>

        <div className="glass rounded-2xl p-3 space-y-3">
          <SportSelector sharpCoverage={data?.sharpCoverage} />
          <div className="flex flex-wrap gap-1.5">
            <HorizonChips />
          </div>
          {books && (
            <button
              type="button"
              onClick={() => setEditingBooks(true)}
              className="chip text-lichen"
            >
              {booksCaption(books)}
            </button>
          )}
          {editingBooks && (
            <div className="rounded-2xl bg-[#d7f0fb] border-2 border-line p-4">
              <BookEditor onClose={() => setEditingBooks(false)} />
            </div>
          )}
          <div className="flex flex-wrap items-center gap-2">
            <span className="label">Min EV</span>
            {MIN_EV_OPTIONS.map((ev) => (
              <Chip key={ev} onClick={() => setMinEV(ev)} active={minEV === ev}>
                {ev}%
              </Chip>
            ))}
            {data && (
              <span className="font-mono text-[11px] text-ink-dim w-full sm:w-auto">
                {groups.length} picks · {data.scannedEvents} events
                {hiddenSuspect > 0 ? ` · ${hiddenSuspect} likely stale hidden` : ''}
              </span>
            )}
          </div>
          {hiddenSuspect > 0 && (
            <button
              type="button"
              className="font-mono text-[12px] text-lichen underline underline-offset-2"
              onClick={() => setHideSuspect((v) => !v)}
            >
              {hideSuspect ? 'Show likely-stale lines' : 'Hide likely-stale lines'}
            </button>
          )}
        </div>

        {data?.stale && <StaleBanner cachedAt={data.cachedAt} />}

        <SharpCoverageNotice coverage={data?.sharpCoverage} />

        {isLoading && !error && (
          <div className="text-center py-12">
            <div className="inline-block animate-spin h-8 w-8 rounded-full border-2 border-line border-t-lichen" />
            <p className="mt-4 text-ink-dim font-mono text-[13px]">Scanning for +EV…</p>
          </div>
        )}

        {error && error instanceof ApiError && error.status === 402 && (
          <UpgradeCard requiredPlan="edge" title="Upgrade to Edge to use the +EV finder" />
        )}

        {error && !(error instanceof ApiError && error.status === 402) && (
          <div className="glass rounded-2xl p-4 space-y-3">
            <p className="text-bad font-mono text-[13px]">Can&apos;t reach the board.</p>
            <button type="button" onClick={() => void refetch()} className="btn btn-secondary">
              Retry
            </button>
          </div>
        )}

        {data && groups.length === 0 && (
          <div className="text-center py-12 space-y-2">
            <p className="text-ink-dim uppercase tracking-[0.14em] text-[11px]">
              No placeable +EV at {minEV}% for this sport
            </p>
            <p className="font-mono text-[11px] text-ink-dim">
              {hiddenSuspect > 0
                ? `${hiddenSuspect} likely-stale lines are hidden. Or lower the minimum.`
                : 'Try another sport or check back after lines move.'}
            </p>
          </div>
        )}

        {groups.length > 0 && (
          <div className="grid gap-3">
            {groups.map((group) => (
              <EVCard key={group.key} group={group} />
            ))}
          </div>
        )}

        <div className="glass rounded-2xl p-4">
          <h3 className="label mb-2">How the number is built</h3>
          <ul className="font-mono text-[12px] text-ink-dim space-y-1">
            <li>Fair = Pinnacle both sides, juice stripped (multiplicative no-vig)</li>
            <li>EV% = how much better your shop pays than that fair number</li>
            <li>Stake is ¼ Kelly on your local bankroll (or $1k if you have not set one)</li>
            <li>Open the book and place it yourself — we do not take bets</li>
          </ul>
        </div>

        {debug && (
          <DebugFooter cachedAt={data?.cachedAt} remainingCredits={data?.remainingCredits} />
        )}
      </div>
    </PlanGate>
  );
}

function stakeFor(opp: EVOpportunity, bankroll: number): { dollars: number; note: string } {
  const roll = bankroll > 0 ? bankroll : 1000;
  const dollars = Math.round(kellyStakeAmerican(opp.fairProbability, opp.bookOdds, roll, 0.25));
  const note =
    bankroll > 0
      ? `$${dollars} · ¼ Kelly`
      : `$${dollars} on $1k · ¼ Kelly`;
  return { dollars, note };
}

function EVCard({ group }: { group: GroupedEV }) {
  const { best, others, line } = group;
  const sport = getSport(best.event.sportKey);
  const book = getVenue(best.bookId);
  const bankroll = useBankrollStore((s) => s.balance);
  const stake = stakeFor(best, bankroll);
  const updatedAt = opportunityUpdatedAt(best);
  const fresh = lineFreshness(updatedAt);
  const age = freshnessLabel(updatedAt);
  const quality = classifyEdge(best.evPercentage);

  return (
    <article className="glass rounded-2xl p-3.5 min-w-0">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[11px] text-ink-dim">
            {sport.shortName}
            <span className="mx-1.5 text-ink-dim">·</span>
            {marketShort(best.marketType)}
            {age && (
              <>
                <span className="mx-1.5 text-ink-dim">·</span>
                <span className={fresh === 'stale' ? 'text-warn' : ''}>{age}</span>
              </>
            )}
          </p>
          <h3 className="mt-1 font-display font-semibold text-[16px] leading-snug text-ink break-words">
            {best.event.awayTeam}
            <span className="text-ink-dim font-normal"> @ </span>
            {best.event.homeTeam}
          </h3>
        </div>
        <p className="shrink-0 font-mono text-[18px] font-medium text-lichen tabular-nums">
          +{best.evPercentage.toFixed(1)}%
        </p>
      </div>

      <p className="mt-3 text-[15px] text-ink font-medium break-words">{pickLabel(best, line)}</p>
      <p className="mt-1 font-mono text-[13px] tabular-nums">
        <span className="text-lichen">
          {book.shortName} {formatAmerican(best.bookOdds)}
        </span>
        <span className="text-ink-dim"> · </span>
        <span className="text-ink-dim">fair {formatAmerican(best.fairOdds)}</span>
        {stake.dollars > 0 && (
          <>
            <span className="text-ink-dim"> · </span>
            <span className="text-ink">{stake.note}</span>
          </>
        )}
      </p>
      {quality === 'suspect' && (
        <p className="mt-1 font-mono text-[11px] text-warn">
          This fat is usually a pulled line. Confirm at the shop.
        </p>
      )}
      {fresh === 'stale' && quality !== 'suspect' && (
        <p className="mt-1 font-mono text-[11px] text-warn">
          Line is old — confirm at the shop before you bet.
        </p>
      )}
      {others.length > 0 && (
        <p className="mt-1 font-mono text-[11px] text-ink-dim leading-relaxed break-words">
          Also {others.map((o) => `${getVenue(o.bookId).shortName} ${formatAmerican(o.bookOdds)}`).join(' · ')}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <AddEdgeButton group={group} />
        {shopHref(book.id) ? (
          <a
            href={shopHref(book.id)}
            target="_blank"
            rel="noopener noreferrer"
            className="chip chip-on flex-1"
          >
            Open
          </a>
        ) : null}
        <CopyBetButton description={copyDescription(group, stake.dollars > 0 ? stake.note : undefined)} />
      </div>
    </article>
  );
}

function AddEdgeButton({ group }: { group: GroupedEV }) {
  const addBet = useBetslipStore((s) => s.addBet);
  return (
    <button
      type="button"
      className="chip flex-1"
      onClick={() =>
        addBet({
          eventId: group.best.event.id,
          event: group.best.event,
          marketType: group.best.marketType,
          outcomeName: group.best.outcomeName,
          bookId: group.best.bookId,
          odds: group.best.bookOdds,
        })
      }
    >
      Add slip
    </button>
  );
}

function CopyBetButton({ description }: { description: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(description);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard errors (e.g., insecure context).
    }
  };

  return (
    <button type="button" onClick={handleCopy} className="chip flex-1">
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
