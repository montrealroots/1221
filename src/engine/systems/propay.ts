/**
 * SLATE — the pay for professional work, its commission and its wages, permission to work for each engagement, and the
 * unions' money (from 2026-10-21, the owner's brief 19, D7 and D8; `docs/verification/career-2026-10-20/design.md`, The
 * Work Loop's Pay and Unions, The Agreement's commission, and Work Eligibility).
 *
 * **Promised, then received.** An engagement's payments are promised when its contract is accepted (`ProPayment`,
 * written by the work system) and nothing is posted then. `schedulePay` puts each one on the clock for its `due` under
 * `PAY_KIND`; at that moment it's paid once, keyed by its `key`: the handler pays only a payment with nothing received
 * and nothing in trust, so a reload, a jump past several due dates or the item fired twice can't pay it again. Deferred
 * pay (SAGindie's Student Film Agreement, `work.md` S32) is shown as deferred and never posted.
 *
 * **Where it goes.** Represented when the contract was made (`owedAgreement`: the engagement's own agreement, the one in
 * force on the day it was made, `activeAgreement`, or Equity's sixty-day tail), the gross goes to the agency's client
 * trust account, an account of the player's held by the agency (`trustAccount`), and comes on to the player three
 * business days later less commission. SAG-AFTRA's rule: checks "received in trust" go out "on a (3) three, (5) five,
 * or (7) seven day cycle", three for TV/Theatrical (`representation.md` S1); ASSUMPTION, applied to all covered work,
 * stage included, since New York law sets no deadline (`representation.md` §3, Assumption 8). Unrepresented, it goes
 * straight to where their payments are paid (`payeeAccount`). Every movement is a `sim.post`, so a balance is the sum of
 * its postings, in the save's currency (`inSaveMoney`).
 *
 * **Commission, only when owed** (`commissionOn`), each rule from `representation.md`:
 * - **None unrepresented**, and none on work the agreement doesn't cover: its scope is stage, film and television in the
 *   United States (`AGREEMENT_TERMS`, a simulation term; commercials and voice-over sit elsewhere).
 * - **Equity:** 5% on a weekly salary of $525 or less, 10% above (S28). Its rehearsal period at minimum salary,
 *   commissionable at 5% under Tier II (S28), isn't told apart: the game's pay doesn't split rehearsal weeks from
 *   performance weeks. None on the Equity-minimum part of per diem (S28): no engagement pays per diem.
 * - **SAG-AFTRA:** 10% at most (S3), and only above scale: "an agent must negotiate your fee above the minimum scale…
 *   'scale plus 10%' in order to collect commission on a job" (S3). So the commission is the lesser of 10% of the gross
 *   and what the gross is over scale: an offer at scale plus ten pays the actor scale and the agent the ten.
 * - **Anything else covered:** 10%, New York's cap on a theatrical agency's fee "for a single engagement" (GBL §185(8)).
 * - **Continuing:** owed on a contract made during the term, whoever represents the player when it's paid, after the
 *   agreement ends (Equity, S29: "entered into by the Actor prior to the effective date"); and on an offer the agent
 *   conveyed in the term and the player accepted within sixty days of it after the term (Equity's form, S30 ¶4).
 *   Renewals aren't a thing an engagement does in the game, so their rule has nothing to read.
 *
 * **Wages, as wages.** Union work is W-2 employment (`work.md` S22: "Union actors are not independent contractors; they
 * are employees of the production"), and the game pays non-union work the same way, its producers using a payroll
 * (ASSUMPTION: S45's common-law test isn't modeled). Paid on the Thursday after each week's work (`paydayAfter`):
 * SAG-AFTRA's "Payment is due on Thursday… for work performed through the previous Saturday" (`representation.md` S5,
 * which cites the General Provisions without naming the contract), applied to all W-2 work, an ASSUMPTION. Posted with
 * category 'salary' and reported through `recordWages` with the employer, what was withheld and for whom, the
 * commission, the dues and where the work was done:
 * - **Withheld** as the Summer Cabaret's stipend is (`systems/school.ts`): federal income tax and payroll tax on the
 *   year's wages so far, a nonresident alien's with the standard deduction added back and no FICA (`work.md` S14:
 *   F-1 nonresident aliens are exempt on practical-training wages); the state the work is done in, its own tax on the
 *   wages earned there, which New York withholds from "nonresidents being paid wages for services performed within the
 *   state" (S46); New York City's from its residents only (S46, S47). Connecticut's on work in New York isn't withheld:
 *   the game's tax code doesn't say when an out-of-state employer withholds for Connecticut, so the return settles it.
 * - **Counted** as the return counts it (`figuresFor`, `systems/taxreturn.ts`): the work's town (`where`) puts New York
 *   work by a Connecticut resident under `elsewhere`, so New York taxes it as a nonresident's and Connecticut credits
 *   that tax (Schedule 2, S48); New York City's tax reads only where they lived (`byResidence`). A town the gazetteer
 *   doesn't hold, such as Providence, can't be read by the return, so its wages are counted where they live and the Work
 *   tab says so.
 * - **Hours** in the memo, eight a day of the week's work (ASSUMPTION), which `workedBetween` reads.
 *
 * **Permission to work** (`eligibilityRead`): `usWorkAuthorized` for each date of an engagement, read when it's booked
 * and kept on it, so Papers says what was read then. A citizen or a green-card holder may work; an F-1 student may work
 * only on campus, since Yale grants CPT only for training the whole program requires and none is found for Acting
 * (`yale.md` §6); after the degree OPT covers its twelve months, each engagement's days counted as days worked against
 * its ninety without work (`daysWorkedIn`, `systems/permission.ts`; 8 CFR 214.2, SEVP's 2010 guidance allowing gigs,
 * `work.md` S1, S5). Signing with an agent changes none of it.
 *
 * **The unions' money.** Equity at the degree (the Bulletin, as `setStanding` dates it): its initiation fee, "$1,800 paid
 * within a maximum three-year period", $600 down (S27), charged when the membership begins, and the other $1,200 in two
 * parts a year and two years on (ASSUMPTION: equal parts inside the three years); basic dues, "$176 annually, billed at
 * $88 twice a year each May and November" (S27), from the first billing after joining, on its first day (ASSUMPTION);
 * working dues of 2.5% of gross under an Equity contract (S27), taken from the pay (ASSUMPTION: the page gives the rate,
 * not how it's collected). An older graduate's save, its membership dated at a degree before this was built, isn't
 * charged for a past date: on its first opening it's told what's owed, and each part already past is charged at the next
 * billing instead (`equityOnOpening`). SAG-AFTRA: a first SAG-AFTRA principal job, a TV/Theatrical or Low Budget role,
 * makes the actor eligible from its first day (`pro.sag.eligibleSince`; Low Budget productions file Taft-Hartley reports,
 * S22; "Ultra-low budget, student and short films do not qualify", S20, a search engine's copy, which SAGindie's
 * employment verification request, unmodeled, contradicts); a union contract can require membership "on or after the
 * thirtieth day following the beginning of such employment" (29 U.S.C. 158(a)(3), S24), so SAG-AFTRA work from then
 * needs it (`sagWorkRefusal`). Joining, `pro.join_sag`, costs the initiation fee and half a year's base dues, from a
 * search engine's copy of SAG-AFTRA's pages (S20), said so; base dues then each May and November (ASSUMPTION, the
 * secondary-sourced billing); working dues of 1.575% of covered earnings (S20) taken from the pay (ASSUMPTION).
 *
 * Every kind here is `pro.pay.*`, and the work system's calls are `schedulePay` (when an offer is accepted),
 * `eligibilityRead` or `workEligibilityRefusal` (before it is) and `sagWorkRefusal` (for SAG-AFTRA work).
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Account } from '../core/ledger';
import { MS_DAY, MS_HOUR, addDays, formatDate, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { spokenList } from '../core/text';
import { CITIES } from '../content/geography';
import { computeAnnualTax, federalStandardDeduction, LOCAL_TAX } from '../content/tax';
import { exchange } from '../content/currency';
import { AGREEMENT, RATES, UNIONS, projectById, type ProjectKind, type ProjectTemplate, type ProMedium } from '../content/careerwork';
import { agencyOf, agentById } from '../content/agents';
import { activeAgreement, ensurePro, noteEvent, type Agreement, type EligibilityRead, type Engagement, type ProPayment, type UnionBill } from './pro';
import { inSaveMoney } from './banking';
import { payeeAccount } from './cash';
import { homeOf, recordWages, stateOf, yearOf } from './earnings';
import { nonresidentFor, connecticutTax } from './taxreturn';
import { inTheBank, owe, payFromBank } from './spending';
import { businessDaysOn, f1Of, usWorkAuthorized } from './permission';
import { addYears, citizenOf, documentsOf } from './documents';
import { residenceIn } from './residence';
import { schoolEnded } from './school';

// ---------------------------------------------------------------------------------------------------------------------
// The rules
// ---------------------------------------------------------------------------------------------------------------------

/** A payment due: the production's payroll pays it. */
export const PAY_KIND = 'pro.pay.payday';
/** Pay held in the agency's client trust account, passed on less commission. */
export const RELEASE_KIND = 'pro.pay.release';
/** A union's bill. */
export const DUES_KIND = 'pro.pay.dues';
/** The first day of a first SAG-AFTRA principal job: eligible to join from it. */
export const SAG_ELIGIBLE_KIND = 'pro.pay.sag_eligible';
/** Said by the School when the degree makes the actor a member of Equity (`setStanding`), so its fee is charged then. */
export const EQUITY_JOINED = 'pro.equity_joined';

