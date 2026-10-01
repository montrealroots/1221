/**
 * SLATE — the road to a motorcycle license, step by step, where SLATE sells
 * motorcycles (from 2026-09-30), read from the authorities' pages in
 * `docs/research/world/research-vehicle-kinds.json` and
 * `docs/research/world/research-kind-effects.json`. The same steps as a car's
 * (`content/licensepaths.ts`), run by the same machinery on their own track.
 *
 * The path is an adult's at twenty-four and over, the age a life begins.
 * Britain and Ireland give category A, unrestricted, directly from
 * twenty-four. Their progressive routes through A1 and A2 are for younger
 * riders, from 2026-09-30 (`research-vehicles5.json`): Britain's A2 from 19,
 * then A from 21 after two years on it; Ireland's A2 from 18, then A from 20
 * after two years on it. A life begins at twenty-four, where direct access is
 * open to it and shorter, so it never takes either.
 *
 * A training course that stands in for a test, from the same date: New
 * York's MSF Basic RiderCourse for its road test, and California's CMSP
 * course for its skills test. Each is a second way past the permit, beside
 * the test, and the first done ends the path. A test
 * whose pass rate nobody publishes is passed at SLATE's mean of those that
 * do, and says so. A course whose price no authority sets is at a named
 * school's published price, or the middle of a published range, and says so.
 */

import type { LicensePath } from './licensepaths';

