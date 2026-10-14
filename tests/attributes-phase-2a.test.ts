/**
 * Phase 2a of the owner's brief "Perfect The Attributes, Genres, And Their Integration Through Demonstrable Gameplay"
 * (2026-10-16; docs/verification/attributes-genres-2026-10-16/phase-2a.md). Each block holds one step, and each failed
 * on the code before the step:
 * 1. Text and truth: the abilities whose descriptions said they sped a step speed it (`stepSpeed`); an hour's gain is said
 *    before it, from the formula the hour uses (`practicePreview`); a technique past mastery is said to move no result;
 *    a course's note on a skill names what the judged result's limits say held it (`skillHeld`).
 * 2. The partner gate: a mastered, prepared, rested player whose partner never comes reaches 100 on their own scene by a
 *    route they control (`READER`), and the scene together still reads the absent partner.
 * 3. One growth path: a class, a night, a lab, coursework's training and a house's nerves grow through `grown`, so the
 *    same growth again the same day keeps half, and discipline lifts it, everywhere.
 * 4. One stamina rule: a scene of one tone is judged in segments as a scene of two is, and the body's and the voice's
 *    material asks stamina only through the drain.
 * TEST SETUP throughout: levels and parts written directly where a block says so, as tests/ensemble.test.ts does, and the
 * clock's own commitments cleared where a step is taken through its command, as tests/defects-g28-1.test.ts does.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY } from '@/engine/core/time';
import { PREP_DIMS } from '@/engine/content/coursework';
import { MASTERED, STEP_SPEED } from '@/engine/content/abilities';
import { EXERCISE_BY_ID } from '@/engine/content/practice';
import { FEATURE_EFFECT } from '@/engine/content/approaches';
import { BRIEF_BY_ID } from '@/engine/content/briefs';
import { abilityFull, attributesOf, developmentOf, nerves, stepSpeed } from '@/engine/systems/attributes';
import { READER, askRefusal, courseworkOf, judgeWork, mateRecord, noteCandidates, partnerPart, partnerPrepOf, preparedParts, questionsFor, scenePiece, skillHeld, togetherOf, type Assignment } from '@/engine/systems/coursework';
import { practiceHour, practicePreview } from '@/engine/systems/practice';
import { prepareBrief } from '@/engine/systems/briefs';
import { grewFrom, nightWeights } from '@/engine/systems/school';
import type { Evaluation } from '@/engine/systems/evaluation';

const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });

/** TEST SETUP: every ability full and every craft skill at 100, the body at its age's ceiling. */
function mastered(sim: Simulation): void {
  const p = sim.player;
  for (const k of Object.keys(p.craft!)) (p.craft as Record<string, number>)[k] = 100;
  const a = attributesOf(sim, p) as unknown as Record<string, number>;
  for (const k of Object.keys(a)) a[k] = 100;
  p.wellbeing.fitness = abilityFull(sim, p, 'stamina');
}

/** TEST SETUP: a scene-study assignment on a scene, its parts as given, the table work answered as the text supports. */
function scene(sim: Simulation, sceneId: string, prep: Partial<Record<string, number>>): Assignment {
  const a: Assignment = {
    id: `p2a-${sceneId}-${courseworkOf(sim, sim.player)!.assignments.length}`, course: 'DRAM 103a/b', template: 'scene-study', term: 1, setOn: '2026-09-07', dueOn: '2026-12-01', sceneId, role: 0, partner: 0,
    prep: { ...Object.fromEntries(PREP_DIMS.map((d) => [d, 0])), ...prep } as Assignment['prep'], answers: {}, steps: {}, practicedOn: {}, trained: 0, rehearsals: [], status: 'open',
  };
  for (const { q, options } of questionsFor(a)) a.answers[q.id] = options.find((o) => o.supported)!.id as never;
  courseworkOf(sim, sim.player)!.assignments.push(a);
  mateRecord(sim.player.school!.classmates[0]!).met = sim.now;
  return a;
}

const clearDay = (sim: Simulation) => { for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now); };
const rested = (sim: Simulation) => { const w = sim.player.wellbeing; w.energy = 100; w.stress = 0; w.morale = 80; w.nourishment = 90; w.hygiene = 100; w.sleepDebt = 0; };
const step = (sim: Simulation, a: Assignment, activity: string) => sim.execute<{ moved: number }>({ kind: 'school.prepare', payload: { assignmentId: a.id, activity } });

