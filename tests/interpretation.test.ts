/**
 * A way of playing read against the scene (from 2026-10-16, `systems/interpretation.ts`): suitability from what the scene
 * is, applied as a share of difficulty on the dimensions a side leans on and as the rehearsal its choice asks, apart from
 * what the actor's abilities cost, and never a cap at mastery. The criteria are docs/verification/interpretation-2026-10-16/
 * criteria.md; the catalog-wide figures are tools/interpretation.ts's. The cases below were found by searching the
 * catalog, and each figure is checked against the side it favors, not against a number typed in.
 */
import { describe, expect, it } from 'vitest';
import { BRIEF_BY_ID, BRIEFS, type Brief } from '@/engine/content/briefs';
import { MASTERED } from '@/engine/content/abilities';
import { APPROACH_EFFECT, PLAYING } from '@/engine/content/approaches';
import { GRAIN } from '@/engine/content/interpretation';
import type { Person } from '@/engine/domain/model';
import { briefContext, briefMaterial, briefPiece, sceneOf, readingOf, type BriefRecord } from '@/engine/systems/briefs';
import { chiefLimit, replay, type Performer } from '@/engine/systems/evaluation';
import { judgePiece } from '@/engine/systems/piece';
import { misfitOf, type Playing } from '@/engine/systems/material';
import { grainOf, requiredFor, suitabilityOf } from '@/engine/systems/interpretation';
import { grainRead, grainWords } from '@/engine/systems/interpretation-read';
import { TASK_PROFILES, type Dimension } from '@/engine/content/tasks';
import type { Axis, AxisValue } from '@/engine/content/material';

const nobody = { engagement: { byGenre: {} } } as unknown as Person;
const rec = (p: number): BriefRecord => ({ prep: { interpretation: p, memorization: p, rehearsal: p }, takes: [] });
const act = (ab: Record<string, number>, fill: number): Performer => ({ ability: (id) => ab[id] ?? fill, full: () => 100, technique: () => 50 });
const EVEN = act({}, 55);
const MASTER: Performer = { ability: () => 100, full: () => 100, technique: () => MASTERED };
const EXPANSIVE_SPECIALIST = act({ presence: 80, vocal: 80, physical: 80 }, 45);
type Sides = Omit<Playing, 'chosenAt' | 'prep'>;
const judgeIt = (b: Brief, p: Performer, sides: Sides, o: { reading?: string; approach?: number } = {}) => {
  const reading = o.reading ?? b.readings[0]!.id;
  const approach = o.approach ?? 1;
  const ctx = briefContext(nobody, b, rec(1), { reading, playing: { ...sides, chosenAt: 0, prep: approach }, prep: { genre: 1, approach } });
  return judgePiece('interp', p, { ...ctx, condition: { readiness: 100 }, key: `i:${b.id}`, expected: true }, briefPiece(b, { ...rec(1), reading }, reading));
};
const score = (b: Brief, p: Performer, sides: Sides, o: { reading?: string; approach?: number } = {}) => judgeIt(b, p, sides, o).overall;
const suit = (b: Brief, side: AxisValue, reading?: string) => suitabilityOf(side, briefMaterial(b), sceneOf(b, readingOf(b, reading ?? b.readings[0]!.id)));
const off = <T,>(f: () => T): T => { const was = { ...GRAIN }; Object.assign(GRAIN as Record<string, number>, { strength: 0, prep: 0 }); try { return f(); } finally { Object.assign(GRAIN as Record<string, number>, was); } };

