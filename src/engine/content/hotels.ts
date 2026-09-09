/**
 * SLATE — the real hotel brands, and which of them actually operate where.
 *
 * Name, parent group and market tier are public record. The property, the
 * rate and the room are SLATE's own. The promise this file keeps is that a
 * hotel booked anywhere in the geography wears a brand that really has a
 * hotel in that country: a Premier Inn does not appear in Lagos, and a Four
 * Seasons does not appear in Tuvalu.
 *
 * So every one of the 252 countries in the world data is accounted for in
 * one of two ways, and `tools/hotel-coverage` in the gate counts them:
 *
 * 1. `CHAINS_BY_COUNTRY` names the brands with a hotel there;
 * 2. `INDEPENDENT_ONLY` says, in plain words, that no international chain
 *    operates there and SLATE's own hotels stand in.
 *
 * Airbnb is a real platform, and it too is absent from some places for real
 * reasons — sanctions, or nobody living there — so `AIRBNB_UNAVAILABLE` says
 * which and why, and the listing, the host and the rate are SLATE's own.
 */

export interface HotelBrand {
  id: string;
  name: string;
  /** The group that owns or franchises it, as public record. */
  group: string;
  /** 1 economy, 2 midscale, 3 upscale, 4 luxury. */
  tier: 1 | 2 | 3 | 4;
}

const b = (id: string, name: string, group: string, tier: 1 | 2 | 3 | 4): HotelBrand => ({ id, name, group, tier });

export const HOTEL_BRANDS: readonly HotelBrand[] = [
  // Marriott International
  b('ritz_carlton', 'The Ritz-Carlton', 'Marriott International', 4), b('st_regis', 'St. Regis', 'Marriott International', 4),
  b('jw_marriott', 'JW Marriott', 'Marriott International', 4), b('edition', 'EDITION', 'Marriott International', 4),
  b('w_hotels', 'W Hotels', 'Marriott International', 3), b('westin', 'Westin', 'Marriott International', 3),
  b('sheraton', 'Sheraton', 'Marriott International', 3), b('marriott', 'Marriott', 'Marriott International', 3),
  b('le_meridien', 'Le Méridien', 'Marriott International', 3), b('renaissance', 'Renaissance', 'Marriott International', 3),
  b('courtyard', 'Courtyard by Marriott', 'Marriott International', 2), b('four_points', 'Four Points by Sheraton', 'Marriott International', 2),
  b('aloft', 'Aloft', 'Marriott International', 2), b('moxy', 'Moxy', 'Marriott International', 2),
  b('fairfield', 'Fairfield by Marriott', 'Marriott International', 1), b('protea', 'Protea Hotels by Marriott', 'Marriott International', 2),
  b('bulgari_hotels', 'Bulgari Hotels', 'Marriott International', 4),
  // Hilton
  b('waldorf', 'Waldorf Astoria', 'Hilton', 4), b('conrad', 'Conrad', 'Hilton', 4), b('lxr', 'LXR Hotels', 'Hilton', 4),
  b('hilton', 'Hilton', 'Hilton', 3), b('doubletree', 'DoubleTree by Hilton', 'Hilton', 2), b('canopy', 'Canopy by Hilton', 'Hilton', 3),
  b('hampton', 'Hampton by Hilton', 'Hilton', 1), b('hilton_garden', 'Hilton Garden Inn', 'Hilton', 2), b('tru', 'Tru by Hilton', 'Hilton', 1),
  // IHG
  b('intercontinental', 'InterContinental', 'IHG', 4), b('regent', 'Regent', 'IHG', 4), b('six_senses', 'Six Senses', 'IHG', 4),
  b('kimpton', 'Kimpton', 'IHG', 3), b('crowne_plaza', 'Crowne Plaza', 'IHG', 3), b('hotel_indigo', 'Hotel Indigo', 'IHG', 3),
  b('voco', 'voco', 'IHG', 3), b('holiday_inn', 'Holiday Inn', 'IHG', 2), b('holiday_inn_express', 'Holiday Inn Express', 'IHG', 1),
  // Hyatt
  b('park_hyatt', 'Park Hyatt', 'Hyatt', 4), b('grand_hyatt', 'Grand Hyatt', 'Hyatt', 3), b('hyatt_regency', 'Hyatt Regency', 'Hyatt', 3),
  b('andaz', 'Andaz', 'Hyatt', 3), b('alila', 'Alila', 'Hyatt', 4), b('thompson', 'Thompson Hotels', 'Hyatt', 3),
  b('hyatt_place', 'Hyatt Place', 'Hyatt', 2),
  // Accor
  b('raffles', 'Raffles', 'Accor', 4), b('fairmont', 'Fairmont', 'Accor', 4), b('sofitel', 'Sofitel', 'Accor', 4),
  b('mgallery', 'MGallery', 'Accor', 3), b('pullman', 'Pullman', 'Accor', 3), b('swissotel', 'Swissôtel', 'Accor', 3),
  b('movenpick', 'Mövenpick', 'Accor', 3), b('novotel', 'Novotel', 'Accor', 2), b('mercure', 'Mercure', 'Accor', 2),
  b('ibis', 'ibis', 'Accor', 1), b('ibis_styles', 'ibis Styles', 'Accor', 1), b('ibis_budget', 'ibis budget', 'Accor', 1),
  b('rixos', 'Rixos', 'Accor', 4), b('banyan_tree', 'Banyan Tree', 'Banyan Group', 4),
  // Radisson, Wyndham, Choice, Best Western, Louvre
  b('radisson_blu', 'Radisson Blu', 'Radisson Hotel Group', 3), b('radisson', 'Radisson', 'Radisson Hotel Group', 3),
  b('radisson_red', 'Radisson RED', 'Radisson Hotel Group', 3), b('park_inn', 'Park Inn by Radisson', 'Radisson Hotel Group', 2),
  b('wyndham_grand', 'Wyndham Grand', 'Wyndham', 3), b('wyndham', 'Wyndham', 'Wyndham', 2), b('ramada', 'Ramada by Wyndham', 'Wyndham', 2),
  b('days_inn', 'Days Inn by Wyndham', 'Wyndham', 1), b('super_8', 'Super 8 by Wyndham', 'Wyndham', 1), b('la_quinta', 'La Quinta by Wyndham', 'Wyndham', 2),
  b('comfort_inn', 'Comfort Inn', 'Choice Hotels', 1), b('quality_inn', 'Quality Inn', 'Choice Hotels', 1), b('clarion', 'Clarion', 'Choice Hotels', 2),
  b('best_western', 'Best Western', 'BWH Hotels', 2), b('best_western_premier', 'Best Western Premier', 'BWH Hotels', 3),
  b('campanile', 'Campanile', 'Louvre Hotels', 1), b('kyriad', 'Kyriad', 'Louvre Hotels', 2), b('golden_tulip', 'Golden Tulip', 'Louvre Hotels', 3),
  // The luxury independents and the Asian houses
  b('four_seasons', 'Four Seasons', 'Four Seasons Hotels and Resorts', 4), b('mandarin_oriental', 'Mandarin Oriental', 'Mandarin Oriental Hotel Group', 4),
  b('peninsula', 'The Peninsula', 'HSH', 4), b('rosewood', 'Rosewood', 'Rosewood Hotel Group', 4), b('aman', 'Aman', 'Aman Group', 4),
  b('oberoi', 'The Oberoi', 'Oberoi Group', 4), b('taj', 'Taj', 'IHCL', 4), b('vivanta', 'Vivanta', 'IHCL', 3), b('itc', 'ITC Hotels', 'ITC', 4),
  b('leela', 'The Leela', 'Brookfield', 4), b('lemon_tree', 'Lemon Tree', 'Lemon Tree Hotels', 2),
  b('shangri_la', 'Shangri-La', 'Shangri-La Group', 4), b('kerry', 'Kerry Hotels', 'Shangri-La Group', 3),
  b('kempinski', 'Kempinski', 'Kempinski', 4), b('jumeirah', 'Jumeirah', 'Jumeirah', 4), b('rotana', 'Rotana', 'Rotana', 3),
  b('address', 'Address Hotels', 'Emaar Hospitality', 4), b('anantara', 'Anantara', 'Minor Hotels', 4), b('avani', 'Avani', 'Minor Hotels', 3),
  b('dusit', 'Dusit Thani', 'Dusit International', 4), b('centara', 'Centara', 'Centara Hotels', 3),
  b('pan_pacific', 'Pan Pacific', 'Pan Pacific Hotels Group', 3), b('millennium', 'Millennium Hotels', 'Millennium and Copthorne', 3),
  b('copthorne', 'Copthorne', 'Millennium and Copthorne', 2), b('okura', 'Hotel Okura', 'Okura Nikko', 4), b('nikko', 'Hotel Nikko', 'Okura Nikko', 3),
  b('prince', 'Prince Hotels', 'Seibu Prince', 3), b('toyoko_inn', 'Toyoko Inn', 'Toyoko Inn', 1), b('apa', 'APA Hotel', 'APA Group', 1),
  b('dormy_inn', 'Dormy Inn', 'Kyoritsu', 2), b('hoshinoya', 'Hoshinoya', 'Hoshino Resorts', 4),
  b('lotte', 'Lotte Hotels', 'Lotte', 4), b('shilla', 'The Shilla', 'Samsung', 4),
  b('jin_jiang', 'Jin Jiang', 'Jin Jiang International', 2), b('atour', 'Atour', 'Atour Lifestyle', 2), b('hanting', 'Hanting', 'H World', 1),
  b('como', 'COMO Hotels', 'COMO Group', 4), b('soneva', 'Soneva', 'Soneva', 4), b('one_and_only', 'One&Only', 'Kerzner', 4),
  b('atlantis', 'Atlantis', 'Kerzner', 4), b('belmond', 'Belmond', 'LVMH', 4), b('oetker', 'Oetker Collection', 'Oetker', 4),
  // Europe's own
  b('premier_inn', 'Premier Inn', 'Whitbread', 1), b('travelodge_uk', 'Travelodge', 'Travelodge Hotels', 1),
  b('motel_one', 'Motel One', 'Motel One', 2), b('scandic', 'Scandic', 'Scandic Hotels', 2), b('thon', 'Thon Hotels', 'Olav Thon', 2),
  b('melia', 'Meliá', 'Meliá Hotels International', 3), b('gran_melia', 'Gran Meliá', 'Meliá Hotels International', 4),
  b('innside', 'Innside by Meliá', 'Meliá Hotels International', 3), b('nh', 'NH Hotels', 'Minor Hotels', 2), b('nh_collection', 'NH Collection', 'Minor Hotels', 3),
  b('barcelo', 'Barceló', 'Barceló Hotel Group', 3), b('riu', 'Riu', 'RIU Hotels', 3), b('iberostar', 'Iberostar', 'Iberostar Group', 3),
  b('b_and_b', 'B&B Hotels', 'B&B Hotels', 1), b('leonardo', 'Leonardo Hotels', 'Fattal', 2), b('dan', 'Dan Hotels', 'Dan Hotels', 3),
  b('isrotel', 'Isrotel', 'Isrotel', 3), b('sokos', 'Sokos Hotels', 'S Group', 2), b('citizenm', 'citizenM', 'citizenM', 2),
  b('ruby', 'Ruby Hotels', 'Ruby', 2), b('maritim', 'Maritim', 'Maritim', 3), b('steigenberger', 'Steigenberger', 'Deutsche Hospitality', 3),
  b('titanic', 'Titanic Hotels', 'Titanic', 3), b('divan', 'Divan', 'Divan Group', 3),
  // The Americas' own
  b('fiesta_americana', 'Fiesta Americana', 'Grupo Posadas', 3), b('city_express', 'City Express', 'Marriott International', 1),
  b('ghl', 'GHL Hoteles', 'GHL', 3), b('decameron', 'Decameron', 'Decameron', 3), b('sandals', 'Sandals', 'Sandals Resorts', 4),
  b('bahia_principe', 'Bahia Principe', 'Grupo Piñero', 3), b('selina', 'Selina', 'Selina', 1), b('windsor', 'Windsor Hoteis', 'Windsor', 3),
  b('atlantica', 'Atlantica Hotels', 'Atlantica', 2), b('dann', 'Hoteles Dann', 'Dann', 2), b('estelar', 'Estelar', 'Estelar', 3),
  b('casa_andina', 'Casa Andina', 'Casa Andina', 2), b('libertador', 'Libertador', 'Libertador', 3), b('howard_johnson', 'Howard Johnson', 'Wyndham', 2),
  // Africa's own
  b('serena', 'Serena Hotels', 'Aga Khan Fund', 4), b('azalai', 'Azalaï Hotels', 'Azalaï', 3), b('onomo', 'Onomo Hotels', 'Onomo', 2),
  b('city_lodge', 'City Lodge', 'City Lodge Hotels', 2), b('southern_sun', 'Southern Sun', 'Southern Sun', 3), b('sun_international', 'Sun International', 'Sun International', 4),
  b('legacy', 'Legacy Hotels', 'Legacy', 3), b('cresta', 'Cresta Hotels', 'Cresta', 2), b('beachcomber', 'Beachcomber', 'Beachcomber Resorts', 4),
  b('lux', 'LUX* Resorts', 'The Lux Collective', 4), b('constance', 'Constance Hotels', 'Constance', 4), b('heritage', 'Heritage Resorts', 'Rogers', 3),
  b('eko', 'Eko Hotels', 'Eko', 3), b('transcorp', 'Transcorp Hilton', 'Transcorp', 3),
  // Oceania's own
  b('rydges', 'Rydges', 'EVT', 3), b('quest', 'Quest Apartment Hotels', 'Ascott', 2), b('crown', 'Crown', 'Crown Resorts', 4),
  b('sudima', 'Sudima', 'Sudima', 2), b('scenic', 'Scenic Hotel Group', 'Scenic', 2), b('outrigger', 'Outrigger', 'Outrigger', 3),
  b('warwick', 'Warwick Hotels', 'Warwick', 3), b('tanoa', 'Tanoa Hotels', 'Tanoa', 2),
  // Gulf and the rest of Asia's own
  b('millennium_gulf', 'Millennium Hotels Gulf', 'Millennium and Copthorne', 3), b('espinas', 'Espinas', 'Espinas', 3), b('parsian', 'Parsian Hotels', 'Parsian', 2),
  b('erbil_rotana', 'Rotana Iraq', 'Rotana', 3), b('yanggakdo', 'Yanggakdo International Hotel', 'State', 2), b('koryo', 'Koryo Hotel', 'State', 2),
];

