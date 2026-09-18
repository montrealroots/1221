/**
 * SLATE — Wellbeing and sleep.
 *
 * What is left of daily life. The activities, the meals, the kitchen and the
 * people you did them with are gone; the part Home still reads is here — how
 * a character is, how the passage of time changes it, and the one interaction
 * that still moves the clock on purpose.
 *
 * A day in SLATE is still a budget of hours. Sleeping is a real interaction
 * that advances the world, and time that passes unattended costs something.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person, Wellbeing } from '../domain/model';
import { clamp, remap } from '../core/rng';
import { addDays, instantFromZoned, zonedParts, MS_HOUR, MS_DAY } from '../core/time';
import { modifierFor } from '../domain/attributes';
import { dispositionOf } from '../core/taste';
import {
  LONGEST_SESSION_HOURS, TRAINING_AN_HOUR, ceilingAt, recoveryFactorAt,
} from '../content/lifespan';
import { driftBonds, moralePullOf } from '../world/standing';
import { whatHasThem } from '../world/diary';
import {
  A_WORKING_WEEK, FORGETTING, RELIABILITY_HEALS_A_DAY, RELIABILITY_RESTS_AT, TALKED_ABOUT,
} from '../content/audition';
import { WEAR_A_DAY } from '../content/estate';

// ---------------------------------------------------------------------------
// Wellbeing model
// ---------------------------------------------------------------------------

/** Hourly drain applied while awake. */
export const ENERGY_DRAIN_PER_HOUR = 3.0;
/**
 * How fast somebody gets hungry while awake, per hour.
 *
 * Calibrated against what a year of it costs: a little over three meals a
 * day, which is what one person feeding themselves actually eats.
 */
export const NOURISHMENT_DRAIN_PER_HOUR = 2.0;

/**
 * The energy below which training costs more than it gives.
 *
 * A real refusal rather than a defensive one: a session on an empty tank adds
 * stress, adds sleep debt and puts nothing back, so the game says so instead of
 * taking the hours and charging for them.
 */
export const TOO_SPENT_TO_TRAIN = 20;

export function freshWellbeing(): Wellbeing {
  return {
    energy: 82, stress: 18, sleepDebt: 0, morale: 62,
    condition: 88, fitness: 50, nourishment: 75, hygiene: 80,
  };
}

/** One of this person's personality knobs, or 1 when they hold nothing that touches it. */
export function personalityOf(person: Person, key: string): number {
  return dispositionOf(person, key);
}

/**
 * Applies the passage of time to a person's condition. Called by the day
 * rollover rather than by individual actions, so it stays consistent whether
 * an hour passed by playing or by skipping.
 */
export function applyElapsedWellbeing(person: Person, hours: number, opts: { asleep?: boolean } = {}): void {
  const w = person.wellbeing;
  if (opts.asleep) return;

  const traitDrain = modifierFor(person, 'stressPerShootDay') * personalityOf(person, 'stressGain');
  w.energy = clamp(w.energy - ENERGY_DRAIN_PER_HOUR * hours * (1 + (w.sleepDebt / 24) * 0.5), 0, 100);
  w.nourishment = clamp(w.nourishment - NOURISHMENT_DRAIN_PER_HOUR * hours, 0, 100);
  w.sleepDebt = Math.min(60, w.sleepDebt + hours * 0.34);

  // Running on empty costs you.
  if (w.energy < 15) w.stress = clamp(w.stress + hours * 1.6 * traitDrain, 0, 100);
  if (w.nourishment < 20) {
    w.condition = clamp(w.condition - hours * 0.5, 0, 100);
    w.morale = clamp(w.morale - hours * 0.7, 0, 100);
  }
  if (w.stress > 75) w.condition = clamp(w.condition - hours * 0.25, 0, 100);

  const recovery = modifierFor(person, 'recoveryRate') * personalityOf(person, 'stressRecovery');
  w.stress = clamp(w.stress - hours * 0.35 * recovery, 0, 100);

  w.hygiene = clamp((w.hygiene ?? 80) - hours * 1.6, 0, 100);
}

/**
 * A single 0-100 readiness number: how well is this person going to perform
 * right now?
 */
