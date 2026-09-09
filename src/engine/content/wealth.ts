/**
 * SLATE — the cards people talk about, and the banks that answer the phone.
 *
 * The black card is a real thing: American Express issues the Centurion by
 * invitation, and charges what it says on its own rate page. The rest of
 * the top of the market is real too, and so are the private banks, from
 * Zurich and Geneva to Singapore, Jersey and George Town. What is public is
 * public: the issuer, the network, the published fee, the jurisdiction, the
 * fact of an invitation. What is not published is said to be not published:
 * how Amex decides who gets a Centurion, and exactly how much a private bank
 * wants before it will open the door. Those numbers are SLATE's calibration
 * of what is widely reported, and every screen that shows one says so.
 *
 * One thing this file will not do is pretend an offshore account is a place
 * money disappears. Every bank here reports under the Common Reporting
 * Standard or FATCA to the tax authority where you live, and a US person
 * with more than ten thousand dollars abroad in aggregate files an FBAR.
 * Opening one is a banking decision, not a secret.
 */

import type { Money } from '../core/money';

export type CardNetwork = 'American Express' | 'Visa' | 'Mastercard';

export interface RealCard {
  id: string;
  /** The card, as the issuer names it. */
  name: string;
  issuer: string;
  network: CardNetwork;
  /** Where it is issued. A country not on the list cannot apply. */
  countryIds: readonly string[];
  /** The published annual fee, where there is one. */
  annualFee: Money;
  /** A one-time initiation fee, where the issuer charges one. */
  initiationFee?: Money;
  /** Not applied for. Reported invitation criteria, labelled as reported. */
  invitation?: {
    /** Trailing twelve-month spend across the issuer's cards, as widely reported. Not published. */
    reportedSpend: Money;
    /** Months holding the issuer's top public card first, as widely reported. */
    reportedMonths: number;
    /** The public card that gets you looked at. */
    viaCardId?: string;
    /** Or a private-bank relationship instead. */
    viaBank?: string;
    note: string;
  };
  /** The lowest score that is usually approved. SLATE's calibration. */
  minimumScore: number;
  /** A starting limit, before your own credit is looked at. SLATE's calibration; where the issuer sets no preset limit, this is the number SLATE uses for one. */
  baseCreditLimit: Money;
  /** What the card is publicly known for. */
  perks: readonly string[];
  about: string;
}

const CARD = (spec: RealCard): RealCard => spec;

