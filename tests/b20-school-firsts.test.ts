/**
 * Brief 20's School area: first-time events, once (2026-10-21, criteria C2, "no first-time event twice"). One student
 * (seed `b20-school-firsts`, New York, modest means) played by the attentive student from creation to 25 January 2027:
 * the welcome, orientation's five sessions, the first pieces shown and their feedback, the first term's review and the
 * first casting (the Carlotta Festival's, at the spring's start). The same life is played again, saved and opened six
 * times on the way (mid-orientation, the first class, the first pieces shown, the spring's start and after its casting),
 * and must come out the same to the byte: a load that ran a first-time event again, or dropped one, would differ.
 *
 * Orientation's registration, slept through, is caught up once, and the session doesn't come again; never caught up,
 * the classes and the shifts it opens don't count the student (the guide's promises school.orientation>school.standing
 * and >school.shifts).
 */
import { beforeAll, describe, expect, it } from 'vitest';
import type { Simulation } from '@/engine/core/simulation';
import { serialise } from '@/engine/persistence/adapter';
import { ORIENTATION, ORIENTATION_KIND, courseworkOf } from '@/engine/systems/coursework';
import { CLASSES_KIND, SHIFT_KIND, registered } from '@/engine/systems/school';
import { at, play, reload, student, tallyOf, titled } from './setup/b20-school';

const SEED = 'b20-school-firsts';
const END = at(2027, 1, 25);

describe('first-time events come once, played straight through and saved and opened six times (seed b20-school-firsts)', () => {
  const S = {} as { straight: Simulation; reopened: Simulation };
  beforeAll(() => {
    S.straight = play(student(SEED, { wealth: 'modest' }), END);
    let sim = student(SEED, { wealth: 'modest' });
    for (const when of [at(2026, 8, 24, 12), at(2026, 8, 26, 12), at(2026, 9, 1, 12), at(2026, 9, 15, 12), at(2027, 1, 11, 8), at(2027, 1, 20, 12)]) sim = reload(play(sim, when));
    S.reopened = play(sim, END);
  }, 120_000);

  it('the life saved and opened six times is the same to the byte as the life played straight through', () => {
    expect(serialise(S.reopened.universe)).toBe(serialise(S.straight.universe));
  });

  it('the welcome, each orientation session, the first term’s review and the first cast list, each once', () => {
    const sim = S.reopened;
    expect(titled(sim, 'Welcome To The Class Of 2029')).toHaveLength(1);
    for (const o of ORIENTATION) expect(titled(sim, o.label), o.label).toHaveLength(1);
    expect(sim.universe.scheduled.filter((i) => i.kind === ORIENTATION_KIND && i.payload.personId === sim.player.id).map((i) => i.status)).toEqual(ORIENTATION.map(() => 'done'));
    expect(titled(sim, /^Cast: /)).toHaveLength(1);
    expect(sim.player.school!.history.filter((h) => h.term === 0)).toHaveLength(1);
    expect(titled(sim, /^(In Good Standing|A Notice Of Academic Concern|Academic Warning)$/)).toHaveLength(1);
  });

  it('the first pieces shown are shown once each, with their feedback given once', () => {
    const work = courseworkOf(S.reopened, S.reopened.player)!.assignments.filter((a) => a.shown).sort((a, b) => a.shown!.at - b.shown!.at);
    expect(work.length).toBeGreaterThan(40);
    const first = work[0]!;
    expect(first.feedback).toBeDefined();
    // One showing a piece: no two pieces share an id.
    expect(new Set(work.map((a) => a.id)).size).toBe(work.length);
    // Each session caught up after it ran is refused: it's done.
    for (const o of ORIENTATION) expect(S.reopened.execute({ kind: 'school.orientation', payload: { task: o.task } }).error).toMatch(/^Done on /);
  });
});

