// Builds src/engine/content/clothingcatalog.ts from the clothing research in
// docs/research/world/research-clothing-*.json (Stage 3 of docs/BACKLOG.md,
// from 2026-10-01). Each product keeps its retailer, brand, exact name,
// regular price, the sizes and colors its page offered, its care, its source
// and whether it was read on its own page. The slot it's worn in and the care
// kind that sets its wears and washes come from its category and name; a
// product whose page gave no care label takes its kind's usual care, said so.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const FILES = ['research-clothing-us.json', 'research-clothing-ukie.json', 'research-clothing-camx.json'].map((f) => `docs/research/world/${f}`);
const OUT = 'src/engine/content/clothingcatalog.ts';

/** A retailer's department, as read: women's, men's or unisex, in English or Spanish; none where none was read. */
const deptOf = (g) => { const x = String(g ?? '').toLowerCase(); return x === 'women' || x === 'mujer' ? 'Women' : x === 'men' || x === 'hombre' ? 'Men' : x === 'unisex' ? 'Unisex' : null; };
const slug = (s) => String(s).toLowerCase().normalize('NFKD').replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');

/**
 * The garment words, each with the slot and care kind (`content/garmentcare.ts`) it names. A
 * name's garment is its head noun, the last garment word in it: a "Jean Mini
 * Skirt" is a skirt, a "Denim Shirt" a shirt, "Trainer Socks" socks. Until
 * 2026-10-01 the first rule to match anywhere in the category and name
 * decided, and filed those three as jeans, jeans and shoes.
 */
const WORDS = [
  [/\b(watch(es)?|necklaces?|earrings?|rings?|bracelets?|cufflinks?|jewell?ery|pendants?)\b/, 'accessory', 'accessory'],
  [/\b(bags?|totes?|backpacks?|crossbody|clutch|wallets?|purses?|umbrellas?)\b/, 'accessory', 'accessory'],
  [/\b(belts?|scarf|scarves|hats?|caps?|beanies?|gloves?|mittens?|sunglasses|ties?|bow tie|pocket squares?)\b/, 'accessory', 'accessory'],
  [/\b(socks?|hosiery|tights|stockings?)\b/, 'socks', 'socks'],
  [/\b(shoes?|boots?|trainers?|sneakers?|sandals?|heels?|loafers?|slippers?|flip-?flops?|mules?|pumps?|espadrilles?|brogues?|oxfords|derbys?|clogs?|slides)\b/, 'shoes', 'shoes'],
  [/\b(bras?|bralettes?)\b/, 'underwear', 'bra'],
  [/\b(boxer shorts|boxers?|briefs?|trunks?|knickers|underwear|thongs?|hipsters?|undershirts?)\b/, 'underwear', 'underwear'],
  [/\b(pyjamas?|pajamas?|nightdress(es)?|nighties?|robes?|dressing gowns?|loungewear|sleep ?shirts?)\b/, 'sleep', 'pajamas'],
  [/\b(suits?|tuxedos?)\b/, 'suit', 'suit'],
  [/\b(coats?|jackets?|parkas?|puffers?|gilets?|blazers?|raincoats?|anoraks?|trench(es)?|overcoats?|waistcoats?|macs?|shackets?)\b/, 'outer', 'coat'],
  [/\b(dress(es)?|gowns?|jumpsuits?|playsuits?|rompers?)\b/, 'dress', 'dress'],
  [/\b(skirts?|skorts?)\b/, 'bottom', 'skirt'],
  [/\b(sweaters?|jumpers?|cardigans?|hoodies?|sweatshirts?|fleeces?|pullovers?|knits?|crewnecks?)\b/, 'top', 'sweater'],
  [/\b(t-?shirts?|tees?|tanks?|tank tops?|camisoles?|camis?|vest tops?)\b/, 'top', 't-shirt'],
  [/\b(shirts?|blouses?|polos?|tops?|henleys?|button-?downs?|overshirts?|bodysuits?)\b/, 'top', 'shirt'],
  [/\b(jeans?|denims?)\b/, 'bottom', 'jeans'],
  [/\b(trousers?|pants|chinos?|leggings?|shorts|joggers?|sweatpants|cargos?|slacks)\b/, 'bottom', 'trousers'],
];

