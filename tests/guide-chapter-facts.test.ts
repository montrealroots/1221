/**
 * What the guide's chapters say, held to what the game does (from 2026-10-19, brief 15's tutorial area). Each case is a
 * sentence the second editorial pass found saying something the game doesn't do: the game’s behavior measured, then
 * the chapter's sentence read against it, so a rewrite that brings the old claim back fails here.
 *
 * - How You Are said condition came "after illness, injury and rest", though an injury takes stress and morale and
 *   leaves condition where it was (`mayHurt`, `systems/injury.ts`), as `docs/GLOSSARY.md`'s condition row has said
 *   since 2026-10-17.
 * - Cover, Benefits And Returns said "To see a doctor, choose a practice under Your Doctor on Health Cover, then press
 *   Book An Appointment", though the button books only a visit owed (one missed or called off): with none owed,
 *   `health.book` refuses, and Health Cover doesn't show it. The game books a visit itself when an illness or a
 *   condition's review calls for one (`systems/health.ts`), as How This Works' doctor entry says.
 */
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { CHAPTER_BY_ID } from '@/engine/content/tutorial';
import { injuryOf, mayHurt } from '@/engine/systems/injury';

/** A chapter's sentences, its body and its details, the asides in brackets left out. */
function sentences(id: string): string[] {
  const c = CHAPTER_BY_ID[id]!;
  return [...c.body, ...(c.more ?? [])].join(' ').replace(/\s*\([^)]*\)/g, '').split(/(?<=[.!?])\s+/);
}

describe('How You Are on what wears condition down', () => {
  /** A new life hurt on a run: what the injury did to condition, stress and morale. */
  function hurt() {
    const sim = quickSave({}, 'guide-facts-injury');
    const w = sim.player.wellbeing;
    const before = { condition: w.condition, stress: w.stress, morale: w.morale };
    const injury = mayHurt(sim, sim.player, 'run', 1, sim.now);
    expect(injury).toBeDefined();
    expect(injuryOf(sim.player, sim.now)).toBeDefined();
    return { before, after: { condition: w.condition, stress: w.stress, morale: w.morale } };
  }

  it('an injury moves stress and morale and leaves condition as it was', () => {
    const { before, after } = hurt();
    expect(after.condition).toBe(before.condition);
    expect(after.stress).toBeGreaterThan(before.stress);
    expect(after.morale).toBeLessThan(before.morale);
  });

  it('names no injury among what wears condition down', () => {
    const { before, after } = hurt();
    const said = sentences('body').filter((s) => /\bCondition is\b|\bwears? (it|condition) down\b|\bcondition (falls|drops)\b/i.test(s));
    expect(said.length).toBeGreaterThan(0);
    // Only while an injury leaves condition where it was: change that, and the chapter may say it.
    if (after.condition === before.condition) for (const s of said) expect(s).not.toMatch(/\binjur/i);
  });
});

describe('Cover, Benefits And Returns on Book An Appointment', () => {
  /** A new life with no visit owed, asking to book one. */
  function bookUnowed() {
    const sim = quickSave({}, 'guide-facts-book');
    expect(sim.player.health?.owedVisit).toBeUndefined();
    return sim.execute({ kind: 'health.book', payload: {} });
  }

  it('books only a visit owed: with none, it’s refused and nothing is booked', () => {
    const r = bookUnowed();
    expect(r.ok).toBe(false);
    expect(r.error).toBe('There’s nothing to see a doctor about.');
  });

  it('is said to book again a visit missed or called off, not any visit you want', () => {
    const refused = !bookUnowed().ok;
    const said = sentences('papers').filter((s) => /\bBook An Appointment\b/.test(s));
    expect(said.length).toBeGreaterThan(0);
    // Only while an unowed booking is refused: change that, and the chapter may offer it freely.
    if (refused) for (const s of said) expect(s).toMatch(/\b(miss(ed)?|again|owed|call(ed)? (it )?off)\b/i);
  });
});
