/**
 * A pet's papers abroad (`content/petentry.ts`, `entryMissing`, `entryRefusal`
 * in `systems/pets.ts`, from 2026-10-04): each country's own list for each
 * species, good on the day of arrival, and a trip refused without them.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { entryMissing, entryRefusal, petsOf, type Pet } from '@/engine/systems/pets';

const DAY = MS_DAY;
const HOUR = 3_600_000;
const T = Date.UTC(2026, 9, 20, 12);
const dog = (extra: Partial<Pet> = {}): Pet => ({ id: 'p', species: 'dog', name: 'Rex', adoptedAt: T - 400 * DAY, from: 'x', ...extra });
const cat = (extra: Partial<Pet> = {}): Pet => ({ ...dog(extra), species: 'cat', name: 'Mog' });

describe('a pet coming into Britain', () => {
  it('needs a chip before its rabies vaccination, the vaccination 21 days old, a certificate within ten days, and a dog its tapeworm treatment', () => {
    expect(entryMissing(dog(), 'us', 'uk', T)).toEqual(['microchip', 'rabies', 'certificate', 'tapeworm']);
    const ready = dog({ chippedAt: T - 60 * DAY, rabiesAt: T - 30 * DAY, certificate: { to: 'uk', at: T - 5 * DAY }, tapewormAt: T - 48 * HOUR });
    expect(entryMissing(ready, 'us', 'uk', T)).toEqual([]);
    // The vaccination too new, or given before the chip.
    expect(entryMissing({ ...ready, rabiesAt: T - 20 * DAY }, 'us', 'uk', T)).toEqual(['rabies']);
    expect(entryMissing({ ...ready, chippedAt: T - 25 * DAY }, 'us', 'uk', T)).toEqual(['rabies']);
    // A vaccination is good a year.
    expect(entryMissing({ ...ready, rabiesAt: T - 366 * DAY, chippedAt: T - 400 * DAY }, 'us', 'uk', T)).toEqual(['rabies']);
    // The certificate's ten days, and for Britain, not Ireland.
    expect(entryMissing({ ...ready, certificate: { to: 'uk', at: T - 11 * DAY } }, 'us', 'uk', T)).toEqual(['certificate']);
    expect(entryMissing({ ...ready, certificate: { to: 'ie', at: T - 5 * DAY } }, 'us', 'uk', T)).toEqual(['certificate']);
    // The tapeworm treatment's 24 hours to 5 days.
    expect(entryMissing({ ...ready, tapewormAt: T - 12 * HOUR }, 'us', 'uk', T)).toEqual(['tapeworm']);
    expect(entryMissing({ ...ready, tapewormAt: T - 6 * DAY }, 'us', 'uk', T)).toEqual(['tapeworm']);
    // A cat needs no tapeworm treatment.
    expect(entryMissing(cat({ chippedAt: T - 60 * DAY, rabiesAt: T - 30 * DAY, certificate: { to: 'uk', at: T - 5 * DAY } }), 'us', 'uk', T)).toEqual([]);
  });
});

describe('each country’s own list', () => {
  it('asks America’s chip and CDC form of a dog and nothing of a cat; Canada’s rabies; nothing within a country', () => {
    expect(entryMissing(dog(), 'ca', 'us', T)).toEqual(['microchip', 'importForm']);
    expect(entryMissing(dog({ chippedAt: T - DAY, importFormAt: T - 100 * DAY }), 'ca', 'us', T)).toEqual([]);
    expect(entryMissing(dog({ chippedAt: T - DAY, importFormAt: T - 200 * DAY }), 'ca', 'us', T)).toEqual(['importForm']);
    expect(entryMissing(cat(), 'ca', 'us', T)).toEqual([]);
    expect(entryMissing(dog(), 'us', 'ca', T)).toEqual(['rabies']);
    expect(entryMissing(dog({ vetUntil: T + 100 * DAY }), 'us', 'ca', T)).toEqual([]);
    expect(entryMissing(dog(), 'us', 'us', T)).toEqual([]);
  });

  it('asks Mexico’s certificate within 15 days, America’s dogs a 5-day paper, and nothing from Canada', () => {
    expect(entryMissing(dog(), 'ca', 'mx', T)).toEqual([]);
    expect(entryMissing(cat(), 'us', 'mx', T)).toEqual([]);
    expect(entryMissing(dog({ certificate: { to: 'mx', at: T - 4 * DAY } }), 'us', 'mx', T)).toEqual([]);
    expect(entryMissing(dog({ certificate: { to: 'mx', at: T - 6 * DAY } }), 'us', 'mx', T)).toEqual(['certificate']);
    expect(entryMissing(dog({ rabiesAt: T - 30 * DAY, certificate: { to: 'mx', at: T - 14 * DAY } }), 'uk', 'mx', T)).toEqual([]);
  });
});

describe('an Irish pet passport, and a way home looked at ahead', () => {
  it('takes a pet into Britain and Ireland while held, and a way home is held only to what lasts', () => {
    const held = dog({ chippedAt: T - 60 * DAY, rabiesAt: T - 30 * DAY, certificate: { to: 'uk', at: T - 200 * DAY, passport: true }, tapewormAt: T - 48 * HOUR });
    expect(entryMissing(held, 'ie', 'uk', T)).toEqual([]);
    expect(entryMissing({ ...held, tapewormAt: T - 48 * HOUR }, 'uk', 'ie', T)).toEqual([]);
    expect(entryMissing(held, 'us', 'mx', T)).toEqual(['certificate']);
    // A one-trip certificate for Britain is no good into Ireland; ahead of the day only the lasting papers count.
    const once = dog({ chippedAt: T - 60 * DAY, rabiesAt: T - 30 * DAY, certificate: { to: 'uk', at: T - 2 * DAY } });
    expect(entryMissing(once, 'uk', 'ie', T)).toEqual(['certificate', 'tapeworm']);
    expect(entryMissing(once, 'uk', 'ie', T, { lasting: true })).toEqual([]);
    expect(entryMissing(dog(), 'uk', 'ie', T, { lasting: true })).toEqual(['microchip', 'rabies']);
  });
});

describe('a trip abroad with the pets', () => {
  it('is refused naming what each lacks', () => {
    const sim = quickSave({ startLocationId: 'ca-on-toronto', homeRegionId: 'ca-on-toronto', livesWhereBorn: true, wealth: 'wealthy' }, 'pet-entry');
    petsOf(sim.player).push(cat({ adoptedAt: sim.now }));
    expect(entryRefusal(sim.player, 'ca-on-toronto', 'uk-eng-london', sim.now + 30 * DAY)).toBe('London asks more of Mog (A Microchip, A Rabies Vaccination, A Health Certificate) on arriving.');
    expect(entryRefusal(sim.player, 'ca-on-toronto', 'ca-bc-vancouver', sim.now + 30 * DAY)).toBeUndefined();
  });
});
