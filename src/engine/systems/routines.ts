/**
 * SLATE — routines (Stage 5 of `docs/BACKLOG.md`, from 2026-10-01): a named
 * list of the things somebody does in order, a morning's shower, breakfast
 * and outfit, saved and run again. Each step is the same command the screens
 * run, with the same checks, its own time and its own refusals, so a routine
 * can't do anything its steps couldn't. It runs in order and stops at the
 * first step that can't be done, saying which and why; what was done before
 * it stays done.
 *
 * Steps are the everyday ones a routine is made of: looking after yourself,
 * eating what's ready or cooking a recipe (from 2026-10-06 for the servings
 * chosen, until then always what it makes), and putting on an outfit. A
 * drink at home names a bottle, which next time is gone, so it isn't a
 * step. Up to twelve.
 *
 * **At a time** (from 2026-10-02): a routine can be set for an hour on the
 * days of the week chosen, in the local time where you are. Its moment stops
 * the clock as anything that wants you does (`stopsClock`), without being a
 * commitment that keeps you from anything else, and the
 * screen runs it then, as Run It would: each step a command of its own,
 * with its own checks, undone if it fails. A routine isn't run inside the
 * world's own turning of the clock, where a step that failed halfway
 * couldn't be undone; a life played without a screen gets the moment and
 * runs nothing.
 */

import type { Simulation, CommandResult } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { LOOKING_AFTER, type LookAfter } from './life';
import { recipeById, servingsRange } from './kitchen';
import { COURSES } from '../content/school';
import { TEMPLATES } from '../content/coursework';
import { instantFromZoned, zonedParts, type Instant } from '../core/time';

export interface RoutineStep { kind: string; payload: Record<string, unknown> }
export interface Routine { id: string; name: string; steps: RoutineStep[]; /** Set for an hour on days of the week, 0 Sunday (from 2026-10-02). */ at?: RoutineTime }
export interface RoutineTime { hour: number; minute: number; days: number[] }

export const ROUTINE_DUE_KIND = 'routine.due';

/** The next moment a routine set for a time comes, after an instant, in the local time where you are. */
export function nextRoutineAt(sim: Simulation, after: Instant, t: RoutineTime): Instant | undefined {
  const zone = sim.zone;
  const today = zonedParts(after, zone);
  for (let d = 0; d <= 7; d += 1) {
    const day = new Date(Date.UTC(today.year, today.month - 1, today.day + d));
    if (!t.days.includes(day.getUTCDay())) continue;
    const at = instantFromZoned({ year: day.getUTCFullYear(), month: day.getUTCMonth() + 1, day: day.getUTCDate(), hour: t.hour, minute: t.minute }, zone);
    if (at > after) return at;
  }
  return undefined;
}

function scheduleNext(sim: Simulation, routine: Routine, after: Instant): void {
  for (const one of sim.universe.scheduled) if (one.status === 'pending' && one.kind === ROUTINE_DUE_KIND && one.payload.routineId === routine.id) sim.timeline.cancel(one.id, sim.now);
  const at = routine.at ? nextRoutineAt(sim, after, routine.at) : undefined;
  if (at !== undefined) sim.schedule({ at, kind: ROUTINE_DUE_KIND, label: routine.name, category: 'personal', priority: 40, stopsClock: true, payload: { routineId: routine.id } });
}

/** Why a time can't be set, or nothing. */
export function routineTimeRefusal(t: Partial<RoutineTime>): string | undefined {
  if (!Number.isInteger(t.hour) || t.hour! < 0 || t.hour! > 23 || !Number.isInteger(t.minute) || t.minute! < 0 || t.minute! > 59) return 'Choose an hour and a minute.';
  if (!Array.isArray(t.days) || t.days.length === 0 || t.days.some((d) => !Number.isInteger(d) || d < 0 || d > 6)) return 'Choose the days.';
  return undefined;
}

/** The commands a step can be. */
// A course's preparation too (from 2026-10-07): a step names the course, so it does whatever work that course has open,
// with every check the button has; a refusal (nothing open, a need not met, new feedback unread) stops the routine there.
// A part's lines learned between calls joined them on 2026-10-07 (`school.learn_part`, `systems/production.ts`); catching up the
// blocking and working a note answer what happened at a call, so they stay the player's.
export const ROUTINE_COMMANDS = new Set(['life.look_after', 'food.eat_ready', 'food.cook', 'clothes.wear_outfit', 'school.prepare', 'school.learn_part']);
export const MAX_STEPS = 12;

export const routinesOf = (person: Person): Routine[] => (person.routines ??= []);

/** A step in words, Title Case, as a list shows it. */
export function stepLabel(person: Person, step: RoutineStep): string {
  switch (step.kind) {
    case 'life.look_after': return LOOKING_AFTER[step.payload.action as LookAfter]?.label ?? 'Look After Yourself';
    case 'food.eat_ready': return 'Eat Something Ready';
    case 'food.cook': return `Cook ${recipeById(String(step.payload.recipeId))?.name ?? 'A Recipe'}${step.payload.servings === undefined ? '' : `, ${Number(step.payload.servings)} Servings`}`;
    case 'clothes.wear_outfit': return `Wear ${person.outfits?.find((o) => o.id === step.payload.outfitId)?.name ?? 'An Outfit'}`;
    case 'school.prepare': return `${COURSES.find((c) => c.code === step.payload.course)?.name ?? 'A Course'}: ${TEMPLATES.flatMap((t) => t.activities).find((a) => a.id === step.payload.activity)?.label ?? 'Prepare'}`;
    case 'school.learn_part': return step.payload.which === 'rep' ? 'Learn Your Part At Yale Rep' : 'Learn Your Part';
    default: return step.kind;
  }
}

