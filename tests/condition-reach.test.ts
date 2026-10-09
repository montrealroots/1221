/**
 * What illness and injury reach (from 2026-10-10): each injury by what it limits (`INJURY_KIND[].limits`), the body's
 * dimensions for a sprain, every one for a concussion and none for a cut; the flu the voice's and, since then, the
 * body's work too; each once; and an injury that limits the work excusing a day called in sick. Measured matched in
 * `tools/condition.ts`: until then a cut finger took a third off a movement score, and the flu took nothing.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { evaluate, type Condition } from '@/engine/systems/evaluation';
import { conditionAt, ESTIMATE } from '@/engine/systems/school';
import { healthOf } from '@/engine/systems/health';
import { trainingRefusal } from '@/engine/systems/injury';
import { INJURY_KIND, type InjuryKind } from '@/engine/content/injury';
import { EVALUATION, TASK_PROFILES } from '@/engine/content/tasks';

const zone = 'America/New_York';
const at = (y: number, m: number, d: number, h = 9) => instantFromZoned({ year: y, month: m, day: d, hour: h }, zone);
const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const play = (sim: Simulation, until: number) => { while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR)); };
const hurt = (sim: Simulation, kind: InjuryKind, days = 10) => { healthOf(sim.player).injury = { kind, at: sim.now, until: sim.now + days * MS_DAY }; };

/** One piece of work judged at a condition, everything else the same. */
function judged(sim: Simulation, task: string, condition: Condition) {
  return evaluate(sim, sim.player, { task: TASK_PROFILES[task]!, techniques: { scene: 1 }, prep: {}, required: {}, difficulty: 0, condition, key: 'reach' });
}
const dims = (e: ReturnType<typeof judged>) => Object.fromEntries(e.dimensions.map((d) => [d.dimension, d.quality]));

describe('an injury reaches what it limits', () => {
  it('a sprain the body’s dimensions, a concussion every one, a cut or a knock none', () => {
    const sim = life('reach-kinds');
    const of = (kind?: InjuryKind) => { delete healthOf(sim.player).injury; if (kind) hurt(sim, kind); return conditionAt(sim, sim.player, sim.now); };
    expect(of('sprain')).toMatchObject({ injured: true });
    expect(of('sprain').concussed).toBeUndefined();
    expect(of('back')).toMatchObject({ injured: true });
    expect(of('fracture')).toMatchObject({ injured: true });
    expect(of('concussion')).toMatchObject({ concussed: true });
    expect(of('concussion').injured).toBeUndefined();
    expect(of('cut').injured).toBeUndefined();
    expect(of('cut').concussed).toBeUndefined();
    expect(of('bruise').injured).toBeUndefined();
    // Training follows the same reading.
    for (const k of Object.keys(INJURY_KIND) as InjuryKind[]) { of(k); expect(Boolean(trainingRefusal(sim.player, sim.now))).toBe(INJURY_KIND[k].limits !== 'none'); }
  });

  it('takes the injury factor once off the body’s dimensions of movement work, and leaves its interpretation and a written analysis be', () => {
    const sim = life('reach-move');
    const well = dims(judged(sim, 'movement', { readiness: 90 }));
    const sprained = dims(judged(sim, 'movement', { readiness: 90, injured: true }));
    expect(sprained.interpretation).toBe(well.interpretation);
    expect(sprained.execution).toBeLessThan(well.execution!);
    expect(sprained.consistency).toBeLessThan(well.consistency!);
    expect(dims(judged(sim, 'written', { readiness: 90, injured: true }))).toEqual(dims(judged(sim, 'written', { readiness: 90 })));
  });

  it('takes a concussion off every dimension, once, even a written analysis', () => {
    const sim = life('reach-mind');
    const well = judged(sim, 'written', { readiness: 90 });
    const concussed = judged(sim, 'written', { readiness: 90, concussed: true });
    for (const d of concussed.dimensions) {
      expect(d.condition).toBeCloseTo(EVALUATION.injury, 9);
      expect(d.quality).toBeLessThan(well.dimensions.find((x) => x.dimension === d.dimension)!.quality);
    }
    // Both set, the concussion stands in for the body's injury: never the factor twice.
    for (const d of judged(sim, 'movement', { readiness: 90, injured: true, concussed: true }).dimensions) expect(d.condition).toBeGreaterThanOrEqual(EVALUATION.injury - 1e-9);
  });
});

describe('the flu', () => {
  it('reaches the body’s work, not only the voice’s, and not a written analysis', () => {
    const sim = life('reach-flu');
    for (const task of ['movement', 'partnered', 'voice', 'song']) {
      const well = dims(judged(sim, task, { readiness: 90 }));
      const ill = dims(judged(sim, task, { readiness: 90, ill: true }));
      expect(ill.execution).toBeLessThan(well.execution!);
    }
    expect(dims(judged(sim, 'written', { readiness: 90, ill: true }))).toEqual(dims(judged(sim, 'written', { readiness: 90 })));
  });
});

describe('a day called in sick', () => {
  it('is excused with an injury that limits the work, and not with a cut', () => {
    const sim = life('reach-sick');
    play(sim, at(2026, 9, 1, 8));
    sim.player.wellbeing.condition = ESTIMATE.sickBelow + 20;
    hurt(sim, 'cut');
    expect(sim.execute({ kind: 'school.call_in_sick', payload: {} }).error).toMatch(/well enough to go/);
    hurt(sim, 'sprain');
    expect(sim.execute({ kind: 'school.call_in_sick', payload: {} }).ok).toBe(true);
  });
});