/**
 * Pay day: the Thursday after each week's work, at noon (`representation.md` S5's Thursday, applied to all W-2 work, and
 * the hour, ASSUMPTIONS); a day's work counted as eight hours in the memo (ASSUMPTION); three business days in trust
 * (`AGREEMENT.trustBusinessDays`, S1, applied to all covered work, ASSUMPTION).
 */
export const PAY = { weekday: 4, hour: 12, hoursPerDay: 8, trustBusinessDays: AGREEMENT.trustBusinessDays } as const;

/** Equity bills each May and November (S27); on the first, at nine (ASSUMPTION). SAG-AFTRA's the same (ASSUMPTION). */
export const BILLING = { months: [5, 11] as const, day: 1, hour: 9 } as const;

/** Equity's initiation fee in three equal parts: at joining, a year on and two years on, inside its three years (ASSUMPTION). */
export const EQUITY_PARTS = 3;

/** The union bills kept once settled: the last twelve, six years of dues; an unsettled one is never dropped. */
export const BILLS_KEPT = 12;

/**
 * The SAG-AFTRA work that makes an actor eligible: a principal role under the TV/Theatrical or the Low Budget agreement
 * (S22's Taft-Hartley reports). Ultra Low Budget and student films don't (S20, a search engine's copy).
 */
export const SAG_QUALIFIES: readonly ProjectKind[] = ['network-drama', 'low-budget'];

/** What an agreement's scope covers: stage, film and television (`AGREEMENT_TERMS`, a simulation term), in the US. */
export const COVERED_MEDIA: readonly ProMedium[] = ['stage', 'film', 'television'];

/** SAG-AFTRA's joining: the initiation fee and half a year's base dues (S20, a search engine's copy). */
export const sagJoinUsd = (): Money => UNIONS.sagAftra.initiation + Math.round(UNIONS.sagAftra.yearlyDues / 2);

const usdIn = (sim: Simulation, cents: Money): Money => inSaveMoney(sim, cents, 'USD');
const WORK_ZONE = 'America/New_York';
const zoneOfCity = (cityId: string): string => CITIES.get(cityId)?.timeZone ?? WORK_ZONE;

/** The project an engagement is for. */
export const projectOf = (e: Engagement): ProjectTemplate | undefined => projectById(e.projectId);

/** Noon on a day, in a zone. */
const noonOf = (at: Instant, zone: string): Instant => { const p = zonedParts(at, zone); return instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 12, minute: 0 }, zone); };

/**
 * The payday for work done on a day: the Thursday after the Saturday that ends its week, at noon. Work done any day from
 * Sunday to Saturday is paid the Thursday after (S5). The work system's promised entries take their `due` from here.
 */
export function paydayAfter(workDay: Instant, zone: string = WORK_ZONE): Instant {
  const day = noonOf(workDay, zone);
  const weekday = zonedParts(day, zone).weekday;
  const saturday = addDays(day, (6 - weekday + 7) % 7, zone);
  return addDays(saturday, 5, zone);
}

/** The week a payday pays for: the Sunday to the Saturday before it, its first and last moments. */
export function weekPaidOn(due: Instant, zone: string = WORK_ZONE): { from: Instant; to: Instant } {
  const p = zonedParts(addDays(due, -5, zone), zone);
  const saturday = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: 0, minute: 0 }, zone);
  return { from: addDays(saturday, -6, zone), to: addDays(saturday, 1, zone) };
}

/** The days of an engagement's work inside a stretch, each counted once, in a zone. */
export function engagementDaysIn(e: Engagement, from: Instant, to: Instant, zone: string = WORK_ZONE): number {
  let n = 0;
  for (let d = from; d < to; d = addDays(d, 1, zone)) {
    const end = addDays(d, 1, zone);
    if (e.days.some((x) => x.from < end && x.to > d)) n += 1;
  }
  return n;
}

/** The next of the unions' billing days after a moment: the first of May or November. */
export function nextBilling(after: Instant, zone: string = WORK_ZONE): Instant {
  const y = zonedParts(after, zone).year;
  for (const year of [y, y + 1]) for (const month of BILLING.months) {
    const at = instantFromZoned({ year, month, day: BILLING.day, hour: BILLING.hour, minute: 0 }, zone);
    if (at > after) return at;
  }
  return instantFromZoned({ year: y + 2, month: BILLING.months[0], day: BILLING.day, hour: BILLING.hour, minute: 0 }, zone);
}

