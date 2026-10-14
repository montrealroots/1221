/**
 * Builds what SLATE keeps of the research on a bank account kept at home (from 2026-10-16):
 * src/engine/content/home-accounts.json, from docs/research/banking/home-accounts.json, typed by
 * src/engine/content/homeaccounts.ts. Kept as JSON, so it is the research quoted, not the game's prose rewritten, and the
 * house-voice tools don't rewrite it.
 *
 * Only what the eligibility rule and the creation screen read was copied when this was written: each bank's retention
 * (kept, its conditions, its non-resident fee, its notice, its policy on US persons), its assumptions and its sources,
 * and the research's assumptions for the countries it didn't read bank by bank. The card, transfer, identification and
 * tax fields stayed in the research; the modules that read them add them here.
 *
 * Run: node tools/build-home-accounts.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';

const research = JSON.parse(readFileSync('docs/research/banking/home-accounts.json', 'utf8'));

const banks = Object.fromEntries(Object.entries(research.banks).map(([id, b]) => [id, {
  kept: b.retention.kept,
  conditions: b.retention.conditions,
  nonResidentFee: b.retention.nonResidentFee,
  closesWithNoticeDays: b.retention.closesWithNoticeDays,
  usResidentPolicy: b.retention.usResidentPolicy,
  assumptions: b.assumptions,
  sources: b.sources.map((s) => ({ title: s.title, url: s.url, read: s.read, official: s.official })),
}]));

const data = { read: research.read, banks, world: { assumptions: research.world.assumptions } };
writeFileSync('src/engine/content/home-accounts.json', JSON.stringify(data, null, 1) + '\n');
console.log('wrote home-accounts.json (' + Object.keys(banks).length + ' banks)');
