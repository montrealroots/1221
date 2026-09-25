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

import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { quickSave } from '@/engine';
import { CITIES } from '@/engine/content/geography';
import type { Simulation } from '@/engine';
import { MS_DAY, MS_HOUR, MS_MINUTE } from '@/engine/core/time';
import { entriesBetween, nextCommitment, upcoming } from '@/engine/world/calendar';
import { unreadNotifications } from '@/engine/world/world';
import {
  FURTHEST_AHEAD_DAYS, LONGEST_MINUTES, LONGEST_TITLE, PLAN_KIND, checkPlan,
} from '@/engine/world/plans';

const PLANS_SOURCE = readFileSync(new URL('../src/engine/world/plans.ts', import.meta.url), 'utf8');

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
      [{ title: 'Blink', at: sim.now + MS_DAY, durationMinutes: 1 }, /five minutes/i],
      [{ title: 'Forever', at: sim.now + MS_DAY, durationMinutes: LONGEST_MINUTES + 1 }, /longer than a day/],
      [{ title: 'Elsewhere', at: sim.now + MS_DAY, locationId: 'atlantis' }, /nowhere by that name/],
      [{ title: 'A Holiday', at: sim.now + MS_DAY, category: 'holiday' }, /can’t put that kind of day/],
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
    // No day job, so the plan is the only thing ahead.
    const sim = quickSave({ dayJob: false }, 'cancel-mine');
    const made = put(sim, { title: 'Dinner', at: sim.now + MS_DAY });
    expect(callOff(sim, made.id!).ok).toBe(true);
    // Rent and the card's statement are ahead too; the plan isn't.
    expect(upcoming(sim, 5).filter((e) => e.id === made.id)).toHaveLength(0);
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
    // As the screen does: the clock stops at it, which wakes them for it, and
    // goes on. Run straight over at half past seven, a sound sleeper is still
    // asleep, and it's missed.
    const target = sim.now + 3 * MS_DAY;
    const moved = sim.advanceTo(target, { stopOnPlayerRequired: true });
    expect(moved.interruptedBy?.id).toBe(made.id);
    sim.advanceTo(target, { resumes: moved.sentFrom });
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
    // Named from where the player is rather than typed out, so changing the
    // default town does not quietly turn this into a test of the old one.
    expect(told!.body).toContain(CITIES.get(sim.player.currentLocationId)!.name);
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

