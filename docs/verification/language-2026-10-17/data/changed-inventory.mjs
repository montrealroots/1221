// Brief 14, the research data's dates: two `--show "*"` listings (the base and now) compared string by string.
// The inventory's strings at the base and now, source by source and line by line: how many changed, by file.
import { readFileSync } from 'node:fs';
const parse = (p) => { const m = new Map(); let src = null; for (const l of readFileSync(p, 'utf8').split('\n')) { const h = l.match(/^## (.+?)  \[/); if (h) { src = h[1]; m.set(src, []); continue; } const s = l.match(/^\s+(\d+) (\S+)\s+(.*)$/); if (s && src) m.get(src).push(s[3]); } return m; };
const a = parse(process.argv[2]), b = parse(process.argv[3]);
let changed = 0, sources = 0; const byFile = {};
for (const [id, xs] of a) { const ys = b.get(id); if (!ys) { console.log('gone', id); continue; } let c = 0; for (let i = 0; i < Math.max(xs.length, ys.length); i++) if (xs[i] !== ys[i]) c++; if (c) { sources++; changed += c; const f = id.split('#')[0]; byFile[f] = (byFile[f] ?? 0) + c; } }
for (const id of b.keys()) if (!a.has(id)) console.log('new', id);
console.log(JSON.stringify({ changedStrings: changed, sources }));
console.log(Object.entries(byFile).sort((x, y) => y[1] - x[1]).map(([f, n]) => `${String(n).padStart(4)} ${f}`).join('\n'));
