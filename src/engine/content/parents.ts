/**
 * SLATE — a life's own parents, and caring for them (Stage 10 of
 * `docs/BACKLOG.md`, from 2026-10-02), from
 * `docs/research/world/research-gaps-family.json` and the ACL's long-term
 * care figures (acl.gov, read 2026-10-02).
 *
 * **Their ages.** A mother's mean age at a first birth where you were born:
 * America's 27.5 (2023), England and Wales's 29.4 (2024), Ireland's 31.7
 * (2024), Canada's 31.3, Mexico's 22 (2020). A father's mean age at a birth
 * where it's published, England and Wales's 33.9 and Ireland's 35.5; elsewhere
 * none was read, and SLATE takes the mother's. Each dies by SLATE's life
 * table for their country (`systems/mortality.ts`), drawn once.
 *
 * **Care.** Someone turning 65 has almost a 70% chance of needing long-term
 * care, women for 3.7 years on average and men 2.2 (ACL); 65% use care at
 * home, 37% a facility, and SLATE draws a facility at 37% and home care
 * otherwise. Taken everywhere, the ACL's being the figure published. The
 * care comes in the years before they die.
 *
 * **What it costs, paid for**, where they live: in America CareScout's 2025
 * home health aide by the hour for the 27 hours a week the average caregiver
 * gives (AARP), or assisted living by the month; in Britain a care home's
 * £1,298 a week (residential); Ontario's long-term care co-payment, $2,129.17
 * a month for a basic room (from July 2026); British Columbia's 80% of the
 * resident's income, at its $1,507.70 a month least; Mexico City's private
 * residences, the middle of the basic tier's MX$8,000 to MX$16,000 (a
 * directory's figures). Home care outside America, and Ireland's Fair Deal
 * (80% of the resident's own income), aren't the family's to pay, and aren't
 * charged.
 *
 * **Given yourself**, the hours a week a carer gives where you live:
 * America's 27 (AARP), Canada's median 8 (StatCan), Mexico's 25.6 for men
 * and 37.9 for women, the middle taken (ENASIC 2022); Britain and Ireland
 * publish no hours for all carers, and take America's.
 */

export const PARENT_AGE: Readonly<Record<string, { mother: number; father?: number }>> = {
  us: { mother: 27.5 }, uk: { mother: 29.4, father: 33.9 }, ie: { mother: 31.7, father: 35.5 }, ca: { mother: 31.3 }, mx: { mother: 22 },
};

export const CARE_NEED = { from: 65, share: 0.7, years: { mother: 3.7, father: 2.2 }, facility: 0.37 } as const;

export interface CarePrice { currency: string; homeHourly?: number; facilityMonthly?: number }
export const CARE_PRICE: Readonly<Record<string, CarePrice>> = {
  'us-ny': { currency: 'USD', homeHourly: 35, facilityMonthly: 7_110 },
  'us-ca': { currency: 'USD', homeHourly: 40, facilityMonthly: 7_000 },
  'us-ct': { currency: 'USD', homeHourly: 36, facilityMonthly: 9_118 },
  uk: { currency: 'GBP', facilityMonthly: (1_298 * 52) / 12 },
  'ca-08': { currency: 'CAD', facilityMonthly: 2_129.17 },
  'ca-02': { currency: 'CAD', facilityMonthly: 1_507.7 },
  mx: { currency: 'MXN', facilityMonthly: (8_000 + 16_000) / 2 },
};

/** A carer's hours a week, by country. */
export const CARE_HOURS: Readonly<Record<string, number>> = { us: 27, ca: 8, mx: (25.6 + 37.9) / 2, uk: 27, ie: 27 };

/** SLATE's estimates: the stress an hour of caring adds, and the morale a parent's death takes. */
export const CARING = { stressPerHour: 0.05, grief: 15 } as const;
