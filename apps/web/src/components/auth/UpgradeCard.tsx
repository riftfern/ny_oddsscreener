import { useState } from 'react';
import { Link } from 'react-router-dom';
import { usePlan } from '@/components/auth/AuthProvider';
import { useBillingStatus } from '@/hooks/useBillingStatus';
import { billingErrorMessage } from '@/hooks/useCheckout';

type UpgradablePlan = 'edge' | 'pro';

interface UpgradeCardProps {
  requiredPlan: UpgradablePlan;
  title?: string;
}

const PLAN_COPY: Record<UpgradablePlan, { name: string; price: string; description: string }> = {
  edge: {
    name: 'Edge',
    price: '$19/mo',
    description: 'Live books at your shops, quiet +EV vs Pinnacle, 6 sports.',
  },
  pro: {
    name: 'Pro',
    price: '$49/mo',
    description: 'Everything in Edge plus ticket ideas and Kalshi/Polymarket.',
  },
};

export default function UpgradeCard({
  requiredPlan,
  title = 'Upgrade to unlock this screen',
}: UpgradeCardProps) {
  const { startCheckout } = usePlan();
  const { canCharge } = useBillingStatus();
  const copy = PLAN_COPY[requiredPlan];
  const [error, setError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const handleUpgrade = async () => {
    setError(null);
    setStarting(true);
    const result = await startCheckout(requiredPlan);
    setStarting(false);
    if (result.error) setError(billingErrorMessage(result.error));
  };

  return (
    <div className="glass rounded-2xl p-6 text-center min-w-0">
      <h2 className="font-display font-bold text-ink tracking-tight text-xl sm:text-2xl break-words">{title}</h2>
      <p className="mt-2 text-ink-dim font-mono text-sm">{copy.description}</p>
      <div className="mt-6">
        <p className="text-3xl font-mono font-medium text-ink">
          {copy.price}
        </p>
        <p className="text-[11px] uppercase tracking-[0.14em] text-ink-dim mt-1">Cancel anytime</p>
      </div>
      {canCharge ? (
        <button
          type="button"
          onClick={handleUpgrade}
          disabled={starting}
          className="mt-6 btn btn-primary w-full"
        >
          Upgrade to {copy.name}
        </button>
      ) : (
        <Link to="/app" className="mt-6 btn btn-primary w-full">
          Open the board
        </Link>
      )}
      {error && <p className="mt-3 font-mono text-[12px] text-bad">{error}</p>}
    </div>
  );
}
