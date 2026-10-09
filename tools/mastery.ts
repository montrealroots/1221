/**
 * SLATE — mastery reached by playing (from 2026-10-10): a student who trains through the game's own commands, under
 * its own limits (four hours of practice a day, the same exercise again the same day for half, a workout's repeat,
 * classes and calls that come first, sleep, meals, a save and a load every thirty days), and how long each ability
 * and technique takes to reach full. Nothing writes a level, no clock is set back, and no development function is
 * called: every gain is a `practice.exercise`, a `life.look_after` workout, a `genre.study` or a `practice.self_tape`.
 *
 * - `--mode single --target <id>`: one ability or technique trained by its own exercise (Stamina by workouts,
 *   Discipline by a day's practice kept), as many sessions a day as `--per-day` allows, until full.
 * - `--mode plan --genre <id>`: what a self-tape in a genre reads (the camera task's abilities, its techniques and the
 *   genre's demands) trained in turn, the least full first, four hours a day; the genre studied until it's known; a
 *   tape every thirty days to show the way there; and once everything it reads is full, tapes through the command.
 *   Then matched twins of that mastered save tape ill, hurt and recovered (TEST SETUP: the condition put on, as
 *   `tools/condition.ts` puts it).
 *
 *   npx vite-node tools/mastery.ts -- --mode single --target accents --seed m-0
 *   npx vite-node tools/mastery.ts -- --mode plan --genre musical --seed m-0 --years 8
 */
import { loadSave } from '../src/engine';
import type { Simulation } from '../src/engine/core/simulation';
import { deserialise, serialise } from '../src/engine/persistence/adapter';
import { MS_DAY, MS_HOUR, zonedParts } from '../src/engine/core/time';
import { breaches } from '../src/engine/core/invariants';
import { abilityFull, developmentOf, levelOf, targetId, type Target } from '../src/engine/systems/attributes';
import { practiceRefusal, practicedToday } from '../src/engine/systems/practice';
import { lookAfterRefusal } from '../src/engine/systems/life';
import { genreState, selfTapeRefusal, studyRefusal, tapeReads, SELF_TAPE } from '../src/engine/systems/engagement';
import { careFor, healthOf } from '../src/engine/systems/health';
import { journeyOf } from '../src/engine/systems/evaluation';
import { EXERCISES, PRACTICE, exerciseFor } from '../src/engine/content/practice';
import { ABILITY_DEFS, MASTERED, TECHNIQUES, type AbilityId } from '../src/engine/content/abilities';
import { TASK_PROFILES } from '../src/engine/content/tasks';
import { INJURY_KIND, type InjuryKind } from '../src/engine/content/injury';
import type { Skill } from '../src/engine/content/school';
import { attentiveHour, life } from './policy';

const arg = (name: string, d: string) => { const i = process.argv.indexOf(`--${name}`); return i > 0 ? process.argv[i + 1]! : d; };
const MODE = arg('mode', 'single');
const SEED = arg('seed', 'm-0');
const YEARS = Number(arg('years', '6'));
const PER_DAY = Number(arg('per-day', '2'));

