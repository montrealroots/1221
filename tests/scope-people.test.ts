/**
 * The current scope's people rows, completed on 2026-10-15. l-person: another person's look reads that person, their
 * traits, their condition and their pronouns.
 *
 * Until 2026-10-15 the person look, the trait look and the condition look said "they" of everybody but the player,
 * whatever their pronouns. A she/her person read "Their body." above "On their papers. she/her"
 * (tests/evidence2-b12.test.ts held exactly that), so changing her pronouns changed the papers line and nothing that was
 * said of her. The dial ways on her look said "what the day has left in you" of her, and the injury way said "what it
 * keeps you from". From 2026-10-15 each is said in her own pronouns (`spokenOf`, src/ui/looks/wellbeing.tsx). she/her
 * and he/him are singular ("Who she is.", "where he lives", "A Trait She Holds", "He leaves it alone"), and they/them
 * stays "they". The player stays "you", whatever her pronouns.
 *
 * FIXTURE, said again where it's done: only the player is a Person in play. No command adds one, and bootstrap is the
 * only place one is made, so a second Person is a seeded one. Each is built as bootstrap builds the player
 * (`createUniverse`, from a config of their own) and put into the world of a played life under an id that isn't the
 * player's. Their condition and injury are written on by hand. It is an isolated rendering test of the look's other
 * branch, and not a played journey. The owner's direction of 2026-10-15 accepts it as that, labelled, and no
 * character-creation feature was added for it.
 *
 * The played life: Ada Cole, born in New York, she/her, 170 cm and 65 kg, Spender, at Yale in New Haven from Monday 24
 * August 2026 (`newLifeConfig`), played by the clock to Wednesday 26 August. The figures are worked here by hand: 160 cm
 * is 63 inches, 5 ft 3 in; 55 kg is 121 lb at 0.45359237 kg the pound; 55 ÷ 1.6² is 21.48, a body mass index of 21.5;
 * 170 cm is 67 inches, 5 ft 7 in; 65 kg is 143 lb.
 */
