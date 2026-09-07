/**
 * SLATE — Commerce catalog.
 *
 * Retailers, groceries, prepared food, clothing, watches, jewelry, furniture,
 * electronics and services. Brands are original to SLATE; prices are
 * calibrated to plausible ranges and then adjusted by the local cost-of-living
 * index at the point of sale.
 */

import { Registry, REFERENCE_VERSION, type ReferenceRecord } from './reference';
import type { Money } from '../core/money';
import { CITIES } from './geography';
import { ALL_RETAILERS, tradesIn, type RealRetailer } from './brands';
import {
  REAL_ACCESSORIES, REAL_APPLIANCES, REAL_APPLIANCES_MORE, REAL_ART, REAL_BOOKS, REAL_CLOTHING,
  REAL_ELECTRONICS, REAL_EQUIPMENT, REAL_FOOTWEAR, REAL_FOOTWEAR_MORE, REAL_FURNITURE, REAL_FURNITURE_MORE,
  REAL_GROCERIES, REAL_HOME, REAL_HOUSEHOLD, REAL_JEWELLERY, REAL_JEWELLERY_MORE, REAL_TOP_UP, REAL_WATCHES,
  type RealGood,
} from './goods';
import { REAL_INTIMATES } from './intimates';
import { REAL_SNEAKERS } from './sneakers';
import { REAL_LABELS } from './labels';
import { REAL_SPORTSWEAR } from './sportswear';
import { REAL_HOUSES } from './houses';
import { REAL_KIT } from './kit';
import { REAL_ICE } from './ice';
import { REAL_MAISONS } from './maisons';
import { REAL_ADORNMENT } from './adornment';
import { withAudience } from './audience';

const V = REFERENCE_VERSION;
const SIM = { source: 'simulated', confidence: 'high', version: V, note: 'Original to SLATE.' } as const;

export interface Retailer extends ReferenceRecord {
  type: 'grocery' | 'department' | 'boutique' | 'electronics' | 'furniture' | 'jeweller' | 'restaurant' | 'service' | 'dealer' | 'online';
  /** 1 = discount, 5 = luxury. */
  tier: 1 | 2 | 3 | 4 | 5;
  /** Multiplier on catalog base price. */
  priceMultiplier: number;
  categories: string[];
  /** Cities where it operates. Empty means everywhere. */
  locations: string[];
  online: boolean;
  deliveryDays: number;
  description: string;
  /** Country codes the chain really trades in. Empty means SLATE does not gate it. */
  markets?: string[];
  /** Only these cities, for a house that really is flagship only. */
  flagshipCities?: string[];
  /** Smallest city SLATE will put a branch in. */
  minimumCity?: number;
  /**
   * Kept only so a save written before the real chains arrived still resolves
   * its old orders. Never offered, never given a storefront.
   */
  legacy?: boolean;
}

/**
 * The twelve chains SLATE invented before the real ones arrived. They are kept
 * so an old save's orders still resolve; they are never offered and never get
 * a storefront. Everything a player sees now is a real chain.
 */
const LEGACY_RETAILERS: readonly Retailer[] = [
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
].map((r) => ({ ...r, legacy: true } as Retailer));

/** A real chain, in the shape the commerce engine already speaks. */
function fromReal(r: RealRetailer): Retailer {
  return {
    id: r.id, name: r.name, type: KIND_TO_TYPE[r.kind], tier: r.tier, priceMultiplier: r.priceMultiplier,
    categories: r.categories, locations: r.flagshipCities ?? [], online: r.online, deliveryDays: r.deliveryDays,
    description: r.description, markets: r.markets, flagshipCities: r.flagshipCities, minimumCity: r.minimumCity,
    source: r.source, confidence: r.confidence, version: r.version, note: r.note,
  };
}

const KIND_TO_TYPE: Readonly<Record<RealRetailer['kind'], Retailer['type']>> = {
  grocery: 'grocery', convenience: 'grocery', warehouse: 'department', department: 'department',
  highstreet: 'boutique', boutique: 'boutique', maison: 'boutique', footwear: 'boutique', sportswear: 'boutique',
  electronics: 'electronics', furniture: 'furniture', homeware: 'furniture', jeweller: 'jeweller', watch: 'jeweller',
  bookshop: 'service', pharmacy: 'service', hardware: 'service', gallery: 'service', online: 'online',
};

export const RETAILERS = new Registry<Retailer>('retailers', [
  ...ALL_RETAILERS.map(fromReal),
  ...LEGACY_RETAILERS,
]);

