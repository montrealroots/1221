/**
 * SLATE — what a course says about a piece shown (from 2026-10-20, the owner's brief 16, "Contextual Writing, Distinct
 * Voices, And Clear Information"). Built from what happened, said in the course's voice, and varied over a long run.
 *
 * **What happened, why, and what to try.** A showing's words come from its facts (`ShowingFacts`): the band against the
 * course's last piece and its best, a run of strong work, the note and how it stands in the ledger (new, better, still
 * there, back after it was taken), what held a prepared piece back by the evaluation's own limits, the day's condition,
 * the partner's share, and the notes the piece put right. Each situation the brief names that the record supports has its
 * own shape (`situationOf`), and only the facts that matter to it are said. Until then every result went through one
 * formula: 381 of 868 showings in brief 16's baseline began "It came together. Here’s what to try next." and 220 "It
 * didn’t come together today." (docs/verification/voices-2026-10-20/before/).
 *
 * **The course's voice.** A course speaks as its discipline does (`disciplineOf`, by the skills it teaches): acting of
 * what's wanted, the other person and the choice; voice and speech of breath, sound and clarity; movement of weight,
 * coordination and stamina; text of the reading and its evidence. The step beyond a piece with nothing holding it back
 * (`STEP`) is said in the discipline's terms; until then Voice I and Alexander Technique heard acting's "Do less. Find
 * the moments that need nothing added, and trust the text in them." The voices are SLATE's: they reproduce no teacher,
 * and the screens say so beside them.
 *
 * **Grounded.** Nothing here says what the engine doesn't record. No moment of a performance is described: a limit is
 * named with what it cost, a strength with the preparation behind it, and a condition only where the evaluation counted
 * one. The step beyond is advice, said as a thing to try.
 *
 * **Varied, and remembered from the record.** Each situation has several ways to say it. Which one is said is chosen
 * without the game's randomness, from a hash of the piece and the day (`pick`), and skips any whose opening or whole text
 * the course, or another course of its discipline, said lately (`recent`, read from the feedback already in the save,
 * newest last). So the memory is the record itself: it's as long as the saved feedback, a save and its reload choose
 * the same words, and nothing is added to the save. Where every way has been used lately, the one said longest ago comes
 * back: a repeat that's true, never a new claim that isn't.
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
  /** The note before, where there was one: when, in which course, how often, and when it was taken. */
  before?: { on: string; course: string; given?: number; taken?: string };
  /** A note on a part: the part's label, and how far it was prepared then and now (0 to 1). */
  part?: { label: string; then?: number; now?: number };
  /**
   * What the note is on, as prose names it: the part's label as its card says it, the question for an answer at the table,
   * the skill in words. A note given often is said short and named by it.
   */
  subject?: string;
  /** Given this often and still open (`LEARNING.persistent`): said short, with what's still open. */
  persistent: boolean;
  /** The part's mark for the note to be taken (`LEARNING.enough`). */
  enough: number;
  /** What this course said lately, and other courses of its discipline, newest last: the memory (`pick`). */
  recent: readonly string[];
}

export type Situation = 'best' | 'maintained' | 'despite' | 'steady' | 'held' | 'plain' | 'new' | 'partial' | 'slipped' | 'recurring' | 'persistent';

const RANK: Record<Band, number> = { unready: 0, working: 1, strong: 2, exceptional: 3 };
const strong = (b: Band) => RANK[b] >= RANK.strong;

/** Which of the brief's situations the record supports for this showing (section 3), the most specific first. */
export function situationOf(f: Pick<ShowingFacts, 'kind' | 'band' | 'prev' | 'run' | 'best' | 'condition' | 'before' | 'persistent' | 'held'>): Situation {
  if (f.kind === 'advanced') {
    // Under Strong with no limit on the record: said as that, with nothing named as holding it (found by the guide's
    // smaller-piece example, a Working piece with no limits, where the first draft of this read a limit that wasn't there).
    if (!strong(f.band)) return f.held ? 'held' : 'plain';
    if (f.condition && f.condition.whole >= 0.5 && CONDITION[f.condition.what]) return 'despite';
    if (f.best && f.prev && RANK[f.band] > RANK[f.prev.band]) return 'best';
    if (f.run >= 2) return 'maintained';
    return 'steady';
  }
  if (f.kind === 'partial') return 'partial';
  if (f.kind === 'recurring' && f.before?.taken) return 'slipped';
  if (f.kind === 'recurring') return f.persistent ? 'persistent' : 'recurring';
  return 'new';
}

