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

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`);
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'unknown' }));
    throw new ApiError(`API error: ${response.status} ${response.statusText}`, response.status, body);
  }
  return response.json();
}

export interface OddsResponse {
  events: Event[];
  lastUpdated: string;
}

export interface EVResponse {
  opportunities: EVOpportunity[];
  count: number;
  scannedEvents: number;
  minEV: number;
  lastUpdated: string;
}

export interface ArbitrageResponse {
  opportunities: ArbitrageOpportunity[];
  count: number;
  scannedEvents: number;
  minProfit: number;
  totalStake: number;
  lastUpdated: string;
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

  createCheckoutSession: async (plan: 'edge' | 'pro'): Promise<{ url?: string; error?: string }> => {
    const response = await fetch(`${API_BASE}/billing/checkout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ plan }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: 'unknown' }));
      return { error: body.error ?? 'checkout_failed' };
    }
    return response.json();
  },
};
