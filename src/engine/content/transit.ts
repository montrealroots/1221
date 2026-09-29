/**
 * SLATE — a single ride on a city's own transit, to or from a station
 * (from 2026-09-29), researched from the operators and kept in
 * `docs/research/world/research-buses-transit.json`. Each is the adult fare
 * for one ride, or one ride's window, paid by card or tap; a town not here
 * has no fare kept yet, and its rides say so.
 */

import type { RateSteps } from './career';

export interface TransitFare {
  steps: RateSteps;
  currency: string;
  basis: string;
}

export const TRANSIT: Readonly<Record<string, TransitFare>> = {
  'us-ny-newyork': { steps: [['2026-01-04', 3_00]], currency: 'USD', basis: 'The MTA’s subway and local bus fare by OMNY, $3.00 from January 2026.' },
  'us-ca-losangeles': { steps: [['2023-07-01', 1_75]], currency: 'USD', basis: 'LA Metro’s one-way fare, bus or rail, $1.75.' },
  'us-ct-newhaven': { steps: [['2024-01-01', 1_75]], currency: 'USD', basis: 'CTtransit’s two-hour pass, $1.75.' },
  'us-dc-washington': { steps: [['2026-07-01', 2_25]], currency: 'USD', basis: 'WMATA’s Metrorail base fare, $2.25, from Tariff 49 (1 July 2026).' },
  'us-ma-boston': { steps: [['2026-09-01', 2_40]], currency: 'USD', basis: 'The MBTA’s subway fare, $2.40.' },
  'us-pa-philadelphia': { steps: [['2024-12-01', 2_90]], currency: 'USD', basis: 'SEPTA’s bus and Metro fare, $2.90.' },
  'us-ca-sandiego': { steps: [['2024-01-01', 2_50], ['2026-10-01', 3_00]], currency: 'USD', basis: 'MTS’s regional one-way fare, $2.50, and $3.00 from 1 October 2026.' },
  'uk-eng-london': { steps: [['2026-03-01', 3_00]], currency: 'GBP', basis: 'The Tube in zone 1 off-peak by contactless, £3.00 from 1 March 2026, read secondhand.' },
  'uk-eng-manchester': { steps: [['2026-01-01', 2_00]], currency: 'GBP', basis: 'The Bee Network’s £2 bus single, frozen for 2026, read secondhand.' },
  'ie-lei-dublin': { steps: [['2024-01-01', 2_00], ['2027-01-01', 2_30]], currency: 'EUR', basis: 'TFI’s 90-minute fare by Leap, €2.00, and €2.30 from January 2027.' },
  'ie-m-cork': { steps: [['2026-07-20', 1_70]], currency: 'EUR', basis: 'Cork’s flat Leap fare, €1.70 from 20 July 2026.' },
  'fr-idf-paris': { steps: [['2026-01-01', 2_55]], currency: 'EUR', basis: 'Île-de-France Mobilités’ Métro-Train-RER ticket, €2.55 from 1 January 2026.' },
  'be-bru-brussels': { steps: [['2026-02-01', 2_40]], currency: 'EUR', basis: 'STIB’s single journey, €2.40 from 1 February 2026, read secondhand.' },
  // GVB charges by the kilometer: €1.16 to board and €0.217 a kilometer, for the five kilometers SLATE takes a station to be.
  'nl-07-amsterdam': { steps: [['2026-01-01', 1_16 + Math.round(21.7 * 5)]], currency: 'EUR', basis: 'GVB’s €1.16 to board and €0.217 a kilometer (1 January 2026), for SLATE’s five kilometers.' },
  'mx-cmx-mexicocity': { steps: [['2024-01-01', 5_00]], currency: 'MXN', basis: 'The Metro’s flat 5 pesos, read secondhand.' },
  'ca-on-toronto': { steps: [['2026-01-01', 3_30]], currency: 'CAD', basis: 'The TTC’s adult fare by PRESTO or card, $3.30.' },
  'ca-bc-vancouver': { steps: [['2026-07-01', 2_85]], currency: 'CAD', basis: 'TransLink’s one-zone fare by Compass, $2.85 from 1 July 2026.' },
};
