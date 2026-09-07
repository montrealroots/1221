/**
 * SLATE — the iced-out world.
 *
 * Icebox in Atlanta, Johnny Dang in Houston, the Diamond District houses in
 * New York, IF & Co. in Los Angeles, and King Ice for the plated end of the
 * same taste. Cuban links by the gauge, tennis chains by the millimeter,
 * pendants, grillz, and bust-down watches.
 *
 * Public record: the house, the line, the gauge, the karat. SLATE's own
 * arithmetic: every price, every quality figure, every wear rate. Gold moves
 * daily and a custom house prices on the phone, so the number on screen is a
 * calibration and is labeled as one. A bust-down is a real watch a house has
 * set with stones; the base watch is named as the house names it.
 */

import { REFERENCE_VERSION } from './reference';
import type { RealGood } from './goods';
import { jewellerySlotFor } from './wardrobe';

const REAL = {
  source: 'calibrated_estimate', confidence: 'high', version: REFERENCE_VERSION,
  note: 'A real piece, named as public record. Price, quality and wear are SLATE’s own calibration; gold is priced daily and a custom house prices on the phone.',
} as const;

const ALL_YEAR = ['Spring', 'Summer', 'Autumn', 'Winter'];
type Who = 'men' | 'women' | 'unisex';

/** Chains, pendants, rings, earrings, bracelets. */
const jw = (
  id: string, name: string, brand: string, sub: string, price: number,
  quality: number, depreciation = 0.10, who: Who = 'unisex', tags: string[] = [],
): RealGood => ({
  id, name, type: 'product', category: 'jewelry', subcategory: sub, basePrice: price, brand,
  tags: ['jewellery', sub, ...tags], quality, depreciation, slot: jewellerySlotFor(sub, name),
  formality: 44, seasons: ALL_YEAR, audience: who, ...REAL,
});

/** Grillz. Their own peg, because a mouth is not a wrist. */
const gz = (id: string, name: string, brand: string, price: number, quality: number, depreciation = 0.30): RealGood => ({
  id, name, type: 'product', category: 'jewelry', subcategory: 'grillz', basePrice: price, brand,
  tags: ['jewellery', 'grillz'], quality, depreciation, slot: 'jewellery', formality: 20,
  seasons: ALL_YEAR, audience: 'unisex', ...REAL,
});

/** A watch, whether the house's own or a bust-down of somebody else's. */
const wt = (id: string, name: string, brand: string, price: number, quality: number, depreciation = 0.12, tags: string[] = []): RealGood => ({
  id, name, type: 'product', category: 'watch', subcategory: 'watch', basePrice: price, brand,
  tags: ['wear', 'watch', ...tags], quality, depreciation, slot: 'watch', formality: 50,
  seasons: ALL_YEAR, audience: 'unisex', ...REAL,
});

/** Miami Cuban links, which Icebox sells by karat and gauge, as it really does. */
function cubans(prefix: string, brand: string, karat: string, perMm: number, quality: number, gauges: readonly number[], depreciation = 0.06): RealGood[] {
  return gauges.map((mm) => jw(`${prefix}_cuban_${karat.toLowerCase().replace(/\s+/g, '')}_${mm}`,
    `${brand} ${karat} ${mm}mm Miami Cuban Link Chain`, brand, 'chain', Math.round(perMm * mm * mm) * 100, quality, depreciation));
}

// ---------------------------------------------------------------------------
// Icebox, Atlanta
// ---------------------------------------------------------------------------

