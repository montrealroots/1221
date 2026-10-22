/**
 * TEST SETUP for brief 20's craft area (`tests/b20-craft-*.test.ts`, docs/verification/audit-2026-10-21/areas/craft):
 * a student made by creation's own config, lived through the clock a day at a time, and the few things a twin comparison
 * holds by hand, each named here so a test can say which it uses.
 *
 * - `tend`: the day's wellbeing held rested and fed each time the clock moves (energy 90, stress 10, no sleep debt,
 *   nourishment 80, hygiene 80, morale 70). Both twins of a comparison are tended alike, so it's never the input under
 *   test, except where a test stops tending one twin to let the clock tire it (`live`'s `upFrom`).
 * - `clearDay`: the clock's commitments that need the player canceled, as tests/workbook.test.ts does, so a command
 *   isn't refused for a class or an orientation session within its hour. Used only by tests that work at commands alone.
 * - `setAbility`: an ability or a technique written before the life is played, the input a comparison changes.
 *
 * Everything else is the game's: the commands as the screens send them, and the clock (`sim.advanceTo`) running the
 * classes, the showings, the calls, the nights and the casting.
 */
import { createSave, loadSave } from '@/engine';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { attributesOf } from '@/engine/systems/attributes';
import { activitiesOf, courseworkOf, prepareRefusal, questionsFor, type Assignment } from '@/engine/systems/coursework';

export const zone = 'America/New_York';
export const at = (year: number, month: number, day: number, hour = 0, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, zone);
export const student = (seed: string, more: Partial<ReturnType<typeof newLifeConfig>> = {}) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...more });

/** The same life saved and opened again: a twin from the moment it's taken. */
export const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);

/** TEST SETUP: rested and fed, as the clock moves. */
export function tend(sim: Simulation): void {
  Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, hygiene: 80, morale: 70 });
  sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
}

/** TEST SETUP: the clock's commitments that need the player, canceled, for a test that works at commands alone. */
export function clearDay(sim: Simulation): void {
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && item.requiresPlayer) sim.timeline.cancel(item.id, sim.now);
}

/** A command as a screen sends it, its refusal thrown so a test fails on it by name. */
export function run<T = Record<string, unknown>>(sim: Simulation, kind: string, payload: Record<string, unknown>): T {
  const r = sim.execute<T>({ kind, payload });
  if (r.error) throw new Error(`${kind} refused: ${r.error}`);
  return r.value as T;
}

const HELD: Record<string, string> = { emotionalDepth: 'emotion', memory: 'memorization', vocal: 'voice', physical: 'movement' };
/** TEST SETUP: an ability (by its id) or a technique (by its skill) set to a level, where the game keeps it. */
export function setAbility(sim: Simulation, id: string, level: number): void {
  const p = sim.player;
  if (HELD[id]) (p.craft as Record<string, number>)[HELD[id]!] = level;
  else if (id === 'stamina') p.wellbeing.fitness = level;
  else if (id in attributesOf(sim, p)) (attributesOf(sim, p) as unknown as Record<string, number>)[id] = level;
  else (p.craft as Record<string, number>)[id] = level;
}

/**
 * A life lived day by day to `until`: tended through the day, an evening at six (or `eveningHour`) for `evening` (the
 * player's own commands), and to bed at eleven for eight hours (`life.sleep`, as the Sleep button sends it). From `upFrom` on, nobody
 * tends them and nobody puts them to bed: the clock moves an hour at a time, as a player who is there moves it, so they
 * stay up and tire as the body's rules tire them (`systems/life.ts`, a clock sent more than an hour sleeps a night alone).
 */
export function live(sim: Simulation, until: number, opts: { evening?: (sim: Simulation, day: number) => void; upFrom?: number; from?: number; eveningHour?: number } = {}): void {
  let day = opts.from ?? at(2026, 8, 24);
  while (day + MS_DAY <= sim.now) day += MS_DAY;
  const up = opts.upFrom ?? Number.POSITIVE_INFINITY;
  const step = (to: number) => {
    while (sim.now < to) {
      if (sim.now < up) { tend(sim); sim.advanceTo(Math.min(to, up, sim.now + 6 * MS_HOUR)); } else sim.advanceTo(Math.min(to, sim.now + MS_HOUR));
    }
  };
  while (day < until && sim.now < until) {
    step(Math.min(until, day + (opts.eveningHour ?? 18) * MS_HOUR));
    if (sim.now >= until) break;
    if (sim.now < up) tend(sim);
    opts.evening?.(sim, day);
    step(Math.min(until, Math.max(sim.now, day + 23 * MS_HOUR)));
    if (sim.now >= until) break;
    if (sim.now < up) { tend(sim); sim.execute({ kind: 'life.sleep', payload: { hours: 8 } }); }
    day += MS_DAY;
  }
  step(until);
}

/** A course's piece open or being revised, where there's one: by default the first-year Scene Study (Acting I, DRAM 103a/b). */
export const sceneStudy = (sim: Simulation, course = 'DRAM 103a/b'): Assignment | undefined => courseworkOf(sim, sim.player)?.assignments.find((a) => a.course === course && (a.status === 'open' || a.status === 'revising'));

/**
 * An evening's work on the Scene Study (or `course`'s piece), as a player does it: the feedback read where `read` (the default), a partner's
 * ask declined, the table work answered as the text supports once the scene is read, and up to `steps` steps, each the
 * first of `order` the piece allows now.
 */
export function workScene(sim: Simulation, order: readonly string[], steps = 2, read = true, course = 'DRAM 103a/b'): void {
  const a = sceneStudy(sim, course);
  if (!a) return;
  if (read && a.feedback && !a.feedback.seen) run(sim, 'school.read_feedback', { assignmentId: a.id });
  for (const k of a.asks ?? []) if (k.status === 'open') sim.execute({ kind: 'school.answer_partner', payload: { assignmentId: a.id, askId: k.id, yes: false } });
  for (const { q, options } of questionsFor(a)) {
    if (a.answers[q.id] || a.prep.familiarity < 0.3) continue;
    sim.execute({ kind: 'school.choose', payload: { assignmentId: a.id, question: q.id, option: options.find((o) => o.supported)!.id } });
  }
  for (let n = 0; n < steps; n += 1) {
    const id = order.find((x) => activitiesOf(a).some((y) => y.id === x) && !prepareRefusal(sim, sim.player, a, x));
    if (!id) return;
    tend(sim);
    if (sim.execute({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: id } }).error) return;
  }
}
