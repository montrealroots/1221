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
import type { ScheduledItem } from '../core/scheduler';
import { formatMoney, type Money } from '../core/money';
import { MS_DAY, instantFromZoned, zonedParts } from '../core/time';
import {
  AROUND_THE_SHOOT, BUILD_COST_CENTS, CALLS_A_MONTH, CREW_BASE, CREW_PENALTY, LOT_FLOOR_SQM,
  MOST_CALLS, MOST_OF_THE_SPEND, OVERHEAD, PATIENCE, RATE_SHARE,
  FOREIGN_REACH, SELLING, SHUT_YEAR_BITE, type Rung,
  ENQUIRY_SHAPES, STAGES, type Enquiry,
  A_SMALL_STAGE, SMALL_STAGE_COST_CENTS, buildRefusalById, type WhyNotBuild,
} from '../content/lot';
import { REBATE } from '../content/incorporation';
import { shortOn } from '../content/rebate';
import { rateWhenShort } from './rebate';
import { GROUP } from '../content/sugar';
import { profitThisYear, shutYearsRunning } from './sugar';
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
  /** 0-1, in stage-weeks. Undefined when the window holds no stage-weeks. */
  share: number | undefined;
  /** What those bookings are worth across the window, in cents. */
  earnsCents: Money;
  /** What the window would have earned with every stage let, every week. */
  ifFullCents: Money;
  /**
   * 0-1, in money rather than in weeks, and this is the one that matters.
   *
   * The four rooms are not worth the same: the two big ones are two thirds of
   * the rate card between them, so a month with both twins full and both big
   * rooms dark is half the stage-weeks and a third of the money. Against a
   * break-even that is worked out from the rate card, only this one can be
   * compared — and the screen was comparing the other one, which made a busy
   * cheap month read as most of the way to covering itself.
   */
  earnsShare: number | undefined;
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
  const ifFullCents = Math.round((span / MS_WEEK)
    * stages.reduce((n, stage) => n + rateFor(stage, 'shooting'), 0));
  return {
    available,
    taken,
    own,
    share: available > 0 ? Math.min(1, taken / available) : undefined,
    earnsCents,
    ifFullCents,
    earnsShare: ifFullCents > 0 ? Math.min(1, earnsCents / ifFullCents) : undefined,
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
  return ifFull > 0 ? monthlyOverhead(sim) / ifFull : undefined;
}

/**
 * What each line of a month of the lot actually costs.
 *
 * One line is not a constant. The selling spend is the only thing on this list
 * somebody chooses, and `chargeTheMonth` has always charged what they chose —
 * while `OVERHEAD_FLOOR_CENTS` carries that line at the least the content
 * declares. So the bar moved and the figure measuring it did not: raising the
 * selling spend to its ceiling took break-even from 0.62 to a true 0.71, and
 * every number on every screen went on saying 0.62. The player's one lever on
 * this business silently raised its own target by nine points.
 */
function lineCosts(sim: Simulation): { line: typeof OVERHEAD[number]; owed: Money }[] {
  const selling = sellsFor(sim);
  // And the second thing that moves it: how much building there is. The table
  // is what four stages cost, so every line that is a function of the floor is
  // charged against the floor that actually stands. A fifth room that cost
  // nothing to run would be a room worth putting up the moment the money
  // existed — and the break-even figure would have fallen when the lot grew.
  const grown = floorStanding(sim) / LOT_FLOOR_SQM;
  return OVERHEAD.map((line) => ({
    line,
    owed: line.id === 'selling' ? selling
      : line.withTheFloor ? Math.round(line.monthlyCents * grown)
        : line.monthlyCents,
  }));
}

/** Square meters of stage standing on the lot today. */
export function floorStanding(sim: Simulation): number {
  return stagesOn(sim).reduce((n, stage) => n + stage.floorSqm, 0);
}

