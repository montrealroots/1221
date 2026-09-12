/**
 * SLATE — a picture with a dated life.
 *
 * What these hold, in order of how much they matter:
 *
 * The family's own picture takes a stage off the same board a paying tenant
 * books from. If that ever stops being true the lot becomes scenery, and the
 * whole reason for building it goes with it.
 *
 * A schedule is a promise with a cost. The money goes out across the periods,
 * an overrun is read off how far the schedule was cut below what the budget
 * says the picture takes, and everything behind the shoot moves when it slips.
 *
 * And finishing is not delivering. A picture can be shot, cut, mixed and
 * finished and still not be paid for, because four things on the delivery list
 * are paperwork nobody on the crew makes.
 */

import { describe, expect, it } from 'vitest';
import { quickSave, validateUniverse } from '@/engine';
import type { Simulation } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { projectsOf, parentCompany } from '@/engine/world/company';
import { MS_WEEK, bookingsFor, howTheMonthWent, stagesOn, theLot, utilisation } from '@/engine/world/lot';
import {
  DELIVERY, PLANS, impliedShootWeeks, planById, tightnessOf,
} from '@/engine/content/making';
import {
  comesOn, decideSlip, finishesBy, freeAcross, heldUpBy, inProduction, layOut,
  planOf, stillMissing, whereThePictureStands, windowOf,
} from '@/engine/world/making';

interface Done { ok: boolean; id?: string; error?: string }

const run = (sim: Simulation, kind: string, payload: Record<string, unknown> = {}): Done =>
  sim.execute<Done>({ kind, payload }).value!;

const world = (seed = 'making'): Simulation => quickSave({}, seed);

/** Puts a title on the slate and gives back its id. */
function onTheSlate(sim: Simulation, title: string, medium: 'film' | 'television' = 'film'): string {
  run(sim, 'company.develop', { title, medium });
  return projectsOf(sim.universe).find((one) => one.title === title)!.id;
}

/**
 * Advances until the work is actually finished.
 *
 * Not to the date the schedule said, because a shoot that runs over moves it.
 * Reading the finish date once and advancing to it lands a picture short of
 * its own end, which is a mistake worth only making once.
 */
function runItOut(sim: Simulation, id: string): void {
  for (let i = 0; i < 8; i += 1) {
    const done = finishesBy(sim.universe.projects[id]!)!;
    if (sim.now > done) return;
    sim.advanceTo(done + MS_DAY);
  }
  throw new Error('the picture never finished');
}

/** Greenlights one, with everything defaulted to something sensible. */
function makeIt(sim: Simulation, title = 'Hvítserkur', over: Record<string, unknown> = {}): string {
  const id = onTheSlate(sim, title, (over.medium as 'film' | 'television') ?? 'film');
  const done = run(sim, 'company.greenlight', {
    projectId: id, planId: 'feature', budgetCents: 20_000_000_00, shootWeeks: 6, ...over,
  });
  expect(done.error).toBeUndefined();
  return id;
}

// ---------------------------------------------------------------------------

describe('laying a plan onto dates', () => {
  it('runs the periods back to back and puts delivery after all of them', () => {
    const plan = planById('feature')!;
    const laid = layOut(plan, 6, 1_000_000_000_000);
    expect(laid.periods.map((p) => p.id)).toEqual(['prep', 'shooting', 'post']);
    for (const [i, period] of laid.periods.entries()) {
      expect(period.to).toBeGreaterThan(period.from);
      if (i > 0) expect(period.from).toBe(laid.periods[i - 1]!.to);
    }
    expect(laid.deliverBy).toBeGreaterThan(laid.periods[2]!.to);
  });

  it('measures every period against the shoot, so one number sets the whole schedule', () => {
    const plan = planById('feature')!;
    const short = layOut(plan, 4, 0);
    const long = layOut(plan, 12, 0);
    const spanOf = (laid: ReturnType<typeof layOut>, id: string): number => {
      const one = laid.periods.find((p) => p.id === id)!;
      return one.to - one.from;
    };
    expect(spanOf(long, 'shooting')).toBe(3 * spanOf(short, 'shooting'));
    expect(spanOf(long, 'post')).toBeGreaterThan(spanOf(short, 'post'));
  });

  it('gives a thirty-day picture a schedule somebody would recognize', () => {
    const laid = layOut(planById('feature')!, 6, 0);
    const weeksOf = (id: string): number => {
      const one = laid.periods.find((p) => p.id === id)!;
      return (one.to - one.from) / MS_WEEK;
    };
    expect(weeksOf('prep')).toBe(5);
    expect(weeksOf('shooting')).toBe(6);
    expect(weeksOf('post')).toBe(14);
    // Ten months or so from the crew coming on to the delivery date.
    expect(laid.deliverBy / MS_WEEK).toBeGreaterThan(28);
    expect(laid.deliverBy / MS_WEEK).toBeLessThan(48);
  });
});

