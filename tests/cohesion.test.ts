/**
 * The checks that keep the game one thing rather than several.
 *
 * Every registry, every command, every piece of scheduled work and every
 * cross-reference between them. These are the faults that do not announce
 * themselves: an id defined twice so the second one silently wins, a button
 * that calls a command nobody wrote, work scheduled that nothing does, a fact
 * stated in two files that drift apart the first time one is edited.
 */

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { COUNTRIES } from '@/engine/content/geography';
import { ageOnDate } from '@/engine/core/time';
import { createSave, defaultConfig, quickSave } from '@/engine';
import type { Person } from '@/engine/domain/model';
import { applyLookingAfter, freshWellbeing } from '@/engine/systems/life';
import { defaultPersonality } from '@/engine/systems/personality';
import { describeEthnicity } from '@/engine/content/ethnicity';
import {
  CRAFT_INTERESTS, FILM_GENRES, GENERAL_INTERESTS, isAlphabetical,
} from '@/engine/content/interests';
import { BIRTH_YEARS_BEFORE_START, latestBirthYear } from '@/ui/creation/CharacterCreation';

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
    expect(duplicates(COUNTRIES.all(), (c) => c.id)).toEqual([]);
    expect(duplicates([...CRAFT_INTERESTS, ...GENERAL_INTERESTS], (one) => one.id)).toEqual([]);
    expect(duplicates(FILM_GENRES, (one) => one.id)).toEqual([]);
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
    // A kind is often a named constant rather than a literal, because the
    // interface needs to name it too — `kind: PLAN_KIND`, not `kind:
    // 'life.commitment'`. Reading only for literals called that dead, which
    // is exactly backwards: a kind shared with the interface is the least
    // dead thing in the file.
    const named = new Map<string, string>();
    for (const m of source.matchAll(/const ([A-Z][A-Z0-9_]*) = '([a-z0-9_]+\.[a-z0-9_]+)'/g)) {
      named.set(m[2]!, m[1]!);
    }
    const dead = sim.scheduleKinds().filter((kind) => {
      const escaped = kind.replace('.', '\\.');
      const asLiteral = new RegExp(`kind: '${escaped}'`);
      const constant = named.get(kind);
      const asConstant = constant ? new RegExp(`kind: ${constant}\\b`) : undefined;
      return !asLiteral.test(source) && !(asConstant?.test(source) ?? false);
    });
    expect(dead, 'handlers that nothing anywhere schedules').toEqual([]);
  });

  it('accepts every command a decision offers a button for', () => {
    // Asked of the source, and not of a booted save's `decisions` table,
    // which is `{}` at boot: walking it would pass for any program anybody
    // could write.
    //
    // The source holds every action any decision can ever carry. Nothing in
    // this build raises a decision — the one raiser went with the family's
    // pictures — so the empty case is stated rather than passed through: the
    // day a raiser comes back, this has to find what it offers or fail.
    const source = readFileSync('src/engine/index.ts', 'utf8')
      + globSource('src/engine/systems')
      + globSource('src/engine/world');
    const offered = [...source.matchAll(/commandKind: '([a-z0-9_]+\.[a-z0-9_]+)'/g)].map((m) => m[1]!);
    const raisers = [...source.matchAll(/requireDecision\(/g)].length;
    if (raisers === 0) {
      expect(offered, 'an action is offered with nothing raising a decision to carry it').toEqual([]);
      return;
    }
    expect(offered.length, 'a decision is raised and this finds nothing it offers').toBeGreaterThan(0);

    const commands = new Set(sim.commandKinds());
    for (const kind of new Set(offered)) {
      expect(commands.has(kind), `a decision offers '${kind}', which no system handles`).toBe(true);
    }
  });

});

describe('the year a character can be born in', () => {
  const source = readFileSync('src/ui/creation/CharacterCreation.tsx', 'utf8');

  it('stops at eighteen years before the save begins', () => {
    expect(BIRTH_YEARS_BEFORE_START).toBe(18);
    expect(latestBirthYear(2026)).toBe(2008);
  });

  it('lets a birthday at the cap open the save at seventeen', () => {
    const start = { year: 2026, month: 3, day: 2 };
    // 2008 is allowed, and a June birthday in 2008 is seventeen in March.
    // The rule is the year, so this is a life the game will run.
    expect(ageOnDate({ year: 2008, month: 6, day: 14 }, start)).toBe(17);
    expect(ageOnDate({ year: 2008, month: 3, day: 2 }, start)).toBe(18);
  });

  it('checks the year rather than the age, so the picker and the rule agree', () => {
    expect(source).toContain('max={latestBirthYear(config.startYear)}');
    expect(source).toContain('config.birthYear > latestBirthYear(config.startYear)');
    // No age floor anywhere: it would contradict the year the picker allows.
    expect(source.match(/\bage < \d+\b/g) ?? []).toEqual([]);
  });
});

