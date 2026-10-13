/**
 * The connected attributes, finished (2026-10-10): casting read by the same evaluation for the player and every
 * classmate, without identity and without counting the craft twice; the journey's lasting counts past the recent
 * detail; old results worked out again from their own inputs; every ability and technique reaching its full; and the
 * guarantee holding with a genre's demands in the work.
 */

import { describe, expect, it } from 'vitest';
import { createSave, migrate } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR, MS_DAY, instantFromZoned } from '@/engine/core/time';
import { CALL_KIND, ESTIMATE, castingReads, castFit, castScore, classmatePerformer, evenCraft, mateAbilities } from '@/engine/systems/school';
import { WORK_KEPT, evaluate, journeyOf, performerOf, recordWork, replay } from '@/engine/systems/evaluation';
import { abilityFull, develop, levelOf } from '@/engine/systems/attributes';
import { ABILITY_DEFS, MASTERED, TECHNIQUES } from '@/engine/content/abilities';
import { TASK_PROFILES } from '@/engine/content/tasks';
import { EXERCISES } from '@/engine/content/practice';
import { DEMAND_TECHNIQUE, genreTags } from '@/engine/content/demands';
import { REP_PLAYS, SHAKESPEARE_PLAYS, SUMMER_PLAYS, THESIS_PLAYS } from '@/engine/content/plays';
import { SCENES, templateById } from '@/engine/content/coursework';
import { MATERIAL_BY_ID } from '@/engine/content/material';
import { judgeWork, type Assignment } from '@/engine/systems/coursework';
import { FILM_GENRES } from '@/engine/content/film-genres';
import { genreState } from '@/engine/systems/engagement';
import { briefsOf } from '@/engine/content/briefs';
import { BRIEF, recordOf } from '@/engine/systems/briefs';

const life = (seed: string, title: 'she/her' | 'he/him' = 'she/her') => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: title });
const play = (sim: Simulation, until: number) => { while (sim.now < until) sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR), { stopOnPlayerRequired: true }); };
const on = (y: number, m: number, d: number) => instantFromZoned({ year: y, month: m, day: d, hour: 10 }, 'America/New_York');
const reads = { scene: 2, character: 1 };
/**
 * Reads with a set of genres’ demanded techniques added once each at a weight of one, where they don’t already read them:
 * what `withDemands` did until it went on 2026-10-13, read by tests alone, made here so the reads these tests cast with
 * stay as they were.
 */
const withDemands = <T extends Record<string, number>>(r: T, genres: readonly string[]): T => ({ ...Object.fromEntries(genres.flatMap(genreTags).map((t) => [DEMAND_TECHNIQUE[t], 1])), ...r });

/** The player made the classmate's equal: the same craft, the same abilities, and full stamina and discipline. */
function asClassmate(sim: Simulation, i: number) {
  const p = sim.player;
  const mate = p.school!.classmates[i]!;
  const a = mateAbilities(sim, p, i);
  p.craft = { ...mate.craft };
  p.attrs = { presence: classmatePerformer(sim, p, i).ability('presence'), composure: a.composure, listening: a.listening, imagination: a.imagination, focus: a.focus, adaptability: a.adaptability, discipline: 100 };
  p.wellbeing.fitness = abilityFull(sim, p, 'stamina');
}

