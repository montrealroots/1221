/**
 * The life items the audit of 2026-10-10 found working and untested (docs/verification/open-items.json), each proved
 * through its commands and what follows: a plan skipped frees its time; medical debt paid off stops weighing and isn't
 * reported a year on, while a report already made stays; England's prescription prepayment certificate (a LOCATION
 * FIXTURE: a New Haven student can't buy one) makes prescriptions free while it runs; and appetite moves the weight,
 * between matched twins. Each across a save and a load, and none applied twice.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave, quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { lookAfterRefusal } from '@/engine/systems/life';
import { billCare, healthMonth, healthOf, medicalDebtOf, rxShareOf } from '@/engine/systems/health';
import { inTrouble, troubles } from '@/engine/systems/spending';
import { bodyDay, bodyOf } from '@/engine/systems/body';

const student = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const give = (sim: Simulation, accountId: string, amount: number) => sim.post({ memo: 'test', category: 'test', postings: [{ accountId, amount }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -amount }] });
/** TEST SETUP: nothing in the player's own accounts to pay with. */
const drain = (sim: Simulation) => { for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && !a.nominal && a.balance > 0 && (a.kind === 'checking' || a.kind === 'savings' || a.kind === 'cash')) a.balance = 0; };

describe('a plan skipped (the New Haven student’s own calendar)', () => {
  it('frees its time for Look After Yourself, once, across a reload', () => {
    let sim = student('gap-skip');
    for (const i of sim.universe.scheduled) if (i.status === 'pending' && i.requiresPlayer) sim.timeline.cancel(i.id, sim.now);
    const at = sim.now + 3 * MS_HOUR;
    const id = (sim.must<{ id: string }>({ kind: 'calendar.schedule', payload: { title: 'Gym', at, durationMinutes: 120 } })).id;
    sim.advanceTo(at, { stopOnPlayerRequired: true });
    sim = reload(sim);
    Object.assign(sim.player.wellbeing, { energy: 90, hygiene: 30, nourishment: 60 });
    expect(lookAfterRefusal(sim, 'wash')).toMatch(/Gym is at .*there isn’t time/);
    expect(sim.must<{ ok: boolean }>({ kind: 'calendar.skip', payload: { entryId: id } }).ok).toBe(true);
    expect(sim.timeline.get(id)!.status).toBe('missed');
    expect(lookAfterRefusal(sim, 'wash')).toBeUndefined();
    expect(sim.execute({ kind: 'life.look_after', payload: { action: 'wash' } }).ok).toBe(true);
    expect(sim.must<{ ok: boolean; error?: string }>({ kind: 'calendar.skip', payload: { entryId: id } }).error).toBe('That’s already settled one way or the other.');
  });
});

describe('medical debt paid off (the student’s own care bill)', () => {
  /** TEST SETUP: a bill the plan didn't cover, past what the overdraft would pay, gone to debt. */
  const inDebt = (seed: string) => {
    const sim = student(seed);
    drain(sim);
    const bill = billCare(sim, sim.player, 'A care bill', 900_00 * 100, sim.now);
    sim.advanceTo(bill.dueAt + MS_DAY);
    expect(bill.inDebt).toBe(true);
    return { sim, bill };
  };
  const yearOn = (sim: Simulation) => { healthOf(sim.player).debtSince = sim.now - 366 * MS_DAY; healthMonth(sim, sim.player, sim.now); };
  const reports = (sim: Simulation) => sim.universe.notifications.filter((n) => n.title === 'A Medical Debt Is On Your Record').length;

  it('weighs as a money trouble until paid, and paid, neither weighs nor is reported a year on', () => {
    let { sim } = inDebt('gap-debt-paid');
    expect(troubles(sim, sim.player).map((t) => t.kind)).toContain('medical');
    give(sim, sim.player.primaryAccountId!, 1_000_000_00);
    sim.must({ kind: 'health.pay_bill', payload: { amount: -medicalDebtOf(sim, sim.player)!.balance } });
    sim = reload(sim);
    expect(troubles(sim, sim.player).map((t) => t.kind)).not.toContain('medical');
    expect(healthOf(sim.player).debtSince).toBeUndefined();
    yearOn(sim);
    // TEST SETUP put debtSince back to force the check; paid, the debt is nought, and nothing is reported.
    expect(reports(sim)).toBe(0);
    expect(sim.execute({ kind: 'health.pay_bill', payload: { amount: 1 } }).error).toBe('You owe nothing for care.');
  });

  it('unpaid a year, is reported once; paid after, the report stays on the record', () => {
    const { sim } = inDebt('gap-debt-reported');
    const marks = () => (sim.player.credit?.marks ?? []).length;
    const before = marks();
    yearOn(sim);
    yearOn(sim);
    expect(reports(sim)).toBe(1);
    expect(marks()).toBe(before + 1);
    give(sim, sim.player.primaryAccountId!, 1_000_000_00);
    sim.must({ kind: 'health.pay_bill', payload: { amount: -medicalDebtOf(sim, sim.player)!.balance } });
    expect(inTrouble(sim, sim.player) && troubles(sim, sim.player).some((t) => t.kind === 'medical')).toBe(false);
    expect(marks()).toBe(before + 1);
  });
});

describe('England’s prescription prepayment certificate (LOCATION FIXTURE: a life in London, not the New Haven student)', () => {
  it('makes prescriptions free while it runs, and charged again after; a second is refused while it runs', () => {
    let sim = quickSave({ startLocationId: 'uk-eng-london', homeRegionId: 'uk-eng-london', livesWhereBorn: true, wealth: 'comfortable' }, 'gap-ppc');
    const charge = () => rxShareOf(sim.player, false, sim.now, 'GBP');
    expect(charge()).toBeGreaterThan(0);
    const { until } = sim.must<{ until: number }>({ kind: 'health.prepay', payload: { months: 3 } });
    sim = reload(sim);
    expect(charge()).toBe(0);
    expect(sim.execute({ kind: 'health.prepay', payload: { months: 3 } }).error).toBe('Yours has more than a month left to run.');
    sim.advanceTo(until + MS_DAY);
    expect(charge()).toBeGreaterThan(0);
  });

  it('is refused to the New Haven student, who pays no English charge', () => {
    const sim = student('gap-ppc-nh');
    expect(sim.execute({ kind: 'health.prepay', payload: { months: 3 } }).error).toBe('The prepayment certificate is only for England’s prescription charge.');
  });
});

describe('appetite', () => {
  it('moves the weight between matched twins, the hungrier heavier, a day at a time', () => {
    const sim = student('gap-appetite');
    const base = { ...bodyOf(sim, sim.player) };
    const twin = (traits: string[]) => ({ ...sim.player, personalityTraits: traits, body: { ...base } });
    const lean = twin(['disciplined_body']);
    const plain = twin([]);
    const hungry = twin(['indulgent']);
    for (let d = 0; d < 90; d += 1) for (const p of [lean, plain, hungry]) bodyDay(p, sim.now + d * MS_DAY);
    expect(hungry.body.weightKg).toBeGreaterThan(plain.body.weightKg);
    expect(plain.body.weightKg).toBeGreaterThan(lean.body.weightKg);
    // A day is applied once: the day's intake is spent by it, so the same day again moves only by the habit.
    const once = { ...plain, body: { ...plain.body, intake: 500 } };
    bodyDay(once, sim.now);
    expect(once.body.intake).toBe(0);
  });
});