export const ICEBOX: readonly RealGood[] = [
  // --- Miami Cubans, by karat and gauge --------------------------------------------------------------
  ...cubans('ib', 'Icebox', '10K Yellow Gold', 14, 84, [6, 8, 10, 12, 14, 16, 18, 20]),
  ...cubans('ib', 'Icebox', '14K Yellow Gold', 19, 88, [6, 8, 10, 12, 14, 16, 18, 20, 22]),
  ...cubans('ib', 'Icebox', '14K White Gold', 20, 88, [8, 10, 12, 14, 16]),
  ...cubans('ib', 'Icebox', '14K Rose Gold', 20, 88, [8, 10, 12, 14]),
  ...cubans('ib', 'Icebox', '18K Yellow Gold', 26, 91, [8, 10, 12, 14, 16, 18]),
  jw('ib_cuban_bracelet_14k_10', 'Icebox 14K Yellow Gold 10mm Miami Cuban Link Bracelet', 'Icebox', 'bracelet', 4_200_00, 88, 0.06),
  jw('ib_cuban_bracelet_14k_12', 'Icebox 14K Yellow Gold 12mm Miami Cuban Link Bracelet', 'Icebox', 'bracelet', 5_800_00, 88, 0.06),
  jw('ib_cuban_bracelet_14k_14', 'Icebox 14K Yellow Gold 14mm Miami Cuban Link Bracelet', 'Icebox', 'bracelet', 7_600_00, 88, 0.06),
  jw('ib_cuban_bracelet_18k_12', 'Icebox 18K Yellow Gold 12mm Miami Cuban Link Bracelet', 'Icebox', 'bracelet', 8_400_00, 91, 0.06),
  // --- Diamond Cubans and tennis ---------------------------------------------------------------------
  jw('ib_dia_cuban_8', 'Icebox 14K Gold 8mm Diamond Miami Cuban Link Chain', 'Icebox', 'chain', 24_000_00, 92, 0.10),
  jw('ib_dia_cuban_10', 'Icebox 14K Gold 10mm Diamond Miami Cuban Link Chain', 'Icebox', 'chain', 38_000_00, 93, 0.10),
  jw('ib_dia_cuban_12', 'Icebox 14K Gold 12mm Diamond Miami Cuban Link Chain', 'Icebox', 'chain', 56_000_00, 93, 0.10),
  jw('ib_dia_cuban_15', 'Icebox 14K Gold 15mm Diamond Miami Cuban Link Chain', 'Icebox', 'chain', 88_000_00, 94, 0.10),
  jw('ib_dia_cuban_bracelet_10', 'Icebox 14K Gold 10mm Diamond Miami Cuban Link Bracelet', 'Icebox', 'bracelet', 16_500_00, 92, 0.10),
  jw('ib_dia_cuban_bracelet_12', 'Icebox 14K Gold 12mm Diamond Miami Cuban Link Bracelet', 'Icebox', 'bracelet', 24_000_00, 93, 0.10),
  jw('ib_tennis_3', 'Icebox 14K Gold 3mm Diamond Tennis Chain', 'Icebox', 'chain', 9_800_00, 90, 0.10),
  jw('ib_tennis_4', 'Icebox 14K Gold 4mm Diamond Tennis Chain', 'Icebox', 'chain', 15_500_00, 91, 0.10),
  jw('ib_tennis_5', 'Icebox 14K Gold 5mm Diamond Tennis Chain', 'Icebox', 'chain', 24_000_00, 92, 0.10),
  jw('ib_tennis_6', 'Icebox 14K Gold 6mm Diamond Tennis Chain', 'Icebox', 'chain', 36_000_00, 93, 0.10),
  jw('ib_tennis_8', 'Icebox 14K Gold 8mm Diamond Tennis Chain', 'Icebox', 'chain', 68_000_00, 94, 0.10),
  jw('ib_tennis_bracelet_3', 'Icebox 14K Gold 3mm Diamond Tennis Bracelet', 'Icebox', 'bracelet', 4_400_00, 90, 0.10),
  jw('ib_tennis_bracelet_4', 'Icebox 14K Gold 4mm Diamond Tennis Bracelet', 'Icebox', 'bracelet', 6_900_00, 91, 0.10),
  jw('ib_tennis_bracelet_5', 'Icebox 14K Gold 5mm Diamond Tennis Bracelet', 'Icebox', 'bracelet', 10_500_00, 92, 0.10),
  jw('ib_tennis_bracelet_6', 'Icebox 14K Gold 6mm Diamond Tennis Bracelet', 'Icebox', 'bracelet', 15_800_00, 93, 0.10),
  // --- Rope, Franco, Figaro, Gucci link, box ---------------------------------------------------------
  jw('ib_rope_14k_4', 'Icebox 14K Yellow Gold 4mm Rope Chain', 'Icebox', 'chain', 1_900_00, 86, 0.06),
  jw('ib_rope_14k_6', 'Icebox 14K Yellow Gold 6mm Rope Chain', 'Icebox', 'chain', 3_800_00, 86, 0.06),
  jw('ib_rope_14k_8', 'Icebox 14K Yellow Gold 8mm Rope Chain', 'Icebox', 'chain', 6_400_00, 87, 0.06),
  jw('ib_rope_14k_10', 'Icebox 14K Yellow Gold 10mm Rope Chain', 'Icebox', 'chain', 9_800_00, 87, 0.06),
  jw('ib_rope_10k_6', 'Icebox 10K Yellow Gold 6mm Rope Chain', 'Icebox', 'chain', 2_600_00, 83, 0.06),
  jw('ib_franco_14k_3', 'Icebox 14K Yellow Gold 3mm Franco Chain', 'Icebox', 'chain', 1_700_00, 86, 0.06),
  jw('ib_franco_14k_5', 'Icebox 14K Yellow Gold 5mm Franco Chain', 'Icebox', 'chain', 3_900_00, 86, 0.06),
  jw('ib_franco_14k_7', 'Icebox 14K Yellow Gold 7mm Franco Chain', 'Icebox', 'chain', 7_200_00, 87, 0.06),
  jw('ib_figaro_14k_6', 'Icebox 14K Yellow Gold 6mm Figaro Chain', 'Icebox', 'chain', 3_100_00, 85, 0.06),
  jw('ib_figaro_14k_9', 'Icebox 14K Yellow Gold 9mm Figaro Chain', 'Icebox', 'chain', 5_900_00, 85, 0.06),
  jw('ib_gucci_14k_6', 'Icebox 14K Yellow Gold 6mm Gucci Link Chain', 'Icebox', 'chain', 3_400_00, 85, 0.06),
  jw('ib_gucci_14k_9', 'Icebox 14K Yellow Gold 9mm Gucci Link Chain', 'Icebox', 'chain', 6_600_00, 85, 0.06),
  jw('ib_box_14k_3', 'Icebox 14K Yellow Gold 3mm Box Chain', 'Icebox', 'chain', 1_400_00, 84, 0.06),
  jw('ib_byzantine_14k_6', 'Icebox 14K Yellow Gold 6mm Byzantine Chain', 'Icebox', 'chain', 4_100_00, 86, 0.06),
  // --- Pendants --------------------------------------------------------------------------------------
  jw('ib_pend_cross', 'Icebox 14K Gold Diamond Cross Pendant', 'Icebox', 'pendant', 6_800_00, 90, 0.12),
  jw('ib_pend_cross_xl', 'Icebox 14K Gold Large Diamond Cross Pendant', 'Icebox', 'pendant', 18_500_00, 92, 0.12),
  jw('ib_pend_jesus', 'Icebox 14K Gold Diamond Jesus Piece Pendant', 'Icebox', 'pendant', 9_800_00, 91, 0.12),
  jw('ib_pend_jesus_xl', 'Icebox 14K Gold Large Diamond Jesus Piece Pendant', 'Icebox', 'pendant', 26_000_00, 93, 0.12),
  jw('ib_pend_angel', 'Icebox 14K Gold Diamond Angel Pendant', 'Icebox', 'pendant', 8_200_00, 90, 0.12),
  jw('ib_pend_lion', 'Icebox 14K Gold Diamond Lion Head Pendant', 'Icebox', 'pendant', 11_500_00, 91, 0.12),
  jw('ib_pend_praying_hands', 'Icebox 14K Gold Diamond Praying Hands Pendant', 'Icebox', 'pendant', 7_400_00, 90, 0.12),
  jw('ib_pend_dog_tag', 'Icebox 14K Gold Diamond Dog Tag Pendant', 'Icebox', 'pendant', 9_200_00, 90, 0.12),
  jw('ib_pend_initial', 'Icebox 14K Gold Diamond Initial Pendant', 'Icebox', 'pendant', 4_900_00, 89, 0.12),
  jw('ib_pend_ankh', 'Icebox 14K Gold Diamond Ankh Pendant', 'Icebox', 'pendant', 5_600_00, 89, 0.12),
  jw('ib_pend_crown', 'Icebox 14K Gold Diamond Crown Pendant', 'Icebox', 'pendant', 6_300_00, 89, 0.12),
  jw('ib_pend_skull', 'Icebox 14K Gold Diamond Skull Pendant', 'Icebox', 'pendant', 7_900_00, 90, 0.12),
  jw('ib_pend_bulldog', 'Icebox 14K Gold Diamond Bulldog Pendant', 'Icebox', 'pendant', 8_800_00, 90, 0.12),
  jw('ib_pend_money_bag', 'Icebox 14K Gold Diamond Money Bag Pendant', 'Icebox', 'pendant', 5_400_00, 89, 0.12),
  jw('ib_pend_globe', 'Icebox 14K Gold Diamond Globe Pendant', 'Icebox', 'pendant', 7_100_00, 90, 0.12),
  jw('ib_pend_rosary', 'Icebox 14K Gold Diamond Rosary Necklace', 'Icebox', 'necklace', 14_500_00, 91, 0.10),
  jw('ib_pend_nameplate', 'Icebox 14K Gold Diamond Nameplate Necklace', 'Icebox', 'necklace', 8_900_00, 90, 0.10),
  jw('ib_pend_bezel_solitaire', 'Icebox 14K Gold Bezel Set Solitaire Diamond Pendant', 'Icebox', 'pendant', 12_000_00, 92, 0.10),
  jw('ib_pend_plain_cross', 'Icebox 14K Yellow Gold Cross Pendant', 'Icebox', 'pendant', 1_600_00, 86, 0.08),
  jw('ib_pend_plain_jesus', 'Icebox 14K Yellow Gold Jesus Piece Pendant', 'Icebox', 'pendant', 2_400_00, 86, 0.08),
  // --- Rings, earrings ------------------------------------------------------------------------------
  jw('ib_ring_pinky', 'Icebox 14K Gold Diamond Pinky Ring', 'Icebox', 'ring', 5_200_00, 89, 0.12, 'men'),
  jw('ib_ring_signet', 'Icebox 14K Gold Diamond Signet Ring', 'Icebox', 'ring', 6_800_00, 90, 0.12, 'men'),
  jw('ib_ring_two_finger', 'Icebox 14K Gold Diamond Two Finger Ring', 'Icebox', 'ring', 9_400_00, 90, 0.12),
  jw('ib_ring_championship', 'Icebox 14K Gold Diamond Championship Style Ring', 'Icebox', 'ring', 14_000_00, 91, 0.12, 'men'),
  jw('ib_ring_eternity', 'Icebox 14K Gold Diamond Eternity Band', 'Icebox', 'ring', 4_600_00, 90, 0.10),
  jw('ib_ring_cuban', 'Icebox 14K Gold Diamond Cuban Link Ring', 'Icebox', 'ring', 5_900_00, 89, 0.12),
  jw('ib_ring_cluster', 'Icebox 14K Gold Diamond Cluster Ring', 'Icebox', 'ring', 7_200_00, 90, 0.12),
  jw('ib_ring_solitaire_2ct', 'Icebox 14K Gold 2 Carat Solitaire Engagement Ring', 'Icebox', 'ring', 22_000_00, 93, 0.08, 'women'),
  jw('ib_ring_halo_1ct', 'Icebox 14K Gold 1 Carat Halo Engagement Ring', 'Icebox', 'ring', 11_500_00, 92, 0.08, 'women'),
  jw('ib_studs_1ct', 'Icebox 14K Gold 1 Carat Diamond Stud Earrings', 'Icebox', 'earrings', 4_800_00, 91, 0.08),
  jw('ib_studs_2ct', 'Icebox 14K Gold 2 Carat Diamond Stud Earrings', 'Icebox', 'earrings', 12_500_00, 92, 0.08),
  jw('ib_studs_3ct', 'Icebox 14K Gold 3 Carat Diamond Stud Earrings', 'Icebox', 'earrings', 24_000_00, 93, 0.08),
  jw('ib_studs_cluster', 'Icebox 14K Gold Diamond Cluster Stud Earrings', 'Icebox', 'earrings', 3_900_00, 89, 0.10),
  jw('ib_hoops_diamond', 'Icebox 14K Gold Diamond Hoop Earrings', 'Icebox', 'earrings', 5_600_00, 90, 0.10),
  jw('ib_earrings_cross', 'Icebox 14K Gold Diamond Cross Earrings', 'Icebox', 'earrings', 3_400_00, 89, 0.10),
  jw('ib_huggies', 'Icebox 14K Gold Diamond Huggie Earrings', 'Icebox', 'earrings', 2_600_00, 88, 0.10),
  // --- Grillz -----------------------------------------------------------------------------------------
  gz('ib_grill_10k_6b', 'Icebox 10K Gold 6 Tooth Bottom Grill', 'Icebox', 1_100_00, 84),
  gz('ib_grill_10k_8t', 'Icebox 10K Gold 8 Tooth Top Grill', 'Icebox', 1_450_00, 84),
  gz('ib_grill_14k_6b', 'Icebox 14K Gold 6 Tooth Bottom Grill', 'Icebox', 1_600_00, 86),
  gz('ib_grill_14k_8t', 'Icebox 14K Gold 8 Tooth Top Grill', 'Icebox', 2_100_00, 86),
  gz('ib_grill_14k_set', 'Icebox 14K Gold Top And Bottom Grill Set', 'Icebox', 3_600_00, 87),
  gz('ib_grill_dia_6b', 'Icebox 14K Gold Diamond 6 Tooth Bottom Grill', 'Icebox', 6_800_00, 91),
  gz('ib_grill_dia_8t', 'Icebox 14K Gold Diamond 8 Tooth Top Grill', 'Icebox', 8_900_00, 91),
  gz('ib_grill_dia_set', 'Icebox 14K Gold Diamond Top And Bottom Grill Set', 'Icebox', 15_500_00, 92),
  gz('ib_grill_fang', 'Icebox 14K Gold Single Fang Grill', 'Icebox', 480_00, 82),
  gz('ib_grill_open_face', 'Icebox 14K Gold Open Face Grill', 'Icebox', 1_900_00, 86),
  // --- Bust-downs and the watch case -------------------------------------------------------------------
  wt('ib_bust_datejust_41', 'Icebox Bust Down Rolex Datejust 41', 'Icebox', 42_000_00, 93, 0.10, ['bust down']),
  wt('ib_bust_datejust_36', 'Icebox Bust Down Rolex Datejust 36', 'Icebox', 36_000_00, 92, 0.10, ['bust down']),
  wt('ib_bust_day_date_40', 'Icebox Bust Down Rolex Day-Date 40', 'Icebox', 88_000_00, 95, 0.09, ['bust down']),
  wt('ib_bust_presidential', 'Icebox Bust Down Rolex Presidential', 'Icebox', 78_000_00, 95, 0.09, ['bust down']),
  wt('ib_bust_submariner', 'Icebox Bust Down Rolex Submariner', 'Icebox', 46_000_00, 93, 0.10, ['bust down']),
  wt('ib_bust_sky_dweller', 'Icebox Bust Down Rolex Sky-Dweller', 'Icebox', 96_000_00, 95, 0.09, ['bust down']),
  wt('ib_bust_gmt', 'Icebox Bust Down Rolex GMT-Master II', 'Icebox', 54_000_00, 94, 0.10, ['bust down']),
  wt('ib_bust_ap_royal_oak_41', 'Icebox Bust Down Audemars Piguet Royal Oak 41', 'Icebox', 145_000_00, 96, 0.09, ['bust down']),
  wt('ib_bust_ap_offshore', 'Icebox Bust Down Audemars Piguet Royal Oak Offshore', 'Icebox', 165_000_00, 96, 0.09, ['bust down']),
  wt('ib_bust_patek_nautilus', 'Icebox Bust Down Patek Philippe Nautilus', 'Icebox', 220_000_00, 97, 0.08, ['bust down']),
  wt('ib_bust_cartier_santos', 'Icebox Bust Down Cartier Santos', 'Icebox', 38_000_00, 92, 0.10, ['bust down']),
  wt('ib_bust_richard_mille', 'Icebox Bust Down Richard Mille RM 011', 'Icebox', 420_000_00, 98, 0.08, ['bust down']),
  wt('ib_preowned_datejust', 'Icebox Pre-Owned Rolex Datejust 41', 'Icebox', 14_500_00, 92, 0.06, ['pre-owned']),
  wt('ib_preowned_submariner', 'Icebox Pre-Owned Rolex Submariner Date', 'Icebox', 16_800_00, 93, 0.06, ['pre-owned']),
  wt('ib_preowned_royal_oak', 'Icebox Pre-Owned Audemars Piguet Royal Oak 41', 'Icebox', 68_000_00, 95, 0.05, ['pre-owned']),
  wt('ib_preowned_nautilus', 'Icebox Pre-Owned Patek Philippe Nautilus 5711', 'Icebox', 140_000_00, 97, 0.04, ['pre-owned']),
  wt('ib_preowned_santos', 'Icebox Pre-Owned Cartier Santos Large', 'Icebox', 8_900_00, 90, 0.06, ['pre-owned']),
];

