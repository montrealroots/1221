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
export type Discipline = 'writing' | 'directing' | 'producing' | 'showrunning' | 'acting' | 'running';

export const DISCIPLINES: readonly Discipline[] = [
  'writing', 'directing', 'producing', 'showrunning', 'acting', 'running',
];

export const DISCIPLINE_LABEL: Readonly<Record<Discipline, string>> = {
  writing: 'Writing',
  directing: 'Directing',
  producing: 'Producing',
  showrunning: 'Showrunning',
  acting: 'Acting',
  running: 'Running',
};

export interface GoatTrait {
  id: string;
  name: string;
  discipline: Discipline;
  /** What it is, in the words the game would use. */
  description: string;
}

export const GOAT_TRAITS: readonly GoatTrait[] = [
  // --- Writing ------------------------------------------------------------
  {
    id: 'goat_page', name: 'The Page', discipline: 'writing',
    description: 'Every draft is the draft. There is no version of it that is better than what you handed in.',
  },
  {
    id: 'goat_ear', name: 'The Ear', discipline: 'writing',
    description: 'Nobody in your pages has ever sounded like a person writing dialogue. Actors and actresses ask for your scripts by name.',
  },
  {
    id: 'goat_structure', name: 'Architecture', discipline: 'writing',
    description: 'You see the whole shape before a word is down, and it does not sag anywhere.',
  },

  // --- Directing ----------------------------------------------------------
  {
    id: 'goat_eye', name: 'The Eye', discipline: 'directing',
    description: 'You know where the camera goes before you have walked the room, and you are never wrong twice.',
  },
  {
    id: 'goat_performance', name: 'Gets The Performance', discipline: 'directing',
    description: 'Actors and actresses do work with you they have never done before and never do again.',
  },
  {
    id: 'goat_tone', name: 'Absolute Tone', discipline: 'directing',
    description: 'The thing feels like exactly one thing, all the way through, whatever it cost to keep it there.',
  },

  // --- Producing ----------------------------------------------------------
  {
    id: 'goat_material', name: 'Knows What It Is', discipline: 'producing',
    description: 'You can read a first draft and say what it will be worth in three years, and you are right.',
  },
  {
    id: 'goat_room', name: 'Never Blinks', discipline: 'producing',
    description: 'You hold the number. Everybody across the table knows you hold the number.',
  },
  {
    id: 'goat_delivers', name: 'It Gets Made', discipline: 'producing',
    description: 'Every single thing you have ever started has been finished and delivered.',
  },

  // --- Showrunning --------------------------------------------------------
  {
    id: 'goat_season', name: 'Holds The Season', discipline: 'showrunning',
    description: 'Twenty-two episodes, one shape, and episode nineteen is as good as episode one.',
  },
  {
    id: 'goat_room_lead', name: 'Runs The Room', discipline: 'showrunning',
    description: 'Nobody in your writers’ room has ever been afraid to say the bad idea, which is why the good ones arrive.',
  },

  // --- Acting -------------------------------------------------------------
  {
    id: 'goat_truth', name: 'Nothing Between You And It', discipline: 'acting',
    description: 'There is no performance. There is only somebody in a room to whom something is happening.',
  },
  {
    id: 'goat_range', name: 'No Ceiling On Range', discipline: 'acting',
    description: 'There is no part you cannot do, in any register, in any accent, at any age you could plausibly play.',
  },
  {
    id: 'goat_camera', name: 'The Camera Wants You', discipline: 'acting',
    description: 'Something happens between you and a lens that nobody has satisfactorily explained.',
  },
  // --- Running ------------------------------------------------------------
  {
    id: 'goat_gun', name: 'The Gun', discipline: 'running',
    description: 'Nobody has ever left the blocks with you. By ten meters the race is a formality, and everybody in the stadium already knows how it ends.',
  },
  {
    id: 'goat_last_ten', name: 'The Last Ten', discipline: 'running',
    description: 'Everybody else is slowing down at ninety meters. You are not, and that is the whole difference between a fast time and a record.',
  },
];

export const GOAT_TRAIT_BY_ID: Readonly<Record<string, GoatTrait>> =
  Object.fromEntries(GOAT_TRAITS.map((t) => [t.id, t]));

/** Every G.O.A.T. trait in one discipline. */
export function goatTraitsIn(discipline: Discipline): readonly GoatTrait[] {
  return GOAT_TRAITS.filter((t) => t.discipline === discipline);
}

/** What the chip says, everywhere it appears. */
export const GOAT_LABEL = 'G.O.A.T.';

/**
 * A position, and every scale the game keeps for it.
 *
 * The founder does five jobs and the game measures each of them differently:
 * acting on the 88-attribute performer sheet, producing on its own 21, and the
 * rest on skills. A position gathers all of it so the Character screen can
 * show every number that exists for that job in one place, rather than
 * scattering them across tabs that were built for different things.
 */
export interface Position {
  id: Discipline;
  name: string;
  /** The profession on the ladder, where there is one. */
  professionId?: string;
  /** Skill domains that belong to this job. */
  skillDomains: readonly string[];
  /** Groups of the performer sheet that belong to this job. */
  attributeGroups: readonly string[];
  /** Whether the producing instrument is read here. */
  producerSheet: boolean;
  /** Profession traits that belong to this job. */
  traitProfession?: string;
  /** Whether the general performer traits belong here. */
  performerTraits: boolean;
  /** Whether the producing traits belong here. */
  producerTraits: boolean;
}

export const POSITIONS: readonly Position[] = [
  {
    id: 'writing', name: 'Writing', professionId: 'writer',
    skillDomains: ['writing'], attributeGroups: [], producerSheet: false,
    traitProfession: 'writer', performerTraits: false, producerTraits: false,
  },
  {
    id: 'directing', name: 'Directing', professionId: 'director',
    skillDomains: ['directing', 'crew'], attributeGroups: [], producerSheet: false,
    traitProfession: 'director', performerTraits: false, producerTraits: false,
  },
  {
    id: 'producing', name: 'Producing', professionId: 'producer',
    skillDomains: ['producing', 'business'], attributeGroups: [], producerSheet: true,
    traitProfession: 'producer', performerTraits: false, producerTraits: true,
  },
  {
    id: 'showrunning', name: 'Showrunning', professionId: 'showrunner',
    skillDomains: ['executive'], attributeGroups: [], producerSheet: false,
    traitProfession: 'showrunner', performerTraits: false, producerTraits: false,
  },
  {
    id: 'acting', name: 'Acting',
    skillDomains: ['creator', 'general'],
    attributeGroups: ['Craft', 'Voice', 'Physical', 'Screen', 'Range', 'Professionalism', 'Industry'],
    producerSheet: false, traitProfession: 'creator', performerTraits: true, producerTraits: false,
  },
  {
    id: 'running', name: 'Running',
    skillDomains: ['athletics'],
    attributeGroups: [],
    producerSheet: false, traitProfession: 'creator', performerTraits: false, producerTraits: false,
  },
];

export const POSITION_BY_ID: Readonly<Record<string, Position>> =
  Object.fromEntries(POSITIONS.map((p) => [p.id, p]));
