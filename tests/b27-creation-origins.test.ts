/**
 * Brief 27, Area A (2026-10-24): where a life comes from, kept apart. "Separate these concepts correctly: Birthplace.
 * Citizenship. Previous residence. Current residence. Banking history. Work authorization. Birthplace alone must not
 * grant residency, an existing bank account, citizenship, or work eligibility."
 *
 * PLAYER JOURNEY: two first-years at Yale, each from creation's config as the screen fills it (`newLifeConfig`), one
 * born in New York who holds Japan's citizenship and one born in Tokyo who holds the United States'. Each concept is
 * read where the save keeps it and by the system that reads it: the birthplace (`homeRegionId`), the citizenship
 * (`citizenshipId`, the passport and the student visa, America's permission to work), the previous residence (Before
 * Yale's `priorResidence`), the current residence (`currentLocationId`, New Haven for every life), and the bank account
 * kept abroad (`homeaccount.ts`), which only a previous residence and that bank's own rule give.
 *
 * `livesWhereBorn` went with this: creation's Identity and Starting Point no longer write or draw it, and nothing reads it
 * (`tests/creation.test.ts`, `tests/school.test.ts`).
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import { newLifeConfig, newLifeFrom, type NewSaveConfig } from '@/engine/world/bootstrap';
import { f1Of, usWorkAuthorized } from '@/engine/systems/permission';
import { homeAccountRefusal } from '@/engine/systems/homeaccount';
import { documentsOf } from '@/engine/systems/documents';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { validate } from '@/ui/creation/CharacterCreation';

const identity = 0 as never;
const config = (extra: Partial<NewSaveConfig>): NewSaveConfig => newLifeFrom({ ...newLifeConfig(), firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
const life = (seed: string, extra: Partial<NewSaveConfig>) => createSave(1, seed, config(extra));

describe('a birthplace and a citizenship, each its own', () => {
  it('PLAYER JOURNEY: born in New York, a citizen of Japan: a Japanese passport, a student visa, no right to work in America by birth', () => {
    const sim = life('b27-ny-jp', { homeRegionId: 'us-ny-newyork', citizenshipId: 'jp' });
    const p = sim.player;
    expect(p.homeRegionId).toBe('us-ny-newyork');
    expect(p.citizenshipId).toBe('jp');
    // Lives in New Haven, as every life at the School does, whatever the birthplace.
    expect(p.currentLocationId).toBe('us-ct-newhaven');
    const passports = documentsOf(p).filter((d) => d.kind === 'passport');
    expect(passports.map((d) => d.issuer)).toEqual(['JP']);
    expect(f1Of(p)).toBeDefined();
    // Not a US citizen: work in America is the student visa's, not the birthplace's.
    expect(usWorkAuthorized(p, sim.now)).toBe(false);
  });

  it('PLAYER JOURNEY: born in Tokyo, a citizen of the United States: an American passport and no student visa', () => {
    const sim = life('b27-tk-us', { homeRegionId: 'jp-13-tokyo', citizenshipId: 'us' });
    const p = sim.player;
    expect(p.homeRegionId).toBe('jp-13-tokyo');
    expect(p.citizenshipId).toBe('us');
    expect(p.currentLocationId).toBe('us-ct-newhaven');
    // A passport, where this citizen holds one (the published share of Americans who do), is America's, never Japan's.
    expect(documentsOf(p).filter((d) => d.kind === 'passport').every((d) => d.issuer === 'US')).toBe(true);
    // Born abroad and saying nothing of a home in America before Yale, no state's license is assumed.
    expect(documentsOf(p).some((d) => d.kind === 'license')).toBe(false);
    expect(f1Of(p)).toBeUndefined();
    expect(usWorkAuthorized(p, sim.now)).toBe(true);
  });

  it('keeps each across a save and a load, the citizenship that disagrees with the birthplace among them', () => {
    const sim = life('b27-kept', { homeRegionId: 'us-ny-newyork', citizenshipId: 'jp', priorResidence: { cityId: 'jp-13-tokyo', fromYear: 2015, fromMonth: 4 } });
    const back = loadSave(deserialise(serialise(sim.universe)) as never);
    expect(back.player.homeRegionId).toBe('us-ny-newyork');
    expect(back.player.citizenshipId).toBe('jp');
    expect(back.player.priorResidence?.cityId).toBe('jp-13-tokyo');
    expect(back.player.currentLocationId).toBe('us-ct-newhaven');
  });
});

describe('a license comes from where they lived, not only where they were born', () => {
  it('is the state they lived in before Yale, where they say one, and the birth state only when they say nothing', () => {
    const seeds = Array.from({ length: 40 }, (_, i) => `b27-lic-${i}`);
    const issuers = (extra: Partial<NewSaveConfig>) => new Set(seeds.flatMap((seed) => documentsOf(life(seed, { homeRegionId: 'us-oh-columbus', citizenshipId: 'us', ...extra }).player).filter((d) => d.kind === 'license').map((d) => d.issuer)));
    expect([...issuers({})]).toEqual(['us-oh']);
    expect([...issuers({ priorResidence: { cityId: 'us-ca-losangeles', fromYear: 2012, fromMonth: 9 } })]).toEqual(['us-ca']);
    // Lived abroad before: no American state's license is assumed.
    expect([...issuers({ priorResidence: { cityId: 'fr-idf-paris', fromYear: 2012, fromMonth: 9 } })]).toEqual([]);
  });
});

describe('creation asks for the citizenship and doesn’t guess it', () => {
  it('won’t leave Identity without one, and takes the one chosen', () => {
    const unchosen = config({ homeRegionId: 'us-ny-newyork', birthYear: 2002, middleName: undefined });
    expect(validate(unchosen, identity)).toContain('Choose your citizenship.');
    expect(validate({ ...unchosen, citizenshipId: 'us' }, identity)).not.toContain('Choose your citizenship.');
    expect(validate({ ...unchosen, citizenshipId: 'pr' }, identity)).toContain('Choose your citizenship.');
  });
});

describe('a bank account kept abroad comes from where they lived and banked, never from the birthplace', () => {
  it('refuses one to somebody born in Paris who says nothing of living there', () => {
    const born = config({ homeRegionId: 'fr-idf-paris', citizenshipId: 'fr' });
    expect(homeAccountRefusal(born, 'fr-bnp-paribas')).toBe('You haven’t said where you lived before Yale.');
  });

  it('reads the citizenship, not the birthplace, for a bank that refuses US persons', () => {
    // Born in Paris, both lives lived in Paris before Yale: the one who chose US citizenship is a US person to the bank.
    const prior = { cityId: 'fr-idf-paris', fromYear: 2006, fromMonth: 1 };
    const french = config({ homeRegionId: 'fr-idf-paris', citizenshipId: 'fr', priorResidence: prior });
    const american = config({ homeRegionId: 'fr-idf-paris', citizenshipId: 'us', priorResidence: prior });
    const refusing = ['fr-bnp-paribas', 'fr-societe-generale', 'fr-credit-agricole', 'fr-la-banque-postale'].find((id) => homeAccountRefusal(american, id)?.includes('US citizen'));
    // Whichever French bank the research says turns a US person away, it turns away only the one who is.
    if (refusing) expect(homeAccountRefusal(french, refusing)).toBeUndefined();
    const anyRefusesBirth = ['fr-bnp-paribas', 'fr-societe-generale', 'fr-credit-agricole', 'fr-la-banque-postale'].some((id) => homeAccountRefusal(french, id)?.includes('US citizen'));
    expect(anyRefusesBirth).toBe(false);
  });
});
