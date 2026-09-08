/**
 * The dentist, the vet, the licensing office and the phone shop.
 *
 * What a test can hold: an arrangement for paying that is the arrangement that
 * country really has, a band charge rather than a price where a country
 * charges in bands, a child who pays nothing where a country exempts them, a
 * microchipping law dated to the year it came in, an office named the way that
 * state really names it, a network sold only where it operates, a contract a
 * child cannot sign, and an exit fee that goes to nothing when the tie in ends.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import {
  BAND_CHARGE, CHIP_REQUIRED, COUNTER_JOBS, DENTAL_REGIMES, GENERAL_DENTAL, NETWORKS,
  TARIFF_BY_ID, TREATMENT_BY_ID, VET_GROUPS, WAIT_MINUTES, chipRequired, counterJobsAt, dentalIn,
  dentalIsCountrys, networksAreCountrys, networksIn, toothPrice, vetGroupIsCountrys,
} from '@/engine/content/rooms';
import {
  boostersDue, describeTeeth, dentistsIn, exitFee, licenseOfficesIn, officeHere, petCondition,
  petHealthOf, phoneShopsIn, planOf, plansHeld, teethOf, toothCondition, toothTrouble,
  treatmentsOffered, vetsIn, waitFor,
} from '@/engine/systems/rooms';
import { licenseAuthorityFor } from '@/engine/content/documents';
import { MS_DAY } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';

function aResident(seed: string, birthYear = 1995, cityId = 'uk-eng-london'): Simulation {
  return quickSave({ birthYear, startLocationId: cityId, homeRegionId: cityId }, seed);
}

/** Stand in the room, because all four of them insist on it. */
function standIn(sim: Simulation, place: { id: string }): void {
  sim.player.currentPlaceId = place.id;
}

// ---------------------------------------------------------------------------

describe('who pays for a filling', () => {
  it('charges an English patient the band and not the price', () => {
    const filling = TREATMENT_BY_ID.filling!;
    expect(dentalIn('uk').system).toBe('banded');
    expect(toothPrice(filling, 'uk', 30)).toBe(BAND_CHARGE[2]);
    // A crown is a band three thing, and band three is dearer than band two.
    expect(toothPrice(TREATMENT_BY_ID.crown!, 'uk', 30)).toBe(BAND_CHARGE[3]);
    expect(BAND_CHARGE[3]).toBeGreaterThan(BAND_CHARGE[2]);
  });

  it('charges a child nothing where the country exempts children', () => {
    const filling = TREATMENT_BY_ID.filling!;
    expect(toothPrice(filling, 'uk', 12)).toBe(0);
    expect(toothPrice(filling, 'nl', 12)).toBe(0);
    expect(dentalIn('se').freeUnder).toBe(24);
    expect(toothPrice(filling, 'se', 20)).toBe(0);
    expect(toothPrice(filling, 'se', 30)).toBeGreaterThan(0);
  });

  it('carries the arrangements that are actually unusual', () => {
    // Adult dentistry really is outside the Dutch basic package.
    expect(dentalIn('nl').system).toBe('private');
    expect(toothPrice(TREATMENT_BY_ID.filling!, 'nl', 30))
      .toBeGreaterThan(toothPrice(TREATMENT_BY_ID.filling!, 'jp', 30));
    // A Japanese patient pays thirty percent of everything.
    expect(dentalIn('jp').patientShare).toBe(0.3);
    // And dental sits outside the health system in America and Canada.
    expect(dentalIn('us').system).toBe('insured_share');
    expect(dentalIn('ca').system).toBe('insured_share');
  });

  it('pays toward nothing cosmetic, anywhere', () => {
    const whitening = TREATMENT_BY_ID.whitening!;
    for (const countryId of ['uk', 'de', 'jp', 'us', 'nl', 'se']) {
      expect(toothPrice(whitening, countryId, 30), countryId).toBe(whitening.price);
    }
  });

  it('falls to paying privately where it does not carry the country', () => {
    expect(dentalIsCountrys('uk')).toBe(true);
    expect(dentalIsCountrys('zz')).toBe(false);
    expect(dentalIn('zz')).toBe(GENERAL_DENTAL);
    for (const regime of DENTAL_REGIMES) expect(regime.countryIds.length).toBeGreaterThan(0);
  });
});

