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
  BELOW_FEDERAL_STATES, FIRST_JOBS, JOB_BY_ID, JOB_NOTE, LOCAL_MINIMUMS, NO_MINIMUM_NOTE,
  NO_STATE_MINIMUM, SHIFTS_A_WEEK, STATE_FLOORS, WAGE_FLOORS, WAGE_NOTE, WORLD_FLOOR, YOUNG_RATE,
  floorIn, floorIsCountrys, jobsAt, youngShareAt,
} from '@/engine/content/work';
import {
  askForCover, closeOffMissed, deductionsOn, describeJob, floorHere, jobOf, jobsHeld, letGoFor,
  missedInARow, nextOnTheRota, openingsFor, promotionFor, shiftIsDue, shiftsToCome, stateFloorFor,
  stateFloorNameFor, wageFor, writeRota,
} from '@/engine/systems/work';
import {
  COVER_REASONS, EMPLOYERS, EMPLOYER_BY_ID, LETTING_GO_MISSES, PAY_STANCE, ROLE_BY_ID, ROTA_SHIFTS,
  SHIFT_BY_ID,
} from '@/engine/content/employers';
import { MS_DAY } from '@/engine/core/time';
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
    expect(held.perHour).toBe(wageFor(sim, JOB_BY_ID.checkout!, sim.player, held.employerId, held.roleId));
    expect(shiftIsDue(sim, held)).toBe(true);
    expect(describeJob(sim, held)).toMatch(held.employerName);
    // And two at once is one too many.
    expect(sim.execute({ kind: 'job.take', payload: { kindId: 'cafe' } }).ok).toBe(false);
  });

  it('pays a shift into the account, and will not pay for two on one day', () => {
    const sim = aWorker('job-shift');
    sim.execute({ kind: 'job.take', payload: { kindId: 'checkout' } });
    const held = jobOf(sim)!;
    const shift = nextOnTheRota(held)!;
    const expected = Math.round(
      wageFor(sim, JOB_BY_ID.checkout!, sim.player, held.employerId, held.roleId)
      * shift.hours * SHIFT_BY_ID[shift.kindId]!.premium,
    );
    const before = sim.ledger.availableFunds(sim.player.primaryAccountId!);
    const res = sim.execute<{ paid: number; shifts: number }>({ kind: 'job.shift', payload: {} });
    expect(res.ok, res.error).toBe(true);
    expect(res.value!.paid).toBe(expected);
    // Nobody is handed cash at the end of a shift: it goes on the timesheet.
    expect(sim.ledger.availableFunds(sim.player.primaryAccountId!)).toBe(before);
    expect(jobOf(sim)!.owed).toBe(expected);
    expect(jobOf(sim)!.owedHours).toBe(shift.hours);
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

  it('pays on the country’s own cycle, less what is withheld at source', () => {
    const sim = aWorker('payday');
    sim.execute({ kind: 'job.take', payload: { kindId: 'checkout' } });
    const held = jobOf(sim)!;
    sim.execute({ kind: 'job.shift', payload: {} });
    expect(held.owed).toBeGreaterThan(0);
    expect(held.nextPayAt).toBeDefined();
    sim.advanceTo(held.nextPayAt! + MS_DAY);
    expect(held.payslips.length).toBeGreaterThan(0);
    const slip = held.payslips[0]!;
    expect(slip.gross).toBeGreaterThan(0);
    expect(slip.net).toBeLessThanOrEqual(slip.gross);
    expect(slip.net + slip.tax + slip.social).toBe(slip.gross);
    // The net landed in the account, whatever else came out of it that month.
    const wages = sim.ledger.history(sim.player.primaryAccountId!)
      .filter((one) => one.memo.includes(held.employerName));
    expect(wages.length).toBeGreaterThan(0);
    // And the timesheet is clear afterwards.
    expect(held.owed).toBe(0);
    expect(held.owedHours).toBe(0);
  });

  it('withholds something from a wage where the country withholds', () => {
    const sim = aWorker('deductions', 1996);
    const { tax, social, net } = deductionsOn(sim, 200_000, 'uk-eng-london', 30);
    expect(net).toBeLessThan(200_000);
    expect(tax + social).toBeGreaterThan(0);
    expect(net + tax + social).toBe(200_000);
  });

  it('lets somebody ring in, and it costs less when they are actually ill', () => {
    const ill = aWorker('sick-real');
    ill.execute({ kind: 'job.take', payload: { kindId: 'cafe' } });
    const theirs = jobOf(ill)!;
    ill.player.wellbeing.condition = 40;
    const wasIll = theirs.standing;
    const rang = ill.execute<{ genuine: boolean; note: string }>({ kind: 'job.call_in_sick', payload: {} });
    expect(rang.ok, rang.error).toBe(true);
    expect(rang.value!.genuine).toBe(true);
    expect(theirs.sickDays).toBe(1);
    expect(theirs.standing).toBeLessThan(wasIll);
    expect(theirs.rota[0]!.missed).toBe(true);

    // And more when they are not.
    const fine = aWorker('sick-fake');
    fine.execute({ kind: 'job.take', payload: { kindId: 'cafe' } });
    const other = jobOf(fine)!;
    fine.player.wellbeing.condition = 95;
    fine.player.wellbeing.energy = 90;
    const wasFine = other.standing;
    const pulled = fine.execute<{ genuine: boolean }>({ kind: 'job.call_in_sick', payload: {} });
    expect(pulled.ok, pulled.error).toBe(true);
    expect(pulled.value!.genuine).toBe(false);
    expect(wasFine - other.standing).toBeGreaterThan(1);
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

describe('the company, the rota and the ladder', () => {
  it('puts a British supermarket job at a company that really trades there', () => {
    const sim = aWorker('employer-uk');
    sim.execute({ kind: 'job.take', payload: { kindId: 'checkout' } });
    const held = jobOf(sim)!;
    expect(held.employerId).toBeDefined();
    const company = EMPLOYER_BY_ID[held.employerId!]!;
    expect(company.countryIds).toContain('uk');
    expect(company.sector).toBe('grocery');
    expect(held.employerName).toBe(company.name);
  });

  it('pays a company that pays well above the floor more than one that pays it', () => {
    const above = PAY_STANCE.well_above.multiple;
    const at = PAY_STANCE.at_it.multiple;
    expect(above).toBeGreaterThan(PAY_STANCE.above.multiple);
    expect(PAY_STANCE.above.multiple).toBeGreaterThan(at);
    expect(at).toBe(1);
    const sim = aWorker('employer-pay');
    const job = JOB_BY_ID.checkout!;
    const aldi = EMPLOYERS.find((one) => one.id === 'aldi_uk')!;
    const mcd = EMPLOYERS.find((one) => one.id === 'mcdonalds')!;
    expect(wageFor(sim, job, sim.player, aldi.id)).toBeGreaterThan(wageFor(sim, job, sim.player, mcd.id));
  });

  it('writes a rota that goes forward, in shifts that are real kinds', () => {
    const sim = aWorker('rota');
    sim.execute({ kind: 'job.take', payload: { kindId: 'checkout' } });
    const held = jobOf(sim)!;
    expect(held.rota.length).toBeGreaterThan(1);
    let previous = 0;
    for (const shift of held.rota) {
      expect(shift.at).toBeGreaterThanOrEqual(previous);
      previous = shift.at;
      expect(SHIFT_BY_ID[shift.kindId]).toBeDefined();
      expect(shift.hours).toBeGreaterThan(0);
    }
    expect(nextOnTheRota(held)).toBeDefined();
    expect(shiftsToCome(held).length).toBe(held.rota.length);
    expect(writeRota(sim, held)).toHaveLength(ROTA_SHIFTS.crew!);
  });

  it('pays a night and a weekend more than a weekday, because they really do', () => {
    expect(SHIFT_BY_ID.night!.premium).toBeGreaterThan(1);
    expect(SHIFT_BY_ID.weekend!.premium).toBeGreaterThan(1);
    expect(SHIFT_BY_ID.mid!.premium).toBe(1);
  });

  it('refuses a promotion nobody has offered, and gives one that is earned', () => {
    const sim = aWorker('ladder');
    sim.execute({ kind: 'job.take', payload: { kindId: 'checkout' } });
    const held = jobOf(sim)!;
    expect(promotionFor(held).ready).toBe(false);
    expect(sim.execute({ kind: 'job.take_promotion', payload: {} }).ok).toBe(false);
    // Put the shifts and the standing behind them, the way a year of it would.
    const step = ROLE_BY_ID.supervisor!;
    held.shifts = step.shifts;
    held.standing = step.standing;
    expect(promotionFor(held).ready).toBe(true);
    const was = held.perHour;
    const res = sim.execute<{ roleId: string; perHour: number }>({ kind: 'job.take_promotion', payload: {} });
    expect(res.ok, res.error).toBe(true);
    expect(held.roleId).toBe('supervisor');
    expect(held.perHour).toBeGreaterThan(was);
    expect(ROTA_SHIFTS.supervisor!).toBeGreaterThan(ROTA_SHIFTS.crew!);
  });

  it('rings on a day off, and both answers are answers', () => {
    const sim = aWorker('cover');
    sim.execute({ kind: 'job.take', payload: { kindId: 'cafe' } });
    const held = jobOf(sim)!;
    expect(sim.execute({ kind: 'job.cover', payload: {} }).ok).toBe(false);
    askForCover(sim, held, COVER_REASONS[0]!);
    expect(held.cover).toBeDefined();
    const before = held.standing;
    const said = sim.execute<{ note: string }>({ kind: 'job.cover', payload: {} });
    expect(said.ok, said.error).toBe(true);
    expect(held.standing).toBeGreaterThan(before);
    expect(held.cover).toBeUndefined();
    expect(held.rota.some((one) => one.cover)).toBe(true);

    // And saying no costs a little of what they think of you and nothing else.
    const other = aWorker('cover-no');
    other.execute({ kind: 'job.take', payload: { kindId: 'cafe' } });
    const theirs = jobOf(other)!;
    askForCover(other, theirs, COVER_REASONS[1]!);
    const was = theirs.standing;
    expect(other.execute({ kind: 'job.decline_cover', payload: {} }).ok).toBe(true);
    expect(theirs.standing).toBeLessThan(was);
    expect(theirs.cover).toBeUndefined();
  });

  it('will not let anybody take a cover shift that has already happened', () => {
    const sim = aWorker('cover-stale');
    sim.execute({ kind: 'job.take', payload: { kindId: 'cafe' } });
    const held = jobOf(sim)!;
    askForCover(sim, held, COVER_REASONS[0]!);
    sim.advanceTo(held.cover!.at + MS_DAY);
    const res = sim.execute({ kind: 'job.cover', payload: {} });
    expect(res.ok).toBe(false);
    expect(res.error).toMatch(/days ago/);
    // And the ask is cleared the next time anything reads the job.
    closeOffMissed(sim, held);
    expect(held.cover).toBeUndefined();
  });

  it('marks a shift that went past unworked as missed, and it is noticed', () => {
    const sim = aWorker('missed');
    sim.execute({ kind: 'job.take', payload: { kindId: 'cafe' } });
    const held = jobOf(sim)!;
    const before = held.standing;
    const last = held.rota[held.rota.length - 1]!;
    sim.advanceTo(last.at + 2 * MS_DAY);
    closeOffMissed(sim, held);
    // Everything that was on the old rota is closed off one way or the other,
    // and none of it is still sitting there waiting.
    const old = held.rota.filter((one) => one.at <= last.at);
    expect(old.every((one) => one.worked || one.missed)).toBe(true);
    expect(old.some((one) => one.missed)).toBe(true);
    expect(held.standing).toBeLessThan(before);
  });
});

// ---------------------------------------------------------------------------

describe('the states, which publish their own', () => {
  it('pays a state its own published floor, and a state with none the federal one', () => {
    // The five states that set no minimum of their own fall to the federal
    // figure, which is what a covered worker there is really paid.
    for (const regionId of NO_STATE_MINIMUM) expect(STATE_FLOORS[regionId]).toBeUndefined();
    for (const regionId of BELOW_FEDERAL_STATES) expect(STATE_FLOORS[regionId]).toBeUndefined();
    expect(stateFloorFor('us-tn-nashville')).toBe(floorIn('us').perHour);
    expect(stateFloorFor('us-ca-losangeles')).toBe(STATE_FLOORS['us-ca']);
    expect(stateFloorFor('us-wa-seattle')).toBeGreaterThan(stateFloorFor('us-tx-houston')!);
    // And nowhere outside America is given an American state floor.
    expect(stateFloorFor('uk-eng-london')).toBeUndefined();
    expect(stateFloorFor(undefined)).toBeUndefined();
  });

  it('names the state on the page, and only where there is one to name', () => {
    const la = aWorker('state-la', 2009, 'us-ca-losangeles');
    expect(stateFloorNameFor(la)).toBe('California');
    const london = aWorker('state-london');
    expect(stateFloorNameFor(london)).toBeUndefined();
  });

  it('pays a Californian more than a Texan for the same shift', () => {
    const ca = aWorker('state-wage-ca', 2000, 'us-ca-losangeles');
    const tx = aWorker('state-wage-tx', 2000, 'us-tx-houston');
    const job = JOB_BY_ID.checkout!;
    expect(wageFor(ca, job)).toBeGreaterThan(wageFor(tx, job));
  });
});

describe('being let go', () => {
  it('counts the run of missed shifts and not the total', () => {
    const sim = aWorker('run-of-misses');
    sim.execute({ kind: 'job.take', payload: { kindId: 'cafe' } });
    const held = jobOf(sim)!;
    held.rota = [
      { at: sim.now - 4 * MS_DAY, kindId: 'open', hours: 6, missed: true },
      { at: sim.now - 3 * MS_DAY, kindId: 'open', hours: 6, worked: true },
      { at: sim.now - 2 * MS_DAY, kindId: 'open', hours: 6, missed: true },
      { at: sim.now - 1 * MS_DAY, kindId: 'open', hours: 6, missed: true },
    ];
    expect(missedInARow(held)).toBe(2);
    expect(letGoFor(held)).toBeUndefined();
    held.rota.push({ at: sim.now, kindId: 'open', hours: 6, missed: true });
    expect(missedInARow(held)).toBe(LETTING_GO_MISSES);
    expect(letGoFor(held)).toBe('missed');
  });

  it('takes the job off somebody who stops turning up', () => {
    const sim = aWorker('let-go');
    sim.execute({ kind: 'job.take', payload: { kindId: 'cafe' } });
    const held = jobOf(sim)!;
    const employerName = held.employerName;
    sim.advanceTo(sim.now + 40 * MS_DAY);
    expect(jobOf(sim)).toBeUndefined();
    const ended = jobsHeld(sim)[0]!;
    expect(ended.endedAt).toBeDefined();
    expect(ended.endReason).toMatch(/turning up/);
    // And nothing is left sitting on a rota they are no longer on.
    expect(ended.rota.every((one) => one.worked || one.missed)).toBe(true);
    expect(ended.cover).toBeUndefined();
    // It is remembered as what it was.
    const remembered = sim.universe.history
      .filter((one) => one.title.includes(employerName));
    expect(remembered.some((one) => one.title.startsWith('Let Go'))).toBe(true);
  });

  it('does not take the job off somebody who turns up', () => {
    const sim = aWorker('kept-on');
    sim.execute({ kind: 'job.take', payload: { kindId: 'cafe' } });
    const held = jobOf(sim)!;
    // Six weeks of turning up for everything on the rota.
    for (let step = 0; step < 60; step += 1) {
      const shift = nextOnTheRota(held);
      if (!shift) { sim.advanceTo(sim.now + MS_DAY); continue; }
      sim.advanceTo(Math.max(sim.now, shift.at));
      sim.execute({ kind: 'job.shift', payload: {} });
      if (jobOf(sim) === undefined) break;
    }
    expect(jobOf(sim), 'somebody who worked every shift was let go').toBeDefined();
    expect(jobOf(sim)!.shifts).toBeGreaterThan(3);
  });

  it('still pays the hours already worked to somebody it let go', () => {
    const sim = aWorker('let-go-paid');
    sim.execute({ kind: 'job.take', payload: { kindId: 'cafe' } });
    const held = jobOf(sim)!;
    const shift = nextOnTheRota(held)!;
    sim.advanceTo(Math.max(sim.now, shift.at));
    sim.execute({ kind: 'job.shift', payload: {} });
    const owed = held.owed;
    expect(owed).toBeGreaterThan(0);
    sim.advanceTo(sim.now + 60 * MS_DAY);
    expect(jobOf(sim)).toBeUndefined();
    expect(held.endedAt).toBeDefined();
    expect(held.payslips.length).toBeGreaterThan(0);
    expect(held.payslips[0]!.gross).toBe(owed);
    expect(held.owed).toBe(0);
  });
});
