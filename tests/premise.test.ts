/**
 * What SLATE is, held in place.
 *
 * SLATE is an actor and actress life simulator. That is the premise, and it is
 * most important fact about the game, so it is not left to a heading on a
 * screen: every save states it, every save carries the two titles it is about,
 * and every save records that they stand equal. These tests are what stops any
 * of that quietly going away.
 *
 * The two words are one craft under two names, and the test that matters most
 * is the one that proves neither of them is the default: two saves built
 * identically apart from the title come out the same in every respect except
 * the words used about the person.
 */

import { describe, expect, it } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { createSave, defaultConfig, loadSave, migrate, quickSave, validateUniverse } from '@/engine';
import { PREMISE_STATEMENT, SAVE_SCHEMA_VERSION, type SaveUniverse } from '@/engine/domain/model';
import {
  PERFORMER_NOUN, PERFORMER_PLURAL, PERFORMER_TITLES,
  categoryAdmits, forTitle, impliedPerformerTitle, performerNoun, performerTitleOf, splitByTitle,
} from '@/engine/core/performer';
import { CEILING, DISCIPLINES, DISCIPLINE_LABEL, GOAT_TRAITS, goatTraitsIn } from '@/engine/content/prodigy';
import { ALL_TRAITS, ATTRIBUTES } from '@/engine/domain/attributes';
import { SKILLS } from '@/engine/domain/skills';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { settledTitle } from '@/ui/creation/CharacterCreation';
import { GuardError, inspectPayload } from '../base44/shared/guard.js';

describe('every save says what game it is', () => {
  it('writes the premise into a brand new universe', () => {
    const sim = quickSave({}, 'premise-new');
    const premise = sim.universe.premise;

    expect(premise).toBeDefined();
    expect(premise.kind).toBe('actor-actress-life-simulator');
    expect(premise.statement).toBe(PREMISE_STATEMENT);
    expect(premise.statement).toMatch(/actor and actress life simulator/i);
    expect(premise.equalStanding).toBe(true);
    expect([...premise.titles].sort()).toEqual(['actor', 'actress']);
    expect(premise.recordedAt).toBe(sim.universe.meta.createdAt);
  });

  it('agrees with the person it is about, in all three places it is written', () => {
    const sim = quickSave({ pronouns: 'she/her' }, 'premise-agree');
    const player = sim.player;

    expect(player.performerTitle).toBe('actress');
    expect(sim.universe.premise.playerTitle).toBe('actress');
    expect(sim.universe.meta.performerTitle).toBe('actress');
    expect(sim.universe.meta.careerLabel).toBe('Actress');
  });

  it('records whether the player said it or their pronouns did', () => {
    const stated = quickSave({ pronouns: 'they/them', performerTitle: 'actress' }, 'premise-stated');
    expect(stated.universe.premise.playerTitle).toBe('actress');
    expect(stated.universe.premise.playerTitleSource).toBe('stated');

    const implied = quickSave({ pronouns: 'she/her' }, 'premise-implied');
    expect(implied.universe.premise.playerTitle).toBe('actress');
    expect(implied.universe.premise.playerTitleSource).toBe('implied');
  });

  it('survives a save and load round trip', () => {
    const sim = quickSave({ performerTitle: 'actress' }, 'premise-round-trip');
    sim.advanceTo(sim.now + 30 * 86_400_000);

    const reloaded = loadSave(deserialise(serialise(sim.universe)));
    expect(reloaded.universe.premise).toEqual(sim.universe.premise);
    expect(reloaded.player.performerTitle).toBe('actress');
    expect(validateUniverse(reloaded.universe).errors).toEqual([]);
  });
});

