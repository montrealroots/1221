/**
 * Material, the way it's played, practice on a challenge and the experience record (from 2026-10-10;
 * `content/material.ts`, `content/approaches.ts`, `systems/material.ts`, `systems/practice.ts`,
 * `systems/experience.ts`). The guarantee across every material and every fitting choice; monotonicity and
 * irrelevance with material in the formula; leans that move weight and never add it; two comedies that ask different
 * things; mixed tone as transitions, not two genres' bonuses stacked; choices that both reach 100 and differ below it;
 * a director's request given as a note and taken; practice's tiers and focuses, each better somewhere; recommendations
 * that drop a weakness once it's addressed. FIXTURES set levels by hand to reach a rule, and say so.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { evaluate, leanedWeights, type EvalContext } from '@/engine/systems/evaluation';
import { abilityFull, levelOf } from '@/engine/systems/attributes';
import { TASK_PROFILES, EVALUATION, type Dimension } from '@/engine/content/tasks';
import { ABILITY_DEFS, MASTERED, type AbilityId } from '@/engine/content/abilities';
import { evenCraft } from '@/engine/systems/school';
import { MATERIAL_BY_ID, PLAY_MATERIAL, SCENE_MATERIAL, type AxisValue, type MaterialProfile } from '@/engine/content/material';
import { AXES, MISFIT } from '@/engine/content/approaches';
import { materialContext, misfitOf, type Playing } from '@/engine/systems/material';
import { practiceHour, focusFactor, tierFactor, matchedTier } from '@/engine/systems/practice';
import { EXERCISE_BY_ID, FOCUS_RATE, TIER } from '@/engine/content/practice';
import { experienceOf, featureSpeed, noteMaterial, recommendations } from '@/engine/systems/experience';
import { againstDirection, processOf, callAnswered } from '@/engine/systems/production';
import { rngFor } from '@/engine/core/rng';

const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });

/** FIXTURE: every ability at a level, stamina at that share of its age's ceiling, every technique at a level. */
function at(sim: Simulation, ability: number, technique = ability, over: Partial<Record<AbilityId, number>> = {}) {
  const p = sim.player;
  p.craft = evenCraft(technique);
  for (const k of ['emotion', 'memorization', 'voice', 'movement'] as const) p.craft[k] = ability;
  p.attrs = { presence: ability, composure: ability, listening: ability, imagination: ability, focus: ability, adaptability: ability, discipline: ability };
  p.wellbeing.fitness = (ability / 100) * abilityFull(sim, p, 'stamina');
  const map: Partial<Record<AbilityId, (v: number) => void>> = {
    emotionalDepth: (v) => { p.craft!.emotion = v; }, memory: (v) => { p.craft!.memorization = v; }, vocal: (v) => { p.craft!.voice = v; }, physical: (v) => { p.craft!.movement = v; },
    stamina: (v) => { p.wellbeing.fitness = (v / 100) * abilityFull(sim, p, 'stamina'); },
  };
  for (const [id, v] of Object.entries(over) as [AbilityId, number][]) (map[id] ?? ((x: number) => { (p.attrs as unknown as Record<string, number>)[id] = x; }))(v);
}

const full = (task: keyof typeof TASK_PROFILES, extra: string[] = []) => {
  const parts = new Set([...Object.values(TASK_PROFILES[task]!.dims).flatMap((d) => d!.prep ?? []), ...extra]);
  return { prep: Object.fromEntries([...parts].map((k) => [k, 1])), required: Object.fromEntries([...parts].map((k) => [k, 0.9])) };
};

/** The evaluation context for a material, a task and a choice, prepared to a share. */
function ctxFor(task: keyof typeof TASK_PROFILES, m: MaterialProfile | undefined, playing?: Playing, share = 1, over: Partial<EvalContext> = {}, direction?: Partial<Record<'pace' | 'scale' | 'structure', AxisValue>>): EvalContext {
  const read = materialContext(TASK_PROFILES[task]!, m, playing, direction);
  const prep = full(task, playing ? ['approach'] : []);
  for (const k of Object.keys(prep.prep)) prep.prep[k] = share;
  return { task: TASK_PROFILES[task]!, techniques: { scene: 2, ...(m?.techniques ?? {}) }, ...prep, difficulty: 0.3, condition: { readiness: 85 }, key: `m:${task}:${m?.id}`, lean: read.lean, inputs: read.inputs, extraPrep: read.prep, fit: read.fit, ...over };
}

