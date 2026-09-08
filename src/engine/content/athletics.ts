/**
 * SLATE — track, and the one sport in the game.
 *
 * The rest of school sport is gone. What is here instead is the sport a
 * sprinter actually runs: the events as they are really contested, the meets
 * they are really contested at, the records as they really stand, and the
 * ladder from a school team to a world final.
 *
 * What is real in here: the events and their distances, the named meets and
 * the towns they are held in, the world records with the person who set each
 * one and the year, the entry standards a global championship publishes, and
 * the shape of a season at every level. What is SLATE's own: every rival in
 * every lane, every heat, every time run in this game and every result. There
 * is no results feed, and a made-up time attached to a real athlete would be
 * a claim about somebody real.
 */

import { clamp } from '../core/rng';

// ---------------------------------------------------------------------------
// What is real in here and what is not
// ---------------------------------------------------------------------------

export const ATHLETICS_NOTE =
  'The events, the meets, the towns they are held in and the shape of a season are public record '
  + 'and that is what SLATE carries. Everybody else in the race is SLATE’s own, and so is every '
  + 'time run in this game: there is no results feed, and a made-up time attached to a real '
  + 'athlete would be a claim about somebody real.';

export const RECORDS_NOTE =
  'The world records below are real, with the person who set each one, where, and in what year, as '
  + 'SLATE carries them. A record set after that is not in here. They are in the game as the marks '
  + 'a runner is chasing, never as something anybody in this save has beaten by being told they did.';

export const STANDARDS_NOTE =
  'The entry standards are the published qualifying marks for a global championship as SLATE '
  + 'carries them. World Athletics moves them every cycle and fills the rest of the field by '
  + 'ranking, so treat these as the bar of the cycle rather than a permanent number.';

export const MEETS_NOTE =
  'Every named meet in here is a real meet in a real town, on the month of the year it is really '
  + 'held. Which meets a season is built from is SLATE’s own, because a calendar changes every '
  + 'year, and everybody in the field is SLATE’s own for the same reason.';

export const CATEGORY_NOTE =
  'Track is contested in a men’s and a women’s category, with different events over the hurdles '
  + 'and different records and standards in all of them. SLATE carries that because it is how the '
  + 'sport is run. Which category a character competes in is their own choice at the track and is '
  + 'carried separately from anything else about them.';

// ---------------------------------------------------------------------------
// The events
// ---------------------------------------------------------------------------

export type RunnerCategory = 'mens' | 'womens';
export type Surface = 'indoor' | 'outdoor';
export type EventKind = 'sprint' | 'hurdles' | 'relay';

export const CATEGORY_LABEL: Readonly<Record<RunnerCategory, string>> = {
  mens: 'Men’s',
  womens: 'Women’s',
};

export interface TrackEvent {
  id: string;
  label: string;
  metres: number;
  kind: EventKind;
  surfaces: readonly Surface[];
  /** Where the event is only run in one category, as the high hurdles are. */
  category?: RunnerCategory;
  /** Whether a wind reading is taken, and can put a mark beyond the limit. */
  windRead: boolean;
  /** What decides it, and by how much. Each set sums to one. */
  weights: Readonly<Record<string, number>>;
  about: string;
}

function e(
  id: string, label: string, metres: number, kind: EventKind, surfaces: readonly Surface[],
  windRead: boolean, weights: Readonly<Record<string, number>>, about: string,
  category?: RunnerCategory,
): TrackEvent {
  return { id, label, metres, kind, surfaces, windRead, weights, about, category };
}

export const EVENTS: readonly TrackEvent[] = [
  e('60m', '60 Meters', 60, 'sprint', ['indoor'], false, {
    block_start: 0.18, reaction_time: 0.14, drive_phase: 0.22, acceleration: 0.22,
    top_speed: 0.12, sprint_mechanics: 0.08, competitive_nerve: 0.04,
  }, 'Indoors, over in under seven seconds, and decided almost entirely by the start.'),
  e('100m', '100 Meters', 100, 'sprint', ['outdoor'], true, {
    block_start: 0.10, reaction_time: 0.06, drive_phase: 0.14, acceleration: 0.16,
    top_speed: 0.26, speed_endurance: 0.12, running_relaxation: 0.06, sprint_mechanics: 0.06,
    finishing: 0.04,
  }, 'The one everybody watches. Top speed decides most of it and the last twenty meters decide the rest.'),
  e('200m', '200 Meters', 200, 'sprint', ['indoor', 'outdoor'], true, {
    curve_running: 0.18, acceleration: 0.12, top_speed: 0.22, speed_endurance: 0.22,
    running_relaxation: 0.10, sprint_mechanics: 0.08, block_start: 0.04, finishing: 0.04,
  }, 'A bend and a straight. Run the curve badly and the straight will not give it back.'),
  e('400m', '400 Meters', 400, 'sprint', ['indoor', 'outdoor'], false, {
    speed_endurance: 0.34, top_speed: 0.12, race_tactics: 0.16, running_relaxation: 0.12,
    curve_running: 0.08, sprint_mechanics: 0.08, competitive_nerve: 0.05, finishing: 0.05,
  }, 'The hardest race there is: a sprint you cannot sprint, and everybody is dying over the last hundred.'),
  e('60mh', '60 Meters Hurdles', 60, 'hurdles', ['indoor'], false, {
    hurdle_technique: 0.34, block_start: 0.14, reaction_time: 0.10, drive_phase: 0.14,
    acceleration: 0.14, sprint_mechanics: 0.08, competitive_nerve: 0.06,
  }, 'Five barriers indoors, and no time at all to fix a bad first one.'),
  e('110mh', '110 Meters Hurdles', 110, 'hurdles', ['outdoor'], true, {
    hurdle_technique: 0.36, acceleration: 0.14, top_speed: 0.14, sprint_mechanics: 0.12,
    speed_endurance: 0.10, block_start: 0.06, race_tactics: 0.04, competitive_nerve: 0.04,
  }, 'Ten barriers at forty two inches, three strides between each, and no room to be out of rhythm.', 'mens'),
  e('100mh', '100 Meters Hurdles', 100, 'hurdles', ['outdoor'], true, {
    hurdle_technique: 0.36, acceleration: 0.14, top_speed: 0.14, sprint_mechanics: 0.12,
    speed_endurance: 0.10, block_start: 0.06, race_tactics: 0.04, competitive_nerve: 0.04,
  }, 'Ten barriers at thirty three inches, three strides between each, and it is over in twelve seconds.', 'womens'),
  e('400mh', '400 Meters Hurdles', 400, 'hurdles', ['outdoor'], false, {
    hurdle_technique: 0.22, speed_endurance: 0.30, race_tactics: 0.16, running_relaxation: 0.10,
    curve_running: 0.08, sprint_mechanics: 0.08, competitive_nerve: 0.06,
  }, 'A lap, ten barriers, and a stride pattern that falls apart exactly when you are tired.'),
  e('4x100m', '4 by 100 Meters Relay', 400, 'relay', ['outdoor'], false, {
    baton_exchange: 0.34, top_speed: 0.20, acceleration: 0.16, curve_running: 0.12,
    race_tactics: 0.08, sprint_mechanics: 0.06, competitive_nerve: 0.04,
  }, 'Four legs and three exchanges, and the fastest four do not always win it.'),
  e('4x400m', '4 by 400 Meters Relay', 1600, 'relay', ['indoor', 'outdoor'], false, {
    speed_endurance: 0.30, race_tactics: 0.20, baton_exchange: 0.16, top_speed: 0.12,
    running_relaxation: 0.12, competitive_nerve: 0.10,
  }, 'The last event of the meet, and the one the whole stadium stays for.'),
];

