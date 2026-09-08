/**
 * SLATE — the length of a life.
 *
 * How long people live where they live, when the state expects them to stop
 * working, and the ordinary words for the parts of a life. Two of those are
 * public record and one is SLATE's. The line between them is stated on screen
 * wherever any of it shows.
 *
 * Nothing in here tells the player when they are going to die, and nothing
 * built on it may. A character knows roughly how long people live where they
 * are from, the way anybody does. They do not know their own last day, and a
 * game that showed it would be showing something nobody could know.
 */

/**
 * What is real here and what is not.
 *
 * The expectancy and the pension age are published figures. Everything that
 * happens to a particular person is SLATE's, because no table says when
 * anybody dies.
 */
export const LIFESPAN_NOTE =
  'Life expectancy at birth and the state pension age are published national figures, carried in '
  + 'whole years. Which source and which year a figure comes from moves it by a year or two, so '
  + 'SLATE treats each one as a band rather than a number and does not claim it is this year’s. '
  + 'Everything that happens to one person — when a life actually ends, what a year costs, who is '
  + 'born into a family — is SLATE’s own calibration. No table anywhere says when anybody dies.';

/** Said where a pension age is shown, because many countries set two. */
export const PENSION_NOTE =
  'Many countries still set a different pension age for men and for women, and several are in the '
  + 'middle of raising one or both. SLATE carries the higher of the two at the end of the announced '
  + 'schedule, which is the age a life planned today would actually reach.';

// ---------------------------------------------------------------------------
// How long people live
// ---------------------------------------------------------------------------

/** Life expectancy at birth, in whole years, from published national estimates. */
export interface Expectancy {
  countryId: string;
  years: number;
}

const ex = (countryId: string, years: number): Expectancy => ({ countryId, years });

/**
 * Published life expectancy at birth, rounded to the year.
 *
 * Both sexes together. A country absent from this list falls back to the world
 * figure below rather than being given an invented one, and the checker counts
 * how many of the world's people are covered so the number is never implied.
 */
export const LIFE_EXPECTANCY: readonly Expectancy[] = [
  // Highest, and the places usually at the top of the table.
  ex('jp', 84), ex('ch', 84), ex('es', 84), ex('kr', 84), ex('au', 84), ex('sg', 84),
  ex('it', 83), ex('is', 83), ex('se', 83), ex('fr', 83), ex('no', 83), ex('il', 83),
  ex('mt', 83), ex('lu', 83), ex('mc', 85), ex('li', 84), ex('sm', 84), ex('ie', 82),
  ex('nl', 82), ex('ca', 82), ex('nz', 82), ex('pt', 82), ex('at', 82), ex('be', 82),
  ex('fi', 82), ex('dk', 82), ex('gr', 81), ex('de', 81), ex('uk', 81), ex('cy', 81),
  ex('si', 81), ex('cl', 81), ex('hk', 85), ex('mo', 85),

  // Around eighty.
  ex('cr', 80), ex('qa', 80), ex('cz', 79), ex('ae', 79), ex('us', 79), ex('al', 79),
  ex('pa', 79), ex('bh', 79), ex('ee', 78), ex('pl', 78), ex('hr', 78), ex('tr', 78),
  ex('cn', 78), ex('th', 78), ex('uy', 78), ex('cu', 78), ex('sa', 78), ex('kw', 79),
  ex('bb', 78), ex('ar', 77), ex('sk', 77), ex('co', 77), ex('ec', 77), ex('ir', 77),
  ex('pe', 77), ex('lk', 77), ex('jo', 77), ex('lb', 77), ex('ba', 77), ex('tn', 77),
  ex('om', 78), ex('me', 77), ex('rs', 76), ex('hu', 76), ex('my', 76), ex('br', 76),
  ex('lt', 76), ex('ro', 76), ex('mk', 76), ex('am', 76), ex('dz', 77), ex('mv', 80),

  // Around seventy five.
  ex('mx', 75), ex('lv', 75), ex('bg', 75), ex('ma', 75), ex('bn', 75), ex('ge', 74),
  ex('az', 74), ex('kz', 74), ex('by', 74), ex('vn', 74), ex('bd', 74), ex('tt', 73),
  ex('ru', 73), ex('ua', 73), ex('py', 73), ex('do', 73), ex('sr', 72), ex('in', 72),
  ex('id', 72), ex('ph', 72), ex('eg', 72), ex('ve', 72), ex('gt', 72), ex('hn', 72),
  ex('iq', 72), ex('uz', 72), ex('kg', 72), ex('sv', 72), ex('ni', 74), ex('jm', 71),
  ex('np', 71), ex('mn', 71), ex('tj', 71), ex('tm', 70), ex('bt', 72), ex('kh', 70),
  ex('la', 69), ex('bo', 68), ex('sn', 68), ex('bw', 68), ex('pk', 67), ex('rw', 67),

  // Where a life is shorter, and the reasons are not a mystery.
  ex('mm', 66), ex('tz', 66), ex('gh', 64), ex('mg', 65), ex('et', 65), ex('za', 65),
  ex('na', 65), ex('ht', 64), ex('ug', 63), ex('mw', 63), ex('cm', 63), ex('ke', 62),
  ex('zm', 62), ex('zw', 62), ex('ao', 62), ex('ci', 62), ex('sl', 61), ex('lr', 61),
  ex('cd', 60), ex('mz', 60), ex('bf', 60), ex('ne', 60), ex('gn', 59), ex('ml', 59),
  ex('sz', 58), ex('ss', 56), ex('so', 56), ex('cf', 55), ex('td', 53), ex('ls', 53),
  ex('ng', 54), ex('gw', 60), ex('bi', 63), ex('tg', 62), ex('bj', 60), ex('mr', 65),
  ex('af', 63), ex('ye', 64), ex('sy', 72), ex('ly', 72), ex('sd', 66), ex('kp', 72),
];

