/**
 * SLATE — what a bank in the country a Yale student lived in before does with their account once they live in America
 * (from 2026-10-16, the owner's decision of that day: an eligible student may keep an account they already held there,
 * beside the American one).
 *
 * The research is `docs/research/banking/home-accounts.json`, read on 2026-10-16, sixty banks in the thirteen countries
 * SLATE banks in by name. What the rule and the creation screen read of it is copied into `content/home-accounts.json`
 * by `tools/build-home-accounts.mjs`, quoted rather than rewritten, and typed here (`HOME_TERMS`). What SLATE took from
 * the words to act on is in `READ` below, each with where it came from:
 *
 * - **Retention.** The research's `kept`: `true` is kept; `false` is closed with the bank's notice (Barclays, the one
 *   such bank); `conditional` is kept on the conditions the research states, as SLATE's assumption, and the screen says
 *   so. Its confidence (`confidence`) is the research's footing: high where the bank says it in its own words, medium
 *   where the bank publishes its price for a customer abroad but no rule on moving, low where it publishes nothing on
 *   moving and the account rests on the absence of a rule ("The 46 conditionals rest on the absence of a published
 *   emigration rule, not on a published permission", the research's summary).
 * - **A bank with no usable terms is refused, never guessed.** A bank the research didn't read has no entry, and the
 *   rule says "SLATE has no research on what <bank> does when a customer moves to America." That is every bank in the
 *   world's ~230 other countries: the research's `world.assumptions` say only that such an account "may" be kept,
 *   converted, restricted or closed, and that its transfer fees weren't researched and "SLATE does not invent a
 *   per-country number". Neither says what happens, so neither was taken as a rule. And a bank the research read whose
 *   own words leave nothing to keep on is refused for its reason (`unusable`).
 * - **Opening age.** Read where the research found one (PTSB 18, Kiwibank 16, BBVA México's Libretón Básico 18).
 *   Elsewhere SLATE assumes 16, said on the screen as SLATE's (`ageAssumed`).
 * - **US persons.** None of the sixty publishes refusing or closing a US person's account (the research's summary), so
 *   every entry keeps one. `addHomeTerms` registers terms a test needs, a bank that refuses one among them.
 *
 * The cards abroad, transfers, identification and tax at source are in the research too, and weren't copied: nothing
 * read them when this was written.
 */

import type { Money } from '../core/money';
import { bankById } from './banks';
import data from './home-accounts.json';

/** One bank's retention, as the research quotes it. */
interface Researched {
  kept: true | false | 'conditional';
  conditions: string;
  nonResidentFee: string | null;
  closesWithNoticeDays: number | null;
  usResidentPolicy: string;
  assumptions: readonly string[];
  sources: readonly { title: string; url: string; read: string; official: boolean }[];
}

export const RESEARCH: { read: string; banks: Readonly<Record<string, Researched>>; world: { assumptions: readonly string[] } } = data as never;

/** A fee the bank charges a customer who lives abroad, in its currency's hundredths, every so many months. */
export interface NonResidentFee {
  amount: Money;
  months: number;
  /** Not charged under this age. */
  ageBelow?: number;
  /** What it is, in the bank's words, and what's uncertain. */
  note: string;
}

export interface HomeTerms {
  bankId: string;
  /** What the bank does once its customer lives in America. */
  nonResident: 'keeps' | 'closes' | 'conditional';
  /** For one that closes: the notice, in days. */
  closeNoticeDays?: number;
  /** A longer notice for an account opened on or after a date, YYYY-MM-DD (Britain's 90 days from 28 April 2026). */
  longerNotice?: { openedFrom: string; days: number };
  /** What it does with the account of a US person: keeps it, closes it, or never opened one. */
  usPersons: 'keeps' | 'closes' | 'refuses';
  /** For one kept on conditions: what SLATE assumes it's kept on, in a sentence. */
  condition?: string;
  nonResidentFee?: NonResidentFee;
  /** The age it opens an account from. */
  openFromAge: number;
  /** The age is SLATE's: the research read none for the bank. */
  ageAssumed: boolean;
  /** How sure the research was that the account is kept (or closed) as said. */
  confidence: 'H' | 'M' | 'L';
  /** Researched, but its words leave nothing SLATE can keep the account on: why. */
  unusable?: string;
  source: string;
  asOf: string;
}

