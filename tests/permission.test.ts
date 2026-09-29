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
import { acceptRefusal, beginCareer, careerOf, type Booking } from '@/engine/systems/career';
import { addYears, documentsOf, residenceRefusal, type PersonDocument } from '@/engine/systems/documents';
import { earningsOf } from '@/engine/systems/earnings';
import { businessDaysOn, o1Evidence, optRefusal, programEnd, workRefusal } from '@/engine/systems/permission';
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

  it('is denied on less, and the fees are gone', () => {
    const sim = graduate('o1-denied', -200);
    careerOf(sim.player).agencyId = 'gersh';
    careerOf(sim.player).credits.push({ roleId: 'costar', year: 2027, cityId: 'us-ny-newyork' });
    attributesOf(sim, sim.player).recognition = 0;
    const a = sim.execute<{ readyAt: number; fee: number }>({ kind: 'documents.petition_o1', payload: {} });
    sim.advanceBy(a.value!.readyAt - sim.now + MS_HOUR);
    expect(permit(sim, /O-1/)!.status).toBe('cancelled');
    expect(sim.universe.notifications.some((n) => n.title === 'O-1 Petition Denied' && /showed 0/.test(n.body))).toBe(true);
    expect(workRefusal(sim.player, 'us-ny-newyork', sim.now, sim.now + MS_DAY)).toMatch(/O-1/);
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
