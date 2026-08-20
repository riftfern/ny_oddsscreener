import { SPORT_INFO, type SportKey } from '@ny-sharp-edge/shared';
import { useOddsStore } from '@/stores/oddsStore';
import type { SharpCoverage } from '@/services/api';
import Chip from '@/components/common/Chip';

const sports: SportKey[] = [
  'americanfootball_nfl',
  'basketball_nba',
  'baseball_mlb',
  'icehockey_nhl',
  'soccer_epl',
  'soccer_usa_mls',
  'tennis_majors',
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
    <div className="flex flex-wrap gap-1.5">
      {sports.map((sportKey) => {
        const sport = SPORT_INFO[sportKey];
        const isActive = filter.sport === sportKey;
        const showHint = isActive && noSharp;

        return (
          <Chip
            key={sportKey}
            onClick={() => setSport(sportKey)}
            active={isActive}
            title={showHint ? 'No sharp line available for this sport right now' : undefined}
          >
            <span className="flex items-center gap-1.5">
              {sport.shortName}
              {showHint && <span className="h-1.5 w-1.5 rounded-full bg-warn" aria-hidden="true" />}
            </span>
          </Chip>
        );
      })}
    </div>
  );
}
