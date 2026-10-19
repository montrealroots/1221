/**
 * The habits Your Work So Far names, held to the choices the Profile says they're named from (from 2026-10-12):
 * - every press of a choice counted every side then played, so Change The Reading, which sends the same way again,
 *   and a side kept while another axis changed (a brief's, a scene's, a part's) each counted it once more;
 * - a habit summed the choices and the showings, so one choice taped once counted two toward the five, and a way
 *   chosen once and taped a few times was named a habit.
 *
 * PLAYER JOURNEYS play through the commands on real saves; the scene's assignment is written onto the coursework by
 * hand, as tests/trace-commands.test.ts writes it, and says so.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { instantFromZoned } from '@/engine/core/time';
import { BRIEFS } from '@/engine/content/briefs';
import { PREP_DIMS } from '@/engine/content/coursework';
import { courseworkOf, mateRecord, type Assignment } from '@/engine/systems/coursework';
import { ARTISTRY, identityOf } from '@/engine/systems/artistry';

const config = { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' } as const;

/** A first-year with nothing pending that needs them, so the hour is theirs for a take. */
function student(seed: string): Simulation {
  const sim = createSave(1, seed, config);
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
  return sim;
}
const go = (sim: Simulation, kind: string, payload: Record<string, unknown>) => {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
  Object.assign(sim.player.wellbeing, { energy: 95, stress: 15, sleepDebt: 0, nourishment: 80, hygiene: 80, morale: 60 });
  const r = sim.execute<Record<string, unknown>>({ kind, payload });
  expect(r.ok, `${kind}: ${r.error}`).toBe(true);
  return r;
};
/** The record the habits are read from: each side's choices and showings. */
const ways = (sim: Simulation) => Object.fromEntries(Object.entries(sim.player.experience?.approaches ?? {}).map(([k, v]) => [k, { ...v }]));
const chosen = (sim: Simulation, side: string) => sim.player.experience?.approaches?.[side]?.chosen ?? 0;

describe('a brief’s choice', () => {
  it('counts a side once as it’s chosen, never again for Change The Reading, the same press, or another axis changed', () => {
    const sim = student('g8-15-brief');
    go(sim, 'brief.choose', { brief: 'brief-drama', reading: 'guarded', pace: 'measured' });
    expect(chosen(sim, 'measured')).toBe(1);
    // Change The Reading sends the way already chosen with the new reading: no side is newly chosen.
    go(sim, 'brief.choose', { brief: 'brief-drama', reading: 'listening', pace: 'measured' });
    go(sim, 'brief.choose', { brief: 'brief-drama', reading: 'listening', pace: 'measured' });
    expect(chosen(sim, 'measured')).toBe(1);
    // A scale added: the scale is a choice, the pace kept isn't.
    go(sim, 'brief.choose', { brief: 'brief-drama', reading: 'listening', pace: 'measured', scale: 'restrained' });
    expect(chosen(sim, 'measured')).toBe(1);
    expect(chosen(sim, 'restrained')).toBe(1);
    // A change of mind is a choice, and a change back another.
    go(sim, 'brief.choose', { brief: 'brief-drama', reading: 'listening', pace: 'driven', scale: 'restrained' });
    go(sim, 'brief.choose', { brief: 'brief-drama', reading: 'listening', pace: 'measured', scale: 'restrained' });
    expect([chosen(sim, 'measured'), chosen(sim, 'driven'), chosen(sim, 'restrained')]).toEqual([2, 1, 1]);
  });
});

