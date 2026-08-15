import { useState } from 'react';
import { useEVOpportunities } from '@/hooks/useOdds';
import { useOddsStore } from '@/stores/oddsStore';
import SportSelector from '@/components/odds/SportSelector';
import PlanGate from '@/components/auth/PlanGate';
import UpgradeCard from '@/components/auth/UpgradeCard';
import StaleBanner from '@/components/common/StaleBanner';
import DebugFooter from '@/components/common/DebugFooter';
import SharpCoverageNotice from '@/components/common/SharpCoverageNotice';
import { useDebugMode } from '@/hooks/useDebugMode';
import { ApiError } from '@/services/api';
import { formatAmerican, getSport, getVenue, type EVOpportunity, type MarketType } from '@ny-sharp-edge/shared';
import { groupEVOpportunities, type GroupedEV } from '@/utils/groupEV';
import { usePlan } from '@/components/auth/AuthProvider';
import BookEditor from '@/components/auth/BookEditor';

const MIN_EV_OPTIONS = [0.5, 1, 2, 3, 5];

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

function copyDescription(group: GroupedEV): string {
  const book = getVenue(group.best.bookId);
  const { best } = group;
  return `${best.outcomeName} ${formatAmerican(best.bookOdds)} @ ${book.name} | fair ${formatAmerican(best.fairOdds)} | EV ${best.evPercentage.toFixed(1)}%${best.kellySuggestion ? ` | 1/4 Kelly $${best.kellySuggestion.toFixed(0)}` : ''}`;
}

