/**
 * SLATE — a greenlit picture, walking its own calendar.
 *
 * `content/making.ts` says what the periods are. This lays them onto real
 * dates, takes a stage off the lot's board to hold them, spends the budget
 * across them, and moves the picture from one to the next as time passes.
 *
 * Three things here are worth saying out loud, because each is a place a
 * simulation usually cheats.
 *
 * **The stage comes off the same board.** When the family greenlights its own
 * picture it books a stage the way a paying tenant does, into the same
 * `bookings` table, checked against the same clashes. It pays nothing, since a
 * company cannot rent from itself, and that is exactly what makes it cost
 * something: every week the family's own picture is on Askja is a week no
 * paying production can be, and the lot's income goes down while its occupancy
 * goes up. Owning the stages is the advantage. Using them is the price.
 *
 * **The overrun is decided from the schedule, not rolled.** A picture given
 * four weeks to shoot what the money says takes six will run over, and the
 * amount is read off how far apart those two numbers are. The draw only says
 * how badly, inside a range the tightness sets. `decideSlip` is registered in
 * `decided.ts` and the sweep in `tests/deciders.test.ts` holds it to it.
 *
 * **Finishing is not delivering.** A picture that is shot, cut and mixed is
 * not paid for. It is paid for when every element on a contractual list is
 * handed over, and four of those elements are paperwork nobody on the crew
 * makes. A picture can sit finished for months because the music cue sheet was
 * nobody's job, and here it can too.
 */

import type { Simulation } from '../core/simulation';
import type { Booking, Id, SoundStage } from '../domain/model';
import { formatMoney, type Money } from '../core/money';
import type { Instant } from '../core/time';
import type { Project } from '../domain/company';
import type { DimensionId } from '../content/maturity';
import { MS_DAY, formatDate } from '../core/time';
import {
  DELIVERY, LATE_PENALTY_A_WEEK, SLIP_COSTS, SLIP_RATE, TRUST_COSTS,
  type Element, type Period, type Plan,
  elementById, elementsAfter, planById, tightnessOf,
} from '../content/making';
import { LOT_NAME } from '../content/estate';
import { MS_WEEK, bookingsFor, rateFor, stagesOn, stillToCarry, theLot } from './lot';
import { bankAWeek, cuttingPeriod, cutsAWeek, handsOn, weighTheCut } from './inventory';
import {
  backToTheRoom, climbedTo, comesApart, deckFor, decideReview, exposureOf, knockEverything,
  somebodyGoesOff,
  landsOn, outOfTheRoom, putBack, rungReads, takeItBack,
} from './trouble';
import {
  advance, advancePart, doneShare, holdingItUp, isFinished, knockBackPart, laddersOf, owedSeconds,
  partsOf, partsOutstanding, stepOfPart,
} from './maturity';
import { DIMENSIONS, dimensionById, rungsOf } from '../content/maturity';
import { armTheCrew } from './crew';
import {
  armTheCasting, castsPerformers, castsReliability, layTheRoles, ranOverOnThem, takeFactor,
  theBiggestName,
} from './casting';
import { capabilitiesOf, exerciseTheOption } from './company';
import { armTheClaim } from './rebate';

export const MAKING_KIND = 'project.period';
export const DELIVERY_KIND = 'project.delivery';

/**
 * The tick at the far end of the last period.
 *
 * A picture needs a moment where the work is over and the picture is not yet
 * delivered, because that gap is where the paperwork lives and it is a real
 * place a production sits for months. Without a tick here the last period
 * would settle at the delivery date, weeks after everybody went home.
 */
export const WORK_DONE = 'done';

/**
 * A single part coming through a period, on a plan that finishes them in order.
 *
 * The payload carries which period and which part, so one scheduled kind
 * covers every part of every period of every plan.
 */
export const PART_KIND = 'project.part';

/**
 * A week passing on something that is being made.
 *
 * The production's heartbeat, and it runs from the first week of acquisition
 * to the last week of the cut. Two things happen on it: whatever is being
 * acquired is banked, weekly rather than in a lump at the end — banking it all
 * at the boundary would leave the shooting ratio right and the pressure
 * invisible — and the cut is weighed against the date.
 *
 * It has to be weekly and it has to span both, because on a plan whose cut
 * runs with its shoot the period boundaries are useless for this: the field,
 * the cut and the compliance all begin on the same morning, before an hour of
 * material exists, and the cut is still running months after the last week of
 * banking. Neither end of that is where the news is.
 */
export const BANK_KIND = 'project.banked';

// ---------------------------------------------------------------------------
// Laying a plan onto dates
// ---------------------------------------------------------------------------

export interface Dated {
  id: string;
  from: Instant;
  to: Instant;
}

export interface Laid {
  planId: string;
  shootWeeks: number;
  periods: Dated[];
  /** The date delivery is contractually due, which is after the work is done. */
  deliverBy: Instant;
}

/**
 * Turns a plan and one number into a calendar.
 *
 * The one number is the length of the plan's base period — the one carrying
 * `per: 1` — because that is the only length a producer actually chooses. On a
 * feature it is the shoot; on an unscripted season it is the field. Everything
 * else on a real schedule is quoted against it, so everything else falls out.
 *
 * Two things here are not the obvious implementation, and both are the
 * difference between a scheduler and a live-action scheduler.
 *
 * A period may declare `runsWith`, meaning it begins alongside another rather
 * than after it. Walking the list and setting each start to the previous end
 * is a live-action assumption wearing a general name: it cannot express post
 * beginning on field day one and running months past wrap, which is simply
 * what an unscripted season is. A period with no `runsWith` still starts after
 * everything declared before it has finished, so the ordinary case is unchanged.
 *
 * And the whole schedule can be anchored at either end. A picture starts when
 * the money says and delivers whenever it delivers. A broadcast season has its
 * transmission date agreed before anybody knows what the content is, and the
 * work is fitted backward into the room in front of it. `at` is read as the
 * start for one and as the delivery date for the other.
 */
export function layOut(plan: Plan, baseWeeks: number, at: Instant): Laid {
  const periods: Dated[] = [];
  const startOf = new Map<string, Instant>();
  let after = 0;

  for (const period of plan.periods) {
    const weeks = Math.max(1, Math.round(period.per * baseWeeks));
    // Alongside the period it names, or after everything declared before it.
    const from = period.runsWith !== undefined && startOf.has(period.runsWith)
      ? startOf.get(period.runsWith)!
      : after;
    const to = from + weeks * MS_WEEK;
    startOf.set(period.id, from);
    periods.push({ id: period.id, from, to });
    after = Math.max(after, to);
  }

  const work = periods.reduce((n, p) => Math.max(n, p.to), 0);
  // Shift the whole schedule so the anchored end lands where it was asked to.
  const shift = plan.anchor === 'delivery'
    ? at - (work + plan.deliveryWeeks * MS_WEEK)
    : at;
  for (const period of periods) { period.from += shift; period.to += shift; }

  return {
    planId: plan.id,
    shootWeeks: baseWeeks,
    periods,
    deliverBy: work + shift + plan.deliveryWeeks * MS_WEEK,
  };
}

/** The plan a project is being made to, where it has one. */
export function planOf(project: Project): Plan | undefined {
  return project.planId ? planById(project.planId) : undefined;
}

/** Which period a project is in right now, by its stage. */
export function periodOf(project: Project): Period | undefined {
  return planOf(project)?.periods.find((p) => p.stage === project.stage);
}

/** The dates of one named period, where the picture has a schedule. */
export function windowOf(project: Project, periodId: string): Dated | undefined {
  return project.periods?.find((p) => p.id === periodId);
}

/** When the crew comes on, which is the first date on the schedule. */
export function comesOn(project: Project): Instant | undefined {
  return project.periods?.[0]?.from;
}

