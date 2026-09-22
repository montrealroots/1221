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
import { addDays, formatTime, instantFromZoned, zonedParts, MS_HOUR, MS_DAY } from '../core/time';
import { ceilingAt, recoveryFactorAt } from '../content/lifespan';
import { personalityOf } from './personality';

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
 * Applies the passage of time to a person's condition. Called by the day
 * rollover rather than by individual actions, so it stays consistent whether
 * an hour passed by playing or by skipping.
 */
export function applyElapsedWellbeing(person: Person, hours: number, opts: { asleep?: boolean } = {}): void {
  const w = person.wellbeing;
  if (opts.asleep) return;

  const drain = ENERGY_DRAIN_PER_HOUR * (1 + (w.sleepDebt / 24) * 0.5);
  // The hours of this stretch spent running on empty: all of them if it began
  // there, none if it never got there, and otherwise the ones after it did. A
  // whole day is often applied at once, and charging all of it for ending
  // below the line made one short night cost a day and a half of stress.
  const emptyHours = Math.max(0, hours - Math.max(0, (w.energy - 15) / drain));
  w.energy = clamp(w.energy - drain * hours, 0, 100);
  w.nourishment = clamp(w.nourishment - NOURISHMENT_DRAIN_PER_HOUR * hours, 0, 100);
  w.sleepDebt = Math.min(60, w.sleepDebt + hours * 0.34);

  // Running on empty costs you, and it costs a highly strung or driven person
  // more than an even-tempered one.
  if (emptyHours > 0) w.stress = clamp(w.stress + emptyHours * 1.6 * personalityOf(person, 'stressGain'), 0, 100);
  if (w.nourishment < 20) {
    w.condition = clamp(w.condition - hours * 0.5, 0, 100);
    w.morale = clamp(w.morale - hours * 0.7 * personalityOf(person, 'moraleSwing'), 0, 100);
  }
  if (w.stress > 75) w.condition = clamp(w.condition - hours * 0.25, 0, 100);

  w.stress = clamp(w.stress - hours * 0.35 * personalityOf(person, 'stressRecovery'), 0, 100);

  w.hygiene = clamp((w.hygiene ?? 80) - hours * 1.6 * personalityOf(person, 'hygieneDrift'), 0, 100);
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
      s.remember({
        category: 'life',
        title: hours >= 7 ? 'Slept well' : 'Short night',
        detail: `${hours.toFixed(1)} hours, waking at ${formatTime(s.now, s.zone)}.`,
        refs: [{ type: 'person', id: person.id }],
        significance: 3,
        public: false,
      });

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
}

// ---------------------------------------------------------------------------
// Sleep
// ---------------------------------------------------------------------------

export function startOfLocalDay(sim: Simulation): number {
  const p = zonedParts(sim.now, sim.homeZone);
  return instantFromZoned({ year: p.year, month: p.month, day: p.day }, sim.homeZone);
}

/**
 * 0-1 quality of a night's sleep, from the stress, the person and the hour.
 *
 * The house used to add to it, by its condition. The house is gone, and the
 * base is what a night in it gave on the first morning, so taking it out did
 * not make every night worse.
 */
export function sleepQuality(sim: Simulation, person: Person): number {
  return nightParts(sim, person).quality;
}

/**
 * What goes into a night's quality, piece by piece, so the suggestion can say
 * which piece is costing the hours.
 */
