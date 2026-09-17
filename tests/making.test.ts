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
import { deliverIt, openTheDoors } from './doors';
import { stillToCarry } from '@/engine/world/lot';
import { quickSave, validateUniverse } from '@/engine';
import type { Simulation } from '@/engine';
import { MS_DAY } from '@/engine/core/time';
import { capabilitiesOf, projectsOf, parentCompany } from '@/engine/world/company';
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

const world = (seed = 'making'): Simulation => {
  const sim = quickSave({}, seed);
  openTheDoors(sim);
  return sim;
};

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

describe('when the money actually leaves', () => {
  it('pays every period at its own end, on every plan', () => {
    for (const planId of ['feature', 'series', 'unscripted']) {
      const plan = planById(planId)!;
      const sim = world(`settle-${planId}`);
      const medium = plan.media.includes('film') ? 'film' : 'television';
      const id = onTheSlate(sim, 'Settling', medium);
      expect(run(sim, 'company.greenlight', {
        projectId: id, planId, budgetCents: 20_000_000_00, shootWeeks: 6,
      }).error).toBeUndefined();

      const paidAt = new Map<string, number>();
      const seen = new Set<string>();
      for (let i = 0; i < 60; i += 1) {
        for (const txn of sim.universe.transactions) {
          if (txn.refId !== id || seen.has(txn.id)) continue;
          seen.add(txn.id);
          paidAt.set(txn.memo, txn.at);
        }
        const end = finishesBy(sim.universe.projects[id]!);
        if (end === undefined || sim.now > end) break;
        sim.advanceTo(sim.now + 14 * MS_DAY);
      }

      // The docstring has always said the money goes out at a period's end,
      // "which is the only honest place to put it". It settled whichever period
      // was DECLARED before this one, and declaration order stops being
      // calendar order the moment anything carries `runsWith`: a series paid
      // 58% of its budget on the shoot's first day and a format season paid its
      // post period out the day before that period opened.
      for (const period of plan.periods) {
        const window = windowOf(sim.universe.projects[id]!, period.id);
        if (!window) continue;
        const memo = [...paidAt.keys()].find((one) => one.includes(period.label));
        if (memo === undefined) continue;
        expect(paidAt.get(memo)!, `${planId}: ${period.id} was paid before it had run`)
          .toBeGreaterThanOrEqual(window.to);
      }
    }
  });
});

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
      // The period it is measured against, named by the plan. `some(per === 1)`
      // stood here and was true of a plan with two of them, which is how every
      // reader that inferred the base ended up on the wrong one.
      expect(plan.periods.some((p) => p.id === plan.basePeriod)).toBe(true);
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