/**
 * When the work is done, which is the latest date on it.
 *
 * The latest and not the last declared. Once periods can run alongside each
 * other the declaration order stops being the calendar order: an unscripted
 * season declares compliance last and it ends four weeks before the cut does.
 * Reading the last element was right when everything was sequential and is a
 * silent four-week lie the moment anything is not.
 */
export function finishesBy(project: Project): Instant | undefined {
  const periods = project.periods;
  if (!periods?.length) return undefined;
  return periods.reduce((latest, one) => Math.max(latest, one.to), periods[0]!.to);
}

/** Whether the whole schedule is behind the picture. */
export function pastTheWork(project: Project, at: Instant): boolean {
  const done = finishesBy(project);
  return done !== undefined && at >= done;
}

/** Every picture the company has in production, in the order they finish. */
export function inProduction(sim: Simulation): Project[] {
  return Object.values(sim.universe.projects)
    .filter((one) => !one.shelvedAt && one.planId !== undefined && one.stage !== 'delivered')
    .sort((a, b) => (finishesBy(a) ?? 0) - (finishesBy(b) ?? 0));
}

// ---------------------------------------------------------------------------
// Holding a stage
// ---------------------------------------------------------------------------

/** Stages with nothing else on them across a window, smallest first. */
export function freeAcross(sim: Simulation, from: Instant, to: Instant): SoundStage[] {
  return stagesOn(sim)
    .filter((stage) => !bookingsFor(sim, stage.id).some((b) => b.from < to && from < b.to))
    .sort((a, b) => a.floorSqm - b.floorSqm);
}

/**
 * Puts the company's own picture on a stage.
 *
 * At no rate, because a company invoicing itself is a wash that would put a
 * number on a screen meaning nothing. What it costs shows up where it really
 * does: in the lot's occupancy being high and its income being nil, and in the
 * enquiry next month that finds every room taken.
 */
export function holdAStage(
  sim: Simulation, project: Project, stageId: Id, from: Instant, to: Instant,
): Booking {
  const booking: Booking = {
    id: sim.nextId('booking'),
    saveId: sim.universe.meta.id,
    stageId,
    holder: project.title,
    companyId: project.companyId,
    kind: 'shooting',
    from,
    to,
    weekRateCents: 0,
  };
  sim.universe.bookings[booking.id] = booking;
  return booking;
}

/** What the lot gives up by housing its owner's picture, across the hold. */
export function foregone(sim: Simulation, booking: Booking): Money {
  const stage = sim.universe.stages[booking.stageId];
  if (!stage) return 0;
  const weeks = (booking.to - booking.from) / MS_WEEK;
  return Math.round(weeks * rateFor(stage, 'shooting'));
}

// ---------------------------------------------------------------------------
// Running over
// ---------------------------------------------------------------------------

export interface Squeeze {
  /** The schedule against what the money says it takes. 1 is matched. */
  tightness: number;
  /** How long the shoot runs, in weeks. A longer shoot slips further. */
  weeks: number;
  /**
   * What the cast is trusted to finish, out of a hundred.
   *
   * The third thing a producer chose, months earlier, thinking about something
   * else. Whether somebody turns up is not a claim about how good they are —
   * the best performer alive can be the one who does not come out of the
   * trailer — and it is the only thing about a cast that costs days. Absent
   * where nobody is cast, which reads as the middle of the scale.
   */
  trusted?: number;
}

/**
 * How far a shoot runs past its wrap date.
 *
 * Both inputs are things the player chose. A schedule cut below what the
 * budget implies runs over, in proportion to how far it was cut, and a long
 * shoot slips further than a short one because there is more of it to go
 * wrong. The draw only chooses where inside that range it lands.
 *
 * A schedule with room in it can still lose a day. Nothing shoots exactly to
 * plan, and a model that let it would be worse than one that did not.
 */
export function decideSlip(input: Squeeze, roll: number): { days: number; because: string } {
  const pressure = Math.max(0, 1.15 - input.tightness);
  // A cast nobody can rely on stretches whatever was going to happen anyway,
  // and one that turns up takes some of it back. Never the whole of it: a
  // schedule cut below what the picture costs runs over with saints in it.
  const holds = 1 + ((50 - (input.trusted ?? 50)) / 100) * TRUST_COSTS;
  const days = Math.round(input.weeks * SLIP_RATE * pressure * holds * (0.4 + roll * 1.6));
  if (days <= 0) {
    return { days: 0, because: 'The schedule holds. Wrap is where it was always going to be.' };
  }
  if ((input.trusted ?? 50) < 38) {
    return {
      days,
      because: 'The cast was late every morning of it, and by the second week the call sheet had stopped pretending.',
    };
  }
  if (input.tightness < 0.8) {
    return {
      days,
      because: 'The schedule was short of what the picture costs from the day it was set, and everybody on it knew.',
    };
  }
  return { days, because: 'The ordinary attrition of a shoot: weather, a cast member off sick, a day that went twice.' };
}

// ---------------------------------------------------------------------------
// Greenlighting
// ---------------------------------------------------------------------------

export interface Greenlight {
  projectId: Id;
  planId: string;
  budgetCents: Money;
  shootWeeks: number;
  /** What each part runs to, in seconds. Defaults to what the plan delivers. */
  secondsEach?: number;
  /** How many hands the cutting room gets. Defaults to what the plan assumes. */
  hands?: number;
  /**
   * The date the plan is anchored to, meaning whichever end the plan nails
   * down. On a plan anchored at the start it is the day the first period
   * begins; on one anchored at delivery it is the transmission date, and the
   * work is fitted backward in front of it. Defaults to eight weeks out for
   * the first and to a year out for the second, because a season commissioned
   * to start in eight weeks is a season nobody has cast.
   */
  from?: Instant;
  /** The stage to hold. Defaults to the smallest one free for the whole hold. */
  stageId?: Id;
}

/** How far out a greenlight puts the first day of prep, when nobody says. */
export const LEAD_WEEKS = 8;

/** How far out an unasked-for airdate sits. A season needs the room. */
export const AIRDATE_WEEKS = 52;

/** The longest schedule anybody will sit still for, in shooting weeks. */
export const LONGEST_SHOOT = 40;

/** What a greenlight would come to, worked out and committed to nothing. */
export interface Prospect {
  project: Project;
  plan: Plan;
  /** The shoot length, rounded the way the engine rounds it. */
  weeks: number;
  /** The date the plan is anchored to: a first day of prep, or a transmission date. */
  from: Instant;
  /** Every period, on real dates. */
  periods: Dated[];
  /** When the contract says it is due, which is after the work is done. */
  deliverBy: Instant;
  /** The window a stage is held across, where the plan holds one. */
  held?: { from: Instant; to: Instant };
  /** The stage it would take. */
  stageId?: Id;
  /** What each part runs to, in seconds. */
  secondsEach: number;
  /** How many parts a finished one of these is. */
  parts: number;
  /** Hands in the cutting room. */
  hands: number;
  /**
   * How far the schedule is cut below what the money implies.
   *
   * Not committed by the greenlight and returned anyway, because it is the one
   * figure a producer is deciding with and the engine works it out twice: here,
   * and again in `weighTheSchedule` when the shoot is weighed and the overrun
   * drawn. Handing back the same number means a screen that shows it is showing
   * what the slip will be decided from rather than a second estimate of it.
   */
  tightness: number;
}

/**
 * What a greenlight would come to, without saying yes to it.
 *
 * Every check and every date, and nothing written. `greenlight` is this plus
 * the commit, which is the only way a screen can show a producer the schedule
 * they are about to get: one mechanism rather than two calibrated near each
 * other. Two would drift, and the first time they did somebody would be shown
 * one set of dates and handed another — which is the bug this codebase has
 * already been bitten by once, in the cutting room's own forecast.
 */
