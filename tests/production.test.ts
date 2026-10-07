/**
 * A production's rehearsal process (`systems/production.ts`, from 2026-10-07),
 * inside the castings the chair assigns: each call's stage, the lines and the
 * blocking kept, a blocking call missed and caught up from the book, the
 * director's notes worked on and taken, the dress played as a night with no
 * house, and what it makes of the nights; played from arrival on 24 August
 * 2026 into the first spring's Carlotta Festival and the Rep understudy.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { breaches } from '@/engine/core/invariants';
import type { Simulation } from '@/engine/core/simulation';
import type { ScheduledItem } from '@/engine/core/scheduler';
import { CALL_KIND, type Casting } from '@/engine/systems/school';
import { routinesOf, stepLabel } from '@/engine/systems/routines';
import { PROCESS, hasProcess, nightFactor, parFor, stagesOf } from '@/engine/systems/production';

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, zone);
const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const tended = (sim: Simulation, until: number) => { while (sim.now < until) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); } };
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
/** Cast for the spring: the Carlotta Festival, and the Rep's Seagull understudied. */
const castForSpring = (seed: string) => {
  const sim = life(seed);
  sim.player.school!.classmates[0]!.craft.scene = 99;
  sim.advanceTo(at(2027, 1, 4, 9) + 60_000);
  return sim;
};
const calls = (sim: Simulation, which: 'school' | 'rep', call = 'rehearsal'): ScheduledItem[] =>
  sim.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.status === 'pending' && i.payload.call === call && (i.payload.which === 'rep') === (which === 'rep')).sort((a, b) => a.at - b.at);
const carlotta = (sim: Simulation) => sim.player.school!.casting!;
const procOf = (c: Casting | undefined) => (hasProcess(c) ? c.process : undefined);
const process = (sim: Simulation) => procOf(carlotta(sim));

