/**
 * SLATE — the hierarchy every brand-based catalog is counted by (the owner's
 * expansion of 2026-10-03, §E3). Departments hold categories; a category is
 * the unit the target applies to, never a department or the whole game.
 *
 * The target for a brand-based category: at least 50 real brands, and up to
 * 100 distinct real products from each where the brand makes that many. A
 * service category (hotels, restaurants, clubs, clinics, stores) is counted
 * by providers, branches and bookable offerings instead, and a category whose
 * real market is narrow (aircraft, boats, a town's utilities) keeps its real
 * range and says so. `tools/catalog-coverage.mjs` counts each one from the
 * catalogs themselves into `docs/CATALOG-COVERAGE.md`; nothing here is a
 * count.
 *
 * A product is one distinct model; a variant is a size, color, storage or
 * trim of it; an offer is one seller's listing of it; an owned item is what a
 * player bought. They're counted apart, so a shoe in ten sizes sold by five
 * retailers is one product, ten variants and five offers.
 */

export type CategoryStructure = 'brand' | 'service' | 'narrow';

export interface CatalogCategory {
  id: string;
  department: string;
  label: string;
  structure: CategoryStructure;
  /** What the narrow market really holds, where it can't reach the brand target. */
  realRange?: string;
}

export const BRAND_TARGET = { brands: 50, productsPerBrand: 100 } as const;

export const CATEGORIES: readonly CatalogCategory[] = [
  // Apparel
  { id: 'everyday', department: 'Apparel', label: 'Everyday Clothing', structure: 'brand' },
  { id: 'formalwear', department: 'Apparel', label: 'Formalwear', structure: 'brand' },
  { id: 'outerwear', department: 'Apparel', label: 'Outerwear', structure: 'brand' },
  { id: 'activewear', department: 'Apparel', label: 'Activewear', structure: 'brand' },
  { id: 'underwear', department: 'Apparel', label: 'Underwear, Lingerie And Socks', structure: 'brand' },
  { id: 'sleepwear', department: 'Apparel', label: 'Sleepwear', structure: 'brand' },
  { id: 'swimwear', department: 'Apparel', label: 'Swimwear', structure: 'brand' },
  { id: 'thermals', department: 'Apparel', label: 'Thermals, Shapewear, Hosiery And Slips', structure: 'brand' },
  { id: 'cultural', department: 'Apparel', label: 'Cultural Clothing', structure: 'brand' },
  // Footwear
  { id: 'footwear', department: 'Footwear', label: 'Shoes, Boots And Sandals', structure: 'brand' },
  { id: 'sneakers', department: 'Footwear', label: 'Sneakers', structure: 'brand' },
  // Accessories
  { id: 'bags', department: 'Accessories', label: 'Bags', structure: 'brand' },
  { id: 'accessories', department: 'Accessories', label: 'Hats, Scarves, Belts And Small Accessories', structure: 'brand' },
  { id: 'watches', department: 'Accessories', label: 'Watches', structure: 'brand' },
  { id: 'jewelry', department: 'Accessories', label: 'Jewelry', structure: 'brand' },
  { id: 'luggage', department: 'Accessories', label: 'Luggage', structure: 'brand' },
  // Electronics
  { id: 'phones', department: 'Electronics', label: 'Phones', structure: 'brand' },
  { id: 'consoles', department: 'Electronics', label: 'Game Consoles', structure: 'narrow', realRange: 'three makers sell home consoles: Sony, Microsoft and Nintendo' },
  { id: 'computers', department: 'Electronics', label: 'Computers', structure: 'brand' },
  { id: 'televisions', department: 'Electronics', label: 'Televisions', structure: 'brand' },
  { id: 'audio', department: 'Electronics', label: 'Audio Equipment', structure: 'brand' },
  // Home
  { id: 'furniture', department: 'Home', label: 'Furniture', structure: 'brand' },
  { id: 'mattresses', department: 'Home', label: 'Mattresses And Beds', structure: 'brand' },
  { id: 'bedding', department: 'Home', label: 'Bedding And Towels', structure: 'brand' },
  { id: 'appliances', department: 'Home', label: 'Appliances', structure: 'brand' },
  { id: 'lighting', department: 'Home', label: 'Lighting', structure: 'brand' },
  { id: 'kitchenware', department: 'Home', label: 'Kitchenware', structure: 'brand' },
  // Personal care and the household
  { id: 'toiletries', department: 'Personal Care', label: 'Toiletries And Grooming', structure: 'brand' },
  { id: 'cosmetics', department: 'Personal Care', label: 'Cosmetics And Haircare', structure: 'brand' },
  { id: 'cleaning', department: 'Household', label: 'Cleaning Products And Consumables', structure: 'brand' },
  // Food
  { id: 'groceries', department: 'Food', label: 'Groceries', structure: 'brand' },
  { id: 'beverages', department: 'Food', label: 'Beverages', structure: 'brand' },
  // Vehicles
  { id: 'cars', department: 'Vehicles', label: 'Cars, Pickups And Vans', structure: 'brand' },
  { id: 'motorcycles', department: 'Vehicles', label: 'Motorcycles And Scooters', structure: 'brand' },
  { id: 'bicycles', department: 'Vehicles', label: 'Bicycles, E-Bikes And ATVs', structure: 'brand' },
  { id: 'rvs', department: 'Vehicles', label: 'Motorhomes And Campervans', structure: 'brand' },
  { id: 'boats', department: 'Vehicles', label: 'Boats', structure: 'narrow', realRange: 'recreational boat makers number in the dozens, few publishing prices' },
  { id: 'aircraft', department: 'Vehicles', label: 'Light Aircraft', structure: 'narrow', realRange: 'a handful of makers build new light aircraft for private owners' },
  { id: 'car-options', department: 'Vehicles', label: 'Factory Options', structure: 'brand' },
  { id: 'tires', department: 'Vehicles', label: 'Tires And Wheels', structure: 'brand' },
  { id: 'car-audio', department: 'Vehicles', label: 'Car Audio', structure: 'brand' },
  // Building, garden, sport, pets
  { id: 'building', department: 'Building And Garden', label: 'Building Materials, Fixtures And Finishes', structure: 'brand' },
  { id: 'garden', department: 'Building And Garden', label: 'Garden Equipment', structure: 'brand' },
  { id: 'sports', department: 'Sport', label: 'Sports Equipment', structure: 'brand' },
  { id: 'pet-supplies', department: 'Pets', label: 'Pet Supplies', structure: 'brand' },
  // Services, counted by providers and branches
  { id: 'hotels', department: 'Services', label: 'Hotels', structure: 'service' },
  { id: 'restaurants', department: 'Services', label: 'Restaurants', structure: 'service' },
  { id: 'clubs', department: 'Services', label: 'Clubs And Lessons', structure: 'service' },
  { id: 'clinics', department: 'Services', label: 'Clinics, Dentists And Opticians', structure: 'service' },
  { id: 'stores', department: 'Services', label: 'Stores And Chains', structure: 'service' },
  { id: 'salons', department: 'Services', label: 'Barbers And Salons', structure: 'service' },
];
