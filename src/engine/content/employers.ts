/**
 * SLATE — the companies that really hire at this level.
 *
 * Real names, in the countries they really trade in, in the sectors they
 * really operate. What SLATE carries about their pay is how each one sits
 * against the legal floor — well above it, above it, at it — because that is
 * durable, publicly known and true, rather than an exact hourly figure that
 * changes every year and would be a claim about one company's current payroll.
 *
 * Everything else is SLATE's own: which branch, the rota, the manager, the
 * shift, and every word anybody says on it.
 */

import type { Money } from '../core/money';

export const EMPLOYER_NOTE =
  'The companies are real and they really do hire at this level in the countries listed. What SLATE '
  + 'carries about pay is where a company sits against the legal floor rather than an exact hourly '
  + 'rate: some have publicly committed to paying well above it, most pay a little above it, and '
  + 'some pay it. That’s durable and public. An exact figure changes every year and would be a '
  + 'claim about one company’s current payroll, so it isn’t in here.';

export const BRANCH_NOTE =
  'Which branch you work at, who manages it, what is on the rota and everything anybody says on a '
  + 'shift are SLATE’s own. There’s no listings feed and no rota anywhere that this could be read '
  + 'from.';

export const LADDER_NOTE =
  'The ladder is the real shape of it: crew, then a supervisor with keys, then an assistant manager, '
  + 'then the store. What each step is worth above the one below is SLATE’s own calibration, and how '
  + 'long it takes is deliberately the honest answer rather than the flattering one.';

export const COVER_NOTE =
  'A manager ringing on a day off is the most ordinary thing about this kind of work. Saying yes is '
  + 'worth something with them and costs you the day; saying no costs a little of what they think of '
  + 'you and nothing else. Neither is the wrong answer.';

// ---------------------------------------------------------------------------
// How a company pays, against the floor
// ---------------------------------------------------------------------------

export type PayStance = 'well_above' | 'above' | 'at_it';

export const PAY_STANCE: Readonly<Record<PayStance, { label: string; multiple: number; about: string }>> = {
  well_above: {
    label: 'Well Above The Floor',
    multiple: 1.45,
    about: 'This one has publicly committed to a starting rate well above the legal minimum, and says so in its own material.',
  },
  above: {
    label: 'Above The Floor',
    multiple: 1.15,
    about: 'A little over the minimum, which is what most of the sector does to stay competitive for staff.',
  },
  at_it: {
    label: 'The Floor',
    multiple: 1,
    about: 'The legal minimum, or as near to it as makes no difference.',
  },
};

// ---------------------------------------------------------------------------
// The companies
// ---------------------------------------------------------------------------

/** The kind of place, which decides what the jobs in it are. */
export type Sector = 'grocery' | 'coffee' | 'fast_food' | 'retail' | 'warehouse' | 'hardware' | 'pharmacy';

export const SECTOR_LABEL: Readonly<Record<Sector, string>> = {
  grocery: 'A Supermarket',
  coffee: 'A Coffee Shop',
  fast_food: 'Fast Food',
  retail: 'A Shop',
  warehouse: 'A Warehouse',
  hardware: 'A Hardware Store',
  pharmacy: 'A Pharmacy',
};

export interface Employer {
  id: string;
  /** The real name. */
  name: string;
  countryIds: readonly string[];
  sector: Sector;
  pay: PayStance;
  /** What it is like to work there, in the words somebody who did would use. */
  about: string;
}

function e(
  id: string, name: string, countryIds: readonly string[], sector: Sector, pay: PayStance,
  about: string,
): Employer {
  return { id, name, countryIds, sector, pay, about };
}

