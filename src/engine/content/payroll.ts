/**
 * SLATE — a payslip, as each country's employers work it out.
 *
 * What comes off a wage before it reaches the bank: income tax as the
 * country's employers withhold it, the employee's social contributions, and
 * the pension contributions that go into a fund the worker owns. Each of the
 * thirteen countries SLATE pays a life in is written out here from its 2026
 * law and rates, researched on 2026-09-25 (`probe/job-research/<ISO>.json`)
 * with the source beside each figure. Every other country keeps the tax
 * engine's approximation (`content/tax.ts`), and the payslip says so.
 *
 * Until 2026-09-25 a paycheck lost one rate from that approximation: brackets
 * written in US dollars applied to every country, no pension, no social
 * contribution outside six countries, and nothing the worker kept.
 *
 * Worked on the year, as the US percentage method, Britain's PAYE and most
 * of the rest do it: the period's pay is taken to a year, the year's charges
 * are worked out, and the period pays its share. Amounts are in the
 * country's own money, whole units, and rounded to hundredths at the end.
 */

import { computeAnnualTax } from './tax';
import { WORLD_WORK, type WorldWork } from './work-world';
import { PROVINCES, STATES, type PhaseOut, type StateLaw } from './jurisdictions';
import { LOCAL_BY_CITY, LOCAL_TAXES, type LocalTax } from './local-tax';

export type PayslipKind = 'tax' | 'social' | 'pension';

export interface PayslipLine {
  name: string;
  /** A year's worth, in hundredths of the country's money. */
  amount: number;
  kind: PayslipKind;
  source: string;
}

export interface PayrollYear {
  lines: PayslipLine[];
  /** What the employer pays into the worker's own pension fund, a year. */
  employerPension: number;
  employerPensionName?: string;
  /** The payslip is SLATE's approximation, not the country's own rules. */
  estimate?: boolean;
}

export interface PayrollContext {
  /** Every jurisdiction the work is in, country first (`jurisdictionPath`). */
  path: readonly string[];
  age: number;
  at: number;
  /** Last calendar year's wages, where a tax is levied on them (Japan's resident tax). */
  lastYear?: number;
  /** Hours a week, where contributions turn on them. */
  weeklyHours?: number;
  /** The town, for its own taxes, and for the tax engine's approximation where SLATE has no rules. */
  cityId?: string;
  /** Worked for the year's return: a tax paid only there is taken. */
  settling?: boolean;
}

/** France's taxable pay (net imposable) on a year's gross: less the pension contributions and the deductible 6.8 points of CSG. */
export function franceTaxable(g: number): number {
  const pensions = Math.min(g, 48_060) * (0.069 + 0.0315 + 0.0086) + g * 0.004;
  return g - pensions - g * 0.9825 * 0.068;
}

/**
 * France's income tax for one part on a year's taxable pay (2026 barème, on
 * 2025 income): less 10% for work expenses, €509 to €14,555; the scale; and
 * the décote, €897 less 45.25% of a tax under €1,982.
 */
export function franceIncomeTax(taxable: number): number {
  const deduction = Math.min(14_555, Math.max(509, taxable * 0.1));
  const net = Math.max(0, taxable - deduction);
  const gross = bands(net, [[0, 0], [11_600, 0.11], [29_579, 0.30], [84_577, 0.41], [181_917, 0.45]]);
  const decote = gross < 1_982 ? Math.max(0, 897 - 0.4525 * gross) : 0;
  return Math.max(0, gross - decote);
}

/**
 * Spain's IRPF on a year's pay, before the withholding's own limits: the pay
 * less Seguridad Social, €2,000 of expenses and the reduction for work
 * (art. 20), on the scale, less the scale on the personal minimum of €5,550.
 * The return charges this, less the minimum-wage deduction
 * (`content/taxreturn.ts`); the withholding holds it to nothing up to
 * €15,876 and to 43% of the pay over it.
 */
export function spainCuota(g: number): number {
  const ss = Math.min(g, 5_101.20 * 12) * (0.047 + 0.0155 + 0.001 + 0.0015);
  const net = g - ss;
  const reduction = net <= 14_852 ? 7_302 : net <= 17_673.52 ? 7_302 - 1.75 * (net - 14_852) : net <= 19_747.5 ? 2_364.34 - 1.14 * (net - 17_673.52) : 0;
  const base = Math.max(0, net - 2_000 - reduction);
  const scale: readonly (readonly [number, number])[] = [[0, 0.19], [12_450, 0.24], [20_200, 0.30], [35_200, 0.37], [60_000, 0.45], [300_000, 0.47]];
  return Math.max(0, bands(base, scale) - bands(5_550, scale));
}

/** Tax on an income by marginal bands: [from, rate] in whole units. */
function bands(income: number, table: readonly (readonly [number, number])[]): number {
  let tax = 0;
  for (let i = 0; i < table.length; i += 1) {
    const [from, rate] = table[i]!;
    const to = table[i + 1]?.[0] ?? Number.POSITIVE_INFINITY;
    if (income <= from) break;
    tax += (Math.min(income, to) - from) * rate;
  }
  return tax;
}
const clampTo = (value: number, low: number, high: number) => Math.max(low, Math.min(high, value));
const inBand = (income: number, above: number, upTo = Number.POSITIVE_INFINITY) => clampTo(income, above, upTo) - above;

type Line = { name: string; amount: number; kind: PayslipKind; source: string };

/** An amount after a phase-out, at a year's income. */
function phased(amount: number, g: number, p: PhaseOut): number {
  if ('cliff' in p) return g > p.cliff ? 0 : amount;
  if ('steps' in p) return p.steps.find(([from, to]) => g > from && (to === null || g <= to))?.[2] ?? (g <= (p.steps[0]?.[0] ?? 0) ? p.steps[0]![2] : 0);
  if ('from' in p && g > p.from) {
    const steps = p.per > 1 ? Math.ceil((g - p.from) / p.per) : g - p.from;
    return Math.max(p.item !== 'forgiven' && 'floor' in p ? p.floor ?? 0 : 0, amount - steps * p.reduce);
  }
  return amount;
}
const band = (table: readonly (readonly [number, number | null, number])[], g: number) => table.find(([from, to]) => g > from && (to === null || g <= to))?.[2] ?? 0;

