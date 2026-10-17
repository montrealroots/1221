/**
 * What the school audit of 2026-10-10 found untested: a classmate's moment answered once, an invitation kept on the
 * calendar and run, one left unanswered lapsing at its cost; new feedback read before the next step; and a
 * classmate's ability grown as a session grows the player's, never past 100.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts } from '@/engine/core/time';
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

/**
 * An invitation still open when the School ends (from 2026-10-17, brief 13's journeys,
 * docs/verification/playthroughs-2026-10-17/journeys-criteria.md, check 9): the moment keeps its own lapse and can be
 * declined, as `setStanding` keeps it, but the evening it asks for is the School's, and every one of those is called off
 * at the end. Until then a yes after the end put the evening on the calendar and it was played: journey J02's first run
 * (seed j13-2) said yes three hours after its degree was withheld and ran a classmate's lines the next evening.
 */
describe('a classmate’s invitation to run lines, once the School has ended', () => {
  it('PLAYER JOURNEY: brought in class on 3 September 2026 and the student withdrawn that morning by the command, Say Yes is refused in words that say why and leave Say No, which is taken; nothing goes on the calendar, through a reload; the twin who answers before withdrawing has the evening booked (TEST SETUP: kept rested while the clock runs)', () => {
    let sim = life('study-after-end');
    let m: Moment | undefined;
    while (!m && sim.now < instantFromZoned({ year: 2026, month: 9, day: 20, hour: 0 }, sim.zone)) {
      Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
      sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
      sim.advanceTo(sim.now + 2 * MS_HOUR);
      m = momentsOf(courseworkOf(sim, sim.player)!).find((x) => x.kind === 'study' && x.status === 'open');
    }
    expect(m, 'an invitation to run lines, brought in class').toBeDefined();
    expect(zonedParts(sim.now, sim.zone)).toMatchObject({ year: 2026, month: 9, day: 3 });
    // The twin answers before the end: the evening is booked.
    const twin = loadSave(deserialise(serialise(sim.universe)));
    expect(twin.execute({ kind: 'school.respond', payload: { momentId: m!.id, choice: 'yes' } }).ok).toBe(true);
    expect(twin.universe.scheduled.filter((i) => i.kind === STUDY_KIND && i.status === 'pending')).toHaveLength(1);
    // This one withdraws first, by the command.
    expect(sim.execute({ kind: 'school.withdraw', payload: { confirm: true } }).ok).toBe(true);
    expect(sim.player.school!.standing).toBe('withdrawn');
    const open = () => momentsOf(courseworkOf(sim, sim.player)!).find((x) => x.id === m!.id)!;
    expect(open().status).toBe('open');
    const words = 'Your terms at the School are over: there’s no scene left to run lines for. Say no instead.';
    expect(sim.execute({ kind: 'school.respond', payload: { momentId: m!.id, choice: 'yes' } }).error).toBe(words);
    sim = loadSave(deserialise(serialise(sim.universe)));
    expect(sim.execute({ kind: 'school.respond', payload: { momentId: m!.id, choice: 'yes' } }).error).toBe(words);
    expect(sim.execute({ kind: 'school.respond', payload: { momentId: m!.id, choice: 'no' } }).ok).toBe(true);
    expect(open().status).not.toBe('open');
    sim.advanceTo(m!.when! + 2 * MS_HOUR);
    expect(sim.universe.scheduled.filter((i) => i.kind === STUDY_KIND)).toHaveLength(0);
  }, 120_000);
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
