/**
 * SLATE — a doctor's appointment, booked, waited for and kept (the master
 * plan's §50.3–7, from 2026-10-02; the waits in `content/appointments.ts`).
 *
 * Until 2026-10-02 a week that brought a doctor's visit had it there and
 * then. Now, for the player, where the place's wait is published, it's an
 * appointment: booked at their own doctor's practice, or the town's first,
 * for the place's wait, on a weekday morning, on the calendar like any other
 * commitment. Kept, it's the visit, billed as before. Missed, it isn't had
 * and isn't billed, and the need stays until they book again: asleep or in
 * hospital (`presentForCare`). Laid up by an injury missed one until
 * 2026-10-10, and being away from the town until the journeys went in the
 * scope reset of 2026-10-09; the check for it compared the town they were in
 * with itself after that, and went on 2026-10-12. Ireland publishes no GP
 * wait, so a visit there is had as before; so is the flu, which is mostly not
 * seen at all.
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
 * many wait, so no referral is drawn there. Mexico's was left out until
 * 2026-10-03, when the IMSS's own ENCAL 2025 report was read: 61 days from
 * referral to the first specialist, at England's share referred, another
 * system where the family doctor refers (`research-health-travel-gaps.json`).
 * What the specialist finds isn't kept: SLATE's conditions don't name one.
 *
 * **A practice's own wait** (from 2026-10-15): where a practice publishes how soon it sees people (`Clinic.waitDays`),
 * a visit there is booked for that, not the town's: Yale Health's Student Health, the next weekday, against New Haven's
 * 23.5 days at Fair Haven. An appointment is had at the practice it was booked at, and a practice for its members that
 * no longer sees them when it comes (Yale Health, its cover ended by a withdrawal) doesn't: the visit is owed, and
 * booked again where they're seen. Until then a visit was billed under whichever practice was their doctor on the day.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { CITIES } from '../content/geography';
import type { Clinic } from '../content/clinics';
import { holidaysOn } from '../content/holidays';
import { CANADA_NEXT_DAY, CANADA_OTHERWISE_DAYS, CONSULT_HOUR, CONSULT_MINUTES, ENGLAND_BANDS, IMSS_DAYS, US_DAYS, US_METRO_AVERAGE_DAYS } from '../content/appointments';
import { careFor, healthOf, renewPrescriptions, reviewed } from './health';
import { DOCTOR_KINDS, MEMBERS_ONLY, clinicById, clinicFor, clinicsIn, outsideItsPractice, seesThem } from './clinics';
import { citizenOf } from './documents';
import { presentForCare } from './health';

export const APPOINTMENT_KIND = 'health.appointment';

/** The share of visits that end in a referral, by country. */
export const REFERRAL_SHARE: Readonly<Record<string, number>> = { us: 0.091, uk: 0.081, ca: 0.081, mx: 0.081 };
/** Days from referral to the specialist: America's average; England's median weeks; Canada's by province (Ontario ca-08, British Columbia ca-02), its median otherwise. */
export const REFERRAL_DAYS = { us: 31, uk: 12 * 7, mx: 61, ca: { 'ca-08': 10.7 * 7, 'ca-02': 19.7 * 7, other: 15.3 * 7 } } as const;
/** What a specialist's appointment is booked as, and known by. */
export const SPECIALIST = 'A specialist, referred';

