/**
 * The once in a lifetime one.
 *
 * The founder is the best living writer, director, producer, showrunner and
 * actor at the same time. Nobody has ever been two of those. So the instrument
 * does not climb: it starts at the ceiling of every scale the game has, every
 * profession is already open at the top of its ladder, and they hold every
 * trait in the game at once — all fourteen G.O.A.T. ones, all nineteen
 * producing ones, and every acting and profession trait there is.
 *
 * There is no cheat mode in this build. These tests hold that too — a command
 * that hands out money or attributes is not something to leave lying around,
 * and there is nothing left for one to give.
 */

import { describe, expect, it } from 'vitest';
import { migrate, quickSave, validateUniverse } from '@/engine';
import { ALL_TRAITS, ATTRIBUTES, attributesOf, modifierFor, skillsOf } from '@/engine/domain/attributes';
import { SKILLS } from '@/engine/domain/skills';
import { LEVEL_XP, MAX_PROFESSION_LEVEL, PROFESSIONS, levelFor } from '@/engine/content/professions';
import { PROFESSION_TRAITS } from '@/engine/domain/attributes';
import { FOUNDER_ATTRIBUTES, FOUNDER_TRAITS, conflictingFounderTraits } from '@/engine/content/founder';
import { founderScore } from '@/engine/systems/shingle';
import {
  CEILING, DISCIPLINES, DISCIPLINE_LABEL, GOAT_TRAITS, GOAT_TRAIT_BY_ID, POSITIONS, goatTraitsIn,
} from '@/engine/content/prodigy';

const aGame = (seed: string) => quickSave({}, seed);

describe('maxed at everything, from the first minute', () => {
  it('starts every one of the 88 acting attributes at the ceiling', () => {
    const sim = aGame('prodigy-attributes');
    for (const attribute of ATTRIBUTES) {
      expect(sim.player.attributes[attribute.id], attribute.id).toBe(CEILING);
    }
    expect(ATTRIBUTES.length).toBe(88);
  });

  it('starts every skill in every domain at the ceiling', () => {
    const sim = aGame('prodigy-skills');
    for (const skill of SKILLS) {
      expect(sim.player.skills[skill.id], skill.id).toBe(CEILING);
    }
  });

  it('starts the producer’s instrument at the ceiling too', () => {
    const sim = aGame('prodigy-founder');
    for (const attribute of FOUNDER_ATTRIBUTES) {
      expect(sim.player.founder?.[attribute.id], attribute.id).toBe(CEILING);
    }
  });

  it('opens every profession at the top of its ladder', () => {
    const sim = aGame('prodigy-professions');
    for (const def of PROFESSIONS) {
      const held = sim.player.professions?.[def.id];
      expect(held, def.id).toBeDefined();
      expect(levelFor(held!.xp), def.id).toBe(MAX_PROFESSION_LEVEL);
      expect(held!.xp).toBe(LEVEL_XP[LEVEL_XP.length - 1]);
      // And its trait slots are filled, not left open.
      expect(held!.traitIds.length, def.id).toBeGreaterThan(0);
    }
  });

  it('is the best living writer, director, producer, showrunner, actor and runner at once', () => {
    const sim = aGame('prodigy-five');
    for (const discipline of DISCIPLINES) {
      const traits = goatTraitsIn(discipline);
      expect(traits.length, discipline).toBeGreaterThan(0);
      for (const trait of traits) {
        expect(sim.player.founderTraits, `${DISCIPLINE_LABEL[discipline]}: ${trait.id}`).toContain(trait.id);
      }
    }
  });

  it('holds all sixteen G.O.A.T. traits', () => {
    const sim = aGame('prodigy-goat');
    expect(GOAT_TRAITS).toHaveLength(16);
    for (const trait of GOAT_TRAITS) {
      expect(sim.player.founderTraits).toContain(trait.id);
    }
  });
});

