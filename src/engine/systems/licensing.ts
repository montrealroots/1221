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
 *
 * From 2026-09-30 there are two tracks, the car's and the motorcycle's
 * (`MOTORCYCLE_PATHS`), each with its own record, run by the same steps.
 * What the motorcycle track grants is a license record of the motorcycle
 * class, the class on the same card; renewing the car license carries it.
 */

import { heldUntil, holdBack } from './away';
import { LICENSE_REPLACEMENT } from '../content/replacements';
import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, instantFromZoned, normalDate, zonedParts, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { businessDay } from '../content/bankdays';
import { LICENSES } from '../content/licenses';
import { LEAD_DAYS, LICENSE_EXCHANGES, LICENSE_PATHS, PASS_RATES, passRate, type LicenseExchange, type LicenseGrant, type LicensePath, type PathStep } from '../content/licensepaths';
import { MOTORCYCLE_PATHS } from '../content/motorcyclepaths';
import { payFromBank } from './household';
import { present } from './career';
import { addYears, documentsOf, inForce, licenseOf, licensingOf, numberFor, classOf, type PersonDocument, type VehicleClass } from './documents';

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

/** The paths a track's steps are read from. */
export const pathsFor = (track: VehicleClass): Readonly<Record<string, LicensePath>> => (track === 'motorcycle' ? MOTORCYCLE_PATHS : LICENSE_PATHS);
const recordOf = (person: Person, track: VehicleClass) => (track === 'motorcycle' ? person.motoLicensing : person.licensing);
const keep = (person: Person, track: VehicleClass, r: LicensingRecord) => { if (track === 'motorcycle') person.motoLicensing = r; else person.licensing = r; };
const YEAR = 365.25 * MS_DAY;

export function licensingOfPerson(person: Person): LicensingRecord | undefined {
  return person.licensing;
}

/** Where they live: a license is a resident's, taken at home, not on a shoot away. */
const livesIn = (person: Person) => person.home?.cityId ?? person.currentLocationId;

/**
 * The path where they live, if SLATE has it. Until 2026-09-29 it was where
 * they were, and an American on a London shoot booked a British provisional
 * license, which a visitor can't hold.
 */
export function pathHere(person: Person, track: VehicleClass = 'car'): { jurisdiction: string; path: LicensePath } | undefined {
  const j = licensingOf(livesIn(person));
  const path = j ? pathsFor(track)[j] : undefined;
  return j && path ? { jurisdiction: j, path } : undefined;
}

