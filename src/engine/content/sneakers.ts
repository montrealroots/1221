/**
 * SLATE — the shoe brands, in the depth they actually have.
 *
 * Nike does not make twenty shoes. It makes hundreds, and a player who knows
 * the difference between a 990v6 and a 993 notices immediately when a game
 * offers four sneakers and calls it a catalog. So this file carries the real
 * lines: the silhouettes, the runners, the basketball signatures, the boots,
 * and the colorways famous enough to be their own product.
 *
 * A note on colorways, because it is the one thing that could be dishonest
 * here. A Chicago and a Bred are not two names for one shoe: they are
 * separate releases with separate dates and separate prices, and the trade
 * treats them as separate products. Where this file lists one it is because
 * that release exists. It does not multiply a shoe by its color chart to
 * inflate a number.
 *
 * Everything is public record: the model, the brand, the silhouette. Nothing
 * about the money is. Prices, quality figures and how fast a shoe wears are
 * SLATE's own calibration, stamped on every row and printed on screen.
 */

import { REFERENCE_VERSION } from './reference';
import type { RealGood } from './goods';

const REAL = {
  source: 'calibrated_estimate', confidence: 'high', version: REFERENCE_VERSION,
  note: 'A real shoe, named as public record. Price, quality and wear are SLATE’s own calibration.',
} as const;

const ALL_YEAR = ['Spring', 'Summer', 'Autumn', 'Winter'];

/**
 * A shoe. `sub` is what it is for, which is how the shop floor sorts a wall.
 *
 * `formality` matters more than it sounds: it is how the dressing room mirror
 * decides whether trainers under a suit is a choice or a mistake.
 */
const sh = (
  id: string, name: string, brand: string, sub: string, price: number,
  quality: number, audience: 'men' | 'women' | 'unisex' = 'unisex',
  formality = 16, depreciation = 0.34, seasons: string[] = ALL_YEAR,
): RealGood => ({
  id, name, type: 'product', category: 'footwear', subcategory: sub, basePrice: price, brand,
  tags: ['wear', 'shoes', sub], quality, depreciation, slot: 'shoes', formality, seasons,
  audience, ...REAL,
});

/** Something the same brand makes that is not a shoe. */
const ap = (
  id: string, name: string, brand: string, sub: string, price: number,
  slot: string, formality: number, quality: number,
  audience: 'men' | 'women' | 'unisex' = 'unisex', seasons: string[] = ALL_YEAR,
): RealGood => ({
  id, name, type: 'product', category: 'clothing', subcategory: sub, basePrice: price, brand,
  tags: ['wear', sub], quality, depreciation: 0.4, slot, formality, seasons, audience, ...REAL,
});

/** A bag, a cap, a pair of socks. */
const ac = (
  id: string, name: string, brand: string, sub: string, price: number,
  slot: string, quality: number, audience: 'men' | 'women' | 'unisex' = 'unisex',
): RealGood => ({
  id, name, type: 'product', category: 'accessory', subcategory: sub, basePrice: price, brand,
  tags: ['wear', sub], quality, depreciation: 0.38, slot, formality: 14, seasons: ALL_YEAR,
  audience, ...REAL,
});

const WINTER = ['Autumn', 'Winter'];

// ---------------------------------------------------------------------------
// Nike
// ---------------------------------------------------------------------------

