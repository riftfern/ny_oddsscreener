import { inSeasonSport, SPORT_INFO, SPORTS } from '@ny-sharp-edge/shared';
import { useOddsStore } from '@/stores/oddsStore';

export default function TonightElsewhere() {
  const sport = useOddsStore((s) => s.filter.sport);
  const setSport = useOddsStore((s) => s.setSport);
  const inSeason = inSeasonSport();
  if (sport === inSeason) return null;
  if (inSeason !== SPORTS.MLB && inSeason !== SPORTS.NFL) return null;
  return (
    <button
      type="button"
      onClick={() => setSport(inSeason)}
      className="mt-2 font-mono text-[12px] text-lichen underline underline-offset-2"
    >
      Tonight is on {SPORT_INFO[inSeason].shortName} →
    </button>
  );
}
