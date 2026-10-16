/**
 * A performance's workload, the owner's brief 10, decision 5 (2026-10-16; docs/verification/decisions-2026-10-16/
 * criteria.md, section 4, W1 to W10, and M1).
 *
 * Until this brief a night's load on stamina was 0.6 and 0.12 for each level of the body's and the voice's work, clamped
 * at 1, read by a segment's place in the piece: its first segment none, its last all of it. So The Bear, A Marriage
 * Proposal, Riders To The Sea and Salomé, each one act, were loaded as whole evenings, a featured part as its lead, and a
 * night processed as one segment drained nothing at all. A call held 150 minutes at the School and 180 at the Rep
 * whatever the play, and a performance took 10 energy flat. Since (`content/workload.ts`, `systems/workload.ts`):
 * - every play has a running time with its basis, one production's or SLATE's estimate, said so;
 * - the workload is the part's stage hours (the playing time by its share for its size) times the intensity of the body's
 *   and the voice's work; within the piece it's the drain, each segment the mean over its own stretch of the running,
 *   less after a break, and more for somebody who came to the curtain tired; after it, the energy the evening costs,
 *   half spared at full stamina; and the call holds the running time and the curtain call, once.
 *
 * Every expected figure is worked by hand from the rule as `content/workload.ts` states it: 2/9 a level (the Compendium's
 * 3.0 METs for acting to 5.0 for a dance performance over three levels), a lead 0.75 of the playing time, a supporting
 * part 0.5 and a featured 0.2, the full drain 0.3 at the work done at the curtain of a lead's 150-minute evening with a
 * 20-minute interval in a play of four levels, a quarter given back at a 20-minute break, half again at no readiness,
 * 5 energy a unit of workload and half of it spared at full stamina, and 5 minutes of curtain call. The engine's own
 * helpers set things up and are what's checked; they never give an expected figure.
 *
 * PLAYER JOURNEY where play reaches it: a first-year's first spring, cast in the Carlotta Festival as the calendar books
 * it, played through its calls to its curtains. TEST SETUP, said where it's used: the day's dials kept (`tended`), as
 * the journeys keep them; a night's play or part set where a test compares plays the festival doesn't give (its new plays
 * are unnamed); and an actor's stamina or readiness set for a twin. FIXTURE where play can't reach it: a night kept by
 * the build before this one, which a current build can't make.
 */
import { describe, expect, it, vi } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { PLAY_MATERIAL, type MaterialProfile } from '@/engine/content/material';
import { REP_PLAYS, SHAKESPEARE_PLAYS, SUMMER_PLAYS, THESIS_PLAYS } from '@/engine/content/plays';
import { RUNNING_TIMES, UNNAMED_RUNNING, WORKLOAD, type RunningTime } from '@/engine/content/workload';
import { RULESET, TASK_PROFILES } from '@/engine/content/tasks';
import { MASTERED } from '@/engine/content/abilities';
import { CALL_KIND, playPiece, stageHours } from '@/engine/systems/school';
import { judgePiece, nightPiece, unitSegments, type PieceSpec } from '@/engine/systems/piece';
import { endShare, eveningCost, holdOf, nightLoad, runningOf, segmentShares, segmentWorkloads, wholeShare, workloadWords, type Participation } from '@/engine/systems/workload';
import { materialContext } from '@/engine/systems/material';
import { replay, type EvalContext, type Performer, type WorkRecord } from '@/engine/systems/evaluation';
import { abilityFull } from '@/engine/systems/attributes';
import { ENERGY_DRAIN_PER_HOUR, occupiedAt } from '@/engine/systems/life';

const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation }));
// Without the original: it imports the looks, which import it back (as tests/rehearsal-notes-history.test.ts mocks it).
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({ get sim() { return h.sim; }, version: 0, run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }), toast: noop } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});
const { RehearsalProcess } = await import('@/ui/components/RehearsalProcess');
await import('@/ui/looks/all');
const { resolveLook } = await import('@/ui/looks/registry');

// ---------------------------------------------------------------------------------------------------------------------
// The rule, by hand
// ---------------------------------------------------------------------------------------------------------------------

const STEP = 2 / 9;
const SHARE: Record<Participation, number> = { lead: 0.75, supporting: 0.5, featured: 0.2, solo: 1 };
const FULL = (130 / 60) * 0.75 * (1 + 4 * STEP) * (1 - 0.25 / 2);
const G = (r: number) => 1 + 0.5 * (1 - r / 100);
const intensityOf = (physical: number, vocal: number) => 1 + STEP * (physical + vocal);
const workloadOf = (playing: number, size: Participation, physical: number, vocal: number) => (playing / 60) * SHARE[size] * intensityOf(physical, vocal);
const energyOf = (w: number, stamina: number, r: number) => 5 * w * (1 - 0.5 * stamina) * G(r);
const drainOf = (share: number, stamina: number, r: number) => 0.3 * share * (1 - stamina) * G(r);

const zone = 'America/New_York';
const at = (year: number, month: number, day: number, hour = 9) => instantFromZoned({ year, month, day, hour }, zone);
const firstYear = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
/** TEST SETUP: the day's dials a life keeps by its own commands, as the journeys play them. */
const tended = (sim: Simulation, until: number) => {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
};
/** A copy of a save to play a road not taken (the engine's own load, never the persistence adapter). */
const twin = (sim: Simulation) => loadSave(structuredClone(sim.universe));
/** A save and a load through the persistence adapter, as a player's reload is. */
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);

