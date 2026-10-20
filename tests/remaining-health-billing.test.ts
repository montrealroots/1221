/**
 * Health billing's remaining work, the integration pass of 2026-10-16 (`docs/verification/remaining/
 * health-billing-checklist.json`): a change of cover back in time, HUSKY D kept at renewal through work, and the insured
 * paths traced from enrollment to the bill's payment.
 *
 * What changed that day, and what these tests hold:
 * - `repriceCare`, run when Yale Health's cover is canceled back to its insurance term's start (a withdrawal by the
 *   fifteenth day of classes) or bought back on a leave (Affiliate cover), said that nothing already on a statement was
 *   rewritten, and that the plan's part followed the cover. Neither held: an open bill's share was cut in place and,
 *   cut to nothing, read Settled though nobody paid it; its plan part was rewritten; care first billed uninsured and then
 *   covered back carried no plan part at all, its share and the plan's short of the price; the plan part was read from
 *   whether a plan covered her, not whether it paid that care; and a credit on care whose bill had gone to medical debt
 *   was paid back to the bank while the debt stood. Since then a bill as issued stands, and each change is a line of its
 *   own (`adjusts`): more owed billed on it, less owed its credit, off the bill still open (kept on it as `credited`),
 *   then off the debt, then back to the bank; the plan's change on it, below nothing where the plan takes its part back.
 * - The care log keeps the plan's part of every piece of care (`planPaid`), a $0 visit's too, which makes no bill.
 * - A program kept at renewal says so (“Your Public Cover Is Renewed”), naming the month that met HUSKY D's work rules.
 *
 * Every figure is worked here from the rule, never asked of the engine's helper:
 * - a doctor's visit is SLATE's $100 of 2024 grown by the BLS physicians' services index, 417.93 (2024) to 439.389
 *   (2026): 10,000 × 439.389 ÷ 417.93 = 10,513.47, $105.13; the uninsured are billed 1.75 times it, $183.98;
 * - an emergency is $2,450 of 2019 grown by the hospital services index, 245,000 × 459.659 ÷ 338.814 = 332,383.99,
 *   $3,323.84; Yale Health leaves $50 of it, and pays $3,273.84;
 * - urgent care in 2027 is $180 of 2024 grown to 2027 at the index's 1.75% a year past 2026, 439.389 × 1.0175 =
 *   447.0783: 18,000 × 447.0783 ÷ 417.93 = 19,255.38, $192.55; uninsured, × 1.75, $336.96; Yale Health leaves $0;
 * - Access Health CT's Standard Silver leaves a visit its $45 copay, and pays $105.13 − $45 = $60.13; its benchmark
 *   premium is $706.00 a month in 2026; HUSKY D and Covered Connecticut leave $0, and pay the $105.13;
 * - Connecticut's hospital charity is free to 250% of the poverty line; a student's income in the twelve months to
 *   September 2026 is a few weeks' interest, under 2026's $15,960 × 2.5;
 * - Fair Haven's wait is 24 days, Yale Health's the next weekday, at ten; a bill is due 30 days on.
 *
 * PLAYER JOURNEYS: new lives as the creation screen's draft makes them (`newLifeFrom`), Ada Cole, born in New York, at
 * Yale in New Haven from Monday 24 August 2026, played by the clock and the commands the screens send; Papers rendered
 * where a line is read. One jump and the same span day by day, with a reload in it, are compared whole. Seeds are
 * arbitrary.
 *
 * TEST SETUP and FIXTURE, said again where each is done: every week's illness draw forced to nothing but the care a
 * test asks for, and a kept visit's referral and a claim's denial to none, as tests/scope-health.test.ts forces them;
 * America's holiday file read from disk, as the app fetches it; the coursework done and the student tended at the
 * School, as tests/scope-cover.test.ts plays her; a program held from before a new life began, wages posted by hand,
 * and a bank emptied, each where no played life reaches the state.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement, type FunctionComponent } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { readFileSync } from 'node:fs';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, type Instant } from '@/engine/core/time';
import { newLifeFrom, type NewSaveConfig, type StartingWealth } from '@/engine/world/bootstrap';
import { coverOn, healthOf, medicalDebtOf, repriceCare } from '@/engine/systems/health';
import { appointmentsOf } from '@/engine/systems/appointments';
import { addCountryHolidays } from '@/engine/content/holidays';
import { PREP_DIMS } from '@/engine/content/coursework';
import { courseworkOf } from '@/engine/systems/coursework';
import { earningsOf } from '@/engine/systems/earnings';

const h = vi.hoisted(() => ({
  sim: undefined as unknown as import('@/engine/core/simulation').Simulation,
  tabs: {} as Record<string, string>,
}));
vi.mock('@/ui/kept', async (orig) => {
  const real = await orig<typeof import('@/ui/kept')>();
  return { ...real, useKept: <T,>(key: string, initial: T) => [(h.tabs[key] ?? initial) as T, () => undefined] as const };
});
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({
    get sim() { return h.sim; },
    version: 0,
    run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }),
    toast: noop,
    navigate: noop,
    standingAt: null,
  } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});
const { PapersWorkspace } = await import('@/ui/workspaces/PapersWorkspace');

// TEST SETUP: the holiday file the app fetches for a save's countries when it opens, read from disk.
addCountryHolidays('us', readFileSync('public/holidays/us.tsv', 'utf8'));

const ZONE = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0): Instant => instantFromZoned({ year, month, day, hour, minute }, ZONE);
const onScreen = (html: string) => html.replace(/\stitle="[^"]*"/g, '').replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
function papers(sim: Simulation): string {
  h.sim = sim;
  h.tabs = { 'tab:/workspace/papers': 'health' };
  return onScreen(renderToStaticMarkup(createElement(PapersWorkspace as FunctionComponent)));
}

const life = (seed: string, wealth: StartingWealth) =>
  createSave(1, seed, newLifeFrom({ homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', wealth, bankId: 'us-capital-one' } as Partial<NewSaveConfig>));
const freeze = (sim: Simulation): string => JSON.stringify(sim.universe);
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const memoed = (sim: Simulation, memo: RegExp) => sim.universe.transactions.filter((t) => memo.test(t.memo));
/** Care's own refunds: the health category's, not the Yale Health premium's the School refunds on a withdrawal. */
const careRefunds = (sim: Simulation) => sim.universe.transactions.filter((t) => t.category === 'health' && /^Refund: /.test(t.memo));
const checking = (sim: Simulation) => sim.universe.accounts[sim.player.primaryAccountId!]!;
const mine = (sim: Simulation, kind: string) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id && !a.nominal && !a.closedAt && a.kind === kind);
const into = (t: { postings: { accountId: string; amount: number }[] }, accountId: string) => t.postings.filter((p) => p.accountId === accountId).reduce((s, p) => s + p.amount, 0);