describe('casting, read the same for everyone', () => {
  it('gives the player and a classmate with the same abilities and craft the same fit, for any play', () => {
    const sim = life('cast-same');
    asClassmate(sim, 3);
    for (const r of [reads, { classical: 2, voice: 1 }, withDemands({ scene: 1 }, ['musical'])]) {
      expect(castFit(sim, performerOf(sim, sim.player), r, [], 'k')).toBeCloseTo(castFit(sim, classmatePerformer(sim, sim.player, 3), r, [], 'k'), 9);
    }
  });

  it('reads no identity: billed as an actor or an actress, the same student fits the same', () => {
    const a = life('cast-identity', 'she/her');
    const b = life('cast-identity', 'he/him');
    for (const sim of [a, b]) { sim.player.craft = evenCraft(60); Object.assign(sim.player.attrs!, { presence: 70, composure: 50 }); }
    expect(castFit(a, performerOf(a, a.player), reads, [], 'k')).toBe(castFit(b, performerOf(b, b.player), reads, [], 'k'));
  });

  it('rises with what the play reads and its demands, and ignores what it doesn’t', () => {
    const sim = life('cast-inputs');
    sim.player.craft = evenCraft(50);
    const perf = performerOf(sim, sim.player);
    const base = castFit(sim, perf, reads, [], 'k');
    sim.player.attrs!.presence = 95;
    expect(castFit(sim, perf, reads, [], 'k')).toBeGreaterThan(base);
    const withPresence = castFit(sim, perf, reads, [], 'k');
    // Stamina and discipline count as full in a casting read: moving them moves nothing.
    sim.player.wellbeing.fitness = 10;
    sim.player.attrs!.discipline = 5;
    expect(castFit(sim, perf, reads, [], 'k')).toBe(withPresence);
    // A play whose kinds ask for singing reads singing.
    const musical = FILM_GENRES.map((g) => g.id).find((id) => genreTags(id).includes('song'))!;
    const sung = withDemands(reads, [musical]);
    const low = castFit(sim, perf, sung, [musical], 'k');
    sim.player.craft.singing = 90;
    expect(castFit(sim, perf, sung, [musical], 'k')).toBeGreaterThan(low);
    expect(castFit(sim, perf, reads, [], 'k')).toBe(withPresence);
  });

  it('weighs delivery a fifth, and no longer the last run’s nights or a heeded note, which read the craft again', () => {
    const s = { craft: evenCraft(60), fit: 70 };
    expect(castScore({ ...s, last: { size: 'supporting' } }, reads)).toBe(70);
    expect(castScore({ ...s, last: { size: 'supporting', delivery: 0.5 } }, reads)).toBeCloseTo(70 * (1 - ESTIMATE.casting.delivery / 2), 9);
    expect(castScore({ ...s, last: { size: 'lead', delivery: 1 } }, reads)).toBe(70 + ESTIMATE.casting.balance.lead);
  });

  it('casts a real term by it, explains the cast, judges the classmates’ run, and leaves recorded work as it was', () => {
    const sim = life('cast-term');
    play(sim, on(2027, 1, 6));
    const read = sim.player.school!.castRead!;
    expect(read).toBeDefined();
    const me = read.rows.find((r) => r.you)!;
    expect(me.fit).toBeGreaterThan(0);
    // Parts go by the read (`partsFor`): the best read first, each takes the first part still open that’s written for
    // their title or for either, and with none left, the company. On this term’s cast, the lowest lead’s read is no
    // lower than the lowest featured place’s. Until 2026-10-13 this said the biggest part written for either went to a
    // higher read than any smaller part’s, which isn’t the rule: a part written for one title can wait past higher reads
    // of the other for one of its own, and go lower than a smaller part does.
    const leads = read.rows.filter((r) => r.size === 'lead').map((r) => r.score);
    const featured = read.rows.filter((r) => r.size === 'featured').map((r) => r.score);
    if (leads.length && featured.length) expect(Math.min(...leads)).toBeGreaterThanOrEqual(Math.min(...featured));
    const before = JSON.stringify(sim.player.work);
    // Play the run out: the classmates in it are judged at its close.
    const shows = sim.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.status === 'pending' && i.payload.call === 'performance' && i.payload.which !== 'rep');
    for (const show of shows) {
      play(sim, show.at - 60_000);
      sim.player.currentLocationId = 'us-ct-newhaven';
      sim.player.awakeSince = show.at - 8 * MS_HOUR;
      sim.advanceTo(show.at + 60_000);
    }
    play(sim, shows.at(-1)!.at + 2 * MS_DAY);
    const judged = sim.player.school!.classmates.filter((m) => m.shown);
    expect(judged.length).toBeGreaterThan(0);
    for (const m of judged) { expect(m.shown!.quality).toBeGreaterThan(0); expect(m.shown!.quality).toBeLessThanOrEqual(100); }
    // Nothing recorded before the run was changed by casting it.
    const kept = JSON.parse(before) as { inputs: { key: string }; overall: number }[];
    for (const w of kept) expect(sim.player.work!.find((x) => x.inputs.key === w.inputs.key)?.overall ?? w.overall).toBe(w.overall);
    // How much of themselves they delivered, gathered night by night for the next casting to read.
    const delivered = (sim.player.school!.casting as { delivered?: { sum: number; n: number } }).delivered!;
    expect(delivered.n).toBeGreaterThan(0);
    expect(delivered.sum / delivered.n).toBeGreaterThan(0);
    expect(delivered.sum / delivered.n).toBeLessThanOrEqual(1);
  }, 240_000);
});

