/**
 * SLATE — the industry's own work, made week by week (from 2026-10-24, the owner's brief 27, Area B: "Build an ongoing
 * project and opportunity lifecycle that produces appropriate new work over simulation time ... Do not merely add a larger
 * fixed list"). Reference data for the slate (`systems/slate.ts`): where the game makes its work, what each kind of work
 * is like, and the words its fictional productions are named and described in.
 *
 * Until this module the career's work was brief 25's thirty-one fixed parts (`content/careerwork.ts`), each posted again
 * only as a new casting of the same part, and a booked part never again: an actor who had worked through them met a world
 * with nothing left to cast. The fixed parts stay, and the slate adds productions the world keeps making: films, plays,
 * television movies, limited series and dubs, each cast once with a fate of its own (made as planned, pushed, or never
 * made), and series with seasons the network renews, cancels and revives by brief 25's own rules (`systems/series.ts`).
 *
 * Three kinds of statement, as `content/careerwork.ts` keeps them:
 * - **The markets are real places** where film, television and theater are made (New York, Los Angeles, Atlanta, Chicago,
 *   the regional theaters' towns, Sydney), and their work's terms are the researched ones the game already has (the
 *   SAG-AFTRA and Equity rates, Australia's 408). A market is somewhere the game makes work; it isn't a claim about how
 *   much work a real city has.
 * - **Every production, company, casting office and character here is fictional,** named from the word lists below, and
 *   says so wherever a player reads it. A name that happens to match a real one is a coincidence. Nothing here says a real
 *   organization is casting, or has offered anybody anything.
 * - **Every rate of work and every chance of a fate is the game's ASSUMPTION,** set for a steady stream an emerging actor
 *   could live on and sometimes can't: how often a market starts a production of a kind, how often one is pushed or
 *   dropped, how long it takes to cast. No source gives these for the work an emerging actor is seen for.
 */

import type { FormatId } from './workflows';
import type { ProjectKind, ProMedium, RateId, RoleSize } from './careerwork';
import type { Skill } from './school';

/**
 * The generator's version, in every id it makes. A change to what it makes from the same draws (a word list, a rate, a
 * profile) is a new version, so a later build never makes a different production under an id a save already holds; what a
 * save was shown is kept in the save itself (`systems/slate.ts`, `keepProject`).
 */
export const SLATE_VERSION = 1;

/** Where the game makes work, and how much of each kind it starts there in an ordinary week. */
export interface Market {
  id: string;
  city: string;
  cityId: string;
  /** Productions of each kind a week, on average. ASSUMPTION, every figure: the game's share, not the city's size. */
  kinds: Partial<Record<ProjectKind, number>>;
  /** Where its work is made, by medium, as a breakdown says it. */
  venues: Partial<Record<ProMedium, readonly string[]>>;
}

const STAGE_VENUES = ['the company’s main stage', 'its second stage', 'a 299-seat house downtown'];

