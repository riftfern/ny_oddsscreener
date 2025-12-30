import { create } from 'zustand';
import type { SportKey, MarketType, SportsbookId, OddsFilter } from '@ny-sharp-edge/shared';
import { SPORTS, SPORTSBOOKS } from '@ny-sharp-edge/shared';

interface OddsStore {
  filter: OddsFilter;
  setSport: (sport: SportKey) => void;
  setDate: (date: OddsFilter['date']) => void;
  setMarketType: (marketType: MarketType | 'all') => void;
  toggleBook: (bookId: SportsbookId) => void;
  resetFilters: () => void;
}

const defaultFilter: OddsFilter = {
  sport: SPORTS.NFL,
  date: 'today',
  marketType: 'all',
  books: Object.values(SPORTSBOOKS),
};

export const useOddsStore = create<OddsStore>((set) => ({
  filter: defaultFilter,

  setSport: (sport) =>
    set((state) => ({
      filter: { ...state.filter, sport },
    })),

  setDate: (date) =>
    set((state) => ({
      filter: { ...state.filter, date },
    })),

  setMarketType: (marketType) =>
    set((state) => ({
      filter: { ...state.filter, marketType },
    })),

  toggleBook: (bookId) =>
    set((state) => {
      const books = state.filter.books.includes(bookId)
        ? state.filter.books.filter((b) => b !== bookId)
        : [...state.filter.books, bookId];
      return { filter: { ...state.filter, books } };
    }),

  resetFilters: () => set({ filter: defaultFilter }),
}));