describe('the G.O.A.T. traits themselves', () => {
  it('are all compatible, because holding all of them is the point', () => {
    const held: string[] = [];
    for (const trait of GOAT_TRAITS) {
      expect(conflictingFounderTraits(held, trait.id), trait.id).toEqual([]);
      held.push(trait.id);
    }
  });

  it('each say what they are, in Title Case, once', () => {
    const ids = GOAT_TRAITS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const trait of GOAT_TRAITS) {
      expect(trait.description.length, trait.id).toBeGreaterThan(30);
      expect(DISCIPLINES).toContain(trait.discipline);
      for (const word of trait.name.split(' ')) {
        if (['a', 'an', 'the', 'of', 'on', 'and', 'you', 'it'].includes(word.toLowerCase())) continue;
        expect(word[0], trait.name).toBe(word[0]!.toUpperCase());
      }
    }
  });

  it('cover every one of the six disciplines', () => {
    for (const discipline of DISCIPLINES) {
      expect(goatTraitsIn(discipline).length, discipline).toBeGreaterThanOrEqual(2);
    }
    expect(GOAT_TRAITS.every((t) => GOAT_TRAIT_BY_ID[t.id] === t)).toBe(true);
  });

  it('belong to nobody else in the world', () => {
    const sim = aGame('prodigy-unique');
    const goat = new Set(GOAT_TRAITS.map((t) => t.id));
    for (const person of Object.values(sim.universe.people)) {
      if (person.isPlayer) continue;
      for (const held of person.founderTraits ?? []) {
        expect(goat.has(held), `${person.displayName} holds ${held}`).toBe(false);
      }
    }
  });
});

describe('every trait in the game, held at once', () => {
  it('holds every acting and profession trait there is', () => {
    const sim = aGame('prodigy-every-trait');
    expect(sim.player.traits).toHaveLength(ALL_TRAITS.length);
    for (const trait of ALL_TRAITS) expect(sim.player.traits, trait.id).toContain(trait.id);
  });

  it('holds every producing trait, G.O.A.T. and ordinary alike', () => {
    const sim = aGame('prodigy-every-founder-trait');
    const held = sim.player.founderTraits ?? [];
    for (const trait of [...GOAT_TRAITS, ...FOUNDER_TRAITS]) expect(held, trait.id).toContain(trait.id);
    expect(held).toHaveLength(GOAT_TRAITS.length + FOUNDER_TRAITS.length);
  });

  it('fills every trait slot on every profession', () => {
    const sim = aGame('prodigy-profession-traits');
    for (const def of PROFESSIONS) {
      const mine = PROFESSION_TRAITS.filter((t) => t.profession === def.id).map((t) => t.id);
      expect(sim.player.professions?.[def.id]?.traitIds, def.id).toEqual(mine);
    }
  });

  it('is marked as the one it applies to, and is the only one', () => {
    const sim = aGame('prodigy-flag');
    expect(sim.player.prodigy).toBe(true);
    for (const person of Object.values(sim.universe.people)) {
      if (person.isPlayer) continue;
      expect(person.prodigy, person.displayName).toBeFalsy();
    }
  });

  it('still reads at the ceiling on every sheet, because a trait costs them nothing', () => {
    const sim = aGame('prodigy-effective');
    // The acting sheet. Half these traits carry a penalty for anybody else.
    for (const attribute of ATTRIBUTES) {
      expect(attributesOf(sim.player)[attribute.id], attribute.id).toBe(CEILING);
    }
    // Every skill.
    const skills = skillsOf(sim.player);
    for (const skill of SKILLS) expect(skills[skill.id], skill.id).toBe(CEILING);
    // And the producing instrument, which has its own trait set.
    for (const attribute of FOUNDER_ATTRIBUTES) {
      expect(founderScore(sim, attribute.id), attribute.id).toBe(CEILING);
    }
  });

  it('never takes the wrong side of a system multiplier', () => {
    const sim = aGame('prodigy-modifiers');
    // Higher is worse on these, so holding every trait must not raise them.
    for (const key of ['stressPerShootDay', 'injuryRisk', 'relationshipDecay']) {
      expect(modifierFor(sim.player, key), key).toBeLessThanOrEqual(1);
    }
    // And higher is better on these, so it must not lower them.
    for (const key of ['recoveryRate', 'trainingGain', 'viralOdds']) {
      expect(modifierFor(sim.player, key), key).toBeGreaterThanOrEqual(1);
    }
  });

  it('still applies both sides of a multiplier to everybody else', () => {
    const sim = aGame('prodigy-others');
    const other = Object.values(sim.universe.people).find((p) => !p.isPlayer);
    expect(other).toBeDefined();
    expect(other!.prodigy).toBeFalsy();
    // Nobody else holds the whole set, so nobody else gets the exemption.
    expect(other!.traits.length).toBeLessThan(ALL_TRAITS.length);
  });
});

