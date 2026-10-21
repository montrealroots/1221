/**
 * Brief 20's School area, B1 and B3: the degree, who's eligible and who isn't, through the clock (2026-10-21). Every life
 * opens the same played save, `tests/fixtures/journey-j01-last-term-8283f80c.json.gz` (journey J01 at 1 March 2029, its
 * last term, in good standing, every earlier course passed), and moves the clock a week at a time, as the Advance menu
 * moves it, the player there for whatever wants them unless a command of theirs says otherwise:
 *
 * - G1 keeps every class: the degree at Commencement.
 * - G2 sleeps through the class days of March (`life.sleep` at seven, four hours): one course failed, thirty days to ask
 *   for a repeat of the year or an additional term, and nothing asked, the degree withheld at their end.
 * - G3 sleeps through them to mid-April: Failures past the Bulletin's count, the faculty's review, academic warning to
 *   repeat the year, the thirty days to ask, the request granted.
 * - G4 is ill through March (TEST SETUP: the flu, as `careFor` gives one, set by hand each class morning; the call in
 *   sick is the player's, `school.call_in_sick`): Incompletes, no part in Commencement, then each made up
 *   (`school.make_up`) and the degree conferred without the ceremony.
 * - G5 is G4 with nothing made up: reminded a week before the deadline, then Permanent Incompletes, the degree withheld.
 *
 * No leak: the money is the same whichever way the degree goes, until the paths ask for different things.
 */
import { beforeAll, describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';
import { loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { healthOf } from '@/engine/systems/health';
import { COMMENCEMENT_KIND, TERM_KIND, coursesFor } from '@/engine/systems/school';
import { degreeShortfall } from '@/engine/systems/courserecord';
import { REPEAT_DUE_KIND } from '@/engine/systems/leave';
import { at, balances, partsOf, pendingOf, titled } from './setup/b20-school';

const RAW = gunzipSync(readFileSync('tests/fixtures/journey-j01-last-term-8283f80c.json.gz')).toString('utf8');
const open = (): Simulation => loadSave(deserialise(RAW) as never);
const classDay = (sim: Simulation) => { const p = partsOf(sim); return coursesFor(sim.player.school!, { year: p.year, month: p.month, day: p.day }).length > 0; };
const REVIEW = at(2029, 4, 27, 17);
const COMMENCEMENT = at(2029, 5, 21, 10);

/** The clock a week at a time, as the Advance menu's Next Week moves it, to a moment. */
const weeks = (sim: Simulation, until: number) => { while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + 7 * MS_DAY)); return sim; };
/** Each class morning from 2 March to a day, at seven: back to bed for four hours, through the day's classes. */
function sleepsThrough(sim: Simulation, to: number): Simulation {
  sim.advanceTo(at(2029, 3, 2, 7));
  while (sim.now < to) {
    if (classDay(sim)) sim.execute({ kind: 'life.sleep', payload: { hours: 4 } });
    sim.advanceTo(at(partsOf(sim).year, partsOf(sim).month, partsOf(sim).day, 7) + MS_DAY);
  }
  return sim;
}
/** Each class morning from 2 March to a day, at eight: ill (TEST SETUP), and called in sick. */
function illThrough(sim: Simulation, to: number): Simulation {
  sim.advanceTo(at(2029, 3, 2, 8));
  while (sim.now < to) {
    if (classDay(sim)) {
      healthOf(sim.player).fluUntil = sim.now + 30 * 3_600_000;
      sim.must({ kind: 'school.call_in_sick', payload: {} });
    }
    sim.advanceTo(at(partsOf(sim).year, partsOf(sim).month, partsOf(sim).day, 8) + MS_DAY);
  }
  return sim;
}

describe('the last year’s faculty review keeps a student on warning to repeat the year, and the repeat is there to ask for', () => {
  it('G3: Failures past the Bulletin’s count bring the review’s warning and the thirty days to ask; asked, the repeat is granted', () => {
    const sim = weeks(sleepsThrough(open(), at(2029, 4, 14)), REVIEW + 3_600_000);
    const school = sim.player.school!;
    expect(degreeShortfall(school).failed.length).toBeGreaterThanOrEqual(2);
    const review = titled(sim, 'A Faculty Review: On Warning');
    expect(review).toHaveLength(1);
    expect(review[0]!.body).toMatch(/kept you on academic warning, to repeat the year: ask to repeat it at the year’s end, on the Standing And Craft tab\.$/);
    // What the review said is what's there: on warning, not withheld, with the thirty days to ask.
    expect(school.standing).toBe('warning');
    expect(titled(sim, 'The Degree Isn’t Recommended')).toHaveLength(0);
    expect(titled(sim, 'Your Degree Isn’t Complete')).toHaveLength(1);
    expect(pendingOf(sim, REPEAT_DUE_KIND)).toHaveLength(1);
    expect(pendingOf(sim, COMMENCEMENT_KIND)).toHaveLength(0);
    const asked = sim.must<{ decideAt: number }>({ kind: 'school.request_repeat', payload: {} });
    weeks(sim, asked.decideAt + 3_600_000);
    expect(school.repeat!.status).toBe('granted');
    expect(titled(sim, 'You’ll Repeat The Year')).toHaveLength(1);
    expect(pendingOf(sim, TERM_KIND)).toHaveLength(1);
    expect(school.standing).toBe('warning');
  }, 60_000);
});

