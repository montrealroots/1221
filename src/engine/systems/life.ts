/**
 * SLATE — Wellbeing and sleep.
 *
 * What is left of daily life. The activities, the kitchen and the people you
 * did them with went; meals came back as a day's groceries and Eat A Meal,
 * paid for (`systems/household.ts`). The part Home reads is here — how
 * a character is, how the passage of time changes it, and what a player does
 * about it. Sleep was for a while the one interaction left that moved the
 * clock on purpose; eating, showering, working out and unwinding joined it.
 *
 * A day in SLATE is still a budget of hours. Each of these is a real
 * interaction that advances the world, and time that passes unattended costs
 * something.
 */

import { mattressWorn, onTheFloor, owns, unwindComfort } from './furniture';
import { WORN_NIGHT } from '../content/furniture';
import { boatOf, charterAt, charterCost, charterRefusal, outingCost, outingRefusal } from './boats';
import { bikeHere, rideOut, rideRefusal, trailOut, trailRefusal } from './outings';
import { jetLagLoss } from './jetlag';
import type { Simulation } from '../core/simulation';
import { DROP_INS, DROP_IN_MINUTES, type DropIn } from '../content/dropins';
import { CITIES } from '../content/geography';
import type { Money } from '../core/money';
import { inSaveMoney } from './banking';
import { salesTaxRate } from '../content/tax';
import { CommandError } from '../core/simulation';
import type { Person, Wellbeing } from '../domain/model';
import { clamp, remap } from '../core/rng';
import { formatTime, instantFromZoned, startOfDay, startOfNextDay, zonedParts, MS_HOUR, MS_DAY, type Instant } from '../core/time';
import type { ScheduledItem } from '../core/scheduler';
import { ceilingAt, recoveryFactorAt } from '../content/lifespan';
import { personalityOf } from './personality';
import { bodyDay, bodyOf, eatsOut, eatsShort, exerts } from './body';
import { starvedPastTheLimit } from './mortality';
import { chanceOver, mayHurt, trainingRefusal } from './injury';
import { INJURY } from '../content/injury';
import { BODY } from '../content/body';
import { SAUNA } from '../content/specialrooms';
import { LOVED_MOOD, LOVED_RELIEF, lovedIn } from './enjoyment';
import { buyTheDaysFood, canPayFor, fedOn, mealOf, spend } from './household';
import { SINK_FULL, cook, kitchenMeal, sinkFull } from './kitchen';
import { bathroomWait } from './rooms';
import { watchRefusal } from './homelife';
import { takePortion } from './pantry';
import { GARMENTS_PER_LOAD, cleanOutfits, useTowel, washableDirty, wearForSwim } from './wardrobe';
import { SITTING_MET } from './coldstress';
import { countWash } from './water';
import { bookInHand, readFor } from './reading';
import { cutNow } from './utilities';
import { SHAVE, shave, shaveReady, sprayUsed } from './hygiene';
import { diningQuote, diningRefusal, restaurantById, type DineHow } from './dining';
import { dailyCare, detergentFor, dishSoapFor, groomingLift, groomingQuote, groomingRefusal, salonById, showerUses } from './hygiene';
import { trainedSession } from './trainers';
import { roomGone } from './latecheckout';
import { runInShoes } from './resale';
import { MOWN_CM, MOW_MINUTES, lawnOf, mow } from './lawns';
import { livingIn } from './homes';
import {
  DELIVERY, EAT_OUT, LAUNDRY, TRAINING, WORN_CLOTHES, atHome, cleaningMinutes, cooks, doLaundry, heatLoss, laundryCost, laundryWay, livingOf, outsideRefusal, fineWeatherRefusal, placeOf,
  swimRefusal, trainingAt, wearOutfit, courtAt, courtRefusal, COURT_MET, WASH_UP, washUp,
} from './dwelling';

// ---------------------------------------------------------------------------
// Wellbeing model
// ---------------------------------------------------------------------------

/** Hourly drain applied while awake, before any sleep debt raises it. */
export const ENERGY_DRAIN_PER_HOUR = 3.0;
/**
 * How fast somebody gets hungry while awake, per hour.
 *
 * Calibrated against what a year of it costs: a little over three meals a
 * day, which is what one person feeding themselves actually eats.
 */
export const NOURISHMENT_DRAIN_PER_HOUR = 2.0;

/** The sleep debt a waking hour adds, and the most that waking runs it up to. A short night can leave more, by at most its own shortfall's worth, and waking holds that. */
const DEBT_PER_WAKING_HOUR = 0.34;
const DEBT_CEILING = 60;
/** Energy under this is running on empty, and nourishment under this is hungry. */
export const EMPTY = 15;
const HUNGRY = 20;
/** Stress over this costs condition for as long as it stays there. */
export const OVERWROUGHT = 75;
/** Hygiene under this wears on the mood for as long as it stays there. */
const GRIMY = 50;

/** What an everyday life keeps fitness at without any training. */
export const EVERYDAY_FITNESS = 35;
/**
 * Where morale settles, and how much of the way back a night brings it.
 *
 * Morale used to keep whatever the nights gave it, and any life with decent
 * nights reached a hundred and stayed there, so a meal, a workout or an hour
 * unwinding lifted a dial that could not go higher. Measured on a year of
 * autopilot and on half a year of eight-hour nights, before: morale 100 both.
 *
 * Where it settles is the body's: forty, and forty-five hundredths of how
 * near condition is to what the age allows on top. So 85 for a body at its
 * age's ceiling, 81 at the 91 everyday fitness mends a young one to, and 40
 * for a body worn to nothing. A flat eighty was tried first, and five-hour
 * nights for ninety days ended at stress 100 and condition 0 with morale
 * 70.5, held up by a pull no body in that state has. Then condition itself
 * was tried, and put everybody of eighty-one, whose ceiling is 64.3, at 76
 * on the best nights there are: old, not unhappy.
 */
export function moraleSettlesAt(person: Person, condition: number, at?: number): number {
  const allowed = at === undefined ? 100 : ceilingAt(yearsSince(person.birthInstant, at)).condition;
  return 40 + 45 * Math.min(1, condition / allowed);
}
const MORALE_RETURNS = 0.35;

/**
 * How far rest can mend condition: seventy, and six tenths of fitness on top,
 * never past what the age allows.
 *
 * A night used to take condition to the age's ceiling whatever the body, so
 * a year on autopilot and half a year of daily workouts both sat at 99.7. At
 * `EVERYDAY_FITNESS` this is 91, and at fifty, where a new character starts,
 * it's a hundred, so nobody starts below it.
 */
export function mendsTo(person: Person, at?: number, fitness = person.wellbeing.fitness): number {
  const age = at === undefined ? 100 : ceilingAt(yearsSince(person.birthInstant, at)).condition;
  return Math.min(age, 70 + 0.6 * fitness);
}

/**
 * How much of a night's recovery a full sleep debt holds back.
 *
 * What gives energy a memory. Without it a night put back about ninety points
 * whatever came before it, so one week of rest and twelve left a person in
 * exactly the same place. With it, you cannot fill the tank while you are
 * carrying one, and recovery is gradual. It used to live beside the working
 * week in the audition content; it was never about work, so it lives here.
 */
export const DEBT_HOLDS = 0.62;

export function freshWellbeing(): Wellbeing {
  return {
    energy: 82, stress: 18, sleepDebt: 0, morale: 62,
    condition: 88, fitness: 50, nourishment: 75, hygiene: 80,
  };
}

/**
 * Applies a stretch of waking time to a person's condition.
 *
 * `chargeWakingHours` calls it as the clock moves, for the stretch the clock
 * just crossed. Until schema 88 the midnight rollover was its only caller, and
 * charged the whole day ahead in one lump, whether the player then slept or
 * not: a player up at seven was charged twenty-four waking hours a day,
 * nothing on Home moved while a day was played, and energy fell seventy-two
 * points at midnight.
 *
 * A stretch is now anything from one second of live play to a week skipped,
 * so the same afternoon has to cost the same however the clock crossed it.
 * Three things make it:
 *
 * - The drain is set by `carried`, the debt somebody woke with, not by the
 *   debt the hours they have been up since have added. That is what the lump
 *   charged too, a day at the debt it began with. Letting each second's
 *   drain read the debt the seconds before it had added made an autopilot
 *   day 2.7 energy dearer, and took the lowest condition of the worst
 *   moraleSwing pick at sixty, left alone for a year, from 80.6 to 63.6.
 * - The hours spent running on empty are the ones after energy fell past
 *   fifteen: charging all of a long stretch for ending below the line made
 *   one short night cost a day and a half of stress.
 * - The hours spent hungry are the ones after nourishment fell past twenty,
 *   and the hours overwrought the ones stress spent over seventy-five, for
 *   the same reason. The lump charged every hour of a day that ended there.
 *
 * Measured: sixteen hours as 57,600 one-second ticks and as one jump ended on
 * the same dials to the first decimal.
 *
 * Waking holds sleep debt at sixty and never takes it down. A night under six
 * hours can leave more than sixty, and pulling it back to sixty in the first
 * waking second wiped four and a half hours of debt off the dial at once.
 */
export function applyElapsedWellbeing(person: Person, hours: number, carried = person.wellbeing.sleepDebt): void {
  if (!(hours > 0)) return;
  const w = person.wellbeing;

  const drain = ENERGY_DRAIN_PER_HOUR * (1 + (carried / 24) * 0.5);
  const emptyAt = clamp((w.energy - EMPTY) / drain, 0, hours);
  const fedFor = clamp((w.nourishment - HUNGRY) / NOURISHMENT_DRAIN_PER_HOUR, 0, hours);
  const hungry = hours - fedFor;

  // Stress clears while there is something left in the tank and climbs once
  // there is not, and it climbs faster in a highly strung or driven person
  // than an even-tempered one.
  const recovery = 0.35 * personalityOf(person, 'stressRecovery');
  const onEmpty = 1.6 * personalityOf(person, 'stressGain') - recovery;
  const stressAtEmpty = clamp(w.stress - recovery * emptyAt, 0, 100);
  const overwrought = hoursOver(w.stress, -recovery, emptyAt, OVERWROUGHT)
    + hoursOver(stressAtEmpty, onEmpty, hours - emptyAt, OVERWROUGHT);
  w.stress = clamp(stressAtEmpty + onEmpty * (hours - emptyAt), 0, 100);

  w.energy = clamp(w.energy - drain * hours, 0, 100);
  w.nourishment = clamp(w.nourishment - NOURISHMENT_DRAIN_PER_HOUR * hours, 0, 100);
  w.sleepDebt = Math.max(w.sleepDebt, Math.min(DEBT_CEILING, w.sleepDebt + hours * DEBT_PER_WAKING_HOUR));
  w.condition = clamp(w.condition - hungry * 0.5 - overwrought * 0.25, 0, 100);

  // Hours spent grimy are counted the way hungry ones are: the ones after
  // hygiene fell past the line, so ticks and a jump agree.
  const soils = 1.6 * personalityOf(person, 'hygieneDrift');
  const grimy = hours - clamp(((w.hygiene ?? 80) - GRIMY) / soils, 0, hours);
  const low = hungry * 0.7 + grimy * 0.4;
  if (low > 0) w.morale = clamp(w.morale - low * personalityOf(person, 'moraleSwing'), 0, 100);

  w.hygiene = clamp((w.hygiene ?? 80) - hours * soils, 0, 100);
}

