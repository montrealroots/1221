/**
 * SLATE — a part's other language (from 2026-10-25, the owner's brief 27, Part 7: "Languages and accents"; Part 9:
 * "Accent, language, movement, and vocal preparation"; the supplement's loops 13 and 21, a self-tape's and a booked
 * part's preparation of "accent, movement, or other relevant requirements").
 *
 * Until this module the game recorded no languages, and the career universe's README (K3) left a language on the résumé
 * out as a word nothing would read, since every market the slate made work in worked in English. The owner ruled that no
 * reader wasn't a reason to leave an authorized feature out. So a share of the slate's parts are written for a character
 * who speaks a named language as well as English, as American work casts a bilingual character, and what the actor
 * speaks (`Person.languages`, chosen at creation, `content/languages.ts`) is read at each step that part takes:
 * - **who can be put up for it** (`languageRefusal`): an actor who doesn't speak the language can't be submitted, their
 *   agent doesn't put them up for it (`slateReach`), and a casting office that cast them before doesn't offer it to them
 *   without an audition (`directOfferFor`);
 * - **casting's fit** (`languageDemand`, read by `fitOf`): a native speaker suits it best, a fluent one well and a
 *   conversational one less, the weaker of the part's language and the actor's English counting, since the character
 *   speaks both. The fit sets casting's chance with the band (`chanceOf`) and an agent's reach (`slateReach`);
 * - **the preparation** (`withLanguage`, read by `auditionContext`, `workContext` and `unitContext`): a conversational
 *   speaker comes to the language part of the preparation short of complete, and Work On Your Spanish (or whichever it
 *   is) brings it on, as the other steps do theirs (`workOnLanguage`). Until it's complete it holds back the
 *   believability and the execution of an audition, a night or a day's take. A native or fluent speaker has nothing to
 *   prepare there.
 * The résumé lists every language but native English (`resumeNow`, `systems/pro.ts`).
 *
 * Every figure here is an ASSUMPTION, the game's own, said where it's set: no source the game uses counts how often an
 * American production writes a bilingual part, which languages, or how long an actor takes to bring a conversational
 * language to a part. Nothing here is said to the player as a fact about the world.
 */

import type { Simulation } from '../core/simulation';
import type { Person } from '../domain/model';
import type { ProjectKind, ProjectTemplate } from '../content/careerwork';
import type { Dimension } from '../content/tasks';
import { ENGLISH, levelIn, spokenName, type LanguageLevel } from '../content/languages';
import { MASTERED, STEP_SPEED } from '../content/abilities';
import type { EvalContext } from './evaluation';
import type { PartPrep } from './pro';
import { BRIEF } from './briefs';
import { repeatsToday } from './attributes';
import { exerts } from './body';
import { focusAt, ordinary } from './school';
import { startRefusal } from './life';

const clamp = (x: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, x));
const r3 = (x: number) => Math.round(x * 1000) / 1000;

// ---------------------------------------------------------------------------------------------------------------------
// The slate's parts
// ---------------------------------------------------------------------------------------------------------------------

/**
 * How often the slate writes a part for a character who speaks another language as well as English, and the kinds that
 * never do. ASSUMPTION, both: about one part in eight, and never a dub (the actor replaces another's lines in English) or
 * a documentary's narration (in English).
 */
export const PART_LANGUAGE = { share: 0.12, without: ['dub', 'documentary'] as readonly ProjectKind[] } as const;

/**
 * The languages such a part's character speaks, by weight. ASSUMPTION: the game's choice of second languages an
 * American production's bilingual character might plausibly speak, Spanish most often by the game's reckoning, the rest
 * alike. No source here counts them, and the game never says one does.
 */
export const PART_LANGUAGES: readonly (readonly [string, number])[] = [
  ['es', 6], ['cmn', 1], ['fr', 1], ['ko', 1], ['tl', 1], ['vi', 1], ['ar', 1], ['ru', 1], ['pt', 1], ['ja', 1], ['it', 1], ['hi', 1],
];

/**
 * The language a slate part's character speaks besides English, or none (the decider `pro.language`): drawn on its own
 * stream, keyed by the part's id, so the same save gives the same part the same language on every reload and in every
 * build that makes the part, and no other draw of the slate moves.
 */
export function partLanguage(sim: Pick<Simulation, 'rng'>, kind: ProjectKind, partId: string): string | undefined {
  if (PART_LANGUAGE.without.includes(kind)) return undefined;
  const r = sim.rng('pro.language', partId);
  if (r.next() >= PART_LANGUAGE.share) return undefined;
  return r.weighted(PART_LANGUAGES, ([, w]) => w)[0];
}

