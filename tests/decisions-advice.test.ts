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
 *
 * Added on 2026-10-17 for brief 11 (docs/verification/completion-2026-10-16/clarifications.md, written first): L1 on a
 * player who ignores the advice and one who follows it, through the commands and across a save and a load; F2-A10 (f)
 * and (h) as clarified (preparation's figure apart from training's, diminishing returns where the progression model
 * gives them, a small rise explained by discipline's lift); and the harness itself (its seeds apart, its bands and
 * stages, a case built through the commands, a take that waits out a hospital stay). Still tuning seeds only: no test
 * builds or reads a held-out case.
 *
 * Added later on 2026-10-17 for brief 12 (docs/verification/resolution-2026-10-17/advice-criteria.md, written first): (f)
 * and (h) as the owner resolved them, F1 to F6 and H1 to H6, on the players the owner named (who follows the advice,
 * ignores it, follows it in part, changes their work and reaches mastery), each through the commands and across a save and
 * a load; the detectors made to fire; and the fresh validation set, adv-v-0 to 119, read from the case list alone. No test
 * builds a fresh case or a held-out one; the held-out set is regression coverage from brief 12.
 */
import { describe, expect, it, vi } from 'vitest';
import { spawnSync } from 'node:child_process';
import { existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { MASTERED, TECHNIQUES, type AbilityId } from '@/engine/content/abilities';
import { BRIEFS, BRIEF_BY_ID } from '@/engine/content/briefs';
import { EXERCISE_BY_ID, PRACTICE, exerciseFor } from '@/engine/content/practice';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, formatDate } from '@/engine/core/time';
import { TASK_PROFILES } from '@/engine/content/tasks';
import { performerOf, replayAs, type WorkRecord } from '@/engine/systems/evaluation';
import { ADVICE, assumedOf, forecastAtDiscipline, forecastChange, genreNow, trainingForecast, trained, type Forecast } from '@/engine/systems/advice';
import { abilityFull, abilityOf, isAbility, levelOf } from '@/engine/systems/attributes';
import { atFull } from '@/engine/systems/briefs';
import { recommendations } from '@/engine/systems/experience';
import { careFor, inHospital } from '@/engine/systems/health';
import { adviceFor, attentionOf } from '@/engine/systems/next-steps';
import { matchedTier, practicedToday } from '@/engine/systems/practice';
import { BANDS, BAND_ORDER, GENRES, INPUTS, PART_WORDS, SET_LABEL, SET_ROLE, STAGES, STAGE_ORDER, assumedByRecords, attentionByRecords, buildCase, caseOf, casesOf, changesOf, clone, f2aCase, forecastByRecords, go, growthLadder, heldOutRefusal, isFull, likeForLike, live, preparationByRecords, preparedCopy, readWork, rest, setLevel, staleOf, tapeWaiting, worthOf, type Take } from '../tools/advice-harness';

// The screens, drawn over a real save under the game's context, as tests/defects-r8-1.test.ts draws them.
const h = vi.hoisted(() => ({ sim: undefined as unknown as import('@/engine/core/simulation').Simulation }));
vi.mock('@/app/game-context', () => {
  const noop = () => undefined;
  const game = () => new Proxy({ get sim() { return h.sim; }, version: 0, run: (kind: string, payload: Record<string, unknown> = {}) => h.sim.execute({ kind, payload }), toast: noop } as Record<string, unknown>, { get: (t, k) => (k in t ? t[k as string] : noop) });
  return { useGame: () => game(), useWorld: <T,>(read: (s: Simulation) => T) => read(h.sim) };
});
const { ProfileWorkspace } = await import('@/ui/workspaces/ProfileWorkspace');
const { BriefPane } = await import('@/ui/components/BriefPane');
const unescape = (x: string) => x.replace(/&#x27;/g, '\'').replace(/&quot;/g, '"').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&amp;/g, '&');
/** The Player Profile as drawn, its text as read. */
const profileText = (sim: Simulation) => { h.sim = sim; return unescape(renderToStaticMarkup(createElement(ProfileWorkspace))); };
/** A brief's pane as drawn (as tests/defects-r8-1.test.ts draws it), its text as read. */
const paneText = (sim: Simulation, brief: string) => { h.sim = sim; return unescape(renderToStaticMarkup(createElement(BriefPane, { genre: BRIEF_BY_ID[brief]!.kinds[0]!, brief, onOpen: () => undefined, practice: (id: string) => createElement('span', { 'data-practice': id }) }))); };

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
    expect(first.why).toContain(`of it is the discipline ${ADVICE.sessions} days of practice build`);
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
    expect(advice[0]!.why).toContain('Every ability and technique your recent work called on that an exercise trains is at its full');
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
      expect(r.why).toContain(`(${n} of your last ${latest.length} pieces call on it; ${f.most!.what} would gain most`);
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
    expect(firstOf(sim).why).toContain(own === 1 ? 'It counts the piece held back most by its own preparation as fully prepared.' : `It counts the ${own} pieces held back most by their own preparation as fully prepared.`);
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
    expect(rs[1]!.why).toContain('Your work keeps coming back to it: it has held back 9 of your pieces in all');
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

/** A brief not yet taped, its genre next in the 149's order: chosen, prepared two rounds, its genre studied once, taped, through the commands. */
function tapeNew(sim: Simulation): void {
  const taped = new Set(Object.keys(sim.player.briefs ?? {}).filter((id) => (sim.player.briefs![id]!.takes.length ?? 0) > 0));
  const b = GENRES.map((g) => BRIEFS.find((x) => x.kinds[0] === g && !taped.has(x.id))).find(Boolean)!;
  go(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id });
  for (let i = 0; i < 2; i += 1) for (const step of ['read', 'lines', 'rehearse']) go(sim, 'brief.prepare', { brief: b.id, step });
  go(sim, 'genre.study', { genre: b.kinds[0] });
  const r = go(sim, 'practice.self_tape', { genre: b.kinds[0], brief: b.id });
  expect(r.ok, r.error).toBe(true);
}
/** The forecast every training recommendation is ranked by, at full precision, for the inputs that pass the floor. */
const passing = (sim: Simulation) => [...trainingForecast(sim, sim.player)].filter(([, f]) => (f.own ?? exact(f)) >= 0.1);

