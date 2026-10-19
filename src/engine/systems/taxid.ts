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
  if (citizenOf(person, 'US')) return 'As a US citizen, you already have a Social Security number.';
  if (person.ssn?.status === 'issued') return 'Your Social Security card has already come.';
  if (person.ssn?.status === 'applied') return 'You’ve already applied, and the card is on its way.';
  if (!f1Of(person)) return 'A number is only for someone allowed to work in the US.';
  const school = person.school;
  if (!school || schoolEnded(school.standing)) return 'On an F-1, you can get a number only with on-campus work, and yours ended with your program.';
  if (!registered(school, courseworkOf(sim, person))) return 'On an F-1, you can get a number only with on-campus work that has started or starts within 30 days. Register at the School first: once you’re registered, the School’s work-study counts.';
  if (!passportOf(person, sim.now)) return 'The office asks for your passport, and you don’t have one in force.';
  // “The Social Security office is in New Haven, at 150 Court Street.” went on 2026-10-13, reached by no play: only a
  // student registered at the School gets this far, a life is enrolled only where it begins in New Haven (`populateWorld`,
  // `engine/index.ts`), and nothing has moved a person since the scope reset of 2026-10-09.
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
    if (person.id === s.universe.playerId) s.notify({ category: 'papers', title: 'Your Social Security Card Has Arrived', body: 'You now have a Social Security number. A bank that opens accounts online for people with a number can now open one for you that way.', importance: 45, route: '/workspace/papers' });
  });
}