/** The first spring's Carlotta, as the calendar books it, at an hour before its first curtain. */
function carlotta(seed: string) {
  const sim = firstYear(seed);
  sim.advanceTo(at(2027, 1, 4) + 60_000);
  const nights = sim.universe.scheduled.filter((i) => i.kind === CALL_KIND && i.payload.which !== 'rep' && i.payload.call === 'performance' && i.payload.personId === sim.player.id).sort((a, b) => a.at - b.at);
  tended(sim, nights[0]!.at - MS_HOUR);
  return { sim, nights, casting: () => sim.player.school!.casting! };
}
/** The night just played, from the record it left. */
const lastNight = (sim: Simulation): WorkRecord => sim.player.work!.at(-1)!;
const staminaOf = (w: WorkRecord) => w.inputs.abilities.stamina! / w.inputs.fulls!.stamina!;
/** Plays the night at its curtain: the energy just before and just after it fires. */
function playNight(sim: Simulation, night: { at: number }): { before: number; after: number; record: WorkRecord } {
  sim.advanceTo(night.at - 1);
  const before = sim.player.wellbeing.energy;
  sim.advanceTo(night.at + 1);
  return { before, after: sim.player.wellbeing.energy, record: lastNight(sim) };
}

const MASTER: Performer = { ability: () => 100, full: () => 100, technique: () => MASTERED };
const withStamina = (p: Performer, s: number): Performer => ({ ...p, ability: (id) => (id === 'stamina' ? s : p.ability(id)) });
const night = (m: MaterialProfile) => {
  const task = TASK_PROFILES.performance!;
  const read = materialContext(task, m);
  const prep = { lines: 1, blocking: 1, notes: 1 };
  return { task, techniques: { scene: 1, ...(m.techniques ?? {}) }, prep, required: { lines: 0.9, blocking: 0.9, notes: 0.9 }, difficulty: 0.05, lean: read.lean, inputs: read.inputs, key: `w:${m.id}`, expected: true } as Omit<EvalContext, 'condition'>;
};
const play = (title: string) => PLAY_MATERIAL.find((m) => m.id === title)!;
/**
 * The plays in one act, by their texts, and those in two acts or more. Woyzeck is neither, an unfinished play in scenes
 * with no acts, played as Vesturport played it in 90 minutes straight through, as Miss Julie's one act is.
 */
const ONE_ACTS = ['Miss Julie', 'Trifles', 'The Bear', 'A Marriage Proposal', 'Riders To The Sea', 'Salomé'];
const FRAGMENTS = ['Woyzeck'];

// ---------------------------------------------------------------------------------------------------------------------
// W1
// ---------------------------------------------------------------------------------------------------------------------