/** A part's other language by name, where it has one. */
export const partLanguageName = (t: Pick<ProjectTemplate, 'requirements'>): string | undefined => (t.requirements.language ? spokenName(t.requirements.language) ?? t.requirements.language : undefined);

// ---------------------------------------------------------------------------------------------------------------------
// Who can be put up for it, and casting's fit
// ---------------------------------------------------------------------------------------------------------------------

/**
 * Why the actor can't be put up for a part, by its language, or nothing: a part whose character speaks a language they
 * don't. Read by `eligibilityProblems` (Submit Yourself, and an agent's submission), `slateReach` and `directOfferFor`.
 */
export function languageRefusal(person: Person, t: Pick<ProjectTemplate, 'requirements'>): string | undefined {
  const name = partLanguageName(t);
  if (!name || levelIn(person, t.requirements.language!)) return undefined;
  return `The character speaks ${name} as well as English, and you don’t speak ${name}.`;
}

/**
 * How well each level suits a part written in a language, for casting's fit (`fitOf`), and how much the language weighs
 * beside the part's techniques. ASSUMPTION, each: a native speaker is what the part is written for, a fluent one comes
 * close, a conversational one is half the way; and the language counts as much as a technique the part leans on twice.
 */
export const LANGUAGE_FIT = { weight: 2, native: 1, fluent: 0.8, conversational: 0.5 } as const;

/**
 * The language's share of a part's demands, for `fitOf`: its weight, and how well the actor suits it, 0 to 1, the weaker
 * of the part's language and their English, since the character speaks both. Nothing for a part in English alone.
 */
export function languageDemand(person: Person, t: Pick<ProjectTemplate, 'requirements'>): { weight: number; f: number } {
  const id = t.requirements.language;
  if (!id) return { weight: 0, f: 0 };
  const suits = (level: LanguageLevel | undefined): number => (level ? LANGUAGE_FIT[level] : 0);
  return { weight: LANGUAGE_FIT.weight, f: Math.min(suits(levelIn(person, id)), suits(levelIn(person, ENGLISH))) };
}

// ---------------------------------------------------------------------------------------------------------------------
// The preparation
// ---------------------------------------------------------------------------------------------------------------------

/**
 * The language part of the preparation, for an actor who speaks the part's language conversationally. ASSUMPTION, every
 * figure: they come to it at `start`, short of `complete` (where a fluent speaker stands); an hour on the sides, two on
 * the part as every step takes (`WORK.partTimes`), moves it `gain` of the way that's left at a good hour's focus, halved
 * for each time it's done again that day, faster with the Accents And Dialects technique (as `STEP_SPEED` reads an
 * ability), so three or four sessions bring a part's language to complete. Until then it reads on the believability and
 * the execution of the work (`dims`).
 */
export const LANGUAGE_PREP = { start: 0.45, complete: 0.9, gain: 0.4, minutes: 60, dims: ['believability', 'execution'] as readonly Dimension[] } as const;

/** The part's other language by name, where the actor speaks it conversationally and so has it to work on. */
export function languageToWork(person: Person, t: Pick<ProjectTemplate, 'requirements'>): string | undefined {
  const id = t.requirements.language;
  return id && levelIn(person, id) === 'conversational' ? partLanguageName(t) : undefined;
}

/** Where the language part of the preparation stands for this actor and part, or nothing where there's none to prepare. */
export function languagePrepOf(person: Person, t: Pick<ProjectTemplate, 'requirements'>, prep: Pick<PartPrep, 'language'> | undefined): number | undefined {
  return languageToWork(person, t) ? prep?.language ?? LANGUAGE_PREP.start : undefined;
}

/**
 * A piece of work's context with the language part of the preparation in it, where the actor has the part's language to
 * work on: read beside the rest of the preparation on believability and execution, complete at `LANGUAGE_PREP.complete`.
 * Unchanged for a part in English alone, and for a native or fluent speaker.
 */
export function withLanguage<C extends EvalContext>(ctx: C, person: Person, t: Pick<ProjectTemplate, 'requirements'>, prep: Pick<PartPrep, 'language'> | undefined): C {
  const now = languagePrepOf(person, t, prep);
  if (now === undefined) return ctx;
  const extraPrep: Partial<Record<Dimension, readonly string[]>> = { ...(ctx.extraPrep ?? {}) };
  for (const d of LANGUAGE_PREP.dims) extraPrep[d] = [...(extraPrep[d] ?? []), 'language'];
  return { ...ctx, prep: { ...ctx.prep, language: now }, required: { ...ctx.required, language: LANGUAGE_PREP.complete }, extraPrep } as C;
}

