// Brief 14, the research data's dates: the inventory's sources whose text changed since their status was recorded,
// with the area whose statuses file holds them, so each is re-marked by its own area. Run from the clone.
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
const out = execFileSync('node', ['tools/text-inventory.mjs', '--write'], { encoding: 'utf8' });
const inv = JSON.parse(readFileSync('docs/text/inventory.json', 'utf8'));
execFileSync('git', ['checkout', '--', 'docs/text/inventory.json', 'docs/text/INVENTORY.md']);
const owner = {};
for (const f of readdirSync('docs/text/statuses').filter((x) => x.endsWith('.json')).sort((a, b) => (a === 'baseline.json' ? -1 : b === 'baseline.json' ? 1 : a.localeCompare(b)))) {
  for (const id of Object.keys(JSON.parse(readFileSync(`docs/text/statuses/${f}`, 'utf8')))) owner[id] = f.slice(0, -5);
}
const changed = inv.sources.filter((s) => s.status === 'Pending' && /^changed since/.test(s.why ?? ''));
for (const s of changed) console.log(`${owner[s.id] ?? '-'}\t${s.was ?? ''}\t${s.id}`);
console.error(`${changed.length} changed since their status`);
void out;
