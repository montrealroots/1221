/**
 * SLATE — the papers a person holds, and what they let them do
 * (docs/WORLD.md, stage 1). From 2026-09-29.
 *
 * Every document is a record: its kind, who issued it, its number, when it
 * was issued and when it runs out, and whether it's pending, valid, lost or
 * canceled. Kept apart as the law keeps them apart:
 *
 * - a passport proves identity and citizenship for crossing borders
 *   (\`content/passports.ts\`);
 * - a travel authorization (the US's ESTA, the UK's ETA, Canada's eTA, and
 *   others) or a visa lets a citizen of one country visit another for a short
 *   stay, as the destination's rule for that citizenship says
 *   (\`content/entry.ts\`); it is tied to the passport it was issued on, and
 *   ends with it;
 * - a driving license lets its holder drive, where the license's issuer's and
 *   the road's jurisdiction's rules allow (\`content/licenses.ts\`); it is not
 *   identity for a border, not permission to stay, and not permission to work.
 *
 * What SLATE doesn't have a rule for, it says it doesn't have, and doesn't
 * let the action through on a guess.
 */

import { VISAS } from '../content/visas';
import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, MS_HOUR, formatDate, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES, COUNTRIES } from '../content/geography';
import { ENTRY, type Authorization, type EntryRule } from '../content/entry';
import { LICENSES, type LicenseRule } from '../content/licenses';
import { payFromBank } from './household';
import { PASSPORTS, type PassportRule } from '../content/passports';

export type DocumentKind = 'passport' | 'authorization' | 'visa' | 'license' | 'idp' | 'permit';

export interface PersonDocument {
  id: string;
  kind: DocumentKind;
  /** Who issued it: a country (ISO 3166 alpha-2) for a passport, an authorization or a visa; a licensing jurisdiction's id (\`content/licenses.ts\`) for a license. */
  issuer: string;
  /** What the issuer calls it. */
  name: string;
  number: string;
  status: 'pending' | 'valid' | 'lost' | 'cancelled';
  appliedAt?: Instant;
  /** When a pending document is issued. */
  readyAt?: Instant;
  issuedAt?: Instant;
  expiresAt?: Instant;
  /** An authorization's or a visa's destination, and the passport it was issued on. */
  destination?: string;
  passportId?: string;
  /** A license's stage on a graduated path, and whether its holder may drive with nobody beside them; a license without them is full. */
  stage?: import('../content/licensepaths').LicenseStage;
  alone?: boolean;
  /** A permission to work tied to one job, and days without work counted against it (`systems/permission.ts`). */
  bookingId?: string;
  idleDays?: number;
}

/** A person's papers, kept on them. */
export function documentsOf(person: Person): PersonDocument[] {
  person.documents ??= [];
  return person.documents;
}

/** Whether a document can be shown on a day: issued, not lost or canceled, not run out. */
export function inForce(doc: PersonDocument, at: Instant): boolean {
  return doc.status === 'valid' && (doc.issuedAt ?? 0) <= at && (doc.expiresAt === undefined || doc.expiresAt > at);
}

/** The passport they'd travel on: their own country's, in force, the longest-lasting. */
export function passportOf(person: Person, at: Instant): PersonDocument | undefined {
  const own = isoOfCountry(person.citizenshipId);
  return documentsOf(person)
    .filter((d) => d.kind === 'passport' && inForce(d, at) && (own === undefined || d.issuer === own))
    .sort((a, b) => (b.expiresAt ?? 0) - (a.expiresAt ?? 0))[0];
}

/** A country's ISO 3166 alpha-2 code, from SLATE's country id. */
export function isoOfCountry(countryId: string | undefined): string | undefined {
  if (!countryId) return undefined;
  return COUNTRIES.get(countryId)?.iso2?.toUpperCase() ?? (countryId.length === 2 ? countryId.toUpperCase() : undefined);
}

/** The country a town is in, as ISO alpha-2. */
export function isoOfCity(cityId: string): string | undefined {
  const city = CITIES.get(cityId);
  return city ? isoOfCountry(city.countryId) : undefined;
}

/**
 * A moment some years on, by the calendar: a passport issued on 16 February
 * runs out on 16 February, as issuers date them. A term in half-years, as
 * New South Wales's P1 license's eighteen months, goes by months. Until
 * 2026-09-29 a term was 365.25 days a year, and a ten-year passport ran out
 * a day late.
 */
