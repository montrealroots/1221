/**
 * The jobs that pay the rent, and what they pay.
 *
 * The claim this file holds up is a narrow one and worth stating: the wage
 * floors are published figures, the companies are real and really hire at this
 * level in the countries listed, and how each sits against the floor is a
 * durable public fact. Everything else — the branch, the shift, the words —
 * is the game's. These tests hold the arithmetic to the published floor, so a
 * wage can never quietly stop being derived from one.
 */

import { describe, expect, it } from 'vitest';
import { createSave, defaultConfig } from '@/engine';
import {
  ageOf, floorHere, openingFor, openingsFor, shiftPay, stateFloorFor, stateFloorNameFor, wageFor,
} from '@/engine/systems/work';
import { FIRST_JOBS, JOB_BY_ID, STATE_FLOORS, floorIn } from '@/engine/content/work';
import { EMPLOYERS, EMPLOYER_BY_ID, PAY_STANCE, employersIn } from '@/engine/content/employers';
import { CITIES } from '@/engine/content/geography';

const standing = (cityId: string, seed: string) => {
  const base = defaultConfig();
  const sim = createSave(1, seed, {
    ...base,
    startLocationId: cityId,
    homeRegionId: cityId,
    citizenshipId: CITIES.require(cityId).countryId,
  });
  return { sim, person: sim.universe.people[sim.universe.playerId]! };
};

describe('what a job pays', () => {
  it('is built up from the floor where somebody is standing', () => {
    const { sim, person } = standing('us-ca-losangeles', 'wage-la');
    const job = JOB_BY_ID['checkout']!;
    const california = STATE_FLOORS['us-ca']!;
    expect(stateFloorFor('us-ca-losangeles')).toBe(california);
    expect(stateFloorNameFor(sim, person)).toBe('California');

    // Floor, times what the job is worth, times how the company pays.
    const costco = EMPLOYER_BY_ID['costco']!;
    const expected = Math.round(california * job.premium * PAY_STANCE[costco.pay].multiple);
    expect(wageFor(sim, job, person, 'costco')).toBe(expected);
  });

  it('pays a Californian more than a Texan for the same job at the same company', () => {
    const la = standing('us-ca-losangeles', 'wage-ca');
    const austin = standing('us-tx-austin', 'wage-tx');
    const job = JOB_BY_ID['checkout']!;
    const west = wageFor(la.sim, job, la.person, 'costco');
    const south = wageFor(austin.sim, job, austin.person, 'costco');
    expect(west).toBeGreaterThan(south);
    // Because the states publish different floors, not because of anything else.
    expect(west / south).toBeCloseTo(STATE_FLOORS['us-ca']! / floorIn('us').perHour, 2);
  });

  it('falls to the federal figure in a state that sets none', () => {
    // Texas has no state minimum of its own above the federal one.
    expect(stateFloorFor('us-tx-austin')).toBe(floorIn('us').perHour);
  });

  it('pays more at a company that has committed to paying above the floor', () => {
    const { sim, person } = standing('us-ca-losangeles', 'wage-stance');
    const job = JOB_BY_ID['checkout']!;
    const wellAbove = wageFor(sim, job, person, 'costco');
    const atIt = wageFor(sim, job, person, 'mcdonalds');
    expect(EMPLOYER_BY_ID['costco']!.pay).toBe('well_above');
    expect(EMPLOYER_BY_ID['mcdonalds']!.pay).toBe('at_it');
    expect(wellAbove).toBeGreaterThan(atIt);
  });

  it('never pays below the floor for the country', () => {
    for (const cityId of ['us-ca-losangeles', 'us-tx-austin', 'uk-eng-london', 'jp-13-tokyo', 'au-nsw-sydney']) {
      const { sim, person } = standing(cityId, 'floor-' + cityId);
      for (const opening of openingsFor(sim, person)) {
        expect(opening.perHour, `${cityId} ${opening.job.label}`).toBeGreaterThanOrEqual(50);
      }
    }
  });

  it('multiplies out to the shift', () => {
    const { sim, person } = standing('uk-eng-london', 'wage-shift');
    const job = JOB_BY_ID['warehouse']!;
    expect(shiftPay(sim, job, person, 'ups')).toBe(wageFor(sim, job, person, 'ups') * job.hours);
  });
});

