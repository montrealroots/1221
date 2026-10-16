/**
 * What To Improve Next, followed through the game's commands (brief 10, 2026-10-16; F2-A10,
 * docs/verification/decisions-2026-10-16/criteria.md section 2). docs/verification/remaining-10/advice-checklist.json is
 * the list, written before any change; advice-result.json is what came of it; tools/advice.ts is the catalog-wide
 * measure, its tuning cases (adv-0 to 9, adv-t-0 to 19) apart from its held-out ones (adv-10 to 39, adv-h-0 to 119).
 *
 * Every case here is a tuning case, built by tools/advice-harness.ts as the measure builds it: a student created through
 * `createSave`, abilities and techniques drawn within a band (TEST SETUP), takes taped through brief.choose,
 * brief.prepare, genre.study and practice.self_tape. No held-out seed is played here. What the advice is said to bring is
 * checked against what twenty sessions of `practice.exercise` brought a copy of the save, against a copy that lived the
 * same days without them, or against the records and the judge's own replay (`replayAs`), never against the advice's own
 * helper. A judged figure is never written as a literal: the judge and the stamina areas change what a take comes to.
 *
 * Changed on 2026-10-16 for brief 10, each found on the tuning cases (`systems/advice.ts` says how): the hours grown as the
 * engine grows them, discipline kept once a day and said apart; each replay at full precision; knowing the genre read as
 * it's known now; a take its own preparation held back most read as prepared; the forecast's order kept by the forecast;
 * and everything at full said.
 */
import { describe, expect, it } from 'vitest';
import { MASTERED, TECHNIQUES, type AbilityId } from '@/engine/content/abilities';
import { BRIEF_BY_ID } from '@/engine/content/briefs';
import { exerciseFor } from '@/engine/content/practice';
import type { Simulation } from '@/engine/core/simulation';
import type { WorkRecord } from '@/engine/systems/evaluation';
import { ADVICE, trainingForecast, trained, type Forecast } from '@/engine/systems/advice';
import { abilityFull, abilityOf, isAbility, levelOf } from '@/engine/systems/attributes';
import { atFull } from '@/engine/systems/briefs';
import { recommendations } from '@/engine/systems/experience';
import { adviceFor } from '@/engine/systems/next-steps';
import { matchedTier } from '@/engine/systems/practice';
import { buildCase, caseOf, clone, f2aCase, go, live, setLevel, worthOf, type Take } from '../tools/advice-harness';

/** A tuning case, as the measure builds it. */
function tuning(seed: string): { sim: Simulation; takes: Take[] } {
  const spec = caseOf(seed)!;
  expect(spec.set).toBe('tuning');
  return spec.design === 'F2-A' ? f2aCase(seed) : buildCase(seed, spec.band!, spec.stage!);
}
const firstOf = (sim: Simulation) => adviceFor(sim, sim.player).find((x) => x.forecast)!;
const exact = (f: Forecast | undefined) => f?.exact ?? f?.points ?? 0;
/** What twenty sessions of an input's exercise brought, played: a copy that trained it against one that lived the same days. */
function realized(sim: Simulation, takes: Take[], id: string): { gain: number; copy: Simulation } {
  const base = clone(sim);
  live(base, undefined);
  const copy = clone(sim);
  live(copy, id);
  return { gain: worthOf(copy, takes) - worthOf(base, takes), copy };
}
/** The inputs a piece read, from its record. */
const reads = (w: WorkRecord, id: string) => (isAbility(id as never) ? w.inputs.abilities[id as AbilityId] !== undefined : (w.inputs.techniques[id as never] ?? 0) > 0);