export const EVENT_BY_ID: Readonly<Record<string, TrackEvent>> = Object.fromEntries(
  EVENTS.map((one) => [one.id, one]),
);

/** The events run in this category, on this surface. */
export function eventsFor(category: RunnerCategory, surface?: Surface): TrackEvent[] {
  return EVENTS.filter(
    (one) => (!one.category || one.category === category)
      && (!surface || one.surfaces.includes(surface)),
  );
}

/** The events a person runs on their own rather than in a team of four. */
export function individualEvents(category: RunnerCategory, surface?: Surface): TrackEvent[] {
  return eventsFor(category, surface).filter((one) => one.kind !== 'relay');
}

// ---------------------------------------------------------------------------
// The records, which are real
// ---------------------------------------------------------------------------

export interface WorldRecord {
  eventId: string;
  category: RunnerCategory;
  surface: Surface;
  /** The mark, in seconds. */
  seconds: number;
  /** Who set it. Real, and never simulated against. */
  holder: string;
  /** Where, and in what year. */
  place: string;
  year: number;
}

function r(
  eventId: string, category: RunnerCategory, surface: Surface, seconds: number,
  holder: string, place: string, year: number,
): WorldRecord {
  return { eventId, category, surface, seconds, holder, place, year };
}

/**
 * The world records, as SLATE carries them.
 *
 * Real, every one, with the person who set it and the year. A record set
 * after the year SLATE was built is not in here, which is a limit of the game
 * rather than a claim that no one has run faster.
 */
export const WORLD_RECORDS: readonly WorldRecord[] = [
  // Men, outdoor
  r('100m', 'mens', 'outdoor', 9.58, 'Usain Bolt', 'Berlin', 2009),
  r('200m', 'mens', 'outdoor', 19.19, 'Usain Bolt', 'Berlin', 2009),
  r('400m', 'mens', 'outdoor', 43.03, 'Wayde van Niekerk', 'Rio de Janeiro', 2016),
  r('110mh', 'mens', 'outdoor', 12.80, 'Aries Merritt', 'Brussels', 2012),
  r('400mh', 'mens', 'outdoor', 45.94, 'Karsten Warholm', 'Tokyo', 2021),
  r('4x100m', 'mens', 'outdoor', 36.84, 'Jamaica', 'London', 2012),
  r('4x400m', 'mens', 'outdoor', 174.29, 'The United States', 'Stuttgart', 1993),
  // Men, indoor
  r('60m', 'mens', 'indoor', 6.34, 'Christian Coleman', 'Albuquerque', 2018),
  r('60mh', 'mens', 'indoor', 7.29, 'Grant Holloway', 'Madrid', 2021),
  // Women, outdoor
  r('100m', 'womens', 'outdoor', 10.49, 'Florence Griffith Joyner', 'Indianapolis', 1988),
  r('200m', 'womens', 'outdoor', 21.34, 'Florence Griffith Joyner', 'Seoul', 1988),
  r('400m', 'womens', 'outdoor', 47.60, 'Marita Koch', 'Canberra', 1985),
  r('100mh', 'womens', 'outdoor', 12.12, 'Tobi Amusan', 'Eugene', 2022),
  r('400mh', 'womens', 'outdoor', 50.37, 'Sydney McLaughlin-Levrone', 'Budapest', 2023),
  r('4x100m', 'womens', 'outdoor', 40.82, 'The United States', 'London', 2012),
  r('4x400m', 'womens', 'outdoor', 195.17, 'The Soviet Union', 'Seoul', 1988),
  // Women, indoor
  r('60m', 'womens', 'indoor', 6.92, 'Irina Privalova', 'Madrid', 1993),
  r('60mh', 'womens', 'indoor', 7.65, 'Devynne Charlton', 'Glasgow', 2024),
];

/** The world record for an event, where there is one to chase. */
export function recordFor(
  eventId: string, category: RunnerCategory, surface?: Surface,
): WorldRecord | undefined {
  return WORLD_RECORDS.find(
    (one) => one.eventId === eventId && one.category === category
      && (!surface || one.surface === surface),
  );
}

// ---------------------------------------------------------------------------
// What a beginner runs, and what the best in the world runs
// ---------------------------------------------------------------------------

/**
 * The two ends of every event.
 *
 * The fast end is the world record and is real. The slow end is a fit,
 * untrained sixteen year old on a first day at the track, which is SLATE's
 * own calibration. Every time in the game is somewhere on the line between
 * the two.
 */
export interface Ends {
  eventId: string;
  category: RunnerCategory;
  /** The world record, in seconds. Real. */
  best: number;
  /** A first day at the track, in seconds. SLATE's own calibration. */
  firstDay: number;
}

function ends(eventId: string, category: RunnerCategory, best: number, firstDay: number): Ends {
  return { eventId, category, best, firstDay };
}

export const ENDS: readonly Ends[] = [
  ends('60m', 'mens', 6.34, 8.90), ends('60m', 'womens', 6.92, 9.90),
  ends('100m', 'mens', 9.58, 13.80), ends('100m', 'womens', 10.49, 15.60),
  ends('200m', 'mens', 19.19, 28.50), ends('200m', 'womens', 21.34, 32.00),
  ends('400m', 'mens', 43.03, 64.00), ends('400m', 'womens', 47.60, 72.00),
  ends('60mh', 'mens', 7.29, 11.00), ends('60mh', 'womens', 7.65, 11.60),
  ends('110mh', 'mens', 12.80, 20.00), ends('100mh', 'womens', 12.12, 19.00),
  ends('400mh', 'mens', 45.94, 72.00), ends('400mh', 'womens', 50.37, 80.00),
  ends('4x100m', 'mens', 36.84, 52.00), ends('4x100m', 'womens', 40.82, 58.00),
  ends('4x400m', 'mens', 174.29, 240.00), ends('4x400m', 'womens', 195.17, 260.00),
];