/**
 * A state's income tax on a single filer's year: its brackets after the
 * standard deduction and personal exemption, less its personal credit, each
 * after its phase-out, then less the share of the tax a low income is
 * forgiven or credited. Until 2026-09-26 nothing phased out.
 */
const phasedItem = (t: NonNullable<StateLaw['tax']>, g: number, item: 'standardDeduction' | 'personalExemption' | 'personalCredit') =>
  (t.phaseOuts ?? []).filter((p) => p.item === item).reduce((amount, p) => phased(amount, g, p), t[item]);

/** A state's taxable income on a year's wages: after its deduction and exemption, each after its phase-out. */
export function stateTaxable(t: NonNullable<StateLaw['tax']>, g: number): number {
  return Math.max(0, g - phasedItem(t, g, 'standardDeduction') - phasedItem(t, g, 'personalExemption'));
}

export function stateIncomeTax(t: NonNullable<StateLaw['tax']>, g: number): number {
  const of = (item: 'standardDeduction' | 'personalExemption' | 'personalCredit') => phasedItem(t, g, item);
  const taxable = stateTaxable(t, g);
  const notch = (t.notches ?? []).reduce((sum, [from, amount]) => sum + (taxable > from ? amount : 0), 0);
  let tax = Math.max(0, bands(taxable, t.brackets) + notch - of('personalCredit'));
  for (const p of t.phaseOuts ?? []) {
    if (p.item === 'creditShare') tax -= tax * band(p.table, g);
    if (p.item === 'forgiven') tax -= tax * ('table' in p ? (g <= (p.table[0]?.[0] ?? 0) ? 1 : band(p.table, g)) : phased(1, g, p));
  }
  return Math.max(0, tax);
}

/** A local tax on a year's wages: a rate to its cap, a fixed sum past its threshold, or a share of the state's tax. */
export function localTax(t: LocalTax, g: number, stateTax: number, stateTaxable = g): number {
  if (t.exemptUnder !== undefined && g < t.exemptUnder) return 0;
  if (t.ofStateTaxable) g = stateTaxable;
  if (t.brackets) return bands(g, t.brackets);
  if (t.over !== undefined || t.deduct !== undefined) g = Math.max(0, g - (t.over ?? 0) - (t.deduct ?? 0));
  if (t.ofStateTax !== undefined) return stateTax * t.ofStateTax;
  if (t.flat !== undefined) {
    const monthly = t.thresholdPer === 'year' ? g : g / 12;
    if (t.threshold !== undefined && monthly < t.threshold) return 0;
    return t.flat * (t.per === 'week' ? 52 : t.per === 'month' ? 12 : 1);
  }
  return Math.min(g, t.cap ?? Number.POSITIVE_INFINITY) * (t.rate ?? 0);
}
type Rules = (gross: number, ctx: PayrollContext) => { lines: Line[]; employerPension?: number; employerPensionName?: string };

