/**
 * SLATE — the assistance a person out of money can claim where they live,
 * from 2026-10-01 (docs/WORLD.md), researched in
 * `docs/research/world/research-welfare.json` and
 * `research-documents-safetynet.json`. Until then a Canadian resident could
 * claim nothing, and an American only unemployment insurance, which an actor
 * between jobs often doesn't qualify for; a played life in Toronto starved.
 *
 * **Ontario Works**, for a single adult living in Ontario: CAD 343 a month
 * for basic needs and the actual rent up to CAD 390 for shelter, CAD 733 at
 * most. Liquid assets to CAD 10,000; the home lived in and a car are
 * exempt. Earnings come off it whole for the first three months on it, and
 * after them the first CAD 200 and half of the rest are kept (the policy
 * directives, updated 2026). Decided in four working days; paid monthly.
 * Anyone living in Ontario, however recently back from abroad.
 *
 * **BC Income Assistance**, for a single employable adult living in British
 * Columbia: CAD 560 for support and the actual rent up to CAD 500, CAD 1,060
 * at most (the rate table of 2023-08-01, still current). Assets to CAD 5,000,
 * the home and a car exempt. CAD 600 a month of earnings kept, after the
 * first month on it. A new applicant searches for work three weeks first.
 * The two-year independence rule was abolished on 2020-01-01.
 *
 * Canada's Employment Insurance isn't kept: a performer engaged by a
 * producer is self-employed under the Status of the Artist Act, and pays no
 * premium unless opting in to its special benefits only (CRA's Folio
 * S4-F14-C1; Royal Winnipeg Ballet v. M.N.R., 2006 FCA 87).
 *
 * **SNAP**, in New York, California and Connecticut, for a single adult: the
 * USDA's maximum allotment ($298 a month in fiscal 2026, $306 from 1 October
 * 2026) less 30% of net income, rounded up to the dollar (paid to the cent until
 * 2026-10-13), which is gross income less 20% of earnings
 * and the standard deduction ($209, then $217), and from later on 2026-09-30
 * the excess shelter deduction (`research-sweep5.json`): rent, and the state's
 * standard utility allowance where they pay the bills, above half of what's
 * left, at most $744 in fiscal 2026 (the states' copies of the USDA's
 * adjustment) and $769 in 2027 (read from an excerpt of the USDA's memo, its
 * page refusing). The allowance is the state's heating and cooling one for
 * fiscal 2026, held after it as 2027's wasn't read: New York City's $1,062,
 * the rest of New York's $877 (Nassau's and Suffolk's $988 not kept, SLATE not
 * holding a town's county), California's $663 and Connecticut's $976. With
 * it, New York's gross limit binds, 150% of the federal poverty line (the
 * net limit, $1,305, then $1,330). California’s and Connecticut’s 200% are
 * kept, and until 2026-10-13 never did, 30% of net income taking a single
 * adult’s benefit first; from then a household under the gross limit is paid
 * at least SNAP’s least after its first month, $24 and then $25 (`snapMonth`),
 * so theirs bind too. The net limit never does: each state’s broad-based
 * categorical eligibility waives it. Until later on 2026-09-30 the shelter
 * deduction wasn’t kept, and
 * SLATE's benefit was the lower one a household with low rent gets. Paid onto an EBT card that buys groceries only, which a day's
 * food draws on first. An able-bodied adult of 18 to 64 without 80 hours of
 * work a month is paid three months in three years (7 U.S.C. 2015(o), as the
 * 2025 law widened it), unless exempt from work registration, as a student
 * enrolled at least half-time is (7 U.S.C. 2015(o)(3)(D), (d)(2); 7 CFR
 * 273.24(c), 273.7(b)(1)(viii)), and somebody drawing unemployment
 * (273.7(b)(1)(v)). Until 2026-10-12 the student’s exemption wasn’t kept, and a
 * student in term was counted; until 2026-10-13 the claimant’s wasn’t. A
 * citizen's; a non-citizen's eligibility isn't kept.
 */

