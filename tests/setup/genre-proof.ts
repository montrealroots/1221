/**
 * Brief 21's genre proof (P1): the same actor, on the same day, with the same preparation and the same draw, read with
 * only what they know of genres changed. Shared by `tests/b21-genre-proof.test.ts`, which asserts it, and
 * `docs/verification/genre-banking-2026-10-22/genre-proof.ts`, which writes the table the report quotes.
 *
 * Every expected figure here is worked from the rule as the briefs and the code's comments state it, written as
 * literals, never asked of `resolveGenres` or `relevantGenre`: a work's requirement as the material states it
 * (`content/genre-weights.ts`, from brief 22; until then the first-listed genre half where it had two or more, the rest
 * sharing the other half, and each figure here was that rule's); a broad genre listed beside its own kind counted as
 * that kind; a requirement met by the genre itself whole, by a direct kind of it at 0.65, by its direct broad genre at
 * 0.4 (0.75 and 0.5 until brief 22's measurement), by anything else not at all, the genre's own and the best related
 * credit together (brief 22); complete at 90
 * (`ENGAGEMENT.genreComplete`), and with none of it the choices stand at 75% (`EVALUATION.partFloor.genre`).
 */

import { createSave } from '@/engine';
import { newLifeConfig } from '@/engine/world/bootstrap';
import type { Simulation } from '@/engine/core/simulation';
import type { Person } from '@/engine/domain/model';
import { evaluate, performerOf, type Evaluation } from '@/engine/systems/evaluation';
import { castFit, nightEvaluation } from '@/engine/systems/school';
import { auditionContext, chanceOf, fitOf, rehearseDay, workContext } from '@/engine/systems/projobs';
import { projectById } from '@/engine/content/careerwork';
import { REP_PLAYS, SHAKESPEARE_PLAYS, SUMMER_PLAYS, THESIS_PLAYS } from '@/engine/content/plays';
import type { AuditionRound, Engagement, Opportunity } from '@/engine/systems/pro';
import type { GenreState } from '@/engine/systems/engagement';
import { ROLE_GENRES, type GenreWeights } from '@/engine/content/genre-weights';

/** The documented seed set: six actors, each a new life's, drawn by the game from its seed. */
export const SEEDS = ['b21-proof-1', 'b21-proof-2', 'b21-proof-3', 'b21-proof-4', 'b21-proof-5', 'b21-proof-6'] as const;
/** Low, medium and the most that counts (complete at 90), each the relevant genres' figure. */
export const LEVELS = { low: 0, medium: 45, max: 90 } as const;

/** A material's requirements as the rule weighs them, worked by hand: [genre, weight]. */
export interface Material {
  name: string;
  /** Where its genres come from: a play by title, a project by id, or a project's role given its own by hand (TEST SETUP). */
  play?: string;
  project?: string;
  role?: GenreWeights;
  /** The requirements, by hand, with what each is, the heaviest first. */
  needs: readonly (readonly [string, number])[];
  shape: 'single' | 'even two' | 'uneven two' | 'three' | 'overlapping';
}

/** The School's plays the proof reads, each a shape the brief names. */
export const PLAYS: readonly Material[] = [
  { name: 'Riders To The Sea', play: 'Riders To The Sea', needs: [['tragedy', 1]], shape: 'single' },
  // Stated 1 and 1 (brief 22). Brief 21's proof read Blood Wedding here, half and half by its first-listed rule.
  { name: 'Measure For Measure', play: 'Measure For Measure', needs: [['political_drama', 0.5], ['tragicomedy', 0.5]], shape: 'even two' },
  // Stated 3 and 2 (brief 22); brief 21's rule gave tragedy and romantic drama half each.
  { name: 'Blood Wedding', play: 'Blood Wedding', needs: [['tragedy', 0.6], ['romantic_drama', 0.4]], shape: 'uneven two' },
  // Stated 3, 1 and 1 (brief 22); brief 21's, tragedy half and the others a quarter.
  { name: 'Macbeth', play: 'Macbeth', needs: [['tragedy', 0.6], ['historical_drama', 0.2], ['supernatural', 0.2]], shape: 'three' },
  // Its tags list comedy beside romantic comedy, one demand said twice; stated romantic comedy 3 and fairy tale 2 (brief
  // 22), where brief 21's rule folded comedy's first-listed half into romantic comedy, 0.75 and 0.25.
  { name: 'A Midsummer Night’s Dream', play: 'A Midsummer Night’s Dream', needs: [['romantic_comedy', 0.6], ['fairy_tale', 0.4]], shape: 'overlapping' },
];

