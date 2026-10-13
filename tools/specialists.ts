/**
 * SLATE — the specialist question, measured (from 2026-10-12; the owner's brief of that day, section 6).
 *
 * The attributes-and-genres pass found an actor strong in the feeling abilities ahead of an even actor of the same
 * budget on 145 of 149 briefs, and one strong in the body and the voice ahead on none. This separates what that
 * bundled: physical from vocal, ability allocation from technique allocation, shared competence from specialized, and
 * the medium's demands, across every piece of work the game judges, with the weakest-dimension term's share apart.
 *
 *   npx vite-node tools/specialists.ts            writes docs/verification/connected-journey/SPECIALISTS.md and .json
 *
 * The actors (TEST SETUP, levels set directly), each with the same budget as the even actor:
 * - abilities: twelve summing 600 (the even actor 50 each); a specialist at 85 on its specialty, the rest lowered
 *   evenly to keep the sum;
 * - techniques: seventeen at 50 each; a technique specialist at 85 on its kind's, the rest lowered to keep the sum.
 * Ability allocation is measured with techniques even, and technique allocation with abilities even, so each shows
 * alone. Every piece is fully prepared, on a sufficient day, with no draw (the expected result), in its best reading
 * for a brief: what the actor would bring if all went to plan.
 *
 * The pieces: every practice brief (judged in its beats), every scene a course can set and every play (each judged in
 * its parts), and casting's own read of a play (stamina and discipline counted full, as the chair reads them).
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { BRIEFS, type Brief } from '../src/engine/content/briefs';
import { TECHNIQUES } from '../src/engine/content/abilities';
import { PLAY_MATERIAL, SCENE_MATERIAL, type MaterialProfile } from '../src/engine/content/material';
import { EVALUATION, TASK_PROFILES, type Dimension } from '../src/engine/content/tasks';
import { PIECE } from '../src/engine/content/piece';
import type { Person } from '../src/engine/domain/model';
import { briefContext, briefPiece, type BriefRecord } from '../src/engine/systems/briefs';
import { type Evaluation, type EvalContext, type Performer } from '../src/engine/systems/evaluation';
import { judgePiece, loadOf, pieceWeights, toneSegments, type PieceSpec } from '../src/engine/systems/piece';
import { materialContext } from '../src/engine/systems/material';
import { castingPerformer } from '../src/engine/systems/school';

const ABILITIES = ['emotionalDepth', 'presence', 'listening', 'imagination', 'focus', 'memory', 'adaptability', 'composure', 'vocal', 'physical', 'discipline', 'stamina'] as const;
type Ab = (typeof ABILITIES)[number];
const nobody = { engagement: { byGenre: {} } } as unknown as Person;
const rec: BriefRecord = { prep: { interpretation: 1, memorization: 1, rehearsal: 1 }, takes: [] };

function actor(strong: readonly Ab[], techs: readonly string[]): Performer {
  const aRest = (600 - 85 * strong.length) / (ABILITIES.length - strong.length);
  const tRest = (50 * TECHNIQUES.length - 85 * techs.length) / (TECHNIQUES.length - techs.length);
  return { ability: (id) => (strong.includes(id as Ab) ? 85 : aRest), full: () => 100, technique: (s) => (techs.includes(s) ? 85 : tRest) };
}
const EVEN = actor([], []);

/** Each specialty: its abilities, the techniques of its kind, and what a piece is built on it by. */
const SPECIALTIES: Record<string, { abilities: Ab[]; techniques: string[]; builtOn: (m: MaterialProfile) => boolean }> = {
  physical: { abilities: ['physical'], techniques: ['combat', 'dance'], builtOn: (m) => m.physical >= 2 },
  vocal: { abilities: ['vocal'], techniques: ['singing', 'voiceover', 'speech'], builtOn: (m) => m.vocal >= 2 || m.medium === 'voice' },
  stamina: { abilities: ['stamina'], techniques: [], builtOn: (m) => m.physical + m.vocal >= 4 },
  presence: { abilities: ['presence'], techniques: ['screen'], builtOn: (m) => m.medium !== 'voice' },
  feeling: { abilities: ['emotionalDepth'], techniques: ['scene', 'character'], builtOn: (m) => m.tones.includes('grave') },
  'feeling bundle': { abilities: ['emotionalDepth', 'composure', 'imagination', 'presence'], techniques: ['scene', 'screen', 'classical'], builtOn: (m) => m.tones.includes('grave') },
  'body bundle': { abilities: ['physical', 'stamina', 'vocal', 'presence'], techniques: ['combat', 'dance', 'singing', 'clown'], builtOn: (m) => m.physical + m.vocal >= 3 },
  'body, no presence': { abilities: ['physical', 'stamina', 'vocal'], techniques: ['combat', 'dance', 'singing'], builtOn: (m) => m.physical + m.vocal >= 3 },
  partner: { abilities: ['listening', 'adaptability'], techniques: ['improv', 'comedy'], builtOn: (m) => m.partner >= 3 || m.improvisation >= 2 },
};

