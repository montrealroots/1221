/**
 * The house is a house.
 *
 * The life contract asks that every owned object have a place in a room, a
 * condition, and something you can do with it. Two of those are structural and
 * hold by construction. The third is content: somebody has to have written
 * down what a Vitamix is for. This measures that, so the claim in the docs is
 * a number rather than a feeling, and so it cannot quietly rot when the
 * catalog grows.
 *
 * It also holds the line on the mistakes that were actually made: a coffee
 * table that made coffee, a bath towel that ran a bath, a dishwasher counted
 * as the washing machine.
 */

import { shoppableItems } from '../src/engine/content/catalog.ts';
import { usesFor } from '../src/engine/systems/household.ts';

/** Categories that live in a house and wear out there. */
const AT_HOME = ['appliance', 'electronics', 'equipment', 'household', 'furniture', 'home', 'books', 'art'];

/** The share of each shelf that must have a verb somebody would use. */
const FLOOR = {
  appliance: 0.70, electronics: 0.70, equipment: 0.70, household: 0.80,
  furniture: 0.65, home: 0.15, books: 1, art: 1,
};

/** Things that must never be read by half their name. */
const NEVER = [
  ['IKEA Lack Coffee Table', 'furniture'],
  ['Herman Miller Noguchi Coffee Table', 'furniture'],
  ['Frette Unito Bath Towels', 'home'],
  ['Muji Cotton Bath Mat', 'home'],
  ['Muji Organic Cotton Bed Linen Set', 'home'],
  ['Muji LED Desk Lamp', 'home'],
  ['Flos Arco Floor Lamp', 'furniture'],
  ['Sunkist Navel Oranges', 'groceries'],
  ['Levi’s 501 Original Fit Jeans', 'clothing'],
];

/** Things that must be read exactly right. */
const ALWAYS = [
  ['Wolf Dual Fuel Range', 'appliance', 'Cook With It'],
  ['Miele W1 Washing Machine', 'appliance', 'Do The Washing'],
  ['Miele G 7000 Dishwasher', 'appliance', 'Load The Dishwasher'],
  ['Dyson Supersonic Hair Dryer', 'appliance', 'Do Your Hair'],
  ['Weber Original Kettle Charcoal Grill', 'appliance', 'Cook With It'],
  ['Rogue Kettlebell', 'equipment', 'Lift Some Weights'],
  ['FINIS Freestyler Paddles', 'equipment', 'Get In The Water'],
  ['Valve Steam Deck OLED', 'electronics', 'Play Something'],
  ['LG OLED evo G4 65 Inch', 'electronics', 'Watch Something'],
  ['IKEA Söderhamn Sofa', 'furniture', 'Sit Down'],
  ['Vispring Regal Superb Mattress', 'furniture', 'Take A Nap'],
];

/** Things that must offer a second, real way of using them. */
const ALSO = [
  ['IKEA Söderhamn Sofa', 'furniture', 'Take A Nap'],
  ['Herman Miller Eames Lounge Chair And Ottoman', 'furniture', 'Take A Nap'],
  ['LG OLED evo G4 65 Inch', 'electronics', 'Doze Off In Front Of It'],
];

const problems = [];
const items = shoppableItems();

for (const category of AT_HOME) {
  const shelf = items.filter((i) => i.category === category);
  if (shelf.length === 0) { problems.push(`no ${category} in the catalog at all`); continue; }
  const used = shelf.filter((i) => usesFor(i.name, i.category).length > 0).length;
  const share = used / shelf.length;
  const floor = FLOOR[category];
  const mark = share >= floor ? 'ok  ' : 'THIN';
  console.log(`${mark} ${category.padEnd(12)} ${String(used).padStart(4)}/${String(shelf.length).padEnd(4)} ${(share * 100).toFixed(0).padStart(3)}%  floor ${(floor * 100).toFixed(0)}%`);
  if (share < floor) problems.push(`${category}: ${used}/${shelf.length} have something to do with them, below ${(floor * 100).toFixed(0)}%`);
}

for (const [name, category] of NEVER) {
  const [use] = usesFor(name, category);
  if (use) problems.push(`${name} should have no use, and got "${use.label}"`);
}

for (const [name, category, label] of ALWAYS) {
  const [use] = usesFor(name, category);
  if (use?.label !== label) problems.push(`${name} should be "${label}", and got "${use?.label ?? 'nothing'}"`);
}

for (const [name, category, label] of ALSO) {
  const labels = usesFor(name, category).map((u) => u.label);
  if (!labels.includes(label)) problems.push(`${name} should also offer "${label}", and offers ${labels.join(', ') || 'nothing'}`);
}

// Every label is a thing a person says, in Title Case, with no stray casing,
// and every id is stable and unique to its wording.
const labels = new Map();
const ids = new Map();
for (const item of items) {
  for (const use of usesFor(item.name, item.category)) {
    labels.set(use.label, (labels.get(use.label) ?? 0) + 1);
    const seen = ids.get(use.id);
    if (seen !== undefined && seen !== use.label) problems.push(`id "${use.id}" is used for both "${seen}" and "${use.label}"`);
    ids.set(use.id, use.label);
  }
}
for (const label of labels.keys()) {
  if (!/^[A-Z]/.test(label)) problems.push(`label "${label}" does not start capitalised`);
  for (const word of label.split(' ')) {
    if (!/^[A-Z]/.test(word)) problems.push(`label "${label}" is not Title Case`);
  }
  if (/-/.test(label)) problems.push(`label "${label}" has a hyphen in it`);
}

console.log('');
for (const [label, count] of [...labels].sort((a, b) => b[1] - a[1])) {
  console.log(`  ${String(count).padStart(4)}  ${label}`);
}
console.log(`\n${labels.size} different things to do, across ${items.filter((i) => AT_HOME.includes(i.category)).length} things a home can hold.`);

if (problems.length > 0) {
  console.error(`\n${problems.length} problem(s):`);
  for (const p of problems) console.error(`  - ${p}`);
  process.exit(1);
}
console.log('The house holds.');
