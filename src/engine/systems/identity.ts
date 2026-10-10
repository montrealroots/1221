/**
 * SLATE — the state ID card, and the REAL ID it can carry (docs/WORLD.md,
 * stage 1c), from 2026-09-30. Figures in `content/identity.ts`.
 *
 * Until the scope reset of 2026-10-09 it was proving who one is on a journey
 * too: the TSA's checkpoint and its ConfirmID fee, an airline's ID at
 * check-in, a hotel desk's. The journeys went, and those with them.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { ID_CARDS } from '../content/identity';
import { ID_CARD_REPLACEMENT, LICENSE_REPLACEMENT } from '../content/replacements';
import { payFromBank } from './spending';
import { addYears, citizenOf, documentsOf, inForce, licensingOf, numberFor, type PersonDocument } from './documents';

const usd = (sim: Simulation, dollars: number): Money => { const c = Math.round(dollars * 100); const cur = saveCurrency(sim.universe); return cur === 'USD' ? c : exchange(c, 'USD', cur) ?? c; };
const inMoney = (sim: Simulation, units: number, currency: string): Money => { const c = Math.round(units * 100); const cur = saveCurrency(sim.universe); return cur === currency ? c : exchange(c, currency, cur) ?? c; };

// What the TSA takes at its checkpoint (`tsaAccepts`: a passport in force, or an American REAL ID license or ID card)
// was read by an ID card's look alone until 2026-10-10, which said the airport would read it while nothing flies; the
// sentence and the rule went together.

/** The state's ID card where they live. */
export function idCardHere(person: Person): { jurisdiction: string; card: (typeof ID_CARDS)[string] } | undefined {
  const j = licensingOf(person.currentLocationId);
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
  // One on its way, applied for or replacing a lost one (from 2026-10-06; until then a second was issued and charged for,
  // and they held two when the first came).
  if (documentsOf(person).some((d) => d.kind === 'idcard' && d.issuer === here.jurisdiction && d.status === 'pending')) return 'One is on its way.';
  return undefined;
}

/** A Connecticut license made REAL ID before it renews, for the duplicate's fee. */
// Making a Connecticut license REAL ID (`documents.real_id`) went in the connected world of 2026-10-09: REAL ID is
// what the TSA and a federal building ask, and nothing in SLATE flies or goes into one since the scope reset. A
// license that is REAL ID still says so on its record (`realId`).

/**
 * Why a lost license can't be replaced, or nothing (from 2026-10-09; `LICENSE_REPLACEMENT`, each issuer's page): it
 * must be reported lost, and is replaced by its issuer for somebody living there, as an ID card is, or by mail from
 * elsewhere where the issuer sends one out of state (`byMail`, from 2026-10-10: until then a New Yorker studying in
 * New Haven couldn't replace their license at all). It's an identity document here; nothing in SLATE is driven.
 */
export function licenseReplaceRefusal(person: Person, documentId: string): string | undefined {
  const doc = documentsOf(person).find((d) => d.id === documentId);
  if (!doc || doc.kind !== 'license') return 'That isn’t a license of yours.';
  if (doc.status !== 'lost') return 'It isn’t lost: report it lost first.';
  if (!LICENSE_REPLACEMENT[doc.issuer]) return 'SLATE doesn’t have what its issuer charges to replace it.';
  if (licensingOf(person.currentLocationId) !== doc.issuer && !LICENSE_REPLACEMENT[doc.issuer]!.byMail) return 'Its issuer replaces it for somebody living there, and SLATE found no way it sends one out of state.';
  return undefined;
}

/** A license's replacement fee: the issuer's, nothing in New York for one stolen with the police's report filed (MV-78B). */
export function licenseReplaceFee(sim: Simulation, doc: PersonDocument): Money {
  if (doc.issuer === 'us-ny' && doc.stolen && doc.policeReport !== undefined) return 0;
  const rule = LICENSE_REPLACEMENT[doc.issuer]!;
  return inMoney(sim, rule.fee, rule.currency);
}

export const ID_CARD_KIND = 'documents.idcard_arrives';

