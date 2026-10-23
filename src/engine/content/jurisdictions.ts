/**
 * SLATE — where screen work abroad is permitted, country by country, and how far the game has researched each (from
 * 2026-10-23, the owner's brief 25, Part 9: "Use extensible country and regional packages sharing one geography and
 * travel system", "Maintain a country coverage matrix", "Do not silently apply US rules worldwide";
 * `docs/verification/career-world-2026-10-23/criteria.md`, W1 and W2).
 *
 * Each country is in one of three states, and the state decides what the game lets through:
 * - **verified**: a route to permission for the activity, its conditions read from the government's own page on a
 *   recorded date, each with its words. The game applies it.
 * - **partial**: sources located (the dossier's register, S01 to S110), rules not extracted. Planning is possible; a
 *   binding acceptance isn't, since the game can't say what permission the work needs.
 * - **unsupported**: nothing researched. Missing rules are never permission: a role there can't be accepted, and the
 *   refusal says why.
 *
 * The United States is the package brief 19 built (`systems/permission.ts`, `usWorkAuthorized`: citizenship, a green
 * card, OPT), not a route here: work in the US reads it as before. Every source id is the dossier's
 * (`docs/verification/career-world-2026-10-23/sources.json`), or a source this build found beyond it (`N01` on), kept
 * there the same way.
 */

/** A source as the game cites it: the register's id, where it is, the day this build read it, and the page's own date. */
export interface SourceRef {
  id: string;
  url: string;
  /** `YYYY-MM-DD`, the day the game's figures were read from it. */
  read: string;
  /** The page's own "last updated", where it gives one. */
  updated?: string;
}

/** One condition of a route, in its own words where it's verified, or the game's where it's an assumption. */
export interface RouteCondition {
  id: string;
  words: string;
  basis: 'verified' | 'assumption';
  /** Verified: the source's sentence. */
  quote?: string;
}

/** A route to permission for screen work in a country. */
export interface WorkRoute {
  id: 'au-408-entertainment' | 'au-444-special-category';
  country: string;
  /** What the department calls it. */
  name: string;
  /** The short name a screen uses. */
  short: string;
  /** Who it's for: anyone without the country's citizenship, or the citizens of one country. */
  for: { kind: 'non-citizens' } | { kind: 'citizens-of'; iso: string; passport: true };
  /** Applied for ahead with the production's support, or granted at the border on arrival. */
  how: 'apply-ahead' | 'on-arrival';
  source: SourceRef;
  conditions: readonly RouteCondition[];
  /** Applied ahead: the days to a decision, the game's assumption, since the department gives none in the page. */
  decisionDays?: number;
  /** Applied ahead: how long past the last work day the grant runs, the game's assumption from the page's 28-day rule. */
  graceDays?: number;
  /** The charge where the page gives it; absent here, since it's loaded by the department's estimator and not in the page. */
  charge?: never;
}

export type Research = 'verified' | 'partial' | 'unsupported';

export interface Jurisdiction {
  /** The gazetteer's country id (`content/geography.ts`). */
  country: string;
  iso: string;
  name: string;
  research: Research;
  routes: readonly WorkRoute[];
  /** The dossier's sources located for it. */
  sources: readonly string[];
  /** What isn't in the game yet, each a phrase a sentence lists after "Not in the game yet:". */
  gaps: readonly string[];
}

