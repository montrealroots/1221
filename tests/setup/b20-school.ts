/**
 * Brief 20's School area (2026-10-21): what its comparisons share. A life is made through creation's own config and
 * played by the attentive student of `tools/policy.ts` (`attentiveHour`: the menu's urgent care, the evening's work, a
 * free hour on what's due, to bed at eleven), through public commands only. A comparison plays two lives from one seed and
 * changes one thing the player does, through a command (`life.sleep` through a class, a rehearsal or a shift; a payment;
 * a request), at an hour the hook names. Nothing here sets a consequence by hand.
 */
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { instantFromZoned, zonedParts } from '@/engine/core/time';
import { newLifeFrom, type NewSaveConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { attentiveHour } from '../../tools/policy';

export const ZONE = 'America/New_York';
export const at = (year: number, month: number, day: number, hour = 9, minute = 0) => instantFromZoned({ year, month, day, hour, minute }, ZONE);

/**
 * A student made as creation makes one (`newLifeFrom`, the draft carried into a new life: the family and its means from
 * the background chosen), from New York unless the profile says otherwise.
 */
export const student = (seed: string, p: Partial<NewSaveConfig> = {}): Simulation =>
  createSave(1, seed, newLifeFrom({ homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her', ...p }));

/** The save written and opened again, as the app does. */
export const reload = (sim: Simulation): Simulation => loadSave(deserialise(serialise(sim.universe)) as never);

/** The New Haven date and hour of the clock. */
export const partsOf = (sim: Simulation) => {
  const p = zonedParts(sim.now, ZONE);
  return { ...p, weekday: new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay() };
};

/**
 * The attentive student's hours to a moment. `hook` runs first each hour the player is awake: it returns true when it
 * spent the hour (a command that moved the clock), and the policy's hour is then skipped.
 */
export function play(sim: Simulation, until: number, hook?: (sim: Simulation) => boolean): Simulation {
  while (sim.now < until) {
    if (hook && (sim.player.awakeSince ?? 0) <= sim.now && hook(sim)) continue;
    attentiveHour(sim);
  }
  return sim;
}

export const titled = (sim: Simulation, title: string | RegExp) => sim.universe.notifications.filter((n) => (typeof title === 'string' ? n.title === title : title.test(n.title)));
export const pendingOf = (sim: Simulation, kind: string) => sim.universe.scheduled.filter((i) => i.kind === kind && i.status === 'pending' && i.payload.personId === sim.player.id);

/** The player's own accounts, by name, with their balances: the money's whole state, for a comparison's no-leak side. */
export const balances = (sim: Simulation) => Object.fromEntries(Object.values(sim.universe.accounts).filter((a) => a.ownerId === sim.player.id).map((a) => [a.name, a.balance]));

/** The term's tally without the craft it started from, as the review reads it. */
export const tallyOf = (sim: Simulation) => {
  const { classDays, attended, excused, calls, answered, shifts, worked, breaches } = sim.player.school!.tally;
  return { classDays, attended, excused, calls, answered, shifts, worked, breaches };
};
