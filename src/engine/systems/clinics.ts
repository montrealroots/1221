/**
 * SLATE — where care happens (Stage 9 of `docs/BACKLOG.md`, from
 * 2026-10-01; the providers in `content/clinics.ts`). A doctor's visit is at
 * their own doctor where they've chosen one in the town they're in, or the
 * town's first practice; urgent care at an urgent care center or a walk-in;
 * an emergency and a stay at a hospital's emergency department. Uninsured,
 * an urgent visit at a provider that publishes its self-pay price is that
 * price; elsewhere SLATE's average stands (`CARE.price`).
 */

import type { Person } from '../domain/model';
import type { Money } from '../core/money';
import { exchange } from '../content/currency';
import { CLINICS, SELF_PAY, type Clinic, type ClinicKind } from '../content/clinics';

/** The kinds that give each care, the likeliest first. */
const SERVES: Readonly<Record<'visit' | 'urgent' | 'emergency' | 'stay', readonly ClinicKind[]>> = {
  visit: ['primary-care', 'public-clinic', 'walk-in', 'pharmacy-clinic'],
  urgent: ['urgent-care', 'walk-in', 'pharmacy-clinic', 'primary-care'],
  emergency: ['emergency-department'],
  stay: ['emergency-department'],
};

export const clinicById = (id: string): Clinic | undefined => CLINICS.find((c) => c.id === id);
export const clinicsIn = (cityId: string): Clinic[] => CLINICS.filter((c) => c.cityId === cityId);

/** Their own doctors: the practices and clinics a doctor's visit can be at. */
export const DOCTOR_KINDS: readonly ClinicKind[] = SERVES.visit;

/** Where a piece of care is had, in the town they're in; nothing where SLATE keeps none there. */
export function clinicFor(person: Person, care: 'visit' | 'urgent' | 'emergency' | 'stay'): Clinic | undefined {
  const here = clinicsIn(person.currentLocationId);
  const own = person.health?.clinicId ? here.find((c) => c.id === person.health!.clinicId) : undefined;
  if (care === 'visit' && own) return own;
  for (const kind of SERVES[care]) {
    const c = here.find((x) => x.kind === kind);
    if (c) return c;
  }
  return undefined;
}

/** A provider's own self-pay price for a visit, in the save's money, cents; nothing where it publishes none. */
export function selfPayAt(clinic: Clinic | undefined, into: string): Money | undefined {
  const p = clinic ? SELF_PAY[clinic.id] : undefined;
  if (!p) return undefined;
  const cents = Math.round(p.amount * 100);
  return p.currency === into ? cents : exchange(cents, p.currency, into) ?? cents;
}

/** Why this can't be their doctor, or nothing. */
export function clinicRefusal(person: Person, clinicId: string): string | undefined {
  const c = clinicById(clinicId);
  if (!c) return 'No such practice.';
  if (c.cityId !== person.home?.cityId) return 'Your doctor is in the town you live in.';
  if (!DOCTOR_KINDS.includes(c.kind)) return 'That isn’t a doctor’s practice.';
  return undefined;
}
