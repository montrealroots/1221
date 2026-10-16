/**
 * SLATE — the judged pieces the acting criteria are measured on (from 2026-10-16, brief 10;
 * docs/verification/decisions-2026-10-16/criteria.md, section 1). A read-only module the measuring tools share
 * (`tools/ag-baseline.ts`'s H4-R section, `tools/monotonicity.ts`, `tools/brief-journeys.ts`'s fixed set), so each
 * judges a piece the same way. It sets no save and plays no command.
 *
 * Each piece is judged as `tools/ag-baseline.ts` has judged it since phase 1 (the same task, preparation, difficulty,
 * segments, load and techniques), with one difference the criteria ask for: a brief is a piece in each of its readings
 * (H4-R, "briefs and their readings"), where ag-baseline's own sections take the mean of its readings. Every piece is
 * fully prepared, with every axis of the way of playing left open (a way every piece takes: the checklist's reading of
 * "its fitting way"), on a sufficient day (readiness 100), with no draw, unless a caller asks otherwise.
 */
import { BRIEFS, BRIEF_BY_ID } from '../src/engine/content/briefs';
import { PLAY_MATERIAL, SCENE_MATERIAL, type MaterialProfile } from '../src/engine/content/material';
import { TASK_PROFILES, TEMPLATE_TASK } from '../src/engine/content/tasks';
import { TEMPLATES, templateById } from '../src/engine/content/coursework';
import { PIECE } from '../src/engine/content/piece';
import type { Person } from '../src/engine/domain/model';
import { briefContext, briefPiece, type BriefRecord } from '../src/engine/systems/briefs';
import { judge, type EvalContext, type Evaluation, type Performer } from '../src/engine/systems/evaluation';
import { judgePiece, loadOf, type PieceSpec, unitSegments } from '../src/engine/systems/piece';
import { materialContext } from '../src/engine/systems/material';
import { castingPerformer, NIGHT_DIFFICULTY } from '../src/engine/systems/school';
import { difficultyOf } from '../src/engine/systems/coursework';

export type Kind = 'brief' | 'scene' | 'night' | 'casting' | 'coursework';
export const KINDS: readonly Kind[] = ['brief', 'scene', 'night', 'casting', 'coursework'];

/** One judged piece: what kind, which, and how it's judged by a performer (`key` gives the draw; none, no draw). */
export interface Piece { kind: Kind; id: string; judge: (p: Performer, o?: { key?: string }) => Evaluation; material?: MaterialProfile }

const nobody = { engagement: { byGenre: {} } } as unknown as Person;
const SEED = 'ag-baseline';
const rec = (p: number): BriefRecord => ({ prep: { interpretation: p, memorization: p, rehearsal: p }, takes: [] });

/** A brief in one reading, as `tools/ag-baseline.ts`'s `briefScore` judges it with no way of playing chosen. */
export function briefReadingPiece(briefId: string, reading: string): Piece {
  const b = BRIEF_BY_ID[briefId]!;
  return {
    kind: 'brief', id: `${b.id}/${reading}`,
    judge: (p, o = {}) => {
      const ctx = briefContext(nobody, b, rec(1), { reading, prep: { genre: 1 } });
      return judgePiece(SEED, p, { ...ctx, condition: { readiness: 100 }, key: o.key ?? `ag:${b.id}`, ...(o.key ? {} : { expected: true }) }, briefPiece(b, { ...rec(1), reading }));
    },
  };
}

/** A class scene (Scene Study's task and difficulty), a night (a supporting part at the School) or casting's read of a play. */
export function workPiece(m: MaterialProfile, kind: 'scene' | 'night' | 'casting'): Piece {
  const task = kind === 'scene' ? TASK_PROFILES.scene! : TASK_PROFILES.performance!;
  const read = materialContext(task, m);
  const prep: Record<string, number> = kind === 'scene' ? { familiarity: 1, memorization: 1, interpretation: 1, rehearsal: 1, partner: 1 } : kind === 'night' ? { lines: 1, blocking: 1, notes: 1 } : {};
  const difficulty = kind === 'scene' ? difficultyOf(templateById('scene-study')!) : kind === 'night' ? NIGHT_DIFFICULTY.school.supporting : 0;
  const spec: PieceSpec = { segments: unitSegments(m, 2), work: [], part: kind === 'scene' ? 'rehearsal' : 'blocking', perTurn: kind === 'scene' ? PIECE.scene.perTurn : 0, perBlend: 0, most: kind === 'scene' ? PIECE.scene.most : 1, load: loadOf(m, kind === 'scene' ? 'scene' : 'night') };
  return {
    kind, id: m.id, material: m,
    judge: (p, o = {}) => {
      const ctx: EvalContext = { task, techniques: { scene: 1, ...(m.techniques ?? {}) }, prep: { ...prep }, required: Object.fromEntries(Object.keys(prep).map((k) => [k, 0.9])), difficulty, condition: { readiness: 100 }, lean: read.lean, inputs: read.inputs, key: o.key ?? `ag:${kind}:${m.id}`, ...(o.key ? {} : { expected: true }) };
      return judgePiece(SEED, kind === 'casting' ? castingPerformer(p) : p, ctx, spec);
    },
  };
}

