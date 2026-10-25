/**
 * SLATE — working a part the way its production works (from 2026-10-24, the owner's brief 25, Part 8;
 * `docs/verification/career-world-2026-10-23/criteria.md`, Module 5, W1 to W12). Reads `content/workflows.ts`.
 *
 * What a work day is (`stepOf`), the part's scenes and the order they're shot in (`planWork`), a judged day's units each
 * in takes with the player's choices read (`workTheDay`), an unjudged day's work on the part, the voice's strain
 * (`strainOf`), a stunt's risk, revised pages the night before (the `pro.pages` reactor), the day's report kept on the
 * engagement, a recall to loop after the wrap (`afterWrap`, the `pro.loop` session) and a scene cut in the edit
 * (`cutInEdit`). The stage play keeps its own day, worked in `systems/projobs.ts` as before.
 */

import type { Simulation } from '../core/simulation';
import { CommandError } from '../core/simulation';
import type { Person } from '../domain/model';
import { MS_HOUR, addDays, dateKey, formatDate, formatWeekdayDate, instantFromZoned, zonedParts, type Instant } from '../core/time';
import { countWords, plural, spokenList } from '../core/text';
import { TASK_PROFILES, EVALUATION, type Dimension, type TaskProfile } from '../content/tasks';
import { PROJECTS, RATES, minimumOn, projectById, type ProjectTemplate } from '../content/careerwork';
import {
  AFTER_WRAP, CONSENT, FORMATS, PAGES, PROMO, SCRIPT, STUNT, VOICE, WORKFLOWS, decisionsOf, type ChoiceEffect, type Decision, type DecisionId,
  type FormatSpec, type JudgedStep, type StepId, type WorkflowSpec,
} from '../content/workflows';
import { ensurePro, noteEvent, type Engagement, type PartPrep, type ProPayment, type WorkReport, type WorkUnit } from './pro';
import { bandOfQuality, evaluate, recordWork, type EvalContext, type Evaluation } from './evaluation';
import type { Band } from './coursework';
import { BRIEF } from './briefs';
import { abilityOf, nerves } from './attributes';
import { conditionAt } from './school';
import { healthOf } from './health';
import { mayHurt } from './injury';
import { workAuthorizedFor } from './permission';
import { schedulePay } from './propay';

const NY = 'America/New_York';
const MIN = 60_000;
const r1 = (x: number) => Math.round(x * 10) / 10;
const r3 = (x: number) => Math.round(x * 1000) / 1000;
const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));

export const formatOf = (t: Pick<ProjectTemplate, 'format'>): FormatSpec => FORMATS[t.format];
export const workflowOf = (t: Pick<ProjectTemplate, 'format'>): WorkflowSpec => WORKFLOWS[FORMATS[t.format].workflow];

/** The workflows that record the voice alone, with no picture of the actor: the booth, the dub and narration. */
export const voiceOnly = (t: Pick<ProjectTemplate, 'format'>): boolean => ['voice', 'dubbing', 'narration'].includes(workflowOf(t).id);

/** The session a recall to loop is (`afterWrap`). */
export const LOOP_KIND = 'pro.loop';
/** An anthology's invitation into its next story (`afterWrap`). */
export const INVITE_KIND = 'pro.invite';
/** A reshoot day or a voice pickup session after the wrap (`afterWrap`, from 2026-10-25, brief 27's K5). */
export const FURTHER_KIND = 'pro.reshoot';
/** A promotional film for a release (`PROMO`, from 2026-10-25, brief 27's loop 34). */
export const PROMO_KIND = 'pro.promo';

// ---------------------------------------------------------------------------------------------------------------------
// The days
// ---------------------------------------------------------------------------------------------------------------------

/** A musical's rehearsal days by week, the first two weeks the songs and the numbers, staging after (the game's). */
const MUSICAL_WEEKS: readonly (readonly StepId[])[] = [
  ['music', 'music', 'choreography', 'music', 'choreography'],
  ['choreography', 'music', 'rehearsal', 'choreography', 'rehearsal'],
];
/** A multicamera episode's week, Monday to Friday. */
const MULTICAM_WEEK: readonly StepId[] = ['table-read', 'blocking', 'blocking', 'blocking', 'tape-night'];

/** What a booked day is, by where it falls in the work's schedule. */
export function stepOf(t: ProjectTemplate, index: number): StepId {
  const flow = workflowOf(t).id;
  const s = t.schedule;
  if (flow === 'stage' || flow === 'musical') {
    const rehearsals = s.kind === 'run' ? s.rehearsalWeeks * 5 : 0;
    if (index >= rehearsals) return 'performance';
    return flow === 'musical' ? MUSICAL_WEEKS[Math.floor(index / 5)]?.[index % 5] ?? 'rehearsal' : 'rehearsal';
  }
  if (flow === 'multicam') return MULTICAM_WEEK[index % 5]!;
  if (flow === 'voice') return 'booth';
  if (flow === 'dubbing') return 'dub';
  if (flow === 'narration') return 'narration';
  if (flow === 'capture') return 'capture';
  if (flow === 'reenactment') return 'reenactment';
  if (flow === 'action' && s.kind === 'shoot') {
    const before = s.rehearsalDays ?? 0;
    if (index < before) return 'stunt-rehearsal';
    return s.stuntDays?.includes(index - before) ? 'stunt-day' : 'shoot';
  }
  return 'shoot';
}

/** A day's step as a sentence names it: "a shoot day", "a tape night". */
export const STEP_WORDS: Readonly<Record<StepId, string>> = {
  rehearsal: 'a rehearsal', performance: 'a performance', shoot: 'a shoot day', 'table-read': 'a table read', blocking: 'a rehearsal and camera blocking',
  'tape-night': 'a tape night', booth: 'a recording session', dub: 'a dubbing session', capture: 'a capture day', narration: 'a narration session',
  reenactment: 'a reenactment shoot day', music: 'a music rehearsal', choreography: 'a choreography rehearsal', 'stunt-rehearsal': 'a fight rehearsal',
  'stunt-day': 'a shoot day with stunts', loop: 'a looping session',
};

/** A day's step as its calendar label names it, Title Case. */
export const STEP_LABEL: Readonly<Record<StepId, string>> = {
  rehearsal: 'Rehearsal', performance: 'Performance', shoot: 'Shoot Day', 'table-read': 'Table Read', blocking: 'Rehearsal And Camera Blocking',
  'tape-night': 'Tape Night', booth: 'Recording Session', dub: 'Dubbing Session', capture: 'Capture Day', narration: 'Narration Session',
  reenactment: 'Reenactment Shoot Day', music: 'Music Rehearsal', choreography: 'Choreography', 'stunt-rehearsal': 'Fight Rehearsal',
  'stunt-day': 'Shoot Day With Stunts', loop: 'Looping Session',
};

/** A day's hours: its length less an hour for lunch on a day of six hours or more. */
export const workHoursOf = (d: { from: Instant; to: Instant }): number => { const h = (d.to - d.from) / MS_HOUR; return h >= 6 ? h - 1 : h; };

/**
 * A dub day's pay in days (N13 Schedule A §37): one character alone, any number of synchronized lines, a day (§37.E(1));
 * otherwise a day for up to three characters of up to five synchronized lines each, and a day more for each part of more
 * than five and for each further set of up to three (§37.A).
 */
export function dubDaysOf(characters: readonly { lines: number }[]): number {
  if (characters.length <= 1) return 1;
  const big = characters.filter((c) => c.lines > 5).length;
  const small = characters.length - big;
  return 1 + big + Math.max(0, Math.ceil((small - 3) / 3));
}

/** The days' pay a work day carries: a dub's by §37, every other one day. */
export const payUnitsOf = (t: ProjectTemplate, index: number): number => (t.dub?.[index] ? dubDaysOf(t.dub[index]!) : 1);