const monthKey = (at: Instant, zone: string) => { const p = zonedParts(at, zone); return `${p.year}-${String(p.month).padStart(2, '0')}`; };

// ---------------------------------------------------------------------------------------------------------------------
// Permission to work, for an engagement's dates
// ---------------------------------------------------------------------------------------------------------------------

/** Each day of an engagement's days, at noon, in a zone: the dates permission is read for. */
function datesOf(days: readonly { from: Instant; to: Instant }[], zone: string): Instant[] {
  const out: Instant[] = [];
  for (const d of days) for (let t = noonOf(d.from, zone); t < d.to + 12 * MS_HOUR && out.length < 800; t = addDays(t, 1, zone)) if (!out.includes(t)) out.push(t);
  return out.sort((a, b) => a - b);
}

/** The words for a basis of permission, said for the dates read. */
const STUDENT_WORDS = 'On an F-1 you can work only on campus while you’re a student. Yale grants CPT, permission for outside work during a degree, only for training the whole program requires, and the Acting program has none, so outside acting work, paid or unpaid, has to wait for OPT after your degree.';

/**
 * What permission to work says for each of an engagement's dates (`usWorkAuthorized`, `systems/permission.ts`), as it
 * stands at `at`: authorized only where every date is. Signing with an agent changes none of it: nothing here reads the
 * record's agreements.
 */
export function eligibilityRead(person: Person, days: readonly { from: Instant; to: Instant }[], at: Instant, zone: string = WORK_ZONE): EligibilityRead {
  const dates = datesOf(days, zone);
  const refused = dates.find((d) => !usWorkAuthorized(person, d));
  const last = dates[dates.length - 1];
  const opt = documentsOf(person).filter((d) => d.kind === 'permit' && d.destination === 'US' && d.name.includes('OPT') && d.status === 'valid').sort((a, b) => (b.expiresAt ?? 0) - (a.expiresAt ?? 0))[0];
  const base = { at, authorized: refused === undefined, ...(refused !== undefined ? { refusedFrom: refused } : {}) };
  if (citizenOf(person, 'US')) return { ...base, basis: 'citizen', words: 'You’re a US citizen, so you can work for any employer in the US.' };
  if (dates.some((d) => residenceIn(person, 'US', d)?.route === 'us-green-card')) return { ...base, basis: 'green-card', words: refused === undefined ? 'With your green card you can work for any employer in the US.' : `From ${formatDate(refused, zone)}, this work isn’t covered by your green card.` };
  if (opt && (opt.issuedAt ?? Infinity) <= (dates[0] ?? at) + 12 * MS_HOUR) {
    if (refused === undefined) return { ...base, basis: 'opt', words: `On OPT you can work in the US until ${formatDate(opt.expiresAt!, zone)}. Each day of this work counts as a day worked, not one of OPT’s days without work.` };
    return { ...base, basis: 'opt', words: `This work runs to ${formatDate(last ?? refused, zone)}, past the end of your OPT on ${formatDate(opt.expiresAt ?? refused, zone)}.` };
  }
  const studying = person.school !== undefined && !schoolEnded(person.school.standing);
  if (f1Of(person) && studying) return { ...base, basis: 'student', words: STUDENT_WORDS };
  if (opt && refused !== undefined) return { ...base, basis: 'opt', words: `This work starts on ${formatDate(refused, zone)}, before your OPT does, on ${formatDate(opt.issuedAt!, zone)}.` };
  return { ...base, basis: 'none', words: refused === undefined ? 'You can work for any employer in the US.' : 'There’s no permission to work in the US among your papers for these dates. Papers, under Permission To Work, shows what you hold.' };
}

/** Why work on these days can't be accepted for want of permission to work, or nothing (the work system asks it). */
export function workEligibilityRefusal(person: Person, days: readonly { from: Instant; to: Instant }[], at: Instant): string | undefined {
  const read = eligibilityRead(person, days, at);
  return read.authorized ? undefined : `You can’t accept this work. ${read.words}`;
}

// ---------------------------------------------------------------------------------------------------------------------
// Commission
// ---------------------------------------------------------------------------------------------------------------------

/** When an engagement's contract was made: the day its pay was promised, or its first day where nothing was. */
export function madeAt(e: Engagement): Instant {
  const promised = e.pay.map((p) => p.promisedAt);
  return promised.length ? Math.min(...promised) : (e.days[0]?.from ?? 0);
}

const termEnd = (a: Agreement): Instant => Math.min(a.endedAt ?? Infinity, a.endsAt ?? Infinity);

/**
 * The agreement owed commission on an engagement, and how: its own (`agreementId`), the one in force on the day the
 * contract was made (`activeAgreement`), or, after the term, Equity's tail, an offer the agent conveyed in the term
 * accepted within sixty days of it (S30 ¶4). None where the contract was made unrepresented.
 */
export function owedAgreement(person: Person, e: Engagement): { agreement: Agreement; how: 'term' | 'tail' } | undefined {
  const agreements = person.pro?.agreements ?? [];
  const own = e.agreementId !== undefined ? agreements.find((a) => a.id === e.agreementId && a.signedAt !== undefined) : undefined;
  if (own) return { agreement: own, how: 'term' };
  const made = madeAt(e);
  const during = activeAgreement(person, made);
  if (during) return { agreement: during, how: 'term' };
  const opportunity = person.pro?.opportunities.find((o) => o.id === e.opportunityId);
  const offer = opportunity?.via === 'agent' ? opportunity.offer : undefined;
  if (!offer) return undefined;
  const tail = agreements.find((a) => a.signedAt !== undefined && a.agentId === opportunity!.agentId && offer.at >= a.signedAt && offer.at < termEnd(a) && made >= termEnd(a) && made <= offer.at + AGREEMENT.tailDays * MS_DAY);
  return tail ? { agreement: tail, how: 'tail' } : undefined;
}

/** Whether an agreement covers a project's work: stage, film and television, in the United States. */
export const coveredWork = (project: Pick<ProjectTemplate, 'medium' | 'place'>): boolean =>
  COVERED_MEDIA.includes(project.medium) && (CITIES.get(project.place.cityId)?.countryId ?? (project.place.cityId.startsWith('us-') ? 'us' : '')) === 'us';

export interface Commission {
  /** The agreement it's owed under, and the agency's name, where it's owed. */
  agreement?: Agreement;
  agency?: string;
  how: 'unrepresented' | 'uncovered' | 'term' | 'continuing' | 'tail';
  /** The rule its rate comes from. */
  rule: 'none' | 'equity-low' | 'equity' | 'sag' | 'sag-scale' | 'ny';
  amount: Money;
  /** The commission as a share of the gross. */
  rate: number;
  /** Why, in a sentence: the line the Work tab and the pay's notice read. */
  words: string;
}

