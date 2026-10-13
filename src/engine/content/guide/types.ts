/**
 * SLATE — what an entry of the guide's reference says (from 2026-10-12; `content/guide/`).
 *
 * The chapters (`content/tutorial.ts`) are the required onboarding: read in order, each opening part of the game. The
 * reference is everything else a player asks once a part is open. Each entry covers one feature, by the stable ids the
 * game already uses: a command's kind, a screen's `ui.*` id, a look's `look.*` kind. Every id belongs to exactly one
 * entry (`tests/guide.test.ts`).
 *
 * Its figures come from the rules themselves. An entry's file imports the constants and writes them into its words, so
 * a change to a rule changes what the guide says when it next loads, and a guide figure can't drift from the rule
 * behind it. A figure that is an estimate, SLATE's own or a source's, says so (`Fact.estimate`).
 *
 * Reading the reference runs nothing. It issues no command, writes nothing to the save and moves no clock (`ui/guide/
 * Help.tsx`), and opening or reading it is tested to leave a save byte for byte as it was.
 */

/** A group on the contents page, by what the player is trying to do. */
export type GoalId = 'start' | 'day' | 'body' | 'school' | 'coursework' | 'productions' | 'craft' | 'money' | 'papers';

/**
 * How two features connect, from the first's side:
 * - `prerequisite`: the other has to be done or open first;
 * - `immediate`: doing this changes the other at once;
 * - `scheduled`: doing this puts something on the clock that reaches the other later;
 * - `evaluation`: this is read when the other is judged;
 * - `history`: this is kept in the other's record;
 * - `optional`: a related thing worth doing, not needed.
 */
export type ConnectionKind = 'prerequisite' | 'immediate' | 'scheduled' | 'evaluation' | 'history' | 'optional';

export interface Connection {
  /** The other entry's id. */
  to: string;
  kind: ConnectionKind;
  /** Why, in a sentence: what passes between them. */
  why: string;
}

/** A figure with its name, from the rules; `estimate` where the size is SLATE's or a source's, not the world's. */
export interface Fact {
  label: string;
  value: string;
  estimate?: boolean;
}

export interface GuideEntry {
  /** Stable: links, the address (`?help=`) and the contents use it. */
  id: string;
  title: string;
  goal: GoalId;
  /** The feature ids it covers: command kinds, `ui.*` ids and `look.*` kinds. Each belongs to one entry only. */
  covers: readonly string[];
  /** Other words a player might search for it by. */
  synonyms: readonly string[];
  /** Questions it answers, as a player would ask them. */
  questions: readonly string[];
  /** Where it is on screen. `route` is a screen's address, `tab` one of its sections (`ui/shell/sections.ts`). */
  where: { route: string; tab?: string; label: string };
  /** When it opens: the chapter, a term, a condition. */
  available: string;
  /** What it does and why use it, in a short paragraph: the first thing shown. */
  short: string;
  /** The steps, in order. */
  steps: readonly string[];
  /** What it needs before it can be done. */
  needs: readonly string[];
  /** Time and money. */
  costs: readonly Fact[];
  /** What the engine reads when it's done or judged. */
  reads: readonly Fact[];
  /** What changes at once. */
  now: readonly string[];
  /** What changes later, and when. */
  later: readonly string[];
  /** How to read what comes back. */
  interpret: readonly string[];
  /** Why it might not be available, in the refusal's own terms. */
  unavailable: readonly string[];
  /** Common mistakes, and how to recover. */
  mistakes: readonly string[];
  /** Other entries worth reading with it. */
  related: readonly string[];
  connections: readonly Connection[];
  /** A worked example, with its numbers from the rules. */
  example: { setup: string; steps: readonly string[]; result: string };
}

export interface Goal {
  id: GoalId;
  title: string;
  /** What the group is for, in a line. */
  lead: string;
}
