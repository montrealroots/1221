/**
 * SLATE — Canada's public pensions (docs/WORLD.md, the safety net where a
 * person lives), from 2026-09-30, researched from canada.ca, the CRA and ESDC in
 * `docs/research/world/research-canada-pensions.json`. Found by the Toronto
 * life, which lived to 87 and went hungry at times after 60 with nothing
 * from the state it had lived and worked in for sixty years.
 *
 * **The CPP, paid in.** A self-employed Canadian pays both halves: 11.9% of
 * earnings between the $3,500 basic exemption and the YMPE ($74,600 in
 * 2026), and 8% between the YMPE and the YAMPE ($85,000), the second
 * additional contribution (worked out from the CRA's maximums). SLATE takes
 * it from each check while they live in Canada, as instalments toward the
 * year's return, and keeps the year's pensionable earnings.
 *
 * **The CPP, paid out**, from 60 to 70, claimed: base CPP replaces 25% of
 * average earnings to the YMPE, the enhancement 33.33% for earnings from
 * 2019, which SLATE phases in straight from 2019 to 2025 as the contribution
 * did, and 8% of those between the YMPE and the YAMPE from 2024 (SLATE's
 * reading of the second additional's third). The average is over the years
 * from 18 to the claim, less the 17% general dropout of the lowest, at most
 * eight. It's 0.6% less a month before 65 and 0.7% more a month after, and
 * never past 2026's maximum at 65, $1,507.65 a month. Paid anywhere.
 *
 * **Old Age Security**, from 65, claimed: $762.50 a month in the fourth
 * quarter of 2026, $838.75 from 75, for forty years in Canada after 18, in
 * fortieths, ten years at least; paid abroad only after twenty. SLATE counts
 * a year in Canada where they had income while living there, its reading.
 * Claimed after 65 it's 0.6% more a month, to 36% at 70; and from later on
 * 2026-09-30 the recovery tax takes 15% of the last year's net income over
 * $95,323 back from it, a month's share at a time.
 *
 * **The Guaranteed Income Supplement**, with OAS while living in Canada:
 * $1,138.90 a month at most, less half of the last year's income other than
 * OAS and the GIS, after the first $5,000 of earnings and half the next
 * $10,000. The top-up's 25% on income over its threshold is left out, its
 * threshold being 2017's.
 *
 * **Ontario's GAINS**, with the GIS in Ontario: $92 a month at most, gone at
 * $4,416 of private income, taken as a quarter off for each dollar (derived
 * from the two). BC's Senior's Supplement's table wasn't read.
 *
 * The rates are held at the last published. None of it is taxed yet in SLATE.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, zonedParts, type Instant } from '../core/time';
import { saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { earningsOf, homeOf } from './earnings';
import { payeeAccount } from './cash';

export const CPP = { exemption: 3_500, ympe: 74_600, yampe: 85_000, rate: 0.119, rate2: 0.08, base: 0.25, enhanced: 1 / 3, second: 0.08, dropout: 0.17, dropoutMost: 8, early: 0.006, late: 0.007, most: 1_507.65 } as const;
export const OAS = { monthly: 762.5, at75: 838.75, fullYears: 40, leastYears: 10, abroadYears: 20, deferral: 0.006, recoveryFrom: 95_323, recovery: 0.15 } as const;
export const GIS = { monthly: 1_138.9, reduction: 0.5, exempt: 5_000, halfBand: 10_000 } as const;
export const GAINS = { monthly: 92, cutoff: 4_416 } as const;
export const CA_PENSION_KIND = 'pension.ca_month';

export interface CanadaPensions { years: Record<string, number>; cppFrom?: Instant; cppMonthly?: number; oasFrom?: Instant; oasFactor?: number }

const YEAR_MS = 365.2425 * MS_DAY;
const cad = (cents: Money, from: string) => (from === 'CAD' ? cents : exchange(cents, from, 'CAD') ?? cents);
const fromCad = (sim: Simulation, dollars: number): Money => { const c = Math.round(dollars * 100); const cur = saveCurrency(sim.universe); return cur === 'CAD' ? c : exchange(c, 'CAD', cur) ?? c; };
const livesInCanada = (person: Person) => CITIES.get(homeOf(person))?.countryId === 'ca';
const ageAt = (person: Person, at: Instant) => (at - person.birthInstant) / YEAR_MS;

export const canadaPensionsOf = (person: Person): CanadaPensions => (person.caPensions ??= { years: {} });

/** A check's CPP contribution for someone living in Canada, in the check's money, and the year's pensionable earnings kept. */
export function cppOnCheck(person: Person, year: number, gross: Money, currency: string): Money {
  if (!livesInCanada(person)) return 0;
  const rec = canadaPensionsOf(person);
  const before = rec.years[year] ?? 0;
  const after = before + cad(gross, currency) / 100;
  rec.years[year] = after;
  const band = (lo: number, hi: number, x: number) => Math.max(0, Math.min(x, hi) - lo);
  const owedTo = (x: number) => CPP.rate * band(CPP.exemption, CPP.ympe, x) + CPP.rate2 * band(CPP.ympe, CPP.yampe, x);
  const dollars = owedTo(after) - owedTo(before);
  const c = Math.round(dollars * 100);
  return currency === 'CAD' ? c : exchange(c, 'CAD', currency) ?? c;
}

