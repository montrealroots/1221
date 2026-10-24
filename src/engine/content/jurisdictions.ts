/**
 * SLATE — where screen work abroad is permitted, country by country, and how far the game has researched each (from
 * 2026-10-23, the owner's brief 25, Part 9: "Use extensible country and regional packages sharing one geography and
 * travel system", "Maintain a country coverage matrix", "Do not silently apply US rules worldwide";
 * `docs/verification/career-world-2026-10-23/criteria.md`, W1 and W2).
 *
 * Each country is in one of three states, and the state decides what the game lets through:
 * - **verified**: a route to permission for the activity, its conditions read from the government's own page on a
 *   recorded date, each with its words. The game applies it.
 * - **partial**: sources located (the dossier's register, S01 to S110), rules not extracted. Planning is possible; a
 *   binding acceptance isn't, since the game can't say what permission the work needs.
 * - **unsupported**: nothing researched. Missing rules are never permission: a role there can't be accepted, and the
 *   refusal says why.
 *
 * The United States is the package brief 19 built (`systems/permission.ts`, `usWorkAuthorized`: citizenship, a green
 * card, OPT), not a route here: work in the US reads it as before. Every source id is the dossier's
 * (`docs/verification/career-world-2026-10-23/sources.json`), or a source this build found beyond it (`N01` on), kept
 * there the same way.
 */

/** A source as the game cites it: the register's id, where it is, the day this build read it, and the page's own date. */
export interface SourceRef {
  id: string;
  url: string;
  /** `YYYY-MM-DD`, the day the game's figures were read from it. */
  read: string;
  /** The page's own "last updated", where it gives one. */
  updated?: string;
}

/** One condition of a route, in its own words where it's verified, or the game's where it's an assumption. */
export interface RouteCondition {
  id: string;
  words: string;
  basis: 'verified' | 'assumption';
  /** Verified: the source's sentence. */
  quote?: string;
  /** Verified from a page other than its route's (from 2026-10-24, brief 27): that page's id in the research register. */
  from?: string;
}

/** A route to permission for screen work in a country. */
export interface WorkRoute {
  id: 'au-408-entertainment' | 'au-444-special-category' | 'uk-common-travel-area' | 'uk-creative-concession' | 'uk-creative-worker';
  country: string;
  /** What the department calls it. */
  name: string;
  /** The short name a screen uses. */
  short: string;
  /**
   * Who it's for: anyone without the country's citizenship, the citizens of one country, or (from 2026-10-24, brief 27:
   * the UK's concession) the citizens of any country not on a list of those who need a visa to visit.
   */
  for: { kind: 'non-citizens' } | { kind: 'citizens-of'; iso: string; passport: true } | { kind: 'non-visa-nationals'; visaNationals: readonly string[] };
  /** The longest work it covers, in calendar months from arrival to the last work day (the UK's concession: three). */
  maxMonths?: number;
  /** A travel authorization it needs besides, applied for ahead: the destination and its name in `content/entry.ts`. */
  authorization?: { destination: string; name: string; fee: { amount: number; currency: string }; decisionDays: number; validityYears: number };
  /** Its fee where the page gives one, in the currency's minor units; charged when it's applied for. */
  fee?: { amount: number; currency: string };
  /** Applied for ahead with the production's support, or granted at the border on arrival. */
  how: 'apply-ahead' | 'on-arrival';
  source: SourceRef;
  conditions: readonly RouteCondition[];
  /** Applied ahead: the days to a decision, the game's assumption, since the department gives none in the page. */
  decisionDays?: number;
  /** Applied ahead: how long past the last work day the grant runs, the game's assumption from the page's 28-day rule. */
  graceDays?: number;
  // `charge?: never` stood here until 2026-10-24: the 408's charge is loaded by the department's estimator and isn't in its
  // page, so none was charged. The UK's routes give theirs (`fee`, `authorization.fee`), and brief 27 charges them.
}

export type Research = 'verified' | 'partial' | 'unsupported';

export interface Jurisdiction {
  /** The gazetteer's country id (`content/geography.ts`). */
  country: string;
  iso: string;
  name: string;
  research: Research;
  routes: readonly WorkRoute[];
  /** The dossier's sources located for it. */
  sources: readonly string[];
  /** What isn't in the game yet, each a phrase a sentence lists after "Not in the game yet:". */
  gaps: readonly string[];
}