export function addYears(at: Instant, years: number): Instant {
  const d = new Date(at);
  return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + Math.round(years * 12), d.getUTCDate(), d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds(), d.getUTCMilliseconds());
}

/** A country's name as a sentence says it: the United Kingdom, the Netherlands. */
export function theCountry(name: string): string {
  return /^(United |Netherlands|Philippines|Bahamas|Gambia|Maldives|Czech Republic|Dominican Republic|Central African Republic|Democratic Republic|Republic of)/.test(name) ? `the ${name}` : name;
}

/** Days between two instants, rounded up. */
const days = (from: Instant, to: Instant) => Math.ceil((to - from) / MS_DAY);

// ---------------------------------------------------------------------------
// Entering a country
// ---------------------------------------------------------------------------

export interface EntryAnswer {
  ok: boolean;
  /** The rule that applies, where SLATE has one. */
  rule?: EntryRule;
  /** Each thing missing, and how to get it, in the player's words. */
  missing: string[];
  /** What they may do once in: how many days, where the rule says. */
  stay?: string;
}

/**
 * Whether a person may enter a country on a day, for a short visit of some
 * days: their citizenship against the destination's rule, their passport
 * against the destination's validity rule, and the authorization or visa the
 * rule asks. Entering to stay or to work are other permissions, not this one.
 */
export function mayEnter(person: Person, destination: string, at: Instant, stayDays = 7): EntryAnswer {
  const dest = ENTRY[destination];
  const citizenship = isoOfCountry(person.citizenshipId);
  const country = COUNTRIES.get(destination.toLowerCase())?.name ?? destination;
  if (!dest || !citizenship) return { ok: false, missing: [`SLATE doesn’t have ${country}’s entry rules yet, so it can’t let a journey there through.`] };
  const rule = dest.citizens[citizenship];
  const theirs = theCountry(COUNTRIES.get(person.citizenshipId ?? '')?.name ?? citizenship);
  if (!rule) return { ok: false, missing: [`SLATE doesn’t have ${country}’s rule for citizens of ${theirs} yet.`] };
  const missing: string[] = [];
  const passport = passportOf(person, at);
  const leaving = at + stayDays * MS_DAY;
  if (!passport) {
    missing.push(`A passport in force: you have none${documentsOf(person).some((d) => d.kind === 'passport' && d.status === 'valid') ? ' that hasn’t run out' : ''}. Apply to ${theirs} for one.`);
  } else if (rule.status !== 'citizen') {
    const need = leaving + dest.passport.beyondDays * MS_DAY;
    if ((passport.expiresAt ?? Infinity) < need) {
      missing.push(dest.passport.beyondDays
        ? `A passport valid ${Math.round(dest.passport.beyondDays / 30)} months past the day you leave ${country}: yours runs out ${formatDate(passport.expiresAt!, 'UTC')}. Renew it first.`
        : `A passport valid for the whole stay: yours runs out ${formatDate(passport.expiresAt!, 'UTC')}. Renew it first.`);
    }
    if (dest.passport.issuedWithinYears && passport.issuedAt !== undefined && at - passport.issuedAt > dest.passport.issuedWithinYears * 365.25 * MS_DAY) {
      missing.push(`A passport issued within the last ${dest.passport.issuedWithinYears} years, as ${country} asks. Renew it first.`);
    }
  }
  if (rule.status === 'free' || rule.status === 'authorization') {
    if (rule.maxDays !== null && stayDays > rule.maxDays) missing.push(`A stay of ${rule.maxDays} days at most${rule.windowDays ? ` in any ${rule.windowDays}` : ''} as a visitor: ${stayDays} is longer. Longer stays need a visa or permission to stay.`);
  }
  if (rule.status === 'authorization' && rule.authorization) {
    const auth = dest.authorizations[rule.authorization]!;
    // A visa for the country answers it, and so does permission to work there held in force: SLATE takes an approved
    // O-1 or OPT as the visa its holder travels on, and doesn't model the consulate's stamp ($205, DS-160).
    const visaHeld = documentsOf(person).some((d) => (d.kind === 'visa' || (d.kind === 'permit' && d.bookingId === undefined)) && d.destination === destination && inForce(d, at) && (d.expiresAt ?? Infinity) >= leaving);
    if (auth.live && !visaHeld && !authorizationFor(person, destination, at, leaving)) {
      missing.push(`${auth.name}, which ${country} asks of citizens of ${theirs}: ${auth.fee > 0 ? formatFee(auth.fee, auth.currency) : 'no fee'}, applied for online, good for ${auth.validityYears} ${auth.validityYears === 1 ? 'year' : 'years'} or until the passport runs out.`);
    }
  }
  if (rule.status === 'visa') {
    const visa = documentsOf(person).find((d) => (d.kind === 'visa' || (d.kind === 'permit' && d.bookingId === undefined)) && d.destination === destination && inForce(d, at) && (d.expiresAt ?? Infinity) >= leaving);
    if (!visa) missing.push(`A visa for ${country}: ${VISAS[`${destination}<${isoOfCountry(person.citizenshipId)}`]?.name ?? rule.visa ?? 'a visitor visa'}, applied for on Papers.`);
  }
  const stay = rule.status === 'citizen' ? 'As a citizen, as long as you like.'
    : rule.status === 'free-movement' ? 'Free movement: to live and work as well as visit.'
      : rule.maxDays !== null ? `Up to ${rule.maxDays} days${rule.windowDays ? ` in any ${rule.windowDays}` : ''} as a visitor.` : undefined;
  return { ok: missing.length === 0, rule, missing, ...(stay ? { stay } : {}) };
}

