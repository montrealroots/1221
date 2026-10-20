/**
 * Five coursework defects found by the triage of 2026-10-12, each fixed and held here (from 2026-10-12;
 * `systems/coursework.ts`, `systems/workpieces.ts`, `systems/workbook.ts`):
 * - Table Work's Write It Up asked for the table work's hidden figure, which nothing in Table Work moves, so it was
 *   refused however the questions were answered;
 * - Learn Lines was checked for its template's 60 minutes of free time, and took the scene's 45, 75 or 105;
 * - Name What You Want, on a scene whose table work is the answers alone, moved a figure the forecast never read;
 * - Run It With Your Partner, on a scene for class, spent its 45 minutes and changed nothing;
 * - a Targeted Drill, or Work On It With Your Partner, on the table work of such a scene moved that same unread figure.
 *
 * PLAYER JOURNEYS play through the commands (`school.prepare`, `school.choose`, `school.approach`, `work.identify`,
 * `work.try`). TEST SETUP: assignments written onto the coursework, as tests/coursework-defects.test.ts does, so the
 * scene and its size are the ones the rule is about; the clock's own commitments cleared and the day kept rested, as
 * tests/workbook.test.ts does, and a commitment scheduled where the free time is what's measured.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { PREP_DIMS, SCENE_SIZE_MINUTES, sceneById } from '@/engine/content/coursework';
import { courseworkOf, forecastWork, interpretationOf, mateRecord, notesOf, partnerPrepOf, prepareRefusal, questionsFor, type Assignment } from '@/engine/systems/coursework';
import { LEARNING, recordNote } from '@/engine/systems/learning';
import { optionsOf, problemsOf, type Try } from '@/engine/systems/workbook';
import { workPiece } from '@/engine/systems/workpieces';

const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const rest = (sim: Simulation) => {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
  Object.assign(sim.player.wellbeing, { energy: 95, stress: 15, sleepDebt: 0, nourishment: 80, hygiene: 80, morale: 60 });
};
const go = <T = Record<string, unknown>>(sim: Simulation, kind: string, payload: Record<string, unknown>) => { rest(sim); return sim.execute<T>({ kind, payload }); };
const today = (sim: Simulation) => new Intl.DateTimeFormat('en-CA', { timeZone: sim.homeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(sim.now));

/** TEST SETUP: a piece of work on a scene, its preparation as given, partnered with the first classmate where it's paired. */
function work(sim: Simulation, template: string, course: string, sceneId: string, prep: Partial<Record<string, number>> = {}, partnered = true): Assignment {
  const cw = courseworkOf(sim, sim.player)!;
  const a: Assignment = {
    id: `g89-${template}-${cw.assignments.length}`, course, template, term: 1, setOn: today(sim), dueOn: '2026-12-01', sceneId, role: 0,
    ...(partnered ? { partner: 0 } : {}),
    prep: { ...Object.fromEntries(PREP_DIMS.map((d) => [d, 0])), ...prep } as Assignment['prep'], answers: {}, steps: {}, practicedOn: {}, trained: 0, rehearsals: [], status: 'open',
  };
  cw.assignments.push(a);
  if (partnered) mateRecord(sim.player.school!.classmates[0]!).met = sim.now;
  return a;
}

/** Every question answered through `school.choose`, with a reading the text supports or with one it cuts against. */
function answer(sim: Simulation, a: Assignment, supported: boolean): void {
  for (const { q, options } of questionsFor(a)) {
    const o = options.find((x) => x.supported === supported) ?? options[0]!;
    expect(go(sim, 'school.choose', { assignmentId: a.id, question: q.id, option: o.id }).ok).toBe(true);
  }
}

/** The table work named often enough to keep coming back: a note on a reading, which counts as one on the table work. */
function persistentReading(sim: Simulation, a: Assignment): void {
  const notes = notesOf(courseworkOf(sim, sim.player)!);
  const q = questionsFor(a)[0]!.q.id;
  for (let i = 0; i < LEARNING.persistent; i += 1) recordNote(notes, { kind: 'choice', question: q }, `2026-09-0${i + 1}`, `x${i}`, 'Acting I');
}

