/**
 * SLATE — doing what you love.
 *
 * The one place the engine reads somebody's interests, and the owner's rule
 * for it, set on 2026-09-24: an interest may change how much somebody gets
 * out of doing a thing, never how good they are at it. Loving to cook makes a
 * meal more satisfying; it doesn't make the meal bigger. So what this decides
 * is mood and stress, and nothing else: not fitness, not energy, not food.
 * `tests/cohesion.test.ts` holds that nothing else in the engine reads the
 * interests, and `tests/looking-after.test.ts` that this moves only those two.
 *
 * Until then nothing read them at all. The rule was that the moment the
 * engine branched on them they would stop being who somebody is and start
 * being a stat, and this keeps the part of that which mattered.
 *
 * The genres and the crafts waited for the film career, under the same rule,
 * until 2026-09-27: a day on a job whose medium, genre or place somebody
 * loves lifts the mood and eases the stress, and the performance is no
 * better for it. The same day, three dispositions nothing read got the same
 * kind of reader: extraversion how the room is taken, openness the road, and
 * agreeableness the company of a rehearsal. None of them makes anybody better
 * at anything either.
 *
 * The career went in the scope reset of 2026-10-09, and with it the screen
 * days, the road and the audition room, so in the connected world that day
 * each found the school's own counterpart, under the same rule: extraversion
 * how a house or a class watching is taken (`takeTheHouse`, at every
 * performance's nerves), openness how new work is (a festival's new play, a
 * Cabaret piece), the genres a play of that kind (`genresOfPlay`), and the
 * crafts a piece of coursework that works in one (`Template.crafts`) or a
 * play read. What has no counterpart in a student's life is said back at
 * creation as reading nothing (`interestsRead`).
 */

import type { Person } from '../domain/model';
import { clamp } from '../core/rng';
import type { LookAfter } from './life';
import { personalityOf } from './personality';
import { REP_PLAYS, SHAKESPEARE_PLAYS, SUMMER_PLAYS, THESIS_PLAYS } from '../content/plays';
import { TEMPLATES } from '../content/coursework';

/** Which of what somebody cares about each thing they can do for themselves is. */
const LOVED_IN: Record<LookAfter, readonly string[]> = {
  eat: ['cooking'],
  order: [],
  wash: [],
  exercise: ['fitness', 'sport'],
  // An hour to yourself goes on what you'd spend an evening on.
  // Film History and Film Preservation are an evening with the old films.
  unwind: ['art', 'design', 'film', 'film_history', 'film_preservation', 'games', 'history', 'music', 'photography', 'technology', 'television', 'theatre', 'writing', 'reading', 'politics'],
};
// Reading and Politics joined the evening's on 2026-10-09: until then nothing read either.

/** The crafts a play read puts somebody among (`plays.read`, `plays.research`), from 2026-10-09. */
export const READ_CRAFTS = ['reading'] as const;

/**
 * Every interest and genre something in a student's life reads now, from the same lists the readers use: what
 * creation says moves something, the rest said back as reading nothing (from the connected world of 2026-10-09).
 * The screen's crafts, the road, the voice booth and the audition room went with the career.
 */
export function interestsRead(): { interests: Set<string>; genres: Set<string> } {
  const genres = new Set([...THESIS_PLAYS, ...SHAKESPEARE_PLAYS, ...REP_PLAYS, ...SUMMER_PLAYS].flatMap((p) => p.kinds ?? []));
  const interests = new Set<string>([
    ...Object.values(LOVED_IN).flat(), 'theatre', ...CRAFTS_AT.stage, ...CRAFTS_AT.rehearsal, ...READ_CRAFTS,
    ...TEMPLATES.flatMap((t) => t.crafts ?? []),
    ...GENRE_CRAFTS.filter(([g]) => g.some((x) => genres.has(x))).flatMap(([, c]) => c),
  ]);
  return { interests, genres };
}

/** How much more of the mood, and of the stress relief, an hour gives somebody who loves it. */
export const LOVED_MOOD = 1.5;
export const LOVED_RELIEF = 1.25;

/** The interests of theirs this is, by id, in the order the list above gives them. */
export function lovedIn(person: Pick<Person, 'interests'>, action: LookAfter): string[] {
  const theirs = person.interests ?? [];
  return LOVED_IN[action].filter((id) => theirs.includes(id));
}

/**
 * Whether somebody loves an interest, for an hour of it as rest (`systems/engagement.ts`, from 2026-10-09): read
 * here, where the character sheet's preferences are read, so loving a thing changes how much somebody gets out of it
 * and never how good they are at it.
 */
export const lovesInterest = (person: Person, id: string): boolean => person.interests.includes(id);

