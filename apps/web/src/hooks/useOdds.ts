import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { SportKey } from '@ny-sharp-edge/shared';

export function useOdds(sport: SportKey) {
  return useQuery({
    queryKey: ['odds', sport],
    queryFn: () => api.getOdds(sport),
    retry: 1,
    retryDelay: 400,
  });
}

export function useEVOpportunities(minEV?: number, sport?: SportKey) {
  return useQuery({
    queryKey: ['ev', sport, minEV],
    queryFn: () => api.getEVOpportunities(minEV, sport),
    retry: 1,
    retryDelay: 400,
  });
}

export function useArbitrageOpportunities(minProfit?: number, totalStake?: number) {
  return useQuery({
    queryKey: ['arbitrage', minProfit, totalStake],
    queryFn: () => api.getArbitrageOpportunities(minProfit, totalStake),
  });
}