// ---------------------------------------------------------------------------------------------------------------------
// The script, and the order it's shot in
// ---------------------------------------------------------------------------------------------------------------------

/**
 * The part's units, made when the work is booked (and for days added later, a further episode's): each judged day's
 * scenes, loops, chapters or sequences, numbered by their place in the script, and the order each day shoots them. A
 * format shot in the story's order keeps it; one shot by location shuffles the work's scenes across its days; a procedural
 * keeps each episode's scenes to its days; a cross-boarded one mixes the episodes' (`FormatSpec.board`). Drawn by the
 * engagement, so a reload makes the same.
 */
export function planWork(sim: Simulation, e: Engagement, t: ProjectTemplate, from = 0): void {
  const flow = workflowOf(t);
  const fmt = formatOf(t);
  if (flow.id === 'stage') return;
  const units = (e.units ??= []);
  const rng = sim.rng('pro.board', workKey(e), from);
  const judged = e.days.map((_, i) => i).filter((i) => i >= from && flow.judged[stepOf(t, i)]);
  const per = (i: number): number => {
    const js = flow.judged[stepOf(t, i)]!;
    if (flow.id === 'dubbing') return js.perDay + Math.max(0, (t.dub?.[i]?.length ?? 1) - 1);
    if (flow.id === 'capture') return js.perDay + (t.others?.[i]?.length ?? 0);
    return stepOf(t, i) === 'shoot' && fmt.scenesPerDay ? fmt.scenesPerDay : js.perDay;
  };
  const count = judged.reduce((n, i) => n + per(i), 0);
  // The script's scene numbers, in the story's order: spread through it from a scene a few in, never two alike.
  const numbers: number[] = [];
  let at = SCRIPT.minimumScene + units.length;
  for (let k = 0; k < count; k += 1) { at += 1 + Math.floor(rng.next() * (SCRIPT.spread / Math.max(1, count))); numbers.push(at); }
  const episodes = t.episodes ?? [];
  const slots = judged.flatMap((i) => Array.from({ length: per(i) }, () => i));
  const order = numbers.map((n, k) => ({ n, k }));
  if (fmt.board === 'episodes') {
    // Each episode's scenes to its own days, shot out of order within it: a procedural's, a network comedy's. Until
    // 2026-10-24 these were dealt across every episode's days, as a location board deals them, so a recurring part's
    // first episode could shoot a scene of its second.
    const byEpisode = new Map<number | undefined, number[]>();
    slots.forEach((day, k) => { const ep = episodeOfLabel(e.days[day]!.label); (byEpisode.get(ep) ?? byEpisode.set(ep, []).get(ep)!).push(k); });
    for (const ks of byEpisode.values()) for (let a = ks.length - 1; a > 0; a -= 1) { const b = Math.floor(rng.next() * (a + 1)); [order[ks[a]!], order[ks[b]!]] = [order[ks[b]!]!, order[ks[a]!]!]; }
  } else if (fmt.board !== 'story') {
    // Shot by location: the story's scenes dealt across the days in an order the script doesn't set.
    for (let k = order.length - 1; k > 0; k -= 1) { const j = Math.floor(rng.next() * (k + 1)); [order[k], order[j]] = [order[j]!, order[k]!]; }
  }
  const seen = new Map<number, number>();
  slots.forEach((day, k) => {
    const pick = order[k]!;
    const place = (seen.get(day) ?? 0) + 1;
    seen.set(day, place);
    const episode = fmt.board === 'cross-boarded' && episodes.length ? episodes[Math.min(episodes.length - 1, Math.floor((pick.k / Math.max(1, count)) * episodes.length))] : episodeOfLabel(e.days[day]!.label);
    // The day's other characters, after its own loops or sequences: a dub's beside the main character, a capture day's.
    const character = flow.id === 'dubbing' && place > flow.judged.dub!.perDay ? t.dub?.[day]?.[place - flow.judged.dub!.perDay]?.character : flow.id === 'capture' && place > flow.judged.capture!.perDay ? t.others?.[day]?.[place - flow.judged.capture!.perDay - 1] : undefined;
    units.push({ id: `u${units.length + 1}`, day, scene: pick.n, order: place, ...(episode !== undefined ? { episode } : {}), ...(character ? { character } : {}), version: 1 });
  });
  // The marked units: each stunt day's stunt, the intimate scene's day, and a voice session's screamed lines, announced
  // before it three times in four (the game's), and otherwise sprung on it (N13 Schedule A §37.C).
  for (const i of judged) {
    const mine = units.filter((u) => u.day === i);
    if (!mine.length) continue;
    const step = stepOf(t, i);
    if (step === 'stunt-day') mine[0]!.stunt = true;
    if (t.intimacy?.day === i) mine[mine.length - 1]!.intimate = true;
    if (step === 'booth' || step === 'dub') {
      const d = stressDrawn(sim, workKey(e), i, mine.length);
      if (d) mine[d.unit]!.stressful = d.announced ? 'announced' : 'unannounced';
    }
  }
}

/**
 * What the work's draws are keyed by: its project and its first day, never the engagement's id, its place in the save's
 * numbering, which an agreement signed or a project added moves (as casting's draw was keyed from 2026-10-23, brief 25's
 * C11). Two lives booked for the same work draw the same scenes and pages.
 */
export const workKey = (e: Pick<Engagement, 'projectId' | 'days'>): string => `${e.projectId}:${e.days[0]?.from ?? 0}`;

/**
 * A session's screamed lines (decider `pro.stress`): in about a third of the booth's and the dub's sessions, on one of its
 * units, announced before the session three times in four (the game's).
 */
export function stressDrawn(sim: Simulation, key: string, day: number, units: number): { unit: number; announced: boolean } | undefined {
  const d = sim.rng('pro.stress', key, day);
  if (d.next() >= 0.35) return undefined;
  return { unit: Math.floor(d.next() * units), announced: d.next() < 0.75 };
}

/** Revised pages for a day (decider `pro.pages`): at the format's chance, the share of the lines they change. */
export function pagesDrawn(sim: Simulation, key: string, day: number, chance: number): number | undefined {
  const r = sim.rng('pro.pages', key, day);
  if (r.next() >= chance) return undefined;
  return r3(PAGES.least + r.next() * (PAGES.most - PAGES.least));
}

/** A recall to loop after the wrap (decider `pro.loop`): at `AFTER_WRAP.loop`, the days from the wrap it's asked for, 14 to 59. */
export function loopDrawn(sim: Simulation, key: string): number | undefined {
  if (sim.rng('pro.loop', key).next() >= AFTER_WRAP.loop) return undefined;
  return 14 + Math.floor(sim.rng('pro.loop', key, 'when').next() * 46);
}

/**
 * A reshoot day or a pickup session after the wrap (decider `pro.reshoot`): at `AFTER_WRAP.further`, by the work, and the
 * days on it's asked for, a month and a half to three months on.
 */
export function furtherDrawn(sim: Simulation, key: string): number | undefined {
  if (sim.rng('pro.reshoot', key).next() >= AFTER_WRAP.further) return undefined;
  return AFTER_WRAP.furtherFrom + Math.floor(sim.rng('pro.reshoot', key, 'when').next() * AFTER_WRAP.furtherWithin);
}

/** A promotional film for the release (decider `pro.promo`): at `PROMO.chance` for the part's size, by the work. */
export const promoDrawn = (sim: Simulation, key: string, size: 'lead' | 'supporting'): boolean => sim.rng('pro.promo', key).next() < PROMO.chance[size];

/**
 * Whether a part's production may call it to a promotional film (`PROMO`): a lead or a supporting part seen on screen in
 * work released to cinemas, streaming or broadcast. A voice, a student film, a short for festivals and a stage run have none.
 */
export const promoFor = (t: ProjectTemplate): t is ProjectTemplate & { role: { size: 'lead' | 'supporting' } } =>
  t.medium !== 'stage' && !voiceOnly(t) && (t.role.size === 'lead' || t.role.size === 'supporting') && ['theatrical', 'streaming', 'broadcast'].includes(formatOf(t).after);

