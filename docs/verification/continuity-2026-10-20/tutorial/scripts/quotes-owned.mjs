// Every quote (5 words or more) in the guide's files, and the files outside the guide that say it; those said only in the
// coordinator's files are printed, with the guide line that quotes them.
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
const ROOT = process.argv[2];
process.chdir(ROOT);
const COORD = ['src/engine/systems/feedback.ts', 'src/engine/systems/classmates.ts', 'src/engine/systems/production.ts', 'src/engine/systems/coursework.ts', 'src/engine/content/coursework.ts', 'src/engine/systems/learning.ts', 'src/ui/components/ClassMoments.tsx', 'src/ui/components/CourseworkPane.tsx', 'src/engine/systems/evaluation.ts'];
const GUIDE = [/^src\/engine\/content\/tutorial\.ts$/, /^src\/engine\/content\/guide\/[\w-]+\.ts$/];
const walk = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f).split('\\').join('/'); return statSync(p).isDirectory() ? (['geography', 'world-data'].includes(f) ? [] : walk(p)) : /\.(ts|tsx)$/.test(f) && !/\.test\./.test(f) ? [p] : []; });
const files = walk('src');
const isGuide = (f) => GUIDE.some((r) => r.test(f));
const text = Object.fromEntries(files.filter((f) => !isGuide(f)).map((f) => [f, readFileSync(f, 'utf8').replace(/\\'/g, '\'').replace(/\\u2019/g, '’')]));
const MONTHS = 'January|February|March|April|May|June|July|August|September|October|November|December';
const stretches = (q) => q.split(new RegExp(`\\bN\\b|\\$\\{(?:[^{}]|\\{[^{}]*\\})*\\}|\\{[^}]*\\}|…|\\$?[\\d][\\d,.:%]*|\\b(?:${MONTHS})\\b`, 'g')).map((s) => s.trim().replace(/^[,.;:]\s*|\s*[,;:]$/g, '')).filter((s) => s.split(/\s+/).length >= 3);
const COMMENT = /^\s*(?:\/\/|\/\*|\*)/;
let n = 0;
for (const f of files.filter(isGuide)) {
  readFileSync(f, 'utf8').split('\n').forEach((line, i) => {
    if (COMMENT.test(line)) return;
    for (const m of line.matchAll(/“([^”]{8,}?)”/g)) {
      const q = m[1];
      if (q.split(/\s+/).length < 5) continue;
      const parts = stretches(q);
      if (!parts.length) continue;
      const where = new Set();
      for (const p of parts) for (const [g, t] of Object.entries(text)) if (t.includes(p)) where.add(g);
      const coordOnly = where.size > 0 && [...where].every((g) => COORD.includes(g));
      if (coordOnly) { n++; console.log(`${f}:${i + 1}  “${q.slice(0, 110)}”  ← ${[...where].join(', ')}`); }
    }
  });
}
console.log(`${n} quotes said only in the coordinator's files`);
