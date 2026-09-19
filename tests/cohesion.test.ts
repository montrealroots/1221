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
import { ALL_TRAITS, ATTRIBUTES, ATTRIBUTE_GROUPS, TRAITS, attributesInGroup, rate } from '@/engine/domain/attributes';
import { CEILING } from '@/engine/content/prodigy';
import { ENQUIRY_SHAPES } from '@/engine/content/lot';
import { COUNTRIES } from '@/engine/content/geography';
import { ageOnDate } from '@/engine/core/time';
import { createSave, defaultConfig, quickSave } from '@/engine';
import { describeEthnicity } from '@/engine/content/ethnicity';
import {
  CRAFT_INTERESTS, FILM_GENRES, GENERAL_INTERESTS, isAlphabetical,
} from '@/engine/content/interests';
import { GENRE_MASTERIES, masteryForGenre } from '@/engine/content/genre-mastery';
import {
  PERSONALITY_GROUPS, personalityTraitPairs, personalityTraitsIn,
} from '@/engine/content/personality-traits';
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
    expect(duplicates(ATTRIBUTES, (a) => a.id)).toEqual([]);
    expect(duplicates(ALL_TRAITS, (t) => t.id)).toEqual([]);
    expect(duplicates(COUNTRIES.all(), (c) => c.id)).toEqual([]);
  });

  it('keeps every name unique where a name is how you find the thing', () => {
    expect(duplicates(ATTRIBUTES, (a) => a.name)).toEqual([]);
    // A certificate's name repeats across boards on purpose — "General" is a
    // rung in four systems — so it is the pair that has to be unique.

    // An enquiry's `from` is not decoration: it becomes `booking.holder`, and
    // the holder string is the whole identity of a casting office. `readFor`,
    // `remembersYou`, `believedOf` and `ignoredBy` all key off it, so two
    // shapes sharing one produce two productions that share one memory of the
    // player — read for one and the other remembers it. Two rows were both "an
    // American studio, a feature": nine shapes, eight addressable offices, and
    // nothing said which two were secretly one.
    expect(duplicates(ENQUIRY_SHAPES, (one) => `${one.of.from}, ${one.of.kind}`)).toEqual([]);
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


});

