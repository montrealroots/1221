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
 *   Each step moves its part by a share of what's left, half as far again the same day. Rehearsal counts complete
 *   higher the more the scene turns (`requiredOf`): each change of tone between beats and each beat held two ways ask
 *   more of it, so a scene that goes from a joke to grief is a harder thing to have ready, and the brief says so.
 * - **The choice** (`brief.choose`): a reading the brief supports, and how to play it (`content/approaches.ts`). Every
 *   reading is valid: it leans the work's dimensions and draws on different abilities, normalized, so it moves weight
 *   and adds none. A change of reading keeps half the breakdown; a change of how it's played keeps half its rehearsal.
 *   Only the material's own `allows` and a callback's direction, said before the take, can hold a choice back.
 * - **The take** (`practice.self_tape`): judged as a taped brief (`TASK_PROFILES.tape`), kept on the work record and the
 *   brief's own record with its reading, its playing, its preparation, its result and what held it back most, and its
 *   purpose (`purposeOf`): a first take, another reading, another way of playing it, a take answering a callback's
 *   direction, an improved one, or the same again, said plainly and not refused.
 * - **A callback**: a take at Strong or better earns a callback, a harder pitch with a director's note on one side of
 *   one axis, given before the next take of it. It's the scene's harder form, and the answer to repetition: the same
 *   brief again is worth doing for another reading, the note, or better work, and the record says which it was.
 *
 * What isn't counted twice: a brief's several genres share one session of practice (`practiceGenres`); the genre's
 * familiarity is a part of preparation the take reads, so it doesn't also speed the preparation (the material's
 * features met before and the genre's practice do, the better of the two, `prepSpeed`); a genre's applied demands
 * join the techniques once, and the brief already stages them (`tests/briefs-content.test.ts`); the same take again
 * the same day keeps half its practice; an action id is lived once.
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
import { withDemands } from '../content/demands';
import { ENGAGEMENT } from '../content/engagement';
import { GENRE_DEFS } from '../content/genres';
import { GENRE_BY_ID } from '../content/film-genres';
import type { Axis, AxisValue, MaterialProfile } from '../content/material';
import type { Skill } from '../content/school';
import { DIMENSION_LABEL, EVALUATION, TASK_PROFILES, type Dimension } from '../content/tasks';
import { alreadyApplied, isAbility, markApplied, repeatsToday } from './attributes';
import { exerts } from './body';
import { prepLean } from './coursework';
import { bandOfQuality, chiefLimit, evaluate, judge, leanedWeights, performerOf, recordWork, type Evaluation } from './evaluation';
import { SELF_TAPE, genreState, practiceGenres } from './engagement';
import { featureSpeed, noteMaterial } from './experience';
import { inHospital } from './health';
import { trainingRefusal } from './injury';
import { SPENT, commitmentWithin, occupiedAt } from './life';
import { choose, materialContext, misfitOf, rehearseChoice, sidesOf, type Playing } from './material';
import { conditionAt, focusAt, ordinary } from './school';

export type BriefStep = 'read' | 'lines' | 'rehearse';
export type BriefPart = 'interpretation' | 'memorization' | 'rehearsal';
export type Purpose = 'first' | 'callback' | 'another-reading' | 'another-way' | 'improved' | 'again';

