/**
 * Productions and craft defects found by the triage of 2026-10-12, each held here against the engine (from 2026-10-12):
 * - a missed lab counted toward the term's two missed calls but never took a student out of the casting pool, so two
 *   labs missed left them castable where one lab and one rehearsal took them out;
 * - a student on a leave of absence could still join a Cabaret show or the Summer Cabaret's company;
 * - Your Work So Far's Reliability read this term's calls alone, and was gone at each new term until six more were made.
 * Run It With Your Partner on a scene for class, offered and moving nothing, was the fourth; tests/defects-g8-9.test.ts
 * holds it, and nothing more was needed here.
 *
 * PLAYER JOURNEYS play through the clock and the commands; FIXTURES set a state by hand to reach one rule, and say so.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { ARTISTRY, identityOf } from '@/engine/systems/artistry';
import { ESTIMATE, LAB_KIND, cabaretRefusal, dayKeyAt, summerRefusal } from '@/engine/systems/school';
import { healthOf } from '@/engine/systems/health';
import { YALE_DRAMA } from '@/engine/content/school';

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, zone);
const student = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
/** Played by somebody who looks after themselves, awake through the day, as tests/defects-g8-1.test.ts plays one. */
const tended = (sim: Simulation, until: number, step = 6 * MS_HOUR) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + step)); } };
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const pendingOf = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.kind === kind && i.status === 'pending' && i.payload.personId === sim.player.id).sort((a, b) => a.at - b.at);

describe('PLAYER JOURNEY: two Drama 50 labs missed in the first fall', () => {
  it('take the student out of the casting pool, as two missed calls of any kind do, said once', () => {
    const sim = student('g814-labs');
    tended(sim, at(2026, 9, 1));
    const labs = pendingOf(sim, LAB_KIND);
    expect(labs.length).toBeGreaterThan(2);
    // Away in New York for the first lab's afternoon: one missed call, and still in the pool.
    tended(sim, labs[0]!.at - MS_HOUR, MS_HOUR);
    sim.player.currentLocationId = 'us-ny-newyork';
    tended(sim, labs[0]!.at + MS_HOUR, MS_HOUR);
    sim.player.currentLocationId = YALE_DRAMA.cityId;
    const school = sim.player.school!;
    expect(labs[0]!.status).toBe('missed');
    expect(school.tally.calls - school.tally.answered).toBe(1);
    expect(school.castable).toBe(true);
    // And for the second: the term's missed calls reach the count, and the chair takes them out.
    tended(sim, labs[1]!.at - MS_HOUR, MS_HOUR);
    sim.player.currentLocationId = 'us-ny-newyork';
    tended(sim, labs[1]!.at + MS_HOUR, MS_HOUR);
    sim.player.currentLocationId = YALE_DRAMA.cityId;
    expect(labs[1]!.status).toBe('missed');
    expect(school.tally.calls - school.tally.answered).toBe(ESTIMATE.missedCallsOut);
    expect(school.castable).toBe(false);
    const out = titled(sim, 'Out Of The Casting Pool');
    expect(out).toHaveLength(1);
    expect(out[0]!.body).not.toMatch(/rehearsal/);
    // A third missed doesn't say it again.
    tended(sim, labs[2]!.at - MS_HOUR, MS_HOUR);
    sim.player.currentLocationId = 'us-ny-newyork';
    tended(sim, labs[2]!.at + MS_HOUR, MS_HOUR);
    sim.player.currentLocationId = YALE_DRAMA.cityId;
    expect(titled(sim, 'Out Of The Casting Pool')).toHaveLength(1);
  }, 120_000);

  it('excused in hospital or with the day called in, a lab isn’t a missed call, and the student stays in the pool', () => {
    const sim = student('g814-labs-excused');
    tended(sim, at(2026, 9, 1));
    const labs = pendingOf(sim, LAB_KIND);
    const school = sim.player.school!;
    for (const lab of labs.slice(0, 2)) {
      tended(sim, lab.at - 2 * MS_HOUR, MS_HOUR);
      // FIXTURE: the afternoon called in sick, as `school.call_in_sick` keeps it.
      school.sickDay = dayKeyAt(lab.at);
      tended(sim, lab.at + MS_HOUR, MS_HOUR);
      expect(lab.status).toBe('missed');
    }
    expect(school.tally.calls - school.tally.answered).toBe(0);
    expect(school.castable).toBe(true);
    expect(titled(sim, 'Out Of The Casting Pool')).toHaveLength(0);
  }, 120_000);
});