// ---------------------------------------------------------------------------
// King Ice, Los Angeles
// ---------------------------------------------------------------------------

/** Plated pieces sell by the gauge too, at a very different price per millimeter. */
function plated(prefix: string, brand: string, finish: string, perMm: number, quality: number, gauges: readonly number[]): RealGood[] {
  return gauges.map((mm) => jw(`${prefix}_cuban_${finish.toLowerCase().replace(/\s+/g, '')}_${mm}`,
    `${brand} ${finish} ${mm}mm Miami Cuban Chain`, brand, 'chain', Math.round(perMm * mm) * 100, quality, 0.40));
}

export const KING_ICE: readonly RealGood[] = [
  // --- Chains ---------------------------------------------------------------------------------------
  ...plated('ki', 'King Ice', '14K Gold Plated', 11, 62, [4, 6, 8, 10, 12, 14, 18]),
  ...plated('ki', 'King Ice', 'White Gold Plated', 11, 62, [6, 8, 10, 12, 14]),
  ...plated('ki', 'King Ice', 'Stainless Steel', 7, 58, [6, 8, 10, 12]),
  jw('ki_iced_cuban_8', 'King Ice 8mm Iced Miami Cuban Chain', 'King Ice', 'chain', 180_00, 64, 0.40),
  jw('ki_iced_cuban_12', 'King Ice 12mm Iced Miami Cuban Chain', 'King Ice', 'chain', 240_00, 64, 0.40),
  jw('ki_iced_cuban_15', 'King Ice 15mm Iced Miami Cuban Chain', 'King Ice', 'chain', 320_00, 65, 0.40),
  jw('ki_iced_cuban_18', 'King Ice 18mm Iced Miami Cuban Chain', 'King Ice', 'chain', 420_00, 65, 0.40),
  jw('ki_tennis_3', 'King Ice 3mm Single Row Tennis Chain', 'King Ice', 'chain', 90_00, 62, 0.40),
  jw('ki_tennis_5', 'King Ice 5mm Single Row Tennis Chain', 'King Ice', 'chain', 130_00, 62, 0.40),
  jw('ki_tennis_8', 'King Ice 8mm Single Row Tennis Chain', 'King Ice', 'chain', 190_00, 63, 0.40),
  jw('ki_tennis_2row', 'King Ice Two Row Tennis Chain', 'King Ice', 'chain', 260_00, 63, 0.40),
  jw('ki_tennis_3row', 'King Ice Three Row Tennis Chain', 'King Ice', 'chain', 340_00, 63, 0.40),
  jw('ki_rope_4', 'King Ice 14K Gold Plated 4mm Rope Chain', 'King Ice', 'chain', 55_00, 60, 0.40),
  jw('ki_rope_6', 'King Ice 14K Gold Plated 6mm Rope Chain', 'King Ice', 'chain', 75_00, 60, 0.40),
  jw('ki_rope_8', 'King Ice 14K Gold Plated 8mm Rope Chain', 'King Ice', 'chain', 95_00, 60, 0.40),
  jw('ki_franco_3', 'King Ice 14K Gold Plated 3mm Franco Chain', 'King Ice', 'chain', 50_00, 60, 0.40),
  jw('ki_franco_5', 'King Ice 14K Gold Plated 5mm Franco Chain', 'King Ice', 'chain', 80_00, 60, 0.40),
  jw('ki_figaro_6', 'King Ice 14K Gold Plated 6mm Figaro Chain', 'King Ice', 'chain', 60_00, 60, 0.40),
  jw('ki_gucci_8', 'King Ice 14K Gold Plated 8mm Gucci Link Chain', 'King Ice', 'chain', 85_00, 60, 0.40),
  jw('ki_byzantine_6', 'King Ice 14K Gold Plated 6mm Byzantine Chain', 'King Ice', 'chain', 70_00, 60, 0.40),
  jw('ki_box_3', 'King Ice 14K Gold Plated 3mm Box Chain', 'King Ice', 'chain', 40_00, 58, 0.40),
  jw('ki_herringbone', 'King Ice 14K Gold Plated Herringbone Chain', 'King Ice', 'chain', 65_00, 60, 0.40),
  jw('ki_mariner_8', 'King Ice 14K Gold Plated 8mm Mariner Chain', 'King Ice', 'chain', 80_00, 60, 0.40),
  jw('ki_bead_chain', 'King Ice Iced Bead Chain', 'King Ice', 'chain', 110_00, 61, 0.40),
  jw('ki_pearl_chain', 'King Ice Pearl And Iced Cuban Chain', 'King Ice', 'chain', 140_00, 61, 0.40),
  // --- Pendants ---------------------------------------------------------------------------------------
  jw('ki_pend_iced_cross', 'King Ice Iced Cross Necklace', 'King Ice', 'pendant', 95_00, 62, 0.40),
  jw('ki_pend_jesus', 'King Ice Iced Jesus Piece Necklace', 'King Ice', 'pendant', 120_00, 62, 0.40),
  jw('ki_pend_angel', 'King Ice Iced Angel Piece Necklace', 'King Ice', 'pendant', 110_00, 62, 0.40),
  jw('ki_pend_lion', 'King Ice Iced Lion Head Necklace', 'King Ice', 'pendant', 115_00, 62, 0.40),
  jw('ki_pend_praying_hands', 'King Ice Iced Praying Hands Necklace', 'King Ice', 'pendant', 100_00, 62, 0.40),
  jw('ki_pend_skull', 'King Ice Iced Skull Necklace', 'King Ice', 'pendant', 105_00, 62, 0.40),
  jw('ki_pend_ankh', 'King Ice Iced Ankh Necklace', 'King Ice', 'pendant', 90_00, 62, 0.40),
  jw('ki_pend_crown', 'King Ice Iced Crown Necklace', 'King Ice', 'pendant', 95_00, 62, 0.40),
  jw('ki_pend_dollar', 'King Ice Iced Dollar Sign Necklace', 'King Ice', 'pendant', 90_00, 61, 0.40),
  jw('ki_pend_money_bag', 'King Ice Iced Money Bag Necklace', 'King Ice', 'pendant', 95_00, 61, 0.40),
  jw('ki_pend_rosary', 'King Ice Iced Rosary Necklace', 'King Ice', 'necklace', 130_00, 62, 0.40),
  jw('ki_pend_dog_tag', 'King Ice Iced Dog Tag Necklace', 'King Ice', 'pendant', 100_00, 62, 0.40),
  jw('ki_pend_initial', 'King Ice Iced Initial Necklace', 'King Ice', 'pendant', 85_00, 61, 0.40),
  jw('ki_pend_globe', 'King Ice Iced Globe Necklace', 'King Ice', 'pendant', 110_00, 62, 0.40),
  jw('ki_pend_pharaoh', 'King Ice Iced Pharaoh Necklace', 'King Ice', 'pendant', 105_00, 62, 0.40),
  jw('ki_pend_eagle', 'King Ice Iced Eagle Necklace', 'King Ice', 'pendant', 100_00, 62, 0.40),
  jw('ki_pend_bulldog', 'King Ice Iced Bulldog Necklace', 'King Ice', 'pendant', 105_00, 62, 0.40),
  jw('ki_pend_cannabis', 'King Ice Iced Leaf Necklace', 'King Ice', 'pendant', 90_00, 61, 0.40),
  jw('ki_pend_rocket', 'King Ice Iced Rocket Necklace', 'King Ice', 'pendant', 95_00, 61, 0.40),
  jw('ki_pend_bezel_solitaire', 'King Ice Bezel Solitaire Necklace', 'King Ice', 'pendant', 70_00, 60, 0.40),
  jw('ki_pend_nameplate', 'King Ice Custom Nameplate Necklace', 'King Ice', 'necklace', 120_00, 62, 0.40),
  jw('ki_pend_spinner', 'King Ice Iced Spinner Necklace', 'King Ice', 'pendant', 115_00, 62, 0.40),
  // --- The licensed lines -----------------------------------------------------------------------------
  jw('ki_big_crown', 'King Ice Notorious B.I.G. Crown Necklace', 'King Ice', 'pendant', 130_00, 64, 0.40, 'unisex', ['licensed']),
  jw('ki_big_frank_white', 'King Ice Notorious B.I.G. Frank White Necklace', 'King Ice', 'pendant', 140_00, 64, 0.40, 'unisex', ['licensed']),
  jw('ki_big_ready_to_die', 'King Ice Notorious B.I.G. Ready To Die Necklace', 'King Ice', 'pendant', 140_00, 64, 0.40, 'unisex', ['licensed']),
  jw('ki_wu_logo', 'King Ice Wu-Tang Clan Logo Necklace', 'King Ice', 'pendant', 130_00, 64, 0.40, 'unisex', ['licensed']),
  jw('ki_wu_ring', 'King Ice Wu-Tang Clan Logo Ring', 'King Ice', 'ring', 80_00, 62, 0.40, 'unisex', ['licensed']),
  jw('ki_wu_bracelet', 'King Ice Wu-Tang Clan Logo Bracelet', 'King Ice', 'bracelet', 95_00, 62, 0.40, 'unisex', ['licensed']),
  jw('ki_death_row_chair', 'King Ice Death Row Records Chair Necklace', 'King Ice', 'pendant', 140_00, 64, 0.40, 'unisex', ['licensed']),
  jw('ki_death_row_ring', 'King Ice Death Row Records Ring', 'King Ice', 'ring', 85_00, 62, 0.40, 'unisex', ['licensed']),
  jw('ki_snoop_dogg_bone', 'King Ice Snoop Dogg Bone Necklace', 'King Ice', 'pendant', 130_00, 64, 0.40, 'unisex', ['licensed']),
  jw('ki_snoop_doggystyle', 'King Ice Snoop Dogg Doggystyle Necklace', 'King Ice', 'pendant', 140_00, 64, 0.40, 'unisex', ['licensed']),
  jw('ki_2pac_thug_life', 'King Ice 2Pac Thug Life Necklace', 'King Ice', 'pendant', 140_00, 64, 0.40, 'unisex', ['licensed']),
  jw('ki_2pac_makaveli', 'King Ice 2Pac Makaveli Necklace', 'King Ice', 'pendant', 140_00, 64, 0.40, 'unisex', ['licensed']),
  jw('ki_playboy_bunny', 'King Ice Playboy Bunny Necklace', 'King Ice', 'pendant', 120_00, 63, 0.40, 'unisex', ['licensed']),
  jw('ki_playboy_ring', 'King Ice Playboy Bunny Ring', 'King Ice', 'ring', 75_00, 62, 0.40, 'unisex', ['licensed']),
  jw('ki_playboy_earrings', 'King Ice Playboy Bunny Earrings', 'King Ice', 'earrings', 60_00, 61, 0.40, 'unisex', ['licensed']),
  jw('ki_naruto_leaf', 'King Ice Naruto Hidden Leaf Necklace', 'King Ice', 'pendant', 120_00, 63, 0.40, 'unisex', ['licensed']),
  jw('ki_naruto_akatsuki', 'King Ice Naruto Akatsuki Cloud Necklace', 'King Ice', 'pendant', 125_00, 63, 0.40, 'unisex', ['licensed']),
  jw('ki_naruto_ring', 'King Ice Naruto Akatsuki Ring', 'King Ice', 'ring', 70_00, 61, 0.40, 'unisex', ['licensed']),
  jw('ki_mk_dragon', 'King Ice Mortal Kombat Dragon Necklace', 'King Ice', 'pendant', 125_00, 63, 0.40, 'unisex', ['licensed']),
  jw('ki_mk_ring', 'King Ice Mortal Kombat Dragon Ring', 'King Ice', 'ring', 75_00, 61, 0.40, 'unisex', ['licensed']),
  jw('ki_bob_marley', 'King Ice Bob Marley Necklace', 'King Ice', 'pendant', 130_00, 63, 0.40, 'unisex', ['licensed']),
  jw('ki_cardi_b_chain', 'King Ice Cardi B Iced Cuban Chain', 'King Ice', 'chain', 220_00, 65, 0.40, 'women', ['licensed']),
  // --- Rings, earrings, bracelets ---------------------------------------------------------------------
  jw('ki_ring_pinky', 'King Ice Iced Pinky Ring', 'King Ice', 'ring', 70_00, 61, 0.40, 'men'),
  jw('ki_ring_champion', 'King Ice Iced Championship Ring', 'King Ice', 'ring', 95_00, 62, 0.40, 'men'),
  jw('ki_ring_cuban', 'King Ice Iced Cuban Link Ring', 'King Ice', 'ring', 75_00, 61, 0.40),
  jw('ki_ring_cluster', 'King Ice Iced Cluster Ring', 'King Ice', 'ring', 80_00, 61, 0.40),
  jw('ki_ring_eternity', 'King Ice Iced Eternity Band', 'King Ice', 'ring', 55_00, 60, 0.40),
  jw('ki_ring_signet', 'King Ice Iced Signet Ring', 'King Ice', 'ring', 75_00, 61, 0.40, 'men'),
  jw('ki_ring_lion', 'King Ice Iced Lion Head Ring', 'King Ice', 'ring', 85_00, 61, 0.40, 'men'),
  jw('ki_studs_round', 'King Ice Iced Round Stud Earrings', 'King Ice', 'earrings', 40_00, 60, 0.40),
  jw('ki_studs_square', 'King Ice Iced Square Stud Earrings', 'King Ice', 'earrings', 40_00, 60, 0.40),
  jw('ki_studs_cluster', 'King Ice Iced Cluster Stud Earrings', 'King Ice', 'earrings', 50_00, 60, 0.40),
  jw('ki_hoops_iced', 'King Ice Iced Hoop Earrings', 'King Ice', 'earrings', 60_00, 61, 0.40),
  jw('ki_earrings_cross', 'King Ice Iced Cross Earrings', 'King Ice', 'earrings', 50_00, 60, 0.40),
  jw('ki_earrings_dangle', 'King Ice Iced Dangle Earrings', 'King Ice', 'earrings', 65_00, 61, 0.40),
  jw('ki_bracelet_cuban_8', 'King Ice 8mm Iced Miami Cuban Bracelet', 'King Ice', 'bracelet', 110_00, 62, 0.40),
  jw('ki_bracelet_cuban_12', 'King Ice 12mm Iced Miami Cuban Bracelet', 'King Ice', 'bracelet', 150_00, 62, 0.40),
  jw('ki_bracelet_cuban_plated_8', 'King Ice 14K Gold Plated 8mm Miami Cuban Bracelet', 'King Ice', 'bracelet', 60_00, 60, 0.40),
  jw('ki_bracelet_tennis_3', 'King Ice 3mm Tennis Bracelet', 'King Ice', 'bracelet', 60_00, 61, 0.40),
  jw('ki_bracelet_tennis_5', 'King Ice 5mm Tennis Bracelet', 'King Ice', 'bracelet', 80_00, 61, 0.40),
  jw('ki_bracelet_tennis_2row', 'King Ice Two Row Tennis Bracelet', 'King Ice', 'bracelet', 120_00, 62, 0.40),
  jw('ki_bracelet_rope', 'King Ice 14K Gold Plated Rope Bracelet', 'King Ice', 'bracelet', 45_00, 59, 0.40),
  jw('ki_bracelet_bead', 'King Ice Iced Bead Bracelet', 'King Ice', 'bracelet', 55_00, 60, 0.40),
  jw('ki_bracelet_bangle', 'King Ice Iced Bangle', 'King Ice', 'bracelet', 70_00, 60, 0.40),
  jw('ki_anklet_tennis', 'King Ice Tennis Anklet', 'King Ice', 'bracelet', 60_00, 60, 0.40, 'women'),
  // --- Grillz and watches -----------------------------------------------------------------------------
  gz('ki_grill_6b', 'King Ice 14K Gold Plated 6 Tooth Bottom Grill', 'King Ice', 60_00, 58, 0.5),
  gz('ki_grill_8t', 'King Ice 14K Gold Plated 8 Tooth Top Grill', 'King Ice', 70_00, 58, 0.5),
  gz('ki_grill_set', 'King Ice 14K Gold Plated Top And Bottom Grill Set', 'King Ice', 120_00, 59, 0.5),
  gz('ki_grill_iced_6b', 'King Ice Iced 6 Tooth Bottom Grill', 'King Ice', 90_00, 60, 0.5),
  gz('ki_grill_iced_8t', 'King Ice Iced 8 Tooth Top Grill', 'King Ice', 100_00, 60, 0.5),
  gz('ki_grill_fang', 'King Ice Single Fang Grill', 'King Ice', 30_00, 56, 0.5),
  gz('ki_grill_open_face', 'King Ice Open Face Grill', 'King Ice', 80_00, 59, 0.5),
  wt('ki_watch_presidential', 'King Ice Iced Presidential Watch', 'King Ice', 260_00, 62, 0.45),
  wt('ki_watch_bust_down', 'King Ice Iced Bust Down Watch', 'King Ice', 320_00, 63, 0.45),
  wt('ki_watch_cuban_band', 'King Ice Iced Cuban Band Watch', 'King Ice', 280_00, 62, 0.45),
  wt('ki_watch_skeleton', 'King Ice Iced Skeleton Watch', 'King Ice', 300_00, 62, 0.45),
  wt('ki_watch_tennis_band', 'King Ice Iced Tennis Band Watch', 'King Ice', 240_00, 61, 0.45),
];

