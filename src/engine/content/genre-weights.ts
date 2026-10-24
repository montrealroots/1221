/**
 * SLATE — what each work asks of the genres, and how much (from 2026-10-22, the owner's brief 22), read by
 * `systems/engagement.ts` (`resolveGenres` and the `requirementOf…` readers).
 *
 * Until brief 22 a work's genres were its tags, in the order they were written, the first carrying half the weight
 * where there were two or more (`ENGAGEMENT.weights.primary`, brief 21). The order of a list decided what a work
 * asked, and listed another way the same play asked something else. From brief 22 a work's requirement is stated here,
 * genre by genre, at the most precise level the game holds:
 *
 * - **a project** (a professional role reads its project's, `PROJECT_GENRES`, by the project's name), or **a role**
 *   where its part asks other than its project (`ROLE_GENRES`, by the template's id);
 * - **a play** (`PLAY_GENRES`, by its title), or **a part** in it where the part asks other than the play (`parts`);
 * - **a class scene** where the scene asks other than its play (`SCENE_GENRES`, by the scene's id).
 *
 * The most precise level that states a requirement states all of it: a part's own replaces its play's, not adds to
 * it. Where nothing is stated a level's tags are read evenly (the neutral fallback, for older content and a save's
 * castings), and a class scene's filed genre (`Scene.genre`, comedy, drama or tragedy, its register's) only where its
 * play names no genre: it's coarser than a play's kinds, so it never overrides them.
 *
 * Every weight here is **SLATE's design choice**, read from the material as the game has it (the play's story and
 * parts, the scene's summary, the breakdown's words), **not a researched or objective fact**. The weights in a set
 * may be on any scale; they're read as shares of their sum. A set names no genre beside one of its own kinds: that's
 * one demand said twice, and the reader would fold the broad genre into the kind (`resolveGenres`).
 * tests/b22-genre-weights.test.ts holds every set to it, and to genres the game has.
 *
 * `register` is the genre whose conventions a play is played in (`GENRE_REGISTER`, `sceneOfMaterial`): until brief 22
 * the first kind listed, by position; named here, the same genre each play had, so the order of a list decides nothing.
 * A class scene's register is its own filed genre, as before.
 *
 * What was reviewed and decided, play by play, is in docs/verification/career-genre-2026-10-22/genre-weights.md.
 */

import { catalogTitle } from './plays';

/** A requirement as stated: each genre's share, any nonnegative scale, read as shares of the sum. */
export type GenreWeights = Readonly<Record<string, number>>;

/** A stated requirement and why: SLATE's reading of the material. */
export interface Stated {
  weights: GenreWeights;
  why: string;
}

/**
 * A play's requirement, the genre whose register it's played in, and its parts' own where they differ. The Rep's
 * Seagull names no register: its material was read by none before brief 22, and the brief changes no register.
 */
export interface PlayGenres extends Stated {
  register?: string;
  parts?: Readonly<Record<string, Stated>>;
}

/**
 * The professional projects' requirements, by the project's name (`ProjectTemplate.project`): every role in one reads
 * it, unless `ROLE_GENRES` gives the role its own. Each project's tags name one genre and, beside it, its broad genre,
 * one demand said twice; Last Bus To Eastview names one.
 */
