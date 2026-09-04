import type {
  Event,
  SportKey,
  EVOpportunity,
  ArbitrageOpportunity,
  TennisLockerBoard,
} from '@ny-sharp-edge/shared';

const API_BASE = `${import.meta.env.VITE_API_URL ?? ''}/api`;

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly body: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

let getAuthToken: (() => Promise<string | null>) | undefined;

export function setAuthTokenProvider(provider: () => Promise<string | null>): void {
  getAuthToken = provider;
}

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {};
  if (getAuthToken) {
    const token = await getAuthToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function fetchJson<T>(url: string, timeoutMs = 8000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const response = await fetch(`${API_BASE}${url}`, {
      headers: await authHeaders(),
      signal: ctrl.signal,
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: 'unknown' }));
      throw new ApiError(`API error: ${response.status} ${response.statusText}`, response.status, body);
    }
    return await response.json();
  } catch (err) {
    if (err instanceof ApiError) throw err;
    const name = err instanceof Error ? err.name : '';
    if (name === 'AbortError' || name === 'TimeoutError') {
      throw new ApiError('API error: timeout', 0, { error: 'timeout' });
    }
    throw new ApiError('API error: network', 0, { error: 'network' });
  } finally {
    clearTimeout(timer);
  }
}

export interface SharpCoverage {
  eventsWithSharp: number;
  eventsTotal: number;
  sharpBooksSeen: string[];
}

export interface OddsResponse {
  events: Event[];
  lastUpdated: string;
  cachedAt: string;
  stale?: boolean;
  delayed?: boolean;
  remainingCredits?: number;
  sharpCoverage: SharpCoverage;
}

export interface EVResponse {
  opportunities: EVOpportunity[];
  count: number;
  scannedEvents: number;
  minEV: number;
  lastUpdated: string;
  cachedAt: string;
  stale?: boolean;
  remainingCredits?: number;
  sharpCoverage: SharpCoverage;
}

export interface ArbitrageResponse {
  opportunities: ArbitrageOpportunity[];
  count: number;
  scannedEvents: number;
  minProfit: number;
  totalStake: number;
  lastUpdated: string;
  cachedAt: string;
  stale?: boolean;
  remainingCredits?: number;
}

export const api = {
  getOdds: async (sport: SportKey): Promise<OddsResponse> => {
    return fetchJson(`/odds?sport=${sport}`, 20000);
  },

  getExchangeOdds: async (sport: SportKey, unmatched?: boolean): Promise<OddsResponse> => {
    const qs = new URLSearchParams({ sport });
    if (unmatched) qs.set('unmatched', '1');
    return fetchJson(`/odds/exchanges?${qs.toString()}`);
  },

  getEVOpportunities: async (minEV?: number, sport?: SportKey): Promise<EVResponse> => {
    const params = new URLSearchParams();
    if (minEV !== undefined) params.set('minEV', minEV.toString());
    if (sport) params.set('sport', sport);
    const qs = params.toString();
    return fetchJson(`/ev${qs ? `?${qs}` : ''}`, 20000);
  },

  getArbitrageOpportunities: async (minProfit?: number, totalStake?: number): Promise<ArbitrageResponse> => {
    const params = new URLSearchParams();
    if (minProfit !== undefined) params.set('minProfit', minProfit.toString());
    if (totalStake !== undefined) params.set('totalStake', totalStake.toString());
    const qs = params.toString();
    return fetchJson(`/arbitrage${qs ? `?${qs}` : ''}`);
  },

  getTennisPicks: async (token: string): Promise<TennisLockerBoard> => {
    const qs = new URLSearchParams({ k: token });
    return fetchJson(`/tennis/picks?${qs.toString()}`, 12000);
  },

  health: async (): Promise<{
    status: string;
    mock: boolean;
    authRequired: boolean;
    telegramConfigured: boolean;
    nativeExchanges: boolean;
    sharpFallback: 'off' | 'oddspapi';
    snapshots: boolean;
    remainingCredits?: number;
  }> => {
    return fetchJson('/health', 4000);
  },

  getSettings: async (): Promise<{ telegram: { configured: boolean; mockDisabled: boolean } }> => {
    return fetchJson('/settings');
  },

  getBillingStatus: async (): Promise<{ configured: boolean; authRequired: boolean }> => {
    return fetchJson('/billing/status', 4000);
  },

  createCheckoutSession: async (plan: 'edge' | 'pro'): Promise<{ url?: string; error?: string }> => {
    const response = await fetch(`${API_BASE}/billing/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
      body: JSON.stringify({ plan }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: 'unknown' }));
      return { error: body.error ?? 'checkout_failed' };
    }
    return response.json();
  },

  createPortalSession: async (): Promise<{ url?: string; error?: string }> => {
    const response = await fetch(`${API_BASE}/billing/portal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(await authHeaders()) },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: 'unknown' }));
      return { error: body.error ?? 'portal_failed' };
    }
    return response.json();
  },
};