/**
 * TEST SETUP: every week's illness draw a "no" but the weeks named, each forced to the draws given in `illnessWeek`'s
 * order (a stay, an emergency, a visit, the flu and whether it's seen at urgent care); a kept visit's referral and a
 * claim's denial "no". Applied to a save each time it's opened, since a loaded save draws afresh.
 */
const rigged = (weeks: [Instant, number[]][]) => (sim: Simulation): Simulation => {
  const forced = new Map<string, number[]>([['health.illness', []], ['health.referral', []], ['health.denial', []]]);
  for (const [week, values] of weeks) forced.set(['health.illness', sim.player.id, String(week)].join('|'), values);
  const real = sim.rng.bind(sim);
  Object.assign(sim, {
    rng: (stream: string, ...keys: (string | number)[]) => {
      const values = forced.get([stream, ...keys].join('|')) ?? forced.get(stream);
      const d = real(stream, ...keys);
      if (!values) return d;
      let i = 0;
      return { ...d, next: () => values[i++] ?? 0.999 };
    },
  });
  return sim;
};
const VISIT = [0.999, 0.999, 0];
const EMERGENCY_AND_VISIT = [0.999, 0, 0];
const EMERGENCY = [0.999, 0];
const FLU_AT_URGENT_CARE = [0.999, 0.999, 0.999, 0, 0];
/** TEST SETUP: the work done each midnight, every open piece's every part prepared, as tests/scope-cover.test.ts does it. */
const working = (sim: Simulation): Simulation => {
  sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => {
    for (const a of courseworkOf(s, s.player)?.assignments ?? []) if (a.status === 'open' || a.status === 'revising') for (const d of PREP_DIMS) a.prep[d] = Math.max(a.prep[d] ?? 0, 0.95);
  });
  return sim;
};
/** TEST SETUP: rested, fed, steady and awake each time the clock moves, six hours at a time. */
const tend = (sim: Simulation, until: Instant) => {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
};
const withdrawn = (sim: Simulation, when = at(2026, 8, 25, 12)): Simulation => {
  sim.advanceTo(when);
  expect(sim.must<{ early: boolean }>({ kind: 'school.withdraw', payload: { confirm: true } }).early).toBe(true);
  return sim;
};
const setSavings = (sim: Simulation, balance: number) => {
  const savings = mine(sim, 'savings')[0]!;
  const gap = balance - savings.balance;
  if (gap !== 0) sim.must({ kind: 'bank.transfer', payload: gap > 0 ? { fromId: checking(sim).id, toId: savings.id, amount: gap } : { fromId: savings.id, toId: checking(sim).id, amount: -gap } });
};
/** TEST SETUP: a month's work posted as wages, as tests/scope-cover.test.ts posts it. */
const wagesPosted = (sim: Simulation, when: Instant, gross: number, hours: number) => {
  sim.advanceTo(when);
  sim.post({ memo: `TEST SETUP wages, ${hours} hours`, category: 'salary', postings: [{ accountId: checking(sim).id, amount: gross }, { accountId: sim.nominalAccount('income', 'Wages').id, amount: -gross }] });
};