export const REAL_CARDS: readonly RealCard[] = [
  CARD({
    id: 'amex_centurion', name: 'Centurion Card', issuer: 'American Express', network: 'American Express', countryIds: ['us'],
    annualFee: 5_000_00, initiationFee: 10_000_00, minimumScore: 760, baseCreditLimit: 250_000_00,
    invitation: { reportedSpend: 250_000_00, reportedMonths: 12, viaCardId: 'amex_platinum', note: 'By invitation only. American Express has never published who gets one; a quarter of a million a year in spend on a Platinum for a year or more is what is widely reported, and SLATE uses that as its rule.' },
    perks: ['Invitation Only', 'A Concierge Who Actually Does Things', 'Centurion Lounges', 'Hotel And Airline Elite Status', 'No Preset Spending Limit'],
    about: 'The black card. Ten thousand to join and five thousand a year, both on the issuer’s own rate page; the invitation is the part nobody publishes.',
  }),
  CARD({
    id: 'amex_centurion_uk', name: 'Centurion Card', issuer: 'American Express UK', network: 'American Express', countryIds: ['uk'],
    annualFee: 3_000_00, initiationFee: 3_000_00, minimumScore: 760, baseCreditLimit: 200_000_00,
    invitation: { reportedSpend: 200_000_00, reportedMonths: 12, viaCardId: 'amex_platinum_uk', note: 'By invitation only. The British fees are widely reported rather than published on a rate page, so SLATE labels them a calibration.' },
    perks: ['Invitation Only', 'Centurion Concierge', 'Lounges Worldwide', 'No Preset Spending Limit'],
    about: 'The British Centurion. Invitation, then three thousand to join and three thousand a year, as reported.',
  }),
  CARD({
    id: 'amex_platinum', name: 'The Platinum Card', issuer: 'American Express', network: 'American Express', countryIds: ['us'],
    annualFee: 895_00, minimumScore: 700, baseCreditLimit: 25_000_00,
    perks: ['Centurion Lounges And Priority Pass', 'Hotel Elite Status', 'A Stack Of Statement Credits', 'Fine Hotels And Resorts'],
    about: 'The card the Centurion is grown from. Eight hundred and ninety five a year since the 2025 refresh, and more credits than anyone uses.',
  }),
  CARD({
    id: 'amex_platinum_uk', name: 'The Platinum Card', issuer: 'American Express UK', network: 'American Express', countryIds: ['uk'],
    annualFee: 650_00, minimumScore: 700, baseCreditLimit: 20_000_00,
    perks: ['Lounges Worldwide', 'Hotel Elite Status', 'Travel Insurance Included', 'Dining And Retail Credits'],
    about: 'The British Platinum. Six hundred and fifty a year and the lounges that come with it.',
  }),
  CARD({
    id: 'amex_platinum_intl', name: 'The Platinum Card', issuer: 'American Express', network: 'American Express', countryIds: ['ca', 'au', 'de', 'fr', 'it', 'es', 'nl', 'se', 'jp', 'sg', 'hk', 'in', 'mx', 'ae', 'at', 'be', 'ch', 'tw', 'th', 'my', 'nz', 'ar', 'br', 'ie', 'fi', 'no', 'dk', 'pl'],
    annualFee: 700_00, minimumScore: 700, baseCreditLimit: 20_000_00,
    perks: ['Lounges Worldwide', 'Hotel Elite Status', 'Travel Cover Included'],
    about: 'Platinum outside America and Britain. The fee differs by market; SLATE uses one calibration rather than thirty guesses.',
  }),
  CARD({
    id: 'amex_gold', name: 'American Express Gold Card', issuer: 'American Express', network: 'American Express', countryIds: ['us'],
    annualFee: 325_00, minimumScore: 670, baseCreditLimit: 15_000_00,
    perks: ['Four Points On Dining And Groceries', 'Dining Credits'],
    about: 'The restaurant card. Three hundred and twenty five a year.',
  }),
  CARD({
    id: 'chase_sapphire_reserve', name: 'Chase Sapphire Reserve', issuer: 'JPMorgan Chase', network: 'Visa', countryIds: ['us'],
    annualFee: 795_00, minimumScore: 740, baseCreditLimit: 30_000_00,
    perks: ['Sapphire Lounges And Priority Pass', 'Travel Credit', 'Primary Rental Car Cover', 'Points Worth More On Travel'],
    about: 'Seven hundred and ninety five a year since the 2025 refresh. Chase’s answer to the Platinum, and the card with the metal that people notice.',
  }),
  CARD({
    id: 'jpm_reserve', name: 'J.P. Morgan Reserve Card', issuer: 'JPMorgan Chase', network: 'Visa', countryIds: ['us'],
    annualFee: 795_00, minimumScore: 760, baseCreditLimit: 100_000_00,
    invitation: { reportedSpend: 0, reportedMonths: 0, viaBank: 'jpm_private', note: 'Not applied for. Offered to J.P. Morgan Private Bank clients, which is to say to people with ten million or so with the bank.' },
    perks: ['Private Bank Clients Only', 'Palladium And Brass', 'Everything The Sapphire Reserve Does'],
    about: 'The card that used to be called Palladium. It’s the Sapphire Reserve for people who bank at the private bank.',
  }),
  CARD({
    id: 'capital_one_venture_x', name: 'Capital One Venture X', issuer: 'Capital One', network: 'Visa', countryIds: ['us'],
    annualFee: 395_00, minimumScore: 740, baseCreditLimit: 20_000_00,
    perks: ['Capital One Lounges', 'Travel Credit', 'Two Miles On Everything'],
    about: 'Three hundred and ninety five a year, and it pays for itself if you travel at all.',
  }),
  CARD({
    id: 'citi_strata_elite', name: 'Citi Strata Elite', issuer: 'Citi', network: 'Mastercard', countryIds: ['us'],
    annualFee: 595_00, minimumScore: 740, baseCreditLimit: 20_000_00,
    perks: ['Priority Pass', 'Hotel Credit', 'Points On Travel And Dining'],
    about: 'Citi’s premium card, launched in 2025. Five hundred and ninety five a year.',
  }),
  CARD({
    id: 'coutts_silk', name: 'Coutts Silk Card', issuer: 'Coutts', network: 'Mastercard', countryIds: ['uk'],
    annualFee: 0, minimumScore: 740, baseCreditLimit: 100_000_00,
    invitation: { reportedSpend: 0, reportedMonths: 0, viaBank: 'coutts', note: 'For Coutts clients. The bank doesn’t publish a fee for the card; it’s part of the relationship, which wants a million or so.' },
    perks: ['Coutts Clients Only', 'Concierge', 'No Preset Spending Limit'],
    about: 'The card that comes with an account at the bank on the Strand.',
  }),
  CARD({
    id: 'dubai_first_royale', name: 'Dubai First Royale Mastercard', issuer: 'Dubai First', network: 'Mastercard', countryIds: ['ae'],
    annualFee: 0, minimumScore: 760, baseCreditLimit: 250_000_00,
    invitation: { reportedSpend: 0, reportedMonths: 0, viaBank: 'enbd_private', note: 'Invitation only, with no published fee and no published criteria. A diamond set into a gold-edged card, offered to a few hundred people.' },
    perks: ['Invitation Only', 'A Diamond In The Card', 'Lifestyle Management', 'No Preset Spending Limit'],
    about: 'The card with a diamond in it. SLATE’s rule for the invitation is a private-banking relationship in the Emirates, because the issuer publishes none.',
  }),
];

