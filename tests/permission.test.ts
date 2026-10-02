/**
 * Permission to work where one isn't a citizen (docs/WORLD.md, stage 1b):
 * a student's F-1, OPT after the degree and its limit on time between jobs,
 * an O-1 decided on the evidence the career shows, and Canada's work permit
 * for a production, applied for or issued at the border.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { UNION_HEALTH } from '@/engine/content/career';
import { WORK_RULES } from '@/engine/content/workrules';
import { acceptRefusal, beginCareer, careerOf, homeAbroadOf, type Booking } from '@/engine/systems/career';
import { addYears, authorizationFor, authorizationRefusal, documentsOf, residenceRefusal, type PersonDocument } from '@/engine/systems/documents';
import { earningsOf } from '@/engine/systems/earnings';
import { businessDaysOn, o1Evidence, o1Refusal, optRefusal, programEnd, scheduleUsStatus, usStatusEnds, workRefusal } from '@/engine/systems/permission';
import { attributesOf } from '@/engine/systems/attributes';

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, NY);
const YEAR = 365.25 * MS_DAY;

/** A British actor living in New York with a passport, whose F-1 ends a number of days from now. */
function graduate(seed: string, programEndsIn: number): Simulation {
  const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'uk-eng-london', livesWhereBorn: false, wealth: 'wealthy' }, seed);
  beginCareer(sim, sim.player);
  sim.player.documents = [];
  const end = sim.now + programEndsIn * MS_DAY;
  documentsOf(sim.player).push(
    { id: 'pp', kind: 'passport', issuer: 'GB', name: 'Passport', number: 'P1', status: 'valid', issuedAt: sim.now - YEAR, expiresAt: sim.now + 8 * YEAR },
    { id: 'f1', kind: 'visa', issuer: 'US', name: 'F-1 Student Visa', number: 'F1', status: 'valid', issuedAt: sim.now - 2 * YEAR, expiresAt: end + 60 * MS_DAY, destination: 'US', passportId: 'pp' },
  );
  if (sim.player.school) sim.player.school.standing = 'graduated';
  return sim;
}
const bank = (sim: Simulation) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal && (a.kind === 'checking' || a.kind === 'savings')).reduce((x, a) => x + a.balance, 0);
const permit = (sim: Simulation, name: RegExp) => documentsOf(sim.player).find((d) => d.kind === 'permit' && name.test(d.name));

describe('a student on an F-1', () => {
  it('may not act off campus while studying, and is told why', () => {
    const sim = graduate('f1-student', 300);
    sim.player.school = { ...(sim.player.school ?? {}), standing: 'good' } as NonNullable<typeof sim.player.school>;
    expect(workRefusal(sim.player, 'us-ny-newyork', sim.now, sim.now + MS_DAY)).toMatch(/F-1 .* not while you study/);
    // Living in the US on it is theirs.
    expect(residenceRefusal(sim.player, 'us-ny-newyork', sim.now)).toBeUndefined();
  });
});

