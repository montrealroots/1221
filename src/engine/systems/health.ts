/**
 * SLATE — health cover after school, illness, and the bills it brings
 * (`content/safetynet.ts`).
 *
 * The Yale Health plan a student pays for covers the academic year, to the
 * end of July; after it they're covered by what they qualify for, or what
 * they buy. Until the connected world of 2026-10-09 an actor was covered by
 * what they earned too: SAG-AFTRA's plan and Equity-League's, earned by
 * acting work under each union, and COBRA to keep one lost. The career went
 * in the scope reset of 2026-10-09, nothing earns them now, and they went.
 * On a low month's income, Medicaid (Medi-Cal in California) or New York's
 * Essential Plan takes them at any time; otherwise the marketplace's
 * benchmark plan, in open enrollment or within 60 days of losing cover,
 * with the credit taken on the return. A month without cover in California
 * is a month of its penalty.
 *
 * Illness comes as it does to an adult their age (`health.illness`): the
 * flu in its season, a doctor's visit, an emergency, a stay in hospital. It
 * costs the body, a stay keeps them in hospital three days, and each brings a
 * bill for what their plan leaves them, or, uninsured, the price, less a
 * hospital's charity where their income earns it. A bill is due in 30 days;
 * unpaid, it's a medical debt, which goes on the record only at $500, a year
 * past due, and outside New York and California.
 *
 * Some carry a condition from the start, drawn at a young adult's rates
 * (`health.chronic`): depression, asthma, high blood pressure, and lenses.
 * Kept up, each costs its care each month at what the plan leaves; left
 * alone, depression weighs on morale and asthma doubles the emergencies. The
 * pharmacy fills the year's prescriptions at the counter, and the dentist and
 * the optician come at their rates, each plan paying what it covers of them.
 */

import type { Simulation } from '../core/simulation';
import { schoolEnded } from './school';
import { payeeAccount } from './cash';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { formatMoney, saveCurrency, type Money } from '../core/money';
import { MS_DAY, addYears, formatDate, instantFromZoned, normalDate, zonedParts, type Instant } from '../core/time';
import { afterBusinessDays } from '../content/bankdays';
import { exchange } from '../content/currency';
import { CITIES } from '../content/geography';
import { rateOn } from '../content/rates';
import {
  BENCHMARK, BENEFIT_STATE, IRISH_CARE, NHS, CARE, CONNECTICUT_ENROLLMENT, CHARITY, CHRONIC, DENTAL_PLANS, DENTAL_VISION, ENROLLMENT, INSULIN, MEDICAL_CPI, MEDICAL_DEBT, PHARMACY, PLANS, POVERTY_LINE, PUBLIC_COVER, byYear, medicalGrowth,
  type BenefitState, type PlanDesign,
} from '../content/safetynet';
import { earningsOf, homeOf, workedBetween } from './earnings';
import { expenseFor, payFromCurrent } from './spending';
import { personalityOf } from './personality';
import { clamp } from '../core/rng';
import { bmiOf } from './body';
import { ONSET, onsetYearly } from '../content/body';
import { fluByWeek, weekOfYear } from './seasons';
import { isoOfCountry } from './documents';
import { nhsByRoute, residenceIn } from './residence';
import { citizenOf, citizenshipsOf } from './documents';
import { FAIR_PHARMACARE, ONTARIO_DRUGS } from '../content/cabenefits';
import { eiWeek } from './eiself';
import { laidUp } from './injury';
import { clinicById, clinicFor, clinicRefusal, outsideItsPractice, selfPayAt } from './clinics';
import { appointmentsOf, book } from './appointments';
import { US_PHARMACIES, edMinutes, emergencyScale } from '../content/carevisits';
import { markRecord } from './credit';

export const HEALTH_MONTH_KIND = 'health.month';
/** A chronic condition: treated or not, its care unpaid this month, type 1 where diabetes, and its medicine's supply (from 2026-10-02). */
export interface Chronic {
  treated: boolean; lapsed?: boolean; typeOne?: boolean; supplyUntil?: Instant;
  /** Its last review, and when it was diagnosed in play (`REVIEW_MONTHS`, from 2026-10-03). */
  reviewedAt?: Instant; since?: Instant;
  /** When its prescription was written or last renewed, and a repeat ordered from the GP and when it's ready (`RX`, from 2026-10-03). */
  prescribedAt?: Instant; orderedReadyAt?: Instant;
}
export const HEALTH_WEEK_KIND = 'health.week';
/** A notice of noncompliance's thirty days over: the renewal or the application decided (from 2026-10-16). */
export const WORK_DECIDED_KIND = 'health.work_decided';
export const BILL_KIND = 'health.bill';

export type Cover = 'yale' | 'medicaid' | 'essential' | 'marketplace';
export type DentalPlan = 'ca' | 'ny' | 'yale';
export type Condition = 'depression' | 'asthma' | 'hypertension' | 'diabetes' | 'arthritis';
export const CONDITION_LABEL: Record<Condition, string> = { depression: 'Depression', asthma: 'Asthma', hypertension: 'High Blood Pressure', diabetes: 'Diabetes', arthritis: 'Arthritis' };

export interface MedicalBill {
  id: string; at: Instant; what: string; amount: Money; dueAt: Instant; paid?: boolean;
  /** Unpaid when it fell due, and owed as medical debt since (from 2026-10-10; until then such a bill was marked paid). */
  inDebt?: boolean;
  /** A hospital's bill, which its charity may take in, and the town it was billed in; and what an application for it came to. */
  hospital?: boolean;
  cityId?: string;
  /** Screened, an uninsured bill the charity took something off at billing; refused, one over its limit, at billing too from 2026-10-12. */
  aid?: 'free' | 'discount' | 'refused' | 'screened';
  /** A marketplace plan's claim denied, the share it would have left, and an appeal's day and outcome (`DENIALS`, from 2026-10-03). */
  denied?: { share: Money; appealedAt?: Instant; outcome?: 'upheld' | 'overturned' };
  /**
   * A plan's part of it (from 2026-10-15): the care's price to the plan (`planPrice`) and what the plan paid of it, the
   * price less the share, or nothing while a claim stands denied. Papers' Plan Paid reads it. Until then a bill said only
   * what was left to the patient, and what the plan paid was written nowhere.
   */
  covered?: { price: Money; planPaid: Money };
  /**
   * A line a change of cover wrote (`repriceCare`, from 2026-10-16): the bill it adjusts, and what came off where less is
   * owed. Its `covered.planPaid` is the plan's change, negative where the plan took its part back. Until 2026-10-16 a
   * change of cover rewrote the bill already issued: its share, its plan part, and Settled for one nobody paid.
   */
  adjusts?: string;
  credit?: Money;
  /** On a bill a later line credited before it was paid: what came off, so the share issued is `amount` + `credited`. */
  credited?: Money;
}

/**
 * A determination waiting on the person (from 2026-10-16): HUSKY D's work rules unverified, at a renewal or an
 * application (`healthMonth`, `health.apply`). The notice of noncompliance is dated `noticeAt`, taken as received five
 * days on, and gives thirty calendar days from then (42 CFR 435.558(a)(2), (c)(4)); the decision is made at `decideAt`.
 */
export interface PendingDetermination {
  kind: 'renewal' | 'application';
  state: BenefitState;
  noticeAt: Instant;
  decideAt: Instant;
  /** The months assessed, as 'YYYY-MM'. */
  months: string[];
  band: 'low' | 'high';
  /** A renewal's next renewal had it been kept; an application's first day had it been approved when made. */
  renewAt?: Instant;
  from?: Instant;
}

/**
 * Denials (from 2026-10-03; `research-health-travel-gaps.json`). An ACA
 * marketplace insurer denied 20% of in-network claims in 2023 (KFF), and a
 * denied claim is billed as if uninsured. It's appealed internally within
 * 180 days (HealthCare.gov), decided within 60 for care already had, and
 * insurers upheld 56% of the appeals filed (KFF). Fewer than 1% of denials
 * are appealed; here that's the player's choice. Other covers' denial rates
 * aren't published, and they aren't denied.
 */
export const DENIALS = { rate: 0.2, appealDays: 180, decideDays: 60, upheld: 0.56 } as const;
export const APPEAL_KIND = 'health.appeal_decided';

/**
 * Reviews of a chronic condition (from 2026-10-03; NICE's guidance, read for
 * `research-health-travel-gaps.json`): high blood pressure once a year,
 * asthma at least once a year, type 2 diabetes every six months once
 * stable. Depression's review two weeks after an antidepressant begins is
 * kept for a diagnosis made in play. Arthritis's interval wasn't read. Each
 * is a doctor's visit, booked when due and kept or missed as any other.
 */
export const REVIEW_MONTHS: Readonly<Partial<Record<Condition, number>>> = { hypertension: 12, asthma: 12, diabetes: 6 };
export const DEPRESSION_REVIEW_DAYS = 14;
export const reviewWhat = (c: Condition): string => `A review of your ${CONDITION_LABEL[c].toLowerCase()}`;

/** Why a plan of their own ended, where that was their choice: dropped, or its premium left unpaid (from 2026-10-12). */
export type PlanEnded = 'voluntary' | 'nonpayment';

export interface HealthRecord {
  /** Their own doctor, a practice in the town they live in (`systems/clinics.ts`, from 2026-10-01). */
  clinicId?: string;
  /** A marketplace plan; `ended` says it was dropped or its premium went unpaid, which opens no special enrollment. */
  marketplace?: { from: Instant; until?: Instant; state: BenefitState; ended?: PlanEnded };
  /** Medicaid, Medi-Cal or the Essential Plan, and when it's next renewed. */
  program?: { kind: 'medicaid' | 'essential'; state: BenefitState; from: Instant; until?: Instant; renewAt: Instant; band: 'low' | 'high'; /** California's state-funded Medi-Cal for someone without satisfactory status: kept from before 2026 in full, or restricted to emergencies (`MEDI_CAL_UIS`). */ scope?: 'state' | 'restricted'; /** Its premium's months unpaid. */ unpaid?: number; /** Dropped, which opens no special enrollment. */ ended?: PlanEnded };
  /** The marketplace premiums paid each month, by year, for the premium tax credit. */
  premiums: Record<string, Money[]>;
  /** Months without cover while living in California, by year, for its penalty. */
  uncoveredInCalifornia: Record<string, number>;
  /**
   * When cover last ended, which opens 60 days to enroll: Yale Health's end, a program ended at renewal, or status. A
   * plan dropped or left unpaid doesn't set it (45 CFR 155.420(e)(1)); until 2026-10-12 it did, and a premium could be
   * skipped at will and the plan taken up again within the 60 days.
   */
  lostAt?: Instant;
  /** Whether they were covered at the last month's start. */
  covered: boolean;
  /** What they've paid toward care this year, and toward its deductible. */
  spent: Record<string, Money>;
  deductible: Record<string, Money>;
  bills: MedicalBill[];
  /**
   * Care had, what it was, what their share was and the bill it went on, the latest 60 (from 2026-10-10): a change of
   * cover back in time bills it again as the cover then was (`repriceCare`). Yale Health's $0 share makes no bill, so
   * without it a cancellation back to a term's start had nothing to reckon.
   */
  careLog?: { at: Instant; care: Care; what: string; share: Money; billId?: string; adjusted?: { at: Instant; why: string; change: Money; plan?: Money }[]; /** Where a visit was had, so a change of cover reads it there again (from 2026-10-15). */ clinicId?: string; /** What the plan paid of it (from 2026-10-16): its price less the share where the cover paid, and no bill is made for a share of $0, so this is where HUSKY D's or Yale Health's part of a $0 visit is kept. `repriceCare` moves it. Absent on a log written before, and read then from its bill, or as none. */ planPaid?: Money }[];
  /** A determination waiting on the person: HUSKY D's work rules unverified (from 2026-10-16). */
  pending?: PendingDetermination;
  /**
   * Care older than the log keeps, by year: how many events and what was charged (from 2026-10-10). The log itself keeps
   * every event within `CARE_LOG.keepDays`, past any cover change's reach back, and any event whose bill is still
   * open, in debt or under appeal, however old: nothing a claim, an appeal or a change of cover needs is dropped to
   * keep the list short. Until 2026-10-10 the log kept the latest 60 events, whatever they were.
   */
  careArchive?: Record<string, { events: number; charged: Money }>;
  /** In hospital until: a stay, or an emergency department's hours. */
  inHospitalUntil?: Instant;
  /** The American pharmacy their prescriptions are filled at (`US_PHARMACIES`, from 2026-10-01). */
  pharmacy?: string;
  /** An injury mending, or the last one (`systems/injury.ts`). */
  injury?: import('./injury').Injury;
  /** Down with the flu until, and excused from classes for it (`school.call_in_sick`). */
  fluUntil?: Instant;
  /** The frailty band the year's odds of the end were last drawn at (`systems/birthdays.ts`). */
  endBand?: number;
  /** A medical debt past a year and reported, once. */
  reported?: boolean;
  debtSince?: Instant;
  seq?: number;
  /** Conditions carried, and whether they're kept up; whether they wear lenses, and the year of their last glasses. */
  /** Doctor's appointments booked, and a visit owed after one was missed or called off (`systems/appointments.ts`, from 2026-10-02). */
  appointments?: import('./appointments').Appointment[];
  /** An English prescription prepayment certificate's end (`health.prepay`, from 2026-10-02). */
  prepaidUntil?: number;
  owedVisit?: string;
  chronic?: Partial<Record<Condition, Chronic>>;
  /** A stand-alone dental plan: which, from and until, and this year's deductible and what it's paid. */
  dental?: { plan: DentalPlan; from: Instant; until?: Instant; deductible: Record<string, Money>; paid: Record<string, Money> };
  lenses?: boolean;
  lastGlasses?: number;
  drawn?: boolean;
  /** What's been paid toward a plan's brand-drug deductible this year, and its admission copays. */
  rxDeductible?: Record<string, Money>;
  /** A Canadian's drug plan paid toward, by program year or quarter (`canadianDrugShare`). */
  caDrug?: Record<string, Money>;
  stayCopays?: Record<string, Money>;
}

/**
 * The bills kept: the last forty settled, and every one still open, owed, in debt or under appeal (from 2026-10-10:
 * until then the last forty of all, and an unpaid bill or one under appeal that fell off was never charged).
 */
export function keptBills<T extends { paid?: boolean; inDebt?: boolean; denied?: { appealedAt?: Instant; outcome?: string } }>(bills: T[]): T[] {
  const open = (b: T) => !b.paid || b.inDebt === true || (b.denied?.appealedAt !== undefined && b.denied.outcome === undefined);
  const settled = bills.filter((b) => !open(b));
  const drop = new Set(settled.slice(0, Math.max(0, settled.length - 40)));
  return bills.filter((b) => !drop.has(b));
}

export function healthOf(person: Person): HealthRecord {
  person.health ??= { premiums: {}, uncoveredInCalifornia: {}, covered: true, spent: {}, deductible: {}, bills: [] };
  const h = person.health;
  h.spent ??= {};
  h.deductible ??= {};
  h.bills ??= [];
  return h;
}

const usd = (cents: Money, into: string) => (into === 'USD' ? cents : exchange(cents, 'USD', into) ?? cents);
const HOME = 'America/New_York';
const firstOf = (year: number, month: number, zone = HOME) => instantFromZoned({ ...normalDate(year, month, 1), hour: 0 }, zone);
const monthKey = (at: Instant) => { const p = zonedParts(at, HOME); return `${p.year}-${String(p.month).padStart(2, '0')}`; };
const lastMonthKey = (at: Instant) => { const p = zonedParts(at, HOME); const d = normalDate(p.year, p.month - 1, 1); return `${d.year}-${String(d.month).padStart(2, '0')}`; };
const inCalifornia = (cityId: string) => CITIES.get(cityId)?.parentId === 'us-ca';
const active = (r: { from: Instant; until?: Instant } | undefined, at: Instant) => r !== undefined && at >= r.from && (r.until === undefined || at < r.until);

/**
 * Until when the Yale Health plan covers them: while at school; after the degree, or the last term finished without
 * it, to 31 July; after a withdrawal, thirty days, or none where it came by the fifteenth day of classes; after a
 * dismissal, thirty days, SLATE's reading (from 2026-10-10: before the Bulletin's withdrawal rules were read, a
 * dismissal ran to the end of the term's cover, and before that to 31 July).
 */
export function yaleUntil(person: Person): Instant | undefined {
  const school = person.school;
  if (!school) return undefined;
  if (!schoolEnded(school.standing)) return Number.POSITIVE_INFINITY;
  const since = school.endedAt;
  if (since === undefined) return Number.POSITIVE_INFINITY;
  const p = zonedParts(since, HOME);
  // The degree, or the last term finished without it: covered through 31 July, as Yale Health says a graduate is.
  if (school.standing === 'graduated' || school.standing === 'withheld') return firstOf(p.month >= 8 ? p.year + 1 : p.year, 8);
  // A withdrawal: on or before the fifteenth day of classes the cover ends on the day, and where the insurance term
  // began before it (1 August, in a fall) it's canceled back to then by the `uncovered` gap the withdrawal opens
  // (`school.withdraw`, `yaleLapsed`); after it thirty days more (Bulletin 2026–27 p.174). A dismissal isn't named there;
  // SLATE gives it the thirty days. Until 2026-10-12 this said the cover was canceled back to the term's start, which
  // it never was: the term began three weeks after its insurance term in a fall, and a month before it in a spring.
  if (school.standing === 'withdrawn' && school.withdrewEarly) return since;
  return since + 30 * MS_DAY;
}

/**
 * Whether Yale Health's student cover had lapsed at a moment: a personal leave's, with no Affiliate cover bought
 * (`SchoolRecord.uncovered`, `systems/leave.ts`, from 2026-10-10).
 */
export function yaleLapsed(person: Person, at: Instant): boolean {
  return (person.school?.uncovered ?? []).some((g) => at >= g.from && (g.until === undefined || at < g.until));
}

/**
 * When Yale Health's cover, covering them at a moment, ends, where its end is set (after the degree, a withdrawal or a
 * dismissal), or nothing (from 2026-10-12): a plan enrolled in before it starts then (`health.enroll`).
 */
export function yaleEndsAhead(person: Person, at: Instant): Instant | undefined {
  const yale = yaleUntil(person);
  return yale !== undefined && Number.isFinite(yale) && yale > at && !yaleLapsed(person, at) ? yale : undefined;
}

/** What covers them at a moment, first match. */
export function coverOn(person: Person, at: Instant): Cover | undefined {
  const h = person.health;
  if (at < (yaleUntil(person) ?? 0) && !yaleLapsed(person, at)) return 'yale';
  if (active(h?.program, at)) return h!.program!.kind;
  if (active(h?.marketplace, at)) return 'marketplace';
  return undefined;
}

/** The plan design that covers them, for what care leaves them. */
export function planOf(person: Person, at: Instant): PlanDesign | undefined {
  const cover = coverOn(person, at);
  if (!cover) return undefined;
  return PLANS[planKey(person, at)!];
}

/** Which plan's tables apply: the state's marketplace, the Essential Plan's band. */
export function planKey(person: Person, at: Instant): string | undefined {
  const cover = coverOn(person, at);
  const h = person.health;
  if (!cover) return undefined;
  if (cover === 'essential') return h!.program!.state === 'ct' ? 'covered-ct' : `essential-${h!.program!.band}`;
  if (cover === 'marketplace') return `marketplace-${h!.marketplace!.state}`;
  // Medi-Cal and HUSKY D ask no copays, where New York's Medicaid asks a dollar at the pharmacy.
  if (cover === 'medicaid' && h!.program!.state !== 'ny') return 'essential-low';
  return cover;
}

/** The poverty line a month, in a year. */
const povertyMonth = (year: number, into: string) => usd(byYear(POVERTY_LINE, year), into) / 12;

/**
 * Whether their status lets them have Medicaid: until 1 October 2026 SLATE
 * asked none; from then, a US citizen, or five years with a green card
 * (`systems/residence.ts`). An O-1's holder isn't among the groups the law
 * names. In New York the Essential Plan's income band still reaches them,
 * as SLATE had it, and rightly: it takes anyone lawfully present to 200% of
 * the poverty line (NY State of Health, `research-sweep5.json`).
 *
 * California's state-funded Medi-Cal, from later on 2026-09-30, for someone
 * without satisfactory immigration status (a citizen's, or a green card's
 * after five years, here; an O-1's holder among those without), from DHCS's
 * guidance as the research read it:
 * - from 1 January 2026, a new adult applicant gets restricted scope only,
 *   emergency care (and pregnancy, which SLATE's lives don't carry);
 * - one enrolled before then keeps full scope while enrolled;
 * - its non-emergency dental ends on 1 July 2026;
 * - from 1 July 2027, $30 a month from 19 to 59, and after 90 days unpaid
 *   it's restricted scope (ACWDL 25-33).
 * Its three months' grace to re-enroll isn't kept. The federal work rule
 * isn't asked of it: the state funds it.
 */