import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import type { Person } from '@/engine/domain/model';
import { MS_DAY } from '@/engine/core/time';
import { createUniverse, newLifeConfig, type NewSaveConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import '@/ui/looks/all';
import { resolveLook } from '@/ui/looks/registry';
import { at } from '@/ui/looks/subject';

type Seen = { name: string; kind: string; summary?: string; parent?: unknown; provenance?: string; ways?: { label: string; detail?: string; to: unknown }[]; body?: unknown };

/** What the player reads: the markup with every tag taken out and its entities read. */
const onScreen = (html: string) => html.replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ')
  .replace(/&quot;/g, '"').replace(/&#x27;/g, '\'').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

/** A look as it opens: its name, kind, ways and the words of its body. */
function look(sim: Simulation, kind: string, id: string): Seen & { words: string } {
  const found = resolveLook(sim, at(kind, id));
  if (!found || 'gone' in found) throw new Error(`${kind}:${id} didn’t resolve`);
  const seen = found as Seen;
  return { ...seen, words: seen.body ? onScreen(renderToStaticMarkup(createElement('div', null, seen.body as never))) : '' };
}
const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);

/** PLAYER JOURNEY: Ada's life, begun and played by the clock to Wednesday morning. */
function played(): Simulation {
  const sim = createSave(1, 'sp-people', {
    ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her',
    heightCm: 170, weightKg: 65, personalityTraits: ['spender'], tutorial: false,
  });
  sim.advanceTo(sim.now + 2 * MS_DAY);
  return sim;
}

/**
 * FIXTURE: a second Person, made the way bootstrap makes the player, from a config of their own: born and living in
 * London, 160 cm and 55 kg, Curious and Frugal, Asian, a background and two genres. Only `pronouns` and the names change
 * between them. They are put into the played world under the next id.
 */
function seeded(sim: Simulation, firstName: string, pronouns: string, id = 'person_000002'): Person {
  const config: NewSaveConfig = {
    ...newLifeConfig(), school: undefined, homeRegionId: 'uk-eng-london', startLocationId: 'uk-eng-london', livesWhereBorn: true,
    firstName, lastName: 'Lane', pronouns, heightCm: 160, weightKg: 55, personalityTraits: ['curious', 'frugal'],
    raceEthnicity: ['asian'], genres: ['comedy', 'horror'], background: 'Grew up over a shop in Hackney.',
    startYear: 2026, startMonth: 8, startDay: 24,
  };
  const made = createUniverse(1, `sp-${firstName}`, config);
  const person = { ...made.universe.people[made.playerId]!, id, isPlayer: false, saveId: sim.universe.meta.id };
  sim.universe.people[id] = person;
  return person;
}

/**
 * Every "you" or "your" in the details of a look's ways, but a trait's: none belongs on another person's. A trait's
 * detail is its description, written to the player in the content (`PERSONALITY_TRAITS`, "the day’s food costs you
 * less"), which the look says back as it stands; that is outside this file's rows.
 */
const yous = (seen: Seen) => (seen.ways ?? []).filter((w) => (w.to as { kind: string }).kind !== 'trait').map((w) => w.detail ?? '').filter((d) => /\byou(?:r|rs|rself)?\b/i.test(d));

describe('l-person: another person’s look reads their traits, their condition and their pronouns', () => {
  it('FIXTURE: a she/her second person reads “Who she is.”, “Her body.”, “where she lives”, “On her papers.”, her traits, and dials said of her, none of it the player’s', () => {
    const sim = played();
    const cleo = seeded(sim, 'Cleo', 'she/her');
    const her = look(sim, 'person', cleo.id);
    expect([her.name, her.kind]).toEqual(['Cleo Lane', 'Somebody']);
    expect(her.words).toContain('Who she is. Curious and Frugal.');
    expect(her.words).toContain('Her body. 160 cm and 55.0 kg, with a body mass index of 21.5, in the healthy weight range. In centimeters and kilograms, the units of the United Kingdom, where she lives.');
    expect(her.words).toContain('On her papers. Pronouns she/her. A citizen of the United Kingdom.');
    expect(her.words).toContain('In her own terms. Asian.');
    expect(her.words).toContain('Where she comes from. Grew up over a shop in Hackney.');
    expect(her.words).toContain('The films she loves. Comedy and Horror.');
    expect(her.words).not.toMatch(/\b(?:you|your|they|their)\b/i);
    // Her ways: her own dials, her readiness, her traits and no Your Own Plans; each said of her.
    const labels = her.ways!.map((w) => w.label);
    expect(labels).toEqual(['Energy', 'Stress', 'Sleep Debt', 'Morale', 'Condition', 'Fitness', 'Nourishment', 'Hygiene', 'Readiness', 'Curious', 'Frugal']);
    expect(her.ways!.find((w) => w.label === 'Energy')!.detail).toMatch(/^\d+\/100\. What’s left in her for today\. Sleep brings it back\.$/);
    expect(her.ways!.find((w) => w.label === 'Stress')!.detail).toMatch(/\. How wound up she is\. High stress spoils her sleep\.$/);
    expect(her.ways!.find((w) => w.label === 'Condition')!.detail).toMatch(/\. How sound her body is\. It sets how much energy a night gives back, where her morale settles, when a sick day is excused, and how likely a year is to be her last\.$/);
    expect(her.ways!.find((w) => w.label === 'Fitness')!.detail).toMatch(/\. How trained her body is\. It sets how far rest can mend her condition and how much energy a workout costs\.$/);
    expect(her.ways!.find((w) => w.label === 'Nourishment')!.detail).toMatch(/\. How well fed she is\. A meal puts it back\.$/);
    expect(her.ways!.find((w) => w.label === 'Hygiene')!.detail).toMatch(/\. How clean she is\. When it’s low, it drags on her morale, and on readiness a little\.$/);
    expect(her.ways!.find((w) => w.label === 'Readiness')!.detail).toMatch(/^How ready she is today, from all of these but fitness\. .* and how well her work goes when it’s judged\.$/);
    expect(her.ways!.find((w) => w.label === 'Curious')!.to).toEqual(at('trait', `${cleo.id}/curious`));
    expect(her.ways!.find((w) => w.label === 'Energy')!.to).toEqual(at('dial', `${cleo.id}/energy`));
    expect(yous(her)).toEqual([]);
    // The player's own look in the same world: "you", her units, her trait, her plans.
    const ada = look(sim, 'person', sim.player.id);
    expect(ada.kind).toBe('Yourself');
    expect(ada.words).toContain('Who you are. Spender.');
    expect(ada.words).toContain('Your body. 5 ft 7 in and 143 lb, with a body mass index of 22.5, in the healthy weight range. In feet, inches and pounds, the units of the United States, where you live.');
    expect(ada.words).toContain('On your papers. Pronouns she/her. A citizen of the United States.');
    // Her pronouns are on her papers, and nowhere else on her own look.
    expect(ada.words.replace('On your papers. Pronouns she/her.', '')).not.toMatch(/\b(?:she|her|hers)\b/);
    expect(ada.ways!.map((w) => w.label)).toContain('Your Own Plans');
    expect(ada.ways!.find((w) => w.label === 'Energy')!.detail).toMatch(/\. What’s left in you for today\. Sleep brings it back\.$/);
  });

  it('FIXTURE: the same person under he/him and they/them reads “His body.” and “Their body.”: changing only the pronouns changes the words said of them and nothing else', () => {
    const sim = played();
    const as = (pronouns: string) => {
      seeded(sim, 'Sam', pronouns);
      return look(sim, 'person', 'person_000002');
    };
    const she = as('she/her');
    const he = as('he/him');
    const they = as('they/them');
    expect(he.words).toContain('Who he is. Curious and Frugal.');
    expect(he.words).toContain('His body. 160 cm and 55.0 kg, with a body mass index of 21.5, in the healthy weight range. In centimeters and kilograms, the units of the United Kingdom, where he lives.');
    expect(he.words).toContain('On his papers. Pronouns he/him. A citizen of the United Kingdom.');
    expect(he.words).toContain('Where he comes from. Grew up over a shop in Hackney.');
    expect(he.words).toContain('The films he loves. Comedy and Horror.');
    expect(he.ways!.find((w) => w.label === 'Fitness')!.detail).toMatch(/how far rest can mend his condition and /);
    expect(they.words).toContain('Who they are. Curious and Frugal.');
    expect(they.words).toContain('Their body. 160 cm and 55.0 kg, with a body mass index of 21.5, in the healthy weight range. In centimeters and kilograms, the units of the United Kingdom, where they live.');
    expect(they.words).toContain('The films they love. Comedy and Horror.');
    expect(they.ways!.find((w) => w.label === 'Nourishment')!.detail).toMatch(/How well fed they are\. A meal puts it back\.$/);
    // The three are the same person but for the pronouns: the same name, kind, ways and figures, and words that differ.
    for (const other of [he, they]) {
      expect([other.name, other.kind]).toEqual([she.name, she.kind]);
      expect(other.ways!.map((w) => [w.label, w.to])).toEqual(she.ways!.map((w) => [w.label, w.to]));
      expect(other.words).not.toBe(she.words);
    }
    // The words differ only in the pronouns: each, put back into she/her, is hers.
    const asHers = (words: string, from: Record<string, string>) => words.replace(/\b(?:he|him|his|they|them|their|is|are|lives|live|comes|come|loves|love|He|His|They|Their)\b/g, (w) => from[w] ?? w);
    expect(asHers(he.words.replace('he/him', 'she/her'), { he: 'she', him: 'her', his: 'her', His: 'Her', He: 'She' })).toBe(she.words);
    expect(asHers(they.words.replace('they/them', 'she/her'), { they: 'she', them: 'her', their: 'her', Their: 'Her', They: 'She', are: 'is', live: 'lives', come: 'comes', love: 'loves' })).toBe(she.words);
  });

  it('FIXTURE: her trait opens as A Trait She Holds, “with all she is”; his condition as A Condition He Carries, “He leaves it alone” and “He keeps it up … his plan”; her injury “keeps her off work”', () => {
    const sim = played();
    const cleo = seeded(sim, 'Cleo', 'she/her');
    const dev = seeded(sim, 'Dev', 'he/him', 'person_000003');
    // FIXTURE: Dev carries depression, left alone, and asthma, kept up; Cleo's broken bone mends at noon on 5 September.
    dev.health = { ...dev.health, chronic: { depression: { treated: false }, asthma: { treated: true } } } as typeof dev.health;
    const mends = Date.UTC(2026, 8, 5, 16);
    cleo.health = { ...cleo.health, injury: { kind: 'fracture', at: sim.now, until: mends, offWorkUntil: mends } } as typeof cleo.health;

    const curious = look(sim, 'person', cleo.id).ways!.find((w) => w.label === 'Curious')!;
    const trait = resolveLook(sim, curious.to as never) as Seen;
    expect(trait.kind).toBe('Her Trait');
    expect(trait.parent).toEqual(at('person', cleo.id));
    expect(trait.provenance).toMatch(/^Each figure is the trait’s own\. “All told” is her traits and dispositions taken together/);
    const frugal = look(sim, 'trait', `${cleo.id}/frugal`);
    expect(frugal.kind).toBe('Her Trait');
    expect(frugal.words).toContain(' all told');
    expect(frugal.words).not.toMatch(/with all (?:you|they) are/);
    // The player's own Frugal, not held, is still "A Trait", under her own look.
    expect(look(sim, 'trait', 'frugal').kind).toBe('A Trait');

    const devs = look(sim, 'person', dev.id);
    expect(devs.ways!.filter((w) => (w.to as { kind: string }).kind === 'condition').map((w) => [w.label, w.detail])).toEqual([
      ['Depression', 'Left untreated, and what that does.'],
      ['Asthma', 'Kept up, and he pays what his plan doesn’t cover.'],
    ]);
    const depression = look(sim, 'condition', `${dev.id}/depression`);
    expect([depression.name, depression.kind, depression.summary]).toEqual(['Depression', 'A Long-Term Condition', 'He’s leaving it untreated. That costs nothing, but it has the effects below.']);
    expect(depression.parent).toEqual(at('person', dev.id));
    expect(depression.ways!.map((w) => w.to)).toEqual([at('dial', `${dev.id}/morale`)]);
    const asthma = look(sim, 'condition', `${dev.id}/asthma`);
    expect([asthma.kind, asthma.summary]).toEqual(['A Long-Term Condition', 'He’s keeping it up, and each month he pays the part of its care his plan doesn’t cover.']);
    expect(asthma.words).not.toContain('Keep It Up or Let It Go');

    const hers = look(sim, 'person', cleo.id);
    expect(hers.words).toContain('Mending. A broken bone, until September 5, 2026, and laid up until then.');
    expect(hers.ways!.find((w) => w.label === 'An Injury')!.detail).toBe('What it is, when it mends, and what it keeps her from.');
    const injury = look(sim, 'condition', `${cleo.id}/injury`);
    expect([injury.name, injury.kind, injury.summary]).toEqual(['A Broken Bone', 'An Injury', 'It mends by September 5, 2026. Until then she’s laid up, kept from classes, work and training.']);
    expect(yous(hers)).toEqual([]);
    expect(yous(devs)).toEqual([]);

    // Across a save and a load the world keeps them, and their looks read the same.
    const again = reload(sim);
    expect(Object.keys(again.universe.people).sort()).toEqual([sim.player.id, cleo.id, dev.id].sort());
    expect(look(again, 'person', cleo.id).words).toBe(hers.words);
    expect(look(again, 'condition', `${dev.id}/depression`).summary).toBe(depression.summary);
    // And the clock past the mend date takes the injury from her look.
    again.advanceTo(mends + MS_DAY);
    expect(look(again, 'person', cleo.id).ways!.map((w) => w.label)).not.toContain('An Injury');
  });

  /**
   * The dial and Readiness looks her ways open, one press from her look, said of her (from 2026-10-15). Until then each
   * was in the second person whoever it belonged to: her Energy read "you’ve a full day in you", her Condition "the
   * likelier a year is to be your last", and her Readiness was "How Well You Would Do Today" and "what’s costing you".
   * The player's own stay as they were, word for word (tests/evidence-g06-life.test.ts holds them).
   */
  it('FIXTURE: her dials and her Readiness, opened from her look, say “she” and “her”, his say “he”, theirs “they”; the player’s still say “you”', () => {
    const sim = played();
    const cleo = seeded(sim, 'Cleo', 'she/her');
    const dev = seeded(sim, 'Dev', 'he/him', 'person_000003');
    const kit = seeded(sim, 'Kit', 'they/them', 'person_000004');
    // FIXTURE: the dials written on by hand, so each sentence's branch is known: energy over 75, sleep debt under 2,
    // hygiene at 44, under fifty.
    for (const one of [cleo, dev, kit, sim.player]) one.wellbeing = { ...one.wellbeing, energy: 90, sleepDebt: 1, hygiene: 44 };
    const dialOf = (who: Person, key: string) => {
      const way = look(sim, 'person', who.id).ways!.find((w) => (w.to as { id: string }).id === `${who.id}/${key}`)!;
      return resolveLook(sim, way.to as never) as Seen;
    };
    const hers = (key: string) => dialOf(cleo, key).summary!;
    expect(hers('energy')).toBe('90. Plenty for a full day.');
    expect(hers('sleepDebt')).toBe('None to speak of. She’s caught up on sleep.');
    expect(hers('hygiene')).toBe('44. Under 50, it wears on her morale every hour. A shower puts it back. The morning shower brings it up to at least 82.');
    expect(hers('condition')).toMatch(/^\d+\. (?:As sound as rest can make her at her fitness\.|Rest can mend it to \d+ at her fitness,).* The lower it is, the likelier a year is to be her last\.$/);
    expect(hers('fitness')).toMatch(/^\d+\. At this fitness, rest can mend her condition to \d+, and a workout costs \d+ energy\./);
    expect(dialOf(dev, 'energy').summary).toBe('90. Plenty for a full day.');
    expect(dialOf(dev, 'sleepDebt').summary).toBe('None to speak of. He’s caught up on sleep.');
    expect(dialOf(kit, 'energy').summary).toBe('90. Plenty for a full day.');
    expect(dialOf(kit, 'sleepDebt').summary).toBe('None to speak of. They’re caught up on sleep.');
    expect(dialOf(kit, 'hygiene').summary).toMatch(/wears on their morale every hour/);
    // At 30 and 86 the other branches: running down, and clean enough.
    cleo.wellbeing = { ...cleo.wellbeing, energy: 30, hygiene: 86 };
    expect(hers('energy')).toBe('30. She’s running low, and it pulls readiness down. Under 15, stress starts to climb.');
    expect(hers('hygiene')).toBe('86. Clean enough not to bother her. The morning shower brings it up to at least 82.');
    // None of the eight, for any of the three, says "you".
    for (const who of [cleo, dev, kit]) {
      for (const key of ['energy', 'stress', 'sleepDebt', 'morale', 'condition', 'fitness', 'nourishment', 'hygiene']) {
        expect(dialOf(who, key).summary, `${who.firstName}'s ${key}`).not.toMatch(/\byou(?:r|’re|’ve)?\b/i);
      }
    }

    // Her Readiness, from her look's way: of her, and naming energy at 30 among what's costing her.
    const readyWay = look(sim, 'person', cleo.id).ways!.find((w) => w.label === 'Readiness')!;
    const ready = resolveLook(sim, readyWay.to as never) as Seen;
    expect(ready.kind).toBe('How Ready She Is Today');
    expect(ready.parent).toEqual(at('person', cleo.id));
    expect(ready.summary).toMatch(/^\d+\. .*[Ee]nergy.* holding her back most\.$/);
    expect(ready.ways!.map((w) => w.to)).toContainEqual(at('dial', `${cleo.id}/energy`));
    expect(look(sim, 'readiness', dev.id).kind).toBe('How Ready He Is Today');
    expect(look(sim, 'readiness', kit.id).kind).toBe('How Ready They Are Today');

    // The player's own, in the same world, are as they were.
    expect(dialOf(sim.player, 'energy').summary).toBe('90. Plenty for a full day.');
    expect(dialOf(sim.player, 'sleepDebt').summary).toBe('None to speak of. You’re caught up on sleep.');
    expect(dialOf(sim.player, 'hygiene').summary).toBe('44. Under 50, it wears on your morale every hour. A shower puts it back. The morning shower brings it up to at least 82.');
    expect(look(sim, 'readiness', sim.player.id).kind).toBe('How Ready You Are Today');

    // Her look's own summary, at energy under fifteen, says nothing to the player of her sleep (until 2026-10-15
    // “You need sleep before anything else.”); the player's, at the same energy, still does.
    for (const one of [cleo, sim.player]) one.wellbeing = { ...one.wellbeing, energy: 10 };
    expect(look(sim, 'person', cleo.id).summary).toBe('Running on empty. Sleep comes before anything else.');
    expect(look(sim, 'person', sim.player.id).summary).toBe('Running on empty. You need sleep before anything else.');
  });
});
