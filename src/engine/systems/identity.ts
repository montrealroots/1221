/**
 * SLATE — proving who one is at an American airport, and the state ID card
 * (docs/WORLD.md, stage 1c), from 2026-09-30. Figures in `content/identity.ts`.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { ID_CARDS, REAL_ID } from '../content/identity';
import { payFromBank, owe } from './household';
import { addYears, citizenOf, documentsOf, inForce, isoOfCity, licensingOf, numberFor, type PersonDocument } from './documents';
import type { Journey } from './journey';

const usd = (sim: Simulation, dollars: number): Money => { const c = Math.round(dollars * 100); const cur = saveCurrency(sim.universe); return cur === 'USD' ? c : exchange(c, 'USD', cur) ?? c; };
const usIssued = (d: PersonDocument) => d.issuer.startsWith('us-');
const inMoney = (sim: Simulation, units: number, currency: string): Money => { const c = Math.round(units * 100); const cur = saveCurrency(sim.universe); return cur === currency ? c : exchange(c, currency, cur) ?? c; };

/** What the TSA takes at its checkpoint: a passport in force, from anywhere, or an American REAL ID license or ID card. */
export function tsaAccepts(person: Person, at: Instant): PersonDocument | undefined {
  return documentsOf(person).find((d) => inForce(d, at) && (d.kind === 'passport' || ((d.kind === 'license' || d.kind === 'idcard') && usIssued(d) && d.realId === true)));
}

/** Whether a journey takes an airline's flight within America, through a TSA checkpoint: one's own plane, a charter or a rented one (a `fly` leg) don't. */
export function throughTsa(j: Pick<Journey, 'legs' | 'fromCity' | 'toCity'>): boolean {
  return isoOfCity(j.fromCity) === 'US' && isoOfCity(j.toCity) === 'US' && j.legs.some((l) => l.mode === 'flight');
}

/** At the checkpoint: without a passport or a REAL ID, ConfirmID's $45, good for ten days; true where it was charged. */
export function atTheCheckpoint(sim: Simulation, person: Person, j: Journey): boolean {
  if (!throughTsa(j) || sim.now < REAL_ID.enforcedFrom || tsaAccepts(person, sim.now)) return false;
  if ((person.confirmIdUntil ?? 0) > sim.now) return false;
  const fee = usd(sim, REAL_ID.confirmIdUsd);
  if (!payFromBank(sim, person, fee, 'TSA ConfirmID, no REAL ID or passport', 'travel')) owe(sim, person, fee, 'TSA ConfirmID', 'travel');
  person.confirmIdUntil = sim.now + REAL_ID.confirmIdDays * MS_DAY;
  if (person.id === sim.universe.playerId) sim.notify({ category: 'personal', title: 'TSA ConfirmID', body: `You had no REAL ID or passport at the checkpoint: ${formatMoney(fee, saveCurrency(sim.universe))} for ConfirmID, good until ${formatDate(person.confirmIdUntil, sim.zone)}. A REAL ID license or ID card, or a passport, ends it.`, importance: 60, route: '/workspace/papers' });
  return true;
}

/**
 * What an airline asks at check-in outside America, from later on 2026-09-30
 * (`research-travel4.json`), or nothing where it's satisfied or not kept:
 * - within Canada, one government photo ID: a passport, or a Canadian license
 *   or provincial photo card (travel.gc.ca);
 * - within Mexico, a passport, a driver's license or the INE (ASA, reported);
 * - within Britain, a passport or a photo driving license (BA and easyJet);
 * - between Ireland and Britain, a passport or an Irish passport card, Aer
 *   Lingus's rule since 25 February 2026, and Ryanair's documents.
 * Without it they aren't boarded, and the fare is lost.
 */
export function boardingIdRefusal(person: Person, j: Pick<Journey, 'legs' | 'fromCity' | 'toCity'>, at: Instant): string | undefined {
  if (!j.legs.some((l) => l.mode === 'flight')) return undefined;
  const from = isoOfCity(j.fromCity);
  const to = isoOfCity(j.toCity);
  const docs = documentsOf(person).filter((d) => inForce(d, at));
  const passport = docs.some((d) => d.kind === 'passport');
  const issued = (kinds: readonly string[], prefix: string) => docs.some((d) => kinds.includes(d.kind) && d.issuer.startsWith(prefix));
  if (from === 'CA' && to === 'CA' && !passport && !issued(['license', 'idcard'], 'ca-')) return 'A flight within Canada asks a government photo ID: a passport, a license or a provincial photo card.';
  if (from === 'MX' && to === 'MX' && !passport && !issued(['license', 'idcard'], 'mx')) return 'A flight within Mexico asks a passport, a driver’s license or the INE.';
  if (from === 'GB' && to === 'GB' && !passport && !issued(['license'], 'gb')) return 'A flight within Britain asks a passport or a photo driving license.';
  if (((from === 'IE' && to === 'GB') || (from === 'GB' && to === 'IE')) && !passport && !issued(['idcard'], 'ie')) return 'Between Ireland and Britain the airlines ask a passport or an Irish passport card.';
  return undefined;
}

