/**
 * SLATE — the fridge and freezer an ordinary home has, by country
 * (`docs/research/world/research-cold-storage.json`, read 2026-10-04).
 *
 * - **Britain**, the one sales-weighted split read: GfK's 2010 sales for the
 *   government's Market Transformation Program, 175 liters fresh and 86
 *   frozen.
 * - **America**: the EIA's 2020 RECS, its commonest size (17.6 to 22.5 cubic
 *   feet), split by the IEA's 0.315 freezer share; SLATE's estimate from both.
 * - **Canada**: NRCan's 2019 shipments, the commonest band (16.5 to 18.4
 *   cubic feet); SLATE's estimate.
 * - **Ireland**: the EU's 2014 average fridge-freezer, no Irish figure being
 *   published; a stand-in.
 * - **Mexico**: the middle of CLASP's 9 to 14 cubic feet, most of them
 *   top-freezers; SLATE's estimate.
 * A country not here keeps no limit, which isn't a claim that its fridges are
 * endless: the screen says it isn't known.
 */

export interface ColdStore { fridgeL: number; freezerL: number; status: 'verified' | 'estimate' | 'stand-in'; basis: string }

export const COLD_STORE: Readonly<Record<string, ColdStore>> = {
  us: { fridgeL: 388.8, freezerL: 178.9, status: 'estimate', basis: 'the EIA’s 2020 RECS commonest size, split by the IEA’s freezer share' },
  ca: { fridgeL: 365.2, freezerL: 129, status: 'estimate', basis: 'NRCan’s 2019 commonest shipment size' },
  uk: { fridgeL: 175, freezerL: 86, status: 'verified', basis: 'GfK’s 2010 sales for the Market Transformation Program' },
  ie: { fridgeL: 215.6, freezerL: 93.9, status: 'stand-in', basis: 'the EU’s 2014 average, no Irish figure published' },
  mx: { fridgeL: 240.7, freezerL: 85, status: 'estimate', basis: 'the middle of CLASP’s range for Mexico' },
};
