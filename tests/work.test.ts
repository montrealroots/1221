/**
 * The Saturday job.
 *
 * What a test can hold: a published minimum wage carried like published data,
 * the countries that genuinely have none carried as having none, a national
 * floor that stays national and a local one that does not, a young rate that
 * is a real arrangement, and a shift that costs hours and pays money into an
 * account that agrees about it afterwards.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import {
  FIRST_JOBS, JOB_BY_ID, JOB_NOTE, LOCAL_MINIMUMS, NO_MINIMUM_NOTE, SHIFTS_A_WEEK, WAGE_FLOORS,
  WAGE_NOTE, WORLD_FLOOR, YOUNG_RATE, floorIn, floorIsCountrys, jobsAt, youngShareAt,
} from '@/engine/content/work';
import {
  describeJob, floorHere, jobOf, jobsHeld, openingsFor, shiftIsDue, shiftPay, wageFor,
} from '@/engine/systems/work';
import { COUNTRIES } from '@/engine/content/geography';
import { ATTRIBUTES } from '@/engine/domain/attributes';
import { SKILLS } from '@/engine/domain/skills';
import { ageOf } from '@/engine/systems/lifespan';
import type { Simulation } from '@/engine/core/simulation';

/** Somebody old enough to work, where you say. */
function aWorker(seed: string, birthYear = 2009, cityId = 'uk-eng-london'): Simulation {
  return quickSave({ birthYear, startLocationId: cityId, homeRegionId: cityId }, seed);
}

// ---------------------------------------------------------------------------

describe('the floor, which is published', () => {
  it('carries a country the geography has, and a wage a person could be paid', () => {
    const seen = new Set<string>();
    for (const floor of WAGE_FLOORS) {
      expect(seen.has(floor.countryId), floor.countryId).toBe(false);
      seen.add(floor.countryId);
      expect(COUNTRIES.get(floor.countryId), floor.countryId).toBeDefined();
      expect(floor.perHour).toBeGreaterThan(0);
      expect(floor.perHour).toBeLessThan(40_00);
      expect(floor.about.length).toBeGreaterThan(24);
    }
    expect(WAGE_FLOORS.length).toBeGreaterThan(39);
  });

  it('knows the countries that have no statutory minimum at all', () => {
    for (const countryId of ['dk', 'se', 'no', 'fi', 'is', 'it', 'at', 'ch']) {
      expect(floorIn(countryId).statutory, countryId).toBe(false);
    }
    for (const countryId of ['us', 'uk', 'de', 'fr', 'au', 'jp', 'br', 'in']) {
      expect(floorIn(countryId).statutory, countryId).toBe(true);
    }
    // And the bargained floors are not low ones.
    expect(floorIn('dk').perHour).toBeGreaterThan(floorIn('us').perHour);
    expect(NO_MINIMUM_NOTE).toMatch(/collective/);
  });

  it('holds the American federal figure, which is the one everybody knows', () => {
    expect(floorIn('us').perHour).toBe(7_25);
    expect(floorIn('us').year).toBe(2009);
    expect(floorIn('us').about).toMatch(/2009/);
  });

  it('falls to a world floor where it carries nothing, and says so', () => {
    expect(floorIsCountrys('uk')).toBe(true);
    expect(floorIsCountrys('zz')).toBe(false);
    expect(floorIn('zz').perHour).toBe(WORLD_FLOOR);
    expect(floorIn('zz').statutory).toBe(false);
    expect(WAGE_NOTE).toMatch(/rounded/);
  });

  it('keeps a national floor national and lets a local one move', () => {
    const london = aWorker('floor-london', 2000, 'uk-eng-london');
    const manchester = aWorker('floor-manchester', 2000, 'uk-eng-manchester');
    const job = JOB_BY_ID.checkout!;
    // Britain sets one figure for the whole country, so the city cannot move it.
    expect(wageFor(london, job)).toBe(wageFor(manchester, job));
    expect(LOCAL_MINIMUMS.has('uk')).toBe(false);
    // America lets states and cities set their own, and more than half do.
    expect(LOCAL_MINIMUMS.has('us')).toBe(true);
    const la = aWorker('floor-la', 2000, 'us-ca-losangeles');
    expect(wageFor(la, job)).toBeGreaterThan(floorIn('us').perHour);
  });

  it('pays a young worker less, which is a real arrangement', () => {
    let last = -1;
    for (const band of YOUNG_RATE) {
      expect(band.fromAge).toBeGreaterThan(last);
      last = band.fromAge;
      expect(band.share).toBeGreaterThan(0);
      expect(band.share).toBeLessThanOrEqual(1);
    }
    expect(youngShareAt(14)).toBeLessThan(youngShareAt(19));
    expect(youngShareAt(30)).toBe(1);
    const young = aWorker('young', 2010);
    const grown = aWorker('grown', 1998);
    expect(wageFor(young, JOB_BY_ID.babysitting!)).toBeLessThan(wageFor(grown, JOB_BY_ID.babysitting!));
  });
});

