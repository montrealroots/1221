/**
 * SLATE — a course of talking therapy for depression (the master plan's
 * §50.1, from 2026-10-03; `docs/research/world/research-casting-therapy-hotels-cars.json`).
 *
 * Until then depression was kept up only by its medicine, and a therapist's
 * price was read but bought nothing, no effect on a condition having been
 * read. Now a course is NICE's for less severe depression (NG222): eight
 * sessions of individual CBT, a week apart, each at a named practice's own
 * price where you live: The Center for CBT in New York ($260 to $385 for 45
 * minutes, the middle), UCLA's Psychology Clinic in Los Angeles ($30 to $150
 * an hour on its sliding scale, the middle), Priory in London (from £124),
 * City Therapy in Dublin (€85 to €90), CBT Associates in Toronto (C$265 to
 * C$275), the DBT Center of Vancouver (C$230), R&A Psicólogos in Mexico City
 * (MX$800). In England NHS Talking Therapies is free, its first session six
 * weeks on, the standard 90.5% of its patients were seen within in March 2025.
 *
 * From the connected world of 2026-10-09, Yale Mental Health & Counseling in
 * New Haven too, the school's own: free to a student Yale Health covers, as its
 * Basic Plan's mental health care is, and to nobody else; SLATE takes its first
 * appointment a week on, as a private practice's, and its course as a private
 * one's. Until then New Haven, where every student lives, had no therapist,
 * and a student's depression could only be kept up by its medicine.
 *
 * From 2026-10-12, Adna Linden Psychotherapy in New Haven too, a private
 * practice drawing on cognitive-behavioral models among others, at its full
 * fee of $240 for 60 minutes (adnalinden.com, Fees & Insurance, read
 * 2026-10-12); its sliding scale and its reduced fee for graduate students
 * aren't published, so they aren't kept. Until then New Haven had only Yale's,
 * and somebody Yale Health no longer covered had no therapist there, though the
 * notice of a course ended at Yale said one outside it could take it on.
 *
 * A session missed, asleep or in hospital, is held the next week; until the
 * journeys went on 2026-10-09 one missed away from the town was too, and the
 * check for that went on 2026-10-12. The course
 * done, the depression lifts at the published rate: NHS Talking Therapies'
 * 48.5% reliable recovery (NHS England, March 2025), or for a private course
 * Cuijpers and colleagues' 36% remission with CBT (2023, read from a
 * co-author's copy, so secondhand) (decider `health.therapy`). Lifted, it
 * no longer weighs on the mood or needs its medicine; not, it stays as it
 * was, and another course can be had.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { CITIES } from '../content/geography';
import type { Money } from '../core/money';
import { inSaveMoney } from './banking';
import { payFromBank } from './spending';
import { billCare, coverOn, healthOf, presentForCare } from './health';

/** A practice: where, what a session costs and how long it runs; whether it's the NHS's, or the school's (only for a student Yale Health covers). */
export interface Therapist { cityId: string; name: string; price: number; currency: string; minutes: number; nhs?: boolean; yale?: boolean }
export const THERAPISTS: readonly Therapist[] = [
  { cityId: 'us-ny-newyork', name: 'The Center for CBT', price: (260 + 385) / 2, currency: 'USD', minutes: 45 },
  { cityId: 'us-ct-newhaven', name: 'Yale Mental Health & Counseling', price: 0, currency: 'USD', minutes: 50, yale: true },
  { cityId: 'us-ct-newhaven', name: 'Adna Linden Psychotherapy', price: 240, currency: 'USD', minutes: 60 },
  { cityId: 'us-ca-losangeles', name: 'UCLA Psychology Clinic', price: (30 + 150) / 2, currency: 'USD', minutes: 60 },
  { cityId: 'uk-eng-london', name: 'NHS Talking Therapies', price: 0, currency: 'GBP', minutes: 60, nhs: true },
  { cityId: 'uk-eng-london', name: 'Priory', price: 124, currency: 'GBP', minutes: 50 },
  { cityId: 'ie-lei-dublin', name: 'City Therapy', price: (85 + 90) / 2, currency: 'EUR', minutes: 50 },
  { cityId: 'ca-on-toronto', name: 'CBT Associates', price: 270, currency: 'CAD', minutes: 50 },
  { cityId: 'ca-bc-vancouver', name: 'DBT Center of Vancouver', price: 230, currency: 'CAD', minutes: 50 },
  { cityId: 'mx-cmx-mexicocity', name: 'R&A Psicólogos', price: 800, currency: 'MXN', minutes: 50 },
];
/** NICE NG222's course for less severe depression, its weeks apart; NHS Talking Therapies' wait; the recovery each publishes. */
export const THERAPY = { sessions: 8, nhsWaitDays: 42, recovery: { nhs: 0.485, private: 0.36 } } as const;
export const THERAPY_SESSION_KIND = 'health.therapy_session';

export interface Course { therapist: string; cityId: string; done: number; at: Instant }
export const therapistsIn = (cityId: string): Therapist[] => THERAPISTS.filter((t) => t.cityId === cityId);
export const sessionPrice = (sim: Simulation, t: Therapist): Money => inSaveMoney(sim, Math.round(t.price * 100), t.currency);