/**
 * The language part a booked part starts from: what was done on the sides beyond where the actor started, kept as the
 * other parts are (`WORK.sidesKept`). Nothing where there's no language to prepare.
 */
export function carriedLanguage(person: Person, t: Pick<ProjectTemplate, 'requirements'>, sides: Pick<PartPrep, 'language'> | undefined, kept: number): Pick<PartPrep, 'language'> {
  const was = languagePrepOf(person, t, sides);
  return was === undefined ? {} : { language: r3(LANGUAGE_PREP.start + (was - LANGUAGE_PREP.start) * kept) };
}

/** The step's label, as its button says it: "Work On Your Spanish". */
export const languageStepLabel = (name: string): string => `Work On Your ${name}`;

/** Why the language step can't be done now on these sides or this part, or nothing. */
export function languageStepRefusal(sim: Simulation, person: Person, t: Pick<ProjectTemplate, 'requirements'>, prep: Pick<PartPrep, 'language'> | undefined, minutes: number): string | undefined {
  const name = partLanguageName(t);
  if (!name) return 'The part is in English alone, so there’s no other language to work on.';
  const level = levelIn(person, t.requirements.language!);
  if (!level) return `You don’t speak ${name}, so there’s nothing here you can work on.`;
  if (level !== 'conversational') return `Your ${name} is ${level}, so the part’s ${name} needs no work of its own.`;
  if ((prep?.language ?? LANGUAGE_PREP.start) >= 0.97) return 'You’ve done all this step can do.';
  if (person.awakeSince !== undefined && person.awakeSince > sim.now) return 'You’re asleep.';
  return startRefusal(sim, person, minutes, true);
}

/**
 * The language step done: its time on the clock and at the desk, the language part moved by its gain at the hour's focus,
 * halved for each time it was done today, by the actor's Accents And Dialects, of what's left; and the technique grown a
 * little by the work, as a brief's step grows the ability it's practice in (`BRIEF.trainingWeight`).
 */
export function workOnLanguage(sim: Simulation, person: Person, holder: { prep?: PartPrep }, key: string, minutes: number): { moved: number; part: 'language'; minutes: number } {
  const prep = (holder.prep ??= { interpretation: 0, memorization: 0, rehearsal: 0 });
  const focus = focusAt(sim, person, sim.now);
  const n = repeatsToday(sim, person, `pro:${key}<language`);
  sim.advanceTo(sim.now + minutes * 60_000);
  exerts(person, BRIEF.met.desk, minutes / 60);
  const before = prep.language ?? LANGUAGE_PREP.start;
  const able = STEP_SPEED.least + (STEP_SPEED.most - STEP_SPEED.least) * clamp((person.craft?.accents ?? 0) / MASTERED, 0, 1);
  prep.language = r3(clamp(before + LANGUAGE_PREP.gain * clamp(focus, 0.5, 1.1) * 0.5 ** n * able * (1 - before), 0, 1));
  if (prep.language > before) ordinary(sim, person, 'accents', focus, BRIEF.trainingWeight, 'pro:language');
  return { moved: r3(prep.language - before), part: 'language', minutes };
}

/**
 * What a part's language asks of the actor, as its card says it under The Language: the character's languages, then
 * where the actor stands. Nothing for a part in English alone.
 */
export function languageWords(person: Person, t: Pick<ProjectTemplate, 'requirements'>): string | undefined {
  const name = partLanguageName(t);
  if (!name) return undefined;
  const level = levelIn(person, t.requirements.language!);
  const head = `The character speaks ${name} as well as English.`;
  if (!level) return `${head} You don’t speak ${name}, so you can’t be put up for it.`;
  // Casting reads the weaker of the two languages (`languageDemand`): said where it's short of a native speaker's.
  const closer = languageDemand(person, t).f < LANGUAGE_FIT.native ? ' Casting reads an actor native in both languages as a closer fit.' : '';
  if (level === 'conversational') return `${head} Your ${name} is conversational, so the part takes more preparation: press ${languageStepLabel(name)} with the sides, and again with the part if you’re cast.${closer}`;
  return `${head} Your ${name} is ${level}, so it needs no preparation of its own.${closer}`;
}
