/**
 * SLATE — the acting business in the United States, as the unions, the
 * agencies and Yale publish it (`systems/career.ts`). Researched 2026-09-26;
 * each figure's source is beside it. Where a figure isn't published, the
 * line says it's SLATE's estimate.
 */

import type { Money } from '../core/money';
import type { Skill } from './school';
import type { Craft } from '../systems/school';
import { exchange } from './currency';

/**
 * Where the business is: the cities agencies, casting and the work are in.
 * London from 2026-09-29, for a British actor at home (`UK_ROLES`,
 * `UK_AGENCIES`); until then the business was American only, and a British
 * graduate without permission to work in the US had nowhere to work. Dublin
 * from the same day, for an Irish actor at home, its films at the published
 * agreement and the rest at SLATE's estimate (`IRELAND_SCALE`); and
 * Mexico City, at SLATE's estimate of its rates (`MEXICO_SCALE`). Toronto and
 * Vancouver from 2026-09-30, at the published agreements' own rates: ACTRA's
 * Independent Production Agreement in Toronto, the BC Master Production
 * Agreement in Vancouver, and the Canadian Theatre Agreement on stage in both.
 */
export const CAREER_CITIES = ['us-ny-newyork', 'us-ca-losangeles', 'uk-eng-london', 'ie-lei-dublin', 'mx-cmx-mexicocity', 'ca-on-toronto', 'ca-bc-vancouver'] as const;
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
  /** The country its clients work in; American where not said. */
  countryId?: string;
  /** Its commission, where it isn't `AGENT_COMMISSION.rate`. */
  commission?: number;
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
  // London (`UK_AGENCIES`): names checked against each agency's own site on
  // 2026-09-29 and tiered as the trade press ranks them. What a showing must
  // clear and the auditions a week are SLATE's estimates, by the American
  // tiers'. The Personal Managers' Association sets no commission and only
  // asks it agreed in writing; 12.5% is the middle of the 10% to 15% a
  // guide gives, SLATE's reading.
  { id: 'united-agents', name: 'United Agents', tier: 1, bar: 74, auditionsPerWeek: 3, countryId: 'uk', commission: 0.125 },
  { id: 'curtis-brown', name: 'Curtis Brown', tier: 1, bar: 74, auditionsPerWeek: 3, countryId: 'uk', commission: 0.125 },
  { id: 'independent-talent', name: 'Independent Talent Group', tier: 1, bar: 73, auditionsPerWeek: 3, countryId: 'uk', commission: 0.125 },
  { id: 'hamilton-hodell', name: 'Hamilton Hodell', tier: 2, bar: 68, auditionsPerWeek: 2.5, countryId: 'uk', commission: 0.125 },
  { id: 'conway-van-gelder-grant', name: 'Conway van Gelder Grant', tier: 2, bar: 67, auditionsPerWeek: 2.5, countryId: 'uk', commission: 0.125 },
  { id: 'tavistock-wood', name: 'Tavistock Wood', tier: 2, bar: 66, auditionsPerWeek: 2.5, countryId: 'uk', commission: 0.125 },
  { id: 'gordon-and-french', name: 'Gordon & French', tier: 3, bar: 62, auditionsPerWeek: 2, countryId: 'uk', commission: 0.125 },
  { id: 'scott-marshall', name: 'Scott Marshall Partners', tier: 3, bar: 61, auditionsPerWeek: 2, countryId: 'uk', commission: 0.125 },
  { id: 'lou-coulson', name: 'Lou Coulson Associates', tier: 3, bar: 60, auditionsPerWeek: 2, countryId: 'uk', commission: 0.125 },
  // Dublin: names checked against each agency's own site on 2026-09-29
  // (docs/research/world/research-ireland.json). None publishes its
  // commission; 12.5% is the middle of the 10% to 15% Irish guides give,
  // SLATE's reading, and the tiers, bars and auditions a week are SLATE's
  // estimates, by London's. Castaway is a co-operative its actors run.
  { id: 'lisa-richards', name: 'The Lisa Richards Agency', tier: 1, bar: 72, auditionsPerWeek: 2.5, countryId: 'ie', commission: 0.125 },
  { id: 'the-agency', name: 'The Agency', tier: 1, bar: 72, auditionsPerWeek: 2.5, countryId: 'ie', commission: 0.125 },
  { id: 'macfarlane-chard-ie', name: 'MacFarlane Chard Associates Ireland', tier: 2, bar: 66, auditionsPerWeek: 2, countryId: 'ie', commission: 0.125 },
  { id: 'first-call', name: 'First Call Management', tier: 2, bar: 65, auditionsPerWeek: 2, countryId: 'ie', commission: 0.125 },
  { id: 'morgan-the-agency', name: 'Morgan The Agency', tier: 3, bar: 60, auditionsPerWeek: 1.5, countryId: 'ie', commission: 0.125 },
  { id: 'castaway', name: 'Castaway Actors Agency', tier: 3, bar: 58, auditionsPerWeek: 1.5, countryId: 'ie', commission: 0.125 },
  // Mexico City: the four agencies checked on their own sites on
  // 2026-09-29. None publishes its commission, and the 10% a search gives is
  // Spain's; SLATE charges America's, its estimate. Tiers, bars and
  // auditions a week are SLATE's, by Dublin's.
  { id: 'talent-on-the-road', name: 'Talent On The Road', tier: 1, bar: 70, auditionsPerWeek: 2.5, countryId: 'mx' },
  { id: 'shoot-management', name: 'Shoot Management MX', tier: 2, bar: 64, auditionsPerWeek: 2, countryId: 'mx' },
  { id: 'look-management', name: 'LOOK Management', tier: 2, bar: 62, auditionsPerWeek: 2, countryId: 'mx' },
  { id: 'glenda-artist', name: 'Glenda Artist Management', tier: 3, bar: 58, auditionsPerWeek: 1.5, countryId: 'mx' },
  // Toronto and Vancouver, from 2026-09-30 (docs/research/world/research-canada-acting.json):
  // names from StageMilk's Toronto list (2019), the Vancouver Actors Guide's
  // directory and Lucas Talent's own site. Canadian agencies sign clients
  // across the country and put them on tape, so SLATE doesn't tie one to its
  // city. 15% is the commission ACTRA calls the industry's standard, on work
  // the agent procures; the GST on it isn't charged here. Tiers, bars and
  // auditions a week are SLATE's estimates, by London's, a little under for
  // a market that sells much of its work to American productions.
  { id: 'characters', name: 'The Characters Talent Agency', tier: 1, bar: 72, auditionsPerWeek: 3, countryId: 'ca', commission: 0.15 },
  { id: 'gga', name: 'GGA', tier: 1, bar: 72, auditionsPerWeek: 3, countryId: 'ca', commission: 0.15 },
  { id: 'lucas-talent', name: 'Lucas Talent', tier: 1, bar: 71, auditionsPerWeek: 3, countryId: 'ca', commission: 0.15 },
  { id: 'meridian-artists', name: 'Meridian Artists', tier: 2, bar: 66, auditionsPerWeek: 2.5, countryId: 'ca', commission: 0.15 },
  { id: 'ami-artist', name: 'AMI Artist Management', tier: 2, bar: 65, auditionsPerWeek: 2.5, countryId: 'ca', commission: 0.15 },
  { id: 'hero-artists', name: 'Hero Artists', tier: 2, bar: 65, auditionsPerWeek: 2.5, countryId: 'ca', commission: 0.15 },
  { id: 'connekt', name: 'Connekt Creative Agency', tier: 2, bar: 64, auditionsPerWeek: 2, countryId: 'ca', commission: 0.15 },
  { id: 'edna', name: 'Edna Talent Management', tier: 3, bar: 60, auditionsPerWeek: 2, countryId: 'ca', commission: 0.15 },
  { id: 'oldfield', name: 'Oldfield Talent Management', tier: 3, bar: 59, auditionsPerWeek: 2, countryId: 'ca', commission: 0.15 },
  { id: 'alpha-artist', name: 'Alpha Artist Management', tier: 3, bar: 58, auditionsPerWeek: 1.5, countryId: 'ca', commission: 0.15 },
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
/**
 * ACTRA's membership (actra.ca/join and ACTRA Toronto's apprentice program,
 * read 2026-09-30). An actor's first ACTRA engagement makes them an
 * apprentice, $75 and $75 a year after; three qualifying credits make them a
 * full member, for the $1,600 initiation fee less the apprentice fee paid.
 * A full member's basic dues are $195 a year, and working dues 2.25% of
 * gross earnings, taken from each check, the two together capped at $4,000
 * a year. In British Columbia the branch is UBCP/ACTRA, whose own fees
 * weren't read: SLATE charges ACTRA National's there too, its estimate. The
 * work permits a non-member pays per engagement weren't found, and aren't
 * charged; SLATE bills the basic dues half each May and November, as the
 * American unions', and the apprentice's renewal each May.
 */