const BRAND_BY_ID: Readonly<Record<string, HotelBrand>> = Object.fromEntries(HOTEL_BRANDS.map((x) => [x.id, x]));

export function hotelBrandById(id: string): HotelBrand | undefined {
  return BRAND_BY_ID[id];
}

/** Groups that really are almost everywhere, spelled out once. */
export const GLOBAL_CITY = ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western'];
export const GLOBAL_LUXURY = ['four_seasons', 'ritz_carlton', 'jw_marriott', 'intercontinental', 'sofitel', 'park_hyatt', 'mandarin_oriental'];
export const US_ROADSIDE = ['hampton', 'holiday_inn_express', 'courtyard', 'fairfield', 'hilton_garden', 'la_quinta', 'comfort_inn', 'days_inn', 'super_8', 'tru', 'hyatt_place', 'moxy', 'aloft'];
export const EU_ROADSIDE = ['ibis', 'ibis_budget', 'ibis_styles', 'mercure', 'novotel', 'holiday_inn_express', 'b_and_b', 'campanile', 'moxy', 'motel_one'];
export const AFRICA_CHAIN = ['radisson_blu', 'ibis', 'novotel', 'pullman', 'onomo', 'azalai', 'golden_tulip', 'protea'];
export const CARIBBEAN = ['marriott', 'hilton', 'sandals', 'riu', 'iberostar', 'bahia_principe', 'hyatt_regency', 'ritz_carlton'];

/**
 * Which brands really have a hotel in each country.
 *
 * Only ids from `HOTEL_BRANDS` appear here, and every list was checked
 * against the registry when the file was written. Where a country has hotels
 * but no international chain SLATE can vouch for, it is in `INDEPENDENT_ONLY`
 * instead, and the game's own hotels stand in rather than a brand that is not
 * there.
 */
