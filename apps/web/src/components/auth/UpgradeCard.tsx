import { Link } from 'react-router-dom';
import type { Plan } from './AuthProvider';

interface UpgradeCardProps {
  requiredPlan: Plan;
  title?: string;
}

const PLAN_COPY: Record<Plan, { name: string; price: string; description: string }> = {
  free: {
    name: 'Edge',
    price: '$19/mo',
    description: 'Live US books, +EV vs Pinnacle, 6 sports.',
  },
  edge: {
    name: 'Pro',
    price: '$49/mo',
    description: 'Everything in Edge plus arbitrage and Kalshi/Polymarket.',
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
  const copy = PLAN_COPY[requiredPlan];

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
      <Link
        to="/"
        className="mt-6 inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-lg transition-colors"
      >
        Upgrade to {copy.name}
      </Link>
    </div>
  );
}
