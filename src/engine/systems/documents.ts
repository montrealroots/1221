/**
 * SLATE — the papers in your wallet.
 *
 * A passport and a driver's license are issued by the real authority for
 * where you are from (content/documents), run out on a date, get lost, get
 * renewed, and are asked for by the things in life that ask for them: a
 * border wants a valid passport, the wheel wants a license, a private bank
 * wants both. Nothing here invents a visa rule; the six-month warning is a
 * warning for every border and a refusal for none, because SLATE does not
 * carry the table of which countries enforce it.
 *
 * Money rules as everywhere: a fee is taken once when you apply, the
 * document arrives once when the office is done, and a retried application
 * cannot pay twice.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Id, IdentityDocument, IdentityPapers, Person } from '../domain/model';
import { MS_DAY, addDays, addMonths, addYears, ageOn, formatDate } from '../core/time';
import { formatMoney, type Money } from '../core/money';
import { clamp, remap } from '../core/rng';
import { CITIES, COUNTRIES, REGIONS, countryOfCity } from '../content/geography';
import {
  DOCUMENT_NOTE, LICENSE_EXCHANGE, NO_PASSPORT, SIX_MONTH_NOTE,
  licenseAuthorityFor, passportAuthorityFor,
} from '../content/documents';

export { DOCUMENT_NOTE, SIX_MONTH_NOTE };

/** Days of validity a border is warned about. */
export const SIX_MONTHS_DAYS = 183;
/** Days before a document runs out that the Decision Center starts asking. */
export const RENEWAL_WARNING_DAYS = 90;
/** What a consulate charges for an emergency travel document, SLATE's calibration. */
export const EMERGENCY_DOCUMENT_FEE: Money = 150_00;
/** An emergency travel document is good for this long: one journey home. */
export const EMERGENCY_DOCUMENT_DAYS = 30;
/** Sitting the knowledge test again after failing it. */
export const RETAKE_FEE: Money = 25_00;

export const NO_LICENSE = 'You do not hold a driver’s license.';
export const NO_PASSPORT_HELD = 'You do not hold a passport.';

// ---------------------------------------------------------------------------
// Where somebody is from, for the authority that issues to them
// ---------------------------------------------------------------------------

/** The city they live in: the home they hold, else where they are from. */
export function residenceCityOf(sim: Simulation, person: Person): string {
  const home = person.residenceId ? sim.universe.properties[person.residenceId] : undefined;
  return home?.locationId ?? person.homeRegionId;
}

export function residenceCountryOf(sim: Simulation, person: Person): string {
  return countryOfCity(residenceCityOf(sim, person)) ?? person.citizenshipId;
}

/** The state or province a city sits in, when the geography has one. */
export function regionOfCity(cityId: string): string | undefined {
  const parent = CITIES.get(cityId)?.parentId;
  return parent && REGIONS.get(parent) ? parent : undefined;
}

// ---------------------------------------------------------------------------
// Issuing
// ---------------------------------------------------------------------------

function documentNumber(sim: Simulation, issuerId: string, kind: IdentityDocument['kind']): string {
  const n = sim.counter(`doc:${kind}`);
  const seed = sim.rng('papers', issuerId, kind, n).int(10_000_000, 99_999_999);
  return kind === 'passport' ? `${issuerId.toUpperCase()}${String(seed)}` : `${issuerId.toUpperCase()}${String(seed).slice(0, 4)}-${String(n).padStart(5, '0')}`;
}

/** A passport from the real authority, issued some time ago and still good. */
function issuePassport(sim: Simulation, person: Person, countryId: string, yearsAgo?: number): IdentityDocument | undefined {
  const found = passportAuthorityFor(countryId);
  if (!found) return undefined;
  const { issuerId, authority } = found;
  const rng = sim.rng('papers', person.id, countryId);
  const ago = yearsAgo ?? rng.int(1, Math.max(1, authority.validityYears - 1));
  const issuedAt = addYears(sim.now, -ago, sim.homeZone) - rng.int(0, 300) * MS_DAY;
  return {
    kind: 'passport', issuerId, authority: authority.authority, number: documentNumber(sim, issuerId, 'passport'),
    issuedAt, expiresAt: addYears(issuedAt, authority.validityYears, sim.homeZone), status: 'valid',
  };
}