export function endsFor(eventId: string, category: RunnerCategory): Ends | undefined {
  return ENDS.find((one) => one.eventId === eventId && one.category === category);
}

// ---------------------------------------------------------------------------
// The standards, which are real, and the levels, which are SLATE's own
// ---------------------------------------------------------------------------

/**
 * The entry standard for a global championship, in seconds.
 *
 * Real published marks, carried as the bar of a cycle. World Athletics moves
 * them and fills the rest of the field by world ranking, which is why a time
 * outside the standard is not the end of it.
 */
export const ENTRY_STANDARDS: Readonly<Record<string, Readonly<Record<RunnerCategory, number>>>> = {
  '100m': { mens: 10.00, womens: 11.07 },
  '200m': { mens: 20.16, womens: 22.57 },
  '400m': { mens: 45.00, womens: 50.95 },
  '110mh': { mens: 13.27, womens: 0 },
  '100mh': { mens: 0, womens: 12.77 },
  '400mh': { mens: 48.70, womens: 54.85 },
};

/** The standard for an event, where the event has one. */
export function standardFor(eventId: string, category: RunnerCategory): number | undefined {
  const found = ENTRY_STANDARDS[eventId]?.[category];
  return found && found > 0 ? found : undefined;
}

/**
 * What a time means, as a share of the world record.
 *
 * SLATE's own calibration rather than anybody's published table: a time
 * thirty per cent off the world record makes a school team, seven per cent
 * off is a college scholarship runner, and half a per cent off makes a world
 * final. It is deliberately a single ladder so that every event reads the
 * same way, which is not exactly how the sport works but is close enough to
 * be honest about.
 */
export interface Level {
  id: string;
  label: string;
  /** The time, as a multiple of the world record, in the men's events. */
  ratio: number;
  /**
   * And in the women's.
   *
   * Carried separately because the women's records in the short sprints are
   * unusually old and unusually fast, so the same multiple of the record does
   * not mean the same thing in the two categories.
   */
  womens: number;
  about: string;
}

export const LEVELS: readonly Level[] = [
  { id: 'first_day', label: 'A First Day', ratio: 1.44, womens: 1.48, about: 'Fit, and no idea what any of this is yet.' },
  { id: 'team', label: 'School Team', ratio: 1.28, womens: 1.31, about: 'Fast enough that the coach puts you in a lane.' },
  { id: 'county', label: 'County Class', ratio: 1.17, womens: 1.20, about: 'You win your league and go to the county meet.' },
  { id: 'schools', label: 'National Schools Class', ratio: 1.10, womens: 1.13, about: 'One of the quickest schoolchildren in the country.' },
  { id: 'collegiate', label: 'Collegiate Class', ratio: 1.075, womens: 1.105, about: 'A university would pay for this, where a university pays for it.' },
  { id: 'national', label: 'National Class', ratio: 1.065, womens: 1.09, about: 'A national final, and a place on a relay squad.' },
  { id: 'world', label: 'World Class', ratio: 1.025, womens: 1.045, about: 'A world final, and everybody knows your name.' },
];

export const LEVEL_BY_ID: Readonly<Record<string, Level>> = Object.fromEntries(
  LEVELS.map((one) => [one.id, one]),
);

/** The multiple this level means, in this category. */
export function ratioAt(level: Level, category: RunnerCategory): number {
  return category === 'womens' ? level.womens : level.ratio;
}

/** The levels a time is at or better than, and the one it belongs to. */
export function levelOf(seconds: number, eventId: string, category: RunnerCategory): Level {
  const both = endsFor(eventId, category);
  if (!both) return LEVELS[0]!;
  const ratio = seconds / both.best;
  // Walking down from the top, the first level the time is inside.
  for (let i = LEVELS.length - 1; i >= 0; i--) {
    if (ratio <= ratioAt(LEVELS[i]!, category)) return LEVELS[i]!;
  }
  return LEVELS[0]!;
}

/** Whether a time is at this level or better than it. */
export function atLeast(seconds: number, eventId: string, category: RunnerCategory, levelId: string): boolean {
  const want = LEVELS.findIndex((one) => one.id === levelId);
  const got = LEVELS.findIndex((one) => one.id === levelOf(seconds, eventId, category).id);
  return want >= 0 && got >= want;
}

/** How steep the line is between a first day and a world record. */
const CURVE = 1.9;

/** The time a quality is worth, in this event. */
export function timeAt(quality: number, eventId: string, category: RunnerCategory): number | undefined {
  const both = endsFor(eventId, category);
  if (!both) return undefined;
  const spread = both.firstDay - both.best;
  return Math.round((both.best + spread * Math.pow(1 - clamp(quality, 0, 1), CURVE)) * 100) / 100;
}

/** The quality a time is worth, which is the same line read backwards. */
export function qualityOf(seconds: number, eventId: string, category: RunnerCategory): number {
  const both = endsFor(eventId, category);
  if (!both) return 0;
  const spread = both.firstDay - both.best;
  const above = clamp((seconds - both.best) / spread, 0, 1);
  return clamp(1 - Math.pow(above, 1 / CURVE), 0, 1);
}

/** The time that would put somebody at a level, in this event. */
export function timeForLevel(levelId: string, eventId: string, category: RunnerCategory): number | undefined {
  const both = endsFor(eventId, category);
  const level = LEVEL_BY_ID[levelId];
  if (!both || !level) return undefined;
  return Math.round(both.best * ratioAt(level, category) * 100) / 100;
}

// ---------------------------------------------------------------------------
// The meets, which are real
// ---------------------------------------------------------------------------

/** Who is running at a meet: a schoolchild, a student, or a professional. */
export type Stage = 'school' | 'university' | 'professional';

export type Tier =
  | 'dual' | 'invitational' | 'league' | 'regional' | 'national_schools' | 'age_group'
  | 'conference' | 'collegiate_regional' | 'collegiate_national'
  | 'national_championships' | 'circuit' | 'circuit_final'
  | 'continental' | 'global' | 'olympics';

