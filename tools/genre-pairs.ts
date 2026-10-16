/**
 * SLATE — a genre's two briefs compared as the engine reads them (from 2026-10-16, the owner's brief 09, section 3:
 * "Matching preferences alone do not prove identical gameplay"). The genre audit (`tools/genre-audit.ts`) found 55
 * genres whose two briefs suit the same sides on every axis; whether they're the same work is read here, in the six
 * parts the owner named, each through the engine's own functions and never from a brief's wording:
 *
 * - **Circumstances**: the medium, the language and what rides on it (`briefMaterial`, `BRIEF.base`, `BRIEF.stakes`).
 *   The same where the medium and the language are, and the stakes within a level.
 * - **Objectives and obstacles**: how the reader plays the other part (`READER_PLAYS`), and the scene's turns, the
 *   changes of tone and the beats held two ways (`turnsOf`, which rehearsal and suitability read). The same where the
 *   reader's behavior is, and the turns and blends are within one together.
 * - **Technique demands**: the task it's judged as (`taskOf`), the techniques it stages (`tapeReadsOf`) and its five
 *   features. The same where the task and the techniques are, and the features within 2 in all.
 * - **Preparation**: how long its lines take (`stepMinutes`), what rehearsing it trains (`rehearseTrains`) and what
 *   speeds the rehearsal (`rehearseSpeed`). The same where all three are.
 * - **Valid interpretations**: the readings (`briefContext`'s lean and draws). The same where two or more readings of
 *   the second match one of the first in the dimension they lean most and the ability they draw most.
 * - **Feedback and consequences**: who the take rewards (the specialist gaining most at +35, as `tools/genre-signature.ts`
 *   builds them, most often across the readings) and what a half-prepared developing actor's take names as its chief
 *   limit (`chiefLimit`), by dimension. The same where both are.
 *
 * Substantively repetitive: the same in three of the six or more, half of what the engine reads of them. The rule was
 * written on 2026-10-16 before any brief changed (docs/verification/remaining-09/genres-checklist.json), and the 55
 * measured with it then: 7 the same in none of the six, 15 in one, 19 in two, 9 in three, 3 in four, 2 in five.
 *
 * Beside it, for a genre kept: each brief's better sides with its register and with the register's concerns set aside
 * (`sceneOf` without `concerns`), which says whether the sides agree because the genre's conventions do or because
 * both scenes say so on their own.
 *
 *   npx vite-node tools/genre-pairs.ts -- [--genres a,b] [--same-sides] [--json file] [--md file]
 */
import { writeFileSync } from 'node:fs';
import { BRIEFS, type Brief } from '../src/engine/content/briefs';
import { ABILITY_DEFS } from '../src/engine/content/abilities';
import { GENRE_REGISTER } from '../src/engine/content/genre-register';
import type { AxisValue } from '../src/engine/content/material';
import type { Person } from '../src/engine/domain/model';
import { briefContext, briefMaterial, briefPiece, readingOf, rehearseSpeed, rehearseTrains, sceneOf, stepMinutes, taskOf, tapeReadsOf, turnsOf, type BriefRecord } from '../src/engine/systems/briefs';
import { chiefLimit, type Performer } from '../src/engine/systems/evaluation';
import { judgePiece } from '../src/engine/systems/piece';
import { suitabilityOf } from '../src/engine/systems/interpretation';

const SIDES: AxisValue[] = ['measured', 'driven', 'restrained', 'expansive', 'set', 'open'];
const nobody = { engagement: { byGenre: {} } } as unknown as Person;
const ABILITIES = ABILITY_DEFS.map((d) => d.id).filter((a) => a !== 'stamina');
const actor = (ab: Partial<Record<string, number>>, fill: number): Performer => ({ ability: (id) => ab[id] ?? fill, full: () => 100, technique: () => 50 });
const EVEN = actor({}, 50);
// The specialists `tools/genre-signature.ts` measures: one ability at 85, the rest lowered evenly to keep the sum.
const SPECIALISTS = ABILITIES.map((a) => [a, actor({ [a]: 85 }, (600 - 85) / 11)] as const);
// A developing actor, its scene's three parts of preparation at 0.4 and the genre known: what its take names as the
// chief limit is what the result says to work on.
const DEVELOPING = actor({}, 40);
const FEATURES = ['timing', 'physical', 'partner', 'vocal', 'improvisation'] as const;
export const PARTS = ['circumstances', 'obstacles', 'techniques', 'preparation', 'readings', 'feedback'] as const;
export type Part = (typeof PARTS)[number];
/** Substantively repetitive at this many of the six the same. */
export const REPETITIVE_AT = 3;

