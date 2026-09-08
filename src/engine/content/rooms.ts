/**
 * SLATE — the last four ordinary rooms.
 *
 * The dentist, the vet, the licensing office and the phone shop. Two minutes
 * of play each, and between them the rest of what makes a week feel like a
 * week rather than a career.
 *
 * What is real here is the part that is genuinely public record and genuinely
 * differs between countries, which is mostly the question of who pays: the
 * three NHS bands in England and who is exempt from them, the German bonus
 * booklet that rewards turning up, the thirty percent a Japanese patient pays,
 * the fact that adult dentistry is not in the Dutch basic package at all, and
 * the fact that dental care sits outside medicare in Canada and Australia. So
 * are the veterinary groups, the core vaccines, and the microchipping law. So
 * are the mobile networks, and so is the right to keep your number.
 *
 * Everything else — what a filling costs, how long the queue is, whether the
 * screen repair goes well — is SLATE's own calibration, and every room says
 * so on itself.
 */

import type { Money } from '../core/money';

export const DENTIST_NOTE =
  'Who pays for dentistry is the part that really differs, and it is carried as published: England '
  + 'charges three bands and exempts under eighteens, students under nineteen and new mothers; Germany '
  + 'pays more toward your crown if you kept the bonus booklet stamped; a Japanese patient pays thirty '
  + 'percent; adult dentistry is not in the Dutch basic package at all; and in Canada, Australia and '
  + 'the United States it sits outside the health system entirely. The practice itself, the dentist, '
  + 'the waiting room and every price outside a published band are SLATE’s own.';

export const RECALL_NOTE =
  'Six months is the interval everybody grew up with rather than a rule. The National Institute for '
  + 'Health and Care Excellence has recommended anything from three months to two years depending on '
  + 'how much trouble your teeth actually give you since 2004, and SLATE follows that: turn up, keep '
  + 'them clean, and the practice asks to see you less often.';

export const TOOTH_NOTE =
  'Nothing here is dental advice. A treatment is named the way a practice names it on an invoice, with '
  + 'no clinical detail attached, and what it does in the game is move a number SLATE made up.';

// ---------------------------------------------------------------------------
// The dentist
// ---------------------------------------------------------------------------

/** How a country pays for a filling, which is the whole of what differs. */
export type DentalSystem = 'banded' | 'insured_share' | 'statutory_share' | 'private' | 'salaried';

export const DENTAL_SYSTEM_LABEL: Readonly<Record<DentalSystem, string>> = {
  banded: 'Banded Charges',
  insured_share: 'A Separate Dental Policy',
  statutory_share: 'A Share Of It, Publicly Paid',
  private: 'Paid For Privately',
  salaried: 'Free At The Point Of Use',
};

export interface DentalRegime {
  countryIds: readonly string[];
  system: DentalSystem;
  /** What the patient pays, as a share of the full price, where a share is what happens. */
  patientShare: number;
  /** Ages that pay nothing at all, where a country exempts them. */
  freeUnder?: number;
  about: string;
}

/**
 * Who pays, by country.
 *
 * Published arrangements. The shares are the headline share rather than the
 * whole of anybody's schedule, because a real schedule runs to hundreds of
 * line items and changes every April.
 */
export const DENTAL_REGIMES: readonly DentalRegime[] = [
  {
    countryIds: ['uk'], system: 'banded', patientShare: 1, freeUnder: 18,
    about: 'England charges in three bands: one for an examination and a scale and polish, one for fillings and extractions, and one for anything laboratory made. Under eighteens pay nothing, nor do students under nineteen, nor women pregnant or with a baby under one.',
  },
  {
    countryIds: ['de', 'at'], system: 'statutory_share', patientShare: 0.35, freeUnder: 18,
    about: 'Statutory insurance pays for conservative treatment outright and a fixed subsidy toward a crown. Keep the bonus booklet stamped every year and the subsidy goes up, which is the most German incentive in this file and is entirely real.',
  },
  {
    countryIds: ['jp'], system: 'statutory_share', patientShare: 0.3,
    about: 'National health insurance covers dentistry like anything else and the patient pays thirty percent, which is why a Japanese filling costs about what a coffee and lunch costs.',
  },
  {
    countryIds: ['fr'], system: 'statutory_share', patientShare: 0.3,
    about: 'Assurance Maladie reimburses most of a check-up and a share of the rest, and since 2021 the hundred percent health basket has crowns and dentures with nothing to pay at the counter.',
  },
  {
    countryIds: ['nl'], system: 'private', patientShare: 1, freeUnder: 18,
    about: 'Adult dentistry is not in the Dutch basic package at all. Under eighteens are covered; everybody else pays, or buys the supplementary policy that is one of the most commonly bought things in the country.',
  },
  {
    countryIds: ['se'], system: 'salaried', patientShare: 0.4, freeUnder: 24,
    about: 'Free until the year you turn twenty four, and after that a subsidy plus a high cost ceiling that caps what a bad year can cost you.',
  },
  {
    countryIds: ['dk', 'no', 'fi', 'is'], system: 'salaried', patientShare: 0.5, freeUnder: 18,
    about: 'Free for children and young people, and a subsidised share for adults. The Nordic arrangement differs country by country in the detail and agrees on the shape.',
  },
  {
    countryIds: ['es', 'it', 'pt', 'gr', 'pl', 'cz', 'hu', 'ro', 'bg', 'hr', 'sk', 'si'], system: 'private',
    patientShare: 0.9, freeUnder: 16,
    about: 'The public system covers extractions and emergencies and children, and almost everybody sees a private dentist for anything else.',
  },
  {
    countryIds: ['us'], system: 'insured_share', patientShare: 0.5,
    about: 'Dental is a separate policy from health insurance and usually pays all of the preventive work, most of the basic work and half of the major work, up to a yearly maximum that has barely moved in decades.',
  },
  {
    countryIds: ['ca'], system: 'insured_share', patientShare: 0.6,
    about: 'Dentistry sits outside medicare, so it is an employer plan or your own pocket. The national dental plan that began rolling out in 2024 is changing that for people without cover.',
  },
  {
    countryIds: ['au', 'nz'], system: 'private', patientShare: 0.85,
    about: 'General dentistry is outside Medicare and is private or on extras cover. Eligible children get a capped benefit, which is the one part the public system does pay.',
  },
  {
    countryIds: ['br', 'mx', 'ar', 'cl', 'co', 'in', 'ph', 'id', 'vn', 'th', 'ng', 'ke', 'za', 'eg', 'tr'],
    system: 'private', patientShare: 0.95,
    about: 'A public clinic for an emergency and a private practice for everything else, which is what most of the world actually does.',
  },
];