export const TIER_LABEL: Readonly<Record<Tier, string>> = {
  dual: 'A Dual Meet',
  invitational: 'An Invitational',
  league: 'The League Championships',
  regional: 'The Regional Championships',
  national_schools: 'The National Schools Championships',
  age_group: 'The Age Group Championships',
  conference: 'The Conference Championships',
  collegiate_regional: 'The Collegiate Regional',
  collegiate_national: 'The National Collegiate Championships',
  national_championships: 'The National Championships',
  circuit: 'A Circuit Meet',
  circuit_final: 'The Circuit Final',
  continental: 'The Continental Championships',
  global: 'The World Championships',
  olympics: 'The Olympic Games',
};

/** How much a meet is worth, for ranking and for what it does to a name. */
export const TIER_WEIGHT: Readonly<Record<Tier, number>> = {
  dual: 5, invitational: 15, league: 25, regional: 35, national_schools: 55, age_group: 60,
  conference: 45, collegiate_regional: 55, collegiate_national: 70, national_championships: 75,
  circuit: 65, circuit_final: 85, continental: 85, global: 100, olympics: 100,
};

export interface NamedMeet {
  id: string;
  /** The real name of a real meet. */
  name: string;
  /** The town it is really held in. */
  town: string;
  /** Where the geography carries that town, so it can be traveled to. */
  cityId?: string;
  countryId: string;
  tier: Tier;
  surface: Surface;
  /** The month of the year it is really held in. */
  month: number;
  /** Who runs at it. */
  stages: readonly Stage[];
  /** Where the meet moves from country to country rather than living in one. */
  rotates?: boolean;
  /** Where it is not held every year. */
  everyYears?: number;
  about: string;
}

function m(
  id: string, name: string, town: string, countryId: string, tier: Tier, surface: Surface,
  month: number, stages: readonly Stage[], about: string,
  extra: { cityId?: string; rotates?: boolean; everyYears?: number } = {},
): NamedMeet {
  return { id, name, town, countryId, tier, surface, month, stages, about, ...extra };
}