describe('the chair', () => {
  it('will not do work there is nothing wrong to do', () => {
    const sim = aResident('room-dentist');
    const practice = dentistsIn(sim)[0]!;
    standIn(sim, practice);
    expect(toothTrouble(sim)).toBe(false);
    expect(treatmentsOffered(sim).some((one) => one.needsTrouble)).toBe(false);
    const res = sim.execute({ kind: 'room.dentist', payload: { placeId: practice.id, treatmentId: 'filling' } });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/nothing/i);
  });

  it('sets the recall interval from the state of the teeth rather than the calendar', () => {
    const sim = aResident('room-recall');
    const practice = dentistsIn(sim)[0]!;
    standIn(sim, practice);
    const teeth = teethOf(sim);
    teeth.condition = 95;
    teeth.checkedAt = sim.now;
    const good = sim.execute<{ recall: number }>(
      { kind: 'room.dentist', payload: { placeId: practice.id, treatmentId: 'exam' } },
    );
    expect(good.ok, good.error).toBe(true);
    const longInterval = good.value!.recall;
    teeth.condition = 58;
    teeth.checkedAt = sim.now;
    const poor = sim.execute<{ recall: number }>(
      { kind: 'room.dentist', payload: { placeId: practice.id, treatmentId: 'exam' } },
    );
    expect(poor.value!.recall).toBeLessThan(longInterval);
  });

  it('lets a set of teeth get worse when nobody looks at them', () => {
    const sim = aResident('room-decay');
    const before = toothCondition(sim);
    sim.advanceTo(sim.now + 500 * MS_DAY);
    expect(toothCondition(sim)).toBeLessThan(before);
    expect(describeTeeth(sim)).toMatch(/month/);
  });

  it('will not treat anybody who is not in the room', () => {
    const sim = aResident('room-away');
    const practice = dentistsIn(sim)[0]!;
    sim.player.currentPlaceId = undefined;
    const res = sim.execute({ kind: 'room.dentist', payload: { placeId: practice.id, treatmentId: 'exam' } });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/not at/);
  });
});

describe('the vet', () => {
  it('carries the groups where they really trade and nowhere else', () => {
    expect(vetGroupIsCountrys('uk')).toBe(true);
    expect(vetGroupIsCountrys('us')).toBe(true);
    expect(vetGroupIsCountrys('zz')).toBe(false);
    expect(VET_GROUPS.length).toBeGreaterThan(9);
    for (const group of VET_GROUPS) expect(group.countryIds.length).toBeGreaterThan(0);
  });

  it('dates the microchipping law to the year it came in', () => {
    expect(chipRequired('uk', 'dog')).toBe(2016);
    expect(chipRequired('uk', 'cat')).toBe(2024);
    // America has no national requirement, and is not given one.
    expect(chipRequired('us', 'dog')).toBeUndefined();
    for (const law of Object.values(CHIP_REQUIRED)) {
      expect(law.dogsFrom).toBeGreaterThan(1990);
      expect(law.dogsFrom).toBeLessThan(2027);
    }
  });

  it('has nothing to treat when there is no animal', () => {
    const sim = aResident('room-nopet');
    const practice = vetsIn(sim)[0]!;
    standIn(sim, practice);
    // A save with no pet has no record and no appointment to make.
    if (!petHealthOf(sim)) {
      const res = sim.execute({ kind: 'room.vet', payload: { placeId: practice.id, serviceId: 'checkup' } });
      expect(res.ok).toBe(false);
      expect(res.error).toMatch(/no animal/i);
    }
  });

  it('chips an animal once and refuses to chip it twice', () => {
    const sim = aResident('room-chip', 2010);
    const growing = sim.universe.growing?.[sim.player.id];
    if (!growing) return;
    growing.pet = { kindId: 'dog', name: 'Bramble', since: sim.now, aWeek: 18_00 };
    const practice = vetsIn(sim)[0]!;
    standIn(sim, practice);
    const first = sim.execute({ kind: 'room.vet', payload: { placeId: practice.id, serviceId: 'chip' } });
    expect(first.ok, first.error).toBe(true);
    expect(petHealthOf(sim)!.chipped).toBe(true);
    const again = sim.execute({ kind: 'room.vet', payload: { placeId: practice.id, serviceId: 'chip' } });
    expect(again.ok).toBe(false);
    expect(again.error).toMatch(/already/i);
  });

  it('lets the boosters lapse after a year, which is what boosters do', () => {
    const sim = aResident('room-boosters', 2010);
    const growing = sim.universe.growing?.[sim.player.id];
    if (!growing) return;
    growing.pet = { kindId: 'cat', name: 'Pepper', since: sim.now, aWeek: 12_00 };
    const practice = vetsIn(sim)[0]!;
    standIn(sim, practice);
    expect(boostersDue(sim)).toBe(true);
    const done = sim.execute({ kind: 'room.vet', payload: { placeId: practice.id, serviceId: 'vaccination' } });
    expect(done.ok, done.error).toBe(true);
    expect(boostersDue(sim)).toBe(false);
    sim.advanceTo(sim.now + 400 * MS_DAY);
    expect(boostersDue(sim)).toBe(true);
    expect(petCondition(sim)).toBeLessThan(100);
  });
});