import type { Simulation } from '../core/simulation';
import { payeeAccount } from './cash';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_DAY, zonedParts, type Instant } from '../core/time';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { isoOfCountry } from './documents';
import { earningsOf, workedBetween } from './earnings';
import { schoolEnded, summerOf } from './school';
import { citizenOf } from './documents';

export const ASSISTANCE_KIND = 'benefits.assistance_month';

export const ONTARIO_WORKS = { basic: 343, shelterMax: 390, assets: 10_000, exemptBase: 200, exemptShare: 0.5, exemptAfterMonths: 3, decidedDays: 6 } as const;
export const BC_ASSISTANCE = { support: 560, shelterMax: 500, assets: 5_000, exempt: 600, exemptAfterMonths: 1, workSearchDays: 21 } as const;
export const SNAP = {
  fy: [
    { from: '2025-10-01', max: 298, standard: 209, shelterCap: 744, poverty: 1_305, least: 24 },
    { from: '2026-10-01', max: 306, standard: 217, shelterCap: 769, poverty: 1_330, least: 25 },
  ],
  /** The state's gross limit, of the poverty line, and its heating and cooling utility allowance a month, fiscal 2026. */
  grossLimit: { 'us-ny': 1.5, 'us-ca': 2, 'us-ct': 2 } as Readonly<Record<string, number>>,
  utilities: { 'us-ny': 877, 'us-ca': 663, 'us-ct': 976 } as Readonly<Record<string, number>>,
  utilitiesNyc: 1_062,
  nyc: ['us-ny-newyork', 'us-ny-manhattan', 'us-ny-brooklyn', 'us-ny-queens', 'us-ny-thebronx'] as readonly string[],
  /** The states it's kept in, where SLATE keeps benefits. */
  states: ['us-ny', 'us-ca', 'us-ct'] as readonly string[],
  earnedDeduction: 0.2,
  /** A month's paid hours that meet the student exemption's 20 a week (7 CFR 273.5(b)(5)): 20 × 52 ÷ 12. */
  studentHours: 87,
  share: 0.3,
  abawd: { from: 18, to: 64, hours: 80, months: 3, window: 36 },
} as const;

export type AssistanceScheme = 'ontario-works' | 'bc-assistance' | 'snap';
export interface AssistanceClaim { scheme: AssistanceScheme; since: Instant; months: number; /** SNAP: the months counted against the time limit, by 'YYYY-MM'. */ counted?: string[]; ebtAccountId?: string; closedAt?: Instant }

const YEAR = 365.2425 * MS_DAY;
const regionOf = (person: Person) => CITIES.get(person.currentLocationId)?.parentId ?? '';

/** The scheme where they live, if SLATE keeps one. */
export function schemeFor(person: Person): AssistanceScheme | undefined {
  const region = regionOf(person);
  if (region === 'ca-08') return 'ontario-works';
  if (region === 'ca-02') return 'bc-assistance';
  if (SNAP.states.includes(region)) return 'snap';
  return undefined;
}

const inLocal = (sim: Simulation, cents: Money, currency: string): Money => { const cur = saveCurrency(sim.universe); return cur === currency ? cents : exchange(cents, cur, currency) ?? cents; };
const toSave = (sim: Simulation, cents: Money, currency: string): Money => { const cur = saveCurrency(sim.universe); return cur === currency ? cents : exchange(cents, currency, cur) ?? cents; };
const liquid = (sim: Simulation, person: Person) => Object.values(sim.universe.accounts).filter((a) => a.ownerId === person.id && !a.nominal && !a.closedAt && (a.kind === 'checking' || a.kind === 'savings' || a.kind === 'cash')).reduce((x, a) => x + Math.max(0, a.balance), 0);
/**
 * The months SNAP reads and counts are kept in the zone the earnings record keys its months in, the save’s home
 * (`recordWages`, `recordBenefit` and `recordInterest` are given it). Until 2026-10-13 they were taken in UTC, so a
 * payment on a New Haven evening at the month’s end, already the next month in UTC, read its own month so far; found by
 * that day’s second round of evidence.
 */
