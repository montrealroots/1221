/**
 * SLATE — a practice brief prepared, chosen, taped and remembered (from 2026-10-12; `content/briefs/`).
 *
 * Until then a self-tape in a genre (`practice.self_tape`) had no material: the camera's task, the genre's applied
 * demands, and how well the genre was known. Now every self-tape is of a brief, a scene written for SLATE, and goes
 * through the same evaluation every piece of work does (`systems/evaluation.ts`), with the brief as its material
 * (`systems/material.ts`):
 *
 * - **Preparation** (`brief.prepare`): Break It Down (the reading's ground, `interpretation`), Learn The Lines
 *   (`memorization`) and Rehearse It On Your Feet (`rehearsal`, which also rehearses the way it's to be played in).
 *   Each step moves its part by a share of what's left, half as far again the same day. A beat a change of tone leads
 *   into, and a beat held two ways, asks more rehearsal than one that does neither (`briefPiece`, `systems/piece.ts`):
 *   a scene that goes from a joke to grief is a harder thing to have ready at the grief. Until 2026-10-12 the whole
 *   brief's complete rose with each turn in it, so the turn was asked of every beat and worked in none.
 * - **The take is judged in its beats** (from 2026-10-12, `systems/piece.ts`): each beat with its tones, its own
 *   rehearsal, how far into the take it falls (where stamina is read), and a slip in the beat before it.
 * - **The choice** (`brief.choose`): a reading the brief supports, and how to play it (`content/approaches.ts`). Every
 *   reading is valid: it leans the work's dimensions and draws on different abilities, normalized, so it moves weight
 *   and adds none. A change of reading keeps half the breakdown; a change of how it's played keeps half its rehearsal.
 *   Only the material's own `allows` and a callback's direction, said before the take, can hold a choice back.
 * - **The take** (`practice.self_tape`): judged as a taped brief (`TASK_PROFILES.tape`, or `tapeOnFeet` where the scene is
 *   built on physical work, so an injury reaches it), kept on the work record and the
 *   brief's own record with its reading, its playing, its preparation, its result and what held it back most, and its
 *   purpose (`purposeOf`): a first take, another reading, another way of playing it, a take answering a callback's
 *   direction, an improved one, or the same again, said plainly and not refused.
 * - **A callback**: a take at Strong or better earns a callback, a harder pitch with a director's note on one side of
 *   one axis, given before the next take of it. It's the scene's harder form, and the answer to repetition: the same
 *   brief again is worth doing for another reading, the note, or better work, and the record says which it was.
 *
 * What isn't counted twice: a brief's several genres share one session of practice (`practiceGenres`); knowing the
 * genre, studied or worked in, is a part of preparation the take reads, so it doesn't also speed the preparation (the
 * material's features met before do, `prepSpeed`; until 2026-10-12 this said the genre's practice did too, the better of
 * the two, which `prepSpeed` never read); a genre’s applied demands are techniques the brief stages or its medium
 * reads, once each (`tests/briefs-content.test.ts`), where until 2026-10-13 they were added again at a take
 * (`withDemands`), which found each already there and added nothing; the same take again the same day keeps half its
 * practice; an action id is lived once.
 *
 * Every number here is SLATE's: the research supports the shape (circumstances, objective, obstacle, beats;
 * research-self-tape-briefs.json), not a size.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import type { Instant } from '../core/time';
import { formatTime, zonedParts } from '../core/time';
import type { AbilityId } from '../content/abilities';
import { MASTERED } from '../content/abilities';
import { APPROACH_EFFECT, AXES, PLAYING } from '../content/approaches';
import { BRIEFS, BRIEF_BY_ID, briefsOf, type Brief, type Reading } from '../content/briefs';
import { ENGAGEMENT } from '../content/engagement';
import { GENRE_DEFS } from '../content/genres';
import { GENRE_REGISTER } from '../content/genre-register';
import { CONCERNS, CONCERN_STRENGTH, type Concern } from '../content/concerns';
import { concernBehind } from './register';
import type { Scene } from './interpretation';
import { grainRead } from './interpretation-read';
import { GENRE_BY_ID } from '../content/film-genres';
import type { Axis, AxisValue, MaterialProfile } from '../content/material';
import type { Skill } from '../content/school';
import { DIMENSION_LABEL, TASK_PROFILES, type Dimension } from '../content/tasks';
import { alreadyApplied, isAbility, markApplied, repeatsToday } from './attributes';
import { exerts } from './body';
import { WORK, afterTogether, prepLean, reliabilityOf, trustOf } from './coursework';
import { sharedOf, sharedWords, type PartnerRead, type SharedResult } from './ensemble';
import { abilityFull, abilityOf, stepSpeed } from './attributes';
import { bandOfQuality, chiefLimit, countDirection, countTogether, performerOf, recordWork, type Evaluation } from './evaluation';
import { SELF_TAPE, genreState, practiceGenres } from './engagement';
import { FEATURE_LABEL, featureSpeed, featuresOf, noteMaterial } from './experience';
import type { Identity } from './artistry';
import { inHospital } from './health';
import { trainingRefusal } from './injury';
import { SPENT, commitmentWithin, occupiedAt } from './life';
import { choose, materialContext, misfitOf, rehearseChoice, sidesOf, type Playing } from './material';
import { PIECE, TONE_LEAN } from '../content/piece';
import { beatSegments, evaluatePiece, judgePiece, loadOf, pieceWeights, rehearseWays, withBook, type PieceSpec, type Workbook } from './piece';
import { classmatePerformer, conditionAt, focusAt, ordinary } from './school';

export type BriefStep = 'read' | 'lines' | 'rehearse';
export type BriefPart = 'interpretation' | 'memorization' | 'rehearsal';
export type Purpose = 'first' | 'callback' | 'another-reading' | 'another-way' | 'improved' | 'again';

/** The numbers, all SLATE's estimates. */
export const BRIEF = {
  steps: {
    read: { label: 'Break It Down', what: 'The circumstances, the relationship, what you want and what’s in the way, and where it turns: the ground your reading stands on.', minutes: 30, part: 'interpretation', gain: 0.6, feet: false, trains: 'imagination' },
    lines: { label: 'Learn The Lines', what: 'The lines, until they’re yours.', minutes: 30, minutesMedium: 50, minutesLong: 70, part: 'memorization', gain: 0.6, feet: false, trains: 'memory' },
    rehearse: { label: 'Rehearse It On Your Feet', what: 'Played through aloud with the beats placed, and the way you chose to play it worked in.', minutes: 45, part: 'rehearsal', gain: 0.5, feet: true, trains: undefined },
  } as const,
  /** Rehearsal needs some of the lines first. */
  rehearseNeeds: 0.3,
  /**
   * What each part counts complete at; rehearsal's in a beat rises where a turn leads into it (`PIECE.brief`), up to
   * `mostRehearsal`. Lightened on 2026-10-12, with the
   * steps' gains (0.6, 0.6, 0.5 from 0.5, 0.5, 0.4): a played month of term (tools/brief-journeys.ts) found a first brief
   * in a new genre took about fourteen hours to have ready, more than a term's free hours give practice material. It's
   * about four now, and more where the scene turns more.
   *
   * Knowing the genre was complete at 0.3 until 2026-10-16, and its part's floor `prepFloor` (0.35): a cliff, with a
   * genre unknown costing a mastered actor 23 points and every point past 30 costing nothing. From then it's complete
   * at 0.9, as a technique is mastered at 90 (`MASTERED`), and its floor is three quarters (`EVALUATION.partFloor`):
   * the whole range to 90 reads, each point by the same share, and the gate is a third the size.
   */
  complete: { interpretation: 0.8, memorization: 0.8, rehearsal: 0.5, mostRehearsal: 0.85, genre: 0.9 },
  /**
   * What a take credits its genres as practice with none of it prepared, of what a fully prepared take credits (from
   * 2026-10-16). A genre's conventions are learned in the work on the scene, the breakdown of its circumstances and the
   * rehearsal of its rhythm, more than by rolling the camera on it cold. Until then a take credited the same however
   * little was prepared, and taping unprepared every hour credited 2.23 points of genre practice an hour against
   * preparing's 1.67 (`tools/brief-strategies.ts`, baseline §10): the cold take, repeated, was the faster way to know a
   * genre. Between none and complete, it rises in step with the take's preparation (`practiceShare`). SLATE's size.
   */
  practiceUnprepared: 0.15,
  /** A change of reading keeps this much of the breakdown. */
  readingKept: 0.5,
  /**
   * A taped brief's difficulty: practice material at home, pitched at a student as a class's scene is (a par of 54 on
   * coursework's scale, `difficultyOf`), where until 2026-10-12 a material-less self-tape was pitched at 0.125, over a
   * professional's; a first-year's fully prepared take of a brief came out at 30, Unready, with nothing left to do but
   * wait for abilities. A callback is pitched as an audition's next round, near a professional's (0.1).
   */
  difficulty: -0.2, callback: 0.3,
  /** What each step of stakes over 1 adds to a take's difficulty, and each under it takes off (from 2026-10-12). SLATE's. */
  stakes: 0.05,
  /** What a technique the scene stages weighs against the medium's own, a level of it (`tapeReadsOf`). */
  staged: 2,
  /** The techniques a medium reads of its own: the camera's, or the microphone's. */
  base: { camera: { screen: 2, scene: 1 }, voice: { voiceover: 2, scene: 1 } } as Record<Brief['medium'], Partial<Record<Skill, number>>>,
  /** A step's training weight on the ability it's practice in, as coursework's (`WORK.trainingWeight`). */
  trainingWeight: 0.25,
  /** Effort, as METs. */
  met: { desk: 1.5, feet: 2.5 },
  /** Takes kept per brief. */
  takesKept: 8,
  /**
   * The reader (from 2026-10-12): a recording of the other lines answers on cue and never slips, but can't listen, so
   * its timing is the floor's; and how much of a rehearsal on your feet a classmate reading with you takes in.
   */
  reader: { recording: 0.6, rehearse: 0.5 },
  /** A better take than the last by this many points, its expected result with no draw, is an improved one. */
  improvedBy: 1,
  /** What a take that's the same again is worth as practice, on any day. */
  againWorth: 0.5,
  /**
   * How strongly a reading counts: its leans raised to this power, its abilities' weights times this. Written at 1 and
   * measured across the catalog, a specialist's best and worst readings of a brief were under a point apart on most
   * briefs, a choice with no consequence; at 2 they're a point or more apart on most of them, up to about three
   * (docs/verification/BRIEF-BALANCE.md). Leans are normalized, so it still moves weight and adds none.
   */
  readingLean: 2, readingDraw: 2,
  /**
   * How much more the beat a reading puts its heart in weighs in the take (from 2026-10-12, `heartOf`): the beat whose
   * tones lean most the way the reading leans. Measured across the catalog on 2026-10-12, a reading moved a real
   * student's take by under a tenth of a point (docs/verification/BRIEF-BALANCE.md section 2): a reading only moved
   * weight between dimensions, and an actor whose abilities are even comes out the same whichever way it's moved. A
   * reading is also where the scene is played to, and the beat that holds it is the one the take is about.
   */
  readingHeart: 1.6,
} as const;

