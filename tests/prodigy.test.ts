/**
 * The once in a lifetime one.
 *
 * The founder is the best living writer, director, producer, showrunner and
 * actor at the same time. Nobody has ever been two of those. So the instrument
 * does not climb: it starts at the ceiling of every scale the game has, every
 * profession is already open at the top of its ladder, and they hold all
 * fourteen G.O.A.T. traits.
 *
 * There is no cheat mode in this build. These tests hold that too — a command
 * that hands out money or attributes is not something to leave lying around,
 * and there is nothing left for one to give.
 */

import { describe, expect, it } from 'vitest';
import { migrate, quickSave, validateUniverse } from '@/engine';
import { ALL_TRAITS, ATTRIBUTES, conflictingTraits, effectiveAttributes } from '@/engine/domain/attributes';
import { SKILLS } from '@/engine/domain/skills';
import { LEVEL_XP, MAX_PROFESSION_LEVEL, PROFESSIONS, levelFor } from '@/engine/content/professions';
import { FOUNDER_ATTRIBUTES, conflictingFounderTraits } from '@/engine/content/founder';
import {
  CEILING, DISCIPLINES, DISCIPLINE_LABEL, GOAT_TRAITS, GOAT_TRAIT_BY_ID, goatTraitsIn,
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

  it('is the best living writer, director, producer, showrunner and actor at once', () => {
    const sim = aGame('prodigy-five');
    for (const discipline of DISCIPLINES) {
      const traits = goatTraitsIn(discipline);
      expect(traits.length, discipline).toBeGreaterThan(0);
      for (const trait of traits) {
        expect(sim.player.founderTraits, `${DISCIPLINE_LABEL[discipline]}: ${trait.id}`).toContain(trait.id);
      }
    }
  });

  it('holds all fourteen G.O.A.T. traits', () => {
    const sim = aGame('prodigy-goat');
    expect(GOAT_TRAITS).toHaveLength(14);
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

  it('each say what they are and what the business says about them', () => {
    const ids = GOAT_TRAITS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    for (const trait of GOAT_TRAITS) {
      expect(trait.description.length, trait.id).toBeGreaterThan(30);
      expect(trait.saidOfYou.length, trait.id).toBeGreaterThan(30);
      expect(DISCIPLINES).toContain(trait.discipline);
      for (const word of trait.name.split(' ')) {
        if (['a', 'an', 'the', 'of', 'on', 'and', 'you', 'it'].includes(word.toLowerCase())) continue;
        expect(word[0], trait.name).toBe(word[0]!.toUpperCase());
      }
    }
  });

  it('cover every one of the five disciplines', () => {
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

describe('the rules of the world still hold', () => {
  it('keeps mutually exclusive acting traits mutually exclusive, even for them', () => {
    const sim = aGame('prodigy-conflicts');
    const held = sim.player.traits;
    for (const id of held) {
      const clashes = conflictingTraits(held.filter((t) => t !== id), id);
      expect(clashes, `${id} is held alongside ${clashes.join(', ')}`).toEqual([]);
    }
    // And they hold a great many of them, because most do not contradict.
    expect(held.length).toBeGreaterThan(ALL_TRAITS.length / 3);
  });

  it('keeps mutually exclusive producing traits mutually exclusive', () => {
    const sim = aGame('prodigy-founder-conflicts');
    const held = sim.player.founderTraits ?? [];
    for (const id of held) {
      expect(conflictingFounderTraits(held.filter((t) => t !== id), id), id).toEqual([]);
    }
  });

  it('reads at the ceiling once traits are applied, and never above it', () => {
    const sim = aGame('prodigy-effective');
    const effective = effectiveAttributes(sim.player.attributes, sim.player.traits);
    for (const [id, value] of Object.entries(effective)) {
      expect(value, id).toBeLessThanOrEqual(CEILING);
      expect(value, id).toBeGreaterThanOrEqual(0);
    }
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
