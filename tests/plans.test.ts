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
import type { Simulation } from '@/engine';
import { MS_DAY, MS_HOUR, MS_MINUTE } from '@/engine/core/time';
import { entriesBetween, nextCommitment, upcoming } from '@/engine/world/calendar';
import { unreadNotifications } from '@/engine/world/world';
import { MISSED_COOLS, TOGETHER_WARMS } from '@/engine/world/standing';
import { resolveLook } from '@/ui/looks/registry';
import type { Looked } from '@/ui/looks/registry';
import '@/ui/looks/all';
import {
  CALLING_OFF_COSTS, FURTHEST_AHEAD_DAYS, LONGEST_MINUTES, LONGEST_TITLE, NOTICE_FREE_HOURS,
  PLAN_KIND, callingOffCosts, checkPlan, couldPlanWith,
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

describe('who a plan can be with', () => {
  const family = {
    mother: { firstName: 'Halla', ageAtBirth: 29, role: 'the company' as const },
    father: { firstName: 'Jón', ageAtBirth: 31, role: 'the lot' as const },
    twin: { firstName: 'Katla', gender: 'female' as const, identical: true, role: 'the house' as const },
  };

  it('offers everybody you have a standing with, closest first', () => {
    const sim = quickSave({ family }, 'plan-with-list');
    const offered = couldPlanWith(sim);

    expect(offered.map((one) => one.person.firstName)).toEqual(['Katla', 'Halla', 'Jón']);
    for (let i = 1; i < offered.length; i += 1) {
      expect(offered[i - 1]!.closeness).toBeGreaterThanOrEqual(offered[i]!.closeness);
    }
  });

  it('says what each of them is to you, so a screen never works it out again', () => {
    const sim = quickSave({ family }, 'plan-with-relations');
    const said = Object.fromEntries(couldPlanWith(sim).map((one) => [one.person.firstName, one.relation]));
    expect(said).toEqual({ Halla: 'Mother', Jón: 'Father', Katla: 'Twin Sister' });
  });

  it('never offers you yourself', () => {
    const sim = quickSave({ family }, 'plan-with-not-you');
    expect(couldPlanWith(sim).map((one) => one.person.id)).not.toContain(sim.universe.playerId);
  });

  it('offers nobody at all when you have no people', () => {
    const sim = quickSave({}, 'plan-with-nobody');
    sim.universe.bonds = {};
    expect(couldPlanWith(sim)).toEqual([]);
  });

  it('offers exactly what the calendar will take, and nothing it will refuse', () => {
    // The list and the rule are the same rule read two ways round. A screen
    // that offered anybody else would be offering a refusal.
    const sim = quickSave({ family }, 'plan-with-agrees');
    for (const { person } of couldPlanWith(sim)) {
      const answer = checkPlan(sim, {
        title: 'Dinner', at: sim.now + MS_HOUR, withIds: [person.id],
      });
      expect(answer.ok, `${person.firstName} is offered and refused`).toBe(true);
    }
  });
});

describe('the loop the form closes', () => {
  it('moves a standing through the same payload the screen sends', () => {
    // The whole point of the field. Before it existed the engine took people
    // on a plan, the standing model read them and five floors of drill-down
    // described what they did — and no screen could send one, so every bond
    // in every save drifted to its resting level and stayed there.
    const sim = quickSave({
      family: {
        mother: { firstName: 'Halla', ageAtBirth: 29, role: 'the company' },
        father: { firstName: 'Jón', ageAtBirth: 31, role: 'the lot' },
      },
    }, 'plan-with-loop');
    const halla = couldPlanWith(sim).find((one) => one.person.firstName === 'Halla')!;
    const jon = couldPlanWith(sim).find((one) => one.person.firstName === 'Jón')!;

    // Exactly the shape PlanForm builds.
    const answer = put(sim, {
      title: 'Dinner With Mum',
      at: sim.now + 2 * MS_HOUR,
      durationMinutes: 120,
      category: 'family',
      withIds: [halla.person.id],
    });
    expect(answer.ok).toBe(true);

    sim.advanceTo(sim.now + 3 * MS_HOUR);
    const after = couldPlanWith(sim).find((one) => one.person.firstName === 'Halla')!;
    expect(after.closeness).toBeGreaterThan(halla.closeness);
    // And nobody who was not on it moved.
    expect(couldPlanWith(sim).find((one) => one.person.firstName === 'Jón')!.closeness)
      .toBe(jon.closeness);
  });

  it('takes an empty list, because most plans are with nobody', () => {
    const sim = quickSave({}, 'plan-with-empty');
    expect(put(sim, { title: 'An Hour Of My Own', at: sim.now + MS_HOUR, withIds: [] }).ok).toBe(true);
  });
});

describe('the form and the engine agree about what a plan has', () => {
  const FORM = readFileSync(new URL('../src/ui/workspaces/CalendarWorkspace.tsx', import.meta.url), 'utf8');

  it('sends every part of a plan the engine acts on', () => {
    // This is the gate that would have caught a whole subsystem going quiet.
    // `withIds` was taken by the command, read by the standing model and
    // described by five floors of drill-down, and no screen sent one — so
    // every bond in every save drifted to its resting level and stayed.
    //
    // `locationId` is the deliberate absence: nothing in the game moves you
    // anywhere, so offering a city would be offering a plan you are certain
    // to miss. It goes on this list the day travel does.
    const NOT_ASKED = new Set(['locationId']);
    const declared = [...PLANS_SOURCE.matchAll(/^\s{2}(\w+)\??:/gm)]
      .map((match) => match[1]!)
      .filter((field, index, all) => all.indexOf(field) === index);
    const inSpec = declared.slice(declared.indexOf('title'), declared.indexOf('withIds') + 1);

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
    expect(CONTEXT, 'the world keeps ticking while it waits on you').toContain("timeSpeed = 'paused'");
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

  it('offers the people rather than only sending them', () => {
    // A payload field with no control behind it is the same bug wearing a
    // different hat: it would always send an empty list.
    expect(FORM, 'nothing on the form lists who a plan could be with').toContain('couldPlanWith');
    expect(FORM, 'the people are not a control').toMatch(/aria-labelledby="plan-with-label"/);
  });
});

describe('a plan remembers who it is with', () => {
  const family = {
    mother: { firstName: 'Halla', ageAtBirth: 29, role: 'the company' as const },
    father: { firstName: 'Jón', ageAtBirth: 31, role: 'the lot' as const },
  };
  const words = (look: Looked): string =>
    [look.name, look.summary, JSON.stringify(look.body), ...(look.ways ?? []).flatMap((w) => [w.label, w.detail])]
      .join(' ');

  const madeWithHalla = (seed: string, over: Record<string, unknown> = {}) => {
    const sim = quickSave({ family }, seed);
    const halla = couldPlanWith(sim).find((one) => one.person.firstName === 'Halla')!.person.id;
    const made = put(sim, {
      title: 'Dinner', at: sim.now + 2 * MS_HOUR, durationMinutes: 90, withIds: [halla], ...over,
    });
    return { sim, halla, id: made.id! };
  };

  it('names her on the entry, and opens onto her', () => {
    const { sim, halla, id } = madeWithHalla('plan-remembers');
    const look = resolveLook(sim, { kind: 'entry', id }) as Looked;
    expect(look, 'the entry would not open').toBeDefined();

    expect(words(look)).toContain('Halla');
    const toHer = (look.ways ?? []).find((way) => way.to.kind === 'person' && way.to.id === halla);
    expect(toHer, 'the entry does not open onto the person it is with').toBeDefined();
    expect(toHer!.detail).toContain('Your mother');
  });

  it('says what turning up is worth while it is still ahead of you', () => {
    const { sim, id } = madeWithHalla('plan-remembers-ahead');
    const look = resolveLook(sim, { kind: 'entry', id }) as Looked;
    expect(words(look)).toContain(`worth ${TOGETHER_WARMS} points`);
    expect(words(look)).toContain(`costs ${MISSED_COOLS}`);
  });

  it('says you were there once it has been and gone', () => {
    const { sim, id } = madeWithHalla('plan-remembers-kept');
    sim.advanceTo(sim.now + 3 * MS_HOUR);
    expect(words(resolveLook(sim, { kind: 'entry', id }) as Looked)).toContain('You were there');
  });

  it('says you weren’t, when you weren’t', () => {
    const { sim, id } = madeWithHalla('plan-remembers-missed', { locationId: 'us-ca-losangeles' });
    sim.advanceTo(sim.now + 3 * MS_HOUR);
    const look = resolveLook(sim, { kind: 'entry', id }) as Looked;
    expect(words(look)).toContain('you weren’t there');
    expect(words(look)).toContain(`cost you ${MISSED_COOLS} points`);
  });

  it('says nothing about people on a plan with nobody on it', () => {
    const sim = quickSave({ family }, 'plan-remembers-alone');
    const made = put(sim, { title: 'An Hour Of My Own', at: sim.now + 2 * MS_HOUR });
    const look = resolveLook(sim, { kind: 'entry', id: made.id! }) as Looked;
    expect(words(look)).not.toContain('It’s with');
    expect((look.ways ?? []).some((way) => way.to.kind === 'person')).toBe(false);
  });
});

describe('not going', () => {
  const family = {
    mother: { firstName: 'Halla', ageAtBirth: 29, role: 'the company' as const },
    father: { firstName: 'Jón', ageAtBirth: 31, role: 'the lot' as const },
  };
  const skip = (sim: Simulation, entryId: string): Answer =>
    sim.execute<Answer>({ kind: 'calendar.skip', payload: { entryId } }).value!;
  const closeness = (sim: Simulation, first: string): number =>
    couldPlanWith(sim).find((one) => one.person.firstName === first)!.closeness;

  const dinner = (seed: string) => {
    const sim = quickSave({ family }, seed);
    const halla = couldPlanWith(sim).find((one) => one.person.firstName === 'Halla')!.person.id;
    const made = put(sim, { title: 'Dinner', at: sim.now + 2 * MS_HOUR, durationMinutes: 90, withIds: [halla] });
    return { sim, halla, id: made.id! };
  };

  it('is refused before the thing has come round', () => {
    const { sim, id } = dinner('skip-too-early');
    expect(skip(sim, id).error).toBe('That hasn’t come round yet. Call it off instead, and they’ll know.');
  });

  it('costs the full price once you are standing at it', () => {
    const { sim, id } = dinner('skip-at-it');
    const before = closeness(sim, 'Halla');

    // The clock stops at it rather than running over it.
    const stopped = sim.advanceTo(sim.now + MS_DAY, { stopOnPlayerRequired: true });
    expect(stopped.interruptedBy?.id).toBe(id);
    expect(sim.timeline.get(id)!.status).toBe('pending');

    expect(skip(sim, id).ok).toBe(true);
    expect(sim.timeline.get(id)!.status).toBe('missed');
    expect(closeness(sim, 'Halla')).toBeCloseTo(before - MISSED_COOLS, 5);
  });

  it('says who waited, by name', () => {
    const { sim, id } = dinner('skip-said');
    sim.advanceTo(sim.now + MS_DAY, { stopOnPlayerRequired: true });
    skip(sim, id);
    const said = unreadNotifications(sim).map((one) => `${one.title} ${one.body}`).join(' ');
    expect(said).toContain('You Didn’t Go To Dinner');
    expect(said).toContain('Halla waited');
  });

  it('costs nothing but the plan when nobody was on it', () => {
    const sim = quickSave({ family }, 'skip-alone');
    const made = put(sim, { title: 'An Hour Of My Own', at: sim.now + 2 * MS_HOUR });
    sim.advanceTo(sim.now + MS_DAY, { stopOnPlayerRequired: true });
    expect(skip(sim, made.id!).ok).toBe(true);
    const said = unreadNotifications(sim).map((one) => one.body).join(' ');
    expect(said).toContain('Nobody was waiting on it but you');
  });

  it('is refused twice over, and refused for something that is not yours', () => {
    const { sim, id } = dinner('skip-twice');
    sim.advanceTo(sim.now + MS_DAY, { stopOnPlayerRequired: true });
    expect(skip(sim, id).ok).toBe(true);
    expect(skip(sim, id).error).toBe('That’s already settled one way or the other.');
    expect(skip(sim, 'sched_nope').error).toBe('There’s nothing by that name on the calendar.');
  });

  it('leaves going the thing that warms it', () => {
    // The other side of the same fork, so the two are visibly opposite.
    const { sim } = dinner('skip-or-go');
    const before = closeness(sim, 'Halla');
    sim.advanceTo(sim.now + MS_DAY);
    expect(closeness(sim, 'Halla')).toBeCloseTo(before + TOGETHER_WARMS, 5);
  });
});

describe('calling it off', () => {
  const family = {
    mother: { firstName: 'Halla', ageAtBirth: 29, role: 'the company' as const },
    father: { firstName: 'Jón', ageAtBirth: 31, role: 'the lot' as const },
  };
  const closeness = (sim: Simulation, first: string): number =>
    couldPlanWith(sim).find((one) => one.person.firstName === first)!.closeness;

  const dinnerIn = (seed: string, ms: number) => {
    const sim = quickSave({ family }, seed);
    const halla = couldPlanWith(sim).find((one) => one.person.firstName === 'Halla')!.person.id;
    const made = put(sim, { title: 'Dinner', at: sim.now + ms, durationMinutes: 90, withIds: [halla] });
    return { sim, id: made.id! };
  };

  it('is free with a day’s notice or more', () => {
    const { sim, id } = dinnerIn('calloff-early', 3 * MS_DAY);
    const before = closeness(sim, 'Halla');
    expect(callOff(sim, id).ok).toBe(true);
    expect(closeness(sim, 'Halla')).toBe(before);
  });

  it('costs more the later it gets, and never as much as not going', () => {
    const late = dinnerIn('calloff-late', MS_HOUR);
    const before = closeness(late.sim, 'Halla');
    expect(callOff(late.sim, late.id).ok).toBe(true);
    const cost = before - closeness(late.sim, 'Halla');

    expect(cost).toBeGreaterThan(0);
    expect(cost).toBeLessThan(MISSED_COOLS);
    expect(cost).toBeCloseTo(callingOffCosts(MS_HOUR), 5);
  });

  it('prices the whole run of notice in order', () => {
    // Nought a day out, rising in a straight line to the full cost at the
    // moment it starts. Three prices that have to stay in this order or the
    // choice between telling them and not is not a choice.
    expect(callingOffCosts(2 * MS_DAY)).toBe(0);
    expect(callingOffCosts(NOTICE_FREE_HOURS * MS_HOUR)).toBe(0);
    expect(callingOffCosts(NOTICE_FREE_HOURS * MS_HOUR / 2)).toBeCloseTo(CALLING_OFF_COSTS / 2, 5);
    expect(callingOffCosts(0)).toBe(CALLING_OFF_COSTS);
    expect(CALLING_OFF_COSTS).toBeLessThan(MISSED_COOLS);
  });

  it('is refused once the thing has started', () => {
    const { sim, id } = dinnerIn('calloff-started', 2 * MS_HOUR);
    sim.advanceTo(sim.now + MS_DAY, { stopOnPlayerRequired: true });
    expect(callOff(sim, id).error).toBe('It’s already started. You either went or you didn’t.');
  });

  it('tells them, when the notice was short enough to cost', () => {
    const { sim, id } = dinnerIn('calloff-told', MS_HOUR);
    callOff(sim, id);
    const said = unreadNotifications(sim).map((one) => `${one.title} ${one.body}`).join(' ');
    expect(said).toContain('You Called Off Dinner');
    expect(said).toContain('Halla');
  });
});