/**
 * A promotional film's pay (N13 §18.B(3), (5)): under SAG-AFTRA, a part paid less than $25,000 for the work is paid at
 * least a day performer's minimum on the day, the Basic Agreement's rule, which the game reads into SAG-AFTRA's other
 * screen agreements too (ASSUMPTION, their terms for it unread); a part paid more bargains for it, and the game's contract
 * has it unpaid, as other work's. Undefined is unpaid. `forWork` is the contract's estimate, so the term it said holds.
 */
export function promoPay(t: ProjectTemplate, forWork: number, at: Instant): number | undefined {
  if (t.union !== 'sag-aftra' || forWork >= PROMO.bargained) return undefined;
  return minimumOn(RATES['sag-tv-day'], dateKey(at, NY));
}

/** A promotional film's term in the contract (`PROMO`, `promoPay`): when it may come, and what it pays and why. */
export function promoTerm(t: ProjectTemplate, forWork: number): string {
  const call = `Around its release, the production may call you for ${countWords(PROMO.hours)} hours to appear in a promotional film about it, on a weekday clear of your other work.`;
  if (t.union !== 'sag-aftra') return `${call} It’s part of the job, unpaid.`;
  const rule = t.pay === 'sag-tv-day' || t.pay === 'sag-tv-week' ? 'as the agreement sets' : 'SAG-AFTRA’s Basic Agreement’s rule, which the game applies to this agreement too, its assumption';
  return forWork < PROMO.bargained
    ? `${call} Paid less than $25,000 for the work, you’re paid at least a day performer’s minimum for it, ${rule}.`
    : `${call} Paid $25,000 or more for the work, its pay is yours to bargain, ${rule}, and this contract has it unpaid.`;
}

/** A scene cut in the edit (decider `pro.cut`): at `AFTER_WRAP.cut`, by the work. */
export const cutDrawn = (sim: Simulation, key: string): boolean => sim.rng('pro.cut', key).next() < AFTER_WRAP.cut;

/** The episode a day's label names, where it's a series'. */
const episodeOfLabel = (label: string): number | undefined => { const m = /: Episode (\d+),/.exec(label); return m ? Number(m[1]) : undefined; };

/** A unit shot before a scene the story puts ahead of it: played before what leads into it. */
export const shotAhead = (e: Engagement, u: WorkUnit): boolean => (e.units ?? []).some((x) => x.scene < u.scene && (x.day > u.day || (x.day === u.day && x.order > u.order)));

/** How much more of the breakdown a scene shot ahead of what leads into it asks: the arc must be mapped (the game's). */
export const AHEAD = 1.25;

// ---------------------------------------------------------------------------------------------------------------------
// The choices
// ---------------------------------------------------------------------------------------------------------------------

/** The decisions a booked part offers. */
export const decisionsFor = (t: ProjectTemplate): Decision[] => decisionsOf(t.format, t.intimacy !== undefined);

/** The option in force for a decision: the player's, or the decision's own until they pick. */
export function choiceOf(e: Engagement, d: Decision): string {
  const mine = e.choices?.[d.id];
  return mine && d.options.some((o) => o.id === mine) ? mine : d.initial;
}

/** What the day's choices do on a step: each decision read there, its option's effect. */
function effectsOn(e: Engagement, t: ProjectTemplate, step: StepId): Partial<Record<DecisionId, ChoiceEffect>> {
  const out: Partial<Record<DecisionId, ChoiceEffect>> = {};
  for (const d of decisionsFor(t)) {
    if (!d.on.includes(step)) continue;
    out[d.id] = d.options.find((o) => o.id === choiceOf(e, d))!.effect;
  }
  return out;
}

/** Why a choice can't be made now, or nothing. */
export function choiceRefusal(e: Engagement | undefined, t: ProjectTemplate | undefined, decision: string, option: string): string | undefined {
  if (!e || !t) return 'There’s no such work.';
  if (e.status === 'finished' || e.status === 'canceled') return 'That work is over.';
  const d = decisionsFor(t).find((x) => x.id === decision);
  if (!d) return `${t.project} doesn’t ask that of you.`;
  if (!d.options.some((o) => o.id === option)) return 'That isn’t one of the choices.';
  if (d.id === 'consent' && (e.units ?? []).some((u) => u.intimate && u.takes?.length)) return 'The scene is already shot. Consent given for what’s on film can’t be taken back, and nothing is shot of it again.';
  return undefined;
}

/** A choice made: kept on the engagement, read by each day after. */
export function choose(sim: Simulation, e: Engagement, t: ProjectTemplate, decision: DecisionId, option: string): void {
  (e.choices ??= {})[decision] = option;
  const d = decisionsFor(t).find((x) => x.id === decision)!;
  const o = d.options.find((x) => x.id === option)!;
  noteEvent(sim, e, { kind: 'worked', key: `choice:${decision}:${option}:${sim.now}`, words: `${d.label}: you chose ${o.label}.` });
}

// ---------------------------------------------------------------------------------------------------------------------
// The voice
// ---------------------------------------------------------------------------------------------------------------------

/** The voice's strain now: what was last raised, less `VOICE.restPerHour` for each hour since. */
export function strainOf(person: Person, at: Instant): number {
  const v = healthOf(person).voice;
  if (!v) return 0;
  return r1(Math.max(0, v.strain - VOICE.restPerHour * Math.max(0, (at - v.at) / MS_HOUR)));
}

/** Strain added at a moment, on what rest has left of the last. */
export function strain(person: Person, at: Instant, by: number): void {
  if (by <= 0) return;
  healthOf(person).voice = { strain: r1(clamp(strainOf(person, at) + by, 0, 100)), at };
}

// ---------------------------------------------------------------------------------------------------------------------
// A day worked
// ---------------------------------------------------------------------------------------------------------------------

/** The families' lean on the dimensions (`EVALUATION.familyLean`), as the judge works it out, times a choice's. */
function leanWith(families: readonly string[], choice: Partial<Record<Dimension, number>>): Partial<Record<Dimension, number>> {
  const leans = families.map((f) => EVALUATION.familyLean[f]).filter(Boolean);
  const out: Partial<Record<Dimension, number>> = {};
  for (const d of ['believability', 'interpretation', 'connection', 'execution', 'consistency', 'responsiveness'] as const) {
    const fam = leans.length ? leans.reduce((s, l) => s + (l![d] ?? 1), 0) / leans.length : 1;
    out[d] = fam * (choice[d] ?? 1);
  }
  return out;
}

const ZERO: PartPrep = { interpretation: 0, memorization: 0, rehearsal: 0 };

/**
 * One unit's context for a take: the step's profile, the part's preparation as that profile reads it, the unit's own
 * demands (a scene shot ahead of what leads into it asks more of the breakdown), the voice's strain, and the choice's lean.
 */
