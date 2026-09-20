/**
 * SLATE — a studio run for years, to see whether it survives.
 *
 * `tools/slate.mjs` measures one picture at a time with the company's cash effectively
 * infinite, which means it can say which team a property deserved but never whether a
 * studio could have afforded to hire it. This is the instrument that reads the part
 * money decides.
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
 * ## Five dumb policies and one that looks
 *
 * The fixed rows hire the same team whatever turns up. They are not trying to play
 * well; they are there so that the last row has something to be measured against.
 *
 * The `match` row is the only one that reads the property before hiring, and it is the
 * point of the whole instrument. If costing every rung against what the material could
 * reach is worth nothing over five years, then hiring is decoration however varied it
 * looks on a single picture.
 *
 * ## What it found, and what it changed
 *
 * Twice it falsified something `tools/slate.mjs` could not see, and both times the
 * model changed rather than the numbers.
 *
 * **First.** Per picture, a cheapest-team median of 0.78x looked like a weak but
 * viable budget option. Over five years it was nothing of the kind: losing a fifth of
 * every budget compounds, so those studios ran dry and stopped making pictures, while
 * the dear teams were never refused a greenlight at all. The expensive option was the
 * *more* affordable one. Raising the floor fixed the symptom and left the cause: with
 * a take that was a multiple of the budget, spending more returned more without bound,
 * so the best team ended richest at every level of capital and hiring was a lookup.
 *
 * **Second.** Capping the take at what the material could reach made the rungs
 * genuinely differ — and then this instrument found the decision still was not there.
 * A policy that costed out every rung chose the *same rung every time*, because reach
 * was a pure function of the three demands and every property of a given shape was the
 * same property. Variety that only appears once the draw has landed is hindsight, not
 * a decision. `APPEAL_STRAYS` exists because of that run.
 *
 * With both in place, matching the team to the material ends five years on 1.04x what
 * the best fixed rung manages. The full table is in `src/engine/content/release.ts`.
 *
 * **Third, and about this instrument rather than the game.** That figure was recorded
 * as 1.16x from a four-world run, and ten worlds do not support it. Four worlds of a
 * five-year career is not a sample; the spread between seeds is wider than the effect
 * being measured. Run this at ten or more before writing a number into a docstring,
 * and prefer a difference that survives doubling the worlds to one that does not.
 *
 * ## What `match` is and is not
 *
 * It is a floor on what the decision is worth, and a loose one. It reads the property
 * it has been handed and never decides **which** property to take — it options
 * whatever the market offers first, good or bad. And it maximises profit *per
 * picture*, which the rows above say is the wrong objective: at the top rung the
 * studio is refused a greenlight fifteen times and makes three fewer pictures, so
 * what binds is cash rather than slots, and a policy that weighed return against
 * money tied up should beat this one. Nobody has measured that yet.
 *
 *   npx vite-node tools/career.mjs                 five years, ten worlds, each policy
 *   npx vite-node tools/career.mjs --years 8       longer
 *   npx vite-node tools/career.mjs --seeds 20      more worlds
 *   npx vite-node tools/career.mjs --capital 12    on less money
 */

import { quickSave } from '../src/engine/index.ts';
import {
  parentCompany, holdingsOf, projectsOf, companyCash, engagementsOf,
} from '../src/engine/world/company.ts';
import { DEPARTMENTS, monthsFor, BEST_TEAM, LEAST_TEAM } from '../src/engine/content/departments.ts';
import { layOut } from '../src/engine/world/schedule.ts';
import { addMonths } from '../src/engine/core/time.ts';
import { reckon, whatItCouldReach } from '../src/engine/content/release.ts';
import { somebodyAt } from '../src/engine/world/people.ts';

