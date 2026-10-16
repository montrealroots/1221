/**
 * Mastery matters, through play (the integration pass of 2026-10-16; the owner's brief, section 4, and the criteria MA1
 * to MA7 written before it, docs/verification/integration-2026-10-16/README.md). Each is held where a player reaches it:
 * an ability raised by the practice command, a brief chosen, prepared and taped by the brief commands, and what the
 * screen's own forecast and the take's record say. MA5 (a played mastery plan at 100 on every payoff tape) and MA6 (no
 * draw off 100 at mastery) are the mastery plans' runs and `tests/engine-properties.test.ts`. Until later on 2026-10-16
 * this said MA8 was `tests/remaining-school-term.test.ts`'s mastered twin, which that file never had; MA8 is below.
 *
 * - **MA1.** Practice on an ability a brief reads raises the brief's forecast, prepared and played the same.
 * - **MA2.** Practice on an ability it doesn't read moves the forecast by nothing of that ability's: put back where it
 *   was, with everything else as the week left it, the forecast is the same to the last digit. (Practice on days running
 *   grows discipline whatever is practised, and a take reads discipline.)
 * - **MA3.** No dimension, segment or whole leaves 0 to 100 on any brief, class scene or play the catalog has, for an
 *   actor at nothing, at full, or drawn between.
 * - **MA4.** An ability that both the task and the material ask of a dimension is counted once, at its summed weight:
 *   the dimension's capacity is the weighted mean worked by hand with the two weights added, and the take's record
 *   names it once there.
 * - **MA7.** A take short of its preparation, taped tired, or played a way the scene doesn't take says so in words.
 * - **MA8.** Mastery doesn't stand in for the work the school asks: a mastered student who sleeps through two pieces due
 *   is Unready on both, and the faculty's review counts exactly those two, where the same student missing nothing is
 *   counted Unready on none.
 *
 * TEST SETUP, said where it's done: a performer's levels set directly where MA3 and MA4 read the judge over the whole
 * catalog, and MA8's student mastered and its pieces prepared, since reaching mastery by play takes years
 * (`tools/mastery.ts`). The played journeys set nothing else but what a player does.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { instantFromZoned, MS_DAY, MS_HOUR, type Instant } from '@/engine/core/time';
import { BRIEFS, BRIEF_BY_ID, type Brief } from '@/engine/content/briefs';
import { EXERCISES, EXERCISE_DESIGN } from '@/engine/content/practice';
import { ABILITY_DEFS, MASTERED } from '@/engine/content/abilities';
import { TASK_PROFILES, type Dimension } from '@/engine/content/tasks';
import { PLAY_MATERIAL, SCENE_MATERIAL } from '@/engine/content/material';
import { PREP_DIMS, templateById } from '@/engine/content/coursework';
import { abilityFull, abilityOf, attributesOf } from '@/engine/systems/attributes';
import { briefContext, briefPiece, preview, recordOf } from '@/engine/systems/briefs';
import { courseworkOf, difficultyOf, questionsFor } from '@/engine/systems/coursework';
import { classPeriod, isClassDay, keyOf } from '@/engine/systems/school';
import type { SchoolDate } from '@/engine/content/school';
import { chiefLimit, performerOf, type Performer } from '@/engine/systems/evaluation';
import { materialContext } from '@/engine/systems/material';
import { judgePiece, loadOf, nightPiece, toneSegments, unitSegments } from '@/engine/systems/piece';
import { runningOf } from '@/engine/systems/workload';
import { PIECE } from '@/engine/content/piece';
import type { Person } from '@/engine/domain/model';

const NY = 'America/New_York';
const at = (day: number, hour: number) => instantFromZoned({ year: 2026, month: 9, day, hour }, NY);
const life = (seed: string): Simulation => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const ABILITIES = ABILITY_DEFS.map((d) => d.id);

/** Practice an exercise on `days` evenings, one hour each, through the command; the clock runs between. */
function practise(sim: Simulation, exercise: string, days: number[]): number {
  let done = 0;
  for (const d of days) {
    sim.advanceTo(at(d, 20));
    if (sim.execute({ kind: 'practice.exercise', payload: { exercise } }).ok) done += 1;
  }
  return done;
}