describe('every plan is a plan somebody could actually run', () => {
  it('spends the whole budget and no more', () => {
    for (const plan of PLANS) {
      const spends = plan.periods.reduce((n, p) => n + p.spends, 0);
      expect(spends).toBeCloseTo(1, 6);
    }
  });

  it('measures itself against a shoot, and holds a stage for it', () => {
    for (const plan of PLANS) {
      expect(plan.periods.some((p) => p.per === 1)).toBe(true);
      expect(plan.periods.some((p) => p.holds === 'shooting')).toBe(true);
      expect(plan.media.length).toBeGreaterThan(0);
      for (const period of plan.periods) {
        expect(period.per).toBeGreaterThan(0);
        expect(period.unit.aWeek).toBeGreaterThan(0);
        expect(period.what.length).toBeGreaterThan(30);
      }
    }
  });
});

describe('what the money says a schedule should be', () => {
  it('climbs with budget, and climbs slower than the budget does', () => {
    const small = impliedShootWeeks(5_000_000_00);
    const middling = impliedShootWeeks(20_000_000_00);
    const huge = impliedShootWeeks(150_000_000_00);
    expect(small).toBeLessThan(middling);
    expect(middling).toBeLessThan(huge);
    // Thirty times the money does not buy thirty times the days.
    expect(huge / small).toBeLessThan(6);
  });

  it('lands on schedules anybody in the business would recognize', () => {
    expect(Math.round(impliedShootWeeks(5_000_000_00) * 5)).toBeGreaterThanOrEqual(15);
    expect(Math.round(impliedShootWeeks(5_000_000_00) * 5)).toBeLessThanOrEqual(22);
    expect(Math.round(impliedShootWeeks(20_000_000_00) * 5)).toBeGreaterThanOrEqual(28);
    expect(Math.round(impliedShootWeeks(20_000_000_00) * 5)).toBeLessThanOrEqual(35);
    expect(Math.round(impliedShootWeeks(150_000_000_00) * 5)).toBeGreaterThanOrEqual(60);
    expect(Math.round(impliedShootWeeks(150_000_000_00) * 5)).toBeLessThanOrEqual(80);
  });

  it('reads 1 when the schedule matches the money', () => {
    const weeks = impliedShootWeeks(20_000_000_00);
    expect(tightnessOf(weeks, 20_000_000_00)).toBeCloseTo(1, 6);
    expect(tightnessOf(weeks / 2, 20_000_000_00)).toBeCloseTo(0.5, 6);
  });
});