/** Where a country is not on the list, this is what the world does. */
export const WORLD_EXPECTANCY = 73;

const EXPECTANCY_BY_COUNTRY: Readonly<Record<string, number>> = Object.fromEntries(
  LIFE_EXPECTANCY.map((one) => [one.countryId, one.years]),
);

/** How long people live where this passport is from, in whole years. */
export function expectancyIn(countryId: string): number {
  return EXPECTANCY_BY_COUNTRY[countryId] ?? WORLD_EXPECTANCY;
}

/** Whether SLATE carries a published figure for this country, or the world one. */
export function expectancyIsPublished(countryId: string): boolean {
  return EXPECTANCY_BY_COUNTRY[countryId] !== undefined;
}

/**
 * How long somebody who is already grown up can expect to live.
 *
 * This is the correction that matters, and getting it wrong is how a game
 * ends up killing a Nigerian character at fifty four. Life expectancy at
 * birth is an average over everybody born, including the children who do not
 * reach five, and in a country where that number is high it drags the whole
 * average down a long way. Somebody who has already reached adulthood has
 * survived the part that made the figure low, and lives a great deal longer
 * than it — which is why several countries honestly have a pension age above
 * their own life expectancy at birth.
 *
 * SLATE's own adjustment, and labelled as one: it puts back a little over
 * half the distance between the country's figure and the figure of a country
 * with almost no child mortality. It is a correction in the right direction
 * of roughly the right size, not a life table.
 */
export const ADULT_EXPECTANCY_NOTE =
  'Life expectancy at birth is an average over everybody born, and where child mortality is high it '
  + 'sits well below the age adults actually reach. A character who is already grown up has survived '
  + 'the part that makes that figure low. SLATE puts most of that distance back with an adjustment '
  + 'of its own rather than pretending the at-birth figure is the age people die at. It is a '
  + 'correction of roughly the right size, not a life table.';

/** The figure a country would have if almost no child died. */
const NO_CHILD_MORTALITY = 78;