describe('MA1 and MA2: practice raises what a brief reads, and only that', () => {
  it('PLAYER JOURNEY: a week of Circles Of Attention raises a comic brief’s forecast, and a week of an exercise for an ability it doesn’t read leaves it to the last digit', () => {
    // A comic brief: comedy's exact moment asks focus (`DEMAND_EFFECT.comic`), which the concentration exercise trains.
    const b = BRIEF_BY_ID['brief-comedy']!;
    const reading = b.readings[0]!.id;
    const read = (sim: Simulation) => preview(sim, sim.player, b, reading, {});
    const days = [5, 6, 7, 8, 9, 10, 11];

    const twin = life('ma-1');
    twin.advanceTo(at(4, 20));
    expect(twin.execute({ kind: 'brief.choose', payload: { brief: b.id, reading } }).ok).toBe(true);
    const before = read(twin);
    const focus0 = abilityOf(twin, twin.player, 'focus');
    expect(practise(twin, 'concentration', days)).toBeGreaterThanOrEqual(5);
    expect(abilityOf(twin, twin.player, 'focus')).toBeGreaterThan(focus0);
    expect(read(twin).exact!).toBeGreaterThan(before.exact!);

    // An exercise whose ability, and every ability it carries over to, the brief doesn't read: raised by 10 on a copy
    // of the performer (TEST SETUP, the setup's check), the brief's preview doesn't move; then it's practised for real.
    const other = life('ma-1');
    other.advanceTo(at(4, 20));
    expect(other.execute({ kind: 'brief.choose', payload: { brief: b.id, reading } }).ok).toBe(true);
    const base = read(other);
    const me = performerOf(other, other.player);
    const nobody = { engagement: { byGenre: {} } } as unknown as Person;
    const full = { prep: { interpretation: 1, memorization: 1, rehearsal: 1 }, takes: [] };
    const judged = (p: Performer) => judgePiece(other.universe.meta.seed, p, { ...briefContext(nobody, b, full, { reading, prep: { genre: 1, approach: 1 } }), condition: { readiness: 100 }, key: 'ma2', expected: true }, briefPiece(b, { ...full, reading }, reading)).exact!;
    const at0 = judged(me);
    // The levels before the week, kept: `performerOf` reads the save as it stands, so a later read would be the week's.
    const before0 = Object.fromEntries(ABILITIES.map((a) => [a, me.ability(a)])) as Record<string, number>;
    const unread = EXERCISES.find((e) => ABILITIES.includes(e.trains as never) && [e.trains, ...(EXERCISE_DESIGN[e.id]?.transfer ?? [])].every((a) => Math.abs(judged({ ...me, ability: (id) => me.ability(id) + (id === a ? 10 : 0) }) - at0) < 1e-12));
    expect(unread, 'an exercise for an ability the comic brief doesn’t read').toBeDefined();
    const level0 = abilityOf(other, other.player, unread!.trains as never);
    // Work on the feet is refused once an evening leaves too little energy ("You’re too tired to work on your feet.
    // Sleep first."), a constraint the screen says with its next step; the sessions that go through are enough.
    expect(practise(other, unread!.id, days)).toBeGreaterThanOrEqual(3);
    expect(abilityOf(other, other.player, unread!.trains as never)).toBeGreaterThan(level0);
    // Practice on days running grows discipline too, whatever is practised ("Practice on days running", its
    // `develops`), and a take reads discipline: so the forecast may move, and only by that. With the trained ability
    // (and what it carries over to) put back where it was, and everything else as the week left it, the forecast is
    // the same to the last digit: the ability itself moved nothing.
    void base;
    const now = performerOf(other, other.player);
    const back = new Map([unread!.trains, ...(EXERCISE_DESIGN[unread!.id]?.transfer ?? [])].map((a) => [a, before0[a]!]));
    expect([...back].some(([a, was]) => now.ability(a as never) > was), 'the week raised what it trains').toBe(true);
    expect(judged({ ...now, ability: (id) => back.get(id) ?? now.ability(id) })).toBe(judged(now));
    expect(abilityOf(other, other.player, 'discipline')).toBeGreaterThan(before0.discipline!);
  });
});

