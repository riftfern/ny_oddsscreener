import { useEffect, useRef, useState } from 'react';
import {
  getVenue,
  shopHref,
  calculatePayout,
  formatAmerican,
  formatPick,
  parlayAmerican,
  stakeReturn,
  totalsWindowHint,
  windowTwoWayNet,
  type BetSelection,
} from '@ny-sharp-edge/shared';
import { useBetslipStore, useBooksWithBets } from '../../stores/betslipStore';
import { useBankrollStore } from '@/stores/bankrollStore';
import { BetCard } from './BetCard';

function honestyForSlip(bets: BetSelection[]): string | null {
  const shapes = new Set(bets.map((b) => b.shape).filter(Boolean));
  if (shapes.has('teaser')) {
    return 'Singles at straight juice — not a teaser ticket. Price the tease at the shop.';
  }
  if (shapes.has('sgp') || shapes.has('round_robin')) {
    return 'Singles, not a parlay. Rebuild it at the shop.';
  }
  if (shapes.has('window')) {
    const books = new Set(bets.filter((b) => b.shape === 'window').map((b) => b.bookId));
    const unfilled = bets.some((b) => b.shape === 'window' && b.stake <= 0);
    if (books.size > 1 && unfilled) {
      return 'Opposite bets at two shops. Fill both tabs or it is not a window.';
    }
    return 'Opposite bets. If it lands in the window both cash. Vig is the tax.';
  }
  if (shapes.has('if_bet')) {
    return 'If-bet: second only if the first cashes. Not a parlay.';
  }
  if (shapes.has('reverse')) {
    return 'Reverse: both orders. Double the action. Only if your book has reverses.';
  }
  return null;
}

