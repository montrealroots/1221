/**
 * Working a problem through, in rehearsal (from 2026-10-12; `systems/workbook.ts`, `systems/workpieces.ts`).
 *
 * Played through the commands on a practice brief (TEST SETUP: the clock's own commitments cleared and the day kept
 * rested, as tests/briefs.test.ts does, so the work is what's measured):
 * - a problem found in the forecast is named; an adjustment it admits is tried, its time spent, and its evidence kept
 *   (the problem's own figure before and after); work done is kept, and a problem solved leaves by itself;
 * - a change of how a segment is played waits to be kept or put back; put back, it's restored and not offered for that
 *   problem again; kept, every later forecast and take reads it;
 * - places to breathe lighten the piece's load on stamina;
 * - refusals, each with its reason; the same work the same way gives the same evidence; the workbook survives a save;
 * - at mastery, with a segment played its own way and rehearsed in, a take is still exactly 100.
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { BRIEFS, BRIEF_BY_ID } from '@/engine/content/briefs';
import { MASTERED } from '@/engine/content/abilities';
import { WORKBOOK } from '@/engine/content/workbook';
import { briefPiece, forecast, recordOf } from '@/engine/systems/briefs';
import { optionsOf, problemsOf, type Try } from '@/engine/systems/workbook';
import { workPiece } from '@/engine/systems/workpieces';
import { evenCraft } from '@/engine/systems/school';
import { abilityFull } from '@/engine/systems/attributes';

function student(seed: string): Simulation {
  const sim = createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
  return sim;
}
const rest = (sim: Simulation) => {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
  Object.assign(sim.player.wellbeing, { energy: 95, stress: 15, sleepDebt: 0, nourishment: 80, hygiene: 80, morale: 60 });
};
const go = <T = Record<string, unknown>>(sim: Simulation, kind: string, payload: Record<string, unknown>) => { rest(sim); return sim.execute<T>({ kind, payload }); };

/** A brief with a turn in it, its lines learned and a first rehearsal: the turn isn't secure yet. */
const TURNING = BRIEFS.find((b) => b.beats.length >= 3 && b.beats.slice(1).some((x, i) => x.tones.join() !== b.beats[i]!.tones.join()))!;
function begun(seed: string) {
  const sim = student(seed);
  go(sim, 'brief.choose', { brief: TURNING.id, reading: TURNING.readings[0]!.id });
  for (const step of ['read', 'lines', 'lines', 'rehearse']) go(sim, 'brief.prepare', { brief: TURNING.id, step });
  return sim;
}
const key = `brief:${TURNING.id}`;

describe('the loop, on a brief', () => {
  it('names a problem, tries an adjustment it admits, and keeps the evidence', () => {
    const sim = begun('workbook-loop');
    const piece = workPiece(sim, sim.player, key)!;
    const problems = problemsOf(piece);
    expect(problems.length).toBeGreaterThan(0);
    const turn = problems.find((p) => p.kind === 'turn' || p.kind === 'segment')!;
    expect(turn).toBeDefined();
    expect(go(sim, 'work.try', { piece: key, adjustment: 'work-beat' }).error).toMatch(/Name the problem/);
    expect(go(sim, 'work.identify', { piece: key, problem: turn.id }).ok).toBe(true);
    const options = optionsOf(workPiece(sim, sim.player, key)!, recordOf(sim.player, TURNING.id).book!.problem!);
    expect(options.map((o) => o.adjustment)).toContain('work-beat');
    const at = sim.now;
    const tried = go<Try>(sim, 'work.try', { piece: key, adjustment: 'work-beat' });
    expect(tried.ok).toBe(true);
    expect(sim.now - at).toBeGreaterThanOrEqual(30 * 60_000);
    expect(tried.value!.after).toBeGreaterThan(tried.value!.before);
    expect(tried.value!.verdict).toBe('kept');
    expect(recordOf(sim.player, TURNING.id).work![turn.segment!]!).toBeGreaterThan(0);
    // The take reads it: the forecast's segment is the evidence's after.
    expect(forecast(sim, sim.player, TURNING).piece!.segments[turn.segment!]!.overall).toBe(tried.value!.after);
  });

  it('closes a problem once the work has solved it', () => {
    const sim = begun('workbook-solve');
    const piece = workPiece(sim, sim.player, key)!;
    const p = problemsOf(piece).find((x) => x.kind === 'turn' || x.kind === 'segment')!;
    go(sim, 'work.identify', { piece: key, problem: p.id });
    for (let i = 0; i < 8 && recordOf(sim.player, TURNING.id).book!.problem; i += 1) go(sim, 'work.try', { piece: key, adjustment: 'work-beat' });
    expect(recordOf(sim.player, TURNING.id).book!.problem).toBeUndefined();
    expect(problemsOf(workPiece(sim, sim.player, key)!).some((x) => x.id === p.id)).toBe(false);
  });
});

