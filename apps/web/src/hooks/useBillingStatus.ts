import { useQuery } from '@tanstack/react-query';
import { api } from '@/services/api';

const clerkReady = Boolean(import.meta.env.VITE_CLERK_PUBLISHABLE_KEY);
const requireAuth = import.meta.env.VITE_REQUIRE_AUTH === 'true';

export function useBillingStatus() {
  const query = useQuery({
    queryKey: ['billing-status'],
    queryFn: () => api.getBillingStatus(),
    staleTime: 60_000,
    refetchInterval: false,
    retry: 1,
  });

  const configured = query.isFetched ? Boolean(query.data?.configured) : requireAuth;
  const canCharge = clerkReady && configured;

  return {
    ...query,
    canCharge,
    authRequired: query.data?.authRequired ?? requireAuth,
  };
}
