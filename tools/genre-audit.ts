/**
 * SLATE — every genre, audited for what it asks and what it changes (from 2026-10-16, the owner's brief "Finish Genre
 * Acceptance And Correct The Stage-Interpretation Bias", part 4). For each genre:
 * - its conventions (the register's concerns, and where they're from);
 * - how many genres share one (related) and how many pull against it (contrasting);
 * - the techniques its scenes stage;
 * - the abilities and preparation its register reads;
 * - the side its two briefs suit on each axis;
 * - its stage scenes and the scale each suits;
 * - whether knowing it helps its own brief and nothing of another's (an even actor, everything prepared, the genre
 *   known at 0 and at 100).
 * What's listed to weigh comes from those figures, not from a judgment made beside them.
 *
 * The criterion it measures (from 2026-10-22, the owner's brief 22): "No unrelated-genre contribution; only documented,
 * bounded transfer across approved direct relationships." Every genre is tried against every other's first brief: an
 * unrelated genre (`relatedness` 0) must move it by nothing, and a genre one direct link away (a kind and its broad
 * genre) may move it, by less than the genre itself does. Until brief 22 the criterion was the owner's genre acceptance
 * brief's (2026-10-16), that knowing a genre "leaks into none", tried against the next genre alphabetically only; that
 * count is still written ("the next genre over"), as the decision history keeps the old criterion beside the new.
 *
 *   npx vite-node tools/genre-audit.ts -- [--out docs/verification/stage-2026-10-16/genre-audit.md]
 */
import { writeFileSync } from 'node:fs';
import { BRIEFS, type Brief } from '../src/engine/content/briefs';
import { CONCERNS } from '../src/engine/content/concerns';
import { genreTags, DEMAND_LABEL } from '../src/engine/content/demands';
import { GENRE_REGISTER } from '../src/engine/content/genre-register';
import { CONCERN_AFFINITY } from '../src/engine/content/interpretation';
import { PLAY_MATERIAL, SCENE_MATERIAL, type AxisValue } from '../src/engine/content/material';
import type { Person } from '../src/engine/domain/model';
import { briefContext, briefMaterial, briefPiece, readingOf, sceneOf, type BriefRecord } from '../src/engine/systems/briefs';
import type { Performer } from '../src/engine/systems/evaluation';
import { judgePiece } from '../src/engine/systems/piece';
import { sceneOfMaterial, suitabilityOf } from '../src/engine/systems/interpretation';
import { relatedness } from '../src/engine/systems/engagement';

const arg = (n: string, d: string) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1]! : d; };
const genres = Object.keys(GENRE_REGISTER).sort();
const SIDES: AxisValue[] = ['measured', 'driven', 'restrained', 'expansive', 'set', 'open'];
const affinityOf = (g: string) => SIDES.map((side) => GENRE_REGISTER[g]!.concerns.reduce((a, c) => a + (CONCERN_AFFINITY[c].affinity[side] ?? 0), 0));
const kinship = (g: string, h: string) => { const x = affinityOf(g), y = affinityOf(h); const d = x.reduce((s, v, i) => s + v * y[i]!, 0); const n = Math.hypot(...x) * Math.hypot(...y); return n > 0 ? d / n : 0; };
const shares = (g: string, h: string) => GENRE_REGISTER[g]!.concerns.some((c) => GENRE_REGISTER[h]!.concerns.includes(c));
const better = (b: Brief) => {
  const scene = sceneOf(b, readingOf(b, b.readings[0]!.id));
  const s = SIDES.map((side) => suitabilityOf(side, briefMaterial(b), scene).s);
  return [0, 2, 4].map((i) => (s[i]! > s[i + 1]! ? SIDES[i] : s[i + 1]! > s[i]! ? SIDES[i + 1] : 'either')).join(', ');
};
const EVEN: Performer = { ability: () => 55, full: () => 100, technique: () => 50 };
const knowing = (b: Brief, genre: string, familiarity: number) => {
  const person = { engagement: { byGenre: { [genre]: { familiarity, practice: 0 } } } } as unknown as Person;
  const reading = b.readings[0]!.id;
  const rec: BriefRecord = { prep: { interpretation: 1, memorization: 1, rehearsal: 1 }, takes: [] };
  const ctx = briefContext(person, b, rec, { reading });
  return judgePiece('audit', EVEN, { ...ctx, condition: { readiness: 100 }, key: `audit:${b.id}`, expected: true }, briefPiece(b, { ...rec, reading }, reading)).overall;
};