/** A license from the office where they live, issued some time after they came of age. */
function issueLicense(sim: Simulation, person: Person, yearsAgo?: number): IdentityDocument | undefined {
  const cityId = residenceCityOf(sim, person);
  const countryId = countryOfCity(cityId) ?? person.citizenshipId;
  const found = licenseAuthorityFor(countryId, regionOfCity(cityId));
  if (!found) return undefined;
  const age = ageOn(person.birthInstant, sim.now, sim.homeZone);
  if (age < found.authority.minAge + 1) return undefined;
  const rng = sim.rng('papers', person.id, 'license');
  const held = Math.min(age - found.authority.minAge, found.authority.validityYears - 1);
  const ago = yearsAgo ?? rng.int(0, Math.max(0, held));
  const issuedAt = addYears(sim.now, -ago, sim.homeZone) - rng.int(0, 300) * MS_DAY;
  return {
    kind: 'license', issuerId: found.issuerId, authority: found.office, number: documentNumber(sim, found.issuerId, 'license'),
    issuedAt, expiresAt: addYears(issuedAt, found.authority.validityYears, sim.homeZone), status: 'valid', regionId: regionOfCity(cityId),
  };
}

/**
 * The papers a person carries, issued the first time anything asks. A
 * passport for each citizenship the authority issues, and a license if they
 * are old enough to have had one for a year. Idempotent.
 */
export function ensurePapers(sim: Simulation, person: Person): IdentityPapers {
  if (person.documents) return person.documents;
  const papers: IdentityPapers = {};
  const passport = issuePassport(sim, person, person.citizenshipId);
  if (passport) papers.passport = passport;
  if (person.secondCitizenshipId) {
    const second = issuePassport(sim, person, person.secondCitizenshipId);
    if (second) papers.secondPassport = second;
  }
  const license = issueLicense(sim, person);
  if (license) papers.license = license;
  person.documents = papers;
  return papers;
}

// ---------------------------------------------------------------------------
// Reading
// ---------------------------------------------------------------------------

/** What a document is right now, with the clock applied. */
export function statusOf(sim: Simulation, doc: IdentityDocument | undefined): IdentityDocument['status'] | 'none' {
  if (!doc) return 'none';
  if (doc.status === 'valid' && doc.expiresAt <= sim.now) return 'expired';
  return doc.status;
}

export function isValid(sim: Simulation, doc: IdentityDocument | undefined): doc is IdentityDocument {
  return statusOf(sim, doc) === 'valid';
}

/** The best passport in the wallet: valid, longest left. */
export function passportOf(sim: Simulation, person: Person): IdentityDocument | undefined {
  const papers = person.documents ?? {};
  const held = [papers.passport, papers.secondPassport].filter((d): d is IdentityDocument => isValid(sim, d));
  return held.sort((a, b) => b.expiresAt - a.expiresAt)[0];
}

export interface PassportCheck {
  ok: boolean;
  /** Why it will not do, in a person's words. */
  reason?: string;
  /** It will do, and here is the thing to know. */
  warning?: string;
  passport?: IdentityDocument;
  daysLeft?: number;
}

/**
 * Whether the wallet gets this person across a border into `toCountryId`.
 * A missing, expired, lost or still-applied-for passport does not. An
 * emergency document gets them home and nowhere else. Under six months
 * left warns and never refuses.
 */
export function passportCheck(sim: Simulation, person: Person, toCountryId?: string): PassportCheck {
  return assessPassport(sim, person, ensurePapers(sim, person), toCountryId);
}

/** The same answer read without issuing anything, for screens. */
export function passportStatus(sim: Simulation, person: Person, toCountryId?: string): PassportCheck {
  return assessPassport(sim, person, person.documents ?? {}, toCountryId);
}