describe('B1/B3: the degree at Commencement, and the students who don’t meet it (the last-term save of J01)', () => {
  const S = {} as { g1: Simulation; g2: Simulation; g4: Simulation; g5: Simulation; madeUp: number; owedAtReview: number };
  beforeAll(() => {
    S.g1 = weeks(open(), at(2029, 5, 23));
    S.g2 = weeks(sleepsThrough(open(), at(2029, 3, 31)), at(2029, 5, 30));
    const ill = illThrough(open(), at(2029, 3, 31));
    weeks(ill, REVIEW + 3_600_000);
    S.owedAtReview = Object.values(ill.player.school!.courses!).filter((r) => r.result === 'incomplete').reduce((n, r) => n + (r.owed ?? 0), 0);
    const raw = serialise(ill.universe);
    S.g5 = weeks(loadSave(deserialise(raw) as never), at(2029, 5, 30));
    // G4: each Incomplete made up after Commencement, a session at a time on the Standing tab, within its month.
    S.g4 = weeks(loadSave(deserialise(raw) as never), at(2029, 5, 22, 9));
    S.madeUp = 0;
    for (const [key, r] of Object.entries(S.g4.player.school!.courses!)) {
      while (r.result === 'incomplete') { S.g4.must({ kind: 'school.make_up', payload: { key } }); S.madeUp += 1; }
    }
    weeks(S.g4, at(2029, 5, 30));
  }, 60_000);

  it('G1, every class kept: the degree at Commencement, once', () => {
    expect(S.g1.player.school!.standing).toBe('graduated');
    expect(titled(S.g1, 'Your MFA Is Conferred')).toHaveLength(1);
    expect(titled(S.g1, 'Your MFA Is Conferred')[0]!.at).toBe(COMMENCEMENT);
    expect(degreeShortfall(S.g1.player.school!)).toEqual({ failed: [], incomplete: [] });
  });

  it('G2, one course failed: thirty days to ask, no part in Commencement, and with nothing asked the degree withheld at their end', () => {
    const s = S.g2.player.school!;
    expect(degreeShortfall(s).failed).toHaveLength(1);
    const offer = titled(S.g2, 'Your Degree Isn’t Complete');
    expect(offer).toHaveLength(1);
    expect(offer[0]!.at).toBe(REVIEW);
    expect(titled(S.g2, 'Your MFA Is Conferred')).toHaveLength(0);
    expect(s.standing).toBe('withheld');
    expect(s.endedAt).toBe(REVIEW + 30 * MS_DAY);
    expect(titled(S.g2, 'The Degree Isn’t Recommended')[0]!.body).toMatch(/^The thirty days to finish the degree ended with nothing asked for/);
  });

  it('G4, ill through March: Incompletes, no part in Commencement, then each made up and the degree conferred without the ceremony', () => {
    expect(S.owedAtReview).toBeGreaterThan(0);
    expect(S.madeUp).toBe(S.owedAtReview);
    expect(titled(S.g4, /^Incomplete/)).toHaveLength(1);
    expect(titled(S.g4, 'Not At Commencement')).toHaveLength(1);
    expect(titled(S.g4, 'Not At Commencement')[0]!.at).toBe(COMMENCEMENT);
    expect(S.g4.player.school!.standing).toBe('graduated');
    const conferred = titled(S.g4, 'Your MFA Is Conferred');
    expect(conferred).toHaveLength(1);
    expect(conferred[0]!.at).toBeGreaterThan(COMMENCEMENT);
    expect(conferred[0]!.body).toMatch(/^Your last Incomplete made up, the faculty confer the MFA in Acting, class of 2029, without the ceremony\./);
  });

  it('G5, the same Incompletes not made up: reminded a week before, then Permanent at the deadline, and the degree withheld', () => {
    const s = S.g5.player.school!;
    const deadline = REVIEW + 30 * MS_DAY;
    expect(titled(S.g5, 'Not At Commencement')).toHaveLength(1);
    expect(titled(S.g5, /^A Week Left/)).toHaveLength(1);
    expect(titled(S.g5, /^A Week Left/)[0]!.at).toBe(deadline - 7 * MS_DAY);
    expect(Object.values(s.courses!).filter((r) => r.result === 'permanent').length).toBeGreaterThan(0);
    expect(s.standing).toBe('withheld');
    expect(s.endedAt).toBe(deadline);
    expect(titled(S.g5, 'Your MFA Is Conferred')).toHaveLength(0);
  });

  it('a day called in sick is left out of the attendance the review counts: March ill isn’t short, March slept through is', () => {
    const review = (sim: Simulation) => sim.player.school!.history.find((h) => h.term === 5)!;
    const ill = S.g5.player.school!;
    expect(ill.tally.excused).toBeGreaterThanOrEqual(15);
    expect(review(S.g5).attendance).toBeGreaterThanOrEqual(0.9);
    expect(review(S.g5).reason).not.toMatch(/under the 90%/);
    expect(review(S.g2).attendance).toBeLessThan(0.9);
    expect(review(S.g2).reason).toMatch(/That’s under the 90% the program asks\./);
    // Excused meetings are kept on each course’s record as excused, and make it Incomplete, not failed.
    const courses = Object.values(ill.courses!).filter((r) => r.term === 5);
    expect(courses.some((r) => r.excused > 0 && r.result === 'permanent')).toBe(true);
    expect(courses.every((r) => r.result !== 'fail')).toBe(true);
  });

  it('no leak: up to Commencement, the money of the student who kept every class and the student ill through March are the same', () => {
    // Read at Commencement's eve: the ill student's paths part after it (sessions made up, or not).
    const g1 = weeks(open(), COMMENCEMENT - MS_DAY);
    const ill = weeks(illThrough(open(), at(2029, 3, 31)), COMMENCEMENT - MS_DAY);
    const money = (sim: Simulation) => Object.fromEntries(Object.entries(balances(sim)).filter(([name]) => !/Card|Freedom/.test(name)));
    expect(money(ill)).toEqual(money(g1));
  }, 60_000);
});
