import { describe, it, expect } from 'vitest';
import { SPORTS } from '../types/index.js';
import { getMockEvents } from '../mockData.js';
import { buildTickets, parlayAmerican, TICKET_HONESTY } from './buildTickets.js';

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