/** The numbers, all SLATE's estimates. */
export const BRIEF = {
  steps: {
    read: { label: 'Break It Down', what: 'The circumstances, the relationship, what you want and what’s in the way, and where it turns: the ground your reading stands on.', minutes: 30, part: 'interpretation', gain: 0.5, feet: false, trains: 'imagination' },
    lines: { label: 'Learn The Lines', what: 'The lines, until they’re yours.', minutes: 30, minutesMedium: 50, part: 'memorization', gain: 0.5, feet: false, trains: 'memory' },
    rehearse: { label: 'Rehearse It On Your Feet', what: 'Played through aloud with the beats placed, and the way you chose to play it worked in.', minutes: 45, part: 'rehearsal', gain: 0.4, feet: true, trains: undefined },
  } as const,
  /** Rehearsal needs some of the lines first. */
  rehearseNeeds: 0.3,
  /** What each part counts complete at; rehearsal's rises with what the scene turns on. */
  complete: { interpretation: 0.85, memorization: 0.9, rehearsal: 0.6, perTransition: 0.1, perBlend: 0.05, mostRehearsal: 0.95 },
  /** A change of reading keeps this much of the breakdown. */
  readingKept: 0.5,
  /**
   * A taped brief's difficulty: practice material at home, pitched at a student as a class's scene is (a par of 54 on
   * coursework's scale, `difficultyOf`), where until 2026-10-12 a material-less self-tape was pitched at 0.125, over a
   * professional's; a first-year's fully prepared take of a brief came out at 30, Unready, with nothing left to do but
   * wait for abilities. A callback is pitched as an audition's next round, near a professional's (0.1).
   */
  difficulty: -0.2, callback: 0.3,
  /** The techniques a medium reads of its own: the camera's, or the microphone's. */
  base: { camera: { screen: 2, scene: 1 }, voice: { voiceover: 2, scene: 1 } } as Record<Brief['medium'], Partial<Record<Skill, number>>>,
  /** A step's training weight on the ability it's practice in, as coursework's (`WORK.trainingWeight`). */
  trainingWeight: 0.25,
  /** Effort, as METs. */
  met: { desk: 1.5, feet: 2.5 },
  /** Takes kept per brief. */
  takesKept: 8,
  /** A better take than the last by this many points, its expected result with no draw, is an improved one. */
  improvedBy: 1,
} as const;

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
  purpose: Purpose;
  /** The callback's direction it answered, where it was one. */
  callback?: { axis: Axis; side: AxisValue };
  key: string;
}

export interface BriefRecord {
  prep: Record<BriefPart, number>;
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
    tones: [...new Set(b.beats.flatMap((x) => x.tones))], turns: 0, beats: b.beats.map((x) => ({ tones: x.tones })),
    ...(b.techniques ? { techniques: b.techniques } : {}), ...(b.allows ? { allows: b.allows } : {}),
    why: { ...(b.why.timing ? { timing: b.why.timing } : {}), ...(b.why.physical ? { physical: b.why.physical } : {}), ...(b.why.partner ? { partner: b.why.partner } : {}), ...(b.why.vocal ? { vocal: b.why.vocal } : {}), ...(b.why.improvisation ? { improvisation: b.why.improvisation } : {}), ...(b.why.language ? { language: b.why.language } : {}), ...(b.why.techniques ? { techniques: b.why.techniques } : {}), ...(b.why.allows ? { allows: b.why.allows } : {}), turns: b.why.beats ?? '' },
  };
  MATERIAL.set(b.id, m);
  return m;
}

/** The techniques a take reads: the medium's own, the brief's, and its genres' applied demands, once each. */
export function tapeReadsOf(b: Brief): Partial<Record<Skill, number>> {
  const out: Partial<Record<Skill, number>> = { ...BRIEF.base[b.medium] };
  for (const [k, w] of Object.entries(b.techniques ?? {}) as [Skill, number][]) if (out[k] === undefined) out[k] = w;
  return withDemands(out, b.kinds);
}

/** The changes between beats and the beats held two ways, as the material counts them. */
export function turnsOf(b: Brief): { transitions: number; blends: number } {
  const key = (x: { tones: readonly string[] }) => [...x.tones].sort().join('+');
  return { transitions: b.beats.slice(1).filter((x, i) => key(x) !== key(b.beats[i]!)).length, blends: b.beats.filter((x) => new Set(x.tones).size > 1).length };
}

/** What each part of a brief's preparation counts complete at. */
export function requiredOf(b: Brief): Record<string, number> {
  const t = turnsOf(b);
  const c = BRIEF.complete;
  return { interpretation: c.interpretation, memorization: c.memorization, rehearsal: Math.min(c.mostRehearsal, c.rehearsal + c.perTransition * t.transitions + c.perBlend * t.blends), genre: SELF_TAPE.genreComplete };
}

/** How well the brief's genres are known, the best of them, 0 to 1: a part of the take's preparation. */
export const genreKnown = (person: Person, b: Brief): number => Math.max(0, ...b.kinds.map((g) => (person.engagement?.byGenre[g]?.familiarity ?? 0) / 100));

/** How much faster a step goes: the material's features met before or the genres' practice, the better of the two; familiarity is the take's own part, so it doesn't count here too. */
export function prepSpeed(person: Person, b: Brief): number {
  const practice = Math.max(0, ...b.kinds.map((g) => person.engagement?.byGenre[g]?.practice ?? 0));
  return Math.max(featureSpeed(person, briefMaterial(b)), 1 + ENGAGEMENT.genreSpeed * practice / 100);
}

