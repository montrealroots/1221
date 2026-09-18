/**
 * SLATE — many careers, played, with the invariants checked the whole way.
 *
 * Every other instrument in this repo measures one career. `tools/dials.mjs`
 * plays a single twenty-five-year run and asks which numbers move;
 * `tests/endurance.test.ts` plays one and asks whether it stays loadable. Both
 * are the right shape for what they ask, and both are blind to the same class of
 * defect: **the one that only happens on some seeds.**
 *
 * That class is not hypothetical here, because this game is built out of twenty
 * registered draw streams. A guard that trips on one seed in forty, an account
 * that goes to a fraction of a cent when two payments land in the same week, a
 * date that lands on the wrong side of a boundary in a leap year — none of those
 * fail the suite, because the suite pins one seed. `tests/calibration.test.ts`
 * opens by promising exactly this sweep ("these run each decision many times
 * across many seeds") and then tests the random number generator and nothing
 * else. This is the sweep that file describes.
 *
 * ## What it checks
 *
 * Eight invariants, each named so a failure says what broke rather than that
 * something did. They are checked at every year boundary of every career, not
 * only at the end, because a value that goes wrong in year six and is clamped
 * back in year seven is a defect that a final-state check cannot see.
 *
 *   no-throw            a scheduled system failed mid-career (`played.ts` throws)
 *   ledger-balances     every cached balance equals its posted total, and the
 *                       universe-wide posting total is nought — money was neither
 *                       created nor destroyed
 *   structurally-valid  `validateUniverse` finds no errors
 *   all-finite          no NaN and no Infinity anywhere in the universe
 *   clock-forward       `sim.now` never goes backwards
 *   in-range            every dial the model declares 0-100 is inside 0-100
 *   round-trips         serialise → deserialise → loadSave keeps every balance
 *                       and still validates
 *   deterministic       the same seed played twice lands on the same fingerprint
 *
 * ## How many seeds is the right number
 *
 * Not a number somebody liked the look of. One twenty-five-year career costs
 * about twenty-eight seconds, so the count is bought with wall-clock and has to
 * be justified. Two tiers, because the two costs buy different things:
 *
 * **Breadth** plays short careers over many seeds. Most defects of this class are
 * reachable early — a guard that cannot be tripped, an account that goes
 * fractional, a date that lands wrong — and five years of them costs a fifth of a
 * full run. This is where the seed count goes.
 *
 * **Depth** plays whole careers over fewer seeds, because some defects are only
 * late. `Reputation.reliability` reaches nought around year thirteen and stays
 * there, and no five-year run can see it. Depth is what catches the late ones.
 *
 * `--converge` reports whether the count is enough, by the only test that means
 * anything: take every other career and ask whether the two samples found the same
 * set of failures and agree on the outcome statistics. If they disagree, the run
 * was too small and the tool says so. That is the number being measured rather
 * than chosen.
 *
 * Two things about how it judges agreement, both of which the first draft got
 * wrong and both of which made it cry wolf on a run where all 480 careers were
 * clean. It compares the difference of two means against **the standard error of
 * that difference**, not against the mean — a percentage gap is meaningless for a
 * statistic that averages nought point nine, where eighteen per cent is a fifth of
 * one error. And four statistics are reported at once, so a single reading a
 * little over two errors is what testing four things looks like: three errors is
 * the bar for saying the run was too small, and anything over two is flagged as
 * worth another look rather than as a failure.
 *
 * ## Running it
 *
 *   node tools/monte.mjs --years 5 --seeds 200          breadth
 *   node tools/monte.mjs --years 25 --seeds 24          depth
 *   node tools/monte.mjs --seeds 200 --shard 1/6        one shard of a parallel run
 *   node tools/monte.mjs --merge out/monte-*.json       aggregate the shards
 *
 * Under `npx vite-node`, because it imports the engine and the career instrument
 * as TypeScript. Sharding exists because this machine has fourteen logical cores
 * and the run is embarrassingly parallel; the shard count is held well below the
 * core count on purpose, since each process loads its own copy of the engine and
 * memory is the binding constraint, not CPU.
 */

import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { quickSave, loadSave, validateUniverse } from '../src/engine/index.ts';
import { serialise, deserialise } from '../src/engine/persistence/adapter.ts';
import { playACareer } from '../tests/played.ts';

const arg = (name, fallback) => {
  const at = process.argv.indexOf(`--${name}`);
  return at >= 0 && process.argv[at + 1] ? process.argv[at + 1] : fallback;
};

const YEARS = Number(arg('years', 5));
const SEEDS = Number(arg('seeds', 24));
const SHARD = arg('shard', '1/1');
const OUT = arg('out', 'out');
const MERGE = process.argv.indexOf('--merge') >= 0;
const CONVERGE = process.argv.includes('--converge');
const CHECK = process.argv.includes('--check');

