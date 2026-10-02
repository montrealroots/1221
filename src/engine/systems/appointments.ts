/**
 * SLATE — a doctor's appointment, booked, waited for and kept (the master
 * plan's §50.3–7, from 2026-10-02; the waits in `content/appointments.ts`).
 *
 * Until 2026-10-02 a week that brought a doctor's visit had it there and
 * then. Now, for the player, where the place's wait is published, it's an
 * appointment: booked at their own doctor's practice, or the town's first,
 * for the place's wait, on a weekday morning, on the calendar like any other
 * commitment. Kept, it's the visit, billed as before. Missed (away, asleep,
 * in hospital or laid up), it isn't had and isn't billed, and the need stays
 * until they book again. Ireland publishes no GP wait, so a visit there is
 * had as before; so is the flu, which is mostly not seen at all.
 *
 * **A referral**, from 2026-10-02 (`research-referrals-childday.json`): a
 * visit kept ends in one to a specialist as often as the place's doctors
 * refer, America's 9.1% of office visits (NAMCS 2019) and England's 8.1%
 * (2022), England's taken for Canada's, another system where the family
 * doctor refers. The specialist is seen after the place's published wait:
 * AMN's 31 days in America; in England the NHS's median of 12 weeks to
 * treatment, the nearest it publishes; in Canada the Fraser Institute's
 * family doctor to specialist median, 10.7 weeks in Ontario, 19.7 in British
 * Columbia, 15.3 elsewhere. It's a visit like the first, billed as the
 * place's cover bills one, and refers no further. Ireland publishes only how
 * many wait, and Mexico neither, so no referral is drawn there. What the
 * specialist finds isn't kept: SLATE's conditions don't name one.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { CITIES } from '../content/geography';
import { CANADA_NEXT_DAY, CANADA_OTHERWISE_DAYS, CONSULT_HOUR, CONSULT_MINUTES, ENGLAND_BANDS, IMSS_DAYS, US_DAYS, US_METRO_AVERAGE_DAYS } from '../content/appointments';
import { careFor, healthOf } from './health';
import { clinicFor } from './clinics';
import { citizenOf } from './documents';
import { present } from './career';

export const APPOINTMENT_KIND = 'health.appointment';

/** The share of visits that end in a referral, by country. */
export const REFERRAL_SHARE: Readonly<Record<string, number>> = { us: 0.091, uk: 0.081, ca: 0.081 };
/** Days from referral to the specialist: America's average; England's median weeks; Canada's by province (Ontario ca-08, British Columbia ca-02), its median otherwise. */
export const REFERRAL_DAYS = { us: 31, uk: 12 * 7, ca: { 'ca-08': 10.7 * 7, 'ca-02': 19.7 * 7, other: 15.3 * 7 } } as const;
/** What a specialist's appointment is booked as, and known by. */
export const SPECIALIST = 'A specialist, referred';

/** The days to a specialist where they live, or nothing where none is published. */
export function referralDays(person: Person): number | undefined {
  const city = homeCity(person);
  const country = CITIES.get(city)?.countryId;
  if (country === 'us') return REFERRAL_DAYS.us;
  if (country === 'uk') return REFERRAL_DAYS.uk;
  if (country === 'ca') { const p = CITIES.get(city)?.parentId ?? ''; return Math.round(p === 'ca-08' ? REFERRAL_DAYS.ca['ca-08'] : p === 'ca-02' ? REFERRAL_DAYS.ca['ca-02'] : REFERRAL_DAYS.ca.other); }
  return undefined;
}

/** A kept visit that ends in a referral, at the place's share (decider `health.referral`): the specialist booked. `odds` overrides it for the sweep. */
export function mayRefer(sim: Simulation, person: Person, a: Appointment, odds?: number): Appointment | undefined {
  if (a.what === SPECIALIST) return undefined;
  const share = REFERRAL_SHARE[CITIES.get(homeCity(person))?.countryId ?? ''];
  if (share === undefined) return undefined;
  if (sim.rng('health.referral', person.id, a.id, a.at).next() >= (odds ?? share)) return undefined;
  // Every country with a share publishes a wait.
  return bookIn(sim, person, SPECIALIST, referralDays(person)!, `Referred after ${a.what.toLowerCase()}`);
}

export interface Appointment { id: string; at: Instant; what: string; clinicId?: string }
export const appointmentsOf = (person: Person): Appointment[] => (healthOf(person).appointments ??= []);

const homeCity = (person: Person) => person.home?.cityId ?? person.currentLocationId;

/** The days a doctor's appointment is waited for where they live, drawn where it's a distribution (`health.appointment`); nothing where no wait is published. */
export function waitDays(sim: Simulation, person: Person, key: string): number | undefined {
  const city = homeCity(person);
  const country = CITIES.get(city)?.countryId;
  const rng = () => sim.rng('health.appointment', person.id, key).next();
  if (country === 'uk') {
    let r = rng();
    for (const b of ENGLAND_BANDS) {
      if (r < b.share) return b.from + Math.floor((r / b.share) * (b.to - b.from + 1));
      r -= b.share;
    }
    return ENGLAND_BANDS.at(-1)!.to;
  }
  if (country === 'us') return Math.round(US_DAYS[city] ?? US_METRO_AVERAGE_DAYS);
  if (country === 'ca') return rng() < (CANADA_NEXT_DAY[CITIES.get(city)?.parentId ?? ''] ?? 0.26) ? 1 : CANADA_OTHERWISE_DAYS;
  if (country === 'mx') return citizenOf(person, 'MX') ? IMSS_DAYS : undefined;
  return undefined;
}

