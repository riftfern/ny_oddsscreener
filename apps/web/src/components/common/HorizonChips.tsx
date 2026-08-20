import type { EventHorizon } from '@ny-sharp-edge/shared';
import Chip from '@/components/common/Chip';
import { useOddsStore } from '@/stores/oddsStore';

const OPTIONS: { id: EventHorizon; label: string }[] = [
  { id: 'tonight', label: 'Tonight' },
  { id: 'soon', label: '3 days' },
  { id: 'season', label: 'Season' },
];

export default function HorizonChips() {
  const horizon = useOddsStore((s) => s.horizon);
  const setHorizon = useOddsStore((s) => s.setHorizon);
  return (
    <>
      {OPTIONS.map((opt) => (
        <Chip key={opt.id} active={horizon === opt.id} onClick={() => setHorizon(opt.id)}>
          {opt.label}
        </Chip>
      ))}
    </>
  );
}
