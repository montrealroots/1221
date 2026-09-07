/**
 * SLATE — the jewelry houses.
 *
 * Harry Winston, Graff, Boucheron, Chaumet, Piaget, Chopard, Mikimoto and
 * Buccellati. Cartier, Tiffany, Bulgari and Van Cleef were built out with
 * the watchmakers; these eight are the rest of the Place Vendôme and the
 * houses that sit beside it, and each had a shopfront with seven pieces in
 * it.
 *
 * A jeweler names its collections and the collection is the product:
 * Winston Cluster, Lily Cluster, Quatre, Serpent Bohème, Bee My Love,
 * Josephine, Liens, Possession, Sunlight, Happy Diamonds, Ice Cube, Rocca,
 * Macri, Opera Tulle. Those names, and the stones each house is known for,
 * are public record. Every price and every quality figure is SLATE's own
 * calibration and says so on the row: a stone is worth what a stone is
 * worth on the day, and no shop here quotes a real one.
 */

import { REFERENCE_VERSION } from './reference';
import { jewellerySlotFor } from './wardrobe';
import type { RealGood } from './goods';

const REAL = {
  source: 'calibrated_estimate', confidence: 'high', version: REFERENCE_VERSION,
  note: 'A real house and a real collection, named as public record. Price and quality are SLATE’s own calibration; a stone is priced on the day and no figure here is a quotation.',
} as const;

const ALL_YEAR = ['Spring', 'Summer', 'Autumn', 'Winter'];

/** A jewel, hung on the peg it belongs to. High jewelry holds its value. */
const jw = (
  id: string, name: string, brand: string, sub: string, price: number,
  quality: number, depreciation: number, tags: string[] = [],
): RealGood => ({
  id, name, type: 'product', category: 'jewelry', subcategory: sub, basePrice: price, brand,
  tags: ['jewellery', sub, ...tags], quality, depreciation,
  slot: jewellerySlotFor(sub, name), formality: 60, seasons: ALL_YEAR, ...REAL,
});

/** A watch from a jeweler, which several of these houses really make. */
const wa = (
  id: string, name: string, brand: string, sub: string, price: number,
  quality: number, depreciation: number, tags: string[] = [],
): RealGood => ({
  id, name, type: 'product', category: 'watch', subcategory: sub, basePrice: price, brand,
  tags: ['watch', sub, ...tags], quality, depreciation, slot: 'watch', formality: 60,
  seasons: ALL_YEAR, ...REAL,
});

/** Leather, scent and eyewear from a jeweler: an accessory, not a jewel. */
const ac = (
  id: string, name: string, brand: string, sub: string, price: number,
  slot: string | undefined, quality: number, depreciation: number,
): RealGood => ({
  id, name, type: 'product', category: 'accessory', subcategory: sub, basePrice: price, brand,
  tags: ['wear', sub], quality, depreciation, slot, formality: 50,
  seasons: ALL_YEAR, audience: 'unisex', ...REAL,
});

// ---------------------------------------------------------------------------
// Harry Winston — the King of Diamonds, and the cluster that is his signature
// ---------------------------------------------------------------------------

