/**
 * SLATE — what a course says about a piece shown (from 2026-10-20, the owner's brief 16, "Contextual Writing, Distinct
 * Voices, And Clear Information", and brief 17, "Final Comprehensive Writing And Continuity Pass"). Built from what
 * happened, said in the course's own voice, and varied over a long run.
 *
 * **What happened, why, and what to try.** A showing's words come from its facts (`ShowingFacts`): the band against the
 * course's last piece and its best, a run of strong work, the note and how it stands in the ledger (new, better, still
 * there, back after it was put right), what held a prepared piece back by the evaluation's own limits, the day's
 * condition, the partner's share. Each situation the record supports has its own shape (`situationOf`), and only the
 * facts that matter to it are said. Until brief 16 every result went through one formula: 381 of 868 showings in its
 * baseline began "It came together. Here’s what to try next." (docs/verification/voices-2026-10-20/before/).
 *
 * **A course's voice** (brief 17, section 4). Each course speaks in one of five voices (`VOICE_OF`), the same voice in
 * every situation, so the course a student meets each week is recognizable from what it says and how:
 * - `direct`: the result first, in short sentences; a repeat called a repeat; the next step an instruction.
 * - `warm`: what went well first; improvement counted as progress; a repeat met patiently; the next step an invitation.
 * - `exacting`: figures and specifics; improvement measured; what's still short, exactly; the next step a precise task.
 * - `patient`: unhurried; improvement as something building; a repeat as part of the work; the next step to explore.
 * - `brisk`: quick and practical; an achievement acknowledged and left; a repeat met with what to do now.
 * The voices are SLATE's, a course's and not its teachers': the card says so beside them ("The words are the game’s,
 * not the teachers’"), and no voice reproduces how a real person speaks. Each discipline's terms stay its own
 * (`disciplineOf`, `STEP`): acting of what's wanted, the other person and the choice; voice and speech of breath, sound and
 * clarity; movement of weight, coordination and stamina; text of the reading and its evidence. Until brief 17 a course's
 * voice was its discipline's alone, so Voice I and Speech And Accents I said the same things the same ways.
 *
 * **What's said, and when to stop** (brief 17, section 5). A part of the preparation is named as prose names it
 * (`partWords`: "your lines", "the work with your partner"), never by its card's label ("the note on Built On", found
 * in brief 17's baseline). A note given before isn't given again as new: it's said with what's changed and what's still
 * short, and the note's own words, already given, aren't repeated. A note's mark is said as the rule it is: a showing
 * with that part at three quarters puts the note right. Until brief 17 it read "the note is taken at 75%". A first
 * Strong, a best, and a strong piece despite a bad day are acknowledged and left there, with no step beyond: not every
 * success needs a next thing to fix. A prepared piece held back by an ability or the day hears what builds it, and the
 * step beyond only where nothing builds it; until brief 17 it heard both, "Meanwhile, try this:" before the step.
 *
 * **Grounded.** Nothing here says what the engine doesn't record. No moment of a performance is described: a limit is
 * named with what it cost, a strength with the preparation behind it, and a condition only where the evaluation counted
 * one. The step beyond is advice, said as a thing to try.
 *
 * **Varied, and remembered from the record.** Each situation has several ways to say it in each voice. Which one is said
 * is chosen without the game's randomness, from a hash of the piece and the day (`pick`), and the one chosen is the one
 * whose sentences' structures the course, or another of its discipline, said least lately (`recent`, read from the
 * feedback already in the save, newest last): dates and figures don't make a sentence new (brief 17, section 7). So the
 * memory is the record itself: it's as long as the saved feedback, a save and its reload choose the same words, and
 * nothing is added to the save. Where every way has been used lately, the one said longest ago comes back: a repeat
 * that's true, never a new claim that isn't.
 */

import type { Band } from './coursework';
import { ADVANCED, type NoteKind } from './learning';
import type { Skill } from '../content/school';

export type Discipline = 'acting' | 'voice' | 'movement' | 'text';

const VOICE_SKILLS: ReadonlySet<string> = new Set(['voice', 'speech', 'accents', 'singing']);
const BODY_SKILLS: ReadonlySet<string> = new Set(['movement', 'dance', 'combat', 'intimacy']);

/**
 * A course's discipline, by the skills it teaches: voice where every one is the voice's, text where it teaches the
 * script and no scene or character, movement where it teaches the body and no scene, and acting otherwise (the scene,
 * the classics, comedy, the camera, the audition). Acting Through Song, which teaches singing and emotion, is acting.
 */
export function disciplineOf(skills: readonly Skill[]): Discipline {
  if (skills.length > 0 && skills.every((s) => VOICE_SKILLS.has(s))) return 'voice';
  if (skills.includes('script') && !skills.includes('scene') && !skills.includes('character')) return 'text';
  if (skills.some((s) => BODY_SKILLS.has(s)) && !skills.includes('scene')) return 'movement';
  return 'acting';
}

/** The steps beyond a piece nothing held back (`learning.ts`'s `Challenge`), as each discipline says them. */
export type Step = 'stakes' | 'listening' | 'economy' | 'contrast' | 'text' | 'release' | 'precision';
export const STEP: Record<Discipline, Record<Step, string>> = {
  // Acting's are the steps as they were written for every course (`ADVANCED`), kept where they were written.
  acting: ADVANCED,
  voice: {
    release: 'Let the breath drop in before each new thought, rather than holding it to get to the end of the line.',
    precision: 'Choose one phrase and make every sound in it exact: where it begins, where it lands, and the same way twice.',
    stakes: 'Let what the words need decide the sound. Speak as though your listener has to understand you the first time.',
    listening: 'Tune to your partner’s sound before you answer, their pitch and their pace, and let your voice take something from it.',
    economy: 'Use less voice than you think you need. Find the lines the words carry on their own, and don’t push them.',
    contrast: 'Mark the turn with the breath: where the thought changes, let a new breath and a new pace change with it.',
    text: 'Go back to the words and say one image as if for the first time, letting its sounds do the work.',
  },
  movement: {
    release: 'Take it slower than feels safe, and let go of the holding you use to get through it. Let your weight drop.',
    precision: 'Make one movement exact: where it starts, where it ends, and the same path twice.',
    stakes: 'Let what it costs show in the body. Commit your weight to it before you feel sure.',
    listening: 'Move from your partner: take your next move from what their body gives you, not from the count you planned.',
    economy: 'Do less. Find the moments where stillness says enough, and let them stand.',
    contrast: 'Find where the impulse reverses, and let your weight and your tempo change with it.',
    text: 'Go back to the words and find one image to move from. Let the body find it before you think it through.',
  },
  text: {
    release: 'Present it without leaning on your notes. Trust what you know, and let the argument take its time.',
    precision: 'Make one claim exact: name the line it rests on, and say why in a sentence.',
    stakes: 'Ask what the play risks in this scene, and argue it from the text.',
    listening: 'Take your partner’s reading seriously, and answer it from the text before you defend yours.',
    economy: 'Say less. Choose the one piece of evidence that carries the reading, and let it stand.',
    contrast: 'Find where the argument turns, the line where what a character wants reverses, and what the text gives you for it.',
    text: 'Go back to the words. Find one image or repeated word your reading passes over, and see what it changes.',
  },
};

