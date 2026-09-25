/**
 * SLATE — the day job.
 *
 * Nothing earned money until this. The film career went in the gut, and with
 * it every wage, so the balances a save started with were the balances it
 * kept. Now every character has the survival job their past leads to
 * (`content/jobs.ts`): shifts on the calendar at a real employer where they
 * live (`content/employers.ts`), paid its published rate or the
 * occupation's typical pay and never under the legal floor
 * (`content/wages.ts`), on the payday that country's employers use, with a
 * payslip worked by the country's own rules (`content/payroll.ts`). At
 * first it paid the floor times a premium SLATE estimated, less one rate
 * from the tax engine.
 *
 * A shift is a commitment like a plan. The clock stops at it; Go works it and
 * Call In Sick doesn't. Run over without a stop, as autopilot and a long
 * skip do, it is worked if they are awake and in town, because that is what
 * somebody left to their own life does. Asleep when it starts, or somewhere
 * else, it is missed. Three missed in four weeks and they are let go, and it
 * takes three weeks to find the same kind of work again.
 *
 * A worked shift costs the body more than an hour going by: an hour's more
 * energy and half an hour's stress for every hour on, charged as it starts.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import type { ScheduledItem } from '../core/scheduler';
import { CITIES, COUNTRIES, jurisdictionPath } from '../content/geography';
import { EMPLOYERS, type Employer } from '../content/employers';
import { payrollYear, type PayslipLine } from '../content/payroll';
import { laborAt, quitNoticeDays, type LaborLaw, type Premium } from '../content/labor';
import { holidaysOn } from '../content/holidays';
import { jobFor, patternHours, patternOf, payCycleFor, tipsPerHour, type Job } from '../content/jobs';
import { CommandError } from '../core/simulation';
import { mayWorkIn } from '../domain/citizenship';
import { outdoorWeather } from './weather';
import { minimumWageAt } from '../content/wages';
import { exchange } from '../content/currency';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import {
  addDays, dateKey, formatTime, instantFromZoned, startOfNextDay, zonedParts, MS_DAY, MS_HOUR, type Instant,
} from '../core/time';
import { clamp } from '../core/rng';
import { personalityOf } from './personality';

export const SHIFT_KIND = 'work.shift';
export const PAYDAY_KIND = 'work.payday';
export const TIPS_KIND = 'work.tips';

/** How much notice a change of hours takes. */
const NOTICE = 7 * MS_DAY;
/** How far ahead the rota is on the calendar. */
const ROTA_DAYS = 14;
/** Missed shifts in this window that cost the job, and how long finding another takes. */
const STRIKES = 3;
const STRIKE_WINDOW = 28 * MS_DAY;
const LOOKING_FOR = 21 * MS_DAY;

/** What a worked hour takes out of somebody beyond the hour itself. */
const SHIFT_ENERGY_PER_HOUR = 1.0;
const SHIFT_STRESS_PER_HOUR = 0.5;

export interface JobState {
  /** The job, by its Before Acting id (`content/jobs.ts`). */
  jobId: string;
  /** The real employer it's for (`content/employers.ts`), where the country has them on record. */
  employerId?: string;
  /** The town the work is in. */
  cityId: string;
  since: Instant;
  /**
   * Shifts worked and not yet paid, by when they started, with the premiums
   * each earned in hours at the base rate; and the leave, sick days and rest
   * days the law pays for them.
   */
  unpaid: UnpaidEntry[];
  /** Paid annual leave built up, and sick time where it builds, in hours. */
  leaveHours?: number;
  /** The same leave by the leave year it was earned in, oldest first, where the law makes it lapse. */
  leaveYears?: { year: string; hours: number; warned?: boolean }[];
  sickHours?: number;
  /** Paid sick days used this year, where the law gives a number of days. */
  sickDays?: { year: number; days: number };
  /** The spell of sickness a day called in belongs to: its last day and how many days so far. */
  sickSpell?: { day: string; count: number };
  /** The week's hours and overtime so far, for overtime, and whether its rest day was paid. */
  week?: { key: string; hours: number; overtime: number; restPaid?: boolean };
  /** What the next payday pays besides hours: the law's extra payments, leave paid out. */
  pendingPay?: { name: string; amount: Money }[];
  /** The extra payments already paid, by name and year, so none is paid twice. */
  extrasPaid?: string[];
  /** Notice given: the job ends here. */
  leavingAt?: Instant;
  /** A new employer hired them, starting when the notice here runs out. */
  switchTo?: { employerId: string; jobId: string; at: Instant };
  /** The employer that let them go, so the next work isn't there. */
  letGoBy?: string;
  /** When each shift in the last four weeks was missed. */
  missed: Instant[];
  /** The rota is on the calendar up to here. */
  rotaThrough: Instant;
  /** Let go, and looking for work until this. */
  lookingUntil?: Instant;
  /** Five eight-hour days rather than the job's own part-time week (`patternOf`). */
  fullTime?: boolean;
  /** When a change of hours takes effect, while it's still ahead. */
  hoursFrom?: Instant;
  /** Quit, and kept only until the last pay clears. */
  quitAt?: Instant;
  /** The last payday's payslip, line by line, for the work screen. */
  lastSlip?: { at: Instant; hours: number; gross: Money; grossLines?: { name: string; amount: Money }[]; lines: PayslipLine[]; employerPension: Money; employerPensionName?: string; estimate?: boolean };
}

export interface UnpaidEntry {
  at: Instant;
  hours: number;
  /** Worked, unless it's paid leave, a sick day or Korea's weekly rest day. */
  kind?: 'leave' | 'sick' | 'rest';
  /** Premiums the shift earned, each in hours at the base rate. */
  extras?: { name: string; hours: number }[];
  /** A sick day's share of pay, and the most a day pays, in the save's money. */
  share?: number;
  capDay?: Money;
}

/** The law where a job is (`content/labor.ts`). */
export function lawOf(state: JobState): LaborLaw | undefined {
  return CITIES.get(state.cityId) ? laborAt(jurisdictionPath(state.cityId)) : undefined;
}

/** The first day of the leave year an instant falls in, as YYYY-MM-DD: the hiring's anniversary, or a fixed date. */
export function leaveYearOf(state: JobState, yearStart: string, at: Instant, zone: string): string {
  const p = zonedParts(at, CITIES.get(state.cityId)?.timeZone ?? zone);
  const [m, d] = yearStart === 'hire'
    ? (() => { const h = new Date(state.since); return [h.getUTCMonth() + 1, h.getUTCDate()]; })()
    : yearStart.split('-').map(Number) as [number, number];
  const startThisYear = Date.UTC(p.year, m - 1, d);
  const today = Date.UTC(p.year, p.month - 1, p.day);
  const year = today >= startThisYear ? p.year : p.year - 1;
  return new Date(Date.UTC(year, m - 1, d)).toISOString().slice(0, 10);
}

/** So many months after a UTC instant, at the same day of the month. */
function addMonthsLocal(at: Instant, months: number): Instant {
  const d = new Date(at);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + months, d.getUTCDate());
}

/** Months with the employer so far. */
export function monthsWith(state: JobState, at: Instant): number {
  return (at - state.since) / (30.4375 * MS_DAY);
}

/** A local day's key, YYYY-MM-DD, where the job is. */
function localDay(state: JobState, at: Instant, fallback: string): string {
  return dateKey(at, CITIES.get(state.cityId)?.timeZone ?? fallback);
}

