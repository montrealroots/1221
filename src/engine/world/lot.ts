/**
 * SLATE — Sugar Land Studios as a thing that costs money and sometimes earns it.
 *
 * `content/lot.ts` says what stands there and what it is measured against.
 * This puts it in the save, charges the company for owning it, and works out
 * what it is doing from the bookings rather than from a stored number.
 *
 * The rule this file is written to: **occupancy and income are not fields.**
 * A lot that stored its own occupancy would be a lot that could report being
 * two thirds full on a month nobody booked, and nothing would catch it. Both
 * are read off the bookings and the ledger every time somebody asks, which
 * costs a loop over a handful of records and buys the guarantee that the
 * number on the screen is the number in the world.
 */

import type { Simulation } from '../core/simulation';
import type { Booking, BookingKind, Id, Property, SoundStage } from '../domain/model';
import type { Instant } from '../core/time';
import type { Money } from '../core/money';
import { MS_DAY, instantFromZoned, zonedParts } from '../core/time';
import {
  BUILD_COST_CENTS, CREW_PENALTY, LOT_FLOOR_SQM, MONTHLY_OVERHEAD_CENTS, OVERHEAD, RATE_SHARE,
  ENQUIRY_SHAPES, STAGES, type Enquiry,
} from '../content/lot';
import { REBATE } from '../content/incorporation';
import { GROUP } from '../content/sugar';
import { profitThisYear } from './sugar';
import { ESTATE_CITY_ID, LOT_NAME, estatePlaceLine, movedInAt } from '../content/estate';

/** A week, which is the unit a stage is let in. */
export const MS_WEEK = 7 * MS_DAY;

/** The lot, if it has been built. */
export function theLot(sim: Simulation): Property | undefined {
  return Object.values(sim.universe.properties).find((p) => p.kind === 'studio_lot');
}

/** Every stage on it, in the order they were built. */
export function stagesOn(sim: Simulation, propertyId?: Id): SoundStage[] {
  const lotId = propertyId ?? theLot(sim)?.id;
  if (!lotId) return [];
  return Object.values(sim.universe.stages)
    .filter((s) => s.propertyId === lotId)
    .sort((a, b) => a.builtAt - b.builtAt || a.name.localeCompare(b.name));
}

/** Everything booked onto one stage, earliest first. */
export function bookingsFor(sim: Simulation, stageId: Id): Booking[] {
  return Object.values(sim.universe.bookings)
    .filter((b) => b.stageId === stageId)
    .sort((a, b) => a.from - b.from);
}

/** Whatever is on a stage at a given moment, if anything. */
export function onStageAt(sim: Simulation, stageId: Id, at: Instant): Booking | undefined {
  return bookingsFor(sim, stageId).find((b) => at >= b.from && at < b.to);
}

// ---------------------------------------------------------------------------
// What the lot is doing, worked out rather than remembered
// ---------------------------------------------------------------------------

export interface Utilisation {
  /** Stage-weeks the lot had to sell in the window. */
  available: number;
  /** Stage-weeks anybody was on, at any rate. */
  taken: number;
  /**
   * Of those, the ones the owner's own production is sitting on.
   *
   * Counted apart from the rest because it is the difference between a full
   * lot and a paid one. A month at nine tenths occupancy that earned nothing
   * is a month the family's own picture had the rooms, and a figure that hid
   * that would be the single most misleading number on the screen.
   */
  own: number;
  /** 0-1. Undefined when the window holds no stage-weeks at all. */
  share: number | undefined;
  /** What those bookings are worth across the window, in cents. */
  earnsCents: Money;
}

/**
 * How full the lot was between two instants.
 *
 * Counted in stage-weeks, because that is the unit the thing is sold in, and
 * counted off the bookings themselves. A booking that runs past either end of
 * the window is clipped to it rather than counted whole, which is the
 * difference between a utilisation figure and a rough impression.
 */
export function utilisation(sim: Simulation, from: Instant, to: Instant): Utilisation {
  const stages = stagesOn(sim);
  const span = Math.max(0, to - from);
  const available = (span / MS_WEEK) * stages.length;
  let taken = 0;
  let own = 0;
  let earnsCents = 0;
  const owner = theLot(sim)?.ownerId;
  for (const stage of stages) {
    for (const booking of bookingsFor(sim, stage.id)) {
      const start = Math.max(booking.from, from);
      const end = Math.min(booking.to, to);
      if (end <= start) continue;
      const weeks = (end - start) / MS_WEEK;
      taken += weeks;
      if (owner !== undefined && booking.companyId === owner) own += weeks;
      earnsCents += Math.round(weeks * booking.weekRateCents);
    }
  }
  return {
    available,
    taken,
    own,
    share: available > 0 ? Math.min(1, taken / available) : undefined,
    earnsCents,
  };
}