describe('OPT', () => {
  it('opens ninety days before the program ends, costs $470, is decided in its time, and runs twelve months from the later of the end and the approval', () => {
    const sim = graduate('opt', 120);
    expect(optRefusal(sim, sim.player)).toMatch(/It opens/);
    expect(workRefusal(sim.player, 'us-ny-newyork', sim.now + 130 * MS_DAY, sim.now + 131 * MS_DAY)).toMatch(/apply for OPT/);
    sim.advanceBy(31 * MS_DAY);
    const before = bank(sim);
    const a = sim.execute<{ readyAt: number; fee: number }>({ kind: 'documents.apply_opt', payload: {} });
    expect(a.ok).toBe(true);
    expect(before - bank(sim)).toBe(470_00);
    expect(Math.round((a.value!.readyAt - sim.now) / MS_DAY)).toBe(WORK_RULES.opt.standardDays);
    expect(sim.execute({ kind: 'documents.apply_opt', payload: {} }).error).toMatch(/already/);
    // Pending, a student filed in time stays, and doesn't work.
    expect(workRefusal(sim.player, 'us-ny-newyork', sim.now, sim.now + MS_DAY)).toMatch(/being decided/);
    sim.advanceBy(WORK_RULES.opt.standardDays * MS_DAY + MS_HOUR);
    const opt = permit(sim, /OPT/)!;
    expect(opt.status).toBe('valid');
    const end = programEnd(sim.player)!;
    expect(opt.issuedAt).toBe(Math.max(end, a.value!.readyAt));
    expect(opt.expiresAt).toBe(addYears(opt.issuedAt!, 1));
    expect(workRefusal(sim.player, 'us-ny-newyork', opt.issuedAt!, opt.issuedAt! + 30 * MS_DAY)).toBeUndefined();
    // The F-1 and its grace gone, OPT is what lets them live there.
    expect(residenceRefusal(sim.player, 'us-ny-newyork', end + 90 * MS_DAY)).toBeUndefined();
  });

  it('closes sixty days after the program ends', () => {
    const sim = graduate('opt-late', -61);
    expect(optRefusal(sim, sim.player)).toMatch(/It closed/);
  });

  it('is decided in thirty business days with premium processing, for $1,780 more', () => {
    const sim = graduate('opt-premium', 20);
    const a = sim.execute<{ readyAt: number; fee: number }>({ kind: 'documents.apply_opt', payload: { premium: true } });
    expect(a.value!.fee).toBe(2_250_00);
    expect(a.value!.readyAt).toBe(businessDaysOn(sim.now, 30));
    expect(Math.round((a.value!.readyAt - sim.now) / MS_DAY)).toBeGreaterThanOrEqual(40);
    // Approved before the degree ends, it runs from the end, not the approval.
    const early = graduate('opt-early', 80);
    const e = early.execute<{ readyAt: number; fee: number }>({ kind: 'documents.apply_opt', payload: { premium: true } });
    early.advanceBy(e.value!.readyAt - early.now + MS_HOUR);
    expect(permit(early, /OPT/)!.issuedAt).toBe(programEnd(early.player));
  });

  it('ends after more than ninety days in all without work', () => {
    const sim = graduate('opt-idle', 0);
    sim.execute({ kind: 'documents.apply_opt', payload: { premium: true } });
    sim.advanceBy(45 * MS_DAY);
    const opt = permit(sim, /OPT/)!;
    expect(opt.status).toBe('valid');
    sim.advanceBy(84 * MS_DAY);
    expect(opt.status).toBe('valid');
    expect(opt.idleDays).toBeLessThanOrEqual(90);
    sim.advanceBy(14 * MS_DAY);
    expect(opt.status).toBe('cancelled');
    expect(sim.universe.notifications.some((n) => n.title === 'OPT Ended')).toBe(true);
    // A violation leaves no grace: out of status the day it ended (from 2026-10-01).
    expect(opt.endedAt).toBeDefined();
    expect(sim.player.usOutOfStatus).toBe(opt.endedAt);
  }, 60_000);

  it('counts days an agency represents them as work, a performer in business', () => {
    const sim = graduate('opt-agent', 0);
    careerOf(sim.player).agencyId = 'gersh';
    sim.execute({ kind: 'documents.apply_opt', payload: { premium: true } });
    sim.advanceBy(150 * MS_DAY);
    const opt = permit(sim, /OPT/)!;
    expect(opt.status).toBe('valid');
    expect(opt.idleDays).toBe(0);
  }, 60_000);

  it('counts a day on a job as work, not as time between jobs', () => {
    const sim = graduate('opt-working', 0);
    sim.execute({ kind: 'documents.apply_opt', payload: { premium: true } });
    sim.advanceBy(45 * MS_DAY);
    const opt = permit(sim, /OPT/)!;
    const run: Booking = { id: 'run', roleId: 'offb-commercial', cityId: 'us-ny-newyork', starts: sim.now, units: 20, rehearsalWeeks: 0, status: 'worked', dueAt: 0, offeredAt: 0, worked: 0, owed: 0 };
    careerOf(sim.player).bookings.push(run);
    const idle = opt.idleDays ?? 0;
    sim.advanceBy(8 * 7 * MS_DAY);
    expect((opt.idleDays ?? 0) - idle).toBeLessThanOrEqual(3);
  }, 60_000);
});

