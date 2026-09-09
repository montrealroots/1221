/**
 * SLATE — what is on in town.
 *
 * The venues are real buildings in the cities they really stand in, and the
 * seasons are the real rhythms: football through the European winter, ball
 * games through the American summer, the touring acts thickest at the end of
 * the week, exhibitions that hang for months.
 *
 * The specific card is SLATE's own, every time. There is no listings feed, so
 * no fixture here is a real fixture, no act is a real act, and no result says
 * anything about anybody real: a match names no club and a score attaches to
 * nobody. The note on the page says exactly that.
 */

import type { Money } from '../core/money';
import type { Rng } from '../core/rng';

export const GOING_NOTE =
  'The venues are real buildings in the cities they really stand in, and the seasons run to the real '
  + 'calendar. What is on inside them is SLATE’s own: there’s no listings feed, so no fixture, act, '
  + 'production or exhibition here is a real one. A match names no club, a score attaches to nobody '
  + 'real, and every price is SLATE’s own calibration.';

// ---------------------------------------------------------------------------
// What kind of night it is
// ---------------------------------------------------------------------------

export type GoingKind = 'match' | 'concert' | 'classical' | 'opera' | 'play' | 'exhibition' | 'club_night';

export const GOING_LABEL: Readonly<Record<GoingKind, string>> = {
  match: 'A Match',
  concert: 'A Concert',
  classical: 'An Orchestra',
  opera: 'An Opera',
  play: 'A Play',
  exhibition: 'An Exhibition',
  club_night: 'A Club Night',
};

// ---------------------------------------------------------------------------
// The sporting year
// ---------------------------------------------------------------------------

/**
 * A sport, where it is followed, and when its season runs.
 *
 * Public record, kept coarse on purpose: which months a country's main
 * season covers and what kind of building it happens in. Kickoff times,
 * fixtures and everything else are SLATE's own.
 */
export interface Sport {
  id: string;
  label: string;
  /** Countries where this is the crowd's game, by the geography's ids. */
  countryIds: readonly string[];
  /** The months the season runs, 1-12. */
  months: readonly number[];
  /** Days of the week it is usually played, 0 Sunday through 6 Saturday. */
  days: readonly number[];
  venueKind: 'stadium' | 'arena';
  /** What the card calls a fixture, without ever naming a club. */
  cards: readonly string[];
  about: string;
}

const sp = (
  id: string, label: string, countryIds: readonly string[], months: readonly number[],
  days: readonly number[], venueKind: 'stadium' | 'arena', cards: readonly string[], about: string,
): Sport => ({ id, label, countryIds, months, days, venueKind, cards, about });

const EURO_SEASON = [8, 9, 10, 11, 12, 1, 2, 3, 4, 5];

