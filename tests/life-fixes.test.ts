/**
 * The life and health repairs of 2026-10-10, each held by the behavior it fixed: a medical bill unpaid when due is
 * owed as debt and not read as settled; a therapy session slept through is missed, not paid; switching treatment on
 * pays the month's care or lapses; Look After is refused from a hospital bed and a workout with the flu; a decision
 * acted on once isn't acted on again; an injury at work pays workers' compensation; a starved body's end isn't
 * redrawn away; and a night's sleep asks for a number of hours.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, formatDate } from '@/engine/core/time';
import { saveCurrency } from '@/engine/core/money';
import { DENIALS, billCare, careFor, coverOn, healthOf, medicalDebtOf, monthCareCost } from '@/engine/systems/health';
import { COMP_KIND, mayHurt } from '@/engine/systems/injury';
import { lookAfterRefusal } from '@/engine/systems/life';
import { starvedPastTheLimit } from '@/engine/systems/mortality';
import { redrawIfChanged } from '@/engine/systems/birthdays';
import { bodyOf } from '@/engine/systems/body';

const life = (seed: string) => quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', wealth: 'wealthy' }, seed);
/** TEST SETUP: nothing in the player's own accounts to pay with. */
const give = (sim: Simulation, accountId: string, amount: number) => sim.post({ memo: 'test', category: 'test', postings: [{ accountId, amount }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -amount }] });
const drain = (sim: Simulation) => { for (const a of Object.values(sim.universe.accounts)) if (a.ownerId === sim.player.id && !a.nominal && a.balance > 0 && (a.kind === 'checking' || a.kind === 'savings' || a.kind === 'cash')) a.balance = 0; };

describe('a medical bill unpaid when it falls due', () => {
  it('is owed as debt and not settled, until the debt is paid', () => {
    const sim = life('fix-bill');
    drain(sim);
    const bill = billCare(sim, sim.player, 'A test visit', 50_000_00, sim.now);
    sim.advanceTo(bill.dueAt + MS_DAY);
    expect(bill.paid).toBeFalsy();
    expect(bill.inDebt).toBe(true);
    expect(medicalDebtOf(sim, sim.player)!.balance).toBeLessThanOrEqual(-50_000_00);
    // The debt paid off, the bill is settled.
    give(sim, sim.player.primaryAccountId!, 60_000_00);
    sim.must({ kind: 'health.pay_bill', payload: { amount: -medicalDebtOf(sim, sim.player)!.balance } });
    expect(bill.paid).toBe(true);
    expect(bill.inDebt).toBeUndefined();
  });

  it('denied, gone to debt, and overturned on appeal, comes off the debt and isn’t refunded', () => {
    // TEST SETUP: a marketplace claim denied, searching seeds for one the appeal overturns.
    for (let i = 0; i < 80; i += 1) {
      const sim = life(`fix-appeal-${i}`);
      healthOf(sim.player).marketplace = { from: sim.now - MS_DAY, state: 'ny' };
      if (coverOn(sim.player, sim.now) !== 'marketplace') continue;
      const bill = careFor(sim, sim.player, { care: 'visit', what: 'A checkup' }, sim.now);
      if (!bill?.denied || sim.rng('health.appeal', sim.player.id, bill.id).next() < DENIALS.upheld) continue;
      // TEST SETUP: a bill past what the overdraft would cover, and nothing in the bank.
      bill.amount = 50_000_00;
      drain(sim);
      sim.advanceTo(bill.dueAt + MS_DAY);
      expect(bill.inDebt).toBe(true);
      const owed = -medicalDebtOf(sim, sim.player)!.balance;
      const r = sim.must<{ decidedAt: number }>({ kind: 'health.appeal', payload: { billId: bill.id } });
      sim.advanceTo(r.decidedAt + 60_000);
      expect(bill.denied!.outcome).toBe('overturned');
      expect(-medicalDebtOf(sim, sim.player)!.balance).toBeLessThan(owed);
      expect(sim.universe.transactions.some((t) => t.memo.startsWith('Appeal won') && t.postings.some((p) => p.accountId === sim.player.primaryAccountId && p.amount > 0))).toBe(false);
      return;
    }
    throw new Error('no claim denied and overturned in 80 seeds');
  });
});

describe('a therapy session', () => {
  it('slept through is missed and held next week, not paid', () => {
    const sim = life('fix-therapy');
    (healthOf(sim.player).chronic ??= {}).depression = { treated: false };
    const r = sim.must<{ first: number }>({ kind: 'health.therapy', payload: { therapist: 'The Center for CBT' } });
    sim.advanceTo(r.first - 60_000);
    sim.player.awakeSince = r.first + 3 * 3_600_000;
    sim.advanceTo(r.first + 60_000);
    expect(sim.universe.transactions.filter((t) => t.memo === 'The Center for CBT, a session')).toHaveLength(0);
    expect(sim.player.therapy!.done).toBe(0);
    expect(sim.universe.scheduled.some((i) => i.status === 'pending' && i.at === r.first + 7 * MS_DAY)).toBe(true);
  });
});

