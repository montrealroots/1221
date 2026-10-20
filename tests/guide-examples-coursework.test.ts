/**
 * The guide's worked examples on coursework and partners, played (from 2026-10-12; `content/guide/coursework.ts`).
 *
 * The connected-journey map (docs/verification/CONNECTED-JOURNEY-MAP-2026-10-12.md §5) promised that every worked
 * example runs on a throwaway save that's never handed to an adapter, and that its figures are checked; nothing did
 * until this file. Each of the eight is played here on a fresh save of its own, through the commands its steps name,
 * and the figures its rendered text states are read back out of that text (`GUIDE_BY_ID`) and set against what the
 * engine then holds: change a rule's constant and the words and the play move together; change the play, or a figure
 * the words compute for themselves, and this fails.
 *
 * TEST SETUP, said again where it's made:
 * - the clock's commitments and the school's own calendar cleared (orientation, the term's opening, its weeks), as
 *   tests/workbook.test.ts clears the commitments: a class day brings moments, asks and work of its own by the draw,
 *   and the examples read only what their own steps do;
 * - readiness held at 80 before each step, the examples' "readiness 80", a focus of 1, by the wellbeing set by hand; the
 *   even nature and the kind of play and material new to you are the new life's own, and asserted on every piece
 *   played (`evenAndNew`), not set. Until the verifier of 2026-10-12 read this, partners and your class never asserted
 *   it, and your class's bond figure passed on its seed with its nature unread;
 * - the pieces, put on the record by hand (`piece`): Acting III's Scene Study on The Seagull (`seagull-4`), as the
 *   guide's examples are written, since a first-year's timetable has no Acting III and Acting I's Scene Study never
 *   sets The Seagull; for the table work's verse figures, Heightened Text Scene (`DRAM 203a/b`) on the first verse
 *   scene outside the Greek; and for A Smaller Piece Of It's cap, a second Scene Study with no way chosen to set it
 *   against;
 * - the showings, held three ways, none at a meeting the timetable brings. A showing at a course's meeting is held
 *   through `meetingWeight`, the call the class-day reckoning makes for each course in the room, at nine on the day
 *   it's due (feedback, another way at a note's drill, partners), since Acting III never meets in a first-year's
 *   timetable. The feedback example is played on Acting I's meetings for the same reason: its revision is due at the
 *   course's next meeting, and nothing in the example reads which course it is. A Smaller Piece Of It's cap is the
 *   band `show` gives each of the two pieces, called directly at that moment, and working a problem through reads the
 *   showing's segments from `judgeWork`, the judgement a showing makes, with no meeting, band or growth;
 * - what a life reaches only by living: the parts a showing is given at (feedback), a note given three times and the
 *   lines where it finds them (another way at a note), a partner met, their drive and their reliability (partners, your class), a boundary a class day
 *   brings (your class), the lines learned and a part's rehearsal at 36% (working a problem through), and the full
 *   abilities and parts that show A Smaller Piece Of It's cap.
 *
 * Every example is played; none is left unrun. Three of their figures were wrong against the engine when this was
 * first run, and two setups were moved off a half percent after it (the verse scanned twice, the rehearsal at 36%);
 * the guide's file says what each said and why it changed.
 */
import { describe, expect, it } from 'vitest';
import { createSave } from '@/engine';
import type { Simulation } from '@/engine/core/simulation';
import { newLifeConfig } from '@/engine/world/bootstrap';
import { instantFromZoned, zonedParts } from '@/engine/core/time';
import { serialise } from '@/engine/persistence/adapter';
import { GUIDE_BY_ID } from '@/engine/content/guide';
import { PREP_DIMS, SCENES, templateById } from '@/engine/content/coursework';
import { TASK_PROFILES, TEMPLATE_TASK, type Dimension } from '@/engine/content/tasks';
import { genresOfPlay } from '@/engine/content/plays';
import { readiness, readinessParts } from '@/engine/systems/life';
import { focusAt } from '@/engine/systems/school';
import { personalityOf } from '@/engine/systems/personality';
import { genreSpeed } from '@/engine/systems/engagement';
import { featureSpeed } from '@/engine/systems/experience';
import { materialOf } from '@/engine/systems/material';
import { abilityFull, abilityOf, attributesOf } from '@/engine/systems/attributes';
import {
  WORK, courseworkOf, forecastWork, judgeWork, mateRecord, meetingWeight, meetingsFrom, noteTaken, notesOf, partnerPrepOf, partnerReadOf, preparedParts,
  questionsFor, show, trustOf, weightsOf, workContext, type Assignment,
} from '@/engine/systems/coursework';
import { CHOICES, momentsOf, personOf } from '@/engine/systems/classmates';
import { problemsOf, type Try } from '@/engine/systems/workbook';
import { workPiece } from '@/engine/systems/workpieces';

// --- the life ---------------------------------------------------------------------------------------------------------

const ZONE = 'America/New_York';
const ACTING_III = 'DRAM 303a';
const ACTING_I = 'DRAM 103a/b';
const SEAGULL = 'seagull-4';

const life = (seed: string): Simulation => createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });

/** A new student, the clock's commitments and the school's own calendar cleared (TEST SETUP). */
function student(seed: string): Simulation {
  const sim = life(seed);
  for (const item of sim.universe.scheduled) if (item.status === 'pending' && (item.requiresPlayer || item.kind.startsWith('school.'))) sim.timeline.cancel(item.id, sim.now);
  // TEST SETUP (from 2026-10-16): the abilities a step reads at 50, where each speeds it by exactly 1 (`stepSpeed`), the
  // examples' "your focus and memory at 50". The steps grow them a few hundredths over an example, which moves no figure said.
  Object.assign(attributesOf(sim, sim.player), { focus: 50, imagination: 50, adaptability: 50 });
  sim.player.craft!.memorization = 50;
  return sim;
}

