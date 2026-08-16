import type { BookOdds, Event, MarketType } from '../types/index.js';
import { getVenue } from '../types/index.js';
import { bestPlaceableOdds } from '../types/shops.js';
import { americanToDecimal, decimalToAmerican } from '../calculations/odds.js';

export type TicketVibe = 'chill' | 'spicy' | 'chaos';
export type TicketKind = 'straight' | 'sgp' | 'round_robin';

export interface TicketLeg {
  eventId: string;
  eventLabel: string;
  pick: string;
  marketType: MarketType;
  bookId: string;
  odds: number;
  line?: number;
}

export interface TicketIdea {
  id: string;
  vibe: TicketVibe;
  kind: TicketKind;
  stamp: string;
  title: string;
  blurb: string;
  honesty: string;
  legs: TicketLeg[];
  /** Combined American for a single parlay (straight or SGP). */
  parlayOdds?: number;
  /** Round robin: pairs of leg indexes. */
  rrPairs?: [number, number][];
}

export interface BuildTicketsOptions {
  shopIds?: string[] | null;
  seed?: number;
  limit?: number;
}

const HONEST = {
  straight:
    'One number, one shop. Cleanest way to play. Not a promise.',
  sgp:
    'Same-game parlays stack juice. Fun card, not a better price.',
  rr:
    'Three 2-leggers. You pay more vig so one loss does not wipe the card.',
} as const;

export function parlayAmerican(odds: number[]): number {
  const dec = odds.reduce((acc, o) => acc * americanToDecimal(o), 1);
  return decimalToAmerican(dec);
}

export function stakeReturn(stake: number, american: number): number {
  return Math.round(stake * americanToDecimal(american) * 100) / 100;
}

function eventLabel(event: Event): string {
  return `${event.awayTeam} @ ${event.homeTeam}`;
}

function pickLabel(name: string, marketType: MarketType, line?: number): string {
  if (line === undefined || marketType === 'h2h') return name;
  if (marketType === 'totals') return `${name} ${line}`;
  return `${name} ${line > 0 ? `+${line}` : line}`;
}

function shopOn(outcome: { bookOdds: BookOdds[] }, shopIds?: string[] | null): BookOdds | undefined {
  return bestPlaceableOdds(outcome.bookOdds, shopIds);
}

function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle<T>(items: T[], rand: () => number): T[] {
  const next = [...items];
  for (let i = next.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [next[i], next[j]] = [next[j], next[i]];
  }
  return next;
}

function straightTickets(events: Event[], shopIds?: string[] | null): TicketIdea[] {
  const out: TicketIdea[] = [];
  for (const event of events) {
    const h2h = event.markets.find((m) => m.type === 'h2h');
    if (!h2h) continue;
    const dogs = [...h2h.outcomes]
      .map((o) => ({ o, shop: shopOn(o, shopIds) }))
      .filter((x): x is { o: (typeof h2h.outcomes)[0]; shop: BookOdds } => Boolean(x.shop))
      .sort((a, b) => b.shop.odds - a.shop.odds);
    const pick = dogs[0];
    if (!pick) continue;
    const book = getVenue(pick.shop.bookId);
    out.push({
      id: `straight:${event.id}:${pick.o.name}`,
      vibe: 'chill',
      kind: 'straight',
      stamp: 'CLEAN',
      title: pick.o.name,
      blurb: `${eventLabel(event)} · ${book.shortName} ${pick.shop.odds > 0 ? '+' : ''}${pick.shop.odds}`,
      honesty: HONEST.straight,
      legs: [
        {
          eventId: event.id,
          eventLabel: eventLabel(event),
          pick: pick.o.name,
          marketType: 'h2h',
          bookId: pick.shop.bookId,
          odds: pick.shop.odds,
        },
      ],
      parlayOdds: pick.shop.odds,
    });
  }
  return out;
}