export const MARKETS: readonly Market[] = [
  {
    id: 'new-york', city: 'New York', cityId: 'us-ny-newyork',
    kinds: {
      'off-broadway': 0.35, 'network-drama': 0.2, 'serialized-drama': 0.12, 'serialized-comedy': 0.1, 'limited-series': 0.1, 'low-budget': 0.3,
      'ultra-low-budget': 0.3, 'student-film': 0.45, 'non-union-short': 0.35, 'animated-series': 0.06, dub: 0.12, documentary: 0.1, 'tv-movie': 0.06,
      anthology: 0.05, 'action-feature': 0.05, musical: 0.08,
    },
    venues: {
      stage: ['a 199-seat theater in Manhattan', 'a 99-seat theater in the East Village', 'a theater in Brooklyn'],
      film: ['locations in Brooklyn and Queens', 'a stage in Long Island City and locations upstate', 'locations in the Bronx'],
      television: ['a studio in Queens', 'a stage in Brooklyn and locations in Manhattan'],
    },
  },
  {
    id: 'los-angeles', city: 'Los Angeles', cityId: 'us-ca-losangeles',
    kinds: {
      'network-drama': 0.3, 'network-comedy': 0.15, 'multicam-comedy': 0.12, 'serialized-drama': 0.15, 'serialized-comedy': 0.12, 'limited-series': 0.08,
      'low-budget': 0.25, 'ultra-low-budget': 0.2, 'animated-series': 0.15, 'animated-feature': 0.04, 'capture-feature': 0.03, 'action-feature': 0.06,
      'tv-movie': 0.06, dub: 0.12,
    },
    venues: {
      film: ['a stage in Burbank and locations in the Valley', 'locations downtown', 'a studio lot in Culver City'],
      television: ['a studio lot in Burbank', 'a stage in Hollywood', 'a studio in Santa Clarita'],
    },
  },
  {
    id: 'atlanta', city: 'Atlanta', cityId: 'us-ga-atlanta',
    kinds: { 'network-drama': 0.1, 'serialized-drama': 0.08, 'action-feature': 0.06, 'tv-movie': 0.08, 'low-budget': 0.12, 'limited-series': 0.05 },
    venues: { film: ['a stage south of the city and locations in town', 'locations in Midtown'], television: ['a studio south of the city'] },
  },
  {
    id: 'chicago', city: 'Chicago', cityId: 'us-il-chicago',
    kinds: { 'network-drama': 0.08, lort: 0.12, 'low-budget': 0.05, musical: 0.03 },
    venues: { stage: STAGE_VENUES, film: ['locations on the South Side'], television: ['a stage on the West Side'] },
  },
  // The regional theaters' towns, each with a fictional company playing under an Equity LORT agreement.
  { id: 'boston', city: 'Boston', cityId: 'us-ma-boston', kinds: { lort: 0.08, musical: 0.02 }, venues: { stage: STAGE_VENUES } },
  { id: 'washington', city: 'Washington', cityId: 'us-dc-washington', kinds: { lort: 0.08, musical: 0.02 }, venues: { stage: STAGE_VENUES } },
  { id: 'philadelphia', city: 'Philadelphia', cityId: 'us-pa-philadelphia', kinds: { lort: 0.06 }, venues: { stage: STAGE_VENUES } },
  { id: 'seattle', city: 'Seattle', cityId: 'us-wa-seattle', kinds: { lort: 0.06 }, venues: { stage: STAGE_VENUES } },
  { id: 'san-diego', city: 'San Diego', cityId: 'us-ca-sandiego', kinds: { lort: 0.06, musical: 0.02 }, venues: { stage: STAGE_VENUES } },
  { id: 'new-haven', city: 'New Haven', cityId: 'us-ct-newhaven', kinds: { lort: 0.05 }, venues: { stage: STAGE_VENUES } },
  // Abroad, only where the game knows what permission the work needs (`content/jurisdictions.ts`: Australia verified, and
  // the UK from 2026-10-24): an American production shooting there, under SAG-AFTRA's terms, as the fixed Sydney feature is.
  { id: 'london', city: 'London', cityId: 'uk-eng-london', kinds: { 'overseas-feature': 0.05 }, venues: { film: ['a stage at a studio west of the city and locations in town', 'locations in the City and on the river'] } },
  { id: 'sydney', city: 'Sydney', cityId: 'au-nsw-sydney', kinds: { 'overseas-feature': 0.04 }, venues: { film: ['a sound stage in Moore Park and locations on the harbor', 'locations in the Blue Mountains'] } },
];

export const marketById = (id: string): Market | undefined => MARKETS.find((m) => m.id === id);

/** A schedule a kind of work can have: the shapes `ProjectTemplate.schedule` takes, as the fixed parts have them. */
export type ScheduleShape =
  | { kind: 'run'; rehearsalWeeks: number; performanceWeeks: number }
  | { kind: 'shoot'; days: number; rehearsalDays?: number; stuntDays?: readonly number[] }
  | { kind: 'week'; weeks: number }
  | { kind: 'sessions'; sessions: number; everyDays: number; minutes: number; hour: number };

/**
 * What a kind of work is like: its format, union and agreement, its pay, the schedules it has, how it's cast, the sizes of
 * part it posts, its genres, and its fate's chances. Every figure an ASSUMPTION drawn from the fixed parts of the same kind
 * (`content/careerwork.ts`), whose terms are the researched ones, but for the fates and the casting weeks, which are the
 * game's own.
 */
export interface KindProfile {
  format: FormatId;
  medium: ProMedium;
  union: 'equity' | 'sag-aftra' | 'none';
  contract: string;
  pay: RateId;
  schedules: readonly ScheduleShape[];
  audition: 'self-tape' | 'in-person';
  /** The chance a part has a callback. */
  callback: number;
  access: { agent: boolean; open: false | 'anyone' | 'equity-members' };
  sizes: Partial<Record<RoleSize, number>>;
  /** Parts a production posts: at least, at most. */
  parts: readonly [number, number];
  /**
   * Genre pairs it's made in, the game's genre ids. Named `genres` until the same day it was written: a kind's options,
   * which tests/cohesion.test.ts took, rightly by the name, for a reading of somebody's genres.
   */
  genreSets: readonly (readonly string[])[];
  sends: readonly ('headshot' | 'resume' | 'reel')[];
  /** Days from a part's posting to the production's first day, at least and at most. */
  lead: readonly [number, number];
  /** The chance it's never made, and that it's pushed, and by how many weeks at least and at most. */
  fate: { never: number; pushed: number; weeks: readonly [number, number] };
  /** The skills its parts lean on, besides the genres' own. */
  techniques: Partial<Record<Skill, number>>;
  stakes: number;
  /** Television that runs in seasons: its episodes, how often one's shot, the days each, and the network's chances. */
  series?: { episodes: number; everyDays: number; daysEach: number; program: 'hour' | 'half-hour'; renew: number; revive: number };
}

