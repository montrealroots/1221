/**
 * SLATE — a studio run for years, to see whether it survives.
 *
 * `tools/slate.mjs` measures one picture at a time with the company's cash effectively
 * infinite, and says in its own output that this is an artefact: if money is free, the
 * best team is always right and hiring is not a decision. This is the instrument that
 * reads the thing that one cannot.
 *
 * Here the money is finite, the company's month runs underneath, and the world clock
 * actually turns — so a picture takes real months to make, the burn eats the runway
 * while it does, and the takings arrive slowly afterwards. What comes out is whether a
 * studio can carry the pictures it starts.
 *
 * ## It plays, it does not simulate
 *
 * Every decision goes through `sim.execute` and every month passes through
 * `sim.advanceTo`, so the scheduler runs: the company's burn, the production walk, the
 * release payouts. Nothing here reimplements any of it, which is the only way a
 * measurement is worth taking.
 *
 * ## The policy is deliberately dumb
 *
 * One rule: if there is enough cash and room on the slate, start a picture at a fixed
 * team level. It is not trying to play well. A clever policy would measure the policy,
 * and what is wanted is whether the *economics* leave room for any policy at all.
 *
 * ## What it found, and what it changed
 *
 * It falsified a reading `tools/slate.mjs` could not see. Per picture, a cheapest-team
 * median of 0.78x looked like a weak-but-viable budget option. Over five years it was
 * nothing of the kind: losing a fifth of every budget compounds, so those studios ran
 * out of money and stopped making pictures. At 30m of capital the cheap teams were
 * refused a greenlight fourteen to nineteen times and the dear teams were refused
 * nothing at all — the expensive option was *more* affordable, because it paid for
 * itself and the cheap one did not.
 *
 * `RETURNS_AROUND` and `CRAFT_SWINGS` moved because of that, and the whole story is in
 * `src/engine/content/release.ts`. Afterwards every team level survived five years,
 * made ten to twelve pictures, and was refused in proportion to how well it earned.
 *
 * What it has *not* been able to show is a level of capital at which hiring cheap is
 * right. The best team ends richest everywhere, because a picture's take is a multiple
 * of its budget and the multiple rises with craft. That is a missing ceiling on the
 * demand side rather than a number wanting a nudge, and this instrument should be run
 * again when one exists.
 *
 *   npx vite-node tools/career.mjs                 five years, each team level
 *   npx vite-node tools/career.mjs --years 8       longer
 *   npx vite-node tools/career.mjs --seeds 3       more worlds
 *   npx vite-node tools/career.mjs --capital 12    on less money
 */

import { quickSave } from '../src/engine/index.ts';
import { parentCompany, holdingsOf, projectsOf, companyCash } from '../src/engine/world/company.ts';
import { DEPARTMENTS, monthsFor, BEST_TEAM, LEAST_TEAM } from '../src/engine/content/departments.ts';
import { layOut } from '../src/engine/world/schedule.ts';
import { addMonths } from '../src/engine/core/time.ts';

const arg = (name, fallback) => {
  const at = process.argv.indexOf(`--${name}`);
  return at >= 0 && process.argv[at + 1] ? process.argv[at + 1] : fallback;
};
const YEARS = Number(arg('years', 5));
const SEEDS = Number(arg('seeds', 2));
const START_WITH = Number(arg('capital', 60)) * 1_000_000_00;
const AT_ONCE = 2;

const m = (cents) => {
  const mil = cents / 100_000_000;
  if (Math.abs(mil) >= 1) return `${mil < 0 ? '-' : ''}EUR ${Math.abs(mil).toFixed(1)}m`;
  return `${cents < 0 ? '-' : ''}EUR ${Math.round(Math.abs(cents) / 100_000)}k`;
};
const pad = (s, n) => String(s).padEnd(n);
const rpad = (s, n) => String(s).padStart(n);

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

const ok = (done) => (done.value?.ok ?? done.ok) === true;
const run = (sim, kind, payload) => sim.execute({ kind, payload });

/** One studio, run for a while at one team level. */
function aCareer(seed, level) {
  const sim = quickSave({}, `career-${seed}`);
  fund(sim, START_WITH);

  let started = 0;
  let released = 0;
  let refusedForMoney = 0;
  let lowest = companyCash(sim.universe);
  let n = 0;

  for (let month = 1; month <= YEARS * 12; month += 1) {
    sim.advanceTo(addMonths(sim.now, 1, sim.homeZone));

    const mine = projectsOf(sim.universe);
    // Anything finished and not yet out, let out.
    for (const project of mine) {
      if (project.stage === 'delivered' && project.releasedAt === undefined) {
        if (ok(run(sim, 'company.release', { projectId: project.id }))) released += 1;
      }
    }

    const inFlight = mine.filter(
      (one) => one.greenlitAt !== undefined && one.stage !== 'delivered',
    ).length;
    if (inFlight >= AT_ONCE) continue;

    // Start one, if the money is there when the bill comes.
    n += 1;
    const title = `Picture ${seed}-${n}`;
    if (!ok(run(sim, 'company.option', { title }))) continue;
    const holding = holdingsOf(sim.universe).find((one) => one.title === title);
    if (!holding) continue;
    if (!ok(run(sim, 'company.develop', { title, holdingId: holding.id }))) continue;
    const project = projectsOf(sim.universe).find((one) => one.title === title);

    for (const d of DEPARTMENTS) {
      if (monthsFor(d, holding.demands) > 0) {
        run(sim, 'company.staff', { projectId: project.id, departmentId: d.id, level });
      }
    }
    const wants = layOut(holding.demands, project.levels ?? {}, sim.now, sim.homeZone).budgetCents;
    run(sim, 'company.lock_budget', { projectId: project.id });
    if (ok(run(sim, 'company.greenlight', { projectId: project.id }))) {
      started += 1;
    } else {
      refusedForMoney += 1;
      void wants;
    }
    lowest = Math.min(lowest, companyCash(sim.universe));
  }

  return {
    ended: companyCash(sim.universe),
    lowest,
    started,
    released,
    refusedForMoney,
  };
}

console.log('='.repeat(78));
console.log(`A STUDIO RUN FOR ${YEARS} YEARS, ON ${m(START_WITH)} AND ITS OWN EARNINGS`);
console.log('='.repeat(78));
console.log();
console.log(pad('team', 6) + rpad('started', 9) + rpad('released', 10)
  + rpad('too dear', 10) + rpad('lowest', 12) + rpad('ended', 12) + rpad('survived', 10));
console.log('-'.repeat(78));

for (let level = LEAST_TEAM; level <= BEST_TEAM; level += 1) {
  const runs = [];
  for (let seed = 1; seed <= SEEDS; seed += 1) runs.push(aCareer(seed, level));
  const mean = (pick) => runs.reduce((sum, one) => sum + pick(one), 0) / runs.length;
  const alive = runs.filter((one) => one.ended > 0).length;
  console.log(
    pad(level, 6)
    + rpad(mean((o) => o.started).toFixed(1), 9)
    + rpad(mean((o) => o.released).toFixed(1), 10)
    + rpad(mean((o) => o.refusedForMoney).toFixed(1), 10)
    + rpad(m(mean((o) => o.lowest)), 12)
    + rpad(m(mean((o) => o.ended)), 12)
    + rpad(`${alive}/${runs.length}`, 10),
  );
}

console.log();
console.log('-'.repeat(78));
console.log('"Too dear" counts greenlights the company could not pay for. A level that never');
console.log('refuses is a level the studio can always afford, which means cash is not the');
console.log('constraint and the best team is simply correct.');
console.log('='.repeat(78));
