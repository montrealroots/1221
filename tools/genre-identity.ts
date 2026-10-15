/**
 * SLATE — each genre's identity, measured (from 2026-10-16; the owner's brief "Complete Genre Differentiation And Prove
 * Each Genre's Identity"). A read-only harness beside `tools/ag-baseline.ts`, whose genre section (§3, criteria G1 and
 * G2) it repeats exactly: a brief's profile is its six dimensions' shares (the mean over its readings) times ten and the
 * twelve abilities' +10 effects for the even actor (every ability and technique at 50), each brief fully prepared, on a
 * sufficient day, with no draw; a genre's profile is the mean of the briefs written for it.
 *
 *   npx vite-node tools/genre-identity.ts -- [--lean 1] [--draw 1] [--out file.json]
 *
 * `--lean` and `--draw` set `CONCERN_STRENGTH` for the run (TEST SETUP: the measure the strength was set against), and
 * `--off` measures with no register at all, as the code stood before 2026-10-16. It writes its JSON where `--out` says,
 * and nothing else.
 *
 * G2's signature here is ag-baseline's (`sigNoReadings`) with the register added: the genre's concerns are numbers the
 * engine reads of every take of the brief, as its stakes are.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { BRIEFS, briefsOf, type Brief } from '../src/engine/content/briefs';
import { ABILITY_DEFS } from '../src/engine/content/abilities';
import { GENRE_DEFS } from '../src/engine/content/genres';
import { GENRE_REGISTER } from '../src/engine/content/genre-register';
import { CONCERNS, CONCERN_STRENGTH } from '../src/engine/content/concerns';
import { GENRE_BY_ID } from '../src/engine/content/film-genres';
import { GENRE_DEMANDS, applied, DEMAND_LABEL } from '../src/engine/content/demands';
import { concernDraws, concernLeans } from '../src/engine/systems/register';
import type { Person } from '../src/engine/domain/model';
import { briefContext, briefPiece, registerOf, tapeReadsOf, type BriefRecord } from '../src/engine/systems/briefs';
import { judgePiece, pieceWeights } from '../src/engine/systems/piece';
import type { Performer } from '../src/engine/systems/evaluation';

const arg = (name: string, d: string) => { const i = process.argv.indexOf(`--${name}`); return i >= 0 ? process.argv[i + 1]! : d; };
CONCERN_STRENGTH.lean = Number(arg('lean', String(CONCERN_STRENGTH.lean)));
CONCERN_STRENGTH.draw = Number(arg('draw', String(CONCERN_STRENGTH.draw)));
const OFF = process.argv.includes('--off');
if (OFF) { CONCERN_STRENGTH.lean = 0; CONCERN_STRENGTH.draw = 0; }
const OUT = arg('out', '');
/**
 * `--controlled`: each brief judged at the catalog's length and stakes (short, 1), its own features, tones, reader and
 * readings kept: the corrected G1's measure (`docs/verification/attributes-genres-2026-10-16/acceptance-criteria.md`).
 * A scene's length and stakes are the scene's, not its genre's.
 */
const CONTROLLED = process.argv.includes('--controlled');
const as = (b: Brief): Brief => (CONTROLLED ? { ...b, id: `${b.id}~controlled`, size: 'short', stakes: 1 } : b);

const ABILITIES = ABILITY_DEFS.map((d) => d.id);
const DIMS = ['believability', 'interpretation', 'connection', 'execution', 'consistency', 'responsiveness'] as const;
const nobody = { engagement: { byGenre: {} } } as unknown as Person;
const r2 = (x: number) => Math.round(x * 100) / 100;
const r3 = (x: number) => Math.round(x * 1000) / 1000;
const mean = (xs: number[]) => (xs.length ? xs.reduce((a, x) => a + x, 0) / xs.length : 0);
const rec = (p: number): BriefRecord => ({ prep: { interpretation: p, memorization: p, rehearsal: p }, takes: [] });
const EVEN: Performer = { ability: () => 50, full: () => 100, technique: () => 50 };
const bump = (a: string): Performer => ({ ...EVEN, ability: (id) => (id === a ? 60 : 50) });