/** The state's ID card where they live. */
export function idCardHere(person: Person): { jurisdiction: string; card: (typeof ID_CARDS)[string] } | undefined {
  const j = licensingOf(person.home?.cityId ?? person.currentLocationId);
  const card = j ? ID_CARDS[j] : undefined;
  return j && card ? { jurisdiction: j, card } : undefined;
}

export function idCardRefusal(person: Person, at: Instant): string | undefined {
  const here = idCardHere(person);
  if (!here) return 'SLATE issues ID cards in New York, Connecticut, California, Ontario, British Columbia, Mexico City and Ireland.';
  const card = here.card;
  if (card.citizens && !citizenOf(person, card.citizens)) return `The ${card.name} is for a citizen.`;
  if (card.age && (at - person.birthInstant) / (365.25 * MS_DAY) < card.age) return `The ${card.name} is issued from ${card.age}.`;
  if (card.passportBook && !documentsOf(person).some((d) => d.kind === 'passport' && d.issuer === 'IE' && inForce(d, at))) return 'The passport card is issued to a holder of an Irish passport book in force.';
  if (!card.citizens && documentsOf(person).some((d) => d.kind === 'license' && d.issuer === here.jurisdiction && inForce(d, at))) return 'You hold a license here. It serves as your ID.';
  if (documentsOf(person).some((d) => d.kind === 'idcard' && d.issuer === here.jurisdiction && inForce(d, at))) return 'You hold one in force.';
  return undefined;
}

/** A Connecticut license made REAL ID before it renews, for the duplicate's fee. */
export function realIdRefusal(person: Person, at: Instant): string | undefined {
  const license = documentsOf(person).find((d) => d.kind === 'license' && d.issuer === 'us-ct' && inForce(d, at));
  if (!license) return 'Connecticut upgrades its own license before renewal; New York and California make it REAL ID at the renewal.';
  if (license.realId) return 'It’s REAL ID already.';
  return undefined;
}

export function registerIdentity(sim: Simulation): void {
  sim.onCommand<Record<string, never>, { expiresAt?: Instant; fee: Money }>('documents.apply_idcard', (_p, { sim: s }) => {
    const person = s.player;
    const no = idCardRefusal(person, s.now);
    if (no) throw new CommandError(no);
    const { jurisdiction, card } = idCardHere(person)!;
    const fee = card.currency ? inMoney(s, card.fee, card.currency) : usd(s, card.fee);
    if (fee > 0 && !payFromBank(s, person, fee, card.name, 'documents')) throw new CommandError(`${formatMoney(fee, saveCurrency(s.universe))} is more than the bank can cover.`);
    const id = s.nextId('document');
    // Ireland's passport card runs five years or to the book's expiry; the Ontario, BC and INE cards' terms weren't read.
    const book = card.passportBook ? documentsOf(person).find((d) => d.kind === 'passport' && d.issuer === 'IE' && inForce(d, s.now)) : undefined;
    const expiresAt = card.years ? Math.min(addYears(s.now, card.years), book?.expiresAt ?? Infinity) : undefined;
    documentsOf(person).push({ id, kind: 'idcard', issuer: jurisdiction, name: card.name, number: numberFor('ID', id), status: 'valid', issuedAt: s.now, ...(expiresAt ? { expiresAt } : {}), ...(jurisdiction.startsWith('us-') ? { realId: true } : {}) });
    return { expiresAt, fee };
  });

  sim.onCommand<Record<string, never>, { fee: Money }>('documents.real_id', (_p, { sim: s }) => {
    const person = s.player;
    const no = realIdRefusal(person, s.now);
    if (no) throw new CommandError(no);
    const fee = usd(s, REAL_ID.ctUpgradeUsd);
    if (!payFromBank(s, person, fee, 'A REAL ID license, the duplicate’s fee', 'documents')) throw new CommandError(`${formatMoney(fee, saveCurrency(s.universe))} is more than the bank can cover.`);
    documentsOf(person).find((d) => d.kind === 'license' && d.issuer === 'us-ct' && inForce(d, s.now))!.realId = true;
    return { fee };
  });
}
