/** A short seed: one picture in principal photography, for a screenshot. */
import { writeFileSync } from 'node:fs';
import { quickSave, validateUniverse } from '../src/engine/index.ts';
import { parentCompany } from '../src/engine/world/company.ts';

const MS_WEEK = 7 * 86400000;
const sim = quickSave({}, 'hub-shot');
const said = [];
const ask = (kind, payload = {}) => {
  const out = sim.execute({ kind, payload }).value ?? {};
  if (out.error) said.push(`${kind}: ${out.error}`);
  return out;
};

// The same picker the business instrument uses: anybody not already in a
// gating seat at this company.
const GATING = new Set(['production', 'accountant']);
const pick = () => {
  const ours = parentCompany(sim.universe)?.id;
  const people = Object.values(sim.universe.people).filter((one) => one.careerTrack !== 'executive');
  const seat = (id) => Object.values(sim.universe.posts).find((p) => p.personId === id && p.companyId === ours);
  return (people.find((one) => !seat(one.id)) ?? people.find((one) => !GATING.has(seat(one.id).role)))?.id;
};
for (const role of ['production', 'accountant']) {
  const who = pick();
  if (who) ask('company.fill_post', { role, personId: who });
}

// Material before cover: an underwriter reads the chain of title, so E&O is
// refused until the option exists. Ordering, not a rule.
ask('company.option', { title: 'Hvítserkur', hold: 'option', months: 18 });
ask('company.register', { registry: 'is_employer' });
for (const policy of ['general_liability', 'workers_comp', 'production_package', 'errors_omissions']) {
  ask('company.insure', { policy });
}
ask('company.develop', { title: 'Hvítserkur', medium: 'film' });

const project = Object.values(sim.universe.projects).find((p) => p.title === 'Hvítserkur');
const out = ask('company.greenlight', {
  projectId: project.id, planId: 'feature', budgetCents: 12_000_000_00, shootWeeks: 8,
});
console.log('greenlight:', out.ok === false ? out.error : 'yes');

const shoot = sim.universe.projects[project.id]?.periods?.find((p) => p.id === 'shooting');
if (shoot) sim.advanceTo(shoot.from + 2 * MS_WEEK);

const now = sim.universe.projects[project.id];
console.log('stage:', now.stage, '| crew:', (now.crew ?? []).length, '| roles:', (now.roles ?? []).length,
  '| stage room:', sim.universe.stages[now.stageId]?.name);
const bad = validateUniverse(sim.universe).errors;
if (bad.length) console.log('INVALID:', bad.slice(0, 2));
if (said.length) console.log('refusals:', said.slice(0, 6));
writeFileSync('shots/seed.json', JSON.stringify(sim.universe));
console.log('wrote shots/seed.json');