describe('the five positions', () => {
  it('name every scale the game keeps for that job', () => {
    expect(POSITIONS).toHaveLength(DISCIPLINES.length);
    for (const position of POSITIONS) {
      expect(DISCIPLINES, position.id).toContain(position.id);
      const measures = position.skillDomains.length + position.attributeGroups.length + (position.producerSheet ? 1 : 0);
      expect(measures, `${position.name} measures nothing`).toBeGreaterThan(0);
    }
  });

  it('cover every skill domain and every attribute group between them', () => {
    const domains = new Set(POSITIONS.flatMap((p) => p.skillDomains));
    for (const skill of SKILLS) expect(domains, skill.domain).toContain(skill.domain);
    const groups = new Set(POSITIONS.flatMap((p) => p.attributeGroups));
    for (const attribute of ATTRIBUTES) expect(groups, attribute.group).toContain(attribute.group);
  });
});

describe('there is no cheat mode left', () => {
  it('has no sandbox on the universe at all', () => {
    const sim = aGame('prodigy-nosandbox');
    expect((sim.universe as unknown as Record<string, unknown>)['sandbox']).toBeUndefined();
  });

  it('refuses every command that used to hand things out', () => {
    const sim = aGame('prodigy-nocheat');
    for (const kind of [
      'sandbox.toggle', 'sandbox.god_mode', 'sandbox.add_funds',
      'sandbox.max_attributes', 'sandbox.grant_all_traits',
      'sandbox.unlock_professions', 'sandbox.stage_picture', 'sandbox.stage_audition',
    ]) {
      const result = sim.execute({ kind, payload: { enabled: true, amount: 1_000_000_00 } });
      expect(result.ok, `${kind} still exists`).toBe(false);
    }
  });

  it('strips the sandbox block off a save that still carries one', () => {
    const sim = aGame('prodigy-migrate');
    const universe = sim.universe as unknown as Record<string, unknown>;
    universe['sandbox'] = { enabled: true, godMode: true, log: [{ at: 0, action: 'old' }] };
    sim.universe.meta.schemaVersion = 25;
    const result = migrate(sim.universe);
    expect(result.migrated).toBe(true);
    expect(universe['sandbox'], 'the old cheat block came through the migration').toBeUndefined();
  });
});

describe('being the best is not the same as being safe', () => {
  it('still has to pay the overhead every month', () => {
    const sim = aGame('prodigy-overhead');
    const company = sim.universe.companies[sim.universe.playerCompanyId!];
    expect(company).toBeDefined();
    expect(company!.overhead).toBeGreaterThan(0);
  });

  it('survives a save and a load with the whole instrument intact', () => {
    const sim = aGame('prodigy-save');
    const round = JSON.parse(JSON.stringify(sim.universe)) as typeof sim.universe;
    expect(validateUniverse(round).ok).toBe(true);
    const player = round.people[round.playerId]!;
    expect(Object.values(player.attributes).every((v) => v === CEILING)).toBe(true);
    expect(player.founderTraits?.length).toBeGreaterThanOrEqual(GOAT_TRAITS.length);
    expect(Object.keys(player.professions ?? {})).toHaveLength(PROFESSIONS.length);
  });
});