export function wouldBe(
  sim: Simulation, spec: Greenlight,
): { ok: true; prospect: Prospect } | { ok: false; error: string } {
  const project = sim.universe.projects[spec.projectId];
  if (!project) return { ok: false, error: 'There’s no such picture on the slate.' };
  if (project.shelvedAt) return { ok: false, error: 'That one came off the slate.' };
  if (project.planId) return { ok: false, error: `${project.title} is already being made.` };

  // The door, and it refuses. The Family Business screen has always listed the
  // nine things a production company has to be able to do and said which were
  // shut — and then let a picture be greenlit through a shut one, so the whole
  // page was advice rather than a rule. A declared word nothing reads is worse
  // than no word: either the door means this, or it should not be on screen.
  const door = capabilitiesOf(sim).find((one) => one.id === 'greenlight');
  if (door && !door.can) {
    const missing = door.blockers.map((one) => one.need.toLowerCase());
    const said = missing.length === 1
      ? missing[0]!
      : `${missing.slice(0, -1).join(', ')} and ${missing[missing.length - 1]!}`;
    return {
      ok: false,
      error: `Nobody can say yes to ${project.title} yet. It needs ${said} first.`,
    };
  }

  const plan = planById(spec.planId);
  if (!plan) return { ok: false, error: 'There’s no such way of making it.' };
  if (!plan.media.includes(project.medium)) {
    return { ok: false, error: `${plan.label} isn’t how you make ${project.medium === 'film' ? 'a film' : 'television'}.` };
  }
  if (!Number.isFinite(spec.budgetCents) || spec.budgetCents <= 0) {
    return { ok: false, error: 'A greenlight needs a budget behind it.' };
  }
  const weeks = Math.round(spec.shootWeeks);
  if (!Number.isFinite(weeks) || weeks < 1) return { ok: false, error: 'It has to shoot for at least a week.' };
  if (weeks > LONGEST_SHOOT) {
    return { ok: false, error: `Nobody holds a crew together for ${weeks} weeks. ${LONGEST_SHOOT} is the outside of it.` };
  }

  // Read against the end the plan actually anchors, so a caller that says
  // nothing gets a sensible date for the kind of thing it is rather than a
  // start date silently used as an airdate.
  const lead = plan.anchor === 'delivery' ? AIRDATE_WEEKS : LEAD_WEEKS;
  const from = spec.from ?? sim.now + lead * MS_WEEK;
  const laid = layOut(plan, weeks, from);

  // Nothing can be made in a week that has already happened. On a plan
  // anchored at the start this is obvious and a caller has to try; on one
  // anchored at delivery it is the ordinary mistake, because the work is laid
  // out backward from the date and a near airdate puts the whole of it behind
  // you. It used to be accepted: casting, the rig and the field would all sit
  // in the past, their ticks scheduled and never fired, and the picture could
  // not be finished, delivered, sold, shelved or greenlit again. One date, and
  // the thing was stuck in the save forever.
  const opens = laid.periods.reduce((at, one) => Math.min(at, one.from), laid.periods[0]?.from ?? from);
  if (opens < sim.now) {
    const short = Math.ceil((sim.now - opens) / MS_WEEK);
    return {
      ok: false,
      error: plan.anchor === 'delivery'
        ? `${plan.label} needs ${Math.ceil((from - opens) / MS_WEEK)} weeks in front of that date and `
          + `there are ${Math.floor((from - sim.now) / MS_WEEK)}. Move it back ${short} weeks.`
        : `That start is ${short === 1 ? 'a week' : `${short} weeks`} ago.`,
    };
  }

  // And a budget the company has no way of meeting. It is not the cash in the
  // account — a picture is paid for as it goes and the family has covered the
  // difference since the first month — but a company cannot say yes to
  // something larger than the patience it has left to spend.
  const behindIt = (cashFor(sim, project.companyId)
    ? sim.universe.accounts[cashFor(sim, project.companyId)!]?.balance ?? 0
    : 0) + stillToCarry(sim);
  if (spec.budgetCents > behindIt) {
    return {
      ok: false,
      error: `There’s ${formatMoney(Math.max(0, behindIt), { cents: false })} behind this company, counting what the family `
        + `would still put in. ${formatMoney(spec.budgetCents, { cents: false })} is more than that.`,
    };
  }

  const held = holdingWindow(plan, laid);

  let stageId = spec.stageId;
  if (held) {
    const free = freeAcross(sim, held.from, held.to);
    if (stageId) {
      if (!free.some((s) => s.id === stageId)) {
        const stage = sim.universe.stages[stageId];
        return {
          ok: false,
          error: stage
            ? `${stage.name} is already booked across those dates.`
            : 'There’s no such stage.',
        };
      }
    } else {
      stageId = free[free.length - 1]?.id;
      if (!stageId) {
        return { ok: false, error: 'Every stage on the lot is booked across those dates.' };
      }
    }
  }

  // What it owes, part by part. A producer sets the runtime — an hour and
  // nineteen minutes is a perfectly ordinary answer — and the plan says how
  // many parts a finished one of these is.
  const seconds = Math.max(60, Math.round(spec.secondsEach ?? plan.delivers.secondsEach));
  return {
    ok: true,
    prospect: {
      project,
      plan,
      weeks,
      from,
      periods: laid.periods,
      deliverBy: laid.deliverBy,
      held,
      stageId,
      secondsEach: seconds,
      parts: plan.delivers.parts,
      hands: Math.max(1, Math.round(spec.hands ?? cuttingPeriod(plan)?.converts?.hands ?? 1)),
      tightness: tightnessOf(weeks, spec.budgetCents),
    },
  };
}

/**
 * Lays the dates down and takes the stage.
 *
 * Everything `wouldBe` refuses is refused because it is a way a real greenlight
 * falls apart: no money behind it, a schedule nobody could shoot, a schedule
 * laid into weeks that have gone, or a stage that turns out to be booked. The
 * last one is the interesting refusal, since it is the lot the family built
 * saying no to the family.
 */
