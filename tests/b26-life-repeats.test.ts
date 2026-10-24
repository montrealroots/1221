/**
 * Brief 26's life trace (2026-10-24), its section 4, on the day's own commands: a plan of your own called off twice,
 * skipped before it starts, and kept or skipped once it has; an hour of looking after yourself sent twice with one
 * `actionId`, a retry after a lost answer, lived and paid once; a night that can't start in the past or inside a
 * commitment. Read at each handler (world/plans.ts, systems/life.ts) and held here on a played life.
 *
 * PLAYER JOURNEY: a New Yorker at Yale in New Haven from Monday 24 August 2026 (`createSave` with `newLifeConfig`), as
 * tests/b26-papers-repeats.test.ts makes one. TEST SETUP, said where it's done: the body kept fed and rested as the
 * clock moves (`tended`).
 */
import { describe, expect, it } from 'vitest';
import { createSave, loadSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { MS_DAY, MS_HOUR, instantFromZoned, zonedParts } from '@/engine/core/time';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { PLAN_KIND } from '@/engine/world/plans';

const NY = 'America/New_York';
const life = (seed: string) => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
const reload = (sim: Simulation) => loadSave(deserialise(serialise(sim.universe)) as never);
const titled = (sim: Simulation, title: string) => sim.universe.notifications.filter((n) => n.title === title);
const plans = (sim: Simulation) => sim.universe.scheduled.filter((i) => i.kind === PLAN_KIND);
const error = (r: { ok: boolean }) => ((r as { ok: true; value: { ok: boolean; error?: string } }).value?.error ?? (r as { ok: false; error: string }).error);
const meals = (sim: Simulation) => sim.universe.transactions.filter((t) => t.category === 'food' && t.memo === 'A meal');

/** TEST SETUP: rested, fed, steady and awake each time the clock moves, six hours at a time. */
function tended(sim: Simulation, until: number): void {
  while (sim.now < until) {
    Object.assign(sim.player.wellbeing, { energy: 90, stress: 10, sleepDebt: 0, nourishment: 80, morale: 75, condition: 90 });
    sim.player.awakeSince = Math.min(sim.player.awakeSince ?? sim.now, sim.now);
    sim.advanceTo(Math.min(until, sim.now + 6 * MS_HOUR));
  }
}

describe('the day’s own commands pressed twice, reloaded and called off', () => {
  it('a plan: called off once, the second press refused; another skipped only once it has begun, once; a third kept across a reload, once', () => {
    const sim = life('b26-life-plans');
    const at = sim.now + 3 * MS_DAY;
    const made = sim.execute<{ ok: boolean; id?: string }>({ kind: 'calendar.schedule', payload: { title: 'Coffee with Sam', at, durationMinutes: 60 } });
    expect(made.ok && made.value?.ok).toBe(true);
    const id = (made as { ok: true; value: { id: string } }).value.id;
    expect(plans(sim).filter((p) => p.status === 'pending')).toHaveLength(1);
    // Skipping it before it starts is refused: it's called off instead.
    expect(error(sim.execute({ kind: 'calendar.skip', payload: { entryId: id } }))).toBe('It hasn’t started yet. To drop it, open it on the Calendar and press Call It Off.');
    expect((sim.execute<{ ok: boolean }>({ kind: 'calendar.cancel', payload: { entryId: id } }) as { ok: true; value: { ok: boolean } }).value.ok).toBe(true);
    expect(plans(sim).find((p) => p.id === id)!.status).toBe('cancelled');
    expect(error(sim.execute({ kind: 'calendar.cancel', payload: { entryId: id } }))).toBe('That’s already over: it was kept, missed or called off.');
    expect(error(sim.execute({ kind: 'calendar.skip', payload: { entryId: id } }))).toBe('That’s already over: it was kept, missed or called off.');
    // A second plan, reached by the clock, skipped at its stop once; the third, kept, is done once across a reload. Each
    // in the evening, clear of the School's day; the clock is carried to the minute before the second, so its stop is
    // the plan's and not a class's.
    const evening = (days: number) => instantFromZoned({ ...zonedParts(sim.now + days * MS_DAY, NY), hour: 21, minute: 30, second: 0 }, NY);
    const secondAt = evening(1);
    const second = sim.execute<{ ok: boolean; id?: string }>({ kind: 'calendar.schedule', payload: { title: 'A run by the river', at: secondAt, durationMinutes: 30 } });
    const secondId = (second as { ok: true; value: { id: string } }).value.id;
    const third = sim.execute<{ ok: boolean; id?: string }>({ kind: 'calendar.schedule', payload: { title: 'Dinner', at: evening(2), durationMinutes: 90 } });
    const thirdId = (third as { ok: true; value: { id: string } }).value.id;
    tended(sim, secondAt - 60_000);
    const stop = sim.advanceTo(secondAt + MS_HOUR, { stopOnPlayerRequired: true });
    expect(stop.interruptedBy?.id).toBe(secondId);
    expect((sim.execute<{ ok: boolean }>({ kind: 'calendar.skip', payload: { entryId: secondId } }) as { ok: true; value: { ok: boolean } }).value.ok).toBe(true);
    expect(plans(sim).find((p) => p.id === secondId)!.status).toBe('missed');
    expect(error(sim.execute({ kind: 'calendar.skip', payload: { entryId: secondId } }))).toBe('That’s already over: it was kept, missed or called off.');
    expect(titled(sim, 'You Didn’t Go To A run by the river')).toHaveLength(1);
    const back = reload(sim);
    expect(plans(back).filter((p) => p.status === 'pending').map((p) => p.id)).toEqual([thirdId]);
    tended(back, back.now + 2 * MS_DAY);
    const dinner = plans(back).find((p) => p.id === thirdId)!;
    expect(dinner.status).toBe('done');
    expect(titled(back, 'You Missed Dinner')).toHaveLength(0);
    expect(plans(back).filter((p) => p.label === 'Dinner')).toHaveLength(1);
  });

  it('Eat A Meal sent twice with one actionId, a retry after a lost answer: lived once, paid once, the second refused', () => {
    const sim = life('b26-life-retry');
    const person = sim.player;
    person.wellbeing.nourishment = 40;
    const before = { at: sim.now, meals: meals(sim).length };
    const first = sim.execute({ kind: 'life.look_after', payload: { action: 'eat', actionId: 'b26-eat-1' } });
    expect(first.ok).toBe(true);
    expect(sim.now - before.at).toBe(40 * 60_000);
    expect(meals(sim).length - before.meals).toBe(1);
    const fed = person.wellbeing.nourishment;
    const again = sim.execute({ kind: 'life.look_after', payload: { action: 'eat', actionId: 'b26-eat-1' } });
    expect(again.ok).toBe(false);
    expect(sim.now - before.at).toBe(40 * 60_000);
    expect(meals(sim).length - before.meals).toBe(1);
    expect(person.wellbeing.nourishment).toBe(fed);
  });

  it('a night can’t start in the past, and one booked more than a day ahead is refused', () => {
    const sim = life('b26-life-night');
    expect(error(sim.execute({ kind: 'life.sleep', payload: { hours: 8, startAt: sim.now - MS_HOUR } }))).toBe('You can’t go to sleep in the past.');
    expect(error(sim.execute({ kind: 'life.sleep', payload: { hours: 8, startAt: sim.now + MS_DAY + MS_HOUR } }))).toBe('A night can be planned a day ahead at most.');
    expect(error(sim.execute({ kind: 'life.sleep', payload: { hours: 'soon' } }))).toBe('Say how long to sleep.');
  });
});
