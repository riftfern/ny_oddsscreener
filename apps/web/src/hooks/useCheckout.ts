import { usePlan } from '@/components/auth/AuthProvider';

export function useCheckout() {
  const { getToken } = usePlan();

  return async function checkout(plan: 'edge' | 'pro') {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };

    if (getToken) {
      const token = await getToken();
      if (token) headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL ?? ''}/api/billing/checkout`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ plan }),
    });

    if (!response.ok) {
      const body = await response.json().catch(() => ({ error: 'unknown' }));
      return { error: body.error ?? 'checkout_failed' };
    }

    const data = (await response.json()) as { url?: string };
    return { url: data.url };
  };
}

export async function startCheckout(plan: 'edge' | 'pro'): Promise<void> {
  const response = await fetch(`${import.meta.env.VITE_API_URL ?? ''}/api/billing/checkout`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan }),
  });

  if (!response.ok) {
    // Billing not configured (501) or other failure — fall back to stub demo.
    window.location.href = '/app';
    return;
  }

  const result = await response.json();
  if (result.url) {
    window.location.href = result.url;
  } else {
    window.location.href = '/app';
  }
}