/** A country SLATE does not carry a regime for pays privately, and the room says so. */
export const GENERAL_DENTAL: DentalRegime = {
  countryIds: [], system: 'private', patientShare: 1,
  about: 'SLATE does not carry this country’s own arrangement, so it is treated as paid for privately rather than guessed at.',
};

export interface Treatment {
  id: string;
  label: string;
  /** The England band it falls in, where the country charges in bands. */
  band: 1 | 2 | 3 | 0;
  /** What it costs at full price before anybody pays a share. SLATE's calibration. */
  price: Money;
  minutes: number;
  /** How much it moves the state of somebody's teeth, out of a hundred. */
  restores: number;
  /** Whether it needs a problem to fix rather than being routine. */
  needsTrouble: boolean;
  about: string;
}

const t = (
  id: string, label: string, band: 1 | 2 | 3 | 0, price: Money, minutes: number, restores: number,
  needsTrouble: boolean, about: string,
): Treatment => ({ id, label, band, price, minutes, restores, needsTrouble, about });

/**
 * What a practice does, named the way an invoice names it.
 *
 * The England band each falls in is published. The price is SLATE's own
 * calibration of a full private fee, which is what the shares above are taken
 * from.
 */
export const TREATMENTS: readonly Treatment[] = [
  t('exam', 'An Examination', 1, 65_00, 20, 4, false,
    'A look, a poke with the sharp thing, and a date for the next one.'),
  t('xray', 'Bitewing X Rays', 1, 45_00, 15, 2, false,
    'Two small films to see between the teeth, where the mirror cannot.'),
  t('hygienist', 'A Scale And Polish', 1, 85_00, 30, 12, false,
    'Half an hour with the hygienist, and your teeth feel like somebody else’s afterwards.'),
  t('fluoride', 'Fluoride Varnish', 1, 30_00, 10, 6, false,
    'Painted on, tastes of nothing much, and works.'),
  t('filling', 'A Filling', 2, 180_00, 45, 22, true,
    'The injection is the worst part and it is over in a minute.'),
  t('extraction', 'An Extraction', 2, 220_00, 40, 18, true,
    'Out, with more pushing and less pulling than anybody expects.'),
  t('root_canal', 'Root Canal Treatment', 2, 750_00, 90, 34, true,
    'Two appointments, a bad reputation and, done properly, no pain at all.'),
  t('wisdom', 'A Wisdom Tooth Out', 2, 480_00, 60, 20, true,
    'Swelling for three days and soup for two of them.'),
  t('crown', 'A Crown', 3, 950_00, 70, 30, true,
    'An impression, a temporary one for a fortnight, and then the real one goes on.'),
  t('bridge', 'A Bridge', 3, 1_400_00, 80, 32, true,
    'A false tooth held by the two either side of the gap.'),
  t('denture', 'A Denture', 3, 1_100_00, 60, 28, true,
    'Made in a laboratory, fitted twice, and the second fitting is the one that matters.'),
  t('whitening', 'Whitening', 0, 400_00, 60, 0, false,
    'Cosmetic, not covered anywhere, and the one thing on this list an actor is asked about.'),
];

export const TREATMENT_BY_ID: Readonly<Record<string, Treatment>> = Object.fromEntries(
  TREATMENTS.map((one) => [one.id, one]),
);

/** England's three band charges, as published, in the game's one currency. */
export const BAND_CHARGE: Readonly<Record<1 | 2 | 3, Money>> = { 1: 27_00, 2: 75_00, 3: 326_00 };

/** How long a set of teeth goes before the practice wants to see them again. */
export const RECALL_SHORTEST_MONTHS = 3;
export const RECALL_LONGEST_MONTHS = 24;
/** Where a mouth starts, and how fast it goes without anybody looking at it. */
export const TEETH_START = 82;
export const TEETH_DECAY_A_MONTH = 0.8;
/** Below this, something hurts and the practice will find it. */
export const TEETH_TROUBLE = 55;

