/**
 * Matched simulations of the evaluation (from 2026-10-09): the same life at
 * low, middle, high and full ability, every task profile, forty draws each,
 * in three states (rested and prepared, half prepared, spent), so what moves
 * the result is only the level. Run: npx vite-node tools/matched.ts
 */

import { createSave } from '../src/engine';
import { newLifeConfig } from '../src/engine/world/bootstrap';
import { evaluate } from '../src/engine/systems/evaluation';
import { abilityFull } from '../src/engine/systems/attributes';
import { evenCraft } from '../src/engine/systems/school';
import { TASK_PROFILES } from '../src/engine/content/tasks';
import { MASTERED } from '../src/engine/content/abilities';

const sim = createSave(1, 'matched', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const p = sim.player;
const LEVELS = [['low', 30], ['middle', 55], ['high', 80], ['full', 100]] as const;
const STATES = [['rested, prepared', 1, 85], ['half prepared', 0.5, 85], ['spent', 1, 20]] as const;

const rows: string[] = ['| Task | State | Low (30) | Middle (55) | High (80) | Full (100) |', '| --- | --- | --- | --- | --- | --- |'];
for (const task of Object.values(TASK_PROFILES)) {
  const parts = [...new Set(Object.values(task.dims).flatMap((d) => d!.prep ?? []))];
  for (const [state, share, readiness] of STATES) {
    const cells: string[] = [];
    for (const [, level] of LEVELS) {
      p.craft = evenCraft((level / 100) * MASTERED);
      for (const k of ['emotion', 'memorization', 'voice', 'movement'] as const) p.craft[k] = level;
      p.attrs = { presence: level, composure: level, listening: level, imagination: level, focus: level, adaptability: level, discipline: level };
      p.wellbeing.fitness = (level / 100) * abilityFull(sim, p, 'stamina');
      const results = Array.from({ length: 40 }, (_, n) => evaluate(sim, p, {
        task, techniques: { scene: 2, character: 1 }, prep: Object.fromEntries(parts.map((k) => [k, 0.9 * share])), required: Object.fromEntries(parts.map((k) => [k, 0.9])),
        difficulty: 0.2, condition: { readiness }, key: `m:${task.id}:${state}:${level}:${n}`,
      }).overall);
      const mean = results.reduce((a, b) => a + b, 0) / results.length;
      cells.push(`${mean.toFixed(1)} (${Math.min(...results).toFixed(1)}–${Math.max(...results).toFixed(1)})`);
    }
    rows.push(`| ${task.label} | ${state} | ${cells.join(' | ')} |`);
  }
}
console.log(rows.join('\n'));
