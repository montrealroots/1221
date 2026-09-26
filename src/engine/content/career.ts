/**
 * SLATE — the acting business in the United States, as the unions, the
 * agencies and Yale publish it (`systems/career.ts`). Researched 2026-09-26;
 * each figure's source is beside it. Where a figure isn't published, the
 * line says it's SLATE's estimate.
 */

import type { Money } from '../core/money';
import type { Craft } from '../systems/school';

/** Where the business is: the two cities agencies, casting and the work are in. */
export const CAREER_CITIES = ['us-ny-newyork', 'us-ca-losangeles'] as const;
export type CareerCity = (typeof CAREER_CITIES)[number];

/**
 * The Actor Showcase (DRAM 793b): scenes shown to agents, managers and
 * casting directors in New York and then Los Angeles in the last term. Yale
 * held 2025's on 28–29 April in New York and 6 May in Los Angeles, and
 * 2026's on 27–28 April and 5 May; the class of 2029's are SLATE's estimate
 * by that pattern: the Monday of April's last full week, and the Tuesday a
 * week after.
 */
export const SHOWCASE_2029 = {
  newYork: { year: 2029, month: 4, day: 23 },
  losAngeles: { year: 2029, month: 5, day: 1 },
  estimate: true,
  source: 'https://www.drama.yale.edu/training/acting/actor-showcase/; https://www.drama.yale.edu/training/acting/actor-showcase-25/',
} as const;

/**
 * Agencies that represent Yale's actors, from Yale's own list (APA, Buchwald,
 * CAA, Gersh, ICM, WME, Paradigm, UTA) and its Office of Career Strategy's
 * (Gersh, Innovative Artists), as they stand in 2026: ICM is part of CAA, and
 * APA is Independent Artist Group. Each has offices in both cities. How high
 * a showing must be for each to offer, and how many auditions a week it gets
 * a new client, are SLATE's estimate; a newer actor's year of 97 to 201
 * auditions is two to four a week.
 */
export interface Agency {
  id: string;
  name: string;
  /** 1 reaches the most. */
  tier: 1 | 2 | 3;
  /** The showing it must see to offer. */
  bar: number;
  auditionsPerWeek: number;
}

export const AGENCIES: readonly Agency[] = [
  { id: 'caa', name: 'CAA', tier: 1, bar: 74, auditionsPerWeek: 3 },
  { id: 'wme', name: 'WME', tier: 1, bar: 74, auditionsPerWeek: 3 },
  { id: 'uta', name: 'UTA', tier: 1, bar: 73, auditionsPerWeek: 3 },
  { id: 'gersh', name: 'Gersh', tier: 2, bar: 68, auditionsPerWeek: 2.5 },
  { id: 'iag', name: 'Independent Artist Group', tier: 2, bar: 67, auditionsPerWeek: 2.5 },
  { id: 'paradigm', name: 'Paradigm', tier: 2, bar: 66, auditionsPerWeek: 2.5 },
  { id: 'innovative', name: 'Innovative Artists', tier: 3, bar: 62, auditionsPerWeek: 2 },
  { id: 'buchwald', name: 'Buchwald', tier: 3, bar: 60, auditionsPerWeek: 2 },
];
export const AGENCY_SOURCE = 'https://oir.yale.edu/sites/default/files/alum_activities_drama_1.pdf; https://ocs.yale.edu/resources/entertainment-talent-agency-management-company-list/';

/**
 * What an agency takes. SAG-AFTRA's franchised agents may take no more than
 * 10%, and on a job at scale only if the producer pays scale plus 10%, which
 * SLATE has every SAG-AFTRA job at scale pay. Equity's agents take 10%, and
 * 5% of a rehearsal week at the minimum.
 */
export const AGENT_COMMISSION = {
  rate: 0.10,
  equityRehearsalRate: 0.05,
  source: 'https://servicesagaftra.custhelp.com/app/answers/detail/a_id/704; https://actorsequity.org/resources/agency-information/agency-commission-schedule',
} as const;

/**
 * SAG-AFTRA's membership: the national initiation fee ($3,121, 2026), base
 * dues of $246.14 a year billed half each 1 May and 1 November, and work
 * dues of 1.575% of the prior year's covered earnings up to $1,000,000. A
 * performer's first job under a SAG-AFTRA contract makes them eligible to
 * join, and thirty days on they must join to work under one again.
 */
export const SAG_AFTRA = {
  initiation: 3_121_00,
  basicDues: 246_14,
  workDues: 0.01575,
  workDuesCap: 1_000_000_00,
  taftHartleyDays: 30,
  source: 'https://servicesagaftra.custhelp.com/app/answers/detail/a_id/607; https://servicesagaftra.custhelp.com/app/answers/detail/a_id/604',
} as const;

