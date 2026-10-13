/**
 * The final defect pass of 2026-10-13: what was left open after that day’s rounds, each held here through the command a
 * player sends or the clock that carries it, against figures worked out from the bank’s or the rule’s own words. Each
 * failed before its fix, on the break named beside it.
 *
 * - `bank.cancel_new`: a savings account or term deposit canceled in its cooling-off period paid its money straight into
 *   the primary account, whatever bank it was at. It goes now to the current account at its own bank, else to the primary
 *   in the bank’s days, as a term broken early does.
 * - `statements`: a card opened in the life whose statement day was moved before its first statement, putting it more
 *   than a month after the opening, was drawn as two statements, the older a rebuilt one that never came.
 * - `card.due`: a card whose grace runs past the next statement (Nordea’s 30 days) had its due date judge the newer
 *   statement, against what was paid since that one: a February statement paid in full in February was judged on 22 March
 *   as March’s, and autopay took March’s minimum four weeks early and the card lost its grace period.
 * - `school.request_leave`: the five working days to the chair’s and the dean’s decision skipped weekends only, so a
 *   leave asked for on Friday 18 December 2026 was decided on Christmas Day, and one asked for on Wednesday 13 January
 *   2027 counted Martin Luther King Jr. Day. They skip Yale’s holidays and recess days now (“Official Yale Holidays”,
 *   your.yale.edu, read on 2026-10-13), which `yaleHoliday` is held to here for 2026 and 2027 day by day.
 * - The receipts knob’s traits: Chaotic’s cost and Keeps Accounts’ description said an effect of receipts, which decide
 *   nothing in play; their words are held here as the content says them.
 *
 * PLAYER JOURNEYS: a new life (`createSave` with `newLifeConfig`), Ada Cole, an actor at Yale in New Haven from Monday 24
 * August 2026 at 7:30 AM, born in New York, banking at Chase. LIFE FIXTURE, said where it’s made: a Toronto life at TD
 * (`quickSave`, from Monday 5 January 2026), since Canada gives a fourteen-day cooling-off period and its banks pay one
 * another the next business day (Payments Canada’s EFT), and no New Haven life has a cooling-off period;
 * and a Mariehamn life at Nordea (`quickSave`, from Monday 5 January 2026), whose card is due 30 days after its statement.
 * TEST SETUP, said where it’s done: purchases put on a card by a posting against a test income line; for a leave, the
 * day’s needs met as the clock runs, and the flu, as `careFor` gives one, for a physician’s recommendation.
 */