export const NAMED_MEETS: readonly NamedMeet[] = [
  // --- American schools ----------------------------------------------------
  m('arcadia', 'The Arcadia Invitational', 'Arcadia, California', 'us', 'invitational', 'outdoor', 4, ['school'],
    'The best high school field of the American spring, and it is on a Saturday night.'),
  m('texas_relays', 'The Texas Relays', 'Austin, Texas', 'us', 'invitational', 'outdoor', 3, ['school', 'university'],
    'High school and college in the same stadium, at the end of March.', { cityId: 'us-tx-austin' }),
  m('mt_sac', 'The Mt. SAC Relays', 'Walnut, California', 'us', 'invitational', 'outdoor', 4, ['school', 'university'],
    'Four days of it, and the meet that has been going since the Thirties.'),
  m('penn_relays', 'The Penn Relays', 'Philadelphia, Pennsylvania', 'us', 'invitational', 'outdoor', 4, ['school', 'university', 'professional'],
    'The oldest relay carnival in the country, and forty thousand people come for the Jamaican schools.', { cityId: 'us-pa-philadelphia' }),
  m('drake_relays', 'The Drake Relays', 'Des Moines, Iowa', 'us', 'invitational', 'outdoor', 4, ['school', 'university', 'professional'],
    'A blue track in April, and a meet that treats the schools as part of it.'),
  m('brooks_pr', 'The Brooks PR Invitational', 'Seattle, Washington', 'us', 'invitational', 'outdoor', 6, ['school'],
    'Invitation only, and the fields are picked so that everybody in them can win.', { cityId: 'us-wa-seattle' }),
  m('nb_outdoor', 'New Balance Nationals Outdoor', 'Philadelphia, Pennsylvania', 'us', 'national_schools', 'outdoor', 6, ['school'],
    'Where the American high school season ends, and where the national records get set.', { cityId: 'us-pa-philadelphia' }),
  m('nb_indoor', 'New Balance Nationals Indoor', 'Boston, Massachusetts', 'us', 'national_schools', 'indoor', 3, ['school'],
    'The end of the indoor season, on a banked two hundred meter track.', { cityId: 'us-ma-boston' }),

  // --- American universities -----------------------------------------------
  m('ncaa_indoor', 'The NCAA Division I Indoor Championships', 'A Different City Each Year', 'us', 'collegiate_national', 'indoor', 3, ['university'],
    'Two days in March, and the qualifying is done on a national list rather than in a heat.', { rotates: true }),
  m('ncaa_outdoor', 'The NCAA Division I Outdoor Championships', 'Eugene, Oregon', 'us', 'collegiate_national', 'outdoor', 6, ['university'],
    'Four days at Hayward Field in recent years, and the fastest college meet in the world.', { rotates: true }),

  // --- British schools and universities ------------------------------------
  m('english_schools', 'The English Schools Athletics Championships', 'A Different City Each Year', 'uk', 'national_schools', 'outdoor', 7, ['school'],
    'The biggest schools meet in Europe, and the one every English athlete remembers.', { rotates: true }),
  m('bucs_outdoor', 'The BUCS Outdoor Championships', 'Bedford', 'uk', 'collegiate_national', 'outdoor', 5, ['university'],
    'The British university championships, over a long weekend in May.'),
  m('loughborough', 'The Loughborough International', 'Loughborough', 'uk', 'invitational', 'outdoor', 5, ['university', 'professional'],
    'Students against internationals on the same afternoon, which is the point of it.'),
  m('uk_champs', 'The UK Athletics Championships', 'Manchester', 'uk', 'national_championships', 'outdoor', 6, ['university', 'professional'],
    'The British championships, and the trial that picks the team.', { cityId: 'uk-eng-manchester' }),
  m('uk_indoor', 'The UK Indoor Championships', 'Birmingham', 'uk', 'national_championships', 'indoor', 2, ['university', 'professional'],
    'Two days at the arena in February, and the indoor team comes out of it.', { cityId: 'uk-eng-birmingham' }),

  // --- Jamaica, where the schools meet is the national event ---------------
  m('champs', 'The ISSA Boys and Girls Athletics Championships', 'Kingston', 'jm', 'national_schools', 'outdoor', 3, ['school'],
    'Champs. Five days, a full national stadium, and the biggest schools meet on earth.', { cityId: 'jm-17-kingston' }),
  m('gibson_mccook', 'The Gibson McCook Relays', 'Kingston', 'jm', 'invitational', 'outdoor', 2, ['school', 'university', 'professional'],
    'The relay meet in February that opens the Jamaican season.', { cityId: 'jm-17-kingston' }),
  m('carifta', 'The Carifta Games', 'A Different Island Each Year', 'bs', 'age_group', 'outdoor', 4, ['school'],
    'The Caribbean age group championships at Easter, and where the region first sees somebody.', { rotates: true }),
  m('jamaica_champs', 'The Jamaica Athletics Championships', 'Kingston', 'jm', 'national_championships', 'outdoor', 6, ['university', 'professional'],
    'The hardest team to make in the sport, and the final is faster than most world finals.', { cityId: 'jm-17-kingston' }),

  // --- Other national championships ----------------------------------------
  m('usa_champs', 'The USA Track and Field Championships', 'A Different City Each Year', 'us', 'national_championships', 'outdoor', 6, ['university', 'professional'],
    'Three from each event and nothing else, which is why it is harder than the world final.', { rotates: true }),
  m('kenya_champs', 'The Kenyan Athletics Championships', 'Nairobi', 'ke', 'national_championships', 'outdoor', 6, ['university', 'professional'],
    'The national trials, at altitude, in front of everybody.', { cityId: 'ke-05-nairobi' }),
  m('japan_champs', 'The Japan National Championships', 'A Different City Each Year', 'jp', 'national_championships', 'outdoor', 6, ['university', 'professional'],
    'The national championships, and the university runners are half the field.', { rotates: true }),
  m('australia_champs', 'The Australian Athletics Championships', 'A Different City Each Year', 'au', 'national_championships', 'outdoor', 4, ['university', 'professional'],
    'In April, because the season down there runs the other way round.', { rotates: true }),
  m('nigeria_champs', 'The Nigerian Athletics Championships', 'A Different City Each Year', 'ng', 'national_championships', 'outdoor', 6, ['university', 'professional'],
    'The national trials, and a sprint field deep enough to be frightening.', { rotates: true }),
  m('sa_champs', 'The South African Athletics Championships', 'A Different City Each Year', 'za', 'national_championships', 'outdoor', 4, ['university', 'professional'],
    'April, and the country that produced a four hundred meter world record.', { rotates: true }),
  m('canada_champs', 'The Canadian Track and Field Championships', 'A Different City Each Year', 'ca', 'national_championships', 'outdoor', 6, ['university', 'professional'],
    'The national championships and the trial, in one meet.', { rotates: true }),
  m('france_champs', 'The French Athletics Championships', 'A Different City Each Year', 'fr', 'national_championships', 'outdoor', 6, ['university', 'professional'],
    'Les Championnats de France, and the team comes out of it.', { rotates: true }),
  m('german_champs', 'The German Athletics Championships', 'A Different City Each Year', 'de', 'national_championships', 'outdoor', 6, ['university', 'professional'],
    'Deutsche Meisterschaften, and it decides the team.', { rotates: true }),

  // --- The circuit ----------------------------------------------------------
  m('xiamen', 'The Xiamen Diamond League', 'Xiamen', 'cn', 'circuit', 'outdoor', 4, ['professional'],
    'The circuit opens in China, in April, in the heat.', { cityId: 'cn-07-xiamen' }),
  m('suzhou', 'The Suzhou Diamond League', 'Suzhou', 'cn', 'circuit', 'outdoor', 5, ['professional'],
    'The second leg of the Chinese opening.', { cityId: 'cn-04-suzhou' }),
  m('doha', 'The Doha Diamond League', 'Doha', 'qa', 'circuit', 'outdoor', 5, ['professional'],
    'Under lights, in May, and always quick.', { cityId: 'qa-01-doha' }),
  m('rabat', 'The Meeting International Mohammed VI', 'Rabat', 'ma', 'circuit', 'outdoor', 5, ['professional'],
    'The Moroccan leg, and the crowd stays until midnight.', { cityId: 'ma-04-rabat' }),
  m('prefontaine', 'The Prefontaine Classic', 'Eugene, Oregon', 'us', 'circuit', 'outdoor', 5, ['professional'],
    'Hayward Field, and the meet that draws the deepest sprint fields outside a championship.'),
  m('bislett', 'The Bislett Games', 'Oslo', 'no', 'circuit', 'outdoor', 6, ['professional'],
    'Oslo in June, and a stadium that has seen more world records than any other.', { cityId: 'no-12-oslo' }),
  m('stockholm', 'The BAUHAUS-galan', 'Stockholm', 'se', 'circuit', 'outdoor', 6, ['professional'],
    'The Stockholm leg, at the Olympic stadium from 1912.', { cityId: 'se-26-stockholm' }),
  m('paris_dl', 'The Meeting de Paris', 'Paris', 'fr', 'circuit', 'outdoor', 6, ['professional'],
    'Paris, and a home crowd that knows exactly what it is watching.', { cityId: 'fr-idf-paris' }),
  m('golden_gala', 'The Golden Gala Pietro Mennea', 'Rome', 'it', 'circuit', 'outdoor', 6, ['professional'],
    'Rome, and named for the man who held the two hundred meter record for seventeen years.', { cityId: 'it-laz-rome' }),
  m('herculis', 'The Herculis', 'Monaco', 'mc', 'circuit', 'outdoor', 7, ['professional'],
    'Monaco in July, and the fastest track meet of the summer most years.', { cityId: 'mc-00-monaco' }),
  m('london_dl', 'The London Athletics Meet', 'London', 'uk', 'circuit', 'outdoor', 7, ['professional'],
    'Sixty thousand people at the Olympic stadium, and they are loud.', { cityId: 'uk-eng-london' }),
  m('silesia', 'The Kamila Skolimowska Memorial', 'Silesia', 'pl', 'circuit', 'outdoor', 8, ['professional'],
    'The Polish leg, at Chorzów, and the crowd fills it.'),
  m('athletissima', 'The Athletissima', 'Lausanne', 'ch', 'circuit', 'outdoor', 8, ['professional'],
    'Lausanne in August, and one of the oldest meets on the circuit.'),
  m('weltklasse', 'The Weltklasse Zürich', 'Zürich', 'ch', 'circuit_final', 'outdoor', 9, ['professional'],
    'Zürich, and in the years it is the final it is the end of the whole season.', { cityId: 'ch-zh-zurich' }),
  m('van_damme', 'The Memorial Van Damme', 'Brussels', 'be', 'circuit_final', 'outdoor', 9, ['professional'],
    'Brussels in September, and it closes the year.', { cityId: 'be-bru-brussels' }),

  // --- The continental tour and the indoor circuit -------------------------
  m('ostrava', 'The Golden Spike', 'Ostrava', 'cz', 'circuit', 'outdoor', 5, ['professional'],
    'Zlatá tretra, and it has been going since 1961.', { cityId: 'cz-85-ostrava' }),
  m('hengelo', 'The FBK Games', 'Hengelo', 'nl', 'circuit', 'outdoor', 6, ['professional'],
    'A small Dutch town, a fast track, and a very serious meet.'),
  m('turku', 'The Paavo Nurmi Games', 'Turku', 'fi', 'circuit', 'outdoor', 6, ['professional'],
    'Named for the Flying Finn, and held where he ran.'),
  m('zagreb', 'The Boris Hanžeković Memorial', 'Zagreb', 'hr', 'circuit', 'outdoor', 9, ['professional'],
    'The September meet that closes the continental tour.', { cityId: 'hr-21-zagreb' }),
  m('millrose', 'The Millrose Games', 'New York', 'us', 'circuit', 'indoor', 2, ['university', 'professional'],
    'The Armory, in February, and the oldest indoor meet in the country.', { cityId: 'us-ny-newyork' }),
  m('lievin', 'The Meeting Hauts-de-France', 'Liévin', 'fr', 'circuit', 'indoor', 2, ['professional'],
    'A banked track in a small northern town, and the indoor records happen here.'),
  m('birmingham_indoor', 'The Birmingham Indoor Grand Prix', 'Birmingham', 'uk', 'circuit', 'indoor', 2, ['professional'],
    'The British indoor leg, and it is always full.', { cityId: 'uk-eng-birmingham' }),
  m('copernicus', 'The Copernicus Cup', 'Toruń', 'pl', 'circuit', 'indoor', 2, ['professional'],
    'Toruń in February, and one of the quickest indoor tracks anywhere.'),

  // --- The championships ----------------------------------------------------
  m('world_indoor', 'The World Athletics Indoor Championships', 'A Different City Each Year', 'us', 'global', 'indoor', 3, ['professional'],
    'Three days indoors, every other year, and the sixty meters is the whole thing.', { rotates: true, everyYears: 2 }),
  m('world_relays', 'The World Athletics Relays', 'A Different City Each Year', 'us', 'global', 'outdoor', 5, ['professional'],
    'A weekend of nothing but relays, and the qualifying places for the championships come out of it.', { rotates: true, everyYears: 2 }),
  m('world_u20', 'The World Athletics U20 Championships', 'A Different City Each Year', 'us', 'age_group', 'outdoor', 8, ['school', 'university'],
    'Under twenty, every other year, and it is where most careers are first seen.', { rotates: true, everyYears: 2 }),
  m('world_champs', 'The World Athletics Championships', 'A Different City Each Year', 'us', 'global', 'outdoor', 8, ['professional'],
    'Nine days, every other year, and three rounds to get through before a final.', { rotates: true, everyYears: 2 }),
  m('europeans', 'The European Athletics Championships', 'A Different City Each Year', 'de', 'continental', 'outdoor', 8, ['professional'],
    'The European championships, every other year.', { rotates: true, everyYears: 2 }),
  m('africans', 'The African Athletics Championships', 'A Different City Each Year', 'ng', 'continental', 'outdoor', 6, ['professional'],
    'The African championships, every other year.', { rotates: true, everyYears: 2 }),
  m('asians', 'The Asian Athletics Championships', 'A Different City Each Year', 'jp', 'continental', 'outdoor', 7, ['professional'],
    'The Asian championships, every other year.', { rotates: true, everyYears: 2 }),
  m('commonwealth', 'The Commonwealth Games', 'A Different City Each Year', 'uk', 'continental', 'outdoor', 7, ['professional'],
    'Every four years, and for a lot of the sport it is the second biggest thing there is.', { rotates: true, everyYears: 4 }),
  m('olympics', 'The Olympic Games', 'A Different City Each Year', 'us', 'olympics', 'outdoor', 7, ['professional'],
    'Every four years. Everything else in the sport is arranged around it.', { rotates: true, everyYears: 4 }),
];

