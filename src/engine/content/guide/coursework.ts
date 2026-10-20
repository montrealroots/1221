/**
 * SLATE — the guide's reference: coursework and partners (from 2026-10-12; `content/guide/types.ts`).
 *
 * Eight entries: preparing a piece of coursework, the table work, how a scene is played, the feedback and the notes
 * ledger, another way at a note that keeps coming back, rehearsing with a partner, the class's moments and making
 * amends, and working a problem through (the one process a scene, a practice brief and a part share). The figures are
 * the rules' own, imported: the templates and scenes (`content/coursework.ts`), the work's estimates (`WORK`,
 * `systems/coursework.ts`), the notes ledger's (`LEARNING`, `systems/learning.ts`), the class's (`CLASS`,
 * `systems/classmates.ts`), the scene together's (`ENSEMBLE`), the workbook's (`WORKBOOK`, `ADJUSTMENTS`), a piece's
 * segments (`PIECE`, `systems/piece.ts`) and the evaluation's bands (`EVALUATION`). The worked examples are Acting III's
 * Scene Study on The Seagull's fourth act, the scene `tests/ensemble.test.ts` uses, at an ordinary focus of 1 (readiness
 * 80) and an even nature, so each step moves its part by its own share of what's left. They said Acting I's until the
 * verifying pass of 2026-10-12: Acting I's Scene Study takes plays from 1900 on (`materialFrom`), and The Seagull is
 * 1896, so `scenesFor` never sets it there; the test sets it by hand.
 *
 * The same pass found that a part's Weighs, the template's weight, reaches no result: `judgeWork` reads each part
 * through the task's dimensions, each held to its least prepared part, and the weights only choose the note
 * (`noteCandidates`). Changing Scene Study's weights left a judged scene at 35.4 both times. The entries said Weighs was
 * a part's "share of the showing" until then, and so did the assignment's look, whose column was headed Of The Showing
 * until later that day (`ui/looks/school.tsx`); it's headed Weighs now, as the panel's figure is.
 *
 * The prose pass later on 2026-10-12 read the entries against the day's fixes. Until then they said Learn Lines was
 * checked for 60 minutes whatever the scene, and Rehearse Alone counted as desk work (it's on your feet, `needs:
 * ['feet']`); that the table work was read at the showing by its weight; that only steps on your feet rehearsed a way
 * of playing in (`prepare` rehearses it in with any step on the rehearsal part, Record A Take at a desk among them);
 * that a rehearsal kept with your partner left it unrehearsed, and that only hospital or being laid up excused one (a
 * day called in sick does too, and an injury that stops training for partner work in a studio, `rehearsalOutcome`);
 * that a drill and the partner's way could
 * be chosen for a note on table work that's the answers alone (`approachRefusal` refuses both there); and that Name What
 * You Want In Each Part and Run It With Your Partner were offered on every scene, where now they're offered only where
 * they move a figure the forecast reads (`systems/workpieces.ts`). The partner's words after a rehearsal read the choices
 * as the showing does from the same day (`peerNote`, `interpretationOf`), and the entry says so. Driven was said to draw
 * on stamina in every scene; a scene judged in its parts reads stamina only as tiring toward the end (`judgePiece`).
 * “Not from a hospital bed.” was said to refuse only a step in a studio or on your feet until that pass's verifier read
 * it: it refuses a step at the library too, since `prepareRefusal` asks `startRefusal` about any step done in person.
 *
 * Every example was played on a throwaway save later that day (`tests/guide-examples-coursework.test.ts`), and three
 * things they said were wrong against the engine. Work On The Note twice was said to bring the note's work to 70%: the
 * showing before it meets the scene's material (`noteMaterial`), so the steps after it go a little faster
 * (`featureSpeed`), and it comes to 71%. A changed choice was said to be brought "to 90%" by its eight more steps of
 * Rehearse Alone, where they bring it to 92%, past the 90% that completes it. And a fourth Learn Lines was said to
 * "train the skill no further", where the skill is your memory, which the step still practices: it grows by the
 * practice alone. Another way at a note now says its material is new to you, as its figures always assumed. Nothing
 * else in the examples changed in that pass.
 *
 * The verifier of those plays found three figures sitting exactly on a half percent, where the guide and the engine
 * agreed only because they computed the same float: Heightened Text Scene's 57.5% and 67.5%, written 57% and 68%, and
 * the third try of Work It Slowly's 92.5%, written 93%. A focus 1e-15 over 1 turned the engine's verse figure into
 * 57.500000000000014, which rounds to 58, with the guide still at 57. Until then the verse was scanned once and the
 * rehearsal Work It Through starts from was at 40%; the verse is scanned twice now (69%, then 79%), and the rehearsal
 * starts at 36% (68%, 84%, 92% and 96%), with nothing else in either example changed.
 *
 * A few figures the systems keep as bare numbers, exported by nothing, are written out here and would drift from their
 * rule unnoticed: the table work's 30% of the scene read first (`school.choose`),
 * 30% of the lines before a scene or a part can be worked through (`workpieces.ts`), the 75% a part needs to be named
 * among what helped (`show`), a partner's three points under your own before they're a problem (`problemsOf`), the
 * half point of the whole a limit has to cost to be one, classes at nine, a partner's day (classes until three, a
 * Saturday shift, calls from three, a Cabaret show from six, `mateBusy`), and the tenth a way of playing has to lean a
 * dimension by for that dimension to read its rehearsal (`materialContext`).
 *
 * Later on 2026-10-13 “The studios are in New Haven.”, “The Haas Arts Library is in New Haven.”, “They’re in New
 * Haven.” and “… is in New Haven.” went from the engine, reached by no play, since every student is in New Haven and
 * nothing moves one; until then the entries listed them, and said a studio, the library, Help Now and Make Amends
 * needed New Haven.
 */

import { GRAIN, GRAIN_LABEL } from '../interpretation';
import { requiredFor, sceneOfMaterial, suitabilityOf } from '../../systems/interpretation';
import { CHAPTER_FOR } from '../tutorial';
import { STEP_SPEED } from '../abilities';
import { COURSES, SKILLS } from '../school';
import { ENGAGEMENT } from '../engagement';
import { QUESTIONS, SCENE_SIZE_MINUTES, sceneById, templateById, type PrepDim, type Template } from '../coursework';
import { EVALUATION, TASK_PROFILES, TEMPLATE_TASK } from '../tasks';
import { titleCaseLabel } from '../../core/text';
import { AXES, APPROACH_EFFECT, MISFIT, PLAYING } from '../approaches';
import { PIECE } from '../piece';
import { ADJUSTMENTS, WORKBOOK } from '../workbook';
import { CHOOSE_MINUTES, READER, TERM_CHECK, TOGETHER_BOND, TOGETHER_COVERED, WORK } from '../../systems/coursework';
import { APPROACH, APPROACHES, LEARNING } from '../../systems/learning';
import { CHOICES, CLASS, PRIORITY_WORDS } from '../../systems/classmates';
import { ENSEMBLE } from '../../systems/ensemble';
import { BONDS, ESTIMATE } from '../../systems/school';
import { BRIEF } from '../../systems/briefs';
import { SPENT } from '../../systems/life';
import { abilityDef } from '../../systems/attributes';
import { EXPERIENCE } from '../../systems/experience';
import { materialOf } from '../../systems/material';
import { segmentPart, segmentRequired, unitSegments, type PieceSpec } from '../../systems/piece';
import type { GuideEntry } from './types';

// --- the screen -------------------------------------------------------------------------------------------------------

const CHAPTER = CHAPTER_FOR['school.prepare']?.title ?? 'its chapter';
const OPENED = `From the guide’s chapter “${CHAPTER}”`;
const LOCKED = `Locked, on a guided life, until “${CHAPTER}” has been read.`;
const ROUTE = '/workspace/school';
/** The School screen's Coursework tab (`ui/shell/sections.ts`), named through a constant: a `tab` literal reads as a label. */
const COURSEWORK_TAB = 'coursework';

// --- how a figure is written ------------------------------------------------------------------------------------------

const pct = (share: number): string => `${Math.round(share * 100)}%`;
const clock = (hour: number): string => (hour === 12 ? 'noon' : hour < 12 ? `${hour} a.m.` : `${hour - 12} p.m.`);
const ordinal = (n: number): string => (['', 'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh', 'eighth', 'ninth', 'tenth'][n] ?? `${n}th`);
/** A small count in words: "three". */
const word = (n: number): string => (['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'][n] ?? String(n));
/** How many times, in words: "twice". */
const times = (n: number): string => (n === 1 ? 'once' : n === 2 ? 'twice' : `${word(n)} times`);
/** A signed figure as print writes it, with a minus sign. */
const signed = (n: number): string => (n < 0 ? `−${-n}` : String(n));
/** Points, half a point written so. */
const points = (n: number): string => (n === 0.5 ? 'half a point' : n === 1 ? 'a point' : `${n} points`);
const span = (minutes: number): string => {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${h ? `${h} ${h === 1 ? 'hour' : 'hours'}` : ''}${h && m ? ' and ' : ''}${m ? `${m} ${m === 1 ? 'minute' : 'minutes'}` : ''}`;
};
const andList = (items: readonly string[]): string => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} and ${items[items.length - 1]}`);
/** A part after n steps of a share, at an ordinary focus, from where it stood: each moves its share of what's left. */
const after = (gain: number, n: number, from = 0): number => 1 - (1 - from) * (1 - gain) ** n;

// --- the work the examples use ----------------------------------------------------------------------------------------

const SCENE_STUDY = templateById('scene-study')!;
const CLASSICAL = templateById('classical-scene')!;
const GREEK = templateById('greek-scene')!;
const stepOf = (t: Template, id: string) => t.activities.find((a) => a.id === id)!;
const READ = stepOf(SCENE_STUDY, 'read');
const LEARN = stepOf(SCENE_STUDY, 'learn');
const ALONE = stepOf(SCENE_STUDY, 'rehearse');
const WITH_PARTNER = stepOf(SCENE_STUDY, 'partner');
const REVISE = stepOf(SCENE_STUDY, 'revise');
/** Whether Rehearse Alone is a step on your feet (`needs`), as `prepareRefusal` and `prepare` read it. */
const ALONE_ON_FEET = (ALONE.needs ?? []).some((n) => n === 'feet' || n === 'studio');
const SCAN = stepOf(CLASSICAL, 'scan');
const SPEAK = stepOf(GREEK, 'voice-text');
const partOf = (t: Template, d: PrepDim): string => t.dims[d]?.label ?? d;
/** The problem Work It Through names for Scene Study's table work short, as `problemsOf` labels a part of preparation. */
const TABLE_SHORT = `${titleCaseLabel(TASK_PROFILES[TEMPLATE_TASK[SCENE_STUDY.id] ?? 'scene']?.prepLabel?.interpretation ?? partOf(SCENE_STUDY, 'interpretation'))}: Not There Yet`;
const ACTING = COURSES.find((c) => c.code === 'DRAM 103a/b')!;
/** The course the examples are set in: Acting III's Scene Study can set The Seagull, Acting I's can't (it takes plays from 1900 on). */
const ACTING_III = COURSES.find((c) => c.code === 'DRAM 303a')!;
const SEAGULL = sceneById('seagull-4')!;
const NINA = SEAGULL.roles[0].name;
const LONG_LINES = SCENE_SIZE_MINUTES[SEAGULL.size];
/** The skill Learn Lines trains, which is your memory: the craft's Memory and the ability are one figure. */
const MEMORY = (SKILLS.find((k) => k.id === LEARN.trains)?.label ?? 'memory').toLowerCase();

/** A template's weights with one part put first, normalized as the showing weighs them (`weightsOf`). */
function weightsWith(t: Template, first?: PrepDim): Partial<Record<PrepDim, number>> {
  const raw = (Object.entries(t.dims) as [PrepDim, { weight: number }][]).map(([d, v]) => [d, v.weight * (d === first ? LEARNING.objectiveWeight : 1)] as const);
  const total = raw.reduce((s, [, w]) => s + w, 0);
  return Object.fromEntries(raw.map(([d, w]) => [d, w / total]));
}
const LINES_FIRST = weightsWith(SCENE_STUDY, 'memorization');