export const ACTRA = {
  apprentice: 75_00,
  credits: 3,
  initiation: 1_600_00,
  basicDues: 195_00,
  workingDues: 0.0225,
  duesCap: 4_000_00,
  currency: 'CAD',
  /**
   * Under the IPA a performer short of full membership pays ACTRA's work
   * permit a week of the job: $260 on a principal part, $210 on an actor's,
   * and one who isn't Canadian $260 the first week and $175 after
   * (research-actra2.json, the IPA 2025–2027). The producer's 12.5% on a
   * non-member's fees is the producer's, and isn't the actor's to pay.
   */
  permitAfterFirstForeign: 175,
  /**
   * The producer's prepaid use: the IPA's "all uses" option, New Media
   * included, 110% of the fees on television and 135% on a feature, paid
   * with them and covering four years (B501); the BCMPA's the same, five
   * years on a series. Which option a producer takes isn't published: SLATE
   * reads the all-uses one, streaming being where the work is seen. After
   * it, performers share 3.6% of the distributor's gross through ACTRA PRS,
   * which no figure lets SLATE price, and it isn't paid.
   */
  prepaidTv: 1.1,
  prepaidFeature: 1.35,
  source: 'https://www.actra.ca/join/; https://actratoronto.com/apprentice-program/; the IPA 2025–2027 and the BCMPA 2025–2028',
} as const;

/** ANDA's dues, 15% of each payment through the union: 10% ordinary, 3.5% for retirement, 1.5% for welfare (laanda.org.mx, April 2019, the latest found). */
export const ANDA = { dues: 0.15, source: 'https://laanda.org.mx/la-voz-del-actor/beneficios-de-ser-parte-de-la-anda/' } as const;

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
/**
 * Parts for an actor sixty or older, as a share of the parts for one younger:
 * the share of speaking characters sixty or older against that age's share of
 * the US population (19.9%, the 2015 Census), over the same for everybody
 * younger. On film 10.7% of the speaking characters in the 100 top films of
 * 2016 were sixty or older; on television 9.4% across the most popular
 * Nielsen-rated series of 2016-17 (USC Annenberg with Humana). So a film's
 * parts for a sixty-year-old are (10.7/19.9) / (89.3/80.1) of a younger
 * actor's, 0.48, and a series' (9.4/19.9) / (90.6/80.1), 0.42. SLATE's
 * estimates: the stage and an on-camera commercial take the two's middle, no
 * count of their casts by age being published; a voice isn't seen, and its
 * parts aren't thinned; and past eighty the share holds, no count of the
 * very old on screen being published apart. Until 2026-09-28 an actor of
 * ninety was sent to as many parts as one of thirty.
 */
export const AGE_ON_SCREEN = {
  from: 60,
  film: (10.7 / 19.9) / ((100 - 10.7) / (100 - 19.9)),
  tv: (9.4 / 19.9) / ((100 - 9.4) / (100 - 19.9)),
  source: 'https://assets.uscannenberg.org/docs/still-rare-still-ridiculed.pdf (film, 2016); https://today.usc.edu/usc-annenberg-humana-studies-suggest-relationship-between-tv-age-bias-and-health-of-seniors/ (television, 2016-17)',
} as const;

/** The share of a part's kind open to an actor of an age (`AGE_ON_SCREEN`). */
export function partsForAge(role: Role, age: number): number {
  if (age < AGE_ON_SCREEN.from || role.medium === 'voice') return 1;
  if (role.after?.kind === 'film') return AGE_ON_SCREEN.film;
  if (role.after?.kind === 'tv') return AGE_ON_SCREEN.tv;
  return (AGE_ON_SCREEN.film + AGE_ON_SCREEN.tv) / 2;
}

export interface Role {
  id: string;
  label: string;
  /** Screen and stage work, or a voice session in a booth. */
  medium: 'screen' | 'stage' | 'voice';
  union: 'sag' | 'equity' | 'equity-uk' | 'irish-equity' | 'anda' | 'actra' | 'caea';
  /** Per day on screen, per week on stage, per episode for a series regular. */
  steps: RateSteps;
  /** The money its steps are written in; dollars where not said. */
  currency?: string;
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
  /** The skills a part is cast on and grows, by weight (`READS`). */
  reads: Partial<Craft>;
  /**
   * What overtime is worked on: a day player's day rate over eight hours, or
   * a weekly performer's week over 44, where the week is five of the day
   * figures here, or, for a series regular, five-sixths of an hour episode's
   * fee and all of a half hour's. Stage work has none in SLATE.
   */
  basis?: 'day' | 'week' | 'episode';
  /** A series regular's season: the episodes guaranteed and the workweeks they're made in. */
  series?: { episodes: number; weeks: number };
  /** A recurring arc: `units` are episodes, each a week's work. */
  arc?: boolean;
  /** What earns residuals after it's made: a television episode of a length, or a film of a budget. */
  after?: { kind: 'tv'; length: 'half' | 'hour' } | { kind: 'film'; budget: Money } | { kind: 'commercial'; voice: boolean };
  /** A booth session's hours, for a voice part. */
  sessionHours?: number;
  /**
   * Use paid with the fees, as a share of them (from later on 2026-09-30):
   * an ACTRA producer's prepaid use, or a Canadian commercial's first year
   * of television use, which a one-session job's share expresses exactly.
   */
  prepaid?: number;
  /** A non-member's ACTRA work permit a week of the job, in dollars: an apprentice pays it too (`ACTRA`). */
  permitWeekly?: number;
  /** Shot where the production goes, not always at home (`LOCATION`). */
  travels?: boolean;
  source: string;
}

const UK_TV = 'Pact/Equity TV Agreement rate card (casting directors’ guild mirror), 2024–2026 columns';
const UK_CINEMA = 'Pact/Equity Cinema Films Agreement rates, 6 April 2025 to 5 January 2026';
const UK_THEATRE = 'SOLT/Equity West End and UK Theatre/Equity agreements, 31 March 2025 to 5 April 2026';
const UK_RADIO = 'Equity’s BBC audio rates summary, July 2023';
const IE_FILM = 'Screen Producers Ireland and Irish Equity, Irish Film Agreement, from 1 February 2021';

/**
 * Mexico City's rates are SLATE's estimate, not ANDA's: ANDA keeps every
 * tabulador confidential (laanda.org.mx, "Tabuladores ANDA", 2026-09-29), and
 * no published figure prices a part there. Each is the American minimum for
 * the like part in 2026, scaled by what a Mexican worker earns against an
 * American: IMSS's average registered wage, MXN 662.80 a day at the end of
 * January 2026 (imss.gob.mx/prensa/archivo/202602/075), a year of it against
 * SSA's national average wage for 2024, $69,846.57, the latest published.
 * The two years apart make it a little high. It comes to about a fifth.
 */
