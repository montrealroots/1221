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
import { shoppableItems } from '../src/engine/content/catalog.ts';

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

const deep = rows.filter(([, n]) => n >= TARGET).length;
console.log('');
console.log(`${counts.size} brands, ${shoppableItems().length} products, ${deep} at ${TARGET} or more.`);

if (short.length > 0) {
  console.log(`Short of ${TARGET}: ${short.join(', ')}`);
  process.exit(1);
}