const rows: string[] = [];
const weak: string[] = [];
let leaks = 0, gains = 0;
// Each genre's own gain on its own first brief, and every genre tried against every other's (brief 22's criterion).
const firstBrief = (g: string) => BRIEFS.find((b) => b.kinds[0] === g)!;
const ownGain = new Map(genres.map((g) => [g, knowing(firstBrief(g), g, 100) - knowing(firstBrief(g), g, 0)]));
let pairs = 0, unrelatedMoved = 0, related = 0, relatedMoved = 0, relatedBelow = 0, mostShare = 0;
const unrelatedList: string[] = [];
const relatedRows: string[] = [];
for (const h of genres) {
  const b = firstBrief(h);
  const none = knowing(b, h, 0);
  for (const g of genres) {
    if (g === h) continue;
    pairs += 1;
    const move = knowing(b, g, 100) - none;
    const link = relatedness(g, h);
    if (link === 0) {
      if (move !== 0) { unrelatedMoved += 1; unrelatedList.push(`${g} → ${h}: ${move.toFixed(2)}`); }
      continue;
    }
    related += 1;
    if (move !== 0) relatedMoved += 1;
    const own = ownGain.get(h)!;
    if (move < own) relatedBelow += 1;
    if (own > 0) mostShare = Math.max(mostShare, move / own);
    relatedRows.push(`| ${g} | ${h} | ${link === 0.75 ? 'a kind toward its broad genre' : 'a broad genre toward its kind'}, ${link} | +${move.toFixed(2)} | +${own.toFixed(2)} | ${own > 0 ? `${Math.round((100 * move) / own)}%` : '—'} |`);
  }
}
for (const [i, g] of genres.entries()) {
  const reg = GENRE_REGISTER[g]!;
  const briefs = BRIEFS.filter((b) => b.kinds[0] === g);
  const related = genres.filter((h) => h !== g && shares(g, h)).length;
  const contrasting = genres.filter((h) => h !== g && !shares(g, h) && kinship(g, h) < 0).length;
  const draws = [...new Set(reg.concerns.flatMap((c) => Object.values(CONCERNS[c].inputs).flatMap((xs) => xs!.map((x) => x.ability))))];
  const parts = [...new Set(reg.concerns.flatMap((c) => CONCERNS[c].parts))];
  const sides = briefs.map(better);
  const stage = [...SCENE_MATERIAL, ...PLAY_MATERIAL].filter((m) => sceneOfMaterial(m).genre === g).map((m) => { const sc = sceneOfMaterial(m); const r = suitabilityOf('restrained', m, sc).s, e = suitabilityOf('expansive', m, sc).s; return r > e ? 'restrained' : e > r ? 'expansive' : 'either'; });
  // Knowing it: its own first brief at familiarity 0 and 100, and the next genre's first brief with this one known.
  const own = briefs[0]!;
  const gain = knowing(own, g, 100) - knowing(own, g, 0);
  const next = genres[(i + 1) % genres.length]!;
  const other = BRIEFS.find((b) => b.kinds[0] === next)!;
  const leak = knowing(other, g, 100) - knowing(other, g, 0);
  if (gain > 0) gains += 1;
  if (leak !== 0) leaks += 1;
  if (sides.length > 1 && new Set(sides).size === 1) weak.push(`${g}: its ${sides.length} briefs suit the same sides on every axis (${sides[0]})`);
  if (gain <= 0) weak.push(`${g}: knowing it doesn't help its own brief`);
  // Brief 22's criterion: a move into an unrelated genre is a fault; a move along a direct link is the transfer it allows.
  if (leak !== 0 && relatedness(g, next) === 0) weak.push(`${g}: knowing it moves ${next}'s brief, an unrelated genre's, by ${leak.toFixed(1)}`);
  const stageSides = new Set(stage);
  if (stage.length >= 5 && stageSides.size === 1) weak.push(`${g}: all ${stage.length} of its stage scenes suit ${stage[0]}`);
  rows.push(`| ${g} | ${reg.concerns.map((c) => CONCERNS[c].label).join(', ')} (${reg.basis}) | ${related} / ${contrasting} | ${genreTags(g).map((t) => DEMAND_LABEL[t]).join(', ') || '—'} | ${draws.join(', ')} | ${parts.join(', ')} | ${sides.join(' · ')} | ${stage.length ? `${stage.filter((x) => x === 'restrained').length} restrained, ${stage.filter((x) => x === 'expansive').length} expansive${stage.includes('either') ? `, ${stage.filter((x) => x === 'either').length} either` : ''}` : '—'} | +${gain.toFixed(1)} / ${leak.toFixed(1)} |`);
}