export const CHAINS_BY_COUNTRY: Readonly<Record<string, readonly string[]>> = {
  us: ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western', 'four_seasons', 'ritz_carlton', 'jw_marriott', 'intercontinental', 'sofitel', 'park_hyatt', 'mandarin_oriental', 'hampton', 'holiday_inn_express', 'courtyard', 'fairfield', 'hilton_garden', 'la_quinta', 'comfort_inn', 'days_inn', 'super_8', 'tru', 'hyatt_place', 'moxy', 'aloft', 'waldorf', 'st_regis', 'w_hotels', 'westin', 'edition', 'conrad', 'kimpton', 'thompson', 'andaz', 'rosewood', 'peninsula', 'wyndham', 'ramada', 'quality_inn', 'clarion', 'le_meridien', 'renaissance', 'grand_hyatt', 'hyatt_regency', 'fairmont', 'crowne_plaza', 'doubletree', 'four_points', 'citizenm'],
  ca: ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western', 'four_seasons', 'ritz_carlton', 'jw_marriott', 'intercontinental', 'sofitel', 'park_hyatt', 'mandarin_oriental', 'hampton', 'holiday_inn_express', 'courtyard', 'fairfield', 'hilton_garden', 'la_quinta', 'comfort_inn', 'days_inn', 'super_8', 'tru', 'hyatt_place', 'moxy', 'aloft', 'fairmont', 'westin', 'w_hotels', 'st_regis', 'ramada', 'wyndham', 'doubletree', 'crowne_plaza', 'hyatt_regency', 'grand_hyatt'],
  mx: ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western', 'four_seasons', 'ritz_carlton', 'jw_marriott', 'intercontinental', 'sofitel', 'park_hyatt', 'mandarin_oriental', 'fiesta_americana', 'city_express', 'westin', 'st_regis', 'w_hotels', 'rosewood', 'one_and_only', 'riu', 'iberostar', 'barcelo', 'hyatt_regency', 'grand_hyatt', 'andaz', 'fairmont', 'courtyard', 'hampton', 'holiday_inn_express', 'crowne_plaza'],
  gl: ['best_western'],
  bm: ['fairmont', 'rosewood'],
  pa: ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western', 'waldorf', 'w_hotels', 'jw_marriott', 'crowne_plaza', 'hyatt_place', 'wyndham', 'riu', 'decameron', 'selina'],
  cr: ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western', 'four_seasons', 'jw_marriott', 'andaz', 'wyndham', 'crowne_plaza', 'hyatt_place', 'riu', 'barcelo', 'selina'],
  gt: ['marriott', 'hilton', 'westin', 'intercontinental', 'hyatt_regency', 'barcelo', 'holiday_inn', 'best_western'],
  hn: ['marriott', 'hilton', 'intercontinental', 'hyatt_place', 'holiday_inn', 'best_western'],
  sv: ['marriott', 'hilton', 'sheraton', 'crowne_plaza', 'holiday_inn', 'barcelo'],
  ni: ['hilton', 'intercontinental', 'holiday_inn', 'hyatt_place', 'best_western'],
  bz: ['marriott', 'radisson', 'best_western'],
  cu: ['melia', 'gran_melia', 'iberostar', 'kempinski', 'nh'],
  do: ['marriott', 'hilton', 'sandals', 'riu', 'iberostar', 'bahia_principe', 'hyatt_regency', 'ritz_carlton', 'jw_marriott', 'four_points', 'holiday_inn', 'best_western', 'barcelo', 'melia', 'sheraton'],
  jm: ['marriott', 'hilton', 'sandals', 'riu', 'iberostar', 'bahia_principe', 'hyatt_regency', 'ritz_carlton', 'courtyard', 'holiday_inn'],
  bs: ['atlantis', 'rosewood', 'four_seasons', 'sandals', 'marriott', 'hilton', 'comfort_inn', 'holiday_inn_express', 'courtyard'],
  tt: ['hilton', 'hyatt_regency', 'marriott', 'radisson', 'courtyard'],
  bb: ['sandals', 'hilton', 'marriott', 'fairmont', 'radisson', 'courtyard'],
  ag: ['sandals', 'hilton'],
  lc: ['sandals', 'marriott', 'hilton', 'courtyard'],
  gd: ['sandals', 'radisson'],
  kn: ['marriott', 'park_hyatt', 'four_seasons', 'four_points'],
  vc: ['sandals', 'mandarin_oriental'],
  dm: ['kempinski'],
  ky: ['ritz_carlton', 'kimpton', 'marriott', 'holiday_inn', 'westin'],
  tc: ['ritz_carlton', 'aman', 'rosewood', 'sandals'],
  ai: ['four_seasons'],
  vg: ['rosewood'],
  pr: ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western', 'ritz_carlton', 'st_regis', 'fairmont', 'hyatt_regency', 'courtyard', 'hampton', 'holiday_inn_express', 'wyndham'],
  vi: ['ritz_carlton', 'westin', 'marriott', 'hilton'],
  aw: ['ritz_carlton', 'marriott', 'hilton', 'hyatt_regency', 'riu', 'holiday_inn', 'courtyard', 'renaissance'],
  cw: ['marriott', 'hilton', 'renaissance', 'sandals'],
  sx: ['holiday_inn'],
  bq: ['courtyard'],
  an: ['marriott', 'hilton'],
  gp: ['novotel', 'mercure'],
  mq: ['novotel', 'mercure'],
  bl: ['rosewood'],
  mf: ['belmond'],
  ht: ['marriott', 'best_western'],
  br: ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western', 'fairmont', 'four_seasons', 'jw_marriott', 'grand_hyatt', 'intercontinental', 'sofitel', 'pullman', 'mercure', 'ibis_budget', 'windsor', 'atlantica', 'belmond', 'rosewood', 'hilton_garden', 'wyndham', 'ramada', 'w_hotels', 'renaissance'],
  ar: ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western', 'four_seasons', 'park_hyatt', 'sofitel', 'intercontinental', 'nh', 'nh_collection', 'howard_johnson', 'wyndham', 'holiday_inn_express'],
  cl: ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western', 'ritz_carlton', 'w_hotels', 'mandarin_oriental', 'intercontinental', 'nh', 'nh_collection', 'crowne_plaza', 'courtyard', 'holiday_inn_express', 'hyatt_place', 'wyndham'],
  co: ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western', 'four_seasons', 'jw_marriott', 'w_hotels', 'grand_hyatt', 'intercontinental', 'sofitel', 'ghl', 'dann', 'estelar', 'decameron', 'nh', 'wyndham', 'hampton', 'holiday_inn_express', 'crowne_plaza'],
  pe: ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western', 'jw_marriott', 'westin', 'belmond', 'casa_andina', 'libertador', 'wyndham', 'holiday_inn_express', 'aloft', 'hyatt_regency', 'pullman', 'crowne_plaza', 'courtyard'],
  ec: ['marriott', 'hilton', 'sheraton', 'jw_marriott', 'swissotel', 'wyndham', 'holiday_inn', 'best_western', 'hyatt_regency', 'ibis', 'novotel', 'dann'],
  bo: ['marriott', 'hilton_garden', 'radisson', 'ramada', 'best_western', 'hampton'],
  py: ['sheraton', 'crowne_plaza', 'ibis', 'aloft'],
  uy: ['sheraton', 'hilton', 'radisson', 'sofitel', 'aloft', 'ibis', 'holiday_inn', 'nh'],
  ve: ['marriott', 'renaissance', 'best_western'],
  gy: ['marriott', 'ramada'],
  sr: ['marriott', 'courtyard', 'ramada'],
  gf: ['mercure', 'best_western'],
  uk: ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western', 'four_seasons', 'ritz_carlton', 'jw_marriott', 'intercontinental', 'sofitel', 'park_hyatt', 'mandarin_oriental', 'ibis_budget', 'ibis_styles', 'mercure', 'holiday_inn_express', 'b_and_b', 'campanile', 'moxy', 'motel_one', 'premier_inn', 'travelodge_uk', 'waldorf', 'conrad', 'st_regis', 'edition', 'w_hotels', 'kimpton', 'hotel_indigo', 'crowne_plaza', 'doubletree', 'hampton', 'hilton_garden', 'andaz', 'hyatt_regency', 'rosewood', 'peninsula', 'belmond', 'citizenm', 'ruby', 'leonardo', 'radisson_red', 'park_inn', 'courtyard', 'aloft', 'melia', 'nh', 'pullman', 'mgallery', 'raffles', 'bulgari_hotels'],
  ie: ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western', 'ibis_budget', 'ibis_styles', 'mercure', 'holiday_inn_express', 'b_and_b', 'campanile', 'moxy', 'motel_one', 'premier_inn', 'travelodge_uk', 'intercontinental', 'westin', 'conrad', 'hilton_garden', 'hampton', 'hotel_indigo', 'anantara'],
  fr: ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western', 'four_seasons', 'ritz_carlton', 'jw_marriott', 'intercontinental', 'sofitel', 'park_hyatt', 'mandarin_oriental', 'ibis_budget', 'ibis_styles', 'mercure', 'holiday_inn_express', 'b_and_b', 'campanile', 'moxy', 'motel_one', 'raffles', 'peninsula', 'shangri_la', 'bulgari_hotels', 'belmond', 'oetker', 'pullman', 'mgallery', 'kyriad', 'golden_tulip', 'citizenm', 'kimpton', 'hyatt_regency', 'w_hotels', 'renaissance', 'edition', 'hotel_indigo', 'crowne_plaza', 'melia', 'nh', 'barcelo'],
  de: ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western', 'four_seasons', 'ritz_carlton', 'jw_marriott', 'intercontinental', 'sofitel', 'park_hyatt', 'mandarin_oriental', 'ibis_budget', 'ibis_styles', 'mercure', 'holiday_inn_express', 'b_and_b', 'campanile', 'moxy', 'motel_one', 'steigenberger', 'maritim', 'leonardo', 'ruby', 'kempinski', 'waldorf', 'westin', 'le_meridien', 'grand_hyatt', 'hyatt_regency', 'andaz', 'rosewood', 'raffles', 'pullman', 'mgallery', 'premier_inn', 'hampton', 'hilton_garden', 'doubletree', 'crowne_plaza', 'hotel_indigo', 'radisson_red', 'park_inn', 'nh', 'nh_collection', 'melia', 'innside', 'citizenm'],
  nl: ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western', 'ibis_budget', 'ibis_styles', 'mercure', 'holiday_inn_express', 'b_and_b', 'campanile', 'moxy', 'motel_one', 'waldorf', 'conrad', 'intercontinental', 'sofitel', 'pullman', 'w_hotels', 'andaz', 'hyatt_regency', 'kimpton', 'crowne_plaza', 'hotel_indigo', 'doubletree', 'hampton', 'nh', 'nh_collection', 'citizenm', 'park_inn', 'ruby', 'leonardo'],
  be: ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western', 'ibis_budget', 'ibis_styles', 'mercure', 'holiday_inn_express', 'b_and_b', 'campanile', 'moxy', 'motel_one', 'sofitel', 'pullman', 'steigenberger', 'nh', 'nh_collection', 'crowne_plaza', 'park_inn', 'hampton', 'doubletree'],
  lu: ['sofitel', 'novotel', 'ibis', 'mercure', 'melia', 'hilton', 'doubletree', 'park_inn', 'nh'],
  ch: ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western', 'four_seasons', 'ritz_carlton', 'jw_marriott', 'intercontinental', 'sofitel', 'park_hyatt', 'mandarin_oriental', 'ibis_budget', 'ibis_styles', 'mercure', 'holiday_inn_express', 'b_and_b', 'campanile', 'moxy', 'motel_one', 'kempinski', 'fairmont', 'peninsula', 'bulgari_hotels', 'swissotel', 'movenpick', 'mgallery', 'hyatt_regency', 'ruby', 'citizenm', 'nh', 'steigenberger', 'hampton'],
  at: ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western', 'ibis_budget', 'ibis_styles', 'mercure', 'holiday_inn_express', 'b_and_b', 'campanile', 'moxy', 'motel_one', 'ritz_carlton', 'park_hyatt', 'andaz', 'kempinski', 'rosewood', 'sofitel', 'le_meridien', 'intercontinental', 'ruby', 'nh', 'nh_collection', 'melia', 'steigenberger', 'hampton', 'radisson_red', 'park_inn', 'leonardo'],
  es: ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western', 'four_seasons', 'ritz_carlton', 'jw_marriott', 'intercontinental', 'sofitel', 'park_hyatt', 'mandarin_oriental', 'ibis_budget', 'ibis_styles', 'mercure', 'holiday_inn_express', 'b_and_b', 'campanile', 'moxy', 'motel_one', 'melia', 'gran_melia', 'innside', 'nh', 'nh_collection', 'barcelo', 'riu', 'iberostar', 'w_hotels', 'st_regis', 'edition', 'westin', 'le_meridien', 'kimpton', 'hyatt_regency', 'rosewood', 'bulgari_hotels', 'belmond', 'hampton', 'crowne_plaza', 'hotel_indigo', 'radisson_red', 'citizenm', 'leonardo'],
  pt: ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western', 'ibis_budget', 'ibis_styles', 'mercure', 'holiday_inn_express', 'b_and_b', 'campanile', 'moxy', 'motel_one', 'four_seasons', 'six_senses', 'intercontinental', 'anantara', 'avani', 'nh', 'nh_collection', 'melia', 'crowne_plaza', 'doubletree', 'hampton', 'hyatt_regency', 'w_hotels', 'ritz_carlton', 'mgallery', 'sofitel', 'pullman', 'leonardo'],
  it: ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western', 'four_seasons', 'ritz_carlton', 'jw_marriott', 'intercontinental', 'sofitel', 'park_hyatt', 'mandarin_oriental', 'ibis_budget', 'ibis_styles', 'mercure', 'holiday_inn_express', 'b_and_b', 'campanile', 'moxy', 'motel_one', 'bulgari_hotels', 'st_regis', 'w_hotels', 'westin', 'edition', 'six_senses', 'rosewood', 'belmond', 'aman', 'nh', 'nh_collection', 'melia', 'gran_melia', 'crowne_plaza', 'hilton_garden', 'doubletree', 'hampton', 'ruby', 'citizenm', 'leonardo', 'radisson_red'],
  mt: ['hilton', 'intercontinental', 'westin', 'marriott', 'hyatt_regency', 'radisson_blu', 'holiday_inn_express', 'ibis_styles'],
  gr: ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western', 'four_seasons', 'grand_hyatt', 'intercontinental', 'sofitel', 'mgallery', 'w_hotels', 'moxy', 'crowne_plaza', 'one_and_only', 'mandarin_oriental', 'six_senses', 'ibis_styles', 'melia', 'nh'],
  cy: ['four_seasons', 'hilton', 'radisson_blu', 'marriott', 'leonardo', 'crowne_plaza', 'anantara', 'nh'],
  ad: ['novotel', 'ibis', 'holiday_inn'],
  mc: ['fairmont', 'le_meridien', 'novotel'],
  sm: ['best_western'],
  li: ['best_western'],
  gi: ['holiday_inn'],
  im: ['premier_inn', 'best_western'],
  je: ['radisson_blu', 'premier_inn'],
  gg: ['best_western'],
  se: ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western', 'scandic', 'clarion', 'comfort_inn', 'quality_inn', 'motel_one', 'park_inn'],
  no: ['scandic', 'thon', 'clarion', 'radisson_blu', 'comfort_inn', 'quality_inn', 'best_western', 'park_inn', 'hilton', 'marriott', 'moxy', 'holiday_inn', 'ibis'],
  dk: ['scandic', 'clarion', 'comfort_inn', 'radisson_blu', 'radisson_red', 'marriott', 'hilton', 'crowne_plaza', 'holiday_inn', 'ibis', 'ibis_styles', 'best_western', 'motel_one', 'citizenm', 'nh', 'nh_collection', 'moxy'],
  fi: ['scandic', 'sokos', 'radisson_blu', 'clarion', 'hilton', 'marriott', 'holiday_inn', 'best_western', 'ibis', 'hotel_indigo', 'crowne_plaza'],
  is: ['hilton', 'radisson_blu', 'canopy', 'marriott', 'edition', 'holiday_inn_express'],
  ee: ['radisson_blu', 'hilton', 'swissotel', 'ibis', 'holiday_inn', 'park_inn'],
  lv: ['radisson_blu', 'ibis', 'holiday_inn', 'park_inn', 'mercure', 'pullman', 'kempinski'],
  lt: ['radisson_blu', 'kempinski', 'hilton_garden', 'holiday_inn', 'ibis', 'novotel', 'park_inn', 'courtyard', 'moxy', 'crowne_plaza'],
  fo: ['hilton_garden'],
  ax: ['scandic'],
  sj: ['radisson_blu'],
  pl: ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western', 'ibis_budget', 'ibis_styles', 'mercure', 'holiday_inn_express', 'b_and_b', 'campanile', 'moxy', 'motel_one', 'raffles', 'intercontinental', 'westin', 'sofitel', 'crowne_plaza', 'hampton', 'hilton_garden', 'doubletree', 'leonardo', 'park_inn', 'radisson_red', 'nh', 'courtyard', 'hotel_indigo'],
  cz: ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western', 'ibis_budget', 'ibis_styles', 'mercure', 'holiday_inn_express', 'b_and_b', 'campanile', 'moxy', 'motel_one', 'four_seasons', 'mandarin_oriental', 'andaz', 'intercontinental', 'nh', 'nh_collection', 'park_inn', 'hotel_indigo', 'crowne_plaza', 'courtyard', 'hampton', 'clarion', 'best_western_premier', 'leonardo'],
  sk: ['sheraton', 'crowne_plaza', 'radisson_blu', 'ibis', 'mercure', 'park_inn', 'holiday_inn', 'marriott', 'doubletree', 'nh'],
  hu: ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western', 'ibis_budget', 'ibis_styles', 'mercure', 'holiday_inn_express', 'b_and_b', 'campanile', 'moxy', 'motel_one', 'four_seasons', 'ritz_carlton', 'kempinski', 'intercontinental', 'sofitel', 'crowne_plaza', 'park_inn', 'nh', 'hotel_indigo', 'hampton', 'courtyard', 'anantara', 'leonardo'],
  ro: ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western', 'jw_marriott', 'intercontinental', 'crowne_plaza', 'pullman', 'mercure', 'ibis_styles', 'ramada', 'hilton_garden', 'doubletree', 'courtyard', 'moxy', 'park_inn', 'nh', 'golden_tulip'],
  bg: ['hilton', 'marriott', 'intercontinental', 'radisson_blu', 'holiday_inn', 'ibis', 'novotel', 'hyatt_regency', 'best_western', 'ramada', 'melia', 'riu', 'iberostar', 'barcelo'],
  hr: ['hilton', 'westin', 'sheraton', 'doubletree', 'radisson_blu', 'kempinski', 'le_meridien', 'hyatt_regency', 'best_western', 'ibis_styles', 'holiday_inn', 'marriott', 'moxy'],
  rs: ['hilton', 'marriott', 'crowne_plaza', 'radisson', 'hyatt_regency', 'mercure', 'holiday_inn', 'ibis', 'moxy', 'courtyard', 'st_regis', 'best_western'],
  si: ['intercontinental', 'radisson_blu', 'best_western_premier', 'ibis_styles', 'kempinski', 'four_points', 'holiday_inn'],
  ba: ['hilton', 'courtyard', 'swissotel', 'holiday_inn', 'ibis_styles', 'novotel', 'best_western', 'mercure'],
  me: ['hilton', 'regent', 'one_and_only', 'ramada', 'hyatt_regency', 'best_western', 'four_points'],
  mk: ['marriott', 'doubletree', 'holiday_inn', 'ibis', 'park_inn', 'best_western', 'ramada'],
  al: ['marriott', 'hilton_garden', 'melia', 'best_western', 'maritim', 'radisson'],
  xk: ['swissotel', 'hilton_garden'],
  md: ['radisson_blu', 'best_western'],
  ua: ['intercontinental', 'hilton', 'hyatt_regency', 'radisson_blu', 'ibis', 'holiday_inn', 'fairmont', 'park_inn', 'ramada', 'best_western', 'mercure', 'aloft'],
  by: ['marriott', 'doubletree', 'renaissance', 'crowne_plaza', 'hampton', 'holiday_inn'],
  ru: ['four_seasons', 'ritz_carlton', 'st_regis', 'lotte', 'kempinski', 'swissotel', 'ibis', 'novotel', 'mercure', 'holiday_inn', 'crowne_plaza', 'hilton', 'doubletree', 'hampton', 'radisson_blu', 'park_inn', 'marriott', 'courtyard', 'sheraton', 'hyatt_regency', 'best_western'],
  ge: ['radisson_blu', 'marriott', 'courtyard', 'sheraton', 'holiday_inn', 'ibis_styles', 'mercure', 'hyatt_regency', 'moxy', 'best_western', 'wyndham', 'ramada', 'golden_tulip', 'crowne_plaza', 'swissotel'],
  am: ['marriott', 'radisson_blu', 'hyatt_place', 'doubletree', 'holiday_inn', 'ibis', 'courtyard', 'ramada', 'best_western', 'golden_tulip'],
  az: ['four_seasons', 'fairmont', 'jw_marriott', 'hilton', 'hyatt_regency', 'intercontinental', 'sheraton', 'marriott', 'courtyard', 'holiday_inn', 'ibis', 'pullman', 'kempinski', 'park_inn', 'ramada', 'crowne_plaza', 'best_western'],
  cs: ['hilton', 'marriott', 'regent'],
  ae: ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western', 'four_seasons', 'ritz_carlton', 'jw_marriott', 'intercontinental', 'sofitel', 'park_hyatt', 'mandarin_oriental', 'jumeirah', 'address', 'atlantis', 'one_and_only', 'rotana', 'rixos', 'waldorf', 'conrad', 'st_regis', 'w_hotels', 'westin', 'le_meridien', 'grand_hyatt', 'andaz', 'hyatt_regency', 'kempinski', 'shangri_la', 'fairmont', 'raffles', 'bulgari_hotels', 'edition', 'six_senses', 'anantara', 'avani', 'millennium_gulf', 'crowne_plaza', 'holiday_inn_express', 'premier_inn', 'pullman', 'movenpick', 'swissotel', 'hampton', 'doubletree', 'hilton_garden', 'courtyard', 'aloft', 'moxy', 'radisson_red', 'park_inn', 'wyndham', 'ramada', 'golden_tulip', 'taj', 'oberoi'],
  qa: ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western', 'four_seasons', 'ritz_carlton', 'jw_marriott', 'intercontinental', 'sofitel', 'park_hyatt', 'mandarin_oriental', 'st_regis', 'w_hotels', 'westin', 'waldorf', 'raffles', 'fairmont', 'banyan_tree', 'kempinski', 'shangri_la', 'grand_hyatt', 'movenpick', 'pullman', 'rotana', 'crowne_plaza', 'premier_inn', 'doubletree', 'hilton_garden', 'wyndham', 'park_inn', 'millennium_gulf', 'mercure', 'mgallery', 'rixos'],
  sa: ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western', 'four_seasons', 'ritz_carlton', 'jw_marriott', 'intercontinental', 'sofitel', 'park_hyatt', 'mandarin_oriental', 'fairmont', 'raffles', 'swissotel', 'movenpick', 'pullman', 'kempinski', 'shangri_la', 'hyatt_regency', 'grand_hyatt', 'crowne_plaza', 'voco', 'hilton_garden', 'doubletree', 'hampton', 'courtyard', 'aloft', 'le_meridien', 'rotana', 'millennium_gulf', 'park_inn', 'wyndham', 'ramada', 'golden_tulip', 'mercure', 'jumeirah', 'edition', 'six_senses', 'aman', 'st_regis'],
  kw: ['four_seasons', 'jumeirah', 'sheraton', 'jw_marriott', 'courtyard', 'hilton', 'crowne_plaza', 'holiday_inn', 'radisson_blu', 'millennium_gulf', 'movenpick', 'ibis', 'grand_hyatt', 'waldorf', 'best_western', 'wyndham'],
  bh: ['four_seasons', 'ritz_carlton', 'intercontinental', 'sheraton', 'westin', 'le_meridien', 'jumeirah', 'sofitel', 'movenpick', 'crowne_plaza', 'hilton', 'conrad', 'wyndham', 'ramada', 'ibis', 'novotel', 'rotana', 'swissotel', 'radisson', 'best_western', 'hilton_garden', 'mercure'],
  om: ['shangri_la', 'w_hotels', 'kempinski', 'intercontinental', 'sheraton', 'crowne_plaza', 'grand_hyatt', 'radisson_blu', 'holiday_inn', 'ibis', 'novotel', 'mercure', 'movenpick', 'anantara', 'six_senses', 'alila', 'jw_marriott', 'st_regis', 'hilton_garden', 'doubletree', 'wyndham', 'ramada', 'golden_tulip', 'best_western', 'premier_inn', 'park_inn', 'millennium_gulf'],
  jo: ['four_seasons', 'st_regis', 'w_hotels', 'sheraton', 'le_meridien', 'marriott', 'intercontinental', 'kempinski', 'movenpick', 'fairmont', 'grand_hyatt', 'crowne_plaza', 'holiday_inn', 'hilton', 'doubletree', 'ibis', 'ramada', 'best_western', 'rotana', 'golden_tulip', 'days_inn', 'wyndham', 'park_inn'],
  lb: ['four_seasons', 'intercontinental', 'kempinski', 'movenpick', 'radisson_blu', 'crowne_plaza', 'hilton', 'golden_tulip', 'ramada', 'best_western'],
  il: ['dan', 'isrotel', 'leonardo', 'intercontinental', 'hilton', 'waldorf', 'ritz_carlton', 'sheraton', 'crowne_plaza', 'kempinski', 'ibis', 'holiday_inn', 'six_senses', 'best_western'],
  ps: ['movenpick', 'millennium'],
  iq: ['erbil_rotana', 'divan'],
  ir: ['espinas', 'parsian'],
  sy: ['sheraton'],
  tr: ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western', 'four_seasons', 'ritz_carlton', 'jw_marriott', 'intercontinental', 'sofitel', 'park_hyatt', 'mandarin_oriental', 'raffles', 'shangri_la', 'peninsula', 'st_regis', 'w_hotels', 'edition', 'kempinski', 'swissotel', 'fairmont', 'conrad', 'grand_hyatt', 'hyatt_regency', 'crowne_plaza', 'hilton_garden', 'doubletree', 'hampton', 'hotel_indigo', 'titanic', 'divan', 'rixos', 'movenpick', 'pullman', 'mercure', 'ibis_styles', 'wyndham', 'ramada', 'days_inn', 'radisson_red', 'park_inn', 'golden_tulip', 'barcelo', 'melia', 'nh', 'six_senses', 'courtyard', 'aloft', 'moxy', 'le_meridien', 'renaissance', 'westin'],
  eg: ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western', 'four_seasons', 'ritz_carlton', 'st_regis', 'kempinski', 'fairmont', 'sofitel', 'steigenberger', 'intercontinental', 'jw_marriott', 'conrad', 'hyatt_regency', 'grand_hyatt', 'crowne_plaza', 'hilton_garden', 'doubletree', 'ramada', 'wyndham', 'movenpick', 'pullman', 'mercure', 'rixos', 'park_inn', 'golden_tulip', 'le_meridien', 'westin', 'renaissance', 'courtyard', 'melia', 'riu', 'iberostar', 'barcelo', 'anantara'],
  ma: ['marriott', 'sheraton', 'hilton', 'holiday_inn', 'novotel', 'ibis', 'radisson_blu', 'best_western', 'four_seasons', 'mandarin_oriental', 'fairmont', 'sofitel', 'pullman', 'movenpick', 'mgallery', 'hyatt_regency', 'ritz_carlton', 'st_regis', 'w_hotels', 'le_meridien', 'park_inn', 'crowne_plaza', 'hilton_garden', 'doubletree', 'mercure', 'golden_tulip', 'melia', 'riu', 'iberostar', 'barcelo', 'onomo', 'kempinski', 'oberoi', 'rosewood', 'anantara', 'banyan_tree'],
  tn: ['four_seasons', 'movenpick', 'sheraton', 'marriott', 'novotel', 'ibis', 'mercure', 'golden_tulip', 'anantara', 'radisson_blu', 'ramada', 'barcelo', 'riu', 'iberostar', 'melia', 'best_western'],
  dz: ['sofitel', 'sheraton', 'marriott', 'hyatt_regency', 'hilton', 'holiday_inn', 'ibis', 'novotel', 'mercure', 'radisson_blu', 'park_inn', 'golden_tulip', 'best_western', 'four_points', 'le_meridien', 'renaissance'],
  ly: ['radisson_blu'],
  sd: ['rotana'],
  ng: ['radisson_blu', 'ibis', 'novotel', 'pullman', 'onomo', 'azalai', 'golden_tulip', 'protea', 'eko', 'transcorp', 'sheraton', 'marriott', 'four_points', 'hilton', 'best_western', 'mercure', 'park_inn', 'radisson'],
  gh: ['radisson_blu', 'ibis', 'novotel', 'pullman', 'onomo', 'azalai', 'golden_tulip', 'protea', 'kempinski', 'marriott', 'movenpick', 'holiday_inn', 'ibis_styles', 'best_western'],
  ci: ['radisson_blu', 'ibis', 'novotel', 'pullman', 'onomo', 'azalai', 'golden_tulip', 'protea', 'sofitel', 'movenpick', 'best_western'],
  sn: ['radisson_blu', 'ibis', 'novotel', 'pullman', 'onomo', 'azalai', 'golden_tulip', 'protea', 'best_western', 'riu'],
  cm: ['radisson_blu', 'ibis', 'novotel', 'pullman', 'onomo', 'azalai', 'golden_tulip', 'protea', 'hilton', 'best_western'],
  ml: ['azalai', 'radisson_blu', 'sheraton', 'onomo'],
  bf: ['azalai'],
  tg: ['radisson_blu', 'onomo', 'ibis'],
  bj: ['azalai', 'golden_tulip', 'novotel'],
  ne: ['radisson_blu'],
  gn: ['sheraton', 'onomo'],
  sl: ['radisson_blu'],
  gw: ['azalai'],
  mr: ['azalai'],
  cv: ['hilton', 'riu', 'melia', 'iberostar'],
  td: ['radisson_blu', 'hilton'],
  gq: ['sofitel', 'hilton'],
  ga: ['radisson_blu', 'onomo'],
  cg: ['radisson_blu', 'pullman'],
  cd: ['pullman', 'hilton', 'radisson_blu'],
  ao: ['intercontinental'],
  et: ['sheraton', 'hilton', 'hyatt_regency', 'radisson_blu', 'marriott', 'ramada', 'golden_tulip', 'best_western'],
  ke: ['serena', 'fairmont', 'hilton', 'radisson_blu', 'intercontinental', 'jw_marriott', 'movenpick', 'pullman', 'ibis_styles', 'hilton_garden', 'best_western', 'park_inn', 'crowne_plaza', 'holiday_inn', 'four_points', 'kempinski'],
  tz: ['serena', 'hyatt_regency', 'four_seasons', 'ramada', 'four_points', 'park_inn', 'golden_tulip', 'protea', 'best_western', 'melia'],
  ug: ['serena', 'sheraton', 'protea', 'four_points', 'hilton_garden', 'golden_tulip', 'best_western', 'onomo'],
  rw: ['serena', 'marriott', 'radisson_blu', 'four_points', 'park_inn', 'one_and_only', 'onomo'],
  bi: ['serena'],
  dj: ['sheraton', 'kempinski'],
  ss: ['radisson_blu'],
  mz: ['serena', 'radisson_blu', 'southern_sun', 'avani', 'anantara', 'hilton', 'city_lodge', 'protea'],
  mw: ['protea'],
  zm: ['radisson_blu', 'protea', 'intercontinental', 'southern_sun', 'avani', 'hilton_garden', 'best_western'],
  zw: ['cresta', 'legacy', 'holiday_inn', 'protea'],
  bw: ['cresta', 'protea', 'avani', 'hilton_garden', 'city_lodge'],
  na: ['protea', 'hilton', 'avani'],
  ls: ['avani'],
  za: ['southern_sun', 'sun_international', 'city_lodge', 'protea', 'legacy', 'radisson_blu', 'radisson_red', 'park_inn', 'hilton', 'marriott', 'sheraton', 'westin', 'four_seasons', 'one_and_only', 'intercontinental', 'holiday_inn', 'holiday_inn_express', 'crowne_plaza', 'hyatt_regency', 'mercure', 'ibis', 'ibis_budget', 'movenpick', 'pullman', 'best_western', 'onomo', 'belmond', 'anantara', 'avani'],
  mu: ['beachcomber', 'lux', 'constance', 'heritage', 'one_and_only', 'four_seasons', 'st_regis', 'jw_marriott', 'westin', 'le_meridien', 'shangri_la', 'anantara', 'hilton', 'intercontinental', 'sofitel', 'radisson_blu', 'ibis_styles', 'movenpick', 'ritz_carlton', 'oberoi'],
  sc: ['four_seasons', 'constance', 'raffles', 'six_senses', 'hilton', 'kempinski', 'anantara', 'banyan_tree', 'avani'],
  mg: ['radisson_blu', 'novotel', 'ibis'],
  km: ['golden_tulip'],
  re: ['lux', 'radisson', 'mercure', 'ibis', 'novotel'],
  yt: ['ibis'],
  in: ['taj', 'vivanta', 'itc', 'oberoi', 'leela', 'lemon_tree', 'jw_marriott', 'ritz_carlton', 'st_regis', 'w_hotels', 'westin', 'sheraton', 'le_meridien', 'renaissance', 'courtyard', 'four_points', 'fairfield', 'aloft', 'moxy', 'hilton', 'conrad', 'doubletree', 'hampton', 'hilton_garden', 'intercontinental', 'crowne_plaza', 'holiday_inn', 'holiday_inn_express', 'grand_hyatt', 'park_hyatt', 'hyatt_regency', 'andaz', 'alila', 'hyatt_place', 'sofitel', 'pullman', 'novotel', 'ibis', 'raffles', 'fairmont', 'radisson_blu', 'radisson', 'park_inn', 'ramada', 'wyndham', 'best_western', 'four_seasons', 'mandarin_oriental', 'aman', 'six_senses', 'shangri_la', 'kempinski', 'anantara', 'como'],
  pk: ['marriott', 'sheraton', 'movenpick', 'ramada', 'best_western', 'serena'],
  bd: ['intercontinental', 'westin', 'sheraton', 'le_meridien', 'radisson_blu', 'pan_pacific', 'renaissance', 'holiday_inn', 'best_western', 'hyatt_regency'],
  lk: ['shangri_la', 'hilton', 'marriott', 'sheraton', 'movenpick', 'anantara', 'taj', 'radisson', 'ramada', 'best_western', 'six_senses', 'aman', 'como'],
  np: ['hyatt_regency', 'marriott', 'aloft', 'fairfield', 'hilton', 'radisson', 'crowne_plaza', 'holiday_inn', 'ramada', 'dusit'],
  bt: ['aman', 'six_senses', 'como', 'taj', 'le_meridien'],
  mv: ['soneva', 'one_and_only', 'four_seasons', 'ritz_carlton', 'st_regis', 'w_hotels', 'sheraton', 'le_meridien', 'jw_marriott', 'westin', 'waldorf', 'conrad', 'intercontinental', 'six_senses', 'park_hyatt', 'alila', 'anantara', 'avani', 'banyan_tree', 'como', 'shangri_la', 'taj', 'oberoi', 'raffles', 'fairmont', 'sofitel', 'pullman', 'movenpick', 'lux', 'constance', 'kempinski', 'hilton', 'radisson_blu', 'centara', 'dusit', 'jumeirah', 'bulgari_hotels', 'mandarin_oriental', 'aman', 'rosewood'],
  kz: ['ritz_carlton', 'st_regis', 'sheraton', 'marriott', 'hilton', 'doubletree', 'hilton_garden', 'hampton', 'intercontinental', 'holiday_inn', 'ibis', 'novotel', 'mercure', 'swissotel', 'movenpick', 'rixos', 'radisson', 'park_inn', 'ramada', 'wyndham', 'best_western', 'hyatt_regency'],
  uz: ['hyatt_regency', 'hilton', 'intercontinental', 'holiday_inn', 'radisson_blu', 'wyndham', 'ramada', 'mercure', 'ibis', 'novotel', 'lotte', 'marriott', 'courtyard', 'best_western'],
  kg: ['sheraton', 'hyatt_regency', 'novotel', 'ramada', 'park_inn', 'best_western'],
  tj: ['hyatt_regency', 'hilton', 'sheraton', 'serena', 'ramada'],
  af: ['serena'],
  mn: ['shangri_la', 'kempinski', 'holiday_inn', 'ramada', 'best_western', 'novotel', 'ibis'],
  jp: ['okura', 'nikko', 'prince', 'toyoko_inn', 'apa', 'dormy_inn', 'hoshinoya', 'ritz_carlton', 'st_regis', 'edition', 'w_hotels', 'westin', 'sheraton', 'marriott', 'courtyard', 'moxy', 'aloft', 'fairfield', 'hilton', 'conrad', 'doubletree', 'hilton_garden', 'intercontinental', 'kimpton', 'crowne_plaza', 'holiday_inn', 'park_hyatt', 'grand_hyatt', 'hyatt_regency', 'andaz', 'hyatt_place', 'four_seasons', 'mandarin_oriental', 'peninsula', 'aman', 'shangri_la', 'bulgari_hotels', 'six_senses', 'rosewood', 'raffles', 'fairmont', 'swissotel', 'pullman', 'novotel', 'mercure', 'ibis', 'ibis_styles', 'ibis_budget', 'banyan_tree', 'best_western', 'comfort_inn', 'ramada', 'days_inn', 'super_8', 'wyndham', 'citizenm'],
  kr: ['lotte', 'shilla', 'grand_hyatt', 'park_hyatt', 'andaz', 'four_seasons', 'jw_marriott', 'ritz_carlton', 'westin', 'sheraton', 'marriott', 'courtyard', 'moxy', 'aloft', 'fairfield', 'le_meridien', 'conrad', 'hilton', 'intercontinental', 'holiday_inn', 'holiday_inn_express', 'sofitel', 'novotel', 'ibis', 'ibis_styles', 'mercure', 'fairmont', 'banyan_tree', 'ramada', 'best_western', 'toyoko_inn'],
  cn: ['jin_jiang', 'atour', 'hanting', 'shangri_la', 'kerry', 'peninsula', 'mandarin_oriental', 'four_seasons', 'ritz_carlton', 'st_regis', 'jw_marriott', 'w_hotels', 'westin', 'sheraton', 'le_meridien', 'renaissance', 'marriott', 'courtyard', 'four_points', 'fairfield', 'aloft', 'moxy', 'waldorf', 'conrad', 'hilton', 'doubletree', 'hampton', 'hilton_garden', 'intercontinental', 'regent', 'kimpton', 'crowne_plaza', 'hotel_indigo', 'holiday_inn', 'holiday_inn_express', 'park_hyatt', 'grand_hyatt', 'hyatt_regency', 'andaz', 'hyatt_place', 'sofitel', 'pullman', 'novotel', 'mercure', 'ibis', 'raffles', 'fairmont', 'swissotel', 'banyan_tree', 'rosewood', 'bulgari_hotels', 'edition', 'aman', 'six_senses', 'kempinski', 'okura', 'nikko', 'wyndham', 'ramada', 'days_inn', 'super_8', 'best_western', 'radisson_blu', 'park_inn', 'anantara', 'lotte', 'atlantis'],
  hk: ['peninsula', 'mandarin_oriental', 'four_seasons', 'ritz_carlton', 'st_regis', 'rosewood', 'shangri_la', 'kerry', 'jw_marriott', 'w_hotels', 'sheraton', 'renaissance', 'courtyard', 'conrad', 'hilton', 'intercontinental', 'regent', 'hotel_indigo', 'holiday_inn', 'holiday_inn_express', 'grand_hyatt', 'hyatt_regency', 'park_hyatt', 'sofitel', 'novotel', 'ibis', 'ibis_styles', 'kimpton', 'hampton', 'okura'],
  mo: ['grand_hyatt', 'four_seasons', 'ritz_carlton', 'st_regis', 'jw_marriott', 'sheraton', 'westin', 'conrad', 'banyan_tree', 'mandarin_oriental', 'okura', 'sofitel', 'holiday_inn', 'raffles', 'andaz', 'w_hotels', 'atlantis'],
  tw: ['okura', 'shangri_la', 'mandarin_oriental', 'w_hotels', 'sheraton', 'le_meridien', 'marriott', 'courtyard', 'aloft', 'moxy', 'hilton', 'doubletree', 'intercontinental', 'kimpton', 'holiday_inn', 'holiday_inn_express', 'grand_hyatt', 'hyatt_regency', 'andaz', 'regent', 'sofitel', 'novotel', 'ibis', 'ibis_styles', 'hotel_indigo', 'toyoko_inn', 'ramada', 'best_western'],
  kp: ['yanggakdo', 'koryo'],
  sg: ['raffles', 'fairmont', 'swissotel', 'pan_pacific', 'millennium', 'copthorne', 'shangri_la', 'mandarin_oriental', 'four_seasons', 'ritz_carlton', 'st_regis', 'w_hotels', 'jw_marriott', 'westin', 'sheraton', 'marriott', 'courtyard', 'moxy', 'conrad', 'hilton', 'intercontinental', 'holiday_inn', 'holiday_inn_express', 'crowne_plaza', 'hotel_indigo', 'grand_hyatt', 'park_hyatt', 'andaz', 'sofitel', 'pullman', 'novotel', 'mercure', 'ibis', 'ibis_styles', 'ibis_budget', 'mgallery', 'six_senses', 'edition', 'citizenm', 'dusit'],
  my: ['shangri_la', 'mandarin_oriental', 'four_seasons', 'ritz_carlton', 'st_regis', 'w_hotels', 'jw_marriott', 'westin', 'sheraton', 'le_meridien', 'renaissance', 'marriott', 'courtyard', 'four_points', 'aloft', 'moxy', 'hilton', 'doubletree', 'hilton_garden', 'intercontinental', 'holiday_inn', 'holiday_inn_express', 'grand_hyatt', 'hyatt_regency', 'hyatt_place', 'sofitel', 'pullman', 'novotel', 'mercure', 'ibis', 'ibis_styles', 'movenpick', 'banyan_tree', 'anantara', 'avani', 'dusit', 'pan_pacific', 'millennium', 'ramada', 'best_western', 'wyndham', 'park_inn'],
  th: ['dusit', 'centara', 'anantara', 'avani', 'banyan_tree', 'mandarin_oriental', 'peninsula', 'four_seasons', 'ritz_carlton', 'st_regis', 'w_hotels', 'jw_marriott', 'westin', 'sheraton', 'le_meridien', 'renaissance', 'marriott', 'courtyard', 'four_points', 'aloft', 'moxy', 'waldorf', 'conrad', 'hilton', 'doubletree', 'hilton_garden', 'intercontinental', 'kimpton', 'crowne_plaza', 'hotel_indigo', 'holiday_inn', 'holiday_inn_express', 'six_senses', 'park_hyatt', 'grand_hyatt', 'hyatt_regency', 'andaz', 'sofitel', 'pullman', 'novotel', 'mercure', 'ibis', 'ibis_styles', 'movenpick', 'swissotel', 'raffles', 'fairmont', 'rosewood', 'aman', 'como', 'soneva', 'kempinski', 'okura', 'shangri_la', 'ramada', 'best_western', 'radisson_blu', 'pan_pacific', 'millennium', 'copthorne'],
  vn: ['sofitel', 'pullman', 'novotel', 'mercure', 'ibis', 'mgallery', 'movenpick', 'jw_marriott', 'sheraton', 'le_meridien', 'renaissance', 'marriott', 'four_points', 'hilton', 'hilton_garden', 'intercontinental', 'crowne_plaza', 'holiday_inn', 'holiday_inn_express', 'park_hyatt', 'hyatt_regency', 'grand_hyatt', 'six_senses', 'four_seasons', 'anantara', 'avani', 'banyan_tree', 'melia', 'best_western', 'wyndham', 'radisson_blu', 'centara', 'dusit', 'regent', 'lotte', 'nikko', 'okura'],
  id: ['four_seasons', 'ritz_carlton', 'st_regis', 'w_hotels', 'jw_marriott', 'westin', 'sheraton', 'le_meridien', 'marriott', 'courtyard', 'four_points', 'aloft', 'moxy', 'fairfield', 'bulgari_hotels', 'conrad', 'hilton', 'doubletree', 'hilton_garden', 'hampton', 'intercontinental', 'holiday_inn', 'holiday_inn_express', 'crowne_plaza', 'hotel_indigo', 'six_senses', 'park_hyatt', 'grand_hyatt', 'hyatt_regency', 'alila', 'andaz', 'sofitel', 'pullman', 'novotel', 'mercure', 'ibis', 'ibis_styles', 'ibis_budget', 'raffles', 'fairmont', 'movenpick', 'swissotel', 'mgallery', 'banyan_tree', 'anantara', 'avani', 'aman', 'como', 'mandarin_oriental', 'shangri_la', 'kempinski', 'rosewood', 'okura', 'wyndham', 'ramada', 'best_western', 'radisson_blu', 'park_inn', 'dusit', 'centara', 'pan_pacific', 'millennium'],
  ph: ['shangri_la', 'peninsula', 'okura', 'nikko', 'sheraton', 'marriott', 'courtyard', 'four_points', 'westin', 'conrad', 'hilton', 'doubletree', 'intercontinental', 'holiday_inn', 'crowne_plaza', 'grand_hyatt', 'hyatt_regency', 'sofitel', 'novotel', 'ibis', 'ibis_styles', 'movenpick', 'fairmont', 'raffles', 'dusit', 'pan_pacific', 'best_western', 'ramada', 'radisson_blu', 'park_inn', 'aloft', 'moxy', 'lotte', 'banyan_tree', 'anantara', 'six_senses'],
  bn: ['radisson'],
  kh: ['raffles', 'sofitel', 'rosewood', 'hyatt_regency', 'courtyard', 'park_hyatt', 'anantara', 'avani', 'six_senses', 'novotel', 'ibis', 'holiday_inn', 'best_western', 'ramada'],
  la: ['crowne_plaza', 'avani', 'anantara', 'sofitel', 'pullman', 'ibis', 'mercure', 'best_western', 'belmond', 'rosewood'],
  mm: ['pan_pacific', 'melia', 'novotel', 'pullman', 'lotte', 'hilton', 'sheraton', 'wyndham', 'best_western'],
  au: ['rydges', 'quest', 'crown', 'four_seasons', 'park_hyatt', 'grand_hyatt', 'hyatt_regency', 'hyatt_place', 'ritz_carlton', 'w_hotels', 'jw_marriott', 'westin', 'sheraton', 'le_meridien', 'marriott', 'courtyard', 'four_points', 'aloft', 'moxy', 'hilton', 'doubletree', 'intercontinental', 'kimpton', 'crowne_plaza', 'hotel_indigo', 'holiday_inn', 'holiday_inn_express', 'voco', 'sofitel', 'pullman', 'novotel', 'mercure', 'ibis', 'ibis_styles', 'ibis_budget', 'mgallery', 'swissotel', 'movenpick', 'shangri_la', 'mandarin_oriental', 'como', 'raffles', 'fairmont', 'best_western', 'ramada', 'wyndham', 'days_inn', 'travelodge_uk', 'nh', 'melia', 'atlantica', 'radisson_blu', 'park_inn', 'one_and_only', 'six_senses'],
  nz: ['rydges', 'quest', 'sudima', 'scenic', 'sofitel', 'pullman', 'novotel', 'mercure', 'ibis', 'ibis_budget', 'mgallery', 'hilton', 'doubletree', 'intercontinental', 'crowne_plaza', 'holiday_inn', 'holiday_inn_express', 'jw_marriott', 'sheraton', 'four_points', 'park_hyatt', 'hyatt_regency', 'grand_hyatt', 'best_western', 'ramada', 'wyndham', 'radisson_blu', 'movenpick', 'swissotel', 'voco', 'hotel_indigo'],
  fj: ['sofitel', 'sheraton', 'westin', 'marriott', 'hilton', 'doubletree', 'intercontinental', 'holiday_inn', 'crowne_plaza', 'radisson_blu', 'outrigger', 'warwick', 'tanoa', 'six_senses', 'como', 'pullman', 'novotel', 'mercure', 'ibis', 'best_western', 'ramada', 'wyndham'],
  pg: ['hilton', 'holiday_inn', 'holiday_inn_express', 'crowne_plaza', 'ramada'],
  pf: ['intercontinental', 'four_seasons', 'st_regis', 'conrad', 'hilton', 'sofitel', 'pullman', 'le_meridien', 'westin'],
  nc: ['sheraton', 'le_meridien', 'hilton', 'doubletree', 'ibis', 'novotel', 'ramada'],
  vu: ['warwick', 'holiday_inn', 'ramada'],
  ws: ['sheraton'],
  to: ['tanoa'],
  nu: ['scenic'],
  gu: ['hilton', 'hyatt_regency', 'westin', 'sheraton', 'dusit', 'crowne_plaza', 'lotte', 'nikko', 'outrigger', 'holiday_inn'],
  mp: ['hyatt_regency', 'crowne_plaza'],
};

