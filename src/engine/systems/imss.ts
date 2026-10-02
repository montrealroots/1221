/**
 * SLATE — Mexico's IMSS pension under the 1997 law (from 2026-09-29),
 * researched from CONSAR's 2026 calculator methodology and the Social
 * Security Law, and kept in `docs/research/world/research-openitems.json`.
 *
 * A day's work in Mexico is a day registered with IMSS, and its pay puts
 * into the worker's AFORE account the year's total retirement contribution
 * for the wage's band (6.275% to 10.638% in 2026: the employer's retiro and
 * cesantía y vejez and the worker's 1.125%), and the government's cuota
 * social for a wage up to four UMA. Weeks are days contributed over seven:
 * an actor working three days in a week has three sevenths of one. The
 * account grows at CONSAR's 4% a year real, less its example fee of 0.54%.
 *
 * From 65, with the year's weeks (875 in 2026, 25 more each year to 1,000
 * from 2031), the balance buys a pension. Below the guaranteed pension's
 * floor, the floor is paid; and the Fondo de Pensiones para el Bienestar tops
 * it up to the last year's average wage, no higher than MXN 17,885.85 a
 * month in 2026.
 *
 * SLATE's estimates: CONSAR divides the balance by an annuity factor from
 * the EMSSA-RCS-15 mortality table, which isn't published as a number;
 * SLATE takes 216 months (eighteen years from 65), with CONSAR's 1.15 and
 * 2% margins, so the balance matters only above the Fondo's reach. The
 * guaranteed pension is its lowest 2026 figure, MXN 3,540.56 (read
 * secondhand), not its full table by wage, age and weeks. A stage run's
 * performance day counts seven sixths of a day, the run's week being
 * registered whole. Early retirement from 60, and the rates' rise to 2030,
 * aren't kept; 2026's stand.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, formatDate, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { payeeAccount } from './cash';

export const IMSS = {
  umaDaily: 117_31,
  minimumWageDaily: 315_04,
  /** Total retirement contribution by the wage's band, upper bound in UMA (the first band the minimum wage), 2026. */
  bands: [
    { upToUma: 0, rate: 0.06275, social: 12_16 },
    { upToUma: 1.5, rate: 0.06801, social: 11_31 },
    { upToUma: 2, rate: 0.07976, social: 10_46 },
    { upToUma: 2.5, rate: 0.08681, social: 9_61 },
    { upToUma: 3, rate: 0.09151, social: 8_77 },
    { upToUma: 3.5, rate: 0.09486, social: 7_92 },
    { upToUma: 4, rate: 0.09738, social: 7_07 },
    { upToUma: Infinity, rate: 0.10638, social: 0 },
  ],
  /** The registered wage stops at 25 UMA a day. */
  capUma: 25,
  realReturn: 0.04,
  fee: 0.0054,
  weeks2026: 875,
  weeksStep: 25,
  weeksMax: 1_000,
  age: 65,
  annuityMonths: 216,
  margins: 1.15 * 1.02,
  guaranteedFloor: 3_540_56,
  fondoCap: 17_885_85,
  source: 'https://www.consar.gob.mx/gobmx/Aplicativo/calculadora/imss/PDF/Metodolog%C3%ADa_Calculadora_de_Retiro.pdf',
} as const;

export const IMSS_KIND = 'pension.imss_month';
const YEAR_MS = 365.2425 * MS_DAY;

export interface ImssRecord {
  /** Days contributed. */
  days: number;
  /** The AFORE account, peso cents, as of \`asOf\`. */
  balance: Money;
  asOf: Instant;
  /** Pay registered in the last twelve months, day by day, for the Fondo's last-year wage. */
  recent: { at: Instant; pesos: Money; days: number }[];
  claimedAt?: Instant;
  monthly?: Money;
}

const inPesos = (sim: Simulation, cents: Money) => { const cur = saveCurrency(sim.universe); return cur === 'MXN' ? cents : exchange(cents, cur, 'MXN') ?? cents; };
const imssOf = (person: Person): ImssRecord => (person.imss ??= { days: 0, balance: 0, asOf: 0, recent: [] });

/** The account grown to a moment at the real return less the fee. */
export function grownTo(record: ImssRecord, at: Instant): Money {
  if (record.balance <= 0 || at <= record.asOf) return record.balance;
  const years = (at - record.asOf) / YEAR_MS;
  return Math.round(record.balance * ((1 + IMSS.realReturn) * (1 - IMSS.fee)) ** years);
}

