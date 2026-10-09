/**
 * What classes grow (`classesGrow`, from 2026-10-10): the Profile's "Classes Reach" is shown only for what a class
 * actually moves. Played through a week of classes: Presence, Composure, Discipline and Stamina get nothing from them,
 * and the abilities with craft or kin among the craft do.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_DAY, MS_HOUR } from '@/engine/core/time';
import { developmentOf } from '@/engine/systems/attributes';
import { classesGrow } from '@/engine/systems/school';
import { ABILITY_DEFS } from '@/engine/content/abilities';

describe('what classes grow', () => {
  it('is what a week of classes moved, and nothing it didn’t', () => {
    const sim = createSave(1, 'classes-grow', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    const until = sim.now + 21 * MS_DAY;
    while (sim.now < until) {
      // Tended between steps (test setup), so the days are attended and judged rested.
      Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
      sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
    }
    const fromClass = new Set(developmentOf(sim.player).history.filter((h) => h.source.startsWith('class:')).map((h) => h.id));
    expect(fromClass.size).toBeGreaterThan(0);
    for (const d of ABILITY_DEFS) {
      if (!classesGrow(d.id)) expect(fromClass.has(d.id), d.id).toBe(false);
    }
    expect(ABILITY_DEFS.filter((d) => !classesGrow(d.id)).map((d) => d.id).sort()).toEqual(['composure', 'discipline', 'presence', 'stamina']);
    // And of those classes do grow, a class moved at least one of them.
    expect(ABILITY_DEFS.some((d) => classesGrow(d.id) && fromClass.has(d.id))).toBe(true);
  });
});
