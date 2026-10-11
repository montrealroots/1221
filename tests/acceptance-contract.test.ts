/**
 * The attribute and genre contract, from the player's side (acceptance pass, 2026-10-11): what a preference, a full
 * craft and perfect work do and don't do. The rest of the contract is in tests/engine-properties.test.ts (bounds,
 * monotonicity, mastery at exactly 100) and tests/material.test.ts (familiarity speeds preparation, never quality; an
 * ability nothing reads changes nothing).
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { evaluate, type EvalContext } from '@/engine/systems/evaluation';
import { lovedInWork } from '@/engine/systems/enjoyment';
import { castScore, evenCraft, partsFor } from '@/engine/systems/school';
import { TASK_PROFILES } from '@/engine/content/tasks';
import { materialContext } from '@/engine/systems/material';
import { MATERIAL_BY_ID } from '@/engine/content/material';

const life = (seed: string, genres: string[] = []) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', genres });

const sceneOf = (materialId: string): EvalContext => {
  const task = TASK_PROFILES.scene!;
  const m = MATERIAL_BY_ID[materialId]!;
  const read = materialContext(task, m);
  const parts = [...new Set(Object.values(task.dims).flatMap((d) => d!.prep ?? []))];
  return { task, techniques: { scene: 2, ...(m.techniques ?? {}) }, prep: Object.fromEntries(parts.map((p) => [p, 1])), required: Object.fromEntries(parts.map((p) => [p, 0.9])), difficulty: 0.3, condition: { readiness: 85 }, key: `contract:${materialId}`, lean: read.lean, inputs: read.inputs };
};

describe('a preferred genre', () => {
  it('is enjoyed, not expertise: the same student plays a comedy no better for loving comedy', () => {
    const loves = life('contract-genre', ['comedy']);
    const doesnt = life('contract-genre', []);
    expect(loves.player.genres).toEqual(['comedy']);
    // The same draws, the same craft: only the preference differs.
    expect(JSON.stringify(loves.player.craft)).toBe(JSON.stringify(doesnt.player.craft));
    const ctx = sceneOf('earnest-2');
    expect(evaluate(loves, loves.player, ctx).overall).toBe(evaluate(doesnt, doesnt.player, ctx).overall);
    // What it does: a day of a loved kind of play is enjoyed.
    expect(lovedInWork(loves.player, { genres: ['comedy'] })).toEqual(['comedy']);
    expect(lovedInWork(doesnt.player, { genres: ['comedy'] })).toEqual([]);
  });
});

describe('perfect work and a part', () => {
  it('doesn’t guarantee the lead: two equally full actors, the one who led last time takes the other part', () => {
    const craft = evenCraft(100);
    const reads = { scene: 2, classical: 1 } as const;
    const students = [
      { i: 0, name: 'Last Lead', craft, title: 'actress' as const, last: { size: 'lead' as const, delivery: 1 } },
      { i: 1, name: 'Not Last Time', craft, title: 'actress' as const, last: { size: 'supporting' as const, delivery: 1 } },
    ];
    expect(castScore(students[0]!, reads)).toBeLessThan(castScore(students[1]!, reads));
    const given = partsFor(students, [{ name: 'The Lead', size: 'lead', for: 'actress' }, { name: 'The Friend', size: 'supporting', for: 'actress' }] as never, reads);
    expect(given.find((g) => g.s.name === 'Not Last Time')!.size).toBe('lead');
    expect(given.find((g) => g.s.name === 'Last Lead')!.size).toBe('supporting');
  });
});