export function unitContext(sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate, u: WorkUnit, take: number, task: TaskProfile, lean: Partial<Record<Dimension, number>>, genre: number, extra: { playback?: boolean; pickup?: boolean } = {}): EvalContext {
  const p = e.prep ?? ZERO;
  const special = p.special ?? 0;
  const ahead = shotAhead(e, u);
  const interpretation = extra.playback && take > 1 ? Math.max(p.interpretation, BRIEF.complete.interpretation) : p.interpretation;
  const musical = task.id === 'musicalNight';
  const prep: Record<string, number> = musical
    ? { lines: p.memorization, blocking: p.rehearsal, notes: p.interpretation, genre, special }
    : { interpretation, memorization: p.memorization, rehearsal: p.rehearsal, genre, special };
  const required: Record<string, number> = musical
    ? { lines: BRIEF.complete.memorization, blocking: BRIEF.complete.rehearsal, notes: BRIEF.complete.interpretation, genre: BRIEF.complete.genre, special: BRIEF.complete.rehearsal }
    : { interpretation: Math.min(1, BRIEF.complete.interpretation * (ahead ? AHEAD : 1)), memorization: BRIEF.complete.memorization, rehearsal: BRIEF.complete.rehearsal, genre: BRIEF.complete.genre, special: BRIEF.complete.rehearsal };
  const cond = conditionAt(sim, person, sim.now);
  const voice = strainOf(person, sim.now);
  const pickup = extra.pickup ? { connection: 0.6 } : {};
  const choice = { ...lean, ...Object.fromEntries(Object.entries(pickup).map(([d, f]) => [d, f * (lean[d as Dimension] ?? 1)])) };
  return {
    task, techniques: t.role.techniques, difficulty: (t.role.stakes - 1) * BRIEF.stakes, condition: { ...cond, ...(voice > 0 ? { voice } : {}) },
    families: t.role.families, ...(Object.keys(choice).length ? { lean: leanWith(t.role.families, choice) } : {}),
    prep, required, key: `pro:${person.id}:${e.id}:${u.day}:${u.id}:${take}`,
  };
}

/**
 * A stunt done yourself: the chance of an injury, from the fight rehearsal (complete at rehearsal's mark) and the body's
 * physical ability, 0 to 100 (`STUNT`, the game's).
 */
export function stuntChance(special: number, physical: number): number {
  const rehearsed = clamp(special / BRIEF.complete.rehearsal, 0, 1);
  return (STUNT.rehearsed + (STUNT.cold - STUNT.rehearsed) * (1 - rehearsed)) * (1 - STUNT.physicalShare * clamp(physical / 100, 0, 1));
}

/** A unit's takes, best of them printed: the format's or the step's, one fewer with playback watched. */
function takesFor(t: ProjectTemplate, js: JudgedStep, effects: Partial<Record<DecisionId, ChoiceEffect>>): number {
  const base = formatOf(t).takes?.base ?? js.takes;
  return Math.max(1, base - (effects.playback?.playback ? 1 : 0));
}

/** The day's result, for the work day's handler: its band and whole where it was judged. */
export interface DayWorked { band?: Band; overall?: number; ev?: Evaluation; report: WorkReport }

/**
 * A day worked in its workflow. An unjudged one builds the part (`BuildStep`); a judged one plays each of its units in
 * takes, the best printed, with the player's choices read, and comes to the mean of its printed takes. Either leaves a
 * report on the engagement. The stage play's day isn't worked here.
 */
export function workTheDay(sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate, i: number, at: Instant, genre: number, rehearse: () => void): DayWorked {
  const flow = workflowOf(t);
  const step = stepOf(t, i);
  const effects = effectsOn(e, t, step);
  const choices = Object.fromEntries(decisionsFor(t).filter((d) => d.on.includes(step)).map((d) => [d.id, choiceOf(e, d)]));
  const report: WorkReport = { day: i, at, step, units: [], choices, ...(e.script?.revised?.some((r) => r.day === i) ? { revised: e.script.revised.find((r) => r.day === i)!.share } : {}) };
  const before = { energy: person.wellbeing.energy, strain: strainOf(person, at) };
  // The voice's strain is the day's at its end, rest easing it from then.
  const end = e.days[i]?.to ?? at;
  const build = flow.builds?.[step];
  if (build) {
    const learn = Object.values(effects).reduce((m, x) => m * (x?.learn ?? 1), 1);
    const p = (e.prep ??= { ...ZERO });
    const move = (part: keyof PartPrep, by: number | undefined) => { if (!by) return; const was = p[part] ?? 0; p[part] = r3(clamp(was + by * learn * (1 - was), 0, 1)); };
    move('interpretation', build.interpretation); move('memorization', build.memorization); move('rehearsal', build.rehearsal); move('special', build.special);
    // A day that builds nothing of its own is a play's rehearsal: a musical's staging (`rehearseDay`).
    const plain = !build.interpretation && !build.memorization && !build.rehearsal && !build.special;
    if (plain) rehearse();
    const sx = Object.values(effects).reduce((m, x) => m * (x?.strain ?? 1), 1);
    strain(person, end, (build.strain ?? 0) * sx);
    const energy = Object.values(effects).reduce((n, x) => n + (x?.energy ?? 0), 0);
    if (energy) person.wellbeing.energy = clamp(person.wellbeing.energy - energy, 0, 100);
    report.built = { ...Object.fromEntries((['interpretation', 'memorization', 'rehearsal', 'special'] as const).filter((k) => (plain ? k !== 'special' : build[k])).map((k) => [k, p[k] ?? 0])) };
    report.strain = { before: before.strain, after: strainOf(person, end) };
    (e.reports ??= []).push(report);
    return { report };
  }
  const js = flow.judged[step];
  if (!js) { (e.reports ??= []).push(report); return { report }; }
  // A house before the tape night or a musical's night: nerves, as before a School night (`nerves`).
  if (step === 'tape-night' || step === 'performance') nerves(sim, person, 'performance');
  const lean = Object.values(effects).reduce<Partial<Record<Dimension, number>>>((m, x) => { for (const [d, f] of Object.entries(x?.lean ?? {})) m[d as Dimension] = (m[d as Dimension] ?? 1) * f!; return m; }, {});
  const fmt = formatOf(t);
  let extras = effects.takes?.extraTakes ? fmt.takes?.extra ?? 0 : 0;
  const units = (e.units ?? []).filter((u) => u.day === i).sort((a, b) => a.order - b.order);
  const kept: { u: WorkUnit; ev: Evaluation; best: number }[] = [];
  let stressful = 0;
  for (const u of units) {
    report.units.push(u.id);
    if (u.intimate && choiceOf(e, CONSENT) !== 'given') { u.by = 'double'; continue; }
    if (u.stressful === 'unannounced' && effects.stressful?.refuse) { u.by = 'refused'; continue; }
    const task = TASK_PROFILES[u.stunt ? 'stunt' : js.task]!;
    const takes = takesFor(t, js, effects);
    u.takes = [];
    let best: Evaluation | undefined;
    const play = (k: number, pickup = false) => {
      const ev = evaluate(sim, person, unitContext(sim, person, e, t, u, k, task, lean, genre, { playback: effects.playback?.playback === true, pickup }));
      u.takes!.push(r1(ev.overall));
      if (!best || ev.overall > best.overall) best = ev;
    };
    for (let k = 1; k <= takes; k += 1) play(k);
    // Another take asked for, where the best isn't yet strong and the production allows more today (`TAKES`).
    while (extras > 0 && best!.overall < EVALUATION.bands.strong) {
      extras -= 1;
      person.wellbeing.energy = clamp(person.wellbeing.energy - (effects.takes?.energy ?? 0), 0, 100);
      play(u.takes.length + 1);
      u.extra = (u.extra ?? 0) + 1;
    }
    // A scene that played badly before the audience, picked up after it leaves, without its laughs; a narration's
    // chapter that slipped, picked up at the end of the session.
    if ((step === 'tape-night' || step === 'narration') && best!.overall < EVALUATION.bands.working) { play(u.takes.length + 1, step === 'tape-night'); u.pickup = true; }
    let printed = best!.overall;
    if (u.stunt) {
      if (effects.stunts?.double) { u.by = 'double'; printed = best!.overall * STUNT.insert; }
      else {
        u.by = 'you';
        const chance = stuntChance(e.prep?.special ?? 0, abilityOf(sim, person, 'physical'));
        const dayRate = e.contract?.rate ?? 0;
        const hurt = mayHurt(sim, person, 'screen', chance, at + 3 * MS_HOUR, { cityId: t.place.cityId, weeklyWage: e.contract?.per === 'week' ? dayRate : dayRate * 5, employer: t.company });
        if (hurt) report.injury = hurt.kind;
      }
    }
    if (u.stressful) stressful += 1;
    u.best = r1(printed);
    kept.push({ u, ev: best!, best: printed });
  }
  if (!kept.length) { (e.reports ??= []).push(report); return { report }; }
  const overall = r1(kept.reduce((s, k) => s + k.best, 0) / kept.length);
  const band = bandOfQuality(overall);
  // The voice: an hour's strain for each hour of the work, times the choice's, and the screamed lines' on top.
  if (js.strain) {
    const sx = Object.values(effects).reduce((m, x) => m * (x?.strain ?? 1), 1);
    strain(person, end, js.strain * workHoursOf(e.days[i]!) * sx + stressful * VOICE.stressfulExtra);
  }
  const energy = Object.values(effects).reduce((n, x) => n + (x?.energy && !x.extraTakes ? x.energy : 0), 0);
  if (energy) person.wellbeing.energy = clamp(person.wellbeing.energy - energy * kept.length, 0, 100);
  // The day on the record as one piece of work: the printed takes' mean, with what held back the unit nearest it.
  const near = kept.reduce((a, b) => (Math.abs(b.best - overall) < Math.abs(a.best - overall) ? b : a)).ev;
  const ev: Evaluation = { ...near, overall, inputs: { ...near.inputs, key: `pro:${person.id}:${e.id}:${i}` } };
  recordWork(sim, person, ev, { at, what: `${t.role.part}, ${t.project}: ${e.days[i]!.label.replace(/^[^:]*: /, '')}`, band });
  report.overall = overall;
  report.band = band;
  report.strain = { before: before.strain, after: strainOf(person, end) };
  report.energy = { before: r1(before.energy), after: r1(person.wellbeing.energy) };
  (e.reports ??= []).push(report);
  return { band, overall, ev, report };
}

