// The skeptics' checks of every row, kept in inputs/checks.json: the record merge-review.cjs reads, a later check of a
// row winning. Until 2026-10-15 this script rebuilt that file from the session's own workflow journals and the
// scratchpad's final-checks/ folder, timing each check by its file's date; copied into the repository, the journals were
// gone and a copy's dates were the day of copying, so a rebuild dropped 162 checked rows and reordered the rest. The
// record is kept as it stood, with each check's own time, and a new skeptic's file is added to it.
//   node collect-checks.cjs                         (says what the record holds; changes nothing)
//   node collect-checks.cjs --add <check.json>...   (adds each file's rows, timed now; the file is kept in final-checks/)
const fs = require('fs');
const path = require('path');
const S = path.join(__dirname, 'inputs') + '/';
const record = JSON.parse(fs.readFileSync(S + 'checks.json', 'utf8'));
const byId = new Map(record.flatMap((g) => g.rows ?? []).map((r) => [r.id, r]));
const [flag, ...files] = process.argv.slice(2);
if (flag === '--add') {
  for (const f of files) {
    const at = Date.now();
    const rows = JSON.parse(fs.readFileSync(f, 'utf8')).rows ?? [];
    for (const r of rows) if (r && r.id && r.claimed !== undefined) byId.set(r.id, { ...r, checkedAt: at, final: true });
    fs.copyFileSync(f, S + 'final-checks/' + path.basename(f));
    console.log(`added ${rows.length} rows from ${path.basename(f)}`);
  }
  fs.writeFileSync(S + 'checks.json', JSON.stringify([{ rows: [...byId.values()] }], null, 1));
}
const rows = [...byId.values()];
console.log(`checks: ${rows.length} rows, ${rows.filter((r) => r.holds).length} held`);
for (const r of rows.filter((x) => !x.holds)) console.log(`  REFUTED ${r.id}: ${String(r.claimed).slice(0, 30)} -> ${r.verdict}`);