describe('L1: repeated advice, for a player who ignores it and one who follows it (brief 11)', () => {
  it('PLAYER JOURNEY: ignored for five weeks of taping, it keeps the input that still brings most, and what it says changes each week with the player’s state, across a save and a load; followed from the same save for twenty sessions, it says what they brought', () => {
    // adv-t-5, developing, mid-term: then five weeks, two new briefs taped a week and no practice.
    let { sim } = tuning('adv-t-5');
    const weeks: { target: string; standing: string; next: string; pieces: number }[] = [];
    for (let week = 0; week < 5; week += 1) {
      for (const day of [2, 5]) { sim.advanceTo(sim.now + (day === 2 ? 2 : 3) * MS_DAY); tapeNew(sim); }
      sim.advanceTo(sim.now + 2 * MS_DAY);
      rest(sim);
      if (week === 2) {
        // A save and a load mid-way: the same advice, word for word.
        const said = adviceFor(sim, sim.player);
        sim = clone(sim);
        expect(adviceFor(sim, sim.player)).toEqual(said);
      }
      const first = firstOf(sim);
      // Never inferior advice: the first is the forecast's largest of what passes the floor, at full precision.
      for (const [k, f] of passing(sim)) expect(exact(f), `week ${week}: ${k}`).toBeLessThanOrEqual(exact(first.forecast) + 1e-12);
      const was = sim.player.experience!.advised!;
      expect(was.target).toBe(first.target);
      // What it says, worked from the records: since when, its level then and now, and the pieces since that it held back.
      const since = (sim.player.work ?? []).filter((w) => w.at >= was.since);
      const held = since.filter((w) => w.limits.some((l) => l.what === first.target));
      expect(first.standing).toContain(`It has come first since ${formatDate(was.since, sim.zone)}`);
      expect(first.standing).toContain(`Of the ${since.length} pieces you’ve done since, it held back ${held.length || 'none'}`);
      expect(first.standing).toContain(`You haven’t practiced ${EXERCISE_BY_ID[first.exercise!]!.label} since`);
      expect(first.next).toContain(`Next: ${EXERCISE_BY_ID[first.exercise!]!.label} at the`);
      expect(first.next).toContain(`An hour costs ${EXERCISE_BY_ID[first.exercise!]!.feet ? PRACTICE.energy.feet : PRACTICE.energy.desk} energy`);
      weeks.push({ target: first.target, standing: first.standing!, next: first.next!, pieces: since.length });
    }
    // Played, not assumed: one input stayed first all five weeks, which L1 as written allows four of (brief 10: 8 and 6).
    expect(new Set(weeks.map((w) => w.target)).size).toBe(1);
    // Each week says something the last didn't, because the player's state moved: two more pieces each week.
    for (let i = 1; i < weeks.length; i += 1) {
      expect(weeks[i]!.standing, `week ${i}`).not.toBe(weeks[i - 1]!.standing);
      expect(weeks[i]!.pieces).toBe(weeks[i - 1]!.pieces + 2);
    }
    // On the screen: the Player Profile says it, and the next hour.
    const text = profileText(sim);
    expect(text).toContain(weeks.at(-1)!.standing);
    expect(text).toContain(weeks.at(-1)!.next);
    // The player who follows it, from the same save: twenty sessions of its exercise, one a day, inside L1's four weeks.
    const target = weeks.at(-1)!.target;
    const from = levelOf(sim, sim.player, target as never);
    const fromForecast = exact(firstOf(sim).forecast);
    let follower = clone(sim);
    const start = follower.now;
    live(follower, target);
    expect(follower.now - start).toBeLessThan(28 * MS_DAY);
    follower = clone(follower);
    const after = firstOf(follower);
    const now = levelOf(follower, follower.player, target as never);
    // Played, not assumed: here it still brings most, so it stays first, and it rose by what the sessions brought,
    // which it says, with its forecast before them and now.
    expect(after.target).toBe(target);
    expect(now).toBeGreaterThan(from);
    const nowForecast = exact(after.forecast);
    expect(nowForecast).toBeLessThan(fromForecast);
    const ex = EXERCISE_BY_ID[after.exercise!]!;
    expect(after.standing).toContain(`you’ve put in ${ADVICE.sessions} hours of ${ex.label}: it went from ${Math.round(from * 10) / 10} to ${Math.round(now * 10) / 10}, and its forecast from ${fromForecast.toFixed(2)} to ${nowForecast.toFixed(2)}`);
    expect(after.standing).not.toBe(weeks.at(-1)!.standing);
    // Its forecast fell here, as the input's own should: nothing is said of a rise.
    expect(after.standing).not.toContain('a little up');
    // And the ignorer, the same five weeks on, never trained it: it says so.
    expect(weeks.at(-1)!.standing).toContain(`You haven’t practiced ${ex.label} since`);
    expect(adviceFor(clone(follower), follower.player)).toEqual(adviceFor(follower, follower.player));
  }, 240_000);

  it('PLAYER JOURNEY: followed, it moves on where another now brings more, saying what was first and how far it moved, across a save and a load; and where an hour can’t be had now, the next action says why', () => {
    // adv-0, F2-A's own: twenty sessions of the first-named, one a day, inside L1's four weeks.
    const { sim } = tuning('adv-0');
    const first = firstOf(sim);
    const from = levelOf(sim, sim.player, first.target as never);
    let copy = clone(sim);
    const start = copy.now;
    live(copy, first.target);
    expect(copy.now - start).toBeLessThan(28 * MS_DAY);
    copy = clone(copy);
    const after = firstOf(copy);
    const now = levelOf(copy, copy.player, first.target as never);
    const left = exact(trainingForecast(copy, copy.player).get(first.target));
    // Played, not assumed: another now brings more, and is named first, by the forecast's own order.
    expect(after.target).not.toBe(first.target);
    expect(exact(after.forecast)).toBeGreaterThan(left);
    expect(after.standing).toContain(`the first was ${first.label.toLowerCase()}`);
    expect(after.standing).toContain(`it has gone from ${Math.round(from * 10) / 10} to ${Math.round(now * 10) / 10}`);
    expect(after.standing).toContain(`to ${left.toFixed(2)} a piece, and ${after.label.toLowerCase()}’s forecast, ${exact(after.forecast).toFixed(2)}, is now the larger`);
    expect(adviceFor(clone(copy), copy.player)).toEqual(adviceFor(copy, copy.player));
    // The next action reads the hour's own refusal: with today's hours of practice used, it says why not now.
    const ex = EXERCISE_BY_ID[after.exercise!]!;
    expect(after.next).toContain(`Next: ${ex.label} at the`);
    expect(after.next).toContain('it would add about +');
    while (practicedToday(copy, copy.player) < PRACTICE.dailyHours) { copy.advanceTo(copy.now + 60 * 60_000); expect(go(copy, 'practice.exercise', { exercise: ex.id, focus: 'steady' }).ok).toBe(true); }
    const refused = firstOf(copy);
    expect(refused.next).toContain(`Not now: You’ve practiced ${PRACTICE.dailyHours} hours today`);
    expect(refused.next).not.toContain('it would add about +');
  }, 240_000);
});

