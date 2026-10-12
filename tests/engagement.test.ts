/**
 * Genres studied and worked in (`systems/engagement.ts`, `content/demands.ts`): every one of the 149 reached by its
 * command and doing what it says; an action sent twice lived once; an hour that would cross a commitment refused; and
 * every applied genre demand changing the work it's in. Until 2026-10-10 this held the 64 interests too, each pursued
 * at a time it could be had and resting as its kind did; the owner removed the interests that day.
 */

import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { FILM_GENRES } from '@/engine/content/film-genres';
import { ENGAGEMENT } from '@/engine/content/engagement';
import { GENRE_DEFS } from '@/engine/content/genres';
import { DEMAND_TECHNIQUE, GENRE_DEMANDS, demandReads, genreTags, withDemands } from '@/engine/content/demands';
import { engagementOf, genreSpeed, practiceGenres, tapeReads } from '@/engine/systems/engagement';
import { MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { briefsOf } from '@/engine/content/briefs';
import { tapeReadsOf, taskOf } from '@/engine/systems/briefs';

const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const play = (sim: Simulation, until: number) => { while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR), { stopOnPlayerRequired: true }); };
/** A Sunday evening at the start of the first term, rested: nothing scheduled. */
const sunday = (sim: Simulation) => play(sim, instantFromZoned({ year: 2026, month: 9, day: 6, hour: 17 }, 'America/New_York'));
const rested = (sim: Simulation) => Object.assign(sim.player.wellbeing, { energy: 95, stress: 50, sleepDebt: 0, nourishment: 85, morale: 50 });
/** A self-tape is of a genre's brief, played one way (from 2026-10-12): its first reading chosen, as a player chooses before taping. */
const pick = (sim: Simulation, genre: string) => { const b = briefsOf(genre)[0]!; sim.execute({ kind: 'brief.choose', payload: { brief: b.id, reading: b.readings[0]!.id } }); return b; };
describe('an hour of a genre', () => {
  // Until 2026-10-10 this was an interest's hour (`interest.pursue`); the owner removed the interests that day.
  it('lives an action sent twice once, and refuses an hour that would run into a commitment', () => {
    const sim = life('genre-twice');
    sunday(sim);
    rested(sim);
    const once = sim.execute({ kind: 'genre.study', payload: { genre: 'comedy', actionId: 'a-1' } });
    const state = JSON.stringify(engagementOf(sim.player).byGenre.comedy);
    const when = sim.now;
    const twice = sim.execute({ kind: 'genre.study', payload: { genre: 'comedy', actionId: 'a-1' } });
    expect(once.ok).toBe(true);
    expect(twice.ok).toBe(false);
    expect(twice.ok ? '' : twice.error).toMatch(/already done/);
    expect(JSON.stringify(engagementOf(sim.player).byGenre.comedy)).toBe(state);
    expect(sim.now).toBe(when);
    // Something on the calendar in half an hour: an hour and a half of study, or an hour of anything, won't fit before it.
    sim.onSchedule('test.commitment', () => {});
    sim.schedule({ at: sim.now + 30 * 60_000, kind: 'test.commitment', label: 'A Test Call', category: 'school', priority: 30, requiresPlayer: true, durationMinutes: 60, payload: { personId: sim.player.id } });
    expect(sim.execute({ kind: 'genre.study', payload: { genre: 'drama' } }).error).toMatch(/A Test Call starts/);
    pick(sim, 'drama');
    expect(sim.execute({ kind: 'practice.self_tape', payload: { genre: 'drama' } }).error).toMatch(/A Test Call starts/);
    expect(sim.execute({ kind: 'brief.prepare', payload: { brief: 'brief-drama', step: 'lines' } }).error).toMatch(/A Test Call starts/);
    expect(sim.execute({ kind: 'practice.exercise', payload: { exercise: 'concentration' } }).ok).toBe(false);
  });
});

