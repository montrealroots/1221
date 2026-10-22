/**
 * Brief 20's School area, B1 and B3: attendance, compared (2026-10-21). Two lives from one seed (`b20-school-attend`, a
 * New York student of modest means), each played by the attentive student (`tests/setup/b20-school.ts`) through the fall
 * term of 2026 to its review on 11 December. The second differs in one thing the player does: on each Tuesday with
 * classes from September to November, at seven in the morning, they go back to bed for four hours (`life.sleep`), and so
 * sleep through the day's classes. Nothing is set by hand.
 *
 * What it should change (relevant): the term's tally and the review's attendance, each Tuesday course's record and result
 * (a Fail under three quarters of its meetings, `COURSE_RULES.passFloor`), the standing (three Fails in a term bring the
 * faculty's review, `facultyReview`, and academic warning), and later what the warning keeps from them (the Cabaret,
 * `cabaretRefusal`). And the warning comes in time: each morning slept through is told that morning, at nine, before the
 * term's review counts it. What it mustn't change (no leak): the money, the calls answered and the shifts worked, and the
 * classmates, whose growth is theirs.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import type { Simulation } from '@/engine/core/simulation';
import { cabaretRefusal, classPeriod, coursesFor } from '@/engine/systems/school';
import { COURSE_RULES } from '@/engine/systems/courserecord';
import { at, balances, partsOf, play, reload, student, tallyOf, titled } from './setup/b20-school';

const SEED = 'b20-school-attend';
/** What the no-leak side reads, at the review, before either life plays on. */
const snapshot = (sim: Simulation) => ({ money: balances(sim), tally: tallyOf(sim), classmates: sim.player.school!.classmates.map((m) => m.craft), growth: sim.player.school!.history[0]!.growth });
type Snapshot = ReturnType<typeof snapshot>;
const REVIEWED = at(2026, 12, 20);

/** A Tuesday from September to November with classes, at seven: back to bed for four hours, through the day's classes. */
function sleepsThroughTuesdays(slept: number[]) {
  return (sim: Simulation): boolean => {
    const p = partsOf(sim);
    if (p.hour !== 7 || p.weekday !== 2 || p.month < 9 || p.month > 11) return false;
    if (!coursesFor(sim.player.school!, { year: p.year, month: p.month, day: p.day }).length) return false;
    if (!sim.execute({ kind: 'life.sleep', payload: { hours: 4 } }).ok) return false;
    slept.push(at(p.year, p.month, p.day, 9));
    return true;
  };
}

