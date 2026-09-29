/**
 * SLATE — the income tax return (`content/safetynet.ts` `RETURN`).
 *
 * Each February a year's return is ready for anybody the year left owing or
 * owed: its income (acting wages with residuals, work-study, unemployment),
 * less the performing artist deduction where the year qualifies, and with a
 * home's rent less its costs and a sale's short gain (`systems/homes.ts`),
 * itemized where a home's interest and taxes beat the standard deduction,
 * and a long-term gain taxed at its own rates; the tax on
 * it where they last lived, with California leaving unemployment out, and
 * payroll tax on the acting wages; the premium tax credit on the marketplace
 * months; California's penalty on the months without cover; and against it
 * all, what was withheld. Filed, a balance is paid from the bank, or owed
 * until it is; a refund arrives 21 days on. Filed after 15 April's deadline
 * with a balance, the late penalties are added. Until 2026-09-27 what was
 * withheld from a paycheck was kept by nothing.
 *
 * A balance left owing after filing grows by the IRS's interest, 7% a year
 * compounded daily from the due date, and by the half-point a month for
 * paying late to a quarter of it; and it's collected as the IRS collects: its
 * reminders about five weeks apart (CP501, CP503, the CP504 notice of intent
 * to levy), its final notice (LT11) with 30 days to pay, and then a levy on
 * the bank accounts, again each quarter while anything is owed (`COLLECTION`).
 * Until 2026-09-28 a balance owed was never collected: played lives left
 * fourteen years of returns unpaid.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { MS_DAY, formatDate, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { exchange } from '../content/currency';
import { computeAnnualTax, federalStandardDeduction } from '../content/tax';
import { HOME_TAX } from '../content/homes';
import { CITIES } from '../content/geography';
import { ABROAD, CALIFORNIA_MANDATE, CONNECTICUT, RECEIPTS, STATE_DEDUCTIONS, POVERTY_LINE, PREMIUM_CREDIT, ENHANCED_CREDIT, PUBLIC_COVER, RETURN, STATE_RETURN, byYear } from '../content/safetynet';
import { earningsOf, stateOf, yearOf } from './earnings';
import { isoOfCountry } from './documents';
import { drawFromBank, expenseFor, payFromBank } from './household';
import { personalityOf } from './personality';
import { payeeAccount } from './cash';

export const TAX_SEASON_KIND = 'tax.season';
export const TAX_NOTICE_KIND = 'tax.notice';
export const TAX_SFR_KIND = 'tax.substitute';

/**
 * A return never filed that owes: the IRS files one for them, a substitute
 * for return, from what employers and banks reported (the CP2566 notice), and
 * it's theirs to replace with their own until the Notice of Deficiency's 90
 * days run out; then it's assessed, with the penalty for filing late and the
 * interest from the due date, and collected as any balance is. SLATE's
 * estimates: the year after the due date it comes, the 30 days to answer the
 * CP2566 before the 90 of the notice, and the figures SLATE's own return
 * reaches, the IRS's taking only the standard deduction. Until 2026-09-28 a
 * return never filed was never asked for: a careless life filed none in 35
 * years and nothing came of it.
 */
export const SUBSTITUTE = {
  afterDays: 365,
  answerDays: 30 + 90,
  source: 'https://www.irs.gov/individuals/understanding-your-cp2566-notice',
} as const;

/**
 * The IRS's interest and collection on a balance owed: 7% a year for
 * individuals' underpayments, compounded daily (the rate for the fourth
 * quarter of 2026, held there); reminders about five weeks apart, the final
 * notice's 30 days, and a levy on the bank accounts after it, again each
 * quarter while anything is owed (SLATE's estimate of how often; the IRS
 * levies until it's paid). A bank holds a levied account 21 days before it
 * pays the IRS; SLATE takes it on the day.
 */
export const COLLECTION = {
  interest: 0.07,
  noticeWeeks: 5,
  finalDays: 30,
  againDays: 91,
  notices: [
    { code: 'CP501', title: 'A Reminder From The IRS', words: 'you still owe it, with the interest and penalty since.' },
    { code: 'CP503', title: 'A Second Reminder From The IRS', words: 'it has not heard from you, and expects it paid.' },
    { code: 'CP504', title: 'The IRS Intends To Levy', words: 'it may take a state refund and certain federal payments without further notice.' },
    { code: 'LT11', title: 'Final Notice Of Intent To Levy', words: 'in 30 days it takes what you owe from your bank accounts.' },
  ],
  source: 'https://www.irs.gov/newsroom/interest-rates-remain-the-same-for-the-fourth-quarter-of-2026; https://www.irsproblemsolve.com/2026/03/24/cp14-cp501-cp503-cp504-lt11/',
} as const;

/** What a return owes at a moment: the balance, its interest since it was last brought up to date, and the late-payment penalty's months since. */
export function owedOn(r: TaxReturn, at: Instant): Money {
  if (!r.owed) return 0;
  const from = r.accruedAt ?? r.filedAt ?? at;
  const days = Math.max(0, (at - from) / MS_DAY);
  const interest = r.owed * ((1 + COLLECTION.interest / 365) ** days - 1);
  const months = Math.ceil(Math.max(0, at - (r.filedAt ?? at)) / (30.4375 * MS_DAY));
  const rate = Math.min(RETURN.lateCap, RETURN.payLateMonthly * months);
  const penalty = Math.max(0, rate - (r.payLateRate ?? 0)) * (r.base ?? r.owed);
  return Math.round(r.owed + interest + penalty);
}

