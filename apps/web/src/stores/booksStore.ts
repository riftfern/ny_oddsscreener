import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { DEFAULT_NY_BOOKS, parseUserBooks } from '@ny-sharp-edge/shared';

interface BooksStore {
  books: string[];
  setBooks: (ids: string[]) => void;
}

export const useBooksStore = create<BooksStore>()(
  persist(
    (set) => ({
      books: [...DEFAULT_NY_BOOKS],
      setBooks: (ids) => {
        const next = parseUserBooks(ids);
        if (next.length === 0) return;
        set({ books: next });
      },
    }),
    { name: 'lineedge-books' }
  )
);
