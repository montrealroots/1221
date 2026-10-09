/**
 * The evaluation (`systems/evaluation.ts`): the one pathway every piece of
 * finished work is judged by, and what it promises. The maximum-mastery
 * guarantee on every task profile; quality never falling as an input rises;
 * inputs a task doesn't read changing nothing; the variation bounded and
 * nothing at full capacity; a cause named for every impairment; genre tags
 * normalized; and a result reproducible from what it keeps.
 */

import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { evaluate, leanedWeights, recordWork, chiefLimit, draw, type EvalContext } from '@/engine/systems/evaluation';
import { abilityFull } from '@/engine/systems/attributes';
import { TASK_PROFILES, TEMPLATE_TASK, EVALUATION, type Dimension } from '@/engine/content/tasks';
import { ABILITY_DEFS, MASTERED, TECHNIQUES, type AbilityId } from '@/engine/content/abilities';
import { evenCraft } from '@/engine/systems/school';
import { templateById } from '@/engine/content/coursework';
import { rngFor } from '@/engine/core/rng';

const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });

/** Every ability at a level, stamina at the share of its age's ceiling, every technique at a level. */
function at(sim: Simulation, ability: number, technique = ability) {
  const p = sim.player;
  p.craft = evenCraft(technique);
  for (const k of ['emotion', 'memorization', 'voice', 'movement'] as const) p.craft[k] = ability;
  p.attrs = { presence: ability, composure: ability, listening: ability, imagination: ability, focus: ability, adaptability: ability, discipline: ability };
  p.wellbeing.fitness = (ability / 100) * abilityFull(sim, p, 'stamina');
}

/** A task's every part of preparation, all at one share of complete. */
function prepFor(task: keyof typeof TASK_PROFILES, share: number) {
  const parts = new Set(Object.values(TASK_PROFILES[task]!.dims).flatMap((d) => d!.prep ?? []));
  return { prep: Object.fromEntries([...parts].map((k) => [k, share * 0.9])), required: Object.fromEntries([...parts].map((k) => [k, 0.9])) };
}

const ctx = (task: keyof typeof TASK_PROFILES, over: Partial<EvalContext> = {}): EvalContext => ({
  task: TASK_PROFILES[task]!, techniques: { scene: 2, character: 1 }, ...prepFor(task, 1), difficulty: 0.3,
  condition: { readiness: 85 }, key: `t:${task}`, ...over,
});

describe('the maximum-mastery guarantee', () => {
  it('gives 100 on every dimension and the whole, on every task profile, at every difficulty and draw, when everything is met', () => {
    const sim = life('eval-max');
    at(sim, 100, MASTERED);
    for (const task of Object.keys(TASK_PROFILES) as (keyof typeof TASK_PROFILES)[]) {
      for (const difficulty of [0, 0.45, 1]) for (let k = 0; k < 8; k += 1) {
        const e = evaluate(sim, sim.player, ctx(task, { difficulty, key: `max:${task}:${difficulty}:${k}`, condition: { readiness: EVALUATION.sufficientReadiness } }));
        expect(e.overall, `${task} ${difficulty} ${k}`).toBe(100);
        for (const d of e.dimensions) { expect(d.quality).toBe(100); expect(d.variation).toBe(0); }
        expect(e.mastery).toBe(true);
        expect(e.limits).toHaveLength(0);
      }
    }
  });

  it('holds for every coursework template’s own techniques: what the work reads, at mastery, is enough', () => {
    const sim = life('eval-max-templates');
    at(sim, 100, MASTERED);
    for (const [template, task] of Object.entries(TEMPLATE_TASK)) {
      const t = templateById(template);
      if (!t) continue;
      const e = evaluate(sim, sim.player, ctx(task, { techniques: t.reads, key: `tpl:${template}` }));
      expect(e.overall, template).toBe(100);
    }
  });

  it('counts stamina full at the most a body that age can be brought to: never an impossible 100', () => {
    const sim = life('eval-stamina');
    at(sim, 100, MASTERED);
    expect(abilityFull(sim, sim.player, 'stamina')).toBeLessThan(100);
    expect(sim.player.wellbeing.fitness).toBe(abilityFull(sim, sim.player, 'stamina'));
    expect(evaluate(sim, sim.player, ctx('performance')).overall).toBe(100);
  });

  it('says what stands between a result and the maximum: each limit named, with its cost in points', () => {
    const sim = life('eval-limits');
    at(sim, 100, MASTERED);
    sim.player.attrs!.presence = 60;
    const e = evaluate(sim, sim.player, ctx('performance', { ...prepFor('performance', 0.5), condition: { readiness: 30, injured: true } }));
    expect(e.mastery).toBe(false);
    const kinds = new Set(e.limits.map((l) => `${l.kind}:${l.what}`));
    expect(kinds.has('ability:presence')).toBe(true);
    expect(kinds.has('preparation:lines')).toBe(true);
    expect(kinds.has('condition:fatigue')).toBe(true);
    expect(kinds.has('condition:injury')).toBe(true);
    // An injury reaches only the dimensions that name it: the body's, not the interpretation.
    expect(e.limits.filter((l) => l.what === 'injury').map((l) => l.dimension)).toEqual(['execution']);
    // Each limit's cost is real: made whole, the dimension rises by it.
    for (const l of e.limits) expect(l.by).toBeGreaterThan(0);
    expect(chiefLimit(e)).toContain(String(e.limits[0]!.by));
  });
});