describe('the jobs, which are SLATE’s own', () => {
  it('starts each one at an age somebody could really be doing it', () => {
    const attributeIds = new Set(ATTRIBUTES.map((one) => one.id));
    const skillIds = new Set(SKILLS.map((one) => one.id));
    for (const job of FIRST_JOBS) {
      expect(job.fromAge).toBeGreaterThan(11);
      expect(job.hours).toBeGreaterThan(0);
      expect(job.hours).toBeLessThan(13);
      expect(job.about.length).toBeGreaterThan(24);
      for (const feed of job.feeds) {
        const pool = feed.kind === 'skill' ? skillIds : attributeIds;
        expect(pool.has(feed.key), `${job.id}/${feed.key}`).toBe(true);
      }
    }
    expect(FIRST_JOBS.length).toBeGreaterThan(9);
    expect(jobsAt(13).length).toBeLessThan(jobsAt(18).length);
    expect(SHIFTS_A_WEEK).toBeGreaterThan(0);
    expect(JOB_NOTE).toMatch(/rota/);
  });
});

describe('holding one', () => {
  it('will not put a child on a rota', () => {
    const child = aWorker('job-child', 2015);
    expect(ageOf(child)).toBeLessThan(13);
    expect(openingsFor(child)).toHaveLength(0);
    expect(child.execute({ kind: 'job.take', payload: { kindId: 'checkout' } }).ok).toBe(false);
  });

  it('takes one, names where it is, and starts you that afternoon', () => {
    const sim = aWorker('job-take');
    const openings = openingsFor(sim);
    expect(openings.length).toBeGreaterThan(0);
    const res = sim.execute<{ employerName: string; perHour: number }>(
      { kind: 'job.take', payload: { kindId: 'checkout' } },
    );
    expect(res.ok, res.error).toBe(true);
    const held = jobOf(sim)!;
    expect(held.employerName.length).toBeGreaterThan(2);
    expect(held.perHour).toBe(wageFor(sim, JOB_BY_ID.checkout!));
    expect(shiftIsDue(sim, held)).toBe(true);
    expect(describeJob(sim, held)).toMatch(held.employerName);
    // And two at once is one too many.
    expect(sim.execute({ kind: 'job.take', payload: { kindId: 'cafe' } }).ok).toBe(false);
  });

  it('pays a shift into the account, and will not pay for two on one day', () => {
    const sim = aWorker('job-shift');
    sim.execute({ kind: 'job.take', payload: { kindId: 'checkout' } });
    const expected = shiftPay(sim, JOB_BY_ID.checkout!);
    const before = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    const res = sim.execute<{ paid: number; shifts: number }>({ kind: 'job.shift', payload: {} });
    expect(res.ok, res.error).toBe(true);
    expect(res.value!.paid).toBe(expected);
    expect(sim.ledger.availableFunds(sim.player.primaryAccountId!)).toBe(before + expected);
    expect(jobOf(sim)!.shifts).toBe(1);
    expect(jobOf(sim)!.earned).toBe(expected);
    expect(sim.execute({ kind: 'job.shift', payload: {} }).ok).toBe(false);
  });

  it('costs hours and energy, and teaches something', () => {
    const sim = aWorker('job-cost');
    sim.execute({ kind: 'job.take', payload: { kindId: 'kitchen_porter' } });
    const job = JOB_BY_ID.kitchen_porter!;
    const clock = sim.now;
    const energy = sim.player.wellbeing.energy;
    const before = sim.player.skills?.cooking ?? 0;
    sim.execute({ kind: 'job.shift', payload: {} });
    expect(sim.now - clock).toBeGreaterThanOrEqual(job.hours * 60 * 60_000);
    expect(sim.player.wellbeing.energy).toBeLessThan(energy);
    if (before < 100) expect(sim.player.skills.cooking).toBeGreaterThan(before);
  });

  it('lets you hand your notice in, and remembers what it came to', () => {
    const sim = aWorker('job-quit');
    sim.execute({ kind: 'job.take', payload: { kindId: 'cafe' } });
    sim.execute({ kind: 'job.shift', payload: {} });
    const earned = jobOf(sim)!.earned;
    const res = sim.execute<{ earned: number; shifts: number }>({ kind: 'job.quit', payload: {} });
    expect(res.ok, res.error).toBe(true);
    expect(res.value!.earned).toBe(earned);
    expect(jobOf(sim)).toBeUndefined();
    expect(jobsHeld(sim)).toHaveLength(1);
    expect(jobsHeld(sim)[0]!.endedAt).toBeDefined();
    // And you can take another one afterwards.
    expect(sim.execute({ kind: 'job.take', payload: { kindId: 'retail' } }).ok).toBe(true);
  });

  it('reads the floor where the character is standing', () => {
    const stockholm = aWorker('job-sweden', 2009, 'se-26-stockholm');
    expect(floorHere(stockholm).statutory).toBe(false);
    const london = aWorker('job-uk', 2009, 'uk-eng-london');
    expect(floorHere(london).statutory).toBe(true);
    expect(floorHere(london).perHour).toBe(floorIn('uk').perHour);
  });
});