export const NIKE: readonly RealGood[] = [
  // --- Air Force 1, which is its own economy -------------------------------------------------------
  sh('nk_af1_low_07', 'Nike Air Force 1 Low ’07', 'Nike', 'trainer', 115_00, 82),
  sh('nk_af1_mid_07', 'Nike Air Force 1 Mid ’07', 'Nike', 'trainer', 125_00, 81),
  sh('nk_af1_high_07', 'Nike Air Force 1 High ’07', 'Nike', 'trainer', 135_00, 80),
  sh('nk_af1_shadow', 'Nike Air Force 1 Shadow', 'Nike', 'trainer', 130_00, 79, 'women'),
  sh('nk_af1_lv8', 'Nike Air Force 1 LV8', 'Nike', 'trainer', 125_00, 79),
  sh('nk_af1_luxe', 'Nike Air Force 1 Luxe', 'Nike', 'trainer', 160_00, 84),
  sh('nk_af1_fontanka', 'Nike Air Force 1 Fontanka', 'Nike', 'trainer', 130_00, 76, 'women'),
  sh('nk_af1_react', 'Nike Air Force 1 React', 'Nike', 'trainer', 145_00, 80),
  // --- Air Max ---------------------------------------------------------------------------------------
  sh('nk_am1_86', 'Nike Air Max 1 ’86 OG', 'Nike', 'trainer', 160_00, 87),
  sh('nk_am95', 'Nike Air Max 95', 'Nike', 'trainer', 185_00, 86),
  sh('nk_am97', 'Nike Air Max 97', 'Nike', 'trainer', 185_00, 85),
  sh('nk_am_plus', 'Nike Air Max Plus', 'Nike', 'trainer', 180_00, 84),
  sh('nk_am_plus_3', 'Nike Air Max Plus III', 'Nike', 'trainer', 190_00, 83),
  sh('nk_am_bw', 'Nike Air Max BW OG', 'Nike', 'trainer', 170_00, 84),
  sh('nk_am_180', 'Nike Air Max 180', 'Nike', 'trainer', 160_00, 82),
  sh('nk_am_93', 'Nike Air Max 93', 'Nike', 'trainer', 165_00, 81),
  sh('nk_am_98', 'Nike Air Max 98', 'Nike', 'trainer', 190_00, 83),
  sh('nk_am_270', 'Nike Air Max 270', 'Nike', 'trainer', 160_00, 78),
  sh('nk_am_720', 'Nike Air Max 720', 'Nike', 'trainer', 185_00, 77),
  sh('nk_am_dn', 'Nike Air Max Dn', 'Nike', 'trainer', 160_00, 79),
  sh('nk_am_scorpion', 'Nike Air Max Scorpion', 'Nike', 'trainer', 260_00, 80),
  sh('nk_am_tailwind', 'Nike Air Max Tailwind IV', 'Nike', 'trainer', 165_00, 79),
  sh('nk_am_koko', 'Nike Air Max Koko Sandal', 'Nike', 'casual', 95_00, 70, 'women'),
  sh('nk_am_terrascape_90', 'Nike Air Max Terrascape 90', 'Nike', 'trainer', 170_00, 78),
  // --- Dunk and SB ------------------------------------------------------------------------------------
  sh('nk_dunk_low', 'Nike Dunk Low Retro', 'Nike', 'trainer', 115_00, 84),
  sh('nk_dunk_high', 'Nike Dunk High Retro', 'Nike', 'trainer', 130_00, 82),
  sh('nk_dunk_low_panda', 'Nike Dunk Low Retro White Black Panda', 'Nike', 'trainer', 120_00, 85),
  sh('nk_dunk_low_twist', 'Nike Dunk Low Twist', 'Nike', 'trainer', 125_00, 78, 'women'),
  sh('nk_sb_dunk_low', 'Nike SB Dunk Low Pro', 'Nike', 'skate', 115_00, 86),
  sh('nk_sb_dunk_high', 'Nike SB Dunk High Pro', 'Nike', 'skate', 125_00, 84),
  sh('nk_sb_blazer', 'Nike SB Zoom Blazer Mid', 'Nike', 'skate', 90_00, 80),
  sh('nk_sb_janoski', 'Nike SB Zoom Stefan Janoski OG+', 'Nike', 'skate', 95_00, 81),
  sh('nk_sb_force58', 'Nike SB Force 58', 'Nike', 'skate', 80_00, 76),
  sh('nk_sb_nyjah', 'Nike SB Nyjah 3', 'Nike', 'skate', 110_00, 80),
  // --- The old runners, worn as trainers ---------------------------------------------------------------
  sh('nk_blazer_mid_77', 'Nike Blazer Mid ’77 Vintage', 'Nike', 'trainer', 105_00, 81),
  sh('nk_blazer_low_77', 'Nike Blazer Low ’77 Vintage', 'Nike', 'trainer', 95_00, 79),
  sh('nk_killshot', 'Nike Killshot 2 Leather', 'Nike', 'trainer', 95_00, 82),
  sh('nk_waffle_debut', 'Nike Waffle Debut', 'Nike', 'trainer', 80_00, 74),
  sh('nk_daybreak', 'Nike Daybreak', 'Nike', 'trainer', 100_00, 78),
  sh('nk_field_general', 'Nike Field General ’82', 'Nike', 'trainer', 110_00, 79),
  sh('nk_v2k_run', 'Nike V2K Run', 'Nike', 'trainer', 115_00, 76),
  sh('nk_p6000', 'Nike P-6000', 'Nike', 'trainer', 110_00, 76),
  sh('nk_huarache', 'Nike Air Huarache', 'Nike', 'trainer', 130_00, 82),
  sh('nk_presto', 'Nike Air Presto', 'Nike', 'trainer', 140_00, 80),
  sh('nk_zoom_vomero5', 'Nike Zoom Vomero 5', 'Nike', 'trainer', 160_00, 83),
  // --- Road running ---------------------------------------------------------------------------------
  sh('nk_pegasus_plus', 'Nike Pegasus Plus', 'Nike', 'running', 180_00, 87),
  sh('nk_pegasus_premium', 'Nike Pegasus Premium', 'Nike', 'running', 210_00, 88),
  sh('nk_vomero_18', 'Nike Vomero 18', 'Nike', 'running', 150_00, 87),
  sh('nk_structure_25', 'Nike Air Zoom Structure 25', 'Nike', 'running', 140_00, 84),
  sh('nk_invincible_3', 'Nike ZoomX Invincible Run 3', 'Nike', 'running', 180_00, 89),
  sh('nk_infinity_rn4', 'Nike React Infinity Run Flyknit 4', 'Nike', 'running', 160_00, 85),
  sh('nk_zoom_fly_6', 'Nike Zoom Fly 6', 'Nike', 'running', 180_00, 87),
  sh('nk_vaporfly_3', 'Nike ZoomX Vaporfly Next% 3', 'Nike', 'running', 260_00, 94),
  sh('nk_streakfly', 'Nike ZoomX Streakfly', 'Nike', 'running', 160_00, 88),
  sh('nk_winflo_11', 'Nike Air Winflo 11', 'Nike', 'running', 110_00, 78),
  sh('nk_downshifter_13', 'Nike Downshifter 13', 'Nike', 'running', 75_00, 68),
  sh('nk_revolution_7', 'Nike Revolution 7', 'Nike', 'running', 70_00, 66),
  sh('nk_interact_run', 'Nike Interact Run', 'Nike', 'running', 85_00, 72),
  sh('nk_motiva', 'Nike Motiva', 'Nike', 'running', 130_00, 79),
  // --- Trail -----------------------------------------------------------------------------------------
  sh('nk_pegasus_trail_5', 'Nike Pegasus Trail 5', 'Nike', 'running', 150_00, 84),
  sh('nk_wildhorse_8', 'Nike Wildhorse 8', 'Nike', 'running', 145_00, 83),
  sh('nk_zegama_2', 'Nike Zegama 2', 'Nike', 'running', 165_00, 85),
  sh('nk_ultrafly_trail', 'Nike Ultrafly Trail', 'Nike', 'running', 260_00, 90),
  sh('nk_juniper_trail_3', 'Nike Juniper Trail 3', 'Nike', 'running', 85_00, 74),
  // --- Basketball -------------------------------------------------------------------------------------
  sh('nk_lebron_22', 'Nike LeBron 22', 'Nike', 'basketball', 200_00, 89),
  sh('nk_lebron_witness_9', 'Nike LeBron Witness 9', 'Nike', 'basketball', 110_00, 78),
  sh('nk_kd_17', 'Nike KD 17', 'Nike', 'basketball', 155_00, 87),
  sh('nk_kobe_6_protro', 'Nike Kobe 6 Protro', 'Nike', 'basketball', 190_00, 92),
  sh('nk_kobe_8_protro', 'Nike Kobe 8 Protro', 'Nike', 'basketball', 180_00, 91),
  sh('nk_kobe_9_elite', 'Nike Kobe 9 Elite Protro', 'Nike', 'basketball', 200_00, 90),
  sh('nk_gt_cut_3', 'Nike G.T. Cut 3', 'Nike', 'basketball', 190_00, 90),
  sh('nk_gt_jump_2', 'Nike G.T. Jump 2', 'Nike', 'basketball', 180_00, 88),
  sh('nk_giannis_immortality_4', 'Nike Giannis Immortality 4', 'Nike', 'basketball', 85_00, 78),
  sh('nk_freak_6', 'Nike Zoom Freak 6', 'Nike', 'basketball', 125_00, 84),
  sh('nk_ja_2', 'Nike Ja 2', 'Nike', 'basketball', 130_00, 85),
  sh('nk_sabrina_2', 'Nike Sabrina 2', 'Nike', 'basketball', 130_00, 86, 'women'),
  sh('nk_book_1', 'Nike Book 1', 'Nike', 'basketball', 140_00, 85),
  // --- Training and lifting ------------------------------------------------------------------------------
  sh('nk_free_metcon_6', 'Nike Free Metcon 6', 'Nike', 'training', 130_00, 84),
  sh('nk_superrep_4', 'Nike Zoom SuperRep 4 Next Nature', 'Nike', 'training', 120_00, 80),
  sh('nk_romaleos_4', 'Nike Romaleos 4', 'Nike', 'training', 200_00, 90),
  sh('nk_savaleos', 'Nike Savaleos', 'Nike', 'training', 120_00, 82),
  // --- Football boots ------------------------------------------------------------------------------------
  sh('nk_mercurial_superfly_10', 'Nike Mercurial Superfly 10 Elite', 'Nike', 'football', 290_00, 92),
  sh('nk_mercurial_vapor_16', 'Nike Mercurial Vapor 16 Elite', 'Nike', 'football', 275_00, 91),
  sh('nk_phantom_gx2', 'Nike Phantom GX 2 Elite', 'Nike', 'football', 280_00, 91),
  sh('nk_tiempo_legend_10', 'Nike Tiempo Legend 10 Elite', 'Nike', 'football', 250_00, 90),
  sh('nk_premier_3', 'Nike Premier 3 FG', 'Nike', 'football', 130_00, 84),
  // --- Apparel ----------------------------------------------------------------------------------------
  ap('nk_tech_fleece_hoodie', 'Nike Tech Fleece Full Zip Hoodie', 'Nike', 'sport', 130_00, 'top', 18, 85),
  ap('nk_tech_fleece_joggers', 'Nike Tech Fleece Joggers', 'Nike', 'sport', 115_00, 'bottom', 16, 85),
  ap('nk_club_fleece_hoodie', 'Nike Sportswear Club Fleece Hoodie', 'Nike', 'sport', 65_00, 'top', 14, 74),
  ap('nk_windrunner', 'Nike Sportswear Windrunner Jacket', 'Nike', 'sport', 100_00, 'outerwear', 18, 82),
  ap('nk_solo_swoosh_hoodie', 'Nike Solo Swoosh Fleece Hoodie', 'Nike', 'sport', 90_00, 'top', 16, 80),
  ap('nk_therma_adv', 'Nike Therma-FIT ADV Repel Jacket', 'Nike', 'sport', 200_00, 'outerwear', 18, 87, 'unisex', WINTER),
  ap('nk_storm_fit_adv', 'Nike Storm-FIT ADV Run Division Jacket', 'Nike', 'sport', 230_00, 'outerwear', 16, 88),
  ap('nk_acg_smith_summit', 'Nike ACG Smith Summit Cargo Trousers', 'Nike', 'sport', 150_00, 'bottom', 16, 84),
  ap('nk_life_puffer', 'Nike Life Woven Puffer Jacket', 'Nike', 'sport', 190_00, 'outerwear', 18, 82, 'unisex', WINTER),
  ap('nk_dri_fit_adv_techknit', 'Nike Dri-FIT ADV TechKnit Ultra Running Top', 'Nike', 'sport', 85_00, 'top', 10, 86),
  ap('nk_pro_tights', 'Nike Pro Dri-FIT Tights', 'Nike', 'sport', 55_00, 'bottom', 8, 80),
  ap('nk_swoosh_bra', 'Nike Swoosh Medium Support Bra', 'Nike', 'sport', 40_00, 'base', 4, 80, 'women'),
  ap('nk_essential_tee', 'Nike Sportswear Essential T-Shirt', 'Nike', 'sport', 32_00, 'top', 12, 72),
  ap('nk_challenger_shorts', 'Nike Dri-FIT Challenger 5 Inch Shorts', 'Nike', 'sport', 45_00, 'bottom', 8, 80),
  ap('nk_aeroswift_singlet', 'Nike Dri-FIT ADV AeroSwift Racing Singlet', 'Nike', 'sport', 90_00, 'top', 6, 88),
  // --- Accessories -------------------------------------------------------------------------------------
  ac('nk_elite_backpack', 'Nike Elite Pro Basketball Backpack', 'Nike', 'bag', 110_00, 'bag', 84),
  ac('nk_brasilia_backpack', 'Nike Brasilia 9.5 Training Backpack', 'Nike', 'bag', 55_00, 'bag', 76),
  ac('nk_heritage_waist', 'Nike Heritage Waist Bag', 'Nike', 'bag', 30_00, 'bag', 70),
  ac('nk_club_cap', 'Nike Club Unstructured Swoosh Cap', 'Nike', 'hat', 28_00, 'hat', 72),
  ac('nk_dri_fit_headband', 'Nike Dri-FIT Head Tie', 'Nike', 'accessory', 18_00, 'hat', 68),
  ac('nk_vapor_elite_gloves', 'Nike Vapor Jet 8.0 Football Gloves', 'Nike', 'gloves', 60_00, 'gloves', 82),
];