const RULES: Record<string, Rules> = {
  // --- United States: IRS Rev. Proc. 2025-32, SSA 2026, the states' own ---
  US: (g, ctx) => {
    const lines: Line[] = [];
    const IRS = 'IRS Rev. Proc. 2025-32 and Publication 15-T, 2026';
    lines.push({ name: 'Federal Income Tax', kind: 'tax', source: IRS, amount: bands(Math.max(0, g - 16_100), [[0, 0.10], [12_400, 0.12], [50_400, 0.22], [105_700, 0.24], [201_775, 0.32], [256_225, 0.35], [640_600, 0.37]]) });
    lines.push({ name: 'Social Security', kind: 'social', source: 'SSA 2026: 6.2% up to $184,500', amount: Math.min(g, 184_500) * 0.062 });
    lines.push({ name: 'Medicare', kind: 'social', source: 'IRS Topic 751: 1.45%, and 0.9% more over $200,000', amount: g * 0.0145 + inBand(g, 200_000) * 0.009 });
    const state = ctx.path[1];
    const nyc = ['US-NY-newyork', 'US-NY-brooklyn', 'US-NY-queens', 'US-NY-manhattan', 'US-NY-thebronx', 'US-NY-statenisland'].includes(ctx.path[2] ?? '');
    if (state === 'US-NY') {
      const taxable = Math.max(0, g - 8_000);
      lines.push({ name: 'New York State Income Tax', kind: 'tax', source: 'NYS 2026 single rates, $8,000 standard deduction', amount: bands(taxable, [[0, 0.039], [8_500, 0.044], [11_700, 0.0515], [13_900, 0.054], [80_650, 0.059], [215_400, 0.0685], [1_077_550, 0.0965], [5_000_000, 0.103], [25_000_000, 0.109]]) });
      if (nyc) lines.push({ name: 'New York City Income Tax', kind: 'tax', source: 'NYC resident rates, 2026', amount: bands(taxable, [[0, 0.03078], [12_000, 0.03762], [25_000, 0.03819], [50_000, 0.03876]]) });
      lines.push({ name: 'New York Paid Family Leave', kind: 'social', source: 'NYS 2026: 0.432%, at most $411.91 a year', amount: Math.min(g * 0.00432, 411.91) });
      lines.push({ name: 'New York Disability Benefits', kind: 'social', source: 'NY WCB: 0.5%, at most $0.60 a week', amount: Math.min(g * 0.005, 0.60 * 52) });
    } else if (state === 'US-CA') {
      lines.push({ name: 'California Income Tax', kind: 'tax', source: 'EDD 2026 withholding schedule: $5,706 standard deduction, a $168.30 credit', amount: Math.max(0, bands(Math.max(0, g - 5_706), [[0, 0.01], [11_079, 0.02], [26_264, 0.04], [41_452, 0.06], [57_542, 0.08], [72_724, 0.093], [371_479, 0.103], [445_771, 0.113], [742_953, 0.123], [1_000_000, 0.133]]) - 168.30) });
      lines.push({ name: 'California SDI', kind: 'social', source: 'EDD 2026: 1.3%, no wage ceiling', amount: g * 0.013 });
    } else if (state === 'US-IL') {
      lines.push({ name: 'Illinois Income Tax', kind: 'tax', source: 'IL 2026: 4.95% after a $2,925 exemption', amount: Math.max(0, g - 2_925) * 0.0495 });
    } else if (state === 'US-GA') {
      lines.push({ name: 'Georgia Income Tax', kind: 'tax', source: 'GA DOR 2026: 4.99% after a $15,000 standard deduction', amount: Math.max(0, g - 15_000) * 0.0499 });
    } else if (state === 'US-WA') {
      lines.push({ name: 'Washington Paid Family and Medical Leave', kind: 'social', source: 'ESD 2026: the employee’s 71.43% of 1.13%, up to $184,500', amount: Math.min(g, 184_500) * 0.00807 });
      lines.push({ name: 'WA Cares Fund', kind: 'social', source: 'WA Cares 2026: 0.58%', amount: g * 0.0058 });
    } else if (STATES[state ?? '']) {
      // The other states and DC, from the labor-law pass
      // (`content/jurisdictions.ts`): a single filer's brackets after the
      // standard deduction and the personal exemption, less the personal
      // credit, and the paid-leave or unemployment contribution the worker
      // pays where there is one. Until 2026-09-26 these states had the tax
      // engine's approximation, and no contribution.
      const st = STATES[state!]!;
      let stateTax = 0;
      if (st.tax) {
        stateTax = stateIncomeTax(st.tax, g);
        lines.push({ name: `${st.name} Income Tax`, kind: 'tax', source: st.tax.source, amount: stateTax });
      }
      const c = st.leaveContribution;
      if (c) lines.push({ name: c.name, kind: 'social', source: c.source, amount: Math.min(g, c.cap ?? Number.POSITIVE_INFINITY) * c.rate });
      for (const d of st.contributions ?? []) {
        let amount = Math.min(g, d.cap ?? Number.POSITIVE_INFINITY) * (d.rate ?? 0) + (d.perHour ?? 0) * (ctx.weeklyHours ?? 40) * 52 + (d.perQuarter ?? 0) * 4;
        if (d.weeklyMax !== undefined) amount = Math.min(amount, d.weeklyMax * 52);
        if (d.maxAnnual !== undefined) amount = Math.min(amount, d.maxAnnual);
        lines.push({ name: d.name, kind: 'social', source: d.source, amount });
      }
    } else if (state !== 'US-TX' && state !== 'US-FL' && state !== undefined && !LOCAL_BY_CITY[ctx.cityId ?? '']) {
      // A state the research didn't cover: the tax engine's approximation of it.
      const approx = ctx.cityId ? computeAnnualTax(Math.round(g * 100), ctx.cityId, ctx.at) : undefined;
      const regional = approx ? (approx.regional + approx.local) / 100 : 0;
      if (regional > 0) lines.push({ name: 'State Income Tax (SLATE’s Approximation)', kind: 'tax', source: 'content/tax.ts', amount: regional });
    }
    // The town's own wage taxes (`content/local-tax.ts`), on the state's
    // tax where one is a share of it (Yonkers's); until 2026-09-26 the
    // approximation carried them for the states it covered, and none after.
    // One paid on the return is only in the year's settlement.
    const stateTax = lines.find((l) => l.kind === 'tax' && / Income Tax$/.test(l.name) && l.name !== 'Federal Income Tax')?.amount ?? 0;
    const local = (LOCAL_BY_CITY[ctx.cityId ?? ''] ?? []).map((i) => [i, LOCAL_TAXES[i]!] as const);
    const stTax = STATES[state ?? '']?.tax;
    const before = new Map(local.map(([i, t]) => [i, localTax(t, g, stateTax, stTax ? stateTaxable(stTax, g) : g)]));
    for (const [i, t] of local) {
      if (t.atReturn && !ctx.settling) continue;
      const credit = (t.lessTaxes ?? []).reduce((sum, j) => sum + (before.get(j) ?? 0), 0);
      lines.push({ name: t.name, kind: 'tax', source: t.source, amount: Math.max(0, before.get(i)! - credit) });
    }
    return { lines };
  },

  // --- Canada: CRA and Revenu Québec 2026 ---------------------------------
  CA: (g, ctx) => {
    const lines: Line[] = [];
    const quebec = ctx.path[1] === 'CA-10';
    const pension = quebec
      ? { name: 'Quebec Pension Plan', rate: 0.063, source: 'Retraite Québec 2026: 6.3% from $3,500 to $74,600' }
      : { name: 'Canada Pension Plan', rate: 0.0595, source: 'CRA 2026: 5.95% from $3,500 to $74,600' };
    const cpp = inBand(g, 3_500, 74_600) * pension.rate;
    const ei = Math.min(g, 68_900) * (quebec ? 0.013 : 0.0163);
    lines.push({ name: pension.name, kind: 'social', source: pension.source, amount: cpp });
    lines.push({ name: 'Employment Insurance', kind: 'social', source: `CRA 2026: ${quebec ? '1.30% in Quebec' : '1.63%'} up to $68,900`, amount: ei });
    if (quebec) lines.push({ name: 'Quebec Parental Insurance Plan', kind: 'social', source: 'QPIP 2026: 0.430% up to $103,000', amount: Math.min(g, 103_000) * 0.0043 });
    const qpip = quebec ? Math.min(g, 103_000) * 0.0043 : 0;
    // Federal: the basic personal and Canada employment amounts, and the
    // contributions, credited at the lowest rate. Quebec's federal tax is
    // abated 16.5%.
    let federal = Math.max(0, bands(g, [[0, 0.14], [58_523, 0.205], [117_045, 0.26], [181_440, 0.29], [258_482, 0.33]]) - (16_452 + 1_501 + cpp + ei + qpip) * 0.14);
    if (quebec) federal *= 1 - 0.165;
    lines.push({ name: 'Federal Income Tax', kind: 'tax', source: 'CRA 2026 brackets; basic personal amount $16,452, employment amount $1,501', amount: federal });
    if (ctx.path[1] === 'CA-08') {
      lines.push({ name: 'Ontario Income Tax', kind: 'tax', source: 'Ontario 2026 brackets; basic personal amount $12,989', amount: Math.max(0, bands(g, [[0, 0.0505], [53_891, 0.0915], [107_785, 0.1116], [150_000, 0.1216], [220_000, 0.1316]]) - (12_989 + cpp + ei) * 0.0505) });
      const ohp = g <= 20_000 ? 0 : g <= 36_000 ? Math.min(300, (g - 20_000) * 0.06) : g <= 48_000 ? Math.min(450, 300 + (g - 36_000) * 0.25)
        : g <= 72_000 ? Math.min(600, 450 + (g - 48_000) * 0.25) : g <= 200_000 ? Math.min(750, 600 + (g - 72_000) * 0.25) : Math.min(900, 750 + (g - 200_000) * 0.25);
      lines.push({ name: 'Ontario Health Premium', kind: 'tax', source: 'ontario.ca; the steps from TaxTips.ca', amount: ohp });
    } else if (ctx.path[1] === 'CA-02') {
      lines.push({ name: 'British Columbia Income Tax', kind: 'tax', source: 'BC 2026 brackets; basic personal amount $13,216', amount: Math.max(0, bands(g, [[0, 0.056], [50_363, 0.077], [100_728, 0.105], [115_648, 0.1229], [140_430, 0.147], [190_405, 0.168], [265_545, 0.205]]) - (13_216 + cpp + ei) * 0.056) });
    } else if (quebec) {
      lines.push({ name: 'Quebec Income Tax', kind: 'tax', source: 'Revenu Québec 2026 brackets; basic personal amount $18,952', amount: Math.max(0, bands(g, [[0, 0.14], [54_345, 0.19], [108_680, 0.24], [132_245, 0.2575]]) - 18_952 * 0.14) });
    } else if (PROVINCES[ctx.path[1] ?? '']) {
      // The other provinces and territories (`content/jurisdictions.ts`): the
      // brackets, the basic personal amount and the contributions credited at
      // the lowest rate, less the low-income reduction where there is one;
      // and the Northwest Territories' and Nunavut's 2% payroll tax.
      const p = PROVINCES[ctx.path[1]!]!;
      const before = Math.max(0, bands(g, p.tax.brackets) - (p.tax.basicPersonalAmount + cpp + ei) * p.tax.lowestRate);
      const reduction = p.tax.reduction ? Math.max(0, p.tax.reduction.max - p.tax.reduction.rate * Math.max(0, g - p.tax.reduction.from)) : 0;
      lines.push({ name: `${p.name} Income Tax`, kind: 'tax', source: p.tax.source, amount: Math.max(0, before - reduction) });
      if (p.tax.payrollTax) lines.push({ name: `${p.name} Payroll Tax`, kind: 'tax', source: p.tax.source, amount: g * p.tax.payrollTax });
    }
    return { lines };
  },

  // --- Mexico: SAT's 2026 tariff, the Ley del Seguro Social ---------------
  MX: (g) => {
    const lines: Line[] = [];
    const UMA = 117.31;
    const MINIMUM_DAY = 315.04;
    // IMSS charges the integrated wage: the daily pay with the aguinaldo's
    // fifteen days and the vacation premium's share in it (1.0493 in a
    // first year).
    const sbcDay = Math.min((g / 365) * 1.0493, 25 * UMA);
    const year = (rate: number, perDay: number) => perDay * rate * 365;
    const imss = year(0.0025 + 0.00375 + 0.00625, sbcDay) + year(0.004, Math.max(0, sbcDay - 3 * UMA));
    lines.push({ name: 'IMSS (Sickness, Disability And Life)', kind: 'social', source: 'Ley del Seguro Social, 2026 worker quotas', amount: imss });
    lines.push({ name: 'IMSS Old Age (To Your Afore)', kind: 'pension', source: 'Ley del Seguro Social: 1.125%', amount: year(0.01125, sbcDay) });
    // ISR: the tariff, less the employment subsidy; nothing withheld from a
    // wage at the general minimum (art. 96).
    let isr = 0;
    if (g / 365 > MINIMUM_DAY) {
      isr = bands(g, [[0, 0.0192], [10_135.12, 0.064], [86_022.12, 0.1088], [151_176.2, 0.16], [175_735.67, 0.1792], [210_403.7, 0.2136], [424_353.98, 0.2352], [668_840.15, 0.30], [1_276_925.99, 0.32], [1_702_567.98, 0.34], [5_107_703.93, 0.35]]);
      if (g / 12 <= 11_492.66) isr = Math.max(0, isr - 535.65 * 12);
    }
    lines.push({ name: 'ISR', kind: 'tax', source: 'SAT, Anexo 8 RMF 2026; subsidio para el empleo 535.65 a month', amount: isr });
    // The employer's 2% retirement and its old-age share (3.150% at the
    // minimum, more by the wage in UMA) go to the Afore too.
    const inUma = sbcDay / UMA;
    const cesantia = sbcDay <= MINIMUM_DAY * 1.0493 ? 0.0315 : inUma <= 1.5 ? 0.03676 : inUma <= 2 ? 0.04851 : inUma <= 2.5 ? 0.05556 : inUma <= 3 ? 0.06026 : inUma <= 3.5 ? 0.06361 : inUma <= 4 ? 0.06613 : 0.07513;
    return { lines, employerPension: year(0.02 + cesantia, sbcDay), employerPensionName: 'Your employer’s retiro and cesantía' };
  },

  // --- United Kingdom: HMRC 2026/27 --------------------------------------
  GB: (g, ctx) => {
    const lines: Line[] = [];
    // Auto-enrolment: 5% of qualifying earnings from 22 to State Pension age,
    // over the £10,000 trigger, taken before tax (net pay arrangement).
    const enrolled = g >= 10_000 && ctx.age >= 22 && ctx.age < 66;
    const qualifying = enrolled ? inBand(g, 6_240, 50_270) : 0;
    const pension = qualifying * 0.05;
    if (pension > 0) lines.push({ name: 'Workplace Pension', kind: 'pension', source: 'DWP, auto-enrolment 2026/27: 5% of earnings from £6,240 to £50,270', amount: pension });
    const taxable = Math.max(0, g - pension - 12_570);
    const scotland = ctx.path[1] === 'GB-SCT';
    lines.push({
      name: 'Income Tax', kind: 'tax', amount: scotland
        ? bands(taxable, [[0, 0.19], [3_967, 0.20], [16_956, 0.21], [31_092, 0.42], [62_430, 0.45], [125_140, 0.48]])
        : bands(taxable, [[0, 0.20], [37_700, 0.40], [125_140, 0.45]]),
      source: scotland ? 'Scottish rates 2026/27, £12,570 personal allowance' : 'HMRC 2026/27: £12,570 personal allowance, 20/40/45%',
    });
    lines.push({ name: 'National Insurance', kind: 'social', source: 'HMRC 2026/27, Class 1: 8% from £12,570 to £50,270, 2% above', amount: inBand(g, 12_570, 50_270) * 0.08 + inBand(g, 50_270) * 0.02 });
    return { lines, employerPension: qualifying * 0.03, employerPensionName: 'Your employer' };
  },

  // --- Ireland: Revenue and the Department of Social Protection, 2026 ------
  IE: (g, ctx) => {
    const lines: Line[] = [];
    lines.push({ name: 'PAYE', kind: 'tax', source: 'Revenue 2026: 20% to €44,000, 40% above, less €2,000 personal and €2,000 employee credits', amount: Math.max(0, bands(g, [[0, 0.20], [44_000, 0.40]]) - 4_000) });
    const usc = g <= 13_000 ? 0 : bands(g, [[0, 0.005], [12_012, 0.02], [28_700, 0.03], [70_044, 0.08]]);
    lines.push({ name: 'USC', kind: 'tax', source: 'Revenue 2026: none to €13,000, then on all of it in bands', amount: usc });
    const weekly = g / 52;
    const rate = ctx.at >= Date.UTC(2026, 9, 1) ? 0.0435 : 0.042;
    const credit = weekly > 352 ? Math.max(0, 12 - (weekly - 352) / 6) : 0;
    const prsi = weekly > 352 ? Math.max(0, weekly * rate - credit) * 52 : 0;
    lines.push({ name: 'PRSI', kind: 'social', source: `DSP: Class A ${(rate * 100).toFixed(2)}% over €352 a week, with the tapered credit`, amount: prsi });
    // My Future Fund: 23 to 60, €20,000 or more, 1.5% each on pay up to
    // €80,000, and the State's 0.5% beside the employer's.
    const enrolled = ctx.age >= 23 && ctx.age <= 60 && g >= 20_000;
    const base = enrolled ? Math.min(g, 80_000) : 0;
    if (base > 0) lines.push({ name: 'My Future Fund', kind: 'pension', source: 'NAERSA, auto-enrolment from 1 January 2026: 1.5%', amount: base * 0.015 });
    return { lines, employerPension: base * 0.02, employerPensionName: 'Your employer and the State' };
  },

  // --- Iceland: Skatturinn 2026, the agreements ----------------------------
  IS: (g) => {
    const pension = g * 0.04;
    const lines: Line[] = [
      { name: 'Lífeyrissjóður', kind: 'pension', source: 'Skatturinn 2026: 4%, before tax', amount: pension },
      { name: 'Staðgreiðsla', kind: 'tax', source: 'Skatturinn 2026: 31.49%, 37.99%, 46.29%, less persónuafsláttur of 869,898 kr', amount: Math.max(0, bands(g - pension, [[0, 0.3149], [5_977_464, 0.3799], [16_781_400, 0.4629]]) - 869_898) },
      { name: 'Félagsgjald', kind: 'social', source: 'Efling and VR: union dues, 0.7%', amount: g * 0.007 },
    ];
    return { lines, employerPension: g * 0.115, employerPensionName: 'Your employer (mótframlag)' };
  },

  // --- New Zealand: IRD 2026-27 ------------------------------------------
  NZ: (g) => {
    const lines: Line[] = [];
    const ietc = g < 24_000 ? 0 : g <= 66_000 ? 520 : Math.max(0, 520 - (g - 66_000) * 0.13);
    lines.push({ name: 'PAYE', kind: 'tax', source: 'IRD 2026-27 rates, less the independent earner tax credit', amount: Math.max(0, bands(g, [[0, 0.105], [15_600, 0.175], [53_500, 0.30], [78_100, 0.33], [180_000, 0.39]]) - ietc) });
    lines.push({ name: 'ACC Earners’ Levy', kind: 'social', source: 'ACC from 1 April 2026: 1.75% up to $156,641', amount: Math.min(g, 156_641) * 0.0175 });
    lines.push({ name: 'KiwiSaver', kind: 'pension', source: 'IRD: 3.5% from 1 April 2026', amount: g * 0.035 });
    // The employer's 3.5% is taxed first (ESCT, by the worker's pay).
    const employer = g * 0.035;
    const esct = g + employer <= 18_720 ? 0.105 : g + employer <= 64_200 ? 0.175 : g + employer <= 93_720 ? 0.30 : g + employer <= 216_000 ? 0.33 : 0.39;
    return { lines, employerPension: employer * (1 - esct), employerPensionName: 'Your employer, after the tax on it (ESCT),' };
  },

  // --- Australia: ATO 2026-27 ---------------------------------------------
  AU: (g) => {
    const lines: Line[] = [];
    const lito = g <= 37_500 ? 700 : g <= 45_000 ? 700 - (g - 37_500) * 0.05 : Math.max(0, 325 - (g - 45_000) * 0.015);
    lines.push({ name: 'PAYG Withholding', kind: 'tax', source: 'ATO 2026-27: $18,200 tax-free, then 15/30/37/45%, less the low income tax offset', amount: Math.max(0, bands(g, [[0, 0], [18_200, 0.15], [45_000, 0.30], [135_000, 0.37], [190_000, 0.45]]) - lito) });
    lines.push({ name: 'Medicare Levy', kind: 'tax', source: 'ATO: 2%, none to $28,011, phased in above it', amount: Math.max(0, Math.min(g * 0.02, (g - 28_011) * 0.1)) });
    return { lines, employerPension: Math.min(g, 270_830) * 0.12, employerPensionName: 'Your employer’s superannuation guarantee' };
  },

  // --- France: 2026 contributions and the default withholding grid ---------
  FR: (g) => {
    const lines: Line[] = [];
    const PASS = 48_060;
    const capped = Math.min(g, PASS);
    const pensions = capped * (0.069 + 0.0315 + 0.0086) + g * 0.004;
    const csgBase = g * 0.9825;
    lines.push({ name: 'Retraite (vieillesse, AGIRC-ARRCO, CEG)', kind: 'social', source: 'URSSAF and AGIRC-ARRCO, 1 January 2026', amount: pensions });
    lines.push({ name: 'CSG and CRDS', kind: 'social', source: 'URSSAF 2026: 9.2% and 0.5% on 98.25% of pay', amount: csgBase * (0.092 + 0.005) });
    // Taxable pay keeps the non-deductible 2.4 points of CSG and the CRDS;
    // the default grid's one rate for the month's band applies to all of it.
    const taxableMonth = franceTaxable(g) / 12;
    const grid: readonly (readonly [number, number])[] = [[0, 0], [1_635, 0.005], [1_698, 0.013], [1_807, 0.021], [1_928, 0.029], [2_060, 0.035], [2_170, 0.041], [2_315, 0.053], [2_738, 0.075], [3_135, 0.099], [3_571, 0.119], [4_019, 0.138], [4_690, 0.158], [5_624, 0.179], [7_037, 0.20], [8_789, 0.24], [12_200, 0.28], [16_523, 0.33], [25_937, 0.38], [55_558, 0.43]];
    const rate = [...grid].reverse().find(([from]) => taxableMonth >= from)?.[1] ?? 0;
    lines.push({ name: 'Prélèvement à la source', kind: 'tax', source: 'BOFIP, the taux neutre grid from 1 May 2026', amount: taxableMonth * rate * 12 });
    return { lines };
  },

  // --- Germany: §32a EStG and the 2026 contribution rates ------------------
  DE: (g, ctx) => {
    const lines: Line[] = [];
    const month = g / 12;
    // A minijob: no tax or contributions of the worker's own but the
    // pension top-up.
    if (month <= 603) {
      lines.push({ name: 'Rentenversicherung (Minijob Top-Up)', kind: 'social', source: 'Minijob-Zentrale 2026: 3.6% to €603 a month', amount: g * 0.036 });
      return { lines };
    }
    // The transition zone (Midijob): the worker's contributions are charged
    // on a reduced base, rising to the full pay at €2,000 a month.
    const base = month < 2_000 ? (2_000 / (2_000 - 603)) * (month - 603) * 12 : g;
    const pension = Math.min(base, 101_400) * 0.093;
    const unemployment = Math.min(base, 101_400) * 0.013;
    const health = Math.min(base, 69_750) * (0.073 + 0.0145);
    const care = Math.min(base, 69_750) * (0.018 + (ctx.age >= 23 ? 0.006 : 0));
    lines.push({ name: 'Rentenversicherung', kind: 'social', source: 'DRV 2026: 9.3%', amount: pension });
    lines.push({ name: 'Arbeitslosenversicherung', kind: 'social', source: 'BA 2026: 1.3%', amount: unemployment });
    lines.push({ name: 'Krankenversicherung', kind: 'social', source: 'GKV 2026: 7.3% and half the average 2.9% add-on', amount: health });
    lines.push({ name: 'Pflegeversicherung', kind: 'social', source: 'GKV 2026: 1.8%, and 0.6% more childless from 23', amount: care });
    const taxable = Math.max(0, g - 1_230 - 36 - (pension + health + care));
    const x = Math.floor(taxable);
    const tax = x <= 12_348 ? 0
      : x <= 17_799 ? (914.51 * ((x - 12_348) / 10_000) + 1_400) * ((x - 12_348) / 10_000)
        : x <= 69_878 ? (173.10 * ((x - 17_799) / 10_000) + 2_397) * ((x - 17_799) / 10_000) + 1_034.87
          : x <= 277_825 ? 0.42 * x - 11_135.63 : 0.45 * x - 19_470.38;
    lines.push({ name: 'Lohnsteuer', kind: 'tax', source: '§32a EStG 2026, tax class I', amount: tax });
    if (tax > 20_350) lines.push({ name: 'Solidaritätszuschlag', kind: 'tax', source: '5.5% of tax over €20,350', amount: tax * 0.055 });
    return { lines };
  },

  // --- Spain: AEAT's withholding algorithm, Seguridad Social 2026 ----------
  ES: (g) => {
    const lines: Line[] = [];
    const ss = Math.min(g, 5_101.20 * 12) * (0.047 + 0.0155 + 0.001 + 0.0015);
    lines.push({ name: 'Seguridad Social', kind: 'social', source: 'Orden PJC/297/2026: 4.70%, 1.55%, 0.10%, 0.15%', amount: ss });
    // Nothing up to the exempt limit of €15,876, and no more than 43% of
    // what the pay is over it. The algorithm comes to nothing below the
    // limit anyway: a separate check that none was withheld there changed no
    // payslip, and was taken out.
    const irpf = Math.max(0, Math.min(spainCuota(g), (g - 15_876) * 0.43));
    lines.push({ name: 'IRPF', kind: 'tax', source: 'AEAT withholding algorithm 2026; none up to €15,876', amount: irpf });
    return { lines };
  },

  // --- Japan: the NTA's 2026 withholding, Kyōkai Kenpo Tokyo -------------
  JP: (g, ctx) => {
    const lines: Line[] = [];
    const { kosei, health, insured } = japanInsurance(g, ctx);
    if (insured) {
      lines.push({ name: '厚生年金 (Employees’ Pension)', kind: 'social', source: 'Japan Pension Service: 9.15%', amount: kosei });
      lines.push({ name: '健康保険 (Health Insurance, Tokyo)', kind: 'social', source: 'Kyōkai Kenpo Tokyo from March 2026: 4.925%, with care at 40 to 64 and the child levy', amount: health });
    }
    lines.push({ name: '雇用保険 (Employment Insurance)', kind: 'social', source: 'MHLW fiscal 2026: 0.5%', amount: g * 0.005 });
    const employment = g <= 1_900_000 ? 740_000 : g <= 3_600_000 ? Math.max(740_000, g * 0.3 + 80_000) : g <= 6_600_000 ? g * 0.2 + 440_000 : g <= 8_500_000 ? g * 0.1 + 1_100_000 : 1_950_000;
    const basic = g <= 4_890_000 ? 1_040_000 : g <= 6_550_000 ? 670_000 : 620_000;
    const taxable = Math.max(0, g - employment - basic - kosei - health - g * 0.005);
    lines.push({ name: '所得税 (Income Tax)', kind: 'tax', source: 'NTA, fiscal 2026 reform: 5% to 45%, with the 2.1% reconstruction surtax', amount: bands(taxable, [[0, 0.05], [1_950_000, 0.10], [3_300_000, 0.20], [6_950_000, 0.23], [9_000_000, 0.33], [18_000_000, 0.40], [40_000_000, 0.45]]) * 1.021 });
    // Resident tax: on last year's wages, none in a first year and none at
    // ¥1.1 million or less.
    const last = ctx.lastYear ?? 0;
    if (last > 1_100_000) {
      // Last year's employment deduction, at its 2025 minimum of ¥650,000:
      // the national reform reaches the resident tax only from fiscal 2027.
      const lastEmployment = last <= 1_900_000 ? 650_000 : last <= 3_600_000 ? Math.max(650_000, last * 0.3 + 80_000) : last <= 6_600_000 ? last * 0.2 + 440_000 : last <= 8_500_000 ? last * 0.1 + 1_100_000 : 1_950_000;
      const paid = japanInsurance(last, ctx);
      lines.push({ name: '住民税 (Resident Tax)', kind: 'tax', source: 'Tokyo Metropolitan Tax Bureau: 10% on last year’s income and ¥5,000', amount: Math.max(0, last - lastEmployment - 430_000 - paid.kosei - paid.health - last * 0.005) * 0.10 + 5_000 });
    }
    return { lines };
  },

  // --- Korea: NTS and the four insurances, 2026 --------------------------
  KR: (g) => {
    const lines: Line[] = [];
    const month = clampTo(g / 12, 410_000, 6_590_000);
    const pension = month * 0.0475 * 12;
    const health = g * 0.03595;
    lines.push({ name: '국민연금 (National Pension)', kind: 'social', source: 'NPS 2026: 4.75%', amount: pension });
    lines.push({ name: '건강보험 (Health Insurance)', kind: 'social', source: 'NHIS 2026: 3.595%', amount: health });
    lines.push({ name: '장기요양보험 (Long-Term Care)', kind: 'social', source: 'NHIS 2026: 13.14% of the health premium', amount: health * 0.1314 });
    lines.push({ name: '고용보험 (Employment Insurance)', kind: 'social', source: 'MOEL 2026: 0.9%', amount: g * 0.009 });
    const earned = g <= 5_000_000 ? g * 0.7 : g <= 15_000_000 ? 3_500_000 + (g - 5_000_000) * 0.4 : g <= 45_000_000 ? 7_500_000 + (g - 15_000_000) * 0.15 : g <= 100_000_000 ? 12_000_000 + (g - 45_000_000) * 0.05 : 14_750_000 + (g - 100_000_000) * 0.02;
    const taxable = Math.max(0, g - earned - 1_500_000 - pension - health * 1.1314);
    const computed = bands(taxable, [[0, 0.06], [14_000_000, 0.15], [50_000_000, 0.24], [88_000_000, 0.35], [150_000_000, 0.38], [300_000_000, 0.40], [500_000_000, 0.42], [1_000_000_000, 0.45]]);
    const credit = Math.min(computed <= 1_300_000 ? computed * 0.55 : 715_000 + (computed - 1_300_000) * 0.3, g <= 33_000_000 ? 740_000 : 660_000);
    const tax = Math.max(0, computed - credit - 130_000);
    lines.push({ name: '근로소득세 (Income Tax)', kind: 'tax', source: 'NTS 2026: earned-income deduction and credit, the standard credit', amount: tax });
    lines.push({ name: '지방소득세 (Local Income Tax)', kind: 'tax', source: '10% of income tax', amount: tax * 0.1 });
    return { lines };
  },
};

