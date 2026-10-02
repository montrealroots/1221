#!/usr/bin/env node
/**
 * The chance a building inspection fails, from the Los Angeles Department of
 * Building and Safety's own inspection records (data.lacity.org, "Building and
 * Safety Inspections", 9w5z-rg2h), every inspection since 2023: of the visits
 * that came to an answer, the share that didn't pass.
 *
 * Failed: Corrections Issued, Not Ready for Inspection, No Access for
 * Inspection, each of which sends the builder back for another visit.
 * Passed: Approved, Conditional Approval, and for a final the permit
 * finaled or cleared for a certificate of occupancy. Partial ones, cancellations,
 * scheduling and certificate steps aren't answers and are left out.
 *
 * Usage: node tools/data/inspections.mjs
 * Writes docs/research/world/derived-inspections.json and
 * src/engine/content/inspectionodds.ts.
 */
import { writeFileSync } from 'node:fs';

const BASE = 'https://data.lacity.org/resource/9w5z-rg2h.json';
const SINCE = '2023-01-01';
const FAILED = ['Corrections Issued', 'Not Ready for Inspection', 'No Access for Inspection'];
// A final that passes is recorded as the permit finaled, or as cleared for a certificate of occupancy.
const PASSED = ['Approved', 'Conditional Approval', 'Permit Finaled', 'OK to Issue CofO', 'OK for CofC', 'OK for TCO'];
// SLATE's stages' inspections, by the names LADBS records them under.
const KINDS = {
  foundation: ['Footing/Foundation/Slab', 'Excavation/Setback/Form/Re-Bar'],
  framing: ['Wood Frame', 'BUILDING-Rough-Frame', 'Floor/Roof Diaphrgm/Shear Wall'],
  rough: ['Rough', 'ELECTRICAL-Rough', 'PLUMBING-Rough', 'HVAC-Rough', 'Insulation'],
  final: ['Final', 'ELECTRICAL-Final'],
};

const quote = (xs) => xs.map((x) => `'${x.replace(/'/g, "''")}'`).join(',');
const out = { source: `LADBS, Building and Safety Inspections, ${BASE}, inspections from ${SINCE}`, read: new Date().toISOString().slice(0, 10), failed: FAILED, passed: PASSED, kinds: {} };
for (const [kind, names] of Object.entries(KINDS)) {
  const params = new URLSearchParams({
    $select: 'inspection_result,count(*) as n',
    $where: `inspection_date>='${SINCE}' AND inspection in(${quote(names)}) AND inspection_result in(${quote([...FAILED, ...PASSED])})`,
    $group: 'inspection_result',
  });
  const res = await fetch(`${BASE}?${params}`);
  if (!res.ok) throw new Error(`LADBS refused ${kind}: ${res.status}`);
  const rows = await res.json();
  const n = (set) => rows.filter((r) => set.includes(r.inspection_result)).reduce((a, r) => a + Number(r.n), 0);
  const failed = n(FAILED);
  const passed = n(PASSED);
  out.kinds[kind] = { inspections: names, failed, passed, failShare: Math.round((failed / (failed + passed)) * 10_000) / 10_000 };
  console.log(kind, out.kinds[kind].failShare, `${failed} of ${failed + passed}`);
}
writeFileSync('docs/research/world/derived-inspections.json', JSON.stringify(out, null, 1) + '\n');
const ts = `/**
 * SLATE — the chance a building inspection fails, by the stage it closes:
 * the Los Angeles Department of Building and Safety's own records of every
 * inspection since ${SINCE}, the share of those that came to an answer that
 * sent the builder back (corrections issued, not ready, no access), read
 * ${out.read} (\`tools/data/inspections.mjs\`, which writes this file and
 * \`docs/research/world/derived-inspections.json\`). No other place SLATE
 * builds in publishes its results, and SLATE takes Los Angeles's for each.
 */

export const INSPECTION_FAILS = {
${Object.entries(out.kinds).map(([k, v]) => `  ${k}: ${v.failShare},`).join('\n')}
} as const;
`;
writeFileSync('src/engine/content/inspectionodds.ts', ts);
console.log('wrote docs/research/world/derived-inspections.json and src/engine/content/inspectionodds.ts');