/**
 * What the lot has to take in a month to cover the month.
 *
 * This is the figure the whole axis turns on, and it is deliberately the cash
 * one: what it costs to keep the doors open, not what it would take to repay
 * what the building cost. Those are different questions and the second one has
 * a worse answer.
 */
export function breakEvenShare(sim: Simulation): number | undefined {
  const stages = stagesOn(sim);
  if (stages.length === 0) return undefined;
  const weeksInAMonth = 52 / 12;
  const ifFull = stages.reduce((n, s) => n + s.weekRateCents, 0) * weeksInAMonth;
  return ifFull > 0 ? MONTHLY_OVERHEAD_CENTS / ifFull : undefined;
}

/** What a booking of this kind pays, from the stage's shooting rate. */
export function rateFor(stage: SoundStage, kind: BookingKind): Money {
  return Math.round(stage.weekRateCents * RATE_SHARE[kind]);
}

// ---------------------------------------------------------------------------
// Building it
// ---------------------------------------------------------------------------

/**
 * Puts the lot and its stages into a save that has none.
 *
 * It is built, not bought: the family put the money in and the stages went up
 * on land they already held, which is why there is no purchase price and why
 * the build cost sits on the property as what it is worth rather than what
 * somebody paid for it. Whether that is what it would fetch is a different
 * question, and one the game should not pretend to answer.
 */
export function buildTheLot(sim: Simulation, ownerCompanyId: Id): Property {
  const held = theLot(sim);
  if (held) return held;

  const at = movedInAt();
  const lot: Property = {
    id: sim.nextId('prop'),
    saveId: sim.universe.meta.id,
    ownerId: ownerCompanyId,
    ownerKind: 'company',
    kind: 'studio_lot',
    name: LOT_NAME,
    addressLine: estatePlaceLine(),
    locationId: ESTATE_CITY_ID,
    tenure: 'owned',
    bedrooms: 0,
    bathrooms: 0,
    interiorSqft: Math.round(LOT_FLOOR_SQM * 10.7639),
    lotSqft: 0,
    yearBuilt: new Date(at).getUTCFullYear(),
    features: ['Sound Stages', 'Water Tank', 'Workshops', 'Production Offices'],
    marketValue: BUILD_COST_CENTS,
    condition: 100,
    annualPropertyTaxRate: 0,
    structureIds: [],
    isPrimaryResidence: false,
    createdAt: at,
  };
  sim.universe.properties[lot.id] = lot;

  for (const facts of STAGES) {
    const stage: SoundStage = {
      id: sim.nextId('stage'),
      saveId: sim.universe.meta.id,
      propertyId: lot.id,
      name: facts.name,
      floorSqm: facts.floorSqm,
      clearHeightM: facts.clearHeightM,
      weekRateCents: facts.weekRateCents,
      ...(facts.tankSqm === undefined ? {} : { tankSqm: facts.tankSqm }),
      fitted: [...facts.fitted],
      builtAt: at,
    };
    sim.universe.stages[stage.id] = stage;
  }

  return lot;
}

// ---------------------------------------------------------------------------
// What it costs to own
// ---------------------------------------------------------------------------

export const LOT_OVERHEAD_KIND = 'lot.overhead';

/**
 * Puts the lot on the clock.
 *
 * The overhead lands on the first of every month, whether or not anybody has
 * been on a stage, which is the single fact this whole axis exists to make
 * true. A lot that only cost money when it was busy would be a lot nobody had
 * ever owned.
 */