// ---------------------------------------------------------------------------
// Crossing a border, and living across one
// ---------------------------------------------------------------------------

/**
 * Why a person can't go from one town to another, arriving on a day for some
 * days, where a border lies between them, or nothing: the destination's rule
 * for their citizenship, as `mayEnter` reads it. Within one country there's
 * nothing to ask.
 */
export function crossingRefusal(person: Person, fromCity: string, toCity: string, at: Instant, stayDays: number): string | undefined {
  const to = isoOfCity(toCity);
  if (!to || isoOfCity(fromCity) === to) return undefined;
  const answer = mayEnter(person, to, at, Math.max(1, Math.ceil(stayDays)));
  return answer.ok ? undefined : answer.missing.join(' ');
}

/**
 * Why a person can't make a home in a town's country, or nothing: a citizen
 * may, and so may someone with free movement there (the EU and EEA's, the
 * Common Travel Area's between Ireland and the UK), or someone holding a
 * visa for the country in force, as a student's F-1 lets them live in the
 * United States while they study. Anyone else would need permission to live
 * there, which SLATE doesn't grant yet.
 */
export function residenceRefusal(person: Person, cityId: string, at: Instant): string | undefined {
  const to = isoOfCity(cityId);
  const own = isoOfCountry(person.citizenshipId);
  if (!to || to === own) return undefined;
  const status = own ? ENTRY[to]?.citizens[own]?.status : undefined;
  if (status === 'citizen' || status === 'free-movement') return undefined;
  if (documentsOf(person).some((d) => d.kind === 'visa' && d.destination === to && inForce(d, at))) return undefined;
  // Permission to work there is permission to live there while it lasts, and an OPT filed in time keeps a student while it's decided.
  if (documentsOf(person).some((d) => d.kind === 'permit' && d.destination === to && d.bookingId === undefined && (inForce(d, at) || d.status === 'pending'))) return undefined;
  const there = theCountry(COUNTRIES.get(to.toLowerCase())?.name ?? to);
  return `Living in ${there} needs permission to live there, which you don’t hold, and SLATE doesn’t grant it yet.`;
}

/** An authorization in force for a destination, on the passport they'd travel on, through a day. */
export function authorizationFor(person: Person, destination: string, at: Instant, through = at): PersonDocument | undefined {
  const passport = passportOf(person, at);
  return documentsOf(person).find((d) => d.kind === 'authorization' && d.destination === destination && inForce(d, at)
    && (d.expiresAt ?? Infinity) >= through && d.passportId === passport?.id);
}

function formatFee(fee: number, currency: string): string {
  return formatMoney(Math.round(fee * 100), currency);
}

/**
 * How long an authorization takes to decide, from what each authority says:
 * most ESTAs, UK ETAs and Canadian eTAs are decided within minutes, taken
 * here as an hour; Korea's K-ETA and New Zealand's NZeTA are to be applied
 * for 72 hours ahead, taken as their time; Brazil's e-Visa averages about
 * five business days, taken as a week. Australia's ETA and eVisitor give no
 * figure: SLATE's estimate, a day. Every one is granted: an authorization
 * refused is a record SLATE doesn't keep.
 */
