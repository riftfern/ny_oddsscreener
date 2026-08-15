import { SPORT_INFO, type SportKey } from '@ny-sharp-edge/shared';
import { useOddsStore } from '@/stores/oddsStore';
import type { SharpCoverage } from '@/services/api';

const sports: SportKey[] = [
  'americanfootball_nfl',
  'basketball_nba',
  'baseball_mlb',
  'icehockey_nhl',
  'soccer_epl',
  'soccer_usa_mls',
];

interface SportSelectorProps {
  sharpCoverage?: SharpCoverage;
}

export default function SportSelector({ sharpCoverage }: SportSelectorProps) {
  const { filter, setSport } = useOddsStore();

  const noSharp =
    sharpCoverage &&
    sharpCoverage.eventsTotal > 0 &&
    sharpCoverage.eventsWithSharp === 0;

  return (
    <div className="flex flex-wrap gap-1">
      {sports.map((sportKey) => {
        const sport = SPORT_INFO[sportKey];
        const isActive = filter.sport === sportKey;
        const showHint = isActive && noSharp;

        return (
          <button
            key={sportKey}
            onClick={() => setSport(sportKey)}
            title={showHint ? 'No sharp line available for this sport right now' : undefined}
            className={`px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] border ${
              isActive
                ? 'bg-moss text-ink border-moss'
                : 'bg-transparent text-ink-dim border-line hover:border-moss hover:text-ink'
            }`}
          >
            <span className="flex items-center gap-1.5">
              {sport.shortName}
              {showHint && (
                <span className="h-1.5 w-1.5 bg-warn" aria-hidden="true" />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