/** Brings a return's balance up to a moment. */
function accrue(r: TaxReturn, at: Instant): void {
  if (!r.owed) return;
  const months = Math.ceil(Math.max(0, at - (r.filedAt ?? at)) / (30.4375 * MS_DAY));
  const owed = owedOn(r, at);
  r.base ??= r.owed;
  r.payLateRate = Math.max(r.payLateRate ?? 0, Math.min(RETURN.lateCap, RETURN.payLateMonthly * months));
  r.owed = owed;
  r.accruedAt = at;
}

/** The next step of the IRS's collection on a return, on the calendar. */
function nextNotice(sim: Simulation, person: Person, r: TaxReturn): void {
  const step = r.collection ?? 0;
  const wait = step < COLLECTION.notices.length ? COLLECTION.noticeWeeks * 7 : step === COLLECTION.notices.length ? COLLECTION.finalDays : COLLECTION.againDays;
  sim.schedule({ at: sim.now + wait * MS_DAY, kind: TAX_NOTICE_KIND, label: 'The IRS', category: 'system', priority: 20, payload: { personId: person.id, year: r.year } });
}
export const TAX_DUE_KIND = 'tax.due';
export const TAX_REFUND_KIND = 'tax.refund';

const HOME = 'America/New_York';
const usd = (cents: Money, into: string) => (into === 'USD' ? cents : exchange(cents, 'USD', into) ?? cents);

export interface TaxReturn {
  year: number;
  due: Instant;
  figures: ReturnFigures;
  filedAt?: Instant;
  penalty?: Money;
  /** What's still owed after filing, if the bank couldn't pay it, as of `accruedAt`. */
  owed?: Money;
  /** The unpaid tax the late-payment penalty is a share of, the share already charged, and when the balance was last brought up to date. */
  base?: Money;
  payLateRate?: number;
  accruedAt?: Instant;
  /** How far the IRS's collection has gone: its notices sent, and a levy made. */
  collection?: number;
  /** Filed by the IRS, never by them (`SUBSTITUTE`). */
  substitute?: boolean;
  refund?: Money;
  refundAt?: Instant;
}

export interface ReturnFigures {
  cityId: string;
  acting: Money;
  workStudy: Money;
  unemployment: Money;
  /** A scholarship's taxable part. */
  scholarship?: Money;
  /** Interest the banks paid. */
  interest?: Money;
  /** A pension paid. */
  pension?: Money;
  /** Rent less its costs and depreciation, a loss only as far as it's allowed; a sale's gain taxed as income, and a long-term one; what was kept free. */
  rental?: Money;
  gainShort?: Money;
  gainLong?: Money;
  gainExcluded?: Money;
  /** Itemized deductions, where they beat the standard one; the tax on a long-term gain and investment income. */
  itemized?: Money;
  gainTax?: Money;
  income: Money;
  deduction: Money;
  incomeTax: Money;
  /** Of it, the federal tax, and each state's and town's, with the credit a home state gives for another's. */
  federal: Money;
  /** The US credit for another country's tax, and what Canada gives back under its treaty threshold. */
  foreignCredit: Money;
  foreignRefund: Money;
  states: { state: string; tax: Money; credit: Money }[];
  local: Money;
  payroll: Money;
  credit: Money;
  /** Connecticut's 2026 Temporary Premium Assistance (`ENHANCED_CREDIT`), settled with the return. */
  stateAssistance?: Money;
  mandate: Money;
  withheld: Money;
  /** Positive owed, negative due back. */
  balance: Money;
}

export function returnsOf(person: Person): Record<string, TaxReturn> {
  person.returns ??= {};
  return person.returns;
}

/** A year's deadline: 15 April, or the next business day, with Emancipation Day observed. */
export function deadline(year: number): Instant {
  const filing = year + 1;
  const dow = (d: number) => new Date(Date.UTC(filing, 3, d)).getUTCDay();
  const emancipation = dow(16) === 6 ? 15 : dow(16) === 0 ? 17 : 16;
  let day = 15;
  while (dow(day) === 0 || dow(day) === 6 || day === emancipation) day += 1;
  return instantFromZoned({ year: filing, month: 4, day, hour: 23, minute: 59 }, HOME);
}

/** The enhanced credits' applicable percentage at a share of the poverty line (2021–2025), which Connecticut's assistance reads. */
export function enhancedPercent(ratio: number): number {
  let low = 1;
  for (const [upTo, from, to] of ENHANCED_CREDIT.bands) {
    if (ratio <= upTo) return from + ((to - from) * (Math.max(ratio, low) - low)) / (upTo - low);
    low = upTo;
  }
  return ENHANCED_CREDIT.above;
}

/** The applicable percentage of income at a share of the poverty line, in a year (later years hold). */
export function applicablePercent(year: number, ratio: number): number | undefined {
  // Over 400% of the poverty line there's none: the last band ends there.
  if (ratio < 1) return undefined;
  const bands = PREMIUM_CREDIT.bands[Math.min(2027, Math.max(2026, year))]!;
  let low = 1;
  for (const [upTo, from, to] of bands) {
    if (ratio <= upTo) return from + ((to - from) * (ratio - low)) / (upTo - low);
    low = upTo;
  }
  return undefined;
}

/**
 * Connecticut's tax on a year's income (`CONNECTICUT`): nothing at $15,000
 * or less; else the exemption, the rates, the add-back past $56,500, and the
 * personal credit's share off.
 */
export function connecticutTax(income: Money, into = 'USD'): Money {
  const $ = (c: Money) => usd(c, into);
  const c = CONNECTICUT;
  // Nothing at $15,000 or less: the exemption covers it all.
  const over = Math.max(0, income - $(c.exemptionFrom));
  const exemption = Math.max(0, $(c.exemption) - Math.ceil(over / $(1_000_00)) * $(1_000_00));
  const taxable = Math.max(0, income - exemption);
  let tax = 0;
  for (const [n, [from, rate]] of c.brackets.entries()) {
    const to = c.brackets[n + 1]?.[0];
    if (taxable <= $(from)) break;
    tax += (Math.min(taxable, to === undefined ? taxable : $(to)) - $(from)) * rate;
  }
  const addBack = income <= $(c.addBackFrom) ? 0 : Math.min($(c.addBackMax), Math.ceil((income - $(c.addBackFrom)) / $(5_000_00)) * $(c.addBackStep));
  const credit = c.credit.find(([upTo]) => income <= $(upTo))?.[1] ?? 0;
  return Math.round((tax + addBack) * (1 - credit));
}

