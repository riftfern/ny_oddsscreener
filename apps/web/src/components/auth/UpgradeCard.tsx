import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCheckout } from '@/hooks/useCheckout';

const requireAuth = import.meta.env.VITE_REQUIRE_AUTH === 'true';

type UpgradablePlan = 'edge' | 'pro';

interface UpgradeCardProps {
  requiredPlan: UpgradablePlan;
  title?: string;
}

const PLAN_COPY: Record<UpgradablePlan, { name: string; price: string; description: string }> = {
  edge: {
    name: 'Edge',
    price: '$19/mo',
    description: 'Live US books, +EV vs Pinnacle, 6 sports.',
  },
  pro: {
    name: 'Pro',
    price: '$49/mo',
    description: 'Everything in Edge plus arbitrage and Kalshi/Polymarket.',
  },
};

export default function UpgradeCard({
  requiredPlan,
  title = 'Upgrade to unlock this screen',
}: UpgradeCardProps) {
  const checkout = useCheckout();
  const copy = PLAN_COPY[requiredPlan];
  const [boardOnly, setBoardOnly] = useState(!requireAuth);

  const handleUpgrade = async () => {
    const result = await checkout(requiredPlan);
    if (result.url) {
      window.location.href = result.url;
    } else {
      setBoardOnly(true);
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-12 border border-line bg-bg-2 p-8 text-center">
      <h2 className="font-display font-bold text-ink tracking-tight text-2xl">{title}</h2>
      <p className="mt-2 text-ink-dim font-mono text-sm">{copy.description}</p>
      <div className="mt-6">
        <p className="text-3xl font-mono font-medium text-ink">
          {copy.price}
        </p>
        <p className="text-[11px] uppercase tracking-[0.18em] text-ink-dim mt-1">Cancel anytime</p>
      </div>
      {boardOnly ? (
        <Link
          to="/app"
          className="mt-6 inline-block bg-moss hover:bg-moss-2 text-ink font-display font-semibold uppercase tracking-[0.14em] text-[11px] px-6 py-3"
        >
          Open the board →
        </Link>
      ) : (
        <button
          type="button"
          onClick={handleUpgrade}
          className="mt-6 inline-block bg-moss hover:bg-moss-2 text-ink font-display font-semibold uppercase tracking-[0.14em] text-[11px] px-6 py-3"
        >
          Upgrade to {copy.name}
        </button>
      )}
    </div>
  );
}
