import type { SharpCoverage } from '@/services/api';

interface SharpCoverageNoticeProps {
  coverage?: SharpCoverage;
}

export default function SharpCoverageNotice({ coverage }: SharpCoverageNoticeProps) {
  if (!coverage) return null;
  if (coverage.eventsTotal === 0) return null;
  if (coverage.eventsWithSharp > 0) return null;

  return (
    <div className="glass rounded-2xl p-3">
      <p className="text-warn text-[11px] uppercase tracking-[0.14em]">
        No Pinnacle / sharp line for this sport right now. +EV needs a sharp book. Try NFL or MLB.
      </p>
    </div>
  );
}
