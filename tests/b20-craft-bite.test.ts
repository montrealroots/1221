/**
 * Brief 20, the craft area's controlled comparisons (criteria B1 and B3; docs/verification/audit-2026-10-21/areas/craft):
 * two lives alike in everything but one input, from the same seed, through the same commands and the same clock, and the
 * difference the input should make where it's relevant, with its size or direction, and none where it isn't.
 *
 * The take of a practice brief (`practice.self_tape`) is judged the moment it's taped, so the comparisons on a take run
 * at commands alone: the clock's commitments cleared and the day held rested before each command (`clearDay`, `rest`),
 * both twins taped at one instant, so the draw's key (the person, the brief, the day) and the hour's fit are the same.
 * TEST SETUP in each is only the input under test, set before the first command: an ability's level (`setAbility`) or
 * a flu (`fluUntil`). Genre experience is the player's own (`genre.study`), and so is tiredness: a night not slept, the
 * clock moved an hour at a time through it as a player who is there moves it.
 *
 * Figures measured on 2026-10-21 at 12c04ee1 (each test logs its own with `FIGURES`, and asserts their direction and
 * the equalities); the area's report gives them.
 */
import { describe, expect, it } from 'vitest';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR } from '@/engine/core/time';
import { BRIEF_BY_ID } from '@/engine/content/briefs';
import { EXERCISE_BY_ID } from '@/engine/content/practice';
import { genresOfPlay } from '@/engine/content/plays';
import { sceneById } from '@/engine/content/coursework';
import { abilitiesOf } from '@/engine/systems/attributes';
import { recordOf } from '@/engine/systems/briefs';
import { readiness } from '@/engine/systems/life';
import { bandOfQuality } from '@/engine/systems/evaluation';
import { at, clearDay, live, run, sceneStudy, setAbility, student, tend } from './fakes/craft-life';

/** A short camera brief with a reader, judged as a take on its feet is not (`tape`). */
const B = BRIEF_BY_ID['brief-absurdist']!;
/** A brief of another genre, which nothing below studies. */
const OTHER = BRIEF_BY_ID['brief-anthology']!;
/** The instant every take is taped at: a Saturday afternoon before classes begin, nothing on the calendar. */
const T = at(2026, 8, 29, 14);

const rest = (sim: Simulation) => { clearDay(sim); Object.assign(sim.player.wellbeing, { energy: 95, stress: 15, sleepDebt: 0, nourishment: 80, hygiene: 80, morale: 60 }); };
const go = <V = Record<string, unknown>>(sim: Simulation, kind: string, payload: Record<string, unknown>) => { rest(sim); return run<V>(sim, kind, payload); };
const FULL = ['read', 'lines', 'lines', 'rehearse', 'rehearse'] as const;

/** A brief chosen, prepared by the steps given, and taped at `T` (rested where `rested`). */
function take(sim: Simulation, steps: readonly string[] = FULL, b = B, rested = true): { overall: number; band: string; prep: Record<string, number> } {
  go(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id });
  for (const s of steps) go(sim, 'brief.prepare', { brief: b.id, step: s });
  if (rested) { rest(sim); sim.advanceTo(T); rest(sim); }
  const v = run<{ overall: number; band: string }>(sim, 'practice.self_tape', { genre: b.kinds[0], brief: b.id });
  return { overall: v.overall, band: v.band, prep: { ...recordOf(sim.player, b.id).prep } };
}

