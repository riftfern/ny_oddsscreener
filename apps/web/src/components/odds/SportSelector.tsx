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
    <div className="flex space-x-2">
      {sports.map((sportKey) => {
        const sport = SPORT_INFO[sportKey];
        const isActive = filter.sport === sportKey;
        const showHint = isActive && noSharp;

        return (
          <button
            key={sportKey}
            onClick={() => setSport(sportKey)}
            title={showHint ? 'No sharp line available for this sport right now' : undefined}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            <span className="flex items-center gap-1.5">
              {sport.shortName}
              {showHint && (
                <span className="h-2 w-2 rounded-full bg-yellow-400" aria-hidden="true" />
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
}
