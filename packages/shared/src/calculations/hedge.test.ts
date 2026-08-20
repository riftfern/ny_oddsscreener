import { describe, it, expect } from 'vitest';
import {
  hedgeCoverLine,
  hedgeNets,
  isAbsurdAmerican,
  isSeasonTicket,
  isSteamrollerHedge,
  isUglyMiddle,
  stakeForPayout,
  totalsWindowHits,
  totalsWindowHint,
  windowTwoWayNet,
} from './hedge';
import { calculatePayout } from './odds';

describe('stakeForPayout', () => {
  it('matches calculatePayout at +100', () => {
    const h = stakeForPayout(100, 100);
    expect(h).toBeCloseTo(50, 5);
    expect(calculatePayout(h, 100)).toBeCloseTo(100, 5);
  });

  it('matches calculatePayout at -110', () => {
    const h = stakeForPayout(-110, 95.45);
    expect(calculatePayout(h, -110)).toBeCloseTo(95.45, 2);
  });
});

describe('isSeasonTicket', () => {
  it('treats +550 with no kind as a future', () => {
    expect(isSeasonTicket({ odds: 550 })).toBe(true);
    expect(isSeasonTicket({ odds: -110 })).toBe(false);
    expect(isSeasonTicket({ odds: 180, kind: 'future' })).toBe(true);
    expect(isSeasonTicket({ odds: 550, kind: 'game' })).toBe(false);
    expect(isSeasonTicket({ odds: 200, note: 'Super Bowl' })).toBe(true);
  });
});

describe('totalsWindowHits', () => {
  it('O41.5 / U42.5 is 42', () => {
    expect(totalsWindowHits(41.5, 42.5)).toEqual([42]);
    expect(totalsWindowHint(41.5, 42.5)).toMatch(/42/);
  });
});

describe('hedgeCoverLine', () => {
  it('sizes the other side to match the original return', () => {
    const line = hedgeCoverLine({ stake: 50, odds: -110, hedgeOdds: -190 });
    expect(line.hedgeReturn).toBeCloseTo(line.ifOriginalWins, 2);
    expect(line.hedgeStake).toBeGreaterThan(0);
  });

  it('hides a -870 steamroller cover', () => {
    expect(isSteamrollerHedge(-870)).toBe(true);
    expect(isSteamrollerHedge(-199)).toBe(false);
  });

  it('reports both-win vs original-win nets', () => {
    const cover = hedgeCoverLine({ stake: 20, odds: 195, hedgeOdds: -199 });
    const nets = hedgeNets(20, cover);
    expect(nets.ifHedgeWinsNet).toBeCloseTo(cover.ifOriginalWins - 20, 5);
  });
});

describe('windows', () => {
  it('calls -320 / -245 an ugly middle', () => {
    expect(isUglyMiddle(-320, -245)).toBe(true);
    expect(isUglyMiddle(-110, -110)).toBe(false);
  });

  it('worst one-side result is a loss on a heavy-favorite window', () => {
    const n = windowTwoWayNet(10, -320, -245);
    expect(n.worstOne).toBeLessThan(0);
    expect(n.both).toBeGreaterThan(n.worstOne);
  });
});

describe('absurd exchange odds', () => {
  it('treats ±9900 as junk', () => {
    expect(isAbsurdAmerican(9900)).toBe(true);
    expect(isAbsurdAmerican(-9900)).toBe(true);
    expect(isAbsurdAmerican(-110)).toBe(false);
  });
});