/**
 * Countries with hotels but no international chain SLATE can vouch for.
 * The game's own hotels stand in, named as SLATE's own.
 */
export const INDEPENDENT_ONLY: Readonly<Record<string, string>> = {
  st: 'São Tomé and Príncipe has independent hotels and resorts, none a chain SLATE can vouch for.',
  so: 'Mogadishu has independent hotels and no international chain operating openly.',
  er: 'Asmara has state-run and independent hotels and no international chain.',
  sz: 'Eswatini’s hotels are independents and the Royal Swazi Sun.',
  sh: 'Saint Helena has one hotel of note, run as an independent property.',
  tm: 'Ashgabat’s hotels are state-run; no international chain operates there.',
  tl: 'Dili has independent hotels and no international chain.',
  sb: 'Honiara has independent hotels and no international chain.',
  ck: 'Rarotonga’s resorts are independents.',
  as: 'Pago Pago has a few independent hotels.',
  pw: 'Palau’s resorts are independents.',
  fm: 'Micronesia has small independent lodges.',
  mh: 'Majuro has one resort and a few guesthouses, all independent.',
  nr: 'Nauru has one hotel of note and little else.',
  ki: 'Tarawa has small independent guesthouses.',
  tv: 'Funafuti has one hotel and a few guesthouses, all independent.',
  nf: 'Norfolk Island’s hotels are independents.',
  cx: 'Christmas Island has a few independent lodges.',
  cc: 'The Cocos Islands have a handful of independent rooms.',
  wf: 'Wallis and Futuna have a few independent hotels.',
  pm: 'Saint Pierre has independent hotels and no chain.',
  fk: 'Stanley has one hotel and a few guesthouses, all independent.',
  ms: 'Montserrat has small independent guesthouses.',
  va: 'The Vatican has no hotels; Rome’s are next door.',
  cf: 'Bangui has a few independent hotels and no international chain.',
  lr: 'Monrovia has independent hotels and no international chain.',
  gm: 'The Gambia’s resorts along the coast are independents.',
  eh: 'Laayoune has a few independent hotels.',
  ye: 'Sana’a and Aden have independent hotels; the chains have left.',
};

