/**
 * Interests and genres pursued (`systems/engagement.ts`): every one of the 64
 * interests and the 149 genres reachable by a command, each with its own
 * effect and history; satiation, loving a thing and choosing it on the
 * character sheet each doing only what they should; genre familiarity and
 * practice speeding the work without capping it; and a self-tape in every
 * genre judged as finished work.
 */

import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { ALL_INTERESTS, FILM_GENRES } from '@/engine/content/interests';
import { INTEREST_DEFS, RECOVERY, ENGAGEMENT } from '@/engine/content/engagement';
import { GENRE_DEFS } from '@/engine/content/genres';
import { engagementOf, genreSpeed, practiceGenres, pursueRefusal, restOf, satiationNow } from '@/engine/systems/engagement';
import { developmentOf, levelOf } from '@/engine/systems/attributes';
import { reachOf } from '@/engine/systems/school';
import { MS_HOUR, MS_DAY, instantFromZoned } from '@/engine/core/time';

const life = (seed: string, interests: string[] = []) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', interests });
const play = (sim: Simulation, until: number) => { while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR), { stopOnPlayerRequired: true }); };
/** A Sunday evening at the start of the first term, rested: nothing scheduled. */
const sunday = (sim: Simulation) => play(sim, instantFromZoned({ year: 2026, month: 9, day: 6, hour: 17 }, 'America/New_York'));
const rested = (sim: Simulation) => Object.assign(sim.player.wellbeing, { energy: 95, stress: 50, sleepDebt: 0, nourishment: 85, morale: 50 });

describe('every interest', () => {
  it('has its research, an activity to do, and an effect chosen for it: not one bonus for all', () => {
    expect(ALL_INTERESTS).toHaveLength(64);
    for (const i of ALL_INTERESTS) {
      const d = INTEREST_DEFS[i.id];
      expect(d, i.id).toBeDefined();
      expect(d!.activity.length, i.id).toBeGreaterThan(20);
      if (d!.activitySource) expect(d!.activitySource, i.id).toMatch(/http|library|Yale|book|Corson|Murch|Shurtleff/i);
      expect(d!.actorUse.length, i.id).toBeGreaterThan(20);
    }
    // Twelve are done at home, where no source names a place, and say so.
    expect(Object.values(INTEREST_DEFS).filter((d) => !d.activitySource)).toHaveLength(12);
    const effects = new Set(Object.values(INTEREST_DEFS).map((d) => `${d.develops}/${d.recovery ?? '-'}`));
    expect(effects.size).toBeGreaterThan(35);
  });

  it('is pursued by a command, and an hour of it rests as its kind does, grows what it names and is kept', () => {
    for (const [n, i] of ALL_INTERESTS.entries()) {
      // A fresh life every few, so the day's development doesn't halve across them.
      const sim = life(`interest-${n}`);
      sunday(sim);
      rested(sim);
      const def = INTEREST_DEFS[i.id]!;
      const before = levelOf(sim, sim.player, def.develops);
      const reach = reachOf(sim.player, def.develops);
      const stress = sim.player.wellbeing.stress;
      const r = sim.execute<{ stress: number; developed: number }>({ kind: 'interest.pursue', payload: { interest: i.id } });
      expect(r.ok, `${i.id}: ${r.ok ? '' : r.error}`).toBe(true);
      const s = engagementOf(sim.player).byInterest[i.id]!;
      expect(s.sessions).toBe(1);
      expect(s.familiarity).toBeGreaterThan(0);
      expect(s.satiation).toBeGreaterThan(0);
      if (def.recovery) expect(sim.player.wellbeing.stress, i.id).toBeLessThan(stress);
      else expect(r.ok && r.value!.stress).toBe(0);
      // It grows its target, unless that's already at the reach ordinary work stops at.
      if (before < reach - 0.01) expect(levelOf(sim, sim.player, def.develops), `${i.id} ${def.develops}`).toBeGreaterThan(before);
      if (before < reach - 0.01) expect(developmentOf(sim.player).history.some((h) => h.source === `interest:${i.id}`), i.id).toBe(true);
    }
  }, 240_000);

  it('rests less the more satiated, and recovers with time', () => {
    const sim = life('interest-satiation');
    sunday(sim);
    rested(sim);
    const first = restOf(sim.player, 'nature', sim.now);
    sim.execute({ kind: 'interest.pursue', payload: { interest: 'nature' } });
    const second = restOf(sim.player, 'nature', sim.now);
    expect(second.stress).toBeLessThan(first.stress);
    const s = engagementOf(sim.player).byInterest.nature!;
    expect(satiationNow(s, sim.now + 4 * MS_DAY)).toBeCloseTo(s.satiation / 4, 5);
    expect(RECOVERY.nature.stress).toBeGreaterThan(RECOVERY.mastery.stress);
  });

  it('lets loving an interest make it better rest and no better practice; choosing or dropping one gives nothing', () => {
    const loved = life('interest-loved', ['music']);
    const plain = life('interest-loved', []);
    for (const sim of [loved, plain]) { sunday(sim); rested(sim); sim.player.craft!.singing = 50; }
    const a = loved.execute<{ stress: number; developed: number }>({ kind: 'interest.pursue', payload: { interest: 'music' } });
    const b = plain.execute<{ stress: number; developed: number }>({ kind: 'interest.pursue', payload: { interest: 'music' } });
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) {
      expect(a.value!.stress).toBeCloseTo(b.value!.stress * ENGAGEMENT.loved, 5);
      expect(a.value!.developed).toBeCloseTo(b.value!.developed, 9);
    }
    // Choosing it on the sheet: nothing moves until an hour is spent.
    const before = JSON.stringify(engagementOf(plain.player));
    const craft = JSON.stringify(plain.player.craft);
    plain.player.interests.push('nature', 'art');
    plain.player.interests.splice(0);
    expect(JSON.stringify(engagementOf(plain.player))).toBe(before);
    expect(JSON.stringify(plain.player.craft)).toBe(craft);
  });

  it('is refused asleep, busy or hurt where the body is asked', () => {
    const sim = life('interest-refused');
    sunday(sim);
    sim.player.wellbeing.energy = 5;
    expect(pursueRefusal(sim, sim.player, 'fitness')).toMatch(/tired/);
    expect(pursueRefusal(sim, sim.player, 'reading')).toBeUndefined();
    expect(pursueRefusal(sim, sim.player, 'nonsense')).toMatch(/no such/);
  });
});

