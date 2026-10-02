/**
 * SLATE — permission to work where one isn't a citizen (docs/WORLD.md, stage
 * 1b), apart from permission to enter (`systems/documents.ts`). From
 * 2026-09-29. The rules and their sources are `content/workrules.ts`.
 *
 * A permission is a document of kind `permit`: a foreign graduate's OPT, an
 * O-1 an agency petitioned for, a Canadian work permit tied to one
 * production. A job is refused where the actor has no permission to do it,
 * and the offer says what would give it; a permit applied for is decided on
 * the calendar, at the fee the government charges, and an O-1 on the
 * evidence the career has built.
 */

import { AGENCIES } from '../content/career';
import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, MS_HOUR, formatDate, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES, COUNTRIES } from '../content/geography';
import { ENTRY } from '../content/entry';
import { WORK_RULES } from '../content/workrules';
import { UNION_HEALTH, type RateSteps } from '../content/career';
import { ATTRIBUTES, attributesOf } from './attributes';
import { payFromBank } from './household';
import { careerOf, homeAbroadOf, workDays, type Booking } from './career';
import { earningsOf } from './earnings';
import { citizenOf } from './documents';
import { STARTING, addYears, documentsOf, inForce, isoOfCity, isoOfCountry, numberFor, theCountry, type PersonDocument } from './documents';

export const PERMISSION_KIND = 'documents.permission';
export const OPT_WEEK_KIND = 'documents.opt_week';
export const US_STATUS_KIND = 'documents.us_status';

const cityLabel = (id: string): string => CITIES.get(id)?.name ?? id;
const SAG_THRESHOLD = UNION_HEALTH.sagThreshold as RateSteps;

function inSave(sim: Simulation, amount: number, currency: string): Money {
  const cents = Math.round(amount * 100);
  const into = saveCurrency(sim.universe);
  return currency === into ? cents : exchange(cents, currency, into) ?? cents;
}

/** A number of business days on from a moment, Monday to Friday. */
export function businessDaysOn(at: Instant, days: number): Instant {
  let t = at;
  for (let left = days; left > 0;) {
    t += MS_DAY;
    const d = new Date(t).getUTCDay();
    if (d !== 0 && d !== 6) left -= 1;
  }
  return t;
}

/** Their F-1, if they hold or held one. */
export function f1Of(person: Person): PersonDocument | undefined {
  return documentsOf(person).find((d) => d.kind === 'visa' && d.destination === 'US' && d.name.startsWith('F-1'));
}

/** When their program ends: the F-1's end, less the grace after it. */
export function programEnd(person: Person): Instant | undefined {
  const f1 = f1Of(person);
  return f1?.expiresAt !== undefined ? f1.expiresAt - STARTING.graceDays * MS_DAY : undefined;
}

/** Whether they're a student still, at school. */
const studying = (person: Person) => person.school !== undefined && person.school.standing !== 'graduated' && person.school.standing !== 'dismissed';

/** A permission they hold in a country, in force from one day to another, for a job where it's tied to one. */
export function permitFor(person: Person, iso: string, from: Instant, to: Instant, bookingId?: string): PersonDocument | undefined {
  return documentsOf(person).find((d) => d.kind === 'permit' && d.destination === iso && inForce(d, from) && (d.expiresAt ?? Infinity) >= to && (d.bookingId === undefined || d.bookingId === bookingId));
}

/**
 * Why a person may not work in a town's country from one day to another, on a
 * job, or nothing: a citizen may, and so may free movement; a UK location
 * shoot for an overseas production is a visitor's; a US citizen's Canadian
 * permit is issued at the border on arrival; otherwise a permission in
 * force for the days, and what would give one.
 */
