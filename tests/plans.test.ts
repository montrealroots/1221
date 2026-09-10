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
  FURTHEST_AHEAD_DAYS, LONGEST_MINUTES, LONGEST_TITLE, PLAN_KIND, checkPlan, couldPlanWith,
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
