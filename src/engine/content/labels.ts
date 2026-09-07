/**
 * SLATE — the clothing houses, in the depth they actually have.
 *
 * The same argument as the shoe brands. Louis Vuitton does not make three
 * things. Gucci does not make twelve. A player who walks into a maison and is
 * shown a dozen products knows immediately that the game stopped short, and
 * every one of these houses publishes a catalog running to hundreds of pieces
 * across leather goods, ready-to-wear, shoes, accessories and fragrance.
 *
 * So: over a hundred real products for each of the houses below, sorted the
 * way the house itself sorts them, and each stamped with who it is cut for so
 * the floor leads with the right rack.
 *
 * Public record: the house, the line, the piece. SLATE's own arithmetic: every
 * price, every quality figure, every wear rate. A maison's real price moves
 * with the season and the market and there is no feed for it here, so the
 * number on screen is a calibration and says so.
 */

import { REFERENCE_VERSION } from './reference';
import type { RealGood } from './goods';

/** What every row in a maison's catalog says about where its numbers came from. */
export const HOUSE_NOTE = 'A real piece, named as public record. Price, quality and wear are SLATE’s own calibration.';

const REAL = {
  source: 'calibrated_estimate', confidence: 'high', version: REFERENCE_VERSION,
  note: HOUSE_NOTE,
} as const;

const ALL_YEAR = ['Spring', 'Summer', 'Autumn', 'Winter'];
const WINTER = ['Autumn', 'Winter'];
const SUMMER = ['Spring', 'Summer'];

type Who = 'men' | 'women' | 'unisex';

/** Ready-to-wear: anything that hangs on a wardrobe peg. */
const rw = (
  id: string, name: string, brand: string, sub: string, price: number,
  slot: string, formality: number, quality: number, who: Who = 'unisex',
  depreciation = 0.36, seasons: string[] = ALL_YEAR,
): RealGood => ({
  id, name, type: 'product', category: 'clothing', subcategory: sub, basePrice: price, brand,
  tags: ['wear', sub], quality, depreciation, slot, formality, seasons, audience: who, ...REAL,
});

/** Shoes. */
const sh = (
  id: string, name: string, brand: string, sub: string, price: number,
  formality: number, quality: number, who: Who = 'unisex', depreciation = 0.34,
): RealGood => ({
  id, name, type: 'product', category: 'footwear', subcategory: sub, basePrice: price, brand,
  tags: ['wear', 'shoes', sub], quality, depreciation, slot: 'shoes', formality,
  seasons: ALL_YEAR, audience: who, ...REAL,
});

/**
 * Leather goods, eyewear, scarves, belts, fragrance.
 *
 * `slot` is optional because a bottle of scent and a suitcase are things you
 * own rather than things you wear, and a peg that is not in SLOTS would put
 * them in a wardrobe nothing can show.
 */
const ac = (
  id: string, name: string, brand: string, sub: string, price: number,
  slot: string | undefined, formality: number, quality: number, who: Who = 'unisex', depreciation = 0.28,
): RealGood => ({
  id, name, type: 'product', category: 'accessory', subcategory: sub, basePrice: price, brand,
  tags: ['wear', sub], quality, depreciation, slot, formality, seasons: ALL_YEAR,
  audience: who, ...REAL,
});

// ---------------------------------------------------------------------------
// Louis Vuitton
// ---------------------------------------------------------------------------

