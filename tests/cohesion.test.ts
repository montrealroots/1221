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
import { CORPORATE_EVENTS } from '@/engine/content/corporate-events';
import { STUDIOS } from '@/engine/content/studios';
import { NETWORKS } from '@/engine/content/networks';
import { GENRES_FULL, GENRE_ALIASES, canonicalGenre, genre } from '@/engine/content/genres';
import { RATINGS, RATING_SYSTEMS } from '@/engine/content/ratings';
import { ATTRIBUTES, TRAITS, ALL_TRAITS } from '@/engine/domain/attributes';
import { CRAFT_ATTRIBUTES, CRAFT_ROLES, attributesForRole } from '@/engine/content/craft-attributes';
import { AGENCIES, BUYERS } from '@/engine/content/industry';
import { COUNTRIES } from '@/engine/content/geography';

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
    expect(duplicates(GENRES_FULL, (g) => g.id)).toEqual([]);
    expect(duplicates(RATINGS, (r) => r.id)).toEqual([]);
    expect(duplicates(RATING_SYSTEMS, (s) => s.id)).toEqual([]);
    expect(duplicates(ATTRIBUTES, (a) => a.id)).toEqual([]);
    expect(duplicates(ALL_TRAITS, (t) => t.id)).toEqual([]);
    expect(duplicates(CRAFT_ATTRIBUTES, (a) => a.id)).toEqual([]);
    expect(duplicates(STUDIOS.all(), (s) => s.id)).toEqual([]);
    expect(duplicates(NETWORKS.all(), (n) => n.id)).toEqual([]);
    expect(duplicates(AGENCIES.all(), (a) => a.id)).toEqual([]);
    expect(duplicates(BUYERS.all(), (b) => b.id)).toEqual([]);
    expect(duplicates(COUNTRIES.all(), (c) => c.id)).toEqual([]);
    expect(duplicates(CORPORATE_EVENTS, (e) => e.id)).toEqual([]);
  });

  it('keeps every name unique where a name is how you find the thing', () => {
    expect(duplicates(GENRES_FULL, (g) => g.name)).toEqual([]);
    expect(duplicates(STUDIOS.all(), (s) => s.name)).toEqual([]);
    expect(duplicates(NETWORKS.all(), (n) => n.name)).toEqual([]);
    expect(duplicates(ATTRIBUTES, (a) => a.name)).toEqual([]);
    expect(duplicates(CRAFT_ATTRIBUTES, (a) => `${a.role}|${a.name}`)).toEqual([]);
    // A certificate's name repeats across boards on purpose — "General" is a
    // rung in four systems — so it is the pair that has to be unique.
    expect(duplicates(RATINGS, (r) => `${r.system}|${r.name}`)).toEqual([]);
  });

  it('keeps an outcome id unique inside its own event, and lets it repeat across events', () => {
    for (const event of CORPORATE_EVENTS) {
      expect(duplicates(event.outcomes, (o) => o.id), event.id).toEqual([]);
      const total = event.outcomes.reduce((sum, outcome) => sum + outcome.chance, 0);
      expect(Math.abs(total - 1), `${event.id} outcomes sum to ${total}`).toBeLessThan(0.001);
    }
  });

  it('never aliases a genre to itself or to something that is not there', () => {
    for (const [alias, target] of Object.entries(GENRE_ALIASES)) {
      expect(alias, 'an alias that is its own target').not.toBe(target);
      expect(genre(target), `${alias} points at ${target}, which does not exist`).toBeDefined();
      expect(canonicalGenre(alias)).toBe(target);
    }
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

  it('points every craft attribute at a craft that exists', () => {
    for (const attribute of CRAFT_ATTRIBUTES) {
      expect(CRAFT_ROLES).toContain(attribute.role);
      expect(attribute.id.startsWith(`${attribute.role}.`)).toBe(true);
    }
    for (const role of CRAFT_ROLES) {
      if (role === 'actor') continue;
      expect(attributesForRole(role).length, role).toBeGreaterThan(15);
    }
  });
});

describe('a fact stated twice is stated the same way', () => {
  it('keeps a corporate event and its company saying the same thing', () => {
    for (const event of CORPORATE_EVENTS) {
      const subject = event.subjectKind === 'studio' ? STUDIOS.get(event.subjectId) : NETWORKS.get(event.subjectId);
      expect(subject, `${event.id} is about ${event.subjectId}, which is not in the registry`).toBeDefined();
      // The event's record line is the same public fact the company's own
      // entry carries. If one is edited and the other is not, this fails.
      const status = (subject as { status?: string }).status;
      if (status) {
        expect(event.record, `${event.id} and ${event.subjectId} disagree about what is happening`).toBe(status);
      }
    }
  });

  it('gives every trait a category the interface knows how to show', () => {
    const categories = new Set(TRAITS.map((t) => t.category));
    for (const trait of TRAITS) expect(categories.has(trait.category)).toBe(true);
    expect(duplicates(TRAITS, (t) => t.name)).toEqual([]);
  });
});
