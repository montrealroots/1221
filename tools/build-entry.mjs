// Builds src/engine/content/entry.ts from a researched JSON of short-stay
// entry rules (destinations x citizenships), keeping each rule's source and
// the research's own uncertainties. Run: node tools/build-entry.mjs docs/research/world/research-entry.json
import { readFileSync, writeFileSync } from 'node:fs';
import { execSync } from 'node:child_process';

/**
 * A note without the "visa-exempt" it opens on: the status already says it, and eighty-odd notes opening on one word read
 * as a form. Until 2026-10-17 (brief 14) the word wasn't held to a word's end, so "Visa exemption for short-term stay"
 * lost "Visa exempt" and showed as "Ion for short-term stay"; and the research's "Own nationals." is said to the player,
 * who is one.
 */
const noteOf = (note) => {
  const rest = String(note ?? '').replace(/^visa[- ](?:exempt|free)\b[;,.:]?\s*/i, '');
  if (rest === 'Own nationals.') return 'You’re one of its citizens.';
  return rest ? rest[0].toUpperCase() + rest.slice(1) : 'No visa.';
};
const j = JSON.parse(readFileSync(process.argv[2], 'utf8'));
// The destination's passport validity rule, structured from the research's words (see its passportRule text).
const PASSPORT = {
  US: { beyondDays: 0, confirmed: true }, GB: { beyondDays: 0, confirmed: true }, CA: { beyondDays: 0, confirmed: true },
  IE: { beyondDays: 0, confirmed: false }, JP: { beyondDays: 0, confirmed: true }, KR: { beyondDays: 0, confirmed: false },
  MX: { beyondDays: 0, confirmed: true }, AU: { beyondDays: 0, confirmed: true }, BR: { beyondDays: 0, confirmed: false },
  NZ: { beyondDays: 90, confirmed: true },
  IS: { beyondDays: 90, issuedWithinYears: 10, confirmed: true }, DE: { beyondDays: 90, issuedWithinYears: 10, confirmed: true },
  FR: { beyondDays: 90, issuedWithinYears: 10, confirmed: true }, ES: { beyondDays: 90, issuedWithinYears: 10, confirmed: true },
  LV: { beyondDays: 90, issuedWithinYears: 10, confirmed: true },
};
// Each authorization, keyed so a citizen's rule can name it; ETIAS isn't live, and the rule for every Schengen visitor is visa-free.
const keyOf = (dest, name) => {
  if (/ESTA/.test(name)) return 'ESTA';
  if (/eTA/.test(name) && dest === 'CA') return 'eTA';
  if (/NZeTA/.test(name)) return 'NZeTA';
  if (/K-ETA/.test(name)) return 'K-ETA';
  if (/eVisitor/.test(name)) return 'eVisitor';
  if (/e-Visa/.test(name)) return 'e-Visa';
  if (/ETIAS/.test(name)) return 'ETIAS';
  if (/ETA/.test(name)) return 'ETA';
  return name;
};
const out = {};
for (const [dest, d] of Object.entries(j.destinations)) {
  const auths = {};
  for (const a of d.authorizations) {
    const key = keyOf(dest, a.name);
    auths[key] = { name: a.name.replace(/, NOT YET LIVE/, ''), fee: a.fee, currency: a.currency, validityYears: a.validityYears, live: !/NOT YET LIVE/.test(a.name), processing: a.processingNote, source: a.source, statedDate: a.statedDate };
  }
  const citizens = {};
  for (const [iso, c] of Object.entries(d.citizens)) {
    let authorization = null;
    if (c.status === 'authorization') {
      const want = c.authorization ?? '';
      authorization = Object.keys(auths).find((k) => want.includes(k)) ?? (Object.keys(auths).length === 1 ? Object.keys(auths)[0] : null);
      if (/eVisitor/.test(want) && auths.eVisitor) authorization = 'eVisitor';
      if (!authorization) throw new Error(`${dest} ${iso}: no authorization for "${want}"`);
    }
    citizens[iso] = { status: c.status, ...(authorization ? { authorization } : {}), ...(c.status === 'visa' ? { visa: c.authorization } : {}), maxDays: c.maxDays, windowDays: c.windowDays, note: noteOf(c.note), source: c.source };
  }
  out[dest] = { authority: d.authority, passport: { ...PASSPORT[dest], rule: d.passportRule }, authorizations: auths, citizens };
}
const text = `/**
 * SLATE — who may come in, for a short stay (tourism and business visits, not
 * work), by destination and by citizenship: visa-free and for how long, a
 * travel authorization and which, a visa, free movement, or the country's
 * own citizens; each destination's passport validity rule; and each
 * authorization's fee, validity and processing. Researched ${j.asOf} from each
 * government's own pages where they could be read, and every rule carries its
 * source. What the research could not confirm is in \`ENTRY_UNCERTAIN\`, and a
 * passport rule not confirmed says so (\`confirmed: false\`), SLATE then asking
 * only validity for the stay. Built by \`tools/build-entry.mjs\`; don't edit by
 * hand.
 *
 * Fifteen destinations and fifteen citizenships: the countries SLATE's lives
 * begin in and bank in. A pair outside them is a rule SLATE doesn't have, and
 * \`systems/documents.ts\` says so rather than assume one.
 */

export type EntryStatus = 'citizen' | 'free-movement' | 'free' | 'authorization' | 'visa';

export interface EntryRule {
  status: EntryStatus;
  /** The authorization this citizenship needs, a key of the destination's \`authorizations\`. */
  authorization?: string;
  /** The visa this citizenship needs, by the destination's name for it. */
  visa?: string;
  maxDays: number | null;
  windowDays: number | null;
  note: string;
  source: string;
}

export interface Authorization {
  name: string;
  fee: number;
  currency: string;
  validityYears: number;
  /** Whether it's in force: the EU's ETIAS is researched and not yet live. */
  live: boolean;
  processing: string;
  source: string;
  statedDate: string;
}

export interface Destination {
  authority: string;
  passport: { beyondDays: number; issuedWithinYears?: number; confirmed: boolean; rule: string };
  authorizations: Record<string, Authorization>;
  citizens: Record<string, EntryRule>;
}

export const ENTRY: Readonly<Record<string, Destination>> = ${JSON.stringify(out, null, 2)};

/** What the research could not confirm, in its own words. */
export const ENTRY_UNCERTAIN: readonly string[] = ${JSON.stringify(j.uncertain, null, 2)};

export const ENTRY_AS_OF = '${j.asOf}';
`;
writeFileSync('src/engine/content/entry.ts', text);
// The research quotes authorities, who don't contract; the game's voice does (tools/voice-check.mjs).
execSync('node tools/voice-check.mjs --fix src/engine/content/entry.ts', { stdio: 'ignore' });
// And in American spelling, as the game is, but for an authority's own names (tools/spelling.mjs).
execSync('node tools/spelling.mjs --write', { stdio: 'ignore' });
console.log('wrote', Object.keys(out).length, 'destinations');
