/**
 * SLATE — jewelry and watches kept safe, and what insurance pays for them
 * (the master plan's §29, from 2026-10-02;
 * `docs/research/world/research-jewelry-watches.json`, each seller's and
 * insurer's own page read that day, a few secondhand as marked).
 *
 * **Safes**, at a named seller's price where you live, and what each holds:
 * SentrySafe's at Walmart.com, The Home Depot Canada (from a search summary;
 * the page timed out) and The Home Depot México, by their own cubic feet or
 * liters; Yale's at Yale's own British store and at Screwfix Ireland. Yale's
 * British store gives no liters, so its Value Safes and its Maximum Security
 * Safe take the liters Screwfix Ireland gives the same models (YSV/200,
 * YSV/250, YSV/390, YSEM/250), SLATE's pairing by Yale's model names.
 *
 * **A standard policy's limit on jewelry and watches**, for theft: Lemonade's
 * $1,500 in America (the ISO form's default, as Lemonade says); TD
 * Insurance's C$5,000 in Canada; Aviva's £10,000 of valuables, £2,500 an
 * item, in Britain; GNP Seguros' 335 UMA an article in Mexico, MXN
 * 39,298.85 at 2026's UMA of MXN 117.31 (INEGI's, from a search summary).
 * No Irish insurer's standard limit was found, so in Ireland the contents
 * cover pays for them as for the rest.
 *
 * **Scheduling a piece** on the policy covers it at full value with no
 * deductible (Lemonade's own terms). Lemonade publishes only averages, a
 * $9.46 premium a month for $9,037 scheduled; 1.26% a year is SLATE's
 * arithmetic on them, and elsewhere SLATE's estimate, no insurer there
 * publishing a rate. Jewelers Mutual says 1–2% a year.
 */

export interface Safe { id: string; country: string; label: string; seller: string; price: number; currency: string; taxIncluded: boolean; holdsL: number; confirmed: boolean }

const CU_FT_L = 28.3168;

export const SAFES: readonly Safe[] = [
  { id: 'us-sentrysafe-sfw082et', country: 'us', label: 'SentrySafe SFW082ET Fire And Water Safe', seller: 'Walmart.com', price: 206.32, currency: 'USD', taxIncluded: false, holdsL: Math.round(0.82 * CU_FT_L * 10) / 10, confirmed: true },
  { id: 'ca-sentrysafe-sfw123dtb', country: 'ca', label: 'SentrySafe SFW123DTB Fire And Water Safe', seller: 'The Home Depot Canada', price: 428, currency: 'CAD', taxIncluded: false, holdsL: Math.round(1.23 * CU_FT_L * 10) / 10, confirmed: false },
  { id: 'uk-yale-value-small', country: 'uk', label: 'Yale Value Safe, Small', seller: 'Yale', price: 40, currency: 'GBP', taxIncluded: true, holdsL: 8.6, confirmed: true },
  { id: 'uk-yale-value-medium', country: 'uk', label: 'Yale Value Safe, Medium', seller: 'Yale', price: 59.99, currency: 'GBP', taxIncluded: true, holdsL: 16.3, confirmed: true },
  { id: 'uk-yale-value-large', country: 'uk', label: 'Yale Value Safe, Large', seller: 'Yale', price: 100, currency: 'GBP', taxIncluded: true, holdsL: 40, confirmed: true },
  { id: 'uk-yale-max-medium', country: 'uk', label: 'Yale Maximum Security Safe, Medium', seller: 'Yale', price: 179.99, currency: 'GBP', taxIncluded: true, holdsL: 18.6, confirmed: true },
  { id: 'ie-yale-ysv200', country: 'ie', label: 'Yale YSV/200 Small Safe', seller: 'Screwfix', price: 69.05, currency: 'EUR', taxIncluded: true, holdsL: 8.6, confirmed: true },
  { id: 'ie-yale-ysv250', country: 'ie', label: 'Yale YSV/250 Safe', seller: 'Screwfix', price: 93.75, currency: 'EUR', taxIncluded: true, holdsL: 16.3, confirmed: true },
  { id: 'ie-yale-ysv390', country: 'ie', label: 'Yale YSV/390 Large Safe', seller: 'Screwfix', price: 127.95, currency: 'EUR', taxIncluded: true, holdsL: 40, confirmed: true },
  { id: 'ie-yale-ysem250', country: 'ie', label: 'Yale YSEM/250 Maximum Security Safe', seller: 'Screwfix', price: 228.95, currency: 'EUR', taxIncluded: true, holdsL: 18.6, confirmed: true },
  { id: 'mx-sentrysafe-digital-33', country: 'mx', label: 'SentrySafe Caja Fuerte Digital 33.61 L', seller: 'The Home Depot México', price: 6965, currency: 'MXN', taxIncluded: true, holdsL: 33.6, confirmed: true },
  { id: 'mx-sentrysafe-digital-123', country: 'mx', label: 'SentrySafe Caja Fuerte Digital 1.23 Pies Cúbicos', seller: 'The Home Depot México', price: 8399, currency: 'MXN', taxIncluded: true, holdsL: Math.round(1.23 * CU_FT_L * 10) / 10, confirmed: true },
];

/** A standard policy's limit on jewelry and watches stolen, in the insurer's money: in all, and an item. */
export interface TheftLimit { country: string; insurer: string; currency: string; total?: number; perItem?: number }
export const THEFT_LIMITS: readonly TheftLimit[] = [
  { country: 'us', insurer: 'Lemonade', currency: 'USD', total: 1500 },
  { country: 'ca', insurer: 'TD Insurance', currency: 'CAD', total: 5000 },
  { country: 'uk', insurer: 'Aviva', currency: 'GBP', total: 10000, perItem: 2500 },
  { country: 'mx', insurer: 'GNP Seguros', currency: 'MXN', perItem: 39298.85 },
];

/** A scheduled piece's premium, a year, as a share of its value. */
export const SCHEDULED_RATE_YEAR = 0.0126;
