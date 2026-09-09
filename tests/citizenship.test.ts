/**
 * Two passports.
 *
 * NOTE: the rule below currently has no caller. It was read by job
 * applications, and the job system has been removed — the player runs a
 * production company and that is the only work there is. The arithmetic is
 * kept and tested because the company will hire writers, crew and cast, and
 * hiring somebody in a country they cannot work in is the same question. The
 * field, the picker and the display are all live; only the enforcement is
 * waiting for something to enforce.
 *
 * Born in one country, naturalised in the one they moved to and live in now,
 * carrying both for the rest of their life. An ordinary biography in this
 * business, and one the save could not express.
 *
 * It is in the engine rather than on a screen because the creation step has
 * always said citizenship "affects where you can work without arrangement",
 * and nothing read it. A label promising a rule the game does not have is
 * worse than no label, so these hold the rule as well as the field.
 */

import { describe, expect, it } from 'vitest';
import { createSave, defaultConfig, quickSave } from '@/engine';
import {
  canWorkIn, citizenshipLabel, citizenshipsOf, countryOfCity, isCitizenOf, workRefusalFor,
} from '@/engine/domain/citizenship';
import { CITIES } from '@/engine/content/geography';

const dual = { citizenshipId: 'us', secondCitizenshipId: 'ca' };

/** A city outside the United States that the registry has loaded. */
const abroad = () => {
  const city = [...CITIES.all()].find((c) => c.countryId === 'ca');
  if (!city) throw new Error('no Canadian city on record to test with');
  return city;
};
const single = { citizenshipId: 'us' };

describe('holding one passport or two', () => {
  it('lists them in the order they are held', () => {
    expect(citizenshipsOf(single)).toEqual(['us']);
    expect(citizenshipsOf(dual)).toEqual(['us', 'ca']);
  });

  it('never counts the same country twice', () => {
    expect(citizenshipsOf({ citizenshipId: 'us', secondCitizenshipId: 'us' })).toEqual(['us']);
    expect(citizenshipsOf({ citizenshipId: 'us', secondCitizenshipId: undefined })).toEqual(['us']);
  });

  it('answers whether a country is one of theirs', () => {
    expect(isCitizenOf(dual, 'us')).toBe(true);
    expect(isCitizenOf(dual, 'ca')).toBe(true);
    expect(isCitizenOf(dual, 'fr')).toBe(false);
    expect(isCitizenOf(single, 'ca')).toBe(false);
  });

  it('reads both names on a screen', () => {
    expect(citizenshipLabel(single)).toBe('United States');
    expect(citizenshipLabel(dual)).toBe('United States And Canada');
  });
});

describe('where that lets them work', () => {
  it('resolves a city to the country it is in', () => {
    expect(countryOfCity('us-ca-losangeles')).toBe('us');
    expect(countryOfCity('not-a-city')).toBeUndefined();
  });

  it('lets somebody work where they hold a passport', () => {
    expect(canWorkIn(single, 'us-ca-losangeles')).toBe(true);
    expect(workRefusalFor(single, 'us-ca-losangeles')).toBeUndefined();
  });

  it('refuses somebody who does not, and says which passports they do hold', () => {
    expect(canWorkIn(single, abroad().id)).toBe(false);
    const refusal = workRefusalFor(single, abroad().id)!;
    expect(refusal).toMatch(/n[o’]t a citizen/i);
    expect(refusal).toMatch(/United States/);
  });

  it('lets the second passport do exactly what the first one does', () => {
    expect(canWorkIn(single, abroad().id)).toBe(false);
    expect(canWorkIn(dual, abroad().id)).toBe(true);
    expect(workRefusalFor(dual, abroad().id)).toBeUndefined();
  });

  it('does not refuse work in a place the map does not know', () => {
    // Better to allow it than to strand somebody on a data gap.
    expect(canWorkIn(single, 'somewhere-unmapped')).toBe(true);
  });
});

describe('against a real save', () => {
  it('carries the second passport onto the person and through a save', () => {
    const sim = createSave(1, 'cit-save', {
      ...defaultConfig(), firstName: 'Robin', lastName: 'Vance',
      citizenshipId: 'us', secondCitizenshipId: 'ca',
    });
    expect(sim.player.citizenshipId).toBe('us');
    expect(sim.player.secondCitizenshipId).toBe('ca');
    expect(citizenshipsOf(sim.player)).toEqual(['us', 'ca']);
  });

  it('leaves it off somebody who only holds one', () => {
    const sim = quickSave({}, 'cit-single');
    expect(sim.player.secondCitizenshipId).toBeUndefined();
    expect(citizenshipsOf(sim.player)).toHaveLength(1);
  });

});