const SCREEN_SENDS = ['headshot', 'resume', 'reel'] as const;
const STAGE_SENDS = ['headshot', 'resume'] as const;
const FATE_FILM = { never: 0.08, pushed: 0.12, weeks: [3, 10] } as const;
const FATE_TV = { never: 0.04, pushed: 0.1, weeks: [2, 6] } as const;
const FATE_STAGE = { never: 0.03, pushed: 0.05, weeks: [4, 12] } as const;

export const KIND_PROFILES: Readonly<Partial<Record<ProjectKind, KindProfile>>> = {
  'off-broadway': {
    format: 'play', medium: 'stage', union: 'equity', contract: 'Equity Off-Broadway', pay: 'off-broadway',
    schedules: [{ kind: 'run', rehearsalWeeks: 4, performanceWeeks: 6 }, { kind: 'run', rehearsalWeeks: 3, performanceWeeks: 5 }, { kind: 'run', rehearsalWeeks: 4, performanceWeeks: 8 }],
    audition: 'in-person', callback: 0.8, access: { agent: true, open: false }, sizes: { supporting: 3, lead: 1, featured: 1 }, parts: [1, 3],
    genreSets: [['domestic_drama', 'drama'], ['comedy', 'satire'], ['tragedy', 'drama'], ['tragicomedy', 'comedy'], ['political_drama', 'drama'], ['romantic_comedy', 'comedy']],
    sends: STAGE_SENDS, lead: [42, 70], fate: FATE_STAGE, techniques: { scene: 2, character: 1 }, stakes: 2,
  },
  lort: {
    format: 'play', medium: 'stage', union: 'equity', contract: 'Equity LORT C', pay: 'lort-c',
    schedules: [{ kind: 'run', rehearsalWeeks: 4, performanceWeeks: 5 }, { kind: 'run', rehearsalWeeks: 3, performanceWeeks: 4 }, { kind: 'run', rehearsalWeeks: 4, performanceWeeks: 6 }],
    audition: 'in-person', callback: 0.7, access: { agent: true, open: 'equity-members' }, sizes: { lead: 1, supporting: 3, featured: 1 }, parts: [1, 3],
    genreSets: [['comedy', 'farce'], ['tragedy', 'drama'], ['domestic_drama', 'drama'], ['historical_drama', 'drama'], ['mystery', 'comedy'], ['romance', 'comedy']],
    sends: STAGE_SENDS, lead: [42, 77], fate: FATE_STAGE, techniques: { scene: 1, speech: 1, character: 1 }, stakes: 1,
  },
  musical: {
    format: 'musical', medium: 'stage', union: 'equity', contract: 'Equity LORT B', pay: 'lort-b',
    schedules: [{ kind: 'run', rehearsalWeeks: 3, performanceWeeks: 4 }, { kind: 'run', rehearsalWeeks: 4, performanceWeeks: 6 }],
    audition: 'in-person', callback: 0.9, access: { agent: true, open: 'equity-members' }, sizes: { supporting: 3, featured: 2, lead: 1 }, parts: [1, 2],
    genreSets: [['musical', 'comedy'], ['musical', 'romance'], ['backstage_musical', 'musical']],
    sends: STAGE_SENDS, lead: [42, 70], fate: FATE_STAGE, techniques: { singing: 2, dance: 1, scene: 1 }, stakes: 2,
  },
  'network-drama': {
    format: 'procedural', medium: 'television', union: 'sag-aftra', contract: 'SAG-AFTRA TV/Theatrical', pay: 'sag-tv-day',
    schedules: [{ kind: 'shoot', days: 2 }, { kind: 'shoot', days: 1 }, { kind: 'shoot', days: 3 }],
    audition: 'self-tape', callback: 0.2, access: { agent: true, open: false }, sizes: { 'co-star': 1 }, parts: [2, 3],
    genreSets: [['police_procedural', 'crime'], ['medical_drama', 'drama'], ['legal_drama', 'drama'], ['crime', 'mystery']],
    sends: SCREEN_SENDS, lead: [21, 42], fate: FATE_TV, techniques: { screen: 2, scene: 1 }, stakes: 1,
    series: { episodes: 13, everyDays: 14, daysEach: 2, program: 'hour', renew: 0.6, revive: 0.15 },
  },
  'network-comedy': {
    format: 'single-camera-comedy', medium: 'television', union: 'sag-aftra', contract: 'SAG-AFTRA TV/Theatrical', pay: 'sag-tv-day',
    schedules: [{ kind: 'shoot', days: 2 }, { kind: 'shoot', days: 1 }],
    audition: 'self-tape', callback: 0.2, access: { agent: true, open: false }, sizes: { 'co-star': 1 }, parts: [1, 2],
    genreSets: [['comedy', 'mockumentary'], ['comedy', 'slice_of_life'], ['comedy', 'satire']],
    sends: SCREEN_SENDS, lead: [21, 42], fate: FATE_TV, techniques: { screen: 2, comedy: 2 }, stakes: 1,
    series: { episodes: 13, everyDays: 14, daysEach: 2, program: 'half-hour', renew: 0.55, revive: 0.1 },
  },
  'multicam-comedy': {
    format: 'multicam-comedy', medium: 'television', union: 'sag-aftra', contract: 'SAG-AFTRA TV/Theatrical', pay: 'sag-tv-day',
    schedules: [{ kind: 'week', weeks: 1 }],
    audition: 'in-person', callback: 0.7, access: { agent: true, open: false }, sizes: { 'co-star': 1 }, parts: [1, 2],
    genreSets: [['comedy', 'family'], ['comedy', 'romantic_comedy'], ['comedy', 'slapstick']],
    sends: SCREEN_SENDS, lead: [21, 42], fate: FATE_TV, techniques: { comedy: 2, scene: 1 }, stakes: 1,
    series: { episodes: 13, everyDays: 7, daysEach: 5, program: 'half-hour', renew: 0.5, revive: 0.1 },
  },
  'serialized-drama': {
    format: 'serialized-drama', medium: 'television', union: 'sag-aftra', contract: 'SAG-AFTRA TV/Theatrical', pay: 'sag-tv-day',
    schedules: [{ kind: 'shoot', days: 3 }, { kind: 'shoot', days: 4 }, { kind: 'shoot', days: 2 }],
    audition: 'self-tape', callback: 0.6, access: { agent: true, open: false }, sizes: { 'co-star': 3, supporting: 1 }, parts: [1, 3],
    genreSets: [['drama', 'family'], ['thriller', 'drama'], ['crime', 'drama'], ['political_drama', 'drama'], ['science_fiction', 'drama'], ['supernatural', 'drama']],
    sends: SCREEN_SENDS, lead: [28, 49], fate: FATE_TV, techniques: { screen: 2, character: 1 }, stakes: 2,
    series: { episodes: 10, everyDays: 14, daysEach: 3, program: 'hour', renew: 0.55, revive: 0.12 },
  },
  'serialized-comedy': {
    format: 'serialized-comedy', medium: 'television', union: 'sag-aftra', contract: 'SAG-AFTRA TV/Theatrical', pay: 'sag-tv-day',
    schedules: [{ kind: 'shoot', days: 3 }, { kind: 'shoot', days: 2 }],
    audition: 'self-tape', callback: 0.3, access: { agent: true, open: false }, sizes: { 'co-star': 1 }, parts: [1, 2],
    genreSets: [['comedy', 'hangout'], ['comedy', 'drama'], ['black_comedy', 'comedy']],
    sends: SCREEN_SENDS, lead: [28, 42], fate: FATE_TV, techniques: { screen: 2, comedy: 1 }, stakes: 1,
    series: { episodes: 10, everyDays: 14, daysEach: 3, program: 'half-hour', renew: 0.5, revive: 0.1 },
  },
  'animated-series': {
    format: 'animated-series', medium: 'television', union: 'sag-aftra', contract: 'SAG-AFTRA Television Animation', pay: 'animation-session',
    schedules: [{ kind: 'sessions', sessions: 3, everyDays: 14, minutes: 240, hour: 10 }, { kind: 'sessions', sessions: 2, everyDays: 21, minutes: 240, hour: 10 }],
    audition: 'self-tape', callback: 0.5, access: { agent: false, open: 'anyone' }, sizes: { 'co-star': 2, supporting: 1 }, parts: [1, 2],
    genreSets: [['animated', 'comedy'], ['animated', 'adventure'], ['animated', 'childrens']],
    sends: SCREEN_SENDS, lead: [21, 42], fate: FATE_TV, techniques: { voice: 2, voiceover: 2 }, stakes: 1,
    series: { episodes: 13, everyDays: 14, daysEach: 1, program: 'half-hour', renew: 0.6, revive: 0.1 },
  },
  'limited-series': {
    format: 'limited-series', medium: 'television', union: 'sag-aftra', contract: 'SAG-AFTRA TV/Theatrical', pay: 'sag-tv-day',
    schedules: [{ kind: 'shoot', days: 5 }, { kind: 'shoot', days: 4 }, { kind: 'shoot', days: 6 }],
    audition: 'self-tape', callback: 0.7, access: { agent: true, open: false }, sizes: { supporting: 2, 'co-star': 2 }, parts: [1, 3],
    genreSets: [['true_crime', 'drama'], ['historical_drama', 'drama'], ['psychological_thriller', 'thriller'], ['mystery', 'drama']],
    sends: SCREEN_SENDS, lead: [35, 63], fate: FATE_FILM, techniques: { screen: 2, character: 1 }, stakes: 2,
  },
  'tv-movie': {
    format: 'tv-movie', medium: 'television', union: 'sag-aftra', contract: 'SAG-AFTRA TV/Theatrical', pay: 'sag-tv-day',
    schedules: [{ kind: 'shoot', days: 4 }, { kind: 'shoot', days: 3 }, { kind: 'shoot', days: 5 }],
    audition: 'self-tape', callback: 0.5, access: { agent: true, open: false }, sizes: { supporting: 2, lead: 1, 'co-star': 1 }, parts: [1, 2],
    genreSets: [['romance', 'christmas'], ['romantic_comedy', 'holiday'], ['thriller', 'drama'], ['family', 'drama']],
    sends: SCREEN_SENDS, lead: [28, 49], fate: FATE_FILM, techniques: { screen: 2, scene: 1 }, stakes: 1,
  },
  anthology: {
    format: 'anthology', medium: 'television', union: 'sag-aftra', contract: 'SAG-AFTRA TV/Theatrical', pay: 'sag-tv-day',
    schedules: [{ kind: 'shoot', days: 3 }, { kind: 'shoot', days: 4 }],
    audition: 'self-tape', callback: 0.5, access: { agent: true, open: false }, sizes: { 'co-star': 2, supporting: 1 }, parts: [1, 2],
    genreSets: [['anthology', 'horror'], ['anthology', 'science_fiction'], ['anthology', 'drama']],
    sends: SCREEN_SENDS, lead: [28, 49], fate: FATE_FILM, techniques: { screen: 2, character: 1 }, stakes: 1,
  },
  'low-budget': {
    format: 'independent-feature', medium: 'film', union: 'sag-aftra', contract: 'SAG-AFTRA Low Budget Theatrical', pay: 'low-budget-day',
    schedules: [{ kind: 'shoot', days: 6 }, { kind: 'shoot', days: 4 }, { kind: 'shoot', days: 8 }],
    audition: 'self-tape', callback: 0.6, access: { agent: true, open: false }, sizes: { supporting: 3, lead: 1, featured: 1 }, parts: [1, 3],
    genreSets: [['psychological_thriller', 'thriller'], ['drama', 'coming_of_age'], ['horror', 'supernatural'], ['romantic_drama', 'drama'], ['black_comedy', 'comedy'], ['crime', 'neo_noir']],
    sends: SCREEN_SENDS, lead: [28, 56], fate: FATE_FILM, techniques: { screen: 2, character: 1 }, stakes: 2,
  },
  'ultra-low-budget': {
    format: 'independent-feature', medium: 'film', union: 'sag-aftra', contract: 'SAG-AFTRA Ultra Low Budget', pay: 'ultra-low-budget-day',
    schedules: [{ kind: 'shoot', days: 4 }, { kind: 'shoot', days: 6 }, { kind: 'shoot', days: 3 }],
    audition: 'self-tape', callback: 0.3, access: { agent: true, open: 'anyone' }, sizes: { lead: 2, supporting: 3 }, parts: [1, 3],
    genreSets: [['drama', 'mumblecore'], ['horror', 'found_footage'], ['comedy', 'road_movie'], ['thriller', 'mystery'], ['romance', 'drama']],
    sends: SCREEN_SENDS, lead: [28, 49], fate: { never: 0.15, pushed: 0.15, weeks: [3, 12] }, techniques: { screen: 2, scene: 1 }, stakes: 1,
  },
  'student-film': {
    format: 'student-film', medium: 'film', union: 'sag-aftra', contract: 'SAG-AFTRA Student Film', pay: 'student-film',
    schedules: [{ kind: 'shoot', days: 3 }, { kind: 'shoot', days: 2 }, { kind: 'shoot', days: 4 }],
    audition: 'in-person', callback: 0, access: { agent: false, open: 'anyone' }, sizes: { lead: 2, supporting: 2 }, parts: [1, 2],
    genreSets: [['drama', 'coming_of_age'], ['comedy', 'slice_of_life'], ['horror', 'thriller'], ['romance', 'drama'], ['science_fiction', 'drama']],
    sends: STAGE_SENDS, lead: [21, 42], fate: { never: 0.1, pushed: 0.15, weeks: [1, 6] }, techniques: { screen: 1, scene: 1 }, stakes: 1,
  },
  'non-union-short': {
    format: 'short', medium: 'film', union: 'none', contract: 'Non-Union', pay: 'non-union-day',
    schedules: [{ kind: 'shoot', days: 2 }, { kind: 'shoot', days: 1 }, { kind: 'shoot', days: 3 }],
    audition: 'self-tape', callback: 0, access: { agent: false, open: 'anyone' }, sizes: { lead: 2, supporting: 2 }, parts: [1, 2],
    genreSets: [['drama', 'slice_of_life'], ['comedy', 'absurdist'], ['horror', 'psychological_horror'], ['thriller', 'crime']],
    sends: SCREEN_SENDS, lead: [21, 35], fate: { never: 0.12, pushed: 0.15, weeks: [1, 6] }, techniques: { screen: 1 }, stakes: 1,
  },
  'action-feature': {
    format: 'action-feature', medium: 'film', union: 'sag-aftra', contract: 'SAG-AFTRA Basic Agreement', pay: 'sag-tv-day',
    schedules: [{ kind: 'shoot', days: 6, rehearsalDays: 2, stuntDays: [1, 3] }, { kind: 'shoot', days: 5, rehearsalDays: 2, stuntDays: [2] }],
    audition: 'self-tape', callback: 0.7, access: { agent: true, open: false }, sizes: { supporting: 2, 'co-star': 2 }, parts: [1, 2],
    genreSets: [['action', 'thriller'], ['action', 'heist'], ['action', 'science_fiction'], ['action', 'spy']],
    sends: SCREEN_SENDS, lead: [42, 70], fate: FATE_FILM, techniques: { combat: 2, movement: 1, screen: 1 }, stakes: 2,
  },
  'animated-feature': {
    format: 'animated-feature', medium: 'film', union: 'sag-aftra', contract: 'SAG-AFTRA Basic Agreement', pay: 'sag-tv-day',
    schedules: [{ kind: 'sessions', sessions: 4, everyDays: 35, minutes: 240, hour: 10 }, { kind: 'sessions', sessions: 3, everyDays: 28, minutes: 240, hour: 10 }],
    audition: 'self-tape', callback: 0.6, access: { agent: false, open: 'anyone' }, sizes: { supporting: 2, 'co-star': 2 }, parts: [1, 2],
    genreSets: [['animated', 'adventure'], ['animated', 'fantasy'], ['animated', 'family']],
    sends: SCREEN_SENDS, lead: [28, 56], fate: FATE_FILM, techniques: { voice: 2, voiceover: 2 }, stakes: 2,
  },
  'capture-feature': {
    format: 'capture', medium: 'film', union: 'sag-aftra', contract: 'SAG-AFTRA Basic Agreement (Performance Capture)', pay: 'sag-tv-day',
    schedules: [{ kind: 'sessions', sessions: 4, everyDays: 8, minutes: 600, hour: 8 }],
    audition: 'in-person', callback: 0.8, access: { agent: true, open: false }, sizes: { supporting: 2 }, parts: [1, 1],
    genreSets: [['science_fiction', 'action'], ['fantasy', 'adventure']],
    sends: SCREEN_SENDS, lead: [42, 70], fate: FATE_FILM, techniques: { movement: 2, character: 1, screen: 1 }, stakes: 2,
  },
  dub: {
    format: 'dub', medium: 'film', union: 'sag-aftra', contract: 'SAG-AFTRA Basic Agreement (Dialogue Replacement)', pay: 'sag-tv-day',
    schedules: [{ kind: 'sessions', sessions: 3, everyDays: 1, minutes: 480, hour: 9 }, { kind: 'sessions', sessions: 2, everyDays: 1, minutes: 480, hour: 9 }],
    audition: 'self-tape', callback: 0, access: { agent: false, open: 'anyone' }, sizes: { supporting: 2, 'co-star': 1 }, parts: [1, 2],
    genreSets: [['drama', 'thriller'], ['animated', 'adventure'], ['crime', 'drama']],
    sends: SCREEN_SENDS, lead: [14, 35], fate: { never: 0.05, pushed: 0.08, weeks: [1, 4] }, techniques: { voice: 2, voiceover: 1 }, stakes: 1,
  },
  documentary: {
    format: 'narration', medium: 'film', union: 'sag-aftra', contract: 'SAG-AFTRA Basic Agreement', pay: 'sag-tv-day',
    schedules: [{ kind: 'sessions', sessions: 3, everyDays: 2, minutes: 240, hour: 10 }, { kind: 'sessions', sessions: 2, everyDays: 3, minutes: 240, hour: 10 }],
    audition: 'self-tape', callback: 0, access: { agent: false, open: 'anyone' }, sizes: { lead: 1 }, parts: [1, 1],
    genreSets: [['documentary', 'nature_documentary'], ['documentary', 'true_crime'], ['documentary', 'biographical']],
    sends: SCREEN_SENDS, lead: [21, 42], fate: { never: 0.06, pushed: 0.1, weeks: [2, 6] }, techniques: { voiceover: 2, speech: 1 }, stakes: 1,
  },
  'overseas-feature': {
    format: 'studio-feature', medium: 'film', union: 'sag-aftra', contract: 'SAG-AFTRA Basic Agreement (Theatrical)', pay: 'sag-tv-week',
    schedules: [{ kind: 'shoot', days: 8 }, { kind: 'shoot', days: 6 }, { kind: 'shoot', days: 10 }],
    audition: 'self-tape', callback: 0.8, access: { agent: true, open: 'anyone' }, sizes: { supporting: 2, 'co-star': 1 }, parts: [1, 2],
    genreSets: [['adventure', 'drama'], ['thriller', 'mystery'], ['science_fiction', 'action']],
    sends: SCREEN_SENDS, lead: [63, 84], fate: FATE_FILM, techniques: { screen: 2, accents: 1 }, stakes: 2,
  },
};

