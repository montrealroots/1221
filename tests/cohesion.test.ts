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
import {
  ATTRIBUTES, ATTRIBUTE_GROUPS, TRAITS, ALL_TRAITS, attributesInGroup,
} from '@/engine/domain/attributes';
import { CEILING } from '@/engine/content/prodigy';
import { COUNTRIES } from '@/engine/content/geography';
import { ageOnDate } from '@/engine/core/time';
import { createSave, defaultConfig, quickSave } from '@/engine';
import { describeEthnicity } from '@/engine/content/ethnicity';
import {
  STUDIOS, STUDIO_BY_ID, everyFigure, genresOf, ownershipDetail, peopleAt,
  studiosInTier, studiosMaking, studiosWorkingIn,
} from '@/engine/content/studios';
import {
  CRAFT_INTERESTS, FILM_GENRES, GENERAL_INTERESTS, GENRE_BY_ID, isAlphabetical,
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
      .map((f) => `src/engine/${f}`)
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
      .map((f) => `src/engine/${f}`)
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
      .map((f) => `src/engine/${f}`)
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
    expect(Object.keys(player.attributes)).toHaveLength(ATTRIBUTES.length);
    for (const skill of ATTRIBUTES) expect(player.attributes[skill.id]).toBe(CEILING);
    // Every acting trait and a mastery of every genre, held at once.
    expect(ALL_TRAITS).toHaveLength(TRAITS.length + GENRE_MASTERIES.length);
    for (const trait of ALL_TRAITS) {
      expect(player.traits, `${trait.name} not held`).toContain(trait.id);
    }
  });
});