/** A weekday morning so many days on, in their town. */
function slot(sim: Simulation, person: Person, days: number): Instant {
  const zone = CITIES.require(homeCity(person)).timeZone;
  const p = zonedParts(sim.now + days * MS_DAY, zone);
  let at = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: CONSULT_HOUR, minute: 0 }, zone);
  if (at <= sim.now) at += MS_DAY;
  // A practice's weekday: a Saturday or a Sunday goes to the Monday.
  for (let i = 0; i < 3 && [0, 6].includes(zonedParts(at, zone).weekday); i += 1) at += MS_DAY;
  return at;
}

/** Books the next appointment for a need, at their doctor or the town's first practice; nothing where no wait is published. */
export function book(sim: Simulation, person: Person, what: string): Appointment | undefined {
  const days = what === SPECIALIST ? referralDays(person) : waitDays(sim, person, `${what}-${sim.now}`);
  if (days === undefined) return undefined;
  return bookIn(sim, person, what, days);
}

function bookIn(sim: Simulation, person: Person, what: string, days: number, why?: string): Appointment {
  const clinic = clinicFor({ ...person, currentLocationId: homeCity(person) } as Person, 'visit');
  const h = healthOf(person);
  h.seq = (h.seq ?? 0) + 1;
  const a: Appointment = { id: `a${h.seq}`, at: slot(sim, person, days), what, ...(clinic ? { clinicId: clinic.id } : {}) };
  appointmentsOf(person).push(a);
  sim.schedule({ at: a.at, kind: APPOINTMENT_KIND, label: what === SPECIALIST ? 'A Specialist' : `The Doctor${clinic ? `, ${clinic.name}` : ''}`, category: 'personal', priority: 35, requiresPlayer: true, durationMinutes: CONSULT_MINUTES, locationId: homeCity(person), payload: { personId: person.id, appointmentId: a.id } });
  if (person.id === sim.universe.playerId) sim.notify({ category: 'health', title: what === SPECIALIST ? 'A Referral' : 'A Doctor’s Appointment', body: `${why ? `${why}: a` : `${what}: booked`}${what === SPECIALIST ? ' specialist, booked' : clinic ? ` at ${clinic.name}` : ''} for ${formatDate(a.at, CITIES.require(homeCity(person)).timeZone)}, the wait where you live.`, importance: 50, route: '/workspace/papers' });
  return a;
}

export function registerAppointments(sim: Simulation): void {
  sim.onSchedule(APPOINTMENT_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const a = person ? appointmentsOf(person).find((x) => x.id === item.payload.appointmentId) : undefined;
    if (!person || !a) return;
    healthOf(person).appointments = appointmentsOf(person).filter((x) => x.id !== a.id);
    if (!present(person, item.at, homeCity(person))) {
      item.status = 'missed';
      healthOf(person).owedVisit = a.what;
      if (person.id === s.universe.playerId) s.notify({ category: 'health', title: 'Missed The Doctor', body: `${a.what}: you weren’t there, so you weren’t seen. Book again when you can.`, importance: 60, route: '/workspace/papers' });
      return;
    }
    careFor(s, person, { care: 'visit', what: a.what }, item.at);
    // And it may end in a referral (from 2026-10-02).
    if (person.id === s.universe.playerId) mayRefer(s, person, a);
  });

  // A need booked again after a missed appointment, or one called off.
  sim.onCommand<Record<string, never>, { at: Instant }>('health.book', (_p, { sim: s }) => {
    const person = s.player;
    const what = healthOf(person).owedVisit;
    if (!what) throw new CommandError('There’s nothing to see a doctor about.');
    if (appointmentsOf(person).length) throw new CommandError('You have an appointment already.');
    const a = book(s, person, what);
    if (!a) throw new CommandError('No wait is published where you live; you’re seen when it comes up.');
    delete healthOf(person).owedVisit;
    return { at: a.at };
  });
  sim.onCommand<{ appointmentId: string }, { canceled: true }>('health.cancel_appointment', (p, { sim: s }) => {
    const person = s.player;
    const a = appointmentsOf(person).find((x) => x.id === p?.appointmentId);
    if (!a) throw new CommandError('No such appointment.');
    healthOf(person).appointments = appointmentsOf(person).filter((x) => x.id !== a.id);
    for (const one of s.universe.scheduled) if (one.status === 'pending' && one.kind === APPOINTMENT_KIND && one.payload.appointmentId === a.id) s.timeline.cancel(one.id, s.now);
    healthOf(person).owedVisit = a.what;
    return { canceled: true };
  });
}
