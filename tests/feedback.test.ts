/**
 * Feedback grounded in what happened (from 2026-10-08): a note names what it
 * measured, the material and the part; the next note on the same thing says
 * it's the same again, or better but short; a part put right is taken and not
 * named again while it holds; and with nothing holding the work back, the note
 * is the next step. The learning objective weighs in the showing, so changing
 * it changes the outcome, not only the sentence.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { instantFromZoned } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';
import { PREP_DIMS, sceneById } from '@/engine/content/coursework';
import { courseworkOf, interpretationOf, judgeWork, notesOf, questionsFor, readingDiffers, setWork, show, weightsOf, type Assignment } from '@/engine/systems/coursework';
import { LEARNING } from '@/engine/systems/learning';

const zone = 'America/New_York';
const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
let n = 0;
/** A scene-study assignment, prepared: every part at `rest`, the lines at `lines`, every choice one the text supports. */
function prepared(sim: Simulation, lines: number, rest = 0.95): Assignment {
  n += 1;
  const cw = courseworkOf(sim, sim.player)!;
  for (const a of cw.assignments) if (a.status === 'open' || a.status === 'revising') a.status = 'done';
  const a = setWork(sim, sim.player, 'DRAM 103a/b', { year: 2026, month: 9, day: Math.min(28, n) })!;
  for (const d of PREP_DIMS) a.prep[d] = rest;
  a.prep.memorization = lines;
  for (const { q, options } of questionsFor(a)) a.answers[q.id] = options.find((o) => o.supported)!.id;
  return a;
}
const showAt = (sim: Simulation, a: Assignment, day: number) => show(sim, sim.player, a, `2026-10-${String(day).padStart(2, '0')}`, instantFromZoned({ year: 2026, month: 10, day, hour: 10 }, zone));

describe('a note on the same thing, over time', () => {
  it('is new, then the same again, then better but short, then taken, and not given while it holds', () => {
    const sim = life('fb-ledger');
    sim.player.craft = Object.fromEntries(Object.keys(sim.player.craft!).map((k) => [k, 60])) as never;
    const a1 = prepared(sim, 0.2);
    showAt(sim, a1, 1);
    expect(a1.feedback).toMatchObject({ kind: 'new', focus: { kind: 'dim', dim: 'memorization' } });
    // What it measured, and the material and part, in the words.
    const scene = sceneById(a1.sceneId!)!;
    expect(a1.feedback!.text).toContain('(Lines: 20%.)');
    expect(a1.feedback!.text).toContain(`As ${scene.roles[a1.role!].name} in ${scene.play}.`);
    const a2 = prepared(sim, 0.22);
    showAt(sim, a2, 8);
    expect(a2.feedback!.kind).toBe('recurring');
    expect(a2.feedback!.text).toMatch(/^The same note as on October 1, 2026, in Acting I/);
    const a3 = prepared(sim, 0.5);
    showAt(sim, a3, 15);
    expect(a3.feedback!.kind).toBe('partial');
    expect(a3.feedback!.text).toMatch(/^Better than on October 8, 2026 \(22% then, 50% now\), not there yet\./);
    // Put right: taken, said, and the note is about something else.
    const a4 = prepared(sim, 0.9);
    const s4 = showAt(sim, a4, 22);
    expect(a4.taken).toEqual(['dim:memorization']);
    expect(s4.strengths).toContain('The note on lines is taken');
    expect(a4.feedback!.focus).not.toEqual({ kind: 'dim', dim: 'memorization' });
    const rec = notesOf(courseworkOf(sim, sim.player)!).find((x) => x.key === 'dim:memorization')!;
    expect(rec).toMatchObject({ status: 'resolved', given: 3 });
    // Lines short again but above the slip line: not named again.
    const a5 = prepared(sim, LEARNING.slipped + 0.1);
    showAt(sim, a5, 29);
    expect(a5.feedback!.focus).not.toEqual({ kind: 'dim', dim: 'memorization' });
  });

  it('with nothing holding it back, gives the step beyond, and not the same one twice running', () => {
    const sim = life('fb-advanced');
    sim.player.craft = Object.fromEntries(Object.keys(sim.player.craft!).map((k) => [k, 70])) as never;
    const a1 = prepared(sim, 0.97, 0.97);
    showAt(sim, a1, 1);
    const a2 = prepared(sim, 0.97, 0.97);
    showAt(sim, a2, 8);
    expect(a1.feedback!.kind).toBe('advanced');
    expect(a2.feedback!.kind).toBe('advanced');
    expect(a1.feedback!.text).toMatch(/^It held together this time\. The next step: /);
    expect(a2.feedback!.focus).not.toEqual(a1.feedback!.focus);
  });
});