describe('greenlighting', () => {
  it('lays the dates down and puts the picture on a stage', () => {
    const sim = world();
    const id = makeIt(sim);
    const project = sim.universe.projects[id]!;
    expect(project.stage).toBe('greenlit');
    expect(project.planId).toBe('feature');
    expect(project.periods?.map((p) => p.id)).toEqual(['prep', 'shooting', 'post']);
    expect(project.stageId).toBeDefined();
    expect(project.bookingId).toBeDefined();
    expect(project.deliverBy).toBeGreaterThan(finishesBy(project)!);
    expect(project.unitBaseId).toBe(theLot(sim)!.locationId);
  });

  it('takes the stage off the same board a paying tenant books from', () => {
    const sim = world();
    const id = makeIt(sim);
    const project = sim.universe.projects[id]!;
    const booking = sim.universe.bookings[project.bookingId!]!;
    expect(bookingsFor(sim, project.stageId!)).toContainEqual(booking);
    expect(booking.companyId).toBe(parentCompany(sim.universe)!.id);
    expect(booking.holder).toBe(project.title);
    // Nothing is invoiced, because a company cannot rent a room from itself.
    expect(booking.weekRateCents).toBe(0);
  });

  it('holds the stage from the first day of prep to the last day of the shoot', () => {
    const sim = world();
    const project = sim.universe.projects[makeIt(sim)]!;
    const booking = sim.universe.bookings[project.bookingId!]!;
    expect(booking.from).toBe(windowOf(project, 'prep')!.from);
    expect(booking.to).toBe(windowOf(project, 'shooting')!.to);
  });

  it('fills the lot without earning it a penny', () => {
    const sim = world();
    const project = sim.universe.projects[makeIt(sim)]!;
    const booking = sim.universe.bookings[project.bookingId!]!;
    const across = utilisation(sim, booking.from, booking.to);
    expect(across.taken).toBeGreaterThan(0);
    expect(across.earnsCents).toBe(0);
  });

  it('says no when every stage is taken, which is the lot refusing its owner', () => {
    const sim = world('crowded');
    const stages = stagesOn(sim);
    expect(stages.length).toBeGreaterThan(0);
    // Fill every room across the window the picture would want.
    const from = sim.now;
    const to = sim.now + 400 * MS_DAY;
    for (const stage of stages) {
      sim.universe.bookings[sim.nextId('booking')] = {
        id: sim.nextId('booking'), saveId: sim.universe.meta.id, stageId: stage.id,
        holder: 'Somebody Else', kind: 'shooting', from, to, weekRateCents: 100_00,
      };
    }
    expect(freeAcross(sim, from, to)).toHaveLength(0);
    const id = onTheSlate(sim, 'Nowhere To Put It');
    const done = run(sim, 'company.greenlight',
      { projectId: id, planId: 'feature', budgetCents: 20_000_000_00, shootWeeks: 6 });
    expect(done.ok).toBe(false);
    expect(done.error).toBe('Every stage on the lot is booked across those dates.');
  });

  it('refuses a plan that is not how you make that thing', () => {
    const sim = world();
    const id = onTheSlate(sim, 'A Television Show', 'television');
    expect(run(sim, 'company.greenlight',
      { projectId: id, planId: 'feature', budgetCents: 10_000_000_00, shootWeeks: 6 }).error)
      .toBe('A Feature, Shot On Stages isn’t how you make television.');
  });

  it('refuses no money, no schedule, and one that is already being made', () => {
    const sim = world();
    const id = onTheSlate(sim, 'Twice');
    expect(run(sim, 'company.greenlight',
      { projectId: id, planId: 'feature', budgetCents: 0, shootWeeks: 6 }).error)
      .toBe('A greenlight needs a budget behind it.');
    expect(run(sim, 'company.greenlight',
      { projectId: id, planId: 'feature', budgetCents: 1_000_000_00, shootWeeks: 0 }).error)
      .toBe('It has to shoot for at least a week.');
    expect(run(sim, 'company.greenlight',
      { projectId: id, planId: 'feature', budgetCents: 1_000_000_00, shootWeeks: 80 }).error)
      .toContain('Nobody holds a crew together');
    run(sim, 'company.greenlight', { projectId: id, planId: 'feature', budgetCents: 1_000_000_00, shootWeeks: 4 });
    expect(run(sim, 'company.greenlight',
      { projectId: id, planId: 'feature', budgetCents: 1_000_000_00, shootWeeks: 4 }).error)
      .toBe('Twice is already being made.');
  });

  it('names the stage when the one asked for is busy', () => {
    const sim = world('busy');
    makeIt(sim, 'First');
    const taken = sim.universe.projects[projectsOf(sim.universe)[0]!.id]!.stageId!;
    const second = onTheSlate(sim, 'Second');
    const done = run(sim, 'company.greenlight', {
      projectId: second, planId: 'feature', budgetCents: 20_000_000_00, shootWeeks: 6, stageId: taken,
    });
    expect(done.ok).toBe(false);
    expect(done.error).toContain('is already booked across those dates');
  });
});

