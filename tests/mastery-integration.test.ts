/**
 * The maximum-mastery guarantee through the game's own path (from 2026-10-10): a student whose every ability is full
 * and every technique mastered (TEST SETUP: written onto the character, since reaching it by play takes years and is
 * measured by `tools/mastery.ts`) prepares a movement score only through `school.prepare`, the clock running classes,
 * meals and sleep around it, and the class meeting judges it on its own schedule. It comes out at 100 on every
 * dimension, the record and the journey keep it, and the band is the top one. The same student injured at the showing
 * (TEST SETUP) shows the injury on exactly the dimensions it reaches, and recovered, the maximum again.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { MS_DAY, MS_HOUR, zonedParts } from '@/engine/core/time';
import { courseworkOf, prepareRefusal } from '@/engine/systems/coursework';
import { templateById } from '@/engine/content/coursework';
import { abilityFull, attributesOf } from '@/engine/systems/attributes';
import { healthOf } from '@/engine/systems/health';
import { journeyOf } from '@/engine/systems/evaluation';
import { attentiveHour } from '../tools/policy';
import { EVALUATION } from '@/engine/content/tasks';

const TEMPLATE = 'movement-score';

/** TEST SETUP: every ability full and every craft skill at 100, the body at its age's ceiling. */
function mastered(sim: Simulation) {
  const p = sim.player;
  for (const k of Object.keys(p.craft!)) (p.craft as Record<string, number>)[k] = 100;
  const a = attributesOf(sim, p) as unknown as Record<string, number>;
  for (const k of Object.keys(a)) a[k] = 100;
  p.wellbeing.fitness = abilityFull(sim, p, 'stamina');
}

/** Played until a movement score is set, each step of it prepared through the command as it can be; then to its showing. */
function playToShowing(seed: string, before?: (sim: Simulation, due: string) => void) {
  let sim = createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
  mastered(sim);
  const until = sim.now + 200 * MS_DAY;
  let id: string | undefined;
  let due = '';
  let struck = false;
  while (sim.now < until) {
    const cw = courseworkOf(sim, sim.player);
    const a = id ? cw?.assignments.find((x) => x.id === id) : cw?.assignments.find((x) => x.template === TEMPLATE && x.status === 'open');
    if (a && !id) { id = a.id; due = a.dueOn; }
    if (id && (sim.player.work ?? []).some((w) => w.inputs.key.startsWith(`show:${sim.player.id}:${id}:`))) break;
    // The fitness the save keeps topping up is the body's own: kept at its ceiling as the setup asks (a workout would do it).
    sim.player.wellbeing.fitness = abilityFull(sim, sim.player, 'stamina');
    if (before && !struck && due) {
      const p = zonedParts(sim.now, sim.zone);
      const today = `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
      if (today === due) { before(sim, due); struck = true; }
    }
    attentiveHour(sim, () => {
      if (!a) return false;
      const t = templateById(a.template)!;
      const act = t.activities.find((x) => (a.prep[x.dim] ?? 0) < 1 && !prepareRefusal(sim, sim.player, a, x.id));
      return act ? sim.execute({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: act.id } }).ok : false;
    });
    if (sim.now % (30 * MS_DAY) < MS_HOUR) sim = loadSave(deserialise(serialise(sim.universe)) as never);
  }
  const rec = (sim.player.work ?? []).find((w) => w.inputs.key.startsWith(`show:${sim.player.id}:${id}:`));
  return { sim, rec, id };
}

describe('mastery, shown in class', () => {
  it('comes out at 100 on every dimension, the top band, in the record and the journey', () => {
    const { sim, rec } = playToShowing('mastery-shown');
    expect(rec, 'the movement score was shown').toBeDefined();
    expect(rec!.inputs.condition.readiness).toBeGreaterThanOrEqual(60);
    // Prepared through the command, every part to complete, and shown after classes began, on the class's own day.
    for (const [part, v] of Object.entries(rec!.inputs.prep)) expect(v, part).toBeGreaterThanOrEqual(EVALUATION.complete.coursework);
    expect(rec!.at).toBeGreaterThan(sim.universe.meta.createdAt + 7 * MS_DAY);
    for (const [d, q] of Object.entries(rec!.dims)) expect(q, d).toBe(100);
    expect(rec!.overall).toBe(100);
    expect(rec!.mastery).toBe(true);
    expect(rec!.band).toBe('exceptional');
    const j = journeyOf(sim.player);
    expect(j.totals.movement?.mastery ?? 0).toBeGreaterThanOrEqual(1);
    expect(j.milestones.some((m) => m.kind === 'first-mastery')).toBe(true);
  }, 120_000);

  it('shows an injury at the showing on exactly the dimensions it reaches, and the maximum again once it mends', () => {
    // TEST SETUP: a sprained ankle the morning of the showing, mending in eight days.
    const hurt = playToShowing('mastery-shown', (sim) => { healthOf(sim.player).injury = { kind: 'sprain', at: sim.now, until: sim.now + 8 * MS_DAY }; });
    expect(hurt.rec).toBeDefined();
    const t = templateById(TEMPLATE)!;
    expect(t).toBeDefined();
    // Movement work: execution and consistency name injury; interpretation doesn't.
    expect(hurt.rec!.dims.interpretation).toBe(100);
    expect(hurt.rec!.dims.execution!).toBeLessThan(100);
    expect(hurt.rec!.dims.consistency!).toBeLessThan(100);
    expect(hurt.rec!.mastery).toBe(false);
    expect(hurt.rec!.limits.every((l) => l.kind === 'condition')).toBe(true);
  }, 120_000);
});