/**
 * Japan's standard monthly remuneration (標準報酬月額): the month's pay
 * placed in a grade, [standard, the pay the grade runs to], and the premiums
 * charged on the grade's standard, not the pay. Kyōkai Kenpo Tokyo's table
 * for fiscal 2026 (R8_13tokyo.pdf): fifty health grades; the pension's
 * thirty-two are health grades 4 to 35, ¥88,000 to ¥650,000. Until
 * 2026-09-25 the premiums were charged on the pay itself.
 */
const JP_GRADES: readonly (readonly [number, number])[] = [
  [58000, 63000], [68000, 73000], [78000, 83000], [88000, 93000], [98000, 101000], [104000, 107000],
  [110000, 114000], [118000, 122000], [126000, 130000], [134000, 138000], [142000, 146000], [150000, 155000],
  [160000, 165000], [170000, 175000], [180000, 185000], [190000, 195000], [200000, 210000], [220000, 230000],
  [240000, 250000], [260000, 270000], [280000, 290000], [300000, 310000], [320000, 330000], [340000, 350000],
  [360000, 370000], [380000, 395000], [410000, 425000], [440000, 455000], [470000, 485000], [500000, 515000],
  [530000, 545000], [560000, 575000], [590000, 605000], [620000, 635000], [650000, 665000], [680000, 695000],
  [710000, 730000], [750000, 770000], [790000, 810000], [830000, 855000], [880000, 905000], [930000, 955000],
  [980000, 1005000], [1030000, 1055000], [1090000, 1115000], [1150000, 1175000], [1210000, 1235000], [1270000, 1295000],
  [1330000, 1355000], [1390000, Infinity],
];