describe('who is hiring where you are standing', () => {
  it('offers only companies that trade in this country', () => {
    const { sim, person } = standing('jp-13-tokyo', 'hiring-jp');
    for (const opening of openingsFor(sim, person)) {
      if (!opening.employer) continue;
      expect(opening.employer.countryIds, `${opening.employer.name} in Japan`).toContain('jp');
    }
  });

  it('offers a different list in a different country', () => {
    const us = standing('us-ca-losangeles', 'hiring-us');
    const jp = standing('jp-13-tokyo', 'hiring-jp2');
    const names = (r: ReturnType<typeof openingsFor>) =>
      new Set(r.map((o) => o.employer?.name).filter(Boolean));
    const american = names(openingsFor(us.sim, us.person));
    const japanese = names(openingsFor(jp.sim, jp.person));
    expect(american).not.toEqual(japanese);
    // Trader Joe's is American only; AEON is not American.
    expect([...american]).toContain('Trader Joe’s');
    expect([...japanese]).not.toContain('Trader Joe’s');
  });

  it('holds back a job somebody is too young for', () => {
    const base = defaultConfig();
    const young = createSave(1, 'hiring-young', {
      ...base, birthYear: base.startYear - 15, birthMonth: 1, birthDay: 1,
    });
    const person = young.universe.people[young.universe.playerId]!;
    expect(ageOf(young, person)).toBe(15);
    const open = openingsFor(young, person);
    expect(open.length).toBeGreaterThan(0);
    for (const one of open) expect(one.job.fromAge).toBeLessThanOrEqual(15);
    // The night warehouse is eighteen and up, so it is not on offer.
    expect(open.some((o) => o.job.id === 'warehouse')).toBe(false);
  });

  it('sorts by what it pays, because that is the question being asked', () => {
    const { sim, person } = standing('us-ca-losangeles', 'hiring-sort');
    const rates = openingsFor(sim, person).map((o) => o.perHour);
    expect(rates).toEqual([...rates].sort((a, b) => b - a));
  });

  it('offers a job with no sector on its own, with no employer', () => {
    const { sim, person } = standing('us-ca-losangeles', 'hiring-solo');
    const walking = openingsFor(sim, person).filter((o) => o.job.id === 'dog_walking');
    expect(walking).toHaveLength(1);
    expect(walking[0]!.employer).toBeUndefined();
  });

  it('finds one opening by its job and its company', () => {
    const { sim, person } = standing('us-ca-losangeles', 'hiring-one');
    const one = openingFor(sim, 'checkout', 'costco', person);
    expect(one?.employer?.name).toBe('Costco');
    expect(one?.perHour).toBe(wageFor(sim, JOB_BY_ID['checkout']!, person, 'costco'));
    expect(openingFor(sim, 'not-a-job', undefined, person)).toBeUndefined();
  });
});

describe('the content this rests on', () => {
  it('gives every employer a country it really trades in and a stance on pay', () => {
    for (const one of EMPLOYERS) {
      expect(one.countryIds.length, one.name).toBeGreaterThan(0);
      expect(PAY_STANCE[one.pay], one.name).toBeDefined();
    }
    expect(EMPLOYERS.length).toBeGreaterThan(40);
  });

  it('teaches something real for every job', () => {
    for (const job of FIRST_JOBS) {
      expect(job.feeds.length, job.label).toBeGreaterThan(0);
      expect(job.hours, job.label).toBeGreaterThan(0);
    }
  });

  it('has somebody hiring in every country an employer claims', () => {
    const claimed = new Set(EMPLOYERS.flatMap((one) => one.countryIds));
    for (const countryId of claimed) {
      expect(employersIn(countryId).length, countryId).toBeGreaterThan(0);
    }
  });

  it('reports the country floor where somebody stands, not their passport', () => {
    const { sim, person } = standing('jp-13-tokyo', 'floor-japan');
    expect(floorHere(sim, person)).toEqual(floorIn('jp'));
  });
});
