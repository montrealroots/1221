/**
 * SLATE — the visitor visas SLATE's pairs of citizenship and destination
 * need (from 2026-09-29), researched and kept in
 * `docs/research/world/research-openitems.json`; Mexico's and Brazil's
 * electronic visas read the same day from the press and the consulates.
 * Keyed destination, then the citizenship: "US<MX".
 *
 * Until 2026-09-29 SLATE named the visa a citizenship needed and didn't take
 * the application. Canada's eTA for a Mexican or Brazilian holding a US visa,
 * the US's $250 Visa Integrity Fee (enacted, its collection at these posts
 * unconfirmed) and a refusal at interview aren't kept.
 */

export interface VisaRule {
  name: string;
  fee: number;
  currency: string;
  /** Days from applying to the decision: the interview's wait and the processing. */
  days: number;
  /** How long it's good for: years, or days where it's short. */
  years?: number;
  validDays?: number;
  basis: string;
  source: string;
}

const US_B1B2 = (who: string): VisaRule => ({
  name: 'B-1/B-2 Visitor Visa',
  fee: 185, currency: 'USD',
  days: 150 + 7,
  years: 10,
  basis: `The $185 application fee; the interview about five months out at the Mexico City consulate (29 September 2026, read secondhand)${who === 'BR' ? ', which SLATE takes for Brazil’s posts too, theirs not read' : ''}, and SLATE’s week to issue; ten years, multiple entry, by reciprocity.`,
  source: 'https://travel.state.gov (fees); waitvisa.com (the wait, citing the State Department)',
});
const CA_TRV = (who: string): VisaRule => ({
  name: 'Visitor Visa (Canada)',
  fee: 100 + 85, currency: 'CAD',
  days: 18,
  years: 10,
  basis: `CAD 100 and CAD 85 for biometrics; about 18 days after biometrics for a Mexican applicant (read secondhand)${who === 'BR' ? ', which SLATE takes for a Brazilian too' : ''}; up to ten years or the passport’s end.`,
  source: 'IRCC fee schedule; immigration.ca',
});
const AU_600: VisaRule = {
  name: 'Visitor Visa (Subclass 600)',
  fee: 250, currency: 'AUD',
  days: 30,
  years: 1,
  basis: 'AUD 250 from 1 July 2026 (read secondhand, Home Affairs refusing automated reading); SLATE’s 30 days to decide and a year’s grant, the longest of the three, six and twelve months it gives.',
  source: 'austmss.com.au, July 2026',
};
const BR_EVISA: VisaRule = {
  name: 'Brazil e-Visa',
  fee: 80.9, currency: 'USD',
  days: 14,
  years: 10,
  basis: 'US$80.90 through VFS Global, decided within ten business days; ten years, multiple entry, for a US citizen (read secondhand), which SLATE takes for Canadians and Australians too.',
  source: 'https://brazil.vfsevisa.com; press guides, 2026',
};

export const VISAS: Readonly<Record<string, VisaRule>> = {
  'US<MX': US_B1B2('MX'),
  'US<BR': US_B1B2('BR'),
  'CA<MX': CA_TRV('MX'),
  'CA<BR': CA_TRV('BR'),
  'AU<MX': AU_600,
  'AU<BR': AU_600,
  'MX<BR': {
    name: 'Mexico Electronic Visa',
    fee: 10, currency: 'USD',
    days: 3,
    validDays: 180,
    basis: 'US$10 from 5 February 2026, for a stay under 180 days, flying in (Deloitte and the press, read secondhand); SLATE’s three days to decide.',
    source: 'https://www.deloitte.com/latam/es/services/legal/perspectives/restablecimiento-de-la-visa-electronica-de-visitante-de-visa-para-nacionales-de-brasil.html',
  },
  'BR<US': BR_EVISA,
  'BR<CA': BR_EVISA,
  'BR<AU': BR_EVISA,
};