describe('B1, attributes: each ability a take reads moves its judgment, the right way', () => {
  // Eight abilities the tape profile reads (`content/tasks.ts`, `tape`). Imagination, memory and listening speed their own
  // steps too (`stepSpeed`), so their twins' preparation differs as well, the same way; the other five's is the same.
  const cases = ['emotionalDepth', 'presence', 'composure', 'adaptability', 'focus', 'imagination', 'memory', 'listening'] as const;
  it.each(cases)('%s at 20 against 90: the take of the same brief, prepared the same way, at the same hour', (id) => {
    const lo = student('b20c-ability'); setAbility(lo, id, 20);
    const hi = student('b20c-ability'); setAbility(hi, id, 90);
    const L = take(lo), H = take(hi);
    console.log('FIGURES ability', id, L.overall, H.overall, JSON.stringify(L.prep), JSON.stringify(H.prep));
    expect(H.overall).toBeGreaterThan(L.overall);
    if (!['imagination', 'memory', 'listening'].includes(id)) expect(H.prep).toEqual(L.prep);
  });

  it('an ability is read where it’s held: the twins differ in nothing the take reads but that one level', () => {
    const lo = student('b20c-ability'); setAbility(lo, 'composure', 20);
    const hi = student('b20c-ability'); setAbility(hi, 'composure', 90);
    const others = (sim: Simulation) => { const a = abilitiesOf(sim, sim.player) as Record<string, number>; delete a.composure; return a; };
    take(lo); take(hi);
    expect(others(hi)).toEqual(others(lo));
    expect(hi.player.craft).toEqual(lo.player.craft);
  });
});

describe('B1, genre experience: studied, it improves work in its genre and not in an unrelated one', () => {
  const SCENE_SEED = 'b20c-genre-scene-22';
  /** Six days with a session a day of `genre`, the player's own Study (`genre.study`). */
  const studied = (genre: string) => {
    const sim = student('b20c-genre');
    for (let d = 0; d < 5; d += 1) { rest(sim); sim.advanceTo(at(2026, 8, 24 + d, 15)); go(sim, 'genre.study', { genre }); }
    return sim;
  };
  it('the take of a brief in the genre studied is better; a brief of a third genre comes out the same', () => {
    const inIt = studied(B.kinds[0]!), apart = studied('western');
    expect(inIt.player.engagement!.byGenre[B.kinds[0]!]!.familiarity).toBeGreaterThan(30);
    const a = take(inIt, FULL, B), b = take(apart, FULL, B);
    console.log('FIGURES genre take', B.kinds[0], a.overall, b.overall);
    expect(a.overall).toBeGreaterThan(b.overall);
    // The breakdown, the lines and the rehearsal moved alike: knowing the genre is a part of the take's preparation, not a
    // speed on the brief's steps (`prepSpeed` reads the material's features, `genreKnown` the genre).
    expect(a.prep).toEqual(b.prep);
    const inIt2 = studied(B.kinds[0]!), apart2 = studied('western');
    const c = take(inIt2, FULL, OTHER), d = take(apart2, FULL, OTHER);
    console.log('FIGURES genre unrelated', OTHER.kinds[0], c.overall, d.overall);
    expect(c.overall).toBe(d.overall);
  });

  it('a scene from a play of a kind studied is prepared faster; studying an unrelated kind leaves the step as it was', () => {
    // The first Scene Study is set at orientation's session on the courses (28 August): its scene's play's kinds. Most of
    // the scenes' plays have none the game knows (`genresOfPlay`); on this seed the scene the course sets is Trifles, a
    // mystery and a drama (seeds b20c-genre-scene-0 to -21 drew plays with none).
    const first = student(SCENE_SEED);
    live(first, at(2026, 8, 29, 9));
    const a0 = sceneStudy(first)!;
    const kinds = genresOfPlay(sceneById(a0.sceneId!)!.play) ?? [];
    expect(kinds.length).toBeGreaterThan(0);
    const readStep = (genre: string | undefined) => {
      const sim = student(SCENE_SEED);
      live(sim, at(2026, 8, 29, 9));
      if (genre) for (const h of [10, 14, 34]) { rest(sim); sim.advanceTo(at(2026, 8, 29, h)); go(sim, 'genre.study', { genre }); }
      else for (const h of [10, 14, 34]) { rest(sim); sim.advanceTo(at(2026, 8, 29, h)); go(sim, 'genre.study', { genre: kinds.includes('western') ? 'heist' : 'western' }); }
      rest(sim); sim.advanceTo(at(2026, 8, 30, 18)); rest(sim);
      return go<{ moved: number }>(sim, 'school.prepare', { assignmentId: sceneStudy(sim)!.id, activity: 'read' }).moved;
    };
    const known = readStep(kinds[0]), unrelated = readStep(undefined);
    const nothing = (() => { const sim = student(SCENE_SEED); live(sim, at(2026, 8, 29, 9)); for (const h of [10, 14, 34]) { rest(sim); sim.advanceTo(at(2026, 8, 29, h)); sim.advanceTo(sim.now + 90 * 60_000); } rest(sim); sim.advanceTo(at(2026, 8, 30, 18)); rest(sim); return go<{ moved: number }>(sim, 'school.prepare', { assignmentId: sceneStudy(sim)!.id, activity: 'read' }).moved; })();
    console.log('FIGURES genre scene step', kinds.join('+'), known, unrelated, nothing);
    expect(known).toBeGreaterThan(unrelated);
    expect(unrelated).toBe(nothing);
  });
});