describe('the form and the engine agree about what a plan has', () => {
  const FORM = readFileSync(new URL('../src/ui/workspaces/CalendarWorkspace.tsx', import.meta.url), 'utf8');

  it('sends every part of a plan the engine acts on', () => {
    // This is the gate that once caught a whole subsystem going quiet: a
    // field the command took and no screen sent.
    //
    // Two are deliberate absences. `locationId`: nothing in the game moves
    // you anywhere, so offering a city would be offering a plan you are
    // certain to miss; it goes on this list the day travel does. `category`:
    // there is one kind of day a person can plan now, and the engine fills it
    // in.
    const NOT_ASKED = new Set(['locationId', 'category']);
    const declared = [...PLANS_SOURCE.matchAll(/^\s{2}(\w+)\??:/gm)]
      .map((match) => match[1]!)
      .filter((field, index, all) => all.indexOf(field) === index);
    const inSpec = declared.slice(declared.indexOf('title'), declared.indexOf('locationId') + 1);

    // The payload itself, not the file. The first draft of this asked whether
    // the field appeared anywhere in the source, which every one of them does
    // — the control that sets it is in the same file — so deleting it from
    // the call it is sent in changed nothing and the gate stayed green.
    const call = FORM.indexOf("'calendar.schedule'");
    expect(call, 'the form no longer schedules anything').toBeGreaterThan(-1);
    const open = FORM.indexOf('{', call);
    const payload = FORM.slice(open, FORM.indexOf('}', open));

    const missing = inSpec.filter((field) => !NOT_ASKED.has(field) && !payload.includes(field));
    expect(missing, 'the plan form does not send these, so the engine never sees them').toEqual([]);
  });

  it('stops the clock from a screen, so a plan is never resolved behind you', () => {
    // The other half of the same bug the payload gate guards. The world's own
    // advanceTo runs straight over a commitment and marks it attended; every
    // screen that moves the clock has to stop at one instead, or the choice
    // between going and not never reaches the player and the dialog warning
    // you are about to miss something is describing a thing that cannot
    // happen.
    const CONTEXT = readFileSync(new URL('../src/app/game-context.tsx', import.meta.url), 'utf8');
    for (const call of ['sim.advanceBy(', 'sim.advanceTo(']) {
      const at = CONTEXT.indexOf(call);
      expect(at, `${call} is gone from the game context`).toBeGreaterThan(-1);
      const line = CONTEXT.slice(at, CONTEXT.indexOf(')', at) + 1);
      expect(line, `${call} does not stop at what wants you`).toContain('stopOnPlayerRequired: true');
    }
  });

  it('offers the choice at the moment, and the choice reaches the engine', () => {
    // Two halves in two files, because the halt outlived the control that
    // caused it: the live tick can be halted as well as the Advance menu, so
    // the provider holds where the clock stopped and the controls put the
    // question on screen.
    const CONTEXT = readFileSync(new URL('../src/app/game-context.tsx', import.meta.url), 'utf8');
    const CONTROLS = readFileSync(new URL('../src/ui/shell/TimeControls.tsx', import.meta.url), 'utf8');

    expect(CONTEXT, 'nothing reads where the clock stopped').toContain('interruptedBy');
    // The pause itself, not the spelling of it. It used to be an assignment
    // into `sim.universe` from a React component — the one write in the whole
    // interface that skipped the engine — and this held that assignment in
    // place rather than the behavior it stood for.
    expect(CONTEXT, 'the world keeps ticking while it waits on you').toContain("timeSpeed: 'paused'");
    const sim = quickSave({}, 'halted');
    expect(sim.universe.preferences.timeSpeed).not.toBe('paused');
    sim.execute({ kind: 'world.set_preferences', payload: { timeSpeed: 'paused' } });
    expect(sim.universe.preferences.timeSpeed, 'the clock could not be stopped through a command')
      .toBe('paused');
    expect(CONTROLS, 'the halt never reaches a screen').toContain('standingAt');
    expect(CONTROLS, 'not going never reaches the engine').toContain("'calendar.skip'");
  });

  it('stops the live clock too, not only the ones a person presses', () => {
    // The bug the browser caught and the unit tests could not: the clock ran
    // the commitment while the player was standing in front of the question
    // about it, so pressing Don't Go answered "that's already settled".
    const CONTEXT = readFileSync(new URL('../src/app/game-context.tsx', import.meta.url), 'utf8');
    const tick = CONTEXT.indexOf('setInterval');
    expect(tick, 'the live clock is gone').toBeGreaterThan(-1);
    const loop = CONTEXT.slice(tick, CONTEXT.indexOf('}, TICK_MS)', tick));
    expect(loop, 'the live clock runs over what wants you').toContain('stopOnPlayerRequired: true');
    expect(loop, 'the live clock does not halt').toContain('halt(');
  });
});

describe('not going', () => {
  const skip = (sim: Simulation, entryId: string): Answer =>
    sim.execute<Answer>({ kind: 'calendar.skip', payload: { entryId } }).value!;

  const dinner = (seed: string) => {
    const sim = quickSave({}, seed);
    const made = put(sim, { title: 'Dinner', at: sim.now + 2 * MS_HOUR, durationMinutes: 90 });
    return { sim, id: made.id! };
  };

  it('is refused before the thing has come round', () => {
    const { sim, id } = dinner('skip-too-early');
    expect(skip(sim, id).error).toBe('It hasn’t come round yet. Call it off instead.');
  });

  it('marks it missed once you are standing at it', () => {
    const { sim, id } = dinner('skip-at-it');

    // The clock stops at it rather than running over it.
    const stopped = sim.advanceTo(sim.now + MS_DAY, { stopOnPlayerRequired: true });
    expect(stopped.interruptedBy?.id).toBe(id);
    expect(sim.timeline.get(id)!.status).toBe('pending');

    expect(skip(sim, id).ok).toBe(true);
    expect(sim.timeline.get(id)!.status).toBe('missed');
    const said = unreadNotifications(sim).map((one) => `${one.title} ${one.body}`).join(' ');
    expect(said).toContain('You Didn’t Go To Dinner');
    expect(said).toContain('Nobody was waiting on it but you');
  });

  it('is refused twice over, and refused for something that is not yours', () => {
    const { sim, id } = dinner('skip-twice');
    sim.advanceTo(sim.now + MS_DAY, { stopOnPlayerRequired: true });
    expect(skip(sim, id).ok).toBe(true);
    expect(skip(sim, id).error).toBe('That’s already settled one way or the other.');
    expect(skip(sim, 'sched_nope').error).toBe('There’s nothing by that name on the calendar.');
  });
});

describe('calling it off', () => {
  it('is refused once the thing has started', () => {
    const sim = quickSave({}, 'calloff-started');
    const made = put(sim, { title: 'Dinner', at: sim.now + 2 * MS_HOUR, durationMinutes: 90 });
    sim.advanceTo(sim.now + MS_DAY, { stopOnPlayerRequired: true });
    expect(callOff(sim, made.id!).error).toBe('It’s already started. You either went or you didn’t.');
  });
});
