/**
 * Builds src/engine/content/phoneclaims.ts from
 * docs/research/world/research-tv-phones.json: AppleCare+'s per-incident
 * fees in each market (Apple's Fees and Deductibles pages), Apple's
 * out-of-warranty price for damage other than the screen, by model (the data
 * Apple's support page loads), and how often a phone is damaged or stolen
 * where a survey says: America's from Allstate Protection Plans' 2023
 * surveys (31% damaged a smartphone in the past year, 67% of it screens, 5%
 * had one stolen, that last period not stated outright), and England and
 * Wales's from the ONS crime survey (0.54% of phone owners had one stolen in
 * the year to March 2025). Run: node tools/build-phone-claims.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const r = JSON.parse(readFileSync('docs/research/world/research-tv-phones.json', 'utf8')).phones;

const deductibles = r.applecare.deductibles.map((d) => ({
  market: d.market, currency: d.currency, screen: d.screenAndBackGlass ?? null, other: d.otherAccidentalDamage ?? null, theft: d.theftOrLoss ?? null, source: d.source?.url ?? null,
}));
const other = r.outOfWarrantyRepair.apple.filter((x) => typeof x.otherDamage === 'number').map((x) => ({
  market: x.market, maker: 'Apple', model: x.model, other: x.otherDamage, currency: x.currency, source: x.source?.url ?? null,
}));
const rate = (market, metric) => r.breakageAndTheftRates.find((x) => x.market === market && x.metric.startsWith(metric));
const us = rate('us', 'Share of U.S. smartphone owners who damaged');
const uk = rate('uk', 'Proportion of individual mobile phone owners experiencing theft');
const risk = [
  { market: 'us', damagedYear: us.value / 100, screenShare: 0.67, stolenYear: 0.05, stolenConfirmed: false, source: us.source.url },
  { market: 'uk', damagedYear: null, screenShare: null, stolenYear: uk.value / 100, stolenConfirmed: true, source: uk.source?.url ?? null },
];
const head = readFileSync('src/engine/content/phoneclaims.ts', 'utf8').split('// --- generated below ---')[0];
writeFileSync('src/engine/content/phoneclaims.ts', `${head}// --- generated below ---
export const APPLECARE_FEES: readonly AppleCareFees[] = JSON.parse(${JSON.stringify(JSON.stringify(deductibles))});

export const OTHER_DAMAGE: readonly OtherDamage[] = JSON.parse(${JSON.stringify(JSON.stringify(other))});

export const PHONE_RISK: readonly PhoneRisk[] = JSON.parse(${JSON.stringify(JSON.stringify(risk))});
`);
console.log(`Wrote ${deductibles.length} markets' fees, ${other.length} repair prices and ${risk.length} rates.`);