/** A day's contribution for a daily wage in peso cents: the band's rate on the wage to 25 UMA, and the cuota social. */
export function dayContribution(dailyPesos: Money): Money {
  const wage = Math.min(dailyPesos, IMSS.umaDaily * IMSS.capUma);
  const inUma = wage / IMSS.umaDaily;
  const band = wage <= IMSS.minimumWageDaily ? IMSS.bands[0]! : IMSS.bands.slice(1).find((b) => inUma <= b.upToUma)!;
  return Math.round(wage * band.rate) + band.social;
}

/** Days of work registered in Mexico: pay for them in the save's money. */
export function contribute(sim: Simulation, person: Person, at: Instant, pay: Money, days: number): void {
  if (days <= 0) return;
  const r = imssOf(person);
  const pesos = inPesos(sim, pay);
  r.balance = grownTo(r, at) + Math.round(dayContribution(pesos / days) * days);
  r.asOf = at;
  r.days += days;
  r.recent = [...r.recent.filter((x) => x.at > at - YEAR_MS), { at, pesos, days }];
}

/** The weeks a year's claim asks: 875 in 2026, 25 more a year, 1,000 from 2031. */
export function weeksNeeded(year: number): number {
  return Math.min(IMSS.weeksMax, IMSS.weeks2026 + Math.max(0, year - 2026) * IMSS.weeksStep);
}

/** The pension a month in peso cents, claimed at a moment: the balance's, the floor, and the Fondo's top-up. */
export function imssMonthly(record: ImssRecord, at: Instant): Money {
  const bought = Math.round(grownTo(record, at) / (IMSS.annuityMonths * IMSS.margins));
  const base = Math.max(bought, IMSS.guaranteedFloor);
  const days = record.recent.reduce((a, x) => a + x.days, 0);
  const lastYear = days > 0 ? Math.round((record.recent.reduce((a, x) => a + x.pesos, 0) / days) * 30.4) : 0;
  return Math.max(base, Math.min(lastYear, IMSS.fondoCap));
}

export function imssRefusal(sim: Simulation, person: Person): string | undefined {
  const r = person.imss;
  if (r?.claimedAt !== undefined) return 'You’re drawing it.';
  if (!r || r.days === 0) return 'It’s for someone with IMSS contributions: work in Mexico.';
  if ((sim.now - person.birthInstant) / YEAR_MS < IMSS.age) return 'From 65.';
  const need = weeksNeeded(new Date(sim.now).getUTCFullYear());
  const weeks = Math.floor(r.days / 7);
  if (weeks < need) return `It takes ${need} weeks this year; your IMSS record has ${weeks}. The Pensión para el Bienestar is for every Mexican from 65.`;
  return undefined;
}

const monthOn = (at: Instant) => { const d = new Date(at); return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate(), d.getUTCHours()); };

export function registerImss(sim: Simulation): void {
  sim.onCommand<Record<string, never>, { monthly: Money }>('pension.imss', (_p, { sim: s }) => {
    const person = s.player;
    const no = imssRefusal(s, person);
    if (no) throw new CommandError(no);
    const r = imssOf(person);
    r.monthly = imssMonthly(r, s.now);
    r.claimedAt = s.now;
    s.schedule({ at: monthOn(s.now), kind: IMSS_KIND, label: 'IMSS Pension', category: 'system', priority: 20, payload: { personId: person.id } });
    const cur = saveCurrency(s.universe);
    return { monthly: cur === 'MXN' ? r.monthly : exchange(r.monthly, 'MXN', cur) ?? r.monthly };
  });

  sim.onSchedule(IMSS_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const r = person?.imss;
    if (!person || !r?.monthly || r.claimedAt === undefined) return;
    const cur = saveCurrency(s.universe);
    const due = cur === 'MXN' ? r.monthly : exchange(r.monthly, 'MXN', cur) ?? r.monthly;
    const account = payeeAccount(s, person);
    s.post({ memo: 'IMSS pension, the month', category: 'pension', postings: [{ accountId: account.id, amount: due }, { accountId: s.nominalAccount('income', 'IMSS Pension').id, amount: -due }] });
    if (person.id === s.universe.playerId) s.notify({ category: 'bank', title: 'IMSS Pension Paid', body: `${formatMoney(due, cur)} for the month, since ${formatDate(r.claimedAt, s.zone)}.`, importance: 25, route: '/workspace/bank' });
    s.schedule({ at: monthOn(item.at), kind: IMSS_KIND, label: 'IMSS Pension', category: 'system', priority: 20, payload: { personId: person.id } });
  });
}