/** Every combination of sides on the three axes, each left open too. */
const choices = (): Omit<Playing, 'chosenAt' | 'prep'>[] => {
  const out: Omit<Playing, 'chosenAt' | 'prep'>[] = [];
  for (const pace of [undefined, ...AXES.pace.values]) for (const scale of [undefined, ...AXES.scale.values]) for (const structure of [undefined, ...AXES.structure.values]) out.push({ ...(pace ? { pace } : {}), ...(scale ? { scale } : {}), ...(structure ? { structure } : {}) } as Omit<Playing, 'chosenAt' | 'prep'>);
  return out;
};
const fits = (m: MaterialProfile, c: Omit<Playing, 'chosenAt' | 'prep'>) => (['pace', 'scale', 'structure'] as const).every((a) => !c[a] || !misfitOf(a, c[a]!, m));

describe('the guarantee, with material and choices', () => {
  it('gives 100 on every dimension and the whole for every material, every task, and every fitting choice, at mastery', () => {
    const sim = life('mat-max');
    at(sim, 100, MASTERED);
    let n = 0;
    for (const m of [...SCENE_MATERIAL, ...PLAY_MATERIAL]) for (const task of ['scene', 'performance', 'camera'] as const) for (const c of choices()) {
      if (!fits(m, c)) continue;
      const playing = Object.keys(c).length ? { ...c, chosenAt: 0, prep: 1 } : undefined;
      const e = evaluate(sim, sim.player, ctxFor(task, m, playing, 1, { condition: { readiness: EVALUATION.sufficientReadiness }, key: `mx:${m.id}:${task}:${JSON.stringify(c)}` }));
      expect(e.overall, `${m.id} ${task} ${JSON.stringify(c)}`).toBe(100);
      for (const d of e.dimensions) expect(d.quality).toBe(100);
      expect(e.mastery).toBe(true);
      n += 1;
    }
    expect(n).toBeGreaterThan(2000);
  });

  it('a choice the material forbids is said before it’s made, and holds the dimensions it leans on under 100 even at mastery', () => {
    const sim = life('mat-misfit');
    at(sim, 100, MASTERED);
    const proposal = MATERIAL_BY_ID.proposal!;
    expect(misfitOf('pace', 'measured', proposal)).toMatch(/doesn’t take it/);
    const e = evaluate(sim, sim.player, ctxFor('scene', proposal, { pace: 'measured', chosenAt: 0, prep: 1 }));
    expect(e.mastery).toBe(false);
    expect(e.overall).toBeLessThan(100);
    expect(e.limits[0]!.kind).toBe('fit');
    const interp = e.dimensions.find((d) => d.dimension === 'interpretation')!;
    expect(interp.quality).toBeCloseTo(100 * MISFIT, 5);
  });

  it('an unprepared choice is a visible part of preparation, not a hidden requirement', () => {
    const sim = life('mat-unprepared');
    at(sim, 100, MASTERED);
    const e = evaluate(sim, sim.player, { ...ctxFor('scene', MATERIAL_BY_ID['earnest-2'], { scale: 'restrained', chosenAt: 0, prep: 1 }), prep: { ...ctxFor('scene', MATERIAL_BY_ID['earnest-2'], { scale: 'restrained', chosenAt: 0, prep: 1 }).prep, approach: 0.3 } });
    expect(e.overall).toBeLessThan(100);
    expect(e.limits.some((l) => l.kind === 'preparation' && l.what === 'approach')).toBe(true);
  });
});