/** The CPP retirement pension a month, in dollars, claimed at an age. */
export function cppMonthly(person: Person, claimAge: number): number {
  const rec = canadaPensionsOf(person);
  const born = new Date(person.birthInstant).getUTCFullYear();
  const first = born + 18;
  const last = born + Math.floor(claimAge) - 1;
  const years: number[] = [];
  for (let y = first; y <= last; y += 1) {
    const e = rec.years[y] ?? 0;
    // The enhancement phased in over 2019 to 2025, as its contribution was.
    const phase = y < 2019 ? 0 : Math.min(1, (y - 2018) / 7);
    const replace = CPP.base + (CPP.enhanced - CPP.base) * phase;
    years.push(replace * Math.min(e, CPP.ympe) + (y >= 2024 ? CPP.second * Math.max(0, Math.min(e, CPP.yampe) - CPP.ympe) : 0));
  }
  if (!years.length || years.every((v) => v === 0)) return 0;
  const drop = Math.min(CPP.dropoutMost, Math.floor(years.length * CPP.dropout));
  const kept = years.sort((a, b) => a - b).slice(drop);
  const yearly = kept.reduce((a, v) => a + v, 0) / kept.length;
  const months = Math.round((claimAge - 65) * 12);
  const factor = months < 0 ? 1 + CPP.early * months : 1 + CPP.late * Math.min(60, months);
  return Math.min(CPP.most, (yearly / 12) * factor);
}

/** Years in Canada after 18: those with income while living there (SLATE's reading). */
export function canadianYears(person: Person): number {
  const born = new Date(person.birthInstant).getUTCFullYear();
  return Object.entries(earningsOf(person).years).filter(([y, e]) => Number(y) >= born + 18 && Object.keys(e.byResidence ?? {}).some((c) => CITIES.get(c)?.countryId === 'ca')).length;
}

/** OAS a month in dollars at an age, by the years in Canada; nothing short of ten, or abroad short of twenty. */
export function oasMonthly(person: Person, age: number): number {
  const years = canadianYears(person);
  if (years < OAS.leastYears || (!livesInCanada(person) && years < OAS.abroadYears)) return 0;
  return (age >= 75 ? OAS.at75 : OAS.monthly) * Math.min(years, OAS.fullYears) / OAS.fullYears;
}

/** The last calendar year's income other than OAS and the GIS, in dollars, as the GIS counts it. */
export function gisIncome(sim: Simulation, person: Person, cppYearly: number): number {
  const cur = saveCurrency(sim.universe);
  const year = zonedParts(sim.now, sim.homeZone).year - 1;
  const earned = cad(earningsOf(person).years[year]?.acting ?? 0, cur) / 100;
  const counted = Math.max(0, earned - GIS.exempt) - Math.min(GIS.halfBand, Math.max(0, earned - GIS.exempt)) / 2;
  return counted + cppYearly;
}

/** The recovery tax a month, in dollars: 15% of the last year's net income over $95,323, OAS and the CPP counted in it. */
export function oasRecovery(sim: Simulation, person: Person, cppMonth: number): number {
  const cur = saveCurrency(sim.universe);
  const year = zonedParts(sim.now, sim.homeZone).year - 1;
  const earned = cad(earningsOf(person).years[year]?.acting ?? 0, cur) / 100;
  const income = earned + (cppMonth + oasMonthly(person, ageAt(person, sim.now)) * (canadaPensionsOf(person).oasFactor ?? 1)) * 12;
  return (OAS.recovery * Math.max(0, income - OAS.recoveryFrom)) / 12;
}