describe('Table Work’s Write It Up', () => {
  it('opens once the questions are answered with readings the text supports, and not before', () => {
    const sim = life('g89-table');
    const a = work(sim, 'table-work', 'DRAM 163b', 'cherry-orchard-4', { familiarity: 0.9 }, false);
    // Two sentences from 2026-10-20 (brief 17): after the step's name and its colon, one more colon read as a list.
    const why = 'Answer the questions first. There’s nothing to write up yet.';
    expect(go(sim, 'school.prepare', { assignmentId: a.id, activity: 'write' }).error).toBe(why);
    // Answered against the text, the analysis the showing reads is still short: still refused.
    answer(sim, a, false);
    expect(interpretationOf(a)).toBeLessThan(0.4);
    expect(go(sim, 'school.prepare', { assignmentId: a.id, activity: 'write' }).error).toBe(why);
    // Answered with what the text supports: the showing reads it whole, and the hidden figure hasn't moved.
    answer(sim, a, true);
    expect(interpretationOf(a)).toBe(1);
    expect(a.prep.interpretation).toBe(0);
    const t0 = sim.now;
    const wrote = go<{ dim: string; minutes: number }>(sim, 'school.prepare', { assignmentId: a.id, activity: 'write' });
    expect(wrote.error).toBeUndefined();
    expect(wrote.value!.dim).toBe('revision');
    expect(sim.now - t0).toBe(60 * 60_000);
    expect(a.prep.revision).toBeGreaterThan(0);
  });
});

describe('Learn Lines’ free time', () => {
  /** A commitment `minutes` from now, as a call would be. */
  const commitment = (sim: Simulation, minutes: number) => sim.schedule({ at: sim.now + minutes * 60_000, kind: 'school.call', label: 'A Test Call', category: 'school', priority: 32, requiresPlayer: true, durationMinutes: 60, payload: { personId: sim.player.id, call: 'performance' } });

  it('is checked for the scene’s own length: a long scene’s refused with 80 minutes free, a short one’s done with 50', () => {
    expect(sceneById('seagull-4')!.size).toBe('long');
    expect(sceneById('cherry-orchard-4')!.size).toBe('short');
    const sim = life('g89-lines');
    const long = work(sim, 'scene-study', 'DRAM 103a/b', 'seagull-4', { familiarity: 0.6 });
    rest(sim);
    commitment(sim, 80);
    expect(prepareRefusal(sim, sim.player, long, 'learn')).toMatch(/A Test Call starts at .*: there isn’t the time before it\./);
    const t0 = sim.now;
    expect(sim.execute({ kind: 'school.prepare', payload: { assignmentId: long.id, activity: 'learn' } }).error).toMatch(/A Test Call starts at/);
    expect(sim.now).toBe(t0);
    expect(long.prep.memorization).toBe(0);

    const sim2 = life('g89-lines-short');
    const short = work(sim2, 'scene-study', 'DRAM 103a/b', 'cherry-orchard-4', { familiarity: 0.6 });
    rest(sim2);
    commitment(sim2, 50);
    const t1 = sim2.now;
    const learned = sim2.execute<{ minutes: number }>({ kind: 'school.prepare', payload: { assignmentId: short.id, activity: 'learn' } });
    expect(learned.error).toBeUndefined();
    expect(learned.value!.minutes).toBe(SCENE_SIZE_MINUTES.short);
    expect(sim2.now - t1).toBe(SCENE_SIZE_MINUTES.short * 60_000);
    expect(short.prep.memorization).toBeGreaterThan(0);
  });
});

describe('Name What You Want, by what the forecast reads', () => {
  it('isn’t offered on Scene Study, whose table work is the answers alone', () => {
    const sim = life('g89-objective-scene');
    const a = work(sim, 'scene-study', 'DRAM 103a/b', 'cherry-orchard-4', { familiarity: 0.9, memorization: 0.6, rehearsal: 0.3, partner: 0.2 });
    answer(sim, a, true);
    rest(sim);
    const piece = workPiece(sim, sim.player, `assignment:${a.id}`)!;
    expect(piece.objective).toBeUndefined();
    const problems = problemsOf(piece);
    expect(problems.length).toBeGreaterThan(0);
    for (const p of problems) expect(optionsOf(piece, p).map((o) => o.adjustment)).not.toContain('objective');
    // Answered against the text, the table work is a problem of its own preparation, which the answers answer.
    const b = work(sim, 'scene-study', 'DRAM 103a/b', 'cherry-orchard-4', { familiarity: 0.9, memorization: 0.9, rehearsal: 0.9, partner: 0.9 });
    answer(sim, b, false);
    rest(sim);
    const ps = problemsOf(workPiece(sim, sim.player, `assignment:${b.id}`)!);
    expect(ps.some((p) => p.id === 'objective')).toBe(false);
    expect(ps.some((p) => p.id === 'prep:interpretation')).toBe(true);
  });

  it('stays on the Heightened Text Scene, named for its step at the table, and moves the forecast', () => {
    const sim = life('g89-objective-verse');
    const a = work(sim, 'classical-scene', 'DRAM 203a/b', 'macbeth-1-7', { familiarity: 0.9, memorization: 0.9, rehearsal: 0.9, partner: 0.9, revision: 0.9 });
    answer(sim, a, true);
    rest(sim);
    const k = `assignment:${a.id}`;
    const piece = workPiece(sim, sim.player, k)!;
    expect(piece.objective?.label).toBe('Scan The Verse');
    const obj = problemsOf(piece).find((p) => p.id === 'objective')!;
    expect(obj).toBeDefined();
    expect(obj.why).toMatch(/^Scan The Verse is at 0%/);
    expect(optionsOf(piece, obj).map((o) => o.adjustment)).toContain('objective');
    expect(go(sim, 'work.identify', { piece: k, problem: 'objective' }).ok).toBe(true);
    const t = go<Try>(sim, 'work.try', { piece: k, adjustment: 'objective' });
    expect(t.error).toBeUndefined();
    expect(a.prep.interpretation).toBeGreaterThan(0);
    expect(t.value!.after).toBeGreaterThan(t.value!.before);
  });
});