/**
 * Actors' Equity's membership: an $1,800 initiation fee over three years,
 * $600 when the application's accepted; basic dues of $176 a year, half each
 * May and November; and working dues of 2.5% of Equity earnings, taken from
 * each week's check. Since 2023's Open Access anybody paid for theater work
 * can join; SLATE has an actor join on their first Equity contract.
 */
export const EQUITY = {
  initiation: 1_800_00,
  initiationNow: 600_00,
  basicDues: 176_00,
  workingDues: 0.025,
  source: 'https://www.actorsequity.org/join/openaccess/; https://cdn.actorsequity.org/pages/magic/equity-membership.html',
} as const;

/** A rate from a day, in US cents: the contracts' steps. */
export type RateSteps = readonly (readonly [string, Money])[];

/** The rate in force on a day, `YYYY-MM-DD`: the latest step begun, or the first. Past a contract's last step, it holds. */
export function rateOn(steps: RateSteps, day: string): Money {
  let rate = steps[0]![1];
  for (const [from, cents] of steps) if (day >= from) rate = cents;
  return rate;
}

/**
 * A kind of part an actor is sent out for, with its contract's minimum. A
 * screen part pays by the day; a guest star's "major role" is priced on five
 * days for a half hour and eight for an hour, and paid here by the day over
 * them. A stage part pays by the week, rehearsal and performance alike.
 * Which parts each agency's reach sends a client to (`tiers`), how often
 * (`weight`), the craft each asks (`bar`), how long each runs and how far
 * ahead it starts are SLATE's estimate.
 */
export interface Role {
  id: string;
  label: string;
  medium: 'screen' | 'stage';
  union: 'sag' | 'equity';
  /** Per day on screen, per week on stage. */
  steps: RateSteps;
  /** Days on screen; on stage, rehearsal weeks, and weeks of performances. */
  units: readonly [number, number];
  rehearsalWeeks?: readonly [number, number];
  bar: number;
  weight: number;
  /** The agencies, by reach, that send clients to it: the biggest don't send theirs to the smallest work. */
  tiers: readonly (1 | 2 | 3)[];
  /** Open to an actor submitting themselves. */
  selfSubmit: boolean;
  cities: readonly CareerCity[];
  leadDays: number;
  grows: Partial<Craft>;
  source: string;
}

const AMPTP = 'https://amptp.org/wp-content/themes/amptp/assets/pdf/SAG-AFTRA/2026-30%20SAG-AFTRA%20Rates_2026-05-27%204931-9242-3576%20v.4.pdf';
const SAGINDIE = 'https://www.sagindie.org/sagaftra/tv-theatrical-contract-2026/';
const LORT = 'https://cdn.actorsequity.org/pages/lort-documents/LORTRatification.pdf';
const BROADWAY = 'https://playbill.com/article/actors-equity-membership-officially-approves-new-production-contract';
const BOTH: readonly CareerCity[] = ['us-ny-newyork', 'us-ca-losangeles'];
const SCREEN: Partial<Craft> = { acting: 1, screen: 1 };
const STAGE: Partial<Craft> = { acting: 1, voice: 0.5, text: 0.5, body: 0.3 };

/** The major role's flat price, per day over the days it's priced on. */
const perDay = (steps: RateSteps, days: number): RateSteps => steps.map(([from, cents]) => [from, Math.round(cents / days)] as const);