describe('every genre', () => {
  it('has its conventions and its researched demands, and applies them only where the research reached medium or high confidence', () => {
    expect(FILM_GENRES).toHaveLength(149);
    let withRequirements = 0;
    for (const g of FILM_GENRES) {
      expect(GENRE_DEFS[g.id], g.id).toBeDefined();
      const d = GENRE_DEMANDS[g.id];
      expect(d, g.id).toBeDefined();
      expect(d!.source.length, g.id).toBeGreaterThan(0);
      if (d!.confidence === 'low') expect(genreTags(g.id), g.id).toEqual([]);
      else expect(genreTags(g.id), g.id).toEqual(d!.tags.map((t) => t.tag));
      if (genreTags(g.id).length) withRequirements += 1;
    }
    // 64 until the review of 2026-10-10 lowered every entry resting on one film, one director, one role or one subgenre.
    expect(withRequirements).toBe(41);
  });

  it('makes every applied demand a requirement of the work: raising its technique raises the work, and it counts once', () => {
    const sim = life('genre-demands');
    sunday(sim);
    for (const g of FILM_GENRES) {
      for (const tag of genreTags(g.id)) {
        const skill = DEMAND_TECHNIQUE[tag];
        expect((tapeReads(g.id) as Record<string, number>)[skill], `${g.id} ${tag}`).toBeDefined();
        // And the genre's brief stages it (from 2026-10-12).
        expect((tapeReadsOf(briefsOf(g.id)[0]!) as Record<string, number>)[skill], `${g.id} brief ${tag}`).toBeDefined();
      }
    }
    // A tag two genres share is asked for once, and a technique the work already reads keeps its own weight.
    const both = FILM_GENRES.map((g) => g.id).filter((id) => genreTags(id).includes('comic')).slice(0, 2);
    expect(Object.keys(demandReads(both)).filter((k) => k === 'comedy')).toHaveLength(1);
    expect(withDemands({ comedy: 3 }, both).comedy).toBe(3);
    // And what it does: a tape in a genre that asks for singing reads singing, and more of it reads better.
    const singing = FILM_GENRES.map((g) => g.id).find((id) => genreTags(id).includes('song'))!;
    const taped = (level: number, seed: string) => {
      const s = life(seed);
      sunday(s);
      rested(s);
      s.player.craft!.singing = level;
      pick(s, singing);
      const r = s.execute<{ overall: number }>({ kind: 'practice.self_tape', payload: { genre: singing } });
      return r.ok ? r.value!.overall : -1;
    };
    expect(taped(85, 'tape-a')).toBeGreaterThan(taped(30, 'tape-a'));
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
      const b = pick(sim, g.id);
      const t = sim.execute<{ overall: number }>({ kind: 'practice.self_tape', payload: { genre: g.id } });
      expect(t.ok, `${g.id}: ${t.ok ? '' : t.error}`).toBe(true);
      const state = engagementOf(sim.player).byGenre[g.id]!;
      expect(state.familiarity, g.id).toBeGreaterThan(0);
      expect(state.practice, g.id).toBeGreaterThan(0);
      const work = sim.player.work!.at(-1)!;
      // A taped brief (from 2026-10-12): judged as one, its material's lean in place of the families', its reads the brief's.
      expect(work.task).toBe(taskOf(b).id);
      expect(work.inputs.families).toEqual([]);
      expect(work.inputs.lean).toBeDefined();
      expect(Object.keys(work.inputs.techniques).sort()).toEqual(Object.keys(tapeReadsOf(b)).sort());
      for (const k of Object.keys(demandReads([g.id]))) expect(work.inputs.techniques, `${g.id} ${k}`).toHaveProperty(k);
      expect(GENRE_DEFS[g.id]).toBeDefined();
      expect(genreSpeed(sim.player, [g.id])).toBeGreaterThan(1);
    }
  }, 300_000);

  it('shares one session’s practice among a work’s genres, halves a second tape the same day, speeds by the best and caps nothing', () => {
    const sim = life('genres-normal');
    practiceGenres(sim, sim.player, ['farce', 'satire']);
    const e = engagementOf(sim.player).byGenre;
    const one = life('genres-one');
    practiceGenres(one, one.player, ['farce']);
    expect(e.farce!.practice).toBeCloseTo(engagementOf(one.player).byGenre.farce!.practice / 2, 5);
    expect(genreSpeed(sim.player, ['farce', 'satire'])).toBe(genreSpeed(sim.player, ['farce']));
    expect(genreSpeed(sim.player, [])).toBe(1);
    expect(genreSpeed(sim.player, ['farce'])).toBeLessThanOrEqual(1 + ENGAGEMENT.genreSpeed);
    const tapes = life('genres-twice');
    sunday(tapes);
    rested(tapes);
    pick(tapes, 'drama');
    tapes.execute({ kind: 'practice.self_tape', payload: { genre: 'drama' } });
    const first = engagementOf(tapes.player).byGenre.drama!.practice;
    rested(tapes);
    tapes.execute({ kind: 'practice.self_tape', payload: { genre: 'drama' } });
    const second = engagementOf(tapes.player).byGenre.drama!.practice - first;
    expect(second).toBeLessThan(first * 0.6);
  });
});
