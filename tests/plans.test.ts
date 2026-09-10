/**
 * Putting something on your own calendar.
 *
 * Everything else on the calendar is the world's — a holiday a country keeps,
 * a commitment something else made for you. This is the other half: a person
 * deciding to be somewhere at a time, and the world holding them to it.
 *
 * A plan is an ordinary timeline item, so what matters here is the edges. That
 * the calendar refuses what it should refuse and says why. That a plan you
 * made is yours to call off and nothing else is. That the clock stops when one
 * comes round. And that being somewhere else when it does is a thing the world
 * notices.
 */

import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import type { Simulation } from '@/engine';
import { MS_DAY, MS_HOUR, MS_MINUTE } from '@/engine/core/time';
import { entriesBetween, nextCommitment, upcoming } from '@/engine/world/calendar';
import { unreadNotifications } from '@/engine/world/world';
import {
  FURTHEST_AHEAD_DAYS, LONGEST_MINUTES, LONGEST_TITLE, PLAN_KIND, checkPlan,
} from '@/engine/world/plans';

interface Answer { ok: boolean; id?: string; error?: string }

const put = (sim: Simulation, payload: Record<string, unknown>): Answer =>
  sim.execute<Answer>({ kind: 'calendar.schedule', payload }).value!;
const callOff = (sim: Simulation, entryId: string): Answer =>
  sim.execute<Answer>({ kind: 'calendar.cancel', payload: { entryId } }).value!;

describe('making a plan', () => {
  it('puts it on the calendar, where everything else can see it', () => {
    const sim = quickSave({}, 'plan-basic');
    const answer = put(sim, { title: 'Table Read', at: sim.now + 2 * MS_DAY, durationMinutes: 120 });
    expect(answer.ok).toBe(true);

    const next = nextCommitment(sim)!;
    expect(next.title).toBe('Table Read');
    expect(next.durationMinutes).toBe(120);
    // It wants the player, which is what makes the clock stop at it.
    expect(next.requiresPlayer).toBe(true);
    expect(upcoming(sim, 5).map((e) => e.title)).toContain('Table Read');
  });

  it('tidies the name rather than printing it back raw', () => {
    const sim = quickSave({}, 'plan-title');
    put(sim, { title: '   table\n\n   read   ', at: sim.now + MS_DAY });
    expect(nextCommitment(sim)!.title).toBe('table read');
    put(sim, { title: 'x'.repeat(200), at: sim.now + 2 * MS_DAY });
    const long = upcoming(sim, 5).find((e) => e.title.startsWith('x'))!;
    expect(long.title.length).toBe(LONGEST_TITLE);
  });

  it('refuses what it cannot take, and says why in words', () => {
    const sim = quickSave({}, 'plan-refuse');
    const cases: [Record<string, unknown>, RegExp][] = [
      [{ title: '   ', at: sim.now + MS_DAY }, /needs a name/],
      [{ title: 'Yesterday', at: sim.now - MS_HOUR }, /been and gone/],
      [{ title: 'Distant', at: sim.now + (FURTHEST_AHEAD_DAYS + 10) * MS_DAY }, /further out than the calendar goes/],
      [{ title: 'Blink', at: sim.now + MS_DAY, durationMinutes: 1 }, /five minutes/],
      [{ title: 'Forever', at: sim.now + MS_DAY, durationMinutes: LONGEST_MINUTES + 1 }, /longer than a day/],
      [{ title: 'Elsewhere', at: sim.now + MS_DAY, locationId: 'atlantis' }, /nowhere by that name/],
      [{ title: 'A Holiday', at: sim.now + MS_DAY, category: 'holiday' }, /kind of day you can put on it yourself/],
    ];
    for (const [payload, why] of cases) {
      const answer = put(sim, payload);
      expect(answer.ok, `${JSON.stringify(payload)} was taken`).toBe(false);
      expect(answer.error, JSON.stringify(payload)).toMatch(why);
    }
    // Nothing refused reached the timeline.
    expect(sim.universe.scheduled.filter((i) => i.kind === PLAN_KIND)).toHaveLength(0);
  });

  it('is asked the same question before the form is offered as after', () => {
    // checkPlan is what a screen calls to know whether to offer; the command
    // calls it too. One rule, so a form can never accept what the calendar
    // then declines.
    const sim = quickSave({}, 'plan-check');
    expect(checkPlan(sim, { title: 'Fine', at: sim.now + MS_DAY }).ok).toBe(true);
    expect(checkPlan(sim, { title: '', at: sim.now + MS_DAY }).ok).toBe(false);
    expect(checkPlan(sim, { title: 'Late', at: sim.now - 1 }).ok).toBe(false);
  });

  it('lets two things want you at once, and flags them', () => {
    // A person can double-book themselves. The calendar's job is to notice,
    // not to refuse.
    const sim = quickSave({}, 'plan-clash');
    put(sim, { title: 'Table Read', at: sim.now + 2 * MS_DAY, durationMinutes: 180 });
    put(sim, { title: 'Fitting', at: sim.now + 2 * MS_DAY + MS_HOUR, durationMinutes: 60 });
    const both = entriesBetween(sim, sim.now, sim.now + 3 * MS_DAY);
    expect(both).toHaveLength(2);
    expect(both.every((e) => e.conflicted)).toBe(true);
  });
});