// ---------------------------------------------------------------------------------------------------------------------
// Words
// ---------------------------------------------------------------------------------------------------------------------

/** A unit as a report names it: "Scene 14", "Loop 7 (a ferry captain)", "Chapter 3". */
export function unitName(t: ProjectTemplate, u: WorkUnit): string {
  const flow = workflowOf(t);
  const js = flow.judged[stepOf(t, u.day)];
  const one = js?.unit.one ?? 'scene';
  return `${one.charAt(0).toUpperCase()}${one.slice(1)} ${u.scene}${u.episode !== undefined ? ` of Episode ${u.episode}` : ''}${u.character ? ` (${u.character})` : ''}`;
}

const takeCount = (n: number): string => (n === 1 ? 'one take' : `${['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine'][n] ?? n} takes`);

/**
 * A day's report in the player's words: the units in the order they were shot and whether that was the script's, each
 * one's takes and the printed one's band, who did what a double did, a refused line, the pages revised, the voice and an
 * injury. The Work tab shows it, and the engagement keeps it.
 */
export function reportWords(e: Engagement, t: ProjectTemplate, r: WorkReport): string {
  const out: string[] = [];
  if (r.revised !== undefined) out.push(`The pages were revised the night before: about ${Math.round(r.revised * 100)}% of your ${workflowOf(t).prep.steps.includes('lines') ? 'lines' : 'script'} changed.`);
  if (r.built) {
    // Until 2026-10-24 the work's own preparation was its button's label lowercased, and the day "worked on" itself: "A fight
    // rehearsal: it worked on the blocking and fight rehearsal."
    const what = Object.keys(r.built).map((k) => ({ interpretation: 'the breakdown', memorization: 'the lines', rehearsal: 'the blocking', special: workflowOf(t).prep.special?.worked ?? 'the work’s own preparation' } as Record<string, string>)[k]!);
    out.push(`${STEP_WORDS[r.step].charAt(0).toUpperCase()}${STEP_WORDS[r.step].slice(1)}: you worked on ${spokenList(what)}.`);
  }
  const units = r.units.map((id) => (e.units ?? []).find((u) => u.id === id)).filter((u): u is WorkUnit => !!u);
  if (units.length) {
    const inOrder = units.every((u, k) => k === 0 || units[k - 1]!.scene < u.scene);
    out.push(`Shot in this order: ${spokenList(units.map((u) => unitName(t, u)))}${units.length > 1 ? (inOrder ? ', in the script’s order.' : ', out of the script’s order.') : '.'}`);
    for (const u of units) {
      if (u.by === 'double' && !u.takes?.length) { out.push(`${unitName(t, u)}: a body double did the intimate shots, and it isn’t judged as part of your work.`); continue; }
      if (u.by === 'refused') { out.push(`${unitName(t, u)}: its screamed lines weren’t announced before the session, and you refused them.`); continue; }
      if (!u.takes?.length) continue;
      const printed = u.best ?? Math.max(...u.takes);
      const bits = [`${takeCount(u.takes.length)}${u.extra ? `, ${u.extra === 1 ? 'one' : u.extra} you asked for` : ''}${u.pickup ? ', the last a pickup' : ''}`, `the printed one ${bandWords(printed)}`];
      if (u.stunt) bits.push(u.by === 'double' ? 'the stunt by the double, your close-ups cut in' : 'the stunt done yourself, the coordinator there');
      if (u.intimate) bits.push('shot on a closed set with the intimacy coordinator');
      if (u.stressful) bits.push(u.stressful === 'announced' ? 'with screamed lines announced before the session' : 'with screamed lines sprung on the session');
      out.push(`${unitName(t, u)}: ${bits.join('; ')}.`);
    }
  }
  if (r.band) out.push(`The day came to ${BAND_WORDS[r.band]}.`);
  if (r.strain && r.strain.after > r.strain.before + 0.5) out.push(`Your voice’s strain went from ${Math.round(r.strain.before)} to ${Math.round(r.strain.after)} of 100${r.strain.after >= VOICE.warnAt ? ': rest it before the next session' : ''}.`);
  if (r.injury) out.push('You were hurt doing the stunt.');
  return out.join(' ');
}

const BAND_WORDS: Readonly<Record<Band, string>> = { unready: 'unready', working: 'working', strong: 'strong', exceptional: 'exceptional' };
const bandWords = (q: number): string => `${BAND_WORDS[bandOfQuality(q)]}`;

// ---------------------------------------------------------------------------------------------------------------------
// After the wrap
// ---------------------------------------------------------------------------------------------------------------------

/** The weekday at ten on or after a day, clear of the person's booked work. */
function clearWeekday(person: Person, from: Instant, until: Instant, except: string, hour: number = AFTER_WRAP.loopHour, hours: number = AFTER_WRAP.loopHours): Instant | undefined {
  for (let d = from; d <= until; d = addDays(d, 1, NY)) {
    const p = zonedParts(d, NY);
    if (p.weekday === 0 || p.weekday === 6) continue;
    const start = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour, minute: 0 }, NY);
    const end = start + hours * MS_HOUR;
    const clash = (person.pro?.engagements ?? []).some((x) => x.id !== except && x.status !== 'finished' && x.status !== 'canceled' && x.days.some((w) => w.from < end && w.to > start));
    // Nor another recall already set (from 2026-10-25, brief 27's K5): a reshoot isn't set on a loop's day; nor, from later
    // that day, a loop on a reshoot's or a pickup's, nor either on a promotional film's. Until then a loop drawn after a
    // reshoot could land on its day, the two set for the same hours.
    const recalled = (person.pro?.engagements ?? []).some((x) =>
      (x.loop?.status === 'set' && x.loop.at < end && x.loop.at + AFTER_WRAP.loopHours * MS_HOUR > start)
      || (x.further?.status === 'set' && x.further.at < end && x.further.at + furtherHours(x.further.kind) * MS_HOUR > start)
      || (x.promo?.status === 'set' && x.promo.at < end && x.promo.at + PROMO.hours * MS_HOUR > start));
    if (!clash && !recalled) return start;
  }
  return undefined;
}