describe('the stages of a run of calls', () => {
  it('reads first, blocks for two-fifths, works through, and ends on the technical and the dress', () => {
    expect(stagesOf(12)).toEqual(['read', 'blocking', 'blocking', 'blocking', 'blocking', 'work', 'work', 'work', 'work', 'work', 'tech', 'dress']);
    expect(stagesOf(3)).toEqual(['read', 'blocking', 'work']);
    // A casting from before the process plays as nights did.
    expect(nightFactor(undefined)).toBe(1);
    expect(parFor(12)).toBeGreaterThan(parFor(6));
  });

  it('books the Carlotta’s calls by stage, and the understudy’s as understudy rehearsals', () => {
    const sim = castForSpring('pr-stages');
    const ours = calls(sim, 'school');
    expect(ours).toHaveLength(12);
    expect(ours[0]!.label).toMatch(/: Read-Through$/);
    expect(ours[1]!.label).toMatch(/: Blocking Rehearsal$/);
    expect(ours.at(-2)!.label).toMatch(/: Technical Rehearsal$/);
    expect(ours.at(-1)!.label).toMatch(/: Dress Rehearsal$/);
    expect(ours.map((c) => c.payload.n)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
    const rep = calls(sim, 'rep');
    expect(rep).toHaveLength(11);
    expect(rep.every((c) => c.payload.stage === 'understudy' && /: Understudy Rehearsal$/.test(c.label))).toBe(true);
    // The performances aren't rehearsals and carry no stage.
    expect(calls(sim, 'school', 'performance').every((c) => c.payload.stage === undefined)).toBe(true);
  });
});

describe('the process, played', () => {
  it('an actor who comes to every call and does no more plays at 1, as nights did before the process, through a save midway', () => {
    let sim = castForSpring('pr-attend');
    const ours = calls(sim, 'school');
    tended(sim, ours[5]!.at + 7 * MS_HOUR);
    sim = reload(sim);
    expect(process(sim)).toMatchObject({ calls: 6, blockingMissed: 0 });
    expect(process(sim)!.notes).toHaveLength(1);
    tended(sim, ours.at(-1)!.at + 7 * MS_HOUR);
    const p = process(sim)!;
    expect(p.calls).toBe(12);
    expect(p.notes).toHaveLength(5);
    expect(p.dress).toBeDefined();
    expect(nightFactor(carlotta(sim))).toBeCloseTo(1, 10);
    // The dress is no performance.
    expect(carlotta(sim).performed).toBe(0);
    // Each call resolved once: the read-through's lines a share of what's left, no more.
    expect(p.lines).toBeCloseTo(1 - (1 - PROCESS.call.lines) ** 12, 10);
    expect(breaches(sim.universe)).toEqual([]);
  }, 300_000);

  it('an actor who works the notes and the part between calls is readier, and the notes are taken; one who doesn’t isn’t', () => {
    const sim = castForSpring('pr-diligent');
    const ours = calls(sim, 'school');
    // Before the first call there's no note, and no part learned yet.
    tended(sim, ours[0]!.at - 18 * MS_HOUR);
    expect(sim.execute({ kind: 'school.work_note', payload: {} }).error).toBe('There’s no note to work on.');
    const first = sim.execute<{ lines: number }>({ kind: 'school.learn_part', payload: {} });
    expect(first.ok).toBe(true);
    expect(first.value!.lines).toBeGreaterThan(0);
    // During a call, nothing else: the call holds you.
    tended(sim, ours[0]!.at + MS_HOUR);
    expect(sim.execute({ kind: 'school.learn_part', payload: {} }).error).toMatch(/^You’re at .*Read-Through until /);
    for (let k = 0; k < ours.length - 1; k += 1) {
      // The evening after each call: the part, and the director's note if there is one.
      tended(sim, ours[k]!.at + 6 * MS_HOUR + 30 * 60_000);
      if (process(sim)!.lines < 0.97) expect(sim.execute({ kind: 'school.learn_part', payload: {} }).ok).toBe(true);
      const last = process(sim)!.notes.at(-1);
      if (last && last.taken === undefined) {
        expect(sim.execute({ kind: 'school.work_note', payload: {} }).ok).toBe(true);
        // Once is enough.
        expect(sim.execute({ kind: 'school.work_note', payload: {} }).error).toBe('You’ve worked on it: the next call will show it.');
      }
    }
    tended(sim, ours.at(-1)!.at + 7 * MS_HOUR);
    const p = process(sim)!;
    expect(p.notes.length).toBe(5);
    expect(p.notes.every((n) => n.taken)).toBe(true);
    expect(nightFactor(carlotta(sim))).toBeGreaterThan(1.02);
    expect(nightFactor(carlotta(sim))).toBeLessThanOrEqual(PROCESS.factor.most);
    // Memorization trained by the part at most three times: the rest is the lines alone.
    expect(p.trained).toBe(PROCESS.own.trainsAtMost);
    expect(breaches(sim.universe)).toEqual([]);
  }, 300_000);

  it('a blocking call missed is a gap, caught up from the book once, and an actor who doesn’t catch it up plays below 1', () => {
    let sim = castForSpring('pr-missed');
    const ours = calls(sim, 'school');
    tended(sim, ours[1]!.at - 2 * MS_HOUR);
    expect(sim.execute({ kind: 'school.review_blocking', payload: {} }).error).toBe('You haven’t missed any blocking.');
    // Away in New York for the second blocking call.
    sim.player.currentLocationId = 'us-ny-newyork';
    tended(sim, ours[1]!.at + 7 * MS_HOUR);
    sim.player.currentLocationId = 'us-ct-newhaven';
    expect(process(sim)!.blockingMissed).toBe(1);
    expect(ours[1]!.status).toBe('missed');
    sim = reload(sim);
    // Left alone, the gap stays, and the director's notes are on the blocking until it's caught up.
    const twin = reload(sim);
    tended(twin, ours.at(-1)!.at + 7 * MS_HOUR);
    const left = procOf(twin.player.school!.casting);
    expect(left!.blockingMissed).toBe(1);
    expect(left!.notes.some((n) => n.focus.kind === 'blocking' && !n.taken)).toBe(true);
    expect(nightFactor(twin.player.school!.casting)).toBeLessThan(1);
    // Caught up: once, in an hour, and then there's nothing to catch up.
    // The same evening, after the call missed.
    const before = sim.now;
    const blocking = process(sim)!.blocking;
    const done = sim.execute<{ blocking: number }>({ kind: 'school.review_blocking', payload: {} });
    expect(done.ok).toBe(true);
    expect(sim.now - before).toBe(PROCESS.own.minutes * 60_000);
    expect(done.value!.blocking).toBeGreaterThan(blocking);
    expect(process(sim)!.blockingMissed).toBe(0);
    expect(sim.execute({ kind: 'school.review_blocking', payload: {} }).error).toBe('You haven’t missed any blocking.');
    tended(sim, ours.at(-1)!.at + 7 * MS_HOUR);
    expect(nightFactor(carlotta(sim))).toBeGreaterThan(nightFactor(twin.player.school!.casting));
    expect(breaches(sim.universe)).toEqual([]);
  }, 300_000);

  it('the understudy rehearses the part it covers: lines and blocking at every call, and no director’s notes', () => {
    const sim = castForSpring('pr-understudy');
    const rep = calls(sim, 'rep');
    tended(sim, rep.at(-1)!.at + 4 * MS_HOUR);
    const casting = sim.player.school!.rep!;
    expect(hasProcess(casting)).toBe(true);
    const p = procOf(casting);
    expect(p).toMatchObject({ calls: 11, understudy: true, notes: [] });
    expect(p!.blocking).toBeCloseTo(1 - (1 - PROCESS.call.blocking) ** 11, 10);
    expect(nightFactor(casting)).toBeCloseTo(1, 10);
    // The part's own work is the Rep's, apart from the Carlotta's.
    const lines = p!.lines;
    expect(sim.execute({ kind: 'school.learn_part', payload: { which: 'rep' } }).ok).toBe(true);
    expect(p!.lines).toBeGreaterThan(lines);
    // The run over, there's nothing left to rehearse for: the part's work is refused, its history kept.
    tended(sim, at(2027, 3, 29, 21));
    expect(calls(sim, 'rep', 'oncall')).toHaveLength(0);
    expect(sim.execute({ kind: 'school.learn_part', payload: { which: 'rep' } }).error).toBe('The run is over.');
    expect(procOf(sim.player.school!.rep)!.calls).toBe(11);
    expect(breaches(sim.universe)).toEqual([]);
  }, 300_000);

  it('plays the nights on the process: the same save, better prepared, grows more from the same four nights', () => {
    const sim = castForSpring('pr-nights');
    const ours = calls(sim, 'school');
    tended(sim, ours.at(-1)!.at + 7 * MS_HOUR);
    const twin = reload(sim);
    const p = procOf(twin.player.school!.casting);
    Object.assign(p!, { lines: 1, blocking: 1 });
    for (const n of p!.notes) n.taken = true;
    expect(nightFactor(twin.player.school!.casting)).toBeGreaterThan(nightFactor(carlotta(sim)));
    const total = (x: Simulation) => Object.values(x.player.craft!).reduce((a, b) => a + b, 0);
    const before = total(sim);
    expect(total(twin)).toBe(before);
    const last = calls(sim, 'school', 'performance').at(-1)!.at + 4 * MS_HOUR;
    tended(sim, last);
    tended(twin, last);
    expect(carlotta(sim).performed).toBe(4);
    expect(twin.player.school!.casting!.performed).toBe(4);
    expect(total(twin) - before).toBeGreaterThan(total(sim) - before);
  }, 300_000);

  it('grows a call more where the note before it was worked on and taken', () => {
    const sim = castForSpring('pr-taken');
    const ours = calls(sim, 'school');
    const k = ours.findIndex((c) => c.payload.stage === 'work');
    tended(sim, ours[k]!.at + 6 * MS_HOUR + 30 * 60_000);
    const twin = reload(sim);
    expect(twin.execute({ kind: 'school.work_note', payload: {} }).ok).toBe(true);
    tended(sim, twin.now);
    const total = (x: Simulation) => Object.values(x.player.craft!).reduce((a, b) => a + b, 0);
    const before = total(sim);
    expect(total(twin)).toBe(before);
    tended(sim, ours[k + 1]!.at + 7 * MS_HOUR);
    tended(twin, ours[k + 1]!.at + 7 * MS_HOUR);
    const note = (x: Simulation) => procOf(x.player.school!.casting)?.notes[0];
    expect(note(twin)!.taken).toBe(true);
    expect(note(sim)!.taken).toBe(false);
    expect(total(twin) - before).toBeGreaterThan(total(sim) - before);
  }, 300_000);

  it('learns the part in a routine by the same command, saved only for a part there could be', () => {
    const sim = castForSpring('pr-routine');
    tended(sim, calls(sim, 'school')[0]!.at - 18 * MS_HOUR);
    expect(sim.execute({ kind: 'routine.save', payload: { name: 'Bad', steps: [{ kind: 'school.learn_part', payload: { which: 'opera' } }] } }).error).toBe('That isn’t a part you could be cast in.');
    sim.must({ kind: 'routine.save', payload: { name: 'Lines', steps: [{ kind: 'school.learn_part', payload: { which: 'school' } }] } });
    const routine = routinesOf(sim.player).at(-1)!;
    expect(stepLabel(sim.player, routine.steps[0]!)).toBe('Learn Your Part');
    for (const step of routine.steps) sim.must({ kind: step.kind, payload: step.payload });
    expect(process(sim)!.lines).toBeGreaterThan(0);
  });

  it('refuses the part’s work to an actor cast in nothing', () => {
    const sim = life('pr-uncast');
    sim.advanceTo(at(2026, 9, 2, 20));
    expect(sim.player.school!.casting).toBeUndefined();
    for (const kind of ['school.learn_part', 'school.review_blocking', 'school.work_note']) expect(sim.execute({ kind, payload: {} }).error).toBe('You aren’t cast in anything there.');
    expect(sim.execute({ kind: 'school.learn_part', payload: { which: 'rep' } }).error).toBe('You aren’t cast in anything there.');
  });
});