describe('actor and actress are equals', () => {
  it('gives the two titles the same game, and only different words', () => {
    const shared = { ...defaultConfig(), firstName: 'Robin', lastName: 'Vale', pronouns: 'they/them' };
    const asActor = createSave(1, 'equal-seed', { ...shared, performerTitle: 'actor' });
    const asActress = createSave(1, 'equal-seed', { ...shared, performerTitle: 'actress' });

    // The word differs.
    expect(asActor.universe.meta.careerLabel).toBe('Actor');
    expect(asActress.universe.meta.careerLabel).toBe('Actress');
    expect(asActor.universe.premise.playerTitle).not.toBe(asActress.universe.premise.playerTitle);

    // Nothing else does. Not the money, not the body, not the home, not the
    // clock, not a single number anywhere in the save.
    const strip = (u: SaveUniverse) => JSON.stringify({
      now: u.now,
      wellbeing: u.people[u.playerId]?.wellbeing,
      attributes: u.people[u.playerId]?.attributes,
      skills: u.people[u.playerId]?.skills,
      balances: Object.values(u.accounts).map((a) => a.balance).sort(),
      properties: Object.values(u.properties).map((p) => [p.marketValue, p.condition, p.bedrooms]),
      scheduled: u.scheduled.map((s) => [s.kind, s.at]),
    });
    expect(strip(asActor.universe)).toEqual(strip(asActress.universe));
  });

  it('holds neither title as the default in the vocabulary itself', () => {
    expect([...PERFORMER_TITLES].sort()).toEqual(['actor', 'actress']);
    for (const title of PERFORMER_TITLES) {
      expect(PERFORMER_NOUN[title]).toBeTruthy();
      expect(PERFORMER_PLURAL[title]).toBeTruthy();
      // Each word is its own; neither is built out of the other.
      expect(PERFORMER_NOUN[title].toLowerCase()).toBe(title);
    }
  });

  it('calls each person by their own word', () => {
    const actor = { pronouns: 'he/him', performerTitle: 'actor' as const };
    const actress = { pronouns: 'she/her', performerTitle: 'actress' as const };

    expect(performerNoun(actor)).toBe('Actor');
    expect(performerNoun(actress)).toBe('Actress');
    expect(forTitle('Method Actor/Actress', 'actress')).toBe('Method Actress');
    expect(forTitle('Method Actor/Actress', 'actor')).toBe('Method Actor');
  });

  it('splits a room into two columns and loses nobody', () => {
    const people = [
      { id: 'a', pronouns: 'she/her', performerTitle: 'actress' as const },
      { id: 'b', pronouns: 'he/him', performerTitle: 'actor' as const },
      { id: 'c', pronouns: 'they/them', performerTitle: 'actress' as const },
    ];
    const { actors, actresses } = splitByTitle(people);
    expect(actors).toHaveLength(1);
    expect(actresses).toHaveLength(2);
    expect(actors.length + actresses.length).toBe(people.length);
  });

  it('opens a category named for one title to that title only, and an unnamed one to both', () => {
    expect(categoryAdmits('Best Actress', 'actress')).toBe(true);
    expect(categoryAdmits('Best Actress', 'actor')).toBe(false);
    expect(categoryAdmits('Best Actor', 'actor')).toBe(true);
    expect(categoryAdmits('Best Actor', 'actress')).toBe(false);
    for (const title of PERFORMER_TITLES) {
      expect(categoryAdmits('Best Performance', title)).toBe(true);
    }
  });

  it('reads a title off pronouns without ever reading a name', () => {
    expect(impliedPerformerTitle('she/her')).toBe('actress');
    expect(impliedPerformerTitle('he/him')).toBe('actor');
    expect(impliedPerformerTitle('they/them')).toBe('actor');
    // A stated title always wins over what pronouns would have said.
    expect(performerTitleOf({ pronouns: 'she/her', performerTitle: 'actor' })).toBe('actor');
    expect(performerTitleOf({ pronouns: 'he/him', performerTitle: 'actress' })).toBe('actress');
  });
});