/** A take of a reading, as ag-baseline's `briefScore` judges it: fully prepared, readiness 100, no draw. */
const score = (b: Brief, p: Performer, reading: string) => {
  const ctx = briefContext(nobody, b, rec(1), { reading, prep: { genre: 1 } });
  return judgePiece('ag-baseline', p, { ...ctx, condition: { readiness: 100 }, key: `ag:${b.id}`, expected: true }, briefPiece(b, { ...rec(1), reading })).overall;
};
/** Every reading's mean, rounded as ag-baseline's `briefMean` rounds it. */
const meanScore = (b: Brief, p: Performer) => r2(mean(b.readings.map((r) => score(b, p, r.id))));

export function profileOf(b: Brief): number[] {
  const ws = b.readings.map((r) => {
    const ctx = briefContext(nobody, b, rec(1), { reading: r.id });
    const w = pieceWeights(ctx.task, ctx.lean, briefPiece(b, { ...rec(1), reading: r.id })) as Record<string, number>;
    const t = Object.values(w).reduce((a, x) => a + (x ?? 0), 0);
    return DIMS.map((d) => (w[d] ?? 0) / t);
  });
  const even = meanScore(b, EVEN);
  return [...DIMS.map((_, i) => mean(ws.map((w) => w[i]!)) * 10), ...ABILITIES.map((a) => r3(meanScore(b, bump(a)) - even))];
}

const GENRES = Object.keys(GENRE_DEFS);
const own = (g: string) => briefsOf(g).filter((b) => b.kinds[0] === g);
const BP = new Map(BRIEFS.map((b) => [b.id, profileOf(as(b))]));
const GP = new Map(GENRES.map((g) => { const ps = own(g).map((b) => BP.get(b.id)!); return [g, ps[0]!.map((_, i) => mean(ps.map((p) => p[i]!)))]; }));
const l1 = (x: number[], y: number[]) => x.reduce((a, v, i) => a + Math.abs(v - y[i]!), 0);
const within = GENRES.map((g) => { const bs = own(g); return bs.length >= 2 ? l1(BP.get(bs[0]!.id)!, BP.get(bs[1]!.id)!) : 0; });
const pairs: number[] = [];
for (let i = 0; i < GENRES.length; i += 1) for (let j = i + 1; j < GENRES.length; j += 1) pairs.push(l1(GP.get(GENRES[i]!)!, GP.get(GENRES[j]!)!));
pairs.sort((a, b) => a - b);
const registerKey = (g: string) => [...(GENRE_REGISTER[g]?.concerns ?? [])].sort().join('+');
const nearest = GENRES.map((g, i) => {
  let best = { g: '', d: Infinity };
  for (const h of GENRES) if (h !== g) { const d = l1(GP.get(g)!, GP.get(h)!); if (d < best.d) best = { g: h, d }; }
  return { genre: g, nearest: best.g, distance: r3(best.d), within: r3(within[i]!), sharesRegister: registerKey(g) === registerKey(best.g) };
});
const sig = (b: Brief) => JSON.stringify([b.medium, b.size, b.stakes ?? 1, b.readerPlays ?? 'steady', b.language, b.timing, b.physical, b.partner, b.vocal, b.improvisation, Object.entries(tapeReadsOf(b)).sort(), b.beats.map((x) => [...x.tones].sort().join('+')), OFF ? [] : [...registerOf(b)].sort()]);
const bySig = new Map<string, string[]>();
for (const b of BRIEFS) bySig.set(sig(b), [...(bySig.get(sig(b)) ?? []), b.id]);
const identical = [...bySig.values()].filter((v) => v.length > 1 && new Set(v.map((id) => BRIEFS.find((b) => b.id === id)!.kinds[0])).size > 1);

