/**
 * The IRS's failure-to-pay rate, and a payment plan's months of it, as properties (from 2026-10-12; `payLateRateAt` in
 * `systems/taxreturn.ts`). IRC 6651(a)(2) charges half a percent for each month or part of one from the due date, or
 * from filing on a return filed late (counted, since 2026-10-13, on the due date’s months), to 25% in all; 6651(h) charges a quarter percent instead for each of those months
 * that begins after a payment plan is entered into and while it's in force, on a return filed on time.
 *
 * Until later on 2026-10-12 the engine counted a plan's months from the plan's start and took them off the months
 * counted from the due date. The two counts stepped on different days, so within each month the rate stood a step
 * higher for about half of it and then fell back, and the penalty shown fell with it; and a plan begun before the due
 * date had its months before it netted against those after, charging nothing at first. Played, the guide's plan example
 * read 0% for 60 days past due, then 0.25%, 0%, 0.5%, 0.25%, 0.75%, 0.5%.
 *
 * FIXTURES: every return here is set down by hand, its due date, its filing and its plan's moments, to reach the rule
 * alone, each drawn by a seeded generator so a failure prints its seed. The played example is
 * tests/guide-examples-papers.test.ts (`taxes.plan`).
 */
import { describe, expect, it } from 'vitest';
import type { Simulation } from '@/engine/core/simulation';
import type { Person } from '@/engine/domain/model';
import { MS_DAY } from '@/engine/core/time';
import { RETURN } from '@/engine/content/safetynet';
import { PLAN, applyPayment, deadline, partsOn, payLateRateAt, underPlan, type TaxReturn } from '@/engine/systems/taxreturn';

/** The penalty's month, as the engine counts it: a year's twelfth, 30.4375 days. */
const MONTH = 30.4375 * MS_DAY;
const TAX = 10_000_00;

/** mulberry32: a small seeded generator, so a failing case is found again from its seed. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

/** FIXTURE: a return owing `TAX`, with its due date, filing and plan as given. */
const returnOf = (r: { due: number; filedAt?: number; reducedFrom?: number; reducedTo?: number }): TaxReturn => ({
  year: 2026, figures: { balance: TAX }, owed: TAX, parts: { tax: TAX, penalty: 0, interest: 0 }, base: TAX, ...r,
}) as unknown as TaxReturn;

/**
 * FIXTURE: any return, drawn: never filed, filed on time or up to two years late; with no plan, a plan in force, or one
 * ended, its start anywhere from four months before the due date to forty after. The engine sets a plan's months only
 * on a return filed on time; drawn on any return here, so the rate's shape is held whatever the fields hold.
 */
function anyReturn(seed: number): TaxReturn {
  const r = rng(seed);
  const due = deadline(2026 + Math.floor(r() * 10));
  const filing = r();
  const filedAt = filing < 0.1 ? undefined : filing < 0.55 ? due - r() * 90 * MS_DAY : due + r() * 24 * MONTH;
  const planned = r();
  const reducedFrom = planned < 0.25 ? undefined : due + (r() * 44 - 4) * MONTH;
  const reducedTo = reducedFrom === undefined || planned < 0.6 ? undefined : reducedFrom + r() * 30 * MONTH;
  return returnOf({ due, filedAt, reducedFrom, reducedTo });
}

/** How many of the penalty's months have begun by `at`, from `from`: counted one by one, as the law counts them. */
const begunBy = (from: number, at: number): number[] => {
  const starts: number[] = [];
  for (let k = 0; from + k * MONTH < at; k += 1) starts.push(from + k * MONTH);
  return starts;
};

/** The share a late return was charged with filing, its months from the due date to filing at the full rate. */
const atFiling = (r: TaxReturn): number => (r.filedAt !== undefined && r.filedAt > r.due ? Math.min(RETURN.lateCap, RETURN.payLateMonthly * begunBy(r.due, r.filedAt).length) : 0);

/**
 * The rate month by month, the law's way: each month begun since the due date (or filing, on a late return) at the
 * plan's rate where it began at or after the plan was entered into and before it ended, else the full rate; capped at
 * 25% less what was charged with filing. A month that begins at the very moment the plan does is taken as begun under
 * it: SLATE keeps moments, and a plan dated from the due date stands for the first month, which begins after that day.
 */
const monthByMonth = (r: TaxReturn, at: number): number => {
  if (r.filedAt === undefined) return 0;
  // The months from the due date, the law's grid, less those a late return's filing was charged for. Until 2026-10-13
  // this counted a late return's months afresh from its filing, as the engine did, and the month the filing split was
  // charged twice: once with the filing, and again here (found by the review of that day).
  const charged = r.filedAt > r.due ? begunBy(r.due, r.filedAt).length : 0;
  const rate = begunBy(r.due, at).slice(charged).reduce((sum, start) => {
    const under = r.reducedFrom !== undefined && start >= r.reducedFrom && (r.reducedTo === undefined || start < r.reducedTo);
    return sum + (under ? PLAN.reducedRate : RETURN.payLateMonthly);
  }, 0);
  return Math.min(RETURN.lateCap - atFiling(r), rate);
};

