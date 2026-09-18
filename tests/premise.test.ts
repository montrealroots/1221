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
import { quotaNow } from '@/engine/world/sugar';
import { createSave, defaultConfig, loadSave, migrate, quickSave, validateUniverse } from '@/engine';
import { PREMISE_STATEMENT, SAVE_SCHEMA_VERSION, type SaveUniverse } from '@/engine/domain/model';
import {
  PERFORMER_NOUN, PERFORMER_PLURAL, PERFORMER_TITLES,
  categoryAdmits, forTitle, impliedPerformerTitle, performerNoun, performerTitleOf, splitByTitle,
} from '@/engine/core/performer';
import { CEILING, DISCIPLINES, DISCIPLINE_LABEL, GOAT_TRAITS, goatTraitsIn } from '@/engine/content/prodigy';
import { ALL_TRAITS, ATTRIBUTES, rate } from '@/engine/domain/attributes';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { settledTitle } from '@/ui/creation/CharacterCreation';
import { GuardError, inspectPayload } from '../base44/shared/guard.js';

describe('every save starts on the same morning', () => {
  it('opens on Monday 5 January 2026, and on a Monday for a reason', () => {
    const sim = quickSave({}, 'starts');
    const at = new Date(sim.now);
    expect(at.getUTCFullYear()).toBe(2026);
    expect(at.getUTCMonth() + 1).toBe(1);
    expect(at.getUTCDate()).toBe(5);
    // A Monday, because the week is the unit almost everything here is
    // measured in: a stage is let by the week, a shoot is scheduled in weeks,
    // and a save beginning mid-week spends its first days out of step with
    // every window the engine lays. Held here because nothing else held it —
    // the date could be moved and every test in the build still passed.
    expect(at.getUTCDay(), 'the save has to open on a Monday').toBe(1);
  });

  it('inherits a world that is already settled, and owes the player nothing yet', () => {
    const sim = quickSave({}, 'inherited');
    // Everything the save is handed happened before the morning it opens: the
    // family moved onto the land a year earlier, the lot went up on it, and
    // America had already decided the quota for this fiscal year the previous
    // July. If any of those drifted past the start the player would arrive
    // before their own history.
    const lot = Object.values(sim.universe.properties).find((one) => one.kind === 'studio_lot')!;
    expect(lot.createdAt).toBeLessThan(sim.now);
    expect(Object.values(sim.universe.stages).every((one) => one.builtAt < sim.now)).toBe(true);
    const year = quotaNow(sim);
    expect(year, 'the fiscal year the save opens in has already been decided').toBeDefined();
    expect(year!.decidedAt).toBeLessThan(sim.now);
  });
});

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
    for (const attribute of ATTRIBUTES) expect(rate(player.attributes, attribute.id)).toBe(CEILING);

    // Every acting trait. The three that belong to one person are read off
    // `content/prodigy.ts` wherever they are shown, so the save carries no
    // second copy of them to drift from the first.
    expect(player.traits.sort()).toEqual(ALL_TRAITS.map((t) => t.id).sort());
    expect('goatTraits' in player).toBe(false);
    expect(GOAT_TRAITS.length).toBe(3);

    // Nothing from a job this game no longer simulates.
    expect('founder' in player, 'the producer sheet is back on the player').toBe(false);
    expect('founderTraits' in player).toBe(false);
    expect('professions' in player).toBe(false);
  });

  it('carries no sheet but the acting one, and none of the fields nothing read', () => {
    const { universe } = quickSave({}, 'premise-fields');
    // Five person fields and a whole forty-seven-row skill sheet were written
    // on every person in the save and read by nothing. The sheet held the
    // prodigy at a hundred and everybody else at five and never moved for
    // anybody; `goals` was not asked for on any screen; `lifestyle` offered
    // four answers that opened the same world; `creditScore` is kept on
    // `WEALTH_PROFILE`, where the creation review actually reads it, and there
    // is no lending to consult a copy on a person; `goatTraits` duplicated a
    // content list. None of them comes back without a reader arriving first.
    for (const person of Object.values(universe.people)) {
      for (const dead of ['skills', 'goals', 'lifestyle', 'creditScore', 'goatTraits']) {
        expect(dead in person, `${dead} is back on a person`).toBe(false);
      }
      expect('travelFatigue' in person.wellbeing, 'travelFatigue is back on a wellbeing')
        .toBe(false);
    }
  });

  it('sheds the sixth dead word too, which is on the wellbeing and not the person', () => {
    // The first draft of the migration shed five keys off the person and left
    // `travelFatigue` on the wellbeing, under a comment that said six had gone.
    // A field this loop misses is a field that persists forever in every save
    // anybody already has, which is the one thing a migration exists to stop.
    const { universe } = quickSave({}, 'premise-migrate');
    universe.meta.schemaVersion = SAVE_SCHEMA_VERSION - 1;
    for (const person of Object.values(universe.people)) {
      (person.wellbeing as unknown as Record<string, unknown>).travelFatigue = 41;
    }
    migrate(universe);
    for (const person of Object.values(universe.people)) {
      expect('travelFatigue' in person.wellbeing, 'an old save keeps it forever').toBe(false);
    }
  });

  // The sixteen that came off a property at schema 80. They described a market
  // — buying, borrowing, renting, listing, insuring, a garage and a dock — for
  // a game whose premise is that the family already holds the two places that
  // exist and never buys or sells any of it. `addressLine` and `lotSqft` are
  // the two that were not empty: they stored what `estatePlaceLine()` and
  // `ESTATE_ACRES` already say, frozen at the moment the save was written, and
  // no screen read either.
  const DEAD_ON_A_PLACE = [
    'addressLine', 'neighbourhoodId', 'lotSqft', 'purchasePrice', 'purchasedAt', 'monthlyRent',
    'leaseEndsAt', 'mortgageAccountId', 'annualPropertyTaxRate', 'hoaMonthly', 'insurancePolicyId',
    'structureIds', 'garageSpaces', 'dockFeet', 'rentedOut', 'listedForSale',
  ];

  it('describes the two places it holds and not a property market', () => {
    const { universe } = quickSave({}, 'premise-places');
    const places = Object.values(universe.properties);
    expect(places.length, 'the house and the lot').toBe(2);
    for (const place of places) {
      for (const dead of DEAD_ON_A_PLACE) {
        expect(dead in place, `${dead} is back on ${place.name}`).toBe(false);
      }
    }
    // And the kinds it can be are the two it is. Fifteen more were declared —
    // apartments, a penthouse, a private island, retail — and no code path in
    // the build could produce any of them.
    expect(places.map((one) => one.kind).sort()).toEqual(['house', 'studio_lot']);
  });

  it('takes the property market off a save that already has one', () => {
    const { universe } = quickSave({}, 'premise-places-migrate');
    universe.meta.schemaVersion = SAVE_SCHEMA_VERSION - 1;
    for (const place of Object.values(universe.properties)) {
      const p = place as unknown as Record<string, unknown>;
      for (const dead of DEAD_ON_A_PLACE) p[dead] = 1;
    }
    migrate(universe);
    for (const place of Object.values(universe.properties)) {
      for (const dead of DEAD_ON_A_PLACE) {
        expect(dead in place, `an old save keeps ${dead} forever`).toBe(false);
      }
    }
  });

  it('names the office an old save only had a sentence for', () => {
    // Schema 81. A casting office's identity used to be the prose printed about
    // it, so a save written before this has the sentence and no id. The
    // migration matches on the sentence, once, and everything the player had
    // built up with that office survives the change — which is the whole point
    // of the change, because from here a rewrite of the sentence costs nothing.
    const { universe } = quickSave({}, 'premise-offices');
    universe.meta.schemaVersion = SAVE_SCHEMA_VERSION - 1;
    const bookingId = 'booking_old';
    universe.bookings[bookingId] = {
      id: bookingId, saveId: universe.meta.id, stageId: 'stage_x',
      holder: 'RÚV, a limited series', kind: 'shooting',
      from: universe.now, to: universe.now + 1, weekRateCents: 1,
    };
    const auditionId = 'audition_old';
    universe.auditions[auditionId] = {
      id: auditionId, saveId: universe.meta.id, bookingId,
      holder: 'a Hollywood studio, a feature', size: 'day', feeCents: 1,
      from: universe.now, to: universe.now + 1, closesAt: universe.now + 1,
      wants: {}, state: 'over', why: 'went-another-way',
    } as unknown as typeof universe.auditions[string];

    migrate(universe);
    expect(universe.bookings[bookingId]!.officeId).toBe('ruv_series');
    expect(universe.auditions[auditionId]!.officeId).toBe('hollywood_feature');
  });
});