/**
 * Every numeric field a shape declares, read off the model itself.
 *
 * The same trick `tools/dials.mjs` uses, and for the same reason: a hand-kept
 * list of fields to check goes stale the first time somebody adds one, and a
 * field added after the list was written is exactly the field nobody checked.
 */
const model = readFileSync('src/engine/domain/model.ts', 'utf8');
function numericFieldsOf(shape) {
  const start = model.indexOf(`export interface ${shape} {`);
  if (start < 0) return [];
  const body = model.slice(start, model.indexOf('\n}', start));
  return [...body.matchAll(/^\s{2}([a-zA-Z][a-zA-Z0-9]*)\??:\s*number/gm)].map((m) => m[1]);
}

/**
 * The dials the model declares as running nought to a hundred.
 *
 * Both shapes are clamped to 0-100 at every writer in `systems/life.ts`, so a
 * value outside it means a writer was added that forgot the clamp — which is the
 * defect this check exists for, and it is invisible to a typechecker.
 */
const HUNDREDS = [
  { shape: 'Wellbeing', fields: numericFieldsOf('Wellbeing'), on: (p) => p.wellbeing },
  { shape: 'Reputation', fields: numericFieldsOf('Reputation'), on: (p) => p.reputation },
];

/** Walks a universe and reports the path of anything that is not a finite number. */
function notFinite(value, path = '', out = [], depth = 0) {
  if (out.length >= 8 || depth > 12) return out;
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) out.push(`${path} is ${value}`);
    return out;
  }
  if (value === null || typeof value !== 'object') return out;
  if (Array.isArray(value)) {
    for (const [i, one] of value.entries()) notFinite(one, `${path}[${i}]`, out, depth + 1);
    return out;
  }
  for (const [key, one] of Object.entries(value)) {
    notFinite(one, path ? `${path}.${key}` : key, out, depth + 1);
  }
  return out;
}

/**
 * A stable fingerprint of a played world.
 *
 * Not a hash of the whole universe: the save carries a `savedAt` and a slot, and
 * two runs of the same seed differ in those without differing in anything that
 * matters. So this takes the things a replay must reproduce exactly — the clock,
 * the count of every table, and every account balance — which is what determinism
 * means for a simulation whose whole contract is that a seed is a world.
 */
function fingerprint(sim) {
  const u = sim.universe;
  const tables = Object.keys(u).filter((k) => u[k] && typeof u[k] === 'object').sort();
  const parts = [`now=${sim.now}`];
  for (const table of tables) {
    const held = u[table];
    parts.push(`${table}=${Array.isArray(held) ? held.length : Object.keys(held).length}`);
  }
  for (const [id, account] of Object.entries(u.accounts ?? {}).sort()) {
    parts.push(`${id}:${account.balance}`);
  }
  let hash = 0;
  const text = parts.join('|');
  for (let i = 0; i < text.length; i += 1) hash = (hash * 31 + text.charCodeAt(i)) | 0;
  return `${hash}:${text.length}`;
}

/** Checks the invariants that can be asked of a world standing still. */
function inspect(sim, when, failures) {
  const say = (invariant, detail) => failures.push({ invariant, when, detail });

  const problems = sim.ledger.audit();
  if (problems.length > 0) say('ledger-balances', problems[0]);

  const valid = validateUniverse(sim.universe);
  if (!valid.ok) say('structurally-valid', valid.errors[0] ?? 'not ok with no error given');

  const wrong = notFinite(sim.universe);
  if (wrong.length > 0) say('all-finite', wrong.join('; '));

  const me = sim.universe.people[sim.universe.playerId];
  if (me) {
    for (const { shape, fields, on } of HUNDREDS) {
      const held = on(me) ?? {};
      for (const field of fields) {
        const now = held[field];
        if (typeof now !== 'number') continue;
        if (now < 0 || now > 100) say('in-range', `${shape}.${field} is ${now}`);
      }
    }
  }
}

/** Checks that a played world survives being written out and read back in. */
function roundTrip(sim, failures) {
  try {
    const back = loadSave(deserialise(serialise(sim.universe)));
    const before = Object.entries(sim.universe.accounts ?? {}).map(([id, a]) => `${id}:${a.balance}`).sort().join('|');
    const after = Object.entries(back.universe.accounts ?? {}).map(([id, a]) => `${id}:${a.balance}`).sort().join('|');
    if (before !== after) failures.push({ invariant: 'round-trips', when: 'end', detail: 'balances differ after a save and load' });
    const valid = validateUniverse(back.universe);
    if (!valid.ok) failures.push({ invariant: 'round-trips', when: 'end', detail: `reloaded world invalid: ${valid.errors[0]}` });
    if (back.now !== sim.now) failures.push({ invariant: 'round-trips', when: 'end', detail: `clock moved: ${sim.now} then ${back.now}` });
  } catch (error) {
    failures.push({ invariant: 'round-trips', when: 'end', detail: `threw: ${error.message}` });
  }
}

