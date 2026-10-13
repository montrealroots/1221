/**
 * The maximum-mastery contract, every combination the game has (from 2026-10-10): a night of every play with its
 * kinds' demands (`castingReads`), a showing of every coursework template with every scene's play's demands
 * (as `withDemands` added them, each once at a weight of one; it went on 2026-10-13, read by tests alone, and is made
 * here so the reads stay as they were: from 2026-10-10 `judgeWork` read a scene’s material in their place), each at every difficulty, comes out at 100 on every dimension when
 * everything is met. Then, for every task profile: preparation short on one part lowers exactly the dimensions that
 * read it; each condition lowers exactly the dimensions that name it (a concussion every one); and once it passes, the
 * maximum is back. These are calculation fixtures; `tests/mastery-integration.test.ts` takes the same contract through
 * a scheduled class.
 */
import { describe, expect, it } from 'vitest';
import { judge, type Condition, type Performer } from '@/engine/systems/evaluation';
import { castingReads } from '@/engine/systems/school';
import { EVALUATION, TASK_PROFILES, TEMPLATE_TASK, type Dimension } from '@/engine/content/tasks';
import { TEMPLATES, SCENES } from '@/engine/content/coursework';
import { REP_PLAYS, SHAKESPEARE_PLAYS, SUMMER_PLAYS, THESIS_PLAYS, genresOfPlay } from '@/engine/content/plays';
import { DEMAND_TECHNIQUE, genreTags } from '@/engine/content/demands';
import { familiesOf } from '@/engine/content/genres';
import { MASTERED } from '@/engine/content/abilities';

const withDemands = (r: Record<string, number>, genres: readonly string[]) => ({ ...Object.fromEntries(genres.flatMap(genreTags).map((t) => [DEMAND_TECHNIQUE[t], 1])), ...r });
const FULL: Performer = { ability: () => 100, full: () => 100, technique: () => MASTERED };
const WELL: Condition = { readiness: 90 };
const PLAYS = [...THESIS_PLAYS, ...SHAKESPEARE_PLAYS, ...REP_PLAYS, ...SUMMER_PLAYS];
const partsOf = (task: string) => [...new Set(Object.values(TASK_PROFILES[task]!.dims).flatMap((d) => d!.prep ?? []))];
const complete = (task: string) => Object.fromEntries(partsOf(task).map((p) => [p, 1]));
const required = (task: string) => Object.fromEntries(partsOf(task).map((p) => [p, (EVALUATION.complete as Record<string, number>)[p] ?? EVALUATION.complete.coursework]));
const dims = (e: ReturnType<typeof judge>) => Object.fromEntries(e.dimensions.map((d) => [d.dimension, d.quality])) as Record<Dimension, number>;

describe('the maximum, everywhere the game asks for work', () => {
  it('a night of every play, with its kinds’ demands, at every difficulty', () => {
    for (const p of PLAYS) {
      for (const difficulty of [-0.3, 0, 0.5, 1]) {
        const e = judge('seed', FULL, { task: TASK_PROFILES.performance!, techniques: castingReads({ play: p.title }), prep: complete('performance'), required: required('performance'), difficulty, condition: WELL, families: familiesOf(p.kinds ?? []), key: `night:${p.title}:${difficulty}` });
        expect(e.overall, p.title).toBe(100);
        expect(e.mastery, p.title).toBe(true);
        for (const [d, q] of Object.entries(dims(e))) expect(q, `${p.title} ${d}`).toBe(100);
      }
    }
  });

  it('a showing of every coursework template, with every scene’s play’s demands where it works on a scene', () => {
    let n = 0;
    for (const t of TEMPLATES) {
      const task = TEMPLATE_TASK[t.id] ?? 'scene';
      const scenes = t.material === 'none' ? [undefined] : SCENES.map((s) => s.play);
      for (const play of scenes) {
        const genres = genresOfPlay(play) ?? [];
        const e = judge('seed', FULL, { task: TASK_PROFILES[task]!, techniques: withDemands(t.reads, genres), prep: complete(task), required: required(task), difficulty: 0.5, condition: WELL, families: familiesOf(genres), key: `show:${t.id}:${play}` });
        expect(e.overall, `${t.id} ${play}`).toBe(100);
        expect(e.mastery, `${t.id} ${play}`).toBe(true);
        n += 1;
      }
    }
    expect(n).toBeGreaterThan(TEMPLATES.length);
  });
});

describe('what each input reaches, for every task profile', () => {
  const base = (task: string, over: Partial<{ prep: Record<string, number>; condition: Condition }> = {}) => judge('seed', FULL, { task: TASK_PROFILES[task]!, techniques: { scene: 1 }, prep: over.prep ?? complete(task), required: required(task), difficulty: 0, condition: over.condition ?? WELL, key: `reach:${task}` });

  it('preparation short on one part lowers exactly the dimensions that read it', () => {
    for (const task of Object.keys(TASK_PROFILES)) {
      for (const part of partsOf(task)) {
        const e = dims(base(task, { prep: { ...complete(task), [part]: 0.2 } }));
        for (const [d, spec] of Object.entries(TASK_PROFILES[task]!.dims)) {
          const reads = (spec!.prep ?? []).includes(part);
          if (reads) expect(e[d as Dimension], `${task} ${part} ${d}`).toBeLessThan(100);
          else expect(e[d as Dimension], `${task} ${part} ${d}`).toBe(100);
        }
      }
    }
  });

  it('a condition lowers exactly the dimensions that name it, once, and passed, the maximum is back', () => {
    const cases: [keyof Condition | 'fatigue', Condition, 'illness' | 'injury' | 'fatigue' | 'all'][] = [
      ['ill', { readiness: 90, ill: true }, 'illness'],
      ['injured', { readiness: 90, injured: true }, 'injury'],
      ['concussed', { readiness: 90, concussed: true }, 'all'],
      ['fatigue', { readiness: 30 }, 'fatigue'],
    ];
    for (const task of Object.keys(TASK_PROFILES)) {
      for (const [name, condition, reach] of cases) {
        const e = base(task, { condition });
        for (const d of e.dimensions) {
          const spec = TASK_PROFILES[task]!.dims[d.dimension]!;
          const named = reach === 'all' || (spec.conditions ?? []).includes(reach);
          if (named) expect(d.quality, `${task} ${name} ${d.dimension}`).toBeLessThan(100);
          else expect(d.quality, `${task} ${name} ${d.dimension}`).toBe(100);
          // Once: the factor is the single cause's, never compounded with itself.
          if (named && reach !== 'fatigue') expect(d.condition, `${task} ${name} ${d.dimension}`).toBeCloseTo(reach === 'illness' ? EVALUATION.illness : EVALUATION.injury, 9);
        }
        expect(base(task).overall, `${task} recovered from ${name}`).toBe(100);
      }
    }
  });
});