describe('race and ethnicity on the character sheet', () => {
  it('lets somebody be more than one of them', () => {
    const sim = createSave(1, 'ethnicity-many', {
      ...defaultConfig(), raceEthnicity: ['black', 'hispanic'],
    });
    expect(sim.universe.people[sim.universe.playerId]!.raceEthnicity).toEqual(['black', 'hispanic']);
    expect(describeEthnicity(['black', 'hispanic'], undefined)).toBe('Black Or African, Hispanic Or Latino');
  });

  it('takes it in their own words when the list does not have it', () => {
    const sim = createSave(1, 'ethnicity-own', {
      ...defaultConfig(), raceEthnicity: ['other'], raceEthnicityOwn: '  Cape Verdean  ',
    });
    const player = sim.universe.people[sim.universe.playerId]!;
    expect(player.raceEthnicityOwn).toBe('Cape Verdean');
    expect(describeEthnicity(['other'], 'Cape Verdean')).toBe('Cape Verdean');
  });

  it('leaves it empty when nobody said, rather than picking one', () => {
    const sim = createSave(1, 'ethnicity-none', { ...defaultConfig() });
    expect(sim.universe.people[sim.universe.playerId]!.raceEthnicity).toEqual([]);
    expect(describeEthnicity([], undefined)).toBe('—');
  });

  it('is put on the player and on nobody else', () => {
    const sim = createSave(1, 'ethnicity-player-only', {
      ...defaultConfig(), raceEthnicity: ['asian'],
    });
    // This build makes one person, but the rule is about who may carry it, so
    // it is stated as the rule: anybody who is not the player has none.
    for (const person of Object.values(sim.universe.people)) {
      if (person.id === sim.universe.playerId) expect(person.raceEthnicity).toEqual(['asian']);
      else expect(person.raceEthnicity).toBeUndefined();
    }
    // And it is only ever written in the one place that builds the player.
    const writers = readdirSync('src/engine', { recursive: true, encoding: 'utf8' })
      .filter((f) => f.endsWith('.ts'))
      .map((f) => `src/engine/${f.replace(/\\/g, '/')}`)
      .filter((f) => statSync(f).isFile())
      .filter((f) => /raceEthnicity:\s/.test(readFileSync(f, 'utf8')));
    expect(writers).toEqual(['src/engine/world/bootstrap.ts']);
  });

  it('drops an id that is not one of them rather than storing it', () => {
    const sim = createSave(1, 'ethnicity-junk', {
      ...defaultConfig(), raceEthnicity: ['asian', 'not-a-real-id', 'asian'],
    });
    expect(sim.universe.people[sim.universe.playerId]!.raceEthnicity).toEqual(['asian']);
  });

  it('is read by nothing in the simulation', () => {
    // The moment something branches on it, it stops being who somebody is and
    // starts being a stat. Nothing outside creation and the review may read it.
    const engine = readdirSync('src/engine', { recursive: true, encoding: 'utf8' })
      .filter((f) => f.endsWith('.ts') && !f.endsWith('content/ethnicity.ts'))
      .map((f) => `src/engine/${f.replace(/\\/g, '/')}`)
      .filter((f) => statSync(f).isFile());
    const readers = engine.filter((f) => {
      const text = readFileSync(f, 'utf8');
      return /\braceEthnicity\b/.test(text) && !/world\/bootstrap\.ts|domain\/model\.ts/.test(f);
    });
    expect(readers, 'these read race or ethnicity out of a save').toEqual([]);
  });
});

