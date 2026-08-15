import { getVenue } from '@ny-sharp-edge/shared';
import { useBetslipStore, useBooksWithBets } from '../../stores/betslipStore';
import { BetCard } from './BetCard';
import { calculatePayout } from '@ny-sharp-edge/shared';

export function Betslip() {
  const isOpen = useBetslipStore((state) => state.isOpen);
  const bets = useBetslipStore((state) => state.bets);
  const activeTab = useBetslipStore((state) => state.activeTab);
  const closePanel = useBetslipStore((state) => state.closePanel);
  const setActiveTab = useBetslipStore((state) => state.setActiveTab);
  const clearBook = useBetslipStore((state) => state.clearBook);
  const clearAll = useBetslipStore((state) => state.clearAll);

  const booksWithBets = useBooksWithBets();

  const activeBets = bets.filter((b) => b.bookId === activeTab);

  const totalStake = activeBets.reduce((sum, b) => sum + b.stake, 0);
  const totalPayout = activeBets.reduce((sum, b) => sum + calculatePayout(b.stake, b.odds), 0);

  const handlePlaceBet = () => {
    if (!activeTab) return;
    const book = getVenue(activeTab);
    if (book.deepLink) window.open(book.deepLink, '_blank');
  };

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-bg/80 z-40 md:hidden"
          onClick={closePanel}
        />
      )}

      <div
        className={`
          fixed top-0 right-0 h-full w-full md:w-[380px] z-50
          bg-bg-2 border-l border-line
          transform transition-transform duration-200 ease-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          flex flex-col
        `}
      >
        <div className="flex items-center justify-between px-4 h-12 border-b border-line">
          <h2 className="font-display font-semibold uppercase tracking-[0.18em] text-[13px] text-ink">
            Betslip
          </h2>
          <div className="flex items-center gap-2">
            {bets.length > 0 && (
              <button
                onClick={clearAll}
                className="text-[11px] uppercase tracking-[0.14em] text-ink-dim hover:text-bad"
              >
                Clear All
              </button>
            )}
            <button
              onClick={closePanel}
              className="p-2 hover:bg-bg text-ink-dim hover:text-ink"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {booksWithBets.length > 0 && (
          <div className="flex overflow-x-auto border-b border-line px-2 gap-1 py-2">
            {booksWithBets.map((bookId) => {
              const book = getVenue(bookId);
              const count = bets.filter((b) => b.bookId === bookId).length;
              const isActive = activeTab === bookId;

              return (
                <button
                  key={bookId}
                  onClick={() => setActiveTab(bookId)}
                  className={`
                    flex items-center gap-2 px-3 py-2 whitespace-nowrap
                    text-[11px] uppercase tracking-[0.14em] font-medium border
                    ${isActive ? 'bg-moss text-ink border-moss' : 'bg-transparent text-ink-dim border-line hover:text-ink'}
                  `}
                >
                  <span className="font-mono">{book.shortName}</span>
                  <span className="font-mono text-[11px]">
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {bets.length === 0 ? (
            <div className="text-center text-ink-dim py-12">
              <p className="uppercase tracking-[0.18em] text-[11px] mb-2">Your betslip is empty</p>
              <p className="font-mono text-[11px]">Click on any odds to add a bet</p>
            </div>
          ) : activeBets.length === 0 ? (
            <div className="text-center text-ink-dim py-12">
              <p className="uppercase tracking-[0.18em] text-[11px]">Select a sportsbook tab</p>
            </div>
          ) : (
            <div className="space-y-2">
              {activeBets.map((bet) => (
                <BetCard key={bet.id} bet={bet} />
              ))}
            </div>
          )}
        </div>

        {activeTab && activeBets.length > 0 && (
          <div className="p-4 border-t border-line bg-bg-2">
            <button
              onClick={() => clearBook(activeTab)}
              className="text-[11px] uppercase tracking-[0.14em] text-ink-dim hover:text-bad mb-3"
            >
              Clear {getVenue(activeTab).name} bets
            </button>

            <div className="flex justify-between text-[11px] uppercase tracking-[0.14em] mb-2">
              <span className="text-ink-dim">Total Stake</span>
              <span className="text-ink font-mono">${totalStake.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-[11px] uppercase tracking-[0.14em] mb-4">
              <span className="text-ink-dim">Potential Payout</span>
              <span className="text-lichen font-mono">${totalPayout.toFixed(2)}</span>
            </div>

            <button
              onClick={handlePlaceBet}
              disabled={totalStake === 0 || !getVenue(activeTab).deepLink}
              className={`
                w-full py-3 font-display font-semibold uppercase tracking-[0.14em] text-[11px]
                border
                ${totalStake > 0 && getVenue(activeTab).deepLink
                  ? 'bg-moss hover:bg-moss-2 text-ink border-moss'
                  : 'bg-transparent text-ink-dim border-line cursor-not-allowed'
                }
              `}
            >
              Place Bets on {getVenue(activeTab).name}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