describe('walking the calendar', () => {
  it('moves the picture through every period and out the far side', () => {
    const sim = world('walk');
    const id = makeIt(sim);
    const project = () => sim.universe.projects[id]!;
    const seen: string[] = [project().stage];

    for (let i = 0; i < 200; i += 1) {
      if (sim.now > finishesBy(project())!) break;
      sim.advanceTo(sim.now + 7 * MS_DAY);
      if (seen[seen.length - 1] !== project().stage) seen.push(project().stage);
    }
    expect(seen).toEqual(['greenlit', 'prep', 'shooting', 'post']);
  });

  it('spends the budget across the periods rather than in a lump', () => {
    const sim = world('spend');
    const id = makeIt(sim);
    const budget = sim.universe.projects[id]!.budgetCents!;
    const spentAt: number[] = [];

    spentAt.push(sim.universe.projects[id]!.spentCents);
    for (let i = 0; i < 100; i += 1) {
      if (sim.now > finishesBy(sim.universe.projects[id]!)!) break;
      sim.advanceTo(sim.now + 14 * MS_DAY);
      spentAt.push(sim.universe.projects[id]!.spentCents);
    }
    // It goes out in steps, and by the end the whole budget has gone.
    expect(spentAt[0]).toBe(0);
    expect(new Set(spentAt).size).toBeGreaterThan(2);
    expect(spentAt[spentAt.length - 1]).toBeGreaterThanOrEqual(budget);
  });

  it('hands over what the work makes, when the work makes it', () => {
    const sim = world('elements');
    const id = makeIt(sim);
    const project = () => sim.universe.projects[id]!;

    // Stills come out of the shoot, so they cannot be in before it ends.
    sim.advanceTo(windowOf(project(), 'shooting')!.from + MS_DAY);
    expect(project().delivered).not.toContain('stills');
    // Re-read wrap: the shoot has just decided whether it runs over.
    sim.advanceTo(windowOf(project(), 'shooting')!.to + MS_DAY);
    expect(project().delivered).toContain('stills');
    // And the picture itself comes out of post.
    expect(project().delivered).not.toContain('picture');
    runItOut(sim, id);
    expect(project().delivered).toContain('picture');
    expect(project().delivered).toContain('me');
  });
});

describe('running over', () => {
  it('slips further the harder the schedule was cut', () => {
    const roomy = decideSlip({ tightness: 1.2, weeks: 8 }, 0.5);
    const matched = decideSlip({ tightness: 1, weeks: 8 }, 0.5);
    const squeezed = decideSlip({ tightness: 0.6, weeks: 8 }, 0.5);
    expect(roomy.days).toBeLessThanOrEqual(matched.days);
    expect(matched.days).toBeLessThan(squeezed.days);
  });

  it('slips further on a long shoot than a short one', () => {
    expect(decideSlip({ tightness: 0.7, weeks: 20 }, 0.5).days)
      .toBeGreaterThan(decideSlip({ tightness: 0.7, weeks: 4 }, 0.5).days);
  });

  it('says why, and says something different when the schedule was the problem', () => {
    expect(decideSlip({ tightness: 0.5, weeks: 10 }, 0.9).because).toContain('short of what the picture costs');
    expect(decideSlip({ tightness: 1.05, weeks: 10 }, 0.9).because).toContain('ordinary attrition');
  });

  it('moves post and the delivery date with it, not just wrap', () => {
    const sim = world('slip');
    // Four weeks to shoot what twenty million euros says takes six.
    const id = makeIt(sim, 'Cut To The Bone', { shootWeeks: 4 });
    const project = () => sim.universe.projects[id]!;
    const wrapWas = windowOf(project(), 'shooting')!.to;
    const postWas = windowOf(project(), 'post')!.to;
    const dueWas = project().deliverBy!;

    sim.advanceTo(windowOf(project(), 'shooting')!.from + MS_DAY);
    const wrapNow = windowOf(project(), 'shooting')!.to;
    expect(wrapNow).toBeGreaterThan(wrapWas);
    const by = wrapNow - wrapWas;
    expect(windowOf(project(), 'post')!.to).toBe(postWas + by);
    expect(project().deliverBy).toBe(dueWas + by);
    // And post still starts the day the shoot ends.
    expect(windowOf(project(), 'post')!.from).toBe(wrapNow);
  });

  it('leaves the timeline sorted, so nothing fires out of order later', () => {
    // Two pictures on the lot at once, the second starting six weeks behind the
    // first, so their ticks interleave. That is what makes this worth testing:
    // one picture alone can slip as far as it likes without passing anything.
    const sim = world('slip-sorted');
    const id = makeIt(sim, 'Cut To The Bone', { shootWeeks: 3 });
    const from = windowOf(sim.universe.projects[id]!, 'prep')!.from;
    makeIt(sim, 'Room To Breathe', { shootWeeks: 3, from: from + 6 * MS_WEEK });

    const project = () => sim.universe.projects[id]!;
    sim.advanceTo(windowOf(project(), 'shooting')!.from + MS_DAY);

    // A slip moves scheduled items. Writing `at` in place instead of going
    // through the timeline's own reschedule leaves the list unsorted, and the
    // timeline is held sorted and walked by a forward-only cursor, so an
    // unsorted list means an event firing in the wrong order weeks later.
    const pending = sim.universe.scheduled.filter((one) => one.status === 'pending');
    for (const [i, one] of pending.entries()) {
      if (i > 0) expect(one.at, `${one.label} sits before ${pending[i - 1]!.label}`)
        .toBeGreaterThanOrEqual(pending[i - 1]!.at);
    }
    // And both pictures still run to completion afterwards.
    expect(validateUniverse(sim.universe).errors).toEqual([]);
    runItOut(sim, id);
    expect(validateUniverse(sim.universe).errors).toEqual([]);
    expect(project().delivered).toContain('picture');
  });

  it('charges for the extra days', () => {
    const sim = world('slip-cost');
    const id = makeIt(sim, 'Cut To The Bone', { shootWeeks: 4 });
    const project = () => sim.universe.projects[id]!;
    sim.advanceTo(windowOf(project(), 'shooting')!.from - MS_DAY);
    const before = project().spentCents;
    sim.advanceTo(windowOf(project(), 'shooting')!.from + MS_DAY);
    expect(project().spentCents).toBeGreaterThan(before);
  });
});