describe('the interests and the genres', () => {
  it('offers film and television, and the trades that make them', () => {
    const general = GENERAL_INTERESTS.map((one) => one.id);
    expect(general).toContain('film');
    expect(general).toContain('television');
    const crafts = CRAFT_INTERESTS.map((one) => one.id);
    for (const trade of [
      'cinematography', 'screenwriting', 'editing', 'sound_design', 'costume_design',
      'production_design', 'stunts', 'visual_effects', 'casting', 'directing',
      'producing', 'showrunning', 'voice_acting', 'film_scoring',
    ]) expect(crafts, `${trade} is a trade film and television have`).toContain(trade);
  });

  it('keeps every list in the order a reader would look in', () => {
    for (const [name, list] of [
      ['crafts', CRAFT_INTERESTS], ['general', GENERAL_INTERESTS], ['genres', FILM_GENRES],
    ] as const) {
      const labels = list.map((one) => one.label);
      const sorted = [...labels].sort((a, b) => a.localeCompare(b, 'en'));
      expect(labels, `${name} is out of alphabetical order`).toEqual(sorted);
      expect(isAlphabetical(list)).toBe(true);
    }
  });

  it('names every genre once, and enough of them to be worth the word every', () => {
    const ids = FILM_GENRES.map((one) => one.id);
    const labels = FILM_GENRES.map((one) => one.label);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(labels).size).toBe(labels.length);
    expect(FILM_GENRES.length).toBeGreaterThan(120);
    // The ones a list this size has no excuse for missing.
    for (const label of [
      'Action', 'Comedy', 'Documentary', 'Drama', 'Film Noir', 'Horror', 'Musical',
      'Mystery', 'Romance', 'Science Fiction', 'Thriller', 'War', 'Western',
    ]) expect(labels).toContain(label);
  });

  it('puts both on the player, and only enjoyment reads the interests, and nothing the genres', () => {
    const sim = createSave(1, 'interests', {
      ...defaultConfig(), interests: ['cinematography', 'film'], genres: ['film_noir', 'western'],
    });
    const player = sim.universe.people[sim.universe.playerId]!;
    expect(player.interests).toEqual(['cinematography', 'film']);
    expect(player.genres).toEqual(['film_noir', 'western']);

    // `core/taste.ts` was the one reader, and it went with the attributes.
    // Then the rule was the one race and ethnicity keep: the moment something
    // in the engine branches on them they stop being who somebody is and
    // start being a stat. On 2026-09-24 the owner narrowed it for the
    // interests: they may change how much somebody gets out of doing a thing,
    // never how good they are at it. That lives in one file, and the test
    // below holds what it may move. The genres wait for the film career.
    const engine = readdirSync('src/engine', { recursive: true, encoding: 'utf8' })
      .filter((f) => f.endsWith('.ts'))
      .map((f) => `src/engine/${f.replace(/\\/g, '/')}`)
      .filter((f) => statSync(f).isFile())
      .filter((f) => !/world\/bootstrap\.ts|domain\/model\.ts/.test(f));
    const reading = (field: string) => engine.filter((f) => new RegExp(`\\.${field}\\b`).test(readFileSync(f, 'utf8')));
    expect(reading('interests'), 'these read somebody’s interests out of a save').toEqual(['src/engine/systems/enjoyment.ts']);
    expect(reading('genres'), 'these read somebody’s genres out of a save').toEqual([]);
  });

  it('lets an interest change how much an action gives the mood and the relief, and nothing else', () => {
    // Everything each of the four does, loved and not, from the same start.
    // Only morale and stress may differ: fitness, energy, food and hygiene
    // are how good the hour was for the body, and loving it doesn't change that.
    for (const [action, interest] of [['eat', 'cooking'], ['exercise', 'fitness'], ['exercise', 'sport'], ['unwind', 'music']] as const) {
      const make = (interests: string[]) => ({
        personality: defaultPersonality(), personalityTraits: [], interests, birthInstant: 0,
        wellbeing: { ...freshWellbeing(), nourishment: 30, stress: 60, morale: 50 },
      } as unknown as Person);
      const plain = make([]);
      const loves = make([interest]);
      applyLookingAfter(plain, action);
      applyLookingAfter(loves, action);
      expect(loves.wellbeing.morale, `${interest} on ${action}`).toBeGreaterThan(plain.wellbeing.morale);
      if (action !== 'eat') expect(loves.wellbeing.stress, `${interest} on ${action}`).toBeLessThan(plain.wellbeing.stress);
      for (const dial of ['energy', 'sleepDebt', 'condition', 'fitness', 'nourishment', 'hygiene'] as const) {
        expect(loves.wellbeing[dial], `${interest} changed ${dial} on ${action}`).toBe(plain.wellbeing[dial]);
      }
    }
    // And an interest that isn't the thing being done changes nothing.
    const cook = { personality: defaultPersonality(), personalityTraits: [], interests: ['cooking'], birthInstant: 0, wellbeing: freshWellbeing() } as unknown as Person;
    const none = { personality: defaultPersonality(), personalityTraits: [], interests: [], birthInstant: 0, wellbeing: freshWellbeing() } as unknown as Person;
    applyLookingAfter(cook, 'exercise');
    applyLookingAfter(none, 'exercise');
    expect(cook.wellbeing).toEqual(none.wellbeing);
  });

  it('drops an id that is not on any list', () => {
    const sim = createSave(1, 'interests-junk', {
      ...defaultConfig(), interests: ['film', 'not-real'], genres: ['western', 'not-a-genre'],
    });
    const player = sim.universe.people[sim.universe.playerId]!;
    expect(player.interests).toEqual(['film']);
    expect(player.genres).toEqual(['western']);
  });
});