describe('the journey kept', () => {
  const judge = (sim: Simulation, key: string) => evaluate(sim, sim.player, { task: TASK_PROFILES.scene!, techniques: reads, prep: {}, required: {}, difficulty: 0, condition: { readiness: 80 }, key });

  it('counts every piece for good while the detail keeps the latest, and a piece judged again is counted once', () => {
    const sim = life('journey-many');
    for (let n = 0; n < WORK_KEPT + 40; n += 1) recordWork(sim, sim.player, judge(sim, `k${n}`), { at: sim.now + n * MS_DAY, what: `Scene ${n}` });
    expect(sim.player.work).toHaveLength(WORK_KEPT);
    const j = journeyOf(sim.player);
    expect(j.totals.scene!.n).toBe(WORK_KEPT + 40);
    expect(Object.values(j.byTerm).reduce((s, t) => s + (t.scene?.n ?? 0), 0)).toBe(WORK_KEPT + 40);
    const again = judge(sim, `k${WORK_KEPT + 39}`);
    recordWork(sim, sim.player, again, { at: sim.now, what: 'Again' });
    expect(journeyOf(sim.player).totals.scene!.n).toBe(WORK_KEPT + 40);
  });

  it('marks the first strong work once, and a save from before the record marks where its detail began', () => {
    const sim = life('journey-first');
    sim.player.craft = evenCraft(85);
    Object.assign(sim.player.attrs!, { presence: 90, composure: 90, listening: 90, imagination: 90, focus: 90, adaptability: 90, discipline: 90 });
    sim.player.wellbeing.fitness = 90;
    recordWork(sim, sim.player, judge(sim, 'a'), { at: sim.now, what: 'A' });
    recordWork(sim, sim.player, judge(sim, 'b'), { at: sim.now, what: 'B' });
    expect(journeyOf(sim.player).milestones.filter((m) => m.kind === 'first-strong')).toHaveLength(1);
    // A save from 92 with a full detail: the journey built from it, and its beginning marked.
    const u = JSON.parse(JSON.stringify(sim.universe));
    const p = u.people[u.playerId];
    p.work = Array.from({ length: WORK_KEPT }, (_, n) => ({ ...p.work[0], at: p.work[0].at + n, inputs: { ...p.work[0].inputs, key: `old${n}` } }));
    delete p.journey;
    migrate(u);
    expect(p.journey.totals.scene.n).toBe(WORK_KEPT);
    expect(p.journey.detailBefore).toBe(p.work[0].at);
  });

  it('works an old result out again from its own inputs, whatever the person has become since', () => {
    const sim = life('journey-replay');
    const e = judge(sim, 'r');
    const r = recordWork(sim, sim.player, e, { at: sim.now, what: 'R' });
    sim.player.craft = evenCraft(95);
    Object.assign(sim.player.attrs!, { presence: 99, imagination: 99 });
    sim.player.wellbeing.fitness = 5;
    sim.player.birthInstant -= 40 * 365 * MS_DAY;
    expect(replay(r, TASK_PROFILES.scene!)!.overall).toBe(r.overall);
    expect(evaluate(sim, sim.player, { task: TASK_PROFILES.scene!, techniques: reads, prep: {}, required: {}, difficulty: 0, condition: { readiness: 80 }, key: 'r' }).overall).not.toBe(r.overall);
  });
});

describe('every ability and technique to its full', () => {
  it('reaches its full exactly by supported practice, and a session near the top still moves it', () => {
    const sim = life('to-full');
    const targets = [...ABILITY_DEFS.map((d) => d.id), ...TECHNIQUES];
    for (const t of targets) {
      const full = t === 'stamina' ? abilityFull(sim, sim.player, 'stamina') : 100;
      let n = 0;
      // Distinct sources: each a fresh session, as a new day's would be.
      while (levelOf(sim, sim.player, t) < full && n < 5000) { develop(sim, sim.player, t, { weight: 1, focus: 1, deliberate: true, source: `test:${n}` }); n += 1; }
      expect(levelOf(sim, sim.player, t), t).toBe(full);
      expect(n, t).toBeLessThan(5000);
    }
    // Every target but stamina (a workout) and discipline (a day practiced) has an exercise the player can do.
    const trained = new Set(EXERCISES.map((e) => e.trains));
    for (const t of targets) if (t !== 'stamina' && t !== 'discipline') expect(trained.has(t), t).toBe(true);
    // Near the top a session still adds something.
    const near = life('near-top');
    near.player.attrs!.focus = 97;
    expect(develop(near, near.player, 'focus', { weight: 1, focus: 1, deliberate: true, source: 'x' })).toBeGreaterThan(0.05);
  });
});