/** TEST SETUP: readiness at 80, a focus of 1 at any hour for an even nature. Energy is what's solved for. */
function at80(sim: Simulation): void {
  const p = sim.player;
  Object.assign(p.wellbeing, { stress: 24, sleepDebt: 0, nourishment: 100, morale: 60, hygiene: 80, condition: 100 });
  const rest = readinessParts(p).filter((x) => x.key !== 'energy').reduce((m, x) => m * x.factor, 1);
  p.wellbeing.energy = ((0.8 * 1.35) / rest - 0.45) / 0.7 * 100;
  expect(readiness(p)).toBeCloseTo(80, 9);
  expect(focusAt(sim, p, sim.now)).toBeCloseTo(1, 9);
}

const clock = (month: number, day: number, hour: number, minute = 0) => instantFromZoned({ year: 2026, month, day, hour, minute }, ZONE);
const dayKey = (sim: Simulation): string => { const p = zonedParts(sim.now, ZONE); return `${p.year}-${String(p.month).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`; };
const schoolDate = (key: string) => { const [year, month, day] = key.split('-').map(Number); return { year: year!, month: month!, day: day! }; };

/** TEST SETUP: a piece of coursework put on the record, as `setWork` would set it, every part at nothing. */
function piece(sim: Simulation, id: string, over: Partial<Assignment> = {}): Assignment {
  const a: Assignment = {
    id, course: ACTING_III, template: 'scene-study', term: 0, setOn: dayKey(sim), dueOn: '2026-09-07', sceneId: SEAGULL, role: 0, partner: 0,
    prep: Object.fromEntries(PREP_DIMS.map((d) => [d, 0])) as Assignment['prep'], answers: {}, steps: {}, practicedOn: {}, trained: 0, rehearsals: [], status: 'open', ...over,
  };
  courseworkOf(sim, sim.player)!.assignments.push(a);
  return a;
}

/** The example's own conditions, read from the life, not set: an even nature, and a kind of play and material new to you. */
function evenAndNew(sim: Simulation, a: Assignment): void {
  const p = sim.player;
  for (const knob of ['readsAround', 'drills', 'skims', 'revises', 'morning', 'evening', 'bondWarmth', 'bondWound'] as const) expect(personalityOf(p, knob), knob).toBe(1);
  expect(genreSpeed(p, genresOfPlay(SCENES.find((s) => s.id === a.sceneId)?.play))).toBe(1);
  expect(featureSpeed(p, materialOf(a.sceneId))).toBe(1);
}

function go<T>(sim: Simulation, kind: string, payload: Record<string, unknown>): T {
  const r = sim.execute<T>({ kind, payload });
  expect(r.ok, `${kind}: ${r.error}`).toBe(true);
  return r.value as T;
}

/** A step of preparation at readiness 80. */
const step = (sim: Simulation, a: Assignment, activity: string) => { at80(sim); return go<{ moved: number; minutes: number }>(sim, 'school.prepare', { assignmentId: a.id, activity }); };

// --- the words --------------------------------------------------------------------------------------------------------

const example = (id: string) => GUIDE_BY_ID[id]!.example;
const WORDS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const wordNum = (w: string): number => (w === 'once' ? 1 : w === 'twice' ? 2 : WORDS.indexOf(w.toLowerCase()));
/** The figures a sentence states, by a pattern of its own words. */
function said(text: string, pattern: RegExp): string[] {
  const m = text.match(pattern);
  expect(m, `“${pattern.source}” in “${text}”`).not.toBeNull();
  return m!.slice(1);
}
const figure = (text: string, pattern: RegExp, i = 0) => Number(said(text, pattern)[i]);
const pct = (x: number) => Math.round(x * 100);
/** A span the guide writes as "8 hours and 35 minutes", in minutes. */
function spanOf(text: string): number {
  const m = text.match(/(?:(\d+) hours?)?(?: and )?(?:(\d+) minutes?)? in all/);
  expect(m, text).not.toBeNull();
  return Number(m![1] ?? 0) * 60 + Number(m![2] ?? 0);
}

// --- the examples, each a play on a save of its own -------------------------------------------------------------------

function playPrepare() {
  const sim = student('guide-cw-prepare');
  const a = piece(sim, 'guide-prepare', { objective: 'lines' });
  evenAndNew(sim, a);
  const p = sim.player;
  const t0 = sim.now;
  const minutes: Record<string, number[]> = {};
  // What each Learn Lines grows the skill it trains, which is the memory it practices (`abilityOf`).
  const grew: number[] = [];
  for (const [activity, n] of [['read', 2], ['learn', 3], ['rehearse', 2]] as const) {
    for (let i = 0; i < n; i += 1) {
      const before = abilityOf(sim, p, 'memory');
      (minutes[activity] ??= []).push(step(sim, a, activity).minutes);
      if (activity === 'learn') grew.push(abilityOf(sim, p, 'memory') - before);
    }
  }
  const elapsed = (sim.now - t0) / 60_000;
  const trained = a.trained;
  const prep = { ...a.prep };
  // A fourth Learn Lines: the lines move, and memory grows by the practice alone.
  const before = abilityOf(sim, p, 'memory');
  const fourth = step(sim, a, 'learn');
  return { sim, a, elapsed, minutes, prep, trained, grew, fourth, fourthGrew: abilityOf(sim, p, 'memory') - before, trainedAfterFour: a.trained, skill: p.craft!.memorization, memory: abilityOf(sim, p, 'memory') };
}

