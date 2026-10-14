// A copy of the working tree for one-off mutation checks, so the tree itself is never edited.
//   node solo.cjs fresh                                        (copy the tree again)
//   node solo.cjs <file> <findFile> <replaceFile> <test> [-t pattern]
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const ROOT = require('path').join(__dirname, '../../..') + '/';
const DIR = require('path').join(require('os').tmpdir(), 'slate-mutcopy-solo') + '/';
if (process.argv[2] === 'fresh') {
  fs.rmSync(DIR, { recursive: true, force: true });
  fs.mkdirSync(DIR, { recursive: true });
  for (const d of ['src', 'tests', 'docs', 'public', 'base44']) fs.cpSync(ROOT + d, DIR + d, { recursive: true });
  for (const f of ['package.json', 'vitest.config.ts', 'vite.config.ts', 'tsconfig.json', 'tsconfig.app.json', 'tsconfig.node.json', 'index.html']) if (fs.existsSync(ROOT + f)) fs.copyFileSync(ROOT + f, DIR + f);
  fs.symlinkSync(path.resolve(ROOT + 'node_modules'), DIR + 'node_modules', 'junction');
  console.log('fresh');
  process.exit(0);
}
const [file, findFile, replFile, test, ...rest] = process.argv.slice(2);
const find = fs.readFileSync(findFile, 'utf8').replace(/\r?\n$/, '');
const repl = fs.readFileSync(replFile, 'utf8').replace(/\r?\n$/, '');
const target = DIR + file;
const orig = fs.readFileSync(target, 'utf8');
const n = orig.split(find).length - 1;
if (n !== 1) { console.log(`NOT APPLIED: ${n} matches`); process.exit(2); }
const run = () => {
  try { execSync(`npx vitest run ${test} ${rest.join(' ')}`, { cwd: DIR, stdio: 'pipe', env: { ...process.env, VITEST_MAX_FORKS: '1', VITEST_MIN_FORKS: '1' } }); return true; } catch { return false; }
};
const base = run();
fs.writeFileSync(target, orig.replace(find, repl));
let mut;
try { mut = run(); } finally { fs.writeFileSync(target, orig); }
console.log(`baseline ${base ? 'passed' : 'FAILED'}; mutated ${mut ? 'passed: SURVIVED' : 'failed: KILLED'}`);