/** The days to a specialist where they live, or nothing where none is published. */
export function referralDays(person: Person): number | undefined {
  const city = homeCity(person);
  const country = CITIES.get(city)?.countryId;
  if (country === 'us') return REFERRAL_DAYS.us;
  if (country === 'uk') return REFERRAL_DAYS.uk;
  if (country === 'mx') return REFERRAL_DAYS.mx;
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

/**
 * The appointments booked at a practice whose visit their cover won't pay for on the day (`outsideItsPractice`): one
 * booked at Fair Haven while uncovered on a leave, Yale Health's cover back before it (Affiliate cover bought, or the
 * leave over). Kept where it was booked, as `followTheCover` says an appointment is, and billed there as the uninsured's;
 * called off and booked again, it's had at Yale Health. From 2026-10-16: until then nothing said so until the visit's
 * own bill, $187.20 (found playing a personal leave, brief 09's journeys).
 */
export function outsideTheCover(person: Person): Appointment[] {
  return (person.health?.appointments ?? []).filter((a) => a.clinicId !== undefined && outsideItsPractice(person, clinicById(a.clinicId), a.at));
}

const homeCity = (person: Person) => person.currentLocationId;

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

/**
 * The days a practice books a visit for where that's one number, for Papers to say before it's chosen (from
 * 2026-10-15): its own published wait, or America's town wait; nothing where the wait is a draw (England, Canada) or
 * none is published. `book` reads the same figures.
 */
export function practiceWait(person: Person, clinic: Clinic): number | undefined {
  if (clinic.waitDays !== null) return clinic.waitDays;
  if (CITIES.get(homeCity(person))?.countryId !== 'us') return undefined;
  return Math.round(US_DAYS[homeCity(person)] ?? US_METRO_AVERAGE_DAYS);
}

/** A weekday morning so many days on, in their town. */
function slot(sim: Simulation, person: Person, days: number): Instant {
  const zone = CITIES.require(homeCity(person)).timeZone;
  const p = zonedParts(sim.now + days * MS_DAY, zone);
  let at = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: CONSULT_HOUR, minute: 0 }, zone);
  if (at <= sim.now) at += MS_DAY;
  // A practice's working day: a Saturday, a Sunday or a public holiday where they live goes to the next one (from
  // 2026-10-13: until then only the weekend moved, and a New Haven visit could be booked on Thanksgiving Day; found by the
  // review of that day).
  const city = CITIES.require(homeCity(person));
  for (let i = 0; i < 7 && ([0, 6].includes(zonedParts(at, zone).weekday) || holidaysOn(at, zone, city.countryId, city.parentId).some((h) => h.type === 'public')); i += 1) at += MS_DAY;
  return at;
}

/** Books the next appointment for a need, at their doctor or the town's first practice, for its own wait where it publishes one; nothing where no wait is published. */
export function book(sim: Simulation, person: Person, what: string): Appointment | undefined {
  const own = clinicFor(person, 'visit', sim.now)?.waitDays ?? undefined;
  const days = what === SPECIALIST ? referralDays(person) : own ?? waitDays(sim, person, `${what}-${sim.now}`);
  if (days === undefined) return undefined;
  return bookIn(sim, person, what, days);
}

/**
 * Booked, and the player told. A specialist booked again after one was called off, with no referral to give `why`,
 * reads "A specialist, referred: booked for …" (from 2026-10-12: until then it read "booked specialist, booked for …",
 * the referral's clause added to it). The practice is looked up for the person as they are: until 2026-10-12 it was
 * for a copy of them put in their own town, which was the town they were in.
 */
function bookIn(sim: Simulation, person: Person, what: string, days: number, why?: string): Appointment {
  const clinic = clinicFor(person, 'visit', sim.now);
  const h = healthOf(person);
  h.seq = (h.seq ?? 0) + 1;
  const a: Appointment = { id: `a${h.seq}`, at: slot(sim, person, days), what, ...(clinic ? { clinicId: clinic.id } : {}) };
  appointmentsOf(person).push(a);
  sim.schedule({ at: a.at, kind: APPOINTMENT_KIND, label: what === SPECIALIST ? 'A Specialist' : `The Doctor${clinic ? `, ${clinic.name}` : ''}`, category: 'personal', priority: 35, requiresPlayer: true, durationMinutes: CONSULT_MINUTES, locationId: homeCity(person), payload: { personId: person.id, appointmentId: a.id } });
  // Its words are the papers guide's quote (`guide/papers.ts`, papers.doctor's example, which tests/guide-examples-papers
  // holds equal), so brief 14's health area left them for that guide's area; the editorial review changed both together,
  // “the wait where you live” becoming “the usual wait where you live”. Brief 15's coordinator added the next step to both
  // at the health area's merge, where the health area had left the notice Blocked for that reason.
  if (person.id === sim.universe.playerId) sim.notify({ category: 'health', title: what === SPECIALIST ? 'A Referral' : 'A Doctor’s Appointment', body: `${why ? `${why}: a` : `${what}: booked`}${what === SPECIALIST ? (why ? ' specialist, booked' : '') : clinic ? ` at ${clinic.name}` : ''} for ${formatDate(a.at, CITIES.require(homeCity(person)).timeZone)}, the usual wait where you live. Be there then, or press Call It Off on Papers, under Health Cover.`, importance: 50, route: '/workspace/papers' });
  return a;
}

