/**
 * SLATE — the job you had before any of this.
 *
 * Not a career. The Saturday job: a checkout, a café, a paper round, a
 * warehouse night. It pays badly, it teaches more than it pays, and it is the
 * first money anybody ever earns that is genuinely theirs.
 *
 * What is real in here: the national minimum wage, which is published, and
 * the fact that several rich countries do not have one at all and set the
 * floor by collective bargaining instead — which is the most surprising true
 * thing in this file and the reason it is worth carrying. What is SLATE's
 * own: every employer, every shift and every rota.
 */

import type { Money } from '../core/money';

export const LOCAL_NOTE =
  'A minimum wage is national in most countries and set below the nation in some: the United States '
  + 'lets states and cities set their own and more than half of them do, and China, Japan, Mexico, '
  + 'India, Indonesia, Vietnam, the Philippines, Pakistan and Russia all set theirs by province or '
  + 'prefecture. Where that is true SLATE lifts the floor with what the city costs; where it is not, '
  + 'the floor is the same in the capital as it is anywhere else, because that is how it works.';

export const WAGE_NOTE =
  'The national minimum wage is a published figure and every country sets it differently: some by '
  + 'the hour, some by the month, some by the day, and several rich ones not at all. SLATE carries '
  + 'the hourly floor converted into the game’s single currency and rounded, so treat the number as '
  + 'the right order of thing rather than the exact statute, and the year it was set as the year it '
  + 'was set.';

export const NO_MINIMUM_NOTE =
  'Denmark, Sweden, Norway, Finland, Iceland, Italy, Austria and Switzerland have no statutory '
  + 'national minimum wage. That is not an oversight: pay floors there are set by collective '
  + 'agreement between unions and employers, sector by sector, and they are generally high. SLATE '
  + 'carries the typical bargained floor for those countries and says that is what it is.';

export const JOB_NOTE =
  'Where the city has a real shop of the right kind, that is where the job is — which is the same '
  + 'fact as shopping there and says nothing about the company beyond that it employs people. '
  + 'Everywhere else the employer is SLATE’s own. The rota, every shift and everything anybody says '
  + 'are SLATE’s own everywhere: there is no listings feed. What it pays is the floor where you are '
  + 'standing, plus whatever the job is worth above it and less the young rate where one applies.';

export const YOUNG_NOTE =
  'A lot of countries let an employer pay a young worker less than the adult floor, by law: the '
  + 'United Kingdom has a rate for each age band, the United States has a training rate for the '
  + 'first ninety days, Australia has junior rates. That is why a sixteen year old’s hourly figure '
  + 'can sit below the headline minimum. How much less is SLATE’s own calibration of a real thing.';

// ---------------------------------------------------------------------------
// What the floor is, where you are standing
// ---------------------------------------------------------------------------

export interface WageFloor {
  countryId: string;
  /** The floor, per hour, in the game's currency. */
  perHour: Money;
  /** Whether the country has a statutory minimum at all. */
  statutory: boolean;
  /** The year the figure SLATE carries was set. */
  year: number;
  about: string;
}

function w(
  countryId: string, perHour: Money, statutory: boolean, year: number, about: string,
): WageFloor {
  return { countryId, perHour, statutory, year, about };
}

/**
 * The hourly floor, country by country.
 *
 * Converted and rounded into the game's single currency, which is why these
 * are the right order of thing rather than the statute itself.
 */