function assessPassport(sim: Simulation, person: Person, papers: IdentityPapers, toCountryId?: string): PassportCheck {
  const passport = [papers.passport, papers.secondPassport].filter((d): d is IdentityDocument => isValid(sim, d)).sort((a, b) => b.expiresAt - a.expiresAt)[0];
  const who = person.isPlayer ? 'You' : person.displayName;
  if (!passport) {
    const state = statusOf(sim, papers.passport);
    if (state === 'none') {
      const why = NO_PASSPORT[person.citizenshipId];
      return { ok: false, reason: why ? `${who} carry no passport: ${why}` : `${who} ${person.isPlayer ? 'do' : 'does'} not hold a passport. Apply for one; the wait is weeks, not days.` };
    }
    if (state === 'expired') return { ok: false, reason: `${who === 'You' ? 'Your' : `${person.displayName}’s`} ${COUNTRIES.get(papers.passport!.issuerId)?.name ?? ''} passport ran out on ${formatDate(papers.passport!.expiresAt, sim.homeZone)}. No border takes an expired one.`, passport: papers.passport };
    if (state === 'lost') return { ok: false, reason: `${who === 'You' ? 'Your' : `${person.displayName}’s`} passport is reported lost. Replace it, or get an emergency document from a consulate if ${person.isPlayer ? 'you are' : 'they are'} abroad.`, passport: papers.passport };
    if (state === 'applied') return { ok: false, reason: `${who === 'You' ? 'Your' : `${person.displayName}’s`} passport is at the office until ${formatDate(papers.passport!.readyAt ?? sim.now, sim.homeZone)}.`, passport: papers.passport };
    return { ok: false, reason: NO_PASSPORT_HELD };
  }
  const daysLeft = Math.floor((passport.expiresAt - sim.now) / MS_DAY);
  if (passport.emergency && toCountryId && toCountryId !== passport.issuerId) {
    return { ok: false, reason: `An emergency travel document gets ${person.isPlayer ? 'you' : 'them'} home to ${COUNTRIES.get(passport.issuerId)?.name ?? passport.issuerId}, not to ${COUNTRIES.get(toCountryId)?.name ?? 'anywhere else'}.`, passport, daysLeft };
  }
  if (toCountryId && toCountryId !== passport.issuerId && daysLeft < SIX_MONTHS_DAYS) {
    return { ok: true, warning: `${who === 'You' ? 'Your' : `${person.displayName}’s`} passport has ${daysLeft} days left. ${SIX_MONTH_NOTE}`, passport, daysLeft };
  }
  return { ok: true, passport, daysLeft };
}

/** Whether they may drive, read without issuing anything: for screens and mode pickers. Papers not yet issued count as in order. */
export function licenseValid(sim: Simulation, person: Person): boolean {
  return person.documents ? isValid(sim, person.documents.license) : true;
}

export interface LicenseCheck { ok: boolean; reason?: string; license?: IdentityDocument }

/** Whether this person may lawfully drive: a valid license from anywhere. */
export function licenseCheck(sim: Simulation, person: Person): LicenseCheck {
  const papers = ensurePapers(sim, person);
  const state = statusOf(sim, papers.license);
  if (state === 'valid') return { ok: true, license: papers.license };
  const who = person.isPlayer ? 'You' : person.displayName;
  if (state === 'none') return { ok: false, reason: person.isPlayer ? `${NO_LICENSE} Apply at the office where you live: a knowledge test today, a road test in a few weeks.` : `${who} does not hold a driver’s license.` };
  if (state === 'applied') return { ok: false, reason: papers.license!.roadTestAt ? `${who === 'You' ? 'Your' : `${who}’s`} road test is on ${formatDate(papers.license!.roadTestAt, sim.homeZone)}. Until then, a learner does not drive alone.` : `${who === 'You' ? 'Your' : `${who}’s`} license is at the office until ${formatDate(papers.license!.readyAt ?? sim.now, sim.homeZone)}.`, license: papers.license };
  if (state === 'lost') return { ok: false, reason: `${who === 'You' ? 'Your' : `${who}’s`} license is reported lost. Replace it before driving.`, license: papers.license };
  return { ok: false, reason: `${who === 'You' ? 'Your' : `${who}’s`} license ran out on ${formatDate(papers.license!.expiresAt, sim.homeZone)}. Renew it before driving.`, license: papers.license };
}

/** Where the player's residence would issue a license, and whether their current one swaps without a test. */
export function exchangeOffer(sim: Simulation, person: Person): { office: string; countryId: string; exchangeable: boolean; note: string } | undefined {
  const papers = ensurePapers(sim, person);
  const license = papers.license;
  if (!license || statusOf(sim, license) !== 'valid') return undefined;
  const cityId = residenceCityOf(sim, person);
  const countryId = countryOfCity(cityId) ?? person.citizenshipId;
  if (countryId === license.issuerId) return undefined;
  const found = licenseAuthorityFor(countryId, regionOfCity(cityId));
  if (!found) return undefined;
  const exchangeable = (LICENSE_EXCHANGE[found.issuerId] ?? []).includes(license.issuerId);
  const from = COUNTRIES.get(license.issuerId)?.name ?? license.issuerId;
  const to = COUNTRIES.get(found.issuerId)?.name ?? found.issuerId;
  return {
    office: found.office, countryId: found.issuerId, exchangeable,
    note: exchangeable
      ? `${to} swaps a ${from} license for its own without a test. ${found.office} takes ${formatMoney(found.authority.fee)} and ${found.authority.weeks} weeks.`
      : `${to} does not swap a ${from} license. You sit the test here like anybody else. Until then your ${from} license still drives.`,
  };
}