export function workRefusal(person: Person, cityId: string, from: Instant, to: Instant, booking?: Booking): string | undefined {
  const iso = isoOfCity(cityId);
  const own = isoOfCountry(person.citizenshipId);
  if (!iso || citizenOf(person, iso)) return undefined;
  if (own && ENTRY[iso]?.citizens[own]?.status === 'free-movement') return undefined;
  if (permitFor(person, iso, from, to, booking?.id)) return undefined;
  if (iso === 'GB' && booking?.location) return undefined;
  if (iso === 'CA' && booking?.location && own === 'US') return undefined;
  const there = theCountry(COUNTRIES.get(iso.toLowerCase())?.name ?? iso);
  if (iso === 'US') {
    if (f1Of(person) && studying(person)) return 'On an F-1 visa a student works off campus only on training the school authorizes, and Yale’s program has none: not while you study.';
    const end = programEnd(person);
    if (person.usOutOfStatus !== undefined && isoOfCity(person.home?.cityId ?? person.currentLocationId) === 'US') return 'You’re out of status in the United States: no permission to work can be had while you stay.';
    if (end !== undefined && documentsOf(person).some((d) => d.kind === 'permit' && d.destination === 'US' && d.status === 'pending')) return 'Your application is being decided: no work until it’s approved.';
    if (end !== undefined && from < end + WORK_RULES.opt.windowAfterDays * MS_DAY && !documentsOf(person).some((d) => d.kind === 'permit' && d.destination === 'US')) return `Work in ${there} needs permission: apply for OPT, which runs twelve months from your degree.`;
    return `Work in ${there} needs permission you don’t hold for those days: an O-1, which a US agency petitions for.`;
  }
  if (iso === 'CA') return 'A work permit for the production (C14): apply for it before you travel.';
  return `SLATE doesn’t have the rules for working in ${there} yet.`;
}

/** A job's work days, from the first call to the last. */
export function jobSpan(booking: Booking): { from: Instant; to: Instant } {
  const days = workDays(booking);
  return { from: days[0]!.at, to: days[days.length - 1]!.at };
}

// ---------------------------------------------------------------------------
// OPT
// ---------------------------------------------------------------------------

export function optRefusal(sim: Simulation, person: Person): string | undefined {
  const end = programEnd(person);
  if (citizenOf(person, 'US')) return 'OPT is for a student on an F-1; you’re a citizen.';
  if (end === undefined) return 'OPT is for a student on an F-1, and you haven’t held one.';
  if (person.school?.standing === 'dismissed') return 'OPT follows a degree completed.';
  const opens = end - WORK_RULES.opt.windowBeforeDays * MS_DAY;
  const closes = end + WORK_RULES.opt.windowAfterDays * MS_DAY;
  if (sim.now < opens) return `It opens ${formatDate(opens, sim.zone)}, 90 days before the program ends.`;
  if (sim.now > closes) return `It closed ${formatDate(closes, sim.zone)}, 60 days after the program ended.`;
  if (documentsOf(person).some((d) => d.kind === 'permit' && d.destination === 'US' && d.name.includes('OPT'))) return 'You’ve applied for OPT already.';
  return undefined;
}

// ---------------------------------------------------------------------------
// O-1
// ---------------------------------------------------------------------------

/** The kinds of evidence of 8 CFR 214.2(o)(3)(v)(B) the career shows, as SLATE reads them. */
export interface O1Evidence { key: string; label: string; met: boolean }

const LEADS = new Set(['series-half', 'series-hour', 'broadway', 'lort-a-plus']);
// Regional (LORT) and Off-Broadway companies are distinguished organizations as the regulation means them.
const DISTINGUISHED = new Set(['guest-half', 'guest-hour', 'recurring', 'film-weekly', 'lort-b', 'offb-commercial', 'offb-nonprofit']);
/**
 * The letters a petition carries for recognition from experts (8 CFR
 * 214.2(o)(3)(v)(B)(5)): one from a director or producer of each
 * production they worked on in a part that person would know, and at least
 * three, the low end of the three to six the immigration firms advise (no
 * USCIS source sets a number). A co-star's day or a commercial doesn't leave
 * a director who knows the work, and a teacher's letter isn't one: the
 * Administrative Appeals Office dismissed petitions resting on faculty
 * letters as conclusory (2015-01-06; 2022-01-14). Until 2026-09-29 it was
 * read from reputation, SLATE's guess at a threshold; researched the same
 * day, it's read from the credits.
 */
export const LETTERS_NEEDED = 3;
const LETTER_ROLES = new Set(['guest-half', 'guest-hour', 'recurring', 'series-half', 'series-hour', 'film-weekly', 'film-low', 'film-mlb', 'film-ulb', 'lort-b', 'lort-a-plus', 'broadway', 'offb-commercial', 'offb-nonprofit']);