describe('F2-A10 (f) and (h), as clarified (brief 11)', () => {
  it('PLAYER JOURNEY: separates preparation from training: what completing a take’s own preparation would bring is its own figure, in the forecast and on the screen, and never in training’s', () => {
    // adv-t-15, near mastery, and then The Spare Key taped cold: its rehearsal held it back most.
    const { sim } = tuning('adv-t-15');
    const b = BRIEF_BY_ID['brief-drama']!;
    go(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id });
    expect(go(sim, 'practice.self_tape', { genre: b.kinds[0], brief: b.id }).ok).toBe(true);
    rest(sim);
    const f = trainingForecast(sim, sim.player);
    // Worked from the records and the judge's own replay: each recent piece its own preparation held back most, as
    // prepared (its own steps complete, by hand, knowing the genre as it's known now) less as taped, weighted to the latest.
    const latest = [...sim.player.work!].filter((w) => TASK_PROFILES[w.task] && w.inputs.seed !== undefined).sort((x, y) => x.at - y.at).slice(-ADVICE.recent).map(genreNow(sim.player));
    const W = latest.reduce((t, _w, i) => t + (i + 1) / latest.length, 0);
    const me = performerOf(sim, sim.player);
    const judged = (w: WorkRecord) => { const e = replayAs(w, TASK_PROFILES[w.task]!, me)!; return e.exact ?? e.overall; };
    const own = latest.map((w, i) => ({ w, i })).filter(({ w }) => w.limits[0]?.kind === 'preparation' && w.limits[0].what !== 'genre');
    expect(own.length).toBeGreaterThanOrEqual(1);
    const expected = own.reduce((t, { w, i }) => t + ((judged({ ...w, inputs: { ...w.inputs, prep: Object.fromEntries(Object.entries(w.inputs.prep).map(([k, x]) => [k, k === 'genre' ? x : 1])) } }) - judged(w)) * (i + 1)) / latest.length / W, 0);
    expect(expected).toBeGreaterThan(0.05);
    for (const [k, x] of f) {
      expect(Math.abs(x.preparation! - expected), k).toBeLessThan(1e-9);
      // Never in training's: what's said is the input's own and the days' alone, on the same hours as every other input.
      expect(Math.abs(exact(x) - (x.own! + x.days!)), k).toBeLessThan(1e-12);
      expect(x.hours).toBe(ADVICE.sessions);
    }
    const first = firstOf(sim);
    const n = own.length;
    const words = `Apart from training, fully preparing ${n === 1 ? 'the piece' : `the ${n} pieces`} held back most by ${n === 1 ? 'its' : 'their'} own preparation would bring ${n === 1 ? 'it' : 'them'} about ${Math.round(expected * 100) / 100}`;
    expect(first.why).toContain(words);
    expect(first.why).toContain(`That’s preparation, not training, and it isn’t part of the ${first.points} above`);
    expect(profileText(sim)).toContain(words);
    // The falsifiability test: the same work with that take's own steps complete has no preparation to say.
    const cold = sim.player.work!.at(-1)!;
    const done = sim.player.work!.map((w) => (w !== cold ? w : { ...w, limits: w.limits.filter((l) => l.kind !== 'preparation'), inputs: { ...w.inputs, prep: Object.fromEntries(Object.entries(w.inputs.prep).map(([k, x]) => [k, k === 'genre' ? x : 1])) } }));
    const without = trainingForecast(sim, sim.player, done);
    const left = own.filter(({ w }) => w.inputs.key !== cold.inputs.key).length;
    for (const [k, x] of without) expect((x.prepared ?? 0), k).toBe(left);
  }, 240_000);

  it('PLAYER JOURNEY: on like-for-like hours, below three quarters of full twenty sessions bring less as the level rises and the forecast falls with them; from there to full they bring the same, played, and the forecast reads that constant rate', () => {
    // adv-t-1, developing, a take in: its first-named input at six levels (TEST SETUP), each copy playing the same twenty
    // sessions through practice.exercise.
    const { sim } = tuning('adv-t-1');
    const id = firstOf(sim).target;
    expect(isAbility(id as never)).toBe(true);
    const ex = exerciseFor(id as never)!;
    const rung = (level: number) => {
      const x = clone(sim);
      setLevel(x, id, level);
      const f = trainingForecast(x, x.player).get(id)!;
      // What the forecast's hours grow it by, at an ordinary day's focus (`trained`, the copy the forecast reads).
      const grown = levelOf(x, trained(x, x.player, id as AbilityId), id as never) - level;
      const before = x.player.experience?.exercises?.[ex.id]?.sessions ?? 0;
      live(x, id);
      expect((x.player.experience!.exercises[ex.id]!.sessions) - before).toBe(ADVICE.sessions);
      expect(f.hours).toBe(ADVICE.sessions);
      return { played: levelOf(x, x.player, id as never) - level, grown, forecast: exact(f) };
    };
    const below = [40, 55, 70].map(rung);
    const past = [76, 84, 92].map(rung);
    // Diminishing returns where the model gives them: each rung up brings less, played and forecast, and the forecast's
    // points fall with it.
    for (const k of ['played', 'grown', 'forecast'] as const) {
      expect(below[1]![k], k).toBeLessThan(below[0]![k]);
      expect(below[2]![k], k).toBeLessThan(below[1]![k]);
    }
    // Past three quarters of full the model's rate is constant (DEVELOPMENT.floor): the same twenty sessions bring the
    // same level at every rung, played and forecast (the played day's rested focus over the forecast's ordinary one, the
    // same at every rung), and the forecast's points, reading that, move by under a hundredth where below they fell by tenths.
    for (const x of past) {
      expect(Math.abs(x.played - past[0]!.played)).toBeLessThan(1e-9);
      expect(Math.abs(x.grown - past[0]!.grown)).toBeLessThan(1e-9);
      expect(Math.abs(x.played / x.grown - past[0]!.played / past[0]!.grown)).toBeLessThan(1e-9);
    }
    expect(past[0]!.played).toBeLessThan(below[2]!.played);
    const spread = (xs: { forecast: number }[]) => Math.max(...xs.map((x) => x.forecast)) - Math.min(...xs.map((x) => x.forecast));
    expect(spread(past)).toBeLessThan(0.01);
    expect(spread(below)).toBeGreaterThan(0.5);
  }, 240_000);

  it('PLAYER JOURNEY: followed near mastery, the trained input’s forecast at the discipline it had falls; where it rose, the rise is no more than discipline’s lift, and the advice says so', () => {
    // adv-t-19: twenty sessions of the first-named, one a day, through practice.exercise.
    const { sim } = tuning('adv-t-19');
    const first = firstOf(sim);
    const id = first.target;
    const before = exact(first.forecast);
    const d0 = abilityOf(sim, sim.player, 'discipline');
    const copy = clone(sim);
    live(copy, id);
    const d1 = abilityOf(copy, copy.player, 'discipline');
    const after = exact(trainingForecast(copy, copy.player).get(id));
    // The same save at the discipline it had (TEST SETUP): what the input's own part comes to.
    const held = clone(copy);
    setLevel(held, 'discipline', d0);
    const atD0 = exact(trainingForecast(held, held.player).get(id));
    expect(d1).toBeGreaterThan(d0);
    expect(atD0).toBeLessThan(before);
    // Played, not assumed: here it rose, by less than a thousandth, and by no more than discipline's lift.
    expect(after).toBeGreaterThan(before);
    expect(after - before).toBeLessThan(0.001);
    expect(after - before).toBeLessThanOrEqual(after - atD0 + 1e-12);
    // Said: its forecast then and now, discipline then and now, and how much of the change is discipline's.
    const said = firstOf(copy);
    expect(said.target).toBe(id);
    const r1 = (x: number) => Math.round(x * 10) / 10;
    expect(said.standing).toContain(`its forecast from ${before.toFixed(4)} to ${after.toFixed(4)}, a little up because discipline went from ${r1(d0)} to ${r1(d1)}`);
    expect(said.standing).toContain(`At discipline ${r1(d0)} its forecast would be ${atD0.toFixed(4)}, so +${(after - atD0).toFixed(4)} of the change is discipline’s`);
    expect(profileText(copy)).toContain(said.standing!);
  }, 240_000);
});

/** Signed to four places, as the advice says a part of a change. */
const signed4 = (x: number) => `${x >= 0 ? '+' : '−'}${Math.abs(x).toFixed(4)}`;
/** Every part of a change whose input the save shows didn't move is exactly 0 (H3): its own level, discipline, the work, the genres. */
function zeroWhereUnmoved(sim: Simulation, id: string, note: { state?: { levels: Record<string, number>; genreKnowledge: Record<string, number>; key?: string } }, parts: Record<string, number>, what: string) {
  const s = note.state!;
  if (s.levels[id] === levelOf(sim, sim.player, id as never)) expect(parts.own, `${what}: own`).toBe(0);
  if (s.levels.discipline === abilityOf(sim, sim.player, 'discipline')) expect(parts.discipline, `${what}: discipline`).toBe(0);
  if (s.key === [...sim.player.work!].sort((a, b) => a.at - b.at).at(-1)!.inputs.key) expect(parts.work, `${what}: work`).toBe(0);
}
/** adv-t-15, near mastery, and then The Spare Key taped cold through the commands: its rehearsal held it back most. */
function coldCase(): { sim: Simulation; cold: WorkRecord } {
  const { sim } = tuning('adv-t-15');
  const b = BRIEF_BY_ID['brief-drama']!;
  go(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id });
  expect(go(sim, 'practice.self_tape', { genre: b.kinds[0], brief: b.id }).ok).toBe(true);
  rest(sim);
  return { sim, cold: sim.player.work!.at(-1)! };
}