/**
 * How the reader plays the other part, and what playing against it asks (from 2026-10-12, `Brief.readerPlays`): a
 * pressing reader asks you to answer it (responsiveness, adaptability); a withholding one gives little, so the connection
 * is yours to make (connection, listening); an unpredictable one asks both, and holding steady through it. Leans are
 * normalized, as every lean is: what playing against it asks moves weight, it adds none. SLATE's design.
 */
export const READER_PLAYS: Readonly<Record<NonNullable<Brief['readerPlays']>, { label: string; lean: Partial<Record<Dimension, number>>; inputs: Partial<Record<Dimension, readonly { ability: AbilityId; weight: number }[]>> }>> = {
  steady: { label: 'Steady', lean: {}, inputs: {} },
  pressing: { label: 'Pressing', lean: { responsiveness: 1.15 }, inputs: { responsiveness: [{ ability: 'adaptability', weight: 0.5 }] } },
  withholding: { label: 'Withholding', lean: { connection: 1.15 }, inputs: { connection: [{ ability: 'listening', weight: 0.5 }] } },
  unpredictable: { label: 'Unpredictable', lean: { responsiveness: 1.1, consistency: 1.05 }, inputs: { responsiveness: [{ ability: 'adaptability', weight: 0.5 }], consistency: [{ ability: 'composure', weight: 0.3 }] } },
};

export interface Take {
  at: Instant;
  genre: string;
  reading: string;
  sides: AxisValue[];
  prep: Record<string, number>;
  overall: number;
  /** What the take would come to with no draw: what the next one is measured against. */
  expected: number;
  band: string;
  chief?: string;
  /**
   * The genre's concern behind `chief` (from 2026-10-16, `concernBehind`): where its register asked for the ability that
   * held the take back most. Absent on a take from before, or where the limit was anything else.
   */
  concern?: Concern;
  /**
   * What the way it was played came to against the scene (from 2026-10-16, `grainRead`): the points it gave the take (or,
   * negative, cost it), what the actor's abilities and techniques cost it, and the sides' suitability. Absent on a take
   * from before, or one played with nothing chosen.
   */
  grain?: { points: number; ability: number; why: string };
  purpose: Purpose;
  /** The callback's direction it answered, where it was one. */
  callback?: { axis: Axis; side: AxisValue };
  /** Whether a callback take was played the way its note asked (from 2026-10-12): only one that was clears the callback. */
  answered?: boolean;
  /**
   * The take with its reader (from 2026-10-12, `systems/ensemble.ts`): what it came to, what the reader brought, a slip
   * and how much of it you covered. What a casting office would see, and what earns a callback; your own result is the
   * take's `overall`.
   */
  together?: { overall: number; contribution: number; reader: string; slip?: SharedResult['slip']; words: string };
  key: string;
}

export interface BriefRecord {
  prep: Record<BriefPart, number>;
  /**
   * Focused work on each beat, 0 to 1 (from 2026-10-12, `systems/workbook.ts`): a beat reads its own rehearsal, the
   * brief's and this together (`systems/piece.ts`). Absent, no beat has had work of its own.
   */
  work?: number[];
  /** The problem being worked on, the tries and the discoveries kept (from 2026-10-12, `systems/workbook.ts`). */
  book?: Workbook;
  /**
   * Who reads opposite you (from 2026-10-12): a classmate by their place in the class, and how far they've prepared
   * it with you. Absent, you read against a recording of the other lines.
   */
  reader?: { mate: number; prep: number };
  reading?: string;
  playing?: Playing;
  takes: Take[];
  /** A callback earned and not yet taped: its direction, said before the take. */
  callback?: { axis: Axis; side: AxisValue; why: string; at: Instant };
}

export const briefRecords = (person: Person): Record<string, BriefRecord> => (person.briefs ??= {});
export const recordOf = (person: Person, id: string): BriefRecord => (briefRecords(person)[id] ??= { prep: { interpretation: 0, memorization: 0, rehearsal: 0 }, takes: [] });
const peek = (person: Person, id: string): BriefRecord => person.briefs?.[id] ?? { prep: { interpretation: 0, memorization: 0, rehearsal: 0 }, takes: [] };

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const r3 = (x: number) => Math.round(x * 1000) / 1000;