const CASES = 400;

describe('plan-rate: the failure-to-pay rate, month by month', () => {
  it('never falls as time passes, on any return, with a plan or without', () => {
    for (let seed = 1; seed <= CASES; seed += 1) {
      const r = anyReturn(seed);
      const step = rng(seed * 7919);
      let last = 0;
      let fell: string | undefined;
      for (let at = r.due - 30 * MS_DAY; at < r.due + 120 * MONTH && !fell; at += (0.25 + step() * 4) * MS_DAY) {
        const rate = payLateRateAt(r, at);
        if (rate < last) fell = `${((at - r.due) / MS_DAY).toFixed(2)} days past due: ${rate} after ${last}`;
        last = rate;
      }
      expect(fell, `seed ${seed}`).toBeUndefined();
    }
  });

  it('with no plan, is the full rate for each month begun, to 25% less what filing late charged', () => {
    for (let seed = 1; seed <= CASES; seed += 1) {
      const r = { ...anyReturn(seed), reducedFrom: undefined, reducedTo: undefined } as TaxReturn;
      const step = rng(seed * 104_729);
      for (let i = 0; i < 40; i += 1) {
        const at = r.due + (step() * 130 - 10) * MONTH;
        // The due date's months begun by now, less those charged with a late filing (until 2026-10-13: counted from filing).
        const months = r.filedAt === undefined ? 0 : Math.max(0, begunBy(r.due, at).length - (r.filedAt > r.due ? begunBy(r.due, r.filedAt).length : 0));
        expect(payLateRateAt(r, at), `seed ${seed}, ${months} months`).toBeCloseTo(Math.min(RETURN.lateCap - atFiling(r), RETURN.payLateMonthly * months), 12);
      }
    }
  });

  it('under a plan in force from before the due date, is the plan’s rate from the first month', () => {
    for (let seed = 1; seed <= CASES; seed += 1) {
      const r0 = rng(seed * 31);
      const due = deadline(2026 + Math.floor(r0() * 10));
      const r = returnOf({ due, filedAt: due - r0() * 90 * MS_DAY, reducedFrom: due - r0() * 120 * MS_DAY });
      expect(payLateRateAt(r, due + MS_DAY), `seed ${seed}`).toBeCloseTo(PLAN.reducedRate, 12);
      for (let i = 0; i < 40; i += 1) {
        const at = due + r0() * 130 * MONTH;
        expect(payLateRateAt(r, at), `seed ${seed}`).toBeCloseTo(Math.min(RETURN.lateCap, PLAN.reducedRate * begunBy(due, at).length), 12);
      }
    }
  });

  it('is each month’s own rate, the plan’s where the month began while the plan stood', () => {
    for (let seed = 1; seed <= CASES; seed += 1) {
      const r = anyReturn(seed);
      const step = rng(seed * 15_485_863);
      for (let i = 0; i < 40; i += 1) {
        const at = r.due + (step() * 130 - 10) * MONTH;
        expect(payLateRateAt(r, at), `seed ${seed}, ${((at - r.due) / MS_DAY).toFixed(2)} days past due`).toBeCloseTo(monthByMonth(r, at), 12);
      }
    }
  });

  it('keeps the full rate for the month a plan began in and the months after it ended', () => {
    const due = deadline(2026);
    const r = returnOf({ due, filedAt: due - 10 * MS_DAY, reducedFrom: due + 2.5 * MONTH, reducedTo: due + 5.5 * MONTH });
    const full = RETURN.payLateMonthly;
    const plan = PLAN.reducedRate;
    // The plan began in the third month: it and the two before stay at the full rate.
    expect(payLateRateAt(r, due + 2.6 * MONTH)).toBeCloseTo(3 * full, 12);
    // The fourth, fifth and sixth began while it stood.
    expect(payLateRateAt(r, due + 3.1 * MONTH)).toBeCloseTo(3 * full + plan, 12);
    expect(payLateRateAt(r, due + 5.9 * MONTH)).toBeCloseTo(3 * full + 3 * plan, 12);
    // The seventh began after it ended.
    expect(payLateRateAt(r, due + 6.1 * MONTH)).toBeCloseTo(4 * full + 3 * plan, 12);
  });

  it('on the guide’s plan example, played by the verifier, the later year charges the plan’s rate from its first day past due', () => {
    // FIXTURE: the played example's later year, 2027's return filed and its plan begun on 2 February 2028.
    const due = deadline(2027);
    expect(due).toBe(Date.UTC(2028, 3, 19, 3, 59));
    const r = returnOf({ due, filedAt: Date.UTC(2028, 1, 2, 17, 0), reducedFrom: Date.UTC(2028, 1, 2, 17, 1) });
    let last = 0;
    for (let day = 0; day <= 152; day += 1) {
      const rate = payLateRateAt(r, due + day * MS_DAY);
      expect(rate, `day ${day}`).toBeCloseTo(PLAN.reducedRate * Math.ceil(day / 30.4375), 12);
      expect(rate, `day ${day}`).toBeGreaterThanOrEqual(last);
      last = rate;
    }
    // Its penalty shown, never brought up to date: it never falls either.
    let shown = 0;
    for (let hour = 0; hour <= 152 * 24; hour += 6) {
      const penalty = partsOn(r, due + hour * 3_600_000, true).penalty;
      expect(penalty, `hour ${hour}`).toBeGreaterThanOrEqual(shown);
      shown = penalty;
    }
  });

  it('brought up to date each week under a plan, charges each month’s step as the month begins, never before', () => {
    // FIXTURE: filed on time, a plan begun two months before the due date, a cent paid each week (which accrues it).
    const due = deadline(2026);
    const r = returnOf({ due, filedAt: due - 70 * MS_DAY, reducedFrom: due - 60 * MS_DAY });
    const sim = { now: due, universe: { scheduled: [] }, timeline: { cancel() {} } } as unknown as Simulation;
    const person = { id: 'p' } as unknown as Person;
    for (let week = 1; week <= 52; week += 1) {
      (sim as { now: number }).now = due + week * 7 * MS_DAY;
      applyPayment(sim, person, r, 1, 'payment');
      const months = begunBy(due, sim.now).length;
      // The tax falls by a cent a week, so each step is a share of a tax at most `week` cents under `TAX`.
      expect(r.parts!.penalty, `week ${week}`).toBeLessThanOrEqual(Math.round(PLAN.reducedRate * months * TAX) + 1);
      expect(r.parts!.penalty, `week ${week}`).toBeGreaterThanOrEqual(Math.round(PLAN.reducedRate * months * (TAX - week)) - 1);
    }
  });

  it('on a save from before, a higher mark charges nothing until the plan’s rate passes it, and no month twice', () => {
    // FIXTURE: a plan from the due date and a mark of four months at the full rate, which the engine kept until
    // 2026-10-12 (`accrue`): the plan's ninth month is the first past it.
    const due = deadline(2026);
    const r = { ...returnOf({ due, filedAt: due - 5 * MS_DAY, reducedFrom: due }), payLateRate: 4 * RETURN.payLateMonthly, accruedAt: due + 4 * MONTH - MS_DAY } as TaxReturn;
    expect(partsOn(r, due + 8 * MONTH - MS_DAY, true).penalty).toBeCloseTo(0, 6);
    expect(partsOn(r, due + 8 * MONTH + MS_DAY, true).penalty).toBeCloseTo((9 * PLAN.reducedRate - 4 * RETURN.payLateMonthly) * TAX, 6);
  });
});

