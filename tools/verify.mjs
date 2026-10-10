/**
 * SLATE — the verification runs, resumable (from 2026-10-10).
 *
 * A suite is a list of jobs, each a scenario tool and its arguments (`tools/lives.ts`, `tools/fitness.ts`,
 * `tools/condition.ts`, `tools/mastery.ts`). This runs them one process at a time, appends each result to
 * `docs/verification/<suite>/results.jsonl` the moment it finishes, with the revision it ran on (commit, tree, and
 * whether `src`, `tools` or `tests` had uncommitted changes), when it started and ended, and how long it took; and
 * skips a job already recorded for the same tree, so an interrupted suite resumes where it stopped and results from
 * different trees stay apart (each line names its tree).
 *
 *   node tools/verify.mjs <suite> [--max N]      run up to N jobs still owed on this tree, then stop
 *   node tools/verify.mjs <suite> --status       what's done and owed on this tree
 *
 * `--max` keeps one call short, so a long suite runs as a series of calls in the foreground.
 */
import { execSync, spawnSync } from 'node:child_process';
import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

const LIVES = ['new-york, attentive', 'mexico-city, attentive', 'london, early riser and curious, attentive', 'reykjavik, autopilot', 'new-york, practicing', 'pressure: scraping, the flu and an injury, attentive'];
const MASTERY_TARGETS = ['emotionalDepth', 'listening', 'imagination', 'focus', 'memory', 'adaptability', 'vocal', 'physical', 'presence', 'composure', 'discipline', 'stamina', 'accents', 'audition', 'character', 'classical', 'clown', 'coldReading', 'comedy', 'dance', 'improv', 'intimacy', 'screen', 'scene', 'script', 'singing', 'speech', 'combat', 'voiceover'];

/** Each suite's jobs: an id, the tool and its arguments. */
const SUITES = {
  lives: LIVES.flatMap((p) => [0, 1, 2].map((n) => ({ id: `${p} | lives-${n}`, tool: 'tools/lives.ts', args: ['--why', '--seed', `lives-${n}`, '--years', '3.3', '--profile', p] }))),
  mastery: [
    ...MASTERY_TARGETS.map((t) => ({ id: `single ${t}`, tool: 'tools/mastery.ts', args: ['--mode', 'single', '--target', t, '--seed', 'm-0', '--years', '4'] })),
    { id: 'plan musical', tool: 'tools/mastery.ts', args: ['--mode', 'plan', '--genre', 'musical', '--seed', 'm-0', '--years', '8'] },
    { id: 'plan drama', tool: 'tools/mastery.ts', args: ['--mode', 'plan', '--genre', 'drama', '--seed', 'm-1', '--years', '8'] },
  ],
  fitness: [
    ...['none', 'daily', 'three-a-week', 'two-a-week', 'twice-daily', 'injured', 'ill'].map((s) => ({ id: `${s} 2001`, tool: 'tools/fitness.ts', args: ['--scenario', s, '--seed', 'fit-0', '--days', '240', '--birth', '2001'] })),
    { id: 'return 2001', tool: 'tools/fitness.ts', args: ['--scenario', 'return', '--seed', 'fit-0', '--days', '420', '--birth', '2001'] },
    ...[2006, 1991, 1981].flatMap((b) => ['daily', 'three-a-week'].map((s) => ({ id: `${s} ${b}`, tool: 'tools/fitness.ts', args: ['--scenario', s, '--seed', 'fit-0', '--days', '240', '--birth', String(b)] }))),
  ],
  condition: ['movement-score', 'voice-sequence', 'fight-sequence'].map((t) => ({ id: t, tool: 'tools/condition.ts', args: ['--template', t, '--seed', 'cond-0'] })),
};

const suite = process.argv[2];
const jobs = SUITES[suite];
if (!jobs) { console.error(`no suite ${suite}: ${Object.keys(SUITES).join(', ')}`); process.exit(1); }
const max = (() => { const i = process.argv.indexOf('--max'); return i > 0 ? Number(process.argv[i + 1]) : Infinity; })();
const sh = (c) => execSync(c, { encoding: 'utf8' }).trim();
const commit = sh('git rev-parse --short HEAD');
const tree = sh('git log -1 --format=%t');
const dirty = sh('git status --porcelain -- src tools tests').split('\n').filter(Boolean).length;
const dir = `docs/verification/${suite}`;
mkdirSync(dir, { recursive: true });
const file = `${dir}/results.jsonl`;
const done = new Set(existsSync(file) ? readFileSync(file, 'utf8').split('\n').filter(Boolean).map((l) => JSON.parse(l)).filter((r) => r.tree === tree && r.dirty === dirty).map((r) => r.job) : []);
const owed = jobs.filter((j) => !done.has(j.id));

if (process.argv.includes('--status')) {
  console.log(`${suite} on ${commit} (tree ${tree}${dirty ? `, ${dirty} uncommitted` : ''}): ${jobs.length - owed.length} of ${jobs.length} done`);
  for (const j of owed) console.log('  owed', j.id);
  process.exit(0);
}

let ran = 0;
for (const j of owed) {
  if (ran >= max) break;
  const started = new Date().toISOString();
  const t0 = Date.now();
  // Each argument quoted for the shell (from 2026-10-10): until then a profile named with spaces reached the tool as its
  // first word, and every lives job ran the first profile under its own name.
  const quoted = j.args.map((a) => (/[\s,:]/.test(a) ? `"${a}"` : a));
  const r = spawnSync('npx', ['vite-node', j.tool, '--', ...quoted], { encoding: 'utf8', shell: true, maxBuffer: 64 * 1024 * 1024 });
  const lines = (r.stdout ?? '').split('\n').filter((l) => l.startsWith('{'));
  const results = lines.length ? lines.map((l) => { try { return JSON.parse(l); } catch { return { error: 'unparsed line' }; } }) : [{ error: `no result (exit ${r.status}): ${(r.stderr ?? '').slice(-400)}` }];
  const line = { job: j.id, tool: j.tool, args: j.args, commit, tree, dirty, started, ended: new Date().toISOString(), seconds: Math.round((Date.now() - t0) / 1000), results };
  appendFileSync(file, JSON.stringify(line) + '\n');
  writeFileSync(`${dir}/manifest.json`, JSON.stringify({ suite, commit, tree, dirty, jobs: jobs.length, done: done.size + ran + 1, owed: owed.slice(ran + 1).map((x) => x.id), updated: line.ended }, null, 1) + '\n');
  ran += 1;
  console.log(`${line.seconds}s ${j.id}${results[0]?.error ? ` ERROR ${results[0].error}` : ''}`);
}
console.log(`${suite}: ${done.size + ran} of ${jobs.length} done on tree ${tree}`);
