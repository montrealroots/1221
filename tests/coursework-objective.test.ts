/**
 * What a piece of coursework puts first weighs in its result (from 2026-10-12; `workContext`, `systems/coursework.ts`).
 *
 * Measured by the coursework reading of 2026-10-12: the same work under the lines, circumstances and listening
 * objectives scored 40.3 every time, while the screen said the objective's part "weighs more in this showing". Now the
 * dimensions that read the part put first lean by `LEARNING.objectiveWeight`, normalized, so:
 * - the same preparation under two objectives comes out differently, and better under the one its strength is in;
 * - "Put It First" does the same for the part it names;
 * - at mastery it's 100 whatever is put first.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { abilityFull, attributesOf } from '@/engine/systems/attributes';
import { courseworkOf, judgeWork, questionsFor, type Assignment } from '@/engine/systems/coursework';
import { PREP_DIMS } from '@/engine/content/coursework';

const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });

let made = 0;
function scene(sim: Simulation, prep: Partial<Record<string, number>>, over: Partial<Assignment> = {}): Assignment {
  const a: Assignment = {
    id: `obj-${(made += 1)}`, course: 'DRAM 103a/b', template: 'scene-study', term: 1, setOn: '2026-09-07', dueOn: '2026-09-21', sceneId: 'seagull-4', role: 0, partner: 0,
    prep: { ...Object.fromEntries(PREP_DIMS.map((d) => [d, 0.6])), ...prep } as Assignment['prep'], answers: {}, steps: {}, practicedOn: {}, trained: 0, rehearsals: [], status: 'open', ...over,
  };
  for (const { q, options } of questionsFor(a)) a.answers[q.id] = options.find((o) => o.supported)!.id as never;
  courseworkOf(sim, sim.player)!.assignments.push(a);
  return a;
}
// Every piece compared is judged under the same draw key (from 2026-10-12: until then each was keyed by a random id,
// so a comparison carried two different draws and failed about two runs in three), so only what the test varies moves.
const judged = (sim: Simulation, a: Assignment) => judgeWork(sim, sim.player, a, '2026-09-21', sim.now, 'obj:compared').overall;

describe('what the work puts first', () => {
  it('changes the result: the same preparation, better under the objective its strength is in', () => {
    const sim = life('objective-weighs');
    sim.player.wellbeing.energy = 90;
    // Lines learned to the full, everything else middling.
    const strongLines = { memorization: 1 };
    const lines = judged(sim, scene(sim, strongLines, { objective: 'lines' }));
    const circumstances = judged(sim, scene(sim, strongLines, { objective: 'circumstances' }));
    expect(lines).not.toBe(circumstances);
    expect(lines).toBeGreaterThan(circumstances);
  });

  it('weighs a part put first by the approach the same way', () => {
    const sim = life('objective-approach');
    sim.player.wellbeing.energy = 90;
    const none = judged(sim, scene(sim, { memorization: 1 }));
    const first = judged(sim, scene(sim, { memorization: 1 }, { approach: { key: 'dim:memorization', dim: 'memorization', kind: 'objective', on: '2026-09-08' } }));
    expect(first).toBeGreaterThan(none);
  });

  it('is 100 at mastery whatever is put first', () => {
    const sim = life('objective-mastery');
    const p = sim.player;
    for (const k of Object.keys(p.craft!)) (p.craft as Record<string, number>)[k] = 100;
    const a = attributesOf(sim, p) as unknown as Record<string, number>;
    for (const k of Object.keys(a)) a[k] = 100;
    p.wellbeing.fitness = abilityFull(sim, p, 'stamina');
    p.wellbeing.energy = 90;
    for (const objective of ['lines', 'circumstances', 'choices', 'shape', 'listening'] as const) {
      expect(judged(sim, scene(sim, Object.fromEntries(PREP_DIMS.map((d) => [d, 1])), { objective })), objective).toBe(100);
    }
  });
});
