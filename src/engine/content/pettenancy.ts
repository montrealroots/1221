/**
 * SLATE — what a rented home asks of a tenant with a pet, place by place
 * (from 2026-10-04), from `docs/research/world/research-pet-care.json`'s
 * housing rules, read 2026-10-03:
 *
 * - **America**: no federal cap on pet deposits or pet rent. RentCafe's
 *   October 2025 analysis puts the market's averages at a refundable pet
 *   deposit of about $300 and pet rent of $35.65 a month; they are averages,
 *   SLATE's stand-in for what a landlord here asks, not any landlord's own.
 *   RentCafe's other average, a non-refundable pet fee of about $315, is
 *   what some landlords ask instead of a deposit, and isn't added on top.
 *   - New York (General Obligations Law §7-108) and California (Civil Code
 *     §1950.5, from July 2024): the deposit, however it's named, is capped at
 *     a month's rent, so a pet deposit sits inside the cap.
 *   - Connecticut (CGS §47a-21): a pet deposit may be asked on top of the
 *     two months' cap.
 *   - Pet rent is rent, not security, so it's charged with the month's rent.
 * - **England** (the Tenant Fees Act 2019): no separate pet deposit beyond
 *   the five weeks' cap. Since the Renters' Rights Act 2025's pet provisions
 *   (in force 2026-05-01, read secondhand), a landlord may not unreasonably
 *   refuse a pet asked for in writing.
 * - **Ireland**: no pet deposit on top of the month's cap.
 * - **Ontario** (RTA 2006 s.14): a no-pets clause is void, and the LTB has
 *   refused pet deposits.
 * - **British Columbia**: a pet damage deposit of at most half the first
 *   month's rent, however many pets, at the start or when the pet arrives.
 * - **Mexico City** (the Ley de Vivienda's Article 4, from 2025-10-28): a
 *   home can't be refused for living with companion animals.
 *
 * Elsewhere SLATE has read no rule, and asks nothing for a pet.
 */

export interface PetTenancy {
  /** The pet deposit: an amount in `currency`, or half the month's rent. */
  deposit: number | 'halfMonth';
  /** Whether the place's cap on deposits holds the pet deposit too. */
  withinCap: boolean;
  /** Pet rent a month, a pet, in `currency`. */
  petRent: number;
  currency: string;
}

const US: PetTenancy = { deposit: 300, withinCap: false, petRent: 35.65, currency: 'USD' };
const NONE = (currency: string): PetTenancy => ({ deposit: 0, withinCap: true, petRent: 0, currency });

/** By a town's region, the atlas's GeoNames code (Canada's 08 Ontario and 02 British Columbia, Mexico's 09 the capital), then its country. */
export const PET_TENANCY: Readonly<Record<string, PetTenancy>> = {
  us: US,
  'us-ny': { ...US, withinCap: true },
  'us-ca': { ...US, withinCap: true },
  'us-ct': US,
  'uk-eng': NONE('GBP'),
  ie: NONE('EUR'),
  'ca-08': NONE('CAD'),
  'ca-02': { deposit: 'halfMonth', withinCap: false, petRent: 0, currency: 'CAD' },
  'mx-09': NONE('MXN'),
};