function playTable() {
  const sim = student('guide-cw-table');
  const a = piece(sim, 'guide-table');
  evenAndNew(sim, a);
  step(sim, a, 'read');
  const qs = questionsFor(a);
  const odd = qs.find(({ options }) => options.some((o) => !o.supported))!;
  const t0 = sim.now;
  for (const { q, options } of qs) go(sim, 'school.choose', { assignmentId: a.id, question: q.id, option: options.find((o) => o.supported === (q.id !== odd.q.id))!.id });
  const answered = { minutes: (sim.now - t0) / 60_000, table: preparedParts(sim.player, a, dayKey(sim)).interpretation! };
  const t1 = sim.now;
  go(sim, 'school.choose', { assignmentId: a.id, question: odd.q.id, option: odd.options.find((o) => o.supported)!.id });
  const changed = { minutes: (sim.now - t1) / 60_000, table: preparedParts(sim.player, a, dayKey(sim)).interpretation! };
  // Heightened Text Scene: read once, Scan The Verse as often as the example says, then the same answers. TEST SETUP:
  // the verse scene put on the record. Scanned once until the verifier of 2026-10-12, when its figures sat on a half
  // percent (57.5% and 67.5%) and agreed with the guide only by the same float.
  const t = templateById('classical-scene')!;
  const verse = SCENES.find((s) => s.language === 'verse' && s.tradition !== 'greek')!;
  const v = piece(sim, 'guide-table-verse', { course: 'DRAM 203a/b', template: t.id, sceneId: verse.id });
  evenAndNew(sim, v);
  step(sim, v, 'read');
  const scans = wordNum(said(example('coursework.table').result, /with Scan The Verse done (\w+),/)[0]!);
  let scanned = 0;
  for (let i = 0; i < scans; i += 1) scanned += step(sim, v, 'scan').moved;
  const vqs = questionsFor(v);
  const vodd = vqs.find(({ options }) => options.some((o) => !o.supported))!;
  for (const { q, options } of vqs) go(sim, 'school.choose', { assignmentId: v.id, question: q.id, option: options.find((o) => o.supported === (q.id !== vodd.q.id))!.id });
  const verseFour = preparedParts(sim.player, v, dayKey(sim)).interpretation!;
  go(sim, 'school.choose', { assignmentId: v.id, question: vodd.q.id, option: vodd.options.find((o) => o.supported)!.id });
  return { sim, questions: qs.length, answered, changed, scanned, verseFour, verseAll: preparedParts(sim.player, v, dayKey(sim)).interpretation! };
}

function playPlaying() {
  const sim = student('guide-cw-playing');
  const a = piece(sim, 'guide-playing');
  evenAndNew(sim, a);
  // The lines learned, through the steps that learn them.
  step(sim, a, 'read');
  step(sim, a, 'learn');
  const chosen = go<{ prep: number }>(sim, 'school.choose_playing', { assignmentId: a.id, pace: 'measured' });
  step(sim, a, 'rehearse');
  const once = a.playing!.prep;
  step(sim, a, 'rehearse');
  const twice = a.playing!.prep;
  const changed = go<{ prep: number }>(sim, 'school.choose_playing', { assignmentId: a.id, pace: 'driven' });
  // The mark the showing reads the choice against, as `judgeWork` builds it (`workContext`'s `required.approach`), and
  // the steps of Rehearse Alone it takes to reach it. Until the verifier of 2026-10-12 this loop stopped at
  // `PLAYING.complete`, the constant the guide's figure is built from, so the mark the example names was never read
  // from the engine.
  const required = workContext(a, {}, {}).required.approach!;
  let more = 0;
  let beforeLast = a.playing!.prep;
  while (a.playing!.prep < required && more < 30) { beforeLast = a.playing!.prep; step(sim, a, 'rehearse'); more += 1; }
  // What the showing makes of the choice at a figure, with every other part complete and every answer supported, so
  // the choice is the only part that can be short: each dimension's preparation as the judgement reads it.
  const judged = (prep: number) => judgeWork(sim, sim.player, {
    ...a,
    prep: Object.fromEntries(PREP_DIMS.map((d) => [d, 1])) as Assignment['prep'],
    answers: Object.fromEntries(questionsFor(a).map(({ q, options }) => [q.id, options.find((o) => o.supported)!.id])),
    playing: { ...a.playing!, prep },
  }, dayKey(sim), sim.now, 'guide:playing').dimensions.map((d) => d.prepared);
  const end = a.playing!.prep;
  return { sim, a, start: chosen.prep, once, twice, kept: changed.prep, side: a.playing!.pace, more, end, required, judged: { short: judged(beforeLast), end: judged(end), full: judged(1) } };
}