/** A year's return, worked out. */
/** Tax over bands, each band's upper edge and its rate. */
export function banded(income: Money, bands: readonly (readonly [number, number])[]): Money {
  let tax = 0;
  let from = 0;
  for (const [upTo, rate] of bands) {
    if (income <= from) break;
    tax += (Math.min(income, upTo) - from) * rate;
    from = upTo;
  }
  return Math.round(tax);
}

/**
 * Canada's tax under a section 216.1 election, in dollars of the save: the
 * federal brackets on the net of the Canadian gross; each province's tax on
 * the whole net, with Ontario's surtax on its own, taken in the share of the
 * gross earned there (Form T2203); the 48% federal surtax on the share no
 * province takes; and the basic personal amounts' credits only where
 * Canadian income is 90% of the year's.
 */
export function canadaElected(gross: Money, commission: Money, world: Money, into: string, byRegion: Readonly<Record<string, Money>> = {}): Money {
  const c = ABROAD.canada;
  const toCad = (m: Money) => exchange(m, into, 'CAD') ?? m;
  const net = Math.max(0, toCad(gross - commission));
  const mostly = gross >= c.residentShare * world;
  const basic = Math.max(0, banded(net, c.brackets) - (mostly ? Math.round(c.basicPersonal * c.brackets[0]![1]) : 0));
  let provincial = 0;
  let placed = 0;
  for (const [region, earned] of Object.entries(byRegion)) {
    const p = c.provinces[region];
    if (!p || gross <= 0) continue;
    const share = earned / gross;
    placed += share;
    const own = Math.max(0, banded(net, p.brackets) - (mostly ? Math.round(p.basicPersonal * p.brackets[0]![1]) : 0));
    const surtax = (p.surtax ?? []).reduce((sum, [over, rate]) => sum + Math.max(0, own - over) * rate, 0);
    provincial += (own + surtax) * share;
  }
  const cad = Math.round(basic + provincial + basic * c.surtax * Math.max(0, 1 - placed));
  return exchange(cad, 'CAD', into) ?? cad;
}

/**
 * Who of the non-resident keeps the UK's personal allowance: a British or EEA
 * citizen (gov.uk, "Tax on your UK income if you live abroad"). A US citizen
 * doesn't, since the UK-US treaty grants none (HMRC RFIG30570, July 2026).
 */
const UK_ALLOWED = new Set(['uk', 'at', 'be', 'bg', 'hr', 'cy', 'cz', 'dk', 'ee', 'fi', 'fr', 'de', 'gr', 'hu', 'ie', 'it', 'lv', 'lt', 'lu', 'mt', 'nl', 'pl', 'pt', 'ro', 'sk', 'si', 'es', 'se', 'is', 'li', 'no']);
export const ukAllowed = (citizenshipId: string | undefined): boolean => UK_ALLOWED.has(citizenshipId ?? '');

/**
 * The UK's tax on a UK tax year's gross: the bands on it all for a US
 * citizen, who has no personal allowance; for a British or EEA one the
 * allowance first, £1 less for each £2 of income over £100,000, gone at
 * £125,140 (gov.uk, 2026–27). Until 2026-09-28 every player was taxed as a US
 * citizen.
 */
export function ukTaxOn(gross: Money, into: string, allowed = false): Money {
  const toGbp = (m: Money) => exchange(m, into, 'GBP') ?? m;
  const gbp = toGbp(gross);
  const allowance = allowed ? Math.max(0, ABROAD.uk.allowance - Math.max(0, gbp - ABROAD.uk.taperFrom) / 2) : 0;
  const tax = banded(Math.max(0, gbp - allowance), ABROAD.uk.bands);
  return exchange(tax, 'GBP', into) ?? tax;
}

/** Income before a home's rent and gains, which the passive loss allowance reads. */
const incomeBefore = (person: Person, year: number): Money => {
  const y = yearOf(person, year);
  return y.acting + y.workStudy + y.unemployment + (y.scholarship ?? 0) + (y.interest ?? 0) + (y.pension ?? 0);
};

/**
 * A year's rent less its costs as the return takes it: a profit less any loss
 * carried from before; a loss only to $25,000 less half of income over
 * $100,000, the rest carried forward to the next profit.
 */
export function rentalAllowed(person: Person, year: number, into = 'USD'): Money {
  const years = Object.keys(earningsOf(person).years).map(Number).filter((y) => y <= year).sort((a, b) => a - b);
  let carry = 0;
  let allowed = 0;
  for (const yr of years) {
    const y = yearOf(person, yr);
    const net = (y.rentalRent ?? 0) - (y.rentalCosts ?? 0);
    if (y.rentalDisposed) {
      // A let home sold: the losses held back are all let go against other income that year (§469(g)).
      allowed = net - carry;
      carry = 0;
    } else if (net >= 0) {
      const used = Math.min(carry, net);
      carry -= used;
      allowed = net - used;
    } else {
      const room = Math.max(0, usd(HOME_TAX.passiveAllowance, into) - HOME_TAX.passivePhaseRate * Math.max(0, incomeBefore(person, yr) - usd(HOME_TAX.passivePhaseFrom, into)));
      allowed = -Math.round(Math.min(-net, room));
      carry += -net + allowed;
    }
  }
  return allowed;
}

