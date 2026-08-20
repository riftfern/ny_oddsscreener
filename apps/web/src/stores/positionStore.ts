import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { MarketType } from '@ny-sharp-edge/shared';

export interface SavedPosition {
  id: string;
  team: string;
  odds: number;
  stake: number;
  bookId: string;
  note: string;
  createdAt: string;
  eventId?: string;
  marketType?: MarketType;
  kind?: 'game' | 'future';
}

interface PositionStore {
  positions: SavedPosition[];
  addPosition: (p: Omit<SavedPosition, 'id' | 'createdAt'>) => void;
  removePosition: (id: string) => void;
}

export const usePositionStore = create<PositionStore>()(
  persist(
    (set) => ({
      positions: [],
      addPosition: (p) =>
        set((state) => ({
          positions: [
            {
              ...p,
              id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
              createdAt: new Date().toISOString(),
            },
            ...state.positions,
          ],
        })),
      removePosition: (id) =>
        set((state) => ({ positions: state.positions.filter((x) => x.id !== id) })),
    }),
    { name: 'lineedge-positions' }
  )
);
