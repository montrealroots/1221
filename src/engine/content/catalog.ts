/**
 * SLATE — Commerce catalogue.
 *
 * Retailers, groceries, prepared food, clothing, watches, jewellery, furniture,
 * electronics and services. Brands are original to SLATE; prices are
 * calibrated to plausible ranges and then adjusted by the local cost-of-living
 * index at the point of sale.
 */

import { Registry, REFERENCE_VERSION, type ReferenceRecord } from './reference';
import type { Money } from '../core/money';

const V = REFERENCE_VERSION;
const SIM = { source: 'simulated', confidence: 'high', version: V, note: 'Original to SLATE.' } as const;

export interface Retailer extends ReferenceRecord {
  type: 'grocery' | 'department' | 'boutique' | 'electronics' | 'furniture' | 'jeweller' | 'restaurant' | 'service' | 'dealer' | 'online';
  /** 1 = discount, 5 = luxury. */
  tier: 1 | 2 | 3 | 4 | 5;
  /** Multiplier on catalogue base price. */
  priceMultiplier: number;
  categories: string[];
  /** Cities where it operates. Empty means everywhere. */
  locations: string[];
  online: boolean;
  deliveryDays: number;
  description: string;
}

export const RETAILERS = new Registry<Retailer>('retailers', [
  { id: 'valuemart', name: 'ValueMart', type: 'grocery', tier: 1, priceMultiplier: 0.82, categories: ['groceries', 'household', 'clothing'], locations: [], online: true, deliveryDays: 2, description: 'Everything, cheaply, under fluorescent light.', ...SIM },
  { id: 'greenrow', name: 'Green Row Market', type: 'grocery', tier: 3, priceMultiplier: 1.35, categories: ['groceries', 'prepared'], locations: [], online: true, deliveryDays: 1, description: 'Organic produce and a cheese counter with opinions.', ...SIM },
  { id: 'cornerstore', name: 'The Corner Store', type: 'grocery', tier: 2, priceMultiplier: 1.15, categories: ['groceries'], locations: [], online: false, deliveryDays: 0, description: 'Two blocks away, open late, forty percent more expensive.', ...SIM },
  { id: 'hallidays', name: "Halliday's", type: 'department', tier: 4, priceMultiplier: 1.6, categories: ['clothing', 'footwear', 'accessory', 'home'], locations: [], online: true, deliveryDays: 3, description: 'The department store your grandmother trusted, still going.', ...SIM },
  { id: 'northfield', name: 'Northfield & Co.', type: 'boutique', tier: 5, priceMultiplier: 2.8, categories: ['clothing', 'footwear', 'accessory'], locations: ['us-ca-losangeles', 'us-ny-newyork', 'uk-eng-london', 'fr-idf-paris'], online: true, deliveryDays: 5, description: 'A tailor on the second floor and an appointment book on the first.', ...SIM },
  { id: 'basewear', name: 'Basewear', type: 'boutique', tier: 2, priceMultiplier: 0.9, categories: ['clothing', 'footwear'], locations: [], online: true, deliveryDays: 3, description: 'Well-made basics that last three years instead of one.', ...SIM },
  { id: 'circuitline', name: 'Circuitline', type: 'electronics', tier: 3, priceMultiplier: 1.0, categories: ['electronics', 'equipment'], locations: [], online: true, deliveryDays: 2, description: 'Consumer electronics and a surprisingly good camera department.', ...SIM },
  { id: 'formhouse', name: 'Form House', type: 'furniture', tier: 3, priceMultiplier: 1.1, categories: ['furniture', 'appliance', 'home'], locations: [], online: true, deliveryDays: 14, description: 'Mid-century-adjacent furniture that arrives in a fortnight.', ...SIM },
  { id: 'atelier_maison', name: 'Atelier Maison', type: 'furniture', tier: 5, priceMultiplier: 3.4, categories: ['furniture', 'art', 'home'], locations: ['us-ca-losangeles', 'us-ny-newyork', 'it-laz-rome'], online: false, deliveryDays: 60, description: 'Commissioned pieces, twelve-week lead times and a designer who visits the house.', ...SIM },
  { id: 'meridian_time', name: 'Meridian Timepieces', type: 'jeweller', tier: 5, priceMultiplier: 1.0, categories: ['watch', 'jewelry'], locations: ['us-ca-losangeles', 'us-ny-newyork', 'uk-eng-london', 'ae-du-dubai'], online: false, deliveryDays: 0, description: 'Authorised dealer. Waiting lists on the pieces you actually want.', ...SIM },
  { id: 'silverbend', name: 'Silverbend Jewellers', type: 'jeweller', tier: 3, priceMultiplier: 1.0, categories: ['jewelry'], locations: [], online: true, deliveryDays: 7, description: 'Engagement rings, repairs and an honest appraisal.', ...SIM },
  { id: 'everline', name: 'Everline', type: 'online', tier: 2, priceMultiplier: 0.95, categories: ['groceries', 'household', 'electronics', 'clothing', 'home', 'furniture'], locations: [], online: true, deliveryDays: 2, description: 'Ships anything within two days and knows too much about you.', ...SIM },
]);