/** The head garment word in some text, as [slot, kind, the word], or nothing. */
function headOf(text, market) {
  let best;
  for (const [re, slot, kind] of WORDS) {
    for (const m of text.matchAll(new RegExp(re.source, 'g'))) {
      const end = m.index + m[0].length;
      if (!best || end > best.end || (end === best.end && m[0].length > best.len)) best = { end, len: m[0].length, slot, kind, word: m[0] };
    }
  }
  if (!best) return undefined;
  // "Pants" in Britain and Ireland are underwear; a "vest" is an undershirt there and outerwear in America.
  if (best.word === 'pants' && (market === 'GB' || market === 'IE')) return ['underwear', 'underwear'];
  return [best.slot, best.kind];
}

/** The slot and care kind a product is: its name's head noun, else its subcategory's, its category's where that says more. */
function wornAs(p, market) {
  const name = String(p.name).toLowerCase();
  const vest = /\bvests?\b/.test(name) && !/vest tops?/.test(name);
  const head = headOf(name, market) ?? (vest ? (market === 'GB' || market === 'IE' ? ['underwear', 'underwear'] : ['outer', 'coat']) : undefined)
    ?? headOf(`${p.subcategory ?? ''} ${p.category ?? ''}`.toLowerCase(), market);
  const [slot, kind] = head ?? ['top', 'shirt'];
  const category = String(p.category ?? '').toLowerCase();
  // A category that decides more than the word: sportswear is worn to exercise, a suit's parts are a suit's, sleepwear is slept in.
  const worn = slot === 'shoes' || slot === 'socks' || slot === 'accessory' || slot === 'underwear';
  if (category === 'activewear' && !worn) return ['active', 'active'];
  if (category === 'formalwear' && kind === 'trousers') return ['bottom', 'suit'];
  if (category === 'formalwear' && kind === 'coat') return ['outer', 'suit'];
  if (category === 'sleepwear' && !worn) return ['sleep', 'pajamas'];
  if (category === 'footwear' && !head) return ['shoes', 'shoes'];
  return [slot, kind];
}

/** How many come in it, from its name: a 6-pack of socks is six pairs. */
function packOf(name) {
  const m = String(name).match(/(\d+)\s*-?\s*(?:pack|pk)\b/i) ?? String(name).match(/\b(\d+)\s*pairs?\b/i);
  const n = m ? Number(m[1]) : 1;
  return n > 1 && n <= 20 ? n : 1;
}

/** Its care from its label, or its kind's usual care where the page gave none. */
function careOf(p, kind) {
  // A care class where the research gave one, then the label's own words.
  const shown = p.careText ?? p.care ?? null;
  const label = `${p.care ?? ''} ${p.careText ?? ''}`.toLowerCase().replace(/\s+/g, ' ').trim();
  if (label) {
    if (/dry ?clean only|specialist dry clean|do ?not ?wash|donotwash/.test(label)) return { care: 'dry-clean', careLabel: shown };
    if (/hand wash/.test(label) && !/machine wash/.test(label)) return { care: 'hand', careLabel: shown };
    if (/machine wash|wash at|wash on|^wash/.test(label)) return { care: 'wash', careLabel: shown };
    if (/wipe|spot clean|polish/.test(label)) return { care: 'wipe', careLabel: shown };
  }
  const usual = kind === 'suit' || kind === 'coat' ? 'dry-clean' : kind === 'shoes' || kind === 'accessory' ? 'wipe' : 'wash';
  return { care: usual, careLabel: null };
}

/** A number from a figure that may be a number, an object of figures or words: the non-member's, the standard, or the first. */
function num(v) {
  if (typeof v === 'number' && Number.isFinite(v)) return v;
  if (v && typeof v === 'object') return num(v.nonMembers ?? v.standard ?? null);
  if (typeof v === 'string') {
    const m = v.replace(/,/g, '').match(/(\d+(?:\.\d+)?)/);
    return m ? Number(m[1]) : /free/i.test(v) ? 0 : null;
  }
  return null;
}

/** Days from "3-7 working days", "2-3", "up to 5": the range's middle. */
function days(v) {
  if (typeof v === 'number') return v;
  if (typeof v !== 'string') return null;
  const m = v.match(/(\d+)\s*(?:-|to)\s*(\d+)/);
  if (m) return (Number(m[1]) + Number(m[2])) / 2;
  const one = v.match(/(\d+)/);
  return one ? Number(one[1]) : /next.?day/i.test(v) ? 1 : null;
}

