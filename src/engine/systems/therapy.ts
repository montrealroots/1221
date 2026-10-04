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
 * A session missed, away from the town, is held the next week. The course
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
import { MS_DAY, type Instant } from '../core/time';
import type { Money } from '../core/money';
import { inSaveMoney } from './banking';
import { owe, payFromBank } from './household';
import { healthOf } from './health';

export interface Therapist { cityId: string; name: string; price: number; currency: string; minutes: number; nhs?: boolean }
export const THERAPISTS: readonly Therapist[] = [
  { cityId: 'us-ny-newyork', name: 'The Center for CBT', price: (260 + 385) / 2, currency: 'USD', minutes: 45 },
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

export function therapyRefusal(person: Person, name: string): string | undefined {
  const t = THERAPISTS.find((x) => x.name === name && x.cityId === person.home?.cityId);
  if (!t) return 'Choose a therapist where you live.';
  if (!healthOf(person).chronic?.depression) return 'A course of therapy here is for depression.';
  if (person.therapy) return 'You’re in a course already.';
  return undefined;
}

/** Whether the course lifts it, at the published rate (decider `health.therapy`); `odds` overrides for the sweep. */
export function therapyLifts(sim: Simulation, person: Person, nhs: boolean, at: Instant, odds?: number): boolean {
  return sim.rng('health.therapy', person.id, String(at)).next() < (odds ?? (nhs ? THERAPY.recovery.nhs : THERAPY.recovery.private));
}

function scheduleSession(sim: Simulation, person: Person, t: Therapist, at: Instant): void {
  sim.schedule({ at, kind: THERAPY_SESSION_KIND, label: `Therapy, ${t.name}`, category: 'personal', priority: 35, requiresPlayer: true, durationMinutes: t.minutes, locationId: t.cityId, payload: { personId: person.id } });
}

export function registerTherapy(sim: Simulation): void {
  sim.onCommand<{ therapist: string }, { first: Instant }>('health.therapy', (p, { sim: s }) => {
    const person = s.player;
    const no = therapyRefusal(person, String(p?.therapist));
    if (no) throw new CommandError(no);
    const t = THERAPISTS.find((x) => x.name === p.therapist && x.cityId === person.home!.cityId)!;
    const first = s.now + (t.nhs ? THERAPY.nhsWaitDays : 7) * MS_DAY;
    person.therapy = { therapist: t.name, cityId: t.cityId, done: 0, at: s.now };
    scheduleSession(s, person, t, first);
    return { first };
  });

  sim.onSchedule(THERAPY_SESSION_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const course = person?.therapy;
    if (!person || !course) return;
    const t = THERAPISTS.find((x) => x.name === course.therapist && x.cityId === course.cityId)!;
    // Away, the session is held next week.
    if (person.currentLocationId !== t.cityId) { item.status = 'missed'; scheduleSession(s, person, t, item.at + 7 * MS_DAY); return; }
    const price = sessionPrice(s, t);
    if (price > 0 && !payFromBank(s, person, price, `${t.name}, a session`, 'medical')) owe(s, person, price, `${t.name}, a session`, 'medical');
    course.done += 1;
    if (course.done < THERAPY.sessions) { scheduleSession(s, person, t, item.at + 7 * MS_DAY); return; }
    delete person.therapy;
    const lifted = therapyLifts(s, person, t.nhs === true, item.at);
    const chronic = healthOf(person).chronic;
    if (lifted && chronic?.depression) delete chronic.depression;
    if (person.id === s.universe.playerId) s.notify({ category: 'personal', title: lifted ? 'The Depression Has Lifted' : 'The Course Is Done', body: lifted ? `After ${THERAPY.sessions} sessions with ${t.name}, it no longer weighs on you.` : `${THERAPY.sessions} sessions with ${t.name}; it hasn’t lifted yet, and another course can be had.`, importance: 50, route: '/workspace/papers' });
  });
}
