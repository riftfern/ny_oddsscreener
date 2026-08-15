import { describe, it, expect } from 'vitest';
import {
  expandSportKeys,
  getSport,
  inSeasonTennisMajorKeys,
  isKnownSport,
  SPORTS,
  TENNIS_GROUP_KEY,
} from './index';

describe('tennis majors', () => {
  it('expands tennis_majors to the in-season slam only', () => {
    const uso = inSeasonTennisMajorKeys(new Date('2026-08-15T12:00:00Z'));
    expect(uso).toEqual(['tennis_atp_us_open', 'tennis_wta_us_open']);
    expect(expandSportKeys(SPORTS.TENNIS, new Date('2026-08-15T12:00:00Z'))).toEqual(uso);
  });

  it('uses Australian Open in January', () => {
    const keys = inSeasonTennisMajorKeys(new Date('2026-01-20T12:00:00Z'));
    expect(keys).toEqual(['tennis_atp_aus_open_singles', 'tennis_wta_aus_open_singles']);
  });

  it('off-season points at the next slam, not all eight', () => {
    const keys = inSeasonTennisMajorKeys(new Date('2026-03-01T12:00:00Z'));
    expect(keys).toHaveLength(2);
    expect(keys.every((k) => k.includes('french_open'))).toBe(true);
  });

  it('does not expand NFL', () => {
    expect(expandSportKeys(SPORTS.NFL)).toEqual([SPORTS.NFL]);
  });

  it('labels a slam key as tennis, never NFL', () => {
    expect(getSport('tennis_atp_us_open').shortName).toBe('USO');
    expect(getSport('tennis_atp_us_open').shortName).not.toBe('NFL');
    expect(getSport(TENNIS_GROUP_KEY).shortName).toBe('TENNIS');
  });

  it('accepts tennis_majors as a known sport', () => {
    expect(isKnownSport('tennis_majors')).toBe(true);
    expect(isKnownSport('tennis_atp_us_open')).toBe(true);
    expect(isKnownSport('not_a_sport')).toBe(false);
  });
});