/** Why these steps can't be a routine, or nothing. */
export function routineRefusal(name: string, steps: readonly RoutineStep[]): string | undefined {
  if (!name.trim()) return 'Give it a name.';
  if (steps.length === 0) return 'Add a step.';
  if (steps.length > MAX_STEPS) return `Twelve steps at most.`;
  if (steps.some((s) => !ROUTINE_COMMANDS.has(s.kind))) return 'A routine is made of everyday things.';
  if (steps.some((s) => s.kind === 'life.look_after' && !LOOKING_AFTER[s.payload.action as LookAfter])) return 'That isn’t something you can do for yourself.';
  if (steps.some((s) => s.kind === 'school.learn_part' && s.payload.which !== undefined && s.payload.which !== 'school' && s.payload.which !== 'rep')) return 'That isn’t a part you could be cast in.';
  // A school step names a course that has work, and a step that work has.
  for (const s of steps) {
    if (s.kind !== 'school.prepare') continue;
    const course = String(s.payload.course);
    const ts = TEMPLATES.filter((t) => t.courses.includes(course));
    if (!ts.length) return 'That course sets no work to prepare.';
    if (!ts.some((t) => t.activities.some((a) => a.id === s.payload.activity && a.dim !== 'partner'))) return 'That isn’t a step of the course’s work.';
  }
  // A cook step can carry its servings (from 2026-10-06; until then it cooked
  // what the recipe makes, always), checked here against the recipe's range
  // as food.cook checks it, so a routine isn't saved to fail at that step.
  for (const s of steps) {
    if (s.kind !== 'food.cook') continue;
    const r = recipeById(String(s.payload.recipeId));
    if (!r) return 'There’s no such recipe.';
    if (s.payload.servings === undefined) continue;
    const n = Number(s.payload.servings);
    const range = servingsRange(r);
    if (!Number.isInteger(n) || n < range.least || n > range.most) return `${r.name} cooks from ${range.least} to ${range.most} servings.`;
  }
  return undefined;
}

export interface RoutineRun { done: number; stopped?: { step: number; label: string; error: string } }

/**
 * Runs a routine: each step as its own command, through the executor given
 * (the world's, or a screen's that says what happened), until one can't be
 * done.
 */
export function runRoutine(sim: Simulation, routineId: string, exec: (kind: string, payload: Record<string, unknown>) => CommandResult = (kind, payload) => sim.execute({ kind, payload })): RoutineRun {
  const routine = routinesOf(sim.player).find((r) => r.id === routineId);
  if (!routine) return { done: 0, stopped: { step: 0, label: 'The Routine', error: 'No such routine.' } };
  for (let i = 0; i < routine.steps.length; i += 1) {
    const step = routine.steps[i]!;
    const result = exec(step.kind, step.payload);
    if (!result.ok) return { done: i, stopped: { step: i, label: stepLabel(sim.player, step), error: result.error ?? 'It couldn’t be done.' } };
  }
  return { done: routine.steps.length };
}

export function registerRoutines(sim: Simulation): void {
  sim.onCommand<{ name: string; steps: RoutineStep[] }, { routineId: string }>('routine.save', (p, { sim: s }) => {
    const name = String(p?.name ?? '').trim();
    const steps = Array.isArray(p?.steps) ? p.steps.map((x) => ({ kind: String(x?.kind), payload: { ...(x?.payload ?? {}) } })) : [];
    const no = routineRefusal(name, steps);
    if (no) throw new CommandError(no);
    const routine: Routine = { id: s.nextId('routine'), name, steps };
    routinesOf(s.player).push(routine);
    return { routineId: routine.id };
  });
  sim.onCommand<{ routineId: string; at?: RoutineTime | null }, { next?: Instant }>('routine.set_time', (p, { sim: s }) => {
    const routine = routinesOf(s.player).find((r) => r.id === p?.routineId);
    if (!routine) throw new CommandError('No such routine.');
    if (!p.at) { delete routine.at; scheduleNext(s, routine, s.now); return {}; }
    const no = routineTimeRefusal(p.at);
    if (no) throw new CommandError(no);
    routine.at = { hour: p.at.hour, minute: p.at.minute, days: [...new Set(p.at.days)].sort() };
    scheduleNext(s, routine, s.now);
    return { next: nextRoutineAt(s, s.now, routine.at) };
  });
  // Its moment past, the next one set; the screen runs it as the clock stops there.
  sim.onSchedule(ROUTINE_DUE_KIND, (item, s) => {
    const routine = routinesOf(s.player).find((r) => r.id === item.payload.routineId);
    if (routine?.at) scheduleNext(s, routine, s.now);
  });
  sim.onCommand<{ routineId: string }, { routines: number }>('routine.delete', (p, { sim: s }) => {
    const gone = routinesOf(s.player).find((r) => r.id === p?.routineId);
    // One that isn't there is refused, not reported deleted (from 2026-10-06).
    if (!gone) throw new CommandError('There’s no routine of yours by that name.');
    if (gone) { delete gone.at; scheduleNext(s, gone, s.now); }
    s.player.routines = routinesOf(s.player).filter((r) => r.id !== p?.routineId);
    return { routines: s.player.routines.length };
  });
}
