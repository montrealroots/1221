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
  const days = waitDays(sim, person, `${what}-${sim.now}`);
  if (days === undefined) return undefined;
  const clinic = clinicFor({ ...person, currentLocationId: homeCity(person) } as Person, 'visit');
  const h = healthOf(person);
  h.seq = (h.seq ?? 0) + 1;
  const a: Appointment = { id: `a${h.seq}`, at: slot(sim, person, days), what, ...(clinic ? { clinicId: clinic.id } : {}) };
  appointmentsOf(person).push(a);
  sim.schedule({ at: a.at, kind: APPOINTMENT_KIND, label: `The Doctor${clinic ? `, ${clinic.name}` : ''}`, category: 'personal', priority: 35, requiresPlayer: true, durationMinutes: CONSULT_MINUTES, locationId: homeCity(person), payload: { personId: person.id, appointmentId: a.id } });
  if (person.id === sim.universe.playerId) sim.notify({ category: 'health', title: 'A Doctor’s Appointment', body: `${what}: booked${clinic ? ` at ${clinic.name}` : ''} for ${formatDate(a.at, CITIES.require(homeCity(person)).timeZone)}, the wait where you live.`, importance: 50, route: '/workspace/papers' });
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