export const MEET_BY_ID: Readonly<Record<string, NamedMeet>> = Object.fromEntries(
  NAMED_MEETS.map((one) => [one.id, one]),
);

/** The real meets a person at this stage, in this country, could be at. */
export function meetsFor(stage: Stage, countryId: string, surface?: Surface): NamedMeet[] {
  return NAMED_MEETS.filter(
    (one) => one.stages.includes(stage)
      && (one.countryId === countryId || one.tier === 'global' || one.tier === 'olympics'
        || one.tier === 'continental')
      && (!surface || one.surface === surface),
  );
}

/** Whether SLATE carries a country's own named meets, or falls back. */
export function meetsAreCountrys(countryId: string): boolean {
  return NAMED_MEETS.some((one) => one.countryId === countryId && one.tier !== 'global');
}

// ---------------------------------------------------------------------------
// The shape of a season
// ---------------------------------------------------------------------------

/** One rung of a season: how many meets at this tier, and what gets you on. */
export interface Rung {
  tier: Tier;
  /** How many meets at this tier the season holds. */
  count: number;
  /**
   * What it takes to be there, as a place in the meet before it. Nothing
   * means everybody goes; a number means you have to finish that high.
   */
  qualifyBy?: number;
  /** Days between this rung and the one before it. */
  daysAfter: number;
}

export interface SeasonLadder {
  stage: Stage;
  surface: Surface;
  /** Empty means anywhere SLATE does not carry more particularly. */
  countryIds: readonly string[];
  /** The months the season runs in. */
  months: readonly number[];
  rungs: readonly Rung[];
  about: string;
}

function l(
  stage: Stage, surface: Surface, countryIds: readonly string[], months: readonly number[],
  rungs: readonly Rung[], about: string,
): SeasonLadder {
  return { stage, surface, countryIds, months, rungs, about };
}