/** A further day's hours: a reshoot's call to wrap, nine with lunch, eight of them work; a pickup session's four. */
export const furtherHours = (kind: 'reshoot' | 'pickup'): number => (kind === 'reshoot' ? AFTER_WRAP.reshootHours : AFTER_WRAP.loopHours);

/**
 * After a screen wrap (N13 Schedule A §28.A): a recall to loop, drawn by the engagement, within the format's months, on a
 * weekday clear of the actor's other booked work; a feature's reshoot day or a voice part's pickup session (`further`,
 * from 2026-10-25, brief 27's K5); and an anthology's invitation into its next story for strong work. A stage run has
 * none of them; voice work had none until 2026-10-25.
 */
export function afterWrap(sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate, best: Band | undefined, tell: (title: string, body: string) => void, near?: { minutes: number }): void {
  const fmt = formatOf(t);
  // A reshoot on the production's own set, for a part within a day's reach of home, or a voice part's pickup session at a
  // studio near you (from 2026-10-25, brief 27's K5): drawn by the work, on a weekday clear of other work and the loop.
  const kind = fmt.further === 'pickup' || (fmt.further === 'reshoot' && near) ? fmt.further : undefined;
  const further = kind ? furtherDrawn(sim, workKey(e)) : undefined;
  if (kind && further !== undefined && !e.further) {
    const first = addDays(sim.now, further, NY);
    const at = clearWeekday(person, first, addDays(first, 30, NY), e.id, kind === 'reshoot' ? AFTER_WRAP.reshootHour : AFTER_WRAP.loopHour, furtherHours(kind));
    if (at) {
      e.further = { kind, at, status: 'set' };
      const label = kind === 'reshoot' ? `${t.project}: Reshoot Day` : `${t.project}: Pickup Session`;
      sim.schedule({ at, kind: FURTHER_KIND, label, category: 'career', priority: 38, requiresPlayer: true, durationMinutes: furtherHours(kind) * 60, travelMinutes: kind === 'reshoot' ? near!.minutes : 30, locationId: kind === 'reshoot' ? t.place.cityId : person.currentLocationId, refType: 'pro.engagement', refId: e.id, payload: { personId: person.id, engagementId: e.id } });
      const words = kind === 'reshoot'
        ? `${t.company} called you back for a reshoot as ${t.role.part}: ${t.place.venue} in ${t.place.city} on ${formatWeekdayDate(at, NY)}, from 7:00 AM to 4:00 PM, to shoot some of your scenes again. It pays a day.`
        : `${t.company} called you back for a pickup session as ${t.role.part}: four hours in a booth at a studio near you on ${formatWeekdayDate(at, NY)} at 10:00 AM, to record some of your lines again. It pays a session, as your other sessions did.`;
      noteEvent(sim, e, { kind: 'booked', key: 'further', words });
      tell(kind === 'reshoot' ? `${t.project} Calls You Back To Reshoot` : `${t.project} Calls You Back For Pickups`, words);
    }
  }
  const after = fmt.looping ? loopDrawn(sim, workKey(e)) : undefined;
  if (fmt.looping && after !== undefined) {
    const first = addDays(sim.now, after, NY);
    const until = addDays(sim.now, Math.round(fmt.looping * 30.4), NY);
    const at = clearWeekday(person, first, until, e.id);
    if (at) {
      e.loop = { at, status: 'set' };
      sim.schedule({ at, kind: LOOP_KIND, label: `${t.project}: Looping Session`, category: 'career', priority: 38, requiresPlayer: true, durationMinutes: AFTER_WRAP.loopHours * 60, travelMinutes: 30, locationId: person.currentLocationId, refType: 'pro.engagement', refId: e.id, payload: { personId: person.id, engagementId: e.id } });
      const words = `The production recalled you to loop ${t.role.part}: a four-hour session at a studio near you on ${formatWeekdayDate(at, NY)} at 10:00 AM, to re-record lines the shoot’s sound didn’t keep. It pays half a day, as the agreement sets for a looping session of four hours.`;
      noteEvent(sim, e, { kind: 'booked', key: 'loop', words });
      tell(`${t.project} Recalls You To Loop`, words);
    }
  }
  const next = fmt.returns && (best === 'strong' || best === 'exceptional') ? PROJECT_AFTER[t.id] : undefined;
  if (next) {
    const at = instantFromZoned({ ...dayPartsOf(addDays(sim.now, 240, NY)), hour: 9, minute: 0 }, NY);
    sim.schedule({ at, kind: INVITE_KIND, label: `${t.project}: An Invitation`, category: 'career', priority: 40, refType: 'pro.engagement', refId: e.id, payload: { personId: person.id, engagementId: e.id, projectId: next } });
    noteEvent(sim, e, { kind: 'success', key: 'invite', words: `Your work as ${t.role.part} was strong enough that ${t.company} will ask you back into its next story.` });
  }
}

const dayPartsOf = (at: Instant) => { const p = zonedParts(at, NY); return { year: p.year, month: p.month, day: p.day }; };

/** An anthology's next story, by the one it follows (`ProjectTemplate.invitedFrom`). */
const PROJECT_AFTER: Readonly<Record<string, string>> = Object.fromEntries(PROJECTS.filter((p) => p.invitedFrom).map((p) => [p.invitedFrom!, p.id]));

/** Pay for a looping session: half the day's pro rata salary for four hours (N13 Schedule A §28.A), the week's a fifth of it. */
export function loopPay(e: Engagement): number {
  const rate = e.contract?.rate ?? 0;
  const daily = e.contract?.per === 'week' ? rate / 5 : rate;
  return Math.round(daily / 2);
}

/**
 * The looping session (`LOOP_KIND`): read for permission to work and the actor there, then a booth's loops on their own
 * picture, the sync choice read, paid half a day through the pay the work's other days came by. Missed, the production
 * loops it with another actor, and it isn't paid.
 */
export function loopSession(sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate, at: Instant, there: boolean, genre: number, tell: (title: string, body: string) => void): void {
  if (!e.loop || e.loop.status !== 'set') return;
  const day = { from: at, to: at + AFTER_WRAP.loopHours * MS_HOUR, label: `${t.project}: Looping Session` };
  if (!workAuthorizedFor(person, day)) {
    e.loop.status = 'missed';
    noteEvent(sim, e, { kind: 'problem', key: 'loop:missed', words: `You couldn’t loop ${t.role.part}: you had no permission to work on ${formatDate(at, NY)}, so the production had another actor do it.` });
    return;
  }
  if (!there) {
    e.loop.status = 'missed';
    noteEvent(sim, e, { kind: 'problem', key: 'loop:missed', words: `You missed the looping session for ${t.role.part} on ${formatDate(at, NY)}, so the production had another actor do it, and it wasn’t paid.` });
    tell(`You Missed The Looping Session`, `You missed the looping session for ${t.role.part} in ${t.project}. The production had another actor re-record the lines, and the session isn’t paid.`);
    return;
  }
  const units: WorkUnit[] = (e.units ?? []).filter((u) => u.takes?.length && !u.cut).slice(0, 3).map((u, k) => ({ id: `loop${k + 1}`, day: -1, scene: u.scene, order: k + 1, ...(u.episode !== undefined ? { episode: u.episode } : {}), version: u.version ?? 1 }));
  const sync = decisionsFor(t).find((d) => d.id === 'sync');
  const lean = sync ? sync.options.find((o) => o.id === choiceOf(e, sync))!.effect.lean ?? {} : {};
  let total = 0;
  for (const u of units) {
    u.takes = [];
    for (let k = 1; k <= 2; k += 1) u.takes.push(r1(evaluate(sim, person, { ...unitContext(sim, person, e, t, u, k, TASK_PROFILES.dub!, lean, genre), key: `pro:${person.id}:${e.id}:loop:${u.id}:${k}` }).overall));
    u.best = Math.max(...u.takes);
    total += u.best;
  }
  strain(person, at, 3 * AFTER_WRAP.loopHours);
  const overall = units.length ? r1(total / units.length) : undefined;
  e.loop.status = 'done';
  if (overall !== undefined) e.loop.overall = overall;
  e.loop.units = units;
  const p: ProPayment = { id: sim.nextId('pro'), key: `${e.id}:loop`, promised: loopPay(e), currency: 'USD', promisedAt: sim.now, due: thursdayAfter(at), week: { from: at, to: day.to } };
  if (!e.pay.some((x) => x.key === p.key)) e.pay.push(p);
  schedulePay(sim, person, e);
  noteEvent(sim, e, { kind: 'worked', key: 'loop:done', words: `You looped ${t.role.part} on ${formatDate(at, NY)}: ${plural(units.length, 'line')} re-recorded${overall !== undefined ? `, ${BAND_WORDS[bandOfQuality(overall)]}` : ''}, paid half a day.` });
}

