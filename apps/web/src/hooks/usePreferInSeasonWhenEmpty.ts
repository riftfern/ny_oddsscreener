import { useEffect, useRef } from 'react';
import { eventInHorizon, inSeasonSport, type Event } from '@ny-sharp-edge/shared';
import { useOddsStore } from '@/stores/oddsStore';

/** Tickets/Edges: if this sport has nothing in the current horizon, jump to what's on tonight. */
export function usePreferInSeasonWhenEmpty(events?: Event[]) {
  const sport = useOddsStore((s) => s.filter.sport);
  const setSport = useOddsStore((s) => s.setSport);
  const horizon = useOddsStore((s) => s.horizon);
  const setHorizon = useOddsStore((s) => s.setHorizon);
  const switched = useRef(false);

  useEffect(() => {
    if (!events || switched.current) return;
    const n = events.filter((e) => eventInHorizon(e.commenceTime, horizon)).length;
    if (n > 0) return;
    const inSeason = inSeasonSport();
    if (sport !== inSeason) {
      switched.current = true;
      setSport(inSeason);
      if (horizon === 'tonight') setHorizon('soon');
    }
  }, [events, sport, horizon, setSport, setHorizon]);
}
