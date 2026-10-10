/**
 * The engine's invariants as properties (from 2026-10-10, docs/ENGINE-MODEL.md): thousands of contexts drawn by a
 * seeded generator over every task, every material and every way of playing it, each judged by a performer built from
 * numbers, so nothing but the formula is under test. A failure prints the seed and the case.
 */
import { describe, expect, it } from 'vitest';
import { draw, judge, leanedWeights, type EvalContext, type Performer } from '@/engine/systems/evaluation';
import { abilityGain } from '@/engine/systems/attributes';
import { TASK_PROFILES, EVALUATION, type TaskProfile } from '@/engine/content/tasks';
import { ABILITY_DEFS, DEVELOPMENT, MASTERED, TECHNIQUES, type AbilityId } from '@/engine/content/abilities';
import type { Skill } from '@/engine/content/school';
import { PLAY_MATERIAL, SCENE_MATERIAL, type AxisValue, type MaterialProfile } from '@/engine/content/material';
import { AXES } from '@/engine/content/approaches';
import { materialContext, type Playing } from '@/engine/systems/material';
import { focusFactor, tierFactor, matchedTier } from '@/engine/systems/practice';
import { FOCUS_RATE } from '@/engine/content/practice';
import { ENGAGEMENT } from '@/engine/content/engagement';
import { featureSpeed, featuresOf } from '@/engine/systems/experience';

/** mulberry32: a small seeded generator, so a failing case is found again from its seed. */
function rng(seed: number) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}

const TASKS = Object.values(TASK_PROFILES) as TaskProfile[];
const MATERIALS: MaterialProfile[] = [...SCENE_MATERIAL, ...PLAY_MATERIAL];
const ABILITIES = ABILITY_DEFS.map((d) => d.id) as AbilityId[];

interface Case { performer: { abilities: Record<string, number>; fulls: Record<string, number>; techniques: Record<string, number> }; ctx: EvalContext }

const performerFrom = (c: Case['performer']): Performer => ({ ability: (id) => c.abilities[id] ?? 0, full: (id) => c.fulls[id] ?? 100, technique: (s) => c.techniques[s] ?? 0 });

/** A random case: a task, a material, a choice (sometimes against the material), levels, preparation and a day. */
function caseFrom(seed: number): Case {
  const r = rng(seed);
  const pick = <T>(xs: readonly T[]) => xs[Math.floor(r() * xs.length)]!;
  const task = pick(TASKS);
  const material = r() < 0.85 ? pick(MATERIALS) : undefined;
  const playing: Playing = { chosenAt: 0, prep: r() };
  for (const [axis, a] of Object.entries(AXES) as [keyof typeof AXES, { values: readonly AxisValue[] }][]) if (r() < 0.5) (playing as unknown as Record<string, unknown>)[axis] = pick(a.values);
  const read = materialContext(task, material, playing);
  const parts = [...new Set([...Object.values(task.dims).flatMap((d) => d!.prep ?? []), ...Object.values(read.prep).flat()])];
  const fulls = Object.fromEntries(ABILITIES.map((a) => [a, 60 + Math.round(r() * 40)]));
  return {
    performer: {
      abilities: Object.fromEntries(ABILITIES.map((a) => [a, r() * fulls[a]!])),
      fulls,
      techniques: Object.fromEntries(TECHNIQUES.map((s) => [s, r() * 100])),
    },
    ctx: {
      task, techniques: { [pick(TECHNIQUES)]: 1 + Math.round(r() * 2), [pick(TECHNIQUES)]: 1 } as Partial<Record<Skill, number>>,
      prep: Object.fromEntries(parts.map((p) => [p, p === 'approach' ? playing.prep : r()])), required: Object.fromEntries(parts.map((p) => [p, 0.9])),
      difficulty: -0.5 + r() * 1.5, condition: { readiness: r() * 100, ...(r() < 0.1 ? { ill: true } : {}), ...(r() < 0.05 ? { injured: true } : {}) },
      lean: read.lean, inputs: read.inputs, extraPrep: read.prep, fit: read.fit, key: `p:${seed}`,
    },
  };
}

const N = 1500;