export interface CatalogItem extends ReferenceRecord {
  type: 'product';
  category: string;
  subcategory: string;
  /** Base price in cents before retailer multiplier and local cost of living. */
  basePrice: Money;
  brand: string;
  /** Tags used by search and by systems that care about item properties. */
  tags: string[];
  /** Quality 0-100 — feeds room quality, style score and wellbeing. */
  quality: number;
  /** Annual depreciation as a decimal; negative means it appreciates. */
  depreciation: number;
  /** Grocery only. */
  shelfLifeDays?: number;
  unit?: string;
  /** Nutrition abstraction: how much nourishment one unit restores. */
  nourishment?: number;
  /** Wardrobe only. */
  slot?: string;
  formality?: number;
  seasons?: string[];
  /** Furniture only. */
  roomKinds?: string[];
  qualityContribution?: number;
}

function item(spec: Omit<CatalogItem, 'type' | 'source' | 'confidence' | 'version' | 'note'>): CatalogItem {
  return { ...spec, type: 'product', ...SIM };
}

const g = (id: string, name: string, sub: string, price: number, shelf: number, unit: string, nourishment: number, quality = 55): CatalogItem =>
  item({ id, name, category: 'groceries', subcategory: sub, basePrice: price, brand: 'Market', tags: ['grocery', sub], quality, depreciation: 0, shelfLifeDays: shelf, unit, nourishment });

