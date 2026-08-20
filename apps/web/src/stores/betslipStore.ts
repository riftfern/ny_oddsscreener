import { create } from 'zustand';
import { useShallow } from 'zustand/react/shallow';
import {
  priceAtShop,
  type BetSelection,
  type Event,
  type MarketType,
  type AmericanOdds,
  type SlipShape,
} from '@ny-sharp-edge/shared';

interface BetslipStore {
  bets: BetSelection[];
  isOpen: boolean;
  activeTab: string | null;

  // Actions
  addBet: (bet: {
    eventId: string;
    event: Event;
    marketType: MarketType;
    outcomeName: string;
    bookId: string;
    odds: AmericanOdds;
    line?: number;
    shape?: SlipShape;
    shapeId?: string;
    hideOdds?: boolean;
    sequence?: 'if' | 'then';
    teasePoints?: number;
    windowGap?: number;
    hedgeOf?: string;
  }) => void;
  removeBet: (betId: string) => void;
  updateStake: (betId: string, stake: number) => void;
  clearBook: (bookId: string, opts?: { keepOpen?: boolean }) => void;
  /** Remove only rows on this book that have a stake. Leaves the rest. */
  clearStaked: (bookId: string) => void;
  clearAll: () => void;
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  setActiveTab: (bookId: string) => void;
  /** Rebuild every leg at one shop so a parlay/tease is possible. Drops legs that shop does not have. */
  retargetToShop: (bookId: string) => void;
}

// Helper to generate unique IDs
const generateId = () => `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper to check if bet already exists
const betExists = (
  bets: BetSelection[],
  eventId: string,
  bookId: string,
  outcomeName: string,
  line?: number
) =>
  bets.some(
    (b) =>
      b.eventId === eventId &&
      b.bookId === bookId &&
      b.outcomeName === outcomeName &&
      b.line === line
  );

export const useBetslipStore = create<BetslipStore>((set) => ({
  bets: [],
  isOpen: false,
  activeTab: null,

  addBet: (betData) => {
    set((state) => {
      // Atomic duplicate check inside the updater to prevent
      // React 18 StrictMode double-mount race conditions
      if (betExists(state.bets, betData.eventId, betData.bookId, betData.outcomeName, betData.line)) {
        return { isOpen: true };
      }

      const newBet: BetSelection = {
        ...betData,
        id: generateId(),
        stake: 0,
        addedAt: new Date().toISOString(),
      };

      return {
        bets: [...state.bets, newBet],
        isOpen: true,
        activeTab: betData.bookId,
      };
    });
  },

  removeBet: (betId) =>
    set((state) => {
      const newBets = state.bets.filter((b) => b.id !== betId);
      // If no bets left for active tab, switch to first available
      const booksWithBets = [...new Set(newBets.map((b) => b.bookId))];
      const newActiveTab = booksWithBets.includes(state.activeTab!)
        ? state.activeTab
        : booksWithBets[0] || null;

      return {
        bets: newBets,
        activeTab: newActiveTab,
        isOpen: newBets.length > 0 ? state.isOpen : false,
      };
    }),

  updateStake: (betId, stake) =>
    set((state) => ({
      bets: state.bets.map((b) => (b.id === betId ? { ...b, stake } : b)),
    })),

  clearBook: (bookId, opts) =>
    set((state) => {
      const newBets = state.bets.filter((b) => b.bookId !== bookId);
      const booksWithBets = [...new Set(newBets.map((b) => b.bookId))];
      return {
        bets: newBets,
        activeTab: booksWithBets[0] || null,
        isOpen: opts?.keepOpen ? true : newBets.length > 0 ? state.isOpen : false,
      };
    }),

  clearStaked: (bookId) =>
    set((state) => {
      const newBets = state.bets.filter((b) => b.bookId !== bookId || b.stake <= 0);
      const booksWithBets = [...new Set(newBets.map((b) => b.bookId))];
      const stillHere = newBets.some((b) => b.bookId === bookId);
      return {
        bets: newBets,
        activeTab: stillHere ? bookId : booksWithBets[0] || null,
        isOpen: newBets.length > 0 || Boolean(state.isOpen),
      };
    }),

  clearAll: () => set({ bets: [], activeTab: null, isOpen: false }),

  togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),

  openPanel: () => set({ isOpen: true }),

  closePanel: () => set({ isOpen: false }),

  setActiveTab: (bookId) => set({ activeTab: bookId }),

  retargetToShop: (bookId) =>
    set((state) => {
      const next: BetSelection[] = [];
      for (const bet of state.bets) {
        if (bet.bookId === bookId) {
          next.push(bet);
          continue;
        }
        const priced = priceAtShop(bet.event, bet.marketType, bet.outcomeName, bookId, bet.line);
        if (!priced) continue;
        if (betExists(next, bet.eventId, bookId, bet.outcomeName, priced.line ?? bet.line)) continue;
        next.push({
          ...bet,
          bookId,
          odds: priced.odds,
          line: priced.line ?? bet.line,
        });
      }
      return {
        bets: next,
        activeTab: next.length > 0 ? bookId : null,
        isOpen: true,
      };
    }),
}));

// Selector hooks for common computations
export const useBetsByBook = (bookId: string) =>
  useBetslipStore(useShallow((state) => state.bets.filter((b) => b.bookId === bookId)));

export const useBooksWithBets = () =>
  useBetslipStore(useShallow((state) => [...new Set(state.bets.map((b) => b.bookId))]));

export const useTotalBets = () =>
  useBetslipStore((state) => state.bets.length);

export const useBetslipOpen = () =>
  useBetslipStore((state) => state.isOpen);