describe('orientation’s sessions on the calendar (seed b20-school-firsts)', () => {
  it('each session is on the calendar wanting the player, and the clock moved as the screen moves it stops at the first', () => {
    const sim = student(SEED, { wealth: 'modest' });
    const sessions = sim.universe.scheduled.filter((i) => i.kind === ORIENTATION_KIND && i.payload.personId === sim.player.id);
    expect(sessions.map((i) => [i.label, i.requiresPlayer])).toEqual(ORIENTATION.map((o) => [o.label, true]));
    const r = sim.advanceTo(at(2026, 8, 24, 14), { stopOnPlayerRequired: true });
    expect(r.interruptedBy?.kind).toBe(ORIENTATION_KIND);
    expect(r.interruptedBy?.at).toBe(at(2026, 8, 24, 10));
  });
});

describe('orientation’s registration, slept through (seed b20-school-firsts)', () => {
  /** To bed at eight on the first morning for four hours, through Registration And Your Account at ten. */
  const sleepThroughRegistration = (sim: Simulation): boolean => sim.now === at(2026, 8, 24, 7, 30) && sim.execute({ kind: 'life.sleep', payload: { hours: 4, startAt: at(2026, 8, 24, 8) } }).ok;

  it('caught up the same day, once: registered, told once, and the session doesn’t come again; classes count them', () => {
    let sim = play(student(SEED, { wealth: 'modest' }), at(2026, 8, 24, 14), sleepThroughRegistration);
    const session = sim.universe.scheduled.find((i) => i.kind === ORIENTATION_KIND && i.payload.task === 'register')!;
    expect(session.status).toBe('missed');
    expect(registered(sim.player.school, courseworkOf(sim, sim.player))).toBe(false);
    const told = sim.must<{ told: string }>({ kind: 'school.orientation', payload: { task: 'register' } });
    expect(told.told).toMatch(/tuition scholarship/);
    expect(sim.execute({ kind: 'school.orientation', payload: { task: 'register' } }).error).toMatch(/^Done on /);
    sim = reload(sim);
    expect(sim.execute({ kind: 'school.orientation', payload: { task: 'register' } }).error).toMatch(/^Done on /);
    play(sim, at(2026, 9, 7));
    expect(registered(sim.player.school, courseworkOf(sim, sim.player))).toBe(true);
    expect(tallyOf(sim).attended).toBe(tallyOf(sim).classDays);
    expect(titled(sim, 'Not Registered')).toHaveLength(0);
  }, 60_000);

  it('never caught up: every class day counts them absent, unexcused, and the Saturday shift is missed; the student registered is counted', () => {
    const missed = play(student(SEED, { wealth: 'modest' }), at(2026, 8, 24, 14), sleepThroughRegistration);
    // The attentive student's hours, but the registration never caught up.
    play(missed, at(2026, 9, 7));
    const kept = play(student(SEED, { wealth: 'modest' }), at(2026, 9, 7));
    expect(registered(missed.player.school, courseworkOf(missed, missed.player))).toBe(false);
    const days = missed.universe.scheduled.filter((i) => i.kind === CLASSES_KIND && i.payload.personId === missed.player.id && i.status !== 'pending');
    expect(days.length).toBeGreaterThanOrEqual(5);
    expect(days.every((i) => i.status === 'missed')).toBe(true);
    expect(tallyOf(missed)).toMatchObject({ classDays: days.length, attended: 0, excused: 0 });
    expect(titled(missed, 'Not Registered').at(-1)!.body).toMatch(/counted absent from today’s classes/);
    const shift = missed.universe.scheduled.find((i) => i.kind === SHIFT_KIND && i.payload.personId === missed.player.id && i.status !== 'pending')!;
    expect(shift.status).toBe('missed');
    expect(titled(missed, 'A Shift You Couldn’t Work')).toHaveLength(1);
    // Missed for want of the I-9, not ill: no hours to convert.
    expect(missed.player.school!.excusedHours).toBeUndefined();
    expect(missed.execute({ kind: 'school.request_conversion', payload: {} }).error).toBe('There are no hours to convert at January’s processing. Only assigned hours you missed while ill or hurt count then.');
    // The student who registered: the same days, each attended, the shift worked.
    expect(tallyOf(kept)).toMatchObject({ classDays: days.length, attended: days.length });
    expect(tallyOf(kept).worked).toBe(tallyOf(kept).shifts);
  }, 60_000);
});
