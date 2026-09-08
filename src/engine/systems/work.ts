/**
 * SLATE — the Saturday job.
 *
 * A shift is hours out of a day, energy out of a body and money into an
 * account, at the floor where you are standing plus whatever the job is worth
 * above it. It is not a career and it does not become one: it is the thing
 * that pays for the phone, the driving lessons and the first flight.
 *
 * The floor is real and published. The employer, the rota and every shift are
 * SLATE's own, because there is no listings feed and a made up shift at a real
 * shop would be a claim about a real employer.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { FirstJobHeld, Id, Person } from '../domain/model';
import type { Money } from '../core/money';
import { formatMoney } from '../core/money';
import { clamp } from '../core/rng';
import { MS_MINUTE, addDays, formatDate } from '../core/time';
import { plural } from '../core/text';
import { countryOfCity } from '../content/geography';
import { costOfLiving } from '../content/tax';
import { placesIn } from '../content/places';
import {
  EMPLOYER_FIRST, EMPLOYER_SECOND, FIRST_JOBS, JOB_BY_ID, JOB_NOTE, LOCAL_MINIMUMS, LOCAL_NOTE,
  NO_MINIMUM_NOTE, SHIFTS_A_WEEK, WAGE_NOTE, YOUNG_NOTE, type FirstJob, floorIn,
  floorIsCountrys, jobsAt, youngShareAt,
} from '../content/work';
import { ageOf, mayI } from './lifespan';
import { attributesOf } from '../domain/attributes';

// ---------------------------------------------------------------------------
// What an hour is worth here
// ---------------------------------------------------------------------------

/**
 * What this job pays this person, per hour, in this city.
 *
 * The country's floor, moved by what the city costs, lifted by what the job
 * is worth, and cut by the young rate where a young worker is legally paid
 * less — which is a real arrangement in a lot of countries.
 */
export function wageFor(sim: Simulation, job: FirstJob, person: Person = sim.player): Money {
  const countryId = countryOfCity(person.currentLocationId) ?? person.citizenshipId;
  const floor = floorIn(countryId);
  // A national minimum is the same number in the capital as it is anywhere
  // else. It is only where a country really lets a state, a province or a city
  // set its own that an expensive city pays more.
  const local = LOCAL_MINIMUMS.has(countryId)
    ? floor.perHour * (1 + (costOfLiving(person.currentLocationId) - 1) * 0.6)
    : floor.perHour;
  return Math.max(50, Math.round(local * job.premium * youngShareAt(ageOf(sim, person))));
}

/** What a shift at this job would pay, before anything comes off it. */
export function shiftPay(sim: Simulation, job: FirstJob, person: Person = sim.player): Money {
  return wageFor(sim, job, person) * job.hours;
}

/** The floor where somebody is standing, and whether the country sets one. */
export function floorHere(sim: Simulation, person: Person = sim.player): ReturnType<typeof floorIn> {
  return floorIn(countryOfCity(person.currentLocationId) ?? person.citizenshipId);
}

// ---------------------------------------------------------------------------
// The job somebody holds
// ---------------------------------------------------------------------------

/** The job they are doing now, if they are doing one. */
export function jobOf(sim: Simulation, personId: Id = sim.player.id): FirstJobHeld | undefined {
  return Object.values(sim.universe.firstJobs ?? {}).find(
    (one) => one.personId === personId && !one.endedAt,
  );
}

/** Every job they have ever had, newest first. */
export function jobsHeld(sim: Simulation, personId: Id = sim.player.id): FirstJobHeld[] {
  return Object.values(sim.universe.firstJobs ?? {})
    .filter((one) => one.personId === personId)
    .sort((a, b) => b.startedAt - a.startedAt);
}

/** What is going in this city, for somebody this age. */
export function openingsFor(sim: Simulation, person: Person = sim.player): FirstJob[] {
  const age = ageOf(sim, person);
  if (!mayI(sim, 'work', person).ok) return [];
  return jobsAt(age);
}