export const MEXICO_SCALE = (exchange(662_80 * 365, 'MXN', 'USD') ?? 662_80 * 365 / 18) / 69_846_57;
const MX_EST = 'SLATE’s estimate: the American minimum for the like part, scaled by IMSS’s average wage against SSA’s (MEXICO_SCALE); ANDA’s tabuladores are confidential';
/** An American minimum in dollar cents, as SLATE's Mexico City rate in peso cents. */
const inMexico = (usd: Money): Money => Math.round((exchange(usd, 'USD', 'MXN') ?? usd * 18) * MEXICO_SCALE / 100) * 100;
const MX: readonly CareerCity[] = ['mx-cmx-mexicocity'];

/**
 * Dublin's television, theater and radio rates are SLATE's estimate too, from
 * 2026-09-29: Irish Equity's rate cards for them are for its members only.
 * Each is British Equity's minimum for the like part, scaled by what a worker
 * earns in Ireland against Britain: the CSO's average weekly earnings, €1,046.88
 * in the second quarter of 2026 (preliminary), against the ONS's £756 in July
 * 2026. It comes to a little over a sixth more, in euros.
 */
export const IRELAND_SCALE = 1_046_88 / (exchange(756_00, 'GBP', 'EUR') ?? 756_00 * 1.17);
const IE_EST = 'SLATE’s estimate: British Equity’s minimum for the like part, scaled by the CSO’s average weekly earnings against the ONS’s (IRELAND_SCALE); Irish Equity’s rates are members-only';
/** A British minimum in pence, as SLATE's Dublin rate in euro cents. */
const inIreland = (gbp: Money): Money => Math.round((exchange(gbp, 'GBP', 'EUR') ?? gbp * 1.17) * IRELAND_SCALE);
const IE: readonly CareerCity[] = ['ie-lei-dublin'];
const IPA = 'ACTRA/CMPA/AQPM Independent Production Agreement 2025–2027, the AQPM’s rate chart (aqpm.ca, January 2025)';
const BCMPA = 'UBCP/ACTRA BC Master Production Agreement 2025–2028 rate sheet (ubcpactra.ca, March 2025)';
const CTA = 'Canadian Theatre Agreement 2024–2027 minimum fee booklet, CAEA and PACT (caea.com)';
const NCA = 'ACTRA National Commercial Agreement rate chart, 1 June 2025 to 31 May 2026 (actra.ca)';
const TO: readonly CareerCity[] = ['ca-on-toronto'];
const VAN: readonly CareerCity[] = ['ca-bc-vancouver'];
const AMPTP = 'https://amptp.org/wp-content/themes/amptp/assets/pdf/SAG-AFTRA/2026-30%20SAG-AFTRA%20Rates_2026-05-27%204931-9242-3576%20v.4.pdf';
const SAGINDIE = 'https://www.sagindie.org/sagaftra/tv-theatrical-contract-2026/';
const LORT = 'https://cdn.actorsequity.org/pages/lort-documents/LORTRatification.pdf';
const BROADWAY = 'https://playbill.com/article/actors-equity-membership-officially-approves-new-production-contract';
const OFF_BROADWAY = 'Equity audition notices, July 2025 and July to September 2026 (broadwayworld.com, playbill.com)';
const COMMERCIALS = 'SAG-AFTRA 2025 Commercials Contracts rate sheets; https://deadline.com/2025/04/sag-aftra-commercials-contracts-deal-1236378468/';
const ANIMATION = 'Producer–SAG-AFTRA Television Animation Agreement rate sheet, 1 July 2025';
const GAMES = 'SAG-AFTRA 2025 Interactive Media Agreement';
const AUDIOBOOKS = 'ACX union rates; SAG-AFTRA audiobook agreements';
const BOTH: readonly CareerCity[] = ['us-ny-newyork', 'us-ca-losangeles'];

/**
 * What each kind of part is cast on, by weight, SLATE's estimate from how
 * the work is done. On screen: the scene, the camera, the character, the
 * feeling a close-up shows, and the script. On stage: the scene, a voice and
 * speech that carry, the character, the body and the script; at a regional
 * theater the classics too, and a fight in them. A commercial is cast on
 * camera and improvised in the room. In the booth: the microphone, the voice
 * and speech; animation its characters, improvised and funny; a game its
 * characters and their feeling; an audiobook every accent in it.
 */
export const READS = {
  screen: { scene: 2, screen: 2, character: 1, emotion: 1, script: 1 },
  stage: { scene: 2, voice: 1, speech: 1, character: 1, movement: 1, script: 1 },
  classical: { scene: 2, classical: 2, voice: 1, speech: 1, character: 1, movement: 1, script: 1, combat: 0.5 },
  commercial: { screen: 2, improv: 2, comedy: 1, scene: 1 },
  voice: { voiceover: 2, voice: 1, speech: 1 },
  animation: { voiceover: 2, voice: 1, character: 1, improv: 1, comedy: 1 },
  game: { voiceover: 2, voice: 1, character: 1, emotion: 1 },
  audiobook: { voiceover: 2, speech: 1, accents: 1, character: 1, script: 1 },
} as const satisfies Record<string, Partial<Craft>>;

/**
 * What a job's genre asks beside the part, SLATE's estimate: comedy its
 * timing and a clown's body, drama and horror the feeling, the musical
 * singing and dance, action a fight, romance its intimate scenes.
 */
export const GENRE_READS: Readonly<Record<string, Partial<Craft>>> = {
  comedy: { comedy: 2, clown: 0.5 },
  drama: { emotion: 1 },
  horror: { emotion: 1 },
  musical: { singing: 2, dance: 1 },
  action: { combat: 1 },
  romance: { intimacy: 1 },
};

/**
 * What a part itself may ask beside its genre, as a breakdown names it: a
 * song, a fight, a dance, an accent, an intimate scene. Each is drawn on its
 * own, by the medium: a stage part sings and fights more often, a screen
 * part asks for an accent and intimacy more. How often is SLATE's estimate;
 * casting services don't publish their breakdowns' tallies. Until
 * 2026-09-28 a drama that wanted a fight or a song asked for neither.
 */
export const PART_DEMANDS: Readonly<Record<'screen' | 'stage', readonly (readonly [Skill, number])[]>> = {
  screen: [['accents', 0.1], ['combat', 0.05], ['intimacy', 0.06], ['singing', 0.04], ['dance', 0.03]],
  stage: [['accents', 0.12], ['combat', 0.08], ['intimacy', 0.04], ['singing', 0.1], ['dance', 0.06]],
};

/**
 * The audition beside the part, SLATE's estimate: a fifth of the read. In a
 * room the sides can change, so cold reading counts beside the technique and
 * the lines learned; on tape, the technique and the lines; in the booth the
 * copy is read cold.
 */
export const AUDITION_READ = { share: 0.2 } as const;

/** Lines learned on every job but the booth's, where the script is on the stand; a series or a play most. */
export const MEMORIZE = { job: 0.3, long: 0.6 } as const;

/** The major role's flat price, per day over the days it's priced on. */
const perDay = (steps: RateSteps, days: number): RateSteps => steps.map(([from, cents]) => [from, Math.round(cents / days)] as const);