/**
 * What an O-1B petition shows of the six kinds of evidence, as SLATE reads
 * its career: a lead in a distinguished production (a series regular, or
 * Broadway); a name the public knows (recognition past the point it lifts
 * pay, `ATTRIBUTES.overscale`); a critical role for a distinguished
 * organization (a guest star, a recurring role, a studio film, a regional or
 * Off-Broadway company); recognition from experts in the field, the letters
 * from directors and producers a petition carries (`LETTERS_NEEDED`); and
 * remuneration high in the field (a year's acting
 * at SAG-AFTRA's health plan threshold). A record of commercial or critical
 * success isn't kept per actor, so SLATE can't show it: three of these five
 * are needed. Until 2026-09-29, the day it was written, it read four, and
 * left a stage actor's companies and the experts' letters out.
 */
export function o1Evidence(sim: Simulation, person: Person): O1Evidence[] {
  const career = careerOf(person);
  const credits = career.credits.map((c) => c.roleId);
  const thresholdFor = (year: number) => { let v = SAG_THRESHOLD[0]![1]; for (const [from, amount] of SAG_THRESHOLD) if (from <= `${year}-12-31`) v = amount; return v; };
  const paid = Object.entries(earningsOf(person).years).some(([y, e]) => e.acting >= thresholdFor(Number(y)));
  return [
    { key: 'lead', label: 'A Lead In A Distinguished Production', met: credits.some((r) => LEADS.has(r)) },
    { key: 'known', label: 'A Name The Public Knows', met: attributesOf(sim, person).recognition >= ATTRIBUTES.overscale.from },
    { key: 'critical', label: 'A Critical Role For A Distinguished Organization', met: credits.some((r) => DISTINGUISHED.has(r)) },
    { key: 'experts', label: 'Recognition From Experts In The Field', met: credits.filter((r) => LETTER_ROLES.has(r)).length >= LETTERS_NEEDED },
    { key: 'paid', label: 'High Pay For The Field', met: paid },
  ];
}