describe('Run It With Your Partner, on a scene for class', () => {
  it('isn’t offered: the partner’s figure is their own preparation, and the problem points to asking them', () => {
    const sim = life('g89-partner');
    // TEST SETUP: a strong actor, so the scene together falls short of your own work by the partner's side; half the
    // rehearsals together done, where the old figure (your rehearsals together) offered running it with them.
    sim.player.craft = Object.fromEntries(Object.keys(sim.player.craft!).map((k) => [k, 95])) as never;
    sim.player.attrs = { presence: 95, composure: 95, listening: 95, imagination: 95, focus: 95, adaptability: 95, discipline: 95 } as never;
    const a = work(sim, 'scene-study', 'DRAM 103a/b', 'cherry-orchard-4', { familiarity: 1, memorization: 1, rehearsal: 1, revision: 1, partner: 0.5 });
    answer(sim, a, true);
    rest(sim);
    const k = `assignment:${a.id}`;
    const piece = workPiece(sim, sim.player, k)!;
    expect(piece.partner).toBeDefined();
    expect(piece.partner!.set).toBeUndefined();
    expect(piece.partner!.get()).toBeCloseTo(partnerPrepOf(sim.player, a, today(sim)), 10);
    const p = problemsOf(piece).find((x) => x.kind === 'partner')!;
    expect(p).toBeDefined();
    const first = sim.player.school!.classmates[0]!.name.split(' ')[0]!;
    expect(p.why).toContain(`${first}’s preparation is at ${Math.round(partnerPrepOf(sim.player, a, today(sim)) * 100)}%. Ask ${first} to rehearse it with you.`);
    expect(optionsOf(piece, p).map((o) => o.adjustment)).not.toContain('with-partner');
    expect(go(sim, 'work.identify', { piece: k, problem: p.id }).ok).toBe(true);
    const t0 = sim.now;
    expect(go(sim, 'work.try', { piece: k, adjustment: 'with-partner' }).error).toBe('That doesn’t answer the problem you’re working on.');
    expect(sim.now).toBe(t0);
  });
});

describe('another way at the table work, where it is the answers alone', () => {
  it('refuses a targeted drill and work with the partner on Scene Study, and keeps putting it first and a smaller piece', () => {
    const sim = life('g89-approach');
    const a = work(sim, 'scene-study', 'DRAM 103a/b', 'cherry-orchard-4', { familiarity: 0.9 });
    answer(sim, a, true);
    persistentReading(sim, a);
    const why = 'On this piece, Table Work is your answers to its questions, so a drill or your partner can’t change it. Change an answer under Table Work instead.';
    expect(go(sim, 'school.approach', { assignmentId: a.id, kind: 'drill' }).error).toBe(why);
    expect(go(sim, 'school.approach', { assignmentId: a.id, kind: 'partner' }).error).toBe(why);
    expect(a.approach).toBeUndefined();
    const before = forecastWork(sim, sim.player, a, today(sim)).overall;
    expect(go(sim, 'school.approach', { assignmentId: a.id, kind: 'objective' }).ok).toBe(true);
    expect(a.approach!.dim).toBe('interpretation');
    expect(forecastWork(sim, sim.player, a, today(sim)).overall).not.toBe(before);
  });

  it('keeps a targeted drill on the Heightened Text Scene, whose step at the table the showing reads', () => {
    const sim = life('g89-approach-verse');
    const a = work(sim, 'classical-scene', 'DRAM 203a/b', 'macbeth-1-7', { familiarity: 0.9 });
    persistentReading(sim, a);
    expect(go(sim, 'school.approach', { assignmentId: a.id, kind: 'drill' }).ok).toBe(true);
    const i0 = interpretationOf(a);
    expect(go(sim, 'school.prepare', { assignmentId: a.id, activity: 'drill' }).ok).toBe(true);
    expect(interpretationOf(a)).toBeGreaterThan(i0);
  });
});