describe('the evaluation, as properties over drawn cases', () => {
  it('keeps every dimension and the whole within 0 to 100, and every limit’s cost within what was lost', () => {
    for (let s = 0; s < N; s += 1) {
      const c = caseFrom(s);
      const e = judge('prop', performerFrom(c.performer), c.ctx);
      expect(e.overall, `seed ${s}`).toBeGreaterThanOrEqual(0);
      expect(e.overall, `seed ${s}`).toBeLessThanOrEqual(100);
      for (const d of e.dimensions) {
        expect(d.quality).toBeGreaterThanOrEqual(0);
        expect(d.quality).toBeLessThanOrEqual(100);
        for (const l of d.limits) { expect(l.by, `seed ${s} ${l.what}`).toBeGreaterThan(0); expect(l.by, `seed ${s} ${l.what}`).toBeLessThanOrEqual(100 - d.quality + 0.11); }
      }
    }
  });

  it('never falls when any one input rises: an ability, a technique, a part of preparation, readiness or fit', () => {
    let checked = 0;
    for (let s = 0; s < N; s += 1) {
      const c = caseFrom(s);
      const base = judge('prop', performerFrom(c.performer), c.ctx);
      const r = rng(s + 1e6);
      const raised: [string, Case][] = [];
      const a = ABILITIES[Math.floor(r() * ABILITIES.length)]!;
      raised.push([`ability ${a}`, { ...c, performer: { ...c.performer, abilities: { ...c.performer.abilities, [a]: Math.min(c.performer.fulls[a]!, c.performer.abilities[a]! + 10) } } }]);
      const t = TECHNIQUES[Math.floor(r() * TECHNIQUES.length)]!;
      raised.push([`technique ${t}`, { ...c, performer: { ...c.performer, techniques: { ...c.performer.techniques, [t]: Math.min(100, c.performer.techniques[t]! + 10) } } }]);
      const parts = Object.keys(c.ctx.prep);
      if (parts.length) { const p = parts[Math.floor(r() * parts.length)]!; raised.push([`prep ${p}`, { ...c, ctx: { ...c.ctx, prep: { ...c.ctx.prep, [p]: Math.min(1, c.ctx.prep[p]! + 0.2) } } }]); }
      raised.push(['readiness', { ...c, ctx: { ...c.ctx, condition: { ...c.ctx.condition, readiness: Math.min(100, c.ctx.condition.readiness + 15) } } }]);
      if (c.ctx.fit && Object.keys(c.ctx.fit).length) raised.push(['fit', { ...c, ctx: { ...c.ctx, fit: {} } }]);
      for (const [what, up] of raised) {
        const e = judge('prop', performerFrom(up.performer), up.ctx);
        for (const d of e.dimensions) {
          const was = base.dimensions.find((x) => x.dimension === d.dimension)!.quality;
          expect(d.quality, `seed ${s}, ${what}, ${d.dimension}`).toBeGreaterThanOrEqual(was - 0.051);
        }
        expect(e.overall, `seed ${s}, ${what}`).toBeGreaterThanOrEqual(base.overall - 0.051);
        checked += 1;
      }
    }
    expect(checked).toBeGreaterThan(4 * N);
  });

  it('keeps the mastery contract: every input full, preparation complete, a sufficient day and a fitting choice is 100, every time', () => {
    for (let s = 0; s < N; s += 1) {
      const c = caseFrom(s);
      const full: Case = {
        performer: { abilities: { ...c.performer.fulls }, fulls: c.performer.fulls, techniques: Object.fromEntries(TECHNIQUES.map((t) => [t, MASTERED])) },
        ctx: { ...c.ctx, prep: Object.fromEntries(Object.keys(c.ctx.prep).map((p) => [p, 1])), condition: { readiness: EVALUATION.sufficientReadiness + 5 }, fit: {} },
      };
      const e = judge('prop', performerFrom(full.performer), full.ctx);
      expect(e.mastery, `seed ${s}`).toBe(true);
      expect(e.overall, `seed ${s}`).toBe(100);
      expect(e.limits).toHaveLength(0);
    }
  });

  it('still rises with ability where every factor is at its floor and the draw is at its highest: the corner a random case misses', () => {
    // Found by mutation (2026-10-10): with the draw not scaled by the factors, an unprepared, exhausted, ill, hurt and
    // misfit night fell as ability rose, since 100 times the factors (about 9) was less than the draw (10).
    // Movement's execution is reached by fatigue, illness and injury alike: its factors can fall to about 0.09.
    const task = TASK_PROFILES.movement!;
    const dims = Object.keys(task.dims).filter((d) => ['fatigue', 'illness', 'injury'].every((c) => task.dims[d as keyof typeof task.dims]!.conditions?.includes(c as never)));
    const keys = Array.from({ length: 4000 }, (_, i) => `corner:${i}`).flatMap((k) => dims.filter((d) => draw(`prop:${k}:${d}`) > 0.95).map((d) => ({ k, d }))).slice(0, 12);
    expect(keys.length).toBeGreaterThan(5);
    for (const { k: key, d: high } of keys) {
    const parts = [...new Set(Object.values(task.dims).flatMap((d) => d!.prep ?? []))];
    const ctx: EvalContext = { task, techniques: { movement: 1 } as Partial<Record<Skill, number>>, prep: Object.fromEntries(parts.map((p) => [p, 0])), required: Object.fromEntries(parts.map((p) => [p, 0.9])), difficulty: 0, condition: { readiness: 0, ill: true, injured: true }, fit: Object.fromEntries(dims.map((d) => [d, { f: 0.85, label: 'misfit' }])), key };
    let was = -1;
    for (let lv = 0; lv <= 100; lv += 5) {
      const p: Case['performer'] = { abilities: Object.fromEntries(ABILITIES.map((a) => [a, lv])), fulls: Object.fromEntries(ABILITIES.map((a) => [a, 100])), techniques: Object.fromEntries(TECHNIQUES.map((t) => [t, lv])) };
      const q = judge('prop', performerFrom(p), { ...ctx, key }).dimensions.find((x) => x.dimension === high)!.quality;
      expect(q, `${high} at ${lv}, ${key}`).toBeGreaterThanOrEqual(was - 0.051);
      was = q;
    }
    }
  });

  it('counts preparation past what completes it as complete, and no more', () => {
    for (let s = 0; s < 400; s += 1) {
      const c = caseFrom(s);
      const at = { ...c.ctx, prep: Object.fromEntries(Object.keys(c.ctx.prep).map((p) => [p, c.ctx.required[p] ?? 1])) };
      const past = { ...c.ctx, prep: Object.fromEntries(Object.keys(c.ctx.prep).map((p) => [p, 1])) };
      expect(judge('prop', performerFrom(c.performer), past).overall, `seed ${s}`).toBe(judge('prop', performerFrom(c.performer), at).overall);
    }
  });

  it('works out the same case the same way, and a different night differently', () => {
    let differ = 0;
    for (let s = 0; s < 300; s += 1) {
      const c = caseFrom(s);
      const one = judge('prop', performerFrom(c.performer), c.ctx);
      expect(judge('prop', performerFrom(c.performer), c.ctx)).toEqual(one);
      if (judge('prop', performerFrom(c.performer), { ...c.ctx, key: `${c.ctx.key}:other` }).overall !== one.overall) differ += 1;
    }
    expect(differ).toBeGreaterThan(200);
  });

  it('leans weights without adding any: the total is the task’s, whatever the material and the choice', () => {
    for (let s = 0; s < N; s += 1) {
      const c = caseFrom(s);
      const was = Object.values(c.ctx.task.dims).reduce((a, d) => a + d!.weight, 0);
      const now = Object.values(leanedWeights(c.ctx.task, [], c.ctx.lean)).reduce((a, b) => a + (b ?? 0), 0);
      expect(now, `seed ${s}`).toBeCloseTo(was, 9);
    }
  });

  it('keeps the draw bounded: at most the variation either way, widened only downward on a tired day', () => {
    for (let s = 0; s < N; s += 1) {
      const c = caseFrom(s);
      const e = judge('prop', performerFrom(c.performer), c.ctx);
      for (const d of e.dimensions) {
        expect(d.variation, `seed ${s}`).toBeLessThanOrEqual(EVALUATION.variation + 1e-9);
        expect(d.variation, `seed ${s}`).toBeGreaterThanOrEqual(-EVALUATION.variation * (1 + EVALUATION.fatigueSpread) - 1e-9);
      }
    }
  });
});

