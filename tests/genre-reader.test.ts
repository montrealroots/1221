/**
 * The reader weighed as a concern is (from 2026-10-16, the owner's brief "Resolve The Remaining Genre Benchmark";
 * docs/verification/genres-2026-10-16/g1-replacement.md, "S3: The Reader Weighed As A Concern"). The reader's way of
 * playing the other part counts toward a side's suitability at `GRAIN.reader`, the half a register's concern counts
 * at. Until then it counted in full, and on brief-apocalyptic-2's withholding reader two genres pulling the pace
 * opposite ways both came out measured. The expectations are worked from the affinities by hand, not read back from the
 * code; what's set by hand is TEST SETUP and named.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, instantFromZoned } from '@/engine/core/time';
import { BRIEF_BY_ID, type Brief } from '@/engine/content/briefs';
import { GRAIN } from '@/engine/content/interpretation';
import { briefMaterial, readingOf, sceneOf } from '@/engine/systems/briefs';
import { suitabilityOf } from '@/engine/systems/interpretation';
import { genreState } from '@/engine/systems/engagement';
import { abilityFull } from '@/engine/systems/attributes';

const SCENE = BRIEF_BY_ID['brief-apocalyptic-2']!;
// The genre signature's construction: the same scene, its reader and its reading, with a genre's register laid over it.
const as = (g: string): Brief => ({ ...SCENE, kinds: [g] });
const pace = (b: Brief) => {
  const scene = sceneOf(b, readingOf(b, b.readings[0]!.id));
  const m = suitabilityOf('measured', briefMaterial(b), scene), d = suitabilityOf('driven', briefMaterial(b), scene);
  return { measured: m, driven: d, pick: m.s >= d.s ? 'measured' : 'driven' };
};
const weight = GRAIN.reader;
afterEach(() => { Object.assign(GRAIN as Record<string, number>, { reader: weight }); });

describe('the reader weighed as a concern is', () => {
  it('counts a withholding reader at half its affinity, as a register’s concern counts', () => {
    expect(SCENE.readerPlays).toBe('withholding');
    // READER_AFFINITY.withholding: measured 0.5, driven -0.5; at half, 0.25 and -0.25.
    const p = pace(as('absurdist'));
    expect(p.measured.signals.find((s) => s.source === 'A Withholding Reader')?.v).toBe(0.25);
    expect(p.driven.signals.find((s) => s.source === 'A Withholding Reader')?.v).toBe(-0.25);
  });

  it('a contrasting pair that came out alike now differs, by the axis their registers pull apart on', () => {
    // Absurdist (Rhythm: driven 1, measured -0.5) and chase (Suspense Held: measured 1, driven -0.5) share no concern
    // and pull the pace opposite ways.
    expect(pace(as('absurdist')).pick).toBe('driven');
    expect(pace(as('chase')).pick).toBe('measured');
    // As it was, the reader in full: halving it moved measured by -0.25/2 and driven by +0.25/2, so in full absurdist read
    // measured 0.36 against driven 0.28, and came out measured as chase does.
    Object.assign(GRAIN as Record<string, number>, { reader: 1 });
    expect(pace(as('absurdist')).pick).toBe('measured');
    expect(pace(as('chase')).pick).toBe('measured');
  });

  it('the reader still decides where nothing else does: the same scene and genre, steady against withholding, reads the pace otherwise', () => {
    const withholding = pace(as('apocalyptic'));
    const steady = pace({ ...as('apocalyptic'), readerPlays: 'steady' });
    // Steady leans neither pace side; withholding adds 0.25 to measured and takes 0.25 from driven, halved into s.
    expect(Math.round((withholding.measured.s - steady.measured.s) * 1000) / 1000).toBeCloseTo(0.125, 1);
    expect(Math.round((steady.driven.s - withholding.driven.s) * 1000) / 1000).toBeCloseTo(0.125, 1);
    expect(withholding.pick).toBe('measured');
  });

  it('related genres keep their overlap: absurdist and comedy share Comic Rhythm and read the pace alike', () => {
    expect(pace(as('comedy')).pick).toBe(pace(as('absurdist')).pick);
    expect(pace(as('comedy')).driven.s).toBe(pace(as('absurdist')).driven.s);
  });
});

describe('the reader weighed as a concern, played', () => {
  const NY = 'America/New_York';
  const clear = (sim: Simulation) => { for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now); };
  // TEST SETUP: rested before each command, so the day's condition doesn't decide what's measured.
  const go = (sim: Simulation, kind: string, payload: Record<string, unknown>) => { clear(sim); Object.assign(sim.player.wellbeing, { energy: 95, stress: 15, sleepDebt: 0, nourishment: 80, hygiene: 80, morale: 60 }); const r = sim.execute({ kind, payload }); expect(r.ok, `${kind}: ${r.error}`).toBe(true); return r; };
  const tape = (sim: Simulation, side: 'measured' | 'driven') => {
    go(sim, 'brief.choose', { brief: SCENE.id, reading: SCENE.readings[0]!.id, pace: side });
    for (let i = 0; i < 4; i += 1) for (const step of ['read', 'lines', 'rehearse']) go(sim, 'brief.prepare', { brief: SCENE.id, step });
    go(sim, 'practice.self_tape', { genre: SCENE.kinds[0], brief: SCENE.id });
    return sim.player.briefs![SCENE.id]!.takes.at(-1)!;
  };
  const student = (level: number) => {
    const sim = createSave(1, 'genre-reader', { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
    clear(sim);
    sim.advanceTo(instantFromZoned({ year: 2026, month: 8, day: 29, hour: 9 }, NY));
    // TEST SETUP: an even student at the level given, the genre known.
    Object.assign(sim.player.attrs!, Object.fromEntries(Object.keys(sim.player.attrs!).filter((k) => k !== 'stamina').map((k) => [k, level])));
    genreState(sim.player, SCENE.kinds[0]!).familiarity = 90;
    return sim;
  };

  it('PLAYER JOURNEY: driven, against the withholding reader, is taped and gives back less than it did with the reader in full; measured gains less', () => {
    const now = { driven: tape(student(55), 'driven'), measured: tape(student(55), 'measured') };
    Object.assign(GRAIN as Record<string, number>, { reader: 1 });
    const before = { driven: tape(student(55), 'driven'), measured: tape(student(55), 'measured') };
    // The withholding reader pulls toward measured and away from driven; at half weight it pulls half as hard.
    expect(now.driven.grain!.points).toBeGreaterThan(before.driven.grain!.points);
    expect(now.measured.grain!.points).toBeLessThan(before.measured.grain!.points);
    // The reader still counts: measured, with it, is still the side it gives to.
    expect(now.measured.grain!.points).toBeGreaterThan(now.driven.grain!.points);
  }, 120_000);

  it('PLAYER JOURNEY: a mastered actor, prepared a day at a time, still reaches 100 played against the reader', () => {
    const sim = student(100);
    // TEST SETUP: every technique mastered and the genre known through.
    for (const k of Object.keys(sim.player.craft ?? {})) (sim.player.craft as unknown as Record<string, number>)[k] = 100;
    genreState(sim.player, SCENE.kinds[0]!).familiarity = 100;
    go(sim, 'brief.choose', { brief: SCENE.id, reading: SCENE.readings[0]!.id, pace: 'driven' });
    // A daily step counts once a day, and a side against the reader asks more of the choice's rehearsal.
    for (let day = 0; day < 12; day += 1) {
      sim.advanceTo(sim.now + MS_DAY);
      for (const step of ['read', 'lines', 'rehearse']) { clear(sim); sim.execute({ kind: 'brief.prepare', payload: { brief: SCENE.id, step } }); }
    }
    // TEST SETUP: fit to the most a body this age can be brought to, after twelve days of the clock.
    sim.player.wellbeing.fitness = abilityFull(sim, sim.player, 'stamina');
    go(sim, 'practice.self_tape', { genre: SCENE.kinds[0], brief: SCENE.id });
    const take = sim.player.briefs![SCENE.id]!.takes.at(-1)!;
    expect(pace(SCENE).pick).toBe('measured');
    expect(take.overall).toBe(100);
  }, 120_000);
});