export const ROLES: readonly Role[] = [
  {
    id: 'costar', label: 'Co-Star, A Television Series', medium: 'screen', union: 'sag',
    steps: [['2025-07-01', 1_246_00], ['2026-07-01', 1_283_00], ['2027-07-01', 1_321_00], ['2028-07-01', 1_361_00], ['2029-07-01', 1_402_00]],
    units: [1, 2], bar: 60, weight: 10, tiers: [2, 3], selfSubmit: false, cities: BOTH, leadDays: 5, reads: READS.screen,
    basis: 'day', after: { kind: 'tv', length: 'hour' }, travels: true, source: AMPTP,
  },
  {
    id: 'guest-half', label: 'Guest Star, A Half-Hour Series', medium: 'screen', union: 'sag',
    steps: perDay([['2025-07-01', 6_853_00], ['2026-07-01', 7_057_00], ['2027-07-01', 7_266_00], ['2028-07-01', 7_486_00], ['2029-07-01', 7_711_00]], 5),
    units: [5, 5], bar: 68, weight: 4, tiers: [1, 2], selfSubmit: false, cities: ['us-ca-losangeles'], leadDays: 7, reads: READS.screen,
    basis: 'week', after: { kind: 'tv', length: 'half' }, travels: true, source: AMPTP,
  },
  {
    id: 'guest-hour', label: 'Guest Star, An Hour Series', medium: 'screen', union: 'sag',
    steps: perDay([['2025-07-01', 10_965_00], ['2026-07-01', 11_290_00], ['2027-07-01', 11_625_00], ['2028-07-01', 11_977_00], ['2029-07-01', 12_338_00]], 8),
    units: [8, 8], bar: 72, weight: 4, tiers: [1, 2], selfSubmit: false, cities: BOTH, leadDays: 7, reads: READS.screen,
    basis: 'week', after: { kind: 'tv', length: 'hour' }, travels: true, source: AMPTP,
  },
  {
    id: 'film-weekly', label: 'Supporting Role, A Studio Film', medium: 'screen', union: 'sag',
    steps: perDay([['2025-07-01', 4_326_00], ['2026-07-01', 4_456_00], ['2027-07-01', 4_590_00], ['2028-07-01', 4_728_00], ['2029-07-01', 4_870_00]], 5),
    units: [5, 15], bar: 76, weight: 2, tiers: [1], selfSubmit: false, cities: ['us-ca-losangeles'], leadDays: 21, reads: READS.screen,
    basis: 'week', after: { kind: 'film', budget: 60_000_000_00 }, travels: true, source: AMPTP,
  },
  {
    id: 'film-low', label: 'A Role, A Low Budget Film', medium: 'screen', union: 'sag',
    steps: [['2025-07-01', 810_00], ['2026-07-01', 834_00], ['2027-07-01', 859_00], ['2028-07-01', 885_00], ['2029-07-01', 911_00]],
    units: [3, 10], bar: 62, weight: 5, tiers: [2, 3], selfSubmit: false, cities: BOTH, leadDays: 14, reads: READS.screen,
    basis: 'day', after: { kind: 'film', budget: 1_350_000_00 }, travels: true, source: SAGINDIE,
  },
  {
    id: 'film-mlb', label: 'A Role, A Moderate Low Budget Film', medium: 'screen', union: 'sag',
    steps: [['2025-07-01', 436_00], ['2026-07-01', 449_00], ['2027-07-01', 462_00], ['2028-07-01', 476_00], ['2029-07-01', 491_00]],
    units: [3, 12], bar: 55, weight: 4, tiers: [3], selfSubmit: true, cities: BOTH, leadDays: 14, reads: READS.screen,
    basis: 'day', after: { kind: 'film', budget: 500_000_00 }, source: SAGINDIE,
  },
  {
    id: 'film-ulb', label: 'A Role, An Ultra Low Budget Film', medium: 'screen', union: 'sag',
    steps: [['2025-07-01', 249_00], ['2026-07-01', 257_00], ['2027-07-01', 264_00], ['2028-07-01', 272_00], ['2029-07-01', 280_00]],
    units: [3, 15], bar: 45, weight: 6, tiers: [3], selfSubmit: true, cities: BOTH, leadDays: 14, reads: READS.screen,
    basis: 'day', after: { kind: 'film', budget: 250_000_00 }, source: SAGINDIE,
  },
  {
    id: 'lort-b', label: 'A Play, A LORT Theater (Category B)', medium: 'stage', union: 'equity',
    steps: [['2023-02-13', 1_058_00], ['2024-07-01', 1_100_00], ['2025-06-30', 1_144_00], ['2026-06-29', 1_213_00]],
    units: [3, 4], rehearsalWeeks: [4, 6], bar: 64, weight: 4, tiers: [2, 3], selfSubmit: false, cities: BOTH, leadDays: 28, reads: READS.classical, source: LORT,
  },
  {
    id: 'lort-a-plus', label: 'A Play, A LORT Theater On Broadway', medium: 'stage', union: 'equity',
    steps: [['2023-02-13', 1_867_00], ['2024-07-01', 1_942_00], ['2025-06-30', 2_020_00], ['2025-12-29', 2_117_00], ['2026-06-29', 2_244_00]],
    units: [8, 10], rehearsalWeeks: [5, 6], bar: 74, weight: 2, tiers: [1, 2], selfSubmit: false, cities: ['us-ny-newyork'], leadDays: 35, reads: READS.classical, source: LORT,
  },
  {
    id: 'broadway', label: 'A Play On Broadway', medium: 'stage', union: 'equity',
    // $2,799 from 28 September 2026 and $2,883 from 27 September 2027 are the contract's 3% a year on $2,717, worked out.
    steps: [['2025-09-28', 2_717_00], ['2026-09-28', 2_799_00], ['2027-09-27', 2_883_00]],
    units: [12, 20], rehearsalWeeks: [6, 8], bar: 80, weight: 1, tiers: [1, 2], selfSubmit: false, cities: ['us-ny-newyork'], leadDays: 42, reads: READS.stage, source: BROADWAY,
  },
  {
    // A commercial production in a house of 100 to 199 seats; $868 from the 2026–27 notices, changing late in July.
    id: 'offb-commercial', label: 'A Play Off-Broadway (Category A)', medium: 'stage', union: 'equity',
    steps: [['2026-07-27', 868_00]],
    units: [4, 9], rehearsalWeeks: [4, 5], bar: 62, weight: 3, tiers: [2, 3], selfSubmit: false, cities: ['us-ny-newyork'], leadDays: 28, reads: READS.stage, source: OFF_BROADWAY,
  },
  {
    // A not-for-profit League theater's Category BB, the one the Signature, the Public and MCC were paying.
    id: 'offb-nonprofit', label: 'A Play Off-Broadway, A Nonprofit Theater', medium: 'stage', union: 'equity',
    steps: [['2025-07-28', 1_076_00], ['2026-07-27', 1_129_00]],
    units: [4, 9], rehearsalWeeks: [4, 5], bar: 66, weight: 3, tiers: [1, 2, 3], selfSubmit: false, cities: ['us-ny-newyork'], leadDays: 28, reads: READS.stage, source: OFF_BROADWAY,
  },
  {
    id: 'series-half', label: 'Series Regular, A Half-Hour Series', medium: 'screen', union: 'sag',
    steps: [['2025-07-01', 4_326_00], ['2026-07-01', 4_456_00], ['2027-07-01', 4_590_00], ['2028-07-01', 4_728_00], ['2029-07-01', 4_870_00]],
    units: [13, 13], bar: 80, weight: 1, tiers: [1], selfSubmit: false, cities: ['us-ca-losangeles'], leadDays: 56, reads: READS.screen,
    basis: 'episode', series: { episodes: 13, weeks: 13 }, after: { kind: 'tv', length: 'half' }, travels: true, source: AMPTP,
  },
  {
    id: 'series-hour', label: 'Series Regular, An Hour Series', medium: 'screen', union: 'sag',
    steps: [['2025-07-01', 5_205_00], ['2026-07-01', 5_361_00], ['2027-07-01', 5_522_00], ['2028-07-01', 5_688_00], ['2029-07-01', 5_859_00]],
    units: [13, 13], bar: 82, weight: 1, tiers: [1], selfSubmit: false, cities: BOTH, leadDays: 56, reads: READS.screen,
    basis: 'episode', series: { episodes: 13, weeks: 16 }, after: { kind: 'tv', length: 'hour' }, travels: true, source: AMPTP,
  },
  {
    // A recurring, not regular, role, engaged week to week at the weekly performer's rate, an episode a week.
    id: 'recurring', label: 'A Recurring Role, A Television Series', medium: 'screen', union: 'sag',
    steps: perDay([['2025-07-01', 4_326_00], ['2026-07-01', 4_456_00], ['2027-07-01', 4_590_00], ['2028-07-01', 4_728_00], ['2029-07-01', 4_870_00]], 5),
    units: [3, 9], arc: true, bar: 70, weight: 3, tiers: [1, 2], selfSubmit: false, cities: BOTH, leadDays: 14, reads: READS.screen,
    basis: 'week', after: { kind: 'tv', length: 'hour' }, travels: true, source: AMPTP,
  },
  {
    // The 2025 Commercials Contracts' session fee, $822.30 from 1 April 2025 and $855.20 from 1 April 2026; the third year's
    // rate sheet isn't out, and its fee is the contract's ratified 3% raise on the second's.
    id: 'commercial', label: 'A Commercial, On Camera', medium: 'screen', union: 'sag',
    steps: [['2025-04-01', 822_30], ['2026-04-01', 855_20], ['2027-04-01', 880_86]],
    units: [1, 1], bar: 55, weight: 6, tiers: [1, 2, 3], selfSubmit: false, cities: BOTH, leadDays: 5, reads: READS.commercial,
    basis: 'day', after: { kind: 'commercial', voice: false }, source: COMMERCIALS,
  },
  {
    id: 'commercial-vo', label: 'A Commercial, Voice-Over', medium: 'voice', union: 'sag',
    steps: [['2025-04-01', 618_30], ['2026-04-01', 643_00], ['2027-04-01', 662_29]],
    units: [1, 1], bar: 55, weight: 4, tiers: [1, 2, 3], selfSubmit: false, cities: BOTH, leadDays: 5, reads: READS.voice,
    sessionHours: 2, after: { kind: 'commercial', voice: true }, source: COMMERCIALS,
  },
  {
    // A principal's session, up to three voices, from 1 July 2025; 2026's rate isn't published.
    id: 'animation', label: 'A Voice, An Animated Series', medium: 'voice', union: 'sag',
    steps: [['2025-07-01', 1_246_00]],
    units: [1, 3], bar: 65, weight: 2, tiers: [1, 2], selfSubmit: false, cities: ['us-ca-losangeles'], leadDays: 7, reads: READS.animation,
    sessionHours: 4, source: ANIMATION,
  },
  {
    // The 2025 Interactive Media Agreement's four-hour session, up to three voices, from November 2025.
    id: 'game', label: 'A Voice, A Video Game', medium: 'voice', union: 'sag',
    steps: [['2025-11-01', 1_134_95]],
    units: [1, 4], bar: 58, weight: 3, tiers: [2, 3], selfSubmit: true, cities: BOTH, leadDays: 10, reads: READS.game,
    sessionHours: 4, source: GAMES,
  },
  {
    // ACX's union floor, $250 a finished hour with 14% of it the health and retirement contribution, so $219.30 to the narrator;
    // a six-hour booth day makes about 2.4 finished hours (two and a half booth hours to one), SLATE's estimate.
    id: 'audiobook', label: 'Narrating An Audiobook', medium: 'voice', union: 'sag',
    steps: [['2025-01-01', 526_32]],
    units: [3, 6], bar: 50, weight: 4, tiers: [3], selfSubmit: true, cities: BOTH, leadDays: 10, reads: READS.audiobook,
    sessionHours: 6, source: AUDIOBOOKS,
  },
  // Britain, from 2026-09-29: Equity's minimums in pounds, researched the same
  // day (docs/research/world/research-ukacting.json). The rates' dates are the
  // agreements'; a 2026 figure where none was published stands at its last.
  // No British residuals are kept. What a part asks (its bar, its weight,
  // the tiers that send clients, how long before it starts) are SLATE's
  // estimates by the American parts like them.
  {
    // Pact/Equity TV: the engagement fee, per episode, covering a day; £617 in 2025 and £596 in 2024.
    id: 'uk-tv', label: 'A Part, A British Television Series', medium: 'screen', union: 'equity-uk', currency: 'GBP',
    steps: [['2024-04-01', 596_00], ['2025-04-01', 617_00], ['2026-04-01', 635_50]],
    units: [1, 2], bar: 62, weight: 10, tiers: [1, 2, 3], selfSubmit: true, cities: ['uk-eng-london'], leadDays: 5, reads: READS.screen, basis: 'day', source: UK_TV,
  },
  {
    // Pact/Equity TV: the streaming service engagement fee.
    id: 'uk-streaming', label: 'A Part, A Series For A Streaming Service', medium: 'screen', union: 'equity-uk', currency: 'GBP',
    steps: [['2026-04-01', 848_00]],
    units: [2, 5], bar: 68, weight: 4, tiers: [1, 2], selfSubmit: false, cities: ['uk-eng-london'], leadDays: 7, reads: READS.screen, basis: 'day', source: UK_TV,
  },
  {
    // Pact/Equity cinema, £3m and over: £166 a day and the pre-bought uses, 280% more, from 6 April 2025.
    id: 'uk-film-major', label: 'A Role, A British Feature Film', medium: 'screen', union: 'equity-uk', currency: 'GBP',
    steps: [['2025-04-06', 630_80]],
    units: [5, 15], bar: 76, weight: 2, tiers: [1], selfSubmit: false, cities: ['uk-eng-london'], leadDays: 21, reads: READS.screen, basis: 'day', source: UK_CINEMA,
  },
  {
    // Pact/Equity cinema, £1m to £3m: 75% more for the uses.
    id: 'uk-film-low', label: 'A Role, A Low Budget British Film', medium: 'screen', union: 'equity-uk', currency: 'GBP',
    steps: [['2025-04-06', 290_50]],
    units: [3, 10], bar: 64, weight: 4, tiers: [2, 3], selfSubmit: false, cities: ['uk-eng-london'], leadDays: 14, reads: READS.screen, basis: 'day', source: UK_CINEMA,
  },
  {
    // Pact/Equity cinema, under £1m: 50% more for the uses.
    id: 'uk-film-verylow', label: 'A Role, A Very Low Budget British Film', medium: 'screen', union: 'equity-uk', currency: 'GBP',
    steps: [['2025-04-06', 249_00]],
    units: [3, 10], bar: 58, weight: 5, tiers: [2, 3], selfSubmit: true, cities: ['uk-eng-london'], leadDays: 14, reads: READS.screen, basis: 'day', source: UK_CINEMA,
  },
  {
    // SOLT/Equity West End, a theater of up to 799 seats, eight shows a week, 31 March 2025 to 5 April 2026.
    id: 'uk-west-end', label: 'A Play In The West End', medium: 'stage', union: 'equity-uk', currency: 'GBP',
    steps: [['2025-03-31', 745_57]],
    units: [10, 16], rehearsalWeeks: [4, 5], bar: 74, weight: 2, tiers: [1, 2], selfSubmit: false, cities: ['uk-eng-london'], leadDays: 35, reads: READS.stage, source: UK_THEATRE,
  },
  {
    // UK Theatre/Equity subsidized, the same at every grade.
    id: 'uk-subsidised', label: 'A Play, A Subsidized British Theater', medium: 'stage', union: 'equity-uk', currency: 'GBP',
    steps: [['2025-03-31', 547_29]],
    units: [4, 6], rehearsalWeeks: [3, 4], bar: 62, weight: 4, tiers: [2, 3], selfSubmit: true, cities: ['uk-eng-london'], leadDays: 28, reads: READS.classical, source: UK_THEATRE,
  },
  {
    // BBC radio drama: a full day, two broadcasts, from Equity's 2023 summary, the latest published.
    id: 'uk-radio', label: 'A Part, BBC Radio Drama', medium: 'voice', union: 'equity-uk', currency: 'GBP',
    steps: [['2023-07-01', 294_00]],
    units: [1, 1], bar: 60, weight: 3, tiers: [1, 2, 3], selfSubmit: false, cities: ['uk-eng-london'], leadDays: 7, reads: READS.voice ?? READS.screen, sessionHours: 8, source: UK_RADIO,
  },
  // Ireland, from 2026-09-29: the one performers' schedule Irish Equity
  // publishes, the 2021 film agreement with Screen Producers Ireland, which
  // runs on until replaced; no successor was found. A day is its €158 basic,
  // the use fee for the budget, and 8% holiday pay on the basic. Irish
  // Equity's television, theater and radio rates are for its members only,
  // so Dublin has no such parts in SLATE yet, and the cast's share of net
  // profits isn't kept. What a part asks is SLATE's estimate, by London's.
  {
    // A film of €2.5 million and over, the use fee 280% of the basic: the Irish features and the productions that come to shoot there.
    id: 'ie-film-major', label: 'A Role, An Irish Feature Film', medium: 'screen', union: 'irish-equity', currency: 'EUR',
    steps: [['2021-02-01', 613_00]],
    units: [5, 15], bar: 74, weight: 3, tiers: [1, 2], selfSubmit: false, cities: ['ie-lei-dublin'], leadDays: 21, reads: READS.screen, basis: 'day', source: IE_FILM,
  },
  {
    // Over €1.25 million and up to €2.5 million: the use fee 75%.
    id: 'ie-film-low', label: 'A Role, A Low Budget Irish Film', medium: 'screen', union: 'irish-equity', currency: 'EUR',
    steps: [['2021-02-01', 289_00]],
    units: [3, 10], bar: 64, weight: 4, tiers: [2, 3], selfSubmit: false, cities: ['ie-lei-dublin'], leadDays: 14, reads: READS.screen, basis: 'day', source: IE_FILM,
  },
  {
    // €1.25 million and under: the use fee 50%.
    id: 'ie-film-verylow', label: 'A Role, A Very Low Budget Irish Film', medium: 'screen', union: 'irish-equity', currency: 'EUR',
    steps: [['2021-02-01', 250_00]],
    units: [3, 10], bar: 58, weight: 5, tiers: [2, 3], selfSubmit: true, cities: ['ie-lei-dublin'], leadDays: 14, reads: READS.screen, basis: 'day', source: IE_FILM,
  },
  // Dublin's television, theater and radio, from 2026-09-29, each SLATE's estimate (`IRELAND_SCALE`) from the British part beside it.
  {
    // By Pact/Equity TV's episode fee, £635.50 from April 2026: RTÉ's and the streamers' Irish drama.
    id: 'ie-tv', label: 'A Part, An Irish Television Series', medium: 'screen', union: 'irish-equity', currency: 'EUR',
    steps: [['2026-04-01', inIreland(635_50)]],
    units: [1, 2], bar: 62, weight: 8, tiers: [1, 2, 3], selfSubmit: true, cities: IE, leadDays: 5, reads: READS.screen, basis: 'day', source: IE_EST,
  },
  {
    // By UK Theatre/Equity's subsidized minimum, £547.29 a week: the Abbey, the Gate and the companies that tour.
    id: 'ie-theater', label: 'A Play, An Irish Theater', medium: 'stage', union: 'irish-equity', currency: 'EUR',
    steps: [['2025-03-31', inIreland(547_29)]],
    units: [4, 6], rehearsalWeeks: [3, 4], bar: 62, weight: 4, tiers: [2, 3], selfSubmit: true, cities: IE, leadDays: 28, reads: READS.classical, source: IE_EST,
  },
  {
    // By BBC radio drama's day, £294: RTÉ's radio drama.
    id: 'ie-radio', label: 'A Part, RTÉ Radio Drama', medium: 'voice', union: 'irish-equity', currency: 'EUR',
    steps: [['2023-07-01', inIreland(294_00)]],
    units: [1, 1], bar: 60, weight: 2, tiers: [1, 2, 3], selfSubmit: false, cities: IE, leadDays: 7, reads: READS.voice ?? READS.screen, sessionHours: 8, source: IE_EST,
  },
  // Mexico City, from 2026-09-29, each rate SLATE's estimate (`MEXICO_SCALE`)
  // from the American part named beside it. What a part asks is SLATE's
  // estimate too. It's the dubbing capital of Spanish-speaking America, and
  // the telenovela its daily work.
  {
    // By a television co-star's day, $1,283 from July 2026.
    id: 'mx-telenovela', label: 'A Part, A Telenovela', medium: 'screen', union: 'anda', currency: 'MXN',
    steps: [['2026-07-01', inMexico(1_283_00)]],
    units: [1, 3], bar: 58, weight: 10, tiers: [1, 2, 3], selfSubmit: true, cities: MX, leadDays: 5, reads: READS.screen, basis: 'day', source: MX_EST,
  },
  {
    // By the same day.
    id: 'mx-streaming', label: 'A Part, A Series For A Streaming Service', medium: 'screen', union: 'anda', currency: 'MXN',
    steps: [['2026-07-01', inMexico(1_283_00)]],
    units: [2, 5], bar: 66, weight: 5, tiers: [1, 2], selfSubmit: false, cities: MX, leadDays: 7, reads: READS.screen, basis: 'day', source: MX_EST,
  },
  {
    // By a low budget film's day, $834.
    id: 'mx-film', label: 'A Role, A Mexican Feature Film', medium: 'screen', union: 'anda', currency: 'MXN',
    steps: [['2026-07-01', inMexico(834_00)]],
    units: [3, 10], bar: 62, weight: 4, tiers: [1, 2, 3], selfSubmit: false, cities: MX, leadDays: 14, reads: READS.screen, basis: 'day', source: MX_EST,
  },
  {
    // By an Off-Broadway week, $868.
    id: 'mx-theater', label: 'A Play In Mexico City', medium: 'stage', union: 'anda', currency: 'MXN',
    steps: [['2026-07-27', inMexico(868_00)]],
    units: [4, 9], rehearsalWeeks: [3, 4], bar: 60, weight: 3, tiers: [2, 3], selfSubmit: true, cities: MX, leadDays: 28, reads: READS.stage, source: MX_EST,
  },
  {
    // By an animated voice's session, $1,246.
    id: 'mx-dubbing', label: 'Dubbing, A Session', medium: 'voice', union: 'anda', currency: 'MXN',
    steps: [['2026-07-01', inMexico(1_246_00)]],
    units: [1, 3], bar: 58, weight: 6, tiers: [1, 2, 3], selfSubmit: false, cities: MX, leadDays: 5, reads: READS.voice, sessionHours: 4, source: MX_EST,
  },
  {
    // By a commercial's session, $855.20.
    id: 'mx-commercial', label: 'A Commercial, On Camera', medium: 'screen', union: 'anda', currency: 'MXN',
    steps: [['2026-04-01', inMexico(855_20)]],
    units: [1, 1], bar: 55, weight: 5, tiers: [1, 2, 3], selfSubmit: false, cities: MX, leadDays: 5, reads: READS.commercial, source: MX_EST,
  },
  // Toronto, from 2026-09-30, at the IPA's own rates. The agreement took
  // effect on 26 January 2025 and rose 4% in 2026 and 3.5% in 2027; the page
  // read didn't say on which day, and SLATE starts each on 1 January. A
  // principal performer's day, an actor's (the IPA's lesser category, for a
  // part of few lines), and a principal's week on a feature. ACTRA's use fees
  // and residuals, its commercial agreement and voice work weren't read, and
  // SLATE pays none of them yet.
  {
    id: 'ca-principal', label: 'A Principal Part, A Canadian Series', medium: 'screen', union: 'actra', currency: 'CAD',
    steps: [['2025-01-26', 935_25], ['2026-01-01', 972_75], ['2027-01-01', 1_006_75]],
    units: [1, 3], bar: 60, weight: 10, tiers: [1, 2, 3], selfSubmit: false, cities: TO, leadDays: 5, reads: READS.screen, basis: 'day', prepaid: ACTRA.prepaidTv, permitWeekly: 260, source: IPA,
  },
  {
    id: 'ca-actor', label: 'A Small Part, A Canadian Series', medium: 'screen', union: 'actra', currency: 'CAD',
    steps: [['2025-01-26', 631_25], ['2026-01-01', 656_50], ['2027-01-01', 679_50]],
    units: [1, 2], bar: 52, weight: 8, tiers: [2, 3], selfSubmit: true, cities: TO, leadDays: 4, reads: READS.screen, basis: 'day', prepaid: ACTRA.prepaidTv, permitWeekly: 210, source: IPA,
  },
  {
    id: 'ca-feature', label: 'A Role, A Canadian Feature Film', medium: 'screen', union: 'actra', currency: 'CAD',
    // A fifth of the principal's week, $3,974.50, $4,133.50 and $4,278.25.
    steps: [['2025-01-26', 794_90], ['2026-01-01', 826_70], ['2027-01-01', 855_65]],
    units: [5, 15], bar: 64, weight: 4, tiers: [1, 2, 3], selfSubmit: false, cities: TO, leadDays: 14, reads: READS.screen, basis: 'week', prepaid: ACTRA.prepaidFeature, permitWeekly: 260, source: IPA,
  },
  // Vancouver, at the BCMPA's own rates, each from its published day.
  {
    id: 'bc-principal', label: 'A Principal Part, A Series Shot In Vancouver', medium: 'screen', union: 'actra', currency: 'CAD',
    steps: [['2024-03-31', 869_85], ['2025-03-30', 917_69], ['2026-03-29', 954_40], ['2027-04-04', 987_80]],
    units: [1, 3], bar: 60, weight: 12, tiers: [1, 2, 3], selfSubmit: false, cities: VAN, leadDays: 5, reads: READS.screen, basis: 'day', prepaid: ACTRA.prepaidTv, permitWeekly: 260, source: BCMPA,
  },
  {
    id: 'bc-actor', label: 'A Small Part, A Series Shot In Vancouver', medium: 'screen', union: 'actra', currency: 'CAD',
    steps: [['2024-03-31', 585_43], ['2025-03-30', 617_63], ['2026-03-29', 642_34], ['2027-04-04', 664_82]],
    units: [1, 2], bar: 52, weight: 8, tiers: [2, 3], selfSubmit: true, cities: VAN, leadDays: 4, reads: READS.screen, basis: 'day', prepaid: ACTRA.prepaidTv, permitWeekly: 210, source: BCMPA,
  },
  {
    id: 'bc-feature', label: 'A Role, A Feature Shot In Vancouver', medium: 'screen', union: 'actra', currency: 'CAD',
    steps: [['2024-03-31', 869_85], ['2025-03-30', 917_69], ['2026-03-29', 954_40], ['2027-04-04', 987_80]],
    units: [3, 12], bar: 64, weight: 3, tiers: [1, 2, 3], selfSubmit: false, cities: VAN, leadDays: 14, reads: READS.screen, basis: 'day', prepaid: ACTRA.prepaidFeature, permitWeekly: 260, source: BCMPA,
  },
  // The Canadian Theatre Agreement's weekly minimum for an actor at a
  // Category A theater, its seasons from late June. Which of Toronto's and
  // Vancouver's companies sit in Category A the booklet doesn't say: SLATE's
  // reading, for the houses a working actor auditions for.
  // A commercial under the National Commercial Agreement, from later on
  // 2026-09-30: its last published chart, 1 June 2025 to 31 May 2026, a
  // principal's session on camera $939.50 and by voice $685, and a year of
  // national television use at the chart's least, $743.30 and $363.75, SLATE
  // reading one year's television run. A non-member's NCA permit isn't kept.
  {
    id: 'ca-commercial', label: 'A Commercial, On Camera', medium: 'screen', union: 'actra', currency: 'CAD',
    steps: [['2025-06-01', 939_50]],
    units: [1, 1], bar: 55, weight: 5, tiers: [1, 2, 3], selfSubmit: false, cities: [...TO, ...VAN], leadDays: 5, reads: READS.commercial, prepaid: 743.3 / 939.5, source: NCA,
  },
  {
    id: 'ca-commercial-voice', label: 'A Commercial, The Voice', medium: 'voice', union: 'actra', currency: 'CAD',
    steps: [['2025-06-01', 685_00]],
    units: [1, 1], bar: 55, weight: 3, tiers: [1, 2, 3], selfSubmit: false, cities: [...TO, ...VAN], leadDays: 5, reads: READS.voice ?? READS.commercial, sessionHours: 2, prepaid: 363.75 / 685, source: NCA,
  },
  // Animation of more than ten minutes under the IPA, 2026: a principal's day, $681.75.
  {
    id: 'ca-animation', label: 'A Voice, An Animated Series', medium: 'voice', union: 'actra', currency: 'CAD',
    steps: [['2026-01-01', 681_75]],
    units: [1, 3], bar: 62, weight: 2, tiers: [1, 2], selfSubmit: false, cities: [...TO, ...VAN], leadDays: 7, reads: READS.animation, sessionHours: 4, prepaid: ACTRA.prepaidTv, permitWeekly: 260, source: IPA,
  },
  {
    id: 'ca-theater', label: 'A Play, A Category A Theater', medium: 'stage', union: 'caea', currency: 'CAD',
    steps: [['2024-06-24', 1_255_25], ['2025-06-23', 1_293_00], ['2026-06-22', 1_332_00]],
    units: [3, 6], rehearsalWeeks: [3, 4], bar: 62, weight: 3, tiers: [1, 2, 3], selfSubmit: true, cities: [...TO, ...VAN], leadDays: 28, reads: READS.stage, source: CTA,
  },
];