const WINSTON: readonly RealGood[] = [
  jw('hw_cluster_ring', 'Harry Winston Winston Cluster Diamond Ring', 'Harry Winston', 'ring', 48_000_00, 98, -0.02),
  jw('hw_cluster_earrings', 'Harry Winston Winston Cluster Diamond Earrings', 'Harry Winston', 'earrings', 62_000_00, 98, -0.02),
  jw('hw_cluster_necklace', 'Harry Winston Winston Cluster Diamond Necklace', 'Harry Winston', 'necklace', 145_000_00, 99, -0.03),
  jw('hw_cluster_bracelet', 'Harry Winston Winston Cluster Diamond Bracelet', 'Harry Winston', 'bracelet', 98_000_00, 98, -0.02),
  jw('hw_lily_ring', 'Harry Winston Lily Cluster Diamond Ring', 'Harry Winston', 'ring', 22_000_00, 97, -0.01),
  jw('hw_lily_earrings', 'Harry Winston Lily Cluster Diamond Earrings', 'Harry Winston', 'earrings', 28_000_00, 97, -0.01),
  jw('hw_lily_pendant', 'Harry Winston Lily Cluster Diamond Pendant', 'Harry Winston', 'necklace', 18_500_00, 97, -0.01),
  jw('hw_lily_bracelet', 'Harry Winston Lily Cluster Diamond Bracelet', 'Harry Winston', 'bracelet', 42_000_00, 97, -0.01),
  jw('hw_sunflower_ring', 'Harry Winston Sunflower Diamond Ring', 'Harry Winston', 'ring', 19_500_00, 96, -0.01),
  jw('hw_sunflower_drop_earrings', 'Harry Winston Sunflower Diamond Drop Earrings', 'Harry Winston', 'earrings', 24_000_00, 96, -0.01),
  jw('hw_sunflower_pendant', 'Harry Winston Sunflower Diamond Pendant', 'Harry Winston', 'necklace', 16_500_00, 96, -0.01),
  jw('hw_sunflower_bracelet', 'Harry Winston Sunflower Diamond Bracelet', 'Harry Winston', 'bracelet', 38_000_00, 96, -0.01),
  jw('hw_hope_ring', 'Harry Winston HW Logo Diamond Ring', 'Harry Winston', 'ring', 9_800_00, 95, 0.0),
  jw('hw_logo_earrings', 'Harry Winston HW Logo Diamond Earrings', 'Harry Winston', 'earrings', 12_500_00, 95, 0.0),
  jw('hw_logo_pendant', 'Harry Winston HW Logo Diamond Pendant', 'Harry Winston', 'necklace', 8_900_00, 95, 0.0),
  jw('hw_logo_bracelet', 'Harry Winston HW Logo Diamond Bracelet', 'Harry Winston', 'bracelet', 21_000_00, 95, 0.0),
  jw('hw_forget_me_not_ring', 'Harry Winston Forget Me Not Diamond Ring', 'Harry Winston', 'ring', 26_000_00, 97, -0.01),
  jw('hw_forget_me_not_earrings', 'Harry Winston Forget Me Not Diamond Earrings', 'Harry Winston', 'earrings', 32_000_00, 97, -0.01),
  jw('hw_forget_me_not_necklace', 'Harry Winston Forget Me Not Diamond Necklace', 'Harry Winston', 'necklace', 54_000_00, 97, -0.01),
  jw('hw_water_ring', 'Harry Winston Water Diamond Ring', 'Harry Winston', 'ring', 31_000_00, 97, -0.01),
  jw('hw_water_earrings', 'Harry Winston Water Diamond Earrings', 'Harry Winston', 'earrings', 39_000_00, 97, -0.01),
  jw('hw_water_bracelet', 'Harry Winston Water Diamond Bracelet', 'Harry Winston', 'bracelet', 56_000_00, 97, -0.01),
  jw('hw_sparkling_cluster_ring', 'Harry Winston Sparkling Cluster Diamond Ring', 'Harry Winston', 'ring', 34_000_00, 97, -0.01),
  jw('hw_sparkling_earrings', 'Harry Winston Sparkling Cluster Diamond Earrings', 'Harry Winston', 'earrings', 42_000_00, 97, -0.01),
  jw('hw_traffic_ring', 'Harry Winston Traffic Diamond Ring', 'Harry Winston', 'ring', 14_500_00, 95, 0.0),
  jw('hw_traffic_earrings', 'Harry Winston Traffic Diamond Earrings', 'Harry Winston', 'earrings', 17_500_00, 95, 0.0),
  jw('hw_traffic_pendant', 'Harry Winston Traffic Diamond Pendant', 'Harry Winston', 'necklace', 11_500_00, 95, 0.0),
  jw('hw_belle_ring', 'Harry Winston Belle Diamond Ring', 'Harry Winston', 'ring', 16_500_00, 96, 0.0),
  jw('hw_belle_earrings', 'Harry Winston Belle Diamond Earrings', 'Harry Winston', 'earrings', 21_000_00, 96, 0.0),
  jw('hw_belle_pendant', 'Harry Winston Belle Diamond Pendant', 'Harry Winston', 'necklace', 13_500_00, 96, 0.0),
  jw('hw_loop_ring', 'Harry Winston Loop Diamond Ring', 'Harry Winston', 'ring', 10_500_00, 94, 0.0),
  jw('hw_loop_earrings', 'Harry Winston Loop Diamond Earrings', 'Harry Winston', 'earrings', 13_500_00, 94, 0.0),
  jw('hw_loop_pendant', 'Harry Winston Loop Diamond Pendant', 'Harry Winston', 'necklace', 9_500_00, 94, 0.0),
  jw('hw_eternity_band', 'Harry Winston Round Brilliant Diamond Eternity Band', 'Harry Winston', 'ring', 24_000_00, 97, -0.01),
  jw('hw_emerald_band', 'Harry Winston Emerald Cut Diamond Eternity Band', 'Harry Winston', 'ring', 38_000_00, 97, -0.01),
  jw('hw_baguette_band', 'Harry Winston Baguette Diamond Eternity Band', 'Harry Winston', 'ring', 29_000_00, 97, -0.01),
  jw('hw_micropave_band', 'Harry Winston Micropave Diamond Wedding Band', 'Harry Winston', 'ring', 9_800_00, 95, 0.0),
  jw('hw_classic_band', 'Harry Winston Classic Platinum Wedding Band', 'Harry Winston', 'ring', 3_900_00, 93, 0.02),
  jw('hw_solitaire_round', 'Harry Winston Round Brilliant Diamond Solitaire Ring', 'Harry Winston', 'ring', 52_000_00, 98, -0.02),
  jw('hw_solitaire_emerald', 'Harry Winston Emerald Cut Diamond Solitaire Ring', 'Harry Winston', 'ring', 68_000_00, 98, -0.02),
  jw('hw_solitaire_oval', 'Harry Winston Oval Diamond Solitaire Ring', 'Harry Winston', 'ring', 58_000_00, 98, -0.02),
  jw('hw_solitaire_pear', 'Harry Winston Pear Shaped Diamond Solitaire Ring', 'Harry Winston', 'ring', 61_000_00, 98, -0.02),
  jw('hw_solitaire_cushion', 'Harry Winston Cushion Cut Diamond Solitaire Ring', 'Harry Winston', 'ring', 56_000_00, 98, -0.02),
  jw('hw_solitaire_marquise', 'Harry Winston Marquise Diamond Solitaire Ring', 'Harry Winston', 'ring', 54_000_00, 98, -0.02),
  jw('hw_hs_ring', 'Harry Winston Hope Diamond Inspired Ring', 'Harry Winston', 'ring', 72_000_00, 98, -0.02),
  jw('hw_sapphire_ring', 'Harry Winston Sapphire And Diamond Ring', 'Harry Winston', 'ring', 44_000_00, 97, -0.01),
  jw('hw_ruby_ring', 'Harry Winston Ruby And Diamond Ring', 'Harry Winston', 'ring', 58_000_00, 98, -0.02),
  jw('hw_emerald_ring', 'Harry Winston Emerald And Diamond Ring', 'Harry Winston', 'ring', 62_000_00, 98, -0.02),
  jw('hw_sapphire_earrings', 'Harry Winston Sapphire And Diamond Earrings', 'Harry Winston', 'earrings', 52_000_00, 97, -0.01),
  jw('hw_ruby_earrings', 'Harry Winston Ruby And Diamond Earrings', 'Harry Winston', 'earrings', 66_000_00, 98, -0.02),
  jw('hw_emerald_earrings', 'Harry Winston Emerald And Diamond Earrings', 'Harry Winston', 'earrings', 71_000_00, 98, -0.02),
  jw('hw_sapphire_necklace', 'Harry Winston Sapphire And Diamond Necklace', 'Harry Winston', 'necklace', 185_000_00, 99, -0.03),
  jw('hw_ruby_necklace', 'Harry Winston Ruby And Diamond Necklace', 'Harry Winston', 'necklace', 215_000_00, 99, -0.03),
  jw('hw_emerald_necklace', 'Harry Winston Emerald And Diamond Necklace', 'Harry Winston', 'necklace', 225_000_00, 99, -0.03),
  jw('hw_diamond_riviere', 'Harry Winston Diamond Riviere Necklace', 'Harry Winston', 'necklace', 165_000_00, 99, -0.03),
  jw('hw_diamond_line_bracelet', 'Harry Winston Diamond Line Bracelet', 'Harry Winston', 'bracelet', 48_000_00, 97, -0.01),
  jw('hw_tennis_bracelet', 'Harry Winston Round Brilliant Diamond Bracelet', 'Harry Winston', 'bracelet', 52_000_00, 97, -0.01),
  jw('hw_diamond_studs', 'Harry Winston Round Brilliant Diamond Studs', 'Harry Winston', 'earrings', 26_000_00, 97, -0.01),
  jw('hw_drop_earrings', 'Harry Winston Diamond Drop Earrings', 'Harry Winston', 'earrings', 88_000_00, 98, -0.02),
  jw('hw_chandelier_earrings', 'Harry Winston Diamond Chandelier Earrings', 'Harry Winston', 'earrings', 135_000_00, 99, -0.03),
  jw('hw_tiara', 'Harry Winston Diamond Tiara', 'Harry Winston', 'necklace', 280_000_00, 99, -0.03),
  jw('hw_brooch', 'Harry Winston Diamond Brooch', 'Harry Winston', 'necklace', 68_000_00, 97, -0.01),
  jw('hw_cufflinks', 'Harry Winston Diamond Cufflinks', 'Harry Winston', 'bracelet', 18_500_00, 95, 0.0),
  wa('hw_midnight_36', 'Harry Winston Midnight Automatic 36', 'Harry Winston', 'dress', 18_500_00, 95, 0.02),
  wa('hw_midnight_42', 'Harry Winston Midnight Automatic 42', 'Harry Winston', 'dress', 22_000_00, 95, 0.02),
  wa('hw_midnight_moon', 'Harry Winston Midnight Moon Phase', 'Harry Winston', 'complication', 34_000_00, 96, 0.01),
  wa('hw_premier_36', 'Harry Winston Premier Automatic 36', 'Harry Winston', 'dress', 24_000_00, 96, 0.02),
  wa('hw_premier_diamond', 'Harry Winston Premier Diamond Bezel Watch', 'Harry Winston', 'dress', 42_000_00, 96, 0.01),
  wa('hw_ocean_sport', 'Harry Winston Ocean Sport Chronograph', 'Harry Winston', 'chronograph', 29_000_00, 95, 0.03),
  wa('hw_avenue_c', 'Harry Winston Avenue Classic Watch', 'Harry Winston', 'dress', 18_000_00, 95, 0.02),
  wa('hw_avenue_diamond', 'Harry Winston Avenue Diamond Watch', 'Harry Winston', 'dress', 32_000_00, 96, 0.01),
  wa('hw_histoire_tourbillon', 'Harry Winston Histoire De Tourbillon', 'Harry Winston', 'complication', 480_000_00, 99, -0.01),
  wa('hw_opus', 'Harry Winston Opus Series Watch', 'Harry Winston', 'complication', 320_000_00, 99, -0.01),
  ac('hw_scent', 'Harry Winston Diamond Orchid Eau De Parfum', 'Harry Winston', 'fragrance', 350_00, undefined, 90, 0.9),
  ac('hw_jewel_box', 'Harry Winston Leather Jewelry Box', 'Harry Winston', 'accessory', 1_200_00, undefined, 92, 0.3),
  ac('hw_clutch', 'Harry Winston Satin Evening Clutch', 'Harry Winston', 'bag', 2_800_00, 'bag', 92, 0.3),
  jw('hw_sapphire_bracelet', 'Harry Winston Sapphire And Diamond Bracelet', 'Harry Winston', 'bracelet', 88_000_00, 98, -0.02),
  jw('hw_ruby_bracelet', 'Harry Winston Ruby And Diamond Bracelet', 'Harry Winston', 'bracelet', 96_000_00, 98, -0.02),
  jw('hw_emerald_bracelet', 'Harry Winston Emerald And Diamond Bracelet', 'Harry Winston', 'bracelet', 102_000_00, 98, -0.02),
  jw('hw_pear_drop_pendant', 'Harry Winston Pear Shaped Diamond Pendant', 'Harry Winston', 'necklace', 34_000_00, 97, -0.01),
  jw('hw_marquise_pendant', 'Harry Winston Marquise Diamond Pendant', 'Harry Winston', 'necklace', 31_000_00, 97, -0.01),
  jw('hw_oval_studs', 'Harry Winston Oval Diamond Studs', 'Harry Winston', 'earrings', 29_000_00, 97, -0.01),
  jw('hw_emerald_cut_studs', 'Harry Winston Emerald Cut Diamond Studs', 'Harry Winston', 'earrings', 36_000_00, 97, -0.01),
  jw('hw_hoop_earrings', 'Harry Winston Diamond Hoop Earrings', 'Harry Winston', 'earrings', 24_000_00, 96, -0.01),
  jw('hw_cluster_by_harry', 'Harry Winston Cluster By Harry Winston Ring', 'Harry Winston', 'ring', 18_500_00, 96, 0.0),
  jw('hw_cluster_by_earrings', 'Harry Winston Cluster By Harry Winston Earrings', 'Harry Winston', 'earrings', 22_000_00, 96, 0.0),
  jw('hw_cluster_by_pendant', 'Harry Winston Cluster By Harry Winston Pendant', 'Harry Winston', 'necklace', 15_500_00, 96, 0.0),
  jw('hw_sunflower_band', 'Harry Winston Sunflower Diamond Band', 'Harry Winston', 'ring', 12_500_00, 95, 0.0),
  jw('hw_lily_band', 'Harry Winston Lily Cluster Diamond Band', 'Harry Winston', 'ring', 14_500_00, 95, 0.0),
  jw('hw_signature_ring_m', 'Harry Winston Platinum Signet Ring', 'Harry Winston', 'ring', 6_800_00, 93, 0.02),
  jw('hw_diamond_bangle', 'Harry Winston Diamond Bangle', 'Harry Winston', 'bracelet', 44_000_00, 97, -0.01),
  jw('hw_pave_bangle', 'Harry Winston Pave Diamond Bangle', 'Harry Winston', 'bracelet', 58_000_00, 97, -0.01),
  jw('hw_diamond_choker', 'Harry Winston Diamond Choker Necklace', 'Harry Winston', 'necklace', 125_000_00, 98, -0.02),
  jw('hw_diamond_collar', 'Harry Winston Diamond Collar Necklace', 'Harry Winston', 'necklace', 195_000_00, 99, -0.03),
  jw('hw_pearl_earrings', 'Harry Winston South Sea Pearl And Diamond Earrings', 'Harry Winston', 'earrings', 46_000_00, 97, -0.01),
  jw('hw_pearl_necklace', 'Harry Winston South Sea Pearl Necklace', 'Harry Winston', 'necklace', 88_000_00, 97, -0.01),
  jw('hw_diamond_ear_climber', 'Harry Winston Diamond Ear Climbers', 'Harry Winston', 'earrings', 34_000_00, 96, -0.01),
  jw('hw_three_stone_ring', 'Harry Winston Three Stone Diamond Ring', 'Harry Winston', 'ring', 78_000_00, 98, -0.02),
  jw('hw_halo_ring', 'Harry Winston Diamond Halo Engagement Ring', 'Harry Winston', 'ring', 46_000_00, 98, -0.02),
  jw('hw_pave_wedding_band', 'Harry Winston Pave Diamond Wedding Band', 'Harry Winston', 'ring', 11_500_00, 95, 0.0),
  jw('hw_platinum_band_m', 'Harry Winston Platinum Wedding Band For Men', 'Harry Winston', 'ring', 4_200_00, 93, 0.02),
  jw('hw_diamond_watch_bracelet', 'Harry Winston Diamond Bracelet Watch', 'Harry Winston', 'bracelet', 64_000_00, 97, -0.01),
];

/** Every piece the jewelry houses sell. More houses follow when the brand build resumes. */
export const REAL_JEWELERS: readonly RealGood[] = [
  ...WINSTON,
];
