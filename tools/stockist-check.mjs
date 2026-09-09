/**
 * Who would really have it on the shelf.
 *
 * The shop floor makes two promises: a brand's own shopfront sells that
 * brand and nothing else, and everybody else sells their own half of the
 * market rather than the whole catalog. Promises like that are worth nothing
 * unless they are measured, so this counts them and fails when they slip.
 *
 * It fails on three things, and on nothing else:
 *   - a piece nobody in the world would sell, which would make it unbuyable;
 *   - a shopfront with a brand over the door carrying another company's work;
 *   - a value chain carrying a house, or a luxury floor carrying a value label,
 *     resale and the saleroom aside, which really do carry both.
 *
 * The thin shopfronts it prints are not failures. A boutique is thin because
 * SLATE has not written that brand out to depth yet, which is what
 * tools/brand-depth.mjs counts.
 *
 * Run: node tools/stockist-check.mjs
 */
import { RETAILERS, brandStanding, houseBrandOf, isConsignment, shoppableItems, standingOf, stockistsFor, stocks } from '../src/engine/content/catalog.ts';

const WEARABLE = new Set(['clothing', 'footwear', 'accessory', 'watch', 'jewelry']);
/** Cities to measure the spread in, from the deepest retail market down. */
const CITIES = ['us-ca-losangeles', 'uk-eng-london', 'fr-idf-paris', 'jp-13-tokyo', 'ke-05-nairobi'];
/** Nike's own other label. The one company that sells two names in one shop. */
const FAMILY = { Nike: ['Jordan'] };

const items = shoppableItems();
const wearables = items.filter((i) => WEARABLE.has(i.category));
const shops = RETAILERS.all();
const houses = shops.filter((r) => houseBrandOf(r) !== undefined);

const failures = [];

// 1. Nobody left unsellable.
const orphans = wearables.filter((item) => !shops.some((r) => stocks(r, item)));
for (const o of orphans.slice(0, 10)) failures.push(`nobody would sell ${o.brand} ${o.name}`);
if (orphans.length > 10) failures.push(`and ${orphans.length - 10} more with nobody to sell them`);

// 2. A shopfront carries its own label only.
for (const house of houses) {
  const brand = houseBrandOf(house);
  const allowed = new Set([brand, ...(FAMILY[brand] ?? [])]);
  const foreign = items.find((i) => !allowed.has(i.brand) && stocks(house, i));
  if (foreign) failures.push(`${house.name} is selling ${foreign.brand} ${foreign.name}`);
}

// 3. Neither end of the market reaches into the other.
for (const shop of shops) {
  if (houseBrandOf(shop) !== undefined) continue;
  // Resale and the saleroom really do carry a house they could not stock new.
  if (isConsignment(shop)) continue;
  for (const item of wearables) {
    if (!stocks(shop, item)) continue;
    const standing = standingOf(item);
    if (standing > shop.tier || standing < shop.tier - 1) {
      failures.push(`${shop.name} (tier ${shop.tier}) is selling ${item.name} (standing ${standing})`);
      break;
    }
  }
}

const byStanding = new Map();
for (const brand of new Set(wearables.map((i) => i.brand))) {
  const s = brandStanding(brand);
  byStanding.set(s, (byStanding.get(s) ?? 0) + 1);
}

console.log(`${houses.length} shopfronts with a brand over the door, ${shops.length - houses.length} shops carrying many.`);
console.log(`${[...byStanding.entries()].sort().map(([s, n]) => `${n} at ${s}`).join(', ')} on the standing scale of 1 to 5.`);
for (const city of CITIES) {
  let total = 0;
  let none = 0;
  for (const item of wearables) {
    const n = stockistsFor(item, city).length;
    total += n;
    if (n === 0) none += 1;
  }
  console.log(`${city}: ${(total / wearables.length).toFixed(1)} shops per piece, ${none} of ${wearables.length} not sold in town.`);
}

const thin = houses
  .map((h) => [houseBrandOf(h), items.filter((i) => i.brand === houseBrandOf(h)).length])
  .filter(([, n]) => n < 100)
  .sort((a, b) => a[1] - b[1]);
console.log(`${houses.length - thin.length} shopfronts are a hundred deep; ${thin.length} are thinner and are named in the backlog.`);

for (const f of failures) console.log(`SHORT  ${f}`);
if (failures.length > 0) {
  console.log(`${failures.length} shops selling what they would not sell.`);
  process.exit(1);
}