export function greenlight(sim: Simulation, spec: Greenlight): { ok: true; project: Project } | { ok: false; error: string } {
  const answer = wouldBe(sim, spec);
  if (!answer.ok) return answer;
  const { prospect } = answer;
  const { project, plan, weeks, from, held, stageId } = prospect;
  const laid = { periods: prospect.periods, deliverBy: prospect.deliverBy };
  const seconds = prospect.secondsEach;

  project.planId = plan.id;
  project.ladders = plan.ladders;
  project.parts = Array.from({ length: plan.delivers.parts }, (_, i) => ({
    id: `${project.id}-${i + 1}`,
    ordinal: i + 1,
    seconds,
  }));
  project.owesSeconds = seconds * plan.delivers.parts;
  if (spec.hands !== undefined) project.hands = Math.max(1, Math.round(spec.hands));
  project.budgetCents = spec.budgetCents;
  project.stage = 'greenlit';
  // And the rights are bought outright, because that is what committing to a
  // picture is. An option carries a term and the term now runs — so this is the
  // thing that stops a picture in production ever losing its material, and the
  // reason an option running out is a mistake about hesitating rather than a
  // punishment for making something.
  exerciseTheOption(sim, project.holdingId);
  project.unitBaseId = theLot(sim)?.locationId;
  project.periods = laid.periods.map((p) => ({ ...p }));
  project.deliverBy = laid.deliverBy;

  if (stageId && held) {
    const booking = holdAStage(sim, project, stageId, held.from, held.to);
    project.stageId = stageId;
    project.bookingId = booking.id;
  }

  for (const period of laid.periods) {
    sim.schedule({
      at: period.from,
      kind: MAKING_KIND,
      label: `${project.title}: ${plan.periods.find((p) => p.id === period.id)?.label ?? period.id}`,
      category: 'business',
      priority: 20,
      payload: { projectId: project.id, periodId: period.id },
      refType: 'project',
      refId: project.id,
    });
  }
  // A plan that finishes its parts in order gets one tick per part, spread
  // across the span of each period that advances anything. Episode one comes
  // through the cut weeks before episode eight, which is the whole reason a
  // season is eight timelines rather than one.
  if (plan.partsFinish === 'inOrder' && plan.delivers.parts > 1) {
    for (const period of plan.periods) {
      if (period.advances === undefined) continue;
      // Except the cutting room's own period. Its parts come up as the room
      // turns them out, which is a rate and not a timetable, so scheduling
      // ticks for it would be a second mechanism moving the same parts.
      if (period.converts !== undefined) continue;
      const window = laid.periods.find((one) => one.id === period.id);
      if (!window) continue;
      const span = window.to - window.from;
      for (let i = 1; i <= plan.delivers.parts; i += 1) {
        sim.schedule({
          at: window.from + Math.round((span * i) / plan.delivers.parts),
          kind: PART_KIND,
          label: `${project.title}: Part ${i}, ${period.label}`,
          category: 'business',
          priority: 25,
          payload: { projectId: project.id, periodId: period.id, ordinal: i },
          refType: 'project',
          refId: project.id,
        });
      }
    }
  }

  // The heartbeat starts a week into the first thing that banks or cuts, and
  // from there each week puts the next one up for as long as there is a reason.
  const weekly = plan.periods
    .filter((one) => one.acquires !== undefined || one.converts !== undefined)
    .map((one) => laid.periods.find((window) => window.id === one.id))
    .filter((window): window is Dated => window !== undefined);
  if (weekly.length > 0) {
    const from = weekly.reduce((n, one) => Math.min(n, one.from), weekly[0]!.from);
    aWeekOn(sim, project, from + MS_WEEK, from);
  }

  const finishes = laid.periods.reduce<Instant | undefined>(
    (latest, one) => (latest === undefined ? one.to : Math.max(latest, one.to)), undefined,
  );
  if (finishes !== undefined) {
    sim.schedule({
      at: finishes,
      kind: MAKING_KIND,
      label: `${project.title}: The Work Is Done`,
      category: 'business',
      priority: 20,
      payload: { projectId: project.id, periodId: WORK_DONE },
      refType: 'project',
      refId: project.id,
    });
  }
  sim.schedule({
    at: laid.deliverBy,
    kind: DELIVERY_KIND,
    label: `${project.title}: Delivery Due`,
    category: 'business',
    priority: 20,
    payload: { projectId: project.id },
    refType: 'project',
    refId: project.id,
  });

  // And the people. A picture that has dates has a crew coming on against
  // them, starting long before the camera does.
  armTheCrew(sim, project);
  // And the parts. Written out now rather than filled now: this is the first
  // moment the picture knows its runtime, its parts and its money, and a role
  // priced before any of those would be a number somebody made up. Nobody is
  // in one yet, and nothing forces anybody ever to be.
  if (castsPerformers(plan)) {
    project.roles = layTheRoles(sim, project);
    armTheCasting(sim, project);
  }

  const stage = stageId ? sim.universe.stages[stageId] : undefined;
  const shoot = plan.periods.find((p) => p.holds === 'shooting');
  const shootFrom = shoot ? windowOf(project, shoot.id)?.from : undefined;
  const days = shoot ? Math.round(weeks * shoot.unit.aWeek) : 0;
  sim.notify({
    category: 'business',
    title: `${project.title} Is Greenlit`,
    body: `${shoot ? `${days} ${days === 1 ? shoot.unit.one : shoot.unit.many} from ${formatDate(shootFrom ?? from, sim.homeZone)}` : `Starting ${formatDate(from, sim.homeZone)}`}`
      + `${stage ? `, on ${stage.name}` : ''}, and due to be delivered by `
      + `${formatDate(laid.deliverBy, sim.homeZone)}.`,
    importance: 70,
    refType: 'project',
    refId: project.id,
  });

  return { ok: true, project };
}

/** The one unbroken run of periods that hold a stage, where there is one. */
export function holdingWindow(plan: Plan, laid: Laid): { from: Instant; to: Instant } | undefined {
  const holding = laid.periods.filter((p) => plan.periods.find((q) => q.id === p.id)?.holds);
  if (holding.length === 0) return undefined;
  return {
    from: Math.min(...holding.map((p) => p.from)),
    to: Math.max(...holding.map((p) => p.to)),
  };
}

// ---------------------------------------------------------------------------
// Walking it
// ---------------------------------------------------------------------------

/** The company's cash account, which is what a picture is made out of. */
function cashFor(sim: Simulation, companyId: Id): Id | undefined {
  return Object.values(sim.universe.accounts)
    .find((a) => a.ownerId === companyId && a.kind === 'company_cash' && !a.closedAt)?.id;
}

/**
 * A period starts.
 *
 * The money for the period that just ended goes out here, at its end, which is
 * the only honest place to put it when the clock only stops at boundaries. The
 * elements that period produced are handed over. Then, if the period starting
 * is the shoot, the schedule is weighed against the budget and the overrun is
 * settled before a frame is exposed, because that is genuinely when a crew
 * knows.
 */
function enterPeriod(sim: Simulation, project: Project, periodId: string): void {
  const plan = planOf(project);
  if (!plan) return;

  if (periodId === WORK_DONE) {
    settleWhatHasEnded(sim, project, plan);
    if (settleDelivery(sim, project)) return;
    const waiting = heldUpBy(project);
    sim.notify({
      category: 'business',
      title: `${project.title} Is Finished`,
      body: `The work is done and the picture isn’t delivered. `
        + `${waiting.length === 1 ? 'One element is' : `${waiting.length} elements are`} outstanding: `
        + `${waiting.map((e) => e.label).join(', ')}.`,
      importance: 60,
      refType: 'project',
      refId: project.id,
    });
    return;
  }

  const period = plan.periods.find((p) => p.id === periodId);
  if (!period) return;

  settleWhatHasEnded(sim, project, plan);

  project.stage = period.stage;
  sim.notify({
    category: 'business',
    title: `${project.title}: ${period.label}`,
    body: period.what,
    importance: 45,
    refType: 'project',
    refId: project.id,
  });

  if (period.holds === 'shooting') weighTheSchedule(sim, project, period);
}

/**
 * Settles every period that has actually ended, and only those.
 *
 * The one rule, in the one place, because there were two and they disagreed.
 * The end of the work swept for periods whose dates had passed; the start of a
 * period settled whichever period was *declared* before it. On a feature those
 * are the same thing, and a feature was honest. On anything with a `runsWith`
 * they are not, and declaration order is not calendar order: a series paid
 * fifty-eight percent of its budget on the shoot's first day, and a format
 * season paid its post period out the day before that period opened.
 *
 * The docstring on `enterPeriod` has always said the money goes out at a
 * period's end, "which is the only honest place to put it". This is that
 * sentence, written as code.
 */
function settleWhatHasEnded(sim: Simulation, project: Project, plan: Plan): void {
  for (const one of plan.periods) {
    const window = windowOf(project, one.id);
    if (window && window.to <= sim.now) settlePeriod(sim, project, one);
  }
}

/**
 * Spends what a period costs and hands over what it made.
 *
 * Once, however many routes reach it. A period is settled at the boundary of
 * whichever period was declared after it and again by the tick at the end of
 * the work, and posting its expense twice is a picture quietly spending its
 * budget twice — which is exactly what happened before this guard, to the tune
 * of ninety-six per cent over on a season.
 */
