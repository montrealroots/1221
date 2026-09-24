/**
 * SLATE — the day job.
 *
 * Nothing earned money until this. The film career went in the gut, and with
 * it every wage, so the balances a save started with were the balances it
 * kept. Now every character has the survival job their past leads to
 * (`content/jobs.ts`): shifts on the calendar, paid at a real legal floor
 * where they live times what that kind of work pays over it
 * (`content/wages.ts`), with tax withheld by the tax engine, on the payday
 * that country's employers use.
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
import { CITIES, COUNTRIES } from '../content/geography';
import { jobFor, patternHours, patternOf, payCycleFor, tipsPerHour, type Job } from '../content/jobs';
import { CommandError } from '../core/simulation';
import { minimumWageAt } from '../content/wages';
import { computeAnnualTax } from '../content/tax';
import { exchange } from '../content/currency';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import {
  addDays, formatTime, instantFromZoned, startOfNextDay, zonedParts, MS_DAY, MS_HOUR, type Instant,
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
  /** The town the work is in. */
  cityId: string;
  since: Instant;
  /** Shifts worked and not yet paid, by when they started. */
  unpaid: { at: Instant; hours: number }[];
  /** When each shift in the last four weeks was missed. */
  missed: Instant[];
  /** The rota is on the calendar up to here. */
  rotaThrough: Instant;
  /** Let go, and looking for work until this. */
  lookingUntil?: Instant;
  /** Five eight-hour days rather than the job's own part-time week (`patternOf`). */
  fullTime?: boolean;
}

export function jobOf(person: Person): Job | undefined {
  return person.job ? jobFor(person.job.jobId) : undefined;
}

/**
 * What an hour of their work pays, in the save's money: the floor where the
 * work is, now, times the job's premium.
 */
export function hourlyWage(sim: Simulation, person: Person): Money {
  const state = person.job;
  return state ? wageAt(state.cityId, state.jobId, saveCurrency(sim.universe), sim.now) : 0;
}

/** The same, for a job in a town at a date, in a currency: for a screen with no save yet. */
export function wageAt(cityId: string, jobId: string, currency: string, at: Instant): Money {
  const floor = minimumWageAt(cityId, at, currency);
  const inSave = floor.currency === currency ? floor.hourly : exchange(floor.hourly, floor.currency, currency) ?? floor.hourly;
  return Math.round(inSave * jobFor(jobId).overMinimum);
}

/**
 * The share of a wage the tax engine withholds, at what the job pays in a
 * year. The engine's brackets are written in US dollars, so the year's pay is
 * taken there to read the rate, and the rate is what comes back.
 */
export function withholdingRate(sim: Simulation, person: Person): number {
  const state = person.job;
  return state ? withholdingAt(state.cityId, state.jobId, saveCurrency(sim.universe), sim.now, state.fullTime) : 0;
}

export function withholdingAt(cityId: string, jobId: string, currency: string, at: Instant, fullTime = false): number {
  const yearly = wageAt(cityId, jobId, currency, at) * patternHours(patternOf(jobFor(jobId), fullTime)) * 52;
  const usd = exchange(yearly, currency, 'USD') ?? yearly;
  return computeAnnualTax(usd, cityId, at).effectiveRate;
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
  person.job = {
    jobId: person.beforeActing ?? 'school',
    cityId: person.currentLocationId,
    since: sim.now,
    unpaid: person.job?.unpaid ?? [],
    missed: [],
    rotaThrough: sim.now,
  };
  fillRota(sim, person);
}

/** Puts every shift of the next two weeks on the calendar that isn't on it. */
export function fillRota(sim: Simulation, person: Person): void {
  const state = person.job;
  if (!state || state.lookingUntil !== undefined) return;
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
  state.lookingUntil = sim.now + LOOKING_FOR;
  state.missed = [];
  sim.notify({
    category: 'work',
    title: `Let Go From ${jobFor(state.jobId).title}`,
    body: `Three missed shifts in four weeks. Finding the same kind of work again will take about three weeks, and until then nothing comes in.`,
    importance: 80,
  });
}

/** Calling in sick for a shift that has come round: no pay, and it counts. */
export function callIn(sim: Simulation, item: ScheduledItem): void {
  const person = sim.universe.people[String(item.payload.personId ?? sim.universe.playerId)];
  item.status = 'missed';
  item.resolvedAt = sim.now;
  if (!person) return;
  sim.notify({
    category: 'work',
    title: 'You Called In Sick',
    body: `No pay for the ${item.payload.hours} hours, and a missed shift on your record.`,
    importance: 45,
  });
  strike(sim, person, sim.now);
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
  return (person.job?.unpaid ?? []).filter((one) => one.at < before).reduce((sum, one) => sum + one.hours, 0);
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
  if (hours <= 0) return;
  const currency = saveCurrency(sim.universe);
  const gross = Math.round(hours * hourlyWage(sim, person));
  const withheld = Math.round(gross * withholdingRate(sim, person));
  const title = jobFor(state.jobId).title;
  sim.post({
    memo: `${title}: ${hours} hours`,
    category: 'salary',
    postings: [
      { accountId: sim.nominalAccount('income', 'Wages').id, amount: -gross },
      { accountId: sim.nominalAccount('expense', 'Tax Withheld').id, amount: withheld },
      { accountId: person.primaryAccountId, amount: gross - withheld },
    ],
  });
  sim.notify({
    category: 'work',
    title: 'Payday',
    body: `${formatMoney(gross - withheld, currency)} for ${hours} hours of ${title.toLowerCase()}, after ${formatMoney(withheld, currency)} withheld in tax.`,
    importance: 40,
  });
  state.unpaid = state.unpaid.filter((one) => one.at >= cutoff);
}

export function registerWork(sim: Simulation): void {
  sim.onSchedule(SHIFT_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId ?? s.universe.playerId)];
    const state = person?.job;
    if (!person || !state) return;
    const hours = Number(item.payload.hours) || 0;
    const asleep = person.awakeSince !== undefined && person.awakeSince > item.at;
    const away = person.currentLocationId !== state.cityId;
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
    state.unpaid.push({ at: item.at, hours });
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
    state.rotaThrough = from;
    fillRota(s, person);
    return { from };
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
    if (person.job) schedulePayday(s, person, item.at);
  });

  // Once a day, inside the rollover: the rota two weeks out, and, three weeks
  // after being let go, the same kind of work somewhere new. It was its own
  // item first, five minutes after midnight and then at it, and either way it
  // was a stop of its own: it moved where a night nobody chose was counted
  // from, by the five minutes, and by half an hour in a save whose rollover
  // an older build had armed late. Run as the rollover's reactor it adds no
  // stop at all.
  sim.onEvent('world.day_rollover', 'work.rota', (_event, { sim: s }) => {
    for (const person of Object.values(s.universe.people)) {
      const state = person.job;
      if (!state) continue;
      if (state.lookingUntil !== undefined && s.now >= state.lookingUntil) {
        delete state.lookingUntil;
        state.since = s.now;
        state.rotaThrough = s.now;
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
