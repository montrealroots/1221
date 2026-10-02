// Builds src/engine/content/licenses.ts from researched driving-license rules,
// with the visitor rule each authority states set down as data the engine reads.
// Run: node tools/build-licenses.mjs docs/research/world/research-licences.json
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

const j = JSON.parse(readFileSync(process.argv[2], 'utf8'));
/**
 * The visitor's rule, from each authority's words (the research's
 * foreignLicense.visitor): how many days from entry a visitor may drive on a
 * license from elsewhere (null where the authority sets no limit), and in
 * which languages a license needs no International Driving Permit or
 * translation beside it ('any' where none is asked; 'always' where a permit
 * is asked of everybody, as Japan and Korea ask it). EU and EEA licenses are
 * recognized across the EU and EEA whatever their language. `confirmed:
 * false` where the research could not read an official statement, and
 * SLATE then has no rule to let them drive by.
 */
const VISITOR = {
  'us-ny': { days: null, languages: ['en'], confirmed: true },
  'us-ct': { days: 365, languages: ['en', 'es'], confirmed: true },
  'us-ca': { days: null, languages: 'any', confirmed: true },
  gb: { days: 365, languages: 'any', confirmed: true },
  'gb-nir': { days: 365, languages: 'any', confirmed: true },
  'ca-on': { days: 90, languages: 'any', confirmed: true },
  'ca-bc': { days: 180, languages: 'any', confirmed: true },
  ie: { days: 365, languages: 'any', confirmed: true },
  is: { days: null, languages: 'latin', confirmed: true },
  de: { days: null, languages: ['de'], confirmed: true },
  fr: { days: 180, languages: ['fr'], confirmed: true },
  es: { days: null, languages: ['es'], confirmed: true },
  jp: { days: 365, languages: 'always', confirmed: true },
  kr: { days: 365, languages: 'always', confirmed: true },
  'mx-cmx': { days: null, languages: 'any', confirmed: false },
  'au-nsw': { days: 180, languages: ['en'], confirmed: true },
  br: { days: 180, languages: 'always', confirmed: true },
  nz: { days: 548, languages: ['en'], confirmed: true },
  lv: { days: 365, languages: 'latin', confirmed: true },
};
const out = {};
for (const x of j) {
  if (!VISITOR[x.id]) throw new Error('no visitor rule for ' + x.id);
  out[x.id] = {
    // The research file's keys keep its own spelling. A license's name is the
    // authority's: "license" where its English spells it so, "license" elsewhere.
    authority: x.authority, name: /^(gb|ie|ca|au|nz)/.test(x.id) ? x.licenceName : x.licenceName.replace(/licence/g, 'license').replace(/Licence/g, 'License'),
    minAge: { full: x.minAge.full, learner: x.minAge.learner, note: x.minAge.note ?? '' },
    steps: x.steps.map((s) => ({ step: s.step, fee: s.fee, currency: s.currency, note: s.note ?? '' })),
    validityYears: x.validityYears, renewalFee: x.renewalFee, renewalNote: x.renewalNote ?? '',
    graduated: x.graduated, visitor: VISITOR[x.id],
    foreign: { visitor: x.foreignLicence?.visitor ?? null, newResident: x.foreignLicence?.newResident ?? null },
    idp: x.idp ?? null,
    sources: x.sources, uncertain: x.uncertain ?? [],
  };
}
const text = `/**
 * SLATE — how a person gets, keeps and uses a car driving license, by the
 * authority that issues it: each step and its fee, the youngest age, how long
 * a license lasts and what renewing it costs, any graduated or probationary
 * stage, what a visitor or a new resident with a license from elsewhere may
 * do, and who issues the International Driving Permit. Researched 2026-09-29
 * from each authority's own pages where they could be read; each entry lists
 * its sources and what the research could not confirm. Built by
 * \`tools/build-licenses.mjs\`; don't edit by hand.
 *
 * Nineteen jurisdictions. A license is issued by a state or province in the
 * United States, Canada and Australia, and by the country elsewhere; a place
 * outside them has no rule here, and \`systems/documents.ts\` says so rather
 * than assume one.
 */

export interface LicenseStep { step: string; fee: number | null; currency: string; note: string }

export interface VisitorRule {
  /** Days from entry a visitor may drive on a license from elsewhere; null where the authority sets none. */
  days: number | null;
  /** Languages a license needs no permit or translation in; 'any', 'latin' letters, or 'always' a permit. */
  languages: readonly string[] | 'any' | 'latin' | 'always';
  confirmed: boolean;
}

export interface LicenseRule {
  authority: string;
  name: string;
  minAge: { full: number; learner: number; note: string };
  steps: LicenseStep[];
  validityYears: number | null;
  renewalFee: number | null;
  renewalNote: string;
  graduated: unknown;
  visitor: VisitorRule;
  foreign: { visitor: string | null; newResident: string | null };
  idp: { issuer: string; fee: number | null; currency: string; validity: string | null; convention: string | null; note?: string } | null;
  sources: { url: string; statedDate: string | null }[];
  uncertain: string[];
}

export const LICENSES: Readonly<Record<string, LicenseRule>> = ${JSON.stringify(out, null, 2)};
`;
writeFileSync('src/engine/content/licenses.ts', text);
// The research quotes authorities, who don't contract; the game's voice does (tools/voice-check.mjs).
execSync('node tools/voice-check.mjs --fix src/engine/content/licenses.ts', { stdio: 'ignore' });
// And in American spelling, as the game is, but for an authority's own names (tools/spelling.mjs).
execSync('node tools/spelling.mjs --write', { stdio: 'ignore' });
console.log('wrote', Object.keys(out).length);