const MATERIAL = new Map<string, MaterialProfile>();
/** A brief as material (`content/material.ts`): its features, its language, its medium, its beats. */
export function briefMaterial(b: Brief): MaterialProfile {
  let m = MATERIAL.get(b.id);
  if (m) return m;
  m = {
    id: b.id, title: b.title, medium: b.medium, language: b.language, timing: b.timing, physical: b.physical, partner: b.partner, vocal: b.vocal, improvisation: b.improvisation,
    tones: [...new Set(b.beats.flatMap((x) => x.tones))], turns: 0, beats: b.beats.map((x) => ({ tones: x.tones })), size: b.size, stakes: b.stakes ?? 1,
    ...(b.techniques ? { techniques: b.techniques } : {}), ...(b.allows ? { allows: b.allows } : {}),
    why: { ...(b.why.timing ? { timing: b.why.timing } : {}), ...(b.why.physical ? { physical: b.why.physical } : {}), ...(b.why.partner ? { partner: b.why.partner } : {}), ...(b.why.vocal ? { vocal: b.why.vocal } : {}), ...(b.why.improvisation ? { improvisation: b.why.improvisation } : {}), ...(b.why.language ? { language: b.why.language } : {}), ...(b.why.techniques ? { techniques: b.why.techniques } : {}), ...(b.why.allows ? { allows: b.why.allows } : {}), turns: b.why.beats ?? '' },
  };
  MATERIAL.set(b.id, m);
  return m;
}

/**
 * The techniques a take reads: the medium's own and the brief's, once each. What the scene itself stages (a song sung,
 * a fight) weighs `BRIEF.staged` times its level against the medium's base (from 2026-10-12): until then a musical's
 * singing was 1.6% of its take and a fight's combat 3.7%, under the camera's own technique on the same brief, read by
 * every take (tools/specialists.ts). Its genres’ applied demands are among them: every brief stages them, or its medium
 * reads them (`tests/briefs-content.test.ts`). Until 2026-10-13 they were added here too (`withDemands`), only where
 * the take didn’t read them already, so they added nothing to any brief’s take (tests/evidence-g23-school.test.ts).
 */
export function tapeReadsOf(b: Brief): Partial<Record<Skill, number>> {
  const out: Partial<Record<Skill, number>> = { ...BRIEF.base[b.medium] };
  for (const [k, w] of Object.entries(b.techniques ?? {}) as [Skill, number][]) out[k] = Math.max(out[k] ?? 0, w * BRIEF.staged);
  return out;
}

/**
 * The concerns a brief is played in: its genre's register, the genre it was written for (`kinds[0]`), from 2026-10-16.
 * A brief listed under further genres is still that genre's scene; its other listings carry their techniques
 * (`content/demands.ts`), not their register.
 */
export const registerOf = (b: Brief): readonly Concern[] => GENRE_REGISTER[b.kinds[0]!]?.concerns ?? [];

/** The changes between beats and the beats held two ways, as the material counts them. */
export function turnsOf(b: Brief): { transitions: number; blends: number } {
  const key = (x: { tones: readonly string[] }) => [...x.tones].sort().join('+');
  return { transitions: b.beats.slice(1).filter((x, i) => key(x) !== key(b.beats[i]!)).length, blends: b.beats.filter((x) => new Set(x.tones).size > 1).length };
}

/**
 * What each part of a brief's preparation counts complete at. Rehearsal's is the piece's own: from 2026-10-12 each beat
 * a turn leads into, or held two ways at once, asks more of it in that beat (`PIECE.brief`, `beatRequired`), where
 * until then the whole brief's complete rose with every turn in it, so the beat with no turn asked as much as the one
 * with three.
 */
export function requiredOf(_b: Brief): Record<string, number> {
  const c = BRIEF.complete;
  return { interpretation: c.interpretation, memorization: c.memorization, rehearsal: c.rehearsal, genre: c.genre };
}

/**
 * The beat a reading puts its heart in, or none: the beat whose tones lean most toward the dimension the reading leans
 * most (`TONE_LEAN`). None where the reading's lean is even, or where no beat leans its way more than the rest.
 */
export function heartOf(b: Brief, reading: string | undefined): number | undefined {
  const r = readingOf(b, reading);
  if (!r) return undefined;
  const [d, x] = (Object.entries(r.lean) as [Dimension, number][]).sort((p, q) => q[1] - p[1])[0] ?? [];
  if (!d || !x || x <= 1) return undefined;
  const affinity = b.beats.map((beat) => beat.tones.reduce((a, t) => a * (TONE_LEAN[t]?.[d] ?? 1) ** (1 / beat.tones.length), 1));
  const most = Math.max(...affinity);
  if (most <= 1 || affinity.filter((a) => a === most).length !== 1) return undefined;
  return affinity.indexOf(most);
}

/** A brief as a piece in its beats (`systems/piece.ts`): each beat's rehearsal, what a turn and a blend ask, its load, and the reading's heart. */
export function briefPiece(b: Brief, rec: Pick<BriefRecord, 'work' | 'book'> & { reading?: string }, reading = rec.reading): PieceSpec {
  const heart = heartOf(b, reading);
  return withBook({
    segments: beatSegments(b.beats).map((s, i) => (i === heart ? { ...s, weight: BRIEF.readingHeart } : s)), work: rec.work ?? [], part: 'rehearsal',
    perTurn: PIECE.brief.perTurn, perBlend: PIECE.brief.perBlend, most: BRIEF.complete.mostRehearsal,
    load: Math.min(1, loadOf(b, 'brief', b.size !== 'short') + (b.size === 'long' ? PIECE.load.briefLong - PIECE.load.briefMedium : 0)),
  }, rec.book);
}

/**
 * How well the brief's genres are known, 0 to 1: the best of its genres, each the better of its familiarity (studied)
 * and its practice (worked in), never their sum. A part of the take's preparation, complete at `BRIEF.complete.genre`.
 * Until a played run of 2026-10-12 it was familiarity alone, complete at 60 as a material-less self-tape's was: a student
 * spent 21 hours of a month studying one genre and taped nothing, since a session gives eight points and half again the
 * same day. Complete at 30 from then, with work in the genre counting, it was four or so sessions for a genre never met,
 * and taping in it built it. From 2026-10-16 it's complete at 90 and read over the whole of the way there, from a floor
 * of three quarters (`EVALUATION.partFloor`): about 28 sessions, or as many takes, and each one shows in the take.
 */
export const genreKnown = (person: Person, b: Brief): number => Math.max(0, ...b.kinds.map((g) => Math.max(person.engagement?.byGenre[g]?.familiarity ?? 0, person.engagement?.byGenre[g]?.practice ?? 0) / 100));

/**
 * How much faster a step goes: the material's features met before (`featureSpeed`). Knowing the genre, studied or
 * worked in, is the take's own part of preparation (`genreKnown`), so it doesn't speed the preparation too.
 */
export const prepSpeed = (person: Person, b: Brief): number => featureSpeed(person, briefMaterial(b));

export const readingOf = (b: Brief, id: string | undefined): Reading | undefined => b.readings.find((r) => r.id === id);

/** A callback's direction as a material reads it. */
const directionOf = (rec: BriefRecord): Partial<Record<Axis, AxisValue>> | undefined => (rec.callback ? { [rec.callback.axis]: rec.callback.side } : undefined);

/**
 * What a take of a brief asks, but the day: its task, techniques, preparation, difficulty, and the material's, the
 * reading's and the playing's reads. `over` replaces the record's own reading, playing or preparation, for a preview.
 */
/** The task a brief is judged as: on its feet where its scene is built on physical work, so an injury reaches it. */
export const taskOf = (b: Brief) => (b.physical >= 2 ? TASK_PROFILES.tapeOnFeet! : TASK_PROFILES.tape!);

