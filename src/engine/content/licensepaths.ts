/**
 * SLATE — the road to a car license, step by step, in each jurisdiction
 * `content/licenses.ts` has: what is applied for, taken, attended and
 * waited out, in order, what each costs, and what passing it grants. Set down
 * on 2026-09-29 from the same research as `content/licenses.ts`, whose
 * sources carry every fee here that an authority sets; a course's price,
 * which no authority sets, carries its own source and is the midpoint of the
 * prices published, and says so. Written by hand, as the path is read from
 * the authority's words, not built.
 *
 * The path is an adult's: a life begins at twenty-four, so a minor's rules
 * (a junior license, a teen's supervised hours) aren't here. An age rule
 * that reaches adults, as New South Wales and New Zealand ask more of a
 * learner under twenty-five, is kept by `under` and `over`. A rule that
 * changes on a day, as British Columbia's road-test fee and New Zealand's
 * graduated license do, is kept by `from` and `until`, ISO dates.
 *
 * How long a test is booked ahead isn't published as a figure by most
 * authorities; `LEAD_DAYS` is SLATE's estimate and says so.
 */

export type PathStepKind = 'office' | 'course' | 'test';
export type LicenseStage = 'learner' | 'provisional' | 'full';

export interface LicenseGrant {
  stage: LicenseStage;
  /** What the authority calls it. */
  name: string;
  years: number;
  /** The term where the authority's pages didn't give one: SLATE's estimate. */
  yearsEstimated?: boolean;
  /** Whether the holder may drive with nobody beside them. */
  alone: boolean;
}

export interface PathStep {
  id: string;
  kind: PathStepKind;
  /** Title Case, as the screen shows it. */
  name: string;
  /** In the path's currency, paid when it's booked. */
  fee: number;
  /** Where the fee isn't an authority's own: whose figure it is. */
  feeBasis?: string;
  /** How long it takes the player: a session's minutes, for a course. */
  minutes: number;
  /** A course's sessions, and the days between them. */
  sessions?: number;
  everyDays?: number;
  /** Steps done first; the step before it when not given. */
  needs?: readonly string[];
  /** Days that must pass since a step was done before this one can be taken. */
  wait?: { days: number; since: string };
  /** Only for someone under, or at or over, an age when they take it. */
  under?: number;
  over?: number;
  /** The days it applies between, ISO dates. */
  from?: string;
  until?: string;
  /** A test's first-attempt pass rate's key in `PASS_RATES`. */
  pass?: string;
  /** Days after a fail before it can be taken again, and its fee again where that differs. */
  retakeDays?: number;
  retakeFee?: number;
  /** A fee paid once that covers some attempts: its step, and how many. */
  covered?: { by: string; attempts: number };
  /** Days a pass stands before it lapses unused. */
  validDays?: number;
  /** Paid on passing, for what it grants. */
  issueFee?: number;
  /** Days after passing before the license arrives. */
  issueDays?: number;
  grants?: LicenseGrant;
  note: string;
  /** Where it isn't one of the jurisdiction's own sources in `content/licenses.ts`. */
  source?: string;
}

export interface LicensePath {
  currency: string;
  steps: readonly PathStep[];
  /** What the path leaves out, said plainly. */
  note: string;
}

/**
 * Days ahead an appointment is booked: an office visit, a written test and a
 * road test. SLATE's estimate: authorities publish a wait for a road test
 * rarely, and it varies by center and season.
 */
export const LEAD_DAYS = { office: 2, course: 3, test: 5, road: 21 } as const;

const MIDPOINT = (low: number, high: number) => Math.round(((low + high) / 2) * 100) / 100;