describe('the house rule holds in the source', () => {
  const ROOT = new URL('../src/', import.meta.url);

  function walk(dir: URL, out: string[] = []): string[] {
    for (const name of readdirSync(dir)) {
      const path = new URL(name, dir);
      if (statSync(path).isDirectory()) walk(new URL(`${name}/`, dir), out);
      // Forward slashes, always. The exemption below names a file with one, and
      // on Windows `fileURLToPath` hands back backslashes — so the module that
      // is allowed to spell the titles out was being flagged for spelling them.
      else if (/\.(ts|tsx)$/.test(name)) out.push(fileURLToPath(path).replace(/\\/g, '/'));
    }
    return out;
  }

  const SOURCES = walk(ROOT).filter((f) => !f.endsWith('core/performer.ts'));

  it('never capitalises one of the pair and not the other', () => {
    // The sentence that names them together is the sentence claiming they are
    // equals, so "Actor and actress" reads as the opposite of what it says.
    // Either both carry a capital or neither does; one of each is the bug.
    // No exemption for the start of a sentence. That is precisely where it
    // happened: "…the choice is yours. Actor and actress are two words for the
    // same craft" — the capital on the first is correct grammar and the
    // lowercase on the second still reads as a ranking. Both, or neither.
    const MIXED = /\b(Actor|Actress) (and|or) (actor|actress)\b|\b(actor|actress) (and|or) (Actor|Actress)\b/;
    const offenders: string[] = [];
    for (const file of SOURCES) {
      for (const [i, line] of readFileSync(file, 'utf8').split('\n').entries()) {
        const match = MIXED.exec(line);
        if (match) offenders.push(`${file}:${i + 1} — ${match[0]}`);
      }
    }
    expect(offenders, 'these capitalise one of the two titles and not the other').toEqual([]);
  });

  it('capitalises Television and Film wherever the two are named together', () => {
    // Same rule as the two titles: a pair named as a pair takes a capital on
    // both halves. On its own, either word is ordinary prose and is left be —
    // it is only the pairing that is a name.
    const PAIR = /\b(television|film) (and|or) (television|film)\b/gi;
    const offenders: string[] = [];
    for (const file of SOURCES) {
      for (const [i, line] of readFileSync(file, 'utf8').split('\n').entries()) {
        for (const match of line.matchAll(PAIR)) {
          const [first, , second] = [match[1]!, match[2]!, match[3]!];
          if (/^[A-Z]/.test(first) && /^[A-Z]/.test(second)) continue;
          offenders.push(`${file}:${i + 1} — ${match[0]}`);
        }
      }
    }
    expect(offenders, 'these name the pair without capitalising both halves').toEqual([]);
  });

  it('capitalises both halves of a pronoun pair on screen', () => {
    // He/Him, She/Her, They/Them. Half a pair capitalised reads as though the
    // second word were an afterthought, which is the same fault as writing
    // "Actor and actress".
    //
    // The stored value is lowercase and must stay that way: `pronouns` is
    // 'they/them' in the save and `settledTitle` matches it case-insensitively.
    // So the option values and the code that talks about them are skipped, and
    // what is checked is prose.
    const PAIR = /\b(he|she|they)\/(him|her|them)\b/gi;
    const offenders: string[] = [];
    for (const file of SOURCES) {
      for (const [i, raw] of readFileSync(file, 'utf8').split('\n').entries()) {
        const line = raw.trim();
        if (line.startsWith('//') || line.startsWith('*') || line.startsWith('/*')) continue;
        if (/value=|pronouns:|'(he|she|they)\/(him|her|them)'/i.test(line)) continue;
        for (const match of line.matchAll(PAIR)) {
          if (/^[A-Z]/.test(match[1]!) && /^[A-Z]/.test(match[2]!)) continue;
          offenders.push(`${file}:${i + 1} — ${match[0]}`);
        }
      }
    }
    expect(offenders, 'these leave half a pronoun pair in lower case').toEqual([]);
  });

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