/**
 * A reshoot day or a pickup session (`FURTHER_KIND`, from 2026-10-25, brief 27's K5): read for permission to work and the
 * actor there; the part's weakest kept scenes or lines taken again, each judged as its day judged it, and the better take
 * kept; the credit's band read again from what's kept; paid a day, or a weekly part's fifth of a week (N13 Schedule B
 * §12), through the pay the work's other days came by. Missed, the production does them again without the actor, and
 * they're cut from the part and unpaid.
 */
export function furtherSession(sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate, at: Instant, there: boolean, genre: number, tell: (title: string, body: string) => void): void {
  const f = e.further;
  if (!f || f.status !== 'set') return;
  const flow = workflowOf(t);
  const day = { from: at, to: at + furtherHours(f.kind) * MS_HOUR, label: f.kind === 'reshoot' ? `${t.project}: Reshoot Day` : `${t.project}: Pickup Session` };
  const what = f.kind === 'reshoot' ? 'reshoot' : 'pickup session';
  const again = (e.units ?? []).filter((u) => u.takes?.length && !u.cut && u.by !== 'double' && u.day >= 0).sort((a, b) => (a.best ?? 0) - (b.best ?? 0)).slice(0, f.kind === 'reshoot' ? 2 : 3);
  const credit = person.pro?.credits.find((c) => c.engagementId === e.id);
  if (!workAuthorizedFor(person, day) || !there) {
    f.status = 'missed';
    for (const u of again) u.cut = true;
    const band = keptBand(e);
    if (credit && band) credit.band = band;
    const why = !there ? `You missed the ${what} for ${t.role.part} on ${formatDate(at, NY)}` : `You had no permission to work on ${formatDate(at, NY)} for the ${what}`;
    const words = `${why}, so the production did ${f.kind === 'reshoot' ? 'those scenes' : 'those lines'} again with another actor, and ${plural(again.length, f.kind === 'reshoot' ? 'scene' : 'line')} of yours ${again.length === 1 ? 'is' : 'are'} cut from the part. It isn’t paid.`;
    noteEvent(sim, e, { kind: 'problem', key: 'further:missed', words });
    tell(`You Missed The ${f.kind === 'reshoot' ? 'Reshoot' : 'Pickup Session'}`, words);
    return;
  }
  let total = 0;
  const units: WorkUnit[] = [];
  for (const u of again) {
    const js = flow.judged[stepOf(t, u.day)];
    const task = TASK_PROFILES[js?.task ?? 'scene'] ?? TASK_PROFILES.scene!;
    const takes: number[] = [];
    for (let k = 1; k <= 2; k += 1) takes.push(r1(evaluate(sim, person, { ...unitContext(sim, person, e, t, u, k, task, {}, genre), key: `pro:${person.id}:${e.id}:further:${u.id}:${k}` }).overall));
    const best = Math.max(...takes);
    units.push({ id: `further-${u.id}`, day: -2, scene: u.scene, order: units.length + 1, ...(u.episode !== undefined ? { episode: u.episode } : {}), version: u.version ?? 1, takes, best });
    // The better of the two is what the film keeps.
    if (best > (u.best ?? 0)) u.best = best;
    total += best;
  }
  if (f.kind === 'pickup') strain(person, at, 3 * AFTER_WRAP.loopHours);
  const overall = units.length ? r1(total / units.length) : undefined;
  f.status = 'done';
  if (overall !== undefined) f.overall = overall;
  f.units = units;
  const band = keptBand(e);
  if (credit && band) credit.band = band;
  const rate = e.contract?.rate ?? 0;
  const p: ProPayment = { id: sim.nextId('pro'), key: `${e.id}:further`, promised: e.contract?.per === 'week' ? Math.round(rate / 5) : rate, currency: 'USD', promisedAt: sim.now, due: thursdayAfter(at), week: { from: at, to: day.to } };
  if (!e.pay.some((x) => x.key === p.key)) e.pay.push(p);
  schedulePay(sim, person, e);
  noteEvent(sim, e, { kind: 'worked', key: 'further:done', words: `You ${f.kind === 'reshoot' ? 'reshot' : 'recorded again'} ${plural(units.length, f.kind === 'reshoot' ? 'scene' : 'line')} of ${t.role.part} on ${formatDate(at, NY)}${overall !== undefined ? `, ${BAND_WORDS[bandOfQuality(overall)]}` : ''}, the better take of each kept, paid ${e.contract?.per === 'week' ? 'a fifth of a week' : 'a day'}.` });
}

/**
 * A promotional film (`PROMO_KIND`, from 2026-10-25, brief 27's loop 34): read for permission to work and the actor there.
 * Made with the actor, it's paid where the contract pays it (`promoPay`), through the pay the work's other days came by,
 * and it makes the actor a little more visible to casting for a while (`VISIBILITY.promo`, `systems/awards.ts`), never
 * the work's judged quality nor an award's. Missed, the production makes it without the actor, unpaid, and its casting
 * office won't come straight to the actor with a part on the strength of this one (`directOfferFor`, `systems/projobs.ts`).
 */
export function promoSession(sim: Simulation, person: Person, e: Engagement, t: ProjectTemplate, at: Instant, there: boolean, tell: (title: string, body: string) => void): void {
  const p = e.promo;
  if (!p || p.status !== 'set') return;
  const day = { from: at, to: at + PROMO.hours * MS_HOUR, label: `${t.project}: Promotional Film` };
  if (!workAuthorizedFor(person, day) || !there) {
    p.status = 'missed';
    const why = !there ? `You missed the promotional film for ${t.project} on ${formatDate(at, NY)}` : `You had no permission to work on ${formatDate(at, NY)}, the day of the promotional film for ${t.project}`;
    const words = `${why}, so the production made it without you, and it isn’t paid. ${t.company} will remember it: its casting office won’t come straight to you with a part on the strength of ${t.role.part}.`;
    noteEvent(sim, e, { kind: 'problem', key: 'promo:missed', words });
    tell('You Missed The Promotional Film', words);
    return;
  }
  p.status = 'done';
  const forWork = e.contract?.estimate ?? e.pay.reduce((n, x) => n + (x.deferred ? 0 : x.promised), 0);
  const amount = promoPay(t, forWork, at);
  if (amount !== undefined) {
    const pay: ProPayment = { id: sim.nextId('pro'), key: `${e.id}:promo`, promised: amount, currency: 'USD', promisedAt: sim.now, due: thursdayAfter(at), week: { from: at, to: day.to } };
    if (!e.pay.some((x) => x.key === pay.key)) e.pay.push(pay);
    schedulePay(sim, person, e);
  }
  noteEvent(sim, e, { kind: 'worked', key: 'promo:done', words: `You appeared in the promotional film for ${t.project} on ${formatDate(at, NY)}, ${amount !== undefined ? 'paid a day performer’s minimum' : 'unpaid, as your contract has it'}. It makes you a little more visible to casting for a while.` });
}

