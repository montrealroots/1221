/**
 * SLATE — every genre, from the code, as a row (from 2026-10-16; phase 1 of the attributes-and-genres brief). A
 * read-only harness beside `tools/ag-baseline.ts`, whose JSON it reads for each genre's winner and nearest neighbor:
 * it writes docs/verification/attributes-genres-2026-10-16/genres-matrix.json and nothing else.
 *
 *   npx vite-node tools/ag-baseline.ts     (first)
 *   npx vite-node tools/ag-genres.ts
 *
 * Each row: the genre's families and the lean they'd give (`EVALUATION.familyLean`, read only by a play with no
 * profile), its researched demands and whether they're applied (`content/demands.ts`), the plays of its kind the game
 * has, its briefs (written for it, and listing it), and for each brief what the engine reads: medium, size, stakes,
 * the reader's way of playing, the five features, the language, the beats' tones, the techniques its take reads, its
 * readings' leans and draws, what the brief asks most (`asksOf`'s heaviest dimension for its first reading), and which
 * of thirteen equal-budget actors comes out best (baseline §3).
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { BRIEFS, briefsOf } from '../src/engine/content/briefs';
import { GENRE_DEFS } from '../src/engine/content/genres';
import { GENRE_BY_ID } from '../src/engine/content/film-genres';
import { EVALUATION } from '../src/engine/content/tasks';
import { GENRE_DEMANDS, applied, genreTags, DEMAND_TECHNIQUE } from '../src/engine/content/demands';
import { REP_PLAYS, SHAKESPEARE_PLAYS, SUMMER_PLAYS, THESIS_PLAYS } from '../src/engine/content/plays';
import type { Person } from '../src/engine/domain/model';
import { asksOf, tapeReadsOf, turnsOf, taskOf } from '../src/engine/systems/briefs';

const DIR = 'docs/verification/attributes-genres-2026-10-16';
const base = JSON.parse(readFileSync(`${DIR}/baseline.json`, 'utf8'));
const nobody = { engagement: { byGenre: {} }, briefs: {} } as unknown as Person;
const PLAYS = [...THESIS_PLAYS, ...SHAKESPEARE_PLAYS, ...REP_PLAYS, ...SUMMER_PLAYS] as { title: string; kinds?: readonly string[] }[];
const nearest = new Map<string, { nearest: string; distance: number; withinOwnBriefs: number }>();
for (const x of base.genres.distance.nearestAll) nearest.set(x.genre, x);

const rows = Object.keys(GENRE_DEFS).map((g) => {
  const def = GENRE_DEFS[g]!;
  const dem = GENRE_DEMANDS[g];
  const own = briefsOf(g).filter((b) => b.kinds[0] === g);
  const listed = briefsOf(g).filter((b) => b.kinds[0] !== g);
  const lean = def.families.map((f) => EVALUATION.familyLean[f]).filter(Boolean);
  return {
    id: g, label: GENRE_BY_ID[g]?.label ?? g, families: def.families,
    familyLean: lean.length ? lean : 'none',
    conventionsSource: def.how,
    demands: dem ? { confidence: dem.confidence, applied: applied(g), tags: dem.tags.map((t) => `${t.tag}→${DEMAND_TECHNIQUE[t.tag]}`), belongsTo: dem.belongsTo ?? null } : null,
    appliedTechniques: genreTags(g).map((t) => DEMAND_TECHNIQUE[t]),
    playsOfKind: PLAYS.filter((p) => (p.kinds ?? []).includes(g)).map((p) => p.title),
    briefs: own.map((b) => {
      const t = turnsOf(b);
      const asks = asksOf(nobody, b, b.readings[0]!.id);
      return {
        id: b.id, title: b.title, task: taskOf(b).id, medium: b.medium, size: b.size, stakes: b.stakes ?? 1, readerPlays: b.medium === 'voice' ? 'none' : b.readerPlays ?? 'steady',
        features: { timing: b.timing, physical: b.physical, partner: b.partner, vocal: b.vocal, improvisation: b.improvisation }, language: b.language,
        beats: b.beats.map((x) => x.tones.join('+')), transitions: t.transitions, blends: t.blends,
        techniques: tapeReadsOf(b), allows: b.allows ?? {},
        objective: b.objective, obstacle: b.obstacle,
        heaviest: `${asks[0]!.label} ${Math.round(asks[0]!.share * 100)}%`,
        readings: b.readings.map((r) => ({ id: r.id, label: r.label, lean: r.lean, draws: r.draws.map((d) => `${d.dim}:${d.ability}×${d.weight}`) })),
      };
    }),
    alsoListedOn: listed.map((b) => b.id),
    best: base.genres.genreWinner[g],
    nearest: nearest.get(g) ?? null,
  };
});
writeFileSync(`${DIR}/genres-matrix.json`, `${JSON.stringify({ revision: process.argv[2] ?? 'see baseline.md', measured: 'tools/ag-genres.ts', genres: rows.length, briefs: BRIEFS.length, rows }, null, 1)}\n`);
console.log(`wrote ${rows.length} genres`);
