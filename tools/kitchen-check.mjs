/**
 * Can the recipes actually be cooked?
 *
 * Before this checker existed, every recipe in the game named ingredients no
 * shop sold any more — the invented groceries the catalog started with, long
 * since replaced by real ones. Nine recipes, nine dead ends, and nothing said
 * so. A promise like "you can put a recipe together at home" is worth nothing
 * unless something measures it, so this does, and the build fails when it
 * stops being true.
 *
 * It fails on four things:
 *   - a recipe naming an ingredient the catalog does not have;
 *   - a recipe naming an ingredient no shop in the game sells;
 *   - a recipe asking for equipment that is neither fitted in a home nor
 *     buyable anywhere;
 *   - a recipe with no ingredients at all.
 *
 * Run: node tools/kitchen-check.mjs
 */
import { CATALOG, RECIPES, shoppableItems } from '../src/engine/content/catalog.ts';
import { EQUIPMENT, FITTED_KITCHEN, equipmentFrom } from '../src/engine/content/kitchen.ts';

const shoppable = new Set(shoppableItems().map((i) => i.id));
const failures = [];

// What a shop somewhere in the world will sell you to cook with.
const buyable = new Set(FITTED_KITCHEN);
for (const item of shoppableItems()) {
  for (const kind of equipmentFrom(item.name, item.category)) buyable.add(kind);
}

for (const recipe of RECIPES.all()) {
  if (recipe.ingredients.length === 0) {
    failures.push(`${recipe.name} has no ingredients`);
  }
  for (const ing of recipe.ingredients) {
    if (!CATALOG.get(ing.catalogId)) {
      failures.push(`${recipe.name} names ${ing.catalogId}, which is not in the catalog`);
    } else if (!shoppable.has(ing.catalogId)) {
      failures.push(`${recipe.name} needs ${CATALOG.get(ing.catalogId).name}, which no shop sells`);
    }
  }
  for (const kind of recipe.equipment) {
    if (!EQUIPMENT.includes(kind)) {
      failures.push(`${recipe.name} asks for ${kind}, which is not a kind of kit`);
    } else if (!buyable.has(kind)) {
      failures.push(`${recipe.name} needs ${kind}, which no shop sells and no home is fitted with`);
    }
  }
}

const meals = new Map();
for (const recipe of RECIPES.all()) meals.set(recipe.meal, (meals.get(recipe.meal) ?? 0) + 1);

const needsKit = RECIPES.all().filter((r) => r.equipment.some((k) => !FITTED_KITCHEN.includes(k)));
const fittedOnly = RECIPES.all().length - needsKit.length;

console.log(`${RECIPES.all().length} recipes: ${[...meals.entries()].sort().map(([m, n]) => `${n} ${m}`).join(', ')}.`);
console.log(`${fittedOnly} can be cooked in any fitted kitchen; ${needsKit.length} need something you went out and bought.`);
console.log(`${new Set(RECIPES.all().flatMap((r) => r.ingredients.map((i) => i.catalogId))).size} distinct ingredients, every one of them on a shelf somewhere.`);

for (const f of failures) console.log(`SHORT  ${f}`);
if (failures.length > 0) {
  console.log(`${failures.length} recipes that cannot be cooked.`);
  process.exit(1);
}