describe('a save that has lost the premise', () => {
  it('is brought forward rather than refused', () => {
    const sim = quickSave({ pronouns: 'she/her' }, 'premise-migrate');
    const universe = deserialise(serialise(sim.universe));

    // A save from before the premise existed.
    delete (universe as Partial<SaveUniverse>).premise;
    universe.meta.schemaVersion = SAVE_SCHEMA_VERSION - 1;

    const result = migrate(universe);
    expect(result.migrated).toBe(true);
    expect(result.problems).toEqual([]);
    expect(result.steps.join(' ')).toMatch(/actor and actress life simulator/i);
    expect(universe.premise.kind).toBe('actor-actress-life-simulator');
    expect(universe.premise.playerTitle).toBe('actress');
    expect(validateUniverse(universe).errors).toEqual([]);
  });

  it('has an untitled person settled from their pronouns', () => {
    const sim = quickSave({ pronouns: 'she/her' }, 'premise-untitled');
    const universe = deserialise(serialise(sim.universe));

    delete (universe.people[universe.playerId] as { performerTitle?: unknown }).performerTitle;
    universe.meta.schemaVersion = SAVE_SCHEMA_VERSION - 1;

    migrate(universe);
    expect(universe.people[universe.playerId]?.performerTitle).toBe('actress');
    expect(validateUniverse(universe).errors).toEqual([]);
  });

  it('fails validation while it is still missing', () => {
    const sim = quickSave({}, 'premise-invalid');
    const universe = deserialise(serialise(sim.universe));
    delete (universe as Partial<SaveUniverse>).premise;

    const report = validateUniverse(universe);
    expect(report.ok).toBe(false);
    expect(report.errors.join(' ')).toMatch(/premise is missing/i);
  });

  it('is renamed forward when it carries the old kind', () => {
    const sim = quickSave({}, 'premise-old-kind');
    const universe = deserialise(serialise(sim.universe));

    // Written before the genre was named in full.
    universe.premise.kind = 'actor-actress-simulator' as 'actor-actress-life-simulator';
    universe.meta.schemaVersion = SAVE_SCHEMA_VERSION - 1;

    const result = migrate(universe);
    expect(result.problems).toEqual([]);
    expect(universe.premise.kind).toBe('actor-actress-life-simulator');
    expect(result.steps.join(' ')).toMatch(/named the game in full/i);
    // Nothing else about it was rewritten.
    expect(universe.premise.playerTitle).toBe(sim.player.performerTitle);
    expect(validateUniverse(universe).errors).toEqual([]);
  });

  it('fails validation when it claims to be a different game', () => {
    const sim = quickSave({}, 'premise-wrong-game');
    sim.universe.premise.kind = 'life-simulator' as 'actor-actress-life-simulator';

    const report = validateUniverse(sim.universe);
    expect(report.ok).toBe(false);
    const said = report.errors.join(' ');
    expect(said).toMatch(/life-simulator/);
    expect(said).toMatch(/SLATE isn’t|SLATE is not/);
  });

  it('fails validation when the two titles stop being equals', () => {
    const sim = quickSave({}, 'premise-unequal');
    sim.universe.premise.equalStanding = false as true;

    const report = validateUniverse(sim.universe);
    expect(report.ok).toBe(false);
    expect(report.errors.join(' ')).toMatch(/equals/i);
  });

  it('fails validation when the premise and the person disagree', () => {
    const sim = quickSave({ pronouns: 'she/her' }, 'premise-disagree');
    sim.universe.premise.playerTitle = 'actor';

    const report = validateUniverse(sim.universe);
    expect(report.ok).toBe(false);
    expect(report.errors.join(' ')).toMatch(/premise says the player is an actor/i);
  });
});

describe('the server will not store a save that is not this game', () => {
  const payloadOf = (mutate: (u: SaveUniverse) => void) => {
    const sim = quickSave({}, 'guard-premise');
    const universe = deserialise(serialise(sim.universe));
    mutate(universe);
    return serialise(universe);
  };

  it('accepts one that says what it is', () => {
    const accepted = inspectPayload(payloadOf(() => {}), 1);
    expect(accepted.premise.kind).toBe('actor-actress-life-simulator');
    expect(accepted.premise.playerTitle).toMatch(/^(actor|actress)$/);
  });

  it('refuses one with no premise at all', () => {
    expect(() => inspectPayload(payloadOf((u) => { delete (u as Partial<SaveUniverse>).premise; }), 1))
      .toThrow(/does not say what game it is/i);
  });

  it('refuses one that claims to be a different game', () => {
    expect(() => inspectPayload(payloadOf((u) => { u.premise.kind = 'farming-simulator' as 'actor-actress-life-simulator'; }), 1))
      .toThrow(GuardError);
    expect(() => inspectPayload(payloadOf((u) => { u.premise.kind = 'farming-simulator' as 'actor-actress-life-simulator'; }), 1))
      .toThrow(/actor and actress life simulators/i);
  });

  it('refuses one that has demoted a title', () => {
    expect(() => inspectPayload(payloadOf((u) => { u.premise.equalStanding = false as true; }), 1))
      .toThrow(/equals/i);
  });

  it('refuses one whose player is neither', () => {
    expect(() => inspectPayload(payloadOf((u) => { u.premise.playerTitle = 'extra' as 'actor'; }), 1))
      .toThrow(/neither actor nor actress/i);
  });
});

