/**
 * SLATE — the guide's reference: your craft (from 2026-10-12; `content/guide/types.ts`).
 *
 * Nine entries: the Player Profile, practice and an ability's look, the genres, a practice brief's preparation, its
 * reading and the way it's played, who reads with you, the take, a piece of work explained, and the work so far. The
 * figures are the rules' own, imported (`content/practice.ts`, `content/engagement.ts`, `content/piece.ts`,
 * `content/approaches.ts`, `content/workbook.ts`, `systems/briefs.ts`, `systems/ensemble.ts`, `systems/artistry.ts`),
 * and the worked examples are the engine's own arithmetic, run when the guide loads: `abilityGain` for an hour of
 * practice, the study rule for a genre, and the drama's brief judged beat by beat by `judgePiece` for an actor at even
 * levels, then blended with its reader by `sharedOf`. A change to a rule changes what these entries say.
 *
 * A few figures the systems keep as bare numbers, exported by nothing, are written here in words and would drift from
 * their rule unnoticed: the 50 at which discipline neither lifts an hour nor lowers it (`develop`, from 2026-10-12), a
 * classmate's timing from a half, the three pieces a weakness needs for life and the three it lists, the four kinds of
 * material Material You Know lists, the three notes and the three pieces together that Taking Direction and Playing
 * With Others wait for, the 3 points under your own at which Work It Through names a reader not
 * there yet (`PARTNER_GAP`, `problemsOf` in `systems/workbook.ts`), a part refused at 97%, and the five briefs at most
 * that Where It Would Show Next suggests (`suggestions` in `systems/briefs.ts`).
 *
 * Verified against the engine on 2026-10-12, and corrected where it wasn't so: the reader's example taped three takes in
 * a row as if each were a first, where the first, at Strong together, earns a callback and the next is pitched harder;
 * and its run with the partner came after two rehearsals, when the take with them was 2.5 under your own and Work It
 * Through no longer offered one. The preparation example's second day went as fast as its first, where the first day's
 * rehearsal is practice in the brief's material and speeds the second (`prepSpeed`). A recording was said always to
 * bring the take with it under your own, which holds only where your own work is over its 60.
 *
 * The prose pass later on 2026-10-12 read the entries against the day's fixes. Until then they said Study It showed no
 * message (it toasts the familiarity reached), that a genre's look's Preparation was how much faster its work is
 * prepared (a scene's or a part's; a brief's steps read the material met before), that a way of playing drew on
 * stamina "excepted" in a brief's table (the table leaves it out), that every press of a choice counted toward a habit
 * and that a take counted as one (only a side newly chosen counts, `chooseBrief`), that Reliability read this term's
 * calls alone (`callsBefore` carries the terms before), and that the weakness your work keeps coming back to informed
 * only the brief suggestions (What To Work On Next names it with its count and may put it first, and a director's craft
 * note on it says so). They said nothing of how the reader plays the other part (`READER_PLAYS`), of a weakness no
 * brief reads, which is suggested no brief, or of the genre your work knows least, which is.
 *
 * That pass's verifier found two lines still loose. Your Work So Far said What To Work On Next named the weakness your
 * work keeps coming back to in a brief's pane as well as on the Profile; the pane heads it What To Work On and gives
 * only the first ability or technique recommended (`BriefPane.tsx`), so it names that weakness only when it comes first.
 * And the take's What To Work On was said to name what holds your work back most, where that weakness goes first while
 * it was within `RECOMMEND.recurringWithin` of the top (`recommendations`).
 *
 * From 2026-10-16 What To Work On Next is forecast (`systems/advice.ts`): what each input's hours of practice would be
 * worth on the recent work, so what held a take back most and what pays most to train are two things, and the entries
 * say so; the recurring weakness goes first only where it's about as useful as the top (`tied`). From brief 10, later
 * that day (F2-A10), the recurring weakness is said where its forecast puts it; the hours are grown as the engine grows
 * them, which is steady from three quarters of full, where the entry said "slower the nearer it is to full"; and the
 * entry says what the advice names (the pieces it read, the discipline the days keep, a piece its preparation held back
 * read as prepared, the genre as known today, everything at full). From brief 11 (2026-10-17) the entry says what the
 * first line adds: what completing that preparation would bring, apart from training; how long it has been first and
 * what has moved since, discipline's part of the change; and the next hour, with its cost, or why not now. From brief 12
 * (later that day) it says what the first line adds since: what the forecast assumes of the work and what a piece read as
 * prepared would read as taped; whether preparation, training or both deserve attention; and what moved a forecast, in
 * parts. Until then a forecast's rise was put down to discipline alone, and only where discipline had moved.
 *
 * The Profile has no tabs, so no entry names one.
 *
 * Played through the engine's commands later on 2026-10-12 (`tests/guide-examples-craft.test.ts`), two examples were
 * wrong against it, and only their figures' text was corrected; nothing else in them changed. Practice's hour at 85 said
 * it added 0.10 where its toast says +0.11: the floor's gain is 0.105, and the toast prints the level after less the
 * level before, which `hour` now works out the same way. A Reading And A Way To Play It's actor was said to be at 60 in
 * everything, stamina too, where its figures read stamina at 60% of its full: stamina's full is a body's most at its
 * age, 99.4 for the first-year the test plays, and at 60 of it Guarded To The Last came to 66.3, not 66.2. Its setup
 * says so now.
 *
 * That play's verifier found three more the same day. A Piece Of Work, Explained gave its take's figures with no draw
 * and didn't say so, where the take it opens has its draw: opened, it showed 65.9 and its parts 66.8, 65.6 and 65.3,
 * not 66.5 and 67.2, 66.5 and 65.7. Its setup says “with no draw” now, as Taping A Brief's does. Practice's repeat was
 * the first hour's gain halved, pressed straight after, where the engine's second hour reads the level the first left,
 * the discipline it grew and the focus the hour just spent left: 0.0794 played against 0.0840 here, alike only once
 * rounded. The example has every hour rested now, and `hour` works the repeat out as `develop` does. And the readings'
 * actor and a genre's 0% of the 30% were typed beside the constants they copied.
 */

import { ADVICE } from '../../systems/advice';
import { CHAPTER_BY_ID } from '../tutorial';
import { ABILITY_DEFS, DEVELOPMENT, MASTERED, STEP_SPEED, TECHNIQUES, TECHNIQUE_LABEL, type AbilityId } from '../abilities';
import { EXERCISES, EXERCISE_BY_ID, FOCUS, FOCUS_RATE, PRACTICE, TIER } from '../practice';
import { ENGAGEMENT } from '../engagement';
import { FILM_GENRES } from '../film-genres';
import { genreTags } from '../demands';
import { BRIEFS, BRIEF_BY_ID, briefsOf } from '../briefs';
import { PIECE } from '../piece';
import { APPROACH_EFFECT, AXES, MISFIT, PLAYING } from '../approaches';
import { GRAIN } from '../interpretation';
import { WORKBOOK } from '../workbook';
import { DIMENSION_LABEL, EVALUATION, TASK_PROFILES, type Dimension } from '../tasks';
import { plural } from '../../core/text';
import type { Person } from '../../domain/model';
import { abilityGain } from '../../systems/attributes';
import { BRIEF, READER_PLAYS, briefContext, briefPiece, stepMinutes, turnsOf, type BriefRecord } from '../../systems/briefs';
import { judgePiece, pieceWeights, segmentRequired } from '../../systems/piece';
import { ENSEMBLE, sharedOf, type PartnerRead } from '../../systems/ensemble';
import { bandOfQuality, chiefLimit, WORK_KEPT, type Performer } from '../../systems/evaluation';
import { BAND_LABEL, TOGETHER_BOND, TOGETHER_COVERED, WORK } from '../../systems/coursework';
import { ARTISTRY } from '../../systems/artistry';
import { EXPERIENCE } from '../../systems/experience';
import { matchedTier } from '../../systems/practice';
import { EVERYDAY_FITNESS, FITNESS, SPENT } from '../../systems/life';
import { KNOB_LIMITS } from '../../systems/personality';
import { SELF_TAPE } from '../../systems/engagement';
import type { GuideEntry } from './types';
import { ceilingAt } from '../lifespan';
import { TRAINING_CLASS_NAMES } from '../body';
import { CONCERNS, CONCERN_IDS } from '../concerns';

// --- where it is ------------------------------------------------------------------------------------------------------

const CHAPTER = CHAPTER_BY_ID['profile']!.title;
const OPENED = `From the guide’s chapter “${CHAPTER}”`;
const LOCKED = `Locked, on a guided life, until “${CHAPTER}” has been read.`;
const PROFILE = '/workspace/profile';

// --- how a figure is written ------------------------------------------------------------------------------------------

const pct = (x: number): string => `${Math.round(x * 100)}%`;
const one = (x: number): string => x.toFixed(1);
const two = (x: number): string => x.toFixed(2);
/** A signed figure as it's printed, with a typographic minus. */
const signed = (x: number): string => (x < 0 ? `−${Math.abs(x)}` : String(x));
/** "a, b or c". */
const orList = (items: readonly string[]): string => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} or ${items[items.length - 1]}`);
/** "a, b and c". */
const andList = (items: readonly string[]): string => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
/** Minutes as hours and minutes: "4 hours and 10 minutes". */
const duration = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${plural(h, 'hour')}${m ? ` and ${plural(m, 'minute')}` : ''}` : plural(m, 'minute');
};
const abilityLabel = (id: AbilityId): string => ABILITY_DEFS.find((d) => d.id === id)?.label ?? id;
const band = (q: number): string => BAND_LABEL[bandOfQuality(q)];

// --- practice ---------------------------------------------------------------------------------------------------------

const FOCUS_LABELS = Object.values(FOCUS).map((f) => f.label);
const ON_FEET = EXERCISES.filter((e) => e.feet).map((e) => e.label);
const WITH_A_CLASSMATE = EXERCISES.filter((e) => e.partnered).map((e) => e.label);
const SENSE = EXERCISE_BY_ID['sense-memory']!;
const DEPTH = abilityLabel(SENSE.trains as AbilityId);
/** The example's levels: the hours at 60, and the last at 85, near full. */
const PRACTICE_AT = 60;
const PRACTICE_NEAR_FULL = 85;
/** Discipline where it neither lifts an hour nor lowers it: `develop`'s 50, a bare number there. */
const EVEN_DISCIPLINE = 50;
/** What discipline makes of an hour, as `develop` has it: up to `disciplineLift` more at 100, as much less at 0. */
const disciplined = (discipline: number): number => 1 + DEVELOPMENT.disciplineLift * (discipline - EVEN_DISCIPLINE) / EVEN_DISCIPLINE;
/**
 * An hour at a level, a tier's factor and a focus's, at a focus of the day of 1: what the hour's toast says it added,
 * the level after less the level before, as `develop` works it out, with discipline's lift and a repeat's share. Until
 * 2026-10-12 this was the gain alone, and at 85 the floor's 0.105 printed as 0.10 where the toast, from 85.105 less 85,
 * said +0.11 (`tests/guide-examples-craft.test.ts`).
 */
const hour = (level: number, { weight = 1, discipline = EVEN_DISCIPLINE, repeats = 0 } = {}): number =>
  level + abilityGain(level, 100, { weight, focus: 1, deliberate: true }) * disciplined(discipline) * DEVELOPMENT.repeat ** repeats - level;
const AT_60 = hour(PRACTICE_AT);
/** Discipline after the day's first hour, which grows it once for the day kept (`PRACTICE.disciplineDay`). */
const DISCIPLINE_AFTER = EVEN_DISCIPLINE + abilityGain(EVEN_DISCIPLINE, 100, { weight: PRACTICE.disciplineDay, focus: 1, deliberate: true });
/**
 * The repeat, rested again: from the level the first hour left, at the discipline it grew, keeping a repeat's share.
 * Until 2026-10-12 it was the first hour's gain halved, at the first hour's level and focus, and the example pressed it
 * straight after, where the hour just spent leaves the day's focus under 1: played, 0.0794 against the 0.0840 worked
 * out here, the two printing alike only by rounding.
 */
const AT_60_AGAIN = hour(PRACTICE_AT + AT_60, { discipline: DISCIPLINE_AFTER, repeats: 1 });
const AT_60_BELOW = hour(PRACTICE_AT, { weight: TIER.below });
const AT_85 = hour(PRACTICE_NEAR_FULL);
/** The tier marked Your Level at 85, where the example's last hour is pitched. */
const TIER_AT_85 = TIER.label[matchedTier(PRACTICE_NEAR_FULL)];

