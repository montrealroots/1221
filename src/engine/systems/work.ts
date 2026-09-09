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
import type { FirstJobHeld, Id, Person, RotaShift } from '../domain/model';
import type { Money } from '../core/money';
import type { Instant } from '../core/time';
import { formatMoney } from '../core/money';
import { clamp } from '../core/rng';
import { MS_MINUTE, addDays, formatDate, formatTime, zonedParts } from '../core/time';
import { plural } from '../core/text';
import { CITIES, REGIONS, countryOfCity } from '../content/geography';
import { costOfLiving } from '../content/tax';
import { placesIn } from '../content/places';
import {
  EMPLOYER_FIRST, EMPLOYER_SECOND, FIRST_JOBS, JOB_BY_ID, JOB_NOTE, LOCAL_MINIMUMS, LOCAL_NOTE,
  NO_MINIMUM_NOTE, SHIFTS_A_WEEK, STATE_FLOORS, STATE_NOTE, WAGE_NOTE, YOUNG_NOTE,
  type FirstJob, floorIn, floorIsCountrys, jobsAt, youngShareAt,
} from '../content/work';
import {
  BRANCH_NOTE, COVER_NOTE, COVER_PREMIUM, COVER_REASONS, COVER_STANDING, CYCLE_DAYS,
  EMPLOYER_BY_ID, EMPLOYER_NOTE, LADDER_NOTE, LETTING_GO_MISSES, LETTING_GO_NOTE,
  LETTING_GO_REASONS, LETTING_GO_STANDING, PAY_STANCE, ROLES, ROLE_BY_ID, ROTA_SHIFTS,
  SECTOR_LABEL, SHIFT_BY_ID, SHIFT_KINDS, SHIFT_STANDING, SICK_STANDING, STARTING_STANDING,
  STATUTORY_SICK_PAY, cycleIn, employersAreCountrys, employersIn, nextRole,
} from '../content/employers';
import { computeAnnualTax } from '../content/tax';
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
export function wageFor(
  sim: Simulation, job: FirstJob, person: Person = sim.player,
  employerId?: string, roleId = 'crew',
): Money {
  const countryId = countryOfCity(person.currentLocationId) ?? person.citizenshipId;
  const floor = floorIn(countryId);
  // A national minimum is the same number in the capital as it is anywhere
  // else. It is only where a country really lets a state, a province or a city
  // set its own that an expensive city pays more. In the United States the
  // state figures are published, so they are used as published; everywhere
  // else that devolves it, the floor moves with what the city costs.
  const local = stateFloorFor(person.currentLocationId)
    ?? (LOCAL_MINIMUMS.has(countryId)
      ? floor.perHour * (1 + (costOfLiving(person.currentLocationId) - 1) * 0.6)
      : floor.perHour);
  // How the company pays against the floor, which is the durable public fact
  // about it, and then where you are on the ladder.
  const stance = employerId ? EMPLOYER_BY_ID[employerId]?.pay : undefined;
  const company = stance ? PAY_STANCE[stance].multiple : 1;
  const role = ROLE_BY_ID[roleId]?.multiple ?? 1;
  return Math.max(
    50,
    Math.round(local * job.premium * company * role * youngShareAt(ageOf(sim, person))),
  );
}

/**
 * The published state minimum, where the state publishes one.
 *
 * A state that sets none, or sets one below the federal figure, falls to the
 * federal figure, which is what a covered worker there is actually paid.
 */
export function stateFloorFor(cityId: string | undefined): Money | undefined {
  const city = CITIES.get(cityId ?? '');
  if (!city || city.countryId !== 'us') return undefined;
  return STATE_FLOORS[city.parentId] ?? floorIn('us').perHour;
}

/** Which state's floor applies where somebody is standing, for saying so on the page. */
export function stateFloorNameFor(sim: Simulation, person: Person = sim.player): string | undefined {
  const city = CITIES.get(person.currentLocationId ?? '');
  if (!city || city.countryId !== 'us') return undefined;
  return REGIONS.get(city.parentId)?.name;
}

