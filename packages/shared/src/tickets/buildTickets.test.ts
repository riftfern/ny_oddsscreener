import { describe, it, expect } from 'vitest';
import { SPORTS, type Event } from '../types/index.js';
import { getMockEvents } from '../mockData.js';
import {
  buildTickets,
  parlayAmerican,
  spreadCrossesKeys,
  teasePointsForSport,
  teasedSpreadLine,
  TICKET_HONESTY,
} from './buildTickets.js';

describe('buildTickets', () => {
  const events = getMockEvents(SPORTS.NFL);
  const shops = ['fanduel', 'draftkings'];

  it('builds chill / spicy / chaos without inventing hit rates', () => {
    const tickets = buildTickets(events, { shopIds: shops, seed: 7 });
    expect(tickets.length).toBeGreaterThan(0);
    expect(tickets.some((t) => t.kind === 'straight')).toBe(true);
    expect(tickets.some((t) => t.kind === 'sgp')).toBe(true);
    expect(tickets.some((t) => t.kind === 'round_robin')).toBe(true);
    for (const t of tickets) {
      expect(t.honesty).toBeTruthy();
      expect(t.honesty.toLowerCase()).not.toContain('lock');
      expect(t.honesty.toLowerCase()).not.toMatch(/guaranteed|print|winner/);
      for (const leg of t.legs) {
        expect(shops).toContain(leg.bookId);
      }
    }
  });

  it('SGP legs share one book', () => {
    const sgps = buildTickets(events, { shopIds: shops, seed: 1 }).filter((t) => t.kind === 'sgp');
    expect(sgps.length).toBeGreaterThan(0);
    for (const t of sgps) {
      const books = new Set(t.legs.map((l) => l.bookId));
      expect(books.size).toBe(1);
      expect(t.honesty).toBe(TICKET_HONESTY.sgp);
    }
  });

  it('round robin is three 2-leg parlays', () => {
    const rr = buildTickets(events, { shopIds: shops, seed: 1 }).find((t) => t.kind === 'round_robin');
    expect(rr).toBeDefined();
    expect(rr!.legs).toHaveLength(3);
    expect(rr!.rrPairs).toEqual([
      [0, 1],
      [0, 2],
      [1, 2],
    ]);
  });

  it('parlay math is the product of decimals', () => {
    expect(parlayAmerican([100, 100])).toBe(300);
  });

  it('same seed is stable', () => {
    const a = buildTickets(events, { shopIds: shops, seed: 42 }).map((t) => t.id);
    const b = buildTickets(events, { shopIds: shops, seed: 42 }).map((t) => t.id);
    expect(a).toEqual(b);
  });
});

describe('Wong teaser math', () => {
  it('NFL is 6 points and NBA is 4', () => {
    expect(teasePointsForSport(SPORTS.NFL)).toBe(6);
    expect(teasePointsForSport(SPORTS.NBA)).toBe(4);
    expect(teasePointsForSport(SPORTS.MLB)).toBeUndefined();
  });

  it('moves the spread toward the bettor', () => {
    expect(teasedSpreadLine(-8.5, 6)).toBe(-2.5);
    expect(teasedSpreadLine(2.5, 6)).toBe(8.5);
    expect(teasedSpreadLine(-8.5, 4)).toBe(-4.5);
  });

  it('classic Wong favorites and dogs cross 3 and 7', () => {
    expect(spreadCrossesKeys(-8.5, -2.5)).toBe(true);
    expect(spreadCrossesKeys(2.5, 8.5)).toBe(true);
    expect(spreadCrossesKeys(-3, 3)).toBe(true);
    expect(spreadCrossesKeys(-6.5, -0.5)).toBe(true);
    expect(spreadCrossesKeys(-2.5, 1.5)).toBe(false);
    expect(spreadCrossesKeys(-14.5, -8.5)).toBe(false);
  });

  it('deals same-book teasers with no invented juice', () => {
    const tickets = buildTickets(getMockEvents(SPORTS.NFL), {
      shopIds: ['fanduel', 'draftkings'],
      seed: 1,
    });
    const teasers = tickets.filter((t) => t.kind === 'teaser');
    expect(teasers.length).toBeGreaterThan(0);
    for (const t of teasers) {
      expect(t.teasePoints).toBe(6);
      expect(t.parlayOdds).toBeUndefined();
      expect(t.honesty).toBe(TICKET_HONESTY.teaser);
      expect(t.legs.length).toBeGreaterThanOrEqual(2);
      expect(new Set(t.legs.map((l) => l.bookId)).size).toBe(1);
      expect(new Set(t.legs.map((l) => l.eventId)).size).toBe(t.legs.length);
      for (const leg of t.legs) {
        expect(leg.fromLine).toBeDefined();
        expect(leg.line).toBe(teasedSpreadLine(leg.fromLine!, 6));
        expect(spreadCrossesKeys(leg.fromLine!, leg.line!)).toBe(true);
      }
    }
  });
});