// --- genres -----------------------------------------------------------------------------------------------------------

const APPLIED = FILM_GENRES.filter((g) => genreTags(g.id).length > 0).length;
const r2 = (x: number): number => Math.round(x * 100) / 100;
/** A study, the nth of the day (from 0), from a familiarity: the rule `genre.study` runs. */
const studied = (f: number, n: number): number => r2(f + 100 * ENGAGEMENT.genre.study * 0.5 ** n * (1 - f / 100));
/** A genre never studied: familiarity at nothing, of 100. */
const UNSTUDIED = 0;
const FIRST_STUDY = studied(UNSTUDIED, 0);
const SECOND_STUDY = studied(FIRST_STUDY, 1);
const DAYS_TO_KNOW = ((): { days: number; at: number } => {
  let f = UNSTUDIED;
  let days = 0;
  while (f / 100 < BRIEF.complete.genre && days < 100) { f = studied(f, 0); days += 1; }
  return { days, at: f };
})();
const SPEED_KNOWN = ENGAGEMENT.genreSpeed * (DAYS_TO_KNOW.at / 100);

// --- the drama's brief, the examples' scene ---------------------------------------------------------------------------

const DRAMA = BRIEF_BY_ID['brief-drama'] ?? BRIEFS[0]!;
const TURNS = turnsOf(DRAMA);
const PLAIN = briefPiece(DRAMA, {});
const BEAT_ASKS = PLAIN.segments.map((_, i) => segmentRequired(PLAIN, BRIEF.complete.rehearsal, i));
const MOST_ASKED = Math.max(...BEAT_ASKS);
/** A part after a step on each of so many days, at a focus of 1 with no trait or material met moving it. */
const afterDays = (gain: number, days: number): number => 1 - (1 - gain) ** days;
const READ_GAIN = BRIEF.steps.read.gain;
const REHEARSE_GAIN = BRIEF.steps.rehearse.gain;
/**
 * The second day's speed: the first day's rehearsal on your feet is practice in every kind of material the brief is
 * built on, once each (`noteMaterial`), so each counts a sixth of the way to met (`featureSpeed`).
 */
const DAY_TWO_SPEED = 1 + ENGAGEMENT.genreSpeed * Math.min(1, 1 / EXPERIENCE.fullAt);
/** A part after a step on day one and another on day two, at a focus of 1, the second at the second day's speed. */
const afterTwoDays = (gain: number): number => gain + gain * DAY_TWO_SPEED * (1 - gain);
const PREP_MINUTES = (['read', 'lines', 'rehearse'] as const).reduce((a, s) => a + stepMinutes(DRAMA, s), 0);
const [READING_ONE, READING_TWO] = [DRAMA.readings[0]!, DRAMA.readings[1] ?? DRAMA.readings[0]!];

/**
 * Stamina's full for the examples' life: born June 2002, so 24 when the term begins in August 2026 (`abilityFull`, a
 * body's ceiling at its age). Until 2026-10-16 the examples' performer had every full at 100, and a played life's take
 * matched it to the tenth only by rounding: the genre's register moved the weights and the two came a tenth apart.
 */
const STAMINA_FULL = ceilingAt(24).fitness;
/** An actor at one level in everything, and another way here and there: the examples' performer. */
const actor = (rest: number, levels: Partial<Record<AbilityId, number>> = {}): Performer => ({ ability: (a) => levels[a] ?? rest, full: (a) => (a === 'stamina' ? STAMINA_FULL : 100), technique: () => rest });
const NOBODY = {} as Person;
const PREPARED: BriefRecord = { prep: { interpretation: 1, memorization: 1, rehearsal: 1 }, takes: [] };
const FULL_PREP = { interpretation: 1, memorization: 1, rehearsal: 1, genre: 1 };

/** The drama's brief taped with no draw: an actor, a reading, the day's readiness, and whether it's a callback. */
function take(performer: Performer, reading: string, readiness: number, callback = false) {
  const ctx = briefContext(NOBODY, DRAMA, PREPARED, { reading, prep: FULL_PREP, callback });
  const spec = briefPiece(DRAMA, {}, reading);
  const e = judgePiece('guide', performer, { ...ctx, condition: { readiness }, key: 'guide', expected: true }, spec);
  return { e, weights: pieceWeights(ctx.task, ctx.lean, spec) };
}

/**
 * The examples' actor's level, in everything. 62 from 2026-10-16: at 60 the take with a recording reading came to 65.0
 * played and 64.9 here, on the line a callback is earned at, so a tenth decided whether the example's callback existed
 * at all, and the genre's register moved it that tenth. At 62 it's earned with room to spare.
 */
const AT = 62;
const EVEN = actor(AT);
const TAPED = take(EVEN, READING_ONE.id, 80);
const CALLBACK = take(EVEN, READING_ONE.id, 80, true);
const LAST_BEAT = TAPED.e.piece!.segments[TAPED.e.piece!.segments.length - 1]!;
const CHIEF = chiefLimit(TAPED.e);

// The readings, for an actor stronger in feeling and composure than in listening and adapting, and at 60 in the rest.
const UNEVEN_REST = 60;
const UNEVEN_LEVELS = { emotionalDepth: 75, composure: 70, listening: 50, adaptability: 50 } as const;
const UNEVEN = actor(UNEVEN_REST, UNEVEN_LEVELS);
const FIRST_READING = take(UNEVEN, READING_ONE.id, 100).e.overall;
const SECOND_READING = take(UNEVEN, READING_TWO.id, 100).e.overall;

// The reader: a recording, and a classmate at a timing of 0.85 (listening and focus at 70) as they prepare with you.
const RECORDING: PartnerRead = { name: 'A Recording', prep: 1, timing: BRIEF.reader.recording, agree: 1, reliability: 1, level: DRAMA.partner };
const MATE_TIMING = 0.5 + 0.5 * ((70 + 70) / 200);
const mate = (prep: number): PartnerRead => ({ name: 'A Classmate', prep, timing: MATE_TIMING, agree: 1, reliability: 1, level: DRAMA.partner });
const together = (read: PartnerRead): number => sharedOf(TAPED.e, read, 'guide', 'guide', 1, TAPED.weights).overall;
/** A classmate's preparation after so many rehearsals on your feet, each on its own day at a focus of 1. */
const rehearsedWith = (n: number): number => {
  let p = 0;
  for (let i = 0; i < n; i += 1) p += BRIEF.reader.rehearse * REHEARSE_GAIN * (1 - p);
  return p;
};
/** How far under your own the take with a reader must come before Work It Through names it (`problemsOf`, a bare 3 there). */
const PARTNER_GAP = 3;
const MATE_AFTER_TWO = rehearsedWith(2);
/** Run It With Your Partner from nothing, at a focus of 1: what a classmate chosen the morning of the take can reach. */
const MATE_AFTER_RUN = WORKBOOK.partnerGain;
const WITH_RECORDING = together(RECORDING);
const WITH_NEW_MATE = together(mate(0));
const WITH_MATE_TWO = together(mate(MATE_AFTER_TWO));
const WITH_MATE_RUN = together(mate(MATE_AFTER_RUN));
/** And a rehearsal on your feet after the run, the day's first, at a focus of 1. */
const MATE_RUN_REHEARSED = MATE_AFTER_RUN + BRIEF.reader.rehearse * REHEARSE_GAIN * (1 - MATE_AFTER_RUN);
const WITH_MATE_RUN_REHEARSED = together(mate(MATE_RUN_REHEARSED));
const WITH_MATE_FULL = together(mate(1));
const RECORDING_BRINGS = (ENSEMBLE.prepFloor + (1 - ENSEMBLE.prepFloor)) * BRIEF.reader.recording;
/** How often the least reliable classmate slips, as one take in so many. */
const SLIP_ODDS = Math.round(1 / ((1 - WORK.reliability.from) * ENSEMBLE.slipRate));
const SHARES = (Object.entries(ENSEMBLE.share) as [Dimension, number][]).map(([d, s]) => `${DIMENSION_LABEL[d].toLowerCase()} ${pct(s)}`);
/** How the reader may play the other part (`READER_PLAYS`), and what playing against each asks, as the brief's How They Play It says it. */
const READER_WAYS = Object.values(READER_PLAYS).map((p) => {
  const leans = (Object.keys(p.lean) as Dimension[]).map((d) => DIMENSION_LABEL[d].toLowerCase());
  const draws = [...new Set(Object.values(p.inputs).flatMap((xs) => (xs ?? []).map((x) => abilityLabel(x.ability).toLowerCase())))];
  return leans.length || draws.length ? `${p.label}, judged more on ${andList(leans)}${draws.length ? ` and calling on your ${andList(draws)}` : ''}` : `${p.label}, no more than the scene asks`;
});

/** The example's choices of Measured before a habit is named: two short of what names one. */
const HABIT_SO_FAR = Math.max(1, ARTISTRY.habitAt - 2);

/** Points of the whole, a half written so. */

/** Whether any genre has more than one brief, so its pane shows a list of them (the second situations, from 2026-10-12). */
const SEVERAL = FILM_GENRES.some((g) => briefsOf(g.id).length > 1);
/** Whether any brief rides on more or less than the usual (`Brief.stakes`, unset as 1), which moves its difficulty. */
const STAKES_VARY = BRIEFS.some((b) => (b.stakes ?? 1) !== 1);

const TAPE = TASK_PROFILES.tape!;
const ON_ITS_FEET = TASK_PROFILES.tapeOnFeet!;
const TAPE_WEIGHTS = (Object.entries(TAPE.dims) as [Dimension, { weight: number }][]).map(([d, s]) => `${DIMENSION_LABEL[d].toLowerCase()} ${s.weight}`);
const AXIS_WORDS = Object.values(AXES).map((a) => `${a.label} (${APPROACH_EFFECT[a.values[0]].label} or ${APPROACH_EFFECT[a.values[1]].label})`);
const STRONG = EVALUATION.bands.strong;