describe('the craft is acting, and only acting', () => {
  it('keeps one discipline, and it is the one the game is named for', () => {
    expect([...DISCIPLINES]).toEqual(['acting']);
    expect(DISCIPLINE_LABEL.acting).toBe('Acting');
  });

  it('gives every G.O.A.T. trait to acting', () => {
    expect(GOAT_TRAITS.length).toBeGreaterThan(0);
    for (const trait of GOAT_TRAITS) expect(trait.discipline).toBe('acting');
    expect(goatTraitsIn('acting')).toHaveLength(GOAT_TRAITS.length);
  });

  it('hands the player the acting instrument and nothing from another job', () => {
    const sim = quickSave({}, 'craft-acting');
    const player = sim.player;

    // Every acting attribute at the ceiling.
    expect(Object.keys(player.attributes).length).toBe(ATTRIBUTES.length);
    for (const attribute of ATTRIBUTES) expect(player.attributes[attribute.id]).toBe(CEILING);

    // Every acting trait, and the three that belong to one person.
    expect(player.traits.sort()).toEqual(ALL_TRAITS.map((t) => t.id).sort());
    expect(player.goatTraits?.sort()).toEqual(GOAT_TRAITS.map((t) => t.id).sort());

    // Nothing from a job this game no longer simulates.
    expect('founder' in player, 'the producer sheet is back on the player').toBe(false);
    expect('founderTraits' in player).toBe(false);
    expect('professions' in player).toBe(false);
  });

  it('leaves the skill sheet as ordinary life, not five crafts', () => {
    for (const skill of SKILLS) expect(skill.domain).toBe('general');
  });
});