export const readingOf = (b: Brief, id: string | undefined): Reading | undefined => b.readings.find((r) => r.id === id);

/** A callback's direction as a material reads it. */
const directionOf = (rec: BriefRecord): Partial<Record<Axis, AxisValue>> | undefined => (rec.callback ? { [rec.callback.axis]: rec.callback.side } : undefined);

/**
 * What a take of a brief asks, but the day: its task, techniques, preparation, difficulty, and the material's, the
 * reading's and the playing's reads. `over` replaces the record's own reading, playing or preparation, for a preview.
 */
export function briefContext(person: Person, b: Brief, rec: BriefRecord, over: { reading?: string; playing?: Playing; prep?: Partial<Record<string, number>>; callback?: boolean } = {}) {
  const task = TASK_PROFILES.tape!;
  const material = briefMaterial(b);
  const playing = over.playing ?? rec.playing;
  const callback = over.callback ?? Boolean(rec.callback);
  const read = materialContext(task, material, playing, callback ? directionOf(rec) : undefined);
  const lean = { ...read.lean };
  const inputs: Partial<Record<Dimension, { ability: AbilityId; weight: number }[]>> = Object.fromEntries(Object.entries(read.inputs).map(([d, xs]) => [d, (xs ?? []).map((x) => ({ ...x }))]));
  const reading = readingOf(b, over.reading ?? rec.reading);
  if (reading) {
    for (const [d, x] of Object.entries(reading.lean) as [Dimension, number][]) if (lean[d] !== undefined) lean[d] = lean[d]! * x;
    for (const dr of reading.draws) {
      if (!task.dims[dr.dim]) continue;
      const list = (inputs[dr.dim] ??= []);
      const had = list.find((y) => y.ability === dr.ability);
      if (had) had.weight += dr.weight; else list.push({ ability: dr.ability, weight: dr.weight });
    }
  }
  const prep: Record<string, number> = { ...rec.prep, genre: genreKnown(person, b), ...(over.prep ?? {}) } as Record<string, number>;
  const required = requiredOf(b);
  if (sidesOf(playing).length) { prep.approach = over.prep?.approach ?? playing!.prep; required.approach = PLAYING.complete; }
  return { task, techniques: tapeReadsOf(b), prep, required, difficulty: BRIEF.difficulty + (callback ? BRIEF.callback : 0), lean, inputs, extraPrep: read.prep, fit: read.fit };
}

/** What a take would come to now, with today's preparation and condition and no draw: what the player sees before taping. */
export function forecast(sim: Simulation, person: Person, b: Brief, over: Parameters<typeof briefContext>[3] = {}): Evaluation {
  return judge(sim.universe.meta.seed, performerOf(sim, person), { ...briefContext(person, b, peek(person, b.id), over), condition: conditionAt(sim, person, sim.now), key: `forecast:${b.id}`, expected: true });
}