describe('the counter', () => {
  it('names the office the way that state really names it', () => {
    const la = aResident('room-office-la', 1990, 'us-ca-losangeles');
    expect(officeHere(la)).toBe('California DMV');
    const boston = aResident('room-office-ma', 1990, 'us-ma-boston');
    expect(officeHere(boston)).toBe('Massachusetts RMV');
    const london = aResident('room-office-uk');
    expect(officeHere(london)).toBe('Driver and Vehicle Licensing Agency');
    expect(licenseAuthorityFor('us', 'us-mi')?.office).toBe('Michigan Secretary of State');
  });

  it('is quicker with an appointment than without one', () => {
    expect(WAIT_MINUTES.appointment[1]).toBeLessThan(WAIT_MINUTES.walk_in[0]);
    const sim = aResident('room-queue');
    const office = licenseOfficesIn(sim)[0];
    if (!office) return;
    expect(waitFor(sim, 'appointment', office)).toBeLessThan(waitFor(sim, 'walk_in', office));
  });

  it('refuses business nobody that age has at a counter', () => {
    expect(counterJobsAt(12)).toHaveLength(0);
    expect(counterJobsAt(30)).toHaveLength(COUNTER_JOBS.length);
    const sim = aResident('room-child-counter', 2016);
    const office = licenseOfficesIn(sim)[0];
    if (!office) return;
    standIn(sim, office);
    const res = sim.execute({ kind: 'room.counter', payload: { placeId: office.id, jobId: 'register' } });
    expect(res.ok).toBe(false);
  });

  it('gives the same answer to the same paperwork on the same day', () => {
    const sim = aResident('room-paperwork');
    const office = licenseOfficesIn(sim)[0];
    if (!office) return;
    standIn(sim, office);
    const first = sim.execute<{ done: boolean }>(
      { kind: 'room.counter', payload: { placeId: office.id, jobId: 'renew', arrival: 'appointment' } },
    );
    const again = sim.execute<{ done: boolean }>(
      { kind: 'room.counter', payload: { placeId: office.id, jobId: 'renew', arrival: 'appointment' } },
    );
    expect(first.ok && again.ok).toBe(true);
    expect(first.value!.done).toBe(again.value!.done);
  });
});