export const CATALOG = new Registry<CatalogItem>('catalog', [
  // --- Groceries ---
  g('milk', 'Milk', 'dairy', 4_29, 10, 'half gallon', 8),
  g('eggs', 'Eggs', 'dairy', 5_49, 24, 'dozen', 14),
  g('bread', 'Bread', 'bakery', 3_99, 6, 'loaf', 12),
  g('butter', 'Butter', 'dairy', 5_79, 60, 'pound', 6),
  g('cheese', 'Cheddar', 'dairy', 6_49, 30, 'block', 10),
  g('chicken_breast', 'Chicken Breast', 'protein', 9_99, 4, 'pound', 22, 62),
  g('ground_beef', 'Ground Beef', 'protein', 8_49, 3, 'pound', 24, 58),
  g('salmon', 'Salmon Fillet', 'protein', 15_99, 2, 'pound', 26, 78),
  g('rice', 'Rice', 'pantry', 4_99, 720, 'two pounds', 20),
  g('pasta', 'Pasta', 'pantry', 2_49, 720, 'pound', 18),
  g('olive_oil', 'Olive Oil', 'pantry', 12_99, 540, 'bottle', 4, 68),
  g('coffee', 'Coffee Beans', 'pantry', 14_99, 180, 'pound', 3, 72),
  g('tomatoes', 'Tomatoes', 'produce', 3_99, 7, 'pound', 6, 60),
  g('onions', 'Onions', 'produce', 2_49, 30, 'pound', 5),
  g('garlic', 'Garlic', 'produce', 1_29, 60, 'head', 1),
  g('spinach', 'Spinach', 'produce', 4_49, 5, 'bag', 5, 70),
  g('potatoes', 'Potatoes', 'produce', 4_99, 30, 'five pounds', 18),
  g('apples', 'Apples', 'produce', 5_49, 21, 'bag', 10, 66),
  g('bananas', 'Bananas', 'produce', 2_29, 6, 'bunch', 9, 64),
  g('cereal', 'Breakfast Cereal', 'pantry', 5_99, 240, 'box', 14, 40),
  g('frozen_pizza', 'Frozen Pizza', 'frozen', 7_49, 240, 'each', 16, 28),
  g('ice_cream', 'Ice Cream', 'frozen', 6_99, 180, 'pint', 6, 35),
  g('wine_mid', 'Bottle of Wine', 'alcohol', 22_00, 1800, 'bottle', 2, 68),
  g('wine_fine', 'Fine Wine', 'alcohol', 145_00, 3600, 'bottle', 2, 92),
  g('sparkling', 'Sparkling Water', 'beverage', 6_99, 365, 'twelve pack', 1),

  // --- Prepared food and dining ---
  item({ id: 'coffee_out', name: 'Coffee Out', category: 'dining', subcategory: 'cafe', basePrice: 6_25, brand: 'Cafe', tags: ['quick', 'social'], quality: 60, depreciation: 0, nourishment: 4 }),
  item({ id: 'lunch_casual', name: 'Casual Lunch', category: 'dining', subcategory: 'casual', basePrice: 19_00, brand: 'Restaurant', tags: ['meal'], quality: 58, depreciation: 0, nourishment: 30 }),
  item({ id: 'dinner_midrange', name: 'Dinner Out', category: 'dining', subcategory: 'midrange', basePrice: 62_00, brand: 'Restaurant', tags: ['meal', 'date'], quality: 72, depreciation: 0, nourishment: 38 }),
  item({ id: 'dinner_fine', name: 'Fine Dining', category: 'dining', subcategory: 'fine', basePrice: 245_00, brand: 'Restaurant', tags: ['meal', 'date', 'impressive'], quality: 94, depreciation: 0, nourishment: 34 }),
  item({ id: 'dinner_tasting', name: 'Tasting Menu', category: 'dining', subcategory: 'fine', basePrice: 480_00, brand: 'Restaurant', tags: ['meal', 'date', 'impressive', 'occasion'], quality: 99, depreciation: 0, nourishment: 36 }),
  item({ id: 'takeout', name: 'Takeout', category: 'dining', subcategory: 'takeout', basePrice: 28_00, brand: 'Restaurant', tags: ['meal', 'fast'], quality: 48, depreciation: 0, nourishment: 32 }),
  item({ id: 'delivery', name: 'Delivery', category: 'dining', subcategory: 'delivery', basePrice: 38_00, brand: 'Delivery', tags: ['meal', 'convenient'], quality: 46, depreciation: 0, nourishment: 32 }),

  // --- Clothing ---
  item({ id: 'tshirt_basic', name: 'Cotton T-Shirt', category: 'clothing', subcategory: 'top', basePrice: 24_00, brand: 'Basewear', tags: ['casual'], quality: 45, depreciation: 0.45, slot: 'top', formality: 10, seasons: ['Spring', 'Summer', 'Autumn'] }),
  item({ id: 'shirt_oxford', name: 'Oxford Shirt', category: 'clothing', subcategory: 'top', basePrice: 89_00, brand: 'Basewear', tags: ['smart casual'], quality: 62, depreciation: 0.28, slot: 'top', formality: 45, seasons: ['Spring', 'Autumn', 'Winter'] }),
  item({ id: 'jeans', name: 'Selvedge Jeans', category: 'clothing', subcategory: 'bottom', basePrice: 185_00, brand: 'Basewear', tags: ['casual', 'durable'], quality: 72, depreciation: 0.18, slot: 'bottom', formality: 20, seasons: ['Spring', 'Autumn', 'Winter'] }),
  item({ id: 'trousers_wool', name: 'Wool Trousers', category: 'clothing', subcategory: 'bottom', basePrice: 240_00, brand: "Halliday's", tags: ['smart'], quality: 74, depreciation: 0.22, slot: 'bottom', formality: 65, seasons: ['Autumn', 'Winter'] }),
  item({ id: 'suit_offrack', name: 'Off-the-Rack Suit', category: 'clothing', subcategory: 'suit', basePrice: 695_00, brand: "Halliday's", tags: ['formal'], quality: 66, depreciation: 0.25, slot: 'outfit', formality: 85, seasons: ['Spring', 'Autumn', 'Winter'] }),
  item({ id: 'suit_mtm', name: 'Made-to-Measure Suit', category: 'clothing', subcategory: 'suit', basePrice: 3_400_00, brand: 'Northfield & Co.', tags: ['formal', 'impressive'], quality: 92, depreciation: 0.15, slot: 'outfit', formality: 92, seasons: ['Spring', 'Autumn', 'Winter'] }),
  item({ id: 'tuxedo', name: 'Dinner Suit', category: 'clothing', subcategory: 'suit', basePrice: 2_800_00, brand: 'Northfield & Co.', tags: ['black tie', 'red carpet'], quality: 94, depreciation: 0.10, slot: 'outfit', formality: 100, seasons: ['Spring', 'Summer', 'Autumn', 'Winter'] }),
  item({ id: 'gown_couture', name: 'Couture Gown', category: 'clothing', subcategory: 'formal', basePrice: 12_500_00, brand: 'Northfield & Co.', tags: ['red carpet', 'impressive', 'press'], quality: 99, depreciation: 0.20, slot: 'outfit', formality: 100, seasons: ['Spring', 'Summer', 'Autumn', 'Winter'] }),
  item({ id: 'coat_wool', name: 'Wool Overcoat', category: 'clothing', subcategory: 'outerwear', basePrice: 780_00, brand: "Halliday's", tags: ['winter'], quality: 80, depreciation: 0.12, slot: 'outerwear', formality: 70, seasons: ['Autumn', 'Winter'] }),
  item({ id: 'jacket_leather', name: 'Leather Jacket', category: 'clothing', subcategory: 'outerwear', basePrice: 1_150_00, brand: 'Northfield & Co.', tags: ['casual', 'signature'], quality: 86, depreciation: 0.08, slot: 'outerwear', formality: 35, seasons: ['Spring', 'Autumn'] }),
  item({ id: 'sneakers', name: 'Leather Sneakers', category: 'footwear', subcategory: 'casual', basePrice: 175_00, brand: 'Basewear', tags: ['casual'], quality: 60, depreciation: 0.40, slot: 'shoes', formality: 20, seasons: ['Spring', 'Summer', 'Autumn'] }),
  item({ id: 'oxfords', name: 'Oxford Shoes', category: 'footwear', subcategory: 'formal', basePrice: 620_00, brand: "Halliday's", tags: ['formal', 'resoleable'], quality: 84, depreciation: 0.10, slot: 'shoes', formality: 90, seasons: ['Spring', 'Autumn', 'Winter'] }),
  item({ id: 'heels_designer', name: 'Designer Heels', category: 'footwear', subcategory: 'formal', basePrice: 985_00, brand: 'Northfield & Co.', tags: ['formal', 'red carpet'], quality: 88, depreciation: 0.22, slot: 'shoes', formality: 92, seasons: ['Spring', 'Summer', 'Autumn', 'Winter'] }),

  // --- Watches and jewellery ---
  item({ id: 'watch_field', name: 'Field Watch', category: 'watch', subcategory: 'tool', basePrice: 425_00, brand: 'Kestrel Instruments', tags: ['everyday'], quality: 58, depreciation: 0.20 }),
  item({ id: 'watch_diver', name: 'Dive Watch', category: 'watch', subcategory: 'sport', basePrice: 3_900_00, brand: 'Meridian', tags: ['everyday', 'holds value'], quality: 82, depreciation: 0.02 }),
  item({ id: 'watch_dress', name: 'Dress Watch', category: 'watch', subcategory: 'dress', basePrice: 8_600_00, brand: 'Meridian', tags: ['formal', 'holds value'], quality: 88, depreciation: 0.01 }),
  item({ id: 'watch_chrono', name: 'Steel Chronograph', category: 'watch', subcategory: 'chronograph', basePrice: 16_500_00, brand: 'Meridian', tags: ['grail', 'appreciates', 'waitlist'], quality: 95, depreciation: -0.04 }),
  item({ id: 'watch_grand', name: 'Grand Complication', category: 'watch', subcategory: 'complication', basePrice: 148_000_00, brand: 'Aurelian', tags: ['grail', 'appreciates', 'collector'], quality: 100, depreciation: -0.03 }),
  item({ id: 'chain_gold', name: 'Gold Chain', category: 'jewelry', subcategory: 'chain', basePrice: 3_200_00, brand: 'Silverbend', tags: ['signature'], quality: 70, depreciation: -0.01 }),
  item({ id: 'necklace_diamond', name: 'Diamond Necklace', category: 'jewelry', subcategory: 'necklace', basePrice: 42_000_00, brand: 'Aurelian', tags: ['red carpet', 'insured'], quality: 94, depreciation: -0.005 }),
  item({ id: 'ring_engagement_1', name: 'Engagement Ring, One Carat', category: 'jewelry', subcategory: 'engagement', basePrice: 8_500_00, brand: 'Silverbend', tags: ['engagement'], quality: 78, depreciation: 0.10 }),
  item({ id: 'ring_engagement_3', name: 'Engagement Ring, Three Carat', category: 'jewelry', subcategory: 'engagement', basePrice: 62_000_00, brand: 'Aurelian', tags: ['engagement', 'insured'], quality: 94, depreciation: 0.06 }),
  item({ id: 'ring_wedding_band', name: 'Wedding Band', category: 'jewelry', subcategory: 'wedding', basePrice: 2_400_00, brand: 'Silverbend', tags: ['wedding'], quality: 74, depreciation: 0.05 }),

  // --- Furniture and home ---
  item({ id: 'sofa_basic', name: 'Two-Seat Sofa', category: 'furniture', subcategory: 'seating', basePrice: 890_00, brand: 'Form House', tags: ['living'], quality: 52, depreciation: 0.20, roomKinds: ['living', 'den'], qualityContribution: 8 }),
  item({ id: 'sofa_designer', name: 'Designer Sectional', category: 'furniture', subcategory: 'seating', basePrice: 9_800_00, brand: 'Atelier Maison', tags: ['living', 'statement'], quality: 92, depreciation: 0.12, roomKinds: ['living', 'den', 'theater'], qualityContribution: 22 }),
  item({ id: 'bed_queen', name: 'Queen Bed and Mattress', category: 'furniture', subcategory: 'bedroom', basePrice: 1_650_00, brand: 'Form House', tags: ['bedroom', 'sleep'], quality: 62, depreciation: 0.18, roomKinds: ['bedroom'], qualityContribution: 12 }),
  item({ id: 'bed_king_lux', name: 'King Bed, Luxury Mattress', category: 'furniture', subcategory: 'bedroom', basePrice: 7_400_00, brand: 'Atelier Maison', tags: ['bedroom', 'sleep', 'recovery'], quality: 94, depreciation: 0.14, roomKinds: ['bedroom'], qualityContribution: 24 }),
  item({ id: 'dining_table', name: 'Dining Table, Six Seats', category: 'furniture', subcategory: 'dining', basePrice: 2_100_00, brand: 'Form House', tags: ['dining', 'entertaining'], quality: 66, depreciation: 0.14, roomKinds: ['dining', 'kitchen'], qualityContribution: 14 }),
  item({ id: 'desk_work', name: 'Writing Desk', category: 'furniture', subcategory: 'office', basePrice: 1_250_00, brand: 'Form House', tags: ['office', 'writing'], quality: 68, depreciation: 0.15, roomKinds: ['office', 'bedroom'], qualityContribution: 12 }),
  item({ id: 'rug_persian', name: 'Hand-Knotted Rug', category: 'furniture', subcategory: 'decor', basePrice: 6_800_00, brand: 'Atelier Maison', tags: ['decor', 'appreciates'], quality: 90, depreciation: -0.01, roomKinds: ['living', 'dining', 'office', 'bedroom'], qualityContribution: 16 }),
  item({ id: 'art_print', name: 'Framed Print', category: 'art', subcategory: 'print', basePrice: 340_00, brand: 'Gallery', tags: ['decor'], quality: 50, depreciation: 0.10, roomKinds: [], qualityContribution: 5 }),
  item({ id: 'art_original', name: 'Original Painting', category: 'art', subcategory: 'original', basePrice: 28_000_00, brand: 'Gallery', tags: ['decor', 'investment', 'insured'], quality: 96, depreciation: -0.05, roomKinds: [], qualityContribution: 26 }),
  item({ id: 'fridge_std', name: 'Refrigerator', category: 'appliance', subcategory: 'kitchen', basePrice: 1_450_00, brand: 'Circuitline', tags: ['kitchen', 'storage'], quality: 60, depreciation: 0.12, roomKinds: ['kitchen'], qualityContribution: 10 }),
  item({ id: 'range_pro', name: 'Professional Range', category: 'appliance', subcategory: 'kitchen', basePrice: 11_500_00, brand: 'Atelier Maison', tags: ['kitchen', 'cooking'], quality: 94, depreciation: 0.10, roomKinds: ['kitchen'], qualityContribution: 20 }),
  item({ id: 'washer_dryer', name: 'Washer and Dryer', category: 'appliance', subcategory: 'laundry', basePrice: 2_300_00, brand: 'Circuitline', tags: ['laundry'], quality: 62, depreciation: 0.13, roomKinds: ['laundry'], qualityContribution: 8 }),

  // --- Electronics ---
  item({ id: 'laptop', name: 'Laptop', category: 'electronics', subcategory: 'computer', basePrice: 2_400_00, brand: 'Circuitline', tags: ['work', 'writing', 'editing'], quality: 72, depreciation: 0.32 }),
  item({ id: 'laptop_pro', name: 'Workstation Laptop', category: 'electronics', subcategory: 'computer', basePrice: 5_800_00, brand: 'Circuitline', tags: ['work', 'editing', 'vfx'], quality: 92, depreciation: 0.30 }),
  item({ id: 'phone', name: 'Smartphone', category: 'electronics', subcategory: 'phone', basePrice: 1_250_00, brand: 'Circuitline', tags: ['social', 'filming'], quality: 70, depreciation: 0.38 }),
  item({ id: 'tv_oled', name: 'OLED Television', category: 'electronics', subcategory: 'display', basePrice: 3_400_00, brand: 'Circuitline', tags: ['home theater', 'watching'], quality: 84, depreciation: 0.26, roomKinds: ['living', 'theater', 'bedroom'], qualityContribution: 12 }),
  item({ id: 'projector_cinema', name: 'Cinema Projector', category: 'electronics', subcategory: 'display', basePrice: 24_000_00, brand: 'Circuitline', tags: ['home theater', 'screening'], quality: 96, depreciation: 0.22, roomKinds: ['theater'], qualityContribution: 28 }),
  item({ id: 'camera_mirrorless', name: 'Mirrorless Camera', category: 'electronics', subcategory: 'camera', basePrice: 3_200_00, brand: 'Circuitline', tags: ['content', 'filming'], quality: 80, depreciation: 0.22 }),
  item({ id: 'mic_shotgun', name: 'Shotgun Microphone', category: 'electronics', subcategory: 'audio', basePrice: 890_00, brand: 'Circuitline', tags: ['content', 'sound'], quality: 78, depreciation: 0.18 }),
  item({ id: 'light_kit', name: 'LED Lighting Kit', category: 'electronics', subcategory: 'lighting', basePrice: 1_400_00, brand: 'Circuitline', tags: ['content', 'self tape'], quality: 76, depreciation: 0.20 }),
]);

