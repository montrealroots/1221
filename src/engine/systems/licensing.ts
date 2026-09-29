/**
 * SLATE — earning a driving license where you live, step by step
 * (docs/WORLD.md, stage 1), and keeping it: renewing it, and the
 * International Driving Permit that goes beside it abroad. From 2026-09-29.
 *
 * The path is the jurisdiction's own (`content/licensepaths.ts`): each step
 * is booked and paid for, then kept at its hour on a business day in the
 * town, as a commitment on the calendar, and a test is passed at the rate
 * the authority publishes, or SLATE's mean of those published where none is.
 * A step waits for the steps before it, for the days the law asks between
 * them, and after a fail for the days before a retake. What passing grants
 * is a license record (`systems/documents.ts`), a learner's first, which
 * lets its holder drive only with someone beside them.
 *
 * Progress is kept for one jurisdiction. A path begun in one and taken up in
 * another begins again: some authorities credit a test passed elsewhere, and
 * SLATE doesn't have which.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, instantFromZoned, normalDate, zonedParts, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { businessDay } from '../content/bankdays';
import { LICENSES } from '../content/licenses';
import { LEAD_DAYS, LICENSE_PATHS, PASS_RATES, passRate, type LicenseGrant, type LicensePath, type PathStep } from '../content/licensepaths';
import { payFromBank } from './household';
import { present } from './career';
import { addYears, documentsOf, inForce, licenseOf, licensingOf, numberFor, type PersonDocument } from './documents';

export interface LicensingRecord {
  jurisdiction: string;
  /** When each step was done. */
  done: Record<string, Instant>;
  /** Attempts at each test, and when the last one failed. */
  attempts: Record<string, number>;
  failedAt: Record<string, Instant>;
  /** Attempts used on a covering fee since it was paid, by the covering step. */
  used: Record<string, number>;
  /** A pass whose license fee the bank couldn't meet: paid by taking the step again. */
  unpaid?: string;
  /** The step booked, and its sessions left. */
  booked?: { step: string; left: number };
}

export const LICENSE_KIND = 'documents.license_step';
const YEAR = 365.25 * MS_DAY;

export function licensingOfPerson(person: Person): LicensingRecord | undefined {
  return person.licensing;
}

/** The path where they are now, if SLATE has it. */
export function pathHere(person: Person): { jurisdiction: string; path: LicensePath } | undefined {
  const j = licensingOf(person.currentLocationId);
  const path = j ? LICENSE_PATHS[j] : undefined;
  return j && path ? { jurisdiction: j, path } : undefined;
}

