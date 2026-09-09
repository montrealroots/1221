/**
 * SLATE — who a garment is cut for.
 *
 * A shop that shows a man a rack of gowns, or a woman a rack of dinner
 * jackets, is not a shop anybody recognises. So every wardrobe product says
 * who it is cut for, and the floor leads with what fits you.
 *
 * Three rules hold this together:
 *
 * 1. **Nothing is refused.** The audience decides what a shop shows first and
 *    what the dressing room offers first. Every item is still buyable and
 *    still wearable by anybody. This is the same principle as the rest of
 *    SLATE: the world has opinions, the world does not lock doors.
 * 2. **It is a fact about the cut, not about the person.** A dinner jacket is
 *    cut for a man's frame; that is a statement about tailoring, and it says
 *    nothing whatever about who should wear one.
 * 3. **Unisex means offered to everybody.** Most of what people wear — a
 *    t-shirt, jeans, a trench coat, a pair of Sambas, a dive watch — is not
 *    split by cut in any way worth modeling, and is marked accordingly
 *    rather than shoehorned into one side or the other.
 *
 * The two lists below are the deliberate decisions. Anything not in them is
 * offered to everybody. A test holds the lists against the catalog, so an
 * id that stops existing is caught rather than sitting here forever.
 */

import type { Audience } from './wardrobe';

/**
 * Cut for men.
 *
 * Tailoring on a man's block, shoes on men's lasts, neckwear, cufflinks, and
 * the fragrances houses sell as men's.
 */
export const MENS: readonly string[] = [
  // Tailoring. Every one of these is a men's suit or dinner jacket.
  'c_suitsupply_havana', 'c_hugo_boss_suit', 'c_paul_smith_suit', 'c_thom_browne_suit',
  'c_tom_ford_oconnor', 'c_brioni_suit', 'c_kiton_suit', 'c_zegna_suit',
  'c_anderson_sheppard', 'c_huntsman', 'c_tom_ford_tux', 'c_saint_laurent_tux',
  'c_dior_tux', 'c_balmain_blazer',
  // Shirting cut on a men's block.
  'c_brooks_ocbd', 'c_tyrwhitt_poplin', 'c_turnbull_shirt', 'c_drakes_oxford',
  'c_sunspel_riviera', 'c_fred_perry_m12', 'c_ralph_mesh_polo',
  // Swim and base layers sold as men's.
  'c_speedo_jammer', 'c_orlebar_brown', 'c_hanro_tee', 'c_derek_rose_robe',
  'c_calvin_klein_briefs', 'c_rapha_bib',
  // Men's lasts: welted shoes, loafers, work boots.
  'f_church_consul', 'f_church_shannon', 'f_cj_audley', 'f_cj_pembroke',
  'f_john_lobb_william', 'f_edward_green_chelsea', 'f_alden_990', 'f_allen_edmonds_park',
  'f_carmina_oxford', 'f_loake_1880', 'f_grenson_archie', 'f_paraboot_michael',
  'f_gucci_horsebit', 'f_tods_gommino', 'f_ferragamo_gancini', 'f_berluti_andy',
  'f_ghbass_weejuns', 'f_belgian_shoes', 'f_sebago_docksides', 'f_sperry_ao',
  'f_redwing_iron_ranger', 'f_redwing_moc', 'f_rm_williams', 'f_viberg_service',
  'f_trickers_bourton', 'f_danner_mountain',
  // Neckwear and the things that go with a suit.
  'a_drakes_tie', 'a_hermes_tie', 'a_charvet_tie', 'a_turnbull_bow',
  'a_smythson_wallet', 'a_montblanc_wallet', 'a_tom_ford_belt', 'a_anderson_belt',
  'a_swaine_umbrella', 'a_fox_umbrella', 'a_stetson_hat', 'a_lock_and_co', 'a_borsalino_fedora',
  'a_filson_briefcase', 'a_troubadour_briefcase', 'a_mismo_holdall',
  // Fragrance houses sell as men's.
  'a_creed_aventus', 'a_bleu_de_chanel', 'a_dior_sauvage',
  // Cufflinks, and jewelry sold on the men's side of the counter.
  'j_cartier_santos_cufflinks', 'j_stephen_webster', 'j_deakin_francis',
  'j_paul_smith_cufflinks', 'j_montblanc_cufflinks', 'j_tateossian',
  'j_le_gramme_bracelet', 'j_briony_raymond', 'j_david_yurman_cable', 'j_david_yurman_ring',
];

/**
 * Cut for women.
 *
 * Dresses, skirts, blouses on a women's block, heels and flats on women's
 * lasts, handbags, and the fine jewelry and fragrance houses sell as
 * women's.
 */
