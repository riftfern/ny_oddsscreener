import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { SportKey } from '@ny-sharp-edge/shared';

export function useOdds(sport: SportKey) {
  return useQuery({
    queryKey: ['odds', sport],
    queryFn: () => api.getOdds(sport),
  });
}

export function useEVOpportunities(minEV?: number) {
  return useQuery({
    queryKey: ['ev', minEV],
    queryFn: () => api.getEVOpportunities(minEV),
  });
}

export function useArbitrageOpportunities(minProfit?: number, totalStake?: number) {
  return useQuery({
    queryKey: ['arbitrage', minProfit, totalStake],
    queryFn: () => api.getArbitrageOpportunities(minProfit, totalStake),
  });
}