export const EMPLOYERS: readonly Employer[] = [
  // --- The United States ---------------------------------------------------
  e('costco', 'Costco', ['us', 'ca', 'uk', 'jp', 'mx', 'kr', 'au'], 'grocery', 'well_above',
    'The one everybody says to get into. Big boxes, big shifts, and people who have been there twenty years.'),
  e('target', 'Target', ['us'], 'retail', 'well_above',
    'Red shirt, a section that’s yours, and a truck to unload on the days there’s a truck.'),
  e('trader_joes', 'Trader Joe’s', ['us'], 'grocery', 'well_above',
    'Everybody is relentlessly cheerful and it’s somehow not fake. Hawaiian shirt, bell behind the till.'),
  e('walmart', 'Walmart', ['us', 'mx', 'ca'], 'grocery', 'above',
    'The biggest employer there is. Whatever the department, there’s more of it than you expect.'),
  e('kroger', 'Kroger', ['us'], 'grocery', 'above',
    'Registers, carts and a produce section that has to look untouched at nine in the morning.'),
  e('publix', 'Publix', ['us'], 'grocery', 'above',
    'Bagging is a job here and they’ll show you how to do it properly.'),
  e('whole_foods', 'Whole Foods Market', ['us', 'uk', 'ca'], 'grocery', 'above',
    'Everything faces forward, the signage is handwritten, and somebody checks both.'),
  e('starbucks', 'Starbucks', ['us', 'uk', 'ca', 'jp', 'de', 'fr', 'kr', 'cn', 'mx', 'au'], 'coffee', 'above',
    'Steam, a headset, and a queue that doesn’t stop between seven and nine.'),
  e('mcdonalds', 'McDonald’s', ['us', 'uk', 'ca', 'de', 'fr', 'jp', 'au', 'br', 'in', 'mx', 'es', 'it', 'pl'], 'fast_food', 'at_it',
    'The first job of more people than any other. It’s a system and you learn the system.'),
  e('chipotle', 'Chipotle', ['us', 'ca', 'uk', 'de', 'fr'], 'fast_food', 'above',
    'A line, a rush, and a manager counting how long the line takes.'),
  e('dunkin', 'Dunkin’', ['us'], 'coffee', 'at_it',
    'Five in the morning, and everybody who comes in is in a hurry and knows exactly what they want.'),
  e('in_n_out', 'In-N-Out Burger', ['us'], 'fast_food', 'well_above',
    'Pays the best of anybody in fast food and everybody knows it, so nobody leaves.'),
  e('home_depot', 'The Home Depot', ['us', 'ca', 'mx'], 'hardware', 'above',
    'An aisle, a forklift you aren’t allowed near yet, and somebody asking where the plumbing is.'),
  e('best_buy', 'Best Buy', ['us', 'ca'], 'retail', 'above',
    'Blue shirt, and you’ll be asked about a television you have never heard of.'),
  e('cvs', 'CVS Pharmacy', ['us'], 'pharmacy', 'above',
    'A front of store, a photo counter, and a receipt longer than the purchase.'),
  e('panera', 'Panera Bread', ['us', 'ca'], 'coffee', 'above',
    'Bakery cases, soup in bread, and a lunch rush that comes all at once.'),
  e('amazon_fc', 'Amazon', ['us', 'uk', 'de', 'fr', 'ca', 'jp', 'es', 'it', 'pl', 'in', 'au'], 'warehouse', 'above',
    'A fulfillment center. A scanner, a rate, and a number on a screen that’s you.'),
  e('ups', 'UPS', ['us', 'ca', 'uk', 'de'], 'warehouse', 'well_above',
    'Loading a trailer at four in the morning. It’s unionised, it pays, and it’s genuinely hard.'),

  // --- The United Kingdom and Ireland --------------------------------------
  e('tesco', 'Tesco', ['uk', 'ie'], 'grocery', 'above',
    'The big one. Checkouts, fill, and a manager who has been there since it opened.'),
  e('sainsburys', 'Sainsbury’s', ['uk'], 'grocery', 'above',
    'Nectar points, a colleague discount, and the bakery smell for the whole shift.'),
  e('asda', 'Asda', ['uk'], 'grocery', 'above',
    'Big stores, big trolleys, and a night fill team that’s its own world.'),
  e('morrisons', 'Morrisons', ['uk'], 'grocery', 'above',
    'It makes a lot of what it sells, so there are counters and people behind them.'),
  e('aldi_uk', 'Aldi', ['uk', 'ie', 'de', 'au', 'us', 'pl'], 'grocery', 'well_above',
    'Pays the most on the high street and asks for it back: you’ll be on a till, then a pallet, then a till.'),
  e('lidl', 'Lidl', ['uk', 'ie', 'de', 'fr', 'pl', 'es', 'us'], 'grocery', 'well_above',
    'The same bargain as Aldi. Fast, physical, and the bakery starts before you do.'),
  e('waitrose', 'Waitrose', ['uk'], 'grocery', 'above',
    'A partnership, so everybody is a partner and there’s a bonus everybody talks about.'),
  e('marks_spencer', 'Marks & Spencer', ['uk', 'ie'], 'retail', 'above',
    'Food hall or clothing, and they’re two completely different jobs in one building.'),
  e('john_lewis', 'John Lewis', ['uk'], 'retail', 'above',
    'A partnership too, and the training is genuinely better than it needs to be.'),
  e('greggs', 'Greggs', ['uk'], 'coffee', 'above',
    'Sausage rolls out of the oven all day, and the eleven o’clock queue is a physical event.'),
  e('pret', 'Pret A Manger', ['uk', 'us', 'fr', 'ie'], 'coffee', 'above',
    'Everything made in the shop that morning, and a shift bonus if the mystery shopper likes you.'),
  e('costa', 'Costa Coffee', ['uk', 'ie', 'pl'], 'coffee', 'above',
    'A barista qualification that’s a real thing, and a machine you’ll come to know very well.'),
  e('boots', 'Boots', ['uk', 'ie'], 'pharmacy', 'above',
    'Front of shop, meal deal, and a dispensary you aren’t allowed behind.'),
  e('wetherspoon', 'J D Wetherspoon', ['uk', 'ie'], 'fast_food', 'above',
    'A pub the size of a bank, because it used to be one. Breakfast until noon, and it never stops.'),
  e('nandos', 'Nando’s', ['uk', 'za', 'ie', 'au'], 'fast_food', 'above',
    'A table number, a peri-ometer, and a queue you seat rather than serve.'),
  e('b_and_q', 'B&Q', ['uk', 'ie'], 'hardware', 'above',
    'Timber, paint mixing, and somebody who wants a shelf cut to a size they haven’t measured.'),

  // --- Canada, Australia and New Zealand -----------------------------------
  e('tim_hortons', 'Tim Hortons', ['ca'], 'coffee', 'at_it',
    'Double double, all day, and a drive-through timer everybody watches.'),
  e('loblaws', 'Loblaws', ['ca'], 'grocery', 'above',
    'The big Canadian grocer. Produce, deli, and a lot of flyers.'),
  e('canadian_tire', 'Canadian Tire', ['ca'], 'hardware', 'above',
    'Not really tires. Everything, and money that’s only money in the shop.'),
  e('woolworths', 'Woolworths', ['au', 'nz'], 'grocery', 'above',
    'The green one. Registers, online orders picked in the aisles, and trolleys.'),
  e('coles', 'Coles', ['au'], 'grocery', 'above',
    'The red one. The same job as the green one and everybody has an opinion about which is better.'),
  e('bunnings', 'Bunnings Warehouse', ['au', 'nz'], 'hardware', 'above',
    'A warehouse the size of an airfield, and a sausage sizzle outside on a Saturday.'),

  // --- Europe ---------------------------------------------------------------
  e('rewe', 'REWE', ['de'], 'grocery', 'above',
    'A Kasse, a Pfandautomat, and a queue that expects you to be quick.'),
  e('edeka', 'EDEKA', ['de'], 'grocery', 'above',
    'Often owned by the person managing it, which changes what the job is like.'),
  e('dm', 'dm-drogerie markt', ['de', 'at'], 'pharmacy', 'above',
    'Shelves, refills and a company that’s unusually serious about training.'),
  e('carrefour', 'Carrefour', ['fr', 'es', 'it', 'be', 'pl', 'br', 'ar'], 'grocery', 'above',
    'A hypermarché, which means the job could be anything on any given day.'),
  e('monoprix', 'Monoprix', ['fr'], 'grocery', 'above',
    'A city shop with everything in it and a queue at six every evening.'),
  e('mercadona', 'Mercadona', ['es', 'pt'], 'grocery', 'well_above',
    'Pays and trains better than the sector does, and expects the store to look like it.'),

  // --- Asia ------------------------------------------------------------------
  e('seven_eleven', '7-Eleven', ['jp', 'kr', 'th', 'my', 'ph', 'us', 'ca', 'au'], 'grocery', 'at_it',
    'A konbini. Deliveries three times a day, and the job is genuinely everything at once.'),
  e('familymart', 'FamilyMart', ['jp', 'th', 'ph', 'cn'], 'grocery', 'at_it',
    'Another konbini, the same everything at once, and the fried chicken counter is yours.'),
  e('lawson', 'Lawson', ['jp', 'th', 'cn', 'ph'], 'grocery', 'at_it',
    'The blue one. Nights are quiet and long, and the stock arrives at three.'),
  e('aeon', 'AEON', ['jp', 'my', 'th', 'vn'], 'grocery', 'above',
    'A shopping center with a supermarket in it, and the job depends which half you are in.'),
];

