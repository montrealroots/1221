/**
 * Papers and the international student, completed (from 2026-10-10, after the audit in
 * docs/verification/papers-bank-audit.json and the research in research-student-status.json). PLAYER JOURNEYS play
 * through commands; FIXTURES set a state by hand to reach one rule, and say so.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { checkingsOf } from '@/engine/systems/lending';
import { hasSsn, SSN } from '@/engine/systems/taxid';
import { courseworkOf } from '@/engine/systems/coursework';
import { figuresFor, nonresidentFor, nonresidentDeadline, taxableSocialSecurity } from '@/engine/systems/taxreturn';
import { recordInterest, recordWages, yearOf } from '@/engine/systems/earnings';
import { changeDeposits } from '@/engine/systems/routing';
import { payeeAccount } from '@/engine/systems/cash';
import { periodsOf } from '@/engine/systems/statements';
import { documentsOf } from '@/engine/systems/documents';
import { f1Of } from '@/engine/systems/permission';
import { mayEnroll } from '@/engine/systems/health';
import { registered } from '@/engine/systems/school';

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, zone);
const make = (seed: string, extra: Record<string, unknown> = {}) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
const international = (seed: string, extra: Record<string, unknown> = {}) => make(seed, { homeRegionId: 'uk-eng-london', ...extra });
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };

describe('PLAYER JOURNEY: an international student’s banks and Social Security number', () => {
  it('starts at a bank that opens for an F-1, is refused by Capital One, opens at Wells Fargo in a branch, and applies for the number once registered', () => {
    let sim = international('pc-f1', { bankId: 'us-capital-one' });
    expect(f1Of(sim.player)).toBeDefined();
    expect(sim.universe.accounts[sim.player.primaryAccountId!]!.bankId).not.toBe('us-capital-one');
    expect(hasSsn(sim.player)).toBe(false);
    expect(sim.execute({ kind: 'bank.open_current', payload: { bankId: 'us-capital-one' } }).error).toMatch(/US citizens and permanent residents/);
    expect(sim.execute({ kind: 'bank.open_current', payload: { bankId: 'us-citi' } }).error).toMatch(/US citizens and permanent residents/);
    // Before registering, no on-campus work to apply on.
    expect(sim.execute({ kind: 'documents.apply_ssn', payload: {} }).error).toMatch(/Register at the School first/);
    // Wells Fargo, without a number: in a branch, an hour there.
    const before = sim.now;
    const wells = sim.execute<{ accountId: string }>({ kind: 'bank.open_current', payload: { bankId: 'us-wells-fargo', fundFrom: sim.player.primaryAccountId, amount: 25_00 } });
    expect(wells.ok, wells.error).toBe(true);
    expect(sim.now - before).toBeGreaterThanOrEqual(60 * 60_000);
    // Orientation's registration, then the office.
    tended(sim, at(2026, 8, 30, 12));
    expect(registered(sim.player.school, courseworkOf(sim, sim.player))).toBe(true);
    const applied = sim.must<{ arrivesAt: number }>({ kind: 'documents.apply_ssn', payload: {} });
    expect(applied.arrivesAt - sim.now).toBe(SSN.days * MS_DAY);
    expect(sim.execute({ kind: 'documents.apply_ssn', payload: {} }).error).toMatch(/applied/);
    sim = reload(sim);
    tended(sim, applied.arrivesAt + MS_HOUR);
    expect(hasSsn(sim.player)).toBe(true);
    expect(sim.universe.notifications.some((n) => n.title === 'Your Social Security Card Has Arrived')).toBe(true);
  });

  it('a US citizen holds a number already, and opens online, no branch hour', () => {
    const sim = make('mv-second', { bankId: 'us-chase' });
    expect(hasSsn(sim.player)).toBe(true);
    expect(sim.execute({ kind: 'documents.apply_ssn', payload: {} }).error).toMatch(/citizen/);
    const before = sim.now;
    sim.must({ kind: 'bank.open_current', payload: { bankId: 'us-capital-one' } });
    expect(sim.now).toBe(before);
  });
});

describe('registration', () => {
  it('unregistered, classes don’t count them and a shift can’t be worked; catching it up late counts them from then', () => {
    const sim = make('pc-unregistered');
    // FIXTURE: away from New Haven over orientation's week, so its sessions are missed.
    sim.player.currentLocationId = 'us-ny-newyork';
    tended(sim, at(2026, 8, 30, 20));
    sim.player.currentLocationId = 'us-ct-newhaven';
    expect(registered(sim.player.school, courseworkOf(sim, sim.player))).toBe(false);
    tended(sim, at(2026, 8, 31, 17));
    expect(sim.player.school!.tally.attended).toBe(0);
    expect(sim.universe.notifications.some((n) => n.title === 'Not Registered')).toBe(true);
    sim.must({ kind: 'school.orientation', payload: { task: 'register' } });
    expect(sim.player.school!.registeredAt).toBeDefined();
    tended(sim, at(2026, 9, 1, 17));
    expect(sim.player.school!.tally.attended).toBe(1);
  });
});

describe('the nonresident’s return', () => {
  it('an F-1 student files a 1040-NR: no standard deduction, the banks’ interest left out, no FICA; Form 8843 alone with no income, by 15 June', () => {
    const sim = international('pc-nra');
    expect(nonresidentFor(sim.player, 2026)).toBe(true);
    // FIXTURE: a year's work-study and the banks' interest, recorded as the payday and the month's end record them.
    recordWages(sim.player, at(2026, 10, 1), zone, { gross: 3_000_00, workStudy: true });
    recordInterest(sim.player, at(2026, 10, 1), zone, 500_00);
    const nra = figuresFor(sim.player, 2026);
    expect(nra.form).toBe('1040-NR');
    expect(nra.income).toBe(3_000_00 + (yearOf(sim.player, 2026).scholarship ?? 0));
    expect(nra.federal).toBeGreaterThan(0);
    expect(nra.payroll).toBe(0);
    const citizen = make('pc-ra');
    recordWages(citizen.player, at(2026, 10, 1), zone, { gross: 3_000_00, workStudy: true });
    expect(figuresFor(citizen.player, 2026).form).toBeUndefined();
    expect(figuresFor(citizen.player, 2026).federal).toBe(0);
    expect(new Date(nonresidentDeadline(2026, false)).toISOString().slice(0, 10)).toBe('2027-06-16');
  });
});

describe('unemployment', () => {
  it('pays a noncitizen nothing without permission to work in the US', () => {
    const sim = international('pc-ui');
    // FIXTURE: dismissed in the spring, past the Summer Cabaret's paid weeks.
    Object.assign(sim.player.school!, { standing: 'dismissed', endedAt: sim.now });
    expect(sim.execute({ kind: 'benefits.claim', payload: {} }).error).toMatch(/permission to work|base period/);
  });
});

describe('where Yale’s payroll pays', () => {
  it('moves to the new account after one weekly pay cycle, other payers after the fourteen days', () => {
    const sim = make('mv-move', { bankId: 'us-chase' });
    const chase = sim.player.primaryAccountId!;
    const cap = sim.must<{ accountId: string }>({ kind: 'bank.open_current', payload: { bankId: 'us-capital-one' } }).accountId;
    changeDeposits(sim, sim.player, cap);
    sim.advanceTo(sim.now + 8 * MS_DAY);
    expect(payeeAccount(sim, sim.player, 'yale-payroll').id).toBe(cap);
    expect(payeeAccount(sim, sim.player).id).toBe(chase);
    sim.advanceTo(sim.now + 7 * MS_DAY);
    expect(payeeAccount(sim, sim.player).id).toBe(cap);
  });
});

describe('bank history and cards', () => {
  it('a closed account’s statements end at its closing; a second bank’s debit card can be locked', () => {
    const sim = make('mv-exploit', { bankId: 'us-chase' });
    const cap = sim.must<{ accountId: string }>({ kind: 'bank.open_current', payload: { bankId: 'us-capital-one' } }).accountId;
    tended(sim, sim.now + 12 * MS_DAY);
    sim.must({ kind: 'card.lock', payload: { which: 'debit', locked: true, accountId: checkingsOf(sim, sim.player).find((a) => a.bankId === 'us-chase')!.id } });
    expect(checkingsOf(sim, sim.player).find((a) => a.bankId === 'us-chase')!.plastic?.locked).toBe(true);
    sim.must({ kind: 'bank.close_current', payload: { accountId: cap } });
    const closedAt = sim.universe.accounts[cap]!.closedAt!;
    tended(sim, sim.now + 70 * MS_DAY);
    const periods = periodsOf(sim, sim.universe.accounts[cap]!);
    expect(periods[0]!.to).toBe(closedAt);
    expect(periods[0]!.label).toMatch(/To Its Closing/);
  });
});

describe('papers and cover', () => {
  it('a lost passport leaves the F-1 status held; enrolling in a plan is refused while Yale Health covers', () => {
    const sim = international('pc-passport');
    const passport = documentsOf(sim.player).find((d) => d.kind === 'passport')!;
    sim.must({ kind: 'documents.report_lost', payload: { documentId: passport.id } });
    expect(f1Of(sim.player)!.status).toBe('valid');
    tended(sim, at(2026, 9, 2));
    expect(mayEnroll(sim.player, sim.now).why).toMatch(/Yale Health covers you/);
  });
});

describe('Social Security on the return', () => {
  it('is taxed in part, by provisional income (IRC 86): none under $25,000, half past it, 85% past $34,000', () => {
    expect(taxableSocialSecurity(20_000_00, 10_000_00)).toBe(0);
    expect(taxableSocialSecurity(20_000_00, 20_000_00)).toBe(Math.round((30_000_00 - 25_000_00) / 2));
    expect(taxableSocialSecurity(20_000_00, 80_000_00)).toBe(Math.round(0.85 * 20_000_00));
  });
});