const ageAt = (person: Person, at: Instant) => (at - person.birthInstant) / YEAR;
const isoDay = (at: Instant, zone: string) => { const p = zonedParts(at, zone); return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`; };

/** Whether a step applies to this person on this day: its dates, and its ages. */
export function applies(step: PathStep, person: Person, at: Instant): boolean {
  const day = new Date(at).toISOString().slice(0, 10);
  if (step.from && day < step.from) return false;
  if (step.until && day >= step.until) return false;
  const age = ageAt(person, at);
  if (step.under !== undefined && age >= step.under) return false;
  if (step.over !== undefined && age < step.over) return false;
  return true;
}

/** The record for the jurisdiction, fresh where they had none or had one elsewhere. */
function recordFor(person: Person, jurisdiction: string): LicensingRecord {
  const r = person.licensing;
  return r && r.jurisdiction === jurisdiction ? r : { jurisdiction, done: {}, attempts: {}, failedAt: {}, used: {} };
}

/** When a step (or one of `a|b`) was done, if it was and still stands. */
function doneAt(path: LicensePath, r: LicensingRecord, id: string, at: Instant): Instant | undefined {
  for (const one of id.split('|')) {
    const when = r.done[one];
    const step = path.steps.find((s) => s.id === one);
    if (when === undefined || !step) continue;
    if (step.validDays !== undefined && at > when + step.validDays * MS_DAY) continue;
    return when;
  }
  return undefined;
}

/** What a step needs done first: what it names, else the step before it that applies. */
function needsOf(path: LicensePath, step: PathStep, person: Person, at: Instant): string[] {
  if (step.needs) return [...step.needs];
  const list = path.steps.filter((s) => applies(s, person, at));
  const i = list.findIndex((s) => s.id === step.id);
  return i > 0 ? [list[i - 1]!.id] : [];
}

/** The fee for an attempt now, in the path's currency: the first, a retake, or none while a covering fee lasts. */
export function attemptFee(step: PathStep, r: LicensingRecord): number {
  const tried = r.attempts[step.id] ?? 0;
  if (step.covered) {
    const used = r.used[step.covered.by] ?? 0;
    if (step.covered.by === step.id) return used === 0 ? step.fee : used < step.covered.attempts ? 0 : step.retakeFee ?? step.fee;
    return used < step.covered.attempts ? step.fee : step.retakeFee ?? step.fee;
  }
  return tried > 0 ? step.retakeFee ?? step.fee : step.fee;
}

function inSave(sim: Simulation, amount: number, currency: string): Money {
  const cents = Math.round(amount * 100);
  const into = saveCurrency(sim.universe);
  return currency === into ? cents : exchange(cents, currency, into) ?? cents;
}

/** The license they hold from this jurisdiction that the path is past, if any: full ends it. */
function heldHere(person: Person, jurisdiction: string, at: Instant): PersonDocument | undefined {
  return documentsOf(person).find((d) => d.kind === 'license' && d.issuer === jurisdiction && inForce(d, at) && (d.stage ?? 'full') === 'full');
}

/** Why a step can't be booked now, or nothing. */
export function stepRefusal(sim: Simulation, person: Person, stepId: string): string | undefined {
  const here = pathHere(person);
  if (!here) return `SLATE doesn’t have how a license is earned in ${CITIES.get(person.currentLocationId)?.name ?? 'this place'} yet.`;
  const { jurisdiction, path } = here;
  const step = path.steps.find((s) => s.id === stepId);
  if (!step || !applies(step, person, sim.now)) return 'That isn’t a step here now.';
  const rule = LICENSES[jurisdiction]!;
  if (ageAt(person, sim.now) < rule.minAge.learner) return `${rule.authority} starts a learner at ${rule.minAge.learner}.`;
  if (heldHere(person, jurisdiction, sim.now)) return `You hold ${rule.name} already.`;
  const r = recordFor(person, jurisdiction);
  if (r.booked) return r.booked.step === stepId ? 'It’s booked.' : `${path.steps.find((s) => s.id === r.booked!.step)?.name ?? 'A step'} is booked first.`;
  if (r.unpaid === stepId) return undefined;
  if (r.unpaid) return `${path.steps.find((s) => s.id === r.unpaid)?.name ?? 'A step'} is passed; its license fee is owed first.`;
  // A covering fee whose attempts are spent can be paid again.
  const spent = path.steps.some((s) => s.covered?.by === stepId && s.covered.by !== s.id && (r.used[stepId] ?? 0) >= s.covered.attempts && doneAt(path, r, s.id, sim.now) === undefined);
  if (doneAt(path, r, stepId, sim.now) !== undefined && !spent) return 'Done.';
  for (const need of needsOf(path, step, person, sim.now)) {
    const alternatives = need.split('|').map((id) => path.steps.find((s) => s.id === id)).filter((s): s is PathStep => Boolean(s));
    if (!alternatives.some((s) => applies(s, person, sim.now) || r.done[s.id] !== undefined)) continue;
    if (doneAt(path, r, need, sim.now) === undefined) return `${alternatives[0]!.name} first.`;
  }
  if (step.wait) {
    const since = doneAt(path, r, step.wait.since, sim.now);
    if (since !== undefined && sim.now < since + step.wait.days * MS_DAY) return `Not before ${formatDate(since + step.wait.days * MS_DAY, sim.zone)}: ${step.wait.days} days after ${path.steps.find((s) => s.id === step.wait!.since.split('|')[0])?.name ?? 'the step before'}.`;
  }
  const failed = r.failedAt[stepId];
  if (failed !== undefined && step.retakeDays && sim.now < failed + step.retakeDays * MS_DAY) return `Again from ${formatDate(failed + step.retakeDays * MS_DAY, sim.zone)}.`;
  if (step.covered && step.covered.by !== step.id && (r.used[step.covered.by] ?? 0) >= step.covered.attempts && step.retakeFee === undefined) {
    return `${path.steps.find((s) => s.id === step.covered!.by)?.name ?? 'The fee'} covers ${step.covered.attempts} attempts, all used: pay it again.`;
  }
  return undefined;
}

/** The next free hour for an appointment: a business day in the town, at an hour, clear of everything else they must be at. */
function slot(sim: Simulation, person: Person, cityId: string, from: Instant, hour: number, minutes: number): Instant {
  const city = CITIES.require(cityId);
  const zone = city.timeZone;
  const start = zonedParts(from, zone);
  for (let n = 0; n < 60; n += 1) {
    const date = normalDate(start.year, start.month, start.day + n);
    const at = instantFromZoned({ ...date, hour }, zone);
    if (at <= sim.now) continue;
    if (!businessDay(city.countryId, isoDay(at, zone), city.parentId)) continue;
    const end = at + minutes * 60_000;
    const clash = sim.universe.scheduled.some((i) => i.status === 'pending' && i.requiresPlayer === true && (i.payload.personId === undefined || i.payload.personId === person.id)
      && i.at < end && i.at + (i.durationMinutes ?? 60) * 60_000 > at);
    if (!clash) return at;
  }
  return from + 60 * MS_DAY;
}

/** Books a step: pays for it, and puts it, or a course's sessions, on the calendar. */
function book(sim: Simulation, person: Person, jurisdiction: string, step: PathStep, r: LicensingRecord): Instant[] {
  const cityId = person.currentLocationId;
  const lead = step.kind === 'office' ? LEAD_DAYS.office : step.kind === 'course' ? LEAD_DAYS.course : PASS_ROAD(step) ? LEAD_DAYS.road : LEAD_DAYS.test;
  const hour = step.kind === 'course' ? 18 : 10;
  const sessions = step.kind === 'course' ? step.sessions ?? 1 : 1;
  const out: Instant[] = [];
  let from = sim.now + lead * MS_DAY;
  for (let n = 0; n < sessions; n += 1) {
    const at = slot(sim, person, cityId, from, hour, step.minutes);
    sim.schedule({ at, kind: LICENSE_KIND, label: sessions > 1 ? `${step.name}, ${n + 1} Of ${sessions}` : step.name, category: 'personal', priority: 32, requiresPlayer: true, durationMinutes: step.minutes, locationId: cityId, payload: { personId: person.id, jurisdiction, step: step.id } });
    out.push(at);
    from = at + (step.everyDays ?? 7) * MS_DAY - 12 * 3_600_000;
  }
  r.booked = { step: step.id, left: sessions };
  return out;
}

const PASS_ROAD = (step: PathStep) => step.kind === 'test' && PASS_RATES[step.pass ?? '']?.kind === 'road';

/** Whether an attempt at a test passes: its rate, drawn once for the attempt. */
export function passesTest(sim: Simulation, person: Person, jurisdiction: string, step: PathStep, attempt: number): boolean {
  return sim.rng('documents.test', person.id, `${jurisdiction}/${step.id}/${attempt}`).next() < passRate(step.pass ?? '').rate;
}

/** A license granted: the record, and the stage before it from the same authority ended. */
function grant(sim: Simulation, person: Person, jurisdiction: string, g: LicenseGrant, issueDays = 0): PersonDocument {
  const id = sim.nextId('document');
  const issuedAt = sim.now + issueDays * MS_DAY;
  for (const d of documentsOf(person)) if (d.kind === 'license' && d.issuer === jurisdiction && d.status === 'valid') d.status = 'cancelled';
  const doc: PersonDocument = { id, kind: 'license', issuer: jurisdiction, name: g.name, number: numberFor('D', id), status: 'valid', issuedAt, expiresAt: addYears(issuedAt, g.years), stage: g.stage, alone: g.alone };
  documentsOf(person).push(doc);
  return doc;
}

/** A step done: marked, and what it grants given, its license fee paid where one is due. */
function complete(sim: Simulation, person: Person, jurisdiction: string, step: PathStep, r: LicensingRecord): string {
  const path = LICENSE_PATHS[jurisdiction]!;
  r.done[step.id] = sim.now;
  if (!step.grants) return `${step.name}: done.`;
  if (step.issueFee) {
    const fee = inSave(sim, step.issueFee, path.currency);
    if (!payFromBank(sim, person, fee, `${step.grants.name}, the license fee`, 'documents')) {
      r.unpaid = step.id;
      return `${step.name}: passed. The license fee, ${formatMoney(fee, saveCurrency(sim.universe))}, is more than the bank can cover; the license waits for it.`;
    }
  }
  const doc = grant(sim, person, jurisdiction, step.grants, step.issueDays);
  return `${step.name}: ${step.kind === 'test' ? 'passed' : 'done'}. ${doc.name}${step.issueDays ? `, in the post, arriving ${formatDate(doc.issuedAt!, sim.zone)}` : ''}, good until ${formatDate(doc.expiresAt!, sim.zone)}.`;
}

// ---------------------------------------------------------------------------
// Renewing, and the permit abroad
// ---------------------------------------------------------------------------

/** How far ahead of its end a license can be renewed: SLATE's estimate, six months, most authorities opening renewal about then. */
export const RENEW_AHEAD_DAYS = 183;

/** The license to renew: a full one that runs out within the window or has run out. */
export function renewable(person: Person, at: Instant): PersonDocument | undefined {
  return documentsOf(person)
    .filter((d) => d.kind === 'license' && d.status === 'valid' && (d.stage ?? 'full') === 'full' && d.expiresAt !== undefined && d.expiresAt - RENEW_AHEAD_DAYS * MS_DAY <= at)
    .sort((a, b) => (b.expiresAt ?? 0) - (a.expiresAt ?? 0))[0];
}

export function renewRefusal(person: Person, at: Instant): string | undefined {
  const held = renewable(person, at);
  if (!held) return documentsOf(person).some((d) => d.kind === 'license' && d.status === 'valid') ? `A license renews within ${Math.round(RENEW_AHEAD_DAYS / 30)} months of running out.` : 'You hold no license to renew.';
  const rule = LICENSES[held.issuer];
  if (!rule || rule.renewalFee === null) return `SLATE doesn’t have what ${rule?.authority ?? 'the authority'} charges to renew.`;
  const country = held.issuer.split('-')[0];
  if (licensingOf(person.currentLocationId)?.split('-')[0] !== country) return `${rule.authority} renews a license for someone living in the country; you’re away.`;
  return undefined;
}

/** An IDP's issuer and fee for the license they hold, and why not where it can't be had. */
export function idpRefusal(person: Person, at: Instant): string | undefined {
  const license = licenseOf(person, at);
  if (!license || license.alone === false) return 'An International Driving Permit goes beside a full license, and you hold none.';
  const idp = LICENSES[license.issuer]?.idp;
  if (!idp || idp.fee === null) return `SLATE doesn’t have what an International Driving Permit costs for a license from ${LICENSES[license.issuer]?.authority ?? 'there'}.`;
  if (documentsOf(person).some((d) => d.kind === 'idp' && inForce(d, at) && d.issuer === license.issuer.split('-')[0])) return 'You hold one in force.';
  if (licensingOf(person.currentLocationId)?.split('-')[0] !== license.issuer.split('-')[0]) return `It’s issued at home, before you travel: ${idp.issuer}.`;
  return undefined;
}

/** Years a permit lasts, from what its issuer says; a year, the 1949 Convention's, where nothing is said. */
export function idpYears(validity: string | null): number {
  const m = validity?.match(/(\d+)\s*(?:year|month)/i);
  if (!m) return 1;
  return /month/i.test(m[0]) ? Number(m[1]) / 12 : Number(m[1]);
}

export function registerLicensing(sim: Simulation): void {
  sim.onCommand<{ step: string }, { at: Instant[]; fee: Money; message?: string }>('documents.license_step', (p, { sim: s }) => {
    const person = s.player;
    const stepId = String(p?.step ?? '');
    const no = stepRefusal(s, person, stepId);
    if (no) throw new CommandError(no);
    const { jurisdiction, path } = pathHere(person)!;
    const step = path.steps.find((x) => x.id === stepId)!;
    const r = recordFor(person, jurisdiction);
    const cur = saveCurrency(s.universe);
    if (r.unpaid === stepId) {
      const fee = inSave(s, step.issueFee ?? 0, path.currency);
      if (!payFromBank(s, person, fee, `${step.grants!.name}, the license fee`, 'documents')) throw new CommandError(`${formatMoney(fee, cur)} is more than the bank can cover.`);
      delete r.unpaid;
      const doc = grant(s, person, jurisdiction, step.grants!, step.issueDays);
      return { at: [], fee, message: `${doc.name}, good until ${formatDate(doc.expiresAt!, s.zone)}.` };
    }
    const fee = inSave(s, attemptFee(step, r), path.currency);
    if (!payFromBank(s, person, fee, `${step.name}, ${LICENSES[jurisdiction]!.authority}`, 'documents')) throw new CommandError(`${formatMoney(fee, cur)} is more than the bank can cover.`);
    // Paying a covering fee again starts its attempts over.
    if (path.steps.some((x) => x.covered?.by === stepId)) r.used[stepId] = 0;
    person.licensing = r;
    const at = book(s, person, jurisdiction, step, r);
    return { at, fee };
  });

  sim.onSchedule(LICENSE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const r = person?.licensing;
    if (!person || !r || r.jurisdiction !== item.payload.jurisdiction || r.booked?.step !== item.payload.step) return;
    const path = LICENSE_PATHS[r.jurisdiction]!;
    const step = path.steps.find((x) => x.id === item.payload.step)!;
    const mine = person.id === s.universe.playerId;
    const tell = (title: string, body: string) => { if (mine) s.notify({ category: 'personal', title, body, importance: 55, route: '/workspace/papers' }); };
    if (!present(person, item.at, item.locationId)) {
      item.status = 'missed';
      if (step.kind === 'course') {
        // A missed session is made up at the end of the course.
        const last = Math.max(...s.universe.scheduled.filter((i) => i.kind === LICENSE_KIND && i.status === 'pending' && i.payload.personId === person.id).map((i) => i.at), item.at);
        const at = slot(s, person, item.locationId!, last + (step.everyDays ?? 7) * MS_DAY - 12 * 3_600_000, 18, step.minutes);
        s.schedule({ at, kind: LICENSE_KIND, label: `${step.name}, Made Up`, category: 'personal', priority: 32, requiresPlayer: true, durationMinutes: step.minutes, locationId: item.locationId, payload: { ...item.payload } });
        tell(`${step.name} Missed`, `The session is made up on ${formatDate(at, s.zone)}.`);
        return;
      }
      delete r.booked;
      if (step.covered) r.used[step.covered.by] = (r.used[step.covered.by] ?? 0) + 1;
      tell(`${step.name} Missed`, `You weren’t there, and the fee is gone. Book it again from the Papers screen.`);
      return;
    }
    r.booked!.left -= 1;
    if (r.booked!.left > 0) return;
    delete r.booked;
    if (step.kind !== 'test') { tell(`${step.name} Done`, complete(s, person, r.jurisdiction, step, r)); return; }
    const attempt = (r.attempts[step.id] ?? 0) + 1;
    r.attempts[step.id] = attempt;
    if (step.covered) r.used[step.covered.by] = (r.used[step.covered.by] ?? 0) + 1;
    if (passesTest(s, person, r.jurisdiction, step, attempt)) {
      delete r.failedAt[step.id];
      tell(`${step.name} Passed`, complete(s, person, r.jurisdiction, step, r));
    } else {
      r.failedAt[step.id] = s.now;
      tell(`${step.name} Failed`, `Not this time${step.retakeDays ? `; it can be taken again from ${formatDate(s.now + step.retakeDays * MS_DAY, s.zone)}` : ''}.`);
    }
  });

  sim.onCommand<Record<string, never>, { expiresAt: Instant; fee: Money }>('documents.renew_license', (_p, { sim: s }) => {
    const person = s.player;
    const no = renewRefusal(person, s.now);
    if (no) throw new CommandError(no);
    const held = renewable(person, s.now)!;
    const rule = LICENSES[held.issuer]!;
    const currency = LICENSE_PATHS[held.issuer]?.currency ?? 'USD';
    const fee = inSave(s, rule.renewalFee!, currency);
    if (!payFromBank(s, person, fee, `${rule.name}, renewed`, 'documents')) throw new CommandError(`${formatMoney(fee, saveCurrency(s.universe))} is more than the bank can cover.`);
    const from = Math.max(s.now, held.expiresAt!);
    held.status = 'cancelled';
    const id = s.nextId('document');
    const expiresAt = addYears(from, rule.validityYears ?? 5);
    documentsOf(person).push({ ...held, id, number: numberFor('D', id), status: 'valid', issuedAt: s.now, expiresAt });
    return { expiresAt, fee };
  });

  sim.onCommand<Record<string, never>, { expiresAt: Instant; fee: Money }>('documents.apply_idp', (_p, { sim: s }) => {
    const person = s.player;
    const no = idpRefusal(person, s.now);
    if (no) throw new CommandError(no);
    const license = licenseOf(person, s.now)!;
    const idp = LICENSES[license.issuer]!.idp!;
    const fee = inSave(s, idp.fee!, idp.currency);
    if (!payFromBank(s, person, fee, 'International Driving Permit', 'documents')) throw new CommandError(`${formatMoney(fee, saveCurrency(s.universe))} is more than the bank can cover.`);
    const id = s.nextId('document');
    const expiresAt = Math.min(addYears(s.now, idpYears(idp.validity)), license.expiresAt ?? Infinity);
    documentsOf(person).push({ id, kind: 'idp', issuer: license.issuer.split('-')[0]!, name: 'International Driving Permit', number: numberFor('IDP', id), status: 'valid', issuedAt: s.now, expiresAt });
    return { expiresAt, fee };
  });
}
