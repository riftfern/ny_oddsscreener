import type { Event } from '@ny-sharp-edge/shared';

export function freeDelayMs(): number {
  const raw = Number(process.env.FREE_ODDS_DELAY_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : 15 * 60 * 1000;
}

interface DelayedSnapshot {
  events: Event[];
  frozenAt: number;
}

const snapshots = new Map<string, DelayedSnapshot>();

/** Test helper. */
export function clearDelayedOdds(): void {
  snapshots.clear();
}

/**
 * Publish a live fetch into the delayed bucket.
 * The first snapshot is stored immediately so free users are not empty on boot;
 * later updates copy live → delayed only after FREE_ODDS_DELAY_MS.
 */
export function publishLiveSnapshot(key: string, events: Event[], now = Date.now()): void {
  const prev = snapshots.get(key);
  if (!prev || now - prev.frozenAt >= freeDelayMs()) {
    snapshots.set(key, { events, frozenAt: now });
  }
}

export function getDelayedSnapshot(key: string): { events: Event[]; cachedAt: string } | undefined {
  const prev = snapshots.get(key);
  if (!prev) return undefined;
  return { events: prev.events, cachedAt: new Date(prev.frozenAt).toISOString() };
}