/**
 * Who books and pays for work away from where the actor lives, in the words the fixed Sydney feature uses, said with the
 * trip. Every part carries it, and `travels` (systems/projobs.ts) uses it only where the actor lives too far to go daily.
 * Until the text pass of 2026-10-24 only parts abroad carried it, and a New Haven actor's part in Los Angeles was read as
 * "about three hours each way from where you live", a daily journey.
 */
export const AWAY_TRIP = {
  hotel: 'a hotel near the work',
  words: 'The production books and pays for your flights, the cars and the hotel, as the game assumes for a part away from where you live.',
} as const;

// ---------------------------------------------------------------------------------------------------------------------
// The words: fictional titles, companies, casting offices and characters, and what a breakdown says of each part
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Title words. A title is "The <noun>", "<adjective> <noun>", "<noun> Of <noun>", "The <noun> On <street>" or a place
 * and a noun. Each production says it's the game's invention; a title that matches a real one is a coincidence.
 */
export const TITLE_WORDS = {
  adjectives: ['Quiet', 'Burning', 'Northern', 'Last', 'Hollow', 'Paper', 'Silver', 'Late', 'Small', 'Bright', 'Narrow', 'Second', 'Borrowed', 'Salt', 'Winter', 'Glass', 'Lower', 'Open', 'Crooked', 'Still'],
  nouns: ['Harbor', 'Ledger', 'Orchard', 'Station', 'Weather', 'Crossing', 'Inheritance', 'Tenants', 'Telegram', 'Lantern', 'Undertow', 'Assembly', 'Margins', 'Quarry', 'Vigil', 'Ferry', 'Almanac', 'Arrangement', 'Floodplain', 'Errand', 'Witness', 'Carnival', 'Accounts', 'Interval'],
  streets: ['Delancey', 'Halsted', 'Fulton', 'Larkin', 'Mercer', 'Prospect', 'Lyle', 'Caldwell', 'Tamsin', 'Orrin'],
  places: ['Kettle Point', 'Marrow Bay', 'Lowell Falls', 'Carver Hill', 'Ashby', 'Penwick', 'Dunmore', 'Halloway', 'Brisco', 'Fenwick Pass'],
} as const;