export const LOUIS_VUITTON: readonly RealGood[] = [
  // --- The monogram bags, which are the house ---------------------------------------------------------
  ac('lv_neverfull_gm', 'Louis Vuitton Neverfull GM', 'Louis Vuitton', 'bag', 2_260_00, 'bag', 42, 90, 'women', 0.02),
  ac('lv_neverfull_pm', 'Louis Vuitton Neverfull PM', 'Louis Vuitton', 'bag', 1_960_00, 'bag', 42, 89, 'women', 0.02),
  ac('lv_speedy_25', 'Louis Vuitton Speedy Bandoulière 25', 'Louis Vuitton', 'bag', 1_990_00, 'bag', 42, 90, 'women', 0.02),
  ac('lv_speedy_40', 'Louis Vuitton Speedy 40', 'Louis Vuitton', 'bag', 1_890_00, 'bag', 40, 88, 'unisex', 0.04),
  ac('lv_alma_bb', 'Louis Vuitton Alma BB', 'Louis Vuitton', 'bag', 1_890_00, 'bag', 46, 90, 'women', 0.02),
  ac('lv_alma_pm', 'Louis Vuitton Alma PM', 'Louis Vuitton', 'bag', 2_030_00, 'bag', 46, 90, 'women', 0.02),
  ac('lv_pochette_metis', 'Louis Vuitton Pochette Métis', 'Louis Vuitton', 'bag', 2_600_00, 'bag', 44, 92, 'women', 0.0),
  ac('lv_onthego_mm', 'Louis Vuitton OnTheGo MM', 'Louis Vuitton', 'bag', 3_500_00, 'bag', 42, 91, 'women', 0.02),
  ac('lv_onthego_gm', 'Louis Vuitton OnTheGo GM', 'Louis Vuitton', 'bag', 3_750_00, 'bag', 42, 91, 'women', 0.02),
  ac('lv_capucines_bb', 'Louis Vuitton Capucines BB', 'Louis Vuitton', 'bag', 6_400_00, 'bag', 56, 95, 'women', 0.0),
  ac('lv_capucines_mm', 'Louis Vuitton Capucines MM', 'Louis Vuitton', 'bag', 7_350_00, 'bag', 56, 95, 'women', 0.0),
  ac('lv_twist_mm', 'Louis Vuitton Twist MM', 'Louis Vuitton', 'bag', 4_900_00, 'bag', 54, 93, 'women', 0.02),
  ac('lv_petite_malle', 'Louis Vuitton Petite Malle', 'Louis Vuitton', 'bag', 6_100_00, 'bag', 62, 94, 'women', 0.0),
  ac('lv_coussin_pm', 'Louis Vuitton Coussin PM', 'Louis Vuitton', 'bag', 4_500_00, 'bag', 48, 91, 'women', 0.04),
  ac('lv_boulogne', 'Louis Vuitton Boulogne', 'Louis Vuitton', 'bag', 2_300_00, 'bag', 42, 89, 'women', 0.02),
  ac('lv_loop', 'Louis Vuitton Loop', 'Louis Vuitton', 'bag', 2_400_00, 'bag', 44, 89, 'women', 0.04),
  ac('lv_diane', 'Louis Vuitton Diane', 'Louis Vuitton', 'bag', 3_100_00, 'bag', 44, 90, 'women', 0.02),
  ac('lv_side_trunk', 'Louis Vuitton Side Trunk', 'Louis Vuitton', 'bag', 4_100_00, 'bag', 50, 92, 'women', 0.02),
  ac('lv_multi_pochette', 'Louis Vuitton Multi Pochette Accessoires', 'Louis Vuitton', 'bag', 2_800_00, 'bag', 40, 89, 'women', 0.02),
  ac('lv_favorite', 'Louis Vuitton Favorite', 'Louis Vuitton', 'bag', 2_200_00, 'bag', 46, 89, 'women', 0.02),
  ac('lv_bumbag', 'Louis Vuitton Bumbag', 'Louis Vuitton', 'bag', 2_100_00, 'bag', 26, 87, 'unisex', 0.06),
  // --- Men's leather goods and travel ---------------------------------------------------------------------
  ac('lv_keepall_45', 'Louis Vuitton Keepall Bandoulière 45', 'Louis Vuitton', 'bag', 2_450_00, 'bag', 36, 90, 'unisex', 0.04),
  ac('lv_keepall_50', 'Louis Vuitton Keepall Bandoulière 50', 'Louis Vuitton', 'bag', 2_620_00, 'bag', 36, 90, 'unisex', 0.04),
  ac('lv_christopher_mm', 'Louis Vuitton Christopher MM Backpack', 'Louis Vuitton', 'bag', 4_200_00, 'bag', 32, 91, 'men', 0.04),
  ac('lv_district_pm', 'Louis Vuitton District PM Messenger', 'Louis Vuitton', 'bag', 1_950_00, 'bag', 38, 88, 'men', 0.06),
  ac('lv_gaston_wearable_wallet', 'Louis Vuitton Gaston Wearable Wallet', 'Louis Vuitton', 'bag', 1_680_00, 'bag', 34, 87, 'men', 0.06),
  ac('lv_steamer_pm', 'Louis Vuitton Steamer PM', 'Louis Vuitton', 'bag', 3_450_00, 'bag', 36, 90, 'men', 0.04),
  ac('lv_soft_trunk', 'Louis Vuitton Soft Trunk', 'Louis Vuitton', 'bag', 4_950_00, 'bag', 44, 92, 'unisex', 0.02),
  ac('lv_horizon_55', 'Louis Vuitton Horizon 55 Rolling Luggage', 'Louis Vuitton', 'luggage', 4_350_00, undefined, 40, 92, 'unisex', 0.06),
  ac('lv_horizon_soft_2r_55', 'Louis Vuitton Horizon Soft Duffle 55', 'Louis Vuitton', 'luggage', 3_800_00, undefined, 38, 90, 'unisex', 0.06),
  ac('lv_pegase_55', 'Louis Vuitton Pégase Légère 55', 'Louis Vuitton', 'luggage', 3_950_00, undefined, 40, 91, 'unisex', 0.06),
  // --- Small leather goods -----------------------------------------------------------------------------------
  ac('lv_zippy_wallet', 'Louis Vuitton Zippy Wallet', 'Louis Vuitton', 'wallet', 1_100_00, 'bag', 40, 88, 'women', 0.08),
  ac('lv_zippy_organizer', 'Louis Vuitton Zippy Organizer', 'Louis Vuitton', 'wallet', 1_250_00, 'bag', 40, 88, 'men', 0.08),
  ac('lv_sarah_wallet', 'Louis Vuitton Sarah Wallet', 'Louis Vuitton', 'wallet', 990_00, 'bag', 40, 87, 'women', 0.08),
  ac('lv_multiple_wallet', 'Louis Vuitton Multiple Wallet', 'Louis Vuitton', 'wallet', 640_00, 'bag', 38, 86, 'men', 0.10),
  ac('lv_brazza_wallet', 'Louis Vuitton Brazza Wallet', 'Louis Vuitton', 'wallet', 800_00, 'bag', 40, 87, 'men', 0.10),
  ac('lv_pocket_organizer', 'Louis Vuitton Pocket Organizer', 'Louis Vuitton', 'wallet', 460_00, 'bag', 38, 85, 'men', 0.12),
  ac('lv_key_pouch', 'Louis Vuitton Key Pouch', 'Louis Vuitton', 'wallet', 390_00, 'bag', 34, 84, 'unisex', 0.10),
  ac('lv_card_holder', 'Louis Vuitton Card Holder', 'Louis Vuitton', 'wallet', 340_00, 'bag', 38, 84, 'unisex', 0.12),
  // --- Belts and scarves -----------------------------------------------------------------------------------------
  ac('lv_initiales_belt', 'Louis Vuitton LV Initiales 40mm Reversible Belt', 'Louis Vuitton', 'belt', 690_00, 'belt', 40, 88, 'men', 0.14),
  ac('lv_circle_belt', 'Louis Vuitton LV Circle 35mm Belt', 'Louis Vuitton', 'belt', 720_00, 'belt', 40, 87, 'women', 0.14),
  ac('lv_shape_belt', 'Louis Vuitton LV Shape 40mm Belt', 'Louis Vuitton', 'belt', 800_00, 'belt', 34, 87, 'men', 0.14),
  ac('lv_monogram_shine_shawl', 'Louis Vuitton Monogram Shine Shawl', 'Louis Vuitton', 'scarf', 780_00, 'scarf', 52, 89, 'women', 0.16),
  ac('lv_the_ultimate_shawl', 'Louis Vuitton The Ultimate Shawl', 'Louis Vuitton', 'scarf', 940_00, 'scarf', 54, 90, 'women', 0.16),
  ac('lv_essential_v_bandeau', 'Louis Vuitton Bandeau BB', 'Louis Vuitton', 'scarf', 250_00, 'scarf', 44, 84, 'women', 0.20),
  ac('lv_monogram_scarf_men', 'Louis Vuitton Monogram Gradient Scarf', 'Louis Vuitton', 'scarf', 590_00, 'scarf', 48, 87, 'men', 0.18),
  // --- Eyewear ------------------------------------------------------------------------------------------------------
  ac('lv_million_sunglasses', 'Louis Vuitton 1.1 Millionaires Sunglasses', 'Louis Vuitton', 'eyewear', 1_150_00, 'eyewear', 34, 88, 'unisex', 0.20),
  ac('lv_evidence_sunglasses', 'Louis Vuitton Evidence Sunglasses', 'Louis Vuitton', 'eyewear', 830_00, 'eyewear', 34, 87, 'men', 0.20),
  ac('lv_cyclone_sunglasses', 'Louis Vuitton LV Cyclone Sunglasses', 'Louis Vuitton', 'eyewear', 790_00, 'eyewear', 32, 86, 'unisex', 0.20),
  ac('lv_moon_cat_eye', 'Louis Vuitton LV Moon Cat Eye Sunglasses', 'Louis Vuitton', 'eyewear', 740_00, 'eyewear', 40, 86, 'women', 0.20),
  // --- Shoes ------------------------------------------------------------------------------------------------------------
  sh('lv_trainer', 'Louis Vuitton LV Trainer Sneaker', 'Louis Vuitton', 'trainer', 1_250_00, 22, 88, 'men'),
  sh('lv_skate_sneaker', 'Louis Vuitton LV Skate Sneaker', 'Louis Vuitton', 'trainer', 1_150_00, 20, 86, 'men'),
  sh('lv_rivoli_sneaker', 'Louis Vuitton Rivoli Sneaker Boot', 'Louis Vuitton', 'trainer', 1_320_00, 26, 87, 'men'),
  sh('lv_run_away', 'Louis Vuitton Run Away Sneaker', 'Louis Vuitton', 'trainer', 1_090_00, 22, 85, 'unisex'),
  sh('lv_time_out', 'Louis Vuitton Time Out Sneaker', 'Louis Vuitton', 'trainer', 1_090_00, 24, 85, 'women'),
  sh('lv_archlight', 'Louis Vuitton Archlight Sneaker', 'Louis Vuitton', 'trainer', 1_390_00, 24, 86, 'women'),
  sh('lv_major_loafer', 'Louis Vuitton Major Loafer', 'Louis Vuitton', 'formal', 1_290_00, 68, 90, 'men'),
  sh('lv_montaigne_loafer', 'Louis Vuitton Montaigne Flat Loafer', 'Louis Vuitton', 'formal', 1_180_00, 60, 88, 'women'),
  sh('lv_oberkampf_ankle_boot', 'Louis Vuitton Oberkampf Ankle Boot', 'Louis Vuitton', 'boot', 1_460_00, 52, 89, 'men'),
  sh('lv_silhouette_ankle_boot', 'Louis Vuitton Silhouette Ankle Boot', 'Louis Vuitton', 'boot', 1_620_00, 62, 90, 'women'),
  sh('lv_starboard_flat_mule', 'Louis Vuitton Starboard Flat Mule', 'Louis Vuitton', 'casual', 990_00, 40, 85, 'women'),
  sh('lv_bom_dia_mule', 'Louis Vuitton Bom Dia Flat Mule', 'Louis Vuitton', 'casual', 940_00, 36, 84, 'women'),
  sh('lv_waterfront_mule', 'Louis Vuitton Waterfront Mule', 'Louis Vuitton', 'casual', 760_00, 20, 82, 'men'),
  // --- Ready-to-wear ----------------------------------------------------------------------------------------------------
  rw('lv_monogram_denim_jacket', 'Louis Vuitton Monogram Denim Jacket', 'Louis Vuitton', 'outerwear', 3_400_00, 'outerwear', 30, 89, 'men'),
  rw('lv_damier_wool_coat', 'Louis Vuitton Damier Wool Coat', 'Louis Vuitton', 'outerwear', 5_800_00, 'outerwear', 62, 92, 'men', 0.34, WINTER),
  rw('lv_hooded_wrap_coat', 'Louis Vuitton Hooded Wrap Coat', 'Louis Vuitton', 'outerwear', 6_200_00, 'outerwear', 60, 92, 'women', 0.34, WINTER),
  rw('lv_monogram_windbreaker', 'Louis Vuitton Monogram Windbreaker', 'Louis Vuitton', 'outerwear', 2_900_00, 'outerwear', 24, 87, 'men'),
  rw('lv_leather_blouson', 'Louis Vuitton Leather Blouson', 'Louis Vuitton', 'outerwear', 7_400_00, 'outerwear', 42, 92, 'men'),
  rw('lv_puffer_monogram', 'Louis Vuitton Monogram Puffer Jacket', 'Louis Vuitton', 'outerwear', 4_600_00, 'outerwear', 22, 89, 'unisex', 0.34, WINTER),
  rw('lv_tailored_wool_suit', 'Louis Vuitton Tailored Wool Suit', 'Louis Vuitton', 'suit', 4_900_00, 'outfit', 88, 92, 'men'),
  rw('lv_monogram_shirt', 'Louis Vuitton Monogram Cotton Shirt', 'Louis Vuitton', 'top', 1_240_00, 'top', 52, 88, 'men'),
  rw('lv_signature_polo', 'Louis Vuitton Signature 3D Pocket Polo', 'Louis Vuitton', 'top', 1_090_00, 'top', 40, 87, 'men'),
  rw('lv_inside_out_tshirt', 'Louis Vuitton Inside Out T-Shirt', 'Louis Vuitton', 'top', 790_00, 'top', 16, 84, 'men'),
  rw('lv_monogram_hoodie', 'Louis Vuitton Monogram Cotton Hoodie', 'Louis Vuitton', 'top', 1_890_00, 'top', 18, 87, 'unisex'),
  rw('lv_cashmere_crew', 'Louis Vuitton Cashmere Crew Neck', 'Louis Vuitton', 'top', 1_650_00, 'top', 56, 91, 'men', 0.34, WINTER),
  rw('lv_intarsia_jumper', 'Louis Vuitton Intarsia Wool Jumper', 'Louis Vuitton', 'top', 2_100_00, 'top', 48, 90, 'women', 0.34, WINTER),
  rw('lv_silk_blouse', 'Louis Vuitton Silk Twill Blouse', 'Louis Vuitton', 'top', 1_780_00, 'top', 66, 91, 'women'),
  rw('lv_monogram_jeans', 'Louis Vuitton Monogram Denim Jeans', 'Louis Vuitton', 'bottom', 1_490_00, 'bottom', 24, 87, 'men'),
  rw('lv_tailored_trousers', 'Louis Vuitton Tailored Wool Trousers', 'Louis Vuitton', 'bottom', 1_680_00, 'bottom', 74, 90, 'men'),
  rw('lv_pleated_skirt', 'Louis Vuitton Pleated Monogram Skirt', 'Louis Vuitton', 'bottom', 2_400_00, 'bottom', 62, 90, 'women'),
  rw('lv_evening_gown', 'Louis Vuitton Silk Evening Gown', 'Louis Vuitton', 'formal', 8_900_00, 'outfit', 94, 95, 'women', 0.34),
  rw('lv_wrap_dress', 'Louis Vuitton Monogram Wrap Dress', 'Louis Vuitton', 'formal', 3_600_00, 'outfit', 72, 91, 'women'),
  rw('lv_swim_shorts', 'Louis Vuitton Monogram Swim Shorts', 'Louis Vuitton', 'sport', 790_00, 'bottom', 8, 84, 'men', 0.4, SUMMER),
  // --- Fragrance and the rest ------------------------------------------------------------------------------------------------
  ac('lv_ombre_nomade', 'Louis Vuitton Ombre Nomade', 'Louis Vuitton', 'fragrance', 380_00, undefined, 60, 92, 'unisex', 0.55),
  ac('lv_imagination', 'Louis Vuitton Imagination', 'Louis Vuitton', 'fragrance', 290_00, undefined, 56, 89, 'men', 0.55),
  ac('lv_attrape_reves', 'Louis Vuitton Attrape-Rêves', 'Louis Vuitton', 'fragrance', 290_00, undefined, 58, 89, 'women', 0.55),
  ac('lv_rose_des_vents', 'Louis Vuitton Rose Des Vents', 'Louis Vuitton', 'fragrance', 290_00, undefined, 58, 88, 'women', 0.55),
  ac('lv_afternoon_swim', 'Louis Vuitton Afternoon Swim', 'Louis Vuitton', 'fragrance', 290_00, undefined, 44, 88, 'unisex', 0.55),
  ac('lv_lv_beach_towel', 'Louis Vuitton Monogram Beach Towel', 'Louis Vuitton', 'home', 690_00, undefined, 12, 84, 'unisex', 0.4),
  ac('lv_gloves_monogram', 'Louis Vuitton Monogram Leather Gloves', 'Louis Vuitton', 'gloves', 720_00, 'gloves', 52, 88, 'unisex', 0.2),
  ac('lv_monogram_cap', 'Louis Vuitton Monogram Essential Cap', 'Louis Vuitton', 'hat', 520_00, 'hat', 18, 84, 'unisex', 0.24),
  ac('lv_bucket_hat', 'Louis Vuitton Monogram Bucket Hat', 'Louis Vuitton', 'hat', 690_00, 'hat', 18, 85, 'unisex', 0.24),
  ac('lv_tambour_watch', 'Louis Vuitton Tambour Automatic', 'Louis Vuitton', 'watch', 19_500_00, 'watch', 62, 92, 'unisex', 0.16),
  ac('lv_escale_watch', 'Louis Vuitton Tambour Escale', 'Louis Vuitton', 'watch', 8_900_00, 'watch', 58, 89, 'unisex', 0.2),
  ac('lv_idylle_blossom_necklace', 'Louis Vuitton Idylle Blossom Pendant', 'Louis Vuitton', 'necklace', 1_950_00, 'necklace', 58, 88, 'women', 0.14),
  ac('lv_empreinte_bracelet', 'Louis Vuitton Empreinte Bangle', 'Louis Vuitton', 'bracelet', 3_400_00, 'bracelet', 58, 90, 'women', 0.12),
  ac('lv_nanogram_earrings', 'Louis Vuitton Nanogram Stud Earrings', 'Louis Vuitton', 'earrings', 470_00, 'earrings', 48, 84, 'women', 0.24),
  ac('lv_essential_v_necklace', 'Louis Vuitton Essential V Necklace', 'Louis Vuitton', 'necklace', 430_00, 'necklace', 48, 84, 'women', 0.24),
  ac('lv_lv_volt_ring', 'Louis Vuitton LV Volt One Ring', 'Louis Vuitton', 'ring', 2_150_00, 'ring', 56, 89, 'unisex', 0.12),
  ac('lv_monogram_chain_bracelet', 'Louis Vuitton Monogram Chain Bracelet', 'Louis Vuitton', 'bracelet', 610_00, 'bracelet', 40, 85, 'men', 0.2),
  ac('lv_damier_tie', 'Louis Vuitton Damier Classique Silk Tie', 'Louis Vuitton', 'tie', 240_00, 'tie', 74, 86, 'men', 0.26),
  ac('lv_monogram_socks', 'Louis Vuitton Monogram Cotton Socks', 'Louis Vuitton', 'sock', 165_00, 'socks', 34, 82, 'unisex', 0.44),
  ac('lv_lv_agenda', 'Louis Vuitton Monogram Pocket Agenda Cover', 'Louis Vuitton', 'stationery', 380_00, undefined, 44, 84, 'unisex', 0.24),
];