export const DECIDED_IN_HOURS: Readonly<Record<string, number>> = {
  ESTA: 1, ETA: 1, eTA: 1, 'K-ETA': 72, NZeTA: 72, 'e-Visa': 7 * 24, eVisitor: 24,
};

/** Validity that differs by the traveler's citizenship: Brazil's e-Visa, ten years for Americans, five for Canadians and Australians. */
const VALIDITY_BY_CITIZEN: Readonly<Record<string, Readonly<Record<string, number>>>> = { 'BR/e-Visa': { US: 10, CA: 5, AU: 5 } };

/** A charge paid with an authorization: New Zealand's International Visitor Conservation and Tourism Levy, NZD 100 since 1 October 2024. */
const PAID_BESIDE: Readonly<Record<string, { amount: number; currency: string; name: string }>> = { 'NZ/NZeTA': { amount: 100, currency: 'NZD', name: 'International Visitor Conservation And Tourism Levy' } };

/** Why an authorization can't be applied for now, or nothing. */
/** Why a visa can't be applied for, or nothing. */
export function visaRefusal(person: Person, destination: string, at: Instant): string | undefined {
  const rule = VISAS[`${destination}<${isoOfCountry(person.citizenshipId)}`];
  if (!rule) return 'Your citizenship doesn’t need a visa there, or SLATE doesn’t have that one.';
  if (!passportOf(person, at)) return 'A visa is issued on a passport, and you have none in force.';
  if (documentsOf(person).some((d) => d.kind === 'visa' && d.destination === destination && inForce(d, at))) return 'You hold one in force already.';
  if (documentsOf(person).some((d) => d.kind === 'visa' && d.destination === destination && d.status === 'pending')) return 'One is being decided.';
  return undefined;
}

export function authorizationRefusal(person: Person, destination: string, at: Instant): string | undefined {
  const dest = ENTRY[destination];
  const citizenship = isoOfCountry(person.citizenshipId);
  const rule = dest && citizenship ? dest.citizens[citizenship] : undefined;
  if (!dest || !rule) return 'SLATE doesn’t have that country’s rule for your citizenship.';
  if (rule.status !== 'authorization' || !rule.authorization) return 'Your citizenship doesn’t need one there.';
  const auth = dest.authorizations[rule.authorization]!;
  if (!auth.live) return `${auth.name} isn’t in operation yet.`;
  if (!passportOf(person, at)) return 'An authorization is issued on a passport, and you have none in force.';
  if (authorizationFor(person, destination, at)) return 'You hold one in force already.';
  if (documentsOf(person).some((d) => d.kind === 'authorization' && d.destination === destination && d.status === 'pending')) return 'One is being decided.';
  return undefined;
}

function inSave(sim: Simulation, amount: number, currency: string): Money {
  const cents = Math.round(amount * 100);
  const into = saveCurrency(sim.universe);
  return currency === into ? cents : exchange(cents, currency, into) ?? cents;
}

/** A document number: letters of its kind and a serial made from its record, eight digits. SLATE's own, not an issuer's format. */
export function numberFor(prefix: string, id: string): string {
  let h = 2166136261;
  for (const c of id) h = Math.imul(h ^ c.charCodeAt(0), 16777619) >>> 0;
  return `${prefix}${String(h % 1e8).padStart(8, '0')}`;
}