describe('the doors are a rule, not advice', () => {
  // The Family Business screen has always listed the nine things a production
  // company must be able to do and marked which were shut. It then let a
  // picture be greenlit through a shut one, so the page was a description of a
  // game that was not being played.

  it('refuses a greenlight through a shut door, and says what is missing', () => {
    const sim = quickSave({}, 'shut');
    const id = onTheSlate(sim, 'Hvítserkur');
    const door = capabilitiesOf(sim).find((one) => one.id === 'greenlight')!;
    expect(door.can, 'a fresh company should not be able to greenlight anything').toBe(false);

    const done = run(sim, 'company.greenlight', {
      projectId: id, planId: 'feature', budgetCents: 20_000_000_00, shootWeeks: 6,
    });
    expect(done.ok).toBe(false);
    expect(done.error).toContain('Nobody can say yes to Hvítserkur yet');
    // And it names them rather than saying no.
    for (const blocker of door.blockers) {
      expect(done.error!.toLowerCase()).toContain(blocker.need.toLowerCase());
    }
    expect(sim.universe.projects[id]!.planId).toBeUndefined();
  });

  it('lets one through once every blocker is answered', () => {
    const sim = quickSave({}, 'opened');
    const id = onTheSlate(sim, 'Hvítserkur');
    expect(run(sim, 'company.greenlight', {
      projectId: id, planId: 'feature', budgetCents: 20_000_000_00, shootWeeks: 6,
    }).ok).toBe(false);

    openTheDoors(sim);
    expect(capabilitiesOf(sim).find((one) => one.id === 'greenlight')!.can).toBe(true);
    expect(run(sim, 'company.greenlight', {
      projectId: id, planId: 'feature', budgetCents: 20_000_000_00, shootWeeks: 6,
    }).ok).toBe(true);
    expect(sim.universe.projects[id]!.planId).toBe('feature');
  });

  it('refuses to file a certificate the company has not got', () => {
    // Doors open enough to start a picture, but no errors and omissions cover.
    // A picture can be made without it; it cannot be handed over.
    const sim = quickSave({}, 'no-eo');
    const somebody = Object.values(sim.universe.people).find((one) => !one.isPlayer)!;
    run(sim, 'company.fill_post', { role: 'production', personId: somebody.id });
    run(sim, 'company.option', { title: 'Something To Make', hold: 'option', months: 18 });
    run(sim, 'company.register', { registry: 'is_employer' });
    for (const policy of ['general_liability', 'workers_comp', 'production_package']) {
      run(sim, 'company.insure', { policy });
    }
    // A small picture, and money behind it, so that what this test measures is
    // the door and not the bank balance. It used to rely on a company holding
    // its opening cash being able to afford a certificate after paying for a
    // picture, and that stopped being true the day the posts started costing
    // what `ROLES` says they cost — the facility manager is in post from the
    // first morning at seven thousand a month. The claim here is that a filing
    // is refused without cover and goes through with it; affordability is
    // scaffolding, so it is paid for rather than tuned around.
    const account = Object.values(sim.universe.accounts)
      .find((one) => one.kind === 'company_cash' && !one.closedAt)!;
    sim.income(account.id, 2_000_000_00, 'A good year on the lot', 'business');
    const id = makeIt(sim, 'Hvítserkur', { budgetCents: 80_000_00 });
    // The certificate waits on prep, not on the whole picture, so this only has
    // to get past prep.
    sim.advanceTo(windowOf(sim.universe.projects[id]!, 'prep')!.to + MS_DAY);

    const done = run(sim, 'company.deliver', { projectId: id, elementId: 'eo' });
    expect(done.ok).toBe(false);
    expect(done.error).toContain('hasn’t got one');
    expect(sim.universe.projects[id]!.stage).not.toBe('delivered');

    // Buy the cover and the same filing goes through.
    //
    // Paid for immediately before buying it, on purpose. Prep runs for months
    // and the lot charges its overhead every one of them, so what the company
    // holds at this line is whatever is left over from the family's last
    // top-up — and `familyCovers` tops up in hundred-thousand steps, which
    // makes that residual essentially arbitrary. It happened to sit above the
    // fourteen-thousand premium until the posts started costing what `ROLES`
    // says, and then it sat two hundred and fifty-eight euros below it. A test
    // about whether a door refuses should not turn on that.
    sim.income(account.id, 100_000_00, 'A letting that cleared', 'business');
    expect(run(sim, 'company.insure', { policy: 'errors_omissions' }).ok).toBe(true);
    expect(run(sim, 'company.deliver', { projectId: id, elementId: 'eo' }).ok).toBe(true);
  });

  it('shuts again when the company has spent what it had', () => {
    // A picture empties the company, and the door says so rather than letting
    // it commit to a second one it cannot pay for.
    const sim = world('spent');
    makeIt(sim, 'Hvítserkur');
    runItOut(sim, projectsOf(sim.universe).find((one) => one.title === 'Hvítserkur')!.id);
    const door = capabilitiesOf(sim).find((one) => one.id === 'greenlight')!;
    expect(door.can).toBe(false);
    expect(door.blockers.map((b) => b.need)).toContain('Money In The Company');
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

    // Filing the list is a producer's job and not a single call: a review can
    // send the picture back down the ladder in the week before delivery, and
    // then the certificate has to go over again behind the recut.
    expect(deliverIt(sim, id), 'the picture never got delivered').toBe(true);
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
    // Both halves of the name, because the second half had nothing reading it:
    // the test asserted only that being late cost something, so a flat penalty
    // would have passed it under a name that promised a curve.
    const lateBy = (days: number): { charged: number; at: number } => {
      const sim = world('late');
      const id = makeIt(sim);
      const project = () => sim.universe.projects[id]!;
      // The work has to be finished before anybody can be late filing it, and
      // finishing it is not one pass: a review can send the picture back down
      // the ladder in the last week, and the paperwork goes over again behind
      // the recut. Advancing a fixed span from `deliverBy` and filing once was
      // a picture still in post on most worlds and delivered on some.
      runItOut(sim, id);
      const at = project().deliverBy! + days * MS_DAY;
      if (sim.now < at) sim.advanceTo(at);
      expect(sim.now, 'it has to actually be late for this to mean anything')
        .toBeGreaterThan(project().deliverBy!);
      const before = project().spentCents;
      expect(deliverIt(sim, id), 'the picture never got delivered').toBe(true);
      return { charged: project().spentCents - before, at: sim.now };
    };

    const soon = lateBy(60);
    const later = lateBy(200);
    expect(soon.charged, 'being late cost nothing').toBeGreaterThan(0);
    expect(later.at, 'the two runs have to differ in when they filed')
      .toBeGreaterThan(soon.at);
    expect(later.charged, 'and being later cost no more').toBeGreaterThan(soon.charged);
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
    expect(deliverIt(sim, id)).toBe(true);
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
    const month = (taken: number, earnsCents: number) => ({
      available: 4, taken, own: 0, share: taken / 4, earnsCents,
      ifFullCents: 400, earnsShare: earnsCents / 400,
    });
    expect(howTheMonthWent(month(0, 0))).toContain('Nobody was on a stage');
    expect(howTheMonthWent(month(1, 100))).toContain('1 stage week ');
    expect(howTheMonthWent(month(3, 100))).toContain('3 stage weeks ');
  });
});