/** An engagement's offer per day or week, in its currency, where the work system kept it. */
function offerOf(person: Person, e: Engagement) {
  return person.pro?.opportunities.find((o) => o.id === e.opportunityId)?.offer;
}

/** The weekly salary an Equity engagement pays, in US cents: the offer's, or the rate's minimum. */
function weeklySalary(person: Person, e: Engagement, project: ProjectTemplate): Money {
  const offer = offerOf(person, e);
  if (offer?.amount !== undefined) return offer.per === 'week' ? offer.amount : offer.amount * 5;
  const rate = RATES[project.pay];
  return rate.per === 'week' ? rate.amount ?? 0 : (rate.amount ?? 0) * 5;
}

/**
 * The scale part of a SAG-AFTRA payment, in the save's money: its gross in the share the minimum is of what's offered
 * (`RATES`), or, without the offer's figure, the minimum for each day or week the payment's week holds.
 */
function scaleOf(sim: Simulation, person: Person, e: Engagement, project: ProjectTemplate, p: ProPayment, gross: Money): Money {
  const offer = offerOf(person, e);
  const minimum = RATES[offer?.rate ?? project.pay];
  if (minimum.amount === undefined) return gross;
  if (offer?.amount) return Math.round(gross * Math.min(1, minimum.amount / offer.amount));
  const zone = zoneOfCity(project.place.cityId);
  const week = weekOf(p, zone);
  const units = minimum.per === 'week' ? 1 : Math.max(1, engagementDaysIn(e, week.from, week.to, zone));
  return Math.min(gross, inSaveMoney(sim, minimum.amount * units, 'USD'));
}

const pct = (r: number) => `${Math.round(r * 1000) / 10}%`;

/**
 * The commission owed on a payment of `gross` (the save's money) at `at`, by the rules in the header: none unrepresented
 * or on uncovered work; Equity's tiers; SAG-AFTRA's 10% only above scale; New York's 10% on the rest; and owed still, as
 * continuing commission, once the agreement has ended.
 */
export function commissionOn(sim: Simulation, person: Person, e: Engagement, p: ProPayment, gross: Money, at: Instant = sim.now): Commission {
  const owed = owedAgreement(person, e);
  const project = projectOf(e);
  if (!owed || !project) return { how: 'unrepresented', rule: 'none', amount: 0, rate: 0, words: 'No commission: you weren’t represented when you made this contract.' };
  const agent = agentById(owed.agreement.agentId);
  const agency = agent ? agencyOf(agent).name : 'your agency';
  if (!coveredWork(project)) return { agreement: owed.agreement, agency, how: 'uncovered', rule: 'none', amount: 0, rate: 0, words: `No commission: your agreement with ${agency} covers stage, film and television work in the US, and this isn’t that.` };
  const how = owed.how === 'tail' ? 'tail' : termEnd(owed.agreement) <= at ? 'continuing' : 'term';
  const still = how === 'continuing' ? ` It’s still owed after your agreement with ${agency} ended, because you made the contract while it ran.` : how === 'tail' ? ` It’s owed after your agreement ended, because ${agency} passed on the offer while it ran and you accepted it within ${AGREEMENT.tailDays} days.` : '';
  const ten = AGREEMENT.commission;
  if (project.union === 'equity') {
    const weekly = weeklySalary(person, e, project);
    const low = weekly <= AGREEMENT.equityLowTier.weeklyAtOrBelow;
    const rate = low ? AGREEMENT.equityLowTier.rate : ten;
    const amount = Math.round(gross * rate);
    return { agreement: owed.agreement, agency, how, rule: low ? 'equity-low' : 'equity', amount, rate, words: `${pct(rate)} of ${formatMoney(gross, saveCurrency(sim.universe))} gross, Equity’s rate on a weekly salary of ${formatMoney(weekly, 'USD')}, ${low ? 'at or under' : 'over'} ${formatMoney(AGREEMENT.equityLowTier.weeklyAtOrBelow, 'USD')}.${still}` };
  }
  if (project.union === 'sag-aftra') {
    const scale = scaleOf(sim, person, e, project, p, gross);
    const full = Math.round(gross * ten);
    const over = Math.max(0, gross - scale);
    const amount = Math.min(full, over);
    const cur = saveCurrency(sim.universe);
    const words = amount === full
      ? `${pct(ten)} of ${formatMoney(gross, cur)} gross, the most SAG-AFTRA allows, taken from what you’re paid over scale.${still}`
      : amount === 0
        ? `No commission: this pays SAG-AFTRA scale, and an agent takes commission only on what’s above it.${still}`
        : `${formatMoney(amount, cur)}, what’s paid over scale (${formatMoney(scale, cur)}), so you keep scale.${still}`;
    return { agreement: owed.agreement, agency, how, rule: amount === full ? 'sag' : 'sag-scale', amount, rate: gross > 0 ? amount / gross : 0, words };
  }
  const amount = Math.round(gross * ten);
  return { agreement: owed.agreement, agency, how, rule: 'ny', amount, rate: ten, words: `${pct(ten)} of ${formatMoney(gross, saveCurrency(sim.universe))} gross, the most New York lets an agency take for an engagement.${still}` };
}

/**
 * What an offer for SAG-AFTRA work at scale pays where an agent negotiates it: scale plus ten percent, so the commission
 * comes out of the ten (S3). The work system's offer reads it; any other work's pay is what it's offered at.
 */
export function negotiatedAmount(minimum: Money, union: ProjectTemplate['union'], represented: boolean): Money {
  return represented && union === 'sag-aftra' ? Math.round(minimum * (1 + AGREEMENT.commission)) : minimum;
}

/** A union's working dues on a payment: Equity's for a member on Equity work, SAG-AFTRA's for a member on its work. */
export function duesOn(person: Person, project: ProjectTemplate, gross: Money, at: Instant): { amount: Money; rate: number; union?: 'equity' | 'sag-aftra' } {
  const pro = person.pro;
  if (project.union === 'equity' && pro?.equity && pro.equity.since <= at) return { amount: Math.round(gross * UNIONS.equity.workingDues), rate: UNIONS.equity.workingDues, union: 'equity' };
  if (project.union === 'sag-aftra' && pro?.sag?.memberSince !== undefined && pro.sag.memberSince <= at) return { amount: Math.round(gross * UNIONS.sagAftra.workingDues), rate: UNIONS.sagAftra.workingDues, union: 'sag-aftra' };
  return { amount: 0, rate: 0 };
}

// ---------------------------------------------------------------------------------------------------------------------
// Withholding
// ---------------------------------------------------------------------------------------------------------------------

/** Whether the gazetteer holds a town, so the return can read it. */
const known = (cityId: string): boolean => CITIES.get(cityId) !== undefined;

