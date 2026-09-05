/**
 * SLATE — the strike, and the year after it.
 *
 * ── What this is and is not ─────────────────────────────────────────────────
 *
 * The writers' strike in this game is INVENTED. It is not an account of any
 * real labour action, and nothing in this file reports what any real guild,
 * studio, union, executive or writer did, said, wanted or agreed to. Real
 * strikes in this industry have happened and are a matter of public record;
 * this is not one of them, and the game never claims otherwise.
 *
 * What is modelled is the shape of an aftermath: a long stoppage ends, and the
 * companies that were carrying debt and overhead through it are gone. That is
 * an ordinary consequence of a long stoppage in any industry. The specifics
 * below — how long, how many folded, what is left in the drawer — are the
 * game's own fiction, chosen because they make a playable opening.
 *
 * Every string here is written to be read by a player, and the save records
 * that this is invented so a screenshot of it can never be mistaken for
 * reporting.
 * ────────────────────────────────────────────────────────────────────────────
 */

export const STRIKE_IS_FICTION =
  'The strike in this game is invented for it. It is not an account of any real '
  + 'labour action, and no real guild, company or person said or did any of what '
  + 'follows.';

/** How the world explains itself on the first morning. */
export interface StrikeFact {
  id: string;
  headline: string;
  detail: string;
}

/**
 * The state of the industry the morning the player opens their doors.
 *
 * Each of these is something a system reads, not scene-setting: the empty
 * drawer sets how much material exists, the folded companies set how little
 * competition there is, the idle talent sets who will work and for what.
 */
export const AFTERMATH: readonly StrikeFact[] = [
  {
    id: 'length',
    headline: 'Nineteen Months',
    detail: 'The longest stoppage the business has had. Long enough that the things which were supposed to carry companies through it ran out.',
  },
  {
    id: 'companies_gone',
    headline: 'Every Other Production Company Is Gone',
    detail: 'Overhead does not stop for a strike. The independents went first, then the ones with debt, then the ones everybody assumed were too big. What is left are buyers with nothing to buy.',
  },
  {
    id: 'empty_drawer',
    headline: 'Nothing In The Drawer',
    detail: 'Nobody wrote anything for nineteen months, and everything written before it has been read by everybody. The material does not exist yet. Somebody has to commission it.',
  },
  {
    id: 'idle_talent',
    headline: 'Everybody Is Free',
    detail: 'Writers, actors, directors, crew, every department. People who have not taken a meeting in two years will take yours on opening day, because there is nobody else taking meetings.',
  },
  {
    id: 'hungry_buyers',
    headline: 'The Buyers Have Empty Schedules',
    detail: 'Networks and streamers have nineteen months of holes and shareholders asking about them. They will pay. They will also remember what you charged.',
  },
  {
    id: 'crews_scattered',
    headline: 'The Crews Have Scattered',
    detail: 'A grip does not wait nineteen months. They went into construction, into events, out of the state. Getting a unit together is a real problem again.',
  },
  {
    id: 'goodwill',
    headline: 'And Everyone Is Watching You',
    detail: 'You are the first one to open a door since it ended. What you pay the first writer you hire will be known by every writer in the business inside a week, and it will be the number they all quote back at you.',
  },
];

export const AFTERMATH_BY_ID: Readonly<Record<string, StrikeFact>> =
  Object.fromEntries(AFTERMATH.map((f) => [f.id, f]));

/**
 * What being the only shop in town is actually worth, and what it costs.
 *
 * A monopoly on production is not a cheat code. It means everybody will work
 * for you, and it means every failure is yours in public, every rate you set
 * becomes the rate, and there is nobody else to blame for what does not get
 * made. The game reads both halves.
 */
export const MONOPOLY = {
  /** Nobody else is commissioning, so anybody will read for you. */
  talentAvailability: 1,
  /** With no competing bidder, quotes start low and resentment accrues. */
  quoteFloor: 0.55,
  /** Buyers have holes to fill and little leverage. */
  buyerUrgency: 1.6,
  /** Every rate you set is the market rate, and it is watched. */
  ratesAreWatched: true,
  /**
   * What it costs. The industry is looking at one company, so a picture that
   * fails is not a picture that failed, it is the business failing.
   */
  scrutiny: 1.8,
} as const;

/**
 * What the player is told, once, on the first morning.
 *
 * Written as four beats rather than a paragraph, so the screen can lay them
 * out and so each one carries a single fact the game actually models: how long
 * it ran, what it did to the companies, what it did to the drawer, and where
 * that leaves the person reading it.
 */
export const OPENING_BRIEF: readonly string[] = [
  'Nineteen months. Long enough that the pictures already shot ran out, then the ones '
  + 'sitting in the drawer, then the drawer.',

  'Overhead does not stop for a strike. The independents went first. Then the ones '
  + 'carrying debt. Then the ones everybody assumed were too big to go. By the end there '
  + 'was nobody left on the other side of the table — buyers with schedules to fill, '
  + 'shareholders asking what was going in them, and not one company still trading.',

  'It is over now, and nobody wrote a word for nineteen months. Everything written before '
  + 'it has been read by everyone twice. There is no pile to option and no shelf to raid: '
  + 'whatever gets made next has to be caused to exist by somebody.',

  'Every writer, every actor, every director and every crew in the business is free on '
  + 'opening day, because there is nobody else for them to be busy for. You are the first '
  + 'one to open a door.',
];

/** The same, as one line, for anywhere that has room for a sentence and no more. */
export const OPENING_LINE =
  'Nineteen months of strike took every other production company with it. The buyers still '
  + 'have schedules to fill and nobody to fill them, and everybody in the business is free '
  + 'on opening day. Yours is the only door open.';
