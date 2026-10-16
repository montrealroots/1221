/**
 * Phase 2b of the owner's brief "Perfect The Attributes, Genres, And Their Integration Through Demonstrable Gameplay"
 * (2026-10-16; docs/verification/attributes-genres-2026-10-16/phase-2b.md). Each block holds one step, and each failed
 * on the code before the step:
 * 1. Knowing the genre read over its whole range, with a smaller gate (`EVALUATION.partFloor`, `BRIEF.complete.genre`),
 *    and a take credits its genres as practice by how far it was prepared (`practiceShare`).
 * 2. What a piece demands decides which abilities count (`BASE_INPUTS`, `DEMAND_EFFECT`): a longer text asks memory, more
 *    at stake composure, less of a partner presence, more beats discipline, a grave piece emotional depth, a comic one
 *    focus, an invented world imagination; and no one ability is best on most of a kind of work.
 * 3. Stamina's load by a piece's length (`PIECE.load`): a night draws on it more than a light brief or scene.
 * 4. Listening speeds a brief rehearsed against its reader (and an evening with a partner or a reader); adaptability a
 *    director's note on the blocking worked into a part (`stepSpeed`).
 * TEST SETUP throughout: levels and parts written directly where a block says so, and the clock's own commitments
 * cleared where a step is taken through its command, as tests/attributes-phase-2a.test.ts does.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR } from '@/engine/core/time';
import type { Person } from '@/engine/domain/model';
import { ABILITY_DEFS, MASTERED, STEP_SPEED, type AbilityId } from '@/engine/content/abilities';
import { BRIEFS, BRIEF_BY_ID, type Brief } from '@/engine/content/briefs';
import { PLAY_MATERIAL, SCENE_MATERIAL, type MaterialProfile } from '@/engine/content/material';
import { PIECE } from '@/engine/content/piece';
import { EVALUATION, TASK_PROFILES } from '@/engine/content/tasks';
import { instantFromZoned } from '@/engine/core/time';
import { attributesOf } from '@/engine/systems/attributes';
import { BRIEF, briefContext, briefPiece, practiceShare, prepareBrief, recordOf, requiredOf, prepareRefusal } from '@/engine/systems/briefs';
import type { Performer } from '@/engine/systems/evaluation';
import { materialContext } from '@/engine/systems/material';
import { judgePiece, loadOf, unitSegments } from '@/engine/systems/piece';
import { hasProcess, type Process } from '@/engine/systems/production';
import { CALL_KIND, NIGHT_DIFFICULTY } from '@/engine/systems/school';
import { PREP_DIMS } from '@/engine/content/coursework';
import { READER, courseworkOf, mateRecord, partnerPart, questionsFor, type Assignment } from '@/engine/systems/coursework';

const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const clearDay = (sim: Simulation) => { for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now); };
const rested = (sim: Simulation) => { const w = sim.player.wellbeing; w.energy = 100; w.stress = 0; w.morale = 80; w.nourishment = 90; w.hygiene = 100; w.sleepDebt = 0; };

const nobody = { engagement: { byGenre: {} } } as unknown as Person;
const MASTER: Performer = { ability: () => 100, full: () => 100, technique: () => MASTERED };
/** The developing actor of baseline §5: every ability 50, every technique 40. */
const DEVELOPING: Performer = { ability: () => 50, full: () => 100, technique: () => 40 };
/** A take of a brief fully prepared on a sufficient day, no draw, the genre known as given (TEST SETUP: the part set directly). */
const take = (b: Brief, p: Performer, known: number) => {
  const rec = { prep: { interpretation: 1, memorization: 1, rehearsal: 1 }, takes: [] };
  const ctx = briefContext(nobody, b, rec, { reading: b.readings[0]!.id, prep: { genre: known } });
  return judgePiece('p2b', p, { ...ctx, condition: { readiness: 100 }, key: `p2b:${b.id}`, expected: true }, briefPiece(b, { ...rec, reading: b.readings[0]!.id }));
};

// ---------------------------------------------------------------------------------------------------------------
// 1. Knowing the genre
// ---------------------------------------------------------------------------------------------------------------