// ---------------------------------------------------------------------------
// The vet
// ---------------------------------------------------------------------------

export const VET_NOTE =
  'The veterinary groups are real companies with real practices in the countries listed, and where a '
  + 'country has no group SLATE carries the practice is an independent one, which is what most of the '
  + 'world’s practices are. The core vaccines are the ones the profession really calls core, and the '
  + 'microchipping law is the law. Every fee, every waiting time and every outcome is SLATE’s own.';

export const CHIP_NOTE =
  'Microchipping a dog has been compulsory in England, Scotland and Wales since 2016, and a cat in '
  + 'England since the tenth of June 2024. Where a country requires it the room says the law; where it '
  + 'does not, it is offered as the sensible thing it is.';

export const OUT_OF_HOURS_NOTE =
  'An emergency at two in the morning costs a great deal more than the same thing at two in the '
  + 'afternoon, everywhere, and that is real. How much more is SLATE’s own calibration.';

export interface VetGroup {
  id: string;
  name: string;
  countryIds: readonly string[];
  about: string;
}

const vg = (id: string, name: string, countryIds: readonly string[], about: string): VetGroup =>
  ({ id, name, countryIds, about });

/**
 * The veterinary groups.
 *
 * Public record: the company exists and runs practices in those countries.
 * Which practice is on which corner, and everything that happens inside it,
 * is SLATE's own.
 */
export const VET_GROUPS: readonly VetGroup[] = [
  vg('vets4pets', 'Vets4Pets', ['uk'],
    'Practices inside and beside Pets at Home stores, which is why the waiting room smells of dog food.'),
  vg('medivet', 'Medivet', ['uk', 'de', 'es', 'fr'],
    'A large British group that has been buying practices across Europe for years.'),
  vg('cvs', 'CVS Group', ['uk', 'ie', 'nl'],
    'One of the bigger British groups, with its own laboratories behind the practices.'),
  vg('vetpartners', 'VetPartners', ['uk', 'ie', 'fr', 'it', 'es', 'de', 'nl'],
    'A group of practices that mostly kept their own names over the door, so you may not know you are in one.'),
  vg('ivc', 'IVC Evidensia', ['uk', 'se', 'no', 'dk', 'fi', 'de', 'nl', 'be', 'fr', 'es', 'pt', 'it', 'ch', 'ie', 'ca'],
    'The largest veterinary group in Europe, formed out of a British and a Swedish one.'),
  vg('anicura', 'AniCura', ['se', 'no', 'dk', 'fi', 'de', 'nl', 'at', 'ch', 'fr', 'es', 'it', 'pt'],
    'A Nordic group that spread across the continent, now part of Mars.'),
  vg('banfield', 'Banfield Pet Hospital', ['us'],
    'Practices inside PetSmart stores, with a wellness plan you pay monthly whether you go or not.'),
  vg('vca', 'VCA Animal Hospitals', ['us', 'ca'],
    'One of the largest American groups, with specialists and referral hospitals behind the general practices.'),
  vg('bluepearl', 'BluePearl Pet Hospital', ['us'],
    'Emergency and specialty, open when everybody else is shut, and priced accordingly.'),
  vg('thrive', 'Thrive Pet Healthcare', ['us'],
    'A membership priced group that made routine care a subscription.'),
  vg('greencross', 'Greencross Vets', ['au'],
    'Australian practices, many of them beside a Petbarn.'),
  vg('vetcor', 'VetCor', ['us'],
    'A group that leaves each practice running the way it was running when they bought it.'),
];

export const VET_GROUP_BY_ID: Readonly<Record<string, VetGroup>> = Object.fromEntries(
  VET_GROUPS.map((one) => [one.id, one]),
);

/** The groups with practices in a country. */
export function vetGroupsIn(countryId: string): VetGroup[] {
  return VET_GROUPS.filter((one) => one.countryIds.includes(countryId));
}

/** Whether SLATE carries a real group for this country, or an independent practice. */
export function vetGroupIsCountrys(countryId: string): boolean {
  return VET_GROUPS.some((one) => one.countryIds.includes(countryId));
}

/** Countries where a dog must be microchipped by law, and the year it came in. */
export const CHIP_REQUIRED: Readonly<Record<string, { dogsFrom: number; catsFrom?: number }>> = {
  uk: { dogsFrom: 2016, catsFrom: 2024 },
  ie: { dogsFrom: 2015 },
  fr: { dogsFrom: 2012 },
  es: { dogsFrom: 2000 },
  pt: { dogsFrom: 2019 },
  it: { dogsFrom: 2005 },
  be: { dogsFrom: 1998, catsFrom: 2018 },
  nl: { dogsFrom: 2013 },
  de: { dogsFrom: 2000 },
  au: { dogsFrom: 1999, catsFrom: 1999 },
  nz: { dogsFrom: 2006 },
  jp: { dogsFrom: 2022, catsFrom: 2022 },
};