describe('B1, preparation: each part of a take\'s preparation moves its judgment, and one left at nothing holds the band down', () => {
  it('the breakdown, the lines and the rehearsal, each left out against the full preparation', () => {
    const full = take(student('b20c-prep'));
    const noRead = take(student('b20c-prep'), ['lines', 'lines', 'rehearse', 'rehearse']);
    const noRehearse = take(student('b20c-prep'), ['read', 'lines', 'lines']);
    const lessLines = take(student('b20c-prep'), ['read', 'lines', 'rehearse', 'rehearse']);
    console.log('FIGURES prep', full.overall, full.band, noRead.overall, noRead.band, noRehearse.overall, noRehearse.band, lessLines.overall, JSON.stringify(full.prep), JSON.stringify(lessLines.prep));
    expect(noRead.prep.interpretation).toBe(0);
    expect(noRead.overall).toBeLessThan(full.overall);
    expect(noRehearse.overall).toBeLessThan(full.overall);
    expect(lessLines.prep.memorization).toBeLessThan(full.prep.memorization!);
    expect(lessLines.overall).toBeLessThan(full.overall);
    // The breakdown at nothing holds the take a band down: the dimensions that read it keep only `prepFloor` of themselves.
    expect(bandOfQuality(noRead.overall)).toBe('unready');
    expect(bandOfQuality(full.overall)).not.toBe('unready');
  });
});

describe('B1, the day: a tired or ill actor\'s take is judged worse than a rested one\'s', () => {
  it('a night not slept, lived through the clock, against a night slept', () => {
    const slept = student('b20c-day'), up = student('b20c-day');
    for (const sim of [slept, up]) {
      go(sim, 'brief.choose', { brief: B.id, reading: B.readings[0]!.id });
      for (const s of FULL) go(sim, 'brief.prepare', { brief: B.id, step: s });
      clearDay(sim); tend(sim);
    }
    // To bed at eleven on the 28th for eight hours, or kept up through it an hour at a time; both tended to then.
    live(slept, T, { from: at(2026, 8, 28) });
    live(up, T, { from: at(2026, 8, 28), upFrom: at(2026, 8, 28, 22) });
    clearDay(slept); clearDay(up);
    const rRested = readiness(slept.player), rTired = readiness(up.player);
    const a = run<{ overall: number }>(slept, 'practice.self_tape', { genre: B.kinds[0], brief: B.id });
    const b = run<{ overall: number }>(up, 'practice.self_tape', { genre: B.kinds[0], brief: B.id });
    const last = (sim: Simulation) => (sim.player.work ?? []).at(-1)!;
    console.log('FIGURES day tired', rRested.toFixed(1), rTired.toFixed(1), a.overall, b.overall, JSON.stringify(last(slept).dims), JSON.stringify(last(up).dims));
    expect(rTired).toBeLessThan(60);
    expect(rRested).toBeGreaterThanOrEqual(60);
    expect(b.overall).toBeLessThan(a.overall);
    // The day as the take read it, and where it reached: the dimensions whose conditions name fatigue, not interpretation.
    expect(last(up).inputs.condition.readiness).toBeLessThan(60);
    expect(last(up).dims.believability).toBeLessThan(last(slept).dims.believability!);
    expect(last(up).dims.interpretation).toBe(last(slept).dims.interpretation);
  });

  it('down with the flu (TEST SETUP: the flu itself), the take is worse, through the dimension the flu reaches', () => {
    const well = student('b20c-flu'), ill = student('b20c-flu');
    const w = take(well);
    const sick = (() => {
      go(ill, 'brief.choose', { brief: B.id, reading: B.readings[0]!.id });
      for (const s of FULL) go(ill, 'brief.prepare', { brief: B.id, step: s });
      rest(ill); ill.advanceTo(T); rest(ill);
      ill.player.health = { ...(ill.player.health ?? {}), fluUntil: T + 48 * MS_HOUR } as never;
      return run<{ overall: number }>(ill, 'practice.self_tape', { genre: B.kinds[0], brief: B.id }).overall;
    })();
    const dims = (sim: Simulation) => (sim.player.work ?? []).at(-1)!.dims;
    console.log('FIGURES day flu', w.overall, sick, JSON.stringify(dims(well)), JSON.stringify(dims(ill)));
    expect(sick).toBeLessThan(w.overall);
    // The flu reaches execution (the voice), not believability.
    expect(dims(ill).execution).toBeLessThan(dims(well).execution!);
    expect(dims(ill).believability).toBe(dims(well).believability);
  });
});