describe('build two: a season that is not a picture', () => {
  const SEASON = planById('unscripted')!;

  it('fits the work backward into a fixed airdate, rather than delivering whenever', () => {
    const airdate = 1_800_000_000_000;
    const short = layOut(SEASON, 6, airdate);
    const long = layOut(SEASON, 12, airdate);
    // Both land on the date they were given, exactly.
    expect(short.deliverBy).toBe(airdate);
    expect(long.deliverBy).toBe(airdate);
    // And the longer season starts earlier rather than finishing later, which
    // is the whole difference between a broadcast clock and a picture's.
    expect(long.periods[0]!.from).toBeLessThan(short.periods[0]!.from);
  });

  it('starts the cut on field day one and runs it past wrap', () => {
    const laid = layOut(SEASON, 8, 1_800_000_000_000);
    const at = (id: string) => laid.periods.find((p) => p.id === id)!;
    expect(at('post').from).toBe(at('field').from);
    expect(at('post').to).toBeGreaterThan(at('field').to);
  });

  it('overlaps the build with casting, and waits for both before the field', () => {
    const laid = layOut(SEASON, 8, 1_800_000_000_000);
    const at = (id: string) => laid.periods.find((p) => p.id === id)!;
    expect(at('rig').from).toBe(at('casting').from);
    expect(at('field').from).toBeGreaterThanOrEqual(Math.max(at('casting').to, at('rig').to));
  });

  it('runs compliance alongside the cut, because that is what gates lock', () => {
    const laid = layOut(SEASON, 8, 1_800_000_000_000);
    const at = (id: string) => laid.periods.find((p) => p.id === id)!;
    expect(at('compliance').from).toBe(at('post').from);
  });

  it('leaves a picture exactly as it was', () => {
    const laid = layOut(planById('feature')!, 6, 0);
    // Strictly sequential, anchored at the start, delivery derived forward.
    for (const [i, period] of laid.periods.entries()) {
      if (i > 0) expect(period.from).toBe(laid.periods[i - 1]!.to);
    }
    expect(laid.periods[0]!.from).toBe(0);
    expect(layOut(planById('feature')!, 12, 0).deliverBy)
      .toBeGreaterThan(layOut(planById('feature')!, 6, 0).deliverBy);
  });

  it('greenlights a season through the same command a picture uses', () => {
    const sim = world('season');
    const id = onTheSlate(sim, 'The Arena', 'television');
    const done = run(sim, 'company.greenlight', {
      projectId: id, planId: 'unscripted', budgetCents: 8_000_000_00, shootWeeks: 8,
    });
    expect(done.error).toBeUndefined();
    const project = sim.universe.projects[id]!;
    expect(project.periods?.map((p) => p.id))
      .toEqual(['casting', 'rig', 'field', 'post', 'compliance']);
    // It took a stage off the same board, the way everything else does.
    expect(project.stageId).toBeDefined();
  });

  it('runs a whole season through to delivered on the ordinary clock', () => {
    const sim = world('season-run');
    const id = onTheSlate(sim, 'The Arena', 'television');
    run(sim, 'company.greenlight', {
      projectId: id, planId: 'unscripted', budgetCents: 8_000_000_00, shootWeeks: 8,
    });
    runItOut(sim, id);
    const project = sim.universe.projects[id]!;
    expect(project.spentCents).toBeGreaterThanOrEqual(project.budgetCents!);
    expect(validateUniverse(sim.universe).errors).toEqual([]);
    expect(sim.ledger.audit()).toEqual([]);
  });
});

