/**
 * SLATE — the shape of a line.
 *
 * Every line the world says is an entry: a stable id, the text, who says it
 * and in what role, where it belongs (section, purpose, beat), the
 * conditions under which it is true, and how it may follow another. A line
 * has no effects: it describes what a validated command has already done,
 * and the command decides. Entries live in chunks, one per section, loaded
 * apart from the interface and never copied into a save; a save keeps only
 * which ids it has heard.
 */

export type DialogueSpeaker = 'npc' | 'narrator';

/** The voice a person answers in. Read from who they are, never rolled. */
export type DialogueTone = 'warm' | 'dry' | 'guarded' | 'firm' | 'any';

export interface DialogueConditions {
  /** The outcome the line answers: good, flat, bad; accepted, refused… */
  result?: readonly string[];
  /** The move or choice it answers. */
  move?: readonly string[];
  /** Speaker tones it suits. Absent means any. */
  tone?: readonly DialogueTone[];
  minChemistry?: number;
  maxChemistry?: number;
  /** Things the speaker must know about the player: 'bought', 'walked', 'drove', 'stood_up'. */
  requires?: readonly string[];
  /** Things the speaker must not know. */
  forbids?: readonly string[];
  /** Context flags that must be set: 'late', 'first_visit', 'levers'. */
  flags?: readonly string[];
}

export interface DialogueLine {
  id: string;
  text: string;
  language: 'en';
  speaker: DialogueSpeaker;
  /** Whose line it is: 'date', 'salesperson', 'trainer', 'world'. */
  role: string;
  section: string;
  purpose: string;
  beat: string;
  when?: DialogueConditions;
  /** Relative frequency among eligible lines; 1 by default. */
  weight?: number;
  /** Not said again within this many days of the same save. */
  cooldownDays?: number;
  /** Ids of lines that may follow this one. Validated. */
  followUps?: readonly string[];
  version: number;
}

/** What the code asks a chunk for, written down so coverage is checked without running it. */
export interface DialogueExpectation {
  purpose: string;
  beat?: string;
  result?: readonly string[];
  move?: readonly string[];
  tone?: readonly DialogueTone[];
  flags?: readonly string[];
  /** Facts the world will hand over when it asks; lines that require them must exist. */
  facts?: readonly string[];
}

export interface DialogueChunk {
  section: string;
  version: number;
  lines: readonly DialogueLine[];
  expects: readonly DialogueExpectation[];
}

/** What the world knows at the moment of speaking. Read, never rolled. */
export interface DialogueContext {
  tone?: DialogueTone;
  result?: string;
  move?: string;
  chemistry?: number;
  facts?: readonly string[];
  flags?: readonly string[];
  /** Slot values: {first}, {car}, {ask}. */
  vars?: Readonly<Record<string, string>>;
}

export interface DialogueQuery {
  section: string;
  purpose: string;
  beat?: string;
}

/** A short way to write a line inside a chunk. The id is built from its place. */
export function line(
  section: string, purpose: string, beat: string, key: string, text: string,
  opts: { role?: string; speaker?: DialogueSpeaker; when?: DialogueConditions; weight?: number; cooldownDays?: number; followUps?: readonly string[] } = {},
): DialogueLine {
  return {
    id: `${section}.${purpose}.${beat}.${key}`,
    text,
    language: 'en',
    speaker: opts.speaker ?? 'npc',
    role: opts.role ?? 'world',
    section,
    purpose,
    beat,
    when: opts.when,
    weight: opts.weight,
    cooldownDays: opts.cooldownDays,
    followUps: opts.followUps,
    version: 1,
  };
}