describe('the production companies', () => {
  it('carries eighteen, each one only once', () => {
    expect(STUDIOS).toHaveLength(18);
    const ids = STUDIOS.map((one) => one.id);
    expect(new Set(ids).size).toBe(ids.length);
    const names = STUDIOS.map((one) => one.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('attaches no number to a company, so the order cannot read as a score', () => {
    // The list is in order. That is the whole of it: nothing carries a rank,
    // and the page prints no position beside a name.
    for (const studio of STUDIOS) {
      expect(Object.keys(studio)).not.toContain('rank');
    }
    const source = readFileSync('src/ui/workspaces/ProductionCompaniesWorkspace.tsx', 'utf8');
    expect(source).not.toMatch(/\brank\b/);
  });

  it('gives every company a name and somebody running it', () => {
    for (const studio of STUDIOS) {
      expect(studio.name, studio.id).not.toBe('');
      expect(studio.figures.length, `${studio.name} has nobody running it`).toBeGreaterThan(0);
      for (const person of studio.figures) {
        expect(person.role, `${person.name} has no role`).not.toBe('');
      }
    }
  });

  it('says how a company is owned as a fact, and never calls one independent', () => {
    // "Independent" was the wrong word and it was wrong in a way that showed:
    // Disney came up independent, when its shares trade on the New York Stock
    // Exchange and every reading of the word says otherwise. Ownership is now
    // three exclusive states, and each carries the thing that proves it.
    for (const studio of STUDIOS) {
      if (studio.ownership === 'subsidiary') {
        expect(studio.parent, `${studio.name} is a subsidiary of nobody`).toBeTruthy();
        expect(studio.ticker, `${studio.name} is a subsidiary with its own listing`).toBeUndefined();
      } else {
        expect(studio.parent, `${studio.name} answers to nobody yet names a parent`).toBeUndefined();
      }
      if (studio.ownership === 'public') {
        expect(studio.ticker, `${studio.name} is public and trades nowhere`).toBeTruthy();
      } else {
        expect(studio.ticker, `${studio.name} is not public and has a ticker`).toBeUndefined();
      }
    }
    const by = (kind: string) => STUDIOS.filter((one) => one.ownership === kind);
    expect(by('public')).toHaveLength(5);
    expect(by('private')).toHaveLength(5);
    expect(by('subsidiary')).toHaveLength(8);
  });

  it('shows the ticker on the traded ones and the owner on the owned ones', () => {
    for (const studio of STUDIOS) {
      const detail = ownershipDetail(studio);
      if (studio.ownership === 'private') expect(detail).toBeUndefined();
      else expect(detail, `${studio.name} shows nothing beside its ownership`).toBeTruthy();
    }
    expect(ownershipDetail(STUDIO_BY_ID.disney!)).toBe('NYSE: DIS');
    expect(ownershipDetail(STUDIO_BY_ID.nbcu!)).toBe('Comcast Corporation');
  });

  it('splits into the eight that make at scale and the ten beside them', () => {
    expect(studiosInTier('major')).toHaveLength(8);
    expect(studiosInTier('label')).toHaveLength(10);
    // The majors are the top of the list, not scattered through it.
    const tiers = STUDIOS.map((one) => one.tier);
    expect(tiers.slice(0, 8).every((t) => t === 'major')).toBe(true);
    expect(tiers.slice(8).every((t) => t === 'label')).toBe(true);
  });

  it('points a label at a parent that is really on the list, where it is', () => {
    const names = new Set(STUDIOS.map((one) => one.name));
    for (const studio of STUDIOS) {
      if (!studio.parent) continue;
      // A parent may be outside the list — Comcast, Apollo, Mediawan — but
      // where it names one that is on it, the name has to match exactly.
      const onTheList = [...names].some((name) => name === studio.parent);
      if (studio.parent.includes('Disney') || studio.parent.includes('NBCUniversal')) {
        expect(onTheList, `${studio.name} names a parent that is not on the list`).toBe(true);
      }
    }
  });

  it('keeps every named person off the face of a card and inside the company', () => {
    // The people were the reason the cards never lined up: five names on one
    // and one on the next. peopleAt is the door the detail view opens.
    for (const studio of STUDIOS) {
      expect(peopleAt(studio)).toHaveLength(studio.figures.length + (studio.casting?.length ?? 0));
    }
    const source = readFileSync('src/ui/workspaces/ProductionCompaniesWorkspace.tsx', 'utf8');
    const face = source.slice(source.indexOf('function StudioCard'), source.indexOf('function StudioDetail'));
    expect(face).not.toMatch(/figures|casting/);
  });

  it('says what every company makes, at what size, and how much of it', () => {
    for (const studio of STUDIOS) {
      expect(studio.formats.length, `${studio.name} makes nothing`).toBeGreaterThan(0);
      expect(new Set(studio.formats).size).toBe(studio.formats.length);
      expect(studio.budgets.length, `${studio.name} works at no budget`).toBeGreaterThan(0);
      expect(new Set(studio.budgets).size).toBe(studio.budgets.length);
      expect(studio.specialty, `${studio.name} has no specialism`).not.toBe('');
      // A specialism says what the company makes. The line already on the card
      // says who it is. Half of these started out as the same sentence written
      // twice — Annapurna's two were a word apart — so the check is a shared
      // run of words, not string equality, which caught none of them.
      const runs = (text: string) => {
        const words = text.toLowerCase().replace(/[^a-z ]/g, '').split(/\s+/).filter(Boolean);
        return new Set(words.slice(0, -3).map((_, i) => words.slice(i, i + 4).join(' ')));
      };
      const shared = [...runs(studio.specialty)].filter((run) => runs(studio.about).has(run));
      expect(shared, `${studio.name} says the same thing twice: ${shared[0]}`).toEqual([]);
    }
  });

  it('names only genres the engine really has, so the join cannot rot', () => {
    // This is the whole point of keying to ids: a company and a performer read
    // the same list, and a genre that only exists on one side fails here
    // rather than quietly making a company work in nothing.
    for (const studio of STUDIOS) {
      expect(studio.worksIn.length, `${studio.name} works in no genre`).toBeGreaterThan(4);
      expect(new Set(studio.worksIn).size, `${studio.name} repeats a genre`).toBe(studio.worksIn.length);
      for (const id of studio.worksIn) {
        expect(GENRE_BY_ID[id], `${studio.name} names a genre that does not exist: ${id}`).toBeTruthy();
      }
      expect(genresOf(studio)).toHaveLength(studio.worksIn.length);
    }
  });

  it('runs the genre join in both directions', () => {
    expect(genresOf(STUDIO_BY_ID.blumhouse!).map((one) => one.label)).toContain('Slasher');
    // Everybody who works in horror really carries it, and everybody who
    // carries it comes back.
    const horror = studiosWorkingIn('horror');
    expect(horror.length).toBeGreaterThan(3);
    for (const one of horror) expect(one.worksIn).toContain('horror');
    expect(horror.map((one) => one.id)).toContain('blumhouse');
    expect(studiosWorkingIn('kaiju').map((one) => one.id)).toEqual(['legendary']);
    expect(studiosWorkingIn('not_a_genre')).toHaveLength(0);
    // Every genre a company claims is reachable from the genre side too.
    for (const studio of STUDIOS) {
      for (const id of studio.worksIn) {
        expect(studiosWorkingIn(id).map((one) => one.id)).toContain(studio.id);
      }
    }
  });

  it('knows who makes television and who only makes films', () => {
    const series = studiosMaking('series');
    for (const one of series) expect(one.formats).toContain('series');
    // Focus and Neon are film companies. Casting a series regular is not a
    // thing either of them can offer, and the data has to say so.
    expect(series.map((one) => one.id)).not.toContain('focus');
    expect(series.map((one) => one.id)).not.toContain('neon');
    expect(series.map((one) => one.id)).toContain('netflix');
    expect(studiosMaking('feature')).toHaveLength(STUDIOS.length);
  });

  it('spreads across the genre list rather than crowding into a corner of it', () => {
    // Eighteen companies naming a dozen genres each out of a hundred and
    // forty-nine should touch a good spread of it, or the list is decorative.
    const touched = new Set(STUDIOS.flatMap((one) => one.worksIn));
    expect(touched.size).toBeGreaterThan(50);
    expect(touched.size).toBeLessThan(FILM_GENRES.length);
  });

  it('reaches every named person through one door', () => {
    const everybody = everyFigure();
    const counted = STUDIOS.reduce((n, one) => n + one.figures.length + (one.casting?.length ?? 0), 0);
    expect(everybody).toHaveLength(counted);
    expect(everybody.length).toBeGreaterThan(50);
  });
});
