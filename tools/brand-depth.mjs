/**
 * How deep each headline brand actually goes.
 *
 * The promise is a hundred real products for every big name. A promise like
 * that is worth nothing unless it is measured, so this counts, reports, and
 * fails when a brand on the list has fallen short.
 *
 * `HEADLINE` is the list of brands held to the hundred. It grows as brands
 * are filled out, and a brand goes on it only once it is actually there —
 * putting a name on this list before the products exist would turn a check
 * into a lie.
 *
 * Run: node tools/brand-depth.mjs        (report and fail on a shortfall)
 *      node tools/brand-depth.mjs --all  (every brand, deepest first)
 */
import { shoppableItems, houseBrandOf, RETAILERS } from '../src/engine/content/catalog.ts';

/** What "deep" means. */
export const TARGET = 100;

/** The brands held to it, and nothing on here is aspirational. */
const HEADLINE = [
  'Nike', 'Jordan', 'Adidas', 'New Balance',
  'Under Armour', 'Puma', 'Reebok', 'Asics', 'Converse', 'Vans',
  'Louis Vuitton', 'Gucci', 'Prada', 'Dior', 'Chanel', 'Hermès',
  'Balenciaga', 'Saint Laurent', 'Bottega Veneta',
  'ARRI', 'RED', 'Sony', 'Canon', 'Blackmagic Design', 'Aputure', 'MAC Cosmetics',
  'Icebox', 'King Ice',
  'Versace', 'Fendi', 'Celine', 'Loewe', 'Burberry', 'Ralph Lauren', 'Givenchy', 'Valentino',
  'Rolex', 'Patek Philippe', 'Audemars Piguet', 'Omega', 'Cartier', 'Tiffany & Co.', 'Bulgari', 'Van Cleef & Arpels',
  'Moncler', 'Stone Island', 'The North Face', 'Canada Goose', 'Levi’s', 'Carhartt', 'Patagonia', 'Uniqlo',
  'Zara', 'H&M', 'COS', 'Mango', 'Gap', 'Massimo Dutti', 'Muji', 'Marks & Spencer',
  'Christian Louboutin', 'Jimmy Choo', 'Manolo Blahnik', 'Dr. Martens', 'Birkenstock', 'Clarks', 'Timberland', 'UGG',
  'Tom Ford', 'Zegna', 'Loro Piana', 'Brunello Cucinelli', 'The Row', 'Acne Studios', 'Church’s', 'Crockett & Jones',
  'Harry Winston', 'Graff', 'Boucheron', 'Chaumet', 'Piaget', 'Chopard', 'Mikimoto', 'Buccellati',
  'Johnny Dang & Co.', 'Jacob & Co.', 'Eliantte & Co.', 'Avianne & Co.', 'IF & Co.',
  'Popular Jewelry', 'GLD', 'Rafaello & Co.', 'Greg Yuna', 'Frost NYC', 'TraxNYC', 'Pristine Jewelers',
  'Pandora', 'Swarovski', 'Monica Vinader', 'Mejuri', 'Astrid & Miyu', 'Thomas Sabo', 'Astley Clarke',
  'Dinh Van', 'Repossi', 'TASAKI', 'Ole Lynggaard Copenhagen', 'Georg Jensen', 'David Yurman',
  'Messika', 'Pomellato',
  'Lululemon', 'Arket', 'Everlane', 'Aritzia', 'Next', 'Havaianas', 'John Lobb',
];

const counts = new Map();
for (const item of shoppableItems()) {
  counts.set(item.brand, (counts.get(item.brand) ?? 0) + 1);
}

const rows = [...counts.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));

if (process.argv.includes('--all')) {
  for (const [brand, n] of rows.slice(0, 60)) console.log(`${String(n).padStart(4)}  ${brand}`);
  console.log('');
}

const short = HEADLINE.filter((brand) => (counts.get(brand) ?? 0) < TARGET);
for (const brand of HEADLINE) {
  const n = counts.get(brand) ?? 0;
  console.log(`${n >= TARGET ? '  ok' : 'SHORT'}  ${String(n).padStart(4)}  ${brand}`);
}

/**
 * The rule that matters more than the list above.
 *
 * A shop selling many labels draws its hundred from all of them and always
 * clears the floor minimum. A single-brand boutique can only sell its own
 * label, so a thin brand is a thin *shop*: walking into Pandora and finding
 * seven things is not a shop, it is a display case. So every brand that has
 * a boutique of its own is held to the hundred, whether or not anybody
 * remembered to add it to HEADLINE.
 */
const fronts = new Map();
for (const retailer of RETAILERS.all()) {
  const house = houseBrandOf(retailer);
  if (house) fronts.set(house, counts.get(house) ?? 0);
}
const thin = [...fronts.entries()].filter(([, n]) => n < TARGET).sort((a, b) => a[1] - b[1]);

const deep = rows.filter(([, n]) => n >= TARGET).length;
console.log('');
console.log(`${counts.size} brands, ${shoppableItems().length} products, ${deep} at ${TARGET} or more.`);
console.log(`${fronts.size} of them have a boutique of their own, and ${fronts.size - thin.length} of those are ${TARGET} deep.`);

if (thin.length > 0) {
  console.error('');
  console.error(`${thin.length} single-brand boutique(s) hold fewer than ${TARGET} products, which is a display case rather than a shop:`);
  for (const [brand, n] of thin) console.error(`  ${String(n).padStart(4)}  ${brand}`);
  process.exit(1);
}

if (short.length > 0) {
  console.log(`Short of ${TARGET}: ${short.join(', ')}`);
  process.exit(1);
}
