import { SPORT_INFO, type SportKey } from '@ny-sharp-edge/shared';
import { useOddsStore } from '@/stores/oddsStore';

const sports: SportKey[] = [
  'americanfootball_nfl',
  'basketball_nba',
  'baseball_mlb',
  'icehockey_nhl',
];

export default function SportSelector() {
  const { filter, setSport } = useOddsStore();

  return (
    <div className="flex space-x-2">
      {sports.map((sportKey) => {
        const sport = SPORT_INFO[sportKey];
        const isActive = filter.sport === sportKey;

        return (
          <button
            key={sportKey}
            onClick={() => setSport(sportKey)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
            }`}
          >
            {sport.shortName}
          </button>
        );
      })}
    </div>
  );
}