interface Piece { kind: 'brief' | 'scene' | 'night' | 'casting'; id: string; material: MaterialProfile; judge: (p: Performer) => Evaluation; weights: Partial<Record<Dimension, number>> }

function briefJudge(b: Brief): Piece {
  const m = { ...b, tones: [...new Set(b.beats.flatMap((x) => x.tones))], turns: 0 } as unknown as MaterialProfile;
  const judge = (p: Performer) => {
    // Its best reading for this actor: the choice the actor would make.
    let best: Evaluation | undefined;
    for (const r of b.readings) {
      const ctx = { ...briefContext(nobody, b, rec, { reading: r.id, prep: { interpretation: 1, memorization: 1, rehearsal: 1, genre: 1 } }), condition: { readiness: 100 }, key: `sp:${b.id}`, expected: true };
      const e = judgePiece('specialists', p, ctx, briefPiece(b, { ...rec, reading: r.id }));
      if (!best || e.overall > best.overall) best = e;
    }
    return best!;
  };
  const ctx0 = briefContext(nobody, b, rec, { reading: b.readings[0]!.id });
  return { kind: 'brief', id: b.id, material: m, judge, weights: pieceWeights(ctx0.task, ctx0.lean, briefPiece(b, { ...rec, reading: b.readings[0]!.id })) };
}

function workJudge(m: MaterialProfile, kind: 'scene' | 'night' | 'casting'): Piece {
  const task = kind === 'scene' ? TASK_PROFILES.scene! : TASK_PROFILES.performance!;
  const read = materialContext(task, m);
  const prep: Record<string, number> = kind === 'scene' ? { familiarity: 1, memorization: 1, interpretation: 1, rehearsal: 1, partner: 1 } : kind === 'night' ? { lines: 1, blocking: 1, notes: 1 } : {};
  const ctx: EvalContext = { task, techniques: { scene: 1, ...(m.techniques ?? {}) }, prep, required: Object.fromEntries(Object.keys(prep).map((k) => [k, 0.9])), difficulty: 0, condition: { readiness: 100 }, lean: read.lean, inputs: read.inputs, key: `sp:${m.id}`, expected: true };
  const spec: PieceSpec = { segments: toneSegments(m.tones, kind === 'scene' ? 1 : 2), work: [], part: kind === 'scene' ? 'rehearsal' : 'blocking', perTurn: kind === 'scene' ? PIECE.scene.perTurn : 0, perBlend: 0, most: kind === 'scene' ? PIECE.scene.most : 1, load: loadOf(m, kind === 'scene' ? 'scene' : 'night') };
  return { kind, id: m.id, material: m, judge: (p) => judgePiece('specialists', kind === 'casting' ? castingPerformer(p) : p, ctx, spec), weights: pieceWeights(task, read.lean, spec) };
}

const PIECES: Piece[] = [
  ...BRIEFS.map(briefJudge),
  ...SCENE_MATERIAL.map((m) => workJudge(m, 'scene')),
  ...PLAY_MATERIAL.map((m) => workJudge(m, 'night')),
  ...PLAY_MATERIAL.map((m) => workJudge(m, 'casting')),
];

const r2 = (x: number) => Math.round(x * 100) / 100;
/** The parts of an overall: the weighted mean's share and the weakest dimension's. */
function parts(e: Evaluation, weights: Partial<Record<Dimension, number>>) {
  const w = e.dimensions.reduce((a, d) => a + (weights[d.dimension] ?? 0), 0) || 1;
  const mean = e.dimensions.reduce((a, d) => a + d.quality * (weights[d.dimension] ?? 0), 0) / w;
  const weakest = Math.min(...e.dimensions.map((d) => d.quality));
  return { mean: EVALUATION.meanShare * mean, weakest: (1 - EVALUATION.meanShare) * weakest };
}