export function registerLot(sim: Simulation): void {
  sim.onSchedule(LOT_OVERHEAD_KIND, () => {
    const lot = theLot(sim);
    const account = lot ? cashFor(sim, lot.ownerId) : undefined;
    if (lot && account) {
      const spent = chargeTheMonth(sim, account);
      const month = utilisation(sim, sim.now - 30 * MS_DAY, sim.now);
      // Said plainly, and the bad month is the one worth saying. A quiet
      // month on a lot is not a neutral event, it is the cost of the bet.
      sim.notify({
        category: 'business',
        title: `${LOT_NAME}: A Month Of It`,
        body: `${money(spent)} went out. ${howTheMonthWent(month)}`,
        importance: month.earnsCents === 0 ? 55 : 35,
      });
    }
    takeAnEnquiry(sim);
    collectWhatIsDue(sim);
    sim.schedule({
      at: startOfNextMonth(sim.now, sim.homeZone),
      kind: LOT_OVERHEAD_KIND,
      label: 'The Lot’s Month',
      category: 'system',
      priority: 5,
    });
  });

  if (!sim.universe.scheduled.some((i) => i.kind === LOT_OVERHEAD_KIND && i.status === 'pending')) {
    sim.schedule({
      at: startOfNextMonth(sim.now, sim.homeZone),
      kind: LOT_OVERHEAD_KIND,
      label: 'The Lot’s Month',
      category: 'system',
      priority: 5,
    });
  }
}

/** The company's cash account, which is what the lot is charged against. */
function cashFor(sim: Simulation, ownerId: Id | undefined): Id | undefined {
  if (!ownerId) return undefined;
  return Object.values(sim.universe.accounts)
    .find((a) => a.ownerId === ownerId && a.kind === 'company_cash' && !a.closedAt)?.id;
}

/** Midnight on the first of the month after this one, in a zone. */
function startOfNextMonth(at: Instant, zone: string): Instant {
  const parts = zonedParts(at, zone);
  const year = parts.month === 12 ? parts.year + 1 : parts.year;
  const month = parts.month === 12 ? 1 : parts.month + 1;
  return instantFromZoned({ year, month, day: 1, hour: 0, minute: 0 }, zone);
}

const money = (cents: Money): string => `€${Math.round(cents / 100).toLocaleString('en-US')}`;
const weeks = (n: number): string => {
  const said = n < 1 ? n.toFixed(1) : String(Math.round(n));
  return `${said} stage ${said === '1' ? 'week' : 'weeks'}`;
};

/**
 * The month in a sentence, with the family's own rooms counted separately.
 *
 * A lot that reported nine tenths full and nothing earned, without saying the
 * rooms went to its owner's own picture, would be the most misleading figure
 * on any screen in the game. So it says which is which.
 */
export function howTheMonthWent(month: Utilisation): string {
  if (month.taken === 0) return 'Nobody was on a stage, and nothing came in.';
  const paid = month.taken - month.own;
  if (month.own <= 0) return `${weeks(month.taken)} went to paying tenants, at ${money(month.earnsCents)}.`;
  if (paid <= 0) return `${weeks(month.own)} went to the company’s own picture, which pays the lot nothing.`;
  return `${weeks(paid)} went to paying tenants at ${money(month.earnsCents)}, `
    + `and ${weeks(month.own)} to the company’s own picture, which pays nothing.`;
}

/**
 * Charges the company for a month of owning the place.
 *
 * Every line in `OVERHEAD` is posted separately rather than as one figure,
 * because the whole point of the axis is that a lot costs money in named ways
 * on a month when nothing happened. One line saying "overhead" would be a
 * number nobody could open.
 */
export function chargeTheMonth(sim: Simulation, accountId: Id): Money {
  let spent = 0;
  for (const line of OVERHEAD) {
    sim.expense(accountId, line.monthlyCents, `${LOT_NAME}: ${line.label}`, 'business');
    spent += line.monthlyCents;
  }
  familyCovers(sim, accountId);
  return spent;
}

export const PAID_IN = `Paid In By ${GROUP.name}`;

/**
 * The parents write a check when the company cannot pay for itself.
 *
 * Without this the company's cash just goes negative and stays there, month
 * after month, with nothing on any screen saying who is actually funding it —
 * which is a number nobody can open, and the one thing this game is not
 * allowed to have. A private Icelandic company with no facility and no
 * revenue does not run thirteen million euros overdrawn. Somebody is paying,
 * and here it is the family, out of money the game has not modeled yet.
 *
 * So the shortfall is topped up in round hundreds of thousands and posted
 * under the name of the business it comes out of. What it buys is the figure
 * that matters more than the balance: how much of the sugar money has gone
 * into this bet, which only ever goes up, and which anybody can add up from
 * the ledger and set against what the group makes in a year.
 */
