/**
 * Chase's plan words (`content/cards.ts`) say its plan costs "0% during the 15-month intro period, then up to 1.72%
 * of the plan amount per month", and its terms, the page those words were read from (LGC61498), say how: a plan made
 * "while in the 0% Intro Purchase APR period" has a monthly fee of 0%, and a plan's fee "will be determined each time
 * a fee-based plan is created and will remain the same until the plan balance is paid in full". Until 2026-10-12 a
 * plan made on a new Chase card was charged its 1.72% at every statement from the first, while the card's purchases
 * were still at 0%, and The Card's Offers said the fee was a month's.
 *
 * The first fix that day waived the fee at each statement while the introduction ran, and this file asserted that
 * rule: a plan made in the introduction was charged its fee once the introduction ended, on its date or by a payment
 * sixty days late. That was the wrong rule, and the cases below that asserted it were changed to the terms' (each says
 * so). A plan made in Chase's introduction now carries no fee for its life (`PLAN_FREE_IN_INTRO` in
 * `systems/cardoffers.ts`, set in `card.plan`); one made after it pays its fee from the start. Bank of America's words
 * promise no such thing, and its plan pays its fee from the start. `defects-r4-1.test.ts` has a plan made in the
 * introduction that runs past it.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { formatMoney, saveCurrency } from '@/engine/core/money';
import { formatDate, MS_DAY } from '@/engine/core/time';
import { cardOf, cardTerms, STATEMENT_KIND } from '@/engine/systems/credit';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation }));

vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});

const { BankCardOffers } = await import('@/ui/bank/BankCardOffers');

const lifeAt = (bankId: string, seed: string) =>
  quickSave({ startLocationId: 'us-ny-newyork', homeRegionId: 'us-ny-newyork', livesWhereBorn: true, wealth: 'comfortable', bankId }, seed);
const card = (sim: Simulation) => cardOf(sim, sim.player)!;
const give = (sim: Simulation, accountId: string, amount: number) => sim.post({ memo: 'test', category: 'test', postings: [{ accountId, amount }, { accountId: sim.nominalAccount('income', 'Test').id, amount: -amount }] });
const nextStatement = (sim: Simulation) => sim.timeline.pending().find((i) => i.kind === STATEMENT_KIND && i.payload.personId === sim.player.id)!.at;
/** What the card was charged in plan fees since `from`. */
const planFees = (sim: Simulation, cardId: string, from: number) => sim.universe.transactions
  .filter((t) => t.at >= from && t.memo === 'Plan fee')
  .reduce((sum, t) => sum - t.postings.filter((p) => p.accountId === cardId).reduce((a, p) => a + p.amount, 0), 0);
const text = (sim: Simulation) => { h.sim = sim; return renderToStaticMarkup(createElement(BankCardOffers, { bankId: card(sim).bankId! })).replace(/<[^>]+>/g, ' '); };

/**
 * A new card, its fifteen introductory months ahead of it, owing $1,000 of purchases, $600 of them made a 3-month
 * plan; with `lostFirst`, a payment sixty days late has ended the introduction before the plan is made.
 */
function newCardWithPlan(bankId: string, seed: string, lostFirst = false): { sim: Simulation; from: number } {
  const sim = lifeAt(bankId, seed);
  const c = card(sim);
  c.openedAt = sim.now;
  // Autopay of the minimum, so the plan outlives its first statement: paid in full, the plan goes with the balance.
  sim.player.credit!.autopay = 'minimum';
  if (lostFirst) sim.player.credit!.introLost = true;
  give(sim, c.id, -c.balance - 1_000_00);
  const from = sim.now;
  sim.must({ kind: 'card.plan', payload: { amount: 600_00, months: 3 } });
  return { sim, from };
}