export const SEASON_LADDERS: readonly SeasonLadder[] = [
  // --- School, America: two seasons, and the second one is the real one ----
  l('school', 'indoor', ['us'], [12, 1, 2, 3], [
    { tier: 'dual', count: 3, daysAfter: 7 },
    { tier: 'invitational', count: 3, daysAfter: 7 },
    { tier: 'league', count: 1, daysAfter: 10 },
    { tier: 'national_schools', count: 1, qualifyBy: 2, daysAfter: 14 },
  ], 'December to March on a banked track, and it is the season that makes the outdoor one.'),
  l('school', 'outdoor', ['us'], [3, 4, 5, 6], [
    { tier: 'dual', count: 4, daysAfter: 7 },
    { tier: 'invitational', count: 3, daysAfter: 7 },
    { tier: 'league', count: 1, daysAfter: 10 },
    { tier: 'regional', count: 1, qualifyBy: 4, daysAfter: 10 },
    { tier: 'national_schools', count: 1, qualifyBy: 2, daysAfter: 14 },
  ], 'Dual meets from March, then the invitationals, then league, section and nationals.'),

  // --- School, Britain: a county ladder rather than a dual meet season -----
  l('school', 'outdoor', ['uk', 'ie'], [4, 5, 6, 7], [
    { tier: 'invitational', count: 4, daysAfter: 10 },
    { tier: 'league', count: 1, daysAfter: 10 },
    { tier: 'regional', count: 1, qualifyBy: 3, daysAfter: 14 },
    { tier: 'national_schools', count: 1, qualifyBy: 2, daysAfter: 21 },
  ], 'Open meets through the spring, then district, county and the English Schools in July.'),

  // --- School, Jamaica: the schools meet is the whole country --------------
  l('school', 'outdoor', ['jm', 'tt', 'bs', 'bb'], [1, 2, 3, 4], [
    { tier: 'invitational', count: 4, daysAfter: 10 },
    { tier: 'national_schools', count: 1, qualifyBy: 6, daysAfter: 14 },
    { tier: 'age_group', count: 1, qualifyBy: 3, daysAfter: 21 },
  ], 'Development meets from January, Champs in March, and Carifta at Easter for the ones who go on.'),

  // --- School, anywhere else ------------------------------------------------
  l('school', 'outdoor', [], [4, 5, 6], [
    { tier: 'invitational', count: 3, daysAfter: 14 },
    { tier: 'regional', count: 1, qualifyBy: 4, daysAfter: 14 },
    { tier: 'national_schools', count: 1, qualifyBy: 2, daysAfter: 21 },
  ], 'A short spring season and a national schools meet at the end of it, which is SLATE’s general shape.'),

  // --- University, America --------------------------------------------------
  l('university', 'indoor', ['us'], [12, 1, 2, 3], [
    { tier: 'invitational', count: 4, daysAfter: 7 },
    { tier: 'conference', count: 1, daysAfter: 14 },
    { tier: 'collegiate_national', count: 1, qualifyBy: 3, daysAfter: 14 },
  ], 'Four meets, then conference, then the national indoor meet on a list rather than a heat.'),
  l('university', 'outdoor', ['us'], [3, 4, 5, 6], [
    { tier: 'invitational', count: 5, daysAfter: 7 },
    { tier: 'conference', count: 1, daysAfter: 10 },
    { tier: 'collegiate_regional', count: 1, qualifyBy: 8, daysAfter: 10 },
    { tier: 'collegiate_national', count: 1, qualifyBy: 3, daysAfter: 14 },
  ], 'The relays and the invitationals, then conference, the regional and four days at the national meet.'),

  // --- University, Britain --------------------------------------------------
  l('university', 'outdoor', ['uk', 'ie'], [4, 5, 6], [
    { tier: 'invitational', count: 3, daysAfter: 14 },
    { tier: 'collegiate_national', count: 1, daysAfter: 14 },
    { tier: 'national_championships', count: 1, qualifyBy: 3, daysAfter: 21 },
  ], 'Open meets, BUCS in May, and the national championships in June if the time is there.'),

  // --- University, anywhere else -------------------------------------------
  l('university', 'outdoor', [], [4, 5, 6], [
    { tier: 'invitational', count: 4, daysAfter: 14 },
    { tier: 'collegiate_national', count: 1, daysAfter: 14 },
    { tier: 'national_championships', count: 1, qualifyBy: 3, daysAfter: 21 },
  ], 'A university season and a national championship at the end of it, which is SLATE’s general shape.'),

  // --- Professional ---------------------------------------------------------
  l('professional', 'indoor', [], [1, 2, 3], [
    { tier: 'circuit', count: 4, daysAfter: 10 },
    { tier: 'national_championships', count: 1, daysAfter: 14 },
    { tier: 'global', count: 1, qualifyBy: 3, daysAfter: 14 },
  ], 'A short indoor circuit, the national indoor championships, and the world indoors every other year.'),
  l('professional', 'outdoor', [], [4, 5, 6, 7, 8, 9], [
    { tier: 'circuit', count: 5, daysAfter: 14 },
    { tier: 'national_championships', count: 1, daysAfter: 14 },
    { tier: 'global', count: 1, qualifyBy: 3, daysAfter: 21 },
    { tier: 'circuit_final', count: 1, qualifyBy: 8, daysAfter: 14 },
  ], 'The circuit from April, the national trial in June, the championship in August and the final in September.'),
];

/** The ladder for this stage, surface and country, or the general one. */
export function ladderFor(stage: Stage, surface: Surface, countryId: string): SeasonLadder | undefined {
  return SEASON_LADDERS.find(
    (one) => one.stage === stage && one.surface === surface && one.countryIds.includes(countryId),
  ) ?? SEASON_LADDERS.find(
    (one) => one.stage === stage && one.surface === surface && one.countryIds.length === 0,
  );
}

/** Whether SLATE carries this country's own season rather than the general one. */
export function ladderIsCountrys(stage: Stage, surface: Surface, countryId: string): boolean {
  return SEASON_LADDERS.some(
    (one) => one.stage === stage && one.surface === surface && one.countryIds.includes(countryId),
  );
}

/** The surfaces a stage runs a season on, in the order they come round. */
export function surfacesFor(stage: Stage, countryId: string): Surface[] {
  const out: Surface[] = [];
  for (const surface of ['indoor', 'outdoor'] as const) {
    if (SEASON_LADDERS.some(
      (one) => one.stage === stage && one.surface === surface
        && (one.countryIds.includes(countryId) || one.countryIds.length === 0),
    )) out.push(surface);
  }
  return out;
}

// ---------------------------------------------------------------------------
// The rounds, and the wind
// ---------------------------------------------------------------------------

export type Round = 'heat' | 'semi' | 'final';

export const ROUND_LABEL: Readonly<Record<Round, string>> = {
  heat: 'The Heats',
  semi: 'The Semi Final',
  final: 'The Final',
};

/**
 * How many rounds a meet runs.
 *
 * A dual meet is one race. A championship over a hundred meters is three, and
 * getting through the first two is most of what a championship is.
 */
export function roundsAt(tier: Tier, eventId: string): Round[] {
  const event = EVENT_BY_ID[eventId];
  if (!event || event.kind === 'relay') return ['final'];
  const big = TIER_WEIGHT[tier] >= 70;
  const middling = TIER_WEIGHT[tier] >= 25;
  // The four hundred is two rounds even at a world championship in some years,
  // and the shorter the race the more rounds there are.
  if (big) return event.metres <= 200 ? ['heat', 'semi', 'final'] : ['heat', 'final'];
  if (middling) return ['heat', 'final'];
  return ['final'];
}

/** The wind limit for a legal mark, in meters per second. Real. */
export const WIND_LIMIT = 2.0;

