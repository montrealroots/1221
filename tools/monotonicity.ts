/**
 * SLATE — more never makes it worse, swept over the catalog (from 2026-10-16, brief 10; L3-R (d) in
 * docs/verification/decisions-2026-10-16/criteria.md): on every piece H4-R reads (`tools/pieces.ts`), raising any one
 * ability (+10, held at full, and to full) with everything else held never lowers the result by more than 1e-9, at full
 * precision. A read-only harness: it sets no save and plays no command.
 *
 * The actors (TEST SETUP, levels set directly): the even actor (every ability and technique 50), the twelve specialists
 * (85 and the other eleven (600 − 85) / 11), a beginner (35, techniques 30), a near-master (92, techniques 85), and four
 * drawn (seeded `mono-<k>`: each ability 25 to 95 and each technique 20 to 90). The sweep runs in parts so a container
 * restart costs one part: `--part k --of n` takes every n-th piece from the k-th, and `--merge` sums the parts' files.
 *
 *   npx vite-node tools/monotonicity.ts -- --part 0 --of 4 --out mono-0.json
 *   npx vite-node tools/monotonicity.ts -- --merge mono-0.json,mono-1.json,mono-2.json,mono-3.json --out mono.json
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { ABILITY_DEFS, TECHNIQUES, type AbilityId } from '../src/engine/content/abilities';
import type { Performer } from '../src/engine/systems/evaluation';
import { ALL_PIECES } from './pieces';

const arg = (n: string, d: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1]! : d; };
const OUT = arg('out', 'mono.json');
const merge = arg('merge', '');
type Part = { pieces: number; checks: number; falls: { piece: string; actor: string; ability: string; bump: string; by: number }[]; worst: number };

if (merge) {
  const parts = merge.split(',').map((f) => JSON.parse(readFileSync(f, 'utf8')) as Part & { part: string });
  const falls = parts.flatMap((p) => p.falls);
  const out = { criterion: 'L3-R (d): raising any one ability, holding the rest, never lowers a result by more than 1e-9', parts: parts.map((p) => p.part), pieces: parts.reduce((t, p) => t + p.pieces, 0), checks: parts.reduce((t, p) => t + p.checks, 0), falls: falls.length, worst: Math.min(0, ...parts.map((p) => p.worst)), met: falls.length === 0, first: falls.slice(0, 20) };
  writeFileSync(OUT, `${JSON.stringify(out, null, 1)}\n`);
  console.log(JSON.stringify({ ...out, first: out.first.slice(0, 3) }));
} else {
  const part = Number(arg('part', '0')), of = Number(arg('of', '1'));
  const ABILITIES = ABILITY_DEFS.map((d) => d.id);
  const actor = (ab: (id: AbilityId) => number, te: (s: string) => number): Performer => ({ ability: ab, full: () => 100, technique: te });
  /** A seeded generator (mulberry32). */
  const rng = (seed: number) => () => { seed = (seed + 0x6d2b79f5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const drawn = (k: number) => { const r = rng(7919 * (k + 1)); const ab = Object.fromEntries(ABILITIES.map((a) => [a, 25 + 70 * r()])); const te = Object.fromEntries(TECHNIQUES.map((s) => [s, 20 + 70 * r()])); return actor((id) => ab[id]!, (s) => te[s]!); };
  const ACTORS: Record<string, Performer> = {
    even: actor(() => 50, () => 50),
    ...Object.fromEntries(ABILITIES.map((a) => [`${a} specialist`, actor((id) => (id === a ? 85 : 515 / 11), () => 50)])),
    beginner: actor(() => 35, () => 30),
    'near-master': actor(() => 92, () => 85),
    ...Object.fromEntries([0, 1, 2, 3].map((k) => [`mono-${k}`, drawn(k)])),
  };
  const pieces = ALL_PIECES.filter((_, i) => i % of === part);
  const falls: Part['falls'] = [];
  let checks = 0, worst = 0;
  for (const pc of pieces) {
    for (const [name, p] of Object.entries(ACTORS)) {
      const base = pc.judge(p).exact!;
      for (const a of ABILITIES) {
        for (const [bump, to] of [['+10', Math.min(p.full(a), p.ability(a) + 10)], ['to full', p.full(a)]] as const) {
          const q: Performer = { ...p, ability: (id) => (id === a ? to : p.ability(id)) };
          const by = pc.judge(q).exact! - base;
          checks += 1;
          worst = Math.min(worst, by);
          if (by < -1e-9) falls.push({ piece: `${pc.kind}:${pc.id}`, actor: name, ability: a, bump, by });
        }
      }
    }
  }
  const out = { part: `${part} of ${of}`, pieces: pieces.length, checks, falls, worst };
  writeFileSync(OUT, `${JSON.stringify(out, null, 1)}\n`);
  console.log(JSON.stringify({ part: out.part, pieces: out.pieces, checks, falls: falls.length, worst }));
}