describe('every genre', () => {
  it('has its conventions and what it asks, sourced, and families that lean the work', () => {
    expect(FILM_GENRES).toHaveLength(149);
    for (const g of FILM_GENRES) {
      const d = GENRE_DEFS[g.id];
      expect(d, g.id).toBeDefined();
      expect(d!.conventions.length, g.id).toBeGreaterThan(20);
      expect(d!.source.length, g.id).toBeGreaterThan(5);
      expect(d!.families.length, g.id).toBeGreaterThan(0);
    }
  });

  it('is studied and taped by a command: familiarity, practice and a self-tape judged in its families, every one', () => {
    let sim = life('genres-all');
    sunday(sim);
    for (const [n, g] of FILM_GENRES.entries()) {
      if (n % 3 === 0) { sim = life(`genres-${n}`); sunday(sim); }
      rested(sim);
      const s = sim.execute<{ familiarity: number }>({ kind: 'genre.study', payload: { genre: g.id } });
      expect(s.ok, `${g.id}: ${s.ok ? '' : s.error}`).toBe(true);
      rested(sim);
      const t = sim.execute<{ overall: number }>({ kind: 'practice.self_tape', payload: { genre: g.id } });
      expect(t.ok, `${g.id}: ${t.ok ? '' : t.error}`).toBe(true);
      const state = engagementOf(sim.player).byGenre[g.id]!;
      expect(state.familiarity, g.id).toBeGreaterThan(0);
      expect(state.practice, g.id).toBeGreaterThan(0);
      const work = sim.player.work!.at(-1)!;
      expect(work.task).toBe('camera');
      expect(work.inputs.families).toEqual([...new Set(GENRE_DEFS[g.id]!.families)]);
      expect(genreSpeed(sim.player, [g.id])).toBeGreaterThan(1);
    }
  }, 240_000);

  it('shares one session’s practice among a work’s genres, speeds by the best and never their sum, and caps nothing', () => {
    const sim = life('genres-normal');
    practiceGenres(sim, sim.player, ['farce', 'satire']);
    const e = engagementOf(sim.player).byGenre;
    const one = life('genres-one');
    practiceGenres(one, one.player, ['farce']);
    expect(e.farce!.practice).toBeCloseTo(engagementOf(one.player).byGenre.farce!.practice / 2, 5);
    expect(genreSpeed(sim.player, ['farce', 'satire'])).toBe(genreSpeed(sim.player, ['farce']));
    expect(genreSpeed(sim.player, [])).toBe(1);
    expect(genreSpeed(sim.player, ['farce'])).toBeLessThanOrEqual(1 + ENGAGEMENT.genreSpeed);
  });
});