describe('MA3: every judged piece stays in bounds', () => {
  it('every brief and reading, every class scene and every play as a night, judged by an actor at nothing, at full, and drawn between, stays within 0 and 100 in every dimension, segment and whole', () => {
    let r = 7;
    const next = () => { r = (r * 16807) % 2147483647; return r / 2147483647; };
    const nobody = { engagement: { byGenre: {} } } as unknown as Person;
    const actors: Performer[] = [
      { ability: () => 0, full: () => 100, technique: () => 0 },
      { ability: () => 100, full: () => 100, technique: () => MASTERED },
      ...Array.from({ length: 3 }, () => { const ab = Object.fromEntries(ABILITIES.map((a) => [a, next() * 100])); const t = next() * 100; return { ability: (id: string) => ab[id]!, full: () => 100, technique: () => t } as Performer; }),
    ];
    const within = (x: number, what: string) => { expect(x, what).toBeGreaterThanOrEqual(0); expect(x, what).toBeLessThanOrEqual(100); };
    let n = 0;
    for (const p of actors) {
      for (const b of BRIEFS as readonly Brief[]) for (const rd of b.readings) {
        const prep = next();
        const rec = { prep: { interpretation: prep, memorization: prep, rehearsal: prep }, takes: [] };
        const e = judgePiece('ma3', p, { ...briefContext(nobody, b, rec, { reading: rd.id, prep: { genre: next() } }), condition: { readiness: 20 + next() * 80 }, key: `ma3:${b.id}:${rd.id}` }, briefPiece(b, { ...rec, reading: rd.id }, rd.id));
        within(e.overall, b.id); e.dimensions.forEach((d) => within(d.quality, `${b.id} ${d.dimension}`)); e.piece?.segments.forEach((s) => within(s.overall, `${b.id} ${s.label}`));
        n += 1;
      }
      for (const [m, task] of [...SCENE_MATERIAL.map((m) => [m, 'scene'] as const), ...PLAY_MATERIAL.map((m) => [m, 'performance'] as const)]) {
        const t = TASK_PROFILES[task]!;
        const read = materialContext(t, m);
        const parts = [...new Set(Object.values(t.dims).flatMap((d) => d!.prep ?? []))];
        const prep = next();
        const e = judgePiece('ma3', p, { task: t, techniques: { scene: 1, ...(m.techniques ?? {}) }, prep: Object.fromEntries(parts.map((k) => [k, prep])), required: Object.fromEntries(parts.map((k) => [k, 0.9])), difficulty: task === 'scene' ? difficultyOf(templateById('scene-study')!) : 0.1, condition: { readiness: 20 + next() * 80 }, lean: read.lean, inputs: read.inputs, key: `ma3:${m.id}` }, task === 'scene' ? { segments: unitSegments(m, 2), work: [], part: 'rehearsal', perTurn: PIECE.scene.perTurn, perBlend: 0, most: PIECE.scene.most, load: loadOf(m, 'scene') } : nightPiece(m, runningOf({ play: m.id }), 'lead'));
        within(e.overall, m.id); e.dimensions.forEach((d) => within(d.quality, `${m.id} ${d.dimension}`)); e.piece?.segments.forEach((s) => within(s.overall, `${m.id} ${s.label}`));
        n += 1;
      }
    }
    expect(n).toBeGreaterThan(2000);
  });
});

