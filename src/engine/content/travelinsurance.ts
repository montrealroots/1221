/**
 * SLATE — travel insurance, by where the traveler lives (Stage 9 of
 * `docs/BACKLOG.md`, from 2026-10-01), from
 * `docs/research/world/research-travel-insurance-referrals.json`, read
 * 2026-10-01. Most insurers quote only through a form, so a price is a
 * comparison site's average or an insurer's "from", and a policy's terms one
 * named plan's; which is which is said for each.
 *
 * - **America:** Squaremouth's 2026 average, 6% of the trip's prepaid cost
 *   (its own sales, the last twelve months), on Allianz Travel's OneTrip
 *   Prime terms: trip cancellation to $100,000, emergency medical to $50,000,
 *   no deductible stated.
 * - **Britain:** GoCompare's average single trip, £21 at 25 to 34, £32 at 55
 *   to 64 and £49 at 65 to 79 (a search's summary); no other band is
 *   published, and SLATE takes £21 under 55 and offers none past 79. On the
 *   Post Office's Standard terms: medical and repatriation to £10 million,
 *   cancellation to £3,000, a £99 excess a claim.
 * - **Ireland:** Aviva's €19.63 for eight days in Europe at 30, and €70.16 for
 *   America at 60, the only two quotes read; SLATE takes the first for
 *   Europe and the second elsewhere. Medical to €5 million, cancellation to
 *   €3,000, 31 days a trip at most; no excess is published.
 * - **Canada:** TuGo's from C$60 a week (low confidence), taken a week
 *   started; emergency medical to C$5 million. Cancellation is sold apart,
 *   at no price read, and isn't kept.
 * - **Mexico:** AXA Assistance México's from MX$400 a trip, its Travel Lite
 *   plan's medical to US$35,000. No cancellation figure is published.
 *
 * Cancellation covers a trip missed or called off for the traveler's own
 * serious illness or injury, which SLATE reads as being in hospital or laid
 * up hurt, the reason every policy read lists first.
 *
 * **Ontario's out-of-country cover**: OHIP pays toward emergency care
 * outside Canada up to C$50 a day for outpatient care and C$200 a day for an
 * ordinary inpatient stay (C$400 in intensive care, not kept), as
 * ontario.ca says (updated 16 January 2026). News reports that the program
 * ended in 2020 disagree; the province's own page is taken.
 */

export type TravelMarket = 'us' | 'uk' | 'ie' | 'ca' | 'mx';

export interface TravelPolicyTerms {
  insurer: string;
  currency: string;
  /** The terms' money, which a premium needn't be in: medical to this, a claim; cancellation to this, or none sold with it. */
  medical: number;
  cancellation?: number;
  excess: number;
  maxDays?: number;
  source: string;
}

export const TRAVEL_POLICY: Readonly<Record<TravelMarket, TravelPolicyTerms>> = {
  us: { insurer: 'Allianz Travel, OneTrip Prime', currency: 'USD', medical: 50_000, cancellation: 100_000, excess: 0, source: 'https://www.allianztravelinsurance.com/find-a-plan/onetrip-prime.htm' },
  uk: { insurer: 'Post Office, Standard', currency: 'GBP', medical: 10_000_000, cancellation: 3_000, excess: 99, source: 'https://hellosafe.com/travel-insurance/post-office' },
  ie: { insurer: 'Aviva', currency: 'EUR', medical: 5_000_000, cancellation: 3_000, excess: 0, maxDays: 31, source: 'https://hellosafe.com/travel-insurance/aviva-ireland' },
  ca: { insurer: 'TuGo', currency: 'CAD', medical: 5_000_000, excess: 0, source: 'https://www.thetraveler.org/tugo-vs-manulife-which-travel-insurance-is-better-for-canadians/' },
  mx: { insurer: 'AXA Assistance México, Travel Lite', currency: 'USD', medical: 35_000, excess: 0, source: 'https://hellosafe.com.mx/seguro-viaje/axa' },
};

/** America's premium, a share of the trip's prepaid cost (Squaremouth). */
export const US_PREMIUM_SHARE = 0.06;
/** Britain's average single trip by age band, pounds; none past 79. */
export const UK_PREMIUM = [{ to: 54, gbp: 21 }, { to: 64, gbp: 32 }, { to: 79, gbp: 49 }] as const;
/** Ireland's, Europe and elsewhere. */
export const IE_PREMIUM = { europe: 19.63, elsewhere: 70.16 } as const;
/** Canada's, a week started; Mexico's, a trip. */
export const CA_PREMIUM_WEEK = 60;
export const MX_PREMIUM = 400;

/**
 * A visitor's care in England, from 2026-10-02 (`docs/DATA-GAPS.md`): the
 * Charges to Overseas Visitors Regulations 2015 leave A&E and a GP free to
 * everyone, and charge a hospital stay at 150% of the NHS's tariff; an Irish
 * resident is treated as resident, under the Common Travel Area. The stay's
 * price is the National Cost Collection's average non-elective long stay,
 * £4,852 (2022/23, HFMA, published 15 July 2024, read by hand: NHS England
 * and HFMA turn a script away), taken for the tariff it sets.
 */
export const ENGLAND_VISITOR = { stayGbp: 4_852, markup: 1.5 } as const;

/** OHIP's out-of-country payments, Canadian dollars a day. */
export const OHIP_ABROAD = { outpatient: 50, inpatient: 200 } as const;
