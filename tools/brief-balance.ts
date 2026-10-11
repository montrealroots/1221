/**
 * SLATE — the practice briefs measured across the whole catalog (from 2026-10-12): every one of the 149 briefs, every
 * reading, every way of playing it that fits, judged by the evaluation's own expected result (no draw) for a set of
 * actors, so what a brief rewards can be compared without the luck of a night. Writes
 * docs/verification/BRIEF-BALANCE.md and docs/verification/brief-balance.json.
 *
 *   npx vite-node tools/brief-balance.ts
 *
 * The actors (TEST SETUP, levels set directly):
 * - beginner (abilities 30, techniques 20), developing (50/40), advanced (70/60), mastered (full);
 * - a generalist and three specialists with the same budget: twelve abilities summing 750 and techniques summing the
 *   same, the generalist even (62.5 each, techniques 55), each specialist at 90 on four abilities and its techniques
 *   at 85 on the ones its kind of work uses, the rest lower to match.
 *
 * What it measures, each with its sample size, mean, spread and range:
 * 1. Specialist against generalist: how many briefs each is ahead on, by how much. Neither should be ahead everywhere.
 * 2. Readings: for each actor, the gap between a brief's best and worst reading, and how often the best reading for
 *    one actor isn't the best for another (no one right reading).
 * 3. Preparation: what unprepared, half prepared and complete come to, per actor.
 * 4. A weakness trained: for the developing actor, +20 on the input that costs a brief most, against +20 on an input
 *    the brief doesn't read (which must be 0), and +20 on a read input chosen at random.
 * 5. Transfer: +10 on each ability, the mean change across all 149 briefs and how many briefs it moves at all.
 * 6. Tags, the same take with a brief's genres reordered and repeated: the result must not move.
 */
import { writeFileSync } from 'node:fs';
import { BRIEFS, type Brief } from '../src/engine/content/briefs';
import { AXES } from '../src/engine/content/approaches';
import { MASTERED, TECHNIQUES } from '../src/engine/content/abilities';
import { PLAY_MATERIAL, SCENE_MATERIAL, type Axis, type AxisValue, type MaterialProfile } from '../src/engine/content/material';
import { TASK_PROFILES } from '../src/engine/content/tasks';
import type { Person } from '../src/engine/domain/model';
import { briefContext, briefMaterial, tapeReadsOf, type BriefRecord } from '../src/engine/systems/briefs';
import { judge, type Performer } from '../src/engine/systems/evaluation';
import { materialContext, misfitOf, type Playing } from '../src/engine/systems/material';

const ABILITIES = ['emotionalDepth', 'presence', 'listening', 'imagination', 'focus', 'memory', 'adaptability', 'composure', 'vocal', 'physical', 'discipline', 'stamina'] as const;
type Ab = (typeof ABILITIES)[number];
const nobody = { engagement: { byGenre: {} } } as unknown as Person;
const rec = (p = 1): BriefRecord => ({ prep: { interpretation: p, memorization: p, rehearsal: p }, takes: [] });
type Sides = Omit<Playing, 'chosenAt' | 'prep'>;

const actor = (abilities: Partial<Record<Ab, number>>, fill: number, techs: Partial<Record<string, number>>, techFill: number): Performer => ({ ability: (id) => abilities[id as Ab] ?? fill, full: () => 100, technique: (s) => techs[s] ?? techFill });
const even = (a: number, t: number) => actor({}, a, {}, t);
/** Four abilities at 90 and the other eight to make 750; techniques at 85 on its kind's, the rest to make the generalist's sum. */
function specialist(strong: Ab[], techs: string[]): Performer {
  const rest = (750 - 90 * strong.length) / (ABILITIES.length - strong.length);
  const tRest = (55 * TECHNIQUES.length - 85 * techs.length) / (TECHNIQUES.length - techs.length);
  return actor(Object.fromEntries(strong.map((a) => [a, 90])), rest, Object.fromEntries(techs.map((s) => [s, 85])), tRest);
}
const ACTORS: Record<string, Performer> = {
  beginner: even(30, 20), developing: even(50, 40), advanced: even(70, 60), mastered: { ability: () => 100, full: () => 100, technique: () => MASTERED },
  generalist: even(62.5, 55),
  'feeling specialist': specialist(['emotionalDepth', 'composure', 'imagination', 'presence'], ['scene', 'screen', 'classical']),
  'body specialist': specialist(['physical', 'stamina', 'vocal', 'presence'], ['combat', 'dance', 'singing', 'clown']),
  'partner specialist': specialist(['listening', 'adaptability', 'focus', 'memory'], ['improv', 'comedy', 'scene']),
};