export interface VetService {
  id: string;
  label: string;
  price: Money;
  minutes: number;
  /** How much it puts back into an animal's health, out of a hundred. */
  restores: number;
  /** How many months it is good for, where it is a thing that lapses. */
  lastsMonths?: number;
  /** Whether it needs the animal to actually be unwell. */
  needsTrouble: boolean;
  about: string;
}

const vs = (
  id: string, label: string, price: Money, minutes: number, restores: number, needsTrouble: boolean,
  about: string, lastsMonths?: number,
): VetService => ({ id, label, price, minutes, restores, needsTrouble, about, lastsMonths });

/**
 * What a practice does.
 *
 * The vaccines are the ones the profession calls core: distemper, hepatitis,
 * parvovirus and parainfluenza for a dog, with leptospirosis on top in Britain;
 * panleukopenia, herpesvirus and calicivirus for a cat. Rabies where the law or
 * the border wants it. Every price is SLATE's own.
 */
export const VET_SERVICES: readonly VetService[] = [
  vs('checkup', 'An Annual Check Up', 60_00, 20, 8, false,
    'Weight, teeth, ears, heart, and a conversation about how much they are being fed.', 12),
  vs('vaccination', 'The Yearly Boosters', 75_00, 20, 10, false,
    'The core vaccines and a stamp in the book. A year, and then again.', 12),
  vs('chip', 'A Microchip', 25_00, 15, 2, false,
    'A needle between the shoulder blades, a number, and a database that has to be kept up to date.'),
  vs('neuter', 'Neutering', 280_00, 90, 6, false,
    'A day at the practice, a cone for a fortnight, and a calmer animal after it.'),
  vs('flea', 'Flea And Worm Treatment', 35_00, 10, 6, false,
    'A pipette on the back of the neck and a tablet they will spit out twice before swallowing.', 3),
  vs('dental_vet', 'A Dental Under Anaesthetic', 420_00, 120, 16, true,
    'The only way to clean an animal’s teeth properly, and it is a general anaesthetic to do it.'),
  vs('bloods', 'Blood Work', 180_00, 30, 4, true,
    'Sent away, back in two days, and usually the thing that says what is actually wrong.'),
  vs('xray_vet', 'An X Ray', 220_00, 45, 5, true,
    'A sedation, a plate, and a look at what the hands could only guess at.'),
  vs('treatment', 'Treatment For Whatever It Is', 260_00, 60, 34, true,
    'The consultation that finds it and the course that fixes it.'),
  vs('emergency', 'An Out Of Hours Emergency', 700_00, 90, 40, true,
    'Two in the morning, a different building, and a bill that reflects both.'),
];

export const VET_SERVICE_BY_ID: Readonly<Record<string, VetService>> = Object.fromEntries(
  VET_SERVICES.map((one) => [one.id, one]),
);

/** What an out of hours visit multiplies a fee by. SLATE's own calibration of a real thing. */
export const OUT_OF_HOURS_MULTIPLE = 2.4;
/** Where an animal's health starts and how fast it falls without anybody looking. */
export const PET_HEALTH_START = 88;
export const PET_DECAY_A_MONTH = 0.9;
/** Below this, something is wrong and the practice will find it. */
export const PET_TROUBLE = 60;
/** How long boosters and a flea treatment really last, in months, before they lapse. */
export const BOOSTER_MONTHS = 12;

// ---------------------------------------------------------------------------
// The licensing office
// ---------------------------------------------------------------------------

export const OFFICE_NOTE =
  'The office is the real one for where you are standing: the California DMV, the Massachusetts RMV, '
  + 'the Michigan Secretary of State, ServiceOntario, the SAAQ, VicRoads, the DVLA, the Führerscheinstelle, '
  + 'the Dirección General de Tráfico. All fifty one American states and the District carry their own '
  + 'name for it, because they really do call it fifty one different things. The queue, the ticket, the '
  + 'form you filled in wrong and the person behind the glass are SLATE’s own.';

export const QUEUE_NOTE =
  'An appointment is quicker than turning up, and turning up first thing is quicker than turning up '
  + 'at two. That is true everywhere and how much quicker is SLATE’s own calibration.';

/** What you can actually go in for. */
export interface CounterJob {
  id: string;
  label: string;
  /** The minimum age it makes sense at. */
  fromAge: number;
  /** What the office charges, on top of anything the documents system charges. */
  fee: Money;
  /** How long it takes once you are called. */
  minutes: number;
  /** Whether the paperwork can be got wrong, which sends you home. */
  fussy: boolean;
  about: string;
}

const cj = (
  id: string, label: string, fromAge: number, fee: Money, minutes: number, fussy: boolean, about: string,
): CounterJob => ({ id, label, fromAge, fee, minutes, fussy, about });

/**
 * The counter's business.
 *
 * Every one of these is a thing a licensing office really does. What each
 * costs beyond the published license fee, and how long the queue is, is
 * SLATE's own.
 */