/** How long somebody who has already reached adulthood can expect to live. */
export function adultExpectancyIn(countryId: string): number {
  const atBirth = expectancyIn(countryId);
  const shortfall = Math.max(0, NO_CHILD_MORTALITY - atBirth);
  return Math.round(atBirth + shortfall * 0.55);
}

// ---------------------------------------------------------------------------
// When the state expects you to stop
// ---------------------------------------------------------------------------

/**
 * The state pension age, in whole years.
 *
 * The higher of the two where a country sets one for men and another for
 * women, and the end of the announced schedule where a country is raising it,
 * because that is the age somebody planning a life today would actually reach.
 */
export const PENSION_AGE: Readonly<Record<string, number>> = {
  us: 67, uk: 66, ca: 65, au: 67, nz: 65, ie: 66,
  fr: 64, de: 67, it: 67, es: 67, pt: 66, gr: 67, nl: 67, be: 67, lu: 65, at: 65,
  ch: 65, se: 66, no: 67, dk: 67, fi: 65, is: 67,
  pl: 65, cz: 65, sk: 64, hu: 65, ro: 65, bg: 65, hr: 65, si: 65, ee: 65, lv: 65,
  lt: 65, cy: 65, mt: 65, rs: 65, ba: 65, mk: 64, al: 65, me: 66,
  ru: 65, ua: 60, by: 63, kz: 63, ge: 65, am: 63, az: 65, md: 63,
  jp: 65, kr: 65, cn: 63, tw: 65, hk: 65, sg: 65, my: 60, th: 60, id: 65, ph: 60,
  vn: 62, in: 60, pk: 60, bd: 59, lk: 60, np: 58, mm: 60, kh: 60, mn: 60,
  il: 67, tr: 65, sa: 60, ae: 60, qa: 60, kw: 55, bh: 60, om: 60, jo: 60, lb: 64,
  eg: 60, ma: 63, dz: 60, tn: 62, ng: 60, gh: 60, ke: 60, tz: 60, ug: 60, za: 60,
  et: 60, zm: 60, zw: 65, na: 60, bw: 65, sn: 60, ci: 60, cm: 60,
  br: 65, mx: 65, ar: 65, cl: 65, co: 62, pe: 65, uy: 65, py: 60, bo: 58, ec: 65,
  ve: 60, cr: 65, pa: 62, gt: 60, hn: 65, sv: 60, ni: 60, do: 60, cu: 65, jm: 65,
};

/** The world's usual, where SLATE does not carry a country's own. */
export const WORLD_PENSION_AGE = 65;

/** The age the state expects somebody from here to stop working at. */
export function pensionAgeIn(countryId: string): number {
  return PENSION_AGE[countryId] ?? WORLD_PENSION_AGE;
}

/** Whether SLATE carries a published figure for this country, or the world one. */
export function pensionAgeIsPublished(countryId: string): boolean {
  return PENSION_AGE[countryId] !== undefined;
}

// ---------------------------------------------------------------------------
// The parts of a life
// ---------------------------------------------------------------------------

export type LifeStageId =
  | 'childhood' | 'adolescence' | 'young_adult' | 'adulthood'
  | 'middle_age' | 'later_life' | 'old_age';

export interface LifeStage {
  id: LifeStageId;
  label: string;
  /** The birthday it starts on. */
  from: number;
  about: string;
}

/**
 * Seven stages, in the words people actually use for them.
 *
 * The ages are where the words change rather than where anything happens to
 * the body: nobody wakes up different on a birthday. What the body does is the
 * curve below, and it is continuous.
 */
export const LIFE_STAGES: readonly LifeStage[] = [
  { id: 'childhood', label: 'Childhood', from: 0, about: 'Somebody else decides where you live and what happens next.' },
  { id: 'adolescence', label: 'Adolescence', from: 13, about: 'Old enough to want things, not old enough to sign for them.' },
  { id: 'young_adult', label: 'Young Adult', from: 18, about: 'Everything is a first, and nothing has settled.' },
  { id: 'adulthood', label: 'Adulthood', from: 30, about: 'The decade where the things you chose start to compound.' },
  { id: 'middle_age', label: 'Middle Age', from: 45, about: 'Still climbing, and beginning to feel the mornings.' },
  { id: 'later_life', label: 'Later Life', from: 60, about: 'The work is what you want it to be, or it is over.' },
  { id: 'old_age', label: 'Old Age', from: 75, about: 'Time is the thing you are short of, and you know it.' },
];

