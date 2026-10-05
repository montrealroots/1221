/**
 * SLATE — what a kitchen has and what stands in for what (the master plan's
 * §33, from 2026-10-03; `docs/research/world/research-kitchen-gaps.json`).
 *
 * **Small appliances** a recipe asks for and a home doesn't come with, the
 * cheapest found on a big retailer's own pages: in America at Target, a
 * Hamilton Beach 50190J blender at $26.99 and a Kitchen Collection 6-quart
 * slow cooker at $21.99; in Britain at Argos, a Cookworks jug blender at £25
 * and a Cookworks 6.5-liter slow cooker at £33 (read secondhand, Argos
 * refusing the read); in Ireland at DID Electrical, a Braun PowerBlend 1 at
 * €69.99 and a Morphy Richards 6.5-liter at €39.99; in Canada at Best Buy, a
 * Black & Decker BL1220SGC at C$39.99 and a Hamilton Beach 6-quart at C$59.99;
 * in Mexico at Liverpool, a Bosstech 2 blender at MX$429 and a Chefman
 * 4.7-liter slow cooker at MX$689, the cheapest found, a little under the
 * others' size. America's and Canada's are before sales tax.
 *
 * **Cooking's effort**: the 2024 Adult Compendium of Physical Activities'
 * 2.0 METs for cooking or food preparation, standing or sitting, light
 * effort (code 05050).
 *
 * **Substitutes** where a recipe is short, from North Dakota State University
 * Extension's Ingredient Substitutions (FN198, reviewed January 2023), the
 * ones between foods SLATE's recipes use: canned tomatoes for fresh, a
 * 16-ounce can for three medium tomatoes, and back; and oil for butter, 7/8
 * of a cup for a cup. A medium tomato is USDA's 123 g, a can 454 g, and a cup
 * of butter 227 g against 210 ml of oil.
 */

export type Gear = 'blender' | 'slow-cooker';
export const GEAR_LABEL: Readonly<Record<Gear, string>> = { blender: 'Blender', 'slow-cooker': 'Slow Cooker' };

export interface GearOffer {
  gear: Gear; name: string; retailer: string; price: number; currency: string; taxIncluded: boolean; confirmed: boolean;
  /** A model of the wider lineup's, by make (`content/kitchengearlineup.ts`, from 2026-10-05). */
  id?: string; brand?: string; url?: string | null;
}

export const KITCHEN_GEAR: Readonly<Record<string, readonly GearOffer[]>> = {
  us: [
    { gear: 'blender', name: 'Hamilton Beach 50190J Blender', brand: 'Hamilton Beach', retailer: 'Target', price: 26.99, currency: 'USD', taxIncluded: false, confirmed: true },
    { gear: 'slow-cooker', name: 'Kitchen Collection 6-Quart Slow Cooker', brand: 'Kitchen Collection', retailer: 'Target', price: 21.99, currency: 'USD', taxIncluded: false, confirmed: true },
  ],
  uk: [
    { gear: 'blender', name: 'Cookworks 1.5L Jug Blender', brand: 'Cookworks', retailer: 'Argos', price: 25, currency: 'GBP', taxIncluded: true, confirmed: false },
    { gear: 'slow-cooker', name: 'Cookworks 6.5L Slow Cooker', brand: 'Cookworks', retailer: 'Argos', price: 33, currency: 'GBP', taxIncluded: true, confirmed: false },
  ],
  ie: [
    { gear: 'blender', name: 'Braun PowerBlend 1 Jug Blender', brand: 'Braun', retailer: 'DID Electrical', price: 69.99, currency: 'EUR', taxIncluded: true, confirmed: true },
    { gear: 'slow-cooker', name: 'Morphy Richards 6.5L Slow Cooker', brand: 'Morphy Richards', retailer: 'DID Electrical', price: 39.99, currency: 'EUR', taxIncluded: true, confirmed: true },
  ],
  ca: [
    { gear: 'blender', name: 'Black & Decker BL1220SGC Blender', brand: 'Black & Decker', retailer: 'Best Buy', price: 39.99, currency: 'CAD', taxIncluded: false, confirmed: true },
    { gear: 'slow-cooker', name: 'Hamilton Beach 6-Quart Slow Cooker', brand: 'Hamilton Beach', retailer: 'Best Buy', price: 59.99, currency: 'CAD', taxIncluded: false, confirmed: true },
  ],
  mx: [
    { gear: 'blender', name: 'Bosstech 2 Blender', brand: 'Bosstech', retailer: 'Liverpool', price: 429, currency: 'MXN', taxIncluded: true, confirmed: true },
    { gear: 'slow-cooker', name: 'Chefman 4.7L Slow Cooker', brand: 'Chefman', retailer: 'Liverpool', price: 689, currency: 'MXN', taxIncluded: true, confirmed: true },
  ],
};

export const COOKING_MET = 2.0;

/** A substitute, and how much of it stands for a gram (or a count) of what it replaces, by the unit each is kept in. */
export interface Substitute { for: string; use: string; perGram: number; perCount?: number }
export const SUBSTITUTES: readonly Substitute[] = [
  { for: 'tomato', use: 'tomatoes-canned', perGram: 454 / (3 * 123), perCount: 454 / 3 },
  { for: 'tomatoes-canned', use: 'tomato', perGram: (3 * 123) / 454 },
  { for: 'butter', use: 'oil', perGram: 210 / 227 },
];
