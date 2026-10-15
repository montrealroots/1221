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
import { requiredFor, suitabilityOf } from '../../systems/interpretation';
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
import { segmentPart, segmentRequired, toneSegments, type PieceSpec } from '../../systems/piece';
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
// by how well the side suits it, where until then every choice was complete at `PLAYING.complete`.
const EXAMPLE_SCENE = materialOf('seagull-4')!;
const DRIVEN_SUITS = suitabilityOf('driven', EXAMPLE_SCENE);
const DRIVEN_MARK = requiredFor(['driven'], EXAMPLE_SCENE);
const STEPS_TO_COMPLETE = (() => { let n = 0; while (after(CHOICE_STEP, n, KEPT_ON_CHANGE) < DRIVEN_MARK && n < 50) n += 1; return n; })();
/** Where those steps leave it: past complete, by the last step's share. */
const CHOICE_DONE = after(CHOICE_STEP, STEPS_TO_COMPLETE, KEPT_ON_CHANGE);

// The feedback: a showing with its parts at these, Lines put first, and the part the note names.
const SHOWN: Partial<Record<PrepDim, number>> = { familiarity: 0.8, memorization: 0.4, interpretation: 0.8, rehearsal: 0.5, partner: 0.64 };
const SHORTEST = (Object.entries(SHOWN) as [PrepDim, number][])
  .map(([d, v]) => ({ d, v, short: (LINES_FIRST[d] ?? 0) * (1 - v) + (d === 'memorization' && v < LEARNING.enough ? 0.05 : 0) }))
  .sort((x, y) => y.short - x.short)[0]!;
const NOTE_TEXT = `${SCENE_STUDY.notes[SHORTEST.d] ?? ''} (${partOf(SCENE_STUDY, SHORTEST.d)}: ${pct(SHORTEST.v)}.) As ${NINA} in ${SEAGULL.play}.`;
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

