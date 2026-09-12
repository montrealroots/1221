/**
 * A save with a production in it, for the sweeps that need one.
 *
 * `tools/text-caps.mjs` and the cohesion walk both start from character
 * creation, which lands on a save with a company that has done nothing and a
 * slate with nothing on it. That leaves the densest text in the game — a
 * schedule, a delivery list, a crew of two dozen with a union local each, a
 * recoupment waterfall — never measured at any width.
 *
 * This builds one: an earlier picture delivered and sold so its money has
 * somewhere to be, and a second in principal photography with its crew on it.
 * Everything comes out of the engine's own commands, so it is a save the game
 * could have reached on its own rather than a fixture written by hand.
 *
 *   npx vite-node tools/seed-save.mjs text-caps/seed.json
 *   SLATE_SEED_SAVE=text-caps/seed.json node tools/text-caps.mjs
 */

import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { quickSave, validateUniverse } from '../src/engine/index.ts';
import { MS_DAY } from '../src/engine/core/time.ts';
import { projectsOf } from '../src/engine/world/company.ts';
import { MS_WEEK } from '../src/engine/world/lot.ts';
import { finishesBy, heldUpBy, windowOf } from '../src/engine/world/making.ts';
import { crewOf } from '../src/engine/world/crew.ts';

const out = process.argv[2] ?? 'text-caps/seed.json';
mkdirSync(dirname(out), { recursive: true });

const run = (sim, kind, payload = {}) => sim.execute({ kind, payload }).value;

/** Puts a title on the slate and greenlights it. */
function greenlight(sim, title, budgetCents) {
  run(sim, 'company.develop', { title, medium: 'film' });
  const id = projectsOf(sim.universe).find((o) => o.title === title).id;
  const done = run(sim, 'company.greenlight', {
    projectId: id, planId: 'feature', budgetCents, shootWeeks: 6,
  });
  if (!done.ok) throw new Error(`${title}: ${done.error}`);
  return id;
}

/** Runs it out and files every piece of paperwork the money waits on. */
function deliver(sim, id) {
  for (let i = 0; i < 8; i += 1) {
    const done = finishesBy(sim.universe.projects[id]);
    if (sim.now > done) break;
    sim.advanceTo(done + MS_DAY);
  }
  for (const element of heldUpBy(sim.universe.projects[id])) {
    run(sim, 'company.deliver', { projectId: id, elementId: element.id });
  }
}

const sim = quickSave({}, 'seeded');

// One behind it, delivered and sold, so the waterfall has something to show.
const sold = greenlight(sim, 'Reykjadalur', 20_000_000_00);
deliver(sim, sold);
run(sim, 'company.sell', { projectId: sold, dealId: 'studio' });
sim.advanceTo(sim.universe.projects[sold].releasedAt + 60 * MS_WEEK);

// And one in front of it, mid-shoot, with its crew on.
const shooting = greenlight(sim, 'Hvítserkur', 20_000_000_00);
sim.advanceTo(windowOf(sim.universe.projects[shooting], 'shooting').from + 6 * MS_DAY);

const errors = validateUniverse(sim.universe).errors;
if (errors.length > 0) throw new Error(`the seeded save is not sound: ${JSON.stringify(errors)}`);

writeFileSync(out, JSON.stringify(sim.universe));
console.log(`Wrote ${out}.`);
console.log(`  ${Object.values(sim.universe.people).length} people, `
  + `${crewOf(sim, sim.universe.projects[shooting]).length} of them on ${sim.universe.projects[shooting].title}`);
console.log(`  ${sim.universe.projects[sold].title} is sold and `
  + `${(sim.universe.projects[sold].windowsPaid ?? []).length} of its windows have paid`);