function playFeedback() {
  const sim = student('guide-cw-feedback');
  const text = example('coursework.feedback');
  const p = sim.player;
  // Acting I's meetings: the first two from the start of classes, the second the revision's.
  const meetings = meetingsFrom(ACTING_I, { year: 2026, month: 8, day: 31 }, p.school);
  const a = piece(sim, 'guide-feedback', { course: ACTING_I, dueOn: meetings[0]!, objective: 'lines' });
  evenAndNew(sim, a);
  // TEST SETUP: the parts it's shown with, as the example states them; the table work by its answers, at the table.
  const t = templateById('scene-study')!;
  const at = (label: string) => figure(text.setup, new RegExp(`${label} at (\\d+)%`)) / 100;
  for (const d of ['familiarity', 'memorization', 'rehearsal', 'partner'] as const) a.prep[d] = at(t.dims[d]!.label);
  const table = at(t.dims.interpretation!.label);
  const qs = questionsFor(a);
  qs.slice(0, Math.round(table * qs.length)).forEach(({ q, options }) => go(sim, 'school.choose', { assignmentId: a.id, question: q.id, option: options.find((o) => o.supported)!.id }));
  const shown = preparedParts(p, a, a.dueOn);
  // Shown at the meeting it's due.
  sim.advanceTo(instantFromZoned({ ...schoolDate(a.dueOn), hour: 9, minute: 0 }, ZONE));
  at80(sim);
  const first = meetingWeight(sim, p, ACTING_I, schoolDate(a.dueOn), sim.now, true, false);
  const feedback = { ...a.feedback! };
  const status = a.status;
  const refusedUnread = sim.execute({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: 'revise' } }).error;
  go(sim, 'school.read_feedback', { assignmentId: a.id });
  step(sim, a, 'revise');
  step(sim, a, 'revise');
  const worked = a.prep.revision;
  const lines = a.prep.memorization;
  // The note's work as the showing again will read it (`noteTaken`), at the mark the example says it passes and half a
  // point under, the rest of the piece as it stands: read before that showing gives a note of its own.
  const past = figure(text.result, /past (\d+)%/) / 100;
  const takenAt = (revision: number) => noteTaken(p, { ...a, prep: { ...a.prep, revision } }, a.revision!.dueOn);
  const mark = { at: takenAt(past), under: takenAt(past - 0.005) };
  // Shown again at the next meeting.
  sim.advanceTo(instantFromZoned({ ...schoolDate(a.revision!.dueOn), hour: 9, minute: 0 }, ZONE));
  at80(sim);
  const again = meetingWeight(sim, p, ACTING_I, schoolDate(a.revision!.dueOn), sim.now, true, false);
  return { sim, a, meetings, shown, first, feedback, status, refusedUnread, worked, lines, mark, again, applied: a.revision!.applied };
}

/** The setup another way at a note asks, and the way chosen. */
function approached(kind: 'drill' | 'smaller') {
  const sim = student(`guide-cw-approach-${kind}`);
  const text = example('coursework.approach');
  const a = piece(sim, `guide-approach-${kind}`, { dueOn: '2026-08-28' });
  evenAndNew(sim, a);
  // TEST SETUP: the note named so often and still open, and the lines where the example has them.
  const given = wordNum(said(text.setup, /named (\w+) times and still open/)[0]!);
  notesOf(courseworkOf(sim, sim.player)!).push({ key: 'dim:memorization', status: 'open', first: '2026-05-01', last: '2026-08-01', given, level: 0.4, history: [] });
  a.prep.memorization = figure(text.setup, /with the lines at (\d+)%/) / 100;
  go(sim, 'school.approach', { assignmentId: a.id, kind });
  return { sim, a };
}

function playSmaller() {
  const { sim, a } = approached('smaller');
  return { sim, a, reads: preparedParts(sim.player, a, dayKey(sim)).memorization! };
}

function playDrill() {
  const { sim, a } = approached('drill');
  // Once a day for three days, a night's sleep between.
  const lines: number[] = [];
  let again: string | undefined;
  for (let d = 0; d < 3; d += 1) {
    if (d) { sim.advanceTo(clock(8, 24 + d - 1, 23)); go(sim, 'life.sleep', { hours: 8 }); }
    step(sim, a, 'drill');
    lines.push(a.prep.memorization);
    if (!d) { at80(sim); again = sim.execute({ kind: 'school.prepare', payload: { assignmentId: a.id, activity: 'drill' } }).error; }
  }
  // A showing then, at nine on the day it's due.
  sim.advanceTo(clock(8, 28, 9));
  at80(sim);
  meetingWeight(sim, sim.player, ACTING_III, schoolDate(a.dueOn), sim.now, true, false);
  const note = notesOf(courseworkOf(sim, sim.player)!).find((n) => n.key === 'dim:memorization')!;
  return { sim, a, lines, again, taken: a.taken ?? [], note: note.status };
}

/** TEST SETUP: every ability and skill full, as tests/ensemble.test.ts makes a mastered student. */
function mastered(sim: Simulation) {
  const p = sim.player;
  for (const k of Object.keys(p.craft!)) (p.craft as Record<string, number>)[k] = 100;
  const at = attributesOf(sim, p) as unknown as Record<string, number>;
  for (const k of Object.keys(at)) at[k] = 100;
  p.wellbeing.fitness = abilityFull(sim, p, 'stamina');
}

/**
 * A Smaller Piece Of It on full work: the band it can be, against the same work with no way chosen, both judged at
 * readiness 80. Until the verifier of 2026-10-12 the energy was then set to 95, unmarked; measured that day, both bands
 * came out the same without it (Working and Exceptional, at readiness 80 and at 91.8), and the line was taken out.
 */