// Criterion I2 measured here as `tools/interpretation.ts` measures it (each brief's first reading, a tie its own side),
// from 2026-10-16: until then the figures below were typed in from that day's run (pace 24.2%, scale 20.8%, structure
// 32.9%), and the fourteen genres revised later that day (genres-09.md) moved them without the sentence knowing.
const AXIS_SIDES = [['measured', 'driven'], ['restrained', 'expansive'], ['set', 'open']] as const;
const sideOn = (b: Brief, i: number) => { const scene = sceneOf(b, readingOf(b, b.readings[0]!.id)); const [x, y] = AXIS_SIDES[i]!.map((v) => suitabilityOf(v, briefMaterial(b), scene).s); return x! > y! ? 0 : y! > x! ? 1 : 2; };
const withTwo = genres.map((g) => BRIEFS.filter((b) => b.kinds[0] === g)).filter((bs) => bs.length > 1);
const i2 = AXIS_SIDES.map((_, i) => (100 * withTwo.filter((bs) => new Set(bs.map((b) => sideOn(b, i))).size > 1).length) / withTwo.length);

const md = `# Every Genre, Audited, 2026-10-16

Written by \`tools/genre-audit.ts\` from the tables. The owner's brief "Finish Genre Acceptance And Correct The
Stage-Interpretation Bias", part 4. The shared mechanics every genre has (its brief, familiarity, practice, preference)
are in \`docs/GENRE-COVERAGE.md\`, which \`tests/genre-coverage.test.ts\` holds to the tables and plays genre by genre.

**Knowing a genre.** For an even actor, everything prepared, the genre known at 100 against 0:
- it helps its own brief in ${gains} of ${genres.length} genres;
- **the criterion** (the owner's brief 22, 2026-10-22): "No unrelated-genre contribution; only documented, bounded
  transfer across approved direct relationships." Every genre against every other's first brief, ${pairs} pairs: an
  unrelated genre moves it in ${unrelatedMoved} of ${pairs - related}; a genre one direct link away (a kind and its broad genre,
  \`relatedness\`) moves it in ${relatedMoved} of ${related}, each by less than the genre itself in ${relatedBelow} of ${related}, the most
  ${Math.round(100 * mostShare)}% of the genre's own gain;
- the next genre over, the old criterion's own test ("leaks into none", the owner's genre acceptance brief of
  2026-10-16, superseded by brief 22), moves in ${leaks}.
${unrelatedList.length ? `\nUnrelated moves, each a fault:\n${unrelatedList.map((x) => `- ${x}`).join('\n')}\n` : ''}

**Found by the figures, to weigh** (${weak.length}). A genre whose two briefs suit the same sides on every axis isn't
necessarily wrong: they share a register, and its conventions may agree. Variation across the catalog is criterion
I2's (\`docs/verification/interpretation-2026-10-16/\`, 20% on each axis): pace ${i2[0]!.toFixed(1)}%, scale ${i2[1]!.toFixed(1)}%, structure ${i2[2]!.toFixed(1)}% of
genres with two briefs differ. A genre whose stage scenes all suit one side is reported against ST4 in \`README.md\`.
Whether two briefs that agree are the same work is read in \`tools/genre-pairs.ts\`, in the six parts the engine reads.
${weak.length ? weak.map((w) => `- ${w}`).join('\n') : '- none'}

| Genre | Conventions (Register, Basis) | Related / Contrasting Genres | Techniques Its Scenes Stage | Abilities Its Register Draws | Preparation It Rewards | Better Sides, Its Briefs (Pace, Scale, Structure) | Its Stage Scenes, Better Scale | Knowing It: Own Brief / The Next Genre's |
|---|---|---|---|---|---|---|---|---|
${rows.join('\n')}

## The Direct Relationships, Each Pair

Each genre known at 100 against the first brief of a genre one direct link away, and that genre's own gain.

| Known | Brief Of | Link | Moves It | Its Own Gain | Share Of Its Own |
|---|---|---|---|---|---|
${relatedRows.join('\n')}
`;
console.log(`${gains} of ${genres.length} helped by knowing them; unrelated moves ${unrelatedMoved} of ${pairs - related}; related moves ${relatedMoved} of ${related}, below its own gain in ${relatedBelow}, at most ${Math.round(100 * mostShare)}%; the next genre over ${leaks}; ${weak.length} weaknesses.`);
const o = arg('out', '');
if (o) writeFileSync(o, md);
