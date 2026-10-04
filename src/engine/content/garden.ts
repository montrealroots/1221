/**
 * SLATE — what a garden bed and a greenhouse grow, and when, from
 * `docs/research/world/research-special-rooms-outdoor.json` (read 2026-10-04).
 *
 * - **Crops**: tomatoes, lettuce and peppers, each the food the kitchen
 *   already knows. Days to harvest are the middle of the University of
 *   Georgia Extension's planting chart (tomatoes 70 to 90, lettuce 60 to 85,
 *   bell peppers 65 to 80). Yields are the middle of Virginia Tech
 *   Extension's row yields over each row's ground, SLATE's reckoning from
 *   them (tomatoes 1.8 to 7.3 kg a square meter, head lettuce 0.65 to 2.3,
 *   peppers 0.81 to 3.5). A head of lettuce weighs Colorado State's half
 *   pound, six heads to three pounds of a four-foot row.
 * - **A bed** is HomeGuide's five by twelve feet; **a greenhouse** its
 *   hundred square feet.
 * - **The outdoor season** is between the last spring and first autumn frost:
 *   NOAA's 1991-2020 normals for New York and New Haven; Environment Canada's
 *   1981-2010 for Toronto (downtown) and Vancouver; none at Los Angeles's
 *   airport or Mexico City's Tacubaya in thirty years, so the year round;
 *   London and Dublin publish frost days by month, not dates, and their
 *   months with next to none are taken (London May to September, Dublin June
 *   to September), SLATE's reading. A greenhouse grows the year round,
 *   SLATE's reading: no heating is kept.
 * - **Time**: planting and picking a bed take half an hour each, SLATE's
 *   estimate; no extension service publishes a home gardener's time a bed.
 */

import type { FoodUnit, Storage } from './groceries';

export type Crop = 'tomato' | 'lettuce' | 'pepper';
export interface CropInfo { label: string; days: number; kgPerM2: number; food: string; unit: FoodUnit; /** Grams a count, where it's counted. */ gEach?: number; storage: Storage; keepsDays: number }

export const CROPS: Readonly<Record<Crop, CropInfo>> = {
  tomato: { label: 'Tomatoes', days: 80, kgPerM2: (1.8 + 7.3) / 2, food: 'tomato', unit: 'g', storage: 'pantry', keepsDays: 7 },
  lettuce: { label: 'Lettuce', days: 72, kgPerM2: (0.65 + 2.3) / 2, food: 'lettuce', unit: 'ct', gEach: 227, storage: 'fridge', keepsDays: 7 },
  pepper: { label: 'Peppers', days: 72, kgPerM2: (0.81 + 3.5) / 2, food: 'pepper', unit: 'g', storage: 'fridge', keepsDays: 7 },
};

const SQFT_M2 = 0.092903;
export const PLOT_M2 = { bed: 60 * SQFT_M2, greenhouse: 100 * SQFT_M2 } as const;
export const GARDEN_MINUTES = { plant: 30, pick: 30 } as const;

/** The months and days outdoors are frost-free, by town; the year round where there's no frost. */
export const FROST_FREE: Readonly<Record<string, { from: string; to: string } | 'year'>> = {
  'us-ny-newyork': { from: '03-30', to: '11-20' },
  'us-ct-newhaven': { from: '04-17', to: '10-27' },
  'us-ca-losangeles': 'year',
  'ca-on-toronto': { from: '04-13', to: '11-03' },
  'ca-bc-vancouver': { from: '03-18', to: '11-10' },
  'uk-eng-london': { from: '05-01', to: '09-30' },
  'ie-lei-dublin': { from: '06-01', to: '09-30' },
  'mx-cmx-mexicocity': 'year',
};
