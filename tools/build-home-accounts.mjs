/**
 * Builds what SLATE keeps of the research on a bank account kept at home (from 2026-10-16):
 * src/engine/content/home-accounts.json, from docs/research/banking/home-accounts.json, typed by
 * src/engine/content/homeaccounts.ts. Kept as JSON, so it is the research quoted, not the game's prose rewritten, and the
 * house-voice tools don't rewrite it.
 *
 * Only what the eligibility rule and the creation screen read was copied when this was first written: each bank's
 * retention (kept, its conditions, its non-resident fee, its notice, its policy on US persons), its assumptions and its
 * sources, and the research's assumptions for the countries it didn't read bank by bank. The card, transfer,
 * identification and tax fields stayed in the research until modules 4 and 5 of 2026-10-16 read them: each bank's
 * `abroad` (its card and cash machine fees abroad, its payments abroad, what it says of opening for a customer abroad,
 * its identification and its tax at source), each country's tax at source on a non-resident (`countries`), and what
 * America's own rules say of a student's account abroad (`us`) are copied now. The figures SLATE acts on are read from
 * these words by hand in `homeaccounts.ts`, as the retention's were.
 *
 * Run: node tools/build-home-accounts.mjs
 */

import { readFileSync, writeFileSync } from 'node:fs';

const research = JSON.parse(readFileSync('docs/research/banking/home-accounts.json', 'utf8'));

const sourcesOf = (list) => list.map((s) => ({ title: s.title, url: s.url, read: s.read, official: s.official }));

const banks = Object.fromEntries(Object.entries(research.banks).map(([id, b]) => [id, {
  kept: b.retention.kept,
  conditions: b.retention.conditions,
  nonResidentFee: b.retention.nonResidentFee,
  closesWithNoticeDays: b.retention.closesWithNoticeDays,
  usResidentPolicy: b.retention.usResidentPolicy,
  abroad: {
    card: b.access.cardAbroadFee,
    atm: b.access.atmAbroadFee,
    outgoing: b.transfers.outgoingFee,
    incoming: b.transfers.incomingFee,
    fxMargin: b.transfers.fxMargin,
    days: b.transfers.days,
    opening: b.openingFromAbroad,
    kyc: b.kyc,
    taxAtSource: b.taxOnInterest.nonResidentWithholding,
  },
  assumptions: b.assumptions,
  sources: sourcesOf(b.sources),
}]));

const countries = Object.fromEntries(Object.entries(research.countries).map(([iso, c]) => [iso, {
  nonResidentWithholding: c.nonResidentWithholding,
  sources: sourcesOf(c.sources),
}]));
const { sources: usSources, ...usWords } = research.us;
const us = { ...usWords, sources: sourcesOf(usSources) };

const data = { read: research.read, banks, countries, us, world: { assumptions: research.world.assumptions } };
writeFileSync('src/engine/content/home-accounts.json', JSON.stringify(data, null, 1) + '\n');
console.log('wrote home-accounts.json (' + Object.keys(banks).length + ' banks, ' + Object.keys(countries).length + ' countries)');
