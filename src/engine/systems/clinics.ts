/**
 * SLATE — where care happens (Stage 9 of `docs/BACKLOG.md`, from
 * 2026-10-01; the providers in `content/clinics.ts`). A doctor's visit is at
 * their own doctor where they've chosen one in the town they're in, or the
 * town's first practice; urgent care at an urgent care center or a walk-in;
 * an emergency and a stay at a hospital's emergency department. Uninsured,
 * an urgent visit at a provider that publishes its self-pay price is that
 * price; elsewhere SLATE's average stands (`CARE.price`).
 *
 * **A practice for its members** (from 2026-10-15): Yale Health's Student Health, at the Yale Health Center, sees Yale
 * students alone, the next weekday (its own "same-day or next-day"), and costs them nothing; Fair Haven Community Health
 * Care sees anybody living in its ten towns, on New Haven's wait. Until then SLATE kept Fair Haven alone in New Haven, so
 * Your Doctor was never drawn for a played life and the choice decided nothing. Membership is Yale Health covering them
 * at the moment (`coverOn`), so it ends with that cover: thirty days after a withdrawal past the fifteenth day of
 * classes, on the day of one before it, on 31 July after the degree.
 *
 * **Care had where the cover sends it** (from 2026-10-15): Yale Health's own page (health-coverage-overview-students-
 * yale-health, read 2026-10-15) says "All care must be obtained at the Yale Health Center at 55 Lock Street unless it is
 * an emergency situation or you have a referral with prior authorization to see an outside clinician for services." So
 * with nothing chosen a member's visit is at Yale Health's practice, and one had at any other practice in a town that
 * keeps Yale Health's isn't Yale Health's to pay (`outsideItsPractice`): Fair Haven bills it as it bills anybody
 * uninsured. Until 2026-10-15 the town's first practice that took anybody, Fair Haven, was the one
 * given with nothing chosen, and Yale Health paid a member's visit there at $0. SLATE keeps no referral with prior
 * authorization, so none is honored; an emergency, urgent care and a stay are had and paid as before.
 */

import type { Person } from '../domain/model';
import type { Money } from '../core/money';
import type { Instant } from '../core/time';
import { exchange } from '../content/currency';
import { CLINICS, SELF_PAY, type Clinic, type ClinicKind } from '../content/clinics';
import { coverOn } from './health';

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

/**
 * Whether a place sees them at a moment: anybody, or for a practice for its members, a member then (from 2026-10-15).
 * GUARD: with no moment given, a practice for its members isn't taken to see them; every caller in the engine gives one.
 */
export function seesThem(person: Person, clinic: Clinic, at?: Instant): boolean {
  if (clinic.members === null) return true;
  return at !== undefined && clinic.members === 'yale' && coverOn(person, at) === 'yale';
}

/**
 * Where a piece of care is had, in the town they're in, at a moment; nothing where SLATE keeps none there. Their own
 * doctor while it sees them; for a visit with none, the practice of the cover they're a member of, where the town keeps
 * one (Yale Health's, from 2026-10-15, its rule that a member's care is had there); otherwise the first place of the
 * care's kinds that sees anybody. Until 2026-10-15 a member with nothing chosen was given that first place, Fair Haven.
 */
export function clinicFor(person: Person, care: 'visit' | 'urgent' | 'emergency' | 'stay', at?: Instant): Clinic | undefined {
  const here = clinicsIn(person.currentLocationId);
  const own = person.health?.clinicId ? here.find((c) => c.id === person.health!.clinicId) : undefined;
  if (care === 'visit' && own && seesThem(person, own, at)) return own;
  if (care === 'visit') {
    const theirs = here.find((c) => c.members !== null && DOCTOR_KINDS.includes(c.kind) && seesThem(person, c, at));
    if (theirs) return theirs;
  }
  for (const kind of SERVES[care]) {
    const c = here.find((x) => x.kind === kind && x.members === null);
    if (c) return c;
  }
  return undefined;
}

/**
 * Whether a doctor's visit at a practice is had outside the one their cover sends them to, and so isn't the cover's to
 * pay (from 2026-10-15): Yale Health covering them at the moment, the practice not Yale Health's, in a town that keeps
 * Yale Health's (New Haven). Elsewhere, away from it, Yale Health's own rule pays "acute care" and SLATE reads no visit
 * there as outside it. A visit only: an emergency, urgent care and a stay aren't asked.
 */
export function outsideItsPractice(person: Person, clinic: Clinic | undefined, at: Instant): boolean {
  if (!clinic || clinic.members !== null || coverOn(person, at) !== 'yale') return false;
  return clinicsIn(clinic.cityId).some((c) => c.members === 'yale' && DOCTOR_KINDS.includes(c.kind));
}

/** A provider's own self-pay price for a visit, in the save's money, cents; nothing where it publishes none. */
export function selfPayAt(clinic: Clinic | undefined, into: string): Money | undefined {
  const p = clinic ? SELF_PAY[clinic.id] : undefined;
  if (!p) return undefined;
  const cents = Math.round(p.amount * 100);
  return p.currency === into ? cents : exchange(cents, p.currency, into) ?? cents;
}

/** What a practice for its members says to somebody it doesn't see. */
export const MEMBERS_ONLY: Readonly<Record<'yale', string>> = { yale: 'Yale Health sees Yale students it covers, and it doesn’t cover you now.' };

/** Why this can't be their doctor at a moment, or nothing; a practice for its members refuses somebody it doesn't see (from 2026-10-15). */
export function clinicRefusal(person: Person, clinicId: string, at?: Instant): string | undefined {
  const c = clinicById(clinicId);
  if (!c) return 'No such practice.';
  if (c.cityId !== person.currentLocationId) return 'Your doctor is in the town you live in.';
  if (!DOCTOR_KINDS.includes(c.kind)) return 'That isn’t a doctor’s practice.';
  if (c.members !== null && !seesThem(person, c, at)) return MEMBERS_ONLY[c.members];
  return undefined;
}