// Working it through: The Seagull's parts in its tones, the first a turn leads into, rehearsal at 36%, worked slowly.
// At 40% until the verifier of the played examples (2026-10-12): its third try came to 92.5%, on the half percent. From
// 36%, what's left is 64 points, and Work It Slowly halves it each time, so each try lands on a whole percent.
const SEAGULL_TONES = materialOf(SEAGULL.id)?.tones ?? [];
const SEAGULL_SPEC: PieceSpec = { segments: toneSegments(SEAGULL_TONES), work: [], part: 'rehearsal', perTurn: PIECE.scene.perTurn, perBlend: PIECE.scene.perBlend, most: PIECE.scene.most, load: 0 };
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
    synonyms: ['assignment', 'scene study', 'coursework steps', 'learn lines', 'read the scene', 'rehearse alone', 'work on the note', 'due date', 'weighs', 'piece of coursework', 'shown today', 'due soonest', 'what to prepare first', 'a word on your coursework', 'unready', 'why is my work unready'],
    questions: ['How do I prepare a scene for class?', 'When is my work due?', 'Why is a step grayed out?', 'What does Weighs mean?', 'How long does learning lines take?', 'What happens if I miss the class it’s due at?', 'What would it come to if I showed it today?', 'Why was I warned about my coursework?'],
    where: { route: ROUTE, tab: COURSEWORK_TAB, label: 'School, Coursework, Each Piece Of Work Set' },
    available: `${OPENED}, once a course has set work: at one of its meetings, or for the first-year fall courses at orientation’s session on the courses.`,
    short: `Each course with work sets a piece at one of its meetings, due a set number of its meetings later (${word(SCENE_STUDY.dueAfter)} for ${SCENE_STUDY.title} in ${ACTING.name}), with a scene, your part in it and a partner from the class where the work has them. Its panel on Coursework shows each part of the preparation, how far along it stands and its Weighs, with a button for each step. A step takes its time and moves its part by a share of what’s left, so the same step again moves it less. At the meeting it’s due the work is shown once and judged on your own result, and its band sets what that meeting grows your craft by.`,
    steps: [
      'Open School, then Coursework. Due Soonest, at the top, names up to three pieces still short of complete, the one due soonest first: what each would come to shown today and what answers each part short. Under it, each open piece has a panel, in the same order, headed by its course and its title, with the day it’s due and the skills it’s shown for.',
      'Read what it is: the play, the scene and where it falls, your part and who plays the other, and Put First, the part this work weighs more.',
      `Each part of the preparation has its figure, with Weighs under it and what completes it, ${pct(EVALUATION.complete.coursework)}. Press a step to do it. Its tip gives the minutes it takes, or why it can’t be done now, and the reasons are listed under the buttons.`,
      'Read Shown Today: what the piece would come to if it were shown today on a good day, what holds it back most, and each part short of complete with the steps that answer it.',
      'Press the panel’s title to open the piece itself: each part with Prepared and Weighs, the same figures as the panel’s, with ways to the course, the day it’s due and your readiness.',
      'Be in New Haven and awake at nine on the day it’s due: the course’s meeting is where it’s shown.',
    ],
    needs: [
      'Work set and open. A course sets its next piece at a meeting when none of its own is open and the term still holds the meeting it would be due at.',
      `What a step builds on: ${LEARN.label} needs the scene read to ${pct(LEARN.requires!.at)}, and ${ALONE.label} the lines learned to ${pct(ALONE.requires!.at)}.`,
      `A step in a studio or on your feet: energy of ${SPENT} or more and no injury that stops training. A studio or the library also needs orientation’s tour behind you.`,
      'New feedback on the piece read, and anything your partner has asked about it answered.',
      `Free for the step’s length: at nothing else, and due at nothing before it would end. ${LEARN.label} is checked for the scene’s own length, ${SCENE_SIZE_MINUTES.short}, ${SCENE_SIZE_MINUTES.medium} or ${SCENE_SIZE_MINUTES.long} minutes, the time it takes.`,
    ],
    costs: [
      { label: 'Time', value: `Each step its own. In ${SCENE_STUDY.title}: ${READ.label}, ${READ.minutes} minutes; ${LEARN.label}, ${SCENE_SIZE_MINUTES.short}, ${SCENE_SIZE_MINUTES.medium} or ${SCENE_SIZE_MINUTES.long} by the scene’s length; ${ALONE.label}, ${ALONE.minutes}; ${REVISE.label}, ${REVISE.minutes}; ${WITH_PARTNER.label}, a rehearsal of ${WORK.rehearsal.minutes} minutes agreed with them`, estimate: true },
      { label: 'Money', value: 'None' },
      { label: 'Your Body', value: `Desk work counts as activity at ${WORK.met.desk} METs, a step that needs a studio or your feet at ${WORK.met.feet}. ${ALONE.label} ${ALONE_ON_FEET ? 'is on your feet, so it counts at the higher figure' : 'asks neither, so it counts as desk work'}`, estimate: true },
    ],
    reads: [
      { label: 'Your Focus', value: 'Readiness against 80, at how the hour suits you, held between half and 110% for a step: the more rested you are, the further a step moves its part', estimate: true },
      { label: 'Your Nature', value: 'How far each kind of step goes for you: reading around for the table work, drilling for lines, skimming for knowing the scene, revising for a note' },
      { label: 'Kinds You Know', value: 'A play in a genre you know, or material whose features you’ve met, prepares faster, by the better of the two' },
      { label: 'The Ability It Practices', value: `Learning lines goes further with memory, the table work with imagination, knowing the scene with focus, and a revision with adaptability: ${pct(STEP_SPEED.least)} as far at 0, as far as the step says at 50, ${pct(STEP_SPEED.most)} at 100`, estimate: true },
      { label: 'What’s Left', value: `Each step moves its part by its share of what’s left: ${READ.label} ${pct(READ.gain)}, ${LEARN.label} ${pct(LEARN.gain)}, ${ALONE.label} ${pct(ALONE.gain)}, ${REVISE.label} ${pct(REVISE.gain)}, at an ordinary focus`, estimate: true },
      { label: 'The Showing', value: `Each part against ${pct(EVALUATION.complete.coursework)} as complete, read by each dimension it bears on, a dimension held back by the least prepared of its parts and never by Weighs; the skills it’s shown for against what the work asks of your year; your condition at the meeting; the scene’s material and the way you chose to play it. A scene is judged part by part, in its tones or, with one, in two halves, its stamina read as a drain that grows toward the end` },
      { label: 'The Band', value: `Working from ${EVALUATION.bands.working}, Strong from ${EVALUATION.bands.strong}, Exceptional from ${EVALUATION.bands.exceptional}; under ${EVALUATION.bands.working}, Unready` },
    ],
    now: [
      'The clock moves on by the step’s minutes, and its part rises by its share of what’s left. A part at 97% or more has nothing more to gain from it.',
      `A step that trains a skill trains it at ${pct(WORK.trainingWeight)} of a class meeting’s weight, for at most ${WORK.trainingSteps} such steps on one piece.`,
      'While it still moves the work, a step practices the ability it calls on: knowing the scene your focus, lines your memory, a step at the table your imagination, a note your adaptability.',
      `A step of rehearsal, ${ALONE.label} and the steps like it, rehearses in the way you chose to play the scene, where you chose one. A daily step counts once a day.`,
    ],
    later: [
      `At nine on the day it’s due the course meets, and the work is shown once in place of the meeting’s ordinary growth: the course’s skills grow ${pct(WORK.weight.unready)} of an ordinary meeting’s for Unready, ${pct(WORK.weight.working)} for Working, ${pct(WORK.weight.strong)} for Strong and ${pct(WORK.weight.exceptional)} for Exceptional.`,
      `Away with an excuse (called in sick, in hospital or laid up), it moves to the course’s next meeting, or is excused if none is left. Away without one, it’s Not Shown and never taken later; it counts as unready at the term’s evaluation, and a partner’s trust falls ${-WORK.trust.missed}.`,
      `In the term, once ${TERM_CHECK.after} of its pieces have been shown and ${pct(ESTIMATE.coursework.unready - TERM_CHECK.margin)} or more of them were Unready, A Word On Your Coursework comes once: how many, the part most often short on them, the steps that answer it, how many pieces are still to come and the day the faculty reviews the term.`,
      `At the term’s evaluation, with ${ESTIMATE.coursework.shown} or more pieces due, ${pct(ESTIMATE.coursework.unready)} or more of them unready or not shown falls short, and ${pct(ESTIMATE.coursework.strong)} or more Strong or better is noted.`,
      'Work a course revises comes back to be shown again at its next meeting, with the note to take; work in rounds is shown a round at a time. Work still open when the term’s classes end lapses.',
    ],
    interpret: [
      'A part’s figure is how far it’s prepared. Weighs is its share when the showing chooses its note; the result reads the parts through the dimensions they bear on. Put First’s part weighs more in both, and the line beside it says why it was chosen.',
      `At ${pct(EVALUATION.complete.coursework)} a part is complete for the showing. Below it, the dimensions that read it are held back: a part at nothing holds them to ${pct(EVALUATION.prepFloor)} of themselves, whatever it Weighs.`,
      'Shown Today is the showing’s own judge with the day taken out: no draw, and you as rested as you could be. It moves when a part does, and the band beside the figure says what it would earn.',
      'A scene you’ve worked before says so, and asks for the other part, or for another reading at the table.',
      'Work Shown keeps the last twelve pieces and how each went: its band, or “Not Shown”, “Excused, Not Shown” or “Lapsed At Term’s End”.',
    ],
    unavailable: [
      '“That work is finished.”',
      `“${LEARN.requires!.why}” and “${ALONE.requires!.why}”: a step that builds on another.`,
      '“There’s no note to work on until it’s been shown.”',
      '“There’s new feedback on this: read it first.”',
      '“… asked to rehearse: answer first.” and “… reads the scene another way: answer first.”',
      '“There’s nothing more to gain from it now.” and “Done today already: it takes days, not one long session.”',
      `“You’re too tired to work on your feet. Sleep first.” and an injury’s “Not with …; it has … days yet to mend.”: a step in a studio or on your feet${ALONE_ON_FEET ? `, ${ALONE.label} among them` : ''}.`,
      '“Not from a hospital bed.”: a step in a studio, on your feet or at the library.',
      '“You don’t know the building yet: the tour shows you the studios.”, and the same for the library.',
      'At something else, or due somewhere before it would end: it names what, and when.',
      LOCKED,
    ],
    mistakes: [
      `Doing one step over and over: each moves its part by a share of what’s left, so a fourth ${LEARN.label} moves the lines less than the first. Spread the hours over the parts that stand lowest: each dimension of the showing is held back by the least prepared part it reads.`,
      `Starting a long step just before a class: ${LEARN.label} on a long scene takes ${SCENE_SIZE_MINUTES.long} minutes. Leave room for it.`,
      'Sleeping through the meeting it’s due: the work isn’t shown and never taken later. Unwell, call in sick before nine and it moves to the next meeting.',
      `Leaving it to the day before: a daily step counts once a day, and a rehearsal with your partner has to be agreed at least ${WORK.rehearsal.aheadHours} hours ahead.`,
      `Leaving a scene’s partner part at nothing because it Weighs little: the dimensions it bears on are held to ${pct(EVALUATION.prepFloor)} of themselves however well the rest is prepared, and Shown Today says what that costs before the showing. Ask your partner for an evening a few days ahead, or ${READER.label}.`,
    ],
    related: ['coursework.table', 'coursework.playing', 'coursework.partners', 'coursework.feedback', 'coursework.workbook', 'school.orientation', 'school.standing'],
    connections: [
      { to: 'school.orientation', kind: 'prerequisite', why: 'The tour opens the studios and the library to your steps, and the session on the courses sets the first-year fall’s first work.' },
      { to: 'coursework.playing', kind: 'immediate', why: 'Each step of rehearsal rehearses in the way you chose to play the scene.' },
      { to: 'craft.profile', kind: 'immediate', why: `A step trains its skill for up to ${WORK.trainingSteps} steps a piece, and practices the ability it calls on.` },
      { to: 'coursework.feedback', kind: 'scheduled', why: 'At the meeting it’s due, the preparation is read and the showing gives its band and its note.' },
      { to: 'school.standing', kind: 'evaluation', why: `The term’s evaluation reads each piece’s band: with ${ESTIMATE.coursework.shown} or more due, ${pct(ESTIMATE.coursework.unready)} unready or not shown falls short.` },
      { to: 'body.how', kind: 'evaluation', why: 'Readiness sets how far each step moves its part, and your condition at the meeting is read in the showing.' },
      { to: 'craft.identity', kind: 'history', why: 'Each showing is kept on your record, where Your Work So Far reads your strengths and what keeps holding you back.' },
    ],
    example: {
      setup: `${ACTING_III.name} sets ${SCENE_STUDY.title} on ${SEAGULL.play}, ${SEAGULL.where}: you play ${NINA}, a long scene, with ${partOf(SCENE_STUDY, 'memorization')} put first. You work at readiness 80, with an even nature, your focus and memory at 50, in a kind of play and material new to you.`,
      steps: [`${READ.label} twice, ${READ.minutes} minutes each.`, `${LEARN.label} three times, ${LONG_LINES} minutes each.`, `${ALONE.label} twice, ${ALONE.minutes} minutes each.`],
      result: `${span(PREP_MINUTES)} in all. ${partOf(SCENE_STUDY, 'familiarity')} reads ${pct(PREP_READ)}, ${partOf(SCENE_STUDY, 'memorization')} ${pct(PREP_LINES)} and ${partOf(SCENE_STUDY, 'rehearsal')} ${pct(PREP_ALONE)}. Put first, the Weighs under ${partOf(SCENE_STUDY, 'memorization')} reads ${pct(LINES_FIRST.memorization ?? 0)} in place of its own ${pct(SCENE_STUDY.dims.memorization?.weight ?? 0)}, and the dimensions of the result that read the lines lean ${LEARNING.objectiveWeight} times as far before the weights are evened out. The three of ${LEARN.label} were the piece’s ${word(WORK.trainingSteps)} steps that train a skill, so a fourth moves the lines and practices your ${MEMORY}, the skill they train, with none of the training on top: it grows by the practice alone.`,
    },
  },
  {
    id: 'coursework.table',
    title: 'Table Work',
    goal: 'coursework',
    covers: ['school.choose'],
    synonyms: ['given circumstances', 'the relationship', 'the obstacle', 'a choice to play', 'reading of the scene', 'what the text supports', 'answers at the table', 'interpretation'],
    questions: ['What are the table work questions?', 'How do I know if my reading is right?', 'Why does my table work read low?', 'Can I change an answer?', 'Why was I asked for another reading?'],
    where: { route: ROUTE, tab: COURSEWORK_TAB, label: 'School, Coursework, Table Work On A Scene' },
    available: `${OPENED}, on any open piece with a scene and a part of yours in it, once the scene is read to 30%.`,
    short: `Table work is deciding what the scene is, question by question: ${andList(QUESTIONS.map((q) => q.label))}. Each question offers readings. Some the text supports and some it cuts against, and a question can have more than one supported reading, each counting the same. Your answers are the table work the showing reads: on most scene courses, the share answered with a reading the text supports; where the course has a step of its own at the table, half your answers and half that step.`,
    steps: [
      'Open School, then Coursework, and find Table Work on the piece’s panel.',
      `Choose a reading for each question from its list. Each choice takes ${CHOOSE_MINUTES} minutes, and says “Decided at the table.”`,
      'Watch the part’s figure on the panel: a supported reading raises it at once, and one the text cuts against doesn’t.',
      'Once the piece is shown, an answer the text cuts against says what cuts against it, and most supported answers say what in the text they rest on.',
    ],
    needs: [
      'The scene read to 30%: table work is done on a text you know.',
      'A piece with a scene and your part in it, still open.',
      `${CHOOSE_MINUTES} minutes free.`,
    ],
    costs: [
      { label: 'Time', value: `${CHOOSE_MINUTES} minutes a question, and ${CHOOSE_MINUTES} more for each answer changed`, estimate: true },
      { label: 'Money', value: 'None' },
    ],
    reads: [
      { label: 'Answers The Text Supports', value: `The share of the ${QUESTIONS.length} questions answered with a reading the text supports; one left undecided counts for none` },
      { label: 'A Step At The Table', value: `Where the course has one (${SCAN.label} in ${CLASSICAL.title}, ${SPEAK.label} in ${GREEK.title}), the table work is half your answers and half that step` },
      { label: 'Another Reading Asked', value: `A scene back to be read another way, answered as last time where the text allows another, counts ${pct(LEARNING.sameReading)} of itself`, estimate: true },
      { label: 'The Note', value: 'A reading the text cuts against can be what the showing’s note names, in the text’s own reason' },
    ],
    now: [
      `The answer is kept, and the clock moves on ${CHOOSE_MINUTES} minutes.`,
      'The table work’s figure on the panel moves with it.',
    ],
    later: [
      `In class, your partner may read one of your answered questions another way, and ask: ${andList(CHOICES.disagreement.map((c) => c.label))}.`,
      'At the showing, the table work is read as one part of the preparation by each dimension it bears on, a dimension held back by the least prepared of its parts; its weight only chooses the note.',
      'A note on a reading is taken when the work is shown again with an answer the text supports.',
      'A scene you come back to that asks for another reading reads your answers against last time’s.',
    ],
    interpret: [
      `The figure under the course’s name for it (${partOf(SCENE_STUDY, 'interpretation')} in ${SCENE_STUDY.title}, ${partOf(CLASSICAL, 'interpretation')} in ${CLASSICAL.title}) is the table work as the showing will read it.`,
      'After the showing, “What it rests on” marks a supported reading, and “What cuts against it” one the text doesn’t bear.',
      'For a scene that came back, “Your reading differs from last time’s.” or “Your reading is last time’s so far.” says whether it’s another reading yet.',
      'Which readings the text supports is SLATE’s reading of each play, written to be checked against it.',
    ],
    unavailable: [
      '“Read it first: table work is done on a text you know.”',
      '“That’s your answer already.”',
      '“That work is finished.”',
      `At something else, or due somewhere in the next ${word(CHOOSE_MINUTES)} minutes: it names what, and when.`,
      LOCKED,
    ],
    mistakes: [
      'Answering by what sounds strongest: a reading the text cuts against lowers the table work and can become the note. The scene’s summary, and an original scene’s facts, are what the readings rest on.',
      `Taking a partner’s reading on trust: ${CHOICES.disagreement[1]!.label} puts their answer in place of yours, and where the text cuts against theirs, the table work falls.`,
      `On a scene that came back for another reading, changing nothing: it counts ${pct(LEARNING.sameReading)} until one answer differs where the text supports another.`,
    ],
    related: ['coursework.prepare', 'coursework.class', 'coursework.feedback', 'coursework.workbook'],
    connections: [
      { to: 'coursework.prepare', kind: 'prerequisite', why: `The scene read to 30% with ${READ.label} opens the questions.` },
      { to: 'coursework.class', kind: 'scheduled', why: 'A partner may come to class with another reading of a question you’ve answered, and ask you to keep yours, take theirs or try both.' },
      { to: 'coursework.feedback', kind: 'evaluation', why: 'The showing reads your answers as the table work, and a reading the text cuts against can be its note.' },
      { to: 'coursework.partners', kind: 'evaluation', why: `A reading held apart from your partner’s leaves the scene together at ${pct(ENSEMBLE.apart)} agreement until both are tried.` },
      { to: 'coursework.workbook', kind: 'optional', why: `On ${SCENE_STUDY.title} and the courses read like it, Work It Through can name the table work as a problem, with no way at it there: a supported reading at the table is what answers it.` },
    ],
    example: {
      setup: `${SCENE_STUDY.title} on ${SEAGULL.play}, ${SEAGULL.where}, as ${NINA}, the scene read once.`,
      steps: [`Answer all ${word(QUESTIONS.length)} questions: ${word(QUESTIONS.length - 1)} with readings the text supports, one it cuts against.`, 'Change that one to a reading the text supports.'],
      result: `The answers take ${QUESTIONS.length * CHOOSE_MINUTES} minutes, and ${partOf(SCENE_STUDY, 'interpretation')} reads ${pct(SUPPORTED)}. The change takes ${CHOOSE_MINUTES} more and brings it to ${pct(1)}. In ${CLASSICAL.title}, with ${SCAN.label} done ${times(SCANS)}, four of five answers supported would read ${pct(0.5 * SUPPORTED + 0.5 * SCANNED)}, then ${pct(0.5 + 0.5 * SCANNED)}.`,
    },
  },
  {
    id: 'coursework.playing',
    title: 'How You’ll Play A Scene',
    goal: 'coursework',
    covers: ['school.choose_playing'],
    synonyms: ['measured or driven', 'restrained or expansive', 'set or open', 'way of playing a scene', 'pace scale structure', 'rehearsed in', 'fully prepared column', 'leave it open'],
    questions: ['How should I play the scene?', 'What do measured and driven change?', 'What does Fully Prepared mean?', 'What happens if I change my mind?', 'Why doesn’t a choice fit?'],
    where: { route: ROUTE, tab: COURSEWORK_TAB, label: 'School, Coursework, How You’ll Play It' },
    available: `${OPENED}, on any open piece with a scene in it.`,
    short: `How You’ll Play It offers a choice on up to three axes, each between two ways or left open: ${andList(SIDES)}. Each side leans the showing’s dimensions toward what it is and draws on abilities of its own, so a choice that leans on what you do well shows you better, and at full ability every choice that fits reaches 100. Before you choose, the table shows what the work would come to played each way, fully prepared. A choice leans the work from the moment it’s made, and its rehearsal, by the steps of rehearsal and the evenings with your partner, is a part of the preparation the dimensions it leans on most read.`,
    steps: [
      'Open School, then Coursework, and find How You’ll Play It on the piece, under what the scene asks.',
      'Read each row: the side, what it is, what it draws on, and Fully Prepared, what the work would come to played that way with every part complete on a good day.',
      'Pick a side on any axis; Leave The Pace Open, and its like for the other axes, takes one back. The line under the table sets your choice against nothing chosen.',
      'Press Play It This Way, or Change How You Play It once a choice stands.',
      `Rehearse: ${ALONE.label}, the other steps of rehearsal and each rehearsal kept with your partner rehearse the choice in.`,
    ],
    needs: [
      'An open piece with a scene in it: work with no scene has nothing to play one way or another.',
      'A choice different from the one standing: the button stays gray until it is.',
    ],
    costs: [
      { label: 'Time', value: 'None to choose; it’s rehearsed in by the steps of rehearsal and the rehearsals kept with your partner' },
      { label: 'Money', value: 'None' },
      { label: 'A Change Of Mind', value: `Keeps ${pct(PLAYING.keptOnChange)} of what was rehearsed in`, estimate: true },
    ],
    reads: [
      { label: 'Rehearsed In', value: `Read as a part of the preparation by each dimension the choice leans on by a tenth or more, complete at ${pct(PLAYING.complete)}`, estimate: true },
      { label: 'What Each Side Draws On', value: `${(Object.keys(APPROACH_EFFECT) as (keyof typeof APPROACH_EFFECT)[]).map((s) => `${APPROACH_EFFECT[s].label}, ${drawsOn(s)}`).join('; ')}${STAMINA_SIDES.length ? `. ${andList(STAMINA_SIDES)} ${STAMINA_SIDES.length > 1 ? 'draw' : 'draws'} on stamina too, in work shown whole, with no scene; a scene is judged part by part, reads stamina only as tiring toward the end however it’s played, and its table leaves stamina out` : ''}` },
      { label: 'Lean', value: 'Each side moves weight between the showing’s dimensions and never adds any: a choice changes what counts most, never the total', estimate: true },
      { label: 'Fit', value: `A side the scene doesn’t take holds the dimensions it leans on to ${pct(MISFIT)} of themselves, and says so before you choose`, estimate: true },
      { label: 'The Scene', value: `How well each side suits the scene, from what the scene is: its tones and turns, its features, its language and its medium, and for a practice brief its genre’s register, its reader and the reading you’ve taken. ${GRAIN_LABEL.suits} makes the side easier to make work on the dimensions it leans on, up to ${pct(GRAIN.strength)} of the work’s difficulty, and asks less rehearsal, complete at down to ${pct(PLAYING.complete - GRAIN.prep)}; ${GRAIN_LABEL.against} makes it harder and asks more, up to ${pct(Math.min(1, PLAYING.complete + GRAIN.prep))}. At full ability every side that fits still reaches 100`, estimate: true },
    ],
    now: [
      `“Chosen: rehearsed in to …%.” A first choice starts at 0%; the same choice again keeps all of it; a different one keeps ${pct(PLAYING.keptOnChange)}.`,
      'Leaving every axis open takes the choice away.',
      'The sides chosen are kept on your record of how you play.',
    ],
    later: [
      `Each step of rehearsal rehearses it in by ${pct(PLAYING.gainShare)} of that step’s own share, of what’s left, and keeps doing so after its own part is complete, until the choice reaches ${pct(PLAYING.complete)}. A rehearsal kept with your partner does the same, by ${pct(PLAYING.gainShare)} of its own share.`,
      'The showing reads it with the rest of the preparation, and Your Work So Far names a side you choose most of the time as a habit.',
    ],
    interpret: [
      'Fully Prepared is the expected result with no draw, every part complete and a good day: what the choice can reach, not where the work stands now.',
      '“Doesn’t fit:” under a side says the scene doesn’t take it, and why.',
      `The Scene names each side ${GRAIN_LABEL.suits}, ${GRAIN_LABEL.either} or ${GRAIN_LABEL.against} and the two or three things in the scene it rests on, for it or against it. It isn’t a verdict on the side: one you do well can still beat one that suits the scene better, and the take’s result says what the side’s suitability gave or cost apart from what your abilities cost.`,
      `“Your choice now is rehearsed in to …% (complete at ${pct(PLAYING.complete)})” is how far along it is.`,
      'With nothing chosen, the work is read by its own genre and material alone.',
    ],
    unavailable: [
      '“It’s been shown.”',
      '“There’s no scene in it to play one way or another.”',
      LOCKED,
    ],
    mistakes: [
      `Changing your mind late: a change keeps ${pct(PLAYING.keptOnChange)} of the rehearsal, so a choice changed the night before starts from that share of what the old one had.`,
      `Choosing and never rehearsing it: short of ${pct(PLAYING.complete)}, the choice counts as a part of the preparation not yet complete, and holds back the dimensions it leans on most.`,
      'Choosing a side the scene doesn’t take: it says so first, and the dimensions it leans on are held back.',
    ],
    related: ['coursework.prepare', 'coursework.workbook', 'craft.identity', 'productions.part'],
    connections: [
      { to: 'coursework.prepare', kind: 'prerequisite', why: `A choice counts once it’s rehearsed in, and the steps of rehearsal, ${ALONE.label} among them, are what rehearse it in, with the rehearsals kept with your partner.` },
      { to: 'coursework.partners', kind: 'scheduled', why: 'A rehearsal kept with your partner rehearses the choice in too, as a step of rehearsal does.' },
      { to: 'coursework.feedback', kind: 'evaluation', why: 'The showing reads the choice: its lean, the abilities it draws on, and how far it’s rehearsed in.' },
      { to: 'coursework.workbook', kind: 'optional', why: 'An axis left open here can be played its own way in one part of the scene, with Play This Part Another Way.' },
      { to: 'craft.identity', kind: 'history', why: 'Every side chosen and shown is kept, and Your Work So Far names one you choose most of the time.' },
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
    short: `At the meeting it’s due, a piece is shown and judged: its band (Unready under ${EVALUATION.bands.working}, Working, Strong from ${EVALUATION.bands.strong}, Exceptional from ${EVALUATION.bands.exceptional}), what helped, and one note on what held it back most. The notes are kept by what they’re about, across every course, so the next on the same thing says whether it’s new, still there, or better but not yet. A note whose part has come right is marked taken, and comes back only if the part slips. With nothing holding the work back, the note is a step beyond it. The feedback is the game’s, marked simulated.`,
    steps: [
      'After the meeting, read the notice: “Shown:”, the title and the band, what helped, and the note.',
      'On Coursework, a piece to be shown again keeps its Feedback on its panel: the band and the score, the kind of note, what helped, the note, and the scene together where there’s a partner. Press Mark As Read.',
      `Work the note before it’s shown again: ${REVISE.label}, or the part it names.`,
      'Your Notes lists every note by what it’s about: how often given, when first and last, and whether it’s open, better or taken. Work Shown lists the last twelve pieces and how each went.',
    ],
    needs: ['A piece shown. Mark As Read needs new feedback on a piece still open.'],
    costs: [{ label: 'Time', value: 'None: reading it moves no clock' }, { label: 'Money', value: 'None' }],
    reads: [
      { label: 'The Note', value: `What held it back most: the part short by the most of its weight, the part put first counted a little more while under ${pct(LEARNING.enough)}; a reading the text cuts against; or a skill the work asks more of than you have`, estimate: true },
      { label: 'Taken', value: `A part a note named, at ${pct(LEARNING.enough)} or more at a later showing; named again only if it falls under ${pct(LEARNING.slipped)}`, estimate: true },
      { label: 'Better, Not Yet', value: `The same part ${Math.round(LEARNING.better * 100)} points or more above where it was last named, still short`, estimate: true },
      { label: 'Shown Again', value: `Taken when its part has risen ${Math.round(WORK.revision.dimRise * 100)} points since, or reached ${pct(WORK.revision.dimEnough)} from under it, or ${REVISE.label} stands at ${pct(WORK.revision.worked)}; a note on a reading, when the answer is one the text supports`, estimate: true },
      { label: 'What Helped', value: 'Each part at three quarters or more; the skills it’s shown for, well above what the work asks; coming rested and ready, where the day held nothing back; a note from before now taken' },
    ],
    now: ['Mark As Read marks it read, and the steps on the piece open again.'],
    later: [
      `Work a course revises is shown again at its next meeting. Taken, that meeting grows your craft ${pct(WORK.revision.applied)} of an ordinary one; not yet, ${pct(WORK.revision.notApplied)}. Its second band stands for the term.`,
      `A note open and given ${word(LEARNING.persistent)} times opens another way at it on any open piece that prepares its part. Given more often still, its notice says “Still There:”, at most once in ${LEARNING.quietDays} days.`,
      'Work in rounds is shown a round at a time, each reading its own parts; a note on a part is taken at a later round that reads that part.',
      'The term’s evaluation reads each piece’s band, the second for one shown again. Not there to show it again, without an excuse, it counts as unready.',
    ],
    interpret: [
      'The heading reads “Feedback:”, the band, the score of 100 and the kind of note: A New Note, Still There, Better, Not Yet, or The Next Step.',
      'Still There names the day it was last given and the course; Better, Not Yet gives the figure then and now.',
      '“It didn’t come together today:” on work with its preparation in place says what held it back on the day, the condition or the craft, before the next step.',
      'The Scene Together, under a paired piece, is the scene with your partner’s part in it. The band is your own work.',
      'Your Notes leaves out the steps beyond the work, and lists open notes first.',
    ],
    unavailable: [
      '“There’s no feedback on that.”',
      '“Read already.”',
      'A piece shown and done keeps its note in Work Shown, with no button to mark.',
      LOCKED,
    ],
    mistakes: [
      'Leaving new feedback unread on work to be shown again: every step on the piece is refused until it’s marked read.',
      `Working the wrong thing: the note names the part that cost the most. ${REVISE.label} at ${pct(WORK.revision.worked)} counts as taking a note on a part or a skill; a note on a reading needs the answer changed.`,
      'Missing the meeting it’s to be shown again at, without an excuse: it counts as unready this term.',
    ],
    related: ['coursework.prepare', 'coursework.approach', 'coursework.table', 'coursework.partners', 'school.standing', 'craft.identity'],
    connections: [
      { to: 'coursework.approach', kind: 'immediate', why: `A note open and given ${LEARNING.persistent} times, on a part a piece prepares, opens another way at it on that piece.` },
      { to: 'coursework.prepare', kind: 'scheduled', why: 'Work the course revises comes back open, due at its next meeting, with the note to take.' },
      { to: 'craft.profile', kind: 'immediate', why: `The band sets what the meeting grows the course’s skills by, ${pct(WORK.weight.unready)} of an ordinary meeting for Unready to ${pct(WORK.weight.exceptional)} for Exceptional.` },
      { to: 'school.standing', kind: 'evaluation', why: `The term’s evaluation counts the bands: with ${ESTIMATE.coursework.shown} or more pieces due, ${pct(ESTIMATE.coursework.unready)} or more unready or not shown falls short.` },
      { to: 'coursework.partners', kind: 'evaluation', why: 'Under a paired piece, the scene together reads your partner’s preparation, timing, readings and any slip, apart from your band.' },
      { to: 'craft.identity', kind: 'history', why: `Each showing is on the record, and a note still open after ${LEARNING.persistent} times shows in Your Work So Far as one that keeps coming back.` },
    ],
    example: {
      setup: `${SCENE_STUDY.title} on ${SEAGULL.play} as ${NINA}, ${partOf(SCENE_STUDY, 'memorization')} put first, shown with ${(Object.entries(SHOWN) as [PrepDim, number][]).map(([d, v]) => `${partOf(SCENE_STUDY, d)} at ${pct(v)}`).join(', ')}.`,
      steps: ['It’s shown at the meeting it’s due.', 'Mark the feedback read.', `Before it’s shown again, ${REVISE.label} twice.`],
      result: `${partOf(SCENE_STUDY, SHORTEST.d)} is short by the most of its weight, so the note is on it: “${NOTE_TEXT}” Two of ${REVISE.label}, a little quicker now the showing has met the scene’s material, bring the note’s work to ${pct(NOTE_WORKED)}, past ${pct(WORK.revision.worked)}, so it’s taken at the next meeting wherever the part stands, and that meeting grows the course’s skills ${pct(WORK.revision.applied)} of an ordinary one.`,
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
    short: `When the same note keeps coming back, given ${LEARNING.persistent} times and still open, a piece that prepares its part offers four other ways at it, one to a piece: ${andList(Object.values(APPROACHES).map((a) => a.label))}. Each changes how this work goes at the weakness. None of them takes the note by itself: the part still has to stand high enough at a showing.`,
    steps: [
      'Open School, then Coursework. A piece the note can help shows “A Note That Keeps Coming Back:”, the note, and how often it’s been given.',
      'Point at a way for what it does, or read why it can’t be chosen under the buttons.',
      'Press one. It stands for this piece, and the panel says which was chosen.',
      'Then do the work: the drill each day, the steps on the part, the rehearsal with your partner.',
    ],
    needs: [
      `A note open and given ${LEARNING.persistent} or more times, on a part this piece prepares; a note on a reading counts as one on the table work.`,
      'The piece open, with no way chosen for it yet.',
      `For ${APPROACHES.objective.label}, a part this work can put first. For ${APPROACHES.partner.label}, a partner still willing to work with you, on a note other than the work with your partner.`,
      `For ${APPROACHES.drill.label} or ${APPROACHES.partner.label} on the table work, a piece with a step of its own at the table, or with no scene: on ${SCENE_STUDY.title} and the courses read like it the table work is your answers alone, and neither moves them.`,
    ],
    costs: [
      { label: 'Time', value: `None to choose. ${APPROACHES.drill.label} adds a step of ${APPROACH.drill.minutes} minutes, once a day`, estimate: true },
      { label: 'Money', value: 'None' },
    ],
    reads: [
      { label: APPROACHES.drill.label, value: `A step on that part, ${APPROACH.drill.minutes} minutes once a day, moving it ${pct(APPROACH.drill.gain)} of what’s left`, estimate: true },
      { label: APPROACHES.objective.label, value: `Its Weighs is ${LEARNING.objectiveWeight} times its own before the parts are evened out, the dimensions of the result that read it lean ${LEARNING.objectiveWeight} times as far, and it becomes the piece’s Put First`, estimate: true },
      { label: APPROACHES.partner.label, value: `The next rehearsal kept with your partner also moves that part ${pct(APPROACH.partner)} of what’s left, once`, estimate: true },
      { label: APPROACHES.smaller.label, value: `${pct(APPROACH.smaller)} of the part reads as complete, and the band can be no better than Working`, estimate: true },
    ],
    now: [
      'The way is kept on the piece, with the note it’s for and the day, and the panel reads “Another Way At It:” and what it does.',
      `${APPROACHES.drill.label}: a new step on the panel, named for the part.`,
      `${APPROACHES.objective.label}: Put First changes to that part, and its Weighs rises.`,
    ],
    later: [
      `At the showing, a part a note named, at ${pct(LEARNING.enough)} or more, takes the note, however it got there.`,
      `${APPROACHES.smaller.label}: shown as no better than Working, since less was shown.`,
      `${APPROACHES.partner.label}: worked once, at the next rehearsal kept.`,
    ],
    interpret: [
      'The note it’s for is the one given most often among those the piece can help.',
      '“It doesn’t take the note by itself.” means the part still has to stand high enough when it’s shown.',
      'Grayed, each way gives its reason under the buttons.',
    ],
    unavailable: [
      '“You chose … for this work already.”',
      '“No note keeps coming back that this work can help with.”',
      '“This work can’t put that first.”',
      '“This work has no partner.” and “That’s the work with your partner already.”',
      '“… would rather work alone, after last time.”',
      '“Here the table work is your answers: change one at the table.”',
      '“That work is finished.”',
      LOCKED,
    ],
    mistakes: [
      'Choosing a way and not doing the work: the drill still has to be done a day at a time, and the rehearsal still has to be kept.',
      `Reaching for ${APPROACHES.smaller.label} on work that could be Strong: it caps the band at Working.`,
      `Choosing ${APPROACHES.partner.label} with a partner whose trust in you is under ${WORK.trust.wary}: it’s refused. Make amends first.`,
    ],
    related: ['coursework.feedback', 'coursework.prepare', 'coursework.partners'],
    connections: [
      { to: 'coursework.feedback', kind: 'prerequisite', why: `It opens once a note has been given ${LEARNING.persistent} times on the same part and is still open.` },
      { to: 'coursework.prepare', kind: 'immediate', why: `${APPROACHES.drill.label} adds a step to the piece, and ${APPROACHES.objective.label} changes what it weighs.` },
      { to: 'coursework.partners', kind: 'scheduled', why: `${APPROACHES.partner.label} works the part at the next rehearsal kept with your partner.` },
      { to: 'school.standing', kind: 'evaluation', why: `${APPROACHES.smaller.label} caps the band at Working, and the term’s evaluation counts a Working piece as neither unready nor strong.` },
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
    short: `Paired work comes with a partner from the class, and the part of it you do together is a rehearsal agreed with them: ${WORK.rehearsal.minutes} minutes between ${clock(WORK.rehearsal.from)} and ${clock(WORK.rehearsal.until)}, asked at least ${WORK.rehearsal.aheadHours} hours ahead and before it’s due. They answer by their own day and how far they trust you, come or don’t by their reliability, and may ask you too. Your band reads your own work alone. Beside it, the scene together blends in what your partner brings: their preparation, their timing, whether your readings agree, and any slip on the day.`,
    steps: [
      'Open School, then Coursework, and find Rehearsing With … on a paired piece: their trust, how often they’ve come, and their reliability.',
      'Choose a Day before it’s due and a Time, and press Ask with their name. A yes puts it on your calendar; a no says why, and costs nothing.',
      `When they ask (a notice, “… Asks To Rehearse”), press Say Yes or Say No by the time it gives, ${WORK.rehearsal.aheadHours} hours ahead.`,
      'Be in New Haven and awake when it comes: it’s a commitment, and the clock stops at it.',
      'To call one off, press Call It Off beside it. Under a day ahead is short notice.',
      `Without them, press ${READER.label} among the piece’s steps: an evening with a reader feeding your partner’s lines, once a day.`,
    ],
    needs: [
      'Paired work, open, and the partner met: at orientation’s Meeting Your Class, or your first class.',
      `A time at least ${WORK.rehearsal.aheadHours} hours ahead, ending before nine on the day it’s due, with nothing else of yours then.`,
      'For a yes, the partner free then, trusting you enough, and asked a day ahead where they’ve set a boundary.',
    ],
    costs: [
      { label: 'Time', value: `${WORK.rehearsal.minutes} minutes on your feet in New Haven, at the time agreed`, estimate: true },
      { label: 'Money', value: 'None' },
      { label: 'Their Trust', value: `Starts at ${WORK.trust.start} of 100. A rehearsal kept, up ${WORK.trust.kept}; missed by you, down ${-WORK.trust.missed}; called off under a day ahead, down ${-WORK.trust.lateCancel}; their ask left unanswered, down ${-WORK.ask.unanswered}. Under ${WORK.trust.wary}, they’d rather work alone`, estimate: true },
      { label: 'The Bond', value: `A rehearsal kept, ${WORK.bond.kept} closer; missed by you, ${-WORK.bond.missed} further apart; each as your nature takes it`, estimate: true },
    ],
    reads: [
      { label: 'Their Day', value: `In class until three, a Saturday work-study shift, a production’s calls from three Tuesday to Friday, a Cabaret show from six, and no rehearsal before ${clock(WORK.rehearsal.from)} or past ${clock(WORK.rehearsal.until)}` },
      { label: 'Their Reliability', value: `Drawn once, ${pct(WORK.reliability.from)} to ${pct(WORK.reliability.to)}, higher for the more driven: how often they come when they’ve said yes`, estimate: true },
      { label: 'Their Preparation', value: `What they do alone, about ${pct(WORK.partnerOwnPerWeek)} a week since the work was set, by their drive, their reliability and their trust in you, up to ${pct(WORK.partnerOwnMost)}; and each rehearsal together brings them up with you`, estimate: true },
      { label: 'The Scene Together', value: `Your result with their contribution blended into the dimensions a partner shares, by how much the scene is played off them: connection and responsiveness up to ${pct(ENSEMBLE.share.connection ?? 0)}, belief ${pct(ENSEMBLE.share.believability ?? 0)}, holding it together ${pct(ENSEMBLE.share.consistency ?? 0)}`, estimate: true },
      { label: 'A Reader', value: `${READER.label}, ${READER.minutes} minutes once a day, raises your own partner part ${pct(READER.gain)} of what’s left at an ordinary focus, against ${pct(WITH_PARTNER.gain)} with your partner, and complete after ${word(READER_EVENINGS)} evenings at a focus of 1. It practices listening, and rehearses in the way you chose to play the scene, but brings your partner up not at all, and moves neither their trust nor the bond`, estimate: true },
      { label: 'A Slip', value: `A chance on the day of ${pct(ENSEMBLE.slipRate)} of their unreliability (about one scene in ${word(Math.round(1 / ((1 - WORK.reliability.from) * ENSEMBLE.slipRate)))} for the least reliable), in one part of the scene; your listening and adaptability cover some of it`, estimate: true },
    ],
    now: [
      'Ask: a yes books it as Rehearsal With … on your calendar; a no names their reason, and they remember being asked.',
      'Say No to their ask costs nothing; Say Yes books it.',
      `Call It Off a day or more ahead, and they take it as moved with notice. Under a day, their trust falls ${-WORK.trust.lateCancel}, and it counts as a time you let them down until you make amends.`,
    ],
    later: [
      `Kept: your partner part rises ${pct(WITH_PARTNER.gain)} of what’s left at an ordinary focus, the way you chose to play the scene, where you chose one, is rehearsed in by ${pct(PLAYING.gainShare)} of that share, the evening is practice in listening, trust rises ${WORK.trust.kept} and the bond ${WORK.bond.kept}, and they say what held the scene back most.`,
      `Not there yourself, away or asleep: they waited for you; their trust falls ${-WORK.trust.missed}, the bond ${-WORK.bond.missed}, and it waits to be made right.`,
      `They don’t come: you lose the evening, and they may apologize in class. ${READER.label} works your side of it without them.`,
      'In hospital, laid up or on a day you’ve called in sick, it’s excused; for partner work in a studio, an injury that stops you training excuses it too. They know you’re ill, and don’t hold it against you.',
      `In class, on a day with nothing booked between you, they may ask (${pct(WORK.ask.chance)} of such days) for ${clock(WORK.ask.hour)} on one of the next ${word(WORK.ask.withinDays)} evenings they’re free. Left unanswered, it lapses, and their trust falls ${-WORK.ask.unanswered}.`,
      `At the showing, a scene together at Strong or better brings you ${TOGETHER_BOND} closer, and a slip of theirs you covered earns ${TOGETHER_COVERED} of their trust.`,
      'Not there for the showing without an excuse: their trust and the bond fall as for a rehearsal missed.',
    ],
    interpret: [
      '“Trust … of 100 · Came to … of … agreed” is how they stand with you, and how often they’ve come.',
      'Their name, on Your Partners, opens them: what the scene together reads of them on each piece you share (their preparation, their timing, whether your readings agree), and what’s happened between you.',
      'After a rehearsal they say what held the scene back: not knowing it, being on book, unclear choices, or time on its feet; or that it’s coming together. The choices are read as the showing reads the table work: your answers at the table, and where the course has a step of its own there, that step too. The game’s words, marked simulated.',
      'The Scene Together, under the feedback, says how it compared with your own work, and why. Your own result stands as it is.',
    ],
    unavailable: [
      '“You haven’t met … yet: you’ll meet the class at orientation, or at the first class.”',
      `“Ask at least ${WORK.rehearsal.aheadHours} hours ahead.”`,
      '“That’s after it’s due.”',
      '“You’re already rehearsing then.” and “You have … then.”',
      'A no in their own words: in class until three, a work-study shift, rehearsal calls, a Cabaret show, outside their hours, would rather work alone, or asked to be asked a day ahead.',
      '“You didn’t answer in time.” and “You’ve answered it.”',
      '“There’s no such rehearsal booked.”',
      LOCKED,
    ],
    mistakes: [
      'Booking an evening and sleeping through it: it costs as much trust as missing the showing itself, more than anything else here. Set it for a time you’ll be up, or call it off a day ahead.',
      'Leaving their ask unanswered: it lapses and costs a little trust, where a no costs none.',
      `Expecting your partner to cost you your band: it reads your own work, and your own partner part is yours to finish, with them or with ${READER.label}. What they bring shows in the scene together.`,
      `Rehearsing only with a reader when your partner would come: the part rises less an evening, and the scene together still reads a partner who prepared alone.`,
      `A partner whose trust has fallen under ${WORK.trust.wary} turns every ask down: make amends, and keep what you do agree.`,
    ],
    related: ['coursework.class', 'coursework.prepare', 'coursework.feedback', 'school.orientation', 'craft.identity'],
    connections: [
      { to: 'school.orientation', kind: 'prerequisite', why: 'A partner you haven’t met can’t be asked; Meeting Your Class, or the first class, meets them.' },
      { to: 'day.calendar', kind: 'scheduled', why: 'A rehearsal agreed is a commitment on the calendar, and the clock stops at it.' },
      { to: 'coursework.prepare', kind: 'scheduled', why: 'A rehearsal kept moves the piece’s partner part when it’s held, and an ask of theirs left open holds the piece’s other steps until it’s answered.' },
      { to: 'coursework.class', kind: 'history', why: 'A rehearsal missed or called off late is kept against you until you make amends, and two of them can bring a boundary.' },
      { to: 'coursework.feedback', kind: 'evaluation', why: 'The showing’s scene together reads their preparation, timing, agreement and reliability, apart from your band.' },
      { to: 'craft.identity', kind: 'history', why: 'Each scene played together is counted, and Your Work So Far gives how they came out on average from the third on.' },
      { to: 'school.sick', kind: 'scheduled', why: 'A rehearsal booked on a day you’ve called in sick is excused, and costs none of their trust.' },
      { to: 'coursework.playing', kind: 'immediate', why: 'A rehearsal kept rehearses in the way you chose to play the scene, as a step of rehearsal does.' },
    ],
    example: {
      setup: `${SCENE_STUDY.title} set two weeks before it’s due, your partner at an ordinary drive, ${pct(RELIABLE)} reliable and trusting you at ${WORK.trust.start}; you at readiness 80.`,
      steps: ['Ask them for two evenings, and keep both.', 'Show it at the meeting it’s due.'],
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
    short: `On a class day you’re there, a classmate may bring you something, on about ${pct(CLASS.chance)} of such days and one at a time: another reading of your shared scene, an evening to run lines, a request for help, a word after a hard showing, an apology, or a boundary. Each that wants an answer waits ${CLASS.answerHours} hours for one, and an answer can move their trust in you, the bond between you, or your work. Who brings what follows what each cares about most and what has happened between you. When you’ve let one down, Make Amends on Your Partners puts it right.`,
    steps: [
      'Read the notice, or Your Class on Coursework: who, what, and when the answer is due.',
      'Press an answer. A grayed one gives its reason under the buttons.',
      'For an evening of running lines, choose Which Scene You Share where there’s more than one.',
      'Your Partners lists each classmate you’ve worked with: trust, how often they came, reliability, what they care most about, any boundary, and the last thing that happened.',
      'Beside one you’ve let down, press Make Amends.',
    ],
    needs: [
      'In class that day, with no other moment from the class waiting on your answer.',
      `For ${CHOICES.help[0]!.label}: ${CLASS.help.minutes} minutes free now. For ${CHOICES.study[0]!.label}: the evening still ahead and clear.`,
      `For Make Amends: something between you to put right, and ${CLASS.amends.minutes} minutes free.`,
    ],
    costs: [
      { label: 'Time', value: `${CHOICES.help[0]!.label}: ${CLASS.help.minutes} minutes then and there. Running lines: ${CLASS.study.minutes} minutes at ${clock(CLASS.study.hour)} on the evening agreed. Make Amends: ${CLASS.amends.minutes} minutes. Any other answer takes no time`, estimate: true },
      { label: 'Money', value: 'None' },
    ],
    reads: [
      { label: 'A Different Reading', value: `${CHOICES.disagreement[0]!.label}: trust holds, or falls ${-CLASS.holdAgainstText.trust} where the text backs theirs and not yours, and the scene together reads your readings as apart. ${CHOICES.disagreement[1]!.label}: their answer replaces yours, trust up ${CLASS.theirs.trust}, bond up ${CLASS.theirs.bond}. ${CHOICES.disagreement[2]!.label}: trust up ${CLASS.both.trust}, bond up ${CLASS.both.bond}, and both are tried at the next rehearsal kept, the scene together reading them as apart until then`, estimate: true },
      { label: 'An Evening Running Lines', value: `${CHOICES.study[0]!.label}: kept, the lines of the scene you share rise ${pct(CLASS.study.memorization)} of what’s left, trust up ${CLASS.study.kept.trust}, bond up ${CLASS.study.kept.bond}; missed, trust down ${-CLASS.study.missed.trust}, bond down ${-CLASS.study.missed.bond}. ${CHOICES.study[1]!.label}: no cost, though ${word(CLASS.study.declinedStop)} turned down or unanswered in a row and they stop asking for ${CLASS.study.quietDays} days. Unanswered: trust down ${-CLASS.study.unanswered}`, estimate: true },
      { label: 'A Request For Help', value: `${CHOICES.help[0]!.label}: trust up ${CLASS.help.trust}, bond up ${CLASS.help.bond}, and they may ask to run your lines in turn within ${CLASS.help.returnDays} days. ${CHOICES.help[1]!.label}: no cost`, estimate: true },
      { label: 'A Word After Class', value: `From a classmate at a bond of ${CLASS.encourage.bondFrom} or more, after an Unready showing in the last three days: morale up ${CLASS.encourage.morale}, with no answer to give`, estimate: true },
      { label: 'An Apology', value: `After a rehearsal they didn’t come to. ${CHOICES.apology[0]!.label}: bond up ${CLASS.apology.accept}. ${CHOICES.apology[1]!.label}: bond down ${-CLASS.apology.cool}`, estimate: true },
      { label: 'A Boundary', value: `After you’ve let them down ${times(CLASS.boundary.after)} without making it right: from then, ask them a day ahead. ${CHOICES.boundary[0]!.label}: trust up ${CLASS.boundary.respect}, lifting after ${word(CLASS.boundary.liftAfterKept.accepted)} rehearsals kept. ${CHOICES.boundary[1]!.label}: trust down ${-CLASS.boundary.argue.trust}, bond down ${-CLASS.boundary.argue.bond}, lifting after ${word(CLASS.boundary.liftAfterKept.pushedBack)}`, estimate: true },
      { label: 'Make Amends', value: `For each rehearsal or evening you missed: trust up ${CLASS.amends.missed.trust}, bond up ${CLASS.amends.missed.bond}. For each one called off late: trust up ${CLASS.amends.lateCancel.trust}, what it took`, estimate: true },
      { label: 'What They Care About', value: `Drawn once, the more driven caring most for the work: ${andList(Object.values(PRIORITY_WORDS))}. The work and the room ask you to run lines; being seen and a life outside ask for help` },
    ],
    now: [
      'The answer is kept, and a toast says what came of it. A bond moves as your nature takes it.',
      'Make Amends: everything between you so far is marked made right.',
    ],
    later: [
      'An answer not given in time lapses; only an invitation to run lines costs anything for it.',
      'An evening of running lines agreed goes on your calendar as Running Lines With …. Kept, it works the scene you share; with none shared, it works their lines and moves none of yours.',
      `Both readings tried at the next rehearsal kept: the scene together reads your readings as one again, and where the course has a step of its own at the table, that step’s half of the table work moves ${pct(CLASS.bothGain)} of what’s left. Where the table work is your answers alone, no figure of yours moves.`,
      `A bond of ${BONDS.friend} makes them a friend, ${BONDS.close} a close friend, and ${signed(BONDS.rival)} or lower a rival.`,
    ],
    interpret: [
      'Your Class lists what’s waiting with its answer-by time, and the last six moments with how you answered, or Not Answered.',
      'Your Partners shows “Ask A Day Ahead (Lifts After … More Kept)” for a boundary, and “Has Stopped Asking You To Run Lines” or “Owes You Lines” where those apply.',
      '“One time you let them down, not made right.” counts what Make Amends would put right.',
    ],
    unavailable: [
      '“It’s too late to answer: the moment passed.”',
      '“You’ve answered it.”',
      '“That work is finished.”: another reading of a piece already shown.',
      '“You have … then: say no instead.”',
      // “That evening has passed.” went from this list on 2026-10-15: every moment lapses before the evening it asks for,
      // in every save this build opens (`respondRefusal`, `strandedMoments`), so no player meets it. Until then it said a
      // save made before 2026-10-12 could, which no build wrote.
      '“There’s nothing between you to make right.”',
      LOCKED,
    ],
    mistakes: [
      'Keeping a reading the text cuts against, against theirs that it supports: it costs trust, and the readings stay apart in the scene together until both are tried.',
      'Letting an invitation lapse: it costs a little trust, and two in a row stop them asking for a while. A no costs nothing.',
      `Letting two let-downs stand: a boundary can follow. Make Amends before it does.`,
      `Pushing back on a boundary: it costs trust and closeness, and takes ${word(CLASS.boundary.liftAfterKept.pushedBack)} rehearsals kept to lift where accepting takes ${word(CLASS.boundary.liftAfterKept.accepted)}.`,
    ],
    related: ['coursework.partners', 'coursework.table', 'coursework.prepare'],
    connections: [
      { to: 'school.orientation', kind: 'prerequisite', why: 'A classmate brings you something once you’ve met them, at Meeting Your Class or in class.' },
      { to: 'coursework.table', kind: 'immediate', why: `${CHOICES.disagreement[1]!.label} replaces your answer to the question with theirs at once.` },
      { to: 'coursework.partners', kind: 'immediate', why: 'An answer can move their trust, which a partner reads when you ask them to rehearse; a boundary asks for a day’s notice.' },
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
    where: { route: ROUTE, tab: COURSEWORK_TAB, label: 'School, Coursework, Work It Through Under A Scene' },
    available: `${OPENED}: under a scene for class while it’s open, under a practice brief once a reading is chosen, and under a part in a production while its run is to come.`,
    short: 'Work It Through is one process for a scene for class, a practice brief and a part in a production. The piece’s own forecast, the result it would come to now with no luck in it, shows its problems, worst first: a part of it not secure, a turn into one not yet worked, tiring late, an ability holding it back, what you want not clear yet, a partner not there yet. Name one, try a way at it, and see its figure before and after. Work done is kept; a change of how a part is played waits for you to keep it or put it back. Every later forecast, rehearsal and performance of the piece reads what you keep.',
    steps: [
      'Find Work It Through under the piece: under a scene on Coursework, under a practice brief on the Player Profile, under a part on Casting.',
      'Read what the forecast shows, worst first, each with why. Press one to name it as the problem you’re working on.',
      'Under Working On, each way at it gives its minutes and what it does. Press one: its time passes, and the toast gives the figure before and after.',
      'A change of how a part is played waits: press Keep It, or Put It Back to have it as it was.',
      'Read the tries, newest first, and What You’ve Found, the discoveries every later forecast and performance reads.',
    ],
    needs: [
      'A piece in progress: a scene for class with its material, still open; a practice brief with a reading chosen; a part whose run is still to come.',
      `Some of the lines learned first: ${pct(BRIEF.rehearseNeeds)} of a brief’s, a scene’s or a part’s.`,
      'A problem named before a way is tried, and any change tried kept or put back before the next.',
      `For a way on your feet, energy of ${SPENT} or more and no injury that stops training. For any, awake, out of hospital, at nothing else, and free for its minutes.`,
    ],
    costs: [
      { label: 'Time', value: Object.values(ADJUSTMENTS).map((a) => `${a.label}, ${a.minutes} minutes`).join('; '), estimate: true },
      { label: 'Money', value: 'None' },
      { label: 'Naming And Settling', value: 'No time: naming a problem, keeping a change and putting one back move no clock' },
    ],
    reads: [
      { label: 'The Forecast', value: 'The piece’s expected result now, with no draw: the same way tried on the same work and the same day shows the same figure' },
      { label: 'A Problem', value: `A part of the piece short of the rehearsal it asks, or ${points(WORKBOOK.segmentGap)} under the whole; stamina, an ability or a part of the preparation costing half a point of the whole or more; a partner leaving the work together three points or more under your own. At most ${WORKBOOK.offered}, worst first` },
      { label: 'The Evidence', value: 'The problem’s own figure before and after: its part’s result, the whole, or the work together' },
      { label: ADJUSTMENTS['work-beat'].label, value: `That part’s own rehearsal, ${pct(WORKBOOK.workGain)} of what’s left at an ordinary focus`, estimate: true },
      { label: ADJUSTMENTS['run-into'].label, value: `This part ${pct(WORKBOOK.intoAfter)} and the one before it ${pct(WORKBOOK.intoBefore)}, of what’s left; practice in adaptability`, estimate: true },
      { label: ADJUSTMENTS['beat-way'].label, value: `One part paced, sized or fixed its own way, on an axis the whole leaves open and the material takes; rehearsed in to ${pct(WORKBOOK.wayGain)} by trying it, and further by working it slowly`, estimate: true },
      { label: ADJUSTMENTS.breathe.label, value: `The piece’s load on your stamina, down to ${pct(WORKBOOK.breathe)} of itself`, estimate: true },
      { label: ADJUSTMENTS.objective.label, value: `The breakdown a reading stands on, ${pct(WORKBOOK.objectiveGain)} of what’s left: a brief’s, or a scene’s own step at the table where the course has one (${SCAN.label}, ${SPEAK.label}), whose name the problem gives. On ${SCENE_STUDY.title} and the scenes whose table work is your answers alone it isn’t offered: a table work short shows as “${TABLE_SHORT}”, which your answers at the table answer`, estimate: true },
      { label: ADJUSTMENTS['with-partner'].label, value: `A classmate reading a brief with you: their preparation, ${pct(WORKBOOK.partnerGain)} of what’s left. Not offered on a scene for class, where their side moves with the rehearsals you agree with them, and the problem says to ask them to rehearse it with you`, estimate: true },
    ],
    now: [
      'Naming a problem keeps it as the one being worked on.',
      'A way tried spends its minutes and changes the work, and the try is kept with its figure before and after.',
      'Work done (working a part slowly, running into it, naming what you want, running it with a reader) is kept at once, and a problem it solves leaves the list by itself.',
      'Playing a part another way, or finding places to breathe, waits on Keep It or Put It Back. Kept, it’s a discovery. Put back, the piece is as it was, and that way isn’t offered for the problem again.',
      'Working on an ability’s problem trains it a little, and running into a part trains your adaptability.',
    ],
    later: [
      'Every later forecast and performance of the piece reads what was kept: the take of a brief, the showing of a scene, a night of a part.',
      `What You’ve Found lists each part played its own way and how far it’s rehearsed in, places to breathe found, and each try kept that moved its figure ${points(WORKBOOK.evidence)} or more.`,
    ],
    interpret: [
      'Before and after are the problem’s own figure: a part’s result for a problem in one part, the last part’s for tiring late, the whole for an ability or a part of the preparation, the work together for a partner.',
      'A try that barely moves its figure is evidence too: the problem may want another way, or its own step of preparation.',
      '“No way at it is left here” means its own step of preparation answers it, or the ways tried were put back. A partner not there yet on a scene for class has none here either: its line ends “Ask … to rehearse it with you.”',
      'The tries table keeps the last six, newest first, each Kept, Put back or Waiting.',
    ],
    unavailable: [
      '“Name the problem you’re working on first.”',
      '“Keep or put back the change you tried first.”',
      '“That isn’t a problem the work shows now.”',
      '“You tried that for this and put it back.” and “That doesn’t answer the problem you’re working on.”',
      '“Choose a reading first: the work is on the scene played one way.”: a brief.',
      '“Learn some of the lines first: there’s nothing to rehearse without them.”, and for a part, “Learn some of the part first: there’s nothing to rehearse without it.”',
      '“You’re too tired to work on your feet. Sleep first.”, “Not from a hospital bed.” and “You’re asleep.”',
      '“There’s no change waiting to be kept or put back.”',
      LOCKED,
    ],
    mistakes: [
      'Trying a way again in hope of luck: there’s none here. The forecast has no draw, so a try shows only what it changed; where it barely moved, try another way, or the step of preparation the problem names.',
      `On ${SCENE_STUDY.title} and the scenes read like it, the table work is your answers: when it’s the problem, “${TABLE_SHORT}” has no way at it here, so answer the table work with readings the text supports.`,
      'On a scene for class, your partner’s side moves with the rehearsals you agree with them: book one from the piece.',
      'Keeping a change that made the figure worse: every later performance reads it. Put It Back is there for that.',
    ],
    related: ['coursework.prepare', 'coursework.playing', 'coursework.partners', 'craft.brief-prepare', 'craft.brief-reader', 'productions.notes', 'productions.part', 'craft.work'],
    connections: [
      { to: 'coursework.prepare', kind: 'prerequisite', why: 'A scene’s lines learned to 30% let you try a way at it, and a problem in a part of the preparation is answered by that part’s own step.' },
      { to: 'coursework.feedback', kind: 'evaluation', why: 'The showing reads the scene with each part’s own work and every discovery kept.' },
      { to: 'craft.brief-prepare', kind: 'evaluation', why: 'A brief’s take reads its beats’ own work and the ways kept, as its forecast did.' },
      { to: 'craft.brief-reader', kind: 'immediate', why: `${ADJUSTMENTS['with-partner'].label} moves the preparation of a classmate reading a brief with you.` },
      { to: 'productions.notes', kind: 'optional', why: 'A part’s director’s notes are worked on through Work On The Note, by the same ways; Work It Through takes what the notes leave.' },
      { to: 'coursework.playing', kind: 'optional', why: 'Play This Part Another Way works on an axis the whole leaves open: leave one open to play a part its own way.' },
      { to: 'craft.profile', kind: 'immediate', why: 'Working on an ability’s problem trains it a little, and running into a part trains adaptability.' },
    ],
    example: {
      setup: `${SCENE_STUDY.title} on ${SEAGULL.play}, ${SEAGULL.where}: ${word(SEAGULL_SPEC.segments.length)} parts in its tones, ${partOf(SCENE_STUDY, 'rehearsal')} at ${pct(REHEARSED)} and the lines learned, at readiness 80 and an even nature.`,
      steps: [`Work It Through shows “The Turn Into ${TURN.label}”: ${pct(REHEARSED)} of the ${pct(TURN_ASKS)} it asks. Name it.`, `${WORK_BEAT.label}, ${times(WORKED.length)}.`],
      result: `${TURN.label}’s own rehearsal reads ${WORKED.map(pct).join(', then ')}: past the ${pct(TURN_ASKS)} it asks after the ${ordinal(WORKED.length)}, ${span(WORKED.length * WORK_BEAT.minutes)} in all, and the problem leaves the list by itself. Each try is kept with the part’s result before and after, and the showing reads ${TURN.label.toLowerCase()} at ${pct(WORKED[WORKED.length - 1] ?? REHEARSED)}, the rest of the scene still at ${pct(REHEARSED)}.`,
    },
  },
];
