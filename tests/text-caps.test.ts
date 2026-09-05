/**
 * The text caps rule, held in the gate.
 *
 * Two tools sweep for this — one over the source, one through a real browser
 * at five widths — but neither runs in CI. What is checked here is the part
 * that can be checked from the engine alone: every label the interface reads
 * out of a registry starts each word with a capital, and the helpers that
 * build a label at runtime do the same.
 *
 * A label is a fragment: a name, a chip, a heading, a button. Prose is not,
 * and is deliberately left in sentence case with its punctuation.
 */

import { describe, expect, it } from 'vitest';
import { categoryLabel, readsAsProse, titleCaseLabel } from '@/engine/core/text';
import { CONSTRUCTION_PHASES, DESIGN_THEMES, PROPERTY_PROFILES } from '@/engine/systems/property';
import { ACTIVITIES } from '@/engine/systems/life';
import { INTERACTIONS } from '@/engine/systems/relationships';

/**
 * Words spelled the way the world spells them, which Title Case must not
 * touch: an acronym, a mixed-case name, anything led by a digit.
 */
function lowercaseWordsIn(label: string): string[] {
  return label.split(/\s+/).filter((word) => {
    const cleaned = word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
    if (!cleaned) return false;
    const first = cleaned[0] as string;
    if (!/\p{L}/u.test(first)) return false;
    if (/\p{Lu}/u.test(cleaned)) return false;
    return /\p{Ll}/u.test(first);
  });
}

describe('labels read out of the registries', () => {
  it('title cases every property feature', () => {
    for (const [kind, spec] of Object.entries(PROPERTY_PROFILES)) {
      for (const feature of spec.features) {
        expect(lowercaseWordsIn(feature), `${kind}: "${feature}"`).toEqual([]);
      }
    }
  });

  it('title cases every design theme, palette and material', () => {
    for (const theme of DESIGN_THEMES) {
      expect(lowercaseWordsIn(theme.name), `"${theme.name}"`).toEqual([]);
      for (const colour of theme.palette) {
        expect(lowercaseWordsIn(colour), `${theme.id} palette: "${colour}"`).toEqual([]);
      }
      for (const material of theme.materials) {
        expect(lowercaseWordsIn(material), `${theme.id} materials: "${material}"`).toEqual([]);
      }
    }
  });

  it('title cases every construction phase', () => {
    for (const phase of CONSTRUCTION_PHASES) {
      expect(lowercaseWordsIn(phase.name), `"${phase.name}"`).toEqual([]);
    }
  });

  it('title cases every activity name', () => {
    for (const activity of ACTIVITIES) {
      expect(lowercaseWordsIn(activity.name), `"${activity.name}"`).toEqual([]);
    }
  });

  it('title cases every interaction name', () => {
    for (const [id, interaction] of Object.entries(INTERACTIONS)) {
      expect(lowercaseWordsIn(interaction.name), `${id}: "${interaction.name}"`).toEqual([]);
    }
  });
});

describe('labels built at runtime', () => {
  it('gives every shopping category a Title Case label', () => {
    const categories = ['groceries', 'clothing', 'footwear', 'watch', 'jewelry',
      'furniture', 'appliance', 'electronics', 'art', 'prepared_food', 'accessory'];
    for (const category of categories) {
      const label = categoryLabel(category);
      expect(lowercaseWordsIn(label), `${category} -> "${label}"`).toEqual([]);
      expect(label).not.toContain('_');
    }
  });

  it('spells jewellery the way the rest of the game spells it', () => {
    // The stored key is American because the catalogue was written that way.
    // What reaches the screen must match the prose around it.
    expect(categoryLabel('jewelry')).toBe('Jewellery');
  });

  it('falls back to Title Case for a category it has never seen', () => {
    expect(categoryLabel('musical_instrument')).toBe('Musical Instrument');
  });

  it('leaves a sentence alone', () => {
    const sentence = 'You said something true and they heard it.';
    expect(readsAsProse(sentence)).toBe(true);
    expect(titleCaseLabel(sentence)).toBe(sentence);
  });

  it('capitalises a duration used inside a button label', () => {
    expect(titleCaseLabel('58 minutes')).toBe('58 Minutes');
    expect(titleCaseLabel('1 hour')).toBe('1 Hour');
    expect(titleCaseLabel('2h 40m')).toBe('2h 40m');
  });
});