export const LICENSE_PATHS: Readonly<Record<string, LicensePath>> = {
  'us-ny': {
    currency: 'USD',
    note: 'The fee is New York’s for 21 and over outside the Metropolitan Commuter Transportation District; inside it, New York City among it, it’s $9 to $13.25 more, which SLATE doesn’t add. The six-month probation isn’t kept.',
    steps: [
      { id: 'permit', kind: 'test', name: 'Permit Test', fee: 64.25, minutes: 90, pass: 'us-ny-knowledge', retakeDays: 1, retakeFee: 0,
        grants: { stage: 'learner', name: 'Learner Permit', years: 5, yearsEstimated: true, alone: false },
        note: 'The written test on the Driver’s Manual and an eye test at the DMV; the fee covers the permit and the first license.' },
      { id: 'course', kind: 'course', name: 'Pre-Licensing Course', fee: MIDPOINT(40, 62), feeBasis: 'The middle of $40 to $62, what DMV-approved schools advertise; the DMV sets no price.', minutes: 300, sessions: 1,
        note: 'Five hours at a licensed driving school, before a road test can be booked.', source: 'https://dmv.ny.gov/driver-license/the-driver-pre-licensing-course' },
      { id: 'road', kind: 'test', name: 'Road Test', fee: 0, minutes: 60, pass: 'us-ny-road', retakeDays: 14, retakeFee: 0,
        grants: { stage: 'full', name: 'Class D Driver License', years: 5, alone: true },
        note: 'In a car you bring, with a licensed driver. Up to five years to the birthday at first, and eight at each renewal.' },
    ],
  },
  'us-ct': {
    currency: 'USD',
    note: 'An adult’s path: the learner permit held ninety days, the eight-hour course, then the road test.',
    steps: [
      { id: 'knowledge', kind: 'test', name: 'Knowledge Test', fee: 40, minutes: 60, pass: 'us-ct-knowledge', retakeDays: 7, retakeFee: 40,
        note: 'The vision test and the 25-question knowledge test, by appointment; the $40 covers the vision, knowledge and road tests.' },
      { id: 'permit', kind: 'office', name: 'Learner Permit', fee: 19, minutes: 30,
        grants: { stage: 'learner', name: 'Adult Learner’s Permit', years: 2, yearsEstimated: true, alone: false },
        note: 'Driving with a trainer twenty or over who has held a license four years.' },
      { id: 'course', kind: 'course', name: 'Safe Driving Practices Course', fee: MIDPOINT(125, 150), feeBasis: 'The middle of $125 to $150, what Connecticut schools advertise; the DMV sets no price.', minutes: 240, sessions: 2, everyDays: 1,
        note: 'Eight hours at a licensed school, before the road test.', source: 'https://portal.ct.gov/TeenDriving/Home-Training/Home-Training/8-Hour-Safe-Driving-Practices-Class' },
      { id: 'road', kind: 'test', name: 'Road Test', fee: 0, minutes: 60, needs: ['permit', 'course'], wait: { days: 90, since: 'permit' }, pass: 'us-ct-road', retakeDays: 14, retakeFee: 30, issueFee: 84,
        grants: { stage: 'full', name: 'Class D Operator’s License', years: 6, alone: true },
        note: 'Booked after ninety days on the permit; $84 for the license on passing, issued for five and a half to seven years to the birthday.' },
    ],
  },
  'us-ca': {
    currency: 'USD',
    note: 'The $46 application covers three knowledge tests and three drive tests for twelve months; SLATE charges $9 for each drive test after the first, as the fees page does, and doesn’t lapse the application.',
    steps: [
      { id: 'application', kind: 'office', name: 'Application', fee: 46, minutes: 60,
        note: 'Online, then at an office with identity, Social Security and residency papers, a thumbprint, a photo and the eye test.' },
      { id: 'knowledge', kind: 'test', name: 'Knowledge Test', fee: 0, minutes: 45, pass: 'us-ca-knowledge', retakeDays: 1, covered: { by: 'application', attempts: 3 },
        grants: { stage: 'learner', name: 'Instruction Permit', years: 1, alone: false },
        note: 'Three attempts on the application.' },
      { id: 'road', kind: 'test', name: 'Drive Test', fee: 0, minutes: 45, pass: 'us-ca-road', retakeDays: 14, retakeFee: 9,
        grants: { stage: 'full', name: 'Class C Driver’s License', years: 5, alone: true },
        note: 'By appointment, with proof of insurance for the car.' },
    ],
  },
  gb: {
    currency: 'GBP',
    note: 'No lessons are compulsory; the practical test’s pass rate is of those who took it, however they learned. The New Drivers Act’s six points in two years isn’t kept.',
    steps: [
      { id: 'provisional', kind: 'office', name: 'Provisional Licence', fee: 34, minutes: 20, issueDays: 7,
        grants: { stage: 'learner', name: 'Provisional Driving Licence', years: 10, alone: false },
        note: 'Online, £34 (£43 by post); L plates and a qualified driver beside you.' },
      { id: 'theory', kind: 'test', name: 'Theory Test', fee: 23, minutes: 60, pass: 'gb-theory', retakeDays: 3, validDays: 730,
        note: 'Multiple choice and hazard perception; a pass stands two years.' },
      { id: 'practical', kind: 'test', name: 'Practical Test', fee: 62, minutes: 40, pass: 'gb-practical', retakeDays: 10,
        grants: { stage: 'full', name: 'Full Driving Licence', years: 10, alone: true },
        note: '£62 on a weekday, £75 evenings, weekends and bank holidays; the eyesight check is at its start.' },
    ],
  },
  'gb-nir': {
    currency: 'GBP',
    note: 'The graduated rules for a provisional license from 1 October 2026: a logbook of training before the test, six months on the provisional license, and R plates for two years after.',
    steps: [
      { id: 'provisional', kind: 'office', name: 'Provisional Licence', fee: 62.5, minutes: 20, issueDays: 7,
        grants: { stage: 'learner', name: 'Provisional Driving Licence', years: 10, alone: false },
        note: 'L plates, 45 mph at most, and a supervisor 21 or over with three years on a full license.' },
      { id: 'theory', kind: 'test', name: 'Theory Test', fee: 23, minutes: 60, pass: 'gb-nir-theory', retakeDays: 3, validDays: 730,
        note: 'Not bookable before the provisional license is valid.' },
      { id: 'training', kind: 'course', name: 'Program Of Training', fee: 0, feeBasis: 'Instructors set their own price and the DVA publishes none; SLATE has no figure and charges nothing for it.', minutes: 60, sessions: 12, everyDays: 7, from: '2026-10-01',
        note: 'Lessons recorded in the logbook before the practical test. The number of lessons wasn’t confirmed; SLATE’s twelve.' },
      { id: 'practical', kind: 'test', name: 'Practical Test', fee: 65, minutes: 40, wait: { days: 183, since: 'provisional' }, pass: 'gb-nir-practical', retakeDays: 10,
        grants: { stage: 'full', name: 'Full Licence, R Plates', years: 10, alone: true },
        note: '£65 on a weekday, £95 evenings and weekends; six months from the provisional license.' },
    ],
  },
  'ca-on': {
    currency: 'CAD',
    note: 'Ontario’s graduated licensing applies at every age: twelve months on a G1, eight with an approved course, which SLATE doesn’t offer, then twelve on a G2.',
    steps: [
      { id: 'g1', kind: 'test', name: 'G1 Knowledge Test', fee: 159.75, minutes: 60, pass: 'ca-on-knowledge', retakeDays: 1, retakeFee: 16,
        grants: { stage: 'learner', name: 'G1 Licence', years: 5, alone: false },
        note: 'The eye and knowledge tests; the package covers the first G2 road test and the five-year license.' },
      { id: 'g2', kind: 'test', name: 'G2 Road Test', fee: 0, minutes: 30, wait: { days: 365, since: 'g1' }, pass: 'ca-on-g2', retakeDays: 10, retakeFee: 53.75,
        grants: { stage: 'provisional', name: 'G2 Licence', years: 5, alone: true },
        note: 'Twelve months after the G1.' },
      { id: 'g', kind: 'test', name: 'G Road Test', fee: 91.25, minutes: 45, wait: { days: 365, since: 'g2' }, pass: 'ca-on-g', retakeDays: 10,
        grants: { stage: 'full', name: 'G Licence', years: 5, alone: true },
        note: 'Highway driving; $91.25 as commonly cited, not read from Ontario’s own page.' },
    ],
  },
  'ca-bc': {
    currency: 'CAD',
    note: 'An adult without two years’ full-license driving enters the graduated program: twelve months as a learner, then twenty-four as a novice, eighteen with an approved course SLATE doesn’t offer.',
    steps: [
      { id: 'knowledge', kind: 'test', name: 'Knowledge Test', fee: 15, minutes: 60, pass: 'ca-bc-knowledge', retakeDays: 1, retakeFee: 15,
        note: '$15 an attempt, in twelve languages.' },
      { id: 'learner', kind: 'office', name: 'Learner Licence', fee: 10, minutes: 30,
        grants: { stage: 'learner', name: 'Class 7L Learner Licence', years: 2, yearsEstimated: true, alone: false },
        note: 'A supervisor 25 or over, zero alcohol, no devices, the L sign.' },
      { id: 'class7', kind: 'test', name: 'Class 7 Road Test', fee: 35, minutes: 45, wait: { days: 365, since: 'learner' }, pass: 'ca-bc-class7', retakeDays: 7, until: '2026-10-19', issueFee: 75,
        grants: { stage: 'provisional', name: 'Class 7 Novice Licence', years: 5, alone: true },
        note: '$35 until 19 October 2026; $75 for the first five-year novice license on passing.' },
      { id: 'class7-50', kind: 'test', name: 'Class 7 Road Test', fee: 50, minutes: 45, wait: { days: 365, since: 'learner' }, needs: ['learner'], pass: 'ca-bc-class7', retakeDays: 7, from: '2026-10-19', issueFee: 75,
        grants: { stage: 'provisional', name: 'Class 7 Novice Licence', years: 5, alone: true },
        note: '$50 from 19 October 2026; $75 for the first five-year novice license on passing.' },
      { id: 'class5', kind: 'test', name: 'Class 5 Road Test', fee: 50, minutes: 45, needs: ['class7|class7-50'], wait: { days: 730, since: 'class7|class7-50' }, pass: 'ca-bc-class5', retakeDays: 7,
        grants: { stage: 'full', name: 'Class 5 Driver’s Licence', years: 5, alone: true },
        note: 'Twenty-four months on the novice license.' },
    ],
  },
  ie: {
    currency: 'EUR',
    note: 'Twelve Essential Driver Training lessons and six months on the first learner permit, before the test. The novice period’s lower points limit isn’t kept.',
    steps: [
      { id: 'theory', kind: 'test', name: 'Driver Theory Test', fee: 45, feeBasis: '€45 as reported; the RSA’s own fee page couldn’t be read.', minutes: 60, pass: 'ie-theory', retakeDays: 1, validDays: 730,
        note: 'Passed before the first learner permit.' },
      { id: 'permit', kind: 'office', name: 'Learner Permit', fee: 45, minutes: 30,
        grants: { stage: 'learner', name: 'Learner Permit', years: 2, alone: false },
        note: 'L plates, and a full-license holder of two years beside you. The eyesight report it needs, from an optician, is at a private fee SLATE has no figure for.' },
      { id: 'edt', kind: 'course', name: 'Essential Driver Training', fee: 550, feeBasis: 'The common price of twelve lessons, €550, in Money Guide Ireland’s survey of €500 to €750, early 2026; the RSA sets no price.', minutes: 60, sessions: 12, everyDays: 7,
        note: 'Twelve one-hour lessons with an Approved Driving Instructor, logged.', source: 'https://www.moneyguideireland.com/cost-of-learning-to-drive-in-ireland.html' },
      { id: 'test', kind: 'test', name: 'Driving Test', fee: 85, feeBasis: '€85 as reported; the RSA’s own fee page couldn’t be read.', minutes: 60, needs: ['permit', 'edt'], wait: { days: 183, since: 'permit' }, pass: 'ie-test', retakeDays: 7, issueFee: 65,
        grants: { stage: 'full', name: 'Full Driving Licence', years: 10, alone: true },
        note: 'Six months on the permit and the lessons done; €65 for the first full license on passing, with N plates two years.' },
    ],
  },
  is: {
    currency: 'ISK',
    note: 'The provisional license is held a year before the full one, after the third driving school and an assessment; points on it, which SLATE doesn’t keep, would stop that.',
    steps: [
      { id: 'school', kind: 'course', name: 'Driving School And Lessons', fee: MIDPOINT(335_000, 375_000) - 53_900, feeBasis: 'The middle of ISK 335,000 to 375,000 an instructor’s price list puts the whole course at, less its ISK 53,900 for the third driving school, which is its own step; no authority sets a price.', minutes: 45, sessions: 15, everyDays: 3,
        grants: { stage: 'learner', name: 'Námsheimild', years: 1, yearsEstimated: true, alone: false },
        note: 'The first two driving schools’ theory and fifteen lessons with an instructor at least; practice with a private supervisor after ten.', source: 'https://aksturogkennsla.is/verdskra-okukennsla/' },
      { id: 'theory', kind: 'test', name: 'Written Test', fee: 7583, minutes: 45, pass: 'is-theory', retakeDays: 7,
        note: 'Frumherji: 50 statements, 45 right to pass.' },
      { id: 'practical', kind: 'test', name: 'Practical Test', fee: 19619, minutes: 45, pass: 'is-practical', retakeDays: 7, issueFee: 4300,
        grants: { stage: 'provisional', name: 'Bráðabirgðaskírteini', years: 3, alone: true },
        note: 'Booked by the instructor; the provisional license runs three years.' },
      { id: 'school3', kind: 'course', name: 'Driving School 3', fee: 53_900, feeBasis: 'An instructor’s price list; no authority sets a price.', minutes: 240, sessions: 1, source: 'https://aksturogkennsla.is/verdskra-okukennsla/',
        note: 'Risk training, the skid simulator among it.' },
      { id: 'full', kind: 'office', name: 'Driving Assessment And Full License', fee: 8600, minutes: 60, wait: { days: 365, since: 'practical' },
        grants: { stage: 'full', name: 'Fullnaðarskírteini', years: 15, alone: true },
        note: 'After twelve months on the provisional license, with an instructor’s assessment.' },
    ],
  },
  de: {
    currency: 'EUR',
    note: 'The driving school is compulsory and its price the ADAC’s range, not a fee; the Probezeit’s two years under stricter rules aren’t kept.',
    steps: [
      { id: 'eyes', kind: 'office', name: 'Eye Test', fee: 7, feeBasis: 'The top of the ADAC’s €0 to €7; many opticians do it free.', minutes: 20,
        note: 'The Sehtest, at an optician.' },
      { id: 'firstaid', kind: 'course', name: 'First Aid Course', fee: 60, feeBasis: 'From about €60, the ADAC’s figure; providers set it.', minutes: 450, sessions: 1,
        note: 'The Erste-Hilfe-Kurs, a day.', source: 'https://www.adac.de/verkehr/rund-um-den-fuehrerschein/erwerb/fuehrerschein-kosten/' },
      { id: 'application', kind: 'office', name: 'Application', fee: 43.4, minutes: 45,
        note: 'At the Fahrerlaubnisbehörde; some authorities charge more, to about €70.' },
      { id: 'school', kind: 'course', name: 'Driving School', fee: MIDPOINT(2466, 4476), feeBasis: 'The middle of the ADAC’s €2,466 to €4,476, 8 April 2025; schools set their own prices.', minutes: 90, sessions: 30, everyDays: 3, needs: ['firstaid', 'application'],
        note: 'Theory classes, the twelve special drives on country roads, the Autobahn and at night, and the lessons between.', source: 'https://www.adac.de/verkehr/rund-um-den-fuehrerschein/erwerb/fuehrerschein-kosten/' },
      { id: 'theory', kind: 'test', name: 'Theory Test', fee: 24.99, minutes: 45, pass: 'de-theory', retakeDays: 14, retakeFee: 24.99, needs: ['eyes', 'school'],
        note: 'At TÜV or DEKRA, paid again each attempt; two weeks at least before another (FeV §18).' },
      { id: 'practical', kind: 'test', name: 'Practical Test', fee: 129.83, minutes: 55, pass: 'de-practical', retakeDays: 14, retakeFee: 129.83,
        grants: { stage: 'full', name: 'Führerschein Klasse B', years: 15, alone: true },
        note: 'At TÜV or DEKRA, paid again each attempt.' },
    ],
  },
  fr: {
    currency: 'EUR',
    note: 'The permis probatoire’s six points and lower limits for three years aren’t kept.',
    steps: [
      { id: 'neph', kind: 'office', name: 'ANTS Registration', fee: 0, minutes: 30,
        note: 'The NEPH number, usually filed by the driving school.' },
      { id: 'code', kind: 'test', name: 'Code De La Route', fee: 30, minutes: 45, pass: 'fr-code', retakeDays: 2, retakeFee: 30,
        note: 'At an approved center, €30 each attempt.' },
      { id: 'lessons', kind: 'course', name: 'Driving Lessons', fee: 1804, feeBasis: 'UFC-Que Choisir’s average for a beginner, €1,804 over about 35 hours, from its 2016 study, still the figure cited in 2026; €2,140 in Paris.', minutes: 60, sessions: 35, everyDays: 2, needs: ['neph'],
        note: 'Twenty hours at least, fifteen on the road; the average beginner takes 35.', source: 'https://www.digischool.fr/articles/auto/permis-conduire/tarifs-en-auto-ecole/' },
      { id: 'exam', kind: 'test', name: 'Driving Exam', fee: 0, minutes: 32, needs: ['code', 'lessons'], pass: 'fr-exam', retakeDays: 30,
        grants: { stage: 'full', name: 'Permis De Conduire B', years: 15, alone: true },
        note: 'The state charges nothing; the school’s fee for presenting you is in its price.' },
    ],
  },
  es: {
    currency: 'EUR',
    note: 'Tasa 2.1 covers two attempts; after them it’s paid again. The novice’s eight points and L plate aren’t kept.',
    steps: [
      { id: 'aptitude', kind: 'office', name: 'Aptitude Report', fee: 40, feeBasis: 'The middle of €30 to €50, as reported; not a DGT fee.', minutes: 45,
        note: 'Sight, hearing and reactions, at a Centro de Reconocimiento de Conductores.' },
      { id: 'tasa', kind: 'office', name: 'Exam Fee', fee: 94.05, minutes: 15,
        note: 'Tasa 2.1, 2026.' },
      { id: 'school', kind: 'course', name: 'Autoescuela', fee: MIDPOINT(558, 1575), feeBasis: 'The middle of €558 to €1,575, the OCU’s survey of 25 cities, June 2015, the latest a consumer body has published.', minutes: 60, sessions: 25, everyDays: 2, needs: ['aptitude'],
        note: 'No legal minimum of lessons; a school’s dual-control car.', source: 'https://www.ocu.org/coches/coches/informe/precio-autoescuela' },
      { id: 'theory', kind: 'test', name: 'Theory Exam', fee: 0, minutes: 30, needs: ['tasa', 'school'], pass: 'es-theory', retakeDays: 7, covered: { by: 'tasa', attempts: 2 }, validDays: 730,
        note: 'A pass stands two years.' },
      { id: 'practical', kind: 'test', name: 'Practical Exam', fee: 0, minutes: 30, pass: 'es-practical', retakeDays: 14, covered: { by: 'tasa', attempts: 2 },
        grants: { stage: 'full', name: 'Permiso De Conducción B', years: 10, alone: true },
        note: 'Passed, a permit for three months while the card is made.' },
    ],
  },
  jp: {
    currency: 'JPY',
    note: 'The designated-school road, which most take: the school tests the driving itself, and the test center sets only the written exam. The beginner’s mark for a year isn’t kept.',
    steps: [
      { id: 'school', kind: 'course', name: 'Designated Driving School', fee: 323_488, feeBasis: 'The Retail Price Survey’s June 2026 price for an automatic course, ¥323,488, read from a table of it; whether it’s national or Tokyo’s wards wasn’t confirmed.', minutes: 100, sessions: 30, everyDays: 1,
        grants: { stage: 'learner', name: 'Kari-Menkyo', years: 0.5, alone: false },
        note: 'Theory and practice, the school’s provisional test and its graduation test; the provisional license runs six months.', source: 'https://price.w3g.jp/driving-school' },
      { id: 'written', kind: 'test', name: 'Written Exam', fee: 1900, minutes: 60, pass: 'jp-written', retakeDays: 1, retakeFee: 1900, issueFee: 2350,
        grants: { stage: 'full', name: 'Futsū Jidōsha Menkyo', years: 3, alone: true },
        note: 'At the test center, weekdays; ¥2,350 for the card on passing.' },
    ],
  },
  kr: {
    currency: 'KRW',
    note: 'The test center’s road; the two novice years aren’t kept.',
    steps: [
      { id: 'safety', kind: 'course', name: 'Traffic Safety Education', fee: 0, minutes: 60, sessions: 1,
        note: 'An hour, before the knowledge test.' },
      { id: 'aptitude', kind: 'office', name: 'Aptitude Exam', fee: 7000, minutes: 30,
        note: 'At the test center, with three photos.' },
      { id: 'knowledge', kind: 'test', name: 'Knowledge Test', fee: 10_000, minutes: 40, pass: 'kr-knowledge', retakeDays: 1, retakeFee: 10_000, note: 'At the test center.' },
      { id: 'skill', kind: 'test', name: 'Skill Test', fee: 25_000, minutes: 20, pass: 'kr-skill', retakeDays: 3, retakeFee: 25_000, note: 'On the center’s course.' },
      { id: 'practice', kind: 'office', name: 'Practice License', fee: 4000, minutes: 20,
        grants: { stage: 'learner', name: 'Yeonseup Myeonheo', years: 1, alone: false },
        note: 'Road practice beside a driver licensed for the class.' },
      { id: 'road', kind: 'test', name: 'Road Test', fee: 30_000, minutes: 30, pass: 'kr-road', retakeDays: 3, retakeFee: 30_000, issueFee: 10_000,
        grants: { stage: 'full', name: 'Class 2 Ordinary License', years: 10, alone: true },
        note: '₩10,000 for the license on passing.' },
    ],
  },
  'mx-cmx': {
    currency: 'MXN',
    note: 'A practical test was announced on 21 September 2026 without a start date or a fee; SLATE doesn’t ask it until one is published.',
    steps: [
      { id: 'exam', kind: 'test', name: 'Theory Exam', fee: 0, minutes: 30, pass: 'mx-cmx-theory', retakeDays: 1,
        note: 'Online: twenty questions, 8 of 10 to pass.' },
      { id: 'license', kind: 'office', name: 'Tipo A License', fee: 1142, minutes: 45,
        grants: { stage: 'full', name: 'Licencia Tipo A', years: 3, alone: true },
        note: 'With identity, CURP and proof of a Mexico City address.' },
    ],
  },
  'au-nsw': {
    currency: 'AUD',
    note: 'Under twenty-five, the learner license is held ten months with 120 logbook hours, which SLATE counts as supervised drives beside a licensed driver; at twenty-five or over there’s no minimum. Then twelve months on P1 and twenty-four on P2.',
    steps: [
      { id: 'dkt', kind: 'test', name: 'Driver Knowledge Test', fee: 58, minutes: 45, pass: 'au-nsw-dkt', retakeDays: 1, retakeFee: 58, note: 'At a service center, $58 an attempt.' },
      { id: 'learner', kind: 'office', name: 'Learner Licence', fee: 32, minutes: 30,
        grants: { stage: 'learner', name: 'Learner Licence', years: 5, alone: false },
        note: 'L plates, a supervisor beside you, 90 km/h at most.' },
      { id: 'logbook', kind: 'course', name: 'Logbook Hours', fee: 0, feeBasis: 'Driving beside a family member or friend with a full license costs nothing but the car.', minutes: 120, sessions: 60, everyDays: 3, under: 25,
        note: '120 hours, twenty at night.' },
      { id: 'hpt', kind: 'test', name: 'Hazard Perception Test', fee: 58, minutes: 30, needs: ['learner'], pass: 'au-nsw-hpt', retakeDays: 1, retakeFee: 58, note: 'Before the driving test, $58 an attempt.' },
      { id: 'dt', kind: 'test', name: 'Driving Test', fee: 72, minutes: 45, needs: ['hpt', 'logbook'], wait: { days: 304, since: 'learner' }, pass: 'au-nsw-dt', retakeDays: 7, issueFee: 74,
        grants: { stage: 'provisional', name: 'Provisional P1 Licence', years: 1.5, alone: true },
        note: 'Under twenty-five, ten months on the learner license first; $74 for P1 on passing.' },
      { id: 'p2', kind: 'office', name: 'P2 Licence', fee: 115, minutes: 30, wait: { days: 365, since: 'dt' },
        grants: { stage: 'provisional', name: 'Provisional P2 Licence', years: 2.5, alone: true },
        note: 'Twelve months on P1.' },
      { id: 'full', kind: 'office', name: 'Unrestricted Licence', fee: 234, minutes: 30, wait: { days: 730, since: 'p2' },
        grants: { stage: 'full', name: 'Unrestricted Licence', years: 5, alone: true },
        note: 'Twenty-four months on P2 and an eyesight test; no test since the DQT was abolished.' },
    ],
  },
  br: {
    currency: 'BRL',
    note: 'Resolution CONTRAN 1.020 of December 2025: the theory course free, a driving school no longer compulsory, and two hours’ lessons the least. The Permissão para Dirigir becomes the definitive CNH after a year without a serious infraction, which SLATE doesn’t keep.',
    steps: [
      { id: 'course', kind: 'course', name: 'Theory Course', fee: 0, minutes: 120, sessions: 5, everyDays: 1, note: 'Free, in the CNH do Brasil app.' },
      { id: 'medical', kind: 'office', name: 'Medical And Psychological Exams', fee: 180, minutes: 90,
        note: 'R$90 each at an accredited clinic, DETRAN-SP’s CNH Paulista price.' },
      { id: 'theory', kind: 'test', name: 'Theory Exam', fee: 52.83, minutes: 60, needs: ['course', 'medical'], pass: 'br-theory', retakeDays: 7, retakeFee: 52.83,
        grants: { stage: 'learner', name: 'LADV', years: 1, yearsEstimated: true, alone: false },
        note: 'Thirty questions, twenty to pass.' },
      { id: 'lessons', kind: 'course', name: 'Practical Lessons', fee: 2 * MIDPOINT(100, 150), feeBasis: 'Two lessons at R$125, the middle of the R$100 to R$150 São Paulo instructors charge (March 2026).', minutes: 60, sessions: 2, everyDays: 2,
        note: 'Two hours the least, with an autoescola or an accredited instructor.', source: 'https://www.estudacnh.com.br/blog/quanto-custa-cnh-sp' },
      { id: 'toxicology', kind: 'office', name: 'Toxicology Test', fee: MIDPOINT(130, 180), feeBasis: 'The middle of R$130 to R$180 at São Paulo labs (August 2026).', minutes: 30, from: '2026-06-17',
        note: 'Negative, before a first CNH.', source: 'https://climec.com.br/blog/quanto-custa-o-exame-toxicologico-em-sao-paulo-guia-de-precos-2026/' },
      { id: 'road', kind: 'test', name: 'Practical Exam', fee: 52.83, minutes: 30, pass: 'br-road', retakeDays: 15, retakeFee: 52.83,
        grants: { stage: 'provisional', name: 'Permissão Para Dirigir', years: 1, alone: true },
        note: 'The digital license free; the card R$137.79, which SLATE doesn’t charge.' },
      { id: 'cnh', kind: 'office', name: 'Definitive CNH', fee: 0, minutes: 20, wait: { days: 365, since: 'road' },
        grants: { stage: 'full', name: 'CNH Categoria B', years: 10, alone: true },
        note: 'A year on the permission.' },
    ],
  },
  nz: {
    currency: 'NZD',
    note: 'The fees cover two attempts at each test; a third costs more. From 25 January 2027 the full test goes and the restricted stage is twelve months.',
    steps: [
      { id: 'learner', kind: 'test', name: 'Learner Licence', fee: 96.1, minutes: 45, pass: 'nz-theory', retakeDays: 1, covered: { by: 'learner', attempts: 2 }, retakeFee: 54.6,
        grants: { stage: 'learner', name: 'Learner Licence', years: 10, yearsEstimated: true, alone: false },
        note: 'The theory test, with the application.' },
      { id: 'restricted', kind: 'test', name: 'Restricted Test', fee: 167.5, minutes: 45, wait: { days: 183, since: 'learner' }, pass: 'nz-restricted', retakeDays: 7, retakeFee: 102.8,
        grants: { stage: 'provisional', name: 'Restricted Licence', years: 10, yearsEstimated: true, alone: true },
        note: 'Six months on the learner license. Alone from 5am to 10pm, and no passengers without a supervisor.' },
      { id: 'full', kind: 'test', name: 'Full Test', fee: 98.9, minutes: 30, wait: { days: 548, since: 'restricted' }, under: 25, until: '2027-01-25', pass: 'nz-full', retakeDays: 7, retakeFee: 71.9,
        grants: { stage: 'full', name: 'Full Licence', years: 10, alone: true },
        note: 'Eighteen months restricted, under twenty-five.' },
      { id: 'full25', kind: 'test', name: 'Full Test', fee: 98.9, minutes: 30, needs: ['restricted'], wait: { days: 183, since: 'restricted' }, over: 25, until: '2027-01-25', pass: 'nz-full', retakeDays: 7, retakeFee: 71.9,
        grants: { stage: 'full', name: 'Full Licence', years: 10, alone: true },
        note: 'Six months restricted, at twenty-five or over.' },
      { id: 'full2027', kind: 'office', name: 'Full Licence', fee: 25.9, minutes: 20, needs: ['restricted'], wait: { days: 365, since: 'restricted' }, from: '2027-01-25',
        grants: { stage: 'full', name: 'Full Licence', years: 10, alone: true },
        note: 'Twelve months restricted, with no test, from 25 January 2027.' },
    ],
  },
  lv: {
    currency: 'EUR',
    note: 'CSDD’s own pages couldn’t be read; its fees are as reported, and where two reports differ, the newer is used.',
    steps: [
      { id: 'medical', kind: 'office', name: 'Medical Certificate', fee: 0, feeBasis: 'Set by the doctor; SLATE has no figure and charges nothing for it.', minutes: 45, note: 'Fitness to drive.' },
      { id: 'school', kind: 'course', name: 'Driving School', fee: MIDPOINT(600, 1000), feeBasis: 'The middle of €600 to €1,000 as a budget, June 2026; schools set their prices.', minutes: 90, sessions: 20, everyDays: 3,
        grants: { stage: 'learner', name: 'Learner Driver’s Permit', years: 3, alone: false },
        note: 'Compulsory; the learner’s permit is good in Latvia only.', source: 'https://www.steerclear.io/lv/cik-maksa-vaditaja-apliecibas-iegusana' },
      { id: 'theory', kind: 'test', name: 'Theory Exam', fee: 11.4, minutes: 30, pass: 'lv-theory', retakeDays: 1, retakeFee: 11.4, validDays: 365,
        note: 'The driving exam within a year of passing.' },
      { id: 'driving', kind: 'test', name: 'Driving Exam', fee: 35.82, feeBasis: '€35.82 from March 2026, the car’s hire not in it; another report gives €50.57.', minutes: 40, pass: 'lv-driving', retakeDays: 7, retakeFee: 35.82, issueFee: 22.41,
        grants: { stage: 'full', name: 'Vadītāja Apliecība B', years: 10, alone: true },
        note: '€22.41 for the license on passing; another report gives €5.42.' },
    ],
  },
};