describe('MA4: an ability asked twice of one dimension is counted once', () => {
  it('a grave scene’s believability reads emotional depth from the task and from the material at their summed weight, worked by hand, and names it once', () => {
    const m = SCENE_MATERIAL.find((x) => x.tones.every((t) => t === 'grave'))!;
    const task = TASK_PROFILES.scene!;
    const read = materialContext(task, m);
    const ab: Record<string, number> = Object.fromEntries(ABILITIES.map((a) => [a, 50]));
    ab.emotionalDepth = 80;
    const p: Performer = { ability: (id) => ab[id]!, full: () => 100, technique: () => 45 };
    const e = judgePiece('ma4', p, { task, techniques: { scene: 1 }, prep: {}, required: {}, difficulty: 0, condition: { readiness: 100 }, lean: read.lean, inputs: read.inputs, key: 'ma4', expected: true }, { segments: toneSegments(m.tones, 1).slice(0, 1).map((s) => ({ ...s, weight: 1 })), work: [], part: 'rehearsal', perTurn: 0, perBlend: 0, most: 1, load: 0 });
    const d: Dimension = 'believability';
    // By hand: the task's terms and the material's, an ability's weights added; a technique at 45 of 90.
    const weights = new Map<string, number>();
    for (const x of task.dims[d]!.inputs) if ('ability' in x) weights.set(x.ability, (weights.get(x.ability) ?? 0) + x.weight);
    for (const x of read.inputs[d] ?? []) weights.set(x.ability, (weights.get(x.ability) ?? 0) + x.weight);
    const tech = task.dims[d]!.inputs.filter((x) => !('ability' in x)).reduce((s, x) => s + x.weight, 0);
    expect((read.inputs[d] ?? []).some((x) => x.ability === 'emotionalDepth')).toBe(true);
    const total = [...weights.values()].reduce((s, w) => s + w, 0) + tech;
    const cap = ([...weights].reduce((s, [a, w]) => s + w * (ab[a]! / 100), 0) + tech * (45 / MASTERED)) / total;
    const dim = e.dimensions.find((x) => x.dimension === d)!;
    expect(dim.capacity).toBeCloseTo(cap, 12);
    expect(dim.limits.filter((l) => l.what === 'emotionalDepth')).toHaveLength(1);
  });
});