/**
 * The professional projects: every one asks one genre, its tags a kind beside its broad genre; and the role given its
 * own requirement by hand, as no role in the game asks other than its project (`ROLE_GENRES`). Until brief 22 the
 * hand-set ones were the project's list set by hand, read by the first-listed rule.
 */
export const PROJECTS_READ: readonly Material[] = [
  { name: 'Static On Route 9', project: 'route-nine', needs: [['psychological_horror', 1]], shape: 'overlapping' },
  { name: 'The Calloway Files', project: 'calloway-files', needs: [['police_procedural', 1]], shape: 'overlapping' },
  { name: 'Last Bus To Eastview', project: 'eastview', needs: [['romantic_comedy', 1]], shape: 'single' },
  { name: 'A House On Calder Street', project: 'calder-street', needs: [['domestic_drama', 1]], shape: 'overlapping' },
  // TEST SETUP: Static On Route 9's role, Jess, given its own by hand; the project, the role and the draw are its own.
  { name: 'Static On Route 9, its role asking horror and comedy evenly', project: 'route-nine', role: { horror: 1, comedy: 1 }, needs: [['comedy', 0.5], ['horror', 0.5]], shape: 'even two' },
  { name: 'Static On Route 9, its role asking horror, comedy and romance', project: 'route-nine', role: { horror: 2, comedy: 1, romance: 1 }, needs: [['horror', 0.5], ['comedy', 0.25], ['romance', 0.25]], shape: 'three' },
];

/** A genre nothing the proof reads is related to. */
export const UNRELATED = 'western';

/** What a person knows, as the comparisons set it: every requirement at a level, or by name. */
export type Known = Record<string, number>;
export const atLevel = (m: Material, level: number): Known => Object.fromEntries(m.needs.map(([g]) => [g, level]));
/** The weighed total the rule gives a record, worked from the hand weights and the levels set (direct knowledge only). */
export const expectedTotal = (m: Material, known: Known): number => Math.min(1, m.needs.reduce((a, [g, w]) => a + w * (known[g] ?? 0) / 100, 0));

const allPlays = [...THESIS_PLAYS, ...SHAKESPEARE_PLAYS, ...SUMMER_PLAYS, ...REP_PLAYS] as readonly { title: string; reads: object; kinds?: readonly string[] }[];
export const playOfTitle = (title: string) => allPlays.find((p) => p.title === title)!;

/** A new life's actor for a seed: the same config but the seed. */
export function actor(seed: string): Simulation {
  return createSave(1, seed, { ...newLifeConfig(), homeRegionId: 'us-ny-newyork', firstName: 'Ada', lastName: 'Cole', pronouns: 'she/her' });
}

/** TEST SETUP: what the person knows of genres, and nothing else, set for one reading and put back after. */
export function knowing<T>(person: Person, known: Known, read: () => T): T {
  const was = person.engagement;
  const byGenre: Record<string, GenreState> = {};
  for (const [g, v] of Object.entries(known)) byGenre[g] = { familiarity: v, practice: 0 };
  person.engagement = { byGenre };
  try { return read(); } finally { person.engagement = was; }
}

/** TEST SETUP: a role's own requirement set by hand for one reading, and put back. */
export function listed<T>(m: Material, read: () => T): T {
  if (!m.role || !m.project) return read();
  const roles = ROLE_GENRES as Record<string, { weights: GenreWeights; why: string }>;
  const was = roles[m.project];
  roles[m.project] = { weights: m.role, why: 'TEST SETUP' };
  try { return read(); } finally { if (was) roles[m.project] = was; else delete roles[m.project]; }
}