/**
 * Where Airbnb does not list, and why.
 *
 * Airbnb is a real platform. It suspended operations in Russia and Belarus in
 * 2022 and cannot list in places under United States sanctions, and nobody
 * lists a room on an uninhabited island.
 */
export const AIRBNB_UNAVAILABLE: Readonly<Record<string, string>> = {
  ru: 'Airbnb suspended all operations in Russia in March 2022.',
  by: 'Airbnb suspended all operations in Belarus in March 2022.',
  ir: 'Airbnb doesn’t list in Iran under United States sanctions.',
  sy: 'Airbnb doesn’t list in Syria under United States sanctions.',
  kp: 'Airbnb doesn’t list in North Korea under United States sanctions.',
  aq: 'Nobody lists a room in Antarctica.',
  bv: 'Bouvet Island is uninhabited.',
  hm: 'Heard Island is uninhabited.',
  gs: 'South Georgia has no residents to host anybody.',
  tf: 'The French Southern Territories have no residents to host anybody.',
  io: 'The British Indian Ocean Territory has no civilian residents.',
  um: 'The United States Minor Outlying Islands have no civilian residents.',
  pn: 'Pitcairn’s residents take guests through the island council, not a platform.',
  tk: 'Tokelau’s families take guests through the council, not a platform.',
  va: 'The Vatican has no residents who host; Rome is next door.',
};

