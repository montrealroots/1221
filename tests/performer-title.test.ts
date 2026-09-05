/**
 * Actor, or actress.
 *
 * The business has always kept the two words apart — separate awards,
 * separate categories, separate columns in a trade paper — so the game keeps
 * them apart too, and every label about a person uses their word. A woman who
 * creates a character gets an actress everywhere an actor would have been.
 *
 * It is a word and not a stat. These tests hold both halves of that: that the
 * word follows the person everywhere it is printed, and that nothing about
 * what they can do branches on it.
 */

import { describe, expect, it } from 'vitest';
import { createSave, defaultConfig, quickSave, careerLabel } from '@/engine';
import {
  PERFORMER_NOUN, categoryAdmits, forTitle, impliedPerformerTitle,
  performerNoun, performerTitleOf, splitByTitle,
} from '@/engine/core/performer';
import { ALL_TRAITS, ATTRIBUTES, attributesOf, traitName } from '@/engine/domain/attributes';
import { SKILLS } from '@/engine/domain/skills';
import { CEILING } from '@/engine/content/prodigy';
import { jobSheet } from '@/engine/systems/authorship';
import { AFTERMATH, OPENING_BRIEF, OPENING_LINE } from '@/engine/content/strike';
import { JOB_DEFS, STORY_DEPARTMENTS } from '@/engine/content/authorship';
import { GOAT_TRAITS } from '@/engine/content/prodigy';

/** The same character, made twice, differing only in the word she or he uses. */
function pair(seed: string) {
  const base = { ...defaultConfig(), firstName: 'Robin', lastName: 'Vance', companyName: 'Vance Pictures' };
  const actress = createSave(1, seed, { ...base, pronouns: 'she/her' });
  const actor = createSave(2, seed, { ...base, pronouns: 'he/him' });
  return { actress, actor };
}

describe('the word follows the person', () => {
  it('is taken from pronouns when nothing else is stated', () => {
    expect(impliedPerformerTitle('she/her')).toBe('actress');
    expect(impliedPerformerTitle('he/him')).toBe('actor');
    expect(impliedPerformerTitle('they/them')).toBe('actor');
    // Never guessed from a name.
    expect(impliedPerformerTitle('')).toBe('actor');
  });

  it('is overridden by a title the person carries, whatever their pronouns', () => {
    expect(performerTitleOf({ pronouns: 'she/her', performerTitle: 'actor' })).toBe('actor');
    expect(performerTitleOf({ pronouns: 'he/him', performerTitle: 'actress' })).toBe('actress');
  });

  it('reaches the career label, which is what the Character page prints', () => {
    const { actress, actor } = pair('title-career');
    expect(careerLabel('actor', performerTitleOf(actress.player))).toBe('Actress');
    expect(careerLabel('actor', performerTitleOf(actor.player))).toBe('Actor');
    // Every other track reads the same for everybody.
    for (const title of ['actor', 'actress'] as const) {
      expect(careerLabel('director', title)).toBe('Director');
      expect(careerLabel('showrunner', title)).toBe('Showrunner');
    }
  });

  it('reaches the save slot, which is the label before the save is even opened', () => {
    const { actress, actor } = pair('title-slot');
    expect(actress.universe.meta.careerLabel).toBe('Actress');
    expect(actor.universe.meta.careerLabel).toBe('Actor');
  });

  it('reaches every trait that carries the word', () => {
    const { actress, actor } = pair('title-traits');
    const gendered = ALL_TRAITS.filter((t) => t.nameByTitle);
    expect(gendered.length, 'no trait carries the word at all').toBeGreaterThan(0);
    for (const trait of gendered) {
      expect(traitName(trait, actress.player), trait.id).toBe(trait.nameByTitle!.actress);
      expect(traitName(trait, actor.player), trait.id).toBe(trait.nameByTitle!.actor);
      expect(traitName(trait, actress.player)).not.toBe(traitName(trait, actor.player));
    }
    // And the ones that do not carry it read the same for both.
    for (const trait of ALL_TRAITS.filter((t) => !t.nameByTitle)) {
      expect(traitName(trait, actress.player)).toBe(traitName(trait, actor.player));
    }
  });

  it('picks the right half of a label written with both', () => {
    expect(forTitle('Method Actor/Actress', 'actress')).toBe('Method Actress');
    expect(forTitle('Method Actor/Actress', 'actor')).toBe('Method Actor');
    expect(performerNoun({ pronouns: 'she/her' })).toBe('Actress');
    expect(PERFORMER_NOUN['actress']).toBe('Actress');
  });

  it('opens the right award categories and closes the wrong ones', () => {
    expect(categoryAdmits('Best Actress', 'actress')).toBe(true);
    expect(categoryAdmits('Best Actress', 'actor')).toBe(false);
    expect(categoryAdmits('Best Actor', 'actress')).toBe(false);
    // A category naming neither takes anybody.
    expect(categoryAdmits('Best Performance', 'actress')).toBe(true);
    expect(categoryAdmits('Best Performance', 'actor')).toBe(true);
  });

  it('splits a list into two columns and keeps everybody', () => {
    const people = [
      { id: 'a', pronouns: 'she/her' }, { id: 'b', pronouns: 'he/him' },
      { id: 'c', pronouns: 'they/them' }, { id: 'd', pronouns: 'she/her' },
    ];
    const { actors, actresses } = splitByTitle(people);
    expect(actresses.map((p) => p.id)).toEqual(['a', 'd']);
    expect(actors.map((p) => p.id)).toEqual(['b', 'c']);
    expect(actors.length + actresses.length).toBe(people.length);
  });
});

