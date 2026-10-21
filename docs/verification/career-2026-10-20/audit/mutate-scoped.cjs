// P1 and P2 again, scoped to the twin that should hold each: the reader reads no preparation only while the twin plays
// (a flag the twin sets in this copy's test), so life A's own play runs as written and the twin's expectation alone
// is what can fail. Run in a copy of the tree, never the working tree: node scoped.cjs <copy> <out.json>
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const [copy, outFile] = process.argv.slice(2);
const SRC = path.join(copy, 'src/engine/systems/projobs.ts');
const TEST = path.join(copy, 'tests/journey-career.test.ts');
const FLAG = '(globalThis as { __mutant?: string }).__mutant';
const runs = [
  { id: 'Q10b', of: 'P1', find: '  const p = o.prep ?? ZERO;\n', replace: `  const p = ${FLAG} === 'P1' ? ZERO : (o.prep ?? ZERO);\n`, at: '    const tape = (sides: boolean) => {\n', filter: 'the same SAG-AFTRA self-tape' },
  { id: 'Q11b', of: 'P2', find: '  const p = e.prep ?? ZERO;\n', replace: `  const p = ${FLAG} === 'P2' ? ZERO : (e.prep ?? ZERO);\n`, at: '    const shoot = (part: boolean) => {\n', filter: 'the same booked network part' },
];
const out = [];
const src0 = fs.readFileSync(SRC, 'utf8');
const test0 = fs.readFileSync(TEST, 'utf8');
for (const r of runs) {
  if (src0.split(r.find).length !== 2 || test0.split(r.at).length !== 2) throw new Error(`${r.id}: not found once`);
  fs.writeFileSync(SRC, src0.replace(r.find, r.replace));
  fs.writeFileSync(TEST, test0.replace(r.at, `${r.at}      ${FLAG} = '${r.of}';\n`));
  const started = Date.now();
  const p = spawnSync('npx', ['vitest', 'run', 'tests/journey-career.test.ts', '--maxWorkers=1', '--minWorkers=1', '-t', r.filter], { cwd: copy, encoding: 'utf8', maxBuffer: 64 << 20, timeout: 1_500_000 });
  fs.writeFileSync(SRC, src0);
  fs.writeFileSync(TEST, test0);
  const text = `${p.stdout ?? ''}${p.stderr ?? ''}`;
  const res = { id: r.id, of: r.of, filter: r.filter, killed: p.status !== 0, status: p.status, seconds: Math.round((Date.now() - started) / 1000), summary: (text.match(/Tests\s+[^\n]+/) ?? [''])[0].trim(), failed: [...text.matchAll(/^\s*(?:×|✗|FAIL)\s+(.+)$/gm)].map((x) => x[1].trim()).slice(0, 6), error: (text.match(/AssertionError[^\n]*/) ?? [''])[0] };
  out.push(res);
  fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
  console.log(`${r.id} (${r.of}, scoped to its twin): ${res.killed ? 'killed' : 'survived'} (${res.summary}) ${res.error}`);
}