/** Why a lost ID card can't be replaced, or nothing: it must be reported lost, and replaced by its issuer for someone living there. */
export function idReplaceRefusal(person: Person, documentId: string): string | undefined {
  const doc = documentsOf(person).find((d) => d.id === documentId);
  if (!doc || doc.kind !== 'idcard') return 'That isn’t an ID card of yours.';
  if (doc.status !== 'lost') return 'It isn’t lost: report it lost first.';
  if (!ID_CARD_REPLACEMENT[doc.issuer]) return 'SLATE doesn’t have what its issuer charges to replace it.';
  if (idCardHere(person)?.jurisdiction !== doc.issuer) return 'It’s replaced where it was issued, for someone living there.';
  return undefined;
}

/** A replacement's fee for them, in the save's money: the reduced one from its age where there is one. */
export function idReplaceFee(sim: Simulation, person: Person, issuer: string): Money {
  const rule = ID_CARD_REPLACEMENT[issuer]!;
  const age = (sim.now - person.birthInstant) / (365.25 * MS_DAY);
  const fee = rule.seniorFee !== undefined && age >= (rule.seniorFrom ?? Infinity) ? rule.seniorFee : rule.fee;
  return inMoney(sim, fee, rule.currency);
}

export function registerIdentity(sim: Simulation): void {
  sim.onCommand<{ documentId: string }, { readyAt: Instant; fee: Money }>('documents.replace_idcard', (p, { sim: s }) => {
    const person = s.player;
    const no = idReplaceRefusal(person, String(p?.documentId));
    if (no) throw new CommandError(no);
    const lost = documentsOf(person).find((d) => d.id === p.documentId)!;
    const rule = ID_CARD_REPLACEMENT[lost.issuer]!;
    const fee = idReplaceFee(s, person, lost.issuer);
    if (fee > 0 && !payFromBank(s, person, fee, `${lost.name}, replaced`, 'documents')) throw new CommandError(`${formatMoney(fee, saveCurrency(s.universe))} is more than the bank can cover.`);
    lost.status = 'cancelled';
    const id = s.nextId('document');
    const readyAt = s.now + rule.days * MS_DAY;
    // A new card, not the lost one's report: its stolen mark and police report stay with the old (from 2026-10-10, as the license's do).
    documentsOf(person).push({ ...lost, id, number: numberFor('ID', id), status: 'pending', appliedAt: s.now, readyAt, stolen: undefined, policeReport: undefined } as PersonDocument);
    s.schedule({ at: readyAt, kind: ID_CARD_KIND, label: 'The ID Card Comes', category: 'personal', priority: 30, payload: { personId: person.id, documentId: id } });
    return { readyAt, fee };
  });
  sim.onSchedule(ID_CARD_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const doc = person ? documentsOf(person).find((d) => d.id === item.payload.documentId) : undefined;
    if (!doc || doc.status !== 'pending') return;
    // The post held while away kept it until the hold's end (`systems/away.ts`), until the time away went on 2026-10-09.
    doc.status = 'valid';
    doc.issuedAt = item.at;
  });

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

  sim.onCommand<{ documentId: string }, { readyAt: Instant; fee: Money }>('documents.replace_license', (p, { sim: s }) => {
    const person = s.player;
    const no = licenseReplaceRefusal(person, String(p?.documentId));
    if (no) throw new CommandError(no);
    const lost = documentsOf(person).find((d) => d.id === p.documentId)!;
    const rule = LICENSE_REPLACEMENT[lost.issuer]!;
    const fee = licenseReplaceFee(s, lost);
    if (fee > 0 && !payFromBank(s, person, fee, `${lost.name}, replaced`, 'documents')) throw new CommandError(`${formatMoney(fee, saveCurrency(s.universe))} is more than the bank can cover.`);
    lost.status = 'cancelled';
    const id = s.nextId('document');
    const readyAt = s.now + rule.days * MS_DAY;
    // The same license, a new card: its term and its REAL ID kept, its number new.
    documentsOf(person).push({ ...lost, id, number: numberFor('D', id), status: 'pending', appliedAt: s.now, readyAt, stolen: undefined, policeReport: undefined } as PersonDocument);
    s.schedule({ at: readyAt, kind: ID_CARD_KIND, label: 'The License Comes', category: 'personal', priority: 30, payload: { personId: person.id, documentId: id } });
    return { readyAt, fee };
  });
}
