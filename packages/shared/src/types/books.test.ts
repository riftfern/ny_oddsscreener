import { describe, it, expect } from 'vitest';
import { VENUES, SPORTSBOOKS, getVenue, humanizeBookId, getSport, SPORT_INFO } from './index';

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