export const STAGE_BY_ID: Readonly<Record<string, LifeStage>> = Object.fromEntries(
  LIFE_STAGES.map((one) => [one.id, one]),
);

/** Which part of a life this is. */
export function stageAt(age: number): LifeStage {
  let found = LIFE_STAGES[0]!;
  for (const stage of LIFE_STAGES) if (age >= stage.from) found = stage;
  return found;
}

// ---------------------------------------------------------------------------
// What a year costs
// ---------------------------------------------------------------------------

/**
 * What a birthday takes, by decade. SLATE's calibration, all of it.
 *
 * Nothing here is a cliff. A year in your twenties costs almost nothing and a
 * year in your eighties costs a great deal, and in between it is a curve. The
 * numbers are per birthday, applied once, and they move the ceiling rather
 * than the current value: age is what your best day looks like, not how you
 * happen to feel this morning.
 */
export interface AgingBand {
  /** The decade this band starts at. */
  from: number;
  /** Points off the fitness ceiling per year. */
  fitness: number;
  /** Points off the condition ceiling per year. */
  condition: number;
  /** Share of a night's recovery lost per year, as a fraction. */
  recovery: number;
  about: string;
}

export const AGING: readonly AgingBand[] = [
  { from: 0, fitness: 0, condition: 0, recovery: 0, about: 'Growing, and none of it costs anything yet.' },
  { from: 20, fitness: 0.12, condition: 0.05, recovery: 0.001, about: 'The body is at its best and stays there.' },
  { from: 30, fitness: 0.35, condition: 0.18, recovery: 0.003, about: 'Recovery takes a day longer than it used to.' },
  { from: 40, fitness: 0.62, condition: 0.34, recovery: 0.005, about: 'You feel a bad night the next morning now.' },
  { from: 50, fitness: 0.95, condition: 0.55, recovery: 0.008, about: 'Keeping the ceiling up is work rather than weather.' },
  { from: 60, fitness: 1.35, condition: 0.85, recovery: 0.012, about: 'What you do not use, you lose faster than you gain it.' },
  { from: 70, fitness: 1.80, condition: 1.25, recovery: 0.016, about: 'A week off costs a month back.' },
  { from: 80, fitness: 2.30, condition: 1.75, recovery: 0.021, about: 'Every year is a year now, and it shows.' },
];

/**
 * How much of a night's rest a body of this age actually banks.
 *
 * One at twenty, and falling from there. This is the part of ageing anybody
 * would recognize before they recognized anything else: the night that used
 * to fix everything stops fixing everything.
 */
export function recoveryFactorAt(age: number): number {
  let lost = 0;
  for (let year = 1; year <= age; year++) lost += agingAt(year).recovery;
  return Math.max(0.55, Math.round((1 - lost) * 1000) / 1000);
}

/** The band a given age falls in. */
export function agingAt(age: number): AgingBand {
  let found = AGING[0]!;
  for (const band of AGING) if (age >= band.from) found = band;
  return found;
}

/** The most a body of this age can be brought to, out of a hundred. */
export function ceilingAt(age: number): { fitness: number; condition: number } {
  let fitness = 100;
  let condition = 100;
  for (let year = 1; year <= age; year++) {
    const band = agingAt(year);
    fitness -= band.fitness;
    condition -= band.condition;
  }
  return {
    fitness: Math.max(18, Math.round(fitness * 10) / 10),
    condition: Math.max(30, Math.round(condition * 10) / 10),
  };
}

// ---------------------------------------------------------------------------
// The family you were born into
// ---------------------------------------------------------------------------

/** How much older a parent is than the child. SLATE's calibration. */
export const PARENT_AGE_GAP: readonly [number, number] = [20, 42];

