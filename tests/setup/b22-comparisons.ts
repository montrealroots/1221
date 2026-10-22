/**
 * Brief 22's controlled comparisons (T4, docs/verification/career-genre-2026-10-22/criteria.md): the same actor, day,
 * preparation and draw, read with only what they know of genres changed, on every path that reads a work's genres.
 * Shared by `tests/b22-comparisons.test.ts`, which asserts the criteria, and
 * `docs/verification/career-genre-2026-10-22/comparisons.ts`, which writes the table the report quotes.
 *
 * The work asks one genre, crime, which has a direct broad genre (drama) and direct kinds (police procedural among
 * them), so one material reads all five records: nothing known; an unrelated genre (western) at 90; the broad genre
 * at 90 (toward its kind, `parentToKind`); a kind at 90 (toward its broad genre, `kindToParent`); crime itself at 90.
 * TEST SETUP: crime is what the work asks, set by hand at the level each path reads (a play's for the School, a role's
 * for professional work); a practice brief written for crime asks it of itself.
 *
 * Seeds `b22-proof-1` to `-8`, fixed in criteria.md before any outcome was read, never replaced.
 */
import type { Simulation } from '@/engine/core/simulation';
import { PLAY_GENRES, ROLE_GENRES, type GenreWeights } from '@/engine/content/genre-weights';
import { BRIEFS } from '@/engine/content/briefs';
import { briefContext, briefPiece, type BriefRecord } from '@/engine/systems/briefs';
import { judgePiece } from '@/engine/systems/piece';
import { performerOf } from '@/engine/systems/evaluation';
import { relevantGenre, requirementOfRole } from '@/engine/systems/engagement';
import { projectById } from '@/engine/content/careerwork';
import { ENGAGEMENT } from '@/engine/content/engagement';
import { PATHS, actor, casting, knowing, rehearsalLines, type Known, type Material, type Reading } from './genre-proof';

export const SEEDS = ['b22-proof-1', 'b22-proof-2', 'b22-proof-3', 'b22-proof-4', 'b22-proof-5', 'b22-proof-6', 'b22-proof-7', 'b22-proof-8'] as const;
export const ASKED = 'crime';
export const RECORDS: Readonly<Record<'none' | 'unrelated' | 'broad' | 'kind' | 'exact', Known>> = {
  none: {}, unrelated: { western: 90 }, broad: { drama: 90 }, kind: { police_procedural: 90 }, exact: { crime: 90 },
};
export type RecordName = keyof typeof RECORDS;
export const RECORD_NAMES = Object.keys(RECORDS) as RecordName[];

const PLAY = 'Riders To The Sea';
const PROJECT = 'route-nine';
const ASKS: GenreWeights = { [ASKED]: 1 };
const SCHOOL: Material = { name: `${PLAY}, asking crime (TEST SETUP)`, play: PLAY, needs: [[ASKED, 1]], shape: 'single' };
const PRO: Material = { name: 'Static On Route 9, its role asking crime (TEST SETUP)', project: PROJECT, role: ASKS, needs: [[ASKED, 1]], shape: 'single' };

/** TEST SETUP: what the play and the role ask set to crime for one reading, and put back; the play's set in place, as the readers hold it. */
function asking<T>(read: () => T): T {
  const play = PLAY_GENRES[PLAY] as { weights: GenreWeights };
  const roles = ROLE_GENRES as Record<string, { weights: GenreWeights; why: string }>;
  const was = play.weights;
  play.weights = ASKS;
  roles[PROJECT] = { weights: ASKS, why: 'TEST SETUP' };
  try { return read(); } finally { play.weights = was; delete roles[PROJECT]; }
}

/** A practice brief written for crime, taped prepared by an actor of the seed, its whole and its parts. */
function taped(sim: Simulation): Reading {
  const b = BRIEFS.find((x) => x.kinds[0] === ASKED)!;
  const rec: BriefRecord = { prep: { interpretation: 1, memorization: 1, rehearsal: 1 }, takes: [] };
  const reading = b.readings[0]!.id;
  const ctx = { ...briefContext(sim.player, b, rec, { reading }), condition: { readiness: 100 }, key: `b22:${b.id}`, expected: true };
  const e = judgePiece(sim.universe.meta.seed, performerOf(sim, sim.player), ctx, briefPiece(b, { ...rec, reading }, reading));
  const interp = e.dimensions.find((d) => d.dimension === 'interpretation');
  return { part: e.inputs.prep.genre ?? NaN, required: e.inputs.required.genre ?? NaN, prepared: interp?.prepared, interpretation: interp?.quality, overall: e.overall };
}

