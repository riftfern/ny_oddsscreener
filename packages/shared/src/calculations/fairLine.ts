/**
 * Fair-line selection: pick the sharpest book's odds for a market side.
 *
 * The fair line MUST come from a sharp source (Pinnacle / exchange), not from
 * the best soft-book retail line. If no sharp book is present we return null —
 * the caller decides whether to skip the market entirely rather than silently
 * treating a soft book as the fair line.
 */
export const SHARP_BOOK_PRIORITY = ['pinnacle', 'lowvig', 'betfair_ex_eu', 'smarkets'] as const;

export interface BookPrice {
  bookId: string;
  odds: number;
}

export function pickSharpOdds(bookOdds: BookPrice[]): BookPrice | null {
  for (const id of SHARP_BOOK_PRIORITY) {
    const hit = bookOdds.find((b) => b.bookId === id);
    if (hit) return hit;
  }
  return null;
}