const r2 = (x: number) => Math.round(x * 100) / 100;
const take = (b: Brief, p: Performer, reading: string, prep = 1) => {
  const rec: BriefRecord = { prep: { interpretation: prep, memorization: prep, rehearsal: prep }, takes: [] };
  const ctx = briefContext(nobody, b, rec, { reading, prep: { genre: 1 } });
  return judgePiece('genre-pairs', p, { ...ctx, condition: { readiness: 100 }, key: `pairs:${b.id}`, expected: true }, briefPiece(b, { ...rec, reading }, reading));
};
const topLean = (lean: Readonly<Record<string, number>>) => Object.entries(lean).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
const topDraw = (draws: Brief['readings'][number]['draws']) => [...draws].sort((a, b) => b.weight - a.weight)[0]?.ability ?? '';

/** Each brief's better side on each axis, the first reading's, with the register or without its concerns. */
export function betterSides(b: Brief, register = true, reading = b.readings[0]!.id): string {
  const scene = sceneOf(b, readingOf(b, reading));
  const s = SIDES.map((side) => suitabilityOf(side, briefMaterial(b), register ? scene : { ...scene, concerns: [] }).s);
  return [0, 2, 4].map((i) => (s[i]! > s[i + 1]! ? SIDES[i] : s[i + 1]! > s[i]! ? SIDES[i + 1] : 'either')).join(', ');
}

/**
 * What carries each axis's better side for a brief, the first reading's: the two signals that favor it most over the
 * other side (`suitabilityOf`'s signals, the side's less the other's, by source).
 */
export function sidesWhy(b: Brief): string[] {
  const scene = sceneOf(b, readingOf(b, b.readings[0]!.id));
  return [0, 2, 4].map((i) => {
    const [x, y] = [suitabilityOf(SIDES[i]!, briefMaterial(b), scene), suitabilityOf(SIDES[i + 1]!, briefMaterial(b), scene)];
    const [win, lose] = x.s >= y.s ? [x, y] : [y, x];
    const by = new Map<string, number>();
    for (const g of win.signals) by.set(g.source.replace(/:.*/, ''), (by.get(g.source.replace(/:.*/, '')) ?? 0) + g.v);
    for (const g of lose.signals) by.set(g.source.replace(/:.*/, ''), (by.get(g.source.replace(/:.*/, '')) ?? 0) - g.v);
    const top = [...by.entries()].filter(([, v]) => v > 0).sort((p, q) => q[1] - p[1]).slice(0, 2).map(([k, v]) => `${k} ${r2(v)}`);
    return `${win.side} by ${r2(win.s - lose.s)} (${top.join('; ')})`;
  });
}

/** What the engine reads of one brief, in the six parts. */
export function readOf(b: Brief) {
  const t = turnsOf(b);
  const readings = b.readings.map((r) => {
    const even = take(b, EVEN, r.id).overall;
    const gains = SPECIALISTS.map(([a, p]) => [a, r2(take(b, p, r.id).overall - even)] as const).sort((x, y) => y[1] - x[1]);
    const limit = take(b, DEVELOPING, r.id, 0.4).limits[0];
    return { id: r.id, label: r.label, lean: topLean(r.lean), draw: topDraw(r.draws), rewards: gains[0]![0], gain: gains[0]![1], limit: limit?.dimension ?? '', chief: chiefLimit(take(b, DEVELOPING, r.id, 0.4)) ?? '' };
  });
  // The most often rewarded across the readings, a tie to the earlier reading's.
  const rewarded = Object.entries(readings.reduce<Record<string, number>>((a, r) => ({ ...a, [r.rewards]: (a[r.rewards] ?? 0) + 1 }), {})).sort((x, y) => y[1] - x[1])[0]![0];
  return {
    id: b.id, title: b.title, medium: b.medium, language: b.language, stakes: b.stakes ?? 1, reader: b.medium === 'voice' ? 'none' : (b.readerPlays ?? 'steady'),
    transitions: t.transitions, blends: t.blends, task: taskOf(b).label, techniques: Object.keys(b.techniques ?? {}).sort().join(', ') || 'none',
    reads: tapeReadsOf(b), features: FEATURES.map((f) => b[f]), size: b.size, lines: stepMinutes(b, 'lines'),
    trains: rehearseTrains(b) ?? 'nothing', speeds: rehearseSpeed(b) ?? 'nothing', readings, rewarded,
    sides: betterSides(b), sidesWithoutRegister: betterSides(b, false), why: sidesWhy(b),
  };
}
export type Read = ReturnType<typeof readOf>;

