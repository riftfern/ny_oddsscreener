import { create } from 'zustand';
import type { SportKey, MarketType, OddsFilter, EventHorizon } from '@ny-sharp-edge/shared';
import { inSeasonSport, SPORTSBOOKS } from '@ny-sharp-edge/shared';

interface OddsStore {
  filter: OddsFilter;
  horizon: EventHorizon;
  setSport: (sport: SportKey) => void;
  setDate: (date: OddsFilter['date']) => void;
  setMarketType: (marketType: MarketType | 'all') => void;
  setHorizon: (horizon: EventHorizon) => void;
  toggleBook: (bookId: string) => void;
  resetFilters: () => void;
}

const defaultFilter: OddsFilter = {
  sport: inSeasonSport(),
  date: 'today',
  marketType: 'h2h',
  // Include Pinnacle so the fair-line column is visible by default.
  books: [...Object.values(SPORTSBOOKS), 'pinnacle'],
};

export const useOddsStore = create<OddsStore>((set) => ({
  filter: defaultFilter,
  horizon: 'soon',

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

  setHorizon: (horizon) => set({ horizon }),

  toggleBook: (bookId) =>
    set((state) => {
      const books = state.filter.books.includes(bookId)
        ? state.filter.books.filter((b) => b !== bookId)
        : [...state.filter.books, bookId];
      return { filter: { ...state.filter, books } };
    }),

  resetFilters: () => set({ filter: defaultFilter, horizon: 'soon' }),
}));