// ---------------------------------------------------------------------------------------------------------------
// 1. Text and truth
// ---------------------------------------------------------------------------------------------------------------

describe('an ability speeds the step it is practice in, as its description says', () => {
  it('is 85% at 0, as before at 50, 115% at full', () => {
    const sim = life('p2a-speed');
    const a = attributesOf(sim, sim.player);
    a.focus = 0; expect(stepSpeed(sim, sim.player, 'focus')).toBeCloseTo(STEP_SPEED.least, 12);
    a.focus = 50; expect(stepSpeed(sim, sim.player, 'focus')).toBeCloseTo(1, 12);
    a.focus = 100; expect(stepSpeed(sim, sim.player, 'focus')).toBeCloseTo(STEP_SPEED.most, 12);
  });

  it('learns a scene’s lines further with more memory, by the ratio of the two speeds, and nothing else changed', () => {
    const moved = (memory: number) => {
      const sim = life('p2a-lines');
      clearDay(sim); rested(sim);
      sim.player.craft!.memorization = memory;
      const a = scene(sim, 'seagull-4', { familiarity: 0.6 });
      const r = step(sim, a, 'learn');
      expect(r.ok, r.error).toBe(true);
      return r.value!.moved;
    };
    const low = moved(25), high = moved(75);
    expect(high / low).toBeCloseTo((STEP_SPEED.least + (STEP_SPEED.most - STEP_SPEED.least) * 0.75) / (STEP_SPEED.least + (STEP_SPEED.most - STEP_SPEED.least) * 0.25), 6);
  });

  it('breaks a brief down further with more imagination, and learns its lines further with more memory', () => {
    const b = Object.values(BRIEF_BY_ID)[0]!;
    const moved = (imagination: number, memory: number, which: 'read' | 'lines') => {
      const sim = life('p2a-brief');
      const at = attributesOf(sim, sim.player);
      at.imagination = imagination; sim.player.craft!.memorization = memory;
      return prepareBrief(sim, sim.player, b, which).moved;
    };
    expect(moved(90, 50, 'read')).toBeGreaterThan(moved(10, 50, 'read'));
    expect(moved(50, 90, 'lines')).toBeGreaterThan(moved(50, 10, 'lines'));
    // The other ability moves nothing: imagination doesn't learn lines.
    expect(moved(90, 50, 'lines')).toBe(moved(10, 50, 'lines'));
  });
});

describe('an hour of practice, said before it', () => {
  it('says exactly what the hour then gives, a repeat and discipline’s lift included', () => {
    const sim = life('p2a-preview');
    clearDay(sim); rested(sim);
    attributesOf(sim, sim.player).discipline = 80;
    const e = EXERCISE_BY_ID['given-circumstances']!;
    for (const focus of ['steady', 'variation'] as const) {
      const before = practicePreview(sim, sim.player, e, undefined, focus);
      const hour = practiceHour(sim, sim.player, e, undefined, focus);
      expect(hour.gained).toBeCloseTo(before.gain, 12);
      expect(hour.discipline).toBeCloseTo(before.discipline, 12);
      expect(hour.carried.map((c) => c.gained)).toEqual(before.carried.map((c) => c.gain).map((g) => expect.closeTo(g, 12)));
    }
    // The second hour on it today was a repeat, said so, at half.
    const again = practicePreview(sim, sim.player, e);
    expect(again.terms.repeat).toBe(0.25);
    expect(again.words).toMatch(/hour 3 on it today keeps 25%/);
    expect(practiceHour(sim, sim.player, e).gained).toBeCloseTo(again.gain, 12);
  });

  it('says a technique past mastery moves no result, before the hour and after it', () => {
    const sim = life('p2a-past');
    clearDay(sim); rested(sim);
    const e = Object.values(EXERCISE_BY_ID).find((x) => x.trains === 'screen')!;
    sim.player.craft!.screen = MASTERED - 5;
    expect(practicePreview(sim, sim.player, e).words).not.toMatch(/Past 90/);
    sim.player.craft!.screen = MASTERED + 5;
    expect(practicePreview(sim, sim.player, e).words).toMatch(/Past 90, no piece of work asks more of a technique/);
    expect(practiceHour(sim, sim.player, e).feedback).toMatch(/Past 90, no piece of work asks more of a technique/);
  });
});