/** A brief as a scene a way of playing is read against (from 2026-10-16): its genre's register, its reader, the reading taken. */
export function sceneOf(b: Brief, reading?: Reading): Scene {
  return { genre: b.kinds[0]!, concerns: registerOf(b), ...(b.medium === 'voice' ? {} : { readerPlays: b.readerPlays ?? 'steady' }), ...(reading ? { reading: { label: reading.label, lean: reading.lean } } : {}) };
}

export function briefContext(person: Person, b: Brief, rec: BriefRecord, over: { reading?: string; playing?: Playing; prep?: Partial<Record<string, number>>; callback?: boolean } = {}) {
  const task = taskOf(b);
  const material = briefMaterial(b);
  const playing = over.playing ?? rec.playing;
  const callback = over.callback ?? Boolean(rec.callback);
  const readingNow = readingOf(b, over.reading ?? rec.reading);
  // The scene a way of playing is read against (from 2026-10-16, `systems/interpretation.ts`): its genre's register,
  // its reader and the reading taken, beside its material.
  const read = materialContext(task, material, playing, callback ? directionOf(rec) : undefined, sceneOf(b, readingNow));
  const lean = { ...read.lean };
  const inputs: Partial<Record<Dimension, { ability: AbilityId; weight: number }[]>> = Object.fromEntries(Object.entries(read.inputs).map(([d, xs]) => [d, (xs ?? []).map((x) => ({ ...x }))]));
  const reading = readingNow;
  if (reading) {
    for (const [d, x] of Object.entries(reading.lean) as [Dimension, number][]) if (lean[d] !== undefined) lean[d] = lean[d]! * x ** BRIEF.readingLean;
    for (const dr of reading.draws) {
      if (!task.dims[dr.dim]) continue;
      const list = (inputs[dr.dim] ??= []);
      const had = list.find((y) => y.ability === dr.ability);
      if (had) had.weight += dr.weight * BRIEF.readingDraw; else list.push({ ability: dr.ability, weight: dr.weight * BRIEF.readingDraw });
    }
  }
  // How the reader plays the other part (from 2026-10-12): what playing against it asks, leaned and drawn on.
  const plays = b.medium === 'voice' ? undefined : READER_PLAYS[b.readerPlays ?? 'steady'];
  if (plays) {
    for (const [d, x] of Object.entries(plays.lean) as [Dimension, number][]) if (lean[d] !== undefined) lean[d] = lean[d]! * x;
    for (const [d, xs] of Object.entries(plays.inputs) as [Dimension, { ability: AbilityId; weight: number }[]][]) {
      if (!task.dims[d]) continue;
      const list = (inputs[d] ??= []);
      for (const x of xs) { const had = list.find((y) => y.ability === x.ability); if (had) had.weight += x.weight; else list.push({ ...x }); }
    }
  }
  // The register of the genre it was written for (from 2026-10-16, `GENRE_REGISTER`): each concern leaned and drawn
  // on as a reader's way of playing is, so the genre moves weight between the dimensions and adds none.
  for (const c of registerOf(b)) {
    const def = CONCERNS[c];
    for (const [d, x] of Object.entries(def.lean) as [Dimension, number][]) if (lean[d] !== undefined) lean[d] = lean[d]! * x ** CONCERN_STRENGTH.lean;
    for (const [d, xs] of Object.entries(def.inputs) as [Dimension, readonly { ability: AbilityId; weight: number }[]][]) {
      if (!task.dims[d]) continue;
      const list = (inputs[d] ??= []);
      for (const x of xs) { const w = x.weight * CONCERN_STRENGTH.draw; const had = list.find((y) => y.ability === x.ability); if (had) had.weight += w; else list.push({ ability: x.ability, weight: w }); }
    }
  }
  const prep: Record<string, number> = { ...rec.prep, genre: genreKnown(person, b), ...(over.prep ?? {}) } as Record<string, number>;
  const required = requiredOf(b);
  if (sidesOf(playing).length) { prep.approach = over.prep?.approach ?? playing!.prep; required.approach = read.required; }
  return { task, techniques: tapeReadsOf(b), prep, required, difficulty: BRIEF.difficulty + (callback ? BRIEF.callback : 0) + ((b.stakes ?? 1) - 1) * BRIEF.stakes, lean, inputs, extraPrep: read.prep, fit: read.fit, grain: read.grain };
}

/** What a take would come to now, with today's preparation and condition and no draw: what the player sees before taping. */
export function forecast(sim: Simulation, person: Person, b: Brief, over: Parameters<typeof briefContext>[3] & { work?: number[] } = {}): Evaluation {
  const rec = peek(person, b.id);
  return judgePiece(sim.universe.meta.seed, performerOf(sim, person), { ...briefContext(person, b, rec, over), condition: conditionAt(sim, person, sim.now), key: `forecast:${b.id}`, expected: true }, briefPiece(b, { work: over.work ?? rec.work, ...(rec.book ? { book: rec.book } : {}) }, over.reading ?? rec.reading));
}

/** What a reading and a way of playing it would come to fully prepared, on a sufficient day, with no draw. */
export function preview(sim: Simulation, person: Person, b: Brief, reading: string, sides: Omit<Playing, 'chosenAt' | 'prep'>): Evaluation {
  const full = { interpretation: 1, memorization: 1, rehearsal: 1, genre: 1, approach: 1 };
  const rec = peek(person, b.id);
  return judgePiece(sim.universe.meta.seed, performerOf(sim, person), { ...briefContext(person, b, rec, { reading, playing: { ...sides, chosenAt: sim.now, prep: 1 }, prep: full }), condition: { readiness: 100 }, key: `preview:${b.id}`, expected: true }, briefPiece(b, rec, reading));
}

/** What the next take of a brief would be for, by what's changed since the last. */
export function purposeOf(rec: BriefRecord, expectedNow: number): Purpose {
  const last = rec.takes.at(-1);
  if (!last) return 'first';
  if (rec.callback) return 'callback';
  if (rec.reading && rec.reading !== last.reading) return 'another-reading';
  const sides = sidesOf(rec.playing);
  if (sides.join() !== last.sides.join()) return 'another-way';
  if (expectedNow >= last.expected + BRIEF.improvedBy) return 'improved';
  return 'again';
}

export const PURPOSE_WORDS: Readonly<Record<Purpose, string>> = {
  first: 'A first take of it.',
  callback: 'A callback: a harder pitch, with the director’s note to answer.',
  'another-reading': 'Another reading of it than last time’s.',
  'another-way': 'The same reading played another way.',
  improved: 'Better prepared or better able than last time: it should show.',
  again: 'The same reading, played the same way, no better prepared: it counts, and it’s worth half as practice.',
};

// ---------------------------------------------------------------------------
// Refusals and actions
// ---------------------------------------------------------------------------

/** What's common to an hour away from the work: awake, out of hospital, and nothing on the calendar inside it. */
function hourRefusal(sim: Simulation, person: Person, minutes: number): string | undefined {
  if (inHospital(person, sim.now)) return 'Not from a hospital bed.';
  if (person.awakeSince !== undefined && person.awakeSince > sim.now) return 'You’re asleep.';
  const busy = occupiedAt(sim, sim.now);
  if (busy) return `You’re at ${busy.label} until ${formatTime(busy.at + busy.durationMinutes! * 60_000, sim.zone)}.`;
  return commitmentWithin(sim, minutes);
}

export const stepMinutes = (b: Brief, step: BriefStep): number => (step === 'lines' && b.size === 'medium' ? BRIEF.steps.lines.minutesMedium : step === 'lines' && b.size === 'long' ? BRIEF.steps.lines.minutesLong : BRIEF.steps[step].minutes);