const monthKey = (at: Instant, zone: string) => { const p = zonedParts(at, zone); return `${p.year}-${String(p.month).padStart(2, '0')}`; };

/**
 * The calendar month before a moment's own (from 2026-10-13: until then the month fifteen days back, so a payment on
 * the 16th or later read its own month so far; found by the review of that day).
 */
const monthBefore = (at: Instant, zone: string): { year: number; month: number } => {
  const now = zonedParts(at, zone);
  return now.month === 1 ? { year: now.year - 1, month: 12 } : { year: now.year, month: now.month - 1 };
};

/** A month's earnings, gross, in the save's money: the calendar month before a moment. */
function lastMonthEarned(person: Person, at: Instant, zone: string): Money {
  const p = monthBefore(at, zone);
  return earningsOf(person).months[`${p.year}-${String(p.month).padStart(2, '0')}`] ?? 0;
}

/**
 * The month before a moment as SNAP counts it (from 2026-10-10; 7 CFR 273.9): earned income (wages) and unearned
 * (interest, benefits, pensions), work-study left out (273.9(c)(3)). A month from before the kinds were kept is read
 * as it was, all of it earned.
 */
export function snapIncome(person: Person, at: Instant, zone: string): { gross: Money; earned: Money; workStudy: Money } {
  const p = monthBefore(at, zone);
  const key = `${p.year}-${String(p.month).padStart(2, '0')}`;
  const k = earningsOf(person).kinds?.[key];
  if (!k) { const all = earningsOf(person).months[key] ?? 0; return { gross: all, earned: all, workStudy: 0 }; }
  return { gross: k.wages + k.unearned, earned: k.wages, workStudy: k.workStudy };
}

/**
 * Why a student is refused SNAP, or nothing (from 2026-10-10; 7 CFR 273.5): enrolled at least half-time in higher
 * education, a student is ineligible unless exempt; the exemptions a Yale student can meet are a work-study award
 * during the school year (273.5(b)(5)) and paid work of 20 hours a week (273.5(b)(5) too), which the Summer Cabaret's
 * company is. SLATE's reading: the school year is the time outside the summer recess (`summerOf`).
 */
export function snapStudentRefusal(sim: Simulation, person: Person, at: Instant): string | undefined {
  const s = person.school;
  if (!s || schoolEnded(s.standing)) return undefined;
  if (!summerOf(person, at)) return undefined;
  if (workedBetween(sim, person, at - 30 * MS_DAY, at).hours >= SNAP.studentHours) return undefined;
  return 'A student in the summer without work-study or 20 hours of work a week isn’t eligible for SNAP (7 CFR 273.5).';
}

/** Why they can't claim, or nothing. */
export function assistanceRefusal(sim: Simulation, person: Person): string | undefined {
  const scheme = schemeFor(person);
  if (!scheme) return 'SLATE keeps assistance in Ontario, British Columbia, New York, California and Connecticut only yet.';
  if (person.assistance && person.assistance.closedAt === undefined) return 'You have a claim open.';
  const own = isoOfCountry(person.citizenshipId);
  if (scheme === 'snap' && own !== 'US' && !citizenOf(person, 'US')) return 'SNAP is kept for a citizen; a non-citizen’s eligibility turns on status SLATE doesn’t keep.';
  if (scheme !== 'snap' && own !== 'CA' && !citizenOf(person, 'CA')) return 'Assistance is kept for a Canadian citizen; a newcomer’s eligibility turns on status SLATE doesn’t keep.';
  const age = (sim.now - person.birthInstant) / YEAR;
  if (age < 18) return 'It’s claimed by an adult.';
  if (scheme === 'snap') { const student = snapStudentRefusal(sim, person, sim.now); if (student) return student; }
  if (scheme === 'ontario-works' && inLocal(sim, liquid(sim, person), 'CAD') > ONTARIO_WORKS.assets * 100) return `Ontario Works asks liquid assets under CAD ${ONTARIO_WORKS.assets.toLocaleString('en-US')}.`;
  if (scheme === 'bc-assistance' && inLocal(sim, liquid(sim, person), 'CAD') > BC_ASSISTANCE.assets * 100) return `Income assistance asks assets under CAD ${BC_ASSISTANCE.assets.toLocaleString('en-US')}.`;
  return undefined;
}

