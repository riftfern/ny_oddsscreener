import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import * as fs from 'node:fs';
import * as os from 'node:os';
import * as path from 'node:path';
import { appendOddsSnapshot, clearSnapshot } from './snapshots';
import type { Event } from '@ny-sharp-edge/shared';

const NOW = '2026-08-15T00:00:00Z';

function makeEvent(overrides: Partial<Event> = {}): Event {
  return {
    id: 'evt-1',
    sportKey: 'basketball_nba' as const,
    homeTeam: 'Knicks',
    awayTeam: 'Lakers',
    commenceTime: NOW,
    markets: [
      {
        type: 'h2h',
        outcomes: [
          {
            name: 'Lakers',
            point: undefined,
            bookOdds: [
              { bookId: 'fanduel', odds: 120, updatedAt: NOW },
              { bookId: 'pinnacle', odds: 110, updatedAt: NOW },
            ],
            bestOdds: { bookId: 'fanduel', odds: 120, updatedAt: NOW },
          },
          {
            name: 'Knicks',
            point: undefined,
            bookOdds: [
              { bookId: 'fanduel', odds: -140, updatedAt: NOW },
              { bookId: 'pinnacle', odds: -130, updatedAt: NOW },
            ],
            bestOdds: { bookId: 'fanduel', odds: -140, updatedAt: NOW },
          },
        ],
      },
    ],
    ...overrides,
  };
}

describe('appendOddsSnapshot', () => {
  const originalEnv = { ...process.env };
  let tmpPath: string;

  beforeEach(() => {
    process.env = { ...originalEnv };
    tmpPath = path.join(os.tmpdir(), `odds-snapshots-${Date.now()}.jsonl`);
    clearSnapshot(tmpPath);
  });

  afterEach(() => {
    process.env = { ...originalEnv };
    clearSnapshot(tmpPath);
  });

  it('writes at least one line per h2h outcome/book on a live fetch', () => {
    process.env.SNAPSHOTS = 'true';
    process.env.SNAPSHOT_PATH = tmpPath;

    appendOddsSnapshot('basketball_nba', ['us', 'us2', 'eu'], [makeEvent()]);

    const contents = fs.readFileSync(tmpPath, 'utf8');
    const lines = contents.trim().split('\n').filter(Boolean);
    expect(lines.length).toBeGreaterThanOrEqual(4);

    const records = lines.map((line) => JSON.parse(line));
    expect(records[0]).toHaveProperty('ts');
    expect(records[0]).toHaveProperty('sport', 'basketball_nba');
    expect(records[0]).toHaveProperty('eventId', 'evt-1');
    expect(records[0]).toHaveProperty('bookId');
    expect(records[0]).toHaveProperty('odds');
  });

  it('writes nothing in mock mode', () => {
    process.env.SNAPSHOTS = 'true';
    process.env.SNAPSHOT_PATH = tmpPath;
    process.env.USE_MOCK_DATA = 'true';

    appendOddsSnapshot('basketball_nba', ['us', 'us2', 'eu'], [makeEvent()]);

    expect(fs.existsSync(tmpPath)).toBe(false);
  });

  it('writes nothing when SNAPSHOTS is not true', () => {
    process.env.SNAPSHOTS = 'false';
    process.env.SNAPSHOT_PATH = tmpPath;

    appendOddsSnapshot('basketball_nba', ['us', 'us2', 'eu'], [makeEvent()]);

    expect(fs.existsSync(tmpPath)).toBe(false);
  });
});