describe('a course’s note on a skill', () => {
  it('names the skill the judged result’s limits say held it, not the weakest the template reads, where the craft is behind the year', () => {
    const sim = life('p2a-note');
    const a = scene(sim, 'seagull-4', { familiarity: 1, memorization: 1, interpretation: 1, rehearsal: 1, partner: 1 });
    // The weakest of the skills scene study reads is the scene; the limits say the voice held it (TEST SETUP).
    sim.player.craft!.scene = 10; sim.player.craft!.voice = 60;
    const judged = { limits: [
      { kind: 'ability', what: 'vocal', label: 'Vocal Expression', dimension: 'execution', by: 9, whole: 5 },
      { kind: 'technique', what: 'scene', label: 'Scene Study', dimension: 'believability', by: 2, whole: 1 },
      { kind: 'ability', what: 'listening', label: 'Listening', dimension: 'connection', by: 20, whole: 9 },
    ] } as unknown as Pick<Evaluation, 'limits'>;
    expect(skillHeld(judged)).toEqual({ skill: 'voice', whole: 5 });
    // The craft behind the year (a craft score of 0.3 against the par's 0.45), so a note on it is given: on the voice.
    const notes = noteCandidates(sim.player, a, { familiarity: 1 }, 0.3, [], judged);
    expect(notes[0]!.focus).toEqual({ kind: 'skill', skill: 'voice' });
    // The craft where the year asks, no note on it, whatever the limits (the step beyond is the course's, as before).
    expect(noteCandidates(sim.player, a, { familiarity: 1 }, 0.6, [], judged).some((c) => c.focus.kind === 'skill')).toBe(false);
    // And with no result to read, none.
    expect(noteCandidates(sim.player, a, { familiarity: 1 }, 0.3, []).some((c) => c.focus.kind === 'skill')).toBe(false);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// 2. The partner gate
// ---------------------------------------------------------------------------------------------------------------

describe('a mastered player whose partner never comes', () => {
  it('reaches 100 on their own scene with a reader, through the command, and the scene together still reads the partner', () => {
    const sim = life('p2a-reader');
    mastered(sim);
    const a = scene(sim, 'seagull-4', { familiarity: 1, memorization: 1, interpretation: 1, rehearsal: 1, partner: 0 });
    // The partner won't work with you (TEST SETUP: trust under wary): no rehearsal with them can be had.
    const mate = sim.player.school!.classmates[0]!;
    (mate as typeof mate & { trust?: number }).trust = 0;
    expect(askRefusal(sim, sim.player, a, sim.now + 2 * MS_DAY).declines).toBeDefined();
    const day = '2026-09-21';
    rested(sim);
    const without = judgeWork(sim, sim.player, a, day, sim.now, 'p2a:without');
    expect(without.overall).toBeLessThan(80);
    const partnerBefore = partnerPrepOf(sim.player, a, day);
    // An evening with a reader a day, until it's done (the qualifying condition: the partner part complete, by any route).
    let evenings = 0;
    while (partnerPart(a) < 0.9 && evenings < 12) {
      clearDay(sim); rested(sim);
      const r = step(sim, a, READER.id);
      expect(r.ok, r.error).toBe(true);
      // Once a day, as the step says.
      expect(step(sim, a, READER.id).error).toMatch(/Done today already/);
      evenings += 1;
      sim.advanceTo(sim.now + MS_DAY);
    }
    // Seven at a day's focus of 1; a rested evening goes a little further (`focusOf`, at most 1.1).
    expect(evenings).toBeLessThanOrEqual(7);
    expect(a.prep.partner).toBe(0);
    expect(preparedParts(sim.player, a, day).partner).toBeCloseTo(partnerPart(a), 12);
    mastered(sim); rested(sim);
    const own = judgeWork(sim, sim.player, a, day, sim.now, 'p2a:with-reader');
    expect(own.overall).toBe(100);
    expect(own.mastery).toBe(true);
    // The partner came to nothing: the scene together reads them as they are, and a reader brings them up not at all.
    expect(partnerPrepOf(sim.player, a, day)).toBe(partnerBefore);
    const absent = togetherOf(sim, sim.player, a, day, own)!;
    const came = scene(sim, 'seagull-4', { familiarity: 1, memorization: 1, interpretation: 1, rehearsal: 1, partner: 1 });
    const present = togetherOf(sim, sim.player, came, day, judgeWork(sim, sim.player, came, day, sim.now, 'p2a:came'))!;
    expect(absent.overall).toBeLessThan(present.overall - 5);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// 3. One growth path
// ---------------------------------------------------------------------------------------------------------------

const gains = (sim: Simulation, source: string, id: string) => developmentOf(sim.player).history.filter((h) => h.source === source && h.id === id).map((h) => h.delta);

describe('growth from the work, through one path', () => {
  it('keeps half for the same class again the same day, and gives it in full the next', () => {
    const sim = life('p2a-class');
    sim.player.craft!.scene = 40;
    const once = () => { const before = sim.player.craft!.scene; grewFrom(sim, sim.player, 'class:TEST', 1, [['scene', 1]]); return sim.player.craft!.scene - before; };
    const first = once(), second = once();
    // The second reads the level the first left, so a hair under half.
    expect(second / first).toBeGreaterThan(0.45);
    expect(second / first).toBeLessThan(0.5);
    expect(gains(sim, 'class:TEST', 'scene')).toHaveLength(2);
    sim.advanceTo(sim.now + MS_DAY);
    expect(once() / first).toBeGreaterThan(0.9);
  });

  it('grows a skill a night asks twice once, by both weights, not again at a repeat’s half', () => {
    const sim = life('p2a-night');
    grewFrom(sim, sim.player, 'night:TEST', 1, nightWeights({ scene: 1, classical: 1 }));
    expect(gains(sim, 'night:TEST', 'scene')).toHaveLength(1);
  });

  it('lifts every growth by discipline, a tenth either side at the ends', () => {
    const grown = (discipline: number) => {
      const sim = life('p2a-lift');
      sim.player.craft!.scene = 40;
      attributesOf(sim, sim.player).discipline = discipline;
      grewFrom(sim, sim.player, 'class:TEST', 1, [['scene', 1]]);
      return sim.player.craft!.scene - 40;
    };
    expect(grown(100) / grown(0)).toBeCloseTo(1.1 / 0.9, 9);
  });

  it('keeps half of a house’s composure for a second house the same day', () => {
    const sim = life('p2a-nerves');
    const at = attributesOf(sim, sim.player);
    at.composure = 40;
    const once = () => { const before = at.composure; nerves(sim, sim.player, 'performance'); return at.composure - before; };
    const first = once(), second = once();
    expect(second / first).toBeGreaterThan(0.49);
    expect(second / first).toBeLessThan(0.5);
    expect(gains(sim, 'nerves:performance', 'composure')).toHaveLength(2);
  });
});

// ---------------------------------------------------------------------------------------------------------------
// 4. One stamina rule
// ---------------------------------------------------------------------------------------------------------------

describe('a scene’s stamina, read one way', () => {
  it('judges a scene of one tone in segments, its two halves, as a scene of three is judged in its tones', () => {
    const sim = life('p2a-tones');
    const one = scene(sim, 'dollhouse-3', { familiarity: 1, memorization: 1, interpretation: 1, rehearsal: 1, partner: 1 });
    const three = scene(sim, 'seagull-4', { familiarity: 1, memorization: 1, interpretation: 1, rehearsal: 1, partner: 1 });
    expect(scenePiece(one)!.segments).toHaveLength(2);
    expect(scenePiece(three)!.segments).toHaveLength(3);
    sim.player.wellbeing.fitness = 20;
    rested(sim);
    for (const a of [one, three]) {
      const e = judgeWork(sim, sim.player, a, '2026-09-21', sim.now, `p2a:${a.id}`);
      expect(e.piece, a.sceneId).toBeDefined();
      // Stamina is the drain on the later segments, and no dimension's input.
      expect(e.piece!.segments.at(-1)!.drain, a.sceneId).toBeLessThan(1);
      expect(e.piece!.segments[0]!.drain, a.sceneId).toBe(1);
      expect(e.limits.some((l) => l.kind === 'ability' && l.what === 'stamina'), a.sceneId).toBe(false);
    }
  });

  it('asks stamina of no dimension for the body’s or the voice’s material: the drain’s load reads them', () => {
    for (const f of ['physical', 'vocal'] as const) expect(Object.values(FEATURE_EFFECT[f].inputs).flat().some((x) => x!.ability === 'stamina'), f).toBe(false);
  });
});