// ---------------------------------------------------------------------------
// Gucci
// ---------------------------------------------------------------------------

export const GUCCI: readonly RealGood[] = [
  // --- Bags -----------------------------------------------------------------------------------------
  ac('gc_jackie_1961_small', 'Gucci Jackie 1961 Small Shoulder Bag', 'Gucci', 'bag', 3_500_00, 'bag', 48, 92, 'women', 0.04),
  ac('gc_jackie_1961_mini', 'Gucci Jackie 1961 Mini Shoulder Bag', 'Gucci', 'bag', 2_950_00, 'bag', 48, 91, 'women', 0.04),
  ac('gc_dionysus_small', 'Gucci Dionysus Small Shoulder Bag', 'Gucci', 'bag', 2_980_00, 'bag', 50, 91, 'women', 0.06),
  ac('gc_dionysus_super_mini', 'Gucci Dionysus Super Mini Bag', 'Gucci', 'bag', 1_450_00, 'bag', 48, 88, 'women', 0.08),
  ac('gc_marmont_small', 'Gucci GG Marmont Small Shoulder Bag', 'Gucci', 'bag', 2_650_00, 'bag', 48, 91, 'women', 0.04),
  ac('gc_marmont_mini', 'Gucci GG Marmont Mini Bag', 'Gucci', 'bag', 1_890_00, 'bag', 46, 89, 'women', 0.06),
  ac('gc_marmont_matelasse_tote', 'Gucci GG Marmont Matelassé Tote', 'Gucci', 'bag', 3_200_00, 'bag', 44, 90, 'women', 0.06),
  ac('gc_horsebit_1955_small', 'Gucci Horsebit 1955 Small Shoulder Bag', 'Gucci', 'bag', 2_890_00, 'bag', 50, 91, 'women', 0.04),
  ac('gc_bamboo_1947', 'Gucci Bamboo 1947 Small Top Handle', 'Gucci', 'bag', 3_800_00, 'bag', 56, 92, 'women', 0.04),
  ac('gc_diana_small', 'Gucci Diana Small Tote', 'Gucci', 'bag', 3_900_00, 'bag', 52, 92, 'women', 0.04),
  ac('gc_blondie_shoulder', 'Gucci Blondie Small Shoulder Bag', 'Gucci', 'bag', 2_750_00, 'bag', 48, 89, 'women', 0.08),
  ac('gc_ophidia_gg_tote', 'Gucci Ophidia GG Medium Tote', 'Gucci', 'bag', 2_100_00, 'bag', 42, 88, 'women', 0.08),
  ac('gc_ophidia_belt_bag', 'Gucci Ophidia GG Belt Bag', 'Gucci', 'bag', 1_290_00, 'bag', 24, 86, 'unisex', 0.10),
  ac('gc_savoy_duffle', 'Gucci Savoy Large Duffle Bag', 'Gucci', 'bag', 2_950_00, 'bag', 34, 89, 'men', 0.08),
  ac('gc_gg_backpack', 'Gucci GG Supreme Backpack', 'Gucci', 'bag', 2_150_00, 'bag', 30, 87, 'unisex', 0.10),
  ac('gc_messenger_gg', 'Gucci GG Messenger Bag', 'Gucci', 'bag', 1_450_00, 'bag', 34, 85, 'men', 0.12),
  ac('gc_savoy_trolley', 'Gucci Savoy Medium Trolley', 'Gucci', 'luggage', 3_400_00, undefined, 38, 89, 'unisex', 0.10),
  ac('gc_attache_large', 'Gucci Attache Large Shoulder Bag', 'Gucci', 'bag', 2_450_00, 'bag', 44, 88, 'women', 0.08),
  ac('gc_bamboo_backpack', 'Gucci Bamboo Buckle Backpack', 'Gucci', 'bag', 3_100_00, 'bag', 32, 89, 'unisex', 0.08),
  // --- Small leather goods --------------------------------------------------------------------------------
  ac('gc_marmont_zip_wallet', 'Gucci GG Marmont Zip Around Wallet', 'Gucci', 'wallet', 890_00, 'bag', 44, 86, 'women', 0.14),
  ac('gc_marmont_card_case', 'Gucci GG Marmont Card Case Wallet', 'Gucci', 'wallet', 420_00, 'bag', 42, 84, 'women', 0.16),
  ac('gc_gg_bifold', 'Gucci GG Supreme Bifold Wallet', 'Gucci', 'wallet', 490_00, 'bag', 42, 84, 'men', 0.16),
  ac('gc_ophidia_pouch', 'Gucci Ophidia GG Pouch', 'Gucci', 'wallet', 690_00, 'bag', 36, 85, 'unisex', 0.16),
  // --- Belts -----------------------------------------------------------------------------------------------
  ac('gc_marmont_belt', 'Gucci GG Marmont Leather Belt', 'Gucci', 'belt', 520_00, 'belt', 42, 87, 'women', 0.16),
  ac('gc_interlocking_belt', 'Gucci Interlocking G Buckle Belt', 'Gucci', 'belt', 490_00, 'belt', 44, 86, 'men', 0.16),
  ac('gc_horsebit_belt', 'Gucci Horsebit Buckle Leather Belt', 'Gucci', 'belt', 560_00, 'belt', 52, 87, 'men', 0.16),
  ac('gc_web_belt', 'Gucci Web Stripe Canvas Belt', 'Gucci', 'belt', 390_00, 'belt', 28, 82, 'unisex', 0.20),
  // --- Shoes ------------------------------------------------------------------------------------------------
  sh('gc_ace_sneaker_gc', 'Gucci Ace Leather Sneaker', 'Gucci', 'trainer', 790_00, 30, 86),
  sh('gc_ace_bee', 'Gucci Ace Embroidered Bee Sneaker', 'Gucci', 'trainer', 850_00, 28, 86),
  sh('gc_rhyton', 'Gucci Rhyton Logo Sneaker', 'Gucci', 'trainer', 890_00, 22, 85),
  sh('gc_screener', 'Gucci Screener Leather Sneaker', 'Gucci', 'trainer', 890_00, 24, 85),
  sh('gc_tennis_1977', 'Gucci Tennis 1977 Sneaker', 'Gucci', 'trainer', 750_00, 26, 85),
  sh('gc_re_web', 'Gucci Re-Web Sneaker', 'Gucci', 'trainer', 890_00, 24, 84),
  sh('gc_horsebit_loafer_gc', 'Gucci Horsebit 1953 Loafer', 'Gucci', 'formal', 990_00, 66, 92, 'men'),
  sh('gc_jordaan_loafer', 'Gucci Jordaan Leather Loafer', 'Gucci', 'formal', 890_00, 62, 90, 'women'),
  sh('gc_princetown_mule', 'Gucci Princetown Leather Slipper', 'Gucci', 'casual', 890_00, 44, 88, 'women'),
  sh('gc_brixton_loafer', 'Gucci Brixton Horsebit Loafer', 'Gucci', 'formal', 920_00, 60, 89, 'unisex'),
  sh('gc_marmont_pump', 'Gucci GG Marmont Leather Pump', 'Gucci', 'formal', 890_00, 76, 89, 'women'),
  sh('gc_ballet_flat', 'Gucci Double G Ballet Flat', 'Gucci', 'formal', 850_00, 58, 87, 'women'),
  sh('gc_ankle_boot_gc', 'Gucci Leather Ankle Boot', 'Gucci', 'boot', 1_290_00, 58, 89, 'women'),
  sh('gc_slide_rubber', 'Gucci Rubber Slide Sandal', 'Gucci', 'casual', 320_00, 12, 78, 'unisex'),
  sh('gc_espadrille', 'Gucci Double G Espadrille', 'Gucci', 'casual', 620_00, 30, 82, 'women'),
  // --- Ready-to-wear ---------------------------------------------------------------------------------------------
  rw('gc_gg_wool_coat', 'Gucci GG Jacquard Wool Coat', 'Gucci', 'outerwear', 4_200_00, 'outerwear', 62, 91, 'women', 0.34, WINTER),
  rw('gc_bomber_gg', 'Gucci GG Canvas Bomber Jacket', 'Gucci', 'outerwear', 3_200_00, 'outerwear', 28, 89, 'men'),
  rw('gc_denim_jacket_gc', 'Gucci Eco Washed Denim Jacket', 'Gucci', 'outerwear', 1_890_00, 'outerwear', 24, 86, 'unisex'),
  rw('gc_leather_jacket_gc', 'Gucci Leather Bomber Jacket', 'Gucci', 'outerwear', 5_400_00, 'outerwear', 38, 91, 'men'),
  rw('gc_trench_gc', 'Gucci Cotton Gabardine Trench Coat', 'Gucci', 'outerwear', 3_900_00, 'outerwear', 64, 90, 'unisex'),
  rw('gc_wool_suit', 'Gucci Wool Mohair Slim Suit', 'Gucci', 'suit', 3_400_00, 'outfit', 88, 91, 'men'),
  rw('gc_tuxedo_gc', 'Gucci Wool Silk Tuxedo Jacket', 'Gucci', 'suit', 4_100_00, 'outfit', 94, 93, 'men'),
  rw('gc_interlocking_tee', 'Gucci Interlocking G Cotton T-Shirt', 'Gucci', 'top', 520_00, 'top', 16, 84, 'unisex'),
  rw('gc_gg_polo', 'Gucci GG Piqué Cotton Polo', 'Gucci', 'top', 790_00, 'top', 40, 86, 'men'),
  rw('gc_web_hoodie', 'Gucci Web Stripe Cotton Hoodie', 'Gucci', 'top', 1_290_00, 'top', 18, 86, 'unisex'),
  rw('gc_wool_cardigan', 'Gucci GG Wool Cardigan', 'Gucci', 'top', 1_690_00, 'top', 52, 89, 'women', 0.34, WINTER),
  rw('gc_silk_shirt_gc', 'Gucci Printed Silk Shirt', 'Gucci', 'top', 1_450_00, 'top', 58, 89, 'unisex'),
  rw('gc_lace_dress', 'Gucci Lace Midi Dress', 'Gucci', 'formal', 3_800_00, 'outfit', 78, 92, 'women'),
  rw('gc_gg_pleated_skirt', 'Gucci GG Jacquard Pleated Skirt', 'Gucci', 'bottom', 1_890_00, 'bottom', 62, 89, 'women'),
  rw('gc_denim_jeans_gc', 'Gucci Eco Washed Denim Jeans', 'Gucci', 'bottom', 1_100_00, 'bottom', 22, 86, 'unisex'),
  rw('gc_track_pant_gc', 'Gucci Technical Jersey Track Trousers', 'Gucci', 'bottom', 1_250_00, 'bottom', 16, 85, 'unisex'),
  rw('gc_swim_shorts_gc', 'Gucci GG Nylon Swim Shorts', 'Gucci', 'sport', 590_00, 'bottom', 8, 82, 'men', 0.4, SUMMER),
  // --- Watches, jewelry and eyewear ---------------------------------------------------------------------------------
  ac('gc_g_timeless_watch', 'Gucci G-Timeless Automatic Watch', 'Gucci', 'watch', 1_890_00, 'watch', 54, 86, 'unisex', 0.24),
  ac('gc_grip_watch', 'Gucci Grip Watch', 'Gucci', 'watch', 1_450_00, 'watch', 44, 84, 'unisex', 0.26),
  ac('gc_dive_watch', 'Gucci Dive Watch 40mm', 'Gucci', 'watch', 1_390_00, 'watch', 40, 84, 'unisex', 0.26),
  ac('gc_interlocking_necklace_gc', 'Gucci Interlocking G Silver Necklace', 'Gucci', 'necklace', 420_00, 'necklace', 44, 84, 'unisex', 0.24),
  ac('gc_marmont_ring', 'Gucci GG Marmont Silver Ring', 'Gucci', 'ring', 360_00, 'ring', 44, 83, 'unisex', 0.26),
  ac('gc_lion_head_ring', 'Gucci Lion Head Silver Ring', 'Gucci', 'ring', 450_00, 'ring', 40, 84, 'men', 0.26),
  ac('gc_bee_bracelet', 'Gucci Bee Motif Silver Bracelet', 'Gucci', 'bracelet', 490_00, 'bracelet', 42, 84, 'unisex', 0.26),
  ac('gc_gg_running_earrings', 'Gucci GG Running Gold Earrings', 'Gucci', 'earrings', 780_00, 'earrings', 50, 86, 'women', 0.18),
  ac('gc_sunglasses_oversized', 'Gucci Oversized Square Sunglasses', 'Gucci', 'eyewear', 420_00, 'eyewear', 38, 84, 'women', 0.24),
  ac('gc_sunglasses_aviator', 'Gucci Navigator Sunglasses', 'Gucci', 'eyewear', 450_00, 'eyewear', 34, 84, 'men', 0.24),
  ac('gc_optical_frames', 'Gucci Rectangular Optical Frames', 'Gucci', 'eyewear', 380_00, 'eyewear', 42, 83, 'unisex', 0.26),
  // --- Scarves, hats and fragrance ----------------------------------------------------------------------------------------
  ac('gc_gg_silk_scarf', 'Gucci GG Silk Twill Scarf', 'Gucci', 'scarf', 420_00, 'scarf', 52, 86, 'women', 0.2),
  ac('gc_wool_scarf_gc', 'Gucci GG Wool Scarf', 'Gucci', 'scarf', 490_00, 'scarf', 46, 86, 'unisex', 0.2, ),
  ac('gc_baseball_cap_gc', 'Gucci GG Canvas Baseball Cap', 'Gucci', 'hat', 390_00, 'hat', 18, 82, 'unisex', 0.24),
  ac('gc_bucket_hat_gc', 'Gucci GG Canvas Bucket Hat', 'Gucci', 'hat', 490_00, 'hat', 18, 83, 'unisex', 0.24),
  ac('gc_wool_gloves', 'Gucci Wool Gloves With Web', 'Gucci', 'gloves', 390_00, 'gloves', 42, 84, 'unisex', 0.22),
  ac('gc_silk_tie', 'Gucci Interlocking G Silk Tie', 'Gucci', 'tie', 220_00, 'tie', 74, 84, 'men', 0.26),
  ac('gc_bloom', 'Gucci Bloom Eau De Parfum', 'Gucci', 'fragrance', 145_00, undefined, 56, 86, 'women', 0.55),
  ac('gc_guilty_pour_homme', 'Gucci Guilty Pour Homme Eau De Parfum', 'Gucci', 'fragrance', 120_00, undefined, 48, 84, 'men', 0.55),
  ac('gc_flora_gorgeous_gardenia', 'Gucci Flora Gorgeous Gardenia', 'Gucci', 'fragrance', 130_00, undefined, 54, 85, 'women', 0.55),
  ac('gc_memoire_dune_odeur', 'Gucci Mémoire D’Une Odeur', 'Gucci', 'fragrance', 135_00, undefined, 50, 85, 'unisex', 0.55),
  ac('gc_socks_gc', 'Gucci Interlocking G Cotton Socks', 'Gucci', 'sock', 150_00, 'socks', 32, 80, 'unisex', 0.44),
  ac('gc_phone_case', 'Gucci GG Supreme Phone Case', 'Gucci', 'tech', 290_00, undefined, 24, 80, 'unisex', 0.4),
  // --- The rest of the floor -------------------------------------------------------------------------------
  ac('gc_soho_disco', 'Gucci Soho Disco Shoulder Bag', 'Gucci', 'bag', 1_450_00, 'bag', 40, 87, 'women', 0.10),
  ac('gc_padlock_small', 'Gucci Padlock Small Shoulder Bag', 'Gucci', 'bag', 2_450_00, 'bag', 46, 89, 'women', 0.08),
  ac('gc_sylvie_1969', 'Gucci Sylvie 1969 Small Top Handle', 'Gucci', 'bag', 3_300_00, 'bag', 56, 91, 'women', 0.06),
  ac('gc_bamboo_1947_mini', 'Gucci Bamboo 1947 Mini Top Handle', 'Gucci', 'bag', 3_200_00, 'bag', 56, 91, 'women', 0.04),
  ac('gc_gg_emblem_tote', 'Gucci GG Emblem Medium Tote', 'Gucci', 'bag', 2_300_00, 'bag', 42, 88, 'women', 0.08),
  ac('gc_horsebit_slim_wallet', 'Gucci Horsebit 1955 Card Case', 'Gucci', 'wallet', 380_00, 'bag', 42, 84, 'unisex', 0.16),
  ac('gc_gg_travel_pouch', 'Gucci GG Supreme Toiletry Case', 'Gucci', 'wallet', 620_00, 'bag', 30, 84, 'unisex', 0.18),
  sh('gc_basket_sneaker', 'Gucci Basket Sneaker', 'Gucci', 'trainer', 950_00, 24, 85),
  sh('gc_mac80_sneaker', 'Gucci MAC80 Sneaker', 'Gucci', 'trainer', 790_00, 26, 85),
  sh('gc_chelsea_boot_gc', 'Gucci Leather Chelsea Boot', 'Gucci', 'boot', 1_290_00, 60, 90, 'men'),
  sh('gc_platform_sandal', 'Gucci Platform Leather Sandal', 'Gucci', 'casual', 890_00, 40, 85, 'women'),
  sh('gc_horsebit_slide', 'Gucci Horsebit Leather Slide', 'Gucci', 'casual', 690_00, 32, 84, 'women'),
  rw('gc_gg_shorts', 'Gucci GG Canvas Shorts', 'Gucci', 'bottom', 890_00, 'bottom', 20, 84, 'unisex', 0.36, SUMMER),
  rw('gc_wool_waistcoat', 'Gucci Wool Tailored Waistcoat', 'Gucci', 'suit', 1_450_00, 'top', 84, 89, 'men'),
  rw('gc_gg_tracksuit_top', 'Gucci GG Jersey Zip Jacket', 'Gucci', 'sport', 1_390_00, 'outerwear', 18, 85, 'unisex'),
  rw('gc_knit_dress_gc', 'Gucci GG Wool Knit Dress', 'Gucci', 'formal', 2_400_00, 'outfit', 68, 89, 'women', 0.34, WINTER),
  rw('gc_silk_slip_dress', 'Gucci Silk Satin Slip Dress', 'Gucci', 'formal', 2_900_00, 'outfit', 80, 91, 'women'),
  ac('gc_pearl_earrings_gc', 'Gucci Interlocking G Pearl Earrings', 'Gucci', 'earrings', 520_00, 'earrings', 52, 85, 'women', 0.22),
  ac('gc_guilty_pour_femme', 'Gucci Guilty Pour Femme Eau De Parfum', 'Gucci', 'fragrance', 125_00, undefined, 52, 84, 'women', 0.55),
];

/** Everything in this file, in one list. */
export const REAL_LABELS: readonly RealGood[] = [...LOUIS_VUITTON, ...GUCCI];