// ---------------------------------------------------------------------------
// Jordan
// ---------------------------------------------------------------------------

export const JORDAN: readonly RealGood[] = [
  // --- The Air Jordan 1, and the releases that are their own products -------------------------------
  sh('jd_aj1_high_og', 'Air Jordan 1 Retro High OG', 'Jordan', 'basketball', 180_00, 92),
  sh('jd_aj1_chicago', 'Air Jordan 1 Retro High OG Chicago', 'Jordan', 'basketball', 200_00, 95),
  sh('jd_aj1_bred', 'Air Jordan 1 Retro High OG Bred Toe', 'Jordan', 'basketball', 200_00, 94),
  sh('jd_aj1_royal', 'Air Jordan 1 Retro High OG Royal', 'Jordan', 'basketball', 195_00, 93),
  sh('jd_aj1_shadow', 'Air Jordan 1 Retro High OG Shadow', 'Jordan', 'basketball', 190_00, 92),
  sh('jd_aj1_unc', 'Air Jordan 1 Retro High OG University Blue', 'Jordan', 'basketball', 195_00, 93),
  sh('jd_aj1_mocha', 'Air Jordan 1 Retro High OG Dark Mocha', 'Jordan', 'basketball', 195_00, 93),
  sh('jd_aj1_mid', 'Air Jordan 1 Mid', 'Jordan', 'basketball', 130_00, 80),
  sh('jd_aj1_low', 'Air Jordan 1 Low', 'Jordan', 'basketball', 120_00, 82),
  sh('jd_aj1_low_og', 'Air Jordan 1 Low OG', 'Jordan', 'basketball', 150_00, 86),
  sh('jd_aj1_zoom_cmft2', 'Air Jordan 1 Zoom CMFT 2', 'Jordan', 'basketball', 150_00, 82),
  sh('jd_aj1_elevate_low', 'Air Jordan 1 Elevate Low', 'Jordan', 'basketball', 135_00, 79, 'women'),
  sh('jd_aj1_brooklyn', 'Air Jordan 1 Brooklyn', 'Jordan', 'basketball', 145_00, 80, 'women'),
  // --- The numbered line, two through the present ------------------------------------------------------
  sh('jd_aj2', 'Air Jordan 2 Retro', 'Jordan', 'basketball', 200_00, 85),
  sh('jd_aj3', 'Air Jordan 3 Retro', 'Jordan', 'basketball', 210_00, 92),
  sh('jd_aj3_white_cement', 'Air Jordan 3 Retro White Cement Reimagined', 'Jordan', 'basketball', 215_00, 94),
  sh('jd_aj3_black_cement', 'Air Jordan 3 Retro Black Cement', 'Jordan', 'basketball', 210_00, 93),
  sh('jd_aj4', 'Air Jordan 4 Retro', 'Jordan', 'basketball', 215_00, 93),
  sh('jd_aj4_bred', 'Air Jordan 4 Retro Bred Reimagined', 'Jordan', 'basketball', 220_00, 94),
  sh('jd_aj4_military_black', 'Air Jordan 4 Retro Military Black', 'Jordan', 'basketball', 215_00, 92),
  sh('jd_aj5', 'Air Jordan 5 Retro', 'Jordan', 'basketball', 210_00, 90),
  sh('jd_aj6', 'Air Jordan 6 Retro', 'Jordan', 'basketball', 200_00, 90),
  sh('jd_aj7', 'Air Jordan 7 Retro', 'Jordan', 'basketball', 200_00, 87),
  sh('jd_aj8', 'Air Jordan 8 Retro', 'Jordan', 'basketball', 200_00, 85),
  sh('jd_aj9', 'Air Jordan 9 Retro', 'Jordan', 'basketball', 200_00, 85),
  sh('jd_aj10', 'Air Jordan 10 Retro', 'Jordan', 'basketball', 190_00, 84),
  sh('jd_aj11', 'Air Jordan 11 Retro', 'Jordan', 'basketball', 230_00, 94),
  sh('jd_aj11_concord', 'Air Jordan 11 Retro Concord', 'Jordan', 'basketball', 235_00, 95),
  sh('jd_aj11_low', 'Air Jordan 11 Retro Low', 'Jordan', 'basketball', 190_00, 88),
  sh('jd_aj12', 'Air Jordan 12 Retro', 'Jordan', 'basketball', 200_00, 88),
  sh('jd_aj13', 'Air Jordan 13 Retro', 'Jordan', 'basketball', 200_00, 88),
  sh('jd_aj14', 'Air Jordan 14 Retro', 'Jordan', 'basketball', 210_00, 85),
  sh('jd_aj15', 'Air Jordan 15 Retro', 'Jordan', 'basketball', 200_00, 78),
  sh('jd_aj16', 'Air Jordan 16 Retro', 'Jordan', 'basketball', 200_00, 78),
  sh('jd_aj17', 'Air Jordan 17 Retro', 'Jordan', 'basketball', 225_00, 79),
  sh('jd_aj18', 'Air Jordan 18 Retro', 'Jordan', 'basketball', 225_00, 79),
  sh('jd_aj19', 'Air Jordan 19 Retro', 'Jordan', 'basketball', 210_00, 77),
  sh('jd_aj20', 'Air Jordan 20 Retro', 'Jordan', 'basketball', 220_00, 78),
  sh('jd_aj21', 'Air Jordan 21 Retro', 'Jordan', 'basketball', 215_00, 78),
  sh('jd_aj22', 'Air Jordan 22 Retro', 'Jordan', 'basketball', 215_00, 77),
  sh('jd_aj23', 'Air Jordan 23 Retro', 'Jordan', 'basketball', 230_00, 80),
  sh('jd_aj38', 'Air Jordan XXXVIII', 'Jordan', 'basketball', 200_00, 88),
  sh('jd_aj39', 'Air Jordan XXXIX', 'Jordan', 'basketball', 200_00, 89),
  // --- The signature athletes ----------------------------------------------------------------------------
  sh('jd_luka_3', 'Jordan Luka 3', 'Jordan', 'basketball', 130_00, 86),
  sh('jd_luka_4', 'Jordan Luka 4', 'Jordan', 'basketball', 130_00, 87),
  sh('jd_tatum_2', 'Jordan Tatum 2', 'Jordan', 'basketball', 125_00, 86),
  sh('jd_tatum_3', 'Jordan Tatum 3', 'Jordan', 'basketball', 125_00, 87),
  sh('jd_zion_3', 'Jordan Zion 3', 'Jordan', 'basketball', 140_00, 85),
  sh('jd_zion_4', 'Jordan Zion 4', 'Jordan', 'basketball', 140_00, 86),
  sh('jd_why_not_6', 'Jordan Why Not .6', 'Jordan', 'basketball', 145_00, 83),
  // --- Lifestyle and the hybrids -------------------------------------------------------------------------
  sh('jd_spizike', 'Jordan Spizike Low', 'Jordan', 'trainer', 160_00, 82),
  sh('jd_legacy_312', 'Jordan Legacy 312 Low', 'Jordan', 'trainer', 140_00, 80),
  sh('jd_delta_3', 'Jordan Delta 3 Low', 'Jordan', 'trainer', 130_00, 78),
  sh('jd_max_aura_5', 'Jordan Max Aura 5', 'Jordan', 'trainer', 115_00, 76),
  sh('jd_stay_loyal_3', 'Jordan Stay Loyal 3', 'Jordan', 'trainer', 100_00, 74),
  sh('jd_series_es', 'Jordan Series ES', 'Jordan', 'trainer', 80_00, 72),
  sh('jd_point_lane', 'Jordan Point Lane', 'Jordan', 'trainer', 125_00, 76),
  sh('jd_granville_pro', 'Jordan Granville Pro', 'Jordan', 'trainer', 120_00, 78),
  sh('jd_air_ship', 'Jordan Air Ship PE', 'Jordan', 'trainer', 150_00, 84),
  sh('jd_executive', 'Jordan Executive Low', 'Jordan', 'trainer', 120_00, 76),
  sh('jd_nu_retro_1', 'Jordan Nu Retro 1 Low', 'Jordan', 'trainer', 130_00, 78),
  sh('jd_jumpman_mvp', 'Jordan Jumpman MVP', 'Jordan', 'trainer', 150_00, 80),
  sh('jd_two_trey', 'Jordan Two Trey', 'Jordan', 'trainer', 135_00, 77),
  sh('jd_post_slide', 'Jordan Post Slide', 'Jordan', 'casual', 55_00, 68),
  sh('jd_play_slide', 'Jordan Play Slide', 'Jordan', 'casual', 45_00, 64),
  sh('jd_hex_mule', 'Jordan Hex Mule', 'Jordan', 'casual', 90_00, 70, 'women'),
  // --- Apparel, which is half of what Jordan sells ---------------------------------------------------------
  ap('jd_flight_fleece_hoodie', 'Jordan Brooklyn Fleece Pullover Hoodie', 'Jordan', 'sport', 95_00, 'top', 16, 82),
  ap('jd_flight_fleece_pants', 'Jordan Brooklyn Fleece Trousers', 'Jordan', 'sport', 90_00, 'bottom', 14, 82),
  ap('jd_essentials_tee', 'Jordan Jumpman Essentials T-Shirt', 'Jordan', 'sport', 35_00, 'top', 12, 74),
  ap('jd_flight_mvp_hoodie', 'Jordan Flight MVP Fleece Hoodie', 'Jordan', 'sport', 110_00, 'top', 16, 84),
  ap('jd_dri_fit_sport_crossover', 'Jordan Dri-FIT Sport Crossover Hoodie', 'Jordan', 'sport', 85_00, 'top', 14, 82),
  ap('jd_diamond_shorts', 'Jordan Sport Dri-FIT Diamond Shorts', 'Jordan', 'sport', 55_00, 'bottom', 8, 82),
  ap('jd_jumpman_jacket', 'Jordan Essentials Woven Jacket', 'Jordan', 'sport', 120_00, 'outerwear', 16, 80),
  ap('jd_flight_knit_pant', 'Jordan Sport Dri-FIT Woven Trousers', 'Jordan', 'sport', 100_00, 'bottom', 14, 82),
  ap('jd_23_engineered_top', 'Jordan 23 Engineered Long Sleeve Top', 'Jordan', 'sport', 70_00, 'top', 12, 82),
  ap('jd_heritage_jersey', 'Jordan Flight Heritage Mesh Jersey', 'Jordan', 'sport', 70_00, 'top', 10, 78),
  ap('jd_essentials_puffer', 'Jordan Essentials Puffer Jacket', 'Jordan', 'sport', 200_00, 'outerwear', 16, 84, 'unisex', WINTER),
  ap('jd_woven_track_pant', 'Jordan Essentials Warm Up Trousers', 'Jordan', 'sport', 85_00, 'bottom', 14, 78),
  ap('jd_flight_skirt', 'Jordan Flight Chicago Skirt', 'Jordan', 'sport', 75_00, 'bottom', 16, 78, 'women'),
  ap('jd_sport_bra', 'Jordan Sport Medium Support Bra', 'Jordan', 'sport', 50_00, 'base', 4, 80, 'women'),
  // --- Accessories ------------------------------------------------------------------------------------------
  ac('jd_jumpman_backpack', 'Jordan Air Patrol Backpack', 'Jordan', 'bag', 90_00, 'bag', 80),
  ac('jd_velocity_duffel', 'Jordan Velocity Duffel Bag', 'Jordan', 'bag', 75_00, 'bag', 78),
  ac('jd_crossbody', 'Jordan Monogram Crossbody Bag', 'Jordan', 'bag', 45_00, 'bag', 74),
  ac('jd_jumpman_cap', 'Jordan Rise Cap', 'Jordan', 'hat', 32_00, 'hat', 74),
  ac('jd_beanie', 'Jordan Peak Beanie', 'Jordan', 'hat', 30_00, 'hat', 74),
  ac('jd_crew_socks', 'Jordan Essentials Crew Socks', 'Jordan', 'sock', 22_00, 'socks', 76),
  ac('jd_flight_socks', 'Jordan Flight Crew Socks', 'Jordan', 'sock', 24_00, 'socks', 78),
  ac('jd_headband', 'Jordan Jumpman Headband', 'Jordan', 'accessory', 16_00, 'hat', 70),
  ac('jd_gloves', 'Jordan Fleece Gloves', 'Jordan', 'gloves', 35_00, 'gloves', 74),
  ac('jd_belt', 'Jordan Jumpman Woven Belt', 'Jordan', 'belt', 30_00, 'belt', 72),
  // --- More of the line, because Jordan is not a shoe brand with a t-shirt ------------------------------
  sh('jd_aj4_rare_air', 'Air Jordan 4 Retro Rare Air', 'Jordan', 'basketball', 210_00, 90),
  sh('jd_aj5_low', 'Air Jordan 5 Retro Low', 'Jordan', 'basketball', 190_00, 87),
  sh('jd_aj6_low', 'Air Jordan 6 Retro Low', 'Jordan', 'basketball', 185_00, 86),
  sh('jd_aj12_low', 'Air Jordan 12 Retro Low', 'Jordan', 'basketball', 185_00, 85),
  sh('jd_aj1_ko', 'Air Jordan 1 Retro KO', 'Jordan', 'basketball', 150_00, 86),
  sh('jd_aj1_high_og_defiant', 'Air Jordan 1 Retro High OG Defiant', 'Jordan', 'basketball', 185_00, 87),
  sh('jd_jumpman_two_three', 'Jordan Jumpman Two Three', 'Jordan', 'trainer', 130_00, 78),
  sh('jd_flight_court', 'Jordan Flight Court', 'Jordan', 'trainer', 110_00, 76),
  ap('jd_flight_fleece_shorts', 'Jordan Brooklyn Fleece Shorts', 'Jordan', 'sport', 65_00, 'bottom', 12, 80),
  ap('jd_wordmark_tee', 'Jordan Flight MVP Wordmark T-Shirt', 'Jordan', 'sport', 40_00, 'top', 12, 76),
  ap('jd_sport_jacket', 'Jordan Sport Jam Warm Up Jacket', 'Jordan', 'sport', 110_00, 'outerwear', 16, 82),
  ap('jd_dri_fit_tights', 'Jordan Sport Dri-FIT Compression Tights', 'Jordan', 'sport', 55_00, 'bottom', 8, 82),
  ac('jd_bucket_hat', 'Jordan Apex Bucket Hat', 'Jordan', 'hat', 40_00, 'hat', 76),
  ac('jd_shoulder_bag', 'Jordan Alpha Mini Shoulder Bag', 'Jordan', 'bag', 40_00, 'bag', 74),
];