function fitting(b: Brief): Sides[] {
  const out: Sides[] = [{}];
  for (const axis of Object.keys(AXES) as Axis[]) for (const side of AXES[axis].values) if (!misfitOf(axis, side as AxisValue, briefMaterial(b))) out.push({ [axis]: side } as Sides);
  return out;
}
const score = (p: Performer, b: Brief, reading: string, sides: Sides = {}, prep = 1, extra: Record<string, number> = {}) =>
  judge('balance', p, { ...briefContext(nobody, b, rec(prep), { reading, playing: { ...sides, chosenAt: 0, prep }, prep: { genre: prep, approach: prep, ...extra } }), condition: { readiness: 100 }, key: `bal:${b.id}`, expected: true });
/** The best this actor can do with a brief: its best reading and way of playing it, fully prepared. */
const best = (p: Performer, b: Brief) => Math.max(...b.readings.flatMap((r) => fitting(b).map((s) => score(p, b, r.id, s).overall)));

const stats = (xs: number[]) => {
  const n = xs.length;
  const mean = xs.reduce((a, x) => a + x, 0) / n;
  const sd = Math.sqrt(xs.reduce((a, x) => a + (x - mean) ** 2, 0) / Math.max(1, n - 1));
  return { n, mean: +mean.toFixed(2), sd: +sd.toFixed(2), min: +Math.min(...xs).toFixed(2), max: +Math.max(...xs).toFixed(2) };
};
const out: Record<string, unknown> = { briefs: BRIEFS.length, readings: BRIEFS.reduce((a, b) => a + b.readings.length, 0) };
const md: string[] = ['# The Practice Briefs, Measured Across The Catalog', '', 'Generated by `npx vite-node tools/brief-balance.ts`. Every one of the 149 briefs, every reading, every fitting way of playing it, judged by the evaluation\'s own expected result with no draw. The actors are TEST SETUP; their budgets are in the tool\'s header. Each statistic gives n, the mean, the standard deviation and the range.', ''];

// 1. Specialist against generalist.
const gen = BRIEFS.map((b) => best(ACTORS.generalist!, b));
md.push('## 1. Specialist Against Generalist, The Same Budget', '', '| Specialist | Briefs It’s Ahead On | Briefs Behind | Lead Where Ahead | Deficit Where Behind |', '|---|---|---|---|---|');
const spec: Record<string, unknown> = {};
for (const name of ['feeling specialist', 'body specialist', 'partner specialist']) {
  const s = BRIEFS.map((b) => best(ACTORS[name]!, b));
  const d = s.map((x, i) => x - gen[i]!);
  const ahead = d.filter((x) => x > 0.05);
  const behind = d.filter((x) => x < -0.05);
  spec[name] = { ahead: ahead.length, behind: behind.length, lead: ahead.length ? stats(ahead) : null, deficit: behind.length ? stats(behind.map((x) => -x)) : null, aheadOn: BRIEFS.filter((_, i) => d[i]! > 0.05).slice(0, 12).map((b) => b.id) };
  md.push(`| ${name} | ${ahead.length} of ${BRIEFS.length} | ${behind.length} | ${ahead.length ? `${stats(ahead).mean} (sd ${stats(ahead).sd}, ${stats(ahead).min}–${stats(ahead).max})` : '—'} | ${behind.length ? `${stats(behind.map((x) => -x)).mean} (sd ${stats(behind.map((x) => -x)).sd}, ${stats(behind.map((x) => -x)).min}–${stats(behind.map((x) => -x)).max})` : '—'} |`);
}
out.specialist = spec;
md.push('', `Generalist's best per brief: ${JSON.stringify(stats(gen))}.`, '');