describe('the house rule holds in the source', () => {
  const ROOT = new URL('../src/', import.meta.url);

  function walk(dir: URL, out: string[] = []): string[] {
    for (const name of readdirSync(dir)) {
      const path = new URL(name, dir);
      if (statSync(path).isDirectory()) walk(new URL(`${name}/`, dir), out);
      else if (/\.(ts|tsx)$/.test(name)) out.push(fileURLToPath(path));
    }
    return out;
  }

  const SOURCES = walk(ROOT).filter((f) => !f.endsWith('core/performer.ts'));

  it('never writes "a actor" or "a actress"', () => {
    // Both words open on a vowel sound, so the article is always "an". The bug
    // hides from a search because the article and the noun are never in the
    // same string: one is typed, the other is interpolated.
    const offenders: string[] = [];
    for (const file of SOURCES) {
      const text = readFileSync(file, 'utf8');
      if (/\ba actor\b|\ba actress\b/i.test(text)) offenders.push(file);
      // The interpolated form: "You are a {PERFORMER_NOUN[...]" and friends.
      if (/\ba \{[^}]*PERFORMER_NOUN|\ba \{[^}]*performerNoun/i.test(text)) offenders.push(file);
    }
    expect(offenders, 'these write "a" before a title that needs "an"').toEqual([]);
  });

  it('prints a person’s title through the module rather than typing it out', () => {
    // The one place a bare word is right is the control that offers the choice,
    // where both are listed flat and neither is explained as the exception.
    const ALLOWED = 'src/ui/creation/CharacterCreation.tsx';
    const offenders: { file: string; line: string }[] = [];
    for (const file of SOURCES) {
      if (file.endsWith(ALLOWED)) continue;
      for (const line of readFileSync(file, 'utf8').split('\n')) {
        // A title inside JSX text or a quoted string, not inside a comment.
        if (/^\s*(\*|\/\/)/.test(line)) continue;
        if (/>(\s*)(Actor|Actress)(\s*)</.test(line) || /['"`](Actor|Actress)['"`]/.test(line)) {
          offenders.push({ file, line: line.trim() });
        }
      }
    }
    expect(offenders, 'these type a title into a string instead of reading it off the person').toEqual([]);
  });

  it('offers the two titles flat, with neither explained as the exception', () => {
    const creation = readFileSync(fileURLToPath(new URL('ui/creation/CharacterCreation.tsx', ROOT)), 'utf8');
    // Both come off PERFORMER_TITLES, so the screen cannot drop one, reorder
    // them, or give one a label the other does not have.
    expect(creation).toContain('{PERFORMER_TITLES.map((option) => (');
    expect(creation).toContain('<div className="trait-name">{PERFORMER_NOUN[option]}</div>');
    expect(creation).not.toMatch(/['"`]Act(or|ress)['"`]\s*[,:)]/);
  });

  it('keeps no default title on the label that prints one', () => {
    const bootstrap = readFileSync(fileURLToPath(new URL('engine/world/bootstrap.ts', ROOT)), 'utf8');
    expect(bootstrap, 'careerLabel defaults one of the two titles').not.toMatch(
      /title:\s*PerformerTitle\s*=\s*'(actor|actress)'/,
    );
  });
});

describe('the title a character is billed under', () => {
  const source = readFileSync('src/ui/creation/CharacterCreation.tsx', 'utf8');

  it('is settled by he and by she, and left open by they', () => {
    expect(settledTitle('he/him')).toBe('actor');
    expect(settledTitle('she/her')).toBe('actress');
    expect(settledTitle('they/them')).toBeUndefined();
  });

  it('opens that choice empty, because a preselected one of two equals is a default', () => {
    // The whole premise is that neither word is the default. Handing they/them
    // a pre-picked Actor would make actor exactly that, on the one screen where
    // the choice is real.
    expect(settledTitle('they/them')).toBeUndefined();
    expect(source).toContain('Choose whether you’re billed as an actor or an actress.');
  });

  it("offers both words from the same list, in the engine's own order", () => {
    // Rendered from PERFORMER_TITLES rather than written out, so neither can be
    // dropped, reordered or spelled differently on this screen alone.
    expect(source).toContain('{PERFORMER_TITLES.map((option) => (');
    expect(PERFORMER_TITLES).toEqual(['actor', 'actress']);
  });

  it('writes the settled title into the config, not just onto the screen', () => {
    // createUniverse reads config.performerTitle. If the pronouns settled the
    // title only for display, a pick made under they/them would survive behind
    // he/him and reach the save.
    expect(source).toContain('performerTitle: settledTitle(pronouns)');
  });

  it('makes a save whose title agrees with its pronouns', () => {
    for (const [pronouns, expected] of [['he/him', 'actor'], ['she/her', 'actress']] as const) {
      const sim = createSave(1, `title-${expected}`, {
        ...defaultConfig(), pronouns, performerTitle: settledTitle(pronouns),
      });
      const player = sim.universe.people[sim.universe.playerId]!;
      expect(player.performerTitle).toBe(expected);
      expect(sim.universe.premise.playerTitle).toBe(expected);
      expect(sim.universe.premise.playerTitleSource).toBe('stated');
    }
  });

  it('lets somebody on they/them be billed either way, and says they said so', () => {
    for (const title of PERFORMER_TITLES) {
      const sim = createSave(1, `title-they-${title}`, {
        ...defaultConfig(), pronouns: 'they/them', performerTitle: title,
      });
      expect(sim.universe.people[sim.universe.playerId]!.performerTitle).toBe(title);
      expect(sim.universe.premise.playerTitle).toBe(title);
      expect(sim.universe.premise.playerTitleSource).toBe('stated');
    }
  });
});