describe('the learning objective', () => {
  it('weighs its part more, so the same preparation shows differently under another objective', () => {
    const sim = life('fb-objective');
    const a = prepared(sim, 0.1);
    a.objective = 'lines';
    const lines = weightsOf(a);
    a.objective = 'circumstances';
    const world = weightsOf(a);
    expect(lines.memorization!).toBeGreaterThan(world.memorization!);
    expect(Object.values(lines).reduce((x, y) => x + y!, 0)).toBeCloseTo(1, 10);
    // The same work, lines weak: scored lower where the objective is the lines. Until 2026-10-12 this compared
    // `Showing.parts.prep`, a sum of these weights that nothing in the game read, and which went then; it compares the
    // judged result now, under the same key, which is what the band and the score read.
    const twin = { ...a, prep: { ...a.prep }, answers: { ...a.answers }, objective: 'lines' as const };
    const when = instantFromZoned({ year: 2026, month: 10, day: 1, hour: 10 }, zone);
    const under = judgeWork(sim, sim.player, a, '2026-10-01', when, 'fb-objective').overall;
    const over = judgeWork(sim, sim.player, twin, '2026-10-01', when, 'fb-objective').overall;
    expect(over).toBeLessThan(under);
  });
});

describe('a scene back for another reading', () => {
  it('reads the table work less where it’s last time’s, where the text allows another', () => {
    const sim = life('fb-reading');
    const a = prepared(sim, 0.9);
    const multi = questionsFor(a).find(({ options }) => options.filter((o) => o.supported).length > 1)!;
    expect(multi).toBeDefined();
    a.revisit = { assignmentId: 'before', on: '2026-09-01', role: a.role!, change: 'reading', answers: { ...a.answers } };
    expect(readingDiffers(a)).toBe(false);
    const same = interpretationOf(a);
    a.answers[multi.q.id] = multi.options.find((o) => o.supported && o.id !== a.answers[multi.q.id])!.id;
    expect(readingDiffers(a)).toBe(true);
    expect(interpretationOf(a)).toBeGreaterThan(same);
    expect(same).toBeCloseTo(interpretationOf(a) * LEARNING.sameReading, 10);
  });
});

describe('a weakness that keeps coming back', () => {
  it('is named as one from the third time, counted', () => {
    const sim = life('fb-count');
    sim.player.craft = Object.fromEntries(Object.keys(sim.player.craft!).map((k) => [k, 60])) as never;
    const days = [1, 8, 15, 22];
    const shown = days.map((d) => { const a = prepared(sim, 0.2); showAt(sim, a, d); return a; });
    expect(shown.map((a) => a.feedback!.kind)).toEqual(['new', 'recurring', 'recurring', 'recurring']);
    expect(shown[1]!.feedback!.text).not.toMatch(/ time it’s been given/);
    expect(shown[2]!.feedback!.text).toMatch(/^The same note as on October 8, 2026, in Acting I, the 3rd time it’s been given: it’s still there\./);
    expect(shown[3]!.feedback!.text).toMatch(/the 4th time it’s been given/);
  });
});