export const MEDI_CAL_UIS = { freezeFrom: Date.UTC(2026, 0, 1), dentalEnds: Date.UTC(2026, 6, 1), premiumFrom: Date.UTC(2027, 6, 1), premium: 30, ages: [19, 59] as const, unpaidMonths: 3 } as const;

/** A citizen's status, or a green card's after five years: what Medicaid and Medi-Cal call satisfactory. */
const satisfactory = (person: Person, at: Instant): boolean => {
  if (citizenOf(person, 'US')) return true;
  const card = residenceIn(person, 'US', at);
  return card?.route === 'us-green-card' && at - (card.issuedAt ?? at) >= 5 * 365.2425 * MS_DAY;
};

/** Whether their cover is California's restricted scope: emergency care only. */
export const restrictedScope = (person: Person, at: Instant): boolean => coverOn(person, at) === 'medicaid' && person.health?.program?.scope === 'restricted';
export function medicaidStatus(person: Person, at: Instant): boolean {
  if (at < Date.UTC(2026, 9, 1) || citizenOf(person, 'US')) return true;
  const card = residenceIn(person, 'US', at);
  return card?.route === 'us-green-card' && at - (card.issuedAt ?? at) >= 5 * 365.2425 * MS_DAY;
}

/**
 * Whether a premium tax credit may be had for cover beginning at an instant, by status, and by income as a share of the
 * year before's poverty line (from 2026-10-15). Covered Connecticut is a silver plan bought with "100% of
 * available Advanced Premium Tax Credits" by somebody "eligible for financial help" (portal.ct.gov/dss, Covered
 * Connecticut Program, read 2026-10-15), so it's for the credit's people alone:
 * - from 2027, a noncitizen's credit is a green card holder's, a Cuban or Haitian entrant's or a Compact of Free
 *   Association migrant's, and no other lawfully present noncitizen's, an F-1 student's or a graduate's on OPT among
 *   them (Pub. L. 119-21 §71301, 26 USC 36B(e)(2)(B), for taxable years beginning after 31 December 2026; govinfo.gov
 *   PLAW-119publ21, read 2026-10-15; Access Health CT, "Resources for Lawfully Present Immigrants", read 2026-10-15:
 *   "Starting in 2027, you can get financial help only if you have a Green Card, are a Cuban or Haitian entrant ... or
 *   are in the U.S. under a Compact of Free Association"). SLATE's lives are citizens, green card holders or students
 *   and graduates in F-1 status, so the last two groups aren't reached;
 * - from 2026, none under 100% of the poverty line: 36B(c)(1)(A) starts the credit there, and the exception for a
 *   lawfully present noncitizen barred from Medicaid by status, 36B(c)(1)(B), was struck for taxable years beginning
 *   after 31 December 2025 (Pub. L. 119-21 §71302). The return reads the same floor (`applicablePercent`).
 * Until 2026-10-15 Covered Connecticut asked neither: an F-1 student withdrawn in the fall, in her fifteen days' grace,
 * was given it on a month's work-study under the poverty line, and one enrolling in December for January was given it
 * for 2027.
 */
export const creditAllowed = (person: Person, startsAt: Instant, ratio: number): boolean => ratio >= PREMIUM_CREDIT_RULES.floor && creditStatus(person, startsAt);
/** Whether their status admits them to the premium tax credit for cover at an instant (`creditAllowed`). */
export function creditStatus(person: Person, at: Instant): boolean {
  if (at < firstOf(PREMIUM_CREDIT_RULES.eligibleAliensFrom, 1) || citizenOf(person, 'US')) return true;
  return residenceIn(person, 'US', at)?.route === 'us-green-card';
}
/** The credit's floor, a share of the poverty line, and the year its eligible noncitizens begin (`creditAllowed`). */
export const PREMIUM_CREDIT_RULES = { floor: 1, eligibleAliensFrom: 2027 } as const;

/*
 * Medicaid's community engagement from 2027 (Pub. L. 119-21 §71119, 42 USC 1396a(xx)(2)). Until 2026-10-16 `engaged`
 * read the one month before a moment, at an application and at a renewal alike, by work's hours and pay
 * (`lastMonthWork`) and the School, with no exception of any kind. The schooling counted from 2026-10-15: until then a
 * HUSKY D member back at the School from a leave was ended at renewal for having no work; until later that day it was
 * read at the instant asked, and a student at the School all of January 2027 who withdrew on 1 February was refused on
 * 2 February (found by play). Since 2026-10-16 a month is read by `monthEngagement`, and the months by `engagement`:
 * Connecticut's one before an application and six before a renewal (`lookBack`, `PUBLIC_COVER.workLookBack`).
 */
/** How a month meets Medicaid's work rules, or nothing: by work, by income, at school, or by an exception. */
export type EngagedBy = 'work' | 'income' | 'school' | 'age' | 'snap' | 'hardship';
/**
 * Whether a month meets Medicaid's community engagement, and how (from 2026-10-16), read from what SLATE holds as the
 * State's own records would (42 CFR 435.557, ex parte):
 * - 80 hours' work (435.552(a)(1)), the hours of the wages paid in it (`workedBetween`);
 * - a month's income of 80 hours at the federal minimum wage, $580 (435.552(f)), which is "the individual's MAGI-based
 *   income" (435.552(f)(2)), earned and unearned: CMS "considered counting only earned income" and didn't
 *   (CMS-2454-IFC, read 2026-10-16). It's the month's income the record holds, as `programFor` reads it, with any wages
 *   posted that the record doesn't. Until 2026-10-16 it was work's pay alone, and interest, a benefit or a pension of
 *   $580 or more didn't count;
 * - school at least half-time, any of the month at the School (`enrolledIn`);
 * - under 19, or 65 or over, for any part of it: the adult group is 19 to 64 (435.551, 435.553(a)(1)). SLATE's HUSKY D
 *   at 65 stands in for HUSKY C, which it doesn't keep; no life at Yale is under 21, so under 19 is a guard;
 * - SNAP received in it while not exempt from SNAP's work rules: out of school, no unemployment claim open, 18 to 64
 *   (435.554(c)(7); `systems/assistance.ts`), which Connecticut gives as "in a household receiving SNAP ... and not
 *   exempt from the SNAP work rules" (CHA, 8/25/26);
 * - a stay in hospital in it, on her request alone (`hardship`, 435.555(d)(1); Connecticut: "Were recently inpatient in
 *   a hospital"), which the notice of noncompliance offers (`health.request_hardship`).
 * What SLATE doesn't hold isn't read: pregnancy, children, caring for a disabled person, a veteran's rating, tribal
 * membership, foster care, Medicare, prison, TANF, treatment for addiction, a disaster or an unemployment county,
 * travel for care, and medical frailty, whose list Connecticut hasn't published and which SLATE's conditions, kept up or
 * not, don't make (none of them keeps a life from work or school here).
 */
export function monthEngagement(sim: Simulation, person: Person, key: string, cur: string, hardship = false): EngagedBy | undefined {
  const year = Number(key.slice(0, 4));
  const month = Number(key.slice(5, 7));
  const from = firstOf(year, month);
  const until = firstOf(year, month + 1);
  const yearsAt = (t: Instant) => (t - person.birthInstant) / (365.2425 * MS_DAY);
  if (yearsAt(from) < 19 || yearsAt(until - 1) >= 65) return 'age';
  if (enrolledIn(person, from, until)) return 'school';
  const work = workedBetween(sim, person, from, until);
  if (work.hours >= PUBLIC_COVER.workHours) return 'work';
  const kinds = earningsOf(person).kinds?.[key];
  const recordedPay = kinds ? kinds.wages + kinds.workStudy : 0;
  const income = (earningsOf(person).months[key] ?? 0) + Math.max(0, work.pay - recordedPay);
  if (false && income >= usd(PUBLIC_COVER.workEarnings, cur)) return 'income';
  const snap = sim.universe.transactions.some((t) => t.at >= from && t.at < until && t.memo === 'SNAP, the month, onto the EBT card' && t.postings.some((q) => sim.universe.accounts[q.accountId]?.ownerId === person.id));
  const claims = [person.unemployment?.claim, ...(person.unemployment?.past ?? [])].filter((c) => c !== undefined);
  const onUi = claims.some((c) => c.filedAt < until && (c.closedAt ?? c.endsAt) > from);
  if (snap && !onUi && yearsAt(from) >= 18 && yearsAt(from) < 65) return 'snap';
  if (hardship && (person.health?.careLog ?? []).some((e) => e.care === 'stay' && e.at >= from && e.at < until)) return 'hardship';
  return undefined;
}
/** The first of the months that meets the work rules, and how; or nothing. */
export function engagement(sim: Simulation, person: Person, months: string[], cur: string, hardship = false): { month: string; by: EngagedBy } | undefined {
  for (const month of months) { const by = monthEngagement(sim, person, month, cur, hardship); if (by) return { month, by }; }
  return undefined;
}
/** The calendar months a look-back reads before a moment's month, the latest first: one before an application, six (in Connecticut) before a renewal. */
export function lookBack(at: Instant, state: BenefitState, kind: 'apply' | 'renew'): string[] {
  const n = (PUBLIC_COVER.workLookBack[state === 'ct' ? 'ct' : 'other'])[kind];
  const p = zonedParts(at, HOME);
  return Array.from({ length: n }, (_, i) => { const d = normalDate(p.year, p.month - 1 - i, 1); return `${d.year}-${String(d.month).padStart(2, '0')}`; });
}
/** A month's key in words: '2027-10' is October 2027. */
const monthWords = (key: string): string => `${MONTH_NAMES[Number(key.slice(5, 7)) - 1]} ${key.slice(0, 4)}`;
/** The months assessed in words, the earliest first: "October 2027", or "May to October 2027". */
export const monthsWords = (months: string[]): string => {
  const sorted = [...months].sort();
  if (sorted.length === 1) return monthWords(sorted[0]!);
  const [first, last] = [sorted[0]!, sorted[sorted.length - 1]!];
  return first.slice(0, 4) === last.slice(0, 4) ? `${MONTH_NAMES[Number(first.slice(5, 7)) - 1]} to ${monthWords(last)}` : `${monthWords(first)} to ${monthWords(last)}`;
};
/** The day a notice dated `noticeAt` is answered by: received five days on, and the thirtieth calendar day from then. */
export function answerBy(noticeAt: Instant): Instant {
  const p = zonedParts(noticeAt, HOME);
  return instantFromZoned({ ...normalDate(p.year, p.month, p.day + PUBLIC_COVER.noticeReceivedDays + PUBLIC_COVER.answerDays - 1), hour: 12 }, HOME);
}
/** When the answer's thirty days are over, and the decision is made: the start of the day after the last. */
export function decisionAt(noticeAt: Instant): Instant {
  const p = zonedParts(noticeAt, HOME);
  return instantFromZoned({ ...normalDate(p.year, p.month, p.day + PUBLIC_COVER.noticeReceivedDays + PUBLIC_COVER.answerDays), hour: 0 }, HOME);
}
/**
 * When cover found ineligible ends, said at `at`: the end of the month in which the ten days' advance notice run out
 * (42 CFR 431.211; Connecticut's UPM 1570.10(A)(1)), the first of the next month at midnight. SLATE's reading, as
 * Connecticut's own day of discontinuance wasn't found: it is never later than the end of the month after a notice of
 * noncompliance's thirty days end (42 CFR 435.558(d)(2)(ii)). From 2026-10-16: until then a renewal ended cover at its
 * own hour, with nothing said ahead.
 */
export function endsAfterNotice(at: Instant): Instant {
  const p = zonedParts(at + PUBLIC_COVER.advanceNoticeDays * MS_DAY, HOME);
  return firstOf(p.year, p.month + 1);
}
/** The last day cover ending at `until` (a month's first, at midnight) covers. */
const lastDayBefore = (until: Instant): Instant => until - 12 * 60 * 60_000;
/**
 * Whether they held an enrollment at the School in a month, as CMS's interim final rule of 3 June 2026 reads it (42 CFR
 * 435.552(c), CMS-2454-IFC, public-inspection.federalregister.gov/2026-11094.pdf, read 2026-10-15). The status is the
 * school's (the School's program is full-time); it "begins on the first day of the school term", "will continue
 * through normal periods of attendance, vacation, and recess", and "will end at the end of the month that the student
 * is expelled, withdraws, completes the school term and is not registered for the next school term ..., or graduates".
 * So a month counts where any of it was spent at the School: the month she leaves, by a leave, a withdrawal, a
 * dismissal or the degree, counts whole, and so does the month she comes back from a leave. A month wholly on a leave,
 * or after the School ended, doesn't. A save from before 2026-10-09 whose School ended kept no `endedAt`, and is read
 * as ended before the month.
 */
export function enrolledIn(person: Person, from: Instant, until: Instant): boolean {
  const school = person.school;
  if (!school) return false;
  if (schoolEnded(school.standing) && (school.endedAt ?? Number.NEGATIVE_INFINITY) < from) return false;
  const leaves = [...(school.leaves ?? []), ...(school.leave ? [school.leave] : [])];
  return !leaves.some((l) => l.startedAt !== undefined && l.status !== 'rescinded' && l.startedAt < from && (l.returnedAt === undefined || l.returnedAt >= until));
}
/** Whether Medicaid's community engagement is asked of a program at an instant: federal Medicaid, from 2027. */
const engagementAsked = (prog: { kind: 'medicaid' | 'essential'; scope?: 'state' | 'restricted' }, at: Instant): boolean =>
  prog.kind === 'medicaid' && prog.scope === undefined && monthKey(at) >= PUBLIC_COVER.workFrom.slice(0, 7);

/**
 * What program last month's income qualifies them for where they live: Medicaid, the Essential Plan, or none. `startsAt`
 * is when its cover would begin, which Covered Connecticut's credit reads (`creditAllowed`): next month's first, for an
 * enrollment; the renewal's own instant, for a renewal.
 */
export function programFor(person: Person, at: Instant, into = 'USD', startsAt = at): { kind: 'medicaid' | 'essential'; band: 'low' | 'high'; scope?: 'state' | 'restricted' } | undefined {
  const state = BENEFIT_STATE[homeOf(person)];
  if (!state) return undefined;
  const income = earningsOf(person).months[lastMonthKey(at)] ?? 0;
  const ratio = income / povertyMonth(zonedParts(at, HOME).year, into);
  // California's state-funded Medi-Cal for someone without satisfactory status, from 2026 (`MEDI_CAL_UIS`).
  if (state === 'ca' && ratio <= PUBLIC_COVER.medicaidShare && at >= MEDI_CAL_UIS.freezeFrom && !satisfactory(person, at)) {
    const prog = person.health?.program;
    const kept = prog && prog.kind === 'medicaid' && prog.state === 'ca' && prog.from < MEDI_CAL_UIS.freezeFrom && (prog.until === undefined || prog.until > at) && prog.scope !== 'restricted';
    return { kind: 'medicaid', band: 'low', scope: kept ? 'state' : 'restricted' };
  }
  // From 1 October 2026 federal Medicaid is a citizen's, or a green card holder's after five years (Pub. L. 119-21 §71109).
  if (ratio <= PUBLIC_COVER.medicaidShare && medicaidStatus(person, at)) return { kind: 'medicaid', band: 'low' };
  // The Essential Plan and Covered Connecticut are for the lawfully present too, as the marketplace is (`lawfullyPresent`, from 2026-10-09).
  if (!lawfullyPresent(person)) return undefined;
  if (state === 'ny' && ratio <= PUBLIC_COVER.essentialShare) return { kind: 'essential', band: ratio <= PUBLIC_COVER.essentialCopaysFrom ? 'low' : 'high' };
  // The Essential Plan, New York's Basic Health Program from 1 July 2026, isn't the credit: a Basic Health Program takes
  // the lawfully present to 200% of the poverty line (42 USC 18051(e)(1)), and New York keeps covering those the credit
  // no longer reaches from 2027 out of the program's trust fund, which the Division of the Budget reckons will last
  // through 31 December 2028 (Office of the State Comptroller, Report on the Enacted Budget, SFY 2027, July 2026, read
  // 2026-10-15: "This would allow the Essential Plan to continue to serve certain immigrants using excess resources
  // accumulated in trust under the BHP"). So it's kept for them; what New York does after 2028 isn't known.
  // Covered Connecticut reads the year before's poverty line, as the marketplace does, and is had with the premium tax
  // credit, so for its people alone (`creditAllowed`, from 2026-10-15).
  // And it's for somebody "ineligible for HUSKY Health/Medicaid due to income": "If your household income makes you
  // eligible for HUSKY Health/Medicaid, you are not eligible for the Covered CT Program" (portal.ct.gov/dss and
  // help.accesshealthct.com, Covered Connecticut Program, read 2026-10-16; CMS's approval of 15 December 2022 describes
  // its people as having "income that is above the Medicaid limit"). So an income HUSKY D's line takes isn't
  // Covered Connecticut's, whatever the status: a noncitizen HUSKY D bars by status, at 100% to 138%, is given the
  // marketplace, whose credit the return gives from 100% (`figuresFor`). Neither DSS nor Access Health CT was found to
  // say how it treats that person in so many words; this follows the words it publishes. From 2026-10-16: until then
  // she was given Covered Connecticut on any income from 100% to 175%.
  const prior = income / povertyMonth(zonedParts(at, HOME).year - 1, into);
  if (state === 'ct' && ratio > PUBLIC_COVER.medicaidShare && prior <= PUBLIC_COVER.coveredCtShare && creditAllowed(person, startsAt, prior)) return { kind: 'essential', band: 'low' };
  return undefined;
}

/** What each state calls its programs. */
export const PROGRAM_NAMES: Readonly<Record<BenefitState, { medicaid: string; essential: string }>> = {
  ny: { medicaid: 'Medicaid', essential: 'the Essential Plan' },
  ca: { medicaid: 'Medi-Cal', essential: 'the Essential Plan' },
  ct: { medicaid: 'HUSKY D', essential: 'Covered Connecticut' },
};

/**
 * Whether they may hold a marketplace plan: a citizen, or anybody lawfully present, as a student in F-1 status, a
 * graduate on OPT or in its grace and a green card holder are; not somebody who stayed past their status (45 CFR
 * 155.305(a)(1)). From 2026-10-09: until then the marketplace sold to anybody, and a graduate's status, read by
 * nothing since travel went, changed nothing a student's life touched.
 */
export const lawfullyPresent = (person: Person): boolean => person.usOutOfStatus === undefined;

/**
 * When cover enrolled in at an instant begins: the first of next month, or, enrolled before Yale Health's cover ends,
 * the first of the month on or after its end (45 CFR 155.420(b)(2)(iv)): after the degree, 1 August, with no gap (from
 * 2026-10-12, when that became possible). `health.enroll` and `mayEnroll` read it alike from 2026-10-15.
 */
export function enrollStart(person: Person, at: Instant): Instant {
  const p = zonedParts(at, HOME);
  const ends = yaleEndsAhead(person, at);
  const e = ends === undefined ? undefined : zonedParts(ends, HOME);
  const onOrAfterEnd = e === undefined ? 0 : firstOf(e.year, e.month) >= ends! ? firstOf(e.year, e.month) : firstOf(e.year, e.month + 1);
  return Math.max(firstOf(p.year, p.month + 1), onOrAfterEnd);
}

/**
 * Whether they may enroll now, in a program or the marketplace, and in which. `sim` is the world last month's work is
 * read from, for Medicaid's community engagement; without it none is read, as a life with no wages has none.
 */
