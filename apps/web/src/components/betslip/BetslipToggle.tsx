import { useBetslipStore, useTotalBets } from '../../stores/betslipStore';

export function BetslipToggle() {
  const togglePanel = useBetslipStore((state) => state.togglePanel);
  const isOpen = useBetslipStore((state) => state.isOpen);
  const totalBets = useTotalBets();

  if (totalBets === 0) return null;

  return (
    <button
      onClick={togglePanel}
      className={`
        fixed bottom-6 right-6 z-40
        flex items-center gap-2 px-4 py-3
        bg-blue-600 hover:bg-blue-700
        text-white font-semibold
        rounded-full shadow-lg
        transition-all duration-200
        ${isOpen ? 'translate-x-[-340px] md:translate-x-[-340px]' : ''}
      `}
    >
      <svg
        className="w-5 h-5"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
        />
      </svg>
      <span>Betslip</span>
      <span className="flex items-center justify-center w-6 h-6 bg-green-500 rounded-full text-sm">
        {totalBets}
      </span>
    </button>
  );
}