describe('B1, practice: an hour grows the ability it trains and not the others', () => {
  it('Sense Memory and the Repetition Exercise, an hour each at the same instant: each twin grows its own, and everything else alike', () => {
    const a = student('b20c-practice'), b = student('b20c-practice');
    const ea = EXERCISE_BY_ID['sense-memory']!, eb = Object.values(EXERCISE_BY_ID).find((e) => e.trains === 'listening')!;
    for (const sim of [a, b]) { clearDay(sim); tend(sim); sim.advanceTo(T); clearDay(sim); tend(sim); }
    const before = abilitiesOf(a, a.player);
    run(a, 'practice.exercise', { exercise: ea.id });
    run(b, 'practice.exercise', { exercise: eb.id });
    const A = abilitiesOf(a, a.player), Bb = abilitiesOf(b, b.player);
    console.log('FIGURES practice', ea.trains, before.emotionalDepth, A.emotionalDepth, Bb.emotionalDepth, eb.trains, before.listening, A.listening, Bb.listening, 'discipline', before.discipline, A.discipline, Bb.discipline);
    expect(A.emotionalDepth).toBeGreaterThan(Bb.emotionalDepth);
    expect(Bb.listening).toBeGreaterThan(A.listening);
    for (const k of Object.keys(A) as (keyof typeof A)[]) if (k !== 'emotionalDepth' && k !== 'listening') expect([k, A[k]]).toEqual([k, Bb[k]]);
    // The techniques too: Sense Memory's is emotion, held as emotional depth; the craft's others are untouched.
    const ca = { ...a.player.craft! } as Record<string, number>, cb = { ...b.player.craft! } as Record<string, number>;
    delete ca.emotion; delete cb.emotion;
    expect(ca).toEqual(cb);
  });

  it('a brief\'s breakdown practices imagination and its lines memory, and neither the other', () => {
    const a = student('b20c-step'), b = student('b20c-step');
    for (const sim of [a, b]) go(sim, 'brief.choose', { brief: B.id, reading: B.readings[0]!.id });
    const before = abilitiesOf(a, a.player);
    go(a, 'brief.prepare', { brief: B.id, step: 'read' });
    go(b, 'brief.prepare', { brief: B.id, step: 'lines' });
    const A = abilitiesOf(a, a.player), Bb = abilitiesOf(b, b.player);
    console.log('FIGURES brief steps', before.imagination, A.imagination, Bb.imagination, before.memory, A.memory, Bb.memory);
    expect(A.imagination).toBeGreaterThan(before.imagination);
    expect(Bb.imagination).toBe(before.imagination);
    expect(Bb.memory).toBeGreaterThan(before.memory);
    expect(A.memory).toBe(before.memory);
  });
});
