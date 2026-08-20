import { api } from '@/services/api';

/** Low-level checkout POST. Prefer usePlan().startCheckout so unsigned users get a sign-in modal. */
export function useCheckout() {
  return async function checkout(plan: 'edge' | 'pro') {
    return api.createCheckoutSession(plan);
  };
}

export const BILLING_ERROR_COPY: Record<string, string> = {
  unauthenticated: 'Sign in to subscribe.',
  billing_not_configured: 'Billing is not set up yet.',
  checkout_failed: 'Could not start checkout. Try again.',
  portal_failed: 'Could not open billing portal.',
  no_customer: 'No billing account yet — subscribe first.',
  loading: 'Sign-in is still loading.',
};

export function billingErrorMessage(error?: string): string {
  if (!error) return 'Something went wrong.';
  return BILLING_ERROR_COPY[error] ?? 'Could not start checkout. Try again.';
}