function playSmallerCap() {
  const { sim } = playSmaller();
  mastered(sim);
  const full = (a: Assignment) => { for (const d of PREP_DIMS) a.prep[d] = 1; for (const { q, options } of questionsFor(a)) a.answers[q.id] = options.find((o) => o.supported)!.id as never; };
  const cw = courseworkOf(sim, sim.player)!;
  const smaller = cw.assignments.find((x) => x.approach?.kind === 'smaller')!;
  const plain = piece(sim, 'guide-approach-plain');
  full(smaller);
  full(plain);
  at80(sim);
  return { smaller: show(sim, sim.player, smaller, smaller.dueOn, sim.now).band, plain: show(sim, sim.player, plain, plain.dueOn, sim.now).band };
}

/** Partners: two evenings asked for and kept, or the second slept through. */
function playPartners(sleepThroughSecond: boolean) {
  // The same life both ways, so the first evening is the same evening.
  const sim = student('guide-cw-partners');
  const text = example('coursework.partners');
  const p = sim.player;
  const a = piece(sim, 'guide-partners', { setOn: '2026-08-24', dueOn: '2026-09-07' });
  evenAndNew(sim, a);
  const mate = p.school!.classmates[a.partner!]!;
  // TEST SETUP: met, at an ordinary drive and the reliability the example gives; trust as a new partner's.
  mateRecord(mate).met = sim.now;
  mate.drive = 1;
  mateRecord(mate).reliability = figure(text.setup, /(\d+)% reliable/) / 100;
  const trust0 = trustOf(mate);
  const evenings = [clock(8, 25, 19), clock(8, 27, 19)];
  const parts: number[] = [];
  const trusts: number[] = [];
  const statuses: string[] = [];
  for (const [i, when] of evenings.entries()) {
    const asked = go<{ accepted: boolean; reason?: string; rehearsalId?: string }>(sim, 'school.ask_partner', { assignmentId: a.id, at: when });
    expect(asked.accepted, asked.reason).toBe(true);
    if (i === 1 && sleepThroughSecond) {
      sim.advanceTo(when - 60 * 60_000);
      go(sim, 'life.sleep', { hours: 8 });
    } else {
      sim.advanceTo(when - 1);
      at80(sim);
      sim.advanceTo(when + (WORK.rehearsal.minutes + 1) * 60_000);
    }
    statuses.push(a.rehearsals.find((r) => r.id === asked.rehearsalId)!.status);
    parts.push(a.prep.partner);
    trusts.push(trustOf(mate));
  }
  if (sleepThroughSecond) return { sim, a, trust0, parts, trusts, statuses };
  // Shown at the meeting it's due: the preparation the scene together reads, and theirs alone.
  sim.advanceTo(instantFromZoned({ ...schoolDate(a.dueOn), hour: 9, minute: 0 }, ZONE));
  at80(sim);
  const together = partnerReadOf(sim, p, a, a.dueOn)!.prep;
  const alone = partnerPrepOf(p, { ...a, prep: { ...a.prep, partner: 0 } }, a.dueOn);
  meetingWeight(sim, p, ACTING_III, schoolDate(a.dueOn), sim.now, true, false);
  return { sim, a, trust0, parts, trusts, statuses, together, alone, shown: a.shown };
}

function playClass() {
  const sim = student('guide-cw-class');
  const p = sim.player;
  const a = piece(sim, 'guide-class');
  evenAndNew(sim, a);
  const mate = p.school!.classmates[a.partner!]!;
  mateRecord(mate).met = sim.now; // TEST SETUP: met, at Meeting Your Class.
  const trust0 = trustOf(mate);
  const ask = (when: number) => go<{ accepted: boolean; reason?: string; rehearsalId?: string }>(sim, 'school.ask_partner', { assignmentId: a.id, at: when });
  // A rehearsal slept through.
  const first = ask(clock(8, 25, 19));
  expect(first.accepted, first.reason).toBe(true);
  sim.advanceTo(clock(8, 25, 18));
  go(sim, 'life.sleep', { hours: 8 });
  const missed = { status: a.rehearsals.find((r) => r.id === first.rehearsalId)!.status, trust: trustOf(mate) };
  // The next one, called off the same afternoon.
  sim.advanceTo(clock(8, 26, 10));
  const second = ask(clock(8, 26, 19));
  expect(second.accepted, second.reason).toBe(true);
  sim.advanceTo(clock(8, 26, 14));
  const late = go<{ late: boolean }>(sim, 'school.cancel_rehearsal', { assignmentId: a.id, rehearsalId: second.rehearsalId }).late;
  const afterLate = trustOf(mate);
  // TEST SETUP: in class they set a boundary, the moment put on the record as `classMoment` builds it (which class day
  // brings a moment, and which kind, is the draw's).
  const moment = { id: 'guide-boundary', mate: a.partner!, kind: 'boundary' as const, at: sim.now, until: sim.now + 22 * 3_600_000, status: 'open' as const, text: 'They’ll only rehearse with you if you ask a day ahead.' };
  momentsOf(courseworkOf(sim, p)!).push(moment);
  go(sim, 'school.respond', { momentId: moment.id, choice: CHOICES.boundary[0]!.id });
  const accepted = trustOf(mate);
  const bond0 = mate.bond ?? 0;
  go(sim, 'school.make_amends', { mate: a.partner });
  const amended = { trust: trustOf(mate), bond: (mate.bond ?? 0) - bond0 };
  // Until two are kept, an ask less than a day ahead is a no: this evening, five hours on.
  const soon = ask(sim.now + 5 * 3_600_000);
  // Evenings asked for two days ahead, kept where they come, as many as the example says lift it.
  const lifts = wordNum(said(example('coursework.class').result, /stays until (\w+) rehearsals are kept/)[0]!);
  const kept: number[] = [];
  const boundaryAfterKept: boolean[] = [];
  let when = clock(8, 28, 19);
  for (let n = 0; kept.length < lifts && n < 4 * lifts; n += 1, when += 2 * 86_400_000) {
    const r = ask(when);
    if (!r.accepted) continue;
    sim.advanceTo(when - 1);
    at80(sim);
    sim.advanceTo(when + (WORK.rehearsal.minutes + 1) * 60_000);
    if (a.rehearsals.find((x) => x.id === r.rehearsalId)!.status === 'kept') { kept.push(when); boundaryAfterKept.push(Boolean(personOf(mate).boundary)); }
  }
  // Lifted: the next evening, less than a day ahead.
  const soonAfter = ask(kept.at(-1)! + 86_400_000);
  return { sim, trust0, missed, late, afterLate, accepted, amended, soon, lifts, kept, boundaryAfterKept, soonAfter };
}