/** A retailer's terms in one market, from the research's several shapes. */
function terms(r, market) {
  const pick = (o) => (o && typeof o === 'object' && o[market] !== undefined ? o[market] : o);
  const o = pick(r.online) ?? {};
  const back = pick(r.returns) ?? {};
  const delivers = o.homeDelivery !== false && !/no online/i.test(String(o.note ?? ''));
  const freeRaw = o.freeThreshold ?? o.freeShippingThreshold;
  // A threshold only members get isn't the player's.
  const freeOver = typeof freeRaw === 'string' && /member|account|reward/i.test(freeRaw) ? null : num(freeRaw);
  const feeWords = typeof back.fee === 'string' ? back.fee : '';
  const money = feeWords.match(/[$£€]\s?(\d+(?:\.\d+)?)/);
  const byMail = typeof back.fee === 'number' ? back.fee : money ? Number(money[1]) : /free/i.test(feeWords) ? 0 : null;
  const words = feeWords + ' ' + (back.conditions ?? '');
  return {
    delivers,
    fee: delivers ? num(o.fee ?? o.shippingFee) : null,
    freeOver: delivers ? freeOver : null,
    days: delivers ? days(o.days ?? o.standardDeliveryDays) : null,
    returnDays: typeof back.days === 'number' ? back.days : null,
    returnByMail: byMail,
    returnFreeInStore: /in store|in any|free in|to a .* store|shops/i.test(words) || back.fee === 0,
    terms: [o.source, back.source].filter(Boolean).join('; '),
  };
}

