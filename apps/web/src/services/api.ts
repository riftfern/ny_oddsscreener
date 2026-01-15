import type { Event, SportKey, EVOpportunity, ArbitrageOpportunity } from '@ny-sharp-edge/shared';
import { 
  getMockEvents, 
  getMockEVOpportunities, 
  getMockArbitrageOpportunities 
} from '@ny-sharp-edge/shared';

const API_BASE = '/api';

// Use client-side mock data for reliable demo
// The frontend still demonstrates React Query patterns, state management, etc.
const USE_MOCK = true;

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(`${API_BASE}${url}`);
  if (!response.ok) {
    throw new Error(`API error: ${response.status} ${response.statusText}`);
  }
  return response.json();
}

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

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
  getOdds: async (sport: SportKey): Promise<OddsResponse> => {
    if (USE_MOCK) {
      console.log(`Using client-side mock data for ${sport}`);
      await delay(600); // Simulate network latency
      return {
        events: getMockEvents(sport),
        lastUpdated: new Date().toISOString(),
      };
    }
    return fetchJson(`/odds?sport=${sport}`);
  },

  /**
   * Fetch +EV opportunities
   */
  getEVOpportunities: async (minEV?: number): Promise<EVResponse> => {
    if (USE_MOCK) {
      await delay(800);
      const allOpportunities = getMockEVOpportunities();
      const filtered = minEV 
        ? allOpportunities.filter(o => o.evPercentage >= minEV)
        : allOpportunities;
        
      return {
        opportunities: filtered,
        count: filtered.length,
        scannedEvents: 50, // Mock value
        minEV: minEV || 0,
        lastUpdated: new Date().toISOString(),
      };
    }
    const params = minEV ? `?minEV=${minEV}` : '';
    return fetchJson(`/ev${params}`);
  },

  /**
   * Fetch arbitrage opportunities
   */
  getArbitrageOpportunities: async (minProfit?: number, totalStake?: number): Promise<ArbitrageResponse> => {
    if (USE_MOCK) {
      await delay(800);
      const allOpportunities = getMockArbitrageOpportunities();
      const filtered = minProfit
        ? allOpportunities.filter(o => o.profitPercentage >= minProfit)
        : allOpportunities;

      return {
        opportunities: filtered,
        count: filtered.length,
        scannedEvents: 50, // Mock value
        minProfit: minProfit || 0,
        totalStake: totalStake || 100,
        lastUpdated: new Date().toISOString(),
      };
    }
    const params = new URLSearchParams();
    if (minProfit !== undefined) params.set('minProfit', minProfit.toString());
    if (totalStake !== undefined) params.set('totalStake', totalStake.toString());
    const queryString = params.toString();
    return fetchJson(`/arbitrage${queryString ? `?${queryString}` : ''}`);
  },

  /**
   * Health check
   */
  health: async (): Promise<{ status: string }> => {
    if (USE_MOCK) return { status: 'ok (mock)' };
    return fetchJson('/health');
  },
};