/** A month's Ontario Works or BC assistance, in Canadian cents: the rates less the earnings not exempt. */
export function provincialMonth(scheme: 'ontario-works' | 'bc-assistance', rentCad: Money, earnedCad: Money, monthsOn: number): Money {
  if (scheme === 'ontario-works') {
    const r = ONTARIO_WORKS;
    const kept = monthsOn >= r.exemptAfterMonths ? Math.min(earnedCad, r.exemptBase * 100) + Math.max(0, earnedCad - r.exemptBase * 100) * r.exemptShare : 0;
    return Math.max(0, r.basic * 100 + Math.min(rentCad, r.shelterMax * 100) - Math.round(earnedCad - kept));
  }
  const r = BC_ASSISTANCE;
  const kept = monthsOn >= r.exemptAfterMonths ? Math.min(earnedCad, r.exempt * 100) : 0;
  return Math.max(0, r.support * 100 + Math.min(rentCad, r.shelterMax * 100) - (earnedCad - kept));
}

/**
 * SNAP's fiscal year in force at a moment, which `snapMonth` pays from and Papers' At Most shows (from 2026-10-12:
 * until then At Most showed the last year kept, $306, in the five weeks before 1 October 2026 that pay $298).
 */
export function snapYearOn(at: Instant): (typeof SNAP.fy)[number] {
  return [...SNAP.fy].reverse().find((f) => at >= Date.parse(`${f.from}T00:00:00Z`)) ?? SNAP.fy[0]!;
}

/**
 * A month’s SNAP, in dollar cents: the maximum less 30% of net income, net of
 * the excess shelter deduction where shelter costs are given; or none over the
 * state’s gross limit. Under it, a household of one is eligible (each state
 * SLATE keeps sets that limit by broad-based categorical eligibility, which
 * waives the net limit) and is paid at least SNAP’s least, 8% of the thrifty
 * food plan for one, except in its initial month (7 U.S.C. 2017(a); 7 CFR
 * 273.10(e)(2)(ii)(C)): $24 in fiscal 2026 and $25 in 2027 (USDA’s cost-of-living
 * adjustments, the second of 21 August 2026). The initial month’s rule that
 * nothing under $10 is issued isn’t kept. With no state given, as for the
 * guide’s maximum, nothing is known of eligibility, and the formula alone is
 * worked. Until 2026-10-13 no least was paid, and an eligible month whose
 * income took the formula to nothing paid nothing; found by that day’s second
 * round of evidence.
 */
export function snapMonth(grossUsd: Money, earnedUsd: Money, at: Instant, shelterUsd = 0, state?: string, initial = false): Money {
  const fy = snapYearOn(at);
  if (state && grossUsd > Math.round(fy.poverty * (SNAP.grossLimit[state] ?? 1) * 100)) return 0;
  const before = Math.max(0, grossUsd - Math.round(earnedUsd * SNAP.earnedDeduction) - fy.standard * 100);
  const shelter = Math.min(fy.shelterCap * 100, Math.max(0, shelterUsd - Math.round(before / 2)));
  // Net income is never below nothing, and the benefit never above the maximum. Its 30% is rounded up to the dollar
  // (7 CFR 273.10(e)(2)(ii)(A), read on 2026-10-13 at law.cornell.edu: the other way it allows, rounding the allotment
  // down, comes to the same whole dollars), worked in hundredths of a cent so no float error crosses a dollar. The
  // income’s own rounding to the dollar, which 273.10(e)(1)(ii) leaves to the state, isn’t kept: it’s read to the cent.
  // Until 2026-10-13 the benefit was paid to the cent, $258.45 where the rule gives $258 (found by that day’s third round).
  const thirty = Math.ceil(Math.round(Math.max(0, before - shelter) * SNAP.share * 100) / 10_000) * 100;
  const formula = Math.max(0, fy.max * 100 - thirty);
  return state && !initial ? Math.max(fy.least * 100, formula) : formula;
}