/** Company words: "<first> <second> <kind>", a kind by medium. */
export const COMPANY_WORDS = {
  first: ['Tern', 'Marrow', 'Calder', 'Lowmoor', 'Briar', 'Ostler', 'Gannet', 'Wexley', 'Thimble', 'Corbin', 'Larch', 'Sable', 'Rook', 'Haverly', 'Mill Pond', 'Blue Kettle'],
  second: ['Lane', 'Point', 'Street', 'Hollow', 'Bridge', 'Yard', 'Gate', 'Field', 'Row', 'Works'],
  kinds: { stage: ['Theater Company', 'Repertory Theater', 'Stage Company', 'Playhouse'], film: ['Pictures', 'Films', 'Productions'], television: ['Television', 'Studios', 'Entertainment'] },
} as const;

/** Casting offices: a surname, and "Casting". */
export const CASTING_NAMES = ['Pennick', 'Ostrander', 'Kettering', 'Quillon', 'Abernathy', 'Lisle', 'Varga', 'Delacroix', 'Mbeki', 'Hargrove', 'Iwata', 'Sorensen', 'Achebe', 'Lindqvist', 'Moreau', 'Castellano', 'Ruiz', 'Okonjo', 'Halvorsen', 'Brannigan'];

/** Characters' given names: for a part written for an actress, for an actor, and for either. Never a classmate's (`school.ts`). */
const NAMES_ACTRESS = ['Nell', 'Wren', 'Ivy', 'Hester', 'Marisol', 'Adaeze', 'Tamsin', 'Rosalind', 'Bea', 'Celeste', 'Inez', 'Margo', 'Yusra', 'Delphine', 'Odette', 'Lena', 'Vera', 'Pilar', 'Junie', 'Sabine'];
const NAMES_ACTOR = ['Callum', 'Felix', 'Tobias', 'Ferris', 'Arlo', 'Desmond', 'Ezra', 'Gideon', 'Hollis', 'Ignatius', 'Kwame', 'Lionel', 'Rafe', 'Silas', 'Thaddeus', 'Wendell', 'Ambrose', 'Cormac', 'Dashiell', 'Emeka'];
const NAMES_EITHER = ['Robin', 'Avery', 'Quinn', 'Rowan', 'Sage', 'Ellis', 'Marlowe', 'Reese', 'Jules', 'Hollis', 'Arden', 'Kit', 'Morgan', 'Blair', 'Emery', 'Lane'];
// The classmates' given names (`GIVEN_ACTRESS`, `GIVEN_ACTOR` in `systems/school.ts`) and their short forms, never a
// character's: kept here by hand, not imported, so this reference data loads before the systems do; `tests/b27-slate.test.ts`
// holds the two lists to each other.
export const CLASSMATE_NAMES: readonly string[] = ['Maya', 'Elena', 'Priya', 'Sofia', 'Hannah', 'Nadia', 'Grace', 'Imani', 'Lucia', 'Aaliyah', 'Chloe', 'Zoe', 'Jordan', 'Marcus', 'Daniel', 'Isaiah', 'Theo', 'Caleb', 'Julian', 'Owen', 'Samuel', 'Noah', 'Mateo', 'Ethan', 'Sam', 'Max'];
const TAKEN = new Set(CLASSMATE_NAMES);
export const GIVEN = {
  actress: NAMES_ACTRESS.filter((n) => !TAKEN.has(n)),
  actor: NAMES_ACTOR.filter((n) => !TAKEN.has(n)),
  either: NAMES_EITHER.filter((n) => !TAKEN.has(n)),
} as const;
export const SURNAMES = ['Ashdown', 'Bellweather', 'Cordray', 'Dunleavy', 'Escobar', 'Farrow', 'Gaskell', 'Huxtable', 'Ibarra', 'Jessop', 'Kincaid', 'Lacombe', 'Moorcroft', 'Nakashima', 'Oduya', 'Prendergast', 'Quaid', 'Rasmussen', 'Strand', 'Thibodeaux', 'Underhill', 'Vasquez', 'Whitcombe', 'Yardley'];

