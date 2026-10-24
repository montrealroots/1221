/**
 * One citizenship, chosen at creation (from 2026-10-24, the owner's brief 27).
 *
 * Creation asked for a citizenship and offered a second passport besides until schema 82 (2026-09-22); from then to
 * 2026-10-24 the place of birth decided it, the screen said it back, and every opening put it back to the birthplace's.
 * Brief 27 separated the two ("Birthplace alone must not grant residency, an existing bank account, citizenship, or work
 * eligibility"): the player chooses one citizenship on Identity, the birthplace suggests it and decides nothing, and an
 * opening keeps whatever valid citizenship the save holds. What these hold is that rule: what the birthplace suggests,
 * that a chosen citizenship is the person's whatever the birthplace, that an opening never moves it, that a life made by
 * a test or a tool without one takes the birthplace's, and that there is still only one.
 */

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { createSave, defaultConfig, loadSave, migrate, quickSave } from '@/engine';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { TERRITORY_CITIZENSHIP, citizenshipFor, citizenships, isCitizenship } from '@/engine/domain/citizenship';
import { COUNTRIES, cityCount } from '@/engine/content/geography';
import { citizenshipName, suggestedCitizenship } from '@/ui/creation/CharacterCreation';

describe('where a citizenship comes from', () => {
  it('is the country of the place somebody was born in', () => {
    expect(citizenshipFor('is-39-mosfellsbr')).toBe('is');
    expect(citizenshipFor('us-ny-newyork')).toBe('us');
    expect(citizenshipFor('jp-13-tokyo')).toBe('jp');
  });

  it('is the country a territory belongs to, not the territory', () => {
    expect(citizenshipFor('pr-127-sanjuan')).toBe('us');
    expect(citizenshipFor('re-re-saintdenis')).toBe('fr');
    expect(citizenshipFor('hk-hongkong')).toBe('cn');
    expect(citizenshipFor('gl-07-nuuk')).toBe('dk');
    expect(citizenshipFor('ax-211-mariehamn')).toBe('fi');
    expect(citizenshipFor('gi-gibraltar')).toBe('uk');
    // A place with a nationality of its own stays itself.
    expect(citizenshipFor('tw-04-taipei')).toBe('tw');
  });

  it('names a real country for every territory, and never another territory', () => {
    for (const [territory, country] of Object.entries(TERRITORY_CITIZENSHIP)) {
      expect(COUNTRIES.get(territory), `${territory} is not in the gazetteer`).toBeDefined();
      expect(COUNTRIES.get(country), `${territory} gives ${country}, which is not`).toBeDefined();
      expect(TERRITORY_CITIZENSHIP[country], `${territory} gives ${country}, itself a territory`).toBeUndefined();
    }
  });

  it('covers every inhabited territory of the states that have them', () => {
    // The gazetteer's own entries for places whose people hold these states'
    // citizenship. Every one somebody can be born in has to be mapped.
    const belonging = [
      'pr', 'gu', 'vi', 'mp', 'as', 're', 'gp', 'mq', 'gf', 'yt', 'pf', 'nc', 'bl', 'mf', 'pm', 'wf',
      'ai', 'bm', 'vg', 'ky', 'fk', 'gi', 'ms', 'pn', 'sh', 'tc', 'gg', 'je', 'im',
      'aw', 'cw', 'sx', 'bq', 'gl', 'fo', 'ax', 'sj', 'cx', 'cc', 'nf', 'ck', 'nu', 'tk', 'hk', 'mo',
    ];
    for (const territory of belonging) {
      expect(cityCount(territory), `${territory} has nobody to be born there`).toBeGreaterThan(0);
      expect(TERRITORY_CITIZENSHIP[territory], `${territory} is not mapped`).toBeDefined();
    }
  });

  it('is nothing at all for a place in no real country', () => {
    expect(citizenshipFor('zz-1-nowhere')).toBeUndefined();
    expect(citizenshipFor('')).toBeUndefined();
  });
});