/** Somewhere to work, which is SLATE's own. */
function employerFor(sim: Simulation, job: FirstJob, cityId: string): { name: string; placeId?: string } {
  const rng = sim.rng('work.employer', cityId, job.id);
  if (job.placeKind) {
    const here = placesIn(cityId).filter((one) => one.kind === job.placeKind);
    if (here.length > 0) {
      const place = rng.pick(here);
      return { name: place.name, placeId: place.id };
    }
  }
  return { name: `${rng.pick(EMPLOYER_FIRST)} ${rng.pick(EMPLOYER_SECOND)}` };
}

/** How this job reads, in a sentence. */
export function describeJob(sim: Simulation, held: FirstJobHeld): string {
  const job = JOB_BY_ID[held.kindId];
  const where = held.employerName;
  if (held.endedAt) {
    return `${job?.label ?? held.kindId} at ${where}. ${plural(held.shifts, 'shift')}, `
      + `${formatMoney(held.earned)} earned. ${held.endReason ?? 'It ended.'}`;
  }
  const next = held.nextShiftAt
    ? ` Next on ${formatDate(held.nextShiftAt, sim.homeZone)}.`
    : '';
  return `${job?.label ?? held.kindId} at ${where}, ${formatMoney(held.perHour)} an hour. `
    + `${plural(held.shifts, 'shift')} so far, ${formatMoney(held.earned)} earned.${next}`;
}

/** Whether the next shift has come round. */
export function shiftIsDue(sim: Simulation, held: FirstJobHeld): boolean {
  return held.nextShiftAt === undefined || sim.now >= held.nextShiftAt;
}

// ---------------------------------------------------------------------------
// The commands
// ---------------------------------------------------------------------------

