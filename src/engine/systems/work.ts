/**
 * SLATE — the jobs a person actually takes to keep the lights on.
 *
 * Being the best actor or actress alive is not a wage. Until the work arrives
 * somebody has to pay rent, and this is where that money comes from: real
 * companies that really hire at this level, in the countries they really trade
 * in, paying against the legal floor where the character is standing.
 *
 * What is real here and what is SLATE's own is worth being exact about, and
 * the notes in `content/work.ts` and `content/employers.ts` say it in full.
 * In short: the floors are published figures, the companies and the countries
 * they operate in are real, and how each one sits against the floor — well
 * above it, above it, at it — is a durable public fact rather than a claim
 * about anybody's payroll. Which branch, whose shift, and every word anybody
 * says on it are the game's.
 *
 * This is the wage half. The rota, the manager, the cover shift and being let
 * go went with the cut-down and are not back yet; what is here is what a job
 * pays, who is hiring where you stand, and the arithmetic to compare them.
 */

import type { Money } from '../core/money';
import type { Person } from '../domain/model';
import type { Simulation } from '../core/simulation';
import { ageOnDate } from '../core/time';
import { CITIES, REGIONS, countryOfCity } from '../content/geography';
import { costOfLiving } from '../content/tax';
import {
  DERIVED_ANCHOR, DERIVED_AT_COST, FIRST_JOBS, JOB_BY_ID, LOCAL_MINIMUMS, STATE_FLOORS,
  WORLD_FLOOR, FLOOR_BY_COUNTRY, type FirstJob, type WageFloor, floorIn, youngShareAt,
} from '../content/work';
import {
  EMPLOYER_BY_ID, PAY_STANCE, ROLE_BY_ID, SECTOR_LABEL, employersIn, type Employer,
} from '../content/employers';