describe('against a real save', () => {
  it('is the one chosen, whatever the birthplace and wherever they live', () => {
    const sim = createSave(1, 'cit-chosen', {
      ...defaultConfig(), firstName: 'Robin', lastName: 'Vance',
      homeRegionId: 'us-ny-newyork', citizenshipId: 'jp', startLocationId: 'us-ny-newyork',
    });
    expect(sim.player.homeRegionId).toBe('us-ny-newyork');
    expect(sim.player.citizenshipId).toBe('jp');
    // Changing the input changes the outcome: the same life choosing the birthplace's.
    expect(quickSave({ homeRegionId: 'us-ny-newyork', citizenshipId: 'us' }, 'cit-chosen-us').player.citizenshipId).toBe('us');
  });

  it('is the birthplace’s for a life a test or a tool makes without one, not where they live', () => {
    const sim = createSave(1, 'cit-born', {
      ...defaultConfig(), firstName: 'Robin', lastName: 'Vance',
      homeRegionId: 'jp-13-tokyo', startLocationId: 'us-ny-newyork',
    });
    expect(sim.player.citizenshipId).toBe('jp');
    expect(sim.player.currentLocationId).toBe('us-ny-newyork');
    expect(quickSave({ homeRegionId: 'is-1-reykjavik' }, 'cit-is').player.citizenshipId).toBe('is');
  });

  it('holds one, and never a second', () => {
    const player = quickSave({}, 'cit-one').player as unknown as Record<string, unknown>;
    expect(typeof player.citizenshipId).toBe('string');
    expect('secondCitizenshipId' in player).toBe(false);
  });

  it('refuses a birthplace in no real country, and a citizenship nobody holds', () => {
    expect(() => quickSave({ homeRegionId: 'zz-1-nowhere' }, 'cit-nowhere')).toThrow(/zz-1-nowhere/);
    // A territory's people hold its country's citizenship, and nobody is Antarctica's.
    expect(() => quickSave({ homeRegionId: 'us-ny-newyork', citizenshipId: 'pr' }, 'cit-pr')).toThrow(/pr/);
    expect(() => quickSave({ homeRegionId: 'us-ny-newyork', citizenshipId: 'aq' }, 'cit-aq')).toThrow(/aq/);
  });

  it('is kept across every opening, though it disagrees with the birthplace', () => {
    const sim = quickSave({ homeRegionId: 'jp-13-tokyo', citizenshipId: 'uk' }, 'cit-kept');
    let back = loadSave(deserialise(serialise(sim.universe)) as never);
    back = loadSave(deserialise(serialise(back.universe)) as never);
    expect(back.player.citizenshipId).toBe('uk');
  });

  it('lists every country that isn’t another’s territory, and nothing else', () => {
    const all = citizenships();
    expect(all).toContain('us');
    expect(all).toContain('uk');
    expect(all).toContain('tw');
    expect(all).not.toContain('pr');
    expect(all).not.toContain('hk');
    expect(all).not.toContain('aq');
    expect(all.every(isCitizenship)).toBe(true);
    expect(all.length).toBe(COUNTRIES.all().length - Object.keys(TERRITORY_CITIZENSHIP).length - 1);
  });
});

describe('an older save', () => {
  it('drops the second passport and keeps the citizenship it was asked for', () => {
    const sim = quickSave({ homeRegionId: 'is-1-reykjavik' }, 'cit-81');
    const universe = sim.universe;
    universe.meta.schemaVersion = 81;
    // How 81 left it: a citizenship picked from a list, and a second passport.
    const row = universe.people[universe.playerId] as unknown as Record<string, unknown>;
    row.citizenshipId = 'us';
    row.secondCitizenshipId = 'ca';

    const result = migrate(universe);

    expect(result.migrated).toBe(true);
    // From 82 to 2026-10-24 this became Iceland's, the birthplace's; the player's own answer is kept now.
    expect(row.citizenshipId).toBe('us');
    expect('secondCitizenshipId' in row).toBe(false);
    expect(result.steps.join(' ')).not.toMatch(/citizen/);
  });

  it('gives a person with no citizenship the one their birthplace suggests, once', () => {
    const sim = quickSave({ homeRegionId: 'is-1-reykjavik' }, 'cit-none');
    const row = sim.universe.people[sim.universe.playerId] as unknown as Record<string, unknown>;
    delete row.citizenshipId;
    const first = migrate(sim.universe);
    expect(row.citizenshipId).toBe('is');
    expect(first.steps.join(' ')).toMatch(/Gave 1 person without a citizenship the one their place of birth suggests/);
    const again = migrate(sim.universe);
    expect(again.steps.join(' ')).not.toMatch(/citizen/);
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
    // Not Iceland, where this save lives, so falling back to the home town
    // or to the old default would show.
    row.citizenshipId = 'jp';
    const unmoved = migrate(lost.universe);
    expect(row.citizenshipId).toBe('jp');
    expect(unmoved.steps.join(' ')).not.toMatch(/citizen/);
  });
});

describe('the screen', () => {
  it('names the citizenship chosen, and suggests the birthplace’s without choosing it', () => {
    expect(citizenshipName({ citizenshipId: 'jp' })).toBe('Japan');
    expect(citizenshipName({ citizenshipId: undefined })).toBeUndefined();
    expect(citizenshipName({ citizenshipId: 'pr' })).toBeUndefined();
    expect(suggestedCitizenship({ homeRegionId: 'pr-127-sanjuan' })).toEqual({ id: 'us', name: 'United States' });
    expect(suggestedCitizenship({ homeRegionId: 'zz-1-nowhere' })).toBeUndefined();
    expect(suggestedCitizenship({ homeRegionId: '' })).toBeUndefined();
  });

  it('asks for one, under the place of birth, and never for a second', () => {
    const creation = readFileSync('src/ui/creation/CharacterCreation.tsx', 'utf8');
    expect(creation, 'the second citizenship is back').not.toContain('citizenship-second');
    expect(creation, 'the second citizenship is back').not.toContain('secondCitizenshipId');
    const identity = creation.slice(creation.indexOf('function IdentityStep'), creation.indexOf('function PersonalStep'));
    const picker = identity.indexOf('idPrefix="born"');
    const asked = identity.search(/<select\s+id="citizenship"/);
    expect(asked, 'Identity does not ask for the citizenship').toBeGreaterThan(-1);
    expect(asked, 'the citizenship is not under the place of birth').toBeGreaterThan(picker);
    expect(identity).toContain('Same As Your Place Of Birth');
    expect(creation).toContain("issues.push('Choose your citizenship.')");
  });
});
