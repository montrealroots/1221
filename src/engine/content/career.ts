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
  /** Screen and stage work, or a voice session in a booth. */
  medium: 'screen' | 'stage' | 'voice';
  union: 'sag' | 'equity';
  /** Per day on screen, per week on stage, per episode for a series regular. */
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
  /**
   * What overtime is worked on: a day player's day rate over eight hours, or
   * a weekly performer's week over 44, where the week is five of the day
   * figures here, or, for a series regular, five-sixths of an hour episode's
   * fee and all of a half hour's. Stage work has none in SLATE.
   */
  basis?: 'day' | 'week' | 'episode';
  /** A series regular's season: the episodes guaranteed and the workweeks they're made in. */
  series?: { episodes: number; weeks: number };
  /** What earns residuals after it's made: a television episode of a length, or a film of a budget. */
  after?: { kind: 'tv'; length: 'half' | 'hour' } | { kind: 'film'; budget: Money } | { kind: 'commercial'; voice: boolean };
  /** A booth session's hours, for a voice part. */
  sessionHours?: number;
  /** Shot where the production goes, not always at home (`LOCATION`). */
  travels?: boolean;
  source: string;
}

const AMPTP = 'https://amptp.org/wp-content/themes/amptp/assets/pdf/SAG-AFTRA/2026-30%20SAG-AFTRA%20Rates_2026-05-27%204931-9242-3576%20v.4.pdf';
const SAGINDIE = 'https://www.sagindie.org/sagaftra/tv-theatrical-contract-2026/';
const LORT = 'https://cdn.actorsequity.org/pages/lort-documents/LORTRatification.pdf';
const BROADWAY = 'https://playbill.com/article/actors-equity-membership-officially-approves-new-production-contract';
const OFF_BROADWAY = 'Equity audition notices, July 2025 and July to September 2026 (broadwayworld.com, playbill.com)';
const COMMERCIALS = 'SAG-AFTRA 2025 Commercials Contracts rate sheets; https://deadline.com/2025/04/sag-aftra-commercials-contracts-deal-1236378468/';
const ANIMATION = 'Producer–SAG-AFTRA Television Animation Agreement rate sheet, 1 July 2025';
const GAMES = 'SAG-AFTRA 2025 Interactive Media Agreement';
const AUDIOBOOKS = 'ACX union rates; SAG-AFTRA audiobook agreements';
const VOICE: Partial<Craft> = { voice: 1, acting: 0.5, speech: 0.5 };
const BOTH: readonly CareerCity[] = ['us-ny-newyork', 'us-ca-losangeles'];
const SCREEN: Partial<Craft> = { acting: 1, screen: 1 };
const STAGE: Partial<Craft> = { acting: 1, voice: 0.5, text: 0.5, body: 0.3 };

/** The major role's flat price, per day over the days it's priced on. */
const perDay = (steps: RateSteps, days: number): RateSteps => steps.map(([from, cents]) => [from, Math.round(cents / days)] as const);