describe('a way of playing a segment', () => {
  it('waits to be kept or put back; put back, it’s restored and not offered again for that problem', () => {
    const sim = begun('workbook-way');
    const piece = workPiece(sim, sim.player, key)!;
    // A problem that admits a segment played its own way: a segment's, a limit's or stamina's.
    const p = problemsOf(piece).find((x) => optionsOf(piece, x).some((o) => o.adjustment === 'beat-way'))!;
    expect(p).toBeDefined();
    go(sim, 'work.identify', { piece: key, problem: p.id });
    const book = () => recordOf(sim.player, TURNING.id).book!;
    let ways = optionsOf(workPiece(sim, sim.player, key)!, book().problem!).filter((o) => o.adjustment === 'beat-way');
    expect(ways.length).toBeGreaterThan(1);
    const first = ways[0]!;
    const t = go<Try>(sim, 'work.try', { piece: key, adjustment: 'beat-way', option: first.option });
    expect(t.value!.verdict).toBe('pending');
    expect(go(sim, 'work.identify', { piece: key, problem: p.id }).error).toMatch(/Keep or put back/);
    expect(go(sim, 'work.try', { piece: key, adjustment: 'work-beat' }).error).toMatch(/Keep or put back/);
    expect(go(sim, 'work.settle', { piece: key, keep: false }).ok).toBe(true);
    expect(book().ways?.[p.segment!] ?? null).toBeNull();
    ways = optionsOf(workPiece(sim, sim.player, key)!, book().problem ?? p).filter((o) => o.adjustment === 'beat-way');
    expect(ways.some((o) => o.option === first.option)).toBe(false);
    expect(go(sim, 'work.try', { piece: key, adjustment: 'beat-way', option: first.option }).error).toMatch(/put it back|doesn’t answer/);
  });

  it('kept, is read by every later forecast and take, and by the piece as the take judges it', () => {
    const sim = begun('workbook-keep');
    const book = () => recordOf(sim.player, TURNING.id).book;
    const piece = workPiece(sim, sim.player, key)!;
    const p = problemsOf(piece).find((x) => optionsOf(piece, x).some((o) => o.adjustment === 'beat-way'))!;
    go(sim, 'work.identify', { piece: key, problem: p.id });
    const way = optionsOf(workPiece(sim, sim.player, key)!, book()!.problem!).find((o) => o.adjustment === 'beat-way')!;
    expect(way).toBeDefined();
    const before = forecast(sim, sim.player, TURNING).piece!.segments[p.segment!]!.dims;
    go(sim, 'work.try', { piece: key, adjustment: 'beat-way', option: way.option });
    expect(go(sim, 'work.settle', { piece: key, keep: true }).ok).toBe(true);
    expect(book()!.ways![p.segment!]).toBeTruthy();
    expect(briefPiece(TURNING, recordOf(sim.player, TURNING.id)).own?.[p.segment!]).toBeDefined();
    const after = forecast(sim, sim.player, TURNING).piece!.segments[p.segment!]!.dims;
    expect(after).not.toEqual(before);
    // The take reads it too.
    const taped = go<{ overall: number }>(sim, 'practice.self_tape', { genre: TURNING.kinds[0], brief: TURNING.id });
    expect(taped.ok).toBe(true);
    expect((sim.player.work ?? []).at(-1)!.inputs.piece!.own?.[p.segment!]).toBeDefined();
  });
});

describe('stamina', () => {
  it('finds places to breathe, which lighten the load the piece puts on stamina', () => {
    const heavy = [...BRIEFS].sort((a, b) => b.physical + b.vocal - (a.physical + a.vocal))[0]!;
    const sim = student('workbook-breathe');
    sim.player.wellbeing.fitness = 5;
    go(sim, 'brief.choose', { brief: heavy.id, reading: heavy.readings[0]!.id });
    for (const step of ['read', 'lines', 'lines', 'rehearse', 'rehearse']) go(sim, 'brief.prepare', { brief: heavy.id, step });
    const k = `brief:${heavy.id}`;
    const st = problemsOf(workPiece(sim, sim.player, k)!).find((x) => x.kind === 'stamina')!;
    expect(st).toBeDefined();
    go(sim, 'work.identify', { piece: k, problem: st.id });
    const load = briefPiece(heavy, recordOf(sim.player, heavy.id)).load;
    const t = go<Try>(sim, 'work.try', { piece: k, adjustment: 'breathe' });
    expect(t.ok).toBe(true);
    expect(t.value!.after).toBeGreaterThan(t.value!.before);
    go(sim, 'work.settle', { piece: k, keep: true });
    expect(briefPiece(heavy, recordOf(sim.player, heavy.id)).load).toBeCloseTo(load * WORKBOOK.breathe, 9);
  });
});

