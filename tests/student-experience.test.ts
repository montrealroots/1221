/**
 * The student's experience, completed (from 2026-10-10): each repair held by the behavior it fixed. PLAYER JOURNEYS
 * play forward through commands; FIXTURES set a state by hand to reach one rule, and say so.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { courseworkOf, type Assignment } from '@/engine/systems/coursework';
import { momentsOf, sharedWork, STUDY_KIND } from '@/engine/systems/classmates';
import { CABARET_KIND, evaluate } from '@/engine/systems/school';
import { yaleUntil } from '@/engine/systems/health';
import { graceDays, optRefusal, usStatusEnds } from '@/engine/systems/permission';

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, zone);
const student = (seed: string, extra: Record<string, unknown> = {}) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...extra });
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };

describe('running lines with a classmate', () => {
  it('works on the scene you share with them, the one you chose, and says what moved; never another partner’s', () => {
    let sim = student('se-lines');
    tended(sim, at(2026, 9, 2, 16));
    const cw = courseworkOf(sim, sim.player)!;
    // FIXTURE: three open scenes, two with classmate 0 and one with classmate 1, all with lines at nothing.
    const scene = (id: string, partner: number) => ({ ...cw.assignments.find((a) => a.sceneId)!, id, partner, status: 'open', rehearsals: [], asks: [], prep: { ...cw.assignments.find((a) => a.sceneId)!.prep, memorization: 0 } }) as Assignment;
    cw.assignments.push(scene('mine-a', 0), scene('mine-b', 0), scene('theirs', 1));
    expect(sharedWork(sim, sim.player, 0).map((a) => a.id)).toEqual(expect.arrayContaining(['mine-a', 'mine-b']));
    expect(sharedWork(sim, sim.player, 0).map((a) => a.id)).not.toContain('theirs');
    // FIXTURE: classmate 0 asks to run lines tomorrow evening.
    const when = at(2026, 9, 3, 19);
    momentsOf(cw).push({ id: 'm-study', mate: 0, kind: 'study', at: sim.now, until: sim.now + MS_DAY, status: 'open', when, text: 'Run lines?' } as never);
    expect(sim.execute({ kind: 'school.respond', payload: { momentId: 'm-study', choice: 'yes', assignmentId: 'theirs' } }).ok).toBe(false);
    sim.must({ kind: 'school.respond', payload: { momentId: 'm-study', choice: 'yes', assignmentId: 'mine-b' } });
    expect(sim.universe.scheduled.find((i) => i.kind === STUDY_KIND && i.status === 'pending')?.payload.assignmentId).toBe('mine-b');
    sim = reload(sim);
    tended(sim, when + 2 * MS_HOUR);
    const by = (id: string) => courseworkOf(sim, sim.player)!.assignments.find((a) => a.id === id)!.prep.memorization;
    expect(by('mine-b')).toBeGreaterThan(0);
    expect(by('mine-a')).toBe(0);
    expect(by('theirs')).toBe(0);
    expect(sim.universe.notifications.find((n) => n.title.startsWith('Ran Lines With'))?.body).toMatch(/your lines went from 0% to \d+%/);
  });

  it('with no scene shared, runs their lines: it helps them, moves nothing of yours, and says so', () => {
    const sim = student('se-lines-none');
    tended(sim, at(2026, 9, 2, 16));
    const cw = courseworkOf(sim, sim.player)!;
    for (const a of cw.assignments) if (a.partner === 2) a.partner = 3;
    const before = cw.assignments.map((a) => a.prep.memorization);
    const when = at(2026, 9, 3, 19);
    momentsOf(cw).push({ id: 'm-none', mate: 2, kind: 'study', at: sim.now, until: sim.now + MS_DAY, status: 'open', when, text: 'Run lines?' } as never);
    expect(sim.must<{ done: string }>({ kind: 'school.respond', payload: { momentId: 'm-none', choice: 'yes' } }).done).toMatch(/share no open scene/);
    tended(sim, when + 2 * MS_HOUR);
    const after = courseworkOf(sim, sim.player)!.assignments.slice(0, before.length).map((a) => a.prep.memorization);
    expect(after).toEqual(before);
    expect(sim.universe.notifications.find((n) => n.title.startsWith('Ran Lines With'))?.body).toMatch(/nothing of yours moved/);
  });
});

describe('the Cabaret on academic warning', () => {
  it('takes them out of a show still to come, calls off what’s left, and holds none of it against them', () => {
    const sim = student('se-cabaret');
    tended(sim, at(2026, 9, 7, 12));
    const joined = sim.execute<{ week: string }>({ kind: 'school.cabaret', payload: {} });
    expect(joined.ok, joined.error).toBe(true);
    const calls = () => sim.universe.scheduled.filter((i) => i.kind === CABARET_KIND && i.status === 'pending').length;
    expect(calls()).toBeGreaterThan(0);
    const breaches = sim.player.school!.tally.breaches;
    // FIXTURE: a concern already, and a term short on attendance, which the evaluation turns into a warning.
    sim.player.school!.standing = 'concern';
    Object.assign(sim.player.school!.tally, { classDays: 40, attended: 0, excused: 0 });
    expect(evaluate(sim, sim.player, 0)!.standing).toBe('warning');
    expect(calls()).toBe(0);
    expect(sim.player.school!.cabaret!.withdrawn?.why).toBe('academic warning');
    expect(sim.player.school!.tally.breaches).toBe(breaches);
    expect(sim.universe.notifications.filter((n) => n.title === 'Out Of The Cabaret Show')).toHaveLength(1);
    expect(sim.execute({ kind: 'school.cabaret', payload: {} }).error).toMatch(/academic warning/);
  });
});

describe('leaving the School: withdrawal, dismissal, a degree withheld and the degree are different events', () => {
  const international = (seed: string) => student(seed, { homeRegionId: 'uk-eng-london' });
  it('PLAYER JOURNEY: a withdrawal by the fifteenth day of classes cancels Yale Health back to the term, refunds its premium, and leaves fifteen days’ grace and no OPT', () => {
    let sim = international('se-withdraw-early');
    tended(sim, at(2026, 9, 8, 12));
    const premium = sim.universe.transactions.filter((t) => t.memo.startsWith('Yale Health plan')).length;
    expect(sim.execute({ kind: 'school.withdraw', payload: {} }).error).toMatch(/Confirm/);
    const answer = sim.must<{ early: boolean; refund: number }>({ kind: 'school.withdraw', payload: { confirm: true } });
    expect(answer.early).toBe(true);
    expect(answer.refund > 0).toBe(premium > 0);
    sim = reload(sim);
    const school = sim.player.school!;
    expect(school.standing).toBe('withdrawn');
    expect(yaleUntil(sim.player)).toBe(school.endedAt);
    expect(graceDays(sim.player)).toBe(15);
    expect(usStatusEnds(sim.player)).toBe(school.endedAt! + 15 * MS_DAY);
    expect(optRefusal(sim, sim.player)).toMatch(/degree completed/);
    expect(sim.universe.scheduled.some((i) => i.status === 'pending' && i.kind.startsWith('school.') && i.payload.personId === sim.player.id && i.kind !== 'school.payday')).toBe(false);
    expect(courseworkOf(sim, sim.player)!.assignments.some((a) => a.status === 'open')).toBe(false);
    expect(sim.execute({ kind: 'school.withdraw', payload: { confirm: true } }).ok).toBe(false);
  });

  it('a withdrawal later in the term keeps Yale Health thirty days, with nothing refunded', () => {
    const sim = international('se-withdraw-late');
    tended(sim, at(2026, 10, 14, 12));
    expect(sim.must<{ early: boolean; refund: number }>({ kind: 'school.withdraw', payload: { confirm: true } })).toEqual({ early: false, refund: 0 });
    expect(yaleUntil(sim.player)).toBe(sim.player.school!.endedAt! + 30 * MS_DAY);
  });

  it('a dismissal leaves no grace; a degree withheld fifteen days and no OPT, Yale Health to 31 July; the degree sixty days and OPT', () => {
    const sim = international('se-exits');
    const school = sim.player.school!;
    // FIXTURE: each ending set by hand, read by the rules that follow from it.
    Object.assign(school, { standing: 'dismissed', endedAt: at(2027, 2, 10) });
    expect(graceDays(sim.player)).toBe(0);
    expect(usStatusEnds(sim.player)).toBe(school.endedAt);
    expect(yaleUntil(sim.player)).toBe(school.endedAt! + 30 * MS_DAY);
    Object.assign(school, { standing: 'withheld', endedAt: at(2029, 4, 30) });
    expect(graceDays(sim.player)).toBe(15);
    expect(optRefusal(sim, sim.player)).toMatch(/degree completed/);
    expect(yaleUntil(sim.player)).toBe(instantFromZoned({ year: 2029, month: 8, day: 1, hour: 0 }, zone));
    Object.assign(school, { standing: 'graduated', endedAt: at(2029, 5, 21) });
    expect(graceDays(sim.player)).toBe(60);
    expect(optRefusal(sim, sim.player) ?? '').not.toMatch(/degree completed/);
  });
});