export const WOMENS: readonly string[] = [
  // Dresses and gowns. All of these are women's ready-to-wear or couture.
  'c_dvf_wrap', 'c_reformation_dress', 'c_self_portrait', 'c_herve_leger',
  'c_alexander_mcqueen_dress', 'c_valentino_gown', 'c_elie_saab_gown',
  'c_oscar_de_la_renta', 'c_versace_gown', 'c_armani_prive', 'c_schiaparelli_couture',
  'c_vera_wang_bridal', 'c_chanel_tweed',
  // Tops and knitwear on a women's block.
  'c_zara_silk_blouse', 'c_the_row_top', 'c_khaite_knit', 'c_ganni_top',
  // Bottoms and skirts.
  'c_max_mara_skirt', 'c_lululemon_align', 'c_aritzia_effortless', 'c_alo_yoga_set',
  // Outerwear cut for women.
  'c_max_mara_teddy', 'c_max_mara_101801', 'c_toteme_scarf',
  // Swim and underwear.
  'c_eres_swimsuit', 'c_skims_set',
  // Heels, flats and boots on women's lasts.
  'f_manolo_hangisi', 'f_louboutin_so_kate', 'f_louboutin_pigalle', 'f_jimmy_choo_romy',
  'f_gianvito_105', 'f_aquazzura_heel', 'f_roger_vivier_belle', 'f_stuart_5050',
  'f_chanel_slingback', 'f_the_row_ginza', 'f_hermes_oran', 'f_ancient_greek',
  'f_ferragamo_gancini_flat', 'f_tods_loafer_women', 'f_the_row_boot', 'f_toteme_boot',
  'f_prada_monolith', 'f_bottega_lug', 'f_ugg_classic',
  // Handbags. The totes, holdalls and backpacks stay unisex.
  'a_birkin_30', 'a_kelly_28', 'a_hermes_constance', 'a_chanel_flap', 'a_chanel_255',
  'a_lv_neverfull', 'a_lv_speedy', 'a_gucci_jackie', 'a_gucci_dionysus',
  'a_prada_galleria', 'a_lady_dior', 'a_dior_saddle', 'a_bottega_jodie',
  'a_bottega_cassette', 'a_loewe_puzzle', 'a_loewe_hammock', 'a_celine_triomphe',
  'a_fendi_baguette', 'a_balenciaga_city', 'a_ysl_loulou', 'a_the_row_margaux',
  'a_polene_numero', 'a_mansur_bucket', 'a_valextra_tote', 'a_metier_bag',
  // Eyewear and fragrance houses sell as women's.
  'a_celine_triomphe_sun', 'a_chanel_no5', 'a_frederic_malle_portrait',
  // Watches: the two lines that are women's, out of a case that is otherwise unisex.
  'w_cartier_panthere', 'w_cartier_francaise',
  // Fine jewelry sold as women's: engagement, pearls, drops, high jewelry.
  'j_tiffany_setting', 'j_tiffany_setting_2', 'j_tiffany_soleste', 'j_tiffany_victoria',
  'j_graff_solitaire', 'j_graff_studs', 'j_debeers_forevermark', 'j_debeers_aura',
  'j_neil_lane', 'j_harry_winston_cluster', 'j_harry_winston_riviere',
  'j_mikimoto_akoya', 'j_mikimoto_studs', 'j_mikimoto_bracelet',
  'j_vca_frivole', 'j_vca_magic_earrings', 'j_bulgari_divas', 'j_bulgari_fiorever',
  'j_chopard_happy', 'j_chopard_red_carpet', 'j_boucheron_serpent', 'j_chaumet_josephine',
  'j_chaumet_bee', 'j_dior_rose', 'j_dior_bois_de_rose', 'j_chanel_comete',
  'j_buccellati_earrings', 'j_messika_lucky_move', 'j_jennifer_meyer_hoops',
  'j_jennifer_meyer_necklace', 'j_anita_ko_ear_cuff', 'j_anita_ko_hoops',
  'j_sophie_bille', 'j_ana_khouri', 'j_fernando_jorge', 'j_lorraine_schwartz',
  'j_shay_bracelet', 'j_jacquie_aiche', 'j_georg_jensen_moonlight',
  'j_monica_vinader', 'j_missoma', 'j_mejuri_hoops', 'j_pandora_bracelet',
  'j_swarovski_necklace', 'j_alex_monroe', 'j_astley_clarke', 'j_annoushka',
  'j_repossi_berbere', 'j_foundrae_medallion', 'j_pomellato_nudo', 'j_pomellato_iconica',
];

const MENS_SET = new Set(MENS);
const WOMENS_SET = new Set(WOMENS);

/**
 * Who this one is cut for. Anything not on a list is offered to everybody,
 * which is the honest answer for a t-shirt and for most of a wardrobe.
 */
export function audienceOf(id: string): Audience {
  if (MENS_SET.has(id)) return 'men';
  if (WOMENS_SET.has(id)) return 'women';
  return 'unisex';
}

/** Stamps a run of catalog rows with who each is cut for. */
export function withAudience<T extends { id: string; audience?: Audience }>(items: T[]): T[] {
  return items.map((item) => (item.audience ? item : { ...item, audience: audienceOf(item.id) }));
}