/**
 * The 2026 agreement's 60% rule: a weekly performer engaged on at least 60%
 * of a season's episodes is paid 120% of scale for the episodes beyond it,
 * for seasons whose first episode begins photography on or after 1 January
 * 2027. A season's thirteen episodes are SLATE's estimate.
 */
export const RECURRING = { seasonEpisodes: 13, share: 0.6, uplift: 1.2, from: '2027-01-01', source: '2026 SAG-AFTRA TV/Theatrical memorandum of agreement, §30.a (amptp.org)' } as const;

/**
 * What a call's hour costs in stress, SLATE's estimate: a call before nine in
 * the morning and a performance that runs past nine at night each 2, before
 * a night owl's or an early riser's trait bends it.
 */
export const CALLS = { early: 2, earlyBefore: 9, late: 2 } as const;

/**
 * What a commercial sells, by roughly each category's share of US television
 * advertising (automotive, retail, food and drink, pharmaceuticals,
 * insurance and finance, telecoms and tech, restaurants, fashion, travel and
 * the outdoors, pets), and political advertising, which SAG-AFTRA's
 * commercials contracts cover too and which comes in the autumn of an
 * election year at three times its share. The shares are SLATE's estimate
 * from what the ad-spend trackers publish in outline.
 */
export const PRODUCTS: readonly (readonly [string, string, number])[] = [
  ['automotive', 'A Car Brand', 0.14], ['retail', 'A Retailer', 0.12], ['food', 'A Food And Drink Brand', 0.14],
  ['pharma', 'A Drug Maker', 0.12], ['finance', 'An Insurer Or A Bank', 0.12], ['telecom', 'A Phone Or Tech Company', 0.1],
  ['restaurants', 'A Restaurant Chain', 0.08], ['fashion', 'A Fashion Brand', 0.05], ['outdoors', 'A Travel Or Outdoors Brand', 0.05],
  ['pets', 'A Pet Brand', 0.03], ['political', 'A Political Campaign', 0.05],
];
/** Which interest a commercial's product speaks to, where one does. */
export const PRODUCT_INTEREST: Readonly<Record<string, string>> = { automotive: 'cars', fashion: 'fashion', outdoors: 'nature', pets: 'animals', political: 'politics' };