export const ROLES: readonly Role[] = [
  {
    id: 'costar', label: 'Co-Star, A Television Series', medium: 'screen', union: 'sag',
    steps: [['2025-07-01', 1_246_00], ['2026-07-01', 1_283_00], ['2027-07-01', 1_321_00], ['2028-07-01', 1_361_00], ['2029-07-01', 1_402_00]],
    units: [1, 2], bar: 60, weight: 10, tiers: [2, 3], selfSubmit: false, cities: BOTH, leadDays: 5, grows: SCREEN, source: AMPTP,
  },
  {
    id: 'guest-half', label: 'Guest Star, A Half-Hour Series', medium: 'screen', union: 'sag',
    steps: perDay([['2025-07-01', 6_853_00], ['2026-07-01', 7_057_00], ['2027-07-01', 7_266_00], ['2028-07-01', 7_486_00], ['2029-07-01', 7_711_00]], 5),
    units: [5, 5], bar: 68, weight: 4, tiers: [1, 2], selfSubmit: false, cities: ['us-ca-losangeles'], leadDays: 7, grows: SCREEN, source: AMPTP,
  },
  {
    id: 'guest-hour', label: 'Guest Star, An Hour Series', medium: 'screen', union: 'sag',
    steps: perDay([['2025-07-01', 10_965_00], ['2026-07-01', 11_290_00], ['2027-07-01', 11_625_00], ['2028-07-01', 11_977_00], ['2029-07-01', 12_338_00]], 8),
    units: [8, 8], bar: 72, weight: 4, tiers: [1, 2], selfSubmit: false, cities: BOTH, leadDays: 7, grows: SCREEN, source: AMPTP,
  },
  {
    id: 'film-weekly', label: 'Supporting Role, A Studio Film', medium: 'screen', union: 'sag',
    steps: perDay([['2025-07-01', 4_326_00], ['2026-07-01', 4_456_00], ['2027-07-01', 4_590_00], ['2028-07-01', 4_728_00], ['2029-07-01', 4_870_00]], 5),
    units: [5, 15], bar: 76, weight: 2, tiers: [1], selfSubmit: false, cities: ['us-ca-losangeles'], leadDays: 21, grows: SCREEN, source: AMPTP,
  },
  {
    id: 'film-low', label: 'A Role, A Low Budget Film', medium: 'screen', union: 'sag',
    steps: [['2025-07-01', 810_00], ['2026-07-01', 834_00], ['2027-07-01', 859_00], ['2028-07-01', 885_00], ['2029-07-01', 911_00]],
    units: [3, 10], bar: 62, weight: 5, tiers: [2, 3], selfSubmit: false, cities: BOTH, leadDays: 14, grows: SCREEN, source: SAGINDIE,
  },
  {
    id: 'film-mlb', label: 'A Role, A Moderate Low Budget Film', medium: 'screen', union: 'sag',
    steps: [['2025-07-01', 436_00], ['2026-07-01', 449_00], ['2027-07-01', 462_00], ['2028-07-01', 476_00], ['2029-07-01', 491_00]],
    units: [3, 12], bar: 55, weight: 4, tiers: [3], selfSubmit: true, cities: BOTH, leadDays: 14, grows: SCREEN, source: SAGINDIE,
  },
  {
    id: 'film-ulb', label: 'A Role, An Ultra Low Budget Film', medium: 'screen', union: 'sag',
    steps: [['2025-07-01', 249_00], ['2026-07-01', 257_00], ['2027-07-01', 264_00], ['2028-07-01', 272_00], ['2029-07-01', 280_00]],
    units: [3, 15], bar: 45, weight: 6, tiers: [3], selfSubmit: true, cities: BOTH, leadDays: 14, grows: SCREEN, source: SAGINDIE,
  },
  {
    id: 'lort-b', label: 'A Play, A LORT Theater (Category B)', medium: 'stage', union: 'equity',
    steps: [['2023-02-13', 1_058_00], ['2024-07-01', 1_100_00], ['2025-06-30', 1_144_00], ['2026-06-29', 1_213_00]],
    units: [3, 4], rehearsalWeeks: [4, 6], bar: 64, weight: 4, tiers: [2, 3], selfSubmit: false, cities: BOTH, leadDays: 28, grows: STAGE, source: LORT,
  },
  {
    id: 'lort-a-plus', label: 'A Play, A LORT Theater On Broadway', medium: 'stage', union: 'equity',
    steps: [['2023-02-13', 1_867_00], ['2024-07-01', 1_942_00], ['2025-06-30', 2_020_00], ['2025-12-29', 2_117_00], ['2026-06-29', 2_244_00]],
    units: [8, 10], rehearsalWeeks: [5, 6], bar: 74, weight: 2, tiers: [1, 2], selfSubmit: false, cities: ['us-ny-newyork'], leadDays: 35, grows: STAGE, source: LORT,
  },
  {
    id: 'broadway', label: 'A Play On Broadway', medium: 'stage', union: 'equity',
    // $2,799 from 28 September 2026 and $2,883 from 27 September 2027 are the contract's 3% a year on $2,717, worked out.
    steps: [['2025-09-28', 2_717_00], ['2026-09-28', 2_799_00], ['2027-09-27', 2_883_00]],
    units: [12, 20], rehearsalWeeks: [6, 8], bar: 80, weight: 1, tiers: [1, 2], selfSubmit: false, cities: ['us-ny-newyork'], leadDays: 42, grows: STAGE, source: BROADWAY,
  },
];

/**
 * Yale's cost of attendance grew, 2022–23 to 2026–27, 3.22% a year in
 * tuition, 8.10% in the Yale Health plan and 5.82% in living expenses
 * without it (the Bulletins, compounded). Later years aren't published, and
 * SLATE carries each on at its rate.
 */
export const YALE_COST_GROWTH = {
  tuition: 0.0322,
  healthPlan: 0.0810,
  living: 0.0582,
  source: 'https://bulletin.yale.edu/sites/default/files/david-geffen-school-of-drama-2022-2023.pdf through -2026-2027.pdf',
} as const;