describe('a fact stated twice is stated the same way', () => {

  it('gives every trait a category the interface knows how to show', () => {
    const categories = new Set(TRAITS.map((t) => t.category));
    for (const trait of TRAITS) expect(categories.has(trait.category)).toBe(true);
    expect(duplicates(TRAITS, (t) => t.name)).toEqual([]);
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

describe('the order the personality traits are offered in', () => {
  it('puts every trait beside the one it rules out', () => {
    for (const group of PERSONALITY_GROUPS) {
      for (const row of personalityTraitPairs(group)) {
        if (row.length !== 2) continue;
        const [left, right] = row;
        expect(left!.conflictsWith ?? [], `${left!.name} beside ${right!.name}`).toContain(right!.id);
        expect(right!.conflictsWith ?? [], `${right!.name} beside ${left!.name}`).toContain(left!.id);
      }
    }
  });

  it('offers every trait exactly once', () => {
    for (const group of PERSONALITY_GROUPS) {
      const ordered = personalityTraitPairs(group).flat().map((t) => t.id);
      const expected = personalityTraitsIn(group).map((t) => t.id);
      expect([...ordered].sort()).toEqual([...expected].sort());
      expect(ordered.length).toBe(new Set(ordered).size);
    }
  });

  it('stands a trait alone only when its opposite is already spoken for', () => {
    for (const group of PERSONALITY_GROUPS) {
      const rows = personalityTraitPairs(group);
      const paired = new Set(rows.filter((r) => r.length === 2).flat().map((t) => t.id));
      for (const row of rows) {
        if (row.length !== 1) continue;
        const alone = row[0]!;
        const inGroup = new Set(personalityTraitsIn(group).map((t) => t.id));
        const partners = (alone.conflictsWith ?? []).filter((id) => inGroup.has(id));
        // Every one of its in-group opposites is in a pair with somebody else.
        for (const id of partners) expect(paired.has(id)).toBe(true);
      }
    }
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
    ]) expect(crafts, `${trade} is a trade this industry has`).toContain(trade);
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

  it('puts both on the player, and reads them through one door', () => {
    const sim = createSave(1, 'interests', {
      ...defaultConfig(), interests: ['cinematography', 'film'], genres: ['film_noir', 'western'],
    });
    const player = sim.universe.people[sim.universe.playerId]!;
    expect(player.interests).toEqual(['cinematography', 'film']);
    expect(player.genres).toEqual(['film_noir', 'western']);

    // `core/taste.ts` is the door. Everything else asks it, so the rules about
    // what an interest means live in one file rather than in each caller.
    //
    // The rule is about reading them off a PERSON — `person.genres` — not about
    // the word. The genre catalog itself is public: `content/genre-mastery.ts`
    // builds a mastery per genre from it and never touches anybody's save.
    const readers = readdirSync('src/engine', { recursive: true, encoding: 'utf8' })
      .filter((f) => f.endsWith('.ts'))
      .map((f) => `src/engine/${f.replace(/\\/g, '/')}`)
      .filter((f) => statSync(f).isFile())
      .filter((f) => !/core\/taste\.ts|world\/bootstrap\.ts|domain\/model\.ts/.test(f))
      .filter((f) => /\.(genres|interests|personalityTraits)\b/.test(readFileSync(f, 'utf8')));
    expect(readers, 'these reach past core/taste.ts for somebody’s taste').toEqual([]);
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

describe('mastery of every genre', () => {
  it('gives every genre one, and nothing a mastery without a genre', () => {
    expect(GENRE_MASTERIES).toHaveLength(FILM_GENRES.length);
    for (const genre of FILM_GENRES) {
      const mastery = masteryForGenre(genre.id);
      expect(mastery, `${genre.label} has no mastery`).toBeDefined();
      expect(mastery!.name).toBe(`${genre.label} Mastery`);
      expect(mastery!.category).toBe('Genre');
    }
    const genreIds = new Set(FILM_GENRES.map((g) => g.id));
    for (const mastery of GENRE_MASTERIES) {
      expect(genreIds.has(mastery.id.replace(/^genre_/, ''))).toBe(true);
    }
  });

  it('lists them alphabetically by their own name, not the genre’s', () => {
    // Adding a word to the end reorders any pair where one genre name begins
    // the other: Horror Comedy Mastery comes before Horror Mastery, where the
    // genres run Horror then Horror Comedy.
    const names = GENRE_MASTERIES.map((m) => m.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b, 'en')));
    expect(names.indexOf('Horror Comedy Mastery')).toBeLessThan(names.indexOf('Horror Mastery'));
  });

  it('keeps every id and name unique', () => {
    expect(new Set(GENRE_MASTERIES.map((m) => m.id)).size).toBe(GENRE_MASTERIES.length);
    expect(new Set(GENRE_MASTERIES.map((m) => m.name)).size).toBe(GENRE_MASTERIES.length);
  });
});

describe('the acting sheet', () => {
  it('lists every skill and every trait alphabetically', () => {
    const skills = ATTRIBUTES.map((a) => a.name);
    expect(skills).toEqual([...skills].sort((a, b) => a.localeCompare(b, 'en')));
    const traits = TRAITS.map((t) => t.name);
    expect(traits).toEqual([...traits].sort((a, b) => a.localeCompare(b, 'en')));
  });

  it('keeps the ids the traits point at', () => {
    // A trait's attributeMods name attribute ids. One that no longer exists
    // would write into a key nothing reads, and nothing would say so.
    const ids = new Set(ATTRIBUTES.map((a) => a.id));
    for (const trait of TRAITS) {
      for (const id of Object.keys(trait.attributeMods ?? {})) {
        expect(ids.has(id), `${trait.name} modifies unknown attribute '${id}'`).toBe(true);
      }
    }
  });

  it('gives every skill a group the interface knows', () => {
    const groups = new Set(ATTRIBUTE_GROUPS);
    for (const skill of ATTRIBUTES) {
      expect(groups.has(skill.group), `${skill.name} is in unknown group '${skill.group}'`).toBe(true);
    }
    // Every group carries something; an empty one is a group that died.
    for (const group of ATTRIBUTE_GROUPS) {
      expect(attributesInGroup(group).length, `${group} is empty`).toBeGreaterThan(0);
    }
  });

  it('hands the player all of it, at the ceiling', () => {
    const sim = createSave(1, 'goat-sheet', { ...defaultConfig() });
    const player = sim.universe.people[sim.universe.playerId]!;
    for (const attribute of ATTRIBUTES) expect(rate(player.attributes, attribute.id)).toBe(CEILING);
    // Every acting trait and a mastery of every genre, held at once.
    expect(ALL_TRAITS).toHaveLength(TRAITS.length + GENRE_MASTERIES.length);
    for (const trait of ALL_TRAITS) {
      expect(player.traits, `${trait.name} not held`).toContain(trait.id);
    }
  });
});