// 1b. Across every kind of work the School sets: each task, with its materials where it has them (a scene's 56, a
// production's 30 plays, the briefs), techniques even so only the abilities differ.
md.push('## 1b. Specialist Against Generalist, Across Every Kind Of Work', '', 'Techniques even (55) for every actor, so only the abilities differ. A task with materials is judged over each (a scene shown over the 56 scenes, a night over the 30 plays, a taped brief over the 149 briefs); one without, once.', '', '| Work | Pieces | Feeling Specialist Ahead/Behind | Body Specialist Ahead/Behind | Partner Specialist Ahead/Behind |', '|---|---|---|---|---|');
const evenTech = (p: Performer): Performer => ({ ability: p.ability, full: p.full, technique: () => 55 });
const kindsOut: Record<string, unknown> = {};
const specialists = ['feeling specialist', 'body specialist', 'partner specialist'] as const;
for (const [taskId, task] of Object.entries(TASK_PROFILES)) {
  const materials: (MaterialProfile | undefined)[] = taskId === 'scene' ? [...SCENE_MATERIAL] : taskId === 'performance' ? [...PLAY_MATERIAL] : taskId === 'tape' ? [] : [undefined];
  const judgeKind = (p: Performer): number[] => {
    if (taskId === 'tape') return BRIEFS.map((b) => best(evenTech(p), b));
    return materials.map((m) => {
      const read = materialContext(task, m);
      return judge('balance', evenTech(p), { task, techniques: { scene: 1 }, prep: { familiarity: 1, memorization: 1, interpretation: 1, rehearsal: 1, partner: 1, revision: 1, genre: 1, lines: 1, blocking: 1, notes: 1 }, required: {}, difficulty: 0, lean: read.lean, inputs: read.inputs, condition: { readiness: 100 }, key: `kind:${taskId}`, expected: true }).overall;
    });
  };
  const g = judgeKind(ACTORS.generalist!);
  const row: Record<string, { ahead: number; behind: number }> = {};
  for (const s of specialists) {
    const d = judgeKind(ACTORS[s]!).map((x, i) => x - g[i]!);
    row[s] = { ahead: d.filter((x) => x > 0.05).length, behind: d.filter((x) => x < -0.05).length };
  }
  kindsOut[taskId] = { pieces: g.length, ...row };
  md.push(`| ${task.label} | ${g.length} | ${row['feeling specialist']!.ahead}/${row['feeling specialist']!.behind} | ${row['body specialist']!.ahead}/${row['body specialist']!.behind} | ${row['partner specialist']!.ahead}/${row['partner specialist']!.behind} |`);
}
out.kinds = kindsOut;
md.push('');

// 2. Readings.
md.push('## 2. Readings: A Real Choice, And No One Right Answer', '', '| Actor | Best-Worst Reading Gap Per Brief | Briefs Where The Gap Is Over 1 Point |', '|---|---|---|');
const bestReading: Record<string, string[]> = {};
const readingsOut: Record<string, unknown> = {};
for (const [name, p] of Object.entries(ACTORS)) {
  const gaps: number[] = [];
  bestReading[name] = BRIEFS.map((b) => {
    const rs = b.readings.map((r) => ({ id: r.id, s: score(p, b, r.id).overall }));
    gaps.push(Math.max(...rs.map((x) => x.s)) - Math.min(...rs.map((x) => x.s)));
    return rs.sort((x, y) => y.s - x.s)[0]!.id;
  });
  readingsOut[name] = { gap: stats(gaps), over1: gaps.filter((g) => g > 1).length };
  md.push(`| ${name} | ${stats(gaps).mean} (sd ${stats(gaps).sd}, ${stats(gaps).min}–${stats(gaps).max}) | ${gaps.filter((g) => g > 1).length} of ${BRIEFS.length} |`);
}
const pairs = [['feeling specialist', 'body specialist'], ['feeling specialist', 'partner specialist'], ['body specialist', 'partner specialist'], ['beginner', 'advanced']];
const disagree = pairs.map(([a, c]) => ({ a, b: c, briefs: BRIEFS.filter((_, i) => bestReading[a!]![i] !== bestReading[c!]![i]).length }));
readingsOut.disagree = disagree;
out.readings = readingsOut;
md.push('', 'Briefs where two actors\' best reading differs (the mastered actor ties every reading at 100):', '', ...disagree.map((d) => `- ${d.a} and ${d.b}: ${d.briefs} of ${BRIEFS.length}.`), '');