describe('MA7: a shortfall says what it was', () => {
  it('PLAYER JOURNEY: a brief taped with its lines barely begun names the lines, and the record keeps why', () => {
    const sim = life('ma-7');
    const b = BRIEF_BY_ID['brief-drama']!;
    sim.advanceTo(at(5, 19));
    expect(sim.execute({ kind: 'brief.choose', payload: { brief: b.id, reading: b.readings[0]!.id } }).ok).toBe(true);
    // The breakdown done twice, the lines not at all: taped like that.
    for (let i = 0; i < 2; i += 1) expect(sim.execute({ kind: 'brief.prepare', payload: { brief: b.id, step: 'read' } }).ok).toBe(true);
    const r = sim.execute<{ overall: number }>({ kind: 'practice.self_tape', payload: { genre: b.kinds[0], brief: b.id } });
    expect(r.ok, r.error).toBe(true);
    const take = recordOf(sim.player, b.id).takes.at(-1)!;
    const record = sim.player.work!.at(-1)!;
    const lines = record.limits.find((l) => l.kind === 'preparation' && l.what === 'memorization');
    expect(lines, 'the lines among what held the take back').toBeDefined();
    expect(record.limits.some((l) => l.kind === 'preparation')).toBe(true);
    const said = chiefLimit(record) ?? '';
    expect(take.chief ?? said).toMatch(/wasn’t complete|held back|cost/);
    expect(said).not.toBe('');
  });

  it('a day too tired and a way the scene doesn’t take are each named, in the take’s own words', () => {
    const b = BRIEF_BY_ID['brief-drama']!;
    const nobody = { engagement: { byGenre: {} } } as unknown as Person;
    const rec = { prep: { interpretation: 1, memorization: 1, rehearsal: 1 }, takes: [] };
    const even: Performer = { ability: () => 55, full: () => 100, technique: () => 55 };
    const tired = judgePiece('ma7', even, { ...briefContext(nobody, b, rec, { reading: b.readings[0]!.id, prep: { genre: 1 } }), condition: { readiness: 30 }, key: 'ma7', expected: true }, briefPiece(b, { ...rec, reading: b.readings[0]!.id }));
    expect(tired.limits.some((l) => l.kind === 'condition' && /Readiness At 30/.test(l.label))).toBe(true);
    // A way some brief doesn't take, found across the catalog: there must be one, or this would hold of nothing.
    const sideSets = Object.entries({ pace: ['measured', 'driven'], scale: ['restrained', 'expansive'], structure: ['set', 'open'] }).flatMap(([axis, sides]) => sides.map((s) => ({ [axis]: s })));
    const found = (BRIEFS as readonly Brief[]).flatMap((x) => sideSets.map((sides) => ({ x, sides }))).find(({ x, sides }) => Object.keys(briefContext(nobody, x, rec, { reading: x.readings[0]!.id, playing: { ...sides, chosenAt: 0, prep: 1 }, prep: { genre: 1, approach: 1 } }).fit ?? {}).length > 0);
    expect(found, 'a brief with a way it doesn’t take').toBeDefined();
    const ctx = briefContext(nobody, found!.x, rec, { reading: found!.x.readings[0]!.id, playing: { ...found!.sides, chosenAt: 0, prep: 1 }, prep: { genre: 1, approach: 1 } });
    const e = judgePiece('ma7', even, { ...ctx, condition: { readiness: 100 }, key: 'ma7', expected: true }, briefPiece(found!.x, { ...rec, reading: found!.x.readings[0]!.id }));
    expect(e.limits.some((l) => l.kind === 'fit')).toBe(true);
    expect(chiefLimit({ limits: e.limits.filter((l) => l.kind === 'fit') })).toMatch(/didn’t fit/);
    expect(chiefLimit(tired)).toMatch(/points/);
  });
});