/** Places that are simply uninhabited, so there is nowhere to stay at all. */
export const NOWHERE_TO_STAY: Readonly<Record<string, string>> = {
  aq: 'Antarctica has research stations and no hotels.',
  bv: 'Bouvet Island is uninhabited.',
  hm: 'Heard Island and McDonald Islands are uninhabited.',
  gs: 'South Georgia has a research station and a museum, and no hotel.',
  tf: 'The French Southern Territories are uninhabited but for research staff.',
  io: 'The British Indian Ocean Territory is a military base.',
  um: 'The United States Minor Outlying Islands are uninhabited.',
  pn: 'Pitcairn takes guests in islanders’ homes, arranged through the council.',
  tk: 'Tokelau has no hotel; visitors stay in family homes arranged through the council.',
};

/** The brands with a hotel in a country. */
export function chainsIn(countryId: string | undefined): HotelBrand[] {
  if (!countryId) return [];
  return (CHAINS_BY_COUNTRY[countryId] ?? []).map((id) => BRAND_BY_ID[id]).filter((x): x is HotelBrand => Boolean(x));
}

export type RoomClass = 'standard' | 'deluxe' | 'suite' | 'penthouse';

/** Which tiers a room class is sold at, nearest first. */
const TIERS_FOR: Readonly<Record<RoomClass, readonly (1 | 2 | 3 | 4)[]>> = {
  standard: [1, 2, 3], deluxe: [2, 3, 4], suite: [3, 4, 2], penthouse: [4, 3],
};