/** Retail price for an item at a retailer in a city, before tax. */
export function retailPrice(itemId: string, retailerId: string, costOfLivingMultiplier: number): Money {
  const it = CATALOG.require(itemId);
  const r = RETAILERS.require(retailerId);
  const localised = 1 + (costOfLivingMultiplier - 1) * 0.6;
  return Math.round(it.basePrice * r.priceMultiplier * localised);
}

export function retailersFor(category: string, cityId: string): Retailer[] {
  return RETAILERS.all().filter(
    (r) => r.categories.includes(category) && (r.locations.length === 0 || r.locations.includes(cityId)),
  );
}

export interface Recipe extends ReferenceRecord {
  type: 'recipe';
  ingredients: { catalogId: string; quantity: number }[];
  prepMinutes: number;
  difficulty: number;
  servings: number;
  nourishment: number;
  quality: number;
  meal: 'breakfast' | 'lunch' | 'dinner' | 'snack' | 'drink';
}

function recipe(id: string, name: string, meal: Recipe['meal'], ingredients: [string, number][], prepMinutes: number, difficulty: number, servings: number, nourishment: number, quality: number): Recipe {
  return {
    id, name, type: 'recipe', meal,
    ingredients: ingredients.map(([catalogId, quantity]) => ({ catalogId, quantity })),
    prepMinutes, difficulty, servings, nourishment, quality, ...SIM,
  };
}