/** The real chains, the only ones the game offers. */
export function shoppableRetailers(): Retailer[] {
  return RETAILERS.all().filter((r) => !r.legacy);
}

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
  /**
   * Who the thing is cut for. A shop leads with what fits you and will still
   * sell you anything: nothing in SLATE is refused on this.
   */
  audience?: 'men' | 'women' | 'unisex';
  /** Furniture only. */
  roomKinds?: string[];
  qualityContribution?: number;
  /** Countries a national brand is actually sold in. Absent means everywhere. */
  markets?: string[];
}

function item(spec: Omit<CatalogItem, 'type' | 'source' | 'confidence' | 'version' | 'note'>): CatalogItem {
  return { ...spec, type: 'product', ...SIM };
}

const g = (id: string, name: string, sub: string, price: number, shelf: number, unit: string, nourishment: number, quality = 55): CatalogItem =>
  item({ id, name, category: 'groceries', subcategory: sub, basePrice: price, brand: 'Market', tags: ['grocery', sub], quality, depreciation: 0, shelfLifeDays: shelf, unit, nourishment });

/**
 * The items SLATE invented before the real catalog arrived, kept so an old
 * save's owned assets still resolve. They are not offered on any shop floor.
 */
const LEGACY_ITEMS: readonly CatalogItem[] = [
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

  // --- Watches and jewelry ---
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
  // --- The rest of a room: what a house is furnished with, room by room ---
  item({ id: 'coffee_table', name: 'Coffee Table', category: 'furniture', subcategory: 'living', basePrice: 420_00, brand: 'Form House', tags: ['living'], quality: 58, depreciation: 0.18, roomKinds: ['living', 'den'], qualityContribution: 6 }),
  item({ id: 'armchair', name: 'Reading Armchair', category: 'furniture', subcategory: 'seating', basePrice: 640_00, brand: 'Form House', tags: ['living', 'reading'], quality: 60, depreciation: 0.18, roomKinds: ['living', 'den', 'bedroom', 'office'], qualityContribution: 6 }),
  item({ id: 'floor_lamp', name: 'Floor Lamp', category: 'furniture', subcategory: 'lighting', basePrice: 260_00, brand: 'Form House', tags: ['lighting'], quality: 55, depreciation: 0.15, roomKinds: ['living', 'den', 'bedroom', 'office', 'foyer'], qualityContribution: 4 }),
  item({ id: 'bookcase', name: 'Bookcase', category: 'furniture', subcategory: 'storage', basePrice: 780_00, brand: 'Form House', tags: ['storage', 'books'], quality: 62, depreciation: 0.12, roomKinds: ['living', 'den', 'office'], qualityContribution: 7 }),
  item({ id: 'curtains', name: 'Lined Curtains', category: 'furniture', subcategory: 'window', basePrice: 520_00, brand: 'Form House', tags: ['window', 'sleep'], quality: 56, depreciation: 0.20, roomKinds: ['living', 'bedroom', 'dining'], qualityContribution: 5 }),
  item({ id: 'sideboard', name: 'Walnut Sideboard', category: 'furniture', subcategory: 'storage', basePrice: 1_900_00, brand: 'Atelier Maison', tags: ['dining', 'storage'], quality: 80, depreciation: 0.08, roomKinds: ['dining', 'living', 'foyer'], qualityContribution: 10 }),
  item({ id: 'pendant_light', name: 'Pendant Light', category: 'furniture', subcategory: 'lighting', basePrice: 520_00, brand: 'Form House', tags: ['lighting'], quality: 64, depreciation: 0.10, roomKinds: ['dining', 'kitchen', 'foyer'], qualityContribution: 6 }),
  item({ id: 'bar_stools', name: 'Pair Of Bar Stools', category: 'furniture', subcategory: 'seating', basePrice: 380_00, brand: 'Form House', tags: ['kitchen'], quality: 54, depreciation: 0.18, roomKinds: ['kitchen'], qualityContribution: 5 }),
  item({ id: 'cookware_set', name: 'Cookware Set', category: 'appliance', subcategory: 'kitchen', basePrice: 450_00, brand: 'Form House', tags: ['kitchen', 'cooking'], quality: 66, depreciation: 0.12, roomKinds: ['kitchen'], qualityContribution: 5 }),
  item({ id: 'dishwasher', name: 'Dishwasher', category: 'appliance', subcategory: 'kitchen', basePrice: 1_100_00, brand: 'Circuitline', tags: ['kitchen'], quality: 62, depreciation: 0.13, roomKinds: ['kitchen'], qualityContribution: 7 }),
  item({ id: 'bedside_pair', name: 'Pair Of Bedside Tables', category: 'furniture', subcategory: 'bedroom', basePrice: 640_00, brand: 'Form House', tags: ['bedroom'], quality: 58, depreciation: 0.15, roomKinds: ['bedroom'], qualityContribution: 6 }),
  item({ id: 'wardrobe', name: 'Wardrobe', category: 'furniture', subcategory: 'storage', basePrice: 1_400_00, brand: 'Form House', tags: ['bedroom', 'storage'], quality: 60, depreciation: 0.12, roomKinds: ['bedroom'], qualityContribution: 8 }),
  item({ id: 'bath_set', name: 'Bathroom Set', category: 'furniture', subcategory: 'bathroom', basePrice: 380_00, brand: 'Form House', tags: ['bathroom', 'towels'], quality: 56, depreciation: 0.25, roomKinds: ['bathroom'], qualityContribution: 6 }),
  item({ id: 'vanity_mirror', name: 'Vanity Mirror', category: 'furniture', subcategory: 'bathroom', basePrice: 560_00, brand: 'Form House', tags: ['bathroom'], quality: 62, depreciation: 0.10, roomKinds: ['bathroom'], qualityContribution: 6 }),
  item({ id: 'heated_rail', name: 'Heated Towel Rail', category: 'appliance', subcategory: 'bathroom', basePrice: 420_00, brand: 'Circuitline', tags: ['bathroom'], quality: 64, depreciation: 0.12, roomKinds: ['bathroom'], qualityContribution: 4 }),
  item({ id: 'office_chair', name: 'Office Chair', category: 'furniture', subcategory: 'office', basePrice: 690_00, brand: 'Form House', tags: ['office', 'work'], quality: 66, depreciation: 0.18, roomKinds: ['office'], qualityContribution: 7 }),
  item({ id: 'storage_cabinets', name: 'Storage Cabinets', category: 'furniture', subcategory: 'storage', basePrice: 900_00, brand: 'Form House', tags: ['storage'], quality: 56, depreciation: 0.12, roomKinds: ['laundry', 'garage', 'foyer'], qualityContribution: 6 }),
  item({ id: 'outdoor_set', name: 'Outdoor Table And Chairs', category: 'furniture', subcategory: 'outdoor', basePrice: 1_150_00, brand: 'Form House', tags: ['outside', 'entertaining'], quality: 60, depreciation: 0.20, roomKinds: ['outside'], qualityContribution: 8 }),

  // --- Electronics ---
  item({ id: 'laptop', name: 'Laptop', category: 'electronics', subcategory: 'computer', basePrice: 2_400_00, brand: 'Circuitline', tags: ['work', 'writing', 'editing'], quality: 72, depreciation: 0.32 }),
  item({ id: 'laptop_pro', name: 'Workstation Laptop', category: 'electronics', subcategory: 'computer', basePrice: 5_800_00, brand: 'Circuitline', tags: ['work', 'editing', 'vfx'], quality: 92, depreciation: 0.30 }),
  item({ id: 'phone', name: 'Smartphone', category: 'electronics', subcategory: 'phone', basePrice: 1_250_00, brand: 'Circuitline', tags: ['social', 'filming'], quality: 70, depreciation: 0.38 }),
  item({ id: 'tv_oled', name: 'OLED Television', category: 'electronics', subcategory: 'display', basePrice: 3_400_00, brand: 'Circuitline', tags: ['home theater', 'watching'], quality: 84, depreciation: 0.26, roomKinds: ['living', 'theater', 'bedroom'], qualityContribution: 12 }),
  item({ id: 'projector_cinema', name: 'Cinema Projector', category: 'electronics', subcategory: 'display', basePrice: 24_000_00, brand: 'Circuitline', tags: ['home theater', 'screening'], quality: 96, depreciation: 0.22, roomKinds: ['theater'], qualityContribution: 28 }),
  item({ id: 'camera_mirrorless', name: 'Mirrorless Camera', category: 'electronics', subcategory: 'camera', basePrice: 3_200_00, brand: 'Circuitline', tags: ['content', 'filming'], quality: 80, depreciation: 0.22 }),
  item({ id: 'mic_shotgun', name: 'Shotgun Microphone', category: 'electronics', subcategory: 'audio', basePrice: 890_00, brand: 'Circuitline', tags: ['content', 'sound'], quality: 78, depreciation: 0.18 }),
  item({ id: 'light_kit', name: 'LED Lighting Kit', category: 'electronics', subcategory: 'lighting', basePrice: 1_400_00, brand: 'Circuitline', tags: ['content', 'self tape'], quality: 76, depreciation: 0.20 }),
].map((i) => ({ ...i, tags: [...i.tags, 'legacy'] }));

