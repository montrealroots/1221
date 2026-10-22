/**
 * SLATE — permission to work where one isn't a citizen (docs/WORLD.md, stage
 * 1b), apart from permission to enter (`systems/documents.ts`). From
 * 2026-09-29. The rules and their sources are `content/workrules.ts`.
 *
 * A permission is a document of kind `permit`: a foreign graduate's OPT,
 * applied for at the fee the government charges and decided on the calendar,
 * and the student's status in the United States that it holds open.
 *
 * Until the scope reset of 2026-10-09 it was the career's too: a job was
 * refused where the actor had no permission to do it (`workRefusal`), an
 * agency petitioned for an O-1 on the evidence the credits built, and a
 * Canadian work permit was tied to one production. The career went, and
 * with it every job a permission was for. From 2026-10-21 (the owner's brief
 * 19, D8) professional work came back: each engagement's dates are read
 * against `usWorkAuthorized` when it's booked (`eligibilityRead`,
 * `systems/propay.ts`), and OPT counts each engagement's days as days worked
 * (`daysWorkedIn`). The O-1 and the Canadian permit didn't come back.
 */

import type { Simulation } from '../core/simulation';
import { leftWithout, schoolEnded } from './school';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, MS_HOUR, addDays, dateKey, formatDate, startOfDay, zonedParts, type Instant, type TimeZone } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { usBankHoliday, yaleHoliday } from '../content/usholidays';
import { WORK_RULES } from '../content/workrules';
import { payFromBank } from './spending';
import { citizenOf } from './documents';
import { STARTING, addYears, documentsOf, inForce, isoOfCity, numberFor, type PersonDocument } from './documents';
import { waitsOnVisit } from './papervisits';
import type { Engagement } from './pro';

export const PERMISSION_KIND = 'documents.permission';
export const OPT_WEEK_KIND = 'documents.opt_week';
export const US_STATUS_KIND = 'documents.us_status';


function inSave(sim: Simulation, amount: number, currency: string): Money {
  const cents = Math.round(amount * 100);
  const into = saveCurrency(sim.universe);
  return currency === into ? cents : exchange(cents, currency, into) ?? cents;
}

/**
 * A number of business days on from a moment, Monday to Friday, and with `federal` not a federal holiday either: the
 * days the Federal Government is open, as USCIS counts premium processing's ("does not include weekends, federally
 * observed holidays, or days on which Federal Government offices are closed", 8 CFR 106.4, read on 2026-10-13 at
 * law.cornell.edu). From 2026-10-13: until then every count was Monday to Friday, and an OPT premium filing of Friday
 * 1 June 2029 was decided on Friday 13 July, Juneteenth and the Fourth counted, not Tuesday 17 July (found by the
 * second round of that day). Yale’s working days (`systems/leave.ts`), `federal` given as 'yale', skip Yale’s own
 * holidays and recess days (`yaleHoliday`) from later that day: until then they counted Monday to Friday, and a leave
 * asked for on 18 December 2026 was decided on Christmas Day (found by that day’s final defect pass). SAVE’s
 * (`systems/identity.ts`) are federal workdays from later that day (until then this said they still counted Monday to
 * Friday).
 *
 * Each day is the day it is in `zone`, New Haven’s Eastern time, where every caller’s count is made (from 2026-10-13:
 * until then it was the day in UTC, so a count begun in a New Haven evening, past midnight in UTC, took a Sunday for a
 * Monday and a Friday for a Saturday, and a holiday for the day after it; found by that day’s loose ends).
 */
export function businessDaysOn(at: Instant, days: number, federal: boolean | 'yale' = false, zone: TimeZone = 'America/New_York'): Instant {
  let t = at;
  for (let left = days; left > 0;) {
    t += MS_DAY;
    const d = zonedParts(t, zone).weekday;
    const closed = federal === 'yale' ? yaleHoliday(dateKey(t, zone)) : federal && federalHoliday(dateKey(t, zone));
    if (d !== 0 && d !== 6 && !closed) left -= 1;
  }
  return t;
}

/** The fixed-date federal holidays, 'MM-DD', which a federal office observing one on a Saturday keeps on the Friday. */
const FIXED_FEDERAL = ['01-01', '06-19', '07-04', '11-11', '12-25'];

