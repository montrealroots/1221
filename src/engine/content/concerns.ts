/**
 * SLATE — what a genre's scenes are about, as an actor meets them: its concerns (from 2026-10-16, the owner's brief
 * "Complete Genre Differentiation And Prove Each Genre's Identity").
 *
 * Until then a genre was what its two practice briefs happened to share: the engine read nothing of the genre itself
 * but how well it was known and, for 41 genres, the techniques its scenes staged (`content/demands.ts`). Seven pairs of
 * briefs of different genres were the same in every number a take read (`docs/verification/genres-2026-10-16/`), and
 * 148 of the 149 genres had a nearer neighbor than their own second brief.
 *
 * A concern is a register the work is played in, not a technique and not a setting: the feeling kept under the
 * surface, the joke's rhythm, the period's manners, belief in a thing that isn't there. Each rests on an acting
 * principle (`principle`), from the project's acting research (`docs/research/attributes/research-acting-engine.json`)
 * or the genre's own (`research-genre-demands.json`). That the genre asks it is the claim in `content/genre-register.ts`,
 * genre by genre, with its confidence. How strongly, and through which abilities, is SLATE's design, read as a reader's
 * way of playing is (`READER_PLAYS`): a lean on the dimensions of the work and the abilities it draws on. Leans are
 * normalized, so a concern moves weight and never adds it: a mastered actor still comes to 100 in every genre, and a
 * concern makes no genre harder, only different.
 *
 * What a concern changes, for the player: which dimensions of a take count most, so which part of preparation pays
 * (`helps`), which abilities the take reads beyond the camera's own, so who comes out ahead and what a note names,
 * and which way of playing it leans toward, since a choice that leans the same way compounds with it.
 */

import type { AbilityId } from './abilities';
import type { Dimension } from './tasks';

export type Concern =
  | 'restraint' | 'sincerity' | 'heightened' | 'rhythm' | 'spontaneity' | 'exactness'
  | 'period' | 'invention' | 'extremity' | 'partnership' | 'tension' | 'stylized' | 'command';

export interface ConcernDef {
  /** Title Case, as the screen names it. */
  label: string;
  /** What it asks, in a sentence the player reads. */
  words: string;
  /** The acting principle it rests on, and where it's from. */
  principle: string;
  /** How it leans the work's dimensions (normalized: it moves weight, never adds it). */
  lean: Partial<Record<Dimension, number>>;
  /** The abilities it draws on, by dimension. */
  inputs: Partial<Record<Dimension, readonly { ability: AbilityId; weight: number }[]>>;
  /** The parts of preparation that answer it: those the dimensions it leans on read (`tests/genre-identity.test.ts`). */
  parts: readonly ('interpretation' | 'memorization' | 'rehearsal')[];
  /** Why those parts, in a sentence the player reads. */
  helps: string;
}

/**
 * Thirteen concerns. Each leans one dimension by 1.15 and at most one more by up to 1.1, and draws about eight tenths
 * of an ability's weight in all, the size of a reader's way of playing (`READER_PLAYS`, 1.15 and 0.5) and of a choice
 * of how to play (`APPROACH_EFFECT`, 1.2 to 1.25 and 1): a genre is about as much of a take as either. SLATE's sizes.
 */