/** How many years apart two parents usually are. */
export const PARTNER_AGE_GAP: readonly [number, number] = [-6, 8];

/** How many brothers and sisters, and how often. Weighted, and it sums to one. */
export const SIBLING_WEIGHTS: readonly { count: number; weight: number }[] = [
  { count: 0, weight: 0.19 },
  { count: 1, weight: 0.38 },
  { count: 2, weight: 0.26 },
  { count: 3, weight: 0.12 },
  { count: 4, weight: 0.05 },
];

/** How many years apart brothers and sisters are. */
export const SIBLING_AGE_GAP: readonly [number, number] = [1, 9];

/** How often the people who raised you are still together by the time you are grown. */
export const PARENTS_STILL_TOGETHER = 0.62;

/** How often somebody has moved away from where they grew up. */
export const MOVED_AWAY = 0.44;

/**
 * How close a family stays, before anything you do about it.
 *
 * A parent starts warm and familiar because they raised you. A brother is
 * warm and knows you. Neither starts perfect, because families do not.
 */
export const FAMILY_START = {
  parent: { familiarity: 100, affection: 78, trust: 74, respect: 66, compatibility: 66, commitment: 92, conflict: 8 },
  sibling: { familiarity: 100, affection: 70, trust: 66, respect: 62, compatibility: 62, commitment: 70, conflict: 12 },
} as const;

// ---------------------------------------------------------------------------
// What a birthday and a passing sound like
// ---------------------------------------------------------------------------

/** The years a birthday is worth saying out loud about. */
export const MILESTONE_AGES: readonly number[] = [1, 5, 10, 13, 16, 18, 21, 30, 40, 50, 60, 65, 70, 75, 80, 90, 100];

/** How a birthday reads, by what the year was worth. */
export const BIRTHDAY_LINES: readonly string[] = [
  'A year older, and the day itself was ordinary.',
  'Nobody made much of it, which was the right amount.',
  'The phone went more than usual, and then it stopped.',
  'A quiet one. You did the things you do.',
  'You were working, and it went past.',
];

/** How a milestone birthday reads. */
export const MILESTONE_LINES: readonly string[] = [
  'People came. Some of them traveled for it.',
  'A round number, and everybody said so.',
  'The kind of birthday people ring about rather than message.',
  'A number that changes how a room reads you.',
];

/**
 * How somebody's end is written, when they are old.
 *
 * Never a cause, never a scene, and never anything a person hearing the news
 * would not be told. The game says that somebody has died, how old they were
 * and what they were to you, and stops there.
 */
export const PASSING_LINES: readonly string[] = [
  'Peacefully, and not unexpectedly.',
  'In their sleep, at home.',
  'After a short illness. It was quick at the end.',
  'Quietly, with people there.',
];

/** How long the world leaves you alone afterward, in days. */
export const MOURNING_DAYS = 21;

// ---------------------------------------------------------------------------
// What age lets you do
// ---------------------------------------------------------------------------

/**
 * The ages a country sets, and what they do not say.
 *
 * These are the general national minimums. Almost every one of them has
 * exceptions a real life runs into — a state that sets its own, a parent who
 * can consent, a license that comes in stages, a job a fourteen year old may
 * do on a Saturday but not on a Tuesday. SLATE carries the general rule and
 * says so rather than carrying a rule per state and being wrong in a
 * different way.
 */
export const AGE_GATE_NOTE =
  'These are the general national minimums, and every one of them has exceptions a real life runs '
  + 'into: a state or province that sets its own, a parent who can consent, a license that arrives '
  + 'in stages. SLATE carries the national rule, uses it to decide what is open to you, and names '
  + 'the country whose rule it is applying. It is not legal advice and it is not a statute.';

/** The things an age can be a gate on. */
export type GateId =
  | 'majority' | 'drive' | 'drink' | 'work' | 'marry' | 'vote' | 'lease' | 'borrow';

export interface Gate {
  id: GateId;
  label: string;
  /** What the world does when you are under it. */
  refusal: string;
}