export const EMPLOYER_BY_ID: Readonly<Record<string, Employer>> = Object.fromEntries(
  EMPLOYERS.map((one) => [one.id, one]),
);

/** The companies that really hire in this country. */
export function employersIn(countryId: string): Employer[] {
  return EMPLOYERS.filter((one) => one.countryIds.includes(countryId));
}

/** Whether SLATE carries any real employer for this country. */
export function employersAreCountrys(countryId: string): boolean {
  return EMPLOYERS.some((one) => one.countryIds.includes(countryId));
}

// ---------------------------------------------------------------------------
// The ladder
// ---------------------------------------------------------------------------

export interface Role {
  id: string;
  label: string;
  /** How much more than the crew rate it pays. */
  multiple: number;
  /** Shifts you have to have worked before anybody considers you. */
  shifts: number;
  /** What the manager has to think of you, out of a hundred. */
  standing: number;
  /** Hours a shift, on average. */
  hours: number;
  about: string;
}

export const ROLES: readonly Role[] = [
  {
    id: 'crew', label: 'Crew', multiple: 1, shifts: 0, standing: 0, hours: 6,
    about: 'Whatever needs doing, which on a bad day is all of it.',
  },
  {
    id: 'supervisor', label: 'Shift Supervisor', multiple: 1.18, shifts: 40, standing: 62, hours: 7,
    about: 'Keys, a float to count, and you’re the one people ask now.',
  },
  {
    id: 'assistant', label: 'Assistant Manager', multiple: 1.42, shifts: 120, standing: 74, hours: 8,
    about: 'A rota to write, a target on a screen, and somebody else’s sickness to cover.',
  },
  {
    id: 'manager', label: 'Store Manager', multiple: 1.9, shifts: 300, standing: 84, hours: 9,
    about: 'The store is yours. Everything that happens in it is yours too, including the bits at midnight.',
  },
];

