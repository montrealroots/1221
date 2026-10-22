/**
 * Writes brief 22's controlled comparisons (`comparisons.json`, `comparisons.md`, T4 and P4) from the scenarios
 * `tests/b22-comparisons.test.ts` asserts (`tests/setup/b22-comparisons.ts`): for every path and fixed seed, at each
 * record, the genre reading, the genre part, the choices' preparation and quality, and the whole; the median gains and
 * the criterion's verdict at the coefficients kept; and the same verdicts at brief 21's 0.75 and 0.5 and each step
 * between, which is how 0.65 and 0.40 were reached.
 *
 *   npx vite-node docs/verification/career-genre-2026-10-22/comparisons.ts
 */
import { writeFileSync } from 'node:fs';
import { ENGAGEMENT } from '../../../src/engine/content/engagement';
import { ASKED, COMPARED_PATHS, RECORDS, RECORD_NAMES, SEEDS, atCoefficients, comparisons, verdict } from '../../../tests/setup/b22-comparisons';

const DIR = 'docs/verification/career-genre-2026-10-22';
const r3 = (x: number | undefined) => (x === undefined || Number.isNaN(x) ? '' : String(Math.round(x * 1000) / 1000));
const STEPS: [number, number][] = [[0.75, 0.5], [0.7, 0.45], [0.65, 0.4]];

const kept = ENGAGEMENT.related;
const rows = comparisons();
const verdicts = verdict(rows);
const sweep = STEPS.map(([k, b]) => ({ kindToParent: k, parentToKind: b, verdicts: atCoefficients(k, b, () => verdict(comparisons())) }));

const records = RECORD_NAMES.map((r) => `${r} (${Object.entries(RECORDS[r]).map(([g, v]) => `${g} ${v}`).join(', ') || 'nothing known'})`).join('; ');
const md: string[] = [
  '# Brief 22’s Controlled Comparisons',
  '',
  'Written by `comparisons.ts` from the scenarios `tests/b22-comparisons.test.ts` asserts. The same actor on the same day,',
  'with the same preparation and the same draw, read with only what they know of genres changed, on every path that reads',
  `a work's genres. The work asks one genre, ${ASKED} (TEST SETUP: set by hand at the level each path reads). Seeds, fixed in`,
  `\`criteria.md\` before any outcome was read and never replaced: ${SEEDS.map((s) => `\`${s}\``).join(', ')}. Records: ${records}.`,
  '',
  '**The criterion (criteria.md, T4), written before the measurement**, on the median over the seeds of each path’s gain',
  'over knowing nothing: (K1) nothing = unrelated < broad < kind < exact; (K2) the kind’s gain at most 0.85 of the exact',
  'genre’s, the broad genre’s at most 0.65.',
  '',
  `**Kept: ${kept.kindToParent} (a kind toward its broad genre) and ${kept.parentToKind} (a broad genre toward its kind).** Brief 21’s`,
  '0.75 and 0.5 failed K2 on three paths and were lowered by 0.05 at a time until both held on every path.',
  '',
  '## The Steps',
  '',
  '| Coefficients | Path | Gain: broad | kind | exact | Kind ÷ exact | Broad ÷ exact | K1 | K2 |',
  '|---|---|---|---|---|---|---|---|---|',
];
for (const s of sweep) for (const v of s.verdicts) {
  md.push(`| ${s.kindToParent} and ${s.parentToKind} | ${v.path} | ${r3(v.gains.broad)} | ${r3(v.gains.kind)} | ${r3(v.gains.exact)} | ${r3(v.kindShare)} | ${r3(v.broadShare)} | ${v.k1 ? 'holds' : 'fails'} | ${v.k2 ? 'holds' : 'fails'} |`);
}
md.push('', `## At ${kept.kindToParent} And ${kept.parentToKind}, Every Seed`, '',
  'Reading: what the genres come to, 0 to 1. Part: the genre part of the piece’s preparation (on casting’s fit, the fit’s',
  'genre half). Prepared and quality: the interpretation choices’ preparation and quality, where the path judges them. Whole:',
  'the piece’s overall (on casting’s fit, the fit; on a rehearsal day, the lines learned).', '',
  '| Path | Seed | Record | Reading | Part | Prepared | Quality | Whole |', '|---|---|---|---|---|---|---|---|');
for (const r of rows) md.push(`| ${r.path} | ${r.seed} | ${r.record} | ${r3(r.figures.reading)} | ${r3(r.figures.part)} | ${r3(r.figures.prepared)} | ${r3(r.figures.interpretation)} | ${r3(r.figures.overall)} |`);
md.push('', '## The Verdict', '', '| Path | Median gain: unrelated | broad | kind | exact | K1 | K2 |', '|---|---|---|---|---|---|---|');
for (const v of verdicts) md.push(`| ${v.path} | ${r3(v.gains.unrelated)} | ${r3(v.gains.broad)} | ${r3(v.gains.kind)} | ${r3(v.gains.exact)} | ${v.k1 ? 'holds' : 'fails'} | ${v.k2 ? 'holds' : 'fails'} |`);

writeFileSync(`${DIR}/comparisons.json`, `${JSON.stringify({ asked: ASKED, seeds: SEEDS, records: RECORDS, paths: COMPARED_PATHS, kept, rows, verdicts, sweep }, null, 1)}\n`);
writeFileSync(`${DIR}/comparisons.md`, `${md.join('\n')}\n`);
console.log(`wrote ${DIR}/comparisons.md: ${rows.length} readings; at ${kept.kindToParent} and ${kept.parentToKind}, K1 ${verdicts.every((v) => v.k1)} and K2 ${verdicts.every((v) => v.k2)} on every path`);
for (const s of sweep) console.log(`${s.kindToParent}/${s.parentToKind}: K2 fails on ${s.verdicts.filter((v) => !v.k2).map((v) => v.path).join(', ') || 'none'}`);