/** The standard monthly remuneration a month's pay falls in. */
export function japanStandard(monthly: number): number {
  return JP_GRADES.find(([, upTo]) => monthly < upTo)![0];
}

/**
 * Japan's social insurance on a year's pay: from ¥88,000 a month on twenty
 * hours a week, on the standard monthly remuneration: the pension at 9.15%
 * on grades ¥88,000 to ¥650,000, and health at 4.925% (with long-term care
 * at 40 to 64, and the child levy from April 2026) on grades to ¥1.39
 * million.
 */
function japanInsurance(g: number, ctx: PayrollContext): { kosei: number; health: number; insured: boolean } {
  const insured = g / 12 >= 88_000 && (ctx.weeklyHours ?? 40) >= 20;
  if (!insured) return { kosei: 0, health: 0, insured };
  const standard = japanStandard(g / 12);
  const kosei = Math.min(Math.max(standard, 88_000), 650_000) * 0.0915 * 12;
  const health = standard * (0.04925 + (ctx.age >= 40 && ctx.age < 65 ? 0.0081 : 0) + (ctx.at >= Date.UTC(2026, 3, 1) ? 0.00115 : 0)) * 12;
  return { kosei, health, insured };
}

/**
 * A country outside the thirteen, from the world research: the employee's own
 * contributions, each with its cap, the pension ones into the worker's fund,
 * and income tax on the year's pay less the allowance and any pension
 * contribution, less any credit. Simpler than the thirteen's, and the
 * payslip names its source.
 */