describe('refusals and records', () => {
  it('refuses with its reason: no reading, no lines, asleep, spent', () => {
    const sim = student('workbook-refusals');
    const b = TURNING;
    const k = `brief:${b.id}`;
    // Before a reading the forecast still shows the work, and an hour on it is refused for the reading.
    go(sim, 'brief.prepare', { brief: b.id, step: 'read' });
    const piece = workPiece(sim, sim.player, k)!;
    const p = problemsOf(piece).find((x) => optionsOf(piece, x).length > 0)!;
    expect(p).toBeDefined();
    go(sim, 'work.identify', { piece: k, problem: p.id });
    const o = optionsOf(workPiece(sim, sim.player, k)!, p)[0]!;
    expect(go(sim, 'work.try', { piece: k, adjustment: o.adjustment, ...(o.option ? { option: o.option } : {}) }).error).toMatch(/Choose a reading/);
    // Asleep, and spent, on your feet.
    go(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id });
    for (const step of ['lines', 'lines']) go(sim, 'brief.prepare', { brief: b.id, step });
    const feet = optionsOf(workPiece(sim, sim.player, k)!, p).find((x) => x.adjustment !== 'objective');
    if (feet) {
      rest(sim);
      sim.player.wellbeing.energy = 2;
      expect(sim.execute({ kind: 'work.try', payload: { piece: k, adjustment: feet.adjustment, ...(feet.option ? { option: feet.option } : {}) } }).error).toMatch(/too tired/);
    }
    expect(go(sim, 'work.identify', { piece: k, problem: 'no-such' }).error).toMatch(/isn’t a problem/);
    expect(go(sim, 'work.identify', { piece: 'brief:none', problem: 'x' }).error).toMatch(/no such work/);
    expect(go(sim, 'work.settle', { piece: k, keep: true }).error).toMatch(/no change waiting/);
  });

  it('gives the same evidence for the same work, and keeps the workbook through a save', () => {
    const run = () => {
      const sim = begun('workbook-same');
      const p = problemsOf(workPiece(sim, sim.player, key)!).find((x) => x.kind === 'turn' || x.kind === 'segment')!;
      go(sim, 'work.identify', { piece: key, problem: p.id });
      return { sim, t: go<Try>(sim, 'work.try', { piece: key, adjustment: 'work-beat' }).value! };
    };
    const a = run();
    const b = run();
    expect([a.t.before, a.t.after]).toEqual([b.t.before, b.t.after]);
    const back = loadSave(deserialise(serialise(a.sim.universe)) as never);
    expect(back.player.briefs![TURNING.id]!.book!.tries).toEqual(a.sim.player.briefs![TURNING.id]!.book!.tries);
    expect(back.player.briefs![TURNING.id]!.work).toEqual(a.sim.player.briefs![TURNING.id]!.work);
  });
});

describe('mastery, with discoveries kept', () => {
  it('is still exactly 100, a segment played its own way and rehearsed in', () => {
    const sim = student('workbook-mastery');
    const p = sim.player;
    p.craft = evenCraft(MASTERED);
    for (const k of ['emotion', 'memorization', 'voice', 'movement'] as const) p.craft[k] = 100;
    p.attrs = { presence: 100, composure: 100, listening: 100, imagination: 100, focus: 100, adaptability: 100, discipline: 100 };
    p.wellbeing.fitness = abilityFull(sim, p, 'stamina');
    const b = BRIEF_BY_ID[TURNING.id]!;
    go(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id });
    // TEST SETUP: the preparation complete and a segment's own way kept, rehearsed in fully.
    const rec = recordOf(p, b.id);
    rec.prep = { interpretation: 1, memorization: 1, rehearsal: 1 };
    for (const g of b.kinds) (p.engagement ??= { byGenre: {} } as never).byGenre[g] = { familiarity: 100, practice: 100 } as never;
    rec.book = { tries: [], ways: [null, { axis: 'pace', side: 'measured', prep: 1 }] };
    if (b.allows?.pace && !b.allows.pace.includes('measured')) rec.book.ways = [null, { axis: 'pace', side: b.allows.pace[0]!, prep: 1 }];
    const e = forecast(sim, p, b);
    expect(e.overall).toBe(100);
    expect(e.mastery).toBe(true);
  });
});