/** What a shift at this job would pay, before anything comes off it. */
export function shiftPay(
  sim: Simulation, job: FirstJob, person: Person = sim.player, employerId?: string, roleId = 'crew',
): Money {
  return wageFor(sim, job, person, employerId, roleId) * job.hours;
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

/**
 * Somewhere to work.
 *
 * A real company that really hires for this sector in this country first,
 * because that is the true and interesting answer. A real shop of the right
 * kind in the city next, because working somewhere is the same fact as
 * shopping there. SLATE's own only when neither is available.
 */
export function employerFor(
  sim: Simulation, job: FirstJob, cityId: string,
): { name: string; employerId?: string; placeId?: string } {
  const rng = sim.rng('work.employer', cityId, job.id);
  const countryId = countryOfCity(cityId) ?? sim.player.citizenshipId;
  if (job.sector) {
    const real = employersIn(countryId).filter((one) => one.sector === job.sector);
    if (real.length > 0) {
      const company = rng.pick(real);
      // And it has a branch in the city, which is a place with a door.
      const branch = job.placeKind
        ? placesIn(cityId).find((one) => one.kind === job.placeKind && one.name === company.name)
        : undefined;
      return { name: company.name, employerId: company.id, placeId: branch?.id };
    }
  }
  if (job.placeKind) {
    const here = placesIn(cityId).filter((one) => one.kind === job.placeKind);
    if (here.length > 0) {
      const place = rng.pick(here);
      return { name: place.name, placeId: place.id };
    }
  }
  return { name: `${rng.pick(EMPLOYER_FIRST)} ${rng.pick(EMPLOYER_SECOND)}` };
}

// ---------------------------------------------------------------------------
// The rota
// ---------------------------------------------------------------------------

/** The shifts you are down for that have not happened yet. */
export function shiftsToCome(held: FirstJobHeld): RotaShift[] {
  return held.rota.filter((one) => !one.worked && !one.missed);
}

/** The next one you are down for. */
export function nextOnTheRota(held: FirstJobHeld): RotaShift | undefined {
  return shiftsToCome(held)[0];
}

/** Whether the next shift has come round. */
export function shiftIsDue(sim: Simulation, held: FirstJobHeld): boolean {
  const next = nextOnTheRota(held);
  return next !== undefined && sim.now >= next.at - 2 * 60 * MS_MINUTE;
}

/**
 * Write the week's rota.
 *
 * How many shifts depends on where you are on the ladder, and what kind they
 * are depends on the day: a Saturday is a weekend shift, a warehouse is a
 * night, and everything else is an open, a middle or a close.
 */
export function writeRota(sim: Simulation, held: FirstJobHeld): RotaShift[] {
  const job = JOB_BY_ID[held.kindId];
  const rng = sim.rng('work.rota', held.id, held.rota.length);
  const count = ROTA_SHIFTS[held.roleId] ?? SHIFTS_A_WEEK;
  const out: RotaShift[] = [];
  const days = rng.shuffle([1, 2, 3, 4, 5, 6, 0]).slice(0, count);
  for (const weekday of days) {
    // The next time that weekday comes round.
    const today = zonedParts(sim.now, sim.homeZone).weekday;
    const ahead = ((weekday - today) + 7) % 7 || 7;
    const day = addDays(sim.now, ahead, sim.homeZone);
    const kind = held.kindId === 'warehouse'
      ? SHIFT_BY_ID.night!
      : weekday === 0 || weekday === 6
        ? SHIFT_BY_ID.weekend!
        : rng.pick([SHIFT_BY_ID.open!, SHIFT_BY_ID.mid!, SHIFT_BY_ID.close!]);
    const parts = zonedParts(day, sim.homeZone);
    const at = day - (parts.hour - kind.startsAt) * 60 * MS_MINUTE - parts.minute * MS_MINUTE;
    out.push({ at, kindId: kind.id, hours: job?.hours ?? 6 });
  }
  return out.sort((a, b) => a.at - b.at);
}

/** Mark anything on the rota that has gone past unworked, and say what it cost. */
export function closeOffMissed(sim: Simulation, held: FirstJobHeld): number {
  // A call nobody answered in time is a call somebody else took. It costs
  // nothing, because not answering the phone is not the same as saying no.
  if (held.cover && sim.now > held.cover.at) held.cover = undefined;
  let missed = 0;
  for (const shift of held.rota) {
    if (shift.worked || shift.missed) continue;
    if (sim.now > shift.at + 12 * 60 * MS_MINUTE) {
      shift.missed = true;
      missed += 1;
      held.standing = clamp(held.standing + SHIFT_STANDING.missed, 0, 100);
    }
  }
  return missed;
}

/**
 * How many shifts in a row went by without you.
 *
 * Counted backwards from the most recent thing on the rota that has already
 * happened, because it is the run that gets you let go and not the total.
 */
export function missedInARow(held: FirstJobHeld): number {
  let run = 0;
  for (let i = held.rota.length - 1; i >= 0; i -= 1) {
    const shift = held.rota[i]!;
    if (!shift.worked && !shift.missed) continue;
    if (shift.missed) run += 1;
    else break;
  }
  return run;
}

/**
 * Whether they have run out of patience, and which kind of running out it was.
 *
 * A job you stop turning up for is a job you stop having. That is the one
 * consequence the rest of the system was missing: without it a player could
 * ignore the rota for a year and still be on the payroll.
 */
export function letGoFor(held: FirstJobHeld): 'missed' | 'standing' | undefined {
  if (held.endedAt) return undefined;
  if (missedInARow(held) >= LETTING_GO_MISSES) return 'missed';
  if (held.standing <= LETTING_GO_STANDING && held.shifts > 0) return 'standing';
  return undefined;
}

/** Ending a job that is being ended for you, rather than by you. */
function letGo(sim: Simulation, held: FirstJobHeld, why: 'missed' | 'standing'): void {
  held.endedAt = sim.now;
  held.endReason = LETTING_GO_REASONS[why];
  held.rota = held.rota.filter((one) => one.worked || one.missed);
  held.cover = undefined;
  if (held.personId !== sim.player.id) return;
  sim.remember({
    category: 'career',
    title: `Let Go By ${held.employerName}`,
    detail: `${LETTING_GO_REASONS[why]} ${plural(held.shifts, 'shift')}, `
      + `${formatMoney(held.earned)} earned, and the hours already worked still come.`,
    refs: [{ type: 'person', id: held.personId }],
    significance: 4,
    public: false,
  });
  sim.notify({
    title: `Let Go By ${held.employerName}`,
    body: `${LETTING_GO_REASONS[why]} What is on the timesheet is still paid on the pay date.`,
    category: 'personal',
    importance: 66,
    route: '/workspace/character',
  });
  sim.emit('job.let_go', { jobId: held.id, why, shifts: held.shifts, earned: held.earned });
}

// ---------------------------------------------------------------------------
// The ladder
// ---------------------------------------------------------------------------

/** The step above this one, and whether it is within reach yet. */
export function promotionFor(held: FirstJobHeld): { role: ReturnType<typeof nextRole>; ready: boolean; why: string } {
  const role = nextRole(held.roleId);
  if (!role) return { role: undefined, ready: false, why: 'There’s nothing above this one.' };
  if (held.shifts < role.shifts) {
    return {
      role, ready: false,
      why: `${role.label} wants ${role.shifts} shifts behind you and you have ${held.shifts}.`,
    };
  }
  if (held.standing < role.standing) {
    return {
      role, ready: false,
      why: `${role.label} wants them to think ${role.standing} of you. They think ${Math.round(held.standing)}.`,
    };
  }
  return { role, ready: true, why: `${role.label} is yours if you want it. ${role.about}` };
}

/** How this job reads, in a sentence. */
export function describeJob(sim: Simulation, held: FirstJobHeld): string {
  const job = JOB_BY_ID[held.kindId];
  const where = held.employerName;
  if (held.endedAt) {
    return `${job?.label ?? held.kindId} at ${where}. ${plural(held.shifts, 'shift')}, `
      + `${formatMoney(held.earned)} earned. ${held.endReason ?? 'It ended.'}`;
  }
  const upcoming = nextOnTheRota(held);
  const next = upcoming
    ? ` Next on ${formatDate(upcoming.at, sim.homeZone)}, ${SHIFT_BY_ID[upcoming.kindId]?.label.toLowerCase() ?? 'a shift'}.`
    : ' Nothing on the rota.';
  const role = ROLE_BY_ID[held.roleId];
  return `${role && role.id !== 'crew' ? `${role.label}, ` : ''}${job?.label ?? held.kindId} at ${where}, `
    + `${formatMoney(held.perHour)} an hour. `
    + `${plural(held.shifts, 'shift')} so far, ${formatMoney(held.earned)} earned.${next}`;
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
      if (!job) throw new CommandError('That isn’t a job anybody is offering.');
      const age = ageOf(s);
      if (age < job.fromAge) {
        throw new CommandError(`Nobody is put on that before ${job.fromAge}. You are ${age}.`);
      }

      const cityId = person.currentLocationId;
      const { name, employerId, placeId } = employerFor(s, job, cityId);
      const perHour = wageFor(s, job, person, employerId, 'crew');
      const held: FirstJobHeld = {
        id: s.nextId('firstjob'),
        saveId: s.universe.meta.id,
        personId: person.id,
        kindId: job.id,
        employerName: name,
        employerId,
        roleId: 'crew',
        standing: STARTING_STANDING,
        cityId,
        placeId,
        perHour,
        shifts: 0,
        earned: 0,
        owedHours: 0,
        owed: 0,
        payslips: [],
        sickDays: 0,
        rota: [],
        startedAt: s.now,
      };
      s.universe.firstJobs ??= {};
      s.universe.firstJobs[held.id] = held;
      // They put you on this afternoon, and then you are on the rota.
      held.rota = [
        { at: s.now + 60 * MS_MINUTE, kindId: 'mid', hours: job.hours },
        ...writeRota(s, held),
      ];
      scheduleRota(s, held);
      schedulePayday(s, held);

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
          + `${plural(job.hours, 'hour')} a shift, ${ROTA_SHIFTS.crew} shifts a week. `
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
      if (!held) throw new CommandError('You don’t have a job.');
      const job = JOB_BY_ID[held.kindId];
      if (!job) throw new CommandError('That job no longer exists.');
      closeOffMissed(s, held);
      const shift = nextOnTheRota(held);
      if (!shift) throw new CommandError('You aren’t down for anything. The rota is up on Sunday.');
      if (!shiftIsDue(s, held)) {
        throw new CommandError(
          `You’re on at ${formatTime(shift.at, s.homeZone)} on ${formatDate(shift.at, s.homeZone)}.`,
        );
      }
      const person = s.player;
      if ((person.wellbeing.energy ?? 100) < 12) {
        throw new CommandError('There’s nothing left in you. Sleep first, and ring in.');
      }

      const kind = SHIFT_BY_ID[shift.kindId];
      const premium = (kind?.premium ?? 1) * (shift.cover ? COVER_PREMIUM : 1);
      const paid = Math.round(
        wageFor(s, job, person, held.employerId, held.roleId) * shift.hours * premium,
      );
      // Nobody is handed cash at the end of a shift. The hours go on a
      // timesheet and the money arrives on the pay date.
      held.owedHours += shift.hours;
      held.owed += paid;
      held.shifts += 1;
      held.earned += paid;
      shift.worked = true;
      held.standing = clamp(held.standing + SHIFT_STANDING.worked, 0, 100);

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

      s.advanceTo(Math.max(s.now, shift.at) + shift.hours * 60 * MS_MINUTE);
      const demand = job.demand + (kind?.extra ?? 0);
      person.wellbeing.energy = clamp((person.wellbeing.energy ?? 100) - demand, 0, 100);
      person.wellbeing.stress = clamp((person.wellbeing.stress ?? 20) + Math.round(demand * 0.25), 0, 100);

      if (held.shifts === 1) {
        s.remember({
          category: 'career',
          title: 'The First Shift',
          detail: `${job.label} at ${held.employerName}. ${formatMoney(paid)}, and it’s yours.`,
          refs: [{ type: 'person', id: person.id }],
          significance: 5,
          public: false,
        });
      }
      s.emit('job.worked', { jobId: held.id, shifts: held.shifts, paid, kind: shift.kindId });
      const ready = promotionFor(held);
      return {
        paid,
        shifts: held.shifts,
        earned: held.earned,
        note: `${kind?.label ?? 'A shift'} at ${held.employerName}, ${plural(shift.hours, 'hour')}. `
          + `${formatMoney(paid)}${shift.cover ? ', with the short notice on top' : ''} on the timesheet. `
          + `${held.nextPayAt ? `Paid on ${formatDate(held.nextPayAt, s.homeZone)}.` : ''}`
          + `${ready.ready ? ` They have asked whether you want ${ready.role!.label}.` : ''}`,
      };
    },
  );

  /** Taking the step up, where they have offered it. */
  sim.onCommand<Record<string, never>, { roleId: string; perHour: Money; note: string }>(
    'job.take_promotion',
    (_p, { sim: s }) => {
      const held = jobOf(s);
      if (!held) throw new CommandError('You don’t have a job.');
      const ready = promotionFor(held);
      if (!ready.role) throw new CommandError('There’s nothing above this one.');
      if (!ready.ready) throw new CommandError(ready.why);
      const job = JOB_BY_ID[held.kindId]!;
      held.roleId = ready.role.id;
      held.perHour = wageFor(s, job, s.player, held.employerId, held.roleId);
      // A step up is more shifts as well as more money.
      held.rota = [...held.rota.filter((one) => one.worked || one.missed), ...writeRota(s, held)];
      s.remember({
        category: 'career',
        title: `${ready.role.label} At ${held.employerName}`,
        detail: `${formatMoney(held.perHour)} an hour now. ${ready.role.about}`,
        refs: [{ type: 'person', id: s.player.id }],
        significance: 5,
        public: false,
      });
      s.emit('job.promoted', { jobId: held.id, roleId: held.roleId, perHour: held.perHour });
      return {
        roleId: held.roleId,
        perHour: held.perHour,
        note: `${ready.role.label}. ${formatMoney(held.perHour)} an hour, and ${ROTA_SHIFTS[held.roleId]} shifts a week now.`,
      };
    },
  );

  /** Picking up a shift on a day you were not on. */
  sim.onCommand<Record<string, never>, { at: Instant; note: string }>(
    'job.cover',
    (_p, { sim: s }) => {
      const held = jobOf(s);
      if (!held) throw new CommandError('You don’t have a job.');
      if (!held.cover) throw new CommandError('Nobody has asked you to come in.');
      const cover = held.cover;
      // A shift you were asked about last month is a shift somebody else did.
      // The stale ask is cleared by `closeOffMissed`, which every read goes
      // through; clearing it here would be rolled back with the refusal.
      if (s.now > cover.at) {
        throw new CommandError('That shift was days ago. They’ll have rung somebody else.');
      }
      held.rota.push({ at: cover.at, kindId: cover.kindId, hours: cover.hours, cover: true });
      held.rota.sort((a, b) => a.at - b.at);
      held.standing = clamp(held.standing + COVER_STANDING.yes, 0, 100);
      held.cover = undefined;
      s.emit('job.covered', { jobId: held.id, at: cover.at });
      return {
        at: cover.at,
        note: `You’re on at ${formatTime(cover.at, s.homeZone)} on ${formatDate(cover.at, s.homeZone)}. `
          + 'Short notice pays a little more.',
      };
    },
  );

  /** Not picking one up, which is also an answer. */
  sim.onCommand<Record<string, never>, { note: string }>(
    'job.decline_cover',
    (_p, { sim: s }) => {
      const held = jobOf(s);
      if (!held) throw new CommandError('You don’t have a job.');
      if (!held.cover) throw new CommandError('Nobody has asked you to come in.');
      if (s.now > held.cover.at) {
        throw new CommandError('That shift was days ago. They’ll have rung somebody else.');
      }
      held.standing = clamp(held.standing + COVER_STANDING.no, 0, 100);
      held.cover = undefined;
      s.emit('job.declined_cover', { jobId: held.id });
      return { note: 'You said no. They’ll ring somebody else, and they’ll remember that you said no.' };
    },
  );

  /**
   * Ringing in.
   *
   * A real thing you can do and a real thing that costs something. Doing it
   * when you are actually ill costs almost nothing; doing it when you are not
   * is a gamble on whether anybody works it out.
   */
  sim.onCommand<
    Record<string, never>,
    { paid: boolean; genuine: boolean; caught: boolean; note: string }
  >(
    'job.call_in_sick',
    (_p, { sim: s }) => {
      const held = jobOf(s);
      if (!held) throw new CommandError('You don’t have a job to ring.');
      closeOffMissed(s, held);
      const shift = nextOnTheRota(held);
      if (!shift) throw new CommandError('You aren’t down for anything to ring in about.');
      if (s.now < shift.at - 20 * 60 * MS_MINUTE) {
        throw new CommandError(`You aren’t on until ${formatDate(shift.at, s.homeZone)}. Ring nearer the time.`);
      }
      const person = s.player;
      const wellbeing = person.wellbeing;
      // Genuinely ill is a low condition or a body with nothing left in it.
      const genuine = (wellbeing.condition ?? 100) < 55 || (wellbeing.energy ?? 100) < 22;
      const rng = s.rng('work.sick', held.id, held.sickDays);
      const caught = !genuine && rng.float(0, 100) < 30;

      shift.missed = true;
      held.sickDays += 1;
      const hit = genuine ? SICK_STANDING.genuine : caught ? SICK_STANDING.caught : SICK_STANDING.pulled;
      held.standing = clamp(held.standing + hit, 0, 100);

      // Whether the day is paid depends on where you are, which is real.
      const countryId = countryOfCity(held.cityId) ?? person.citizenshipId;
      const paid = STATUTORY_SICK_PAY.has(countryId) && genuine;
      let owed = 0;
      if (paid) {
        const job = JOB_BY_ID[held.kindId];
        owed = Math.round(wageFor(s, job!, person, held.employerId, held.roleId) * shift.hours * 0.6);
        held.owed += owed;
        held.owedHours += shift.hours;
      }

      s.advanceTo(s.now + 15 * MS_MINUTE);
      if (genuine) wellbeing.stress = clamp((wellbeing.stress ?? 20) - 4, 0, 100);
      s.emit('job.rang_in', { jobId: held.id, genuine, caught, paid });
      return {
        paid,
        genuine,
        caught,
        note: genuine
          ? `You rang in. ${paid
            ? `Statutory sick pay covers some of it: ${formatMoney(owed)} on the timesheet.`
            : 'There’s no sick pay here, so the day is simply not paid.'}`
          : caught
            ? 'You rang in and somebody saw you out. That will be remembered.'
            : 'You rang in. Nobody said anything, and the day isn’t paid.',
      };
    },
  );

  /** Leaving one. */
  sim.onCommand<{ reason?: string }, { earned: Money; shifts: number; note: string }>(
    'job.quit',
    (p, { sim: s }) => {
      const held = jobOf(s);
      if (!held) throw new CommandError('You don’t have a job to leave.');
      held.endedAt = s.now;
      held.endReason = p.reason ?? 'You handed your notice in.';
      // The hours already worked are still owed, and they arrive on the next
      // pay date like everybody else's do.
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
        note: `You’re done at ${held.employerName}. ${formatMoney(held.earned)} across ${plural(held.shifts, 'shift')}.`,
      };
    },
  );

  // --- What arrives on its own ----------------------------------------------

  /**
   * The rota, once a week.
   *
   * Anything on the old one that went past unworked is closed off as missed,
   * which is what it was, and the manager thinks a little less of you for it.
   */
  sim.onSchedule('job.rota', (item, s) => {
    const held = Object.values(s.universe.firstJobs ?? {})
      .find((one) => one.id === (item.payload as { jobId: Id }).jobId);
    if (!held || held.endedAt) return;
    // A call nobody answered is a call somebody else took. It costs nothing,
    // because not answering the phone is not the same as saying no.
    if (held.cover && s.now > held.cover.at) held.cover = undefined;
    const missed = closeOffMissed(s, held);
    // Before a new rota is written, the question of whether you are still on it.
    const gone = letGoFor(held);
    if (gone) { letGo(s, held, gone); return; }
    held.rota = [...held.rota.filter((one) => one.worked || one.missed).slice(-12), ...writeRota(s, held)];
    scheduleRota(s, held);
    if (held.personId !== s.player.id) return;

    const ready = promotionFor(held);
    s.notify({
      title: `The Rota At ${held.employerName}`,
      body: `${plural(shiftsToCome(held).length, 'shift')} next week.`
        + `${missed > 0 ? ` ${plural(missed, 'shift')} missed, and it was noticed.` : ''}`
        + `${ready.ready ? ` They have asked whether you want ${ready.role!.label}.` : ''}`,
      category: 'personal',
      importance: missed > 0 ? 58 : 34,
      route: '/workspace/character',
    });
    // And once in a while somebody rings on a day you are not on.
    const rng = s.rng('work.cover', held.id, held.shifts);
    if (held.shifts >= 2 && rng.float(0, 1) < 0.45) askForCover(s, held, rng.pick(COVER_REASONS));
  });

  /**
   * Payday.
   *
   * The hours on the timesheet, less what is withheld at source, into the
   * account. A period with nothing on the timesheet still has a pay date; it
   * just has nothing on it.
   */
  sim.onSchedule('job.payday', (item, s) => {
    const held = Object.values(s.universe.firstJobs ?? {})
      .find((one) => one.id === (item.payload as { jobId: Id }).jobId);
    if (!held) return;
    if (held.endedAt && held.owed === 0) return;
    const countryId = countryOfCity(held.cityId) ?? s.player.citizenshipId;
    const cycle = CYCLE_DAYS[cycleIn(countryId)];
    const gross = held.owed;
    const hours = held.owedHours;

    if (gross > 0) {
      const { tax, social, net } = deductionsOn(s, gross, held.cityId, cycle);
      const accountId = s.player.primaryAccountId;
      if (accountId && held.personId === s.player.id) {
        s.income(accountId, net, `${held.employerName} — Wages`, 'salary', { refType: 'person', refId: held.personId });
      }
      held.payslips = [...held.payslips, { at: s.now, hours, gross, tax, social, net }].slice(-12);
      held.owed = 0;
      held.owedHours = 0;
      if (held.personId === s.player.id) {
        s.notify({
          title: `Paid By ${held.employerName}`,
          body: `${plural(hours, 'hour')}. ${formatMoney(gross)} gross, ${formatMoney(net)} in. `
            + `${formatMoney(tax + social)} withheld.`,
          category: 'finance',
          importance: 44,
          route: '/workspace/bank',
        });
      }
      s.emit('job.paid', { jobId: held.id, gross, net, hours });
    }
    if (!held.endedAt) schedulePayday(s, held);
  });
}

