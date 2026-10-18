/**
 * Brief 14, the research data's dates: proves the five probe-made files changed only where the words step says.
 *
 * For each `JSON.parse` export of `content/cards.ts`, `accountlife.ts`, `cash.ts`, `pending.ts` and `security.ts`, the
 * data at a commit (argv[2], the commit before the step) and now: every value that differs must be a field
 * `GENERATED` names, and equal to `noSpaceBefore(gameDates(old))` with the field's `BY_HAND` edits after it. Every
 * number, key, id and every field it doesn't name must be the same. Prints the count of fields changed by file and export, and exits 1 on anything else.
 *
 *   node docs/verification/language-2026-10-17/data/generated-diff.mjs c74a02e1
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { BY_HAND, GENERATED, gameDates, noSpaceBefore } from '../../../../tools/research-dates.mjs';

const base = process.argv[2];
if (!base) { console.error('a commit to compare with'); process.exit(2); }
const exportsOf = (source) => Object.fromEntries([...source.matchAll(/export const (\w+)\b[^=]*= JSON\.parse\(("(?:[^"\\]|\\.)*")\);/g)].map((m) => [m[1], JSON.parse(JSON.parse(m[2]))]));
const pathOk = (paths, key, field) => paths.some((p) => { const [first, ...rest] = p.split('.'); return (first === '*' || first === key) && rest.length === 1 && rest[0] === field; });

let bad = 0;
for (const [file, named] of Object.entries(GENERATED)) {
  const before = exportsOf(execFileSync('git', ['show', `${base}:${file}`], { encoding: 'utf8', maxBuffer: 1 << 26 }));
  const after = exportsOf(readFileSync(file, 'utf8'));
  for (const name of new Set([...Object.keys(before), ...Object.keys(after)])) {
    const a = before[name], b = after[name];
    if (!a || !b) { console.error(`${file} ${name}: in one and not the other`); bad++; continue; }
    let changed = 0;
    const walk = (x, y, path, key, field) => {
      if (typeof x !== typeof y || Array.isArray(x) !== Array.isArray(y)) { console.error(`${file} ${name}${path}: its type changed`); bad++; return; }
      if (x && typeof x === 'object') {
        const keys = new Set([...Object.keys(x), ...Object.keys(y)]);
        for (const k of keys) {
          if (!(k in x) || !(k in y)) { console.error(`${file} ${name}${path}.${k}: in one and not the other`); bad++; continue; }
          walk(x[k], y[k], `${path}.${k}`, key ?? k, key === undefined ? undefined : field ?? k);
        }
        return;
      }
      if (x === y) return;
      const byHand = (t) => BY_HAND.filter(([f, n, k, fl]) => f === file && n === name && k === key && fl === field).reduce((acc, [, , , , was, now]) => acc.replace(was, now), t);
      if (typeof x === 'string' && pathOk(named[name] ?? [], key, field) && y === byHand(noSpaceBefore(gameDates(x)))) { changed++; return; }
      console.error(`${file} ${name}${path}: changed outside the step\n  - ${x}\n  + ${y}`); bad++;
    };
    walk(a, b, '', undefined, undefined);
    console.log(`${file} ${name}: ${changed} fields changed by the step`);
  }
}
console.log(bad ? `${bad} differences outside the step` : 'Every other value is as it was.');
process.exit(bad ? 1 : 0);