const median = pairs[Math.floor(pairs.length / 2)]!;
const meanWithin = mean(within);
const result = {
  measured: 'tools/genre-identity.ts', strength: { ...CONCERN_STRENGTH }, register: !OFF, controlled: CONTROLLED,
  g1: { medianBetween: r3(median), meanWithin: r3(meanWithin), ratio: r3(median / meanWithin), nearerThanOwn: nearest.filter((x) => x.distance < x.within).length, nearerThanOwnSharingRegister: nearest.filter((x) => x.distance < x.within && x.sharesRegister).length },
  g2: { identicalCrossGenre: identical },
  nearest,
  profiles: Object.fromEntries(GENRES.map((g) => [g, GP.get(g)!.map(r3)])),
};
/**
 * `--md file`: the genre matrix, every genre a row, beside the run with no register (`--before file.json`, written by
 * this tool with `--off`): its families, its register and where that comes from, the techniques its research applies,
 * what the take weighs and draws on, the preparation that answers it, its briefs and how they differ, its nearest
 * neighbor before and after, and whether that neighbor shares its register (legitimate overlap) or not.
 */
const MD = arg('md', '');
if (MD) {
  // A run of this tool, or ag-baseline's own JSON (its genre section's `distance.nearestAll`), for the code before.
  const raw = arg('before', '') ? JSON.parse(readFileSync(arg('before', ''), 'utf8')) as { nearest?: typeof nearest; genres?: { distance: { nearestAll: { genre: string; nearest: string; distance: number }[] } } } : undefined;
  const before = raw ? { nearest: raw.nearest ?? raw.genres!.distance.nearestAll } : undefined;
  const near = new Map(nearest.map((x) => [x.genre, x]));
  const label = (g: string) => GENRE_BY_ID[g]?.label ?? g;
  const row = (g: string) => {
    const r = GENRE_REGISTER[g];
    const cs = r?.concerns ?? [];
    const leans = [...new Set(cs.flatMap(concernLeans))].join(', ');
    const draws = [...new Set(cs.flatMap(concernDraws))].join(', ');
    const parts = [...new Set(cs.flatMap((c) => CONCERNS[c].parts))].join(', ');
    const tech = applied(g) ? (GENRE_DEMANDS[g]?.tags ?? []).map((t) => DEMAND_LABEL[t.tag]).join(', ') : '';
    const bs = own(g).map((b) => `${b.title} (${b.size}, stakes ${b.stakes ?? 1}, ${b.readerPlays ?? 'steady'} reader, t${b.timing} ph${b.physical} pa${b.partner} vo${b.vocal} im${b.improvisation}; read as ${b.readings.map((r) => r.label).join(' or ')})`).join('; ');
    const conv = GENRE_DEFS[g]!.conventions.length > 140 ? `${GENRE_DEFS[g]!.conventions.slice(0, 137).replace(/\s+\S*$/, '')}…` : GENRE_DEFS[g]!.conventions;
    const n = near.get(g)!;
    const was = before?.nearest.find((x) => x.genre === g);
    return `| ${label(g)} | ${conv} | ${GENRE_DEFS[g]!.families.join(', ')} | ${cs.map((c) => CONCERNS[c].label).join(', ')} (${r?.basis ?? '—'}) | ${tech || '—'} | ${leans} | ${draws} | ${parts} | ${bs} | ${was ? `${label(was.nearest)} ${was.distance}` : '—'} | ${label(n.nearest)} ${n.distance}${n.sharesRegister ? ' (same register)' : ''} | ${n.within} |`;
  };
  const lines = [
    '| Genre | Conventions | Families | Register (basis) | Techniques Applied | Take Weighs More | Draws On | Preparation That Answers It | Its Briefs | Nearest Before | Nearest Now | Its Own Briefs Apart |',
    '|---|---|---|---|---|---|---|---|---|---|---|---|',
    ...GENRES.map(row),
  ];
  writeFileSync(MD, `${lines.join('\n')}\n`);
}
console.log(JSON.stringify({ strength: result.strength, register: result.register, controlled: CONTROLLED, g1: result.g1, g2: identical.length }));
if (OUT) writeFileSync(OUT, `${JSON.stringify(result, null, 1)}\n`);
