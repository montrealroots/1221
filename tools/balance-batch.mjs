/**
 * SLATE — the practice-balance grid (integration pass, 2026-10-10): \`tools/strategies.ts\` run over who's practising,
 * how rested, what, how often and how broadly, each on the matched seeds and the held-out ones, the results kept a line
 * each in docs/verification/balance/results.jsonl with the commit and tree they ran on. A run already kept for this tree
 * is skipped, so a long grid is resumed by calling it again; \`--max N\` keeps one call short.
 *
 *   node tools/balance-batch.mjs [--max N] [--status]
 *   node tools/balance-batch.mjs --report        writes docs/verification/BALANCE-GRID.md from the kept results
 */
import { execSync, spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const STRATS = 'steady,precision,spaced,variation,live,tier-above,adaptive';
// Each scenario: an id, what it's for, and the flags it runs with.
export const GRID = [
  ['baseline', 'A new student, rested, three abilities, two hours a day', []],
  ['beginner', 'Everything near 30', ['--profile', 'beginner']],
  ['specialist', 'The plan’s targets at 85, the rest 40', ['--profile', 'specialist']],
  ['uneven', 'The plan’s targets weak (30), the rest strong (80)', ['--profile', 'uneven']],
  ['mastered', 'Everything full', ['--profile', 'mastered']],
  ['tired', 'A new student, every practice hour on a tired day', ['--tired']],
  ['tired-beginner', 'A beginner, tired', ['--profile', 'beginner', '--tired']],
  ['one', 'Concentrated: one exercise only', ['--plan', 'one']],
  ['six', 'Broad: six exercises in turn', ['--plan', 'six']],
  ['craft', 'Three techniques a material asks for', ['--plan', 'craft']],
  ['every3', 'One practice day in three', ['--every', '3']],
  ['every3-tired', 'One practice day in three, tired', ['--every', '3', '--tired']],
  ['four-hours', 'Four hours on a practice day', ['--per-day', '4']],
];
const SEEDSETS = ['matched', 'held-out'];
const OUT = 'docs/verification/balance';
const FILE = `${OUT}/results.jsonl`;

const sh = (c) => execSync(c, { encoding: 'utf8' }).trim();
const commit = sh('git rev-parse --short HEAD');
const tree = sh('git log -1 --format=%t');
const dirty = sh('git status --porcelain -- src tools').split('\n').filter(Boolean).length;
mkdirSync(OUT, { recursive: true });
const kept = existsSync(FILE) ? readFileSync(FILE, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)) : [];
const done = new Set(kept.filter((r) => r.tree === tree).map((r) => `${r.id}|${r.seedSet}`));
const jobs = GRID.flatMap(([id, what, flags]) => SEEDSETS.map((seedSet) => ({ id, what, flags, seedSet })));

if (process.argv.includes('--status')) {
  console.log(`balance grid on ${commit} (tree ${tree}${dirty ? `, ${dirty} dirty` : ''}): ${jobs.filter((j) => done.has(`${j.id}|${j.seedSet}`)).length} of ${jobs.length} done`);
  process.exit(0);
}

if (process.argv.includes('--report')) {
  const latest = new Map();
  for (const r of kept) latest.set(`${r.id}|${r.seedSet}`, r);
  const f = (x) => (x === undefined ? '' : x.toFixed(2));
  const lines = ['# The Practice-Balance Grid', '', `Written by \`node tools/balance-batch.mjs --report\` from \`${FILE}\`. Each row is three seeds (n = 3) of 30 days through \`practice.exercise\` inside the School's own week; every strategy on a seed meets the same days. "vs steady" is the paired difference on each seed: its mean, its standard deviation, and on how many seeds it was ahead. Work is the mean change in the expected whole of two scenes (Earnest, Richard III), so points on a target the work doesn't read count for nothing there.`, ''];
  for (const [id, what] of GRID) {
    for (const seedSet of SEEDSETS) {
      const r = latest.get(`${id}|${seedSet}`);
      if (!r) continue;
      lines.push(`## ${id} (${seedSet}): ${what}`, '', `Ran on ${r.commit} (tree ${r.tree}${r.dirty ? `, ${r.dirty} dirty` : ''}), seeds ${r.result.seeds.join(', ')}, ${r.result.days} days.`, '', '| Strategy | Hours | Focus | On the targets (mean ± sd, min–max) | Carried | Work | vs steady: targets | vs steady: work | Ahead (targets, work) |', '|---|---|---|---|---|---|---|---|---|');
      for (const t of r.result.table) lines.push(`| ${t.strategy} | ${f(t.hours.mean)} | ${f(t.meanFocus)} | ${f(t.primary.mean)} ± ${f(t.primary.sd)} (${f(t.primary.min)}–${f(t.primary.max)}) | ${f(t.transfer.mean)} | ${f(t.workGain.mean)} ± ${f(t.workGain.sd)} | ${f(t.vsSteady.primary.mean)} ± ${f(t.vsSteady.primary.sd)} | ${f(t.vsSteady.workGain.mean)} ± ${f(t.vsSteady.workGain.sd)} | ${t.wonOn.primary}, ${t.wonOn.workGain} of ${t.primary.n} |`);
      lines.push('');
    }
  }
  writeFileSync('docs/verification/BALANCE-GRID.md', `${lines.join('\n')}\n`);
  console.log('Wrote docs/verification/BALANCE-GRID.md');
  process.exit(0);
}

const max = (() => { const i = process.argv.indexOf('--max'); return i > 0 ? Number(process.argv[i + 1]) : Infinity; })();
let ran = 0;
for (const j of jobs) {
  if (ran >= max) break;
  if (done.has(`${j.id}|${j.seedSet}`)) continue;
  const t0 = Date.now();
  const out = spawnSync('npx', ['vite-node', 'tools/strategies.ts', '--', '--days', '30', '--seeds', j.seedSet, '--only', STRATS, ...j.flags], { encoding: 'utf8', shell: true, maxBuffer: 64 * 1024 * 1024 });
  let result;
  try { result = JSON.parse(out.stdout); } catch { console.log(`FAILED ${j.id} ${j.seedSet}: ${(out.stderr || out.stdout).slice(0, 400)}`); continue; }
  delete result.rows;
  appendFileSync(FILE, `${JSON.stringify({ id: j.id, seedSet: j.seedSet, commit, tree, dirty, flags: j.flags, seconds: Math.round((Date.now() - t0) / 1000), result })}\n`);
  ran += 1;
  console.log(`${Math.round((Date.now() - t0) / 1000)}s ${j.id} ${j.seedSet}`);
}
console.log(`balance grid: ${done.size + ran} of ${jobs.length} done on tree ${tree}`);
