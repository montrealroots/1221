/**
 * Interests and genres pursued (`systems/engagement.ts`, `content/demands.ts`): every one of the 64 interests and the
 * 149 genres reached by its command and doing what it says; the constraints the sources state, refused with their
 * reason; satiation, familiarity and loving a thing each doing only what they should; an action sent twice lived
 * once; an hour that would cross a commitment refused; and every applied genre demand changing the work it's in.
 */

import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { ALL_INTERESTS, FILM_GENRES } from '@/engine/content/interests';
import { INTEREST_DEFS, RECOVERY, ENGAGEMENT } from '@/engine/content/engagement';
import { GENRE_DEFS } from '@/engine/content/genres';
import { DEMAND_TECHNIQUE, GENRE_DEMANDS, demandReads, genreTags, withDemands } from '@/engine/content/demands';
import { bestRest, engagementOf, genreSpeed, minutesOf, practiceGenres, pursueRefusal, restOf, satiationAdded, satiationNow, tapeReads, whenRefusal } from '@/engine/systems/engagement';
import { developmentOf, levelOf } from '@/engine/systems/attributes';
import { reachOf } from '@/engine/systems/school';
import { inTheBank } from '@/engine/systems/spending';
import { MS_HOUR, MS_DAY, instantFromZoned } from '@/engine/core/time';

const life = (seed: string, interests: string[] = []) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', interests });
const play = (sim: Simulation, until: number) => { while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR), { stopOnPlayerRequired: true }); };
/** A Sunday evening at the start of the first term, rested: nothing scheduled. */
const sunday = (sim: Simulation) => play(sim, instantFromZoned({ year: 2026, month: 9, day: 6, hour: 17 }, 'America/New_York'));
const rested = (sim: Simulation) => Object.assign(sim.player.wellbeing, { energy: 95, stress: 50, sleepDebt: 0, nourishment: 85, morale: 50 });
/** Forward an hour at a time, awake and rested, until the interest can be started (at most a fortnight). */
function whenItCan(sim: Simulation, id: string): string | undefined {
  for (let n = 0; n < 24 * 14; n += 1) {
    rested(sim);
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now - MS_HOUR);
    const no = pursueRefusal(sim, sim.player, id);
    if (!no) return undefined;
    sim.advanceTo(sim.now + MS_HOUR);
  }
  return pursueRefusal(sim, sim.player, id);
}