const S01: SourceRef = { id: 'S01', url: 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/temporary-activity-408/entertainment-activities', read: '2026-10-23', updated: '2026-09-24' };
const N02: SourceRef = { id: 'N02', url: 'https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/special-category-visa-subclass-444', read: '2026-10-23', updated: '2026-09-08' };

/** The 408's conditions, S01's words as read on 2026-10-23, and the game's assumptions where the page is silent. */
const AU_408: WorkRoute = {
  id: 'au-408-entertainment', country: 'au',
  name: 'Temporary Activity visa (subclass 408), Entertainment Activities stream',
  short: '408 visa',
  for: { kind: 'non-citizens' }, how: 'apply-ahead', source: S01,
  conditions: [
    { id: 'category', basis: 'verified', words: 'It’s for performing in a film or television production in Australia.', quote: 'performing in a film or television production not subsidised by government' },
    { id: 'contract', basis: 'verified', words: 'You need a contract for the work first.', quote: 'You must have a contract for your performance or work in Australia.' },
    { id: 'supporter', basis: 'verified', words: 'Applying from outside Australia for less than three months, you need a supporter: here, the production.', quote: 'You must have a supporter to apply for this visa.' },
    { id: 'union-arts', basis: 'verified', words: 'Before engaging you, the production consults the actors’ union and gets an Arts certificate.', quote: 'Your sponsor or supporter must consult with the relevant union or unions before engaging you. They must also obtain an Arts certificate from the Department of Communications and the Arts.' },
    { id: 'itinerary', basis: 'verified', words: 'Once applied for, the work’s times and places can change only with the department’s permission.', quote: 'If you need to do so, you must ask the Secretary of the Department of Home Affairs for permission before you make any changes.' },
    { id: 'stops', basis: 'verified', words: 'If the production stops the work, you leave within 28 days or apply for a new visa.', quote: 'leave Australia within 28 days of stopping work for your sponsor/supporter, or earlier if your visa is expiring' },
    { id: 'passport', basis: 'verified', words: 'It’s linked to your passport digitally, with no label in it.', quote: 'We will digitally link your visa to your passport.' },
    // ASSUMPTION: the page says "You must have enough money during your stay in Australia to support yourself" and sets
    // no figure; the production's support and its paying for the hotel are taken to meet it.
    { id: 'funds', basis: 'assumption', words: 'You need enough money to support yourself, with no figure set. The game takes the production’s support and the hotel it pays for as meeting it.' },
    // ASSUMPTION: the page sends the reader to the department's processing time tool; no time is in the page.
    { id: 'decision', basis: 'assumption', words: 'A decision comes ten days after you apply, as the game assumes: the department points to a processing time tool instead of giving one.' },
    { id: 'charge', basis: 'assumption', words: 'Its charge comes from the department’s price estimator and isn’t in the page, so the game doesn’t charge one.' },
  ],
  decisionDays: 10,
  // ASSUMPTION: granted to 28 days past the last work day, the page's 28 days after work stops.
  graceDays: 28,
};

const AU_444: WorkRoute = {
  id: 'au-444-special-category', country: 'au',
  name: 'Special Category visa (subclass 444)',
  short: 'Special Category visa',
  for: { kind: 'citizens-of', iso: 'NZ', passport: true }, how: 'on-arrival', source: N02,
  conditions: [
    { id: 'work', basis: 'verified', words: 'A New Zealand citizen may visit, work and study in Australia.', quote: 'visit, work and study in Australia' },
    { id: 'passport', basis: 'verified', words: 'It’s granted on arrival to a holder of a valid New Zealand passport.', quote: 'You must have a valid New Zealand passport to be granted this visa.' },
  ],
};

const partial = (country: string, iso: string, name: string, sources: string[], gaps: string[]): Jurisdiction => ({ country, iso, name, research: 'partial', routes: [], sources, gaps });

/** The countries the brief names (Part 9), each in its state; every other country is unsupported (`jurisdictionOf`). */
export const JURISDICTIONS: Readonly<Record<string, Jurisdiction>> = {
  au: {
    country: 'au', iso: 'AU', name: 'Australia', research: 'verified', routes: [AU_408, AU_444],
    sources: ['S01', 'S13', 'S25', 'S26', 'S28', 'N02'],
    gaps: [
      // The tax office's pages (S28) refused this build's reading three ways on 2026-10-23 (CHECKPOINT.md, Blockers Met).
      'Australian tax on pay for work there',
      // S13, located and not read.
      'the agreements of MEAA, the Australian actors’ union, that a production there would use',
      'permanent residence and the other visas that let you work in Australia',
    ],
  },
  uk: partial('uk', 'GB', 'United Kingdom', ['S02', 'S104', 'S17', 'S18', 'S19', 'S29'], ['the Creative Worker visa’s conditions for sponsorship and money', 'the agreements of Pact and Equity, and the tax on visiting entertainers']),
  nz: partial('nz', 'NZ', 'New Zealand', ['S03', 'S04'], ['the Entertainers Work Visa’s conditions, and what the employer has to do for it']),
  // ACTRA's IPA doesn't cover British Columbia, which has its own agreement (S15, S16, as the dossier has them).
  ca: partial('ca', 'CA', 'Canada', ['S07', 'S105', 'S15', 'S16'], ['which work permit a film actor needs', 'ACTRA’s agreements, and British Columbia’s own']),
  fr: partial('fr', 'FR', 'France', ['S08', 'S09'], ['the talent and salaried work permits, and what they leave out for film and television']),
  jp: partial('jp', 'JP', 'Japan', ['S10'], ['the Entertainer visa’s requirements and documents']),
  in: partial('in', 'IN', 'India', ['S11', 'S12'], ['the film visa, which follows permission to shoot, and the rules for documentary filming']),
};

/** A country's state: its entry, or unsupported. The US's work reads `usWorkAuthorized` and isn't here. */
export function jurisdictionOf(country: string, name = country.toUpperCase()): Jurisdiction {
  return JURISDICTIONS[country] ?? { country, iso: country.toUpperCase(), name, research: 'unsupported', routes: [], sources: [], gaps: ['any of the rules for working there'] };
}

/** The gaps in a sentence: "Not in the game yet: a; b; and c." */
export function gapWords(j: Pick<Jurisdiction, 'gaps'>): string {
  const g = j.gaps;
  const listed = g.length < 3 ? g.join(' and ') : `${g.slice(0, -1).join('; ')}; and ${g[g.length - 1]}`;
  return listed ? `Not in the game yet: ${listed}.` : '';
}