export const WIND_NOTE =
  'A sprint or a hurdles race run outdoors with more than two meters a second behind it is still a '
  + 'race and still a result, but the time does not stand for a record or a ranking. That limit is '
  + 'real and it is why a fast time can come with an asterisk beside it.';

/** Whether a mark stands, given the wind behind it. */
export function windLegal(eventId: string, wind: number): boolean {
  const event = EVENT_BY_ID[eventId];
  if (!event?.windRead) return true;
  return wind <= WIND_LIMIT;
}

// ---------------------------------------------------------------------------
// Where a school has a track and where it does not
// ---------------------------------------------------------------------------

/**
 * The countries whose schools really run a track season.
 *
 * Not every school anywhere has a team, and this is the honest half of "at
 * whatever school offers the opportunity": in these countries a school track
 * team is an ordinary thing to find, and everywhere else it is a club rather
 * than a school that runs it.
 */
export const SCHOOL_TRACK_COUNTRIES: readonly string[] = [
  'us', 'uk', 'ie', 'jm', 'tt', 'bs', 'bb', 'ke', 'et', 'ng', 'za', 'gh', 'au', 'nz', 'ca',
  'de', 'fr', 'it', 'es', 'pl', 'nl', 'be', 'se', 'no', 'fi', 'jp', 'cn', 'in', 'br', 'cu',
  'gr', 'pt', 'ch', 'at', 'cz', 'hu', 'ua', 'tr', 'mx', 'co', 'ar',
];

/** Whether the schools of a country run a track season at all. */
export function schoolsRunTrack(countryId: string): boolean {
  return SCHOOL_TRACK_COUNTRIES.includes(countryId);
}

/** The age a school first puts somebody in a lane. */
export const TRACK_FROM_AGE = 11;

/** The age below which nobody is racing a full lap flat out. */
export const LONG_SPRINT_FROM_AGE = 13;

// ---------------------------------------------------------------------------
// The rest of the field, which is SLATE's own
// ---------------------------------------------------------------------------

/**
 * The names of everybody else in the race.
 *
 * Invented, all of them. A made-up time against a real athlete's name would
 * be a claim about somebody real, so no rival in this game is one.
 */
export const RIVAL_FIRST: readonly string[] = [
  'Andre', 'Marcus', 'Devon', 'Jaylen', 'Tarik', 'Kwame', 'Emeka', 'Diego', 'Mateo', 'Nikolai',
  'Ivan', 'Louis', 'Theo', 'Malik', 'Amari', 'Jerome', 'Silas', 'Odell', 'Casper', 'Ronan',
  'Imani', 'Naomi', 'Camille', 'Adaeze', 'Zola', 'Anika', 'Rhiannon', 'Freya', 'Sanaa', 'Elodie',
  'Mireia', 'Kaya', 'Bianca', 'Nadia', 'Tamsin', 'Simone', 'Yara', 'Leila', 'Marta', 'Chidi',
];

export const RIVAL_LAST: readonly string[] = [
  'Adeyemi', 'Baptiste', 'Bennett', 'Cardoso', 'Chukwu', 'Dacosta', 'Delacroix', 'Everly',
  'Fontaine', 'Gallagher', 'Haldane', 'Ibarra', 'Jovanović', 'Kessler', 'Lindqvist', 'Mabaso',
  'Nakamura', 'Okonkwo', 'Petrov', 'Quintero', 'Rasmussen', 'Sinclair', 'Thibodeaux', 'Ubeda',
  'Vasquez', 'Whitfield', 'Ximenes', 'Yeboah', 'Zaragoza', 'Ferreira', 'Grantham', 'Hollis',
];

/**
 * The school across town, for a dual meet.
 *
 * Invented stems, and the word that country really uses for a school, so a
 * dual meet in California is not run against a comprehensive.
 */
export const OPPONENT_FIRST: readonly string[] = [
  'Northside', 'Southgate', 'Eastvale', 'Westbrook', 'Riverbend', 'Hillcrest', 'Lakeview',
  'Fairview', 'Oakridge', 'Pinehurst', 'Cedarbrook', 'Maplewood', 'Stonefield', 'Brookhaven',
  'Ashcroft', 'Kingsford', 'Elmhurst', 'Granville', 'Highland', 'Meadowvale', 'Redfield',
  'Silverbrook', 'Thornhill', 'Whitmore', 'Ravenswood', 'Foxdale', 'Larkhill', 'Winterbourne',
];

export interface SchoolWords {
  countryIds: readonly string[];
  words: readonly string[];
}

export const SCHOOL_WORDS: readonly SchoolWords[] = [
  {
    countryIds: ['us', 'ca', 'ph', 'lr'],
    words: ['High School', 'High', 'Preparatory', 'Academy', 'Central', 'Country Day'],
  },
  {
    countryIds: [
      'uk', 'ie', 'au', 'nz', 'za', 'in', 'pk', 'bd', 'lk', 'ng', 'ke', 'gh', 'jm', 'tt', 'sg',
      'my', 'hk', 'zw', 'ug', 'tz', 'bs', 'bb',
    ],
    words: ['High School', 'Academy', 'Grammar School', 'College', 'Secondary School', 'Comprehensive'],
  },
  {
    countryIds: [
      'de', 'at', 'ch', 'nl', 'be', 'dk', 'se', 'no', 'fi', 'is', 'cz', 'sk', 'pl', 'hu', 'gr',
      'ru', 'ua', 'ee', 'lv', 'lt', 'si', 'hr', 'rs', 'bg', 'ro',
    ],
    words: ['Gymnasium', 'Lyceum', 'School', 'Academy'],
  },
];

export const GENERAL_SCHOOL_WORDS: readonly string[] = ['School', 'Academy', 'High School', 'Institute'];

/** What that country calls a school. */
export function schoolWords(countryId: string): readonly string[] {
  return SCHOOL_WORDS.find((one) => one.countryIds.includes(countryId))?.words
    ?? GENERAL_SCHOOL_WORDS;
}

/** The invented meets, for the rungs that are not one named meet. */
export const MEET_FIRST: readonly string[] = [
  'The Spring', 'The Twilight', 'The Coastal', 'The Valley', 'The Riverside', 'The Northern',
  'The Southern', 'The Highland', 'The Metro', 'The Foundation', 'The Early Season',
  'The Late Season', 'The Firecracker', 'The Sunset', 'The County Line', 'The Border',
];

export const MEET_SECOND: readonly string[] = [
  'Invitational', 'Classic', 'Relays', 'Open', 'Meet', 'Games', 'Trials Meet', 'Carnival',
];