/** Plays one seed and reports everything that went wrong in it. */
function playOne(seed, years) {
  const failures = [];
  // `hrtime` rather than the clock: this is a duration, and the lint law that bans
  // reading wall-clock time is right even for an instrument. A monotonic counter
  // is also the correct tool for measuring how long something took.
  const started = process.hrtime.bigint();
  let outcome = {};
  let print = '';
  try {
    const sim = quickSave({}, seed);
    let clock = sim.now;
    let year = 0;
    inspect(sim, 'start', failures);
    outcome = playACareer(sim, years, {
      eachWeek: (world, week) => {
        if (world.now < clock) failures.push({ invariant: 'clock-forward', when: `week ${week}`, detail: `${clock} then ${world.now}` });
        clock = world.now;
        if (week % 52 === 0) {
          year += 1;
          inspect(world, `year ${year}`, failures);
        }
      },
    });
    inspect(sim, 'end', failures);
    roundTrip(sim, failures);
    print = fingerprint(sim);
  } catch (error) {
    failures.push({ invariant: 'no-throw', when: 'mid-career', detail: `${error.message}`.slice(0, 300) });
  }
  return { seed, years, failures, outcome, print, ms: Number((process.hrtime.bigint() - started) / 1000000n) };
}

if (MERGE) {
  const at = process.argv.indexOf('--merge');
  const dir = process.argv[at + 1] ?? OUT;
  const runs = [];
  for (const name of readdirSync(dir).filter((f) => f.startsWith('monte-') && f.endsWith('.json'))) {
    runs.push(...JSON.parse(readFileSync(join(dir, name), 'utf8')));
  }
  report(runs);
} else {
  const [part, of] = SHARD.split('/').map(Number);
  const mine = [];
  for (let i = 0; i < SEEDS; i += 1) {
    if (i % of === part - 1) mine.push(`monte-${i}`);
  }
  console.log(`shard ${part}/${of}: ${mine.length} seeds of ${SEEDS}, ${YEARS} years each.`);
  const runs = [];
  for (const [i, seed] of mine.entries()) {
    const run = playOne(seed, YEARS);
    runs.push(run);
    const bad = run.failures.length;
    console.log(`  ${i + 1}/${mine.length} ${seed} ${(run.ms / 1000).toFixed(1)}s ${bad === 0 ? 'clean' : `${bad} FAILED`}`);
    if (bad > 0) for (const one of run.failures.slice(0, 3)) console.log(`      ${one.invariant} at ${one.when}: ${one.detail}`);
  }
  // Determinism is a claim about a pair of runs, so it needs a second playing of
  // the same seed. One per shard, because it doubles the cost of whichever seed
  // it picks and a broken RNG would not be subtle enough to hide from a sample.
  if (mine.length > 0) {
    const again = playOne(mine[0], YEARS);
    const first = runs[0];
    if (again.print !== first.print) {
      first.failures.push({ invariant: 'deterministic', when: 'replay', detail: `${first.print} then ${again.print}` });
      console.log(`  DETERMINISM FAILED on ${mine[0]}`);
    } else {
      console.log(`  determinism ok on ${mine[0]}`);
    }
  }
  if (of > 1) {
    mkdirSync(OUT, { recursive: true });
    writeFileSync(join(OUT, `monte-${part}.json`), JSON.stringify(runs, null, 1));
    console.log(`shard ${part}/${of} written to ${join(OUT, `monte-${part}.json`)}`);
  } else {
    report(runs);
  }
}

