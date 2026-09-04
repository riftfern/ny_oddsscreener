import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import express from 'express';
import supertest from 'supertest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import tennisRouter from './tennis.js';

function createApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/tennis', tennisRouter);
  return app;
}

describe('tennis locker route', () => {
  const originalEnv = { ...process.env };
  let tmp: string;

  beforeEach(() => {
    tmp = mkdtempSync(join(tmpdir(), 'tennis-picks-'));
    process.env.TENNIS_LOCKER_TOKEN = 'test-token-abc';
    process.env.TENNIS_PICKS_PATH = join(tmp, 'tennis.json');
    writeFileSync(
      process.env.TENNIS_PICKS_PATH,
      JSON.stringify({
        generatedAt: '2026-09-03T12:00:00.000Z',
        dataThrough: { atp: '20260830', wta: '20260830' },
        ingestedLive: { atp: 12, wta: 8 },
        totalMatches: 1000,
        playersRated: 500,
        matchCount: 1,
        pickCount: 1,
        matches: [
          {
            id: 'm1',
            tour: 'ATP',
            tournament: 'US Open',
            surface: 'Hard',
            sportKey: 'tennis_atp_us_open',
            commenceTime: '2026-09-03T23:00:00Z',
            playerA: 'Jannik Sinner',
            playerB: 'Carlos Alcaraz',
            probA: 0.62,
            probB: 0.38,
            oddsA: 1.7,
            oddsB: 2.2,
            americanA: -143,
            americanB: 120,
            evA: 5.4,
            evB: -16,
            edgeA: 3.2,
            edgeB: -7.5,
            confidence: 0.7,
            ratingA: 2100,
            ratingB: 2050,
            pick: 'Jannik Sinner',
            pickSide: 'A',
            pickProb: 0.62,
            pickOdds: 1.7,
            pickAmerican: -143,
            pickEv: 5.4,
            isValue: true,
            thinData: false,
            matchesA: 80,
            matchesB: 70,
          },
        ],
        picks: [],
      })
    );
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    rmSync(tmp, { recursive: true, force: true });
  });

  it('404s without a token', async () => {
    const res = await supertest(createApp()).get('/api/tennis/picks');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Not found');
  });

  it('404s with the wrong token', async () => {
    const res = await supertest(createApp()).get('/api/tennis/picks?k=nope');
    expect(res.status).toBe(404);
  });

  it('returns the board with the right query token', async () => {
    const res = await supertest(createApp()).get('/api/tennis/picks?k=test-token-abc');
    expect(res.status).toBe(200);
    expect(res.body.matchCount).toBe(1);
    expect(res.body.matches[0].pick).toBe('Jannik Sinner');
  });

  it('accepts the token as a header', async () => {
    const res = await supertest(createApp())
      .get('/api/tennis/picks')
      .set('x-tennis-token', 'test-token-abc');
    expect(res.status).toBe(200);
    expect(res.body.ingestedLive.atp).toBe(12);
  });
});