/** What a save holds of health, compared whole between twins: the record, the notices, the money moved for it. */
const healthState = (sim: Simulation) => ({
  record: healthOf(sim.player),
  notices: sim.universe.notifications.filter((n) => n.category === 'health').map((n) => [n.at, n.title, n.body]),
  money: sim.universe.transactions.filter((t) => t.category === 'health').map((t) => [t.at, t.memo, t.postings.map((p) => [p.accountId, p.amount])]),
});
/** The same span played in one jump and day by day, a reload in the middle of the second, each opened with `rig`: the two compared whole. */
function jumpAgainstSteps(snap: string, from: Instant, until: Instant, rig: (sim: Simulation) => Simulation): Simulation {
  const jump = rig(loadSave(JSON.parse(snap) as never));
  jump.advanceTo(until);
  let steps = rig(loadSave(JSON.parse(snap) as never));
  let reloaded = false;
  for (let t = from + MS_DAY; t < until; t += MS_DAY) {
    steps.advanceTo(t);
    if (!reloaded && t >= from + (until - from) / 2) { steps = rig(loadSave(JSON.parse(freeze(steps)) as never)); reloaded = true; }
  }
  steps.advanceTo(until);
  expect(reloaded).toBe(true);
  expect(healthState(steps)).toEqual(healthState(jump));
  return jump;
}

// ---------------------------------------------------------------------------
// 1. A change of cover back in time: the bill as issued stands, a line of its own carries the change
// ---------------------------------------------------------------------------

