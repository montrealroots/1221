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
 * The cash is set past anything a picture can cost, deliberately: this instrument is
 * asking which team a property **deserved**, not which one a studio could have paid
 * for. `tools/career.mjs` is what asks the second question, and the two disagreed
 * twice — both times the career run was right and the model changed.
 *
 * The second table is the one that matters. A spread of medians says the teams differ;
 * only naming the right team property by property says whether that difference is a
 * decision. If one team wins everything, the ceiling on the take is not working.
 *
 *   npx vite-node tools/slate.mjs              a spread across seeds and craft
 *   npx vite-node tools/slate.mjs --seeds 24   more of them
 */

import { quickSave } from '../src/engine/index.ts';
import { parentCompany, holdingsOf, projectsOf } from '../src/engine/world/company.ts';
import { DEPARTMENTS, monthsFor, BEST_TEAM, LEAST_TEAM } from '../src/engine/content/departments.ts';
import { PAYS_FOR_MONTHS, whatItCouldReach } from '../src/engine/content/release.ts';
import { walkTheMonth } from '../src/engine/world/production.ts';
import { payWhatIsDue, takenSoFar, craftOf } from '../src/engine/world/release.ts';
import { addMonths } from '../src/engine/core/time.ts';
import { somebodyAt } from '../src/engine/world/people.ts';
import { engagementsOf } from '../src/engine/world/company.ts';

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

  // Somebody plain at the wanted rung, so the five bands differ by the rung and not
  // by whichever temperament happened to be free that month.
  for (const d of DEPARTMENTS) {
    if (monthsFor(d, holding.demands) <= 0) continue;
    const who = somebodyAt(
      sim, engagementsOf(sim.universe), d.id, level, sim.now, sim.now,
    );
    if (!who) return undefined;
    // A rung that will not take this picture is not a measurement, it is a refusal.
    // The driver drops the property from every band rather than from this one, so
    // the five rows keep comparing the same forty properties.
    const said = sim.execute({
      kind: 'company.staff',
      payload: { projectId: project.id, departmentId: d.id, personId: who.id },
    });
    if (!(said.value?.ok ?? said.ok)) return undefined;
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
    reach: whatItCouldReach(holding.demands, holding.appeal),
    took: takenSoFar(sim, project.id),
    craft: craftOf(sim, project),
    demands: holding.demands,
    madeIn,
  };
}

console.log('='.repeat(78));
console.log('WHAT A PICTURE RETURNS, PLAYED THROUGH THE REAL COMMANDS');
console.log('='.repeat(78));
console.log();
console.log();
console.log(`${pad('team', 6)}${rpad('pictures', 9)}${rpad('worst', 10)}${rpad('median', 10)}${rpad('best', 10)}${rpad('profitable', 12)}`);
console.log('-'.repeat(76));

// Every seed at every rung first, so a property the top of the trade will not take is
// dropped from all five rows rather than only from that one. Comparing rows that saw
// different material is the confound this instrument already made once.
const attempts = new Map();
for (let level = LEAST_TEAM; level <= BEST_TEAM; level += 1) {
  for (let seed = 1; seed <= SEEDS; seed += 1) {
    attempts.set(`${level}:${seed}`, onePicture(seed, level));
  }
}
const usable = [];
for (let seed = 1; seed <= SEEDS; seed += 1) {
  let all = true;
  for (let level = LEAST_TEAM; level <= BEST_TEAM; level += 1) {
    if (!attempts.get(`${level}:${seed}`)) all = false;
  }
  if (all) usable.push(seed);
}
const refused = SEEDS - usable.length;

const byLevel = [];
for (let level = LEAST_TEAM; level <= BEST_TEAM; level += 1) {
  const runs = usable.map((seed) => attempts.get(`${level}:${seed}`));
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

// Which team was actually RIGHT, property by property. This is the question the ratio
// table cannot answer and the whole reason the take was capped by the material: if the
// answer is always the best team, hiring is a lookup and the ceiling did not work.
console.log();
console.log('-'.repeat(78));
console.log('WHICH TEAM WAS RIGHT, PROPERTY BY PROPERTY');
console.log();
console.log(pad('material', 12) + rpad('reach', 10) + rpad('best team', 11)
  + rpad('it made', 10) + rpad('worst team would', 18) + rpad('cost of getting it wrong', 26));
console.log('-'.repeat(78));

const wins = new Map();
for (let i = 0; i < usable.length; i += 1) {
  const profits = byLevel.map(({ level, runs }) => {
    const one = runs[i];
    return { level, profit: one.took - one.cost, one };
  });
  const best = profits.reduce((most, x) => (x.profit > most.profit ? x : most));
  const worst = profits.reduce((least, x) => (x.profit < least.profit ? x : least));
  wins.set(best.level, (wins.get(best.level) ?? 0) + 1);
  const d = best.one.demands;
  console.log(
    pad(`${d.scope}/${d.spectacle}/${d.period}`, 12)
    + rpad(m(best.one.reach), 10)
    + rpad(best.level, 11)
    + rpad(m(best.profit), 10)
    + rpad(`${worst.level}, ${m(worst.profit)}`, 18)
    + rpad(m(best.profit - worst.profit), 26),
  );
}

console.log();
console.log('-'.repeat(78));
const rightRatios = [];
const rightLost = [];
for (let i = 0; i < usable.length; i += 1) {
  const profits = byLevel.map(({ level, runs }) => ({ level, one: runs[i], profit: runs[i].took - runs[i].cost }));
  const best = profits.reduce((most, x) => (x.profit > most.profit ? x : most));
  rightRatios.push(best.one.took / best.one.cost);
  if (best.profit < 0) rightLost.push(i);
}
rightRatios.sort((a, b) => a - b);
const rightMedian = rightRatios[Math.floor(rightRatios.length / 2)];
const spread = [...wins.entries()].sort((a, b) => a[0] - b[0])
  .map(([level, n]) => `team ${level} on ${n}`).join(', ');
console.log(`Right team, across ${usable.length} properties: ${spread}.`);
if (refused > 0) {
  console.log(`${refused} of ${SEEDS} were dropped: too small for somebody the trade offered,`);
  console.log('which is the minimum-budget term doing exactly what it is for.');
}
console.log(`${wins.size} of the ${BEST_TEAM - LEAST_TEAM + 1} teams was the right answer at least once.`);
console.log(`Played right, the median picture returned ${rightMedian.toFixed(2)}x `
  + `and ${rightLost.length} of ${usable.length} lost money anyway.`);
console.log();
console.log('If one team wins every property, hiring is a lookup and the ceiling on the');
console.log('take is not doing its job. The numbers above are the falsifiability test for');
console.log('the whole model: change the material, and the right answer has to change.');
console.log();

const sample = byLevel[2].runs[0];
console.log(`A middling picture: cost ${m(sample.cost)}, took ${m(sample.took)}, `
  + `reach ${m(sample.reach)}, made in ${sample.madeIn} months, craft ${sample.craft.toFixed(2)}.`);
console.log(`Its material asked for scope ${sample.demands.scope}, `
  + `spectacle ${sample.demands.spectacle}, period ${sample.demands.period}.`);
console.log('='.repeat(78));