describe('calling one off', () => {
  it('takes a plan of your own off the calendar', () => {
    const sim = quickSave({}, 'cancel-mine');
    const made = put(sim, { title: 'Dinner', at: sim.now + MS_DAY });
    expect(callOff(sim, made.id!).ok).toBe(true);
    expect(upcoming(sim, 5)).toHaveLength(0);
    expect(sim.timeline.get(made.id!)!.status).toBe('cancelled');
  });

  it('refuses twice, and refuses what is not yours', () => {
    const sim = quickSave({}, 'cancel-refuse');
    const made = put(sim, { title: 'Dinner', at: sim.now + MS_DAY });
    callOff(sim, made.id!);
    expect(callOff(sim, made.id!).error).toMatch(/already settled/);
    expect(callOff(sim, 'sched_nothing').error).toMatch(/nothing by that name/);

    // The world's own work is not the player's to call off.
    const world = sim.universe.scheduled.find((i) => i.kind !== PLAN_KIND && i.status === 'pending');
    expect(world, 'the world schedules nothing at all').toBeDefined();
    expect(callOff(sim, world!.id).error).toMatch(/isn’t yours to call off/);
    expect(sim.timeline.get(world!.id)!.status).toBe('pending');
  });
});

describe('when the moment comes', () => {
  it('stops the clock at it rather than running past', () => {
    const sim = quickSave({}, 'plan-stops');
    const at = sim.now + 2 * MS_DAY;
    put(sim, { title: 'Table Read', at });
    const result = sim.advanceTo(sim.now + 5 * MS_DAY, { stopOnPlayerRequired: true });
    expect(result.interruptedBy?.label).toBe('Table Read');
    expect(sim.now).toBe(at);
  });

  it('is simply done when you were there for it', () => {
    const sim = quickSave({}, 'plan-kept');
    const made = put(sim, { title: 'Table Read', at: sim.now + 2 * MS_DAY });
    const before = unreadNotifications(sim).length;
    sim.advanceTo(sim.now + 3 * MS_DAY);
    expect(sim.timeline.get(made.id!)!.status).toBe('done');
    // No notification: the clock stopped at it and you were looking at it.
    expect(unreadNotifications(sim).length).toBe(before);
  });

  it('is missed, and says so, when it wanted you somewhere you are not', () => {
    const sim = quickSave({}, 'plan-missed');
    const made = put(sim, {
      title: 'Table Read', at: sim.now + 2 * MS_DAY, locationId: 'us-ca-losangeles',
    });
    sim.advanceTo(sim.now + 3 * MS_DAY);
    expect(sim.timeline.get(made.id!)!.status).toBe('missed');
    const told = unreadNotifications(sim).find((n) => /Missed/.test(n.title));
    expect(told, 'nothing said you had missed it').toBeDefined();
    expect(told!.body).toMatch(/Los Angeles/);
    expect(told!.body).toMatch(/Reykjav/);
  });
});

describe('a plan survives being saved', () => {
  it('comes back off a reload with its handler still attached', () => {
    const sim = quickSave({}, 'plan-persist');
    const made = put(sim, { title: 'Table Read', at: sim.now + 2 * MS_DAY, durationMinutes: 90 });
    const item = sim.timeline.get(made.id!)!;
    expect(item.kind).toBe(PLAN_KIND);
    expect(item.durationMinutes).toBe(90);
    // The kind has a handler registered, which is what advancement demands.
    expect(sim.scheduleKinds()).toContain(PLAN_KIND);
    // And it is an ordinary row on the timeline, so the save carries it.
    expect(sim.universe.scheduled.some((i) => i.id === made.id)).toBe(true);
  });

  it('ends where the length says it ends', () => {
    const sim = quickSave({}, 'plan-length');
    const made = put(sim, { title: 'Long One', at: sim.now + MS_DAY, durationMinutes: 240 });
    const entry = entriesBetween(sim, sim.now, sim.now + 2 * MS_DAY).find((e) => e.id === made.id)!;
    expect(entry.endsAt! - entry.at).toBe(240 * MS_MINUTE);
  });
});