/** What a month of the lot costs today, with the chosen line at what was chosen. */
export function monthlyOverhead(sim: Simulation): Money {
  return lineCosts(sim).reduce((n, one) => n + one.owed, 0);
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
// The fifth room
// ---------------------------------------------------------------------------

/** What the scheduler calls the day a stage is finished. */
export const BUILT_KIND = 'lot.stage_built';

/** What the money is posted under, which is the only record of the decision. */
export const BUILD_MEMO = `${LOT_NAME}: Building ${A_SMALL_STAGE.name}`;

/** The small stage, if it stands. */
export function theSmallStage(sim: Simulation): SoundStage | undefined {
  return stagesOn(sim).find((stage) => stage.name === A_SMALL_STAGE.name);
}

/** The build that is under way, if one is. */
export function goingUp(sim: Simulation): ScheduledItem | undefined {
  return sim.universe.scheduled.find((one) => one.kind === BUILT_KIND && one.status === 'pending');
}

/**
 * What is behind the company today.
 *
 * The cash in the account plus what the family will still put in, which is the
 * same figure the greenlight asks about and for the same reason: a company that
 * is funded as it goes cannot be judged on the balance on one morning. It is
 * the ceiling on what this company can commit to at all, and the room and the
 * picture spend out of it together.
 */
export function behindTheCompany(sim: Simulation): Money {
  const lot = theLot(sim);
  const account = lot ? cashFor(sim, lot.ownerId) : undefined;
  return (account ? sim.universe.accounts[account]?.balance ?? 0 : 0) + stillToCarry(sim);
}

/** Why the fifth room cannot be built today, if it cannot. */
export function whyNotBuild(sim: Simulation): WhyNotBuild | undefined {
  if (!theLot(sim)) return 'no-lot';
  if (theSmallStage(sim)) return 'already';
  if (goingUp(sim)) return 'going-up';
  if (SMALL_STAGE_COST_CENTS > behindTheCompany(sim)) return 'cannot-carry';
  return undefined;
}

/**
 * Commits to the fifth room.
 *
 * The money goes now and the room arrives in eighteen months, and those are
 * deliberately the two facts of it. A build draws down over its program in
 * life; here it is charged in one line on the day it is signed, because what
 * this models is the commitment rather than the cash flow — and because a
 * half-paid stage on a company that ran out would be a state the game has no
 * honest answer for. One expense, one memo, one line in the ledger anybody can
 * open, and `familyCovers` turns it into what it really is at the end of the
 * month: a quarter of the family's whole patience, spent on a room.
 */
export function buildAStage(sim: Simulation): { ok: boolean; error?: string; readyAt?: Instant } {
  const why = whyNotBuild(sim);
  if (why) {
    const said = buildRefusalById(why)?.said ?? 'It can’t be built.';
    return {
      ok: false,
      error: why === 'cannot-carry'
        ? `${said} ${money(SMALL_STAGE_COST_CENTS)} against ${money(Math.max(0, behindTheCompany(sim)))} `
          + 'in the account and left in the family’s patience.'
        : said,
    };
  }
  const lot = theLot(sim)!;
  const account = cashFor(sim, lot.ownerId);
  if (!account) return { ok: false, error: 'The company has no account to pay for it out of.' };

  sim.expense(account, SMALL_STAGE_COST_CENTS, BUILD_MEMO, 'business');
  const readyAt = sim.now + A_SMALL_STAGE.weeksToBuild * MS_WEEK;
  sim.schedule({
    at: readyAt,
    kind: BUILT_KIND,
    label: `${A_SMALL_STAGE.name} Is Finished`,
    category: 'business',
    priority: 5,
    refType: 'property',
    refId: lot.id,
  });
  sim.notify({
    category: 'business',
    title: `${A_SMALL_STAGE.name} Is Going Up`,
    body: `${money(SMALL_STAGE_COST_CENTS)} goes out today and the room opens in `
      + `${A_SMALL_STAGE.weeksToBuild} weeks. ${A_SMALL_STAGE.said} `
      + `It also costs more to keep the lights on in five rooms than in four, `
      + `so the lot has to be fuller to cover a month than it did this morning.`,
    importance: 75,
  });
  return { ok: true, readyAt };
}

/**
 * The day it opens.
 *
 * Put onto the lot with today's date, so `stagesOn` sorts it last and every
 * reader of the lot — what it earns if full, what it costs a month, what fits
 * on it — picks it up from the same place the other four come from. Nothing
 * needed a special case for it, which is the test of whether the four were
 * modeled or hard-coded.
 */
export function finishTheStage(sim: Simulation): SoundStage | undefined {
  const lot = theLot(sim);
  if (!lot || theSmallStage(sim)) return undefined;
  const stage: SoundStage = {
    id: sim.nextId('stage'),
    saveId: sim.universe.meta.id,
    propertyId: lot.id,
    name: A_SMALL_STAGE.name,
    floorSqm: A_SMALL_STAGE.floorSqm,
    clearHeightM: A_SMALL_STAGE.clearHeightM,
    weekRateCents: A_SMALL_STAGE.weekRateCents,
    fitted: [...A_SMALL_STAGE.fitted],
    builtAt: sim.now,
  };
  sim.universe.stages[stage.id] = stage;
  // The property is worth what went into it. It was written once at the build
  // and would otherwise have gone on saying what four stages cost.
  lot.marketValue += SMALL_STAGE_COST_CENTS;
  lot.interiorSqft = Math.round(floorStanding(sim) * 10.7639);
  return stage;
}

/** Where the build stands, in a sentence, or nothing if none is under way. */
export function whereTheBuildStands(sim: Simulation): string | undefined {
  const build = goingUp(sim);
  if (!build) return undefined;
  const left = Math.max(0, Math.ceil((build.at - sim.now) / MS_WEEK));
  return `${A_SMALL_STAGE.name} opens in ${left === 1 ? 'a week' : `${left} weeks`}. `
    + `${money(SMALL_STAGE_COST_CENTS)} is already spent on it.`;
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
  // Eighteen months after somebody signed for it, the room opens. Registered
  // before anything is scheduled onto it, because `sim.schedule` refuses a kind
  // with no handler rather than dropping it quietly at the far end.
  sim.onSchedule(BUILT_KIND, () => {
    const stage = finishTheStage(sim);
    if (!stage) return;
    sim.notify({
      category: 'business',
      title: `${stage.name} Is Finished`,
      body: `${A_SMALL_STAGE.said} It lets at ${money(stage.weekRateCents)} a week, and the `
        + `${Math.round(stage.floorSqm)}m² of it is on the month from now on whether anybody stands in it or not.`,
      importance: 70,
    });
  });

  sim.onSchedule(LOT_OVERHEAD_KIND, () => {
    const lot = theLot(sim);
    const account = lot ? cashFor(sim, lot.ownerId) : undefined;
    if (lot && account) {
      const month = utilisation(sim, sim.now - 30 * MS_DAY, sim.now);
      const spent = chargeTheMonth(sim, account, month.earnsCents);
      // Said plainly, and the bad month is the one worth saying. A quiet
      // month on a lot is not a neutral event, it is the cost of the bet.
      sim.notify({
        category: 'business',
        title: `${LOT_NAME}: A Month Of It`,
        body: `${money(spent)} went out. ${howTheMonthWent(month)}`,
        importance: month.earnsCents === 0 ? 55 : 35,
      });
      // And where the family stands on paying for it, when that has moved
      // since the last time anybody said so. Against what was last said and
      // not against earlier in the same tick, because the rung moves without
      // the money moving: a shut year reads the same figure against a smaller
      // year, and both halves of a single tick would see the shut year.
      const now = standingWith(sim);
      const company = sim.universe.companies[lot.ownerId ?? ''];
      if (company && company.familySaid !== now.rung.id) {
        const climbing = company.familySaid === undefined
          || PATIENCE.findIndex((one) => one.id === now.rung.id)
            > PATIENCE.findIndex((one) => one.id === company.familySaid);
        company.familySaid = now.rung.id;
        if (climbing && now.rung.id !== PATIENCE[0]!.id) {
          sim.notify({
            category: 'business',
            title: `${GROUP.name}: ${now.rung.label}`,
            body: whatTheFamilySays(sim),
            importance: now.conditional ? 80 : 60,
          });
        }
      }
      if (now.conditional && month.earnsCents <= 0) {
        sim.notify({
          category: 'business',
          title: `${LOT_NAME} Funds Itself This Month`,
          body: `Nobody was on a stage and nothing came in, so nothing came from ${GROUP.name} either. `
            + `The company is ${money(-(sim.universe.accounts[account]?.balance ?? 0))} under, and a picture `
            + 'needs money behind it before anybody says yes to one.',
          importance: 85,
        });
      }
    }
    // As many as rang, and the fraction is drawn rather than rounded away: at
    // one and a half calls a month, half the months get the second one.
    const pull = pullOn(sim);
    const whole = Math.floor(pull.calls);
    const over = pull.calls - whole;
    const extra = sim.rng('lot', 'how-many', String(Math.floor(sim.now / MS_DAY))).next() < over ? 1 : 0;
    for (let i = 0; i < whole + extra; i += 1) takeAnEnquiry(sim, i);
    collectWhatIsDue(sim);
    sim.schedule({
      at: startOfNextMonth(sim.now, sim.homeZone),
      kind: LOT_OVERHEAD_KIND,
      label: 'The Lot’s Month',
      category: 'system',
      priority: 5,
    });
  });

  /**
   * What the lot spends a month on being known.
   *
   * The only decision on this axis somebody takes again every month, and the
   * first one that costs anything now the family's patience is finite. Bounded
   * at both ends: the floor is what it costs to be sold at all, and above the
   * ceiling there is nobody left to tell.
   */
  sim.onCommand<{ monthlyCents: Money }, { ok: boolean; error?: string }>(
    'lot.sell', (payload, { sim: s }) => {
      const lot = theLot(s);
      const company = lot?.ownerId ? s.universe.companies[lot.ownerId] : undefined;
      if (!company) return { ok: false, error: 'There’s no lot to sell.' };
      const want = Math.round(Number(payload.monthlyCents ?? 0));
      if (!Number.isFinite(want) || want < 0) return { ok: false, error: 'That isn’t an amount.' };
      if (want > SELLING.most) {
        return {
          ok: false,
          error: `${money(SELLING.most)} a month reaches everybody who books a stage. `
            + 'Past that there’s nobody left to tell.',
        };
      }
      company.sellsFor = Math.max(SELLING.floor, want);
      return { ok: true };
    },
  );

  /**
   * Put up the fifth room.
   *
   * The one decision on this lot that changes what the lot is rather than how
   * hard it is sold. Everything it refuses on is a fact the player can read
   * somewhere else first, which is the difference between a locked door and a
   * hidden one.
   */
  sim.onCommand<Record<string, never>, { ok: boolean; error?: string; readyAt?: Instant }>(
    'lot.build', (_payload, { sim: s }) => buildAStage(s),
  );

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

/** Whole units, no cents. Routed through the one formatter so the ledger
 *  has one currency rather than four opinions about it. */
const money = (cents: Money): string => formatMoney(cents, { cents: false });
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
export function chargeTheMonth(sim: Simulation, accountId: Id, earnedThisMonth: Money = 0): Money {
  let spent = 0;
  // Itemised, because one line saying "overhead" would be a number nobody could
  // open — but costed by `lineCosts`, so what is charged here and what
  // `breakEvenShare` measures against can never again be two different answers.
  for (const { line, owed } of lineCosts(sim)) {
    sim.expense(accountId, owed, `${LOT_NAME}: ${line.label}`, 'business');
    spent += owed;
  }
  familyCovers(sim, accountId, earnedThisMonth);
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
export function familyCovers(sim: Simulation, accountId: Id, earnedThisMonth: Money = 0): Money {
  const account = sim.universe.accounts[accountId];
  if (!account || account.balance >= 0) return 0;
  // Past the last rung the money comes with a condition on it, and the
  // condition is the only one a family ever actually sets: show me it is a
  // business. A month the lot took nothing is a month it funds itself, the
  // company's cash goes under, and the greenlight door — which already asks
  // for money behind a picture — shuts until the lot lets a stage again.
  //
  // Recoverable on purpose. Enquiries keep arriving whether or not anybody is
  // paying, so there is always a way back, and the way back is the business
  // working rather than somebody relenting.
  if (standingWith(sim).conditional && earnedThisMonth <= 0) return 0;
  const short = -account.balance;
  const step = 100_000_00;
  const put = Math.ceil(short / step) * step;
  sim.income(accountId, put, PAID_IN, 'business');
  return put;
}

export interface Standing {
  /** Cumulative money in, against a year of the group's profit. */
  share: number;
  /** Where that puts the family. */
  rung: Rung;
  /** How much shorter a run of shut years has made the patience. */
  shutYears: number;
  /** Whether the money now comes with a condition on it. */
  conditional: boolean;
}

/**
 * Where the family stands on the thing it is paying for.
 *
 * The figure was already here and already right — money in against what the
 * sugar cleared this year rather than against a flat number, so a shut year
 * makes the same money a heavier sentence. Nothing read it. A correct figure
 * nobody acts on is the same fault as a wrong one, and on this axis it was the
 * whole fault: with an uncapped check behind it, every decision about the lot
 * cost nothing and the best play was whatever you liked.
 */
export function standingWith(sim: Simulation): Standing {
  const share = paidInAsShareOfAYear(sim);
  const shutYears = shutYearsRunning(sim);
  const rung = rungFor(share, shutYears);
  return {
    share,
    rung,
    shutYears,
    conditional: rung.id === PATIENCE[PATIENCE.length - 1]!.id,
  };
}

/**
 * Which rung that much money puts the family on, after that many shut years.
 *
 * Pure, and separate from reading the save, so the shut-year half can be asked
 * a question directly instead of being inferred from a world that happened to
 * have a shut year in it. Every year America stays shut brings the rungs down,
 * because a run of them is when the part of the business that loses money stops
 * being a rounding error and starts being a line somebody defends.
 */
export function rungFor(share: number, shutYears: number): Rung {
  const bite = Math.max(0.3, 1 - SHUT_YEAR_BITE * Math.max(0, shutYears));
  let rung = PATIENCE[0]!;
  for (const one of PATIENCE) {
    if (share >= one.at * bite) rung = one;
  }
  return rung;
}

/**
 * Who rang and went away again, and what sent them.
 *
 * Counted rather than derived, because an enquiry that did not book leaves no
 * record of itself anywhere else — the bookings table only holds the ones that
 * said yes, which is the most flattering possible account of a stage business.
 */
export function turnedAway(sim: Simulation): { why: string; said: string; count: number }[] {
  const lot = theLot(sim);
  const company = lot?.ownerId ? sim.universe.companies[lot.ownerId] : undefined;
  const kept = company?.turnedAway ?? {};
  return [
    { why: 'room', said: 'No room here was the right size', count: kept.room ?? 0 },
    { why: 'rebate', said: 'What Iceland gives back didn’t cover getting here', count: kept.rebate ?? 0 },
    { why: 'price', said: 'The room cost too much of what they had to spend', count: kept.price ?? 0 },
    { why: 'booked', said: 'Every room that would hold it was taken', count: kept.booked ?? 0 },
  ].filter((one) => one.count > 0).sort((a, b) => b.count - a.count);
}

/**
 * What the family will still put in before the money comes with a condition.
 *
 * The honest ceiling on what this company can commit to, and it is not the
 * cash in the account — a production is funded as it goes and the family has
 * been covering the difference since the first month. What it cannot do is
 * say yes to something bigger than the patience it has left.
 *
 * Zero once the money is conditional, which is not the same as being broke: it
 * means the next picture has to be paid for by the business rather than by
 * somebody's goodwill.
 */
export function stillToCarry(sim: Simulation): Money {
  const standing = standingWith(sim);
  if (standing.conditional) return 0;
  const line = PATIENCE[PATIENCE.length - 1]!.at
    * Math.max(0.3, 1 - SHUT_YEAR_BITE * standing.shutYears);
  return Math.max(0, Math.round((line - standing.share) * profitThisYear(sim)));
}

/** Where the family stands, in a sentence. */
export function whatTheFamilySays(sim: Simulation): string {
  const standing = standingWith(sim);
  const put = `${Math.round(standing.share * 100)}/100 of a year of the group’s profit has gone in.`;
  const shut = standing.shutYears > 0
    ? ` America has been shut ${standing.shutYears === 1 ? 'a year' : `${standing.shutYears} years`}, which makes it read heavier than it would.`
    : '';
  return `${put} ${standing.rung.what}${shut}`;
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
  // In money and not in weeks, because the break-even beside it is in money.
  // The two big rooms are two thirds of the rate card, so a busy month in the
  // cheap ones used to read most of the way to covering itself.
  const share = Math.round((month.earnsShare ?? 0) * 100);
  const ours = month.own > 0 && month.taken > 0
    ? ` ${Math.round((month.own / month.taken) * 100)}% of the weeks went to the company’s own picture, which pays nothing.`
    : '';
  return `${stages.length} stages, and the last thirty days took ${share}% of what a full month is worth.${cover}${ours}`;
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
/**
 * The weeks either side of the shoot that the stage is also held for.
 *
 * A booking is not the shoot. A feature builds a set for weeks before a camera
 * turns over and takes days to get it out again, and the room is unavailable
 * and earning the whole time. Counting only the shooting weeks understated what
 * a stage is occupied for by most of a half and understated what it earns by
 * about as much — on the same deals the engine was already writing.
 *
 * There used to be a floor under both ends: any kind that prepped at all
 * prepped for at least a whole week. It never once fired on the work it was
 * written for — a feature's share of its own weeks already rounds well past
 * one — and it fired on every piece of short work there is. A one-week
 * commercial was held for three weeks against a table that says a third of a
 * week, and a two-week documentary for four against a table that says a third
 * of one. The table's own sentence is that a documentary on a stage arrives in
 * the morning and is gone by the evening; the floor made that sentence false,
 * tripled what the short work was quoted, and priced every piece of it off the
 * lot. A guard that only ever fires where it is wrong is worse than no guard.
 */
export function heldFor(need: Enquiry): { prep: number; shoot: number; strike: number } {
  const around = AROUND_THE_SHOOT[need.kind];
  return {
    prep: Math.round(need.weeks * around.prep),
    shoot: need.weeks,
    strike: Math.round(need.weeks * around.strike),
  };
}

/** Every week the room is gone for, prep and strike included. */
export const wholeHold = (need: Enquiry): number => {
  const held = heldFor(need);
  return held.prep + held.shoot + held.strike;
};

export function fitsOn(sim: Simulation, need: Enquiry, from: Instant, to: Instant): SoundStage[] {
  return stagesOn(sim)
    .filter((stage) => stage.floorSqm >= need.needsSqm && stage.clearHeightM >= need.needsHeightM)
    .filter((stage) => !need.needsTank || (stage.tankSqm ?? 0) > 0)
    .filter((stage) => !bookingsFor(sim, stage.id).some((b) => b.from < to && from < b.to))
    .sort((a, b) => a.floorSqm - b.floorSqm);
}

/**
 * How many people there are in the country to crew a picture with.
 *
 * A national base, plus everybody the save has brought into existence to make
 * something. `armTheCrew` fills a post by finding or generating a person, and
 * those people persist after the picture is delivered — world/crew.ts says the
 * size and shape of the crew base is a record of what the company has made.
 * Nothing read it. It is read here, because the thing that decides whether a
 * foreign production can claim the higher rebate is whether fifty people can be
 * put on an Icelandic payroll, and that is a question about the country.
 */
export function crewInTheCountry(sim: Simulation): number {
  const made = Object.values(sim.universe.people)
    .filter((one) => one.careerTrack === 'crew').length;
  return CREW_BASE + made;
}

/**
 * Which rebate tier an enquiry would qualify for.
 *
 * Every limb, and they are cumulative. Spend, working days, shooting days and
 * fifty crew taxed in Iceland for fifty days — the last of which sat in
 * `REBATE.higherNeeds` being read by nothing while this function tested two of
 * the four and called it the band. It matters because it is the one limb the
 * country can fail: two large productions at once want a hundred people between
 * them, and there are only so many in Iceland.
 *
 * The test itself lives in `content/rebate.ts`, where the family's own pictures
 * reach it too. One piece of legislation, one implementation of it. What this
 * file supplies is a foreign production's answers, and its answer on crew is a
 * question about the country's supply — how many people are left after every
 * unit already booked across the same weeks has taken its fifty.
 */
export function tierFor(sim: Simulation, need: Enquiry, from: Instant): number {
  const needs = REBATE.higherNeeds;
  const to = from + wholeHold(need) * MS_WEEK;
  const spokenFor = Object.values(sim.universe.bookings)
    .filter((one) => one.kind === 'shooting' && one.from < to && from < one.to).length * needs.crew;
  // Working days and crew days are the whole hold, prep and strike included,
  // because a unit is in the country and on a payroll from the day it starts
  // building. Shooting days are the shoot and only the shoot.
  const here = wholeHold(need) * 5;
  const short = shortOn({
    spendIsk: need.spendIsk,
    workingDays: here,
    shootingDays: need.weeks * 5,
    crew: crewInTheCountry(sim) - spokenFor,
    crewDays: here,
  }, needs);
  return rateWhenShort(short);
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
  const held = heldFor(need);
  const to = from + wholeHold(need) * MS_WEEK;
  const room = fitsOn(sim, need, from, to)[0];
  if (!room) {
    const anyRoom = stagesOn(sim).some((st) => st.floorSqm >= need.needsSqm && st.clearHeightM >= need.needsHeightM);
    return {
      because: anyRoom
        ? `Every stage that would hold it is booked across the ${wholeHold(need)} weeks it needs.`
        : 'Nothing here is the right size for it.',
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
  const back = tierFor(sim, need, from);
  if (back - penalty <= 0) {
    return {
      because: `${Math.round(back * 100)}% back doesn’t cover what it costs to bring a crew and a build here.`,
      weekRateCents: rate,
    };
  }

  // And then the price, which this used to work out and throw away. What the
  // rooms cost across the whole hold, against everything the production is
  // going to spend in the country — because a stage asking a fifth of that is
  // a stage being asked about and then not booked.
  const asks = quotedFor(room, need);
  const spend = Math.round((need.spendIsk / ISK_A_EURO) * 100);
  const most = need.local ? MOST_OF_THE_SPEND.local : MOST_OF_THE_SPEND.foreign;
  if (spend > 0 && asks > spend * most) {
    return {
      because: `${money(asks)} for ${wholeHold(need)} weeks is too much of what it has to spend here.`,
      weekRateCents: rate,
    };
  }

  return {
    stageId: room.id,
    because: need.local
      ? `Its crew is already here, and ${room.name} is free for the ${wholeHold(need)} weeks.`
      : `${Math.round(back * 100)}% back covers the crew it has to fly in, and ${room.name} is free `
        + `for the ${held.prep} of prep, ${held.shoot} of shooting and ${held.strike} of strike.`,
    weekRateCents: rate,
  };
}

/**
 * Króna to euro.
 *
 * One rate, held flat on purpose. SLATE has no currency model and an invented
 * moving one would be a second guess stacked on the first; what this is for is
 * putting a rate card and an Icelandic budget into the same units so they can
 * be compared at all.
 */
export const ISK_A_EURO = 150;

/** What the whole hold costs, prep and strike at their own rate. */
export function quotedFor(stage: SoundStage, need: Enquiry): Money {
  const held = heldFor(need);
  return Math.round(held.shoot * rateFor(stage, 'shooting')
    + (held.prep + held.strike) * rateFor(stage, 'prep'));
}

/** Writes a booking onto a stage. */
export function book(sim: Simulation, need: Enquiry, stageId: Id, from: Instant, weekRateCents: Money): Booking {
  const held = heldFor(need);
  const holder = `${need.from}, ${aOrAn(need.kind)}`;
  const stage = sim.universe.stages[stageId];
  const prepRate = stage ? rateFor(stage, 'prep') : Math.round(weekRateCents * RATE_SHARE.prep);
  const write = (kind: BookingKind, at: Instant, weeks: number, rate: Money): Booking => {
    const booking: Booking = {
      id: sim.nextId('booking'),
      saveId: sim.universe.meta.id,
      stageId,
      holder,
      kind,
      from: at,
      to: at + weeks * MS_WEEK,
      weekRateCents: rate,
    };
    sim.universe.bookings[booking.id] = booking;
    return booking;
  };

  // Three rows and not one, because they are three different stretches of time,
  // and a single row called shooting that covered the build and the strike would
  // be the lie the flat rate used to be.
  //
  // Three rows at TWO prices, though, and the strike is the reason: it is the
  // last of the three and it is written as `prep`, because striking a set and
  // building one cost a production the same and `BookingKind` has no word for
  // taking one down. So a reader of the rows sees a production prep twice and
  // never strike. It is 6.5% of what the lot quotes, sitting under the wrong
  // name — and the estate screen's Stages table is one line of TSX away from
  // printing it.
  let at = from;
  if (held.prep > 0) { write('prep', at, held.prep, prepRate); at += held.prep * MS_WEEK; }
  const shooting = write('shooting', at, held.shoot, weekRateCents);
  at += held.shoot * MS_WEEK;
  if (held.strike > 0) write('prep', at, held.strike, prepRate);
  return shooting;
}

const aOrAn = (kind: string): string => `${/^[aeiou]/i.test(kind) ? 'an' : 'a'} ${kind}`;

export interface Pull {
  /** People in the country to crew with, against the national base. */
  crew: number;
  /** How much of the last three years the rooms were let, 0-1. */
  record: number;
  /** How far the name has got, off what was spent getting it there, 0-1. */
  reach: number;
  /** Enquiries a month this comes to. */
  calls: number;
}

/**
 * How many people ring about a stage this month, and why that many.
 *
 * The two things a lot earns, and the reason this axis stopped being a fixed
 * outcome. Neither is stored and neither can be set: the crew in the country
 * is everybody who has ever been hired onto something here and stayed, and the
 * record is what the bookings themselves say about the last three years.
 *
 * They pull differently on purpose. Crew is slow and it only goes up — a
 * picture made here puts two dozen people in the country who are still here
 * afterwards, and a country you can crew in is a country worth calling. The
 * record is fast and runs both ways, because it falls out of its own window:
 * three quiet years and the lot is what it was on the first day.
 */
export function pullOn(sim: Simulation): Pull {
  const crew = crewInTheCountry(sim) / CREW_BASE;
  const threeYears = utilisation(sim, sim.now - 3 * 365 * MS_DAY, sim.now);
  const record = threeYears.available > 0
    ? Math.min(1, (threeYears.taken - threeYears.own) / threeYears.available)
    : 0;
  const reach = reachOf(sim);
  return {
    crew,
    record,
    reach,
    calls: Math.min(
      MOST_CALLS,
      CALLS_A_MONTH * crew * (1 + Math.max(0, record)) * (1 + SELLING.worth * reach),
    ),
  };
}

/**
 * How far the lot's name has got, off what it has actually spent getting there.
 *
 * Read back out of the ledger rather than off the figure somebody set, which is
 * the whole of why it cannot be gamed. The market takes months to notice a lot
 * and months to forget one, so this is the average of what went out across the
 * window — a player who starts paying today buys a number that arrives over two
 * quarters, and one who stops keeps it for two more.
 *
 * Never zero, because a production looking at Iceland finds the film commission
 * whether or not anybody here bought a stand at a market. Spending nothing
 * means being on a list rather than being in the conversation.
 */
export function reachOf(sim: Simulation): number {
  const from = sim.now - SELLING.remembers * 30 * MS_DAY;
  let spent = 0;
  for (const txn of sim.universe.transactions) {
    if (txn.at < from || !txn.memo.endsWith(SELLING_MEMO)) continue;
    for (const posting of txn.postings) if (posting.amount > 0) spent += posting.amount;
  }
  const amonth = spent / SELLING.remembers;
  const above = Math.max(0, amonth - SELLING.floor);
  return Math.min(1, above / (SELLING.most - SELLING.floor));
}

/** The memo the selling line is posted under, which is what `reachOf` reads. */
export const SELLING_MEMO = OVERHEAD.find((one) => one.id === 'selling')!.label;

/** What the lot is spending a month on being known, floor included. */
export function sellsFor(sim: Simulation): Money {
  const lot = theLot(sim);
  const company = lot?.ownerId ? sim.universe.companies[lot.ownerId] : undefined;
  return Math.max(SELLING.floor, Math.min(SELLING.most, company?.sellsFor ?? SELLING.floor));
}

/**
 * Somebody rings about a stage, and either books or does not.
 *
 * The shape of who rings is weighted toward the middle of the market, because
 * that is where the work is. How many of them ring is `pullOn`.
 */
export function takeAnEnquiry(sim: Simulation, nth = 0): Booking | undefined {
  if (stagesOn(sim).length === 0) return undefined;
  const lot = theLot(sim);
  const company = lot?.ownerId ? sim.universe.companies[lot.ownerId] : undefined;
  const rng = sim.rng('lot', String(Math.floor(sim.now / MS_DAY)), nth);
  // Selling changes who rings, not only how many. A producer in Reykjavik
  // knows the stages are there whether or not anybody bought a stand at a
  // market; a desk in Los Angeles hears about a show after the budget is
  // locked unless somebody was in that conversation first. So the money moves
  // the mix toward the foreign end, and the foreign end is where the weeks are.
  const reach = reachOf(sim);
  const weigh = (one: { weight: number; of: Enquiry }): number =>
    one.of.local ? one.weight : one.weight * (1 + FOREIGN_REACH * reach);
  const total = ENQUIRY_SHAPES.reduce((n, one) => n + weigh(one), 0);
  let roll = rng.next() * total;
  let need = ENQUIRY_SHAPES[0]!.of;
  for (const one of ENQUIRY_SHAPES) {
    roll -= weigh(one);
    if (roll <= 0) { need = one.of; break; }
  }

  // They want the stage some weeks out, not tomorrow.
  const from = sim.now + Math.round(30 + rng.next() * 90) * MS_DAY;
  const answer = wouldBook(sim, need, from);
  if (!answer.stageId) {
    // What rang and did not book, kept as a running count by reason. It is the
    // only way the lever on selling can be read honestly: money buys attention
    // from abroad, and most of what it buys is productions the rebate was
    // never built for. A player who cannot see that is being sold a trap.
    if (company) {
      const why = /right size/.test(answer.because) ? 'room'
        : /doesn’t cover/.test(answer.because) ? 'rebate'
          : /too much of what it has to spend/.test(answer.because) ? 'price' : 'booked';
      company.turnedAway = { ...(company.turnedAway ?? {}), [why]: (company.turnedAway?.[why] ?? 0) + 1 };
    }
    return undefined;
  }

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
