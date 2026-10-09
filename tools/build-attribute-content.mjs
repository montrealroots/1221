/**
 * Builds the genres' demands from the research (from 2026-10-10): src/engine/content/genre-demands.json, from
 * docs/research/attributes/research-genre-demands.json, typed by src/engine/content/genre-demands.ts. Kept as JSON,
 * so it is the research quoted, not the game's prose rewritten, and the house-voice tools don't rewrite it.
 *
 * Until the owner removed the interests on 2026-10-10 this also generated src/engine/content/engagement.ts from
 * research-interests.json and its review: each interest's definition, what it grew, its kind of rest and when it could
 * be had. That file is hand-kept since, with only the genres' estimates.
 *
 * Run: node tools/build-attribute-content.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';

const json = (p) => JSON.parse(readFileSync(p, 'utf8'));
const confidence = (r) => (['high', 'medium', 'low'].includes(r) ? r : 'low');

const demands = json('docs/research/attributes/research-genre-demands.json').genres;
const data = Object.fromEntries(demands.map((d) => [d.id, { claim: d.claim, source: d.source, sourceSupports: d.sourceSupports, how: d.how, confidence: confidence(d.confidence), tags: (d.tags ?? []).map((t) => ({ tag: t.tag, why: t.why })), uncertainty: d.uncertainty, ...(d.belongsTo ? { belongsTo: d.belongsTo } : {}), ...(d.basis ? { basis: d.basis } : {}) }]));
writeFileSync('src/engine/content/genre-demands.json', JSON.stringify(data, null, 1) + '\n');
console.log('wrote genre-demands.json (' + demands.length + ' genres)');