/**
 * What a job is filed under, SLATE's estimate by what gets made: on screen
 * mostly drama and comedy, then crime, thriller, mystery, horror, romance,
 * action and science fiction; on stage drama, comedy and the musical;
 * animation animated. Commercials, games and audiobooks have none.
 */
export const GENRES: Readonly<Record<'screen' | 'stage' | 'animation', readonly (readonly [string, number])[]>> = {
  screen: [['drama', 0.3], ['comedy', 0.25], ['crime', 0.1], ['thriller', 0.08], ['mystery', 0.06], ['horror', 0.06], ['romance', 0.05], ['action', 0.05], ['science_fiction', 0.05]],
  stage: [['drama', 0.45], ['comedy', 0.3], ['musical', 0.25]],
  animation: [['animated', 1]],
};

/**
 * What an actor's work costs them, 2025–26 prices. Actors Access PLUS,
 * $68 a year, sends a headshot with a submission where the free tier sends
 * a name and a résumé, and the reel where there is one; Backstage, about
 * $200 a year, and Casting Networks Premium, $299.90, have their own
 * listings, Casting Networks' mostly in Los Angeles. A reel is cut from
 * footage an actor has, which takes a screen credit, for about $250 ($150
 * to $400). Casting sites let a casting director ask for one; SLATE's
 * estimate is that four in ten breakdowns do, and a submission without one
 * doesn't reach them. Headshots, about $700 a session and $115 for a hundred prints,
 * redone every year or two; a self-tape kit about $110; an ongoing
 * scene-study class about $300 a month; a private coach about $150 an hour.
 * What each does is SLATE's estimate: a free submission is seen half as
 * often, Backstage's listings take five more submissions a week, headshots
 * more than two years old cost a fifth of auditions and callbacks, a tape
 * without a kit reads a fifth worse, a week's class grows craft as a class
 * at school does, and a coached audition books a quarter more often. All of
 * it is a job expense New York and California let an actor deduct. The kit
 * and the prints are goods, and the sales tax where they're bought is on
 * top (`content/tax.ts`).
 */