describe('F2-A10 (f) and (h), as the owner resolved them (brief 12)', () => {
  it('PLAYER JOURNEY: says what the forecast assumes of the work, and a take read as prepared is named with how far short each part was, what the figure would be read as taped and what its preparation would bring, on the Profile and in the brief’s pane, across a save and a load', () => {
    const { sim, cold } = coldCase();
    const first = firstOf(sim);
    // Worked from the records (each piece's own parts against what completes them, its chief limit, its genre now and
    // then): the cold take is the one read as prepared, and the engine's account of it is the records'.
    const byRecords = assumedByRecords(sim);
    expect(byRecords.prepared).toEqual([cold.what]);
    const a = assumedOf(sim.player)!;
    expect({ pieces: a.pieces, complete: a.complete, short: a.short, prepared: a.prepared.map((x) => x.what), genreCount: a.genreCount, genreShort: a.genreShort, genreBetter: a.genreBetter }).toEqual(byRecords);
    // F4: read exactly as said. Every input's forecast is the one worked from the records with that take alone as
    // prepared, and with it as taped the first-named's figure is the one said.
    for (const [k, f] of trainingForecast(sim, sim.player)) expect(Math.abs(exact(f) - forecastByRecords(sim, k)), k).toBeLessThan(1e-9);
    const taped = forecastByRecords(sim, first.target, true);
    expect(Math.abs(taped - exact(trainingForecast(sim, sim.player, sim.player.work, [first.target], true).get(first.target)))).toBeLessThan(1e-9);
    // Played, not assumed: here reading the cold take as taped would say less.
    expect(taped).toBeLessThan(exact(first.forecast));
    expect(first.assumes).toContain(`What the forecast assumes of your last ${byRecords.pieces} pieces: `);
    expect(first.assumes).toContain(`In ${cold.what}, breaking down the text for your reading stood at 0%, learning the lines at 0% and rehearsal on your feet at 0% of the way to complete.`);
    expect(first.assumes).toContain(`The forecast counts that piece as fully prepared, since its own preparation held it back most. Counted as taped, ${ADVICE.sessions} hours of ${first.label.toLowerCase()} would be worth about ${taped.toFixed(2)} a piece, not ${exact(first.forecast).toFixed(2)}.`);
    expect(first.assumes).toContain(`Each genre is counted as you know it today: of the ${byRecords.genreCount} pieces’ genres, ${byRecords.genreShort} are short of complete and ${byRecords.genreBetter} known better than when taped.`);
    // F1: what completing that preparation would bring, the judge's replay worked from the records, said apart.
    const prep = preparationByRecords(sim);
    expect(prep).toBeGreaterThan(0.05);
    for (const f of trainingForecast(sim, sim.player).values()) { expect(Math.abs(f.preparation! - prep)).toBeLessThan(1e-9); expect(Math.abs(exact(f) - (f.own! + f.days!))).toBeLessThan(1e-12); }
    expect(first.why).toContain(`would bring it about ${Math.round(prep * 100) / 100} points a piece as you are now. That’s preparation, not training`);
    expect(profileText(sim)).toContain(first.assumes!);
    expect(paneText(sim, 'brief-drama')).toContain(first.assumes!);
    const again = clone(sim);
    expect(adviceFor(again, again.player)).toEqual(adviceFor(sim, sim.player));
    // The falsifiability test: a beginner's cold take, held back most by an ability, is read as taped, counted short and
    // named as no prepared piece.
    const beginner = tuning('adv-t-4').sim;
    const b = BRIEF_BY_ID['brief-drama']!;
    go(beginner, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id });
    go(beginner, 'practice.self_tape', { genre: b.kinds[0], brief: b.id });
    rest(beginner);
    const held = beginner.player.work!.at(-1)!;
    expect(held.limits[0]!.kind).toBe('ability');
    expect(assumedByRecords(beginner).prepared).toEqual([]);
    expect(assumedOf(beginner.player)!.short).toBe(assumedByRecords(beginner).short);
    const said = firstOf(beginner).assumes!;
    expect(said).not.toContain(`In ${held.what}`);
    expect(said).not.toContain('as fully prepared, since');
    for (const [k, f] of trainingForecast(beginner, beginner.player)) expect(Math.abs(exact(f) - forecastByRecords(beginner, k)), k).toBeLessThan(1e-9);
    // The boundary of known better: a take in a genre already known in full is known no better since (TEST SETUP: its
    // genre at full before the take), and isn't counted so.
    const known = tuning('adv-t-15').sim;
    for (const g of b.kinds) known.player.engagement!.byGenre[g] = { familiarity: 100, practice: 100 };
    go(known, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id });
    expect(go(known, 'practice.self_tape', { genre: b.kinds[0], brief: b.id }).ok).toBe(true);
    rest(known);
    const fullAtTake = known.player.work!.at(-1)!;
    expect(fullAtTake.inputs.prep.genre).toBe(1);
    const ka = assumedOf(known.player)!;
    expect(ka.genreBetter).toBe(assumedByRecords(known).genreBetter);
    expect(ka.genreBetter).toBeLessThan(ka.genreCount);
  }, 240_000);

  it('PLAYER JOURNEY: says whether preparation, training or both deserve attention, from what the judge’s replay gives each, and the verdict follows the figures when one side is changed', () => {
    const { sim } = coldCase();
    const first = firstOf(sim);
    const att = attentionOf(sim, sim.player, first)!;
    const byRecords = attentionByRecords(sim, exact(first.forecast));
    expect(Math.abs(att.own - byRecords.own)).toBeLessThan(1e-9);
    expect(Math.abs(att.genre - byRecords.genre)).toBeLessThan(1e-9);
    expect(att.verdict).toBe(byRecords.verdict);
    // Played, not assumed: a take taped cold and genres short, and training worth more than a tenth: both.
    expect(att.verdict).toBe('both');
    const prepWords = `coming to your recent work fully prepared would have brought it about ${att.preparation.toFixed(2)} a piece as you are now (${att.own.toFixed(2)} from each piece’s own preparation, ${att.genre.toFixed(2)} from knowing its genre in full)`;
    expect(first.attention).toContain(prepWords);
    expect(first.attention).toContain(`${ADVICE.sessions} hours of ${first.label.toLowerCase()} would bring about ${exact(first.forecast).toFixed(2)}`);
    expect(first.attention!.startsWith(att.preparation > exact(first.forecast) ? 'Both preparation and training deserve attention, preparation most: ' : 'Both training and preparation deserve attention, training most: ')).toBe(true);
    expect(profileText(sim)).toContain(first.attention!);
    expect(paneText(sim, 'brief-drama')).toContain(first.attention!);
    // The falsifiability test, a side at a time (TEST SETUP). Every recent piece's own preparation complete in its record
    // and every genre it reads known in full: preparation would bring nothing, and training alone deserves attention.
    const prepared = clone(sim);
    prepared.player.work = prepared.player.work!.map((w) => ({ ...preparedCopy(w), limits: w.limits.filter((l) => l.kind !== 'preparation') }));
    for (const w of readWork(prepared)) for (const g of BRIEFS.find((x) => w.what.startsWith(x.title))?.kinds ?? []) prepared.player.engagement!.byGenre[g] = { familiarity: 100, practice: 100 };
    const pFirst = firstOf(prepared);
    const pAtt = attentionOf(prepared, prepared.player, pFirst)!;
    expect(pAtt.verdict).toBe(attentionByRecords(prepared, exact(pFirst.forecast)).verdict);
    expect(pAtt.verdict).toBe('training');
    expect(pFirst.attention!.startsWith('Training deserves attention now, and preparation doesn’t: ')).toBe(true);
    // And with everything training reaches at full besides: neither.
    const level = (x: Simulation) => [...new Set(readWork(x).flatMap((w) => [...Object.keys(w.inputs.abilities), ...Object.entries(w.inputs.techniques).filter(([, v]) => (v ?? 0) > 0).map(([k]) => k)]))].filter((k) => exerciseFor(k as never));
    for (const k of level(prepared)) setLevel(prepared, k, TECHNIQUES.includes(k as never) ? MASTERED + 2 : 'full');
    const none = adviceFor(prepared, prepared.player);
    expect(none[0]!.target).toBe('full:all');
    expect(none[0]!.attention!.startsWith('Neither preparation nor training would bring your recent work a tenth of a point now: ')).toBe(true);
    // The other side: the cold case with everything training reaches at full, its preparation as it was: preparation alone.
    const full = clone(sim);
    for (const k of level(full)) setLevel(full, k, TECHNIQUES.includes(k as never) ? MASTERED + 2 : 'full');
    const fAdvice = adviceFor(full, full.player);
    expect(fAdvice.some((r) => r.forecast)).toBe(false);
    expect(attentionOf(full, full.player)!.verdict).toBe(attentionByRecords(full, undefined).verdict);
    expect(fAdvice[0]!.attention!.startsWith('Preparation deserves attention now, and training doesn’t: ')).toBe(true);
    expect(profileText(full)).toContain(fAdvice[0]!.attention!);
  }, 240_000);

  it('PLAYER JOURNEY: followed near mastery, its forecast rose, and the advice works the rise out in parts, its own level and discipline and the other inputs the hours moved, the work and the genres nothing; it says each part, and the read isn’t stale, across a save and a load', () => {
    const { sim } = tuning('adv-t-19');
    const first = firstOf(sim);
    const id = first.target;
    const before = exact(first.forecast);
    let copy = clone(sim);
    live(copy, id);
    copy = clone(copy);
    const after = firstOf(copy);
    expect(after.target).toBe(id);
    const now = exact(after.forecast);
    // Played, not assumed: here it rose (brief 11 found it, by under a thousandth).
    expect(now).toBeGreaterThan(before);
    const was = copy.player.experience!.advised!;
    expect(was.target).toBe(id);
    // Noted as the sessions began, by the first hour of them, the next morning: what the twenty hours moved is read from
    // there (a day's own change, the body's fitness among the other inputs, is the note's, not the sessions').
    expect(was.last.at).toBeGreaterThan(sim.now);
    expect(was.last.at).toBeLessThan(sim.now + 2 * MS_DAY);
    expect(after.standing).toContain(`Since ${formatDate(was.last.at, copy.zone)} you’ve put in ${ADVICE.sessions} hours of `);
    const ch = forecastChange(copy, copy.player, id, was.last)!;
    expect(Math.abs(ch.residual)).toBeLessThan(1e-9);
    expect(ch.parts.work).toBe(0);
    expect(ch.parts.genre).toBe(0);
    expect(ch.parts.own).toBeLessThan(0);
    expect(ch.parts.discipline).toBeGreaterThan(0);
    expect(Math.abs(Object.values(ch.parts).reduce((t, x) => t + x, 0) - (now - was.last.forecast))).toBeLessThan(1e-12);
    // Discipline's part is worked out last, so it's brief 11's figure, and the standing's two sentences give one figure.
    const atThen = exact(forecastAtDiscipline(copy, copy.player, id, was.last.discipline));
    expect(Math.abs(ch.parts.discipline - (now - atThen))).toBeLessThan(1e-12);
    expect(after.standing).toContain(`so ${signed4(now - atThen)} of the change is discipline’s`);
    expect(after.standing).toContain(`${PART_WORDS.discipline}, ${signed4(ch.parts.discipline)}`);
    // Said: each part that shows at four places, by name, and nothing untraced.
    const sentence = `What moved its forecast since ${formatDate(was.last.at, copy.zone)}: `;
    expect(after.standing).toContain(sentence);
    for (const [k, x] of Object.entries(ch.parts)) if (Math.abs(x) >= 0.00005) expect(after.standing).toContain(`${PART_WORDS[k]}, ${signed4(x)}`);
    expect(after.standing).not.toContain('can’t trace');
    const recs = adviceFor(copy, copy.player);
    expect(staleOf(copy, recs)).toEqual([]);
    expect(changesOf(copy, recs).filter((x) => x.unexplained)).toEqual([]);
    expect(profileText(copy)).toContain(sentence);
    const again = clone(copy);
    expect(adviceFor(again, again.player)).toEqual(recs);
  }, 240_000);

  it('PLAYER JOURNEY: ignored for three weeks of taping, it keeps naming what brings most and is never stale; every move of its forecast is worked out in parts and said, the work it reads and how well you know its genres, a part whose input didn’t move nothing, across a save and a load', () => {
    let { sim } = tuning('adv-t-5');
    // Brief 11 said composure, still at 42, had gone from 1.00 to 1.28 with nothing to say why. Worked out now:
    const first0 = firstOf(sim);
    const was0 = sim.player.experience!.advised!;
    expect(was0.target).toBe(first0.target);
    expect(exact(first0.forecast)).toBeGreaterThan(was0.first.forecast);
    const ch0 = forecastChange(sim, sim.player, first0.target, was0.first)!;
    expect(Math.abs(ch0.residual)).toBeLessThan(1e-9);
    zeroWhereUnmoved(sim, first0.target, was0.first, ch0.parts, 'as built');
    expect(ch0.parts.work + ch0.parts.genre).toBeGreaterThan(0);
    expect(first0.standing).toContain(`What moved its forecast since the advice first named it: ${PART_WORDS.work}, ${signed4(ch0.parts.work)}; ${PART_WORDS.genre}, ${signed4(ch0.parts.genre)}`);
    for (let week = 0; week < 3; week += 1) {
      for (const day of [2, 5]) { sim.advanceTo(sim.now + (day === 2 ? 2 : 3) * MS_DAY); tapeNew(sim); }
      sim.advanceTo(sim.now + 2 * MS_DAY);
      rest(sim);
      if (week === 1) { const said = adviceFor(sim, sim.player); sim = clone(sim); expect(adviceFor(sim, sim.player)).toEqual(said); }
      const recs = adviceFor(sim, sim.player);
      expect(staleOf(sim, recs), `week ${week}`).toEqual([]);
      const was = sim.player.experience!.advised!;
      const changes = changesOf(sim, recs);
      expect(changes.length, `week ${week}`).toBeGreaterThan(0);
      for (const c of changes) {
        expect(c.unexplained, `week ${week} since ${c.since}`).toBe(false);
        expect(c.said, `week ${week} since ${c.since}`).toBe(true);
        zeroWhereUnmoved(sim, was.target, c.since === 'first' ? was.first : was.last, c.parts!, `week ${week} since ${c.since}`);
      }
      expect(recs.find((r) => r.forecast)!.standing).toContain('What moved its forecast since');
    }
    expect(profileText(sim)).toContain(firstOf(sim).standing!);
  }, 240_000);

  it('PLAYER JOURNEY: partly followed, seven of the twenty sessions, the level moves less and the change is its own level’s and discipline’s; twenty sessions of another input’s exercise move its forecast through the other inputs and discipline; each said, never stale, across a save and a load', () => {
    const { sim } = tuning('adv-t-5');
    const first = firstOf(sim);
    const id = first.target;
    const lv = (x: Simulation) => levelOf(x, x.player, id as never);
    const all = clone(sim);
    live(all, id);
    let some = clone(sim);
    live(some, id, 7);
    some = clone(some);
    expect(lv(some)).toBeGreaterThan(lv(sim));
    expect(lv(some)).toBeLessThan(lv(all));
    const was = some.player.experience!.advised!;
    expect(was.target).toBe(id);
    const ch = forecastChange(some, some.player, id, was.last)!;
    expect(Math.abs(ch.residual)).toBeLessThan(1e-9);
    expect(ch.parts.work).toBe(0);
    expect(ch.parts.genre).toBe(0);
    expect(ch.parts.own).not.toBe(0);
    expect(ch.parts.discipline).not.toBe(0);
    const recs = adviceFor(some, some.player);
    expect(staleOf(some, recs)).toEqual([]);
    expect(changesOf(some, recs).filter((x) => x.unexplained)).toEqual([]);
    expect(recs.find((r) => r.forecast)!.standing).toContain(`${PART_WORDS.own}, ${signed4(ch.parts.own)}`);
    // Another input's exercise for the twenty: the second-named's.
    const other = adviceFor(sim, sim.player).filter((r) => r.forecast && r.target !== id)[0]!.target;
    let alt = clone(sim);
    live(alt, other);
    alt = clone(alt);
    const wasA = alt.player.experience!.advised!;
    expect(wasA.target).toBe(id);
    const chA = forecastChange(alt, alt.player, id, wasA.last)!;
    expect(Math.abs(chA.residual)).toBeLessThan(1e-9);
    expect(chA.parts.work).toBe(0);
    expect(chA.parts.genre).toBe(0);
    // Played, not assumed: its level didn't move, so its own part is nothing, and the other input's hours are.
    expect(lv(alt)).toBe(lv(sim));
    expect(chA.parts.own).toBe(0);
    expect(chA.parts.others).not.toBe(0);
    const recsA = adviceFor(alt, alt.player);
    expect(staleOf(alt, recsA)).toEqual([]);
    expect(changesOf(alt, recsA).filter((x) => x.unexplained)).toEqual([]);
    expect(recsA.find((r) => r.forecast)!.standing).toContain(`${PART_WORDS.others}, ${signed4(chA.parts.others)}`);
    const again = clone(alt);
    expect(adviceFor(again, again.player)).toEqual(recsA);
  }, 240_000);

  it('PLAYER JOURNEY: changes their work, three briefs of another kind (the microphone’s) in genres never met: the work’s and the genres’ parts are worked out and said, the first-named is the forecast’s largest, never stale, across a save and a load', () => {
    let { sim } = tuning('adv-t-5');
    const known = new Set(Object.keys(sim.player.engagement?.byGenre ?? {}));
    const voice = BRIEFS.filter((b) => b.medium === 'voice' && !b.kinds.some((g) => known.has(g)) && !sim.player.briefs?.[b.id]).slice(0, 3);
    expect(voice.length).toBe(3);
    for (const b of voice) {
      sim.advanceTo(sim.now + 2 * MS_DAY);
      go(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id });
      for (let i = 0; i < 2; i += 1) for (const step of ['read', 'lines', 'rehearse']) go(sim, 'brief.prepare', { brief: b.id, step });
      expect(go(sim, 'genre.study', { genre: b.kinds[0] }).ok).toBe(true);
      expect(go(sim, 'practice.self_tape', { genre: b.kinds[0], brief: b.id }).ok).toBe(true);
    }
    rest(sim);
    expect(readWork(sim).slice(-3).map((w) => w.what)).toEqual(voice.map((b) => expect.stringContaining(b.title)));
    sim = clone(sim);
    const recs = adviceFor(sim, sim.player);
    expect(staleOf(sim, recs)).toEqual([]);
    const was = sim.player.experience!.advised!;
    const changes = changesOf(sim, recs);
    expect(changes.filter((x) => x.unexplained)).toEqual([]);
    // Played, not assumed: the microphone's pieces moved the forecast through the work and the genres, each said.
    const since = changes.find((x) => x.since === 'first')!;
    expect(since.parts!.work).not.toBe(0);
    expect(since.parts!.genre).not.toBe(0);
    zeroWhereUnmoved(sim, was.target, was.first, since.parts!, 'since it was first given');
    const first = recs.find((r) => r.forecast)!;
    expect(first.standing).toContain(`${PART_WORDS.genre}, ${signed4(since.parts!.genre!)}`);
    expect(first.assumes).toContain(`What the forecast assumes of your last ${readWork(sim).length} pieces: `);
    expect(profileText(sim)).toContain(first.standing!);
    const again = clone(sim);
    expect(adviceFor(again, again.player)).toEqual(recs);
  }, 240_000);

  it('PLAYER JOURNEY: reaches mastery: the first-named practiced to full through practice.exercise drops out, the next by forecast is named and the standing says the first has nothing left to forecast; with everything training reaches at full the advice says so, and the verdict asks for preparation alone, across a save and a load', () => {
    const { sim } = tuning('adv-t-19');
    const first = firstOf(sim);
    const id = first.target;
    const ex = exerciseFor(id as never)!;
    // Up to four hours a day of its exercise, a day at a time, until it's at full (51 days here).
    let days = 0;
    for (; !isFull(sim, id) && days < 120; days += 1) {
      sim.advanceTo(sim.now + MS_DAY);
      for (let hour = 0; hour < PRACTICE.dailyHours && !isFull(sim, id); hour += 1) {
        sim.advanceTo(sim.now + 60 * 60_000);
        expect(go(sim, 'practice.exercise', { exercise: ex.id, tier: matchedTier(levelOf(sim, sim.player, id as never)), focus: 'steady' }).ok).toBe(true);
      }
    }
    expect(isFull(sim, id)).toBe(true);
    const was = sim.player.experience!.advised!;
    expect(was.target).toBe(id);
    let recs = adviceFor(sim, sim.player);
    expect(recs.some((r) => r.target === id)).toBe(false);
    expect(staleOf(sim, recs)).toEqual([]);
    const next = recs.find((r) => r.forecast)!;
    expect(next.standing).toContain(`the first was ${first.label.toLowerCase()}`);
    expect(next.standing).toContain(`${first.label.toLowerCase()} has nothing left to forecast on your recent work`);
    const reloaded = clone(sim);
    expect(adviceFor(reloaded, reloaded.player)).toEqual(recs);
    // TEST SETUP: everything else training reaches brought to full; the advice says so first, and asks for preparation.
    const read = [...new Set(readWork(sim).flatMap((w) => [...Object.keys(w.inputs.abilities), ...Object.entries(w.inputs.techniques).filter(([, v]) => (v ?? 0) > 0).map(([k]) => k)]))].filter((k) => exerciseFor(k as never));
    for (const k of read) setLevel(sim, k, TECHNIQUES.includes(k as never) ? MASTERED + 2 : 'full');
    recs = adviceFor(sim, sim.player);
    expect(recs[0]!.target).toBe('full:all');
    expect(recs.some((r) => r.forecast)).toBe(false);
    expect(staleOf(sim, recs)).toEqual([]);
    expect(recs[0]!.attention!.startsWith('Preparation deserves attention now, and training doesn’t: ')).toBe(true);
    expect(profileText(sim)).toContain(recs[0]!.attention!);
  }, 240_000);

  it('GUARD: the detectors fire when made to: a read made before twenty sessions, shown after them, is stale; a note’s forecast moved by hand is said as untraced and counted unexplained; a rise whose note kept no state is said to be beyond working out, and counted', () => {
    // S1 and S2: adv-0, where twenty sessions put another input ahead (brief 10's journey).
    const { sim } = tuning('adv-0');
    const before = adviceFor(sim, sim.player);
    let copy = clone(sim);
    live(copy, firstOf(sim).target);
    copy = clone(copy);
    expect(staleOf(copy, adviceFor(copy, copy.player))).toEqual([]);
    const old = staleOf(copy, before);
    expect(old.some((x) => x.startsWith('S1:'))).toBe(true);
    expect(old.some((x) => x.startsWith('S2:'))).toBe(true);
    // S3: adv-t-19, whose first stays first: today's read with the standing it had before the sessions.
    const t = tuning('adv-t-19').sim;
    const was = firstOf(t);
    let f = clone(t);
    live(f, was.target);
    f = clone(f);
    const recs = adviceFor(f, f.player);
    expect(staleOf(f, recs)).toEqual([]);
    expect(staleOf(f, recs.map((r) => (r.forecast && r.target === was.target ? { ...r, standing: was.standing } : r))).some((x) => x.startsWith('S3:'))).toBe(true);
    // Unexplained: TEST SETUP, the note made as the sessions began moved by a hundredth by hand.
    expect(changesOf(f, recs).filter((x) => x.unexplained)).toEqual([]);
    const note = f.player.experience!.advised!.last;
    note.forecast += 0.01;
    const moved = adviceFor(f, f.player).find((r) => r.forecast)!;
    expect(moved.standing).toContain('−0.0100 the advice can’t trace to anything it’s forecast on');
    expect(changesOf(f, adviceFor(f, f.player)).filter((x) => x.unexplained).map((x) => x.since)).toEqual(['last']);
    note.forecast -= 0.01;
    // A note from before brief 12, with no state (TEST SETUP): the rise since it is said to be beyond working out, and counted.
    delete note.state;
    const stateless = adviceFor(f, f.player).find((r) => r.forecast)!;
    expect(stateless.standing).toContain('can’t be worked out');
    expect(changesOf(f, adviceFor(f, f.player)).filter((x) => x.unexplained).map((x) => x.since)).toEqual(['last']);
  }, 240_000);

  it('PLAYER JOURNEY: the forecast’s growth is the progression model’s: on the first-named’s ladder it never rises with the level and falls below three quarters of full; the forecast is within (e)’s tolerance of what twenty sessions brought, read under its own assumptions', () => {
    // adv-t-1, developing, its first-named below three quarters; adv-t-19, near mastery, past it; adv-t-6, advanced, where
    // (e) as written missed in brief 10 and brief 11.
    for (const seed of ['adv-t-1', 'adv-t-6', 'adv-t-19']) {
      const { sim, takes } = tuning(seed);
      const first = firstOf(sim);
      const ladder = growthLadder(sim, first.target);
      expect(ladder.ok, `${seed} ${ladder.growth.join(' ')}`).toBe(true);
      // The forecast grows as an hour of practice grows: one session through practice.exercise against the forecast's
      // one session (`trained`), the same ratio (the played day's focus over the forecast's ordinary one) below three
      // quarters of full and past it, where only the model's rate differs.
      const ex = exerciseFor(first.target as never)!;
      const ratio = (level: number) => {
        const x = clone(sim);
        setLevel(x, first.target, level);
        const forecastOne = levelOf(x, trained(x, x.player, first.target as never, 1), first.target as never) - level;
        expect(go(x, 'practice.exercise', { exercise: ex.id, tier: matchedTier(level), focus: 'steady' }).ok).toBe(true);
        return (levelOf(x, x.player, first.target as never) - level) / forecastOne;
      };
      expect(Math.abs(ratio(60) - ratio(85)), seed).toBeLessThan(1e-9);
      if (ladder.rungs[0]! < 75) expect(ladder.growth[1]!).toBeLessThan(ladder.growth[0]!);
      else expect(Math.abs(ladder.growth[1]! - ladder.growth[0]!)).toBeLessThan(1e-9);
      // F3: the same twenty sessions played, the pieces read as the forecast read them.
      const base = clone(sim);
      live(base, undefined);
      const trainedCopy = clone(sim);
      live(trainedCopy, first.target);
      const like = likeForLike(sim, trainedCopy, base);
      expect(like, seed).toBeGreaterThan(0);
      expect(Math.abs(exact(first.forecast) - like), `${seed}: forecast ${exact(first.forecast)}, brought ${like}`).toBeLessThanOrEqual(Math.max(0.3, 0.25 * Math.abs(like)));
      // The same sessions read on each brief as its record stands now ((e) as written): on adv-t-6 not the forecast's
      // assumptions, and outside the tolerance, played, not assumed.
      if (seed === 'adv-t-6') { const asWritten = worthOf(trainedCopy, takes) - worthOf(base, takes); expect(Math.abs(exact(first.forecast) - asWritten)).toBeGreaterThan(Math.max(0.3, 0.25 * Math.abs(asWritten))); }
    }
  }, 240_000);
});

