import type { Event, SportKey, EVOpportunity, ArbitrageOpportunity } from '@ny-sharp-edge/shared';

const API_BASE = '/api';

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
  /**
   * Fetch odds for a specific sport
   */
  getOdds: (sport: SportKey): Promise<OddsResponse> => {
    return fetchJson(`/odds?sport=${sport}`);
  },

  /**
   * Fetch +EV opportunities
   */
  getEVOpportunities: (minEV?: number): Promise<EVResponse> => {
    const params = minEV ? `?minEV=${minEV}` : '';
    return fetchJson(`/ev${params}`);
  },

  /**
   * Fetch arbitrage opportunities
   */
  getArbitrageOpportunities: (minProfit?: number, totalStake?: number): Promise<ArbitrageResponse> => {
    const params = new URLSearchParams();
    if (minProfit !== undefined) params.set('minProfit', minProfit.toString());
    if (totalStake !== undefined) params.set('totalStake', totalStake.toString());
    const queryString = params.toString();
    return fetchJson(`/arbitrage${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Health check
   */
  health: (): Promise<{ status: string }> => {
    return fetchJson('/health');
  },
};