/** A day's work as enjoyment sees it: what it is, what it's filed under, and whether it's away from home. */
export interface WorkDay {
  medium: 'screen' | 'stage' | 'voice';
  after?: 'tv' | 'film' | 'commercial';
  genre?: string;
  /** New work, from 2026-10-09: a festival's new play or a Cabaret piece, taken by openness as the road was. */
  novel?: boolean;
  /** A play's kinds of story, from 2026-10-09 (`genresOfPlay`). */
  genres?: readonly string[];
  away: boolean;
  /** The role's id, where the kind of voice work decides a craft: an animated series, a video game. */
  role?: string;
  rehearsal?: boolean;
  /** The trades there, where they aren't a day of work's (an improv class's). */
  crafts?: readonly string[];
}

/**
 * The trades a day's work puts somebody beside, by where it is. A set has
 * its camera, lights, hair and makeup, costume, sound, script supervisor,
 * director, producers, art department and designers; a series its showrunner and writers; a location
 * the place somebody scouted; a stage its lighting, costume, props, scenery
 * and sound, and its rehearsal room the director, a dialect coach and an
 * intimacy coordinator; a booth its mixer, an animated series its animators
 * and a video game its motion capture. Until 2026-09-28 thirty of the crafts
 * were said back and nothing more.
 */
export const CRAFTS_AT = {
  set: ['cinematography', 'lighting', 'hair_and_makeup', 'costume_design', 'sound_mixing', 'script_supervision', 'directing', 'producing', 'production_design', 'art_direction', 'set_decoration', 'props'],
  series: ['showrunning', 'writers_rooms', 'screenwriting'],
  location: ['location_scouting'],
  stage: ['lighting', 'costume_design', 'hair_and_makeup', 'props', 'set_decoration', 'sound_design', 'directing'],
  rehearsal: ['directing', 'dialect_coaching', 'intimacy_coordination'],
  booth: ['sound_mixing'],
  animation: ['animation'],
  game: ['motion_capture'],
  /** The finished work, seen: what post-production made of it, and the reviews. */
  seen: ['editing', 'color_grading', 'film_scoring', 'music_supervision', 'title_design', 'sound_design', 'foley', 'visual_effects', 'film_criticism'],
  festival: ['film_festivals'],
  room: ['casting'],
  improv: ['improvisation'],
} as const;

/** The trades a genre brings onto the floor beside those. */
export const GENRE_CRAFTS: readonly [readonly string[], readonly string[]][] = [
  [['action', 'action_comedy', 'martial_arts', 'war', 'western', 'spaghetti_western', 'swashbuckler', 'superhero', 'spy', 'espionage', 'heist', 'chase', 'samurai', 'chanbara', 'wuxia', 'disaster', 'survival', 'sword_and_sandal', 'sword_and_sorcery'], ['stunts', 'storyboarding', 'stage_combat']],
  [['horror', 'creature_feature', 'monster_movie', 'kaiju', 'body_horror', 'zombie', 'werewolf', 'vampire', 'splatter', 'slasher', 'eco_horror', 'cosmic_horror', 'tokusatsu'], ['creature_effects', 'practical_effects']],
  [['science_fiction', 'space_opera', 'science_fantasy', 'cyberpunk', 'fantasy', 'dark_fantasy', 'superhero', 'kaiju', 'disaster', 'tokusatsu', 'steampunk'], ['visual_effects', 'miniatures']],
  [['musical', 'backstage_musical', 'jukebox_musical', 'dance', 'concert_film'], ['choreography', 'music_supervision']],
  [['childrens', 'family', 'fairy_tale'], ['puppetry']],
  [['animated', 'anime'], ['animation']],
  [['costume_drama', 'period_drama', 'historical_drama', 'historical_fiction', 'biographical'], ['dialect_coaching']],
];

/** The trades a day's work puts them beside (`CRAFTS_AT`, and the genre's). */
export function craftsOf(day: WorkDay): string[] {
  if (day.crafts) return [...day.crafts];
  const out: string[] = [];
  if (day.medium === 'screen') {
    out.push(...CRAFTS_AT.set);
    if (day.after === 'tv') out.push(...CRAFTS_AT.series);
    if (day.away) out.push(...CRAFTS_AT.location);
  } else if (day.medium === 'stage') out.push(...(day.rehearsal ? CRAFTS_AT.rehearsal : CRAFTS_AT.stage));
  else {
    out.push(...CRAFTS_AT.booth);
    if (day.role === 'animation') out.push(...CRAFTS_AT.animation);
    if (day.role === 'game') out.push(...CRAFTS_AT.game);
  }
  // A play's kinds bring theirs too (from 2026-10-09): a history's dialect coach, a fairy tale's puppets.
  for (const [genres, crafts] of GENRE_CRAFTS) if ((day.genre && genres.includes(day.genre)) || (day.genres ?? []).some((g) => genres.includes(g))) out.push(...crafts);
  return [...new Set(out)];
}

/** The first of their crafts among some trades, or none: a day's crafts count once, however many of them somebody loves. */
export function lovedCraft(person: Pick<Person, 'interests'>, crafts: readonly string[]): string | undefined {
  const theirs = person.interests ?? [];
  return crafts.find((id) => theirs.includes(id));
}