// Preparing: The Seagull read twice, its long lines learned three times, rehearsed alone twice.
const PREP_READ = after(READ.gain, 2);
const PREP_LINES = after(LEARN.gain, 3);
const PREP_ALONE = after(ALONE.gain, 2);
const PREP_MINUTES = 2 * READ.minutes + 3 * LONG_LINES + 2 * ALONE.minutes;

// The table work: four answers of five supported, then all five; and Heightened Text Scene's half and half, its verse
// scanned twice. Scanned once until the verifier of the played examples (2026-10-12): its figures were 57.5% and
// 67.5%, on the half percent, where the guide and the engine agreed only by computing the same float.
const SUPPORTED = (QUESTIONS.length - 1) / QUESTIONS.length;
const SCANS = 2;
const SCANNED = after(SCAN.gain, SCANS);

// Playing: two of Rehearse Alone rehearse a choice in; a change of mind keeps its share; how many more to complete it.
const CHOICE_STEP = ALONE.gain * PLAYING.gainShare;
const CHOSEN_TWICE = after(CHOICE_STEP, 2);
const KEPT_ON_CHANGE = CHOSEN_TWICE * PLAYING.keptOnChange;
// The mark Driven is complete at in the example's scene, The Seagull (from 2026-10-16, `requiredFor`): the scene's own,
// by how well the side suits it, where until then every choice was complete at `PLAYING.complete`. Read in the
// scene's genre's register, as the game reads it (`sceneOfMaterial`): until 2026-10-16, later, the example left the
// register out, and came to the same figure only because drama's pulls no pace.
const EXAMPLE_SCENE = materialOf('seagull-4')!;
const DRIVEN_SUITS = suitabilityOf('driven', EXAMPLE_SCENE, sceneOfMaterial(EXAMPLE_SCENE));
const DRIVEN_MARK = requiredFor(['driven'], EXAMPLE_SCENE, sceneOfMaterial(EXAMPLE_SCENE));
const STEPS_TO_COMPLETE = (() => { let n = 0; while (after(CHOICE_STEP, n, KEPT_ON_CHANGE) < DRIVEN_MARK && n < 50) n += 1; return n; })();
/** Where those steps leave it: past complete, by the last step's share. */
const CHOICE_DONE = after(CHOICE_STEP, STEPS_TO_COMPLETE, KEPT_ON_CHANGE);

// The feedback: a showing with its parts at these, Lines put first, and the part the note names.
const SHOWN: Partial<Record<PrepDim, number>> = { familiarity: 0.8, memorization: 0.4, interpretation: 0.8, rehearsal: 0.5, partner: 0.64 };
const SHORTEST = (Object.entries(SHOWN) as [PrepDim, number][])
  .map(([d, v]) => ({ d, v, short: (LINES_FIRST[d] ?? 0) * (1 - v) + (d === 'memorization' && v < LEARNING.enough ? 0.05 : 0) }))
  .sort((x, y) => y.short - x.short)[0]!;
const NOTE_TEXT = `${SCENE_STUDY.notes[SHORTEST.d] ?? ''} (${partOf(SCENE_STUDY, SHORTEST.d)}: ${pct(SHORTEST.v)} prepared.) You played ${NINA} in ${SEAGULL.play}.`;
/**
 * A step's speed once the showing has met the scene's material: each of its features met once (`featureSpeed`,
 * `noteMaterial` in `show`), so the note's work goes a little faster than the steps before the showing did.
 */
const MET_ONCE = 1 + ENGAGEMENT.genreSpeed * Math.min(1, 1 / EXPERIENCE.fullAt);
const NOTE_WORKED = after(REVISE.gain * MET_ONCE, 2);

// Another way: Lines at 40%, a drill a day for three days; or the smaller piece.
const LINES_AT = 0.4;
const DRILLED = [1, 2, 3].map((n) => after(APPROACH.drill.gain, n, LINES_AT));

// A partner two weeks on: an ordinary drive, 85% reliable, two evenings kept.
const RELIABLE = 0.85;
const PARTNER_PART = [after(WITH_PARTNER.gain, 1), after(WITH_PARTNER.gain, 2)];
/** Evenings with a reader to complete the partner part at a focus of 1 (`READER`, from 2026-10-16): each a share of what's left. */
const READER_EVENINGS = ((): number => { let r = 0, n = 0; while (r < EVALUATION.complete.coursework) { r += READER.gain * (1 - r); n += 1; } return n; })();
const TRUST_AFTER = WORK.trust.start + 2 * WORK.trust.kept;
const PARTNER_OWN = Math.min(WORK.partnerOwnMost, WORK.partnerOwnPerWeek * 2 * RELIABLE * (0.8 + 0.4 * (TRUST_AFTER / 100)));
const PARTNER_PREP = 1 - (1 - PARTNER_OWN) * (1 - ENSEMBLE.together * PARTNER_PART[1]!);

// The class: a rehearsal slept through, the next called off late, a boundary accepted, amends made.
const T_MISSED = WORK.trust.start + WORK.trust.missed;
const T_LATE = T_MISSED + WORK.trust.lateCancel;
const T_ACCEPTED = T_LATE + CLASS.boundary.respect;
const T_AMENDED = T_ACCEPTED + CLASS.amends.missed.trust + CLASS.amends.lateCancel.trust;

// Working it through: The Seagull's parts by its tones and its turns (from 2026-10-16, evaluation-10: its tones only until
// then), the first a turn leads into, rehearsal at 36%, worked slowly.
// At 40% until the verifier of the played examples (2026-10-12): its third try came to 92.5%, on the half percent. From
// 36%, what's left is 64 points, and Work It Slowly halves it each time, so each try lands on a whole percent.
const SEAGULL_SPEC: PieceSpec = { segments: unitSegments(materialOf(SEAGULL.id) ?? { tones: [], turns: 0 }), work: [], part: 'rehearsal', perTurn: PIECE.scene.perTurn, perBlend: PIECE.scene.perBlend, most: PIECE.scene.most, load: 0 };
const TURN_AT = Math.max(0, SEAGULL_SPEC.segments.findIndex((s) => s.turnInto));
const TURN = SEAGULL_SPEC.segments[TURN_AT] ?? { label: 'The Middle' };
const TURN_ASKS = SEAGULL_SPEC.segments.length ? segmentRequired(SEAGULL_SPEC, EVALUATION.complete.coursework, TURN_AT) : EVALUATION.complete.coursework;
const REHEARSED = 0.36;
const WORKED: number[] = [];
for (let k = 1; k <= 8; k += 1) {
  WORKED.push(segmentPart(REHEARSED, after(WORKBOOK.workGain, k)));
  if (WORKED[k - 1]! >= TURN_ASKS - 0.005) break;
}
const WORK_BEAT = ADJUSTMENTS['work-beat'];

// What each side of an axis draws on, in the abilities' own names, stamina said apart: a scene judged in its parts reads
// it only through its drain (`judgePiece`), and the chooser leaves it out there (`PlayingChooser`). Until the prose pass
// of 2026-10-12 it was listed among what Driven draws on in every scene.
const drawsOn = (side: keyof typeof APPROACH_EFFECT): string => andList([...new Set(Object.values(APPROACH_EFFECT[side].inputs).flat().filter((x) => x!.ability !== 'stamina').map((x) => abilityDef(x!.ability).label.toLowerCase()))]);
const STAMINA_SIDES = (Object.keys(APPROACH_EFFECT) as (keyof typeof APPROACH_EFFECT)[]).filter((s) => Object.values(APPROACH_EFFECT[s].inputs).flat().some((x) => x!.ability === 'stamina')).map((s) => APPROACH_EFFECT[s].label);
const SIDES = (Object.keys(AXES) as (keyof typeof AXES)[]).map((axis) => `${AXES[axis].label} (${APPROACH_EFFECT[AXES[axis].values[0]].label} or ${APPROACH_EFFECT[AXES[axis].values[1]].label})`);