// ---------------------------------------------------------------------------
// Adidas
// ---------------------------------------------------------------------------

export const ADIDAS: readonly RealGood[] = [
  // --- The terrace shoes, which took over ------------------------------------------------------------
  sh('ad_samba_classic', 'Adidas Samba Classic', 'Adidas', 'trainer', 80_00, 84),
  sh('ad_samba_xlg', 'Adidas Samba XLG', 'Adidas', 'trainer', 110_00, 84),
  sh('ad_samba_decon', 'Adidas Samba Decon', 'Adidas', 'trainer', 130_00, 84),
  sh('ad_gazelle_bold', 'Adidas Gazelle Bold', 'Adidas', 'trainer', 110_00, 82, 'women'),
  sh('ad_gazelle_indoor', 'Adidas Gazelle Indoor', 'Adidas', 'trainer', 110_00, 86),
  sh('ad_campus_80s', 'Adidas Campus 80s', 'Adidas', 'trainer', 120_00, 86),
  sh('ad_handball_spezial', 'Adidas Handball Spezial', 'Adidas', 'trainer', 110_00, 87),
  sh('ad_spezial', 'Adidas Spezial', 'Adidas', 'trainer', 100_00, 84),
  sh('ad_superstar', 'Adidas Superstar II', 'Adidas', 'trainer', 100_00, 84),
  sh('ad_superstar_xlg', 'Adidas Superstar XLG', 'Adidas', 'trainer', 110_00, 80),
  sh('ad_stan_smith_lux', 'Adidas Stan Smith Lux', 'Adidas', 'trainer', 140_00, 87),
  sh('ad_forum_low', 'Adidas Forum Low', 'Adidas', 'trainer', 100_00, 80),
  sh('ad_forum_mid', 'Adidas Forum Mid', 'Adidas', 'trainer', 110_00, 80),
  sh('ad_forum_84_low', 'Adidas Forum 84 Low', 'Adidas', 'trainer', 130_00, 84),
  sh('ad_rivalry_low', 'Adidas Rivalry Low', 'Adidas', 'trainer', 100_00, 80),
  sh('ad_country_og', 'Adidas Country OG', 'Adidas', 'trainer', 100_00, 82),
  sh('ad_sl72', 'Adidas SL 72 RS', 'Adidas', 'trainer', 100_00, 83),
  sh('ad_tokyo', 'Adidas Tokyo', 'Adidas', 'trainer', 100_00, 82),
  sh('ad_munchen', 'Adidas München', 'Adidas', 'trainer', 110_00, 84),
  sh('ad_busenitz', 'Adidas Busenitz Pro', 'Adidas', 'skate', 90_00, 84),
  sh('ad_adimatic', 'Adidas Adimatic', 'Adidas', 'skate', 110_00, 83),
  sh('ad_tyshawn', 'Adidas Tyshawn Low', 'Adidas', 'skate', 100_00, 84),
  sh('ad_centennial_85', 'Adidas Centennial 85 Low', 'Adidas', 'trainer', 110_00, 80),
  sh('ad_ozweego', 'Adidas Ozweego', 'Adidas', 'trainer', 130_00, 76),
  sh('ad_nmd_r1', 'Adidas NMD R1', 'Adidas', 'trainer', 150_00, 80),
  sh('ad_yeezy_slide', 'Adidas Yeezy Slide', 'Adidas', 'casual', 70_00, 78),
  sh('ad_yeezy_350_v2', 'Adidas Yeezy Boost 350 V2', 'Adidas', 'trainer', 230_00, 88),
  // --- Running ------------------------------------------------------------------------------------------
  sh('ad_ultraboost_light', 'Adidas Ultraboost Light', 'Adidas', 'running', 190_00, 86),
  sh('ad_ultraboost_5x', 'Adidas Ultraboost 5X', 'Adidas', 'running', 220_00, 88),
  sh('ad_adizero_evo_sl', 'Adidas Adizero Evo SL', 'Adidas', 'running', 150_00, 90),
  sh('ad_adizero_boston_13', 'Adidas Adizero Boston 13', 'Adidas', 'running', 160_00, 89),
  sh('ad_adizero_sl2', 'Adidas Adizero SL2', 'Adidas', 'running', 130_00, 85),
  sh('ad_adizero_takumi_sen_10', 'Adidas Adizero Takumi Sen 10', 'Adidas', 'running', 180_00, 91),
  sh('ad_adizero_prime_x2', 'Adidas Adizero Prime X 2 Strung', 'Adidas', 'running', 300_00, 92),
  sh('ad_supernova_rise_2', 'Adidas Supernova Rise 2', 'Adidas', 'running', 140_00, 84),
  sh('ad_solarglide_6', 'Adidas Solarglide 6', 'Adidas', 'running', 140_00, 83),
  sh('ad_solarboost_5', 'Adidas Solarboost 5', 'Adidas', 'running', 160_00, 84),
  sh('ad_duramo_sl', 'Adidas Duramo SL', 'Adidas', 'running', 70_00, 70),
  sh('ad_runfalcon_5', 'Adidas Runfalcon 5', 'Adidas', 'running', 65_00, 66),
  // --- Outdoors -----------------------------------------------------------------------------------------
  sh('ad_terrex_agravic_speed', 'Adidas Terrex Agravic Speed Ultra', 'Adidas', 'running', 200_00, 89),
  sh('ad_terrex_free_hiker_2', 'Adidas Terrex Free Hiker 2', 'Adidas', 'boot', 220_00, 88),
  sh('ad_terrex_swift_r3', 'Adidas Terrex Swift R3 GTX', 'Adidas', 'boot', 160_00, 86),
  sh('ad_terrex_ax4', 'Adidas Terrex AX4', 'Adidas', 'boot', 110_00, 80),
  sh('ad_terrex_soulstride', 'Adidas Terrex Soulstride Ultra', 'Adidas', 'running', 160_00, 85),
  // --- Football boots ------------------------------------------------------------------------------------
  sh('ad_predator_24_elite', 'Adidas Predator 24 Elite', 'Adidas', 'football', 280_00, 92),
  sh('ad_predator_league', 'Adidas Predator League', 'Adidas', 'football', 110_00, 82),
  sh('ad_x_crazyfast', 'Adidas X Crazyfast Elite', 'Adidas', 'football', 280_00, 91),
  sh('ad_copa_pure_2', 'Adidas Copa Pure 2 Elite', 'Adidas', 'football', 260_00, 91),
  sh('ad_f50_elite', 'Adidas F50 Elite', 'Adidas', 'football', 290_00, 92),
  // --- Basketball ------------------------------------------------------------------------------------------
  sh('ad_dame_9', 'Adidas Dame 9', 'Adidas', 'basketball', 130_00, 85),
  sh('ad_harden_9', 'Adidas Harden Vol. 9', 'Adidas', 'basketball', 160_00, 86),
  sh('ad_ae_1', 'Adidas AE 1', 'Adidas', 'basketball', 140_00, 88),
  sh('ad_ae_2', 'Adidas AE 2', 'Adidas', 'basketball', 140_00, 88),
  sh('ad_don_issue_6', 'Adidas D.O.N. Issue 6', 'Adidas', 'basketball', 110_00, 82),
  sh('ad_trae_young_3', 'Adidas Trae Young 3', 'Adidas', 'basketball', 130_00, 84),
  sh('ad_pro_model', 'Adidas Pro Model 2G', 'Adidas', 'basketball', 110_00, 80),
  // --- Slides and the rest -----------------------------------------------------------------------------------
  sh('ad_adilette_22', 'Adidas Adilette 22 Slides', 'Adidas', 'casual', 55_00, 74),
  sh('ad_adilette_comfort', 'Adidas Adilette Comfort Slides', 'Adidas', 'casual', 35_00, 68),
  sh('ad_adilette_aqua', 'Adidas Adilette Aqua Slides', 'Adidas', 'casual', 25_00, 62),
  // --- Apparel -------------------------------------------------------------------------------------------
  ap('ad_firebird_top', 'Adidas Adicolor Classics Firebird Track Top', 'Adidas', 'sport', 80_00, 'top', 16, 82),
  ap('ad_firebird_pants', 'Adidas Adicolor Classics Firebird Track Trousers', 'Adidas', 'sport', 75_00, 'bottom', 14, 82),
  ap('ad_beckenbauer_top', 'Adidas Adicolor Classics Beckenbauer Track Top', 'Adidas', 'sport', 85_00, 'top', 16, 83),
  ap('ad_sst_top', 'Adidas Adicolor Classics SST Track Top', 'Adidas', 'sport', 80_00, 'top', 16, 82),
  ap('ad_trefoil_hoodie', 'Adidas Adicolor Classics Trefoil Hoodie', 'Adidas', 'sport', 70_00, 'top', 14, 78),
  ap('ad_trefoil_tee', 'Adidas Adicolor Classics Trefoil T-Shirt', 'Adidas', 'sport', 30_00, 'top', 12, 72),
  ap('ad_essentials_tee', 'Adidas Essentials Single Jersey 3-Stripes T-Shirt', 'Adidas', 'sport', 28_00, 'top', 12, 70),
  ap('ad_zne_tracksuit', 'Adidas Z.N.E. Premium Full Zip Hoodie', 'Adidas', 'sport', 120_00, 'top', 16, 85),
  ap('ad_tiro_24_top', 'Adidas Tiro 24 Training Top', 'Adidas', 'sport', 55_00, 'top', 10, 80),
  ap('ad_tiro_24_pants', 'Adidas Tiro 24 Training Trousers', 'Adidas', 'sport', 60_00, 'bottom', 10, 80),
  ap('ad_tastigo_shorts', 'Adidas Tastigo 19 Shorts', 'Adidas', 'sport', 30_00, 'bottom', 8, 76),
  ap('ad_techfit_tights', 'Adidas Techfit Training Tights', 'Adidas', 'sport', 45_00, 'bottom', 8, 80),
  ap('ad_own_the_run_jacket', 'Adidas Own The Run Jacket', 'Adidas', 'sport', 75_00, 'outerwear', 12, 80),
  ap('ad_terrex_rain_jacket', 'Adidas Terrex Multi RAIN.RDY Jacket', 'Adidas', 'sport', 180_00, 'outerwear', 14, 88),
  ap('ad_ultimate365_polo', 'Adidas Ultimate365 Golf Polo', 'Adidas', 'sport', 70_00, 'top', 34, 84),
  ap('ad_adizero_singlet', 'Adidas Adizero Running Singlet', 'Adidas', 'sport', 60_00, 'top', 6, 86),
  ap('ad_powerreact_bra', 'Adidas Powerreact Training Medium Support Bra', 'Adidas', 'sport', 45_00, 'base', 4, 82, 'women'),
  ap('ad_adibreak_pants', 'Adidas Adicolor Classics Adibreak Trousers', 'Adidas', 'sport', 85_00, 'bottom', 14, 82),
  // --- Accessories -----------------------------------------------------------------------------------------
  ac('ad_backpack_classic', 'Adidas Classic Foundation Backpack', 'Adidas', 'bag', 45_00, 'bag', 74),
  ac('ad_duffel', 'Adidas Tiro Duffel Bag', 'Adidas', 'bag', 55_00, 'bag', 76),
  ac('ad_gym_sack', 'Adidas Essentials Gym Sack', 'Adidas', 'bag', 20_00, 'bag', 66),
  ac('ad_cap', 'Adidas Trefoil Baseball Cap', 'Adidas', 'hat', 25_00, 'hat', 72),
  ac('ad_beanie', 'Adidas Daily Beanie', 'Adidas', 'hat', 22_00, 'hat', 72),
  ac('ad_crew_socks', 'Adidas Trefoil Cushioned Crew Socks', 'Adidas', 'sock', 20_00, 'socks', 74),
  ac('ad_ankle_socks', 'Adidas Athletic Cushioned Low Cut Socks', 'Adidas', 'sock', 18_00, 'socks', 72),
  // --- The rest of the wall -------------------------------------------------------------------------------
  sh('ad_samba_og_shoes_w', 'Adidas Samba OG Shoes Women', 'Adidas', 'trainer', 100_00, 87, 'women'),
  sh('ad_gazelle_og', 'Adidas Gazelle OG', 'Adidas', 'trainer', 110_00, 86),
  sh('ad_campus_supreme', 'Adidas Campus Supreme Sole', 'Adidas', 'trainer', 120_00, 82),
  sh('ad_superstar_82', 'Adidas Superstar 82', 'Adidas', 'trainer', 130_00, 85),
  sh('ad_stan_smith_recon', 'Adidas Stan Smith Recon', 'Adidas', 'trainer', 130_00, 85),
  sh('ad_taekwondo', 'Adidas Taekwondo Mei', 'Adidas', 'trainer', 100_00, 82),
  sh('ad_japan', 'Adidas Japan', 'Adidas', 'trainer', 100_00, 82),
  sh('ad_london', 'Adidas London', 'Adidas', 'trainer', 110_00, 84),
  sh('ad_ultraboost_1_0', 'Adidas Ultraboost 1.0', 'Adidas', 'running', 190_00, 87),
  ap('ad_firebird_shorts', 'Adidas Adicolor Classics Sprinter Shorts', 'Adidas', 'sport', 45_00, 'bottom', 10, 78),
  ap('ad_essentials_hoodie', 'Adidas Essentials Fleece 3-Stripes Hoodie', 'Adidas', 'sport', 65_00, 'top', 14, 76),
  ap('ad_condivo_jersey', 'Adidas Condivo 22 Match Jersey', 'Adidas', 'sport', 65_00, 'top', 8, 82),
  ac('ad_bucket_hat', 'Adidas Adicolor Trefoil Bucket Hat', 'Adidas', 'hat', 30_00, 'hat', 74),
  ac('ad_waist_bag', 'Adidas Adicolor Classic Waist Bag', 'Adidas', 'bag', 30_00, 'bag', 72),
  sh('ad_gazelle_bold_w', 'Adidas Gazelle Bold Platform', 'Adidas', 'trainer', 120_00, 82, 'women'),
  sh('ad_samba_lt', 'Adidas Samba LT', 'Adidas', 'trainer', 100_00, 84),
  sh('ad_campus_light', 'Adidas Campus Light', 'Adidas', 'trainer', 110_00, 82),
  sh('ad_response_cl', 'Adidas Response CL', 'Adidas', 'trainer', 110_00, 80),
  sh('ad_climacool_vento', 'Adidas Climacool Vento', 'Adidas', 'running', 130_00, 82),
  sh('ad_ultraboost_5_w', 'Adidas Ultraboost 5 Women', 'Adidas', 'running', 190_00, 87, 'women'),
];

