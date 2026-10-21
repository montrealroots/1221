/**
 * Brief 20's School area, B1 and B3: work-study wages, compared (2026-10-21). Lives from one seed (`b20-school-shifts`, a
 * New York student of modest means, on aid), each played by the attentive student (`tests/setup/b20-school.ts`):
 *
 * - A works every assigned Saturday shift.
 * - B works the first two and sleeps through the rest, from 19 September: at nine each Saturday, to bed for eight hours.
 * - C is ill on Friday 18 September (TEST SETUP: the flu, as `careFor` gives one, set by hand; the consequence under test
 *   is the excused shift's, not the flu's), calls in sick on the Saturday (`school.call_in_sick`), and asks to convert the
 *   hours (`school.request_conversion`).
 *
 * Relevant: each shift worked is paid the Friday after, $23.00 an hour, into the bank as wages and into the year's
 * earnings record as work-study, which the return reads; a shift slept through is paid nothing, counted against
 * attendance and told; one excused ill is neither, and becomes grant aid at January's processing. No leak: the classes,
 * and every other dollar of the bank, are the same.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR } from '@/engine/core/time';
import { earningsOf } from '@/engine/systems/earnings';
import { healthOf } from '@/engine/systems/health';
import { CONVERT_KIND, SHIFT_KIND } from '@/engine/systems/school';
import { WORK_STUDY } from '@/engine/content/school';
import { at, balances, partsOf, pendingOf, play, student, tallyOf, titled } from './setup/b20-school';

const SEED = 'b20-school-shifts';
const END = at(2026, 11, 1);
const HOURLY = WORK_STUDY.hourly;
/** The wages paid into the bank: each payday's posting into an account of the player's. */
const wagesPaid = (sim: Simulation) => sim.universe.transactions.filter((t) => t.category === 'salary').map((t) => t.postings.find((p) => p.amount > 0 && sim.universe.accounts[p.accountId]?.ownerId === sim.player.id)!.amount);
const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