describe('PLAYER JOURNEY: a medical leave in the first spring', () => {
  it('refuses a Cabaret show and the Summer Cabaret’s company, as the leave’s own notice and its cancellations say', () => {
    const sim = student('g814-leave');
    sim.advanceTo(at(2027, 3, 1, 12));
    // TEST SETUP: in good standing, which the summer company asks of a student; this is a test of the leave, not the year.
    sim.player.school!.standing = 'good';
    sim.player.currentLocationId = YALE_DRAMA.cityId;
    // Before the leave, the summer company would take them.
    expect(summerRefusal(sim, sim.player)).toBeUndefined();
    const cabaretBefore = cabaretRefusal(sim, sim.player);
    // FIXTURE: the flu, as `careFor` gives one, which a Yale Health physician's recommendation rests on.
    healthOf(sim.player).fluUntil = sim.now + 4 * MS_DAY;
    const asked = sim.must<{ decideAt: number }>({ kind: 'school.request_leave', payload: { kind: 'medical', reason: 'illness' } });
    tended(sim, asked.decideAt + MS_HOUR);
    const school = sim.player.school!;
    expect(school.leave?.status).toBe('on');
    expect(school.standing).toBe('good');
    expect(summerRefusal(sim, sim.player)).toBe('You’re on leave, and a student on leave can’t take part in the Summer Cabaret.');
    expect(sim.execute({ kind: 'school.summer_cabaret', payload: {} }).error).toBe('You’re on leave, and a student on leave can’t take part in the Summer Cabaret.');
    expect(school.summer).toBeUndefined();
    expect(cabaretRefusal(sim, sim.player)).toBe('You’re on leave, and a student on leave can’t take part in the Yale Cabaret.');
    expect(sim.execute({ kind: 'school.cabaret', payload: {} }).error).toBe('You’re on leave, and a student on leave can’t take part in the Yale Cabaret.');
    // What was refused before the leave for its own reason is still told apart from the leave.
    expect(cabaretBefore).not.toBe('You’re on leave, and a student on leave can’t take part in the Yale Cabaret.');
  }, 240_000);
});

describe('PLAYER JOURNEY: Your Work So Far’s Reliability across a new term', () => {
  it('reads the calls of the whole program, so a first fall’s labs are still counted in the spring', () => {
    const sim = student('g814-reliability');
    sim.advanceTo(at(2026, 12, 20, 12));
    const school = sim.player.school!;
    const fall = { calls: school.tally.calls, answered: school.tally.answered };
    expect(fall.calls).toBeGreaterThanOrEqual(ARTISTRY.least);
    const before = identityOf(sim.player).reliability!;
    expect(before.line).toMatch(new RegExp(`^${fall.answered} of ${fall.calls} calls answered;`));
    // The spring term begins: its own tally, the attendance the faculty read, starts again.
    sim.advanceTo(at(2027, 1, 20, 12));
    expect(school.termsBegun).toBe(2);
    expect(school.callsBefore).toEqual(fall);
    const spring = school.tally;
    const after = identityOf(sim.player).reliability;
    expect(after).toBeDefined();
    expect(after!.line).toMatch(new RegExp(`^${fall.answered + spring.answered} of ${fall.calls + spring.calls} calls answered;`));
  }, 240_000);
});