export const CRAFT: readonly GuideEntry[] = [
  {
    id: 'craft.profile',
    title: 'The Player Profile',
    goal: 'craft',
    covers: ['ui.profile'],
    synonyms: ['player profile', 'abilities', 'techniques', 'attributes and craft', 'character sheet', 'development history', 'school journey', 'current condition', 'what to work on next', 'classes reach'],
    questions: ['Where are my abilities?', 'How good am I?', 'What does Classes Reach mean?', 'What should I work on next?', 'Where is the work I’ve done?'],
    where: { route: PROFILE, label: 'Player Profile' },
    available: `${OPENED}: Player Profile on the menu, and your name at its foot.`,
    short: `The Player Profile is you as an actor. From the top: Identity And Background, as you made your character; Attributes And Craft, your ${ABILITY_DEFS.length} abilities from 0 to 100, with what to work on next; Techniques, ${TECHNIQUES.length} learned skills, each mastered at ${MASTERED}; Genres, each with its practice brief; Current Condition, your readiness for work today; School Journey, every piece of work judged; Your Work So Far; and Development History, each change and what made it. Looking at it changes nothing and moves no clock.`,
    steps: [
      'Press P, or Player Profile on the menu, or your name at the foot of the menu.',
      'In Attributes And Craft, each ability shows Now, Full, Classes Reach, Today (what holds it back today), It Shapes (what your teacher looks for that it affects), Last Change and Practice. What To Work On Next sits above the table.',
      'Press an ability’s or a technique’s name to open it: what it is, how it grows, where it started, what it does, where it counts and its latest changes.',
      'In Genres, Find narrows the list by name, and Show picks All, Loved, Studied Or Worked In or With Requirements. Study It and Open Its Brief sit beside each genre.',
      'In School Journey, press a piece of work to see how it was judged, and Show Older Work for more. Development History lists each change, newest first.',
    ],
    needs: [
      `On a guided life, “${CHAPTER}” read in the guide.`,
      'A life that began at drama school.',
    ],
    costs: [
      { label: 'Time', value: 'None: reading the profile and opening anything on it moves no clock' },
      { label: 'Money', value: 'None' },
    ],
    reads: [
      { label: 'An Ability', value: '0 to 100, full at 100. Stamina is your fitness, full at the fittest a body your age can be' },
      { label: 'Classes Reach', value: 'Where classes and coursework level off for you: a technique’s own ceiling, and for an ability, the ceiling of the techniques it’s related to. Practice takes it past that, to full' },
      { label: 'A Technique', value: `0 to 100, mastered at ${MASTERED}: no work asks more of it past that` },
      { label: 'Today', value: `Readiness under ${EVALUATION.sufficientReadiness}, the flu, an injury or a concussion, and what your teacher looks for that each one holds back` },
      { label: 'What To Work On Next', value: `Each ability and technique your recent work called on, forecast: what ${ADVICE.sessions} hours of its exercise, a session a day at an ordinary day’s focus, would bring your recent work played again with you as you are now (knowing each genre as you know it today), and where those hours would take it. It grows as an hour of practice grows it, slower as it rises to three quarters of full and steady from there. The most worthwhile comes first, the latest pieces counting most` },
      { label: 'What Each Line Says', value: 'How many of your last pieces call on it and the one that would gain most; how much of the figure is the discipline the days of practice build, which any exercise kept up daily would bring; and for the weakness your work keeps coming back to, how many pieces it has held back in all and the day it last did, with “From your record:”. Two within a tenth of a point, or a tenth of the larger, are said to be about as useful' },
      { label: 'Preparation, Said Apart', value: 'A piece held back most by its own preparation is counted as fully prepared, so the figure is what training is worth. What completing that preparation would bring is said apart on the first line, in its own figure; and a part of preparation left short, a day’s condition or a way of playing that didn’t fit gets a line of its own saying what to do differently' },
      { label: 'What Drops Out', value: `An ability or technique at full drops out (a technique at ${MASTERED}), and so does one forecast under a tenth of a point. Where everything your recent work called on that an exercise trains is at full, it says so` },
      { label: 'The First Line', value: 'How long it has come first and what has moved since the advice first named it (its level, its forecast, the pieces it held back, the hours you’ve practiced it), how much of a change is discipline’s lift on every hour, and what came first before it; the next hour of its exercise, with what it costs and would add now, or why it can’t be done now; what moved a forecast, in parts (the work it’s forecast on, how well you know its genres, your other abilities and techniques, its own level and discipline, and anything it can’t trace); what the forecast assumes of your pieces and your genres; and whether preparation, training or both deserve attention, with both figures' },
      { label: 'School Journey', value: `Your latest ${WORK_KEPT} pieces of work in full, and every piece ever judged counted by half-year` },
      { label: 'Development History', value: `Your last ${DEVELOPMENT.historyKept} changes to an ability or a technique, each with what made it` },
    ],
    now: [
      'Opening the profile, a panel or a name changes nothing and moves no clock.',
      'Its buttons act: Practice An Hour, Study It, and everything inside an open brief, each with an entry of its own.',
    ],
    later: [
      'Each figure moves as your life goes on: a class, a step of preparation, an hour of practice, a take, a showing or a night grows what it trains, and Development History lists it.',
      `Stamina is the one that falls without use: ${FITNESS.perDay} a day toward ${EVERYDAY_FITNESS} once ${plural(FITNESS.heldDays, 'day')} have passed since a workout or a class that trains the body as hard (${andList(TRAINING_CLASS_NAMES)}).`,
    ],
    interpret: [
      'Now against Full is how far an ability has to go. Classes Reach is where classes stop taking it; practice carries it the rest of the way.',
      'Today says “Not held back today” on a sufficient day; otherwise it names the cause and what your teacher looks for that it holds back.',
      `A technique’s Mastered column says Yes at ${MASTERED}, or how far it has to go.`,
      'In School Journey each half-year row gives each kind of work’s count and its mean, and All Of It the life’s count, mean and best.',
      'Identity And Background is shown as you made your character; no ability comes from a name, a portrait, a race or ethnicity, or a gender.',
    ],
    unavailable: [
      `${LOCKED} Until then the screen opens as Locked, with the chapter that opens it.`,
      '“This life began outside drama school, so there are no acting abilities or techniques to show.”',
    ],
    mistakes: [
      'Reading Classes Reach as a cap: it’s where classes level off, and an hour of practice goes past it to full.',
      'Expecting a loved genre to make you better in it: loving one makes a day of its work a better day, and leaves the work as good as it was.',
    ],
    next: [
      'Open the ability with the most room to grow and press its exercise in the Practice column (Practice).',
      'Press Open Its Brief beside a genre to prepare and tape a practice brief (Preparing A Brief).',
      'After your first piece of work is judged, read What To Work On Next above the table.',
    ],
    related: ['craft.practice', 'craft.genre', 'craft.work', 'craft.identity', 'school.standing', 'body.how'],
    connections: [
      { to: 'start.guide', kind: 'prerequisite', why: `The profile opens with the guide’s chapter “${CHAPTER}”.` },
      { to: 'craft.practice', kind: 'optional', why: 'Each ability and technique has its exercise in the Practice column beside it.' },
      { to: 'craft.work', kind: 'optional', why: 'A piece of work in School Journey opens into how it was judged.' },
      { to: 'craft.identity', kind: 'optional', why: 'Your Work So Far, near the profile’s foot, reads the actor your work shows.' },
      { to: 'body.how', kind: 'optional', why: 'Current Condition shows the readiness today’s work meets, from how you are.' },
      { to: 'start.find', kind: 'optional', why: 'P opens the profile from anywhere but a text box.' },
    ],
    example: {
      setup: `A first-year early in the fall, “${CHAPTER}” read.`,
      steps: ['Press P.', `In Attributes And Craft, press ${DEPTH}.`, `Close it, and read ${TECHNIQUE_LABEL.scene}’s row in Techniques.`],
      result: `${DEPTH} opens with Now, Classes Reach and Last Change, how it grows, where it started, what it does, where it counts and its exercise, ${SENSE.label}. ${TECHNIQUE_LABEL.scene}’s Mastered column says how far it has to go to ${MASTERED}. The clock hasn’t moved.`,
    },
  },
  {
    id: 'craft.practice',
    title: 'Practice',
    goal: 'craft',
    covers: ['practice.exercise', 'look.ability'],
    synonyms: ['exercise', 'practice an hour', 'deliberate practice', 'practice tier', 'practice focus', 'spaced practice', 'live with a partner', 'train an ability', 'improve a skill', 'discipline', 'an ability'],
    questions: ['How do I improve an ability?', 'How do I get past where classes level off?', 'Which tier should I choose?', 'What does the focus do?', 'Why did an hour give less than the last?', 'How many hours can I practice a day?', 'Why is Practice An Hour refused?'],
    where: { route: PROFILE, label: 'Player Profile, The Practice Column' },
    available: `${OPENED}.`,
    short: `An hour on one exercise grows the ability or technique it trains, past where classes level off, all the way to full. Some exercises are named in real acting teaching, some are put together from real practice, and a few were made for the game. Each has three tiers (${andList(TIER.label)}) and ${FOCUS_LABELS.length} ways to spend the hour: ${orList(FOCUS_LABELS)}. The same exercise again on the same day gives ${pct(DEVELOPMENT.repeat)} of what the hour before gave, and only ${plural(PRACTICE.dailyHours, 'hour')} of practice a day count. Each day you practice grows your discipline once.`,
    steps: [
      'On the Player Profile, in Attributes And Craft or Techniques, press the exercise named in a row’s Practice column.',
      `Choose a Tier. The one for your level is marked Your Level: ${TIER.label[0]} under ${TIER.bands[0]}, ${TIER.label[1]} under ${TIER.bands[1]}, ${TIER.label[2]} from there.`,
      'Choose a Focus; the line under it says what it does.',
      'Read the line above the button: about how much the hour will add, to what, and why it’s more or less than an ordinary hour (the tier, the focus, a tired day, a repeat, discipline), figured the way the hour itself will be.',
      'Press Practice An Hour. What the hour found shows under the button, and the toast gives the gain.',
      'Press an ability’s name for its look: what it is, how it grows, where it started, what it does, how to practice it and its latest changes.',
    ],
    needs: [
      'A life in training, awake, out of hospital, free for the hour, and nothing on the calendar wanting you inside it.',
      `On your feet (${andList(ON_FEET)}): energy at ${SPENT} or more, and no injury that limits the body.`,
      `With a classmate (${andList(WITH_A_CLASSMATE)}), and Live With A Partner: a class to ask.`,
      `Under ${plural(PRACTICE.dailyHours, 'hour')} practiced today.`,
    ],
    costs: [
      { label: 'Time', value: plural(PRACTICE.minutes, 'minute') },
      { label: 'Energy', value: `${PRACTICE.energy.desk} at a desk, ${PRACTICE.energy.feet} on your feet, and ${TIER.aboveEnergy} more at a tier above your level` },
      { label: 'Money', value: 'None' },
    ],
    reads: [
      { label: 'The Hour’s Gain', value: `${DEVELOPMENT.sessionGain} points times the tier’s factor, the focus’s and the day’s focus, times the share of 100 still to go, never under ${pct(DEVELOPMENT.floor)} of it, and at least what ordinary work would give`, estimate: true },
      { label: 'The Tier', value: `${pct(TIER.matched)} at your level, ${pct(TIER.below)} a tier below, ${pct(TIER.above)} a tier above, ${pct(TIER.far)} two away`, estimate: true },
      { label: 'The Focus', value: `${FOCUS.steady.label} 100%; ${FOCUS.precision.label} ${pct(FOCUS_RATE.precision.rested)} rested and ${pct(FOCUS_RATE.precision.tired)} tired; ${FOCUS.spaced.label} ${pct(FOCUS_RATE.spaced.within)} a day to a week after the exercise’s last session, ${pct(FOCUS_RATE.spaced.outside)} otherwise; ${FOCUS.variation.label} ${pct(FOCUS_RATE.variation.primary)}, with ${pct(FOCUS_RATE.variation.transfer)} carried to each skill it’s kin to; ${FOCUS.live.label} ${pct(FOCUS_RATE.live.primary)}, with ${pct(FOCUS_RATE.live.transfer)} to listening and to adaptability`, estimate: true },
      { label: 'The Day’s Focus', value: 'Your readiness at the hour, as an early riser or a night owl meets it: a tired hour counts for less' },
      { label: 'Discipline', value: `Practice counts up to ${pct(DEVELOPMENT.disciplineLift)} more at discipline 100, and as much less at 0`, estimate: true },
      { label: 'A Repeat', value: `The same exercise again on the same day gives ${pct(DEVELOPMENT.repeat)} of the hour before it` },
    ],
    now: [
      'The hour passes and its energy is spent.',
      'What the exercise trains grows by the hour’s gain, and stops exactly at full.',
      `With ${FOCUS.variation.label} or ${FOCUS.live.label}, what it carries over to grows too, under its own line in Development History.`,
      'The first hour of a day grows discipline once.',
      'The exercise’s record keeps the session, its tier and its focus, and the kinds of material it counts as experience of, so material that asks for them prepares faster.',
    ],
    later: [
      'Every piece of work judged afterward uses what grew at its new level.',
      `${FOCUS.spaced.label} pays a day to a week after the exercise’s last session.`,
      'Discipline counts toward the consistency of most work and toward how much every gain counts, so days kept up add up.',
    ],
    interpret: [
      'What the hour found names the tier against your level (“Pitched at your level”, or that it went easily, or was a struggle), what the focus made of it, what carried over, and how far the level rose and where it stands.',
      '“Hour 2 on it today” means a repeat: another exercise would give more.',
      'Six or more sessions in a row on one exercise is said, with whether its gains are slowing as it nears full.',
      `A technique at ${MASTERED} or more is said to be past what any work asks: from there to 100 it moves no result, before the hour and after it, and on the technique’s look.`,
      `Attributes And Craft’s subtitle counts today’s practice against ${plural(PRACTICE.dailyHours, 'hour')}.`,
      // From 2026-10-17 (brief 11, A4) the look says what the ability does in its own sentence beside which work reads it, where
      // until then What It Does listed the work that reads it alone.
      'An ability’s look gives Now, Classes Reach and Last Change, how it grows, where it started, what it does, where it counts, and its exercise, said to be a named exercise, put together from real practice, or made for the game.',
    ],
    unavailable: [
      '“You haven’t started training, so there’s nothing to practice yet.”',
      '“Not from a hospital bed.”, “You’re asleep.”, “You’re at … until ….” or “… starts at …: there isn’t the time before it.”',
      `“You’ve practiced ${plural(PRACTICE.dailyHours, 'hour')} today, and more stops helping after that. Practice again tomorrow.”`,
      '“You’re too tired to work on your feet. Sleep first.”, or an injury’s “Not with …; it has … days yet to mend.”',
      // Until 2026-10-13 this named “It takes a classmate, and you have no class to ask.” and “This exercise has nothing it
      // carries over to.”, refusals no play reached, which went that day (`systems/practice.ts`).
      'Stamina has no exercise: its row says Work Out, under Look After Yourself. Discipline has none either: it grows from practice kept up, day after day.',
    ],
    mistakes: [
      'The same exercise hour after hour: each repeat gives half. Spread a day’s hours across exercises.',
      `Practicing a technique past ${MASTERED}: no piece of work asks more of it, so the hour changes no result.`,
      `${FOCUS.precision.label} on a tired day gives less than ${FOCUS.steady.label} would have. Keep it for a rested hour.`,
      `${FOCUS.spaced.label} the first time, the same day as the last, or more than a week after it gives ${pct(FOCUS_RATE.spaced.outside)}, less than ${FOCUS.steady.label}.`,
      `A tier two away from your level counts ${pct(TIER.far)}; the one marked Your Level counts in full.`,
    ],
    next: [
      'Practice on as many days as you can, not as many hours in one day: each day kept grows discipline once, and a repeat gives half.',
      'Read What To Work On Next on the Player Profile for the exercise most worth your hours (The Player Profile).',
      'Take what you’ve grown into a practice brief (Preparing A Brief).',
    ],
    related: ['craft.profile', 'body.look-after', 'body.sleep', 'craft.work'],
    connections: [
      { to: 'craft.profile', kind: 'prerequisite', why: 'Practice is done from the Player Profile, in the row of what it trains.' },
      { to: 'day.clock', kind: 'immediate', why: `Each hour of practice moves the clock ${plural(PRACTICE.minutes, 'minute')} and spends its energy.` },
      { to: 'craft.work', kind: 'evaluation', why: 'Every piece of work judged afterward uses what practice grew at its new level.' },
      { to: 'craft.brief-prepare', kind: 'immediate', why: 'An exercise counts as experience of the material it names, and a brief built on that material prepares faster.' },
      { to: 'craft.identity', kind: 'history', why: 'The material an exercise practices is kept in the record that Material You Know reads.' },
      { to: 'body.look-after', kind: 'optional', why: 'Stamina has no exercise: a workout under Look After Yourself builds it, and so does a class that trains the body as hard, attended.' },
      { to: 'body.sleep', kind: 'optional', why: `A rested hour counts for more: the day’s focus scales every hour, and ${FOCUS.precision.label} most.` },
    ],
    example: {
      setup: `${DEPTH} at ${PRACTICE_AT}, discipline at ${EVEN_DISCIPLINE}, and every hour rested, at a focus of 1.`,
      steps: [
        `Open ${SENSE.label} in ${DEPTH}’s row: the ${TIER.label[matchedTier(PRACTICE_AT)]} tier is marked Your Level.`,
        `Keep ${FOCUS.steady.label}, and press Practice An Hour.`,
        'Press it again later the same day.',
      ],
      result: `The first hour adds ${two(AT_60)}, to ${one(PRACTICE_AT + AT_60)}; the second, a repeat, adds ${two(AT_60_AGAIN)}. At the ${TIER.label[0]} tier the first would have added ${two(AT_60_BELOW)}. At ${PRACTICE_NEAR_FULL}, at the ${TIER_AT_85} tier marked Your Level there, the same hour adds ${two(AT_85)}: the rate never falls under ${pct(DEVELOPMENT.floor)} of a session’s, however near full.`,
    },
  },
  {
    id: 'craft.genre',
    title: 'Genres',
    goal: 'craft',
    covers: ['genre.study', 'look.genre'],
    synonyms: ['genre', 'study a genre', 'study it', 'study the genre', 'genre familiarity', 'genre practice', 'loved genre', 'genre requirements', 'knowing the genre', 'film of the kind', 'genre register', 'the genre asks'],
    questions: ['How do I get to know a genre?', 'What does studying a genre do?', 'Why does a genre’s scene play differently from another’s?', 'Does loving a genre make me better at it?', 'What does a genre ask of an actor?', 'Why is Knowing The Genre short on my brief?'],
    where: { route: PROFILE, label: 'Player Profile, Genres' },
    available: `${OPENED}.`,
    short: `Each of the ${FILM_GENRES.length} genres keeps two figures of yours: Familiarity, from studying it, and Work In It, from nights on stage and self-tapes in it. Study It is ${plural(ENGAGEMENT.genre.minutes, 'minute')} reading a play of the kind the game has, or watching a film of the kind where it has none. The better of the two is how well you know the genre: a taped brief in it counts that as part of its preparation, every point up to ${pct(BRIEF.complete.genre)} showing in the take, and a scene or a part from a play of its kind is prepared up to ${pct(ENGAGEMENT.genreSpeed)} faster. Loving a genre makes a day of its work a better day; it doesn’t make the work any better.`,
    steps: [
      'On the Player Profile, Genres lists every genre with what It Asks For, your Familiarity and your Work In It, and Study It and Open Its Brief.',
      'Find narrows the list by name, and Show picks All, Loved, Studied Or Worked In or With Requirements; the button under the list shows more.',
      'Press Study It, or Study The Genre inside an open brief.',
      'Press a genre’s name for its look: its conventions, what it asks of an actor, how its scenes are played, how to study it, whether you love it, and your latest takes in it.',
    ],
    needs: ['Awake, out of hospital, free for the time, and nothing on the calendar wanting you inside it.'],
    costs: [
      { label: 'Time', value: plural(ENGAGEMENT.genre.minutes, 'minute') },
      { label: 'Energy', value: String(ENGAGEMENT.energy.desk) },
      { label: 'Money', value: 'None: a play is read, or a film of the kind watched' },
    ],
    reads: [
      { label: 'Familiarity', value: `Each study adds ${pct(ENGAGEMENT.genre.study)} of what’s left to 100; the same genre again the same day adds half the one before`, estimate: true },
      { label: 'Work In It', value: `A take in it, or a night of a play of its kind, adds ${pct(ENGAGEMENT.genre.practice)} of what’s left, shared among the work’s genres; a take by how far it was prepared, ${pct(BRIEF.practiceUnprepared)} of that taped cold; a take that’s the same again adds half`, estimate: true },
      { label: 'Knowing The Genre', value: `The better of Familiarity and Work In It, in the brief’s best-known genre, counted toward a take’s interpretation: with none, ${pct(EVALUATION.partFloor.genre!)} of it stands, and every point to ${pct(BRIEF.complete.genre)} adds its share, complete there`, estimate: true },
      { label: 'Faster Preparation', value: `Up to ${pct(ENGAGEMENT.genreSpeed)} at 100: a scene for class from a play of the kind, and a part’s lines in one. A brief’s own steps speed up with material you’ve met before instead` },
      // A take of its brief reads it; a play’s night or a class scene reads its own material’s (until 2026-10-13 this said
      // “their work reads it”, which a farce’s night, reading no clown, didn’t).
      // From 2026-10-16 (`content/genre-register.ts`): every genre's scenes are played in a register.
      { label: 'How Its Scenes Are Played', value: `Every genre has one or two concerns, ${CONCERN_IDS.length} in all, such as ${CONCERNS.restraint.label}, ${CONCERNS.rhythm.label} or ${CONCERNS.spontaneity.label}. Every take of a brief written for it is judged more on what they lean toward and calls more on the abilities they ask, as strongly as a reading does. It shifts the balance and adds nothing: a take fully prepared at full ability comes to 100 in every genre` },
      { label: 'What It Asks For', value: `${APPLIED} genres ask a technique of an actor, where the research established it: their brief stages it, and a take of it calls for it. A night of a play of the kind, or a class scene from one, calls for its own material’s techniques instead` },
    ],
    now: [
      'The time passes, energy goes down, and the genre’s familiarity rises.',
      'A toast names the genre, the play or film you spent the time with, and the familiarity reached, of 100; the Familiarity column moves with it.',
    ],
    later: [
      'The next take of a brief in the genre uses the new figure.',
      'The next step on a scene, or the next lines learned, from a play of the kind goes faster by it.',
    ],
    interpret: [
      'It Asks For names each technique with your level against mastery, or says the research didn’t establish one: “Not established: the research rests on one example”, or “No more than any self-tape asks”.',
      'A genre’s look gives Familiarity, Work In It and Preparation: how much faster the better of the two makes a scene or a part from a play of its kind, where a brief’s steps speed up with material you’ve met before instead. It gives what the research found the genre asks, and how sure it is.',
      `Knowing The Genre, inside a brief, is the better of the first two against the ${pct(BRIEF.complete.genre)} that completes it.`,
      'The Genre Asks, inside a brief, names each of its genre’s concerns: what it asks, what a self-tape in it is judged more on and calls on, and which part of preparation answers it. A take held back most by an ability a concern asks for says so: “Composure held back the consistency by 4.2 points: Nordic Noir’s Feeling Held In asks for it”.',
      '“You love it” on a genre’s look means a day of its work is a better day: loving it doesn’t make the work faster or limit it.',
    ],
    unavailable: [
      '“There’s no such genre.”',
      '“Not from a hospital bed.”, “You’re asleep.”, “You’re at … until ….” or “… starts at …: there isn’t the time before it.”',
      LOCKED,
    ],
    mistakes: [
      'Studying one genre for hours in a day: each study the same day adds half the one before. One a day, over a few days, goes further.',
      'Playing every genre’s scene the same way: two scenes can stage the same features and still ask different things, since each genre’s register judges the take its own way. A way of playing it that leans where the genre does puts more of the take on what that genre asks.',
      `Studying on past ${pct(BRIEF.complete.genre)} for a take: past that it adds to a take no more, though it still speeds a scene or a part from a play of the kind.`,
      'Expecting a brief’s steps to go faster in a genre you know: they speed up with the material’s features you’ve met before, and the genre is its own part of the take.',
      `Taping cold to learn a genre: a take taped with nothing prepared counts ${pct(BRIEF.practiceUnprepared)} as much toward your work in it as a prepared take.`,
    ],
    next: [
      'Press Open Its Brief beside the genre, and prepare it (Preparing A Brief).',
      'Study it once a day until its brief’s Knowing The Genre is complete.',
    ],
    related: ['craft.brief-prepare', 'craft.brief-tape', 'craft.profile', 'coursework.prepare'],
    connections: [
      { to: 'craft.profile', kind: 'prerequisite', why: 'Genres is a panel of the Player Profile.' },
      { to: 'craft.brief-tape', kind: 'evaluation', why: `Knowing the genre is a part of a take’s preparation, read by its interpretation, complete at ${pct(BRIEF.complete.genre)}.` },
      { to: 'coursework.prepare', kind: 'immediate', why: 'A scene from a play of a kind you know is prepared faster, by the better of Familiarity and Work In It.' },
      { to: 'productions.part', kind: 'immediate', why: 'A part in a play of a kind you know is learned faster.' },
      { to: 'craft.brief-prepare', kind: 'optional', why: 'Open Its Brief, beside each genre, opens the practice brief written for it.' },
      { to: 'craft.identity', kind: 'history', why: 'The genres you’ve worked in are counted in Range.' },
    ],
    example: {
      setup: `A genre never studied, its brief open, Knowing The Genre at ${pct(UNSTUDIED / 100)} of the ${pct(BRIEF.complete.genre)} that completes it.`,
      steps: ['Press Study It.', 'Press it again the same evening.'],
      result: `The first study takes familiarity to ${one(FIRST_STUDY)}, and the second the same day only to ${one(SECOND_STUDY)}. Studied once a day from the start instead, it passes ${pct(BRIEF.complete.genre)} on day ${DAYS_TO_KNOW.days}, at ${one(DAYS_TO_KNOW.at)}: the brief’s Knowing The Genre is complete, and the genre’s look says a part in a play of its kind is learned ${pct(SPEED_KNOWN)} faster.`,
    },
  },
  {
    id: 'craft.brief-prepare',
    title: 'Preparing A Brief',
    goal: 'craft',
    covers: ['brief.prepare'],
    synonyms: ['practice brief', 'open its brief', 'break it down', 'learn the lines', 'rehearse it on your feet', 'the breakdown', 'brief preparation', 'beats', 'where it turns'],
    questions: ['How do I prepare a brief?', 'How far does each step go?', 'Why does one beat need more rehearsal?', 'Why can’t I rehearse it yet?', 'What’s a practice brief?'],
    where: { route: PROFILE, label: 'Player Profile, Genres, Open Its Brief' },
    available: `${OPENED}.`,
    short: `Every genre has a practice brief, an original scene written for the game, ${BRIEFS.length} in all: where and when it is, who the two of you are, what you want, what’s in the way, and its beats, where it turns. Three steps prepare it: ${BRIEF.steps.read.label} is the ground your reading stands on, ${BRIEF.steps.lines.label} the lines, and ${BRIEF.steps.rehearse.label} plays it through aloud with the beats placed. Each moves its part a share of what’s left, and a repeat the same day goes half as far. A beat a change of tone leads into, or one held two ways at once, asks more rehearsal than the rest.`,
    steps: [
      `On the Player Profile, in Genres, press Open Its Brief beside a genre.${SEVERAL ? ' Where a genre has more than one, the list beside the brief’s title picks which.' : ''}`,
      'Read The Scene and Where It Turns: each beat with its tone, “held at once” where it’s two.',
      `Press ${BRIEF.steps.read.label}, ${BRIEF.steps.lines.label} and ${BRIEF.steps.rehearse.label}; Preparation shows each part against what completes it.`,
      'Beat By Beat, Taped Now, under The Take, gives each beat’s own rehearsal against what it asks, once a reading is chosen.',
    ],
    needs: [
      'A reading isn’t needed: the steps can come first.',
      `${BRIEF.steps.rehearse.label}: ${pct(BRIEF.rehearseNeeds)} of the lines learned, energy at ${SPENT} or more, and no injury that limits the body.`,
      'Awake, out of hospital, free for the step’s time, and nothing on the calendar wanting you inside it.',
    ],
    costs: [
      { label: BRIEF.steps.read.label, value: plural(BRIEF.steps.read.minutes, 'minute') },
      { label: BRIEF.steps.lines.label, value: `${plural(BRIEF.steps.lines.minutes, 'minute')}, ${plural(BRIEF.steps.lines.minutesMedium, 'minute')} for a brief of medium length, or ${plural(BRIEF.steps.lines.minutesLong, 'minute')} for a long one` },
      { label: BRIEF.steps.rehearse.label, value: plural(BRIEF.steps.rehearse.minutes, 'minute') },
      { label: 'Money', value: 'None' },
    ],
    reads: [
      { label: 'A Step’s Reach', value: `${pct(BRIEF.steps.read.gain)} of what’s left for the breakdown and the lines, ${pct(BRIEF.steps.rehearse.gain)} for rehearsal, at a focus of 1; a repeat the same day goes half as far as the one before`, estimate: true },
      { label: 'Your Focus', value: 'The day’s focus at the hour: a tired step goes less far' },
      { label: 'Your Way Of Working', value: `How you read around a text moves the breakdown, and how you drill lines moves the lines, each from ${pct(KNOB_LIMITS.readsAround[0])} to ${pct(KNOB_LIMITS.readsAround[1])}, by your traits and dispositions` },
      { label: 'Your Imagination, Memory And Listening', value: `${BRIEF.steps.read.label} goes further with imagination, ${BRIEF.steps.lines.label} with memory, and ${BRIEF.steps.rehearse.label} with listening, played off the reader (a voice brief at a microphone has none): ${pct(STEP_SPEED.least)} as far at 0, as far as the step says at 50, ${pct(STEP_SPEED.most)} at 100`, estimate: true },
      { label: 'Material Met Before', value: `The kinds of material the brief is built on, each counted up to ${plural(EXPERIENCE.fullAt, 'time')} met or practiced: every step goes up to ${pct(ENGAGEMENT.genreSpeed)} faster once all of them are, by their mean` },
      { label: 'What Completes It', value: `The breakdown at ${pct(BRIEF.complete.interpretation)}, the lines at ${pct(BRIEF.complete.memorization)}, and rehearsal at ${pct(BRIEF.complete.rehearsal)} in a beat, ${pct(PIECE.brief.perTurn)} more in a beat a change of tone leads into and ${pct(PIECE.brief.perBlend)} more in one held two ways, ${pct(BRIEF.complete.mostRehearsal)} at most` },
      { label: 'Knowing The Genre', value: `A fourth part, from studying the genre and working in it, complete at ${pct(BRIEF.complete.genre)}; with none, a take keeps ${pct(EVALUATION.partFloor.genre!)} of what it reaches` },
    ],
    now: [
      'The step’s time passes and its part rises; the toast says how far.',
      `${BRIEF.steps.read.label} practices imagination and ${BRIEF.steps.lines.label} memory, a little, while the part still rises.`,
      `${BRIEF.steps.rehearse.label} also rehearses how you chose to play it, brings a classmate reading with you along, and counts as experience of the brief’s material, so the next step goes a little faster. In a brief built on the body or the voice, it practices that too.`,
    ],
    later: [
      'The next take judges each part against what completes it; a part left short holds back the qualities that depend on it.',
      'Preparation keeps from day to day: it doesn’t fade.',
    ],
    interpret: [
      `Preparation shows The Breakdown, The Lines, Rehearsal and Knowing The Genre, each as so much of what completes it; Rehearsal’s against the ${pct(BRIEF.complete.rehearsal)} a beat asks with no turn into it and one tone.`,
      'Its Rehearsal, Beat By Beat, is each beat’s own: the brief’s rehearsal, and any work on that beat alone from Work It Through.',
      'Past what every beat asks, more rehearsal adds nothing to a take.',
    ],
    unavailable: [
      '“There’s nothing more to gain from it now.”: the part is at 97% or more. Rehearsal still goes on while a way of playing it, once chosen, isn’t fully rehearsed yet.',
      '“Learn some of the lines first: there’s nothing to rehearse without them.”',
      `“You’re too tired to work on your feet. Sleep first.”, or an injury still mending, for ${BRIEF.steps.rehearse.label}.`,
      '“Not from a hospital bed.”, “You’re asleep.”, “You’re at … until ….” or “… starts at …: there isn’t the time before it.”',
      LOCKED,
    ],
    mistakes: [
      'The same step over and over in a day: each repeat goes half as far as the one before. A step a day goes further.',
      'Rehearsing to the brief’s plain figure: a beat a turn leads into asks more. Read Beat By Beat, and work a short beat with Work It Slowly.',
      `Changing the reading once the breakdown is done: it keeps ${pct(BRIEF.readingKept)}, and Break It Down has to be done again.`,
    ],
    next: [
      'Choose a reading and how to play it (A Reading And A Way To Play It).',
      'Choose who reads with you before you rehearse (Who Reads With You).',
      'When each part is complete, tape it (Taping A Brief).',
    ],
    related: ['craft.brief-choose', 'craft.brief-reader', 'craft.brief-tape', 'craft.genre', 'coursework.workbook'],
    connections: [
      { to: 'craft.genre', kind: 'prerequisite', why: 'A brief opens from its genre’s row in Genres, with Open Its Brief.' },
      { to: 'craft.brief-tape', kind: 'evaluation', why: 'The take judges each part of the preparation against what completes it, and rehearsal beat by beat.' },
      { to: 'craft.brief-choose', kind: 'immediate', why: `${BRIEF.steps.rehearse.label} rehearses the way you chose to play it, at ${pct(PLAYING.gainShare)} of the step’s reach.` },
      { to: 'craft.brief-reader', kind: 'immediate', why: `A classmate reading with you learns it as you rehearse, at ${pct(BRIEF.reader.rehearse)} of the step’s reach.` },
      { to: 'craft.profile', kind: 'immediate', why: `${BRIEF.steps.read.label} practices imagination and ${BRIEF.steps.lines.label} memory, a little each time the part rises.` },
      { to: 'coursework.workbook', kind: 'optional', why: 'Work It Through works one beat at a time: Work It Slowly raises that beat’s own rehearsal.' },
    ],
    example: {
      setup: `${DRAMA.title}, the drama’s brief: ${plural(DRAMA.beats.length, 'beat')}, ${plural(TURNS.transitions, 'change')} of tone and ${TURNS.blends} held two ways, with lines of medium length. A rested day at a focus of 1, no trait moving a step, imagination and memory at 50, and none of its material met before.`,
      steps: [
        `Day one: ${BRIEF.steps.read.label}, ${BRIEF.steps.lines.label} and ${BRIEF.steps.rehearse.label}, once each.`,
        'Day two: the same again.',
      ],
      result: `Day one leaves the breakdown and the lines at ${pct(afterDays(READ_GAIN, 1))} and rehearsal at ${pct(afterDays(REHEARSE_GAIN, 1))}. Its rehearsal was practice in the brief’s material, so day two’s steps go ${pct(DAY_TWO_SPEED - 1)} faster: the breakdown and the lines to ${pct(afterTwoDays(READ_GAIN))}, past the ${pct(BRIEF.complete.interpretation)} that completes them, and rehearsal to ${pct(afterTwoDays(REHEARSE_GAIN))}. The beats ask ${andList(BEAT_ASKS.map(pct))}: the one a turn leads into and held two ways asks most, and ${afterTwoDays(REHEARSE_GAIN) >= MOST_ASKED ? 'every beat is met' : 'it’s still short'}. ${duration(PREP_MINUTES * 2)} in all.`,
    },
  },
  {
    id: 'craft.brief-choose',
    title: 'A Reading And A Way To Play It',
    goal: 'craft',
    covers: ['brief.choose'],
    synonyms: ['reading', 'your reading', 'read it this way', 'change the reading', 'how you’ll play it', 'play it this way', 'pace', 'scale', 'structure', 'measured or driven', 'restrained or expansive', 'set or open'],
    questions: ['Which reading is right?', 'What happens if I change the reading?', 'What do measured, driven, restrained, expansive, set and open do?', 'Why doesn’t a way of playing it fit?', 'How do I answer a callback’s note?'],
    where: { route: PROFILE, label: 'Player Profile, Its Brief, Your Reading' },
    available: `${OPENED}.`,
    short: `Before a take, choose how you read the scene and how you’ll play it. Each brief supports two readings or more, and none is the right answer: a reading changes what the take is judged on most and which abilities it calls on, shifting the balance and adding nothing, and the beat whose tones lean its way most counts more, where one beat does. How you’ll play it comes as three choices, each between two ways or left open: ${andList(AXIS_WORDS)}. Choosing a way isn’t rehearsing it: you rehearse it on your feet before it pays off.`,
    steps: [
      'In an open brief, under Your Reading, read each one: what it takes the scene to be, what in the brief it rests on, and what it would come to for you now, fully prepared.',
      'Pick one and press Read It This Way, or Change The Reading once one is chosen.',
      'Under How You’ll Play It, pick a side of any axis; each shows What It Draws On and what the take would come to Fully Prepared. Leave The Pace Open, or the Scale or the Structure, takes a side back.',
      'Press Play It This Way, or Change How You Play It.',
      `Then ${BRIEF.steps.rehearse.label}: that’s where the way you chose gets rehearsed.`,
    ],
    needs: ['An open brief; How You’ll Play It shows once a reading is chosen.'],
    costs: [
      { label: 'Time', value: 'None: the choice is made at once' },
      { label: 'Money', value: 'None' },
    ],
    reads: [
      { label: 'A Reading', value: `What it leans toward, raised to the power ${BRIEF.readingLean}, and the abilities it calls on at ${BRIEF.readingDraw} times their share, then evened out so the balance shifts and the total stays the same`, estimate: true },
      { label: 'The Reading’s Heart', value: `The beat whose tones lean most the way the reading leans counts ${BRIEF.readingHeart} times the others in the take, where one beat does`, estimate: true },
      { label: 'A Way Of Playing It', value: 'Each side leans what you’re judged on toward what it is, and calls on the abilities shown under What It Draws On. Stamina isn’t among them for a brief: a take uses stamina only as it drains through the beats, however you play it' },
      { label: 'How Rehearsed It Is', value: `Complete at the scene’s own mark, ${pct(PLAYING.complete)} where it leans neither way on the side and ${pct(PLAYING.complete - GRAIN.prep)} to ${pct(Math.min(1, PLAYING.complete + GRAIN.prep))} by how well it suits it; ${BRIEF.steps.rehearse.label} moves it ${pct(PLAYING.gainShare)} of the step’s reach, of what’s left, until it’s there` },
      { label: 'Fit', value: `A side the brief’s text forbids, or the other side to a callback’s note, holds what it leans on to ${pct(MISFIT)} of itself`, estimate: true },
    ],
    now: [
      `A first reading is set. A new one keeps ${pct(BRIEF.readingKept)} of the breakdown, and the toast says where it stands.`,
      `A new way of playing it keeps ${pct(PLAYING.keptOnChange)} of its rehearsal; the same way chosen again keeps all of it.`,
      'A side newly chosen counts once in the record your habits are read from. Change The Reading, the same way chosen again, and a side kept while another axis changes count nothing more.',
    ],
    later: [
      'The next take uses the reading, and the way as far as you’ve rehearsed it by then.',
      'Work It Through can play one beat its own way, on an axis the whole leaves open.',
    ],
    interpret: [
      'The figure beside each reading and each side is the take fully prepared, on a good day, with no draw: what the choice can reach for you now, against the others.',
      '“Doesn’t fit:” under a side says why: the brief’s text forbids it, or the callback has asked for the other.',
      'The line under the table gives the take played this way against nothing chosen, and how far you’ve rehearsed the way.',
      'At full ability every reading, and every way that fits, reaches 100. Below it, the one that leans on what you do well shows you better.',
    ],
    unavailable: [
      '“There’s no such brief.” or “That isn’t a reading this brief supports.”',
      'How You’ll Play It shows only once a reading is chosen.',
      LOCKED,
    ],
    mistakes: [
      `Changing the reading just before the take: it keeps ${pct(BRIEF.readingKept)} of the breakdown. Break It Down again first.`,
      'Choosing a way and taping straight away: a way you haven’t rehearsed is a part of your preparation left short, and holds back what it leans on most.',
      'Playing against a callback’s note: the callback stays yours until a take plays it the way the note asks.',
    ],
    next: [
      `${BRIEF.steps.rehearse.label} until the way you chose is rehearsed (Preparing A Brief).`,
      'Choose who reads with you (Who Reads With You), then tape it (Taping A Brief).',
    ],
    related: ['craft.brief-prepare', 'craft.brief-tape', 'craft.identity', 'coursework.playing'],
    connections: [
      { to: 'craft.brief-prepare', kind: 'immediate', why: `A new reading keeps ${pct(BRIEF.readingKept)} of the breakdown.` },
      { to: 'craft.brief-tape', kind: 'evaluation', why: 'The take uses the reading and the way it’s played: what they lean toward, the abilities they call on, and how far the way is rehearsed.' },
      { to: 'craft.identity', kind: 'history', why: 'Each side newly chosen, and each take’s reading, is counted toward the habits Your Work So Far names.' },
      { to: 'coursework.playing', kind: 'optional', why: 'A scene for class is played the same three ways, chosen the same way.' },
      { to: 'coursework.workbook', kind: 'optional', why: 'Play This Part Another Way plays one beat its own way, on an axis the whole leaves open.' },
    ],
    example: {
      setup: `${DRAMA.title}, by an actor at ${UNEVEN_LEVELS.emotionalDepth} in ${abilityLabel('emotionalDepth')}, ${UNEVEN_LEVELS.composure} in ${abilityLabel('composure')}, ${UNEVEN_LEVELS.listening} in ${abilityLabel('listening')} and in ${abilityLabel('adaptability')}, and ${UNEVEN_REST} in everything else, techniques too, with ${abilityLabel('stamina').toLowerCase()} at ${pct(UNEVEN.ability('stamina') / UNEVEN.full('stamina'))} of its full.`,
      steps: [`Read the figure beside ${READING_ONE.label}.`, `Read the one beside ${READING_TWO.label}.`, `With the breakdown at ${pct(BRIEF.complete.interpretation)}, change from the first to the second.`],
      result: `Fully prepared, ${READING_ONE.label} comes to ${one(FIRST_READING)} and ${READING_TWO.label} to ${one(SECOND_READING)}: ${FIRST_READING >= SECOND_READING ? 'the first' : 'the second'} leans on what this actor does well. The change leaves the breakdown at ${pct(BRIEF.complete.interpretation * BRIEF.readingKept)}.`,
    },
  },
  {
    id: 'craft.brief-reader',
    title: 'Who Reads With You',
    goal: 'craft',
    covers: ['brief.reader'],
    synonyms: ['reader', 'read with', 'read with them', 'a recording of the other lines', 'reading partner', 'classmate reader', 'the take with its reader', 'take together'],
    questions: ['Who should read opposite me?', 'Does a classmate reading with me change my result?', 'Why did the take with the reader come out lower?', 'What earns a callback?', 'Why won’t a classmate read with me?'],
    where: { route: PROFILE, label: 'Player Profile, Its Brief, Read With' },
    available: `${OPENED}.`,
    short: `A take on camera is played to someone reading the other lines off camera: A Recording Of The Other Lines, or a classmate. Your own take uses none of it. The take with the reader, what a casting office would see, blends in what the reader brought, most of all in connection and responsiveness, as far as the scene is played off them, and it’s what earns a callback. A recording answers on cue and never slips, but can’t listen. A classmate starts with nothing prepared and learns it as you rehearse together; prepared, they bring more than a recording, and on a bad day they can slip.`,
    steps: [
      'In an open brief, The Scene says who the reader plays and How They Play It: what playing against them asks.',
      'Under Read With, choose A Recording Of The Other Lines or a classmate, and press Read With Them.',
      'The line below says how far a classmate has it prepared with you.',
      `${BRIEF.steps.rehearse.label} brings them along, while it’s still open to you; so does Run It With Your Partner in Work It Through, once Work It Through names them as not there yet: the take with them ${PARTNER_GAP} points or more under your own.`,
      'After a take, The Last Take says what the take with the reader came to, and why.',
    ],
    needs: [
      'A brief on camera: one recorded alone at a microphone has nobody to read with, and the choice isn’t shown.',
      `A classmate who trusts you: under ${WORK.trust.wary}, they’d rather not.`,
    ],
    costs: [
      { label: 'Time', value: 'None to choose' },
      { label: 'Money', value: 'None' },
    ],
    reads: [
      { label: 'What The Reader Brings', value: `Their preparation, counting ${pct(ENSEMBLE.prepFloor)} with none done and all of it once complete, times their timing`, estimate: true },
      { label: 'A Recording', value: `Fully prepared, never slipping, at a timing of ${pct(BRIEF.reader.recording)}: it brings ${pct(RECORDING_BRINGS)}`, estimate: true },
      { label: 'A Classmate’s Timing', value: 'Half at the least, rising with their listening and focus' },
      { label: 'A Classmate’s Preparation', value: `None at first. Each ${BRIEF.steps.rehearse.label} takes them ${pct(BRIEF.reader.rehearse)} of the step’s reach through what they have left, ${pct(BRIEF.reader.rehearse * REHEARSE_GAIN)} at a focus of 1, and Run It With Your Partner ${pct(WORKBOOK.partnerGain)}`, estimate: true },
      { label: 'Their Share', value: `In a scene built on the partner: ${andList(SHARES)}, and less as the scene is played off them less`, estimate: true },
      { label: 'How They Play It', value: `How the brief has the other part played, whoever reads it: ${READER_WAYS.join('; ')}. Playing against it shifts the balance of what the take is judged on and adds nothing`, estimate: true },
      { label: 'A Slip', value: `The chance on a take is ${pct(ENSEMBLE.slipRate)} of how unreliable they are: a classmate is ${pct(WORK.reliability.from)} to ${pct(WORK.reliability.to)} reliable, so at the least reliable about one take in ${SLIP_ODDS}. It takes ${pct(ENSEMBLE.slipBy)} of what they bring, divided by the number of beats, less the share your listening and adaptability cover`, estimate: true },
    ],
    now: [
      'A new classmate starts with nothing prepared; choosing the one already reading keeps what they have.',
      'Choosing the recording, or another classmate, sets the first aside, and what they had prepared goes with them.',
    ],
    later: [
      `Each take works out the take with the reader beside your own. ${BAND_LABEL.strong}, ${STRONG} or more, earns a callback where the take wasn’t one itself.`,
      `With a classmate, a take together at ${BAND_LABEL.strong} or better adds ${TOGETHER_BOND} to your bond, more or less by how warmly you take to people, and a slip of theirs you cover at least half of adds ${TOGETHER_COVERED} to their trust, and stays in what they remember of you.`,
      'Every take with a reader counts toward Playing With Others in Your Work So Far.',
    ],
    interpret: [
      '“Together it came to …, about what your own work did”, or so much under or over it. Under says why (they came less prepared, your readings were apart, they slipped and whether you covered most of it), then “Your own result stands as it is.”',
      `A recording brings ${Math.round(RECORDING_BRINGS * 100)} to each share of the scene it holds: the take with it comes out under your own where your own work tops ${Math.round(RECORDING_BRINGS * 100)} there, and over it where it falls short of that.`,
      'A brief recorded alone at a microphone has no take with a reader and no How They Play It, and its callback reads your own take.',
    ],
    unavailable: [
      '“It’s recorded alone at a microphone: there’s nobody to read with.”',
      '“That isn’t one of your classmates.”',
      `“… would rather not, after how things have gone.”: their trust in you is under ${WORK.trust.wary}. Each rehearsal kept with them adds ${WORK.trust.kept}.`,
      LOCKED,
    ],
    mistakes: [
      'Choosing a classmate on the day of the take: they start with nothing, and the take with them comes out under the recording’s. Choose them before you rehearse: once your own rehearsal is at 97% or more and any way you chose is fully rehearsed, Rehearse It On Your Feet says “There’s nothing more to gain from it now.”, and only Run It With Your Partner, while Work It Through names them, brings them along.',
      'Switching readers to try one: switching back starts the first from nothing again.',
      'Reading a lower take together as weaker work of yours: your own result is kept apart, and your record keeps it.',
    ],
    next: [
      `Rehearse with them before you tape: ${BRIEF.steps.rehearse.label} brings them along (Preparing A Brief).`,
      'Tape it, and read in The Last Take how it went with your reader (Taping A Brief).',
    ],
    related: ['craft.brief-tape', 'coursework.partners', 'coursework.workbook', 'craft.identity'],
    connections: [
      { to: 'craft.brief-tape', kind: 'evaluation', why: 'The take with its reader is what earns a callback; your own take uses none of it.' },
      { to: 'coursework.partners', kind: 'immediate', why: `A take with a classmate at ${BAND_LABEL.strong} or better together adds about ${TOGETHER_BOND} to your bond; a slip of theirs you cover at least half of adds ${TOGETHER_COVERED} to their trust.` },
      { to: 'coursework.workbook', kind: 'optional', why: `Run It With Your Partner brings a classmate reading with you ${pct(WORKBOOK.partnerGain)} of the way they have left.` },
      { to: 'craft.identity', kind: 'history', why: 'Every take with a reader counts toward Playing With Others, with the slips and those you covered.' },
    ],
    example: {
      setup: `${DRAMA.title}, a scene built on the partner, read ${READING_ONE.label}, prepared over the two days under Preparing A Brief with the genre known, and taped at readiness 80 with no draw: your own take at ${one(TAPED.e.overall)} (${band(TAPED.e.overall)}). A classmate whose listening and focus are 70 reads, and doesn’t slip. Three ways to the same first take, each instead of the others: a first take at ${BAND_LABEL.strong} together earns a callback, and the next is pitched harder.`,
      steps: [
        'Tape it with the recording reading.',
        `Or choose the classmate after the two days, and work their part through first: Run It With Your Partner, then ${BRIEF.steps.rehearse.label} once more, the day’s first.`,
        'Or choose the classmate before the two days, so both days’ rehearsals bring them along.',
      ],
      result: `With the recording, the take together comes to ${one(WITH_RECORDING)}, ${band(WITH_RECORDING)}. The classmate chosen after the two days would bring it to ${one(WITH_NEW_MATE)}, ${one(TAPED.e.overall - WITH_NEW_MATE)} under your own${TAPED.e.overall - WITH_NEW_MATE >= PARTNER_GAP ? ', so Work It Through names them as not there yet' : ''}. Run It With Your Partner takes them to ${pct(MATE_AFTER_RUN)} and the take to ${one(WITH_MATE_RUN)}; the rehearsal after it takes them to ${pct(MATE_RUN_REHEARSED)} and the take to ${one(WITH_MATE_RUN_REHEARSED)}, ${band(WITH_MATE_RUN_REHEARSED)}. Chosen before the two days, they come to it ${pct(MATE_AFTER_TWO)} prepared, and the take to ${one(WITH_MATE_TWO)}; fully prepared, they’d bring it to ${one(WITH_MATE_FULL)}${WITH_MATE_FULL > TAPED.e.overall ? ', over your own' : ''}. Your own take is ${one(TAPED.e.overall)} whoever reads, and a callback is earned from ${STRONG} together.`,
    },
  },
  {
    id: 'craft.brief-tape',
    title: 'Taping A Brief',
    goal: 'craft',
    covers: ['practice.self_tape'],
    synonyms: ['self-tape', 'tape it', 'the take', 'a take', 'callback', 'beat by beat', 'your takes of it', 'the last take', 'taped brief'],
    questions: ['How is a take judged?', 'What earns a callback?', 'How do I answer a callback?', 'Why is my take worth half as practice?', 'What does a take grow?', 'Why can’t I tape yet?'],
    where: { route: PROFILE, label: 'Player Profile, Its Brief, The Take' },
    available: `${OPENED}.`,
    short: `Tape It plays the brief to the camera, or to the microphone, for ${plural(SELF_TAPE.minutes, 'minute')}, and it’s judged as finished work, beat by beat: each beat with its tones and its own rehearsal, stamina telling as the take goes on, and a slip in the beat before, which composure and adaptability recover from. The take is the beats’ mean. It goes on your record, grows your ${TECHNIQUE_LABEL.screen} technique and your work in the genre, and a ${BAND_LABEL.strong} take with its reader earns a callback: a harder pitch with a note on how to play it, answered only by a take played that way.`,
    steps: [
      'Choose a reading. The line under The Take then gives what a take would come to now, its band, what holds it back most, and what this take would be for.',
      'Read Beat By Beat, Taped Now, and work a problem through first if one shows.',
      `Press Tape It (${SELF_TAPE.minutes} Min). The toast gives the result and its band.`,
      `The Last Take gives the result, the reading and the way played, what it was for and what held it back, the take with its reader, its beats and each quality. Your Takes Of It keeps the last ${BRIEF.takesKept}.`,
      'With a callback, its note shows above How You’ll Play It: choose the side it asks, rehearse it in, and tape.',
      `What To Work On names the ability or technique most worth ${ADVICE.sessions} hours of practice now, forecast on your recent work, with its practice; where that isn’t what held your last piece back most, it says so and why. Where It Would Show Next lists briefs to tape next, each with why and a button that opens it.`,
    ],
    needs: [
      'A reading chosen, and a life in training.',
      'Awake, out of hospital, free for the hour, and nothing on the calendar wanting you inside it.',
    ],
    costs: [
      { label: 'Time', value: plural(SELF_TAPE.minutes, 'minute') },
      { label: 'Energy', value: String(ENGAGEMENT.energy.desk) },
      { label: 'Money', value: 'None' },
    ],
    reads: [
      { label: 'What It’s Judged As', value: `${TAPE.label}, each quality counting toward the whole by its share: ${andList(TAPE_WEIGHTS)}; ${ON_ITS_FEET.label} where the scene is built on physical work, and an injury then reaches its execution and consistency` },
      { label: 'How Hard It Is', value: `Pitched at a student, at ${signed(BRIEF.difficulty)}; a callback at ${signed(Math.round((BRIEF.difficulty + BRIEF.callback) * 100) / 100)}, near a professional’s 0${STAKES_VARY ? `; and ${BRIEF.stakes} more for each step more than usual rides on the scene, as much less for each step less` : ''}`, estimate: true },
      { label: 'Each Beat', value: 'Its tones lean it, a comic beat toward execution and responsiveness, a grave one toward believability and consistency; and it judges its own rehearsal against what it asks' },
      { label: 'What It Asks Of You', value: 'The scene’s own demands: a medium or a long one asks memory, more riding on it composure (in consistency, and a little in believability), little of a reader to play off presence, more than three beats discipline, grave beats emotional depth, comic ones focus, lyric or grotesque ones imagination; and timing, the body, a partner, the voice and improvisation what each always asked. An ability it asks more of takes more of a quality’s share from the rest', estimate: true },
      { label: 'Stamina', value: `A drain that grows beat by beat, harder the longer, the more physical and the more vocal the scene, and the lower your stamina: at most ${pct(PIECE.drain)} off what tiring reaches, at the end of the hardest piece with none`, estimate: true },
      { label: 'A Slip', value: `A beat ${PIECE.slipAt} points or more under what it was expected to come to carries up to ${pct(PIECE.rattle)} of itself into the next beat’s believability and consistency, less as composure and adaptability recover it`, estimate: true },
      { label: 'The Whole', value: `${pct(EVALUATION.meanShare)} the qualities’ average, each by its share, and the rest the weakest of them; the take is its beats’ average, each by its share` },
      { label: 'The Bands', value: `${BAND_LABEL.unready} under ${EVALUATION.bands.working}, ${BAND_LABEL.working} from ${EVALUATION.bands.working}, ${BAND_LABEL.strong} from ${STRONG}, ${BAND_LABEL.exceptional} from ${EVALUATION.bands.exceptional}` },
    ],
    now: [
      `The hour passes and energy goes down ${ENGAGEMENT.energy.desk}.`,
      `The take goes on your work record, named for the brief and its reading, and on the brief’s own record, which keeps the last ${BRIEF.takesKept}.`,
      `It grows ${TECHNIQUE_LABEL.screen}, or ${TECHNIQUE_LABEL.voiceover} at a microphone, and any technique the scene stages, toward where classes level off, and is practice in the brief’s genres, by how far it was prepared: ${pct(BRIEF.practiceUnprepared)} of a prepared take’s, taped cold.`,
      'A take that’s the same again (the same reading, played the same way, no better prepared) is worth half as practice, and the same brief again the same day halves the genre’s practice again.',
      'The take with its reader is worked out beside your own, and a classmate who read moves with it.',
      `A take with its reader at ${STRONG} or more (your own take, at a microphone) earns a callback, where it wasn’t one itself: one side of one axis the brief leaves open, said before the next take.`,
    ],
    later: [
      'A callback stays until a take plays it the way its note asks; that take ends the round, and only a take that isn’t a callback earns the next.',
      'What held the take back is counted by Your Work So Far; What To Work On Next forecasts every ability and technique the take called on, so what held it back most and what pays most to train can be two things, and the pane says which. The next suggestions in Where It Would Show Next follow from what it names.',
    ],
    interpret: [
      'What a take is for is said plainly: a first take, a callback, another reading, the same reading played another way, better prepared or better able than last time, or the same again, worth half as practice.',
      'Beat By Beat gives each beat’s Result, Its Rehearsal against what it asks, Stamina (Holding, or Tiring with how much off) and What Happened: a slip, shaken by the slip before, what cost it most, or As expected.',
      'Continuity, under the beats, is how evenly the character held: shown beside the take, never added to it.',
      '“Played against the callback’s note: the callback is still yours.” means the note wasn’t answered.',
      'Where It Would Show Next suggests up to five, each with why: a callback waiting; the brief you haven’t taped that leans most on the weakness What To Work On names, or on the one your work keeps coming back to where recent work names none (once every brief is taped, the one leaning most); one built on material your work hasn’t met; one taped before that takes it the other way from a habit; the brief of the genre your work knows least, new to you; and a reading of a taped brief you haven’t tried.',
      'A weakness no practice brief reads is suggested no brief, and What To Work On says so: “No practice brief reads …, so a take won’t show it and none is suggested for it.”',
    ],
    unavailable: [
      '“Choose a reading first: a take is of the scene played one way, and you should know which before the camera rolls.”',
      '“Your training hasn’t begun: there’s no craft to tape yet.”',
      '“There’s no such genre.”, “There’s no such brief.” or “… isn’t a scene of that genre.”',
      '“Not from a hospital bed.”, “You’re asleep.”, “You’re at … until ….” or “… starts at …: there isn’t the time before it.”',
      LOCKED,
    ],
    mistakes: [
      'Taping the same take again with nothing changed: it counts, and teaches half as much. Change the reading, the way or the preparation.',
      `Taping tired: under readiness ${EVALUATION.sufficientReadiness}, tiredness holds back what it reaches and widens the draw downward.`,
      'Taping a callback without changing how you play it: it stays unanswered, pitched harder than a first take.',
      'Taping a scene built on physical work with an injury still mending: it reaches the take’s execution and consistency.',
    ],
    next: [
      'Read The Last Take and What To Work On, then practice what it names (Practice).',
      'With a callback, choose the side its note asks, rehearse it, and tape again.',
      'Open a brief Where It Would Show Next suggests.',
    ],
    related: ['craft.brief-choose', 'craft.brief-reader', 'craft.work', 'coursework.workbook'],
    connections: [
      { to: 'craft.brief-choose', kind: 'prerequisite', why: 'A take needs a reading chosen first.' },
      { to: 'craft.work', kind: 'history', why: 'Each take is kept on your work record, and opens there into how it was judged, beat by beat.' },
      { to: 'craft.genre', kind: 'immediate', why: 'A take is practice in the brief’s genres, one session’s worth shared among them.' },
      { to: 'craft.profile', kind: 'immediate', why: `A take grows ${TECHNIQUE_LABEL.screen}, or ${TECHNIQUE_LABEL.voiceover}, toward where classes level off.` },
      { to: 'craft.identity', kind: 'history', why: 'Takes and their readings are read for habits, and a callback answered counts toward Taking Direction.' },
      { to: 'coursework.workbook', kind: 'optional', why: 'Work It Through names the problems the forecast shows before you tape: a beat not secure, a turn, stamina late.' },
      { to: 'body.sleep', kind: 'optional', why: `Rested, at readiness ${EVALUATION.sufficientReadiness} or more, tiredness costs a take nothing.` },
    ],
    example: {
      setup: `${DRAMA.title}, read as ${READING_ONE.label} and fully prepared, by an actor at ${AT} in every ability and technique, rested at readiness 80, with no draw.`,
      steps: ['Press Tape It.', 'Read The Last Take, beat by beat.', 'Tape the callback it earns, at the same level, with nothing else changed.'],
      result: `It comes to ${one(TAPED.e.overall)}, ${band(TAPED.e.overall)}: its beats ${andList(TAPED.e.piece!.segments.map((s) => one(s.overall)))}, the last beat ${pct(1 - LAST_BEAT.drain)} off for stamina, continuity ${one(TAPED.e.piece!.continuity)}. ${CHIEF ? `${CHIEF}.` : ''} With the recording reading, the take together is ${one(WITH_RECORDING)}, ${WITH_RECORDING >= STRONG ? 'enough for a callback' : 'short of a callback'}. Pitched as a callback, the same take comes to ${one(CALLBACK.e.overall)}, ${band(CALLBACK.e.overall)}, and played no differently it leaves the note unanswered: the callback is still yours.`,
    },
  },
  {
    id: 'craft.work',
    title: 'A Piece Of Work, Explained',
    goal: 'craft',
    covers: ['look.work'],
    synonyms: ['work record', 'a result', 'dimensions', 'believability', 'interpretation', 'connection', 'execution', 'consistency', 'responsiveness', 'what held it back', 'limits', 'continuity', 'part by part', 'moment by moment', 'what the teacher looks for'],
    questions: ['How was my work judged?', 'What held my work back?', 'What do the six dimensions mean?', 'Why isn’t my result 100?', 'What’s continuity?', 'Why can’t I open an old piece of work?'],
    where: { route: PROFILE, label: 'Player Profile, School Journey, A Piece Of Work' },
    available: `${OPENED}.`,
    short: `Every piece of finished work, a take, a showing in class or a night on stage, is judged the same way, and opens into why. Each quality your teacher looks for in it (${andList(Object.values(DIMENSION_LABEL).map((d) => d.toLowerCase()))}) comes from the abilities and techniques it calls on, your preparation, the day’s condition and whether the way you played it fit; the whole is mostly their average, each counting by its share, and partly the weakest of them. A piece in parts, a brief’s beats, a scene’s tones or a play’s movements, is judged moment by moment, and the result is their average. Every ability full, every technique mastered, the preparation complete, a sufficient day and a way of playing it that fits: 100.`,
    steps: [
      'On the Player Profile, in School Journey, press a piece of work. A recent take also opens from its genre’s look, and a recent piece from the look of an ability it read.',
      'Read the summary: the result, its band, the date, and what held it back most.',
      'Read each quality, with what it means; then what held it back, each in points off its quality and off the whole.',
      'Moment By Moment gives each part’s result, its own rehearsal, the stamina it cost and what happened in it; continuity is under it.',
      'Press an ability at the foot for its look, beside your level when the work was judged.',
    ],
    needs: [
      'A piece of work judged: a take, a showing or a night.',
      `One of the latest ${WORK_KEPT} on your record; older ones are counted in School Journey, and no longer open.`,
    ],
    costs: [
      { label: 'Time', value: 'None' },
      { label: 'Money', value: 'None' },
    ],
    reads: [
      { label: 'Capacity', value: `What each quality calls on, each by its share: an ability as its level against full, a technique against ${MASTERED}` },
      { label: 'Difficulty', value: 'Harder work asks more of the same capacity, and work pitched at a student less; at full capacity it asks no more' },
      { label: 'Preparation', value: `Each part of preparation a quality depends on, against what completes it, the least of them counting; a part not begun still leaves ${pct(EVALUATION.prepFloor)}` },
      { label: 'Condition', value: `Readiness under ${EVALUATION.sufficientReadiness}, the flu, an injury or a concussion, where each reaches; and in a piece in parts, stamina late and a slip before` },
      { label: 'Fit', value: `A way of playing it the material or a note doesn’t allow: what it leans on held at ${pct(MISFIT)}` },
      { label: 'The Draw', value: `Up to ${plural(EVALUATION.variation, 'point')} either way, narrowing as mastery rises, none at it; a tired day widens it downward`, estimate: true },
      { label: 'The Whole', value: `${pct(EVALUATION.meanShare)} the qualities’ average, each by its share, and ${pct(1 - EVALUATION.meanShare)} the weakest` },
      { label: 'Continuity', value: 'How evenly belief and interpretation held from part to part: 100 less their spread, shown and never added' },
    ],
    now: ['Opening it changes nothing.'],
    later: [
      'A result is kept under the rules it was judged by: a later change to the rules doesn’t rewrite it, and one judged under rules since changed is shown as it was, without working it out again.',
      `Past ${WORK_KEPT}, the oldest piece leaves the record; School Journey keeps counting it.`,
    ],
    interpret: [
      'A limit’s points are what that one thing cost: its quality worked out again with it made whole, everything else the same. Limits are ranked by what they cost the whole.',
      '“You met everything it asked, so it couldn’t have scored higher.” is a piece at mastery.',
      'The small line gives what it was judged with: readiness, difficulty, and each part of preparation against what completed it.',
      'The line at the foot says the piece was worked out again from what it was judged on, and to what: the same figure, whatever has changed since.',
      'What To Work On Next looks at these limits across your recent work, and, for the weakness your work keeps coming back to, what it has cost across all your work.',
    ],
    unavailable: [`“That piece isn’t on your record anymore. The record keeps your latest ${WORK_KEPT} pieces.”`],
    mistakes: [
      'Training the ability a limit names when the limit is preparation or the day: those say what to do differently.',
      'Reading continuity as part of the result: it comes from the parts and is shown beside them.',
    ],
    next: [
      'If an ability or a technique held it back most, practice it (Practice).',
      'If it was preparation or the day, prepare further or come to the next piece rested.',
      'Read Your Work So Far for what keeps coming back (Your Work So Far).',
    ],
    related: ['craft.brief-tape', 'craft.identity', 'craft.practice', 'coursework.feedback', 'productions.nights'],
    connections: [
      { to: 'craft.profile', kind: 'history', why: `Each piece judged is kept in School Journey, the latest ${WORK_KEPT} in full and every one counted.` },
      { to: 'craft.identity', kind: 'history', why: 'Your Work So Far reads the record for strengths, and what held each piece back, kept for life, for what keeps coming back.' },
      { to: 'craft.practice', kind: 'optional', why: 'An ability or technique that held recent work back, with room to grow, is what What To Work On Next recommends practicing.' },
      { to: 'coursework.feedback', kind: 'optional', why: 'A showing in class opens the same way from School Journey; the teacher’s note on it is in the scene’s Feedback, under Coursework.' },
      { to: 'productions.nights', kind: 'optional', why: 'A night on stage is judged in the play’s parts, and the night with the company together is worked out beside your own.' },
      { to: 'body.how', kind: 'optional', why: 'Readiness at the hour is the condition every piece reads.' },
    ],
    example: {
      setup: `The take of ${DRAMA.title} under Taping A Brief: an actor at ${AT} in everything, fully prepared, at readiness 80, with no draw.`,
      steps: ['Open it from School Journey.', 'Read Moment By Moment.'],
      result: `${one(TAPED.e.overall)} of 100, ${band(TAPED.e.overall)}. ${CHIEF ? `The summary says what held it back most: ${CHIEF}.` : 'You met everything it asked.'} Moment By Moment gives ${andList(TAPED.e.piece!.segments.map((s) => `${s.label} ${one(s.overall)}`))}; ${LAST_BEAT.label} is Tiring, ${pct(1 - LAST_BEAT.drain)} off, and continuity is ${one(TAPED.e.piece!.continuity)}.`,
    },
  },
  {
    id: 'craft.identity',
    title: 'Your Work So Far',
    goal: 'craft',
    covers: [],
    synonyms: ['artistic identity', 'strengths', 'recurring weakness', 'habits', 'range', 'taking direction', 'reliability', 'playing with others', 'material you know', 'what keeps holding it back'],
    questions: ['What’s my work best at?', 'What keeps holding my work back?', 'Do I have habits as an actor?', 'Why does it say early days?', 'Does it change my results?'],
    where: { route: PROFILE, label: 'Player Profile, Your Work So Far' },
    available: `${OPENED}; its patterns from ${plural(ARTISTRY.least, 'piece')} judged.`,
    short: `Your Work So Far, on the Player Profile, is the actor your work shows, read from what the game already keeps and never stored: what your work shows most, what keeps holding it back, the material you know and haven’t met, how you tend to play it, your range, how you take direction, your reliability and how you play with others. Each line says what it rests on. A pattern is named only from ${plural(ARTISTRY.least, 'piece')} judged, and a habit from ${ARTISTRY.habitAt} choices, so early work isn’t taken for who you are. The weakness it finds you keep coming back to is named again in What To Work On Next and in a director’s note on it. It adds nothing to any result.`,
    steps: [
      'Open the Player Profile and find Your Work So Far, after School Journey.',
      'Read each section, and the small “From:” after each line: what it rests on.',
      'Beside a brief, Where It Would Show Next suggests briefs it points to: one that leans on the weakness that keeps coming back, where recent work names none and a brief calls on it, one built on material never met, and one taped before that takes it the other way from a habit.',
      'What To Work On Next, on the Profile, names the ability or technique your work keeps coming back to with how many pieces it has held back in all, where it’s among what recent work recommends. What To Work On, in a brief’s pane, gives only the first ability or technique recommended, so it names that one only when it comes first.',
    ],
    needs: [`${plural(ARTISTRY.least, 'piece')} of work judged before strengths and weaknesses are named; until then it says Early days.`],
    costs: [
      { label: 'Time', value: 'None' },
      { label: 'Money', value: 'None' },
    ],
    reads: [
      { label: 'What Your Work Shows Most', value: `A quality that comes out ${ARTISTRY.strongBy} or more over your own average, across the latest ${ARTISTRY.recent} pieces, in ${plural(ARTISTRY.least, 'piece')} at least`, estimate: true },
      { label: 'What Keeps Holding It Back', value: 'What has held three pieces or more back across all your work, ranked by the points it cost the whole, the top three; and a class note given three times and still open' },
      { label: 'Material You Know', value: `The four kinds of material met or practiced most, each ${plural(EXPERIENCE.fullAt, 'time')} or more; “Not met yet” lists the kinds never met` },
      { label: 'How You Tend To Play It', value: `A side of an axis chosen ${pct(ARTISTRY.habitShare)} of the time or more, once there are ${ARTISTRY.habitAt} choices on the axis, each side counted once as it’s newly chosen, with what was shown played that way as its evidence; and your readings, where ${pct(ARTISTRY.habitShare)} of your takes lean the same way`, estimate: true },
      { label: 'Range', value: 'The kinds of work judged, the genres worked in, and the kinds of material met' },
      { label: 'Taking Direction', value: 'Notes and requests on the craft given, worked and answered, for life, from three given: a callback’s note, a director’s note' },
      { label: 'Reliability', value: `Every term’s calls answered since you began, once ${ARTISTRY.least} have been made, and rehearsals with a partner kept, and missed by you` },
      { label: 'Playing With Others', value: 'Scenes, takes with a reader and nights with a company: their mean together, and the slips by the others you covered, from three' },
    ],
    now: ['Reading it changes nothing.'],
    later: [
      'Each line moves as the work goes on: it’s read again from the record each time it’s shown.',
      'A weakness that kept coming back stays on the list by what it has cost in all, until others have cost more.',
    ],
    interpret: [
      'Early days, with the count of pieces judged, means patterns aren’t named yet.',
      'A strength is your abilities’ and techniques’ already: it’s shown, and adds nothing to a result.',
      `Reliability reads every term’s calls together, those before this term kept with this term’s, so it doesn’t start again with a term; it shows once ${ARTISTRY.least} calls have been made.`,
      'A section with too little behind it isn’t shown.',
      `The first ability or technique in What Keeps Holding It Back is the one your work keeps coming back to. What To Work On Next gives its count in all and puts it first where it’s about as useful to train as the top, and a director’s note on it ends “It’s your … again: it’s held back … of your pieces before this.” Neither moves a figure.`,
    ],
    unavailable: ['A section shows only once there’s enough behind it, and Early days stands until patterns can be named.'],
    mistakes: [
      `Reading Early days as a judgment: it means fewer than ${plural(ARTISTRY.least, 'piece')} have been judged.`,
      'Playing everything one way to keep a strength: a habit is named as one, and Where It Would Show Next suggests the other way.',
    ],
    next: [
      'Practice what keeps holding your work back (Practice), or tape the brief Where It Would Show Next suggests (Taping A Brief).',
      'Try the other way of playing a habit, to widen your range (A Reading And A Way To Play It).',
    ],
    related: ['craft.profile', 'craft.work', 'craft.brief-tape', 'coursework.partners', 'productions.notes'],
    connections: [
      { to: 'craft.work', kind: 'prerequisite', why: `Patterns are named once ${plural(ARTISTRY.least, 'piece')} of work have been judged.` },
      { to: 'craft.brief-tape', kind: 'optional', why: 'Where It Would Show Next, beside a brief, suggests the briefs your work so far points to.' },
      { to: 'coursework.partners', kind: 'optional', why: 'Reliability counts the rehearsals with a partner kept, and those you missed.' },
      { to: 'productions.notes', kind: 'optional', why: 'Taking Direction counts the director’s notes on the craft given, worked and answered, and a note on the weakness your work keeps coming back to says so.' },
      { to: 'craft.profile', kind: 'immediate', why: 'What To Work On Next names the weakness your work keeps coming back to with its count in all, and may put it first.' },
    ],
    example: {
      setup: `A first-year with ${plural(ARTISTRY.least - 1, 'piece')} judged, who has newly chosen ${APPROACH_EFFECT.measured.label} for the pace on ${plural(HABIT_SO_FAR, 'piece')} of work, one of them a brief taped that way.`,
      steps: ['Open Your Work So Far.', `Tape that brief again, played ${APPROACH_EFFECT.measured.label} as before.`, `Choose ${APPROACH_EFFECT.measured.label} for the pace on ${plural(ARTISTRY.habitAt - HABIT_SO_FAR, 'more piece')}.`],
      result: `With ${ARTISTRY.least - 1} judged it says Early days: patterns are named once ${ARTISTRY.least} are. With ${ARTISTRY.least}, strengths and what keeps holding the work back can be named where the record shows them, but ${APPROACH_EFFECT.measured.label} isn’t a habit yet: a take played that way is its evidence and adds no choice, so it stands at ${HABIT_SO_FAR} of the ${ARTISTRY.habitAt} a habit needs. Chosen on the ${ARTISTRY.habitAt - HABIT_SO_FAR} more, it’s named one: “You play it ${APPROACH_EFFECT.measured.label.toLowerCase()}: ${ARTISTRY.habitAt} of ${ARTISTRY.habitAt} choices on ${AXES.pace.label.toLowerCase()}.”`,
    },
  },
];
