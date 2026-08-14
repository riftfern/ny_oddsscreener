import { api } from '@/services/api';

export function useCheckout() {
  return async function checkout(plan: 'edge' | 'pro') {
    return api.createCheckoutSession(plan);
  };
}

export async function startCheckout(plan: 'edge' | 'pro'): Promise<void> {
  const result = await api.createCheckoutSession(plan);
  if (result.url) {
    window.location.href = result.url;
  } else {
    // Billing not configured (501) or other failure — fall back to stub demo.
    window.location.href = '/app';
  }
}