describe('a habit', () => {
  it('isn’t named from one choice re-pressed and taped, and is from five choices, with what was shown as evidence', () => {
    const sim = student('g8-15-habit');
    go(sim, 'brief.choose', { brief: 'brief-drama', reading: 'guarded', pace: 'measured' });
    for (const reading of ['listening', 'guarded', 'listening']) go(sim, 'brief.choose', { brief: 'brief-drama', reading, pace: 'measured' });
    for (let i = 0; i < 4; i += 1) go(sim, 'practice.self_tape', { genre: 'drama', brief: 'brief-drama' });
    expect(ways(sim).measured).toEqual({ chosen: 1, shown: 4 });
    // One choice, four presses of it and four takes: no habit on the pace, which takes five choices.
    expect(identityOf(sim.player).habits.map((h) => h.label)).not.toContain('Measured Pace');
    expect(identityOf(sim.player).habit).toBeUndefined();

    // Four more briefs, each played Measured: five choices, every one of them Measured.
    const others = BRIEFS.filter((b) => b.id !== 'brief-drama').slice(0, ARTISTRY.habitAt - 1);
    for (const b of others) go(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id, pace: 'measured' });
    expect(chosen(sim, 'measured')).toBe(ARTISTRY.habitAt);
    const line = identityOf(sim.player).habits.find((h) => h.label === 'Measured Pace');
    expect(line?.line).toBe(`You tend to play it measured: ${ARTISTRY.habitAt} of your ${ARTISTRY.habitAt} choices of pace.`);
    expect(line?.evidence).toEqual([`Ways chosen: Measured ${ARTISTRY.habitAt}, Driven 0`, 'Shown in work: Measured 4, Driven 0']);
    expect(identityOf(sim.player).habit).toEqual({ axis: 'pace', side: 'measured' });
  });
});

describe('a scene’s choice', () => {
  /** TEST SETUP: an assignment written onto the coursework, as tests/trace-commands.test.ts writes it. */
  function scene(sim: Simulation): Assignment {
    const a: Assignment = {
      id: 't-scene-study', course: 'DRAM 403a/b', template: 'scene-study', term: 1, setOn: '2026-09-07', dueOn: '2026-12-01', sceneId: 'seagull-4', role: 0, partner: 0,
      prep: { ...Object.fromEntries(PREP_DIMS.map((d) => [d, 0])), familiarity: 0.6, memorization: 0.6 } as Assignment['prep'], answers: {}, steps: {}, practicedOn: {}, trained: 0, rehearsals: [], status: 'open',
    };
    courseworkOf(sim, sim.player)!.assignments.push(a);
    mateRecord(sim.player.school!.classmates[0]!).met = sim.now;
    return a;
  }

  it('counts the side newly chosen, not the one kept', () => {
    const sim = student('g8-15-scene');
    const a = scene(sim);
    go(sim, 'school.choose_playing', { assignmentId: a.id, pace: 'driven' });
    go(sim, 'school.choose_playing', { assignmentId: a.id, pace: 'driven', scale: 'expansive' });
    go(sim, 'school.choose_playing', { assignmentId: a.id, pace: 'driven', scale: 'expansive' });
    expect([chosen(sim, 'driven'), chosen(sim, 'expansive')]).toEqual([1, 1]);
  });
});

describe('a part’s choice', () => {
  it('counts the side newly chosen, not the one kept', () => {
    const sim = createSave(1, 'g8-15-part', config);
    // The first spring's casting, played to as tests/trace-commands.test.ts plays it.
    sim.advanceTo(instantFromZoned({ year: 2027, month: 1, day: 4, hour: 9 }, 'America/New_York') + 60_000);
    const was = ways(sim);
    const before = (side: string) => was[side]?.chosen ?? 0;
    // Through the command as it is, the calls left pending: the choice is made at once, and a run with none is over.
    const part = (payload: Record<string, unknown>) => { const r = sim.execute({ kind: 'school.choose_part_playing', payload }); expect(r.ok, r.error).toBe(true); };
    part({ pace: 'driven', scale: 'expansive' });
    part({ pace: 'driven', scale: 'restrained' });
    part({ pace: 'driven', scale: 'restrained' });
    expect([chosen(sim, 'driven') - before('driven'), chosen(sim, 'expansive') - before('expansive'), chosen(sim, 'restrained') - before('restrained')]).toEqual([1, 1, 1]);
  });
});
