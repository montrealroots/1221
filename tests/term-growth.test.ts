/**
 * Growth at the term's evaluation, measured against the room there was (from 2026-10-12; `termGrowth`,
 * `systems/school.ts`).
 *
 * The completeness critic of 2026-10-12 measured two wrong readings, both from the room's floor of 0.01:
 * - a student at every skill's ceiling who grew nothing was judged behind the class, and stepped toward dismissal;
 * - one a hair under it who grew 0.3 was judged ahead, the token gain multiplied a hundredfold.
 * A student at the reach has met the growth the term asks; and the room a growth is divided by is never under
 * `ROOM_LEAST`.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { ROOM_LEAST, meanCraft, termGrowth } from '@/engine/systems/school';

const life = () => createSave(1, 'term-growth', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });

/** TEST SETUP: the student's craft at a level, its ceiling at another, the term begun there; the class grown by 2. */
function at(level: number, ceiling: number, grew: number) {
  const sim = life();
  const p = sim.player;
  const school = p.school!;
  for (const k of Object.keys(p.craft!)) { (p.craft as Record<string, number>)[k] = level + grew; (p.craftCeiling as Record<string, number>)[k] = ceiling; (school.tally.craftAtStart as Record<string, number>)[k] = level; }
  school.classmates.forEach((m, i) => { const start = meanCraft(m.craft); school.tally.classAtStart[i] = start; const c = m.craft as unknown as Record<string, number>; for (const k of Object.keys(c)) c[k] = (c[k] ?? 0) + 2; });
  return termGrowth(p);
}

describe('growth against the room there was', () => {
  it('doesn’t judge a student at the ceiling behind for growing nothing', () => {
    const r = at(100, 100, 0);
    expect(r.grewTooLittle).toBe(false);
    expect(r.pace).toBe('in line with');
  });

  it('doesn’t multiply a token gain a hair under the ceiling into a lead', () => {
    const r = at(99.8, 100, 0.1);
    expect(r.pace).not.toBe('ahead of');
  });

  it('still judges a student with room who grew nothing behind', () => {
    const r = at(40, 100, 0);
    expect(r.grewTooLittle).toBe(true);
    expect(r.pace).toBe('behind');
    expect(ROOM_LEAST).toBeGreaterThan(0.01);
  });
});