export function Betslip() {
  const isOpen = useBetslipStore((state) => state.isOpen);
  const bets = useBetslipStore((state) => state.bets);
  const activeTab = useBetslipStore((state) => state.activeTab);
  const closePanel = useBetslipStore((state) => state.closePanel);
  const setActiveTab = useBetslipStore((state) => state.setActiveTab);
  const clearBook = useBetslipStore((state) => state.clearBook);
  const clearStaked = useBetslipStore((state) => state.clearStaked);
  const clearAll = useBetslipStore((state) => state.clearAll);
  const retargetToShop = useBetslipStore((state) => state.retargetToShop);
  const openPanel = useBetslipStore((state) => state.openPanel);
  const balance = useBankrollStore((s) => s.balance);
  const logBet = useBankrollStore((s) => s.logBet);
  const [error, setError] = useState<string | null>(null);
  const [placed, setPlaced] = useState<string | null>(null);
  const [parlayPref, setParlayPref] = useState<'auto' | 'on' | 'off'>('auto');
  const prevCount = useRef(bets.length);
  useEffect(() => {
    if (bets.length > prevCount.current || bets.some((b) => b.hedgeOf)) {
      setPlaced(null);
      setError(null);
    }
    prevCount.current = bets.length;
  }, [bets]);

  const updateStake = useBetslipStore((s) => s.updateStake);
  const removeBet = useBetslipStore((s) => s.removeBet);
  const booksWithBets = useBooksWithBets();
  const teaserLegs = bets.every((b) => b.shape === 'teaser') && bets.length >= 2 ? bets : [];
  const windowLegs = bets.every((b) => b.shape === 'window') && bets.length >= 2 ? bets : [];
  const ifLegs = bets.every((b) => b.shape === 'if_bet') && bets.length >= 2 ? bets : [];
  const reverseLegs = bets.every((b) => b.shape === 'reverse') && bets.length >= 2 ? bets : [];
  const isTeaser = teaserLegs.length >= 2;
  const isWindow = windowLegs.length >= 2;
  const isIfBet = ifLegs.length >= 2;
  const isReverse = reverseLegs.length >= 2;
  const seqLegs = isIfBet ? ifLegs : reverseLegs;
  const isSeq = isIfBet || isReverse;
  const groupedTicket = isTeaser || isWindow || isSeq;
  const activeBets = groupedTicket ? bets : bets.filter((b) => b.bookId === activeTab);
  const specialShape = activeBets.some((b) =>
    b.shape === 'teaser' || b.shape === 'window' || b.shape === 'if_bet' || b.shape === 'reverse'
  );
  const canParlay =
    !groupedTicket &&
    !specialShape &&
    activeBets.length >= 2 &&
    new Set(activeBets.map((b) => b.bookId)).size === 1;
  const sgpTicket = canParlay && activeBets.every((b) => b.shape === 'sgp');
  const isParlay = canParlay && (parlayPref === 'on' || (parlayPref === 'auto' && sgpTicket));
  useEffect(() => {
    if (bets.length === 0) setParlayPref('auto');
  }, [bets.length]);
  const windowPrefill = useRef<string | null>(null);
  useEffect(() => {
    if (!isWindow) {
      windowPrefill.current = null;
      return;
    }
    const key = windowLegs.map((l) => l.id).join('+');
    if (windowPrefill.current === key) return;
    windowPrefill.current = key;
    if ((windowLegs[0]?.stake ?? 0) <= 0) {
      windowLegs.forEach((l) => updateStake(l.id, 10));
    }
  }, [isWindow, windowLegs, updateStake]);
  const stakedBets = activeBets.filter((b) => b.stake > 0);
  const groupStake = isTeaser
    ? teaserLegs[0]?.stake ?? 0
    : isWindow
      ? Math.max(...windowLegs.map((b) => b.stake), 0)
      : isSeq
        ? seqLegs[0]?.stake ?? 0
        : isParlay
          ? activeBets[0]?.stake ?? 0
          : stakedBets.reduce((sum, b) => sum + b.stake, 0);
  const totalStake = isTeaser || isIfBet || isParlay
    ? groupStake
    : isWindow
      ? groupStake * windowLegs.length
      : isReverse
        ? groupStake * 2
        : stakedBets.reduce((sum, b) => sum + b.stake, 0);
  const parlayPrice = isParlay ? parlayAmerican(activeBets.map((b) => b.odds)) : undefined;
  const totalPayout = stakedBets.reduce((sum, b) => sum + calculatePayout(b.stake, b.odds), 0);
  const href = activeTab ? shopHref(activeTab) : undefined;
  const honesty = honestyForSlip(bets);
  const hideCombinedPayout = groupedTicket || isParlay;
  const teaserShop = isTeaser ? getVenue(teaserLegs[0].bookId) : null;
  const seqShop = isSeq ? getVenue(seqLegs[0].bookId) : null;
  const windowHint = (() => {
    if (!isWindow) return null;
    const over = windowLegs.find((b) => /over/i.test(b.outcomeName));
    const under = windowLegs.find((b) => /under/i.test(b.outcomeName));
    if (over?.line !== undefined && under?.line !== undefined) {
      return totalsWindowHint(over.line, under.line);
    }
    const gap = windowLegs[0]?.windowGap;
    return gap ? `Both cash in the ${gap}-pt window. Vig is the tax.` : null;
  })();
  const windowMath =
    isWindow && windowLegs.length >= 2 && groupStake > 0
      ? windowTwoWayNet(groupStake, windowLegs[0].odds, windowLegs[1].odds)
      : null;

  const setGroupStake = (n: number) => {
    if (isTeaser) {
      updateStake(teaserLegs[0].id, n);
      teaserLegs.slice(1).forEach((l) => updateStake(l.id, 0));
      return;
    }
    if (isSeq) {
      updateStake(seqLegs[0].id, n);
      seqLegs.slice(1).forEach((l) => updateStake(l.id, 0));
      return;
    }
    if (isWindow) {
      windowLegs.forEach((l) => updateStake(l.id, n));
      return;
    }
    if (isParlay && activeBets[0]) {
      updateStake(activeBets[0].id, n);
      activeBets.slice(1).forEach((l) => updateStake(l.id, 0));
    }
  };

  const handleSimPlace = () => {
    setError(null);
    setPlaced(null);
    if (isWindow) {
      if (groupStake <= 0) {
        setError('Type a stake for each side.');
        return;
      }
      if (windowLegs.some((b) => b.stake <= 0)) {
        setError('Fill both shops or it is not a window.');
        return;
      }
      if (totalStake > balance) {
        setError(`Need $${totalStake.toFixed(0)} — add funds in More. This browser only.`);
        return;
      }
      for (const bet of windowLegs) {
        logBet({
          eventDescription: `${bet.event.awayTeam} @ ${bet.event.homeTeam}`,
          outcomeName: bet.outcomeName,
          marketType: bet.marketType,
          bookId: bet.bookId,
          odds: bet.odds,
          stake: bet.stake,
        });
      }
      windowLegs.forEach((b) => removeBet(b.id));
      openPanel();
      setPlaced(
        `Simulated $${totalStake.toFixed(0)} across ${windowLegs.length} shops. Not a real middle. Roll $${(balance - totalStake).toFixed(2)}.`
      );
      return;
    }
    if (isParlay && parlayPrice !== undefined) {
      if (groupStake <= 0) {
        setError('Type a stake first.');
        return;
      }
      if (groupStake > balance) {
        setError(`Need $${groupStake.toFixed(0)} — add funds in More. This browser only.`);
        return;
      }
      const shop = getVenue(activeBets[0].bookId);
      logBet({
        eventDescription: activeBets.map((l) => `${l.event.awayTeam} @ ${l.event.homeTeam}`).join(' // '),
        outcomeName: `${activeBets.length}-leg ${sgpTicket ? 'SGP' : 'parlay'}: ${activeBets
          .map((l) => formatPick(l.outcomeName, l.line, l.marketType))
          .join(' / ')}`,
        marketType: activeBets[0].marketType,
        bookId: activeBets[0].bookId,
        odds: parlayPrice,
        stake: groupStake,
      });
      activeBets.forEach((b) => removeBet(b.id));
      openPanel();
      setPlaced(
        `Simulated $${groupStake.toFixed(0)} ${sgpTicket ? 'SGP' : 'parlay'} at ${shop.shortName} (${formatAmerican(parlayPrice)}). Rebuild at the shop. Roll $${(balance - groupStake).toFixed(2)}.`
      );
      return;
    }
    if (isTeaser) {
      if (groupStake <= 0) {
        setError('Type a stake first.');
        return;
      }
      if (groupStake > balance) {
        setError(`Need $${groupStake.toFixed(0)} — add funds in More. This browser only.`);
        return;
      }
      const pts = teaserLegs[0].teasePoints ?? 6;
      logBet({
        eventDescription: teaserLegs.map((l) => `${l.event.awayTeam} @ ${l.event.homeTeam}`).join(' // '),
        outcomeName: `${teaserLegs.length}-leg ${pts}-pt tease: ${teaserLegs
          .map((l) => formatPick(l.outcomeName, l.line, l.marketType))
          .join(' / ')}`,
        marketType: 'spreads',
        bookId: teaserLegs[0].bookId,
        odds: 0,
        stake: groupStake,
      });
      teaserLegs.forEach((b) => removeBet(b.id));
      openPanel();
      setPlaced(
        `Simulated $${groupStake.toFixed(0)} tease at ${teaserShop?.shortName}. Juice is at the shop. Roll $${(balance - groupStake).toFixed(2)}.`
      );
      return;
    }
    if (isSeq) {
      if (groupStake <= 0) {
        setError('Type a stake first.');
        return;
      }
      const cost = totalStake;
      if (cost > balance) {
        setError(`Need $${cost.toFixed(0)} — add funds in More. This browser only.`);
        return;
      }
      const shop = seqShop;
      logBet({
        eventDescription: seqLegs.map((l) => `${l.event.awayTeam} @ ${l.event.homeTeam}`).join(' // '),
        outcomeName: isIfBet
          ? `If ${formatPick(seqLegs[0].outcomeName, seqLegs[0].line, seqLegs[0].marketType)} then ${formatPick(seqLegs[1].outcomeName, seqLegs[1].line, seqLegs[1].marketType)}`
          : `Reverse ${seqLegs.map((l) => formatPick(l.outcomeName, l.line, l.marketType)).join(' / ')}`,
        marketType: seqLegs[0].marketType,
        bookId: seqLegs[0].bookId,
        odds: seqLegs[0].odds,
        stake: cost,
      });
      seqLegs.forEach((b) => removeBet(b.id));
      openPanel();
      setPlaced(
        isIfBet
          ? `Simulated $${cost.toFixed(0)} if-bet at ${shop?.shortName}. Second only if the first cashes. Roll $${(balance - cost).toFixed(2)}.`
          : `Simulated $${cost.toFixed(0)} reverse (both orders) at ${shop?.shortName}. Roll $${(balance - cost).toFixed(2)}.`
      );
      return;
    }
    if (!activeTab) return;
    if (totalStake <= 0) {
      setError('Type a stake first.');
      return;
    }
    if (totalStake > balance) {
      setError(`Need $${totalStake.toFixed(0)} — add funds in More. This browser only.`);
      return;
    }
    const shop = getVenue(activeTab).shortName;
    for (const bet of stakedBets) {
      logBet({
        eventDescription: `${bet.event.awayTeam} @ ${bet.event.homeTeam}`,
        outcomeName: bet.outcomeName,
        marketType: bet.marketType,
        bookId: bet.bookId,
        odds: bet.odds,
        stake: bet.stake,
      });
    }
    clearStaked(activeTab);
    setPlaced(
      `Simulated $${totalStake.toFixed(0)} at ${shop}. Not a real ticket. Roll is now $${(balance - totalStake).toFixed(2)}.`
    );
  };

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 bg-ink/40 z-40 md:hidden" onClick={closePanel} />
      )}

      <div
        data-slip={isOpen ? 'open' : 'closed'}
        className={`
          fixed top-0 right-0 h-full w-full md:w-[380px] z-50
          glass md:rounded-l-3xl
          transform transition-transform duration-200 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          flex flex-col
        `}
      >
        <div className="flex items-center justify-between px-4 h-12 border-b-2 border-line">
          <h2 className="font-display font-semibold uppercase tracking-[0.18em] text-[13px] text-ink">
            Slip
          </h2>
          <div className="flex items-center gap-2">
            {bets.length > 0 && (
              <button
                type="button"
                onClick={clearAll}
                className="text-[11px] uppercase tracking-[0.14em] text-ink-dim hover:text-bad"
              >
                Clear
              </button>
            )}
            <button type="button" onClick={closePanel} className="p-2 text-ink-dim hover:text-ink">
              ✕
            </button>
          </div>
        </div>

        {booksWithBets.length > 0 && !groupedTicket && (
          <div className="flex overflow-x-auto border-b-2 border-line px-2 gap-1 py-2">
            {booksWithBets.map((bookId) => {
              const book = getVenue(bookId);
              const count = bets.filter((b) => b.bookId === bookId).length;
              const isActive = activeTab === bookId;
              return (
                <button
                  key={bookId}
                  type="button"
                  onClick={() => setActiveTab(bookId)}
                  className={`chip ${isActive ? 'chip-on' : ''}`}
                >
                  {book.shortName} {count}
                </button>
              );
            })}
          </div>
        )}
        {booksWithBets.length > 1 && !groupedTicket && (
          <div className="px-4 pt-2 space-y-2">
            <p className="font-mono text-[11px] text-ink-dim">
              Can&apos;t parlay across {booksWithBets.map((id) => getVenue(id).shortName).join(' + ')}.
              Rebuild at one shop, or open them separately.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {booksWithBets.map((id) => (
                <button
                  key={id}
                  type="button"
                  className="chip chip-on"
                  onClick={() => {
                    retargetToShop(id);
                    setParlayPref('on');
                  }}
                >
                  Build at {getVenue(id).shortName}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {bets.length === 0 ? (
            <div className="text-center text-ink-dim py-12 space-y-3">
              {placed && <p className="font-mono text-[13px] text-lichen px-2">{placed}</p>}
              {error && <p className="font-mono text-[13px] text-bad px-2">{error}</p>}
              <p className="uppercase tracking-[0.18em] text-[11px]">Empty</p>
              <p className="font-mono text-[11px]">Tap a price on Odds to add it. We do not take the bet.</p>
              <p className="font-mono text-[11px]">Roll ${balance.toFixed(2)} in this browser</p>
            </div>
          ) : (
            <div className="space-y-2">
              {honesty && !groupedTicket && !isParlay && (
                <p className="font-mono text-[12px] text-warn leading-snug">{honesty}</p>
              )}
              {placed && <p className="font-mono text-[12px] text-lichen">{placed}</p>}
              {canParlay && (
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    className={`chip ${!isParlay ? 'chip-on' : ''}`}
                    onClick={() => setParlayPref('off')}
                  >
                    Singles
                  </button>
                  <button
                    type="button"
                    className={`chip ${isParlay ? 'chip-on' : ''}`}
                    onClick={() => setParlayPref('on')}
                  >
                    {sgpTicket ? 'SGP' : 'Parlay'}
                  </button>
                </div>
              )}
              {isParlay && parlayPrice !== undefined && (
                <p className="font-mono text-[12px] text-lichen leading-snug">
                  {activeBets.length}-leg {sgpTicket ? 'same-game parlay' : 'parlay'}{' '}
                  {formatAmerican(parlayPrice)}. Rebuild at the shop — juice stacks.
                </p>
              )}
              {(isTeaser || isWindow || isSeq) && (
                <p className="font-mono text-[12px] text-lichen leading-snug">
                  {isTeaser
                    ? `One stake. ${teaserLegs.length}-leg ${teaserLegs[0].teasePoints ?? 6}-pt tease — juice is on the ${teaserShop?.shortName} board.`
                    : isIfBet
                      ? `One stake. Second only if the first cashes — not a parlay. Price it on the ${seqShop?.shortName} if-bet board.`
                      : isReverse
                        ? `One stake per order (×2). Both directions. Only if ${seqShop?.shortName} has reverses.`
                        : windowHint}
                </p>
              )}
              {bets[0]?.hedgeOf && (
                <p className="font-mono text-[12px] text-ink-dim">Hedge of {bets[0].hedgeOf}</p>
              )}
              {activeBets.map((bet) => (
                <BetCard key={bet.id} bet={bet} hideStake={isTeaser || isWindow || isParlay || isSeq} />
              ))}
              {(isTeaser || isWindow || isParlay || isSeq) && (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-dim font-mono">$</span>
                  <input
                    type="number"
                    min="0"
                    step="5"
                    value={groupStake || ''}
                    onChange={(e) => setGroupStake(parseFloat(e.target.value) || 0)}
                    placeholder={
                      isWindow
                        ? 'each side'
                        : isParlay
                          ? 'parlay stake'
                          : isIfBet
                            ? 'if stake'
                            : isReverse
                              ? 'each order'
                              : 'tease stake'
                    }
                    className="w-full bg-bg-2 border border-line px-3 py-2 pl-7 text-ink font-mono placeholder-ink-dim"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {activeTab && activeBets.length > 0 && (
          <div className="p-4 border-t-2 border-line space-y-3">
            <p className="font-mono text-[11px] text-ink-dim">Roll ${balance.toFixed(2)} in this browser</p>
            <div className="flex justify-between text-[11px] uppercase tracking-[0.14em]">
              <span className="text-ink-dim">Stake</span>
              <span className="text-ink font-mono">${totalStake.toFixed(2)}</span>
            </div>
            {isParlay && parlayPrice !== undefined && groupStake > 0 && (
              <div className="flex justify-between text-[11px] uppercase tracking-[0.14em]">
                <span className="text-ink-dim">If it cashes</span>
                <span className="text-lichen font-mono">${stakeReturn(groupStake, parlayPrice).toFixed(2)}</span>
              </div>
            )}
            {windowMath && (
              <>
                <div className="flex justify-between text-[11px] uppercase tracking-[0.14em]">
                  <span className="text-ink-dim">Both cash</span>
                  <span className="text-lichen font-mono">${windowMath.both.toFixed(0)}</span>
                </div>
                <div className="flex justify-between text-[11px] uppercase tracking-[0.14em]">
                  <span className="text-ink-dim">One side (worst)</span>
                  <span className="font-mono text-warn">${windowMath.worstOne.toFixed(0)}</span>
                </div>
              </>
            )}
            {!hideCombinedPayout && !isParlay && (
              <div className="flex justify-between text-[11px] uppercase tracking-[0.14em]">
                <span className="text-ink-dim">If it cashes</span>
                <span className="text-lichen font-mono">${totalPayout.toFixed(2)}</span>
              </div>
            )}
            {error && <p className="font-mono text-[12px] text-bad">{error}</p>}
            {placed && <p className="font-mono text-[12px] text-lichen">{placed}</p>}
            <button
              type="button"
              onClick={handleSimPlace}
              disabled={totalStake <= 0}
              className="btn btn-primary w-full disabled:opacity-50"
            >
              {totalStake <= 0 ? 'Type a stake' : `Sim place $${totalStake.toFixed(0)}`}
            </button>
            {isWindow ? (
              <div className="grid gap-2">
                {[...new Set(windowLegs.map((l) => l.bookId))].map((id) => {
                  const link = shopHref(id);
                  return link ? (
                    <a
                      key={id}
                      href={link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-secondary w-full"
                    >
                      Open {getVenue(id).shortName}
                    </a>
                  ) : null;
                })}
              </div>
            ) : href ? (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary w-full"
              >
                Open {isTeaser
                  ? `${teaserShop?.shortName} teaser`
                  : isIfBet
                    ? `${seqShop?.shortName} if-bet`
                    : isReverse
                      ? `${seqShop?.shortName} reverse`
                      : isParlay
                        ? `${getVenue(activeTab!).shortName} ${sgpTicket ? 'SGP' : 'parlay'}`
                        : getVenue(activeTab!).shortName}
              </a>
            ) : (
              <p className="font-mono text-[11px] text-ink-dim text-center">No deep link for this shop</p>
            )}
            <button
              type="button"
              onClick={() => clearBook(activeTab)}
              className="w-full text-[11px] uppercase tracking-[0.14em] text-ink-dim"
            >
              Clear {getVenue(activeTab).shortName}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
