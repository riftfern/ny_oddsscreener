import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { SportKey } from '@ny-sharp-edge/shared';

export function useExchangeOdds(sport: SportKey) {
  return useQuery({
    queryKey: ['exchangeOdds', sport],
    queryFn: () => api.getExchangeOdds(sport),
  });
}
