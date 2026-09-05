/**
 * Professions: unlocked with experience, developed by doing the work.
 *
 * Three claims. The data is sound — every skill a profession develops
 * exists, every trait modifies real skills, every prerequisite is a real
 * profession. Unlocking is a guarded, idempotent mutation — not enough
 * experience is refused, prerequisites are enforced, and a retried unlock
 * cannot spend twice. And experience is earned from real work in a live
 * universe — a draft written by the player raises their writing, a shift
 * worked raises industry experience — never from a UI saying so.
 */

import { describe, expect, it } from 'vitest';
import { quickSave, migrate } from '@/engine';
import {
  LEVEL_XP, MAX_PROFESSION_LEVEL, PROFESSIONS, PROFESSION_BY_ID, TRAIT_SLOT_LEVELS,
  levelFor, traitSlotsAt, xpToNextLevel,
} from '@/engine/content/professions';
import { PROFESSION_TRAITS, TRAIT_BY_ID, traitsForProfession } from '@/engine/domain/attributes';
import { SKILLS } from '@/engine/domain/skills';
import { SAVE_SCHEMA_VERSION } from '@/engine/domain/model';

const SKILL_IDS = new Set(SKILLS.map((s) => s.id));

describe('the professions on offer', () => {
  it('develop skills that exist', () => {
    for (const def of PROFESSIONS) {
      expect(def.skillIds.length, def.id).toBeGreaterThan(3);
      for (const id of def.skillIds) expect(SKILL_IDS.has(id), `${def.id} develops unknown skill ${id}`).toBe(true);
    }
  });

  it('require only professions that are offered, and never themselves', () => {
    for (const def of PROFESSIONS) {
      for (const required of def.requires) {
        expect(PROFESSION_BY_ID[required], `${def.id} requires unknown ${required}`).toBeTruthy();
        expect(required).not.toBe(def.id);
      }
    }
  });

  it('each have traits, as acting does, and every trait belongs to one of them', () => {
    for (const def of PROFESSIONS) {
      expect(traitsForProfession(def.id).length, `${def.id} has no traits`).toBeGreaterThanOrEqual(6);
    }
    for (const trait of PROFESSION_TRAITS) {
      expect(trait.profession && PROFESSION_BY_ID[trait.profession], `${trait.id} belongs to no profession`).toBeTruthy();
      expect(Object.keys(trait.skillMods ?? {}).length, `${trait.id} changes nothing`).toBeGreaterThan(0);
    }
  });

  it('level on widening thresholds, up to a top', () => {
    for (let i = 1; i < LEVEL_XP.length; i++) {
      expect((LEVEL_XP[i] ?? 0) - (LEVEL_XP[i - 1] ?? 0)).toBeGreaterThan((LEVEL_XP[i - 1] ?? 0) - (LEVEL_XP[i - 2] ?? 0));
    }
    expect(levelFor(0)).toBe(1);
    expect(levelFor(LEVEL_XP[1] ?? 0)).toBe(2);
    expect(levelFor((LEVEL_XP[1] ?? 0) - 1)).toBe(1);
    expect(levelFor(1_000_000)).toBe(MAX_PROFESSION_LEVEL);
    expect(xpToNextLevel(0)).toBe(LEVEL_XP[1]);
    expect(xpToNextLevel(1_000_000)).toBe(0);
  });

  it('open four trait slots across the levels', () => {
    expect(TRAIT_SLOT_LEVELS).toHaveLength(4);
    expect(traitSlotsAt(1)).toBe(1);
    expect(traitSlotsAt(MAX_PROFESSION_LEVEL)).toBe(4);
    expect(traitSlotsAt(0)).toBe(0);
  });
});

/**
 * The founder has every profession already, so the ladder is exercised from a
 * blank slate — which is what somebody they hire looks like on their first day.
 */
function blankSlate(seed: string) {
  const sim = quickSave({}, seed);
  sim.player.professions = {};
  sim.player.industryXp = 0;
  return sim;
}

