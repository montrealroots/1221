// Print a frame walk's screens for reading, the country and state lists left out (they're the gazetteer's, and long):
//   node docs/verification/continuity-2026-10-20/frame/read-walk.mjs WALK.json [FROM-SCREEN] [TO-SCREEN]
import { readFileSync } from 'node:fs';
const [file, from = '', to = ''] = process.argv.slice(2);
const w = JSON.parse(readFileSync(file, 'utf8'));
const skip = new Set();
let on = false;
for (const r of w.out) {
  const lines = (r.text ?? '').split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] === 'Country' && lines[i + 1] === 'Afghanistan') { on = true; continue; }
    if (on) { if (lines[i] === 'Zimbabwe') { on = false; } skip.add(lines[i]); }
  }
}
const months = new Set(['January','February','March','April','May','June','July','August','September','October','November','December']);
let printing = !from;
for (const r of w.out) {
  if (from && r.screen.startsWith(from)) printing = true;
  if (to && r.screen.startsWith(to)) printing = false;
  if (!printing) continue;
  console.log(`\n=========== ${r.screen}${r.overflow ? ' [OVERFLOW]' : ''}`);
  if (r.dialogs?.length) { console.log('--- dialogs:'); console.log(r.dialogs.join('\n---\n')); continue; }
  const lines = (r.text ?? '').split('\n');
  let monthRun = 0;
  for (const l of lines) {
    if (skip.has(l) && !['Country'].includes(l)) continue;
    if (months.has(l)) { monthRun++; if (monthRun > 1) continue; } else monthRun = 0;
    console.log(l);
  }
}