describe('growth, as properties', () => {
  it('never grows past full, never shrinks, and grows less the nearer full', () => {
    const r = rng(7);
    for (let i = 0; i < 5000; i += 1) {
      const reach = 40 + r() * 60;
      const level = r() < 0.1 ? 100 : r() * 100;
      const t = { weight: r() * 2, focus: r(), deliberate: r() < 0.5 };
      const g = abilityGain(level, reach, t);
      expect(g).toBeGreaterThanOrEqual(0);
      if (level >= 100) expect(g).toBe(0);
      expect(abilityGain(Math.min(100, level + 5), reach, t)).toBeLessThanOrEqual(g + 1e-12);
      expect(g).toBeLessThanOrEqual(DEVELOPMENT.sessionGain * Math.max(1, DEVELOPMENT.deliberate) * t.weight * t.focus + 1e-12);
    }
  });

  it('gives each focus a day it costs, and the matched tier the most at every level', () => {
    for (const f of ['precision', 'spaced', 'variation', 'live'] as const) {
      const worst = Math.min(...[0.2, 0.6, 0.9].flatMap((day) => [undefined, 0, 2, 30].map((gap) => focusFactor(f, day, gap))));
      expect(worst, f).toBeLessThan(1);
    }
    expect(focusFactor('steady', 0.1, undefined)).toBe(1);
    for (let level = 0; level <= 100; level += 1) {
      const m = matchedTier(level);
      for (const t of [0, 1, 2] as const) expect(tierFactor(t, level)).toBeLessThanOrEqual(tierFactor(m, level));
    }
    // Breadth focuses carry the same in all, so neither is the other's better.
    expect(FOCUS_RATE.live.primary + 2 * FOCUS_RATE.live.transfer).toBeCloseTo(FOCUS_RATE.variation.primary + FOCUS_RATE.variation.transfer, 9);
  });

  it('speeds preparation by experience at most the genre’s own sixth, however much has been met, and only where the material asks it', () => {
    const r = rng(11);
    for (let i = 0; i < 2000; i += 1) {
      const m = MATERIALS[Math.floor(r() * MATERIALS.length)]!;
      const met = Math.floor(r() * 40);
      const person = { experience: { features: Object.fromEntries(featuresOf(m).map((f) => [f, { met, practiced: Math.floor(r() * 40) }])), approaches: {}, materials: {}, exercises: {} } } as never;
      const speed = featureSpeed(person, m);
      expect(speed).toBeGreaterThanOrEqual(1);
      expect(speed).toBeLessThanOrEqual(1 + ENGAGEMENT.genreSpeed + 1e-12);
      // Experience reaches no evaluation input: the same case judges the same with or without it.
      if (!featuresOf(m).length) expect(speed).toBe(1);
    }
  });
});
