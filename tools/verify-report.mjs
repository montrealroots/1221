/**
 * The verification suites' results as one readable page (from 2026-10-10): `docs/verification/REPORT.md`, written from
 * each suite's `results.jsonl` (`tools/verify.mjs`) for the tree the suite last ran on, every figure read from a
 * result and none typed. It says the commit, the tree and the dirty count each job ran on, so a page can't pass off
 * one version's runs as another's.
 *
 *   node tools/verify-report.mjs            writes docs/verification/REPORT.md
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const DIR = 'docs/verification';
const read = (suite) => (existsSync(`${DIR}/${suite}/results.jsonl`) ? readFileSync(`${DIR}/${suite}/results.jsonl`, 'utf8').trim().split('\n').filter(Boolean).map((l) => JSON.parse(l)) : []);
/** The suite's runs on the tree it last ran on, each job's latest. */
function latest(suite) {
  const all = read(suite);
  if (!all.length) return { tree: undefined, rows: [] };
  const tree = all.at(-1).tree;
  const byJob = new Map();
  for (const r of all) if (r.tree === tree) byJob.set(r.job, r);
  return { tree, rows: [...byJob.values()] };
}
const one = (r) => r.results?.[0] ?? {};
const top = (refused) => Object.entries(refused ?? {}).sort((a, b) => b[1] - a[1])[0];
const sum = (refused) => Object.values(refused ?? {}).reduce((a, b) => a + b, 0);
const table = (head, rows) => [`| ${head.join(' | ')} |`, `|${head.map(() => '---').join('|')}|`, ...rows.map((r) => `| ${r.map((c) => String(c ?? '—').replace(/\|/g, '/')).join(' | ')} |`)].join('\n');
const revision = (rows) => [...new Set(rows.map((r) => `${r.commit} (tree ${r.tree}, ${r.dirty} dirty)`))].join(', ');

const out = ['# Verification Results', '', 'Written by `node tools/verify-report.mjs` from `docs/verification/<suite>/results.jsonl`, which `node tools/verify.mjs <suite> --max N` appends to job by job. Every figure below is read from a result.', ''];

// Lives.
const lives = latest('lives');
out.push('## Played Lives', '', `Ran on ${revision(lives.rows)}. Each plays a student from creation for 3.3 years through public commands (\`tools/lives.ts\`), saving and reopening every thirty days.`, '');
out.push(table(['Profile and seed', 'Policy', 'Dates', 'Outcome', 'Terms (standing, attendance %)', 'Pieces judged (mastery)', 'Fitness, first and last month', 'Condition at end', 'Breaches', 'Unbalanced', 'Reloads', 'Error'],
  lives.rows.map((r) => { const x = one(r); return [r.job, x.policy, `${x.startedOn} to ${x.endedOn}`, x.graduated ? 'Graduated' : x.standing, (x.terms ?? []).map((t) => `${t.standing} ${t.attendance}`).join('; '), `${x.work?.n} (${x.work?.mastery})`, `${x.monthly?.[0]?.fitness} → ${x.monthly?.at(-1)?.fitness}`, x.wellbeing?.condition, x.breaches, x.unbalanced, x.reloads, x.error ?? x.results?.[0]?.error ?? '']; })));
out.push('');

// Mastery.
const mastery = latest('mastery');
const singles = mastery.rows.filter((r) => one(r).mode === 'single');
out.push('## Mastery Through The Commands', '', `Ran on ${revision(mastery.rows)}. A student practices one ability or technique as far as the day allows (\`tools/mastery.ts --mode single\`), or a plan for a genre (\`--mode plan\`).`, '');
out.push(table(['Target', 'Start', 'End', 'Sessions to full', 'Calendar days', 'Full', 'Full after a reload', 'Refusals', 'Most refused by', 'Standing', 'Breaches', 'Unbalanced'],
  singles.map((r) => { const x = one(r); const t = top(x.refused); return [x.target, x.start, x.end, x.full?.sessions ?? x.sessions, x.calendarDays, x.reachedFull ? 'Yes' : 'No', x.fullAfterReload ? 'Yes' : 'No', sum(x.refused), t ? `${t[0].slice(0, 60)} (${t[1]})` : '', x.standing, x.breaches, x.unbalanced]; })));