/** How many of `span` hours a straight line from `from`, at `rate` an hour, spends over `line`. */
function hoursOver(from: number, rate: number, span: number, line: number): number {
  if (span <= 0) return 0;
  if (rate === 0) return from > line ? span : 0;
  const meets = (line - from) / rate;
  if (rate > 0) return from > line ? span : clamp(span - meets, 0, span);
  return from > line ? clamp(meets, 0, span) : 0;
}

/**
 * Charges a person for the part of the stretch from `from` to `to` they were
 * awake for.
 *
 * The clock charges nothing before `awakeSince`: a night they are asleep in is
 * paid for by `applySleep`, at the wake for a night they chose and at its
 * bedtime for one nobody did. The drain is set by the debt they woke with,
 * `wokeWithDebt`, so it comes out the same at every second of the day.
 *
 * It used to be worked out as the debt now less what the hours up had added.
 * That stopped being true once the debt reached sixty, where waking holds it,
 * and one-second ticks then drained more slowly than one jump: twelve hours
 * from a debt of fifty-eight ended at 20.9 energy one way and 20.5 the other.
 * It is still the answer for a save from before 88 until its first wake, and
 * it is exact there unless that debt reaches sixty. Somebody with no waking
 * day on record starts one here.
 */
export function chargeWakingHours(person: Person, from: number, to: number): void {
  if (person.awakeSince === undefined) {
    person.awakeSince = from;
    person.wokeWithDebt = person.wellbeing.sleepDebt;
  }
  const start = Math.max(from, person.awakeSince);
  if (to <= start) return;
  applyElapsedWellbeing(person, (to - start) / MS_HOUR, debtWokenWith(person, start));
}

/**
 * The sleep debt somebody woke with, from a moment of their waking day with
 * the debt charged up to it: the one on record, or, for a save from before 88
 * until its first wake, the debt now less what the hours up have added.
 */
function debtWokenWith(person: Person, at: number): number {
  const up = (at - (person.awakeSince ?? at)) / MS_HOUR;
  return person.wokeWithDebt ?? Math.max(0, person.wellbeing.sleepDebt - up * DEBT_PER_WAKING_HOUR);
}

/**
 * A single 0-100 readiness number: how well is this person going to perform
 * right now?
 */
export function readiness(person: Person): number {
  const product = readinessParts(person).reduce((p, part) => p * part.factor, 1);
  return clamp(100 * product / 1.35, 5, 100);
}

export type ReadinessDial = 'energy' | 'stress' | 'sleepDebt' | 'nourishment' | 'morale' | 'hygiene' | 'condition';

/**
 * Each dial's multiplier on readiness now, and the most it gives at its best:
 * what the Wellbeing look ranks as costing the most. Until 2026-09-27 the
 * look ranked the dials by a formula of its own, and hygiene at 40 outranked
 * stress at 50, which costs readiness three times as much.
 */
export function readinessParts(person: Person): { key: ReadinessDial; factor: number; best: number }[] {
  const w = person.wellbeing;
  return [
    { key: 'energy', factor: remap(w.energy, 0, 100, 0.45, 1.15), best: 1.15 },
    { key: 'stress', factor: remap(w.stress, 0, 100, 1.12, 0.62), best: 1.12 },
    { key: 'sleepDebt', factor: remap(w.sleepDebt, 0, 30, 1.05, 0.66), best: 1.05 },
    { key: 'nourishment', factor: remap(w.nourishment, 0, 100, 0.78, 1.05), best: 1.05 },
    { key: 'morale', factor: remap(w.morale, 0, 100, 0.82, 1.12), best: 1.12 },
    // Turning up to a room having not showered in two days is not nothing, but
    // it is not much either: a few points, not a career.
    { key: 'hygiene', factor: remap(w.hygiene ?? 80, 0, 100, 0.92, 1.03), best: 1.03 },
    // Condition was left out, so fitness reached nothing past its own dial. A
    // body at ninety-one, where everyday fitness mends it to, is 2.7% short of
    // one at a hundred.
    { key: 'condition', factor: remap(w.condition, 0, 100, 0.7, 1), best: 1 },
  ];
}