function playWorkbook() {
  const sim = student('guide-cw-workbook');
  const text = example('coursework.workbook');
  const a = piece(sim, 'guide-workbook');
  evenAndNew(sim, a);
  // TEST SETUP: the lines learned and the rehearsal where the example has it.
  a.prep.memorization = 1;
  a.prep.rehearsal = figure(text.setup, /Rehearsal at (\d+)%/) / 100;
  const key = `assignment:${a.id}`;
  const turn = problemsOf(workPiece(sim, sim.player, key)!).find((x) => x.kind === 'turn')!;
  go(sim, 'work.identify', { piece: key, problem: turn.id });
  const t0 = sim.now;
  const tries: Try[] = [];
  const parts: number[] = [];
  while (a.book?.problem && tries.length < 10) {
    at80(sim);
    tries.push(go<Try>(sim, 'work.try', { piece: key, adjustment: 'work-beat' }));
    parts.push(forecastWork(sim, sim.player, a, dayKey(sim)).piece!.segments[turn.segment!]!.part);
  }
  const stillOffered = problemsOf(workPiece(sim, sim.player, key)!).some((x) => x.id === turn.id);
  const showing = judgeWork(sim, sim.player, a, dayKey(sim), sim.now, 'guide:workbook').piece!.segments;
  return { sim, a, turn, tries, parts, minutes: (sim.now - t0) / 60_000, stillOffered, showing, segments: workPiece(sim, sim.player, key)!.spec().segments };
}

// --- the tests --------------------------------------------------------------------------------------------------------

describe('Preparing Coursework, played', () => {
  it('takes the time it says, moves each part to the figure it says, and trains the skill on three steps only', () => {
    const r = playPrepare();
    const { setup, steps, result } = example('coursework.prepare');
    const t = templateById('scene-study')!;
    expect(setup).toMatch(/you play Nina, a long scene, with Lines put first/);
    // Each step's minutes, as the steps say them; the whole, as the result does.
    for (const [i, activity] of (['read', 'learn', 'rehearse'] as const).entries()) for (const m of r.minutes[activity]!) expect(m).toBe(figure(steps[i]!, /, (\d+) minutes each/));
    expect(r.elapsed).toBe(spanOf(result));
    expect(pct(r.prep.familiarity)).toBe(figure(result, new RegExp(`${t.dims.familiarity!.label} reads (\\d+)%`)));
    expect(pct(r.prep.memorization)).toBe(figure(result, new RegExp(`${t.dims.memorization!.label} (\\d+)% and`)));
    expect(pct(r.prep.rehearsal)).toBe(figure(result, new RegExp(`and ${t.dims.rehearsal!.label} (\\d+)%`)));
    // Put first: the Weighs, against its own, and the dimensions that read the lines leaning by the figure said.
    const own = { ...r.a, objective: undefined };
    expect(pct(weightsOf(r.a).memorization!)).toBe(figure(result, /Note Priority under Lines reads (\d+)%/));
    expect(pct(weightsOf(own).memorization!)).toBe(figure(result, /in place of its own (\d+)%/));
    const lean = Number(said(result, /count ([\d.]+) times as much/)[0]);
    const task = TASK_PROFILES[TEMPLATE_TASK['scene-study'] ?? 'scene']!;
    const first = workContext(r.a, {}, {}).lean!;
    const none = workContext(own, {}, {}).lean!;
    const reads = (Object.entries(task.dims) as [Dimension, { prep?: readonly string[] }][]).filter(([, s]) => (s.prep ?? []).includes('memorization')).map(([d]) => d);
    expect(reads.length).toBeGreaterThan(0);
    for (const d of Object.keys(task.dims) as Dimension[]) expect((first[d] ?? 1) / (none[d] ?? 1), d).toBeCloseTo(reads.includes(d) ? lean : 1, 9);
    // The three Learn Lines were the steps that train; the fourth moves the lines and practices memory, the skill they
    // train (one figure, `abilityOf`), with no training on top. Until the verifying play of 2026-10-12 the example said
    // it trained the skill no further, and the skill grew all the same: by the practice, under half what the third grew
    // by its training and practice together (a tenth, measured then).
    // Until the verifier of 2026-10-12 a line here asked `r.trained` to be `WORK.trainingSteps` too, which the line
    // before had settled, the text's figure being that constant in words.
    expect(r.trained).toBe(wordNum(said(result, /piece’s (\w+) steps that train a skill/)[0]!));
    expect(r.trainedAfterFour).toBe(r.trained);
    expect(result).toMatch(/a fourth moves the lines and practices your memory, the skill they train/);
    expect(r.memory).toBe(r.skill);
    expect(r.fourth.moved).toBeGreaterThan(0);
    expect(r.fourthGrew).toBeGreaterThan(0);
    expect(r.fourthGrew).toBeLessThan(r.grew[2]! / 2);
  });
});