describe('quality and its inputs', () => {
  const rng = rngFor('eval-monotone', 'x');
  it('never falls as an input it reads rises, holding the rest, across random work', () => {
    const sim = life('eval-mono');
    for (let n = 0; n < 120; n += 1) {
      const task = (Object.keys(TASK_PROFILES) as (keyof typeof TASK_PROFILES)[])[n % Object.keys(TASK_PROFILES).length]!;
      at(sim, 10 + rng.next() * 85, 10 + rng.next() * 85);
      const share = rng.next();
      const base = ctx(task, { ...prepFor(task, share), difficulty: rng.next(), condition: { readiness: rng.next() * 100, ill: rng.next() < 0.3, injured: rng.next() < 0.3 }, key: `mono:${n}` });
      const before = evaluate(sim, sim.player, base);
      // Raise one input of each kind in turn.
      const ability = ABILITY_DEFS[n % ABILITY_DEFS.length]!.id;
      const raise: (() => EvalContext)[] = [
        () => { bump(sim, ability); return base; },
        () => { sim.player.craft!.scene += 5; return base; },
        () => ({ ...base, ...prepFor(task, Math.min(1, share + 0.2)) }),
        () => ({ ...base, condition: { ...base.condition, readiness: base.condition.readiness + 15 } }),
      ];
      for (const r of raise) {
        const was = evaluate(sim, sim.player, base);
        const after = evaluate(sim, sim.player, r());
        for (const d of after.dimensions) expect(d.quality + 1e-9).toBeGreaterThanOrEqual(was.dimensions.find((x) => x.dimension === d.dimension)!.quality);
        expect(after.overall + 1e-9).toBeGreaterThanOrEqual(was.overall);
      }
      expect(before.overall).toBeGreaterThanOrEqual(0);
    }
  });

  it('rises step by step through the whole curve, not only at the top', () => {
    const sim = life('eval-curve');
    for (const task of Object.keys(TASK_PROFILES) as (keyof typeof TASK_PROFILES)[]) {
      const curve = [20, 35, 50, 65, 80, 95, 100].map((level) => { at(sim, level, (level / 100) * MASTERED); return evaluate(sim, sim.player, ctx(task)).overall; });
      for (let i = 1; i < curve.length; i += 1) expect(curve[i]!, `${task} ${curve.join(',')}`).toBeGreaterThan(curve[i - 1]!);
      expect(curve.at(-1)).toBe(100);
      // A beginner isn't near the top, and the middle is between.
      expect(curve[0]!).toBeLessThan(40);
      expect(curve[3]!).toBeGreaterThan(45);
      expect(curve[3]!).toBeLessThan(80);
    }
  });

  it('is moved by nothing a task doesn’t read: a written analysis ignores the body and the voice, a movement score the text', () => {
    const sim = life('eval-irrelevant');
    at(sim, 60);
    const read = (task: keyof typeof TASK_PROFILES) => new Set(Object.values(TASK_PROFILES[task]!.dims).flatMap((d) => d!.inputs.flatMap((i) => ('ability' in i ? [i.ability] : []))));
    for (const task of Object.keys(TASK_PROFILES) as (keyof typeof TASK_PROFILES)[]) {
      const used = read(task);
      const before = evaluate(sim, sim.player, ctx(task)).overall;
      for (const d of ABILITY_DEFS) {
        if (used.has(d.id)) continue;
        const was = sim.player.attrs![d.id as 'listening'] ?? undefined;
        bump(sim, d.id, 40);
        expect(evaluate(sim, sim.player, ctx(task)).overall, `${task} ${d.id}`).toBe(before);
        if (was !== undefined) sim.player.attrs![d.id as 'listening'] = was;
        at(sim, 60);
      }
    }
    expect(read('written').has('physical')).toBe(false);
    expect(read('movement').has('imagination')).toBe(true);
  });

  it('lets one strength not erase an unrelated weakness: the whole leans on the weakest dimension', () => {
    const sim = life('eval-weakest');
    at(sim, 100, MASTERED);
    sim.player.attrs!.presence = 0;
    const e = evaluate(sim, sim.player, ctx('performance'));
    const w = leanedWeights(TASK_PROFILES.performance!);
    const total = Object.values(w).reduce((a, b) => a + (b ?? 0), 0);
    const weighted = e.dimensions.reduce((s, d) => s + d.quality * (w[d.dimension] ?? 0), 0) / total;
    const weakest = Math.min(...e.dimensions.map((d) => d.quality));
    expect(e.overall).toBeLessThan(weighted - 5);
    expect(e.overall).toBeCloseTo(EVALUATION.meanShare * weighted + (1 - EVALUATION.meanShare) * weakest, 0);
  });

  it('counts voice and movement once: as the abilities, never again as techniques when a play’s reads name them', () => {
    const sim = life('eval-once');
    at(sim, 60);
    const e = evaluate(sim, sim.player, ctx('scene', { techniques: { scene: 2, voice: 1, movement: 1, emotion: 1, memorization: 1 } }));
    expect(Object.keys(e.inputs.techniques)).toEqual(['scene']);
    for (const t of Object.keys(e.inputs.techniques)) expect(TECHNIQUES).toContain(t);
  });
});