/** A course's voice (brief 17, section 4): see the module's comment. */
export type Voice = 'direct' | 'warm' | 'exacting' | 'patient' | 'brisk';

/**
 * Each course's voice, chosen so that two courses of one discipline in the same year don't share one: in the first year,
 * acting's three (Acting I, Play, Intimacy And Combat), voice's two (Voice I, Speech And Accents I), movement's two (The
 * Body As Source I, Alexander Technique I) and text's two (Text Analysis I, Text And Context) each differ. A course in a
 * sequence keeps its voice (Voice I to III, The Body As Source I and II). A course not named here speaks directly.
 */
export const VOICE_OF: Readonly<Record<string, Voice>> = {
  'Acting I': 'direct',
  'Voice I': 'warm',
  'Speech And Accents I': 'exacting',
  'The Body As Source I': 'patient',
  'Alexander Technique I': 'exacting',
  Play: 'warm',
  'Text Analysis I: The Actor’s Table Work': 'exacting',
  'Acting Intimacy And Combat For The Stage': 'brisk',
  'Text And Context Across The Repertory': 'patient',
  'Text Analysis II': 'exacting',
  'Acting II: Plays Of Extended And Heightened Language': 'exacting',
  'Voice II': 'warm',
  'Speech And Accents II': 'exacting',
  'The Body As Source II': 'patient',
  'Alexander Technique II Tutorials': 'exacting',
  Clown: 'warm',
  'Movement Invention II': 'brisk',
  'The Greeks': 'direct',
  'Play With Text': 'warm',
  'Advanced Principles Of Acting Stage Combat': 'brisk',
  'Singing II And Tutorials': 'warm',
  'Shakespeare Practicum': 'direct',
  Commedia: 'brisk',
  'Acting III': 'direct',
  'Voice III': 'warm',
  'Speech And Accents III': 'exacting',
  'Alexander Technique III Tutorials': 'patient',
  'You Are The Creator': 'patient',
  'Movement Invention III': 'brisk',
  'Acting Through Song': 'warm',
  'On-Camera Acting Technique': 'brisk',
  'Character Analysis And Movement': 'exacting',
  'Taming The Cyclops': 'brisk',
  'Professional Preparation And Audition Workshop': 'direct',
  'Actor Showcase': 'direct',
};
export const voiceOf = (course: string): Voice => VOICE_OF[course] ?? 'direct';

/**
 * A part of the preparation as prose names it, from its card's label (brief 17): the label is a heading on the card
 * ("Built On", "Daily Practice", "Its Context Researched"), and a sentence that names it ("the note on Built On") reads as
 * the engine's. Plural where a verb must agree. A label not here is said in lower case.
 */
const PART_WORDS: Readonly<Record<string, readonly [string, boolean?]>> = {
  'Knows The Play': ['knowing the play'], 'Knows The Scene': ['knowing the scene'], 'The Choreography Learned': ['learning the choreography'],
  'The Directions Understood': ['understanding the directions'], 'The Play Read': ['reading the play'], 'The Practice Learned': ['learning the practice'],
  'The Sequence Learned': ['learning the sequence'],
  Lines: ['your lines', true], 'Music And Words Learned': ['learning the music and the words'], 'The Text': ['learning the text'],
  Choices: ['your choices', true], 'Its Context Researched': ['researching its context'], 'Scansion And Table Work': ['the scansion and the table work', true],
  'Table Work': ['the table work'], 'The Analysis': ['the analysis'], 'The Score Made': ['making the score'], 'The Stakes And The Text': ['the stakes and the text', true],
  'The Turn Found': ['finding the turn'], Transcription: ['the transcription'], 'What It’s About': ['what it’s about'],
  Alone: ['rehearsing on your own'], 'Built On': ['building on the first round'], 'Daily Practice': ['the daily practice'], Drills: ['the drills', true],
  'On Its Feet': ['time on its feet'], 'Played Through': ['playing it through'], Practice: ['practice'], Rehearsal: ['rehearsal'],
  'Rehearsed In The Body': ['rehearsing it in the body'], 'Takes Recorded': ['recording takes'], 'The Score Recalled': ['recalling the score'],
  'Drilled With Your Partner': ['drilling it with your partner'], 'Played Together': ['playing it together'], 'Practiced Together': ['practicing it together'],
  'With Your Partner': ['the work with your partner'],
  'The Presentation Prepared': ['preparing the presentation'], 'Written Up': ['writing it up'],
};
export const partWords = (label: string): { words: string; plural: boolean } => {
  const w = PART_WORDS[label];
  return w ? { words: w[0], plural: Boolean(w[1]) } : { words: label.toLowerCase(), plural: false };
};

/**
 * A part of the preparation by what it is in every course, for a note the ledger counts across them (`noteKey`): the
 * ledger's rehearsal note is Voice I's daily practice, Speech's drills and The Body As Source's rehearsing in the body,
 * and "The daily practice has come up seven times now" (brief 17's first after-run) counted five courses' notes by one
 * course's name. A note given before is said by this, and the piece's own name for it after: the names the Your Notes
 * panel gives them (`noteSubject`), in prose. Revision is each piece's own (a presentation, a write-up), and has none.
 */
export const DIM_WORDS: Readonly<Record<string, readonly [string, boolean?]>> = {
  familiarity: ['knowing the material'], memorization: ['your lines', true], interpretation: ['your choices', true],
  rehearsal: ['rehearsal'], partner: ['the work with your partner'],
};

/** What a day's condition was, as the evaluation counted it (`Limit.what`), said as a clause. */
const CONDITION: Record<string, string> = {
  fatigue: 'you came to it tired',
  illness: 'you had the flu',
  injury: 'you were working injured',
  stamina: 'your stamina ran low',
  shaken: 'a slip shook you',
};