export function readiness(person: Person): number {
  const w = person.wellbeing;
  const energyPart = remap(w.energy, 0, 100, 0.45, 1.15);
  const stressPart = remap(w.stress, 0, 100, 1.12, 0.62);
  const debtPart = remap(w.sleepDebt, 0, 30, 1.05, 0.66);
  const nourishPart = remap(w.nourishment, 0, 100, 0.78, 1.05);
  const moralePart = remap(w.morale, 0, 100, 0.82, 1.12);
  // Turning up to a room having not showered in two days is not nothing, but
  // it is not much either: a few points, not a career.
  const cleanPart = remap(w.hygiene ?? 80, 0, 100, 0.92, 1.03);
  return clamp(100 * energyPart * stressPart * debtPart * nourishPart * moralePart * cleanPart / 1.35, 5, 100);
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
  sim.onSchedule('life.day_rollover', () => {
    dailyRollover(sim);
    sim.schedule({
      at: addDays(startOfLocalDay(sim), 1, sim.homeZone),
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
      const wakeAt = start + Math.round(hours * MS_HOUR);

      // Anything scheduled during the night still happens; the world does not
      // pause because the player is unconscious.
      const crossed = s.timeline.between(s.now, wakeAt).filter((i) => i.requiresPlayer === true);

      const quality = sleepQuality(s, person);
      const before = { ...person.wellbeing };

      if (start > s.now) s.advanceTo(start);
      s.emit('life.sleep_started', { personId: person.id, hours, quality });
      s.advanceTo(wakeAt);

      applySleep(person, hours, quality, s.now);
      person.lastSleptAt = s.now;
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

  // --- Keeping in shape ----------------------------------------------------

  /**
   * An hour of working at it, which is the second direction fitness never had.
   *
   * `dailyRollover` takes 0.18 off fitness every day and nothing anywhere put a
   * point back: it reached nought inside the first year of every save and stayed
   * there, which `tools/dials.mjs` reported as the flattest of its seven — "never
   * rises". The same shape as the house, whose condition also had one writer and
   * that writer a subtraction.
   *
   * It costs time rather than money, because time is what the wellbeing model is
   * denominated in. The hours are spent on the clock like any other waking hours,
   * so `applyElapsedWellbeing` charges the energy, the hunger and the sleep debt
   * for them — training is not free and a session on an empty tank is a bad idea
   * the game lets you have and then bills you for.
   *
   * Two refusals, and both are real rather than defensive. Nobody trains with
   * nothing left, and nothing above the age ceiling counts: `ceilingAt` is the most
   * a body of this age can be brought to, and age is the one thing training does
   * not argue with. Saying so is the point — a refusal that names the ceiling tells
   * a player something true about getting older that no other screen says.
   */
  sim.onCommand<{ hours?: number }, { fitness: number; gained: number; ceiling: number }>(
    'life.train',
    (p, { sim: s }) => {
      const person = s.player;
      const hours = clamp(p.hours ?? 1, 0.25, LONGEST_SESSION_HOURS);
      const ceiling = ceilingAt(yearsSince(person.birthInstant, s.now)).fitness;
      const was = person.wellbeing.fitness;

      if (person.wellbeing.energy < TOO_SPENT_TO_TRAIN) {
        throw new CommandError(
          'You have nothing left today. Training on this would cost you more than it gives.',
        );
      }
      if (was >= ceiling) {
        throw new CommandError(
          `You’re at ${Math.round(ceiling)}. That’s as fit as a body your age gets.`,
        );
      }

      s.advanceTo(s.now + Math.round(hours * MS_HOUR));
      const gained = Math.min(hours * TRAINING_AN_HOUR, ceiling - person.wellbeing.fitness);
      person.wellbeing.fitness = clamp(person.wellbeing.fitness + gained, 0, 100);

      s.notify({
        category: 'personal',
        title: gained > 0 ? 'You Put The Work In' : 'Nothing In It Today',
        body: `${hours === 1 ? 'An hour' : `${hours} hours`} of it, and fitness is `
          + `${Math.round(person.wellbeing.fitness)} out of the ${Math.round(ceiling)} a body your `
          + 'age can hold. Condition follows fitness, slowly, so this is the thing a long day '
          + 'finds later.',
        importance: 25,
      });
      return { fitness: person.wellbeing.fitness, gained, ceiling };
    },
  );
}

// ---------------------------------------------------------------------------
// Sleep
// ---------------------------------------------------------------------------

export function startOfLocalDay(sim: Simulation): number {
  const p = zonedParts(sim.now, sim.homeZone);
  return instantFromZoned({ year: p.year, month: p.month, day: p.day }, sim.homeZone);
}

/** 0-1 quality of a night's sleep, from the bed, the stress and the hour. */
export function sleepQuality(sim: Simulation, person: Person): number {
  let quality = 0.72;

  const property = person.residenceId ? sim.universe.properties[person.residenceId] : undefined;
  if (!property) quality -= 0.18;
  else quality += remap(property.condition, 0, 100, -0.12, 0.10);

  quality -= remap(person.wellbeing.stress, 0, 100, 0, 0.24);
  quality += modifierFor(person, 'recoveryRate') * 0.06 - 0.06;
  // A light sleeper and a night owl both lose here; somebody who can sleep
  // anywhere gains it back.
  quality *= personalityOf(person, 'sleepQuality');

  const hour = zonedParts(sim.now, sim.zone).hour;
  if (hour >= 1 && hour < 5) quality -= 0.08; // going to bed very late
  return clamp(quality, 0.28, 1);
}

export function applySleep(person: Person, hours: number, quality: number, at?: number): void {
  const w = person.wellbeing;
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
  const owing = 1 - Math.min(A_WORKING_WEEK.debtHolds,
    (w.sleepDebt / 30) * A_WORKING_WEEK.debtHolds);
  w.energy = clamp(
    w.energy + effective * 13.5 * banked * personalityOf(person, 'energyRecovery') * owing,
    0, 100,
  );
  // Debt clears with the whole night, not only with the part of it above five
  // and a half hours.
  w.sleepDebt = Math.max(0, w.sleepDebt - Math.max(0, effective - 5.5) * 2.2 - effective * 1.4);
  if (hours < 6) w.sleepDebt += (6 - hours) * 1.35;
  w.stress = clamp(w.stress - effective * 4.2, 0, 100);
  // Proportional, not a step. Five hours of real rest is break-even; more
  // than that helps, less costs.
  const restful = effective - 5;
  // And a good night still cannot take a body above what a body that age can
  // reach. The daily clamp is not enough on its own: sleep runs after it.
  const ceiling = at === undefined ? 100 : ceilingAt(years).condition;
  w.condition = clamp(Math.min(w.condition + restful * 0.9 * (restful > 0 ? banked : 1), ceiling), 0, 100);
  w.morale = clamp(w.morale + restful * 1.6 * (restful > 0 ? banked : 1), 0, 100);
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
 * Meals are not modeled any more — there is no pantry, no shop and no money
 * leaving an account for a plate of food — so a coasted day feeds itself. It
 * feeds itself before the day runs rather than after it, because a day that
 * drains hunger from a full plate is a day somebody ate; one that tops the
 * number up at midnight is a day they starved and then were handed a meal,
 * and the difference is condition and morale.
 */
const COASTING_NOURISHMENT_TARGET = 76;

/** What the unattended day accounts for, sleep included. */
const HOURS_IN_A_DAY = 24;

/** Runs once per local day: the home wears, and bodies move toward their age. */
export function dailyRollover(sim: Simulation): void {
  const player = sim.universe.people[sim.universe.playerId];
  if (!player) return;

  // Homes wear. This is one of the two writers of `property.condition` and it
  // is the one that costs nothing; the other is `haveTheWorkDone` in
  // `world/house.ts`, which is what a player spends money to run the other way.
  for (const property of Object.values(sim.universe.properties)) {
    if (property.soldAt) continue;
    property.condition = clamp(property.condition - WEAR_A_DAY, 0, 100);
  }

  // Fitness decays without use; condition slowly recovers toward fitness. Both
  // are held under what a body of that age can reach, so a seventy year old
  // with perfect habits is a very fit seventy year old rather than
  // indistinguishable from a very fit twenty five year old.
  //
  // There is no use for it to decay without, and building one was measured and
  // changes nothing anybody can observe. Crediting fitness on a day the player
  // is on a shoot — plus 0.42 worked against minus 0.18 otherwise, gated on
  // `isPlayer` because this loop walks every person and `whatHasThem` answers
  // about the player whoever is asking — was built and run over five seeds of
  // twenty-five played years. Mean fitness by five-year block moved from 0.0 to
  // anywhere between 2 and 58 depending on the seed, and condition followed it
  // up by as much as 15 points, while every other number in the run stayed
  // identical to the digit: energy, stress, sleep debt, morale, readiness,
  // reliability, the week reliability first read zero, asks, readings, clashes
  // and parts won. The reason is two lines up the file. `readiness` does not
  // read condition, and the only reader of `w.condition` in src outside this
  // file is the dial declared at ui/looks/wellbeing.tsx:37 and read at :47; the
  // suite reads it twice, to assert it is above zero and to compare two seeds.
  // A writer for fitness is a change to a dial until something downstream of
  // condition decides something.
  //
  // Both clamps here are guards no played input trips. Over 27300 player-days
  // on three seeds, `ceiling.fitness` was the binding arm of the first
  // `Math.min` zero times — fitness is above zero for exactly the first 278
  // days of every save and the ceiling never falls below 89.1 — and
  // `ceiling.condition` bound the second zero times as well. For the other 97%
  // of a career this block is `w.fitness` held at nought and `w.condition`
  // pulled toward a constant sixty.
  for (const person of Object.values(sim.universe.people)) {
    const w = person.wellbeing;
    const ceiling = ceilingAt(yearsSince(person.birthInstant, sim.now));
    w.fitness = clamp(Math.min(w.fitness - 0.18, ceiling.fitness), 0, 100);
    const target = Math.min(60 + w.fitness * 0.4, ceiling.condition);
    w.condition = clamp(Math.min(w.condition + (target - w.condition) * 0.02, ceiling.condition), 0, 100);
  }

  // A day of not being in anything, charged to the four dials that only ever rose.
  forgetsYou(sim);

  // A day of neither of you doing anything about it, charged to every bond,
  // and then what the people around you are worth to the person having the day.
  driftBonds(sim.universe, sim.now);
  for (const person of Object.values(sim.universe.people)) {
    const pull = moralePullOf(sim.universe, person.id, person.wellbeing.morale);
    if (pull !== 0) person.wellbeing.morale = clamp(person.wellbeing.morale + pull, 0, 100);
  }

  liveTheUnattendedDay(sim);

  sim.emit('world.day_rollover', { date: sim.now });
}

/**
 * People sleep whether or not anybody tells them to.
 *
 * The player directing a night's sleep is always better than this: they choose
 * the hours, and they get the full benefit. But a character who is simply
 * carried forward by the clock — which is what Skip To Event and a long jump
 * both do — must not stay ruined forever. A default night is a mediocre night,
 * not a free one.
 */
function liveTheUnattendedDay(sim: Simulation): void {
  for (const person of Object.values(sim.universe.people)) {
    const w = person.wellbeing;
    // Whether today is a day somebody else owns. It is the first thing in this
    // game that makes one day different from another, and the reason the whole
    // model was a fixed point until now: the autopilot restores to the same
    // ceiling and the same floor every single day, so seven of these nine dials
    // were constants by day thirty and readiness sat at 49 for five years.
    const on = person.isPlayer ? whatHasThem(sim, sim.now, sim.now + MS_DAY) : undefined;
    // And how far into it today is. Week one of anything is an ordinary week;
    // the last week of a long one is not. A flat working penalty was the first
    // draft and it only moved the fixed point somewhere else — every week cost
    // the same from the first, so a fourteen-week job took a career from
    // sixty-six to nothing and a two-week job cost a tenth of it for no reason.
    const intoIt = on
      ? clamp((sim.now - on.from) / Math.max(MS_DAY, on.to - on.from), 0, 1)
      : 0;

    // A night they did not plan. Shorter, poorer, and it does not clear debt
    // the way a deliberate one does.
    const sinceSlept = person.lastSleptAt === undefined ? Number.POSITIVE_INFINITY : sim.now - person.lastSleptAt;
    let sleptHours = 0;
    if (sinceSlept >= 20 * MS_HOUR) {
      const quality = sleepQuality(sim, person) * 0.95;
      // A night in the middle of a shoot is not a night anybody chose: the call
      // is at six and there is an hour in the chair before it. Short nights are
      // the mechanism rather than a second clamp, because the model already
      // knows what one does — `applySleep` clears less debt from a short night
      // and adds debt below six hours, so a long run declines on its own and
      // goes on declining, which a fixed working ceiling cannot do.
      // The worse of how deep into this job today is and how worn the person
      // already was. `intoIt` resets with every engagement, so on its own it
      // handed somebody who had rested a week and started another twelve-weeker
      // a run of ordinary nights while they were still carrying the last one —
      // and that is why the size of a gap decided almost nothing.
      const worn = on ? Math.min(1, w.sleepDebt / 30) : 0;
      const hard = Math.max(intoIt, worn);
      const hours = clamp(7.8 - w.stress * 0.012 - A_WORKING_WEEK.shorterBy * hard, 5.4, 8.4);
      sleptHours = hours;
      applySleep(person, hours, quality, sim.now);
      person.lastSleptAt = sim.now;

      // Coasting keeps you going; it does not get you to your best. Choosing
      // when and how long to sleep is worth something, so autopilot stops
      // short of what a deliberate night reaches.
      //
      w.energy = Math.min(w.energy, COASTING_ENERGY_CEILING);
      w.stress = Math.max(w.stress, COASTING_STRESS_FLOOR);
    }

    // Meals, and a shower, before the day rather than after it.
    w.nourishment = clamp(Math.max(w.nourishment, COASTING_NOURISHMENT_TARGET), 0, 100);
    w.hygiene = clamp(Math.max(w.hygiene ?? 80, 82), 0, 100);

    // And then the rest of the day happens.
    applyElapsedWellbeing(person, Math.max(0, HOURS_IN_A_DAY - sleptHours));
  }
}

/** How many hours until the player must be somewhere. */
export function hoursUntilNextCommitment(sim: Simulation): number | undefined {
  const next = sim.timeline.next(sim.now, (i) => i.requiresPlayer === true);
  if (!next) return undefined;
  return (next.at - sim.now) / MS_HOUR;
}

/** A sensible default bedtime given tomorrow's first commitment. */
export function suggestedSleep(sim: Simulation): { hours: number; reason: string } {
  const next = sim.timeline.next(sim.now, (i) => i.requiresPlayer === true);
  const debt = sim.player.wellbeing.sleepDebt;
  const ideal = clamp(7.5 + debt * 0.12, 6, 11);
  if (!next) return { hours: Math.round(ideal * 2) / 2, reason: 'Your calendar’s clear, so sleep as long as you need.' };

  const available = (next.at - sim.now) / MS_HOUR - 1.5;
  if (available < ideal) {
    return {
      hours: Math.max(3, Math.round(available * 2) / 2),
      reason: `"${next.label}" is in ${available.toFixed(1)} hours, so a full night isn’t available.`,
    };
  }
  return { hours: Math.round(ideal * 2) / 2, reason: debt > 8 ? 'You’re carrying real sleep debt.' : 'A normal night.' };
}

/**
 * A day of not being in anything, charged to the reputation it was bought with.
 *
 * Four of the seven dials `tools/dials.mjs` reported were "never falls", and they
 * were the same defect four times: `publicFame`, `industryDemand`,
 * `audienceAppeal` and `professionalReputation` rose on every part taken and fell
 * on nothing ever. A number that cannot go down is not a measure of anything —
 * it is a running total of what you have done, printed where a standing should be.
 *
 * `WELL_LIKED`'s own docstring asked for this and said why: the player holds every
 * attribute at the ceiling, so there is no such thing as being bad in something.
 * The one downside available to them is being in nothing. It had no cost.
 *
 * ## The player only, and that is not a special case
 *
 * Everybody else's reputation is a standing the casting office reads, seeded once
 * from a band and never touched again, because they have no tracked career for it
 * to be a record of. Decaying theirs would fade every actor in the world to nought
 * over a quarter of a century and quietly empty the pool the office casts from,
 * which is a worse defect than the one being fixed. The player is the person whose
 * work this game actually follows, so the player is who a career happens to.
 *
 * ## Whole days, anchored, for the reason bonds are
 *
 * `driftBonds` catches up in whole days off `lastDriftedAt` so that a bond cannot
 * drift differently because the player skipped forward in one jump rather than two.
 * The same trap is here and the same answer: anchored to `reputationDriftedAt`, in
 * whole days, so Skip To Event and a long jump cost exactly what living the days
 * would have cost.
 */
export function forgetsYou(sim: Simulation): void {
  const me = sim.universe.people[sim.universe.playerId];
  if (!me) return;
  const since = me.reputationDriftedAt ?? sim.now;
  const days = Math.floor((sim.now - since) / MS_DAY);
  if (days <= 0) {
    me.reputationDriftedAt ??= sim.now;
    return;
  }
  me.reputationDriftedAt = since + days * MS_DAY;

  const rep = me.reputation;
  const aYear = 365.2425;
  for (const [key, points] of Object.entries(FORGETTING)) {
    const was = rep[key as keyof typeof FORGETTING];
    rep[key as keyof typeof FORGETTING] = clamp(was - (points / aYear) * days, 0, 100);
  }
  // And being talked about fades too, slower than it arrives. Nothing about a
  // person should only ever get worse either.
  rep.controversy = clamp(rep.controversy - (TALKED_ABOUT.forgottenAYear / aYear) * days, 0, 100);
  // And a record of turning up heals toward where nobody has a complaint, because
  // you are not unreliable while you are resting. Without this it only ever fell:
  // it moves during a working week alone, three off against one back, and
  // late-career readiness is under `spentAt` almost every week — so it reached
  // nought and stayed there for a third of the game.
  const rest = RELIABILITY_RESTS_AT;
  const remaining = (1 - RELIABILITY_HEALS_A_DAY) ** days;
  rep.reliability = clamp(rest + (rep.reliability - rest) * remaining, 0, 100);
}