/**
 * Everything real, in the shape the commerce engine already speaks.
 *
 * `withAudience` stamps each wardrobe row with who it is cut for. The
 * intimates and adornment files say so on every row themselves and pass
 * through unchanged; everything else is decided in content/audience.ts.
 */
const REAL_ITEMS: readonly CatalogItem[] = withAudience(([] as RealGood[]).concat(
  REAL_GROCERIES as RealGood[], REAL_CLOTHING as RealGood[], REAL_FOOTWEAR as RealGood[], REAL_FOOTWEAR_MORE as RealGood[],
  REAL_ACCESSORIES as RealGood[], REAL_WATCHES as RealGood[], REAL_JEWELLERY as RealGood[], REAL_JEWELLERY_MORE as RealGood[],
  REAL_ELECTRONICS as RealGood[], REAL_FURNITURE as RealGood[], REAL_FURNITURE_MORE as RealGood[], REAL_HOME as RealGood[],
  REAL_APPLIANCES as RealGood[], REAL_APPLIANCES_MORE as RealGood[], REAL_HOUSEHOLD as RealGood[],
  REAL_EQUIPMENT as RealGood[], REAL_ART as RealGood[], REAL_BOOKS as RealGood[], REAL_TOP_UP as RealGood[],
  REAL_INTIMATES as RealGood[], REAL_ADORNMENT as RealGood[],
  REAL_SNEAKERS as RealGood[], REAL_LABELS as RealGood[], REAL_SPORTSWEAR as RealGood[],
  REAL_HOUSES as RealGood[], REAL_KIT as RealGood[], REAL_ICE as RealGood[], REAL_MAISONS as RealGood[],
)) as unknown as CatalogItem[];