// ---------------------------------------------------------------------------
// The custom houses
// ---------------------------------------------------------------------------

export const CUSTOM_HOUSES: readonly RealGood[] = [
  // --- Johnny Dang & Co., Houston, the grillz house ---------------------------------------------------
  gz('jd_grill_10k_6b', 'Johnny Dang 10K Gold 6 Tooth Bottom Grill', 'Johnny Dang & Co.', 1_200_00, 88),
  gz('jd_grill_10k_8t', 'Johnny Dang 10K Gold 8 Tooth Top Grill', 'Johnny Dang & Co.', 1_600_00, 88),
  gz('jd_grill_14k_set', 'Johnny Dang 14K Gold Top And Bottom Grill Set', 'Johnny Dang & Co.', 4_200_00, 90),
  gz('jd_grill_dia_6b', 'Johnny Dang Diamond 6 Tooth Bottom Grill', 'Johnny Dang & Co.', 8_500_00, 93),
  gz('jd_grill_dia_set', 'Johnny Dang Diamond Top And Bottom Grill Set', 'Johnny Dang & Co.', 19_000_00, 94),
  gz('jd_grill_vvs_set', 'Johnny Dang VVS Diamond Full Grill Set', 'Johnny Dang & Co.', 48_000_00, 96),
  gz('jd_grill_fang', 'Johnny Dang 14K Gold Single Fang Grill', 'Johnny Dang & Co.', 520_00, 85),
  gz('jd_grill_open_face', 'Johnny Dang 14K Gold Open Face Grill', 'Johnny Dang & Co.', 2_200_00, 88),
  gz('jd_grill_invisible', 'Johnny Dang Invisible Set Diamond Grill', 'Johnny Dang & Co.', 26_000_00, 95),
  gz('jd_grill_custom', 'Johnny Dang Custom Design Diamond Grill', 'Johnny Dang & Co.', 32_000_00, 95),
  jw('jd_cuban_14k_12', 'Johnny Dang 14K Gold 12mm Miami Cuban Link Chain', 'Johnny Dang & Co.', 'chain', 12_500_00, 88, 0.06),
  jw('jd_dia_cuban_12', 'Johnny Dang 14K Gold 12mm Diamond Miami Cuban Link Chain', 'Johnny Dang & Co.', 'chain', 62_000_00, 93, 0.10),
  jw('jd_pend_custom', 'Johnny Dang Custom Diamond Pendant', 'Johnny Dang & Co.', 'pendant', 28_000_00, 94, 0.12),
  jw('jd_pend_jesus', 'Johnny Dang Diamond Jesus Piece Pendant', 'Johnny Dang & Co.', 'pendant', 14_000_00, 92, 0.12),
  jw('jd_tennis_5', 'Johnny Dang 14K Gold 5mm Diamond Tennis Chain', 'Johnny Dang & Co.', 'chain', 26_000_00, 92, 0.10),
  wt('jd_bust_datejust', 'Johnny Dang Bust Down Rolex Datejust 41', 'Johnny Dang & Co.', 44_000_00, 93, 0.10, ['bust down']),
  // --- Jacob & Co., New York ---------------------------------------------------------------------------
  wt('jc_astronomia', 'Jacob & Co. Astronomia Tourbillon', 'Jacob & Co.', 640_000_00, 99, 0.06),
  wt('jc_astronomia_solar', 'Jacob & Co. Astronomia Solar', 'Jacob & Co.', 380_000_00, 98, 0.06),
  wt('jc_twin_turbo', 'Jacob & Co. Twin Turbo Furious', 'Jacob & Co.', 620_000_00, 99, 0.06),
  wt('jc_bugatti_chiron', 'Jacob & Co. Bugatti Chiron Tourbillon', 'Jacob & Co.', 300_000_00, 98, 0.06),
  wt('jc_epic_x', 'Jacob & Co. Epic X', 'Jacob & Co.', 24_000_00, 92, 0.10),
  wt('jc_epic_x_chrono', 'Jacob & Co. Epic X Chrono', 'Jacob & Co.', 42_000_00, 93, 0.10),
  wt('jc_godfather', 'Jacob & Co. Opera Godfather Minute Repeater', 'Jacob & Co.', 480_000_00, 99, 0.06),
  wt('jc_brilliant', 'Jacob & Co. Brilliant Full Baguette', 'Jacob & Co.', 260_000_00, 97, 0.07),
  wt('jc_palatial', 'Jacob & Co. Palatial Classic Manual', 'Jacob & Co.', 28_000_00, 92, 0.10),
  wt('jc_five_time_zone', 'Jacob & Co. Five Time Zone', 'Jacob & Co.', 18_000_00, 90, 0.11),
  jw('jc_dia_cuban', 'Jacob & Co. Diamond Cuban Link Necklace', 'Jacob & Co.', 'chain', 185_000_00, 97, 0.08),
  jw('jc_emerald_cut_chain', 'Jacob & Co. Emerald Cut Diamond Necklace', 'Jacob & Co.', 'necklace', 420_000_00, 98, 0.07),
  jw('jc_dia_bracelet', 'Jacob & Co. Diamond Cuban Link Bracelet', 'Jacob & Co.', 'bracelet', 68_000_00, 96, 0.08),
  jw('jc_dia_ring', 'Jacob & Co. Baguette Diamond Ring', 'Jacob & Co.', 'ring', 42_000_00, 95, 0.08),
  jw('jc_dia_studs', 'Jacob & Co. Diamond Stud Earrings', 'Jacob & Co.', 'earrings', 36_000_00, 95, 0.08),
  // --- Eliantte & Co., New York ------------------------------------------------------------------------
  jw('el_dia_cuban_15', 'Eliantte 14K Gold 15mm Diamond Miami Cuban Link Chain', 'Eliantte & Co.', 'chain', 95_000_00, 95, 0.10),
  jw('el_dia_cuban_20', 'Eliantte 14K Gold 20mm Diamond Miami Cuban Link Chain', 'Eliantte & Co.', 'chain', 160_000_00, 96, 0.10),
  jw('el_pend_custom', 'Eliantte Custom Diamond Pendant', 'Eliantte & Co.', 'pendant', 45_000_00, 95, 0.12),
  jw('el_pend_portrait', 'Eliantte Custom Diamond Portrait Pendant', 'Eliantte & Co.', 'pendant', 60_000_00, 95, 0.12),
  jw('el_tennis_8', 'Eliantte 14K Gold 8mm Diamond Tennis Chain', 'Eliantte & Co.', 'chain', 74_000_00, 94, 0.10),
  jw('el_dia_bracelet_12', 'Eliantte 14K Gold 12mm Diamond Cuban Bracelet', 'Eliantte & Co.', 'bracelet', 28_000_00, 94, 0.10),
  jw('el_dia_ring', 'Eliantte Diamond Cluster Ring', 'Eliantte & Co.', 'ring', 12_000_00, 92, 0.12),
  jw('el_dia_studs', 'Eliantte Diamond Cluster Stud Earrings', 'Eliantte & Co.', 'earrings', 8_500_00, 91, 0.10),
  wt('el_bust_royal_oak', 'Eliantte Bust Down Audemars Piguet Royal Oak', 'Eliantte & Co.', 160_000_00, 96, 0.09, ['bust down']),
  wt('el_bust_day_date', 'Eliantte Bust Down Rolex Day-Date 40', 'Eliantte & Co.', 92_000_00, 95, 0.09, ['bust down']),
  wt('el_bust_nautilus', 'Eliantte Bust Down Patek Philippe Nautilus', 'Eliantte & Co.', 240_000_00, 97, 0.08, ['bust down']),
  // --- IF & Co., Los Angeles ---------------------------------------------------------------------------
  jw('if_pend_custom', 'IF & Co. Custom Diamond Pendant', 'IF & Co.', 'pendant', 38_000_00, 95, 0.12),
  jw('if_pend_bezel', 'IF & Co. Diamond Bezel Pendant', 'IF & Co.', 'pendant', 22_000_00, 93, 0.10),
  jw('if_tennis_5', 'IF & Co. 14K Gold 5mm Diamond Tennis Chain', 'IF & Co.', 'chain', 28_000_00, 93, 0.10),
  jw('if_dia_cuban_12', 'IF & Co. 14K Gold 12mm Diamond Cuban Link Chain', 'IF & Co.', 'chain', 64_000_00, 94, 0.10),
  jw('if_cuban_14k_14', 'IF & Co. 14K Gold 14mm Miami Cuban Link Chain', 'IF & Co.', 'chain', 17_500_00, 89, 0.06),
  jw('if_dia_bracelet', 'IF & Co. Diamond Tennis Bracelet', 'IF & Co.', 'bracelet', 12_000_00, 92, 0.10),
  jw('if_dia_ring', 'IF & Co. Diamond Signet Ring', 'IF & Co.', 'ring', 9_500_00, 91, 0.12, 'men'),
  jw('if_dia_studs', 'IF & Co. Diamond Stud Earrings', 'IF & Co.', 'earrings', 7_800_00, 91, 0.08),
  wt('if_bust_datejust', 'IF & Co. Bust Down Rolex Datejust 41', 'IF & Co.', 45_000_00, 93, 0.10, ['bust down']),
  wt('if_bust_offshore', 'IF & Co. Bust Down Audemars Piguet Royal Oak Offshore', 'IF & Co.', 170_000_00, 96, 0.09, ['bust down']),
  // --- Avianne & Co., New York -------------------------------------------------------------------------
  jw('av_dia_cuban_10', 'Avianne 14K Gold 10mm Diamond Miami Cuban Link Chain', 'Avianne & Co.', 'chain', 40_000_00, 93, 0.10),
  jw('av_cuban_14k_12', 'Avianne 14K Gold 12mm Miami Cuban Link Chain', 'Avianne & Co.', 'chain', 11_800_00, 88, 0.06),
  jw('av_tennis_4', 'Avianne 14K Gold 4mm Diamond Tennis Chain', 'Avianne & Co.', 'chain', 16_500_00, 91, 0.10),
  jw('av_pend_jesus', 'Avianne Diamond Jesus Piece Pendant', 'Avianne & Co.', 'pendant', 10_500_00, 91, 0.12),
  jw('av_pend_cross', 'Avianne Diamond Cross Pendant', 'Avianne & Co.', 'pendant', 7_200_00, 90, 0.12),
  jw('av_ring_engagement', 'Avianne Diamond Halo Engagement Ring', 'Avianne & Co.', 'ring', 14_000_00, 92, 0.08, 'women'),
  jw('av_ring_pinky', 'Avianne Diamond Pinky Ring', 'Avianne & Co.', 'ring', 5_800_00, 89, 0.12, 'men'),
  jw('av_studs_2ct', 'Avianne 2 Carat Diamond Stud Earrings', 'Avianne & Co.', 'earrings', 13_000_00, 92, 0.08),
  jw('av_dia_bracelet', 'Avianne Diamond Cuban Link Bracelet', 'Avianne & Co.', 'bracelet', 17_000_00, 92, 0.10),
  wt('av_bust_datejust', 'Avianne Bust Down Rolex Datejust 41', 'Avianne & Co.', 43_000_00, 93, 0.10, ['bust down']),
  // --- Rafaello & Co., New York ------------------------------------------------------------------------
  jw('rf_pend_custom', 'Rafaello Custom Diamond Pendant', 'Rafaello & Co.', 'pendant', 32_000_00, 94, 0.12),
  jw('rf_dia_cuban_12', 'Rafaello 14K Gold 12mm Diamond Miami Cuban Link Chain', 'Rafaello & Co.', 'chain', 58_000_00, 93, 0.10),
  jw('rf_tennis_6', 'Rafaello 14K Gold 6mm Diamond Tennis Chain', 'Rafaello & Co.', 'chain', 38_000_00, 93, 0.10),
  jw('rf_pend_angel', 'Rafaello Diamond Angel Pendant', 'Rafaello & Co.', 'pendant', 9_800_00, 91, 0.12),
  jw('rf_dia_bracelet', 'Rafaello Diamond Tennis Bracelet', 'Rafaello & Co.', 'bracelet', 11_500_00, 92, 0.10),
  jw('rf_dia_ring', 'Rafaello Diamond Cluster Ring', 'Rafaello & Co.', 'ring', 8_400_00, 90, 0.12),
  wt('rf_bust_day_date', 'Rafaello Bust Down Rolex Day-Date 40', 'Rafaello & Co.', 90_000_00, 95, 0.09, ['bust down']),
  // --- Greg Yuna, New York ------------------------------------------------------------------------------
  jw('gy_dog_tag', 'Greg Yuna Diamond Dog Tag Necklace', 'Greg Yuna', 'necklace', 24_000_00, 94, 0.10),
  jw('gy_dia_cuban_10', 'Greg Yuna 14K Gold 10mm Diamond Cuban Link Chain', 'Greg Yuna', 'chain', 42_000_00, 94, 0.10),
  jw('gy_tennis_5', 'Greg Yuna 14K Gold 5mm Diamond Tennis Chain', 'Greg Yuna', 'chain', 27_000_00, 93, 0.10),
  jw('gy_pend_custom', 'Greg Yuna Custom Diamond Pendant', 'Greg Yuna', 'pendant', 36_000_00, 95, 0.12),
  jw('gy_dia_bracelet', 'Greg Yuna Diamond Cuban Link Bracelet', 'Greg Yuna', 'bracelet', 19_500_00, 93, 0.10),
  jw('gy_dia_ring', 'Greg Yuna Diamond Pinky Ring', 'Greg Yuna', 'ring', 7_400_00, 91, 0.12, 'men'),
  // --- Pristine Jewelers, New York ---------------------------------------------------------------------
  jw('pj_dia_cuban_12', 'Pristine 14K Gold 12mm Diamond Miami Cuban Link Chain', 'Pristine Jewelers', 'chain', 54_000_00, 93, 0.10),
  jw('pj_tennis_5', 'Pristine 14K Gold 5mm Diamond Tennis Chain', 'Pristine Jewelers', 'chain', 25_000_00, 92, 0.10),
  jw('pj_pend_custom', 'Pristine Custom Diamond Pendant', 'Pristine Jewelers', 'pendant', 30_000_00, 94, 0.12),
  jw('pj_dia_bracelet', 'Pristine Diamond Cuban Link Bracelet', 'Pristine Jewelers', 'bracelet', 18_000_00, 92, 0.10),
  wt('pj_bust_datejust', 'Pristine Bust Down Rolex Datejust 41', 'Pristine Jewelers', 41_000_00, 93, 0.10, ['bust down']),
  // --- GLD, Miami; Frost NYC; TraxNYC; Popular Jewelry -------------------------------------------------
  jw('gld_cuban_8', 'GLD 8mm Miami Cuban Chain', 'GLD', 'chain', 130_00, 62, 0.40),
  jw('gld_cuban_12', 'GLD 12mm Miami Cuban Chain', 'GLD', 'chain', 180_00, 62, 0.40),
  jw('gld_tennis_5', 'GLD 5mm Tennis Chain', 'GLD', 'chain', 150_00, 62, 0.40),
  jw('gld_pend_cross', 'GLD Iced Cross Necklace', 'GLD', 'pendant', 110_00, 61, 0.40),
  jw('gld_ring_cuban', 'GLD Iced Cuban Link Ring', 'GLD', 'ring', 80_00, 60, 0.40),
  jw('gld_bracelet_cuban', 'GLD 8mm Miami Cuban Bracelet', 'GLD', 'bracelet', 90_00, 61, 0.40),
  jw('gld_studs', 'GLD Iced Stud Earrings', 'GLD', 'earrings', 45_00, 59, 0.40),
  jw('fn_dia_cuban_10', 'Frost NYC 14K Gold 10mm Diamond Miami Cuban Link Chain', 'Frost NYC', 'chain', 34_000_00, 91, 0.10),
  jw('fn_cuban_14k_10', 'Frost NYC 14K Gold 10mm Miami Cuban Link Chain', 'Frost NYC', 'chain', 7_800_00, 87, 0.06),
  jw('fn_pend_jesus', 'Frost NYC Diamond Jesus Piece Pendant', 'Frost NYC', 'pendant', 8_900_00, 90, 0.12),
  jw('fn_tennis_4', 'Frost NYC 14K Gold 4mm Diamond Tennis Chain', 'Frost NYC', 'chain', 14_500_00, 90, 0.10),
  gz('fn_grill_dia_6b', 'Frost NYC Diamond 6 Tooth Bottom Grill', 'Frost NYC', 6_200_00, 90),
  jw('tx_dia_cuban_12', 'TraxNYC 14K Gold 12mm Diamond Miami Cuban Link Chain', 'TraxNYC', 'chain', 48_000_00, 92, 0.10),
  jw('tx_cuban_10k_12', 'TraxNYC 10K Gold 12mm Miami Cuban Link Chain', 'TraxNYC', 'chain', 6_900_00, 85, 0.06),
  jw('tx_pend_custom', 'TraxNYC Custom Diamond Pendant', 'TraxNYC', 'pendant', 24_000_00, 93, 0.12),
  jw('tx_tennis_5', 'TraxNYC 14K Gold 5mm Diamond Tennis Chain', 'TraxNYC', 'chain', 22_000_00, 91, 0.10),
  jw('tx_ring_pinky', 'TraxNYC Diamond Pinky Ring', 'TraxNYC', 'ring', 4_900_00, 88, 0.12, 'men'),
  jw('pp_nameplate', 'Popular Jewelry 14K Gold Nameplate Necklace', 'Popular Jewelry', 'necklace', 1_400_00, 86, 0.08),
  jw('pp_nameplate_dia', 'Popular Jewelry 14K Gold Diamond Nameplate Necklace', 'Popular Jewelry', 'necklace', 5_200_00, 89, 0.10),
  jw('pp_cuban_14k_8', 'Popular Jewelry 14K Gold 8mm Miami Cuban Link Chain', 'Popular Jewelry', 'chain', 5_400_00, 86, 0.06),
  jw('pp_cuban_10k_10', 'Popular Jewelry 10K Gold 10mm Miami Cuban Link Chain', 'Popular Jewelry', 'chain', 5_100_00, 84, 0.06),
  jw('pp_rope_14k_5', 'Popular Jewelry 14K Gold 5mm Rope Chain', 'Popular Jewelry', 'chain', 2_600_00, 85, 0.06),
  jw('pp_door_knocker', 'Popular Jewelry 14K Gold Door Knocker Earrings', 'Popular Jewelry', 'earrings', 1_900_00, 86, 0.08, 'women'),
  jw('pp_bamboo_hoops', 'Popular Jewelry 14K Gold Bamboo Hoop Earrings', 'Popular Jewelry', 'earrings', 1_600_00, 86, 0.08, 'women'),
  jw('pp_four_finger_ring', 'Popular Jewelry 14K Gold Four Finger Nameplate Ring', 'Popular Jewelry', 'ring', 2_800_00, 86, 0.08),
  jw('pp_pend_initial', 'Popular Jewelry 14K Gold Diamond Initial Pendant', 'Popular Jewelry', 'pendant', 2_400_00, 87, 0.10),
];

/** Every iced-out piece, for the catalog. */
export const REAL_ICE: readonly RealGood[] = [...ICEBOX, ...KING_ICE, ...CUSTOM_HOUSES];

/** What the floor says beside a bust-down. */
export const BUST_DOWN_NOTE =
  'A bust-down is a real watch a house has set with stones. The base watch is named as the house names it; '
  + 'the stones, the setting and the price are the house’s work and SLATE’s calibration.';
