/**
 * The checks that keep the game one thing rather than several.
 *
 * Every registry, every command, every piece of scheduled work and every
 * cross-reference between them. These are the faults that do not announce
 * themselves: an id defined twice so the second one silently wins, a button
 * that calls a command nobody wrote, work scheduled that nothing does, a fact
 * stated in two files that drift apart the first time one is edited.
 */

import { readdirSync, readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { ATTRIBUTES, TRAITS, ALL_TRAITS } from '@/engine/domain/attributes';
import { COUNTRIES } from '@/engine/content/geography';
import { ageOnDate } from '@/engine/core/time';
import { MINIMUM_AGE } from '@/ui/creation/CharacterCreation';

/** Every source file in a directory, joined, so a check can ask about the whole of it. */
function globSource(directory: string): string {
  return readdirSync(directory)
    .filter((file) => file.endsWith('.ts'))
    .map((file) => readFileSync(`${directory}/${file}`, 'utf8'))
    .join('\n');
}

/** Reports the ids that appear more than once. */
function duplicates<T>(items: readonly T[], key: (item: T) => string): string[] {
  const seen = new Map<string, number>();
  for (const item of items) seen.set(key(item), (seen.get(key(item)) ?? 0) + 1);
  return [...seen.entries()].filter(([, n]) => n > 1).map(([id]) => id);
}

describe('nothing is defined twice', () => {
  it('keeps every registry id unique', () => {
    expect(duplicates(ATTRIBUTES, (a) => a.id)).toEqual([]);
    expect(duplicates(ALL_TRAITS, (t) => t.id)).toEqual([]);
    expect(duplicates(COUNTRIES.all(), (c) => c.id)).toEqual([]);
  });

  it('keeps every name unique where a name is how you find the thing', () => {
    expect(duplicates(ATTRIBUTES, (a) => a.name)).toEqual([]);
    // A certificate's name repeats across boards on purpose — "General" is a
    // rung in four systems — so it is the pair that has to be unique.
  });


});

describe('everything is wired to something', () => {
  const sim = quickSave({}, 'cohesion');

  it('has a handler for every kind of work it schedules', () => {
    const handled = new Set(sim.scheduleKinds());
    const missing = new Set<string>();
    for (const item of sim.universe.scheduled) {
      if (!handled.has(item.kind)) missing.add(item.kind);
    }
    expect([...missing], 'work is on the clock that nothing knows how to do').toEqual([]);
  });

  it('schedules every kind of work it has a handler for', () => {
    // A handler nothing ever schedules is dead code that looks alive. Whether
    // a particular save happens to reach it is beside the point, so this asks
    // the source: is this kind ever put on the clock anywhere at all?
    const source = readFileSync('src/engine/index.ts', 'utf8')
      + globSource('src/engine/systems')
      + globSource('src/engine/world');
    const dead = sim.scheduleKinds().filter((kind) => {
      const scheduled = new RegExp(`kind: '${kind.replace('.', '\\.')}'`);
      return !scheduled.test(source);
    });
    expect(dead, 'handlers that nothing anywhere schedules').toEqual([]);
  });

  it('accepts every command the interface can ask for', () => {
    const commands = new Set(sim.commandKinds());
    // The list the interface uses, gathered from the decision actions the
    // engine itself raises: those are the ones a button will call.
    for (const decision of Object.values(sim.universe.decisions)) {
      for (const action of decision.actions ?? []) {
        expect(commands.has(action.commandKind), `a decision offers '${action.commandKind}', which no system handles`).toBe(true);
      }
    }
  });

});

describe('a fact stated twice is stated the same way', () => {

  it('gives every trait a category the interface knows how to show', () => {
    const categories = new Set(TRAITS.map((t) => t.category));
    for (const trait of TRAITS) expect(categories.has(trait.category)).toBe(true);
    expect(duplicates(TRAITS, (t) => t.name)).toEqual([]);
  });
});

describe('the age a save can begin at', () => {
  const source = readFileSync('src/ui/creation/CharacterCreation.tsx', 'utf8');

  it('will not start a save on somebody under eighteen', () => {
    expect(MINIMUM_AGE).toBe(18);

    const start = { year: 2026, month: 3, day: 2 };
    // The last birthday that clears it, and the first that does not.
    expect(ageOnDate({ year: 2008, month: 3, day: 2 }, start)).toBe(18);
    expect(ageOnDate({ year: 2008, month: 3, day: 3 }, start)).toBe(17);
  });

  it('stops the year picker at the last year that could be old enough', () => {
    // A 2008 birthday can still land short of it, which is why the age itself
    // is checked as well; the picker's job is to stop the obvious mistake.
    expect(source).toContain('max={config.startYear - MINIMUM_AGE}');
    expect(source).not.toMatch(/max=\{config\.startYear - \d/);
  });

  it('states the rule once, so the picker and the check cannot disagree', () => {
    const literals = source.match(/\bage < \d+\b/g) ?? [];
    expect(literals).toEqual([]);
    expect(source).toContain('if (age < MINIMUM_AGE)');
  });
});