describe('knowing the genre reads over its whole range, with a gate a master clears', () => {
  const sample = BRIEFS.filter((_, i) => i % 10 === 0);

  it('costs a mastered actor a tenth or so with the genre never met, and nothing once it is known to 90', () => {
    for (const b of sample) {
      const none = take(b, MASTER, 0);
      // The gate: the interpretation's preparation keeps three quarters (`partFloor`), so the master stays Exceptional.
      expect(none.overall, b.id).toBeGreaterThanOrEqual(EVALUATION.bands.exceptional);
      expect(none.overall, b.id).toBeLessThan(100);
      const known = take(b, MASTER, BRIEF.complete.genre);
      expect(known.overall, b.id).toBe(100);
      expect(known.mastery, b.id).toBe(true);
    }
  });

  it('raises the take with every step from 0 to 90 known, past the 30 that completed it until 2026-10-16, by a tenth or more a step', () => {
    for (const b of sample) {
      const at = [0, 0.3, 0.6, 0.9].map((k) => take(b, DEVELOPING, k).overall);
      for (let i = 1; i < at.length; i += 1) expect(at[i]! - at[i - 1]!, `${b.id} at ${at.join(', ')}`).toBeGreaterThanOrEqual(0.1);
      // Past complete it adds nothing.
      expect(take(b, DEVELOPING, 1).overall).toBe(at[3]);
    }
  });

  it('is complete at 90, as a technique is mastered, and floored at three quarters of the interpretation', () => {
    expect(requiredOf(BRIEF_BY_ID['brief-drama']!).genre).toBe(0.9);
    expect(EVALUATION.partFloor.genre).toBe(0.75);
  });
});