export const WORK_COSTS = {
  sites: {
    'actors-access': { label: 'Actors Access PLUS', price: 68_00 },
    backstage: { label: 'Backstage', price: 199_92 },
    'casting-networks': { label: 'Casting Networks Premium', price: 299_90 },
    // Britain's: £210 a year with VAT (£175 before it), the performer's membership (spotlight.com, 2026-09-29).
    spotlight: { label: 'Spotlight', price: 210_00, currency: 'GBP', countryId: 'uk' },
    // Ireland's: €196.50 a year and 23% VAT (spotlight.com/join-us/ireland, 2026-09-29).
    'spotlight-ie': { label: 'Spotlight Ireland', price: 241_70, currency: 'EUR', countryId: 'ie' },
    // Canada's: PRO at $12.99 a month, a year of it here, in Canadian dollars, which the page doesn't say (home.castingworkbook.com, 2026-09-30).
    'casting-workbook': { label: 'Casting Workbook PRO', price: 155_88, currency: 'CAD', countryId: 'ca' },
  },
  reel: 250_00,
  wantReel: 0.4,
  castingNetworksSubmissions: { 'us-ca-losangeles': 5, other: 2 },
  headshots: 815_00,
  /** Of the headshots, the hundred prints: goods, which a state's sales tax takes, as it does the kit. */
  prints: 115_00,
  headshotsLastDays: 730,
  kit: 110_00,
  classMonthly: 300_00,
  coach: 150_00,
  /**
   * Building yourself (`systems/attributes.ts`): an eight-week improv course
   * of three-hour evenings, UCB's Improv 101 and the Groundlings' Basic
   * running near it; a casting director workshop, an evening's cold reading
   * for one office, as One on One and Actors Connection hold them; a
   * publicist's monthly retainer, the $2,000 to $5,000 the trade quotes for
   * an actor. Each price is SLATE's estimate of the range.
   */
  improv: 495_00,
  improvWeeks: 8,
  workshop: 60_00,
  publicistMonthly: 3_000_00,
  freeSubmissionShare: 0.5,
  backstageSubmissions: 5,
  staleHeadshots: 0.8,
  noKit: 0.8,
  coached: 1.25,
  source: 'https://actorsaccess.com; https://www.backstage.com; https://www.castingnetworks.com/pricing (Premium, 2026); https://ivanachubbuck.com; https://www.hbstudio.org; https://www.tschreiber.org; https://oneononenyc.com; https://ucbcomedy.com (Improv 101); https://www.groundlings.com (Basic); https://www.actorsconnection.com',
} as const;