describe('unlocking', () => {
  it('starts the founder with every profession at the top', () => {
    const sim = quickSave({}, 'professions-start');
    expect(sim.player.careerTrack).toBe('actor');
    // Nothing is left to earn: they are the best living one of each.
    expect(Object.keys(sim.player.professions ?? {})).toHaveLength(PROFESSIONS.length);
    for (const def of PROFESSIONS) {
      expect(sim.player.professions?.[def.id]?.xp, def.id).toBeGreaterThan(0);
    }
  });

  it('refuses without enough experience, and says how much it takes', () => {
    const sim = blankSlate('professions-poor');
    sim.player.industryXp = 10;
    const result = sim.execute({ kind: 'profession.unlock', payload: { professionId: 'writer' } });
    expect(result.ok).toBe(false);
    expect(result.error).toMatch(/400/);
    expect(sim.player.professions?.writer).toBeUndefined();
    expect(sim.player.industryXp).toBe(10);
  });

  it('spends the experience once, and a retry with the same key spends nothing more', () => {
    const sim = blankSlate('professions-retry');
    sim.player.industryXp = 1000;
    const first = sim.execute({ kind: 'profession.unlock', payload: { professionId: 'writer' }, idempotencyKey: 'unlock:writer' });
    expect(first.ok).toBe(true);
    expect(sim.player.industryXp).toBe(600);
    const again = sim.execute({ kind: 'profession.unlock', payload: { professionId: 'writer' }, idempotencyKey: 'unlock:writer' });
    expect(again.ok).toBe(true);
    expect(sim.player.industryXp).toBe(600);
    expect(sim.player.professions?.writer?.xp).toBe(0);
    // And without the key it is refused outright rather than charged twice.
    const third = sim.execute({ kind: 'profession.unlock', payload: { professionId: 'writer' } });
    expect(third.ok).toBe(false);
    expect(sim.player.industryXp).toBe(600);
  });

  it('enforces prerequisites', () => {
    const sim = blankSlate('professions-prereq');
    sim.player.industryXp = 10_000;
    const early = sim.execute({ kind: 'profession.unlock', payload: { professionId: 'showrunner' } });
    expect(early.ok).toBe(false);
    expect(early.error).toMatch(/Writer/);
    expect(sim.execute({ kind: 'profession.unlock', payload: { professionId: 'writer' } }).ok).toBe(true);
    expect(sim.execute({ kind: 'profession.unlock', payload: { professionId: 'showrunner' } }).ok).toBe(true);
  });

  it('writes the unlock into history', () => {
    const sim = blankSlate('professions-history');
    sim.player.industryXp = 1000;
    sim.execute({ kind: 'profession.unlock', payload: { professionId: 'director' } });
    expect(sim.universe.history.some((h) => /Became A Director/.test(h.title))).toBe(true);
  });
});

describe('traits for a profession', () => {
  function writer(seed: string) {
    const sim = blankSlate(seed);
    sim.player.industryXp = 1000;
    sim.must({ kind: 'profession.unlock', payload: { professionId: 'writer' } });
    return sim;
  }

  it('fill one slot at level one, and no more', () => {
    const sim = writer('professions-slot');
    const [a, b] = traitsForProfession('writer').filter((t) => !t.conflictsWith?.length);
    expect(sim.execute({ kind: 'profession.pick_trait', payload: { professionId: 'writer', traitId: a!.id } }).ok).toBe(true);
    const second = sim.execute({ kind: 'profession.pick_trait', payload: { professionId: 'writer', traitId: b!.id } });
    expect(second.ok).toBe(false);
    expect(second.error).toMatch(/slot/);
  });

  it('refuse a trait from another profession, a duplicate, and a conflict', () => {
    const sim = writer('professions-wrong');
    const directors = traitsForProfession('director')[0]!;
    expect(sim.execute({ kind: 'profession.pick_trait', payload: { professionId: 'writer', traitId: directors.id } }).ok).toBe(false);

    sim.player.professions!.writer!.xp = LEVEL_XP[2] ?? 0; // level 3: two slots
    expect(sim.execute({ kind: 'profession.pick_trait', payload: { professionId: 'writer', traitId: 'writer_page_machine' } }).ok).toBe(true);
    expect(sim.execute({ kind: 'profession.pick_trait', payload: { professionId: 'writer', traitId: 'writer_page_machine' } }).ok).toBe(false);
    const clash = sim.execute({ kind: 'profession.pick_trait', payload: { professionId: 'writer', traitId: 'writer_polisher' } });
    expect(clash.ok).toBe(false);
    expect(clash.error).toMatch(/Page Machine/);
  });
});

describe('experience is earned from work', () => {


  /**
   * Industry experience used to come from working ordinary shifts, and the
   * job system has been removed. Nothing earns it now.
   *
   * It costs the founder nothing — every profession is already unlocked at the
   * top of its ladder, so there is nothing left to spend experience on. It
   * will matter for the people the company hires, who start from nothing and
   * have to get good at something. Left as a todo so the runner says so on
   * every run rather than a green suite implying the ladder still works.
   */
  it.todo('earns industry experience from work — nothing does, since the job system went');
});

describe('an older save', () => {
  it('keeps a writer a writer, as an unlocked profession', () => {
    const sim = quickSave({}, 'professions-migrate');
    const universe = sim.universe;
    universe.meta.schemaVersion = 11;
    sim.player.careerTrack = 'writer';
    delete sim.player.industryXp;
    delete sim.player.professions;
    const result = migrate(universe);
    // Read back through the universe: the delete above narrows the local
    // reference for TypeScript, and the record is what the migration wrote.
    const migrated = universe.people[sim.player.id]!;
    expect(result.migrated).toBe(true);
    expect(result.to).toBe(SAVE_SCHEMA_VERSION);
    expect(migrated.careerTrack).toBe('actor');
    expect(migrated.professions?.writer).toBeTruthy();
    expect(levelFor(migrated.professions!.writer!.xp)).toBe(2);
    expect(typeof migrated.industryXp).toBe('number');
    expect(result.steps.some((s) => /Writer/.test(s))).toBe(true);
  });

  it('describes the trait a migrated profession can take', () => {
    expect(TRAIT_BY_ID['writer_structuralist']?.profession).toBe('writer');
  });
});
