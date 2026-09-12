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
import type { Money } from '../core/money';
import type { Instant } from '../core/time';
import type { Project } from '../domain/company';
import { MS_DAY, formatDate } from '../core/time';
import {
  DELIVERY, LATE_PENALTY_A_WEEK, SLIP_COSTS, SLIP_RATE,
  type Element, type Period, type Plan,
  elementById, elementsAfter, planById, tightnessOf,
} from '../content/making';
import { LOT_NAME } from '../content/estate';
import { MS_WEEK, bookingsFor, rateFor, stagesOn, theLot } from './lot';
import { armTheCrew } from './crew';

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
 * The one number is the length of the shoot, because that is the only number
 * a producer actually chooses. Everything else on a schedule is quoted against
 * it, so everything else falls out.
 */
export function layOut(plan: Plan, shootWeeks: number, from: Instant): Laid {
  const periods: Dated[] = [];
  let at = from;
  for (const period of plan.periods) {
    const weeks = Math.max(1, Math.round(period.per * shootWeeks));
    const to = at + weeks * MS_WEEK;
    periods.push({ id: period.id, from: at, to });
    at = to;
  }
  return {
    planId: plan.id,
    shootWeeks,
    periods,
    deliverBy: at + plan.deliveryWeeks * MS_WEEK,
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

/** When the work is done, which is the last date on it. */
export function finishesBy(project: Project): Instant | undefined {
  const periods = project.periods;
  return periods?.[periods.length - 1]?.to;
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
  const days = Math.round(input.weeks * SLIP_RATE * pressure * (0.4 + roll * 1.6));
  if (days <= 0) {
    return { days: 0, because: 'The schedule holds. Wrap is where it was always going to be.' };
  }
  if (input.tightness < 0.8) {
    return {
      days,
      because: 'The schedule was short of what the picture costs from the day it was set, and everybody on it knew.',
    };
  }
  return { days, because: 'The ordinary attrition of a shoot: weather, a sick actor, a day that went twice.' };
}

// ---------------------------------------------------------------------------
// Greenlighting
// ---------------------------------------------------------------------------

export interface Greenlight {
  projectId: Id;
  planId: string;
  budgetCents: Money;
  shootWeeks: number;
  /** When the crew comes on. Defaults to eight weeks out. */
  from?: Instant;
  /** The stage to hold. Defaults to the smallest one free for the whole hold. */
  stageId?: Id;
}

/** How far out a greenlight puts the first day of prep, when nobody says. */
export const LEAD_WEEKS = 8;

/** The longest schedule anybody will sit still for, in shooting weeks. */
export const LONGEST_SHOOT = 40;

/**
 * Lays the dates down and takes the stage.
 *
 * Everything checked here is checked because it is a way a real greenlight
 * falls apart: no money behind it, a schedule nobody could shoot, or a stage
 * that turns out to be booked. The last one is the interesting refusal, since
 * it is the lot the family built saying no to the family.
 */
export function greenlight(sim: Simulation, spec: Greenlight): { ok: true; project: Project } | { ok: false; error: string } {
  const project = sim.universe.projects[spec.projectId];
  if (!project) return { ok: false, error: 'There’s no such picture on the slate.' };
  if (project.shelvedAt) return { ok: false, error: 'That one came off the slate.' };
  if (project.planId) return { ok: false, error: `${project.title} is already being made.` };

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

  const from = spec.from ?? sim.now + LEAD_WEEKS * MS_WEEK;
  const laid = layOut(plan, weeks, from);
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

  project.planId = plan.id;
  project.budgetCents = spec.budgetCents;
  project.stage = 'greenlit';
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
  const finishes = laid.periods[laid.periods.length - 1]?.to;
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
    const last = plan.periods[plan.periods.length - 1];
    if (last) settlePeriod(sim, project, last);
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

  const was = plan.periods[plan.periods.indexOf(period) - 1];
  if (was) settlePeriod(sim, project, was);

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

/** Spends what a period costs and hands over what it made. */
function settlePeriod(sim: Simulation, project: Project, period: Period): void {
  const account = cashFor(sim, project.companyId);
  const budget = project.budgetCents ?? 0;
  const owed = Math.round(budget * period.spends);
  if (account && owed > 0) {
    sim.expense(account, owed, `${project.title}: ${period.label}`, 'business',
      { refType: 'project', refId: project.id });
    project.spentCents += owed;
  }
  for (const element of elementsAfter(period.id, 'production')) {
    if (!project.delivered.includes(element.id)) project.delivered.push(element.id);
  }
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
  const slip = decideSlip({ tightness, weeks }, roll);
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
    }
  }

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

  sim.onSchedule(DELIVERY_KIND, (item) => {
    const projectId = String(item.payload?.projectId ?? '');
    const project = sim.universe.projects[projectId];
    if (!project || project.shelvedAt) return;
    if (settleDelivery(sim, project)) return;
    const waiting = heldUpBy(project);
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
