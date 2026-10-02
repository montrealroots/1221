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
 * eating what's ready or cooking a recipe, and putting on an outfit. A
 * drink at home names a bottle, which next time is gone, so it isn't a
 * step. Up to twelve.
 */

import type { Simulation, CommandResult } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { LOOKING_AFTER, type LookAfter } from './life';
import { recipeById } from './kitchen';

export interface RoutineStep { kind: string; payload: Record<string, unknown> }
export interface Routine { id: string; name: string; steps: RoutineStep[] }

/** The commands a step can be. */
export const ROUTINE_COMMANDS = new Set(['life.look_after', 'food.eat_ready', 'food.cook', 'clothes.wear_outfit']);
export const MAX_STEPS = 12;

export const routinesOf = (person: Person): Routine[] => (person.routines ??= []);

/** A step in words, Title Case, as a list shows it. */
export function stepLabel(person: Person, step: RoutineStep): string {
  switch (step.kind) {
    case 'life.look_after': return LOOKING_AFTER[step.payload.action as LookAfter]?.label ?? 'Look After Yourself';
    case 'food.eat_ready': return 'Eat Something Ready';
    case 'food.cook': return `Cook ${recipeById(String(step.payload.recipeId))?.name ?? 'A Recipe'}`;
    case 'clothes.wear_outfit': return `Wear ${person.outfits?.find((o) => o.id === step.payload.outfitId)?.name ?? 'An Outfit'}`;
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
  sim.onCommand<{ routineId: string }, { routines: number }>('routine.delete', (p, { sim: s }) => {
    s.player.routines = routinesOf(s.player).filter((r) => r.id !== p?.routineId);
    return { routines: s.player.routines.length };
  });
}