export const ROLE_BY_ID: Readonly<Record<string, Role>> = Object.fromEntries(
  ROLES.map((one) => [one.id, one]),
);

/** The step above this one, if there is one. */
export function nextRole(roleId: string): Role | undefined {
  const index = ROLES.findIndex((one) => one.id === roleId);
  return index >= 0 && index < ROLES.length - 1 ? ROLES[index + 1] : undefined;
}

// ---------------------------------------------------------------------------
// The rota
// ---------------------------------------------------------------------------

export interface ShiftKind {
  id: string;
  label: string;
  /** The hour it starts, local. */
  startsAt: number;
  /** What it pays on top, as a multiple. Nights and Sundays really do. */
  premium: number;
  /** What it takes out of you, on top of the job's own demand. */
  extra: number;
  about: string;
}

export const SHIFT_KINDS: readonly ShiftKind[] = [
  { id: 'open', label: 'The Open', startsAt: 6, premium: 1, extra: 6, about: 'In before the doors, everything switched on, and the first hour is quiet.' },
  { id: 'mid', label: 'A Middle Shift', startsAt: 11, premium: 1, extra: 0, about: 'Straight into the lunch rush and out the other side of it.' },
  { id: 'close', label: 'The Close', startsAt: 15, premium: 1, extra: 4, about: 'The last two hours are cleaning, and nobody leaves until it’s done.' },
  { id: 'weekend', label: 'A Weekend', startsAt: 9, premium: 1.1, extra: 5, about: 'Twice the people, half the staff, and it pays a little more for a reason.' },
  { id: 'night', label: 'A Night', startsAt: 22, premium: 1.25, extra: 14, about: 'Nights pay more everywhere because nights cost more, and by four you know why.' },
];

export const SHIFT_BY_ID: Readonly<Record<string, ShiftKind>> = Object.fromEntries(
  SHIFT_KINDS.map((one) => [one.id, one]),
);

/** How many shifts a week a rota puts you down for, by role. */
export const ROTA_SHIFTS: Readonly<Record<string, number>> = {
  crew: 3, supervisor: 4, assistant: 5, manager: 5,
};

/** Why somebody is ringing you on a day off. */
export const COVER_REASONS: readonly string[] = [
  'Somebody has rung in sick and there’s nobody else on the list.',
  'The delivery has come in twice the size it should have.',
  'Two people have gone down with the same thing and it’s a Saturday.',
  'The person who was on hasn’t turned up and isn’t answering.',
  'It’s a bank holiday weekend and the rota was optimistic.',
  'Head office is in tomorrow and the store isn’t ready.',
  'Somebody has walked out mid shift.',
];

/** What a cover shift is worth on top, because it is short notice. */
export const COVER_PREMIUM = 1.2;

/** What saying yes and saying no do to what the manager thinks of you. */
export const COVER_STANDING = { yes: 5, no: -3 } as const;