function worldRules(payroll: NonNullable<WorldWork['payroll']>): Rules {
  return (g) => {
    const lines: Line[] = [];
    let pretax = 0;
    for (const one of payroll.employee) {
      const base = Math.min(g, one.capYearly ?? Number.POSITIVE_INFINITY);
      const amount = one.bands ? bands(base, one.bands) : base * one.rate;
      if (one.pension) pretax += amount;
      lines.push({ name: one.name, kind: one.pension ? 'pension' : 'social', source: payroll.source, amount });
    }
    const tax = payroll.tax;
    if (tax) {
      const owed = bands(Math.max(0, g - pretax - (tax.allowance ?? 0)), tax.brackets) - (tax.credit ?? 0);
      lines.push({ name: 'Income Tax', kind: 'tax', source: tax.source, amount: Math.max(0, owed) });
    }
    const employer = payroll.employerPension;
    return { lines, ...(employer ? { employerPension: g * employer.rate, employerPensionName: `Your employer (${employer.name})` } : {}) };
  };
}

/** Whether SLATE works the country's payslip out from its own rules. */
export function hasPayroll(iso: string): boolean {
  return iso in RULES || WORLD_WORK[iso]?.payroll !== undefined;
}

/**
 * A year's payslip at a yearly gross, in hundredths of the country's money.
 * A country without its own rules gets the tax engine's approximation as one
 * line, from gross in `usd` (its brackets are in US dollars), marked.
 */