export interface ShowingFacts {
  /** What the choice of words is keyed on: the piece and the day. Never the game's randomness. */
  key: string;
  discipline: Discipline;
  /** The course's name, and the piece's title as its card says it. */
  course: string;
  piece: string;
  band: Band;
  bandLabel: string;
  /** The course's last piece shown before this one: its band, as said, and the day, as said. */
  prev?: { band: Band; label: string; on: string };
  /** This piece and the course's pieces shown just before it, Strong or better, in a row. */
  run: number;
  /** Better than every piece the course has shown before. */
  best: boolean;
  /** Strong or better, and the course's first piece to be (brief 17: a first breakthrough). */
  firstStrong?: boolean;
  /** How the note stands in the ledger (`recordNote`). */
  kind: NoteKind;
  /**
   * The note's own words (`noteText`); for the step beyond, the step itself, in the discipline's words. A new note on a
   * part carries its measure, as the card says it (“(Lines: 53% prepared.)”); a note given before doesn't, its figures
   * said by the lead.
   */
  note: string;
  /** What the note is about: a part of the preparation, an answer at the table, or the craft. The step beyond has none. */
  about?: 'part' | 'choice' | 'skill';
  /** What answers a note on a part of the preparation: the steps on the piece's card (`remedyWords`). */
  remedy?: string;
  /**
   * What held a prepared piece back, by the evaluation's limits (`chiefLimit`), its kind and what, and for an ability or a
   * technique the practice exercise that trains it, where one does (`exerciseFor`; none trains discipline or stamina).
   */
  held?: { words: string; kind: string; what: string; exercise?: string; again?: string };
  /** The day's condition where the evaluation counted one, and what it cost the whole. */
  condition?: { what: string; whole: number; words: string };
  /** The partner's share, where there was one: they lifted it, came less prepared, or slipped (covered or not). */
  partner?: { first: string; lifted: boolean; behind: boolean; slip?: { at: string; covered: boolean } };
  /** The note before, where there was one: when, in which course, how often, and when it was put right. */
  before?: { on: string; course: string; given?: number; taken?: string };
  /** A note on a part: the part's label, and how far it was prepared then and now (0 to 1). */
  part?: { label: string; then?: number; now?: number };
  /**
   * What the note is on, as prose names it: a part by what it is in every course (`DIM_WORDS`), the question for an answer
   * at the table, the skill in words. A note given before is said by it.
   */
  subject?: string;
  /** A part as this piece's card names it, in prose (`partWords`): what a new note is said by, and a repeat's "here". */
  here?: string;
  /** The way at a note that keeps coming back this piece was worked with (`APPROACHES`), by its label, where it was. */
  tried?: string;
  /** Given this often and still open (`LEARNING.persistent`): said short, with what's still open. */
  persistent: boolean;
  /** The part's mark for the note to be put right (`LEARNING.enough`). */
  enough: number;
  /** What this course said lately, and other courses of its discipline, newest last: the memory (`pick`). */
  recent: readonly string[];
}

export type Situation = 'first' | 'best' | 'maintained' | 'despite' | 'steady' | 'held' | 'plain' | 'new' | 'partial' | 'slipped' | 'recurring' | 'persistent';

const RANK: Record<Band, number> = { unready: 0, working: 1, strong: 2, exceptional: 3 };
/** What the day must have cost the whole, in points of 100, for a strong piece to be said as strong despite it. */
const DESPITE_POINTS = 2;
const strong = (b: Band) => RANK[b] >= RANK.strong;

/** Which of the brief's situations the record supports for this showing (brief 16, section 3; brief 17, section 5), the most specific first. */
export function situationOf(f: Pick<ShowingFacts, 'kind' | 'band' | 'prev' | 'run' | 'best' | 'condition' | 'before' | 'persistent' | 'held' | 'firstStrong'>): Situation {
  if (f.kind === 'advanced') {
    // Under Strong with no limit on the record: said as that, with nothing named as holding it (found by the guide's
    // smaller-piece example, a Working piece with no limits, where the first draft of this read a limit that wasn't there).
    if (!strong(f.band)) return f.held ? 'held' : 'plain';
    // Strong despite the day where the day cost two points or more of the whole (from 2026-10-20, brief 17): until then
    // half a point, so a long scene's stamina, a point of 100, read "Strong, though your stamina ran low", and stopped
    // a piece that nothing held back from hearing its next step.
    if (f.condition && f.condition.whole >= DESPITE_POINTS && CONDITION[f.condition.what]) return 'despite';
    if (f.firstStrong && f.prev) return 'first';
    if (f.best && f.prev && RANK[f.band] > RANK[f.prev.band]) return 'best';
    if (f.run >= 2) return 'maintained';
    return 'steady';
  }
  if (f.kind === 'partial') return 'partial';
  if (f.kind === 'recurring' && f.before?.taken) return 'slipped';
  if (f.kind === 'recurring') return f.persistent ? 'persistent' : 'recurring';
  return 'new';
}

/**
 * Whether the words carry a step beyond (brief 17): a first Strong, a best, and a strong piece despite the day are left
 * at the acknowledgment; a run of strong work hears the next step where it held the same band, and not where it rose;
 * a prepared piece held back hears what builds what held it, and the step only where nothing does.
 */
export function saysStep(f: ShowingFacts): boolean {
  const s = situationOf(f);
  if (s === 'maintained') return !f.prev || RANK[f.band] <= RANK[f.prev.band];
  if (s === 'held') return !heldAction(f);
  return s === 'steady' || s === 'plain';
}

// --- Choosing the words ---------------------------------------------------------------------------------------------

/** FNV-1a: the same key, the same number, on every machine and every load. */
export function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

