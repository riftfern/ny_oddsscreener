import { SPORTSBOOK_INFO } from '@ny-sharp-edge/shared';
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

  // Get bets for active tab
  const activeBets = bets.filter((b) => b.bookId === activeTab);

  // Calculate totals for active tab
  const totalStake = activeBets.reduce((sum, b) => sum + b.stake, 0);
  const totalPayout = activeBets.reduce((sum, b) => sum + calculatePayout(b.stake, b.odds), 0);

  // Handle place bet - open sportsbook
  const handlePlaceBet = () => {
    if (!activeTab) return;
    const book = SPORTSBOOK_INFO[activeTab];
    window.open(book.deepLink, '_blank');
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={closePanel}
        />
      )}

      {/* Panel */}
      <div
        className={`
          fixed top-0 right-0 h-full w-full md:w-[380px] z-50
          bg-gray-800 border-l border-gray-700
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
          flex flex-col
        `}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700">
          <h2 className="text-xl font-bold text-white">Betslip</h2>
          <div className="flex items-center gap-2">
            {bets.length > 0 && (
              <button
                onClick={clearAll}
                className="text-sm text-gray-400 hover:text-red-400 transition-colors"
              >
                Clear All
              </button>
            )}
            <button
              onClick={closePanel}
              className="p-2 hover:bg-gray-700 rounded transition-colors"
            >
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tabs */}
        {booksWithBets.length > 0 && (
          <div className="flex overflow-x-auto border-b border-gray-700 px-2 gap-1 py-2">
            {booksWithBets.map((bookId) => {
              const book = SPORTSBOOK_INFO[bookId];
              const count = bets.filter((b) => b.bookId === bookId).length;
              const isActive = activeTab === bookId;

              return (
                <button
                  key={bookId}
                  onClick={() => setActiveTab(bookId)}
                  className={`
                    flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap
                    transition-colors text-sm font-medium
                    ${isActive ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}
                  `}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: book.color }}
                  />
                  {book.shortName}
                  <span className={`
                    px-1.5 py-0.5 rounded text-xs
                    ${isActive ? 'bg-blue-500' : 'bg-gray-600'}
                  `}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {bets.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-lg mb-2">Your betslip is empty</p>
              <p className="text-sm">Click on any odds to add a bet</p>
            </div>
          ) : activeBets.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <p>Select a sportsbook tab</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activeBets.map((bet) => (
                <BetCard key={bet.id} bet={bet} />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab && activeBets.length > 0 && (
          <div className="p-4 border-t border-gray-700 bg-gray-800">
            {/* Clear this book */}
            <button
              onClick={() => clearBook(activeTab)}
              className="text-sm text-gray-400 hover:text-red-400 mb-3 transition-colors"
            >
              Clear {SPORTSBOOK_INFO[activeTab].name} bets
            </button>

            {/* Totals */}
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-400">Total Stake</span>
              <span className="text-white font-medium">${totalStake.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm mb-4">
              <span className="text-gray-400">Potential Payout</span>
              <span className="text-green-400 font-bold">${totalPayout.toFixed(2)}</span>
            </div>

            {/* Place bet button */}
            <button
              onClick={handlePlaceBet}
              disabled={totalStake === 0}
              className={`
                w-full py-3 rounded-lg font-bold text-white
                transition-colors flex items-center justify-center gap-2
                ${totalStake > 0
                  ? 'bg-green-600 hover:bg-green-700'
                  : 'bg-gray-600 cursor-not-allowed'
                }
              `}
            >
              <span>Place Bets on {SPORTSBOOK_INFO[activeTab].name}</span>
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </>
  );
}
