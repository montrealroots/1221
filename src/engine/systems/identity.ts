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
import { addYears, documentsOf, inForce, isoOfCity, licensingOf, numberFor, type PersonDocument } from './documents';
import type { Journey } from './journey';

const usd = (sim: Simulation, dollars: number): Money => { const c = Math.round(dollars * 100); const cur = saveCurrency(sim.universe); return cur === 'USD' ? c : exchange(c, 'USD', cur) ?? c; };
const usIssued = (d: PersonDocument) => d.issuer.startsWith('us-');

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

/** The state's ID card where they live. */
export function idCardHere(person: Person): { jurisdiction: string; card: (typeof ID_CARDS)[string] } | undefined {
  const j = licensingOf(person.home?.cityId ?? person.currentLocationId);
  const card = j ? ID_CARDS[j] : undefined;
  return j && card ? { jurisdiction: j, card } : undefined;
}

export function idCardRefusal(person: Person, at: Instant): string | undefined {
  const here = idCardHere(person);
  if (!here) return 'SLATE issues state ID cards in New York, Connecticut and California.';
  if (documentsOf(person).some((d) => d.kind === 'license' && d.issuer === here.jurisdiction && inForce(d, at))) return 'You hold this state’s license. It serves as your ID.';
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
  sim.onCommand<Record<string, never>, { expiresAt: Instant; fee: Money }>('documents.apply_idcard', (_p, { sim: s }) => {
    const person = s.player;
    const no = idCardRefusal(person, s.now);
    if (no) throw new CommandError(no);
    const { jurisdiction, card } = idCardHere(person)!;
    const fee = usd(s, card.fee);
    if (!payFromBank(s, person, fee, card.name, 'documents')) throw new CommandError(`${formatMoney(fee, saveCurrency(s.universe))} is more than the bank can cover.`);
    const id = s.nextId('document');
    const expiresAt = addYears(s.now, card.years);
    documentsOf(person).push({ id, kind: 'idcard', issuer: jurisdiction, name: card.name, number: numberFor('ID', id), status: 'valid', issuedAt: s.now, expiresAt, realId: true });
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