export const COUNTER_JOBS: readonly CounterJob[] = [
  cj('provisional', 'Apply For A Learner Permit', 15, 34_00, 25, true,
    'The first document, and the one that lets an instructor put you behind a wheel.'),
  cj('theory', 'Book The Knowledge Test', 15, 23_00, 20, false,
    'A date, a test center, and a booklet you will not read until the week before.'),
  cj('road_test', 'Book The Road Test', 16, 62_00, 20, false,
    'Booked out for weeks, and the date you get is the date you get.'),
  cj('renew', 'Renew The License', 17, 34_00, 25, true,
    'A photograph you will dislike for the next ten years.'),
  cj('replace', 'Replace A Lost License', 17, 20_00, 30, true,
    'A form, a fee, and a fortnight of carrying nothing.'),
  cj('address', 'Change The Address On It', 17, 0, 20, true,
    'Free almost everywhere, compulsory almost everywhere, and forgotten by almost everybody.'),
  cj('register', 'Register A Vehicle', 17, 95_00, 40, true,
    'Proof it is yours, proof it is insured, proof it is roadworthy, and then a plate.'),
  cj('transfer', 'Transfer A Vehicle Into Your Name', 17, 45_00, 35, true,
    'The half of a private sale that people forget until the first parking ticket arrives.'),
  cj('plate', 'Order A Personal Plate', 17, 400_00, 30, false,
    'Vanity, taxed, and the queue does not care that it is vanity.'),
  cj('id_card', 'Apply For An Identity Card', 14, 30_00, 25, true,
    'For anybody who does not drive and still has to prove who they are.'),
];

export const COUNTER_JOB_BY_ID: Readonly<Record<string, CounterJob>> = Object.fromEntries(
  COUNTER_JOBS.map((one) => [one.id, one]),
);

/** How you got there, which decides how long you stand about. */
export type Arrival = 'appointment' | 'first_thing' | 'walk_in';

export const ARRIVAL_LABEL: Readonly<Record<Arrival, string>> = {
  appointment: 'With An Appointment',
  first_thing: 'First Thing, Before It Opens',
  walk_in: 'Whenever You Get There',
};

/** The wait each way of arriving really buys you, in minutes. SLATE's own. */
export const WAIT_MINUTES: Readonly<Record<Arrival, readonly [number, number]>> = {
  appointment: [5, 25],
  first_thing: [15, 55],
  walk_in: [35, 140],
};

/** How far ahead an appointment has to be booked, in days. */
export const APPOINTMENT_DAYS: readonly [number, number] = [6, 34];

/** The chance the paperwork is wrong on a fussy job and you are sent home. */
export const PAPERWORK_WRONG = 0.18;

/** What the person behind the glass says when it is wrong. */
export const SENT_HOME: readonly string[] = [
  'The proof of address has to be dated within three months. That one is from March.',
  'This form wants the other kind of signature. Black ink, inside the box.',
  'You need the original, not a photocopy of the original.',
  'That is the old version of the form. There is a stack of the new one by the door.',
  'The name on this does not match the name on that. One of them has to change first.',
  'You want counter four for this, and counter four closed at three.',
];

/** And what they say when it is right, which is not effusive. */
export const DONE_AT_THE_COUNTER: readonly string[] = [
  'Right. That is done. Next.',
  'Fine. It will come in the post.',
  'Good. Sign there, and there. Thank you.',
  'That is you sorted. Mind how you go.',
  'All in order. You will get a letter.',
];

// ---------------------------------------------------------------------------
// The phone shop
// ---------------------------------------------------------------------------

export const NETWORK_NOTE =
  'The networks are real companies operating in the countries listed. What SLATE carries about them is '
  + 'whether a network runs its own masts or rents somebody else’s, which is durable and public and is '
  + 'the thing that actually decides what your signal is like. Every tariff, every allowance and every '
  + 'price is SLATE’s own calibration, because a real tariff changes several times a year.';

export const PORTING_NOTE =
  'Keeping your number when you change network is a legal right in every country here, and it works the '
  + 'way it really works: you ask the old network for a code, you give it to the new one, and the number '
  + 'moves within a working day or so. Britain calls the code a PAC. SLATE carries the shape of it.';

export const HANDSET_NOTE =
  'The handsets are the real ones already in the catalog. What a shop does here is put one on a plan, '
  + 'take an old one in part exchange, or mend the screen of the one you have. What any of that costs '
  + 'is SLATE’s own.';

/** Whether a network owns its masts, which is what decides the signal. */
export type NetworkKind = 'own_network' | 'virtual';

export const NETWORK_KIND_LABEL: Readonly<Record<NetworkKind, string>> = {
  own_network: 'Its Own Masts',
  virtual: 'Somebody Else’s Masts',
};

export interface Network {
  id: string;
  name: string;
  countryIds: readonly string[];
  kind: NetworkKind;
  /** Coverage and speed, out of a hundred. SLATE's own reading of a real reputation. */
  signal: number;
  /** How the price sits against the market: 1 is the middle of it. */
  pricing: number;
  about: string;
}

const nw = (
  id: string, name: string, countryIds: readonly string[], kind: NetworkKind, signal: number,
  pricing: number, about: string,
): Network => ({ id, name, countryIds, kind, signal, pricing, about });

/**
 * The networks.
 *
 * Public record: the company operates there, and whether it runs its own
 * network or resells one. Everything else is SLATE's own calibration.
 */
