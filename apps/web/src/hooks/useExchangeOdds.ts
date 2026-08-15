import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';
import type { SportKey } from '@ny-sharp-edge/shared';

export function useExchangeOdds(sport: SportKey, unmatched?: boolean) {
  return useQuery({
    queryKey: ['exchangeOdds', sport, unmatched ? 'unmatched' : 'games'],
    queryFn: () => api.getExchangeOdds(sport, unmatched),
  });
}
