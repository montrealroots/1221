/**
 * Brief 20's money area: the defects its audit confirmed, each held by a test that failed before its repair
 * (docs/verification/audit-2026-10-21/areas/money/REPORT.md has each failing run).
 *
 * - Short For A Payment told the player an account was short for a card's autopay, or a loan's payment, that the savings
 *   linked to it would pay, and to move money in: the alert read the account's own balance, where the payment draws the
 *   account and the easy-access savings linked at its bank (`payCard`, `autopayReach` in `systems/credit.ts`;
 *   `drawFromBank` for a loan in `systems/lending.ts`). A notice describing a shortfall that wasn't there (D1). It reads
 *   now what the payment would draw, the link included where the payment draws it; a standing order, which the link
 *   doesn't pay, is read as before. With the link off, the alert still comes.
 * - Iceland's assessment gave back interest tax a customer abroad never paid: on 1 June the bank refunded the tax on the
 *   first 300,000 kr of last year's interest at the resident's 22%, to a Reykjavík-raised student keeping her account at
 *   Arion from New Haven, whose interest had 12% taken at source as a customer abroad's (`NON_RESIDENT_TAX`). The
 *   allowance is a resident's, as `interestAllowanceLeft` already said for the tax taken; the refund now reads it the same
 *   way, and a customer abroad's 12% stays taken.
 * - A loan's payment day drifted: each payment was set a calendar month after the one before, so a loan taken on 31
 *   October was paid on 30 November, 30 December, 30 January, 28 February and the 28th for good. A lender's payment
 *   schedule, disclosed when the loan is made (Reg Z §1026.18(g)), is a day of each month: each payment now falls on the
 *   day the loan was taken, or the month's last day where the month is shorter.
 *
 * PLAYER JOURNEYS: new lives as creation makes them (`newLifeConfig`), Ada Cole, born in New York, a US citizen, an
 * actor at Yale in New Haven from Monday 24 August 2026 at 7:30 AM, with the wealthy family's money, at Citi, where Yale's
 * work-study pays $138 each Friday; and a Reykjavík-raised student who kept her account at Arion (Before Yale), her
 * wealthy family's savings kept there. Nothing is set by hand. Seeds: b20-money-alert, b20-money-loan, b20-money-iceland.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadPlacesFor } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';
import { newLifeConfig, newLifeFrom, type NewSaveConfig } from '@/engine/world/bootstrap';
import { instantFromZoned, MS_DAY } from '@/engine/core/time';
import { cardsOf } from '@/engine/systems/credit';

const NY = 'America/New_York';
const at = (y: number, m: number, d: number, h = 12) => instantFromZoned({ year: y, month: m, day: d, hour: h }, NY);
const life = (seed: string, bankId = 'us-citi'): Simulation => createSave(1, seed, {
  ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', bankId,
});
const own = (sim: Simulation, kind: Account['kind']): Account => Object.values(sim.universe.accounts)
  .find((a) => a.ownerId === sim.player.id && a.kind === kind && !a.closedAt && !a.nominal && a.category !== 'term' && a.category !== 'personal')!;
const run = <T = unknown>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}): T => {
  const answer = sim.execute<T>({ kind, payload });
  expect(answer.ok, `${kind}: ${answer.error}`).toBe(true);
  return answer.value as T;
};
const short = (sim: Simulation, since: number) => sim.universe.notifications.filter((n) => n.at >= since && n.title.startsWith('Short For A Payment'));

describe('Short For A Payment reads what the payment would draw', () => {
  it('says nothing of a card’s autopay that linked savings will pay, which then pays it; with the link off it says the account is short, and autopay bounces', () => {
    const linked = life('b20-money-alert');
    const unlinked = life('b20-money-alert');
    for (const sim of [linked, unlinked]) run(sim, 'bank.set_payments', { everyday: 'credit' });
    run(linked, 'bank.set_payments', { linkSavings: true });
    // The 20 September statement's autopay is due 15 October; three days before, checking goes into savings.
    for (const sim of [linked, unlinked]) {
      sim.advanceTo(at(2026, 10, 12));
      run(sim, 'bank.transfer', { fromId: own(sim, 'checking').id, toId: own(sim, 'savings').id, amount: own(sim, 'checking').balance });
    }
    const since = at(2026, 10, 12);
    for (const sim of [linked, unlinked]) sim.advanceTo(at(2026, 10, 15, 13));
    const card = (sim: Simulation) => cardsOf(sim, sim.player)[0]!;
    const paidFrom = (sim: Simulation) => sim.universe.transactions.filter((t) => t.at >= since && t.memo === `Paid ${card(sim).name}`)
      .flatMap((t) => t.postings.filter((p) => p.amount < 0).map((p) => p.accountId));
    // Linked: the savings paid it, and nothing said checking was short.
    expect(paidFrom(linked)).toEqual([own(linked, 'savings').id]);
    expect(short(linked, since)).toEqual([]);
    // Unlinked: told once, three days ahead, and the autopay bounced.
    expect(short(unlinked, since).map((n) => n.at)).toEqual([at(2026, 10, 13, 0)]);
    expect(short(unlinked, since)[0]!.body).toContain('The Citi Double Cash Card’s autopay');
    expect(paidFrom(unlinked)).toEqual([]);
    expect(unlinked.universe.notifications.filter((n) => n.at >= since && n.title === 'A Card Payment Bounced')).toHaveLength(1);
  });

  it('says nothing of a loan’s payment that linked savings will pay, and a standing order, which the link doesn’t pay, is still said short', () => {
    const sim = life('b20-money-alert');
    sim.advanceTo(at(2026, 10, 31, 10));
    run(sim, 'bank.borrow', { amount: 2_000_00, months: 24 });
    run(sim, 'bank.set_payments', { linkSavings: true });
    run(sim, 'bank.add_standing_order', { toId: own(sim, 'savings').id, amount: 50_00, day: 30 });
    const since = sim.now;
    // Both fall on 30 November; two days before, after Friday's wages, checking goes into savings. Until then checking
    // holds the order's $50 and not the loan's $92.52 with it.
    sim.advanceTo(at(2026, 11, 28));
    run(sim, 'bank.transfer', { fromId: own(sim, 'checking').id, toId: own(sim, 'savings').id, amount: own(sim, 'checking').balance });
    sim.advanceTo(at(2026, 11, 30, 13));
    const said = short(sim, since);
    expect(said.filter((n) => n.body.includes('Loan'))).toEqual([]);
    expect(said.filter((n) => n.body.includes('standing order')).map((n) => n.at)).toEqual([at(2026, 11, 29, 0)]);
    // The loan's payment went, from the linked savings; the standing order didn't.
    const loanPaid = sim.universe.transactions.filter((t) => t.at >= since && t.category === 'loan_payment');
    expect(loanPaid).toHaveLength(1);
    expect(loanPaid[0]!.postings.filter((p) => p.amount < 0).map((p) => p.accountId)).toEqual([own(sim, 'savings').id]);
    expect(sim.universe.notifications.filter((n) => n.at >= since && n.title === 'A Standing Order Didn’t Go')).toHaveLength(1);
  });
});

describe('a loan’s payment day', () => {
  it('stays the day the loan was taken, or the month’s last day where the month is shorter, a year on', () => {
    const sim = life('b20-money-loan');
    sim.advanceTo(at(2026, 10, 31, 10));
    run(sim, 'bank.borrow', { amount: 2_000_00, months: 24 });
    sim.advanceTo(at(2027, 11, 1));
    const days = sim.universe.transactions.filter((t) => t.category === 'loan_payment').map((t) => t.at);
    expect(days).toEqual([
      at(2026, 11, 30, 10), at(2026, 12, 31, 10), at(2027, 1, 31, 10), at(2027, 2, 28, 10), at(2027, 3, 31, 10), at(2027, 4, 30, 10),
      at(2027, 5, 31, 10), at(2027, 6, 30, 10), at(2027, 7, 31, 10), at(2027, 8, 31, 10), at(2027, 9, 30, 10), at(2027, 10, 31, 10),
    ]);
    // Twelve payments and twelve months' interest, one each, none twice.
    expect(sim.universe.transactions.filter((t) => t.category === 'loan_interest')).toHaveLength(12);
    expect(days.every((d, i) => i === 0 || d - days[i - 1]! >= 28 * MS_DAY)).toBe(true);
  });
});

describe('Iceland’s interest tax refund', () => {
  it('gives a customer abroad nothing back on 1 June: the 12% taken at source from her Arion interest stays taken', async () => {
    const sim = createSave(1, 'b20-money-iceland', newLifeFrom({
      homeRegionId: 'is-39-reykjavik', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', wealth: 'wealthy', bankId: 'us-chase',
      priorResidence: { cityId: 'is-39-reykjavik', fromYear: 2010, fromMonth: 6 }, homeBankId: 'is-arion', savingsAtHome: true,
    } as Partial<NewSaveConfig>));
    await loadPlacesFor(sim.universe);
    sim.advanceTo(at(2027, 6, 3));
    const arion = new Set(Object.values(sim.universe.accounts).filter((a) => a.bankId === 'is-arion').map((a) => a.id));
    const line = (t: { postings: { accountId: string; amount: number }[] }, name: string) => t.postings.filter((p) => sim.universe.accounts[p.accountId]?.name === name).reduce((n, p) => n + p.amount, 0);
    const interest2026 = sim.universe.transactions.filter((t) => t.category === 'interest' && t.at < at(2027, 1, 1, 0) && t.postings.some((p) => arion.has(p.accountId)));
    // Last year's interest at Arion was taxed at the customer abroad's 12%, each month to the nearest unit.
    const gross = -interest2026.reduce((n, t) => n + line(t, 'Interest'), 0);
    const taken = interest2026.reduce((n, t) => n + line(t, 'Tax On Interest'), 0);
    expect(gross).toBeGreaterThan(0);
    expect(Math.abs(taken - gross * 0.12)).toBeLessThan(interest2026.length * 2);
    // And none of it comes back at the assessment.
    expect(sim.universe.transactions.filter((t) => t.memo === 'Tax on interest refunded at assessment')).toEqual([]);
    expect(sim.universe.notifications.filter((n) => n.title === 'Tax On Interest Refunded')).toEqual([]);
  });
});
