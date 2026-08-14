import type { Event, SportKey, EVOpportunity, ArbitrageOpportunity } from '@ny-sharp-edge/shared';

const API_BASE = `${import.meta.env.VITE_API_URL ?? ''}/api`;

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
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
};
