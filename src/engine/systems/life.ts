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

import type { Simulation } from '../core/simulation';
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
import { inHospital } from './health';
import { INJURY } from '../content/injury';
import { BODY } from '../content/body';
import { buyTheDaysFood, canPay, fedOn, mealOf, spend } from './spending';
import { heatIndexC, weatherAt } from './weather';
import { alreadyApplied, developmentOf, markApplied, recordDevelopment, repeatsToday } from './attributes';
import { DEVELOPMENT } from '../content/abilities';

/** What delivery costs over a meal cooked at home: $21.00 against $3.03 for the same meals (LendingTree, October 2025), near seven times. */
export const DELIVERY = { times: 21 / 3.03 };

/**
 * Where a workout happens, and what it builds there: a run on a dry, mild day a tenth more than a workout
 * indoors with nothing (SLATE's estimate). Until 2026-10-09 a gym in the home or its building built a fifth
 * more; the home went with its gym in the scope reset (`systems/dwelling.ts`).
 */
export const TRAINING = { run: 1.1, indoors: 1 };
/** Weather to run in: dry, and neither freezing nor sweltering, the heat read as it feels (`heatIndexC`). */
export const FINE = { highC: 32, runLowC: 0 };
const WET = ['Rain', 'Thunderstorm', 'Snow', 'Drizzle'];
export function trainingAt(sim: Simulation, person: Person): { where: 'run' | 'indoors'; builds: number } {
  const w = weatherAt(sim, person.currentLocationId, sim.now);
  if (w && !WET.includes(w.condition) && heatIndexC(w.temperatureC, w.humidity) <= FINE.highC && w.temperatureC >= FINE.runLowC) return { where: 'run', builds: TRAINING.run };
  return { where: 'indoors', builds: TRAINING.indoors };
}

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
 * How fitness is kept and lost (from 2026-10-10), SLATE's design on the research's shape:
 *
 * - **Held:** for `heldDays` after a workout, fitness doesn't fall. Hickson & Rosenkoetter (Med Sci Sports Exerc
 *   1981;13:13-16) kept a trained group's raised VO2max for 15 weeks on two hard sessions a week, so a body trained
 *   twice a week shouldn't lose ground. Until 2026-10-10 it fell 0.18 every midnight, trained that day or not, so
 *   a student working out daily woke 0.18 under full every morning (99.12 against 99.3, played on 2026-10-10) and
 *   Stamina was full only in the hours after a workout. The profile said a day's rest didn't lower it, and that was
 *   false.
 * - **Lost:** past that, `perDay` a day toward `EVERYDAY_FITNESS`. Mujika & Padilla (Sports Med 2000;30:79-87)
 *   put a trained body's loss of VO2max at 4 to 14% in under four weeks without training; 0.18 a day is about 5
 *   points in four weeks, the gentle end. The rate is SLATE's; no study gives a daily figure for this scale.
 * - **Repeated:** a second workout the same day builds half the first, a third a quarter
 *   (`DEVELOPMENT.repeat`, as practice repeats): until 2026-10-10 a second hour built as much as the first, and a
 *   body could be farmed to full in half the days. Two a day isn't twice the adaptation; no figure is published for
 *   how much less, so half is SLATE's.
 */
export const FITNESS = { heldDays: 3, perDay: 0.18 } as const;

