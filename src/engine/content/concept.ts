/**
 * SLATE — what a thing is before anybody writes it, and the machine underneath it.
 *
 * This is the front of the pipeline, and until now the build had nothing here at
 * all. A picture went title → Film or Television → greenlight, and at no point did
 * anything ask what the thing actually was. The parts were laid out from a runtime
 * and named `Lead 1` and `Support 2` because there was nothing to lift them off.
 *
 * ## The one idea this file is built on
 *
 * A film concept has to be one complete story. A television concept has to be a
 * machine that makes stories — a **story engine**, which the craft defines as "the
 * collection of consistent elements that allow that show to feel both similar and
 * different at the same time". It is not a plot. It is the mechanism that produces
 * plots, week after week, and a television premise that has not got one is refused
 * in the room rather than made badly.
 *
 * So the engine is the load-bearing part of a concept, and this file is mostly a
 * table of engines.
 *
 * ## The three renewals, which is the thing worth knowing
 *
 * Every engine in the craft literature reduces to one of three sources of trouble,
 * and the difference between them is whether the engine can run forever:
 *
 *   **arrives**    — a case, a patient, a monster comes in. The supply is outside
 *                    the show, so it never runs out.
 *   **unresolved** — people stuck together, or a want that can never quite be
 *                    satisfied. Renewable because the situation never resolves.
 *   **revealed**   — a secret coming out, or a person becoming somebody else.
 *                    **This one has a fuel gauge.** When the secret is spent or the
 *                    transformation is finished, the engine is done.
 *
 * `carries` is that fuel gauge, in parts. A renewable engine leaves it undefined.
 * That single field is what makes a miniseries a different object from a returning
 * series rather than a different word for one.
 *
 * ## Why tone lives inside an engine and not beside it
 *
 * A concept is usually described as four things — the world, the people, the engine
 * and the tone. Tone is here as a property of each engine rather than as a fourth
 * choice, because the craft lists "clear tone and narrative rules" as one of the
 * five *components of an engine*: the tone sets what an audience expects and the
 * rules decide what the show is allowed to do. Making it a separate field the player
 * picks would have produced a word nothing reads, which is the one thing this
 * project does not ship.
 *
 * ## What reads all of this
 *
 * Three things, and they are the reason this is a system rather than a form:
 *
 *   - **The engine decides what the thing can be made as.** A transformation ends,
 *     so it cannot carry a returning series. A case of the week never ends, so it
 *     can. `world/concept.ts` refuses the greenlight otherwise.
 *   - **`carries` caps how much of it there can be.** A plan that delivers more
 *     parts than the engine has fuel for is refused with the number.
 *   - **`leastPeople` is the web of characters.** Television runs on an ensemble,
 *     not a lead, and an engine that needs four people will not run on two.
 *
 * And one more, in `world/making.ts`: a concept says where it is set, and the unit
 * works out of that city. That field existed and was never asked — every picture
 * shot out of the lot's own town because nothing else ever wrote it.
 */

/**
 * Where a story engine gets its next episode from.
 *
 * The distinction that matters is not the label but whether the source is outside
 * the show. `arrives` and `unresolved` are renewable; `revealed` is spent as it is
 * used, and a show built on one is running down a tank from its first episode.
 */
export type Renewal = 'arrives' | 'unresolved' | 'revealed';

/**
 * How much of a thing there is, and whether it comes back.
 *
 * Not a runtime and not an episode count — the shape of the commitment. A feature
 * is `single`; a limited series is `closed`; a show that keeps being made is
 * `returning`. Every plan declares one and every engine says which it can sustain.
 */
export type Cadence = 'single' | 'closed' | 'returning';

export interface StoryEngine {
  /** Stable id. Saved on the project, so renaming one costs a migration. */
  id: string;
  /** Title Case, for a screen. */
  label: string;
  /** What this engine is, said to somebody choosing it. */
  what: string;
  /** The question it answers every week, in the words a writer would use. */
  asks: string;
  /** Where the next episode comes from. */
  renewal: Renewal;
  /**
   * Parts of fuel before the engine is spent, where it can be spent.
   *
   * Undefined means renewable. A number means the engine is a tank: a
   * transformation finishes, a secret comes out, and after that the show is still
   * on and the machine that made it is not. The figures are SLATE's own, set from
   * the shape of the thing rather than measured — a transformation is a long
   * arc and a withheld secret is a short one.
   */
  carries?: number;
  /** The cadences this engine can honestly sustain. */
  cadences: readonly Cadence[];
  /**
   * The smallest ensemble it runs on.
   *
   * Television is "many little ones" rather than one long story, and it needs "a
   * web of characters" to generate them. An engine that turns on people rubbing
   * against each other cannot do it with two.
   */
  leastPeople: number;
  /**
   * The tone and the narrative rules this engine sets.
   *
   * One of the five components of an engine, and the reason tone is not a separate
   * question: the tone tells an audience what to expect and the rules tell the
   * writers what the show is allowed to do.
   */
  rules: string;
}