const ageAt = (person: Person, at: Instant) => (at - person.birthInstant) / YEAR;
const isoDay = (at: Instant, zone: string) => { const p = zonedParts(at, zone); return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`; };

/** Whether a step applies to this person on this day: its dates, and its ages. */
export function applies(step: PathStep, person: Person, at: Instant): boolean {
  const day = new Date(at).toISOString().slice(0, 10);
  if (step.from && day < step.from) return false;
  if (step.until && day >= step.until) return false;
  // A step for someone without the car license it stands in for, as Britain's provisional license.
  if (step.unlessCarLicense && documentsOf(person).some((d) => d.kind === 'license' && classOf(d) === 'car' && d.issuer === step.unlessCarLicense && inForce(d, at))) return false;
  const drives = (issuer: string) => documentsOf(person).some((d) => d.kind === 'license' && classOf(d) === 'car' && d.issuer === issuer && inForce(d, at) && d.alone !== false);
  if (step.withCarLicense && !drives(step.withCarLicense)) return false;
  if (step.withoutCarLicense && drives(step.withoutCarLicense)) return false;
  const age = ageAt(person, at);
  if (step.under !== undefined && age >= step.under) return false;
  if (step.over !== undefined && age < step.over) return false;
  return true;
}

/** The record for the jurisdiction, fresh where they had none or had one elsewhere. */
function recordFor(person: Person, jurisdiction: string, track: VehicleClass = 'car'): LicensingRecord {
  const r = recordOf(person, track);
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
function heldHere(person: Person, jurisdiction: string, at: Instant, track: VehicleClass = 'car'): PersonDocument | undefined {
  return documentsOf(person).find((d) => d.kind === 'license' && classOf(d) === track && d.issuer === jurisdiction && inForce(d, at) && (d.stage ?? 'full') === 'full');
}

/** Why a step can't be booked now, or nothing. */
export function stepRefusal(sim: Simulation, person: Person, stepId: string, track: VehicleClass = 'car'): string | undefined {
  const here = pathHere(person, track);
  if (!here) return `SLATE doesn’t have how a ${track === 'motorcycle' ? 'motorcycle ' : ''}license is earned in ${CITIES.get(person.currentLocationId)?.name ?? 'this place'} yet.`;
  const { jurisdiction, path } = here;
  const step = path.steps.find((s) => s.id === stepId);
  if (!step || !applies(step, person, sim.now)) return 'That isn’t a step here now.';
  const rule = LICENSES[jurisdiction]!;
  if (ageAt(person, sim.now) < rule.minAge.learner) return `${rule.authority} starts a learner at ${rule.minAge.learner}.`;
  const held = heldHere(person, jurisdiction, sim.now, track);
  if (held) return `You hold ${track === 'car' ? rule.name : held.name} already.`;
  if (track === 'car') {
    const lapsed = renewable(person, sim.now);
    if (lapsed && lapsed.issuer === jurisdiction) return `Your ${lapsed.name} renews without the tests: Renew It.`;
    const swap = exchangeable(person, sim.now);
    if (swap) return `Your license from ${LICENSES[swap.held.issuer]?.authority ?? 'elsewhere'} exchanges here without the tests: Exchange It.`;
  }
  // A motorcycle class added to a car license, where only that way is kept.
  if (path.needsCar && !documentsOf(person).some((d) => d.kind === 'license' && classOf(d) === 'car' && d.issuer === jurisdiction && inForce(d, sim.now) && d.alone !== false)) return path.needsCar;
  const r = recordFor(person, jurisdiction, track);
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
function book(sim: Simulation, person: Person, jurisdiction: string, step: PathStep, r: LicensingRecord, track: VehicleClass): Instant[] {
  const cityId = livesIn(person);
  const lead = step.kind === 'office' ? LEAD_DAYS.office : step.kind === 'course' ? LEAD_DAYS.course : PASS_ROAD(step) ? LEAD_DAYS.road : LEAD_DAYS.test;
  const hour = step.kind === 'course' ? 18 : 10;
  const sessions = step.kind === 'course' ? step.sessions ?? 1 : 1;
  const out: Instant[] = [];
  let from = sim.now + lead * MS_DAY;
  for (let n = 0; n < sessions; n += 1) {
    const at = slot(sim, person, cityId, from, hour, step.minutes);
    sim.schedule({ at, kind: LICENSE_KIND, label: sessions > 1 ? `${step.name}, ${n + 1} Of ${sessions}` : step.name, category: 'personal', priority: 32, requiresPlayer: true, durationMinutes: step.minutes, locationId: cityId, payload: { personId: person.id, jurisdiction, step: step.id, track } });
    out.push(at);
    from = at + (step.everyDays ?? 7) * MS_DAY - 12 * 3_600_000;
  }
  r.booked = { step: step.id, left: sessions };
  return out;
}

const PASS_ROAD = (step: PathStep) => step.kind === 'test' && PASS_RATES[step.pass ?? '']?.kind === 'road';

/** Whether an attempt at a test passes: its rate, drawn once for the attempt. */
export function passesTest(sim: Simulation, person: Person, jurisdiction: string, step: PathStep, attempt: number, track: VehicleClass = 'car'): boolean {
  return sim.rng('documents.test', person.id, `${track === 'car' ? '' : `${track}/`}${jurisdiction}/${step.id}/${attempt}`).next() < passRate(step.pass ?? '').rate;
}

/** A license granted: the record, and the stage before it from the same authority ended. */
function grant(sim: Simulation, person: Person, jurisdiction: string, g: LicenseGrant, issueDays = 0, track: VehicleClass = 'car'): PersonDocument {
  const id = sim.nextId('document');
  const issuedAt = sim.now + issueDays * MS_DAY;
  for (const d of documentsOf(person)) if (d.kind === 'license' && classOf(d) === track && d.issuer === jurisdiction && d.status === 'valid') d.status = 'cancelled';
  const doc: PersonDocument = { id, kind: 'license', issuer: jurisdiction, name: g.name, number: numberFor('D', id), status: 'valid', issuedAt, expiresAt: addYears(issuedAt, g.years), stage: g.stage, alone: g.alone, ...(track === 'car' ? {} : { vehicleClass: track }), ...(jurisdiction.startsWith('us-') ? { realId: true } : {}) };
  documentsOf(person).push(doc);
  return doc;
}

/** A district's surcharge on a license of so many years, for someone living in it; nothing elsewhere. */
export function districtPart(person: Person, jurisdiction: string, years: number): number {
  const d = LICENSES[jurisdiction]?.district;
  return d && person.home && d.cityIds.includes(person.home.cityId) ? d.perHalfYear * Math.round(years * 2) : 0;
}

/** A step’s fee this attempt, and with the fee that covers the first license, a district’s part on it (New York’s permit test). */
export function stepFee(person: Person, jurisdiction: string, path: LicensePath, step: PathStep, r: LicensingRecord): number {
  const fee = attemptFee(step, r);
  const first = fee > 0 && step.coversFirst ? path.steps.map((x) => x.grants).find((g) => g?.stage === 'full')?.years ?? 0 : 0;
  return fee + districtPart(person, jurisdiction, first);
}

/** A step done: marked, and what it grants given, its license fee paid where one is due. */
function complete(sim: Simulation, person: Person, jurisdiction: string, step: PathStep, r: LicensingRecord, track: VehicleClass): string {
  const path = pathsFor(track)[jurisdiction]!;
  r.done[step.id] = sim.now;
  if (!step.grants) return `${step.name}: done.`;
  if (step.issueFee) {
    const fee = inSave(sim, step.issueFee, path.currency);
    if (!payFromBank(sim, person, fee, `${step.grants.name}, the license fee`, 'documents')) {
      r.unpaid = step.id;
      return `${step.name}: passed. The license fee, ${formatMoney(fee, saveCurrency(sim.universe))}, is more than the bank can cover; the license waits for it.`;
    }
  }
  const doc = grant(sim, person, jurisdiction, step.grants, step.issueDays, track);
  return `${step.name}: ${step.kind === 'test' ? 'passed' : 'done'}. ${doc.name}${step.issueDays ? `, in the post, arriving ${formatDate(doc.issuedAt!, sim.zone)}` : ''}, good until ${formatDate(doc.expiresAt!, sim.zone)}.`;
}

// ---------------------------------------------------------------------------
// Exchanging a license from elsewhere
// ---------------------------------------------------------------------------

/** A full license from elsewhere they could exchange where they are now, and the exchange. */
export function exchangeable(person: Person, at: Instant): { jurisdiction: string; held: PersonDocument; exchange: LicenseExchange } | undefined {
  const here = pathHere(person);
  const exchange = here ? LICENSE_EXCHANGES[here.jurisdiction] : undefined;
  if (!here || !exchange || heldHere(person, here.jurisdiction, at)) return undefined;
  const held = documentsOf(person).find((d) => d.kind === 'license' && classOf(d) === 'car' && d.issuer !== here.jurisdiction && inForce(d, at) && (d.stage ?? 'full') === 'full'
    && (exchange.from.includes(d.issuer) || exchange.from.includes(d.issuer.split('-')[0]!)));
  return held ? { jurisdiction: here.jurisdiction, held, exchange } : undefined;
}

export function exchangeRefusal(person: Person, at: Instant): string | undefined {
  if (exchangeable(person, at)) return undefined;
  const here = pathHere(person);
  if (!here) return `SLATE doesn’t have the license rules for ${CITIES.get(person.currentLocationId)?.name ?? 'this place'} yet.`;
  if (heldHere(person, here.jurisdiction, at)) return 'You hold this license already.';
  if (!LICENSE_EXCHANGES[here.jurisdiction]) return `SLATE couldn’t confirm that ${LICENSES[here.jurisdiction]!.authority} exchanges a license from elsewhere: the path is the way.`;
  return `${LICENSES[here.jurisdiction]!.authority} doesn’t exchange a license you hold: the path is the way.`;
}

// ---------------------------------------------------------------------------
// Renewing, and the permit abroad
// ---------------------------------------------------------------------------

/** How far ahead of its end a license can be renewed: SLATE's estimate, six months, most authorities opening renewal about then. */
export const RENEW_AHEAD_DAYS = 183;
/**
 * How long after it runs out a license still renews without the tests: two
 * years, New York's rule (a license expired longer asks the written and road
 * tests again), which SLATE reads for every jurisdiction.
 */
export const RENEW_AFTER_DAYS = 730;

/** The license to renew: a full one that runs out within the window, or ran out not too long ago. */
export function renewable(person: Person, at: Instant): PersonDocument | undefined {
  return documentsOf(person)
    .filter((d) => d.kind === 'license' && classOf(d) === 'car' && d.status === 'valid' && (d.stage ?? 'full') === 'full' && d.expiresAt !== undefined && d.expiresAt - RENEW_AHEAD_DAYS * MS_DAY <= at && at - d.expiresAt <= RENEW_AFTER_DAYS * MS_DAY)
    .sort((a, b) => (b.expiresAt ?? 0) - (a.expiresAt ?? 0))[0];
}

export function renewRefusal(person: Person, at: Instant): string | undefined {
  const held = renewable(person, at);
  if (!held) return documentsOf(person).some((d) => d.kind === 'license' && d.status === 'valid') ? `A license renews within ${Math.round(RENEW_AHEAD_DAYS / 30)} months of running out.` : 'You hold no license to renew.';
  const rule = LICENSES[held.issuer];
  if (!rule || rule.renewalFee === null) return `SLATE doesn’t have what ${rule?.authority ?? 'the authority'} charges to renew.`;
  const country = held.issuer.split('-')[0];
  if (licensingOf(livesIn(person))?.split('-')[0] !== country) return `${rule.authority} renews a license for someone living in the country, and you live elsewhere.`;
  return undefined;
}

export const LICENSE_CARD_KIND = 'documents.license_card';

/** Why a lost license can't be replaced now, or nothing: one of theirs, lost, from an authority SLATE has the fee for, applied for while living in its country. */
export function replaceRefusal(person: Person, documentId: string): string | undefined {
  const doc = documentsOf(person).find((d) => d.id === documentId);
  if (!doc || doc.kind !== 'license') return 'That isn’t a license of yours.';
  if (doc.status !== 'lost') return 'It isn’t lost: report it lost first.';
  const rule = LICENSE_REPLACEMENT[doc.issuer];
  if (!rule) return `SLATE doesn’t have what ${LICENSES[doc.issuer]?.authority ?? 'its authority'} charges to replace it.`;
  if (licensingOf(livesIn(person))?.split('-')[0] !== doc.issuer.split('-')[0]) return `${LICENSES[doc.issuer]?.authority ?? 'Its authority'} replaces a license for someone living in the country.`;
  // A police report first where the authority asks for one (`ONLINE_REPORTS`, from 2026-10-03).
  if (doc.policeReport === undefined && (doc.issuer === 'ca-on' || (doc.issuer === 'ca-bc' && doc.stolen))) return `${LICENSES[doc.issuer]?.authority ?? 'Its authority'} asks for a police report first.`;
  return undefined;
}

/** A replacement's fee: New York's nothing for a stolen license with the police's MV-78B. */
export const replacementFeeFree = (doc: { issuer: string; stolen?: true; policeReport?: number }): boolean => doc.issuer === 'us-ny' && Boolean(doc.stolen) && doc.policeReport !== undefined;

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
  sim.onCommand<{ step: string; track?: VehicleClass }, { at: Instant[]; fee: Money; message?: string }>('documents.license_step', (p, { sim: s }) => {
    const person = s.player;
    const stepId = String(p?.step ?? '');
    const track: VehicleClass = p?.track === 'motorcycle' ? 'motorcycle' : 'car';
    const no = stepRefusal(s, person, stepId, track);
    if (no) throw new CommandError(no);
    const { jurisdiction, path } = pathHere(person, track)!;
    const step = path.steps.find((x) => x.id === stepId)!;
    const r = recordFor(person, jurisdiction, track);
    const cur = saveCurrency(s.universe);
    if (r.unpaid === stepId) {
      const fee = inSave(s, step.issueFee ?? 0, path.currency);
      if (!payFromBank(s, person, fee, `${step.grants!.name}, the license fee`, 'documents')) throw new CommandError(`${formatMoney(fee, cur)} is more than the bank can cover.`);
      delete r.unpaid;
      const doc = grant(s, person, jurisdiction, step.grants!, step.issueDays, track);
      return { at: [], fee, message: `${doc.name}, good until ${formatDate(doc.expiresAt!, s.zone)}.` };
    }
    const fee = inSave(s, stepFee(person, jurisdiction, path, step, r), path.currency);
    if (!payFromBank(s, person, fee, `${step.name}, ${LICENSES[jurisdiction]!.authority}`, 'documents')) throw new CommandError(`${formatMoney(fee, cur)} is more than the bank can cover.`);
    // Paying a covering fee again starts its attempts over.
    if (path.steps.some((x) => x.covered?.by === stepId)) r.used[stepId] = 0;
    keep(person, track, r);
    const at = book(s, person, jurisdiction, step, r, track);
    return { at, fee };
  });

  sim.onSchedule(LICENSE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const track: VehicleClass = item.payload.track === 'motorcycle' ? 'motorcycle' : 'car';
    const r = person ? recordOf(person, track) : undefined;
    if (!person || !r || r.jurisdiction !== item.payload.jurisdiction || r.booked?.step !== item.payload.step) return;
    const path = pathsFor(track)[r.jurisdiction]!;
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
    if (step.kind !== 'test') { tell(`${step.name} Done`, complete(s, person, r.jurisdiction, step, r, track)); return; }
    const attempt = (r.attempts[step.id] ?? 0) + 1;
    r.attempts[step.id] = attempt;
    if (step.covered) r.used[step.covered.by] = (r.used[step.covered.by] ?? 0) + 1;
    if (passesTest(s, person, r.jurisdiction, step, attempt, track)) {
      delete r.failedAt[step.id];
      tell(`${step.name} Passed`, complete(s, person, r.jurisdiction, step, r, track));
    } else {
      r.failedAt[step.id] = s.now;
      tell(`${step.name} Failed`, `Not this time${step.retakeDays ? `; it can be taken again from ${formatDate(s.now + step.retakeDays * MS_DAY, s.zone)}` : ''}.`);
    }
  });

  sim.onCommand<Record<string, never>, { expiresAt: Instant; fee: Money }>('documents.exchange_license', (_p, { sim: s }) => {
    const person = s.player;
    const no = exchangeRefusal(person, s.now);
    if (no) throw new CommandError(no);
    const { jurisdiction, held, exchange } = exchangeable(person, s.now)!;
    const fee = inSave(s, exchange.fee + districtPart(person, jurisdiction, exchange.years), exchange.currency);
    if (!payFromBank(s, person, fee, `${LICENSES[jurisdiction]!.name}, exchanged`, 'documents')) throw new CommandError(`${formatMoney(fee, saveCurrency(s.universe))} is more than the bank can cover.`);
    // The old one is surrendered.
    held.status = 'cancelled';
    const full = LICENSE_PATHS[jurisdiction]!.steps.map((st) => st.grants).filter((g): g is LicenseGrant => g?.stage === 'full').at(-1)!;
    const doc = grant(s, person, jurisdiction, { ...full, years: exchange.years });
    return { expiresAt: doc.expiresAt!, fee };
  });

  sim.onCommand<Record<string, never>, { expiresAt: Instant; fee: Money }>('documents.renew_license', (_p, { sim: s }) => {
    const person = s.player;
    const no = renewRefusal(person, s.now);
    if (no) throw new CommandError(no);
    const held = renewable(person, s.now)!;
    const rule = LICENSES[held.issuer]!;
    const currency = LICENSE_PATHS[held.issuer]?.currency ?? 'USD';
    // Inside a district that adds its own, its part by the years renewed (New York City’s MCTD, $16 on eight years; until
    // 2026-10-06 every New York renewal was charged the price outside it).
    const fee = inSave(s, rule.renewalFee! + districtPart(person, held.issuer, rule.validityYears ?? 5), currency);
    if (!payFromBank(s, person, fee, `${rule.name}, renewed`, 'documents')) throw new CommandError(`${formatMoney(fee, saveCurrency(s.universe))} is more than the bank can cover.`);
    const from = Math.max(s.now, held.expiresAt!);
    held.status = 'cancelled';
    const id = s.nextId('document');
    const expiresAt = addYears(from, rule.validityYears ?? 5);
    // Renewed by an American state, it's REAL ID, at the same fee (`content/identity.ts`).
    documentsOf(person).push({ ...held, id, number: numberFor('D', id), status: 'valid', issuedAt: s.now, expiresAt, ...(held.issuer.startsWith('us-') ? { realId: true } : {}) });
    // The motorcycle class is on the same card, and renews with it.
    for (const d of documentsOf(person)) if (d.kind === 'license' && classOf(d) === 'motorcycle' && d.issuer === held.issuer && d.status === 'valid' && (d.stage ?? 'full') === 'full') d.expiresAt = expiresAt;
    return { expiresAt, fee };
  });

  // A lost or stolen license replaced at its authority's fee (`content/replacements.ts`, from 2026-10-02): in force at once where
  // an interim document or the record lets its holder drive meanwhile, and once the card comes where it doesn't.
  sim.onCommand<{ documentId: string }, { readyAt: Instant; fee: Money }>('documents.replace_license', (p, { sim: s }) => {
    const person = s.player;
    const no = replaceRefusal(person, String(p?.documentId));
    if (no) throw new CommandError(no);
    const lost = documentsOf(person).find((d) => d.id === p.documentId)!;
    const rule = LICENSE_REPLACEMENT[lost.issuer]!;
    const fee = replacementFeeFree(lost) ? 0 : inSave(s, rule.fee, rule.currency);
    if (fee > 0 && !payFromBank(s, person, fee, `${LICENSES[lost.issuer]?.name ?? 'A license'}, replaced`, 'documents')) throw new CommandError(`${formatMoney(fee, saveCurrency(s.universe))} is more than the bank can cover.`);
    lost.status = 'cancelled';
    const id = s.nextId('document');
    const readyAt = s.now + rule.days * MS_DAY;
    const now = rule.driveMeanwhile || rule.days === 0;
    documentsOf(person).push({ ...lost, id, number: numberFor('D', id), status: now ? 'valid' : 'pending', ...(now ? { issuedAt: s.now } : { appliedAt: s.now, readyAt }) });
    if (!now) s.schedule({ at: readyAt, kind: LICENSE_CARD_KIND, label: 'The License Comes', category: 'personal', priority: 30, payload: { personId: person.id, documentId: id } });
    return { readyAt, fee };
  });
  sim.onSchedule(LICENSE_CARD_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const doc = person ? documentsOf(person).find((d) => d.id === item.payload.documentId) : undefined;
    if (!doc || doc.status !== 'pending') return;
    // The post held at home, the card waits for the hold's end (`systems/away.ts`).
    const held = heldUntil(person!, item.at, false);
    if (held !== undefined) { holdBack(s, item, held); return; }
    doc.status = 'valid';
    doc.issuedAt = item.at;
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