export function registerWork(sim: Simulation): void {
  /** Taking a job. */
  sim.onCommand<
    { kindId: string },
    { jobId: Id; employerName: string; perHour: Money; note: string }
  >(
    'job.take',
    (p, { sim: s }) => {
      const person = s.player;
      const allowed = mayI(s, 'work');
      if (!allowed.ok) throw new CommandError(allowed.reason);
      if (jobOf(s)) throw new CommandError('You already have one. Two Saturday jobs is one too many.');
      const job = JOB_BY_ID[p.kindId];
      if (!job) throw new CommandError('That is not a job anybody is offering.');
      const age = ageOf(s);
      if (age < job.fromAge) {
        throw new CommandError(`Nobody is put on that before ${job.fromAge}. You are ${age}.`);
      }

      const cityId = person.currentLocationId;
      const { name, placeId } = employerFor(s, job, cityId);
      const perHour = wageFor(s, job, person);
      const held: FirstJobHeld = {
        id: s.nextId('firstjob'),
        saveId: s.universe.meta.id,
        personId: person.id,
        kindId: job.id,
        employerName: name,
        cityId,
        placeId,
        perHour,
        shifts: 0,
        earned: 0,
        startedAt: s.now,
        // They put you on this afternoon. The rota starts after that.
        nextShiftAt: undefined,
      };
      s.universe.firstJobs ??= {};
      s.universe.firstJobs[held.id] = held;

      s.advanceTo(s.now + 40 * MS_MINUTE);
      s.remember({
        category: 'career',
        title: `Started At ${name}`,
        detail: `${job.label}, ${formatMoney(perHour)} an hour. ${job.about}`,
        refs: [{ type: 'person', id: person.id }],
        significance: 4,
        public: false,
      });
      s.emit('job.taken', { jobId: held.id, kindId: job.id, perHour });
      return {
        jobId: held.id,
        employerName: name,
        perHour,
        note: `${job.label} at ${name}. ${formatMoney(perHour)} an hour, `
          + `${plural(job.hours, 'hour')} a shift, ${SHIFTS_A_WEEK} shifts a week. `
          + 'They have put you on this afternoon.',
      };
    },
  );

  /** Working one. */
  sim.onCommand<
    Record<string, never>,
    { paid: Money; shifts: number; earned: Money; note: string }
  >(
    'job.shift',
    (_p, { sim: s }) => {
      const held = jobOf(s);
      if (!held) throw new CommandError('You do not have a job.');
      const job = JOB_BY_ID[held.kindId];
      if (!job) throw new CommandError('That job no longer exists.');
      if (!shiftIsDue(s, held)) {
        throw new CommandError(`Your next shift is ${formatDate(held.nextShiftAt!, s.homeZone)}.`);
      }
      const person = s.player;
      if ((person.wellbeing.energy ?? 100) < 12) {
        throw new CommandError('There is nothing left in you. Sleep first, and ring in.');
      }

      const paid = shiftPay(s, job, person);
      const accountId = person.primaryAccountId;
      if (accountId) {
        s.income(accountId, paid, `${held.employerName} — Wages`, 'salary', { refType: 'person', refId: person.id });
      }
      held.shifts += 1;
      held.earned += paid;
      held.nextShiftAt = nextShift(s);

      // What a shift teaches, which is more than it pays.
      const rng = s.rng('work.shift', held.id, held.shifts);
      for (const feed of job.feeds) {
        if (feed.kind === 'skill') {
          const before = person.skills?.[feed.key] ?? 0;
          person.skills[feed.key] = clamp(Math.round((before + rng.float(0.2, 0.7)) * 10) / 10, 0, 100);
        } else if (attributesOf(person)[feed.key] !== undefined) {
          const before = attributesOf(person)[feed.key] ?? 0;
          person.attributes[feed.key] = clamp(Math.round((before + rng.float(0.15, 0.5)) * 10) / 10, 0, 100);
        }
      }

      s.advanceTo(s.now + job.hours * 60 * MS_MINUTE);
      person.wellbeing.energy = clamp((person.wellbeing.energy ?? 100) - job.demand, 0, 100);
      person.wellbeing.stress = clamp((person.wellbeing.stress ?? 20) + Math.round(job.demand * 0.25), 0, 100);

      if (held.shifts === 1) {
        s.remember({
          category: 'career',
          title: 'The First Shift',
          detail: `${job.label} at ${held.employerName}. ${formatMoney(paid)}, and it is yours.`,
          refs: [{ type: 'person', id: person.id }],
          significance: 5,
          public: false,
        });
      }
      s.emit('job.worked', { jobId: held.id, shifts: held.shifts, paid });
      return {
        paid,
        shifts: held.shifts,
        earned: held.earned,
        note: `${plural(job.hours, 'hour')} at ${held.employerName}. ${formatMoney(paid)}. `
          + `${formatMoney(held.earned)} from this job so far.`,
      };
    },
  );

  /** Leaving one. */
  sim.onCommand<{ reason?: string }, { earned: Money; shifts: number; note: string }>(
    'job.quit',
    (p, { sim: s }) => {
      const held = jobOf(s);
      if (!held) throw new CommandError('You do not have a job to leave.');
      held.endedAt = s.now;
      held.endReason = p.reason ?? 'You handed your notice in.';
      s.remember({
        category: 'career',
        title: `Left ${held.employerName}`,
        detail: `${plural(held.shifts, 'shift')}, ${formatMoney(held.earned)} earned, and that was that.`,
        refs: [{ type: 'person', id: s.player.id }],
        significance: 3,
        public: false,
      });
      s.emit('job.left', { jobId: held.id, shifts: held.shifts, earned: held.earned });
      return {
        earned: held.earned,
        shifts: held.shifts,
        note: `You are done at ${held.employerName}. ${formatMoney(held.earned)} across ${plural(held.shifts, 'shift')}.`,
      };
    },
  );
}

/** When the next one falls, which is a rota rather than a choice. */
function nextShift(sim: Simulation): number {
  const days = Math.max(1, Math.round(7 / SHIFTS_A_WEEK));
  return addDays(sim.now, days, sim.homeZone);
}

export {
  FIRST_JOBS, JOB_BY_ID, JOB_NOTE, LOCAL_MINIMUMS, LOCAL_NOTE, NO_MINIMUM_NOTE, SHIFTS_A_WEEK,
  WAGE_NOTE, YOUNG_NOTE, floorIn, floorIsCountrys, jobsAt, youngShareAt,
};