/**
 * What a period actually costs, once the rooms on it are counted.
 *
 * `spends` is a share of the budget and it knew nothing about staffing, so a
 * cutting room ran at whatever size the player set for exactly the same money:
 * six editors cost what one did. More hands was faster, gave more slack against
 * the date and cost nothing, which made the largest number correct on every
 * picture in every state. A decision nobody has a reason to answer twice is not
 * a decision, and this one is the only staffing call the game offers.
 *
 * So the part of the period that IS the rooms moves with the rooms, and the
 * part that is everything else does not. `ofTheSpend` on the plan says which is
 * which, and the ratio is against the staffing the plan itself assumes — so a
 * picture run the way its plan expects costs exactly what it always did, and
 * only a deliberate change costs or saves anything.
 */
export function whatThePeriodCost(project: Project, period: Period, budget: Money): Money {
  return periodAtThisStaffing(period, budget, handsOn(project));
}

/**
 * The same sum without a project, so a screen can price the decision before it
 * is taken rather than after.
 */
export function periodAtThisStaffing(period: Period, budget: Money, hands: number): Money {
  const base = budget * period.spends;
  const converts = period.converts;
  if (!converts || converts.hands <= 0) return Math.round(base);
  const rooms = base * converts.ofTheSpend;
  return Math.round((base - rooms) + rooms * (Math.max(0, hands) / converts.hands));
}

/** What one more room on this period costs, at this budget. */
export function aRoomCosts(period: Period, budget: Money): Money {
  const converts = period.converts;
  if (!converts || converts.hands <= 0) return 0;
  return Math.round((budget * period.spends * converts.ofTheSpend) / converts.hands);
}

function settlePeriod(sim: Simulation, project: Project, period: Period): void {
  if (project.settled?.includes(period.id)) return;
  project.settled = [...(project.settled ?? []), period.id];
  const account = cashFor(sim, project.companyId);
  const budget = project.budgetCents ?? 0;
  const owed = whatThePeriodCost(project, period, budget);
  if (account && owed > 0) {
    sim.expense(account, owed, `${project.title}: ${period.label}`, 'business',
      { refType: 'project', refId: project.id });
    project.spentCents += owed;
  }
  for (const element of elementsAfter(period.id, 'production')) {
    if (project.delivered.includes(element.id)) continue;
    project.delivered.push(element.id);
    if (element.moves) advance(project, element.moves.dimension, element.moves.to);
  }
  // And whatever finishing it moves up its ladder. A period that advances
  // nothing is a period that made no difference to how finished the thing is,
  // which is a real thing a period can be.
  //
  // Only on a plan whose parts finish together. Where they finish in order the
  // per-part ticks have already walked them up across the period's span, and
  // levelling everybody at the boundary would erase exactly the stagger those
  // ticks exist to create.
  //
  // Nor on the cutting room's own period, whatever the plan says about how its
  // parts finish. Nothing comes out of a cutting room because the calendar
  // reached the end of it.
  const plan = planOf(project);
  if (period.converts !== undefined) return;
  if (plan?.partsFinish === 'inOrder' && (project.parts?.length ?? 1) > 1) return;
  for (const [dimension, rung] of Object.entries(period.advances ?? {})) {
    advance(project, dimension as never, rung as string);
  }
}

/**
 * Puts the next weekly tick on the calendar, while there is a reason for one.
 *
 * One item at a time rather than the whole run laid out at greenlight, because
 * how long the cutting room needs is not known at greenlight — it is whatever
 * the room's rate and the hands it was given turn out to make it. A season
 * whose cut runs past the end of its own post period keeps cutting; it does
 * not stop unfinished because the calendar said post was over.
 */
function aWeekOn(sim: Simulation, project: Project, at: Instant, since: Instant): void {
  sim.schedule({
    at,
    kind: BANK_KIND,
    label: `${project.title}: A Week Of Work`,
    category: 'business',
    priority: 30,
    payload: { projectId: project.id, since },
    refType: 'project',
    refId: project.id,
  });
}

/**
 * The last moment a week of this is worth ticking for, as things stand today.
 *
 * Read fresh every week rather than fixed at greenlight, because a shoot that
 * runs over moves everything behind it and a heartbeat that stopped on the old
 * date would leave the last part sitting in the cutting room, cut and never
 * released, for the sake of two days.
 */
function weeklyThrough(project: Project): Instant | undefined {
  const plan = planOf(project);
  if (!plan) return undefined;
  const work = plan.periods
    .filter((one) => one.acquires !== undefined || one.converts !== undefined)
    .map((one) => windowOf(project, one.id)?.to)
    .reduce<Instant | undefined>(
      (latest, to) => (to === undefined ? latest : Math.max(latest ?? to, to)), undefined,
    );
  if (work === undefined) return project.deliverBy;
  // Through to the delivery date and not to the end of the work, because the
  // weeks between finishing and delivering are where the paperwork lives and
  // where the research puts the lawyer. A heartbeat that stopped when the
  // cutting room closed would leave the one week this whole mechanism exists
  // for — the work finished, the thing not delivered — with no tick in it.
  return project.deliverBy === undefined ? work : Math.max(work, project.deliverBy);
}

/**
 * Runs the cutting room for one week.
 *
 * This is where money stops being money. The room's hands and the rate for
 * what they do give a number of finished seconds; those seconds cover the
 * parts in order; a part whose runtime is covered has come out of the cut.
 * Nothing about it is a timetable, which is the whole point — staff the room
 * with one editor instead of two and the parts genuinely arrive later, rather
 * than arriving on time with a warning printed next to them.
 *
 * Coming out of the cut is not the same as being finished, and the second half
 * of this is the difference. What sits above the cut on a season's ladder is a
 * producer, an executive and a broadcaster, and their time is calendar time
 * rather than editor-weeks: no amount of staffing makes a channel watch it
 * sooner. So a part is released to the rest of the period's ladder when both
 * are true — the room has cut it, and its turn in the period has come.
 */
function runTheCut(sim: Simulation, project: Project, share: number): void {
  const plan = planOf(project);
  const period = plan ? cuttingPeriod(plan) : undefined;
  const upTo = period?.converts?.upTo;
  if (!plan || !period || !upTo) return;
  const window = windowOf(project, period.id);
  if (!window || sim.now <= window.from) return;

  const parts = [...partsOf(project)].sort((a, b) => a.ordinal - b.ordinal);

  // The week's output, spent on what is owed again before anything new. A room
  // handed an episode back is a room not cutting the next one, which is the
  // only honest way a recut can cost anything: there is one room, it runs at
  // one rate, and every second of a second pass is a second the rest of the
  // season does not get.
  let made = cutsAWeek(project) * share;
  for (const part of parts) {
    const owes = part.recut ?? 0;
    if (owes <= 0 || made <= 0) continue;
    const paid = Math.min(owes, made);
    part.recut = owes - paid;
    made -= paid;
  }
  // Clamped at what the thing owes. Seconds cut twice are not seconds in
  // credit, and an unclamped overshoot would quietly pay for a recut later.
  project.cut = Math.min(owedSeconds(project), (project.cut ?? 0) + made);

  const span = Math.max(1, window.to - window.from);
  let covered = 0;
  for (const part of parts) {
    covered += part.seconds;
    if (covered > (project.cut ?? 0)) break;
    // A part the room still owes is a part the room has not finished, whatever
    // the coverage says.
    if ((part.recut ?? 0) > 0) continue;
    advancePart(project, part, 'picture', upTo);
    // Its turn, measured the way the per-part ticks measure it: evenly across
    // the period, because that is how long the people above the cut take.
    if (sim.now < window.from + Math.round((span * part.ordinal) / parts.length)) continue;
    let moved = false;
    for (const [dimension, rung] of Object.entries(period.advances ?? {})) {
      if (advancePart(project, part, dimension as never, rung as string)) moved = true;
    }
    if (moved) sayAPartIsThrough(sim, project, period, part.ordinal);
  }
}