/**
 * Whether a date, 'YYYY-MM-DD', is a federal holiday as the Federal Government observes it (5 U.S.C. 6103): the Federal
 * Reserve's eleven (`usBankHoliday`), which are the same days and move a Sunday's to the Monday, and a fixed-date one
 * on a Saturday kept on the Friday before (6103(b)), which the Federal Reserve doesn't keep.
 */
function federalHoliday(date: string): boolean {
  if (usBankHoliday(date)) return true;
  const day = new Date(`${date}T12:00:00Z`);
  if (day.getUTCDay() !== 5) return false;
  const saturday = new Date(day.getTime() + MS_DAY).toISOString().slice(5, 10);
  return FIXED_FEDERAL.includes(saturday);
}

/** Their F-1, if they hold or held one. */
export function f1Of(person: Person): PersonDocument | undefined {
  return documentsOf(person).find((d) => d.kind === 'visa' && d.destination === 'US' && d.name.startsWith('F-1'));
}

/** When their program ends: the F-1's end, less the grace after it. */
export function programEnd(person: Person): Instant | undefined {
  const f1 = f1Of(person);
  const planned = f1?.expiresAt !== undefined ? f1.expiresAt - STARTING.graceDays * MS_DAY : undefined;
  // A dismissal ends the program that day (from 2026-10-10: until then a dismissed student's status ran to the end the
  // degree would have had, and sixty days past it).
  // Every way out without the degree, dismissal, withdrawal or a degree withheld, ends it that day too (from 2026-10-10).
  const school = person.school;
  if (planned !== undefined && school && leftWithout(school.standing) && school.endedAt !== undefined) return Math.min(planned, school.endedAt);
  return planned;
}

/**
 * Whether they may work in the US for any employer at a moment (from 2026-10-10): a citizen, or a holder of a US permit
 * in force, OPT or a green card (a permit of its own, `systems/residence.ts`). An F-1 student's own on-campus work isn't
 * this: it's permission for the school's jobs alone, ending with the program (8 CFR 214.2(f)(9)(i)). Unemployment reads
 * it (FUTA 3304(a)(14)), and from 2026-10-21 every engagement's dates (`eligibilityRead`, `systems/propay.ts`). Signing
 * with an agent changes none of it: nothing here reads the professional record's agreements. A line of its own for the
 * green card was added on 2026-10-21 and taken out the same day, when its mutation survived: the permits already count it.
 */
export function usWorkAuthorized(person: Person, at: Instant): boolean {
  if (citizenOf(person, 'US')) return true;
  // Out of status needs no line of its own: status outlives every permit in force (`usStatusEnds`: an OPT's end and sixty
  // days; one canceled for its idle days, no longer valid, the moment it's canceled), and none is granted after it, one
  // pending holding the status open. A line refusing it went on 2026-10-13: the permits settled every case it did (found
  // by that day's final checks).
  return usPermits(person).some((d) => d.status === 'valid' && inForce(d, at));
}

/** Whether they're a student still, at school. */
const studying = (person: Person) => person.school !== undefined && !schoolEnded(person.school.standing);

// ---------------------------------------------------------------------------
// OPT
// ---------------------------------------------------------------------------

export function optRefusal(sim: Simulation, person: Person): string | undefined {
  const end = programEnd(person);
  if (citizenOf(person, 'US')) return 'OPT is for a student on an F-1, and you’re a US citizen.';
  if (end === undefined) return 'OPT is for a student on an F-1, and you haven’t held one.';
  // Post-completion OPT follows a program completed: not a dismissal, a withdrawal or a degree withheld (from 2026-10-10:
  // until then only a dismissal was refused).
  if (person.school && leftWithout(person.school.standing)) return 'OPT follows a completed degree, and you left without one.';
  const opens = end - WORK_RULES.opt.windowBeforeDays * MS_DAY;
  const closes = end + WORK_RULES.opt.windowAfterDays * MS_DAY;
  if (sim.now < opens) return `You can apply from ${formatDate(opens, sim.zone)}, 90 days before your program ends.`;
  if (sim.now > closes) return `The time to apply closed on ${formatDate(closes, sim.zone)}, 60 days after your program ended.`;
  if (documentsOf(person).some((d) => d.kind === 'permit' && d.destination === 'US' && d.name.includes('OPT'))) return 'You’ve already applied for OPT.';
  return undefined;
}