out.push('');
for (const r of mastery.rows.filter((q) => one(q).mode === 'plan')) {
  const x = one(r);
  out.push(`**Plan, ${x.genre}** (seed ${x.seed}): targets ${x.targets.join(', ')}; every one full or mastered on ${x.masteredOn ?? 'never'}; graduated ${x.graduated ?? 'no'} (${x.standing}); the journey's mastered pieces ${x.journeyMastery === undefined ? '—' : JSON.stringify(x.journeyMastery)}; breaches ${x.breaches}, unbalanced ${x.unbalanced}.`, '');
  out.push(table(['Target', 'Start', 'First session', 'Mastered', 'Full', 'End'], Object.entries(x.progress ?? {}).map(([k, p]) => [k, p.start, p.firstSession ?? '—', p.mastered ? `${p.mastered.date} (${p.mastered.sessions} sessions)` : '—', p.full ? `${p.full.date} (${p.full.sessions} sessions)` : '—', p.end])));
  out.push('');
}

// Fitness.
const fitness = latest('fitness');
out.push('## Fitness Through Look After Yourself', '', `Ran on ${revision(fitness.rows)}. Each scenario works out on its schedule through \`life.look_after\` (\`tools/fitness.ts\`).`, '');
out.push(table(['Scenario', 'Born', 'Age at end', 'Start', 'End', 'Full', 'Full on day', 'Workouts done / days planned', 'Most refused by', 'Readiness at nine', 'Standing', 'Breaches', 'Unbalanced'],
  fitness.rows.map((r) => { const x = one(r); const t = top(x.workouts?.refused); return [x.scenario, x.birthYear, x.ageAtEnd, x.fitness?.start, x.fitness?.end, x.fitness?.full, x.fitness?.reachedFullOnDay ?? 'never', `${x.workouts?.done} / ${x.workouts?.plannedDays}`, t ? `${t[0].slice(0, 50)} (${t[1]})` : '', x.readinessAt9, x.school?.standing, x.breaches, x.unbalanced]; })));
out.push('');

// Condition.
const condition = latest('condition');
out.push('## Illness And Injury On A Piece Of Work', '', `Ran on ${revision(condition.rows)}. The same piece shown healthy and under each condition (\`tools/condition.ts\`).`, '');
// Against the healthy showing of the same piece on the same day: which dimensions the condition took, read from the
// results themselves, since a work record keeps only its three costliest limits (`recordWork`) and a condition's can
// rank below a preparation's there.
const below = (x, healthy) => (healthy && x.shown === healthy.shown ? Object.entries(x.dims ?? {}).filter(([d, v]) => v < (healthy.dims?.[d] ?? v) - 0.05).map(([d, v]) => `${d} −${Math.round((healthy.dims[d] - v) * 10) / 10}`).join(', ') || 'none' : 'another day');
const variants = condition.rows.flatMap((r) => r.results.map((x) => [x.template, x.variant, x.shown ?? '—', x.status, x.overall, x.band, Object.entries(x.dims ?? {}).map(([d, v]) => `${d} ${v}`).join(', '), below(x, r.results.find((h) => h.variant === 'healthy')), (x.conditionLimits ?? []).join(', ') || '—', x.days ? `${x.days.attended}/${x.days.classDays}, ${x.days.excused} excused` : '—', (x.abilitiesLowerThanHealthy ?? []).join(', ') || 'none', x.breaches, x.unbalanced]));
out.push(table(['Work', 'Variant', 'Shown', 'Status', 'Overall', 'Band', 'Dimensions', 'Below healthy, same day', 'Condition among the record’s top three limits', 'Class days attended', 'Abilities lower than healthy', 'Breaches', 'Unbalanced'], variants));
out.push('');

writeFileSync(`${DIR}/REPORT.md`, `${out.join('\n')}\n`);
console.log(`Wrote ${DIR}/REPORT.md: ${lives.rows.length} lives, ${mastery.rows.length} mastery runs, ${fitness.rows.length} fitness scenarios, ${variants.length} condition variants.`);
