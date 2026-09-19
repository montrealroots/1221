/**
 * SLATE — the studio, measured on pictures it actually made.
 *
 * `content/release.ts` shipped with every constant reasoned and none of them measured,
 * and said so in its own docstring. This is what settles that. It is an instrument
 * rather than a test: it makes no assertions and fails nothing, it plays the real
 * command path and reports what came back.
 *
 * Everything here goes through `sim.execute`. Nothing reimplements a reckoning, a
 * schedule or a payout — which is the whole point, because a measurement taken against
 * a reimplementation measures the reimplementation.
 *
 *   npx vite-node tools/slate.mjs              a spread across seeds and craft
 *   npx vite-node tools/slate.mjs --seeds 24   more of them
 */

import { quickSave } from '../src/engine/index.ts';
import { parentCompany, holdingsOf, projectsOf } from '../src/engine/world/company.ts';
import { DEPARTMENTS, monthsFor, BEST_TEAM, LEAST_TEAM } from '../src/engine/content/departments.ts';
import { PAYS_FOR_MONTHS } from '../src/engine/content/release.ts';
import { walkTheMonth } from '../src/engine/world/production.ts';
import { payWhatIsDue, takenSoFar, craftOf } from '../src/engine/world/release.ts';
import { addMonths } from '../src/engine/core/time.ts';

const arg = (name, fallback) => {
  const at = process.argv.indexOf(`--${name}`);
  return at >= 0 && process.argv[at + 1] ? process.argv[at + 1] : fallback;
};
const SEEDS = Number(arg('seeds', 12));

const m = (cents) => {
  const mil = cents / 100_000_000;
  if (Math.abs(mil) >= 1) return `${mil < 0 ? '-' : ''}EUR ${Math.abs(mil).toFixed(2)}m`;
  return `${cents < 0 ? '-' : ''}EUR ${Math.round(Math.abs(cents) / 100_000)}k`;
};
const pad = (s, n) => String(s).padEnd(n);
const rpad = (s, n) => String(s).padStart(n);

/** Money in, as an equity posting rather than an assigned balance. */
function fund(sim, cents) {
  const company = parentCompany(sim.universe);
  const cash = Object.values(sim.universe.accounts)
    .find((one) => one.ownerId === company.id && one.kind === 'company_cash' && !one.closedAt);
  if (!sim.ledger.tryAccount('equity:capital')) {
    sim.ledger.open({
      id: 'equity:capital', saveId: sim.universe.meta.id, kind: 'equity', name: 'Capital',
      ownerId: 'world', balance: 0, openedAt: sim.now, nominal: true, category: 'business',
    });
  }
  const short = cents - cash.balance;
  if (short > 0) {
    sim.post({
      memo: 'Capital In', category: 'business',
      postings: [{ accountId: 'equity:capital', amount: -short }, { accountId: cash.id, amount: short }],
    });
  }
}

function must(sim, kind, payload) {
  const done = sim.execute({ kind, payload });
  const said = done.value?.error ?? done.error;
  if (!(done.value?.ok ?? done.ok)) throw new Error(`${kind} refused: ${said}`);
  return done.value ?? {};
}

/** One picture, all the way from rights to the last month of its run. */
function onePicture(seed, level) {
  // Seeded on the picture alone and NOT on the team, deliberately. The first version
  // folded the level into the seed, so every band drew different material and a
  // different run of luck — which confounded the one thing being measured and made the
  // best team read worse than the second best. Holding the seed still makes this a
  // paired comparison: same property, same draw, only the hiring differs.
  const sim = quickSave({}, `slate-${seed}`);
  fund(sim, 2_000_000_000_00);

  must(sim, 'company.option', { title: `Picture ${seed}` });
  const holding = holdingsOf(sim.universe)[0];
  must(sim, 'company.develop', { title: holding.title, holdingId: holding.id });
  const project = projectsOf(sim.universe).find((one) => one.title === holding.title);

  for (const d of DEPARTMENTS) {
    if (monthsFor(d, holding.demands) > 0) {
      must(sim, 'company.staff', { projectId: project.id, departmentId: d.id, level });
    }
  }

  must(sim, 'company.lock_budget', { projectId: project.id });
  must(sim, 'company.greenlight', { projectId: project.id });
  const cost = project.budgetCents;

  let at = project.greenlitAt;
  for (let i = 0; i < 80 && project.stage !== 'delivered'; i += 1) {
    at = addMonths(at, 1, sim.homeZone);
    walkTheMonth(sim, at);
  }
  const madeIn = Math.round((at - project.greenlitAt) / (30.44 * 24 * 60 * 60 * 1000));

  must(sim, 'company.release', { projectId: project.id });
  let out = sim.now;
  for (let i = 0; i <= PAYS_FOR_MONTHS + 2; i += 1) {
    out = addMonths(out, 1, sim.homeZone);
    payWhatIsDue(sim, project, out);
  }

  return {
    cost,
    took: takenSoFar(sim, project.id),
    craft: craftOf(sim, project),
    demands: holding.demands,
    madeIn,
  };
}

console.log('='.repeat(76));
console.log('WHAT A PICTURE RETURNS, PLAYED THROUGH THE REAL COMMANDS');
console.log('='.repeat(76));
console.log();
console.log(`${pad('team', 6)}${rpad('pictures', 9)}${rpad('worst', 10)}${rpad('median', 10)}${rpad('best', 10)}${rpad('profitable', 12)}`);
console.log('-'.repeat(76));

const byLevel = [];
for (let level = LEAST_TEAM; level <= BEST_TEAM; level += 1) {
  const runs = [];
  for (let seed = 1; seed <= SEEDS; seed += 1) runs.push(onePicture(seed, level));
  const ratios = runs.map((one) => one.took / one.cost).sort((a, b) => a - b);
  const median = ratios[Math.floor(ratios.length / 2)];
  const won = ratios.filter((one) => one >= 1).length;
  byLevel.push({ level, runs, ratios, median, won });
  console.log(
    pad(level, 6)
    + rpad(runs.length, 9)
    + rpad(`${ratios[0].toFixed(2)}x`, 10)
    + rpad(`${median.toFixed(2)}x`, 10)
    + rpad(`${ratios[ratios.length - 1].toFixed(2)}x`, 10)
    + rpad(`${won}/${ratios.length}`, 12),
  );
}

console.log();
console.log('-'.repeat(76));
const cheap = byLevel[0];
const dear = byLevel[byLevel.length - 1];
console.log(`Craft is worth ${(dear.median - cheap.median).toFixed(2)}x between the worst team and the best.`);
console.log(`At the cheapest team ${cheap.won} of ${cheap.ratios.length} pictures returned their cost.`);
console.log(`At the best team ${dear.won} of ${dear.ratios.length} did.`);
console.log();

const sample = byLevel[2].runs[0];
console.log(`A middling picture: cost ${m(sample.cost)}, took ${m(sample.took)}, `
  + `made in ${sample.madeIn} months, craft ${sample.craft.toFixed(2)}.`);
console.log(`Its material asked for scope ${sample.demands.scope}, `
  + `spectacle ${sample.demands.spectacle}, period ${sample.demands.period}.`);
console.log('='.repeat(76));
