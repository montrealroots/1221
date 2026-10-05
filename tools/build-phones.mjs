/**
 * Builds src/engine/content/phones.ts from
 * docs/research/world/research-phones.json: the iPhones, Galaxys and Pixels
 * on their makers' own stores in the five markets on 2026-10-02, unlocked,
 * with every storage tier and color; the makers' 0% installment plans; each
 * SLATE carrier's activation, SIM and eSIM charges; the makers' published
 * trade-in values ("up to", Apple's only figure); out-of-warranty screen and
 * battery prices; and the makers' protection plans. Mexico's Pixel prices
 * are launch prices from the press, Google's Mexican store having none, and
 * say so. Run: node tools/build-phones.mjs
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

// Names one plain space apart: the sources mix in non-breaking spaces, which never match a plain one.
const r = JSON.parse(readFileSync('docs/research/world/research-phones.json', 'utf8').replaceAll(String.fromCharCode(160), ' '));
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

// And from 2026-10-05 the other makers' phones, a tranche a file (docs/research/catalog/phones-*.json), in the same shape.
const TRANCHES = existsSync('docs/research/catalog') ? readdirSync('docs/research/catalog').filter((f) => /^phones-.*.json$/.test(f)).sort().flatMap((f) => JSON.parse(readFileSync(`docs/research/catalog/${f}`, 'utf8').replaceAll(String.fromCharCode(160), ' ')).devices ?? []) : [];
const phones = [...r.devices, ...TRANCHES].filter((d) => typeof d.price === 'number' && d.price > 0 && d.maker && d.model && typeof d.storageGB === 'number').map((d) => ({
  id: slug(`${d.market}-${d.maker}-${d.model}-${d.storageGB}`), market: d.market, maker: d.maker, model: d.model, storageGB: d.storageGB,
  colors: d.colors ?? [], price: d.price, currency: d.currency, taxIncluded: d.taxIncluded === true, released: d.releaseDate ?? null,
  press: /press|newspaper|launch/i.test(d.priceBasis ?? '') && d.maker === 'Google' && d.market === 'mx', source: d.source,
}));
// The same id twice (a sale price listed beside the list price) keeps the first, the list price.
const seen = new Set();
const uniq = phones.filter((p) => (seen.has(p.id) ? false : (seen.add(p.id), true)));

// True 0% plans only; a deferred-interest plan charges it all back if a month is missed, so it isn't one.
const financing = r.makerFinancing.filter((f) => f.apr === 0 && !/deferred/i.test(`${f.name ?? ''} ${f.plan ?? ''}`)).map((f) => ({
  market: f.market, maker: f.maker, name: f.name ?? f.plan ?? `${f.maker} financing`,
  months: typeof f.months === 'number' ? [f.months] : Array.isArray(f.months) ? f.months.filter((m) => typeof m === 'number') : [...new Set(Object.values(f.months ?? {}).filter((m) => typeof m === 'number'))],
  byModel: f.months && typeof f.months === 'object' && !Array.isArray(f.months) ? Object.fromEntries(Object.entries(f.months).flatMap(([models, m]) => models.split(', ').map((x) => [x, m]))) : null, prepaidExcluded: /prepaid/i.test(f.eligibility ?? '') && /not allowed|excluded|not eligible|isn.t eligible|no prepaid/i.test(f.eligibility ?? ''), source: f.source,
}));
const activation = r.activation.map((a) => ({
  market: a.market, carrier: a.carrier, activationFee: typeof a.activationFee === 'number' ? a.activationFee : null,
  simKit: typeof a.simKitPrice === 'number' ? a.simKitPrice : null, esim: typeof a.esimPrice === 'number' ? a.esimPrice : null, currency: a.currency ?? null, source: a.source,
}));
const tradeIn = r.tradeIn.filter((t) => typeof t.upTo === 'number').map((t) => ({ market: t.market, maker: t.maker, model: t.model, upTo: t.upTo, currency: t.currency, source: t.source }));
const repair = r.repair.filter((x) => x.outOfWarranty !== false && x.model && (typeof x.screen === 'number' || typeof x.battery === 'number')).map((x) => ({
  market: x.market, maker: x.maker, model: x.model, screen: x.screen ?? null, battery: x.battery ?? null, currency: x.currency, taxIncluded: x.taxIncluded ?? null, source: x.source,
}));
const protection = r.protection.filter((p) => typeof p.monthly === 'number').map((p) => ({
  market: p.market, maker: p.maker, plan: p.plan, models: p.models ?? [], monthly: p.monthly, currency: p.currency, theftAndLoss: p.theftAndLoss === true,
  batteryFee: p.serviceFees?.['Battery service'] ?? null, screenFee: p.serviceFees?.['Screen damage'] ?? null, source: p.source,
}));

const head = readFileSync('src/engine/content/phones.ts', 'utf8').split('// --- generated below ---')[0];
writeFileSync('src/engine/content/phones.ts', `${head}// --- generated below ---
export const PHONES: readonly Phone[] = JSON.parse(${JSON.stringify(JSON.stringify(uniq))});

export const PHONE_FINANCING: readonly PhoneFinancing[] = JSON.parse(${JSON.stringify(JSON.stringify(financing))});

export const ACTIVATION: readonly Activation[] = JSON.parse(${JSON.stringify(JSON.stringify(activation))});

export const TRADE_IN: readonly TradeIn[] = JSON.parse(${JSON.stringify(JSON.stringify(tradeIn))});

export const PHONE_REPAIR: readonly PhoneRepair[] = JSON.parse(${JSON.stringify(JSON.stringify(repair))});

export const PHONE_PROTECTION: readonly PhoneProtection[] = JSON.parse(${JSON.stringify(JSON.stringify(protection))});
`);
console.log(`Wrote ${uniq.length} phones, ${financing.length} 0% plans, ${activation.length} activations, ${tradeIn.length} trade-ins, ${repair.length} repair rows, ${protection.length} protection plans.`);
