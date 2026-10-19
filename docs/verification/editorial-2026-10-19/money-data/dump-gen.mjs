// Brief 15, money-data: prints every string field of a generated content file's JSON.parse exports, by entry and field.
//   node dump-gen.mjs <content file> [EXPORT]
// Dumps every string field of each JSON.parse export of a generated content file, by entry and field.
import { readFileSync } from 'node:fs';
const [file, only] = process.argv.slice(2);
const src = readFileSync(file, 'utf8');
for (const m of src.matchAll(/export const (\w+)\b[^=]*= JSON\.parse\(("(?:[^"\\]|\\.)*")\);/g)) {
  const data = JSON.parse(JSON.parse(m[2]));
  if (only && m[1] !== only) continue;
  console.log(`######## ${m[1]} (${Object.keys(data).length} entries)`);
  const walk = (v, path) => {
    if (typeof v === 'string') console.log(`${path}: ${v}`);
    else if (Array.isArray(v)) v.forEach((x, i) => walk(x, `${path}[${i}]`));
    else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) walk(x, path ? `${path}.${k}` : k);
  };
  for (const [k, v] of Object.entries(data)) { console.log(`=== ${k}`); walk(v, ''); }
}