export const NETWORKS: readonly Network[] = [
  // The United States
  nw('verizon', 'Verizon', ['us'], 'own_network', 92, 1.35, 'The one people buy for coverage, and it charges for it.'),
  nw('att', 'AT&T', ['us'], 'own_network', 88, 1.25, 'The other big one, and the one with the most shops on the most corners.'),
  nw('tmobile_us', 'T-Mobile', ['us'], 'own_network', 87, 1.05, 'Cheaper than the other two and no longer worse than them.'),
  nw('mint', 'Mint Mobile', ['us'], 'virtual', 80, 0.45, 'Bought a year at a time on somebody else’s network, and priced like it.'),
  nw('cricket', 'Cricket Wireless', ['us'], 'virtual', 82, 0.6, 'Prepaid, no contract, and it runs on the same masts as its parent.'),
  nw('visible', 'Visible', ['us'], 'virtual', 85, 0.55, 'One price, everything included, and support that is a chat window.'),
  nw('uscellular', 'UScellular', ['us'], 'own_network', 74, 1.0, 'Its own network across the middle of the country and a roaming deal everywhere else.'),
  // The United Kingdom and Ireland
  nw('ee', 'EE', ['uk'], 'own_network', 91, 1.3, 'The fastest of the four most places, and it knows it.'),
  nw('o2', 'O2', ['uk'], 'own_network', 84, 1.05, 'Good in cities, patchier out of them, and the one with the concert tickets.'),
  nw('vodafone_uk', 'Vodafone', ['uk'], 'own_network', 83, 1.05, 'A network that has been merging with Three for years.'),
  nw('three', 'Three', ['uk'], 'own_network', 78, 0.8, 'Cheap data, and a signal that depends entirely on where you stand.'),
  nw('giffgaff', 'giffgaff', ['uk'], 'virtual', 84, 0.55, 'Runs on O2, sold entirely online, and the support is other customers.'),
  nw('tesco_mobile', 'Tesco Mobile', ['uk'], 'virtual', 84, 0.7, 'On O2’s masts, sold beside the groceries, and it gives you Clubcard points.'),
  nw('sky_mobile', 'Sky Mobile', ['uk'], 'virtual', 84, 0.75, 'On O2, and it rolls your unused data over into a piggy bank.'),
  nw('lebara', 'Lebara', ['uk', 'de', 'nl', 'fr', 'es', 'dk'], 'virtual', 80, 0.5, 'Built around cheap international calling and priced for it.'),
  nw('eir', 'eir', ['ie'], 'own_network', 82, 1.0, 'The former state operator, and still the one with the most exchanges.'),
  nw('three_ie', 'Three Ireland', ['ie'], 'own_network', 80, 0.85, 'The largest Irish network by subscribers since it took over O2 there.'),
  // Continental Europe
  nw('telekom_de', 'Deutsche Telekom', ['de'], 'own_network', 92, 1.4, 'The best network in Germany and the most expensive, which is not a coincidence.'),
  nw('vodafone_de', 'Vodafone', ['de'], 'own_network', 84, 1.1, 'The cable company as well, so it will try to sell you both.'),
  nw('o2_de', 'O2', ['de'], 'own_network', 78, 0.85, 'Cheaper, and the coverage map has more white on it.'),
  nw('congstar', 'congstar', ['de'], 'virtual', 90, 0.65, 'Telekom’s own budget brand on Telekom’s own masts, which is the trick.'),
  nw('orange_fr', 'Orange', ['fr', 'es', 'be', 'pl', 'ro', 'ma', 'sn', 'ci'], 'own_network', 90, 1.3, 'The former France Télécom, and the best network in most of France.'),
  nw('sfr', 'SFR', ['fr'], 'own_network', 82, 1.0, 'The second one, and the one with the aggressive box offers.'),
  nw('bouygues', 'Bouygues Telecom', ['fr'], 'own_network', 80, 0.9, 'A construction company that got into telephones and stayed.'),
  nw('free_mobile', 'Free', ['fr'], 'own_network', 76, 0.5, 'Arrived in 2012 and halved the price of a French mobile plan by itself.'),
  nw('movistar', 'Movistar', ['es', 'ar', 'cl', 'co', 'mx', 'pe', 'uy'], 'own_network', 88, 1.25, 'Telefónica’s brand, and the incumbent almost everywhere it trades.'),
  nw('yoigo', 'Yoigo', ['es'], 'virtual', 80, 0.7, 'A challenger that rents most of its coverage and prices accordingly.'),
  nw('tim', 'TIM', ['it', 'br'], 'own_network', 86, 1.15, 'The Italian incumbent, and one of the three big Brazilian networks.'),
  nw('windtre', 'WindTre', ['it'], 'own_network', 84, 0.95, 'Two networks merged into one, with the coverage of both.'),
  nw('iliad', 'Iliad', ['it'], 'own_network', 76, 0.55, 'Free’s Italian arm, doing to Italy what Free did to France.'),
  nw('kpn', 'KPN', ['nl'], 'own_network', 90, 1.25, 'The Dutch incumbent, and consistently the best network in the country.'),
  nw('odido', 'Odido', ['nl'], 'own_network', 84, 0.95, 'What T-Mobile Netherlands became after it was sold.'),
  nw('proximus', 'Proximus', ['be'], 'own_network', 88, 1.2, 'The Belgian incumbent, majority owned by the state.'),
  nw('telia', 'Telia', ['se', 'no', 'dk', 'fi', 'lt', 'ee'], 'own_network', 89, 1.2, 'The Nordic incumbent, out of the old Swedish and Finnish state operators.'),
  nw('telenor', 'Telenor', ['no', 'se', 'dk', 'fi'], 'own_network', 88, 1.15, 'Norway’s own, and the other half of the Nordic duopoly.'),
  nw('elisa', 'Elisa', ['fi', 'ee'], 'own_network', 90, 1.0, 'Finnish, and the country with the cheapest unlimited data in Europe.'),
  nw('play_pl', 'Play', ['pl'], 'own_network', 82, 0.8, 'The largest Polish network by subscribers.'),
  nw('a1', 'A1', ['at', 'bg', 'hr', 'si', 'rs'], 'own_network', 86, 1.1, 'Telekom Austria’s brand across central Europe.'),
  nw('swisscom', 'Swisscom', ['ch'], 'own_network', 94, 1.6, 'The best coverage in Europe and the highest prices in Europe.'),
  nw('turkcell', 'Turkcell', ['tr'], 'own_network', 87, 1.1, 'The largest Turkish operator, and it builds its own everything.'),
  nw('mts', 'MTS', ['ru', 'by', 'am'], 'own_network', 84, 0.9, 'The largest Russian operator.'),
  // Asia and Oceania
  nw('docomo', 'NTT Docomo', ['jp'], 'own_network', 93, 1.35, 'The largest Japanese network, and the one that invented most of this.'),
  nw('au_kddi', 'au', ['jp'], 'own_network', 89, 1.25, 'KDDI’s brand, and the second of the three.'),
  nw('softbank', 'SoftBank', ['jp'], 'own_network', 87, 1.15, 'The third, and the one that keeps buying other people’s companies.'),
  nw('rakuten_mobile', 'Rakuten Mobile', ['jp'], 'own_network', 74, 0.5, 'Built a network from nothing in 2020 and undercut all three.'),
  nw('skt', 'SK Telecom', ['kr'], 'own_network', 93, 1.3, 'Korea’s largest, in the country with the fastest mobile data anywhere.'),
  nw('kt', 'KT', ['kr'], 'own_network', 90, 1.2, 'The former state operator, and the one with the fixed lines as well.'),
  nw('lg_uplus', 'LG U+', ['kr'], 'own_network', 87, 1.05, 'The third Korean network, and usually the cheapest of them.'),
  nw('jio', 'Jio', ['in'], 'own_network', 86, 0.35, 'Arrived in 2016, gave data away, and changed what a phone costs in India permanently.'),
  nw('airtel', 'Airtel', ['in', 'ng', 'ke', 'tz', 'ug', 'zm'], 'own_network', 85, 0.45, 'The other big Indian network, and a large African one.'),
  nw('china_mobile', 'China Mobile', ['cn'], 'own_network', 91, 0.8, 'The largest mobile operator in the world by subscribers.'),
  nw('china_unicom', 'China Unicom', ['cn'], 'own_network', 85, 0.7, 'The second of the three state operators.'),
  nw('singtel', 'Singtel', ['sg'], 'own_network', 92, 1.25, 'Singapore’s incumbent, and an investor in half the networks in the region.'),
  nw('telstra', 'Telstra', ['au'], 'own_network', 91, 1.4, 'The most coverage in a country that is mostly empty, and it charges for that.'),
  nw('optus', 'Optus', ['au'], 'own_network', 83, 1.05, 'The second network, good in the cities and thinner past them.'),
  nw('one_nz', 'One New Zealand', ['nz'], 'own_network', 86, 1.15, 'What Vodafone New Zealand became.'),
  nw('spark', 'Spark', ['nz'], 'own_network', 87, 1.15, 'The former Telecom New Zealand, and the largest there.'),
  // The Americas beyond the United States
  nw('rogers', 'Rogers', ['ca'], 'own_network', 88, 1.4, 'One of the big three, in one of the most expensive mobile markets anywhere.'),
  nw('bell', 'Bell', ['ca'], 'own_network', 88, 1.4, 'Another of the three, and the one with the television as well.'),
  nw('telus', 'Telus', ['ca'], 'own_network', 87, 1.35, 'The third, out of the west, and usually the best rated of them.'),
  nw('koodo', 'Koodo', ['ca'], 'virtual', 87, 0.85, 'Telus’s budget brand on Telus’s masts.'),
  nw('freedom', 'Freedom Mobile', ['ca'], 'own_network', 72, 0.7, 'The fourth network the regulator kept trying to make happen.'),
  nw('telcel', 'Telcel', ['mx'], 'own_network', 89, 1.1, 'América Móvil’s network, and most of the Mexican market by itself.'),
  nw('vivo', 'Vivo', ['br'], 'own_network', 88, 1.15, 'Telefónica’s Brazilian brand, and the largest there.'),
  nw('claro', 'Claro', ['br', 'ar', 'cl', 'co', 'pe', 'gt', 'do'], 'own_network', 85, 1.0, 'América Móvil across Latin America.'),
  // Africa and the Middle East
  nw('mtn', 'MTN', ['za', 'ng', 'gh', 'ug', 'zm', 'ci', 'cm'], 'own_network', 84, 0.9, 'South African, and the largest network on the continent.'),
  nw('vodacom', 'Vodacom', ['za', 'tz', 'mz', 'cd'], 'own_network', 86, 0.95, 'Vodafone’s southern African arm, and the biggest in South Africa.'),
  nw('safaricom', 'Safaricom', ['ke', 'et'], 'own_network', 87, 0.9, 'Kenyan, and the company that made a phone into a bank account with M-Pesa.'),
  nw('etisalat', 'e&', ['ae', 'eg', 'sa'], 'own_network', 89, 1.2, 'The Emirati incumbent, trading as e& since 2022.'),
  nw('stc', 'stc', ['sa', 'bh', 'kw'], 'own_network', 88, 1.15, 'The Saudi incumbent, and one of the largest operators in the region.'),
];