describe('a free right', () => {
  it('lets an Irish citizen work in the UK on no permission at all, under the Common Travel Area', () => {
    const sim = quickSave({ startLocationId: 'ie-lei-dublin', homeRegionId: 'ie-lei-dublin', livesWhereBorn: true, wealth: 'wealthy' }, 'cta');
    expect(workRefusal(sim.player, 'uk-eng-london', sim.now, sim.now + 30 * MS_DAY)).toBeUndefined();
    expect(workRefusal(sim.player, 'us-ny-newyork', sim.now, sim.now + 30 * MS_DAY)).toMatch(/O-1/);
  });
});

describe('an O-1', () => {
  it('is petitioned by an agency, and approved on three kinds of evidence, for three years, extended a year in its last six months', () => {
    const sim = graduate('o1', -200);
    expect(sim.execute({ kind: 'documents.petition_o1', payload: {} }).error).toMatch(/sign with an agency/);
    const career = careerOf(sim.player);
    // An Irish agency can't petition the US.
    career.agencyId = 'the-agency';
    expect(sim.execute({ kind: 'documents.petition_o1', payload: {} }).error).toMatch(/isn’t American/);
    career.agencyId = 'gersh';
    career.credits.push({ roleId: 'series-hour', year: 2027, cityId: 'us-ny-newyork' }, { roleId: 'guest-hour', year: 2027, cityId: 'us-ny-newyork' });
    earningsOf(sim.player).years['2027'] = { ...(earningsOf(sim.player).years['2027'] ?? {}), acting: UNION_HEALTH.sagThreshold[1]![1] } as never;
    expect(o1Evidence(sim, sim.player).filter((e) => e.met).map((e) => e.key)).toEqual(['lead', 'critical', 'paid']);
    const before = bank(sim);
    const a = sim.execute<{ readyAt: number; fee: number }>({ kind: 'documents.petition_o1', payload: {} });
    expect(a.ok).toBe(true);
    expect(before - bank(sim)).toBe((1_055 + 600 + 300) * 100);
    sim.advanceBy(a.value!.readyAt - sim.now + MS_HOUR);
    const o1 = permit(sim, /O-1/)!;
    expect(o1.status).toBe('valid');
    expect(o1.expiresAt).toBe(addYears(o1.issuedAt!, 3));
    expect(workRefusal(sim.player, 'us-ny-newyork', sim.now, sim.now + YEAR)).toBeUndefined();
    expect(sim.execute({ kind: 'documents.petition_o1', payload: {} }).error).toMatch(/last six months/);
    sim.advanceTo(o1.expiresAt! - 100 * MS_DAY);
    const b = sim.execute<{ readyAt: number; fee: number }>({ kind: 'documents.petition_o1', payload: { premium: true } });
    expect(b.value!.fee).toBe((1_055 + 600 + 300 + 2_965) * 100);
    const was = o1.expiresAt!;
    sim.advanceBy(b.value!.readyAt - sim.now + MS_HOUR);
    const next = documentsOf(sim.player).filter((d) => d.kind === 'permit' && d.name.startsWith('O-1') && d.status === 'valid');
    expect(next).toHaveLength(1);
    expect(next[0]!.expiresAt).toBe(addYears(was, 1));
  }, 120_000);

  it('reads the experts’ letters from three productions whose directors know the work, and a regional theater as a distinguished organization', () => {
    const sim = graduate('o1-stage', -200);
    const credits = careerOf(sim.player).credits;
    credits.push({ roleId: 'lort-b', year: 2027, cityId: 'us-ny-newyork' }, { roleId: 'costar', year: 2027, cityId: 'us-ny-newyork' }, { roleId: 'commercial', year: 2027, cityId: 'us-ny-newyork' });
    expect(o1Evidence(sim, sim.player).filter((e) => e.met).map((e) => e.key)).toEqual(['critical']);
    credits.push({ roleId: 'offb-nonprofit', year: 2027, cityId: 'us-ny-newyork' }, { roleId: 'film-ulb', year: 2027, cityId: 'us-ny-newyork' });
    expect(o1Evidence(sim, sim.player).filter((e) => e.met).map((e) => e.key)).toEqual(['critical', 'experts']);
  });

  it('is denied on less, and the fees are gone', () => {
    const sim = graduate('o1-denied', -200);
    careerOf(sim.player).agencyId = 'gersh';
    careerOf(sim.player).credits.push({ roleId: 'costar', year: 2027, cityId: 'us-ny-newyork' });
    attributesOf(sim, sim.player).recognition = 0;
    const a = sim.execute<{ readyAt: number; fee: number }>({ kind: 'documents.petition_o1', payload: {} });
    sim.advanceBy(a.value!.readyAt - sim.now + MS_HOUR);
    expect(permit(sim, /O-1/)!.status).toBe('cancelled');
    expect(sim.universe.notifications.some((n) => n.title === 'O-1 Petition Denied' && /showed 0/.test(n.body))).toBe(true);
    // Two hundred days past the program with no OPT, and denied: out of status (from 2026-10-01).
    expect(workRefusal(sim.player, 'us-ny-newyork', sim.now, sim.now + MS_DAY)).toMatch(/out of status/);
  });
});