/** One reading on a path: the genre reading (0 to 1) and what the path made of it. */
export interface Compared { reading: number; part?: number; prepared?: number; interpretation?: number; overall: number }
export const COMPARED_PATHS = ['school casting', 'school night', 'taped brief', 'audition in person', 'self-tape', 'callback', 'work day', 'casting’s fit', 'rehearsal day’s lines'] as const;
export type ComparedPath = (typeof COMPARED_PATHS)[number];

/** A path read for a seed's actor and a record, everything else held. */
export function compare(sim: Simulation, path: ComparedPath, known: Known): Compared {
  return asking(() => knowing(sim.player, known, () => {
    const reading = relevantGenre(sim.player, requirementOfRole(projectById(PROJECT)!)).total;
    if (path === 'casting’s fit') { const c = casting(sim, PRO); return { reading, part: c.genre, overall: c.fit }; }
    if (path === 'rehearsal day’s lines') return { reading, overall: rehearsalLines(sim, PRO) };
    if (path === 'taped brief') return { reading, ...taped(sim) };
    const r = path === 'school casting' || path === 'school night' ? PATHS[path](sim, SCHOOL) : PATHS[path](sim, PRO);
    return { reading, part: Number.isNaN(r.part) ? undefined : r.part, prepared: r.prepared, interpretation: r.interpretation, overall: r.overall };
  }));
}

/** Every path asked, seed and record: the figures the criteria read. */
export function comparisons(paths: readonly ComparedPath[] = COMPARED_PATHS): { path: ComparedPath; seed: string; record: RecordName; figures: Compared }[] {
  const out: { path: ComparedPath; seed: string; record: RecordName; figures: Compared }[] = [];
  for (const seed of SEEDS) {
    const sim = actor(seed);
    for (const path of paths) for (const record of RECORD_NAMES) out.push({ path, seed, record, figures: compare(sim, path, RECORDS[record]) });
  }
  return out;
}

/**
 * TEST SETUP: the comparisons read at other coefficients, and put back: how brief 21's 0.75 and 0.5 and each step
 * toward the coefficients kept were measured. `ENGAGEMENT.related` is read at each reading, so set in place it holds.
 */
export function atCoefficients<T>(kindToParent: number, parentToKind: number, read: () => T): T {
  const related = ENGAGEMENT.related as { kindToParent: number; parentToKind: number };
  const was = { ...related };
  related.kindToParent = kindToParent;
  related.parentToKind = parentToKind;
  try { return read(); } finally { Object.assign(related, was); }
}

export const median = (xs: number[]): number => { const s = [...xs].sort((a, b) => a - b); return s.length % 2 ? s[(s.length - 1) / 2]! : (s[s.length / 2 - 1]! + s[s.length / 2]!) / 2; };

/**
 * The criteria for keeping 0.75 and 0.5 (criteria.md, T4), on the median over the seeds of each path's gain over knowing
 * nothing: (K1) nothing = unrelated < broad < kind < exact; (K2) the kind's gain at most 0.85 of the exact genre's, the
 * broad genre's at most 0.65. 0.75 and 0.5 failed K2 on three paths; 0.65 and 0.40, which hold on every one, replaced
 * them (`content/engagement.ts`).
 */
export function verdict(rows: ReturnType<typeof comparisons>): { path: ComparedPath; gains: Record<RecordName, number>; kindShare: number; broadShare: number; k1: boolean; k2: boolean }[] {
  return COMPARED_PATHS.filter((path) => rows.some((x) => x.path === path)).map((path) => {
    const gains = Object.fromEntries(RECORD_NAMES.map((record) => [record, median(SEEDS.map((seed) => {
      const at = (r: RecordName) => rows.find((x) => x.path === path && x.seed === seed && x.record === r)!.figures.overall;
      return at(record) - at('none');
    }))])) as Record<RecordName, number>;
    const kindShare = gains.exact > 0 ? gains.kind / gains.exact : NaN;
    const broadShare = gains.exact > 0 ? gains.broad / gains.exact : NaN;
    const k1 = gains.none === 0 && gains.unrelated === 0 && gains.broad > 0 && gains.kind > gains.broad && gains.exact > gains.kind;
    return { path, gains, kindShare, broadShare, k1, k2: kindShare <= 0.85 && broadShare <= 0.65 };
  });
}