describe('finishing is not delivering', () => {
  it('leaves the picture finished and unpaid for, held by the paperwork', () => {
    const sim = world('deliver');
    const id = makeIt(sim);
    const project = () => sim.universe.projects[id]!;
    runItOut(sim, id);

    expect(project().stage).not.toBe('delivered');
    const held = heldUpBy(project());
    expect(held.length).toBeGreaterThan(0);
    // And every one of them is paperwork, not craft.
    expect(held.every((e) => e.by === 'business')).toBe(true);
    expect(whereThePictureStands(sim, project())).toContain('finished and unpaid for');
  });

  it('delivers once the last piece of paperwork goes over', () => {
    const sim = world('paperwork');
    const id = makeIt(sim);
    const project = () => sim.universe.projects[id]!;
    runItOut(sim, id);

    for (const element of heldUpBy(project())) {
      expect(run(sim, 'company.deliver', { projectId: id, elementId: element.id }).ok).toBe(true);
    }
    expect(project().stage).toBe('delivered');
    expect(project().deliveredAt).toBeDefined();
    expect(heldUpBy(project())).toHaveLength(0);
  });

  it('refuses paperwork before the period it waits on is finished', () => {
    const sim = world('early');
    const id = makeIt(sim);
    const done = run(sim, 'company.deliver', { projectId: id, elementId: 'cues' });
    expect(done.ok).toBe(false);
    expect(done.error).toContain('can’t go over until post is finished');
  });

  it('refuses to let anybody file what the crew has to make', () => {
    const sim = world('craft');
    const id = makeIt(sim);
    expect(run(sim, 'company.deliver', { projectId: id, elementId: 'picture' }).error)
      .toBe('The Finished Picture comes out of the work. Nobody can file it early.');
  });

  it('charges for being late, and charges more the later it is', () => {
    const sim = world('late');
    const id = makeIt(sim);
    const project = () => sim.universe.projects[id]!;
    sim.advanceTo(project().deliverBy! + 60 * MS_DAY);
    const before = project().spentCents;
    for (const element of heldUpBy(project())) {
      run(sim, 'company.deliver', { projectId: id, elementId: element.id });
    }
    expect(project().stage).toBe('delivered');
    expect(project().spentCents).toBeGreaterThan(before);
  });

  it('charges nothing when it goes over on time', () => {
    const sim = world('on-time');
    const id = makeIt(sim);
    const project = () => sim.universe.projects[id]!;
    runItOut(sim, id);
    const before = project().spentCents;
    for (const element of heldUpBy(project())) {
      run(sim, 'company.deliver', { projectId: id, elementId: element.id });
    }
    expect(project().spentCents).toBe(before);
  });

  it('keeps the elements that hold the money apart from the ones that do not', () => {
    const holds = DELIVERY.filter((e) => e.holdsPayment);
    expect(holds.length).toBeGreaterThan(5);
    expect(DELIVERY.some((e) => !e.holdsPayment)).toBe(true);
    // Every element says who makes it and what it waits on.
    for (const element of DELIVERY) {
      expect(['production', 'business']).toContain(element.by);
      expect(element.what.length).toBeGreaterThan(30);
    }
  });
});