describe('a production in Canada', () => {
  const toronto = (sim: Simulation): Booking => {
    const b: Booking = { id: 'tor', roleId: 'costar', cityId: 'us-ny-newyork', location: 'ca-on-toronto', starts: at(2026, 10, 5, 8), units: 5, rehearsalWeeks: 0, status: 'offered', dueAt: sim.now + 60 * MS_DAY, offeredAt: sim.now, worked: 0, owed: 0 };
    careerOf(sim.player).bookings.push(b);
    return b;
  };

  it('asks a British actor for a C14 permit, applied for ahead, and takes the job once it’s approved', () => {
    const sim = graduate('ca-gb', -200);
    const d = (doc: Partial<PersonDocument> & Pick<PersonDocument, 'id' | 'kind' | 'name' | 'destination'>) => documentsOf(sim.player).push({ issuer: doc.destination!, number: 'X', status: 'valid', issuedAt: sim.now - MS_DAY, expiresAt: sim.now + 3 * YEAR, ...doc });
    d({ id: 'eta', kind: 'authorization', name: 'eTA', destination: 'CA', passportId: 'pp' });
    d({ id: 'o1', kind: 'permit', name: 'O-1B Status', destination: 'US' });
    const b = toronto(sim);
    expect(acceptRefusal(sim, sim.player, b)).toMatch(/work permit/);
    const before = bank(sim);
    const a = sim.execute<{ readyAt: number; fee: number }>({ kind: 'documents.apply_work_permit', payload: { bookingId: 'tor' } });
    expect(a.ok).toBe(true);
    expect(before - bank(sim)).toBe(a.value!.fee);
    sim.advanceBy(a.value!.readyAt - sim.now + MS_HOUR);
    expect(acceptRefusal(sim, sim.player, b)).toBeUndefined();
  });

  it('issues a US citizen’s at the border on arrival, for CAD 155', () => {
    const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'ca-us');
    beginCareer(sim, sim.player);
    sim.player.documents = [{ id: 'pp', kind: 'passport', issuer: 'US', name: 'Passport', number: 'P1', status: 'valid', issuedAt: sim.now - YEAR, expiresAt: sim.now + 8 * YEAR }];
    const b = toronto(sim);
    expect(sim.execute({ kind: 'career.accept', payload: { bookingId: b.id } }).ok).toBe(true);
    expect(documentsOf(sim.player).some((x) => x.kind === 'permit')).toBe(false);
    while (sim.now < at(2026, 10, 5, 12)) sim.advanceTo(Math.min(at(2026, 10, 5, 12), sim.now + 6 * MS_HOUR), { stopOnPlayerRequired: true });
    expect(sim.player.currentLocationId).toBe('ca-on-toronto');
    const issued = documentsOf(sim.player).find((x) => x.kind === 'permit' && x.destination === 'CA')!;
    expect(issued.bookingId).toBe('tor');
    expect(sim.universe.transactions.some((t) => t.category === 'documents' && /at the border/.test(t.memo))).toBe(true);
  }, 60_000);
});

