import { useMemo, useState } from 'react';
import {
  buildTickets,
  formatAmerican,
  getVenue,
  isUpcomingEvent,
  parlayAmerican,
  stakeReturn,
  type TicketIdea,
  type TicketVibe,
} from '@ny-sharp-edge/shared';
import { useOdds } from '@/hooks/useOdds';
import { useOddsStore } from '@/stores/oddsStore';
import { usePlan } from '@/components/auth/AuthProvider';
import SportSelector from '@/components/odds/SportSelector';
import BookEditor from '@/components/auth/BookEditor';
import { OddsGridSkeleton } from '@/components/odds/OddsGrid';

const VIBES: { id: TicketVibe | 'all'; label: string }[] = [
  { id: 'all', label: 'The card' },
  { id: 'chill', label: 'Chill' },
  { id: 'spicy', label: 'Spicy' },
  { id: 'chaos', label: 'Chaos' },
];

export default function TicketsPage() {
  const sport = useOddsStore((s) => s.filter.sport);
  const { data, isLoading, error } = useOdds(sport);
  const { books } = usePlan();
  const [vibe, setVibe] = useState<TicketVibe | 'all'>('all');
  const [deal, setDeal] = useState(1);
  const [editingBooks, setEditingBooks] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  const upcoming = useMemo(() => {
    const events = data?.events ?? [];
    return events.filter((e) => isUpcomingEvent(e.commenceTime));
  }, [data?.events]);

  const tickets = useMemo(
    () =>
      buildTickets(upcoming, {
        shopIds: books,
        seed: deal,
        limit: 9,
      }),
    [upcoming, books, deal]
  );

  const shown = vibe === 'all' ? tickets : tickets.filter((t) => t.vibe === vibe);

  return (
    <div className="space-y-5">
      <div>
        <h1 className="font-display font-bold text-ink tracking-tight text-2xl">Tickets</h1>
        <p className="text-ink-dim font-mono text-[13px] mt-1">
          Ideas for the card. Not picks. Not a printer.
        </p>
      </div>

      <SportSelector sharpCoverage={data?.sharpCoverage} />

      {books && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="label">Your books</span>
          {books.map((id) => (
            <span key={id} className="font-mono text-[11px] text-ink border border-line px-2 py-1">
              {getVenue(id).shortName}
            </span>
          ))}
          <button
            type="button"
            onClick={() => setEditingBooks(true)}
            className="font-mono text-[11px] uppercase tracking-[0.14em] text-lichen hover:text-ink border border-moss px-2 py-1"
          >
            + Add book
          </button>
        </div>
      )}

      {editingBooks && (
        <div className="border border-line bg-bg-2 p-5">
          <BookEditor onClose={() => setEditingBooks(false)} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1">
        {VIBES.map((v) => (
          <button
            key={v.id}
            type="button"
            onClick={() => setVibe(v.id)}
            className={`px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] border ${
              vibe === v.id
                ? 'bg-moss text-ink border-moss'
                : 'bg-transparent text-ink-dim border-line hover:border-moss hover:text-ink'
            }`}
          >
            {v.label}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setDeal((n) => n + 1)}
          className="ml-auto px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] border border-moss text-ink hover:bg-moss"
        >
          Deal again
        </button>
      </div>

      {isLoading && <OddsGridSkeleton />}

      {error && (
        <div className="border border-bad p-4">
          <p className="text-bad font-mono text-[13px]">Could not load lines. Start the API.</p>
        </div>
      )}

      {!isLoading && !error && shown.length === 0 && (
        <div className="text-center py-12">
          <p className="text-ink-dim uppercase tracking-[0.18em] text-[11px]">
            No tickets in this vibe for the next 3 days
          </p>
          <p className="font-mono text-[11px] text-ink-dim mt-2">Try another sport or Deal again</p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {shown.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            copied={copied === ticket.id}
            onCopy={async () => {
              await navigator.clipboard.writeText(copyTicket(ticket)).catch(() => undefined);
              setCopied(ticket.id);
              setTimeout(() => setCopied(null), 1600);
            }}
          />
        ))}
      </div>

      <div className="border border-line bg-bg-2 p-4">
        <p className="label mb-2">Read this</p>
        <ul className="font-mono text-[12px] text-ink-dim space-y-1">
          <li>These are ticket shapes, not edges. Parlays and round robins cost extra juice.</li>
          <li>Priced at your books when you have picked them. OPEN is you placing it.</li>
          <li>We do not take bets. Lines move. You can lose the whole ticket.</li>
        </ul>
      </div>
    </div>
  );
}

function copyTicket(ticket: TicketIdea): string {
  const legs = ticket.legs
    .map((l) => `${l.pick} ${formatAmerican(l.odds)} @ ${getVenue(l.bookId).shortName} (${l.eventLabel})`)
    .join(' // ');
  return `${ticket.title} | ${ticket.stamp} | ${legs} | ${ticket.honesty}`;
}

function TicketCard({
  ticket,
  copied,
  onCopy,
}: {
  ticket: TicketIdea;
  copied: boolean;
  onCopy: () => void;
}) {
  const [open, setOpen] = useState(false);
  const href = getVenue(ticket.legs[0]?.bookId ?? '').deepLink || undefined;

  return (
    <article className="border border-line bg-bg-2 flex flex-col">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-left p-4 w-full"
      >
        <div className="flex items-start justify-between gap-3">
          <span
            className={`font-mono text-[11px] tracking-[0.18em] px-2 py-0.5 border ${
              ticket.vibe === 'chill'
                ? 'text-lichen border-lichen'
                : ticket.vibe === 'spicy'
                  ? 'text-warn border-warn'
                  : 'text-pin border-pin'
            }`}
          >
            {ticket.stamp}
          </span>
          <span className="label">{ticket.vibe}</span>
        </div>
        <h2 className="font-display font-bold text-ink text-2xl uppercase tracking-tight mt-3 leading-[0.95]">
          {ticket.title}
        </h2>
        <p className="font-mono text-[12px] text-ink-dim mt-2">{ticket.blurb}</p>
        {ticket.parlayOdds !== undefined && (
          <p className="font-mono text-sm text-lichen mt-3 tabular-nums">
            $10 → ${stakeReturn(10, ticket.parlayOdds).toFixed(0)}
            <span className="text-ink-dim"> if it cashes</span>
          </p>
        )}
        {ticket.kind === 'round_robin' && (
          <p className="font-mono text-sm text-lichen mt-3">3 × 2-leg parlays</p>
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2 border-t border-line pt-3">
          {ticket.legs.map((leg, i) => (
            <div key={`${leg.eventId}-${i}`} className="font-mono text-[12px] text-ink">
              <span className="text-ink-dim">{String(i + 1).padStart(2, '0')} </span>
              {leg.pick} {formatAmerican(leg.odds)}
              <span className="text-ink-dim"> · {getVenue(leg.bookId).shortName}</span>
              <div className="text-ink-dim pl-6">{leg.eventLabel}</div>
            </div>
          ))}
          {ticket.rrPairs && (
            <div className="pt-2 space-y-1">
              {ticket.rrPairs.map(([a, b]) => {
                const left = ticket.legs[a];
                const right = ticket.legs[b];
                return (
                  <p key={`${a}-${b}`} className="font-mono text-[11px] text-ink-dim">
                    {left.pick} + {right.pick} → {formatAmerican(parlayAmerican([left.odds, right.odds]))}
                  </p>
                );
              })}
            </div>
          )}
        </div>
      )}

      <p className="px-4 pb-3 font-mono text-[11px] text-ink-dim">{ticket.honesty}</p>

      <div className="mt-auto flex border-t border-line">
        <button
          type="button"
          onClick={onCopy}
          className="flex-1 py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim hover:text-ink"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
        {href ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 py-3 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-lichen hover:text-ink border-l border-line"
          >
            Open shop
          </a>
        ) : (
          <span className="flex-1 py-3 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim border-l border-line">
            No link
          </span>
        )}
      </div>
    </article>
  );
}