/** The GIS and GAINS a month, in dollars, for someone on OAS living in Canada. */
export function supplements(sim: Simulation, person: Person, cppMonth: number): { gis: number; gains: number } {
  if (!livesInCanada(person)) return { gis: 0, gains: 0 };
  const income = gisIncome(sim, person, cppMonth * 12);
  const gis = Math.max(0, GIS.monthly - (GIS.reduction * income) / 12);
  const ontario = CITIES.get(homeOf(person))?.parentId === 'ca-08';
  const gains = ontario && gis > 0 ? Math.max(0, GAINS.monthly - (GAINS.monthly * 12 / GAINS.cutoff) * income / 12) : 0;
  return { gis, gains };
}

export function oasRefusal(sim: Simulation, person: Person): string | undefined {
  const rec = canadaPensionsOf(person);
  if (rec.oasFrom !== undefined) return 'You’re paid it.';
  if (ageAt(person, sim.now) < 65) return 'Old Age Security is paid from 65.';
  if (oasMonthly(person, ageAt(person, sim.now)) <= 0) return canadianYears(person) < OAS.leastYears ? 'It asks ten years in Canada after 18.' : 'Abroad, it’s paid after twenty years in Canada.';
  return undefined;
}

export function cppRefusal(sim: Simulation, person: Person): string | undefined {
  const rec = canadaPensionsOf(person);
  if (rec.cppFrom !== undefined) return 'You’re paid it.';
  if (ageAt(person, sim.now) < 60) return 'The CPP retirement pension is paid from 60.';
  if (cppMonthly(person, Math.min(70, ageAt(person, sim.now))) <= 0) return 'You paid nothing into the CPP.';
  return undefined;
}

function arm(sim: Simulation, person: Person): void {
  if (sim.universe.scheduled.some((i) => i.kind === CA_PENSION_KIND && i.status === 'pending' && i.payload.personId === person.id)) return;
  sim.schedule({ at: sim.now + 30 * MS_DAY, kind: CA_PENSION_KIND, label: 'Canada’s Pensions', category: 'bank', priority: 30, payload: { personId: person.id } });
}

/** A month of Canada's pensions: the CPP, and OAS with the GIS and GAINS. */
export function canadaMonth(sim: Simulation, person: Person): Money {
  const rec = canadaPensionsOf(person);
  const cpp = rec.cppFrom !== undefined ? rec.cppMonthly ?? 0 : 0;
  let total = cpp;
  if (rec.oasFrom !== undefined) {
    const oas = Math.max(0, oasMonthly(person, ageAt(person, sim.now)) * (rec.oasFactor ?? 1) - oasRecovery(sim, person, cpp));
    const s = oas > 0 ? supplements(sim, person, cpp) : { gis: 0, gains: 0 };
    total += oas + s.gis + s.gains;
  }
  const paid = fromCad(sim, total);
  if (paid > 0) sim.post({ memo: 'Canada’s pensions, the month', category: 'pension', postings: [{ accountId: payeeAccount(sim, person).id, amount: paid }, { accountId: sim.nominalAccount('income', 'Canada’s Pensions').id, amount: -paid }] });
  return paid;
}

export function registerCanadaPensions(sim: Simulation): void {
  sim.onCommand<Record<string, never>, { monthly: Money }>('pension.ca_oas', (_p, { sim: s }) => {
    const person = s.player;
    const no = oasRefusal(s, person);
    if (no) throw new CommandError(no);
    const rec = canadaPensionsOf(person);
    rec.oasFrom = s.now;
    // Deferred past 65: 0.6% more a month, to 70.
    rec.oasFactor = 1 + OAS.deferral * Math.min(60, Math.max(0, Math.round((ageAt(person, s.now) - 65) * 12)));
    arm(s, person);
    return { monthly: fromCad(s, oasMonthly(person, ageAt(person, s.now)) * rec.oasFactor) };
  });
  sim.onCommand<Record<string, never>, { monthly: Money }>('pension.cpp', (_p, { sim: s }) => {
    const person = s.player;
    const no = cppRefusal(s, person);
    if (no) throw new CommandError(no);
    const rec = canadaPensionsOf(person);
    rec.cppFrom = s.now;
    rec.cppMonthly = cppMonthly(person, Math.min(70, ageAt(person, s.now)));
    arm(s, person);
    return { monthly: fromCad(s, rec.cppMonthly) };
  });
  sim.onSchedule(CA_PENSION_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (!person) return;
    canadaMonth(s, person);
    arm(s, person);
  });
}
