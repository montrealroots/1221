/**
 * Chase's terms, the page `content/cards.ts` cites for its plan fee (LGC61498), say a Chase Pay Over Time plan's
 * monthly fee is "0% of the amount ... selected to create a Chase Pay Over Time plan while in the 0% Intro Purchase
 * APR period", and that the fee "will be determined each time a fee-based plan is created and will remain the same
 * until the plan balance is paid in full". A plan made in the introduction costs nothing for its life.
 *
 * Until 2026-10-12 a plan made on a new Chase card was charged its 1.72% from its first statement. The first fix
 * tried that day waived the fee at each statement while the introduction ran instead, so a plan made in it that ran
 * past it was charged its fee once the introduction ended, or once a payment sixty days late ended it. Measured
 * before the second fix: a $1,200, 12-month plan made with three months of the introduction left was charged six
 * fees, $123.84. The fee is now set when the plan is made (`card.plan`), and the statement charges what the plan
 * carries.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { cardOf, cardTerms, STATEMENT_KIND } from '@/engine/systems/credit';

const lifeAt = (bankId: string, seed: string) =>
  quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'comfortable', bankId }, seed);
const card = (sim: Simulation) => cardOf(sim, sim.player)!;
const give = (sim: Simulation, accountId: string, amount: number) => sim.post({ memo: 'test', category: 'test', postings: [{ accountId, amount }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -amount }] });
const nextStatement = (sim: Simulation) => sim.timeline.pending().find((i) => i.kind === STATEMENT_KIND && i.payload.personId === sim.player.id)!.at;
/** The plan fees posted to the card since `from`. */
const planFees = (sim: Simulation, cardId: string, from: number) => sim.universe.transactions
  .filter((t) => t.at >= from && t.memo === 'Plan fee')
  .map((t) => -t.postings.filter((p) => p.accountId === cardId).reduce((a, p) => a + p.amount, 0));

/** A Chase card opened `monthsAgo` months back, owing $1,000 of purchases, its minimum paid by autopay so a plan outlives its statements. */
function chaseOpened(monthsAgo: number, seed: string): Simulation {
  const sim = lifeAt('us-chase', seed);
  const c = card(sim);
  c.openedAt = sim.now - monthsAgo * 30.44 * MS_DAY;
  sim.player.credit!.autopay = 'minimum';
  give(sim, c.id, -c.balance - 1_000_00);
  return sim;
}

describe('a plan made in Chase’s introduction that runs past it', () => {
  it('is charged no fee at any of its statements, after the introduction as before it', () => {
    // Fourteen months open: the introduction ends about a month from now, and a 3-month plan runs two statements past it.
    const sim = chaseOpened(14, 'r4-chase-past-intro');
    const c = card(sim);
    const terms = cardTerms(sim, c, sim.player.credit!.score);
    expect(terms.apr).toBe(0);
    const from = sim.now;
    sim.must({ kind: 'card.plan', payload: { amount: 600_00, months: 3 } });
    const credit = sim.player.credit!;
    expect(credit.plans).toEqual([{ left: 600_00, monthly: 200_00, fee: 0, monthsLeft: 3 }]);
    const asked: number[] = [];
    for (let i = 0; i < 3; i += 1) {
      sim.advanceTo(nextStatement(sim) + 1000);
      asked.push(credit.statementPlanDue ?? 0);
    }
    // The second and third statements came after the introduction ended.
    expect(sim.now).toBeGreaterThan(terms.introUntil!);
    expect(cardTerms(sim, c, credit.score).apr).toBeGreaterThan(0);
    expect(planFees(sim, c.id, from)).toEqual([]);
    expect(asked).toEqual([200_00, 200_00, 200_00]);
    expect(credit.plans).toEqual([]);
  });

  it('keeps its fee of nothing when a payment sixty days late ends the introduction after it was made', () => {
    const sim = chaseOpened(0, 'r4-chase-lost-after');
    const from = sim.now;
    sim.must({ kind: 'card.plan', payload: { amount: 600_00, months: 3 } });
    sim.player.credit!.introLost = true;
    sim.advanceTo(nextStatement(sim) + 1000);
    expect(planFees(sim, card(sim).id, from)).toEqual([]);
    expect(sim.player.credit!.statementPlanDue).toBe(200_00);
  });
});

describe('a plan made on Chase’s card once the introduction is over', () => {
  it('pays its 1.72% from its first statement, ended on its date or by a payment sixty days late', () => {
    for (const [monthsAgo, lost, seed] of [[16, false, 'r4-chase-after'], [0, true, 'r4-chase-lost-before']] as const) {
      const sim = chaseOpened(monthsAgo, seed);
      if (lost) sim.player.credit!.introLost = true;
      expect(cardTerms(sim, card(sim), sim.player.credit!.score).apr).toBeGreaterThan(0);
      const from = sim.now;
      sim.must({ kind: 'card.plan', payload: { amount: 600_00, months: 3 } });
      expect(sim.player.credit!.plans).toEqual([{ left: 600_00, monthly: 200_00, fee: 10_32, monthsLeft: 3 }]);
      sim.advanceTo(nextStatement(sim) + 1000);
      expect(planFees(sim, card(sim).id, from)).toEqual([10_32]);
      expect(sim.player.credit!.statementPlanDue).toBe(200_00 + 10_32);
    }
  });
});