/** The six parts, each the same or not by the rule in the header. */
export function compare(a: Read, b: Read): { same: Record<Part, boolean>; n: number; repetitive: boolean; matched: number } {
  const matched = b.readings.filter((r) => a.readings.some((s) => s.lean === r.lean && s.draw === r.draw)).length;
  const same: Record<Part, boolean> = {
    circumstances: a.medium === b.medium && a.language === b.language && Math.abs(a.stakes - b.stakes) <= 1,
    obstacles: a.reader === b.reader && Math.abs(a.transitions - b.transitions) + Math.abs(a.blends - b.blends) <= 1,
    techniques: a.task === b.task && a.techniques === b.techniques && a.features.reduce((s, v, i) => s + Math.abs(v - b.features[i]!), 0) <= 2,
    preparation: a.size === b.size && a.trains === b.trains && a.speeds === b.speeds,
    readings: matched >= 2,
    feedback: a.rewarded === b.rewarded && a.readings[0]!.limit === b.readings[0]!.limit,
  };
  const n = PARTS.filter((p) => same[p]).length;
  return { same, n, repetitive: n >= REPETITIVE_AT, matched };
}

/** A genre's two briefs (the first two written for it), read and compared. */
export function pairOf(genre: string) {
  const [x, y] = BRIEFS.filter((b) => b.kinds[0] === genre);
  if (!x || !y) return undefined;
  const a = readOf(x), b = readOf(y);
  return { genre, concerns: GENRE_REGISTER[genre]!.concerns, a, b, ...compare(a, b), sameSides: a.sides === b.sides, sameSidesWithoutRegister: a.sidesWithoutRegister === b.sidesWithoutRegister };
}
export type Pair = NonNullable<ReturnType<typeof pairOf>>;

const say = (x: Read) => `${x.medium}, ${x.size}, stakes ${x.stakes}, ${x.reader === 'none' ? 'no reader' : `${x.reader} reader`}, ${x.language}; ${x.task}; features ${x.features.join('/')}; ${x.techniques}; turns ${x.transitions}, blends ${x.blends}; rehearsal trains ${x.trains}; readings ${x.readings.map((r) => `${r.label} (${r.lean} by ${r.draw})`).join(', ')}; rewards ${x.rewarded}; limit ${x.readings[0]!.limit}`;

function main() {
  const flag = (n: string) => process.argv.includes(`--${n}`);
  const arg = (n: string, d: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1]! : d; };
  const all = Object.keys(GENRE_REGISTER).sort();
  const only = arg('genres', '') ? arg('genres', '').split(',') : all;
  const pairs = only.map(pairOf).filter((p): p is Pair => Boolean(p)).filter((p) => !flag('same-sides') || p.sameSides);
  const counts = Object.fromEntries([0, 1, 2, 3, 4, 5, 6].map((n) => [n, pairs.filter((p) => p.n === n).length]));
  const repetitive = pairs.filter((p) => p.repetitive).map((p) => p.genre);
  const summary = { genres: pairs.length, sameSides: pairs.filter((p) => p.sameSides).length, byPartsTheSame: counts, repetitive, repetitiveAmongSameSides: pairs.filter((p) => p.sameSides && p.repetitive).map((p) => p.genre), sameSidesOnlyWithRegister: pairs.filter((p) => p.sameSides && !p.sameSidesWithoutRegister).map((p) => p.genre) };
  console.log(JSON.stringify(summary, null, 1));
  for (const p of pairs) console.log(`${p.repetitive ? '!' : ' '} ${p.genre.padEnd(24)} ${p.n} same (${PARTS.filter((x) => p.same[x]).join(', ') || 'none'})${p.sameSides ? `; same sides ${p.a.sides}${p.sameSidesWithoutRegister ? '' : ' (not without the register)'}` : ''}`);
  if (arg('json', '')) writeFileSync(arg('json', ''), `${JSON.stringify({ summary, pairs }, null, 1)}\n`);
  if (arg('md', '')) {
    const rows = pairs.map((p) => `| ${p.genre} | ${p.n}: ${PARTS.filter((x) => p.same[x]).join(', ') || 'none'} | ${p.a.sides}${p.sameSides ? '' : ` · ${p.b.sides}`} | ${p.sameSides ? (p.sameSidesWithoutRegister ? 'no: both scenes say so' : `yes: ${p.a.sidesWithoutRegister} · ${p.b.sidesWithoutRegister}`) : '—'} | ${p.a.why.join('; ')} · ${p.b.why.join('; ')} | ${say(p.a)} | ${say(p.b)} |`);
    writeFileSync(arg('md', ''), `| Genre | The Same, Of Six | Better Sides | Differ Without The Register | What Carries Each Side | First Brief | Second Brief |\n|---|---|---|---|---|---|---|\n${rows.join('\n')}\n`);
  }
}

// Run as a tool, not when a test imports the rule (vitest sets VITEST).
if (!process.env.VITEST) main();