export const NETWORK_BY_ID: Readonly<Record<string, Network>> = Object.fromEntries(
  NETWORKS.map((one) => [one.id, one]),
);

/** The networks somebody in this country can actually buy from. */
export function networksIn(countryId: string): Network[] {
  return NETWORKS.filter((one) => one.countryIds.includes(countryId));
}

/** Whether SLATE carries this country's own networks. */
export function networksAreCountrys(countryId: string): boolean {
  return NETWORKS.some((one) => one.countryIds.includes(countryId));
}

/** How you buy it, which is the real choice in a phone shop. */
export type PlanKind = 'prepaid' | 'sim_only' | 'monthly_with_handset';

export interface Tariff {
  id: PlanKind;
  label: string;
  /** Months you are tied in for. */
  months: number;
  /** The base monthly price before the network's own pricing is applied. */
  monthly: Money;
  /** Gigabytes a month. Zero means as much as you like. */
  data: number;
  /** What it costs to get out early, as months of the remaining term. */
  exitShare: number;
  about: string;
}

export const TARIFFS: readonly Tariff[] = [
  {
    id: 'prepaid', label: 'Pay As You Go', months: 0, monthly: 12_00, data: 8, exitShare: 0,
    about: 'Top it up, use it, stop whenever. The most expensive way to buy a lot and the cheapest way to buy a little.',
  },
  {
    id: 'sim_only', label: 'SIM Only', months: 12, monthly: 20_00, data: 40, exitShare: 0.6,
    about: 'A year, no handset, and about half what the same allowance costs with a phone attached.',
  },
  {
    id: 'monthly_with_handset', label: 'Pay Monthly With A Handset', months: 24, monthly: 48_00, data: 60, exitShare: 1,
    about: 'Two years, a phone in the box, and the phone is not free however the sign is worded.',
  },
];