/**
 * A save from before 2026-10-15 opened (`loadSave`): an appointment it booked at Fair Haven for somebody who never
 * chose a practice, and whom Yale Health covers on its day, is had at Yale Health's practice instead, its date kept, its
 * calendar entry renamed. That day Yale Health's rule that a member's care is had at its Health Center was kept, and with
 * nothing chosen a member's visit went there (`clinicFor`); an appointment the older build booked by its default would
 * otherwise be billed as the uninsured's, a choice the player never made. Nothing chosen is told from a choice by
 * `health.clinicId`, which only Your Doctor's command sets: before that day New Haven kept one practice and drew no Your
 * Doctor, so no New Haven life had one. One chosen stays where it was booked. Returns how many were moved.
 *
 * It's taken once, on the first opening of a save that doesn't name it in `SaveUniverse.opened`, and never on a save
 * this build began (from 2026-10-15). Until later that day it ran on every opening, and what it moved couldn't be told
 * from a current booking: a member uncovered on a personal leave, given Fair Haven by default, who bought Affiliate cover
 * before the day was seen at Fair Haven and billed $187.20 played straight through, and at Yale Health for $0 after a
 * reload (found by play). The rule for a current save is the one a pick has had since that day: an appointment is had
 * at the practice it was booked at, which is what keeping it means. Fair Haven still sees her, and Yale Health's plan
 * pays for a visit only at its own Health Center, so it's billed there as the uninsured's, as the bill says; cancel it
 * and Book An Appointment books her at Yale Health. The same holds for a return from a leave before the day.
 */
export function followTheCover(sim: Simulation): number {
  let moved = 0;
  for (const person of Object.values(sim.universe.people)) {
    if (!person.health || person.health.clinicId) continue;
    for (const a of person.health.appointments ?? []) {
      const was = a.clinicId ? clinicById(a.clinicId) : undefined;
      if (!was || was.members !== null) continue;
      const theirs = clinicsIn(was.cityId).find((c) => c.members !== null && DOCTOR_KINDS.includes(c.kind) && seesThem(person, c, a.at));
      if (!theirs) continue;
      a.clinicId = theirs.id;
      for (const one of sim.universe.scheduled) if (one.status === 'pending' && one.kind === APPOINTMENT_KIND && one.payload.appointmentId === a.id && one.payload.personId === person.id) one.label = one.label.replace(was.name, theirs.name);
      moved += 1;
    }
  }
  return moved;
}

export function registerAppointments(sim: Simulation): void {
  sim.onSchedule(APPOINTMENT_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const a = person ? appointmentsOf(person).find((x) => x.id === item.payload.appointmentId) : undefined;
    if (!person || !a) return;
    healthOf(person).appointments = appointmentsOf(person).filter((x) => x.id !== a.id);
    if (!presentForCare(person, item.at)) {
      item.status = 'missed';
      healthOf(person).owedVisit = a.what;
      if (person.id === s.universe.playerId) s.notify({ category: 'health', title: 'Missed The Doctor', body: `${a.what}: you weren’t there, so you weren’t seen. To book again, press Book An Appointment on Papers, under Health Cover.`, importance: 60, route: '/workspace/papers' });
      return;
    }
    // A practice for its members that doesn't see them now (from 2026-10-15): not seen, and owed, as a visit missed is.
    const at = a.clinicId ? clinicById(a.clinicId) : undefined;
    if (at && at.members !== null && !seesThem(person, at, item.at)) {
      item.status = 'missed';
      healthOf(person).owedVisit = a.what;
      if (person.id === s.universe.playerId) s.notify({ category: 'health', title: 'Not Seen At Your Practice', body: `${a.what}: you weren’t seen at ${at.name}. ${MEMBERS_ONLY[at.members]} To book again at ${clinicFor(person, 'visit', item.at)?.name ?? 'the town’s first practice'}, press Book An Appointment on Papers, under Health Cover.`, importance: 60, route: '/workspace/papers' });
      return;
    }
    careFor(s, person, { care: 'visit', what: a.what, ...(a.clinicId ? { clinicId: a.clinicId } : {}) }, item.at);
    // A visit kept renews the prescriptions (`RX`, from 2026-10-03).
    renewPrescriptions(person, item.at);
    reviewed(person, a.what, item.at);
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
    if (!a) throw new CommandError('No waiting time is published where you live, so there’s nothing to book: you’re seen when you need care.');
    delete healthOf(person).owedVisit;
    return { at: a.at };
  });
  sim.onCommand<{ appointmentId: string }, { canceled: true }>('health.cancel_appointment', (p, { sim: s }) => {
    const person = s.player;
    const a = appointmentsOf(person).find((x) => x.id === p?.appointmentId);
    if (!a) throw new CommandError('That appointment isn’t booked any more.');
    healthOf(person).appointments = appointmentsOf(person).filter((x) => x.id !== a.id);
    for (const one of s.universe.scheduled) if (one.status === 'pending' && one.kind === APPOINTMENT_KIND && one.payload.appointmentId === a.id) s.timeline.cancel(one.id, s.now);
    healthOf(person).owedVisit = a.what;
    return { canceled: true };
  });
}