describe('the formula’s invariants, with material', () => {
  it('quality never falls as an input it reads rises, across random material, choices, preparation and days', () => {
    const sim = life('mat-mono');
    const rng = rngFor('mat-mono', 'x');
    const mats = [...SCENE_MATERIAL, ...PLAY_MATERIAL];
    const cs = choices();
    for (let n = 0; n < 250; n += 1) {
      const m = mats[n % mats.length]!;
      const c = cs[Math.floor(rng.next() * cs.length)]!;
      const task = (['scene', 'performance', 'camera', 'audition'] as const)[n % 4]!;
      const level = 10 + rng.next() * 85;
      const raiseId = ABILITY_DEFS[n % ABILITY_DEFS.length]!.id;
      at(sim, level, 10 + rng.next() * 85);
      const playing = Object.keys(c).length ? { ...c, chosenAt: 0, prep: rng.next() } : undefined;
      const base = ctxFor(task, m, playing, rng.next(), { difficulty: rng.next() * 1.5 - 0.5, condition: { readiness: rng.next() * 100, ill: rng.next() < 0.3, injured: rng.next() < 0.3 }, key: `mono:${n}` }, rng.next() < 0.5 ? { pace: 'driven' } : undefined);
      const was = evaluate(sim, sim.player, base);
      at(sim, level, sim.player.craft!.scene, { [raiseId]: Math.min(100, level + 7) });
      const after = evaluate(sim, sim.player, base);
      for (const d of after.dimensions) expect(d.quality + 1e-9, `${m.id} ${raiseId} ${d.dimension}`).toBeGreaterThanOrEqual(was.dimensions.find((x) => x.dimension === d.dimension)!.quality);
      expect(after.overall + 1e-9).toBeGreaterThanOrEqual(was.overall);
      // More preparation, and a better day, never lower it either.
      const prepped = evaluate(sim, sim.player, { ...base, prep: Object.fromEntries(Object.entries(base.prep).map(([k, v]) => [k, Math.min(1, v + 0.2)])) });
      expect(prepped.overall + 1e-9).toBeGreaterThanOrEqual(after.overall);
      const rested = evaluate(sim, sim.player, { ...base, condition: { ...base.condition, readiness: Math.min(100, base.condition.readiness + 20) } });
      expect(rested.overall + 1e-9).toBeGreaterThanOrEqual(after.overall);
    }
  });

  it('an ability nothing reads changes nothing: a written analysis on verse ignores the body', () => {
    const sim = life('mat-irrelevant');
    at(sim, 60);
    const m = MATERIAL_BY_ID['richard3-1-2']!;
    const base = ctxFor('written', m, undefined, 0.7);
    const was = evaluate(sim, sim.player, base).overall;
    at(sim, 60, 60, { physical: 95, stamina: 95, presence: 95 });
    expect(evaluate(sim, sim.player, base).overall).toBe(was);
  });

  it('a material’s and a choice’s leans move weight between dimensions and never add to it', () => {
    for (const m of [...SCENE_MATERIAL, ...PLAY_MATERIAL]) for (const c of choices().slice(0, 9)) {
      const task = TASK_PROFILES.performance!;
      const read = materialContext(task, m, Object.keys(c).length ? { ...c, chosenAt: 0, prep: 1 } : undefined);
      const w = leanedWeights(task, [], read.lean);
      const total = Object.values(w).reduce((a, b) => a + (b ?? 0), 0);
      const base = Object.values(task.dims).reduce((a, d) => a + d!.weight, 0);
      expect(total).toBeCloseTo(base, 9);
    }
  });
});

describe('material asks what it asks', () => {
  it('two comedies ask different things: Earnest’s verbal timing, The Proposal’s escalating body and voice', () => {
    const earnest = MATERIAL_BY_ID['earnest-2']!, proposal = MATERIAL_BY_ID.proposal!;
    expect(earnest.techniques?.comedy).toBeDefined();
    expect(earnest.physical).toBe(0);
    expect(proposal.physical).toBeGreaterThanOrEqual(2);
    expect(proposal.allows?.pace).toEqual(['driven']);
    expect(earnest.allows?.pace).toBeUndefined();
    const task = TASK_PROFILES.scene!;
    const re = materialContext(task, earnest), rp = materialContext(task, proposal);
    const has = (r: typeof re, d: Dimension, a: AbilityId) => r.inputs[d]?.some((x) => x.ability === a) ?? false;
    expect(has(rp, 'execution', 'physical')).toBe(true);
    expect(has(re, 'execution', 'physical')).toBe(false);
    // So a body that's weak costs one comedy and not the other.
    const sim = life('mat-comedies');
    at(sim, 75, 75, { physical: 30, stamina: 30 });
    const e = evaluate(sim, sim.player, ctxFor('scene', earnest)).overall;
    const p = evaluate(sim, sim.player, ctxFor('scene', proposal)).overall;
    at(sim, 75, 75);
    const e2 = evaluate(sim, sim.player, ctxFor('scene', earnest)).overall;
    const p2 = evaluate(sim, sim.player, ctxFor('scene', proposal)).overall;
    expect(p2 - p).toBeGreaterThan(e2 - e);
  });

  it('mixed tone is read as its transitions, not as a comedy’s and a drama’s leans added together', () => {
    const cherry = MATERIAL_BY_ID['The Cherry Orchard']!;
    const read = materialContext(TASK_PROFILES.performance!, cherry);
    expect(read.inputs.believability?.some((x) => x.ability === 'adaptability')).toBe(true);
    const sim = life('mat-mixed');
    at(sim, 75, 75, { adaptability: 30 });
    const low = evaluate(sim, sim.player, ctxFor('performance', cherry)).overall;
    at(sim, 75, 75);
    expect(evaluate(sim, sim.player, ctxFor('performance', cherry)).overall).toBeGreaterThan(low);
  });
});