const MONTH = '(?:January|February|March|April|May|June|July|August|September|October|November|December)';
/** A sentence's shape, as the memory compares it: dates, figures, counts and ordinals taken out, in lower case. */
export function shapeOf(sentence: string): string {
  return sentence
    .replace(new RegExp(`\\b${MONTH} \\d{1,2}, \\d{4}`, 'g'), 'DATE')
    .replace(/\d+(?:[.,]\d+)?%?/g, '#')
    .replace(/\b(?:first|second|third|fourth|fifth|sixth|seventh|eighth|ninth|tenth|\d+(?:st|nd|rd|th))\b/gi, 'NTH')
    .replace(/\b(?:one|two|three|four|five|six|seven|eight|nine|ten)\b/gi, 'N')
    .toLowerCase()
    .trim();
}
const sentencesOf = (text: string) => text.split(/(?<=[.!?])\s+(?=[A-Z“"(])/).filter((s) => /[a-z]/i.test(s));
/** A text's opening, as the memory compares it: its first sentence's shape. */
export function openingOf(text: string): string {
  return shapeOf(sentencesOf(text)[0] ?? '');
}

/**
 * One of several true ways to say a thing: of the options, in an order fixed by the key, the first whose sentences'
 * shapes (`shapeOf`) were said least lately, its opening counting double; among equals, the key's order. So a way whose
 * first sentence or whole frame was said in the last few showings comes after one that wasn't, whatever its dates and
 * figures (brief 17, section 7: until then the memory compared whole texts and openings, figures out, and a sentence
 * the course said last week with another date read as new). Where every way has been said lately, the one whose shapes
 * were said longest ago comes first.
 */
export function pick(options: readonly string[], key: string, recent: readonly string[]): string {
  const unique = [...new Set(options)];
  if (unique.length <= 1) return unique[0] ?? '';
  const start = hash(key) % unique.length;
  const order = unique.map((_, i) => unique[(start + i) % unique.length]!);
  // How lately each shape was said: the newest recent text is the last, so a later index is more recent.
  const lately = new Map<string, number>();
  const opens = new Map<string, number>();
  recent.forEach((r, i) => {
    sentencesOf(r).forEach((s) => lately.set(shapeOf(s), i + 1));
    opens.set(openingOf(r), i + 1);
  });
  const said = new Set(recent);
  const cost = (o: string) => {
    if (said.has(o)) return Number.MAX_SAFE_INTEGER;
    const shapes = sentencesOf(o).map(shapeOf);
    return shapes.reduce((n, s) => n + (lately.get(s) ?? 0), 0) + 2 * (opens.get(openingOf(o)) ?? 0);
  };
  let best = order[0]!;
  let least = cost(best);
  for (const o of order.slice(1)) { const c = cost(o); if (c < least) { best = o; least = c; } }
  return best;
}

// --- The words ------------------------------------------------------------------------------------------------------

const low = (s: string) => (/^(?:I\b|SLATE)/.test(s) ? s : `${s.charAt(0).toLowerCase()}${s.slice(1)}`);
const cap = (s: string) => `${s.charAt(0).toUpperCase()}${s.slice(1)}`;
const pct = (x: number) => `${Math.round(x * 100)}%`;
const ORDINAL = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
const ordinal = (n: number) => ORDINAL[n] ?? (() => { const t = n % 100; return `${n}${t >= 11 && t <= 13 ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] ?? 'th')}`; })();
/** "A" or "an" before an ordinal, by its sound: an eighth, an 11th, an 18th, an 80th (found reading brief 16's final runs: "A eighth time"). */
const aOrdinal = (n: number) => { const o = ordinal(n); return `${/^(?:eighth|11th|18th|8\d*th)$/.test(o) ? 'an' : 'a'} ${o}`; };
const COUNT = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const count = (n: number) => COUNT[n] ?? String(n);
const bands = (n: number) => (n === 1 ? 'a band' : `${count(n)} bands`);

/** What each discipline calls the work it judges, for the sentences that name it. */
const WORK: Record<Discipline, string> = { acting: 'the scene work', voice: 'the voice work', movement: 'the movement', text: 'the reading' };
/** What each discipline calls its craft, where a note is on a skill. */
const CRAFT: Record<Discipline, string> = { acting: 'your craft', voice: 'your vocal technique', movement: 'your physical technique', text: 'the skill behind your reading' };

const PLURAL: ReadonlySet<string> = new Set([...Object.values(PART_WORDS), ...Object.values(DIM_WORDS)].filter((w) => w[1]).map((w) => w[0]));
/** The note's subject and its verbs ("your lines are", "the table work is"): what it is everywhere, or (`local`) on this card. */
function topicOf(f: ShowingFacts, local = false): { t: string; is: string; was: string; has: string; it: string } {
  const t = (local ? f.here : undefined) ?? f.subject ?? f.here ?? 'this note';
  const plural = PLURAL.has(t);
  return { t, is: plural ? 'are' : 'is', was: plural ? 'were' : 'was', has: plural ? 'have' : 'has', it: plural ? 'they' : 'it' };
}

/** Where the note before was given: in this course, or another one. */
const whereOf = (f: ShowingFacts) => (f.before!.course === f.course ? '' : ` in ${f.before!.course}`);

/** The band against the course's last piece, where it moved: what happened, said first before a note. */
function movedLeads(v: Voice, f: ShowingFacts): string[] {
  const p = f.prev;
  if (!p || p.band === f.band) return [];
  const up = RANK[f.band] > RANK[p.band];
  const by = Math.abs(RANK[f.band] - RANK[p.band]);
  const b = f.bandLabel;
  switch (v) {
    case 'direct': return up ? [`Up from ${p.label}.`, `Up from ${p.label} on ${p.on}.`] : [`Down from ${p.label}.`, `Down from ${p.label} on ${p.on}.`];
    case 'warm': return up ? [`A step up from ${p.label} last time.`, `Better than the ${p.label} piece on ${p.on}.`] : [`Not as strong as the ${p.label} piece on ${p.on}.`, `A step down from ${p.label} last time.`];
    case 'exacting': return [`${up ? 'Up' : 'Down'} ${bands(by)}, from ${p.label} on ${p.on}.`, `${b}, ${up ? 'up' : 'down'} from ${p.label} on ${p.on}.`];
    case 'patient': return up ? [`It came out ${b}, up from ${p.label} on ${p.on}.`, `Up from ${p.label} last time.`] : [`It came out ${b}, down from ${p.label} on ${p.on}.`, `Down from ${p.label} last time.`];
    case 'brisk': return up ? [`Up from ${p.label} to ${b}.`, `${b}, up from ${p.label}.`] : [`Down from ${p.label} to ${b}.`, `${b}, down from ${p.label}.`];
  }
}

/** A new note on an answer at the table or a skill: that it's what held the piece back most, in the voice, before its own words. */
function newLeads(v: Voice, d: Discipline, f: ShowingFacts): string[] {
  const b = f.bandLabel;
  const high = strong(f.band);
  if (f.about === 'choice') {
    switch (v) {
      case 'direct': return high ? [`${b}, but one answer at the table doesn’t hold up.`] : ['One answer at the table held it back.', 'A choice the text doesn’t support held it back.'];
      case 'warm': return high ? [`${b}, with one reading at the table to look at again.`] : ['One reading at the table didn’t hold up, and that held it back.'];
      case 'exacting': return high ? [`${b}. One answer at the table isn’t supported by the text.`] : [d === 'text' ? 'The reading rests on one answer the text doesn’t support.' : 'The answer that held it back most is one the text doesn’t support.'];
      case 'patient': return high ? [`${b}, and one answer at the table is worth going back to.`] : ['One answer at the table held it back.'];
      case 'brisk': return high ? [`${b}. One answer at the table needs another look.`] : ['One answer at the table held it back.'];
    }
  }
  if (f.about === 'skill') {
    const area = CRAFT[d];
    switch (v) {
      case 'direct': return high ? [`${b}. ${cap(area)} can go further.`] : [`${cap(area)} held it back most.`];
      case 'warm': return high ? [`${b}, and ${area} has more to give.`] : [`What held it back most was ${area}, and that grows with time.`];
      case 'exacting': return high ? [`${b}. The next gain is in ${area}.`] : [`The limit here was ${area}.`];
      case 'patient': return high ? [`${b}. There’s more to find in ${area}.`] : [`What held it back most was ${area}.`];
      case 'brisk': return high ? [`${b}. Build ${area}.`] : [`${cap(area)} held it back.`];
    }
  }
  // A part's new note is run into its own words (`newPartLeads`).
  return [];
}

/**
 * A new note on a part, run into its own words (brief 17): the note's words name the part ("The lines weren’t secure,
 * so…"), so a lead that names it too ("Your lines held it back most. The lines weren’t secure…", brief 17's first
 * after-run) says it twice. A colon before words that have a colon of their own becomes a comma.
 */
function newPartLeads(v: Voice, f: ShowingFacts): string[] {
  const body = f.note;
  const first = body.split(/(?<=[.!?])\s+/)[0] ?? '';
  const colon = !first.includes(':');
  const run = (intro: string) => `${intro}${low(body)}`;
  if (strong(f.band)) {
    const b = f.bandLabel;
    switch (v) {
      case 'direct': return [run(`${b}. Still, `)];
      case 'warm': return [run(`Good work at ${b}. Even so, `)];
      case 'exacting': return [run(`${b}. Even so, `)];
      case 'patient': return [`${b}, and there’s still more to find. ${body}`, run(`${b}. Even so, `)];
      case 'brisk': return [run(`${b}. Still, `)];
    }
  }
  switch (v) {
    case 'direct': return [run(colon ? 'What held it back most: ' : 'Most of all, ')];
    case 'warm': return [run(colon ? 'The main thing this time: ' : 'Mainly, ')];
    case 'exacting': return [run(colon ? 'Where it fell short: ' : 'Above all, ')];
    case 'patient': return [run(colon ? 'What held this one back most: ' : 'More than anything, ')];
    case 'brisk': return [run(colon ? 'Main thing: ' : 'Chiefly, ')];
  }
}

/** A note better but not there. `dated`: the day was said just before (the band's move), so it's "then", not the day again. */
function partialLeads(v: Voice, f: ShowingFacts, dated = false): string[] {
  const p = f.part;
  const then = p?.then !== undefined ? pct(p.then) : undefined;
  const now = p?.now !== undefined ? pct(p.now) : undefined;
  const on = f.before!.on;
  // Since when, every way: the day of the note before, or "then" where the band's move has just said it.
  const since = dated ? 'then' : on;
  const sinceOn = dated ? 'then' : `on ${on}`;
  const { t, has } = topicOf(f);
  const fig = then && now;
  switch (v) {
    case 'direct': return fig ? [`Better since ${since}: ${t} went from ${then} to ${now}. Not there yet.`, `${cap(t)} ${has} moved since ${since}, ${then} to ${now}. Still short.`] : [`Better than ${sinceOn}, but not there yet.`];
    case 'warm': return fig ? [`Progress on ${t}: ${then} ${sinceOn}, ${now} now. It isn’t there yet.`, `${cap(t)} ${has} come on since ${since}, from ${then} to ${now}, though it isn’t all the way yet.`] : [`Progress since ${since}, though it isn’t all the way yet.`];
    case 'exacting': return fig ? [`${cap(t)}: ${then} ${sinceOn}, ${now} now. Short of the mark.`, `Up from ${then} to ${now} on ${t} since ${since}, and still short.`] : [`Better than ${sinceOn}, and still short.`];
    case 'patient': return fig ? [`${cap(t)} ${has} moved since ${since}, from ${then} to ${now}. It’s building, and it isn’t there yet.`, `Since ${since}, ${t} ${has} gone from ${then} to ${now}. Not all the way yet.`] : [`It’s been building since ${since}, and it isn’t there yet.`];
    case 'brisk': return fig ? [`${cap(t)}: up from ${then} to ${now} since ${since}. Keep at it.`, `From ${then} to ${now} on ${t} since ${since}. Not there yet.`] : [`Better than ${sinceOn}. Not there yet.`];
  }
}

function slippedLeads(v: Voice, f: ShowingFacts): string[] {
  const at = f.before!.taken!;
  const { t, has, was, it } = topicOf(f);
  switch (v) {
    case 'direct': return [`You fixed ${t} on ${at}, and ${it} ${has} slipped since.`, `${cap(t)} again: ${it} ${was} right on ${at}.`];
    case 'warm': return [`You’d got ${t} right on ${at}, and ${it} ${has} slipped since.`, `${cap(t)} came right on ${at}, and ${it} ${has} slipped back since.`];
    case 'exacting': return [`${cap(t)} ${was} put right on ${at}, and ${has} dropped back since.`];
    case 'patient': return [`${cap(t)} came right on ${at}, and ${it} ${has} slipped since. It’s worth going back to.`];
    case 'brisk': return [`${cap(t)} slipped. ${cap(it)} ${was} right on ${at}.`];
  }
}

/** A note given before, two or three times now: that it's the same note, when, and where. */
function againLeads(v: Voice, f: ShowingFacts): string[] {
  const b = f.before!;
  const n = (b.given ?? 1) + 1;
  const w = whereOf(f);
  const { t, is } = topicOf(f);
  if (n >= 3) switch (v) {
    case 'direct': return [`${cap(t)} again, the third note on it. The last was${w} on ${b.on}.`, `Third note on ${t}. The last was${w} on ${b.on}.`];
    case 'warm': return [`This is the third note on ${t}, the last${w} on ${b.on}. It’s worth staying with.`];
    case 'exacting': return [`A third note on ${t}. The last was${w} on ${b.on}.`];
    case 'patient': return [`${cap(t)} again, a third time, the last${w} on ${b.on}. It’s still the place to start.`];
    case 'brisk': return [`${cap(t)} again. That’s the third time, the last${w} on ${b.on}.`, `Third note on ${t}, the last${w} on ${b.on}.`];
  }
  switch (v) {
    case 'direct': return [`Same note as on ${b.on}${w}: ${t}.`, `${cap(t)} again, as on ${b.on}${w}.`];
    case 'warm': return [`${cap(t)} came up on ${b.on}${w} too, and ${is === 'are' ? 'they’re' : 'it’s'} still the thing to work on.`, `The note is still on ${t}, as on ${b.on}${w}.`];
    case 'exacting': return [`The same note as on ${b.on}${w}: ${t}.`];
    case 'patient': return [`Back to ${t}, as on ${b.on}${w}. It’s still the place to start.`];
    case 'brisk': return [`${cap(t)} again, same as on ${b.on}${w}.`];
  }
}

/** A note given often and still open: said short and named, with how many and when. */
function oftenLeads(v: Voice, f: ShowingFacts): string[] {
  const b = f.before!;
  const n = (b.given ?? 1) + 1;
  const w = whereOf(f);
  const { t, has } = topicOf(f);
  switch (v) {
    case 'direct': return [`${cap(t)}, for the ${ordinal(n)} time. The last note was${w} on ${b.on}.`, `${cap(aOrdinal(n))} note on ${t}. The last was${w} on ${b.on}.`];
    case 'warm': return [`${cap(t)} ${has} come up ${count(n)} times now, the last${w} on ${b.on}.`, `${cap(t)} again: that’s ${count(n)} notes, the last${w} on ${b.on}.`];
    case 'exacting': return [`Note ${n} on ${t}. The last was${w} on ${b.on}.`, `${cap(t)}: ${count(n)} notes now, the last${w} on ${b.on}.`];
    case 'patient': return [`This is the ${ordinal(n)} note on ${t}, the last${w} on ${b.on}. Some notes take longer than others.`, `${cap(aOrdinal(n))} note on ${t}, the last${w} on ${b.on}. It’s still the place to start.`];
    case 'brisk': return [`${cap(t)} again. That’s ${count(n)} notes, the last${w} on ${b.on}.`];
  }
}

/**
 * Where a part stands against the mark that puts its note right (`LEARNING.enough`), the rule said as a rule: a piece
 * shown with that part at three quarters or more puts the note right. Where the piece names the part otherwise than the
 * note does ("rehearsal" is Voice I's daily practice), it says so. `said`: the lead has just given the figure.
 */
function standing(v: Voice, f: ShowingFacts, said = false): string[] {
  const p = f.part;
  if (!p || p.now === undefined) return [''];
  const now = pct(p.now); const mark = pct(f.enough);
  const local = f.here && f.subject && f.here !== f.subject ? f.here : undefined;
  const it = local ? `Here that’s ${local}, ` : '';
  const at = said ? '' : local ? `${it}at ${now}.` : '';
  switch (v) {
    case 'direct': return said ? [`A piece shown with it at ${mark} or more puts the note right.`, `${mark} on a piece you show puts it right.`]
      : [`${at || `It’s at ${now}.`} A piece shown with it at ${mark} or more puts the note right.`, `${at || `It’s at ${now}.`} Show a piece with it at ${mark} or more, and the note is put right.`];
    case 'warm': return said ? [`Bring it to ${mark} before you show a piece, and the note is done.`, `At ${mark} on a piece you show, this note is done.`]
      : [`${at || `You’re at ${now} on it.`} Bring it to ${mark} before you show a piece, and the note is done.`, `${at || `It’s at ${now} now.`} At ${mark} on a piece you show, this note is done.`];
    case 'exacting': return said ? [`The note closes when a piece is shown with it at ${mark} or more.`]
      : [`${local ? `Here that’s ${local}: ${now}.` : `${p.label}: ${now}.`} The note closes when a piece is shown with it at ${mark} or more.`, `${local ? `Here that’s ${local}, at ${now}.` : `${p.label} is at ${now}.`} A showing at ${mark} or more closes the note.`];
    case 'patient': return said ? [`Once a piece is shown with it at ${mark} or more, the note is cleared.`, `When a piece you show has it at ${mark}, the note is cleared.`]
      : [`${at || `It’s at ${now} now.`} Once a piece is shown with it at ${mark} or more, the note is cleared.`, `${at || `It’s at ${now}.`} When a piece you show has it at ${mark}, the note is cleared.`];
    case 'brisk': return said ? [`${mark} on a piece you show and it’s done.`]
      : [`${at || `It’s at ${now}.`} Show a piece with it at ${mark} or more and the note is done.`, `${at || `It’s at ${now}.`} ${mark} on a showing clears it.`];
  }
}

const REMEDY: Record<Voice, (r: string) => string> = {
  direct: (r) => `Work on it: ${r}.`,
  warm: (r) => `What will help: ${r}.`,
  exacting: (r) => `The step for it: ${r}.`,
  patient: (r) => `One way in: ${r}.`,
  brisk: (r) => `Do this: ${r}.`,
};

/** A note that keeps coming back: the card's other ways at it, and the one this piece was worked with. */
function otherWays(v: Voice, f: ShowingFacts): string[] {
  const tried = f.tried ? `This piece was worked with ${f.tried}. ` : '';
  const C = 'A Note That Keeps Coming Back, on the piece’s card';
  switch (v) {
    case 'direct': return [`${tried}Try another way at it under ${C}.`, `${tried}${C}, has other ways at it.`];
    case 'warm': return [`${tried}If the usual way isn’t working, ${C}, has others.`, `${tried}${C}, has other ways in, if you want one.`];
    case 'exacting': return [`${tried}${C}, lists the other ways at it.`];
    case 'patient': return [`${tried}${C}, has other ways at it to explore.`, `${tried}There are other ways at it under ${C}.`];
    case 'brisk': return [`${tried}Pick another way at it under ${C}.`];
  }
}

/** A prepared piece Strong or better with nothing holding it back: what's said first. */
function steadyLeads(v: Voice, d: Discipline, f: ShowingFacts): string[] {
  const b = f.bandLabel;
  switch (v) {
    case 'direct': return [`${b}. Everything you prepared held.`, `${b}, and the preparation was all there.`];
    case 'warm': return [`${b}, and every part of it was prepared.`, `Everything you prepared came through: ${b}.`];
    case 'exacting': return [`${b}, with nothing in the preparation short.`, `${b}. No part of the preparation fell short.`];
    case 'patient': return [`${b}. What you prepared was all there in ${WORK[d]}.`, `${b}, and it rested on preparation that was all there.`];
    case 'brisk': return [`${b}, and all of it prepared. Good.`, `${b}. Nothing short in the preparation.`];
  }
}

function firstLeads(v: Voice, f: ShowingFacts): string[] {
  const { bandLabel: b, course, prev } = f;
  const was = prev!.label;
  switch (v) {
    case 'direct': return [`${b}: your first in ${course}.`, `Your first ${b} in ${course}, up from ${was}.`];
    case 'warm': return [`Your first ${b} in ${course}, after ${was} last time. That’s a real step.`, `${b}, your first in ${course}. Well done.`];
    case 'exacting': return [`${b}, up from ${was}: the first piece in ${course} at Strong or better.`];
    case 'patient': return [`This is your first ${b} in ${course}, after ${was} on ${prev!.on}. It’s been building.`, `Your first ${b} in ${course}, after ${was} on ${prev!.on}.`];
    case 'brisk': return [`First ${b} in ${course}. Good.`, `${b}, a first for ${course}. Good.`];
  }
}

function bestLeads(v: Voice, f: ShowingFacts): string[] {
  const { bandLabel: b, prev, course } = f;
  const was = prev!.label;
  switch (v) {
    case 'direct': return [`${b}: your best in ${course} so far.`, `${b}, up from ${was}. Your best in ${course} yet.`];
    case 'warm': return [`${b}, the best you’ve shown in ${course}. Well done.`, `Up from ${was} to ${b}, your best in ${course} yet.`];
    case 'exacting': return [`${b}, up from ${was}: the highest you’ve shown in ${course}.`];
    case 'patient': return [`${b}, after ${was}: the best you’ve shown in ${course}.`];
    case 'brisk': return [`Best yet in ${course}: ${b}, up from ${was}.`];
  }
}

function maintainedLeads(v: Voice, d: Discipline, f: ShowingFacts): string[] {
  const { bandLabel: b, run, prev } = f;
  const same = prev?.band === f.band;
  // Times, not pieces: a piece shown in rounds is one piece shown several times (`roundsShown`).
  if (run >= 3) switch (v) {
    case 'direct': return [`${b}${same ? ' again' : ''}: ${count(run)} times running at Strong or better.`, `That’s ${count(run)} times in a row at Strong or better.`];
    case 'warm': return [`Another ${b}. That’s ${count(run)} times running at Strong or better.`, `${b}${same ? ' again' : ''}, ${count(run)} times in a row at Strong or better now.`];
    case 'exacting': return [`${b}: ${count(run)} times running at Strong or better.`, `The ${ordinal(run)} time in a row at Strong or better.`];
    case 'patient': return [`${b}${same ? ' again' : ''}. ${cap(count(run))} times in a row now at Strong or better.`, `${cap(WORK[d])} is holding: ${count(run)} times running at Strong or better.`];
    case 'brisk': return [`${b}${same ? ' again' : ''}, ${count(run)} straight at Strong or better.`];
  }
  if (same) switch (v) {
    case 'direct': return [`${b} again, as on ${prev!.on}.`];
    case 'warm': return [`${b} again, and it was ${b} on ${prev!.on} too. Good to see it hold.`];
    case 'exacting': return [`${b} for the second time running.`];
    case 'patient': return [`${cap(WORK[d])} is holding: ${b} again.`];
    case 'brisk': return [`${b} again.`];
  }
  return [`${b}, after ${prev?.label ?? 'Strong'} on ${prev?.on ?? 'the last piece'}: two in a row at Strong or better.`, `Strong or better twice running now, ${b} this time.`];
}

function despiteLeads(v: Voice, d: Discipline, f: ShowingFacts): string[] {
  const c = f.condition!;
  const clause = CONDITION[c.what]!;
  const pts = Math.round(c.whole);
  const cost = pts >= 1 ? `about ${pts} ${pts === 1 ? 'point' : 'points'}` : 'less than a point';
  const b = f.bandLabel;
  switch (v) {
    case 'direct': return [`${b}, though ${clause}. That cost ${cost}, and ${WORK[d]} carried it.`];
    case 'warm': return [`${cap(clause)}, and it still came out ${b}. That cost ${cost}, and you carried it.`];
    case 'exacting': return [`${b}. ${cap(clause)}, which cost ${cost}, and the preparation made up for it.`];
    case 'patient': return [`${cap(clause)}, and it cost ${cost}, but it still came out ${b}.`];
    case 'brisk': return [`${b}, though ${clause}: that cost ${cost}. Well handled.`];
  }
}

/**
 * A prepared piece kept at Working or Unready by something other than its preparation's notes. Where the same limit held
 * the course's last piece back too (`again`), it's said as that, with when: the same finding isn't new (brief 16,
 * section 3), and it was said fresh six times running in Voice I in its first transcripts.
 */
function heldLeads(v: Voice, d: Discipline, f: ShowingFacts): string[] {
  const h = f.held!;
  const b = f.bandLabel;
  const prep = h.kind === 'preparation';
  if (h.again) switch (v) {
    case 'direct': return [`${h.words} again, as on ${h.again}.`, `Same as on ${h.again}: ${low(h.words)}.`];
    case 'warm': return [`As on ${h.again}, ${low(h.words)}.`, `${h.words}, as it did on ${h.again}.`];
    case 'exacting': return [`The same limit as on ${h.again}: ${low(h.words)}.`];
    case 'patient': return [`It was the same on ${h.again}: ${low(h.words)}.${h.kind === 'ability' || h.kind === 'technique' ? ' That builds slowly.' : ''}`];
    case 'brisk': return [`${h.words}. Same as last time, on ${h.again}.`];
  }
  if (prep) return [`It stayed at ${b}: ${low(h.words)}.`, `${h.words}. That’s what held it back most.`];
  switch (v) {
    case 'direct': return [`You were prepared. ${h.words}.`, `${b}, and not for lack of preparation: ${low(h.words)}.`];
    case 'warm': return [`You came in prepared, so this isn’t about the work you put in: ${low(h.words)}.`, `The preparation was there. ${h.words}.`];
    case 'exacting': return [`Prepared, but ${low(h.words)}.`, `The preparation was complete. ${h.words}.`];
    case 'patient': return [`Nothing was missing from the preparation. What held it back was elsewhere: ${low(h.words)}.`, `${cap(WORK[d])} was prepared, but ${low(h.words)}.`];
    case 'brisk': return [`The preparation was fine. ${h.words}.`, `${h.words}, more than anything in the preparation.`];
  }
}

/** What to do about what held it back, where the game has a thing to do: one sentence, or none. */
function heldAction(f: ShowingFacts): string | undefined {
  const h = f.held;
  if (!h) return undefined;
  if (h.kind === 'ability' || h.kind === 'technique') {
    if (h.what === 'stamina') return 'Work Out, under Look After Yourself, builds stamina.';
    if (h.what === 'discipline') return 'Discipline grows with each day of practice kept up.';
    return h.exercise ? `Classes build it, and so does ${h.exercise}, in the Practice column on your Player Profile.` : 'Classes build it over the weeks.';
  }
  if (h.kind === 'condition') {
    if (h.what === 'fatigue') return 'Come to the next one rested.';
    if (h.what === 'stamina') return 'Work Out, under Look After Yourself, builds stamina.';
    if (h.what === 'illness') return 'That passes with the flu.';
    if (h.what === 'injury') return 'That eases as the injury mends.';
    return undefined;
  }
  if (h.kind === 'difficulty') return 'The piece asks more than your craft has yet, and that comes with classes and practice.';
  if (h.kind === 'fit' || h.kind === 'suitability') return 'Next time, choose a way of playing it that the material allows.';
  return undefined;
}

/** How each voice puts the step beyond. */
const STEP_INTROS: Record<Voice, readonly string[]> = {
  direct: ['Next: ', 'Now try this: '],
  warm: ['When you’re ready, try this: ', 'Something to try next: '],
  exacting: ['Work on this next: ', 'The next precise thing: '],
  patient: ['Something to explore next: ', 'For the next one, try this: '],
  brisk: ['Next time: ', 'Now: '],
};

/** The partner's share, where it's what the record says mattered: at most one sentence. */
function partnerSentence(f: ShowingFacts): string | undefined {
  const p = f.partner;
  if (!p) return undefined;
  if (p.slip) return p.slip.covered ? `${p.first} slipped in ${p.slip.at.toLowerCase()}, and you covered most of it.` : `${p.first} slipped in ${p.slip.at.toLowerCase()}.`;
  if (p.lifted) return `${p.first}’s work lifted the scene together.`;
  if (p.behind) return `${p.first} came less prepared than you.`;
  return undefined;
}

/** A showing's words (briefs 16 and 17): what happened, why, and what to try, in the course's voice. `pick` chooses among them. */
export function showingWords(f: ShowingFacts): string {
  return pick(showingCandidates(f), f.key, f.recent);
}

/** Every whole message true of a showing: what `showingWords` chooses from, and what a test can hold each one of to the facts. */
export function showingCandidates(f: ShowingFacts): string[] {
  // The band said once: a move that names it ("Strong, up from Working") isn't followed by a lead that names it again
  // (brief 17's first after-run: "Strong, up from Working on October 13, 2026. Strong. No part of the preparation fell
  // short."). Where every way would, they're kept.
  const all = composed(f);
  const twice = (x: string) => (x.match(new RegExp(`\\b${f.bandLabel}\\b`, 'g')) ?? []).length > 1 && !/\b(?:again|running|in a row|twice)\b/.test(x);
  const once = all.filter((x) => !twice(x));
  return once.length ? once : all;
}

function composed(f: ShowingFacts): string[] {
  const d = f.discipline;
  const v = voiceOf(f.course);
  const s = situationOf(f);
  const joined = (...parts: (string | undefined)[]) => parts.filter((x) => x && x.trim()).join(' ').replace(/\s+/g, ' ').trim();
  const step = saysStep(f) ? STEP_INTROS[v].map((i) => `${i}${f.note}`) : [''];
  // The band against the course's last piece, where it moved and nothing else says so: what happened, first.
  const front = movedLeads(v, f).length ? movedLeads(v, f) : [''];
  if (s === 'held') {
    // What builds what held it, said where it's news: not where the course or another of its discipline said it lately.
    // A limit that holds piece after piece hears it once, then the finding alone (brief 16, section 3: "Do not generate
    // a new lecture after every routine action").
    const act = heldAction(f);
    const action = act && !f.recent.slice(-4).some((r) => r.includes(act)) ? act : undefined;
    return front.flatMap((m) => heldLeads(v, d, f).flatMap((lead) => step.map((x) => joined(m, lead, action, x))));
  }
  if (s === 'plain') {
    const leads = { direct: [`${f.bandLabel}, and nothing in particular held it back.`], warm: [`${f.bandLabel}, with nothing in particular holding it back.`], exacting: [`${f.bandLabel}, with no single part short enough to name.`], patient: [`It came out ${f.bandLabel}, and nothing in particular stood out as holding it back.`], brisk: [`${f.bandLabel}. Nothing big held it back.`] }[v];
    return front.flatMap((m) => leads.flatMap((lead) => step.map((x) => joined(m, lead, x))));
  }
  if (s === 'first' || s === 'best' || s === 'maintained' || s === 'despite' || s === 'steady') {
    const leads = s === 'first' ? firstLeads(v, f) : s === 'best' ? bestLeads(v, f) : s === 'maintained' ? maintainedLeads(v, d, f) : s === 'despite' ? despiteLeads(v, d, f) : steadyLeads(v, d, f);
    const with_ = s === 'steady' || s === 'best' || s === 'first' ? partnerSentence(f) : undefined;
    // Only a steady piece says how it moved: the others say it in their own words.
    const lead0 = s === 'steady' ? front : [''];
    return lead0.flatMap((m) => leads.flatMap((lead) => step.map((x) => joined(m, lead, with_, x))));
  }
  // A note given before isn't said again in full: its own words were given, so a part says where it stands and what
  // answers it, an answer at the table its reason again (which is the note), and a skill that classes build it.
  const again = s === 'partial' || s === 'slipped' || s === 'recurring' || s === 'persistent';
  const body = !again || f.about === 'choice' ? f.note : f.about === 'skill' ? 'Classes build it over the weeks.' : undefined;
  const fix = f.remedy ? REMEDY[v](f.remedy) : undefined;
  if (s === 'persistent') {
    return oftenLeads(v, f).flatMap((lead) => standing(v, f).flatMap((open) => otherWays(v, f).map((ways) => joined(lead, f.about === 'choice' ? f.note : undefined, open, ways))));
  }
  // A new note on a part, its lead run into its words; the rest, the lead and then the words.
  if (s === 'new' && f.about === 'part') return front.flatMap((m) => newPartLeads(v, f).map((lead) => joined(m, lead, fix)));
  const leads = (m: string) => (s === 'partial' ? partialLeads(v, f, Boolean(m) && m.includes(f.before!.on)) : s === 'slipped' ? slippedLeads(v, f) : s === 'recurring' ? againLeads(v, f) : newLeads(v, d, f));
  const open = again ? standing(v, f, s === 'partial') : [''];
  return front.flatMap((m) => leads(m).flatMap((lead) => open.map((o) => joined(m, lead, body, o, fix))));
}