/** What a reading and a way of playing it would come to fully prepared, on a sufficient day, with no draw. */
export function preview(sim: Simulation, person: Person, b: Brief, reading: string, sides: Omit<Playing, 'chosenAt' | 'prep'>): Evaluation {
  const full = { interpretation: 1, memorization: 1, rehearsal: 1, genre: 1, approach: 1 };
  return judge(sim.universe.meta.seed, performerOf(sim, person), { ...briefContext(person, b, peek(person, b.id), { reading, playing: { ...sides, chosenAt: sim.now, prep: 1 }, prep: full }), condition: { readiness: 100 }, key: `preview:${b.id}`, expected: true });
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
  again: 'The same reading, played the same way, no better prepared: it counts, and practice on it the same day keeps half.',
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

export const stepMinutes = (b: Brief, step: BriefStep): number => (step === 'lines' && b.size === 'medium' ? BRIEF.steps.lines.minutesMedium : BRIEF.steps[step].minutes);

export function prepareRefusal(sim: Simulation, person: Person, b: Brief | undefined, step: string): string | undefined {
  if (!b) return 'There’s no such brief.';
  const s = BRIEF.steps[step as BriefStep];
  if (!s) return 'That isn’t a step of a brief.';
  const rec = peek(person, b.id);
  if (rec.prep[s.part] >= 0.97) return 'There’s nothing more to gain from it now.';
  if (step === 'rehearse' && rec.prep.memorization < BRIEF.rehearseNeeds) return 'Learn some of the lines first: there’s nothing to rehearse without them.';
  if (s.feet) {
    if (person.wellbeing.energy < SPENT) return 'You’re too tired to work on your feet. Sleep first.';
    const hurt = trainingRefusal(person, sim.now);
    if (hurt) return hurt;
  }
  return hourRefusal(sim, person, stepMinutes(b, step as BriefStep));
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
  rec.prep[s.part] = r3(clamp(before + gain * prepLean(person, s.part) * prepSpeed(person, b) * (1 - before), 0, 1));
  if (step === 'rehearse') {
    rehearseChoice(rec.playing, gain);
    noteMaterial(person, { material: briefMaterial(b), practiced: true, at: sim.now });
  }
  if (s.trains && rec.prep[s.part] > before) ordinary(sim, person, s.trains, focus, BRIEF.trainingWeight, `brief:${s.part}`);
  return { moved: r3(rec.prep[s.part] - before), part: s.part, minutes };
}

export function chooseRefusal(b: Brief | undefined, reading: unknown): string | undefined {
  if (!b) return 'There’s no such brief.';
  if (!readingOf(b, String(reading))) return 'That isn’t a reading this brief supports.';
  return undefined;
}

/** A reading and a way of playing it chosen: a different reading keeps half the breakdown, a different way half its rehearsal. */
export function chooseBrief(sim: Simulation, person: Person, b: Brief, reading: string, sides: Omit<Playing, 'chosenAt' | 'prep'>): { reading: string; interpretation: number; approach: number } {
  const rec = recordOf(person, b.id);
  if (rec.reading && rec.reading !== reading) rec.prep.interpretation = r3(rec.prep.interpretation * BRIEF.readingKept);
  rec.reading = reading;
  rec.playing = choose(rec.playing, sides, sim.now);
  if (!sidesOf(rec.playing).length) delete rec.playing;
  noteMaterial(person, { approaches: sidesOf(rec.playing) });
  return { reading, interpretation: rec.prep.interpretation, approach: rec.playing?.prep ?? 0 };
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

/** A brief taped: judged, kept on the work record and the brief's own, practice in its genres and the medium's technique, and a callback where it earned one. */
export function tapeBrief(sim: Simulation, person: Person, b: Brief, genre: string): { evaluation: Evaluation; take: Take } {
  const rec = recordOf(person, b.id);
  const focus = focusAt(sim, person, sim.now);
  const condition = conditionAt(sim, person, sim.now);
  const p = zonedParts(sim.now, sim.homeZone);
  const day = `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
  const again = repeatsToday(sim, person, `brief:${b.id}<tape`);
  const ctx = briefContext(person, b, rec);
  const expected = judge(sim.universe.meta.seed, performerOf(sim, person), { ...ctx, condition, key: 'expected', expected: true }).overall;
  const purpose = purposeOf(rec, expected);
  const key = `brief:${person.id}:${b.id}:${day}:${again}`;
  const e = evaluate(sim, person, { ...ctx, condition, key });
  sim.advanceTo(sim.now + SELF_TAPE.minutes * 60_000);
  person.wellbeing.energy = clamp(person.wellbeing.energy - ENGAGEMENT.energy.desk, 0, 100);
  const reading = readingOf(b, rec.reading)!;
  const band = bandOfQuality(e.overall);
  recordWork(sim, person, e, { at: sim.now, what: `${b.title} (${reading.label}), Taped`, band });
  ordinary(sim, person, b.medium === 'voice' ? 'voiceover' : 'screen', focus, 0.5, 'self-tape');
  // The same brief again the same day is half the practice of the one before; its genres share it.
  practiceGenres(sim, person, b.kinds, 0.5 ** again);
  noteMaterial(person, { material: briefMaterial(b), at: sim.now, overall: e.overall, approaches: sidesOf(rec.playing), shown: true });
  const chief = chiefLimit(e);
  const take: Take = {
    at: sim.now, genre, reading: reading.id, sides: sidesOf(rec.playing), prep: { ...ctx.prep }, overall: e.overall, expected, band, ...(chief ? { chief } : {}), purpose,
    ...(rec.callback ? { callback: { axis: rec.callback.axis, side: rec.callback.side } } : {}), key,
  };
  rec.takes.push(take);
  if (rec.takes.length > BRIEF.takesKept) rec.takes.splice(0, rec.takes.length - BRIEF.takesKept);
  delete rec.callback;
  if (band === 'strong' || band === 'exceptional') { const c = callbackFor(b, rec, key, sim.now); if (c) rec.callback = c; }
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
  const weights = leanedWeights(ctx.task, [], ctx.lean);
  const total = Object.values(weights).reduce((a, x) => a + (x ?? 0), 0);
  const techTotal = Object.values(ctx.techniques).reduce((a, x) => a + (x ?? 0), 0);
  let share = 0;
  for (const [d, spec] of Object.entries(ctx.task.dims) as [Dimension, NonNullable<typeof ctx.task.dims[Dimension]>][]) {
    const terms: { what: string; w: number }[] = [];
    for (const input of spec.inputs) {
      if ('ability' in input) terms.push({ what: input.ability, w: input.weight });
      else if (techTotal > 0) for (const [k, w] of Object.entries(ctx.techniques) as [string, number][]) terms.push({ what: k, w: (input.weight * w) / techTotal });
    }
    for (const x of ctx.inputs[d] ?? []) terms.push({ what: x.ability, w: x.weight });
    const all = terms.reduce((a, t) => a + t.w, 0);
    const mine = terms.filter((t) => t.what === target).reduce((a, t) => a + t.w, 0);
    if (all > 0) share += ((weights[d] ?? 0) / total) * (mine / all);
  }
  return share;
}

export interface Suggestion { brief: string; genre: string; why: string }

/**
 * What to tape next, from the record (from 2026-10-12): a callback waiting; the brief that leans most on the weakness
 * recent work names; a reading of a taped brief not yet tried. Each says why. `weakness` is the input
 * recommendations put first.
 */
export function suggestions(person: Person, weakness?: { target: string; label: string; level: number; full: number }): Suggestion[] {
  const out: Suggestion[] = [];
  const recs = person.briefs ?? {};
  for (const [id, r] of Object.entries(recs)) {
    const b = BRIEF_BY_ID[id];
    if (b && r.callback) out.push({ brief: id, genre: r.takes.at(-1)?.genre ?? b.kinds[0]!, why: `A callback for ${b.title}: ${r.callback.why}` });
  }
  if (weakness) {
    const ranked = BRIEFS.map((b) => ({ b, s: shareOf(person, b, weakness.target) })).sort((x, y) => y.s - x.s || x.b.id.localeCompare(y.b.id));
    const pick = ranked.find((x) => !out.some((o) => o.brief === x.b.id));
    if (pick) out.push({ brief: pick.b.id, genre: pick.b.kinds[0]!, why: `It leans on ${weakness.label.toLowerCase()} more than any other brief (${Math.round(pick.s * 100)}% of the work), which recent work names as a weakness, at ${Math.round(weakness.level)} of ${Math.round(weakness.full)}.` });
  }
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
  const weights = leanedWeights(ctx.task, [], ctx.lean);
  const total = Object.values(weights).reduce((a, x) => a + (x ?? 0), 0);
  return (Object.keys(ctx.task.dims) as Dimension[]).map((d) => {
    const spec = ctx.task.dims[d]!;
    const names = new Map<string, number>();
    for (const input of spec.inputs) if ('ability' in input) names.set(input.ability, (names.get(input.ability) ?? 0) + input.weight); else for (const k of Object.keys(ctx.techniques)) names.set(k, (names.get(k) ?? 0) + input.weight);
    for (const x of ctx.inputs[d] ?? []) names.set(x.ability, (names.get(x.ability) ?? 0) + x.weight);
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
  sim.onCommand<{ brief: string; reading: string; pace?: string; scale?: string; structure?: string }, { reading: string; interpretation: number; approach: number }>('brief.choose', (p, { sim: s }) => {
    const b = BRIEF_BY_ID[String(p?.brief)];
    const no = chooseRefusal(b, p?.reading);
    if (no) throw new CommandError(no);
    const pick = <T extends string>(v: unknown, of: readonly T[]): T | undefined => ((of as readonly unknown[]).includes(v) ? (v as T) : undefined);
    return chooseBrief(s, s.player, b!, String(p!.reading), { pace: pick(p?.pace, ['measured', 'driven'] as const), scale: pick(p?.scale, ['restrained', 'expansive'] as const), structure: pick(p?.structure, ['set', 'open'] as const) });
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

/** Its sum of reads' weight, for a check: `EVALUATION` unused otherwise. */
export const SUFFICIENT = EVALUATION.sufficientReadiness;
