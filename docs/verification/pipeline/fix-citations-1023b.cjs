// Corrects the rows tools/coverage.mjs found not holding after the owner's brief 24 (2026-10-23, later the same day as
// fix-citations-1023.cjs: Calendar and Updates off the menu, reached from Home, and Open Calendar opened with "What's
// Coming"), in doc-fields.json and renames.json, which merge-review.cjs applies. EDITS replace a text found exactly once.
// A row keeps what it said before in the past tense, with the day it stopped being so.
const fs = require('fs');
const S = require('path').join(__dirname, 'inputs') + '/';
const ROOT = require('path').join(__dirname, '../../..') + '/';
const df = JSON.parse(fs.readFileSync(S + 'doc-fields.json', 'utf8'));
const renames = JSON.parse(fs.readFileSync(S + 'renames.json', 'utf8'));
const audit = {};
for (const a of ['life', 'school', 'money', 'papers', 'ui']) for (const i of JSON.parse(fs.readFileSync(`${ROOT}docs/verification/audit/${a}.json`, 'utf8')).items) audit[i.id] = i;

const RENAMES = {
  // The button opened with the section's chapter from brief 24: until then it waited for “Your Own Plans”.
  'Open Calendar, pressed, goes to /workspace/calendar; a guided life keeps the section locked until “What’s Coming” is read, and the button until “Your Own Plans”': 'Open Calendar, pressed, goes to /workspace/calendar; a guided life keeps the section and its button locked until “What’s Coming” is read, and opens both with it',
};

const EDITS = [
  ['h-calendar', 'tests', "'Open Calendar, pressed, goes to /workspace/calendar; a guided life keeps the section locked until “What’s Coming” is read…'", "'Open Calendar, pressed, goes to /workspace/calendar; a guided life keeps the section and its button locked until “What’s Coming” is read…'"],
  ['h-calendar', 'tests', 'Until 2026-10-13 no test rendered the panel.', 'Until 2026-10-23 (brief 24) Open Calendar opened with “Your Own Plans”, and the menu’s Calendar was the way in before it; until 2026-10-13 no test rendered the panel.'],
];

for (const [k, v] of Object.entries(RENAMES)) renames[k] = v;
const fieldOf = (id, field) => {
  const row = (df[id] ??= {});
  if (row[field] === undefined) {
    if (!audit[id]) throw new Error(`no row ${id}`);
    row[field] = field === 'corrected.now' ? audit[id].corrected?.now : audit[id][field];
    if (row[field] === undefined) throw new Error(`${id} has no ${field}`);
  }
  return row;
};
let n = 0;
for (const [id, field, from, to] of EDITS) {
  const row = fieldOf(id, field);
  const at = row[field].split(from).length - 1;
  if (at !== 1) throw new Error(`${id}.${field}: found ${at} times: ${from}`);
  row[field] = row[field].replace(from, () => to);
  n += 1;
}
fs.writeFileSync(S + 'doc-fields.json', JSON.stringify(df, null, 1));
fs.writeFileSync(S + 'renames.json', JSON.stringify(renames, null, 1) + '\n');
console.log(`${n} edits, ${Object.keys(RENAMES).length} renames`);