export function mayEnroll(person: Person, at: Instant, into = 'USD', sim?: Simulation): { ok: boolean; why: string; program?: 'medicaid' | 'essential' } {
  const state = BENEFIT_STATE[homeOf(person)];
  if (!state) return { ok: false, why: 'SLATE has public cover and the marketplace in New York, Los Angeles and New Haven.' };
  const h = healthOf(person);
  if (active(h.program, at) || active(h.marketplace, at)) return { ok: false, why: 'You’re enrolled.' };
  // Enrolled already from a month ahead (from 2026-10-10: until then a second enrollment could be made while the first waited).
  const ahead = [h.program, h.marketplace].find((c) => c !== undefined && c.from > at && (c.until === undefined || c.until > c.from));
  if (ahead) return { ok: false, why: `You’re enrolled from ${formatDate(ahead.from, HOME)}.` };
  // Covered by Yale Health, which the school bills for: a plan beside it would be paid for twice (from 2026-10-10).
  // Its end in sight (after the degree, a withdrawal or a dismissal), the 60 days open before it, as 45 CFR
  // 155.420(c)(2) opens them before an expected loss, and the cover starts as Yale Health's ends (`yaleEndsAhead`,
  // `health.enroll`). From 2026-10-12: until then they opened only once it had ended, and cover began on the first of
  // the month after enrolling, so a graduate went uninsured through August.
  const yale = yaleUntil(person);
  const opensAt = yale !== undefined && Number.isFinite(yale) ? yale - ENROLLMENT.specialDays * MS_DAY : undefined;
  if (yale !== undefined && yale > at && !yaleLapsed(person, at) && (opensAt === undefined || at < opensAt)) return { ok: false, why: opensAt !== undefined ? `Yale Health covers you until ${formatDate(yale, HOME)}; you can enroll from ${formatDate(opensAt, HOME)}, ${ENROLLMENT.specialDays} days before that cover ends.` : 'Yale Health covers you while you’re at the School.' };
  const endsAhead = yaleEndsAhead(person, at) !== undefined;
  const program = programFor(person, at, into, enrollStart(person, at));
  // From 2027 Medicaid's community engagement is asked of an applicant as of a member: Connecticut reads the one month
  // before the month she applies (Pub. L. 119-21 §71119, 42 USC 1396a(xx)(1)(A): "1 or more but not more than 3 (as
  // specified by the State) consecutive months immediately preceding the month during which such individual applies",
  // govinfo.gov PLAW-119publ21, read 2026-10-15; "If not exempt from the work rules at initial application, eligibility
  // includes a 1-month look back", Connecticut Hospital Association's HUSKY D materials from DSS's, 25 August 2026, read
  // 2026-10-15; `lookBack`). Short of it, she's taken to be eligible for Medicaid for the premium tax credit
  // (1396a(xx)(7)(B)), so Covered Connecticut isn't hers either, and the marketplace is, in its own windows. From
  // 2026-10-15: until then Enroll asked no work, and a member ended at renewal for having none had HUSKY D back by
  // pressing it the next day.
  // Short of it, HUSKY D isn't refused outright: an application is denied only after a notice of noncompliance and
  // thirty days to answer (42 CFR 435.558), so it can be applied for on that notice (`health.apply`, `applyRefusal`),
  // beside the marketplace Enroll buys. From 2026-10-16: until then Enroll's refusal was the end of it. The sentence
  // names income, not earnings, and an exception, from 2026-10-16 (`monthEngagement`): until then it said "of earnings".
  const months = lookBack(at, state, 'apply');
  const unengaged = program !== undefined && engagementAsked(program, at) && !(sim !== undefined && engagement(sim, person, months, into));
  const refused = unengaged ? `From January 1, 2027, ${PROGRAM_NAMES[state].medicaid} asks an applicant for ${workWords(into)} in the month before, and last month had none of them.` : undefined;
  if (program && !refused) return { ok: true, why: `Last month’s income qualifies you for ${PROGRAM_NAMES[state][program.kind]}, at any time and with no premium.`, program: program.kind };
  const also = (r: { ok: boolean; why: string }) => (refused ? { ok: r.ok, why: `${refused} ${r.ok ? `The marketplace is open to you: ${r.why.charAt(0).toLowerCase()}${r.why.slice(1)}` : r.why}` } : r);
  return also(marketplaceOpen(person, at, state, endsAhead, h));
}

/** Whether the marketplace takes them now: in open enrollment, or the 60 days around a loss of cover. */
function marketplaceOpen(person: Person, at: Instant, state: BenefitState, endsAhead: boolean, h: HealthRecord): { ok: boolean; why: string } {
  if (!lawfullyPresent(person)) return { ok: false, why: 'The marketplace sells to a citizen or somebody lawfully present, and you stayed past your status.' };
  const p = zonedParts(at, HOME);
  const window = state === 'ct' ? CONNECTICUT_ENROLLMENT : ENROLLMENT;
  const open = (p.month > window.openFrom[0] || (p.month === window.openFrom[0] && p.day >= window.openFrom[1]))
    || (p.month < window.openUntil[0] || (p.month === window.openUntil[0] && p.day <= window.openUntil[1]));
  if (open) return { ok: true, why: 'Open enrollment.' };
  if (endsAhead) return { ok: true, why: `Within ${ENROLLMENT.specialDays} days before Yale Health’s cover ends.` };
  // The 60 days run from the loss itself (45 CFR 155.420(c)(1)): Yale Health's end, or its lapse on a leave, counts from
  // that hour, not from the month's look that next finds her uncovered. From 2026-10-15: until then an F-1 student who
  // withdrew on 20 January 2027, Yale Health ending that hour, was told she was outside open enrollment and not within
  // 60 days of losing cover until 1 February.
  const lapse = (person.school?.uncovered ?? []).find((g) => at >= g.from && (g.until === undefined || at < g.until));
  const yale = yaleUntil(person);
  const yaleLost = lapse ? lapse.from : yale !== undefined && Number.isFinite(yale) && yale <= at ? yale : undefined;
  const lost = Math.max(h.lostAt ?? Number.NEGATIVE_INFINITY, yaleLost ?? Number.NEGATIVE_INFINITY);
  if (at - lost <= ENROLLMENT.specialDays * MS_DAY) return { ok: true, why: `Within ${ENROLLMENT.specialDays} days of losing cover.` };
  return { ok: false, why: `Outside open enrollment, ${window.openFrom[1]} ${MONTH_NAMES[window.openFrom[0] - 1]} to ${window.openUntil[1]} ${MONTH_NAMES[window.openUntil[0] - 1]}, and not within ${ENROLLMENT.specialDays} days of losing cover.` };
}

/** The benchmark plan's premium a month, where they live, in a year. */
export const benchmarkFor = (state: BenefitState, year: number, into: string): Money => usd(byYear(BENCHMARK[state], year), into);

/** The conditions a person carries (`health.chronic`), drawn once, at a young adult's rates. */
export function drawChronic(sim: Simulation, person: Person): void {
  const h = healthOf(person);
  if (h.drawn) return;
  h.drawn = true;
  const rng = sim.rng('health.chronic', person.id, 'carried');
  h.chronic = {};
  for (const [condition, share] of Object.entries(CHRONIC.share) as [Condition, number][]) if (rng.next() < share) h.chronic[condition] = { treated: true };
  if (h.chronic.diabetes) h.chronic.diabetes.typeOne = rng.next() < CHRONIC.typeOne;
  h.lenses = rng.next() < DENTAL_VISION.lensShare;
}

/** The health plans' month and week for them, from the first of the next month and the next Monday. */
/**
 * Whether a person is in hospital at a moment. An admission is an excused
 * absence everywhere: a production recasts or covers, an agency reschedules,
 * and the school counts it as a sick day. Until 2026-09-27 each presence
 * check read a stay as walking away, and a stay drawn on a Monday morning
 * put a student in breach before they could call in sick.
 */
export function inHospital(person: Person, at: Instant): boolean {
  return (person.health?.inHospitalUntil ?? 0) > at;
}

/**
 * Whether they're there for something at an instant: awake, not in hospital, not laid up by an injury, and in its
 * town where it has one. It was the career's (`systems/career.ts`) until that went in the scope reset of 2026-10-09,
 * and the school, the clinics and the paper offices still ask it.
 */
export function present(person: Person, when: Instant, cityId?: string): boolean {
  const asleep = person.awakeSince !== undefined && person.awakeSince > when;
  return !asleep && !inHospital(person, when) && !laidUp(person, when) && (cityId === undefined || person.currentLocationId === cityId);
}

/**
 * At an appointment for their own care (from 2026-10-10): awake and out of hospital. An injury that keeps them off
 * work and out of class doesn't keep them from their doctor or their therapist; until then it did, and a broken bone
 * missed every appointment it lasted. It asked that they be in town too until 2026-10-12: being away missed an
 * appointment or a session until the journeys went in the scope reset of 2026-10-09, and after it nothing moved a
 * person, so the doctor's check compared the town they were in with itself and the therapist's with the town the
 * course began in, the same one.
 */
export function presentForCare(person: Person, when: Instant): boolean {
  const asleep = person.awakeSince !== undefined && person.awakeSince > when;
  return !asleep && !inHospital(person, when);
}

export function armHealth(sim: Simulation, person: Person): void {
  healthOf(person);
  drawChronic(sim, person);
  const p = zonedParts(sim.now, HOME);
  if (!sim.universe.scheduled.some((i) => i.kind === HEALTH_MONTH_KIND && i.status === 'pending' && i.payload.personId === person.id)) {
    sim.schedule({ at: firstOf(p.year, p.month + 1) + 30 * 60_000, kind: HEALTH_MONTH_KIND, label: 'Health Cover', category: 'system', priority: 6, payload: { personId: person.id } });
  }
  if (!sim.universe.scheduled.some((i) => i.kind === HEALTH_WEEK_KIND && i.status === 'pending' && i.payload.personId === person.id)) {
    sim.schedule({ at: nextMonday(sim.now), kind: HEALTH_WEEK_KIND, label: 'Health', category: 'system', priority: 6, payload: { personId: person.id } });
  }
}

function nextMonday(from: Instant): Instant {
  const p = zonedParts(from, HOME);
  for (let n = 1; n <= 7; n += 1) {
    const d = normalDate(p.year, p.month, p.day + n);
    if (new Date(Date.UTC(d.year, d.month - 1, d.day)).getUTCDay() === 1) return instantFromZoned({ ...d, hour: 9 }, HOME);
  }
  return from + 7 * MS_DAY;
}


// `lastMonthWork` was here until 2026-10-16: last month's work for the work requirement, the pay and the hours of the
// wages paid in it. Its hours were the career's days worked until the career went in the scope reset of 2026-10-09; from
// then until 2026-10-12 it read the month's whole income, and from 2026-10-12 wages alone, so interest, a benefit or a
// pension of $580 or more didn't count, which CMS's rule of 3 June 2026 asks them to (`monthEngagement` reads them).

const renewMonths = (at: Instant, state?: BenefitState) => rateOn(state === 'ct' ? PUBLIC_COVER.renewMonthsCt : PUBLIC_COVER.renewMonths, monthKey(at) + '-01');
const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/**
 * A month's start. Each month a program comes up for renewal; the premiums fall due; and what covers them
 * is settled, with a month uncovered in California counted.
 */
/**
 * A condition that begins in the month: each not yet carried, at its yearly
 * onset for their age, a twelfth of it, weighed by their weight's relative
 * risk (`ONSET` in `content/body.ts`). Until 2026-09-28 a life carried
 * only the conditions it was drawn with at twenty-seven, whatever it ate or
 * however long it ran.
 */
export function onsetMonth(sim: Simulation, person: Person, at: Instant): Condition | undefined {
  const h = healthOf(person);
  if (!h.drawn) return undefined;
  const age = (at - person.birthInstant) / (365.2425 * MS_DAY);
  const bmi = person.body ? bmiOf(person.body) : 22.5;
  const rng = sim.rng('health.onset', person.id, String(at));
  for (const condition of Object.keys(ONSET.yearly) as (keyof typeof ONSET.yearly)[]) {
    if (h.chronic?.[condition]) continue;
    const chance = onsetYearly(condition, age, bmi) / 12;
    if (rng.next() >= chance) continue;
    (h.chronic ??= {})[condition] = { treated: true, since: at };
    if (person.id === sim.universe.playerId) sim.notify({ category: 'health', title: `Diagnosed: ${CONDITION_LABEL[condition]}`, body: `A doctor found it this month. Its care begins now, at what your plan leaves; Let It Go on Papers stops it.`, importance: 75, route: '/workspace/papers' });
    return condition;
  }
  return undefined;
}

export function healthMonth(sim: Simulation, person: Person, at: Instant): void {
  const h = healthOf(person);
  onsetMonth(sim, person, at);
  const cur = saveCurrency(sim.universe);
  const p = zonedParts(at, HOME);
  const home = homeOf(person);
  // The union plans read the quarter's and the twelve months' acting work here, and COBRA kept one lost, until
  // 2026-10-09: nothing earns them since the career went.
  // Out of status, a marketplace plan ends with the month (`lawfullyPresent`, from 2026-10-09), and one bought ahead
  // never begins. Until 2026-10-14 that one was told “Your Marketplace Plan Has Ended” and had cover counted lost
  // (`lostAt`), for a plan that never covered her: an F-1 who enrolled in her grace on 2 October for 1 December, out of
  // status on 17 October, was told so on 1 November (found by that day’s third round of evidence). Covered
  // Connecticut’s and the Essential Plan’s notice has said it won’t begin since 2026-10-13 (below).
  if (!lawfullyPresent(person) && h.marketplace && (h.marketplace.until === undefined || h.marketplace.until > at)) {
    const begun = h.marketplace.from <= at;
    h.marketplace.until = at;
    if (begun) h.lostAt = at;
    if (person.id === sim.universe.playerId) sim.notify({ category: 'health', title: begun ? 'Your Marketplace Plan Has Ended' : 'Your Marketplace Plan Won’t Begin', body: 'The marketplace covers a citizen or somebody lawfully present, and you stayed past your status.', importance: 80, route: '/workspace/papers' });
  }
  const prog = h.program;
  // And so do the Essential Plan and Covered Connecticut, which are the lawfully present’s as the marketplace is
  // (`programFor`); one enrolled in ahead never begins. Federal Medicaid has admitted no F-1 since 1 October 2026
  // (`medicaidStatus`), one held from before is read at its renewal, and California’s state-funded Medi-Cal is for
  // somebody without satisfactory status, so neither is ended here. From
  // 2026-10-13: until then the status was read only at enrollment and at renewal, and a student who withdrew, enrolled in
  // her fifteen days’ grace and stayed past them was covered by Covered Connecticut from 1 April to its renewal on
  // 1 October (found by that day’s third round).
  if (!lawfullyPresent(person) && prog?.kind === 'essential' && (prog.until === undefined || prog.until > at)) {
    const begun = prog.from <= at;
    prog.until = at;
    const plan = PROGRAM_NAMES[prog.state].essential;
    const Plan = `${plan.charAt(0).toUpperCase()}${plan.slice(1)}`;
    if (person.id === sim.universe.playerId) sim.notify({ category: 'health', title: begun ? 'Your Public Cover Has Ended' : 'Your Public Cover Won’t Begin', body: `${Plan} is for a citizen or a noncitizen lawfully present, and you stayed past your status.`, importance: 80, route: '/workspace/papers' });
  }
  // Covered Connecticut held into 2027 by somebody the premium tax credit no longer takes, a student in F-1 status or a
  // graduate on OPT, ends with 2026: it's had with the credit, which from taxable years beginning after 31 December 2026
  // is a citizen's, a green card holder's or a few others' (`creditAllowed`, Pub. L. 119-21 §71301), and the exchange's
  // advance credit stops for plan years from 1 January 2027 (§71301(c)(3)). Its renewal isn't waited for: no month of
  // 2027 has the credit. One enrolled in ahead for 2027 never begins. Until 2026-10-15 it ran on to its renewal and was
  // renewed there. The Essential Plan isn't ended: New York keeps them on it (`programFor`).
  const lapsedCredit = prog?.kind === 'essential' && prog.state === 'ct' && lawfullyPresent(person) && !creditStatus(person, at);
  // And the Essential Plan or Covered Connecticut held beside Yale Health's student cover, which is minimum essential
  // coverage (Yale Health, 2025–2026 Student Guide and "Waiving Yale Health Hospitalization/Specialty Care Coverage",
  // read 2026-10-15), ends at the month's start after it covers her again: the credit Covered Connecticut is had with is
  // for somebody not eligible for other minimum essential coverage (26 USC 36B(c)(2)(B)), and a Basic Health Program is
  // too (42 USC 18051(e)(1)(C)). A student back from a personal leave without Affiliate cover, who enrolled on it, held
  // Covered Connecticut beside Yale Health until 2026-10-15. HUSKY D isn't ended there: Medicaid takes somebody with
  // other cover and pays after it (42 CFR 433.139), and Yale Health takes HUSKY in place of its own hospitalization
  // cover; SLATE bills Yale Health, which pays first (`coverOn`).
  const yaleAgain = prog?.kind === 'essential' && coverOn(person, at) === 'yale';
  if (prog && (lapsedCredit || yaleAgain) && (prog.until === undefined || prog.until > at)) {
    const begun = prog.from <= at;
    prog.until = at;
    const plan = PROGRAM_NAMES[prog.state].essential;
    const Plan = `${plan.charAt(0).toUpperCase()}${plan.slice(1)}`;
    if (person.id === sim.universe.playerId) sim.notify({
      category: 'health', title: begun ? 'Your Public Cover Has Ended' : 'Your Public Cover Won’t Begin', importance: 80, route: '/workspace/papers',
      body: yaleAgain ? `${Plan} is for a person with no other cover that counts, and Yale Health’s student cover covers you again.`
        : `${Plan} comes with the premium tax credit, which from January 1, 2027, a noncitizen has only with a green card, as a Cuban or Haitian entrant or under a Compact of Free Association. The marketplace still sells to you, with no credit.`,
    });
  }
  // A program's renewal: its income test, and from 2027 Medicaid's work (`renewProgram`). Once, at its date: not again
  // while a notice of noncompliance waits on an answer, nor once its end is set and said (from 2026-10-16).
  if (prog && active(prog, at)) {
    if (BENEFIT_STATE[home] !== prog.state) prog.until = at;
    else if (at >= prog.renewAt && prog.until === undefined && h.pending?.kind !== 'renewal') renewProgram(sim, person, prog, at, cur);
  }
  // California's premium on its state-funded Medi-Cal, from July 2027; 90 days unpaid and it's restricted scope.
  if (prog && active(prog, at) && prog.scope === 'state' && at >= MEDI_CAL_UIS.premiumFrom) {
    const age = (at - person.birthInstant) / (365.2425 * MS_DAY);
    if (age >= MEDI_CAL_UIS.ages[0] && age < MEDI_CAL_UIS.ages[1] + 1) {
      if (payFromCurrent(sim, person, usd(MEDI_CAL_UIS.premium * 100, cur), 'Medi-Cal premium', 'health')) prog.unpaid = 0;
      else if ((prog.unpaid = (prog.unpaid ?? 0) + 1) >= MEDI_CAL_UIS.unpaidMonths) prog.scope = 'restricted';
    }
  }
  // The marketplace: a plan is the state's, and ends on leaving it.
  const m = h.marketplace;
  if (m && (m.until === undefined || at < m.until)) {
    if (BENEFIT_STATE[home] !== m.state) m.until = at;
    else if (at >= m.from) {
      const premium = benchmarkFor(m.state, p.year, cur);
      if (payFromCurrent(sim, person, premium, 'Marketplace health plan premium', 'health')) (h.premiums[p.year] ??= []).push(premium);
      else { m.until = at; m.ended = 'nonpayment'; }
    }
  }
  // A monthly dental plan of their own: its month's premium, and it ends with what it's bought beside. Yale's, paid for
  // the year and not canceled once paid, runs to its end (from 2026-10-12: until then it ended with Yale Health, on
  // 1 August after the degree, with nothing refunded).
  const dental = h.dental;
  const monthly = dental && !DENTAL_PLANS[dental.plan].yearly ? DENTAL_PLANS[dental.plan] : undefined;
  if (dental && monthly && active(dental, at)
    && (dentalPlanFor(person, at) !== dental.plan || !payFromCurrent(sim, person, usd(monthly.premium, cur), `${monthly.label} premium`, 'health'))) dental.until = at;
  keepUp(sim, person, at);
  const cover = coverOn(person, at);
  if (!cover && inCalifornia(home)) h.uncoveredInCalifornia[p.year] = (h.uncoveredInCalifornia[p.year] ?? 0) + 1;
  if (h.covered && !cover) {
    // A plan of their own dropped or left unpaid, the last cover to end, opens no special enrollment (45 CFR
    // 155.420(e)(1), from 2026-10-12): until then each opened 60 days, and a premium could be skipped at will.
    const since = firstOf(p.year, p.month - 1);
    const own = [h.program, h.marketplace].filter((r) => r?.until !== undefined && r.until > since && r.until <= at).sort((a, b) => b!.until! - a!.until!)[0];
    const yale = yaleUntil(person);
    const chose = own?.ended !== undefined && !(yale !== undefined && yale <= at && yale > own.until!);
    if (!chose) h.lostAt = at;
    const state = BENEFIT_STATE[home];
    const back = !state ? 'open enrollment' : `open enrollment, or a month’s income that qualifies you for ${PROGRAM_NAMES[state].medicaid}${state === 'ca' ? '' : ` or ${PROGRAM_NAMES[state].essential}`},`;
    const penalty = inCalifornia(home) ? ', and every month uncovered in California costs its penalty on your return' : '';
    // Out of status there’s no way back to name: the marketplace and the state’s plan for the lawfully present refuse
    // you (`mayEnroll`). Until 2026-10-13 the notice offered the marketplace’s 60 days to somebody it refused.
    const way = chose ? `A plan dropped or left unpaid opens no special enrollment: ${back} is the way back`
      : !lawfullyPresent(person) && state ? `Out of status, neither the marketplace nor ${PROGRAM_NAMES[state].essential} will take you`
        : `You have ${ENROLLMENT.specialDays} days to enroll in the marketplace`;
    // Uncovered from when the last cover in force ended, which can be after last month’s look and before this one’s:
    // Yale Health ends at the hour its days run out. Until 2026-10-14 the notice gave this look’s day, so an F-1 who
    // withdrew on 2 October, Yale Health ended at eight on 1 November, was told on 1 December that she was uncovered
    // from December 1 (found by that day’s third round of evidence). A plan that never began isn’t cover that ended, and
    // Yale Health canceled back to its term’s start by a withdrawal in the first fifteen days ended there.
    const lapse = (person.school?.uncovered ?? []).find((g) => at >= g.from && (g.until === undefined || at < g.until));
    const yaleEnd = lapse ? lapse.from : yale;
    const ends = [yaleEnd !== undefined && Number.isFinite(yaleEnd) ? yaleEnd : undefined, ...[h.program, h.marketplace].map((r) => (r?.until !== undefined && r.from < r.until ? r.until : undefined))];
    const uncoveredFrom = Math.max(...ends.filter((e): e is Instant => e !== undefined && e <= at), Number.NEGATIVE_INFINITY);
    const from = Number.isFinite(uncoveredFrom) ? uncoveredFrom : at;
    if (person.id === sim.universe.playerId) sim.notify({ category: 'health', title: 'Your Health Cover Ended', body: `You’re uncovered from ${formatDate(from, HOME)}. ${way}${penalty}.`, importance: 80, route: '/workspace/papers' });
  }
  h.covered = cover !== undefined;
  // A medical debt a year past due, $500 or more, goes on the record, outside the states that bar it. The notice reads
  // its figure from the rule, "or more" as the rule is (from 2026-10-12: until then it said "over $500", typed in).
  const debt = medicalDebtOf(sim, person);
  if (debt && -debt.balance >= usd(MEDICAL_DEBT.reportAt, cur) && h.debtSince !== undefined && at - h.debtSince >= MEDICAL_DEBT.reportAfterDays * MS_DAY
    && !MEDICAL_DEBT.barredIn.includes(CITIES.get(home)?.parentId ?? '') && !h.reported && person.credit) {
    h.reported = true;
    markRecord(person, MEDICAL_DEBT.recordHit, at, home);
    if (person.id === sim.universe.playerId) sim.notify({ category: 'health', title: 'A Medical Debt Is On Your Record', body: `Unpaid a year and ${formatMoney(usd(MEDICAL_DEBT.reportAt, cur), cur)} or more, it’s reported now.`, importance: 80, route: '/workspace/papers' });
  }
}

