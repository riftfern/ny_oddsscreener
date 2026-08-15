/**
 * Minimal in-memory TTL cache for odds fetches.
 *
 * The Odds API charges ~1 credit unit per sport per region per call. The EV and
 * arb screens each re-scan every sport, so without caching a single page view
 * would burn the whole credit budget in hours. This cache is keyed by the exact
 * fetch params and expires after a short TTL so a demo never bankrupts the key.
 *
 * NOTE: this is in-process memory — it does NOT survive serverless cold starts
 * and is not shared across instances. That is fine for a single long-lived Node
 * box (the intended production host per the plan); do not rely on it on Vercel.
 */
export interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  cachedAt: number;
}

export interface StaleCacheEntry<T> {
  value: T;
  cachedAt: number;
  stale: true;
}

export class OddsCache<T> {
  private store = new Map<string, CacheEntry<T>>();
  private readonly ttlMs: () => number;

  constructor(ttlMs: number | (() => number) = 45_000) {
    this.ttlMs = typeof ttlMs === 'function' ? ttlMs : () => ttlMs;
  }

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      // Keep the entry around for stale fallback; do not delete on expiry.
      return undefined;
    }
    return entry.value;
  }

  /** Return the last cached value even if TTL has expired. */
  getStale(key: string): StaleCacheEntry<T> | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    return { value: entry.value, cachedAt: entry.cachedAt, stale: true };
  }

  /** Peek metadata for the last cached value without returning the payload. */
  peekLast(key: string): { cachedAt: number; expired: boolean } | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    return { cachedAt: entry.cachedAt, expired: Date.now() > entry.expiresAt };
  }

  set(key: string, value: T): void {
    const now = Date.now();
    this.store.set(key, { value, expiresAt: now + this.ttlMs(), cachedAt: now });
  }

  /** Calls the loader only on a cache miss; serves fresh entries inside TTL. */
  async getOrSet(key: string, loader: () => Promise<T>): Promise<T> {
    const cached = this.get(key);
    if (cached !== undefined) return cached;
    const value = await loader();
    this.set(key, value);
    return value;
  }

  clear(): void {
    this.store.clear();
  }

  get size(): number {
    return this.store.size;
  }
}

export function defaultTtlMs(): number {
  const raw = Number(process.env.ODDS_CACHE_TTL_MS);
  return Number.isFinite(raw) && raw > 0 ? raw : 45_000;
}