/** The cap on state and local taxes a year: the 2025 act's, cut by 30% of income over its threshold, to $10,000. */
export function saltCap(year: number, income: Money, into = 'USD'): Money {
  const cap = HOME_TAX.saltCap[Math.max(2025, year)];
  if (cap === undefined) return usd(HOME_TAX.saltFloor, into);
  const from = HOME_TAX.saltPhaseFrom[Math.max(2025, year)]!;
  return Math.max(usd(HOME_TAX.saltFloor, into), usd(cap, into) - Math.round(HOME_TAX.saltPhaseRate * Math.max(0, income - usd(from, into))));
}

export function figuresFor(person: Person, year: number, into = 'USD', filedAt?: Instant): ReturnFigures {
  const y = yearOf(person, year);
  const cityId = y.residence ?? person.currentLocationId;
  const at = instantFromZoned({ year, month: 12, day: 31, hour: 12 }, HOME);
  const rental = rentalAllowed(person, year, into);
  const gainShort = y.homeGainShort ?? 0;
  const gainLong = y.homeGain ?? 0;
  const gain1250 = y.homeGain1250 ?? 0;
  const income = incomeBefore(person, year) + rental + gainShort;
  const employers = Object.values(y.employers).filter((pay) => pay >= usd(RETURN.performingArtistEmployerPay, into)).length;
  // Of the rest of the work's costs, the ones there's a receipt for.
  const kept = Math.min(1, RECEIPTS.kept * personalityOf(person, 'receipts'));
  const expenses = y.commission + y.dues + Math.round((y.jobCosts ?? 0) * kept);
  const performer = income <= usd(RETURN.performingArtistIncome, into) && employers >= RETURN.performingArtistEmployers && expenses > RETURN.performingArtistShare * y.acting;
  const deduction = performer ? expenses : 0;
  const taxed = Math.max(0, income - deduction);
  // Work abroad: Canada's comes back under CAD 15,000 in the year, and over it a 216.1 return filed by 30 April gives back what's past its graduated tax; the UK's is settled after its own year. The US credits what stands, to its own tax on that income.
  let foreignIncome = 0;
  let foreignTax = 0;
  let foreignRefund = 0;
  const elect = instantFromZoned({ year: year + 1, month: ABROAD.canada.electBy.month, day: ABROAD.canada.electBy.day, hour: 23 }, HOME);
  for (const [country, f] of Object.entries(y.foreign)) {
    foreignIncome += f.gross;
    let back = 0;
    if (country === 'ca') {
      if (f.gross <= (exchange(ABROAD.canada.treatyCad, 'CAD', into) ?? ABROAD.canada.treatyCad)) back = f.withheld;
      else if (filedAt === undefined || filedAt <= elect) {
        const commission = y.acting > 0 ? Math.round(y.commission * (f.gross / y.acting)) : 0;
        // Where in Canada it was earned, by province.
        const byRegion: Record<string, Money> = {};
        for (const [city, earned] of Object.entries(y.foreignWhere ?? {})) {
          const place = CITIES.get(city);
          if (place?.countryId === 'ca') byRegion[place.parentId] = (byRegion[place.parentId] ?? 0) + earned;
        }
        back = Math.max(0, f.withheld - canadaElected(f.gross, commission, income, into, byRegion));
      }
    }
    foreignRefund += back;
    foreignTax += f.withheld - back;
  }
  // Each state: what came while living there, and wages for work done there, over all of it.
  const states = new Map<string, { city: string; resident: Money; source: Money }>();
  const entry = (state: string, city: string) => { if (!states.has(state)) states.set(state, { city, resident: 0, source: 0 }); return states.get(state)!; };
  for (const [city, amount] of Object.entries(y.byResidence)) entry(stateOf(city), city).resident += amount;
  for (const [key, amount] of Object.entries(y.elsewhere)) { const city = key.split('>')[1]!; entry(stateOf(city), city).source += amount; }
  const lastState = stateOf(cityId);
  // A home's rent and gains go to the state they lived in at the year's end, which taxes a long-term gain as income too.
  const homeIncome = rental + gainShort + gainLong + gain1250;
  if (homeIncome !== 0) entry(lastState, cityId).resident += homeIncome;
  const stateTaxed = Math.max(0, taxed + gainLong + gain1250);
  // California doesn't tax unemployment, which goes to where they lived at the year's end.
  const benefitOut = (state: string) => (state === 'us-ca' && lastState === 'us-ca' ? y.unemployment : 0);
  // New York and California let the job's costs be itemized above 2% of income, where that beats the standard deduction.
  const itemized = Math.max(0, expenses - STATE_DEDUCTIONS.floor * income) + (y.homeInterest ?? 0) + (y.homeTax ?? 0);
  const extra = (state: string) => Math.max(0, itemized - usd(STATE_DEDUCTIONS.standard[state] ?? Number.POSITIVE_INFINITY, into));
  const full = (state: string) => {
    const base = Math.max(0, stateTaxed - benefitOut(state));
    // Connecticut's own schedule; SLATE's tax table carries none for it.
    if (state === 'us-ct') return connecticutTax(base, into);
    return computeAnnualTax(base, states.get(state)!.city, at, { deductions: extra(state), currency: into }).regional;
  };
  const taxes = new Map<string, number>();
  for (const [state, part] of states) {
    const own = Math.max(0, part.resident + part.source - benefitOut(state));
    let tax = stateTaxed > 0 ? Math.round(full(state) * Math.min(1, own / Math.max(1, stateTaxed - benefitOut(state)))) : 0;
    // Georgia leaves a nonresident's small wages alone.
    if (state === 'us-ga' && part.resident === 0 && part.source <= Math.min(usd(STATE_RETURN.georgiaExempt, into), STATE_RETURN.georgiaExemptShare * y.acting)) tax = 0;
    taxes.set(state, tax);
  }
  // The home state credits another's tax on the same wages, to its own tax on them.
  const credits = new Map<string, number>();
  for (const [key, amount] of Object.entries(y.elsewhere)) {
    const [lived, city] = key.split('>') as [string, string];
    const worked = stateOf(city);
    if (!states.has(lived) || !taxes.get(worked)) continue;
    const part = states.get(worked)!;
    const theirs = taxes.get(worked)! * (amount / Math.max(1, part.resident + part.source));
    const ours = stateTaxed > 0 ? full(lived) * (amount / stateTaxed) : 0;
    credits.set(lived, (credits.get(lived) ?? 0) + Math.round(Math.min(theirs, ours)));
  }
  const stateLines = [...states.keys()].map((state) => ({ state, tax: taxes.get(state) ?? 0, credit: Math.min(taxes.get(state) ?? 0, credits.get(state) ?? 0) }));
  // A city's own tax, New York City's, only on what came while living in it.
  const local = taxed > 0 ? Object.entries(y.byResidence).reduce((sum, [city, amount]) => sum + Math.round(computeAnnualTax(taxed, city, at, { currency: into }).local * (amount / taxed)), 0) : 0;
  const stateAndLocal = stateLines.reduce((sum, l) => sum + l.tax - l.credit, 0) + local;
  // Federal: itemized where a home's interest, its taxes and the state's to their cap, and from 2026 its mortgage insurance, beat the standard deduction.
  const standard = usd(federalStandardDeduction(cityId, at), into);
  const pmiShare = Math.max(0, 1 - 0.1 * Math.ceil(Math.max(0, income - usd(HOME_TAX.pmiPhaseFrom, into)) / usd(HOME_TAX.pmiPhaseStep, into)));
  const itemizedFederal = (y.homeInterest ?? 0) + Math.min(saltCap(year, income + gainLong, into), (y.homeTax ?? 0) + stateAndLocal) + (year >= HOME_TAX.pmiFrom ? Math.round((y.homePmi ?? 0) * pmiShare) : 0);
  const itemizing = (y.homeInterest ?? 0) + (y.homeTax ?? 0) > 0 && itemizedFederal > standard;
  const beyond = itemizing ? itemizedFederal - standard : 0;
  const federalBefore = computeAnnualTax(taxed, cityId, at, { currency: into, ...(beyond > 0 ? { deductions: beyond } : {}) }).federal;
  // A long-term gain on top of the rest, at 0%, 15% and 20%; and 3.8% on investment income over $200,000.
  const ordinary = Math.max(0, taxed - standard - beyond);
  let gainTax = 0;
  let from = 0;
  for (const [upTo, rate] of HOME_TAX.ltcg[Math.min(2026, Math.max(2025, year))]!) {
    const edge = upTo === Number.POSITIVE_INFINITY ? upTo : usd(upTo, into);
    gainTax += Math.max(0, Math.min(ordinary + gainLong, edge) - Math.max(ordinary, from)) * rate;
    from = edge;
  }
  // The recaptured depreciation: as income, but at 25% at most.
  if (gain1250 > 0) {
    const withIt = computeAnnualTax(taxed + gain1250, cityId, at, { currency: into, ...(beyond > 0 ? { deductions: beyond } : {}) }).federal;
    gainTax += Math.min(Math.round(gain1250 * HOME_TAX.recaptureRate), withIt - federalBefore);
  }
  const investment = gainLong + gain1250 + gainShort + Math.max(0, rental) + (y.interest ?? 0);
  gainTax = Math.round(gainTax + HOME_TAX.niitRate * Math.min(investment, Math.max(0, taxed + gainLong + gain1250 - usd(HOME_TAX.niitFrom, into))));
  const foreignCredit = taxed > 0 ? Math.min(foreignTax, Math.round(federalBefore * Math.min(1, foreignIncome / taxed))) : 0;
  const federal = federalBefore - foreignCredit + gainTax;
  const incomeTax = federal + stateAndLocal;
  // Payroll tax is on the acting wages alone: a student's work-study and a benefit carry none.
  const payroll = computeAnnualTax(y.acting, cityId, at, { currency: into }).payroll;
  const premiums = person.health?.premiums[year] ?? [];
  // The poverty line the year's cover reads is the year before's; a person Medicaid or the Essential Plan would take gets no credit.
  const ratio = income / usd(byYear(POVERTY_LINE, year - 1), into);
  const program = ratio <= PUBLIC_COVER.medicaidShare || (lastState === 'us-ny' && ratio <= PUBLIC_COVER.essentialShare);
  const pct = program ? undefined : applicablePercent(year, ratio);
  const credit = pct === undefined ? 0 : premiums.reduce((sum, premium) => sum + Math.max(0, Math.round(premium - (pct * income) / 12)), 0);
  // Connecticut's 2026 assistance: what the expired enhanced credits would have added, in full or half by income.
  const ct = ENHANCED_CREDIT.connecticut;
  const share = lastState === 'us-ct' && year === ct.year && !program ? (ratio > ct.full[0] && ratio <= ct.full[1] ? 1 : ratio > ct.half[0] && ratio <= ct.half[1] ? 0.5 : 0) : 0;
  const enhanced = share ? premiums.reduce((sum, premium) => sum + Math.max(0, Math.round(premium - (enhancedPercent(ratio) * income) / 12)), 0) : 0;
  const stateAssistance = Math.round(Math.max(0, enhanced - credit) * share);
  const months = person.health?.uncoveredInCalifornia[year] ?? 0;
  const mandate = months * Math.round(Math.min(usd(CALIFORNIA_MANDATE.bronzeMonth, into), Math.max(usd(CALIFORNIA_MANDATE.flat, into), CALIFORNIA_MANDATE.share * income) / 12));
  return {
    cityId, acting: y.acting, workStudy: y.workStudy, unemployment: y.unemployment, scholarship: y.scholarship ?? 0, interest: y.interest ?? 0, pension: y.pension ?? 0,
    rental, gainShort, gainLong: gainLong + gain1250, gainExcluded: y.homeGainExcluded ?? 0, itemized: itemizing ? itemizedFederal : 0, gainTax, income, deduction,
    incomeTax, federal, foreignCredit, foreignRefund, states: stateLines, local, payroll, credit, ...(stateAssistance ? { stateAssistance } : {}), mandate, withheld: y.withheld,
    balance: incomeTax + payroll + mandate - y.withheld - credit - stateAssistance,
  };
}