describe('and nothing else about her differs', () => {
  it('gives an actress the same ceiling on every sheet', () => {
    const { actress, actor } = pair('title-sheets');
    for (const attribute of ATTRIBUTES) {
      expect(attributesOf(actress.player)[attribute.id], attribute.id).toBe(CEILING);
      expect(actress.player.attributes[attribute.id]).toBe(actor.player.attributes[attribute.id]);
    }
    for (const skill of SKILLS) {
      expect(actress.player.skills[skill.id], skill.id).toBe(CEILING);
    }
    expect(actress.player.traits).toEqual(actor.player.traits);
    expect(actress.player.founderTraits).toEqual(actor.player.founderTraits);
    expect(actress.player.prodigy).toBe(true);
  });

  it('gives her the same five jobs at the same hundred', () => {
    const { actress } = pair('title-jobs');
    for (const row of jobSheet(actress)) expect(row.capability, row.name).toBe(CEILING);
  });

  it('gives her the same company, on the same morning, wholly owned', () => {
    const { actress, actor } = pair('title-company');
    for (const [label, sim] of [['actress', actress], ['actor', actor]] as const) {
      const company = sim.universe.companies[sim.universe.playerCompanyId!];
      expect(company, label).toBeDefined();
      expect(company!.foundedAt, label).toBe(sim.universe.meta.createdAt);
      expect(company!.ownerships[0]?.holderId, label).toBe(sim.player.id);
      expect(company!.ownerships[0]?.percent, label).toBe(1);
    }
    expect(actress.universe.accounts[actress.universe.companies[actress.universe.playerCompanyId!]!.cashAccountId]?.balance)
      .toBe(actor.universe.accounts[actor.universe.companies[actor.universe.playerCompanyId!]!.cashAccountId]?.balance);
  });

  it('reads the same in a live save built the ordinary way', () => {
    const sim = quickSave({}, 'title-live');
    sim.player.pronouns = 'she/her';
    delete sim.player.performerTitle;
    expect(performerNoun(sim.player)).toBe('Actress');
    expect(careerLabel(sim.player.careerTrack, performerTitleOf(sim.player))).toBe('Actress');
  });
});

describe('nothing in the copy leaves the women out', () => {
  it('never names the job in general with only one of the two words', () => {
    // Every string a player reads that refers to performers as a group has to
    // name both. A trait with a nameByTitle is exempt: it carries one word
    // because it is one person's, and forTitle picks the right half.
    const strings: [string, string][] = [
      ...AFTERMATH.flatMap((f) => [[f.id, f.headline] as [string, string], [f.id, f.detail] as [string, string]]),
      ...OPENING_BRIEF.map((b, i) => [`brief-${i}`, b] as [string, string]),
      ['opening-line', OPENING_LINE],
      ...STORY_DEPARTMENTS.map((d) => [d.id, d.what] as [string, string]),
      ...JOB_DEFS.map((j) => [j.id, j.owns] as [string, string]),
      ...GOAT_TRAITS.map((t) => [t.id, t.description] as [string, string]),
      ...ALL_TRAITS.filter((t) => !t.nameByTitle).map((t) => [t.id, t.description] as [string, string]),
    ];
    const offenders: string[] = [];
    for (const [id, text] of strings) {
      // Strip the paired forms, then look for a bare one left behind.
      const stripped = text
        .replace(/actors?\/actress(es)?/gi, '')
        .replace(/actors? and actress(es)?/gi, '');
      if (/\bactor(s)?\b/i.test(stripped)) offenders.push(`${id}: ${text.slice(0, 70)}`);
    }
    expect(offenders, 'these say actor without actress').toEqual([]);
  });
});