/** How a month met the work rules, in a sentence (`renewProgram`, `health.request_hardship`). */
const BY_WORDS: Readonly<Record<EngagedBy, string>> = {
  work: 'by 80 hours’ work', income: 'by its income, $580.00 or more', school: 'at the School', age: 'by your age, which they aren’t asked of',
  snap: 'by SNAP, whose work rules you were under', hardship: 'by a stay in hospital, on your request',
};
const capital = (s: string): string => `${s.charAt(0).toUpperCase()}${s.slice(1)}`;

/**
 * A program comes up for renewal (`healthMonth`): its income and status (`programFor`), and from 2027 Medicaid's work
 * over Connecticut's six months before (`lookBack`), any one of them (from 2026-10-16: until then the month before
 * alone). The work test is Medicaid's, at a renewal into it: kept, or moved into from the Essential Plan or Covered
 * Connecticut, since Pub. L. 119-21 §71119 asks it of an applicant as of a member.
 * - Kept: renewed so many months on, and said ("Your Public Cover Is Renewed", from 2026-10-16: until then a renewal
 *   kept said nothing, though 42 CFR 435.916-917 has the agency notify the basis of each determination).
 * - Moved into the other program, where last month's income now places her (`applyRenewal`).
 * - Over every line, or out of the status it asks: ended, said ten days or more ahead, at the month's end
 *   (`endAhead`). From 2026-10-16: until then cover ended at the renewal's own hour, with nothing said ahead.
 * - Short of the work: a notice of noncompliance, cover kept through thirty days to answer, then decided
 *   (`noticeOfNoncompliance`, `WORK_DECIDED_KIND`). From 2026-10-16: until then cover ended at the renewal's hour.
 */
function renewProgram(sim: Simulation, person: Person, prog: NonNullable<HealthRecord['program']>, at: Instant, cur: string): void {
  const p = zonedParts(at, HOME);
  const names = PROGRAM_NAMES[prog.state];
  const next = firstOf(p.year, p.month + renewMonths(at, prog.state));
  const still = programFor(person, at, cur);
  if (!still) {
    // Its status isn’t why for the Essential Plan or Covered Connecticut: out of status, either has ended with the month
    // before any renewal finds it (above). Until 2026-10-13 one ran to its renewal, and a student out of status was told
    // there first that her income, the bank’s interest alone, was over what it allows, and later that day that she had
    // stayed past her status (found by that day’s second and third rounds). A federal Medicaid held from before
    // 1 October 2026 by somebody it no longer admits ends here for that, and says so (from 2026-10-13: until then an
    // F-1 student enrolled before that day was told her income was over, whatever it was; found by that day's third
    // round). Over every line, the work isn't asked: until 2026-10-16 a member over the line with no work was told the
    // work was why.
    const admitted = prog.kind !== 'medicaid' || prog.scope !== undefined || medicaidStatus(person, at);
    endAhead(sim, person, prog, at, !admitted ? `From October 1, 2026, ${names.medicaid} is for a US citizen, or somebody with a green card for five years, and renewing it reads that` : 'Last month’s income is over what it allows');
    return;
  }
  let met: { month: string; by: EngagedBy } | undefined;
  if (engagementAsked(still, at)) {
    const months = lookBack(at, prog.state, 'renew');
    met = engagement(sim, person, months, cur);
    if (!met) {
      noticeOfNoncompliance(sim, person, { kind: 'renewal', state: prog.state, noticeAt: at, decideAt: decisionAt(at), months, band: still.band, renewAt: next }, prog);
      return;
    }
  }
  applyRenewal(sim, person, prog, still, at, next, met);
}

/**
 * A renewal granted: the program kept, or the other one from this hour. Moving into the other program, where last
 * month's income now places her, is from the hour the old one ends: no gap, one program at a time, and neither has a
 * premium to take twice. A renewal considers every basis of eligibility before ending cover, and a Medicaid member found
 * ineligible is assessed for the others (42 CFR 435.916(f)(1)-(2), law.cornell.edu, read 2026-10-15); an exchange
 * enrollee found eligible for Medicaid or a Basic Health Program leaves her plan the day before that eligibility begins
 * (45 CFR 155.430(d)(2)(v), read 2026-10-15). Covered Connecticut is for somebody "ineligible for HUSKY Health/Medicaid
 * due to income" to 175% of the poverty line, and HUSKY D for income under 138% (portal.ct.gov/dss, read 2026-10-15);
 * Access Health CT's renewal gives "a final determination on whether your HUSKY Health coverage will be renewed or if
 * you qualify for another program" (help.accesshealthct.com, read 2026-10-15). From 2026-10-15: until then a Covered
 * Connecticut member whose income fell under HUSKY D's limit lost her cover at renewal and was told “Last month’s
 * income is over what it allows”, and a HUSKY D member whose income rose into Covered Connecticut's band lost hers.
 */
function applyRenewal(sim: Simulation, person: Person, prog: NonNullable<HealthRecord['program']>, still: { kind: 'medicaid' | 'essential'; band: 'low' | 'high'; scope?: 'state' | 'restricted' }, at: Instant, next: Instant, met?: { month: string; by: EngagedBy }): void {
  const h = healthOf(person);
  const names = PROGRAM_NAMES[prog.state];
  const mine = person.id === sim.universe.playerId;
  const work = met ? `, and ${monthWords(met.month)} met its work rules ${BY_WORDS[met.by]}` : '';
  if (still.kind === prog.kind) {
    prog.band = still.band;
    if (still.scope) prog.scope = still.scope; else delete prog.scope;
    prog.renewAt = next;
    if (mine) sim.notify({ category: 'health', title: 'Your Public Cover Is Renewed', body: `${capital(names[prog.kind])} is renewed to its next renewal, ${formatDate(next, HOME)}: last month’s income is within what it allows${work}.`, importance: 60, route: '/workspace/papers' });
    return;
  }
  const why = still.kind === 'medicaid' ? `Last month’s income is under what ${names.medicaid} allows, which takes the place of ${names.essential}`
    : prog.kind === 'medicaid' && prog.scope === undefined && !medicaidStatus(person, at) ? `From October 1, 2026, ${names.medicaid} is for a US citizen, or a green card holder of five years`
      : `Last month’s income is over what ${names.medicaid} allows and within what ${names.essential} does`;
  prog.until = at;
  h.program = { kind: still.kind, state: prog.state, from: at, band: still.band, renewAt: next, ...(still.scope ? { scope: still.scope } : {}) };
  if (mine) sim.notify({ category: 'health', title: 'Your Public Cover Changed At Renewal', body: `${why}: you’re renewed into ${names[still.kind]} from ${formatDate(at, HOME)}, with no gap and no premium${work}.`, importance: 80, route: '/workspace/papers' });
}

/**
 * A program found ineligible ends at the month's end at least ten days after it's said (`endsAfterNotice`, from
 * 2026-10-16), and the notice says when. Losing it opens the marketplace's 60 days at the month's look that finds her
 * uncovered (`lostAt`).
 */
function endAhead(sim: Simulation, person: Person, prog: NonNullable<HealthRecord['program']>, at: Instant, why: string, credit = ''): void {
  const until = endsAfterNotice(at);
  prog.until = until;
  const name = capital(PROGRAM_NAMES[prog.state][prog.kind]);
  if (person.id === sim.universe.playerId) sim.notify({ category: 'health', title: 'Your Public Cover Ends', body: `${why}: ${name} ends on ${formatDate(lastDayBefore(until), HOME)}, ${lawfullyPresent(person) ? `and losing it opens ${ENROLLMENT.specialDays} days to enroll in the marketplace${credit}` : 'and out of status the marketplace won’t take you'}.`, importance: 80, route: '/workspace/papers' });
}

/** The work rules' words, for the notices: "80 hours’ work, $580.00 of income, school at least half-time or an exception". */
const workWords = (cur: string): string => `${PUBLIC_COVER.workHours} hours’ work, ${formatMoney(usd(PUBLIC_COVER.workEarnings, cur), cur)} of income, school at least half-time or an exception`;
/** The months assessed, in a sentence: "in December 2026", "in any month from May to October 2027". */
const inMonths = (months: string[]): string => (months.length > 1 ? `in any month from ${monthsWords(months)}` : `in ${monthsWords(months)}`);

/**
 * The notice of noncompliance (from 2026-10-16; 42 USC 1396a(xx)(6); 42 CFR 435.558, CMS-2454-IFC of 3 June 2026): the
 * months assessed, how to show the rules met or an exception, the day to answer by (received five days after its date,
 * thirty calendar days from then), what follows for the cover and for the premium tax credit, and how to apply again;
 * Connecticut's short-term hardship for a stay in hospital is had on a request (`health.request_hardship`). A member is
 * covered while she answers (435.558(a)(3)); an applicant isn't covered yet. Decided at the thirty days' end
 * (`WORK_DECIDED_KIND`). Until 2026-10-16 an applicant was refused and a member ended at once, with no notice and no
 * time to answer.
 */
function noticeOfNoncompliance(sim: Simulation, person: Person, pend: PendingDetermination, held?: NonNullable<HealthRecord['program']>): void {
  const h = healthOf(person);
  const cur = saveCurrency(sim.universe);
  h.pending = pend;
  sim.schedule({ at: pend.decideAt, kind: WORK_DECIDED_KIND, label: 'Public Cover Decided', category: 'system', priority: 6, payload: { personId: person.id, noticeAt: pend.noticeAt } });
  if (person.id !== sim.universe.playerId) return;
  const names = PROGRAM_NAMES[pend.state];
  const by = formatDate(answerBy(pend.noticeAt), HOME);
  const read = `Your pay, your income, the School, your age and SNAP are read from the records; a stay in hospital in ${pend.months.length > 1 ? 'those months' : 'that month'} counts if you ask for it (Request A Hardship Exception on Papers).`;
  const after = `the premium tax credit isn’t yours while ${names.medicaid} would take you but for its work rules, and you can apply again in any month after one that meets them.`;
  const body = pend.kind === 'renewal'
    ? `${names.medicaid} couldn’t find ${workWords(cur)} ${inMonths(pend.months)}${held && held.kind !== 'medicaid' ? `, and last month’s income places you in it in place of ${names.essential}` : ''}. You’re covered while you answer, to ${by}. ${read} Unanswered, ${held ? names[held.kind] : names.medicaid} ends on ${formatDate(lastDayBefore(endsAfterNotice(pend.decideAt)), HOME)}, said on ${formatDate(pend.decideAt, HOME)}, and ${after}`
    : `${names.medicaid} couldn’t find ${workWords(cur)} ${inMonths(pend.months)}, before the month you applied. Answer by ${by}. ${read} Unanswered, the application is denied on ${formatDate(pend.decideAt, HOME)}; the marketplace sells to you meanwhile in its own windows, ${after}`;
  sim.notify({ category: 'health', title: 'A Notice Of Noncompliance', body: capital(body), importance: 80, route: '/workspace/papers' });
}

/**
 * A determination waiting on the work rules, granted (`health.request_hardship`, or the decision finding them met): a
 * renewal is renewed as it would have been at its date, the program kept or moved into from this hour (no gap: she was
 * covered while she answered); an application is approved, HUSKY D from the first of the month it would have begun when
 * made, or of next month where that's passed (SLATE starts every cover on a month's first; Connecticut's own day of
 * eligibility, the month applied in and one month before, isn't kept), and a marketplace plan bought meanwhile ends as
 * it begins (45 CFR 155.430(d)(2)(v)).
 */
function grantPending(sim: Simulation, person: Person, pend: PendingDetermination, met: { month: string; by: EngagedBy }, at: Instant): void {
  const h = healthOf(person);
  delete h.pending;
  if (pend.kind === 'renewal') {
    const prog = h.program;
    if (!prog || !active(prog, at) || prog.until !== undefined) return;
    applyRenewal(sim, person, prog, { kind: 'medicaid', band: pend.band }, at, pend.renewAt!, met);
    return;
  }
  const from = Math.max(pend.from ?? at, enrollStart(person, at));
  const f = zonedParts(from, HOME);
  h.program = { kind: 'medicaid', state: pend.state, from, band: pend.band, renewAt: firstOf(f.year, f.month + renewMonths(at, pend.state)) };
  const m = h.marketplace;
  const ended = m !== undefined && (m.until === undefined || m.until > from);
  if (m && ended) m.until = Math.max(m.from, from);
  armHealth(sim, person);
  const names = PROGRAM_NAMES[pend.state];
  if (person.id === sim.universe.playerId) sim.notify({ category: 'health', title: 'Public Cover Approved', body: `${capital(names.medicaid)} is yours from ${formatDate(from, HOME)}, with no premium: ${monthWords(met.month)} met its work rules ${BY_WORDS[met.by]}${ended ? ', and your marketplace plan ends as it begins' : ''}.`, importance: 80, route: '/workspace/papers' });
}

/** Why a hardship can't be asked for now, or nothing: a notice waiting on an answer, and a stay in hospital in a month it assessed. */
export function hardshipRefusal(_sim: Simulation, person: Person, at: Instant): string | undefined {
  const pend = person.health?.pending;
  if (!pend) return 'No notice of noncompliance waits on an answer.';
  if (at >= pend.decideAt) return `The thirty days to answer ended on ${formatDate(answerBy(pend.noticeAt), HOME)}.`;
  if (!(person.health?.careLog ?? []).some((e) => e.care === 'stay' && pend.months.includes(monthKey(e.at)))) return `No month it assessed, ${monthsWords(pend.months)}, had a stay in hospital, the hardship SLATE keeps.`;
  return undefined;
}

/**
 * Why HUSKY D can't be applied for on its notice now, or nothing (`health.apply`, from 2026-10-16): only where last
 * month's income and her status place her in it and its work rules aren't shown for the month before. A marketplace plan
 * held or bought ahead doesn't stop it, as Medicaid takes an application at any time; Yale Health's cover does, as it
 * stops Enroll (`mayEnroll`), and so does a program of her own.
 */
export function applyRefusal(sim: Simulation, person: Person, at: Instant): string | undefined {
  const state = BENEFIT_STATE[homeOf(person)];
  if (!state) return 'SLATE has public cover and the marketplace in New York, Los Angeles and New Haven.';
  const h = healthOf(person);
  const pend = h.pending;
  if (pend?.kind === 'application') return `Your application waits on its notice: answer it by ${formatDate(answerBy(pend.noticeAt), HOME)}.`;
  const prog = h.program;
  if (prog && (prog.until === undefined || prog.until > at) && (prog.until === undefined || prog.until > prog.from)) return prog.from > at ? `You’re enrolled from ${formatDate(prog.from, HOME)}.` : 'You’re enrolled.';
  const yale = yaleUntil(person);
  const opensAt = yale !== undefined && Number.isFinite(yale) ? yale - ENROLLMENT.specialDays * MS_DAY : undefined;
  if (yale !== undefined && yale > at && !yaleLapsed(person, at) && (opensAt === undefined || at < opensAt)) return 'Yale Health covers you while you’re at the School.';
  const cur = saveCurrency(sim.universe);
  const program = programFor(person, at, cur, enrollStart(person, at));
  if (program?.kind !== 'medicaid') return `Last month’s income or your status doesn’t place you in ${PROGRAM_NAMES[state].medicaid}.`;
  if (!engagementAsked(program, at) || engagement(sim, person, lookBack(at, state, 'apply'), cur)) return 'Last month meets its work rules: Enroll gives it.';
  return undefined;
}

/**
 * A month's care for the conditions kept up: therapy twice and a generic for
 * depression, a brand inhaler and the odd visit for asthma, a generic for high
 * blood pressure; for diabetes insulin, or a generic for type 2, and a visit a
 * quarter; for arthritis a generic and the odd visit; all at what the plan
 * leaves, paid then. What the bank can't
 * cover this month goes without, and the condition is left alone till next.
 */
export function keepUp(sim: Simulation, person: Person, at: Instant): Money {
  const h = healthOf(person);
  const cur = saveCurrency(sim.universe);
  let total = 0;
  for (const [condition, state] of Object.entries(h.chronic ?? {}) as [Condition, Chronic][]) {
    if (!state.treated) continue;
    const cost = monthCareCost(sim, person, condition, at, cur);
    state.lapsed = cost > 0 && !payFromCurrent(sim, person, cost, `Care for ${CONDITION_LABEL[condition].toLowerCase()}`, 'health');
    if (!state.lapsed) total += cost;
  }
  return total;
}

/**
 * A treated condition's month of care beside its medicine (which is filled as a supply, `fillMedicine`). Depression's
 * is two therapy sessions, except while a course of therapy runs, whose every session is paid as it's held
 * (`systems/therapy.ts`): until 2026-10-10 a month in a course paid for both.
 */
export function monthCareCost(sim: Simulation, person: Person, condition: Condition, at: Instant, cur: string): Money {
  if (condition === 'depression' && !person.therapy && publicCareShareOf(person, 'visit', at, cur) !== 0) {
    const plan = planOf(person, at);
    const session = plan ? usd(plan.visit, cur) : usd(grown(CITIES.get(homeOf(person))?.parentId === 'us-ny' ? CHRONIC.therapy['us-ny'] : CHRONIC.therapy.other, 'therapy', at), cur);
    return CHRONIC.therapyPerMonth * session;
  }
  if (condition === 'asthma') return sim.rng('health.chronic', person.id, `asthma-${at}`).next() < 2 / 12 ? shareOf(person, 'visit', at, cur) : 0;
  if (condition === 'diabetes') return zonedParts(at, HOME).month % 3 === 1 ? shareOf(person, 'visit', at, cur) : 0;
  if (condition === 'arthritis') return sim.rng('health.chronic', person.id, `arthritis-${at}`).next() < 2 / 12 ? shareOf(person, 'visit', at, cur) : 0;
  return 0;
}