const arg = (name, fallback) => {
  const at = process.argv.indexOf(`--${name}`);
  return at >= 0 && process.argv[at + 1] ? process.argv[at + 1] : fallback;
};
const YEARS = Number(arg('years', 5));
// Ten rather than two. The spread between worlds is wider than most of the effects
// this instrument is used to read, and a four-world run once produced a 1.16x that
// ten worlds put at 1.04x — which was written into a docstring before it was checked.
const SEEDS = Number(arg('seeds', 10));
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

/**
 * The team this material is actually worth, at the middle of the draw.
 *
 * The only policy here that reads anything. It costs out every rung against what the
 * property could reach and takes the best of them, which is the decision the ceiling
 * on the take was added to create.
 *
 * It beats the best fixed rung by 1.04x, which is thin, and the thinness is at least
 * partly this function rather than the game. Maximising profit **per picture** is the
 * right objective when slots bind and the wrong one when cash does, and the rows this
 * instrument prints say cash is what binds: the dear policies are refused greenlights
 * and make fewer pictures. Weighing return against money tied up is the obvious next
 * policy to try, and until somebody tries it this row understates the decision by an
 * unknown amount rather than measuring it.
 */
function worthIt(holding, at, zone) {
  let best = { level: LEAST_TEAM, profit: -Infinity };
  const reach = whatItCouldReach(holding.demands, holding.appeal);
  for (let level = LEAST_TEAM; level <= BEST_TEAM; level += 1) {
    const levels = {};
    for (const d of DEPARTMENTS) levels[d.id] = level;
    const cost = layOut(holding.demands, levels, at, zone).budgetCents;
    const profit = reckon(reach, (level - LEAST_TEAM) / (BEST_TEAM - LEAST_TEAM), 0.5) - cost;
    if (profit > best.profit) best = { level, profit };
  }
  return best.level;
}

/** One studio, run for a while at one team level, or matching the team to the material. */
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

    const hire = level === 'match' ? worthIt(holding, sim.now, sim.homeZone) : level;
    // Stepping down when the rung asked for will not take the picture, which is what
    // a player does and what the minimum-budget term is for. Without it the dear
    // policies would simply leave departments empty on small pictures and read as
    // cheap, which would flatter them.
    for (const d of DEPARTMENTS) {
      if (monthsFor(d, holding.demands) <= 0) continue;
      for (let rung = hire; rung >= LEAST_TEAM; rung -= 1) {
        const who = somebodyAt(
          sim, engagementsOf(sim.universe), d.id, rung, sim.now, sim.now,
        );
        if (!who) continue;
        if (ok(run(sim, 'company.staff', { projectId: project.id, departmentId: d.id, personId: who.id }))) break;
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

const policies = [];
for (let level = LEAST_TEAM; level <= BEST_TEAM; level += 1) policies.push(level);
policies.push('match');

const ended = new Map();
for (const level of policies) {
  const runs = [];
  for (let seed = 1; seed <= SEEDS; seed += 1) runs.push(aCareer(seed, level));
  const mean = (pick) => runs.reduce((sum, one) => sum + pick(one), 0) / runs.length;
  const alive = runs.filter((one) => one.ended > 0).length;
  ended.set(level, mean((o) => o.ended));
  if (level === 'match') console.log('-'.repeat(78));
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
console.log();

// The falsifiability test for the whole model. "Match" is the only policy here that
// reads the material before hiring; every other row hires the same way whatever turns
// up. If reading it is worth nothing, there was no decision to make.
const best = [...ended.entries()].filter(([l]) => l !== 'match')
  .reduce((most, one) => (one[1] > most[1] ? one : most));
const matched = ended.get('match');
console.log(`The best fixed rung was team ${best[0]}, ending on ${m(best[1])}.`);
console.log(`Matching the team to the material ended on ${m(matched)}, which is `
  + `${matched > best[1] ? 'more' : 'no better'} — `
  + `${matched > best[1] ? `${(matched / best[1]).toFixed(2)}x the best rung that never looks` : 'and the decision is decoration'}.`);
console.log('='.repeat(78));
