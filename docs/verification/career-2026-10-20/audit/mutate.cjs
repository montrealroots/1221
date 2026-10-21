// The audit's mutation runner (brief 19's command rows, 2026-10-21). Each mutation replaces one exact string, which must
// occur once, in a copy of the tree, runs the named tests with one worker, records whether they failed and which, and
// puts the file back. Run from this folder: node mutate.cjs <a copy of the tree> mutations-list.json mutations.json
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const [copy, listFile, outFile] = process.argv.slice(2);
const list = JSON.parse(fs.readFileSync(listFile, 'utf8'));
const out = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : [];
for (const m of list) {
  if (out.some((x) => x.id === m.id)) continue;
  const file = path.join(copy, m.file);
  const before = fs.readFileSync(file, 'utf8');
  const count = before.split(m.find).length - 1;
  if (count !== 1) { out.push({ ...m, applied: false, why: `found ${count} times` }); fs.writeFileSync(outFile, JSON.stringify(out, null, 1)); continue; }
  fs.writeFileSync(file, before.replace(m.find, m.replace));
  const args = ['vitest', 'run', ...m.tests, '--maxWorkers=1', '--minWorkers=1', ...(m.filter ? ['-t', m.filter] : [])];
  const started = Date.now();
  const r = spawnSync('npx', args, { cwd: copy, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, timeout: 1_500_000 });
  fs.writeFileSync(file, before);
  const text = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  const failed = [...text.matchAll(/^\s*(?:×|✗|FAIL)\s+(.+)$/gm)].map((x) => x[1].trim()).slice(0, 12);
  const summary = (text.match(/Tests\s+[^\n]+/) ?? [''])[0].trim();
  out.push({ id: m.id, row: m.row, file: m.file, tests: m.tests, filter: m.filter, expect: m.expect, applied: true, killed: r.status !== 0, status: r.status, seconds: Math.round((Date.now() - started) / 1000), summary, failed });
  fs.writeFileSync(outFile, JSON.stringify(out, null, 1));
  console.log(`${m.id} ${m.row}: ${r.status !== 0 ? 'killed' : 'survived'} (${summary})`);
}