export const COURSEWORK: readonly GuideEntry[] = [
  {
    id: 'coursework.prepare',
    title: 'Preparing Coursework',
    goal: 'coursework',
    covers: ['school.prepare', 'look.assignment'],
    synonyms: ['assignment', 'scene study', 'coursework steps', 'learn lines', 'read the scene', 'rehearse alone', 'work on the note', 'due date', 'note priority', 'piece of coursework', 'shown today', 'due soonest', 'what to prepare first', 'a word on your coursework', 'unready', 'why is my work unready'],
    questions: ['How do I prepare a scene for class?', 'When is my work due?', 'Why is a step grayed out?', 'What does Note Priority mean?', 'How long does learning lines take?', 'What happens if I miss the class it’s due at?', 'What would it come to if I showed it today?', 'Why was I warned about my coursework?'],
    where: { route: ROUTE, tab: COURSEWORK_TAB, label: 'School, Coursework' },
    available: `${OPENED}, once a course has set a piece: at one of its classes, or for the first-year fall courses at orientation’s session on the courses.`,
    short: `Your courses set pieces of coursework: a scene, a song, a movement score, a written analysis. You prepare each one with the steps on its card on the Coursework tab, then show it in class on the day it’s due, and the better prepared it is, the better it goes. A course sets a piece at one of its classes, due a set number of classes later (${word(SCENE_STUDY.dueAfter)} for ${SCENE_STUDY.title} in ${ACTING.name}), with a scene, your part and a partner from the class where the work has them. Each step moves its part of the preparation by a share of what’s left, so the same step again moves it less. When the piece is shown, its band (Unready, Working, Strong or Exceptional) sets how much that class grows your skills.`,
    steps: [
      'Open School, then the Coursework tab. Due Soonest, at the top, names up to three pieces still short of complete, the one due soonest first: what each would come to if shown today, and what’s still to finish. Under it, each open piece has a card, in the same order, headed by its course and title, with the day it’s due and the skills it’s shown for.',
      'Read what it is: the play, the scene and where it falls, your part and who plays the other, and Put First, the part this piece counts for more.',
      `Each part of the preparation shows how far it’s prepared, with its Note Priority and what completes it, ${pct(EVALUATION.complete.coursework)}. Press a step to do it. Pointing at a step shows how many minutes it takes, or why it can’t be done now, and the reasons are listed under the buttons.`,
      'Read Shown Today: what the piece would come to if you showed it today on a good day, what’s holding it back most, and each part still to finish with the steps that work on it.',
      'Press the card’s title to open the piece itself: each part with Prepared and Note Priority, the same figures as the card’s, with links to the course, the day it’s due and your readiness.',
      'On the day it’s due, be awake and in New Haven at nine: it’s shown at the course’s class.',
    ],
    needs: [
      'A piece set and open. A course sets its next piece at a class when none of its own is open and the term still has the class it would be due at.',
      `For a step that builds on another: ${LEARN.label} needs the scene read to ${pct(LEARN.requires!.at)}, and ${ALONE.label} the lines learned to ${pct(ALONE.requires!.at)}.`,
      `For a step in a studio or on your feet: energy of ${SPENT} or more and no injury that stops training. A studio or the library also needs orientation’s tour behind you.`,
      'New feedback on the piece read, and anything your partner has asked about it answered.',
      `Free time for the step’s length: at nothing else, and due nowhere before it would end. ${LEARN.label} is checked for the scene’s own length, ${SCENE_SIZE_MINUTES.short}, ${SCENE_SIZE_MINUTES.medium} or ${SCENE_SIZE_MINUTES.long} minutes, the time it takes.`,
    ],
    costs: [
      { label: 'Time', value: `Each step its own. In ${SCENE_STUDY.title}: ${READ.label}, ${READ.minutes} minutes; ${LEARN.label}, ${SCENE_SIZE_MINUTES.short}, ${SCENE_SIZE_MINUTES.medium} or ${SCENE_SIZE_MINUTES.long} by the scene’s length; ${ALONE.label}, ${ALONE.minutes}; ${REVISE.label}, ${REVISE.minutes}; ${WITH_PARTNER.label}, a rehearsal of ${WORK.rehearsal.minutes} minutes agreed with them`, estimate: true },
      { label: 'Money', value: 'None' },
      { label: 'Your Body', value: `Desk work counts as activity at ${WORK.met.desk} METs, and a step that needs a studio or your feet at ${WORK.met.feet}. ${ALONE.label} ${ALONE_ON_FEET ? 'is on your feet, so it counts at the higher figure' : 'needs neither, so it counts as desk work'}`, estimate: true },
    ],
    reads: [
      { label: 'Your Focus', value: 'Your readiness against 80, adjusted for how the hour suits you, between half and 110% for a step: the more rested you are, the further a step moves its part', estimate: true },
      { label: 'Your Nature', value: 'How far each kind of step goes for you: reading around for the table work, drilling for lines, skimming for knowing the scene, revising for a note' },
      { label: 'Kinds You Know', value: 'A play in a genre you know, or material whose features you’ve met, prepares faster, by the better of the two' },
      { label: 'The Ability It Practices', value: `Learning lines goes further with memory, the table work with imagination, knowing the scene with focus, and a revision with adaptability: ${pct(STEP_SPEED.least)} as far at 0, as far as the step says at 50, and ${pct(STEP_SPEED.most)} as far at 100`, estimate: true },
      { label: 'What’s Left', value: `Each step moves its part by its share of what’s left: ${READ.label} ${pct(READ.gain)}, ${LEARN.label} ${pct(LEARN.gain)}, ${ALONE.label} ${pct(ALONE.gain)}, ${REVISE.label} ${pct(REVISE.gain)}, at an ordinary focus`, estimate: true },
      { label: 'The Showing', value: `Each part is complete at ${pct(EVALUATION.complete.coursework)}, and each quality your teacher looks for is held back by the least prepared part that affects it, whatever its Note Priority. Also counted: the skills it’s shown for against what the piece asks of your year, your condition in class, the scene’s material and the way you chose to play it. A scene is judged part by part, by its tones or, with one tone, in two halves, and your stamina counts as tiring that grows toward the end` },
      { label: 'The Band', value: `Working from ${EVALUATION.bands.working}, Strong from ${EVALUATION.bands.strong}, Exceptional from ${EVALUATION.bands.exceptional}; under ${EVALUATION.bands.working}, Unready` },
    ],
    now: [
      'The clock moves on by the step’s minutes, and its part rises by its share of what’s left. A part at 97% or more has nothing more to gain from it.',
      `A step that trains a skill trains it at ${pct(WORK.trainingWeight)} of a class’s weight, for at most ${WORK.trainingSteps} such steps on one piece.`,
      'While it still moves the piece, a step practices the ability it calls on: knowing the scene your focus, lines your memory, a step at the table your imagination, a note your adaptability.',
      `A rehearsal step, ${ALONE.label} and the steps like it, also rehearses the way you chose to play the scene, if you chose one. A daily step counts once a day.`,
    ],
    later: [
      `At nine on the day it’s due the course meets, and the piece is shown once, in place of the class’s usual growth: the course’s skills grow ${pct(WORK.weight.unready)} of a usual class’s for Unready, ${pct(WORK.weight.working)} for Working, ${pct(WORK.weight.strong)} for Strong and ${pct(WORK.weight.exceptional)} for Exceptional.`,
      // The course's pass and the notice's count said from 2026-10-16 (tests/remaining-school-term.test.ts).
      `If you’re away with an excuse (called in sick, in hospital or laid up), it moves to the course’s next class, or is excused if none is left. Away without one, it’s Not Shown and can’t be shown later: it counts as due and Unready at the term’s review, a course with half or more of its pieces due not shown isn’t passed, and a partner’s trust falls ${-WORK.trust.missed}. Its notice says so, with the course’s count so far.`,
      `Once ${TERM_CHECK.after} of the term’s pieces have been due and ${pct(ESTIMATE.coursework.unready - TERM_CHECK.margin)} or more of them were Unready or not shown, as the review counts them, A Word On Your Coursework comes, once. It’s a warning, not the term review: it says how many, the day the faculty review the term and what the review would do to your standing if the term ends short, then what they were short on (the part most often unfinished on two or more of them with the steps that work on it, or that every part of each was unfinished, or that each was short on a different part). The review’s notice says what they were short on the same way.`,
      `At the term’s review, once ${ESTIMATE.coursework.shown} or more pieces are due, ${pct(ESTIMATE.coursework.unready)} or more of them Unready or not shown is short, and ${pct(ESTIMATE.coursework.strong)} or more Strong or better is noted.`,
      'A piece the course revises comes back to be shown again at its next class, with the note to take; a piece in rounds is shown a round at a time. A piece still open when the term’s classes end lapses.',
    ],
    interpret: [
      'A part’s figure is how far it’s prepared. Note Priority is how much the part counts when the teacher picks what to note; the result reads each part through the qualities it affects. The part put first counts for more in both, and the line beside it says why it was chosen.',
      `At ${pct(EVALUATION.complete.coursework)} a part is complete for the showing. Below it, the qualities it affects are held back: a part at nothing holds them to ${pct(EVALUATION.prepFloor)} of themselves, whatever its Note Priority.`,
      'Shown Today is how the showing would judge it with the luck of the day taken out, and you as rested as you could be. It moves when a part does, and the band beside the figure says what it would earn. It’s a forecast, not a result.',
      'A scene you’ve worked before says so, and asks for the other part, or for another answer at the table.',
      // “Not Shown Again, Counted Unready” from 2026-10-16: until then a revision missed showed nothing beside the first band.
      'Work Shown keeps your last twelve pieces and how each went: its band, or Not Shown, Excused, Not Shown, or Not Shown Before The Term Ended; and for a piece shown again, Note Taken or Note Not Taken with the band it was shown again at, or Not Shown Again, Counted Unready. Coursework This Term on Standing And Craft counts the term’s pieces as the review will.',
    ],
    unavailable: [
      '“That piece is finished.”',
      `“${LEARN.requires!.why}” and “${ALONE.requires!.why}”: a step that builds on another.`,
      '“You can revise once it’s been shown and you have a note to work on.”',
      '“There’s new feedback on this piece. Read it, then press Mark As Read.”',
      '“… has asked to rehearse. Answer them first, under Rehearsing With ….” and “… reads the scene differently from you. Answer them first, under Your Class.”',
      '“You’ve done all this step can do.” and “You’ve done this today. It builds over several days, not in one long session.”',
      `“You’re too tired to work on your feet. Sleep first.” and an injury’s “Not with …; it has … yet to mend.”: a step in a studio or on your feet${ALONE_ON_FEET ? `, ${ALONE.label} among them` : ''}.`,
      '“Not from a hospital bed.”: a step in a studio, on your feet or at the library.',
      '“You don’t know where the studios are yet. Orientation’s building tour shows you: if you missed it, press Catch Up beside it under Orientation.”, and the same for the library.',
      'At something else, or due somewhere before it would end: it names what, and when.',
      LOCKED,
    ],
    mistakes: [
      `Doing one step over and over: each moves its part by a share of what’s left, so a fourth ${LEARN.label} moves the lines less than the first. Spread the hours over the parts that are lowest, since each quality your teacher looks for is held back by the least prepared part that affects it.`,
      `Starting a long step just before a class: ${LEARN.label} on a long scene takes ${SCENE_SIZE_MINUTES.long} minutes. Leave room for it.`,
      'Sleeping through the class it’s due at: the piece isn’t shown and can’t be shown later. If you’re unwell, call in sick before nine and it moves to the next class.',
      `Leaving it to the day before: a daily step counts once a day, and a rehearsal with your partner has to be agreed at least ${WORK.rehearsal.aheadHours} hours ahead.`,
      `Leaving a scene’s partner part at nothing because its Note Priority is low: the qualities it affects are held to ${pct(EVALUATION.prepFloor)} of themselves however well the rest is prepared, and Shown Today says what that costs before the showing. Ask your partner for an evening a few days ahead, or use ${READER.label}.`,
    ],
    next: [
      'Start with Due Soonest: press the steps for what it says is still to finish.',
      'Ask your partner for a rehearsal a few days before it’s due, under Rehearsing With on the piece’s card.',
      'After the showing, read the feedback under Work Shown and press Mark As Read, then work on the note before the piece is shown again.',
    ],
    related: ['coursework.table', 'coursework.playing', 'coursework.partners', 'coursework.feedback', 'coursework.workbook', 'school.orientation', 'school.standing'],
    connections: [
      { to: 'school.orientation', kind: 'prerequisite', why: 'The tour opens the studios and the library for your steps, and the session on the courses sets the first-year fall’s first pieces.' },
      { to: 'coursework.playing', kind: 'immediate', why: 'Each rehearsal step rehearses the way you chose to play the scene.' },
      { to: 'craft.profile', kind: 'immediate', why: `A step trains its skill for up to ${WORK.trainingSteps} steps a piece, and practices the ability it calls on.` },
      { to: 'coursework.feedback', kind: 'scheduled', why: 'In the class it’s due, the preparation is judged and the showing gives its band and its note.' },
      { to: 'school.standing', kind: 'evaluation', why: `The term’s review counts each piece’s band: once ${ESTIMATE.coursework.shown} or more are due, ${pct(ESTIMATE.coursework.unready)} Unready or not shown is short.` },
      { to: 'body.how', kind: 'evaluation', why: 'Readiness sets how far each step moves its part, and your condition in class counts in the showing.' },
      { to: 'craft.identity', kind: 'history', why: 'Each showing is kept on your record, where Your Work So Far reads your strengths and what keeps holding you back.' },
    ],
    example: {
      setup: `${ACTING_III.name} sets ${SCENE_STUDY.title} on ${SEAGULL.play}, ${SEAGULL.where}: you play ${NINA}, a long scene, with ${partOf(SCENE_STUDY, 'memorization')} put first. You work at readiness 80, with an even nature, your focus and memory at 50, in a kind of play and material new to you.`,
      steps: [`${READ.label} twice, ${READ.minutes} minutes each.`, `${LEARN.label} three times, ${LONG_LINES} minutes each.`, `${ALONE.label} twice, ${ALONE.minutes} minutes each.`],
      result: `${span(PREP_MINUTES)} in all. ${partOf(SCENE_STUDY, 'familiarity')} reads ${pct(PREP_READ)}, ${partOf(SCENE_STUDY, 'memorization')} ${pct(PREP_LINES)} and ${partOf(SCENE_STUDY, 'rehearsal')} ${pct(PREP_ALONE)}. Put first, the Note Priority under ${partOf(SCENE_STUDY, 'memorization')} reads ${pct(LINES_FIRST.memorization ?? 0)} in place of its own ${pct(SCENE_STUDY.dims.memorization?.weight ?? 0)}, and the qualities of the result the lines affect count ${LEARNING.objectiveWeight} times as much before the parts are rebalanced. The three of ${LEARN.label} were the piece’s ${word(WORK.trainingSteps)} steps that train a skill, so a fourth moves the lines and practices your ${MEMORY}, the skill they train, with none of the training on top: it grows by the practice alone.`,
    },
  },
  {
    id: 'coursework.table',
    title: 'Table Work',
    goal: 'coursework',
    covers: ['school.choose'],
    synonyms: ['given circumstances', 'the relationship', 'the obstacle', 'a choice to play', 'reading of the scene', 'what the text supports', 'answers at the table', 'interpretation'],
    questions: ['What are the Table Work questions?', 'How do I know if my answer is right?', 'Why is my Table Work low?', 'Can I change an answer?', 'Why was I asked for another reading?'],
    where: { route: ROUTE, tab: COURSEWORK_TAB, label: 'School, Coursework, Table Work' },
    available: `${OPENED}, on any open piece with a scene and a part of yours in it, once the scene is read to 30%.`,
    short: `Table Work is where you decide what the scene is about, one question at a time: ${andList(QUESTIONS.map((q) => q.label))}. For each question you pick an answer from a list. The text supports some answers and not others, and some questions have more than one answer the text supports, each worth the same. The more of your answers the text supports, the further along your Table Work is when the piece is shown. Where the course has a step of its own at the table, your answers count for half and that step for the other half.`,
    steps: [
      'Open School, then the Coursework tab, and find Table Work on the piece’s card.',
      `Choose an answer for each question from its list. Each takes ${CHOOSE_MINUTES} minutes, and a message says “Answer chosen.”`,
      'Watch the part’s figure on the card: an answer the text supports raises it at once, and one it doesn’t support doesn’t.',
      'Once the piece is shown, each answer says why the text supports it or doesn’t.',
    ],
    needs: [
      `The scene read to 30%, with ${READ.label}.`,
      'An open piece with a scene and your part in it.',
      `${CHOOSE_MINUTES} minutes free.`,
    ],
    costs: [
      { label: 'Time', value: `${CHOOSE_MINUTES} minutes a question, and ${CHOOSE_MINUTES} more for each answer you change`, estimate: true },
      { label: 'Money', value: 'None' },
    ],
    reads: [
      { label: 'Answers The Text Supports', value: `The share of the ${QUESTIONS.length} questions answered the way the text supports; a question left undecided counts for nothing` },
      { label: 'A Step At The Table', value: `Where the course has one (${SCAN.label} in ${CLASSICAL.title}, ${SPEAK.label} in ${GREEK.title}), the table work is half your answers and half that step` },
      { label: 'Another Reading Asked', value: `A scene you’re asked to read another way, answered as last time where the text allows another answer, counts ${pct(LEARNING.sameReading)} of itself`, estimate: true },
      { label: 'The Note', value: 'An answer the text doesn’t support can be what the teacher’s note is about, giving the text’s own reason' },
    ],
    now: [
      `Your answer is kept, and the clock moves on ${CHOOSE_MINUTES} minutes.`,
      'The table work’s figure on the card moves with it.',
    ],
    later: [
      `In class, your partner may answer one of your questions another way, and you choose between ${andList(CHOICES.disagreement.map((c) => c.label))}.`,
      'When the piece is shown, the table work is one part of the preparation, and each quality it affects is held back by the least prepared part. Its Note Priority only decides what the note is about.',
      'A note about an answer is taken when the piece is shown again with an answer the text supports.',
      'If you come back to a scene and are asked to read it another way, your answers are compared with last time’s.',
    ],
    interpret: [
      `The figure under the course’s name for it (${partOf(SCENE_STUDY, 'interpretation')} in ${SCENE_STUDY.title}, ${partOf(CLASSICAL, 'interpretation')} in ${CLASSICAL.title}) is the table work as the showing will count it.`,
      'After the showing, each answer says “Why the text supports it” or “Why the text doesn’t support it”.',
      'For a scene you’ve come back to, “Your answers differ from last time’s.” or “So far your answers match last time’s.” says whether you’ve found another reading yet.',
      'Which answers the text supports is the game’s own judgment of each play, written so you can check it against the text.',
    ],
    unavailable: [
      '“Read the text first. You can answer the Table Work questions once you know it.”',
      '“That’s your answer already.”',
      '“That piece is finished.”',
      `At something else, or due somewhere in the next ${word(CHOOSE_MINUTES)} minutes: it names what, and when.`,
      LOCKED,
    ],
    mistakes: [
      'Answering by what sounds strongest: an answer the text doesn’t support lowers the table work and can become the note. The scene’s summary, and an original scene’s facts, are what the answers rest on.',
      `Taking your partner’s reading on trust: ${CHOICES.disagreement[1]!.label} puts their answer in place of yours, and where the text doesn’t support theirs, the table work falls.`,
      `On a scene you’re asked to read another way, changing nothing: it counts ${pct(LEARNING.sameReading)} until one answer differs where the text supports another.`,
    ],
    next: [
      'Answer every question before the showing: one left undecided counts for nothing.',
      'Then rehearse the scene on its card, and ask your partner for an evening under Rehearsing With.',
    ],
    related: ['coursework.prepare', 'coursework.class', 'coursework.feedback', 'coursework.workbook'],
    connections: [
      { to: 'coursework.prepare', kind: 'prerequisite', why: `Reading the scene to 30% with ${READ.label} opens the questions.` },
      { to: 'coursework.class', kind: 'scheduled', why: 'A partner may come to class with another answer to a question you’ve answered, and ask you to keep yours, take theirs or try both.' },
      { to: 'coursework.feedback', kind: 'evaluation', why: 'The showing counts your answers as the table work, and an answer the text doesn’t support can be its note.' },
      { to: 'coursework.partners', kind: 'evaluation', why: `An answer that differs from your partner’s leaves the scene together at ${pct(ENSEMBLE.apart)} agreement until you’ve tried both.` },
      { to: 'coursework.workbook', kind: 'optional', why: `On ${SCENE_STUDY.title} and courses like it, Work It Through can name the table work as a problem, with no way to work on it there: an answer the text supports is what fixes it.` },
    ],
    example: {
      setup: `${SCENE_STUDY.title} on ${SEAGULL.play}, ${SEAGULL.where}, as ${NINA}, the scene read once.`,
      steps: [`Answer all ${word(QUESTIONS.length)} questions: ${word(QUESTIONS.length - 1)} with answers the text supports, one with an answer it doesn’t.`, 'Change that one to an answer the text supports.'],
      result: `The answers take ${QUESTIONS.length * CHOOSE_MINUTES} minutes, and ${partOf(SCENE_STUDY, 'interpretation')} reads ${pct(SUPPORTED)}. The change takes ${CHOOSE_MINUTES} more and brings it to ${pct(1)}. In ${CLASSICAL.title}, with ${SCAN.label} done ${times(SCANS)}, four of five answers supported would read ${pct(0.5 * SUPPORTED + 0.5 * SCANNED)}, then ${pct(0.5 + 0.5 * SCANNED)}.`,
    },
  },
  {
    id: 'coursework.playing',
    title: 'How You’ll Play A Scene',
    goal: 'coursework',
    covers: ['school.choose_playing'],
    synonyms: ['measured or driven', 'restrained or expansive', 'set or open', 'way of playing a scene', 'pace scale structure', 'rehearsing a choice', 'fully prepared column', 'leave it open'],
    questions: ['How should I play the scene?', 'What do measured and driven change?', 'What does Fully Prepared mean?', 'What happens if I change my mind?', 'Why doesn’t a choice fit?'],
    where: { route: ROUTE, tab: COURSEWORK_TAB, label: 'School, Coursework, How You’ll Play It' },
    available: `${OPENED}, on any open piece with a scene in it.`,
    short: `On How You’ll Play It you choose how to play a scene: on up to three aspects, one way or the other, or left open (${andList(SIDES)}). Each way shifts what counts most in the scene toward what it is, and uses abilities of its own, so a way that uses what you do well shows you at your best; at full ability every way that fits reaches 100. Before you choose, the table shows what the piece would come to played each way, fully prepared. Choosing isn’t rehearsing: the choice counts from the moment you make it, but it has to be rehearsed, by the rehearsal steps and the evenings with your partner, before it pays off.`,
    steps: [
      'Open School, then the Coursework tab, and find How You’ll Play It on the piece, under what the scene asks.',
      'Read each row: the Aspect, the Choice and what it is, The Scene, Abilities It Uses, and Fully Prepared, what the piece would come to played that way with every part complete on a good day.',
      'Pick a way on any aspect. Leave The Pace Open, and its like for the other aspects, takes one back. The line under the table compares your choice with nothing chosen.',
      'Press Play It This Way, or Change How You Play It once you’ve chosen.',
      `Rehearse it: ${ALONE.label}, the other rehearsal steps and each rehearsal kept with your partner rehearse the choice.`,
    ],
    needs: [
      'An open piece with a scene in it: a piece with no scene has nothing to play one way or another.',
      'A choice different from the current one: the button stays grayed until it is.',
    ],
    costs: [
      { label: 'Time', value: 'None to choose. It’s rehearsed by the rehearsal steps and the rehearsals kept with your partner' },
      { label: 'Money', value: 'None' },
      { label: 'A Change Of Mind', value: `Keeps ${pct(PLAYING.keptOnChange)} of what was rehearsed`, estimate: true },
    ],
    reads: [
      { label: 'How Far It’s Rehearsed', value: `Counts as a part of the preparation for each quality the choice shifts by a tenth or more, complete at the scene’s own mark: ${pct(PLAYING.complete)} where the scene favors neither way, and ${pct(PLAYING.complete - GRAIN.prep)} to ${pct(Math.min(1, PLAYING.complete + GRAIN.prep))} by how well it suits the scene (The Scene)`, estimate: true },
      { label: 'Abilities It Uses', value: `${(Object.keys(APPROACH_EFFECT) as (keyof typeof APPROACH_EFFECT)[]).map((s) => `${APPROACH_EFFECT[s].label}, ${drawsOn(s)}`).join('; ')}${STAMINA_SIDES.length ? `. ${andList(STAMINA_SIDES)} ${STAMINA_SIDES.length > 1 ? 'use' : 'uses'} stamina too, in work shown whole with no scene; a scene is judged part by part, counts stamina only as tiring toward the end however it’s played, and its table leaves stamina out` : ''}` },
      { label: 'What Counts Most', value: 'Each way shifts the balance between the qualities your teacher looks for and never adds to them: a choice changes what counts most, never the total', estimate: true },
      { label: 'Fit', value: `A way the scene doesn’t take holds the qualities it favors to ${pct(MISFIT)} of themselves, and says so before you choose`, estimate: true },
      { label: 'The Scene', value: `How well each way suits the scene, from what the scene is: its genre’s register, its tones and turns, its features, its language and its medium, and for a practice brief its reader and the reading you’ve taken. The register’s concerns and the reader each count for ${pct(GRAIN.reader)} of how they lean, the same, so neither settles it alone. A class scene and a play also say what their circumstances ask of the scale: what a character keeps hidden and a private exchange argue for ${APPROACH_EFFECT.restrained.label}; speaking to many and a conflict brought out loud argue for ${APPROACH_EFFECT.expansive.label}. A stage asks your voice and body to reach the back row of the audience whichever way you play it: that counts in how cleanly you perform, and it doesn’t make playing large the better choice. ${GRAIN_LABEL.suits} makes the way easier to make work on the qualities it favors, by up to ${pct(GRAIN.strength)} of the piece’s difficulty, and asks less rehearsal, complete at down to ${pct(PLAYING.complete - GRAIN.prep)}; ${GRAIN_LABEL.against} makes it harder and asks more, up to ${pct(Math.min(1, PLAYING.complete + GRAIN.prep))}. At full ability every way that fits still reaches 100`, estimate: true },
    ],
    now: [
      `“Chosen. You’ve rehearsed this way of playing it to … so far.” A first choice starts at 0%; the same choice again keeps all of it; a different one keeps ${pct(PLAYING.keptOnChange)}.`,
      'Leaving every aspect open takes the choice away.',
      'The ways you choose are kept on your record of how you play.',
    ],
    later: [
      `Each rehearsal step rehearses the choice by ${pct(PLAYING.gainShare)} of that step’s own share of what’s left, and keeps doing so after its own part is complete, until the choice is complete at the scene’s own mark. A rehearsal kept with your partner does the same, by ${pct(PLAYING.gainShare)} of its own share.`,
      'The showing counts it with the rest of the preparation, and Your Work So Far names a way you choose most of the time as a habit.',
    ],
    interpret: [
      'Fully Prepared is the expected result with no luck either way, every part complete and a good day: what the choice can reach, not where the piece stands now.',
      '“Doesn’t fit:” under a way says the scene doesn’t take it, and why.',
      `The Scene names each way ${GRAIN_LABEL.suits}, ${GRAIN_LABEL.either} or ${GRAIN_LABEL.against}, and the two or three things in the scene it rests on, for it or against it. It isn’t a verdict on the way: one you do well can still beat one that suits the scene better, and the result says what the way’s fit gave or cost apart from what your abilities cost.`,
      '“You’ve rehearsed your current choice to …% so far (it’s complete at …%)” is how far along it is, against the scene’s own mark.',
      'With nothing chosen, the piece is judged by its own genre and material alone.',
    ],
    unavailable: [
      '“It’s already been shown.”',
      '“There’s no scene in this piece, so there’s no way of playing it to choose.”',
      // From 2026-10-17 (brief 13's journeys): written work isn't performed, and nothing of it rehearses a way in.
      '“It’s written work: you present it at the table and don’t perform it, so there’s no way of playing it to choose.”: Table Work, whose scene is read at the table.',
      LOCKED,
    ],
    mistakes: [
      `Changing your mind late: a change keeps ${pct(PLAYING.keptOnChange)} of the rehearsal, so a choice changed the night before starts from that share of what the old one had.`,
      'Choosing and never rehearsing: short of the scene’s mark, the choice counts as a part of the preparation not yet complete, and holds back the qualities it favors most.',
      'Choosing a way the scene doesn’t take: it says so first, and the qualities it favors are held back.',
    ],
    next: [
      `Rehearse the choice: ${ALONE.label} and the other rehearsal steps, and an evening with your partner.`,
      'Watch the line under the table until the choice is complete, then leave it alone: a late change loses most of the rehearsal.',
    ],
    related: ['coursework.prepare', 'coursework.workbook', 'craft.identity', 'productions.part'],
    connections: [
      { to: 'coursework.prepare', kind: 'prerequisite', why: `A choice pays off once it’s rehearsed, and the rehearsal steps, ${ALONE.label} among them, are what rehearse it, with the rehearsals kept with your partner.` },
      { to: 'coursework.partners', kind: 'scheduled', why: 'A rehearsal kept with your partner rehearses the choice too, as a rehearsal step does.' },
      { to: 'coursework.feedback', kind: 'evaluation', why: 'The showing counts the choice: what it favors, the abilities it uses, and how far it’s rehearsed.' },
      { to: 'coursework.workbook', kind: 'optional', why: 'An aspect left open here can be played its own way in one part of the scene, with Play This Part Another Way.' },
      { to: 'craft.identity', kind: 'history', why: 'Every way you choose and show is kept, and Your Work So Far names one you choose most of the time.' },
    ],
    example: {
      setup: `${SCENE_STUDY.title} on ${EXAMPLE_SCENE.title}, the lines learned, at readiness 80 and an even nature, nothing chosen yet.`,
      steps: [`Choose ${APPROACH_EFFECT.measured.label} on ${AXES.pace.label} and press Play It This Way.`, `${ALONE.label} twice.`, `Change to ${APPROACH_EFFECT.driven.label}.`],
      result: `The choice starts at 0%. Each ${ALONE.label} moves it ${pct(CHOICE_STEP)} of what’s left, so two bring it to ${pct(CHOSEN_TWICE)}. The change keeps ${pct(KEPT_ON_CHANGE)}, and from there ${word(STEPS_TO_COMPLETE)} more steps of ${ALONE.label} bring it to ${pct(CHOICE_DONE)}, past the ${pct(DRIVEN_MARK)} that completes it in ${EXAMPLE_SCENE.title}, where ${APPROACH_EFFECT.driven.label} is ${GRAIN_LABEL[DRIVEN_SUITS.band]}.`,
    },
  },
  {
    id: 'coursework.feedback',
    title: 'Feedback And Your Notes',
    goal: 'coursework',
    covers: ['school.read_feedback'],
    synonyms: ['feedback', 'notes ledger', 'your notes', 'mark as read', 'unready band', 'exceptional band', 'shown again', 'note taken', 'still there', 'better not yet', 'work shown'],
    questions: ['What did my teacher say?', 'What do Unready, Working, Strong and Exceptional mean?', 'Why do I keep getting the same note?', 'How do I take a note?', 'What does Mark As Read do?', 'When is work shown again?'],
    where: { route: ROUTE, tab: COURSEWORK_TAB, label: 'School, Coursework, Feedback, Work Shown And Your Notes' },
    available: `${OPENED}, once a piece has been shown.`,
    short: `Feedback is the teacher’s note on a piece you’ve shown, telling you what held it back most and what to do next. In the class it’s due, the piece is shown and given a band (Unready under ${EVALUATION.bands.working}, Working, Strong from ${EVALUATION.bands.strong}, Exceptional from ${EVALUATION.bands.exceptional}), what went well, and one note. Notes are kept by what they’re about, across every course, so a note that comes back says so: new, still there, or better but not there yet. Once the part a note named has come right, the note is marked taken, and it comes back only if the part slips. With nothing holding the piece back, the note is a next step to try. The feedback is the game’s, labeled simulated, because the teachers are real people.`,
    steps: [
      'After the class, read the notice: “Shown:”, the piece’s title and its band, then the course’s note. It says how the piece compares with the course’s last one where the band moved, what held it back most, and what to try.',
      'On the Coursework tab, a piece to be shown again keeps its Feedback on its card: the band and the score, the kind of note, what went well, the note, and The Scene Together where there’s a partner. Press Mark As Read.',
      `Work on the note before it’s shown again: ${REVISE.label}, or the steps for the part it names.`,
      'Your Notes lists every note by what it’s about: how often it’s been given, when first and last, and whether it’s open, better or taken. Work Shown lists your last twelve pieces and how each went.',
    ],
    needs: ['A piece shown. Mark As Read needs new feedback on a piece still open.'],
    costs: [{ label: 'Time', value: 'None: reading it moves no clock' }, { label: 'Money', value: 'None' }],
    reads: [
      { label: 'The Note', value: `What held it back most: the part furthest short for its Note Priority (the part put first counts a little more while it’s under ${pct(LEARNING.enough)}); an answer at the table the text doesn’t support; or a skill the piece asks more of than you have`, estimate: true },
      { label: 'Taken', value: `A part a note named, at ${pct(LEARNING.enough)} or more at a later showing. It’s named again only if it falls under ${pct(LEARNING.slipped)}`, estimate: true },
      { label: 'Better, Not There Yet', value: `The same part ${Math.round(LEARNING.better * 100)} points or more above where it was when last named, but still short`, estimate: true },
      { label: 'Shown Again', value: `Taken when its part has risen ${Math.round(WORK.revision.dimRise * 100)} points since, or reached ${pct(WORK.revision.dimEnough)} from under it, or ${REVISE.label} stands at ${pct(WORK.revision.worked)}; a note about an answer at the table, when the answer is one the text supports`, estimate: true },
      { label: 'What Went Well', value: 'Each part at three quarters or more; the skills it’s shown for, well above what the piece asks; coming rested, where the day held nothing back; and an earlier note now taken' },
    ],
    now: ['Mark As Read marks the feedback read, and the steps on the piece open again.'],
    later: [
      `A piece the course revises is shown again at its next class. If you’ve taken the note, that class grows your craft ${pct(WORK.revision.applied)} of a usual one; if not, ${pct(WORK.revision.notApplied)}. Its second band is the one that counts for the term.`,
      `A note that’s open and has been given ${word(LEARNING.persistent)} times opens another way to work on it, on any open piece that prepares its part. Given more often still, its notice is titled “Still There:”, at most once in ${LEARNING.quietDays} days.`,
      'A piece in rounds is shown a round at a time, each round judging its own parts; a note on a part is taken at a later round that judges that part.',
      'The term’s review counts each piece’s band, the second for a piece shown again. If you’re not there to show it again and have no excuse, it counts as Unready.',
    ],
    interpret: [
      'The heading reads Feedback, the band, the score out of 100 and the kind of note: A New Note, Still There, Better, Not There Yet, Note Taken, or The Next Step.',
      'A note given before says when and in which course; one that’s better gives the figure then and now; one that had been taken and has slipped back says when you put it right.',
      'A piece whose preparation was in place and still came out under Strong is told what held it back, your condition on the day or your craft, and what to do about it where there’s something to do. Then comes the next step to try.',
      'Each course speaks in its own terms: acting of what you want and the other person, voice of breath and sound, movement of the body, and text of the reading. A note given often is said shorter, with what’s still open.',
      'The Scene Together, under a paired piece, is the scene with your partner’s part in it. The band is for your own work.',
      'Your Notes leaves out the next steps to try, and lists open notes first.',
    ],
    unavailable: [
      '“There’s no feedback on that.”',
      '“You’ve already read it.”',
      'A piece shown and done keeps its note under Work Shown, with no button to press.',
      LOCKED,
    ],
    mistakes: [
      'Leaving new feedback unread on a piece to be shown again: every step on the piece is refused until you mark it read.',
      `Working on the wrong thing: the note names the part that cost the most. ${REVISE.label} at ${pct(WORK.revision.worked)} counts as taking a note on a part or a skill; a note about an answer at the table needs the answer changed.`,
      'Missing the class it’s to be shown again at, without an excuse: it counts as Unready this term.',
    ],
    next: [
      'Press Mark As Read, then work on what the note names before the piece is shown again.',
      'If the same note keeps coming back, use one of the other ways to work on it the piece offers.',
      'Check Your Notes now and then: the open ones are first.',
    ],
    related: ['coursework.prepare', 'coursework.approach', 'coursework.table', 'coursework.partners', 'school.standing', 'craft.identity'],
    connections: [
      { to: 'coursework.approach', kind: 'immediate', why: `A note that’s open and given ${LEARNING.persistent} times, on a part a piece prepares, opens another way to work on it on that piece.` },
      { to: 'coursework.prepare', kind: 'scheduled', why: 'A piece the course revises comes back open, due at its next class, with the note to take.' },
      { to: 'craft.profile', kind: 'immediate', why: `The band sets how much the class grows the course’s skills, from ${pct(WORK.weight.unready)} of a usual class for Unready to ${pct(WORK.weight.exceptional)} for Exceptional.` },
      { to: 'school.standing', kind: 'evaluation', why: `The term’s review counts the bands: once ${ESTIMATE.coursework.shown} or more pieces are due, ${pct(ESTIMATE.coursework.unready)} or more Unready or not shown is short.` },
      { to: 'coursework.partners', kind: 'evaluation', why: 'Under a paired piece, the scene together shows your partner’s preparation, timing, answers and any slip, separately from your band.' },
      { to: 'craft.identity', kind: 'history', why: `Each showing is on your record, and a note still open after ${LEARNING.persistent} times shows in Your Work So Far as one that keeps coming back.` },
    ],
    example: {
      setup: `${SCENE_STUDY.title} on ${SEAGULL.play} as ${NINA}, ${partOf(SCENE_STUDY, 'memorization')} put first, shown with ${(Object.entries(SHOWN) as [PrepDim, number][]).map(([d, v]) => `${partOf(SCENE_STUDY, d)} at ${pct(v)}`).join(', ')}.`,
      steps: ['It’s shown in the class it’s due at.', 'Mark the feedback read.', `Before it’s shown again, ${REVISE.label} twice.`],
      result: `${partOf(SCENE_STUDY, SHORTEST.d)} is furthest short for its Note Priority, so the note is on it: “${NOTE_TEXT}” Two of ${REVISE.label}, a little quicker now the showing has met the scene’s material, bring the note’s work to ${pct(NOTE_WORKED)}, past ${pct(WORK.revision.worked)}, so it’s taken at the next class wherever the part stands, and that class grows the course’s skills ${pct(WORK.revision.applied)} of a usual one.`,
    },
  },
  {
    id: 'coursework.approach',
    title: 'Another Way At A Note',
    goal: 'coursework',
    covers: ['school.approach'],
    synonyms: ['persistent weakness', 'a note that keeps coming back', 'targeted drill', 'put it first', 'a smaller piece', 'work on it with your partner', 'same note again'],
    questions: ['I keep getting the same note: what can I do?', 'What does a targeted drill do?', 'What does A Smaller Piece Of It cost?', 'Can I choose more than one way?'],
    where: { route: ROUTE, tab: COURSEWORK_TAB, label: 'School, Coursework, A Note That Keeps Coming Back' },
    available: `${OPENED}, on an open piece, once a note on a part it prepares has been given ${LEARNING.persistent} times and is still open.`,
    short: `When the same note keeps coming back, given ${LEARNING.persistent} times and still open, a piece that prepares its part offers four other ways to work on it, one per piece: ${andList(Object.values(APPROACHES).map((a) => a.label))}. Each changes how this piece goes at the weakness. None of them takes the note by itself: the part still has to be prepared far enough by the time the piece is shown.`,
    steps: [
      'Open School, then the Coursework tab. A piece the note can help shows “A Note That Keeps Coming Back:”, the note, and how often it’s been given.',
      'Point at a way to see what it does, or read why it can’t be chosen under the buttons.',
      'Press one. It stays for this piece, and the card says which you chose.',
      'Then do the work: the drill each day, the steps on the part, or the rehearsal with your partner.',
    ],
    needs: [
      `A note that’s open and has been given ${LEARNING.persistent} or more times, on a part this piece prepares; a note about an answer at the table counts as one on the table work.`,
      'The piece open, with no way chosen for it yet.',
      `For ${APPROACHES.objective.label}, a part this piece can put first. For ${APPROACHES.partner.label}, a partner still willing to work with you, on a note that isn’t already about work with your partner.`,
      `For ${APPROACHES.drill.label} or ${APPROACHES.partner.label} on the table work, a piece with a step of its own at the table, or with no scene: on ${SCENE_STUDY.title} and courses like it the table work is your answers alone, and neither changes them.`,
    ],
    costs: [
      { label: 'Time', value: `None to choose. ${APPROACHES.drill.label} adds a step of ${APPROACH.drill.minutes} minutes, once a day`, estimate: true },
      { label: 'Money', value: 'None' },
    ],
    reads: [
      { label: APPROACHES.drill.label, value: `A step on that part, ${APPROACH.drill.minutes} minutes once a day, moving it ${pct(APPROACH.drill.gain)} of what’s left`, estimate: true },
      { label: APPROACHES.objective.label, value: `The part’s Note Priority is ${LEARNING.objectiveWeight} times its own before the parts are rebalanced, the qualities of the result it affects count ${LEARNING.objectiveWeight} times as much, and it becomes the piece’s Put First`, estimate: true },
      { label: APPROACHES.partner.label, value: `The next rehearsal kept with your partner also moves that part ${pct(APPROACH.partner)} of what’s left, once`, estimate: true },
      { label: APPROACHES.smaller.label, value: `${pct(APPROACH.smaller)} of the part counts as complete, and the band can be no better than Working`, estimate: true },
    ],
    now: [
      'The way is kept on the piece, with the note it’s for and the day, and the card reads “Another Way At It:” and what it does.',
      `${APPROACHES.drill.label}: a new step on the card, named for the part.`,
      `${APPROACHES.objective.label}: Put First changes to that part, and its Note Priority rises.`,
    ],
    later: [
      `When the piece is shown, a part a note named that stands at ${pct(LEARNING.enough)} or more takes the note, however it got there.`,
      `${APPROACHES.smaller.label}: shown as no better than Working, since less was shown.`,
      `${APPROACHES.partner.label}: worked once, at the next rehearsal you keep.`,
    ],
    interpret: [
      'The note it’s for is the one given most often among those the piece can help.',
      'The card’s “It won’t take the note by itself: you still take it at a showing.” means the part still has to be prepared far enough by the time you show the piece.',
      'When a way is grayed, its reason shows under the buttons.',
    ],
    unavailable: [
      '“You’ve already chosen … for this piece.”',
      '“This piece can’t help with any of your recurring notes.”',
      '“This piece can’t put that part first.”',
      '“This piece has no partner.” and “That note is already about working with your partner, so this wouldn’t add anything.”',
      '“… would rather work alone, after last time.”',
      '“On this piece, Table Work is your answers to its questions, so a drill or your partner can’t change it. Change an answer under Table Work instead.”',
      '“That piece is finished.”',
      LOCKED,
    ],
    mistakes: [
      'Choosing a way and not doing the work: the drill still has to be done a day at a time, and the rehearsal still has to be kept.',
      `Choosing ${APPROACHES.smaller.label} on a piece that could be Strong: it caps the band at Working.`,
      `Choosing ${APPROACHES.partner.label} with a partner whose trust in you is under ${WORK.trust.wary}: it’s refused. Make amends first.`,
    ],
    next: [
      `Do the work the way asks: the ${APPROACHES.drill.label.toLowerCase()} once a day, or the steps on the part, or book the rehearsal with your partner.`,
      'Watch the part’s figure on the card: the note is taken once it’s far enough at the showing.',
    ],
    related: ['coursework.feedback', 'coursework.prepare', 'coursework.partners'],
    connections: [
      { to: 'coursework.feedback', kind: 'prerequisite', why: `It opens once a note has been given ${LEARNING.persistent} times on the same part and is still open.` },
      { to: 'coursework.prepare', kind: 'immediate', why: `${APPROACHES.drill.label} adds a step to the piece, and ${APPROACHES.objective.label} changes what counts most in it.` },
      { to: 'coursework.partners', kind: 'scheduled', why: `${APPROACHES.partner.label} works on the part at the next rehearsal kept with your partner.` },
      { to: 'school.standing', kind: 'evaluation', why: `${APPROACHES.smaller.label} caps the band at Working, and the term’s review counts a Working piece as neither Unready nor Strong.` },
    ],
    example: {
      setup: `${partOf(SCENE_STUDY, 'memorization')} named ${word(LEARNING.persistent)} times and still open, on a piece of ${SCENE_STUDY.title} with the lines at ${pct(LINES_AT)}, at readiness 80, an even nature and memory at 50, in material new to you.`,
      steps: [`Choose ${APPROACHES.drill.label}.`, 'Do it once a day for three days.'],
      result: `The lines go to ${DRILLED.map(pct).join(', then ')}: past ${pct(LEARNING.enough)}, so a showing then takes the note. With ${APPROACHES.smaller.label} instead, the ${pct(LINES_AT)} would read as ${pct(Math.min(1, LINES_AT / APPROACH.smaller))}, and the band could be no better than Working.`,
    },
  },
  {
    id: 'coursework.partners',
    title: 'Rehearsing With A Partner',
    goal: 'coursework',
    covers: ['school.ask_partner', 'school.answer_partner', 'school.cancel_rehearsal', 'look.classmate'],
    synonyms: ['scene partner', 'ask to rehearse', 'book a rehearsal', 'call it off', 'partner asks to rehearse', 'partner’s trust', 'partner reliability', 'stood up', 'the scene together', 'partner didn’t come', 'run it with a reader', 'a reader', 'rehearse without my partner'],
    questions: ['How do I rehearse with my partner?', 'Why did my partner say no?', 'What happens if I miss a rehearsal?', 'What happens if my partner doesn’t come?', 'Does my partner’s work lower my band?', 'How do I call a rehearsal off?', 'What if my partner won’t rehearse with me?'],
    where: { route: ROUTE, tab: COURSEWORK_TAB, label: 'School, Coursework, Rehearsing With Your Partner' },
    available: `${OPENED}, on paired work, once you’ve met your partner at orientation or in class.`,
    short: `Paired work comes with a scene partner from your class, and the part you do together is a rehearsal you agree with them: ${WORK.rehearsal.minutes} minutes between ${clock(WORK.rehearsal.from)} and ${clock(WORK.rehearsal.until)}, asked for at least ${WORK.rehearsal.aheadHours} hours ahead and before the piece is due. They answer by their own day and how far they trust you, come or don’t by how reliable they are, and may ask you too. Your band is for your own work alone. Beside it, the scene together adds what your partner brings: their preparation, their timing, whether your answers at the table agree, and any slip on the day.`,
    steps: [
      'Open School, then the Coursework tab, and find Rehearsing With … on a paired piece: their trust, how often they’ve come, and how reliable they are.',
      'Choose a Day before it’s due and a Time, and press Ask with their name. A yes puts it on your calendar; a no says why, and costs nothing.',
      `When they ask you (a notice, “… Asks To Rehearse”), press Say Yes or Say No by the time it gives, ${WORK.rehearsal.aheadHours} hours ahead.`,
      'Be in New Haven and awake when it comes: it’s on your calendar, and the clock stops at it.',
      'To call one off, press Call It Off beside it. Less than a day ahead is short notice.',
      `Without them, press ${READER.label} among the piece’s steps: an evening with a reader feeding your partner’s lines, once a day.`,
    ],
    needs: [
      'An open piece with a partner, and the partner met: at orientation’s Meeting Your Class, or at your first class.',
      `A time at least ${WORK.rehearsal.aheadHours} hours ahead, ending before nine on the day it’s due, with nothing else of yours then.`,
      'For a yes: the partner free then, trusting you enough, and asked a day ahead if they’ve set a boundary.',
    ],
    costs: [
      { label: 'Time', value: `${WORK.rehearsal.minutes} minutes on your feet in New Haven, at the time agreed`, estimate: true },
      { label: 'Money', value: 'None' },
      { label: 'Their Trust', value: `Starts at ${WORK.trust.start} of 100. A rehearsal kept, up ${WORK.trust.kept}; missed by you, down ${-WORK.trust.missed}; called off less than a day ahead, down ${-WORK.trust.lateCancel}; their request left unanswered, down ${-WORK.ask.unanswered}. Under ${WORK.trust.wary}, they’d rather work alone`, estimate: true },
      { label: 'The Bond', value: `A rehearsal kept, ${WORK.bond.kept} closer; missed by you, ${-WORK.bond.missed} further apart; each as your nature takes it`, estimate: true },
    ],
    reads: [
      { label: 'Their Day', value: `In class until three, a Saturday work-study shift, a production’s calls from three Tuesday to Friday, a Cabaret show from six, and no rehearsal before ${clock(WORK.rehearsal.from)} or after ${clock(WORK.rehearsal.until)}` },
      { label: 'Their Reliability', value: `Set once, from ${pct(WORK.reliability.from)} to ${pct(WORK.reliability.to)}, higher for the more driven: how often they come when they’ve said yes`, estimate: true },
      { label: 'Their Preparation', value: `What they do alone, about ${pct(WORK.partnerOwnPerWeek)} a week since the piece was set, by their drive, their reliability and their trust in you, up to ${pct(WORK.partnerOwnMost)}; and each rehearsal together brings them up with you`, estimate: true },
      { label: 'The Scene Together', value: `Your result with their contribution added to the qualities a partner shares, by how much the scene is played off them: connection and responsiveness up to ${pct(ENSEMBLE.share.connection ?? 0)}, believability ${pct(ENSEMBLE.share.believability ?? 0)}, consistency ${pct(ENSEMBLE.share.consistency ?? 0)}`, estimate: true },
      { label: 'A Reader', value: `${READER.label}, ${READER.minutes} minutes once a day, raises your own partner part ${pct(READER.gain)} of what’s left at an ordinary focus, against ${pct(WITH_PARTNER.gain)} with your partner, and completes it after ${word(READER_EVENINGS)} evenings at a focus of 1. It practices listening and rehearses the way you chose to play the scene, but doesn’t bring your partner up at all, and changes neither their trust nor the bond`, estimate: true },
      { label: 'A Slip', value: `A chance on the day of ${pct(ENSEMBLE.slipRate)} of their unreliability (about one scene in ${word(Math.round(1 / ((1 - WORK.reliability.from) * ENSEMBLE.slipRate)))} for the least reliable), in one part of the scene; your listening and adaptability cover some of it`, estimate: true },
    ],
    now: [
      'Ask: a yes books it as Rehearsal With … on your calendar; a no gives their reason, and they remember being asked.',
      'Saying no to their request costs nothing; saying yes books it.',
      `Call It Off a day or more ahead, and they take it as moved with notice. Less than a day ahead, their trust falls ${-WORK.trust.lateCancel}, and it counts as a time you let them down until you make amends.`,
    ],
    later: [
      `Kept: your partner part rises ${pct(WITH_PARTNER.gain)} of what’s left at an ordinary focus, the way you chose to play the scene, if you chose one, is rehearsed by ${pct(PLAYING.gainShare)} of that share, the evening is practice in listening, trust rises ${WORK.trust.kept} and the bond ${WORK.bond.kept}, and they say what held the scene back most.`,
      `If you don’t come, away or asleep: they waited for you; their trust falls ${-WORK.trust.missed}, the bond ${-WORK.bond.missed}, and it waits to be put right.`,
      `If they don’t come: you lose the evening, and they may apologize in class. ${READER.label} works your side of it without them.`,
      'In hospital, laid up or on a day you’ve called in sick, it’s excused; for partner work in a studio, an injury that stops you training excuses it too. They know you’re ill, and don’t hold it against you.',
      `In class, on a day with nothing booked between you, they may ask (on ${pct(WORK.ask.chance)} of such days) for ${clock(WORK.ask.hour)} on one of the next ${word(WORK.ask.withinDays)} evenings they’re free. If you don’t answer, it lapses, and their trust falls ${-WORK.ask.unanswered}.`,
      `When the piece is shown, a scene together at Strong or better brings you ${TOGETHER_BOND} closer, and a slip of theirs you covered earns ${TOGETHER_COVERED} of their trust.`,
      'If you’re not there for the showing and have no excuse, their trust and the bond fall as for a missed rehearsal.',
    ],
    interpret: [
      '“Trust … of 100” is how they stand with you, and “Came to … of … rehearsals agreed” how often they’ve come (“No rehearsals agreed yet” before any).',
      'Their name, under Your Partners, opens them: what the scene together showed of them on each piece you share (their preparation, their timing, whether your answers agree), and what’s happened between you.',
      'After a rehearsal they say what held the scene back: not knowing it, being on book, unclear choices, or not enough time on its feet; or that it’s coming together. The choices are judged as the showing judges the table work: your answers at the table, and where the course has a step of its own there, that step too. These are the game’s words, labeled simulated.',
      'The Scene Together, under the feedback, says how it compared with your own work, and why. Your own result stands as it is.',
    ],
    unavailable: [
      '“You haven’t met … yet. You’ll meet your class at orientation, or at your first class.”',
      `“Ask at least ${WORK.rehearsal.aheadHours} hours ahead.”`,
      '“That’s after the piece is due.”',
      '“You’re already rehearsing then.” and “You have … then.”',
      // From 2026-10-17 (brief 13's journeys): an evening the School already knows it would excuse isn't asked for.
      '“You’ll still be in hospital then, so the rehearsal would be called off.”, “You’ll still be laid up with … then, so the rehearsal would be called off.”, and for work on its feet an injury’s “Not with …; it has … yet to mend.”, followed by “Rehearsing on your feet with your partner has to wait for that too.”',
      'A no in their own words: in class until three, a work-study shift, rehearsal calls, a Cabaret show, outside their hours, would rather work on it alone, or asked to be asked a day ahead.',
      '“You didn’t answer in time.” and “You’ve answered it.”',
      '“There’s no such rehearsal booked.”',
      LOCKED,
    ],
    mistakes: [
      'Booking an evening and sleeping through it: it costs as much trust as missing the showing itself, more than anything else here. Pick a time you’ll be up, or call it off a day ahead.',
      'Leaving their request unanswered: it lapses and costs a little trust, where a no costs none.',
      `Expecting your partner to cost you your band: it’s for your own work, and your own partner part is yours to finish, with them or with ${READER.label}. What they bring shows in the scene together.`,
      `Rehearsing only with a reader when your partner would come: the part rises less an evening, and the scene together still shows a partner who prepared alone.`,
      `A partner whose trust has fallen under ${WORK.trust.wary} turns every request down: make amends, and keep the rehearsals you do agree.`,
    ],
    next: [
      'Ask for two evenings a few days apart, both before the piece is due, and keep them.',
      'Answer their requests in time, even with a no.',
      'If a rehearsal went wrong, make amends under Your Partners before you ask again.',
    ],
    related: ['coursework.class', 'coursework.prepare', 'coursework.feedback', 'school.orientation', 'craft.identity'],
    connections: [
      { to: 'school.orientation', kind: 'prerequisite', why: 'You can’t ask a partner you haven’t met; Meeting Your Class, or your first class, meets them.' },
      { to: 'day.calendar', kind: 'scheduled', why: 'A rehearsal you agree goes on your calendar, and the clock stops at it.' },
      { to: 'coursework.prepare', kind: 'scheduled', why: 'A rehearsal kept moves the piece’s partner part when it’s held, and a request of theirs left open holds the piece’s other steps until you answer.' },
      { to: 'coursework.class', kind: 'history', why: 'A rehearsal missed or called off late is held against you until you make amends, and two of them can bring a boundary.' },
      { to: 'coursework.feedback', kind: 'evaluation', why: 'The showing’s scene together shows their preparation, timing, agreement and reliability, separately from your band.' },
      { to: 'craft.identity', kind: 'history', why: 'Each scene played together is counted, and Your Work So Far gives how they came out on average from the third on.' },
      { to: 'school.sick', kind: 'scheduled', why: 'A rehearsal booked on a day you’ve called in sick is excused, and costs none of their trust.' },
      { to: 'coursework.playing', kind: 'immediate', why: 'A rehearsal kept rehearses the way you chose to play the scene, as a rehearsal step does.' },
    ],
    example: {
      setup: `${SCENE_STUDY.title} set two weeks before it’s due, your partner at an ordinary drive, ${pct(RELIABLE)} reliable and trusting you at ${WORK.trust.start}; you at readiness 80.`,
      steps: ['Ask them for two evenings, and keep both.', 'Show it in the class it’s due at.'],
      result: `Your partner part reaches ${pct(PARTNER_PART[0]!)}, then ${pct(PARTNER_PART[1]!)}, and their trust ${WORK.trust.start + WORK.trust.kept}, then ${TRUST_AFTER}. Alone they’ve prepared ${pct(PARTNER_OWN)}; with the evenings together, ${pct(PARTNER_PREP)}, the preparation the scene together reads. Sleep through the second, and their trust would stand at ${WORK.trust.start + WORK.trust.kept + WORK.trust.missed}, your partner part at ${pct(PARTNER_PART[0]!)}.`,
    },
  },
  {
    id: 'coursework.class',
    title: 'Your Class',
    goal: 'coursework',
    covers: ['school.respond', 'school.make_amends'],
    synonyms: ['classmates', 'a different reading', 'run lines together', 'asks for help', 'a word after class', 'an apology', 'a boundary', 'make amends', 'your partners panel', 'cares most about'],
    questions: ['What do my classmates want from me?', 'What happens if I don’t answer?', 'How do I make it right with a classmate?', 'Why does a classmate want a day’s notice?', 'Should I keep my reading or take theirs?'],
    where: { route: ROUTE, tab: COURSEWORK_TAB, label: 'School, Coursework, Your Class And Your Partners' },
    available: `${OPENED}, from the first class you’re at with them.`,
    short: `On a class day you’re there, a classmate may bring you something, on about ${pct(CLASS.chance)} of such days and one at a time: another reading of your shared scene, an evening to run lines, a request for help, a word after a hard showing, an apology, or a boundary. Answer it under Your Class on the Coursework tab within ${CLASS.answerHours} hours. Your answer can change their trust in you, the bond between you, or your work, and who brings what depends on what each cares about most and what has happened between you. If you’ve let someone down, press Make Amends beside them under Your Partners.`,
    steps: [
      'Read the notice, or Your Class on the Coursework tab: who, what, and when the answer is due.',
      'Press an answer. When one is grayed, its reason shows under the buttons.',
      'For an evening of running lines, choose Which Scene You Share where there’s more than one.',
      'Your Partners lists each classmate you’ve worked with: trust, how often they came, reliability, what they care about most, any boundary, and the last thing that happened.',
      'Beside one you’ve let down, press Make Amends.',
    ],
    needs: [
      'Being in class that day, with no other moment from the class waiting for your answer.',
      `For ${CHOICES.help[0]!.label}: ${CLASS.help.minutes} minutes free now. For ${CHOICES.study[0]!.label}: the evening still ahead and clear.`,
      `For Make Amends: something between you to put right, and ${CLASS.amends.minutes} minutes free.`,
    ],
    costs: [
      { label: 'Time', value: `${CHOICES.help[0]!.label}: ${CLASS.help.minutes} minutes then and there. Running lines: ${CLASS.study.minutes} minutes at ${clock(CLASS.study.hour)} on the evening agreed. Make Amends: ${CLASS.amends.minutes} minutes. Any other answer takes no time`, estimate: true },
      { label: 'Money', value: 'None' },
    ],
    reads: [
      { label: 'A Different Reading', value: `${CHOICES.disagreement[0]!.label}: trust holds, or falls ${-CLASS.holdAgainstText.trust} where the text supports their answer and not yours, and the scene together counts your answers as apart. ${CHOICES.disagreement[1]!.label}: their answer replaces yours, trust up ${CLASS.theirs.trust}, bond up ${CLASS.theirs.bond}. ${CHOICES.disagreement[2]!.label}: trust up ${CLASS.both.trust}, bond up ${CLASS.both.bond}, and both are tried at the next rehearsal you keep, the scene together counting them as apart until then`, estimate: true },
      { label: 'An Evening Running Lines', value: `${CHOICES.study[0]!.label}: kept, the lines of the scene you share rise ${pct(CLASS.study.memorization)} of what’s left, trust up ${CLASS.study.kept.trust}, bond up ${CLASS.study.kept.bond}; missed, trust down ${-CLASS.study.missed.trust}, bond down ${-CLASS.study.missed.bond}. ${CHOICES.study[1]!.label}: no cost, though after ${word(CLASS.study.declinedStop)} turned down or unanswered in a row they stop asking for ${CLASS.study.quietDays} days. Unanswered: trust down ${-CLASS.study.unanswered}`, estimate: true },
      { label: 'A Request For Help', value: `${CHOICES.help[0]!.label}: trust up ${CLASS.help.trust}, bond up ${CLASS.help.bond}, and they may ask to run your lines in return within ${CLASS.help.returnDays} days. ${CHOICES.help[1]!.label}: no cost`, estimate: true },
      { label: 'A Word After Class', value: `From a classmate at a bond of ${CLASS.encourage.bondFrom} or more, after an Unready showing in the last three days: morale up ${CLASS.encourage.morale}, with no answer to give`, estimate: true },
      { label: 'An Apology', value: `After a rehearsal they didn’t come to. ${CHOICES.apology[0]!.label}: bond up ${CLASS.apology.accept}. ${CHOICES.apology[1]!.label}: bond down ${-CLASS.apology.cool}`, estimate: true },
      { label: 'A Boundary', value: `After you’ve let them down ${times(CLASS.boundary.after)} without making it right: from then on, ask them a day ahead. ${CHOICES.boundary[0]!.label}: trust up ${CLASS.boundary.respect}, lifting after ${word(CLASS.boundary.liftAfterKept.accepted)} rehearsals kept. ${CHOICES.boundary[1]!.label}: trust down ${-CLASS.boundary.argue.trust}, bond down ${-CLASS.boundary.argue.bond}, lifting after ${word(CLASS.boundary.liftAfterKept.pushedBack)}`, estimate: true },
      { label: 'Make Amends', value: `For each rehearsal or evening you missed: trust up ${CLASS.amends.missed.trust}, bond up ${CLASS.amends.missed.bond}. For each one called off late: trust up ${CLASS.amends.lateCancel.trust}, what it took`, estimate: true },
      { label: 'What They Care About', value: `Set once, the more driven caring most about the work: ${andList(Object.values(PRIORITY_WORDS))}. Those who care about the work and the room ask you to run lines; those who care about being seen and a life outside ask for help` },
    ],
    now: [
      'Your answer is kept, and a message says what came of it. A bond moves as your nature takes it.',
      'Make Amends: everything between you so far is marked as put right.',
    ],
    later: [
      'An answer not given in time lapses; only an invitation to run lines costs anything for it.',
      'An evening of running lines you agree goes on your calendar as Running Lines With …. Kept, it works on the scene you share; with no scene shared, it works on their lines and none of yours.',
      `With both readings tried at the next rehearsal you keep, the scene together counts your answers as one again, and where the course has a step of its own at the table, that step’s half of the table work moves ${pct(CLASS.bothGain)} of what’s left. Where the table work is your answers alone, none of your figures moves.`,
      `A bond of ${BONDS.friend} makes them a friend, ${BONDS.close} a close friend, and ${signed(BONDS.rival)} or lower a rival.`,
    ],
    interpret: [
      'Your Class lists what’s waiting with the time to answer by, and the last six moments with how you answered, or Not Answered.',
      'Your Partners shows “Wants A Day’s Notice” for a boundary, with how many more rehearsals must be kept before it lifts, and “Has Stopped Asking You To Run Lines” or “Owes You Lines” where those apply.',
      '“You let them down once and haven’t made it right.” counts what Make Amends would put right.',
    ],
    unavailable: [
      '“It’s too late to answer. The moment has passed.”',
      '“You’ve answered it.”',
      '“That piece is finished.”: another reading of a piece already shown.',
      '“You have … then, so you’ll have to say no.”',
      // From 2026-10-17 (brief 13's journeys): an evening of running lines is the School's, called off with the rest at its end.
      '“Your terms at the School are over: there’s no scene left to run lines for. Say no instead.”: an invitation to run lines still open when the School ends can be declined, not taken.',
      // “That evening has passed.” went from this list on 2026-10-15: every moment lapses before the evening it asks for,
      // in every save this build opens (`respondRefusal`, `strandedMoments`), so no player meets it. Until then it said a
      // save made before 2026-10-12 could, which no build wrote.
      '“There’s nothing between you to make right.”',
      LOCKED,
    ],
    mistakes: [
      'Keeping an answer the text doesn’t support against theirs that it does: it costs trust, and your answers stay apart in the scene together until both are tried.',
      'Letting an invitation lapse: it costs a little trust, and two in a row stop them asking for a while. A no costs nothing.',
      `Letting two let-downs stand: a boundary can follow. Make amends before it does.`,
      `Pushing back on a boundary: it costs trust and closeness, and takes ${word(CLASS.boundary.liftAfterKept.pushedBack)} rehearsals kept to lift, where accepting takes ${word(CLASS.boundary.liftAfterKept.accepted)}.`,
    ],
    next: [
      'Answer what’s waiting under Your Class before its time runs out.',
      'If you’ve let someone down, press Make Amends beside them under Your Partners before you next ask them to rehearse.',
    ],
    related: ['coursework.partners', 'coursework.table', 'coursework.prepare'],
    connections: [
      { to: 'school.orientation', kind: 'prerequisite', why: 'A classmate brings you something once you’ve met them, at Meeting Your Class or in class.' },
      { to: 'coursework.table', kind: 'immediate', why: `${CHOICES.disagreement[1]!.label} replaces your answer to the question with theirs at once.` },
      { to: 'coursework.partners', kind: 'immediate', why: 'An answer can change their trust, which counts when you ask them to rehearse; a boundary asks for a day’s notice.' },
      { to: 'coursework.prepare', kind: 'scheduled', why: `An evening of running lines kept moves the lines of the scene you share ${pct(CLASS.study.memorization)} of what’s left.` },
      { to: 'body.how', kind: 'immediate', why: `A word after a hard showing lifts your morale ${CLASS.encourage.morale}.` },
    ],
    example: {
      setup: `Your partner trusts you at ${WORK.trust.start}. You sleep through a rehearsal with them, then call the next one off the same afternoon.`,
      steps: [`In class, they set a boundary: they’ll only rehearse if asked a day ahead. Press ${CHOICES.boundary[0]!.label}.`, 'Press Make Amends beside them on Your Partners.'],
      result: `Their trust falls to ${T_MISSED}, then ${T_LATE}; accepting the boundary brings it to ${T_ACCEPTED}, and making amends to ${T_AMENDED}, with the bond ${CLASS.amends.missed.bond + CLASS.amends.lateCancel.bond} closer. The boundary stays until ${word(CLASS.boundary.liftAfterKept.accepted)} rehearsals are kept; until then, an ask less than a day ahead gets a no.`,
    },
  },
  {
    id: 'coursework.workbook',
    title: 'Working A Problem Through',
    goal: 'coursework',
    covers: ['work.identify', 'work.try', 'work.settle'],
    synonyms: ['work it through', 'workbook', 'problem in the scene', 'work it slowly', 'run into it', 'play this part another way', 'find places to breathe', 'name what you want', 'run it with your partner', 'keep it or put it back', 'what you’ve found'],
    questions: ['How do I fix the weak part of a scene?', 'What do Keep It and Put It Back do?', 'Why is this problem offered?', 'Does working a problem cost time?', 'Why didn’t the evidence change?', 'Is there luck in it?'],
    where: { route: ROUTE, tab: COURSEWORK_TAB, label: 'School, Coursework, Work It Through' },
    available: `${OPENED}: under a scene for class while it’s open, under a practice brief once a reading is chosen, and under a part in a production while its run is to come.`,
    short: 'Work It Through is how you find and fix what’s holding a piece back, the same way for a scene for class, a practice brief and a part in a production. It shows the piece’s problems, worst first, from what the piece would come to now with no luck either way: a part of it not secure, a turn into one not yet worked, tiring late, an ability holding it back, what you want not clear yet, a partner not there yet. Name one, try a way to work on it, and see its figure before and after. Work you do is kept; a change to how a part is played waits for you to keep it or put it back. Every later forecast, rehearsal and performance of the piece includes what you keep.',
    steps: [
      'Find Work It Through under the piece: under a scene on the Coursework tab, under a practice brief on the Player Profile, under a part on the Casting tab.',
      'Read the problems the piece shows, worst first, each with why. Press one to name it as the problem you’re working on.',
      'Under Working On, each way to work on it gives its minutes and what it does. Press one: its time passes, and a message gives the figure before and after.',
      'A change to how a part is played waits for you: press Keep It, or Put It Back to have it as it was.',
      'Read the tries, newest first, and What You’ve Found, the discoveries every later forecast and performance includes.',
    ],
    needs: [
      'A piece in progress: an open scene for class with its material, a practice brief with a reading chosen, or a part whose run is still to come.',
      `Some of the lines learned first: ${pct(BRIEF.rehearseNeeds)} of a brief’s, a scene’s or a part’s.`,
      'A problem named before you try a way, and any change you tried kept or put back before the next.',
      `For a way on your feet, energy of ${SPENT} or more and no injury that stops training. For any way, being awake, out of hospital, at nothing else, and free for its minutes.`,
    ],
    costs: [
      { label: 'Time', value: Object.values(ADJUSTMENTS).map((a) => `${a.label}, ${a.minutes} minutes`).join('; '), estimate: true },
      { label: 'Money', value: 'None' },
      { label: 'Naming And Settling', value: 'No time: naming a problem, keeping a change and putting one back move no clock' },
    ],
    reads: [
      { label: 'The Forecast', value: 'What the piece would come to now, with no luck either way: the same way tried on the same piece on the same day shows the same figure' },
      { label: 'A Problem', value: `A part of the piece short of the rehearsal it needs, or ${points(WORKBOOK.segmentGap)} under the whole; stamina, an ability or a part of the preparation costing half a point of the whole or more; a partner leaving the scene together three points or more under your own. At most ${WORKBOOK.offered}, worst first, including the one you’ve named while it’s still a problem` },
      { label: 'The Evidence', value: 'The problem’s own figure before and after: its part’s result, the whole, or the scene together' },
      { label: ADJUSTMENTS['work-beat'].label, value: `That part’s own rehearsal, ${pct(WORKBOOK.workGain)} of what’s left at an ordinary focus`, estimate: true },
      { label: ADJUSTMENTS['run-into'].label, value: `This part ${pct(WORKBOOK.intoAfter)} and the one before it ${pct(WORKBOOK.intoBefore)}, of what’s left; practice in adaptability`, estimate: true },
      { label: ADJUSTMENTS['beat-way'].label, value: `One part paced, sized or shaped its own way, on an aspect the whole leaves open and the material allows; rehearsed to ${pct(WORKBOOK.wayGain)} by trying it, and further by working it slowly`, estimate: true },
      { label: ADJUSTMENTS.breathe.label, value: `The piece’s load on your stamina, down to ${pct(WORKBOOK.breathe)} of itself`, estimate: true },
      { label: ADJUSTMENTS.objective.label, value: `The breakdown a reading rests on, ${pct(WORKBOOK.objectiveGain)} of what’s left: a brief’s, or a scene’s own step at the table where the course has one (${SCAN.label}, ${SPEAK.label}), which the problem names. On ${SCENE_STUDY.title} and the scenes whose table work is your answers alone it isn’t offered: table work that’s short shows as “${TABLE_SHORT}”, which your answers at the table fix`, estimate: true },
      { label: ADJUSTMENTS['with-partner'].label, value: `A classmate reading a brief with you: their preparation, ${pct(WORKBOOK.partnerGain)} of what’s left. Not offered on a scene for class, where their side moves with the rehearsals you agree with them, and the problem says to ask them to rehearse it with you`, estimate: true },
    ],
    now: [
      'Naming a problem keeps it as the one you’re working on.',
      'A way you try takes its minutes and changes the piece, and the try is kept with its figure before and after.',
      'Work you do (working a part slowly, running into it, naming what you want, running it with a reader) is kept at once, and a problem it solves leaves the list by itself.',
      'Playing a part another way, or finding places to breathe, waits for Keep It or Put It Back. Kept, it’s a discovery. Put back, the piece is as it was, and that way isn’t offered for the problem again.',
      'Working on an ability’s problem trains it a little, and running into a part trains your adaptability.',
    ],
    later: [
      'Every later forecast and performance of the piece includes what you kept: the take of a brief, the showing of a scene, a night of a part.',
      `What You’ve Found lists each part played its own way and how far it’s rehearsed, places to breathe you’ve found, and each try kept that moved its figure ${points(WORKBOOK.evidence)} or more.`,
    ],
    interpret: [
      'Before and after are the problem’s own figure: a part’s result for a problem in one part, the last part’s for tiring late, the whole for an ability or a part of the preparation, the scene together for a partner.',
      'A try that barely moves its figure tells you something too: the problem may want another way, or its own preparation step.',
      '“There’s no way left to work on it here” means its own preparation step works on it, or the ways you tried were put back. A partner not there yet on a scene for class has no way here either: its line ends “Ask … to rehearse it with you.”',
      'The tries table keeps the last six, newest first, each Kept, Put back or Waiting.',
    ],
    unavailable: [
      '“Name the problem you’re working on first.”',
      '“Keep or put back the change you tried first.”',
      '“That isn’t a problem the work shows now.”',
      '“You tried that for this and put it back.” and “That doesn’t answer the problem you’re working on.”',
      '“Choose a reading first. Working it through means working on the scene played one way.”: a brief.',
      '“Learn some of the lines first: there’s nothing to rehearse without them.”, and for a part, “Learn some of the part first: there’s nothing to rehearse without it.”',
      '“You’re too tired to work on your feet. Sleep first.”, “Not from a hospital bed.” and “You’re asleep.”',
      '“There’s no change waiting to be kept or put back.”',
      LOCKED,
    ],
    mistakes: [
      'Trying a way again in hope of luck: there’s none here. The forecast has no luck in it, so a try shows only what it changed; where it barely moved, try another way, or the preparation step the problem names.',
      `On ${SCENE_STUDY.title} and scenes like it, the table work is your answers: when it’s the problem, “${TABLE_SHORT}” has no way to work on it here, so answer the Table Work questions the way the text supports.`,
      'On a scene for class, your partner’s side moves with the rehearsals you agree with them: book one from the piece.',
      'Keeping a change that made the figure worse: every later performance includes it. Put It Back is there for that.',
    ],
    next: [
      'Work on the worst problem first, and keep going until it leaves the list.',
      'Then come back before the showing, the take or the night: the list changes as the piece does.',
    ],
    related: ['coursework.prepare', 'coursework.playing', 'coursework.partners', 'craft.brief-prepare', 'craft.brief-reader', 'productions.notes', 'productions.part', 'craft.work'],
    connections: [
      { to: 'coursework.prepare', kind: 'prerequisite', why: 'A scene’s lines learned to 30% let you try a way, and a problem in a part of the preparation is fixed by that part’s own step.' },
      { to: 'coursework.feedback', kind: 'evaluation', why: 'The showing judges the scene with each part’s own work and every discovery you kept.' },
      { to: 'craft.brief-prepare', kind: 'evaluation', why: 'A brief’s take includes its beats’ own work and the ways you kept, as its forecast did.' },
      { to: 'craft.brief-reader', kind: 'immediate', why: `${ADJUSTMENTS['with-partner'].label} moves the preparation of a classmate reading a brief with you.` },
      { to: 'productions.notes', kind: 'optional', why: 'A part’s director’s notes are worked on through Work On The Note, by the same ways; Work It Through takes what the notes leave.' },
      { to: 'coursework.playing', kind: 'optional', why: 'Play This Part Another Way works on an aspect the whole leaves open: leave one open to play a part its own way.' },
      { to: 'craft.profile', kind: 'immediate', why: 'Working on an ability’s problem trains it a little, and running into a part trains adaptability.' },
    ],
    example: {
      setup: `${SCENE_STUDY.title} on ${SEAGULL.play}, ${SEAGULL.where}: ${word(SEAGULL_SPEC.segments.length)} parts by its tones and its turns, ${partOf(SCENE_STUDY, 'rehearsal')} at ${pct(REHEARSED)} and the lines learned, at readiness 80 and an even nature.`,
      steps: [`Work It Through shows “The Turn Into ${TURN.label}”: it’s at ${pct(REHEARSED)} of the ${pct(TURN_ASKS)} it needs. Name it.`, `${WORK_BEAT.label}, ${times(WORKED.length)}.`],
      result: `${TURN.label}’s own rehearsal reads ${WORKED.map(pct).join(', then ')}: past the ${pct(TURN_ASKS)} it asks after the ${ordinal(WORKED.length)}, ${span(WORKED.length * WORK_BEAT.minutes)} in all, and the problem leaves the list by itself. Each try is kept with the part’s result before and after, and the showing reads ${TURN.label.toLowerCase()} at ${pct(WORKED[WORKED.length - 1] ?? REHEARSED)}, the rest of the scene still at ${pct(REHEARSED)}.`,
    },
  },
];
