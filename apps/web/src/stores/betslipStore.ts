import { create } from 'zustand';
import type { BetSelection, SportsbookId, Event, MarketType, AmericanOdds } from '@ny-sharp-edge/shared';

interface BetslipStore {
  bets: BetSelection[];
  isOpen: boolean;
  activeTab: SportsbookId | null;

  // Actions
  addBet: (bet: {
    eventId: string;
    event: Event;
    marketType: MarketType;
    outcomeName: string;
    bookId: SportsbookId;
    odds: AmericanOdds;
    line?: number;
  }) => void;
  removeBet: (betId: string) => void;
  updateStake: (betId: string, stake: number) => void;
  clearBook: (bookId: SportsbookId) => void;
  clearAll: () => void;
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  setActiveTab: (bookId: SportsbookId) => void;
}

// Helper to generate unique IDs
const generateId = () => `bet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Helper to check if bet already exists
const betExists = (bets: BetSelection[], eventId: string, bookId: SportsbookId, outcomeName: string) =>
  bets.some((b) => b.eventId === eventId && b.bookId === bookId && b.outcomeName === outcomeName);

export const useBetslipStore = create<BetslipStore>((set, get) => ({
  bets: [],
  isOpen: false,
  activeTab: null,

  addBet: (betData) => {
    const { bets } = get();

    // Don't add duplicate bets
    if (betExists(bets, betData.eventId, betData.bookId, betData.outcomeName)) {
      // Open panel to show existing bet
      set({ isOpen: true });
      return;
    }

    const newBet: BetSelection = {
      ...betData,
      id: generateId(),
      stake: 0,
      addedAt: new Date().toISOString(),
    };

    set((state) => ({
      bets: [...state.bets, newBet],
      isOpen: true,
      activeTab: betData.bookId,
    }));
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

  clearBook: (bookId) =>
    set((state) => {
      const newBets = state.bets.filter((b) => b.bookId !== bookId);
      const booksWithBets = [...new Set(newBets.map((b) => b.bookId))];
      return {
        bets: newBets,
        activeTab: booksWithBets[0] || null,
        isOpen: newBets.length > 0 ? state.isOpen : false,
      };
    }),

  clearAll: () => set({ bets: [], activeTab: null, isOpen: false }),

  togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),

  openPanel: () => set({ isOpen: true }),

  closePanel: () => set({ isOpen: false }),

  setActiveTab: (bookId) => set({ activeTab: bookId }),
}));

// Selector hooks for common computations
export const useBetsByBook = (bookId: SportsbookId) =>
  useBetslipStore((state) => state.bets.filter((b) => b.bookId === bookId));

export const useBooksWithBets = () =>
  useBetslipStore((state) => [...new Set(state.bets.map((b) => b.bookId))]);

export const useTotalBets = () =>
  useBetslipStore((state) => state.bets.length);

export const useBetslipOpen = () =>
  useBetslipStore((state) => state.isOpen);
