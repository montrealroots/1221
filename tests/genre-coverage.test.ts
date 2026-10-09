/**
 * Every genre works (from 2026-10-10): each of the 149 studied through `genre.study` and taped through
 * `practice.self_tape`, its tape reading exactly the camera's own techniques and the genre's applied demands, once each;
 * a genre at low confidence asking nothing past the shared mechanics; a fully mastered performer's tape 100 in every
 * one; and loving a genre neither speeding its study nor raising its tape. `docs/GENRE-COVERAGE.md` is the tables'
 * own output (`npx vite-node tools/genre-coverage.ts`).
 */
import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { createSave, quickSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { FILM_GENRES } from '@/engine/content/interests';
import { DEMAND_TECHNIQUE, applied, genreTags } from '@/engine/content/demands';
import { GENRE_DEMANDS } from '@/engine/content/genre-demands';
import { NO_TECHNIQUE, genreCoverage } from '@/engine/content/genre-coverage';
import { SELF_TAPE, genreState, tapeReads } from '@/engine/systems/engagement';
import { judge, type Performer } from '@/engine/systems/evaluation';
import { TASK_PROFILES } from '@/engine/content/tasks';
import { MASTERED } from '@/engine/content/abilities';

/** A new life as the game makes one (enrolled, so with a craft), with nothing on the calendar in the way (test setup). */
function free(seed: string): Simulation {
  const sim = createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
  return sim;
}
const rest = (sim: Simulation) => {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
  Object.assign(sim.player.wellbeing, { energy: 90, stress: 15, sleepDebt: 0, nourishment: 70, hygiene: 80 });
};

describe('every genre, played', () => {
  it('is studied through its command, and familiarity rises in each of the 149', () => {
    const sim = free('cover-study');
    for (const g of FILM_GENRES) {
      rest(sim);
      const before = genreState(sim.player, g.id).familiarity;
      const r = sim.execute({ kind: 'genre.study', payload: { genre: g.id } });
      expect(r.ok, `${g.id}: ${r.error}`).toBe(true);
      expect(genreState(sim.player, g.id).familiarity, g.id).toBeGreaterThan(before);
    }
  });

  it('is taped through its command, reading the camera’s techniques and its applied demands once each, and nothing more where none is applied', () => {
    const sim = free('cover-tape');
    for (const g of FILM_GENRES) {
      rest(sim);
      const r = sim.execute({ kind: 'practice.self_tape', payload: { genre: g.id } });
      expect(r.ok, `${g.id}: ${r.error}`).toBe(true);
      const read = sim.player.work!.at(-1)!.inputs.techniques;
      const demanded = genreTags(g.id).map((t) => DEMAND_TECHNIQUE[t]);
      const expected: Record<string, number> = { ...SELF_TAPE.reads };
      for (const s of demanded) expected[s] ??= 1;
      expect(read, g.id).toEqual(expected);
      if (!applied(g.id)) expect(read, g.id).toEqual({ ...SELF_TAPE.reads });
    }
  });
});

describe('the guarantee in every genre', () => {
  it('a mastered performer, the genre known, a rested day: 100 in all 149', () => {
    const sim = free('cover-full');
    const full: Performer = { ability: () => 100, full: () => 100, technique: () => MASTERED };
    for (const g of FILM_GENRES) {
      const e = judge(sim.universe.meta.seed ?? 'seed', full, { task: TASK_PROFILES.camera!, techniques: tapeReads(g.id), prep: { genre: 1 }, required: { genre: SELF_TAPE.genreComplete }, difficulty: SELF_TAPE.difficulty, condition: { readiness: 90 }, key: `full:${g.id}` });
      expect(e.overall, g.id).toBe(100);
      expect(e.mastery, g.id).toBe(true);
    }
  });
});

describe('a life with no training begun', () => {
  it('is refused a tape and a technique’s exercise with a reason, not an error', () => {
    const sim = quickSave({}, 'cover-no-craft');
    expect(sim.player.craft).toBeUndefined();
    expect(sim.execute({ kind: 'practice.self_tape', payload: { genre: 'musical' } }).error).toMatch(/training hasn’t begun/);
    expect(sim.execute({ kind: 'practice.exercise', payload: { exercise: 'dialect-drill' } }).error).toMatch(/training hasn’t begun/);
  });
});

describe('preference isn’t expertise', () => {
  it('loving a genre neither speeds its study nor raises its tape', () => {
    const loved = free('cover-love');
    const not = free('cover-love');
    loved.player.genres = ['musical'];
    not.player.genres = [];
    for (const sim of [loved, not]) { rest(sim); sim.execute({ kind: 'genre.study', payload: { genre: 'musical' } }); rest(sim); sim.execute({ kind: 'practice.self_tape', payload: { genre: 'musical' } }); }
    expect(genreState(loved.player, 'musical').familiarity).toBe(genreState(not.player, 'musical').familiarity);
    expect(loved.player.work!.at(-1)!.overall).toBe(not.player.work!.at(-1)!.overall);
  });
});

describe('the coverage record', () => {
  it('is what the tables say, and accounts for every genre once', () => {
    expect(readFileSync('docs/GENRE-COVERAGE.md', 'utf8')).toBe(genreCoverage());
    const withTechniques = FILM_GENRES.filter((g) => genreTags(g.id).length).length;
    const noTechnique = FILM_GENRES.filter((g) => applied(g.id) && !GENRE_DEMANDS[g.id]!.tags.length);
    const low = FILM_GENRES.filter((g) => !applied(g.id)).length;
    expect(withTechniques + noTechnique.length + low).toBe(FILM_GENRES.length);
    // Each held at medium or high with no technique says why, and no reason is kept for one that isn't.
    expect(noTechnique.map((g) => g.id).sort()).toEqual(Object.keys(NO_TECHNIQUE).sort());
    // A demand that belongs to a role or particular material is never applied.
    for (const g of FILM_GENRES) if (GENRE_DEMANDS[g.id]!.belongsTo) expect(applied(g.id), g.id).toBe(false);
  });
});
