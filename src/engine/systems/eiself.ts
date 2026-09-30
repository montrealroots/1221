/**
 * SLATE — Employment Insurance for a self-employed actor in Canada (docs/WORLD.md,
 * the safety net where a person lives), from 2026-09-30, researched in
 * `docs/research/world/research-canada-benefits2.json`.
 *
 * A performer is self-employed under the Status of the Artist Act, and EI's
 * regular benefits aren't theirs. Its special benefits are, by choice:
 * registered (`benefits.ei_register`), they pay 1.63% of their earnings in
 * premiums, $1,123.07 a year at most, taken here from each check as the CPP
 * is; after twelve months registered, with $9,254 of earnings the year
 * before, a week too sick to work, in hospital or laid up by an injury, is
 * paid 55% of that year's weekly earnings, to $729, for 26 weeks a claim at
 * most, after one unpaid week. Once a benefit's been paid, the premiums run
 * for as long as they're self-employed. Maternity, parental and caregiving
 * benefits aren't kept: SLATE's lives have no children or partners.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, zonedParts, type Instant } from '../core/time';
import { saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { EI_SELF_EMPLOYED as EI } from '../content/cabenefits';
import { earningsOf, homeOf } from './earnings';
import { citizenOf } from './documents';
import { payeeAccount } from './cash';

export interface EiRecord { registeredAt: Instant; paidBy?: Record<string, number>; claimWeeks?: number; waited?: boolean; claimed?: boolean; lastSickAt?: Instant }

const YEAR_MS = 365.2425 * MS_DAY;
const livesInCanada = (person: Person) => CITIES.get(homeOf(person))?.countryId === 'ca';
const cadOf = (cents: Money, from: string) => (from === 'CAD' ? cents : exchange(cents, from, 'CAD') ?? cents);

export function eiRefusal(person: Person): string | undefined {
  if (!livesInCanada(person)) return 'EI is for someone living in Canada.';
  if (!citizenOf(person, 'CA')) return 'SLATE keeps EI for a Canadian citizen.';
  if (person.ei) return 'You’re registered.';
  return undefined;
}

/** A check's EI premium for a registered Canadian, in the check's money: 1.63% to the year's most. */
export function eiOnCheck(person: Person, year: number, gross: Money, currency: string): Money {
  const ei = person.ei;
  if (!ei || !livesInCanada(person)) return 0;
  ei.paidBy ??= {};
  const paid = ei.paidBy[year] ?? 0;
  const due = Math.min(Math.round(cadOf(gross, currency) * EI.premium), Math.round(EI.premiumMax * 100) - paid);
  if (due <= 0) return 0;
  ei.paidBy[year] = paid + due;
  return currency === 'CAD' ? due : exchange(due, 'CAD', currency) ?? due;
}

/** The weekly sickness benefit in dollars: 55% of last year's weekly earnings, to $729; nothing short of $9,254 or twelve months registered. */
export function eiWeekly(sim: Simulation, person: Person, at: Instant): number {
  const ei = person.ei;
  if (!ei || at - ei.registeredAt < (EI.registeredMonths / 12) * YEAR_MS - MS_DAY) return 0;
  const year = zonedParts(at, sim.homeZone).year - 1;
  const earned = cadOf(earningsOf(person).years[year]?.acting ?? 0, saveCurrency(sim.universe)) / 100;
  if (earned < EI.minEarnings) return 0;
  return Math.min(EI.maxWeekly, (EI.rate * earned) / 52);
}

/** A week in the health tick: too sick to work, the first week unpaid and then the benefit, to 26 a claim. */
export function eiWeek(sim: Simulation, person: Person, at: Instant, sick: boolean): Money {
  const ei = person.ei;
  if (!ei) return 0;
  if (!sick) { if (ei.lastSickAt !== undefined && at - ei.lastSickAt > 8 * MS_DAY) { ei.waited = false; ei.claimWeeks = 0; } return 0; }
  ei.lastSickAt = at;
  const weekly = eiWeekly(sim, person, at);
  if (weekly <= 0 || (ei.claimWeeks ?? 0) >= EI.weeks) return 0;
  if (!ei.waited) { ei.waited = true; return 0; }
  ei.claimWeeks = (ei.claimWeeks ?? 0) + 1;
  ei.claimed = true;
  const c = Math.round(weekly * 100);
  const cur = saveCurrency(sim.universe);
  const paid = cur === 'CAD' ? c : exchange(c, 'CAD', cur) ?? c;
  sim.post({ memo: 'EI sickness benefit, the week', category: 'benefits', postings: [{ accountId: payeeAccount(sim, person).id, amount: paid }, { accountId: sim.nominalAccount('income', 'EI Benefits').id, amount: -paid }] });
  return paid;
}

export function registerEiSelfEmployed(sim: Simulation): void {
  sim.onCommand<Record<string, never>, { registeredAt: Instant }>('benefits.ei_register', (_p, { sim: s }) => {
    const person = s.player;
    const no = eiRefusal(person);
    if (no) throw new CommandError(no);
    person.ei = { registeredAt: s.now };
    return { registeredAt: s.now };
  });
}