export function therapyRefusal(person: Person, name: string, at: Instant): string | undefined {
  const t = THERAPISTS.find((x) => x.name === name && x.cityId === person.currentLocationId);
  if (!t) return 'Choose a therapist where you live.';
  if (t.yale && coverOn(person, at) !== 'yale') return 'Yale Mental Health & Counseling sees students Yale Health covers.';
  if (!healthOf(person).chronic?.depression) return 'A course of therapy here is for depression.';
  if (person.therapy) return 'You’re in a course already.';
  return undefined;
}

/** Whether the course lifts it, at the published rate (decider `health.therapy`); `odds` overrides for the sweep. */
export function therapyLifts(sim: Simulation, person: Person, nhs: boolean, at: Instant, odds?: number): boolean {
  return sim.rng('health.therapy', person.id, String(at)).next() < (odds ?? (nhs ? THERAPY.recovery.nhs : THERAPY.recovery.private));
}

/**
 * A session's hour (from 2026-10-10): five in the afternoon, after classes, on the weekday on or after the day it's
 * due, in the practice's town. Until then a session was booked at whatever hour the course was asked for, so a course
 * asked for at breakfast met at half past seven every week, and once a session slept through stopped counting
 * (`presentForCare`) that course could never end.
 */
export const SESSION_HOUR = 17;
function sessionSlot(t: Therapist, on: Instant): Instant {
  const zone = CITIES.require(t.cityId).timeZone;
  const p = zonedParts(on, zone);
  let at = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: SESSION_HOUR, minute: 0 }, zone);
  if (at < on - MS_DAY / 2) at += MS_DAY;
  for (let i = 0; i < 3 && [0, 6].includes(zonedParts(at, zone).weekday); i += 1) at += MS_DAY;
  return at;
}

function scheduleSession(sim: Simulation, person: Person, t: Therapist, at: Instant): void {
  sim.schedule({ at, kind: THERAPY_SESSION_KIND, label: `Therapy, ${t.name}`, category: 'personal', priority: 35, requiresPlayer: true, durationMinutes: t.minutes, locationId: t.cityId, payload: { personId: person.id } });
}

export function registerTherapy(sim: Simulation): void {
  sim.onCommand<{ therapist: string }, { first: Instant }>('health.therapy', (p, { sim: s }) => {
    const person = s.player;
    const no = therapyRefusal(person, String(p?.therapist), s.now);
    if (no) throw new CommandError(no);
    const t = THERAPISTS.find((x) => x.name === p.therapist && x.cityId === person.currentLocationId)!;
    const first = sessionSlot(t, s.now + (t.nhs ? THERAPY.nhsWaitDays : 7) * MS_DAY);
    person.therapy = { therapist: t.name, cityId: t.cityId, done: 0, at: s.now };
    scheduleSession(s, person, t, first);
    return { first };
  });

  sim.onSchedule(THERAPY_SESSION_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const course = person?.therapy;
    if (!person || !course) return;
    const t = THERAPISTS.find((x) => x.name === course.therapist && x.cityId === course.cityId)!;
    // Asleep or in hospital, the session is held next week: until 2026-10-10 only away was, and a session slept
    // through was paid, counted and could lift the depression. Away was until the journeys went on 2026-10-09; the
    // check for it read the town the course began in, the only one they could be in, and went on 2026-10-12.
    if (!presentForCare(person, item.at)) { item.status = 'missed'; scheduleSession(s, person, t, item.at + 7 * MS_DAY); return; }
    // Yale's counseling sees students Yale Health covers: with the cover gone, the course ends there, and the sessions
    // had stay had (from 2026-10-10: until then it ran on after the cover ended).
    if (t.yale && coverOn(person, item.at) !== 'yale') {
      delete person.therapy;
      if (person.id === s.universe.playerId) s.notify({ category: 'health', title: 'Your Counseling At Yale Ended', body: `Yale Mental Health & Counseling sees students Yale Health covers, and your cover has ended, so your course there stopped after ${course.done} of ${THERAPY.sessions} sessions. A therapist outside Yale can start a new course with you: choose one on Papers, under Health Cover.`, importance: 60, route: '/workspace/papers' });
      return;
    }
    const price = sessionPrice(s, t);
    // Unpaid, a medical bill like any other care's, which goes to the medical debt if it's still unpaid when due
    // (from 2026-10-10; until then it went to the general bills owed, which the medical debt never saw).
    if (price > 0 && !payFromBank(s, person, price, `${t.name}, a session`, 'medical')) billCare(s, person, `${t.name}, a session`, price, item.at);
    course.done += 1;
    if (course.done < THERAPY.sessions) { scheduleSession(s, person, t, item.at + 7 * MS_DAY); return; }
    delete person.therapy;
    const lifted = therapyLifts(s, person, t.nhs === true, item.at);
    const chronic = healthOf(person).chronic;
    if (lifted && chronic?.depression) delete chronic.depression;
    if (person.id === s.universe.playerId) s.notify({ category: 'personal', title: lifted ? 'The Depression Has Lifted' : 'The Course Is Done', body: lifted ? `After ${THERAPY.sessions} sessions with ${t.name}, your depression has lifted. It no longer needs care, and it no longer takes from your morale.` : `You’ve finished ${THERAPY.sessions} sessions with ${t.name}. The depression hasn’t lifted yet, and you can start another course on Papers, under Health Cover.`, importance: 50, route: '/workspace/papers' });
  });
}