describe('repriceCare: a bill as issued stands, and a change of cover is a line of its own', () => {
  /** A Wealthy family's student; the 31 August week draws an emergency and a visit (TEST SETUP). */
  const WEEK = at(2026, 8, 31, 9);
  const rig = rigged([[WEEK, EMERGENCY_AND_VISIT]]);

  it('PLAYER JOURNEY: an emergency and a $0 visit Yale Health paid in the fall’s first week; withdrawn on 8 September, the cover canceled back to 1 August: the emergency’s $50 bill stands, a line credits it and takes the plan’s $3,273.84 back; the visit gets a line of $183.98, the plan’s $105.13 back; paid once on its due day, the same in one jump as day by day', () => {
    const sim = rig(life('rhb-reprice-w', 'wealthy'));
    sim.advanceTo(at(2026, 9, 2, 12));
    const h0 = healthOf(sim.player);
    const er = h0.bills.find((b) => b.what.startsWith('The emergency room'))!;
    expect([er.amount, er.covered]).toEqual([50_00, { price: 3_323_84, planPaid: 3_273_84 }]);
    expect(Math.round(2_450_00 * 459.659 / 338.814)).toBe(3_323_84);
    // The visit: booked at Yale Health the next weekday, Tuesday 1 September at ten, had at $0; no bill, the plan's
    // $105.13 kept on the care log.
    expect(Math.round(100_00 * 439.389 / 417.93)).toBe(105_13);
    const visit = h0.careLog!.find((e) => e.care === 'visit')!;
    expect([visit.at, visit.share, visit.planPaid, visit.billId]).toEqual([at(2026, 9, 1, 10), 0, 105_13, undefined]);
    expect(h0.careLog!.find((e) => e.care === 'emergency')!.planPaid).toBe(3_273_84);

    // Withdrawn by the fifteenth day of classes: the cover canceled back to 1 August.
    sim.advanceTo(at(2026, 9, 8, 12));
    sim.must({ kind: 'school.withdraw', payload: { confirm: true } });
    expect(coverOn(sim.player, at(2026, 9, 1, 10))).toBeUndefined();
    // The charity: twelve months' income against 2026's line, under 250%, so an uninsured emergency is free.
    const year = Object.values(earningsOf(sim.player).months).reduce((s, v) => s + v, 0);
    expect(year).toBeLessThan(15_960_00 * 2.5);
    const h1 = healthOf(sim.player);
    const issued = h1.bills.find((b) => b.id === er.id)!;
    // The emergency's bill as issued: its share $50.00 (now a balance of $0.00, credited $50.00) and its plan part.
    expect(issued).toMatchObject({ amount: 0, credited: 50_00, paid: true, covered: { price: 3_323_84, planPaid: 3_273_84 } });
    const lines = h1.bills.filter((b) => /canceled back/.test(b.what));
    expect(lines.map((b) => [b.adjusts ?? null, b.amount, b.credit ?? null, b.covered, b.paid ?? false, b.aid ?? null])).toEqual([
      [er.id, 0, 50_00, { price: 3_323_84, planPaid: -3_273_84 }, true, 'screened'],
      [null, 183_98, null, { price: 105_13, planPaid: -105_13 }, false, null],
    ]);
    // Each care's lines sum to its share now, and its plan part to the plan's now: $0 and $0 for the emergency, the
    // charity taking all of it; $183.98 and $0 for the visit, uninsured.
    const lineOf = (care: string) => h1.careLog!.find((e) => e.care === care)!;
    expect([lineOf('emergency').share, lineOf('emergency').planPaid]).toEqual([0, 0]);
    expect(issued.amount + issued.credited! - lines[0]!.credit!).toBe(0);
    expect(issued.covered!.planPaid + lines[0]!.covered!.planPaid).toBe(0);
    expect([lineOf('visit').share, lineOf('visit').planPaid, lineOf('visit').billId]).toEqual([183_98, 0, lines[1]!.id]);
    expect(Math.round(105_13 * 1.75)).toBe(183_98);
    expect(titled(sim, 'Care Billed Again').map((n) => n.body)).toEqual(['Yale Health cover canceled back to the insurance term’s start, on withdrawing: the care you’ve had since August 1, 2026 has been priced again. You owe $133.98 more, on a new bill.']);
    // Nothing went back to the bank: the credit came off the bill still open.
    expect(careRefunds(sim)).toEqual([]);
    // Papers: the issued bill shows what's left of the share it was issued at, and Credited; the line, its credit
    // below nothing and the plan's part taken back.
    const text = papers(sim);
    expect(text).toContain('$0.00 of $50.00 Credited');
    expect(text).toContain('-$50.00 Credited');
    expect(text).toContain('-$3,273.84');
    expect(text).toContain('$183.98 October 8, 2026');

    // Paid once, on its due day: one jump to 9 November against the same span day by day.
    const snap = freeze(sim);
    const done = jumpAgainstSteps(snap, sim.now, at(2026, 11, 9, 12), rig);
    const paid = memoed(done, /^Medical bill: /);
    expect(paid.map((t) => [t.at, into(t, checking(done).id)])).toEqual([[at(2026, 10, 8, 12), -183_98]]);
    expect(healthOf(done.player).bills.find((b) => b.id === lines[1]!.id)!.paid).toBe(true);
    // The same window repriced again changes nothing: no line, no money.
    const before = healthOf(done.player).bills.length;
    expect(repriceCare(done, done.player, at(2026, 8, 1, 0), at(2026, 9, 8, 12), 'again')).toBe(0);
    expect(healthOf(done.player).bills).toHaveLength(before);
  }, 300_000);

  it('PLAYER JOURNEY: on a personal leave without Affiliate cover, the flu at urgent care in the 25 January week (TEST SETUP) is billed $336.96 uninsured; Affiliate cover bought the next day credits all of it off the open bill, and the plan’s $192.55 is written on its line: $0 + $192.55, its price; nothing paid or refunded, across a reload', () => {
    const sim = working(rigged([[at(2027, 1, 25, 9), FLU_AT_URGENT_CARE]])(life('rhb-leave', 'wealthy')));
    tend(sim, at(2027, 1, 12, 12));
    const asked = sim.must<{ decideAt: Instant }>({ kind: 'school.request_leave', payload: { kind: 'personal', reason: 'family' } });
    tend(sim, asked.decideAt + MS_HOUR);
    expect(sim.player.school!.leave).toMatchObject({ status: 'on', kind: 'personal' });
    expect(coverOn(sim.player, sim.now)).toBeUndefined();
    sim.advanceTo(at(2027, 1, 25, 12));
    const h0 = healthOf(sim.player);
    const urgent = h0.bills.find((b) => /urgent care/i.test(b.what))!;
    // $180 of 2024 at 2027's prices, 18,000 × 447.0783 ÷ 417.93 = 19,255.38, $192.55; uninsured, × 1.75, $336.96.
    expect(Math.round(18_000 * 447.0783 / 417.93)).toBe(192_55);
    expect(Math.round(192_55 * 1.75)).toBe(336_96);
    expect([urgent.amount, urgent.covered, urgent.paid ?? false]).toEqual([336_96, undefined, false]);
    expect(h0.careLog!.find((e) => e.care === 'urgent')!.planPaid).toBe(0);
    sim.advanceTo(at(2027, 1, 26, 12));
    sim.must({ kind: 'school.buy_affiliate', payload: { confirm: true } });
    const back = rigged([[at(2027, 1, 25, 9), FLU_AT_URGENT_CARE]])(loadSave(JSON.parse(freeze(sim)) as never));
    for (const s of [sim, back]) {
      const h1 = healthOf(s.player);
      const issued = h1.bills.find((b) => b.id === urgent.id)!;
      expect(issued).toMatchObject({ amount: 0, credited: 336_96, paid: true });
      expect(issued.covered).toBeUndefined();
      const lines = h1.bills.filter((b) => b.adjusts === urgent.id);
      expect(lines.map((b) => [b.amount, b.credit, b.covered, b.paid])).toEqual([[0, 336_96, { price: 192_55, planPaid: 192_55 }, true]]);
      const log = h1.careLog!.find((e) => e.care === 'urgent')!;
      // Yale Health leaves urgent care $0: $0 + $192.55, the price.
      expect([log.share, log.planPaid, log.share + log.planPaid!]).toEqual([0, 192_55, 192_55]);
      expect(titled(s, 'Care Credited').map((n) => n.body)).toEqual(['Yale Health Affiliate cover, back to the day student cover ended: the care you’ve had since January 20, 2027 has been priced again. You owe $336.96 less. It comes off anything still unpaid or owed as debt, and the rest goes back to your bank.']);
    }
    // Its due day, 24 February, takes nothing, and nothing came back to the bank.
    back.advanceTo(at(2027, 2, 26, 12));
    expect(memoed(back, /^Medical bill: /)).toEqual([]);
    expect(careRefunds(back)).toEqual([]);
    expect(titled(back, 'Care Credited')).toHaveLength(1);
  }, 600_000);

  it('GUARD: a credit on care whose bill went to medical debt comes off the debt, and none goes back to the bank (FIXTURE: the bank emptied, and the cover moved back by hand after the bill fell due, which no played journey does: both windows close before a bill is due)', () => {
    const sim = rigged([[WEEK, EMERGENCY]])(life('rhb-debt', 'comfortable'));
    sim.advanceTo(at(2026, 9, 29, 12));
    // FIXTURE: every account of hers emptied, so the emergency's $50 can't be paid on 30 September.
    for (const a of [...mine(sim, 'checking'), ...mine(sim, 'savings')]) if (a.balance > 0) sim.post({ memo: 'FIXTURE: emptied', category: 'other', postings: [{ accountId: a.id, amount: -a.balance }, { accountId: sim.nominalAccount('expense', 'Other').id, amount: a.balance }] });
    sim.advanceTo(at(2026, 10, 2, 12));
    const er = healthOf(sim.player).bills.find((b) => b.what.startsWith('The emergency room'))!;
    expect(er.inDebt).toBe(true);
    expect(medicalDebtOf(sim, sim.player)!.balance).toBe(-50_00);
    // FIXTURE: Yale Health's cover moved back to 1 August by hand, and the care repriced.
    (sim.player.school!.uncovered ??= []).push({ from: at(2026, 8, 1, 0) });
    expect(repriceCare(sim, sim.player, at(2026, 8, 1, 0), sim.now, 'FIXTURE canceled back')).toBe(-50_00);
    expect(medicalDebtOf(sim, sim.player)!.balance).toBe(0);
    expect(memoed(sim, /^Credit: /).map((t) => into(t, medicalDebtOf(sim, sim.player)!.id))).toEqual([50_00]);
    expect(careRefunds(sim)).toEqual([]);
    expect(healthOf(sim.player).bills.find((b) => b.id === er.id)).toMatchObject({ paid: true, amount: 50_00 });
    expect(healthOf(sim.player).bills.find((b) => b.id === er.id)!.inDebt).toBeUndefined();
  }, 120_000);
});