/** What each footing means, said on the screen beside the bank (the bank workspace's CONFIDENCE, for retention). */
export const RETENTION_CONFIDENCE: Readonly<Record<HomeTerms['confidence'], string>> = {
  H: 'The bank says so in its own words.',
  M: 'The bank publishes its price for a customer abroad but no rule on moving: SLATE’s reading of it.',
  L: 'The bank publishes nothing on a customer who moves abroad: SLATE’s assumption.',
};

/** The opening age SLATE takes where the research read none. */
export const ASSUMED_OPENING_AGE = 16;

/** Britain's longer notice: SI 2025/688, 90 days for a payment account opened from 28 April 2026 (the research's `countries.GB`). */
const UK_LONGER = { openedFrom: '2026-04-28', days: 90 } as const;

/** What SLATE took from the research's words, bank by bank, beyond `kept` and the notice. */
const READ: Readonly<Record<string, Partial<Omit<HomeTerms, 'bankId' | 'source' | 'asOf'>>>> = {
  // "SLATE assumes closesWithNoticeDays = 60 (two months) for a Barclays account opened before 28 April 2026".
  'gb-barclays': { longerNotice: UK_LONGER },
  'gb-lloyds': { condition: 'Lloyds keeps it once you’ve told it your American address, though its terms say it “may not be able to keep your account open” for a customer who moves abroad.' },
  'gb-natwest': { condition: 'NatWest keeps it once you’ve registered your American address: it says that “in most cases” nothing changes when a customer moves abroad.' },
  'gb-santander': { condition: 'Santander UK keeps it once you’ve told it you moved (“we can currently service existing products”), though its terms ask that a customer be a UK resident.' },
  'gb-nationwide': { condition: 'Nationwide keeps it once you’ve registered your American address; its guidance on moving abroad is written for Europe and says nothing about America.' },
  'ie-ptsb': { openFromAge: 18, condition: 'PTSB keeps it once you’ve completed its non-resident form and the tax self-certification.' },
  'fr-bnp-paribas': {
    condition: 'BNP Paribas keeps it at its price for a customer living outside France.',
    nonResidentFee: { amount: 15_00, months: 1, note: '€15 a month for a customer living in a country outside the tax-information exchange, which the United States is; whether its free account for under-25s waives it isn’t said, so SLATE charges it' },
  },
  'fr-societe-generale': {
    condition: 'SG keeps it at its quarterly charge for a customer living abroad, which it doesn’t charge under 25.',
    nonResidentFee: { amount: 75_00, months: 3, ageBelow: 25, note: '€75 a quarter for a customer living outside the tax-information exchange, SLATE’s reading of where SG puts the United States; none under 25' },
  },
  'fr-lcl': {
    condition: 'LCL keeps it at its quarterly charge for a customer living outside the European Union, which it doesn’t charge under 26.',
    nonResidentFee: { amount: 40_00, months: 3, ageBelow: 26, note: '€40 a quarter for a customer in the United States with no income paid in, which LCL counts in the tax-information exchange; none under 26' },
  },
  'de-deutsche-bank': { condition: 'Deutsche Bank keeps it, as an AktivKonto at €6.90 a month: its free account for students needs an address in the European Union, and the price list says it then carries on as an AktivKonto.' },
  'de-ing': { condition: 'ING keeps it, though its terms ask for a home and work in Germany to open one, and customers who moved abroad report it ending theirs on two months’ notice.' },
  'es-santander': { condition: 'Banco Santander keeps it as a non-resident account, once you’ve given it proof that you no longer live in Spain, renewed every two years.' },
  'es-bbva': { condition: 'BBVA keeps it as a non-resident account, once you’ve given it proof that you no longer live in Spain, renewed every two years.' },
  'es-caixabank': { condition: 'CaixaBank keeps it as a non-resident account, once you’ve given it proof that you no longer live in Spain, renewed every two years.' },
  'es-sabadell': {
    condition: 'Banco Sabadell keeps it as a non-resident account, and charges for asking the police for your certificate of non-residence every two years.',
    nonResidentFee: { amount: 30_00, months: 24, note: '€30 every two years for the certificate of non-residence it asks the police for, plus the police’s own charge, which isn’t published' },
  },
  'es-bankinter': { condition: 'Bankinter keeps it as a non-resident account, once you’ve given it proof that you no longer live in Spain, renewed every two years.' },
  'jp-mufg': {
    condition: 'MUFG keeps it through Global Direct, which a student going abroad to study applies for before leaving, as SLATE takes it you did.',
    nonResidentFee: { amount: 300_00, months: 1, note: '¥300 a month for Global Direct' },
  },
  'jp-smbc': {
    condition: 'SMBC keeps it through its Global Service, which a student going abroad to study registers for before leaving, as SLATE takes it you did; a cash card then works only at Japanese ATMs.',
    nonResidentFee: { amount: 220_00, months: 1, note: '¥220 a month for the Global Service' },
  },
  'jp-mizuho': { condition: 'Mizuho keeps it once it’s changed to non-resident status at a branch, but then with no cash card and no internet banking.' },
  'jp-resona': { condition: 'Resona keeps it once it’s converted to a non-resident yen deposit at a branch before leaving.' },
  // The research's own default is closing: "SLATE assumes the default for a Japan Post Bank customer leaving to study in
  // the US is closure (the bank's own published request)", kept only with a proxy in Japan, which SLATE has none of.
  'jp-japan-post-bank': { unusable: 'Japan Post Bank asks a customer going abroad to close the account, and keeps one only with someone in Japan acting for them, which SLATE doesn’t have.' },
  'kr-kakaobank': { condition: 'KakaoBank keeps it while you keep your Korean phone number: it has no branch, and every check runs through the app and that phone.' },
  'au-nab': { condition: 'NAB keeps it once you’ve updated your tax residency, though its guidance for customers leaving Australia steers them to close.' },
  'au-anz': { condition: 'ANZ keeps it only until it acts on its rule that a customer has an Australian address, which SLATE takes it hasn’t.' },
  'mx-bbva': { openFromAge: 18 },
  'nz-kiwibank': { openFromAge: 16 },
};