/** The late penalties on a balance filed at a moment: 4.5% a month or part for filing and 0.5% for paying, each to 25%, and the minimum past 60 days. */
export function latePenalty(balance: Money, due: Instant, filedAt: Instant, into = 'USD'): Money {
  if (balance <= 0 || filedAt <= due) return 0;
  const months = Math.ceil((filedAt - due) / (30.4375 * MS_DAY));
  // Paying late runs to a quarter of the balance; filing late is 5% a month to five months, less the paying-late half-point it runs beside, so 22.5% (IRC §6651(a), (c)).
  const payLate = Math.min(RETURN.lateCap, RETURN.payLateMonthly * months) * balance;
  let fileLate = Math.min(5, months) * (RETURN.lateMonthly - RETURN.payLateMonthly) * balance;
  if (filedAt - due > RETURN.lateMinimumAfterDays * MS_DAY) fileLate = Math.max(fileLate, Math.min(usd(RETURN.lateMinimum, into), balance));
  return Math.round(payLate + fileLate);
}

/** Each February, from the one after the business began. */
/** A balance owed with no collection on the calendar, as a save from before 2026-09-28 holds one: it begins now. */
export function armCollection(sim: Simulation, person: Person): void {
  for (const r of Object.values(person.returns ?? {})) {
    // Owing, unfiled and past due, with nothing coming of it: the IRS's substitute return, on the calendar.
    if (r.filedAt === undefined && r.figures.balance > 0 && r.due < sim.now && !sim.universe.scheduled.some((i) => i.kind === TAX_SFR_KIND && i.status === 'pending' && i.payload.personId === person.id && i.payload.year === r.year)) {
      sim.schedule({ at: Math.max(sim.now + MS_DAY, r.due + SUBSTITUTE.afterDays * MS_DAY), kind: TAX_SFR_KIND, label: `The IRS On Your ${r.year} Return`, category: 'system', priority: 20, payload: { personId: person.id, year: r.year, step: 'proposed' } });
    }
    if (!r.owed || sim.universe.scheduled.some((i) => i.kind === TAX_NOTICE_KIND && i.status === 'pending' && i.payload.personId === person.id && i.payload.year === r.year)) continue;
    r.accruedAt ??= sim.now;
    nextNotice(sim, person, r);
  }
}