describe('Table Work, played', () => {
  it('reads the answers the text supports, ten minutes a question, and half the scansion in verse', () => {
    const r = playTable();
    const { setup, steps, result } = example('coursework.table');
    expect(setup).toMatch(/the scene read once/);
    expect(r.questions).toBe(wordNum(said(steps[0]!, /Answer all (\w+) questions/)[0]!));
    expect(r.answered.minutes).toBe(figure(result, /The answers take (\d+) minutes/));
    expect(pct(r.answered.table)).toBe(figure(result, /Table Work reads (\d+)%/));
    expect(r.changed.minutes).toBe(figure(result, /The change takes (\d+) more/));
    expect(pct(r.changed.table)).toBe(figure(result, /brings it to (\d+)%/));
    expect(r.scanned).toBeGreaterThan(0);
    expect(pct(r.verseFour)).toBe(figure(result, /would read (\d+)%, then (\d+)%/, 0));
    expect(pct(r.verseAll)).toBe(figure(result, /would read (\d+)%, then (\d+)%/, 1));
  });
});

describe('How You’ll Play A Scene, played', () => {
  it('rehearses a choice in by its share, keeps half of it on a change, and completes it in the steps it says', () => {
    const r = playPlaying();
    const { steps, result } = example('coursework.playing');
    expect(steps[0]).toMatch(/Choose Measured on Pace/);
    expect(steps[2]).toMatch(/Change to Driven/);
    expect(r.side).toBe('driven');
    expect(pct(r.start)).toBe(figure(result, /starts at (\d+)%/));
    expect(pct(r.once)).toBe(figure(result, /moves it (\d+)% of what’s left/));
    expect(pct(r.twice)).toBe(figure(result, /two bring it to (\d+)%/));
    expect(pct(r.kept)).toBe(figure(result, /The change keeps (\d+)%/));
    // Until the verifying play of 2026-10-12 it said they brought it "to 90%", the mark it passes.
    const [more, to, complete] = said(result, /from there (\w+) more steps of Rehearse Alone bring it to (\d+)%, past the (\d+)% that completes it in /);
    expect(r.more).toBe(wordNum(more!));
    expect(pct(r.end)).toBe(Number(to));
    // The mark that completes it, read from the engine: what the showing asks of the choice, and what it makes of it.
    // Past the mark every dimension reads it as fully rehearsed in; a step short of it, one at least reads it short.
    // Until the verifier of 2026-10-12 this compared `PLAYING.complete` with the text built from it.
    expect(pct(r.required)).toBe(Number(complete));
    expect(r.end).toBeGreaterThanOrEqual(r.required);
    expect(r.judged.full.every((x) => x === 1)).toBe(true);
    expect(r.judged.end).toEqual(r.judged.full);
    expect(r.judged.short.some((x) => x < 1)).toBe(true);
  });
});

describe('Feedback And Your Notes, played', () => {
  it('names the part short by the most of its weight, in its own words, and takes the note on the work done', () => {
    const r = playFeedback();
    const { result } = example('coursework.feedback');
    // Shown with the parts it was given at.
    expect(pct(r.shown.interpretation!)).toBe(figure(example('coursework.feedback').setup, /Table Work at (\d+)%/));
    expect(r.feedback.focus).toEqual({ kind: 'dim', dim: 'memorization' });
    // The note the guide quotes, said after one sentence on what it was (from 2026-10-20, brief 16's `showingWords`) and
    // before the steps that work on it; until then the note was the whole of the feedback.
    const quoted = said(result, /the note is on it: “(.+?)” Two of/)[0]!;
    expect(r.feedback.text).toMatch(new RegExp(`^[^.]+\\. ${quoted.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} To work on it: Learn Lines\\.$`));
    expect(r.status).toBe('revising');
    expect(r.a.revision!.dueOn).toBe(r.meetings[1]);
    // Marked read, the note worked twice.
    expect(r.refusedUnread).toBe('There’s new feedback on this piece. Read it, then press Mark As Read.');
    expect(pct(r.worked)).toBe(figure(result, /bring the note’s work to (\d+)%/));
    // The mark the note's work has to pass, read from the engine (`noteTaken`, as the showing again asks it): with the
    // lines where they were shown, the work at the mark takes the note and the work half a point under it doesn't.
    // Until the verifier of 2026-10-12 this compared `WORK.revision.worked` with the text built from it.
    expect(r.mark).toEqual({ at: true, under: false });
    expect(r.worked).toBeGreaterThanOrEqual(WORK.revision.worked);
    // Taken wherever the part stands: the lines as they were shown.
    expect(r.lines).toBe(r.shown.memorization);
    expect(r.applied).toBe(true);
    expect(pct(r.again)).toBe(figure(result, /grows the course’s skills (\d+)% of a usual one/));
  });
});

describe('Another Way At A Note, played', () => {
  it('moves the lines by the drill once a day, takes the note at a showing past enough, and a smaller piece reads larger and caps the band', () => {
    const r = playDrill();
    const { steps, result } = example('coursework.approach');
    expect(steps[1]).toMatch(/once a day for three days/);
    expect(r.again).toBe('You’ve done this today. It builds over several days, not in one long session.');
    expect(r.lines.map(pct)).toEqual(said(result, /The lines go to (\d+)%, then (\d+)%, then (\d+)%/).map(Number));
    expect(r.lines[2]).toBeGreaterThanOrEqual(figure(result, /past (\d+)%/) / 100);
    expect(r.taken).toContain('dim:memorization');
    expect(r.note).toBe('resolved');
    const s = playSmaller();
    expect(pct(s.reads)).toBe(figure(result, /would read as (\d+)%/));
    const cap = playSmallerCap();
    expect(cap.plain).toBe('exceptional');
    expect(cap.smaller).toBe('working');
  });
});

