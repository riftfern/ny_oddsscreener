import { usePlan, type Plan } from './AuthProvider';
import UpgradeCard from './UpgradeCard';

interface PlanGateProps {
  requiredPlan: Plan;
  children: React.ReactNode;
}

const PLAN_RANK: Record<Plan, number> = {
  free: 0,
  edge: 1,
  pro: 2,
};

export default function PlanGate({ requiredPlan, children }: PlanGateProps) {
  const { plan, isLoaded } = usePlan();

  if (!isLoaded) {
    return (
      <div className="text-center py-12">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-600 border-t-blue-500"></div>
      </div>
    );
  }

  if (PLAN_RANK[plan] < PLAN_RANK[requiredPlan]) {
    // PlanGate is only used with 'edge' or 'pro' gates; 'free' would always pass.
    const upgradePlan = requiredPlan === 'edge' || requiredPlan === 'pro' ? requiredPlan : 'edge';
    return <UpgradeCard requiredPlan={upgradePlan} />;
  }

  return <>{children}</>;
}