describe('choices of how to play', () => {
  it('both sides of an axis reach 100 at mastery, and below it the one that leans on an actor’s strength shows them better', () => {
    const sim = life('mat-choices');
    const m = MATERIAL_BY_ID['twelfth-1-5']!;
    at(sim, 100, MASTERED);
    for (const scale of ['restrained', 'expansive'] as const) expect(evaluate(sim, sim.player, ctxFor('performance', m, { scale, chosenAt: 0, prep: 1 })).overall).toBe(100);
    // FIXTURE: one actor strong in feeling, another in presence.
    at(sim, 60, 60, { emotionalDepth: 90 });
    const feelRestrained = evaluate(sim, sim.player, ctxFor('performance', m, { scale: 'restrained', chosenAt: 0, prep: 1 }, 1, { key: 'c' })).overall;
    const feelExpansive = evaluate(sim, sim.player, ctxFor('performance', m, { scale: 'expansive', chosenAt: 0, prep: 1 }, 1, { key: 'c' })).overall;
    at(sim, 60, 60, { presence: 90 });
    const presRestrained = evaluate(sim, sim.player, ctxFor('performance', m, { scale: 'restrained', chosenAt: 0, prep: 1 }, 1, { key: 'c' })).overall;
    const presExpansive = evaluate(sim, sim.player, ctxFor('performance', m, { scale: 'expansive', chosenAt: 0, prep: 1 }, 1, { key: 'c' })).overall;
    expect(feelRestrained).toBeGreaterThan(feelExpansive);
    expect(presExpansive).toBeGreaterThan(presRestrained);
  });

  it('a director’s request against the choice is a note at a work-through, taken once the choice changes', () => {
    const sim = life('mat-direction');
    at(sim, 70);
    const holder = { play: 'Twelfth Night', production: 'Twelfth Night', term: 3 } as never;
    const p = processOf(holder);
    // FIXTURE: a director who asks for it driven.
    p.direction = { pace: 'driven' };
    p.playing = { pace: 'measured', chosenAt: 0, prep: 0.5 };
    expect(againstDirection(p)).toEqual({ axis: 'pace', side: 'driven' });
    callAnswered(sim, sim.player, holder, 'work', 6, 12, { classical: 2 });
    expect(p.notes.at(-1)!.focus).toEqual({ kind: 'direction', axis: 'pace', side: 'driven' });
    p.playing = { pace: 'driven', chosenAt: 0, prep: 0.2 };
    callAnswered(sim, sim.player, holder, 'work', 7, 12, { classical: 2 });
    expect(p.notes.at(-2)!.taken).toBe(true);
    expect(p.playing.prep).toBeGreaterThan(0.2);
  });
});

