import type { BookOdds, Event, MarketType } from '../types/index.js';
import { getVenue, shopHref } from '../types/index.js';
import { bestPlaceableOdds, findSpreadWindow, isSharpVenue } from '../types/shops.js';
import { americanToDecimal, decimalToAmerican } from '../calculations/odds.js';
import { isUglyMiddle } from '../calculations/hedge.js';

export type TicketVibe = 'chill' | 'spicy' | 'chaos';
export type TicketKind =
  | 'straight'
  | 'sgp'
  | 'round_robin'
  | 'teaser'
  | 'if_bet'
  | 'reverse'
  | 'window';

export interface TicketLeg {
  eventId: string;
  eventLabel: string;
  pick: string;
  marketType: MarketType;
  bookId: string;
  odds: number;
  /** Number you play (teased spread, or the window quote). */
  line?: number;
  /** Original spread before a tease. */
  fromLine?: number;
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
  /** NFL 6 / NBA 4. */
  teasePoints?: number;
  /** Spread: dog + fav. Totals: under − over. */
  windowGap?: number;
  /** If-bet / reverse: ordered pairs of leg indexes. */
  ifOrders?: [number, number][];
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
  teaser:
    'Points toward you on each spread. All legs still have to cover. We do not have this shop\'s teaser juice — price it on their teaser board. Correlated games can die together.',
  ifBet:
    'Second only goes if the first cashes. Not a parlay. Many NY books do not offer ifs — check the slip.',
  reverse:
    'Both orders: A then B, and B then A. Double the action, more juice. Only if your book has reverses.',
  window:
    'If it lands in the window both cash. Outside it you usually win one, lose one, and the vig is the tax. Not risk-free.',
} as const;

const WONG_KEYS = [3, 7];

export function teasePointsForSport(sportKey: string): number | undefined {
  if (sportKey === 'americanfootball_nfl') return 6;
  if (sportKey === 'basketball_nba') return 4;
  return undefined;
}

/** Move a spread toward the bettor (favorites get closer to 0 / plus; dogs get fatter). */
export function teasedSpreadLine(from: number, points: number): number {
  return from + points;
}

/** True when the move passes through 3 or 7 (either side of zero). */
export function spreadCrossesKeys(
  from: number,
  to: number,
  keys: number[] = WONG_KEYS
): boolean {
  const lo = Math.min(from, to);
  const hi = Math.max(from, to);
  for (const k of keys) {
    for (const key of [k, -k]) {
      if (lo < key && key < hi) return true;
      if (to === key) return true;
    }
  }
  return false;
}

export function formatSignedLine(line: number): string {
  return line > 0 ? `+${line}` : `${line}`;
}

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

function isRetailBook(bookId: string): boolean {
  return getVenue(bookId).kind === 'sportsbook' && !isSharpVenue(bookId);
}

function retailQuotes(bookOdds: BookOdds[], shopIds?: string[] | null): BookOdds[] {
  return bookOdds.filter((b) => {
    if (!isRetailBook(b.bookId)) return false;
    if (shopIds) return shopIds.includes(b.bookId);
    const regions = getVenue(b.bookId).regions;
    return regions.includes('us') || regions.includes('us2');
  });
}