export const CATALOG = new Registry<CatalogItem>('catalog', [...REAL_ITEMS, ...LEGACY_ITEMS]);

/** Everything a shop will actually put in front of you. */
export function shoppableItems(): CatalogItem[] {
  return REAL_ITEMS as CatalogItem[];
}

/**
 * Whether this product is on a shelf in this city. A national brand is gated
 * to the countries it is really sold in; everything else is left alone.
 */
export function soldIn(item: CatalogItem, cityId: string): boolean {
  if (!item.markets || item.markets.length === 0) return true;
  return item.markets.includes(cityId.split('-')[0] ?? '');
}

/** Everything a shop in this city will put in front of you. */
export function shoppableItemsIn(cityId: string): CatalogItem[] {
  return REAL_ITEMS.filter((i) => soldIn(i as CatalogItem, cityId)) as CatalogItem[];
}

/** Whether an item is one of the ones kept only for old saves. */
export function isLegacyItem(item: { tags: string[] }): boolean {
  return item.tags.includes('legacy');
}

/** Retail price for an item at a retailer in a city, before tax. */
export function retailPrice(itemId: string, retailerId: string, costOfLivingMultiplier: number): Money {
  const it = CATALOG.require(itemId);
  const r = RETAILERS.require(retailerId);
  const localised = 1 + (costOfLivingMultiplier - 1) * 0.6;
  return Math.round(it.basePrice * r.priceMultiplier * localised);
}

/**
 * The real chains selling that category to somebody standing in that city.
 * The market is the chain's own trading territory, which is public record; the
 * size threshold and the branch itself are SLATE's calibration.
 */
export function retailersFor(category: string, cityId: string): Retailer[] {
  const population = CITIES.get(cityId)?.population ?? 0;
  return shoppableRetailers().filter((r) => {
    if (!r.categories.includes(category)) return false;
    const real = ALL_RETAILERS.find((x) => x.id === r.id);
    if (!real) return r.locations.length === 0 || r.locations.includes(cityId);
    // Online only chains reach everywhere; a floor needs a city that supports one.
    if (real.kind === 'online') return real.markets.length === 0 || real.markets.includes(cityId.split('-')[0] ?? '');
    return tradesIn(real, cityId, population);
  });
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