export interface PassRate {
  kind: 'theory' | 'road';
  /** Passes over tests taken, every attempt counted; null where nobody publishes it. */
  rate: number | null;
  period?: string;
  source?: string;
}

/**
 * Each test's pass rate, researched on 2026-09-29: passes over tests taken,
 * every attempt counted, which is the chance of any one attempt. Where no
 * authority publishes one (Connecticut, Iceland, Brazil, Mexico City, South
 * Korea, and most written tests in North America and Australia), SLATE
 * doesn't borrow a figure from a website: `passRate` takes the mean of the
 * published rates of the same kind of test, and says so.
 */
export const PASS_RATES: Readonly<Record<string, PassRate>> = {
  'us-ny-knowledge': { kind: 'theory', rate: null },
  'us-ny-road': { kind: 'road', rate: 0.57, period: '2024, to 29 November', source: 'NY DMV figures reported by Gothamist, https://gothamist.com/news/nearly-half-of-nycs-aspiring-drivers-failed-their-dmv-road-tests-this-year' },
  'us-ct-knowledge': { kind: 'theory', rate: null },
  'us-ct-road': { kind: 'road', rate: null },
  'us-ca-knowledge': { kind: 'theory', rate: null },
  'us-ca-road': { kind: 'road', rate: 0.668, period: '2025', source: 'California DMV drive-test data as reported by Zutobi, https://zutobi.com/us/driver-guides/california-driving-test-pass-rates-1-in-3-fail-official-dmv-data; may include motorcycle tests' },
  'gb-theory': { kind: 'theory', rate: 0.448, period: 'April 2025 to March 2026', source: 'DVSA table DRT111a' },
  'gb-practical': { kind: 'road', rate: 0.5, period: 'April 2025 to March 2026', source: 'DVSA table DRT121a' },
  'gb-nir-theory': { kind: 'theory', rate: 0.432, period: 'April 2025 to March 2026', source: 'DfI driver, vehicle, operator and enforcement statistics 2025-26, section 3' },
  'gb-nir-practical': { kind: 'road', rate: 0.527, period: 'April 2025 to March 2026', source: 'DfI driver, vehicle, operator and enforcement statistics 2025-26, section 4' },
  'ca-on-knowledge': { kind: 'theory', rate: null },
  'ca-on-g2': { kind: 'road', rate: 0.69, period: '2022', source: 'DriveTest figures obtained by CBC under freedom of information, G2 and G together, https://www.cbc.ca/news/canada/hamilton/ontario-drive-test-pass-rates-1.6928311' },
  'ca-on-g': { kind: 'road', rate: 0.69, period: '2022', source: 'DriveTest figures obtained by CBC under freedom of information, G2 and G together' },
  'ca-bc-knowledge': { kind: 'theory', rate: null },
  'ca-bc-class7': { kind: 'road', rate: 0.5, period: 'fiscal 2019/20', source: 'ICBC, “about 50%”, https://www.icbc.com/about-icbc/newsroom/2020-aug28' },
  'ca-bc-class5': { kind: 'road', rate: 0.5, period: 'fiscal 2019/20', source: 'ICBC, “about 50%” of road tests' },
  'ie-theory': { kind: 'theory', rate: null },
  'ie-test': { kind: 'road', rate: 0.518, period: '2025', source: 'CSO table ROA31, the RSA’s monthly rates weighted by tests delivered' },
  'is-theory': { kind: 'theory', rate: null },
  'is-practical': { kind: 'road', rate: null },
  'de-theory': { kind: 'theory', rate: 0.56, period: '2025', source: 'TÜV-Verband, class B and BF17, https://www.tuev-verband.de/pressemitteilungen/zahl-der-fuehrerscheinpruefungen-auf-neuem-hoechststand' },
  'de-practical': { kind: 'road', rate: 0.63, period: '2025', source: 'TÜV-Verband, class B and BF17' },
  'fr-code': { kind: 'theory', rate: 0.493, period: '2025', source: 'Sécurité routière’s annual review of the license exams, as cited' },
  'fr-exam': { kind: 'road', rate: 0.599, period: '2025', source: 'Sécurité routière’s annual review of the license exams, as cited' },
  'es-theory': { kind: 'theory', rate: null },
  'es-practical': { kind: 'road', rate: 0.469, period: 'June 2026', source: 'DGT exam microdata for one month, as worked by misfaltasdeconducir.com' },
  'jp-written': { kind: 'theory', rate: 0.728, period: '2025', source: 'National Police Agency, 運転免許統計 令和7年版' },
  'kr-knowledge': { kind: 'theory', rate: null },
  'kr-skill': { kind: 'road', rate: null },
  'kr-road': { kind: 'road', rate: null },
  'mx-cmx-theory': { kind: 'theory', rate: null },
  'au-nsw-dkt': { kind: 'theory', rate: null },
  'au-nsw-hpt': { kind: 'theory', rate: null },
  'au-nsw-dt': { kind: 'road', rate: 0.54, period: '2025', source: 'Transport for NSW open data, small counts suppressed, so 0.54 to 0.58' },
  'br-theory': { kind: 'theory', rate: null },
  'br-road': { kind: 'road', rate: null },
  'nz-theory': { kind: 'theory', rate: 0.643, period: '2025', source: 'NZTA driver license pass rates, https://opendata-nzta.opendata.arcgis.com/datasets/NZTA::driver-licence-pass-rates-dataset/about' },
  'nz-restricted': { kind: 'road', rate: 0.533, period: '2025', source: 'NZTA driver license pass rates' },
  'nz-full': { kind: 'road', rate: 0.597, period: '2025', source: 'NZTA driver license pass rates' },
  'lv-theory': { kind: 'theory', rate: null },
  'lv-driving': { kind: 'road', rate: 0.33, period: 'May 2024 to May 2025, first attempts', source: 'CSDD figures reported by LSM' },
};

/** The mean of the published rates of a kind of test: SLATE's figure where a test has none. */
export function publishedMean(kind: PassRate['kind']): number {
  const rates = Object.values(PASS_RATES).filter((r) => r.kind === kind && r.rate !== null).map((r) => r.rate!);
  return rates.reduce((a, b) => a + b, 0) / rates.length;
}

/** A test's pass rate, and whether it is published or SLATE's. */
export function passRate(key: string): { rate: number; published: boolean; basis: string } {
  const r = PASS_RATES[key];
  if (r?.rate != null) return { rate: r.rate, published: true, basis: `${Math.round(r.rate * 100)}% passed, ${r.period}: ${r.source}.` };
  const kind = r?.kind ?? 'road';
  const mean = publishedMean(kind);
  return { rate: mean, published: false, basis: `Nobody publishes this test’s pass rate; SLATE uses ${Math.round(mean * 100)}%, the mean of the ${kind === 'theory' ? 'written' : 'road'} tests that publish one.` };
}