function shopOn(outcome: { bookOdds: BookOdds[] }, shopIds?: string[] | null): BookOdds | undefined {
  return bestPlaceableOdds(retailQuotes(outcome.bookOdds, shopIds), shopIds);
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

interface TeaseCand {
  event: Event;
  bookId: string;
  name: string;
  fromLine: number;
  toLine: number;
  odds: number;
  points: number;
}

function teaserTickets(events: Event[], shopIds?: string[] | null): TicketIdea[] {
  const cands: TeaseCand[] = [];
  for (const event of events) {
    const points = teasePointsForSport(event.sportKey);
    if (!points) continue;
    const spreads = event.markets.find((m) => m.type === 'spreads');
    if (!spreads) continue;
    for (const outcome of spreads.outcomes) {
      const shops = retailQuotes(outcome.bookOdds, shopIds);
      for (const shop of shops) {
        const from = shop.line ?? outcome.point;
        if (from === undefined) continue;
        const to = teasedSpreadLine(from, points);
        if (!spreadCrossesKeys(from, to)) continue;
        cands.push({
          event,
          bookId: shop.bookId,
          name: outcome.name,
          fromLine: from,
          toLine: to,
          odds: shop.odds,
          points,
        });
      }
    }
  }

  const byBook = new Map<string, TeaseCand[]>();
  for (const cand of cands) {
    const list = byBook.get(cand.bookId) ?? [];
    list.push(cand);
    byBook.set(cand.bookId, list);
  }

  const out: TicketIdea[] = [];
  for (const [bookId, list] of byBook) {
    const unique: TeaseCand[] = [];
    const seen = new Set<string>();
    for (const cand of list) {
      if (seen.has(cand.event.id)) continue;
      seen.add(cand.event.id);
      unique.push(cand);
    }
    if (unique.length < 2) continue;
    const book = getVenue(bookId);
    const take = unique.slice(0, unique.length >= 3 ? 3 : 2);
    const points = take[0].points;
    const legs: TicketLeg[] = take.map((cand) => ({
      eventId: cand.event.id,
      eventLabel: eventLabel(cand.event),
      pick: `${cand.name} ${formatSignedLine(cand.fromLine)} → ${formatSignedLine(cand.toLine)}`,
      marketType: 'spreads',
      bookId,
      odds: cand.odds,
      line: cand.toLine,
      fromLine: cand.fromLine,
    }));
    const nfl = points === 6;
    out.push({
      id: `teaser:${bookId}:${legs.map((l) => l.eventId).join('+')}`,
      vibe: 'spicy',
      kind: 'teaser',
      stamp: 'TEASE',
      title: nfl ? 'Wong 6-pt' : 'NBA 4-pt tease',
      blurb: `${legs.length}-leg at ${book.shortName} · ${points} pts toward you`,
      honesty: HONEST.teaser,
      legs,
      teasePoints: points,
    });
  }
  return out;
}

function moneylineLeg(
  event: Event,
  shopIds?: string[] | null
): { bookId: string; name: string; odds: number } | undefined {
  const h2h = event.markets.find((m) => m.type === 'h2h');
  if (!h2h) return undefined;
  const ranked = h2h.outcomes
    .map((o) => ({ o, shop: shopOn(o, shopIds) }))
    .filter((x): x is { o: (typeof h2h.outcomes)[0]; shop: BookOdds } => Boolean(x.shop))
    .sort((a, b) => b.shop.odds - a.shop.odds);
  const pick = ranked[0];
  if (!pick) return undefined;
  return { bookId: pick.shop.bookId, name: pick.o.name, odds: pick.shop.odds };
}

function ifBetTickets(
  events: Event[],
  shopIds?: string[] | null
): { ifs: TicketIdea[]; reverses: TicketIdea[] } {
  const timed = [...events].sort(
    (a, b) => Date.parse(a.commenceTime) - Date.parse(b.commenceTime)
  );

  type Side = { event: Event; bookId: string; name: string; odds: number };
  const byBook = new Map<string, Side[]>();

  for (const event of timed) {
    const h2h = event.markets.find((m) => m.type === 'h2h');
    if (!h2h) continue;
    const shops = new Set<string>();
    for (const outcome of h2h.outcomes) {
      for (const bo of retailQuotes(outcome.bookOdds, shopIds)) {
        shops.add(bo.bookId);
      }
    }
    for (const bookId of shops) {
      if (!getVenue(bookId).supportsIfBets || !shopHref(bookId)) continue;
      const side = moneylineLeg(event, [bookId]);
      if (!side) continue;
      const list = byBook.get(bookId) ?? [];
      list.push({ event, bookId, name: side.name, odds: side.odds });
      byBook.set(bookId, list);
    }
  }

  const ifs: TicketIdea[] = [];
  const reverses: TicketIdea[] = [];

  for (const [bookId, sides] of byBook) {
    if (sides.length < 2) continue;
    const first = sides[0];
    const second = sides[sides.length - 1];
    if (first.event.id === second.event.id) continue;
    if (Date.parse(second.event.commenceTime) <= Date.parse(first.event.commenceTime)) continue;

    const book = getVenue(bookId);
    const legs: TicketLeg[] = [first, second].map((side) => ({
      eventId: side.event.id,
      eventLabel: eventLabel(side.event),
      pick: side.name,
      marketType: 'h2h',
      bookId,
      odds: side.odds,
    }));

    ifs.push({
      id: `if:${bookId}:${legs[0].eventId}>${legs[1].eventId}`,
      vibe: 'spicy',
      kind: 'if_bet',
      stamp: 'IF',
      title: 'If-bet',
      blurb: `${legs[0].pick} then ${legs[1].pick} · ${book.shortName}`,
      honesty: HONEST.ifBet,
      legs,
      ifOrders: [[0, 1]],
    });

    reverses.push({
      id: `rev:${bookId}:${legs[0].eventId}+${legs[1].eventId}`,
      vibe: 'chaos',
      kind: 'reverse',
      stamp: 'REV',
      title: 'Reverse',
      blurb: `Both orders · ${book.shortName}`,
      honesty: HONEST.reverse,
      legs,
      ifOrders: [
        [0, 1],
        [1, 0],
      ],
    });
  }

  return { ifs, reverses };
}

function windowTickets(events: Event[], shopIds?: string[] | null): TicketIdea[] {
  const out: TicketIdea[] = [];

  for (const event of events) {
    const spreadWin = findSpreadWindow(event, shopIds, 1);
    if (spreadWin && !isUglyMiddle(spreadWin.left.odds, spreadWin.right.odds)) {
      const { left, right, gap } = spreadWin;
      out.push({
        id: `window:spread:${event.id}:${left.bookId}/${right.bookId}`,
        vibe: 'chaos',
        kind: 'window',
        stamp: 'WINDOW',
        title: `${left.name.split(' ').pop()} / ${right.name.split(' ').pop()} window`,
        blurb: `${gap}-pt window · ${getVenue(left.bookId).shortName} ${formatSignedLine(left.line)} / ${getVenue(right.bookId).shortName} ${formatSignedLine(right.line)}`,
        honesty: HONEST.window,
        windowGap: gap,
        legs: [
          {
            eventId: event.id,
            eventLabel: eventLabel(event),
            pick: `${left.name} ${formatSignedLine(left.line)}`,
            marketType: 'spreads',
            bookId: left.bookId,
            odds: left.odds,
            line: left.line,
          },
          {
            eventId: event.id,
            eventLabel: eventLabel(event),
            pick: `${right.name} ${formatSignedLine(right.line)}`,
            marketType: 'spreads',
            bookId: right.bookId,
            odds: right.odds,
            line: right.line,
          },
        ],
      });
    }

    const totals = event.markets.find((m) => m.type === 'totals');
    const over = totals?.outcomes.find((o) => o.name === 'Over');
    const under = totals?.outcomes.find((o) => o.name === 'Under');
    if (over && under) {
      const quotesO = retailQuotes(over.bookOdds, shopIds);
      const quotesU = retailQuotes(under.bookOdds, shopIds);
      let best:
        | { qo: BookOdds; qu: BookOdds; gap: number; overLine: number; underLine: number }
        | undefined;
      for (const qo of quotesO) {
        const overLine = qo.line ?? over.point;
        if (overLine === undefined) continue;
        for (const qu of quotesU) {
          if (qo.bookId === qu.bookId) continue;
          const underLine = qu.line ?? under.point;
          if (underLine === undefined) continue;
          const gap = underLine - overLine;
          if (gap < 1) continue;
          if (!best || gap < best.gap) best = { qo, qu, gap, overLine, underLine };
        }
      }
      if (best && !isUglyMiddle(best.qo.odds, best.qu.odds)) {
        out.push({
          id: `window:total:${event.id}:${best.qo.bookId}/${best.qu.bookId}`,
          vibe: 'chaos',
          kind: 'window',
          stamp: 'WINDOW',
          title: 'Over / Under window',
          blurb: `${best.gap}-pt total window · ${getVenue(best.qo.bookId).shortName} O${best.overLine} / ${getVenue(best.qu.bookId).shortName} U${best.underLine}`,
          honesty: HONEST.window,
          windowGap: best.gap,
          legs: [
            {
              eventId: event.id,
              eventLabel: eventLabel(event),
              pick: `Over ${best.overLine}`,
              marketType: 'totals',
              bookId: best.qo.bookId,
              odds: best.qo.odds,
              line: best.overLine,
            },
            {
              eventId: event.id,
              eventLabel: eventLabel(event),
              pick: `Under ${best.underLine}`,
              marketType: 'totals',
              bookId: best.qu.bookId,
              odds: best.qu.odds,
              line: best.underLine,
            },
          ],
        });
      }
    }
  }

  return out;
}

/** Build retail ticket ideas. Not +EV. Not arb. */
export function buildTickets(events: Event[], options: BuildTicketsOptions = {}): TicketIdea[] {
  const { shopIds, seed = 1, limit = 12 } = options;
  const straights = straightTickets(events, shopIds);
  const sgp = sgpTickets(events, shopIds);
  const rr = roundRobinTickets(events, shopIds);
  const teasers = teaserTickets(events, shopIds);
  const { ifs, reverses } = ifBetTickets(events, shopIds);
  const windows = windowTickets(events, shopIds);

  const rand = mulberry32(seed);
  const featured = [
    ...shuffle(teasers, rand).slice(0, 2),
    ...shuffle(ifs, rand).slice(0, 1),
    ...shuffle(reverses, rand).slice(0, 1),
    ...shuffle(windows, rand).slice(0, 2),
  ];
  const classic = [
    ...shuffle(straights, rand).slice(0, 2),
    ...shuffle(sgp, rand).slice(0, 2),
    ...rr,
  ];
  return [...featured, ...classic].slice(0, limit);
}

export const TICKET_HONESTY = HONEST;