describe('a graduate’s US status, and its end', () => {
  it('holds for 60 days after the program, says so with the way home, and past it leaves them out of status: no work, the F-1 void, the ESTA closed', () => {
    const sim = graduate('status-f1', 5);
    scheduleUsStatus(sim, sim.player);
    const end = programEnd(sim.player)!;
    expect(usStatusEnds(sim.player)).toBe(end + 60 * MS_DAY);
    sim.advanceBy(10 * MS_DAY);
    const decision = Object.values(sim.universe.decisions).find((d) => d.title === 'Your US Status Is Ending');
    expect(decision).toBeDefined();
    expect(decision!.actions.map((a) => a.label)).toEqual(['Apply For OPT', 'Move Home To London']);
    expect(sim.player.usOutOfStatus).toBeUndefined();
    sim.advanceBy(60 * MS_DAY);
    expect(sim.player.usOutOfStatus).toBe(end + 60 * MS_DAY);
    expect(documentsOf(sim.player).find((d) => d.id === 'f1')!.status).toBe('cancelled');
    expect(workRefusal(sim.player, 'us-ny-newyork', sim.now, sim.now + MS_DAY)).toMatch(/out of status/);
    expect(authorizationRefusal(sim.player, 'US', sim.now)).toMatch(/Visa Waiver Program is closed/);
    // An ESTA held from before is closed with it.
    documentsOf(sim.player).push({ id: 'esta', kind: 'authorization', issuer: 'US', name: 'ESTA', number: 'E1', status: 'valid', issuedAt: sim.now - MS_DAY, expiresAt: sim.now + YEAR, destination: 'US', passportId: 'pp' });
    expect(authorizationFor(sim.player, 'US', sim.now)).toBeUndefined();
    sim.player.usOutOfStatus = undefined;
    expect(authorizationFor(sim.player, 'US', sim.now)).toBeDefined();
    expect(o1Refusal(sim, sim.player)).toMatch(/A US employer|out of status/);
  });

  it('holds while OPT runs and 60 days after it, and not at all after OPT ended for time without work', () => {
    const sim = graduate('status-opt', 5);
    documentsOf(sim.player).push({ id: 'opt', kind: 'permit', issuer: 'US', name: 'Employment Authorization, OPT', number: 'O1', status: 'valid', issuedAt: sim.now, expiresAt: sim.now + 200 * MS_DAY, destination: 'US' });
    expect(usStatusEnds(sim.player)).toBe(sim.now + 260 * MS_DAY);
    const opt = documentsOf(sim.player).find((d) => d.id === 'opt')!;
    opt.status = 'cancelled';
    opt.endedAt = sim.now + 30 * MS_DAY;
    expect(usStatusEnds(sim.player)).toBe(Math.max(programEnd(sim.player)! + 60 * MS_DAY, sim.now + 30 * MS_DAY));
    // Pending, it holds open.
    opt.status = 'pending';
    expect(usStatusEnds(sim.player)).toBeUndefined();
  });

  it('isn’t lost by someone who went home in the grace, nor by a citizen', () => {
    const sim = graduate('status-home', 5);
    scheduleUsStatus(sim, sim.player);
    sim.advanceBy(10 * MS_DAY);
    sim.player.home = { ...sim.player.home!, cityId: 'uk-eng-london' };
    sim.player.currentLocationId = 'uk-eng-london';
    sim.advanceBy(70 * MS_DAY);
    expect(sim.player.usOutOfStatus).toBeUndefined();
    const american = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'wealthy' }, 'status-us');
    expect(usStatusEnds(american.player)).toBeUndefined();
  });

  it('sends each home to their own country’s acting city, or where they were born', () => {
    const sim = graduate('status-where', 5);
    expect(homeAbroadOf(sim.player)).toBe('uk-eng-london');
    sim.player.citizenshipId = 'mx';
    expect(homeAbroadOf(sim.player)).toBe('mx-cmx-mexicocity');
    sim.player.citizenshipId = 'ie';
    expect(homeAbroadOf(sim.player)).toBe('ie-lei-dublin');
    sim.player.citizenshipId = 'us';
    expect(homeAbroadOf(sim.player)).toBeUndefined();
  });
});