export function realCardById(id: string): RealCard | undefined {
  return REAL_CARDS.find((c) => c.id === id);
}

/** The cards issued where you live. */
export function realCardsFor(countryId: string): RealCard[] {
  return REAL_CARDS.filter((c) => c.countryIds.includes(countryId));
}

// ---------------------------------------------------------------------------
// Private and offshore banks
// ---------------------------------------------------------------------------

export interface PrivateBank {
  id: string;
  name: string;
  /** Where the account is booked. Offshore is relative: it is offshore when this is not where you live. */
  countryId: string;
  /** The city the desk is in, for the screen. */
  city: string;
  /**
   * What the bank wants before it opens a private account. Rarely published;
   * this is SLATE's calibration of what is widely reported, in cents of the
   * game's currency.
   */
  minimumRelationship: Money;
  /** Whether the minimum is published by the bank or reported about it. */
  minimumIs: 'published' | 'reported';
  /** Annual rate paid on cash held, SLATE's calibration. */
  apy: number;
  /** A relationship fee a year, SLATE's calibration. Zero where the bank charges on assets instead. */
  annualFee: Money;
  /** Weeks of account opening and source-of-funds checks before the account exists. */
  kycWeeks: number;
  about: string;
}

const BANK = (spec: PrivateBank): PrivateBank => spec;