/**
 * Gives back what a period already did, to a part that has lost it.
 *
 * Not a second mechanism that moves work up — it re-runs the one that already
 * did, for periods whose window is behind the picture. A period that has been
 * through once can be through again, and that is what a compliance office
 * watching an episode a second time actually is.
 *
 * It is a no-op on the way up, which is how it stays one mechanism rather than
 * two. Everything it re-applies has already been applied by the per-part ticks
 * or by settling, and `advancePart` refuses a move that is not upward. It only
 * does anything at all on a part that has fallen.
 *
 * The cutting room's own period is left out, because `runTheCut` owns that one
 * and two things moving the same parts is the bug this file has already been
 * bitten by. And nothing is given back to a part the room has not finished
 * again: a compliance office does not pass an episode that is currently in
 * pieces on somebody's timeline.
 */
function putItBack(sim: Simulation, project: Project): void {
  const plan = planOf(project);
  if (!plan) return;
  const cutting = cuttingPeriod(plan)?.id;
  for (const period of plan.periods) {
    const window = windowOf(project, period.id);
    if (!window || sim.now < window.to) continue;
    // The cutting room's own advances belong to `runTheCut` and nothing else
    // may touch them. Its delivery elements are a different matter: a master is
    // made by the work, so remaking the work is what hands one over again, and
    // without this a rejected master is a picture that can never be delivered.
    if (period.id !== cutting) {
      for (const part of partsOf(project)) {
        if (!outOfTheRoom(project, part, plan)) continue;
        if (putBack(project, part, period.advances ?? {})) {
          sayAPartIsThrough(sim, project, period, part.ordinal);
        }
      }
    }
    // And the elements that come out of the work, which is the way back for a
    // master that was rejected: the work makes it again, and making it is what
    // hands it over.
    if (!project.settled?.includes(period.id)) continue;
    for (const element of elementsAfter(period.id, 'production')) {
      if (project.delivered.includes(element.id)) continue;
      // Only once the work behind it is back. An element that moves a
      // dimension is a claim about that dimension, and filing it off a part
      // that is still in pieces would walk the ladder rather than climb it.
      if (element.moves && !backUpTo(project, element.moves.dimension, element.moves.to)) continue;
      project.delivered.push(element.id);
      if (element.moves) advance(project, element.moves.dimension, element.moves.to);
    }
  }
}

/**
 * Whether every part stands one rung below the one an element would claim.
 *
 * The gate that stops the delivery list being a ladder of its own. Captions
 * take conform from mastered to accepted; they cannot take it from the floor,
 * because there is no master to check.
 */
function backUpTo(project: Project, dimension: DimensionId, to: string): boolean {
  const rungs = rungsOf(laddersOf(project), dimension);
  const want = rungs.findIndex((one) => one.id === to);
  if (want <= 0) return true;
  return partsOf(project).every((part) => stepOfPart(project, part, dimension) >= want - 1);
}

/**
 * Somebody watches the finished work, once a week, one part at a time.
 *
 * The whole reason the maturity vector is a vector. Until this existed nothing
 * in the engine ever sent a dimension down, so a ladder that could be fallen
 * off was a ladder nobody ever fell off, and `knockBack` was a mechanism with
 * no cause — which by this project's own rule is worse than not having it.
 *
 * It rides the weekly tick rather than a boundary because a review is not an
 * event at a boundary. It is a person watching a cut at whatever rung the cut
 * has reached that week, every week, and on a plan whose compliance runs
 * alongside its cut there is no boundary to hang it on anyway.
 */
function review(sim: Simulation, project: Project): void {
  const plan = planOf(project);
  if (!plan || project.stage === 'delivered') return;
  const deck = deckFor(project, plan, theBiggestName(sim, project));
  if (deck.length === 0) return;
  const exposure = exposureOf(project, sim);
  const ladders = laddersOf(project);
  const week = Math.round(sim.now / MS_WEEK);

  for (const part of partsOf(project)) {
    const found = decideReview({
      ladders,
      deck,
      climbed: climbedTo(project, part),
      exposure,
      whether: sim.rng('making', 'review', project.id, part.id, week).next(),
      which: sim.rng('making', 'found', project.id, part.id, week).next(),
    });
    const finding = found.finding;
    if (!finding || found.said === 'nothing found') continue;

    const to = landsOn(project, part, finding, plan);
    if (to === undefined) continue;
    const stood = rungReads(project, part, finding.dimension);
    let fell: number;
    if (finding.scope === 'whole') {
      fell = knockEverything(project, finding, to, plan);
    } else {
      const own = knockBackPart(project, part, finding.dimension, to).fell;
      const apart = comesApart(project, part, finding.dimension, plan, own);
      fell = own + apart.fell;
      // What the room owes again: the picture it lost, whether the finding hit
      // the picture directly or pulled it down behind something else.
      backToTheRoom(project, plan, part, finding.dimension === 'picture' ? own : apart.picture);
    }
    if (fell === 0) continue;

    // A name going off is the one row on the deck whose damage outlives the
    // picture: the attention goes on the person, and they carry it into every
    // sale and every casting office afterwards.
    const gone = finding.id === 'a-name-goes-off' ? somebodyGoesOff(sim, project) : undefined;

    const struck = takeItBack(project);
    const parts = partsOf(project).length;
    sim.notify({
      category: 'business',
      title: `${project.title}: ${finding.label}`,
      body: `${finding.what}${gone ? ` It’s ${gone.displayName}.` : ''}`
        + ` ${parts > 1 ? `Part ${part.ordinal} was at ${stood.toLowerCase()}` : `It was at ${stood.toLowerCase()}`}`
        + ` and it’s ${fell === 1 ? 'a rung' : `${fell} rungs`} lower now.`
        + `${struck.length > 0 ? ` ${struck.join(' and ')} ${struck.length === 1 ? 'comes' : 'come'} back off the delivery list.` : ''}`,
      importance: fell > 4 ? 80 : 55,
      refType: 'project',
      refId: project.id,
    });
  }
}

/**
 * Moves one part up, the way a block shoot actually finishes a season.
 *
 * Scheduled across the span of a period that declares `inOrder`, so episode
 * one locks weeks before episode eight and the season sits at eight different
 * rungs in between. Without this a season is one timeline drawn eight times.
 */
function finishOnePart(sim: Simulation, project: Project, periodId: string, ordinal: number): void {
  const plan = planOf(project);
  const period = plan?.periods.find((p) => p.id === periodId);
  const part = project.parts?.find((one) => one.ordinal === ordinal);
  if (!period || !part) return;
  let moved = false;
  for (const [dimension, rung] of Object.entries(period.advances ?? {})) {
    if (advancePart(project, part, dimension as never, rung as string)) moved = true;
  }
  if (!moved) return;
  sayAPartIsThrough(sim, project, period, ordinal);
}

/** Says one part is through one period, whatever moved it. */
function sayAPartIsThrough(
  sim: Simulation, project: Project, period: Period, ordinal: number,
): void {
  sim.notify({
    category: 'business',
    title: `${project.title}: Part ${ordinal} Is Through ${period.label}`,
    body: `${partsOutstanding(project).length} of ${project.parts?.length ?? 1} still to come, `
      + `and the whole thing reads ${Math.round(doneShare(project) * 100)}/100.`,
    importance: 35,
    refType: 'project',
    refId: project.id,
  });
}

/**
 * Measures the schedule against the budget, and pushes wrap out if it is short.
 *
 * Everything after the shoot moves with it, including the delivery date,
 * because a picture that wraps late does not deliver on time by working
 * harder. The stage is asked for the extra weeks and can refuse, which is the
 * worst version of this and the one worth modeling: a production standing in a
 * room it has to be out of on Friday.
 */