const retailers = [];
const products = [];
const seen = new Set();
for (const file of FILES) {
  if (!existsSync(file)) { console.log('skipped (not written yet):', file); continue; }
  const j = JSON.parse(readFileSync(file, 'utf8'));
  const marketOf = (r) => (r.market && r.market !== 'both' ? r.market : file.includes('-us') ? 'US' : r.market);
  for (const r of j.retailers ?? []) {
    const markets = r.market === 'both' ? ['GB', 'IE'] : [marketOf(r)];
    for (const market of markets) {
      const id = `${market.toLowerCase()}-${slug(r.id ?? r.name)}`;
      if (retailers.some((x) => x.id === id)) continue;
      // A store in its own market's cities only: a retailer listed for Britain and Ireland has each country's stores under each.
      const own = { US: 'us-', GB: 'uk-', IE: 'ie-', CA: 'ca-', MX: 'mx-' }[market] ?? '';
      retailers.push({ id, key: r.id ?? slug(r.name), name: r.name, market, kind: r.kind ?? null, sizeSystem: r.sizeSystem ?? null, storesIn: (r.storesIn ?? []).filter((c) => c.startsWith(own)), ...terms(r, market) });
    }
  }
  for (const p of j.products ?? []) {
    if (typeof p.price !== 'number' || !(p.price > 0)) continue;
    const market = p.market ?? (file.includes('-us') ? 'US' : null);
    if (!market) continue;
    const retailer = retailers.find((r) => r.market === market && (r.key === p.retailer || slug(r.name) === slug(p.retailer)));
    if (!retailer) continue;
    const [slot, kind] = wornAs(p, market);
    let id = `${retailer.id}-${slug(p.name)}`.slice(0, 90);
    for (let n = 2; seen.has(id); n += 1) id = `${retailer.id}-${slug(p.name)}`.slice(0, 86) + `-${n}`;
    seen.add(id);
    products.push({
      id, retailer: retailer.id, market, brand: p.brand ?? retailer.name, name: p.name, category: p.category, subcategory: p.subcategory ?? null,
      slot, kind, ...careOf(p, kind), pack: packOf(p.name), price: p.price, currency: p.currency, taxIncluded: market === 'GB' || market === 'IE' || market === 'MX',
      sizes: Array.isArray(p.sizes) ? p.sizes.map(String) : [], colors: Array.isArray(p.colors) ? p.colors.map(String) : [],
      material: p.material ?? null, url: p.url ?? null, date: p.date ?? null, confirmed: p.confirmed === true, subtype: null, sameAs: null,
      // The department the retailer files it under, where the research read one (from 2026-10-04).
      dept: deptOf(p.gender),
    });
  }
}
// From 2026-10-03 (`research-clothing-gaps.json`): the kinds of garment the catalog lacked, each with its
// `subtype`, and the same product at several of a market's sellers, tied by `sameAs`. A seller that isn't one of
// SLATE's retailers (Spanx's own site, Converse's, a marketplace's third party) is left out, as is a product read
// only at a sale price, its regular price unread.
const GAPS = 'docs/research/world/research-clothing-gaps.json';
const SUBTYPE_WORN = { swimwear: ['active', 'swimsuit'], shapewear: ['underwear', 'underwear'], slips: ['base', 'slip'], hosiery: ['socks', 'socks'] };
// Thermals: long underwear, worn under the rest, as a base layer; socks and a pajama set are what they are.
const thermalWorn = (name) => (/socks|calcet/i.test(name) ? ['socks', 'socks'] : /pijama/i.test(name) ? ['sleep', 'pajamas'] : /leggings|tights|pantal|bottoms?/i.test(name) ? ['base', 'thermal-bottom'] : ['base', 'thermal-top']);
// Spanish garment words a Mexican listing names its garment by.
const SPANISH = [[/\b(pijamas?)\b/i, 'sleep', 'pajamas'], [/\b(pantal[oó]n(es)?|mallas?)\b/i, 'bottom', 'trousers'], [/\b(camisetas?|playeras?)\b/i, 'top', 't-shirt'], [/\b(su[eé]ter|chamarra)\b/i, 'top', 'sweater']];
function sellerOf(name, market) {
  let words = String(name ?? '');
  if (/marketplace/i.test(words)) return undefined;
  const selling = words.match(/^(.+?) selling /i);
  if (selling) words = selling[1];
  const clean = words.replace(/\s*\((?:US|UK|Ireland|Canada|México|Mexico|sold by [^)]*|[a-z.]+\.com)\)\s*$/i, '').trim();
  return retailers.find((r) => r.market === market && (slug(r.name) === slug(clean) || slug(r.name).startsWith(`${slug(clean)}-`) || slug(r.name).startsWith(slug(clean)) && slug(clean).length >= 4));
}
function addGap(p, market, retailer, extra) {
  const price = p.price ?? p.regularPrice ?? p.listPrice;
  if (typeof price !== 'number' || !(price > 0) || !retailer) return;
  let id = `${retailer.id}-${slug(p.name)}`.slice(0, 90);
  for (let n = 2; seen.has(id); n += 1) id = `${retailer.id}-${slug(p.name)}`.slice(0, 86) + `-${n}`;
  seen.add(id);
  const spanish = SPANISH.find(([re]) => re.test(p.name));
  const [slot, kind] = extra.worn ?? (headOf(String(p.name).toLowerCase(), market) ? wornAs(p, market) : spanish ? [spanish[1], spanish[2]] : wornAs({ ...p, category: extra.category }, market));
  const sizes = Array.isArray(p.sizes) ? p.sizes.map(String) : [];
  products.push({
    id, retailer: retailer.id, market, brand: p.brand ?? retailer.name, name: p.name, category: extra.category, subcategory: extra.subcategory ?? null,
    slot, kind, ...careOf(p, kind), pack: p.pack ?? packOf(p.name), price, currency: { US: 'USD', GB: 'GBP', IE: 'EUR', CA: 'CAD', MX: 'MXN' }[market],
    taxIncluded: market === 'GB' || market === 'IE' || market === 'MX', sizes, colors: [], material: null, url: p.url ?? null, date: '2026-10-03',
    confirmed: extra.confirmed !== false, subtype: extra.subtype ?? null, sameAs: extra.sameAs ?? null, dept: deptOf(p.gender),
  });
}
if (existsSync(GAPS)) {
  const g = JSON.parse(readFileSync(GAPS, 'utf8'));
  for (const s of g.subtypes ?? []) {
    for (const p of s.products ?? []) {
      const retailer = sellerOf(p.retailer ?? s.retailer, s.market);
      addGap(p, s.market, retailer, { category: s.subtype, subcategory: p.kind ?? s.subtype, subtype: s.subtype, worn: s.subtype === 'thermals' ? thermalWorn(p.name) : SUBTYPE_WORN[s.subtype], confirmed: s.confirmed });
    }
  }
  // The same product: a seller already in the catalog is tied by its listing's id; one that isn't is added.
  const HELD = { 'nike air force 1': ['us-nike-nike-air-force-1-07-mens-shoes'], "levi's 501": ['us-levis-501-original-fit-mens-jeans'], 'adidas samba og': ['us-adidas-samba-og-shoes', 'ie-brown-thomas-samba-og-trainers'] };
  for (const group of g.multiSeller ?? []) {
    const key = slug(String(group.product).replace(/\s*\(.*\)\s*$/, ''));
    const heldKey = Object.keys(HELD).find((k) => String(group.product).toLowerCase().startsWith(k));
    const held = (HELD[heldKey] ?? []).map((id) => products.find((x) => x.id === id)).filter(Boolean);
    for (const x of held) x.sameAs = key;
    const footwear = /air force|chuck|samba/i.test(group.product);
    for (const seller of group.sellers ?? []) {
      const retailer = sellerOf(seller.retailer, seller.market);
      if (!retailer || held.some((x) => x.retailer === retailer.id)) continue;
      if (/spanx/i.test(group.product)) continue;
      addGap({ name: String(group.product).replace(/\s*\(.*\)\s*$/, ''), brand: String(group.product).split(' ')[0], price: seller.price, url: seller.url }, seller.market, retailer, { category: footwear ? 'footwear' : 'everyday', subcategory: footwear ? 'shoes' : 'jeans', worn: footwear ? ['shoes', 'shoes'] : ['bottom', 'jeans'], confirmed: seller.confirmed, sameAs: key });
    }
  }
}

