/**
 * Mastery matters, through play (the integration pass of 2026-10-16; the owner's brief, section 4, and the criteria MA1
 * to MA7 written before it, docs/verification/integration-2026-10-16/README.md). Each is held where a player reaches it:
 * an ability raised by the practice command, a brief chosen, prepared and taped by the brief commands, and what the
 * screen's own forecast and the take's record say. MA5 (a played mastery plan at 100 on every payoff tape) and MA6 (no
 * draw off 100 at mastery) are the mastery plans' runs and `tests/engine-properties.test.ts`; MA8 (mastery doesn't stand
 * in for the work the school asks) is `tests/remaining-school-term.test.ts`'s mastered twin.
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
 *
 * TEST SETUP, said where it's done: a performer's levels set directly where MA3 and MA4 read the judge over the whole
 * catalog. The played journeys set nothing but what a player does.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { instantFromZoned, MS_DAY } from '@/engine/core/time';
import { BRIEFS, BRIEF_BY_ID, type Brief } from '@/engine/content/briefs';
import { EXERCISES, EXERCISE_DESIGN } from '@/engine/content/practice';
import { ABILITY_DEFS, MASTERED } from '@/engine/content/abilities';
import { TASK_PROFILES, type Dimension } from '@/engine/content/tasks';
import { PLAY_MATERIAL, SCENE_MATERIAL } from '@/engine/content/material';
import { templateById } from '@/engine/content/coursework';
import { abilityOf } from '@/engine/systems/attributes';
import { briefContext, briefPiece, preview, recordOf } from '@/engine/systems/briefs';
import { difficultyOf } from '@/engine/systems/coursework';
import { chiefLimit, performerOf, type Performer } from '@/engine/systems/evaluation';
import { materialContext } from '@/engine/systems/material';
import { judgePiece, loadOf, toneSegments } from '@/engine/systems/piece';
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
        const e = judgePiece('ma3', p, { task: t, techniques: { scene: 1, ...(m.techniques ?? {}) }, prep: Object.fromEntries(parts.map((k) => [k, prep])), required: Object.fromEntries(parts.map((k) => [k, 0.9])), difficulty: task === 'scene' ? difficultyOf(templateById('scene-study')!) : 0.1, condition: { readiness: 20 + next() * 80 }, lean: read.lean, inputs: read.inputs, key: `ma3:${m.id}` }, { segments: toneSegments(m.tones, 2), work: [], part: task === 'scene' ? 'rehearsal' : 'blocking', perTurn: task === 'scene' ? PIECE.scene.perTurn : 0, perBlend: 0, most: task === 'scene' ? PIECE.scene.most : 1, load: loadOf(m, task === 'scene' ? 'scene' : 'night') });
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

void MS_DAY;