/**
 * What turning up does, and what a shift missed does.
 *
 * Set so that a week of turning up outweighs one shift missed and does not
 * outweigh two, which is roughly how a manager actually keeps score.
 */
export const SHIFT_STANDING = { worked: 1.5, missed: -5 } as const;

/** Where standing starts, and what a manager thinks of somebody new. */
export const STARTING_STANDING = 50;

export const LETTING_GO_NOTE =
  'A job you stop turning up for is a job you stop having. Three shifts missed in a row, or a '
  + 'manager who has run out of patience altogether, and somebody else is on the rota instead of '
  + 'you. Where the notice, the meeting and the appeal would be is real employment law and '
  + 'differs everywhere; SLATE does the plain version of it.';

/** How many in a row it takes before somebody else is on the rota instead of you. */
export const LETTING_GO_MISSES = 3;

/** The point below which a manager has stopped defending you. */
export const LETTING_GO_STANDING = 6;

/** What a manager says on the way out, which depends on which of the two it was. */
export const LETTING_GO_REASONS: Readonly<Record<'missed' | 'standing', string>> = {
  missed: 'You stopped turning up, so they stopped putting you on.',
  standing: 'It wasn’t working out, and they said so.',
};

// ---------------------------------------------------------------------------
// Payday
// ---------------------------------------------------------------------------

export const PAYDAY_NOTE =
  'Nobody is handed cash at the end of a shift. The hours go on a timesheet and the money arrives '
  + 'on a pay date, less what is withheld at source. How often that happens is the country’s own '
  + 'habit — weekly and fortnightly in America, fortnightly in Australia, monthly across most of '
  + 'Europe — and SLATE carries that. What is withheld is worked out from the same tax rules the '
  + 'rest of the game uses, which are the published rates and are labelled as approximate.';

export const SICK_NOTE =
  'Ringing in is a real thing you can do and a real thing that costs something. Doing it when you '
  + 'are actually ill costs almost nothing; doing it when you aren’t is a gamble on whether '
  + 'anybody works it out. Whether the day is paid depends on where you are: statutory sick pay is '
  + 'a real entitlement in some countries and doesn’t exist in others.';

export type PayCycle = 'weekly' | 'fortnightly' | 'monthly';

export const CYCLE_LABEL: Readonly<Record<PayCycle, string>> = {
  weekly: 'Weekly',
  fortnightly: 'Every Two Weeks',
  monthly: 'Monthly',
};

export const CYCLE_DAYS: Readonly<Record<PayCycle, number>> = {
  weekly: 7, fortnightly: 14, monthly: 30,
};

/** How often somebody at this level is really paid, country by country. */
export const PAY_CYCLES: Readonly<Record<string, PayCycle>> = {
  us: 'fortnightly', ca: 'fortnightly', au: 'fortnightly', nz: 'fortnightly',
  uk: 'monthly', ie: 'monthly', de: 'monthly', fr: 'monthly', es: 'monthly', it: 'monthly',
  nl: 'monthly', be: 'monthly', pt: 'monthly', pl: 'monthly', se: 'monthly', dk: 'monthly',
  no: 'monthly', fi: 'monthly', at: 'monthly', ch: 'monthly', jp: 'monthly', kr: 'monthly',
  in: 'monthly', br: 'monthly', mx: 'fortnightly', za: 'monthly', ng: 'monthly', ke: 'monthly',
  jm: 'fortnightly', ph: 'fortnightly',
};

export function cycleIn(countryId: string): PayCycle {
  return PAY_CYCLES[countryId] ?? 'monthly';
}

export function cycleIsCountrys(countryId: string): boolean {
  return countryId in PAY_CYCLES;
}

/**
 * Where a day off sick is paid, and where it is not.
 *
 * Statutory sick pay is a real entitlement in a lot of Europe and is not one
 * in the United States, where it depends on the state and the employer. This
 * is the honest shape of that rather than a percentage.
 */
export const STATUTORY_SICK_PAY: ReadonlySet<string> = new Set([
  'uk', 'ie', 'de', 'fr', 'es', 'it', 'nl', 'be', 'pt', 'pl', 'se', 'dk', 'no', 'fi', 'at', 'ch',
  'jp', 'kr', 'au', 'nz', 'br', 'mx',
]);

/** What ringing in does to what they think of you, ill or otherwise. */
export const SICK_STANDING = { genuine: -1, pulled: -6, caught: -14 } as const;

/** What a promotion is worth as a one off, on the day. */
export const PROMOTION_BONUS: Money = 0;
