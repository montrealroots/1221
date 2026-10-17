/**
 * Three commands no test drove by name until 2026-10-12, when `tools/trace.ts` traced the features the
 * connected-journey pass touched and found them: reading the guide's next chapter, choosing how to play a piece of
 * coursework, and choosing how to play a part. Each is driven through the public command surface here, with what it
 * changes, what it refuses, and what reads the change.
 * TEST SETUP: an assignment written onto the coursework, as tests/coursework-defects.test.ts does; the production is the
 * first spring's festival, played to its first call as tests/direction.test.ts plays it.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { CHAPTERS } from '@/engine/content/tutorial';
import { PLAYING } from '@/engine/content/approaches';
import { PREP_DIMS, templateById } from '@/engine/content/coursework';
import { courseworkOf, forecastWork, mateRecord, type Assignment } from '@/engine/systems/coursework';
import { CALL_KIND } from '@/engine/systems/school';
import { hasProcess } from '@/engine/systems/production';
import { isOpen } from '@/engine/world/tutorial';

const config = { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' } as const;

function work(sim: Simulation, template: string, prep: Partial<Record<string, number>>, sceneId: string): Assignment {
  const a: Assignment = {
    id: `t-${template}`, course: 'DRAM 403a/b', template, term: 1, setOn: '2026-09-07', dueOn: '2026-12-01', sceneId, role: 0, partner: 0,
    prep: { ...Object.fromEntries(PREP_DIMS.map((d) => [d, 0])), ...prep } as Assignment['prep'], answers: {}, steps: {}, practicedOn: {}, trained: 0, rehearsals: [], status: 'open',
  };
  courseworkOf(sim, sim.player)!.assignments.push(a);
  mateRecord(sim.player.school!.classmates[0]!).met = sim.now;
  return a;
}

describe('tutorial.read', () => {
  it('reads the next chapter only, in order, opening what it names; once every chapter is read, the guide is finished', () => {
    const sim = createSave(1, 'trace-tutorial', { ...config, tutorial: true });
    const [first, second] = CHAPTERS;
    const locked = second!.opens.find((f) => !first!.opens.includes(f))!;
    expect(isOpen(sim, locked)).toBe(false);
    expect(sim.execute({ kind: 'tutorial.read', payload: { chapterId: second!.id } }).error).toMatch(/first\. The chapters open in order\./);
    const r = sim.execute<{ read: string; next?: string }>({ kind: 'tutorial.read', payload: { chapterId: first!.id } });
    expect(r.ok, r.error).toBe(true);
    expect(r.value!.next).toBe(second!.id);
    expect(sim.execute({ kind: 'tutorial.read', payload: { chapterId: first!.id } }).error).toMatch(/already read/);
    sim.execute({ kind: 'tutorial.read', payload: { chapterId: second!.id } });
    expect(isOpen(sim, locked)).toBe(true);
    for (const c of CHAPTERS.slice(2)) expect(sim.execute({ kind: 'tutorial.read', payload: { chapterId: c.id } }).ok).toBe(true);
    expect(sim.universe.tutorial!.finished).toBe(true);
  });
});

describe('school.choose_playing', () => {
  it('chooses a way to play a scene; work on its feet rehearses it in; a change keeps part of it; the showing’s forecast reads it', () => {
    const sim = createSave(1, 'trace-playing', config);
    const a = work(sim, 'scene-study', { familiarity: 0.6, memorization: 0.6 }, 'seagull-4');
    for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
    const r = sim.execute<{ prep: number; kept: boolean }>({ kind: 'school.choose_playing', payload: { assignmentId: a.id, pace: 'driven' } });
    expect(r.ok, r.error).toBe(true);
    expect(a.playing?.pace).toBe('driven');
    expect(a.playing!.prep).toBe(0);
    const rehearse = templateById('scene-study')!.activities.find((x) => x.dim === 'rehearsal')!.id;
    expect(sim.execute({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: rehearse } }).ok).toBe(true);
    const worked = a.playing!.prep;
    expect(worked).toBeGreaterThan(0);
    // The showing reads it (from 2026-10-12, after the capability review found this test's title said so and nothing
    // checked it): the forecast the showing is judged by, with the way chosen against with none, moves.
    // Read below the tenth the whole is shown to: from 2026-10-16, the scene weighed as it demands (`BASE_INPUTS`), the
    // two wholes round alike (24.9 and 24.9), where until then they were a tenth or more apart. The way is read all the
    // same: Driven leans responsiveness, and its rehearsal is a part of the preparation the forecast reads.
    const forecastOf = () => forecastWork(sim, sim.player, a, a.dueOn);
    const withWay = forecastOf();
    const playing = a.playing;
    delete a.playing;
    const without = forecastOf();
    a.playing = playing;
    expect(withWay.inputs.lean!.responsiveness!).toBeGreaterThan(without.inputs.lean!.responsiveness!);
    expect(withWay.inputs.prep.approach).toBe(worked);
    expect(without.inputs.prep.approach).toBeUndefined();
    const again = sim.execute<{ prep: number; kept: boolean }>({ kind: 'school.choose_playing', payload: { assignmentId: a.id, pace: 'measured' } });
    expect(again.value!.kept).toBe(false);
    expect(a.playing!.prep).toBeCloseTo(worked * PLAYING.keptOnChange, 9);
    // Shown, the work refuses a new choice.
    a.status = 'shown' as Assignment['status'];
    expect(sim.execute({ kind: 'school.choose_playing', payload: { assignmentId: a.id, pace: 'driven' } }).error).toMatch(/shown/);
  });
});

describe('school.choose_part_playing', () => {
  it('chooses a way to play a part once cast, refused when not; the calls rehearse it in', () => {
    const sim = createSave(1, 'trace-part-playing', config);
    expect(sim.execute({ kind: 'school.choose_part_playing', payload: { pace: 'driven' } }).error).toMatch(/aren’t cast/);
    const zone = 'America/New_York';
    sim.advanceTo(instantFromZoned({ year: 2027, month: 1, day: 4, hour: 9 }, zone) + 60_000);
    const calls = sim.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.payload.which !== 'rep' && i.payload.call === 'rehearsal').sort((x, y) => x.at - y.at);
    expect(calls.length).toBeGreaterThan(2);
    const r = sim.execute<{ prep: number }>({ kind: 'school.choose_part_playing', payload: { pace: 'driven', scale: 'expansive' } });
    expect(r.ok, r.error).toBe(true);
    const proc = () => { const c = sim.player.school!.casting!; return hasProcess(c) ? c.process : undefined; };
    expect(proc()!.playing?.pace).toBe('driven');
    expect(proc()!.playing?.scale).toBe('expansive');
    const before = proc()!.playing!.prep;
    // Two calls past the read-through: work on the feet rehearses the choice in.
    for (const c of calls.slice(0, 3)) {
      while (sim.now < c.at + 6 * MS_HOUR) { Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 }); sim.advanceTo(Math.min(c.at + 6 * MS_HOUR, sim.now + 6 * MS_HOUR)); }
    }
    expect(proc()!.playing!.prep).toBeGreaterThan(before);
  });
});