describe('MA8: mastery doesn’t stand in for the work the school asks', () => {
  /** TEST SETUP: every ability full, every craft skill at 100, the body at its age's ceiling (as tests/mastery-integration.test.ts). */
  const mastered = (sim: Simulation) => {
    const p = sim.player;
    for (const k of Object.keys(p.craft!)) (p.craft as Record<string, number>)[k] = 100;
    const a = attributesOf(sim, p) as unknown as Record<string, number>;
    for (const k of Object.keys(a)) a[k] = 100;
    p.wellbeing.fitness = abilityFull(sim, p, 'stamina');
  };
  const NYAt = (d: SchoolDate, hour: number): Instant => instantFromZoned({ ...d, hour }, NY);
  const plus = (d: SchoolDate, n: number): SchoolDate => { const t = new Date(Date.UTC(d.year, d.month - 1, d.day + n)); return { year: t.getUTCFullYear(), month: t.getUTCMonth() + 1, day: t.getUTCDate() }; };
  const DAYS: SchoolDate[] = [];
  for (let d = classPeriod(0).from; keyOf(d) <= keyOf(classPeriod(0).to); d = plus(d, 1)) if (isClassDay(0, d)) DAYS.push(d);
  /** TEST SETUP: rested, fed and awake each time the clock moves, six hours at a time (as tests/remaining-school-term.test.ts). */
  const tend = (sim: Simulation, until: Instant) => {
    while (sim.now < until) {
      Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
      sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
      sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
    }
  };
  /**
   * A first fall, every open piece's parts complete each midnight, and each scene's table work answered at six, after class, with
   * what its text supports (`school.choose`, the command the table's selects issue: a first run without it left the
   * scene's choices at a third of themselves, Working at mastery, as a scene with its choices unmade should be); asleep
   * through the nine o’clock class (`life.sleep`, the player's command) on the first `misses` days with one piece due and
   * nothing to show again.
   */
  function term(misses: number) {
    const sim = life('ma-8');
    mastered(sim);
    sim.onEvent('world.day_rollover', 'test.doTheWork', (_e, { sim: s }) => {
      for (const a of courseworkOf(s, s.player)?.assignments ?? []) if (a.status === 'open' || a.status === 'revising') for (const d of PREP_DIMS) a.prep[d] = 1;
    });
    const slept: string[] = [];
    for (const d of DAYS) {
      tend(sim, NYAt(d, 1));
      const pieces = courseworkOf(sim, sim.player)!.assignments.filter((a) => a.term === 0);
      const due = pieces.filter((a) => a.status === 'open' && a.dueOn === keyOf(d));
      const again = pieces.filter((a) => a.status === 'revising' && a.revision?.dueOn === keyOf(d));
      if (slept.length < misses && due.length === 1 && again.length === 0) {
        sim.must({ kind: 'life.sleep', payload: { hours: 10 } });
        slept.push(due[0]!.id);
      }
      tend(sim, NYAt(d, 18));
      // The table work at six, after the day's classes: answered at one in the morning, the clock it takes kept her up near two, and
      // the night the game gives her ran past nine on four days, four classes slept through that the test never chose.
      for (const a of courseworkOf(sim, sim.player)!.assignments.filter((x) => x.term === 0 && (x.status === 'open' || x.status === 'revising'))) {
        // TEST SETUP: a piece set in today's class prepared now, as at midnight, so its text is known to the table.
        for (const k of PREP_DIMS) a.prep[k] = 1;
        for (const { q, options } of questionsFor(a)) if (!options.find((o) => o.id === a.answers[q.id])?.supported) sim.must({ kind: 'school.choose', payload: { assignmentId: a.id, question: q.id, option: options.find((o) => o.supported)!.id } });
      }
    }
    tend(sim, instantFromZoned({ year: 2026, month: 12, day: 14, hour: 12 }, NY));
    const pieces = courseworkOf(sim, sim.player)!.assignments.filter((a) => a.term === 0);
    return { sim, slept, pieces, review: sim.player.school!.history.find((r) => r.term === 0)! };
  }

  it('PLAYER JOURNEY: a mastered student asleep through two pieces is Unready on both and the review counts exactly those two; the same student missing nothing is counted Unready on none', () => {
    const missing = term(2);
    expect(missing.slept).toHaveLength(2);
    for (const id of missing.slept) {
      const a = missing.pieces.find((x) => x.id === id)!;
      expect(a.status, a.id).toBe('missed');
      expect(a.shown, a.id).toBeUndefined();
    }
    // Every piece shown came out at mastery's top bands: the misses are what the review can find wanting.
    const shown = missing.pieces.filter((a) => a.shown);
    expect(shown.length).toBeGreaterThan(2);
    for (const a of shown) expect(['strong', 'exceptional'], a.id).toContain(a.revision?.band ?? a.shown!.band);
    // Counted from the pieces by hand: every piece shown or missed is due; the two missed are the Unready.
    const due = missing.pieces.filter((a) => a.shown || a.status === 'missed').length;
    expect(missing.review.coursework).toEqual({ shown: due, unready: 2, strong: shown.length });

    // Change the input, the two mornings slept through: the same mastered student is Unready on nothing.
    const straight = term(0);
    expect(straight.slept).toHaveLength(0);
    expect(straight.pieces.filter((a) => a.status === 'missed')).toHaveLength(0);
    expect(straight.review.coursework!.unready).toBe(0);
    expect(straight.review.coursework!.shown).toBe(straight.pieces.filter((a) => a.shown).length);
  }, 600_000);
});

void MS_DAY;
