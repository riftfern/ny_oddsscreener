import { useMemo, useState } from 'react';
import {
  bestPlaceableOdds,
  formatSignedLine,
  getVenue,
  shopHref,
  spreadCrossesKeys,
  teasedSpreadLine,
  teasePointsForSport,
  type Event,
} from '@ny-sharp-edge/shared';
import { useBetslipStore } from '@/stores/betslipStore';
import { usePlan } from '@/components/auth/AuthProvider';

interface Pick {
  event: Event;
  name: string;
  from: number;
  to: number;
  bookId: string;
  odds: number;
  crosses: boolean;
}

export default function TeaserBuilder({ events }: { events: Event[] }) {
  const { books } = usePlan();
  const addBet = useBetslipStore((s) => s.addBet);
  const clearAll = useBetslipStore((s) => s.clearAll);
  const [open, setOpen] = useState(false);
  const [picks, setPicks] = useState<Pick[]>([]);
  const [shopId, setShopId] = useState<string | null>(null);

  const pts = events[0] ? teasePointsForSport(events[0].sportKey) : undefined;
  const lockedBook = shopId ?? picks[0]?.bookId ?? books?.[0] ?? null;
  const href = lockedBook ? shopHref(lockedBook) : undefined;

  const menu = useMemo(() => {
    if (!pts) return [];
    const out: Pick[] = [];
    for (const event of events) {
      if (teasePointsForSport(event.sportKey) !== pts) continue;
      const spreads = event.markets.find((m) => m.type === 'spreads');
      if (!spreads) continue;
      for (const outcome of spreads.outcomes) {
        const shop = bestPlaceableOdds(
          outcome.bookOdds,
          lockedBook ? [lockedBook] : books
        );
        const from = shop?.line ?? outcome.point;
        if (!shop || from === undefined) continue;
        const to = teasedSpreadLine(from, pts);
        out.push({
          event,
          name: outcome.name,
          from,
          to,
          bookId: shop.bookId,
          odds: shop.odds,
          crosses: spreadCrossesKeys(from, to),
        });
      }
    }
    return out.slice(0, 24);
  }, [events, books, lockedBook, pts]);

  const shopChoices = books && books.length > 0 ? books : [];

  if (!pts) return null;

  const toggle = (pick: Pick) => {
    setPicks((cur) => {
      const key = `${pick.event.id}:${pick.name}`;
      if (cur.some((p) => `${p.event.id}:${p.name}` === key)) {
        return cur.filter((p) => `${p.event.id}:${p.name}` !== key);
      }
      if (cur.some((p) => p.event.id === pick.event.id)) {
        return cur.map((p) => (p.event.id === pick.event.id ? pick : p));
      }
      if (cur.length >= 3) return cur;
      return [...cur, pick];
    });
  };

  const addToSlip = () => {
    if (picks.length < 2) return;
    const bookIds = new Set(picks.map((p) => p.bookId));
    if (bookIds.size > 1) return;
    clearAll();
    const shapeId = `tease-build:${picks.map((p) => p.event.id).join('+')}`;
    for (const pick of picks) {
      addBet({
        eventId: pick.event.id,
        event: pick.event,
        marketType: 'spreads',
        outcomeName: `${pick.name} ${formatSignedLine(pick.from)} → ${formatSignedLine(pick.to)}`,
        bookId: pick.bookId,
        odds: pick.odds,
        line: pick.to,
        shape: 'teaser',
        shapeId,
        hideOdds: true,
        teasePoints: pts,
      });
    }
  };

  return (
    <div className="glass rounded-2xl p-3 space-y-3">
      <button
        type="button"
        className="chip chip-on"
        onClick={() => setOpen((v) => !v)}
      >
        {open ? 'Hide tease builder' : 'Build a tease'}
      </button>
      {open && (
        <>
          <p className="font-mono text-[12px] text-ink-dim">
            {pts}-pt tease. Pick a shop, then tap 2–3 spreads. Orange = crosses 3 or 7. We do not
            have teaser juice — Open the shop to price it.
          </p>
          {shopChoices.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {shopChoices.map((id) => (
                <button
                  key={id}
                  type="button"
                  className={`chip ${lockedBook === id ? 'chip-on' : ''}`}
                  onClick={() => {
                    setShopId(id);
                    setPicks([]);
                  }}
                >
                  {getVenue(id).shortName}
                </button>
              ))}
            </div>
          )}
          {lockedBook && (
            <p className="font-mono text-[11px] text-lichen">
              Building at {getVenue(lockedBook).shortName}
            </p>
          )}
          <ul className="space-y-1 max-h-72 overflow-y-auto">
            {menu.map((pick) => {
              const key = `${pick.event.id}:${pick.name}`;
              const on = picks.some((p) => `${p.event.id}:${p.name}` === key);
              return (
                <li key={key}>
                  <button
                    type="button"
                    onClick={() => toggle(pick)}
                    className={`w-full text-left font-mono text-[12px] px-2 py-2 rounded-xl border-2 ${
                      on ? 'border-lichen bg-[#d7f0fb]' : 'border-line'
                    }`}
                  >
                    <span className={pick.crosses ? 'text-warn' : 'text-ink'}>
                      {pick.name} {formatSignedLine(pick.from)} → {formatSignedLine(pick.to)}
                      {pick.crosses ? ' · 3/7' : ''}
                    </span>
                    <span className="text-ink-dim">
                      {' '}
                      · {getVenue(pick.bookId).shortName} · {pick.event.awayTeam} @{' '}
                      {pick.event.homeTeam}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-primary"
              disabled={picks.length < 2 || new Set(picks.map((p) => p.bookId)).size > 1}
              onClick={addToSlip}
            >
              Add {picks.length}-leg tease
            </button>
            {href && (
              <a href={href} target="_blank" rel="noopener noreferrer" className="btn btn-secondary">
                Open {getVenue(lockedBook!).shortName} teaser
              </a>
            )}
            {picks.length > 0 && (
              <button type="button" className="chip" onClick={() => setPicks([])}>
                Clear picks
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
