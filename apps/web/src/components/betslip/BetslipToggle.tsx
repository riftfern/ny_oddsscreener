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
        bg-moss hover:bg-moss-2
        text-ink font-display font-semibold uppercase tracking-[0.14em] text-[11px]
        border border-moss
        ${isOpen ? 'translate-x-[-340px] md:translate-x-[-340px]' : ''}
      `}
    >
      <span>Betslip</span>
      <span className="flex items-center justify-center min-w-[1.25rem] h-5 px-1 bg-bg text-lichen font-mono text-[11px] border border-line">
        {totalBets}
      </span>
    </button>
  );
}