// ---------------------------------------------------------------------------
// Status, and its end
// ---------------------------------------------------------------------------

/**
 * A foreign graduate's status in the United States, from 2026-10-01
 * (`docs/research/world/research-workpermission.json`). A student's F-1
 * status holds while they study and for 60 days after the program ends
 * (8 CFR 214.2(f)(5)(iv)), time to apply for OPT, move on or leave; OPT's for
 * 60 days after it runs out, but not after it's ended for too long without
 * work, a violation that leaves no grace; an O-1's for 10 days past its term
 * (8 CFR 214.1(l)(1)). An application pending holds it. When permission ends
 * the person is told the day their status does (the move home it offered went with travel in the scope reset
 * of 2026-10-09: there's no leaving now, which this said until 2026-10-10 there was);
 * staying past it, they're out of status. That closes the Visa Waiver Program
 * to them for good (INA 217(a)(7)), so a British or Irish citizen's ESTA is
 * refused, and voids the visa they hold (INA 222(g)); work, and an O-1, wait
 * for a consulate at home. Unlawful presence, and the three- and ten-year
 * bars it brings, isn't counted: a student admitted for the duration of
 * status accrues none until the government finds the violation (Guilford
 * College v. Wolf, 2020), which SLATE doesn't draw. Until 2026-10-01 a
 * graduate out of permission stayed on in New York, refused every job,
 * with nothing said, and a played life starved there.
 */
export const STATUS_GRACE_DAYS = { f1: 60, opt: 60, o1: 10, withdrawn: 15, dismissed: 0 } as const;

/**
 * The grace after the program ends, by how it ended (8 CFR 214.2(f)(5)(iv), as in force on 2026-10-10: DHS's rule of
 * 17 July 2026 cutting it to 30 days was stayed by the court on 14 September; research-student-status.json):
 * - **The degree**, 60 days.
 * - **A withdrawal the school authorizes**, 15 days. A degree withheld counts as one here, SLATE's reading: the program
 *   ended without completion, and nothing says the school terminated the record for cause.
 * - **A dismissal**, none: failing to maintain status leaves no grace. Until 2026-10-10 SLATE gave a dismissal the
 *   withdrawal's 15 days.
 */
export function graceDays(person: Person): number {
  const s = person.school?.standing;
  if (s === 'dismissed') return STATUS_GRACE_DAYS.dismissed;
  if (s === 'withdrawn' || s === 'withheld') return STATUS_GRACE_DAYS.withdrawn;
  return STATUS_GRACE_DAYS.f1;
}

const usPermits = (person: Person) => documentsOf(person).filter((d) => d.kind === 'permit' && d.destination === 'US');

/** When their US status ends, grace and all; or nothing for a citizen, someone never a student here, a student still, or one whose application is pending. */
export function usStatusEnds(person: Person): Instant | undefined {
  // A citizen never holds an F-1, so has no status to lose.
  if (!f1Of(person) || studying(person)) return undefined;
  const permits = usPermits(person);
  if (permits.some((d) => d.status === 'pending')) return undefined;
  let ends = (programEnd(person) ?? 0) + graceDays(person) * MS_DAY;
  for (const d of permits) {
    if (d.status === 'valid' && d.expiresAt !== undefined) ends = Math.max(ends, d.expiresAt + (d.name.includes('OPT') ? STATUS_GRACE_DAYS.opt : STATUS_GRACE_DAYS.o1) * MS_DAY);
    if (d.endedAt !== undefined) ends = Math.max(ends, d.endedAt);
  }
  return ends;
}

/** The next day their status is looked at: when the permission they hold runs out, or when the grace after it does. */
function statusCheckAt(sim: Simulation, person: Person): Instant | undefined {
  if (person.usOutOfStatus !== undefined) return undefined;
  if (!f1Of(person)) return undefined;
  const end = programEnd(person) ?? sim.now;
  const held = usPermits(person).filter((d) => d.status === 'valid' && inForce(d, sim.now)).map((d) => d.expiresAt ?? sim.now);
  const permission = Math.max(end, ...held);
  if (permission > sim.now) return permission;
  const ends = usStatusEnds(person);
  // A program ending this very moment with grace ahead of it (a withdrawal) is looked at a minute on, inside the grace,
  // where its notice is raised. Until 2026-10-13 the look went to the grace's end, where it found them out of status
  // without a word; found by that day's evidence pass. A dismissal has no grace, and is out of status at once.
  if (permission === sim.now && permission === end && ends !== undefined && ends > sim.now) return sim.now + 60_000;
  return ends === undefined ? undefined : Math.max(sim.now, ends);
}