/**
 * Real brands in a country that sell the room you asked for, nearest tier
 * first. Empty when no chain there sells it, and the caller falls back to
 * one of SLATE's own hotels and says so.
 */
export function hotelBrandsFor(countryId: string | undefined, roomClass: RoomClass): HotelBrand[] {
  const here = chainsIn(countryId);
  const out: HotelBrand[] = [];
  for (const tier of TIERS_FOR[roomClass]) for (const brand of here) if (brand.tier === tier && !out.includes(brand)) out.push(brand);
  return out;
}

/** How a country is covered for somewhere to stay, for the Travel screen and the gate. */
export type StayCoverage =
  | { kind: 'chains'; brands: HotelBrand[]; airbnb: boolean }
  | { kind: 'independent'; reason: string; airbnb: boolean }
  | { kind: 'nowhere'; reason: string }
  | { kind: 'unaccounted' };

export function stayCoverageOf(countryId: string): StayCoverage {
  const nowhere = NOWHERE_TO_STAY[countryId];
  if (nowhere) return { kind: 'nowhere', reason: nowhere };
  const airbnb = !AIRBNB_UNAVAILABLE[countryId];
  const brands = chainsIn(countryId);
  if (brands.length > 0) return { kind: 'chains', brands, airbnb };
  const reason = INDEPENDENT_ONLY[countryId];
  if (reason) return { kind: 'independent', reason, airbnb };
  return { kind: 'unaccounted' };
}

export function airbnbAvailable(countryId: string | undefined): boolean {
  return Boolean(countryId) && !AIRBNB_UNAVAILABLE[countryId!] && !NOWHERE_TO_STAY[countryId!];
}

/** What the Travel screen says beside a real name. */
export const REAL_HOTEL_NOTE = 'A real hotel brand that has a hotel in this country. The property, the rate and the room are SLATE\'s own.';
export const AIRBNB_NOTE = 'Airbnb is a real platform. The listing, the host and the rate are SLATE\'s own.';