// ---------------------------------------------------------------------------
// The decisions the papers raise
// ---------------------------------------------------------------------------

function raiseExpiryDecisions(sim: Simulation): void {
  const me = sim.player;
  const papers = ensurePapers(sim, me);
  const entries: [keyof IdentityPapers, IdentityDocument | undefined][] = [['passport', papers.passport], ['secondPassport', papers.secondPassport], ['license', papers.license]];
  for (const [which, doc] of entries) {
    if (!doc) continue;
    const state = statusOf(sim, doc);
    if (state === 'valid' && doc.expiresAt - sim.now < RENEWAL_WARNING_DAYS * MS_DAY) {
      const isPassport = doc.kind === 'passport';
      sim.requireDecision({
        urgency: 55, category: 'papers', refType: 'document', refId: `${me.id}:${which}`,
        title: isPassport ? 'Your Passport Runs Out Soon' : 'Your License Runs Out Soon',
        detail: `${doc.authority} issued it; it runs out on ${formatDate(doc.expiresAt, sim.homeZone)}. ${isPassport ? 'Borders want six months on it, and renewal takes weeks.' : 'Renewal is a form, not a test.'}`,
        route: '/workspace/character',
        actions: [{ label: isPassport ? 'Renew The Passport' : 'Renew The License', commandKind: isPassport ? 'doc.apply_passport' : 'doc.renew_license', payload: isPassport ? { which } : {} }],
        dueAt: doc.expiresAt,
      });
    } else if (state === 'expired' && doc.status === 'valid') {
      doc.status = 'expired';
      sim.notify({ category: 'papers', title: doc.kind === 'passport' ? 'Your Passport Has Expired' : 'Your License Has Expired', body: `${doc.authority} issued it and it ran out on ${formatDate(doc.expiresAt, sim.homeZone)}.`, importance: 60, route: '/workspace/character' });
      sim.requireDecision({
        urgency: 70, category: 'papers', refType: 'document', refId: `${me.id}:${which}`,
        title: doc.kind === 'passport' ? 'Your Passport Has Expired' : 'Your License Has Expired',
        detail: doc.kind === 'passport' ? 'No border takes it. Apply for a new one.' : 'You cannot lawfully drive on it. Renew it.',
        route: '/workspace/character',
        actions: [{ label: doc.kind === 'passport' ? 'Apply For A Passport' : 'Renew The License', commandKind: doc.kind === 'passport' ? 'doc.apply_passport' : 'doc.renew_license', payload: doc.kind === 'passport' ? { which } : {} }],
      });
    }
  }
}

function ensureMonthlyCheck(sim: Simulation): void {
  if (sim.timeline.pending().some((item) => item.kind === 'doc.month')) return;
  sim.schedule({ at: addDays(sim.now, 1, sim.homeZone), kind: 'doc.month', label: 'Papers Check', category: 'system', priority: 22 });
}

// ---------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------

function pay(sim: Simulation, accountId: Id | undefined, amount: Money, memo: string): void {
  if (amount <= 0) return;
  if (!accountId) throw new CommandError('No account to pay the fee from.');
  if (sim.ledger.availableFunds(accountId) < amount) throw new CommandError(`The fee is ${formatMoney(amount)} and you cannot cover it.`);
  sim.expense(accountId, amount, memo, 'fees');
}