export function wellbeingSummary(person: Person): string {
  const w = person.wellbeing;
  if (w.energy < 15) return 'Running on empty. You need sleep before anything else.';
  if (w.sleepDebt > 20) return 'Badly short on sleep. Everything is harder than it should be.';
  if (w.stress > 78) return 'Stretched very thin. Something is going to give.';
  if (w.nourishment < 25) return 'Hungry, and it’s starting to show.';
  if (w.energy > 75 && w.stress < 30) return 'Rested, steady and ready for a real day.';
  if (w.morale < 30) return 'Flat. The work is fine, the feeling isn’t.';
  return 'Holding up, and no dial is far enough out to be worth naming.';
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

export function registerLife(sim: Simulation): void {
  // Somebody the player stayed up with past midnight still sleeps when the
  // clock is then jumped through the rest of that night, and so does somebody
  // any stop in the small hours got up; a night a stop in its first hour left
  // unpaid is paid here. This runs before the waking charge, so the stretch
  // the night covers is not charged as awake.
  sim.onPassage('life.night_alone', (s, from) => {
    for (const person of Object.values(s.universe.people)) sleepAlone(s, person, from);
  });

  // Being awake costs something every second of it, so it is charged as the
  // clock moves rather than at midnight.
  sim.onPassage('life.waking', (s, from) => {
    for (const person of Object.values(s.universe.people)) chargeWakingHours(person, from, s.now);
  });

  // Re-armed for the first instant of the next calendar date. It was armed a
  // day on from the start of today, which kept the hour that today began at,
  // so where the clocks skipped midnight the day after rolled over at one too
  // (at 01:01 in Beirut and Cairo).
  sim.onSchedule('life.day_rollover', () => {
    dailyRollover(sim);
    sim.schedule({
      at: startOfNextDay(sim.now, sim.homeZone),
      kind: 'life.day_rollover',
      label: 'New Day',
      category: 'system',
      priority: 5,
    });
  });

  // --- Sleep ---------------------------------------------------------------

  sim.onCommand<{ hours: number; startAt?: number }, { wokeAt: number; quality: number; recovered: number }>(
    'life.sleep',
    (p, { sim: s }) => {
      const person = s.player;
      const hours = clamp(p.hours, 0.5, 16);
      const start = p.startAt ?? s.now;
      if (start < s.now) throw new CommandError('You can’t go to sleep in the past.');
      const busy = occupiedAt(s, start);
      if (busy) throw new CommandError(`You’re at ${busy.label} until ${formatTime(busy.at + busy.durationMinutes! * 60_000, s.zone)}.`);
      const wakeAt = start + Math.round(hours * MS_HOUR);

      // Anything scheduled during the night still happens; the world does not
      // pause because the player is unconscious.
      // Until 2026-09-26 a shift said for itself that it was slept through,
      // and wasn't counted here; the job engine went, and shifts with it.
      const crossed = s.timeline.between(s.now, wakeAt).filter((i) => i.requiresPlayer === true);

      // The night is on record from the moment it is booked, as the wake it
      // ends at. So a midnight inside it, one it ends on, and one between the
      // booking and the bedtime all see a night already chosen, and give no
      // night nobody chose on top of it. It used to be stamped at the wake,
      // after the night, and the rollover gave a second night to a save's
      // first night across midnight and to any night that ended on the stroke
      // of midnight twenty hours or more after the last. For a night they
      // chose it is the wake that is stamped, never the bedtime.
      person.lastSleptAt = wakeAt;

      // The night is read at the hour it starts. It used to be read when it was
      // booked, so a night booked at eight for one in the morning was slept at
      // the stress and the hour of eight.
      if (start > s.now) s.advanceTo(start);
      const quality = sleepQuality(s, person);
      const before = { ...person.wellbeing };

      // The clock has charged them for being awake up to now. From here they
      // are asleep until the wake, so it charges nothing for the night itself:
      // the night is paid for below, by `applySleep`.
      person.awakeSince = Math.max(person.awakeSince ?? wakeAt, wakeAt);
      s.emit('life.sleep_started', { personId: person.id, hours, quality });
      s.advanceTo(wakeAt);

      applySleep(person, hours, quality, s.now, before);
      person.wokeWithDebt = person.wellbeing.sleepDebt;
      const recovered = person.wellbeing.energy - before.energy;

      s.emit('life.woke', { personId: person.id, hours, quality, recovered });

      if (crossed.length > 0) {
        s.notify({
          category: 'schedule',
          title: `You Slept Through ${crossed.length} Commitment${crossed.length === 1 ? '' : 's'}`,
          body: crossed.map((c) => c.label).join(', '),
          importance: 70,
          route: '/workspace/calendar',
        });
      }

      return { wokeAt: s.now, quality, recovered };
    },
  );

  // --- Eating out at a real restaurant (`systems/dining.ts`, from 2026-10-01) ---
  // At a table, taken away or delivered: the time it takes, paid at the menu's
  // prices with tax, tip and a delivery's fees, and eaten as an ordered meal is.
  sim.onCommand<{ restaurantId: string; items: string[]; how: DineHow }, { doneAt: number; paid: number }>('food.dine', (p, { sim: s }) => {
    const person = s.player;
    const how: DineHow = p?.how === 'takeout' || p?.how === 'delivery' ? p.how : 'in';
    const items = Array.isArray(p?.items) ? p.items.map(String) : [];
    const no = diningRefusal(s, person, String(p?.restaurantId), items, how) ?? (person.wellbeing.nourishment >= FULL ? 'You aren’t hungry.' : undefined);
    if (no) throw new CommandError(no);
    const busy = occupiedAt(s, s.now);
    if (busy) throw new CommandError(`You’re at ${busy.label} until ${formatTime(busy.at + busy.durationMinutes! * 60_000, s.zone)}.`);
    const r = restaurantById(String(p.restaurantId))!;
    const quote = diningQuote(s, r, items, how)!;
    if (!spend(s, person, quote.total, how === 'delivery' ? `${r.name}, delivered` : r.name, 'food')) throw new CommandError('The payment didn’t go through.');
    s.advanceTo(s.now + quote.minutes * 60_000);
    applyLookingAfter(person, 'order', s.now);
    return { doneAt: s.now, paid: quote.total };
  });

  // --- A barber or a salon (`systems/hygiene.ts`, from 2026-10-01) ---
  sim.onCommand<{ salonId: string; service: string }, { doneAt: number; paid: number }>('hygiene.groom', (p, { sim: s }) => {
    const person = s.player;
    const no = groomingRefusal(s, person, String(p?.salonId), String(p?.service));
    if (no) throw new CommandError(no);
    const busy = occupiedAt(s, s.now);
    if (busy) throw new CommandError(`You’re at ${busy.label} until ${formatTime(busy.at + busy.durationMinutes! * 60_000, s.zone)}.`);
    const salon = salonById(String(p.salonId))!;
    const q = groomingQuote(s, salon, String(p.service))!;
    if (!spend(s, person, q.price + q.tip, salon.name, 'personal')) throw new CommandError('The payment didn’t go through.');
    s.advanceTo(s.now + q.minutes * 60_000);
    person.wellbeing.morale = clamp(person.wellbeing.morale + groomingLift(person, s.now) * personalityOf(person, 'moraleSwing'), 0, 100);
    person.groomedAt = s.now;
    return { doneAt: s.now, paid: q.price + q.tip };
  });

  // --- A yoga or dance class, taken one at a time (`content/dropins.ts`, from 2026-10-03) ---
  sim.onCommand<{ classId: string }, { doneAt: number; paid: number }>('class.take', (p, { sim: s }) => {
    const person = s.player;
    const c = DROP_INS.find((x) => x.id === p?.classId);
    if (!c) throw new CommandError('There’s no such class.');
    if (person.currentLocationId !== c.cityId) throw new CommandError(`${c.studio} is in ${CITIES.require(c.cityId).name}.`);
    const busy = occupiedAt(s, s.now);
    if (busy) throw new CommandError(`You’re at ${busy.label} until ${formatTime(busy.at + busy.durationMinutes! * 60_000, s.zone)}.`);
    const paid = dropInPrice(s, c);
    if (!spend(s, person, paid, `${c.studio}, ${c.label.toLowerCase()}`, 'personal')) throw new CommandError('The payment didn’t go through.');
    s.advanceTo(s.now + DROP_IN_MINUTES * 60_000);
    exerts(person, c.met, DROP_IN_MINUTES / 60);
    // Under three METs it's an hour unwinding, not a workout, as a lesson is (`systems/clubs.ts`).
    applyLookingAfter(person, c.met >= 3 ? 'exercise' : 'unwind', s.now);
    return { doneAt: s.now, paid };
  });

  // --- Looking after yourself ---------------------------------------------

  sim.onCommand<{ action: LookAfter; how?: string }, { doneAt: number; changed: Partial<Wellbeing> }>(
    'life.look_after',
    (p, { sim: s }) => {
      const action = LOOKING_AFTER[p.action] ? p.action : undefined;
      if (!action) throw new CommandError('That isn’t something you can do for yourself here.');
      const refused = lookAfterRefusal(s, action);
      if (refused) throw new CommandError(refused);
      // Unwinding in front of the TV or a game, at home, by what the place's law and what you pay for allow (`systems/homelife.ts`).
      if (action === 'unwind' && p.how) {
        if (!atHome(s.player)) throw new CommandError('That’s at home.');
        // With a book of their own, from 2026-10-03: picked up where it was left (`systems/reading.ts`).
        const no = p.how === 'read' ? (bookInHand(s.player) ? undefined : 'There’s no book at home you haven’t read through.') : watchRefusal(s, s.player, String(p.how));
        if (no) throw new CommandError(no);
      }

      // The hour is lived first, and charged as waking like any other, so
      // what it does is on top of what the hour already cost.
      const cost = costFor(s, action);
      // Eaten from the kitchen first: what's ready, or a recipe the stock makes, cooked as Cook It cooks it.
      const kitchen = action === 'eat' ? kitchenMeal(s, s.player) : undefined;
      if (kitchen && 'recipeId' in kitchen) {
        const before = { ...s.player.wellbeing };
        cook(s, s.player, kitchen.recipeId);
        const changed: Partial<Wellbeing> = {};
        for (const key of Object.keys(before) as (keyof Wellbeing)[]) {
          const moved = (s.player.wellbeing[key] ?? 0) - (before[key] ?? 0);
          if (moved !== 0) changed[key] = moved;
        }
        return { doneAt: s.now, changed };
      }
      s.advanceTo(s.now + minutesFor(s, action) * 60_000);
      const person = s.player;
      // A meal is bought as it's cooked (`systems/household.ts`), and a delivered one at delivery's price.
      // A payment that doesn't go through leaves them unfed: the command fails, and the time with it.
      if (kitchen) takePortion(person, kitchen.ready);
      else if (action === 'eat' && !spend(s, person, cost, cooks(s, person) ? 'A meal' : 'A meal out', 'food')) throw new CommandError('The payment didn’t go through.');
      if (action === 'order' && !spend(s, person, cost, 'A meal delivered', 'food')) throw new CommandError('The payment didn’t go through.');
      // The washing's own reason where it fails after the time is spent (from 2026-10-02; until then every failure read as a payment's).
      if (action === 'laundry' && !detergentFor(s, person, Math.ceil(washableDirty(s, person).length / GARMENTS_PER_LOAD))) throw new CommandError('There isn’t enough laundry detergent at home for it.');
      if (action === 'laundry' && !doLaundry(s, person, s.now)) throw new CommandError('The payment didn’t go through.');
      if (action === 'boat' && !spend(s, person, cost, 'Gas for the boat, at the marina', 'vehicle')) throw new CommandError('The payment didn’t go through.');
      if (action === 'charter' && !spend(s, person, cost, `A boat chartered with its captain, ${charterAt(person.currentLocationId)?.operator ?? ''}`, 'personal')) throw new CommandError('The payment didn’t go through.');
      // A workout or a swim is an outfit worn.
      // A reader unwinding at home with a book of their own reads it (`readFor`, from 2026-10-03).
      const reads = action === 'unwind' && atHome(person) && (p.how === 'read' || (!p.how && lovedIn(person, 'unwind').includes('reading')));
      if (action === 'swim') wearForSwim(s, person);
      else if (action === 'exercise' || action === 'ride' || action === 'court' || action === 'dance') wearOutfit(s, person, true);
      // The lawn cut (`systems/lawns.ts`, from 2026-10-02).
      if (action === 'mow') { const home = livingIn(person); if (home) mow(home, s.now); }
      // The place's spray, where there's some (from 2026-10-03).
      if (action === 'tidy') sprayUsed(s, person);
      if (action === 'washup') washUp(s, person);
      const before = { ...person.wellbeing };
      // Eaten out where there's no kitchen: a restaurant's meal too.
      if (action === 'eat' && !cooks(s, person)) eatsOut(person);
      const placed = action === 'exercise' ? trainingAt(s, person) : undefined;
      // With a trainer booked and a session left this week: their studio's workout, the more built (`systems/trainers.ts`, from 2026-10-02).
      const coached = placed ? trainedSession(s, person, s.now) : 1;
      const where = placed && coached > 1 ? { where: 'gym' as const, builds: TRAINING.gym * coached } : placed;
      // A bike's ride builds as a run does, the same hour's work outdoors (`content/rides.ts`).
      const bike = action === 'ride' ? bikeHere(person) : undefined;
      // A sauna unwinds at an hour's unwinding rate for its minutes, SLATE's reading, as a program's minutes do.
      applyLookingAfter(person, action, s.now, where ? where.builds : action === 'swim' ? TRAINING.gym : action === 'ride' || action === 'court' || action === 'dance' ? TRAINING.run : 1, action === 'unwind' && atHome(person) ? unwindComfort(person) : action === 'sauna' ? SAUNA.sessionMinutes / 60 : 1);
      // Read after the hour's enjoyment is counted, so a book finished in it still gave it.
      if (reads) readFor(s, person, LOOKING_AFTER.unwind.minutes);
      // A shower or a bath uses its soap and shampoo, and without them doesn't leave them as clean (`systems/hygiene.ts`).
      if (action === 'wash' || action === 'bathe') person.wellbeing.hygiene = Math.min(person.wellbeing.hygiene ?? 100, showerUses(s, person));
      // Metered at home, against the average (`systems/water.ts`, from 2026-10-03).
      if ((action === 'wash' || action === 'bathe') && atHome(person)) countWash(person, action === 'bathe');
      // A shave with it on its day, where the razor and cream are to hand (from 2026-10-03).
      if (action === 'wash') shave(s, person);
      // Dried on one of their own towels at home, a use toward its wash; a hotel, a let or a gym gives its own (`useTowel`, from 2026-10-02).
      if ((action === 'wash' || action === 'bathe') && atHome(person) && !useTowel(s, person) && person.id === s.universe.playerId) s.notify({ category: 'home', title: 'No Clean Towel', body: 'Every towel to hand is in the wash or still drying: put a load on.', importance: 25, route: '/workspace/clothes' });
      // An hour of it, at its injury rate (`content/injury.ts`).
      if (action === 'exercise' || action === 'swim') {
        const source = action === 'swim' ? 'swim' : where!.where === 'run' ? 'run' : 'gym';
        // An hour of it at its MET value (`content/body.ts`), and its injury rate.
        exerts(person, source === 'swim' ? BODY.met.swim : source === 'run' ? BODY.met.run : BODY.met.workout, 1);
        // A run wears the sneakers down (`runInShoes`, from 2026-10-02).
        if (source === 'run') runInShoes(s, person);
        mayHurt(s, person, source, chanceOver(INJURY.perThousandHours[source], 1), s.now);
      }
      // An hour on your own court at its MET value; no injury rate for a home court is kept (`courtAt`, from 2026-10-01).
      const court = action === 'court' ? courtAt(person) : undefined;
      if (court) exerts(person, COURT_MET[court.court], 1);
      if (action === 'dance') exerts(person, DANCE_MET, 1);
      // The heater's hour to heat and the session on the month's bill, where it's billed by the kilowatt-hour (`systems/electricity.ts`).
      if (action === 'sauna') { const l = livingOf(person); l.extraKwh = (l.extraKwh ?? 0) + (SAUNA.heaterKw * (SAUNA.preheatMinutes + SAUNA.sessionMinutes)) / 60; }
      // A ride's effort and a cyclist's risk on the road; the trail's effort (`systems/outings.ts`).
      if (action === 'ride' && bike) rideOut(s, person, bike);
      if (action === 'trail') trailOut(person);
      const changed: Partial<Wellbeing> = {};
      for (const key of Object.keys(before) as (keyof Wellbeing)[]) {
        const moved = (person.wellbeing[key] ?? 0) - (before[key] ?? 0);
        if (moved !== 0) changed[key] = moved;
      }
      return { doneAt: s.now, changed };
    },
  );
}

// ---------------------------------------------------------------------------
// Looking after yourself
// ---------------------------------------------------------------------------

/**
 * The four things a player can do for their own body and mind besides sleep.
 *
 * Until these, sleep was the only one. Meals and a shower came from the
 * morning top-ups and nothing else, stress came down only with the hours, and
 * fitness had no writer at all, so it fell 0.18 a day from the first morning
 * to the last. The top-ups stay as the floor a coasted day gets; these are
 * how a player does better than coasting, which is what the top-ups' own
 * comment always said a player should be able to do.
 *
 * Each takes real time off the clock, and the clock charges that time as
 * waking before the action pays out.
 */
export type LookAfter = 'eat' | 'order' | 'wash' | 'bathe' | 'exercise' | 'swim' | 'court' | 'dance' | 'ride' | 'outside' | 'boat' | 'trail' | 'charter' | 'unwind' | 'laundry' | 'tidy' | 'washup' | 'mow' | 'sauna';

export const LOOKING_AFTER: Record<LookAfter, { label: string; minutes: number; does: string }> = {
  eat: { label: 'Eat A Meal', minutes: 40, does: 'Cooked at home, or a meal out: feeds you, and lifts the mood by as much as you needed it' },
  order: { label: 'Order In', minutes: 50, does: 'A meal delivered, at what delivery costs: feeds you without the cooking' },
  wash: { label: 'Shower', minutes: 20, does: 'Clean again, and calmer by as much as you needed it' },
  bathe: { label: 'Take A Bath', minutes: 45, does: 'Clean again, and a long soak takes more of the stress off' },
  exercise: { label: 'Work Out', minutes: 60, does: 'Builds fitness, more the readier you are, and eases stress; costs energy, food, a shower and an outfit' },
  swim: { label: 'Swim In The Pool', minutes: 45, does: 'Builds fitness as a gym does, and lifts the mood more' },
  // From 2026-10-03: a spare bedroom made a dance studio, danced in at the Compendium's ballet, modern or jazz class (`DANCE_MET`).
  dance: { label: 'Dance In Your Studio', minutes: 60, does: 'An hour on your own sprung floor at a dance class’s effort: builds fitness as a run does and eases stress' },
  court: { label: 'Play On Your Court', minutes: 60, does: 'Tennis or basketball on your own court in the fine weather, and after dark where it’s lit: builds fitness as a run does' },
  ride: { label: 'Go For A Ride', minutes: 60, does: 'On your own bicycle or e-bike in the fine weather: builds fitness as a run does and eases stress, at a cyclist’s risk on the road' },
  outside: { label: 'Sit Outside', minutes: 45, does: 'Out on your balcony, terrace or yard in the fine weather: calmer, and in better spirits' },
  charter: { label: 'Charter A Boat', minutes: 180, does: 'Out on the water with a captain, no boat or certificate of your own, in the fine weather: calmer, and in better spirits' },
  boat: { label: 'Take The Boat Out', minutes: 180, does: 'Three hours on the water in the fine weather, its gas at the marina: calmer, and in better spirits' },
  trail: { label: 'Ride The ATV', minutes: 120, does: 'Two hours on land of your own in the fine weather: calmer, and in better spirits' },
  unwind: { label: 'Unwind', minutes: 60, does: 'Takes the edge off stress and lifts the mood' },
  // From 2026-10-04: a sauna of your own, a session's 14 minutes after the hour its heater takes (`content/specialrooms.ts`).
  sauna: { label: 'Take A Sauna', minutes: SAUNA.sessionMinutes, does: 'A session in your own sauna: unwinding for its minutes, and the heater’s hour and more on the electricity bill' },
  laundry: { label: 'Do The Laundry', minutes: 20, does: 'Washes what you’ve worn: in your own machines, the building’s, or at the laundromat' },
  tidy: { label: 'Clean The Place', minutes: 60, does: 'A clean home, which stops a mess weighing on you' },
  washup: { label: 'Wash Up', minutes: 38, does: 'The dishes in the sink washed by hand, so the kitchen can be cooked in and they don’t add to the mess' },
  // From 2026-10-02 (`systems/lawns.ts`): the 1.9 hours ATUS finds a day of lawn and garden care takes.
  mow: { label: 'Mow The Lawn', minutes: MOW_MINUTES, does: 'Cuts the grass at the home you live in to 5 cm, ahead of any notice from the city' },
};

/** The 2024 Adult Compendium's ballet, modern or jazz class (03010), the dance studios' own class (`content/dropins.ts`). */
export const DANCE_MET = 5.0;

/** What a bath's soak takes off stress beyond a shower's: SLATE's estimate. */
const BATH_RELIEF = 8;

/** What a meal puts back, and what a workout costs and builds. */
const MEAL = 50;
const WORKOUT_FITNESS = 0.6;
const WORKOUT_ENERGY = 10;
/** A class's single price where it is, the town's tax added where the studio's price is before it, in the save's money. */
export function dropInPrice(sim: Simulation, c: DropIn): Money {
  return inSaveMoney(sim, Math.round(c.price * (1 + (c.taxIncluded ? 0 : salesTaxRate(c.cityId, sim.now, 'general'))) * 100), c.currency);
}

/** Too full to eat, too clean to shower, and too spent to train. */
const FULL = 90;
const CLEAN = 95;
const SPENT = 25;

/**
 * Why the player can't do it now, in the world's words, or nothing if they can.
 *
 * The menu and the command both ask this, so the menu never offers what the
 * command refuses. Something that needs the player inside the window refuses
 * it outright: sleep may run over a commitment because a night is a choice
 * worth warning about, but twenty minutes in the shower that makes you miss a
 * call is only a mistake.
 */
/**
 * The commitment the player is in the middle of at a moment: one they turned
 * up for, whose hours still run. A meal fits in one, as a break on set or
 * between classes; sleep, a shower, a workout and unwinding don't. Until
 * 2026-09-27 a commitment took only the moment it began, and at ten in the
 * morning of a twelve-hour shoot the player could sleep for eight hours and
 * the day still counted as worked.
 */
export function occupiedAt(sim: Simulation, at: Instant): ScheduledItem | undefined {
  const list = sim.universe.scheduled;
  for (let i = list.length - 1; i >= 0; i -= 1) {
    const one = list[i]!;
    if (one.status !== 'done' || one.requiresPlayer !== true || !one.durationMinutes || one.at > at) continue;
    if (one.payload.personId !== undefined && one.payload.personId !== sim.player.id) continue;
    if (at < one.at + one.durationMinutes * 60_000) return one;
  }
  return undefined;
}

/**
 * How long it takes them now: laundry by the home's way of doing it, and
 * cleaning by the size of the place; the rest what the list says.
 */
export function minutesFor(sim: Simulation, action: LookAfter): number {
  if (action === 'laundry') return LAUNDRY.minutes[laundryWay(sim, sim.player)];
  if (action === 'charter') return Math.round((charterAt(sim.player.currentLocationId)?.hours ?? 3) * 60);
  if (action === 'tidy') { const place = placeOf(sim, sim.player); return place ? cleaningMinutes(place) : LOOKING_AFTER.tidy.minutes; }
  if (action === 'washup') return Math.max(1, Math.round(WASH_UP.minutesADay * (livingOf(sim.player).dishes ?? 1)));
  // In a flat-share, waiting for the bathroom first (`bathroomWait` in `systems/rooms.ts`, from 2026-10-03).
  if (action === 'wash' || action === 'bathe') {
    const own = LOOKING_AFTER[action].minutes + (action === 'wash' && shaveReady(sim, sim.player) ? SHAVE.minutes : 0);
    return own + bathroomWait(sim, sim.player, sim.now, own);
  }
  return LOOKING_AFTER[action].minutes;
}

/** What it's called now: a meal at home is cooked; a workout says where it happens. */
export function labelFor(sim: Simulation, action: LookAfter): string {
  if (action === 'eat') return cooks(sim, sim.player) ? 'Cook A Meal' : 'Eat A Meal';
  return LOOKING_AFTER[action].label;
}

/** What it costs now, where it costs anything. */
export function costFor(sim: Simulation, action: LookAfter): number {
  if (action === 'eat') return cooks(sim, sim.player) ? mealOf(sim, sim.player) : Math.round(mealOf(sim, sim.player) * EAT_OUT.times);
  if (action === 'order') return Math.round(mealOf(sim, sim.player) * DELIVERY.times);
  if (action === 'laundry') return laundryCost(sim, sim.player).cost;
  if (action === 'boat') { const boat = boatOf(sim.player); return boat ? outingCost(sim, boat) : 0; }
  if (action === 'charter') return charterCost(sim, sim.player.currentLocationId) ?? 0;
  return 0;
}

/** The lawn of the home they live in, where it has one. */
const homeLawn = (person: Person) => { const home = livingIn(person); return home ? lawnOf(home) : undefined; };

export function lookAfterRefusal(sim: Simulation, action: LookAfter): string | undefined {
  const w = sim.player.wellbeing;
  const person = sim.player;
  const place = placeOf(sim, person);
  const busy = action === 'eat' ? undefined : occupiedAt(sim, sim.now);
  if (busy) return `You’re at ${busy.label} until ${formatTime(busy.at + busy.durationMinutes! * 60_000, sim.zone)}.`;
  if ((action === 'eat' || action === 'order') && w.nourishment >= FULL) return 'You aren’t hungry.';
  if ((action === 'eat' || action === 'order' || action === 'laundry') && canPayFor(sim, person, action === 'laundry' ? 'laundry' : 'food') < costFor(sim, action) && !(action === 'eat' && kitchenMeal(sim, person))) return 'You can’t afford it.';
  if (action === 'eat' && cooks(sim, person) && !kitchenMeal(sim, person) && sinkFull(person)) return SINK_FULL;
  if ((action === 'wash' || action === 'bathe') && (w.hygiene ?? 80) >= CLEAN) return 'You’re already clean.';
  // The water or the gas cut off at home (`systems/utilities.ts`, from 2026-10-03).
  if (atHome(person) && (action === 'wash' || action === 'bathe' || action === 'washup' || (action === 'laundry' && laundryWay(sim, person) !== 'none'))) {
    const off = cutNow(person, 'water', sim.now);
    if (off) return `${off.by}’s water is off at home until ${formatTime(off.until, sim.zone)}.`;
  }
  // A gas cut leaves no hot water for a bath: a home cut off has gas, and its boiler heats the bath; an electric shower still runs.
  if (atHome(person) && action === 'bathe') {
    const off = cutNow(person, 'gas', sim.now);
    if (off) return `There’s no hot water for a bath: ${off.by}’s gas is off until ${formatTime(off.until, sim.zone)}.`;
  }
  if ((action === 'wash' || action === 'bathe') && !atHome(person) && roomGone(person)) return person.stay?.readyAt !== undefined ? `The room isn’t ready until ${formatTime(person.stay.readyAt, sim.zone)}.` : 'You’ve checked out, and the room is gone until you leave.';
  if (action === 'bathe' && !place?.fixtures.bathtub) return atHome(person) ? 'There’s no bath where you live, only a shower.' : 'There’s no bath where you’re staying, only a shower.';
  if ((action === 'exercise' || action === 'swim' || action === 'ride' || action === 'court' || action === 'dance') && w.energy < SPENT) return 'You’re too tired to train. Sleep first.';
  if (action === 'exercise' || action === 'swim' || action === 'ride' || action === 'court' || action === 'dance') { const hurt = trainingRefusal(person, sim.now); if (hurt) return hurt; }
  if (action === 'dance' && !(atHome(person) && livingIn(person)?.facts.features.includes('danceStudio'))) return 'You have no dance studio at home.';
  if (action === 'sauna' && !(atHome(person) && livingIn(person)?.facts.features.includes('sauna'))) return 'You have no sauna at home.';
  if (action === 'ride') { const no = rideRefusal(sim, person); if (no) return no; }
  if (action === 'trail') { const no = trailRefusal(sim, person); if (no) return no; }
  if (action === 'swim') { const no = swimRefusal(sim, person); if (no) return no; }
  if (action === 'court') { const no = courtRefusal(sim, person); if (no) return no; }
  if (action === 'outside') { const no = outsideRefusal(sim, person, LOOKING_AFTER.outside.minutes); if (no) return no; }
  if (action === 'boat') { const no = outingRefusal(sim, person) ?? fineWeatherRefusal(sim, person, 'go out on the water', SITTING_MET, LOOKING_AFTER.boat.minutes); if (no) return no; }
  if (action === 'charter') { const no = charterRefusal(sim, person) ?? fineWeatherRefusal(sim, person, 'go out on the water', SITTING_MET, LOOKING_AFTER.charter.minutes); if (no) return no; }
  if (action === 'laundry' && washableDirty(sim, person).length === 0) return 'Your clothes are all clean.';
  if (action === 'laundry' && !person.home) return 'You have nowhere to keep clothes.';
  if (action === 'laundry' && !detergentFor(sim, person, Math.ceil(washableDirty(sim, person).length / GARMENTS_PER_LOAD))) return 'There isn’t enough laundry detergent at home for it.';
  if (action === 'tidy' && !(atHome(person) && place?.keeps)) return 'It isn’t your place to clean.';
  if (action === 'tidy' && livingOf(person).tidy >= 90) return 'The place is clean.';
  if (action === 'washup' && !(atHome(person) && place?.keeps)) return 'It isn’t your sink.';
  if (action === 'washup' && !livingOf(person).dishes) return 'There’s nothing to wash up.';
  if (action === 'washup' && !dishSoapFor(sim, person, 1, false)) return 'There’s no dish soap at home.';
  if (action === 'mow') { const lawn = atHome(person) ? homeLawn(person) : undefined; if (!lawn) return 'There’s no lawn of yours here.'; if (lawn.cm < MOWN_CM + 1) return 'It’s cut.'; }
  const end = sim.now + minutesFor(sim, action) * 60_000;
  const clash = sim.timeline.between(sim.now, end).find((i) => i.requiresPlayer === true);
  if (clash) return `${clash.label} is at ${formatTime(clash.at, sim.zone)}, and there isn’t time.`;
  return undefined;
}

/**
 * What a workout builds: 0.6 fitness at readiness 75, less for training
 * tired, hungry or stretched, and up to 0.72 at a hundred. Readiness is read
 * through `focusOf` too, by the audition's booking roll and by the craft a
 * class, a lab or a day of work builds; this said until 2026-09-27 that a
 * workout was the one thing that read it.
 */
export function workoutBuilds(person: Person): number {
  return WORKOUT_FITNESS * remap(readiness(person), 0, 100, 0.4, 1.2);
}

/** What a workout costs in energy: 10 at fitness fifty, 15 at nought and 5 at a hundred. */
export function workoutCosts(person: Person): number {
  return WORKOUT_ENERGY * remap(person.wellbeing.fitness, 0, 100, 1.5, 0.5);
}

/**
 * What each one does to the dials, once its time has been lived.
 *
 * A meal and a shower help the mood by what they put back, so a meal you
 * needed lifts it and a snack on a full stomach barely does. A workout raises
 * fitness no higher than a body that age can reach, and costs what an hour of
 * training costs: energy, food and a shower's worth of sweat.
 */
export function applyLookingAfter(person: Person, action: LookAfter, at?: number, training = 1, comfort = 1): void {
  const w = person.wellbeing;
  // Somebody who loves what they're doing gets more of the mood and the
  // relief out of it, and nothing else (`systems/enjoyment.ts`).
  const loved = lovedIn(person, action).length > 0;
  const swing = personalityOf(person, 'moraleSwing') * (loved ? LOVED_MOOD : 1);
  const relief = loved ? LOVED_RELIEF : 1;
  if (action === 'eat' || action === 'order') {
    const eaten = Math.min(MEAL, 100 - w.nourishment);
    w.nourishment = clamp(w.nourishment + eaten, 0, 100);
    // Ordered in: a restaurant's meal (`content/body.ts`).
    if (action === 'order') eatsOut(person);
    w.morale = clamp(w.morale + eaten * 0.04 * swing, 0, 100);
  } else if (action === 'wash' || action === 'bathe') {
    const washed = 100 - (w.hygiene ?? 80);
    w.hygiene = 100;
    w.stress = clamp(w.stress - washed * 0.1 - (action === 'bathe' ? BATH_RELIEF * personalityOf(person, 'stressRecovery') * relief : 0), 0, 100);
  } else if (action === 'laundry' || action === 'washup') {
    // The clothes are the wardrobe's (`doLaundry`); the chore itself does nothing to the dials.
  } else if (action === 'tidy') {
    livingOf(person).tidy = 100;
    w.morale = clamp(w.morale + 2 * swing, 0, 100);
  } else if (action === 'outside' || action === 'boat' || action === 'charter' || action === 'trail') {
    // Time outside in fine weather does more for the mood than an hour indoors, in less of it; an afternoon on the water or the trail is taken as the same, SLATE's estimate.
    w.stress = clamp(w.stress - 12 * personalityOf(person, 'stressRecovery') * relief, 0, 100);
    w.morale = clamp(w.morale + 5 * swing, 0, 100);
  } else if (action === 'exercise' || action === 'swim' || action === 'ride' || action === 'court' || action === 'dance') {
    const ceiling = at === undefined ? 100 : ceilingAt(yearsSince(person.birthInstant, at)).fitness;
    // A gym builds more than a workout at home with nothing (`trainingAt` in `systems/dwelling.ts`).
    const builds = workoutBuilds(person) * training;
    const costs = workoutCosts(person);
    if (w.fitness < ceiling) w.fitness = Math.min(w.fitness + builds, ceiling);
    w.energy = clamp(w.energy - costs, 0, 100);
    w.nourishment = clamp(w.nourishment - 6, 0, 100);
    w.hygiene = clamp((w.hygiene ?? 80) - 20 * personalityOf(person, 'hygieneDrift'), 0, 100);
    w.stress = clamp(w.stress - 8 * personalityOf(person, 'stressRecovery') * relief, 0, 100);
    w.morale = clamp(w.morale + (action === 'swim' ? 5 : 3) * swing, 0, 100);
  } else {
    // Unwinding, less on the floor of an empty home with no sofa (`comfort`, `systems/furniture.ts`).
    w.stress = clamp(w.stress - 10 * personalityOf(person, 'stressRecovery') * relief * comfort, 0, 100);
    w.morale = clamp(w.morale + 3 * swing * comfort, 0, 100);
  }
}

// ---------------------------------------------------------------------------
// Sleep
// ---------------------------------------------------------------------------

export function startOfLocalDay(sim: Simulation, at = sim.now): number {
  const p = zonedParts(at, sim.homeZone);
  return instantFromZoned({ year: p.year, month: p.month, day: p.day }, sim.homeZone);
}

/**
 * 0-1 quality of a night's sleep, from the stress, the person and the hour.
 *
 * The house used to add to it, by its condition. The house is gone, and the
 * base is what a night in it gave on the first morning, so taking it out did
 * not make every night worse.
 */
export function sleepQuality(sim: Simulation, person: Person, at = sim.now): number {
  return nightParts(sim, person, at).quality;
}

/**
 * What goes into a night's quality, piece by piece, so the suggestion can say
 * which piece is costing the hours.
 */
function nightParts(sim: Simulation, person: Person, at = sim.now): {
  stressLoss: number; depth: number; late: number; sofa: number; worn: number; heat: number; jet: number; quality: number;
} {
  const stressLoss = remap(person.wellbeing.stress, 0, 100, 0, 0.24);
  // A light sleeper and a night owl both lose here; somebody who can sleep
  // anywhere gains it back.
  const depth = personalityOf(person, 'sleepQuality');
  const hour = zonedParts(at, sim.zone).hour;
  // Going to bed very late: from one to five by the clock, and an hour or more
  // after the day began. A day whose clocks skipped midnight begins at one, and
  // its first hour is the first hour after midnight. On every other day the
  // clock reads one only once an hour has gone, so the second half changes
  // nothing there. In Havana, Santiago, the Azores, Beirut and Cairo the night
  // nobody chose into the day of the jump starts at that day's first instant,
  // and was read as a bedtime at one, 0.08 poorer. On autopilot, from a save
  // begun three days before, that cost 0.52 condition and 0.93 morale, which
  // took 21 and 24 days to come back; on a save already at its ceilings, 0.18
  // to 0.44 condition for one to six mornings.
  const late = hour >= 1 && hour < 5 && at - startOfDay(at, sim.zone) >= MS_HOUR ? 0.08 : 0;
  // And a friend's sofa after an eviction sleeps worse than a bed of your own
  // (`systems/household.ts`), by what a late bedtime costs.
  // A friend's sofa, at home after an eviction or away when a sublet couldn't be paid.
  // And the floor of an empty home of their own with no bed (`systems/furniture.ts`, from 2026-09-29), the same.
  const sofa = (person.home?.kind === 'sofa' && atHome(person)) || (!atHome(person) && person.stay?.kind === 'sofa' && person.stay.cityId === person.currentLocationId) || (atHome(person) && onTheFloor(person)) ? 0.08 : 0;
  // And their own mattress past its years, at home (`systems/furniture.ts`, from 2026-09-30).
  const worn = atHome(person) && owns(person, 'bed') && mattressWorn(person, at) ? WORN_NIGHT : 0;
  // And a hot night with no air conditioning, or only units (`systems/dwelling.ts`).
  const heat = heatLoss(sim, person, at);
  // And a body whose clock a journey left hours out (`systems/jetlag.ts`, from 2026-09-29).
  const jet = jetLagLoss(person, at);
  return { stressLoss, depth, late, sofa, worn, heat, jet, quality: clamp((0.82 - stressLoss) * depth - late - sofa - worn - heat - jet, 0.28, 1) };
}

export function applySleep(
  person: Person, hours: number, quality: number, at?: number,
  bedtime: Pick<Wellbeing, 'condition' | 'morale' | 'fitness'> = person.wellbeing,
): void {
  const w = person.wellbeing;
  // Copied, because the default is the dials themselves and the night below
  // moves them: read live, the mood's pull read a condition already mended.
  const began = { condition: bedtime.condition, morale: bedtime.morale, fitness: bedtime.fitness };
  const mends = mendsTo(person, at, began.fitness);
  // A night puts back less at sixty than it did at twenty. This is the first
  // thing about ageing anybody notices, so it is the first thing the game
  // does with it.
  const years = at === undefined ? 0 : yearsSince(person.birthInstant, at);
  const banked = at === undefined ? 1 : recoveryFactorAt(years);
  const effective = hours * quality;

  // And a night puts back less when there is a debt behind it. Without this,
  // energy had no memory at all — one night refilled it whatever the last three
  // months had been — so the debt was the only dial that carried anything and it
  // barely reaches `readiness`. The drain side of this coupling was already
  // declared and measured dead; this is the half that makes both of them bite.
  const owing = 1 - Math.min(DEBT_HOLDS, (w.sleepDebt / 30) * DEBT_HOLDS);
  // A worn body gets less back from the same night: a fifth less at condition
  // nought, nothing less at what rest can mend it to (`mendsTo`). Worn is
  // measured against that, not against a hundred: read against a hundred it
  // charged age twice, since `banked` already has, and a light sleeper of
  // sixty with a plan at half past midnight every night fell from 87.0 to
  // 78.4 condition within the year, where without the plan they held. And a
  // low mood clears less of the day's stress: a quarter less at nought, and
  // a sixth more at a hundred. Both are read as the night began (`began`): a
  // chosen night is paid at its wake, and a midnight inside it has moved
  // condition by then.
  const worn = remap(Math.min(1, began.condition / mends), 0, 1, 0.8, 1);
  const settled = remap(began.morale, 0, 100, 0.75, 1.15);
  // A night away from home puts back what a homebody's own bed would less, and a restless one's more.
  const away = person.home !== undefined && !atHome(person) ? personalityOf(person, 'awayRecovery') : 1;
  w.energy = clamp(w.energy + effective * 13.5 * banked * personalityOf(person, 'energyRecovery') * away * owing * worn, 0, 100);
  // Debt clears with the whole night, not only with the part of it above five
  // and a half hours.
  w.sleepDebt = Math.max(0, w.sleepDebt - Math.max(0, effective - 5.5) * 2.2 - effective * 1.4);
  // A night under six hours adds 1.35 hours of debt for every hour it falls
  // short. Past the ceiling waking runs the debt up to, it adds that once and
  // no more. Short night after short night added it on top every time once
  // nothing pulled the debt back to sixty: the midnight lump had, then the
  // first waking second did until waking was made to hold debt rather than
  // lower it, and after that three-hour nights left 191.7 owed by the
  // ninetieth.
  if (hours < 6) {
    const short = (6 - hours) * 1.35;
    w.sleepDebt = Math.min(w.sleepDebt + short, Math.max(w.sleepDebt, DEBT_CEILING + short));
  }
  w.stress = clamp(w.stress - effective * 4.2 * settled, 0, 100);
  // Proportional, not a step. Five hours of real rest is break-even; more
  // than that helps, less costs.
  const restful = effective - 5;
  // And a good night still cannot take a body above what a body that age can
  // reach. The daily clamp is not enough on its own: a chosen night runs after it.
  // Nor past what the body's fitness lets rest mend it to (`mendsTo`), though
  // a body already past that isn't pulled down to it by a good night.
  const ceiling = at === undefined ? 100 : ceilingAt(years).condition;
  const mended = restful <= 0 ? w.condition + restful * 0.9
    : w.condition >= mends ? w.condition
      : Math.min(w.condition + restful * 0.9 * banked, mends);
  w.condition = clamp(Math.min(mended, ceiling), 0, 100);
  // How far a night moves the mood, either way, is the person's as much as
  // the night's: an even temper takes the edge off both.
  w.morale = clamp(w.morale + restful * 1.6 * (restful > 0 ? banked : 1) * personalityOf(person, 'moraleSwing'), 0, 100);
  // And a night brings the mood back towards where the body has it settle
  // (`moraleSettlesAt`), a third of the way for a full eight hours and less
  // for less, so a nap can't be used to reset it.
  const back = MORALE_RETURNS * Math.min(1, hours / 8);
  w.morale = clamp(w.morale + (moraleSettlesAt(person, began.condition, at) - w.morale) * back, 0, 100);
  w.nourishment = clamp(w.nourishment - hours * 1.6, 0, 100);
}

/** Whole years between two instants. */
function yearsSince(birthInstant: number, at: number): number {
  return Math.max(0, (at - birthInstant) / (365.2425 * MS_DAY));
}

// ---------------------------------------------------------------------------
// The day
// ---------------------------------------------------------------------------

/**
 * What living on autopilot tops out at. A player who actually manages sleep
 * and downtime should always be able to do better than these.
 */
const COASTING_ENERGY_CEILING = 74;
const COASTING_STRESS_FLOOR = 14;
/**
 * What an unattended day eats up to.
 *
 * There is no pantry and no shop: a coasted day feeds itself, and since the
 * household it pays for it, a day's groceries at midnight (`buyTheDaysFood`),
 * or eats thin when it can't. It
 * feeds itself before the day runs rather than after it, because a day that
 * drains hunger from a full plate is a day somebody ate; one that tops the
 * number up at midnight is a day they starved and then were handed a meal,
 * and the difference is condition and morale.
 */
const COASTING_NOURISHMENT_TARGET = 76;

/** Runs once per local day: bodies move toward their age. */
export function dailyRollover(sim: Simulation): void {
  const player = sim.universe.people[sim.universe.playerId];
  if (!player) return;

  for (const person of Object.values(sim.universe.people)) {
    settleTheBody(person, sim.now);
    // The day just gone on the scale: what it ate against what it spent (`systems/body.ts`).
    bodyOf(sim, person);
    bodyDay(person, sim.now);
    if (person.id === sim.universe.playerId) starvedPastTheLimit(sim, person);
  }

  // After the drift, so a night paid here and one paid at the clock's next
  // stop (`life.night_alone`) read the same body. Moved ahead of it, they
  // didn't, once nights read condition.
  liveTheUnattendedNight(sim);

  sim.emit('world.day_rollover', { date: sim.now });
}

/**
 * A day's drift in the body, at its midnight.
 *
 * Fitness decays without use; condition slowly recovers toward fitness. Both
 * are held under what a body of that age can reach, so a seventy year old
 * with perfect habits is a very fit seventy year old rather than
 * indistinguishable from a very fit twenty five year old.
 *
 * Fitness had no writer that raised it until Work Out (`applyLookingAfter`).
 * It fell 0.18 a day all the way to nought, so a year on autopilot ended at
 * fitness 0; it stops at what an everyday life of stairs and walking keeps,
 * `EVERYDAY_FITNESS`, now. What it decides is how far a night can mend
 * condition (`mendsTo`).
 */
export function settleTheBody(person: Person, at: number): void {
  const w = person.wellbeing;
  const ceiling = ceilingAt(yearsSince(person.birthInstant, at));
  const fell = w.fitness > EVERYDAY_FITNESS ? Math.max(EVERYDAY_FITNESS, w.fitness - 0.18) : w.fitness;
  w.fitness = clamp(Math.min(fell, ceiling.fitness), 0, 100);
  // Toward what the fitness supports, which is what a night mends to
  // (`mendsTo`). Until 2026-09-27 it drifted toward 60 + 0.4 fitness, 74 at
  // an everyday fitness against the nights' 91, and a body as sound as rest
  // could make it was pulled down every midnight.
  const target = mendsTo(person, at);
  w.condition = clamp(Math.min(w.condition + (target - w.condition) * 0.02, ceiling.condition), 0, 100);
}

/**
 * People sleep whether or not anybody tells them to.
 *
 * The player directing a night's sleep is always better than this: they choose
 * the hours, and they get the full benefit. But a character who is simply
 * carried forward by the clock — which is what Skip To Event and a long jump
 * both do — must not stay ruined forever. A default night is a mediocre night,
 * not a free one.
 *
 * This used to live the whole day as well, charging the waking hours ahead in
 * one lump; the clock charges those as it moves now (`chargeWakingHours`), so
 * midnight keeps only the night, the meals and the shower. Whether the night
 * is slept is `sleepAlone`'s to say.
 */
function liveTheUnattendedNight(sim: Simulation): void {
  for (const person of Object.values(sim.universe.people)) {
    const w = person.wellbeing;
    // The night first, so the meals below are the day's. One from midnight
    // paid later, at the clock's next stop (`life.night_alone`) or when the
    // clock goes on from a stop in its first hour, comes ahead of them too
    // (`creditNightAlone`): paid after them, it ate 1.6 an hour of them.
    sleepAlone(sim, person, sim.now);

    // Meals, and a shower, before the day rather than after it. The meals are
    // bought first (`systems/household.ts`), and a day nobody can pay for is
    // eaten thin (`eatWhatThereIs`).
    if (buyTheDaysFood(sim, person)) eatBeforeTheDay(w);
    // A short day eats more where a soup kitchen or a pantry gave some of its meals (`systems/foodhelp.ts`):
    // their share of the day's three on top of what a broke day scrapes together, SLATE's reading.
    else { eatWhatThereIs(w); eatsShort(person, Math.min(1, BODY.shortDay + (person.foodHelp?.today ?? 0) / 3)); }
    // Out of clean clothes, the morning starts less fresh (`systems/dwelling.ts`).
    // The morning's shower uses its soap and shampoo, and the day its toothpaste and deodorant (`systems/hygiene.ts`):
    // without them it starts less fresh.
    const fresh = Math.min(cleanOutfits(sim, person) <= 0 ? WORN_CLOTHES.hygiene : 82, showerUses(sim, person)) - dailyCare(sim, person);
    w.hygiene = clamp(Math.max(w.hygiene ?? 80, fresh), 0, 100);
  }
}

/** The day's meals, which a coasted day eats up to before it runs. */
function eatBeforeTheDay(w: Wellbeing): void {
  w.nourishment = clamp(Math.max(w.nourishment, COASTING_NOURISHMENT_TARGET), 0, 100);
}

/**
 * What a day nobody can pay for eats: what's in the cupboard, a friend's
 * dinner, the cheapest thing going. Enough to start the day, hungry by the
 * late afternoon, and the hungry hours cost condition and mood.
 *
 * It was nothing at first. A café worker in Mosfellsbær left on autopilot ran
 * out of money within months and then ate nothing at all, and condition fell
 * to 2.1 within the year: nobody who runs out of money eats nothing for
 * months.
 */
const BROKE_NOURISHMENT = 40;
function eatWhatThereIs(w: Wellbeing): void {
  w.nourishment = clamp(Math.max(w.nourishment, BROKE_NOURISHMENT), 0, 100);
}

/**
 * The furthest the clock moves with the player there: an hour, which is One
 * Hour on the Advance menu. The live clock never moves more than half an hour
 * at a step (`core/realclock.ts`), even paying back a night the laptop was
 * shut.
 */
const LONGEST_STEP_WITH_THE_PLAYER = MS_HOUR;

/**
 * Puts somebody to bed at `bedtime` for a night nobody chose, when the clock
 * has been sent through it without the player.
 *
 * It used to be given at midnight to anybody with no chosen night in the last
 * twenty hours, whoever was watching, and both ways that went wrong were
 * measured:
 *
 * - A new save had no night on record, so a player still up at its first
 *   midnight saw their character put to bed while they watched: energy went
 *   from 32.5 to 74 at 00:00 and held there until morning.
 * - The midnight after a chosen night is seventeen hours after a seven
 *   o'clock wake, so a week skipped from that morning got its first night at
 *   the second midnight, forty-one hours up, and ran out of energy at twenty
 *   past four in the afternoon of the second day.
 *
 * Twenty hours was a guess at whether the player meant to choose a night
 * later, and midnight cannot tell. How far the player sent the clock can
 * (`Simulation.advancing`). A player who is there moves it a second at a
 * time, or an hour from the Advance menu, keeps the character up with them,
 * and has the Sleep button; a clock sent more than an hour is a night lived
 * without the player, and they sleep it. A live clock never moves more than
 * half an hour at a step, even paying back a night the laptop was shut, so
 * one left running all night with nobody watching keeps them up all night,
 * as a player who is there would.
 *
 * It asked at first for five hours and twenty-four minutes of night ahead of
 * the clock, the floor `unattendedNight` clamps to. A skip that stopped for a plan
 * in the small hours then came in two shorter pieces and neither was slept:
 * somebody on autopilot, sent on to the morning at ten with a plan at three,
 * was at energy 4.0 by seven. Then it asked for more than an hour between the
 * bedtime and where the clock would stop (`Simulation.advancingTo`), and a
 * skip that stopped for something on the stroke of one left them up for the
 * first hour of the night with a player who was not there: the night came
 * at one, late and poorer, and a plan at one every night wore twenty-seven
 * of the seventy-six people the calibration keeps down over a year.
 *
 * So a night is slept alone when somebody is awake at `bedtime`, has had no
 * night since that night's midnight, it is still before a sound sleeper would
 * have woken from it, and the clock was sent more than an hour. Both checks
 * on the record are needed. `lastSleptAt` says a night has been slept since
 * midnight, whether chosen, booked for later or slept alone, and without it
 * each of those is slept again. A night booked further ahead than tonight
 * holds off every night alone until it; nothing in the game books one, since
 * the Sleep dialog puts them to bed now.
 * `awakeSince` cannot say that, because a chosen night that ends on the
 * stroke of midnight and a waking day that starts there, which is what a
 * save from before 88 is given, read the same; tried, such a save left
 * alone lost its first night and was at energy 0 by eleven. It says instead
 * that they are asleep, or that the day they are in is paid for, as a save
 * from before 88's is up to the next midnight; without it such a save
 * skipped from the small hours is put to bed, and the rest of its day is
 * charged twice.
 *
 * The night starts at midnight, or later for somebody the player stayed up
 * with and then left, and from then they are in bed and the clock charges
 * them nothing. It is paid, in full, once the clock has carried them more
 * than an hour into it: at once on a skip to the morning, and on one that
 * stops sooner, when the clock goes on (`nightOwedFrom`). A stop in the first
 * hour does not pay it, or a jump that stopped a minute past midnight would
 * pay a whole night for a minute of one, and a player who kept them up from
 * there would have had it for nothing. Paid late, it is paid as it would
 * have been on time: read at its bedtime, and ahead of the day's meals when
 * it starts at midnight, as the rollover pays it. A player who keeps them up
 * in it, moving the clock themselves, forfeits it, and the next jump starts
 * a night where they are, as for a player who stayed up with them from the
 * start: the time in bed before the stop is charged as time awake. A night
 * already paid is not forfeit: sent on inside it after the player has kept
 * them up, they are back in bed for what is left of it, and the hours kept
 * up are all that keeping them up costs. A night not yet paid was kept owed
 * through that at first, and the next jump paid it whole from midnight, so
 * hours kept up after a stop at half past midnight cost nothing; kept up to
 * half past seven like that every night for a year, thirty of the
 * seventy-six wore down. Then it was forfeit, but the time in bed before the
 * stop was left uncharged as well as unpaid, and the two read the same only
 * where the night that followed reached the 74 a night alone stops at: on a
 * save played on autopilot, where it fell short, kept up to half past six
 * after a stop at half past twelve read 62.53 by six in the evening, where
 * kept up with no stop read 60.86. Charged, all seventy-six read as with no
 * stop in every dial, on both saves, after a stop at half past twelve or a
 * minute to one.
 *
 * Carrying on a jump that a stop in the night's first hour broke off (Go, or
 * Skip It, on what stopped it) is not keeping them up: it is the rest of that
 * jump (`Simulation.advancing`), and the night is what the jump would have
 * made it, paid once the clock is carried an hour into it. The stretch
 * carried on is still the player's, as after a stop later in the night. It
 * was taken for the player's own hour at first, the night was forfeit and
 * started again where the jump was going, late: a skip to half past one with
 * a plan at half past twelve on the way, every night for a year, wore nine of
 * the seventy-six down, where 0e80f13 and the rule at 87 wore none. Carried
 * on as the skip, the plan costs the hour they are up for it, and none wear
 * down. A move of an hour or less the player makes afresh, Play, One Hour or
 * Next Event, is their own, and forfeits it.
 *
 * They are up where the clock stops if that comes before the night would end,
 * so a player coming back never finds them in the middle of one. The night
 * was cut there too at first, to the hours the clock had carried them, and
 * the morning the player chose to look in at cost them sleep: skipped to
 * seven every morning for a year, a light sleeper ended at condition 35.8
 * and morale 0. Slept in full, the same year ends at 76.4 and 100, where the
 * rule at 87 left them. So a stop more than an hour in has paid it, and a
 * player who keeps them up from there gets no other night until the next
 * midnight: kept up from a stop at five past one to half past six, they read
 * 27.15 at six in the evening, where the same hours after a stop at half past
 * twelve, whose night is forfeit, read 62.90.
 *
 * Where the night would have ended is kept at every stop (`nightEndsAt`), and
 * whenever the clock is sent on more than an hour before then, they are back
 * in bed until then, and the night is not paid twice. Without that, the night
 * was the one slept and they were up from the stop to the next midnight: a
 * plan at five past one every night wore twenty-one of the seventy-six to
 * nothing over a year. The morning the player had stopped at was at first
 * the one stop left out, a morning they were up from, and a plan at a minute
 * to seven, which the player went on from, left them better off than no
 * plan: at 25.4 energy by the end of the day where no plan left 23.0. Every
 * stop keeps it now, so a stop changes nothing a skip would have done. What
 * it does not undo is the player's own hour: a plan in the last hour before
 * where the skip was going leaves an hour or less to go on, which is the
 * player's, and they are up for it and charged for it, as for One Hour.
 *
 * It is kept through a sleep the player chooses in the middle of it. In a
 * night already paid, the sleep is paid on top: an hour's nap after a plan at
 * half past one left them at 83.7 energy by seven, over the 74 the night alone
 * stops at. Dropped there, the nap left them up from its end to the next
 * midnight. In a night not yet paid, the night is paid after the sleep, from
 * its bedtime, and stops at that ceiling, so it keeps the more of what the
 * two give, not both: an hour's nap after a stop at half past twelve left
 * them at 74 by seven, as with no nap, with the debt, condition and morale a
 * short sleep costs.
 */
function sleepAlone(sim: Simulation, person: Person, bedtime: number): void {
  // A night the clock is past is gone, paid or not, whoever moved it, and
  // whether or not they are asleep in one they chose.
  if (person.nightEndsAt !== undefined && bedtime >= person.nightEndsAt) {
    delete person.nightEndsAt;
    delete person.nightOwedFrom;
  }
  if (person.awakeSince !== undefined && person.awakeSince > bedtime) return;
  // Asked before anything that costs, because live play asks it every second.
  const advance = sim.advancing;
  if (advance === undefined || advance.target - advance.from <= LONGEST_STEP_WITH_THE_PLAYER) {
    const owed = person.nightOwedFrom;
    if (owed === undefined) return;
    if (advance !== undefined && advance.target - advance.sentFrom > LONGEST_STEP_WITH_THE_PLAYER) {
      // Carrying on a jump the player sent through the night, after something
      // in its first hour stopped it: the night is what that jump would have
      // made it, paid once the clock is carried an hour into it and owed until
      // then. The stretch carried on is still the player's, and they are up
      // for it, as after a stop later in the night.
      const until = sim.advancingTo ?? advance.target;
      if (until - owed > LONGEST_STEP_WITH_THE_PLAYER) {
        creditNightAlone(sim, person, owed);
        delete person.nightOwedFrom;
      }
      return;
    }
    // Kept up by the player in a night not yet paid, they are up with the
    // player: it is forfeit, and the next jump starts one where they are. The
    // time in bed before the stop is charged now as time awake, so it reads
    // as for a player who kept them up from the start. A night already paid
    // is theirs, and they go back to it.
    person.awakeSince = owed;
    chargeWakingHours(person, owed, bedtime);
    delete person.nightOwedFrom;
    delete person.nightEndsAt;
    return;
  }
  const until = sim.advancingTo ?? advance.target;

  let ends = person.nightEndsAt;
  if (ends === undefined) {
    const midnight = startOfLocalDay(sim, bedtime);
    if (person.lastSleptAt !== undefined && person.lastSleptAt >= midnight) return;
    const { sound } = unattendedNight(person);
    if (bedtime - midnight >= sound * MS_HOUR) return;
    // Asleep until a sound sleeper would wake, which is when the clock starts
    // charging them again. The day is still a sound sleeper's day: taking the
    // lie-in out of the waking hours as well left a poor sleeper better rested
    // than anybody.
    ends = bedtime + Math.round(sound * MS_HOUR);
    person.nightOwedFrom = bedtime;
  }

  const owed = person.nightOwedFrom;
  if (owed !== undefined && until - owed > LONGEST_STEP_WITH_THE_PLAYER) {
    creditNightAlone(sim, person, owed);
    delete person.nightOwedFrom;
  } else {
    // In bed and not paid for it, a save from before 88 is not woken either:
    // it keeps the debt it woke with, rather than counting its hours up from
    // the stop and draining as if it had woken owing the whole day's.
    person.wokeWithDebt = debtWokenWith(person, bedtime);
  }
  person.awakeSince = Math.min(ends, until);
  if (until < ends) person.nightEndsAt = ends;
  else delete person.nightEndsAt;
}

/** Pays a night nobody chose, once and in full, as it would have been at `bedtime`. */
function creditNightAlone(sim: Simulation, person: Person, bedtime: number): void {
  const w = person.wellbeing;
  const energy = w.energy;
  // A night they did not plan. Shorter, poorer, and it does not clear debt
  // the way a deliberate one does.
  applySleep(person, unattendedNight(person).hours, sleepQuality(sim, person, bedtime) * 0.95, bedtime);
  person.wokeWithDebt = w.sleepDebt;
  person.lastSleptAt = bedtime;
  // A night from midnight is the one the day's meals come after, when it is
  // paid late as well.
  // Only a day whose food was bought, though (`systems/household.ts`).
  if (bedtime === startOfLocalDay(sim, bedtime)) {
    if (fedOn(person, bedtime)) eatBeforeTheDay(w);
    else eatWhatThereIs(w);
  }

  // Coasting keeps you going; it does not get you to your best. Choosing
  // when and how long to sleep is worth something, so autopilot stops
  // short of what a deliberate night reaches. The ceiling is on what the
  // night gives: somebody already over it keeps what they had.
  w.energy = Math.min(w.energy, Math.max(energy, COASTING_ENERGY_CEILING));
  w.stress = Math.max(w.stress, COASTING_STRESS_FLOOR);
}

/**
 * How long a night nobody planned lasts: what a sound sleeper would get at this
 * stress, and what this person actually spends in bed.
 *
 * Somebody whose nights put back less, from sleeping badly or from recovering
 * badly, lies in longer when nobody is waking them, and still does not make
 * all of it up: the square root splits the difference, so the trait costs
 * something on autopilot too without wearing a life down to nothing. A good
 * sleeper's night is not cut short for it.
 */
export function unattendedNight(person: Person): { sound: number; hours: number } {
  const sound = clamp(7.8 - person.wellbeing.stress * 0.012, 5.4, 8.4);
  const lieIn = Math.sqrt(
    Math.min(1, personalityOf(person, 'sleepQuality')) * Math.min(1, personalityOf(person, 'energyRecovery')),
  );
  return { sound, hours: clamp(sound / lieIn, 5.4, 10) };
}

/**
 * Whether a sleep of `hours` from now would be taken for tonight's night
 * though it is a short one, under the six hours `applySleep` counts short.
 *
 * A sleep the player chooses is on record as the night of the day it ends in
 * (`lastSleptAt`), and no night nobody chose follows it that day. One that
 * ends in the small hours, before a sound sleeper would be up, of a night not
 * yet slept, is that night, and they are up from its end: the clock never puts
 * them back to bed after it. The Sleep dialog says so, because its own
 * suggestion can be one. Three hours at half past eleven before a call at
 * three, as it suggests, left them at energy 10.9 and a debt of 13.15 by
 * eleven the next evening, where sending the clock on instead left 28.4 and
 * 5.17. It asked at first for anything shorter than the night nobody chose,
 * and the dialog said it of its own full night for a good sleeper: seven or
 * seven and a half hours from eleven, against a night alone of 7.65.
 *
 * A sleep chosen inside a night nobody chose that is under way is not said to
 * be one. Sent on after it, that night is paid: on top of the sleep when it
 * was paid already, and after it, keeping the more of the two, when it was
 * not (`sleepAlone`). Kept up by the player after it instead, a night not yet
 * paid is forfeit and the sleep was the night, and the dialog cannot know
 * which the player will do.
 */
export function sleepStandsForTheNight(sim: Simulation, hours: number): boolean {
  const person = sim.player;
  const wakes = sim.now + Math.round(clamp(hours, 0.5, 16) * MS_HOUR);
  const midnight = startOfLocalDay(sim, wakes);
  if (person.lastSleptAt !== undefined && person.lastSleptAt >= midnight) return false;
  if (person.nightEndsAt !== undefined && sim.now < person.nightEndsAt) return false;
  return wakes - midnight < unattendedNight(person).sound * MS_HOUR && hours < 6;
}

/** How many hours until the player must be somewhere. */
export function hoursUntilNextCommitment(sim: Simulation): number | undefined {
  const next = sim.timeline.next(sim.now, (i) => i.requiresPlayer === true);
  if (!next) return undefined;
  return (next.at - sim.now) / MS_HOUR;
}

/**
 * The rest a normal night gives, counted in hours of sound sleep: eight hours
 * at the quality a calm person with nothing unusual about their sleep gets.
 *
 * It was set as what a night had to put back for a day to be paid for, when
 * the midnight rollover charged every day twenty-four waking hours: 88.6
 * energy against 72. A day is charged the hours actually awake now, and a
 * sixteen-hour day costs a calm twenty-five-year-old 48 energy and 5.4 hours
 * of debt, so energy no longer sets it; condition and mood do, which a night
 * holds above five hours of this rest. It stayed at eight hours. Measured on
 * that person to bed at eleven for sixty nights of a fixed length, six and a
 * half hours still held and six did not: condition fell to 79.7 and morale to
 * 59.3. The night nobody planned, about 5.9 of these for the same person, has
 * to stay short of the one the game suggests.
 */
const A_NORMAL_NIGHT = 8 * 0.82;

/** The waking day a normal night pays for: the twenty-four hours less the eight. */
const A_NORMAL_DAY = 16;

/**
 * The sleep debt a normal day has put on the books by bedtime. A normal night
 * pays it back with room to spare, so only debt past it asks for a longer
 * one. While the day was charged at midnight, the debt at an eleven o'clock
 * bedtime was zero; charged as the clock moves, it is 5.4 after a day up from
 * seven, and counting all of it asked for eight and a half hours after every
 * ordinary day and called it "carrying some sleep debt".
 */
export const A_NORMAL_DAYS_DEBT = A_NORMAL_DAY * DEBT_PER_WAKING_HOUR;

/** The longest night the Sleep dialog offers, and so the most a suggestion asks. */
const LONGEST_NIGHT = 14;

/**
 * A sensible default bedtime given tomorrow's first commitment.
 *
 * Counted in rest, not in hours. What a night puts back is its hours times how
 * well this person sleeps tonight, times how much an hour of it restores them,
 * times what their age still lets a night do, the same three things a night
 * is paid in. So somebody stressed, a light sleeper, somebody who never quite
 * recovers or somebody older needs longer in bed for the same night.
 * Seven and a half hours, plus a little for any debt, used to be the advice
 * for everybody: it sat under what a day costs, and a player who took it every
 * night wore down.
 */
export function suggestedSleep(sim: Simulation): { hours: number; reason: string } {
  const next = sim.timeline.next(sim.now, (i) => i.requiresPlayer === true);
  const person = sim.player;
  const owed = Math.max(0, person.wellbeing.sleepDebt - A_NORMAL_DAYS_DEBT);
  const night = nightParts(sim, person);
  const restores = personalityOf(person, 'energyRecovery');
  const age = recoveryFactorAt(yearsSince(person.birthInstant, sim.now));
  // A night pays for the waking day beside it, and the longer the night, the
  // shorter that day: an hour asleep is an hour nobody is charged for being
  // awake. So the night is solved for, with each waking hour owed the share of
  // a normal night that a normal day's hour is. Counted against a fixed day,
  // as it was while the rollover charged twenty-four hours whatever the night,
  // it asked an eighty-one-year-old for fourteen hours, which put back nearly
  // three times the ten hours awake beside them, and said fourteen were not
  // enough.
  const perWakingHour = A_NORMAL_NIGHT / A_NORMAL_DAY;
  const needed = (24 * perWakingHour + owed * 0.1) / (night.quality * restores * age + perWakingHour);
  const ideal = clamp(needed, 6, LONGEST_NIGHT);
  const hours = Math.round(ideal * 2) / 2;
  const why = sleepReason({ night, restores, age, owed, hours, needed });
  if (!next) {
    return { hours, reason: needed > LONGEST_NIGHT ? why : 'Your calendar’s clear, so sleep as long as you need.' };
  }

  // An hour and a half kept back to get up and get there. The reason says how far off it is, which it said
  // less that hour and a half until 2026-09-27.
  const away = (next.at - sim.now) / MS_HOUR;
  const available = away - 1.5;
  if (available < ideal) {
    // What's left before it, to the half hour below, and half an hour at the
    // least. Until 2026-09-28 it was never under three hours, which with a
    // call four hours off slept straight through it: an actor jet-lagged in
    // London, in bed at four for a seven o'clock call, was fired on the day.
    return {
      hours: Math.max(0.5, Math.floor(available * 2) / 2),
      reason: `"${next.label}" is in ${away.toFixed(1)} hours, and getting up and there takes an hour and a half, so a full night isn’t available.`,
    };
  }
  return { hours, reason: why };
}

/**
 * Why tonight wants the hours it does: the thing that stretched the night
 * furthest, said as that thing, and a normal night when nothing did.
 */
function sleepReason(tonight: {
  night: ReturnType<typeof nightParts>; restores: number; age: number;
  owed: number; hours: number; needed: number;
}): string {
  const { night, restores, age, owed, hours, needed } = tonight;
  if (needed > LONGEST_NIGHT) {
    return night.late > 0
      ? 'Going to bed this late, not even fourteen hours makes up a whole day. An earlier night would.'
      : 'Not even fourteen hours makes up a whole day for you tonight.';
  }
  if (owed > 8) return 'You’re carrying real sleep debt.';
  if (hours <= 8) return 'A normal night.';
  const calm = 0.82 - night.stressLoss;
  // How much of a night each thing takes away, as the share left: the smallest
  // is the one that stretched it.
  const costs: [number, string][] = [
    [A_NORMAL_NIGHT / (A_NORMAL_NIGHT + owed * 0.1), 'You’re carrying some sleep debt, so a normal night takes longer.'],
    [calm / 0.82, 'Stress is costing you sleep, so a normal night takes longer.'],
    [night.depth, 'You don’t sleep deeply, so a normal night takes longer.'],
    [night.late > 0 ? 1 - night.late / (calm * night.depth) : 1, 'It’s late, and a night that starts now is a worse one, so it takes longer.'],
    [night.sofa > 0 ? 1 - night.sofa / (calm * night.depth) : 1, 'A night on a sofa is a worse one, so it takes longer.'],
    [night.worn > 0 ? 1 - night.worn / (calm * night.depth) : 1, 'Your mattress is worn out, so a night sleeps worse and takes longer.'],
    [night.heat > 0 ? 1 - night.heat / (calm * night.depth) : 1, 'It’s a hot night, and without air conditioning it sleeps worse, so it takes longer.'],
    [night.jet > 0 ? 1 - night.jet / (calm * night.depth) : 1, 'Your body is still on another clock, so a night sleeps worse and takes longer.'],
    [restores, 'A night puts back less for you than for most, so it takes longer.'],
    [age, 'A night puts back less than it used to, so it takes longer.'],
  ];
  const [share, said] = costs.reduce((worst, one) => (one[0] < worst[0] ? one : worst));
  return share < 1 ? said : 'A normal night.';
}