export function prepareRefusal(sim: Simulation, person: Person, b: Brief | undefined, step: string): string | undefined {
  if (!b) return 'There’s no such brief.';
  const s = BRIEF.steps[step as BriefStep];
  if (!s) return 'That isn’t a step of a brief.';
  const rec = peek(person, b.id);
  // Rehearsal complete still rehearses in a way of playing chosen after it: a callback's note answered, a change of mind.
  const choiceToRehearse = step === 'rehearse' && sidesOf(rec.playing).length > 0 && rec.playing!.prep < PLAYING.complete;
  if (rec.prep[s.part] >= 0.97 && !choiceToRehearse) return 'There’s nothing more to gain from it now.';
  if (step === 'rehearse' && rec.prep.memorization < BRIEF.rehearseNeeds) return 'Learn some of the lines first: there’s nothing to rehearse without them.';
  if (s.feet) {
    if (person.wellbeing.energy < SPENT) return 'You’re too tired to work on your feet. Sleep first.';
    const hurt = trainingRefusal(person, sim.now);
    if (hurt) return hurt;
  }
  return hourRefusal(sim, person, stepMinutes(b, step as BriefStep));
}

/** The ability rehearsing a brief on its feet goes further with (from 2026-10-16): listening, played off a reader; none for a voice alone at a microphone. */
export const rehearseSpeed = (b: Brief): AbilityId | undefined => (b.medium === 'voice' || b.partner === 0 ? undefined : 'listening');

/** What rehearsing a brief on its feet practises: the body or the voice, where the brief is built on one (level 2 or more), the stronger demand first. */
export function rehearseTrains(b: Brief): AbilityId | undefined {
  if (Math.max(b.physical, b.vocal) < 2) return undefined;
  return b.physical >= b.vocal ? 'physical' : 'vocal';
}

/** A step done: its time, its part moved by a share of what's left, its ability practised a little, and its rehearsal carried into the choice. */
export function prepareBrief(sim: Simulation, person: Person, b: Brief, step: BriefStep): { moved: number; part: BriefPart; minutes: number } {
  const s = BRIEF.steps[step];
  const rec = recordOf(person, b.id);
  const minutes = stepMinutes(b, step);
  const focus = focusAt(sim, person, sim.now);
  const n = repeatsToday(sim, person, `brief:${b.id}<${step}`);
  sim.advanceTo(sim.now + minutes * 60_000);
  exerts(person, s.feet ? BRIEF.met.feet : BRIEF.met.desk, minutes / 60);
  const before = rec.prep[s.part];
  const gain = s.gain * clamp(focus, 0.5, 1.1) * 0.5 ** n;
  // And by the ability the step is practice in (`stepSpeed`, from 2026-10-16): the breakdown by imagination, the lines
  // by memory. Rehearsal trains the body or the voice, by the brief (`rehearseTrains`), and until later that day read no
  // ability; from then it's played off the reader, and goes further with listening, where there's a reader to play off
  // (`rehearseSpeed`). A voice alone at a microphone has none, and reads none.
  const able = s.trains ? stepSpeed(sim, person, s.trains) : step === 'rehearse' && rehearseSpeed(b) ? stepSpeed(sim, person, rehearseSpeed(b)!) : 1;
  rec.prep[s.part] = r3(clamp(before + gain * prepLean(person, s.part) * prepSpeed(person, b) * able * (1 - before), 0, 1));
  if (step === 'rehearse') {
    rehearseChoice(rec.playing, gain);
    rehearseWays(rec.book, gain);
    // A classmate reading with you learns it with you (from 2026-10-12).
    if (rec.reader) rec.reader.prep = r3(clamp(rec.reader.prep + BRIEF.reader.rehearse * gain * (1 - rec.reader.prep), 0, 1));
    noteMaterial(person, { material: briefMaterial(b), practiced: true, at: sim.now });
  }
  // Rehearsing a brief built on the body or the voice on your feet is practice in it (from 2026-10-12, `rehearseTrains`):
  // until then rehearsal trained nothing, and a fight, a dance or a song never grew what it asked.
  const trains = step === 'rehearse' ? rehearseTrains(b) : s.trains;
  if (trains && rec.prep[s.part] > before) ordinary(sim, person, trains, focus, BRIEF.trainingWeight, `brief:${s.part}`);
  return { moved: r3(rec.prep[s.part] - before), part: s.part, minutes };
}

export function chooseRefusal(b: Brief | undefined, reading: unknown): string | undefined {
  if (!b) return 'There’s no such brief.';
  if (!readingOf(b, String(reading))) return 'That isn’t a reading this brief supports.';
  return undefined;
}

/** A reading and a way of playing it chosen: a different reading keeps half the breakdown, a different way half its rehearsal. */
export function chooseBrief(sim: Simulation, person: Person, b: Brief, reading: string, sides: Omit<Playing, 'chosenAt' | 'prep'>): { reading: string; interpretation: number; approach: number; readingChanged: boolean } {
  const rec = recordOf(person, b.id);
  const readingChanged = Boolean(rec.reading && rec.reading !== reading);
  if (readingChanged) rec.prep.interpretation = r3(rec.prep.interpretation * BRIEF.readingKept);
  rec.reading = reading;
  const before = sidesOf(rec.playing);
  rec.playing = choose(rec.playing, sides, sim.now);
  if (!sidesOf(rec.playing).length) delete rec.playing;
  // Only a side newly chosen is a choice for the habits (`systems/artistry.ts`), from 2026-10-12: until then every
  // side then played was counted on each press, so Change The Reading, which sends the same way again, and a side kept
  // while another axis changed each counted it once more, and five presses of one choice made a habit.
  noteMaterial(person, { approaches: sidesOf(rec.playing).filter((s) => !before.includes(s)) });
  return { reading, interpretation: rec.prep.interpretation, approach: rec.playing?.prep ?? 0, readingChanged };
}

/** The brief a self-tape in a genre is of, by its id or the genre's first. */
export function briefFor(genre: string, id?: unknown): Brief | undefined {
  if (id !== undefined && id !== null && id !== '') return BRIEF_BY_ID[String(id)];
  return briefsOf(genre)[0];
}

export function tapeRefusal(sim: Simulation, person: Person, genre: string, b: Brief | undefined): string | undefined {
  if (!GENRE_DEFS[genre] || !GENRE_BY_ID[genre]) return 'There’s no such genre.';
  if (!b) return 'There’s no such brief.';
  if (!b.kinds.includes(genre)) return `${b.title} isn’t a scene of that genre.`;
  // A craft is the School's to begin (`enroll`): a life with none (a test's or a tool's, never a new life's) is refused.
  if (!person.craft) return 'Your training hasn’t begun: there’s no craft to tape yet.';
  if (!peek(person, b.id).reading) return 'Choose a reading first: a take is of the scene played one way, and you should know which before the camera rolls.';
  return hourRefusal(sim, person, SELF_TAPE.minutes);
}

/** The reader as the take with them reads them (`systems/ensemble.ts`): a classmate by their preparation, timing and reliability, or the recording. */
export function readerRead(sim: Simulation, person: Person, b: Brief, rec: Pick<BriefRecord, 'reader'>): PartnerRead {
  // A voice alone at a microphone has nobody to read with: the take is yours.
  const level = b.medium === 'voice' ? 0 : b.partner;
  const mate = rec.reader ? person.school?.classmates[rec.reader.mate] : undefined;
  if (!rec.reader || !mate) return { name: 'A Recording', prep: 1, timing: BRIEF.reader.recording, agree: 1, reliability: 1, level };
  const p = classmatePerformer(sim, person, rec.reader.mate);
  const timing = 0.5 + 0.5 * ((Math.min(100, p.ability('listening')) + Math.min(100, p.ability('focus'))) / 200);
  return { name: mate.name, prep: rec.reader.prep, timing, agree: 1, reliability: reliabilityOf(sim, person, rec.reader.mate), level };
}

