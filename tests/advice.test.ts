/**
 * What To Improve Next, forecast (from 2026-10-16, `systems/advice.ts`): what training each input would be worth, worked
 * out again from the recent work with the player as they are now, against what held a take back most. The catalog-wide
 * measure is tools/advice.ts (docs/verification/advice-2026-10-16/criteria.md): 40 played cases, the advice's first the
 * largest realized gain in all 40. The cases below are each one claim, and the played one is checked against what the
 * training actually brought, not against the forecast.
 */
import { describe, expect, it } from 'vitest';
import { BRIEF_BY_ID } from '@/engine/content/briefs';
import type { Person } from '@/engine/domain/model';
import { briefContext, briefPiece, type BriefRecord } from '@/engine/systems/briefs';
import { chiefLimit, type Performer, type WorkRecord } from '@/engine/systems/evaluation';
import { judgePiece } from '@/engine/systems/piece';
import { ADVICE, forecastFor, levelAfter, tied, trainingForecast } from '@/engine/systems/advice';
import { adviceFor } from '@/engine/systems/next-steps';
import { serialise } from '@/engine/persistence/adapter';
import { recommendations } from '@/engine/systems/experience';
import { matchedTier } from '@/engine/systems/practice';
import { realize, setUp } from '../tools/advice-harness';

const nobody = { engagement: { byGenre: {} } } as unknown as Person;
const rec = (p: number): BriefRecord => ({ prep: { interpretation: p, memorization: p, rehearsal: p }, takes: [] });
const act = (ab: Record<string, number>, fill: number): Performer => ({ ability: (id) => ab[id] ?? fill, full: () => 100, technique: () => 50 });
/** A brief taped by a performer, kept as the history keeps it. */
function kept(id: string, p: Performer, at: number): WorkRecord {
  const b = BRIEF_BY_ID[id]!;
  const reading = b.readings[0]!.id;
  const ctx = briefContext(nobody, b, rec(1), { reading, prep: { genre: 1 } });
  const e = judgePiece('advice', p, { ...ctx, condition: { readiness: 100 }, key: `a:${id}:${at}` }, briefPiece(b, { ...rec(1), reading }, reading));
  return { at, task: e.task, taskLabel: e.taskLabel, what: b.title, overall: e.overall, dims: {}, mastery: e.mastery, limits: e.limits.slice(0, 3), ruleset: e.ruleset, inputs: e.inputs };
}
const first = (m: Map<string, { points: number }>) => [...m].sort((a, b) => b[1].points - a[1].points)[0]![0];

describe('what to improve next, forecast', () => {
  it('follows the growth curve’s diminishing returns: the same hours move a low level further than a high one', () => {
    const low = levelAfter(40, 100, ADVICE.sessions, 50, false) - 40;
    const high = levelAfter(85, 100, ADVICE.sessions, 50, false) - 85;
    expect(low).toBeGreaterThan(high * 1.5);
    expect(levelAfter(99.9, 100, ADVICE.sessions, 50, false)).toBeLessThanOrEqual(100);
  });

  it('can name what the take’s chief limit isn’t: an input read across dimensions, worth more trained, comes first', () => {
    // An actor weak in emotional depth and in imagination alike; the take's first limit is emotional depth's one
    // dimension, and imagination, read across more of the work, is forecast to pay more.
    const p = act({ emotionalDepth: 40, imagination: 40 }, 60);
    const work = ['brief-alternate_history', 'brief-time_travel', 'brief-fantasy'].map((id, i) => kept(id, p, i));
    const chief = work.at(-1)!.limits.find((l) => l.kind === 'ability')!.what;
    const f = forecastFor(p, work);
    expect(f.size).toBeGreaterThan(5);
    const best = first(f);
    expect(best).not.toBe(chief);
    // Every input the work read is a candidate, not only the three costliest limits a piece keeps.
    const named = new Set(work.flatMap((w) => w.limits.map((l) => l.what)));
    expect([...f.keys()].some((k) => !named.has(k))).toBe(true);
  });

  it('moves on as the player does: an input at full isn’t advised, and the next is', () => {
    const p = act({ composure: 35 }, 60);
    const work = ['brief-nordic_noir', 'brief-espionage', 'brief-heist'].map((id, i) => kept(id, p, i));
    const was = first(forecastFor(p, work));
    const grown: Performer = { ...p, ability: (id) => (id === was ? 100 : p.ability(id)) };
    const now = forecastFor(grown, work);
    expect(now.has(was)).toBe(false);
    expect(first(now)).not.toBe(was);
  });

  it('says a near-tie is one, and doesn’t name a winner by a tenth', () => {
    expect(tied(0.5, 0.45)).toBe(true);
    expect(tied(2, 1.85)).toBe(true);
    expect(tied(2, 1.5)).toBe(false);
    const level = () => 50;
    const f = new Map([['presence', { points: 0.82, from: 50, to: 55, hours: 20, pieces: 3 }], ['focus', { points: 0.8, from: 50, to: 55, hours: 20, pieces: 3 }], ['memory', { points: 0.3, from: 50, to: 55, hours: 20, pieces: 3 }]]);
    const rs = recommendations(level, () => 100, [], (id) => ({ id: `ex-${id}` }), matchedTier, 12, undefined, undefined, f);
    expect(rs[0]!.target).toBe('presence');
    expect(rs[0]!.tiedWith).toEqual(['Focus']);
    expect(rs[0]!.why).toContain('About as useful: Focus. Either is a sound next step.');
  });

  it('PLAYER JOURNEY: advises what twenty days of training actually pays most for, leaves the save as it was, and says the same twice', () => {
    // adv-2 of the played measure: three briefs taped through the commands; the take's chief limit was emotional depth.
    const { sim, briefs } = setUp('adv-2');
    const before = serialise(sim.universe);
    const advice = adviceFor(sim, sim.player);
    expect(serialise(sim.universe)).toBe(before);
    expect(adviceFor(sim, sim.player)).toEqual(advice);
    const top = advice.find((x) => x.forecast)!;
    const chief = sim.player.work!.at(-1)!.limits.find((l) => l.kind === 'ability' || l.kind === 'technique')!.what;
    expect(chiefLimit(sim.player.work!.at(-1)!)).toBeDefined();
    expect(top.target).not.toBe(chief);
    // Played: the advised input's twenty days against the chief limit's, each against a copy that lived the same days.
    const got = realize(sim, briefs, [top.target, chief]);
    expect(got[top.target]!).toBeGreaterThan(got[chief]! + 0.1);
    // The forecast said so before the days were played.
    const f = trainingForecast(sim, sim.player);
    expect(f.get(top.target)!.points).toBeGreaterThan(f.get(chief)!.points);
  }, 120_000);
});
