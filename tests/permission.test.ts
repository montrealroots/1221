/**
 * Permission to work where one isn't a citizen (docs/WORLD.md, stage 1b):
 * a student's F-1, OPT after the degree and its limit on time between jobs,
 * an O-1 decided on the evidence the career shows, and Canada's work permit
 * for a production, applied for or issued at the border.
 */
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY,MS_HOUR } from '@/engine/core/time';
import { documentsOf } from '@/engine/systems/documents';
import { businessDaysOn,optRefusal,programEnd,usStatusEnds } from '@/engine/systems/permission';
import { describe,expect,it } from 'vitest';
const YEAR = 365.25 * MS_DAY;

/** A British actor living in New York with a passport, whose F-1 ends a number of days from now. */
function graduate(seed: string, programEndsIn: number): Simulation {
  const sim = quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'uk-eng-london', wealth: 'wealthy' }, seed);
  sim.player.documents = [];
  const end = sim.now + programEndsIn * MS_DAY;
  documentsOf(sim.player).push(
    { id: 'pp', kind: 'passport', issuer: 'GB', name: 'Passport', number: 'P1', status: 'valid', issuedAt: sim.now - YEAR, expiresAt: sim.now + 8 * YEAR },
    { id: 'f1', kind: 'visa', issuer: 'US', name: 'F-1 Student Visa', number: 'F1', status: 'valid', issuedAt: sim.now - 2 * YEAR, expiresAt: end + 60 * MS_DAY, destination: 'US', passportId: 'pp' },
  );
  if (sim.player.school) sim.player.school.standing = 'graduated';
  return sim;
}
const permit = (sim: Simulation, name: RegExp) => documentsOf(sim.player).find((d) => d.kind === 'permit' && name.test(d.name));

describe('OPT', () => {

  it('closes sixty days after the program ends', () => {
    const sim = graduate('opt-late', -61);
    expect(optRefusal(sim, sim.player)).toMatch(/The time to apply closed/);
  });

  it('is decided in thirty business days with premium processing, for $1,780 more', () => {
    const sim = graduate('opt-premium', 20);
    const a = sim.execute<{ readyAt: number; fee: number }>({ kind: 'documents.apply_opt', payload: { premium: true } });
    expect(a.value!.fee).toBe(2_250_00);
    // Thirty days the Federal Government is open: no weekend and no federal holiday (8 CFR 106.4). Until 2026-10-13 this
    // held the weekday-only count, which here counted Martin Luther King Jr. Day and Washington's Birthday, two days early.
    expect(a.value!.readyAt).toBe(businessDaysOn(sim.now, 30, true));
    expect(a.value!.readyAt - businessDaysOn(sim.now, 30)).toBe(2 * MS_DAY);
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
});

// The O-1 and a production in Canada were tested here until the career went in the scope reset of 2026-10-09.

describe('a graduate’s US status, and its end', () => {

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
});