/**
 * What the production's payroll withholds from a payment of `gross` (the save's money) at `at` for work done in
 * `workCity`, by the header's rules: federal and payroll tax on the year's wages so far; the work state's own tax on the
 * wages earned there; New York City's from a resident.
 */
export function withholdingOn(sim: Simulation, person: Person, gross: Money, at: Instant, workCity: string): { total: Money; federal: Money; fica: Money; byState: Record<string, Money> } {
  const cur = saveCurrency(sim.universe);
  const zone = sim.homeZone;
  const year = zonedParts(at, zone).year;
  const y = yearOf(person, year);
  const before = y.acting;
  const home = homeOf(person);
  const homeKnown = known(home);
  const nra = nonresidentFor(person, year);
  const added = nra && homeKnown ? (cur === 'USD' ? federalStandardDeduction(home, at) : exchange(federalStandardDeduction(home, at), 'USD', cur) ?? 0) : 0;
  const taxAt = (x: Money, city: string) => computeAnnualTax(x, city, at, { currency: cur });
  const fedOf = (x: Money) => (homeKnown ? taxAt(x + added, home).federal : 0);
  const ficaOf = (x: Money) => (homeKnown ? taxAt(x, home).payroll : 0);
  const federal = Math.max(0, Math.round(fedOf(before + gross) - fedOf(before)));
  const fica = nra ? 0 : Math.max(0, Math.round(ficaOf(before + gross) - ficaOf(before)));
  const byState: Record<string, Money> = {};
  const add = (state: string, v: number) => { const c = Math.max(0, Math.round(v)); if (c) byState[state] = (byState[state] ?? 0) + c; };
  if (known(workCity)) {
    const work = stateOf(workCity);
    if (work === 'us-ct') add('us-ct', connecticutTax(before + gross, cur) - connecticutTax(before, cur));
    else {
      // The wages earned in that state this year, before this payment: at home there, all of them; else what was earned
      // there as a nonresident.
      const there = stateOf(home) === work ? before : Object.entries(y.elsewhere).filter(([k]) => stateOf(k.split('>')[1]!) === work).reduce((n, [, v]) => n + v, 0);
      add(work, taxAt(there + gross, workCity).regional - taxAt(there, workCity).regional);
    }
  }
  // New York City withholds from its residents, wherever the work is done (S46).
  if (homeKnown && LOCAL_TAX[home]?.collector === 'state' && stateOf(home) === 'us-ny') add('us-ny', taxAt(before + gross, home).local - taxAt(before, home).local);
  const states = Object.values(byState).reduce((n, v) => n + v, 0);
  return { total: federal + fica + states, federal, fica, byState };
}

// ---------------------------------------------------------------------------------------------------------------------
// Paying
// ---------------------------------------------------------------------------------------------------------------------

/** The player's money held by an agency in its client trust account: theirs, held, in no bank account. */
export function trustAccount(sim: Simulation, person: Person, agency: string): Account {
  const found = Object.values(sim.universe.accounts).find((a) => a.ownerId === person.id && a.kind === 'escrow' && a.category === 'trust' && a.institution === agency && !a.closedAt);
  return found ?? sim.openAccount({ id: sim.nextId('account'), kind: 'escrow', category: 'trust', name: `Held For You By ${agency}`, institution: agency, ownerId: person.id, openedAt: sim.now });
}

/**
 * The days a payment is for: the week its work wrote on it, or, for a payment written without one, the calendar week
 * before its payday. Until the work loop's merge (2026-10-21) every payment was read by its payday alone, which put a
 * stage run's Tuesday-to-Monday week's hours and words in the wrong week.
 */
export function weekOf(p: ProPayment, zone: string = WORK_ZONE): { from: Instant; to: Instant } {
  return p.week ?? weekPaidOn(p.due, zone);
}

/** The week a payment is for, in words: "the week of March 1, 2027". */
export function weekWords(p: ProPayment, zone: string = WORK_ZONE): string {
  return `the week of ${formatDate(weekOf(p, zone).from, zone)}`;
}

/** An engagement and its payment, found by the payment's key. */
function paymentOf(sim: Simulation, payload: Record<string, unknown>): { person: Person; e: Engagement; p: ProPayment; project: ProjectTemplate } | undefined {
  const person = sim.universe.people[String(payload.personId)];
  const e = person?.pro?.engagements.find((x) => x.id === payload.engagementId);
  const p = e?.pay.find((x) => x.key === payload.key);
  const project = e ? projectOf(e) : undefined;
  return person && e && p && project ? { person, e, p, project } : undefined;
}

/** Where a payment's work was done, as `recordWages` and the return can read it: the town, where the gazetteer has it. */
const whereOf = (project: ProjectTemplate): string | undefined => (known(project.place.cityId) ? project.place.cityId : undefined);

