// Builds src/engine/content/passports.ts from researched passport rules, with
// each country's expedited service and processing set down as data the
// engine reads. Run: node tools/build-passports.mjs docs/research/world/research-passports.json
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { gameDates } from './research-dates.mjs';

const j = JSON.parse(readFileSync(process.argv[2], 'utf8'));
/**
 * What the engine reads, from each authority's words in the research: the
 * standard days an application takes (the longest the authority states for
 * its routine service, or SLATE's estimate where it states none, said so);
 * the expedited service's cost over the standard fee and its days, where the
 * country sells one; the validity by age where it differs from ten years.
 */
const CURATED = {
  US: { days: 42, expedite: { extra: 60, days: 21 } },
  GB: { days: 21, expedite: { extra: 90, days: 7, note: 'Fast Track, £192 in all' } },
  CA: { days: 28, expedite: { extra: 125.75, days: 1, note: 'Urgent: by the end of the next business day' } },
  IE: { days: 28, expedite: { extra: 170, days: 0, renewalOnly: true, note: 'Same-day renewal at a public office: €95 and a €150 appointment fee' } },
  IS: { days: 6, expedite: { extra: 20200, days: 2, note: 'Express, 39,200 ISK in all' } },
  DE: { days: 56, expedite: { extra: 32, days: 6 }, young: { under: 24, years: 6, fee: 37.5 } },
  FR: { days: 21, estimated: true, expedite: null },
  ES: { days: 0, expedite: null, young: { under: 30, years: 5 } },
  JP: { days: 12, expedite: null },
  KR: { days: 15, expedite: null },
  MX: { days: 0, expedite: null },
  AU: { days: 42, expedite: { extra: 308, days: 3, note: 'Priority processing' } },
  BR: { days: 8, expedite: { extra: 77.17, days: 7 } },
  NZ: { days: 28, expedite: { extra: 247, days: 5, note: 'Urgent service; its fee is from search extracts, not read from the office itself' } },
  LV: { days: 14, expedite: { extra: 25, days: 3, note: 'Two working days, €75 in all' }, young: { under: 20, years: 5, fee: 25 } },
};
/**
 * A fee basis the research wrote as a note, given in sentences as Your Passport shows it (from 2026-10-19, brief 15's
 * coordinator, at the papers area's report): the US basis ended "Two separate payments.", a fragment. The fee itself is
 * the research's, unchanged.
 */
const FEE_BASIS_WORDS = {
  US: 'First-time adult (16+) passport book on Form DS-11: a $130 application fee paid to the Department of State, and a $35 acceptance fee paid separately to the acceptance facility.',
};
const out = {};
for (const x of j) {
  const c = CURATED[x.iso2];
  if (!c) throw new Error('no curated rule for ' + x.iso2);
  out[x.iso2] = {
    // The fee's basis and the note on applying from abroad are shown under Your Passport, so their dates are the game's
    // (from 2026-10-17, brief 14: until then "Fees effective 8 April 2026."); the research keeps its own.
    issuer: x.issuer, name: x.docName, fee: x.fee.amount, currency: x.fee.currency, feeBasis: gameDates(FEE_BASIS_WORDS[x.iso2] ?? x.fee.feeBasis),
    days: c.days, daysEstimated: Boolean(c.estimated), expedite: c.expedite, validityYears: x.validityYears,
    ...(c.young ? { young: c.young } : {}),
    lost: typeof x.lostReplacement === 'string' ? x.lostReplacement : JSON.stringify(x.lostReplacement ?? null),
    abroad: gameDates(x.abroadNote ?? ''), sources: x.sources, uncertain: x.uncertain ?? [],
  };
}
const text = `/**
 * SLATE — a passport, by the country that issues it: its standard adult fee,
 * how long an application takes, an expedited service and what it adds,
 * how long it lasts, and what the office says about a lost one and applying
 * from abroad. Researched 2026-09-29 from each passport office's own pages
 * where they could be read; each entry lists its sources and what the
 * research could not confirm. A processing time the office doesn't publish
 * is SLATE's estimate and says so (\`daysEstimated\`). Built by
 * \`tools/build-passports.mjs\`; don't edit by hand.
 *
 * Fifteen countries: those SLATE's lives begin and bank in. A citizen of
 * another country applies to an office SLATE doesn't have, and
 * \`systems/documents.ts\` says so.
 */

export interface PassportRule {
  issuer: string;
  name: string;
  fee: number;
  currency: string;
  feeBasis: string;
  /** Standard days, at most, from applying to having it. */
  days: number;
  daysEstimated: boolean;
  expedite: { extra: number; days: number; renewalOnly?: boolean; note?: string } | null;
  validityYears: number;
  /** A shorter passport, at its own fee where it has one, for an adult under an age. */
  young?: { under: number; years: number; fee?: number };
  lost: string;
  abroad: string;
  sources: { url: string; statedDate: string | null }[];
  uncertain: string[];
}

export const PASSPORTS: Readonly<Record<string, PassportRule>> = ${JSON.stringify(out, null, 2)};
`;
writeFileSync('src/engine/content/passports.ts', text);
// The research quotes authorities, who don't contract; the game's voice does (tools/voice-check.mjs).
execSync('node tools/voice-check.mjs --fix src/engine/content/passports.ts', { stdio: 'ignore' });
// And in American spelling, as the game is, but for an authority's own names (tools/spelling.mjs).
execSync('node tools/spelling.mjs --write', { stdio: 'ignore' });
console.log('wrote', Object.keys(out).length);