export const TARIFF_BY_ID: Readonly<Record<string, Tariff>> = Object.fromEntries(
  TARIFFS.map((one) => [one.id, one]),
);

/** What the shop does besides sell you a plan. */
export const SCREEN_REPAIR: Money = 180_00;
export const SCREEN_REPAIR_MINUTES = 90;
/** The chance a third party repair is a bad one, which is a real risk. */
export const BAD_REPAIR = 0.12;
/** What a trade in is worth, as a share of what the handset cost new. */
export const TRADE_IN_SHARE = 0.34;
/** How long a number takes to move, in days, which is a working day almost everywhere. */
export const PORTING_DAYS = 1;
/** How long the code you are given stays good for, in days. */
export const PORTING_CODE_DAYS = 30;

// ---------------------------------------------------------------------------
// Looking it all up
// ---------------------------------------------------------------------------

export const DENTAL_BY_COUNTRY: Readonly<Record<string, DentalRegime>> = Object.fromEntries(
  DENTAL_REGIMES.flatMap((one) => one.countryIds.map((countryId) => [countryId, one])),
);

/** Who pays for a filling where you are standing. */
export function dentalIn(countryId: string): DentalRegime {
  return DENTAL_BY_COUNTRY[countryId] ?? GENERAL_DENTAL;
}

/** Whether SLATE carries this country's own arrangement. */
export function dentalIsCountrys(countryId: string): boolean {
  return countryId in DENTAL_BY_COUNTRY;
}

/** Whether the law where you are requires this animal to be chipped. */
export function chipRequired(countryId: string, kind: 'dog' | 'cat'): number | undefined {
  const law = CHIP_REQUIRED[countryId];
  if (!law) return undefined;
  return kind === 'dog' ? law.dogsFrom : law.catsFrom;
}

/** The jobs a counter will do for somebody this age. */
export function counterJobsAt(age: number): CounterJob[] {
  return COUNTER_JOBS.filter((one) => age >= one.fromAge);
}

/** What a treatment costs the patient here, after whoever else pays their share. */
export function toothPrice(treatment: Treatment, countryId: string, age: number): Money {
  const regime = dentalIn(countryId);
  if (regime.freeUnder !== undefined && age < regime.freeUnder && treatment.band !== 0) return 0;
  // A banded country charges the band rather than the price, and charges
  // nothing at all for anything cosmetic because it is not treatment.
  if (regime.system === 'banded') {
    if (treatment.band === 0) return treatment.price;
    return BAND_CHARGE[treatment.band];
  }
  // Cosmetic work is outside every arrangement in this file, everywhere.
  const share = treatment.band === 0 ? 1 : regime.patientShare;
  return Math.round(treatment.price * share);
}