/** Whether a year asks a US return of them: a citizen, or anyone with wages or benefit earned in the US. */
export function owesUsReturn(person: Person, year: number): boolean {
  if (isoOfCountry(person.citizenshipId) === 'US' || person.citizenshipId === undefined) return true;
  const y = earningsOf(person).years[year];
  if (!y) return false;
  if (y.bySource === undefined) return y.acting + y.workStudy + y.unemployment > 0;
  return (y.bySource.us ?? 0) + y.workStudy + y.unemployment > 0;
}

export function armTaxes(sim: Simulation, person: Person): void {
  armCollection(sim, person);
  if (sim.universe.scheduled.some((i) => i.kind === TAX_SEASON_KIND && i.status === 'pending' && i.payload.personId === person.id)) return;
  const p = zonedParts(sim.now, HOME);
  const next = instantFromZoned({ year: p.month >= 2 ? p.year + 1 : p.year, month: 2, day: 1, hour: 9 }, HOME);
  sim.schedule({ at: next, kind: TAX_SEASON_KIND, label: 'Tax Season', category: 'system', priority: 7, payload: { personId: person.id } });
}

/**
 * The UK's years settled with its return, due 31 January after the April
 * the year ended: under the treaty's $20,000 all that was withheld comes
 * back; over it, the tax on the whole, less what was withheld, is paid or
 * refunded. What changes goes into the calendar year's foreign tax, for
 * the US credit.
 */
export function settleUkYears(sim: Simulation, person: Person, calendarYear: number): void {
  const r = earningsOf(person);
  const cur = saveCurrency(sim.universe);
  const account = person.primaryAccountId ? sim.universe.accounts[person.primaryAccountId] : undefined;
  for (const [key, gross] of Object.entries(r.ukYears ?? {})) {
    // The year from April key to April key + 1 files by 31 January key + 2.
    if (Number(key) + 2 > calendarYear || r.ukSettled?.includes(key)) continue;
    const withheld = r.ukWithheld?.[key] ?? 0;
    const tax = gross <= usd(ABROAD.uk.treatyUsd, cur) ? 0 : ukTaxOn(gross, cur, ukAllowed(person.citizenshipId));
    const change = tax - withheld;
    // With no account to pay or refund through it waits for the next year's;
    // until 2026-09-27 it was marked settled and never paid.
    if (change !== 0 && !account) continue;
    (r.ukSettled ??= []).push(key);
    if (change === 0 || !account) continue;
    const uk = (yearOf(person, calendarYear).foreign.uk ??= { gross: 0, withheld: 0 });
    uk.withheld += change;
    const memo = change < 0 ? `HMRC refund, UK tax year ${key}–${String(Number(key) + 1).slice(2)}` : `HMRC, UK tax year ${key}–${String(Number(key) + 1).slice(2)}`;
    sim.post({ memo, category: 'tax', postings: [{ accountId: account.id, amount: -change }, { accountId: sim.nominalAccount(change < 0 ? 'income' : 'expense', change < 0 ? 'Tax Refund' : 'Foreign Tax Withheld').id, amount: change }] });
    if (person.id === sim.universe.playerId) sim.notify({ category: 'tax', title: change < 0 ? 'The UK Gave Tax Back' : 'The UK Took Its Balance', body: `Your ${key}–${String(Number(key) + 1).slice(2)} UK tax year: ${formatMoney(Math.abs(change), cur)} ${change < 0 ? 'back' : 'paid'}, ${tax === 0 ? 'the treaty leaving it untaxed' : `on ${formatMoney(tax, cur)} of UK tax`}.`, importance: 70, route: '/workspace/papers' });
  }
}

