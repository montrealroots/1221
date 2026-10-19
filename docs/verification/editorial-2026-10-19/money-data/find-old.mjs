// For each changed field's old words, finds any stretch of six of them quoted in tests, tools or src (outside the content files named).
import { readFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
const [changes, repo, ...skip] = process.argv.slice(2);
const list = JSON.parse(readFileSync(changes, 'utf8'));
const files = execSync(`git -C ${repo} ls-files tests tools src`, { encoding: 'utf8' }).split('\n')
  .filter((f) => f && /\.(ts|tsx|mjs|js)$/.test(f) && !skip.some((s) => f.endsWith(s)) && !f.includes('verification'));
const norm = (s) => s.replace(/[’']/g, "'").replace(/\\"/g, '"');
const big = files.map((f) => `\u0000${f}\u0000` + norm(readFileSync(`${repo}/${f}`, 'utf8'))).join('');
const owner = (at) => { const s = big.lastIndexOf('\u0000', at); const e = big.lastIndexOf('\u0000', s - 1); return big.slice(e + 1, s); };
for (const c of list) {
  const words = norm(c.before).split(/\s+/);
  const hits = new Set();
  for (let i = 0; i + 6 <= words.length; i += 2) {
    const piece = words.slice(i, i + 6).join(' ');
    let at = big.indexOf(piece);
    while (at >= 0) { hits.add(owner(at)); at = big.indexOf(piece, at + 1); }
  }
  if (hits.size) console.log(`${c.export}.${c.key}.${c.field}: ${[...hits].join(', ')}`);
}