export const MOTORCYCLE_PATHS: Readonly<Record<string, LicensePath>> = {
  'us-ny': {
    currency: 'USD',
    note: 'Adding class M to a New York license: the motorcycle permit test, then the road test on your own motorcycle, a licensed driver following in a car. Or, in place of the road test, the MSF Basic RiderCourse at an approved provider.',
    steps: [
      { id: 'permit', kind: 'test', name: 'Motorcycle Permit Test', fee: 68.75, minutes: 60, pass: 'moto-theory', retakeDays: 1, retakeFee: 0,
        grants: { stage: 'learner', name: 'Motorcycle Learner Permit', years: 5, yearsEstimated: true, alone: false },
        note: 'The written motorcycle test at the DMV; riding with a licensed motorcyclist in sight. $68.75, the fee table’s for 21 and over outside the Metropolitan Commuter Transportation District; it covers the permit and the license.' },
      { id: 'road', kind: 'test', name: 'Motorcycle Road Test', fee: 0, minutes: 45, pass: 'moto-road', retakeDays: 14, retakeFee: 0,
        grants: { stage: 'full', name: 'Class M Motorcycle License', years: 8, alone: true },
        note: 'On your own motorcycle, with an accompanying licensed driver in a car.' },
      { id: 'brc', kind: 'course', name: 'MSF Basic RiderCourse', fee: 321, feeBasis: 'Mohawk Valley Community College’s price through Go Motorcycling; the DMV sets none. Its length is SLATE’s estimate, California’s like course’s sixteen hours.', source: 'https://www.gomotorcycling.net/basic-ridercourse/', minutes: 480, sessions: 2, everyDays: 1, needs: ['permit'],
        grants: { stage: 'full', name: 'Class M Motorcycle License', years: 8, alone: true },
        note: 'At an approved provider, the bike and helmet theirs; the DMV waives the road test for it.' },
    ],
  },
  'us-ct': {
    currency: 'USD',
    note: 'A Connecticut license holder adds the M endorsement: the knowledge and vision test, the learner permit, the novice course, and the endorsement. The course replaces a road test.',
    steps: [
      { id: 'knowledge', kind: 'test', name: 'Motorcycle Knowledge Test', fee: 40, minutes: 60, pass: 'moto-theory', retakeDays: 7, retakeFee: 40,
        note: 'Knowledge and vision, for the learner permit.' },
      { id: 'permit', kind: 'office', name: 'Motorcycle Learner Permit', fee: 16, minutes: 30,
        grants: { stage: 'learner', name: 'Motorcycle Learner’s Permit', years: 1, yearsEstimated: true, alone: true },
        note: 'Riding alone, with no passenger.' },
      { id: 'course', kind: 'course', name: 'Novice Motorcycle Course', fee: 260, feeBasis: 'CT State Community College’s price for the CONREP Basic Rider Course, set by contract in April 2026.', minutes: 480, sessions: 2, everyDays: 1,
        note: 'The CONREP Basic Rider Course, required, its completion good two years.', source: 'https://ctstate.edu/workforce-development/motorcycle-courses' },
      { id: 'endorsement', kind: 'office', name: 'M Endorsement', fee: 30, minutes: 30,
        grants: { stage: 'full', name: 'Motorcycle Endorsement', years: 6, alone: true },
        note: 'Added to the license at the DMV.' },
    ],
    needsCar: 'Connecticut adds the M endorsement to a license it has issued: a Connecticut license first.',
  },
  'us-ca': {
    currency: 'USD',
    note: 'At 21 and over no instruction permit is asked: the application, the knowledge test, and the DMV’s skills test. Or, in place of the skills test, the California Motorcyclist Safety Program’s course and its DL 389.',
    steps: [
      { id: 'application', kind: 'office', name: 'M1 Application', fee: 46, minutes: 60,
        note: 'Adding M1 to a class C license, or an original application: $46.' },
      { id: 'knowledge', kind: 'test', name: 'Motorcycle Knowledge Test', fee: 0, minutes: 45, pass: 'moto-theory', retakeDays: 1, retakeFee: 7,
        note: 'A retest is $7.' },
      { id: 'skills', kind: 'test', name: 'Motorcycle Skills Test', fee: 0, minutes: 30, pass: 'moto-road', retakeDays: 14,
        grants: { stage: 'full', name: 'Class M1 License', years: 5, alone: true },
        note: 'At the DMV, on your own motorcycle.' },
      { id: 'cmsp', kind: 'course', name: 'Motorcyclist Training Course', fee: 425, feeBasis: 'Motorcycle Rider Education Corp’s price at 21 and over, a CMSP training site; the DMV sets none.', source: 'https://www.mre-corp.com/training/get-licensed/', minutes: 480, sessions: 2, everyDays: 1, needs: ['knowledge'],
        grants: { stage: 'full', name: 'Class M1 License', years: 5, alone: true },
        note: 'About sixteen hours; its DL 389, taken to the DMV within twelve months, waives the skills test.' },
    ],
  },
  gb: {
    currency: 'GBP',
    note: 'Direct access to category A at twenty-four: Compulsory Basic Training, the theory test, and the two practical modules. A full car license carries the provisional motorcycle entitlement; without one, the provisional license comes first.',
    steps: [
      { id: 'provisional', kind: 'office', name: 'Provisional Licence', fee: 34, minutes: 20, issueDays: 7, unlessCarLicense: 'gb',
        note: 'Online, £34.' },
      { id: 'cbt', kind: 'course', name: 'Compulsory Basic Training', fee: 195, feeBasis: 'Edinburgh Motorcycle Training’s weekday price; the DVSA sets none, and other schools charge £180 to £225.', source: 'https://edinburghmotorcycletraining.com/courses-and-price-list', minutes: 480, sessions: 1, validDays: 730,
        grants: { stage: 'learner', name: 'CBT, L Plates', years: 2, alone: true },
        note: 'A day with an approved trainer; then up to 125cc on L plates, no passenger, no motorway. Its certificate lasts two years.' },
      { id: 'theory', kind: 'test', name: 'Motorcycle Theory Test', fee: 23, minutes: 60, pass: 'moto-theory', retakeDays: 3, validDays: 730,
        note: 'Multiple choice and hazard perception; a pass stands two years.' },
      { id: 'module1', kind: 'test', name: 'Module 1, Off-Road', fee: 15.5, minutes: 20, pass: 'gb-moto-mod1', retakeDays: 3,
        note: 'Manoeuvres on a test center’s pad.' },
      { id: 'module2', kind: 'test', name: 'Module 2, On-Road', fee: 75, minutes: 40, pass: 'gb-moto-mod2', retakeDays: 10,
        grants: { stage: 'full', name: 'Full Licence, Category A', years: 10, alone: true },
        note: '£75 on a weekday, £88.50 evenings and weekends.' },
    ],
  },
  ie: {
    currency: 'EUR',
    note: 'Category A directly at twenty-four: the theory test, the learner permit, Initial Basic Training with an approved instructor, and the test. The six months on a permit asked before a car test isn’t kept for a motorcycle, as no page read said it applies.',
    steps: [
      { id: 'theory', kind: 'test', name: 'Driver Theory Test', fee: 45, minutes: 45, pass: 'moto-theory', retakeDays: 3, validDays: 730,
        note: 'Category A or B, the same test.' },
      { id: 'permit', kind: 'office', name: 'Learner Permit, Category A', fee: 45, minutes: 30,
        grants: { stage: 'learner', name: 'Learner Permit, Category A', years: 2, alone: false },
        note: 'Good for two years.' },
      { id: 'ibt', kind: 'course', name: 'Initial Basic Training', fee: 600, feeBasis: 'Roadcraft Motorcycle Training’s price for category A, its bike, insurance and gear included; the RSA sets none.', source: 'https://roadcraft.ie/prices.html', minutes: 360, sessions: 3, everyDays: 7,
        grants: { stage: 'learner', name: 'Learner Permit, Category A, With IBT', years: 2, alone: true },
        note: 'Eighteen hours for category A, and then riding alone on the permit.' },
      { id: 'test', kind: 'test', name: 'Motorcycle Test', fee: 85, minutes: 45, pass: 'moto-road', retakeDays: 14, issueFee: 65,
        grants: { stage: 'full', name: 'Full Licence, Category A', years: 10, alone: true },
        note: '€85, and €65 for the ten-year license on passing.' },
    ],
  },
  'ca-on': {
    currency: 'CAD',
    note: 'Ontario’s graduated motorcycle licensing: M1 for at least 60 days, M2 for 22 months (18 with an approved course, which SLATE doesn’t offer), then M.',
    steps: [
      { id: 'm1', kind: 'test', name: 'M1 Knowledge Test', fee: 78.75, minutes: 60, pass: 'moto-theory', retakeDays: 1, retakeFee: 16,
        grants: { stage: 'learner', name: 'M1 Licence', years: 90 / 365, alone: true },
        note: 'The package covers the M2 road test and a 90-day license: daylight only, no passengers, no roads over 80 km/h. As commonly cited; DriveTest’s page wasn’t read.' },
      { id: 'm2', kind: 'test', name: 'M2 Road Test', fee: 0, minutes: 30, wait: { days: 60, since: 'm1' }, pass: 'moto-road', retakeDays: 10, retakeFee: 53.75,
        grants: { stage: 'provisional', name: 'M2 Licence', years: 5, alone: true },
        note: 'At least 60 days after the M1.' },
      { id: 'm', kind: 'test', name: 'M Road Test', fee: 91.25, minutes: 45, wait: { days: 670, since: 'm2' }, pass: 'moto-road', retakeDays: 10,
        grants: { stage: 'full', name: 'M Licence', years: 5, alone: true },
        note: 'Twenty-two months after the M2.' },
    ],
  },
  'ca-bc': {
    currency: 'CAD',
    note: 'A holder of a Class 5 or 7 license adds Class 6: the knowledge test, the skills test fourteen days on, the road test thirty days on, and $17 for the license. A new rider without one takes the Class 8 graduated program: a learner twelve months, a novice twenty-four, then the Class 6 road test.',
    steps: [
      { id: 'knowledge', kind: 'test', withCarLicense: 'ca-bc', name: 'Motorcycle Knowledge Test', fee: 15, minutes: 60, pass: 'moto-theory', retakeDays: 1, retakeFee: 15,
        grants: { stage: 'learner', name: 'Class 6 Learner Licence', years: 1, yearsEstimated: true, alone: false },
        note: 'Riding in sight of a supervisor, no passengers, 60 km/h at most, daylight only.' },
      { id: 'skills', kind: 'test', withCarLicense: 'ca-bc', name: 'Motorcycle Skills Test', fee: 0, minutes: 30, wait: { days: 14, since: 'knowledge' }, pass: 'moto-road', retakeDays: 7,
        grants: { stage: 'learner', name: 'Class 6 Learner Licence, Skills Passed', years: 1, yearsEstimated: true, alone: true },
        note: 'Then riding without a supervisor in sight.' },
      { id: 'road', kind: 'test', withCarLicense: 'ca-bc', name: 'Class 6 Road Test', fee: 50, minutes: 45, wait: { days: 30, since: 'knowledge' }, pass: 'moto-road', retakeDays: 7, issueFee: 17,
        grants: { stage: 'full', name: 'Class 6 Licence', years: 5, alone: true },
        note: '$50, and $17 for the license where the one you hold runs more than six months yet.' },
      // The Class 8 program, from 2026-09-30: ICBC's MV2023 (revision 03/2026), read in `research-vehicles5.json`.
      { id: 'knowledge8', kind: 'test', withoutCarLicense: 'ca-bc', name: 'Motorcycle Knowledge Test', fee: 15, minutes: 60, pass: 'moto-theory', retakeDays: 1, retakeFee: 15,
        grants: { stage: 'learner', name: 'Class 8L Learner Licence', years: 2, yearsEstimated: true, alone: false },
        note: 'Daylight only, in sight of a supervisor of 25 or older holding Class 6, 60 km/h at most, no passengers, the L sign shown. Its term wasn’t read; lapsed, the knowledge test is taken again.' },
      { id: 'skills8', kind: 'test', withoutCarLicense: 'ca-bc', name: 'Motorcycle Skills Test', fee: 0, minutes: 30, wait: { days: 30, since: 'knowledge8' }, pass: 'moto-road', retakeDays: 7,
        grants: { stage: 'learner', name: 'Class 8L Learner Licence, Skills Passed', years: 2, yearsEstimated: true, alone: true },
        note: 'Thirty days on the learner license; it lifts the supervisor and the speed limit. Its fee wasn’t captured.' },
      { id: 'road8', kind: 'test', withoutCarLicense: 'ca-bc', name: 'Class 8 Road Test', fee: 35, minutes: 45, wait: { days: 365, since: 'knowledge8' }, pass: 'moto-road', retakeDays: 7, issueFee: 75,
        grants: { stage: 'provisional', name: 'Class 8 Novice Licence', years: 5, yearsEstimated: true, alone: true },
        note: 'Twelve months on the learner license; $35, and $75 for the novice license.' },
      { id: 'road6', kind: 'test', withoutCarLicense: 'ca-bc', name: 'Class 6 Road Test', fee: 50, minutes: 45, wait: { days: 730, since: 'road8' }, pass: 'moto-road', retakeDays: 7, issueFee: 17,
        grants: { stage: 'full', name: 'Class 6 Licence', years: 5, alone: true },
        note: 'Twenty-four months a novice; $50, and $17 for the license, Class 6’s figures, the novice’s exit fee not read apart.' },
    ],
  },
  'mx-cmx': {
    currency: 'MXN',
    note: 'Mexico City’s A1 license, for motorcycles: the competency certificate from an accredited evaluator under CONOCER’s standard, then the license from SEMOVI, good three years.',
    steps: [
      { id: 'conocer', kind: 'test', name: 'Riding Competency Certificate', fee: 980, feeBasis: 'The middle of MXN 460 to 1,500, what accredited evaluators charge; no authority sets it.', minutes: 120, pass: 'moto-road', retakeDays: 7,
        note: 'The EC1631 motorcycle-riding standard, from an evaluator CONOCER accredits.' },
      { id: 'a1', kind: 'office', name: 'Licencia Tipo A1', fee: 572, minutes: 60,
        grants: { stage: 'full', name: 'Licencia Tipo A1', years: 3, alone: true },
        note: 'MXN 572, by appointment through Llave CDMX (Código Fiscal art. 229).' },
    ],
  },
};