export function registerDocuments(sim: Simulation): void {
  sim.onCommand<{ destination: string }, { readyAt: Instant; fee: Money }>('documents.apply_authorization', (p, { sim: s }) => {
    const person = s.player;
    const destination = String(p.destination).toUpperCase();
    const no = authorizationRefusal(person, destination, s.now);
    if (no) throw new CommandError(no);
    const dest = ENTRY[destination]!;
    const rule = dest.citizens[isoOfCountry(person.citizenshipId)!]!;
    const key = rule.authorization!;
    const auth = dest.authorizations[key]!;
    const beside = PAID_BESIDE[`${destination}/${key}`];
    const fee = inSave(s, auth.fee, auth.currency) + (beside ? inSave(s, beside.amount, beside.currency) : 0);
    if (fee > 0 && !payFromBank(s, person, fee, `${auth.name}${beside ? `, and the ${beside.name}` : ''}`, 'documents')) throw new CommandError(`${formatMoney(fee, saveCurrency(s.universe))} is more than the bank can cover.`);
    const readyAt = s.now + (DECIDED_IN_HOURS[key] ?? 24) * MS_HOUR;
    const id = s.nextId('document');
    documentsOf(person).push({
      id, kind: 'authorization', issuer: destination, name: auth.name, number: numberFor(key.replace(/[^A-Z]/gi, '').slice(0, 3).toUpperCase(), id),
      status: 'pending', appliedAt: s.now, readyAt, destination, passportId: passportOf(person, s.now)!.id,
    });
    s.schedule({ at: readyAt, kind: DECIDED_KIND, label: `${auth.name} Decided`, category: 'system', priority: 20, payload: { personId: person.id } });
    return { readyAt, fee };
  });

  sim.onCommand<{ destination: string }, { readyAt: Instant; fee: Money }>('documents.apply_visa', (p, { sim: s }) => {
    const person = s.player;
    const destination = String(p.destination).toUpperCase();
    const no = visaRefusal(person, destination, s.now);
    if (no) throw new CommandError(no);
    const rule = VISAS[`${destination}<${isoOfCountry(person.citizenshipId)}`]!;
    const fee = inSave(s, rule.fee, rule.currency);
    if (!payFromBank(s, person, fee, rule.name, 'documents')) throw new CommandError(`${formatMoney(fee, saveCurrency(s.universe))} is more than the bank can cover.`);
    const readyAt = s.now + rule.days * MS_DAY;
    const id = s.nextId('document');
    documentsOf(person).push({
      id, kind: 'visa', issuer: destination, name: rule.name, number: numberFor('V', id),
      status: 'pending', appliedAt: s.now, readyAt, destination, passportId: passportOf(person, s.now)!.id,
    });
    s.schedule({ at: readyAt, kind: DECIDED_KIND, label: `${rule.name} Decided`, category: 'system', priority: 20, payload: { personId: person.id } });
    return { readyAt, fee };
  });

  sim.onSchedule(DECIDED_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (!person) return;
    for (const doc of documentsOf(person)) {
      if (doc.status !== 'pending' || (doc.readyAt ?? Infinity) > s.now) continue;
      issue(s, person, doc);
    }
  });

  sim.onCommand<{ expedite?: boolean }, { readyAt: Instant; fee: Money }>('documents.apply_passport', (p, { sim: s }) => {
    const person = s.player;
    const expedite = Boolean(p?.expedite);
    const no = passportRefusal(person, expedite);
    if (no) throw new CommandError(no);
    const rule = passportRuleFor(person)!;
    const age = (s.now - person.birthInstant) / (365.25 * MS_DAY);
    const terms = passportTerms(rule, age);
    const fee = inSave(s, terms.fee + (expedite ? rule.expedite!.extra : 0), rule.currency);
    if (!payFromBank(s, person, fee, `${rule.name}${expedite ? ', expedited' : ''}`, 'documents')) throw new CommandError(`${formatMoney(fee, saveCurrency(s.universe))} is more than the bank can cover.`);
    const days = expedite ? rule.expedite!.days : rule.days;
    // Handed over the same day where the office does it: a few hours, SLATE's estimate.
    const readyAt = s.now + (days > 0 ? days * MS_DAY : 3 * MS_HOUR);
    const id = s.nextId('document');
    documentsOf(person).push({ id, kind: 'passport', issuer: isoOfCountry(person.citizenshipId)!, name: rule.name, number: numberFor(isoOfCountry(person.citizenshipId)!, id), status: 'pending', appliedAt: s.now, readyAt });
    s.schedule({ at: readyAt, kind: DECIDED_KIND, label: `${rule.name} Ready`, category: 'system', priority: 20, payload: { personId: person.id } });
    return { readyAt, fee };
  });

  sim.onCommand<{ documentId: string }, { lost: boolean }>('documents.report_lost', (p, { sim: s }) => {
    const doc = documentsOf(s.player).find((d) => d.id === p.documentId);
    if (!doc || doc.status !== 'valid') throw new CommandError('That isn’t a document you hold.');
    doc.status = 'lost';
    // A passport reported lost is canceled, and what was issued on it goes with it.
    if (doc.kind === 'passport') for (const d of documentsOf(s.player)) if (d.passportId === doc.id && d.status === 'valid') d.status = 'cancelled';
    return { lost: true };
  });
}

export const DECIDED_KIND = 'documents.decided';

// ---------------------------------------------------------------------------
// Passports
// ---------------------------------------------------------------------------