/** A condition kept up: treated, its care paid and its medicine not run out (from 2026-10-02, until when a month's care paid was all). */
export const keptUp = (state: Chronic | undefined, at: Instant): boolean => Boolean(state && state.treated && !state.lapsed && !(state.supplyUntil !== undefined && state.supplyUntil < at));

/**
 * A fill of a chronic condition's medicine (from 2026-10-02). What a fill
 * supplies: 28 days in England, the Department of Health's routine repeat
 * (NHS guidance); 30 in America, the retail fill a Medicare Part D month
 * covers (CMS, at most 34); a month elsewhere, SLATE's reading where none was
 * read. Longer on asking (`health.extra_supply`), at the same pharmacy: 56 days
 * in England, which NHS guidance supports for a stable patient, still one
 * item's charge; 90 in America, the extended supply plans offer, at three
 * fills' share, SLATE's reading; 100 in Ontario, the Drug Benefit's most. Paid
 * ahead, it holds through a month the bank runs low. Refilled with a week left.
 * Until the journeys went in the scope reset of 2026-10-09 the longer supply was
 * for a trip, since away past a supply the condition went untreated until home,
 * and this said so until it was corrected (from 2026-10-12).
 *
 * **The prescription** (from 2026-10-03; `research-alterations-refills.json`).
 * In England a repeat is ordered from the GP, up to 5 working days before it's
 * needed (nhs.uk), so it's ordered with two weeks left and collected once
 * ready, when they're home. In British Columbia a prescription is good for two
 * years from when it was written (the College of Pharmacists); past that it
 * isn't filled until a doctor's visit renews it, booked as any other visit.
 * America's states read set no expiry on a medicine that isn't controlled,
 * and Ontario's are good unless the prescriber says otherwise, so none there.
 * Connecticut's was read on 2026-10-15 (`research-health-visits.json`,
 * `prescriptionValidity`): its pharmacy statutes and the Drug Control
 * Division's compilation of them and their regulations set no period after
 * which such a prescription can't be filled. A refill is given only on the
 * prescriber's order, as many as the prescription authorizes (CGS 20-616(b)),
 * a number or PRN. Two exceptions let a pharmacist go without the order: one
 * refill of a medicine that isn't controlled, of at most a seventy-two hour
 * supply, when the prescriber can't be reached (20-616(c)); and, for a patient
 * with less than a seven-day supply, "not more than a thirty-day supply" of
 * insulin, glucagon, a diabetic ketoacidosis device and the diabetes devices
 * to give them, which the pharmacist prescribes (20-616(d); FindLaw's text of
 * the statute, current to 1 January 2025, read 2026-10-15). Neither is an
 * expiry, and the one year in the compilation is a syringe prescription's
 * (21a-65(b)). So in New Haven a kept visit's renewal changes no fill,
 * rightly: the refills a prescriber authorizes are the prescriber's to choose,
 * no source read publishes them, and they aren't kept. Until 2026-10-15 this
 * said America's states without having read Connecticut's, and until later
 * that day it named the seventy-two hours alone, without the diabetes supply.
 */
export const RX = { orderLeadWorkingDays: 5, orderWithDays: 14, validYears: { 'ca-bc': 2 } as Readonly<Record<string, number>>, renewal: 'A prescription to renew' } as const;
export const FILL = { england: 28, us: 30, other: 30, holiday: { england: 56, us: 90, 'ca-on': 100 } as Readonly<Record<string, number>>, refillDays: 7 } as const;

/** The province or nation a home is in, from its town's id ('ca-on-toronto' is 'ca-on'). Until 2026-10-03 Ontario was looked for as a parent region 'ca-on', which the atlas calls 'ca-08', so its 100-day supply before a trip never applied. */
const regionOf = (person: Person): string => homeOf(person).split('-').slice(0, 2).join('-');
const fillKey = (person: Person): string => { const r = regionOf(person); return r === 'uk-eng' ? 'england' : r.startsWith('us-') ? 'us' : r === 'ca-on' ? 'ca-on' : 'other'; };
export const fillDaysOf = (person: Person): number => { const k = fillKey(person); return k === 'england' ? FILL.england : k === 'us' ? FILL.us : FILL.other; };
export const longestFillOf = (person: Person): number => FILL.holiday[fillKey(person)] ?? fillDaysOf(person);
/** How many usual fills' share a supply of so many days is charged: England charges an item once, whatever it supplies. */
export const fillsCharged = (person: Person, days: number): number => (fillKey(person) === 'england' ? 1 : Math.ceil(days / fillDaysOf(person)));

/** A fill's medicine for a condition, at what the plan or the public system leaves: the generic, a brand inhaler, insulin and its monitor. */
export function medicineShareOf(person: Person, condition: Condition, state: Chronic, at: Instant, cur: string): Money {
  if (condition === 'asthma') return rxShareOf(person, true, at, cur);
  if (condition === 'diabetes' && state.typeOne) return insulinShareOf(person, at, cur) + monitorShareOf(person, at, cur);
  return rxShareOf(person, false, at, cur);
}


/** When a condition's prescription runs out where they live, or never. */
export function rxValidUntil(person: Person, state: Chronic): Instant | undefined {
  const years = RX.validYears[regionOf(person)];
  return years === undefined || state.prescribedAt === undefined ? undefined : addYears(state.prescribedAt, years, CITIES.require(homeOf(person)).timeZone);
}

/** A doctor's visit kept renews every prescription. */
export function renewPrescriptions(person: Person, at: Instant): void {
  for (const state of Object.values(healthOf(person).chronic ?? {}) as Chronic[]) if (state.treated) state.prescribedAt = at;
}

/** A visit kept for a condition's review records it. */
export function reviewed(person: Person, what: string, at: Instant): void {
  for (const [condition, state] of Object.entries(healthOf(person).chronic ?? {}) as [Condition, Chronic][]) if (what.startsWith(reviewWhat(condition))) state.reviewedAt = at;
}

/**
 * Fills each treated condition's medicine that's within a week of running out, or for so many days on asking; what was
 * paid. A condition whose fill the bank can't pay goes in `skipped` (from 2026-10-12: until then nothing said which, and
 * `health.extra_supply` reported a longer supply filled that wasn't). Until the journeys went on 2026-10-09 the days
 * asked for were a supply before a trip.
 */
export function fillMedicine(sim: Simulation, person: Person, at: Instant, days?: number, skipped: Condition[] = []): Money {
  const cur = saveCurrency(sim.universe);
  const usual = fillDaysOf(person);
  let paid = 0;
  for (const [condition, state] of Object.entries(healthOf(person).chronic ?? {}) as [Condition, Chronic][]) {
    if (!state.treated) continue;
    const left = state.supplyUntil === undefined ? 0 : (state.supplyUntil - at) / MS_DAY;
    // A prescription past its good-until isn't filled; the doctor's visit to renew it is booked.
    state.prescribedAt ??= at;
    const validUntil = rxValidUntil(person, state);
    if (validUntil !== undefined && at >= validUntil) { renewalDue(sim, person, condition); continue; }
    if (days === undefined && state.supplyUntil !== undefined && fillKey(person) === 'england') {
      // A repeat ordered from the GP with two weeks left, collected once it's ready; the first is filled at once.
      if (state.orderedReadyAt === undefined) {
        if (left <= RX.orderWithDays) state.orderedReadyAt = afterBusinessDays(at, RX.orderLeadWorkingDays, 'uk', CITIES.require(homeOf(person)).timeZone);
        continue;
      }
      if (at < state.orderedReadyAt) continue;
      delete state.orderedReadyAt;
    } else if (days === undefined && left > FILL.refillDays) continue;
    const want = days ?? usual;
    // England charges an item once, whatever it supplies; elsewhere a fill's share for each usual fill it covers.
    const cost = medicineShareOf(person, condition, state, at, cur) * fillsCharged(person, want);
    if (cost > 0 && !payFromCurrent(sim, person, cost, `Medicine for ${CONDITION_LABEL[condition].toLowerCase()}`, 'health')) { skipped.push(condition); continue; }
    state.supplyUntil = Math.max(at, state.supplyUntil ?? at) + want * MS_DAY;
    paid += cost;
  }
  return paid;
}

/**
 * A prescription run out: the doctor’s visit to renew it booked, once, and said. An appointment already booked renews
 * it when kept. A visit owed, missed or called off, is booked now, one appointment for both, as the health week books
 * one for an illness; any visit kept renews every prescription (`renewPrescriptions`). Until 2026-10-13 a visit owed
 * stopped it here, unbooked and unsaid, so in British Columbia, where a prescription runs out, one appointment called
 * off or missed and left ran the medicine out for good with nothing said of the prescription (found by that day’s
 * second round). Every place whose prescriptions run out publishes a doctor’s wait (`RX.validYears`, British Columbia
 * alone), so the booking is made.
 */
function renewalDue(sim: Simulation, person: Person, condition: Condition): void {
  const h = healthOf(person);
  if (appointmentsOf(person).length) return;
  if (book(sim, person, h.owedVisit ?? RX.renewal)) delete h.owedVisit;
  if (person.id === sim.universe.playerId) sim.notify({ category: 'health', title: 'A Prescription Ran Out', body: `The prescription for your ${CONDITION_LABEL[condition].toLowerCase()} medicine is past its date. It’s filled again once a doctor renews it.`, importance: 60, route: '/workspace/papers' });
}

/** Their medical debt, if any: what bills they couldn't pay. */
export function medicalDebtOf(sim: Simulation, person: Person) {
  return Object.values(sim.universe.accounts).find((a) => a.ownerId === person.id && a.category === 'medical' && !a.closedAt);
}

export type Care = 'visit' | 'urgent' | 'emergency' | 'stay' | 'rx-generic' | 'rx-brand' | 'cleaning' | 'filling' | 'exam' | 'glasses';
const MEDICAL: readonly Care[] = ['visit', 'urgent', 'emergency', 'stay'];

/** The last twelve months' income against the year's poverty line, which a hospital's charity reads. */
export function incomeRatio(person: Person, at: Instant, into = 'USD'): number {
  const months = earningsOf(person).months;
  const since = at - 365 * MS_DAY;
  const income = Object.entries(months).filter(([k]) => firstOf(Number(k.slice(0, 4)), Number(k.slice(5, 7))) >= since).reduce((s, [, v]) => s + v, 0);
  return income / usd(byYear(POVERTY_LINE, zonedParts(at, HOME).year), into);
}

/**
 * What a piece of care leaves them to pay. Covered: the plan's copay, or for
 * a stay the deductible still owed and the plan's share of the rest, to what
 * remains of the year's out-of-pocket most. Uninsured: the price the
 * uninsured are billed, less a hospital's charity for an emergency or a stay,
 * by the last year's income against the poverty line.
 *
 * A doctor's visit is priced where it's had: at `clinicId` where it was booked, or at their doctor then. One had outside
 * the practice their cover sends them to (`outsideItsPractice`: a Yale Health member's at Fair Haven) is priced as the
 * uninsured's, the cover paying none of it (from 2026-10-15: until then Yale Health paid it at $0).
 */
export function shareOf(person: Person, care: Care, at: Instant, into = 'USD', clinicId?: string): Money {
  const where = care === 'visit' ? (clinicId ? clinicById(clinicId) : clinicFor(person, 'visit', at)) : undefined;
  const nhs = publicCareShareOf(person, care, at, into);
  // A doctor’s visit at a private practice, one that publishes its own self-pay price (`systems/clinics.ts`), is paid at
  // that price: the public system pays its own doctors, not a private GP. From 2026-10-13: until then the NHS paid a
  // London visit at Bupa’s pay-as-you-go GP, chosen as one’s doctor, to nothing, as at the NHS practice, and the choice
  // moved only the name on the notice (found by the second round of that day).
  const privateVisit = nhs !== undefined && care === 'visit' ? selfPayAt(where, into) : undefined;
  if (privateVisit !== undefined) return privateVisit;
  if (nhs !== undefined) return nhs;
  if (care === 'rx-generic' || care === 'rx-brand') return rxShareOf(person, care === 'rx-brand', at, into);
  if (!MEDICAL.includes(care)) return teethAndEyesShareOf(person, care as 'cleaning' | 'filling' | 'exam' | 'glasses', at, into);
  const price = planPrice(care as 'visit' | 'urgent' | 'emergency' | 'stay', at, into);
  const year = zonedParts(at, HOME).year;
  const hospital = care === 'emergency' || care === 'stay';
  // Restricted scope pays an emergency and the stay it brings, nothing else.
  // And Yale Health pays none of a member's visit had outside its Health Center (from 2026-10-15).
  const plan = (restrictedScope(person, at) && !hospital) || outsideItsPractice(person, where, at) ? undefined : planOf(person, at);
  const h = healthOf(person);
  const state = CITIES.get(homeOf(person))?.parentId;
  // The last year's income against the poverty line, which a hospital's charity reads.
  const ratio = () => incomeRatio(person, at, into);
  // Connecticut's hospital charity, for a patient paying for themselves, as a hospital screens one.
  const ct = CHARITY.connecticut;
  const helped = (owed: Money): Money => {
    if (!hospital || state !== 'us-ct') return owed;
    const r = ratio();
    return r <= ct.freeTo ? 0 : r <= ct.discountTo ? Math.round(owed * (1 - ct.discount)) : owed;
  };
  if (!plan) {
    // Uninsured, a provider's own self-pay price where it publishes one (`systems/clinics.ts`).
    const own = hospital ? undefined : selfPayAt(care === 'visit' ? where : clinicFor(person, 'urgent', at), into);
    if (own !== undefined) return own;
    if (!hospital) return Math.round(price * CARE.uninsuredMarkup);
    if (state === 'us-ny' && ratio() < CHARITY.newYorkFreeBelow) return 0;
    if (state === 'us-ca' && ratio() < CHARITY.californiaDiscountBelow) return price;
    return helped(Math.round(price * CARE.uninsuredMarkup));
  }
  let share: number;
  if (care === 'stay' && plan.stayCopay !== undefined) {
    // What's left of the deductible, then an admission's copay, to the plan's cap on them in a year.
    const toDeductible = Math.min(price, Math.max(0, usd(plan.deductible, into) - (h.deductible[year] ?? 0)));
    h.deductible[year] = (h.deductible[year] ?? 0) + toDeductible;
    h.stayCopays ??= {};
    const left = plan.stayCopayCap === undefined ? Number.POSITIVE_INFINITY : Math.max(0, usd(plan.stayCopayCap, into) - (h.stayCopays[year] ?? 0));
    const copay = Math.min(usd(plan.stayCopay, into), left);
    h.stayCopays[year] = (h.stayCopays[year] ?? 0) + copay;
    share = toDeductible + copay;
  } else if (care === 'stay') {
    const left = Math.max(0, usd(plan.deductible, into) - (h.deductible[year] ?? 0));
    const toDeductible = Math.min(price, left);
    share = toDeductible + Math.round((price - toDeductible) * plan.stayShare);
    h.deductible[year] = (h.deductible[year] ?? 0) + toDeductible;
  } else share = usd(plan[care as 'visit' | 'urgent' | 'emergency'], into);
  const cap = usd(plan.outOfPocket, into);
  return Math.max(0, Math.min(share, cap - (h.spent[year] ?? 0)));
}

/** A prescription at the counter: the plan's copay, the greater of its dollar and its share, after a brand's deductible; uninsured, the cash price. */
/**
 * The NHS's charge for a piece of care, for someone it treats as ordinarily
 * resident, or nothing where it isn't theirs: free at the point of use for
 * a doctor, the emergency department and a stay in hospital; England's
 * charge per prescription item, and nothing in Scotland, Wales or Northern
 * Ireland; the dental bands (a check-up and cleaning Band 1, a filling Band
 * 2). A British or Irish citizen living in the UK is ordinarily resident at
 * once, a returning resident among them (the Charges to Overseas Visitors
 * guidance); anyone else there is on a visa whose Immigration Health
 * Surcharge SLATE doesn't charge, and is billed as before. Until 2026-09-29
 * a Londoner was billed American prices for every illness, uninsured, and a
 * played British life ended £1.25 million in medical debt.
 */
export function publicCareShareOf(person: Person, care: Care, at: Instant, into = 'USD'): Money | undefined {
  const city = CITIES.get(homeOf(person));
  if (city?.countryId === 'ie') return irishShareOf(person, care, into);
  if (city?.countryId === 'mx') return mexicanShareOf(person, care);
  if (city?.countryId === 'ca') return canadianShareOf(person, care, at);
  if (city?.countryId !== 'uk') return undefined;
  const iso = isoOfCountry(person.citizenshipId);
  // A visa's holder who paid the Immigration Health Surcharge is treated as ordinarily resident (`systems/residence.ts`, from 2026-09-30).
  if (iso !== 'GB' && iso !== 'IE' && !citizenOf(person, 'GB') && !nhsByRoute(person, at)) return undefined;
  const pounds = (x: number) => { const c = Math.round(x * 100); return into === 'GBP' ? c : exchange(c, 'GBP', into) ?? c; };
  const england = city.parentId === 'uk-eng';
  const age = (at - person.birthInstant) / (365.25 * MS_DAY);
  // A prepayment certificate in force makes each one free (`health.prepay`, from 2026-10-02).
  if (care === 'rx-generic' || care === 'rx-brand') return england && age < NHS.prescriptionFreeFrom && !((person.health?.prepaidUntil ?? 0) > at) ? pounds(NHS.prescription) : 0;
  // A check-up and cleaning is Band 1, a filling Band 2; an eye test and glasses are the optician's, paid for as before.
  if (care === 'cleaning') return pounds(NHS.dental.band1);
  if (care === 'filling') return pounds(NHS.dental.band2);
  if (care === 'exam' || care === 'glasses') return undefined;
  return 0;
}

/**
 * Ireland's public care for someone living there (Citizens Information,
 * researched 2026-09-29): a public hospital stay free, the €80 a day
 * abolished on 17 April 2023; the emergency department €100 (waived with a
 * GP's letter, which SLATE doesn't keep); a GP private, the middle of the €45
 * to €65 Citizens Information gives, €55; an injury unit €75 for urgent
 * care; and the Drugs Payment Scheme's €80 a month for the household's
 * prescriptions, which SLATE holds a prescription to. An Irish, British or
 * other EU citizen is eligible; a dentist and an optician are private, as
 * before.
 */
function irishShareOf(person: Person, care: Care, into: string): Money | undefined {
  const eligible = new Set(['IE', 'GB', 'DE', 'FR', 'ES', 'LV', 'IT', 'NL']);
  if (!citizenshipsOf(person).some((c) => eligible.has(c))) return undefined;
  const euros = (x: number) => { const c = Math.round(x * 100); return into === 'EUR' ? c : exchange(c, 'EUR', into) ?? c; };
  if (care === 'stay') return 0;
  if (care === 'emergency') return euros(IRISH_CARE.emergency);
  if (care === 'urgent') return euros(IRISH_CARE.injuryUnit);
  if (care === 'visit') return euros(IRISH_CARE.gp);
  if (care === 'rx-generic' || care === 'rx-brand') return euros(IRISH_CARE.drugsCapMonthly);
  return undefined;
}

/**
 * Mexico's IMSS-Bienestar for a Mexican living there without social
 * security, as an actor between engagements is: care, medicines and
 * supplies free (Mexico City joined on 15 June 2023). A dentist and an
 * optician are private, as before.
 */
function mexicanShareOf(person: Person, care: Care): Money | undefined {
  if (!citizenOf(person, 'MX')) return undefined;
  if (care === 'cleaning' || care === 'filling' || care === 'exam' || care === 'glasses') return undefined;
  return 0;
}

/**
 * Canada's public insurance for a citizen living there, from 2026-09-30: a
 * doctor, the emergency department, urgent care and a stay in hospital cost
 * nothing, under Ontario's OHIP and British Columbia's MSP alike. OHIP has
 * had no waiting period since 2020 (ontario.ca, read 2026-09-30), and a
 * Canadian-born resident waits for neither. Prescriptions are private for an
 * adult, except under 25 in Ontario, where OHIP+ pays them all. Ontario's
 * Drug Benefit for those over 65, Trillium's cap on high costs and BC's Fair
 * PharmaCare weren't researched, and aren't kept. A dentist and an optician
 * are private, as before. Until 2026-09-30 a Torontonian was billed American
 * prices, uninsured, and a played life died at 87 owing $1,083,058 for
 * medical care.
 */
