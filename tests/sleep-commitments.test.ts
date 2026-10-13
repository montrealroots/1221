/**
 * A night booked ahead and the commitments around it (from 2026-10-13; `life.sleep` in `systems/life.ts`).
 *
 * The review of 2026-10-13 found two defects in the sleep capability: the notice named as slept through a commitment
 * kept between the booking and the bedtime, and a bedtime that fell inside a commitment still to come was taken, the
 * commitment counted as kept though it was slept through. Both are fixed, and held here, beside the notice for one
 * slept through, which no test read.
 *
 * PLAYER JOURNEYS on a New Haven student's life, through `calendar.schedule` and `life.sleep` (a night booked ahead
 * with `startAt`, which the command takes and the Sleep dialog doesn't send). TEST SETUP: the day rested, so the night
 * is the only thing measured.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import { deserialise, serialise } from '@/engine/persistence/adapter';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { MS_HOUR, instantFromZoned } from '@/engine/core/time';
import type { Simulation } from '@/engine/core/simulation';

const life = (seed: string) => {
  const sim = createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
  // A Sunday in the first fall, nothing of the school's on it (a Saturday has an assigned work-study shift).
  sim.advanceTo(instantFromZoned({ year: 2026, month: 9, day: 13, hour: 9 }, sim.zone));
  return sim;
};
const plan = (sim: Simulation, title: string, inHours: number, hours: number) => {
  const r = sim.execute<{ id: string }>({ kind: 'calendar.schedule', payload: { title, at: sim.now + inHours * MS_HOUR, durationMinutes: hours * 60 } });
  expect(r.ok, r.error).toBe(true);
  return sim.universe.scheduled.find((i) => i.label === title)!;
};
const slept = (sim: Simulation) => sim.universe.notifications.filter((n) => n.title.startsWith('You Slept Through'));

describe('a night booked ahead, and the commitments around it', () => {
  it('doesn’t name a commitment kept before the bedtime as slept through', () => {
    const sim = life('sleep-kept-before');
    const gym = plan(sim, 'Gym', 1, 1);
    const before = slept(sim).length;
    sim.must({ kind: 'life.sleep', payload: { hours: 8, startAt: sim.now + 4 * MS_HOUR } });
    expect(gym.status).toBe('done');
    expect(slept(sim)).toHaveLength(before);
  });

  it('refuses a bedtime inside a commitment still to come, and leaves the save as it was', () => {
    const sim = life('sleep-inside');
    const read = plan(sim, 'Table Read', 1, 3);
    const saved = serialise(sim.universe);
    const at = sim.now;
    const r = sim.execute({ kind: 'life.sleep', payload: { hours: 8, startAt: sim.now + 2 * MS_HOUR } });
    expect(r.error).toMatch(/^You’re at Table Read until /);
    expect(sim.now).toBe(at);
    expect(read.status).toBe('pending');
    expect(serialise(sim.universe)).toBe(saved);
  });

  it('names a commitment slept through, and it’s missed, once, across a reload', () => {
    const sim = life('sleep-through');
    const lunch = plan(sim, 'Lunch With Sam', 2, 1);
    sim.must({ kind: 'life.sleep', payload: { hours: 8 } });
    expect(lunch.status).toBe('missed');
    expect(slept(sim).map((n) => [n.title, n.body])).toEqual([['You Slept Through 1 Commitment', 'Lunch With Sam']]);
    const again = (deserialise(serialise(sim.universe)) as { notifications: { title: string }[] }).notifications.filter((n) => n.title.startsWith('You Slept Through'));
    expect(again).toHaveLength(1);
  });
});
