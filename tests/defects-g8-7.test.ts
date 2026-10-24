/**
 * Five Papers and taxes defects found by the triage of 2026-10-12, each held here (from 2026-10-12): Papers' and the home
 * benefits' prose described the Seguro de Desempleo as claimable and Dublin's HAP and the unions' plans as present; a
 * mailed IRS plan that was refused left the IRS's collection stopped for the rest of the session; an IRS plan began
 * without its setup fee when the bank couldn't cover it; Form 12277's check read the three years after the lien's year,
 * not the last three its refusal names; and the IRS's failure-to-pay penalty went past its 25% on a late return and froze
 * under a payment plan. PLAYER JOURNEYS play through commands; FIXTURES set a state by hand to reach one rule, and say so.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Person } from '@/engine/domain/model';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { RETURN } from '@/engine/content/safetynet';
import { recordWages } from '@/engine/systems/earnings';
import { inTheBank } from '@/engine/systems/spending';
import { desempleoRefusal } from '@/engine/systems/homebenefits';
import { SECTIONS } from '@/ui/shell/sections';
import { PLAN, TAX_NOTICE_KIND, applyPayment, deadline, federalLienWithdrawRefusal, latePenalty, partsOn, planFee, returnsOf, type TaxReturn } from '@/engine/systems/taxreturn';

const NY = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, NY);
const lifeIn = (cityId: string, extra: Record<string, unknown>, seed: string) => quickSave({ startLocationId: cityId, homeRegionId: cityId, ...extra }, seed);
const primary = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;
const fund = (sim: Simulation, amount: number) => sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: primary(sim).id, amount }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -amount }] });
const play = (sim: Simulation, until: number) => { while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR), { stopOnPlayerRequired: true }); };
/** FIXTURE: every account of the player's with money in it emptied, by a posting, so the ledger still balances. */
const empty = (sim: Simulation) => { for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && a.balance > 0 && (a.kind === 'checking' || a.kind === 'savings')) sim.post({ memo: 'TEST SETUP', category: 'test', postings: [{ accountId: a.id, amount: -a.balance }, { accountId: sim.nominalAccount('expense', 'Test').id, amount: a.balance }] }); };
const pendingNotices = (sim: Simulation, year: number) => sim.universe.scheduled.filter((i) => i.kind === TAX_NOTICE_KIND && i.status === 'pending' && i.payload.personId === sim.player.id && i.payload.year === year);
const irsLetters = (sim: Simulation) => sim.universe.notifications.filter((n) => /^(A Reminder From The IRS|A Second Reminder From The IRS|The IRS Intends To Levy|Final Notice Of Intent To Levy)$/.test(n.title));
const feeCharged = (sim: Simulation) => sim.universe.transactions.filter((t) => t.memo === 'IRS payment plan setup fee');

/** A 2026 return filed on time with nothing in the bank, so its balance is owed: $60,000 of wages, past the low-income fee. */
function owingOnTime(seed: string, gross = 60_000_00): Simulation {
  const sim = lifeIn('us-ny-newyork', { wealth: 'wealthy' }, seed);
  recordWages(sim.player, at(2026, 5, 1), NY, { gross });
  play(sim, at(2027, 2, 1, 12));
  empty(sim);
  sim.must({ kind: 'tax.file', payload: { year: 2026 } });
  return sim;
}

/** FIXTURE: no Social Security number, so a plan goes by mail on Form 9465 and is decided in its thirty days. */
const noSsn = (sim: Simulation) => { (sim.player as { citizenshipId?: string }).citizenshipId = 'ie'; };

const ROOT = join(fileURLToPath(new URL('.', import.meta.url)), '..');
const source = (path: string) => readFileSync(join(ROOT, path), 'utf8');