export const PROJECT_GENRES: Readonly<Record<string, Stated>> = {
  'A House On Calder Street': { weights: { domestic_drama: 1 }, why: 'A family in one house, the secret the brother kept and the sister says: a domestic drama, drama being its broad genre.' },
  'The Winter Ledger': { weights: { farce: 1 }, why: 'Two fiancées, two sets of books and one inn on one night: a farce, comedy being its broad genre.' },
  'The Calloway Files': { weights: { police_procedural: 1 }, why: 'An investigation episode of a network series: a police procedural, crime being its broad genre.' },
  'Gull Season': { weights: { psychological_thriller: 1 }, why: 'A drowning nobody tells the truth about: a psychological thriller, thriller being its broad genre.' },
  'Static On Route 9': { weights: { psychological_horror: 1 }, why: 'Two hosts hearing their own voices call in: a psychological horror, horror being its broad genre.' },
  'Paper Moons': { weights: { coming_of_age: 1 }, why: 'A brother not going back, a sister deciding whether to say so, one summer: a coming of age.' },
  'Last Bus To Eastview': { weights: { romantic_comedy: 1 }, why: 'Two strangers arguing through the night over a job abroad: a romantic comedy.' },
  // Brief 25's feature in Sydney (from 2026-10-23); until then nothing stated it, and its parts read their genres evenly.
  'Harbor Line': { weights: { conspiracy_thriller: 1 }, why: 'A cargo that vanished between two ports, and the people paid to keep it quiet: a conspiracy thriller, thriller being its broad genre.' },
  // The parts drawn from real productions (from 2026-10-23, brief 25's Module 2): each production's page names its genre
  // in its own words (`content/catalog.ts`), and the game's genres for them are its reading of those words.
  '9-1-1': { weights: { police_procedural: 0.5, disaster: 0.5 }, why: 'Its page calls it a procedural drama, and it’s named for the emergency number: half a police procedural, half a disaster story.' },
  'Abbott Elementary': { weights: { comedy: 1 }, why: 'Its page calls it a workplace comedy, so comedy is its genre.' },
  // The ways of working' own projects (from 2026-10-24, brief 25's Module 5); until then none was in the game. Each is
  // SLATE's reading of its story, as the others are.
  'Half Past Normal': { weights: { hangout: 1 }, why: 'Neighbors in one building whose business everyone hears through the ceiling: a hangout comedy.' },
  'Lantern Row': { weights: { childrens: 0.6, animated: 0.4 }, why: 'A ferret who sells lost things back at a night market, for children, and drawn: a children’s story first, animated second.' },
  'The Kite And The Crow': { weights: { adventure: 0.6, animated: 0.4 }, why: 'A crow who leaves the steeple after forty years to help a child with a kite: an adventure, and an animated film.' },
  'The Salt Road': { weights: { nordic_noir: 1 }, why: 'A Danish island, a harbormaster who knows every boat and lies about one: a Nordic noir, crime being its broad genre.' },
  'Iron Meridian': { weights: { science_fiction: 0.6, action: 0.4 }, why: 'A stone giant woken after a thousand years, deciding whose side it was built for: science fiction, with the action it ends in.' },
  'Tidewater: The Last Oyster Towns': { weights: { documentary: 1 }, why: 'The history of the Chesapeake’s oyster towns, narrated and reenacted: a documentary.' },
  'The Lamplighters': { weights: { musical: 0.6, historical_fiction: 0.4 }, why: 'The city’s lamplighters in 1899, the year the electric lights come, in songs and numbers: a musical, set in history.' },
  'Breakwater': { weights: { action: 0.6, heist: 0.4 }, why: 'A crew on the waterfront and a driver told there’d be no fighting: action first, around a heist.' },
  'The Glass Orchard': { weights: { psychological_thriller: 0.6, domestic_drama: 0.4 }, why: 'A family orchard kept solvent by a bookkeeper with two ledgers: a psychological thriller inside a family drama.' },
  'Northern Line': { weights: { romantic_drama: 1 }, why: 'An engineer who falls for the lead over a season of crossings and says nothing: a romantic drama.' },
  'Second Shift': { weights: { hangout: 1 }, why: 'A diner’s regulars and the night manager who keeps their secrets: a hangout comedy.' },
  'Six Rooms': { weights: { anthology: 0.5, mystery: 0.5 }, why: 'A new story in a new hotel each season, each around something someone hides: an anthology of mysteries.' },
  'A Light On Pell Street': { weights: { christmas: 0.5, romantic_comedy: 0.5 }, why: 'One December to save the last lamp shop, and the developer’s heir: a Christmas story and a romantic comedy.' },
};

/**
 * A role's own requirement, by its template's id, where its part asks other than its project. None does: each pair of
 * parts in a project (Nell and Callum, Tobias Marsh and Hester Vane, Wren and Ferris, Felix and Ivy) is the same story
 * from two sides, and each breakdown describes a part in its project's genre. Kept, read and tested empty, so a role
 * that differs can be given its own.
 */