// A retailer with nothing on sale is left out: Hudson's Bay closed its stores on 2025-06-01, and some blocked every read.
for (let i = retailers.length - 1; i >= 0; i -= 1) if (!products.some((p) => p.retailer === retailers[i].id)) retailers.splice(i, 1);
for (const r of retailers) delete r.key;
// A fee or days a retailer doesn't publish: its market's median, said so.
const median = (xs) => {
  const s = xs.filter((x) => typeof x === 'number').sort((a, b) => a - b);
  return s.length ? s[Math.floor(s.length / 2)] : null;
};
for (const r of retailers) {
  if (!r.delivers) continue;
  const same = retailers.filter((x) => x.market === r.market && x.delivers);
  // A fee from those who charge one: a retailer saying shipping is free doesn't say what one that charges asks.
  if (r.fee === null) { r.fee = median(same.map((x) => x.fee).filter((x) => x > 0)); r.feeEstimated = true; }
  if (r.days === null) { r.days = median(same.map((x) => x.days)); r.daysEstimated = true; }
}

const header = `/**
 * SLATE — clothes on sale, by market (Stage 3 of \`docs/BACKLOG.md\`), built by
 * \`tools/build-clothing.mjs\` from \`docs/research/world/research-clothing-*.json\`.
 * Don't edit by hand; rebuild it.
 *
 * Each product is a real retailer's, its name exact and its price the regular
 * one its page listed on the date given: with VAT or IVA in Britain, Ireland
 * and Mexico, before sales tax in America and Canada. Its sizes and colors are
 * the options its page offered, where it was read on its own page
 * (\`confirmed\`); one read only from a search's summary has fewer or none, and
 * says so. Its slot and care kind are read from its category and name. Its
 * care is its label's, or its kind's usual care where the page gave none
 * (\`careLabel\` null), SLATE's reading.
 */
`;
const body = `${header}
import type { Care, Slot } from './garmentcare';

export type ClothingMarket = 'US' | 'GB' | 'IE' | 'CA' | 'MX';

export interface ClothingRetailer {
  id: string; name: string; market: ClothingMarket; kind: string | null; sizeSystem: string | null;
  /** The career cities it has a store in, where an address was found. */
  storesIn: readonly string[];
  /** Whether it delivers to a home, and its fee, the order it's free over and its days, in its market's money. */
  delivers: boolean; fee: number | null; freeOver: number | null; days: number | null;
  /** Where the fee or the days weren't published: its market's median, SLATE's estimate. */
  feeEstimated?: boolean; daysEstimated?: boolean;
  /** Its returns: the days, the fee by mail, and whether a store takes one back free. */
  returnDays: number | null; returnByMail: number | null; returnFreeInStore: boolean;
  /** Where its terms were read. */
  terms: string;
}

export interface ClothingProduct {
  id: string; retailer: string; market: ClothingMarket; brand: string; name: string; category: string; subcategory: string | null;
  slot: Slot; kind: string; care: Care | 'wipe'; careLabel: string | null;
  /** How many come in it: a multipack is that many garments. */
  pack: number;
  price: number; currency: string; taxIncluded: boolean;
  sizes: readonly string[]; colors: readonly string[]; material: string | null;
  url: string | null; date: string | null; confirmed: boolean;
  /** A kind the trade names apart (swimwear, thermals, shapewear, hosiery, slips, cultural), from 2026-10-03. */
  subtype: string | null;
  /** The same product as other sellers' listings with this key, from 2026-10-03. */
  sameAs: string | null;
  /** The department the retailer files it under, where one was read: Women, Men or Unisex (from 2026-10-04). */
  dept: string | null;
}

export const CLOTHING_RETAILERS: readonly ClothingRetailer[] = ${JSON.stringify(retailers, null, 0)};

// Parsed from a string: as a literal, twelve hundred products are more than the typechecker will hold.
export const CLOTHING_PRODUCTS: readonly ClothingProduct[] = JSON.parse(${JSON.stringify(JSON.stringify(products))});
`;
writeFileSync(OUT, body);
const by = {};
for (const p of products) by[p.market] = (by[p.market] ?? 0) + 1;
console.log('retailers', retailers.length, 'products', products.length, by);