/** The Monday a local day's week starts on, as its key. */
function weekKey(state: JobState, at: Instant, fallback: string): string {
  const zone = CITIES.get(state.cityId)?.timeZone ?? fallback;
  const p = zonedParts(at, zone);
  const date = new Date(Date.UTC(p.year, p.month - 1, p.day));
  const back = (date.getUTCDay() + 6) % 7;
  return new Date(Date.UTC(p.year, p.month - 1, p.day - back)).toISOString().slice(0, 10);
}

/**
 * The premiums a shift earns under the law where it's worked, and its
 * overtime past the week's or the day's limit, each in hours at the base
 * rate. A public holiday's premium stands in for a Sunday's.
 */
export function premiumsFor(sim: Simulation, state: JobState, at: Instant, hours: number): { name: string; hours: number }[] {
  const law = lawOf(state);
  if (!law) return [];
  const city = CITIES.get(state.cityId);
  const zone = city?.timeZone ?? sim.homeZone;
  const p = zonedParts(at, zone);
  const weekday = new Date(Date.UTC(p.year, p.month - 1, p.day)).getUTCDay();
  const covers = (premium: Premium | undefined): premium is Premium => premium !== undefined && (!premium.lines || premium.lines.includes(state.jobId));
  const out: { name: string; hours: number }[] = [];
  const extraOf = (premium: Premium) => premium.byLine?.[state.jobId] ?? premium.extra;
  const mmdd = `${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
  const holiday = city ? holidaysOn(at, zone, city.countryId, city.parentId).some((one) => one.type === 'public'
    && (!law.holiday?.only || law.holiday.only.some((key) => key === mmdd || one.englishName.includes(key)))) : false;
  if (holiday && covers(law.holiday)) out.push({ name: 'Holiday Premium', hours: hours * extraOf(law.holiday) });
  else if (weekday === 0 && covers(law.sunday)) out.push({ name: 'Sunday Premium', hours: hours * extraOf(law.sunday) });
  else if (weekday === 6 && covers(law.saturday)) out.push({ name: 'Saturday Premium', hours: hours * extraOf(law.saturday) });
  const start = p.hour + p.minute / 60;
  const overlap = (from: number, to: number) => [0, -24].reduce((sum, shift) => sum + Math.max(0, Math.min(start + hours, to + shift) - Math.max(start, from + shift)), 0);
  if (covers(law.evening)) {
    const h = overlap(law.evening.from, law.evening.to);
    if (h > 0) out.push({ name: 'Evening Premium', hours: h * law.evening.extra });
  }
  if (covers(law.night)) {
    const h = overlap(law.night.from, law.night.to);
    if (h > 0) out.push({ name: 'Night Premium', hours: h * law.night.extra });
  }
  const ot = law.overtime;
  if (ot) {
    const key = weekKey(state, at, sim.homeZone);
    const week = state.week?.key === key ? state.week : { key, hours: 0, overtime: 0 };
    const pastWeek = ot.week !== undefined ? Math.max(0, week.hours + hours - ot.week) - Math.max(0, week.hours - ot.week) : 0;
    const pastDay = ot.day !== undefined ? Math.max(0, hours - ot.day) : 0;
    const over = Math.max(pastWeek, pastDay);
    if (over > 0) {
      const first = Math.max(0, Math.min(over, (ot.tierAfter ?? Number.POSITIVE_INFINITY) - week.overtime));
      out.push({ name: 'Overtime', hours: first * ot.extra + (over - first) * (ot.tierExtra ?? ot.extra) });
    }
    state.week = { ...week, hours: week.hours + hours, overtime: week.overtime + over };
  } else {
    const key = weekKey(state, at, sim.homeZone);
    state.week = state.week?.key === key ? { ...state.week, hours: state.week.hours + hours } : { key, hours, overtime: 0 };
  }
  return out;
}

/**
 * What a person is owed on leaving: annual leave not taken where the law
 * pays it out, with its loading, and Korea's severance after a year. Put on
 * the last payday.
 */
function finalPay(sim: Simulation, person: Person): void {
  const state = person.job;
  const law = state ? lawOf(state) : undefined;
  if (!state || !law) return;
  const rate = hourlyWage(sim, person);
  const pending = state.pendingPay ?? [];
  if (law.leave?.paidOut && (state.leaveHours ?? 0) > 0) {
    pending.push({ name: 'Leave Not Taken', amount: Math.round((state.leaveHours ?? 0) * rate * (1 + (law.leave.loading ?? 0))) });
  }
  state.leaveHours = 0;
  state.leaveYears = [];
  const weekly = patternHours(patternOf(jobFor(state.jobId), state.fullTime));
  const months = monthsWith(state, sim.now);
  if (law.severance && months >= law.severance.afterMonths && weekly >= law.severance.minHours) {
    const daily = (weekly * rate) / 7;
    pending.push({ name: 'Severance', amount: Math.round(daily * law.severance.daysAYear * (months / 12)) });
  }
  state.pendingPay = pending;
}

export function jobOf(person: Person): Job | undefined {
  return person.job ? jobFor(person.job.jobId) : undefined;
}

/** The country a town is in: its ISO code and its money. */
export function countryAt(cityId: string): { iso: string; currency: string } {
  const city = CITIES.get(cityId);
  const country = city ? COUNTRIES.get(city.countryId) : undefined;
  return { iso: country?.jurisdictionCode ?? '', currency: country?.currency.toUpperCase() ?? 'USD' };
}

/** The employers on record for a line of work in a country, and the line's typical pay. */
export function employersFor(cityId: string, jobId: string): readonly Employer[] {
  return EMPLOYERS[countryAt(cityId).iso]?.[jobId]?.employers ?? [];
}

export function employerById(cityId: string, employerId: string | undefined): Employer | undefined {
  if (!employerId) return undefined;
  for (const line of Object.values(EMPLOYERS[countryAt(cityId).iso] ?? {})) {
    const found = line.employers.find((one) => one.id === employerId);
    if (found) return found;
  }
  return undefined;
}

/**
 * The employer a person starts with in their line: the first on record that
 * hires where they are, or the first on record at all. The player can apply
 * to any other (`work.apply`).
 */
export function firstEmployer(cityId: string, jobId: string): Employer | undefined {
  const all = employersFor(cityId, jobId);
  const city = CITIES.get(cityId);
  const here = all.find((one) => city && one.where.toLowerCase().includes(city.name.toLowerCase()));
  return here ?? all.find((one) => /national/i.test(one.where)) ?? all[0];
}

/**
 * What an hour pays, and why: the employer's own published starting rate;
 * where it publishes none, the occupation's typical pay from the country's
 * statistics office; where the country has neither, the legal floor times
 * the job's premium, which is SLATE's estimate. Never under the legal floor.
 * Until 2026-09-25 every job was paid the floor times the premium.
 */
export interface Rate {
  hourly: Money;
  basis: 'employer' | 'line' | 'typical' | 'estimate';
  source?: string;
  note?: string;
}

export function rateAt(cityId: string, jobId: string, currency: string, at: Instant, employerId?: string, age?: number): Rate {
  const floor = minimumWageAt(cityId, at, currency, age);
  const toSave = (amount: number, from: string) => (from === currency ? amount : exchange(amount, from, currency) ?? amount);
  const floorInSave = toSave(floor.hourly, floor.currency);
  const local = countryAt(cityId).currency;
  const employer = employerById(cityId, employerId);
  if (employer?.hourlyFrom !== undefined) {
    return { hourly: Math.max(floorInSave, toSave(employer.hourlyFrom, local)), basis: 'employer', source: employer.source, ...(employer.payNote ? { note: employer.payNote } : {}) };
  }
  // An employer that publishes no rate: what the others in the line publish
  // for a start, their median, before the statistics office's figure, which
  // is a median of everybody in the work and runs above a new hire's pay.
  // Dublin's café work was paid the CSO's €18.08 sector mean, managers and
  // all, until 2026-09-25.
  const published = employersFor(cityId, jobId).map((one) => one.hourlyFrom).filter((one): one is number => one !== undefined).sort((a, b) => a - b);
  if (published.length > 0) {
    const mid = published.length % 2 === 1 ? published[(published.length - 1) / 2]! : Math.round((published[published.length / 2 - 1]! + published[published.length / 2]!) / 2);
    return { hourly: Math.max(floorInSave, toSave(mid, local)), basis: 'line', note: `the median of what ${published.length} employers in the line publish` };
  }
  const typical = EMPLOYERS[countryAt(cityId).iso]?.[jobId]?.typical;
  if (typical) return { hourly: Math.max(floorInSave, toSave(typical.hourly, local)), basis: 'typical', source: typical.source, note: typical.period };
  return { hourly: Math.round(floorInSave * jobFor(jobId).overMinimum), basis: 'estimate', ...(floor.source ? { source: floor.source } : {}) };
}

/** What an hour of their work pays, in the save's money (`rateAt`). */
export function hourlyWage(sim: Simulation, person: Person): Money {
  const state = person.job;
  return state ? rateAt(state.cityId, state.jobId, saveCurrency(sim.universe), sim.now, state.employerId, ageOf(person, sim.now)).hourly : 0;
}

/** The same, for a job in a town at a date, in a currency: for a screen with no save yet. */
export function wageAt(cityId: string, jobId: string, currency: string, at: Instant, employerId = firstEmployer(cityId, jobId)?.id): Money {
  return rateAt(cityId, jobId, currency, at, employerId).hourly;
}

/** How many paydays a year the country's cycle has. */
export function paydaysAYear(cityId: string): number {
  const cycle = payCycleFor(countryAt(cityId).iso);
  return cycle.kind === 'weekly' ? 52 : cycle.kind === 'biweekly' ? 26 : cycle.kind === 'semimonthly' ? 24 : 12;
}

/**
 * A payslip for a period's gross pay, in the save's money: each line the
 * country takes, worked on the year (`content/payroll.ts`), and what the
 * employer puts into the worker's pension. Worked in the country's own
 * money, and brought back.
 */
export function payslipAt(cityId: string, gross: Money, currency: string, at: Instant, extra: { age: number; lastYear?: Money; weeklyHours?: number }): { lines: PayslipLine[]; employerPension: number; employerPensionName?: string; estimate?: boolean } {
  const { iso, currency: local } = countryAt(cityId);
  const periods = paydaysAYear(cityId);
  const toLocal = (amount: number) => (local === currency ? amount : exchange(amount, currency, local) ?? amount);
  const fromLocal = (amount: number) => (local === currency ? amount : exchange(amount, local, currency) ?? amount);
  const yearly = toLocal(gross) * periods;
  const year = payrollYear(iso, yearly, {
    path: jurisdictionPath(cityId), cityId, at, age: extra.age, weeklyHours: extra.weeklyHours,
    ...(extra.lastYear !== undefined ? { lastYear: toLocal(extra.lastYear) / 100 } : {}),
    usdPerUnit: (exchange(100_00, local, 'USD') ?? 100_00) / 100_00,
  });
  return {
    lines: year.lines.map((line) => ({ ...line, amount: Math.round(fromLocal(line.amount) / periods) })),
    employerPension: Math.round(fromLocal(year.employerPension) / periods),
    ...(year.employerPensionName ? { employerPensionName: year.employerPensionName } : {}),
    ...(year.estimate ? { estimate: true } : {}),
  };
}

/**
 * The share of a wage that doesn't reach the bank, at what the job pays in a
 * year: every line of the payslip, the pension among them.
 */
export function withholdingRate(sim: Simulation, person: Person): number {
  const state = person.job;
  return state ? withholdingAt(state.cityId, state.jobId, saveCurrency(sim.universe), sim.now, state.fullTime, ageOf(person, sim.now)) : 0;
}

export function withholdingAt(cityId: string, jobId: string, currency: string, at: Instant, fullTime = false, age = 30): number {
  const pattern = patternOf(jobFor(jobId), fullTime);
  const gross = Math.round((wageAt(cityId, jobId, currency, at) * patternHours(pattern) * 52) / paydaysAYear(cityId));
  if (gross <= 0) return 0;
  const slip = payslipAt(cityId, gross, currency, at, { age, weeklyHours: patternHours(pattern) });
  return slip.lines.reduce((sum, line) => sum + line.amount, 0) / gross;
}

/** Age in whole years at an instant. */
function ageOf(person: Person, at: Instant): number {
  return Math.floor((at - person.birthInstant) / (365.2425 * MS_DAY));
}

/** The wages paid over a calendar year, gross, for a tax levied on last year's pay. */
function wagesInYear(sim: Simulation, person: Person, year: number): Money {
  const from = Date.UTC(year, 0, 1);
  const to = Date.UTC(year + 1, 0, 1);
  const wages = sim.nominalAccount('income', 'Wages').id;
  let total = 0;
  for (const t of sim.universe.transactions) {
    if (t.at < from || t.at >= to || t.category !== 'salary') continue;
    if (!t.postings.some((p) => p.accountId === person.primaryAccountId || sim.universe.accounts[p.accountId]?.ownerId === person.id)) continue;
    for (const p of t.postings) if (p.accountId === wages && p.amount < 0) total += -p.amount;
  }
  return total;
}

/** The fund a country's pension contributions go into, by its own name. */
const FUNDS: Readonly<Record<string, string>> = {
  IS: 'Lífeyrissjóður', NZ: 'KiwiSaver', AU: 'Superannuation', GB: 'Workplace Pension', IE: 'My Future Fund', MX: 'Afore',
};

/** The person's pension fund, opened the first time anything is paid into it. */
function pensionFund(sim: Simulation, person: Person, iso: string): string {
  const found = Object.values(sim.universe.accounts).find((a) => a.ownerId === person.id && !a.closedAt && a.category === 'pension');
  if (found) return found.id;
  return sim.openAccount({
    id: sim.nextId('account'), kind: 'brokerage', category: 'pension', name: FUNDS[iso] ?? 'Pension', ownerId: person.id, openedAt: sim.now,
  }).id;
}

/**
 * What a shift's tips come to, in the save's money: the country's custom for
 * the job (`tipsPerHour`), for the hours worked.
 */
export function tipsFor(sim: Simulation, person: Person, hours: number): Money {
  const state = person.job;
  if (!state) return 0;
  const city = CITIES.get(state.cityId);
  const country = city ? COUNTRIES.get(city.countryId) : undefined;
  const perHour = tipsPerHour(state.jobId, country?.jurisdictionCode ?? '');
  if (perHour <= 0) return 0;
  const inSave = exchange(perHour, country?.currency.toUpperCase() ?? 'USD', saveCurrency(sim.universe)) ?? perHour;
  return Math.round(inSave * hours);
}

/** Takes the job their past leads to, in the town they are in, from now. */
export function hire(sim: Simulation, person: Person): void {
  const jobId = person.beforeActing ?? 'school';
  const employer = firstEmployer(person.currentLocationId, jobId);
  person.job = {
    jobId,
    ...(employer ? { employerId: employer.id } : {}),
    cityId: person.currentLocationId,
    since: sim.now,
    unpaid: person.job?.unpaid ?? [],
    ...(person.job?.pendingPay?.length ? { pendingPay: person.job.pendingPay } : {}),
    missed: [],
    rotaThrough: sim.now,
  };
  fillRota(sim, person);
}

/** Puts every shift of the next two weeks on the calendar that isn't on it. */
export function fillRota(sim: Simulation, person: Person): void {
  const state = person.job;
  if (!state || state.lookingUntil !== undefined || state.quitAt !== undefined) return;
  const job = jobFor(state.jobId);
  const week = patternOf(job, state.fullTime);
  const zone = CITIES.get(state.cityId)?.timeZone ?? sim.homeZone;
  const until = sim.now + ROTA_DAYS * MS_DAY;
  let day = zonedParts(Math.max(state.rotaThrough, sim.now), zone);
  for (let n = 0; n <= ROTA_DAYS + 1; n += 1) {
    const at = instantFromZoned({ year: day.year, month: day.month, day: day.day, hour: week.startHour }, zone);
    const weekday = new Date(Date.UTC(day.year, day.month - 1, day.day)).getUTCDay();
    if (at > state.rotaThrough && at > sim.now && at <= until && week.days.includes(weekday)) {
      sim.schedule({
        at, kind: SHIFT_KIND, label: `${job.title} Shift`, category: 'work', priority: 30,
        requiresPlayer: true, durationMinutes: week.hours * 60, locationId: state.cityId,
        payload: { personId: person.id, hours: week.hours },
      });
    }
    day = zonedParts(startOfNextDay(instantFromZoned({ year: day.year, month: day.month, day: day.day }, zone), zone), zone);
  }
  state.rotaThrough = until;
}

/** The shift somebody is on right now, if they are on one. */
export function onShift(sim: Simulation): ScheduledItem | undefined {
  return sim.timeline.overlapping(sim.now - 24 * MS_HOUR, sim.now).find((item) =>
    item.kind === SHIFT_KIND && item.status === 'done' && item.payload.worked === true
    && item.at <= sim.now && sim.now < item.at + (item.durationMinutes ?? 0) * 60_000);
}

/** Records a missed shift, and lets them go on the third in four weeks. */
function strike(sim: Simulation, person: Person, at: Instant): void {
  const state = person.job;
  if (!state) return;
  state.missed = [...state.missed.filter((when) => at - when < STRIKE_WINDOW), at];
  if (state.missed.length < STRIKES) return;
  for (const item of sim.timeline.pending()) {
    if (item.kind === SHIFT_KIND && item.at > sim.now) sim.timeline.cancel(item.id, sim.now);
  }
  finalPay(sim, person);
  state.lookingUntil = sim.now + LOOKING_FOR;
  state.missed = [];
  if (state.employerId) state.letGoBy = state.employerId;
  sim.notify({
    category: 'work',
    title: `Let Go From ${jobFor(state.jobId).title}`,
    body: `Three missed shifts in four weeks. Finding the same kind of work again will take about three weeks, and until then nothing comes in.`,
    importance: 80,
  });
}

/**
 * Calling in sick for a shift that has come round: it counts against them at
 * work, and it's paid where the law pays a sick day: from the day of the
 * spell it pays from, at its rate and cap, out of the days or hours it
 * gives. Until 2026-09-25 no sick day was paid anywhere.
 */
export function callIn(sim: Simulation, item: ScheduledItem): void {
  const person = sim.universe.people[String(item.payload.personId ?? sim.universe.playerId)];
  item.status = 'missed';
  item.resolvedAt = sim.now;
  if (!person) return;
  const hours = Number(item.payload.hours) || 0;
  const paid = person.job ? sickPay(sim, person, item.at, hours) : 0;
  // A sick day the law pays for can't be held against a worker: New York,
  // California, Washington and Illinois forbid it outright, and it's the
  // point of a paid sick day everywhere. Until 2026-09-25 every day called
  // in counted toward being let go, paid or not.
  const protectedDay = paid >= hours && hours > 0;
  sim.notify({
    category: 'work',
    title: 'You Called In Sick',
    body: protectedDay
      ? `The ${hours} hours are paid as sick pay, and a paid sick day isn’t held against you.`
      : paid > 0
        ? `${paid} of the ${hours} hours are paid as sick pay, and a missed shift counted against you at work.`
        : `No pay for the ${hours} hours, and a missed shift counted against you at work.`,
    importance: 45,
  });
  if (!protectedDay) strike(sim, person, sim.now);
}

/** Books a day's sick pay, where the law pays it, and says how many hours it covers. */
function sickPay(sim: Simulation, person: Person, at: Instant, hours: number): number {
  const state = person.job;
  const law = state ? lawOf(state) : undefined;
  const sick = law?.sick;
  if (!state || !sick || monthsWith(state, at) < (sick.afterMonths ?? 0)) return 0;
  const weekly = patternHours(patternOf(jobFor(state.jobId), state.fullTime));
  // Japan's sickness allowance is for the insured, from 20 hours a week.
  if (countryAt(state.cityId).iso === 'JP' && weekly < 20) return 0;
  const today = localDay(state, at, sim.homeZone);
  const yesterday = localDay(state, at - MS_DAY, sim.homeZone);
  const spell = state.sickSpell && (state.sickSpell.day === yesterday || state.sickSpell.day === today)
    ? { day: today, count: state.sickSpell.day === today ? state.sickSpell.count : state.sickSpell.count + 1 }
    : { day: today, count: 1 };
  state.sickSpell = spell;
  if (spell.count < sick.fromDay) return 0;
  let covered = hours;
  if (sick.accrual !== undefined) {
    const year = new Date(at).getUTCFullYear();
    const usedHours = state.sickDays?.year === year ? state.sickDays.days : 0;
    const room = sick.maxHoursAYear !== undefined ? Math.max(0, sick.maxHoursAYear - usedHours) : Number.POSITIVE_INFINITY;
    covered = Math.min(hours, state.sickHours ?? 0, room);
    state.sickHours = (state.sickHours ?? 0) - covered;
    // Where the law caps a year's sick hours, this counts them (in hours).
    if (sick.maxHoursAYear !== undefined) state.sickDays = { year, days: usedHours + covered };
  } else if (sick.daysAYear !== undefined) {
    const year = new Date(at).getUTCFullYear();
    const used = state.sickDays?.year === year ? state.sickDays.days : 0;
    if (used >= sick.daysAYear) return 0;
    state.sickDays = { year, days: used + 1 };
  }
  if (covered <= 0) return 0;
  const { currency: local } = countryAt(state.cityId);
  const save = saveCurrency(sim.universe);
  const cap = sick.capDay !== undefined ? exchange(Math.round(sick.capDay * 100), local, save) ?? Math.round(sick.capDay * 100) : undefined;
  state.unpaid.push({ at, hours: covered, kind: 'sick', share: sick.rate, ...(cap !== undefined ? { capDay: cap } : {}) });
  return covered;
}

/** The next payday after an instant, by the country's practice (`payCycleFor`). */
export function nextPayday(sim: Simulation, person: Person, after: Instant): Instant {
  const cityId = person.job?.cityId ?? person.currentLocationId;
  const city = CITIES.get(cityId);
  const zone = city?.timeZone ?? sim.homeZone;
  const country = city ? COUNTRIES.get(city.countryId)?.jurisdictionCode ?? '' : '';
  const cycle = payCycleFor(country);
  const at17 = (y: number, m: number, d: number) => instantFromZoned({ year: y, month: m, day: d, hour: 17 }, zone);
  const lastOf = (y: number, m: number) => new Date(Date.UTC(y, m, 0)).getUTCDate();
  const p = zonedParts(after, zone);
  if (cycle.kind === 'weekly') {
    let at = at17(p.year, p.month, p.day);
    for (let n = 0; n < 9; n += 1) {
      const q = zonedParts(at, zone);
      if (at > after && new Date(Date.UTC(q.year, q.month - 1, q.day)).getUTCDay() === cycle.weekday) return at;
      at = addDays(at, 1, zone);
    }
    return addDays(at17(p.year, p.month, p.day), 7, zone);
  }
  if (cycle.kind === 'biweekly') {
    // Every other one of that weekday, counted from the job's first week.
    const since = person.job?.since ?? after;
    let at = at17(p.year, p.month, p.day);
    for (let n = 0; n < 15; n += 1) {
      const q = zonedParts(at, zone);
      const weekday = new Date(Date.UTC(q.year, q.month - 1, q.day)).getUTCDay();
      const weeks = Math.floor((at - since) / (7 * MS_DAY));
      if (at > after && weekday === cycle.weekday && weeks % 2 === 1) return at;
      at = addDays(at, 1, zone);
    }
    return addDays(at17(p.year, p.month, p.day), 14, zone);
  }
  const candidates: Instant[] = [];
  for (let k = 0; k < 3; k += 1) {
    const y = p.year + Math.floor((p.month - 1 + k) / 12);
    const m = ((p.month - 1 + k) % 12) + 1;
    if (cycle.kind === 'semimonthly') candidates.push(at17(y, m, 15), at17(y, m, lastOf(y, m)));
    else candidates.push(at17(y, m, cycle.day === 'last' ? lastOf(y, m) : Math.min(cycle.day, lastOf(y, m))));
  }
  return candidates.filter((at) => at > after).sort((a, b) => a - b)[0]!;
}

/**
 * Where a payday's period ends: at the payday itself, or, where pay is for
 * the month before, at the start of the payday's month.
 */
export function periodEnd(sim: Simulation, person: Person, payday: Instant): Instant {
  const city = CITIES.get(person.job?.cityId ?? person.currentLocationId);
  const cycle = payCycleFor(city ? COUNTRIES.get(city.countryId)?.jurisdictionCode ?? '' : '');
  if (cycle.kind !== 'monthly' || !cycle.inArrears) return payday;
  const zone = city?.timeZone ?? sim.homeZone;
  const p = zonedParts(payday, zone);
  return instantFromZoned({ year: p.year, month: p.month, day: 1 }, zone);
}

/** Hours worked and not yet paid, up to an instant. */
export function hoursOwed(person: Person, before = Number.POSITIVE_INFINITY): number {
  return (person.job?.unpaid ?? []).filter((one) => one.at < before && one.kind === undefined).reduce((sum, one) => sum + one.hours, 0);
}

function schedulePayday(sim: Simulation, person: Person, after: Instant): void {
  sim.schedule({
    at: nextPayday(sim, person, after), kind: PAYDAY_KIND, label: 'Payday', category: 'work', priority: 40,
    payload: { personId: person.id },
  });
}

/** Pays every hour worked in the period, less what's withheld. */
function pay(sim: Simulation, person: Person, payday: Instant): void {
  const state = person.job;
  if (!state || !person.primaryAccountId) return;
  const cutoff = periodEnd(sim, person, payday);
  const hours = hoursOwed(person, cutoff);
  const currency = saveCurrency(sim.universe);
  const rate = hourlyWage(sim, person);
  const law = lawOf(state);
  const due = state.unpaid.filter((one) => one.at < cutoff);
  // Gross, line by line: the hours, each premium, leave, sick pay, rest
  // days, the law's extra payments, and Canada's vacation pay on top.
  const grossLines: { name: string; amount: Money }[] = [];
  const add = (name: string, amount: number) => {
    const rounded = Math.round(amount);
    if (rounded <= 0) return;
    const found = grossLines.find((one) => one.name === name);
    if (found) found.amount += rounded;
    else grossLines.push({ name, amount: rounded });
  };
  add('Hours Worked', hours * rate);
  for (const one of due) for (const extra of one.extras ?? []) add(extra.name, extra.hours * rate);
  for (const one of due) {
    if (one.kind === 'leave') add('Paid Leave', one.hours * rate * (1 + (law?.leave?.loading ?? 0)));
    if (one.kind === 'rest') add('Weekly Rest Day', one.hours * rate);
    if (one.kind === 'sick') {
      const day = one.hours * rate * (one.share ?? 1);
      add(law?.sick?.paidBy === 'state' ? 'Sickness Benefit' : 'Sick Pay', one.capDay !== undefined ? Math.min(day, one.capDay) : day);
    }
  }
  if (law?.leave?.asPay) add('Vacation Pay', grossLines.reduce((sum, one) => sum + one.amount, 0) * law.leave.asPay);
  for (const one of state.pendingPay ?? []) add(one.name, one.amount);
  const gross = grossLines.reduce((sum, one) => sum + one.amount, 0);
  if (gross <= 0) return;
  const slip = payslipAt(state.cityId, gross, currency, sim.now, {
    age: ageOf(person, sim.now),
    lastYear: wagesInYear(sim, person, new Date(sim.now).getUTCFullYear() - 1),
    weeklyHours: patternHours(patternOf(jobFor(state.jobId), state.fullTime)),
  });
  const title = jobFor(state.jobId).title;
  const employer = employerById(state.cityId, state.employerId);
  const by = (kind: PayslipLine['kind']) => slip.lines.filter((line) => line.kind === kind).reduce((sum, line) => sum + line.amount, 0);
  const tax = by('tax');
  const social = by('social');
  const toPension = by('pension');
  const net = gross - tax - social - toPension;
  const postings = [
    { accountId: sim.nominalAccount('income', 'Wages').id, amount: -gross },
    { accountId: person.primaryAccountId, amount: net },
  ];
  if (tax > 0) postings.push({ accountId: sim.nominalAccount('expense', 'Tax Withheld').id, amount: tax });
  if (social > 0) postings.push({ accountId: sim.nominalAccount('expense', 'Social Contributions').id, amount: social });
  const iso = countryAt(state.cityId).iso;
  if (toPension > 0 || slip.employerPension > 0) {
    const fund = pensionFund(sim, person, iso);
    if (toPension > 0) postings.push({ accountId: fund, amount: toPension });
    if (slip.employerPension > 0) {
      postings.push({ accountId: fund, amount: slip.employerPension });
      postings.push({ accountId: sim.nominalAccount('income', 'Employer Pension').id, amount: -slip.employerPension });
    }
  }
  sim.post({ memo: `${employer ? `${employer.name}, ` : ''}${title}: ${hours} hours`, category: 'salary', postings });
  state.lastSlip = { at: sim.now, hours, gross, grossLines, lines: slip.lines, employerPension: slip.employerPension, ...(slip.employerPensionName ? { employerPensionName: slip.employerPensionName } : {}), ...(slip.estimate ? { estimate: true } : {}) };
  sim.notify({
    category: 'work',
    title: 'Payday',
    body: `${formatMoney(net, currency)} for ${hours} hours at ${employer?.name ?? title.toLowerCase()}, from ${formatMoney(gross, currency)} before ${formatMoney(tax, currency)} of tax${social > 0 ? `, ${formatMoney(social, currency)} of contributions` : ''}${toPension > 0 ? ` and ${formatMoney(toPension, currency)} to your pension` : ''}.`,
    importance: 40,
  });
  state.unpaid = state.unpaid.filter((one) => one.at >= cutoff);
  state.pendingPay = [];
}

export function registerWork(sim: Simulation): void {
  sim.onSchedule(SHIFT_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId ?? s.universe.playerId)];
    const state = person?.job;
    if (!person || !state) return;
    const hours = Number(item.payload.hours) || 0;
    const asleep = person.awakeSince !== undefined && person.awakeSince > item.at;
    const away = person.currentLocationId !== state.cityId;
    // Outdoor work in a thunderstorm is called off: no pay, no strain, and
    // not held against anybody.
    if (!asleep && !away && jobFor(state.jobId).outdoors && outdoorWeather(s, state.cityId, item.at).calledOff) {
      item.status = 'cancelled';
      item.payload = { ...item.payload, calledOff: true };
      s.notify({
        category: 'work',
        title: 'Called Off For The Weather',
        body: `A thunderstorm over ${CITIES.get(state.cityId)?.name ?? 'town'}, and outdoor work doesn't go ahead in one. No shift today, and no pay for it.`,
        importance: 50,
      });
      return;
    }
    if (asleep || away) {
      item.status = 'missed';
      s.notify({
        category: 'work',
        title: asleep ? 'You Slept Through A Shift' : 'You Missed A Shift',
        body: asleep
          ? `Your ${item.label.toLowerCase()} started at ${formatTime(item.at, s.zone)} and you were asleep. No pay, and it counts.`
          : `It wanted you in ${CITIES.get(state.cityId)?.name ?? 'town'}, and you weren't there. No pay, and it counts.`,
        importance: 60,
      });
      strike(s, person, item.at);
      return;
    }
    item.payload = { ...item.payload, worked: true };
    const extras = premiumsFor(s, state, item.at, hours);
    state.unpaid.push({ at: item.at, hours, ...(extras.length ? { extras } : {}) });
    const law = lawOf(state);
    if (law?.leave?.accrual) {
      const earned = hours * law.leave.accrual;
      state.leaveHours = (state.leaveHours ?? 0) + earned;
      if (law.leave.expiry) {
        const year = leaveYearOf(state, law.leave.expiry.yearStart, item.at, s.homeZone);
        const years = state.leaveYears ?? [];
        const last = years[years.length - 1];
        if (last?.year === year) last.hours += earned;
        else years.push({ year, hours: earned });
        state.leaveYears = years;
      }
    }
    if (law?.sick?.accrual) state.sickHours = (state.sickHours ?? 0) + hours * law.sick.accrual;
    // Tips are taken home at the end of the shift, where the custom is to tip.
    const tips = tipsFor(s, person, hours);
    if (tips > 0) {
      s.schedule({
        at: item.at + hours * MS_HOUR, kind: TIPS_KIND, label: 'Tips', category: 'work', priority: 41,
        payload: { personId: person.id, amount: tips },
      });
    }
    const w = person.wellbeing;
    w.energy = clamp(w.energy - SHIFT_ENERGY_PER_HOUR * hours, 0, 100);
    w.stress = clamp(w.stress + SHIFT_STRESS_PER_HOUR * hours * personalityOf(person, 'stressGain'), 0, 100);
  });

  // Full-time or part-time, from a week on: the shifts already promised for
  // the next seven days stand, and the new week starts after them.
  sim.onCommand<{ fullTime: boolean }, { from: Instant }>('work.set_hours', (p, { sim: s }) => {
    const person = s.player;
    const state = person.job;
    if (!state) throw new CommandError('You don’t have a day job.');
    if (state.lookingUntil !== undefined) throw new CommandError('You’re between jobs right now.');
    const fullTime = p.fullTime === true;
    if (Boolean(state.fullTime) === fullTime) throw new CommandError(fullTime ? 'You’re already full-time.' : 'You’re already part-time.');
    const from = s.now + NOTICE;
    for (const item of s.timeline.pending()) {
      if (item.kind === SHIFT_KIND && item.at > from && item.payload.personId === person.id && !item.payload.extra) s.timeline.cancel(item.id, s.now);
    }
    state.fullTime = fullTime;
    state.hoursFrom = from;
    state.rotaThrough = from;
    fillRota(s, person);
    return { from };
  });

  // Looking for a day job, for somebody without one: it takes the three weeks
  // being let go does, and only where they have the right to work. Somebody
  // who turned the job down at creation, or had no right to it, had no way to
  // take one later.
  sim.onCommand<Record<string, never>, { until: Instant }>('work.find_job', (_p, { sim: s }) => {
    const person = s.player;
    if (person.job && person.job.lookingUntil === undefined) throw new CommandError('You’ve already got a day job.');
    if (person.job?.lookingUntil !== undefined) throw new CommandError('You’re already looking.');
    const right = mayWorkIn(person.citizenshipId, person.currentLocationId);
    if (!right.may) throw new CommandError(`You’d need a work visa to work here, and ${jobFor(person.beforeActing).title.toLowerCase()} doesn’t get one.`);
    const until = s.now + LOOKING_FOR;
    const jobId = person.beforeActing ?? 'school';
    const employer = firstEmployer(person.currentLocationId, jobId);
    person.job = {
      jobId, ...(employer ? { employerId: employer.id } : {}), cityId: person.currentLocationId, since: s.now,
      unpaid: [], missed: [], rotaThrough: s.now, lookingUntil: until,
    };
    if (!s.universe.scheduled.some((one) => one.kind === PAYDAY_KIND && one.status === 'pending' && one.payload.personId === person.id)) {
      schedulePayday(s, person, until);
    }
    return { until };
  });

  // Quitting: the notice the law asks of a worker first, working the shifts
  // in it; then the shifts come off the calendar, and what's owed, with leave
  // not taken where the law pays it out, is paid on the next payday. It was
  // at once everywhere until 2026-09-25.
  sim.onCommand<Record<string, never>, { ok: true; leavingAt: Instant }>('work.quit', (_p, { sim: s }) => {
    const person = s.player;
    const state = person.job;
    if (!state) throw new CommandError('You don’t have a day job.');
    if (state.leavingAt !== undefined) throw new CommandError('You’ve already given notice.');
    const days = state.lookingUntil !== undefined ? 0 : quitNoticeDays(lawOf(state), monthsWith(state, s.now));
    if (days <= 0) {
      leave(s, person);
      return { ok: true, leavingAt: s.now };
    }
    state.leavingAt = s.now + days * MS_DAY;
    for (const item of s.timeline.pending()) {
      if (item.kind === SHIFT_KIND && item.payload.personId === person.id && item.at >= state.leavingAt) s.timeline.cancel(item.id, s.now);
    }
    return { ok: true, leavingAt: state.leavingAt };
  });

  // Applying to another employer where they live, in any line of work: hired
  // for when the notice at the job they have runs out, or in about three
  // weeks, whichever is later; three weeks being SLATE's estimate of a hire,
  // as it is of finding work again. Until 2026-09-25 nobody could choose who
  // they worked for.
  sim.onCommand<{ employerId: string }, { startsAt: Instant }>('work.apply', (p, { sim: s }) => {
    const person = s.player;
    const right = mayWorkIn(person.citizenshipId, person.currentLocationId);
    if (!right.may) throw new CommandError('You’d need a work visa to work here.');
    const { iso } = countryAt(person.currentLocationId);
    const line = Object.entries(EMPLOYERS[iso] ?? {}).find(([, one]) => one.employers.some((e) => e.id === p.employerId));
    if (!line) throw new CommandError('That employer isn’t hiring where you are.');
    const state = person.job;
    if (state?.employerId === p.employerId && state.lookingUntil === undefined && state.quitAt === undefined) throw new CommandError('You already work there.');
    if (state?.switchTo) throw new CommandError('You’ve already got a new job starting.');
    const working = state !== undefined && state.lookingUntil === undefined && state.quitAt === undefined;
    const notice = working ? quitNoticeDays(lawOf(state), monthsWith(state, s.now)) * MS_DAY : 0;
    const startsAt = s.now + Math.max(notice, LOOKING_FOR);
    if (working) {
      state.switchTo = { employerId: p.employerId, jobId: line[0], at: startsAt };
      state.leavingAt = startsAt;
      for (const item of s.timeline.pending()) {
        if (item.kind === SHIFT_KIND && item.payload.personId === person.id && item.at >= startsAt) s.timeline.cancel(item.id, s.now);
      }
    } else {
      person.job = {
        jobId: line[0], employerId: p.employerId, cityId: person.currentLocationId, since: s.now,
        unpaid: state?.unpaid ?? [], missed: [], rotaThrough: s.now, lookingUntil: startsAt,
        ...(state?.pendingPay?.length ? { pendingPay: state.pendingPay } : {}),
      };
      if (!s.universe.scheduled.some((one) => one.kind === PAYDAY_KIND && one.status === 'pending' && one.payload.personId === person.id)) {
        schedulePayday(s, person, startsAt);
      }
    }
    return { startsAt };
  });

  // Booking a shift as paid leave: the next one on the rota, out of the hours
  // built up, where the law gives leave as time off and it can be taken yet.
  sim.onCommand<Record<string, never>, { at: Instant; hours: number }>('work.take_leave', (_p, { sim: s }) => {
    const person = s.player;
    const state = person.job;
    if (!state) throw new CommandError('You don’t have a day job.');
    const law = lawOf(state);
    if (!law?.leave || law.leave.accrual <= 0) {
      throw new CommandError(law?.leave?.asPay ? 'Your vacation pay comes with each paycheck, not as days to book.' : 'The law where you work gives no paid leave to book.');
    }
    if (monthsWith(state, s.now) < (law.leave.usableAfterMonths ?? 0)) {
      throw new CommandError(`Leave can be taken after ${law.leave.usableAfterMonths} months with the employer.`);
    }
    const next = s.timeline.pending()
      .filter((item) => item.kind === SHIFT_KIND && item.payload.personId === person.id && item.at > s.now)
      .sort((a, b) => a.at - b.at)[0];
    if (!next) throw new CommandError('There’s no shift on the rota to take off.');
    const hours = Number(next.payload.hours) || 0;
    if ((state.leaveHours ?? 0) + 1e-9 < hours) {
      throw new CommandError(`That shift is ${hours} hours, and you’ve built up ${(state.leaveHours ?? 0).toFixed(1)}.`);
    }
    s.timeline.cancel(next.id, s.now);
    state.leaveHours = (state.leaveHours ?? 0) - hours;
    // Taken from the oldest year first, the one that lapses soonest.
    let left = hours;
    for (const year of state.leaveYears ?? []) {
      const used = Math.min(year.hours, left);
      year.hours -= used;
      left -= used;
    }
    if (state.leaveYears) state.leaveYears = state.leaveYears.filter((year) => year.hours > 1e-9);
    state.unpaid.push({ at: next.at, hours, kind: 'leave' });
    return { at: next.at, hours };
  });

  // One more shift, on the first day this week they aren't already working.
  sim.onCommand<Record<string, never>, { at: Instant }>('work.extra_shift', (_p, { sim: s }) => {
    const person = s.player;
    const state = person.job;
    if (!state) throw new CommandError('You don’t have a day job.');
    if (state.lookingUntil !== undefined) throw new CommandError('You’re between jobs right now.');
    const pending = s.timeline.pending().filter((item) => item.kind === SHIFT_KIND && item.payload.personId === person.id);
    if (pending.some((item) => item.payload.extra === true)) throw new CommandError('You’ve already got an extra shift coming.');
    const job = jobFor(state.jobId);
    const week = patternOf(job, state.fullTime);
    const zone = CITIES.get(state.cityId)?.timeZone ?? s.homeZone;
    for (let n = 1; n <= 7; n += 1) {
      const p = zonedParts(s.now + n * MS_DAY, zone);
      const at = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: week.startHour }, zone);
      const end = at + week.hours * MS_HOUR;
      const busy = s.timeline.between(at - week.hours * MS_HOUR, end).some((item) => item.requiresPlayer === true);
      if (busy) continue;
      s.schedule({
        at, kind: SHIFT_KIND, label: `${job.title} Extra Shift`, category: 'work', priority: 30,
        requiresPlayer: true, durationMinutes: week.hours * 60, locationId: state.cityId,
        payload: { personId: person.id, hours: week.hours, extra: true },
      });
      return { at };
    }
    throw new CommandError('There’s no day this week you aren’t already working.');
  });

  sim.onSchedule(TIPS_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId ?? s.universe.playerId)];
    const amount = Math.round(Number(item.payload.amount) || 0);
    if (!person?.primaryAccountId || amount <= 0) return;
    s.post({
      memo: 'Tips', category: 'tips',
      postings: [
        { accountId: s.nominalAccount('income', 'Tips').id, amount: -amount },
        { accountId: person.primaryAccountId, amount },
      ],
    });
  });

  sim.onSchedule(PAYDAY_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId ?? s.universe.playerId)];
    if (!person) return;
    pay(s, person, item.at);
    if (person.job?.quitAt !== undefined && person.job.unpaid.length === 0 && !(person.job.pendingPay?.length)) delete person.job;
    if (person.job) schedulePayday(s, person, item.at);
  });

  // Once a day, inside the rollover: the rota two weeks out, and, three weeks
  // after being let go or starting to look, the same kind of work again in the
  // same town. It was its own
  // item first, five minutes after midnight and then at it, and either way it
  // was a stop of its own: it moved where a night nobody chose was counted
  // from, by the five minutes, and by half an hour in a save whose rollover
  // an older build had armed late. Run as the rollover's reactor it adds no
  // stop at all.
  sim.onEvent('world.day_rollover', 'work.rota', (_event, { sim: s }) => {
    for (const person of Object.values(s.universe.people)) {
      const state = person.job;
      if (!state) continue;
      if (state.switchTo !== undefined && s.now >= state.switchTo.at) {
        switchEmployer(s, person);
      } else if (state.leavingAt !== undefined && s.now >= state.leavingAt) {
        leave(s, person);
        continue;
      }
      lawDay(s, person);
      if (state.lookingUntil !== undefined && s.now >= state.lookingUntil) {
        delete state.lookingUntil;
        if (state.letGoBy !== undefined) {
          const others = employersFor(state.cityId, state.jobId).filter((one) => one.id !== state.letGoBy);
          if (others[0]) state.employerId = others[0].id;
          delete state.letGoBy;
        }
        state.since = s.now;
        state.rotaThrough = s.now;
        state.leaveHours = 0;
        state.sickHours = 0;
        s.notify({
          category: 'work',
          title: `Back In ${jobFor(state.jobId).title}`,
          body: 'You found the same kind of work again. The shifts are on your calendar.',
          importance: 60,
        });
      }
      fillRota(s, person);
    }
  });
}

