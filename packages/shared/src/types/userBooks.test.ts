import { describe, it, expect } from 'vitest';
import { hasBooksSetup, parseUserBooks } from './userBooks';

describe('parseUserBooks', () => {
  it('keeps known ids and drops junk', () => {
    expect(parseUserBooks(['fanduel', 'not-a-book', 'fanduel', 12, 'draftkings'])).toEqual([
      'fanduel',
      'draftkings',
    ]);
  });

  it('treats missing metadata as not set up', () => {
    expect(hasBooksSetup(undefined)).toBe(false);
    expect(hasBooksSetup({})).toBe(false);
    expect(hasBooksSetup({ booksSet: true, books: ['fanduel'] })).toBe(true);
    expect(hasBooksSetup({ books: ['fanduel'] })).toBe(true);
  });
});
