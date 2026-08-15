import type { Event, SportKey, EVOpportunity, ArbitrageOpportunity } from '@ny-sharp-edge/shared';

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

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: await authHeaders(),
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'unknown' }));
    throw new ApiError(`API error: ${response.status} ${response.statusText}`, response.status, body);
  }
  return response.json();
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
    return fetchJson(`/odds?sport=${sport}`);
  },

  getExchangeOdds: async (sport: SportKey): Promise<OddsResponse> => {
    return fetchJson(`/odds/exchanges?sport=${sport}`);
  },

  getEVOpportunities: async (minEV?: number): Promise<EVResponse> => {
    const params = new URLSearchParams();
    if (minEV !== undefined) params.set('minEV', minEV.toString());
    const qs = params.toString();
    return fetchJson(`/ev${qs ? `?${qs}` : ''}`);
  },

  getArbitrageOpportunities: async (minProfit?: number, totalStake?: number): Promise<ArbitrageResponse> => {
    const params = new URLSearchParams();
    if (minProfit !== undefined) params.set('minProfit', minProfit.toString());
    if (totalStake !== undefined) params.set('totalStake', totalStake.toString());
    const qs = params.toString();
    return fetchJson(`/arbitrage${qs ? `?${qs}` : ''}`);
  },

  health: async (): Promise<{ status: string }> => {
    return fetchJson('/health');
  },

  getSettings: async (): Promise<{ telegram: { configured: boolean; mockDisabled: boolean } }> => {
    return fetchJson('/settings');
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
};