/** Pays a payment due now, once: into the trust account where commission is owed on it, or straight to the player. */
function payDue(s: Simulation, person: Person, e: Engagement, p: ProPayment, project: ProjectTemplate): void {
  // GUARD: once. A payment already received, already in trust or deferred is never paid again (a reload, a jump or a
  // second firing finds it so).
  if (p.received || p.inTrust || p.deferred) return;
  if (e.status === 'canceled') {
    noteEvent(s, e, { kind: 'problem', key: `unpaid:${p.key}`, words: `${formatMoney(p.promised, p.currency)} for ${weekWords(p)} wasn’t paid: the engagement was called off.` });
    return;
  }
  const cur = saveCurrency(s.universe);
  const money = (c: Money) => formatMoney(c, cur);
  const gross = inSaveMoney(s, p.promised, p.currency);
  const zone = s.zone;
  const workZone = zoneOfCity(project.place.cityId);
  const c = commissionOn(s, person, e, p, gross, s.now);
  const dues = duesOn(person, project, gross, s.now);
  const w = withholdingOn(s, person, gross, s.now, project.place.cityId);
  const kept = gross - w.total - dues.amount;
  const week = weekOf(p, workZone);
  const days = engagementDaysIn(e, week.from, week.to, workZone);
  const hours = days ? `, ${days * PAY.hoursPerDay} hours` : '';
  const memo = `Wages${hours}: ${project.company}, ${project.project}, ${weekWords(p, workZone)}`;
  const where = whereOf(project);
  const postings = (into: Account) => [
    { accountId: into.id, amount: kept },
    { accountId: s.nominalAccount('income', 'Wages').id, amount: -gross },
    ...(w.total ? [{ accountId: s.nominalAccount('expense', 'Tax Withheld').id, amount: w.total }] : []),
    ...(dues.amount ? [{ accountId: s.nominalAccount('expense', 'Union Dues').id, amount: dues.amount }] : []),
  ];
  const report = () => recordWages(person, s.now, zone, { gross, withheld: w.total, withheldBy: w.byState, employer: project.company, commission: c.amount, dues: dues.amount, ...(where ? { where } : {}) });
  const taken = [w.total ? `${money(w.total)} withheld for tax` : '', dues.amount ? `${money(dues.amount)} in ${dues.union === 'equity' ? 'Equity’s' : 'SAG-AFTRA’s'} working dues` : ''].filter(Boolean);
  const mine = person.id === s.universe.playerId;
  if (c.agreement && c.agency) {
    const trust = trustAccount(s, person, c.agency);
    const txn = s.post({ memo: `${memo}, into ${c.agency}’s client trust account`, category: 'salary', postings: postings(trust) });
    report();
    const releaseAt = businessDaysOn(s.now, PAY.trustBusinessDays, true, zone);
    p.inTrust = { at: s.now, agency: c.agency, txnId: txn.id, releaseAt, gross, withheld: w.total, dues: dues.amount, commission: c.amount, held: kept };
    s.schedule({ at: releaseAt, kind: RELEASE_KIND, label: `Pay From ${c.agency}`, category: 'home', priority: 30, refType: 'engagement', refId: e.id, payload: { personId: person.id, engagementId: e.id, key: p.key } });
    noteEvent(s, e, { kind: 'paid', key: `trust:${p.key}`, words: `${project.company} paid ${money(gross)} for ${weekWords(p, workZone)} into ${c.agency}’s client trust account.`, ref: e.id });
    if (mine) s.notify({ category: 'career', title: `Pay Held For You At ${c.agency}`, body: `${project.company} paid ${money(gross)} for ${project.project}, ${weekWords(p, workZone)}, into ${c.agency}’s client trust account${taken.length ? `, less ${spokenList(taken)}` : ''}. ${c.agency} passes it on to you by ${formatDate(releaseAt, zone)}${c.amount ? `, less ${money(c.amount)} commission` : ', with no commission taken'}.`, importance: 55, route: '/workspace/career?tab=work', refType: 'engagement', refId: e.id });
    return;
  }
  const into = payeeAccount(s, person);
  const txn = s.post({ memo, category: 'salary', postings: postings(into) });
  report();
  p.received = { at: s.now, gross, withheld: w.total, commission: 0, net: kept, via: 'direct', txnId: txn.id, ...(dues.amount ? { dues: dues.amount } : {}) };
  noteEvent(s, e, { kind: 'paid', key: `paid:${p.key}`, words: `${project.company} paid ${money(gross)} for ${weekWords(p, workZone)}, and ${money(kept)} reached you.`, ref: e.id });
  if (mine) s.notify({ category: 'career', title: `Paid For ${project.project}`, body: `${project.company} paid ${money(gross)} for ${weekWords(p, workZone)}${taken.length ? `, less ${spokenList(taken)}` : ''}, so ${money(kept)} went into your ${into.name}.`, importance: 55, route: '/workspace/career?tab=work', refType: 'engagement', refId: e.id });
}

/** Passes on pay held in trust, once, less the commission worked out when it was paid in. */
function release(s: Simulation, person: Person, e: Engagement, p: ProPayment, project: ProjectTemplate): void {
  const held = p.inTrust;
  if (!held || p.received) return;
  const cur = saveCurrency(s.universe);
  const money = (c: Money) => formatMoney(c, cur);
  const agency = held.agency;
  const trust = trustAccount(s, person, agency);
  const into = payeeAccount(s, person);
  const net = held.held - held.commission;
  const workZone = zoneOfCity(project.place.cityId);
  const txn = s.post({
    memo: `${project.project}, ${weekWords(p, workZone)}: paid on from ${agency}’s client trust account, less ${money(held.commission)} commission`,
    category: 'salary',
    postings: [
      { accountId: trust.id, amount: -held.held },
      ...(net ? [{ accountId: into.id, amount: net }] : []),
      ...(held.commission ? [{ accountId: s.nominalAccount('expense', 'Agent’s Commission').id, amount: held.commission }] : []),
    ],
  });
  p.received = { at: s.now, gross: held.gross, withheld: held.withheld, commission: held.commission, net, via: 'trust', txnId: txn.id, ...(held.dues ? { dues: held.dues } : {}) };
  noteEvent(s, e, { kind: 'paid', key: `paid:${p.key}`, words: `${agency} passed on ${money(net)} for ${weekWords(p, workZone)}, after ${money(held.commission)} commission.`, ref: e.id });
  if (person.id === s.universe.playerId) s.notify({ category: 'career', title: `Paid On From ${agency}`, body: `${agency} passed on your pay for ${project.project}, ${weekWords(p, workZone)}: ${money(held.held)} held for you, less ${money(held.commission)} commission, so ${money(net)} went into your ${into.name}.`, importance: 55, route: '/workspace/career?tab=work', refType: 'engagement', refId: e.id });
}

/** Whether a payment is already on the clock. */
const scheduledFor = (sim: Simulation, kind: string, key: string): boolean => sim.universe.scheduled.some((i) => i.status === 'pending' && i.kind === kind && i.payload.key === key);

/**
 * Puts an engagement's promised payments on the clock, each for its `due`, once (called when an offer is accepted): every
 * payment not deferred, not received and not already scheduled. Keeps what permission to work read for its dates, now,
 * on the engagement, and a first SAG-AFTRA principal job's first day, when eligibility begins. Returns how many it put on
 * the clock and how many are deferred.
 */
export function schedulePay(sim: Simulation, person: Person, e: Engagement): { scheduled: number; deferred: number } {
  const project = projectOf(e);
  e.eligibility ??= eligibilityRead(person, e.days, sim.now);
  let scheduled = 0;
  let deferred = 0;
  for (const p of e.pay) {
    if (p.deferred) { deferred += 1; continue; }
    if (p.received || p.inTrust || scheduledFor(sim, PAY_KIND, p.key)) continue;
    sim.schedule({ at: Math.max(p.due, sim.now + 60_000), kind: PAY_KIND, label: `Payday: ${project?.project ?? 'Your Work'}`, category: 'home', priority: 30, refType: 'engagement', refId: e.id, payload: { personId: person.id, engagementId: e.id, key: p.key } });
    scheduled += 1;
  }
  const pro = ensurePro(sim, person);
  const first = e.days[0]?.from;
  if (project && SAG_QUALIFIES.includes(project.kind) && first !== undefined && pro.sag?.eligibleSince === undefined && pro.sag?.memberSince === undefined && !scheduledFor(sim, SAG_ELIGIBLE_KIND, e.id)) {
    sim.schedule({ at: Math.max(first, sim.now + 60_000), kind: SAG_ELIGIBLE_KIND, label: 'SAG-AFTRA Eligibility', category: 'system', priority: 30, refType: 'engagement', refId: e.id, payload: { personId: person.id, engagementId: e.id, key: e.id } });
  }
  return { scheduled, deferred };
}

/** What's promised on an engagement and not yet received, deferred pay aside: the Work tab's owed. */
export const stillPromised = (e: Engagement): ProPayment[] => e.pay.filter((p) => !p.deferred && !p.received);

// ---------------------------------------------------------------------------------------------------------------------
// The unions' bills
// ---------------------------------------------------------------------------------------------------------------------