describe('a greenlight refuses what cannot be made', () => {
  const world = (seed: string): Simulation => {
    const sim = quickSave({}, seed);
    openTheDoors(sim);
    return sim;
  };
  const put = (sim: Simulation, title: string, medium: 'film' | 'television'): string => {
    run(sim, 'company.develop', { title, medium });
    return projectsOf(sim.universe).find((one) => one.title === title)!.id;
  };

  it('will not lay a season out behind you', () => {
    // The ordinary mistake on a plan anchored at its transmission date: the
    // work is fitted backward in front of the date, so an airdate ten weeks
    // out puts casting, the rig and the field in weeks that have happened.
    // It used to be accepted — twenty-seven ticks scheduled in the past and
    // never fired, and a picture that could not be finished, delivered, sold,
    // shelved or greenlit again for the rest of the save.
    const sim = world('past-airdate');
    const id = put(sim, 'The Long Winter', 'television');
    const said = run(sim, 'company.greenlight', {
      projectId: id, planId: 'unscripted', budgetCents: 20_000_000_00, shootWeeks: 6,
      from: sim.now + 10 * MS_WEEK,
    });
    expect(said.ok).toBe(false);
    expect(said.error).toMatch(/weeks in front of that date/);
    expect(sim.universe.projects[id]!.planId, 'it was greenlit anyway').toBeUndefined();

    // Far enough out and the same season is fine.
    expect(run(sim, 'company.greenlight', {
      projectId: id, planId: 'unscripted', budgetCents: 20_000_000_00, shootWeeks: 6,
      from: sim.now + 60 * MS_WEEK,
    }).ok).toBe(true);
    for (const window of sim.universe.projects[id]!.periods ?? []) {
      expect(window.from, `${window.id} starts in the past`).toBeGreaterThanOrEqual(sim.now);
    }
  });

  it('will not start a picture in a week that has gone', () => {
    const sim = world('past-start');
    const id = put(sim, 'Yesterday', 'film');
    const said = run(sim, 'company.greenlight', {
      projectId: id, planId: 'feature', budgetCents: 4_000_000_00, shootWeeks: 5,
      from: sim.now - 20 * MS_WEEK,
    });
    expect(said.ok).toBe(false);
    expect(said.error).toMatch(/ago/);
  });

  it('will not commit to more than there is behind the company', () => {
    // Not the cash in the account — a picture is paid for as it goes and the
    // family has been covering the difference since the first month. What a
    // company cannot do is say yes to something bigger than the patience it
    // has left, which is a real figure off the ledger and the sugar year.
    const sim = world('too-big');
    const id = put(sim, 'Too Big', 'film');
    const room = stillToCarry(sim);
    expect(room, 'the family had nothing left on the first day').toBeGreaterThan(0);

    const said = run(sim, 'company.greenlight', {
      projectId: id, planId: 'feature', budgetCents: room * 3, shootWeeks: 8,
    });
    expect(said.ok).toBe(false);
    expect(said.error).toMatch(/behind this company/);

    // And a picture inside it goes through.
    expect(run(sim, 'company.greenlight', {
      projectId: id, planId: 'feature', budgetCents: Math.round(room / 4), shootWeeks: 8,
    }).ok).toBe(true);
  });

  it('lets a bet-the-company picture through, because that is a decision', () => {
    // Most of what the family has left, on one picture. It is allowed, and it
    // is ruinous if it does not come back — which is the point of it being a
    // decision rather than a rule.
    const sim = world('bet');
    const id = put(sim, 'Everything On It', 'film');
    const room = stillToCarry(sim);
    expect(run(sim, 'company.greenlight', {
      projectId: id, planId: 'feature', budgetCents: Math.round(room * 0.8), shootWeeks: 10,
    }).ok).toBe(true);
  });
});
