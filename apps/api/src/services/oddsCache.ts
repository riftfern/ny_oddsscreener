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
interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class OddsCache<T> {
  private store = new Map<string, CacheEntry<T>>();

  constructor(private readonly ttlMs: number = 45_000) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    this.store.set(key, { value, expiresAt: Date.now() + this.ttlMs });
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