describe('the guarantee, with a genre’s demands in the work', () => {
  it('gives a self-tape 100 in any genre once its abilities are full, its techniques mastered, the genre known and the day good', () => {
    const sim = life('tape-max');
    play(sim, instantFromZoned({ year: 2026, month: 9, day: 6, hour: 17 }, 'America/New_York'));
    const p = sim.player;
    p.craft = evenCraft(MASTERED);
    for (const k of ['emotion', 'memorization', 'voice', 'movement'] as const) p.craft[k] = 100;
    p.attrs = { presence: 100, composure: 100, listening: 100, imagination: 100, focus: 100, adaptability: 100, discipline: 100 };
    p.wellbeing.fitness = abilityFull(sim, p, 'stamina');
    for (const id of FILM_GENRES.map((g) => g.id).filter((g) => genreTags(g).length).slice(0, 12)) {
      // Known to what a take counts complete (until 2026-10-13 to the genre tape’s 60, `SELF_TAPE.genreComplete`, which no
      // take read once tapes were of briefs; past the brief’s 30, it came to the same).
      genreState(p, id).familiarity = BRIEF.complete.genre * 100;
      // A taped brief (from 2026-10-12): its reading chosen and its preparation complete, as the guarantee asks.
      const b = briefsOf(id)[0]!;
      sim.execute({ kind: 'brief.choose', payload: { brief: b.id, reading: b.readings[0]!.id } });
      recordOf(p, b.id).prep = { interpretation: 1, memorization: 1, rehearsal: 1 };
      Object.assign(p.wellbeing, { energy: 95, stress: 5, sleepDebt: 0, nourishment: 90, morale: 80 });
      const r = sim.execute<{ overall: number }>({ kind: 'practice.self_tape', payload: { genre: id } });
      expect(r.ok && r.value!.overall, id).toBe(100);
    }
  });
});

describe('what a play’s material asks of its work (from 2026-10-10)', () => {
  const plays = [...THESIS_PLAYS, ...SHAKESPEARE_PLAYS, ...REP_PLAYS, ...SUMMER_PLAYS];

  it('reads each play’s own techniques and its material’s, and no technique a genre tag alone would have added', () => {
    // Until the material profiles, every play tagged a farce read physical comedy: The Importance of Being Earnest,
    // whose comedy is verbal, among them. Its kinds still say farce; its material doesn't ask clowning.
    const earnest = castingReads({ play: 'The Importance Of Being Earnest' });
    expect(genreTags('farce').map((t) => DEMAND_TECHNIQUE[t])).toContain('clown');
    expect(earnest.clown).toBeUndefined();
    for (const p of plays) {
      const m = MATERIAL_BY_ID[p.title];
      expect(m, p.title).toBeDefined();
      const r = castingReads({ play: p.title });
      for (const [k, w] of Object.entries(p.reads)) expect(r[k as keyof typeof r], `${p.title} ${k}`).toBe(w);
      for (const k of Object.keys(r)) expect(k in p.reads || k in (m!.techniques ?? {}), `${p.title} reads ${k} from nowhere`).toBe(true);
    }
  });

  it('reads a coursework scene’s material in the scene’s judgement: its techniques, and its features’ abilities', () => {
    const sim = life('scene-demands');
    const person = sim.player;
    // Much Ado's church scene: period text spoken at speed, which the material asks as classical technique.
    const scene = SCENES.find((s) => s.play === 'Much Ado About Nothing')!;
    const a = { id: 'm', course: 'X', template: 'scene-study', term: 0, setOn: '2026-09-01', dueOn: '2026-09-02', sceneId: scene.id, role: 0 as const, prep: { familiarity: 0, memorization: 0, interpretation: 0, rehearsal: 0, partner: 0, revision: 0 }, answers: {}, steps: {}, practicedOn: {}, trained: 0, rehearsals: [], status: 'done' } as unknown as Assignment;
    const e = judgeWork(sim, person, a, '2026-09-02', sim.now, 'm');
    const own = templateById('scene-study')!.reads as Partial<Record<string, number>>;
    expect(own.classical).toBeUndefined();
    expect(e.inputs.techniques.classical).toBe(MATERIAL_BY_ID[scene.id]!.techniques!.classical);
    // Its timing asks listening of its responsiveness, beyond the task's own weight for it.
    expect(e.inputs.inputs?.responsiveness?.some((x) => x.ability === 'listening')).toBe(true);
    expect(e.inputs.families).toEqual([]);
  });
});