export const PRIVATE_BANKS: readonly PrivateBank[] = [
  // Switzerland and Liechtenstein
  BANK({ id: 'ubs', name: 'UBS Global Wealth Management', countryId: 'ch', city: 'Zürich', minimumRelationship: 2_000_000_00, minimumIs: 'reported', apy: 0.008, annualFee: 0, kycWeeks: 4, about: 'The largest wealth manager on earth, since it absorbed Credit Suisse. Two million is where the private bank starts, as reported; the fee comes off the assets, not the account.' }),
  BANK({ id: 'julius_baer', name: 'Julius Baer', countryId: 'ch', city: 'Zürich', minimumRelationship: 1_000_000_00, minimumIs: 'reported', apy: 0.008, annualFee: 0, kycWeeks: 4, about: 'A pure private bank on the Bahnhofstrasse. A million, as reported.' }),
  BANK({ id: 'pictet', name: 'Pictet', countryId: 'ch', city: 'Geneva', minimumRelationship: 2_000_000_00, minimumIs: 'reported', apy: 0.007, annualFee: 0, kycWeeks: 5, about: 'A partnership in Geneva since 1805. They don’t advertise a minimum; two million is what is reported.' }),
  BANK({ id: 'lombard_odier', name: 'Lombard Odier', countryId: 'ch', city: 'Geneva', minimumRelationship: 3_000_000_00, minimumIs: 'reported', apy: 0.007, annualFee: 0, kycWeeks: 5, about: 'Geneva since 1796, and still owned by its partners. Three million, as reported.' }),
  BANK({ id: 'efg', name: 'EFG International', countryId: 'ch', city: 'Zürich', minimumRelationship: 1_000_000_00, minimumIs: 'reported', apy: 0.009, annualFee: 0, kycWeeks: 3, about: 'A Swiss private bank with a Greek shipping family behind it. A million, as reported.' }),
  BANK({ id: 'vontobel', name: 'Vontobel', countryId: 'ch', city: 'Zürich', minimumRelationship: 1_000_000_00, minimumIs: 'reported', apy: 0.008, annualFee: 0, kycWeeks: 4, about: 'Zürich, family-controlled, listed. A million, as reported.' }),
  BANK({ id: 'lgt', name: 'LGT Private Banking', countryId: 'li', city: 'Vaduz', minimumRelationship: 1_000_000_00, minimumIs: 'reported', apy: 0.008, annualFee: 0, kycWeeks: 4, about: 'Owned by the Princely House of Liechtenstein. A million, as reported.' }),
  // Britain, the Crown Dependencies and Gibraltar
  BANK({ id: 'coutts', name: 'Coutts', countryId: 'uk', city: 'London', minimumRelationship: 1_000_000_00, minimumIs: 'published', apy: 0.012, annualFee: 900_00, kycWeeks: 3, about: 'The bank on the Strand, part of NatWest. A million in investable assets or borrowing, which they publish, and a fee they publish too.' }),
  BANK({ id: 'hoares', name: 'C. Hoare & Co.', countryId: 'uk', city: 'London', minimumRelationship: 2_000_000_00, minimumIs: 'reported', apy: 0.010, annualFee: 0, kycWeeks: 4, about: 'Fleet Street since 1672 and still the family’s. They choose their customers; two million is the reported floor.' }),
  BANK({ id: 'arbuthnot', name: 'Arbuthnot Latham', countryId: 'uk', city: 'London', minimumRelationship: 500_000_00, minimumIs: 'reported', apy: 0.014, annualFee: 0, kycWeeks: 3, about: 'A smaller London private bank. Half a million, as reported.' }),
  BANK({ id: 'weatherbys', name: 'Weatherbys Private Bank', countryId: 'uk', city: 'London', minimumRelationship: 300_000_00, minimumIs: 'reported', apy: 0.014, annualFee: 0, kycWeeks: 3, about: 'The racing family’s bank. Three hundred thousand, as reported.' }),
  BANK({ id: 'hsbc_expat', name: 'HSBC Expat', countryId: 'je', city: 'St Helier', minimumRelationship: 50_000_00, minimumIs: 'published', apy: 0.020, annualFee: 0, kycWeeks: 2, about: 'HSBC’s offshore bank in Jersey, for people who live away from home. Fifty thousand, published, or a salary to match.' }),
  BANK({ id: 'lloyds_international', name: 'Lloyds Bank International', countryId: 'im', city: 'Douglas', minimumRelationship: 25_000_00, minimumIs: 'published', apy: 0.018, annualFee: 0, kycWeeks: 2, about: 'Lloyds on the Isle of Man. Twenty five thousand, published.' }),
  BANK({ id: 'rbc_jersey', name: 'RBC Wealth Management (Jersey)', countryId: 'je', city: 'St Helier', minimumRelationship: 1_000_000_00, minimumIs: 'reported', apy: 0.014, annualFee: 0, kycWeeks: 4, about: 'Royal Bank of Canada’s offshore wealth business. A million, as reported.' }),
  BANK({ id: 'butterfield_guernsey', name: 'Butterfield Bank (Guernsey)', countryId: 'gg', city: 'St Peter Port', minimumRelationship: 250_000_00, minimumIs: 'reported', apy: 0.016, annualFee: 0, kycWeeks: 3, about: 'The Bermudian bank’s Channel Islands arm. A quarter of a million, as reported.' }),
  // Luxembourg and Monaco
  BANK({ id: 'banque_de_luxembourg', name: 'Banque de Luxembourg', countryId: 'lu', city: 'Luxembourg', minimumRelationship: 500_000_00, minimumIs: 'reported', apy: 0.010, annualFee: 0, kycWeeks: 4, about: 'The Grand Duchy’s private bank. Half a million, as reported.' }),
  BANK({ id: 'bil', name: 'Banque Internationale à Luxembourg', countryId: 'lu', city: 'Luxembourg', minimumRelationship: 500_000_00, minimumIs: 'reported', apy: 0.010, annualFee: 0, kycWeeks: 4, about: 'Luxembourg’s oldest bank. Half a million for the private bank, as reported.' }),
  BANK({ id: 'cfm_indosuez', name: 'CFM Indosuez Wealth', countryId: 'mc', city: 'Monaco', minimumRelationship: 1_000_000_00, minimumIs: 'reported', apy: 0.009, annualFee: 0, kycWeeks: 5, about: 'Crédit Agricole’s bank in the principality. A million, as reported, and residence in Monaco helps.' }),
  BANK({ id: 'edmond_de_rothschild', name: 'Edmond de Rothschild', countryId: 'ch', city: 'Geneva', minimumRelationship: 1_000_000_00, minimumIs: 'reported', apy: 0.008, annualFee: 0, kycWeeks: 5, about: 'The Geneva branch of the family. A million, as reported.' }),
  // Singapore and Hong Kong
  BANK({ id: 'bank_of_singapore', name: 'Bank of Singapore', countryId: 'sg', city: 'Singapore', minimumRelationship: 5_000_000_00, minimumIs: 'reported', apy: 0.015, annualFee: 0, kycWeeks: 4, about: 'OCBC’s private bank. Five million US, as reported.' }),
  BANK({ id: 'dbs_private', name: 'DBS Private Bank', countryId: 'sg', city: 'Singapore', minimumRelationship: 5_000_000_00, minimumIs: 'reported', apy: 0.015, annualFee: 0, kycWeeks: 3, about: 'Southeast Asia’s biggest bank, at the top of its ladder. Five million, as reported; Treasures Private Client sits below it at a million and a half.' }),
  BANK({ id: 'dbs_treasures_private', name: 'DBS Treasures Private Client', countryId: 'sg', city: 'Singapore', minimumRelationship: 1_500_000_00, minimumIs: 'published', apy: 0.014, annualFee: 0, kycWeeks: 2, about: 'The published tier: a million and a half Singapore dollars.' }),
  BANK({ id: 'ocbc_premier_private', name: 'OCBC Premier Private Client', countryId: 'sg', city: 'Singapore', minimumRelationship: 1_000_000_00, minimumIs: 'published', apy: 0.013, annualFee: 0, kycWeeks: 2, about: 'A million, published.' }),
  BANK({ id: 'uob_private', name: 'UOB Private Bank', countryId: 'sg', city: 'Singapore', minimumRelationship: 5_000_000_00, minimumIs: 'reported', apy: 0.014, annualFee: 0, kycWeeks: 3, about: 'Five million, as reported.' }),
  BANK({ id: 'hsbc_private_hk', name: 'HSBC Global Private Banking', countryId: 'hk', city: 'Hong Kong', minimumRelationship: 5_000_000_00, minimumIs: 'reported', apy: 0.012, annualFee: 0, kycWeeks: 3, about: 'Five million US, as reported.' }),
  BANK({ id: 'standard_chartered_private', name: 'Standard Chartered Private Bank', countryId: 'sg', city: 'Singapore', minimumRelationship: 5_000_000_00, minimumIs: 'reported', apy: 0.013, annualFee: 0, kycWeeks: 3, about: 'Five million, as reported.' }),
  BANK({ id: 'boc_hk_private', name: 'BOC Private Banking', countryId: 'hk', city: 'Hong Kong', minimumRelationship: 1_000_000_00, minimumIs: 'reported', apy: 0.012, annualFee: 0, kycWeeks: 3, about: 'Bank of China Hong Kong. A million US, as reported.' }),
  // The Caribbean and Bermuda
  BANK({ id: 'butterfield_bermuda', name: 'Butterfield Private Bank', countryId: 'bm', city: 'Hamilton', minimumRelationship: 1_000_000_00, minimumIs: 'reported', apy: 0.016, annualFee: 0, kycWeeks: 3, about: 'Bermuda’s own bank since 1858. A million for the private bank, as reported.' }),
  BANK({ id: 'butterfield_cayman', name: 'Butterfield Bank (Cayman)', countryId: 'ky', city: 'George Town', minimumRelationship: 500_000_00, minimumIs: 'reported', apy: 0.016, annualFee: 0, kycWeeks: 3, about: 'Half a million, as reported.' }),
  BANK({ id: 'cayman_national', name: 'Cayman National Bank', countryId: 'ky', city: 'George Town', minimumRelationship: 100_000_00, minimumIs: 'reported', apy: 0.017, annualFee: 0, kycWeeks: 3, about: 'The islands’ own bank. A hundred thousand for a non-resident, as reported.' }),
  BANK({ id: 'rbc_cayman', name: 'RBC Wealth Management (Cayman)', countryId: 'ky', city: 'George Town', minimumRelationship: 1_000_000_00, minimumIs: 'reported', apy: 0.014, annualFee: 0, kycWeeks: 4, about: 'A million, as reported.' }),
  BANK({ id: 'cibc_first_caribbean', name: 'CIBC Caribbean Wealth Management', countryId: 'bs', city: 'Nassau', minimumRelationship: 500_000_00, minimumIs: 'reported', apy: 0.015, annualFee: 0, kycWeeks: 3, about: 'Half a million, as reported.' }),
  // The Gulf
  BANK({ id: 'enbd_private', name: 'Emirates NBD Private Banking', countryId: 'ae', city: 'Dubai', minimumRelationship: 1_000_000_00, minimumIs: 'reported', apy: 0.020, annualFee: 0, kycWeeks: 3, about: 'A million US, as reported. Home of the Dubai First Royale invitation in SLATE.' }),
  BANK({ id: 'fab_private', name: 'FAB Private Banking', countryId: 'ae', city: 'Abu Dhabi', minimumRelationship: 1_000_000_00, minimumIs: 'reported', apy: 0.020, annualFee: 0, kycWeeks: 3, about: 'First Abu Dhabi Bank. A million, as reported.' }),
  BANK({ id: 'mashreq_private', name: 'Mashreq Private Banking', countryId: 'ae', city: 'Dubai', minimumRelationship: 1_000_000_00, minimumIs: 'reported', apy: 0.021, annualFee: 0, kycWeeks: 3, about: 'A million, as reported.' }),
  // America, Canada and the rest of Europe
  BANK({ id: 'jpm_private', name: 'J.P. Morgan Private Bank', countryId: 'us', city: 'New York', minimumRelationship: 10_000_000_00, minimumIs: 'reported', apy: 0.025, annualFee: 0, kycWeeks: 3, about: 'Ten million, as reported, and the Reserve card comes with it.' }),
  BANK({ id: 'goldman_pwm', name: 'Goldman Sachs Private Wealth Management', countryId: 'us', city: 'New York', minimumRelationship: 10_000_000_00, minimumIs: 'reported', apy: 0.024, annualFee: 0, kycWeeks: 3, about: 'Ten million, as reported.' }),
  BANK({ id: 'morgan_stanley_pwm', name: 'Morgan Stanley Private Wealth Management', countryId: 'us', city: 'New York', minimumRelationship: 20_000_000_00, minimumIs: 'reported', apy: 0.024, annualFee: 0, kycWeeks: 3, about: 'Twenty million, as reported.' }),
  BANK({ id: 'citi_private', name: 'Citi Private Bank', countryId: 'us', city: 'New York', minimumRelationship: 10_000_000_00, minimumIs: 'reported', apy: 0.023, annualFee: 0, kycWeeks: 3, about: 'Ten million, as reported.' }),
  BANK({ id: 'northern_trust', name: 'Northern Trust Wealth Management', countryId: 'us', city: 'Chicago', minimumRelationship: 5_000_000_00, minimumIs: 'reported', apy: 0.022, annualFee: 0, kycWeeks: 3, about: 'Five million, as reported.' }),
  BANK({ id: 'bofa_private', name: 'Bank of America Private Bank', countryId: 'us', city: 'New York', minimumRelationship: 3_000_000_00, minimumIs: 'published', apy: 0.021, annualFee: 0, kycWeeks: 2, about: 'Three million, which the bank publishes.' }),
  BANK({ id: 'rbc_canada', name: 'RBC Wealth Management Canada', countryId: 'ca', city: 'Toronto', minimumRelationship: 1_000_000_00, minimumIs: 'reported', apy: 0.018, annualFee: 0, kycWeeks: 2, about: 'A million, as reported.' }),
  BANK({ id: 'bmo_private', name: 'BMO Private Wealth', countryId: 'ca', city: 'Toronto', minimumRelationship: 1_000_000_00, minimumIs: 'reported', apy: 0.018, annualFee: 0, kycWeeks: 2, about: 'A million, as reported.' }),
  BANK({ id: 'bnp_wealth', name: 'BNP Paribas Wealth Management', countryId: 'fr', city: 'Paris', minimumRelationship: 1_000_000_00, minimumIs: 'reported', apy: 0.010, annualFee: 0, kycWeeks: 4, about: 'A million, as reported.' }),
  BANK({ id: 'deutsche_wealth', name: 'Deutsche Bank Wealth Management', countryId: 'de', city: 'Frankfurt', minimumRelationship: 1_000_000_00, minimumIs: 'reported', apy: 0.010, annualFee: 0, kycWeeks: 4, about: 'A million, as reported.' }),
  BANK({ id: 'berenberg', name: 'Berenberg', countryId: 'de', city: 'Hamburg', minimumRelationship: 1_000_000_00, minimumIs: 'reported', apy: 0.010, annualFee: 0, kycWeeks: 4, about: 'Hamburg since 1590. A million, as reported.' }),
  BANK({ id: 'abn_meespierson', name: 'ABN AMRO MeesPierson', countryId: 'nl', city: 'Amsterdam', minimumRelationship: 1_000_000_00, minimumIs: 'published', apy: 0.010, annualFee: 0, kycWeeks: 3, about: 'A million, published.' }),
  BANK({ id: 'nordea_private', name: 'Nordea Private Banking', countryId: 'se', city: 'Stockholm', minimumRelationship: 500_000_00, minimumIs: 'reported', apy: 0.012, annualFee: 0, kycWeeks: 3, about: 'Half a million, as reported.' }),
  BANK({ id: 'santander_private', name: 'Santander Private Banking', countryId: 'es', city: 'Madrid', minimumRelationship: 500_000_00, minimumIs: 'published', apy: 0.010, annualFee: 0, kycWeeks: 3, about: 'Half a million, published.' }),
  BANK({ id: 'investec', name: 'Investec Private Bank', countryId: 'za', city: 'Johannesburg', minimumRelationship: 300_000_00, minimumIs: 'reported', apy: 0.040, annualFee: 0, kycWeeks: 2, about: 'The South African private bank. Three hundred thousand, or a salary to match, as reported.' }),
  BANK({ id: 'rmb_private', name: 'RMB Private Bank', countryId: 'za', city: 'Johannesburg', minimumRelationship: 300_000_00, minimumIs: 'reported', apy: 0.040, annualFee: 0, kycWeeks: 2, about: 'FirstRand’s private bank. Three hundred thousand, as reported.' }),
  BANK({ id: 'itau_private', name: 'Itaú Private Bank', countryId: 'br', city: 'São Paulo', minimumRelationship: 1_000_000_00, minimumIs: 'reported', apy: 0.050, annualFee: 0, kycWeeks: 3, about: 'A million, as reported.' }),
  BANK({ id: 'btg_wealth', name: 'BTG Pactual Wealth Management', countryId: 'br', city: 'São Paulo', minimumRelationship: 1_000_000_00, minimumIs: 'reported', apy: 0.050, annualFee: 0, kycWeeks: 3, about: 'A million, as reported.' }),
  BANK({ id: 'safra_sarasin', name: 'J. Safra Sarasin', countryId: 'ch', city: 'Basel', minimumRelationship: 1_000_000_00, minimumIs: 'reported', apy: 0.008, annualFee: 0, kycWeeks: 4, about: 'The Safra family’s Swiss bank. A million, as reported.' }),
  BANK({ id: 'cmb_private', name: 'China Merchants Bank Private Banking', countryId: 'cn', city: 'Shenzhen', minimumRelationship: 1_500_000_00, minimumIs: 'published', apy: 0.018, annualFee: 0, kycWeeks: 3, about: 'Ten million yuan, published; SLATE converts it to a million and a half.' }),
  BANK({ id: 'mufg_wealth', name: 'MUFG Wealth Management', countryId: 'jp', city: 'Tokyo', minimumRelationship: 1_000_000_00, minimumIs: 'reported', apy: 0.003, annualFee: 0, kycWeeks: 3, about: 'A million, as reported, and a Japanese rate on cash.' }),
  BANK({ id: 'kotak_private', name: 'Kotak Private Banking', countryId: 'in', city: 'Mumbai', minimumRelationship: 1_000_000_00, minimumIs: 'reported', apy: 0.060, annualFee: 0, kycWeeks: 3, about: 'A million, as reported.' }),
  BANK({ id: 'macquarie_private', name: 'Macquarie Private Bank', countryId: 'au', city: 'Sydney', minimumRelationship: 1_000_000_00, minimumIs: 'reported', apy: 0.035, annualFee: 0, kycWeeks: 2, about: 'A million, as reported.' }),
  BANK({ id: 'nab_private', name: 'NAB Private Wealth', countryId: 'au', city: 'Melbourne', minimumRelationship: 1_000_000_00, minimumIs: 'reported', apy: 0.035, annualFee: 0, kycWeeks: 2, about: 'A million, as reported.' }),
];

export function privateBankById(id: string): PrivateBank | undefined {
  return PRIVATE_BANKS.find((b) => b.id === id);
}

/** What a US person owes the Treasury for having money abroad: an FBAR above this, in aggregate. Public. */
export const FBAR_THRESHOLD: Money = 10_000_00;

export const BLACK_CARD_NOTE = 'The issuer, the network and a published fee are public record. How an invitation is decided isn’t published by anyone; SLATE uses what is widely reported and says so.';
export const PRIVATE_BANK_NOTE = 'A real bank in a real jurisdiction. What it wants before it opens an account is rarely published; SLATE labels each minimum as published or reported.';
export const REPORTING_NOTE = 'An account abroad is reported. Every bank here exchanges information under the Common Reporting Standard or FATCA with the tax authority where you live, and SLATE tells your tax return about it. It’s a place to keep money, not a place to hide it.';
export const FBAR_NOTE = 'A United States person with more than ten thousand dollars abroad in aggregate files an FBAR with the Treasury each year. SLATE files it for you and says so.';
