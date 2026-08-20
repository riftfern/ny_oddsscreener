import { describe, it, expect } from 'vitest';
import { VENUES, SPORTSBOOKS, getVenue, humanizeBookId, getSport, SPORT_INFO, shopHref, formatPick, inSeasonSport, SPORTS } from './index';

describe('VENUES catalog', () => {
  it('contains every key in SPORTSBOOKS', () => {
    for (const bookId of Object.values(SPORTSBOOKS)) {
      expect(VENUES[bookId]).toBeDefined();
    }
  });

  it('marks pinnacle as sharp', () => {
    expect(VENUES['pinnacle'].isSharp).toBe(true);
  });

  it('classifies kalshi and polymarket as prediction markets', () => {
    expect(VENUES['kalshi'].kind).toBe('prediction');
    expect(VENUES['polymarket'].kind).toBe('prediction');
  });

  it('classifies retail books as sportsbook venues', () => {
    for (const bookId of Object.values(SPORTSBOOKS)) {
      expect(VENUES[bookId].kind).toBe('sportsbook');
    }
  });

  it('includes common live book keys', () => {
    for (const key of [
      'betonlineag',
      'betfair_ex_eu',
      'espnbet',
      'hardrockbet',
      'unibet_us',
      'betparx',
      'gtbets',
      'matchbook',
      'mybookieag',
      'coolbet',
      'bovada',
    ]) {
      expect(VENUES[key]).toBeDefined();
    }
  });
});

describe('getVenue / humanizeBookId', () => {
  it('humanizes betonlineag as BetOnline AG', () => {
    expect(humanizeBookId('betonlineag')).toBe('BetOnline AG');
    expect(getVenue('betonlineag').name).toBe('BetOnline AG');
  });

  it('never returns Unknown or ? for a missing catalog key', () => {
    const venue = getVenue('totally_new_offshoreag');
    expect(venue.name).not.toBe('Unknown');
    expect(venue.shortName).not.toBe('?');
    expect(venue.name.toLowerCase()).not.toContain('unknown');
    expect(venue.deepLink).toBe('');
    expect(venue.color).toBe('#8a8d84');
  });

  it('humanizes unibet_* keys instead of Unknown', () => {
    const venue = getVenue('unibet_se');
    expect(venue.name).not.toBe('Unknown');
    expect(venue.name).toMatch(/Unibet/i);
    expect(venue.shortName).not.toBe('?');
  });

  it('uses forest/grey chips except Pinnacle brass', () => {
    expect(getVenue('pinnacle').color).toBe('#c4b07a');
    expect(getVenue('fanduel').color).toBe('#8a8d84');
    expect(getVenue('betmgm').color).toBe('#8a8d84');
  });

  it('shopHref is omitted when there is no deep link', () => {
    expect(shopHref('fanduel')).toMatch(/^https:\/\//);
    expect(shopHref('betonlineag')).toBeUndefined();
    expect(shopHref('gtbets')).toBeUndefined();
  });
});

describe('inSeasonSport / formatPick', () => {
  it('is MLB in August and NFL in September', () => {
    expect(inSeasonSport(new Date('2026-08-19T12:00:00'))).toBe(SPORTS.MLB);
    expect(inSeasonSport(new Date('2026-09-15T12:00:00'))).toBe(SPORTS.NFL);
  });

  it('does not double a line already in the name', () => {
    expect(formatPick('Over 8.5', 8.5, 'totals')).toBe('Over 8.5');
    expect(formatPick('Over', 8.5, 'totals')).toBe('Over 8.5');
    expect(formatPick('Boston Red Sox -1.5', -1.5, 'spreads')).toBe('Boston Red Sox -1.5');
    expect(formatPick('Patriots +3.5 → +9.5', 9.5, 'spreads')).toBe('Patriots +3.5 → +9.5');
    expect(formatPick('New York Yankees', undefined, 'h2h')).toBe('New York Yankees');
  });
});

describe('getSport', () => {
  it('uses event.sportKey — NHL is NHL, never NFL', () => {
    expect(getSport('icehockey_nhl').shortName).toBe('NHL');
    expect(getSport('icehockey_nhl').shortName).not.toBe('NFL');
    expect(getSport(SPORT_INFO.americanfootball_nfl.key).shortName).toBe('NFL');
  });

  it('does not default an unknown key to NFL', () => {
    expect(getSport('icehockey_ahl').shortName).not.toBe('NFL');
    expect(getSport('icehockey_ahl').shortName).toBe('AHL');
  });
});
