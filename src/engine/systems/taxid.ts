/**
 * SLATE — a US taxpayer number: whether one is held, applied for or not yet open to them (from 2026-10-10).
 *
 * No number is ever drawn, shown or kept: only its status, which is what the banks, the payroll and the tax return
 * read. Until then SLATE kept none, and every student could open any bank's account online.
 *
 * - **A US citizen** holds a Social Security number, issued long before the story begins.
 * - **A student on an F-1** may apply for one only with on-campus work that has begun or begins within 30 days (SSA
 *   POMS RM 10211.245): the School's work-study, from registration. In person at the Social Security office in New
 *   Haven (150 Court Street), with the passport, the I-94, the I-20 and the letters from the international office and
 *   the employer; the card comes in two to three weeks, SLATE taking three. Yale pays wages before it comes, as the
 *   IRS lets an employer report "Applied For"; SLATE's reading, since Yale's own practice wasn't found.
 * - **Without one**, a nonresident's 1040-NR goes in with a W-7 for an ITIN, which takes seven weeks before the return
 *   is processed and any refund is sent (`systems/taxreturn.ts`); and a bank that opens accounts for international
 *   students opens one only in a branch (`systems/bankmoves.ts`).
 *
 * Sources: docs/research/world/research-student-status.json (A1, A2).
 */
import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, type Instant } from '../core/time';
import { YALE_DRAMA } from '../content/school';
import { citizenOf } from './documents';
import { f1Of } from './permission';
import { passportOf } from './documents';
import { registered, schoolEnded } from './school';
import { courseworkOf } from './coursework';
import { startRefusal } from './life';

export const SSN_ARRIVES_KIND = 'documents.ssn_arrives';
/** The card's days, the longer end of "2-3 weeks"; the visit's minutes, SLATE's estimate. */
export const SSN = { days: 21, visitMinutes: 60, itinWeeks: 7 } as const;

export interface SsnRecord {
  status: 'applied' | 'issued';
  appliedAt: Instant;
  arrivesAt?: Instant;
}

/** Whether they hold a Social Security number. */
export function hasSsn(person: Person): boolean {
  return citizenOf(person, 'US') || person.ssn?.status === 'issued';
}

/** Why they can't apply now, or nothing. */
export function ssnRefusal(sim: Simulation, person: Person): string | undefined {
  if (citizenOf(person, 'US')) return 'You have a Social Security number already, as a citizen.';
  if (person.ssn?.status === 'issued') return 'Your Social Security card came already.';
  if (person.ssn?.status === 'applied') return 'You’ve applied; the card is on its way.';
  if (!f1Of(person)) return 'A number is for someone allowed to work in the US.';
  const school = person.school;
  if (!school || schoolEnded(school.standing)) return 'On an F-1, the number needs on-campus work, which ends with the program.';
  if (!registered(school, courseworkOf(sim, person))) return 'On an F-1, the number needs on-campus work begun or starting within 30 days: register first, and the School’s work-study is yours.';
  if (!passportOf(person, sim.now)) return 'The office asks for your passport, in force.';
  if (person.currentLocationId !== YALE_DRAMA.cityId) return 'The Social Security office is in New Haven, at 150 Court Street.';
  return startRefusal(sim, person, SSN.visitMinutes, true);
}

export function registerTaxId(sim: Simulation): void {
  sim.onCommand<Record<string, never>, { arrivesAt: Instant }>('documents.apply_ssn', (_p, { sim: s }) => {
    const person = s.player;
    const no = ssnRefusal(s, person);
    if (no) throw new CommandError(no);
    s.advanceTo(s.now + SSN.visitMinutes * 60_000);
    const arrivesAt = s.now + SSN.days * MS_DAY;
    person.ssn = { status: 'applied', appliedAt: s.now, arrivesAt };
    s.schedule({ at: arrivesAt, kind: SSN_ARRIVES_KIND, label: 'Your Social Security Card Comes', category: 'personal', priority: 30, payload: { personId: person.id } });
    return { arrivesAt };
  });

  sim.onSchedule(SSN_ARRIVES_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (!person || person.ssn?.status !== 'applied') return;
    person.ssn = { ...person.ssn, status: 'issued' };
    if (person.id === s.universe.playerId) s.notify({ category: 'papers', title: 'Your Social Security Card Came', body: 'Give it to the School’s payroll and your bank. A bank that opens accounts online for someone with a number can now.', importance: 45, route: '/workspace/papers' });
  });
}
