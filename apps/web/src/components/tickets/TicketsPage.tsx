import { useMemo, useState } from 'react';
import {
  booksCaption,
  buildTickets,
  formatAmerican,
  getVenue,
  eventInHorizon,
  shopHref,
  parlayAmerican,
  stakeReturn,
  teasePointsForSport,
  windowTwoWayNet,
  type Event,
  type TicketIdea,
  type TicketVibe,
} from '@ny-sharp-edge/shared';
import { useOdds } from '@/hooks/useOdds';
import { useOddsStore } from '@/stores/oddsStore';
import { usePlan } from '@/components/auth/AuthProvider';
import SportSelector from '@/components/odds/SportSelector';
import BookEditor from '@/components/auth/BookEditor';
import { OddsGridSkeleton } from '@/components/odds/OddsGrid';
import Chip from '@/components/common/Chip';
import HorizonChips from '@/components/common/HorizonChips';
import { useHorizonAutoSeason } from '@/hooks/useHorizonAutoSeason';
import { usePreferInSeasonWhenEmpty } from '@/hooks/usePreferInSeasonWhenEmpty';
import TonightElsewhere from '@/components/common/TonightElsewhere';
import { useBetslipStore } from '@/stores/betslipStore';
import TeaserBuilder from '@/components/tickets/TeaserBuilder';

const VIBES: { id: TicketVibe | 'all'; label: string }[] = [
  { id: 'all', label: 'The card' },
  { id: 'chill', label: 'Chill' },
  { id: 'spicy', label: 'Spicy' },
  { id: 'chaos', label: 'Chaos' },
];

export default function TicketsPage() {
  const sport = useOddsStore((s) => s.filter.sport);
  const horizon = useOddsStore((s) => s.horizon);
  const { data, isLoading, error, refetch } = useOdds(sport);
  const { books } = usePlan();
  const [vibe, setVibe] = useState<TicketVibe | 'all'>('all');
  const [deal, setDeal] = useState(1);
  const [editingBooks, setEditingBooks] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const setHorizon = useOddsStore((s) => s.setHorizon);
  useHorizonAutoSeason(data?.events);
  usePreferInSeasonWhenEmpty(data?.events);

  const upcoming = useMemo(() => {
    const events = data?.events ?? [];
    return events.filter((e) => eventInHorizon(e.commenceTime, horizon));
  }, [data?.events, horizon]);

  const tickets = useMemo(
    () =>
      buildTickets(upcoming, {
        shopIds: books,
        seed: deal,
        limit: 12,
      }),
    [upcoming, books, deal]
  );

  const shown = vibe === 'all' ? tickets : tickets.filter((t) => t.vibe === vibe);

  return (
    <div className="space-y-4 min-w-0">
      <div>
        <h1 className="font-display font-bold text-ink tracking-tight text-[1.75rem] leading-none">
          Tickets
        </h1>
        <p className="text-ink-dim font-mono text-[13px] mt-2 leading-snug">
          Ideas for {booksCaption(books)}. Not picks. Not a printer.
        </p>
        <TonightElsewhere />
      </div>

      <div className="glass rounded-2xl p-3 space-y-3">
        <SportSelector sharpCoverage={data?.sharpCoverage} />
        <div className="flex flex-wrap gap-1.5">
          <HorizonChips />
        </div>
        {books && (
          <div className="flex flex-wrap items-center gap-1.5">
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
          <div className="rounded-2xl bg-[#d7f0fb] border-2 border-line p-4">
            <BookEditor onClose={() => setEditingBooks(false)} />
          </div>
        )}
        <div className="flex flex-wrap gap-1.5">
          {VIBES.map((v) => (
            <Chip key={v.id} onClick={() => setVibe(v.id)} active={vibe === v.id}>
              {v.label}
            </Chip>
          ))}
          <Chip onClick={() => setDeal((n) => n + 1)} className="chip-on">
            Deal again
          </Chip>
        </div>
      </div>

      {upcoming.length > 0 && teasePointsForSport(upcoming[0].sportKey) && (
        <TeaserBuilder events={upcoming} />
      )}

      {isLoading && !error && <OddsGridSkeleton />}

      {error && (
        <div className="glass rounded-2xl p-4 space-y-3">
          <p className="text-bad font-mono text-[13px]">Can&apos;t reach the board.</p>
          <button type="button" onClick={() => void refetch()} className="btn btn-secondary">
            Retry
          </button>
        </div>
      )}

      {!isLoading && !error && shown.length === 0 && (
        <div className="text-center py-12 space-y-3">
          <p className="text-ink-dim uppercase tracking-[0.18em] text-[11px]">
            No tickets in this vibe for this window
          </p>
          <p className="font-mono text-[11px] text-ink-dim">Try another sport or Deal again</p>
          {data && data.events.length > 0 && horizon !== 'season' && (
            <button
              type="button"
              onClick={() => setHorizon('season')}
              className="font-mono text-[11px] text-lichen underline underline-offset-2"
            >
              Show the season ({data.events.length})
            </button>
          )}
        </div>
      )}

      <div className="grid gap-3">
        {shown.map((ticket) => (
          <TicketCard
            key={ticket.id}
            ticket={ticket}
            events={upcoming}
            copied={copied === ticket.id}
            onCopy={async () => {
              await navigator.clipboard.writeText(copyTicket(ticket)).catch(() => undefined);
              setCopied(ticket.id);
              setTimeout(() => setCopied(null), 1600);
            }}
          />
        ))}
      </div>

      <div className="glass rounded-2xl p-4">
        <p className="label mb-2">Read this</p>
        <ul className="font-mono text-[12px] text-ink-dim space-y-1">
          <li>These are ticket shapes, not edges. Parlays, teasers, and ifs cost extra juice.</li>
          <li>Teasers show the moved number — we do not have the shop&apos;s teaser price.</li>
          <li>Windows are two opposite bets. Ifs are sequential, not a parlay.</li>
          <li>Priced at your books when you have picked them. OPEN is you placing it.</li>
          <li>We do not take bets. Lines move. You can lose the whole ticket.</li>
        </ul>
      </div>
    </div>
  );
}

