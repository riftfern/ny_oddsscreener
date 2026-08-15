import * as fs from 'node:fs';
import * as path from 'node:path';
import type { Event, SportKey, RegionKey } from '@ny-sharp-edge/shared';

interface SnapshotRecord {
  ts: string;
  sport: SportKey;
  regions: RegionKey[];
  eventId: string;
  bookId: string;
  marketType: string;
  outcomeName: string;
  odds: number;
  line?: number;
}

function snapshotsEnabled(): boolean {
  if (process.env.USE_MOCK_DATA === 'true') return false;
  return process.env.SNAPSHOTS === 'true';
}

function getSnapshotPath(): string {
  if (process.env.SNAPSHOT_PATH) return process.env.SNAPSHOT_PATH;
  return path.resolve(process.cwd(), 'apps/api/data/odds_snapshots.jsonl');
}

function ensureDir(filePath: string): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function rotateIfNeeded(filePath: string): void {
  try {
    if (!fs.existsSync(filePath)) return;
    const stats = fs.statSync(filePath);
    const maxBytes = 50 * 1024 * 1024; // ~50 MB
    if (stats.size < maxBytes) return;

    const backup = `${filePath}.1`;
    if (fs.existsSync(backup)) {
      fs.unlinkSync(backup);
    }
    fs.renameSync(filePath, backup);
  } catch (err) {
    console.error('[snapshots] rotation failed:', err);
  }
}

/**
 * Append one JSON line per h2h outcome/book to the snapshot log.
 *
 * Snapshots are append-only and rotated at ~50MB (one backup kept). They are
 * disabled in mock mode and when SNAPSHOTS=false. Errors are logged and do not
 * block the request.
 */
export function appendOddsSnapshot(
  sport: SportKey,
  regions: RegionKey[],
  events: Event[]
): void {
  if (!snapshotsEnabled()) return;

  const filePath = getSnapshotPath();
  const ts = new Date().toISOString();
  const lines: string[] = [];

  for (const event of events) {
    for (const market of event.markets) {
      // Only moneylines for now; spreads/totals can be added later if needed.
      if (market.type !== 'h2h') continue;
      for (const outcome of market.outcomes) {
        for (const bookOdd of outcome.bookOdds) {
          const record: SnapshotRecord = {
            ts,
            sport,
            regions,
            eventId: event.id,
            bookId: bookOdd.bookId,
            marketType: market.type,
            outcomeName: outcome.name,
            odds: bookOdd.odds,
            line: bookOdd.line,
          };
          lines.push(JSON.stringify(record));
        }
      }
    }
  }

  if (lines.length === 0) return;

  try {
    ensureDir(filePath);
    rotateIfNeeded(filePath);
    fs.appendFileSync(filePath, `${lines.join('\n')}\n`, 'utf8');
  } catch (err) {
    console.error('[snapshots] append failed:', err);
  }
}

/** Clear the snapshot log. Useful in tests. */
export function clearSnapshot(filePath?: string): void {
  const target = filePath ?? getSnapshotPath();
  try {
    if (fs.existsSync(target)) {
      fs.unlinkSync(target);
    }
    const backup = `${target}.1`;
    if (fs.existsSync(backup)) {
      fs.unlinkSync(backup);
    }
  } catch (err) {
    console.error('[snapshots] clear failed:', err);
  }
}