export function familyCovers(sim: Simulation, accountId: Id): Money {
  const account = sim.universe.accounts[accountId];
  if (!account || account.balance >= 0) return 0;
  const short = -account.balance;
  const step = 100_000_00;
  const put = Math.ceil(short / step) * step;
  sim.income(accountId, put, PAID_IN, 'business');
  return put;
}

/** Everything the family has put into the company, off the ledger itself. */
export function paidInSoFar(sim: Simulation): Money {
  let total = 0;
  for (const txn of sim.universe.transactions) {
    if (txn.memo !== PAID_IN) continue;
    for (const posting of txn.postings) if (posting.amount > 0) total += posting.amount;
  }
  return total;
}

/**
 * One sentence about where the lot stands, for the top of a page.
 *
 * Deliberately says the hard thing first when the hard thing is true. A month
 * with nothing on it is the normal state of a new lot and the game should not
 * dress it up.
 */
export function whereTheLotStands(sim: Simulation): string {
  const stages = stagesOn(sim);
  if (stages.length === 0) return 'Nothing has been built on the land yet.';
  const month = utilisation(sim, sim.now - 30 * MS_DAY, sim.now);
  const need = breakEvenShare(sim);
  const cover = need === undefined ? '' : ` It needs to be ${Math.round(need * 100)}% full to cover a month.`;
  if (month.taken === 0) {
    return `${stages.length} stages, and nobody has been on any of them in the last thirty days.${cover}`;
  }
  const share = Math.round((month.share ?? 0) * 100);
  const ours = month.own > 0 && month.taken > 0
    ? ` ${Math.round((month.own / month.taken) * 100)}% of that is the company’s own picture, which pays nothing.`
    : '';
  return `${stages.length} stages, ${share}% full across the last thirty days.${cover}${ours}`;
}

// ---------------------------------------------------------------------------
// Who books, and who goes to Budapest
// ---------------------------------------------------------------------------

export interface Answer {
  /** The stage it took, or nothing. */
  stageId?: Id;
  /** Why, in the world's words. */
  because: string;
  /** What it would pay a week, in cents, if it took it. */
  weekRateCents: Money;
}

/**
 * Which stage an enquiry fits on, if any.
 *
 * Smallest room that will hold it, which is what a production actually asks
 * for: nobody pays for six thousand square meters to shoot a kitchen. That
 * one rule is why Askja is quiet and Stage 3 is busy, and it falls out of the
 * sizes rather than being decided anywhere.
 */
export function fitsOn(sim: Simulation, need: Enquiry, from: Instant, to: Instant): SoundStage[] {
  return stagesOn(sim)
    .filter((stage) => stage.floorSqm >= need.needsSqm && stage.clearHeightM >= need.needsHeightM)
    .filter((stage) => !need.needsTank || (stage.tankSqm ?? 0) > 0)
    .filter((stage) => !bookingsFor(sim, stage.id).some((b) => b.from < to && from < b.to))
    .sort((a, b) => a.floorSqm - b.floorSqm);
}

/** Which rebate tier an enquiry would qualify for, on what it means to spend. */
export function tierFor(need: Enquiry): number {
  const big = need.spendIsk >= REBATE.higherNeeds.spendIsk && need.weeks * 5 >= REBATE.higherNeeds.workingDays;
  return big ? REBATE.higherShare : REBATE.share;
}

/**
 * Whether an enquiry books, and where.
 *
 * The whole calculation in one place, and every term in it is something the
 * world can change. What Iceland gives back, what the room costs, what the
 * crew shortage costs on top, and whether the room is even free. A production
 * that would be better off in Budapest goes to Budapest, and the game says so.
 */
export function wouldBook(sim: Simulation, need: Enquiry, from: Instant): Answer {
  const to = from + need.weeks * MS_WEEK;
  const room = fitsOn(sim, need, from, to)[0];
  if (!room) {
    const anyRoom = stagesOn(sim).some((st) => st.floorSqm >= need.needsSqm && st.clearHeightM >= need.needsHeightM);
    return {
      because: anyRoom ? 'Every stage that would hold it’s already booked.' : 'Nothing here is the right size for it.',
      weekRateCents: 0,
    };
  }
  const rate = rateFor(room, 'shooting');
  // What the rebate is worth against what coming here costs, as shares of the
  // same spend, so they can be set against each other. A production whose crew
  // is already in the country pays none of that cost and is not weighing
  // Iceland against anywhere — it is weighing this stage against the one in
  // Gufunes, and the rebate is a straight gain.
  const penalty = need.local ? 0 : CREW_PENALTY;
  const back = tierFor(need);
  if (back - penalty <= 0) {
    return {
      because: `${Math.round(back * 100)}% back doesn’t cover what it costs to bring a crew and a build here.`,
      weekRateCents: rate,
    };
  }
  return {
    stageId: room.id,
    because: need.local
      ? `Its crew is already here, and ${room.name} is free.`
      : `${Math.round(back * 100)}% back covers the crew it has to fly in, and ${room.name} is free.`,
    weekRateCents: rate,
  };
}