// ---------------------------------------------------------------------------
// New Balance
// ---------------------------------------------------------------------------

export const NEW_BALANCE: readonly RealGood[] = [
  // --- The 99x line, which is the whole argument ------------------------------------------------------
  sh('nb_990v5', 'New Balance 990v5', 'New Balance', 'trainer', 185_00, 90),
  sh('nb_990v4', 'New Balance 990v4', 'New Balance', 'trainer', 185_00, 89),
  sh('nb_990v3', 'New Balance 990v3', 'New Balance', 'trainer', 185_00, 90),
  sh('nb_991v2', 'New Balance 991v2', 'New Balance', 'trainer', 220_00, 92),
  sh('nb_991_made_uk', 'New Balance 991 Made In UK', 'New Balance', 'trainer', 210_00, 92),
  sh('nb_992', 'New Balance 992', 'New Balance', 'trainer', 200_00, 91),
  sh('nb_993', 'New Balance 993 Made In USA', 'New Balance', 'trainer', 200_00, 91),
  sh('nb_998', 'New Balance 998 Made In USA', 'New Balance', 'trainer', 210_00, 90),
  sh('nb_997h', 'New Balance 997H', 'New Balance', 'trainer', 90_00, 78),
  sh('nb_997r', 'New Balance 997R', 'New Balance', 'trainer', 130_00, 84),
  sh('nb_1500', 'New Balance 1500 Made In UK', 'New Balance', 'trainer', 190_00, 89),
  // --- The lifestyle numbers -----------------------------------------------------------------------------
  sh('nb_1906r', 'New Balance 1906R', 'New Balance', 'trainer', 165_00, 88),
  sh('nb_1906l', 'New Balance 1906L', 'New Balance', 'trainer', 180_00, 87),
  sh('nb_1906d', 'New Balance 1906D Protection Pack', 'New Balance', 'trainer', 175_00, 86),
  sh('nb_2002rc', 'New Balance 2002RC', 'New Balance', 'trainer', 160_00, 86),
  sh('nb_9060', 'New Balance 9060', 'New Balance', 'trainer', 150_00, 87),
  sh('nb_9060_sport', 'New Balance 9060 Sport', 'New Balance', 'trainer', 160_00, 85),
  sh('nb_1000', 'New Balance 1000', 'New Balance', 'trainer', 140_00, 82),
  sh('nb_740', 'New Balance 740', 'New Balance', 'trainer', 110_00, 82),
  sh('nb_327', 'New Balance 327', 'New Balance', 'trainer', 100_00, 82),
  sh('nb_530', 'New Balance 530', 'New Balance', 'trainer', 100_00, 82),
  sh('nb_574', 'New Balance 574 Core', 'New Balance', 'trainer', 90_00, 80),
  sh('nb_574_legacy', 'New Balance 574 Legacy', 'New Balance', 'trainer', 110_00, 82),
  sh('nb_480', 'New Balance 480', 'New Balance', 'trainer', 85_00, 76),
  sh('nb_610', 'New Balance 610', 'New Balance', 'trainer', 120_00, 82),
  sh('nb_670', 'New Balance 670 Made In UK', 'New Balance', 'trainer', 180_00, 88),
  sh('nb_57_40', 'New Balance 57/40', 'New Balance', 'trainer', 100_00, 80),
  sh('nb_rainier_low', 'New Balance Rainier Low', 'New Balance', 'boot', 130_00, 84),
  sh('nb_tds_moon', 'New Balance Tokyo Design Studio Niobium', 'New Balance', 'trainer', 240_00, 88),
  // --- Road running ---------------------------------------------------------------------------------------
  sh('nb_1080v14', 'New Balance Fresh Foam X 1080v14', 'New Balance', 'running', 165_00, 90),
  sh('nb_1080v13', 'New Balance Fresh Foam X 1080v13', 'New Balance', 'running', 165_00, 89),
  sh('nb_880v14', 'New Balance Fresh Foam X 880v14', 'New Balance', 'running', 145_00, 86),
  sh('nb_860v14', 'New Balance Fresh Foam X 860v14', 'New Balance', 'running', 145_00, 85),
  sh('nb_more_v5', 'New Balance Fresh Foam X More v5', 'New Balance', 'running', 175_00, 88),
  sh('nb_vongo_v6', 'New Balance Fresh Foam X Vongo v6', 'New Balance', 'running', 165_00, 86),
  sh('nb_rebel_v4', 'New Balance FuelCell Rebel v4', 'New Balance', 'running', 145_00, 89),
  sh('nb_supercomp_elite_v4', 'New Balance FuelCell SuperComp Elite v4', 'New Balance', 'running', 250_00, 94),
  sh('nb_sc_trainer_v3', 'New Balance FuelCell SuperComp Trainer v3', 'New Balance', 'running', 180_00, 90),
  sh('nb_sc_pacer_v2', 'New Balance FuelCell SuperComp Pacer v2', 'New Balance', 'running', 155_00, 89),
  sh('nb_propel_v5', 'New Balance FuelCell Propel v5', 'New Balance', 'running', 110_00, 82),
  sh('nb_hierro_v8', 'New Balance Fresh Foam X Hierro v8', 'New Balance', 'running', 145_00, 86),
  sh('nb_minimus_tr', 'New Balance Minimus TR', 'New Balance', 'training', 110_00, 82),
  // --- Skate ----------------------------------------------------------------------------------------------
  sh('nb_numeric_440', 'New Balance Numeric 440', 'New Balance', 'skate', 90_00, 84),
  sh('nb_numeric_306', 'New Balance Numeric 306 Jamie Foy', 'New Balance', 'skate', 100_00, 85),
  sh('nb_numeric_272', 'New Balance Numeric 272', 'New Balance', 'skate', 90_00, 82),
  sh('nb_numeric_1010', 'New Balance Numeric 1010 Tiago Lemos', 'New Balance', 'skate', 110_00, 86),
  // --- Apparel ----------------------------------------------------------------------------------------------
  ap('nb_athletics_hoodie', 'New Balance Athletics Remastered Hoodie', 'New Balance', 'sport', 100_00, 'top', 16, 84),
  ap('nb_athletics_pants', 'New Balance Athletics Remastered Trousers', 'New Balance', 'sport', 95_00, 'bottom', 14, 84),
  ap('nb_made_usa_crew', 'New Balance MADE In USA Core Crew Sweatshirt', 'New Balance', 'sport', 130_00, 'top', 18, 88),
  ap('nb_made_usa_tee', 'New Balance MADE In USA Core T-Shirt', 'New Balance', 'sport', 55_00, 'top', 14, 84),
  ap('nb_sport_essentials_tee', 'New Balance Sport Essentials T-Shirt', 'New Balance', 'sport', 32_00, 'top', 12, 74),
  ap('nb_impact_run_shorts', 'New Balance Impact Run 5 Inch Shorts', 'New Balance', 'sport', 55_00, 'bottom', 8, 84),
  ap('nb_q_speed_jacquard', 'New Balance Q Speed Jacquard Long Sleeve', 'New Balance', 'sport', 70_00, 'top', 10, 85),
  ap('nb_heat_grid_hoodie', 'New Balance Heat Grid Hoodie', 'New Balance', 'sport', 90_00, 'top', 14, 84, 'unisex', WINTER),
  ap('nb_athletics_jacket', 'New Balance Athletics Woven Jacket', 'New Balance', 'sport', 130_00, 'outerwear', 16, 84),
  ap('nb_impact_run_tight', 'New Balance Impact Run Tight', 'New Balance', 'sport', 75_00, 'bottom', 8, 84, 'women'),
  ap('nb_sleek_bra', 'New Balance Sleek Medium Support Sports Bra', 'New Balance', 'sport', 50_00, 'base', 4, 82, 'women'),
  ap('nb_linear_track_pant', 'New Balance Athletics Linear Track Trousers', 'New Balance', 'sport', 85_00, 'bottom', 14, 82),
  // --- Accessories -------------------------------------------------------------------------------------------
  ac('nb_backpack', 'New Balance Team Backpack', 'New Balance', 'bag', 55_00, 'bag', 76),
  ac('nb_duffel', 'New Balance Legacy Duffel Bag', 'New Balance', 'bag', 65_00, 'bag', 78),
  ac('nb_waist_bag', 'New Balance Athletics Waist Bag', 'New Balance', 'bag', 32_00, 'bag', 72),
  ac('nb_cap', 'New Balance Six Panel Curved Brim Cap', 'New Balance', 'hat', 26_00, 'hat', 74),
  ac('nb_beanie', 'New Balance Watchman Beanie', 'New Balance', 'hat', 24_00, 'hat', 74),
  // --- The rest of the wall, which at New Balance is a long wall ---------------------------------------------
  sh('nb_1906a', 'New Balance 1906A', 'New Balance', 'trainer', 170_00, 86),
  sh('nb_1906u', 'New Balance 1906U', 'New Balance', 'trainer', 180_00, 86),
  sh('nb_860v13', 'New Balance Fresh Foam X 860v13', 'New Balance', 'running', 140_00, 84),
  sh('nb_880v13', 'New Balance Fresh Foam X 880v13', 'New Balance', 'running', 140_00, 85),
  sh('nb_1080v12', 'New Balance Fresh Foam X 1080v12', 'New Balance', 'running', 160_00, 88),
  sh('nb_rebel_v3', 'New Balance FuelCell Rebel v3', 'New Balance', 'running', 140_00, 87),
  sh('nb_supercomp_elite_v3', 'New Balance FuelCell SuperComp Elite v3', 'New Balance', 'running', 230_00, 92),
  sh('nb_arishi_v4', 'New Balance Fresh Foam Arishi v4', 'New Balance', 'running', 75_00, 72),
  sh('nb_evoz_v3', 'New Balance FuelCell Evoz v3', 'New Balance', 'running', 85_00, 74),
  sh('nb_dynasoft_nitrel', 'New Balance DynaSoft Nitrel v5', 'New Balance', 'running', 80_00, 74),
  sh('nb_hierro_v7', 'New Balance Fresh Foam X Hierro v7', 'New Balance', 'running', 140_00, 85),
  sh('nb_summit_unknown', 'New Balance Fresh Foam X Summit Unknown v5', 'New Balance', 'running', 150_00, 86),
  sh('nb_more_trail_v4', 'New Balance Fresh Foam X More Trail v4', 'New Balance', 'running', 165_00, 86),
  sh('nb_fresh_foam_650', 'New Balance Fresh Foam 650', 'New Balance', 'trainer', 110_00, 80),
  sh('nb_237', 'New Balance 237', 'New Balance', 'trainer', 90_00, 78),
  sh('nb_2002rd', 'New Balance 2002RD Protection Pack', 'New Balance', 'trainer', 170_00, 87),
  sh('nb_580', 'New Balance 580', 'New Balance', 'trainer', 130_00, 84),
  sh('nb_1300', 'New Balance 1300 Made In USA', 'New Balance', 'trainer', 240_00, 91),
  sh('nb_920', 'New Balance 920 Made In UK', 'New Balance', 'trainer', 190_00, 89),
  sh('nb_576', 'New Balance 576 Made In UK', 'New Balance', 'trainer', 200_00, 90),
  sh('nb_991v1', 'New Balance 991 Made In UK Original', 'New Balance', 'trainer', 205_00, 91),
  sh('nb_burn_x', 'New Balance Numeric Jamie Foy 306 Mid', 'New Balance', 'skate', 105_00, 84),
  sh('nb_numeric_808', 'New Balance Numeric 808 Tiago', 'New Balance', 'skate', 100_00, 84),
  sh('nb_numeric_574_vulc', 'New Balance Numeric 574 Vulc', 'New Balance', 'skate', 85_00, 80),
  sh('nb_hesi_low', 'New Balance Hesi Low', 'New Balance', 'basketball', 130_00, 86),
  sh('nb_two_wxy_v4', 'New Balance TWO WXY v4', 'New Balance', 'basketball', 140_00, 86),
  sh('nb_fresh_foam_bb', 'New Balance Fresh Foam BB v2', 'New Balance', 'basketball', 150_00, 85),
  sh('nb_furon_v7', 'New Balance Furon v7 Pro', 'New Balance', 'football', 230_00, 89),
  sh('nb_tekela_v4', 'New Balance Tekela v4 Pro', 'New Balance', 'football', 220_00, 88),
  sh('nb_fuelcell_4040', 'New Balance FuelCell 4040 v7 Turf', 'New Balance', 'training', 130_00, 84),
  ap('nb_athletics_tee', 'New Balance Athletics Graphic T-Shirt', 'New Balance', 'sport', 40_00, 'top', 12, 78),
  ap('nb_athletics_shorts', 'New Balance Athletics Woven Shorts', 'New Balance', 'sport', 65_00, 'bottom', 12, 82),
  ap('nb_made_usa_hoodie', 'New Balance MADE In USA Hoodie', 'New Balance', 'sport', 150_00, 'top', 18, 88),
  ap('nb_run_jacket', 'New Balance Impact Run Light Pack Jacket', 'New Balance', 'sport', 110_00, 'outerwear', 12, 85),
  ac('nb_bucket_hat', 'New Balance Lifestyle Bucket Hat', 'New Balance', 'hat', 32_00, 'hat', 74),
  ac('nb_crew_socks_nb', 'New Balance Performance Cotton Crew Socks', 'New Balance', 'sock', 18_00, 'socks', 76),
  sh('nb_990v6_w', 'New Balance 990v6 Women', 'New Balance', 'trainer', 200_00, 92, 'women'),
  sh('nb_550_w', 'New Balance 550 Women', 'New Balance', 'trainer', 120_00, 85, 'women'),
  sh('nb_2002r_mule', 'New Balance 2002R Mule', 'New Balance', 'casual', 130_00, 82),
  sh('nb_1906r_w', 'New Balance 1906R Women', 'New Balance', 'trainer', 165_00, 87, 'women'),
];

/** Everything in this file, in one list. */
export const REAL_SNEAKERS: readonly RealGood[] = [...NIKE, ...JORDAN, ...ADIDAS, ...NEW_BALANCE];