/** A bank kept on conditions, where no sentence of its own says what they are: the research's general ones. */
const conditionOf = (name: string): string => `${name} keeps it once you’ve told it your American address and given it a tax self-certification.`;

function termsFrom(bankId: string, r: Researched): HomeTerms {
  const read = READ[bankId] ?? {};
  const name = bankById(bankId)?.name ?? bankId;
  const nonResident = r.kept === true ? 'keeps' : r.kept === false ? 'closes' : 'conditional';
  const confidence = nonResident !== 'conditional' ? 'H' : read.nonResidentFee || bankId === 'de-deutsche-bank' ? 'M' : 'L';
  const official = r.sources.find((s) => s.official) ?? r.sources[0];
  return {
    bankId,
    nonResident,
    ...(nonResident === 'closes' && r.closesWithNoticeDays !== null ? { closeNoticeDays: r.closesWithNoticeDays } : {}),
    usPersons: 'keeps',
    ...(nonResident === 'conditional' ? { condition: conditionOf(name) } : {}),
    openFromAge: read.openFromAge ?? ASSUMED_OPENING_AGE,
    ageAssumed: read.openFromAge === undefined,
    confidence,
    ...read,
    source: official ? `${official.title} (${official.url})` : 'docs/research/banking/home-accounts.json',
    asOf: RESEARCH.read,
  };
}

const TERMS = new Map<string, HomeTerms>();
for (const [bankId, r] of Object.entries(RESEARCH.banks)) {
  // An American bank is the account here, not one kept from abroad (the rule's second step).
  if (!bankId.startsWith('us-')) TERMS.set(bankId, termsFrom(bankId, r));
}

/** A bank's terms for an account kept from abroad, or nothing where SLATE has no research on it. */
export function homeTerms(bankId: string): HomeTerms | undefined {
  return TERMS.get(bankId);
}

/** Every bank with terms. */
export function allHomeTerms(): readonly HomeTerms[] {
  return [...TERMS.values()];
}

/** Registers terms, as a test needs them: a bank that refuses a US person, or one the research didn't read. */
export function addHomeTerms(terms: HomeTerms): void {
  TERMS.set(terms.bankId, terms);
}

/** Takes terms a test registered away again, or puts the researched ones back. */
export function resetHomeTerms(bankId: string): void {
  const r = RESEARCH.banks[bankId];
  if (r && !bankId.startsWith('us-')) TERMS.set(bankId, termsFrom(bankId, r));
  else TERMS.delete(bankId);
}

/** The notice a closing bank gives an account opened on a day (YYYY-MM-DD). */
export function noticeFor(terms: HomeTerms, opened: string): number | undefined {
  if (terms.longerNotice && opened >= terms.longerNotice.openedFrom) return terms.longerNotice.days;
  return terms.closeNoticeDays;
}