function canadianShareOf(person: Person, care: Care, at: Instant): Money | undefined {
  if (!citizenOf(person, 'CA')) return undefined;
  if (care === 'cleaning' || care === 'filling' || care === 'exam' || care === 'glasses') return undefined;
  if (care === 'rx-generic' || care === 'rx-brand') {
    const age = (at - person.birthInstant) / (365.25 * MS_DAY);
    return CITIES.get(homeOf(person))?.parentId === 'ca-08' && age < 25 ? 0 : undefined;
  }
  return 0;
}

/**
 * A Canadian's share of a prescription under the province's plan, in `into`,
 * or nothing where no plan takes them (`content/cabenefits.ts`):
 * - Ontario from 65, the Drug Benefit: $100 a program year (August to July),
 *   then up to $6.11 each; or up to $2 each, no deductible, on $25,480 or less.
 * - Ontario under 65, Trillium: a quarter of 4% of last year's net income each
 *   quarter of the program year, then up to $2 each. Under 25, OHIP+ pays all.
 * - British Columbia, Fair PharmaCare: the deductible by income, then 30% of
 *   each, to the family maximum, then nothing.
 * Last year's acting is the income, SLATE keeping no other.
 */
function canadianDrugShare(person: Person, at: Instant, price: Money, into: string): Money | undefined {
  if (!citizenOf(person, 'CA')) return undefined;
  const city = CITIES.get(homeOf(person));
  if (city?.countryId !== 'ca') return undefined;
  const cad = (dollars: number) => { const c = Math.round(dollars * 100); return into === 'CAD' ? c : exchange(c, 'CAD', into) ?? c; };
  const p = zonedParts(at, city.timeZone);
  const earned = earningsOf(person).years[p.year - 1]?.acting ?? 0;
  const income = (into === 'CAD' ? earned : exchange(earned, into, 'CAD') ?? earned) / 100;
  const age = (at - person.birthInstant) / (365.2425 * MS_DAY);
  const h = healthOf(person);
  h.caDrug ??= {};
  const spend = (key: string, deductible: Money, after: (rest: Money) => Money): Money => {
    const spent = h.caDrug![key] ?? 0;
    const toDeductible = Math.min(price, Math.max(0, deductible - spent));
    const pay = toDeductible + after(price - toDeductible);
    h.caDrug![key] = spent + pay;
    return pay;
  };
  const programYear = p.month >= 8 ? p.year : p.year - 1;
  if (city.parentId === 'ca-08') {
    // Under 25, OHIP+ has paid it before the plan is asked (`canadianShareOf`).
    if (age >= 65) {
      if (income <= ONTARIO_DRUGS.lowIncome) return Math.min(price, cad(ONTARIO_DRUGS.lowCopay));
      return spend(`odb-${programYear}`, cad(ONTARIO_DRUGS.deductible), (rest) => Math.min(rest, cad(ONTARIO_DRUGS.copay)));
    }
    const quarter = Math.floor(((p.month + 4) % 12) / 3);
    return spend(`trillium-${programYear}-${quarter}`, cad((income * ONTARIO_DRUGS.trilliumShare) / 4), (rest) => Math.min(rest, cad(ONTARIO_DRUGS.trilliumCopay)));
  }
  if (city.parentId === 'ca-02') {
    const row = FAIR_PHARMACARE.table.find(([from, to]) => income >= from && income <= to) ?? FAIR_PHARMACARE.table[FAIR_PHARMACARE.table.length - 1]!;
    const most = cad(row[3]);
    const key = `fpc-${p.year}`;
    const spent = h.caDrug[key] ?? 0;
    return spend(key, cad(row[2]), (rest) => Math.min(Math.round(rest * (1 - FAIR_PHARMACARE.share)), Math.max(0, most - spent - Math.min(price, Math.max(0, cad(row[2]) - spent)))));
  }
  return undefined;
}

/** Why England's prescription prepayment certificate can't be bought now, or nothing: for someone in England who pays the charge. */
export function prepayRefusal(sim: Simulation, person: Person): string | undefined {
  const city = CITIES.get(homeOf(person));
  if (city?.parentId !== 'uk-eng') return 'It’s England’s, for its prescription charge.';
  if (publicCareShareOf(person, 'rx-generic', sim.now, 'GBP') === undefined) return 'You aren’t treated by the NHS.';
  if ((sim.now - person.birthInstant) / (365.25 * MS_DAY) >= NHS.prescriptionFreeFrom) return `Prescriptions are free at ${NHS.prescriptionFreeFrom}.`;
  if ((person.health?.prepaidUntil ?? 0) > sim.now + 30 * MS_DAY) return 'Yours runs more than another month.';
  return undefined;
}

export function rxShareOf(person: Person, brand: boolean, at: Instant, into = 'USD', cash?: Money): Money {
  const nhs = cash === undefined ? publicCareShareOf(person, brand ? 'rx-brand' : 'rx-generic', at, into) : undefined;
  if (nhs !== undefined) return nhs;
  // A generic at the chosen chain's own cash price (`US_PHARMACIES`, from 2026-10-01), which a plan's copay is never more than; a brand's, and an unchosen pharmacy's, the median.
  const chain = !brand && cash === undefined ? US_PHARMACIES.find((c) => c.id === healthOf(person).pharmacy) : undefined;
  const price = cash ?? (chain ? usd(Math.round(chain.generic * 100), into) : usd(grown(brand ? PHARMACY.price.brand : PHARMACY.price.generic, 'rx', at), into));
  // A Canadian's provincial drug plan, where one takes them (from later on 2026-09-30).
  const provincial = cash === undefined ? canadianDrugShare(person, at, price, into) : undefined;
  if (provincial !== undefined) return provincial;
  const key = restrictedScope(person, at) ? undefined : planKey(person, at);
  const plan = key ? PHARMACY.plans[key] : undefined;
  if (!plan) return price;
  const year = zonedParts(at, HOME).year;
  const h = healthOf(person);
  const [fixed, share] = brand ? plan.brand : plan.generic;
  const copay = Math.max(usd(fixed, into), Math.round(share * price));
  let owed = Math.min(price, copay);
  // A brand pays what's left of the year's drug deductible first, and the copay on top.
  if (brand && plan.brandDeductible > 0) {
    h.rxDeductible ??= {};
    const left = Math.max(0, usd(plan.brandDeductible, into) - (h.rxDeductible[year] ?? 0));
    const toDeductible = Math.min(price, left);
    h.rxDeductible[year] = (h.rxDeductible[year] ?? 0) + toDeductible;
    owed = Math.min(price, toDeductible + copay);
  }
  const design = planOf(person, at);
  // A plan with no most in a year (Medicaid, the Essential Plan) charges its copay every time; until 2026-09-27 it charged nothing, and New York Medicaid's $1 was never taken.
  return design && design.outOfPocket > 0 ? Math.max(0, Math.min(owed, usd(design.outOfPocket, into) - (h.spent[year] ?? 0))) : owed;
}

/**
 * Insulin a month: nothing on a plan New York regulates from 2025; otherwise
 * the plan's brand copay, or the price uninsured, and never more than the
 * makers' $35.
 */
export function insulinShareOf(person: Person, at: Instant, into = 'USD'): Money {
  const key = planKey(person, at);
  if (key && INSULIN.newYorkPlans.includes(key) && dayKeyOf(at) >= INSULIN.newYorkFrom) return 0;
  const cap = key && INSULIN.connecticutPlans.includes(key) && dayKeyOf(at) >= INSULIN.connecticutFrom ? INSULIN.connecticutCap : INSULIN.cashCap;
  return Math.min(rxShareOf(person, true, at, into), usd(cap, into));
}

/** A type 1 diabetic's monitor a month: the plan's brand copay on its price, or the maker's program, whichever is less. */
export function monitorShareOf(person: Person, at: Instant, into = 'USD'): Money {
  const m = INSULIN.monitor;
  return Math.min(rxShareOf(person, true, at, into, usd(m.price, into)), usd(m.program, into));
}

/** A price as it stood in the year it's paid, grown from the year it was measured. */
export function grown(cents: Money, item: keyof typeof MEDICAL_CPI.base, at: Instant): Money {
  const [year, series] = MEDICAL_CPI.base[item];
  return Math.round(cents * medicalGrowth(year, zonedParts(at, HOME).year, series));
}