describe('treatment switched on', () => {
  it('pays the month’s care then', () => {
    const sim = life('fix-treat');
    delete sim.player.therapy;
    (healthOf(sim.player).chronic ??= {}).depression = { treated: false };
    const cost = monthCareCost(sim, sim.player, 'depression', sim.now, saveCurrency(sim.universe));
    expect(cost).toBeGreaterThan(0);
    sim.must({ kind: 'health.treat', payload: { condition: 'depression', on: true } });
    expect(healthOf(sim.player).chronic!.depression!.lapsed).toBe(false);
    expect(sim.universe.transactions.filter((t) => t.memo === 'Care for depression')).toHaveLength(1);
    // Off and on again the same day pays again: the toggle no longer clears a lapse, or skips a month, for nothing.
    sim.must({ kind: 'health.treat', payload: { condition: 'depression', on: false } });
    sim.must({ kind: 'health.treat', payload: { condition: 'depression', on: true } });
    expect(sim.universe.transactions.filter((t) => t.memo === 'Care for depression')).toHaveLength(2);
  });
});

describe('Look After Yourself', () => {
  it('is refused from a hospital bed, and a workout with the flu', () => {
    const sim = life('fix-look');
    Object.assign(sim.player.wellbeing, { energy: 90, nourishment: 50, hygiene: 40 });
    const h = healthOf(sim.player);
    h.inHospitalUntil = sim.now + MS_DAY;
    expect(lookAfterRefusal(sim, 'wash')).toBe('Not from a hospital bed.');
    expect(lookAfterRefusal(sim, 'exercise')).toBe('Not from a hospital bed.');
    h.inHospitalUntil = undefined;
    h.fluUntil = sim.now + 3 * MS_DAY;
    // The day it passes said (from 2026-10-20, brief 17).
    const flu = `Not with the flu: rest until it passes on ${formatDate(sim.now + 3 * MS_DAY, sim.zone)}.`;
    expect(lookAfterRefusal(sim, 'exercise')).toBe(flu);
    expect(lookAfterRefusal(sim, 'wash')).not.toBe(flu);
  });
});

describe('a decision', () => {
  it('acted on once, or dismissed, isn’t acted on again', () => {
    const sim = life('fix-decision');
    sim.requireDecision({ urgency: 50, category: 'test', title: 'Sleep', detail: 'A test', dueAt: sim.now + 30 * MS_DAY, refType: 'test', refId: 'one', actions: [{ label: 'Sleep', commandKind: 'life.sleep', payload: { hours: 1 } }] });
    const id = Object.values(sim.universe.decisions).find((d) => d.refId === 'one')!.id;
    sim.universe.decisions[id]!.resolvedAt = sim.now;
    expect(sim.execute({ kind: 'world.take_decision_action', payload: { decisionId: id, actionIndex: 0 } }).error).toBe('That question is already settled: it was answered, or its date passed.');
    delete sim.universe.decisions[id]!.resolvedAt;
    sim.universe.decisions[id]!.dismissedAt = sim.now;
    expect(sim.execute({ kind: 'world.take_decision_action', payload: { decisionId: id, actionIndex: 0 } }).error).toBe('You dismissed that question, so it can’t be answered from What Needs You.');
  });

  it('runs its command past the same guards as the command given directly', () => {
    const sim = life('fix-guard');
    sim.guardCommands((c) => (c.kind === 'life.sleep' ? 'Held by the guide.' : undefined));
    sim.requireDecision({ urgency: 50, category: 'test', title: 'Sleep', detail: 'A test', dueAt: sim.now + 30 * MS_DAY, refType: 'test', refId: 'two', actions: [{ label: 'Sleep', commandKind: 'life.sleep', payload: { hours: 1 } }] });
    const id = Object.values(sim.universe.decisions).find((d) => d.refId === 'two')!.id;
    expect(sim.execute({ kind: 'world.take_decision_action', payload: { decisionId: id, actionIndex: 0 } }).error).toBe('Held by the guide.');
  });
});

describe('an injury at work', () => {
  it('schedules workers’ compensation and pays it while off', () => {
    const sim = life('fix-comp');
    let hurt;
    for (let i = 0; i < 400 && !hurt?.offWorkUntil; i += 1) {
      healthOf(sim.player).injury = undefined;
      hurt = mayHurt(sim, sim.player, 'stage', 1, sim.now + i * 60_000, { cityId: 'us-ct-newhaven', weeklyWage: 450_00 });
    }
    expect(hurt?.offWorkUntil).toBeDefined();
    expect(hurt!.atWork).toBeDefined();
    expect(sim.universe.scheduled.some((i) => i.kind === COMP_KIND && i.status === 'pending')).toBe(true);
    sim.advanceTo(hurt!.offWorkUntil! + MS_DAY);
    expect(sim.universe.transactions.some((t) => t.memo === 'Workers’ compensation')).toBe(true);
  });
});

describe('a starved body’s end', () => {
  it('stands through a redraw of the year’s chance', () => {
    const sim = life('fix-starved');
    sim.player.body = { ...bodyOf(sim, sim.player), weightKg: 25 };
    expect(starvedPastTheLimit(sim, sim.player)).toBe(true);
    const h = healthOf(sim.player);
    h.endBand = -10;
    redrawIfChanged(sim, sim.player);
    expect(sim.universe.scheduled.some((i) => i.status === 'pending' && i.payload.cause === 'starved')).toBe(true);
  });
});

describe('a night’s sleep', () => {
  it('asks for a number of hours, and a start within the day ahead', () => {
    const sim = life('fix-sleep');
    expect(sim.execute({ kind: 'life.sleep', payload: { hours: Number.NaN } }).error).toBe('Say how long to sleep.');
    expect(sim.execute({ kind: 'life.sleep', payload: { hours: 8, startAt: sim.now + 3 * MS_DAY } }).error).toBe('A night can be planned a day ahead at most.');
  });
});