describe('a way of playing, read against the scene', () => {
  it('keeps the guarantee: a mastered actor reaches 100 on every fitting side, with the grain or against it', () => {
    let against = 0;
    for (const b of BRIEFS.filter((_, i) => i % 7 === 0)) {
      for (const [axis, side] of [['scale', 'restrained'], ['scale', 'expansive'], ['pace', 'measured'], ['pace', 'driven'], ['structure', 'set'], ['structure', 'open']] as [Axis, AxisValue][]) {
        if (misfitOf(axis, side, briefMaterial(b))) continue;
        if (suit(b, side).band === 'against') against += 1;
        expect(score(b, MASTER, { [axis]: side }), `${b.id} ${side}`).toBe(100);
      }
    }
    // Sides against the grain were among them: suitability is never a cap.
    expect(against).toBeGreaterThan(5);
  });

  it('isn’t a genre rule: one genre’s two scenes favor opposite scales, and the even actor’s result follows each scene', () => {
    const [one, two] = [BRIEF_BY_ID['brief-alternate_history']!, BRIEF_BY_ID['brief-alternate_history-2']!];
    const lean = (b: Brief) => suit(b, 'restrained').s - suit(b, 'expansive').s;
    expect(lean(one)).toBeGreaterThan(GRAIN.band);
    expect(lean(two)).toBeLessThan(-GRAIN.band);
    expect(score(one, EVEN, { scale: 'restrained' })).toBeGreaterThan(score(one, EVEN, { scale: 'expansive' }));
    expect(score(two, EVEN, { scale: 'expansive' })).toBeGreaterThan(score(two, EVEN, { scale: 'restrained' }));
  });

  it('reads the genre’s register, and the scene can still say otherwise: Nordic noir’s and melodrama’s scales differ for an even actor', () => {
    const noir = BRIEF_BY_ID['brief-nordic_noir']!;
    const melo = BRIEF_BY_ID['brief-melodrama']!;
    expect(suit(noir, 'restrained').signals.some((g) => g.source.startsWith('Nordic Noir’s Feeling Held In') && g.v > 0)).toBe(true);
    expect(suit(noir, 'restrained').band).toBe('suits');
    expect(suit(melo, 'expansive').band).toBe('suits');
    const gap = (b: Brief) => score(b, EVEN, { scale: 'restrained' }) - score(b, EVEN, { scale: 'expansive' });
    expect(gap(noir)).toBeGreaterThan(1);
    expect(gap(melo)).toBeLessThan(-0.5);
    // Taken out, the interaction is gone: the same actor's two sides come within a tenth in both.
    off(() => { expect(Math.abs(gap(noir))).toBeLessThanOrEqual(0.1); expect(Math.abs(gap(melo))).toBeLessThanOrEqual(0.1); });
  });

  it('reads the reading taken: a reading that leans the way a side does makes that side suit the scene better', () => {
    const b = BRIEF_BY_ID['brief-docudrama-2']!;
    const [a, z] = [b.readings.find((r) => r.id === 'delegate')!, b.readings.find((r) => r.id === 'door')!];
    const lean = (r: string) => suit(b, 'set', r).s - suit(b, 'open', r).s;
    expect(lean(a.id)).toBeGreaterThan(0);
    expect(lean(z.id)).toBeLessThan(0);
    const gap = (r: string) => score(b, EVEN, { structure: 'set' }, { reading: r }) - score(b, EVEN, { structure: 'open' }, { reading: r });
    expect(gap(a.id)).toBeGreaterThan(gap(z.id) + 0.5);
  });

  it('keeps skill and suitability apart: a specialist in what expansive draws on can still do better against the grain', () => {
    const realism = BRIEF_BY_ID['brief-social_realism']!;
    expect(suit(realism, 'restrained').s).toBeGreaterThan(suit(realism, 'expansive').s);
    // The even actor follows the scene; the specialist's own strength narrows it.
    const evenGap = score(realism, EVEN, { scale: 'restrained' }) - score(realism, EVEN, { scale: 'expansive' });
    const specGap = score(realism, EXPANSIVE_SPECIALIST, { scale: 'restrained' }) - score(realism, EXPANSIVE_SPECIALIST, { scale: 'expansive' });
    expect(evenGap).toBeGreaterThan(0);
    expect(specGap).toBeLessThan(evenGap);
    // Across the catalog, somewhere the specialist's expansive wins where restrained suits more.
    const wins = BRIEFS.filter((b) => !misfitOf('scale', 'expansive', briefMaterial(b)) && !misfitOf('scale', 'restrained', briefMaterial(b)) && suit(b, 'restrained').s > suit(b, 'expansive').s)
      .filter((b) => score(b, EXPANSIVE_SPECIALIST, { scale: 'expansive' }) > score(b, EXPANSIVE_SPECIALIST, { scale: 'restrained' })).length;
    expect(wins).toBeGreaterThan(10);
  });

  it('separates in the result what the side’s suitability came to from what the abilities cost, and says which', () => {
    const noir = BRIEF_BY_ID['brief-nordic_noir']!;
    const withIt = judgeIt(noir, EVEN, { scale: 'restrained' });
    const against = judgeIt(noir, EVEN, { scale: 'expansive' });
    const gw = grainRead(withIt)!, ga = grainRead(against)!;
    expect(gw.points).toBeGreaterThan(0);
    expect(ga.points).toBeLessThan(0);
    expect(gw.on.map((x) => x.dimension)).toContain('believability' as Dimension);
    expect(ga.on.map((x) => x.dimension)).toContain('connection' as Dimension);
    expect(against.limits.some((l) => l.kind === 'suitability' && l.dimension === 'connection')).toBe(true);
    expect(withIt.limits.some((l) => l.kind === 'suitability')).toBe(false);
    expect(grainWords(gw)).toMatch(/^The way you played it suited the scene \(Restrained, Suits The Scene\) and added [\d.]+ points to the take/);
    expect(grainWords(ga)).toMatch(/worked against the scene \(Expansive, Works Against The Scene\) and cost the take [\d.]+ points/);
    // The ability cost is the same arithmetic with or without the grain's: it's what the craft held back.
    expect(gw.ability).toBeGreaterThan(0);
    // An actor weak only in presence, on the side that suits: the chief limit is presence, and nothing about the grain.
    const weak = judgeIt(BRIEF_BY_ID['brief-melodrama']!, act({ presence: 20 }, 90), { scale: 'expansive' });
    expect(chiefLimit(weak)).toMatch(/^Your Presence held back/);
  });

  it('asks a choice against the grain to be rehearsed in further than one with it, and reads it so', () => {
    const noir = BRIEF_BY_ID['brief-nordic_noir']!;
    const withIt = requiredFor(['restrained'], briefMaterial(noir), sceneOf(noir, readingOf(noir, noir.readings[0]!.id)));
    const against = requiredFor(['expansive'], briefMaterial(noir), sceneOf(noir, readingOf(noir, noir.readings[0]!.id)));
    expect(withIt).toBeLessThan(PLAYING.complete);
    expect(against).toBeGreaterThan(PLAYING.complete);
    // Rehearsed in to between the two: complete for the side with the grain, not for the one against it.
    const at = (withIt + against) / 2;
    const prepLimit = (sides: Sides) => judgeIt(noir, EVEN, sides, { approach: at }).limits.some((l) => l.kind === 'preparation' && l.what === 'approach');
    expect(prepLimit({ scale: 'restrained' })).toBe(false);
    expect(prepLimit({ scale: 'expansive' })).toBe(true);
  });

  it('reaches every dimension a side leans on, by how far it leans there: expansive’s execution gets a fifth of its connection’s', () => {
    // From 2026-10-16, later (i3-review.md): until then only a dimension leant 1.1 or more, and expansive's execution
    // (1.05), the voice and the body sized to the house, never met the scene's grain.
    const b = BRIEFS.find((x) => x.medium === 'voice' && Math.abs(suitabilityOf('expansive', briefMaterial(x), sceneOf(x)).s) >= 0.3)!;
    expect(b).toBeDefined();
    const task = Object.values(TASK_PROFILES).find((t) => t.dims.connection && t.dims.execution)!;
    const { grain } = grainOf(task, ['expansive'], briefMaterial(b), sceneOf(b));
    const lean = APPROACH_EFFECT.expansive.lean;
    const share = (lean.execution! - 1) / (lean.connection! - 1);
    expect(share).toBeCloseTo(0.2, 5);
    expect(grain.execution).toBeDefined();
    expect(Math.sign(grain.execution!.d)).toBe(Math.sign(grain.connection!.d));
    expect(Math.abs(grain.execution!.d - grain.connection!.d * share)).toBeLessThanOrEqual(0.01);
  });

  it('keeps a result with its grain, and works it out again the same', () => {
    const noir = BRIEF_BY_ID['brief-nordic_noir']!;
    const ctx = briefContext(nobody, noir, rec(0.8), { reading: noir.readings[0]!.id, playing: { scale: 'expansive', chosenAt: 0, prep: 0.8 }, prep: { genre: 0.7, approach: 0.8 } });
    const e = judgePiece('seed-x', EVEN, { ...ctx, condition: { readiness: 90 }, key: 'k1' }, briefPiece(noir, { ...rec(0.8), reading: noir.readings[0]!.id }, noir.readings[0]!.id));
    expect(e.inputs.grain).toBeDefined();
    const again = replay({ inputs: { ...e.inputs, levels: e.inputs.levels ?? {}, fulls: e.inputs.fulls ?? {}, seed: 'seed-x' }, task: e.task, ruleset: e.ruleset }, TASK_PROFILES[e.task]!);
    expect(again!.overall).toBe(e.overall);
    // A result kept under the rules before the grain isn't worked out again by today's judge.
    expect(replay({ inputs: { ...e.inputs, seed: 'seed-x' }, task: e.task, ruleset: 'evaluation-4 (2026-10-16)' }, TASK_PROFILES[e.task]!)).toBeUndefined();
  });
});