const UNION_NAME = { equity: UNIONS.equity.name, 'sag-aftra': UNIONS.sagAftra.name } as const;

/** The unions' bills on the record, begun empty. */
function billsOf(sim: Simulation, person: Person): UnionBill[] {
  return (ensurePro(sim, person).unionBills ??= []);
}

/** The unions' bills kept to every unsettled one and the last `BILLS_KEPT` settled, by when each was due. */
export function keepBills(person: Person): void {
  const all = person.pro?.unionBills;
  if (!all) return;
  const settled = all.filter((b) => b.settled).sort((a, b) => a.due - b.due);
  const drop = new Set(settled.slice(0, Math.max(0, settled.length - BILLS_KEPT)));
  if (drop.size) person.pro!.unionBills = all.filter((b) => !drop.has(b));
}

/** A bill added and put on the clock, once by its key. */
function addBill(sim: Simulation, person: Person, bill: UnionBill): UnionBill {
  const bills = billsOf(sim, person);
  const had = bills.find((b) => b.key === bill.key);
  if (had) return had;
  bills.push(bill);
  if (!scheduledFor(sim, DUES_KIND, bill.key)) sim.schedule({ at: Math.max(bill.due, sim.now + 60_000), kind: DUES_KIND, label: `${UNION_NAME[bill.union]} Bill`, category: 'home', priority: 30, payload: { personId: person.id, key: bill.key } });
  return bill;
}

/** A half-year's basic dues bill, for the billing at `due`. */
function duesBill(sim: Simulation, union: 'equity' | 'sag-aftra', due: Instant): UnionBill {
  const half = Math.round((union === 'equity' ? UNIONS.equity.yearlyDues : UNIONS.sagAftra.yearlyDues) / 2);
  return { key: `${union}:dues:${monthKey(due, WORK_ZONE)}`, union, what: union === 'equity' ? 'Basic dues, half a year' : 'Base dues, half a year', amount: usdIn(sim, half), due };
}

/** Settles a bill once: paid from the bank, or owed in Bills Owed where it can't be, and the next half-year's dues billed. */
function settle(s: Simulation, person: Person, bill: UnionBill): void {
  if (bill.settled) return;
  const cur = saveCurrency(s.universe);
  const memo = `${UNION_NAME[bill.union]}: ${bill.what}`;
  const paid = payFromBank(s, person, bill.amount, memo, 'dues');
  if (!paid) owe(s, person, bill.amount, memo, 'dues');
  bill.settled = { at: s.now, how: paid ? 'paid' : 'owed', txnId: s.universe.transactions[s.universe.transactions.length - 1]!.id };
  if (bill.key.includes(':dues:')) addBill(s, person, duesBill(s, bill.union, nextBilling(bill.due)));
  keepBills(person);
  if (person.id === s.universe.playerId) s.notify({ category: 'career', title: paid ? `${UNION_NAME[bill.union]}: ${formatMoney(bill.amount, cur)} Paid` : `${UNION_NAME[bill.union]}: ${formatMoney(bill.amount, cur)} Owed`, body: paid ? `${bill.what}: ${formatMoney(bill.amount, cur)} was taken from your bank.` : `${bill.what}: your bank couldn’t cover ${formatMoney(bill.amount, cur)}, so it’s owed under Bills Owed and paid off the first day there’s money to pay it.`, importance: 50, route: '/workspace/career?tab=work' });
}

/** Equity's initiation fee in its parts: the first at joining, then a year and two years on. */
function equityParts(sim: Simulation, since: Instant): UnionBill[] {
  const total = usdIn(sim, UNIONS.equity.initiation);
  const down = usdIn(sim, UNIONS.equity.down);
  const rest = total - down;
  const later = Math.round(rest / (EQUITY_PARTS - 1));
  const cur = saveCurrency(sim.universe);
  return Array.from({ length: EQUITY_PARTS }, (_, i) => ({
    key: `equity:initiation:${i + 1}`, union: 'equity' as const,
    what: i === 0 ? `Initiation fee, ${formatMoney(down, cur)} down of ${formatMoney(total, cur)}` : `Initiation fee, part ${i + 1} of ${EQUITY_PARTS}`,
    amount: i === 0 ? down : i === EQUITY_PARTS - 1 ? rest - later * (EQUITY_PARTS - 2) : later,
    due: i === 0 ? since : addYears(since, i),
  }));
}

/** The Equity bills a membership begun now sets up: the down payment taken at once, the rest and the dues on the clock. */
export function equityJoined(sim: Simulation, person: Person): void {
  const pro = person.pro;
  if (!pro?.equity || billsOf(sim, person).some((b) => b.union === 'equity')) return;
  const parts = equityParts(sim, sim.now);
  for (const b of parts) addBill(sim, person, b);
  const firstDues = addBill(sim, person, duesBill(sim, 'equity', nextBilling(sim.now)));
  const cur = saveCurrency(sim.universe);
  const zone = sim.zone;
  if (person.id === sim.universe.playerId) sim.notify({ category: 'career', title: 'Your Equity Initiation Fee', body: `You’re a member of ${UNIONS.equity.name} from your degree. Its initiation fee is ${formatMoney(usdIn(sim, UNIONS.equity.initiation), cur)}, paid within three years: ${formatMoney(parts[0]!.amount, cur)} down is due now, then ${spokenList(parts.slice(1).map((b) => `${formatMoney(b.amount, cur)} on ${formatDate(b.due, zone)}`))}. Basic dues are ${formatMoney(firstDues.amount, cur)} each May and November, from ${formatDate(firstDues.due, zone)}.`, importance: 60, route: '/workspace/career?tab=work' });
  settle(sim, person, parts[0]!);
}

/**
 * An older graduate's Equity membership, dated at a degree before the game charged its fees: told what's owed, nothing
 * charged for a past date. Each part already past is billed at the next billing day instead, the rest on their own, the
 * dues from the next billing. Once (`ONCE_ON_OPENING`'s `pro.unions`); returns whether it billed anything.
 */
export function equityOnOpening(sim: Simulation): boolean {
  const person = sim.universe.people[sim.universe.playerId];
  const pro = person?.pro;
  if (!person || !pro?.equity || (pro.unionBills ?? []).some((b) => b.union === 'equity')) return false;
  const next = nextBilling(sim.now);
  const parts = equityParts(sim, pro.equity.since).map((b) => ({ ...b, due: b.due <= sim.now ? next : b.due }));
  for (const b of parts) addBill(sim, person, b);
  const dues = addBill(sim, person, duesBill(sim, 'equity', next));
  const cur = saveCurrency(sim.universe);
  const zone = sim.zone;
  const now = parts.filter((b) => b.due === next);
  const later = parts.filter((b) => b.due !== next);
  sim.notify({ category: 'career', title: 'What You Owe Actors’ Equity', body: `You joined ${UNIONS.equity.name} with your degree on ${formatDate(pro.equity.since, zone)}. Your save is from before the game charged the union’s fees, so nothing was charged for that day. Its initiation fee is ${formatMoney(usdIn(sim, UNIONS.equity.initiation), cur)}, paid within three years: ${formatMoney(now.reduce((n, b) => n + b.amount, 0), cur)} is taken on ${formatDate(next, zone)}${later.length ? `, then ${spokenList(later.map((b) => `${formatMoney(b.amount, cur)} on ${formatDate(b.due, zone)}`))}` : ''}. Basic dues are ${formatMoney(dues.amount, cur)} each May and November, from ${formatDate(dues.due, zone)}.`, importance: 60, route: '/workspace/career?tab=work' });
  return true;
}