/** Moving to the new employer: final pay from the old one, and a new rota. */
function switchEmployer(sim: Simulation, person: Person): void {
  const state = person.job;
  const next = state?.switchTo;
  if (!state || !next) return;
  for (const item of sim.timeline.pending()) {
    if (item.kind === SHIFT_KIND && item.payload.personId === person.id) sim.timeline.cancel(item.id, sim.now);
  }
  finalPay(sim, person);
  person.job = {
    jobId: next.jobId, employerId: next.employerId, cityId: state.cityId, since: sim.now,
    unpaid: state.unpaid, missed: [], rotaThrough: sim.now,
    ...(state.pendingPay?.length ? { pendingPay: state.pendingPay } : {}),
    ...(state.fullTime ? { fullTime: true } : {}),
  };
  const employer = employerById(state.cityId, next.employerId);
  sim.notify({
    category: 'work',
    title: `Starting At ${employer?.name ?? 'Your New Job'}`,
    body: 'Your old job’s last pay, with what it owes you, comes on the next payday. The new shifts are on your calendar.',
    importance: 60,
  });
}

/** Leaving the job: the shifts off the calendar, and final pay on the next payday. */
function leave(sim: Simulation, person: Person): void {
  const state = person.job;
  if (!state) return;
  for (const item of sim.timeline.pending()) {
    if (item.kind === SHIFT_KIND && item.payload.personId === person.id) sim.timeline.cancel(item.id, sim.now);
  }
  finalPay(sim, person);
  delete state.leavingAt;
  if (state.unpaid.length === 0 && !(state.pendingPay?.length)) {
    delete person.job;
    for (const item of sim.timeline.pending()) {
      if (item.kind === PAYDAY_KIND && item.payload.personId === person.id) sim.timeline.cancel(item.id, sim.now);
    }
  } else {
    // Kept, with nothing ahead, until its last payday clears what's owed.
    state.quitAt = sim.now;
  }
}