const dayKeyOf = (at: Instant) => { const p = zonedParts(at, HOME); return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`; };

/** The stand-alone dental plan they may buy: Yale's while at school, Covered California's beside its plan, New York's where they live. */
export function dentalPlanFor(person: Person, at: Instant): DentalPlan | undefined {
  const cover = coverOn(person, at);
  if (cover === 'yale') return 'yale';
  const key = planKey(person, at);
  if (key === 'marketplace-ca') return 'ca';
  if (BENEFIT_STATE[homeOf(person)] === 'ny') return 'ny';
  return undefined;
}

/** The dentist and the optician: what the plan pays of each, where it has them, or a stand-alone dental plan; otherwise the price. */
/**
 * A named dentist's or optician's own self-pay price where they live (from
 * 2026-10-03; `research-health-travel-gaps.json`, each read on its own page):
 * a cleaning at 209 NYC Dental ($144), Holistic Smile Care in Los Angeles
 * (its $150 average), South Kensington Medical & Dental (£89), Truly Dental in
 * Dublin (€100 with a hygienist), Lockwood Clinic in Toronto (the middle of
 * its C$150 to C$200), Aarm Dental in Vancouver (C$297.40, a recall exam with
 * scaling, by BC's fee guide) and hi sonrisa in Mexico City (MX$1,199); an eye
 * exam at Warby Parker in New York ($95), Spadina Optometry in Toronto
 * (C$198) and Ópticas Devlyn in Mexico City (free). Until then each was
 * America's average, converted, wherever they lived.
 */
export const NAMED_TEETH_EYES: Readonly<Record<string, Partial<Record<'cleaning' | 'exam', { name: string; price: number; currency: string }>>>> = {
  'us-ny-newyork': { cleaning: { name: '209 NYC Dental', price: 144, currency: 'USD' }, exam: { name: 'Warby Parker', price: 95, currency: 'USD' } },
  'us-ca-losangeles': { cleaning: { name: 'Holistic Smile Care', price: 150, currency: 'USD' } },
  // Specsavers' own posted eye tests, from 2026-10-03 (`research-casting-therapy-hotels-cars.json`): "usually between £20 and £25" in Britain, the middle, and €30 in Ireland.
  'uk-eng-london': { cleaning: { name: 'South Kensington Medical & Dental', price: 89, currency: 'GBP' }, exam: { name: 'Specsavers', price: 22.5, currency: 'GBP' } },
  'ie-lei-dublin': { cleaning: { name: 'Truly Dental', price: 100, currency: 'EUR' }, exam: { name: 'Specsavers', price: 30, currency: 'EUR' } },
  'ca-on-toronto': { cleaning: { name: 'Lockwood Clinic', price: 175, currency: 'CAD' }, exam: { name: 'Spadina Optometry', price: 198, currency: 'CAD' } },
  'ca-bc-vancouver': { cleaning: { name: 'Aarm Dental Group', price: 297.4, currency: 'CAD' } },
  'mx-cmx-mexicocity': { cleaning: { name: 'hi sonrisa', price: 1_199, currency: 'MXN' }, exam: { name: 'Ópticas Devlyn', price: 0, currency: 'MXN' } },
};

/**
 * The year a dental plan's deductible and maximum are kept by: the calendar year for a monthly plan, and for Yale's, the
 * plan year it's in, 1 October to 30 September, by the year it began (from 2026-10-13: until then by the calendar year, so
 * a January filling paid a second deductible in the plan year whose October filling had paid it; found by the review of
 * that day).
 */
export function dentalYearOf(plan: string, at: Instant): number {
  const p = zonedParts(at, HOME);
  const yearly = plan !== 'source' && (DENTAL_PLANS[plan as Exclude<keyof typeof DENTAL_PLANS, 'source'>]?.yearly ?? false);
  return yearly && p.month < 10 ? p.year - 1 : p.year;
}

export function teethAndEyesShareOf(person: Person, care: 'cleaning' | 'filling' | 'exam' | 'glasses', at: Instant, into = 'USD'): Money {
  const named = care === 'cleaning' || care === 'exam' ? NAMED_TEETH_EYES[homeOf(person)]?.[care] : undefined;
  const price = named ? (named.currency === into ? Math.round(named.price * 100) : exchange(Math.round(named.price * 100), named.currency, into) ?? Math.round(named.price * 100)) : usd(grown(DENTAL_VISION.price[care], care === 'cleaning' || care === 'filling' ? 'dental' : 'vision', at), into);
  // Restricted scope pays none of it; state-funded Medi-Cal no teeth but an emergency's from July 2026.
  const prog = person.health?.program;
  const noTeeth = (care === 'cleaning' || care === 'filling') && coverOn(person, at) === 'medicaid' && prog?.scope === 'state' && at >= MEDI_CAL_UIS.dentalEnds;
  const key = restrictedScope(person, at) || noTeeth ? undefined : planKey(person, at);
  const plan = key ? DENTAL_VISION.plans[key] : undefined;
  const dental = person.health?.dental;
  // A dental plan of their own pays where the health plan pays nothing.
  if ((care === 'cleaning' || care === 'filling') && dental && active(dental, at) && !(plan && plan[care] > 0)) {
    const d = DENTAL_PLANS[dental.plan];
    const year = dentalYearOf(dental.plan, at);
    if (care === 'cleaning') return Math.round(price * (1 - d.preventive));
    const toDeductible = Math.min(price, Math.max(0, usd(d.deductible, into) - (dental.deductible[year] ?? 0)));
    dental.deductible[year] = (dental.deductible[year] ?? 0) + toDeductible;
    const pays = Math.min(Math.round((price - toDeductible) * d.basic), Math.max(0, usd(d.max, into) - (dental.paid[year] ?? 0)));
    dental.paid[year] = (dental.paid[year] ?? 0) + pays;
    return price - pays;
  }
  if (!plan) return price;
  if (care === 'exam') return plan.exam === undefined ? price : Math.min(price, usd(plan.exam, into));
  return Math.round(price * (1 - plan[care]));
}

/**
 * How much likelier than a rested, easy body this one is to catch the flu:
 * a sleep debt and stress each raise it (`CARE.catching`). Until 2026-09-27
 * the chance was the same whatever state the body was in.
 */
export function catching(person: Person): number {
  const c = CARE.catching;
  const w = person.wellbeing;
  const debt = clamp((w.sleepDebt - c.debtFrom) / (c.debtTo - c.debtFrom), 0, 1);
  return (1 + debt * (c.sleepMost - 1)) * (1 + (clamp(w.stress, 0, 100) / 100) * (c.stressMost - 1));
}

/** A week's health (`health.illness`): the flu in its season, a doctor's visit, an emergency, a stay. */
export function illnessWeek(sim: Simulation, person: Person, at: Instant): { care: Care; what: string; flu?: boolean }[] {
  const rng = sim.rng('health.illness', person.id, String(at));
  const p = zonedParts(at, HOME);
  const out: { care: Care; what: string; flu?: boolean }[] = [];
  const weekly = (perYear: number) => 1 - Math.exp(-perYear / 52);
  if (rng.next() < weekly(CARE.perYear.stay)) out.push({ care: 'stay', what: 'A stay in hospital' });
  // Asthma left alone doubles the emergencies.
  const asthma = person.health?.chronic?.asthma;
  const diabetes = person.health?.chronic?.diabetes;
  // Type 1 diabetes without insulin brings the emergency room four times as often.
  // Where an emergency department sees less of what a family doctor could, fewer visits (`emergencyScale`, from 2026-10-02).
  const emergencies = CARE.perYear.emergency * emergencyScale(homeOf(person)) * (asthma && !keptUp(asthma, at) ? CHRONIC.untreated.asthmaEmergencies : 1)
    * (diabetes?.typeOne && !keptUp(diabetes, at) ? CHRONIC.untreated.diabetesEmergencies : 1);
  if (rng.next() < weekly(emergencies)) out.push({ care: 'emergency', what: 'The emergency room' });
  if (rng.next() < weekly(CARE.perYear.visit)) out.push({ care: 'visit', what: 'A doctor’s visit' });
  // The week's share of a year's flu where they are, by the town's cold or wet weeks (`systems/seasons.ts`).
  const here = CITIES.get(person.currentLocationId) ? person.currentLocationId : homeOf(person);
  const local = zonedParts(at, CITIES.require(here).timeZone);
  const share = fluByWeek(here)[weekOfYear(local.month, local.day)]!;
  if (rng.next() < (1 - (1 - CARE.flu) ** share) * catching(person)) {
    out.push(rng.next() < CARE.fluSeesClinician ? { care: 'urgent', what: 'The flu, at urgent care', flu: true } : { care: 'visit', what: 'The flu', flu: true });
  }
  // The pharmacy, the dentist, the optician.
  if (rng.next() < weekly(PHARMACY.perYear)) out.push(rng.next() < PHARMACY.generic ? { care: 'rx-generic', what: 'A prescription, a generic' } : { care: 'rx-brand', what: 'A prescription, a brand' });
  if (rng.next() < 1 - (1 - DENTAL_VISION.dentistShare) ** (1 / 52)) {
    out.push({ care: 'cleaning', what: 'The dentist, a cleaning' });
    if (rng.next() < DENTAL_VISION.fillingShare) out.push({ care: 'filling', what: 'The dentist, a filling' });
  }
  if (person.health?.lenses && rng.next() < 1 - (1 - DENTAL_VISION.examShare) ** (1 / 52)) {
    out.push({ care: 'exam', what: 'An eye exam' });
    if (p.year - (person.health.lastGlasses ?? 0) >= DENTAL_VISION.glassesEvery) out.push({ care: 'glasses', what: 'New glasses' });
  }
  return out;
}

/**
 * What a piece of medical care costs a plan before it leaves them their share: SLATE's commercial price, grown from its
 * year by the medical price index (`CARE.price`, `grown`).
 */
export const planPrice = (care: 'visit' | 'urgent' | 'emergency' | 'stay', at: Instant, into: string): Money => usd(grown(CARE.price[care], care as 'visit', at), into);

/**
 * Whether a plan pays a piece of medical care had at a moment (from 2026-10-16, read alike by `careFor` and
 * `repriceCare`): a plan covers them, and it isn't restricted scope's care outside a hospital, nor a Yale Health
 * member's visit outside its Health Center (`outsideItsPractice`). Until then `repriceCare` asked only whether a plan
 * covered them, so the plan's part it wrote didn't follow what the plan pays.
 */
function planPays(person: Person, care: Care, clinic: ReturnType<typeof clinicById>, at: Instant): boolean {
  const hospital = care === 'emergency' || care === 'stay';
  return planOf(person, at) !== undefined && !(restrictedScope(person, at) && !hospital) && !(care === 'visit' && outsideItsPractice(person, clinic, at));
}

/**
 * An illness or a piece of care: what it takes from the body, a stay's days, and the bill. An appointment's visit is had
 * at the practice it was booked at (`clinicId`, from 2026-10-15: until then at whichever was their doctor on the day).
 */
export function careFor(sim: Simulation, person: Person, event: { care: Care; what: string; flu?: boolean; clinicId?: string }, at: Instant): MedicalBill | undefined {
  const h = healthOf(person);
  const cur = saveCurrency(sim.universe);
  const w = person.wellbeing;
  const toll = event.flu ? CARE.toll.flu : event.care === 'stay' ? CARE.toll.stay : event.care === 'emergency' ? CARE.toll.emergency : undefined;
  if (toll) {
    // A resilient body loses less to it.
    const takes = personalityOf(person, 'illnessToll');
    w.condition = Math.max(0, w.condition - toll.condition * takes);
    w.energy = Math.max(0, w.energy - toll.energy * takes);
  }
  if (event.care === 'stay') h.inHospitalUntil = at + CARE.stayDays * MS_DAY;
  // An emergency department keeps them its median time, missing what that time held (`edMinutes`, from 2026-10-01).
  if (event.care === 'emergency') h.inHospitalUntil = Math.max(h.inHospitalUntil ?? 0, at + Math.round(edMinutes(homeOf(person)) * 60_000));
  if (event.flu) h.fluUntil = at + CARE.fluDays * MS_DAY;
  // A flu that isn't seen costs nothing, and is told all the same (from 2026-10-13: until then it returned before its notice,
  // and the player was never told of the flu that cost them condition and energy and stopped their workouts; found by the
  // review of that day).
  if (event.flu && event.care === 'visit') {
    if (person.id === sim.universe.playerId) sim.notify({ category: 'health', title: 'You Have The Flu', body: `${event.what}. It costs nothing.`, importance: 60, route: '/workspace/papers' });
    return undefined;
  }
  // Where it was had: a named practice, clinic or hospital in the town they're in (`systems/clinics.ts`), the practice
  // an appointment was booked at for a visit.
  const booked = event.clinicId ? clinicById(event.clinicId) : undefined;
  const clinic = MEDICAL.includes(event.care) ? booked ?? clinicFor(person, event.care as 'visit' | 'urgent' | 'emergency' | 'stay', at) : undefined;
  // A Yale Health member's visit had outside its Health Center: the cover pays none of it, and nothing goes toward its
  // out-of-pocket most (from 2026-10-15).
  const outside = event.care === 'visit' && outsideItsPractice(person, clinic, at);
  const amount = careQuote(sim, person, event.care, at, event.care === 'visit' ? clinic?.id : undefined);
  const year = zonedParts(at, HOME).year;
  if (event.care === 'glasses') h.lastGlasses = year;
  if (planOf(person, at) && !outside && (MEDICAL.includes(event.care) || event.care.startsWith('rx'))) h.spent[year] = (h.spent[year] ?? 0) + amount;
  // A prescription is paid at the counter, or not filled.
  if (event.care.startsWith('rx')) {
    if (amount > 0 && !payFromCurrent(sim, person, amount, `Pharmacy: ${inSentence(event.what)}`, 'health')) return undefined;
    h.seq = (h.seq ?? 0) + 1;
    const paid: MedicalBill = { id: `m${h.seq}`, at, what: event.what, amount, dueAt: at, paid: true };
    h.bills.push(paid);
    h.bills = keptBills(h.bills);
    return undefined;
  }
  if (!MEDICAL.includes(event.care)) {
    if (amount <= 0) return undefined;
    h.seq = (h.seq ?? 0) + 1;
    const bill: MedicalBill = { id: `m${h.seq}`, at, what: event.what, amount, dueAt: at + MEDICAL_DEBT.dueDays * MS_DAY };
    h.bills.push(bill);
    h.bills = keptBills(h.bills);
    sim.schedule({ at: bill.dueAt, kind: BILL_KIND, label: `Bill Due: ${event.what}`, category: 'personal', priority: 20, payload: { personId: person.id, billId: bill.id } });
    return bill;
  }
  if (clinic) event = { ...event, what: `${event.what}, ${clinic.name}` };
  // On the care log, whatever it cost (`repriceCare`), with the plan's part (from 2026-10-16: a share of $0 makes no
  // bill, and until then what HUSKY D, Covered Connecticut or Yale Health paid of such care was written nowhere).
  const pays = MEDICAL.includes(event.care) && planPays(person, event.care, clinic, at);
  const planPart = pays ? Math.max(0, planPrice(event.care as 'visit' | 'urgent' | 'emergency' | 'stay', at, cur) - amount) : 0;
  const logged = MEDICAL.includes(event.care) ? { at, care: event.care, what: event.what, share: amount, ...(event.care === 'visit' && clinic ? { clinicId: clinic.id } : {}), planPaid: planPart } as NonNullable<HealthRecord['careLog']>[number] : undefined;
  if (logged) { h.careLog = [...(h.careLog ?? []), logged]; pruneCareLog(h, at); }
  if (person.id === sim.universe.playerId && MEDICAL.includes(event.care)) {
    sim.notify({ category: 'health', title: event.care === 'stay' ? 'In Hospital' : event.flu ? 'You Have The Flu' : event.care === 'emergency' ? 'The Emergency Room' : 'A Doctor’s Visit', body: `${event.what}${event.care === 'stay' ? `, ${CARE.stayDays} days` : ''}. ${outside ? 'Yale Health pays for a visit at its own Health Center, not here. ' : ''}${amount > 0 ? `Your share is ${formatMoney(amount, cur)}, due in ${MEDICAL_DEBT.dueDays} days.` : 'Nothing to pay.'}`, importance: event.care === 'stay' ? 85 : 60, route: '/workspace/papers' });
  }
  if (amount <= 0) return undefined;
  h.seq = (h.seq ?? 0) + 1;
  const hospital = event.care === 'emergency' || event.care === 'stay';
  // A marketplace insurer's denial: billed as if uninsured (`DENIALS`).
  const denied = coverOn(person, at) === 'marketplace' && sim.rng('health.denial', person.id, `m${h.seq}`).next() < DENIALS.rate;
  const full = denied ? Math.max(amount, uninsuredPrice(sim, event.care as 'visit' | 'urgent' | 'emergency' | 'stay', at)) : amount;
  // An uninsured Connecticut patient's was screened for the charity at billing (`shareOf`), and the bill says how it
  // came out: screened where something came off, refused over the limit (from 2026-10-12: until then every one read
  // screened, and Papers said Charity Taken Off on a bill it took nothing off).
  const screened = hospital && !planOf(person, at) && CITIES.get(homeOf(person))?.parentId === 'us-ct';
  const screening = screened ? (incomeRatio(person, at, cur) <= CHARITY.connecticut.discountTo ? 'screened' as const : 'refused' as const) : undefined;
  // The plan's part, where a plan paid (restricted scope pays only a hospital's): the price less the share, none while denied.
  const paying = pays;
  const price = paying ? planPrice(event.care as 'visit' | 'urgent' | 'emergency' | 'stay', at, cur) : 0;
  if (logged && denied) logged.planPaid = 0;
  const bill: MedicalBill = { id: `m${h.seq}`, at, what: event.what, amount: full, dueAt: at + MEDICAL_DEBT.dueDays * MS_DAY, ...(hospital ? { hospital: true, cityId: homeOf(person) } : {}), ...(screening ? { aid: screening } : {}), ...(denied ? { denied: { share: amount } } : {}), ...(paying ? { covered: { price, planPaid: denied ? 0 : Math.max(0, price - amount) } } : {}) };
  if (denied && person.id === sim.universe.playerId) sim.notify({ category: 'health', title: 'A Claim Denied', body: `Your plan denied the claim for ${inSentence(event.what)}: ${formatMoney(full, cur)} is yours to pay unless an appeal overturns it.`, importance: 60, route: '/workspace/papers' });
  h.bills.push(bill);
  h.bills = keptBills(h.bills);
  if (logged) logged.billId = bill.id;
  sim.schedule({ at: bill.dueAt, kind: BILL_KIND, label: `Medical Bill Due: ${event.what}`, category: 'personal', priority: 20, payload: { personId: person.id, billId: bill.id } });
  return bill;
}

/** How long the care log keeps every event: past the furthest a cover change reaches back (a leave's insurance term, a withdrawal's term start). */
export const CARE_LOG = { keepDays: 400 } as const;

/** The log pruned to what can still matter: recent events, and any whose bill is open, in debt or under appeal; the rest counted by year. */
export function pruneCareLog(h: HealthRecord, now: Instant): void {
  const open = new Set(h.bills.filter((b) => !b.paid || b.inDebt || (b.denied && !b.denied.outcome)).map((b) => b.id));
  const keep: NonNullable<HealthRecord['careLog']> = [];
  for (const e of h.careLog ?? []) {
    if (e.at >= now - CARE_LOG.keepDays * MS_DAY || (e.billId && open.has(e.billId))) { keep.push(e); continue; }
    const y = String(zonedParts(e.at, HOME).year);
    const a = ((h.careArchive ??= {})[y] ??= { events: 0, charged: 0 });
    a.events += 1;
    a.charged += e.share;
  }
  h.careLog = keep;
}

/**
 * Care had between two moments billed again as the cover then now reads (from 2026-10-10): Yale Health canceled back
 * to an insurance term's start, or Affiliate cover bought back to the day student cover ended. Returns the net change to
 * what she owes, more owed positive.
 *
 * What it may change, and when (from 2026-10-16). A bill as issued stands: its plan part is never rewritten, and a bill
 * paid or gone to medical debt is never changed at all. Each care event whose share or plan part the cover now moves
 * gets one line of its own (`adjusts` naming the bill it adjusts), said in the notice:
 * - more owed is billed on that line, due in 30 days, as any bill;
 * - less owed is that line's credit: off the original's balance while it's open and unpaid (kept on it as `credited`,
 *   so the share it was issued at is still read), then off the medical debt where the original went to debt, then back
 *   to the bank;
 * - the plan's part follows what the plan pays now (`planPays`: the price less the share where it pays this care,
 *   nothing where it doesn't), and the line carries the change, negative where the plan takes its part back.
 * So a care event's lines sum to its share now, its care log keeps the plan's part now, and where the cover pays it the
 * two make its price. A second change of cover over the same care bills only the difference (`share` and `planPaid`
 * move with each). A claim standing denied isn't repriced: only Yale Health's cover moves back in time, and its claims
 * aren't denied.
 *
 * Until 2026-10-16: an open bill's share was cut in place and marked paid when cut to nothing, so Papers said Settled
 * for a bill nobody paid; the plan's part was set only on a bill that already had one, and from whether a plan covered
 * her rather than whether it paid this care, so care first billed uninsured and then covered back carried a plan part
 * of nothing, its share and the plan's falling short of the price; and a credit on care whose bill had gone to debt was
 * paid back to the bank while the debt for it stood.
 */
export function repriceCare(sim: Simulation, person: Person, from: Instant, to: Instant, why: string): Money {
  const h = healthOf(person);
  const cur = saveCurrency(sim.universe);
  let net = 0;
  for (const e of h.careLog ?? []) {
    if (e.at < from || e.at > to) continue;
    const was = h.bills.find((b) => b.id === e.billId);
    if (was?.denied && was.denied.outcome !== 'overturned') continue;
    // Read without moving the year's deductible and copay counters, which the care already moved once when it was had.
    const kept = { deductible: { ...h.deductible }, stayCopays: h.stayCopays ? { ...h.stayCopays } : undefined };
    const now = shareOf(person, e.care, e.at, cur, e.clinicId);
    h.deductible = kept.deductible;
    if (kept.stayCopays) h.stayCopays = kept.stayCopays; else delete h.stayCopays;
    const medical = e.care as 'visit' | 'urgent' | 'emergency' | 'stay';
    const where = e.care === 'visit' ? (e.clinicId ? clinicById(e.clinicId) : clinicFor(person, 'visit', e.at)) : undefined;
    const price = planPrice(medical, e.at, cur);
    const planNow = planPays(person, e.care, where, e.at) ? Math.max(0, price - now) : 0;
    // A log written before 2026-10-16 has no plan part: its bill's, or none.
    const planWas = e.planPaid ?? was?.covered?.planPaid ?? 0;
    // Against what was last charged for it: a second change of cover over the same care bills only the difference.
    const diff = now - e.share;
    const planDiff = planNow - planWas;
    if (diff === 0 && planDiff === 0) continue;
    net += diff;
    e.share = now;
    e.planPaid = planNow;
    (e.adjusted ??= []).push({ at: sim.now, why, change: diff, plan: planDiff });
    // Hospital care now billed as the uninsured's, in Connecticut, was screened for the charity, as `careFor` screens it.
    const hospital = e.care === 'emergency' || e.care === 'stay';
    const screened = hospital && planNow === 0 && !planOf(person, e.at) && CITIES.get(homeOf(person))?.parentId === 'us-ct';
    const screening = screened ? (incomeRatio(person, e.at, cur) <= CHARITY.connecticut.discountTo ? 'screened' as const : 'refused' as const) : undefined;
    h.seq = (h.seq ?? 0) + 1;
    const line: MedicalBill = {
      id: `m${h.seq}`, at: sim.now, what: `${e.what}: ${why}`, amount: Math.max(0, diff), dueAt: sim.now + MEDICAL_DEBT.dueDays * MS_DAY,
      ...(e.billId ? { adjusts: e.billId } : {}),
      ...(hospital ? { hospital: true, cityId: homeOf(person) } : {}), ...(screening ? { aid: screening } : {}),
      ...(planDiff !== 0 ? { covered: { price, planPaid: planDiff } } : {}),
      ...(diff <= 0 ? { paid: true } : {}), ...(diff < 0 ? { credit: -diff } : {}),
    };
    h.bills.push(line);
    h.bills = keptBills(h.bills);
    if (diff > 0) {
      e.billId ??= line.id;
      sim.schedule({ at: line.dueAt, kind: BILL_KIND, label: `Medical Bill Due: ${line.what}`, category: 'personal', priority: 20, payload: { personId: person.id, billId: line.id } });
      continue;
    }
    let credit = -diff;
    if (was && !was.paid && !was.inDebt) {
      const off = Math.min(credit, was.amount);
      was.amount -= off;
      was.credited = (was.credited ?? 0) + off;
      credit -= off;
      if (was.amount === 0) was.paid = true;
    }
    const debt = was?.inDebt ? medicalDebtOf(sim, person) : undefined;
    if (credit > 0 && debt && debt.balance < 0) {
      const off = Math.min(credit, -debt.balance);
      sim.post({ memo: `Credit: ${e.what}, ${why}`, category: 'health', postings: [{ accountId: debt.id, amount: off }, { accountId: sim.nominalAccount('expense', expenseFor('health')).id, amount: -off }] });
      credit -= off;
      // A debt cleared settles its bills, as health.pay_bill does.
      if (debt.balance >= 0) { delete h.debtSince; for (const b of h.bills) if (b.inDebt) { b.paid = true; delete b.inDebt; } }
    }
    if (credit > 0) sim.post({ memo: `Refund: ${e.what}, ${why}`, category: 'health', postings: [{ accountId: payeeAccount(sim, person).id, amount: credit }, { accountId: sim.nominalAccount('expense', expenseFor('health')).id, amount: -credit }] });
  }
  if (net !== 0 && person.id === sim.universe.playerId) sim.notify({ category: 'health', title: net > 0 ? 'Care Billed Again' : 'Care Credited', body: `${why}: care you had from ${formatDate(from, HOME)} is billed as that cover pays, ${net > 0 ? `${formatMoney(net, cur)} more, on a bill of its own` : `${formatMoney(-net, cur)} less, off what was open or owed and the rest back to your bank`}.`, importance: 75, route: '/workspace/papers' });
  return net;
}

/**
 * Why a hospital bill can't be put in for Yale New Haven's financial
 * assistance, or nothing where it can: a Connecticut hospital's, not yet
 * due or applied for. Its policy helps an insured patient with what
 * insurance leaves as it helps the uninsured, on the same incomes, but only
 * on an application (`CHARITY.connecticut`); the uninsured's is applied
 * at billing. A bill applied for, or screened at billing and over the limit,
 * says it's been put to the charity (from 2026-10-12: until then "You’ve
 * applied for it.", which a bill screened over the limit never was).
 */
export function aidRefusal(bill: MedicalBill, at: Instant): string | undefined {
  if (!bill.hospital || CITIES.get(bill.cityId ?? '')?.parentId !== 'us-ct') return 'Only a Connecticut hospital’s bill.';
  if (bill.paid || at >= bill.dueAt) return 'It’s settled or past due.';
  if (bill.aid === 'screened') return 'The hospital’s charity is off it already.';
  if (bill.aid) return 'It’s been put to the hospital’s charity.';
  return undefined;
}

/** A bill for care that isn't one of the kinds `careFor` draws (an injury's): due in 30 days, a debt unpaid. */
export function billCare(sim: Simulation, person: Person, what: string, amount: Money, at: Instant): MedicalBill {
  const h = healthOf(person);
  h.seq = (h.seq ?? 0) + 1;
  const bill: MedicalBill = { id: `m${h.seq}`, at, what, amount, dueAt: at + MEDICAL_DEBT.dueDays * MS_DAY };
  h.bills.push(bill);
  h.bills = keptBills(h.bills);
  sim.schedule({ at: bill.dueAt, kind: BILL_KIND, label: `Medical Bill Due: ${what}`, category: 'personal', priority: 20, payload: { personId: person.id, billId: bill.id } });
  return bill;
}

/**
 * Why a longer supply can't be filled now, or nothing. It refused one away from home too, until 2026-10-12: where they
 * live has been where they are (`homeOf`) since the journeys went on 2026-10-09, so that refusal could never be given.
 */
export function extraSupplyRefusal(person: Person, days: number): string | undefined {
  if (!Object.values(healthOf(person).chronic ?? {}).some((c) => c?.treated)) return 'You take no medicine for a condition.';
  const most = longestFillOf(person);
  if (!Number.isInteger(days) || days <= 0 || days > most) return `At most ${most} days at once here.`;
  return undefined;
}

/**
 * What care would cost them before it's had (from 2026-10-02): their share at home, by their plan or the public
 * system. Away in another country it was travel insurance's or the place's price for a visitor (`careAway`), until
 * the journeys went in the scope reset of 2026-10-09. The bill for care had is this same figure.
 */
/** What care costs uninsured, in the save's money: SLATE's American price at the uninsured markup. */
export const uninsuredPrice = (sim: Simulation, c: 'visit' | 'urgent' | 'emergency' | 'stay', at: Instant): Money => Math.round(usd(grown(CARE.price[c], c as 'visit', at), saveCurrency(sim.universe)) * CARE.uninsuredMarkup);

/** Why a bill's denial can't be appealed now, or nothing. */
export function appealRefusal(bill: MedicalBill | undefined, at: Instant): string | undefined {
  if (!bill?.denied) return 'That claim wasn’t denied.';
  if (bill.denied.appealedAt !== undefined) return 'It’s been appealed.';
  if (at > bill.at + DENIALS.appealDays * MS_DAY) return `An appeal is filed within ${DENIALS.appealDays} days of the denial.`;
  return undefined;
}

/** At a practice of their choosing (`clinicId`, from 2026-10-15), for Papers' Your Doctor and an appointment's visit. */
export function careQuote(sim: Simulation, person: Person, care: Care, at: Instant = sim.now, clinicId?: string): Money {
  return shareOf(person, care, at, saveCurrency(sim.universe), clinicId);
}

/**
 * What the care was, inside a sentence: a leading A, An or The made small and the rest as it is written, the clinic's and
 * the hospital's names kept (from 2026-10-13: until then the whole of it was made small, "fair haven community health
 * care"; found by the review of that day).
 */
export const inSentence = (what: string): string => (/^(A|An|The) /.test(what) ? what.charAt(0).toLowerCase() + what.slice(1) : what);

export function registerHealth(sim: Simulation): void {
  sim.onSchedule(HEALTH_MONTH_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (!person) return;
    healthMonth(s, person, item.at);
    const p = zonedParts(item.at, HOME);
    s.schedule({ at: firstOf(p.year, p.month + 1) + 30 * 60_000, kind: HEALTH_MONTH_KIND, label: 'Health Cover', category: 'system', priority: 6, payload: { personId: person.id } });
  });

  sim.onSchedule(HEALTH_WEEK_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    if (!person) return;
    for (const event of illnessWeek(s, person, item.at)) {
      // The player's doctor's visit is booked for the place's wait, where one is published (`systems/appointments.ts`); one
      // already booked covers it. One owed, missed or called off, is booked now, one appointment for both. Until
      // 2026-10-13 a visit owed covered it too, and was never booked by anything but Book An Appointment, so one
      // appointment called off or missed, and left, ended the doctor and every review for good, at no cost (found by
      // the second round of that day; tests/defects-g23-1.test.ts measured it on 2026-10-12).
      if (person.id === s.universe.playerId && event.care === 'visit' && !event.flu) {
        if (appointmentsOf(person).length) continue;
        const owed = healthOf(person).owedVisit;
        if (book(s, person, owed ?? event.what)) { delete healthOf(person).owedVisit; continue; }
      }
      careFor(s, person, event, item.at);
    }
    // A self-employed Canadian's EI sickness benefit, for a week too sick to work (`systems/eiself.ts`).
    eiWeek(s, person, item.at, laidUp(person, item.at + 3 * MS_DAY) || (person.health?.inHospitalUntil ?? 0) > item.at - 4 * MS_DAY);
    // A chronic condition's review, booked when it's due (`REVIEW_MONTHS`, from 2026-10-03).
    if (person.id === s.universe.playerId && !appointmentsOf(person).length && !healthOf(person).owedVisit) {
      for (const [condition, state] of Object.entries(healthOf(person).chronic ?? {}) as [Condition, Chronic][]) {
        if (!state.treated) continue;
        const months = REVIEW_MONTHS[condition];
        const due = months ? (state.reviewedAt ?? state.since ?? item.at) + months * 30.44 * MS_DAY : condition === 'depression' && state.since && !state.reviewedAt ? state.since + DEPRESSION_REVIEW_DAYS * MS_DAY : undefined;
        state.reviewedAt ??= state.since ?? item.at;
        if (due !== undefined && item.at >= due) { if (!book(s, person, reviewWhat(condition))) healthOf(person).owedVisit = reviewWhat(condition); break; }
      }
    }
    // The medicine filled with a week left (`fillMedicine`, from 2026-10-02). Until 2026-10-12 only where they lived,
    // and away it could run out; since the journeys went on 2026-10-09 they've always been where they live (`homeOf`).
    fillMedicine(s, person, item.at);
    // Depression left alone weighs on morale.
    const depression = healthOf(person).chronic?.depression;
    if (depression && !keptUp(depression, item.at)) person.wellbeing.morale = Math.max(0, person.wellbeing.morale - CHRONIC.untreated.moraleAWeek);
    // Diabetes left alone wears the body down; arthritis tires it.
    const { diabetes, arthritis } = healthOf(person).chronic ?? {};
    if (diabetes && !keptUp(diabetes, item.at)) person.wellbeing.condition = Math.max(0, person.wellbeing.condition - CHRONIC.untreated.diabetesConditionAWeek);
    if (arthritis && !keptUp(arthritis, item.at)) person.wellbeing.energy = Math.max(0, person.wellbeing.energy - CHRONIC.untreated.arthritisEnergyAWeek);
    s.schedule({ at: nextMonday(item.at), kind: HEALTH_WEEK_KIND, label: 'Health', category: 'system', priority: 6, payload: { personId: person.id } });
  });

  sim.onSchedule(BILL_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const bill = person ? healthOf(person).bills.find((b) => b.id === item.payload.billId) : undefined;
    if (!person || !bill || bill.paid || bill.inDebt) return;
    // Paid only if the payment goes through (from 2026-10-10): until then the bill was marked paid first, so one that
    // went to debt read "Settled" on Papers, and an appeal won later refunded money that was never paid.
    if (payFromCurrent(s, person, bill.amount, `Medical bill: ${bill.what}`, 'health')) { bill.paid = true; return; }
    bill.inDebt = true;
    // Unpaid, a debt.
    const h = healthOf(person);
    const debt = medicalDebtOf(s, person) ?? s.openAccount({ id: s.nextId('account'), kind: 'loan', category: 'medical', name: 'Owed For Medical Care', ownerId: person.id, institution: 'Your Providers', openedAt: s.now });
    s.post({ memo: `Medical bill unpaid: ${bill.what}`, category: 'health', postings: [{ accountId: debt.id, amount: -bill.amount }, { accountId: s.nominalAccount('expense', 'Medical Care').id, amount: bill.amount }] });
    h.debtSince ??= s.now;
    if (person.id === s.universe.playerId) s.notify({ category: 'health', title: 'A Medical Bill Went Unpaid', body: `${formatMoney(bill.amount, saveCurrency(s.universe))} for ${inSentence(bill.what)} is a medical debt now.`, importance: 75, route: '/workspace/papers' });
  });

  sim.onCommand<{ billId: string }, { decidedAt: Instant }>('health.appeal', (p, { sim: s }) => {
    const person = s.player;
    const bill = healthOf(person).bills.find((b) => b.id === p?.billId);
    const no = appealRefusal(bill, s.now);
    if (no) throw new CommandError(no);
    bill!.denied!.appealedAt = s.now;
    const decidedAt = s.now + DENIALS.decideDays * MS_DAY;
    s.schedule({ at: decidedAt, kind: APPEAL_KIND, label: 'An Appeal Decided', category: 'personal', priority: 25, payload: { personId: person.id, billId: bill!.id } });
    return { decidedAt };
  });
  sim.onSchedule(APPEAL_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const bill = person ? healthOf(person).bills.find((b) => b.id === item.payload.billId) : undefined;
    if (!person || !bill?.denied) return;
    const upheld = s.rng('health.appeal', person.id, bill.id).next() < DENIALS.upheld;
    bill.denied.outcome = upheld ? 'upheld' : 'overturned';
    if (!upheld) {
      // Overturned: only the plan's share is owed. What was paid over it comes back; what went to debt over it is taken
      // off the debt (from 2026-10-10: until then a bill gone to debt was refunded as if paid, and its debt stayed).
      const over = bill.amount - bill.denied.share;
      // Back where their payments are paid (`payeeAccount`, from 2026-10-10: until then the primary account).
      if (bill.paid && over > 0 && person.primaryAccountId) s.post({ memo: `Appeal won: ${bill.what}`, category: 'health', postings: [{ accountId: payeeAccount(s, person).id, amount: over }, { accountId: s.nominalAccount('expense', 'Medical Care').id, amount: -over }] });
      const debt = bill.inDebt ? medicalDebtOf(s, person) : undefined;
      if (debt && over > 0) {
        const off = Math.min(over, Math.max(0, -debt.balance));
        if (off > 0) s.post({ memo: `Appeal won: ${bill.what}`, category: 'health', postings: [{ accountId: debt.id, amount: off }, { accountId: s.nominalAccount('expense', 'Medical Care').id, amount: -off }] });
        // What was paid toward the debt past what's owed now comes back, and a debt cleared settles its bills, as
        // health.pay_bill does (from 2026-10-13: until then it was kept, and the bill read Owed As Debt on a debt of
        // nothing; found by the review of that day).
        const back = over - off;
        if (back > 0) s.post({ memo: `Appeal won: ${bill.what}`, category: 'health', postings: [{ accountId: payeeAccount(s, person).id, amount: back }, { accountId: s.nominalAccount('expense', 'Medical Care').id, amount: -back }] });
        if (debt.balance >= 0) { delete healthOf(person).debtSince; for (const b of healthOf(person).bills) if (b.inDebt) { b.paid = true; delete b.inDebt; } }
      }
      bill.amount = bill.denied.share;
      // And the plan pays its part of the price (from 2026-10-15).
      if (bill.covered) bill.covered.planPaid = Math.max(0, bill.covered.price - bill.denied.share);
    }
    if (person.id === s.universe.playerId) s.notify({ category: 'health', title: upheld ? 'Appeal Upheld' : 'Appeal Won', body: upheld ? `The plan kept its denial for ${inSentence(bill.what)}.` : `The plan reversed its denial for ${inSentence(bill.what)}: you owe its share, ${formatMoney(bill.denied.share, saveCurrency(s.universe))}.`, importance: 55, route: '/workspace/papers' });
  });

  // England's prescription prepayment certificate: three months or twelve, every prescription free while it runs.
  // A longer supply paid ahead, at the pharmacy where they live (`FILL`, from 2026-10-02; for a trip until the journeys
  // went on 2026-10-09). A condition the bank can't pay for refuses the whole of it, and the command's rollback leaves
  // nothing half filled (from 2026-10-12: until then it said it filled, and the unpaid condition went without).
  sim.onCommand<{ days: number }, { paid: Money }>('health.extra_supply', (p, { sim: s }) => {
    const person = s.player;
    const no = extraSupplyRefusal(person, Number(p?.days));
    if (no) throw new CommandError(no);
    const skipped: Condition[] = [];
    const paid = fillMedicine(s, person, s.now, Number(p.days), skipped);
    if (skipped.length) throw new CommandError('It comes to more than the bank can cover.');
    return { paid };
  });
  sim.onCommand<{ months: 3 | 12 }, { paid: Money; until: Instant }>('health.prepay', (p, { sim: s }) => {
    const person = s.player;
    const no = prepayRefusal(s, person);
    if (no) throw new CommandError(no);
    const months = p?.months === 3 ? 3 : 12;
    const pounds = months === 3 ? NHS.prepayment.months3 : NHS.prepayment.months12;
    const cur = saveCurrency(s.universe);
    const paid = cur === 'GBP' ? Math.round(pounds * 100) : exchange(Math.round(pounds * 100), 'GBP', cur) ?? Math.round(pounds * 100);
    if (!payFromCurrent(s, person, paid, `A prescription prepayment certificate, ${months} months`, 'health')) throw new CommandError(`It comes to ${formatMoney(paid, cur)}, more than you can pay.`);
    const h = healthOf(person);
    const from = Math.max(s.now, h.prepaidUntil ?? 0);
    h.prepaidUntil = from + Math.round((months * 365.25) / 12) * MS_DAY;
    return { paid, until: h.prepaidUntil };
  });

  sim.onCommand<Record<string, never>, { from: Instant; kind: string }>('health.enroll', (_p, { sim: s }) => {
    const person = s.player;
    const cur = saveCurrency(s.universe);
    const may = mayEnroll(person, s.now, cur, s);
    if (!may.ok) throw new CommandError(may.why);
    const state = BENEFIT_STATE[homeOf(person)]!;
    // The first of next month, or the first on or after Yale Health's end (`enrollStart`).
    const from = enrollStart(person, s.now);
    const h = healthOf(person);
    if (may.program) {
      const { band, scope } = programFor(person, s.now, cur, from)!;
      // Renewed so many months from its start, which is next month's first unless it waits for Yale Health's end.
      const f = zonedParts(from, HOME);
      h.program = { kind: may.program, state, from, band, renewAt: firstOf(f.year, f.month + renewMonths(s.now, state)), ...(scope ? { scope } : {}) };
    } else h.marketplace = { from, state };
    armHealth(s, person);
    return { from, kind: may.program ?? 'marketplace' };
  });

  // HUSKY D applied for where Enroll can't verify its work rules (from 2026-10-16): the application is taken, a notice
  // of noncompliance sent, and it's decided at its thirty days' end (`noticeOfNoncompliance`, `WORK_DECIDED_KIND`).
  // Until then the refusal on Papers was the end of it, with no notice and no time to answer.
  sim.onCommand<Record<string, never>, { decideAt: Instant; months: string[] }>('health.apply', (_p, { sim: s }) => {
    const person = s.player;
    const no = applyRefusal(s, person, s.now);
    if (no) throw new CommandError(no);
    const cur = saveCurrency(s.universe);
    const state = BENEFIT_STATE[homeOf(person)]!;
    const from = enrollStart(person, s.now);
    const { band } = programFor(person, s.now, cur, from)!;
    const months = lookBack(s.now, state, 'apply');
    noticeOfNoncompliance(s, person, { kind: 'application', state, noticeAt: s.now, decideAt: decisionAt(s.now), months, band, from });
    armHealth(s, person);
    return { decideAt: decisionAt(s.now), months };
  });

  // A short-term hardship asked for on a notice of noncompliance (from 2026-10-16; 42 CFR 435.555(d)(1), "subject to a
  // request"): a stay in hospital in a month assessed deems that month met, and the renewal or the application is
  // granted at once (`grantPending`).
  sim.onCommand<Record<string, never>, { month: string }>('health.request_hardship', (_p, { sim: s }) => {
    const person = s.player;
    const no = hardshipRefusal(s, person, s.now);
    if (no) throw new CommandError(no);
    const pend = healthOf(person).pending!;
    const met = engagement(s, person, pend.months, saveCurrency(s.universe), true)!;
    grantPending(s, person, pend, met, s.now);
    return { month: met.month };
  });

  // A notice of noncompliance's thirty days over (from 2026-10-16). The months are read again, as the records stand;
  // still short, a renewal's cover ends at the month's end at least ten days on, said, and an application is denied,
  // said with how to apply again (42 CFR 435.558(d), (e)). A notice answered, or a program ended meanwhile, is passed by.
  sim.onSchedule(WORK_DECIDED_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const h = person ? healthOf(person) : undefined;
    const pend = h?.pending;
    if (!person || !h || !pend || pend.noticeAt !== item.payload.noticeAt) return;
    const cur = saveCurrency(s.universe);
    const met = engagement(s, person, pend.months, cur);
    if (met) { grantPending(s, person, pend, met, item.at); return; }
    delete h.pending;
    const names = PROGRAM_NAMES[pend.state];
    const why = `${pend.months.length > 1 ? `No month from ${monthsWords(pend.months)} showed` : `${monthsWords(pend.months)} didn’t show`} ${workWords(cur)}, and none was shown by ${formatDate(answerBy(pend.noticeAt), HOME)}`;
    const credit = `, without the premium tax credit while ${names.medicaid} would take you but for its work rules; you can apply again in any month after one that meets them`;
    if (pend.kind === 'application') {
      if (person.id === s.universe.playerId) s.notify({ category: 'health', title: 'Public Cover Denied', body: `${why}: ${names.medicaid} is denied. The marketplace sells to you in its own windows${credit}.`, importance: 80, route: '/workspace/papers' });
      return;
    }
    const prog = h.program;
    if (!prog || !active(prog, item.at) || prog.until !== undefined) return;
    endAhead(s, person, prog, item.at, why, credit);
  });

  sim.onCommand<Record<string, never>, { until: Instant }>('health.drop', (_p, { sim: s }) => {
    const h = healthOf(s.player);
    const p = zonedParts(s.now, HOME);
    const until = firstOf(p.year, p.month + 1);
    const plan = [h.marketplace, h.program].find((r) => r && (r.until === undefined || r.until > s.now));
    if (!plan) throw new CommandError('You have no plan of your own to drop.');
    plan.until = until;
    // Dropped, it opens no special enrollment (`HealthRecord.lostAt`, from 2026-10-12).
    plan.ended = 'voluntary';
    return { until };
  });


  sim.onCommand<{ chain: string }, { chain: string }>('health.choose_pharmacy', (p, { sim: s }) => {
    const chain = US_PHARMACIES.find((c) => c.id === String(p?.chain));
    if (!chain) throw new CommandError('There’s no such pharmacy.');
    if (CITIES.get(homeOf(s.player))?.countryId !== 'us') throw new CommandError('A pharmacy’s own cash price is kept only in America.');
    healthOf(s.player).pharmacy = chain.id;
    return { chain: chain.id };
  });

  sim.onCommand<{ clinicId: string }, { clinicId: string }>('health.choose_clinic', (p, { sim: s }) => {
    const no = clinicRefusal(s.player, String(p?.clinicId), s.now);
    if (no) throw new CommandError(no);
    healthOf(s.player).clinicId = String(p.clinicId);
    return { clinicId: String(p.clinicId) };
  });

  sim.onCommand<{ condition: Condition; on: boolean }, { treated: boolean }>('health.treat', (p, { sim: s }) => {
    const state = healthOf(s.player).chronic?.[p.condition];
    if (!state) throw new CommandError('You don’t have that.');
    const was = state.treated;
    state.treated = p.on === true;
    // Switched on, the month's care is paid now, as the 1st would have; if it can't be, it's lapsed (from 2026-10-10:
    // until then switching it off and on cleared a lapse for nothing, and a month untreated on the 1st paid no care).
    if (state.treated && !was) {
      const cost = monthCareCost(s, s.player, p.condition, s.now, saveCurrency(s.universe));
      state.lapsed = cost > 0 && !payFromCurrent(s, s.player, cost, `Care for ${CONDITION_LABEL[p.condition].toLowerCase()}`, 'health');
    }
    return { treated: state.treated };
  });

  sim.onCommand<{ on: boolean }, { plan?: DentalPlan; until?: Instant }>('health.dental', (p, { sim: s }) => {
    const person = s.player;
    const h = healthOf(person);
    const cur = saveCurrency(s.universe);
    const now = h.dental && active(h.dental, s.now) ? h.dental : undefined;
    if (p.on !== true) {
      if (!now) throw new CommandError('You have no dental plan.');
      if (DENTAL_PLANS[now.plan].yearly) throw new CommandError('Yale’s dental plan can’t be canceled once paid.');
      const d = zonedParts(s.now, HOME);
      now.until = firstOf(d.year, d.month + 1);
      return { until: now.until };
    }
    if (now) throw new CommandError('You have a dental plan.');
    const plan = dentalPlanFor(person, s.now);
    if (!plan) throw new CommandError(BENEFIT_STATE[homeOf(person)] === 'ca' ? 'Covered California sells dental only beside its own health plan.' : 'SLATE sells a dental plan of your own in New York, beside a Covered California plan, and at Yale.');
    const d = DENTAL_PLANS[plan];
    const from = s.now;
    let until: Instant | undefined;
    if (d.yearly) {
      // Yale's plan year, 1 October to 30 September, paid for at once: bought in August or September, in its enrollment
      // weeks, it's the year that starts on 1 October, and otherwise it runs to the next 30 September. Until 2026-10-12
      // one bought in August or September ran to the coming 30 September, a few weeks for the year's price.
      const t = zonedParts(s.now, HOME);
      until = firstOf(t.month >= 8 ? t.year + 1 : t.year, 10);
      if (!payFromCurrent(s, person, usd(d.premium, cur), `${d.label}, the year`, 'health')) throw new CommandError(`The year is ${formatMoney(usd(d.premium, cur), cur)}, which the bank can’t cover.`);
    } else if (!payFromCurrent(s, person, usd(d.premium, cur), `${d.label} premium`, 'health')) {
      // A monthly plan's first month, paid as it starts covering (from 2026-10-06; until then its first premium came on
      // the 1st of the next month, and the days to it were covered and never paid for).
      throw new CommandError(`The month is ${formatMoney(usd(d.premium, cur), cur)}, which the bank can’t cover.`);
    }
    h.dental = { plan, from, ...(until ? { until } : {}), deductible: {}, paid: {} };
    armHealth(s, person);
    return { plan, ...(until ? { until } : {}) };
  });

  sim.onCommand<{ billId: string }, { aid: 'free' | 'discount' | 'refused'; amount: Money }>('health.apply_aid', (p, { sim: s }) => {
    const person = s.player;
    const bill = healthOf(person).bills.find((b) => b.id === p.billId);
    if (!bill) throw new CommandError('There’s no such bill.');
    const no = aidRefusal(bill, s.now);
    if (no) throw new CommandError(no);
    const r = incomeRatio(person, s.now, saveCurrency(s.universe));
    const ct = CHARITY.connecticut;
    bill.aid = r <= ct.freeTo ? 'free' : r <= ct.discountTo ? 'discount' : 'refused';
    if (bill.aid === 'free') { bill.amount = 0; bill.paid = true; }
    if (bill.aid === 'discount') bill.amount = Math.round(bill.amount * (1 - ct.discount));
    return { aid: bill.aid, amount: bill.amount };
  });

  sim.onCommand<{ amount: Money; fromId?: string }, { paid: Money }>('health.pay_bill', (p, { sim: s }) => {
    const person = s.player;
    const debt = medicalDebtOf(s, person);
    if (!debt || debt.balance >= 0) throw new CommandError('You owe nothing for care.');
    const amount = Math.min(Math.round(Number(p.amount)), -debt.balance);
    if (!(amount > 0)) throw new CommandError('Say how much.');
    // From the account named, any open current or savings account of theirs (from 2026-10-10: the primary alone until then).
    const named = p.fromId ? s.universe.accounts[String(p.fromId)] : undefined;
    const current = named && named.ownerId === person.id && !named.closedAt && (named.kind === 'checking' || named.kind === 'savings') ? named : person.primaryAccountId ? s.universe.accounts[person.primaryAccountId] : undefined;
    // An account named that can't pay it is refused, not swapped for the primary one (from 2026-10-13: until then their own
    // credit card named paid from the current account; found by the review of that day).
    if (p.fromId && current !== named) throw new CommandError(`${named?.name ?? 'That account'} can’t pay a medical debt.`);
    if (!current || current.balance < amount) throw new CommandError(`${current?.name ?? 'That account'} can’t cover it.`);
    s.post({ memo: 'Paid toward medical debt', category: 'health', postings: [{ accountId: current.id, amount: -amount }, { accountId: debt.id, amount }] });
    // The debt cleared, every bill that had gone to it is settled.
    if (debt.balance >= 0) {
      delete healthOf(person).debtSince;
      for (const b of healthOf(person).bills) if (b.inDebt) { b.paid = true; delete b.inDebt; }
    }
    return { paid: amount };
  });
}

/** A cover's name, for the screens. */
export const COVER_LABEL: Record<Cover, string> = {
  yale: 'Yale Health',
  medicaid: 'Medicaid', essential: 'Essential Plan', marketplace: 'Marketplace Plan',
};

/**
 * What covers them at a moment, by its name (from 2026-10-12): a program by its state's (`PROGRAM_NAMES`), HUSKY D
 * and Covered Connecticut in New Haven, Medi-Cal in Los Angeles; anything else by `COVER_LABEL`. Until then Your
 * Cover and Home's Papers line printed `COVER_LABEL` alone, which called Covered Connecticut the Essential Plan and
 * HUSKY D Medicaid, though every life lives in New Haven.
 */
export function coverLabel(person: Person, at: Instant): string | undefined {
  const cover = coverOn(person, at);
  const program = person.health?.program;
  if ((cover === 'medicaid' || cover === 'essential') && program) {
    const name = PROGRAM_NAMES[program.state][cover].replace(/^the /, '');
    return name.charAt(0).toUpperCase() + name.slice(1);
  }
  return cover ? COVER_LABEL[cover] : undefined;
}