export const GATES: readonly Gate[] = [
  { id: 'majority', label: 'Signing For Yourself', refusal: 'You are not old enough to sign for yourself here.' },
  { id: 'drive', label: 'Driving', refusal: 'You are not old enough to drive here.' },
  { id: 'drink', label: 'Drinking', refusal: 'You are not old enough to be served here.' },
  { id: 'work', label: 'Working', refusal: 'You are not old enough to be employed here.' },
  { id: 'marry', label: 'Marrying', refusal: 'You are not old enough to marry here.' },
  { id: 'vote', label: 'Voting', refusal: 'You are not old enough to vote here.' },
  { id: 'lease', label: 'Holding A Lease', refusal: 'Nobody will put a lease in the name of somebody your age.' },
  { id: 'borrow', label: 'Borrowing', refusal: 'No lender will write a contract with somebody your age.' },
];

export const GATE_BY_ID: Readonly<Record<string, Gate>> = Object.fromEntries(
  GATES.map((one) => [one.id, one]),
);

/** What the world does by default, where a country sets nothing unusual. */
export const DEFAULT_GATES: Readonly<Record<GateId, number>> = {
  majority: 18, drive: 18, drink: 18, work: 16, marry: 18, vote: 18, lease: 18, borrow: 18,
};

/**
 * Where a country's own rule differs from the default above.
 *
 * Only the differences are listed, so a country absent from a row is on the
 * default for that row and the checker can say how many are which.
 */
export const COUNTRY_GATES: Readonly<Record<string, Partial<Record<GateId, number>>>> = {
  us: { drive: 16, drink: 21, work: 14 },
  ca: { drive: 16, drink: 19, majority: 19, work: 14 },
  uk: { drive: 17, work: 13 },
  ie: { drive: 17 },
  au: { drive: 17, work: 14 },
  nz: { drive: 16 },
  za: { work: 15 },
  jp: { drink: 20, work: 15 },
  kr: { drink: 19, majority: 19, work: 15 },
  in: { drink: 21, work: 14 },
  id: { drink: 21, majority: 21 },
  sg: { majority: 21 },
  th: { drink: 20, majority: 20 },
  ph: { drive: 17 },
  my: { drink: 21 },
  lk: { drink: 21 },
  de: { drive: 17, drink: 16, work: 15 },
  at: { drive: 17, drink: 16 },
  ch: { drink: 16 },
  be: { drink: 16 },
  lu: { drink: 16 },
  dk: { drink: 16 },
  nl: { drive: 17 },
  fr: { drive: 17 },
  se: { drink: 20 },
  is: { drive: 17, drink: 20 },
  ar: { drive: 17 },
  co: { drive: 16 },
  py: { drink: 20 },
  eg: { drink: 21, majority: 21 },
  ae: { drink: 21 },
  qa: { drink: 21 },
  bh: { drink: 21, majority: 21 },
  kw: { majority: 21 },
  il: { drive: 17 },
  na: { majority: 21 },
  ls: { majority: 21 },
  sz: { majority: 21 },
  cm: { majority: 21 },
  mg: { majority: 21 },
  hn: { majority: 21 },
};

/**
 * Countries where alcohol is not sold to anybody at any age.
 *
 * Not a high number: a prohibition. The room says that rather than quoting a
 * minimum age that does not exist.
 */
export const NO_DRINKING = new Set(['sa', 'kw', 'ly', 'so', 'ye', 'af', 'bn', 'mv', 'ir', 'bd']);

/** The age this country sets for this, or the world's usual. */
export function gateAgeIn(countryId: string, gate: GateId): number {
  return COUNTRY_GATES[countryId]?.[gate] ?? DEFAULT_GATES[gate];
}

/** Whether SLATE carries this country's own rule for this, or the default. */
export function gateIsCountrys(countryId: string, gate: GateId): boolean {
  return COUNTRY_GATES[countryId]?.[gate] !== undefined;
}

// ---------------------------------------------------------------------------
// The size you end up
// ---------------------------------------------------------------------------

