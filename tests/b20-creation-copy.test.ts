/**
 * Brief 20, the creation area: what Dispositions & Traits says the traits change, held to what they declare. The page's
 * list of what the traits move names three of them by name for what food costs and what a meal lifts: each trait it
 * names for an effect declares that effect's knob (`systemMods`), and every trait that declares it is named.
 *
 * Found by this brief (D1, a notice describing behavior that isn't there): until 2026-10-21 the line said Frugal,
 * Spender and Generous each changed "what your food costs and how much a meal lifts you", and Generous declares no
 * `mealMood`: a generous student's meal lifts them exactly as a plain twin's does (tests/b20-creation-personality.test.ts
 * plays Generous by what the meal costs, which it does move).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { PERSONALITY_TRAITS, type PersonalityKnob } from '@/engine/content/personality-traits';

const SOURCE = readFileSync(new URL('../src/ui/creation/CharacterCreation.tsx', import.meta.url), 'utf8');
/** The Traits card's list item that names traits by name, as the player reads it. */
const line = (): string => {
  const items = [...SOURCE.slice(SOURCE.indexOf('<h2>Traits</h2>')).matchAll(/<li>([^<]*)<\/li>/g)].map((m) => m[1]!);
  const named = items.find((x) => PERSONALITY_TRAITS.some((t) => x.includes(t.name)));
  expect(named, 'a list item naming traits on the Traits card').toBeDefined();
  return named!;
};
/** The traits a claim in the line is said of: the names after the nearest "for " before it. */
function namedFor(text: string, claim: string): string[] {
  const at = text.indexOf(claim);
  expect(at, claim).toBeGreaterThan(-1);
  const from = text.lastIndexOf('for ', at);
  const group = text.slice(from + 4, at).replace(/,?\s*(what your food costs,? and)?\s*$/, '');
  return group.split(/, | and /).map((x) => x.trim()).filter(Boolean);
}

describe('what Dispositions & Traits says the money traits change', () => {
  const CLAIMS: [string, PersonalityKnob][] = [['what your food costs', 'spending'], ['how much a meal lifts you', 'mealMood']];

  it('names for each effect exactly the traits that declare its knob', () => {
    const text = line();
    for (const [claim, knob] of CLAIMS) {
      const said = namedFor(text, claim).sort();
      const declare = PERSONALITY_TRAITS.filter((t) => t.systemMods?.[knob] !== undefined).map((t) => t.name).sort();
      expect(said, `${claim} (${knob})`).toEqual(declare);
    }
  });
});