function sgpTickets(events: Event[], shopIds?: string[] | null): TicketIdea[] {
  const out: TicketIdea[] = [];
  for (const event of events) {
    const h2h = event.markets.find((m) => m.type === 'h2h');
    const spreads = event.markets.find((m) => m.type === 'spreads');
    const totals = event.markets.find((m) => m.type === 'totals');
    if (!h2h) continue;

    for (const side of h2h.outcomes) {
      const ml = shopOn(side, shopIds);
      if (!ml) continue;
      const spreadSide = spreads?.outcomes.find((o) => o.name === side.name);
      const spread = spreadSide ? shopOn(spreadSide, shopIds) : undefined;
      const sameBookSpread =
        spread && spread.bookId === ml.bookId
          ? spread
          : spreadSide?.bookOdds.find((b) => b.bookId === ml.bookId);

      if (sameBookSpread) {
        const book = getVenue(ml.bookId);
        const legs: TicketLeg[] = [
          {
            eventId: event.id,
            eventLabel: eventLabel(event),
            pick: side.name,
            marketType: 'h2h',
            bookId: ml.bookId,
            odds: ml.odds,
          },
          {
            eventId: event.id,
            eventLabel: eventLabel(event),
            pick: pickLabel(side.name, 'spreads', sameBookSpread.line ?? spreadSide?.point),
            marketType: 'spreads',
            bookId: sameBookSpread.bookId,
            odds: sameBookSpread.odds,
            line: sameBookSpread.line ?? spreadSide?.point,
          },
        ];
        out.push({
          id: `sgp:${event.id}:${side.name}:spread`,
          vibe: 'spicy',
          kind: 'sgp',
          stamp: 'JUICY',
          title: `${side.name} stack`,
          blurb: `${eventLabel(event)} · 2-leg at ${book.shortName}`,
          honesty: HONEST.sgp,
          legs,
          parlayOdds: parlayAmerican(legs.map((l) => l.odds)),
        });
        continue;
      }

      const over = totals?.outcomes.find((o) => o.name === 'Over');
      const overShop = over ? shopOn(over, shopIds) : undefined;
      const sameBookTotal =
        overShop && overShop.bookId === ml.bookId
          ? overShop
          : over?.bookOdds.find((b) => b.bookId === ml.bookId);
      if (!sameBookTotal || !over) continue;

      const book = getVenue(ml.bookId);
      const legs: TicketLeg[] = [
        {
          eventId: event.id,
          eventLabel: eventLabel(event),
          pick: side.name,
          marketType: 'h2h',
          bookId: ml.bookId,
          odds: ml.odds,
        },
        {
          eventId: event.id,
          eventLabel: eventLabel(event),
          pick: pickLabel('Over', 'totals', sameBookTotal.line ?? over.point),
          marketType: 'totals',
          bookId: sameBookTotal.bookId,
          odds: sameBookTotal.odds,
          line: sameBookTotal.line ?? over.point,
        },
      ];
      out.push({
        id: `sgp:${event.id}:${side.name}:over`,
        vibe: 'spicy',
        kind: 'sgp',
        stamp: 'JUICY',
        title: `${side.name} + Over`,
        blurb: `${eventLabel(event)} · 2-leg at ${book.shortName}`,
        honesty: HONEST.sgp,
        legs,
        parlayOdds: parlayAmerican(legs.map((l) => l.odds)),
      });
    }
  }
  return out;
}

function roundRobinTickets(events: Event[], shopIds?: string[] | null): TicketIdea[] {
  const dogs: TicketLeg[] = [];
  for (const event of events) {
    const h2h = event.markets.find((m) => m.type === 'h2h');
    if (!h2h) continue;
    const ranked = h2h.outcomes
      .map((o) => ({ o, shop: shopOn(o, shopIds) }))
      .filter((x): x is { o: (typeof h2h.outcomes)[0]; shop: BookOdds } => Boolean(x.shop))
      .sort((a, b) => b.shop.odds - a.shop.odds);
    const pick = ranked[0];
    if (!pick) continue;
    dogs.push({
      eventId: event.id,
      eventLabel: eventLabel(event),
      pick: pick.o.name,
      marketType: 'h2h',
      bookId: pick.shop.bookId,
      odds: pick.shop.odds,
    });
  }
  if (dogs.length < 3) return [];

  const trio = dogs.slice(0, 3);
  return [
    {
      id: `rr:${trio.map((l) => l.eventId).join('+')}`,
      vibe: 'chaos',
      kind: 'round_robin',
      stamp: 'CHAOS',
      title: '3-team round robin',
      blurb: trio.map((l) => l.pick).join(' · '),
      honesty: HONEST.rr,
      legs: trio,
      rrPairs: [
        [0, 1],
        [0, 2],
        [1, 2],
      ],
    },
  ];
}

/** Build retail ticket ideas. Not +EV. Not arb. */
export function buildTickets(events: Event[], options: BuildTicketsOptions = {}): TicketIdea[] {
  const { shopIds, seed = 1, limit = 8 } = options;
  const straights = straightTickets(events, shopIds);
  const sgp = sgpTickets(events, shopIds);
  const rr = roundRobinTickets(events, shopIds);

  const rand = mulberry32(seed);
  const mixed = [
    ...shuffle(straights, rand).slice(0, 3),
    ...shuffle(sgp, rand).slice(0, 3),
    ...rr,
  ];
  return mixed.slice(0, limit);
}

export const TICKET_HONESTY = HONEST;