/**
 * What is withheld from a pay packet, worked out from the published rates.
 *
 * A payslip is a real document with real lines on it, so this does the real
 * arithmetic rather than taking a percentage: the gross is annualised, run
 * through the country's own income tax and payroll rates, and brought back to
 * the period. It is an approximation and the tax module says so.
 */
export function deductionsOn(
  sim: Simulation, gross: Money, cityId: string, cycle: number,
): { tax: Money; social: Money; net: Money } {
  const periods = Math.max(1, Math.round(365 / cycle));
  const annual = gross * periods;
  const yearly = computeAnnualTax(annual, cityId, sim.now, { selfEmployed: false });
  const tax = Math.round((yearly.federal + yearly.regional + yearly.local) / periods);
  const social = Math.round(yearly.payroll / periods);
  const net = Math.max(0, gross - tax - social);
  return { tax, social, net };
}

/** The pay date comes round on the country's own cycle. */
function schedulePayday(sim: Simulation, held: FirstJobHeld): void {
  const countryId = countryOfCity(held.cityId) ?? sim.player.citizenshipId;
  const days = CYCLE_DAYS[cycleIn(countryId)];
  const at = addDays(sim.now, days, sim.homeZone);
  held.nextPayAt = at;
  sim.schedule({
    at,
    kind: 'job.payday',
    label: 'Payday',
    category: 'finance',
    payload: { jobId: held.id },
    priority: 22,
  });
}