/** The take with its reader: your take, and what the reader brought to the lines played off them. */
export function takeTogether(sim: Simulation, person: Person, b: Brief, rec: BriefRecord, e: Evaluation): SharedResult | undefined {
  const read = readerRead(sim, person, b, rec);
  if (read.level === 0) return undefined;
  const ctx = briefContext(person, b, rec);
  const norm = (id: 'listening' | 'adaptability') => Math.min(1, abilityOf(sim, person, id) / Math.max(1, abilityFull(sim, person, id)));
  return sharedOf(e, read, sim.universe.meta.seed, e.inputs.key, (norm('listening') + norm('adaptability')) / 2, pieceWeights(ctx.task, ctx.lean, briefPiece(b, rec)));
}

/** Why a classmate can't read a brief with you, or nothing. */
export function readerRefusal(person: Person, b: Brief | undefined, mate: unknown): string | undefined {
  if (!b) return 'There’s no such brief.';
  if (b.medium === 'voice') return 'It’s recorded alone at a microphone: there’s nobody to read with.';
  if (mate === 'alone') return undefined;
  const i = Number(mate);
  const m = Number.isInteger(i) ? person.school?.classmates[i] : undefined;
  if (!m) return 'That isn’t one of your classmates.';
  if (trustOf(m) < WORK.trust.wary) return `${m.name.split(' ')[0]} would rather not, after how things have gone.`;
  return undefined;
}

/** A reader chosen: a classmate starts from nothing prepared with you, the same one keeps what they had; or the recording. */
export function chooseReader(person: Person, b: Brief, mate: number | 'alone'): { reader: string } {
  const rec = recordOf(person, b.id);
  if (mate === 'alone') { delete rec.reader; return { reader: 'A Recording' }; }
  if (rec.reader?.mate !== mate) rec.reader = { mate, prep: 0 };
  return { reader: person.school!.classmates[mate]!.name };
}

/** A callback's direction, earned by a Strong take: one side of one axis the material allows, the other of what was played where one was. */
function callbackFor(b: Brief, rec: BriefRecord, key: string, at: Instant): BriefRecord['callback'] {
  const axes = (Object.keys(AXES) as Axis[]).filter((a) => !b.allows?.[a]);
  if (!axes.length) return undefined;
  let h = 0;
  for (let i = 0; i < key.length; i += 1) h = (h * 31 + key.charCodeAt(i)) >>> 0;
  const axis = axes[h % axes.length]!;
  const played = rec.playing?.[axis];
  const [one, other] = AXES[axis].values;
  const side = played === one ? other : played === other ? one : AXES[axis].values[h % 2]!;
  return { axis, side, at, why: `The callback asks for it ${APPROACH_EFFECT[side].label.toLowerCase()}: ${APPROACH_EFFECT[side].words.charAt(0).toLowerCase()}${APPROACH_EFFECT[side].words.slice(1)}` };
}

/**
 * The share of a fully prepared take's genre practice a take credits (from 2026-10-16): `BRIEF.practiceUnprepared` with
 * nothing prepared, rising in step with the mean of the breakdown, the lines and the rehearsal against what completes
 * each, to 1 with all three complete.
 */
export function practiceShare(rec: Pick<BriefRecord, 'prep'>, b: Brief): number {
  const req = requiredOf(b);
  const parts: BriefPart[] = ['interpretation', 'memorization', 'rehearsal'];
  const done = parts.reduce((a, p) => a + Math.min(1, (rec.prep[p] ?? 0) / (req[p] ?? 1)), 0) / parts.length;
  return BRIEF.practiceUnprepared + (1 - BRIEF.practiceUnprepared) * done;
}