export default function EVPage() {
  const [minEV, setMinEV] = useState(1);
  const sport = useOddsStore((s) => s.filter.sport);
  const { data, isLoading, error, dataUpdatedAt } = useEVOpportunities(minEV, sport);
  const debug = useDebugMode();
  const { books } = usePlan();
  const [editingBooks, setEditingBooks] = useState(false);

  const groups = data
    ? groupEVOpportunities(
        books
          ? data.opportunities.filter((o) => books.includes(o.bookId))
          : data.opportunities
      )
    : [];

  return (
    <PlanGate requiredPlan="edge">

    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="font-display font-bold text-ink tracking-tight text-2xl">Edges</h1>
          <p className="text-ink-dim font-mono text-[13px] mt-1">
            {books
              ? 'Better numbers at your books'
              : 'Books paying more than the Pinnacle number'}
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

      <div className="flex flex-col gap-3">
        <SportSelector sharpCoverage={data?.sharpCoverage} />
        {books && (
          <button
            type="button"
            onClick={() => setEditingBooks(true)}
            className="self-start font-mono text-[11px] uppercase tracking-[0.14em] text-lichen hover:text-ink border border-moss px-2 py-1"
          >
            + Add book
          </button>
        )}
        {editingBooks && (
          <div className="border border-line bg-bg-2 p-5">
            <BookEditor onClose={() => setEditingBooks(false)} />
          </div>
        )}
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="label">Min EV</span>
            <div className="flex gap-1">
              {MIN_EV_OPTIONS.map((ev) => (
                <button
                  key={ev}
                  onClick={() => setMinEV(ev)}
                  className={`px-3 py-1.5 text-[11px] font-mono border ${
                    minEV === ev
                      ? 'bg-moss text-ink border-moss'
                      : 'bg-transparent text-ink-dim border-line hover:text-ink hover:border-moss'
                  }`}
                >
                  {ev}%
                </button>
              ))}
            </div>
          </div>

          {data && (
            <div className="font-mono text-[11px] text-ink-dim">
              {groups.length} picks · {data.scannedEvents} events
            </div>
          )}
        </div>
      </div>

      {data?.stale && <StaleBanner cachedAt={data.cachedAt} />}

      <SharpCoverageNotice coverage={data?.sharpCoverage} />

      {isLoading && (
        <div className="text-center py-12">
          <div className="inline-block animate-spin h-8 w-8 border-2 border-line border-t-moss"></div>
          <p className="mt-4 text-ink-dim font-mono text-[13px]">Scanning for +EV…</p>
        </div>
      )}

      {error && error instanceof ApiError && error.status === 402 && (
        <UpgradeCard requiredPlan="edge" title="Upgrade to Edge to use the +EV finder" />
      )}

      {error && !(error instanceof ApiError && error.status === 402) && (
        <div className="border border-bad p-4">
          <p className="text-bad font-mono text-[13px]">
            Failed to load +EV opportunities. Make sure the API server is running.
          </p>
        </div>
      )}

      {data && groups.length === 0 && (
        <div className="text-center py-12">
          <p className="text-ink-dim uppercase tracking-[0.18em] text-[11px]">
            No +EV at {minEV}% for this sport
          </p>
          <p className="font-mono text-[11px] text-ink-dim mt-2">
            Try lowering the minimum EV% or check back later
          </p>
        </div>
      )}

      {groups.length > 0 && (
        <div className="border border-line overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-line">
                {(debug
                  ? ['Sport', 'Event', 'Mkt', 'Pick', 'Fair', 'Best book', 'EV%', 'Kelly', 'Open', '']
                  : ['Sport', 'Event', 'Mkt', 'Pick', 'Fair', 'Best book', 'EV%', 'Open', '']
                ).map((h) => (
                  <th key={h} className="px-3 py-2 label whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {groups.map((group) => (
                <EVRow key={group.key} group={group} showKelly={debug} />
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="border border-line bg-bg-2 p-4">
        <h3 className="label mb-2">How it works</h3>
        <ul className="font-mono text-[12px] text-ink-dim space-y-1">
          <li>Fair is the Pinnacle number with the juice taken out</li>
          <li>EV% is how much better the shop is paying than that number</li>
          <li>Open the book and place it yourself — we do not take bets</li>
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

function EVRow({ group, showKelly }: { group: GroupedEV; showKelly: boolean }) {
  const { best, others, line } = group;
  const sport = getSport(best.event.sportKey);
  const book = getVenue(best.bookId);

  return (
    <tr className="border-b border-line last:border-b-0">
      <td className="px-3 py-2 font-mono text-[11px] text-ink-dim whitespace-nowrap">
        {sport.shortName}
      </td>
      <td className="px-3 py-2 text-ink text-sm whitespace-nowrap">
        {best.event.awayTeam} @ {best.event.homeTeam}
      </td>
      <td className="px-3 py-2 font-mono text-[11px] text-ink-dim">
        {marketShort(best.marketType)}
      </td>
      <td className="px-3 py-2 text-ink text-sm">
        <div>{pickLabel(best, line)}</div>
        {others.length > 0 && (
          <div className="font-mono text-[11px] text-ink-dim mt-0.5">
            {others.map((o) => `${getVenue(o.bookId).shortName} ${formatAmerican(o.bookOdds)}`).join(' · ')}
          </div>
        )}
      </td>
      <td className="px-3 py-2 font-mono text-sm text-ink tabular-nums">
        {formatAmerican(best.fairOdds)}
      </td>
      <td className="px-3 py-2 font-mono text-sm text-ink whitespace-nowrap">
        {book.shortName} {formatAmerican(best.bookOdds)}
      </td>
      <td className="px-3 py-2 font-mono text-sm text-lichen tabular-nums whitespace-nowrap">
        +{best.evPercentage.toFixed(1)}%
      </td>
      {showKelly && (
        <td className="px-3 py-2 font-mono text-sm text-ink tabular-nums">
          {best.kellySuggestion && best.kellySuggestion > 0
            ? `$${best.kellySuggestion.toFixed(0)}`
            : '—'}
        </td>
      )}
      <td className="px-3 py-2 whitespace-nowrap">
        {book.deepLink ? (
          <a
            href={book.deepLink}
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] text-lichen hover:text-ink underline underline-offset-2"
          >
            OPEN
          </a>
        ) : (
          <span className="font-mono text-[11px] text-ink-dim">—</span>
        )}
      </td>
      <td className="px-3 py-2">
        <CopyBetButton description={copyDescription(group)} />
      </td>
    </tr>
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
    <button
      type="button"
      onClick={handleCopy}
      className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim hover:text-ink border border-line px-2 py-1"
    >
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}