export function o1Refusal(sim: Simulation, person: Person): string | undefined {
  if (citizenOf(person, 'US')) return 'An O-1 is for a citizen of another country.';
  if (!careerOf(person).agencyId) return 'A US employer or agent petitions for an O-1, not the actor: sign with an agency first.';
  // An American agency: until 2026-09-29 a Dublin agency petitioned the US for its client, every year, at the fees.
  if ((AGENCIES.find((x) => x.id === careerOf(person).agencyId)?.countryId ?? 'us') !== 'us') return 'A US employer or agent petitions for an O-1: your agency isn’t American.';
  if (documentsOf(person).some((d) => d.kind === 'permit' && d.destination === 'US' && d.name.startsWith('O-1') && d.status === 'pending')) return 'A petition is being decided.';
  // Out of status, an O-1 is issued at a consulate at home (INA 222(g)): SLATE has the petition wait for the move.
  if (person.usOutOfStatus !== undefined && isoOfCity(person.home?.cityId ?? person.currentLocationId) === 'US') return 'You’re out of status: an O-1 would be issued at a consulate at home, so go home first.';
  const held = documentsOf(person).find((d) => d.kind === 'permit' && d.destination === 'US' && d.name.startsWith('O-1') && inForce(d, sim.now));
  if (held && held.expiresAt! - sim.now > 183 * MS_DAY) return `Your O-1 runs to ${formatDate(held.expiresAt!, sim.zone)}; it’s extended in its last six months.`;
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
 * the person is told the day their status does, and offered the move home;
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
export const STATUS_GRACE_DAYS = { f1: 60, opt: 60, o1: 10 } as const;

const usPermits = (person: Person) => documentsOf(person).filter((d) => d.kind === 'permit' && d.destination === 'US');

/** When their US status ends, grace and all; or nothing for a citizen, someone never a student here, a student still, or one whose application is pending. */
export function usStatusEnds(person: Person): Instant | undefined {
  // A citizen never holds an F-1, so has no status to lose.
  if (!f1Of(person) || studying(person)) return undefined;
  const permits = usPermits(person);
  if (permits.some((d) => d.status === 'pending')) return undefined;
  let ends = (programEnd(person) ?? 0) + STATUS_GRACE_DAYS.f1 * MS_DAY;
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
  return ends === undefined ? undefined : Math.max(sim.now, ends);
}

/** Looks at their status again when it next can change, in place of any look already on the calendar. */
export function scheduleUsStatus(sim: Simulation, person: Person): void {
  for (const one of sim.universe.scheduled) if (one.status === 'pending' && one.kind === US_STATUS_KIND && one.payload.personId === person.id) sim.timeline.cancel(one.id, sim.now);
  const at = statusCheckAt(sim, person);
  if (at !== undefined) sim.schedule({ at, kind: US_STATUS_KIND, label: 'US Status', category: 'system', priority: 5, payload: { personId: person.id } });
}

// ---------------------------------------------------------------------------
// Canada
// ---------------------------------------------------------------------------

export function caPermitRefusal(person: Person, booking: Booking | undefined): string | undefined {
  if (!booking || (booking.status !== 'offered' && booking.status !== 'accepted')) return 'That isn’t a job you’ve been offered or taken.';
  if (!booking.location || isoOfCity(booking.location) !== 'CA') return 'It’s for a production in Canada.';
  if (isoOfCountry(person.citizenshipId) === 'US') return 'A US citizen’s is issued at the border on arrival.';
  if (citizenOf(person, 'CA')) return 'You’re a citizen.';
  if (documentsOf(person).some((d) => d.kind === 'permit' && d.bookingId === booking.id)) return 'You’ve applied for it.';
  return undefined;
}

/** A US citizen's C14 permit, issued at the port of entry on arrival, its fee paid there; false if the bank couldn't. */
export function permitAtTheBorder(sim: Simulation, person: Person, booking: Booking): boolean {
  if (!booking.location || isoOfCity(booking.location) !== 'CA' || isoOfCountry(person.citizenshipId) !== 'US') return true;
  const span = jobSpan(booking);
  if (permitFor(person, 'CA', sim.now, span.to, booking.id)) return true;
  const fee = inSave(sim, WORK_RULES.caC14.fee, WORK_RULES.caC14.currency);
  if (!payFromBank(sim, person, fee, `${WORK_RULES.caC14.name}, at the border`, 'documents')) return false;
  const id = sim.nextId('document');
  documentsOf(person).push({ id, kind: 'permit', issuer: 'CA', name: WORK_RULES.caC14.name, number: numberFor('C14', id), status: 'valid', issuedAt: sim.now, expiresAt: span.to + 2 * MS_DAY, destination: 'CA', bookingId: booking.id });
  return true;
}

// ---------------------------------------------------------------------------
// Unemployment on OPT
// ---------------------------------------------------------------------------

/**
 * Whether a day falls inside a job they're on, from its first call to its
 * last. Beside it, an actor an agency represents counts as employed: SEVP
 * lets OPT be self-employment in the field, worked full time, and a
 * represented actor auditioning, taping and booking through an agent is a
 * performer in business. SLATE's reading of the twenty hours a week; until
 * 2026-09-29, the day it was written, only a job's days counted, and a
 * represented British graduate lost OPT four months in.
 */
function onAJob(person: Person, day: Instant): boolean {
  return careerOf(person).bookings.some((b) => (b.status === 'accepted' || b.status === 'worked') && (() => { const s = jobSpan(b); return s.from - MS_DAY < day && day <= s.to + MS_DAY; })());
}

export function registerPermission(sim: Simulation): void {
  const payOrRefuse = (s: Simulation, person: Person, amount: Money, memo: string) => {
    if (!payFromBank(s, person, amount, memo, 'documents')) throw new CommandError(`${formatMoney(amount, saveCurrency(s.universe))} is more than the bank can cover.`);
  };

  sim.onCommand<{ premium?: boolean }, { readyAt: Instant; fee: Money }>('documents.apply_opt', (p, { sim: s }) => {
    const person = s.player;
    const premium = Boolean(p?.premium);
    const no = optRefusal(s, person);
    if (no) throw new CommandError(no);
    const r = WORK_RULES.opt;
    const fee = inSave(s, r.fee + (premium ? r.premiumFee : 0), r.currency);
    payOrRefuse(s, person, fee, `${r.form}, OPT${premium ? ', premium processing' : ''}`);
    const readyAt = premium ? businessDaysOn(s.now, r.premiumBusinessDays) : s.now + r.standardDays * MS_DAY;
    const id = s.nextId('document');
    documentsOf(person).push({ id, kind: 'permit', issuer: 'US', name: 'Employment Authorization, OPT', number: numberFor('IOE', id), status: 'pending', appliedAt: s.now, readyAt, destination: 'US' });
    s.schedule({ at: readyAt, kind: PERMISSION_KIND, label: 'OPT Decided', category: 'system', priority: 20, payload: { personId: person.id, documentId: id } });
    return { readyAt, fee };
  });

  sim.onCommand<{ premium?: boolean }, { readyAt: Instant; fee: Money }>('documents.petition_o1', (p, { sim: s }) => {
    const person = s.player;
    const no = o1Refusal(s, person);
    if (no) throw new CommandError(no);
    const premium = Boolean(p?.premium);
    const r = WORK_RULES.o1;
    const fee = inSave(s, r.fee + r.asylumFee + r.opinionFee + (premium ? r.premiumFee : 0), r.currency);
    payOrRefuse(s, person, fee, `${r.form}, with the Asylum Program Fee and SAG-AFTRA’s opinion${premium ? ', premium processing' : ''}`);
    const opinion = s.now + r.opinionDays * MS_DAY;
    const readyAt = premium ? businessDaysOn(opinion, r.premiumBusinessDays) : opinion + r.standardDays * MS_DAY;
    const id = s.nextId('document');
    documentsOf(person).push({ id, kind: 'permit', issuer: 'US', name: 'O-1B Status', number: numberFor('EAC', id), status: 'pending', appliedAt: s.now, readyAt, destination: 'US' });
    s.schedule({ at: readyAt, kind: PERMISSION_KIND, label: 'O-1 Petition Decided', category: 'system', priority: 20, payload: { personId: person.id, documentId: id } });
    return { readyAt, fee };
  });

  sim.onCommand<{ bookingId: string }, { readyAt: Instant; fee: Money }>('documents.apply_work_permit', (p, { sim: s }) => {
    const person = s.player;
    const booking = careerOf(person).bookings.find((b) => b.id === String(p?.bookingId));
    const no = caPermitRefusal(person, booking);
    if (no) throw new CommandError(no);
    const r = WORK_RULES.caC14;
    const fee = inSave(s, r.fee + r.biometricsFee, r.currency);
    payOrRefuse(s, person, fee, `${r.name}, with biometrics`);
    const readyAt = s.now + r.standardDays * MS_DAY;
    const id = s.nextId('document');
    documentsOf(person).push({ id, kind: 'permit', issuer: 'CA', name: r.name, number: numberFor('C14', id), status: 'pending', appliedAt: s.now, readyAt, destination: 'CA', bookingId: booking!.id });
    s.schedule({ at: readyAt, kind: PERMISSION_KIND, label: 'Work Permit Decided', category: 'system', priority: 20, payload: { personId: person.id, documentId: id } });
    return { readyAt, fee };
  });

  sim.onSchedule(PERMISSION_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const doc = person ? documentsOf(person).find((d) => d.id === item.payload.documentId) : undefined;
    if (!person || !doc || doc.status !== 'pending') return;
    const mine = person.id === s.universe.playerId;
    const tell = (title: string, body: string) => { if (mine) s.notify({ category: 'personal', title, body, importance: 75, route: '/workspace/papers' }); };
    if (doc.name.includes('OPT')) {
      // Twelve months from the later of the program's end and the approval.
      const start = Math.max(programEnd(person) ?? s.now, s.now);
      doc.status = 'valid';
      doc.issuedAt = start;
      doc.expiresAt = addYears(start, WORK_RULES.opt.months / 12);
      doc.idleDays = 0;
      s.schedule({ at: start + 7 * MS_DAY, kind: OPT_WEEK_KIND, label: 'OPT: A Week', category: 'system', priority: 5, payload: { personId: person.id, documentId: doc.id } });
      scheduleUsStatus(s, person);
      tell('OPT Approved', `You may work in the United States from ${formatDate(start, s.zone)} to ${formatDate(doc.expiresAt, s.zone)}, with no more than ${WORK_RULES.opt.unemploymentDays} days between jobs in all.`);
      return;
    }
    if (doc.name.startsWith('O-1')) {
      const shown = o1Evidence(s, person).filter((e) => e.met);
      if (shown.length < WORK_RULES.o1.criteriaNeeded) {
        doc.status = 'cancelled';
        tell('O-1 Petition Denied', `USCIS asks at least ${WORK_RULES.o1.criteriaNeeded} kinds of evidence of extraordinary achievement; the petition showed ${shown.length}${shown.length ? `: ${shown.map((e) => e.label).join(', ')}` : ''}. The fees aren’t returned.`);
        scheduleUsStatus(s, person);
        return;
      }
      const held = documentsOf(person).find((d) => d !== doc && d.kind === 'permit' && d.destination === 'US' && d.name.startsWith('O-1') && inForce(d, s.now));
      doc.status = 'valid';
      doc.issuedAt = s.now;
      doc.expiresAt = held ? addYears(held.expiresAt!, WORK_RULES.o1.extensionYears) : addYears(s.now, WORK_RULES.o1.years);
      if (held) held.status = 'cancelled';
      tell('O-1 Approved', `You may work in the United States to ${formatDate(doc.expiresAt, s.zone)}.`);
      scheduleUsStatus(s, person);
      return;
    }
    const booking = careerOf(person).bookings.find((b) => b.id === doc.bookingId);
    doc.status = 'valid';
    doc.issuedAt = s.now;
    doc.expiresAt = booking ? jobSpan(booking).to + 2 * MS_DAY : s.now + 30 * MS_DAY;
    tell('Work Permit Approved', `${doc.name}, for the production, to ${formatDate(doc.expiresAt, s.zone)}.`);
  });

  sim.onSchedule(US_STATUS_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (!person || person.usOutOfStatus !== undefined) return;
    // Gone home, or never here: nothing to lose.
    if (isoOfCity(person.home?.cityId ?? person.currentLocationId) !== 'US') return;
    const ends = usStatusEnds(person);
    if (ends === undefined) return;
    const next = statusCheckAt(s, person);
    const mine = person.id === s.universe.playerId;
    if (next !== undefined && next > s.now) {
      // Permission's run out and the grace has begun: say so, once, with the way home.
      if (ends > s.now && !usPermits(person).some((d) => d.status === 'valid' && inForce(d, s.now)) && mine) {
        const home = homeAbroadOf(person);
        const opt = !optRefusal(s, person);
        s.requireDecision({
          urgency: 90, category: 'personal', title: 'Your US Status Is Ending',
          detail: `Your permission to work in the United States has ended, and your status ends ${formatDate(ends, s.zone)}.${opt ? ' OPT can still be applied for before then.' : ''} After it, you’re out of status: no work can be had here, a US visa you hold is void, and the Visa Waiver Program is closed to you for good.`,
          route: '/workspace/papers', dueAt: ends, refType: 'us-status', refId: String(ends),
          actions: [
            ...(opt ? [{ label: 'Apply For OPT', commandKind: 'documents.apply_opt', payload: { premium: true } }] : []),
            ...(home ? [{ label: `Move Home To ${cityLabel(home)}`, commandKind: 'career.relocate', payload: { cityId: home, kind: 'shared' } }] : []),
          ],
        });
      }
      scheduleUsStatus(s, person);
      return;
    }
    // Stayed past it: out of status.
    person.usOutOfStatus = ends;
    const f1 = f1Of(person);
    if (f1 && f1.status === 'valid') f1.status = 'cancelled';
    if (mine) s.notify({ category: 'personal', title: 'Out Of Status', body: 'You stayed in the United States past your status. No work can be had here, your US visa is void, and the Visa Waiver Program is closed to you for good. Going home is on the Career screen.', importance: 90, route: '/workspace/career' });
  });

  sim.onSchedule(OPT_WEEK_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const doc = person ? documentsOf(person).find((d) => d.id === item.payload.documentId) : undefined;
    if (!person || !doc || !inForce(doc, item.at - MS_HOUR)) return;
    let idle = 0;
    const represented = careerOf(person).agencyId !== undefined;
    for (let d = 7; d >= 1; d -= 1) if (!represented && !onAJob(person, item.at - d * MS_DAY)) idle += 1;
    doc.idleDays = (doc.idleDays ?? 0) + idle;
    if (doc.idleDays > WORK_RULES.opt.unemploymentDays) {
      doc.status = 'cancelled';
      // A violation: the status ends with it, no grace after.
      doc.endedAt = s.now;
      scheduleUsStatus(s, person);
      if (person.id === s.universe.playerId) s.notify({ category: 'personal', title: 'OPT Ended', body: `More than ${WORK_RULES.opt.unemploymentDays} days without work: your OPT has ended, and with it permission to work in the United States.`, importance: 85, route: '/workspace/papers' });
      return;
    }
    if (item.at + 7 * MS_DAY < (doc.expiresAt ?? 0)) s.schedule({ at: item.at + 7 * MS_DAY, kind: OPT_WEEK_KIND, label: 'OPT: A Week', category: 'system', priority: 5, payload: { personId: person.id, documentId: doc.id } });
  });
}