export const WAGE_FLOORS: readonly WageFloor[] = [
  // --- Statutory, and by the hour -----------------------------------------
  w('us', 7_25, true, 2009, 'The federal floor, unchanged since 2009. More than half the states set a higher one.'),
  w('uk', 14_50, true, 2024, 'The National Living Wage, for twenty one and over. Under that it is lower.'),
  w('ie', 13_70, true, 2024, 'One of the higher floors in Europe, and it moves every January.'),
  w('ca', 12_70, true, 2024, 'The federal floor. Every province sets its own and most are higher.'),
  w('au', 16_00, true, 2024, 'The highest statutory floor in the world, and a junior rate below it by age.'),
  w('nz', 14_20, true, 2024, 'Set every April, and a training rate below it.'),
  w('de', 13_40, true, 2024, 'The Mindestlohn, introduced in 2015 and raised every year since.'),
  w('fr', 12_60, true, 2024, 'The SMIC, which moves automatically with inflation.'),
  w('nl', 14_30, true, 2024, 'Hourly since 2024, having been a monthly figure before that.'),
  w('be', 12_60, true, 2024, 'Set nationally and topped up by sector agreements.'),
  w('es', 9_60, true, 2024, 'The SMI, a monthly figure divided out across fourteen payments a year.'),
  w('pt', 5_60, true, 2024, 'A monthly figure, and it has risen fast for a decade.'),
  w('gr', 5_50, true, 2024, 'A monthly figure, restored in stages after being cut in the crisis.'),
  w('pl', 6_90, true, 2024, 'Raised twice a year, in January and in July.'),
  w('cz', 5_00, true, 2024, 'One of the lower floors in the European Union.'),
  w('hu', 4_40, true, 2024, 'A monthly figure, with a higher one for skilled work.'),
  w('ro', 4_30, true, 2024, 'A monthly figure, and most of the labor market sits close to it.'),
  w('kr', 7_40, true, 2024, 'Set every year by a commission of unions, employers and the public.'),
  w('jp', 6_70, true, 2024, 'A weighted national average: every prefecture sets its own.'),
  w('il', 8_60, true, 2024, 'A monthly figure, and it applies from eighteen.'),
  w('tr', 5_30, true, 2024, 'A monthly figure, and it is raised more than once in a bad year.'),
  w('br', 1_60, true, 2024, 'A monthly figure, and it is the reference for most of the benefit system.'),
  w('mx', 1_80, true, 2024, 'A daily figure, with a higher one along the northern border.'),
  w('ar', 1_20, true, 2024, 'A monthly figure that is revised constantly because of inflation.'),
  w('cl', 3_20, true, 2024, 'A monthly figure, set by law each year.'),
  w('co', 1_60, true, 2024, 'A monthly figure, and a transport allowance is paid on top of it.'),
  w('za', 1_50, true, 2024, 'Hourly, introduced in 2019, and it covers domestic and farm work too.'),
  w('ng', 30, true, 2024, 'A monthly figure. It is low, it is disputed, and a great deal of work is outside it.'),
  w('ke', 60, true, 2024, 'Set by order, and it differs between the cities and the rest of the country.'),
  w('gh', 40, true, 2024, 'A daily figure, reviewed by a tripartite committee.'),
  w('in', 30, true, 2024, 'A national floor with no force behind it: the real figures are set by state and by trade.'),
  w('pk', 40, true, 2024, 'A monthly figure, set by province.'),
  w('bd', 30, true, 2024, 'Set by sector rather than nationally, and the garment figure is the one that is argued over.'),
  w('ph', 1_20, true, 2024, 'A daily figure, set by regional boards rather than nationally.'),
  w('id', 90, true, 2024, 'A monthly figure, set by province.'),
  w('vn', 80, true, 2024, 'A monthly figure, in four regional bands.'),
  w('th', 1_30, true, 2024, 'A daily figure, and it differs by province.'),
  w('my', 1_50, true, 2024, 'A monthly figure, and it applies to firms above a size.'),
  w('cn', 2_00, true, 2024, 'Set by province and by city rather than nationally.'),
  w('ru', 1_60, true, 2024, 'A monthly figure, and regions may set a higher one.'),
  w('ua', 1_00, true, 2024, 'A monthly figure, raised twice in 2024 and still among the lowest in Europe.'),
  w('jm', 2_00, true, 2024, 'A weekly figure, and it was raised sharply in 2024.'),
  w('tt', 3_00, true, 2024, 'Hourly, and one of the higher floors in the Caribbean.'),

  // --- No statutory minimum: the floor is bargained ------------------------
  w('dk', 20_00, false, 2024, 'No statutory minimum at all. The floor is bargained sector by sector and it is high.'),
  w('se', 17_00, false, 2024, 'No statutory minimum. Collective agreements cover almost the whole labor market.'),
  w('no', 19_00, false, 2024, 'No general statutory minimum; some sectors have one made binding by decree.'),
  w('fi', 15_00, false, 2024, 'No statutory minimum. Sector agreements set the floor and most are extended by law.'),
  w('is', 18_00, false, 2024, 'No statutory minimum. Agreements are made binding on everybody in the sector.'),
  w('it', 11_00, false, 2024, 'No statutory minimum, which is unusual for a country this size. Sector contracts do it.'),
  w('at', 13_00, false, 2024, 'No statutory minimum. Almost every worker is covered by a collective agreement anyway.'),
  w('ch', 22_00, false, 2024, 'No national minimum. Some cantons have set one, and Geneva’s is among the highest anywhere.'),
];