/** The passport office for a citizenship, where SLATE has it. */
export function passportRuleFor(person: Person): PassportRule | undefined {
  const iso = isoOfCountry(person.citizenshipId);
  return iso ? PASSPORTS[iso] : undefined;
}

/** A passport's term and fee for a person's age: ten years, or less for a young adult where the office gives less. */
export function passportTerms(rule: PassportRule, age: number): { years: number; fee: number } {
  if (rule.young && age < rule.young.under) return { years: rule.young.years, fee: rule.young.fee ?? rule.fee };
  return { years: rule.validityYears, fee: rule.fee };
}

/** Why a passport can't be applied for now, or nothing. */
export function passportRefusal(person: Person, expedite = false): string | undefined {
  const rule = passportRuleFor(person);
  if (!rule) return 'SLATE doesn’t have your country’s passport office yet.';
  if (documentsOf(person).some((d) => d.kind === 'passport' && d.status === 'pending')) return 'An application is in already.';
  if (expedite && !rule.expedite) return `${rule.issuer} doesn’t sell a faster service.`;
  if (expedite && rule.expedite?.renewalOnly && !documentsOf(person).some((d) => d.kind === 'passport' && d.issuer === isoOfCountry(person.citizenshipId))) return `${rule.issuer}’s faster service is for renewals only.`;
  return undefined;
}

/** A passport issued now to a person, to its term for their age; one it replaces is canceled, and what was issued on that one goes with it. */
function issuePassport(sim: Simulation, person: Person, doc: PersonDocument, age: number): void {
  const rule = passportRuleFor(person)!;
  doc.status = 'valid';
  doc.issuedAt = sim.now;
  doc.expiresAt = addYears(sim.now, passportTerms(rule, age).years);
  for (const old of documentsOf(person)) {
    if (old === doc || old.kind !== 'passport' || old.status !== 'valid' || old.issuer !== doc.issuer) continue;
    old.status = 'cancelled';
    for (const d of documentsOf(person)) if (d.passportId === old.id && d.kind === 'authorization' && d.status === 'valid') d.status = 'cancelled';
  }
}

// ---------------------------------------------------------------------------
// What a life begins with
// ---------------------------------------------------------------------------

/**
 * The papers a life begins with, at twenty-four and arriving at Yale:
 * - a citizen of another country studying in the United States holds their
 *   passport and an F-1 student visa to the end of the program, with the
 *   60 days' grace after it (8 CFR 214.2(f)(5)(iv); a 30-day rule published
 *   2026-07-17 was stayed by the District of Massachusetts on 2026-09-14);
 * - a US citizen holds a passport at the share of passports in circulation
 *   to residents, 183,170,240 in FY2025 against 341,784,857 people (State's
 *   count, the Census's Vintage 2025): 0.536, an upper bound, State counting
 *   documents, not holders;
 * - a US citizen born in a state holds its driving license at the share
 *   FHWA counts at twenty to twenty-four, 80.9% (Highway Statistics DL-20,
 *   2024). Other countries' shares weren't researched: SLATE gives no
 *   license where it doesn't know how many hold one, and says so in
 *   docs/WORLD.md.
 * A passport's issue is drawn across its term, and a license's from the
 * holder's eighteenth birthday, renewed to its term.
 */
export const STARTING = {
  usPassportShare: 183_170_240 / 341_784_857,
  usLicenseShare: 0.809,
  graceDays: 60,
  source: 'travel.state.gov passport statistics FY2025; census.gov Vintage 2025; FHWA Highway Statistics DL-20 (2024); 8 CFR 214.2(f)(5)(iv)',
} as const;