function nightParts(sim: Simulation, person: Person): {
  stressLoss: number; depth: number; late: number; quality: number;
} {
  const stressLoss = remap(person.wellbeing.stress, 0, 100, 0, 0.24);
  // A light sleeper and a night owl both lose here; somebody who can sleep
  // anywhere gains it back.
  const depth = personalityOf(person, 'sleepQuality');
  const hour = zonedParts(sim.now, sim.zone).hour;
  const late = hour >= 1 && hour < 5 ? 0.08 : 0; // going to bed very late
  return { stressLoss, depth, late, quality: clamp((0.82 - stressLoss) * depth - late, 0.28, 1) };
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
  const owing = 1 - Math.min(DEBT_HOLDS, (w.sleepDebt / 30) * DEBT_HOLDS);
  w.energy = clamp(w.energy + effective * 13.5 * banked * personalityOf(person, 'energyRecovery') * owing, 0, 100);
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
  // How far a night moves the mood, either way, is the person's as much as
  // the night's: an even temper takes the edge off both.
  w.morale = clamp(w.morale + restful * 1.6 * (restful > 0 ? banked : 1) * personalityOf(person, 'moraleSwing'), 0, 100);
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

/** Runs once per local day: bodies move toward their age. */
export function dailyRollover(sim: Simulation): void {
  const player = sim.universe.people[sim.universe.playerId];
  if (!player) return;

  // Fitness decays without use; condition slowly recovers toward fitness. Both
  // are held under what a body of that age can reach, so a seventy year old
  // with perfect habits is a very fit seventy year old rather than
  // indistinguishable from a very fit twenty five year old.
  //
  // Fitness has no writer that raises it, and a writer for it would change a
  // dial rather than an outcome until something downstream of condition
  // decides something: `readiness` does not read condition.
  for (const person of Object.values(sim.universe.people)) {
    const w = person.wellbeing;
    const ceiling = ceilingAt(yearsSince(person.birthInstant, sim.now));
    w.fitness = clamp(Math.min(w.fitness - 0.18, ceiling.fitness), 0, 100);
    const target = Math.min(60 + w.fitness * 0.4, ceiling.condition);
    w.condition = clamp(Math.min(w.condition + (target - w.condition) * 0.02, ceiling.condition), 0, 100);
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
    // A night they did not plan. Shorter, poorer, and it does not clear debt
    // the way a deliberate one does.
    const sinceSlept = person.lastSleptAt === undefined ? Number.POSITIVE_INFINITY : sim.now - person.lastSleptAt;
    let sleptHours = 0;
    if (sinceSlept >= 20 * MS_HOUR) {
      const quality = sleepQuality(sim, person) * 0.95;
      const { sound, hours } = unattendedNight(person);
      // The day is still a sound sleeper's day. Taking the lie-in out of the
      // waking hours as well left a poor sleeper better rested than anybody.
      sleptHours = sound;
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

/** How many hours until the player must be somewhere. */
export function hoursUntilNextCommitment(sim: Simulation): number | undefined {
  const next = sim.timeline.next(sim.now, (i) => i.requiresPlayer === true);
  if (!next) return undefined;
  return (next.at - sim.now) / MS_HOUR;
}

/**
 * The rest a normal night gives, counted in hours of sound sleep: eight hours
 * at the quality a calm person with nothing unusual about their sleep gets.
 * It is what a night has to put back for a day to be paid for, before any
 * debt is.
 */
const A_NORMAL_NIGHT = 8 * 0.82;

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
  const debt = person.wellbeing.sleepDebt;
  const night = nightParts(sim, person);
  const restores = personalityOf(person, 'energyRecovery');
  const age = recoveryFactorAt(yearsSince(person.birthInstant, sim.now));
  const needed = (A_NORMAL_NIGHT + debt * 0.1) / (night.quality * restores * age);
  const ideal = clamp(needed, 6, LONGEST_NIGHT);
  const hours = Math.round(ideal * 2) / 2;
  const why = sleepReason({ night, restores, age, debt, hours, needed });
  if (!next) {
    return { hours, reason: needed > LONGEST_NIGHT ? why : 'Your calendar’s clear, so sleep as long as you need.' };
  }

  const available = (next.at - sim.now) / MS_HOUR - 1.5;
  if (available < ideal) {
    return {
      hours: Math.max(3, Math.round(available * 2) / 2),
      reason: `"${next.label}" is in ${available.toFixed(1)} hours, so a full night isn’t available.`,
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
  debt: number; hours: number; needed: number;
}): string {
  const { night, restores, age, debt, hours, needed } = tonight;
  if (needed > LONGEST_NIGHT) {
    return night.late > 0
      ? 'Going to bed this late, not even fourteen hours makes up a whole day. An earlier night would.'
      : 'Not even fourteen hours makes up a whole day for you tonight.';
  }
  if (debt > 8) return 'You’re carrying real sleep debt.';
  if (hours <= 8) return 'A normal night.';
  const calm = 0.82 - night.stressLoss;
  // How much of a night each thing takes away, as the share left: the smallest
  // is the one that stretched it.
  const costs: [number, string][] = [
    [A_NORMAL_NIGHT / (A_NORMAL_NIGHT + debt * 0.1), 'You’re carrying some sleep debt, so a normal night takes longer.'],
    [calm / 0.82, 'Stress is costing you sleep, so a normal night takes longer.'],
    [night.depth, 'You don’t sleep deeply, so a normal night takes longer.'],
    [night.late > 0 ? 1 - night.late / (calm * night.depth) : 1, 'It’s late, and a night that starts now is a worse one, so it takes longer.'],
    [restores, 'A night puts back less for you than for most, so it takes longer.'],
    [age, 'A night puts back less than it used to, so it takes longer.'],
  ];
  const [share, said] = costs.reduce((worst, one) => (one[0] < worst[0] ? one : worst));
  return share < 1 ? said : 'A normal night.';
}