/** A brief taped: judged, kept on the work record and the brief's own, practice in its genres and the medium's technique, and a callback where it earned one. */
export function tapeBrief(sim: Simulation, person: Person, b: Brief, genre: string): { evaluation: Evaluation; take: Take } {
  const rec = recordOf(person, b.id);
  const focus = focusAt(sim, person, sim.now);
  const condition = conditionAt(sim, person, sim.now);
  const p = zonedParts(sim.now, sim.homeZone);
  const day = `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
  const again = repeatsToday(sim, person, `brief:${b.id}<tape`);
  const ctx = briefContext(person, b, rec);
  const piece = briefPiece(b, rec);
  const expected = judgePiece(sim.universe.meta.seed, performerOf(sim, person), { ...ctx, condition, key: 'expected', expected: true }, piece).overall;
  const purpose = purposeOf(rec, expected);
  const key = `brief:${person.id}:${b.id}:${day}:${again}`;
  const e = evaluatePiece(sim, person, { ...ctx, condition, key }, piece);
  sim.advanceTo(sim.now + SELF_TAPE.minutes * 60_000);
  person.wellbeing.energy = clamp(person.wellbeing.energy - ENGAGEMENT.energy.desk, 0, 100);
  const reading = readingOf(b, rec.reading)!;
  const band = bandOfQuality(e.overall);
  recordWork(sim, person, e, { at: sim.now, what: `${b.title} (${reading.label}), Taped`, band });
  // A take that's the same again, no better prepared and played the same way, is worth half as practice, on whatever
  // day: it counts, and teaches less than one that tries something. Until a played comparison of 2026-10-12
  // (tools/brief-strategies.ts) taping one brief over and over, unprepared, credited its genre with more practice than
  // preparing it properly did, and grew the camera's technique as fast.
  const worth = purpose === 'again' ? BRIEF.againWorth : 1;
  ordinary(sim, person, b.medium === 'voice' ? 'voiceover' : 'screen', focus, 0.5 * worth, 'self-tape');
  // And the technique the scene stages, a song sung or a fight played, practised as it's taped (from 2026-10-12).
  for (const k of Object.keys(b.techniques ?? {}) as Skill[]) ordinary(sim, person, k, focus, 0.25 * worth, 'self-tape');
  // The same brief again the same day is half the practice of the one before; its genres share it. And from 2026-10-16
  // a take credits its genres by how far it was prepared (`practiceShare`): a cold take, about a seventh of a prepared one.
  practiceGenres(sim, person, b.kinds, worth * 0.5 ** again * practiceShare(rec, b));
  noteMaterial(person, { material: briefMaterial(b), at: sim.now, overall: e.overall, approaches: sidesOf(rec.playing), shown: true });
  const chief = chiefLimit(e);
  // The genre's concern behind it, where its register asked for the ability that held the take back (from 2026-10-16).
  const concern = concernBehind(b, e);
  // What the way it was played came to against the scene (from 2026-10-16), kept so the take says it after a reload.
  const g = grainRead(e);
  // The take with its reader, and what it leaves between you and a classmate who read.
  const together = takeTogether(sim, person, b, rec, e);
  if (together && rec.reader) afterTogether(sim, person, rec.reader.mate, together, b.title);
  if (together) countTogether(person, together);
  const answered = rec.callback ? rec.playing?.[rec.callback.axis] === rec.callback.side : undefined;
  const take: Take = {
    at: sim.now, genre, reading: reading.id, sides: sidesOf(rec.playing), prep: { ...ctx.prep }, overall: e.overall, expected, band, ...(chief ? { chief } : {}), ...(concern ? { concern } : {}), ...(g ? { grain: { points: g.points, ability: g.ability, why: [...new Set(g.on.map((x) => x.why))].join('; ') } } : {}), purpose,
    ...(rec.callback ? { callback: { axis: rec.callback.axis, side: rec.callback.side }, answered } : {}),
    ...(together ? { together: { overall: together.overall, contribution: together.contribution, reader: together.partner, ...(together.slip ? { slip: together.slip } : {}), words: sharedWords(e.overall, together) } } : {}),
    key,
  };
  rec.takes.push(take);
  if (rec.takes.length > BRIEF.takesKept) rec.takes.splice(0, rec.takes.length - BRIEF.takesKept);
  // One callback a round: a callback answered ends it, and only a take that wasn't one earns the next. Until a played run
  // of 2026-10-12 every Strong callback earned another, and a mastered student taped one brief 84 times, a new note each
  // time and nothing else new: repetition with the numbers changed.
  // A callback taken the way its note asked is answered and ends the round; one played against it stays, the note
  // unanswered (from 2026-10-12: until then any take cleared it, answered or not). What the casting office saw, the
  // take with its reader, is what earns the next.
  const wasCallback = Boolean(rec.callback);
  if (wasCallback) countDirection(person, { ...(answered ? { answered: true, worked: 'callback' } : {}) });
  if (answered) delete rec.callback;
  const seen = bandOfQuality(together?.overall ?? e.overall);
  if (!wasCallback && (seen === 'strong' || seen === 'exceptional')) { const c = callbackFor(b, rec, key, sim.now); if (c) { rec.callback = c; countDirection(person, { given: true }); } }
  return { evaluation: e, take };
}

// ---------------------------------------------------------------------------
// What the record makes of it
// ---------------------------------------------------------------------------

/**
 * How much of a take of a brief rests on one ability or technique, 0 to 1, as the reading the record holds would
 * judge it: each dimension's leaned weight times the target's share of that dimension's inputs. Briefs that lean on a
 * weakness are where work on it shows.
 */
export function shareOf(person: Person, b: Brief, target: string, reading?: string): number {
  const rec = peek(person, b.id);
  const ctx = briefContext(person, b, rec, { reading: reading ?? rec.reading ?? b.readings[0]!.id });
  const piece = briefPiece(b, rec, reading ?? rec.reading ?? b.readings[0]!.id);
  const weights = pieceWeights(ctx.task, ctx.lean, piece);
  const total = Object.values(weights).reduce((a, x) => a + (x ?? 0), 0);
  // Stamina is read in a brief's beats as a drain through it (`systems/piece.ts`), not as an input: its share is the
  // drain at no stamina, at the mean beat's place, on the dimensions tiring reaches.
  if (target === 'stamina') {
    const tiring = (Object.keys(ctx.task.dims) as Dimension[]).filter((d) => ctx.task.dims[d]!.conditions?.includes('fatigue')).reduce((a, d) => a + (weights[d] ?? 0), 0) / total;
    return PIECE.drain * piece.load * 0.5 * tiring;
  }
  const techTotal = Object.values(ctx.techniques).reduce((a, x) => a + (x ?? 0), 0);
  let share = 0;
  for (const [d, spec] of Object.entries(ctx.task.dims) as [Dimension, NonNullable<typeof ctx.task.dims[Dimension]>][]) {
    const terms: { what: string; w: number }[] = [];
    for (const input of spec.inputs) {
      if ('ability' in input) { if (input.ability !== 'stamina') terms.push({ what: input.ability, w: input.weight }); }
      else if (techTotal > 0) for (const [k, w] of Object.entries(ctx.techniques) as [string, number][]) terms.push({ what: k, w: (input.weight * w) / techTotal });
    }
    for (const x of ctx.inputs[d] ?? []) if (x.ability !== 'stamina') terms.push({ what: x.ability, w: x.weight });
    const all = terms.reduce((a, t) => a + t.w, 0);
    const mine = terms.filter((t) => t.what === target).reduce((a, t) => a + t.w, 0);
    if (all > 0) share += ((weights[d] ?? 0) / total) * (mine / all);
  }
  return share;
}

/** Whether a take of a brief reads a target at a share the words can say, 1% of the work or more. */
const readsAt = (share: number) => Math.round(share * 100) >= 1;

/**
 * Whether any brief's take reads a target (from 2026-10-12). Audition, cold reading and script analysis are read by none
 * (the coursework reads them), so a take won't show them and no brief is suggested for them.
 */
export const briefsRead = (person: Person, target: string): boolean => BRIEFS.some((b) => readsAt(shareOf(person, b, target)));

export interface Suggestion { brief: string; genre: string; why: string }

/**
 * What to tape next, from the record (from 2026-10-12): a callback waiting; the brief that leans most on the weakness
 * recent work names; a reading of a taped brief not yet tried. Each says why. `weakness` is the input
 * recommendations put first, and a brief is suggested for it only where a brief reads it (`briefsRead`, from
 * 2026-10-12). With the actor's work so far (`identity`, `systems/artistry.ts`): the weakness that recurs for life where
 * recent work names none, a brief built on material never met, and one taped before played the other way from a habit.
 * None of it adds to a take: it's what's put in front of the actor, not how well they do it.
 */
export function suggestions(person: Person, weakness?: { target: string; label: string; level: number; full: number }, identity?: Identity): Suggestion[] {
  const out: Suggestion[] = [];
  if (!weakness && identity?.recurring) weakness = { target: identity.recurring.target, label: identity.recurring.label, level: 0, full: 0 };
  const recs = person.briefs ?? {};
  for (const [id, r] of Object.entries(recs)) {
    const b = BRIEF_BY_ID[id];
    if (b && r.callback) out.push({ brief: id, genre: r.takes.at(-1)?.genre ?? b.kinds[0]!, why: `A callback for ${b.title}: ${r.callback.why}` });
  }
  if (weakness) {
    // The brief leaning most on it that hasn't been taped (from 2026-10-12): until then the one leaning most, taped or
    // not, so a weakness that held offered the same brief after every take (`tools/freshness.ts` measured 7 takes in 10
    // on 3 briefs). Once every brief has been taped, the one leaning most.
    // Only a brief that reads it, at 1% of the work or more (`briefsRead`, from 2026-10-12). Until then every brief was
    // ranked, so a technique no brief reads (audition, cold reading, script analysis) was suggested a brief "(0% of the
    // work)", and so was one read by a few briefs once all of them were taped: the first untaped brief, which reads none
    // of it. A weakness no brief reads is suggested nothing here.
    const ranked = BRIEFS.map((b) => ({ b, s: shareOf(person, b, weakness.target) })).filter((x) => readsAt(x.s)).sort((x, y) => y.s - x.s || x.b.id.localeCompare(y.b.id));
    const free = ranked.filter((x) => !out.some((o) => o.brief === x.b.id));
    const fresh = free.find((x) => !recs[x.b.id]?.takes.length);
    const pick = fresh ?? free[0];
    const than = fresh && fresh !== ranked[0] ? 'any brief you haven’t taped' : 'any other brief';
    if (pick) out.push({ brief: pick.b.id, genre: pick.b.kinds[0]!, why: weakness.full ? `It leans on ${weakness.label.toLowerCase()} more than ${than} (${Math.round(pick.s * 100)}% of the work), which recent work names as a weakness, at ${Math.round(weakness.level)} of ${Math.round(weakness.full)}.` : `It leans on ${weakness.label.toLowerCase()} more than ${than} (${Math.round(pick.s * 100)}% of the work): your work so far names it as a weakness that keeps coming back.` });
  }
  // Material never met: the first brief built on it, untaped.
  if (identity?.untried) {
    const b = BRIEFS.find((x) => !recs[x.id] && featuresOf(briefMaterial(x)).includes(identity.untried!) && !out.some((o) => o.brief === x.id));
    if (b) out.push({ brief: b.id, genre: b.kinds[0]!, why: `It’s built on ${(FEATURE_LABEL[identity.untried] ?? identity.untried).toLowerCase()}, which none of your work has met yet.` });
  }
  // A habit: a brief taped before, which takes it the other way.
  if (identity?.habit) {
    const { axis, side } = identity.habit;
    const other = AXES[axis].values.find((v) => v !== side)!;
    const id = Object.keys(recs).find((x) => BRIEF_BY_ID[x] && !misfitOf(axis, other, briefMaterial(BRIEF_BY_ID[x]!)) && !out.some((o) => o.brief === x));
    if (id) out.push({ brief: id, genre: recs[id]!.takes.at(-1)?.genre ?? BRIEF_BY_ID[id]!.kinds[0]!, why: `You usually play it ${APPROACH_EFFECT[side].label.toLowerCase()}; ${BRIEF_BY_ID[id]!.title} takes it ${APPROACH_EFFECT[other].label.toLowerCase()} too.` });
  }
  // A genre none of the work has been in (from 2026-10-12): the brief written for the genre least familiar, untaped.
  // Until then a student with no weakness to name was offered only other readings of briefs already taped
  // (`tools/freshness.ts`: a mastered student's 20 takes fell on 7 briefs, with 141 never offered). What the record
  // knows of a genre is familiarity, how much of it they've done; what they love is never read here.
  const fresh = BRIEFS.filter((b) => !recs[b.id] && !out.some((o) => o.brief === b.id)).map((b) => ({ b, known: familiarityOf(person, b.kinds[0]!) })).sort((x, y) => x.known - y.known || x.b.id.localeCompare(y.b.id))[0];
  if (fresh) out.push({ brief: fresh.b.id, genre: fresh.b.kinds[0]!, why: `${GENRE_BY_ID[fresh.b.kinds[0]!]?.label ?? fresh.b.kinds[0]} is the genre your work knows least (${Math.round(fresh.known)} of 100), and ${fresh.b.title} is new to you.` });
  for (const [id, r] of Object.entries(recs)) {
    const b = BRIEF_BY_ID[id];
    if (!b || !r.takes.length || out.some((o) => o.brief === id)) continue;
    const tried = new Set(r.takes.map((t) => t.reading));
    const next = b.readings.find((x) => !tried.has(x.id));
    if (next) out.push({ brief: id, genre: r.takes.at(-1)!.genre, why: `${b.title} supports another reading you haven’t taped: ${next.label}.` });
  }
  // A loved genre isn't suggested here: what somebody loves is read in one place only, `systems/enjoyment.ts`, and
  // changes how a day of its work feels, never what's put in front of them (`tests/cohesion.test.ts`). The Player
  // Profile names a loved genre least known (`nextGenre`).
  return out.slice(0, 5);
}

/** What a brief asks, in words: each dimension's weight and the abilities and techniques it reads, for the brief's look. */
export function asksOf(person: Person, b: Brief, reading?: string): { dimension: Dimension; label: string; share: number; reads: string[] }[] {
  const rec = peek(person, b.id);
  const ctx = briefContext(person, b, rec, { reading: reading ?? rec.reading ?? b.readings[0]!.id });
  const weights = pieceWeights(ctx.task, ctx.lean, briefPiece(b, rec, reading ?? rec.reading ?? b.readings[0]!.id));
  const total = Object.values(weights).reduce((a, x) => a + (x ?? 0), 0);
  return (Object.keys(ctx.task.dims) as Dimension[]).map((d) => {
    const spec = ctx.task.dims[d]!;
    const names = new Map<string, number>();
    // Stamina isn't an input of a brief's beats (`systems/piece.ts`): it's the drain through them, said on its own.
    for (const input of spec.inputs) if ('ability' in input) { if (input.ability !== 'stamina') names.set(input.ability, (names.get(input.ability) ?? 0) + input.weight); } else for (const k of Object.keys(ctx.techniques)) names.set(k, (names.get(k) ?? 0) + input.weight);
    for (const x of ctx.inputs[d] ?? []) if (x.ability !== 'stamina') names.set(x.ability, (names.get(x.ability) ?? 0) + x.weight);
    return { dimension: d, label: DIMENSION_LABEL[d], share: (weights[d] ?? 0) / total, reads: [...names.entries()].sort((x, y) => y[1] - x[1]).map(([k]) => k) };
  }).sort((x, y) => y.share - x.share);
}

/** Whether a target is at its full: an ability at its full, a technique mastered. */
export const atFull = (level: number, target: string, full: number): boolean => level >= (isAbility(target as never) ? full : MASTERED);

/** The direction a callback holds, as `misfitOf` reads it, for a choice's look. */
export const callbackMisfit = (b: Brief, rec: BriefRecord, axis: Axis, side: AxisValue): string | undefined => misfitOf(axis, side, briefMaterial(b), directionOf(rec));

/** How far a part counts complete, in words: what it's at against what completes it. */
export function partWords(b: Brief, rec: BriefRecord, part: string, known: number): string {
  const req = requiredOf(b);
  const now = part === 'genre' ? known : (rec.prep as Record<string, number>)[part] ?? 0;
  return `${Math.round(now * 100)}% of ${Math.round((req[part] ?? 1) * 100)}%`;
}

export function registerBriefs(sim: Simulation): void {
  // Each with an optional `actionId`: the same action sent twice is lived once.
  sim.onCommand<{ brief: string; step: string; actionId?: string }, { moved: number; part: BriefPart; minutes: number }>('brief.prepare', (p, { sim: s }) => {
    const b = BRIEF_BY_ID[String(p?.brief)];
    const no = alreadyApplied(s.player, p?.actionId) ?? prepareRefusal(s, s.player, b, String(p?.step));
    if (no) throw new CommandError(no);
    markApplied(s.player, p?.actionId);
    return prepareBrief(s, s.player, b!, String(p?.step) as BriefStep);
  });
  sim.onCommand<{ brief: string; reading: string; pace?: string; scale?: string; structure?: string }, { reading: string; interpretation: number; approach: number; readingChanged: boolean }>('brief.choose', (p, { sim: s }) => {
    const b = BRIEF_BY_ID[String(p?.brief)];
    const no = chooseRefusal(b, p?.reading);
    if (no) throw new CommandError(no);
    const pick = <T extends string>(v: unknown, of: readonly T[]): T | undefined => ((of as readonly unknown[]).includes(v) ? (v as T) : undefined);
    return chooseBrief(s, s.player, b!, String(p!.reading), { pace: pick(p?.pace, ['measured', 'driven'] as const), scale: pick(p?.scale, ['restrained', 'expansive'] as const), structure: pick(p?.structure, ['set', 'open'] as const) });
  });
  sim.onCommand<{ brief: string; mate: number | 'alone' }, { reader: string }>('brief.reader', (p, { sim: s }) => {
    const b = BRIEF_BY_ID[String(p?.brief)];
    const no = readerRefusal(s.player, b, p?.mate);
    if (no) throw new CommandError(no);
    return chooseReader(s.player, b!, p!.mate === 'alone' ? 'alone' : Number(p!.mate));
  });
  sim.onCommand<{ genre: string; brief?: string; actionId?: string }, { overall: number; brief: string; purpose: Purpose; band: string }>('practice.self_tape', (p, { sim: s }) => {
    const genre = String(p?.genre);
    const b = briefFor(genre, p?.brief);
    const no = alreadyApplied(s.player, p?.actionId) ?? tapeRefusal(s, s.player, genre, b);
    if (no) throw new CommandError(no);
    markApplied(s.player, p?.actionId);
    const { evaluation, take } = tapeBrief(s, s.player, b!, genre);
    return { overall: evaluation.overall, brief: b!.id, purpose: take.purpose, band: take.band };
  });
}

/** A genre's familiarity, for the brief's look (`genreState` without creating one). */
export const familiarityOf = (person: Person, genre: string): number => person.engagement?.byGenre[genre]?.familiarity ?? 0;
export { genreState };

// `SUFFICIENT`, readiness's sufficient figure kept here "for a check", went on 2026-10-16: nothing read it.