export const ROLES: readonly Role[] = [
  {
    id: 'costar', label: 'Co-Star, A Television Series', medium: 'screen', union: 'sag',
    steps: [['2025-07-01', 1_246_00], ['2026-07-01', 1_283_00], ['2027-07-01', 1_321_00], ['2028-07-01', 1_361_00], ['2029-07-01', 1_402_00]],
    units: [1, 2], bar: 60, weight: 10, tiers: [2, 3], selfSubmit: false, cities: BOTH, leadDays: 5, grows: SCREEN,
    basis: 'day', after: { kind: 'tv', length: 'hour' }, travels: true, source: AMPTP,
  },
  {
    id: 'guest-half', label: 'Guest Star, A Half-Hour Series', medium: 'screen', union: 'sag',
    steps: perDay([['2025-07-01', 6_853_00], ['2026-07-01', 7_057_00], ['2027-07-01', 7_266_00], ['2028-07-01', 7_486_00], ['2029-07-01', 7_711_00]], 5),
    units: [5, 5], bar: 68, weight: 4, tiers: [1, 2], selfSubmit: false, cities: ['us-ca-losangeles'], leadDays: 7, grows: SCREEN,
    basis: 'week', after: { kind: 'tv', length: 'half' }, travels: true, source: AMPTP,
  },
  {
    id: 'guest-hour', label: 'Guest Star, An Hour Series', medium: 'screen', union: 'sag',
    steps: perDay([['2025-07-01', 10_965_00], ['2026-07-01', 11_290_00], ['2027-07-01', 11_625_00], ['2028-07-01', 11_977_00], ['2029-07-01', 12_338_00]], 8),
    units: [8, 8], bar: 72, weight: 4, tiers: [1, 2], selfSubmit: false, cities: BOTH, leadDays: 7, grows: SCREEN,
    basis: 'week', after: { kind: 'tv', length: 'hour' }, travels: true, source: AMPTP,
  },
  {
    id: 'film-weekly', label: 'Supporting Role, A Studio Film', medium: 'screen', union: 'sag',
    steps: perDay([['2025-07-01', 4_326_00], ['2026-07-01', 4_456_00], ['2027-07-01', 4_590_00], ['2028-07-01', 4_728_00], ['2029-07-01', 4_870_00]], 5),
    units: [5, 15], bar: 76, weight: 2, tiers: [1], selfSubmit: false, cities: ['us-ca-losangeles'], leadDays: 21, grows: SCREEN,
    basis: 'week', after: { kind: 'film', budget: 60_000_000_00 }, travels: true, source: AMPTP,
  },
  {
    id: 'film-low', label: 'A Role, A Low Budget Film', medium: 'screen', union: 'sag',
    steps: [['2025-07-01', 810_00], ['2026-07-01', 834_00], ['2027-07-01', 859_00], ['2028-07-01', 885_00], ['2029-07-01', 911_00]],
    units: [3, 10], bar: 62, weight: 5, tiers: [2, 3], selfSubmit: false, cities: BOTH, leadDays: 14, grows: SCREEN,
    basis: 'day', after: { kind: 'film', budget: 1_350_000_00 }, travels: true, source: SAGINDIE,
  },
  {
    id: 'film-mlb', label: 'A Role, A Moderate Low Budget Film', medium: 'screen', union: 'sag',
    steps: [['2025-07-01', 436_00], ['2026-07-01', 449_00], ['2027-07-01', 462_00], ['2028-07-01', 476_00], ['2029-07-01', 491_00]],
    units: [3, 12], bar: 55, weight: 4, tiers: [3], selfSubmit: true, cities: BOTH, leadDays: 14, grows: SCREEN,
    basis: 'day', after: { kind: 'film', budget: 500_000_00 }, source: SAGINDIE,
  },
  {
    id: 'film-ulb', label: 'A Role, An Ultra Low Budget Film', medium: 'screen', union: 'sag',
    steps: [['2025-07-01', 249_00], ['2026-07-01', 257_00], ['2027-07-01', 264_00], ['2028-07-01', 272_00], ['2029-07-01', 280_00]],
    units: [3, 15], bar: 45, weight: 6, tiers: [3], selfSubmit: true, cities: BOTH, leadDays: 14, grows: SCREEN,
    basis: 'day', after: { kind: 'film', budget: 250_000_00 }, source: SAGINDIE,
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
  {
    // A commercial production in a house of 100 to 199 seats; $868 from the 2026–27 notices, changing late in July.
    id: 'offb-commercial', label: 'A Play Off-Broadway (Category A)', medium: 'stage', union: 'equity',
    steps: [['2026-07-27', 868_00]],
    units: [4, 9], rehearsalWeeks: [4, 5], bar: 62, weight: 3, tiers: [2, 3], selfSubmit: false, cities: ['us-ny-newyork'], leadDays: 28, grows: STAGE, source: OFF_BROADWAY,
  },
  {
    // A not-for-profit League theater's Category BB, the one the Signature, the Public and MCC were paying.
    id: 'offb-nonprofit', label: 'A Play Off-Broadway, A Nonprofit Theater', medium: 'stage', union: 'equity',
    steps: [['2025-07-28', 1_076_00], ['2026-07-27', 1_129_00]],
    units: [4, 9], rehearsalWeeks: [4, 5], bar: 66, weight: 3, tiers: [1, 2, 3], selfSubmit: false, cities: ['us-ny-newyork'], leadDays: 28, grows: STAGE, source: OFF_BROADWAY,
  },
  {
    id: 'series-half', label: 'Series Regular, A Half-Hour Series', medium: 'screen', union: 'sag',
    steps: [['2025-07-01', 4_326_00], ['2026-07-01', 4_456_00], ['2027-07-01', 4_590_00], ['2028-07-01', 4_728_00], ['2029-07-01', 4_870_00]],
    units: [13, 13], bar: 80, weight: 1, tiers: [1], selfSubmit: false, cities: ['us-ca-losangeles'], leadDays: 56, grows: SCREEN,
    basis: 'episode', series: { episodes: 13, weeks: 13 }, after: { kind: 'tv', length: 'half' }, travels: true, source: AMPTP,
  },
  {
    id: 'series-hour', label: 'Series Regular, An Hour Series', medium: 'screen', union: 'sag',
    steps: [['2025-07-01', 5_205_00], ['2026-07-01', 5_361_00], ['2027-07-01', 5_522_00], ['2028-07-01', 5_688_00], ['2029-07-01', 5_859_00]],
    units: [13, 13], bar: 82, weight: 1, tiers: [1], selfSubmit: false, cities: BOTH, leadDays: 56, grows: SCREEN,
    basis: 'episode', series: { episodes: 13, weeks: 16 }, after: { kind: 'tv', length: 'hour' }, travels: true, source: AMPTP,
  },
  {
    // The 2025 Commercials Contracts' session fee, $822.30 from 1 April 2025 and $855.20 from 1 April 2026; the third year isn't published.
    id: 'commercial', label: 'A Commercial, On Camera', medium: 'screen', union: 'sag',
    steps: [['2025-04-01', 822_30], ['2026-04-01', 855_20]],
    units: [1, 1], bar: 55, weight: 6, tiers: [1, 2, 3], selfSubmit: false, cities: BOTH, leadDays: 5, grows: SCREEN,
    basis: 'day', after: { kind: 'commercial', voice: false }, source: COMMERCIALS,
  },
  {
    id: 'commercial-vo', label: 'A Commercial, Voice-Over', medium: 'voice', union: 'sag',
    steps: [['2025-04-01', 618_30], ['2026-04-01', 643_00]],
    units: [1, 1], bar: 55, weight: 4, tiers: [1, 2, 3], selfSubmit: false, cities: BOTH, leadDays: 5, grows: VOICE,
    sessionHours: 2, after: { kind: 'commercial', voice: true }, source: COMMERCIALS,
  },
  {
    // A principal's session, up to three voices, from 1 July 2025; 2026's rate isn't published.
    id: 'animation', label: 'A Voice, An Animated Series', medium: 'voice', union: 'sag',
    steps: [['2025-07-01', 1_246_00]],
    units: [1, 3], bar: 65, weight: 2, tiers: [1, 2], selfSubmit: false, cities: ['us-ca-losangeles'], leadDays: 7, grows: VOICE,
    sessionHours: 4, source: ANIMATION,
  },
  {
    // The 2025 Interactive Media Agreement's four-hour session, up to three voices, from November 2025.
    id: 'game', label: 'A Voice, A Video Game', medium: 'voice', union: 'sag',
    steps: [['2025-11-01', 1_134_95]],
    units: [1, 4], bar: 58, weight: 3, tiers: [2, 3], selfSubmit: true, cities: BOTH, leadDays: 10, grows: VOICE,
    sessionHours: 4, source: GAMES,
  },
  {
    // ACX's union floor, $250 a finished hour with 14% of it the health and retirement contribution, so $219.30 to the narrator;
    // a six-hour booth day makes about 2.4 finished hours (two and a half booth hours to one), SLATE's estimate.
    id: 'audiobook', label: 'Narrating An Audiobook', medium: 'voice', union: 'sag',
    steps: [['2025-01-01', 526_32]],
    units: [3, 6], bar: 50, weight: 4, tiers: [3], selfSubmit: true, cities: BOTH, leadDays: 10, grows: VOICE,
    sessionHours: 6, source: AUDIOBOOKS,
  },
];

/**
 * A commercial's life after its shoot (`RESIDUALS`): a session fee
 * covers the first 13-week cycle, and each cycle it runs after pays again.
 * On a network, each airing, falling after the first ($783.10 on camera,
 * $588.90 by voice), to a cap a cycle; on cable, wild spots or streaming, a
 * flat fee. A cycle it doesn't run in pays the holding fee, the session fee,
 * to keep the performer. Twenty-four months at most. Network and cable
 * rates are frozen at 2022's through 2028; wild spots rose with the session
 * fee, to $2,184 and $1,638 in 2026. How many cycles and airings is SLATE's estimate: most
 * run two cycles or fewer.
 */
export const COMMERCIAL_USE = {
  classA: { camera: [783_10, 158_21, 125_51, 60_17], voice: [588_90, 123_81, 98_48, 44_74] },
  cap: { camera: 20_000_00, voice: 15_000_00 },
  cable: { camera: 4_100_00, voice: 3_075_00 },
  wild: { camera: 2_184_00, voice: 1_638_00 },
  cycleDays: 91,
  maxCycles: 8,
  source: 'SAG-AFTRA 2025 Commercials Contracts, rate sheets (web.archive.org copies of sagaftra.org)',
} as const;

/**
 * SLATE's estimates of a commercial's run: its cycles past the first (most
 * run two or fewer), where it airs, and how many times on a network.
 */
export const COMMERCIAL_RUN = { moreCycles: [0.45, 0.35, 0.2] as readonly number[], network: 0.4, cable: 0.3, uses: [13, 40] as const } as const;

/**
 * A series regular's later seasons. A deal runs up to seven seasons,
 * California's seven-year cap, about six in practice; the option is taken
 * or dropped by about mid-June. Freshman network series have been renewed
 * about three in four times (2022–26, tallied); streaming renewed 44% of all
 * its series in 2025. A season's pay rises about 4% a season, built into the
 * deal. A picked-up season begins about a year after the last began.
 */
export const SERIES = {
  maxSeasons: 7,
  renewal: { network: 0.75, svod: 0.44 },
  raise: 0.04,
  optionMonth: 6,
  optionDay: 15,
  nextSeasonDays: 364,
  source: 'SAG-AFTRA Television Agreement §24; 2023 and 2026 memoranda; Luminate 2025; California Labor Code §2855',
} as const;

/**
 * Working away. A screen job shoots where the production goes: by 2024's
 * series, a quarter in Los Angeles, a tenth in Georgia, 8% in New York, 3%
 * in Illinois (FilmLA), and the rest abroad or spread thin; SLATE sends a job
 * home two times in three, and otherwise to Atlanta, Chicago or New Orleans.
 * On location the production flies the actor out the day before and home the
 * day after, a travel day on a non-work day paid as a day, a room of their
 * own, and SAG-AFTRA's meal allowance, $75 a day ($80 from July 2028).
 */
export const LOCATION = {
  cities: [['us-ga-atlanta', 0.2], ['us-il-chicago', 0.07], ['us-la-neworleans', 0.07]] as readonly (readonly [string, number])[],
  perDiem: [['2025-07-01', 75_00], ['2028-07-01', 80_00]] as RateSteps,
  source: 'SAG-AFTRA Television Agreement §§ overnight location; 2026 memorandum; FilmLA 2024 production report',
} as const;

/**
 * SAG-AFTRA's overtime. A day player works eight hours on the day rate over
 * eight; the ninth and tenth are at time and a half and the eleventh on at
 * double, on a base no higher than twice the day minimum. A weekly performer
 * (a guest star's major role, a series regular) is paid double after ten
 * hours on the week over 44, and above $5,200 a week on no more than $236 an
 * hour ($261 from 1 July 2028). How long a shooting day runs, ten to twelve
 * hours, is SLATE's estimate.
 */
export const OVERTIME = {
  dayStraight: 8, dayHalfUntil: 10, dayBaseCap: 2,
  weekHours: 44, weekDoubleAfter: 10,
  moneyBreak: [['2026-07-01', 5_200_00, 236_00], ['2028-07-01', 5_750_00, 261_00]] as readonly (readonly [string, Money, Money])[],
  dayHours: [10, 12] as const,
  source: 'SAG-AFTRA Television Agreement §25; 2026 memorandum of agreement item 24.a (amptp.org)',
} as const;

/**
 * Residuals, as the SAG-AFTRA agreements set them (`systems/career.ts`).
 * A network prime-time rerun pays all of what the actor was paid for the
 * episode, up to $2,578 a half hour and $3,668 an hour, within 30 days; a
 * syndicated run pays a share of the part's minimum by the run. A high budget
 * streaming program pays nothing for its first 90 days, then each year the
 * pay up to a ceiling times the year's share and the service's size, 60 days
 * after the quarter; a program watched by a fifth of the service's
 * subscribers in its first 90 days also pays a success bonus, three-quarters
 * of a year's residual to the performers. A film's cast shares 3.6% of what
 * its distributor takes from television and streaming, by units: time (a day
 * a fifth, a week one, five at most) and salary (the same at scale).
 */
export const RESIDUALS = {
  networkCeiling: { half: 2_578_00, hour: 3_668_00 },
  syndication: [0, 0, 0.40, 0.30, 0.25, 0.25, 0.25, 0.15, 0.15, 0.15, 0.15, 0.10, 0.10] as readonly number[],
  syndicationLater: 0.05,
  svodYears: [0.45, 0.40, 0.35, 0.25, 0.20, 0.15, 0.10, 0.10, 0.10, 0.05, 0.05, 0.05] as readonly number[],
  svodLater: 0.015,
  svodSubscribers: { small: 0.65, middle: 1, large: 1.5 },
  svodCeiling: {
    half: [['2026-07-01', 3_206_00], ['2027-07-01', 3_286_00], ['2029-07-01', 3_368_00]] as RateSteps,
    hour: [['2026-07-01', 4_562_00], ['2027-07-01', 4_676_00], ['2029-07-01', 4_793_00]] as RateSteps,
  },
  /** A hit first seen from 1 July 2027 pays 110% of the year's residual, three-quarters of it to the performers. */
  successBonus: 1.1,
  successBonusShare: 0.75,
  filmPool: 0.036,
  source: 'SAG-AFTRA Television Agreement §18; 2023 and 2026 memoranda of agreement; Codified Basic Agreement §§5.1–5.2 (amptp.org)',
} as const;

/**
 * What SLATE estimates about where work goes after it's made, where nobody
 * publishes it: how a television episode is seen (four in ten on a network,
 * the rest streaming, mostly on the biggest services), how many get a prime-
 * time rerun or a syndication sale, how many a streaming hit, when an
 * episode airs, and what a film's distributor takes from television and
 * streaming (a quarter of its budget the first year, half as much each year
 * after) and how many units its whole cast holds.
 */
export const AFTERLIFE = {
  network: 0.4,
  svodSize: { small: 0.1, middle: 0.2 },
  rerun: 0.5,
  syndicated: 0.2,
  successBonus: 0.2,
  airsAfterDays: 90,
  rerunAfterDays: 180,
  filmFirstYear: 0.25,
  filmDecay: 0.5,
  castUnits: 40,
} as const;

/**
 * Managers, the firms in the trade press signing actors in 2026. Nothing caps
 * a manager's commission; the trade reckons 10% beside an agent and 15%
 * without one, and a first contract runs a year or more. What a showing must
 * be for each to offer, the audition a week a manager's relationships add,
 * and the chance a month that one finds an unrepresented client an agency
 * are SLATE's estimate.
 */
export interface Manager { id: string; name: string; bar: number }
export const MANAGERS: readonly Manager[] = [
  { id: 'brillstein', name: 'Brillstein Entertainment Partners', bar: 72 },
  { id: 'anonymous', name: 'Anonymous Content', bar: 72 },
  { id: '3arts', name: '3 Arts Entertainment', bar: 70 },
  { id: 'e360', name: 'Entertainment 360', bar: 68 },
  { id: 'untitled', name: 'Untitled Entertainment', bar: 66 },
  { id: 'luber-roklin', name: 'Luber Roklin Entertainment', bar: 62 },
];
export const MANAGEMENT = {
  withAgent: 0.10,
  alone: 0.15,
  minimumDays: 365,
  auditionsPerWeek: 1,
  findsAnAgency: 0.25,
  source: 'https://www.backstage.com/magazine/article/5-things-to-remember-before-signing-a-management-contract-73335/; https://deadline.com (2026 signings)',
} as const;

/**
 * The unions' health plans. SAG-AFTRA's: earnings in a twelve-month base
 * period ending each quarter at or over the threshold give twelve months'
 * cover from three months after, for a quarterly premium. Equity-League's:
 * ten weeks of Equity work in twelve months give six months' cover from two
 * months after, $300 a quarter for one person.
 */
export const UNION_HEALTH = {
  sagThreshold: [['2026-01-01', 28_090_00], ['2027-01-01', 28_933_00], ['2028-01-01', 29_801_00], ['2029-01-01', 30_695_00], ['2030-01-01', 31_616_00]] as RateSteps,
  sagPremium: [['2026-01-01', 375_00], ['2027-01-01', 390_00]] as RateSteps,
  equityWeeks: 10,
  equityMonths: 6,
  equityPremium: 300_00,
  source: 'https://www.sagaftraplans.org/health/eligibility/earned-eligibility; https://www.sagaftraplans.org/health/premiums; https://equityleague.org/health/health-plan-eligibility/; https://equityleague.org/health/premiums/',
} as const;

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
