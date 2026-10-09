/**
 * What the school audit of 2026-10-10 found untested: a classmate's moment answered once, an invitation kept on the
 * calendar and run, one left unanswered lapsing at its cost; new feedback read before the next step; and a
 * classmate's ability grown as a session grows the player's, never past 100.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_DAY, instantFromZoned, zonedParts } from '@/engine/core/time';
import { CLASS, MOMENT_KIND, STUDY_KIND, momentsOf, type Moment } from '@/engine/systems/classmates';
import { courseworkOf, prepareRefusal, trustOf, type Assignment } from '@/engine/systems/coursework';
import { templateById } from '@/engine/content/coursework';
import { growMateAbility, mateAbilities } from '@/engine/systems/school';

const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
/** TEST SETUP: a moment brought by the first classmate, open for a day. */
function moment(sim: ReturnType<typeof life>, kind: Moment['kind'], extra: Partial<Moment> = {}): Moment {
  const m: Moment = { id: `m-${kind}`, mate: 0, kind, at: sim.now, until: sim.now + MS_DAY, status: 'open', text: 'test', ...extra } as Moment;
  momentsOf(courseworkOf(sim, sim.player)!).push(m);
  sim.schedule({ at: m.until, kind: MOMENT_KIND, label: 'Answer', category: 'school', priority: 33, requiresPlayer: false, payload: { personId: sim.player.id, momentId: m.id } });
  return m;
}

describe('a classmate’s invitation to run lines', () => {
  it('said yes to, goes on the calendar, is answered once, and kept builds trust', () => {
    const sim = life('moment-study');
    const mate = sim.player.school!.classmates[0]!;
    // Two evenings on, at seven, as an invitation is (`CLASS.study.hour`).
    const p = zonedParts(sim.now, sim.zone);
    const when = instantFromZoned({ year: p.year, month: p.month, day: p.day + 2, hour: CLASS.study.hour }, sim.zone);
    moment(sim, 'study', { when });
    expect(sim.execute({ kind: 'school.respond', payload: { momentId: 'm-study', choice: 'yes' } }).ok).toBe(true);
    expect(sim.execute({ kind: 'school.respond', payload: { momentId: 'm-study', choice: 'yes' } }).error).toBe('You’ve answered it.');
    const booked = sim.universe.scheduled.find((i) => i.kind === STUDY_KIND && i.status === 'pending');
    expect(booked?.at).toBe(when);
    const before = trustOf(mate);
    sim.advanceTo(when + 2 * 60 * 60_000);
    expect(booked!.status).not.toBe('missed');
    expect(trustOf(mate)).toBe(before + CLASS.study.kept.trust);
  });

  it('left unanswered, lapses, and costs a little trust', () => {
    const sim = life('moment-lapse');
    const mate = sim.player.school!.classmates[0]!;
    const before = trustOf(mate);
    const m = moment(sim, 'study', { when: sim.now + 2 * MS_DAY });
    sim.advanceTo(m.until + 60_000);
    expect(m.status).toBe('lapsed');
    expect(trustOf(mate)).toBe(before + CLASS.study.unanswered);
    expect(sim.execute({ kind: 'school.respond', payload: { momentId: m.id, choice: 'yes' } }).error).toBe('It’s too late to answer: the moment passed.');
  });
});

describe('new feedback', () => {
  it('is read before the next step of the work, and read once', () => {
    const sim = life('feedback-read');
    const t = templateById('movement-score')!;
    const a = { id: 'fb', template: t.id, course: 'x', term: 0, status: 'revising', prep: {}, answers: {}, steps: {}, practicedOn: {}, trained: 0, rehearsals: [], feedback: { course: 'x', teachers: 'y', text: 'z', focus: { kind: 'dim', dim: 'memorization' } } } as unknown as Assignment;
    courseworkOf(sim, sim.player)!.assignments.push(a);
    const step = t.activities.find((x) => x.dim !== 'revision')!.id;
    expect(prepareRefusal(sim, sim.player, a, step)).toBe('There’s new feedback on this: read it first.');
    expect(sim.execute({ kind: 'school.read_feedback', payload: { assignmentId: 'fb' } }).ok).toBe(true);
    expect(prepareRefusal(sim, sim.player, a, step)).not.toBe('There’s new feedback on this: read it first.');
    expect(sim.execute({ kind: 'school.read_feedback', payload: { assignmentId: 'fb' } }).error).toBe('Read already.');
  });
});

describe('a classmate’s ability', () => {
  it('grows as a session grows the player’s, less the nearer the reach, and never past 100', () => {
    const sim = life('mate-grow');
    const a = mateAbilities(sim, sim.player, 0);
    const start = a.listening;
    growMateAbility(sim, sim.player, 0, 'listening', 1, 1);
    const first = a.listening - start;
    expect(first).toBeGreaterThan(0);
    growMateAbility(sim, sim.player, 0, 'listening', 1, 1);
    expect(a.listening - start - first).toBeLessThan(first);
    a.listening = 100;
    growMateAbility(sim, sim.player, 0, 'listening', 1, 1);
    expect(a.listening).toBe(100);
  });
});
