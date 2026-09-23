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

/** Hourly drain applied while awake, before any sleep debt raises it. */
export const ENERGY_DRAIN_PER_HOUR = 3.0;
/**
 * How fast somebody gets hungry while awake, per hour.
 *
 * Calibrated against what a year of it costs: a little over three meals a
 * day, which is what one person feeding themselves actually eats.
 */
export const NOURISHMENT_DRAIN_PER_HOUR = 2.0;

/** The sleep debt a waking hour adds, and the most that waking runs it up to. A short night can leave more, by at most what it fell short by, and waking holds that. */
const DEBT_PER_WAKING_HOUR = 0.34;
const DEBT_CEILING = 60;
/** Energy under this is running on empty, and nourishment under this is hungry. */
const EMPTY = 15;
const HUNGRY = 20;
/** Stress over this costs condition for as long as it stays there. */
const OVERWROUGHT = 75;

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
  if (hungry > 0) w.morale = clamp(w.morale - hungry * 0.7 * personalityOf(person, 'moraleSwing'), 0, 100);

  w.hygiene = clamp((w.hygiene ?? 80) - hours * 1.6 * personalityOf(person, 'hygieneDrift'), 0, 100);
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
  const up = (start - person.awakeSince) / MS_HOUR;
  const carried = person.wokeWithDebt ?? Math.max(0, person.wellbeing.sleepDebt - up * DEBT_PER_WAKING_HOUR);
  applyElapsedWellbeing(person, (to - start) / MS_HOUR, carried);
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
  // Somebody the player stayed up with past midnight still sleeps when the
  // clock is then jumped through the rest of that night. This runs before the
  // waking charge, so the stretch the night covers is not charged as awake.
  sim.onPassage('life.night_alone', (s, from) => {
    for (const person of Object.values(s.universe.people)) sleepAlone(s, person, from);
  });

  // Being awake costs something every second of it, so it is charged as the
  // clock moves rather than at midnight.
  sim.onPassage('life.waking', (s, from) => {
    for (const person of Object.values(s.universe.people)) chargeWakingHours(person, from, s.now);
  });

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

      applySleep(person, hours, quality, s.now);
      person.wokeWithDebt = person.wellbeing.sleepDebt;
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
  stressLoss: number; depth: number; late: number; quality: number;
} {
  const stressLoss = remap(person.wellbeing.stress, 0, 100, 0, 0.24);
  // A light sleeper and a night owl both lose here; somebody who can sleep
  // anywhere gains it back.
  const depth = personalityOf(person, 'sleepQuality');
  const hour = zonedParts(at, sim.zone).hour;
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
  // A night under six hours adds what it fell short by. Past the ceiling
  // waking runs the debt up to, it adds that once and no more: short night
  // after short night used to add it on top every time, once the midnight
  // that pulled the debt back to sixty had gone, and three-hour nights left
  // 191.7 owed by the ninetieth.
  if (hours < 6) {
    const short = (6 - hours) * 1.35;
    w.sleepDebt = Math.min(w.sleepDebt + short, Math.max(w.sleepDebt, DEBT_CEILING + short));
  }
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

  liveTheUnattendedNight(sim);

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
 *
 * This used to live the whole day as well, charging the waking hours ahead in
 * one lump; the clock charges those as it moves now (`chargeWakingHours`), so
 * midnight keeps only the night, the meals and the shower. Whether the night
 * is slept is `sleepAlone`'s to say.
 */
function liveTheUnattendedNight(sim: Simulation): void {
  for (const person of Object.values(sim.universe.people)) {
    const w = person.wellbeing;
    // The night first, so the meals below are the day's. The clock would put
    // them to bed from midnight anyway, at its next stop (`life.night_alone`),
    // but after the meals, and the night would eat 1.6 an hour of them.
    sleepAlone(sim, person, sim.now);

    // Meals, and a shower, before the day rather than after it.
    w.nourishment = clamp(Math.max(w.nourishment, COASTING_NOURISHMENT_TARGET), 0, 100);
    w.hygiene = clamp(Math.max(w.hygiene ?? 80, 82), 0, 100);
  }
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
 * is about to carry them through it without the player.
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
 * later, and midnight cannot tell. Where the clock is going can
 * (`Simulation.advancingTo`). A player who is there moves it a second at a
 * time, or an hour from the Advance menu, keeps the character up with them,
 * and has the Sleep button; a clock that will carry them more than an hour
 * into the night is a night they live without the player, and they sleep it.
 * A live clock never moves more than half an hour at a step, even paying back
 * a night the laptop was shut, so one left running with nobody watching
 * counts as a player who is there.
 *
 * It asked at first for the shortest night anybody sleeps alone, five hours
 * and twenty-four minutes, ahead of the clock. A skip that stopped for a plan
 * in the small hours then came in two shorter pieces and neither was slept:
 * somebody on autopilot, sent on to the morning at ten with a plan at three,
 * was at energy 4.0 by seven. An hour tells a player who is there from one
 * who is not: when the clock will stop within the hour, they stay up with the
 * player.
 *
 * So a night is slept alone when somebody is awake at `bedtime`, has had no
 * night since that night's midnight, it is still before a sound sleeper would
 * have woken from it, and the clock is going on more than an hour. Both
 * checks on the record are needed. `lastSleptAt` says a night has been slept
 * since midnight, whether chosen, booked for later or slept alone, and
 * without it each of those is slept again. A night booked further ahead than
 * tonight holds off every night alone until it; nothing in the game books
 * one, since the Sleep dialog puts them to bed now.
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
 * with and then left, and it is slept in full: what it puts back is the whole
 * night's. They are up where the clock stops if that comes before a sound
 * sleeper would wake, so a player coming back never finds them in the middle
 * of one. It was cut there too at first, to the hours the clock had carried
 * them, and the morning the player chose to look in at cost them sleep:
 * skipped to seven every morning for a year, a light sleeper ended at
 * condition 35.8 and morale 0. Slept in full, the same year ends at 76.6 and
 * 100, where the rule at 87 left them at 76.4 and 100.
 */
function sleepAlone(sim: Simulation, person: Person, bedtime: number): void {
  if (person.awakeSince !== undefined && person.awakeSince > bedtime) return;
  // Asked first, because it is cheap and live play asks it every second.
  const until = sim.advancingTo;
  if (until === undefined || until - bedtime <= LONGEST_STEP_WITH_THE_PLAYER) return;
  const midnight = startOfLocalDay(sim, bedtime);
  if (person.lastSleptAt !== undefined && person.lastSleptAt >= midnight) return;
  const { sound, hours } = unattendedNight(person);
  if (bedtime - midnight >= sound * MS_HOUR) return;

  const w = person.wellbeing;
  const energy = w.energy;
  // A night they did not plan. Shorter, poorer, and it does not clear debt
  // the way a deliberate one does.
  applySleep(person, hours, sleepQuality(sim, person, bedtime) * 0.95, bedtime);
  person.wokeWithDebt = w.sleepDebt;
  person.lastSleptAt = bedtime;
  // And they are asleep until a sound sleeper would wake, which is when the
  // clock starts charging them again, or until the clock stops if that is
  // sooner. The day is still a sound sleeper's day: taking the lie-in out of
  // the waking hours as well left a poor sleeper better rested than anybody.
  person.awakeSince = bedtime + Math.min(Math.round(sound * MS_HOUR), until - bedtime);

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
    [restores, 'A night puts back less for you than for most, so it takes longer.'],
    [age, 'A night puts back less than it used to, so it takes longer.'],
  ];
  const [share, said] = costs.reduce((worst, one) => (one[0] < worst[0] ? one : worst));
  return share < 1 ? said : 'A normal night.';
}