describe('every interest', () => {
  it('has its research, an activity to do, and an effect chosen for it: not one bonus for all', () => {
    expect(ALL_INTERESTS).toHaveLength(64);
    for (const i of ALL_INTERESTS) {
      const d = INTEREST_DEFS[i.id];
      expect(d, i.id).toBeDefined();
      expect(d!.activity.length, i.id).toBeGreaterThan(20);
      if (d!.activitySource) expect(d!.activitySource, i.id).toMatch(/http|library|Yale|book|Corson|Murch|Shurtleff|Chekhov|Stanislavski|de Witte/i);
      expect(d!.actorUse.length, i.id).toBeGreaterThan(20);
    }
    const effects = new Set(Object.values(INTEREST_DEFS).map((d) => `${d.develops}/${d.recovery ?? '-'}`));
    expect(effects.size).toBeGreaterThan(35);
    // The festival that ended in 2023 is no longer offered as if it ran.
    expect(INTEREST_DEFS.film_festivals!.activity).toMatch(/ended/);
  });

  it('is pursued by a command at a time it can be had, rests as its kind does, grows what it names and is kept', () => {
    for (const [n, i] of ALL_INTERESTS.entries()) {
      const sim = life(`interest-${n}`);
      sunday(sim);
      const blocked = whenItCan(sim, i.id);
      expect(blocked, `${i.id}: ${blocked}`).toBeUndefined();
      const def = INTEREST_DEFS[i.id]!;
      const before = levelOf(sim, sim.player, def.develops);
      const reach = reachOf(sim.player, def.develops);
      const stress = sim.player.wellbeing.stress;
      const at = sim.now;
      const bank = inTheBank(sim, sim.player);
      const r = sim.execute<{ stress: number; developed: number }>({ kind: 'interest.pursue', payload: { interest: i.id } });
      expect(r.ok, `${i.id}: ${r.ok ? '' : r.error}`).toBe(true);
      // It took its own time: an hour, or what its source says (a 90-minute walk, a screening, a show).
      expect(sim.now - at, i.id).toBe(minutesOf(i.id) * 60_000);
      const s = engagementOf(sim.player).byInterest[i.id]!;
      expect(s.sessions).toBe(1);
      expect(s.familiarity).toBeGreaterThan(0);
      expect(s.satiation).toBeGreaterThan(0);
      if (def.recovery) expect(sim.player.wellbeing.stress, i.id).toBeLessThan(stress);
      else expect(r.ok && r.value!.stress).toBe(0);
      if (def.when?.costUsd) expect(inTheBank(sim, sim.player), i.id).toBeLessThan(bank);
      if (before < reach - 0.01) expect(levelOf(sim, sim.player, def.develops), `${i.id} ${def.develops}`).toBeGreaterThan(before);
      if (before < reach - 0.01) expect(developmentOf(sim.player).history.some((h) => h.source === `interest:${i.id}`), i.id).toBe(true);
    }
  }, 300_000);

  it('is refused, with its reason, where its source says it can’t be had: after dark, off its day, outside its hours', () => {
    const sim = life('interest-when');
    sunday(sim);
    // Sunday at 5: the galleries are open, the debate isn't on, the architecture gallery is shut.
    expect(whenRefusal(sim, sim.player, INTEREST_DEFS.politics!.when)).toMatch(/Sunday.*Tuesdays/);
    expect(whenRefusal(sim, sim.player, INTEREST_DEFS.design!.when)).toMatch(/Sunday/);
    // Late at night, the park is shut.
    sim.advanceTo(instantFromZoned({ year: 2026, month: 9, day: 6, hour: 23 }, 'America/New_York'));
    expect(whenRefusal(sim, sim.player, INTEREST_DEFS.nature!.when)).toMatch(/after dark/);
    // A Monday at noon: the galleries are closed.
    sim.advanceTo(instantFromZoned({ year: 2026, month: 9, day: 7, hour: 12 }, 'America/New_York'));
    expect(whenRefusal(sim, sim.player, INTEREST_DEFS.art!.when)).toMatch(/Monday/);
    // A Tuesday evening: the Political Union.
    sim.advanceTo(instantFromZoned({ year: 2026, month: 9, day: 8, hour: 19 }, 'America/New_York'));
    expect(whenRefusal(sim, sim.player, INTEREST_DEFS.politics!.when)).toBeUndefined();
    // Interests no source constrains have no rule invented for them.
    expect(INTEREST_DEFS.voice_acting!.when).toBeUndefined();
  });

  it('rests less the more satiated, recovers with time, and a familiar interest tires of itself more slowly', () => {
    const sim = life('interest-satiation');
    sunday(sim);
    rested(sim);
    const first = restOf(sim.player, 'television', sim.now);
    sim.execute({ kind: 'interest.pursue', payload: { interest: 'television' } });
    const second = restOf(sim.player, 'television', sim.now);
    expect(second.stress).toBeLessThan(first.stress);
    const s = engagementOf(sim.player).byInterest.television!;
    expect(satiationNow(s, sim.now + 4 * MS_DAY)).toBeCloseTo(s.satiation / 4, 5);
    // Familiarity's use: each session adds less satiation the more familiar the interest is.
    expect(satiationAdded(80)).toBeLessThan(satiationAdded(0));
    expect(satiationAdded(100)).toBeCloseTo(ENGAGEMENT.satiation.perSession * (1 - ENGAGEMENT.satiation.familiarityEases), 9);
    expect(RECOVERY.nature.stress).toBeGreaterThan(RECOVERY.mastery.stress);
  });

  it('recommends the rest that is greatest of those that can be started now, by the same calculation the hour uses', () => {
    const sim = life('interest-best', ['music']);
    sunday(sim);
    rested(sim);
    const best = bestRest(sim, sim.player)!;
    expect(best).toBeDefined();
    for (const [id, def] of Object.entries(INTEREST_DEFS)) {
      if (!def.recovery || pursueRefusal(sim, sim.player, id)) continue;
      expect(restOf(sim.player, id, sim.now).stress, id).toBeLessThanOrEqual(best.stress);
    }
    const r = sim.execute<{ stress: number }>({ kind: 'interest.pursue', payload: { interest: best.id } });
    expect(r.ok && r.value!.stress).toBe(best.stress);
  });

  it('lets loving an interest make it better rest and no better practice; choosing or dropping one gives nothing', () => {
    const loved = life('interest-loved', ['television']);
    const plain = life('interest-loved', []);
    for (const sim of [loved, plain]) { sunday(sim); rested(sim); sim.player.craft!.script = 50; }
    const a = loved.execute<{ stress: number; developed: number }>({ kind: 'interest.pursue', payload: { interest: 'television' } });
    const b = plain.execute<{ stress: number; developed: number }>({ kind: 'interest.pursue', payload: { interest: 'television' } });
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) {
      expect(a.value!.stress).toBeCloseTo(b.value!.stress * ENGAGEMENT.loved, 5);
      expect(a.value!.developed).toBeCloseTo(b.value!.developed, 9);
    }
    const before = JSON.stringify(engagementOf(plain.player));
    const craft = JSON.stringify(plain.player.craft);
    plain.player.interests.push('nature', 'art');
    plain.player.interests.splice(0);
    expect(JSON.stringify(engagementOf(plain.player))).toBe(before);
    expect(JSON.stringify(plain.player.craft)).toBe(craft);
  });

  it('lives an action sent twice once, and refuses an hour that would run into a commitment', () => {
    const sim = life('interest-twice');
    sunday(sim);
    rested(sim);
    const once = sim.execute({ kind: 'interest.pursue', payload: { interest: 'television', actionId: 'a-1' } });
    const state = JSON.stringify(engagementOf(sim.player).byInterest.television);
    const twice = sim.execute({ kind: 'interest.pursue', payload: { interest: 'television', actionId: 'a-1' } });
    expect(once.ok).toBe(true);
    expect(twice.ok).toBe(false);
    expect(twice.ok ? '' : twice.error).toMatch(/already done/);
    expect(JSON.stringify(engagementOf(sim.player).byInterest.television)).toBe(state);
    // Something on the calendar in half an hour: an hour of anything won't fit before it.
    sim.onSchedule('test.commitment', () => {});
    sim.schedule({ at: sim.now + 30 * 60_000, kind: 'test.commitment', label: 'A Test Call', category: 'school', priority: 30, requiresPlayer: true, durationMinutes: 60, payload: { personId: sim.player.id } });
    expect(pursueRefusal(sim, sim.player, 'television')).toMatch(/A Test Call starts/);
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
    expect(withRequirements).toBe(64);
  });

  it('makes every applied demand a requirement of the work: raising its technique raises the work, and it counts once', () => {
    const sim = life('genre-demands');
    sunday(sim);
    for (const g of FILM_GENRES) {
      for (const tag of genreTags(g.id)) {
        const skill = DEMAND_TECHNIQUE[tag];
        expect((tapeReads(g.id) as Record<string, number>)[skill], `${g.id} ${tag}`).toBeDefined();
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
      const t = sim.execute<{ overall: number }>({ kind: 'practice.self_tape', payload: { genre: g.id } });
      expect(t.ok, `${g.id}: ${t.ok ? '' : t.error}`).toBe(true);
      const state = engagementOf(sim.player).byGenre[g.id]!;
      expect(state.familiarity, g.id).toBeGreaterThan(0);
      expect(state.practice, g.id).toBeGreaterThan(0);
      const work = sim.player.work!.at(-1)!;
      expect(work.task).toBe('camera');
      expect(work.inputs.families).toEqual([...new Set(GENRE_DEFS[g.id]!.families)]);
      expect(Object.keys(work.inputs.techniques).sort()).toEqual(Object.keys(tapeReads(g.id)).sort());
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
    tapes.execute({ kind: 'practice.self_tape', payload: { genre: 'drama' } });
    const first = engagementOf(tapes.player).byGenre.drama!.practice;
    rested(tapes);
    tapes.execute({ kind: 'practice.self_tape', payload: { genre: 'drama' } });
    const second = engagementOf(tapes.player).byGenre.drama!.practice - first;
    expect(second).toBeLessThan(first * 0.6);
  });
});
