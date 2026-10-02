/**
 * SLATE — the boating and flying certificates a life holds, as papers
 * (the master plan's §49c–d, from 2026-10-02): each state's boating
 * certificate (`systems/boats.ts`), the FAA's private pilot certificate and a
 * license abroad (`systems/aviation.ts`), with when each was had and, for a
 * pilot, when the medical it flies on runs out. They're read where they're
 * kept; this lists them on Papers beside the driving license.
 */

import type { Person } from '../domain/model';
import type { Instant } from '../core/time';
import { BOAT_RULES, type BoatState } from '../content/boats';

export interface Credential { name: string; issuer: string; issuedAt?: Instant; medicalUntil?: Instant }

const STATE_NAME: Readonly<Record<BoatState, string>> = { 'US-NY': 'New York', 'US-CT': 'Connecticut', 'US-CA': 'California', 'CA-ON': 'Canada', GB: 'Britain', IE: 'Ireland' };

export function credentialsOf(person: Person): Credential[] {
  const out: Credential[] = [];
  for (const state of person.boatCertificates ?? []) {
    const c = BOAT_RULES[state as BoatState]?.certificate;
    if (c) out.push({ name: c.label, issuer: STATE_NAME[state] });
  }
  if (person.pilot) out.push({ name: 'Private Pilot Certificate', issuer: 'FAA', issuedAt: person.pilot.issuedAt, ...(person.pilot.medicalUntil !== undefined ? { medicalUntil: person.pilot.medicalUntil } : {}) });
  for (const l of person.pilotLicences ?? []) out.push({ name: 'Private Pilot License', issuer: l.authority, issuedAt: l.issuedAt, ...(l.medicalUntil !== undefined ? { medicalUntil: l.medicalUntil } : {}) });
  return out;
}
