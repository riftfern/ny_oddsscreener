import { describe, it, expect } from 'vitest';
import { getVenue } from './index';
import {
  DEFAULT_NY_BOOKS,
  booksCaption,
  hasBooksSetup,
  matchingRegion,
  parseUserBooks,
} from './userBooks';

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

describe('DEFAULT_NY_BOOKS', () => {
  it('is the NY retail set and none of them take if-bets', () => {
    expect(DEFAULT_NY_BOOKS).toEqual([
      'fanduel',
      'draftkings',
      'betmgm',
      'caesars',
      'betrivers',
      'fanatics',
      'espnbet',
    ]);
    for (const id of DEFAULT_NY_BOOKS) {
      expect(getVenue(id).supportsIfBets).toBeFalsy();
    }
    expect(getVenue('bovada').supportsIfBets).toBe(true);
  });

  it('matches a NY preset even if book order differs', () => {
    const shuffled = [...DEFAULT_NY_BOOKS].reverse();
    expect(matchingRegion(shuffled)?.id).toBe('ny');
    expect(matchingRegion(['fanduel', 'draftkings'])).toBeUndefined();
    expect(booksCaption(DEFAULT_NY_BOOKS)).toBe('7 New York shops');
  });
});