/** Looks at their status again when it next can change, in place of any look already on the calendar. */
export function scheduleUsStatus(sim: Simulation, person: Person): void {
  for (const one of sim.universe.scheduled) if (one.status === 'pending' && one.kind === US_STATUS_KIND && one.payload.personId === person.id) sim.timeline.cancel(one.id, sim.now);
  const at = statusCheckAt(sim, person);
  if (at !== undefined) sim.schedule({ at, kind: US_STATUS_KIND, label: 'US Status', category: 'system', priority: 5, payload: { personId: person.id } });
}

// The days on a job counted against OPT's days without work (`onAJob`) until the career went on 2026-10-09, after which
// every day was one without work. From 2026-10-21 (brief 19's D8) the days of each engagement counted as days worked
// again, a week at a time (`daysWorkedIn`): any day an engagement not called off was booked for, worked or not. From
// 2026-10-22 (the owner's brief 22) the count is by the day, of employment (below): `daysWorkedIn` went, and with it a
// booked day counted as worked, a 91st day found up to six days late, and an engagement called off after it began
// losing its worked days from the count.

// ---------------------------------------------------------------------------
// OPT's days without employment, counted by the day (from 2026-10-22, the owner's brief 22)
// ---------------------------------------------------------------------------

/** OPT's days are New York's, where the School and every engagement are. */
export const OPT_ZONE: TimeZone = 'America/New_York';

/**
 * Permission to work in the US ended at a moment (`{ personId, at, why }`), for the work system to release what was
 * booked past it (`systems/projobs.ts`): `why` is 'opt-idle' for OPT's days without work run out.
 */
export const PERMISSION_ENDED = 'documents.work_permission_ended';

/**
 * An engagement's scheduled hours a week over its span, its first day's start to its last day's end, a span under a
 * week counted as a week. SEVP asks "at least 20 hours per week ... If a student has a variable schedule, within a
 * month, it should average out to at least 20 hours per week" (`WORK_RULES.opt.weeklyHours`). Averaged over the
 * engagement, not a month, SLATE's reading: a performance's record is its two and a half hours on stage, not the calls
 * around it, so a run's performance weeks read fifteen hours, which a month's window would take for unemployment.
 * Every engagement the game has averages 22 or more.
 */
export function weeklyHours(e: Pick<Engagement, 'days'>): number {
  if (!e.days.length) return 0;
  const hours = e.days.reduce((a, d) => a + (d.to - d.from) / MS_HOUR, 0);
  return hours / Math.max(1, (e.days[e.days.length - 1]!.to - e.days[0]!.from) / (7 * MS_DAY));
}

/**
 * The stretch an engagement employed them (from 2026-10-22, the owner's brief 22): from the start of its first day
 * worked to the end of its last day, or to the moment it was called off, where its hours qualify (`weeklyHours`). None
 * where no day of it was worked: a contract signed for work not yet begun is a booking, not employment (SEVP 4.9's
 * "qualifying job"; DHS: a record that "lacks employer information is considered unemployed"). A day missed inside it
 * stays employed, as leave the employer allows (SEVP 7.1.8), SLATE's reading. `planned` reads the work booked as if
 * each day goes ahead, from its first day: what Papers projects, never what's counted.
 */
export function employmentSpan(e: Engagement, planned = false): { from: Instant; to: Instant } | undefined {
  if (!e.days.length || weeklyHours(e) < WORK_RULES.opt.weeklyHours) return undefined;
  const last = e.days[e.days.length - 1]!.to;
  if (planned && (e.status === 'booked' || e.status === 'preparing' || e.status === 'working')) {
    const first = e.log?.find((l) => l.status === 'worked')?.at ?? e.days[0]!.from;
    return { from: startOfDay(first, OPT_ZONE), to: last };
  }
  const worked = (e.log ?? []).filter((l) => l.status === 'worked').map((l) => l.at);
  if (!worked.length) return undefined;
  return { from: startOfDay(Math.min(...worked), OPT_ZONE), to: e.status === 'canceled' ? Math.min(last, e.finishedAt ?? last) : last };
}