describe('B1/B3: classes slept through, against the same term attended (seed b20-school-attend)', () => {
  const S = {} as { a: Simulation; b: Simulation; reloaded: Simulation; slept: number[]; toldBy: Map<number, number>; atNov30: ReturnType<typeof tallyOf>; reviewed: { a: Snapshot; b: Snapshot } };
  beforeAll(() => {
    S.a = play(student(SEED, { wealth: 'modest' }), REVIEWED);
    S.slept = [];
    S.toldBy = new Map();
    const sleeps = sleepsThroughTuesdays(S.slept);
    // Each morning slept through, the notice that says so, read at noon that day (the notice of an unread one said again is
    // brought up to now, `Simulation.notify`, so its time is the latest morning's).
    const watch = (sim: Simulation) => {
      const last = S.slept.at(-1);
      if (last !== undefined && !S.toldBy.has(last) && sim.now >= last + 3 * 3_600_000) {
        const told = titled(sim, 'You Missed Classes').find((n) => n.at === last);
        S.toldBy.set(last, told ? told.at : -1);
      }
      return sleeps(sim);
    };
    S.b = play(student(SEED, { wealth: 'modest' }), at(2026, 11, 30, 23), watch);
    S.atNov30 = tallyOf(S.b);
    play(S.b, REVIEWED, watch);
    // The same life saved and opened again mid-term, on 15 October, and played on: the same term's end.
    const slept2: number[] = [];
    const again = play(student(SEED, { wealth: 'modest' }), at(2026, 10, 15, 12), sleepsThroughTuesdays(slept2));
    S.reloaded = play(reload(again), REVIEWED, sleepsThroughTuesdays(slept2));
    S.reviewed = { a: snapshot(S.a), b: snapshot(S.b) };
  }, 120_000);

  it('the term’s tally and the review count each morning slept through, once, and the review finds attendance short', () => {
    const a = S.a.player.school!;
    const b = S.b.player.school!;
    expect(S.slept.length).toBeGreaterThanOrEqual(10);
    // The same class days asked of both; each slept through counted, once.
    expect(b.tally.classDays).toBe(a.tally.classDays);
    expect(a.tally.attended).toBe(a.tally.classDays);
    expect(b.tally.attended).toBe(a.tally.attended - S.slept.length);
    const reviewA = a.history.find((h) => h.term === 0)!;
    const reviewB = b.history.find((h) => h.term === 0)!;
    expect(reviewA.attendance).toBe(1);
    const expected = b.tally.classDays - b.tally.excused + b.tally.calls + b.tally.shifts;
    expect(reviewB.attendance).toBeCloseTo((b.tally.attended + b.tally.answered + b.tally.worked) / expected, 10);
    expect(reviewB.attendance).toBeLessThan(0.9);
    expect(reviewB.reason).toMatch(/That’s under the 90% the program asks\./);
    expect(reviewA.reason).not.toMatch(/under the 90%/);
  });

  it('each Tuesday course is failed on its meetings, and only those; the other courses pass in both', () => {
    const a = Object.values(S.a.player.school!.courses!);
    const b = Object.values(S.b.player.school!.courses!);
    expect(a.every((r) => r.result === 'pass')).toBe(true);
    const failed = b.filter((r) => r.result === 'fail');
    expect(failed.length).toBeGreaterThanOrEqual(2);
    for (const r of failed) {
      expect(r.attended / (r.meetings - r.excused)).toBeLessThan(COURSE_RULES.passFloor);
      expect(r.why).toBe(`you came to ${r.attended} of the ${r.meetings - r.excused} classes you weren’t excused from`);
      expect(titled(S.b, `Not Passed: ${r.name}`)).toHaveLength(1);
    }
    // A course met on no Tuesday kept every meeting, and passed.
    for (const r of b.filter((x) => x.result === 'pass')) expect(r.attended).toBe(a.find((x) => x.code === r.code)!.attended);
  });

  it('the standing: good for the student who came; academic warning, by the faculty’s review of the Fails, for the one who didn’t', () => {
    expect(S.a.player.school!.standing).toBe('good');
    expect(S.b.player.school!.standing).toBe('warning');
    expect(titled(S.b, 'A Faculty Review: On Warning')).toHaveLength(1);
    expect(titled(S.b, 'Academic Warning')).toHaveLength(1);
    expect(titled(S.a, /Warning|Concern/)).toHaveLength(0);
  });

  it('the warning comes in time: each morning slept through is told that morning at nine, weeks before the review counts it', () => {
    expect(S.toldBy.size).toBe(S.slept.length);
    for (const [morning, told] of S.toldBy) expect(told, new Date(morning).toISOString()).toBe(morning);
    const review = at(classPeriod(0).to.year, classPeriod(0).to.month, classPeriod(0).to.day, 17);
    expect(Math.min(...S.slept)).toBeLessThan(review - 60 * 86_400_000);
    // What the Standing tab's Attendance This Term reads, a week before the review: already under the floor.
    const t = S.atNov30;
    expect((t.attended + t.answered + t.worked) / (t.classDays - t.excused + t.calls + t.shifts)).toBeLessThan(0.9);
  });

  it('later: on warning, the Cabaret is closed to them; the student in good standing is refused it for no such reason', () => {
    play(S.a, at(2027, 1, 20));
    play(S.b, at(2027, 1, 20));
    expect(cabaretRefusal(S.b, S.b.player)).toBe('You can’t take part in the Cabaret while you’re on academic warning.');
    expect(S.b.execute({ kind: 'school.cabaret', payload: {} }).error).toBe('You can’t take part in the Cabaret while you’re on academic warning.');
    expect(cabaretRefusal(S.a, S.a.player) ?? '').not.toMatch(/warning/);
  });

  it('no leak: the money, the calls answered, the shifts worked and the classmates are the same in both lives', () => {
    const { a, b } = S.reviewed;
    expect(b.money).toEqual(a.money);
    expect([b.tally.calls, b.tally.answered, b.tally.shifts, b.tally.worked]).toEqual([a.tally.calls, a.tally.answered, a.tally.shifts, a.tally.worked]);
    expect(b.classmates).toEqual(a.classmates);
    // Relevant, by contrast: the classes slept through grew the player less.
    expect(b.growth).toBeLessThan(a.growth);
  });

  it('saved and opened on 15 October and played on, the term ends as it did played straight through', () => {
    const at15 = (sim: Simulation) => JSON.stringify({ courses: Object.values(sim.player.school!.courses!).filter((r) => r.term === 0), history: sim.player.school!.history.filter((h) => h.term === 0), standing: sim.player.school!.history.find((h) => h.term === 0)!.standing });
    expect(at15(S.reloaded)).toBe(at15(S.b));
  });
});