export const FLOOR_BY_COUNTRY: Readonly<Record<string, WageFloor>> = Object.fromEntries(
  WAGE_FLOORS.map((one) => [one.countryId, one]),
);

/**
 * Where the floor is really set below the nation.
 *
 * All of these set a minimum by state, province, prefecture or city rather
 * than only nationally, which is why a city that costs more pays more there
 * and does not in a country with one national figure.
 */
export const LOCAL_MINIMUMS: ReadonlySet<string> = new Set([
  'us', 'ca', 'cn', 'jp', 'mx', 'in', 'id', 'vn', 'ph', 'pk', 'ru',
]);

/** The floor everywhere SLATE does not carry a country of its own. */
export const WORLD_FLOOR: Money = 2_00;

/** What an hour is worth, where you are standing. */
export function floorIn(countryId: string): WageFloor {
  return FLOOR_BY_COUNTRY[countryId] ?? {
    countryId, perHour: WORLD_FLOOR, statutory: false, year: 2024,
    about: 'SLATE does not carry this country’s own figure, so this is its general floor.',
  };
}

/** Whether SLATE carries this country's own published figure. */
export function floorIsCountrys(countryId: string): boolean {
  return countryId in FLOOR_BY_COUNTRY;
}

/**
 * The rate a young worker is paid, as a share of the adult floor.
 *
 * Real in kind rather than in number: a lot of countries pay under eighteens
 * less by law, and where they do it is roughly this much less. SLATE's own
 * calibration of a real arrangement.
 */
export const YOUNG_RATE: readonly { fromAge: number; share: number }[] = [
  { fromAge: 13, share: 0.55 },
  { fromAge: 16, share: 0.72 },
  { fromAge: 18, share: 0.88 },
  { fromAge: 21, share: 1 },
];

export function youngShareAt(age: number): number {
  let share = YOUNG_RATE[0]!.share;
  for (const band of YOUNG_RATE) if (age >= band.fromAge) share = band.share;
  return share;
}

// ---------------------------------------------------------------------------
// The jobs themselves
// ---------------------------------------------------------------------------

export interface FirstJob {
  id: string;
  label: string;
  /** The age it is realistic to be doing it from. */
  fromAge: number;
  /** How much above the floor it pays, as a multiple. */
  premium: number;
  /** Hours in a shift. */
  hours: number;
  /** What it takes out of you, out of a hundred. */
  demand: number;
  /** What doing it teaches. */
  feeds: readonly { key: string; kind: 'skill' | 'attribute' }[];
  /** The kind of place it happens in, where the city has one. */
  placeKind?: string;
  about: string;
}

function j(
  id: string, label: string, fromAge: number, premium: number, hours: number, demand: number,
  feeds: readonly { key: string; kind: 'skill' | 'attribute' }[], about: string, placeKind?: string,
): FirstJob {
  return { id, label, fromAge, premium, hours, demand, feeds, about, placeKind };
}