// 3. Preparation.
md.push('## 3. Preparation', '', '| Actor | Unprepared | Half | Complete |', '|---|---|---|---|');
const prepOut: Record<string, unknown> = {};
for (const [name, p] of Object.entries(ACTORS)) {
  const at = (x: number) => stats(BRIEFS.map((b) => score(p, b, b.readings[0]!.id, {}, x).overall));
  prepOut[name] = { none: at(0), half: at(0.5), complete: at(1) };
  md.push(`| ${name} | ${at(0).mean} (${at(0).min}–${at(0).max}) | ${at(0.5).mean} (${at(0.5).min}–${at(0.5).max}) | ${at(1).mean} (${at(1).min}–${at(1).max}) |`);
}
out.preparation = prepOut;
md.push('');

// 4. A weakness trained, against an unrelated input and a random read one.
const dev = ACTORS.developing!;
const plus = (p: Performer, id: string, by: number): Performer => ({ ability: (x) => p.ability(x) + (x === id ? by : 0), full: p.full, technique: (s) => p.technique(s) + (s === id ? by : 0) });
const weakGain: number[] = [];
const unrelGain: number[] = [];
const randGain: number[] = [];
let h = 7;
for (const b of BRIEFS) {
  const r = b.readings[0]!.id;
  const base = score(dev, b, r);
  const top = base.limits.find((l) => l.kind === 'ability' || l.kind === 'technique');
  if (top) weakGain.push(score(plus(dev, top.what, 20), b, r).overall - base.overall);
  const ctx = briefContext(nobody, b, rec(), { reading: r });
  const read = new Set<string>([...Object.values(ctx.task.dims).flatMap((d) => d!.inputs.flatMap((i) => ('ability' in i ? [i.ability] : []))), ...Object.values(ctx.inputs).flatMap((xs) => (xs ?? []).map((x) => x.ability)), ...Object.keys(tapeReadsOf(b))]);
  const unread = [...ABILITIES, ...TECHNIQUES].filter((x) => !read.has(x));
  if (unread.length) unrelGain.push(score(plus(dev, unread[h % unread.length]!, 20), b, r).overall - base.overall);
  const readList = [...read];
  h = (h * 31 + 11) % 997;
  randGain.push(score(plus(dev, readList[h % readList.length]!, 20), b, r).overall - base.overall);
}
out.weakness = { top: stats(weakGain), unrelated: stats(unrelGain), randomRead: stats(randGain) };
md.push('## 4. A Weakness Trained (The Developing Actor, +20)', '', `- The input that costs the brief most: ${JSON.stringify(stats(weakGain))}.`, `- An input the brief doesn't read: ${JSON.stringify(stats(unrelGain))}.`, `- A read input at random: ${JSON.stringify(stats(randGain))}.`, '');

// 5. Transfer.
md.push('## 5. Transfer: +10 On Each Ability, The Developing Actor, Across All 149', '', '| Ability | Mean Change | Briefs It Moves |', '|---|---|---|');
const transfer: Record<string, unknown> = {};
for (const a of ABILITIES) {
  const ds = BRIEFS.map((b) => score(plus(dev, a, 10), b, b.readings[0]!.id).overall - score(dev, b, b.readings[0]!.id).overall);
  transfer[a] = { ...stats(ds), moves: ds.filter((x) => x > 0.01).length };
  md.push(`| ${a} | ${stats(ds).mean} (${stats(ds).min}–${stats(ds).max}) | ${ds.filter((x) => x > 0.01).length} |`);
}
out.transfer = transfer;
md.push('');

// 6. Tags.
let moved = 0;
for (const b of BRIEFS) {
  const t: Brief = { ...b, kinds: [...b.kinds].reverse().concat(b.kinds) };
  if (score(dev, t, b.readings[0]!.id).overall !== score(dev, b, b.readings[0]!.id).overall) moved += 1;
}
out.tags = { reorderedAndRepeated: BRIEFS.length, moved };
md.push('## 6. Tags', '', `A brief's genres reordered and repeated: ${moved} of ${BRIEFS.length} takes moved.`, '');

writeFileSync('docs/verification/brief-balance.json', JSON.stringify(out, null, 1) + '\n');
writeFileSync('docs/verification/BRIEF-BALANCE.md', md.join('\n') + '\n');
console.log(md.join('\n'));