/** Somebody's age, in whole years, on the day the world is on. */
export function ageOf(sim: Simulation, person: Person = sim.player): number {
  const born = new Date(person.birthInstant);
  const now = new Date(sim.now);
  return ageOnDate(
    { year: born.getUTCFullYear(), month: born.getUTCMonth() + 1, day: born.getUTCDate() },
    { year: now.getUTCFullYear(), month: now.getUTCMonth() + 1, day: now.getUTCDate() },
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

/** Which state's floor applies where somebody is standing, for saying so on a page. */
export function stateFloorNameFor(sim: Simulation, person: Person = sim.player): string | undefined {
  const city = CITIES.get(person.currentLocationId ?? '');
  if (!city || city.countryId !== 'us') return undefined;
  return REGIONS.get(city.parentId)?.name;
}

/**
 * The floor where somebody is standing.
 *
 * A published figure where SLATE carries one. Where it does not — two hundred
 * of the two hundred and fifty two countries in the gazetteer, and just under
 * a quarter of the people alive — the floor is derived from what that city
 * costs rather than being one flat number for all of them, and it says that
 * is what it is.
 */
export function floorHere(sim: Simulation, person: Person = sim.player): WageFloor {
  const countryId = countryOfCity(person.currentLocationId) ?? person.citizenshipId;
  return floorFor(countryId, person.currentLocationId);
}

/** Whether the figure for this country is published or worked out from the city. */
export function floorIsCarried(countryId: string): boolean {
  return FLOOR_BY_COUNTRY[countryId] !== undefined;
}

/**
 * The floor for a country, derived from the city where nothing is published.
 *
 * The derivation is stated in `DERIVED_NOTE` and never goes below the world
 * floor. A city SLATE cannot resolve falls back to the flat figure, because
 * there is then nothing to derive from.
 */
export function floorFor(countryId: string, cityId?: string): WageFloor {
  const carried = FLOOR_BY_COUNTRY[countryId];
  if (carried) return carried;
  const city = CITIES.get(cityId ?? '');
  if (!city) return floorIn(countryId);
  const derived = Math.round(DERIVED_ANCHOR * (costOfLiving(city.id) / DERIVED_AT_COST));
  return {
    countryId,
    perHour: Math.max(WORLD_FLOOR, derived),
    statutory: false,
    year: 2024,
    about: 'SLATE carries no published figure for this country, so this is worked out from what '
      + 'this city costs against the countries it does carry. It’s an estimate.',
  };
}

/**
 * What this job pays this person, per hour, in this city.
 *
 * The country's floor, moved by what the city costs, lifted by what the job is
 * worth, and cut by the young rate where a young worker is legally paid less —
 * which is a real arrangement in a lot of countries.
 */
export function wageFor(
  sim: Simulation, job: FirstJob, person: Person = sim.player,
  employerId?: string, roleId = 'crew',
): Money {
  const countryId = countryOfCity(person.currentLocationId) ?? person.citizenshipId;
  const floor = floorFor(countryId, person.currentLocationId);
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
  // No clamp above the arithmetic. Nigeria publishes a floor of thirty cents an
  // hour and a night in a warehouse there is worth a fifth more than a
  // checkout; a fifty cent minimum erased both facts and paid every job in
  // Lagos exactly the same. The published floor is the number, low or not,
  // and the only guard is against zero.
  return Math.max(
    1,
    Math.round(local * job.premium * company * role * youngShareAt(ageOf(sim, person))),
  );
}

/** What one shift at this job would pay, before anything comes off it. */
export function shiftPay(
  sim: Simulation, job: FirstJob, person: Person = sim.player,
  employerId?: string, roleId = 'crew',
): Money {
  return wageFor(sim, job, person, employerId, roleId) * job.hours;
}

/** One job somebody could actually take, where they stand. */
export interface Opening {
  job: FirstJob;
  /** The real company, where SLATE carries one that trades here. */
  employer?: Employer;
  /**
   * Where the work happens, for the page to print: a company by name, or the
   * kind of place it is where no named company is carried.
   */
  placeLabel: string;
  /** True when this is a kind of place rather than a named business. */
  unbranded: boolean;
  perHour: Money;
  perShift: Money;
}

/**
 * Everything hiring where this person is standing.
 *
 * A job appears when they are old enough for it. Where the job names a sector,
 * it is offered by each real company in that sector that trades in this
 * country; where it does not, it is offered on its own, because walking dogs
 * has no employer.
 *
 * Sorted by what it pays, best first, because that is the question somebody
 * looking at this list is actually asking.
 */
export function openingsFor(sim: Simulation, person: Person = sim.player): Opening[] {
  const countryId = countryOfCity(person.currentLocationId) ?? person.citizenshipId;
  const age = ageOf(sim, person);
  const local = employersIn(countryId);
  const out: Opening[] = [];

  for (const job of FIRST_JOBS) {
    if (age < job.fromAge) continue;
    const hiring = job.sector ? local.filter((one) => one.sector === job.sector) : [];

    if (hiring.length === 0) {
      // Either the job has no sector — nobody employs you to walk dogs — or it
      // has one and SLATE carries no company that trades here. A supermarket
      // exists in Lagos whether or not this game knows a name to put on it, so
      // the work is offered as the kind of place it is. Naming a company that
      // might not trade there would be the dishonest way to fill this in.
      out.push({
        job,
        placeLabel: job.sector ? SECTOR_LABEL[job.sector] : job.label,
        unbranded: job.sector !== undefined,
        perHour: wageFor(sim, job, person),
        perShift: shiftPay(sim, job, person),
      });
      continue;
    }

    for (const employer of hiring) {
      out.push({
        job,
        employer,
        placeLabel: employer.name,
        unbranded: false,
        perHour: wageFor(sim, job, person, employer.id),
        perShift: shiftPay(sim, job, person, employer.id),
      });
    }
  }
  return out.sort((a, b) => b.perHour - a.perHour || a.job.label.localeCompare(b.job.label, 'en'));
}

/** One opening, by the job and the company it is at. */
export function openingFor(
  sim: Simulation, jobId: string, employerId?: string, person: Person = sim.player,
): Opening | undefined {
  const job = JOB_BY_ID[jobId];
  if (!job) return undefined;
  const employer = employerId ? EMPLOYER_BY_ID[employerId] : undefined;
  if (employerId && !employer) return undefined;
  return {
    job,
    employer,
    placeLabel: employer?.name ?? (job.sector ? SECTOR_LABEL[job.sector] : job.label),
    unbranded: !employer && job.sector !== undefined,
    perHour: wageFor(sim, job, person, employerId),
    perShift: shiftPay(sim, job, person, employerId),
  };
}