export const ROLE_GENRES: Readonly<Record<string, Stated>> = {};

/**
 * The plays' requirements, by title as `content/plays.ts` writes it, and the Rep's Seagull's (`SEAGULL_2027`). Every
 * play the game gives kinds to is here; a new play has none.
 */
export const PLAY_GENRES: Readonly<Record<string, PlayGenres>> = {
  // The directors' thesis productions (`THESIS_PLAYS`).
  'Hedda Gabler': { weights: { domestic_drama: 1 }, register: 'drama', why: 'A marriage in one drawing room: a domestic drama, drama being its broad genre.' },
  'The Importance Of Being Earnest': {
    weights: { farce: 1, satire: 1 }, register: 'comedy',
    why: 'Wilde’s plot is farce (two invented Ernests, a handbag) and his talk is satire of the society it plays in, about evenly; comedy is the broad genre of both.',
    parts: { 'Lady Bracknell': { weights: { satire: 3, farce: 1 }, why: 'Lady Bracknell has little of the plot’s confusion and most of its satire: the interview, the handbag, the terminus.' } },
  },
  Woyzeck: { weights: { tragedy: 3, drama: 2 }, register: 'tragedy', why: 'A soldier’s tragedy told in short realist scenes: mostly tragedy, with the plain drama of its barracks and fairground.' },
  'Three Sisters': { weights: { tragicomedy: 3, drama: 2 }, register: 'drama', why: 'Chekhov’s mix of hope and loss, mostly tragicomedy, in the household drama of the Prozorovs.' },
  'Blood Wedding': {
    weights: { tragedy: 3, romantic_drama: 2 }, register: 'tragedy',
    why: 'A rural tragedy set off by a love the bride can’t give up: mostly tragedy, with a romantic drama at its heart.',
    parts: {
      'The Moon': { weights: { tragedy: 1 }, why: 'Lighting the killing, not the love story: the Moon belongs to the tragedy.' },
      'The Beggar Woman': { weights: { tragedy: 1 }, why: 'Death in the forest, the Beggar Woman is tragedy alone.' },
    },
  },
  'The Cherry Orchard': {
    weights: { tragicomedy: 1 }, register: 'tragicomedy',
    why: 'Chekhov called it a comedy; it plays as tragicomedy, comedy being tragicomedy’s broad genre.',
    parts: {
      Epikhodov: { weights: { comedy: 1 }, why: 'Epikhodov, “twenty-two misfortunes”, is the play’s clown: comedy without its sorrow.' },
      Charlotta: { weights: { comedy: 1 }, why: 'Charlotta’s conjuring and ventriloquism are the play’s comic turns.' },
    },
  },
  'Major Barbara': { weights: { satire: 3, political_drama: 2 }, register: 'comedy', why: 'Shaw’s comedy of ideas: satire of charity and the arms trade, and an argument over power that makes its last act a political drama.' },
  'Spring Awakening': { weights: { coming_of_age: 1 }, register: 'coming_of_age', why: 'Adolescents kept from the truth about themselves: a coming of age, drama being one of its broad genres.' },
  Ghosts: { weights: { domestic_drama: 1 }, register: 'drama', why: 'A mother, a son and the father’s legacy in one house: a domestic drama, drama being its broad genre.' },
  'The Wild Duck': { weights: { domestic_drama: 3, tragicomedy: 2 }, register: 'drama', why: 'A family in its attic, mostly domestic drama, its tragedy edged with comedy (Hjalmar’s self-pity, Relling’s lies for living); drama is the broad genre of the first.' },
  // The Shakespeare Repertory Project (`SHAKESPEARE_PLAYS`).
  'Twelfth Night': {
    weights: { romantic_comedy: 1 }, register: 'comedy',
    why: 'Viola, Orsino and Olivia: a romantic comedy, comedy being its broad genre.',
    parts: Object.fromEntries(['Malvolio', 'Sir Toby Belch', 'Sir Andrew Aguecheek', 'Maria', 'Fabian', 'Feste'].map((part) => [part, { weights: { comedy: 1 }, why: 'Malvolio gulled and the revels below stairs: comedy, without the romance.' }])),
  },
  'Measure For Measure': {
    weights: { tragicomedy: 1, political_drama: 1 }, register: 'tragicomedy',
    why: 'A problem play: a city’s law and the ruler who abuses it, political drama, ending in comedy’s marriages after tragedy’s threats, tragicomedy; about evenly.',
    parts: Object.fromEntries(['Pompey', 'Mistress Overdone', 'Lucio'].map((part) => [part, { weights: { comedy: 1 }, why: 'Vienna’s comic underworld, its bawds and its slanderer: comedy.' }])),
  },
  'The Winter’s Tale': {
    weights: { tragicomedy: 5, romance: 3, fairy_tale: 2 }, register: 'romance',
    why: 'Half tragedy (Leontes’ jealousy), half pastoral comedy: tragicomedy first, then the romance of the lost daughter and the fairy tale of the statue that wakes.',
    parts: Object.fromEntries(['Autolycus', 'The Clown', 'The Old Shepherd'].map((part) => [part, { weights: { comedy: 1 }, why: 'Rogue and rustics of the sheep-shearing: comedy.' }])),
  },
  Macbeth: {
    weights: { tragedy: 3, historical_drama: 1, supernatural: 1 }, register: 'tragedy',
    why: 'Mostly tragedy, with a Scottish history play’s kings and battles and the witches’ supernatural.',
    parts: Object.fromEntries(['The First Witch', 'The Second Witch', 'The Third Witch'].map((part) => [part, { weights: { supernatural: 7, tragedy: 3 }, why: 'Its supernatural: the witches’ prophecy is the tragedy’s spring.' }])),
  },
  'As You Like It': {
    weights: { romantic_comedy: 1 }, register: 'romantic_comedy',
    why: 'Rosalind and Orlando in Arden: a romantic comedy, comedy being its broad genre.',
    parts: { Touchstone: { weights: { comedy: 1 }, why: 'Touchstone, the court fool in the forest: comedy.' }, Audrey: { weights: { comedy: 1 }, why: 'Audrey, Touchstone’s goatherd: comedy.' } },
  },
  'Much Ado About Nothing': {
    weights: { romantic_comedy: 1 }, register: 'romantic_comedy',
    why: 'Beatrice and Benedick, Hero and Claudio: a romantic comedy, comedy being its broad genre.',
    parts: { Dogberry: { weights: { comedy: 1 }, why: 'Dogberry and the watch: comedy without the romance.' } },
  },
  'Julius Caesar': {
    weights: { tragedy: 5, political_drama: 3, historical_drama: 2 }, register: 'tragedy',
    why: 'Brutus’s tragedy first, in a political drama of conspiracy and persuasion, on Rome’s history.',
  },
  'A Midsummer Night’s Dream': {
    weights: { romantic_comedy: 3, fairy_tale: 2 }, register: 'comedy',
    why: 'Mostly the lovers’ romantic comedy (comedy its broad genre), in the fairies’ wood.',
    parts: {
      ...Object.fromEntries(['Bottom', 'Peter Quince', 'Francis Flute'].map((part) => [part, { weights: { farce: 1 }, why: 'Pyramus and Thisbe, as the mechanicals play it: farce.' }])),
      ...Object.fromEntries(['Oberon', 'Titania', 'Puck'].map((part) => [part, { weights: { fairy_tale: 3, romantic_comedy: 2 }, why: 'Mostly the fairy tale, the fairies’ spells working the lovers’ comedy.' }])),
    },
  },
  // Yale Rep's productions (`REP_PLAYS`).
  'A Doll’s House': { weights: { domestic_drama: 1 }, register: 'domestic_drama', why: 'A marriage and the door Nora shuts: a domestic drama, drama being its broad genre.' },
  'Uncle Vanya': { weights: { tragicomedy: 3, drama: 2 }, register: 'tragicomedy', why: 'Chekhov’s estate of wasted lives, mostly tragicomedy, in a plain household drama.' },
  Tartuffe: { weights: { satire: 1 }, register: 'comedy', why: 'Molière’s hypocrite: satire, comedy being its broad genre.' },
  'An Enemy Of The People': { weights: { political_drama: 1 }, register: 'political_drama', why: 'A doctor against his town over its poisoned baths: a political drama, drama being its broad genre.' },
  'The Playboy Of The Western World': { weights: { satire: 1 }, register: 'comedy', why: 'A village that makes a hero of a man who says he killed his father: satire, comedy being its broad genre.' },
  'Mrs Warren’s Profession': { weights: { social_realism: 1 }, register: 'drama', why: 'A daughter learning where her education came from: social realism, drama being its broad genre.' },
  'The Seagull': { weights: { tragicomedy: 3, drama: 2 }, why: 'As Uncle Vanya: Chekhov’s “comedy in four acts”, mostly tragicomedy, in the household drama of a summer estate.' },
  // The Summer Cabaret's one-acts (`SUMMER_PLAYS`).
  'Miss Julie': { weights: { tragedy: 3, drama: 2 }, register: 'drama', why: 'Strindberg’s “naturalistic tragedy”: mostly tragedy, played as the plain drama of one kitchen.' },
  Trifles: { weights: { drama: 3, mystery: 2 }, register: 'mystery', why: 'A murder solved in a kitchen by the women the men ignore: mostly their drama, with a mystery.' },
  'The Bear': { weights: { farce: 1 }, register: 'comedy', why: 'A duel that turns to a proposal: farce, comedy being its broad genre.' },
  'A Marriage Proposal': { weights: { farce: 1 }, register: 'comedy', why: 'A proposal lost in quarrels over land and dogs: farce, comedy being its broad genre.' },
  'Riders To The Sea': { weights: { tragedy: 1 }, register: 'tragedy', why: 'A mother losing her last son to the sea: tragedy.' },
  Salomé: { weights: { tragedy: 1 }, register: 'tragedy', why: 'Wilde’s Salomé: tragedy.' },
};