function weighTheSchedule(sim: Simulation, project: Project, shooting: Period): void {
  const window = windowOf(project, shooting.id);
  if (!window) return;
  const weeks = (window.to - window.from) / MS_WEEK;
  const tightness = tightnessOf(weeks, project.budgetCents ?? 0);
  const roll = sim.rng('making', 'slip', project.id).next();
  const trusted = castsReliability(sim, project);
  const slip = decideSlip(
    { tightness, weeks, ...(trusted !== undefined ? { trusted } : {}) }, roll,
  );
  if (slip.days <= 0) return;

  // The shoot gets longer and everything behind it moves by the same amount.
  // A picture that wraps late does not deliver on time by working harder.
  const by = slip.days * MS_DAY;
  let behind = false;
  for (const period of project.periods ?? []) {
    if (behind) period.from += by;
    if (period.id === shooting.id) behind = true;
    if (behind) period.to += by;
  }
  if (project.deliverBy !== undefined) project.deliverBy += by;

  // What the extra days cost, against what an ordinary day of this shoot cost.
  const aDay = (project.budgetCents ?? 0) * shooting.spends / Math.max(1, weeks * shooting.unit.aWeek);
  const over = Math.round(aDay * slip.days * SLIP_COSTS);
  const account = cashFor(sim, project.companyId);
  if (account && over > 0) {
    sim.expense(account, over, `${project.title}: Days Over`, 'business',
      { refType: 'project', refId: project.id });
    project.spentCents += over;
  }

  // And it sticks to everybody who was on it. A production that overran is a
  // production the whole cast was on, and the next producer reading the list
  // does not know whose fault it was either.
  ranOverOnThem(sim, project, slip.days);

  const kept = project.bookingId ? keepTheStage(sim, project, by) : true;
  sim.notify({
    category: 'business',
    title: `${project.title} Runs Over`,
    body: `${slip.days === 1 ? 'A day' : `${slip.days} days`} past wrap. ${slip.because}`
      + `${kept ? '' : ' The stage is let to somebody else from the old date, so the last of it shoots elsewhere.'}`,
    importance: 65,
    refType: 'project',
    refId: project.id,
  });

  // Through the timeline's own reschedule, never by writing `at` in place. The
  // list is held sorted and walked by a forward-only cursor, so an in-place
  // write leaves it unsorted with the cursor pointing at the wrong item, and
  // that surfaces as an event firing out of order weeks later.
  const moving = sim.universe.scheduled.filter((item) => (
    item.status === 'pending'
    && item.refId === project.id
    && ((item.kind === MAKING_KIND && item.at > sim.now) || item.kind === DELIVERY_KIND)
  ));
  for (const item of moving) sim.timeline.reschedule(item.id, item.at + by);
}

/** Asks the stage for the extra weeks. It can say no. */
function keepTheStage(sim: Simulation, project: Project, by: number): boolean {
  const booking = project.bookingId ? sim.universe.bookings[project.bookingId] : undefined;
  if (!booking) return true;
  const wants = booking.to + by;
  const clash = bookingsFor(sim, booking.stageId)
    .some((b) => b.id !== booking.id && b.from < wants && booking.to < b.to);
  if (clash) return false;
  booking.to = wants;
  return true;
}

// ---------------------------------------------------------------------------
// Delivery
// ---------------------------------------------------------------------------

/** What is still outstanding, in the order a person would chase it. */
export function stillMissing(project: Project): Element[] {
  return DELIVERY.filter((e) => !project.delivered.includes(e.id))
    .sort((a, b) => Number(b.holdsPayment) - Number(a.holdsPayment));
}

/** Whether the money is still being held, and by what. */
export function heldUpBy(project: Project): Element[] {
  return stillMissing(project).filter((e) => e.holdsPayment);
}

/**
 * Whether the period an element waits on is behind the picture yet.
 *
 * Off the dates, not off the stage the picture reads, because a picture sits
 * at its last stage for weeks after the work is done and the paperwork is
 * exactly what happens in those weeks.
 */
export function canHandOver(project: Project, element: Element, at: Instant): boolean {
  const window = windowOf(project, element.after);
  // An element waiting on a period this plan does not have is not waiting.
  return window === undefined || at >= window.to;
}

/**
 * Files one piece of paperwork.
 *
 * Only the business half can be handed over this way. The production half
 * arrives when the work that made it does, and a producer cannot hurry the
 * grade by filing a form.
 */
export function handOver(sim: Simulation, projectId: Id, elementId: string): { ok: true } | { ok: false; error: string } {
  const project = sim.universe.projects[projectId];
  if (!project) return { ok: false, error: 'There’s no such picture.' };
  const element = elementById(elementId);
  if (!element) return { ok: false, error: 'There’s no such element on the list.' };
  if (element.by !== 'business') {
    return { ok: false, error: `${element.label} comes out of the work. Nobody can file it early.` };
  }
  if (project.delivered.includes(element.id)) {
    return { ok: false, error: `${element.label} has already gone over.` };
  }
  // A certificate is a thing you hold, not a form you fill in. The delivery
  // list has always had errors and omissions cover on it and the Family
  // Business screen has always had a door that says a picture cannot be handed
  // over without it — and nothing joined the two, so a production could file
  // the certificate for cover it had never bought.
  const door = capabilitiesOf(sim).find((one) => one.id === 'deliver');
  if (element.id === 'eo' && door && !door.can) {
    return {
      ok: false,
      error: `${element.label} is a certificate, and the company hasn’t got one. `
        + `${door.blockers[0]!.how}`,
    };
  }
  if (!project.planId) return { ok: false, error: `${project.title} isn’t being made yet.` };
  if (!canHandOver(project, element, sim.now)) {
    const window = windowOf(project, element.after);
    const period = planOf(project)?.periods.find((p) => p.id === element.after);
    return {
      ok: false,
      error: `${element.label} can’t go over until ${period?.label.toLowerCase() ?? element.after} is finished`
        + `${window ? `, on ${formatDate(window.to, sim.homeZone)}` : ''}.`,
    };
  }
  project.delivered.push(element.id);
  if (element.moves) advance(project, element.moves.dimension, element.moves.to);
  settleDelivery(sim, project);
  return { ok: true };
}

/**
 * Checks whether the list is complete, and pays the price of it being late.
 *
 * The penalty is charged here and only here, at the moment the last element
 * goes over, which is when a distributor actually works out what it owes. A
 * picture two months late pays for two months.
 */
export function settleDelivery(sim: Simulation, project: Project): boolean {
  if (heldUpBy(project).length > 0) return false;
  // The contractual list being complete is not the same as the work being
  // finished, and this is the order they actually bite in: a picture whose
  // elements are all filed but whose rights are not cleared has handed over a
  // box of things it does not own.
  if (!isFinished(project)) return false;
  if (project.stage === 'delivered') return true;

  project.stage = 'delivered';
  project.deliveredAt = sim.now;

  const due = project.deliverBy ?? sim.now;
  const lateWeeks = Math.max(0, Math.ceil((sim.now - due) / MS_WEEK));
  if (lateWeeks > 0) {
    const account = cashFor(sim, project.companyId);
    const fine = Math.round((project.budgetCents ?? 0) * LATE_PENALTY_A_WEEK * lateWeeks);
    if (account && fine > 0) {
      sim.expense(account, fine, `${project.title}: Late Delivery`, 'business',
        { refType: 'project', refId: project.id });
      project.spentCents += fine;
      // A penalty is money gone and it is not spend, so an auditor certifies
      // none of it. Going over costs a picture three quarters of what it costs;
      // being late costs it all of it.
      project.notSpentHereCents = (project.notSpentHereCents ?? 0) + fine;
    }
  }

  // And the claim, where there is one to make. It goes on the calendar here
  // because a reimbursement is claimed against a finished production, and this
  // is the moment the production is finished.
  armTheClaim(sim, project);

  sim.notify({
    category: 'business',
    title: `${project.title} Is Delivered`,
    body: lateWeeks > 0
      ? `Every element is over, ${lateWeeks === 1 ? 'a week' : `${lateWeeks} weeks`} past the date, and the contract takes its cut of that.`
      : 'Every element is over, on the date, and the money is no longer being held.',
    importance: 70,
    refType: 'project',
    refId: project.id,
  });
  return true;
}