/**
 * Meal penalties: a first meal due six hours from call; each half hour late
 * costs a principal $25, then $35, $50, $50, and $75 each after (2026
 * agreement). How often a shooting day runs late to its meal, a fifth of
 * them, a half hour or an hour, is SLATE's estimate.
 */
export const MEAL_PENALTY = { steps: [25_00, 35_00, 50_00, 50_00] as readonly Money[], later: 75_00, chance: 0.2, halfHours: [1, 2] as const, source: '2026 SAG-AFTRA TV/Theatrical memorandum of agreement, item 22.b' } as const;

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
 * its series in 2025, and a new streaming series reached a second season 48%
 * to 55% of the time each year from 2022 to 2025 (Luminate, "The Show Must Go
 * Off", September 2026), which SLATE takes at the middle, 51.5%. Until
 * 2026-09-28 a first season was renewed at the 44% of all of them. A
 * season's pay rises about 4% a season, built into the
 * deal. A picked-up season begins about a year after the last began.
 */
export const SERIES = {
  maxSeasons: 7,
  renewal: { network: 0.75, svod: 0.44, svodFirst: 0.515 },
  raise: 0.04,
  optionMonth: 6,
  optionDay: 15,
  nextSeasonDays: 364,
  source: 'SAG-AFTRA Television Agreement §24; 2023 and 2026 memoranda; Luminate 2025; California Labor Code §2855',
} as const;

/**
 * Working away. A screen job shoots where the production goes: by 2024's
 * series, a quarter in Los Angeles, 13% in the United Kingdom, a tenth in
 * Georgia, 8% in British Columbia and in New York, 7% in Ontario, 3% in
 * Illinois (FilmLA), the rest spread thin. SLATE sends a job home about half
 * the time, and otherwise to Atlanta, London, Vancouver, Toronto, Chicago or
 * New Orleans, by those shares. A SAG-AFTRA member hired at home and taken
 * abroad works under the same contract, per diem and all. Until 2026-09-27
 * no job left the United States.
 * On location the production flies the actor out the day before and home the
 * day after, a travel day on a non-work day paid as a day, a room of their
 * own, and SAG-AFTRA's meal allowance, $75 a day ($80 from July 2028).
 */
export const LOCATION = {
  cities: [['us-ga-atlanta', 0.14], ['uk-eng-london', 0.12], ['ca-bc-vancouver', 0.08], ['ca-on-toronto', 0.07], ['us-il-chicago', 0.04], ['us-la-neworleans', 0.04]] as readonly (readonly [string, number])[],
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
