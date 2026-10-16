/**
 * SLATE — the acting criteria's "it catches what it should" clauses, run (from 2026-10-16, brief 10;
 * docs/verification/decisions-2026-10-16/criteria.md: ST3-R (e), ST6-R (g), H4-R (e)). Each mutation is made in a copy
 * of the tree (src, tools, the package files; `node_modules` linked), never in the tree itself; the measuring command is
 * run in the copy, and the clause it names is read from what the command wrote. A mutation is killed where the clause
 * then fails. The copy is removed after.
 *
 *   node tools/judge-mutations.mjs --list docs/verification/decisions-2026-10-16/mutations.json --work <scratch dir> --out <result.json> [--only id,id]
 */
import { cpSync, existsSync, mkdirSync, readFileSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { join, resolve } from 'node:path';

const arg = (n, d) => { const i = process.argv.indexOf(`--${n}`); return i >= 0 ? process.argv[i + 1] : d; };
const root = resolve('.');
const list = JSON.parse(readFileSync(arg('list', 'docs/verification/decisions-2026-10-16/mutations.json'), 'utf8'));
const work = resolve(arg('work', '/tmp/judge-mutations'));
const only = arg('only', '') ? arg('only', '').split(',') : undefined;
const outFile = arg('out', join(work, 'mutations-result.json'));
const results = existsSync(outFile) ? JSON.parse(readFileSync(outFile, 'utf8')) : [];
mkdirSync(work, { recursive: true });

for (const m of list) {
  if (only && !only.includes(m.id)) continue;
  const dir = join(work, `mut-${m.id}`);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  for (const x of ['src', 'tools', 'tests', 'package.json', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'vite.config.ts', 'vitest.config.ts']) cpSync(join(root, x), join(dir, x), { recursive: true });
  symlinkSync(join(root, 'node_modules'), join(dir, 'node_modules'));
  // Each edit's text must occur exactly once in its file, or the mutation isn't run.
  const edits = m.edits ?? [{ file: m.file, find: m.find, replace: m.replace }];
  const bad = edits.map((e) => ({ e, n: readFileSync(join(dir, e.file), 'utf8').split(e.find).length - 1 })).filter((x) => x.n !== 1);
  if (bad.length) { results.push({ id: m.id, clause: m.clause, error: bad.map((x) => `the text to mutate occurs ${x.n} times in ${x.e.file}`).join('; ') }); console.log(`${m.id}: NOT RUN`); continue; }
  for (const e of edits) { const f = join(dir, e.file); writeFileSync(f, readFileSync(f, 'utf8').replace(e.find, e.replace)); }
  const out = join(dir, 'mutated-output.json');
  const args = m.args.map((a) => (a === '$OUT' ? out : a));
  let exit = 0;
  try { execFileSync(m.cmd, args, { cwd: dir, stdio: ['ignore', 'pipe', 'pipe'], timeout: 15 * 60_000, maxBuffer: 256 * 1024 * 1024 }); } catch (e) { exit = e.status ?? 1; }
  // The clause is read from the output by an expression over it (`o`), true where the clause is met.
  let verdict, figure;
  try {
    const o = JSON.parse(readFileSync(out, 'utf8'));
    verdict = new Function('o', `return (${m.verdict});`)(o);
    figure = m.figure ? new Function('o', `return (${m.figure});`)(o) : undefined;
  } catch (e) { verdict = undefined; figure = `no output (${e.message})`; }
  // Killed: the clause the mutation should break reads false (not met) in the mutated copy.
  const killed = verdict === false;
  results.push({ id: m.id, clause: m.clause, edits, command: `${m.cmd} ${m.args.join(' ')}`, exit, verdictPath: m.verdict, verdict, figure, killed });
  writeFileSync(outFile, `${JSON.stringify(results, null, 1)}\n`);
  console.log(`${m.id}: ${killed ? 'killed' : 'SURVIVED'} (${m.clause}, ${m.verdict} = ${verdict})`);
  rmSync(dir, { recursive: true, force: true });
}
writeFileSync(outFile, `${JSON.stringify(results, null, 1)}\n`);