export function startingDocuments(sim: Simulation, person: Person): void {
  if (person.documents) return;
  const docs = documentsOf(person);
  const rng = sim.rng('documents.start', person.id);
  const iso = isoOfCountry(person.citizenshipId);
  const rule = passportRuleFor(person);
  const age = (sim.now - person.birthInstant) / (365.25 * MS_DAY);
  const passport = (years: number): PersonDocument => {
    const id = sim.nextId('document');
    const issuedAt = sim.now - rng.next() * Math.min(years, age - 16) * 365.25 * MS_DAY;
    return { id, kind: 'passport', issuer: iso ?? '', name: rule?.name ?? 'Passport', number: numberFor(iso ?? 'P', id), status: 'valid', issuedAt, expiresAt: addYears(issuedAt, years) };
  };
  const years = rule ? passportTerms(rule, age).years : 10;
  if (iso && iso !== 'US') {
    // Studying in the US: the passport, and the student visa to the program's end and its grace.
    const own = passport(years);
    docs.push(own);
    if (person.school) {
      // At noon UTC, so the day it names is the same day in any US zone.
      const ends = Date.UTC(classOfYear(person), 4, 31, 12) + STARTING.graceDays * MS_DAY;
      const id = sim.nextId('document');
      docs.push({ id, kind: 'visa', issuer: 'US', name: 'F-1 Student Visa', number: numberFor('F1', id), status: 'valid', issuedAt: sim.now - 30 * MS_DAY, expiresAt: ends, destination: 'US', passportId: own.id });
    }
  } else if (iso === 'US' && rng.next() < STARTING.usPassportShare) {
    docs.push(passport(years));
  }
  // A US-born citizen's license from their birth state, renewed to its term.
  const born = CITIES.get(person.homeRegionId);
  if (iso === 'US' && born && isoOfCountry(born.countryId) === 'US' && rng.next() < STARTING.usLicenseShare) {
    const jurisdiction = born.parentId.toLowerCase();
    const term = LICENSES[jurisdiction]?.validityYears ?? 8;
    let issuedAt = addYears(person.birthInstant, 18);
    while (addYears(issuedAt, term) <= sim.now) issuedAt = addYears(issuedAt, term);
    const id = sim.nextId('document');
    docs.push({ id, kind: 'license', issuer: jurisdiction, name: LICENSES[jurisdiction]?.name ?? 'Driver License', number: numberFor('D', id), status: 'valid', issuedAt, expiresAt: addYears(issuedAt, term) });
  }
}

/** The year a person's class graduates, in May. */
function classOfYear(person: Person): number {
  return person.school?.classOf ?? new Date(person.birthInstant).getUTCFullYear() + 27;
}

/** A pending document issued: in force from now, to its term. */
function issue(sim: Simulation, person: Person, doc: PersonDocument): void {
  if (doc.kind === 'passport') {
    issuePassport(sim, person, doc, (sim.now - person.birthInstant) / (365.25 * MS_DAY));
    if (person.id === sim.universe.playerId) sim.notify({ category: 'personal', title: `${doc.name} Issued`, body: `${doc.name}, ${doc.number}, good until ${formatDate(doc.expiresAt!, sim.zone)}. An authorization issued on the one it replaces ended with it.`, importance: 60, route: '/workspace/papers' });
    return;
  }
  doc.status = 'valid';
  doc.issuedAt = sim.now;
  if (doc.kind === 'authorization' && doc.destination) {
    const dest = ENTRY[doc.destination]!;
    const key = Object.entries(dest.authorizations).find(([, a]) => a.name === doc.name)?.[0] ?? '';
    const auth: Authorization | undefined = dest.authorizations[key];
    const years = VALIDITY_BY_CITIZEN[`${doc.destination}/${key}`]?.[isoOfCountry(person.citizenshipId) ?? ''] ?? auth?.validityYears ?? 1;
    const passport = documentsOf(person).find((d) => d.id === doc.passportId);
    doc.expiresAt = Math.min(addYears(sim.now, years), passport?.expiresAt ?? Infinity);
  }
  // A visitor visa, for its term and no longer than the passport it's in (from 2026-09-29).
  if (doc.kind === 'visa' && doc.destination && doc.bookingId === undefined) {
    const rule = VISAS[`${doc.destination}<${isoOfCountry(person.citizenshipId)}`];
    const passport = documentsOf(person).find((d) => d.id === doc.passportId);
    if (rule) doc.expiresAt = Math.min(rule.years ? addYears(sim.now, rule.years) : sim.now + (rule.validDays ?? 180) * MS_DAY, passport?.expiresAt ?? Infinity);
  }
  if (person.id === sim.universe.playerId) sim.notify({ category: 'personal', title: `${doc.name} Issued`, body: `${doc.name}, ${doc.number}${doc.expiresAt ? `, good until ${formatDate(doc.expiresAt, sim.zone)}` : ''}.`, importance: 60, route: '/workspace/papers' });
}

// ---------------------------------------------------------------------------
// Driving
// ---------------------------------------------------------------------------

