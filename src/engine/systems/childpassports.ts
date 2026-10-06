/**
 * SLATE — a child's own passport (requirement 47m, from 2026-10-05): applied
 * for by the parent at the child's country's child fee, ready after its
 * office's standard days, and lasting its years (`content/childpassports.ts`).
 * A child past the ages a child's passport covers is issued the adult's, at
 * its fee, days and years (`content/passports.ts`). The child's country is
 * the parent's citizenship, SLATE's reading: it keeps no child's own.
 *
 * A child brought on a journey that crosses a border needs one in force the
 * day they leave and the day they come back (`childRefusal` in
 * `systems/companions.ts`). Until 2026-10-05 a child went abroad with none.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CHILD_PASSPORTS } from '../content/childpassports';
import { PASSPORTS } from '../content/passports';
import { childrenOf, type Child } from './children';
import { isoOfCity, isoOfCountry } from './documents';
import { payFromBank } from './household';

const YEAR_MS = 365.25 * MS_DAY;
export interface ChildPassport { issuer: string; readyAt: Instant; expiresAt: Instant }

const ageOn = (k: Child, at: Instant): number => (at - k.born) / YEAR_MS;
const inSave = (sim: Simulation, units: number, currency: string): Money => { const c = Math.round(units * 100); const cur = saveCurrency(sim.universe); return cur === currency ? c : exchange(c, currency, cur) ?? c; };

/** What a passport for this child costs and gives where their parent is a citizen: a child's, or past its ages the adult's. */
export function childPassportTerms(person: Person, child: Child, at: Instant): { issuer: string; fee: number; currency: string; years: number; days: number; adult: boolean } | string {
  const issuer = isoOfCountry(person.citizenshipId);
  if (!issuer) return 'Your citizenship’s passport office isn’t one SLATE keeps.';
  const age = ageOn(child, at);
  const rule = CHILD_PASSPORTS[issuer];
  if (rule && age < rule.under) {
    const infant = rule.infant && age < rule.infant.under ? rule.infant : undefined;
    return { issuer, fee: infant?.fee ?? rule.fee, currency: rule.currency, years: infant?.years ?? rule.years, days: rule.days, adult: false };
  }
  const adult = PASSPORTS[issuer];
  if (!adult) return 'Your citizenship’s passport office isn’t one SLATE keeps.';
  return { issuer, fee: adult.fee, currency: adult.currency, years: adult.validityYears, days: adult.days, adult: true };
}

/** Whether a child's passport is in force on a day: ready by then and not yet expired. */
export const passportOn = (child: Child, at: Instant): boolean => Boolean(child.passport && child.passport.readyAt <= at && child.passport.expiresAt > at);

export function childPassportRefusal(sim: Simulation, person: Person, childId: string): string | undefined {
  const child = childrenOf(person).find((k) => k.id === childId);
  if (!child || ageOn(child, sim.now) >= 18) return 'That isn’t a child of yours.';
  if (child.passport && child.passport.expiresAt > sim.now + 180 * MS_DAY) return `${child.name.split(' ')[0]} has a passport.`;
  const t = childPassportTerms(person, child, sim.now);
  return typeof t === 'string' ? t : undefined;
}

/** A passport applied for and paid: ready after its days, lasting its years from then. */
export function applyForChildPassport(sim: Simulation, person: Person, childId: string): { paid: Money; readyAt: Instant } {
  const no = childPassportRefusal(sim, person, childId);
  if (no) throw new CommandError(no);
  const child = childrenOf(person).find((k) => k.id === childId)!;
  const t = childPassportTerms(person, child, sim.now) as Exclude<ReturnType<typeof childPassportTerms>, string>;
  const paid = inSave(sim, t.fee, t.currency);
  if (!payFromBank(sim, person, paid, `${child.name}’s passport`, 'travel')) throw new CommandError(`${formatMoney(paid, saveCurrency(sim.universe))} is more than the bank can cover.`);
  const readyAt = sim.now + t.days * MS_DAY;
  child.passport = { issuer: t.issuer, readyAt, expiresAt: readyAt + t.years * YEAR_MS };
  return { paid, readyAt };
}

/** Why a child can't go on a journey across a border: no passport in force on the way out or back. */
export function childBorderRefusal(child: Child, fromCity: string, toCity: string, leaveAt: Instant, backAt: Instant | undefined): string | undefined {
  if (isoOfCity(fromCity) === isoOfCity(toCity)) return undefined;
  const name = child.name.split(' ')[0];
  if (!child.passport) return `${name} has no passport for crossing a border.`;
  if (!passportOn(child, leaveAt)) return child.passport.readyAt > leaveAt ? `${name}’s passport won’t be ready by then.` : `${name}’s passport has expired.`;
  if (backAt !== undefined && !passportOn(child, backAt)) return `${name}’s passport expires before you’re back.`;
  return undefined;
}

export function registerChildPassports(sim: Simulation): void {
  sim.onCommand<{ childId: string }, { paid: Money; readyAt: Instant }>('children.passport', (p, { sim: s }) => applyForChildPassport(s, s.player, String(p?.childId ?? '')));
}