export const SPORTS: readonly Sport[] = [
  sp('football', 'Football',
    ['uk', 'fr', 'de', 'it', 'es', 'pt', 'nl', 'be', 'tr', 'gr', 'ie', 'pl', 'ru', 'ua', 'at', 'ch', 'dk', 'se', 'no',
      'eg', 'ma', 'ng', 'gh', 'za', 'ke', 'tz', 'dz', 'tn', 'sa', 'ae', 'qa', 'ir', 'iq',
      'mx', 'ar', 'cl', 'co', 'pe', 'uy', 'ec', 'in', 'id', 'th', 'my', 'vn', 'cn', 'kr', 'jp', 'br', 'us'],
    EURO_SEASON, [6, 0, 2, 3], 'stadium',
    ['A league match', 'A cup tie', 'A derby, and the town split down the middle', 'A relegation scrap', 'A top of the table match'],
    'The world’s game. The European season runs August to May; SLATE keeps every country to that rhythm as its own calibration, because the exceptions move year to year.'),
  sp('basketball', 'Basketball', ['us', 'ca', 'es', 'gr', 'tr', 'lt', 'rs', 'ph', 'cn'],
    [10, 11, 12, 1, 2, 3, 4], [2, 3, 4, 5, 6], 'arena',
    ['A regular season game', 'A rivalry night', 'A back to back, and the legs know it'],
    'Indoors from October to April, most nights of the week.'),
  sp('baseball', 'Baseball', ['us', 'ca', 'jp', 'kr', 'mx', 'cu', 'do', 've', 'tw'],
    [4, 5, 6, 7, 8, 9], [1, 2, 3, 4, 5, 6, 0], 'stadium',
    ['An afternoon at the ballpark', 'A night game under the lights', 'A doubleheader, if the rain holds off'],
    'The summer game: April to September, nearly every day.'),
  sp('american_football', 'Football, The American Kind', ['us'],
    [9, 10, 11, 12, 1], [0, 1, 4], 'stadium',
    ['A Sunday game', 'A division game with everything on it', 'A cold night game the forecast promised'],
    'Sundays from September to January, with a Monday and a Thursday thrown in.'),
  sp('ice_hockey', 'Ice Hockey', ['ca', 'us', 'se', 'fi', 'cz', 'sk', 'ch', 'de', 'ru', 'lv'],
    [10, 11, 12, 1, 2, 3, 4], [2, 4, 6], 'arena',
    ['A regular season game', 'An original rivalry night', 'A goalie duel nobody planned'],
    'October to April, on ice, indoors.'),
  // Cricket follows the sun, so it is two seasons rather than one: the English
  // summer, and the subcontinental and southern one on the other side of the
  // year. Putting them in one entry had test matches at Wembley in March.
  sp('cricket_north', 'Cricket', ['uk', 'ie'],
    [5, 6, 7, 8, 9], [6, 0, 4], 'stadium',
    ['A one day match', 'A T20 night, all noise', 'A test match day, all patience'],
    'The English season, May to September, and not a day of it in the winter.'),
  sp('cricket_south', 'Cricket', ['in', 'pk', 'bd', 'lk', 'au', 'nz', 'za'],
    [10, 11, 12, 1, 2, 3], [6, 0, 4], 'stadium',
    ['A one day match', 'A T20 night, all noise', 'A test match day, all patience'],
    'The subcontinental and southern season, October to March, played through their summer.'),
  sp('aussie_rules', 'Australian Rules Football', ['au'],
    [3, 4, 5, 6, 7, 8, 9], [4, 5, 6, 0], 'stadium',
    ['A home and away round', 'A Friday night blockbuster', 'A final, and the city stops'],
    'March to September, and in Melbourne it’s the only thing anybody talks about.'),
  sp('rugby', 'Rugby', ['nz', 'au', 'za', 'fr', 'uk', 'ie', 'ar', 'fj', 'ws'],
    [9, 10, 11, 12, 1, 2, 3, 4, 5], [6, 0], 'stadium',
    ['A league round', 'A local derby, no quarter', 'A cup weekend'],
    'Winter weekends, either hemisphere’s winter.'),
];

/** The sports a country actually follows, in the order the crowds rank them. */
export function sportsIn(countryId: string): Sport[] {
  return SPORTS.filter((sport) => sport.countryIds.includes(countryId));
}

// ---------------------------------------------------------------------------
// The acts, which are SLATE's own
// ---------------------------------------------------------------------------

const ACT_ONE = [
  'The Night Buses', 'Copper Kite', 'The Slow Corridor', 'Radial', 'The Weekday Saints',
  'Glasshouse Choir', 'The Long Lease', 'Petrol Moon', 'The Understudies', 'Northern Fold',
  'The Paper Anchors', 'Low Orbit', 'The Fire Doors', 'Signal Hill', 'The Last Appointment',
  'Wintergarten', 'The Borrowed Band', 'Milk Teeth Parade', 'The Standing Water', 'Half Past Nine',
];

const ACT_SOLO_FIRST = ['Ada', 'June', 'Marlow', 'Ivo', 'Tessa', 'Ray', 'Noor', 'Callum', 'Frida', 'Otis', 'Vera', 'Sol'];
const ACT_SOLO_LAST = ['Vane', 'Harker', 'Delmar', 'Quaye', 'Lindqvist', 'Okafor', 'Reyes', 'Whitfield', 'Andrade', 'Ferro'];

/** A touring act that exists nowhere outside this save. */
export function actName(rng: Rng): string {
  return rng.chance(0.55)
    ? rng.pick(ACT_ONE)
    : `${rng.pick(ACT_SOLO_FIRST)} ${rng.pick(ACT_SOLO_LAST)}`;
}

/**
 * A concert program at a hall.
 *
 * The composers are real and long dead and their works are public record;
 * which hall plays which of them on which night is SLATE's own, which is how
 * concert seasons look from the outside anyway.
 */
const PROGRAMS = [
  'Beethoven’s Seventh, and a new piece before the interval',
  'Mahler’s Fifth, no interval, no encore',
  'Brahms’s Fourth, with a young soloist in the Sibelius before it',
  'Mozart and Haydn, played standing',
  'Shostakovich’s Tenth, which empties nobody out gently',
  'A Tchaikovsky night: the violin concerto and the Fifth',
  'Debussy and Ravel, an evening of water',
  'Bach’s Mass in B minor, with the choir on risers',
  'Dvořák’s New World, and the hall full of people who know the tune',
  'Stravinsky’s Rite, and the strings earning their money',
  'A Chopin recital, one piano, no microphone',
  'Vivaldi’s Seasons, played fast the way they play it now',
];