// ---------------------------------------------------------------------------
// 2. HUSKY D kept at renewal through work (FIXTURE), and the twin without it
// ---------------------------------------------------------------------------

describe('HUSKY D kept at its renewal through work, read over Connecticut’s six months', () => {
  /**
   * FIXTURE: the Comfortable family's student, withdrawn on 25 August 2026, holding HUSKY D from 1 March 2026 with its
   * renewal on 1 March 2027, set by hand: no new life (made on 24 August 2026) can have enrolled before, and no played
   * life on HUSKY D has wages (SLATE pays them only for work-study and the Summer Cabaret, at the School, where Yale
   * Health covers her and Enroll is shut). The renewal reads September 2026 to February 2027 (`lookBack`).
   */
  const holding = (seed: string) => {
    const sim = withdrawn(life(seed, 'comfortable'));
    healthOf(sim.player).program = { kind: 'medicaid', state: 'ct', from: at(2026, 3, 1, 0), band: 'low', renewAt: at(2027, 3, 1, 0) };
    return sim;
  };

  it('FIXTURE: $600 of wages in November 2026 (posted by hand) keeps HUSKY D on 1 March 2027: no gap, renewed to 1 September 2027, no premium, said once across a reload; with none, a notice, covered to 30 April, ended with April; with the same wages in August, outside the six months, the same notice', () => {
    const worked = holding('rhb-kept');
    wagesPosted(worked, at(2026, 11, 20, 17), 600_00, 80); // FIXTURE: November's work
    for (const m of ['2026-09', '2026-10', '2026-11', '2026-12', '2027-01', '2027-02']) expect(earningsOf(worked.player).months[m] ?? 0).toBeLessThan(580_00);
    worked.advanceTo(at(2027, 2, 28, 23));
    const snap = freeze(worked);
    // No gap: covered by HUSKY D the hour before the renewal, at it, and after.
    for (const t of [at(2027, 2, 28, 23), at(2027, 3, 1, 0, 30), at(2027, 3, 1, 9), at(2027, 3, 15, 9)]) {
      worked.advanceTo(t);
      expect(coverOn(worked.player, t)).toBe('medicaid');
    }
    expect(healthOf(worked.player).program).toEqual({ kind: 'medicaid', state: 'ct', from: at(2026, 3, 1, 0), band: 'low', renewAt: at(2027, 9, 1, 0) });
    // Until 2026-10-17 “by 80 hours’ work”: since then the hours aren’t read, and the $600 they were paid is (brief 12, health-criteria.md).
    expect(titled(worked, 'Your Public Cover Is Renewed').map((n) => [n.at, n.body])).toEqual([[at(2027, 3, 1, 0, 30), 'HUSKY D is renewed. Its next renewal is on September 1, 2027. Last month’s income is within its limit, and you met its work rules in November 2026, with $580.00 or more of income.']]);
    expect(titled(worked, 'A Notice Of Noncompliance')).toEqual([]);
    expect(memoed(worked, /premium/i)).toEqual([]);
    const reloaded = loadSave(JSON.parse(snap) as never);
    reloaded.advanceTo(at(2027, 4, 2, 9));
    expect(titled(reloaded, 'Your Public Cover Is Renewed')).toHaveLength(1);
    expect(healthOf(reloaded.player).program!.renewAt).toBe(at(2027, 9, 1, 0));

    const idle = holding('rhb-kept-idle');
    idle.advanceTo(at(2027, 3, 1, 9));
    expect(healthOf(idle.player).pending).toMatchObject({ kind: 'renewal', noticeAt: at(2027, 3, 1, 0, 30), decideAt: at(2027, 4, 5, 0), months: ['2027-02', '2027-01', '2026-12', '2026-11', '2026-10', '2026-09'] });
    idle.advanceTo(at(2027, 4, 30, 12));
    expect(coverOn(idle.player, idle.now)).toBe('medicaid');
    expect(titled(idle, 'Your Public Cover Ends').map((n) => [n.at, n.body])).toEqual([[at(2027, 4, 5, 0), 'HUSKY D still couldn’t find $580.00 of income, time at the School or an exception in any month from September 2026 to February 2027, and nothing was shown by April 4, 2027, so HUSKY D ends on April 30, 2027. Losing it gives you 60 days to enroll in the marketplace, but without the premium tax credit while HUSKY D would take you if not for its work rules. You can apply for HUSKY D again in any month after one that meets them.']]);
    idle.advanceTo(at(2027, 5, 1, 9));
    expect(coverOn(idle.player, idle.now)).toBeUndefined();
    expect(healthOf(idle.player).program!.until).toBe(at(2027, 5, 1, 0));

    const early = holding('rhb-kept-august');
    wagesPosted(early, at(2026, 8, 28, 17), 600_00, 80); // FIXTURE: August's work, before the six months
    early.advanceTo(at(2027, 3, 1, 9));
    expect(titled(early, 'Your Public Cover Is Renewed')).toEqual([]);
    expect(titled(early, 'A Notice Of Noncompliance')).toHaveLength(1);
  }, 300_000);
});