/**
 * The shelter costs SNAP counts a month, in dollar cents: the rent, and the state's utility allowance where they paid
 * bills, until the home, its rent and its bills went in the scope reset of 2026-10-09. None is counted now.
 */
export function snapShelter(_sim: Simulation, _person: Person): Money {
  return 0;
}

function schedule(sim: Simulation, person: Person, at: Instant): void {
  sim.schedule({ at, kind: ASSISTANCE_KIND, label: 'Assistance, The Month', category: 'system', priority: 12, payload: { personId: person.id } });
}

export function registerAssistance(sim: Simulation): void {
  sim.onCommand<Record<string, never>, { scheme: AssistanceScheme; firstPaymentAt: Instant }>('benefits.assistance', (_p, { sim: s }) => {
    const person = s.player;
    const no = assistanceRefusal(s, person);
    if (no) throw new CommandError(no);
    const scheme = schemeFor(person)!;
    person.assistance = { scheme, since: s.now, months: 0 };
    // Ontario decides in four working days; British Columbia asks three weeks' work search first; SNAP pays from the month applied.
    const first = s.now + (scheme === 'ontario-works' ? ONTARIO_WORKS.decidedDays : scheme === 'bc-assistance' ? BC_ASSISTANCE.workSearchDays : 7) * MS_DAY;
    schedule(s, person, first);
    return { scheme, firstPaymentAt: first };
  });

  sim.onSchedule(ASSISTANCE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const claim = person?.assistance;
    if (!person || !claim || claim.closedAt !== undefined) return;
    // Moved away, the claim ends: each is the province's or the state's.
    if (schemeFor(person) !== claim.scheme) { claim.closedAt = s.now; return; }
    const mine = person.id === s.universe.playerId;
    const earned = lastMonthEarned(person, item.at, s.homeZone);
    let due = 0;
    if (claim.scheme === 'snap') {
      const age = (item.at - person.birthInstant) / YEAR;
      // The month's hours worked: the career's days until the career went in the scope reset of 2026-10-09, and from
      // 2026-10-10 the school's work-study and Summer Cabaret hours (`workedBetween`), which until then counted as none.
      const hours = workedBetween(s, person, item.at - 30 * MS_DAY, item.at).hours;
      const key = monthKey(item.at, s.homeZone);
      const within = (claim.counted ?? []).filter((m) => m > monthKey(item.at - SNAP.abawd.window * 30.44 * MS_DAY, s.homeZone));
      // A student enrolled at least half-time is exempt from work registration, and so from the time limit, through
      // vacations and recess too (7 CFR 273.7(b)(1)(viii), 273.24(c)): from 2026-10-12; until then a student in term was
      // counted, and three months of SNAP stopped it.
      const enrolled = person.school !== undefined && !schoolEnded(person.school.standing);
      // So is somebody receiving unemployment compensation, or applied for it and meeting its work search (7 CFR
      // 273.7(b)(1)(v), read on 2026-10-13 at law.cornell.edu; 7 U.S.C. 2015(d)(2)(A)): a claim open in its benefit
      // year. From 2026-10-13: until then a graduate drawing a Connecticut claim was counted, and cut off with “SNAP
      // Time Limit Reached” in her fourth month (found by that day’s third round).
      const ui = person.unemployment?.claim;
      const onUi = ui !== undefined && ui.endsAt > item.at;
      const limited = !enrolled && !onUi && age >= SNAP.abawd.from && age < SNAP.abawd.to + 1 && hours < SNAP.abawd.hours;
      if (limited && within.length >= SNAP.abawd.months) {
        if (mine) s.notify({ category: 'benefits', title: 'SNAP Time Limit Reached', body: 'Three months in three years without 80 hours of work a month: SNAP pays no more until you work them.', importance: 60, route: '/workspace/papers' });
        schedule(s, person, item.at + 30 * MS_DAY);
        return;
      }
      // Earned and unearned apart, work-study out (`snapIncome`); a student without an exemption is paid nothing that month.
      const income = snapIncome(person, item.at, s.homeZone);
      const student = snapStudentRefusal(s, person, item.at);
      // A student without an exemption isn't eligible: the case closes, told once, and can be applied for again once that
      // changes (from 2026-10-10: until then it stayed open and said so every month).
      if (student) {
        claim.closedAt = s.now;
        if (mine) s.notify({ category: 'benefits', title: 'Your SNAP Case Closed', body: `${student} Apply again once that changes.`, importance: 55, route: '/workspace/papers' });
        return;
      }
      // The claim’s first payment, a week after applying, is its initial month’s, when SNAP’s least isn’t paid.
      const initial = item.at - claim.since < 30 * MS_DAY;
      due = toSave(s, snapMonth(inLocal(s, income.gross, 'USD'), inLocal(s, income.earned, 'USD'), item.at, snapShelter(s, person), CITIES.get(person.currentLocationId)?.parentId, initial), 'USD');
      if (due > 0) {
        if (limited) claim.counted = [...within, key];
        const ebt = claim.ebtAccountId ? s.universe.accounts[claim.ebtAccountId] : undefined;
        const account = ebt ?? s.openAccount({ id: s.nextId('account'), kind: 'escrow', category: 'ebt', name: 'EBT Card, SNAP', ownerId: person.id, institution: 'SNAP', openedAt: s.now });
        claim.ebtAccountId = account.id;
        s.post({ memo: 'SNAP, the month, onto the EBT card', category: 'benefit', postings: [{ accountId: account.id, amount: due }, { accountId: s.nominalAccount('income', 'SNAP').id, amount: -due }] });
      }
    } else {
      const liquidCad = inLocal(s, liquid(s, person), 'CAD');
      const limit = (claim.scheme === 'ontario-works' ? ONTARIO_WORKS.assets : BC_ASSISTANCE.assets) * 100;
      if (liquidCad <= limit) {
        due = toSave(s, provincialMonth(claim.scheme, 0, inLocal(s, earned, 'CAD'), claim.months), 'CAD');
        if (due > 0) s.post({ memo: `${claim.scheme === 'ontario-works' ? 'Ontario Works' : 'Income assistance'}, the month`, category: 'benefit', postings: [{ accountId: payeeAccount(s, person).id, amount: due }, { accountId: s.nominalAccount('income', claim.scheme === 'ontario-works' ? 'Ontario Works' : 'Income Assistance').id, amount: -due }] });
      }
    }
    if (due > 0) claim.months += 1;
    if (due > 0 && mine) s.notify({ category: 'benefits', title: claim.scheme === 'snap' ? 'SNAP Paid' : 'Assistance Paid', body: `${formatMoney(due, saveCurrency(s.universe))} for the month.`, importance: 30, route: '/workspace/papers' });
    schedule(s, person, item.at + 30 * MS_DAY);
  });
}

/** What the EBT card holds for the day's groceries, in the save's money. */
export function ebtBalance(sim: Simulation, person: Person): Money {
  const id = person.assistance?.ebtAccountId;
  return id ? Math.max(0, sim.universe.accounts[id]?.balance ?? 0) : 0;
}