describe('if-bets and reverses', () => {
  it('does not deal if-bets at NY books without the product', () => {
    const tickets = buildTickets(getMockEvents(SPORTS.NFL), {
      shopIds: ['fanduel', 'draftkings'],
      seed: 1,
    });
    expect(tickets.some((t) => t.kind === 'if_bet' || t.kind === 'reverse')).toBe(false);
  });

  it('sequences two same-book moneylines by start time', () => {
    const tickets = buildTickets(getMockEvents(SPORTS.NFL), {
      shopIds: ['bovada'],
      seed: 1,
    });
    const ifs = tickets.filter((t) => t.kind === 'if_bet');
    const revs = tickets.filter((t) => t.kind === 'reverse');
    expect(ifs.length).toBeGreaterThan(0);
    expect(revs.length).toBeGreaterThan(0);

    for (const t of ifs) {
      expect(t.legs).toHaveLength(2);
      expect(t.ifOrders).toEqual([[0, 1]]);
      expect(t.parlayOdds).toBeUndefined();
      expect(t.honesty).toBe(TICKET_HONESTY.ifBet);
      expect(t.legs[0].bookId).toBe('bovada');
      expect(t.legs[1].bookId).toBe('bovada');
      expect(t.legs[0].eventId).not.toBe(t.legs[1].eventId);
    }

    for (const t of revs) {
      expect(t.ifOrders).toEqual([
        [0, 1],
        [1, 0],
      ]);
      expect(t.honesty).toBe(TICKET_HONESTY.reverse);
    }
  });
});

describe('cross-book windows', () => {
  const now = Date.now();
  const windowEvent: Event = {
    id: 'win-1',
    sportKey: SPORTS.NFL,
    homeTeam: 'New York Jets',
    awayTeam: 'Buffalo Bills',
    commenceTime: new Date(now + 3600000).toISOString(),
    markets: [
      {
        type: 'h2h',
        outcomes: [
          {
            name: 'Buffalo Bills',
            bookOdds: [
              { bookId: 'fanduel', odds: -150, updatedAt: '' },
              { bookId: 'draftkings', odds: -148, updatedAt: '' },
            ],
          },
          {
            name: 'New York Jets',
            bookOdds: [
              { bookId: 'fanduel', odds: 130, updatedAt: '' },
              { bookId: 'draftkings', odds: 128, updatedAt: '' },
            ],
          },
        ],
      },
      {
        type: 'spreads',
        outcomes: [
          {
            name: 'Buffalo Bills',
            point: -3.5,
            bookOdds: [
              { bookId: 'fanduel', odds: -110, line: -3.5, updatedAt: '' },
              { bookId: 'draftkings', odds: -110, line: -3.5, updatedAt: '' },
            ],
          },
          {
            name: 'New York Jets',
            point: 3.5,
            bookOdds: [
              { bookId: 'fanduel', odds: -110, line: 3.5, updatedAt: '' },
              { bookId: 'draftkings', odds: -110, line: 5, updatedAt: '' },
            ],
          },
        ],
      },
    ],
  };

  it('finds a 1.5-pt spread window across books', () => {
    const tickets = buildTickets([windowEvent], {
      shopIds: ['fanduel', 'draftkings'],
      seed: 1,
    });
    const windows = tickets.filter((t) => t.kind === 'window');
    expect(windows.length).toBeGreaterThan(0);
    const w = windows[0];
    expect(w.windowGap).toBe(1.5);
    expect(w.parlayOdds).toBeUndefined();
    expect(w.honesty).toBe(TICKET_HONESTY.window);
    expect(new Set(w.legs.map((l) => l.bookId)).size).toBe(2);
    expect(w.legs.every((l) => l.eventId === 'win-1')).toBe(true);
  });

  it('skips a window when both sides are huge favorites', () => {
    const ugly: Event = {
      ...windowEvent,
      markets: [
        {
          type: 'spreads',
          outcomes: [
            {
              name: 'Buffalo Bills',
              point: -3.5,
              bookOdds: [{ bookId: 'fanduel', odds: -320, line: -3.5, updatedAt: '' }],
            },
            {
              name: 'New York Jets',
              point: 4.5,
              bookOdds: [{ bookId: 'draftkings', odds: -245, line: 4.5, updatedAt: '' }],
            },
          ],
        },
      ],
    };
    const tickets = buildTickets([ugly], {
      shopIds: ['fanduel', 'draftkings'],
      seed: 1,
    });
    expect(tickets.filter((t) => t.kind === 'window')).toEqual([]);
  });

  it('does not invent a window at one book', () => {
    const tickets = buildTickets([windowEvent], { shopIds: ['fanduel'], seed: 1 });
    expect(tickets.some((t) => t.kind === 'window')).toBe(false);
  });

  it('does not treat same-team alt lines as a window', () => {
    const alts: Event = {
      ...windowEvent,
      markets: [
        {
          type: 'spreads',
          outcomes: [
            {
              name: 'Carolina Panthers',
              point: 7,
              bookOdds: [
                { bookId: 'fanduel', odds: -110, line: 7, updatedAt: '' },
                { bookId: 'caesars', odds: -110, line: 7.5, updatedAt: '' },
              ],
            },
            {
              name: 'Carolina Panthers',
              point: 3.5,
              bookOdds: [{ bookId: 'draftkings', odds: -110, line: 3.5, updatedAt: '' }],
            },
            {
              name: 'New Orleans Saints',
              point: -3.5,
              bookOdds: [
                { bookId: 'fanduel', odds: -110, line: -3.5, updatedAt: '' },
                { bookId: 'draftkings', odds: -110, line: -3.5, updatedAt: '' },
              ],
            },
          ],
        },
      ],
    };
    const tickets = buildTickets([alts], {
      shopIds: ['fanduel', 'draftkings', 'caesars'],
      seed: 1,
    });
    const windows = tickets.filter((t) => t.kind === 'window');
    for (const w of windows) {
      const names = w.legs.map((l) => l.pick.replace(/ [+-].*$/, ''));
      expect(new Set(names).size).toBe(2);
      expect(w.windowGap).toBeLessThan(8);
    }
  });
});