const thursdayAfter = (at: Instant): Instant => {
  let d = addDays(at, 1, NY);
  while (zonedParts(d, NY).weekday !== 4) d = addDays(d, 1, NY);
  return instantFromZoned({ ...dayPartsOf(d), hour: 12, minute: 0 }, NY);
};

/**
 * A scene of the player's cut in the edit, decided at the release (the game's chance, by the engagement): the judged
 * unit whose printed take was the weakest, never the last one kept. The credit keeps the part and the pay is the player's;
 * its band is the best of the days on the scenes kept, so a reel cut from it shows only those (`ProCredit.band`).
 */
export function cutInEdit(sim: Simulation, e: Engagement): WorkUnit | undefined {
  const judged = (e.units ?? []).filter((u) => u.takes?.length && u.by !== 'double' && !u.cut);
  if (judged.length < 2 || !cutDrawn(sim, workKey(e))) return undefined;
  const cut = judged.reduce((a, b) => ((b.best ?? 0) < (a.best ?? 0) ? b : a));
  cut.cut = true;
  return cut;
}

/** The best band of the days on the units kept: what a cut leaves the credit. */
export function keptBand(e: Engagement): Band | undefined {
  const days = new Map<number, number[]>();
  for (const u of e.units ?? []) if (u.takes?.length && !u.cut && u.best !== undefined) (days.get(u.day) ?? days.set(u.day, []).get(u.day)!).push(u.best);
  const means = [...days.values()].map((xs) => xs.reduce((s, x) => s + x, 0) / xs.length);
  return means.length ? bandOfQuality(Math.max(...means)) : undefined;
}

// ---------------------------------------------------------------------------------------------------------------------
// Revised pages, and the command
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Revised pages the night before (the `pro.pages` reactor): from six in the evening before each work day, drawn by the
 * engagement and the day at the format's chance, a share of the lines changed, which takes that much of what's learned
 * of them, the breakdown's where the work reads no lines. The script's version goes up by one. Drawn at the first clock
 * stop from then, at the latest before the day's own item, so the player can learn the new pages that evening.
 */
export function revisePages(sim: Simulation, e: Engagement, t: ProjectTemplate, tell: (title: string, body: string) => void): void {
  const fmt = formatOf(t);
  if (!fmt.revisions || e.status === 'finished' || e.status === 'canceled') return;
  const script = (e.script ??= { version: 1, drawn: [], revised: [] });
  const flow = workflowOf(t);
  e.days.forEach((d, i) => {
    if (script.drawn.includes(i) || d.from <= sim.now - MIN) return;
    const eve = instantFromZoned({ ...dayPartsOf(addDays(d.from, -1, NY)), hour: PAGES.eveningHour, minute: 0 }, NY);
    if (sim.now < eve) return;
    script.drawn.push(i);
    const share = pagesDrawn(sim, workKey(e), i, fmt.revisions);
    if (share === undefined) return;
    script.version += 1;
    script.revised.push({ day: i, share, at: sim.now });
    for (const u of e.units ?? []) if (u.day >= i) u.version = script.version;
    const p = (e.prep ??= { ...ZERO });
    const lines = flow.prep.steps.includes('lines');
    if (lines) p.memorization = r3(p.memorization * (1 - share));
    else p.interpretation = r3(p.interpretation * (1 - share));
    const words = `Revised pages for ${formatWeekdayDate(d.from, NY)}: about ${Math.round(share * 100)}% of your ${lines ? 'lines' : 'script'} changed, so ${lines ? 'that much of what you’d learned of them' : 'that much of your breakdown'} has to be done again. The script is on version ${script.version} now.`;
    noteEvent(sim, e, { kind: 'problem', key: `pages:${i}`, words });
    tell(`Revised Pages For ${t.project}`, `${words} ${lines ? 'Learn The Lines' : 'Break It Down'} on the Work tab tonight puts it back.`);
  });
}

/** A day's report, the engagement's, by its day. */
export const reportOf = (e: Engagement, day: number): WorkReport | undefined => (e.reports ?? []).find((r) => r.day === day);

export interface WorkflowHooks {
  tell(sim: Simulation, person: Person, title: string, body: string): void;
  there(person: Person, at: Instant): boolean;
  genre(person: Person, t: ProjectTemplate): number;
  offerInvite(sim: Simulation, person: Person, projectId: string, from: Engagement): void;
}

/** The workflows' clock and command: revised pages each passage, the looping session, the anthology's invitation, and `pro.work_choice`. */
export function registerWorkflows(sim: Simulation, hooks: WorkflowHooks): void {
  sim.onPassage('pro.pages', (s) => {
    const person = s.player;
    for (const e of person.pro?.engagements ?? []) {
      const t = projectById(e.projectId);
      if (t) revisePages(s, e, t, (title, body) => hooks.tell(s, person, title, body));
    }
  });
  sim.onSchedule(LOOP_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const e = person?.pro?.engagements.find((x) => x.id === item.payload.engagementId);
    const t = e && projectById(e.projectId);
    if (!person || !e || !t) return;
    loopSession(s, person, e, t, item.at, hooks.there(person, item.at), hooks.genre(person, t), (title, body) => hooks.tell(s, person, title, body));
  });
  sim.onSchedule(FURTHER_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const e = person?.pro?.engagements.find((x) => x.id === item.payload.engagementId);
    const t = e && projectById(e.projectId);
    if (!person || !e || !t) return;
    furtherSession(s, person, e, t, item.at, hooks.there(person, item.at), hooks.genre(person, t), (title, body) => hooks.tell(s, person, title, body));
  });
  sim.onSchedule(PROMO_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const e = person?.pro?.engagements.find((x) => x.id === item.payload.engagementId);
    const t = e && projectById(e.projectId);
    if (!person || !e || !t) return;
    promoSession(s, person, e, t, item.at, hooks.there(person, item.at), (title, body) => hooks.tell(s, person, title, body));
  });
  sim.onSchedule(INVITE_KIND, (item, s) => {
    const person = s.universe.people[String(item.payload.personId)];
    const e = person?.pro?.engagements.find((x) => x.id === item.payload.engagementId);
    if (person && e) hooks.offerInvite(s, person, String(item.payload.projectId), e);
  });
  sim.onCommand<{ engagementId: string; decision: string; option: string }, { decision: string; option: string }>('pro.work_choice', (p, { sim: s }) => {
    const person = s.player;
    const e = person.pro?.engagements.find((x) => x.id === p?.engagementId);
    const t = e ? projectById(e.projectId) : undefined;
    const no = choiceRefusal(e, t, String(p?.decision), String(p?.option));
    if (no) throw new CommandError(no);
    choose(s, e!, t!, p.decision as DecisionId, p.option);
    ensurePro(s, person);
    return { decision: p.decision, option: p.option };
  });
}

/** The days a part's sessions or capture days come on, from a first day: weekdays, `everyDays` apart. */
export function sessionDays(t: ProjectTemplate, start: Instant, zone: string): { from: Instant; to: Instant }[] {
  const s = t.schedule;
  if (s.kind !== 'sessions') return [];
  const out: { from: Instant; to: Instant }[] = [];
  let d = start;
  while (out.length < s.sessions) {
    while ([0, 6].includes(zonedParts(d, zone).weekday)) d = addDays(d, 1, zone);
    const p = zonedParts(d, zone);
    const from = instantFromZoned({ year: p.year, month: p.month, day: p.day, hour: s.hour, minute: 0 }, zone);
    out.push({ from, to: from + s.minutes * MIN });
    d = addDays(d, s.everyDays, zone);
  }
  return out;
}

/** The decisions a part offers, as the Work tab lists them, with the one in force. */
export function choicesOf(e: Engagement, t: ProjectTemplate): { decision: Decision; chosen: string }[] {
  return decisionsFor(t).map((d) => ({ decision: d, chosen: choiceOf(e, d) }));
}