/** The licensing jurisdiction a town is in, where SLATE has its rules: a US state, a Canadian province or an Australian state, else the country. */
export function licensingOf(cityId: string): string | undefined {
  const city = CITIES.get(cityId);
  if (!city) return undefined;
  const iso = isoOfCountry(city.countryId)?.toLowerCase();
  const region = city.parentId.toLowerCase();
  // A region is SLATE's GeoNames first-level code: Canada's 02 is British Columbia and 08 Ontario, Australia's 02 New South Wales, Mexico's 09 the capital.
  const byRegion: Record<string, string> = { 'uk-nir': 'gb-nir', 'uk-eng': 'gb', 'uk-sct': 'gb', 'uk-wls': 'gb', 'ca-02': 'ca-bc', 'ca-08': 'ca-on', 'au-02': 'au-nsw', 'mx-09': 'mx-cmx' };
  const id = byRegion[region] ?? (iso === 'us' ? region : iso);
  return id && LICENSES[id] ? id : undefined;
}

/** A license's language, by its issuer's country: what a visitor rule reads. */
const LICENSE_LANGUAGE: Readonly<Record<string, string>> = {
  us: 'en', gb: 'en', ca: 'en', ie: 'en', au: 'en', nz: 'en', is: 'is', de: 'de', fr: 'fr', es: 'es', jp: 'ja', kr: 'ko', mx: 'es', br: 'pt', lv: 'lv',
};
const NON_LATIN = new Set(['ja', 'ko']);
const EU_EEA = new Set(['ie', 'is', 'de', 'fr', 'es', 'lv']);

/** The license they'd drive on, in force: one that lets them drive alone before a learner's. */
export function licenseOf(person: Person, at: Instant): PersonDocument | undefined {
  return documentsOf(person).filter((d) => d.kind === 'license' && inForce(d, at)).sort((a, b) => Number(b.alone !== false) - Number(a.alone !== false))[0];
}

/**
 * Whether a person may drive a car where they are, and if not, why and what
 * would let them: a license from this jurisdiction; or, as a visitor, one
 * from elsewhere within the days the jurisdiction allows, with an
 * International Driving Permit where the license's language asks one; a
 * license from another US state, Canadian province or Australian state, and
 * an EU or EEA license within the EU and EEA, recognized as the law
 * recognises them.
 */
export function mayDrive(person: Person, cityId: string, at: Instant, arrivedAt = at): { ok: boolean; why?: string } {
  const here = licensingOf(cityId);
  const place = CITIES.get(cityId)?.name ?? 'here';
  if (!here) return { ok: false, why: `SLATE doesn’t have the driving rules for ${place} yet.` };
  const license = licenseOf(person, at);
  if (!license) return { ok: false, why: `You don’t hold a driving license in force. ${LICENSES[here]!.authority} issues ${LICENSES[here]!.name}.` };
  if (license.alone === false) return { ok: false, why: `${license.name} lets you drive only with a licensed driver beside you.` };
  if (license.issuer === here) return { ok: true };
  const from = license.issuer.split('-')[0]!;
  const hereCountry = here.split('-')[0]!;
  // Within one country's states and provinces, and within the EU and EEA, a license is recognized.
  if (from === hereCountry || (EU_EEA.has(from) && EU_EEA.has(hereCountry))) return { ok: true };
  const rule: LicenseRule = LICENSES[here]!;
  if (!rule.visitor.confirmed) return { ok: false, why: `SLATE couldn’t confirm ${place}’s rule for a license from elsewhere, so it doesn’t let you drive on one there.` };
  if (rule.visitor.days !== null && days(arrivedAt, at) > rule.visitor.days) return { ok: false, why: `A visitor may drive on a license from elsewhere for ${rule.visitor.days} days from arriving; past that, ${rule.authority} asks for its own license.` };
  const language = LICENSE_LANGUAGE[from] ?? '';
  const languages = rule.visitor.languages;
  const needsPermit = languages === 'always' ? true : languages === 'any' ? false : languages === 'latin' ? NON_LATIN.has(language) : !languages.includes(language);
  if (needsPermit && !documentsOf(person).some((d) => d.kind === 'idp' && inForce(d, at) && d.issuer === license.issuer.split('-')[0])) {
    return { ok: false, why: `${place} asks for an International Driving Permit beside a license like yours. It’s issued in the country that issued your license, before you travel${LICENSES[license.issuer]?.idp ? `: ${LICENSES[license.issuer]!.idp!.issuer}` : ''}.` };
  }
  return { ok: true };
}