describe('F2-A10: What To Improve Next, followed through the commands (brief 10)', () => {
  it('PLAYER JOURNEY: followed for twenty sessions through practice.exercise, the advised input brings what it forecast, within 0.3 points or a quarter, from a beginner to near mastery', () => {
    // adv-0, F2-A's own; adv-t-0, a beginner a take in; adv-t-15, near mastery a take in.
    for (const seed of ['adv-0', 'adv-t-0', 'adv-t-15']) {
      const { sim, takes } = tuning(seed);
      const first = firstOf(sim);
      const said = exact(first.forecast);
      const { gain } = realized(sim, takes, first.target);
      expect(gain, seed).toBeGreaterThan(0);
      expect(Math.abs(said - gain), `${seed} ${first.target}: forecast ${said}, realized ${gain}`).toBeLessThanOrEqual(Math.max(0.3, 0.25 * Math.abs(gain)));
    }
  }, 240_000);

  it('PLAYER JOURNEY: once followed, it moves on: the trained input’s forecast falls, and with another’s now ahead, another is named first', () => {
    const { sim, takes } = tuning('adv-0');
    const first = firstOf(sim);
    const { copy } = realized(sim, takes, first.target);
    const after = trainingForecast(copy, copy.player);
    expect(exact(after.get(first.target))).toBeLessThan(exact(first.forecast));
    const ahead = [...after].filter(([k, f]) => k !== first.target && exact(f) > exact(after.get(first.target)));
    // Played, not assumed: twenty sessions of it put another's forecast ahead here.
    expect(ahead.length).toBeGreaterThan(0);
    expect(firstOf(copy).target).not.toBe(first.target);
    expect(ahead.map(([k]) => k)).toContain(firstOf(copy).target);
  }, 240_000);

  it('grows the twenty sessions as the engine grows them: the discipline a played copy keeps is the forecast’s to the last digit, and what the days bring is said apart, nothing at full discipline', () => {
    const { sim } = tuning('adv-t-4');
    const first = firstOf(sim);
    const copy = clone(sim);
    live(copy, first.target);
    // The scratch copy the forecast grows (`trained`) and twenty days of the exercise played: the same discipline.
    expect(abilityOf(sim, trained(sim, sim.player, first.target as AbilityId), 'discipline')).toBe(abilityOf(copy, copy.player, 'discipline'));
    expect(abilityOf(copy, copy.player, 'discipline')).toBeGreaterThan(abilityOf(sim, sim.player, 'discipline'));
    expect(first.forecast!.days!).toBeGreaterThan(0);
    expect(first.why).toContain(`of it is the discipline ${ADVICE.sessions} days of practice keep`);
    // The falsifiability test: at full discipline (TEST SETUP) the days bring nothing more, and the words don't say they do.
    const full = clone(sim);
    setLevel(full, 'discipline', 'full');
    const atFullDiscipline = adviceFor(full, full.player).find((x) => x.forecast)!;
    expect(atFullDiscipline.forecast!.days).toBe(0);
    expect(atFullDiscipline.why).not.toContain('of it is the discipline');
  }, 240_000);

  it('names no input at full, and where everything an exercise trains is at full, says so first, with what no exercise trains', () => {
    const { sim } = tuning('adv-t-3');
    const level = (s: Simulation, id: string) => levelOf(s, s.player, id as never);
    const fullOf = (s: Simulation, id: string) => (isAbility(id as never) ? abilityFull(s, s.player, id as AbilityId) : 100);
    for (const r of adviceFor(sim, sim.player).filter((x) => x.exercise)) {
      expect(atFull(level(sim, r.target), r.target, fullOf(sim, r.target)), r.target).toBe(false);
      expect(exerciseFor(r.target as never)).toBeDefined();
    }
    // TEST SETUP: every ability the recent work read at full but stamina, every technique it read at 92, past MASTERED.
    const work = (sim.player.work ?? []).slice(-12);
    const read = [...new Set(work.flatMap((w) => [...Object.keys(w.inputs.abilities), ...Object.entries(w.inputs.techniques).filter(([, x]) => (x ?? 0) > 0).map(([k]) => k)]))];
    const all = clone(sim);
    for (const id of read) if (id !== 'stamina') setLevel(all, id, TECHNIQUES.includes(id as never) ? MASTERED + 2 : 'full');
    setLevel(all, 'stamina', 60);
    const advice = adviceFor(all, all.player);
    expect(advice[0]!.target).toBe('full:all');
    expect(advice.filter((x) => x.exercise)).toEqual([]);
    expect(advice[0]!.why).toContain('Every ability and technique your recent work read that an exercise trains is at its full');
    expect(advice[0]!.why).toContain('stamina isn’t, and no exercise trains it: workouts build it');
    // The falsifiability test: one ability the work read brought back under full, and it's named again, not the statement.
    const some = clone(all);
    const back = read.find((id) => isAbility(id as never) && exerciseFor(id as never))!;
    setLevel(some, back, 70);
    const again = adviceFor(some, some.player);
    expect(again.some((x) => x.target === 'full:all')).toBe(false);
    expect(again.find((x) => x.exercise)?.target).toBe(back);
  }, 240_000);

  it('says why: each recommendation’s figure, how many of the last pieces read it, and the piece it gains most on, by the records', () => {
    const { sim } = tuning('adv-t-8');
    const latest = [...(sim.player.work ?? [])].sort((a, b) => a.at - b.at).slice(-ADVICE.recent);
    const training = adviceFor(sim, sim.player).filter((x) => x.forecast);
    expect(training.length).toBeGreaterThan(1);
    for (const r of training) {
      const f = r.forecast!;
      const n = latest.filter((w) => reads(w, r.target)).length;
      expect(f.pieces, r.target).toBe(n);
      expect(f.of).toBe(latest.length);
      expect(r.why).toContain(`worth about ${r.points} point`);
      expect(r.why).toContain(`(${n} of your last ${latest.length} pieces read it; it gains most on ${f.most!.what}`);
      expect(latest.filter((w) => reads(w, r.target)).map((w) => w.what)).toContain(f.most!.what);
    }
  }, 240_000);

  it('reads a take its own preparation held back most as prepared, and knowing the genre as it’s known today', () => {
    // adv-t-15, near mastery, and then The Spare Key taped cold: its rehearsal held it back most.
    const { sim } = tuning('adv-t-15');
    const b = BRIEF_BY_ID['brief-drama']!;
    go(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id });
    expect(go(sim, 'practice.self_tape', { genre: b.kinds[0], brief: b.id }).ok).toBe(true);
    const cold = sim.player.work!.at(-1)!;
    expect(cold.limits[0]!.kind).toBe('preparation');
    expect(cold.limits[0]!.what).not.toBe('genre');
    const f = trainingForecast(sim, sim.player);
    // The same work with that take's own steps complete, by hand: the forecast is the same.
    const done = sim.player.work!.map((w) => (w !== cold ? w : { ...w, inputs: { ...w.inputs, prep: Object.fromEntries(Object.entries(w.inputs.prep).map(([k, x]) => [k, k === 'genre' ? x : 1])) } }));
    const prepared = trainingForecast(sim, sim.player, done);
    for (const [k, x] of f) expect(Math.abs(exact(x) - exact(prepared.get(k))), k).toBeLessThan(1e-12);
    // How many of the recent pieces its own preparation held back most, counted from the records: the cold take among them.
    const own = sim.player.work!.slice(-ADVICE.recent).filter((w) => w.limits[0]?.kind === 'preparation' && w.limits[0].what !== 'genre').length;
    expect(own).toBeGreaterThanOrEqual(1);
    expect([...f.values()][0]!.prepared).toBe(own);
    expect(firstOf(sim).why).toContain(own === 1 ? 'the piece its own preparation held back most is read as prepared' : `the ${own} pieces its own preparation held back most are read as prepared`);
    // Knowing the genre as it's known today: the genre studied again, and the forecast moves with it.
    const studied = clone(sim);
    expect(go(studied, 'genre.study', { genre: b.kinds[0] }).ok).toBe(true);
    const after = trainingForecast(studied, studied.player);
    expect([...after].some(([k, x]) => Math.abs(exact(x) - exact(f.get(k))) > 1e-9)).toBe(true);
    // The falsifiability test: a beginner's cold take, held back most by an ability, is read as it was.
    const beginner = tuning('adv-t-4').sim;
    go(beginner, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id });
    go(beginner, 'practice.self_tape', { genre: b.kinds[0], brief: b.id });
    const held = beginner.player.work!.at(-1)!;
    expect(held.limits[0]!.kind).toBe('ability');
    const asWas = trainingForecast(beginner, beginner.player);
    const filled = trainingForecast(beginner, beginner.player, beginner.player.work!.map((w) => (w !== held ? w : { ...w, inputs: { ...w.inputs, prep: Object.fromEntries(Object.keys(w.inputs.prep).map((k) => [k, k === 'genre' ? w.inputs.prep[k]! : 1])) } })));
    expect([...asWas].some(([k, x]) => Math.abs(exact(x) - exact(filled.get(k))) > 1e-9)).toBe(true);
  }, 240_000);

  it('near mastery, an input’s forecast falls as its level rises, at full precision', () => {
    const { sim } = tuning('adv-t-19');
    const id = firstOf(sim).target;
    const from = levelOf(sim, sim.player, id as never);
    const to = isAbility(id as never) ? abilityFull(sim, sim.player, id as AbilityId) : MASTERED;
    const ladder = [0, 1, 2].map((k) => { const x = clone(sim); setLevel(x, id, from + ((to - from) * k) / 3); return exact(trainingForecast(x, x.player).get(id)); });
    expect(ladder[1]!).toBeLessThan(ladder[0]!);
    expect(ladder[2]!).toBeLessThan(ladder[1]!);
  }, 240_000);

  it('keeps the forecast’s order: the weakness the work keeps coming back to is said where its forecast puts it, never ahead of a higher one', () => {
    // FIXTURE: forecasts given, focus the recurring weakness and about as useful as presence, a hundredth under it.
    const f = (exact: number): Forecast => ({ points: Math.round(exact * 100) / 100, exact, own: exact, days: 0, from: 50, to: 55, hours: 20, pieces: 3, of: 3 });
    const map = new Map([['presence', f(0.82)], ['focus', f(0.81)], ['memory', f(0.3)]]);
    const recurring = { target: 'focus', label: 'Focus', pieces: 9, whole: 12, last: 0, evidence: ['An ability, 12 points in all'] };
    const rs = recommendations(() => 50, () => 100, [], (id) => ({ id: `ex-${id}` }), matchedTier, 12, undefined, recurring, map);
    expect(rs.map((r) => r.target)).toEqual(['presence', 'focus', 'memory']);
    expect(rs[1]!.why).toContain('Your work keeps coming back to it: it’s held back 9 of your pieces for life');
    expect(rs[0]!.tiedWith).toEqual(['Focus']);
    // The falsifiability test: ahead of presence by its forecast, it's first.
    const ahead = recommendations(() => 50, () => 100, [], (id) => ({ id: `ex-${id}` }), matchedTier, 12, undefined, recurring, new Map([...map, ['focus', f(0.83)]]));
    expect(ahead[0]!.target).toBe('focus');
  });

  it('passes the floor on the input’s own share: the discipline twenty days keep isn’t advice to train what moves nothing', () => {
    // FIXTURE: two forecasts, each with 0.2 of discipline from the days; memory's own share is under a tenth.
    const f = (own: number): Forecast => ({ points: Math.round((own + 0.2) * 100) / 100, exact: own + 0.2, own, days: 0.2, from: 50, to: 55, hours: 20, pieces: 3, of: 3 });
    const rs = recommendations(() => 50, () => 100, [], (id) => ({ id: `ex-${id}` }), matchedTier, 12, undefined, undefined, new Map([['presence', f(0.5)], ['memory', f(0.05)]]));
    expect(rs.map((r) => r.target)).toEqual(['presence']);
    expect(rs[0]!.points).toBe(0.7);
  });

  it('reads no seed: the case renamed, its save’s seed and every piece’s, gets the same advice', () => {
    const { sim } = tuning('adv-t-4');
    const advice = adviceFor(sim, sim.player);
    const renamed = clone(sim);
    renamed.universe.meta.seed = 'another-name';
    for (const w of renamed.player.work ?? []) w.inputs.seed = 'another-name';
    expect(adviceFor(renamed, renamed.player)).toEqual(advice);
    expect(advice.some((x) => x.forecast)).toBe(true);
  }, 240_000);
});