// ---------------------------------------------------------------------------
// 3. The insured paths, traced: enrollment, the appointment, the bill's two shares, payment, persistence
// ---------------------------------------------------------------------------

describe('the insured paths, from cover to a bill paid once, the same in one jump as day by day', () => {
  it('PLAYER JOURNEY: Yale Health at its Health Center, the next weekday at $0, the plan’s $105.13 kept; her twin who picks Fair Haven is booked 24 days on and billed $183.98, the plan paying none, paid once on its due day; each the same in one jump as day by day', () => {
    const WEEK = at(2026, 8, 31, 9);
    const rig = rigged([[WEEK, VISIT]]);
    const yale = rig(life('rhb-yale', 'wealthy'));
    const fair = rig(life('rhb-yale', 'wealthy'));
    fair.must({ kind: 'health.choose_clinic', payload: { clinicId: 'us-ct-fhchc-grand' } });
    // Yale Health sees only its members: the member may choose it, a withdrawn twin may not (clinic selection's access).
    const out = withdrawn(life('rhb-yale-out', 'wealthy'));
    expect(out.execute({ kind: 'health.choose_clinic', payload: { clinicId: 'us-ct-yalehealth-studenthealth' } }).error).toBe('Yale Health sees Yale students it covers, and it doesn’t cover you now.');
    const snapYale = freeze(yale);
    const snapFair = freeze(fair);
    const y = jumpAgainstSteps(snapYale, yale.now, at(2026, 9, 3, 12), rig);
    expect(appointmentsOf(y.player)).toEqual([]);
    const yv = healthOf(y.player).careLog!.find((e) => e.care === 'visit')!;
    expect([yv.at, yv.clinicId, yv.share, yv.planPaid]).toEqual([at(2026, 9, 1, 10), 'us-ct-yalehealth-studenthealth', 0, 105_13]);
    expect(healthOf(y.player).bills.filter((b) => /visit/i.test(b.what))).toEqual([]);
    const f = jumpAgainstSteps(snapFair, fair.now, at(2026, 10, 26, 12), rig);
    const fv = healthOf(f.player).careLog!.find((e) => e.care === 'visit')!;
    // Booked 24 days from the 31 August week: Thursday 24 September at ten.
    expect([fv.at, fv.clinicId, fv.share, fv.planPaid]).toEqual([at(2026, 9, 24, 10), 'us-ct-fhchc-grand', 183_98, 0]);
    const bill = healthOf(f.player).bills.find((b) => b.id === fv.billId)!;
    expect([bill.amount, bill.covered, bill.dueAt, bill.paid]).toEqual([183_98, undefined, at(2026, 10, 24, 10), true]);
    expect(memoed(f, /^Medical bill: /).map((t) => [t.at, into(t, checking(f).id)])).toEqual([[at(2026, 10, 24, 10), -183_98]]);
  }, 300_000);

  /**
   * Withdrawn on 25 August 2026 and enrolled on 1 October (the cover from 1 November; HUSKY D's from 1 October, the month
   * of application, from 2026-10-16, Connecticut's UPM § 1560.10(B), where until then it was 1 November too); the
   * 2 November week draws a visit (TEST SETUP).
   */
  const enrolled = (seed: string, wealth: StartingWealth, september?: number) => {
    const rig = rigged([[at(2026, 11, 2, 9), VISIT]]);
    const sim = rig(withdrawn(life(seed, wealth)));
    if (september !== undefined) { sim.advanceTo(at(2026, 8, 31, 23, 30)); setSavings(sim, september); }
    sim.advanceTo(at(2026, 10, 1, 9));
    const toast = sim.must<{ kind: string; from: Instant }>({ kind: 'health.enroll', payload: {} });
    expect(toast.from).toBe(toast.kind === 'medicaid' ? at(2026, 10, 1, 0) : at(2026, 11, 1, 0));
    return { sim, rig, kind: toast.kind };
  };

  it('PLAYER JOURNEY: Access Health CT’s silver plan for an Inherited family’s student: $706.00 taken on 1 November and 1 December once each; a visit booked 24 days on, Thanksgiving skipped to Friday 27 November, billed the $45 copay, the plan paying $60.13 of $105.13; paid once on 27 December; the same in one jump as day by day', () => {
    const { sim, rig, kind } = enrolled('rhb-market', 'inherited');
    expect(kind).toBe('marketplace');
    const done = jumpAgainstSteps(freeze(sim), sim.now, at(2026, 12, 28, 12), rig);
    expect(memoed(done, /^Marketplace health plan premium$/).map((t) => [t.at, into(t, checking(done).id)])).toEqual([[at(2026, 11, 1, 0, 30), -706_00], [at(2026, 12, 1, 0, 30), -706_00]]);
    const visit = healthOf(done.player).careLog!.find((e) => e.care === 'visit')!;
    expect([visit.at, visit.share, visit.planPaid]).toEqual([at(2026, 11, 27, 10), 45_00, 60_13]);
    const bill = healthOf(done.player).bills.find((b) => b.id === visit.billId)!;
    expect([bill.amount, bill.covered, bill.paid]).toEqual([45_00, { price: 105_13, planPaid: 60_13 }, true]);
    expect(bill.amount + bill.covered!.planPaid).toBe(105_13);
    expect(memoed(done, /^Medical bill: /).map((t) => [t.at, into(t, checking(done).id)])).toEqual([[at(2026, 12, 27, 10), -45_00]]);
  }, 300_000);

  it('PLAYER JOURNEY: HUSKY D for the Comfortable family’s student, and Covered Connecticut for the Inherited family’s on September’s $2,052.00 of interest: the 27 November visit leaves her $0 with no bill, the plan’s $105.13 on the care log, “Nothing to pay.”; no premium taken; the same in one jump as day by day', () => {
    for (const [seed, wealth, september, cover, name] of [['rhb-husky', 'comfortable', undefined, 'medicaid', 'HUSKY D'], ['rhb-covered', 'inherited', 832_200_00, 'essential', 'Covered Connecticut']] as const) {
      const { sim, rig, kind } = enrolled(seed, wealth, september);
      expect(kind).toBe(cover);
      // Covered Connecticut's month: 832,200 × 0.03 × 30 ÷ 365 = $2,052.00, over $1,835.40 and within $2,282.29.
      if (september !== undefined) expect(earningsOf(sim.player).months['2026-09']).toBe(2_052_00);
      const done = jumpAgainstSteps(freeze(sim), sim.now, at(2026, 12, 28, 12), rig);
      expect(coverOn(done.player, at(2026, 11, 27, 10))).toBe(cover);
      const visit = healthOf(done.player).careLog!.find((e) => e.care === 'visit')!;
      expect([visit.at, visit.share, visit.planPaid, visit.billId]).toEqual([at(2026, 11, 27, 10), 0, 105_13, undefined]);
      expect(healthOf(done.player).bills.filter((b) => /visit/i.test(b.what))).toEqual([]);
      expect(titled(done, 'A Doctor’s Visit').filter((n) => n.at >= at(2026, 11, 1, 0)).map((n) => n.body)).toEqual(['You saw a doctor at Fair Haven Community Health Care. There’s nothing to pay.']);
      expect(memoed(done, /premium/i)).toEqual([]);
      expect(papers(done)).toContain(name);
    }
  }, 300_000);
});
