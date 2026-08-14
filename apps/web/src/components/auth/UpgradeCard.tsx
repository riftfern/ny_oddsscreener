import { useCheckout } from '@/hooks/useCheckout';

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

  const handleUpgrade = async () => {
    const result = await checkout(requiredPlan);
    if (result.url) {
      window.location.href = result.url;
    } else {
      window.location.href = '/app';
    }
  };

  return (
    <div className="max-w-xl mx-auto mt-12 rounded-xl border border-gray-700 bg-gray-800/70 p-8 text-center">
      <h2 className="text-2xl font-bold text-white">{title}</h2>
      <p className="mt-2 text-gray-400">{copy.description}</p>
      <div className="mt-6">
        <p className="text-3xl font-bold text-white">
          {copy.price}
        </p>
        <p className="text-sm text-gray-500">Cancel anytime</p>
      </div>
      <button
        type="button"
        onClick={handleUpgrade}
        className="mt-6 inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
      >
        Upgrade to {copy.name}
      </button>
    </div>
  );
}