/** What a reading shows: the genre part as the evaluation took it, the choices' preparation, the choices' quality and the whole. */
export interface Reading { part: number; required: number; prepared?: number; interpretation?: number; overall: number }
const fromEvaluation = (e: Evaluation): Reading => {
  const interp = e.dimensions.find((d) => d.dimension === 'interpretation');
  return { part: e.inputs.prep.genre ?? NaN, required: e.inputs.required.genre ?? NaN, prepared: interp?.prepared, interpretation: interp?.quality, overall: e.overall };
};

/** The paths, each read with everything but the genres held: complete preparation, the same key and so the same draw. */
export const PATHS = {
  /** The School's casting: the fit, a night of the play as expected (`castFit`). */
  'school casting': (sim: Simulation, m: Material): Reading => {
    const play = playOfTitle(m.play!);
    const overall = castFit(sim, performerOf(sim, sim.player), play.reads, [], `proof:${m.name}`, m.play, sim.player);
    return { part: NaN, required: NaN, overall };
  },
  /** A night of the play at the School, the part complete (TEST SETUP: a thesis's process, every call kept and every note taken). */
  'school night': (sim: Simulation, m: Material): Reading => {
    const holder = { play: m.play, kind: 'thesis' as const, process: { lines: 1, blocking: 1, blockingMissed: 0, calls: 20, of: 20, notes: [], trained: 0 } };
    return fromEvaluation(nightEvaluation(sim, sim.player, `proof:${m.name}`, holder, sim.now, 'lead'));
  },
  'audition in person': (sim: Simulation, m: Material): Reading => round(sim, m, 'audition', 'in-person'),
  'self-tape': (sim: Simulation, m: Material): Reading => round(sim, m, 'audition', 'self-tape'),
  'callback': (sim: Simulation, m: Material): Reading => round(sim, m, 'callback', 'in-person'),
  /** A shoot day, or a night of a stage run: the project's own kind of work day, the part complete. */
  'work day': (sim: Simulation, m: Material): Reading => {
    const t = projectById(m.project!)!;
    const day = t.schedule.kind === 'run' ? t.schedule.rehearsalWeeks * 5 : 0;
    const e = { id: `proof-${m.project}`, prep: { interpretation: 1, memorization: 1, rehearsal: 1 } } as unknown as Engagement;
    return fromEvaluation(evaluate(sim, sim.player, workContext(sim, sim.player, e, t, day)));
  },
} as const;
export type PathName = keyof typeof PATHS;
export const SCHOOL_PATHS: readonly PathName[] = ['school casting', 'school night'];
export const PRO_PATHS: readonly PathName[] = ['audition in person', 'self-tape', 'callback', 'work day'];

function round(sim: Simulation, m: Material, which: AuditionRound['round'], form: AuditionRound['form']): Reading {
  const o = { id: `proof-${m.project}`, projectId: m.project!, prep: { interpretation: 1, memorization: 1, rehearsal: 1 } } as unknown as Opportunity;
  const r = { round: which, form, at: sim.now, status: 'set' } as AuditionRound;
  return fromEvaluation(evaluate(sim, sim.player, auditionContext(sim, sim.player, o, r, which === 'callback' ? 1 : 0)));
}

/** Casting's reading of the actor for a professional role: the fit's genre half, the fit, and the chance it gives a Strong final round. */
export function casting(sim: Simulation, m: Material): { genre: number; fit: number; chance: number } {
  const t = projectById(m.project!)!;
  const f = fitOf(sim.player, t);
  return { genre: f.genre, fit: f.fit, chance: chanceOf('strong', f.fit, t.kind, 'final') };
}

/** A professional rehearsal day's lines, from none: what `rehearseDay` moves them by. */
export function rehearsalLines(sim: Simulation, m: Material): number {
  const t = projectById(m.project!)!;
  const e = { id: `proof-${m.project}`, prep: { interpretation: 0, memorization: 0, rehearsal: 0 } } as unknown as Engagement;
  rehearseDay(sim.player, e, t);
  return e.prep!.memorization;
}