describe('a plan on Chase’s card during its introduction', () => {
  it('is made with no fee while the card’s purchases are at 0%, and keeps none once the introduction ends', () => {
    const { sim, from } = newCardWithPlan('us-chase', 'g15-chase-intro');
    const c = card(sim);
    const terms = cardTerms(sim, c, sim.player.credit!.score);
    expect(terms.apr).toBe(0);
    expect(terms.introUntil).toBeGreaterThan(nextStatement(sim));
    const credit = sim.player.credit!;
    expect(credit.plans).toEqual([{ left: 600_00, monthly: 200_00, fee: 0, monthsLeft: 3 }]);
    sim.advanceTo(nextStatement(sim) + 1000);
    expect(planFees(sim, c.id, from)).toBe(0);
    expect(credit.statementPlanDue).toBe(200_00);
    // The introduction over (sixteen months open), the plan made in it still pays no fee. Until the second fix of
    // 2026-10-12 this half asserted a $10.32 fee here, the first fix's rule; Chase's terms fix the fee when the plan's
    // made.
    c.openedAt -= 16 * 30.44 * MS_DAY;
    expect(cardTerms(sim, c, credit.score).apr).toBeGreaterThan(0);
    const after = sim.now;
    sim.advanceTo(nextStatement(sim) + 1000);
    expect(credit.plans).toEqual([{ left: 200_00, monthly: 200_00, fee: 0, monthsLeft: 1 }]);
    expect(planFees(sim, c.id, after)).toBe(0);
    expect(credit.statementPlanDue).toBe(200_00);
  });

  it('keeps no fee when a payment sixty days late ends the introduction after it was made', () => {
    // Until the second fix of 2026-10-12 this case was "is charged its fee once a payment sixty days late has ended
    // the introduction", and asserted a $10.32 fee on a plan made while the introduction was in force: the first
    // fix's rule, which Chase's terms contradict.
    const { sim, from } = newCardWithPlan('us-chase', 'g15-chase-lost');
    sim.player.credit!.introLost = true;
    sim.advanceTo(nextStatement(sim) + 1000);
    expect(planFees(sim, card(sim).id, from)).toBe(0);
    expect(sim.player.credit!.statementPlanDue).toBe(200_00);
  });

  it('is charged its fee when made after a payment sixty days late has ended the introduction', () => {
    const { sim, from } = newCardWithPlan('us-chase', 'g15-chase-lost-first', true);
    expect(cardTerms(sim, card(sim), sim.player.credit!.score).apr).toBeGreaterThan(0);
    expect(sim.player.credit!.plans).toEqual([{ left: 600_00, monthly: 200_00, fee: 10_32, monthsLeft: 3 }]);
    sim.advanceTo(nextStatement(sim) + 1000);
    expect(planFees(sim, card(sim).id, from)).toBe(10_32);
    expect(sim.player.credit!.statementPlanDue).toBe(200_00 + 10_32);
  });

  it('isn’t free on Bank of America’s card, whose words promise no such thing', () => {
    const { sim, from } = newCardWithPlan('us-bank-of-america', 'g15-boa-intro');
    expect(cardTerms(sim, card(sim), sim.player.credit!.score).apr).toBe(0);
    sim.advanceTo(nextStatement(sim) + 1000);
    expect(planFees(sim, card(sim).id, from)).toBe(10_32);
    expect(sim.player.credit!.statementPlanDue).toBe(200_00 + 10_32);
  });
});

describe('The Card’s Offers on a plan during Chase’s introduction', () => {
  it('says a plan made in the introduction is free, and one made after costs 1.72% of it a month', () => {
    // Until the second fix of 2026-10-12 this asserted "nothing until <date>, then $10 a month in place of interest"
    // on the plan, a fee no statement would charge it, and an offer of "nothing until <date>, ... then 1.72% of it a
    // month", as though a plan made now would pay its fee after the date.
    const { sim } = newCardWithPlan('us-chase', 'g15-chase-words');
    const until = formatDate(cardTerms(sim, card(sim), sim.player.credit!.score).introUntil!, sim.zone);
    const words = text(sim);
    expect(words).toContain('with no fee and no interest');
    expect(words).toContain(`A plan made while the introductory rate lasts, until ${until}, is free for its whole life. One made after that costs 1.72% of the plan a month`);
    expect(words).not.toMatch(/nothing until/);
  });

  it('says the fee is a month’s on a plan made once the introduction has ended, and offers 1.72% a month', () => {
    // Until the second fix of 2026-10-12 this ended the introduction after the plan was made and asserted its fee
    // on the screen, the first fix's rule; the plan here is made after the introduction's end.
    const { sim } = newCardWithPlan('us-chase', 'g15-chase-words-after', true);
    const fee = formatMoney(10_32, saveCurrency(sim.universe), { cents: false });
    const words = text(sim);
    expect(words).toContain(`with a ${fee} monthly fee instead of interest`);
    expect(words).toContain('equal monthly amounts, for a fee of 1.72% of the plan a month instead of interest. That’s the most the bank says it charges.');
    expect(words).not.toMatch(/is free to its last month|nothing until/);
  });
});