/** A play's stated requirement, by its title, its case and the catalog's aliases aside (The Proposal is A Marriage Proposal). */
export function playGenresOf(title: string | undefined): PlayGenres | undefined {
  if (!title) return undefined;
  return PLAY_BY_TITLE.get((catalogTitle(title) ?? title).toLowerCase());
}
const PLAY_BY_TITLE = new Map(Object.entries(PLAY_GENRES).map(([title, g]) => [title.toLowerCase(), g]));

/** The genre whose register a play is played in (`register`), or none. */
export const registerOfPlay = (title: string | undefined): string | undefined => playGenresOf(title)?.register;

/**
 * A class scene's own requirement, by its id, where the scene asks other than its play (`content/coursework.ts`). Three
 * of Julius Caesar's and two of A Midsummer Night's Dream's, each read from its summary. Every other scene reads its
 * play's, and a scene of a play with no kinds its filed genre.
 */
export const SCENE_GENRES: Readonly<Record<string, Stated>> = {
  'caesar-3-2': { weights: { political_drama: 6, tragedy: 3, historical_drama: 1 }, why: 'At the Forum, Brutus and Antony persuade a crowd: the play’s politics at their height.' },
  'caesar-2-1': { weights: { tragedy: 3, political_drama: 1 }, why: 'Brutus and Portia in the orchard: his private torment over the conspiracy, the tragedy’s heart.' },
  'caesar-4-3': { weights: { tragedy: 7, political_drama: 3 }, why: 'Two friends quarrel in the tent over money and honor, then Portia’s death and the ghost: the tragedy closing in.' },
  'dream-3-2': { weights: { romantic_comedy: 7, farce: 3 }, why: 'In the wood the lovers quarrel: the romantic comedy at its most farcical.' },
  'dream-5-1': { weights: { farce: 4, romantic_comedy: 1 }, why: 'Pyramus and Thisbe by the mechanicals, before the married lovers: farce.' },
};
