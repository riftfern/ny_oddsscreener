import type { SharpCoverage } from '@/services/api';

interface SharpCoverageNoticeProps {
  coverage?: SharpCoverage;
}

export default function SharpCoverageNotice({ coverage }: SharpCoverageNoticeProps) {
  if (!coverage) return null;
  if (coverage.eventsTotal === 0) return null;
  if (coverage.eventsWithSharp > 0) return null;

  return (
    <div className="bg-yellow-900/20 border border-yellow-500/40 rounded-lg p-3">
      <p className="text-yellow-100 text-sm">
        No Pinnacle / sharp line for this sport right now. +EV needs a sharp book. Try NFL or MLB.
      </p>
    </div>
  );
}