/**
 * How a body gets to the size it ends up.
 *
 * The player says how tall and how heavy their character is as an adult, and
 * a character who starts as a child grows toward exactly that. The share of
 * adult height reached at each age is the general shape of human growth —
 * fast to about two, steady through childhood, a run in the teens, finished
 * around twenty — smoothed by SLATE into one curve.
 *
 * One curve, not two. Boys and girls finish growing at different ages and any
 * honest model of that needs a real growth reference and a field on the
 * character that says which to use. SLATE has neither, so it carries the
 * middle of it and says so rather than guessing from a pronoun.
 */
export const GROWTH_NOTE =
  'You set the height and weight your character ends up at, and a character who starts young grows '
  + 'to exactly that. The shape of the growing is SLATE’s own smoothing of the general human curve, '
  + 'and it is one curve: children finish growing at different ages and boys and girls finish at '
  + 'different ages, and SLATE carries the middle of that rather than inferring anything from a '
  + 'pronoun. It is a size, not a growth chart, and no part of it is medical.';

/** Share of adult height reached, by age. */
export const HEIGHT_CURVE: readonly { age: number; share: number }[] = [
  { age: 0, share: 0.29 }, { age: 1, share: 0.43 }, { age: 2, share: 0.50 },
  { age: 4, share: 0.58 }, { age: 6, share: 0.65 }, { age: 8, share: 0.71 },
  { age: 10, share: 0.77 }, { age: 12, share: 0.83 }, { age: 14, share: 0.91 },
  { age: 16, share: 0.97 }, { age: 18, share: 0.995 }, { age: 20, share: 1 },
];

/** Share of adult weight reached, by age. Weight comes later than height. */
export const WEIGHT_CURVE: readonly { age: number; share: number }[] = [
  { age: 0, share: 0.05 }, { age: 1, share: 0.13 }, { age: 2, share: 0.17 },
  { age: 4, share: 0.23 }, { age: 6, share: 0.29 }, { age: 8, share: 0.36 },
  { age: 10, share: 0.45 }, { age: 12, share: 0.55 }, { age: 14, share: 0.70 },
  { age: 16, share: 0.87 }, { age: 18, share: 0.96 }, { age: 20, share: 1 },
];

/** The age a body has finished growing, for the purposes of the curve above. */
export const FULLY_GROWN = 20;

/** What the game will accept as an adult size. */
export const HEIGHT_RANGE: readonly [number, number] = [140, 215];
export const WEIGHT_RANGE: readonly [number, number] = [40, 180];

/** The middle of the range, used when nothing was chosen. */
export const DEFAULT_HEIGHT_CM = 175;
export const DEFAULT_WEIGHT_KG = 72;

function alongCurve(curve: readonly { age: number; share: number }[], age: number): number {
  if (age >= FULLY_GROWN) return 1;
  let previous = curve[0]!;
  for (const point of curve) {
    if (point.age === age) return point.share;
    if (point.age > age) {
      const span = point.age - previous.age;
      const into = (age - previous.age) / span;
      return previous.share + (point.share - previous.share) * into;
    }
    previous = point;
  }
  return 1;
}

/** How tall somebody of this age is, on their way to that adult height. */
export function heightAtAge(adultCm: number, age: number): number {
  return Math.round(adultCm * alongCurve(HEIGHT_CURVE, Math.max(0, age)) * 10) / 10;
}

/** What somebody of this age weighs, on their way to that adult weight. */
export function weightAtAge(adultKg: number, age: number): number {
  return Math.round(adultKg * alongCurve(WEIGHT_CURVE, Math.max(0, age)) * 10) / 10;
}

/** A height in the two ways people say it. */
export function describeHeight(cm: number): string {
  const inches = Math.round(cm / 2.54);
  return `${Math.round(cm)} cm (${Math.floor(inches / 12)} ft ${inches % 12} in)`;
}

/** A weight in the two ways people say it. */
export function describeWeight(kg: number): string {
  return `${Math.round(kg)} kg (${Math.round(kg * 2.20462)} lb)`;
}