/**
 * The law's own days, at the rollover: an extra payment falling due, put on
 * the next payday, and on a Monday, Korea's paid rest day for last week.
 */
function lawDay(sim: Simulation, person: Person): void {
  const state = person.job;
  const law = state ? lawOf(state) : undefined;
  if (!state || !law || state.lookingUntil !== undefined || state.quitAt !== undefined) return;
  const zone = CITIES.get(state.cityId)?.timeZone ?? sim.homeZone;
  const p = zonedParts(sim.now, zone);
  const rate = hourlyWage(sim, person);
  const weekly = patternHours(patternOf(jobFor(state.jobId), state.fullTime));
  const months = monthsWith(state, sim.now);
  const paidAlready = state.extrasPaid ?? [];
  const due = (key: string, name: string, amount: number) => {
    if (paidAlready.includes(key) || amount <= 0) return;
    state.pendingPay = [...(state.pendingPay ?? []), { name, amount: Math.round(amount) }];
    state.extrasPaid = [...paidAlready.filter((one) => !one.endsWith(String(p.year - 2))), key];
  };
  const { currency: local } = countryAt(state.cityId);
  const save = saveCurrency(sim.universe);
  for (const extra of law.extras ?? []) {
    if (extra.kind === 'fixed' && p.month === extra.month && p.day === extra.day) {
      if (extra.minWeeks !== undefined && months * 30.4375 < extra.minWeeks * 7) continue;
      const amount = (exchange(extra.amount * 100, local, save) ?? extra.amount * 100) * Math.min(1, weekly / extra.fullTimeHours) * Math.min(1, months / 12);
      due(`${extra.name}-${p.year}`, extra.name, amount);
    } else if (extra.kind === 'days' && p.month === extra.month && p.day === extra.day) {
      const yearStart = Date.UTC(p.year, 0, 1);
      const share = Math.min(1, (sim.now - Math.max(yearStart, state.since)) / (365 * MS_DAY));
      due(`${extra.name}-${p.year}`, extra.name, ((weekly * rate) / 7) * extra.days * share);
    } else if (extra.kind === 'month' && extra.months.includes(p.month) && p.day === 15) {
      due(`${extra.name}-${p.year}-${p.month}`, extra.name, weekly * rate * (52 / 12) * Math.min(1, months / 6));
    }
  }
  // Leave that lapses: a warning a month before, as the employer owes one
  // where the law makes it lost, and then lost or paid out.
  const expiry = law.leave?.expiry;
  if (expiry && state.leaveYears?.length) {
    const keep: { year: string; hours: number; warned?: boolean }[] = [];
    for (const one of state.leaveYears) {
      const lapses = addMonthsLocal(Date.parse(`${one.year}T00:00:00Z`), 12 + expiry.graceMonths);
      if (sim.now >= lapses) {
        state.leaveHours = Math.max(0, (state.leaveHours ?? 0) - one.hours);
        if (expiry.action === 'payout') {
          state.pendingPay = [...(state.pendingPay ?? []), { name: 'Annual Leave Allowance', amount: Math.round(one.hours * rate) }];
        } else if (person.id === sim.universe.playerId && one.hours >= 0.05) {
          sim.notify({ category: 'work', title: 'Leave Lost', body: `${one.hours.toFixed(1)} hours of paid leave you didn’t take have lapsed, as the law where you work says.`, importance: 50 });
        }
        continue;
      }
      if (expiry.action === 'lose' && !one.warned && lapses - sim.now <= 30 * MS_DAY && one.hours >= 0.05) {
        one.warned = true;
        if (person.id === sim.universe.playerId) {
          sim.notify({ category: 'work', title: 'Use Your Leave', body: `${one.hours.toFixed(1)} hours of paid leave lapse on ${new Date(lapses).toISOString().slice(0, 10)} if you don’t take them. Your Work books a shift as leave.`, importance: 60 });
        }
      }
      keep.push(one);
    }
    state.leaveYears = keep;
  }
  // Korea: a week of 15 hours or more, with every shift worked, pays its rest day.
  const rest = law.weeklyRestDay;
  if (rest && state.week && !state.week.restPaid && weekly >= rest.minHours && state.week.key !== weekKey(state, sim.now, sim.homeZone)) {
    const weekStart = Date.parse(`${state.week.key}T00:00:00Z`);
    const missed = state.missed.some((when) => when >= weekStart - MS_DAY && when < weekStart + 8 * MS_DAY);
    if (!missed && state.week.hours > 0) state.unpaid.push({ at: sim.now, hours: Math.min(8, weekly / 5), kind: 'rest' });
    state.week = { ...state.week, restPaid: true };
  }
}

/**
 * Every job's rota two weeks out and its next payday on the calendar, where
 * either is missing. A save given its job by `migrate` gets both here, and
 * neither is ever scheduled twice.
 */
export function armWork(sim: Simulation): void {
  for (const person of Object.values(sim.universe.people)) {
    if (!person.job) continue;
    fillRota(sim, person);
    const due = sim.universe.scheduled.some((one) => one.kind === PAYDAY_KIND && one.status === 'pending'
      && one.payload.personId === person.id);
    if (!due) schedulePayday(sim, person, sim.now);
  }
}

/** A new character's job, rota and first payday. */
export function startWork(sim: Simulation, person: Person): void {
  hire(sim, person);
  schedulePayday(sim, person, sim.now);
}