const isAbility = (t: string): t is AbilityId => ABILITY_DEFS.some((d) => d.id === t);
const fullOf = (sim: Simulation, t: Target) => (isAbility(t) ? abilityFull(sim, sim.player, t) : 100);
const level = (sim: Simulation, t: Target) => levelOf(sim, sim.player, t);
const dayKey = (sim: Simulation) => { const p = zonedParts(sim.now, sim.zone); return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`; };

/** A session on a target through its command: an exercise, a workout for Stamina, any exercise for Discipline. Returns whether it was spent, or why not. */
function train(sim: Simulation, t: Target, sessionsToday: Map<string, number>): true | string {
  const k = `${dayKey(sim)}:${t}`;
  const n = sessionsToday.get(k) ?? 0;
  if (t === 'stamina') {
    if (n >= 1) return 'one workout a day';
    const no = lookAfterRefusal(sim, 'exercise');
    if (no) return no;
    if (!sim.execute({ kind: 'life.look_after', payload: { action: 'exercise' } }).ok) return 'refused';
    sessionsToday.set(k, n + 1);
    return true;
  }
  if (practicedToday(sim, sim.player) >= PRACTICE.dailyHours) return 'four hours today';
  if (n >= PER_DAY) return 'sessions a day';
  // Discipline grows from a day's practice kept (`PRACTICE.disciplineDay`): any exercise, once a day.
  const e = t === 'discipline' ? (practicedToday(sim, sim.player) > 0 ? undefined : EXERCISES.find((x) => !practiceRefusal(sim, sim.player, x))) : exerciseFor(t as AbilityId | Skill);
  if (!e) return t === 'discipline' ? 'already practised today' : 'no exercise';
  const no = practiceRefusal(sim, sim.player, e);
  if (no) return no;
  const r = sim.execute({ kind: 'practice.exercise', payload: { exercise: e.id } });
  if (!r.ok) return r.error ?? 'refused';
  sessionsToday.set(k, n + 1);
  return true;
}

interface Progress { firstSession?: string; sessions: number; mastered?: { day: number; date: string; sessions: number }; full?: { day: number; date: string; sessions: number }; start: number }

function play(targets: Target[], years: number, stop: (sim: Simulation) => boolean, monthly?: (sim: Simulation) => void, extraHour?: (sim: Simulation) => boolean) {
  let sim = life(SEED, { homeRegionId: 'us-ny-newyork', pronouns: 'she/her' });
  const start = sim.now;
  const end = start + years * 365 * MS_DAY;
  const progress = new Map<Target, Progress>(targets.map((t) => [t, { sessions: 0, start: Math.round(level(sim, t) * 100) / 100 }]));
  const sessionsToday = new Map<string, number>();
  const refused: Record<string, number> = {};
  let reloads = 0;
  let lastReload = sim.now;
  let lastMonth = sim.now;
  const graduatedOn: { date?: string } = {};
  const check = () => {
    const day = Math.floor((sim.now - start) / MS_DAY);
    for (const t of targets) {
      const p = progress.get(t)!;
      const lv = level(sim, t);
      if (!isAbility(t) && !p.mastered && lv >= MASTERED) p.mastered = { day, date: dayKey(sim), sessions: p.sessions };
      if (!p.full && lv >= fullOf(sim, t)) p.full = { day, date: dayKey(sim), sessions: p.sessions };
    }
    if (!graduatedOn.date && sim.player.school?.standing === 'graduated') graduatedOn.date = dayKey(sim);
  };
  const extra = () => {
    if (extraHour?.(sim)) return true;
    // The least full first, as a share of its full; Stamina's workout at seven or in a free hour.
    const order = [...targets].filter((t) => level(sim, t) < fullOf(sim, t)).sort((a, b) => level(sim, a) / fullOf(sim, a) - level(sim, b) / fullOf(sim, b));
    for (const t of order) {
      const r = train(sim, t, sessionsToday);
      if (r === true) { progress.get(t)!.sessions += 1; progress.get(t)!.firstSession ??= dayKey(sim); check(); return true; }
      const why = r.replace(/\d+/g, 'N').slice(0, 60);
      refused[why] = (refused[why] ?? 0) + 1;
    }
    return false;
  };
  while (sim.now < end && sim.universe.meta.endedAt === undefined && !stop(sim)) {
    attentiveHour(sim, extra);
    check();
    if (monthly && sim.now - lastMonth >= 30 * MS_DAY) { lastMonth = sim.now; monthly(sim); }
    if (sim.now - lastReload >= 30 * MS_DAY && zonedParts(sim.now, sim.zone).hour === 12) {
      sim = loadSave(deserialise(serialise(sim.universe)) as never);
      reloads += 1;
      lastReload = sim.now;
    }
  }
  return { sim, start, progress, refused, reloads, graduatedOn };
}

/** The progress as it's reported: each target's start, sessions and the day it was mastered and full. */
const report = (progress: Map<Target, Progress>, sim: Simulation) => Object.fromEntries([...progress].map(([t, p]) => [t, { ...p, end: Math.round(level(sim, t) * 1000) / 1000, fullAt: fullOf(sim, t) }]));

function single(target: Target) {
  const t = targetId(target);
  const r = play([t], YEARS, (sim) => level(sim, t) >= fullOf(sim, t));
  const { sim } = r;
  // Saved and opened again at full: still full, the history still records it.
  const again = loadSave(deserialise(serialise(sim.universe)) as never);
  const p = r.progress.get(t)!;
  const history = developmentOf(sim.player).history.filter((h) => h.id === t);
  return {
    mode: 'single', target: t, seed: SEED, perDay: PER_DAY, ...report(r.progress, sim)[t],
    calendarDays: p.full ? p.full.day : null, reachedFull: Boolean(p.full),
    fullAfterReload: level(again, t) >= fullOf(again, t), historyEntries: history.length,
    graduated: r.graduatedOn.date ?? null, standing: sim.player.school?.standing, refused: r.refused,
    breaches: breaches(sim.universe).length, unbalanced: sim.ledger.audit().length, reloads: r.reloads,
  };
}

function plan(genre: string) {
  const camera = TASK_PROFILES.camera!;
  const abilities = [...new Set(Object.values(camera.dims).flatMap((d) => d!.inputs.flatMap((i) => ('ability' in i ? [i.ability] : []))))];
  const techniques = (Object.keys(tapeReads(genre)) as Skill[]).filter((s) => TECHNIQUES.includes(s));
  const targets: Target[] = [...abilities, ...techniques];
  const tapes: { date: string; overall: number; mastery: boolean; readiness: number }[] = [];
  const tape = (sim: Simulation) => {
    const no = selfTapeRefusal(sim, sim.player, genre);
    if (no) return false;
    const r = sim.execute({ kind: 'practice.self_tape', payload: { genre } });
    if (!r.ok) return false;
    const w = sim.player.work!.at(-1)!;
    tapes.push({ date: dayKey(sim), overall: w.overall, mastery: w.mastery, readiness: Math.round(w.inputs.condition.readiness) });
    return true;
  };
  let tapeDue = false;
  const ready = (sim: Simulation) => targets.every((t) => level(sim, t) >= (isAbility(t) ? fullOf(sim, t) : MASTERED)) && genreState(sim.player, genre).familiarity >= SELF_TAPE.genreComplete * 100;
  // The genre studied until it's known, an hour a day; a tape when one is due.
  const extraHour = (sim: Simulation) => {
    if (tapeDue && tape(sim)) { tapeDue = false; return true; }
    if (genreState(sim.player, genre).familiarity < SELF_TAPE.genreComplete * 100 && !studyRefusal(sim, sim.player, genre) && (developmentOf(sim.player).counts[`genre:${genre}<study`] ?? 0) === 0) {
      return sim.execute({ kind: 'genre.study', payload: { genre } }).ok;
    }
    return false;
  };
  const r = play(targets, YEARS, ready, () => { tapeDue = true; }, extraHour);
  let { sim } = r;
  const masteredOn = ready(sim) ? dayKey(sim) : null;
  // At mastery: three tapes on three days through the command, when rested (readiness over the sufficient line).
  const payoff: typeof tapes = [];
  if (masteredOn) {
    for (let n = 0; n < 40 && payoff.length < 3; n += 1) {
      const before = tapes.length;
      const day = dayKey(sim);
      for (let h = 0; h < 24 && tapes.length === before; h += 1) {
        attentiveHour(sim, () => (sim.player.wellbeing.energy > 60 && dayKey(sim) === day && zonedParts(sim.now, sim.zone).hour >= 10 ? tape(sim) : false));
      }
      if (tapes.length > before) payoff.push(tapes.at(-1)!);
      while (dayKey(sim) === day) attentiveHour(sim);
    }
  }
  // Matched twins of the mastered save, each taping at ten the next free morning: healthy, the flu, a sprain, a
  // concussion, a cut, and the flu recovered eight days on.
  const twins: Record<string, unknown> = {};
  if (masteredOn) {
    const base = JSON.stringify(serialise(sim.universe));
    const variants: [string, 'flu' | InjuryKind | undefined, number][] = [['healthy', undefined, 0], ['flu', 'flu', 0], ['sprain', 'sprain', 0], ['concussion', 'concussion', 0], ['deep cut', 'cut', 0], ['flu, recovered', 'flu', 8], ['sprain, recovered', 'sprain', 12]];
    for (const [name, what, after] of variants) {
      const twin = loadSave(deserialise(JSON.parse(base)) as never);
      if (what === 'flu') careFor(twin, twin.player, { care: 'visit', what: 'The flu', flu: true }, twin.now);
      else if (what) { const s = INJURY_KIND[what]; const d = Math.round((s.days[0] + s.days[1]) / 2); healthOf(twin.player).injury = { kind: what, at: twin.now, until: twin.now + d * MS_DAY, ...(s.offWork ? { offWorkUntil: twin.now + d * MS_DAY } : {}) }; }
      const until = twin.now + after * MS_DAY;
      while (twin.now < until) attentiveHour(twin);
      let got: unknown = 'no tape in ten days';
      for (let h = 0; h < 240; h += 1) {
        const hour = zonedParts(twin.now, twin.zone).hour;
        if (hour >= 10 && hour < 20 && twin.player.wellbeing.energy > 60 && !selfTapeRefusal(twin, twin.player, genre)) {
          const ok = twin.execute({ kind: 'practice.self_tape', payload: { genre } });
          const w = twin.player.work!.at(-1)!;
          got = ok.ok ? { overall: w.overall, mastery: w.mastery, dims: w.dims, condition: w.inputs.condition, limits: w.limits.map((l) => `${l.dimension}: ${l.label} (−${l.by})`) } : ok.error;
          break;
        }
        attentiveHour(twin);
      }
      twins[name] = got;
    }
  }
  sim = loadSave(deserialise(serialise(sim.universe)) as never);
  const j = journeyOf(sim.player);
  return {
    mode: 'plan', genre, seed: SEED, targets, masteredOn, graduated: r.graduatedOn.date ?? null, standing: sim.player.school?.standing,
    progress: report(r.progress, sim), familiarity: Math.round(genreState(sim.player, genre).familiarity * 10) / 10,
    tapesOnTheWay: tapes.slice(0, tapes.length - payoff.length), payoff, twins,
    journeyMastery: Object.fromEntries(Object.entries(j.totals).map(([k, x]) => [k, x!.mastery])),
    refused: r.refused, breaches: breaches(sim.universe).length, unbalanced: sim.ledger.audit().length, reloads: r.reloads,
    hours: Math.round((sim.now - r.start) / MS_HOUR),
  };
}

console.log(JSON.stringify(MODE === 'plan' ? plan(arg('genre', 'musical')) : single(arg('target', 'accents') as Target)));