// ---------------------------------------------------------------------------------------------------------------------
// SAG-AFTRA
// ---------------------------------------------------------------------------------------------------------------------

/** From when SAG-AFTRA work needs membership: the thirtieth day after the first principal job began (29 U.S.C. 158(a)(3)). */
export function sagMembershipFrom(person: Person): Instant | undefined {
  const since = person.pro?.sag?.eligibleSince;
  return since === undefined ? undefined : since + UNIONS.sagAftra.joinWithinDays * MS_DAY;
}

/** Why SAG-AFTRA work on these days can't be accepted, or nothing: a day from the thirtieth on, and not a member. */
export function sagWorkRefusal(person: Person, days: readonly { from: Instant; to: Instant }[], zone: string = WORK_ZONE): string | undefined {
  if (person.pro?.sag?.memberSince !== undefined) return undefined;
  const from = sagMembershipFrom(person);
  if (from === undefined || !days.some((d) => d.to > from)) return undefined;
  return `SAG-AFTRA work from ${formatDate(from, zone)} needs you to be a member: that’s the 30th day after your first SAG-AFTRA job began. Press Join SAG-AFTRA on the Career screen’s Work tab first.`;
}

/** Why the player can't join SAG-AFTRA now, or nothing; `pressed` says what didn't happen once it's pressed. */
export function joinSagRefusal(sim: Simulation, person: Person, pressed = false): string | undefined {
  const sag = person.pro?.sag;
  if (sag?.memberSince !== undefined) return `You’re already a member of SAG-AFTRA, since ${formatDate(sag.memberSince, sim.zone)}.`;
  if (sag?.eligibleSince === undefined) return 'You can join SAG-AFTRA once you’ve worked a SAG-AFTRA principal role: a TV, theatrical or Low Budget film part. Ultra Low Budget and student films don’t count toward it.';
  const fee = usdIn(sim, sagJoinUsd());
  const money = formatMoney(fee, saveCurrency(sim.universe));
  if (inTheBank(sim, person) < fee) return pressed ? `Your bank can’t cover ${money}, so nothing was charged.` : `Your bank can’t cover the ${money} to join.`;
  return undefined;
}

// ---------------------------------------------------------------------------------------------------------------------
// Registration
// ---------------------------------------------------------------------------------------------------------------------

export function registerProPay(sim: Simulation): void {
  sim.onSchedule(PAY_KIND, (item, s) => {
    const found = paymentOf(s, item.payload);
    if (found) payDue(s, found.person, found.e, found.p, found.project);
  });

  sim.onSchedule(RELEASE_KIND, (item, s) => {
    const found = paymentOf(s, item.payload);
    if (found) release(s, found.person, found.e, found.p, found.project);
  });

  sim.onSchedule(DUES_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const bill = person?.pro?.unionBills?.find((b) => b.key === item.payload.key);
    if (person && bill) settle(s, person, bill);
  });

  sim.onSchedule(SAG_ELIGIBLE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const e = person?.pro?.engagements.find((x) => x.id === item.payload.engagementId);
    const pro = person?.pro;
    if (!person || !pro || !e || e.status === 'canceled' || pro.sag?.eligibleSince !== undefined || pro.sag?.memberSince !== undefined) return;
    pro.sag = { ...pro.sag, eligibleSince: item.at };
    const project = projectOf(e);
    const from = sagMembershipFrom(person)!;
    const cur = saveCurrency(s.universe);
    noteEvent(s, e, { kind: 'success', key: `sag-eligible:${e.id}`, words: `With your first SAG-AFTRA principal job begun, you can join SAG-AFTRA from ${formatDate(item.at, s.zone)}.`, ref: e.id });
    if (person.id === s.universe.playerId) s.notify({ category: 'career', title: 'You Can Join SAG-AFTRA', body: `Your part in ${project?.project ?? 'this work'} is a SAG-AFTRA principal role, so you can join SAG-AFTRA from today. A union contract can require you to be a member from the 30th day after your first job under it began, so SAG-AFTRA work from ${formatDate(from, s.zone)} needs you to join first. Joining costs about ${formatMoney(usdIn(s, sagJoinUsd()), cur)}: press Join SAG-AFTRA on the Career screen’s Work tab.`, importance: 65, route: '/workspace/career?tab=work' });
  });

  sim.onEvent(EQUITY_JOINED, 'pro.pay.equity', (event, { sim: s }) => {
    const person = s.universe.people[String((event.payload as { personId?: string }).personId)];
    if (person) equityJoined(s, person);
  });

  sim.onCommand<Record<string, never>, { fee: Money; memberSince: Instant }>('pro.join_sag', (_p, { sim: s }) => {
    const person = s.player;
    const no = joinSagRefusal(s, person, true);
    if (no) throw new CommandError(no);
    const fee = usdIn(s, sagJoinUsd());
    if (!payFromBank(s, person, fee, 'SAG-AFTRA: initiation fee and half a year’s base dues', 'dues')) throw new CommandError(`Your bank can’t cover ${formatMoney(fee, saveCurrency(s.universe))}, so nothing was charged.`);
    const pro = ensurePro(s, person);
    pro.sag = { ...pro.sag, memberSince: s.now };
    addBill(s, person, duesBill(s, 'sag-aftra', nextBilling(s.now)));
    return { fee, memberSince: s.now };
  });
}

/** Whether a payment's place is one the return can read: a town the gazetteer holds. */
export const placeKnown = (e: Engagement): boolean => { const project = projectOf(e); return project ? known(project.place.cityId) : true; };

/** The payments still to come on contracts whose agreement has ended: what's owed after it, with the commission each carries. */
export function owedAfterEnding(sim: Simulation, person: Person): { e: Engagement; p: ProPayment; commission: Commission }[] {
  const out: { e: Engagement; p: ProPayment; commission: Commission }[] = [];
  for (const e of person.pro?.engagements ?? []) {
    const owed = owedAgreement(person, e);
    if (!owed || termEnd(owed.agreement) > sim.now) continue;
    for (const p of stillPromised(e)) out.push({ e, p, commission: commissionOn(sim, person, e, p, inSaveMoney(sim, p.promised, p.currency), Math.max(p.due, sim.now)) });
  }
  return out;
}