describe('a take credits its genres by how far it was prepared', () => {
  it('credits a cold take its seventh, a complete one in full, and between in step with the parts', () => {
    const b = BRIEF_BY_ID['brief-drama']!;
    const req = requiredOf(b);
    expect(practiceShare({ prep: { interpretation: 0, memorization: 0, rehearsal: 0 } }, b)).toBeCloseTo(BRIEF.practiceUnprepared, 12);
    expect(practiceShare({ prep: { interpretation: req.interpretation!, memorization: 1, rehearsal: 0.97 } }, b)).toBeCloseTo(1, 12);
    expect(practiceShare({ prep: { interpretation: req.interpretation! / 2, memorization: 0, rehearsal: 0 } }, b)).toBeCloseTo(BRIEF.practiceUnprepared + (1 - BRIEF.practiceUnprepared) / 6, 12);
  });

  it('PLAYER JOURNEY: taping cold, a new brief in a new genre every hour, credits no more genre practice an hour than preparing one brief and taping it', () => {
    const practice = (sim: Simulation) => Object.values(sim.player.engagement?.byGenre ?? {}).reduce((s, g) => s + g.practice, 0);
    const tape = (sim: Simulation, b: Brief) => {
      if (!recordOf(sim.player, b.id).reading) expect(sim.execute({ kind: 'brief.choose', payload: { brief: b.id, reading: b.readings[0]!.id } }).ok).toBe(true);
      const r = sim.execute({ kind: 'practice.self_tape', payload: { genre: b.kinds[0], brief: b.id } });
      expect(r.ok, r.error).toBe(true);
    };
    // Cold: three hours, three briefs of three genres, no step taken on any.
    const cold = life('p2b-credit');
    clearDay(cold); rested(cold);
    const t0 = cold.now, p0 = practice(cold);
    for (const b of [BRIEF_BY_ID['brief-drama']!, BRIEF_BY_ID['brief-comedy']!, BRIEF_BY_ID['brief-horror']!]) { clearDay(cold); rested(cold); tape(cold, b); }
    const coldRate = (practice(cold) - p0) / ((cold.now - t0) / MS_HOUR);
    // Prepared: one brief, each part complete through its own steps (one a day per step, so none is a repeat), then taped.
    const prep = life('p2b-credit');
    const b = BRIEF_BY_ID['brief-drama']!;
    const req = requiredOf(b);
    let hours = 0;
    const done = () => { const p = recordOf(prep.player, b.id).prep; return p.interpretation >= req.interpretation! && p.memorization >= req.memorization! && p.rehearsal >= req.rehearsal!; };
    for (let day = 0; day < 10 && !done(); day += 1) {
      for (const s of ['read', 'lines', 'rehearse'] as const) {
        clearDay(prep); rested(prep);
        const part = s === 'read' ? 'interpretation' : s === 'lines' ? 'memorization' : 'rehearsal';
        if (recordOf(prep.player, b.id).prep[part] >= req[part]! || prepareRefusal(prep, prep.player, b, s)) continue;
        const from = prep.now;
        expect(prep.execute({ kind: 'brief.prepare', payload: { brief: b.id, step: s } }).ok).toBe(true);
        hours += (prep.now - from) / MS_HOUR;
      }
      prep.advanceTo(prep.now + 24 * MS_HOUR);
    }
    expect(done()).toBe(true);
    clearDay(prep); rested(prep);
    const q0 = practice(prep), from = prep.now;
    tape(prep, b);
    hours += (prep.now - from) / MS_HOUR;
    const prepRate = (practice(prep) - q0) / hours;
    expect(coldRate, `cold ${coldRate.toFixed(3)} an hour, prepared ${prepRate.toFixed(3)}`).toBeLessThanOrEqual(prepRate);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// 2. What a piece demands
// ---------------------------------------------------------------------------------------------------------------

const EVEN: Performer = { ability: () => 50, full: () => 100, technique: () => 50 };
const plus = (p: Performer, a: AbilityId, by: number): Performer => ({ ...p, ability: (id) => (id === a ? p.ability(id) + by : p.ability(id)) });
/** The effect of +10 on one ability for the even actor, on a brief fully prepared, the genre known, the first reading. */
const effectOn = (b: Brief, a: AbilityId) => take(b, plus(EVEN, a, 10), 1).overall - take(b, EVEN, 1).overall;
/** A brief like another but in what's given (TEST SETUP: a variant with its own id, so its material is its own). */
let variants = 0;
const like = (b: Brief, over: Partial<Brief>): Brief => ({ ...b, ...over, id: `${b.id}~p2b-${(variants += 1)}` });
const beatsOf = (n: number, tone: 'grave' | 'comic' | 'lyric') => Array.from({ length: n }, () => ({ what: 'A beat.', tones: [tone] }));

/** A scene shown in class or a night of a play, fully prepared, as the baseline judges one (TEST SETUP: the parts set). */
function work(m: MaterialProfile, night: boolean, p: Performer): number {
  const task = night ? TASK_PROFILES.performance! : TASK_PROFILES.scene!;
  const read = materialContext(task, m);
  const parts = night ? ['lines', 'blocking', 'notes'] : ['familiarity', 'memorization', 'interpretation', 'rehearsal', 'partner'];
  return judgePiece('p2b', p, {
    task, techniques: { scene: 1, ...(m.techniques ?? {}) }, prep: Object.fromEntries(parts.map((k) => [k, 1])), required: Object.fromEntries(parts.map((k) => [k, 0.9])),
    difficulty: night ? NIGHT_DIFFICULTY.school.supporting : -0.3, condition: { readiness: 100 }, lean: read.lean, inputs: read.inputs, key: 'p2b', expected: true,
  }, { segments: unitSegments(m, 2), work: [], part: night ? 'blocking' : 'rehearsal', perTurn: night ? 0 : PIECE.scene.perTurn, perBlend: 0, most: night ? 1 : PIECE.scene.most, load: loadOf(m, night ? 'night' : 'scene') }).overall;
}

describe('what a piece demands decides which abilities count', () => {
  const base = BRIEF_BY_ID['brief-drama']!;

  it('asks memory more of a longer text, composure more of higher stakes, presence more of a piece with less of a partner', () => {
    expect(effectOn(like(base, { size: 'long' }), 'memory')).toBeGreaterThan(effectOn(like(base, { size: 'short' }), 'memory') + 0.3);
    expect(effectOn(like(base, { stakes: 3 }), 'composure')).toBeGreaterThan(effectOn(like(base, { stakes: 0 }), 'composure') + 0.3);
    // Composure's own: the stakes lean consistency, which discipline shares, and composure gains more of it than discipline
    // does (a mutation that kept the lean and took composure's input out survived the line above, and a margin of 0.2).
    const rise = (a: AbilityId) => effectOn(like(base, { stakes: 3 }), a) - effectOn(like(base, { stakes: 0 }), a);
    // Measured: composure 1.1 and discipline 0 from stakes 0 to 3; with the lean alone, 0.6 and 0.2.
    expect(rise('composure')).toBeGreaterThan(rise('discipline') + 0.6);
    expect(effectOn(like(base, { partner: 0 }), 'presence')).toBeGreaterThan(effectOn(like(base, { partner: 3 }), 'presence') + 0.3);
  });

  it('asks discipline more of more beats, emotional depth of a grave piece, focus of a comic one, imagination of a lyric one', () => {
    expect(effectOn(like(base, { beats: beatsOf(6, 'grave') }), 'discipline')).toBeGreaterThan(effectOn(like(base, { beats: beatsOf(3, 'grave') }), 'discipline') + 0.2);
    expect(effectOn(like(base, { beats: beatsOf(3, 'grave') }), 'emotionalDepth')).toBeGreaterThan(effectOn(like(base, { beats: beatsOf(3, 'comic') }), 'emotionalDepth') + 0.3);
    expect(effectOn(like(base, { beats: beatsOf(3, 'comic') }), 'focus')).toBeGreaterThan(effectOn(like(base, { beats: beatsOf(3, 'grave') }), 'focus') + 0.3);
    expect(effectOn(like(base, { beats: beatsOf(3, 'lyric') }), 'imagination')).toBeGreaterThan(effectOn(like(base, { beats: beatsOf(3, 'grave') }), 'imagination') + 0.2);
  });

  it('has no ability best on half or more of the briefs, the scenes or the nights: the specialist built on it, 85 against the rest lowered to keep the budget', () => {
    const abilities = ABILITY_DEFS.map((d) => d.id);
    const specialist = (a: AbilityId): Performer => ({ ability: (id) => (id === a ? 85 : (600 - 85) / 11), full: () => 100, technique: () => 50 });
    const bestOf = (score: (p: Performer) => number) => { let best = 'even', top = score(EVEN); for (const a of abilities) { const s = score(specialist(a)); if (s > top + 1e-9) { best = a; top = s; } } return best; };
    const most = (xs: string[]) => { const m: Record<string, number> = {}; for (const x of xs) m[x] = (m[x] ?? 0) + 1; return Math.max(...Object.values(m)) / xs.length; };
    // Every other brief, the mean of its readings as baseline §2 reads it.
    const briefs = BRIEFS.filter((_, i) => i % 2 === 0).map((b) => bestOf((p) => b.readings.reduce((s, r) => {
      const rec = { prep: { interpretation: 1, memorization: 1, rehearsal: 1 }, takes: [] };
      const ctx = briefContext(nobody, b, rec, { reading: r.id, prep: { genre: 1 } });
      return s + judgePiece('p2b', p, { ...ctx, condition: { readiness: 100 }, key: 'p2b', expected: true }, briefPiece(b, { ...rec, reading: r.id })).overall;
    }, 0)));
    const scenes = SCENE_MATERIAL.map((m) => bestOf((p) => work(m, false, p)));
    const nights = PLAY_MATERIAL.map((m) => bestOf((p) => work(m, true, p)));
    // Until 2026-10-16: emotional depth best on 90% of the briefs, listening on all 56 scenes and all 30 nights (H2).
    expect(most(briefs)).toBeLessThanOrEqual(0.5);
    expect(most(scenes)).toBeLessThanOrEqual(0.5);
    expect(most(nights)).toBeLessThanOrEqual(0.5);
  }, 120_000);
});

// ---------------------------------------------------------------------------------------------------------------
// 3. Stamina by length
// ---------------------------------------------------------------------------------------------------------------

describe('stamina counts by how long and how hard a piece is', () => {
  it('loads a night as a whole evening, and a long brief more than a medium one', () => {
    expect(loadOf({ physical: 0, vocal: 0 }, 'night')).toBe(PIECE.load.night);
    expect(PIECE.load.night).toBeGreaterThanOrEqual(0.6);
    const b = BRIEF_BY_ID['brief-drama']!;
    expect(briefPiece(like(b, { size: 'long' }), {}).load).toBeGreaterThan(briefPiece(like(b, { size: 'medium' }), {}).load + 0.1);
  });

  it('gives +10 stamina half a point or more on a night, on the mean of the plays, and a tenth or less on a light brief', () => {
    const plays = PLAY_MATERIAL.map((m) => work(m, true, plus(EVEN, 'stamina', 10)) - work(m, true, EVEN));
    expect(plays.reduce((a, x) => a + x, 0) / plays.length).toBeGreaterThanOrEqual(0.5);
    const light = like(BRIEF_BY_ID['brief-drama']!, { size: 'short', physical: 0, vocal: 0 });
    // At the precision a take is kept to (from 2026-10-16: the genre's register left it at 0.1 and a float's remainder).
    expect(Math.round(effectOn(light, 'stamina') * 1000) / 1000).toBeLessThanOrEqual(0.1);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// 4. What speeds a step
// ---------------------------------------------------------------------------------------------------------------

describe('listening and adaptability speed the steps their descriptions name', () => {
  const ratio = (lo: number, hi: number) => (STEP_SPEED.least + (STEP_SPEED.most - STEP_SPEED.least) * (hi / 100)) / (STEP_SPEED.least + (STEP_SPEED.most - STEP_SPEED.least) * (lo / 100));

  it('rehearses a brief on its feet further with more listening, against its reader, by the ratio of the two speeds; a voice brief by neither', () => {
    const moved = (listening: number, b: Brief) => {
      const sim = life('p2b-rehearse');
      clearDay(sim); rested(sim);
      attributesOf(sim, sim.player).listening = listening;
      recordOf(sim.player, b.id).prep.memorization = 0.5; // TEST SETUP: enough of the lines to rehearse.
      return prepareBrief(sim, sim.player, b, 'rehearse').moved;
    };
    const drama = BRIEF_BY_ID['brief-drama']!;
    // To the thousandth the part is kept to (`r3`).
    expect(moved(80, drama) / moved(20, drama)).toBeCloseTo(ratio(20, 80), 2);
    const voice = BRIEFS.find((b) => b.medium === 'voice')!;
    expect(moved(80, voice)).toBe(moved(20, voice));
  });

  it('PLAYER JOURNEY: an evening run with a reader in the partner’s place goes further with more listening, by the ratio of the two speeds', () => {
    const moved = (listening: number) => {
      const sim = life('p2b-reader');
      clearDay(sim); rested(sim);
      attributesOf(sim, sim.player).listening = listening;
      // TEST SETUP: a scene-study assignment, its table work answered as the text supports, as tests/attributes-phase-2a.test.ts sets one.
      const a: Assignment = {
        id: 'p2b-reader', course: 'DRAM 103a/b', template: 'scene-study', term: 1, setOn: '2026-09-07', dueOn: '2026-12-01', sceneId: 'seagull-4', role: 0, partner: 0,
        prep: { ...Object.fromEntries(PREP_DIMS.map((d) => [d, 0])), familiarity: 0.6, memorization: 0.6 } as Assignment['prep'], answers: {}, steps: {}, practicedOn: {}, trained: 0, rehearsals: [], status: 'open',
      };
      for (const { q, options } of questionsFor(a)) a.answers[q.id] = options.find((o) => o.supported)!.id as never;
      courseworkOf(sim, sim.player)!.assignments.push(a);
      mateRecord(sim.player.school!.classmates[0]!).met = sim.now;
      const r = sim.execute<{ moved: number }>({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: READER.id } });
      expect(r.ok, r.error).toBe(true);
      return partnerPart(a);
    };
    // The step is practice in listening too, and that grows after the part has moved, so the ratio is the speeds'.
    expect(moved(80) / moved(20)).toBeCloseTo(ratio(20, 80), 6);
  });

  it('PLAYER JOURNEY: a director’s note on the blocking, worked into the part, goes further with more adaptability, by the ratio of the two speeds', () => {
    const moved = (adaptability: number) => {
      const sim = life('p2b-note');
      // The first spring's festival, cast on 4 January 2027, to the evening of its first rehearsal call, the day kept
      // rested as tests/direction.test.ts keeps it.
      sim.advanceTo(instantFromZoned({ year: 2027, month: 1, day: 4, hour: 9 }, 'America/New_York') + 60_000);
      const first = sim.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.payload.which !== 'rep' && i.payload.call === 'rehearsal').sort((x, y) => x.at - y.at)[0]!;
      while (sim.now < first.at + 7 * MS_HOUR) { rested(sim); sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now); sim.advanceTo(Math.min(first.at + 7 * MS_HOUR, sim.now + 6 * MS_HOUR)); }
      const c = sim.player.school!.casting!;
      expect(hasProcess(c)).toBe(true);
      const proc = (c as unknown as { process: Process }).process;
      // TEST SETUP: the blocking half set and the director's last note on it, as a missed call leaves them.
      proc.blocking = 0.5;
      proc.notes.push({ at: sim.now, text: 'The blocking isn’t set in you.', focus: { kind: 'blocking' } });
      attributesOf(sim, sim.player).adaptability = adaptability;
      rested(sim);
      const r = sim.execute({ kind: 'school.work_note', payload: {} });
      expect(r.ok, r.error).toBe(true);
      return proc.blocking - 0.5;
    };
    // To a thousandth: the note is practice in adaptability (`ordinary`), and that hair of growth lands before the speed is read.
    expect(moved(80) / moved(20)).toBeCloseTo(ratio(20, 80), 3);
  });
});
