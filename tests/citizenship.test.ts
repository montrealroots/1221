/**
 * One citizenship, and nobody is asked for it.
 *
 * A person is a citizen of the country they were born in. Creation used to ask
 * for a citizenship and offered a second passport besides; now the place of
 * birth decides it, the screen says it back, and the save keeps it on the
 * person. What these hold is that rule: where it comes from, that it follows
 * the birthplace and not where somebody lives, that an older save is brought
 * round to it, and that neither question is back on the screen.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createSave, defaultConfig, migrate, quickSave } from '@/engine';
import { citizenshipFor } from '@/engine/domain/citizenship';

describe('where a citizenship comes from', () => {
  it('is the country of the place somebody was born in', () => {
    expect(citizenshipFor('is-39-mosfellsbr')).toBe('is');
    expect(citizenshipFor('us-ny-newyork')).toBe('us');
    expect(citizenshipFor('jp-13-tokyo')).toBe('jp');
  });

  it('is nothing at all for a place in no real country', () => {
    expect(citizenshipFor('zz-1-nowhere')).toBeUndefined();
    expect(citizenshipFor('')).toBeUndefined();
  });
});

describe('against a real save', () => {
  it('follows the birthplace, not where they live', () => {
    const sim = createSave(1, 'cit-born', {
      ...defaultConfig(), firstName: 'Robin', lastName: 'Vance',
      homeRegionId: 'jp-13-tokyo', livesWhereBorn: false, startLocationId: 'us-ny-newyork',
    });
    expect(sim.player.citizenshipId).toBe('jp');
    expect(sim.player.currentLocationId).toBe('us-ny-newyork');
  });

  it('moves when the birthplace does', () => {
    expect(quickSave({ homeRegionId: 'is-1-reykjavik' }, 'cit-is').player.citizenshipId).toBe('is');
    expect(quickSave({ homeRegionId: 'us-ny-newyork' }, 'cit-us').player.citizenshipId).toBe('us');
  });

  it('holds one, and never a second', () => {
    const player = quickSave({}, 'cit-one').player as unknown as Record<string, unknown>;
    expect(typeof player.citizenshipId).toBe('string');
    expect('secondCitizenshipId' in player).toBe(false);
  });

  it('refuses a birthplace in no real country', () => {
    expect(() => quickSave({ homeRegionId: 'zz-1-nowhere' }, 'cit-nowhere')).toThrow(/zz-1-nowhere/);
  });
});

describe('an older save', () => {
  it('drops the second passport and takes the country of the birthplace', () => {
    const sim = quickSave({ homeRegionId: 'is-1-reykjavik' }, 'cit-81');
    const universe = sim.universe;
    universe.meta.schemaVersion = 81;
    // How 81 left it: a citizenship picked from a list, and a second passport.
    const row = universe.people[universe.playerId] as unknown as Record<string, unknown>;
    row.citizenshipId = 'us';
    row.secondCitizenshipId = 'ca';

    const result = migrate(universe);

    expect(result.migrated).toBe(true);
    expect(row.citizenshipId).toBe('is');
    expect('secondCitizenshipId' in row).toBe(false);
    expect(result.steps.join(' ')).toMatch(/Made 1 person a citizen of the country they were born in/);
  });

  it('leaves a citizenship alone when it already agrees, or when the birthplace names nowhere', () => {
    const agrees = quickSave({ homeRegionId: 'is-1-reykjavik' }, 'cit-agrees');
    agrees.universe.meta.schemaVersion = 81;
    const quiet = migrate(agrees.universe);
    expect(agrees.player.citizenshipId).toBe('is');
    expect(quiet.steps.join(' ')).not.toMatch(/citizen/);

    const lost = quickSave({}, 'cit-lost');
    lost.universe.meta.schemaVersion = 81;
    const row = lost.universe.people[lost.universe.playerId] as unknown as Record<string, unknown>;
    row.homeRegionId = 'zz-1-nowhere';
    row.citizenshipId = 'is';
    migrate(lost.universe);
    expect(row.citizenshipId).toBe('is');
  });
});

describe('the screen', () => {
  it('asks for neither, and says the one back under the place of birth', () => {
    const creation = readFileSync('src/ui/creation/CharacterCreation.tsx', 'utf8');
    expect(creation, 'the citizenship list is back').not.toMatch(/<select[^>]*id="citizenship"/);
    expect(creation, 'the second citizenship is back').not.toContain('citizenship-second');
    expect(creation, 'the second citizenship is back').not.toContain('secondCitizenshipId');
    const identity = creation.slice(creation.indexOf('function IdentityStep'), creation.indexOf('function PersonalStep'));
    const picker = identity.indexOf('idPrefix="born"');
    const said = identity.indexOf('<span className="label" id="citizenship">Citizenship</span>');
    expect(said, 'Identity does not say the citizenship back').toBeGreaterThan(-1);
    expect(said, 'the citizenship is not under the place of birth').toBeGreaterThan(picker);
  });
});