export const CONCERNS: Readonly<Record<Concern, ConcernDef>> = {
  restraint: {
    label: 'Feeling Held In',
    words: 'The feeling is there and kept under: stillness, economy, what isn’t said carrying what is.',
    principle: 'Subtext, the life under the lines (Stanislavski, in the project’s acting research, topic 1); the genre claims are actors’ and critics’ accounts of contained, controlled performances.',
    lean: { consistency: 1.15, believability: 1.05 },
    inputs: { consistency: [{ ability: 'composure', weight: 0.5 }], believability: [{ ability: 'focus', weight: 0.3 }] },
    parts: ['memorization', 'rehearsal'],
    helps: 'Learning the lines and rehearsing on your feet: control comes from knowing it well enough to hold it still.',
  },
  sincerity: {
    label: 'Played Straight',
    words: 'Meant completely: the feeling played with full conviction, never winked at, however large or strange the material.',
    principle: 'Truth and belief, the “magic if” (Stanislavski, topic 1); the genre claims are advice to play sentiment, or absurdity, with complete earnestness.',
    lean: { believability: 1.15, connection: 1.05 },
    inputs: { believability: [{ ability: 'emotionalDepth', weight: 0.4 }], connection: [{ ability: 'presence', weight: 0.4 }] },
    parts: ['interpretation', 'memorization'],
    helps: 'The breakdown and the lines: believing it starts with knowing exactly what your character wants and why it matters to them.',
  },
  heightened: {
    label: 'Played Large',
    words: 'Feeling worn on the outside and sized to fill the frame: the voice and the body carry it as much as the face.',
    principle: 'Melodrama’s exaggerated emotion and silent film’s mime (Britannica, topic 10); Lecoq’s melodrama as a dramatic territory with its own structures in the body (topic 10).',
    lean: { execution: 1.15, connection: 1.1 },
    inputs: { execution: [{ ability: 'vocal', weight: 0.3 }, { ability: 'physical', weight: 0.3 }], connection: [{ ability: 'presence', weight: 0.3 }] },
    parts: ['rehearsal'],
    helps: 'Rehearsing on your feet: a size the body and the voice can carry has to be found aloud and standing.',
  },
  rhythm: {
    label: 'Comic Rhythm',
    words: 'Setup and payoff: cues picked up, pauses placed, the laugh landing where the timing puts it.',
    principle: 'Comic timing, the pauses, cadence and pacing that land a joke (the comedy genre’s claim, and Attardo and Pickering 2011 on timing in jokes, topic 10); Stanislavski’s tempo-rhythm (topic 9).',
    lean: { responsiveness: 1.15, execution: 1.1 },
    inputs: { responsiveness: [{ ability: 'adaptability', weight: 0.4 }], execution: [{ ability: 'focus', weight: 0.4 }] },
    parts: ['rehearsal'],
    helps: 'Rehearsing on your feet: timing lives in the exchange and is found by playing it through.',
  },
  spontaneity: {
    label: 'Caught Live',
    words: 'Behavior that looks unrehearsed: real listening, the next line taken from what the other person just did.',
    principle: 'Naturalism, the Moscow Art Theater’s and Stanislavski’s realistic acting (topic 10); the genre claims are non-professional casting, improvised dialogue and withheld scripts.',
    lean: { connection: 1.15, responsiveness: 1.1 },
    inputs: { connection: [{ ability: 'listening', weight: 0.5 }], responsiveness: [{ ability: 'adaptability', weight: 0.3 }] },
    parts: ['rehearsal'],
    helps: 'Rehearsing on your feet: what looks unrehearsed is found by playing it through until nothing is set but the wants.',
  },
  exactness: {
    label: 'Dense Text, Exact',
    words: 'A lot of words, or difficult ones, delivered fluently and at speed: jargon, argument or deduction as second nature.',
    principle: 'Fluency from memory (LAMDA’s criteria, topic 1); the genre claims are dense, fast dialogue mastered by repetition, memorized closing arguments and medical jargon drilled before the shoot.',
    lean: { execution: 1.15, interpretation: 1.05 },
    inputs: { execution: [{ ability: 'memory', weight: 0.5 }], interpretation: [{ ability: 'focus', weight: 0.3 }] },
    parts: ['memorization'],
    helps: 'Learning the lines: fluency at speed is the lines learned past knowing them.',
  },
  period: {
    label: 'Another Age’s Manners',
    words: 'How people of another time stood, moved, spoke and kept their place, kept up without looking like effort.',
    principle: 'Period movement, deportment and speech, assessed by LAMDA and taught by conservatories (topic 10); the genre claims are historical advisers and period voice and movement lessons.',
    lean: { execution: 1.1, interpretation: 1.1 },
    inputs: { execution: [{ ability: 'physical', weight: 0.3 }, { ability: 'vocal', weight: 0.2 }], consistency: [{ ability: 'discipline', weight: 0.3 }] },
    parts: ['interpretation', 'rehearsal'],
    helps: 'The breakdown and rehearsal together: the manners are researched first, then made habit on your feet.',
  },
  invention: {
    label: 'Belief In What Isn’t There',
    words: 'An invented world made concrete: the creature, the machine or the magic played as specifically as a cup of tea.',
    principle: 'Imagination and the “magic if” (Stanislavski, topics 1 and 9); the science-fiction claim, that playing against things not there takes imagination and specificity.',
    lean: { believability: 1.1, interpretation: 1.1 },
    inputs: { believability: [{ ability: 'imagination', weight: 0.5 }], interpretation: [{ ability: 'imagination', weight: 0.3 }] },
    parts: ['interpretation'],
    helps: 'The breakdown: the world’s rules have to be worked out before they can be believed.',
  },
  extremity: {
    label: 'States At The Limit',
    words: 'Fear, grief or exhaustion at their extreme, sustained, and believed though the threat is often not in the room.',
    principle: 'Emotional truth under extreme circumstances (topic 1); the genre claims are sustained fear, screaming and real reactions to absent threats, and grief pushed to extremes.',
    lean: { believability: 1.15, execution: 1.05 },
    inputs: { believability: [{ ability: 'emotionalDepth', weight: 0.5 }], execution: [{ ability: 'physical', weight: 0.3 }] },
    parts: ['memorization', 'rehearsal'],
    helps: 'The lines, then rehearsal on your feet: an extreme state has to be found in the body, on lines you no longer think about.',
  },
  partnership: {
    label: 'Played Between Two',
    words: 'The scene lives between the two of you: chemistry, contrast, a part each that only works against the other.',
    principle: 'Ensemble playing in place of the star turn (the realist stage, topic 10); the genre claims are chemistry reads, contrasting leads and a crew in which each actor must establish a distinct role.',
    lean: { connection: 1.15, responsiveness: 1.05 },
    inputs: { connection: [{ ability: 'presence', weight: 0.3 }, { ability: 'emotionalDepth', weight: 0.2 }], responsiveness: [{ ability: 'listening', weight: 0.3 }] },
    parts: ['rehearsal'],
    helps: 'Rehearsing on your feet: a partnership is built in the exchange, played through until each part answers the other.',
  },
  tension: {
    label: 'Suspense Held',
    words: 'A threat kept alive under every line: what’s at stake never dropped, even in the quiet.',
    principle: 'Concentration and the through-line (Stanislavski, topic 1); the genre claims are tension built by silence, close-ups and pacing, with the performance holding it.',
    lean: { consistency: 1.1, interpretation: 1.1 },
    inputs: { consistency: [{ ability: 'focus', weight: 0.5 }], responsiveness: [{ ability: 'listening', weight: 0.3 }] },
    parts: ['interpretation', 'rehearsal'],
    helps: 'The breakdown, then rehearsal: suspense is held by knowing at every moment what your character fears will happen, and keeping it alive through the scene.',
  },
  stylized: {
    label: 'The World’s Own Logic',
    words: 'A world with rules of its own, absurd, dreamlike or satirical, played wholeheartedly by them and never commented on.',
    principle: 'Stylised forms as dramatic territories (Lecoq, topic 10); Beckett’s exact timing and silence; Buñuel’s direction through outward gesture (the genre claims).',
    lean: { interpretation: 1.15, execution: 1.05 },
    inputs: { interpretation: [{ ability: 'imagination', weight: 0.4 }], execution: [{ ability: 'physical', weight: 0.4 }] },
    parts: ['interpretation'],
    helps: 'The breakdown: the world’s logic has to be found before it can be played as if it were sense.',
  },
  command: {
    label: 'Command Of The Frame',
    words: 'Status and threat carried in the body and the look more than the words: the person everyone in the room watches.',
    principle: 'Presence, one of the trained skills the acting schools name (topic 1); the genre claims are the gangster film’s tough, physically marked style and the western’s economy of words in close-up.',
    lean: { connection: 1.15, execution: 1.05 },
    inputs: { connection: [{ ability: 'presence', weight: 0.5 }], execution: [{ ability: 'physical', weight: 0.3 }] },
    parts: ['rehearsal'],
    helps: 'Rehearsing on your feet: status is found standing, in how little you need to move.',
  },
};

export const CONCERN_IDS = Object.keys(CONCERNS) as Concern[];

/**
 * How strongly a genre's register counts in a take: each concern's leans raised to `lean`, its abilities' weights times
 * `draw`, as strongly as the reading the player chooses counts (`BRIEF.readingLean`, `readingDraw`, both 2), so the
 * genre a scene is in and the way it's read weigh alike. Leans are normalized, so it moves weight and adds none. Measured
 * at 1, 2 and 3 (`tools/genre-identity.ts`, `docs/verification/genres-2026-10-16/`): at 1 a genre's register moved its
 * scenes less than a reader's way of playing did, and the genres stayed nearly as close as they were; 3 would make the
 * genre outweigh the reading. SLATE's size. Not frozen, so a measuring tool can set it for a run.
 */
export const CONCERN_STRENGTH = { lean: 2, draw: 2 };