/**
 * What of somebody's a day's work is: television or film for a screen job,
 * theater for the stage, voice acting for a voice job, travel for a job
 * away, and the job's genre if it's among theirs. A commercial's product
 * spoke to an interest too from 2026-09-28 (a car for Cars, a campaign for
 * Politics), until the commercials went with the career on 2026-10-09.
 */
export function lovedInWork(person: Pick<Person, 'interests' | 'genres'>, day: WorkDay): string[] {
  const theirs = person.interests ?? [];
  const out: string[] = [];
  const medium = day.medium === 'stage' ? 'theatre' : day.medium === 'voice' ? 'voice_acting' : day.after === 'tv' ? 'television' : day.after === 'film' ? 'film' : undefined;
  if (medium && theirs.includes(medium)) out.push(medium);
  if (day.away && theirs.includes('travel')) out.push('travel');
  if (day.genre && (person.genres ?? []).includes(day.genre)) out.push(day.genre);
  // A play's kinds of story (from 2026-10-09, `genresOfPlay`): the first they love.
  const kind = (day.genres ?? []).find((g) => g !== day.genre && (person.genres ?? []).includes(g));
  if (kind) out.push(kind);
  const craft = lovedCraft(person, craftsOf(day));
  if (craft) out.push(craft);
  return out;
}

/** What each loved thing about a day's work gives the mood and takes off the stress: SLATE's estimate. */
export const LOVED_WORK = { mood: 1.5, relief: 1.5 } as const;

/**
 * How somebody's disposition takes the work, SLATE's estimate: an audition in
 * the room is up to 4 points of stress more for the most introverted and 4
 * less for the most extraverted; a day away from home up to 2 of morale
 * either way by openness; a day of rehearsal up to 2 either way by
 * agreeableness. Fifty is neither.
 */
export const DISPOSED = { room: 4, away: 2, rehearsal: 2 } as const;
// From 2026-10-09 `room` is a house or a class watching a performance, and `away` new work as well as the road.

const lean = (axis: number | undefined) => ((axis ?? 50) - 50) / 50;

/** A day's work, enjoyed or not: the loved things in it, the road by openness, and a rehearsal by agreeableness. */
export function enjoyWork(person: Person, day: WorkDay): void {
  const w = person.wellbeing;
  const loved = lovedInWork(person, day).length;
  let mood = loved * LOVED_WORK.mood;
  if (day.away || day.novel) mood += DISPOSED.away * lean(person.personality?.openness);
  if (day.rehearsal) mood += DISPOSED.rehearsal * lean(person.personality?.agreeableness);
  w.morale = clamp(w.morale + mood, 0, 100);
  w.stress = clamp(w.stress - loved * LOVED_WORK.relief, 0, 100);
}

/**
 * What a turn in the career or at school does to the mood and the stress,
 * SLATE's estimate: a booking or an agency is a lift, being let go or
 * replaced a blow, a dismissal the worst of them and the degree the best.
 * Morale moves by the temperament's swing, stress by how it gains. Until
 * 2026-09-27 none of them moved anything, and the only work that touched
 * the mood was a day of it.
 */
export const TURNS = {
  booked: { morale: 6, stress: -2 },
  signed: { morale: 8, stress: -3 },
  pickedUp: { morale: 6, stress: -2 },
  graduated: { morale: 12, stress: -6 },
  concern: { morale: -3, stress: 3 },
  recast: { morale: -5, stress: 3 },
  canceled: { morale: -6, stress: 3 },
  warning: { morale: -6, stress: 6 },
  dropped: { morale: -8, stress: 6 },
  replaced: { morale: -10, stress: 8 },
  dismissed: { morale: -20, stress: 15 },
} as const;

/** A turn, felt. */
export function feel(person: Person, turn: keyof typeof TURNS): void {
  const w = person.wellbeing;
  const { morale, stress } = TURNS[turn];
  w.morale = clamp(w.morale + morale * personalityOf(person, 'moraleSwing'), 0, 100);
  w.stress = clamp(w.stress + (stress > 0 ? stress * personalityOf(person, 'stressGain') : stress), 0, 100);
}

/**
 * A house, or a class, watching: taken as the disposition takes it, up to 4 of stress either way by extraversion
 * (`DISPOSED.room`). Read at every performance's nerves (`nerves` in `systems/attributes.ts`), from 2026-10-09;
 * until then it was an audition in the room (`takeTheRoom`), and with a casting office for somebody who loved Casting.
 */
export function takeTheHouse(person: Person): void {
  const w = person.wellbeing;
  w.stress = clamp(w.stress - DISPOSED.room * lean(person.personality?.extraversion), 0, 100);
}

/** Some trades met outside a day's work (the casting room, an improv class, the finished work seen): one loved among them lifts as a day's does. */
export function enjoyCrafts(person: Person, crafts: readonly string[]): boolean {
  if (!lovedCraft(person, crafts)) return false;
  const w = person.wellbeing;
  w.morale = clamp(w.morale + LOVED_WORK.mood, 0, 100);
  w.stress = clamp(w.stress - LOVED_WORK.relief, 0, 100);
  return true;
}