describe('the save stays sound through all of it', () => {
  it('validates from greenlight to delivered', () => {
    const sim = world('sound');
    const id = makeIt(sim);
    expect(validateUniverse(sim.universe).errors).toEqual([]);
    runItOut(sim, id);
    expect(validateUniverse(sim.universe).errors).toEqual([]);
    expect(sim.ledger.audit()).toEqual([]);
    for (const element of heldUpBy(sim.universe.projects[id]!)) {
      run(sim, 'company.deliver', { projectId: id, elementId: element.id });
    }
    expect(validateUniverse(sim.universe).errors).toEqual([]);
    expect(sim.ledger.audit()).toEqual([]);
  });

  it('says where a picture stands at every point in its life', () => {
    const sim = world('sentence');
    const before = onTheSlate(sim, 'Not Yet');
    expect(whereThePictureStands(sim, sim.universe.projects[before]!))
      .toContain('nobody has said yes to it');

    const id = makeIt(sim);
    const project = () => sim.universe.projects[id]!;
    expect(whereThePictureStands(sim, project())).toContain('the crew comes on');
    sim.advanceTo(comesOn(project())! + MS_DAY);
    expect(whereThePictureStands(sim, project())).toContain('prep');
    sim.advanceTo(windowOf(project(), 'shooting')!.from + MS_DAY);
    expect(whereThePictureStands(sim, project())).toContain('principal photography');
  });

  it('lists what is in production, and drops it when it delivers', () => {
    const sim = world('list');
    const id = makeIt(sim);
    expect(inProduction(sim).map((p) => p.id)).toContain(id);
    expect(planOf(sim.universe.projects[id]!)?.id).toBe('feature');
    runItOut(sim, id);
    for (const element of heldUpBy(sim.universe.projects[id]!)) {
      run(sim, 'company.deliver', { projectId: id, elementId: element.id });
    }
    expect(inProduction(sim).map((p) => p.id)).not.toContain(id);
    expect(stillMissing(sim.universe.projects[id]!)).toHaveLength(0);
  });
});

describe('the lot tells the truth about who is on it', () => {
  it('counts the company’s own picture apart from the paying tenants', () => {
    const sim = world('honest');
    const id = makeIt(sim);
    const project = sim.universe.projects[id]!;
    const booking = sim.universe.bookings[project.bookingId!]!;
    const across = utilisation(sim, booking.from, booking.to);
    expect(across.own).toBeGreaterThan(0);
    expect(across.own).toBeLessThanOrEqual(across.taken);
    expect(across.earnsCents).toBe(0);
  });

  it('says the rooms went to the family rather than reporting a full, unpaid month', () => {
    const sim = world('honest-words');
    const id = makeIt(sim);
    const booking = sim.universe.bookings[sim.universe.projects[id]!.bookingId!]!;
    const said = howTheMonthWent(utilisation(sim, booking.from, booking.to));
    expect(said).toContain('own picture');
    expect(said).toContain('pays');
  });

  it('says nothing about ownership when only paying tenants are on', () => {
    const sim = world('tenants');
    const stage = stagesOn(sim)[0]!;
    const from = sim.now;
    const to = sim.now + 14 * MS_DAY;
    const bookingId = sim.nextId('booking');
    sim.universe.bookings[bookingId] = {
      id: bookingId, saveId: sim.universe.meta.id, stageId: stage.id,
      holder: 'Somebody Else', kind: 'shooting', from, to, weekRateCents: 100_00,
    };
    const said = howTheMonthWent(utilisation(sim, from, to));
    expect(said).toContain('paying tenants');
    expect(said).not.toContain('own picture');
  });

  it('agrees with itself about one week and several', () => {
    expect(howTheMonthWent({ available: 4, taken: 0, own: 0, share: 0, earnsCents: 0 }))
      .toContain('Nobody was on a stage');
    expect(howTheMonthWent({ available: 4, taken: 1, own: 0, share: 0.25, earnsCents: 100 }))
      .toContain('1 stage week ');
    expect(howTheMonthWent({ available: 4, taken: 3, own: 0, share: 0.75, earnsCents: 100 }))
      .toContain('3 stage weeks ');
  });
});