/** Whether fitness is held now, and until when (`FITNESS.heldDays` after the last workout), for the profile; none before a first workout. */
export function fitnessHeldUntil(person: Person): Instant | undefined {
  const at = person.development?.workout?.at;
  return at === undefined ? undefined : at + FITNESS.heldDays * MS_DAY;
}
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
      // Hours that are a number, and a start within the day ahead (from 2026-10-10: until then a value that wasn't a
      // number passed the clamp, and a start any distance ahead was taken).
      if (!Number.isFinite(Number(p.hours))) throw new CommandError('Say how long to sleep.');
      const hours = clamp(Number(p.hours), 0.5, 16);
      const start = p.startAt ?? s.now;
      if (!Number.isFinite(start)) throw new CommandError('Say when to sleep.');
      if (start < s.now) throw new CommandError('You can’t go to sleep in the past.');
      if (start > s.now + MS_DAY) throw new CommandError('A night can be planned a day ahead at most.');
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

  // --- Looking after yourself ---------------------------------------------

  sim.onCommand<{ action: LookAfter; actionId?: string }, { doneAt: number; changed: Partial<Wellbeing> }>(
    'life.look_after',
    (p, { sim: s }) => {
      const action = LOOKING_AFTER[p.action] ? p.action : undefined;
      if (!action) throw new CommandError('That isn’t something you can do for yourself here.');
      // The same hour sent twice with one `actionId` (a retry after a lost answer) is lived once (from 2026-10-10), as
      // practice, study and a tape already were: until then a retried workout was a second workout.
      const refused = alreadyApplied(s.player, p.actionId) ?? lookAfterRefusal(s, action);
      if (refused) throw new CommandError(refused);
      markApplied(s.player, p.actionId);

      // The hour is lived first, and charged as waking like any other, so
      // what it does is on top of what the hour already cost.
      const cost = costFor(s, action);
      s.advanceTo(s.now + minutesFor(s, action) * 60_000);
      const person = s.player;
      // A meal is bought as it's made (`systems/spending.ts`), and a delivered one at delivery's price.
      // A payment that doesn't go through leaves them unfed: the command fails, and the time with it.
      if (action === 'eat' && !spend(s, person, cost, 'A meal', 'food')) throw new CommandError('The payment didn’t go through.');
      if (action === 'order' && !spend(s, person, cost, 'A meal delivered', 'food')) throw new CommandError('The payment didn’t go through.');
      const before = { ...person.wellbeing };
      const where = action === 'exercise' ? trainingAt(s, person) : undefined;
      // A second workout today builds half the first (`FITNESS`), counted where practice counts its repeats, so a save and a load don't reset it.
      const again = action === 'exercise' ? DEVELOPMENT.repeat ** repeatsToday(s, person, 'stamina<workout') : 1;
      applyLookingAfter(person, action, s.now, where ? where.builds * again : 1);
      if (action === 'exercise') {
        recordDevelopment(s, person, 'stamina', person.wellbeing.fitness - before.fitness, where!.where === 'run' ? 'workout:run' : 'workout');
        developmentOf(person).workout = { at: s.now };
      }
      // An hour of it, at its MET value (`content/body.ts`), and its injury rate (`content/injury.ts`).
      if (action === 'exercise') {
        const source = where!.where === 'run' ? 'run' : 'gym';
        exerts(person, source === 'run' ? BODY.met.run : BODY.met.workout, 1);
        mayHurt(s, person, source, chanceOver(INJURY.perThousandHours[source], 1), s.now);
      }
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
// A bath, a swim in the pool, sitting outside, the laundry and cleaning the place went with the home in the scope
// reset of 2026-10-09: each was the home's (its bathtub, its pool, its yard, its machines, its rooms).
export type LookAfter = 'eat' | 'order' | 'wash' | 'exercise' | 'unwind';

export const LOOKING_AFTER: Record<LookAfter, { label: string; minutes: number; does: string }> = {
  eat: { label: 'Eat A Meal', minutes: 40, does: 'Feeds you, and lifts the mood by as much as you needed it' },
  order: { label: 'Order In', minutes: 50, does: 'A meal delivered, at what delivery costs: feeds you without the cooking' },
  wash: { label: 'Shower', minutes: 20, does: 'Clean again, and calmer by as much as you needed it' },
  exercise: { label: 'Work Out', minutes: 60, does: 'Builds fitness, more the readier you are and more on a run in fine weather, and holds it for three days; a second the same day builds half. Eases stress; costs energy, food and a shower' },
  unwind: { label: 'Unwind', minutes: 60, does: 'Takes the edge off stress and lifts the mood' },
};

/** What a meal puts back, and what a workout costs and builds. */
const MEAL = 50;
const WORKOUT_FITNESS = 0.6;
const WORKOUT_ENERGY = 10;
/** Too full to eat, too clean to shower, and too spent to train. */
const FULL = 90;
const CLEAN = 95;
export const SPENT = 25;

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
 * Why an hour of one's own can't start now: something on the calendar that wants the player begins inside it (from
 * 2026-10-10). An hour of practice, an interest or study isn't lived across a class or a call: it's refused, and says
 * what's coming and when.
 */
export function commitmentWithin(sim: Simulation, minutes: number): string | undefined {
  const next = sim.timeline.between(sim.now, sim.now + minutes * 60_000).find((i) => i.requiresPlayer === true && i.status === 'pending');
  return next ? `${next.label} starts at ${formatTime(next.at, sim.zone)}: there isn’t the time before it.` : undefined;
}

/** How long it takes. Until 2026-10-09 the laundry and the cleaning took as long as the home made them. */
export function minutesFor(_sim: Simulation, action: LookAfter): number {
  return LOOKING_AFTER[action].minutes;
}

/** What it's called. Until 2026-10-09 a meal at home was cooked, and said so. */
export function labelFor(_sim: Simulation, action: LookAfter): string {
  return LOOKING_AFTER[action].label;
}

/** What it costs now, where it costs anything. */
export function costFor(sim: Simulation, action: LookAfter): number {
  if (action === 'eat') return mealOf(sim, sim.player);
  if (action === 'order') return Math.round(mealOf(sim, sim.player) * DELIVERY.times);
  return 0;
}

export function lookAfterRefusal(sim: Simulation, action: LookAfter): string | undefined {
  const w = sim.player.wellbeing;
  const person = sim.player;
  // In hospital the ward does all of it (from 2026-10-10): until then a workout could be had from a hospital bed, and
  // roll a gym injury there, where practice and a genre's hour already refused.
  if (inHospital(person, sim.now)) return 'Not from a hospital bed.';
  const busy = action === 'eat' ? undefined : occupiedAt(sim, sim.now);
  if (busy) return `You’re at ${busy.label} until ${formatTime(busy.at + busy.durationMinutes! * 60_000, sim.zone)}.`;
  if ((action === 'eat' || action === 'order') && w.nourishment >= FULL) return 'You aren’t hungry.';
  if ((action === 'eat' || action === 'order') && canPay(sim, person) < costFor(sim, action)) return 'You can’t afford it.';
  if (action === 'wash' && (w.hygiene ?? 80) >= CLEAN) return 'You’re already clean.';
  if (action === 'exercise' && w.energy < SPENT) return 'You’re too tired to train. Sleep first.';
  if (action === 'exercise') { const hurt = trainingRefusal(person, sim.now); if (hurt) return hurt; }
  // Down with the flu, rest (from 2026-10-10): its fever and aches are the systemic symptoms the usual guidance says
  // to rest through, SLATE's reading of it; until then a workout went ahead with the flu as with nothing.
  if (action === 'exercise' && (person.health?.fluUntil ?? 0) > sim.now) return 'Not with the flu: rest until it passes.';
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
export function applyLookingAfter(person: Person, action: LookAfter, at?: number, training = 1): void {
  const w = person.wellbeing;
  // Until 2026-10-10 somebody who loved what they were doing (Cooking a meal, Fitness a workout, an evening's
  // pastime an hour unwinding) got half again the mood and a quarter again the relief; the interests went that day.
  const swing = personalityOf(person, 'moraleSwing');
  if (action === 'eat' || action === 'order') {
    const eaten = Math.min(MEAL, 100 - w.nourishment);
    w.nourishment = clamp(w.nourishment + eaten, 0, 100);
    // Ordered in: a restaurant's meal (`content/body.ts`).
    if (action === 'order') eatsOut(person);
    // A meal's lift is the eater's too (`mealMood`, from 2026-10-09): the frugal take less from it, a spender more.
    w.morale = clamp(w.morale + eaten * 0.04 * swing * personalityOf(person, 'mealMood'), 0, 100);
  } else if (action === 'wash') {
    const washed = 100 - (w.hygiene ?? 80);
    w.hygiene = 100;
    w.stress = clamp(w.stress - washed * 0.1, 0, 100);
  } else if (action === 'exercise') {
    const ceiling = at === undefined ? 100 : ceilingAt(yearsSince(person.birthInstant, at)).fitness;
    // A run in fine weather builds more than a workout indoors (`trainingAt`).
    const builds = workoutBuilds(person) * training;
    const costs = workoutCosts(person);
    if (w.fitness < ceiling) w.fitness = Math.min(w.fitness + builds, ceiling);
    w.energy = clamp(w.energy - costs, 0, 100);
    w.nourishment = clamp(w.nourishment - 6, 0, 100);
    w.hygiene = clamp((w.hygiene ?? 80) - 20 * personalityOf(person, 'hygieneDrift'), 0, 100);
    w.stress = clamp(w.stress - 8 * personalityOf(person, 'stressRecovery'), 0, 100);
    w.morale = clamp(w.morale + 3 * swing, 0, 100);
  } else {
    // Unwinding. Until 2026-10-09 it was less on the floor of an empty home with no sofa (`systems/furniture.ts`).
    w.stress = clamp(w.stress - 10 * personalityOf(person, 'stressRecovery'), 0, 100);
    w.morale = clamp(w.morale + 3 * swing, 0, 100);
  }
}

/** One thing on the Look After Yourself menu, as the menu shows it and in the order it's shown (`lookAfterOptions`). */
export interface LookAfterOption {
  action: LookAfter;
  label: string;
  minutes: number;
  cost: number;
  /** Why it can't be done now, the command's own words (`lookAfterRefusal`). */
  refused?: string;
  /** Readiness points it gives back on what it does alone, the time it takes aside. */
  gain: number;
  /** Whether what it mends is costing the body every hour it's left: hunger, grime, stress past the line. */
  urgent: boolean;
  /** Why it's where it is, from the dials. */
  why: string;
  /** The dials it moves, from and to, on what it does alone. */
  changes: { dial: keyof Wellbeing; from: number; to: number }[];
}

/**
 * The Look After Yourself menu, from the connected world of 2026-10-09: each
 * thing with its time, its cost and what it would do to the dials, and in the
 * order of what it's worth now. Until then the menu was a fixed list.
 *
 * What it would do is `applyLookingAfter` on a copy of the person, so the
 * preview is the command's own arithmetic; the time it takes costs what any
 * waking time does on top. Its order: first what's costing the body every
 * hour (`HUNGRY`, `GRIMY`, `OVERWROUGHT`, the lines `applyElapsedWellbeing`
 * charges past), then by the readiness it gives back, then what gives back
 * next to nothing, then what can't be done now; and within each, the fixed
 * order of `LOOKING_AFTER`, so a tie never reshuffles the menu. Nothing on
 * it happens by itself: it only orders what the player may choose.
 */
export function lookAfterOptions(sim: Simulation): LookAfterOption[] {
  const person = sim.player;
  const w = person.wellbeing;
  const before = readiness(person);
  const order = Object.keys(LOOKING_AFTER) as LookAfter[];
  const options = order.map((action): LookAfterOption => {
    // A copy, without the body's tally, which a meal ordered in adds to (`eatsOut`).
    const copy = { ...person, wellbeing: { ...w }, body: undefined } as Person;
    applyLookingAfter(copy, action, sim.now, action === 'exercise' ? trainingAt(sim, person).builds : 1);
    const changes = (Object.keys(w) as (keyof Wellbeing)[])
      .filter((k) => typeof w[k] === 'number' && Math.round((copy.wellbeing[k] as number) * 10) !== Math.round((w[k] as number) * 10))
      .map((k) => ({ dial: k, from: w[k] as number, to: copy.wellbeing[k] as number }));
    const gain = Math.round((readiness(copy) - before) * 10) / 10;
    const feeds = action === 'eat' || action === 'order';
    const urgent = (feeds && w.nourishment < HUNGRY) || (action === 'wash' && (w.hygiene ?? 80) < GRIMY) || (action === 'unwind' && w.stress > OVERWROUGHT);
    return {
      action, label: labelFor(sim, action), minutes: minutesFor(sim, action), cost: costFor(sim, action),
      refused: lookAfterRefusal(sim, action), gain, urgent, why: whyNow(person, action, gain, urgent), changes,
    };
  });
  const band = (o: LookAfterOption) => (o.refused ? 3 : o.urgent ? 0 : o.gain >= 0.5 ? 1 : 2);
  return options
    .map((o, i) => ({ o, i }))
    .sort((a, b) => band(a.o) - band(b.o) || (band(a.o) === 1 ? b.o.gain - a.o.gain : 0) || a.i - b.i)
    .map(({ o }) => o);
}

/** Why a thing stands where it does on the menu, in the dials' words. */
function whyNow(person: Person, action: LookAfter, gain: number, urgent: boolean): string {
  const w = person.wellbeing;
  const r = (x: number) => Math.round(x);
  if (action === 'eat' || action === 'order') {
    if (urgent) return `Hungry at ${r(w.nourishment)}: every hour under ${HUNGRY} costs condition and mood.`;
    return gain >= 0.5 ? `Nourishment at ${r(w.nourishment)} is costing readiness.` : `Nourishment at ${r(w.nourishment)}: there’s little to gain from a meal yet.`;
  }
  if (action === 'wash') {
    if (urgent) return `Hygiene at ${r(w.hygiene ?? 80)}: every hour under ${GRIMY} wears on the mood.`;
    return gain >= 0.5 ? `Hygiene at ${r(w.hygiene ?? 80)}, and stress at ${r(w.stress)} it would ease.` : `Hygiene at ${r(w.hygiene ?? 80)}: little to gain yet.`;
  }
  if (action === 'unwind') {
    if (urgent) return `Stress at ${r(w.stress)}: every hour over ${OVERWROUGHT} costs condition.`;
    return gain >= 0.5 ? `Stress at ${r(w.stress)} and morale at ${r(w.morale)} are costing readiness.` : `Stress at ${r(w.stress)}: little to gain yet.`;
  }
  // A workout's worth is mostly fitness, which readiness doesn't read the day it's built; it costs energy now.
  return `Builds fitness, at ${r(w.fitness)} now, and eases stress; costs ${r(workoutCosts(person))} energy.`;
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
  // A friend's sofa, a hot night without air conditioning and a body on another clock each took a night down
  // too, until the home, its cooling and the journeys went in the scope reset of 2026-10-09.
  return { stressLoss, depth, late, quality: clamp((0.82 - stressLoss) * depth - late, 0.28, 1) };
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
  // A night away from home put back less for a homebody until 2026-10-09, when the home and the journeys went.
  w.energy = clamp(w.energy + effective * 13.5 * banked * personalityOf(person, 'energyRecovery') * owing * worn, 0, 100);
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
export function yearsSince(birthInstant: number, at: number): number {
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
 * `EVERYDAY_FITNESS`, now, and from 2026-10-10 not at all within
 * `FITNESS.heldDays` of a workout. What it decides is how far a night can
 * mend condition (`mendsTo`).
 */
export function settleTheBody(person: Person, at: number): void {
  const w = person.wellbeing;
  const ceiling = ceilingAt(yearsSince(person.birthInstant, at));
  const trained = person.development?.workout?.at;
  const held = trained !== undefined && at - trained <= FITNESS.heldDays * MS_DAY;
  const fell = !held && w.fitness > EVERYDAY_FITNESS ? Math.max(EVERYDAY_FITNESS, w.fitness - FITNESS.perDay) : w.fitness;
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
    // bought first (`systems/spending.ts`), and a day nobody can pay for is
    // eaten thin (`eatWhatThereIs`). Until 2026-10-09 the morning started less
    // fresh out of clean clothes; the wardrobe went with the home.
    if (buyTheDaysFood(sim, person)) eatBeforeTheDay(w);
    else { eatWhatThereIs(w); eatsShort(person); }
    w.hygiene = clamp(Math.max(w.hygiene ?? 80, 82), 0, 100);
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
    [restores, 'A night puts back less for you than for most, so it takes longer.'],
    [age, 'A night puts back less than it used to, so it takes longer.'],
  ];
  const [share, said] = costs.reduce((worst, one) => (one[0] < worst[0] ? one : worst));
  return share < 1 ? said : 'A normal night.';
}