export function payrollYear(iso: string, gross: number, ctx: PayrollContext & { usdPerUnit?: number }): PayrollYear {
  const world = WORLD_WORK[iso]?.payroll;
  const rules = RULES[iso] ?? (world ? worldRules(world) : undefined);
  if (!rules) {
    const usd = ctx.usdPerUnit !== undefined ? Math.round(gross * ctx.usdPerUnit) : gross;
    const rate = ctx.cityId ? computeAnnualTax(usd, ctx.cityId, ctx.at).effectiveRate : 0;
    // Where the tax engine has no rule for the country either, nothing is
    // taken, and the payslip says that rather than calling nothing a figure.
    return {
      lines: rate > 0 ? [{ name: 'Tax And Contributions (SLATE’s Approximation)', amount: Math.round(gross * rate), kind: 'tax', source: 'content/tax.ts' }] : [],
      employerPension: 0,
      estimate: true,
    };
  }
  const worked = rules(gross / 100, ctx);
  return {
    lines: worked.lines.filter((one) => one.amount > 0).map((one) => ({ ...one, amount: Math.round(one.amount * 100) })),
    employerPension: Math.round((worked.employerPension ?? 0) * 100),
    ...(worked.employerPensionName ? { employerPensionName: worked.employerPensionName } : {}),
  };
}