/** The rota comes out once a week, and it is a thing that arrives. */
function scheduleRota(sim: Simulation, held: FirstJobHeld): void {
  sim.schedule({
    at: addDays(sim.now, 7, sim.homeZone),
    kind: 'job.rota',
    label: 'The Rota',
    category: 'personal',
    payload: { jobId: held.id },
    priority: 18,
  });
}

export {
  BRANCH_NOTE, COVER_NOTE, CYCLE_DAYS, EMPLOYER_NOTE, FIRST_JOBS, JOB_BY_ID, JOB_NOTE,
  LADDER_NOTE, LETTING_GO_NOTE, LOCAL_MINIMUMS, LOCAL_NOTE, NO_MINIMUM_NOTE, PAY_STANCE, ROLES,
  ROLE_BY_ID,
  ROTA_SHIFTS, SECTOR_LABEL, SHIFTS_A_WEEK, SHIFT_BY_ID, SHIFT_KINDS, STATE_NOTE, STATUTORY_SICK_PAY,
  WAGE_NOTE, YOUNG_NOTE, cycleIn, employersAreCountrys, employersIn, floorIn, floorIsCountrys,
  jobsAt, nextRole, youngShareAt,
};

/**
 * The call on a day off.
 *
 * The most ordinary thing about this kind of work. It goes where everything
 * that needs deciding goes, with both answers on it, because both are answers.
 */
export function askForCover(sim: Simulation, held: FirstJobHeld, reason: string): void {
  const job = JOB_BY_ID[held.kindId];
  const rng = sim.rng('work.cover_when', held.id, held.shifts);
  const kind = rng.pick(SHIFT_KINDS);
  const at = addDays(sim.now, rng.int(1, 3), sim.homeZone);
  held.cover = {
    at, kindId: kind.id, hours: job?.hours ?? 6, reason, askedAt: sim.now,
  };
  if (held.personId !== sim.player.id) return;
  sim.requireDecision({
    urgency: 46,
    category: 'career',
    title: `${held.employerName} Are Ringing`,
    detail: `${reason} They want you in on ${formatDate(at, sim.homeZone)}, `
      + `${kind.label.toLowerCase()}, ${plural(job?.hours ?? 6, 'hour')}. It’s your day off.`,
    route: '/workspace/character',
    refType: 'person',
    refId: held.personId,
    actions: [
      { label: 'Say You Will Come In', commandKind: 'job.cover', payload: {} },
      { label: 'Say No', commandKind: 'job.decline_cover', payload: {} },
    ],
  });
  sim.emit('job.cover_asked', { jobId: held.id, at });
}