interface Row { specialty: string; allocation: 'abilities' | 'techniques'; kind: Piece['kind']; subset: 'all' | 'built on it' | 'not built on it'; n: number; ahead: number; mean: number; min: number; max: number; fromMean: number; fromWeakest: number }
const rows: Row[] = [];
const evenCache = new Map<string, Evaluation>();
const evenOf = (pc: Piece) => { const k = `${pc.kind}:${pc.id}`; let e = evenCache.get(k); if (!e) { e = pc.judge(EVEN); evenCache.set(k, e); } return e; };

for (const [name, s] of Object.entries(SPECIALTIES)) {
  for (const allocation of ['abilities', 'techniques'] as const) {
    if (allocation === 'techniques' && !s.techniques.length) continue;
    const p = allocation === 'abilities' ? actor(s.abilities, []) : actor([], s.techniques);
    for (const kind of ['brief', 'scene', 'night', 'casting'] as const) {
      const list = PIECES.filter((x) => x.kind === kind);
      const d = list.map((pc) => {
        const e = pc.judge(p);
        const g = evenOf(pc);
        const a = parts(e, pc.weights), b = parts(g, pc.weights);
        return { built: s.builtOn(pc.material), diff: e.overall - g.overall, fromMean: a.mean - b.mean, fromWeakest: a.weakest - b.weakest };
      });
      for (const subset of ['all', 'built on it', 'not built on it'] as const) {
        const xs = d.filter((x) => subset === 'all' || (subset === 'built on it') === x.built);
        if (!xs.length) continue;
        rows.push({
          specialty: name, allocation, kind, subset, n: xs.length, ahead: xs.filter((x) => x.diff > 0.05).length,
          mean: r2(xs.reduce((a, x) => a + x.diff, 0) / xs.length), min: r2(Math.min(...xs.map((x) => x.diff))), max: r2(Math.max(...xs.map((x) => x.diff))),
          fromMean: r2(xs.reduce((a, x) => a + x.fromMean, 0) / xs.length), fromWeakest: r2(xs.reduce((a, x) => a + x.fromWeakest, 0) / xs.length),
        });
      }
    }
  }
}

const dir = 'docs/verification/connected-journey';
mkdirSync(dir, { recursive: true });
writeFileSync(`${dir}/specialists.json`, `${JSON.stringify({ measured: 'tools/specialists.ts', budget: { abilities: 600, techniques: 50 * TECHNIQUES.length }, rows }, null, 1)}\n`);
const table = (kind: Piece['kind']) => [
  `| Specialty | Allocation | Pieces | Ahead | Mean | Range | From The Mean | From The Weakest |`,
  `|---|---|---|---|---|---|---|---|`,
  ...rows.filter((r) => r.kind === kind).map((r) => `| ${r.specialty}${r.subset === 'all' ? '' : `, ${r.subset}`} | ${r.allocation} | ${r.n} | ${r.ahead} | ${r.mean} | ${r.min} to ${r.max} | ${r.fromMean} | ${r.fromWeakest} |`),
].join('\n');
writeFileSync(`${dir}/SPECIALISTS.md`, `# The Specialist Question, Measured

Written by \`tools/specialists.ts\`. Every figure is the specialist's expected result less the even actor's, at the same budget, fully
prepared on a sufficient day with no draw, a brief in its best reading for each. "Ahead" counts pieces where the
specialist is ahead by more than 0.05. "From The Mean" and "From The Weakest" split the difference between the whole's
two parts: ${EVALUATION.meanShare} times the weighted mean of the dimensions, and ${1 - EVALUATION.meanShare} times the weakest.

The budget: abilities sum 600 (twelve at 50 for the even actor); a specialist has 85 on its specialty and the rest
lowered evenly. Techniques are seventeen at 50; a technique specialist has 85 on its kind's. Ability allocation is
measured with techniques even, technique allocation with abilities even.

## Practice Briefs

${table('brief')}

## Scenes For Class

${table('scene')}

## Nights On Stage

${table('night')}

## Casting's Read Of A Play

${table('casting')}
`);
console.log(`wrote ${dir}/SPECIALISTS.md (${rows.length} rows)`);
for (const r of rows.filter((x) => x.subset !== 'not built on it')) console.log(`${r.kind.padEnd(7)} ${r.specialty.padEnd(18)} ${r.allocation.padEnd(10)} ${r.subset.padEnd(12)} n=${String(r.n).padStart(3)} ahead=${String(r.ahead).padStart(3)} mean=${String(r.mean).padStart(6)} mean-part=${r.fromMean} weakest-part=${r.fromWeakest}`);