// ---------------------------------------------------------------------------
// Wiring
// ---------------------------------------------------------------------------

export function registerMaking(sim: Simulation): void {
  sim.onSchedule(MAKING_KIND, (item) => {
    const projectId = String(item.payload?.projectId ?? '');
    const periodId = String(item.payload?.periodId ?? '');
    const project = sim.universe.projects[projectId];
    if (!project || project.shelvedAt) return;
    enterPeriod(sim, project, periodId);
  });

  sim.onSchedule(BANK_KIND, (item) => {
    const project = sim.universe.projects[String(item.payload?.projectId ?? '')];
    if (!project || project.shelvedAt) return;
    // How much of a week this tick is actually worth. A full one, except where
    // the one before it was cut short to land on the end of something.
    const since = Number(item.payload?.since ?? item.at - MS_WEEK);
    const share = Math.max(0, Math.min(1, (item.at - since) / MS_WEEK));
    // What the cast does to the week. A cast that cannot repeat needs more
    // takes, and more takes is more material banked for the same finished
    // second — which is the shooting ratio, which is how far the cutting room
    // has to wade, which is the delivery date. Read once a week rather than
    // fixed at the greenlight, so a part cast late is a part that only slows
    // the weeks after it was cast.
    const takes = takeFactor(sim, project);
    // Every period that is acquiring this week banks its week. Which ones
    // those are is a question about the calendar and not about which period
    // the tick was scheduled under, because more than one can be running.
    for (const period of planOf(project)?.periods ?? []) {
      const window = windowOf(project, period.id);
      if (!window || item.at <= window.from || item.at > window.to) continue;
      bankAWeek(project, period, share, takes);
    }
    runTheCut(sim, project, share);
    putItBack(sim, project);
    weighTheCut(sim, project);
    review(sim, project);
    // And whether all of that leaves a thing that can be handed over. The
    // delivery tick is one-shot and long past by the time a recut finishes, so
    // without this a season that climbed back out of a knock would be finished
    // and undeliverable for the rest of the save.
    settleDelivery(sim, project);
    // And next week, if there is still material to get through or calendar
    // left to get through it in. A room with nobody in it is the one case
    // where another week changes nothing, so it stops.
    //
    // The next one lands on the end of the run rather than stepping past it,
    // so the last part comes out of the cutting room on the day the plan says
    // the cutting room closes and not on the following Tuesday.
    const through = weeklyThrough(project) ?? item.at;
    const step = item.at + MS_WEEK;
    const next = item.at < through && step > through ? through : step;
    // It runs until the thing has gone over, and not until the work is done.
    // Those are different dates and the weeks between them are the ones this
    // whole mechanism exists for: a review that knocked an episode down and
    // then stopped, because the cutting room had closed, would leave it down
    // for the rest of the save. Nothing else would ever look at it again.
    const more = project.stage !== 'delivered';
    if (more && cutsAWeek(project) > 0) aWeekOn(sim, project, next, item.at);
  });

  sim.onSchedule(PART_KIND, (item) => {
    const project = sim.universe.projects[String(item.payload?.projectId ?? '')];
    if (!project || project.shelvedAt) return;
    finishOnePart(sim, project, String(item.payload?.periodId ?? ''), Number(item.payload?.ordinal ?? 0));
  });

  sim.onSchedule(DELIVERY_KIND, (item) => {
    const projectId = String(item.payload?.projectId ?? '');
    const project = sim.universe.projects[projectId];
    if (!project || project.shelvedAt) return;
    if (settleDelivery(sim, project)) return;
    const waiting = heldUpBy(project);
    const short = holdingItUp(project);
    if (waiting.length === 0 && short.length > 0) {
      sim.notify({
        category: 'business',
        title: `${project.title} Is Due And Isn’t Finished`,
        body: `Every element on the list is filed and the work isn’t done. `
          + `${spokenDimensions(short)} still short of where it has to be.`,
        importance: 75,
        refType: 'project',
        refId: project.id,
      });
      return;
    }
    sim.notify({
      category: 'business',
      title: `${project.title} Is Due And Isn’t Delivered`,
      body: `${waiting.length === 1 ? 'One element is' : `${waiting.length} elements are`} still outstanding, `
        + `and the money is held until ${waiting.length === 1 ? 'it goes' : 'they go'} over: `
        + `${waiting.map((e) => e.label).join(', ')}.`,
      importance: 75,
      refType: 'project',
      refId: project.id,
    });
  });

  sim.onCommand<Greenlight, { ok: boolean; id?: Id; error?: string }>(
    'company.greenlight', (payload, { sim: s }) => {
      const done = greenlight(s, payload);
      return done.ok ? { ok: true, id: done.project.id } : { ok: false, error: done.error };
    },
  );

  sim.onCommand<{ projectId: Id; elementId: string }, { ok: boolean; error?: string }>(
    'company.deliver', (payload, { sim: s }) => handOver(s, payload.projectId, payload.elementId),
  );
}

/** Where a picture stands, in a sentence. */
export function whereThePictureStands(sim: Simulation, project: Project): string {
  if (!project.planId) return `${project.title} is on the slate and nobody has said yes to it.`;
  if (project.stage === 'delivered') {
    return `${project.title} is delivered${project.deliveredAt ? ` as of ${formatDate(project.deliveredAt, sim.homeZone)}` : ''}.`;
  }
  const held = heldUpBy(project);
  if (pastTheWork(project, sim.now)) {
    return held.length > 0
      ? `${project.title} is finished and unpaid for, waiting on ${held.length === 1 ? held[0]!.label : `${held.length} elements`}.`
      : `${project.title} is finished.`;
  }
  const period = periodOf(project);
  if (!period) {
    const on = comesOn(project);
    return `${project.title} is greenlit${on ? `, and the crew comes on ${formatDate(on, sim.homeZone)}` : ''}.`;
  }
  const ends = windowOf(project, period.id)?.to;
  return `${project.title} is in ${period.label.toLowerCase()}`
    + `${ends ? `, through ${formatDate(ends, sim.homeZone)}` : ''}.`;
}

/** The lot's name, where a picture needs to say where it is being made. */
export const MADE_AT = LOT_NAME;

/** The dimensions falling short, named the way a person would say them. */
function spokenDimensions(ids: readonly string[]): string {
  const names = ids.map((id) => dimensionById(id)?.label.toLowerCase() ?? id);
  if (names.length === 1) return `${names[0]![0]!.toUpperCase()}${names[0]!.slice(1)} is`;
  const last = names[names.length - 1]!;
  const rest = names.slice(0, -1).join(', ');
  const said = `${rest} and ${last}`;
  return `${said[0]!.toUpperCase()}${said.slice(1)} are`;
}

/** Every dimension a plan never moves, which is what somebody has to do by hand. */
export function nobodysJob(plan: Plan): string[] {
  const moved = new Set(plan.periods.flatMap((p) => Object.keys(p.advances ?? {})));
  return DIMENSIONS.map((d) => d.id).filter((id) => !moved.has(id));
}
