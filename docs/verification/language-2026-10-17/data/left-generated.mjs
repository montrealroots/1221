// Lists what's left in the shown fields of the probe-made files: dates the step doesn't read (slashed, a month's number).
import { readFileSync } from 'node:fs';
const { GENERATED, editFields } = await import(process.cwd() + '/tools/research-dates.mjs');
const MON3 = 'Jan|Feb|Mar|Apr|Jun|Jul|Aug|Sep|Sept|Oct|Nov|Dec';
const RE = new RegExp(String.raw`\b\d{1,2}\.\d{1,2}\.\d{2,4}\b|\b\d{1,2}/\d{1,2}/\d{2,4}\b|\b\d{1,2}/\d{4}\b|\b\d{4}/\d{2}\b(?!\d)|\b\d{4}-\d{2}-\d{2}\b|\b\d{1,2} (January|February|March|April|May|June|July|August|September|October|November|December|${MON3})\b|\b(${MON3})\.? \d{4}\b`, 'g');
for (const [file, exps] of Object.entries(GENERATED)) {
  const src = readFileSync(file, 'utf8');
  for (const m of src.matchAll(/export const (\w+)\b[^=]*= JSON\.parse\(("(?:[^"\\]|\\.)*")\);/g)) {
    const data = JSON.parse(JSON.parse(m[2]));
    editFields(data, exps[m[1]] ?? [], (t) => { for (const x of t.matchAll(RE)) console.log(`${file} ${m[1]}: …${t.slice(Math.max(0, x.index - 70), x.index)}⟦${x[0]}⟧${t.slice(x.index + x[0].length, x.index + x[0].length + 25)}…`); return t; });
  }
}