export function registerTaxReturn(sim: Simulation): void {
  sim.onSchedule(TAX_SEASON_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (!person) return;
    const p = zonedParts(item.at, HOME);
    s.schedule({ at: instantFromZoned({ year: p.year + 1, month: 2, day: 1, hour: 9 }, HOME), kind: TAX_SEASON_KIND, label: 'Tax Season', category: 'system', priority: 7, payload: { personId: person.id } });
    const year = p.year - 1;
    const cur = saveCurrency(s.universe);
    // A UK tax year whose return fell due yesterday, 31 January, is settled first, into this year's foreign tax.
    settleUkYears(s, person, p.year);
    // The US taxes a citizen on everything, and anyone else on what they earned
    // in the US: someone who isn't a citizen and earned nothing there that year
    // has no US return. Until 2026-09-29 a British actor working in London was
    // given one on their pounds.
    if (!owesUsReturn(person, year)) return;
    const figures = figuresFor(person, year, cur);
    // Nothing owed and nothing due back: no return to file.
    if (figures.balance === 0 && figures.income === 0 && figures.foreignRefund === 0) return;
    const due = deadline(year);
    returnsOf(person)[year] = { year, due, figures };
    s.schedule({ at: due, kind: TAX_DUE_KIND, label: `Tax Return Due: ${year}`, category: 'personal', priority: 25, payload: { personId: person.id, year } });
    if (person.id !== s.universe.playerId) return;
    s.requireDecision({
      urgency: 70, category: 'taxes', title: `Your ${year} Tax Return`,
      detail: `${figures.balance > 0 ? `You owe ${formatMoney(figures.balance, cur)}` : `${formatMoney(-figures.balance, cur)} comes back to you`} on ${formatMoney(figures.income, cur)} of income. File by ${formatDate(due, HOME)}.`,
      route: '/workspace/papers', dueAt: due, refType: 'return', refId: String(year),
      actions: [{ label: 'File It', commandKind: 'tax.file', payload: { year } }],
    });
  });

  sim.onSchedule(TAX_DUE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const r = person ? returnsOf(person)[String(item.payload.year)] : undefined;
    if (!person || !r || r.filedAt !== undefined) return;
    // Owing and unfiled, the IRS files it for them in a year (`SUBSTITUTE`).
    if (r.figures.balance > 0) s.schedule({ at: r.due + SUBSTITUTE.afterDays * MS_DAY, kind: TAX_SFR_KIND, label: `The IRS On Your ${r.year} Return`, category: 'system', priority: 20, payload: { personId: person.id, year: r.year, step: 'proposed' } });
    if (person.id !== s.universe.playerId) return;
    s.notify({ category: 'tax', title: `Your ${r.year} Return Is Late`, body: r.figures.balance > 0 ? `Each month late adds 5% of what you owe, to a quarter of it; past 60 days, at least ${formatMoney(usd(RETURN.lateMinimum, saveCurrency(s.universe)), saveCurrency(s.universe))}.` : 'A refund waits for the return; there’s no penalty on one.', importance: 80, route: '/workspace/papers' });
  });

  sim.onSchedule(TAX_SFR_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const r = person ? returnsOf(person)[String(item.payload.year)] : undefined;
    if (!person || !r || r.filedAt !== undefined) return;
    const cur = saveCurrency(s.universe);
    const late = Math.max(0, (s.now - r.due) / MS_DAY);
    const penalty = latePenalty(r.figures.balance, r.due, s.now, cur);
    const interest = Math.round(r.figures.balance * ((1 + COLLECTION.interest / 365) ** late - 1));
    const total = r.figures.balance + penalty + interest;
    if (item.payload.step === 'proposed') {
      if (person.id === s.universe.playerId) s.notify({ category: 'tax', title: `The IRS Figured Your ${r.year} Return`, body: `Notice CP2566: with no return from you, the IRS worked out ${formatMoney(total, cur)} from what your employers and banks reported, with the penalty for filing late and the interest. File your own within ${SUBSTITUTE.answerDays} days to replace it.`, importance: 90, route: '/workspace/papers' });
      s.schedule({ at: s.now + SUBSTITUTE.answerDays * MS_DAY, kind: TAX_SFR_KIND, label: `The IRS On Your ${r.year} Return`, category: 'system', priority: 20, payload: { personId: person.id, year: r.year, step: 'assessed' } });
      return;
    }
    // Unanswered: assessed as the IRS figured it, and collected.
    r.filedAt = s.now;
    r.penalty = penalty;
    r.substitute = true;
    r.owed = total;
    r.base = r.figures.balance;
    r.accruedAt = s.now;
    r.collection = 0;
    // Its File It lapsed on the due date (`expireDecisions`); the Taxes screen's is gone once it's filed.
    if (person.id === s.universe.playerId) s.notify({ category: 'tax', title: `The IRS Assessed Your ${r.year} Return`, body: `${formatMoney(total, cur)} is owed as the IRS figured it, and its collection begins.`, importance: 90, route: '/workspace/papers' });
    nextNotice(s, person, r);
  });

  sim.onSchedule(TAX_NOTICE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const r = person ? returnsOf(person)[String(item.payload.year)] : undefined;
    if (!person || !r?.owed) return;
    accrue(r, s.now);
    const cur = saveCurrency(s.universe);
    const step = r.collection ?? 0;
    if (step < COLLECTION.notices.length) {
      const n = COLLECTION.notices[step]!;
      r.collection = step + 1;
      if (person.id === s.universe.playerId) s.notify({ category: 'tax', title: n.title, body: `Notice ${n.code}: ${formatMoney(r.owed, cur)} on your ${r.year} return; ${n.words}`, importance: step >= 2 ? 90 : 75, route: '/workspace/papers' });
      nextNotice(s, person, r);
      return;
    }
    // The levy: what the bank accounts hold, to what's owed.
    const bank = drawFromBank(s, person, r.owed, false, true);
    const taken = r.owed - bank.short;
    if (taken > 0) {
      s.post({ memo: `IRS levy, ${r.year} return`, category: 'tax', postings: [{ accountId: s.nominalAccount('expense', expenseFor('tax')).id, amount: taken }, ...bank.postings] });
      r.owed -= taken;
    }
    r.collection = step + 1;
    if (person.id === s.universe.playerId) s.notify({ category: 'tax', title: 'The IRS Levied Your Accounts', body: `${formatMoney(taken, cur)} taken from your bank accounts for your ${r.year} return${r.owed > 0 ? `; ${formatMoney(r.owed, cur)} is still owed, and it levies again while it is` : ', which is now paid'}.`, importance: 95, route: '/workspace/papers' });
    if (r.owed > 0) nextNotice(s, person, r); else delete r.owed;
  });

  sim.onSchedule(TAX_REFUND_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const r = person ? returnsOf(person)[String(item.payload.year)] : undefined;
    if (!person) return;
    const account = payeeAccount(s, person);
    // Canada's refund of its withholding, under the treaty, beside the IRS's.
    const canada = item.payload.foreign === true ? r?.figures.foreignRefund ?? 0 : 0;
    if (canada) { s.post({ memo: `Canada Revenue Agency refund, ${r!.year}`, category: 'tax', postings: [{ accountId: account.id, amount: canada }, { accountId: s.nominalAccount('income', 'Tax Refund').id, amount: -canada }] }); return; }
    if (!r?.refund) return;
    s.post({ memo: `Tax refund, ${r.year}`, category: 'tax', postings: [{ accountId: account.id, amount: r.refund }, { accountId: s.nominalAccount('income', 'Tax Refund').id, amount: -r.refund }] });
  });

  sim.onCommand<{ year: number }, { balance: Money; penalty: Money; paid: boolean }>('tax.file', (p, { sim: s }) => {
    const person = s.player;
    const r = returnsOf(person)[String(p.year)];
    if (!r) throw new CommandError('There’s no return for that year.');
    if (r.filedAt !== undefined) throw new CommandError('You’ve filed it.');
    const cur = saveCurrency(s.universe);
    r.figures = figuresFor(person, r.year, cur, s.now);
    r.filedAt = s.now;
    r.penalty = latePenalty(r.figures.balance, r.due, s.now, cur);
    for (const d of Object.values(s.universe.decisions)) if (d.refType === 'return' && d.refId === String(r.year) && !d.resolvedAt) d.resolvedAt = s.now;
    if (r.figures.foreignRefund > 0) s.schedule({ at: s.now + RETURN.refundDays * MS_DAY, kind: TAX_REFUND_KIND, label: `Canada’s Refund: ${r.year}`, category: 'system', priority: 20, payload: { personId: person.id, year: r.year, foreign: true } });
    if (r.figures.balance < 0) {
      r.refund = -r.figures.balance;
      r.refundAt = s.now + RETURN.refundDays * MS_DAY;
      s.schedule({ at: r.refundAt, kind: TAX_REFUND_KIND, label: `Tax Refund: ${r.year}`, category: 'system', priority: 20, payload: { personId: person.id, year: r.year } });
      return { balance: r.figures.balance, penalty: 0, paid: true };
    }
    // Interest runs from the due date on a balance filed late.
    const late = Math.max(0, (s.now - r.due) / MS_DAY);
    const interest = r.figures.balance > 0 ? Math.round(r.figures.balance * ((1 + COLLECTION.interest / 365) ** late - 1)) : 0;
    const total = r.figures.balance + r.penalty + interest;
    const paid = total <= 0 || payFromBank(s, person, total, `Income tax, ${r.year}${r.penalty || interest ? ', with late penalties and interest' : ''}`, 'tax');
    if (!paid) { r.owed = total; r.base = r.figures.balance; r.accruedAt = s.now; r.collection = 0; nextNotice(s, person, r); }
    return { balance: r.figures.balance, penalty: r.penalty, paid };
  });

  sim.onCommand<{ year: number }, { paid: Money }>('tax.pay', (p, { sim: s }) => {
    const person = s.player;
    const r = returnsOf(person)[String(p.year)];
    if (!r?.owed) throw new CommandError('That year is paid.');
    // Paying late costs 0.5% a month or part from filing, and the IRS's interest from the due date.
    const total = owedOn(r, s.now);
    if (!payFromBank(s, person, total, `Income tax owed, ${r.year}`, 'tax')) throw new CommandError(`${formatMoney(total, saveCurrency(s.universe))} is more than the bank can cover.`);
    delete r.owed;
    for (const one of s.universe.scheduled) if (one.status === 'pending' && one.kind === TAX_NOTICE_KIND && one.payload.personId === person.id && one.payload.year === r.year) s.timeline.cancel(one.id, s.now);
    return { paid: total };
  });
}