describe('practice on a challenge', () => {
  it('counts a matched tier in full, one off less, two off half; precision pays rested and costs tired; spacing helps within the week', () => {
    expect(tierFactor(matchedTier(30), 30)).toBe(TIER.matched);
    expect(tierFactor(0, 80)).toBe(TIER.far);
    expect(tierFactor(1, 80)).toBe(TIER.below);
    expect(tierFactor(2, 60)).toBe(TIER.above);
    expect(focusFactor('precision', 0.95, undefined)).toBe(FOCUS_RATE.precision.rested);
    expect(focusFactor('precision', 0.6, undefined)).toBe(FOCUS_RATE.precision.tired);
    expect(focusFactor('spaced', 0.8, 2)).toBe(FOCUS_RATE.spaced.within);
    expect(focusFactor('spaced', 0.8, 0)).toBe(1);
    expect(focusFactor('spaced', 0.8, 30)).toBe(1);
  });

  it('no focus is best everywhere: precision beats steady rested and loses tired; variation carries over and steady doesn’t', () => {
    const run = (focus: 'steady' | 'precision' | 'variation', tired: boolean) => {
      const sim = life(`mat-prac-${focus}-${tired}`);
      at(sim, 50);
      if (tired) Object.assign(sim.player.wellbeing, { energy: 25, sleepDebt: 6 });
      const r = practiceHour(sim, sim.player, EXERCISE_BY_ID['verse-speaking']!, undefined, focus);
      return r;
    };
    const restedSteady = run('steady', false).gained, restedPrecise = run('precision', false).gained;
    const tiredSteady = run('steady', true).gained, tiredPrecise = run('precision', true).gained;
    expect(restedPrecise).toBeGreaterThan(restedSteady);
    expect(tiredPrecise).toBeLessThan(tiredSteady);
    const v = run('variation', false);
    expect(v.gained).toBeLessThan(restedSteady);
    expect(v.carried.some((c) => c.gained > 0)).toBe(true);
    expect(v.feedback).toMatch(/carried over/);
  });

  it('a second hour the same day keeps half, whichever focus it’s called: changing the focus isn’t a way round it', () => {
    const sim = life('mat-prac-repeat');
    at(sim, 50);
    const first = practiceHour(sim, sim.player, EXERCISE_BY_ID['comic-timing']!, undefined, 'steady').gained;
    const second = practiceHour(sim, sim.player, EXERCISE_BY_ID['comic-timing']!, undefined, 'spaced').gained;
    expect(second).toBeLessThan(first * 0.6);
  });

  it('keeps the session on the record, with the features it’s practice in, which speed preparation of material that asks them', () => {
    const sim = life('mat-prac-record');
    at(sim, 50);
    const verse = MATERIAL_BY_ID['romeo-2-2']!;
    const before = featureSpeed(sim.player, verse);
    for (let i = 0; i < 4; i += 1) { practiceHour(sim, sim.player, EXERCISE_BY_ID['verse-speaking']!, undefined, 'spaced'); sim.advanceTo(sim.now + 2 * MS_DAY); }
    expect(experienceOf(sim.player).exercises['verse-speaking']!.sessions).toBe(4);
    expect(featureSpeed(sim.player, verse)).toBeGreaterThan(before);
  });
});

describe('experience and recommendations', () => {
  it('familiarity speeds preparation to the genre’s own most, and never adds to quality', () => {
    const sim = life('mat-xp');
    at(sim, 60);
    const m = MATERIAL_BY_ID['earnest-2']!;
    const q = evaluate(sim, sim.player, ctxFor('scene', m, undefined, 0.8)).overall;
    for (let i = 0; i < 20; i += 1) noteMaterial(sim.player, { material: m, at: sim.now, overall: 60, shown: true });
    expect(featureSpeed(sim.player, m)).toBeCloseTo(1 + 1 / 6, 9);
    expect(evaluate(sim, sim.player, ctxFor('scene', m, undefined, 0.8)).overall).toBe(q);
  });

  it('recommends what cost recent work, and stops once it’s been addressed', () => {
    const work = [1, 2, 3].map((i) => ({ at: i, limits: [{ kind: 'ability', what: 'listening', label: 'Listening', by: 6 }, { kind: 'ability', what: 'focus', label: 'Focus', by: 2 }], inputs: { abilities: { listening: 40, focus: 50 } as Record<string, number | undefined> } }));
    const levels: Record<string, number> = { listening: 40, focus: 50 };
    const ex = (id: string) => ({ id: `ex-${id}` });
    const first = recommendations((id) => levels[id] ?? 0, () => 100, work, ex, matchedTier);
    expect(first[0]!.target).toBe('listening');
    expect(first[0]!.exercise).toBe('ex-listening');
    // Listening practised to full: no longer recommended; focus moves up.
    levels.listening = 100;
    const after = recommendations((id) => levels[id] ?? 0, () => 100, work, ex, matchedTier);
    expect(after.some((r) => r.target === 'listening')).toBe(false);
    expect(after[0]!.target).toBe('focus');
    // Grown most of the way: it counts what it costs now.
    levels.listening = 85;
    const partway = recommendations((id) => levels[id] ?? 0, () => 100, work, ex, matchedTier);
    expect(partway.find((r) => r.target === 'listening')!.points).toBeLessThan(first[0]!.points);
    void levelOf;
  });
});