/** Whether a New York day, `from` to `to`, had employment (`employmentSpan`) in any engagement. */
export function employedOn(person: Person, from: Instant, to: Instant, planned = false): boolean {
  return (person.pro?.engagements ?? []).some((e) => {
    const span = employmentSpan(e, planned);
    return span !== undefined && span.from < to && span.to > from;
  });
}

/** The OPT in force, valid, if they hold one. */
const optHeld = (person: Person): PersonDocument | undefined => documentsOf(person).find((d) => d.kind === 'permit' && d.destination === 'US' && d.status === 'valid' && d.name.includes('OPT'));

/**
 * Where OPT's count stands: the start of the first New York day not yet counted. A permit approved from brief 22 on
 * keeps it (`countedTo`). One from before counted by weeks from its first day, seven days a week, its days without
 * work and its days worked between them, so its count reached that many days on; it goes on from there, and nothing
 * already counted is counted again.
 */
function countedFrom(doc: PersonDocument): Instant {
  if (doc.countedTo !== undefined) return doc.countedTo;
  const counted = (doc.idleDays ?? 0) + (doc.workedDays ?? 0);
  return addDays(startOfDay(doc.issuedAt!, OPT_ZONE), counted, OPT_ZONE);
}

/**
 * OPT's days counted up to `until` (from 2026-10-22, the owner's brief 22): each New York day from its first, once it's
 * over, a day with employment (`employedOn`) or a day without, weekends included (SEVP 7.1.6: "Each day (including
 * weekends) ... that the student does not have qualifying employment counts as a day of unemployment"), and none after
 * its end date. Each day once, from where the count stopped, so a long advance counts every day, and two advances or a
 * save opened in between count it as one. More than 90 days without work ends it at the midnight that ends the 91st:
 * "Students may not accrue an aggregate of more than 90 days of unemployment" (8 CFR 214.2(f)(10)(ii)(E)).
 */
export function settleOpt(sim: Simulation, person: Person, until: Instant = sim.now): void {
  const doc = optHeld(person);
  if (!doc || doc.issuedAt === undefined) return;
  let day = Math.max(countedFrom(doc), startOfDay(doc.issuedAt, OPT_ZONE));
  for (let end = addDays(day, 1, OPT_ZONE); end <= until && (doc.expiresAt === undefined || day < doc.expiresAt); end = addDays(day, 1, OPT_ZONE)) {
    if (employedOn(person, day, end)) doc.workedDays = (doc.workedDays ?? 0) + 1;
    else doc.idleDays = (doc.idleDays ?? 0) + 1;
    day = end;
    doc.countedTo = day;
    if (doc.idleDays! > WORK_RULES.opt.unemploymentDays) {
      endOpt(sim, person, doc, day);
      return;
    }
  }
  doc.countedTo = day;
}

/**
 * OPT ended for its days without work, at `at`: canceled, ended then, the status with it (no grace after: SEVP 7.4.2,
 * "has violated his or her status"), said, and the work booked past it released by the work system, which can't go on
 * employing them (8 U.S.C. 1324a(a)(2)) (`PERMISSION_ENDED`). Until 2026-10-22 (the owner's brief 22) nothing was said
 * to the work booked, and b20-4 played 47 days of a run after its OPT ended.
 */
function endOpt(sim: Simulation, person: Person, doc: PersonDocument, at: Instant): void {
  doc.status = 'cancelled';
  doc.endedAt = at;
  scheduleUsStatus(sim, person);
  if (person.id === sim.universe.playerId) sim.notify({ category: 'personal', title: 'OPT Ended', body: `You’d had more than ${WORK_RULES.opt.unemploymentDays} days without work since your OPT began, so it ended at the end of ${formatDate(at - 1, OPT_ZONE)}, and with it your permission to work in the United States. A day counts as one with work only once a job has begun, so the days waiting for booked work to start counted against it. Your US status ends with it, with no grace period.`, importance: 85, route: '/workspace/papers' });
  sim.emit(PERMISSION_ENDED, { personId: person.id, at, why: 'opt-idle' });
}

/**
 * When an OPT in force runs out of its days without work, if it does before its end date: the days counted so far, then
 * each day to come with the work booked as if it goes ahead from its first day (`employedOn`, planned), a booking's
 * days before it starting days without work. What Papers says the status ends on.
 */