export const RECIPES = new Registry<Recipe>('recipes', [
  recipe('scrambled_eggs', 'Scrambled Eggs on Toast', 'breakfast', [['eggs', 0.25], ['butter', 0.05], ['bread', 0.2]], 12, 10, 1, 26, 55),
  recipe('cereal_bowl', 'Cereal and Milk', 'breakfast', [['cereal', 0.15], ['milk', 0.2]], 3, 2, 1, 18, 30),
  recipe('coffee_home', 'Coffee at Home', 'drink', [['coffee', 0.05]], 6, 8, 1, 3, 62),
  recipe('sandwich', 'Sandwich', 'lunch', [['bread', 0.25], ['cheese', 0.15], ['tomatoes', 0.2]], 8, 8, 1, 28, 48),
  recipe('pasta_simple', 'Pasta with Tomato and Garlic', 'dinner', [['pasta', 0.4], ['tomatoes', 0.5], ['garlic', 0.4], ['olive_oil', 0.05]], 25, 22, 2, 34, 62),
  recipe('roast_chicken', 'Roast Chicken and Potatoes', 'dinner', [['chicken_breast', 1], ['potatoes', 0.4], ['onions', 0.3], ['olive_oil', 0.08]], 75, 46, 4, 42, 78),
  recipe('salmon_dinner', 'Pan-Seared Salmon and Spinach', 'dinner', [['salmon', 0.6], ['spinach', 0.5], ['olive_oil', 0.06], ['garlic', 0.2]], 30, 52, 2, 40, 86),
  recipe('beef_ragu', 'Slow Beef Ragu', 'dinner', [['ground_beef', 1], ['tomatoes', 1], ['onions', 0.5], ['garlic', 0.5], ['pasta', 0.5], ['wine_mid', 0.25]], 180, 64, 6, 44, 90),
  recipe('fruit_snack', 'Fruit', 'snack', [['apples', 0.15]], 2, 1, 1, 8, 60),
]);