/** Writes a booking onto a stage. */
export function book(sim: Simulation, need: Enquiry, stageId: Id, from: Instant, weekRateCents: Money): Booking {
  const booking: Booking = {
    id: sim.nextId('booking'),
    saveId: sim.universe.meta.id,
    stageId,
    holder: `${need.from}, ${aOrAn(need.kind)}`,
    kind: 'shooting',
    from,
    to: from + need.weeks * MS_WEEK,
    weekRateCents,
  };
  sim.universe.bookings[booking.id] = booking;
  return booking;
}

const aOrAn = (kind: string): string => `${/^[aeiou]/i.test(kind) ? 'an' : 'a'} ${kind}`;

/**
 * Somebody rings about a stage, once a month, and either books or does not.
 *
 * One enquiry a month is SLATE's own and it is deliberately not many. A lot
 * nobody has heard of, in a country with no crew, does not have a queue. The
 * shape of who rings is weighted toward the middle of the market, because
 * that is where the work is.
 */
export function takeAnEnquiry(sim: Simulation): Booking | undefined {
  if (stagesOn(sim).length === 0) return undefined;
  const rng = sim.rng('lot', String(Math.floor(sim.now / MS_DAY)));
  const total = ENQUIRY_SHAPES.reduce((n, one) => n + one.weight, 0);
  let roll = rng.next() * total;
  let need = ENQUIRY_SHAPES[0]!.of;
  for (const one of ENQUIRY_SHAPES) {
    roll -= one.weight;
    if (roll <= 0) { need = one.of; break; }
  }

  // They want the stage some weeks out, not tomorrow.
  const from = sim.now + Math.round(30 + rng.next() * 90) * MS_DAY;
  const answer = wouldBook(sim, need, from);
  if (!answer.stageId) return undefined;

  const booking = book(sim, need, answer.stageId, from, answer.weekRateCents);
  const stage = sim.universe.stages[answer.stageId];
  sim.notify({
    category: 'business',
    title: `${stage?.name ?? 'A stage'} Is Booked`,
    body: `${booking.holder} takes it for ${need.weeks === 1 ? 'a week' : `${need.weeks} weeks`}. ${answer.because}`,
    importance: 45,
  });
  return booking;
}

/**
 * Invoices every booking that has finished and not yet been paid for.
 *
 * At the end, not the start, because that is when a stage is actually billed
 * and because a booking that is canceled halfway should not have been paid
 * for in full. Marked as invoiced so a month running twice cannot bill twice.
 */
export function collectWhatIsDue(sim: Simulation): Money {
  const lot = theLot(sim);
  const account = lot ? cashFor(sim, lot.ownerId) : undefined;
  if (!account) return 0;
  let took = 0;
  for (const booking of Object.values(sim.universe.bookings)) {
    if (booking.invoicedAt !== undefined || booking.to > sim.now) continue;
    const weeks = (booking.to - booking.from) / MS_WEEK;
    const due = Math.round(weeks * booking.weekRateCents);
    if (due > 0) {
      sim.income(account, due, `${LOT_NAME}: ${booking.holder}`, 'business');
      took += due;
    }
    booking.invoicedAt = sim.now;
  }
  return took;
}

/**
 * What the family has put in, said against what the business earns.
 *
 * The balance on its own means nothing — a hundred million is ruin to one
 * company and a rounding error to another. Against a year of the group's
 * profit it means something immediately.
 */
export function paidInAsShareOfAYear(sim: Simulation): number {
  // Against what the sugar cleared THIS year, not a flat figure. The same
  // eight million of empty stages is a different sentence in a year America
  // was open and a year it was shut, and that difference is the only way the
  // quota is ever felt on this side of the family.
  const earned = profitThisYear(sim);
  return earned > 0 ? paidInSoFar(sim) / earned : 0;
}