/** A coursework template not judged as a scene, as `judgeWork` judges one with its template's reads and par. */
export function courseworkPiece(id: string): Piece {
  const t = templateById(id)!;
  const task = TASK_PROFILES[TEMPLATE_TASK[id] ?? 'scene']!;
  const parts = [...new Set(Object.values(task.dims).flatMap((d) => d!.prep ?? []))];
  return {
    kind: 'coursework', id,
    judge: (p, o = {}) => judge(SEED, p, { task, techniques: { ...t.reads }, prep: Object.fromEntries(parts.map((k) => [k, 1])), required: Object.fromEntries(parts.map((k) => [k, 0.9])), difficulty: difficultyOf(t), condition: { readiness: 100 }, key: o.key ?? `ag:cw:${id}`, ...(o.key ? {} : { expected: true }) }),
  };
}

/** Every judged piece in scope (H4-R): every brief in each reading, every class scene, every night, every casting read, every coursework template not a scene. */
export const ALL_PIECES: readonly Piece[] = [
  ...BRIEFS.flatMap((b) => b.readings.map((r) => briefReadingPiece(b.id, r.id))),
  ...SCENE_MATERIAL.map((m) => workPiece(m, 'scene')),
  ...PLAY_MATERIAL.map((m) => workPiece(m, 'night')),
  ...PLAY_MATERIAL.map((m) => workPiece(m, 'casting')),
  ...TEMPLATES.filter((t) => (TEMPLATE_TASK[t.id] ?? 'scene') !== 'scene').map((t) => courseworkPiece(t.id)),
];

/**
 * L3-R's fixed set of 24 (criteria.md, L3-R (a)), named in the judge area's checklist before any measurement, by kind
 * and spread and not by outcome: eight briefs at their first reading, one for each of eight registers' first concerns;
 * eight class scenes across drama, comedy, tragedy, the Greeks, a scored and a house scene and an original; four nights
 * and four casting reads, a one-act among the nights.
 */
export const FIXED_SET: readonly { kind: Kind; id: string }[] = [
  ...['brief-art_house', 'brief-comedy', 'brief-drama', 'brief-musical', 'brief-horror', 'brief-legal_drama', 'brief-thriller', 'brief-social_realism'].map((id) => ({ kind: 'brief' as const, id })),
  ...['seagull-4', 'earnest-2', 'hamlet-3-1', 'antigone-441', 'dream-3-2', 'scapin-3-2', 'henry5-4-3', 'orig-office-hours'].map((id) => ({ kind: 'scene' as const, id })),
  ...['The Bear', 'Three Sisters', 'Macbeth', 'Hedda Gabler'].map((id) => ({ kind: 'night' as const, id })),
  ...['Twelfth Night', 'Julius Caesar', 'Trifles', 'Tartuffe'].map((id) => ({ kind: 'casting' as const, id })),
];

/** The fixed set as pieces: a brief at its first reading, a scene, night or casting by its material. */
export function fixedPieces(): Piece[] {
  return FIXED_SET.map(({ kind, id }) => {
    if (kind === 'brief') return briefReadingPiece(id, BRIEF_BY_ID[id]!.readings[0]!.id);
    const m = (kind === 'scene' ? SCENE_MATERIAL : PLAY_MATERIAL).find((x) => x.id === id);
    if (!m) throw new Error(`L3-R's fixed set names ${kind} ${id}, which the catalog doesn't hold`);
    return workPiece(m, kind as 'scene' | 'night' | 'casting');
  });
}
