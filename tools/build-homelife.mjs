/**
 * Builds src/engine/content/homelife.ts from
 * docs/research/world/research-homelife.json: each market's streaming and
 * music services and their tiers at their own pricing pages' monthly prices,
 * Britain's and Ireland's TV licenses with what each is needed for, consoles
 * at their makers' stores, and the game services' monthly tiers, as read on
 * 2026-10-02. A row the research couldn't price is left out. Markets are
 * SLATE's country ids (the research's GB is SLATE's uk). Run:
 * node tools/build-homelife.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const r = JSON.parse(readFileSync('docs/research/world/research-homelife.json', 'utf8'));
const market = (m) => (m === 'GB' ? 'uk' : String(m).toLowerCase());
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

const services = r.streaming.filter((s) => typeof s.monthly === 'number').map((s) => ({
  id: slug(`${s.market}-${s.service}-${s.tier}`), market: market(s.market), service: s.service, tier: s.tier, ads: s.ads === true,
  monthly: s.monthly, currency: s.currency, taxIncluded: s.taxIncluded === true, music: /spotify|apple music/i.test(s.service), source: s.source,
}));
const games = r.gameSubscriptions.filter((g) => g.term === '1 month' && typeof g.price === 'number').map((g) => ({
  id: slug(`${g.market}-${g.service}-${g.tier}`), market: market(g.market), service: g.service, tier: g.tier, monthly: g.price, currency: g.currency, taxIncluded: g.taxIncluded === true, source: g.source,
}));
const consoles = r.consoles.filter((c) => typeof c.price === 'number').map((c) => ({
  id: slug(`${c.market}-${c.maker}-${c.model}-${c.edition ?? ''}`), market: market(c.market), maker: c.maker, model: c.model, edition: c.edition ?? null, price: c.price, currency: c.currency, taxIncluded: c.taxIncluded === true, source: c.source,
}));
const licences = r.tvLicence.map((l) => ({ market: market(l.market), name: l.name, annual: l.annualFee, currency: l.currency, source: l.source ?? null }));

const seen = new Set();
const once = (xs) => xs.filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)));
const head = readFileSync('src/engine/content/homelife.ts', 'utf8').split('// --- generated below ---')[0];
writeFileSync('src/engine/content/homelife.ts', `${head}// --- generated below ---
export const SERVICES: readonly Service[] = JSON.parse(${JSON.stringify(JSON.stringify(once(services)))});

export const GAME_SERVICES: readonly GameService[] = JSON.parse(${JSON.stringify(JSON.stringify(once(games)))});

export const CONSOLES: readonly Console[] = JSON.parse(${JSON.stringify(JSON.stringify(once(consoles)))});

export const TV_LICENSES: readonly TvLicense[] = JSON.parse(${JSON.stringify(JSON.stringify(licences))});
`);
console.log(`Wrote ${seen.size - licences.length >= 0 ? services.length : 0} services, ${games.length} game tiers, ${consoles.length} consoles and ${licences.length} licenses.`);
