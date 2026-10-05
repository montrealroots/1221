/**
 * Builds src/engine/content/phones.ts from
 * docs/research/world/research-phones.json: the iPhones, Galaxys and Pixels
 * on their makers' own stores in the five markets on 2026-10-02, unlocked,
 * with every storage tier and color; the makers' 0% installment plans; each
 * SLATE carrier's activation, SIM and eSIM charges; the makers' published
 * trade-in values ("up to", Apple's only figure); out-of-warranty screen and
 * battery prices; and the makers' protection plans. Mexico's Pixel prices
 * are launch prices from the press, Google's Mexican store having none, and
 * say so. From 2026-10-05 it reads research-phones2.json beside it: the other
 * makers' phones on their own stores. Run: node tools/build-phones.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

// Names one plain space apart: the sources mix in non-breaking spaces, which never match a plain one.
const read = (f) => JSON.parse(readFileSync(f, 'utf8').replaceAll(String.fromCharCode(160), ' '));
const r = read('docs/research/world/research-phones.json');
// From 2026-10-05, the other makers' own stores (`research-phones2.json`): their phones only, no plans, trade-ins,
// repairs or cover read for them, so those say the maker publishes none.
const more = read('docs/research/world/research-phones2.json');
// A "+" is a model of its own, read as "plus" (from 2026-10-05): until then the Galaxy S26+ and the S26 took one id,
// the first read kept and the other dropped, so Mexico sold only the S26+ and Ireland only the S26.
const slug = (s) => String(s).toLowerCase().replace(/\+/g, ' plus ').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const phones = [...r.devices, ...more.devices].filter((d) => typeof d.price === 'number').map((d) => ({
  id: slug(`${d.market}-${d.maker}-${d.model}${d.storageGB === null ? '' : `-${d.storageGB}`}`), market: d.market, maker: d.maker, model: d.model, storageGB: d.storageGB,
  colors: d.colors ?? [], price: d.price, currency: d.currency, taxIncluded: d.taxIncluded === true, released: d.releaseDate ?? null,
  press: /press|newspaper|launch/i.test(d.priceBasis ?? '') && d.maker === 'Google' && d.market === 'mx', source: d.source,
}));
// One phone read twice is one phone at its list price, the higher, in every color either read names: Samsung prices a
// color on sale apart (Canada's Galaxy S26 at $1,249.99 in Silver Shadow, $1,399.99 in Pink Gold). Until 2026-10-05
// the first read was kept, which there and in Mexico was the sale; and the Galaxy S26+ and S26 shared an id until "+"
// was read, so one of the two was dropped in every market.
const byId = new Map();
for (const p of phones) {
  const was = byId.get(p.id);
  if (!was) { byId.set(p.id, p); continue; }
  byId.set(p.id, { ...(p.price > was.price ? p : was), colors: [...new Set([...was.colors, ...p.colors])] });
}
const uniq = [...byId.values()];

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