/**
 * The engines, as the craft names them.
 *
 * Six, and they are not invented here — they are the six a survey of the writing
 * literature names, with the renewal each one actually has worked out from where its
 * stories come from. The `carries` figures are SLATE's own.
 */
export const ENGINES: readonly StoryEngine[] = [
  {
    id: 'case',
    label: 'A Case Every Week',
    what: 'Something new comes through the door each week and these people deal with it. '
      + 'A crime, a patient, a client, a monster.',
    asks: 'What came in this week?',
    renewal: 'arrives',
    cadences: ['returning', 'closed'],
    leastPeople: 3,
    rules: 'It is solved by the end and the people go back to how they were. '
      + 'What changes across a season is them, slowly, and never the job.',
  },
  {
    id: 'ensemble',
    label: 'People Who Cannot Get Away From Each Other',
    what: 'A group who would not choose each other are stuck in one place, and the '
      + 'friction between them is the show.',
    asks: 'What set them off this week?',
    renewal: 'unresolved',
    cadences: ['returning', 'closed'],
    leastPeople: 4,
    rules: 'Nobody may leave and nobody may be satisfied. The moment one of them gets '
      + 'what they want the engine loses a cylinder.',
  },
  {
    id: 'dilemma',
    label: 'A Question With No Right Answer',
    what: 'Every week puts the same moral problem in a new shape and makes one of them '
      + 'choose, and neither choice is clean.',
    asks: 'What would you have done?',
    renewal: 'unresolved',
    cadences: ['returning', 'closed'],
    leastPeople: 3,
    rules: 'It never rules on the question. A week that answers it is a week '
      + 'that has spent something it cannot get back.',
  },
  {
    id: 'realities',
    label: 'A Different World Each Time',
    what: 'Its premise lets the show visit somewhere new whenever it likes — another '
      + 'place, another time, another version of these people.',
    asks: 'Where are we this week?',
    renewal: 'arrives',
    cadences: ['returning', 'closed'],
    leastPeople: 2,
    rules: 'How travel works is fixed and stated. A show that can go anywhere for '
      + 'any reason has no jeopardy anywhere.',
  },
  {
    id: 'transformation',
    label: 'One Person Becoming Another',
    what: 'One person is changing into a different person, and the show is the length '
      + 'of that change.',
    asks: 'How far gone are they now?',
    renewal: 'revealed',
    // A long arc. Sixty parts is five seasons at twelve, which is about as far as a
    // change can be drawn out before the audience stops believing it is still moving.
    carries: 60,
    cadences: ['closed', 'single'],
    leastPeople: 2,
    rules: 'It only goes one way and every episode must move it. Once they '
      + 'have become the other person the show is over, whatever the schedule says.',
  },
  {
    id: 'serial',
    label: 'One Long Story, Told In Pieces',
    what: 'A single story too big for one sitting, with something withheld that the '
      + 'audience is waiting to find out.',
    asks: 'What do we learn this week, and what is still being kept from us?',
    renewal: 'revealed',
    // Shorter than a transformation, because withheld information is spent faster
    // than a character arc: the audience is owed an answer and patience is finite.
    carries: 24,
    cadences: ['closed'],
    leastPeople: 3,
    rules: 'Every episode pays out a little and withholds more. The day there is '
      + 'nothing left to withhold the engine has run dry.',
  },
];

export const ENGINE_BY_ID: Readonly<Record<string, StoryEngine>> = Object.fromEntries(
  ENGINES.map((one) => [one.id, one]),
);

export const engineById = (id: string | undefined): StoryEngine | undefined =>
  (id === undefined ? undefined : ENGINE_BY_ID[id]);

/** The engines that can sustain a given shape of commitment. */
export const enginesFor = (cadence: Cadence): readonly StoryEngine[] =>
  ENGINES.filter((one) => one.cadences.includes(cadence));

/** What a cadence is called on a screen. */
export const CADENCE_LABEL: Readonly<Record<Cadence, string>> = {
  single: 'One Complete Thing',
  closed: 'A Run That Ends',
  returning: 'Something That Keeps Coming Back',
};

/** What a renewal is called on a screen, and why it matters. */
export const RENEWAL_SAID: Readonly<Record<Renewal, string>> = {
  arrives: 'The next one walks in the door, so it never runs out.',
  unresolved: 'None of this can be settled, so it never runs out.',
  revealed: 'It is spending something as it goes, and there is a bottom to it.',
};

/**
 * The most parts anything can be, whatever engine is under it.
 *
 * A ceiling on the renewable engines as well, because "forever" is not a number a
 * greenlight can be checked against and a plan asking for four hundred parts is a
 * mistake rather than an ambition.
 */
export const MOST_PARTS = 200;
