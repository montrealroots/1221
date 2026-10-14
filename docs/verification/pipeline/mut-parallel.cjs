// Runs the evidence pass's mutations in parallel, each worker in its own copy of the repository (src, tests, docs,
// public, base44 and the root config; node_modules joined, not copied), so the working tree itself is never edited.
// A mutation is killed only where a test that passed in the copy as it is fails with the edit. Resumable per worker.
//   node mut-parallel.cjs <workers> <out.json> <results.json>...     (main: copies, shards by test file, waits, merges)
//   node mut-parallel.cjs --worker <i> <shard.json> <out-i.json>     (one worker)
const fs = require('fs');
const path = require('path');
const { execSync, spawn } = require('child_process');
const ROOT = require('path').join(__dirname, '../../..') + '/';
const S = require('path').join(__dirname, 'inputs') + '/';
// Copies, shards and outputs in the system's temporary folder, never inside the repository.
const TMP = require('path').join(require('os').tmpdir(), 'slate-mut') + '/';
fs.mkdirSync(TMP, { recursive: true });
const keyOf = (m) => `${m.id}|${m.file}|${m.find}`;

if (process.argv[2] === '--worker') {
  const [, , , i, shardFile, outFile] = process.argv;
  const dir = `${TMP}mutcopy-${i}/`;
  const shard = JSON.parse(fs.readFileSync(shardFile, 'utf8'));
  const done = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : [];
  const seen = new Set(done.map(keyOf));
  const save = () => fs.writeFileSync(outFile, JSON.stringify(done, null, 1));
  const tmp = `${TMP}mut-run-${i}.json`;
  const run = (test) => {
    try { fs.unlinkSync(tmp); } catch {}
    try { execSync(`npx vitest run ${test} --reporter=json --outputFile=${tmp}`, { cwd: dir, stdio: 'pipe', timeout: 400000, env: { ...process.env, VITEST_MAX_FORKS: '1', VITEST_MIN_FORKS: '1' } }); } catch {}
    if (!fs.existsSync(tmp)) return { ok: false, passed: new Set() };
    const r = JSON.parse(fs.readFileSync(tmp, 'utf8'));
    const all = (r.testResults ?? []).flatMap((f) => f.assertionResults ?? []);
    return { ok: true, passed: new Set(all.filter((a) => a.status === 'passed').map((a) => a.fullName)) };
  };
  const baselines = {};
  for (const rec of shard) {
    if (seen.has(keyOf(rec))) continue;
    const target = dir + rec.file;
    if (!fs.existsSync(target)) { done.push({ ...rec, applied: false, why: 'no such file' }); save(); continue; }
    const original = fs.readFileSync(target, 'utf8');
    const n = original.split(rec.find).length - 1;
    if (n !== 1) { done.push({ ...rec, applied: false, why: `${n} matches` }); save(); continue; }
    baselines[rec.test] ??= run(rec.test);
    const base = baselines[rec.test];
    // A baseline where nothing passed ran nothing: no mutation can be killed against it.
    if (!base.ok || base.passed.size === 0) { done.push({ ...rec, applied: false, why: 'the test file didn’t run' }); save(); continue; }
    fs.writeFileSync(target, original.replace(rec.find, rec.replace));
    let got;
    try { got = run(rec.test); } finally { fs.writeFileSync(target, original); }
    const newlyFailed = [...base.passed].filter((t) => !got.passed.has(t));
    const killed = !got.ok || newlyFailed.length > 0;
    done.push({ ...rec, applied: true, killed, by: newlyFailed.slice(0, 5), compiledFailed: !got.ok });
    save();
    console.log(`[${i}] ${killed ? 'KILLED  ' : 'SURVIVED'} ${rec.id} ${rec.file}`);
  }
  console.log(`[${i}] done: ${done.length}`);
  process.exit(0);
}

const [workers, outFile, ...resultFiles] = process.argv.slice(2);
const K = Number(workers);
// Every mutation, as run-mutations.cjs names it.
const recs = [];
for (const f of resultFiles) for (const g of JSON.parse(fs.readFileSync(f, 'utf8'))) {
  if (!g.testFile) continue;
  const test = g.testFile.replace(/\\/g, '/').replace(/^.*?tests\//, 'tests/');
  for (const row of g.rows ?? []) for (const m of row.mutations ?? []) {
    recs.push({ id: row.id, key: g.key, file: m.file.replace(/\\/g, '/').replace(/^.*1221-GIT\//, ''), find: m.find, replace: m.replace, protects: m.protects, test });
  }
}
// Shards by test file, the largest first onto the lightest worker, so each worker computes each baseline once.
const byTest = new Map();
for (const r of recs) { if (!byTest.has(r.test)) byTest.set(r.test, []); byTest.get(r.test).push(r); }
const shards = Array.from({ length: K }, () => []);
for (const list of [...byTest.values()].sort((a, b) => b.length - a.length)) shards.sort((a, b) => a.length - b.length)[0].push(...list);
// The copies, fresh from the working tree.
// tools/ too: some tests import from it (tools/policy.ts), and without it they ran nothing (found 2026-10-13).
const COPY = ['src', 'tests', 'docs', 'public', 'base44', 'tools'];
const FILES = ['package.json', 'vitest.config.ts', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'index.html'];
for (let i = 0; i < K; i += 1) {
  const dir = `${TMP}mutcopy-${i}/`;
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    for (const d of COPY) fs.cpSync(ROOT + d, dir + d, { recursive: true });
    for (const f of FILES) if (fs.existsSync(ROOT + f)) fs.copyFileSync(ROOT + f, dir + f);
    fs.symlinkSync(path.resolve(ROOT + 'node_modules'), dir + 'node_modules', 'junction');
  }
  fs.writeFileSync(`${TMP}mut-shard-${i}.json`, JSON.stringify(shards[i]));
}
console.log(`${recs.length} mutations in ${byTest.size} test files, shards of ${shards.map((s) => s.length).join(', ')}`);
let left = K;
for (let i = 0; i < K; i += 1) {
  const p = spawn(process.execPath, [__filename, '--worker', String(i), `${TMP}mut-shard-${i}.json`, `${TMP}mut-out-${i}.json`], { stdio: 'inherit' });
  p.on('exit', () => {
    left -= 1;
    if (left > 0) return;
    const all = [];
    for (let j = 0; j < K; j += 1) if (fs.existsSync(`${TMP}mut-out-${j}.json`)) all.push(...JSON.parse(fs.readFileSync(`${TMP}mut-out-${j}.json`, 'utf8')));
    fs.writeFileSync(outFile, JSON.stringify(all, null, 1));
    console.log(`mutations: ${all.length}, applied ${all.filter((d) => d.applied).length}, killed ${all.filter((d) => d.killed).length}`);
  });
}