import { describe, expect, it } from 'vitest';
import { createSave, quickSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { periodsOf } from '@/engine/systems/statements';
import { cardOf, stateOf } from '@/engine/systems/credit';
import { healthOf } from '@/engine/systems/health';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { yaleHoliday } from '@/engine/content/usholidays';
import { KNOB_READS, PERSONALITY_TRAIT_BY_ID } from '@/engine/content/personality-traits';
import type { Simulation } from '@/engine/core/simulation';
import type { Account } from '@/engine/core/ledger';

function must<T = unknown>(sim: Simulation, kind: string, payload: Record<string, unknown> = {}): T {
  const r = sim.execute<T>({ kind, payload });
  expect(r.ok, `${kind}: ${r.error}`).toBe(true);
  return r.value as T;
}
const primary = (sim: Simulation): Account => sim.universe.accounts[sim.player.primaryAccountId!]!;
/** What came into an account from another of the holder’s since a moment, a posting of $1,000 or more each. */
const into = (sim: Simulation, account: Account, since: number) => sim.universe.transactions
  .filter((t) => t.at >= since && t.category === 'transfer')
  .flatMap((t) => t.postings.filter((p) => p.accountId === account.id && p.amount >= 1_000_00).map((p) => ({ at: t.at, amount: p.amount })));
const student = (seed: string): Simulation =>
  createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
/** New Haven’s clock: Eastern Daylight Time (UTC−4) until 1 November 2026, Eastern Standard (UTC−5) after. */
const edt = (month: number, day: number, hour: number, minute = 0) => Date.UTC(2026, month - 1, day, hour + 4, minute);
const nhEst = (month: number, day: number, hour: number, minute = 0) => Date.UTC(2026, month - 1, day, hour + 5, minute);
/** Toronto’s clock in January: Eastern Standard Time, UTC−5. */
const est = (month: number, day: number, hour: number, minute = 0) => Date.UTC(2026, month - 1, day, hour + 5, minute);

// ---------------------------------------------------------------------------
// bank.cancel_new
// ---------------------------------------------------------------------------

describe('bank.cancel_new', () => {
  /** LIFE FIXTURE: a Toronto life banking at TD, with an RBC chequing account opened beside it and $5,000 sent across. */
  function rbcBeside(seed: string): { sim: Simulation; td: Account; rbc: Account } {
    const sim = quickSave({ startLocationId: 'ca-on-toronto', homeRegionId: 'ca-on-toronto', livesWhereBorn: true, wealth: 'wealthy', bankId: 'ca-td' }, seed);
    const td = primary(sim);
    expect(td.bankId).toBe('ca-td');
    const rbc = sim.universe.accounts[must<{ accountId: string }>(sim, 'bank.open_current', { bankId: 'ca-rbc' }).accountId]!;
    must(sim, 'bank.transfer', { fromId: td.id, toId: rbc.id, amount: 5_000_00 });
    sim.advanceTo(est(1, 8, 9));
    expect(rbc.balance).toBe(5_000_00);
    return { sim, td, rbc };
  }

  it('pays a canceled RBC savings account into the RBC chequing account beside it, and TD sees none of it', () => {
    const { sim, td, rbc } = rbcBeside('d5-cancel-same');
    const savings = sim.universe.accounts[must<{ accountId: string }>(sim, 'bank.open_savings', { bankId: 'ca-rbc' }).accountId]!;
    must(sim, 'bank.transfer', { fromId: rbc.id, toId: savings.id, amount: 2_000_00 });
    expect(savings.balance).toBe(2_000_00);
    const r0 = rbc.balance;
    const t0 = td.balance;
    expect(must<{ refunded: number }>(sim, 'bank.cancel_new', { accountId: savings.id })).toEqual({ refunded: 2_000_00 });
    // Break: `to` set to the primary (`into`) whatever the bank: the $2,000 lands at TD and RBC’s stays at $3,000.
    expect(rbc.balance - r0).toBe(2_000_00);
    expect(td.balance).toBe(t0);
    expect(savings.balance).toBe(0);
  });

  it('sends a canceled RBC term deposit, with no RBC chequing account left, to the TD primary the next business day', () => {
    const { sim, td, rbc } = rbcBeside('d5-cancel-across');
    const term = sim.universe.accounts[must<{ accountId: string }>(sim, 'bank.open_term', { amount: 4_000_00, bankId: 'ca-rbc' }).accountId]!;
    expect(term.balance).toBe(4_000_00);
    must(sim, 'bank.close_current', { accountId: rbc.id, remainderTo: td.id });
    sim.advanceTo(est(1, 9, 10));
    const since = sim.now;
    // Friday 9 January: canceled at 10 AM (the ,000 left in RBC chequing in at TD an hour before), the ,000 out of RBC at once and
    // into TD at the same hour on Monday 12 January, the next business day.
    expect(must<{ refunded: number }>(sim, 'bank.cancel_new', { accountId: term.id })).toEqual({ refunded: 4_000_00 });
    expect(term.balance).toBe(0);
    sim.advanceTo(est(1, 13, 9));
    // Break: the old straight posting: the $4,000 is at TD the same minute, 10 AM on the 9th.
    expect(into(sim, td, since)).toEqual([{ at: est(1, 12, 10), amount: 4_000_00 }]);
  });
});

// ---------------------------------------------------------------------------
// statements
// ---------------------------------------------------------------------------

describe('statements', () => {
  it('draws a card opened in the life, its day moved before its first statement, as one first statement from its opening', () => {
    const sim = student('d5-first-cycle');
    // A Citi card applied for on Monday 24 August arrives a week on, at 7:30 AM on 31 August, stating on the 20th.
    expect(must<{ approved: boolean }>(sim, 'card.apply', { bankId: 'us-citi' }).approved).toBe(true);
    sim.advanceTo(edt(8, 31, 8));
    const citi = Object.values(sim.universe.accounts).find((a) => a.ownerId === sim.player.id && a.kind === 'credit_card' && a.bankId === 'us-citi')!;
    expect(citi.openedAt).toBe(edt(8, 31, 7, 30));
    // Moved to the 19th before 20 September: the 19th’s first date 27 days or more from the opening (27 September) is
    // 19 October, seven weeks after it.
    must(sim, 'card.set_statement_day', { day: 19, accountId: citi.id });
    sim.advanceTo(edt(10, 20, 9));
    // Break: `firstFromOpening` false: a third period, 31 August to 19 September, “Statement Of September 19, 2026
    // (Rebuilt)”, and the first from 19 September.
    expect(periodsOf(sim, citi).map((p) => ({ from: p.from, to: p.to, label: p.label, rebuilt: p.rebuilt }))).toEqual([
      { from: edt(10, 19, 9), to: nhEst(11, 19, 9), label: 'Statement Of November 19, 2026, So Far', rebuilt: undefined },
      { from: edt(8, 31, 7, 30), to: edt(10, 19, 9), label: 'Statement Of October 19, 2026', rebuilt: undefined },
    ]);
  });
});

// ---------------------------------------------------------------------------
// card.due
// ---------------------------------------------------------------------------

describe('card.due', () => {
  it('judges a Nordea statement due after the next one on its own figures: February’s, paid in full, isn’t taken for March’s', () => {
    const sim = quickSave({ startLocationId: 'ax-211-mariehamn', homeRegionId: 'ax-211-mariehamn', livesWhereBorn: true, wealth: 'comfortable', bankId: 'ax-nordea' }, 'd5-due-after');
    const card = cardOf(sim, sim.player)!;
    expect(card.bankId).toBe('ax-nordea');
    must(sim, 'finance.set_autopay', { mode: 'minimum' });
    const spend = (amount: number) => sim.post({ memo: 'TEST SETUP: purchases', category: 'test', postings: [{ accountId: card.id, amount: -amount }, { accountId: sim.nominalAccount('income', 'Test').id, amount }] });
    const paidIn = () => sim.universe.transactions.filter((t) => t.category === 'card-payment').map((t) => ({ at: t.at, amount: t.postings.find((p) => p.accountId === card.id)!.amount }));
    // Mariehamn’s clock: Eastern European Time (UTC+2), Summer Time (UTC+3) from 29 March.
    const eet = (month: number, day: number, hour: number) => Date.UTC(2026, month - 1, day, hour - 2);
    const eest = (month: number, day: number, hour: number) => Date.UTC(2026, month - 1, day, hour - 3);
    sim.advanceTo(eet(1, 21, 2));
    spend(100_00);
    // The 20 February statement says €100, due 30 days on: 22 March at noon, after the 20 March statement.
    sim.advanceTo(eet(2, 21, 2));
    expect(stateOf(sim.player, card).statementBalance).toBe(100_00);
    expect(must<{ paid: number }>(sim, 'finance.pay_card', { amount: 100_00 }).paid).toBe(100_00);
    sim.advanceTo(eet(2, 25, 2));
    spend(50_00);
    // 20 March: €50 owed; 22 March, February’s due date: its €100 was paid on the 21st, so nothing is taken and the
    // grace period holds. Break: `waited` never found: the due date judges March’s €50 against nothing paid since the
    // 20th, autopay takes its €1.50 minimum (3% of €50) on 22 March, and the card carries.
    sim.advanceTo(eet(3, 23, 9));
    expect(paidIn()).toEqual([{ at: eet(2, 21, 2), amount: 100_00 }]);
    expect(stateOf(sim.player, card).carrying).toBe(false);
    // March’s own due date, 19 April at noon: its €1.50 minimum, taken then.
    sim.advanceTo(eest(4, 19, 13));
    expect(paidIn()).toEqual([{ at: eet(2, 21, 2), amount: 100_00 }, { at: eest(4, 19, 12), amount: 1_50 }]);
    expect(stateOf(sim.player, card).carrying).toBe(true);
    expect(stateOf(sim.player, card).waiting).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// school.request_leave
// ---------------------------------------------------------------------------

describe('school.request_leave', () => {
  /** TEST SETUP: the day’s needs met as the clock runs to a moment, so nothing else wants the player first. */
  const tended = (sim: Simulation, until: number) => {
    while (sim.now < until) {
      Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
      sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
      sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
    }
  };
  /** A medical leave asked for at a moment, the flu given for the physician’s recommendation (TEST SETUP). */
  function askedAt(seed: string, when: number): { decideAt: number; startsNow: boolean } {
    const sim = student(seed);
    tended(sim, when);
    healthOf(sim.player).fluUntil = sim.now + 4 * MS_DAY; // TEST SETUP
    return must<{ decideAt: number; startsNow: boolean }>(sim, 'school.request_leave', { kind: 'medical', reason: 'illness' });
  }

  it('asked on Friday 18 December, isn’t decided on Christmas Day: Yale is closed from the 24th to New Year’s, so the spring term’s start comes first', () => {
    // Yale’s working days from 18 December 2026: the 21st, 22nd and 23rd, then the recess days of 24 and 28 to 31
    // December, Christmas and New Year’s Day, then 4 and 5 January: the fifth is 5 January, after the spring term begins
    // at 8 AM on Monday 4 January, which decides it. Break: `'yale'` taken off the count in `requestLeave`: 25 December.
    // 10 AM EST on 18 December 2026 is 15:00 UTC; 8 AM EST on 4 January 2027 is 13:00 UTC.
    expect(askedAt('d5-leave-christmas', Date.UTC(2026, 11, 18, 15))).toMatchObject({ decideAt: Date.UTC(2027, 0, 4, 13), startsNow: false });
  });

  it('asked on Wednesday 13 January 2027, counts past Martin Luther King Jr. Day: decided on Thursday the 21st, not the 20th', () => {
    // The 14th, 15th, (18th, MLK Day, closed), 19th, 20th, 21st. Break: `'yale'` taken off: the 20th.
    // Noon EST is 17:00 UTC.
    expect(askedAt('d5-leave-mlk', Date.UTC(2027, 0, 13, 17))).toMatchObject({ decideAt: Date.UTC(2027, 0, 21, 17), startsNow: true });
  });
});

describe('Yale’s holidays', () => {
  it('are the nine holidays and six recess days “Official Yale Holidays” lists for 2026 and 2027, and no others', () => {
    // your.yale.edu, “Official Yale Holidays”, read on 2026-10-13.
    const listed = {
      2026: ['2026-01-01', '2026-01-19', '2026-04-03', '2026-05-25', '2026-06-19', '2026-07-03', '2026-09-07', '2026-11-26', '2026-11-27', '2026-12-24', '2026-12-25', '2026-12-28', '2026-12-29', '2026-12-30', '2026-12-31'],
      2027: ['2027-01-01', '2027-01-18', '2027-03-26', '2027-05-31', '2027-06-18', '2027-07-05', '2027-09-06', '2027-11-25', '2027-11-26', '2027-12-24', '2027-12-27', '2027-12-28', '2027-12-29', '2027-12-30', '2027-12-31'],
    };
    for (const year of [2026, 2027] as const) {
      const found: string[] = [];
      for (let t = Date.UTC(year, 0, 1); t < Date.UTC(year + 1, 0, 1); t += MS_DAY) {
        const date = new Date(t).toISOString().slice(0, 10);
        if (yaleHoliday(date)) found.push(date);
      }
      expect(found).toEqual(listed[year]);
    }
  });
});

describe('the receipts knob’s traits', () => {
  it('say no effect of receipts, which decide nothing in play: Chaotic’s cost and Keeps Accounts’ description', () => {
    // Until 2026-10-13 Chaotic cost “receipts go missing at tax time” and Keeps Accounts remembered “every receipt”, where
    // nothing records a cost of the work for a receipt to keep (`recordJobCost` has no caller).
    expect(PERSONALITY_TRAIT_BY_ID.chaotic!.cost).toBe('It shows on you sooner.');
    expect(PERSONALITY_TRAIT_BY_ID.keeps_accounts!.description).toBe('What you’re owed and by whom, down to the coffee, stays remembered.');
    // The knob's own words said it decided nothing now, until 2026-10-14, when the owner had the knob go: neither trait
    // declares it, and no knob reads it.
    expect(Object.keys(KNOB_READS)).not.toContain('receipts');
    expect(PERSONALITY_TRAIT_BY_ID.chaotic!.systemMods).toEqual({ hygieneDrift: 1.3, stressGain: 0.92 });
    expect(PERSONALITY_TRAIT_BY_ID.keeps_accounts!.systemMods).toEqual({ bondWound: 1.1 });
  });
});