const S01: SourceRef = { id: 'S01', url: 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/temporary-activity-408/entertainment-activities', read: '2026-10-23', updated: '2026-09-24' };
const N02: SourceRef = { id: 'N02', url: 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/special-category-visa-subclass-444', read: '2026-10-23', updated: '2026-09-08' };

/** The 408's conditions, S01's words as read on 2026-10-23, and the game's assumptions where the page is silent. */
const AU_408: WorkRoute = {
  id: 'au-408-entertainment', country: 'au',
  name: 'Temporary Activity visa (subclass 408), Entertainment Activities stream',
  short: '408 visa',
  for: { kind: 'non-citizens' }, how: 'apply-ahead', source: S01,
  conditions: [
    { id: 'category', basis: 'verified', words: 'It’s for performing in a film or television production in Australia.', quote: 'performing in a film or television production not subsidised by government' },
    { id: 'contract', basis: 'verified', words: 'You need a contract for the work first.', quote: 'You must have a contract for your performance or work in Australia.' },
    { id: 'supporter', basis: 'verified', words: 'Applying from outside Australia for less than three months, you need a supporter: here, the production.', quote: 'You must have a supporter to apply for this visa.' },
    { id: 'union-arts', basis: 'verified', words: 'Before engaging you, the production consults the actors’ union and gets an Arts certificate.', quote: 'Your sponsor or supporter must consult with the relevant union or unions before engaging you. They must also obtain an Arts certificate from the Department of Communications and the Arts.' },
    { id: 'itinerary', basis: 'verified', words: 'Once applied for, the work’s times and places can change only with the department’s permission.', quote: 'If you need to do so, you must ask the Secretary of the Department of Home Affairs for permission before you make any changes.' },
    { id: 'stops', basis: 'verified', words: 'If the production stops the work, you leave within 28 days or apply for a new visa.', quote: 'leave Australia within 28 days of stopping work for your sponsor/supporter, or earlier if your visa is expiring' },
    { id: 'passport', basis: 'verified', words: 'It’s linked to your passport digitally, with no label in it.', quote: 'We will digitally link your visa to your passport.' },
    // ASSUMPTION: the page says "You must have enough money during your stay in Australia to support yourself" and sets
    // no figure; the production's support and its paying for the hotel are taken to meet it.
    { id: 'funds', basis: 'assumption', words: 'You need enough money to support yourself, with no figure set. The game takes the production’s support and the hotel it pays for as meeting it.' },
    // ASSUMPTION: the page sends the reader to the department's processing time tool; no time is in the page.
    { id: 'decision', basis: 'assumption', words: 'A decision comes ten days after you apply, as the game assumes: the department points to a processing time tool instead of giving one.' },
    { id: 'charge', basis: 'assumption', words: 'Its charge comes from the department’s price estimator and isn’t in the page, so the game doesn’t charge one.' },
  ],
  decisionDays: 10,
  // ASSUMPTION: granted to 28 days past the last work day, the page's 28 days after work stops.
  graceDays: 28,
};

const AU_444: WorkRoute = {
  id: 'au-444-special-category', country: 'au',
  name: 'Special Category visa (subclass 444)',
  short: 'Special Category visa',
  for: { kind: 'citizens-of', iso: 'NZ', passport: true }, how: 'on-arrival', source: N02,
  conditions: [
    { id: 'work', basis: 'verified', words: 'A New Zealand citizen may visit, work and study in Australia.', quote: 'visit, work and study in Australia' },
    { id: 'passport', basis: 'verified', words: 'It’s granted on arrival to a holder of a valid New Zealand passport.', quote: 'You must have a valid New Zealand passport to be granted this visa.' },
  ],
};

/**
 * The UK's routes (from 2026-10-24, brief 27: until then the UK was partly researched, its sources located and not read),
 * read from GOV.UK that day (`docs/verification/career-universe-2026-10-24/research/register.json`): the Creative Worker
 * guide (`b25-S02`, `b25-S104`, its printable whole `b27-UK-print`, updated 2026-09-09), the visa national list
 * (`b27-UK-visa-national`, updated 2026-10-22), the ETA's pages (`b27-UK-eta`, `b27-UK-eta-apply`) and the healthcare
 * surcharge's (`b27-UK-ihs`), and the Common Travel Area's guidance for Ireland's citizens (`b27-UK-CTA`, updated
 * 2026-10-23).
 */
const UK_CW: SourceRef = { id: 'b25-S02', url: 'https://www.gov.uk/creative-worker-visa', read: '2026-10-24', updated: '2026-09-09' };
const UK_GUIDE: SourceRef = { id: 'b27-UK-print', url: 'https://www.gov.uk/creative-worker-visa/print', read: '2026-10-24', updated: '2026-09-09' };
const UK_CTA: SourceRef = { id: 'b27-UK-CTA', url: 'https://www.gov.uk/government/publications/common-travel-area-guidance/common-travel-area-guidance', read: '2026-10-24', updated: '2026-10-23' };

/**
 * The visa nationals (Appendix Visitor: Visa national list, VN 1.1(a), as read on 2026-10-24), by ISO code: 115
 * countries, less Taiwan, whose own passports carrying the holder's identification number are excepted (VN 2.2(c)), the
 * passport every Taiwanese citizen in the game holds. China's other exception, for Hong Kong and Macao passports, needs no
 * entry: the game's citizens of China hold China's.
 */
export const UK_VISA_NATIONALS: readonly string[] = [
  'AF', 'AL', 'DZ', 'AO', 'AM', 'AZ', 'BD', 'BY', 'BJ', 'BT', 'BO', 'BA', 'BW', 'BF', 'BI', 'KH', 'CM', 'CV', 'CF', 'TD', 'CN', 'CO', 'KM', 'CG',
  'CI', 'CU', 'CD', 'DJ', 'DM', 'DO', 'EC', 'EG', 'SV', 'GQ', 'ER', 'SZ', 'ET', 'FJ', 'GA', 'GM', 'GE', 'GH', 'GN', 'GW', 'HT', 'HN', 'IN', 'ID',
  'IR', 'IQ', 'JM', 'JO', 'KZ', 'KE', 'KP', 'XK', 'KG', 'LA', 'LB', 'LS', 'LR', 'LY', 'MG', 'MW', 'ML', 'MR', 'MD', 'MN', 'ME', 'MA', 'MZ', 'MM',
  'NA', 'NR', 'NP', 'NI', 'NE', 'NG', 'MK', 'PK', 'PS', 'PH', 'RU', 'RW', 'ST', 'SN', 'RS', 'SL', 'SO', 'ZA', 'SS', 'LK', 'LC', 'SD', 'SR', 'SY',
  'TJ', 'TZ', 'TH', 'TL', 'TG', 'TT', 'TN', 'TR', 'TM', 'UG', 'UA', 'UZ', 'VU', 'VE', 'VN', 'YE', 'ZM', 'ZW',
];

/** The Creative Worker conditions both routes share, the guide's words beside each. */
const UK_SHARED: readonly RouteCondition[] = [
  { id: 'sponsor', basis: 'verified', from: 'b25-S02', words: 'The production gives you a certificate of sponsorship first, as a licensed sponsor.', quote: 'You need to have a certificate of sponsorship from a licensed sponsor before you can apply to come to the UK to work.' },
  { id: 'minimum', basis: 'verified', from: 'b25-S104', words: 'You’re paid at least the minimum Equity, Pact or BECTU sets.', quote: 'be paid the minimum salary as set by Equity , PACT or BECTU (except for models, musicians or circuses)' },
  { id: 'job', basis: 'verified', from: 'b25-S02', words: 'You work for your sponsor in the job your certificate describes.', quote: 'work for your sponsor in the job described in your certificate of sponsorship' },
  // ASSUMPTION: the guide asks for £1,270 held for 28 days unless the sponsor certifies maintenance; the game takes every
  // production as certifying it, as one that books and pays for the stay would.
  { id: 'maintenance', basis: 'assumption', words: 'You need £1,270 to support yourself unless the production certifies your maintenance. The game takes the production as certifying it, since it books and pays for your stay.' },
];

const UK_IRISH: WorkRoute = {
  id: 'uk-common-travel-area', country: 'uk',
  name: 'Common Travel Area', short: 'Common Travel Area',
  for: { kind: 'citizens-of', iso: 'IE', passport: true }, how: 'on-arrival', source: UK_CTA,
  conditions: [
    { id: 'work', basis: 'verified', words: 'An Irish citizen can work in the UK without anyone’s permission.', quote: 'If you are a British or Irish citizen, you can work in either country, including on a self-employed basis, without needing any permission from the authorities.' },
  ],
};

const UK_CONCESSION: WorkRoute = {
  id: 'uk-creative-concession', country: 'uk',
  name: 'Creative Worker visa concession', short: 'Creative Worker concession',
  for: { kind: 'non-visa-nationals', visaNationals: UK_VISA_NATIONALS }, how: 'on-arrival', source: UK_GUIDE, maxMonths: 3,
  authorization: { destination: 'GB', name: 'ETA (Electronic Travel Authorisation)', fee: { amount: 20_00, currency: 'GBP' }, decisionDays: 1, validityYears: 2 },
  conditions: [
    { id: 'concession', basis: 'verified', words: 'With a certificate of sponsorship and work of three months or less, you come in without applying for a visa.', quote: 'You can enter the UK without applying for a visa in advance if you:' },
    { id: 'months', basis: 'verified', words: 'It covers work of three months or less.', quote: 'are coming to work in the UK for 3 months or less' },
    { id: 'visitor', basis: 'verified', words: 'It’s only for a citizen who doesn’t normally need a visa to visit the UK.', quote: 'do not normally need a visa to enter the UK as a visitor' },
    { id: 'eta', basis: 'verified', words: 'You usually need an ETA to travel, £20, applied for ahead and lasting two years or until your passport runs out.', quote: 'You’ll usually need an electronic travel authorisation (ETA) to travel to the UK.' },
    { id: 'officer', basis: 'verified', words: 'At the border you see an immigration officer, never the ePassport gates, and your passport is stamped.', quote: 'Do not use the automatic ePassport gates. You will not be allowed to work if you do not see an immigration officer and get a stamp in your passport.' },
    // ASSUMPTION: the ETA's page says a decision usually comes within a day, up to three working days; the game decides it the next day.
    { id: 'eta-decision', basis: 'assumption', words: 'An ETA is decided the day after you apply, as the game assumes from the page’s “usually within a day”.' },
    ...UK_SHARED,
  ],
};

const UK_CREATIVE: WorkRoute = {
  id: 'uk-creative-worker', country: 'uk',
  name: 'Temporary Work – Creative Worker visa', short: 'Creative Worker visa',
  for: { kind: 'non-citizens' }, how: 'apply-ahead', source: UK_CW, fee: { amount: 340_00, currency: 'GBP' },
  conditions: [
    { id: 'category', basis: 'verified', words: 'It’s the visa for a creative worker offered work in the UK, an actor among them.', quote: 'A creative worker is someone who works in the creative industries, for example an actor, dancer, musician or film crew member.' },
    { id: 'fee', basis: 'verified', words: 'Its application fee is £340.', quote: 'The application fee for each person applying is £340.' },
    { id: 'decision', basis: 'verified', words: 'Applied for from outside the UK, it’s usually decided within three weeks.', quote: '3 weeks, if you’re outside the UK' },
    { id: 'stay', basis: 'verified', words: 'It lasts the certificate’s time and up to 28 days more, never past twelve months.', quote: 'You can come to the UK for a maximum of up to 12 months, or the time given in your certificate of sponsorship plus up to 28 days, whichever is shorter.' },
    { id: 'surcharge', basis: 'verified', from: 'b27-UK-ihs', words: 'Applied for from outside the UK for six months or less, there’s no healthcare surcharge. The game’s work there is never longer.', quote: 'You do not need to pay the surcharge if you’re applying from outside the UK for 6 months or less.' },
    ...UK_SHARED,
  ],
  decisionDays: 21,
  graceDays: 28,
};

const partial = (country: string, iso: string, name: string, sources: string[], gaps: string[]): Jurisdiction => ({ country, iso, name, research: 'partial', routes: [], sources, gaps });

/** The countries the brief names (Part 9), each in its state; every other country is unsupported (`jurisdictionOf`). */
export const JURISDICTIONS: Readonly<Record<string, Jurisdiction>> = {
  au: {
    country: 'au', iso: 'AU', name: 'Australia', research: 'verified', routes: [AU_408, AU_444],
    sources: ['S01', 'S13', 'S25', 'S26', 'S28', 'N02'],
    gaps: [
      // The tax office's pages (S28) refused this build's reading three ways on 2026-10-23 (CHECKPOINT.md, Blockers Met).
      'Australian tax on pay for work there',
      // S13: located by brief 25 and fetched whole by brief 27 on 2026-10-24; its agreements' terms weren't read.
      'the agreements of MEAA, the Australian actors’ union, that a production there would use',
      'permanent residence and the other visas that let you work in Australia',
    ],
  },
  // Partly researched until 2026-10-24, when brief 27 read GOV.UK's pages (the routes above): its gaps then were the
  // Creative Worker visa's conditions for sponsorship and money, and the agreements of Pact and Equity and the tax on
  // visiting entertainers, the last two still gaps.
  uk: {
    country: 'uk', iso: 'GB', name: 'United Kingdom', research: 'verified', routes: [UK_IRISH, UK_CONCESSION, UK_CREATIVE],
    sources: ['S02', 'S104', 'S17', 'S18', 'S19', 'S29'],
    gaps: [
      'the agreements of Pact and Equity that a British production would use, since the game’s work in London is an American production’s',
      'the UK’s tax on a visiting performer’s pay, which the game doesn’t withhold',
      'the other visas that let you work in the UK',
    ],
  },
  // Each of the four below had only sources located and unread until 2026-10-24, when brief 27 read one official page for
  // each (b27-NZ-WS21, b27-NZ-1187, b27-CA-IRPR-186, b27-FR-talent, b27-JP-entertainer): enough to say who a route is
  // for, not its fee, its timing or, for France and Canada, the permit a short screen engagement needs. Their gaps said
  // until then: the Entertainers Work Visa's conditions and what the employer has to do for it; which work permit a film
  // actor needs; the talent and salaried work permits, and what they leave out for film and television; the Entertainer
  // visa's requirements and documents.
  nz: partial('nz', 'NZ', 'New Zealand', ['S03', 'S04', 'b27-NZ-WS21', 'b27-NZ-1187'], ['the visa’s fee and how long a decision takes, which its pages give only in a browser', 'what the union’s or guild’s view of an engagement decides']),
  // ACTRA's IPA doesn't cover British Columbia, which has its own agreement (S15, S16, as the dossier has them).
  ca: partial('ca', 'CA', 'Canada', ['S07', 'S105', 'S15', 'S16', 'b27-CA-IRPR-186'], ['which work permit a film actor needs: the regulations’ exemption for performing artists leaves out film and television, and the government’s pages on permits didn’t answer', 'ACTRA’s agreements, and British Columbia’s own']),
  fr: partial('fr', 'FR', 'France', ['S08', 'S09', 'b27-FR-talent'], ['the permit for an engagement shorter than three months: the talent card for an artist asks for contracts of three months or more in a year, and the salaried work page refused this build', 'the talent visa’s fee and how long a decision takes']),
  jp: partial('jp', 'JP', 'Japan', ['S10', 'b27-JP-entertainer'], ['the Entertainer status’s criteria and documents for film and broadcast work, which an ordinance this build didn’t read sets, and its fee and timing']),
  in: partial('in', 'IN', 'India', ['S11', 'S12'], ['the film visa, which follows permission to shoot, and the rules for documentary filming']),
};

/** A country's state: its entry, or unsupported. The US's work reads `usWorkAuthorized` and isn't here. */
export function jurisdictionOf(country: string, name = country.toUpperCase()): Jurisdiction {
  return JURISDICTIONS[country] ?? { country, iso: country.toUpperCase(), name, research: 'unsupported', routes: [], sources: [], gaps: ['any of the rules for working there'] };
}

/** The gaps in a sentence: "Not in the game yet: a; b; and c." */
export function gapWords(j: Pick<Jurisdiction, 'gaps'>): string {
  const g = j.gaps;
  const listed = g.length < 3 ? g.join(' and ') : `${g.slice(0, -1).join('; ')}; and ${g[g.length - 1]}`;
  return listed ? `Not in the game yet: ${listed}.` : '';
}
