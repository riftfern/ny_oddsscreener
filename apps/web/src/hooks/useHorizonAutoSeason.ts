import { useEffect } from 'react';
import { eventInHorizon, type Event } from '@ny-sharp-edge/shared';
import { useOddsStore } from '@/stores/oddsStore';

/** If the 3-day window is empty (NFL in August), flip to Season once. */
export function useHorizonAutoSeason(events?: Event[]) {
  const horizon = useOddsStore((s) => s.horizon);
  const setHorizon = useOddsStore((s) => s.setHorizon);

  useEffect(() => {
    if (!events?.length || horizon !== 'soon') return;
    const n = events.filter((e) => eventInHorizon(e.commenceTime, 'soon')).length;
    if (n === 0) setHorizon('season');
  }, [events, horizon, setHorizon]);
}