export function registerDocuments(sim: Simulation): void {
  sim.onSchedule('doc.month', () => {
    raiseExpiryDecisions(sim);
    sim.schedule({ at: addMonths(sim.now, 1, sim.homeZone), kind: 'doc.month', label: 'Papers Check', category: 'system', priority: 22 });
  });

  sim.onSchedule('doc.passport_ready', (item) => {
    const person = sim.universe.people[item.payload.personId as Id];
    const which = item.payload.which as 'passport' | 'secondPassport';
    if (!person?.documents) return;
    const pending = person.documents[which];
    if (!pending || pending.status !== 'applied') return;
    const found = passportAuthorityFor(pending.issuerId);
    const years = found?.authority.validityYears ?? 10;
    person.documents[which] = {
      kind: 'passport', issuerId: pending.issuerId, authority: pending.authority, number: documentNumber(sim, pending.issuerId, 'passport'),
      issuedAt: sim.now, expiresAt: addYears(sim.now, years, sim.homeZone), status: 'valid',
    };
    sim.resolveDecision('document', `${person.id}:${which}`, 'papers');
    if (person.isPlayer) {
      sim.notify({ category: 'papers', title: 'Your New Passport Is Here', body: `${pending.authority} issued it today. Good until ${formatDate(person.documents[which]!.expiresAt, sim.homeZone)}.`, importance: 50, route: '/workspace/character' });
      sim.remember({ category: 'life', title: 'A New Passport', detail: `${COUNTRIES.get(pending.issuerId)?.name ?? pending.issuerId}, from ${pending.authority}.`, refs: [{ type: 'person', id: person.id }], significance: 6, public: false });
    }
    sim.emit('doc.issued', { personId: person.id, kind: 'passport', issuerId: pending.issuerId });
  });

  sim.onSchedule('doc.road_test', (item) => {
    const person = sim.universe.people[item.payload.personId as Id];
    if (!person?.documents?.license || person.documents.license.status !== 'applied') return;
    const learner = person.documents.license;
    const skill = person.skills['driving'] ?? 30;
    const chance = remap(skill, 0, 100, 0.35, 0.95);
    const passed = sim.rng('papers', person.id, 'road', sim.counter('road_test')).chance(chance);
    const found = licenseAuthorityFor(learner.issuerId, learner.regionId);
    if (passed) {
      person.documents.license = {
        kind: 'license', issuerId: learner.issuerId, authority: learner.authority, number: documentNumber(sim, learner.issuerId, 'license'),
        issuedAt: sim.now, expiresAt: addYears(sim.now, found?.authority.validityYears ?? 10, sim.homeZone), status: 'valid', regionId: learner.regionId,
      };
      sim.resolveDecision('document', `${person.id}:license`, 'papers');
      if (person.isPlayer) {
        sim.notify({ category: 'papers', title: 'You Passed', body: `${learner.authority} issued your license today. Good until ${formatDate(person.documents.license.expiresAt, sim.homeZone)}.`, importance: 55, route: '/workspace/character' });
        sim.remember({ category: 'life', title: 'Passed The Road Test', detail: `${learner.authority}. First time or not, it counts.`, refs: [{ type: 'person', id: person.id }], significance: 12, public: false });
      }
      sim.emit('doc.issued', { personId: person.id, kind: 'license', issuerId: learner.issuerId });
    } else {
      person.documents.license = undefined;
      if (person.isPlayer) {
        sim.notify({ category: 'papers', title: 'You Failed The Road Test', body: 'The examiner was not persuaded. Book it again; the knowledge test still stands for a year in SLATE, so it is the road again, not the desk.', importance: 55, route: '/workspace/character' });
        sim.requireDecision({
          urgency: 45, category: 'papers', refType: 'document', refId: `${person.id}:license`,
          title: 'Book The Road Test Again', detail: `A pass depends on how you actually drive. Your driving skill is ${Math.round(skill)}; practice, or book it and see.`,
          route: '/workspace/character', actions: [{ label: 'Book It Again', commandKind: 'doc.apply_license', payload: { retake: true } }],
        });
      }
      sim.emit('doc.test_failed', { personId: person.id });
    }
  });

  sim.onSchedule('doc.license_ready', (item) => {
    const person = sim.universe.people[item.payload.personId as Id];
    if (!person?.documents?.license || person.documents.license.status !== 'applied' || person.documents.license.roadTestAt) return;
    const pending = person.documents.license;
    const found = licenseAuthorityFor(pending.issuerId, pending.regionId);
    person.documents.license = {
      kind: 'license', issuerId: pending.issuerId, authority: pending.authority, number: documentNumber(sim, pending.issuerId, 'license'),
      issuedAt: sim.now, expiresAt: addYears(sim.now, found?.authority.validityYears ?? 10, sim.homeZone), status: 'valid', regionId: pending.regionId,
    };
    sim.resolveDecision('document', `${person.id}:license`, 'papers');
    if (person.isPlayer) sim.notify({ category: 'papers', title: 'Your License Is Here', body: `${pending.authority} issued it today. Good until ${formatDate(person.documents.license.expiresAt, sim.homeZone)}.`, importance: 45, route: '/workspace/character' });
    sim.emit('doc.issued', { personId: person.id, kind: 'license', issuerId: pending.issuerId });
  });

  // Everybody starts with what they would have, and the monthly check runs.
  ensurePapers(sim, sim.player);
  ensureMonthlyCheck(sim);

  // --- Passports -----------------------------------------------------------

  sim.onCommand<{ which?: 'passport' | 'secondPassport'; expedite?: boolean; accountId?: Id }, { fee: Money; readyAt: number; authority: string }>(
    'doc.apply_passport',
    (p, { sim: s }) => {
      const me = s.player;
      const papers = ensurePapers(s, me);
      const which = p.which ?? 'passport';
      const countryId = which === 'passport' ? me.citizenshipId : me.secondCitizenshipId;
      if (!countryId) throw new CommandError('You hold only the one citizenship.');
      const found = passportAuthorityFor(countryId);
      if (!found) throw new CommandError(NO_PASSPORT[countryId] ?? `${COUNTRIES.get(countryId)?.name ?? countryId} does not issue passports.`);
      const current = papers[which];
      if (current?.status === 'applied') throw new CommandError(`It is already at the office, due ${formatDate(current.readyAt ?? s.now, s.homeZone)}.`);
      if (current && statusOf(s, current) === 'valid' && !current.emergency && current.expiresAt - s.now > 365 * MS_DAY) {
        throw new CommandError(`Your ${COUNTRIES.get(countryId)?.name ?? ''} passport is good until ${formatDate(current.expiresAt, s.homeZone)}. ${found.authority.authority} renews inside the last year.`);
      }
      const expedite = Boolean(p.expedite && found.authority.expedite);
      const fee = found.authority.fee + (expedite ? found.authority.expedite!.fee : 0);
      const weeks = expedite ? found.authority.expedite!.weeks : found.authority.weeks;
      pay(s, p.accountId ?? me.primaryAccountId, fee, `${found.authority.authority} — passport${expedite ? ', expedited' : ''}`);
      const readyAt = addDays(s.now, weeks * 7, s.homeZone);
      // The old book stays valid until the new one arrives, as it does when
      // you renew by post; a lost or expired one is simply replaced.
      papers[which] = {
        kind: 'passport', issuerId: found.issuerId, authority: found.authority.authority,
        number: current && statusOf(s, current) === 'valid' ? current.number : 'PENDING',
        issuedAt: current && statusOf(s, current) === 'valid' ? current.issuedAt : s.now,
        expiresAt: current && statusOf(s, current) === 'valid' ? current.expiresAt : s.now,
        status: 'applied', appliedAt: s.now, readyAt,
      };
      s.schedule({ at: readyAt, kind: 'doc.passport_ready', label: 'Passport Arrives', category: 'life', payload: { personId: me.id, which }, priority: 40, refType: 'document', refId: `${me.id}:${which}` });
      s.resolveDecision('document', `${me.id}:${which}`, 'papers');
      s.remember({ category: 'life', title: 'Applied For A Passport', detail: `${found.authority.authority}, ${formatMoney(fee)}${expedite ? ' expedited' : ''}. Due ${formatDate(readyAt, s.homeZone)}.`, refs: [{ type: 'person', id: me.id }], significance: 4, public: false, amount: fee });
      s.emit('doc.applied', { personId: me.id, kind: 'passport', which, expedite });
      return { fee, readyAt, authority: found.authority.authority };
    },
  );

  sim.onCommand<{ kind: 'passport' | 'secondPassport' | 'license'; accountId?: Id }, { emergency: boolean; fee: Money; note: string }>(
    'doc.report_lost',
    (p, { sim: s }) => {
      const me = s.player;
      const papers = ensurePapers(s, me);
      const doc = papers[p.kind];
      if (!doc || doc.status === 'lost') throw new CommandError('There is nothing to report lost.');
      if (doc.status === 'applied') throw new CommandError('It is at the office; there is nothing in your wallet to lose.');
      doc.status = 'lost';
      s.resolveDecision('document', `${me.id}:${p.kind}`, 'papers');
      const abroad = (countryOfCity(me.currentLocationId) ?? me.citizenshipId) !== doc.issuerId;
      if (doc.kind === 'passport' && abroad) {
        // The consulate issues an emergency travel document the same day: one
        // journey home, then a proper replacement from the office.
        pay(s, p.accountId ?? me.primaryAccountId, EMERGENCY_DOCUMENT_FEE, `Consulate of ${COUNTRIES.get(doc.issuerId)?.name ?? doc.issuerId} — emergency travel document`);
        papers[p.kind] = {
          kind: 'passport', issuerId: doc.issuerId, authority: `Consulate of ${COUNTRIES.get(doc.issuerId)?.name ?? doc.issuerId}`, number: documentNumber(s, doc.issuerId, 'passport'),
          issuedAt: s.now, expiresAt: addDays(s.now, EMERGENCY_DOCUMENT_DAYS, s.homeZone), status: 'valid', emergency: true,
        };
        const note = `The consulate issued an emergency travel document for ${formatMoney(EMERGENCY_DOCUMENT_FEE)}. It gets you home and nowhere else, and it runs out in ${EMERGENCY_DOCUMENT_DAYS} days.`;
        s.remember({ category: 'life', title: 'Lost Your Passport Abroad', detail: note, refs: [{ type: 'person', id: me.id }], significance: 10, public: false, amount: EMERGENCY_DOCUMENT_FEE });
        s.emit('doc.lost', { personId: me.id, kind: p.kind, emergency: true });
        return { emergency: true, fee: EMERGENCY_DOCUMENT_FEE, note };
      }
      const note = doc.kind === 'passport' ? 'Reported. Apply for a replacement; the wait is the same as a new one.' : 'Reported. Renew it for a replacement, and do not drive until it comes.';
      s.requireDecision({
        urgency: 60, category: 'papers', refType: 'document', refId: `${me.id}:${p.kind}`,
        title: doc.kind === 'passport' ? 'Replace Your Passport' : 'Replace Your License', detail: note, route: '/workspace/character',
        actions: [{ label: doc.kind === 'passport' ? 'Apply For A Passport' : 'Replace The License', commandKind: doc.kind === 'passport' ? 'doc.apply_passport' : 'doc.renew_license', payload: doc.kind === 'passport' ? { which: p.kind } : {} }],
      });
      s.remember({ category: 'life', title: doc.kind === 'passport' ? 'Lost Your Passport' : 'Lost Your License', detail: note, refs: [{ type: 'person', id: me.id }], significance: 6, public: false });
      s.emit('doc.lost', { personId: me.id, kind: p.kind, emergency: false });
      return { emergency: false, fee: 0, note };
    },
  );

  // --- Licenses ------------------------------------------------------------

  sim.onCommand<{ retake?: boolean; accountId?: Id }, { passedKnowledge: boolean; roadTestAt?: number; fee: Money; office: string }>(
    'doc.apply_license',
    (p, { sim: s }) => {
      const me = s.player;
      const papers = ensurePapers(s, me);
      if (papers.license && statusOf(s, papers.license) === 'valid') throw new CommandError(`You hold a license from ${papers.license.authority} until ${formatDate(papers.license.expiresAt, s.homeZone)}.`);
      if (papers.license?.status === 'applied') throw new CommandError(papers.license.roadTestAt ? `Your road test is booked for ${formatDate(papers.license.roadTestAt, s.homeZone)}.` : 'It is at the office already.');
      const cityId = residenceCityOf(s, me);
      const countryId = countryOfCity(cityId) ?? me.citizenshipId;
      const found = licenseAuthorityFor(countryId, regionOfCity(cityId));
      if (!found) throw new CommandError(`${COUNTRIES.get(countryId)?.name ?? countryId} issues no driver’s license SLATE knows of.`);
      const age = ageOn(me.birthInstant, s.now, s.homeZone);
      if (age < found.authority.minAge) throw new CommandError(`${found.office} licenses drivers from ${found.authority.minAge}. You are ${age}.`);
      const fee = p.retake ? RETAKE_FEE : found.authority.fee;
      pay(s, p.accountId ?? me.primaryAccountId, fee, `${found.office} — ${p.retake ? 'road test' : 'driver’s license application'}`);
      const skill = me.skills['driving'] ?? 30;
      // The knowledge test is sat today. A retake skips it: the pass stands.
      const knowledge = p.retake || s.rng('papers', me.id, 'knowledge', s.counter('knowledge_test')).chance(clamp(0.6 + skill / 250, 0.6, 0.97));
      if (!knowledge) {
        s.remember({ category: 'life', title: 'Failed The Knowledge Test', detail: `${found.office}. ${formatMoney(fee)} and a morning. Sit it again when you like.`, refs: [{ type: 'person', id: me.id }], significance: 5, public: false, amount: fee });
        s.emit('doc.test_failed', { personId: me.id });
        return { passedKnowledge: false, fee, office: found.office };
      }
      const roadTestAt = addDays(s.now, found.authority.weeks * 7, s.homeZone);
      papers.license = {
        kind: 'license', issuerId: found.issuerId, authority: found.office, number: 'LEARNER', issuedAt: s.now, expiresAt: s.now,
        status: 'applied', appliedAt: s.now, roadTestAt, regionId: regionOfCity(cityId),
      };
      s.schedule({ at: roadTestAt, kind: 'doc.road_test', label: 'Road Test', category: 'life', payload: { personId: me.id }, priority: 40, refType: 'document', refId: `${me.id}:license`, requiresPlayer: true, durationMinutes: 45 });
      s.resolveDecision('document', `${me.id}:license`, 'papers');
      s.remember({ category: 'life', title: p.retake ? 'Booked The Road Test Again' : 'Passed The Knowledge Test', detail: `${found.office}. Road test ${formatDate(roadTestAt, s.homeZone)}.`, refs: [{ type: 'person', id: me.id }], significance: 5, public: false, amount: fee });
      s.emit('doc.applied', { personId: me.id, kind: 'license', retake: Boolean(p.retake) });
      return { passedKnowledge: true, roadTestAt, fee, office: found.office };
    },
  );

  sim.onCommand<{ accountId?: Id }, { fee: Money; readyAt: number; office: string }>(
    'doc.renew_license',
    (p, { sim: s }) => {
      const me = s.player;
      const papers = ensurePapers(s, me);
      const current = papers.license;
      if (!current) throw new CommandError(`${NO_LICENSE} Apply for one; renewal is for a license you hold.`);
      if (current.status === 'applied') throw new CommandError('It is at the office already.');
      const found = licenseAuthorityFor(current.issuerId, current.regionId);
      if (!found) throw new CommandError('That office no longer issues.');
      if (statusOf(s, current) === 'valid' && current.expiresAt - s.now > 365 * MS_DAY) throw new CommandError(`It is good until ${formatDate(current.expiresAt, s.homeZone)}. ${found.office} renews inside the last year.`);
      const fee = found.authority.fee;
      pay(s, p.accountId ?? me.primaryAccountId, fee, `${found.office} — license renewal`);
      const readyAt = addDays(s.now, Math.max(1, Math.round(found.authority.weeks / 2)) * 7, s.homeZone);
      papers.license = { ...current, status: 'applied', appliedAt: s.now, readyAt, roadTestAt: undefined, authority: found.office };
      s.schedule({ at: readyAt, kind: 'doc.license_ready', label: 'License Arrives', category: 'life', payload: { personId: me.id }, priority: 40, refType: 'document', refId: `${me.id}:license` });
      s.resolveDecision('document', `${me.id}:license`, 'papers');
      s.remember({ category: 'life', title: 'Renewed Your License', detail: `${found.office}, ${formatMoney(fee)}. Due ${formatDate(readyAt, s.homeZone)}.`, refs: [{ type: 'person', id: me.id }], significance: 3, public: false, amount: fee });
      s.emit('doc.applied', { personId: me.id, kind: 'license', renewal: true });
      return { fee, readyAt, office: found.office };
    },
  );

  sim.onCommand<{ accountId?: Id }, { fee: Money; readyAt: number; office: string }>(
    'doc.exchange_license',
    (p, { sim: s }) => {
      const me = s.player;
      const offer = exchangeOffer(s, me);
      if (!offer) throw new CommandError('There is nothing to exchange: your license is from where you live, or you hold none.');
      if (!offer.exchangeable) throw new CommandError(offer.note);
      const papers = ensurePapers(s, me);
      const current = papers.license!;
      const cityId = residenceCityOf(s, me);
      const found = licenseAuthorityFor(offer.countryId, regionOfCity(cityId))!;
      pay(s, p.accountId ?? me.primaryAccountId, found.authority.fee, `${found.office} — license exchange`);
      const readyAt = addDays(s.now, found.authority.weeks * 7, s.homeZone);
      papers.license = { ...current, issuerId: found.issuerId, authority: found.office, regionId: regionOfCity(cityId), status: 'applied', appliedAt: s.now, readyAt, roadTestAt: undefined };
      s.schedule({ at: readyAt, kind: 'doc.license_ready', label: 'License Arrives', category: 'life', payload: { personId: me.id }, priority: 40, refType: 'document', refId: `${me.id}:license` });
      s.remember({ category: 'life', title: 'Exchanged Your License', detail: `${found.office} takes a ${COUNTRIES.get(current.issuerId)?.name ?? current.issuerId} license without a test. Due ${formatDate(readyAt, s.homeZone)}.`, refs: [{ type: 'person', id: me.id }], significance: 4, public: false, amount: found.authority.fee });
      s.emit('doc.applied', { personId: me.id, kind: 'license', exchange: true });
      return { fee: found.authority.fee, readyAt, office: found.office };
    },
  );
}