// From later on 2026-10-12: a second plan kept the first's months (`reducedBefore`, `underPlan`). Until then it set the
// start again, and the first plan's months went back to the full rate: the verifier of the month-by-month fix measured a
// plan from the due date to 6.5 months and another from 9.5 months, the rate jumping from 3.25% to 5% as the second
// began, an overcharge of 1.75% of the tax, the first plan's seven months at a quarter each.
describe('a second plan', () => {
  it('keeps the first plan’s months at its rate, and the rate doesn’t jump as the second begins', () => {
    const due = Date.UTC(2027, 3, 15, 3, 59);
    const r = returnOf({ due, filedAt: due - 5 * MS_DAY });
    underPlan(r, due);
    r.reducedTo = due + 6.5 * MONTH; // the first plan ends, as `endPlan` ends it
    const start = due + 9.5 * MONTH;
    const before = payLateRateAt(r, start);
    underPlan(r, start);
    expect(payLateRateAt(r, start)).toBeCloseTo(before, 9);
    expect(before).toBeCloseTo(7 * PLAN.reducedRate + 3 * RETURN.payLateMonthly, 9);
    expect(r.reducedBefore).toEqual([{ from: due, to: due + 6.5 * MONTH }]);
    // A year on, every month begun under either plan at its rate, and the three between at the full rate.
    const later = due + 21.5 * MONTH;
    expect(payLateRateAt(r, later)).toBeCloseTo(Math.min(RETURN.lateCap, 7 * PLAN.reducedRate + 3 * RETURN.payLateMonthly + 12 * PLAN.reducedRate), 9);
  });

  it('leaves a span already open as it is', () => {
    const due = Date.UTC(2027, 3, 15, 3, 59);
    const r = returnOf({ due, filedAt: due - 5 * MS_DAY });
    underPlan(r, due);
    underPlan(r, due + 3 * MONTH);
    expect(r.reducedFrom).toBe(due);
    expect(r.reducedBefore).toBeUndefined();
  });
});