describe('B1/B3: work-study shifts worked, slept through and excused ill (seed b20-school-shifts)', () => {
  const S = {} as { a: Simulation; b: Simulation; c: Simulation; slept: number[]; asked?: { at: number; hours: number }; refusedB?: string };
  beforeAll(() => {
    S.a = play(student(SEED, { wealth: 'modest' }), END);
    S.slept = [];
    S.b = play(student(SEED, { wealth: 'modest' }), END, (sim) => {
      const p = partsOf(sim);
      if (p.weekday !== 6 || p.hour !== 9 || sim.now < at(2026, 9, 19)) return false;
      if (!sim.execute({ kind: 'life.sleep', payload: { hours: 8 } }).ok) return false;
      S.slept.push(at(p.year, p.month, p.day, 10));
      return true;
    });
    S.refusedB = S.b.execute({ kind: 'school.request_conversion', payload: {} }).error;
    S.c = play(student(SEED, { wealth: 'modest' }), at(2026, 9, 18, 20));
    // TEST SETUP: down with the flu from Friday evening, as `careFor` gives one; the call in sick is the player's.
    healthOf(S.c.player).fluUntil = S.c.now + 40 * MS_HOUR;
    play(S.c, at(2026, 9, 19, 8));
    S.c.must({ kind: 'school.call_in_sick', payload: {} });
    play(S.c, at(2026, 10, 1, 18));
    S.asked = S.c.must<{ at: number; hours: number }>({ kind: 'school.request_conversion', payload: {} });
  }, 120_000);

  it('each shift worked is paid the Friday after, into the bank as wages and into the earnings record as work-study, alike', () => {
    for (const sim of [S.a, S.b]) {
      const paid = wagesPaid(sim);
      expect(paid.every((x) => x === 6 * HOURLY)).toBe(true);
      expect(earningsOf(sim.player).years['2026']!.workStudy).toBe(sum(paid));
    }
    expect(wagesPaid(S.a)).toHaveLength(7);
    expect(wagesPaid(S.b)).toHaveLength(2);
  });

  it('shifts slept through are paid nothing, counted against attendance, and told; the student who worked is paid for each', () => {
    const a = tallyOf(S.a);
    const b = tallyOf(S.b);
    // The Saturdays slept through that had a shift (not every Saturday of a term has one, `isShiftDay`).
    const shifts = S.b.universe.scheduled.filter((i) => i.kind === SHIFT_KIND && i.payload.personId === S.b.player.id && S.slept.includes(i.at));
    expect(shifts.length).toBeGreaterThanOrEqual(5);
    expect(shifts.map((i) => i.status)).toEqual(shifts.map(() => 'missed'));
    expect(b.shifts).toBe(a.shifts);
    expect(b.worked).toBe(a.worked - shifts.length);
    expect(wagesPaid(S.a).length - wagesPaid(S.b).length).toBe(shifts.length - 1);
    expect(titled(S.b, 'You Missed A Work-Study Shift').at(-1)!.at).toBe(Math.max(...shifts.map((i) => i.at)));
    // The hours not worked are owed nothing: none waits for a payday.
    expect(S.b.player.school!.workStudy.owedHours).toBe(0);
    expect(S.a.player.school!.workStudy.owedHours).toBe(6);
  });

  it('no leak: the classes are the same, and the bank differs by the wages and by nothing else', () => {
    const a = tallyOf(S.a);
    const b = tallyOf(S.b);
    expect([b.classDays, b.attended, b.calls, b.answered]).toEqual([a.classDays, a.attended, a.calls, a.answered]);
    const checking = (sim: Simulation) => balances(sim)['Chase Total Checking']!;
    expect(checking(S.a) - checking(S.b)).toBe(sum(wagesPaid(S.a)) - sum(wagesPaid(S.b)));
    expect(balances(S.b)['Chase Savings']).toBe(balances(S.a)['Chase Savings']);
  });

  it('missed unexcused, the hours can’t be converted; excused ill, they become grant aid at January’s processing, taxable', () => {
    expect(S.refusedB).toBe('There are no hours to convert at January’s processing. Only assigned hours you missed while ill or hurt count then.');
    const c = S.c;
    const excused = c.universe.scheduled.find((i) => i.kind === SHIFT_KIND && i.at === at(2026, 9, 19, 10))!;
    expect(excused.status).toBe('missed');
    expect(c.player.school!.excusedHours).toEqual({ 0: 6 });
    // Not held against attendance: not among the shifts asked of them, which are those before it and the one after.
    const counted = c.universe.scheduled.filter((i) => i.kind === SHIFT_KIND && i.payload.personId === c.player.id && i.status !== 'pending' && i.at !== excused.at && i.at < c.now);
    expect(tallyOf(c).shifts).toBe(counted.length);
    expect(tallyOf(c).worked).toBe(counted.length);
    expect(S.asked).toEqual({ at: at(2027, 1, 15, 12), hours: 6 });
    expect(pendingOf(c, CONVERT_KIND)).toHaveLength(1);
    c.advanceTo(at(2027, 1, 15, 11));
    const scholarshipBefore = earningsOf(c.player).years['2027']?.scholarship ?? 0;
    c.advanceTo(at(2027, 1, 15, 13));
    const grant = c.universe.transactions.filter((t) => t.memo.startsWith('Grant-in-aid: 6 work-study hours converted'));
    expect(grant).toHaveLength(1);
    expect(grant[0]!.postings.find((p) => p.accountId === c.player.primaryAccountId)!.amount).toBe(6 * HOURLY);
    expect(earningsOf(c.player).years['2027']!.scholarship).toBe(scholarshipBefore + 6 * HOURLY);
    expect(titled(c, 'Hours Converted To Grant Aid')).toHaveLength(1);
    // Converted once: asked again, nothing is left.
    expect(c.execute({ kind: 'school.request_conversion', payload: {} }).error).toMatch(/no hours to convert/);
  }, 60_000);
});
