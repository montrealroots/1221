/**
 * SLATE — the once in a lifetime one.
 *
 * The founder is not a talented person who got lucky. They are the best writer
 * alive, the best director alive, the best producer alive, the best showrunner
 * alive and the best actor alive, at the same time, in one body, and the
 * industry knows it. Nobody has ever been all five. There is no evidence
 * anybody can be.
 *
 * So the instrument does not start low and climb. It starts at the ceiling of
 * every scale the game has — all 88 acting attributes, all 21 producing ones,
 * every skill in every domain — and every profession is already open and
 * already at its top level.
 *
 * There is no cheat mode in this build, because a cheat mode is for giving a
 * player something the game withheld, and this game withholds nothing about
 * what the founder can do. What it does not give them is a company that runs
 * itself, money that does not run out, or an industry that forgives. Being the
 * best there has ever been at making things is not the same as being able to
 * keep the lights on, and that gap is the entire game.
 */

/** The top of every scale in this game. */
export const CEILING = 100;

/**
 * The G.O.A.T. traits.
 *
 * One tier above every other trait in the game, and the founder holds all of
 * them at once. They are written to be compatible with each other on purpose:
 * an ordinary trait set is a set of trade-offs, and this is deliberately not
 * that. Nobody else in the world will ever hold one.
 *
 * Each names the discipline it is the greatest at, so the Character screen can
 * group them and so a system can ask "is this person the best living writer"
 * and get a real answer.
 */
export type Discipline = 'writing' | 'directing' | 'producing' | 'showrunning' | 'acting';

export const DISCIPLINES: readonly Discipline[] = [
  'writing', 'directing', 'producing', 'showrunning', 'acting',
];

export const DISCIPLINE_LABEL: Readonly<Record<Discipline, string>> = {
  writing: 'Writing',
  directing: 'Directing',
  producing: 'Producing',
  showrunning: 'Showrunning',
  acting: 'Acting',
};

export interface GoatTrait {
  id: string;
  name: string;
  discipline: Discipline;
  /** What it is, in the words the game would use. */
  description: string;
  /** What the industry says about it, which is not always admiring. */
  saidOfYou: string;
}

export const GOAT_TRAITS: readonly GoatTrait[] = [
  // --- Writing ------------------------------------------------------------
  {
    id: 'goat_page', name: 'The Page', discipline: 'writing',
    description: 'Every draft is the draft. There is no version of it that is better than what you handed in.',
    saidOfYou: 'People who have read four thousand scripts read yours and stop taking notes.',
  },
  {
    id: 'goat_ear', name: 'The Ear', discipline: 'writing',
    description: 'Nobody in your pages has ever sounded like a person writing dialogue. Actors ask for your scripts by name.',
    saidOfYou: 'They say your lines are the only ones that get easier the more times you say them.',
  },
  {
    id: 'goat_structure', name: 'Architecture', discipline: 'writing',
    description: 'You see the whole shape before a word is down, and it does not sag anywhere.',
    saidOfYou: 'Editors say there is nothing to cut, which they have never said about anything.',
  },

  // --- Directing ----------------------------------------------------------
  {
    id: 'goat_eye', name: 'The Eye', discipline: 'directing',
    description: 'You know where the camera goes before you have walked the room, and you are never wrong twice.',
    saidOfYou: 'Cinematographers who have shot for forty years ask how you saw it.',
  },
  {
    id: 'goat_performance', name: 'Gets The Performance', discipline: 'directing',
    description: 'Actors do work with you they have never done before and never do again.',
    saidOfYou: 'Three people have given the performance of their life for you. None of them can explain how.',
  },
  {
    id: 'goat_tone', name: 'Absolute Tone', discipline: 'directing',
    description: 'The thing feels like exactly one thing, all the way through, whatever it cost to keep it there.',
    saidOfYou: 'Nothing you have made has ever felt like it was made by a committee.',
  },

  // --- Producing ----------------------------------------------------------
  {
    id: 'goat_material', name: 'Knows What It Is', discipline: 'producing',
    description: 'You can read a first draft and say what it will be worth in three years, and you are right.',
    saidOfYou: 'Agents send you things before they send them anywhere.',
  },
  {
    id: 'goat_room', name: 'Never Blinks', discipline: 'producing',
    description: 'You hold the number. Everybody across the table knows you hold the number.',
    saidOfYou: 'Nobody has ever walked out of a room with you having got what they came for.',
  },
  {
    id: 'goat_delivers', name: 'It Gets Made', discipline: 'producing',
    description: 'Every single thing you have ever started has been finished and delivered.',
    saidOfYou: 'There is no picture with your name on it that fell apart. Not one.',
  },

  // --- Showrunning --------------------------------------------------------
  {
    id: 'goat_season', name: 'Holds The Season', discipline: 'showrunning',
    description: 'Twenty-two episodes, one shape, and episode nineteen is as good as episode one.',
    saidOfYou: 'Writers who have run their own rooms take staff jobs to be in yours.',
  },
  {
    id: 'goat_room_lead', name: 'Runs The Room', discipline: 'showrunning',
    description: 'Nobody in your writers’ room has ever been afraid to say the bad idea, which is why the good ones arrive.',
    saidOfYou: 'Four people who worked for you now run shows of their own and all of them say the same thing.',
  },

  // --- Acting -------------------------------------------------------------
  {
    id: 'goat_truth', name: 'Nothing Between You And It', discipline: 'acting',
    description: 'There is no performance. There is only somebody in a room to whom something is happening.',
    saidOfYou: 'Casting directors talk about a tape of yours from years ago the way people talk about a match they were at.',
  },
  {
    id: 'goat_range', name: 'No Ceiling On Range', discipline: 'acting',
    description: 'There is no part you cannot do, in any register, in any accent, at any age you could plausibly play.',
    saidOfYou: 'People have watched two of your performances and not realised it was the same person.',
  },
  {
    id: 'goat_camera', name: 'The Camera Wants You', discipline: 'acting',
    description: 'Something happens between you and a lens that nobody has satisfactorily explained.',
    saidOfYou: 'Directors say they cut to you because the frame is dead without you in it.',
  },
];

export const GOAT_TRAIT_BY_ID: Readonly<Record<string, GoatTrait>> =
  Object.fromEntries(GOAT_TRAITS.map((t) => [t.id, t]));

/** Every G.O.A.T. trait in one discipline. */
export function goatTraitsIn(discipline: Discipline): readonly GoatTrait[] {
  return GOAT_TRAITS.filter((t) => t.discipline === discipline);
}

/**
 * What the industry calls somebody who is all five.
 *
 * There is no established word for it because it has never happened, so the
 * business reaches for the ones it has.
 */
export const PRODIGY_NOTE =
  'Best living writer, best living director, best living producer, best living showrunner and '
  + 'best living actor, at once. Nobody has ever been two of those. The industry does not have a '
  + 'word for what you are, so it keeps using all five.';

/** How the world talks about them before they have done anything at this company. */
export const REPUTATION_PRECEDES: readonly string[] = [
  'Every agent in the business has your number and none of them expect you to answer.',
  'People who have never met you describe your work to each other at parties.',
  'A film school teaches a module on a thing you did when you were twenty-three.',
  'Two of the biggest actors alive have said publicly they would work for scale for you.',
  'The trades ran a piece on where you would land the week the strike ended.',
];