describe('The F2-A10 harness (brief 11)', () => {
  it('GUARD: the tuning and held-out seeds are apart: the sets never meet, the 120 fresh held-out cases are four bands by three stages by ten seeds, the tuning cases reach every stratum, and a held-out seed is refused without --held-out', () => {
    const tuned = casesOf('tuning');
    const held = casesOf('held-out');
    expect(tuned.length).toBe(30);
    expect(held.length).toBe(150);
    expect(tuned.every((c) => c.set === 'tuning')).toBe(true);
    expect(held.every((c) => c.set === 'held-out')).toBe(true);
    const seeds = new Set(tuned.map((c) => c.seed));
    expect(held.filter((c) => seeds.has(c.seed))).toEqual([]);
    expect(tuned.filter((c) => c.design === 'F2-A').map((c) => c.seed)).toEqual(Array.from({ length: 10 }, (_, i) => `adv-${i}`));
    expect(held.filter((c) => c.design === 'F2-A').map((c) => c.seed)).toEqual(Array.from({ length: 30 }, (_, i) => `adv-${i + 10}`));
    // The criterion's bands and stages (F2-A10 (a)), as the harness draws them.
    expect(BANDS).toEqual({ beginner: [25, 45], developing: [40, 65], advanced: [60, 85], nearMastery: [80, 97] });
    expect(Object.fromEntries(STAGE_ORDER.map((s) => [s, STAGES[s].takes]))).toEqual({ firstWeek: [1, 3], midTerm: [6, 10], later: [15, 20] });
    const fresh = held.filter((c) => c.design === 'F2-A10');
    const tunedFresh = tuned.filter((c) => c.design === 'F2-A10');
    expect(fresh.length).toBe(120);
    for (const band of BAND_ORDER) for (const stage of STAGE_ORDER) {
      expect(fresh.filter((c) => c.band === band && c.stage === stage).length, `${band} ${stage}`).toBe(10);
      expect(tunedFresh.some((c) => c.band === band && c.stage === stage), `${band} ${stage}`).toBe(true);
    }
    for (const seed of ['adv-40', 'adv-t-20', 'adv-h-120', 'adv-h-x', 'adv-v-120']) expect(caseOf(seed), seed).toBeUndefined();
    expect(() => casesOf('adv-h-120')).toThrow('is no case of F2-A or F2-A10');
    expect(heldOutRefusal(casesOf('adv-h-0..2'), false)).toBe('A held-out seed (regression coverage from brief 12) is run only with --held-out, on the code to be reported.');
    expect(heldOutRefusal(casesOf('adv-10'), false)).toBeDefined();
    expect(heldOutRefusal(casesOf('tuning'), false)).toBeUndefined();
    expect(heldOutRefusal(casesOf('adv-h-0..2'), true)).toBeUndefined();
  });

  it('GUARD: the fresh validation seeds (brief 12) are apart from the tuning and held-out ones, four bands by three stages by ten, and refused without --fresh, the held-out set now regression coverage', () => {
    // Read from the case list alone: no fresh case is built or run here, or anywhere but the coordinator's one run.
    const fresh = casesOf('fresh');
    expect(fresh.map((c) => c.seed)).toEqual(Array.from({ length: 120 }, (_, i) => `adv-v-${i}`));
    expect(fresh.every((c) => c.set === 'fresh' && c.design === 'F2-A10')).toBe(true);
    const seen = new Set([...casesOf('tuning'), ...casesOf('held-out')].map((c) => c.seed));
    expect(fresh.filter((c) => seen.has(c.seed))).toEqual([]);
    // Stratified as the held-out set is: case n in band n / 30 and stage (n mod 30) / 10, ten seeds each.
    const held = casesOf('held-out').filter((c) => c.design === 'F2-A10');
    fresh.forEach((c, n) => { expect(c.band).toBe(held[n]!.band); expect(c.stage).toBe(held[n]!.stage); });
    for (const band of BAND_ORDER) for (const stage of STAGE_ORDER) expect(fresh.filter((c) => c.band === band && c.stage === stage).length, `${band} ${stage}`).toBe(10);
    // Refused without --fresh, whatever else is asked for; with it, run.
    const fresh0 = casesOf('adv-v-0..2');
    expect(heldOutRefusal(fresh0, false)).toBe('A fresh validation seed is run only with --fresh, once, on the tested commit.');
    expect(heldOutRefusal(fresh0, true)).toBe('A fresh validation seed is run only with --fresh, once, on the tested commit.');
    expect(heldOutRefusal(casesOf('adv-t-0,adv-v-5'), false)).toBeDefined();
    expect(heldOutRefusal(fresh0, false, true)).toBeUndefined();
    // A held-out seed still needs --held-out, and --fresh doesn't stand in for it.
    expect(heldOutRefusal(casesOf('adv-h-0,adv-v-0'), false, true)).toBe('A held-out seed (regression coverage from brief 12) is run only with --held-out, on the code to be reported.');
    expect(heldOutRefusal(casesOf('tuning'), false, false)).toBeUndefined();
    // What each set is for, as a summary names it: the held-out set is regression coverage, the fresh set the unseen one.
    expect(SET_LABEL).toEqual({ tuning: 'tuning', 'held-out': 'regression', fresh: 'fresh' });
    expect(SET_ROLE['held-out']).toContain('regression');
    expect(SET_ROLE['held-out']).toContain('isn’t unseen validation');
    expect(SET_ROLE.fresh).toContain('unseen validation (brief 12): run once, on the tested commit');
  });

  it('GUARD: the measure works out every clause on a tuning case and says what it ran on, the commit and whether the tree was clean; a held-out seed without --held-out is refused before anything is built', () => {
    // tools/advice.ts itself, as the measure is run (a child process), on adv-t-0: a beginner a take in.
    const dir = mkdtempSync(join(tmpdir(), 'advice-measure-'));
    try {
      const out = join(dir, 'adv-t-0.json');
      const r = spawnSync(process.execPath, [resolve('node_modules/vite-node/vite-node.mjs'), 'tools/advice.ts', '--', '--cases', 'adv-t-0', '--out', out], { encoding: 'utf8' });
      expect(r.status, r.stderr).toBe(0);
      const run = JSON.parse(readFileSync(out, 'utf8')) as { commit: string; clean: boolean; command: string; cases: Record<string, unknown>[]; summary: Record<string, unknown> };
      expect(run.commit).toMatch(/^[0-9a-f]{40}$/);
      expect(typeof run.clean).toBe('boolean');
      expect(run.command).toBe('npx vite-node tools/advice.ts -- --cases adv-t-0 --out ' + out);
      const c = run.cases[0]!;
      expect(c).toMatchObject({ seed: 'adv-t-0', set: 'tuning', design: 'F2-A10', band: 'beginner', stage: 'firstWeek' });
      // F2-A's pass, and every clause the criteria name, worked out on the case.
      expect(typeof c.pass).toBe('boolean');
      expect(Object.keys(c.c as object)).toEqual(expect.arrayContaining(['medianOthers', 'atOrAboveMedian', 'randomMean', 'firstGain']));
      expect(Object.keys(c.d as object)).toEqual(expect.arrayContaining(['violations', 'allFull']));
      expect(Object.keys(c.e as object)).toEqual(expect.arrayContaining(['predicted', 'realized', 'within']));
      expect(Object.keys(c.f as object)).toEqual(expect.arrayContaining(['ladder', 'falls', 'prep']));
      expect(Object.keys(c.g as object)).toEqual(expect.arrayContaining(['recs', 'ok', 'missing']));
      expect(Object.keys(c.h as object)).toEqual(expect.arrayContaining(['before', 'after', 'fell', 'leads', 'ok']));
      expect(Object.keys(c.i as object)).toEqual(['same']);
      expect(Object.keys(run.summary)).toEqual(expect.arrayContaining(['tuning', 'tuning F2-A10', 'tuning F2-A10 beginner', 'tuning F2-A10 firstWeek']));
      // From brief 12: every clause of (f) and (h) as the owner resolved them, worked out on the case, each one met here.
      expect((c.f12 as { ok: object }).ok).toEqual({ F1: true, F2: true, F3: true, F4: true, F5: true, F6: true });
      expect((c.h12 as { ok: object }).ok).toEqual({ H1: true, H2: true, H3: true, H4: true, H5: true, H6: true });
      expect((c.h12 as { reads: { who: string }[] }).reads.map((x) => x.who)).toEqual(expect.arrayContaining(['as built', 'ignored', 'followed', 'cold take']));
      // The summary reports each clause on the fresh set by band and by stage. FIXTURE: this case's own output, labeled as
      // each of the twelve strata of the fresh set (no fresh case is built or run), summarized as a fresh run is.
      const fixture = join(dir, 'fresh-fixture.json');
      const strata = BAND_ORDER.flatMap((band) => STAGE_ORDER.map((stage) => ({ ...c, seed: `fixture-${band}-${stage}`, set: 'fresh', band, stage })));
      writeFileSync(fixture, JSON.stringify({ commit: run.commit, cases: strata }));
      const summaryOut = join(dir, 'fresh-summary.json');
      const sum = spawnSync(process.execPath, [resolve('node_modules/vite-node/vite-node.mjs'), 'tools/advice.ts', '--', '--summarize', fixture, '--out', summaryOut], { encoding: 'utf8' });
      expect(sum.status, sum.stderr).toBe(0);
      const summary = JSON.parse(readFileSync(summaryOut, 'utf8')) as { roles: Record<string, string>; groups: Record<string, { n: number; f12: Record<string, unknown>; h12: Record<string, unknown> }> };
      expect(summary.roles).toEqual({ fresh: SET_ROLE.fresh });
      for (const g of ['fresh', 'fresh F2-A10', ...BAND_ORDER.map((x) => `fresh F2-A10 ${x}`), ...STAGE_ORDER.map((x) => `fresh F2-A10 ${x}`)]) {
        expect(summary.groups[g], g).toBeDefined();
        expect(summary.groups[g]!.f12, g).toMatchObject({ F1: summary.groups[g]!.n, F2: summary.groups[g]!.n, F3: summary.groups[g]!.n, F4: summary.groups[g]!.n, F5: summary.groups[g]!.n, F6: summary.groups[g]!.n });
        expect(summary.groups[g]!.h12, g).toMatchObject({ H1: summary.groups[g]!.n, H2: summary.groups[g]!.n, H3: summary.groups[g]!.n, H4: summary.groups[g]!.n, H5: summary.groups[g]!.n, H6: summary.groups[g]!.n, staleReads: 0, unexplained: 0 });
      }
      expect(summary.groups['fresh F2-A10 beginner']!.n).toBe(3);
      expect(summary.groups['fresh F2-A10 later']!.n).toBe(4);
      // A held-out seed without --held-out: refused, and nothing written.
      const held = join(dir, 'held.json');
      const no = spawnSync(process.execPath, [resolve('node_modules/vite-node/vite-node.mjs'), 'tools/advice.ts', '--', '--cases', 'adv-h-0', '--out', held], { encoding: 'utf8' });
      expect(no.status).not.toBe(0);
      expect(no.stderr + no.stdout).toContain('A held-out seed (regression coverage from brief 12) is run only with --held-out, on the code to be reported.');
      expect(existsSync(held)).toBe(false);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  }, 240_000);

  it('PLAYER JOURNEY: a case is built through the game’s commands: every input drawn within its band, near mastery at least two at full, the stage’s takes taped as its work in its days, each in one of the 149 genres', () => {
    expect(GENRES.length).toBe(149);
    // A tuning case of each stage: adv-t-0 (beginner, the first week), adv-t-5 (developing, mid-term), adv-t-11 (near
    // mastery, later).
    for (const seed of ['adv-t-0', 'adv-t-5', 'adv-t-11']) {
      const spec = caseOf(seed)!;
      const { sim, takes, full, drawn } = buildCase(seed, spec.band!, spec.stage!);
      const [lo, hi] = BANDS[spec.band!];
      expect(Object.keys(drawn).sort(), seed).toEqual([...INPUTS].sort());
      for (const [id, v] of Object.entries(drawn)) if (v !== 'full') { expect(v, `${seed} ${id}`).toBeGreaterThanOrEqual(lo); expect(v, `${seed} ${id}`).toBeLessThanOrEqual(hi); }
      if (spec.band === 'nearMastery') expect(full.length, seed).toBeGreaterThanOrEqual(2); else expect(full, seed).toEqual([]);
      for (const id of full) expect(drawn[id]).toBe('full');
      const [least, most] = STAGES[spec.stage!].takes;
      expect(takes.length, seed).toBeGreaterThanOrEqual(least);
      expect(takes.length, seed).toBeLessThanOrEqual(most);
      // Every take is the case's work, judged as a taped brief, in order, and every brief's record holds its take.
      const work = sim.player.work ?? [];
      expect(work.length, seed).toBe(takes.length);
      work.forEach((w, i) => {
        expect(w.task, `${seed} ${i}`).toMatch(/^tape/);
        expect(w.what, `${seed} ${i}`).toContain(BRIEF_BY_ID[takes[i]!.brief]!.title);
        expect(sim.player.briefs![takes[i]!.brief]!.takes.some((t) => t.reading === takes[i]!.reading)).toBe(true);
      });
      for (const t of takes) { expect(GENRES).toContain(t.genre); expect(BRIEF_BY_ID[t.brief]!.kinds).toContain(t.genre); }
      const startDay = takes[0]!.at;
      expect(takes.at(-1)!.at - startDay, seed).toBeLessThanOrEqual((STAGES[spec.stage!].days + 1) * MS_DAY);
      if (spec.stage === 'later') expect(new Set(takes.map((t) => t.genre)).size, seed).toBeGreaterThanOrEqual(10);
    }
  }, 240_000);

  it('PLAYER JOURNEY: a take refused in hospital waits the stay out, is prepared again and taped once she’s out, where until brief 10 the harness threw and the case was never built (adv-h-10, adv-h-57)', () => {
    const { sim } = tuning('adv-t-0');
    const b = BRIEF_BY_ID['brief-drama']!;
    const prepare = () => { go(sim, 'brief.choose', { brief: b.id, reading: b.readings[0]!.id }); for (const step of ['read', 'lines', 'rehearse']) go(sim, 'brief.prepare', { brief: b.id, step }); };
    prepare();
    // FIXTURE: a stay the life's own health brings, through the function that brings it (careFor, systems/health.ts).
    careFor(sim, sim.player, { care: 'stay', what: 'A stay in hospital' }, sim.now);
    expect(inHospital(sim.player, sim.now)).toBe(true);
    const until = sim.player.health!.inHospitalUntil!;
    const tape = () => go(sim, 'practice.self_tape', { genre: b.kinds[0], brief: b.id });
    // The game's own refusal, the one the harness met on adv-h-10 and adv-h-57.
    expect(tape().error).toBe('Not from a hospital bed.');
    const n = sim.player.work!.length;
    tapeWaiting(sim, 'adv-t-0 brief-drama', prepare, tape);
    expect(sim.player.work!.length).toBe(n + 1);
    expect(sim.player.work!.at(-1)!.what).toContain(b.title);
    expect(sim.player.work!.at(-1)!.at).toBeGreaterThanOrEqual(until);
    expect(inHospital(sim.player, sim.now)).toBe(false);
    // The falsifiability test: a take refused for another reason isn't waited on or tried again, even where preparing
    // again would let it through (here no reading had been chosen); it throws, as a broken case should.
    const other = clone(sim);
    const c = BRIEFS.find((x) => x.medium === 'camera' && !other.player.briefs?.[x.id])!;
    const choose = () => { go(other, 'brief.choose', { brief: c.id, reading: c.readings[0]!.id }); };
    const tapeOther = () => go(other, 'practice.self_tape', { genre: c.kinds[0], brief: c.id });
    expect(tapeOther().error).toContain('Choose a reading first');
    expect(() => tapeWaiting(other, 'adv-t-0 no reading', choose, tapeOther)).toThrow('adv-t-0 no reading: Choose a reading first');
  }, 240_000);
});