describe('the bounded variation', () => {
  it('stays within its bound, narrows with mastery and is nothing at full capacity', () => {
    const sim = life('eval-var');
    for (const level of [20, 50, 80, 100]) {
      at(sim, level, (level / 100) * MASTERED);
      for (let k = 0; k < 40; k += 1) {
        const e = evaluate(sim, sim.player, ctx('scene', { key: `v:${level}:${k}` }));
        for (const d of e.dimensions) {
          const shaped = d.capacity ** (1 + 0.3);
          expect(Math.abs(d.variation)).toBeLessThanOrEqual(EVALUATION.variation * (1 - shaped) + 1e-9);
          if (level === 100) expect(d.variation).toBe(0);
        }
      }
    }
    // The draw is the save's and the key's: the same work again draws the same.
    expect(draw('a')).toBe(draw('a'));
    expect(draw('a')).not.toBe(draw('b'));
  });
});

describe('genres and the record', () => {
  it('leans the weights by a work’s families, the mean of them, and never adds to the whole', () => {
    const task = TASK_PROFILES.performance!;
    const total = (w: Partial<Record<Dimension, number>>) => Object.values(w).reduce((a, b) => a + (b ?? 0), 0);
    const plain = leanedWeights(task);
    const comedy = leanedWeights(task, ['comedy']);
    expect(total(comedy)).toBeCloseTo(total(plain), 9);
    expect(comedy.responsiveness! / total(comedy)).toBeGreaterThan(plain.responsiveness! / total(plain));
    // A tag twice is the tag once.
    expect(leanedWeights(task, ['comedy', 'comedy'])).toEqual(comedy);
    expect(total(leanedWeights(task, ['comedy', 'tragedy', 'musical']))).toBeCloseTo(total(plain), 9);
  });

  it('keeps a result with the ruleset and inputs that work it out again, once for its key', () => {
    const sim = life('eval-record');
    at(sim, 70);
    const c = ctx('audition', { techniques: { audition: 2, coldReading: 1, scene: 1 } });
    const e = evaluate(sim, sim.player, c);
    const again = evaluate(sim, sim.player, { ...c, task: TASK_PROFILES[e.task]!, techniques: e.inputs.techniques, prep: e.inputs.prep, required: e.inputs.required, difficulty: e.inputs.difficulty, condition: e.inputs.condition, key: e.inputs.key });
    expect(again).toEqual(e);
    recordWork(sim, sim.player, e, { at: sim.now, what: 'A test' });
    recordWork(sim, sim.player, e, { at: sim.now, what: 'A test' });
    expect(sim.player.work!.filter((w) => w.inputs.key === c.key)).toHaveLength(1);
    expect(sim.player.work!.at(-1)!.ruleset).toBe(e.ruleset);
  });
});

/** Raises one ability by an amount, wherever it's kept. */
function bump(sim: Simulation, id: AbilityId, by = 5) {
  const p = sim.player;
  const craft = ({ emotionalDepth: 'emotion', memory: 'memorization', vocal: 'voice', physical: 'movement' } as const)[id as 'memory'];
  if (craft) p.craft![craft] = Math.min(100, p.craft![craft] + by);
  else if (id === 'stamina') p.wellbeing.fitness = Math.min(abilityFull(sim, p, 'stamina'), p.wellbeing.fitness + by);
  else (p.attrs as unknown as Record<string, number>)[id] = Math.min(100, (p.attrs as unknown as Record<string, number>)[id]! + by);
}