export function optRunsOut(person: Person): Instant | undefined {
  const doc = optHeld(person);
  if (!doc || doc.issuedAt === undefined) return undefined;
  let idle = doc.idleDays ?? 0;
  let day = Math.max(countedFrom(doc), startOfDay(doc.issuedAt, OPT_ZONE));
  for (let n = 0; n < 800 && (doc.expiresAt === undefined || day < doc.expiresAt); n += 1) {
    const end = addDays(day, 1, OPT_ZONE);
    if (!employedOn(person, day, end, true)) idle += 1;
    if (idle > WORK_RULES.opt.unemploymentDays) return end;
    day = end;
  }
  return undefined;
}

/**
 * Whether permission to work in the US covers the whole of a stretch of work, its start and its end (from 2026-10-22,
 * the owner's brief 22): what a work day reads when it comes, and acceptance reads for each day. Until then acceptance
 * read each day's start alone, and the work day nothing.
 */
export function workAuthorizedFor(person: Person, day: { from: Instant; to: Instant }): boolean {
  return usWorkAuthorized(person, day.from) && usWorkAuthorized(person, day.to - 1);
}

export function registerPermission(sim: Simulation): void {
  const payOrRefuse = (s: Simulation, person: Person, amount: Money, memo: string) => {
    if (!payFromBank(s, person, amount, memo, 'documents')) throw new CommandError(`Your bank can’t cover ${formatMoney(amount, saveCurrency(s.universe))}, so nothing was charged.`);
  };

  sim.onCommand<{ premium?: boolean }, { readyAt: Instant; fee: Money }>('documents.apply_opt', (p, { sim: s }) => {
    const person = s.player;
    const premium = Boolean(p?.premium);
    const no = optRefusal(s, person);
    if (no) throw new CommandError(no);
    const r = WORK_RULES.opt;
    const fee = inSave(s, r.fee + (premium ? r.premiumFee : 0), r.currency);
    payOrRefuse(s, person, fee, `${r.form}, OPT${premium ? ', premium processing' : ''}`);
    const readyAt = premium ? businessDaysOn(s.now, r.premiumBusinessDays, true) : s.now + r.standardDays * MS_DAY;
    const id = s.nextId('document');
    documentsOf(person).push({ id, kind: 'permit', issuer: 'US', name: 'Employment Authorization, OPT', number: numberFor('IOE', id), status: 'pending', appliedAt: s.now, readyAt, destination: 'US' });
    s.schedule({ at: readyAt, kind: PERMISSION_KIND, label: 'OPT Decided', category: 'system', priority: 20, payload: { personId: person.id, documentId: id } });
    // Applied for, the status's ending is answered (from 2026-10-10: until then its decision stayed open, offering OPT again).
    for (const d of Object.values(s.universe.decisions)) if (d.refType === 'us-status' && !d.resolvedAt) d.resolvedAt = s.now;
    return { readyAt, fee };
  });

  sim.onSchedule(PERMISSION_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const doc = person ? documentsOf(person).find((d) => d.id === item.payload.documentId) : undefined;
    if (!person || !doc || doc.status !== 'pending') return;
    // Its biometrics not yet given, it waits on them (from 2026-10-06, `systems/papervisits.ts`).
    if (waitsOnVisit(doc) || (doc.readyAt ?? 0) > s.now) return;
    const mine = person.id === s.universe.playerId;
    const tell = (title: string, body: string) => { if (mine) s.notify({ category: 'personal', title, body, importance: 75, route: '/workspace/papers' }); };
    if (doc.name.includes('OPT')) {
      // Decided by the rule it was applied for under: a program left without its degree, dismissed, withdrawn or its degree
      // withheld after the application, is denied in `optRefusal`'s words, and USCIS keeps the fee (from 2026-10-17: until
      // then an application made in the 90 days before the program's end was approved whatever came of the degree, found
      // by brief 13's journeys). Its status's ending is then worked out as without it.
      if (person.school && leftWithout(person.school.standing)) {
        doc.status = 'cancelled';
        scheduleUsStatus(s, person);
        tell('OPT Denied', 'USCIS denied your OPT, because OPT follows a completed degree and you left without one. The fee isn’t refunded.');
        return;
      }
      // Twelve months from the later of the program's end and the approval.
      const start = Math.max(programEnd(person) ?? s.now, s.now);
      doc.status = 'valid';
      doc.issuedAt = start;
      doc.expiresAt = addYears(start, WORK_RULES.opt.months / 12);
      doc.idleDays = 0;
      // Counted by the day from its first (`settleOpt`, from 2026-10-22, the owner's brief 22), each day at the world's
      // midnight: until then by the week, a week from its start (`OPT_WEEK_KIND`), which an older save still holds.
      doc.countedTo = startOfDay(start, OPT_ZONE);
      scheduleUsStatus(s, person);
      // From 2026-10-21 (brief 19's D8) the days of professional work counted: until then this said the game had no work
      // after the degree, so in practice OPT ended after its 90 days. From 2026-10-22 (brief 22) it says what counts: a
      // day of a job begun, not a day booked.
      tell('OPT Approved', `You may work in the United States from ${formatDate(start, s.zone)} to ${formatDate(doc.expiresAt, s.zone)}. Every day from the first day of a job to its last counts as a day with work, and every other day as one without, the days before a job you’ve booked begins among them. OPT ends once you’ve had more than ${WORK_RULES.opt.unemploymentDays} days without work in total.`);
      return;
    }
    // An O-1's petition and a production's Canadian permit were decided here until the career went on 2026-10-09.
  });

  sim.onSchedule(US_STATUS_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (!person || person.usOutOfStatus !== undefined) return;
    // Gone home, or never here: nothing to lose.
    if (isoOfCity(person.currentLocationId) !== 'US') return;
    const ends = usStatusEnds(person);
    if (ends === undefined) return;
    const next = statusCheckAt(s, person);
    const mine = person.id === s.universe.playerId;
    if (next !== undefined && next > s.now) {
      // Permission's run out and the grace has begun: say so, once, with the way home.
      if (ends > s.now && !usPermits(person).some((d) => d.status === 'valid' && inForce(d, s.now)) && mine) {
        const opt = !optRefusal(s, person);
        s.requireDecision({
          urgency: 90, category: 'personal', title: 'Your US Status Is Ending',
          detail: `Your permission to work in the United States has ended, and your status ends ${formatDate(ends, s.zone)}.${opt ? ' You can still apply for OPT before then.' : ''} If you’re still here after that, you’ll be out of status. In the game, that means you can’t work here, your US visa is canceled, and the Visa Waiver Program is closed to you from then on.`,
          route: '/workspace/papers', dueAt: ends, refType: 'us-status', refId: String(ends),
          // The move home went with the career's relocation on 2026-10-09. Standard, or premium said so (from 2026-10-10:
          // until then the one button applied with premium processing, and its fee, without saying).
          actions: opt ? [{ label: 'Apply For OPT', commandKind: 'documents.apply_opt', payload: {} }, { label: 'Apply For OPT, Premium Processing', commandKind: 'documents.apply_opt', payload: { premium: true } }] : [],
        });
      }
      scheduleUsStatus(s, person);
      return;
    }
    // Stayed past it: out of status.
    person.usOutOfStatus = ends;
    const f1 = f1Of(person);
    if (f1 && f1.status === 'valid') f1.status = 'cancelled';
    if (mine) s.notify({ category: 'personal', title: 'Out Of Status', body: 'You stayed in the United States past the end of your status, so you’re now out of status. In the game, your US visa is canceled and the Visa Waiver Program is closed to you from now on.', importance: 90, route: '/workspace/papers' });
  });

  // OPT's weekly count, from a save made before 2026-10-22 (the owner's brief 22), which still holds its next week on
  // the calendar: the days to that week's end counted by the day (`settleOpt`), and no week after it, the day's count
  // going on at each midnight. Until then each week added its seven less the days any engagement not called off was
  // booked for, and ended OPT at the week's end once they passed 90, whatever was booked ahead.
  sim.onSchedule(OPT_WEEK_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (person) settleOpt(s, person, item.at);
  });

  // OPT's day, counted at each of the world's midnights (from 2026-10-22, the owner's brief 22): the day just over, a
  // day with employment or without (`settleOpt`).
  sim.onEvent('world.day_rollover', 'documents.opt_day', (_event, { sim: s }) => {
    for (const person of Object.values(s.universe.people)) settleOpt(s, person, s.now);
  });
}