// --- Choosing the words ---------------------------------------------------------------------------------------------

/** FNV-1a: the same key, the same number, on every machine and every load. */
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i += 1) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}

/** A text's opening, as the memory compares it: its first sentence, figures taken out, in lower case. */
export function openingOf(text: string): string {
  return (text.split(/(?<=[.!?])\s+/)[0] ?? '').replace(/\d+(?:[.,]\d+)?%?/g, '#').replace(/\b(?:January|February|March|April|May|June|July|August|September|October|November|December) #, #/g, 'DATE').toLowerCase();
}

/**
 * One of several true ways to say a thing: the first, in an order fixed by the key, whose opening and whole text weren't
 * said lately; else the first whose whole text wasn't; else the one whose opening was said longest ago.
 */
export function pick(options: readonly string[], key: string, recent: readonly string[]): string {
  const unique = [...new Set(options)];
  if (unique.length <= 1) return unique[0] ?? '';
  const start = hash(key) % unique.length;
  const order = unique.map((_, i) => unique[(start + i) % unique.length]!);
  const opens = recent.map(openingOf);
  const said = new Set(recent);
  const fresh = order.find((o) => !opens.includes(openingOf(o)) && !said.has(o)) ?? order.find((o) => !said.has(o));
  if (fresh) return fresh;
  const lastSaid = (o: string) => opens.lastIndexOf(openingOf(o));
  return [...order].sort((a, b) => lastSaid(a) - lastSaid(b))[0]!;
}

// --- The words ------------------------------------------------------------------------------------------------------

const low = (s: string) => (/^(?:I\b|SLATE)/.test(s) ? s : `${s.charAt(0).toLowerCase()}${s.slice(1)}`);
const cap = (s: string) => `${s.charAt(0).toUpperCase()}${s.slice(1)}`;
const pct = (x: number) => `${Math.round(x * 100)}%`;
const ORDINAL = ['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'];
const ordinal = (n: number) => ORDINAL[n] ?? (() => { const t = n % 100; return `${n}${t >= 11 && t <= 13 ? 'th' : (['th', 'st', 'nd', 'rd'][n % 10] ?? 'th')}`; })();
const COUNT = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const count = (n: number) => COUNT[n] ?? String(n);

/** What each discipline calls the work it judges, for the sentences that name it. */
const WORK: Record<Discipline, string> = { acting: 'the scene work', voice: 'the voice work', movement: 'the movement', text: 'the reading' };

/** A prepared piece Strong or better with nothing holding it back: what's said first. */
function steadyLeads(d: Discipline, f: ShowingFacts): string[] {
  const b = f.bandLabel;
  switch (d) {
    case 'acting': return [
      'Every part of the preparation held, and it played.',
      'The work you did on it showed: nothing you prepared fell short.',
      `${b}, with every part of the preparation in place.`,
      'You came in with it ready, and nothing pulled it down.',
    ];
    case 'voice': return [
      'The voice work was ready, and nothing in it held the piece back.',
      'Everything the piece asked of the voice was prepared, and it showed.',
      `${b}, and the preparation behind the voice held up.`,
      'What you prepared held up in the voice here.',
    ];
    case 'movement': return [
      'The work was in the body, and nothing in the preparation held it back.',
      'Everything you prepared showed in the movement.',
      `${b}: the movement was prepared through to the end.`,
      'What you prepared held up in the body here.',
    ];
    case 'text': return [
      'The reading was prepared, and nothing in it held the piece back.',
      'Your table work stood up: nothing you prepared fell short.',
      `${b}, with the work on the text done all the way through.`,
      'The preparation behind the reading was complete, and it showed.',
    ];
  }
}

function bestLeads(d: Discipline, f: ShowingFacts): string[] {
  const { bandLabel: b, prev, course } = f;
  const was = prev!.label;
  const on = prev!.on;
  return [
    `${b}, up from ${was} on ${on}: your best in ${course} so far.`,
    `Up from ${was} last time, and the best you’ve shown in ${course} yet.`,
    d === 'voice' ? `The strongest the voice work has been in ${course}: ${b}, where the last piece was ${was}.`
      : d === 'movement' ? `Your best movement work in ${course} so far: ${b}, where the last piece was ${was}.`
        : d === 'text' ? `Your best work at the table in ${course} so far: ${b}, where the last piece was ${was}.`
          : `Your best piece in ${course} so far: ${b}, where the last was ${was}.`,
  ];
}

function maintainedLeads(d: Discipline, f: ShowingFacts): string[] {
  const { bandLabel: b, run, course, prev } = f;
  const same = prev?.band === f.band;
  if (run >= 3) return [
    `${b}${same ? ' again' : ''}: ${count(run)} pieces running in ${course} at Strong or better.`,
    `That’s the ${ordinal(run)} piece in a row at Strong or better in ${course}.`,
    `${cap(WORK[d])} is holding: ${count(run)} pieces running at Strong or better.`,
  ];
  return same
    ? [`${b} again, as on ${prev!.on}.`, `${b} for the second time running.`, `${cap(WORK[d])} is holding: ${b} again.`]
    : [`${b}, after ${prev?.label ?? 'Strong'} on ${prev?.on ?? 'the last piece'}: two in a row at Strong or better.`, `Strong or better twice running now, ${b} this time.`];
}

function despiteLeads(d: Discipline, f: ShowingFacts): string[] {
  const c = f.condition!;
  const clause = CONDITION[c.what]!;
  const pts = Math.round(c.whole);
  const cost = pts >= 1 ? `about ${pts} ${pts === 1 ? 'point' : 'points'}` : 'less than a point';
  return [
    `${f.bandLabel}, even though ${clause}: it cost ${cost}, and ${WORK[d]} carried it anyway.`,
    `${cap(clause)}, which cost ${cost}, and it still came out ${f.bandLabel}.`,
    `It came out ${f.bandLabel} though ${clause}. The preparation made up for the ${cost} that cost.`,
  ];
}

/**
 * A prepared piece kept at Working or Unready by something other than its preparation's notes. Where the same limit held
 * the course's last piece back too (`again`), it's said as that, with when: the same finding isn't new (brief 16,
 * section 3), and it was said fresh six times running in Voice I in its first transcripts.
 */
function heldLeads(d: Discipline, f: ShowingFacts): string[] {
  const h = f.held!;
  const b = f.bandLabel;
  if (h.again) return [`As on ${h.again}, ${low(h.words)}.`, `${h.words}, as it did on ${h.again}.`, `It stayed at ${b}, held back as on ${h.again}: ${low(h.words)}.`];
  const prep = h.kind === 'preparation';
  const out = [
    `It stayed at ${b}: ${low(h.words)}.`,
    prep ? `${h.words}. That’s what held it back most.` : `${h.words}, more than anything in the preparation.`,
  ];
  if (!prep) out.push(`It wasn’t the preparation: ${low(h.words)}.`);
  if (!prep && d === 'voice') out.push(`The voice work was prepared, but ${low(h.words)}.`);
  if (!prep && d === 'movement') out.push(`The movement was prepared, but ${low(h.words)}.`);
  if (!prep && d === 'text') out.push(`The reading was prepared, but ${low(h.words)}.`);
  if (!prep && d === 'acting') out.push(`You came in prepared, but ${low(h.words)}.`);
  return out;
}

/** What to do about what held it back, where the game has a thing to do: one sentence, or none. */
function heldAction(f: ShowingFacts): string | undefined {
  const h = f.held!;
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

const STEP_INTROS = ['Next, try this: ', 'To take it further: ', 'Something to try on the next one: ', 'One step further: '];
const HELD_INTROS = ['Meanwhile, try this: ', 'Alongside that: ', 'On the next piece, try this: '];

/** The band against the course's last piece, where it moved: what happened, said first before a note. */
function movedLeads(f: ShowingFacts): string[] {
  const p = f.prev;
  if (!p || p.band === f.band) return [];
  return RANK[f.band] > RANK[p.band]
    ? [`Up from ${p.label} last time.`, `That’s up from ${p.label} on ${p.on}.`, `Better than the ${p.label} piece on ${p.on}.`]
    : [`Down from ${p.label} on ${p.on}.`, `That’s down from ${p.label} last time.`, `Lower than the ${p.label} piece on ${p.on}.`];
}

/**
 * A new note: that it's what held the piece back most, in the discipline's voice, by what the note is about, before its
 * own words. "Most", never "kept it at" its band: a note is on the part furthest short, and the record doesn't say that
 * part alone decided the band.
 */
function newLeads(d: Discipline, f: ShowingFacts): string[] {
  const b = f.bandLabel;
  const high = strong(f.band);
  if (f.about === 'choice') return high
    ? [`${b}, with one answer at the table still to rethink.`, `${b}, though one reading doesn’t hold up in the text.`]
    : d === 'text' ? [`${b}: the reading rests on one answer the text doesn’t support.`, 'One answer at the table held it back.'] : ['One reading at the table held it back.', `${b}, and one choice the text doesn’t support is part of why.`];
  if (f.about === 'skill') {
    // "Most", not "not the preparation": a part a little short can be a note too, ranked under the craft's.
    const area = d === 'voice' ? 'vocal technique' : d === 'movement' ? 'physical technique' : d === 'text' ? 'the skill behind the reading' : 'the craft';
    return high ? [`${b}, and one skill can grow further.`, `${b}, though ${area} can go further.`] : [`What held it back most was ${area}.`, `At ${b}, ${area} is what held it back most.`];
  }
  switch (d) {
    case 'acting': return high ? [`${b}, with one thing still to work on.`, `${b}, and one part of the preparation can go further.`] : ['One part of the preparation held it back.', 'This is what held it back most.', `At ${b}, this is the part that fell shortest.`];
    case 'voice': return high ? [`${b}, with one thing in the voice work still to do.`, `${b}, and one part of the preparation can go further.`] : ['In the voice work, one part fell short.', `${b}: the voice work fell short in one place.`, 'One part of the voice work wasn’t ready.'];
    case 'movement': return high ? [`${b}, with one thing in the body still to do.`, `${b}, and one part of the movement can go further.`] : ['In the body, one part wasn’t there yet.', `${b}, and one part of the movement work fell shortest.`, 'One part of the movement held it back most.'];
    case 'text': return high ? [`${b}, with one thing in the reading still to do.`, `${b}, and one part of the table work can go further.`] : [`${b}: the reading fell short in one place.`, 'One part of the table work held it back most.', 'One part of the reading wasn’t ready.'];
  }
}

/** A note better but not there. `dated`: the day was said just before (the band's move), so it's "then", not the day again. */
function partialLeads(f: ShowingFacts, dated = false): string[] {
  const p = f.part;
  const then = p?.then !== undefined ? pct(p.then) : undefined;
  const now = p?.now !== undefined ? pct(p.now) : undefined;
  const on = f.before!.on;
  const fig = then && now ? ` (${then} then, ${now} now)` : '';
  const label = p?.label ?? 'It';
  return [
    `This has improved since ${dated ? 'then' : on}${fig}, but it isn’t there yet.`,
    then && now ? `${label} went from ${then}${dated ? '' : ` on ${on}`} to ${now} now: closer, not there yet.` : `Closer than ${dated ? 'then' : `on ${on}`}, not there yet.`,
    `Better than ${dated ? 'then' : `on ${on}`}${fig}, though not all the way.`,
  ];
}

function slippedLeads(f: ShowingFacts): string[] {
  const t = f.before!.taken!;
  return [`You fixed this on ${t}, but it has slipped back.`, `This had come right on ${t}, and it has slipped since.`, `Back again: you’d put this right on ${t}.`];
}

function recurringLeads(f: ShowingFacts): string[] {
  const b = f.before!;
  const n = (b.given ?? 1) + 1;
  const where = b.course === f.course ? `in ${f.course}` : `in ${b.course}`;
  // Said short, without the note's own words, it names what the note is on (found reading brief 16's first transcripts:
  // "Still open after seven notes" said nothing of which).
  if (f.persistent && f.subject) return [
    `The note on ${f.subject} is still open after ${count(n - 1)} notes, the last ${where} on ${b.on}.`,
    `This is the ${ordinal(n)} time you’ve had the note on ${f.subject}, the last ${where} on ${b.on}.`,
    `A ${ordinal(n)} time for the note on ${f.subject}: it was last given ${where}, on ${b.on}.`,
  ];
  return n >= 3
    ? [`This is the ${ordinal(n)} time you’ve had this note, the last ${where} on ${b.on}, and it’s still there.`, `The same note a ${ordinal(n)} time: it was last given ${where}, on ${b.on}.`, `Still open after ${count(n - 1)} notes, the last ${where} on ${b.on}.`]
    : [`You had this note ${where} on ${b.on} too, and it’s still there.`, `The same note as on ${b.on} ${where}: it hasn’t moved yet.`, `Still there from ${b.on}, ${where}.`];
}

/** What's still open on a part, where the part measures it: how far it's come against the mark that takes the note. */
function stillOpen(f: ShowingFacts, named = false): string | undefined {
  const p = f.part;
  if (!p || p.now === undefined) return undefined;
  return `${named ? 'It’s at' : `${p.label}:`} ${pct(p.now)} now, and the note is taken at ${pct(f.enough)}.`;
}

/** The partner's share, where it's what the record says mattered: at most one sentence. */
function partnerSentence(f: ShowingFacts): string | undefined {
  const p = f.partner;
  if (!p) return undefined;
  if (p.slip) return p.slip.covered ? `${p.first} slipped in ${p.slip.at.toLowerCase()}, and you covered most of it.` : `${p.first} slipped in ${p.slip.at.toLowerCase()}.`;
  if (p.lifted) return `${p.first}’s work lifted the scene together.`;
  if (p.behind) return `${p.first} came less prepared than you.`;
  return undefined;
}

/** A showing's words (brief 16): what happened, why, and what to try, in the course's voice. `pick` chooses among them. */
export function showingWords(f: ShowingFacts): string {
  return pick(showingCandidates(f), f.key, f.recent);
}

/** Every whole message true of a showing: what `showingWords` chooses from, and what a test can hold each one of to the facts. */
export function showingCandidates(f: ShowingFacts): string[] {
  const d = f.discipline;
  const s = situationOf(f);
  const joined = (...parts: (string | undefined)[]) => parts.filter((x) => x && x.trim()).join(' ').replace(/\s+/g, ' ').trim();
  let candidates: string[] = [];
  // The band against the course's last piece, where it moved and nothing else says so: what happened, first.
  const front = movedLeads(f).length ? movedLeads(f) : [''];
  if (s === 'held') {
    // What to do about it, said where it's news: not where the course or another of its discipline said it lately. A
    // limit that holds piece after piece hears it once, then the step beyond alone (brief 16, section 3: "Do not generate
    // a new lecture after every routine action").
    const act = heldAction(f);
    const action = act && !f.recent.slice(-4).some((r) => r.includes(act)) ? act : undefined;
    candidates = front.flatMap((m) => heldLeads(d, f).flatMap((lead) => HELD_INTROS.map((intro) => joined(m, lead, action, `${intro}${f.note}`))));
  } else if (s === 'plain') {
    const leads = [`${f.bandLabel}, and no one thing held it back.`, `${f.bandLabel}: nothing in it fell short enough to name.`];
    candidates = front.flatMap((m) => leads.flatMap((lead) => STEP_INTROS.map((intro) => joined(m, lead, `${intro}${f.note}`))));
  } else if (s === 'steady' || s === 'best' || s === 'maintained' || s === 'despite') {
    const leads = s === 'best' ? bestLeads(d, f) : s === 'maintained' ? maintainedLeads(d, f) : s === 'despite' ? despiteLeads(d, f) : steadyLeads(d, f);
    const with_ = s === 'steady' || s === 'best' ? partnerSentence(f) : undefined;
    // A run of strong work hears the step beyond and little else: a short acknowledgment, not a lecture. Only a steady
    // piece says how it moved: the best and a run say it in their own words.
    const lead0 = s === 'steady' ? front : [''];
    candidates = lead0.flatMap((m) => leads.flatMap((lead) => STEP_INTROS.map((intro) => joined(m, lead, with_, `${intro}${f.note}`))));
  } else if (s === 'persistent') {
    // Given often and still open: what's still open and where to try another way, not the whole note again.
    const open = stillOpen(f, Boolean(f.subject));
    candidates = recurringLeads(f).map((lead) => joined(lead, open, 'A Note That Keeps Coming Back, on the piece’s card, offers other ways at it.'));
  } else {
    const leads = (m: string) => (s === 'partial' ? partialLeads(f, Boolean(m) && m.includes(f.before!.on)) : s === 'slipped' ? slippedLeads(f) : s === 'recurring' ? recurringLeads(f) : newLeads(d, f));
    const fix = f.remedy ? `To work on it: ${f.remedy}.` : undefined;
    const open = s === 'recurring' ? stillOpen(f) : undefined;
    candidates = front.flatMap((m) => leads(m).map((lead) => joined(m, lead, f.note, open, fix)));
  }
  return candidates;
}