function copyTicket(ticket: TicketIdea): string {
  const extra =
    ticket.kind === 'teaser'
      ? ` | ${ticket.teasePoints}-pt tease`
      : ticket.kind === 'window'
        ? ` | ${ticket.windowGap}-pt window`
        : ticket.kind === 'if_bet'
          ? ' | if first then second'
          : ticket.kind === 'reverse'
            ? ' | both orders'
            : '';
  const legs = ticket.legs
    .map((l) => {
      const price =
        ticket.kind === 'teaser' ? '' : ` ${formatAmerican(l.odds)}`;
      return `${l.pick}${price} @ ${getVenue(l.bookId).shortName} (${l.eventLabel})`;
    })
    .join(' // ');
  return `${ticket.title} | ${ticket.stamp}${extra} | ${legs} | ${ticket.honesty}`;
}

function shopLinks(ticket: TicketIdea): { name: string; href: string }[] {
  const seen = new Set<string>();
  const links: { name: string; href: string }[] = [];
  for (const leg of ticket.legs) {
    if (seen.has(leg.bookId)) continue;
    seen.add(leg.bookId);
    const href = shopHref(leg.bookId);
    if (!href) continue;
    links.push({ name: getVenue(leg.bookId).shortName, href });
  }
  return links;
}

function TicketCard({
  ticket,
  events,
  copied,
  onCopy,
}: {
  ticket: TicketIdea;
  events: Event[];
  copied: boolean;
  onCopy: () => void;
}) {
  const [open, setOpen] = useState(false);
  const addBet = useBetslipStore((s) => s.addBet);
  const clearAll = useBetslipStore((s) => s.clearAll);
  const links = shopLinks(ticket);
  const hideLegPrice = ticket.kind === 'teaser';
  const windowMath =
    ticket.kind === 'window' && ticket.legs.length >= 2
      ? windowTwoWayNet(10, ticket.legs[0].odds, ticket.legs[1].odds)
      : null;
  const addToSlip = () => {
    clearAll();
    ticket.legs.forEach((leg, i) => {
      const ev = events.find((e) => e.id === leg.eventId);
      if (!ev) return;
      addBet({
        eventId: ev.id,
        event: ev,
        marketType: leg.marketType,
        outcomeName: leg.pick,
        bookId: leg.bookId,
        odds: leg.odds,
        line: leg.line,
        shape: ticket.kind,
        shapeId: ticket.id,
        hideOdds: ticket.kind === 'teaser',
        sequence:
          ticket.kind === 'if_bet' ? (i === 0 ? 'if' : 'then') : undefined,
        teasePoints: ticket.teasePoints,
        windowGap: ticket.windowGap,
      });
    });
  };

  return (
    <article className="glass rounded-2xl flex flex-col min-w-0 overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="text-left p-4 w-full"
      >
        <div className="flex items-start justify-between gap-3">
          <span
            className={`font-mono text-[11px] tracking-[0.14em] px-2.5 py-1 rounded-full border ${
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
        <h2 className="font-display font-bold text-ink text-[1.65rem] uppercase tracking-tight mt-3 leading-[1.05] break-words">
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
        {ticket.kind === 'teaser' && (
          <p className="font-mono text-sm text-lichen mt-3">
            Price the {ticket.teasePoints}-pt tease on the board
          </p>
        )}
        {ticket.kind === 'window' && ticket.windowGap !== undefined && (
          <p className="font-mono text-sm text-lichen mt-3">
            {ticket.windowGap}-pt window
            {windowMath &&
              ` · $10 each, both cash ~$${windowMath.both.toFixed(0)}, one side worst ~$${windowMath.worstOne.toFixed(0)}`}
          </p>
        )}
        {ticket.kind === 'if_bet' && (
          <p className="font-mono text-sm text-lichen mt-3">Second only if the first cashes</p>
        )}
        {ticket.kind === 'reverse' && (
          <p className="font-mono text-sm text-lichen mt-3">Both orders</p>
        )}
      </button>

      {open && (
        <div className="px-4 pb-4 space-y-2 border-t-2 border-line pt-3">
          {ticket.legs.map((leg, i) => (
            <div key={`${leg.eventId}-${i}`} className="font-mono text-[12px] text-ink">
              <span className="text-ink-dim">
                {ticket.kind === 'if_bet'
                  ? i === 0
                    ? 'IF '
                    : 'THEN '
                  : `${String(i + 1).padStart(2, '0')} `}
              </span>
              {leg.pick}
              {!hideLegPrice && ` ${formatAmerican(leg.odds)}`}
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
          {ticket.ifOrders && ticket.kind === 'reverse' && (
            <div className="pt-2 space-y-1">
              {ticket.ifOrders.map(([a, b]) => (
                <p key={`${a}-${b}`} className="font-mono text-[11px] text-ink-dim">
                  {ticket.legs[a].pick} then {ticket.legs[b].pick}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="px-4 pb-3 font-mono text-[11px] text-ink-dim">{ticket.honesty}</p>

      <div className="mt-auto flex flex-wrap border-t-2 border-line">
        <button
          type="button"
          onClick={onCopy}
          className="flex-1 min-w-[30%] py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim hover:text-ink"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button
          type="button"
          onClick={addToSlip}
          className="flex-1 min-w-[30%] py-3 font-mono text-[11px] uppercase tracking-[0.14em] text-lichen border-l-2 border-line"
        >
          Add slip
        </button>
        {links.length === 0 ? (
          <span className="flex-1 py-3 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-ink-dim border-l-2 border-line">
            No link
          </span>
        ) : (
          links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 min-w-[40%] py-3 text-center font-mono text-[11px] uppercase tracking-[0.14em] text-lichen hover:text-ink border-l-2 border-line"
            >
              Open {link.name}
            </a>
          ))
        )}
      </div>
    </article>
  );
}