export function programName(rng: Rng): string {
  return rng.pick(PROGRAMS);
}

/**
 * The operas in repertory.
 *
 * Real works, long out of copyright, that are genuinely in rep somewhere in
 * the world on any given night. Which house plays which is SLATE's own.
 */
const OPERAS = [
  'La Bohème', 'Carmen', 'The Magic Flute', 'La Traviata', 'Tosca', 'The Marriage Of Figaro',
  'Madama Butterfly', 'Don Giovanni', 'Rigoletto', 'The Barber Of Seville', 'Turandot', 'Aida',
];

export function operaName(rng: Rng): string {
  return rng.pick(OPERAS);
}

/** A play that exists nowhere outside this save. */
const PLAY_TITLES = [
  'The Coat Room', 'A Reasonable Hour', 'The Allotment', 'Dead Letters', 'The Third Floor Walk Up',
  'The Understudy’s Wedding', 'A Cold Supper', 'The Border Post', 'What The House Heard',
  'The Long Service Award', 'An Evening With No Speeches', 'The Retaining Wall', 'The Night Shift Choir',
  'A Marriage In Instalments', 'The Last Ferry Home', 'The Quiet Carriage',
];

export function playName(rng: Rng): string {
  return rng.pick(PLAY_TITLES);
}

/** An exhibition that hangs nowhere outside this save. */
const EXHIBITION_FIRST = [
  'The Sea, Twice', 'Rooms And Their Uses', 'A Short History Of The Window', 'Salt And Light',
  'The Domestic Sublime', 'Machines For Remembering', 'The Unfinished City', 'Cloth, Paper, Stone',
  'Portraits Of Nobody', 'The Weather Indoors', 'Everything Held Still', 'The Far Wall',
];
const EXHIBITION_SECOND = [
  'a century of marine painting', 'photography from the permanent collection', 'new work on paper',
  'sculpture in the north rooms', 'a loan collection, briefly here', 'the drawings, at last',
  'fifty years of posters', 'ceramics from three continents', 'a retrospective in six rooms',
];

export function exhibitionName(rng: Rng): string {
  return `${rng.pick(EXHIBITION_FIRST)}: ${rng.pick(EXHIBITION_SECOND)}`;
}

/** How many distinct cards the parts can make, for the checker to hold. */
export const CARD_COMBINATIONS =
  ACT_ONE.length + ACT_SOLO_FIRST.length * ACT_SOLO_LAST.length
  + PROGRAMS.length + OPERAS.length + PLAY_TITLES.length
  + EXHIBITION_FIRST.length * EXHIBITION_SECOND.length;

// ---------------------------------------------------------------------------
// What a night costs
// ---------------------------------------------------------------------------

/** Where you sit, which is most of what you pay for. */
export type Band = 'best' | 'middle' | 'cheap';

export const BAND_LABEL: Readonly<Record<Band, string>> = {
  best: 'The Best Seats',
  middle: 'The Middle Of The House',
  cheap: 'The Cheap Seats',
};

export const BAND_SHARE: Readonly<Record<Band, number>> = {
  best: 2.1,
  middle: 1,
  cheap: 0.45,
};

/** The base of a middle seat, by what kind of night it is. SLATE's calibration. */
export const BASE_PRICE: Readonly<Record<GoingKind, Money>> = {
  match: 48_00,
  concert: 85_00,
  classical: 52_00,
  opera: 90_00,
  play: 55_00,
  exhibition: 22_00,
  club_night: 20_00,
};

/** Roughly how many the room holds, by kind of room. SLATE's calibration. */
export const VENUE_SEATS: Readonly<Record<'stadium' | 'arena' | 'concert_hall' | 'theatre' | 'museum' | 'club', number>> = {
  stadium: 45_000,
  arena: 14_000,
  concert_hall: 2_000,
  theatre: 650,
  museum: 900,
  club: 400,
};

/** How long each kind of night runs, in minutes, before getting out again. */
export const RUNS_MINUTES: Readonly<Record<GoingKind, number>> = {
  match: 130,
  concert: 150,
  classical: 110,
  opera: 190,
  play: 140,
  exhibition: 90,
  club_night: 240,
};

/** How long before it starts they let you in, and how late they still will. */
export const DOORS_OPEN_MINUTES = 75;
export const DOORS_SHUT_MINUTES = 30;

/** A refund stands until this close to the start, and not a minute after. */
export const REFUNDABLE_UNTIL_MINUTES = 180;