describe('the phone shop', () => {
  it('sells only the networks that operate where you are standing', () => {
    expect(networksIn('uk').some((one) => one.name === 'EE')).toBe(true);
    expect(networksIn('uk').some((one) => one.name === 'Verizon')).toBe(false);
    expect(networksIn('us').some((one) => one.name === 'Verizon')).toBe(true);
    expect(networksAreCountrys('jp')).toBe(true);
    expect(networksAreCountrys('zz')).toBe(false);
    expect(NETWORKS.length).toBeGreaterThan(50);
  });

  it('carries which networks rent somebody else’s masts', () => {
    for (const id of ['giffgaff', 'mint', 'congstar', 'koodo']) {
      expect(NETWORKS.find((one) => one.id === id)!.kind, id).toBe('virtual');
    }
    for (const id of ['verizon', 'ee', 'docomo', 'telstra']) {
      expect(NETWORKS.find((one) => one.id === id)!.kind, id).toBe('own_network');
    }
  });

  it('will not let a child sign a contract, and will sell them pay as you go', () => {
    const sim = aResident('room-child-plan', 2013);
    const shop = phoneShopsIn(sim)[0]!;
    standIn(sim, shop);
    const network = networksIn('uk')[0]!;
    const contract = sim.execute({ kind: 'room.take_plan', payload: { placeId: shop.id, networkId: network.id, tariffId: 'sim_only' } });
    expect(contract.ok).toBe(false);
    expect(contract.error).toMatch(/eighteen/i);
    const prepaid = sim.execute({ kind: 'room.take_plan', payload: { placeId: shop.id, networkId: network.id, tariffId: 'prepaid' } });
    expect(prepaid.ok, prepaid.error).toBe(true);
    expect(TARIFF_BY_ID.prepaid!.months).toBe(0);
  });

  it('charges to leave early and nothing once the tie in has run out', () => {
    const sim = aResident('room-exit');
    const shop = phoneShopsIn(sim)[0]!;
    standIn(sim, shop);
    const network = networksIn('uk')[0]!;
    sim.execute({ kind: 'room.take_plan', payload: { placeId: shop.id, networkId: network.id, tariffId: 'sim_only' } });
    const plan = planOf(sim)!;
    expect(exitFee(sim, plan)).toBeGreaterThan(0);
    sim.advanceTo(sim.now + 400 * MS_DAY);
    expect(exitFee(sim, plan)).toBe(0);
    const out = sim.execute<{ paid: number }>({ kind: 'room.end_plan', payload: {} });
    expect(out.ok, out.error).toBe(true);
    expect(out.value!.paid).toBe(0);
    expect(planOf(sim)).toBeUndefined();
    expect(plansHeld(sim)).toHaveLength(1);
  });

  it('holds one plan at a time', () => {
    const sim = aResident('room-one-plan');
    const shop = phoneShopsIn(sim)[0]!;
    standIn(sim, shop);
    const [one, two] = networksIn('uk');
    sim.execute({ kind: 'room.take_plan', payload: { placeId: shop.id, networkId: one!.id, tariffId: 'sim_only' } });
    const second = sim.execute({ kind: 'room.take_plan', payload: { placeId: shop.id, networkId: two!.id, tariffId: 'prepaid' } });
    expect(second.ok).toBe(false);
    expect(second.error).toMatch(/already/i);
  });

  it('mends a screen, and sometimes not perfectly', () => {
    const sim = aResident('room-repair');
    const shop = phoneShopsIn(sim)[0]!;
    standIn(sim, shop);
    // A screen is a few hundred, which is exactly the sort of bill this
    // character does not have on them, so the refusal is checked first.
    const broke = sim.execute({ kind: 'room.repair_phone', payload: { placeId: shop.id } });
    if (!broke.ok) expect(broke.error).toMatch(/do not have it/);
    sim.income(sim.player.primaryAccountId!, 2_000_00, 'Test funding', 'other');
    const res = sim.execute<{ paid: number; wentWell: boolean }>(
      { kind: 'room.repair_phone', payload: { placeId: shop.id } },
    );
    expect(res.ok, res.error).toBe(true);
    expect(res.value!.paid).toBeGreaterThan(0);
    expect(typeof res.value!.wentWell).toBe('boolean');
  });
});

describe('the rooms are in the city', () => {
  it('puts all four in a city of any size', () => {
    const sim = aResident('room-city');
    expect(dentistsIn(sim).length).toBeGreaterThan(0);
    expect(vetsIn(sim).length).toBeGreaterThan(0);
    expect(phoneShopsIn(sim).length).toBeGreaterThan(0);
    for (const place of [...dentistsIn(sim), ...vetsIn(sim), ...phoneShopsIn(sim)]) {
      expect(place.name).not.toBe('A Place');
      expect(place.about.length).toBeGreaterThan(20);
    }
  });
});