describe('W1: every play has a running time, with its basis', () => {
  it('gives every play the catalog stages a running time, its breaks and its basis, a cited production’s figure read on 2026-10-16 or SLATE’s estimate said so', () => {
    const staged = [...THESIS_PLAYS, ...SHAKESPEARE_PLAYS, ...REP_PLAYS, ...SUMMER_PLAYS].map((p) => p.title);
    expect(staged).toHaveLength(30);
    for (const title of staged) {
      const rt = RUNNING_TIMES[title];
      expect(rt, title).toBeDefined();
      expect(rt!.minutes, title).toBeGreaterThan(rt!.breaks.reduce((a, b) => a + b, 0));
      expect(rt!.basis, title).toBe('production');
      expect(rt!.source, title).toMatch(/^https:\/\//);
      expect(rt!.read, title).toBe('2026-10-16');
      expect(rt!.from.length, title).toBeGreaterThan(20);
      // Every play the catalog profiles is one of them, and nothing else is in the table.
      expect(PLAY_MATERIAL.some((m) => m.id === title), title).toBe(true);
    }
    expect(Object.keys(RUNNING_TIMES).sort()).toEqual([...staged].sort());
    // What the catalog stages without a play it names, each said as what it is.
    expect(UNNAMED_RUNNING.seagull.basis).toBe('production');
    expect(UNNAMED_RUNNING.seagull.from).toMatch(/hasn’t published/);
    for (const k of ['newPlay', 'cabaret', 'solo'] as const) {
      expect(UNNAMED_RUNNING[k].basis, k).toBe('estimate');
      expect(UNNAMED_RUNNING[k].from, k).toMatch(/^SLATE’s estimate/);
    }
    // A listing's interval with no length given is SLATE's 20 minutes, and said so.
    for (const [title, rt] of Object.entries(RUNNING_TIMES)) if (rt.assumedBreak) expect(rt.breaks, title).toContain(20);
    // Each holder finds its own: a play by its title, the Rep's unnamed Seagull, a festival's new play, a Cabaret piece, a solo.
    expect(runningOf({ play: 'Twelfth Night' }).minutes).toBe(174);
    expect(runningOf({ kind: 'understudy' })).toBe(UNNAMED_RUNNING.seagull);
    expect(runningOf({ kind: 'carlotta' })).toBe(UNNAMED_RUNNING.newPlay);
    expect(runningOf({ production: 'Yale Cabaret, Season 59' })).toBe(UNNAMED_RUNNING.cabaret);
    expect(runningOf({ solo: true })).toBe(UNNAMED_RUNNING.solo);
  });

  it('runs every one-act shorter than every full-length play, and loads no one-act lead as a whole evening’s at the same intensity', () => {
    const full = Object.keys(RUNNING_TIMES).filter((t) => !ONE_ACTS.includes(t) && !FRAGMENTS.includes(t));
    expect(full).toHaveLength(23);
    for (const a of ONE_ACTS) for (const f of full) {
      expect(RUNNING_TIMES[a]!.minutes, `${a} against ${f}`).toBeLessThan(RUNNING_TIMES[f]!.minutes);
      // At the same body's and voice's work, a lead: the one-act's workload is under the full-length play's.
      const one = nightLoad(RUNNING_TIMES[a]!, { physical: 2, vocal: 2 }, 'lead').workload;
      const whole = nightLoad(RUNNING_TIMES[f]!, { physical: 2, vocal: 2 }, 'lead').workload;
      expect(one, `${a} against ${f}`).toBeLessThan(whole);
    }
    // The four the old load put at a whole evening: by hand, a lead, at their own levels and running times.
    expect(nightLoad(RUNNING_TIMES['The Bear']!, play('The Bear'), 'lead').workload).toBeCloseTo(workloadOf(55, 'lead', 3, 2), 12);
    expect(nightLoad(RUNNING_TIMES['A Marriage Proposal']!, play('A Marriage Proposal'), 'lead').workload).toBeCloseTo(workloadOf(25, 'lead', 2, 2), 12);
    expect(nightLoad(RUNNING_TIMES['Riders To The Sea']!, play('Riders To The Sea'), 'lead').workload).toBeCloseTo(workloadOf(25, 'lead', 1, 3), 12);
    expect(nightLoad(RUNNING_TIMES['Salomé']!, play('Salomé'), 'lead').workload).toBeCloseTo(workloadOf(75, 'lead', 3, 2), 12);
  });

  it('PLAYER JOURNEY: books the Carlotta’s performances for its new play’s running time and the curtain call, where every School performance held two and a half hours', () => {
    const { nights } = carlotta('stamina-w1');
    expect(nights).toHaveLength(4);
    for (const n of nights) expect(n.durationMinutes).toBe(100 + 5);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// W2, W3, W4, W8: the workload, by hand
// ---------------------------------------------------------------------------------------------------------------------

describe('W2 to W4 and W8: the workload and what it does, worked by hand', () => {
  it('works a lead’s Hedda Gabler: 140 minutes of playing, 0.75 of it on stage, intensity 1 + 2/9 × 2, its interval at 70 minutes giving back a quarter', () => {
    const n = nightLoad(RUNNING_TIMES['Hedda Gabler']!, play('Hedda Gabler'), 'lead');
    const W = (140 / 60) * 0.75 * (1 + (2 / 9) * 2);
    expect(n.playing).toBe(140);
    expect(n.intensity).toBeCloseTo(13 / 9, 12);
    expect(n.workload).toBeCloseTo(W, 12);
    // The work done at the curtain: half of it, a quarter of that given back at the interval, then the other half.
    const atEnd = (W / 2) * 0.75 + W / 2;
    expect(endShare(n)).toBeCloseTo(atEnd / FULL, 12);
    // The whole's mean: the first half rises to W/2, the second from 3W/8 to 7W/8.
    expect(wholeShare(n)).toBeCloseTo((((0 + W / 2) / 2) * 0.5 + ((W * 3 / 8 + W * 7 / 8) / 2) * 0.5) / FULL, 12);
    const cost = eveningCost(n, 0.5, 80);
    expect(cost.energy).toBeCloseTo(5 * W * 0.75 * 1.1, 12);
    expect(cost.drainEnd).toBeCloseTo(0.3 * (atEnd / FULL) * 0.5 * 1.1, 12);
  });

  it('gives longer participation a greater workload, drain and energy, never less, holding every other input', () => {
    for (const m of PLAY_MATERIAL) for (const size of ['featured', 'supporting', 'lead'] as Participation[]) {
      const rt = RUNNING_TIMES[m.id]!;
      const longer: RunningTime = { ...rt, minutes: rt.minutes + 15 };
      const a = nightLoad(rt, m, size), b = nightLoad(longer, m, size);
      expect(b.workload, `${m.id} ${size}`).toBeGreaterThan(a.workload);
      expect(wholeShare(b), `${m.id} ${size}`).toBeGreaterThan(wholeShare(a));
      expect(endShare(b), `${m.id} ${size}`).toBeGreaterThanOrEqual(endShare(a));
      if (endShare(b) < 1) expect(endShare(b), `${m.id} ${size}`).toBeGreaterThan(endShare(a));
      expect(eveningCost(b, 0.4, 85).energy).toBeGreaterThan(eveningCost(a, 0.4, 85).energy);
    }
    // A bigger part of the same play is a longer participation: featured, then supporting, then a lead.
    for (const m of PLAY_MATERIAL) {
      const [f, s, l] = (['featured', 'supporting', 'lead'] as Participation[]).map((z) => nightLoad(RUNNING_TIMES[m.id]!, m, z));
      expect(f!.workload).toBeLessThan(s!.workload);
      expect(s!.workload).toBeLessThan(l!.workload);
      expect(wholeShare(f!)).toBeLessThan(wholeShare(s!));
    }
  });

  it('PLAYER JOURNEY: a short night and a long one at the same curtain, The Bear and Salomé (each one act, the body 3 and the voice 2), the longer costing more, by hand', () => {
    const { sim, nights, casting } = carlotta('stamina-w2');
    const other = twin(sim);
    // TEST SETUP: the part a lead in each, the play set where the festival's new play is unnamed.
    Object.assign(casting(), { play: 'The Bear', size: 'lead' });
    Object.assign(other.player.school!.casting!, { play: 'Salomé', size: 'lead' });
    const bear = playNight(sim, nights[0]!), salome = playNight(other, nights[0]!);
    expect(bear.before).toBe(salome.before);
    const st = staminaOf(bear.record), r = bear.record.inputs.condition.readiness;
    expect(salome.record.inputs.condition.readiness).toBe(r);
    expect(bear.before - bear.after).toBeCloseTo(energyOf(workloadOf(55, 'lead', 3, 2), st, r), 5);
    expect(salome.before - salome.after).toBeCloseTo(energyOf(workloadOf(75, 'lead', 3, 2), st, r), 5);
    expect(salome.before - salome.after).toBeGreaterThan(bear.before - bear.after);
    // Each played to the end of its own running time: the night's record says each.
    expect(bear.record.inputs.piece!.night!.running).toBe(55);
    expect(salome.record.inputs.piece!.night!.running).toBe(75);
  });

  it('gives more intensity more workload at the same running time, and a short intense lead at least a long light one’s: Salomé against Three Sisters', () => {
    const rt = RUNNING_TIMES['Major Barbara']!;
    for (let p = 0; p <= 3; p += 1) for (let v = 0; v <= 3; v += 1) {
      const n = nightLoad(rt, { physical: p, vocal: v }, 'lead');
      expect(n.workload).toBeCloseTo(workloadOf(175, 'lead', p, v), 12);
      if (p < 3) expect(nightLoad(rt, { physical: p + 1, vocal: v }, 'lead').workload).toBeGreaterThan(n.workload);
      if (v < 3) expect(nightLoad(rt, { physical: p, vocal: v + 1 }, 'lead').workload).toBeGreaterThan(n.workload);
    }
    // Salomé, 75 minutes straight through, the body 3 and the voice 2; Three Sisters, 150 minutes of playing, neither.
    const salome = workloadOf(75, 'lead', 3, 2), sisters = workloadOf(150, 'lead', 0, 0);
    expect(salome).toBeGreaterThanOrEqual(sisters);
    expect(nightLoad(RUNNING_TIMES['Salomé']!, play('Salomé'), 'lead').workload).toBeCloseTo(salome, 12);
    expect(nightLoad(RUNNING_TIMES['Three Sisters']!, play('Three Sisters'), 'lead').workload).toBeCloseTo(sisters, 12);
    expect(endShare(nightLoad(RUNNING_TIMES['Salomé']!, play('Salomé'), 'lead'))).toBeGreaterThan(endShare(nightLoad(RUNNING_TIMES['Three Sisters']!, play('Three Sisters'), 'lead')));
  });

  it('PLAYER JOURNEY: twins at the same curtain differing only in stamina, the fitter draining less in every movement and spending less after, by hand; at full, no drain and half the energy still spent', () => {
    const { sim, nights, casting } = carlotta('stamina-w4');
    Object.assign(casting(), { play: 'Julius Caesar', size: 'lead' }); // TEST SETUP: the heaviest lead the catalog holds.
    const fit = twin(sim), full = twin(sim);
    // TEST SETUP: the body's stamina, its fitness, at 30 and 70 and at its full, the day's dials as they are.
    sim.player.wellbeing.fitness = 30;
    fit.player.wellbeing.fitness = 70;
    full.player.wellbeing.fitness = abilityFull(full, full.player, 'stamina');
    const a = playNight(sim, nights[0]!), b = playNight(fit, nights[0]!);
    const r = a.record.inputs.condition.readiness;
    expect(b.record.inputs.condition.readiness).toBe(r);
    const W = workloadOf(135, 'lead', 2, 3);
    const sa = staminaOf(a.record), sb = staminaOf(b.record);
    expect(sb).toBeGreaterThan(sa);
    expect(a.before - a.after).toBeCloseTo(energyOf(W, sa, r), 5);
    expect(b.before - b.after).toBeCloseTo(energyOf(W, sb, r), 5);
    expect(b.before - b.after).toBeLessThan(a.before - a.after);
    const da = replay(a.record, TASK_PROFILES.performance!)!.piece!.segments, db = replay(b.record, TASK_PROFILES.performance!)!.piece!.segments;
    da.forEach((s, i) => expect(db[i]!.drain, s.label).toBeGreaterThanOrEqual(s.drain));
    expect(db.at(-1)!.drain).toBeGreaterThan(da.at(-1)!.drain);
    // At full stamina: no drain in any movement, and the evening still costs 5 × W × 0.5 × g.
    const c = playNight(full, nights[0]!);
    expect(staminaOf(c.record)).toBe(1);
    expect(replay(c.record, TASK_PROFILES.performance!)!.piece!.segments.every((s) => s.drain === 1)).toBe(true);
    expect(c.before - c.after).toBeCloseTo(energyOf(W, 1, c.record.inputs.condition.readiness), 5);
    expect(c.before - c.after).toBeGreaterThan(0);
  });

  it('PLAYER JOURNEY: twins differing only in the condition they came to the curtain in, the more tired draining more and spending more by g, bounded at half again', () => {
    const { sim, nights, casting } = carlotta('stamina-w8');
    Object.assign(casting(), { play: 'Macbeth', size: 'lead' }); // TEST SETUP: a long, hard lead.
    const tired = twin(sim);
    // TEST SETUP: a short night's dials for the twin, its sleep debt and its energy down.
    Object.assign(tired.player.wellbeing, { energy: 30, sleepDebt: 20 });
    const a = playNight(sim, nights[0]!), b = playNight(tired, nights[0]!);
    const ra = a.record.inputs.condition.readiness, rb = b.record.inputs.condition.readiness;
    expect(rb).toBeLessThan(ra);
    expect(staminaOf(b.record)).toBe(staminaOf(a.record));
    const W = workloadOf(133, 'lead', 2, 2);
    expect(a.before - a.after).toBeCloseTo(energyOf(W, staminaOf(a.record), ra), 5);
    expect(b.before - b.after).toBeCloseTo(energyOf(W, staminaOf(b.record), rb), 5);
    expect(b.before - b.after).toBeGreaterThan(a.before - a.after);
    const da = replay(a.record, TASK_PROFILES.performance!)!.piece!.segments, db = replay(b.record, TASK_PROFILES.performance!)!.piece!.segments;
    da.forEach((s, i) => expect(db[i]!.drain, s.label).toBeLessThanOrEqual(s.drain));
    // The bound: half again at no readiness, nothing more at full.
    const n = nightLoad(RUNNING_TIMES['Macbeth']!, play('Macbeth'), 'lead');
    expect(eveningCost(n, 0, 0).energy / eveningCost(n, 0, 100).energy).toBeCloseTo(1.5, 12);
    expect(eveningCost(n, 0, 0).drainEnd / eveningCost(n, 0, 100).drainEnd).toBeCloseTo(1.5, 12);
    expect(eveningCost(n, 0, 140).energy).toBeCloseTo(eveningCost(n, 0, 100).energy, 12);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// W5
// ---------------------------------------------------------------------------------------------------------------------

describe('W5: a break recovers, once', () => {
  it('gives back a quarter of the drain at a 20-minute interval for what follows, a shorter pause in proportion, and leaves the energy the evening costs as it was', () => {
    const m = play('Hedda Gabler');
    // FIXTURE: Hedda Gabler's 140 minutes of playing, with its 20-minute interval and straight through.
    const withBreak = nightLoad({ minutes: 160, breaks: [20], basis: 'estimate', from: 'FIXTURE' }, m, 'lead');
    const straight = nightLoad({ minutes: 140, breaks: [], basis: 'estimate', from: 'FIXTURE' }, m, 'lead');
    const pause = nightLoad({ minutes: 145, breaks: [5], basis: 'estimate', from: 'FIXTURE' }, m, 'lead');
    const W = workloadOf(140, 'lead', 1, 1);
    expect(withBreak.workload).toBeCloseTo(W, 12);
    expect(straight.workload).toBeCloseTo(W, 12);
    // Two halves: the first the same; the second from W/2 cut by a quarter, by a sixteenth after a 5-minute pause.
    const halves = unitSegments({ tones: [], turns: 0 }, 2);
    const [s1, s2] = segmentShares(straight, halves), [b1, b2] = segmentShares(withBreak, halves), [p1, p2] = segmentShares(pause, halves);
    expect(b1).toBeCloseTo(s1!, 12);
    expect(p1).toBeCloseTo(s1!, 12);
    expect(s2).toBeCloseTo(((W / 2 + W) / 2) / FULL, 12);
    expect(b2).toBeCloseTo(((W / 2 * 0.75 + W / 2 * 0.75 + W / 2) / 2) / FULL, 12);
    expect(p2).toBeCloseTo(((W / 2 * (1 - 0.0625) + W / 2 * (1 - 0.0625) + W / 2) / 2) / FULL, 12);
    expect(b2!).toBeLessThan(p2!);
    expect(p2!).toBeLessThan(s2!);
    // The energy the evening costs is the work done: the break doesn't take it back a second time.
    expect(eveningCost(withBreak, 0.5, 90).energy).toBeCloseTo(eveningCost(straight, 0.5, 90).energy, 12);
    expect(eveningCost(withBreak, 0.5, 90).energy).toBeCloseTo(energyOf(W, 0.5, 90), 12);
  });

  it('PLAYER JOURNEY: holds the interval on the clock as waking time charged as any, and a night’s sleep after restores from the dials by its own rule, whatever the interval gave back', () => {
    const { sim, nights, casting } = carlotta('stamina-w5');
    Object.assign(casting(), { play: 'Hedda Gabler', size: 'lead' }); // TEST SETUP: a play with an interval.
    // A twin with no night at all (TEST SETUP: its call taken off the calendar), to sleep beside it.
    const none = twin(sim);
    none.timeline.cancel(nights[0]!.id, none.now);
    const { after: atCurtain, record } = playNight(sim, nights[0]!);
    expect(record.inputs.piece!.night!.breaks).toEqual([20]);
    // The clock through the evening, the call's 105 minutes as booked for the festival's play, its interval among them:
    // waking hours, every one charged at the waking rate, none given back awake (`applyElapsedWellbeing`).
    const end = nights[0]!.at + 105 * 60_000;
    sim.advanceTo(end);
    const rate = ENERGY_DRAIN_PER_HOUR * (1 + ((sim.player.wokeWithDebt ?? 0) / 24) * 0.5);
    expect(atCurtain - sim.player.wellbeing.energy).toBeCloseTo(rate * ((end - nights[0]!.at - 1) / MS_HOUR), 6);
    // The twin given the same dials at the same moment: the same sleep gives the same morning. Sleep reads the dials,
    // and nothing of the evening or what its interval gave back.
    none.advanceTo(end);
    none.player.wellbeing = { ...sim.player.wellbeing };
    Object.assign(none.player, { awakeSince: sim.player.awakeSince, wokeWithDebt: sim.player.wokeWithDebt });
    expect(sim.execute({ kind: 'life.sleep', payload: { hours: 8 } }).ok).toBe(true);
    expect(none.execute({ kind: 'life.sleep', payload: { hours: 8 } }).ok).toBe(true);
    expect(sim.player.wellbeing.energy).toBe(none.player.wellbeing.energy);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// W6
// ---------------------------------------------------------------------------------------------------------------------

describe('W6: the evening’s time and fatigue, once', () => {
  it('PLAYER JOURNEY: holds the clock for the running time and the curtain call, and takes the night’s energy once at the curtain, by hand', () => {
    const { sim, nights } = carlotta('stamina-w6');
    const n0 = nights[0]!;
    const { before, after, record } = playNight(sim, n0);
    // The festival's new play: 100 minutes straight through, as the part's size gives it.
    const size = record.inputs.piece!.night!.size;
    const W = workloadOf(100, size, 0, 0);
    expect(record.inputs.piece!.night!.workload).toBeCloseTo(W, 12);
    expect(before - after).toBeCloseTo(energyOf(W, staminaOf(record), record.inputs.condition.readiness), 5);
    expect(occupiedAt(sim, n0.at + 104 * 60_000)?.id).toBe(n0.id);
    expect(occupiedAt(sim, n0.at + 106 * 60_000)).toBeUndefined();
    // The hours on stage are the part's: its share of the playing time.
    expect(stageHours(sim.player.school!.casting!, size)).toBeCloseTo((100 / 60) * SHARE[size], 12);
  });

  it('PLAYER JOURNEY: a save and a load in the middle of the evening and after it take neither the time nor the energy again', () => {
    const { sim, nights } = carlotta('stamina-w6-reload');
    const n0 = nights[0]!;
    const straight = twin(sim);
    // Played through, and reloaded twice: at the half of the evening, and after the curtain call.
    straight.advanceTo(n0.at + 3 * MS_HOUR);
    sim.advanceTo(n0.at + 50 * 60_000);
    const mid = reload(sim);
    expect(occupiedAt(mid, n0.at + 60 * 60_000)?.id).toBe(n0.id);
    mid.advanceTo(n0.at + 2 * MS_HOUR);
    const late = reload(mid);
    late.advanceTo(n0.at + 3 * MS_HOUR);
    const nightsOf = (s: Simulation) => (s.player.work ?? []).filter((w) => w.at === n0.at).length;
    expect(nightsOf(straight)).toBe(1);
    expect(nightsOf(late)).toBe(1);
    expect(late.player.wellbeing.energy).toBeCloseTo(straight.player.wellbeing.energy, 9);
    expect(late.player.wellbeing.sleepDebt).toBeCloseTo(straight.player.wellbeing.sleepDebt, 9);
  });

  it('times the performance calls a save from before booked, once, on its first opening, and keeps one whose new span would meet another call (GUARD)', () => {
    const { sim, nights, casting } = carlotta('stamina-w6-older');
    // FIXTURE: the calls as the build before booked them, two and a half hours, and a save that hasn't taken the step.
    for (const n of nights) n.durationMinutes = 150;
    sim.universe.opened = (sim.universe.opened ?? []).filter((x) => x !== 'timeTheCalls');
    const opened = loadSave(deserialise(serialise(sim.universe)) as never);
    const timed = opened.universe.scheduled.filter((i) => nights.some((n) => n.id === i.id));
    expect(timed.map((i) => i.durationMinutes)).toEqual(nights.map(() => 105));
    expect(opened.universe.opened).toContain('timeTheCalls');
    // Opened again: nothing moves a second time (TEST SETUP: a call set back by hand stays as it is).
    timed[0]!.durationMinutes = 150;
    const again = loadSave(deserialise(serialise(opened.universe)) as never);
    expect(again.universe.scheduled.find((i) => i.id === nights[0]!.id)!.durationMinutes).toBe(150);
    // GUARD: a longer play whose new span would meet something else the player must attend keeps what it was booked for.
    for (const n of nights) n.durationMinutes = 150;
    casting().play = 'Major Barbara'; // TEST SETUP: a play whose evening holds 200 minutes.
    sim.schedule({ at: nights[1]!.at + 170 * 60_000, kind: CALL_KIND, label: 'Something Else At Ten To Eleven', category: 'school', requiresPlayer: true, durationMinutes: 30, payload: { personId: sim.player.id, call: 'rehearsal' } });
    const guarded = loadSave(deserialise(serialise(sim.universe)) as never);
    const g = (k: number) => guarded.universe.scheduled.find((i) => i.id === nights[k]!.id)!.durationMinutes;
    expect(g(0)).toBe(195 + 5);
    expect(g(1)).toBe(150);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// W7
// ---------------------------------------------------------------------------------------------------------------------

describe('W7: a performance judged in its units comes to what the whole does', () => {
  it('gives the same drain and fatigue judged in its units and processed whole, under 1e-9, on every play, part, break and breath', () => {
    const whole = (s: PieceSpec): PieceSpec => ({ ...s, segments: [{ label: 'The Whole', tones: [], weight: 1, turnInto: false, blend: false }] });
    let cases = 0;
    for (const m of PLAY_MATERIAL) for (const size of ['lead', 'supporting', 'featured'] as Participation[]) for (const breathe of [1, 0.7]) {
      const spec = nightPiece(m, RUNNING_TIMES[m.id]!, size);
      const n = { ...spec.night!, breathe };
      const lengths = spec.segments.map((x) => x.length ?? 1);
      const L = lengths.reduce((a, b) => a + b, 0);
      const units = segmentShares(n, spec.segments);
      const mean = units.reduce((t, x, i) => t + (x * lengths[i]!) / L, 0);
      const one = segmentShares(n, whole(spec).segments)[0]!;
      expect(Math.abs(mean - one), `${m.id} ${size} ${breathe}`).toBeLessThan(1e-9);
      expect(Math.abs(mean - wholeShare(n))).toBeLessThan(1e-9);
      // The drain each reads, by the same stamina and day: its units' mean is the whole's.
      for (const [st, r] of [[0, 100], [0.4, 70], [0.9, 30]] as const) {
        const d = units.reduce((t, x, i) => t + (drainOf(x, st, r) * lengths[i]!) / L, 0);
        expect(Math.abs(d - drainOf(one, st, r))).toBeLessThan(1e-9);
      }
      // The fatigue: the units' shares of the workload sum to the whole's, and the energy is the whole's.
      expect(Math.abs(segmentWorkloads(n, spec.segments).reduce((a, b) => a + b, 0) - n.workload)).toBeLessThan(1e-9);
      cases += 1;
    }
    expect(cases).toBe(30 * 3 * 2);
    // And as judged: a mastered actor but for stamina, each unit's drain factor in the judgment its own exact share's.
    const m = play('The Winter’s Tale');
    const spec = nightPiece(m, RUNNING_TIMES[m.id]!, 'lead');
    const e = judgePiece('w7', withStamina(MASTER, 40), { ...night(m), condition: { readiness: 75 } }, spec);
    const shares = segmentShares(spec.night!, spec.segments);
    e.piece!.segments.forEach((s, i) => expect(s.drain).toBeCloseTo(1 - drainOf(shares[i]!, 0.4, 75), 3));
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// W9
// ---------------------------------------------------------------------------------------------------------------------

describe('W9: bounded, and said', () => {
  it('bounds the workload at its cap and the drain at 45% off, whatever the running time', () => {
    // FIXTURE: a running time no play has.
    const n = nightLoad({ minutes: 2000, breaks: [], basis: 'estimate', from: 'FIXTURE' }, { physical: 3, vocal: 3 }, 'solo');
    expect(n.workload).toBe(8);
    expect(WORKLOAD.cap).toBe(8);
    expect(endShare(n)).toBe(1);
    expect(eveningCost(n, 0, 0).drainEnd).toBeCloseTo(0.45, 12);
    expect(eveningCost(n, 0, 0).energy).toBeCloseTo(5 * 8 * 1.5, 12);
    // Every part the catalog holds is under the cap, so none is clamped there.
    for (const m of PLAY_MATERIAL) expect(nightLoad(RUNNING_TIMES[m.id]!, m, 'lead').workload, m.id).toBeLessThan(8);
  });

  it('PLAYER JOURNEY: says the workload before the curtain under A Night Now and in the night’s record after it, from the engine’s own figures', () => {
    const { sim, nights, casting } = carlotta('stamina-w9');
    h.sim = sim;
    const html = () => renderToStaticMarkup(createElement(RehearsalProcess, { casting: casting(), which: 'school' } as never)).replace(/<!-- -->/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const before = html();
    expect(before).toContain('The Evening’s Workload.');
    expect(before).toContain('The evening runs 1 h 40 straight through, an estimate.');
    const size = casting().size!;
    const W = workloadOf(100, size, 0, 0);
    expect(before).toContain(`you’re on for about ${Math.round(SHARE[size] * 100)}% of its 1 h 40 of playing`);
    expect(before).toContain(`a workload of ${W.toFixed(2)}, of at most 8.`);
    expect(before).toContain('The running time: SLATE’s estimate');
    // After the curtain, the night's record says it, as its look shows it.
    const { record } = playNight(sim, nights[0]!);
    const said = workloadWords(record)!;
    const st = staminaOf(record), r = record.inputs.condition.readiness;
    expect(said).toContain(`a workload of ${W.toFixed(2)}`);
    expect(said).toContain(`the evening costs ${Math.round(energyOf(W, st, r))} energy`);
    const share = (W / FULL);
    expect(said).toContain(`At the curtain’s fall tiring takes ${Math.round(drainOf(share, st, r) * 100)}% off what it reaches`);
    const look = resolveLook(sim, { kind: 'work', id: record.inputs.key });
    const body = renderToStaticMarkup(createElement('div', null, (look as unknown as { body: never }).body)).replace(/<!-- -->/g, '');
    expect(body).toContain(said);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// W10 and M1
// ---------------------------------------------------------------------------------------------------------------------

describe('W10: a night kept under the ruleset before is shown as it was', () => {
  it('opens a save from before with its nights as they were judged under evaluation-10, replays none, names the ruleset, and judges the next by its workload', () => {
    const { sim, nights } = carlotta('stamina-w10');
    playNight(sim, nights[0]!);
    // FIXTURE: the night as the build before kept it: its ruleset's name, no workload, its load the old evening's 0.6.
    const old = lastNight(sim);
    old.ruleset = 'evaluation-10 (2026-10-16)';
    delete (old.inputs.piece as { night?: unknown }).night;
    old.inputs.piece!.load = 0.6;
    const kept = { overall: old.overall, band: old.band, dims: { ...old.dims } };
    sim.universe.opened = (sim.universe.opened ?? []).filter((x) => x !== 'timeTheCalls');
    const opened = reload(sim);
    const was = opened.player.work!.find((w) => w.at === nights[0]!.at)!;
    expect({ overall: was.overall, band: was.band, dims: was.dims }).toEqual(kept);
    expect(was.ruleset).toBe('evaluation-10 (2026-10-16)');
    expect(replay(was, TASK_PROFILES.performance!)).toBeUndefined();
    expect(workloadWords(was)).toBeUndefined();
    const look = resolveLook(opened, { kind: 'work', id: was.inputs.key }) as { provenance: string };
    expect(look.provenance).toBe('Judged under evaluation-10 (2026-10-16), rules since changed, so it isn’t worked out again under today’s: what it was is kept as it was.');
    // The next night: today's ruleset, with its workload.
    tended(opened, nights[1]!.at - MS_HOUR);
    const { record } = playNight(opened, nights[1]!);
    expect(record.ruleset).toBe(RULESET);
    expect(RULESET).toBe('evaluation-11 (2026-10-16)');
    expect(record.inputs.piece!.night!.running).toBe(100);
  });
});

describe('M1: mastery is kept', () => {
  it('gives a mastered actor 100 on the heaviest night the catalog holds, as a lead, at the least sufficient readiness, every movement holding', () => {
    for (const title of ['Julius Caesar', 'The Winter’s Tale', 'The Bear']) {
      const m = play(title);
      const e = judgePiece('m1', MASTER, { ...night(m), condition: { readiness: 60 } }, nightPiece(m, RUNNING_TIMES[title]!, 'lead'));
      expect(e.overall, title).toBe(100);
      expect(e.piece!.segments.every((s) => s.drain === 1 && s.overall === 100), title).toBe(true);
    }
    // And the same night costs energy: the work is done, at full stamina half of it spared.
    const n = nightLoad(RUNNING_TIMES['Julius Caesar']!, play('Julius Caesar'), 'lead');
    expect(eveningCost(n, 1, 60).energy).toBeCloseTo(5 * workloadOf(135, 'lead', 2, 3) * 0.5 * G(60), 12);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// A run of nights
// ---------------------------------------------------------------------------------------------------------------------

describe('a run of nights', () => {
  it('PLAYER JOURNEY: starts each night’s drain from nothing, reads each night’s own curtain, and is restored between by the night’s sleep alone', () => {
    const { sim, nights } = carlotta('stamina-run');
    const first = playNight(sim, nights[0]!);
    // The evening over and a night's sleep, by the command, then the day kept to the next curtain.
    sim.advanceTo(nights[0]!.at + 106 * 60_000);
    expect(sim.execute({ kind: 'life.sleep', payload: { hours: 8 } }).ok).toBe(true);
    tended(sim, nights[1]!.at - MS_HOUR);
    const second = playNight(sim, nights[1]!);
    const n1 = first.record.inputs.piece!.night!, n2 = second.record.inputs.piece!.night!;
    expect(n2).toEqual(n1);
    // The drain's shares are the night's own, from nothing at its curtain, the same each night; what differs is each
    // night's own stamina and readiness, read at its own curtain.
    const segs = (w: WorkRecord) => replay(w, TASK_PROFILES.performance!)!.piece!.segments;
    const shares = segmentShares(n1, first.record.inputs.piece!.segments);
    segs(first.record).forEach((s, i) => expect(s.drain).toBeCloseTo(1 - drainOf(shares[i]!, staminaOf(first.record), first.record.inputs.condition.readiness), 3));
    segs(second.record).forEach((s, i) => expect(s.drain).toBeCloseTo(1 - drainOf(shares[i]!, staminaOf(second.record), second.record.inputs.condition.readiness), 3));
    expect(second.before - second.after).toBeCloseTo(energyOf(n2.workload, staminaOf(second.record), second.record.inputs.condition.readiness), 5);
    // The run's nights counted one each.
    expect(sim.player.school!.casting!.performed).toBe(2);
  });
});

// The playing time a part reads (used above through the engine's `stageHours`), and its play's piece (`playPiece`), the
// same running time and size: a check that the two agree.
describe('the part and its piece', () => {
  it('reads the part’s own size in its piece and its hours on stage', () => {
    for (const size of ['lead', 'supporting', 'featured'] as Participation[]) {
      const p = playPiece({ play: 'Twelfth Night' }, size);
      expect(p.night!.share).toBe(SHARE[size]);
      expect(stageHours({ play: 'Twelfth Night' }, size)).toBeCloseTo((154 / 60) * SHARE[size], 12);
      expect(holdOf({ play: 'Twelfth Night' })).toBe(174 + 5);
    }
  });
});