describe('Rehearsing With A Partner, played', () => {
  it('moves your partner part and their trust by each evening kept, and the scene together reads their preparation', () => {
    const r = playPartners(false);
    const { setup, result } = example('coursework.partners');
    expect(r.trust0).toBe(figure(setup, /trusting you at (\d+)/));
    expect(r.statuses).toEqual(['kept', 'kept']);
    expect(r.parts.map(pct)).toEqual(said(result, /Your partner part reaches (\d+)%, then (\d+)%/).map(Number));
    expect(r.trusts).toEqual(said(result, /their trust (\d+), then (\d+)/).map(Number));
    expect(pct(r.alone!)).toBe(figure(result, /Alone they’ve prepared (\d+)%/));
    expect(pct(r.together!)).toBe(figure(result, /with the evenings together, (\d+)%/));
    expect(r.shown?.together).toBeDefined();
    // The second slept through.
    const slept = playPartners(true);
    expect(slept.statuses).toEqual(['kept', 'missedByYou']);
    expect(slept.trusts[1]).toBe(figure(result, /trust would stand at (\d+)/));
    expect(pct(slept.parts[1]!)).toBe(figure(result, /your partner part at (\d+)%/));
  });
});

describe('Your Class, played', () => {
  it('costs trust for the rehearsal missed and the one called off late, gives some back for the boundary and the amends, and holds the boundary for two kept', () => {
    const r = playClass();
    const { setup, steps, result } = example('coursework.class');
    expect(r.trust0).toBe(figure(setup, /trusts you at (\d+)/));
    expect(steps[0]).toContain(CHOICES.boundary[0]!.label);
    expect(r.missed.status).toBe('missedByYou');
    expect(r.late).toBe(true);
    expect([r.missed.trust, r.afterLate]).toEqual(said(result, /falls to (\d+), then (\d+)/).map(Number));
    expect(r.accepted).toBe(figure(result, /accepting the boundary brings it to (\d+)/));
    expect(r.amended.trust).toBe(figure(result, /making amends to (\d+)/));
    expect(r.amended.bond).toBe(figure(result, /the bond (\d+) closer/));
    expect(r.soon.accepted).toBe(false);
    expect(r.soon.reason).toMatch(/wants a day’s notice after last time\. Ask for an evening at least a day ahead\./);
    expect(r.lifts).toBe(wordNum(said(result, /stays until (\w+) rehearsals are kept/)[0]!));
    expect(r.kept).toHaveLength(r.lifts);
    expect(r.boundaryAfterKept).toEqual([...Array.from({ length: r.lifts - 1 }, () => true), false]);
    expect(r.soonAfter.accepted, r.soonAfter.reason).toBe(true);
  });
});

describe('Working A Problem Through, played', () => {
  it('names the turn, works it slowly until it’s secure, and the problem leaves the list by itself', () => {
    const r = playWorkbook();
    const { setup, steps, result } = example('coursework.workbook');
    // From evaluation-10 the setup counts the parts by its tones and its turns, where it counted them in its tones.
    expect(r.segments).toHaveLength(wordNum(said(setup, /: (\w+) parts by its tones and its turns/)[0]!));
    const [label, from, asks] = said(steps[0]!, /shows “(.+?)”: it’s at (\d+)% of the (\d+)% it needs/);
    expect(r.turn.label).toBe(label);
    expect(r.turn.why).toContain(`it’s at ${from}% of the ${asks}% it needs`);
    expect(r.tries).toHaveLength(wordNum(said(steps[1]!, /, (\w+)(?: times)?\.$/)[0]!));
    const middle = r.segments[r.turn.segment!]!.label;
    expect(r.parts.map(pct)).toEqual(said(result, new RegExp(`${middle}’s own rehearsal reads ([\\d%, then]+?): past`))[0]!.split(', then ').map((x) => Number(x.replace('%', ''))));
    expect(r.parts.at(-1)!).toBeGreaterThanOrEqual(Number(asks) / 100 - 0.005);
    expect(r.minutes).toBe(spanOf(result));
    expect(r.a.book!.problem).toBeUndefined();
    expect(r.stillOffered).toBe(false);
    for (const t of r.tries) { expect(t.verdict).toBe('kept'); expect(t.after).toBeGreaterThan(t.before); }
    // The showing reads the turn at its last figure, the rest still where the rehearsal was.
    const [turnAt, rest] = said(result, /the showing reads .+? at (\d+)%, the rest of the scene still at (\d+)%/).map(Number);
    r.showing.forEach((s, i) => expect(pct(s.part), s.label).toBe(i === r.turn.segment ? turnAt : rest));
  });
});

describe('the examples are played apart from any life', () => {
  it('leaves a live save byte for byte as it was', () => {
    const live = life('guide-cw-live');
    live.advanceTo(live.now + 30 * 3_600_000);
    const before = serialise(live.universe);
    playPrepare(); playTable(); playPlaying(); playFeedback(); playDrill(); playSmaller(); playSmallerCap();
    playPartners(false); playPartners(true); playClass(); playWorkbook();
    expect(serialise(live.universe)).toBe(before);
  });
});