/**
 * What a part is, as a breakdown says it: who they are, and what they want or hide, by the production's first genre
 * family. A breakdown is "<who> <what>.", each half a phrase from its family's list, and it never says "he" or "she", so
 * a part written for either reads the same.
 */
export const BREAKDOWN: Readonly<Record<'drama' | 'comedy' | 'crime' | 'horror' | 'romance' | 'fantastic' | 'musical' | 'voice' | 'documentary', { who: readonly string[]; what: readonly string[] }>> = {
  drama: {
    who: ['A night-shift nurse', 'The eldest child', 'A union organizer', 'A substitute teacher', 'The family’s lawyer', 'A ferry captain’s deputy', 'A grief counselor', 'A line cook', 'A city councilor’s aide', 'A returning soldier'],
    what: ['who has kept the same secret for ten years', 'who comes home for the funeral and stays', 'who has to choose between the job and the truth', 'who says what nobody else at the table will', 'who is quietly running out of money', 'who finds the letter first', 'who promised to sell the house and hasn’t'],
  },
  comedy: {
    who: ['A wedding planner', 'An overconfident realtor', 'A substitute mail carrier', 'The new manager', 'A regional sales champion', 'A dog walker', 'A failed magician', 'The best man', 'A late-night radio host', 'A minor-league mascot'],
    what: ['who has double-booked the same Saturday', 'who lies about one small thing and has to keep going', 'who takes every instruction literally', 'who is sure this is the big break', 'who can’t stop helping', 'who is hiding a second job from everyone', 'who agreed to something at a party and has to do it'],
  },
  crime: {
    who: ['A hotel night clerk', 'A forensic accountant', 'A rookie detective', 'A getaway driver', 'A public defender', 'The victim’s neighbor', 'A pawnshop owner', 'A crime-scene photographer', 'A parole officer', 'A late-night bartender'],
    what: ['who saw more than they said', 'who knows where the money went', 'who is covering for a brother', 'who lies about the time', 'who wants out after one last job', 'who recognizes the handwriting', 'who has been paid to forget'],
  },
  horror: {
    who: ['A caretaker', 'A night-shift security guard', 'A paranormal podcaster', 'The new tenant', 'A camp counselor', 'A lighthouse keeper', 'A hospice volunteer', 'A real-estate photographer'],
    what: ['who hears it first', 'who won’t go into the basement', 'who has been here before and won’t say when', 'who keeps the doors locked from the outside', 'who believes nobody until it’s too late', 'who knows what the town did'],
  },
  romance: {
    who: ['A bookshop owner', 'A wedding photographer', 'A pastry chef', 'The ex who came back for the summer', 'A veterinarian', 'A ski instructor', 'A small-town mayor', 'A translator'],
    what: ['who swore never to fall for a client', 'who is engaged to the wrong person', 'who agrees to fake it for one weekend', 'who keeps leaving notes', 'who has one week left in town', 'who is writing the letter they’ll never send'],
  },
  fantastic: {
    who: ['A ship’s navigator', 'A colony medic', 'A map-maker', 'A time-loop survivor', 'An apprentice', 'The last engineer', 'A border guard', 'A smuggler'],
    what: ['who remembers the world before', 'who can open the door nobody else can', 'who has already lived this day', 'who isn’t who the crew thinks', 'who carries the only copy of the code', 'who made a bargain and has to keep it'],
  },
  musical: {
    who: ['A chorus girl with ambitions', 'A rehearsal pianist', 'A small-town bandleader', 'An understudy', 'A dance teacher', 'A street singer'],
    what: ['who has one song to change everything', 'who knows every part but their own', 'who is saving every dollar to leave', 'who can’t stop dancing when nervous'],
  },
  voice: {
    who: ['A talking ferret', 'A lighthouse that dreams of sailing', 'A nervous dragon', 'A robot gardener', 'A detective owl', 'A runaway kite', 'The grumpy neighbor', 'A pirate cook'],
    what: ['who wants to be taken seriously', 'who is afraid of heights', 'who tells terrible jokes at the worst times', 'who has a secret map', 'who is always one step behind'],
  },
  documentary: {
    who: ['The narrator'],
    what: ['who tells the story in measured, warm English', 'who carries the film across its forty years', 'whose voice holds the film’s three timelines together'],
  },
};