describe('papers-seguro-hap-stale-prose: what Papers and the home benefits say is there', () => {
  it('Papers’ header counts the tabs it has, and names no HAP or unions’ plan as present', () => {
    const papers = source('src/ui/workspaces/PapersWorkspace.tsx');
    const header = papers.slice(0, papers.indexOf('*/'));
    const words: Record<string, number> = { two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7 };
    const said = /in (\w+) tabs/.exec(header)?.[1];
    expect(said && words[said]).toBe(SECTIONS['/workspace/papers']!.length);
    expect(papers).not.toMatch(/Jobseeker's Allowance and HAP in Ireland/);
    expect(papers).not.toMatch(/What covers them, the unions' plans/);
  });

  it('the Seguro takes no new claim, and the home benefits’ header says so; Dublin’s HAP is said to have gone', () => {
    const sim = lifeIn('mx-cmx-mexicocity', {}, 'g87-seguro');
    expect(sim.execute({ kind: 'benefits.claim', payload: {} }).error).toBe(desempleoRefusal());
    const home = source('src/engine/systems/homebenefits.ts');
    const header = home.slice(0, home.indexOf('*/'));
    // The rules a live claim would read, in the present tense, are gone; what's said is when it stopped.
    expect(header).not.toMatch(/the council pays the landlord/);
    expect(header).toMatch(/Seguro de Desempleo[\s\S]*2026-10-09/);
    expect(header).toMatch(/Housing Assistance Payment[\s\S]*went/);
  });
});

describe('taxes-plan-refused-stops-collection: a refused IRS plan resumes the IRS’s letters', () => {
  it('PLAYER JOURNEY: a mailed plan refused on its decision day puts the IRS’s collection back on the calendar', () => {
    const sim = owingOnTime('g87-refused');
    const r = returnsOf(sim.player)['2026']!;
    expect(r.owed).toBeGreaterThan(0);
    noSsn(sim);
    // A week before CP501, so the reminder falls inside Form 9465's thirty days and is held back.
    sim.advanceTo(sim.now + 28 * MS_DAY);
    fund(sim, 100_00);
    const applied = sim.must<{ decideAt: number }>({ kind: 'tax.apply_plan', payload: { kind: 'long' } });
    // FIXTURE: a past-due year left unfiled, which the IRS refuses a plan for on the day it decides.
    returnsOf(sim.player)['2025'] = { year: 2025, due: sim.now - MS_DAY, figures: { ...r.figures, balance: 0, owedTo: { irs: 0, states: {} } } } as never;
    sim.advanceTo(applied.decideAt + MS_HOUR);
    expect(sim.player.taxPlan!.status).toBe('refused');
    expect(pendingNotices(sim, 2026)).toHaveLength(1);
    const refusal = sim.universe.notifications.find((n) => n.title === 'The IRS Declined Your Payment Plan')!;
    expect(refusal.body).toMatch(/your 2025 return isn’t/);
    expect(refusal.body).toMatch(/letters .*start again/);
    const before = irsLetters(sim).length;
    sim.advanceTo(sim.now + 200 * MS_DAY);
    expect(irsLetters(sim).length - before).toBeGreaterThanOrEqual(3);
    expect(r.collection).toBeGreaterThanOrEqual(3);
    expect(sim.ledger.audit()).toEqual([]);
  }, 120_000);
});

describe('taxes-plan-setup-fee-not-charged: an IRS plan’s setup fee leaves the bank, or there’s no plan', () => {
  it('is refused at the application when the bank can’t cover the fee', () => {
    const sim = owingOnTime('g87-fee-apply');
    const fee = planFee(sim, sim.player, 'long', false);
    expect(fee).toBe(PLAN.fee.online);
    expect(inTheBank(sim, sim.player)).toBeLessThan(fee);
    expect(sim.execute({ kind: 'tax.apply_plan', payload: { kind: 'long', directDebit: false } }).error).toMatch(/Your bank can’t cover the \$69\.00 setup fee, so you haven’t applied and nothing was charged\./);
    expect(sim.player.taxPlan).toBeUndefined();
    // A short-term plan has no fee, and an empty bank doesn't stop it.
    sim.must({ kind: 'tax.apply_plan', payload: { kind: 'short' } });
  }, 120_000);

  it('PLAYER JOURNEY: approved online, the fee leaves the bank once', () => {
    const sim = owingOnTime('g87-fee-online');
    fund(sim, 100_00);
    const applied = sim.must<{ decideAt: number; fee: number }>({ kind: 'tax.apply_plan', payload: { kind: 'long', directDebit: false } });
    expect(applied.fee).toBe(PLAN.fee.online);
    sim.advanceTo(applied.decideAt + MS_HOUR);
    expect(sim.player.taxPlan!.status).toBe('active');
    expect(feeCharged(sim).map((t) => t.postings.reduce((s, p) => s + Math.max(0, p.amount), 0))).toEqual([PLAN.fee.online]);
    expect(sim.ledger.audit()).toEqual([]);
  }, 120_000);

  it('PLAYER JOURNEY: mailed, the bank emptied in Form 9465’s thirty days: refused for the fee, nothing charged, collection back', () => {
    const sim = owingOnTime('g87-fee-mail');
    noSsn(sim);
    fund(sim, 100_00);
    const applied = sim.must<{ decideAt: number }>({ kind: 'tax.apply_plan', payload: { kind: 'long', directDebit: false } });
    empty(sim);
    sim.advanceTo(applied.decideAt + MS_HOUR);
    const plan = sim.player.taxPlan!;
    expect(plan.status).toBe('refused');
    expect(plan.why).toMatch(/Your bank couldn’t cover the \$[\d.]+ setup fee, so the plan wasn’t set up\./);
    expect(feeCharged(sim)).toHaveLength(0);
    expect(pendingNotices(sim, 2026)).toHaveLength(1);
    expect(returnsOf(sim.player)['2026']!.reducedFrom).toBeUndefined();
    expect(sim.ledger.audit()).toEqual([]);
  }, 120_000);
});

describe('taxes-federal-lien-withdraw-years: Form 12277 reads the last three years’ returns', () => {
  // FIXTURE: a lien on 2026, released; returns by hand, each filed or left unfiled with a balance.
  const filed = (year: number) => ({ year, due: deadline(year), filedAt: deadline(year) - MS_DAY, figures: { balance: 500_00 } });
  const unfiled = (year: number) => ({ year, due: deadline(year), figures: { balance: 500_00 } });
  const withLien = (returns: Record<string, unknown>) => {
    const lien = { year: 2026, due: deadline(2026), filedAt: deadline(2026), figures: { balance: 20_000_00 }, lien: { name: 'Notice Of Federal Tax Lien', status: 'released', history: [] } };
    const person = { returns: { '2026': lien, ...returns } } as unknown as Person;
    return { person, r: lien as unknown as TaxReturn };
  };

  it('a year among the last three left unfiled refuses it, though the three after the lien’s are filed', () => {
    const { person, r } = withLien({ 2027: filed(2027), 2028: filed(2028), 2029: filed(2029), 2030: filed(2030), 2031: unfiled(2031), 2032: filed(2032) });
    expect(federalLienWithdrawRefusal(person, r, at(2033, 6, 1))).toMatch(/last three years’ returns are filed, and your 2031 return isn’t/);
  });

  it('a year before the last three left unfiled doesn’t, and a year not yet due never does', () => {
    const { person, r } = withLien({ 2027: unfiled(2027), 2030: filed(2030), 2031: filed(2031), 2032: filed(2032) });
    expect(federalLienWithdrawRefusal(person, r, at(2033, 6, 1))).toBeUndefined();
    const early = withLien({ 2030: filed(2030), 2031: filed(2031), 2032: unfiled(2032) });
    expect(federalLienWithdrawRefusal(early.person, early.r, at(2033, 2, 1))).toBeUndefined();
    expect(federalLienWithdrawRefusal(early.person, early.r, at(2033, 6, 1))).toMatch(/your 2032 return isn’t/);
  });
});

describe('taxes-irs-pay-late-accrual: the IRS’s failure-to-pay penalty', () => {
  const TAX = 10_000_00;
  const due = deadline(2026);
  const month = 30.4375 * MS_DAY;

  it('on a return filed late, the share charged with it counts toward the 25%', () => {
    // FIXTURE: filed nine months late, nothing ever paid.
    const filedAt = due + 9 * month - MS_DAY;
    const pen = latePenalty(TAX, due, filedAt);
    const before = Math.min(RETURN.lateCap, RETURN.payLateMonthly * 9);
    const r = { year: 2026, due, figures: { balance: TAX }, filedAt, owed: TAX + pen, parts: { tax: TAX, penalty: pen, interest: 0 }, base: TAX, accruedAt: filedAt } as unknown as TaxReturn;
    for (const m of [12, 48, 60]) {
      const after = (partsOn(r, filedAt + m * month, true).penalty - pen) / TAX;
      expect(before + after).toBeLessThanOrEqual(RETURN.lateCap + 1e-9);
    }
    // And it reaches the cap: the months after filing still charge until it does.
    expect(before + (partsOn(r, filedAt + 60 * month, true).penalty - pen) / TAX).toBeCloseTo(RETURN.lateCap, 9);
  });

  it('under a plan on a return filed on time, it runs at the quarter rate month after month, not once', () => {
    // FIXTURE: filed on time, a plan in force from the due date, a cent paid each month (which brings it up to date).
    const r = { year: 2026, due, figures: { balance: TAX }, filedAt: due - 5 * MS_DAY, owed: TAX, parts: { tax: TAX, penalty: 0, interest: 0 }, base: TAX, accruedAt: due, reducedFrom: due } as unknown as TaxReturn;
    const sim = { now: due, universe: { scheduled: [] }, timeline: { cancel() {} } } as unknown as Simulation;
    const person = { id: 'p' } as unknown as Person;
    for (let m = 1; m <= 12; m += 1) {
      (sim as { now: number }).now = due + m * month - MS_DAY;
      applyPayment(sim, person, r, 1, 'payment');
    }
    const penalty = partsOn(r, sim.now, true).penalty;
    // Twelve months at 0.25% on the tax, less the cents paid: about $300, where it froze at $25.
    expect(penalty).toBeGreaterThan(12 * PLAN.reducedRate * (TAX - 12) - 2);
    expect(penalty).toBeLessThanOrEqual(12 * PLAN.reducedRate * TAX + 1);
  });

  it('PLAYER JOURNEY: a plan’s months on a played return add the quarter rate’s penalty each month', () => {
    const sim = owingOnTime('g87-ftp-plan');
    fund(sim, 100_00);
    const applied = sim.must<{ decideAt: number }>({ kind: 'tax.apply_plan', payload: { kind: 'long', monthly: 500_00, directDebit: false } });
    sim.advanceTo(applied.decideAt + MS_HOUR);
    expect(sim.player.taxPlan!.status).toBe('active');
    fund(sim, 60_000_00);
    const r = () => returnsOf(sim.player)['2026']!;
    // Past the due date and the months the plan began before it.
    sim.advanceTo(at(2027, 9, 1));
    const from = partsOn(r(), sim.now, true);
    sim.advanceTo(sim.now + 6 * 30 * MS_DAY);
    const to = partsOn(r(), sim.now, true);
    expect(sim.player.taxPlan!.status).toBe('active');
    // At least five months at the quarter rate on the tax left at the end, at most seven on the tax at the start.
    expect(to.penalty - from.penalty).toBeGreaterThanOrEqual(5 * PLAN.reducedRate * to.tax);
    expect(to.penalty - from.penalty).toBeLessThanOrEqual(7 * PLAN.reducedRate * from.tax + 1);
    expect(sim.ledger.audit()).toEqual([]);
  }, 120_000);
});
