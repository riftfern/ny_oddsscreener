import type { Event } from '@ny-sharp-edge/shared';
import {
  bestPlaceableOdds,
  formatAmerican,
  getVenue,
  hedgeCoverLine,
  hedgeNets,
  isSeasonTicket,
  isSteamrollerHedge,
  shopHref,
} from '@ny-sharp-edge/shared';
import { usePositionStore } from '@/stores/positionStore';
import { useBetslipStore } from '@/stores/betslipStore';

export default function HedgeStrip({
  events,
  shopIds,
}: {
  events: Event[];
  shopIds?: string[] | null;
}) {
  const positions = usePositionStore((s) => s.positions);
  const addBet = useBetslipStore((s) => s.addBet);
  const clearAll = useBetslipStore((s) => s.clearAll);
  if (positions.length === 0) return null;

  const futures = positions.filter((pos) => isSeasonTicket(pos));
  const games = positions.filter((pos) => !isSeasonTicket(pos));

  const rows = games.flatMap((pos) => {
    const team = pos.team.toLowerCase();
    const ev = events.find(
      (e) => e.homeTeam.toLowerCase().includes(team) || e.awayTeam.toLowerCase().includes(team)
    );
    if (!ev) return [];
    const opp = ev.homeTeam.toLowerCase().includes(team) ? ev.awayTeam : ev.homeTeam;
    const h2h = ev.markets.find((m) => m.type === 'h2h');
    const outcome = h2h?.outcomes.find((o) => o.name === opp);
    const best = outcome ? bestPlaceableOdds(outcome.bookOdds, shopIds) : undefined;
    if (!best || !outcome) return [];
    const cover = hedgeCoverLine({ stake: pos.stake, odds: pos.odds, hedgeOdds: best.odds });
    const nets = hedgeNets(pos.stake, cover);
    return [{ pos, ev, opp, best, cover, nets }];
  });

  const unmatchedFutures = futures.filter((pos) => {
    const team = pos.team.toLowerCase();
    return events.some(
      (e) => e.homeTeam.toLowerCase().includes(team) || e.awayTeam.toLowerCase().includes(team)
    );
  });

  if (rows.length === 0 && unmatchedFutures.length === 0) return null;

  return (
    <div className="glass rounded-2xl p-3 space-y-2">
      <p className="label">Hedge these</p>
      {unmatchedFutures.map((pos) => (
        <p key={pos.id} className="font-mono text-[12px] text-ink-dim">
          {pos.team} {formatAmerican(pos.odds)} is saved as a season ticket. We do not offer a
          week-1 moneyline as a Super Bowl hedge.
        </p>
      ))}
      {rows.map(({ pos, ev, opp, best, cover, nets }) => {
        const href = shopHref(best.bookId);
        const steam = isSteamrollerHedge(best.odds);
        return (
          <div key={pos.id} className="space-y-2">
            {steam ? (
              <p className="font-mono text-[12px] text-ink-dim min-w-0">
                Opponent {opp} is {getVenue(best.bookId).shortName} {formatAmerican(best.odds)}.
                Not a cover we will suggest.
              </p>
            ) : (
              <>
                <p className="font-mono text-[12px] text-ink min-w-0">
                  To cover your ${pos.stake.toFixed(0)} {pos.team}, bet $
                  {cover.hedgeStake.toFixed(0)} {opp} at {getVenue(best.bookId).shortName}{' '}
                  {formatAmerican(best.odds)}. If {pos.team.split(' ').pop()} win you&apos;re at ~$
                  {nets.ifOriginalWinsNet.toFixed(0)}; if {opp.split(' ').pop()} win you get ~$
                  {nets.ifHedgeWinsNet.toFixed(0)} back.
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    className="chip chip-on"
                    onClick={() => {
                      clearAll();
                      addBet({
                        eventId: ev.id,
                        event: ev,
                        marketType: 'h2h',
                        outcomeName: opp,
                        bookId: best.bookId,
                        odds: best.odds,
                        hedgeOf: `${pos.team} ${formatAmerican(pos.odds)} / $${pos.stake}`,
                      });
                    }}
                  >
                    Add hedge
                  </button>
                  {href && (
                    <a href={href} target="_blank" rel="noopener noreferrer" className="chip">
                      Open
                    </a>
                  )}
                </div>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
