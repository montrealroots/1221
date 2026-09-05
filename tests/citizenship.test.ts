/**
 * Two passports.
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
import { refreshOpenings } from '@/engine/systems/work';

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
    expect(refusal).toMatch(/not a citizen/i);
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

  it('refuses a job application abroad, and takes it once the passport is there', () => {
    const sim = quickSave({}, 'cit-apply');
    refreshOpenings(sim);
    const home = Object.values(sim.universe.jobOpenings).find((o) => countryOfCity(o.locationId) === 'us');
    expect(home, 'no job at home to test with').toBeDefined();

    // Move the listing abroad and it is refused.
    home!.locationId = abroad().id;
    const refused = sim.execute({ kind: 'work.apply', payload: { openingId: home!.id } });
    expect(refused.ok).toBe(false);
    expect(refused.error).toMatch(/not a citizen/i);

    // Give them the passport and the same application goes through.
    sim.player.secondCitizenshipId = 'ca';
    const accepted = sim.execute({ kind: 'work.apply', payload: { openingId: home!.id } });
    expect(accepted.ok, accepted.error).toBe(true);
  });

  it('reads an applicant’s real age rather than subtracting years', () => {
    // work.apply used to compare this year with their birth year, which makes
    // somebody born in June a year older than they are every January to May.
    const sim = quickSave({}, 'cit-age');
    refreshOpenings(sim);
    const opening = Object.values(sim.universe.jobOpenings)[0]!;
    opening.locationId = sim.player.currentLocationId;
    opening.minimumAge = 99;
    const result = sim.execute({ kind: 'work.apply', payload: { openingId: opening.id } });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/at least 99/);
  });
});