export const FIRST_JOBS: readonly FirstJob[] = [
  j('paper_round', 'A Paper Round', 13, 0.9, 2, 14, [
    { key: 'punctuality', kind: 'attribute' }, { key: 'fitness', kind: 'skill' },
  ], 'Six in the morning, every morning, in whatever the weather is doing.'),
  j('babysitting', 'Babysitting', 14, 1.0, 4, 12, [
    { key: 'reliability', kind: 'attribute' }, { key: 'active_listening', kind: 'attribute' },
  ], 'Somebody else’s children, somebody else’s television, and a lift home at eleven.'),
  j('dog_walking', 'Walking Dogs', 14, 1.0, 3, 16, [
    { key: 'fitness', kind: 'skill' }, { key: 'reliability', kind: 'attribute' },
  ], 'Three at a time, in the rain, and one of them will not walk.'),
  j('shelf_stacking', 'Stacking Shelves', 15, 1.0, 6, 24, [
    { key: 'operations', kind: 'skill' }, { key: 'long_day_endurance', kind: 'attribute' },
  ], 'Facing up an aisle at seven in the morning before the doors open.', 'market'),
  j('checkout', 'The Checkout', 16, 1.05, 6, 22, [
    { key: 'public_speaking', kind: 'skill' }, { key: 'set_etiquette', kind: 'attribute' },
  ], 'Four hundred people an hour and every one of them wants something.', 'market'),
  j('cafe', 'A Café', 16, 1.05, 6, 26, [
    { key: 'operations', kind: 'skill' }, { key: 'social_instinct', kind: 'attribute' },
  ], 'Milk, steam, a queue and somebody who wants it made a different way.', 'cafe'),
  j('fast_food', 'The Counter', 16, 1.0, 6, 30, [
    { key: 'operations', kind: 'skill' }, { key: 'pressure_tolerance', kind: 'attribute' },
  ], 'A headset, a screen full of orders, and a lunch rush that does not end.', 'fast_food'),
  j('retail', 'A Saturday On The Shop Floor', 16, 1.05, 7, 22, [
    { key: 'public_speaking', kind: 'skill' }, { key: 'charisma', kind: 'attribute' },
  ], 'Folding the same jumper eleven times and asking if anybody needs a hand.', 'shop'),
  j('cinema', 'An Usher', 16, 1.0, 6, 20, [
    { key: 'visual_language', kind: 'skill' }, { key: 'set_etiquette', kind: 'attribute' },
  ], 'Tearing tickets, sweeping between screenings, and watching the ends of everything.', 'cinema'),
  j('car_wash', 'A Car Wash', 16, 1.0, 6, 34, [
    { key: 'fitness', kind: 'skill' }, { key: 'long_day_endurance', kind: 'attribute' },
  ], 'Cold water, a squeegee, and hands that do not warm up until Tuesday.'),
  j('kitchen_porter', 'The Back Of A Kitchen', 16, 1.05, 8, 36, [
    { key: 'cooking', kind: 'skill' }, { key: 'resilience', kind: 'attribute' },
  ], 'Pot wash, on a double, next to somebody shouting. It is the hardest of these.', 'restaurant'),
  j('lifeguard', 'Lifeguarding', 16, 1.1, 6, 20, [
    { key: 'fitness', kind: 'skill' }, { key: 'safety_awareness', kind: 'attribute' },
  ], 'Four hours of watching a pool where nothing happens, and everything depends on you if it does.'),
  j('warehouse', 'A Night In A Warehouse', 18, 1.2, 10, 42, [
    { key: 'operations', kind: 'skill' }, { key: 'long_day_endurance', kind: 'attribute' },
  ], 'Ten hours, a scanner, a target on a screen, and the radio on somebody else’s station.'),
  j('bar', 'Behind A Bar', 18, 1.15, 8, 32, [
    { key: 'public_speaking', kind: 'skill' }, { key: 'improvisation', kind: 'attribute' },
  ], 'Three deep, everybody catching your eye, and the last hour is the whole shift.', 'bar'),
];

export const JOB_BY_ID: Readonly<Record<string, FirstJob>> = Object.fromEntries(
  FIRST_JOBS.map((one) => [one.id, one]),
);

/** The jobs somebody this age could realistically be doing. */
export function jobsAt(age: number): FirstJob[] {
  return FIRST_JOBS.filter((one) => age >= one.fromAge);
}

/** How many shifts a week anybody works at this, on top of everything else. */
export const SHIFTS_A_WEEK = 2;

/** The employers, which are SLATE's own. */
export const EMPLOYER_FIRST: readonly string[] = [
  'Corner', 'Bridge', 'Market', 'Station', 'Harbor', 'Parkside', 'Grand', 'Old Mill', 'Riverside',
  'Central', 'The Green', 'Eastgate', 'Westfield', 'Kingsway', 'The Arcade',
];

export const EMPLOYER_SECOND: readonly string[] = [
  'Stores', 'Groceries', 'Coffee House', 'Kitchen', 'Supplies', 'Provisions', 'Trading',
  'Services', 'Company', 'Depot',
];