function report(runs) {
  const failed = runs.filter((one) => one.failures.length > 0);
  const byInvariant = new Map();
  for (const run of runs) {
    for (const one of run.failures) {
      if (!byInvariant.has(one.invariant)) byInvariant.set(one.invariant, []);
      byInvariant.get(one.invariant).push({ seed: run.seed, ...one });
    }
  }

  const years = runs[0]?.years ?? YEARS;
  const cost = runs.reduce((s, one) => s + one.ms, 0) / 1000;
  console.log(`\n${runs.length} careers, ${years} years each, ${cost.toFixed(0)}s of play.`);
  console.log(`${runs.length - failed.length} clean, ${failed.length} with at least one broken invariant.\n`);

  if (byInvariant.size === 0) {
    console.log('Every invariant held on every seed.');
  } else {
    for (const [invariant, hits] of [...byInvariant].sort((a, b) => b[1].length - a[1].length)) {
      console.log(`${invariant} — ${hits.length} on ${new Set(hits.map((h) => h.seed)).size} seeds`);
      for (const hit of hits.slice(0, 4)) console.log(`    ${hit.seed} at ${hit.when}: ${hit.detail}`);
      if (hits.length > 4) console.log(`    and ${hits.length - 4} more`);
      console.log('');
    }
  }

  // What the careers came to, so a sweep that finds no broken invariant still
  // says whether the game did anything. A thousand careers that all end
  // identically is its own defect and would pass every check above.
  const keys = [...new Set(runs.flatMap((one) => Object.keys(one.outcome ?? {})))];
  if (keys.length > 0) {
    console.log('What the careers came to:');
    for (const key of keys) {
      const values = runs.map((one) => one.outcome?.[key]).filter((v) => typeof v === 'number');
      if (values.length === 0) continue;
      const sorted = [...values].sort((a, b) => a - b);
      const mean = values.reduce((s, v) => s + v, 0) / values.length;
      const spread = new Set(values).size;
      console.log(`  ${key.padEnd(10)} low ${sorted[0]}  median ${sorted[Math.floor(sorted.length / 2)]}`
        + `  high ${sorted[sorted.length - 1]}  mean ${mean.toFixed(1)}  ${spread} distinct`);
      if (spread === 1) console.log(`    ^ every career gave the same ${key}. The seed decides nothing here.`);
    }
    console.log('');
  }

  if (CONVERGE) {
    // The honest test of whether the count was enough: split the seeds and ask
    // whether the halves agree. If they do not, one more seed could still have
    // found something no seed before it did, and the run was too small.
    // Interleaved, not cut down the middle.
    //
    // `--merge` reads the shard files in directory order, and a shard holds every
    // sixth seed, so the first half of the merged array is shards one to three and
    // the second half is four to six. Splitting there compares two groups chosen
    // by which process happened to run them, which is a structure in the sample
    // rather than a sample of the population. Taking every other run cancels it,
    // and costs nothing on a single-shard run where the order is already the seed
    // order.
    const a = runs.filter((_, i) => i % 2 === 0);
    const b = runs.filter((_, i) => i % 2 === 1);
    const set = (rs) => new Set(rs.flatMap((one) => one.failures.map((f) => f.invariant)));
    const [seenA, seenB] = [set(a), set(b)];
    const only = [...new Set([...seenA, ...seenB])].filter((k) => seenA.has(k) !== seenB.has(k));
    console.log(`Convergence, on ${a.length} against ${b.length}:`);
    if (only.length === 0) {
      console.log('  Both halves found the same set of broken invariants, so the count is enough');
      console.log('  to have found this set. It is not proof that nothing else exists.');
    } else {
      console.log(`  The halves disagree on: ${only.join(', ')}.`);
      console.log('  One half found something the other did not, so this run was too small.');
      console.log('  Double the seeds and run it again.');
    }
    // Against the standard error of the difference, not against the mean.
    //
    // This compared the halves as a percentage of the larger mean, and that is the
    // wrong test for any statistic whose mean is near nought. `clashed` averages
    // about 0.9 clashes a career, so halves of 0.8 and 1.0 are 18 per cent apart
    // and perhaps a fifth of one standard error — noise, reported as a failure to
    // converge, on 480 careers that were all clean. A criterion that cannot be
    // satisfied by any sample size is not a criterion, and it would have sent the
    // next run to double the seeds forever.
    //
    // So: the difference of two means, against the pooled standard error of that
    // difference. Two standard errors is the ordinary bar and it is the one used
    // here. It tightens as the count grows, which is what convergence means.
    const stats = (rs, key) => {
      const v = rs.map((one) => one.outcome?.[key]).filter((x) => typeof x === 'number');
      const n = v.length;
      if (n === 0) return { n: 0, mean: 0, variance: 0 };
      const mean = v.reduce((s, x) => s + x, 0) / n;
      const variance = n < 2 ? 0 : v.reduce((s, x) => s + (x - mean) ** 2, 0) / (n - 1);
      return { n, mean, variance };
    };
    for (const key of keys) {
      const [sa, sb] = [stats(a, key), stats(b, key)];
      if (sa.n === 0 || sb.n === 0) continue;
      const se = Math.sqrt(sa.variance / sa.n + sb.variance / sb.n);
      const apart = Math.abs(sa.mean - sb.mean);
      const errors = se === 0 ? (apart === 0 ? 0 : Infinity) : apart / se;
      console.log(`  ${key.padEnd(10)} ${sa.mean.toFixed(2)} against ${sb.mean.toFixed(2)}`
        + ` — ${apart.toFixed(2)} apart, ${errors === Infinity ? 'infinite' : errors.toFixed(2)} standard errors`
        + `${errors > 3 ? '  TOO FAR: the statistic has not settled' : errors > 2 ? '  worth another look' : ''}`);
    }
    console.log('');
  }

  if (CHECK && byInvariant.size > 0) process.exit(1);
}
