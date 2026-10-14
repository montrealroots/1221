// For each test title the audit cites that its file doesn't hold (as tools/coverage.mjs reports them), finds the
// file's closest title by word overlap. A close one (0.6 or more) is taken: into renames.json where the citation is a
// test the evidence passes added, into doc-fields.json where it's in a row's own text. The rest are listed to read.
const fs = require('fs');
const { spawnSync } = require('child_process');
const ROOT = require('path').join(__dirname, '../../..') + '/';
const S = require('path').join(__dirname, 'inputs') + '/';
const run = spawnSync('node', ['tools/coverage.mjs'], { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 << 20 });
const out = (run.stdout ?? '') + (run.stderr ?? '');
const plain = (s) => s.replace(/[’‘]/g, "'").replace(/[“”]/g, '"');
const words = (s) => new Set(plain(s).toLowerCase().split(/[^a-z0-9$.%]+/).filter((w) => w.length > 1));
const titlesOf = (file) => {
  const text = fs.readFileSync(ROOT + 'tests/' + file, 'utf8');
  return [...text.matchAll(/\bit\(\s*(['`"])((?:\\.|(?!\1).)*)\1/g)].map((m) => m[2].replace(/\\'/g, "'"));
};
const renames = JSON.parse(fs.readFileSync(S + 'renames.json', 'utf8'));
const doc = JSON.parse(fs.readFileSync(S + 'doc-fields.json', 'utf8'));
const unresolved = [];
let renamed = 0, fixed = 0;
for (const line of out.split('\n')) {
  const m = /^(\w+) (.+?): (added: )?([\w.-]+\.test\.ts) has no test ‘(.*)’$/.exec(line);
  if (!m) continue;
  const [, , id, added, file, cited] = m;
  const want = words(cited.split(' > ').pop());
  let best = '', score = 0;
  for (const t of titlesOf(file)) {
    const have = words(t);
    const inter = [...want].filter((w) => have.has(w)).length;
    const s = inter / Math.max(1, Math.min(want.size, have.size));
    if (s > score) { score = s; best = t; }
  }
  if (score < 0.6) { unresolved.push(`${id} | ${file} | ${cited.slice(0, 140)} | best ${score.toFixed(2)}: ${best.slice(0, 100)}`); continue; }
  if (added) {
    // The cited title as the results hold it may carry curly or straight quotes: key both.
    const bare = cited.split(' > ').pop();
    renames[bare] = best; renames[bare.replace(/'/g, '’')] = best; renamed += 1;
  } else {
    const fields = doc[id] ?? {};
    let hit = false;
    for (const k of Object.keys(fields)) {
      for (const variant of [cited, cited.replace(/'/g, '’')]) if (fields[k].includes(variant)) { fields[k] = fields[k].split(variant).join(best); hit = true; }
    }
    if (hit) { doc[id] = fields; fixed += 1; } else unresolved.push(`${id} | ${file} | (row text not in doc-fields) ${cited.slice(0, 120)} | best: ${best.slice(0, 100)}`);
  }
}
fs.writeFileSync(S + 'renames.json', JSON.stringify(renames, null, 2));
fs.writeFileSync(S + 'doc-fields.json', JSON.stringify(doc, null, 1));
console.log(`renamed ${renamed}, row text fixed ${fixed}, unresolved ${unresolved.length}`);
for (const u of unresolved) console.log('  ' + u);
